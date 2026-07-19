/**
 * Dev-time corpus validation: run the react-bulma-components transform over
 * the library's OWN Storybook stories — author-written, MIT-licensed v4 JSX
 * covering every component — and score the result.
 *
 * The corpus is fetched as TEXT at a pinned commit into the gitignored
 * .e2e-tmp/ directory; it is never installed, executed, typechecked, or
 * committed (react-bulma-components must never become a dependency of this
 * repo). Deliberately NOT wired into CI — no third-party fetches in the
 * pipeline; run it locally before releases or after mapping changes:
 *
 *   pnpm --filter bestax-migrate validate:corpus
 *
 * Exit 1 on any transform crash or `unknown-component` TODO (the vendored
 * RBC surface would be incomplete). Before/after copies land in
 * .e2e-tmp/corpus-out/ for eyeball review.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_URL = 'https://github.com/couds/react-bulma-components.git';
// master as of 2026-07 (v4.1.0 era; the library is unmaintained, so this
// effectively never moves — bump deliberately if it ever does).
const PINNED_SHA = '3fc281a9823a1f7bce913873e06485b28eb43dcf';

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpusDir = path.join(packageRoot, '.e2e-tmp', 'corpus', 'react-bulma-components');
const outDir = path.join(packageRoot, '.e2e-tmp', 'corpus-out');
const distTransform = path.join(
  packageRoot,
  'dist',
  'sources',
  'react-bulma-components',
  'transform.js'
);
const distRunner = path.join(packageRoot, 'dist', 'runner.js');

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

if (!fs.existsSync(distTransform)) {
  fail('dist/ not built — run `pnpm --filter bestax-migrate build` first');
}

// ---- fetch the corpus (text only) at the pinned commit --------------------
if (!fs.existsSync(path.join(corpusDir, 'src'))) {
  console.log(`Fetching react-bulma-components @ ${PINNED_SHA.slice(0, 12)} (text corpus)…`);
  fs.rmSync(corpusDir, { recursive: true, force: true });
  fs.mkdirSync(corpusDir, { recursive: true });
  const run = (args) => {
    const result = spawnSync('git', args, { cwd: corpusDir, encoding: 'utf8' });
    if (result.status !== 0) fail(`git ${args.join(' ')}: ${result.stderr}`);
  };
  run(['init', '-q']);
  run(['remote', 'add', 'origin', REPO_URL]);
  run(['fetch', '-q', '--depth', '1', 'origin', PINNED_SHA]);
  run(['checkout', '-q', 'FETCH_HEAD']);
}

// ---- collect + preprocess story files -------------------------------------
const storyFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (entry.endsWith('.story.js')) storyFiles.push(full);
  }
})(path.join(corpusDir, 'src', 'components'));

if (storyFiles.length === 0) fail('no story files found in the corpus');

const { default: transform } = await import(distTransform);
const { runTransform } = await import(distRunner);

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

let transformed = 0;
const crashes = [];
const todosByRule = new Map();
const unknownComponents = [];

for (const file of storyFiles) {
  const rel = path.relative(path.join(corpusDir, 'src', 'components'), file);
  const name = rel.replace(/[\\/]/g, '__');
  // Stories import from the package root via relative paths (and a few from
  // their own component dir as a default import); rewrite both to the named
  // package-import form real consumer code uses.
  const source = fs
    .readFileSync(file, 'utf8')
    .replace(/from '(\.\.\/)*\.\.(\/index)?'/g, "from 'react-bulma-components'")
    .replace(/from "(\.\.\/)*\.\.(\/index)?"/g, 'from "react-bulma-components"')
    .replace(
      /import (\w+) from '\.(?:\/[\w-]+)?';/g,
      "import { $1 } from 'react-bulma-components';"
    );

  const todos = [];
  let output = null;
  try {
    output = runTransform(transform, rel, source, {
      add: (entry) => todos.push(entry),
    }).output;
  } catch (error) {
    crashes.push({ rel, message: error.message });
    continue;
  }
  if (output !== null) transformed += 1;
  fs.writeFileSync(path.join(outDir, `${name}.before.jsx`), source);
  fs.writeFileSync(path.join(outDir, `${name}.after.jsx`), output ?? source);
  for (const todo of todos) {
    todosByRule.set(todo.rule, (todosByRule.get(todo.rule) ?? 0) + 1);
    if (todo.rule === 'unknown-component') {
      unknownComponents.push(`${rel}:${todo.line} ${todo.message}`);
    }
  }
}

// ---- scorecard -------------------------------------------------------------
console.log('\nbestax-migrate corpus validation — react-bulma-components stories');
console.log(`  files:       ${storyFiles.length}`);
console.log(`  transformed: ${transformed}`);
console.log(`  crashes:     ${crashes.length}`);
const rules = [...todosByRule.entries()].sort((a, b) => b[1] - a[1]);
console.log(`  TODOs:       ${rules.reduce((sum, [, count]) => sum + count, 0)}`);
for (const [rule, count] of rules) {
  console.log(`    ${rule}: ${count}`);
}
console.log(`  review dir:  ${path.relative(packageRoot, outDir)}`);

for (const crash of crashes) {
  console.error(`  ✖ crash in ${crash.rel}: ${crash.message}`);
}
for (const unknown of unknownComponents) {
  console.error(`  ✖ unknown component: ${unknown}`);
}

if (crashes.length > 0 || unknownComponents.length > 0) {
  fail('corpus validation found defects (see above)');
}
console.log('\n✓ corpus validation passed');
