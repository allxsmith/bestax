/**
 * Differential fuzz: the `#688` conformance rule's resolver against real Node.
 *
 * `manifestViolations` carries a reduced implementation of Node's
 * PACKAGE_TARGET_RESOLVE, because deciding whether a `require()` lands on a
 * file Node reads as ESM means knowing which target it lands on at all. That
 * model has been wrong in a different way many times over, and each time the
 * evidence
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
 *   node scripts/exports-resolve-fuzz.mjs [count] [seed] [resolve|load]
 *
 * `resolve` (the default) is fast and in-process; `load` is slower and is the
 * only mode that certifies the `module-sync` family, because it runs the
 * runtime those maps are about. Both are worth running when the resolver
 * changes.
 *
 * A seed makes a run reproducible, so a disagreement can be handed to someone
 * else verbatim.
 */
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { manifestViolations } from './check-conformance.mjs';

const COUNT = Number(process.argv[2] ?? 900);
const SEED = Number(process.argv[3] ?? 1);
// `resolve` (default) asks which TARGET Node lands on, in-process and fast.
// `load` asks whether a `require()` actually fails, by loading the fixture in a
// child process under `--no-experimental-require-module` — the runtime without
// `module-sync`, and the one whose consumers this rule is protecting. That mode
// is slower but its oracle is independent of the rule's policy, and it is the
// only way to certify the `module-sync` family, which `resolve` cannot see.
const MODE = process.argv[4] ?? 'resolve';
// A floor, because "0 disagreements" over nothing reads exactly like a clean
// run. A mistyped count and a count of 0 both produced that success line while
// comparing no maps at all — and the two ways this goes quiet are both edits to
// the resolver it exists to certify.
// Counted over DECISIVE maps — ones where Node reports a failure, or the rule
// flags, or both. Most of a generated corpus resolves nothing at all, so those
// comparisons are `false === false` and could not have failed however wrong the
// rule was; a floor on the total would pass on a corpus with no live cases in
// it, which is the same vacuous-success shape the count floor was added for.
const MIN_DECISIVE = 10;
if (!Number.isInteger(COUNT) || COUNT < 1) {
  console.error(`count must be a positive integer, got ${process.argv[2]}`);
  process.exit(2);
}
if (!Number.isInteger(SEED)) {
  console.error(`seed must be an integer, got ${process.argv[3]}`);
  process.exit(2);
}
if (MODE !== 'resolve' && MODE !== 'load') {
  console.error(`mode must be 'resolve' or 'load', got ${MODE}`);
  process.exit(2);
}

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
// backslash-separated. The invalid spellings are the ones that have historically
// found the divergences; see #688 for the series.
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
let decisive = 0;
let disagreements = 0;

for (let i = 0; i < COUNT; i++) {
  const map = makeMap(0);
  const dir = join(root, `p${i}`);
  const pkgDir = join(dir, 'node_modules', 'subject');
  mkdirSync(pkgDir, { recursive: true });
  // Each file carries the format its extension implies in a `type: module`
  // package, so the `load` oracle sees a real failure rather than a fixture
  // that happens to parse either way.
  writeFileSync(join(pkgDir, 'a.cjs'), 'module.exports={};\n');
  writeFileSync(join(pkgDir, 'a.js'), 'export const x = 1;\n');
  writeFileSync(join(pkgDir, 'a.mjs'), 'export const x = 1;\n');
  // The file a deprecated double slash actually resolves to. Without it, a
  // valid-but-unusual target throws MODULE_NOT_FOUND and looks invalid.
  mkdirSync(join(pkgDir, 'a'), { recursive: true });
  writeFileSync(join(pkgDir, 'a', 'b.js'), 'export const x = 1;\n');
  writeFileSync(
    join(dir, 'probe.cjs'),
    "let p = '';\n" +
      "try { p = require.resolve('subject'); } catch {}\n" +
      "try { require('subject'); process.stdout.write('ok\\t' + p); }\n" +
      "catch (e) { process.stdout.write(String(e.code) + '\\t' + p); }\n"
  );
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

  const flagged = manifestViolations('subject', {
    name: 'subject',
    type: 'module',
    exports: { '.': map },
  }).filter(v => v.includes('#688'));

  // A map that does not distinguish the formats is a documented abstention
  // rather than a disagreement with Node, so it is excluded in both modes.
  // `module-sync` is excluded in `resolve` only: that oracle reports the modern
  // runtime's target alone, and the rule judges what BOTH runtimes reach.
  const spelled = JSON.stringify(map);
  if (!declaresCjsForRequire(map)) continue;
  if (MODE === 'resolve' && /"module-sync"/.test(spelled)) continue;

  let landed;
  let landedPath;
  let nodeSaysBroken;
  if (MODE === 'load') {
    // The runtime WITHOUT `module-sync`, which is the one this rule protects:
    // a `.js` in ESM scope reached by `require()` throws ERR_REQUIRE_ESM there
    // and loads on a modern one. Any other error means the package does not
    // resolve at all, which is a different problem from this issue.
    landed = execFileSync(
      process.execPath,
      ['--no-experimental-require-module', join(dir, 'probe.cjs')],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    // The probe reports `CODE<TAB>resolvedPath`, so this mode compares the file
    // too rather than only the verdict. `module-sync` maps are the family only
    // this mode can see, and certifying them by a boolean was the weaker half.
    const [code, resolved] = landed.split('\t');
    nodeSaysBroken = code === 'ERR_REQUIRE_ESM';
    landedPath = resolved || null;
  } else {
    try {
      landed = createRequire(
        pathToFileURL(join(dir, 'package.json')).href
      ).resolve('subject');
    } catch {
      landed = null;
    }
    // The fixture package is `type: module`, so both `.js` and `.mjs` are ES
    // modules there and only `.cjs` is not. `load` mode checks this by actually
    // requiring the package; here it is inferred from the extension, which is
    // the reason that mode exists.
    nodeSaysBroken =
      landed !== null &&
      (landed.endsWith('.mjs') ||
        (landed.endsWith('.js') && !landed.endsWith('.cjs')));
    landedPath = landed;
  }

  considered++;
  // A comparison only discriminates when something is claimed: Node found a
  // failure, or the rule reported one. Agreement on "nothing here" proves
  // nothing about the rule.
  if (nodeSaysBroken || flagged.length > 0) decisive++;

  // Comparing verdicts alone would let the rule agree for the wrong reason: it
  // can name a different file than Node resolved and still say "broken". Most
  // of the valid targets here are ES modules, so a genuine divergence had
  // better than even odds of being masked. Both modes report a landed path now,
  // so both compare the file rather than the basename alone — a second
  // `./dist/a.js` beside `./a.js` would otherwise silently re-open that
  // masking. Matched as a path SUFFIX, because macOS resolves `/var` to
  // `/private/var` and the path Node reports shares no prefix with the one this
  // script built. A suffix is weaker than a full comparison: it would still
  // collide between `./a.js` and `./sub/a.js`, which is safe only because no
  // generated target nests a duplicate basename.
  let wrongTarget = false;
  if (nodeSaysBroken && flagged.length > 0 && landedPath) {
    const resolved = String(landedPath).replace(/\/+/g, '/');
    wrongTarget = !flagged.some(v => {
      const named = v.match(/points at `([^`]+)`/)?.[1];
      if (!named) return false;
      // The manifest may spell it `./a//b.js`; Node reports it collapsed.
      const tail = named.replace(/^\.\//, '').replace(/\/+/g, '/');
      return resolved.endsWith(`/${tail}`);
    });
  }
  if (wrongTarget || nodeSaysBroken !== flagged.length > 0) {
    disagreements++;
    keepRoot = true;
    if (disagreements <= 10) {
      if (disagreements === 1) console.log('fixtures kept in', root);
      console.log(
        'DISAGREE',
        spelled,
        '| node →',
        landed && String(landed).split('/').pop(),
        '| rule flags:',
        flagged.length > 0,
        wrongTarget ? '| NAMED A DIFFERENT FILE' : ''
      );
    }
  }
}

console.log(
  `seed ${SEED} (${MODE}): ${considered} maps considered, ${decisive} decisive, ` +
    `${disagreements} disagreements`
);
if (decisive < MIN_DECISIVE) {
  console.error(
    `only ${decisive} of ${considered} comparisons were decisive (floor ` +
      `${MIN_DECISIVE}) — the rest agreed that nothing was wrong, which any ` +
      `rule would. Raise the count, or check whether the generator or the ` +
      `abstention filter has stopped producing broken maps.`
  );
  process.exit(2);
}
process.exit(disagreements === 0 ? 0 : 1);
