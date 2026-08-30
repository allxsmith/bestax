/**
 * Dev-time corpus validation: run the rbx transform over the library's OWN
 * documentation examples — author-written, MIT-licensed JSX covering every
 * component — and score the result.
 *
 * rbx's docs are docz, not Storybook: each `*.docs.mdx` page embeds its
 * examples in `<Playground>` blocks. At the pinned SHA there are 43 such
 * pages carrying 256 blocks, which is the closest thing to a real-world rbx
 * corpus that exists under a licence we can use.
 *
 * The corpus is fetched as TEXT at a pinned commit into the gitignored
 * .e2e-tmp/ directory; it is never installed, executed, typechecked, or
 * committed (rbx must never become a dependency of this repo). Deliberately
 * NOT wired into CI — no third-party fetches in the pipeline; run it locally
 * before releases or after mapping changes:
 *
 *   pnpm --filter bestax-migrate validate:corpus:rbx
 *
 * Exit 1 on any transform crash or `unknown-component` TODO (the vendored rbx
 * surface would be incomplete). Before/after copies land in
 * .e2e-tmp/corpus-out-rbx/ for eyeball review.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_URL = 'https://github.com/dfee/rbx.git';
// master as of 2019-06-14 — rbx's final commit. The library is abandoned, so
// this never moves; bump deliberately if it ever does.
const PINNED_SHA = 'f2a55cf4e07f41d094433a746460f1d84a665d5b';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const corpusDir = path.join(packageRoot, '.e2e-tmp', 'corpus', 'rbx');
const outDir = path.join(packageRoot, '.e2e-tmp', 'corpus-out-rbx');
const distTransform = path.join(
  packageRoot,
  'dist',
  'sources',
  'rbx',
  'transform.js'
);
const distRunner = path.join(packageRoot, 'dist', 'runner.js');
const distMapping = path.join(packageRoot, 'dist', 'sources', 'rbx', 'mapping.js');

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

if (!fs.existsSync(distTransform)) {
  fail('dist/ not built — run `pnpm --filter bestax-migrate build` first');
}

// ---- fetch the corpus (text only) at the pinned commit --------------------
if (!fs.existsSync(path.join(corpusDir, 'src'))) {
  console.log(`Fetching rbx @ ${PINNED_SHA.slice(0, 12)} (text corpus)…`);
  fs.rmSync(corpusDir, { recursive: true, force: true });
  fs.mkdirSync(corpusDir, { recursive: true });
  const run = args => {
    const result = spawnSync('git', args, { cwd: corpusDir, encoding: 'utf8' });
    if (result.status !== 0) fail(`git ${args.join(' ')}: ${result.stderr}`);
  };
  run(['init', '-q']);
  run(['remote', 'add', 'origin', REPO_URL]);
  run(['fetch', '-q', '--depth', '1', 'origin', PINNED_SHA]);
  run(['checkout', '-q', 'FETCH_HEAD']);
}

// ---- collect the docs pages ----------------------------------------------
const docsFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (entry.endsWith('.docs.mdx')) docsFiles.push(full);
  }
})(path.join(corpusDir, 'src'));

if (docsFiles.length === 0) fail('no .docs.mdx files found in the corpus');

const { RBX_EXPORTS } = await import(distMapping);
const { default: transform } = await import(distTransform);
const { runTransform } = await import(distRunner);

/**
 * Pull the `<Playground>…</Playground>` bodies out of one MDX page. Brace and
 * tag depth are tracked together so a nested `<Playground>` inside a string or
 * a render-prop body cannot end the block early.
 */
function extractPlaygrounds(source) {
  const blocks = [];
  const open = /<Playground>/g;
  let match;
  while ((match = open.exec(source))) {
    const start = open.lastIndex;
    let depth = 1;
    let i = start;
    while (i < source.length && depth > 0) {
      if (source.startsWith('<Playground>', i)) {
        depth += 1;
        i += 12;
      } else if (source.startsWith('</Playground>', i)) {
        depth -= 1;
        if (depth === 0) break;
        i += 13;
      } else {
        i += 1;
      }
    }
    if (depth === 0) {
      blocks.push(source.slice(start, i).trim());
      open.lastIndex = i;
    }
  }
  return blocks;
}

/** Every rbx export whose name appears as a JSX tag root in the snippet. */
function referencedExports(body) {
  const names = new Set();
  for (const m of body.matchAll(/<([A-Z][A-Za-z0-9]*)/g)) {
    if (m[1] in RBX_EXPORTS) names.add(m[1]);
  }
  return [...names].sort();
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

let blockCount = 0;
let transformed = 0;
const crashes = [];
const todosByRule = new Map();
const unknownComponents = [];

for (const file of docsFiles) {
  const rel = path.relative(path.join(corpusDir, 'src'), file);
  const name = rel.replace(/[\\/]/g, '__').replace(/\.docs\.mdx$/, '');
  const blocks = extractPlaygrounds(fs.readFileSync(file, 'utf8'));
  if (blocks.length === 0) continue;
  blockCount += blocks.length;

  // Rebuild each page as one synthetic module written the way a real consumer
  // writes rbx: named imports from the package root, one component per block.
  const imported = new Set();
  const parts = [];
  blocks.forEach((body, index) => {
    for (const n of referencedExports(body)) imported.add(n);
    parts.push(`export const Example${index + 1} = () => (\n<>\n${body}\n</>\n);`);
  });
  const source =
    (imported.size > 0
      ? `import { ${[...imported].sort().join(', ')} } from "rbx";\n\n`
      : '') + parts.join('\n\n') + '\n';

  const todos = [];
  let output;
  try {
    output = runTransform(transform, `${rel}.tsx`, source, {
      add: entry => todos.push(entry),
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
console.log('\nbestax-migrate corpus validation — rbx docs Playgrounds');
console.log(`  pages:        ${docsFiles.length}`);
console.log(`  playgrounds:  ${blockCount}`);
console.log(`  transformed:  ${transformed}`);
console.log(`  crashes:      ${crashes.length}`);
const rules = [...todosByRule.entries()].sort((a, b) => b[1] - a[1]);
console.log(
  `  TODOs:        ${rules.reduce((sum, [, count]) => sum + count, 0)}`
);
for (const [rule, count] of rules) {
  console.log(`    ${rule}: ${count}`);
}
console.log(`  review dir:   ${path.relative(packageRoot, outDir)}`);

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
