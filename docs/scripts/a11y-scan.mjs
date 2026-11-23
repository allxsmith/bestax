#!/usr/bin/env node
/**
 * The docs site's axe pass (#2183). Every page of the built site loads in
 * headless Chromium in one color mode, and axe checks it against the WCAG
 * 2.0, 2.1 and 2.2 Level A and AA rules. A violation fails the run unless
 * `a11y-exemptions.mjs` covers it. An exemption that covers nothing is
 * reported, not failed on. The library's own stories have their axe pass in
 * Storybook (bulma-ui's `test-storybook`). It runs on macOS and Linux.
 *
 * Usage:
 *   pnpm exec turbo run build --filter=@allxsmith/bestax-docs
 *   pnpm --filter @allxsmith/bestax-docs run a11y --theme=light
 *   pnpm --filter @allxsmith/bestax-docs run a11y --theme=dark --report=axe.json
 *
 * The pages come from the build's `sitemap.xml`, served by `docusaurus
 * serve` on a free port of 127.0.0.1. `.github/workflows/docs-a11y.yml` runs
 * it after a change reaches main. If Chromium is missing, install it once:
 * pnpm --filter @allxsmith/bestax-docs exec playwright install chromium
 */
/* global document, innerHeight, requestAnimationFrame, scrollTo -- page callbacks execute in the browser */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { availableParallelism } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';
import exemptions from './a11y-exemptions.mjs';
import {
  WCAG_TAGS,
  describeFailures,
  formatTarget,
  invalidExemptions,
  judge,
  pagesFromSitemap,
  parseArgs,
  settleAnimations,
} from './a11y-scan-lib.mjs';

const DOCS = dirname(dirname(fileURLToPath(import.meta.url)));
const BUILD = join(DOCS, 'build');
/**
 * Pages checked at once, each in a tab of its own: one per core the machine
 * can give the run, up to a number the local server keeps up with.
 */
const TABS = Math.min(8, availableParallelism());
/** How long a page gets to load and hydrate. */
const PAGE_TIMEOUT_MS = 60_000;
/** How long a page's live examples get to render once mounted. */
const EXAMPLES_TIMEOUT_MS = 30_000;
/** How long a page's animations get to end before axe checks it anyway. */
const SETTLE_TIMEOUT_MS = 5_000;

/** A failure the message explains, so it prints without a stack. */
class Failure extends Error {}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

/** Starts `docusaurus serve` on the build and resolves once it answers. */
async function serve(port) {
  const child = spawn(
    'pnpm',
    [
      'exec',
      'docusaurus',
      'serve',
      '--dir',
      BUILD,
      '--port',
      String(port),
      '--host',
      '127.0.0.1',
      '--no-open',
    ],
    // In a process group of its own, so stop() reaches docusaurus and not
    // only the pnpm that started it.
    { cwd: DOCS, stdio: ['ignore', 'ignore', 'inherit'], detached: true }
  );
  const stop = () => {
    try {
      process.kill(-child.pid);
    } catch {
      // Already gone.
    }
  };
  let exited = false;
  let spawnError;
  child.on('exit', () => (exited = true));
  child.on('error', error => {
    spawnError = error;
    exited = true;
  });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 120; i++) {
    if (exited) {
      throw new Failure(
        `\`docusaurus serve\` exited before it served${spawnError ? `: ${spawnError.message}` : '.'}`
      );
    }
    try {
      if ((await fetch(`${base}/`)).ok) return { stop, base };
    } catch {
      // Not listening yet.
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  stop();
  throw new Failure('`docusaurus serve` did not answer within a minute.');
}

/**
 * Loads one page and returns axe's violations on it, and whether it was still
 * animating when axe checked it.
 */
async function check(context, base, path) {
  const page = await context.newPage();
  try {
    const response = await page.goto(base + path, {
      waitUntil: 'load',
      timeout: PAGE_TIMEOUT_MS,
    });
    // A page the server can't find comes back as the site's 404 page, which
    // would otherwise be checked in its place.
    if (!response?.ok()) {
      throw new Error(
        `The server answered ${response?.status() ?? 'nothing'}.`
      );
    }
    // Docusaurus marks the page once React has hydrated it. A page that never
    // says so is checked as it stands.
    await page
      .waitForSelector('html[data-has-hydrated="true"]', { timeout: 15_000 })
      .catch(() => {});
    // A live example mounts only once it scrolls near the viewport (the
    // CodeBlock theme's DeferredShadowPreview), and renders into a shadow
    // root, which axe reads. Scrolling down the page mounts every one that's
    // on show. One in a closed tab or a closed <details> never mounts, and
    // isn't waited for.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight) {
        scrollTo(0, y);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      scrollTo(0, 0);
    });
    await page
      .waitForFunction(
        () =>
          [...document.querySelectorAll('.live-preview-slot')]
            .filter(slot => slot.checkVisibility())
            .every(slot => {
              // ShadowLivePreview's wrapper, then react-live's own div,
              // which holds what the example renders.
              // (`:scope` matches nothing in a shadow root's querySelector,
              // so its children are searched instead.)
              const root = slot.firstElementChild?.shadowRoot;
              const preview = [...(root?.children ?? [])].find(el =>
                el.matches('div[data-theme]')
              )?.firstElementChild;
              return (preview?.childNodes.length ?? 0) > 0;
            }),
        undefined,
        { timeout: EXAMPLES_TIMEOUT_MS }
      )
      .catch(() => {
        throw new Error('Its live examples did not all render.');
      });
    // Scrolling down the page holds back what it fades in: the homepage hero
    // pauses its animations while scrolled out of view. So axe waits for the
    // fades to end, rather than taking half-faded text for hidden. Two frames
    // first, for the page to see it's back at the top and resume them.
    await page.evaluate(
      () =>
        new Promise(resolve =>
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        )
    );
    const { timedOut } = await page.evaluate(
      settleAnimations,
      SETTLE_TIMEOUT_MS
    );
    const { violations } = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();
    return {
      violations: violations.map(v => ({
        page: path,
        rule: v.id,
        help: v.help,
        targets: v.nodes.map(n => formatTarget(n.target)),
      })),
      unsettled: timedOut,
    };
  } finally {
    await page.close();
  }
}

async function main() {
  const { theme, report } = parseArgs(process.argv.slice(2));
  const invalid = invalidExemptions(exemptions);
  if (invalid.length) throw new Failure(invalid.join('\n'));
  const sitemap = join(BUILD, 'sitemap.xml');
  if (!existsSync(sitemap)) {
    throw new Failure(
      'No docs build. Run `pnpm exec turbo run build --filter=@allxsmith/bestax-docs` first.'
    );
  }
  const pages = pagesFromSitemap(readFileSync(sitemap, 'utf8'));
  const { stop, base } = await serve(await freePort());
  // The server runs in a process group of its own, which a Ctrl-C in the
  // terminal doesn't reach, so stop it on the way out.
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      stop();
      process.exit(1);
    });
  }
  let browser;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ colorScheme: theme });
    // The site keeps the reader's choice of color mode here and reads it
    // before the page paints.
    await context.addInitScript(mode => {
      localStorage.setItem('theme', mode);
    }, theme);
    // Requests to any other host are aborted. What they'd load (a font or
    // image off a CDN) isn't the build under test, and loading it would make
    // the result depend on the network.
    await context.route(
      url => new URL(url).origin !== base,
      route => route.abort()
    );
    const violations = [];
    const errors = [];
    const unsettled = [];
    let next = 0;
    async function tab() {
      while (next < pages.length) {
        const path = pages[next++];
        try {
          const result = await check(context, base, path);
          violations.push(...result.violations);
          if (result.unsettled) unsettled.push(path);
        } catch (error) {
          errors.push(`${path}: ${error.message.split('\n')[0]}`);
        }
      }
    }
    await Promise.all(Array.from({ length: TABS }, tab));
    if (report) writeFileSync(report, JSON.stringify(violations, null, 2));

    const { failing, stale } = judge(
      violations,
      exemptions,
      theme,
      errors.length > 0
    );
    console.log(
      `Checked ${pages.length} pages in ${theme} mode: ${failing.length} violations to fix, ${errors.length} pages that failed to load, ${stale.length} possibly stale exemptions.`
    );
    for (const line of describeFailures(failing)) console.log(line);
    for (const { exemption, pattern } of stale) {
      console.log(
        `Possibly stale exemption: ${exemption.rule} on ${pattern} covered nothing in ${theme} mode. If the violation it covered is gone, remove that page from its entry in a11y-exemptions.mjs; if it applies in the other mode only, limit the entry with \`themes\`.`
      );
    }
    for (const path of unsettled) {
      console.log(
        `Still fading in after ${SETTLE_TIMEOUT_MS / 1000}s: ${path}. axe checked it as it stood, so text still fading in may have been skipped.`
      );
    }
    for (const error of errors) console.log(`Failed to load ${error}`);
    if (errors.length) {
      console.log(
        'With pages that failed to load, no exemption is judged stale this run.'
      );
    }
    // A stale exemption is a warning rather than a failure: a violation that
    // depends on timing can be there one run and not the next, and a run
    // that failed on it would fail at random.
    return failing.length || errors.length ? 1 : 0;
  } finally {
    await browser?.close();
    stop();
  }
}

main().then(
  code => process.exit(code),
  error => {
    console.error(error instanceof Failure ? error.message : error);
    process.exit(1);
  }
);
