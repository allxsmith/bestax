#!/usr/bin/env node
// install-mcp.mjs — post-scaffold hook for run-iteration.sh: point the scaffolded app at
// this repo's LOCAL bestax-mcp build.
//
//   bin/run-iteration.sh <id> <brief> <work> --post-scaffold "node eval/skill-loop/bin/install-mcp.mjs"
//
// The eval measures the server as it stands in the working tree, not whatever `npx
// bestax-mcp` would fetch from the registry — so the command is `node <repo>/bestax-mcp/
// dist/index.js` with an absolute path (the app is scaffolded outside the repo by design).
//
// Fails loudly if dist/ or data/ is missing rather than writing config for a server that
// cannot start: a builder whose MCP tools silently never appear looks exactly like a
// builder that chose not to use them, and that is the one thing this run must distinguish.
import { existsSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HARNESS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..'); // eval/skill-loop
const REPO = resolve(HARNESS_DIR, '..', '..');
const SERVER = join(REPO, 'bestax-mcp', 'dist', 'index.js');
const CATALOG = join(REPO, 'bestax-mcp', 'data', 'catalog.json');
const SKILLS = join(REPO, 'bestax-mcp', 'data', 'skills.json');

const app = process.argv[2];
if (!app) {
  console.error('usage: install-mcp.mjs <app-dir>');
  process.exit(1);
}
if (!existsSync(app)) {
  console.error(`install-mcp: app dir does not exist: ${app}`);
  process.exit(1);
}
for (const [what, path] of [
  ['server build', SERVER],
  ['component index', CATALOG],
  // Generated at build time from skills/ by bestax-mcp/scripts/sync-skills.mjs — absent in
  // a tree that was never built, and its absence is invisible until a tool call returns
  // nothing.
  ['skills index', SKILLS],
]) {
  if (!existsSync(path)) {
    console.error(`install-mcp: missing ${what}: ${path}`);
    console.error('install-mcp: run `pnpm --filter bestax-mcp build` first');
    process.exit(1);
  }
}

const config = {
  mcpServers: {
    bestax: { command: process.execPath, args: [SERVER] },
  },
};
const out = join(app, '.mcp.json');
writeFileSync(out, JSON.stringify(config, null, 2) + '\n');
console.log(`install-mcp: wrote ${out} -> ${SERVER}`);
