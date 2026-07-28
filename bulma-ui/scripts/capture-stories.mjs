#!/usr/bin/env node
// Screenshot the Storybook stories affected by a set of changed files, once
// light and once dark (#284). Used by story-screenshots.yml at ai-loop
// handoff so the human reviewer gets pictures, not just text. Maps changed
// files to story IDs via storybook-static/index.json (importPath for a
// changed *.stories.tsx, componentPath for a changed component, basename
// heuristic for scss), serves the built storybook the same way
// test-storybook-ci.mjs does, and drives Playwright Chromium directly.
//
// Usage:
//   node scripts/capture-stories.mjs --changed-files <list.txt> --out <dir> [--max N]
//
// <list.txt> is newline-delimited repo-relative paths (e.g. from
// `gh pr diff --name-only`). Output: <dir>/light/<id>.png,
// <dir>/dark/<id>.png and <dir>/manifest.json. Exits non-zero only when
// nothing could be captured at all (browser launch failure or every story
// failed) — an individual broken story is recorded in the manifest and
// screenshotted anyway: the error display itself is reviewer signal.
/* global document -- page.evaluate() callbacks execute in the browser */
import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const staticDir = join(root, 'storybook-static');

// ---- CLI ----
const args = process.argv.slice(2);
function argValue(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}
const changedFilesPath = argValue('--changed-files');
const outDir = argValue('--out');
const maxStories = Number(argValue('--max') ?? process.env.MAX_STORIES ?? 24);
const maxPerFile = 6; // one stories file can own 20+ stories; keep variety
if (!changedFilesPath || !outDir || !Number.isInteger(maxStories)) {
  console.error(
    'Usage: capture-stories.mjs --changed-files <list.txt> --out <dir> [--max N]'
  );
  process.exit(1);
}

try {
  await stat(join(staticDir, 'index.html'));
} catch {
  console.error(
    'storybook-static/index.html not found — run `pnpm build-storybook` first.'
  );
  process.exit(1);
}

// ---- Map changed files -> story entries ----
const index = JSON.parse(await readFile(join(staticDir, 'index.json'), 'utf8'));
// v4+ has the flat `entries` map; importPath/componentPath are "./src/..."
// (verified v: 5). Fail loudly on drift rather than silently matching nothing.
if (!(index.v >= 4) || typeof index.entries !== 'object') {
  console.error(`Unsupported storybook index.json shape (v: ${index.v}).`);
  process.exit(1);
}

const changedRaw = (await readFile(changedFilesPath, 'utf8'))
  .split('\n')
  .map(l => l.trim())
  .filter(Boolean);
// Repo-relative "bulma-ui/src/x" -> index.json's "./src/x"
const changed = new Set(
  changedRaw
    .filter(f => f.startsWith('bulma-ui/src/'))
    .map(f => './' + f.slice('bulma-ui/'.length))
);
// "src/scss/components/_carousel.scss" -> "carousel" (matches
// Carousel.stories.tsx by basename, case-insensitive)
const scssNames = new Set(
  [...changed]
    .filter(f => f.endsWith('.scss'))
    .map(f =>
      basename(f)
        .replace(/^_/, '')
        .replace(/\.scss$/, '')
        .toLowerCase()
    )
);

const storyFileBase = p => basename(p).replace(/\.stories\.\w+$/, '');
const matched = Object.values(index.entries).filter(
  e =>
    e.type === 'story' &&
    (changed.has(e.importPath) ||
      (e.componentPath && changed.has(e.componentPath)) ||
      scssNames.has(storyFileBase(e.importPath).toLowerCase()))
);

// Screenshot filenames and URLs are built from the id downstream — refuse
// anything outside Storybook's kebab-case alphabet rather than escaping it.
const SAFE_ID = /^[a-z0-9][a-z0-9_-]*$/;
const unsafe = matched.filter(e => !SAFE_ID.test(e.id));
for (const e of unsafe) console.warn(`Skipping unsafe story id: ${e.id}`);

// Caps: per stories-file first (keep variety across files), then total.
const perFileCount = new Map();
const selected = [];
const skipped = [];
for (const e of matched.filter(e => SAFE_ID.test(e.id))) {
  const file = e.importPath;
  const n = perFileCount.get(file) ?? 0;
  if (n >= maxPerFile || selected.length >= maxStories) {
    skipped.push(e.id);
    continue;
  }
  perFileCount.set(file, n + 1);
  selected.push(e);
}
console.log(
  `Matched ${matched.length} stories from ${changed.size} changed src files; capturing ${selected.length} (caps: ${maxPerFile}/file, ${maxStories} total).`
);

await mkdir(join(outDir, 'light'), { recursive: true });
await mkdir(join(outDir, 'dark'), { recursive: true });
const manifest = {
  totalMatched: matched.length,
  changedSrcFiles: [...changed],
  skipped,
  stories: [],
};

if (selected.length === 0) {
  await writeFile(
    join(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('No stories to capture — wrote empty manifest.');
  process.exit(0);
}

// ---- Serve storybook-static (same server as test-storybook-ci.mjs) ----
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
  '.txt': 'text/plain',
};

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  // normalize() collapses any ../ so requests can't escape staticDir
  let filePath = join(staticDir, normalize(urlPath).replace(/^([/\\])+/, ''));
  try {
    if ((await stat(filePath)).isDirectory()) {
      filePath = join(filePath, 'index.html');
    }
    const body = await readFile(filePath);
    res.writeHead(200, {
      'content-type': MIME[extname(filePath)] ?? 'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const url = `http://127.0.0.1:${server.address().port}`;
console.log(`Serving ${staticDir} at ${url}`);

// ---- Capture ----
let browser;
try {
  browser = await chromium.launch();
} catch (err) {
  console.error('Failed to launch Chromium:', err);
  server.close();
  process.exit(1);
}

const page = await browser.newPage({
  viewport: { width: 900, height: 700 },
  deviceScaleFactor: 1,
});

// Render the story fresh under the given color scheme and screenshot it.
// A fresh goto per theme (not an in-place toggle) so each shot is a clean
// mount — a live toggle leaves mid-transition colors and mount-time state
// from the other theme in the picture. Dark needs BOTH the emulated
// prefers-color-scheme and the data-theme attribute: the preview loads
// bulma.min.css then bulma-prefixed.min.css, and the prefixed file's
// media-scoped light `:root` block outranks (later in cascade, equal
// specificity) the first file's `[data-theme=dark]` block, so the
// attribute alone changes nothing — but it stays stamped for anything
// keyed on Bulma's explicit theme hook.
async function shoot(id, theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.goto(
    `${url}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`,
    { waitUntil: 'load', timeout: 30000 }
  );
  if (theme === 'dark') {
    await page.evaluate(() =>
      document.documentElement.setAttribute('data-theme', 'dark')
    );
  }
  // Rendered content or Storybook's own error display — either is worth
  // a picture; only a hang counts as failed.
  await page.waitForSelector('#storybook-root > *, body.sb-show-errordisplay', {
    timeout: 15000,
  });
  const errored = await page.evaluate(() =>
    document.body.classList.contains('sb-show-errordisplay')
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250); // let CSS transitions settle
  await page.screenshot({
    path: join(outDir, theme, `${id}.png`),
    fullPage: true,
  });
  return errored;
}

for (const entry of selected) {
  const { id, title, name, importPath } = entry;
  const record = { id, title, name, importPath, status: 'ok' };
  try {
    const erroredLight = await shoot(id, 'light');
    const erroredDark = await shoot(id, 'dark');
    if (erroredLight || erroredDark) record.status = 'error';
    console.log(`${record.status === 'ok' ? '✓' : '⚠'} ${id}`);
  } catch (err) {
    record.status = 'failed';
    console.warn(`✗ ${id}: ${err.message ?? err}`);
  }
  manifest.stories.push(record);
}

await browser.close();
server.close();

await writeFile(
  join(outDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
const failed = manifest.stories.filter(s => s.status === 'failed').length;
console.log(
  `Captured ${manifest.stories.length - failed}/${manifest.stories.length} stories (light + dark).`
);
// All-failed means the storybook build or server is broken — surface it.
process.exit(failed === manifest.stories.length ? 1 : 0);
