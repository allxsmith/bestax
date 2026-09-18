/**
 * Differential fuzz: the `#688` conformance rule's resolver against real Node.
 *
 * `manifestViolations` carries a reduced implementation of Node's
 * PACKAGE_TARGET_RESOLVE, because deciding whether a `require()` lands on a
 * file Node reads as ESM means knowing which target it lands on at all. That
 * model was wrong in a different way eleven times, and each time the evidence
 * that fixed it was a generated manifest resolved by Node — not a reading of
 * the spec, which the implementation departs from in at least one place (an
 * array records a `null` and keeps going).
 *
 * So the evidence lives here rather than in a review comment. Each generated
 * condition map is written to a real package, resolved with
 * `createRequire().resolve()`, and what Node lands on is compared with what the
 * rule says about it. A disagreement is printed with the map that produced it.
 *
 * Not part of `pnpm test`: it writes hundreds of temp packages and takes
 * seconds, and its value is as a tool to run when this resolver is edited. The
 * committed fixtures in `scripts/publishable-manifests.test.mjs` are what CI
 * runs; every one of them came from a disagreement this found.
 *
 *   node scripts/exports-resolve-fuzz.mjs [count] [seed]
 *
 * A seed makes a run reproducible, so a disagreement can be handed to someone
 * else verbatim.
 */
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { manifestViolations } from './check-conformance.mjs';

const COUNT = Number(process.argv[2] ?? 900);
const SEED = Number(process.argv[3] ?? 1);

// A small deterministic PRNG, so a seed reproduces a run exactly. Math.random
// cannot be seeded, and an unreproducible counterexample is not much use.
let state = SEED >>> 0 || 1;
const rnd = n => {
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  state >>>= 0;
  return state % n;
};
const pick = a => a[rnd(a.length)];

// Valid targets, deprecated-but-valid spellings, and every way a target can be
// invalid: bare, escaping, `node_modules`, a `..` segment, percent-encoded, and
// backslash-separated. The invalid ones are what found the last four bugs.
const FILES = [
  './a.cjs',
  './a.js',
  './a.mjs',
  './a//b.js',
  'dist/bad.js',
  '../esc.js',
  './../esc.js',
  './node_modules/x.js',
  './d/../e.js',
  './%2e%2e/esc.js',
  './node%5fmodules/x.js',
  './a\\..\\b.js',
];
const KEYS = [
  'require',
  'import',
  'node',
  'node-addons',
  'default',
  'module-sync',
  'types',
];

const makeValue = depth => {
  const r = rnd(10);
  if (depth > 1 || r < 5) return pick(FILES);
  if (r === 5) return null;
  if (r === 6) return [pick(FILES), pick(FILES)];
  return makeMap(depth + 1);
};
const makeMap = depth => {
  const out = {};
  const keys = [...KEYS];
  for (let i = keys.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  for (const key of keys.slice(0, 1 + rnd(3))) out[key] = makeValue(depth);
  return out;
};

const root = mkdtempSync(join(tmpdir(), 'exports-fuzz-'));
let considered = 0;
let disagreements = 0;

for (let i = 0; i < COUNT; i++) {
  const map = makeMap(0);
  const dir = join(root, `p${i}`);
  const pkgDir = join(dir, 'node_modules', 'subject');
  mkdirSync(pkgDir, { recursive: true });
  for (const f of ['./a.cjs', './a.js', './a.mjs']) {
    writeFileSync(join(pkgDir, f.slice(2)), 'module.exports={};\n');
  }
  // The file a deprecated double slash actually resolves to. Without it, a
  // valid-but-unusual target throws MODULE_NOT_FOUND and looks invalid.
  mkdirSync(join(pkgDir, 'a'), { recursive: true });
  writeFileSync(join(pkgDir, 'a', 'b.js'), 'module.exports={};\n');
  writeFileSync(
    join(pkgDir, 'package.json'),
    JSON.stringify({
      name: 'subject',
      version: '1.0.0',
      type: 'module',
      exports: { '.': map },
    })
  );
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'host', version: '1.0.0' })
  );

  let landed;
  try {
    landed = createRequire(
      pathToFileURL(join(dir, 'package.json')).href
    ).resolve('subject');
  } catch {
    landed = null;
  }

  const flagged = manifestViolations('subject', {
    name: 'subject',
    type: 'module',
    exports: { '.': map },
  }).filter(v => v.includes('#688'));

  // The rule abstains where the map does not distinguish the formats, and where
  // `module-sync` serves ESM by contract. Both are documented decisions rather
  // than agreement with Node, so they are excluded rather than counted wrong.
  const spelled = JSON.stringify(map);
  if (!/"require"/.test(spelled) || /"module-sync"/.test(spelled)) continue;

  considered++;
  const nodeSaysBroken =
    landed !== null && landed.endsWith('.js') && !landed.endsWith('.cjs');
  if (nodeSaysBroken !== flagged.length > 0) {
    disagreements++;
    if (disagreements <= 10) {
      console.log(
        'DISAGREE',
        spelled,
        '| node →',
        landed && landed.split('/').pop(),
        '| rule flags:',
        flagged.length > 0
      );
    }
  }
}

console.log(
  `seed ${SEED}: ${considered} maps considered, ${disagreements} disagreements`
);
process.exit(disagreements === 0 ? 0 : 1);
