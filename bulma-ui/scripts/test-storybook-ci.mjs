#!/usr/bin/env node
// Run the Storybook smoke pass (vitest.storybook.config.ts) twice: default
// (light) and dark theme (STORYBOOK_THEME=dark, see .storybook/vitest.setup.ts).
//
// `--theme=light` or `--theme=dark` runs that one pass, which is how CI gives
// each theme a runner of its own. With neither, both run, light first.
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

// Any other spelling (`--theme dark`, a bare `--theme`, two of them) fails
// rather than falling back to both passes, which would undo the CI split.
const themeArgs = process.argv
  .slice(2)
  .filter(arg => arg === '--theme' || arg.startsWith('--theme='));
const themeArg = themeArgs[0]?.slice('--theme='.length);
if (
  themeArgs.length > 1 ||
  (themeArgs.length === 1 && themeArg !== 'light' && themeArg !== 'dark')
) {
  console.error(
    `Pass the theme once, as --theme=light or --theme=dark (got ${themeArgs.join(' ')}).`
  );
  process.exit(1);
}
const themes = themeArg ? [themeArg] : ['light', 'dark'];

function runPass(theme) {
  return new Promise(done => {
    console.log(`\n=== Storybook smoke pass (${theme}) ===`);
    // Build the env explicitly both ways so an ambient STORYBOOK_THEME can't
    // silently turn the light pass into a second dark pass.
    const env = { ...process.env };
    if (theme === 'dark') env.STORYBOOK_THEME = 'dark';
    else delete env.STORYBOOK_THEME;
    const child = spawn(
      'pnpm',
      ['exec', 'vitest', 'run', '--config', 'vitest.storybook.config.ts'],
      { cwd: root, stdio: 'inherit', env }
    );
    child.on('close', code => done(code ?? 1));
    // A failed spawn (e.g. ENOENT) emits 'error' without 'close' — resolve
    // instead of hanging the CI job forever.
    child.on('error', err => {
      console.error(`Failed to start the smoke pass (${theme}):`, err);
      done(1);
    });
  });
}

// Every pass runs even after one fails, so a run reports both themes.
let failed = 0;
for (const theme of themes) {
  const code = await runPass(theme);
  failed ||= code;
}
process.exit(failed);
