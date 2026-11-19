import { fileURLToPath } from 'node:url';
import { format } from 'node:util';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import type { ConsoleMessage } from 'playwright';
import type { BrowserCommand } from 'vitest/node';
import { defineConfig } from 'vitest/config';

// The Storybook smoke pass (#283), `pnpm test-storybook`: every story renders
// in Chromium and runs its `play` function, and fails if the browser logged an
// error while it did. STORYBOOK_THEME=dark runs the same pass in the dark
// theme. What the pass checks beyond the render is in `.storybook/vitest.setup.ts`.
const theme = process.env.STORYBOOK_THEME === 'dark' ? 'dark' : 'light';

/**
 * A story that demos a broken-image fallback loads from an RFC 2606 `.invalid`
 * host (Avatar's https://example.invalid/missing.jpg), and that load failing
 * is the story working as intended.
 */
const INVALID_HOST = /^https?:\/\/[^/]*\.invalid(\/|$)/;

/**
 * Storybook's test integration runs each user event inside a React `act` that
 * it does not await, and React says so whenever that leaves work queued. The
 * warning is about the harness rather than the story, and outside a test
 * there is no `act` to give it.
 */
const UNAWAITED_ACT = /^A component suspended inside an `act` scope/;

/** A console message as the browser would print it, and where it came from. */
async function describe(msg: ConsoleMessage) {
  let text: string;
  try {
    text = format(...(await Promise.all(msg.args().map(a => a.jsonValue()))));
  } catch {
    text = msg.text();
  }
  // A console call's location is Vitest's console wrapper, which says
  // nothing; a failed load's is the resource that failed.
  const url = msg.location()?.url ?? '';
  return url && !url.includes('/__vitest_browser__/')
    ? `${text} (${url})`
    : text;
}

// One error sink per Playwright page. Each story file runs in a page of its
// own, which keeps it for every story in the file, so the listener goes on
// once and each read empties the sink.
const sinks = new WeakMap<object, Promise<string>[]>();

/** The errors the browser logged since the last call. */
const takeConsoleErrors: BrowserCommand<[]> = async ({ page, frame }) => {
  let sink = sinks.get(page);
  if (!sink) {
    const fresh: Promise<string>[] = [];
    sink = fresh;
    sinks.set(page, fresh);
    page.on('console', msg => {
      if (msg.type() !== 'error') return;
      if (INVALID_HOST.test(msg.location()?.url ?? '')) return;
      if (UNAWAITED_ACT.test(msg.text())) return;
      fresh.push(describe(msg));
    });
  }
  // The page's console messages and this call reach here by different
  // routes, so one logged just before it could still be on its way. A round
  // trip to the story's frame comes back after everything it logged.
  await (await frame()).evaluate(() => undefined);
  return Promise.all(sink.splice(0));
};

export default defineConfig({
  plugins: [
    storybookTest({
      configDir: fileURLToPath(new URL('./.storybook', import.meta.url)),
    }),
  ],
  test: {
    name: 'storybook',
    provide: { storybookTheme: theme },
    setupFiles: ['./.storybook/vitest.setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ contextOptions: { colorScheme: theme } }),
      instances: [{ browser: 'chromium' }],
      commands: { takeConsoleErrors },
    },
  },
});
