#!/usr/bin/env node
/**
 * The docs site's axe pass (#2183). Every page of the built site loads in
 * headless Chromium in one color mode, and axe checks it against the WCAG
 * 2.0, 2.1 and 2.2 Level A and AA rules. A violation fails the run unless
 * `a11y-exemptions.mjs` covers it, and an exemption that covers nothing fails
 * it too. The library's own stories have their axe pass in Storybook
 * (bulma-ui's `test-storybook`).
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
/* global document, innerHeight, scrollTo -- page callbacks execute in the browser */
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
  invalidExemptions,
  judge,
  pagesFromSitemap,
  parseArgs,
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
    { cwd: DOCS, stdio: ['ignore', 'ignore', 'inherit'] }
  );
  let exited = false;
  child.on('exit', () => (exited = true));
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 120; i++) {
    if (exited)
      throw new Failure('`docusaurus serve` exited before it served.');
    try {
      if ((await fetch(`${base}/`)).ok) return { child, base };
    } catch {
      // Not listening yet.
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  child.kill();
  throw new Failure('`docusaurus serve` did not answer within a minute.');
}

/** Loads one page and returns axe's violations on it. */
async function check(context, base, path) {
  const page = await context.newPage();
  try {
    await page.goto(base + path, {
      waitUntil: 'load',
      timeout: PAGE_TIMEOUT_MS,
    });
    // Docusaurus marks the page once React has hydrated it. A page that never
    // says so is checked as it stands.
    await page
      .waitForSelector('html[data-has-hydrated="true"]', { timeout: 15_000 })
      .catch(() => {});
    // A live example mounts only once it scrolls near the viewport (the
    // CodeBlock theme's DeferredShadowPreview), and renders into a shadow
    // root, which axe reads. Scrolling down the page mounts them all.
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
          [...document.querySelectorAll('.live-preview-slot')].every(
            slot => slot.firstElementChild?.shadowRoot?.childElementCount > 0
          ),
        undefined,
        { timeout: EXAMPLES_TIMEOUT_MS }
      )
      .catch(() => {
        throw new Error('Its live examples did not all render.');
      });
    const { violations } = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();
    return violations.map(v => ({
      page: path,
      rule: v.id,
      help: v.help,
      targets: v.nodes.map(n => n.target.join(' ')),
    }));
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
  const { child, base } = await serve(await freePort());
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ colorScheme: theme });
    // The site keeps the reader's choice of color mode here and reads it
    // before the page paints.
    await context.addInitScript(mode => {
      localStorage.setItem('theme', mode);
    }, theme);
    // Only the site itself loads. Anything from another host (a YouTube
    // player in an example, a font or image off a CDN) is someone else's
    // markup, and loading it would make the result depend on the network.
    await context.route(
      url => new URL(url).origin !== base,
      route => route.abort()
    );
    const violations = [];
    const errors = [];
    let next = 0;
    async function tab() {
      while (next < pages.length) {
        const path = pages[next++];
        try {
          violations.push(...(await check(context, base, path)));
        } catch (error) {
          errors.push(`${path}: ${error.message.split('\n')[0]}`);
        }
      }
    }
    await Promise.all(Array.from({ length: TABS }, tab));
    if (report) writeFileSync(report, JSON.stringify(violations, null, 2));

    const { failing, stale } = judge(violations, exemptions, theme);
    console.log(
      `Checked ${pages.length} pages in ${theme} mode: ${failing.length} violations to fix, ${stale.length} stale exemptions, ${errors.length} pages that failed to load.`
    );
    for (const line of describeFailures(failing)) console.log(line);
    for (const e of stale) {
      console.log(
        `Stale exemption: ${e.rule} on ${e.pages.join(', ')} covered nothing in ${theme} mode. Remove it from a11y-exemptions.mjs.`
      );
    }
    for (const error of errors) console.log(`Failed to load ${error}`);
    return failing.length || stale.length || errors.length ? 1 : 0;
  } finally {
    await browser.close();
    child.kill();
  }
}

main().then(
  code => process.exit(code),
  error => {
    console.error(error instanceof Failure ? error.message : error);
    process.exit(1);
  }
);
