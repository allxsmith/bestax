#!/usr/bin/env node
// set-dev-port.mjs — give a scaffolded app its own dev-server port.
//
//   node bin/set-dev-port.mjs <app-dir> <port>
//
// Why this exists: builders routinely run `npm run dev -- --strictPort` to check their work,
// and the scaffold pins 5173 in `.claude/launch.json`. Two runs in parallel therefore fight
// over one port, and the loser's dev server simply fails to start — which changes what that
// builder could verify, i.e. it is a confound, not just an annoyance. Assigning a distinct
// port per concurrent run removes it.
//
// Run by run-iteration.sh BEFORE the baseline commit, so the patch is part of the baseline
// and never shows up in builder.diff or files_changed_vs_baseline.
//
// The port is not something any rubric category measures. It is the smallest possible
// deviation from a default scaffold that makes parallel runs honest.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [app, portArg] = process.argv.slice(2);
if (!app || !portArg) {
  console.error('usage: set-dev-port.mjs <app-dir> <port>');
  process.exit(1);
}
const port = Number(portArg);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error(
    `set-dev-port: port must be an integer 1024-65535 (got: ${portArg})`
  );
  process.exit(1);
}

// vite.config.ts — add a server.port. Matched on the exact scaffold shape rather than
// regex-rewriting arbitrary config: if create-bestax's template changes, this fails loudly
// instead of silently producing a config that still listens on 5173.
const viteConfig = join(app, 'vite.config.ts');
if (!existsSync(viteConfig)) {
  console.error(`set-dev-port: no vite.config.ts at ${viteConfig}`);
  process.exit(1);
}
const src = readFileSync(viteConfig, 'utf8');
const anchor = 'plugins: [react()],';
if (!src.includes(anchor)) {
  console.error(
    'set-dev-port: vite.config.ts does not match the expected scaffold shape'
  );
  console.error('  (looked for `plugins: [react()],`) — update this script');
  process.exit(1);
}
writeFileSync(
  viteConfig,
  src.replace(
    anchor,
    `${anchor}\n  server: { port: ${port}, strictPort: true },`
  )
);

// .claude/launch.json — the port Claude Code's preview uses to find the dev server. Absent
// when the app was scaffolded --no-skills, which is a normal MCP-arm configuration, so a
// missing file is not an error.
const launch = join(app, '.claude', 'launch.json');
if (existsSync(launch)) {
  const cfg = JSON.parse(readFileSync(launch, 'utf8'));
  for (const c of cfg.configurations ?? []) c.port = port;
  writeFileSync(launch, JSON.stringify(cfg, null, 2) + '\n');
}

console.log(`set-dev-port: ${app} -> :${port}`);
