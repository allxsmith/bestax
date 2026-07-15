#!/usr/bin/env node
// Serve the built storybook (storybook-static/) on a local port and run the
// test-runner smoke pass against it twice: default (light) and dark theme
// (STORYBOOK_THEME=dark, see .storybook/test-runner.ts). Uses node's http
// module rather than adding http-server/wait-on/concurrently dependencies.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const staticDir = join(root, 'storybook-static');

try {
  await stat(join(staticDir, 'index.html'));
} catch {
  console.error(
    'storybook-static/index.html not found — run `pnpm build-storybook` first.'
  );
  process.exit(1);
}

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

function runPass(theme) {
  return new Promise(done => {
    const label = theme === 'dark' ? 'dark' : 'light';
    console.log(`\n=== Storybook smoke pass (${label}) ===`);
    // Build the env explicitly both ways so an ambient STORYBOOK_THEME can't
    // silently turn the light pass into a second dark pass.
    const env = { ...process.env };
    if (theme === 'dark') env.STORYBOOK_THEME = 'dark';
    else delete env.STORYBOOK_THEME;
    const child = spawn(
      'pnpm',
      ['exec', 'test-storybook', '--url', url, '--maxWorkers', '50%'],
      { cwd: root, stdio: 'inherit', env }
    );
    child.on('close', code => done(code ?? 1));
  });
}

const lightCode = await runPass('light');
const darkCode = await runPass('dark');
server.close();
process.exit(lightCode || darkCode);
