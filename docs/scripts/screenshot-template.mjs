#!/usr/bin/env node
/**
 * Capture a ported template for its card on the docs Templates page.
 *
 * Builds `templates/<slug>` the way StackBlitz will, from the folder alone,
 * serves the build with `vite preview`, and screenshots it at 1280x800 with
 * headless Chromium into `static/img/templates/<slug>.jpg`. These are our
 * captures of the bestax port, never the upstream's preview images.
 *
 * Usage:
 *   pnpm --filter @allxsmith/bestax-docs screenshot:template <slug>
 *   node docs/scripts/screenshot-template.mjs <slug>
 *
 * The files git tracks in the folder are copied to a temporary directory
 * first: the same files the checks read and the mirror publishes
 * (`templatePaths` in scripts/lib/templates.mjs), so an image not yet added
 * shows up missing here too. The install and build then leave nothing in
 * the repo: no node_modules, no dist and no lockfile. It installs the way the
 * create-bestax e2e installs a scaffold, `pnpm install --ignore-workspace`,
 * under pnpm's own defaults rather than the monorepo's settings.
 *
 * The preview binds a free port on 127.0.0.1, never 3000. A manual step:
 * nothing in CI runs it, since it needs the network and a browser. If
 * Chromium is missing, install it once:
 *   pnpm --filter @allxsmith/bestax-docs exec playwright install chromium
 */
/* global document -- page.evaluate() callbacks execute in the browser */
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  templatePaths,
  trackedTemplates,
} from '../../scripts/lib/templates.mjs';

const DOCS = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(DOCS);
const VIEWPORT = { width: 1280, height: 800 };
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A failure the message explains, so it prints without a stack. */
class Failure extends Error {}

// Throws rather than exiting, so the cleanup in main() still runs.
function fail(message) {
  throw new Failure(message);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) {
    fail(`\`${command} ${args.join(' ')}\` failed in ${cwd}`);
  }
}

/** A free TCP port on 127.0.0.1, other than 3000. */
function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() =>
        port === 3000 ? freePort().then(resolve, reject) : resolve(port)
      );
    });
  });
}

async function waitFor(url, preview) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (preview.exitCode !== null) fail('vite preview exited before serving');
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not listening yet
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  fail(`vite preview did not answer at ${url}`);
}

async function main() {
  const slug = process.argv[2];
  if (!slug || !SLUG.test(slug)) {
    fail('usage: screenshot-template.mjs <slug>, a folder under templates/');
  }
  const source = join(REPO, 'templates', slug);
  const files = templatePaths(trackedTemplates(REPO)).files.filter(file =>
    file.path.startsWith(`${slug}/`)
  );
  if (!files.some(file => file.path === `${slug}/package.json`)) {
    fail(
      `git tracks no package.json under ${relative(REPO, source)}; ` +
        '`git add` the template first'
    );
  }
  const out = join(DOCS, 'static', 'img', 'templates', `${slug}.jpg`);

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    fail(
      'playwright is not installed. Run `pnpm install`; it is a ' +
        'devDependency of @allxsmith/bestax-docs.'
    );
  }

  const work = mkdtempSync(join(tmpdir(), `template-${slug}-`));
  let preview;
  let browser;
  try {
    for (const file of files) {
      const target = join(work, file.path.slice(slug.length + 1));
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(join(REPO, file.source), target);
    }
    run('pnpm', ['install', '--ignore-workspace'], work);
    run('pnpm', ['--ignore-workspace', 'run', 'build'], work);

    const port = await freePort();
    const url = `http://127.0.0.1:${port}/`;
    preview = spawn(
      join(work, 'node_modules', '.bin', 'vite'),
      [
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        String(port),
        '--strictPort',
      ],
      { cwd: work, stdio: 'ignore' }
    );
    await waitFor(url, preview);

    try {
      browser = await chromium.launch();
    } catch (err) {
      fail(
        `could not launch Chromium (${err?.message ?? err}). Install it ` +
          'once with:\n' +
          '  pnpm --filter @allxsmith/bestax-docs exec playwright install chromium'
      );
    }
    const page = await browser.newPage({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    mkdirSync(dirname(out), { recursive: true });
    await page.screenshot({ path: out, type: 'jpeg', quality: 80 });
    console.log(`screenshot-template: wrote ${relative(REPO, out)}`);
  } finally {
    await browser?.close();
    preview?.kill();
    rmSync(work, { recursive: true, force: true });
  }
}

main().catch(err => {
  console.error(
    err instanceof Failure ? `screenshot-template: ${err.message}` : err
  );
  process.exit(1);
});
