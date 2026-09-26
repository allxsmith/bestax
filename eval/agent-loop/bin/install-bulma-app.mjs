#!/usr/bin/env node
// install-bulma-app.mjs — post-scaffold hook for run-iteration.sh: turn the scaffolded app
// into the raw-Bulma app the migration brief asks the builder to move onto bestax.
//
//   bin/run-iteration.sh mg01 briefs/bulma-migrate.md /tmp/migrate-mg01 \
//     --runs-dir eval/agent-loop/runs-migrate --rubric eval/agent-loop/rubric-migrate.md \
//     --post-scaffold eval/agent-loop/bin/install-bulma-app.mjs
//
// It runs before the baseline commit, like every hook, so the fixture IS the baseline:
// builder.diff is the migration and nothing else, and the collector's `baseline` metrics
// measure the fixture as it was handed over.
//
// Two things, in order:
//   1. Replace the scaffold's src/ with fixtures/bulma-app/src/. The scaffold's own src is
//      a bestax showcase, so leaving any of it would hand the builder converted code.
//   2. Add `bulma` itself, at the range the library depends on. The fixture imports
//      Bulma's stylesheet the way a raw-Bulma app does, and pnpm does not expose the
//      library's own `bulma` to the app, so without this the baseline does not build.
//
// Fails loudly rather than handing over a half-built app, and also refuses when the ESLint
// plugin is not built: the collector counts `bulma_component_classes` with its
// no-bulma-component-class rule, and a migration run whose headline number reads null
// cannot be graded.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HARNESS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..'); // eval/agent-loop
const REPO = resolve(HARNESS_DIR, '..', '..');
const FIXTURE_SRC = join(HARNESS_DIR, 'fixtures', 'bulma-app', 'src');
const PLUGIN = join(REPO, 'eslint-plugin', 'dist', 'index.js');

const app = process.argv[2];
if (!app) {
  console.error('usage: install-bulma-app.mjs <app-dir>');
  process.exit(1);
}
for (const [what, path, fix] of [
  ['app dir', app, 'pass the scaffolded app'],
  ['fixture', FIXTURE_SRC, 'check out the fixture'],
  [
    'ESLint plugin build',
    PLUGIN,
    'run `pnpm --filter @allxsmith/eslint-plugin-bestax build` first',
  ],
]) {
  if (!existsSync(path)) {
    console.error(`install-bulma-app: missing ${what}: ${path}`);
    console.error(`install-bulma-app: ${fix}`);
    process.exit(1);
  }
}

const bulmaRange = JSON.parse(
  readFileSync(join(REPO, 'bulma-ui', 'package.json'), 'utf8')
).dependencies?.bulma;
if (!bulmaRange) {
  console.error(
    'install-bulma-app: bulma-ui/package.json declares no `bulma` dependency to match'
  );
  process.exit(1);
}

const src = join(app, 'src');
rmSync(src, { recursive: true, force: true });
cpSync(FIXTURE_SRC, src, { recursive: true });

const add = spawnSync('pnpm', ['add', `bulma@${bulmaRange}`], {
  cwd: app,
  encoding: 'utf8',
});
if (add.status !== 0) {
  console.error(`install-bulma-app: pnpm add bulma@${bulmaRange} failed`);
  console.error(`${add.stdout ?? ''}${add.stderr ?? ''}`);
  process.exit(1);
}
console.log(
  `install-bulma-app: src/ <- ${FIXTURE_SRC}; added bulma@${bulmaRange}`
);
