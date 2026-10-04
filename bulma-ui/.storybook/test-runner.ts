import type { TestRunnerConfig } from '@storybook/test-runner';
import type { Page } from 'playwright';

// Smoke-pass hooks for `test-storybook` (#283): every story must render
// without throwing and without console errors. Run with
// STORYBOOK_THEME=dark for a second pass with the root stamped dark.
// Dark-mode-only CSS bugs are invisible to jsdom, so this is the only
// automated surface that can catch them.
//
// The stamp sets both builds' theme attributes. The preview loads
// bulma.min.css and then bulma-prefixed.min.css, and the prefixed sheet
// redeclares the light scheme on `:root` after the plain sheet's
// `[data-theme=dark]` block. Its own dark block keys off
// `[data-bulma-theme=dark]`, so with `data-theme` alone the scheme stays
// light for every story, plain or prefixed.
const dark = process.env.STORYBOOK_THEME === 'dark';

// One error sink per Playwright page; pages are reused across stories in a
// worker, so the sink is emptied in preVisit instead of re-registering
// listeners.
const consoleErrors = new WeakMap<Page, string[]>();

const config: TestRunnerConfig = {
  async preVisit(page) {
    if (dark) {
      await page.evaluate(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', 'dark');
        root.setAttribute('data-bulma-theme', 'dark');
      });
    }
    const sink = consoleErrors.get(page);
    if (sink) {
      sink.length = 0;
    } else {
      const fresh: string[] = [];
      consoleErrors.set(page, fresh);
      page.on('console', msg => {
        if (msg.type() !== 'error') return;
        const url = msg.location()?.url ?? '';
        // Stories that demo broken-image fallbacks use RFC 2606 `.invalid`
        // hosts (e.g. Avatar's https://example.invalid/missing.jpg) — those
        // resource errors are the story working as intended.
        if (/^https?:\/\/[^/]*\.invalid(\/|$)/.test(url)) return;
        fresh.push(url ? `${msg.text()} (${url})` : msg.text());
      });
      page.on('pageerror', err => fresh.push(String(err)));
    }
  },

  async postVisit(page, context) {
    const errors = consoleErrors.get(page) ?? [];
    if (errors.length > 0) {
      throw new Error(
        `Story ${context.id} logged console errors${dark ? ' (dark theme)' : ''}:\n` +
          errors.map(e => `  - ${e}`).join('\n')
      );
    }
  },
};

export default config;
