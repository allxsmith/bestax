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
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
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

// Arrays get the shapes the resolver actually distinguishes, not just a pair of
// strings: empty, a lone `null`, a `null` before a valid entry, and a nested
// object or array. Those are exactly the branches `sawBlocker` and the
// empty-array block exist for, so a generator emitting only string pairs could
// never have produced the evidence for them.
const makeArray = depth => {
  switch (rnd(6)) {
    case 0:
      return [];
    case 1:
      return [null];
    case 2:
      return [null, pick(FILES)];
    case 3:
      return [makeMap(depth + 1), pick(FILES)];
    case 4:
      return [pick(FILES), makeMap(depth + 1)];
    default:
      return [pick(FILES), pick(FILES)];
  }
};

const makeValue = depth => {
  const r = rnd(10);
  if (depth > 1 || r < 5) return pick(FILES);
  if (r === 5) return null;
  if (r === 6) return makeArray(depth);
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

// The rule's documented abstention, restated here so the corpus tests the
// MECHANISM (which target Node lands on) rather than the POLICY (which maps are
// in scope at all). A `require` key is only evidence that the author meant a
// CommonJS target if a `require()` can actually reach it — one nested under
// `import` is unreachable, and the rule leaves such maps alone.
const REQUIRE_REACHABLE = new Set([
  'node-addons',
  'node',
  'module-sync',
  'require',
  'default',
]);
const declaresCjsForRequire = node => {
  if (!node || typeof node !== 'object') return false;
  if (Array.isArray(node)) return node.some(declaresCjsForRequire);
  if (Object.hasOwn(node, 'require')) return true;
  return Object.entries(node).some(
    ([key, value]) => REQUIRE_REACHABLE.has(key) && declaresCjsForRequire(value)
  );
};

const root = mkdtempSync(join(tmpdir(), 'exports-fuzz-'));
// Hundreds of packages per run, so they go when the run does. Kept on a
// disagreement, since the fixture is what someone would want to look at.
let keepRoot = false;
process.on('exit', () => {
  if (!keepRoot) rmSync(root, { recursive: true, force: true });
});
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

  // Two exclusions, for different reasons. A map that does not distinguish the
  // formats is a documented abstention rather than a disagreement with Node.
  // `module-sync` is excluded because this oracle cannot answer it: the rule
  // judges what BOTH a modern and a pre-22.10 runtime resolve, and a single
  // `require.resolve()` here only ever reports the modern one. Checking that
  // mechanism needs a second child process under
  // `--no-experimental-require-module`; until then those maps are carried by
  // fixtures, not by this corpus.
  const spelled = JSON.stringify(map);
  if (!declaresCjsForRequire(map) || /"module-sync"/.test(spelled)) continue;

  considered++;
  const nodeSaysBroken =
    landed !== null && landed.endsWith('.js') && !landed.endsWith('.cjs');
  if (nodeSaysBroken !== flagged.length > 0) {
    disagreements++;
    keepRoot = true;
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
