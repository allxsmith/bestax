/**
 * Dev-time corpus validation for the bulma-classes source: run the transform
 * over real JSX that mixes bestax components with raw Bulma classes, and
 * score the result.
 *
 * The corpus is this repo's own Storybook stories (`bulma-ui/src/**`), which
 * demonstrate components next to plain Bulma markup: a trigger `button`, a
 * `box` around an example, helper classes on a wrapper. Nothing is fetched,
 * so unlike the library sources' corpora this one needs no pinned SHA; point
 * it at another app's source with `--dir <path>` to exercise that instead.
 *
 * Deliberately NOT wired into CI; run it after class-map changes:
 *
 *   pnpm --filter bestax-migrate validate:corpus:bulma-classes
 *   pnpm --filter bestax-migrate validate:corpus:bulma-classes --dir ../../my-app/src
 *
 * Exit 1 on any transform crash, or on an output that no longer parses.
 * Before/after copies land in .e2e-tmp/corpus-out-bulma-classes/ for review.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const { runTransform } = await import(
  path.join(packageRoot, 'dist', 'runner.js')
);
const { bulmaClasses } = await import(
  path.join(packageRoot, 'dist', 'sources', 'bulma-classes', 'index.js')
);

const dirFlag = process.argv.indexOf('--dir');
const corpusRoot =
  dirFlag === -1
    ? path.join(packageRoot, '..', 'bulma-ui', 'src')
    : path.resolve(process.argv[dirFlag + 1]);
const pattern = dirFlag === -1 ? /\.stories\.tsx$/ : /\.[jt]sx$/;
const outDir = path.join(packageRoot, '.e2e-tmp', 'corpus-out-bulma-classes');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' ? [] : walk(full);
    }
    return pattern.test(entry.name) ? [full] : [];
  });
}

fs.rmSync(outDir, { recursive: true, force: true });
const files = walk(corpusRoot);
const rules = new Map();
let changed = 0;
let converted = 0;
const failures = [];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const todos = [];
  let output;
  try {
    ({ output } = runTransform(
      bulmaClasses.transform,
      file,
      source,
      { add: todo => todos.push(todo) },
      { cssMode: 'keep' }
    ));
    if (output !== null) {
      // The output must still parse, or the migration broke the file.
      runTransform(bulmaClasses.transform, file, output);
    }
  } catch (error) {
    failures.push(`${path.relative(corpusRoot, file)}: ${error.message}`);
    continue;
  }
  for (const todo of todos)
    rules.set(todo.rule, (rules.get(todo.rule) ?? 0) + 1);
  if (output === null) continue;
  changed += 1;
  const before = (source.match(/className=/g) ?? []).length;
  const after = (output.match(/className=/g) ?? []).length;
  converted += Math.max(0, before - after);
  const rel = path.relative(corpusRoot, file);
  for (const [suffix, text] of [
    ['before', source],
    ['after', output],
  ]) {
    const target = path.join(outDir, `${rel}.${suffix}.tsx`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  }
}

console.log(`bulma-classes corpus: ${files.length} files under ${corpusRoot}`);
console.log(
  `  changed ${changed}, with ${converted} fewer className attributes`
);
for (const [rule, count] of [...rules].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(4)}  ${rule}`);
}
if (changed > 0) console.log(`  before/after copies: ${outDir}`);
if (failures.length > 0) {
  console.error(`\n${failures.length} file(s) failed:`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
