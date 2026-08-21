/**
 * Holds the `publishable-manifests` rule in scripts/check-conformance.mjs to
 * what the repo actually does (#436).
 *
 * The rule exempts declared packages from part of the pack-time protocol check,
 * because they publish with `pnpm publish`, which resolves those protocols. The
 * exemption is the dangerous verdict: granted wrongly, it waves through the
 * manifest that shipped #412.
 *
 * So the exemption is DECLARED in check-conformance.mjs rather than inferred
 * from release configs, and the checking of that declaration lives here. That
 * split is the point. Four separate false exemptions came from a parser that
 * modelled semantic-release's config format and fell through to "exempt"
 * whenever it met a shape it did not know. Here, a wrong reading fails a test
 * instead of switching a rule off.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  hookScripts,
  manifestViolations,
  parseWorkspacePackages,
} from './check-conformance.mjs';
import { execOptions, releaseBranches } from './lib/release-config.mjs';
import { tokenize } from './lib/shell-words.mjs';

const repoFile = rel =>
  readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8');

// --- the declaration matches reality -----------------------------------------

/** The declared set, read from the check rather than restated here. */
const DECLARED = new Set(
  [
    ...repoFile('scripts/check-conformance.mjs').matchAll(
      /const PNPM_PUBLISHED = new Set\(\[([^\]]*)\]\)/g
    ),
  ]
    .flatMap(m => m[1].split(','))
    .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
);

// parseWorkspacePackages returns each `packages:` entry as literal text, so a
// glob like `packages/*` comes back unexpanded. Swallowing that would quietly
// shrink PUBLISHABLE, and PUBLISHABLE is what the declaration is compared
// against — the "a new package must be declared" guarantee would stop holding
// for everything under the glob while this file stayed green. So an entry whose
// manifest cannot be read is a failure, not a filtered-out row.
const PUBLISHABLE = parseWorkspacePackages(
  repoFile('pnpm-workspace.yaml')
).filter(dir => {
  let manifest;
  try {
    manifest = repoFile(`${dir}/package.json`);
  } catch {
    throw new Error(
      `pnpm-workspace.yaml lists "${dir}", which has no readable package.json. ` +
        'If that is a glob, parseWorkspacePackages does not expand it and every ' +
        'package under it is silently exempt from the checks in this file.'
    );
  }
  return !JSON.parse(manifest).private;
});

test('the declaration was actually parsed out of the check', () => {
  // Everything below compares against DECLARED, so an empty read would make
  // this whole file vacuous.
  assert.ok(DECLARED.size > 0, 'PNPM_PUBLISHED could not be read');
  assert.ok(
    PUBLISHABLE.length >= 4,
    `expected 4+ publishable packages, got ${PUBLISHABLE.length}`
  );
});

/**
 * The command a package's release config actually runs, read from the LOADED
 * config rather than its source text.
 *
 * The first version of this grepped the file for `pnpm publish`, on the theory
 * that a substring is too dumb to be fooled. It was fooled immediately: the
 * release config explains at length why it runs `pnpm publish` with
 * `--provenance` and `--embed-readme`, so the prose satisfied every assertion
 * and the command itself was unconstrained. Editing the real command to
 * `npm publish`, or deleting both flags, left the whole suite green.
 *
 * Reading one known field of one declared config is not the config-format
 * modelling that failed four times — that failed because it inferred a VERDICT
 * from shapes it might not recognise, and fell through to "exempt". Here an
 * unreadable config throws, which fails a test.
 */
async function publishCommand(dir) {
  // A package with no exec plugin publishes with npm, which is a real answer,
  // not a missing one.
  return (await execOptions(dir))?.publishCmd ?? '';
}

for (const dir of PUBLISHABLE) {
  test(`${dir}: the release config agrees with the declaration`, async () => {
    const cmd = await publishCommand(dir);
    const runsPnpmPublish = /(^|\s|&&|\{)\s*pnpm\s+publish(\s|$)/.test(cmd);
    if (DECLARED.has(dir)) {
      assert.ok(
        runsPnpmPublish,
        `${dir} is declared in PNPM_PUBLISHED but its publishCmd is ` +
          `${JSON.stringify(cmd)}, which does not run pnpm publish. The ` +
          `declaration grants it an exemption it has not earned.`
      );
    } else {
      assert.ok(
        !runsPnpmPublish,
        `${dir}'s publishCmd runs pnpm publish but ${dir} is not declared in ` +
          `PNPM_PUBLISHED, so it is being held to the npm rule. Declare it, ` +
          `or remove the command.`
      );
    }
  });
}

test('every publishable package is declared, and each wires the guard', () => {
  // Derived from the workspace rather than restated, so a NEW publishable
  // package fails here until someone decides how it publishes — which is the
  // one moment that decision is cheap. Adding a name to PNPM_PUBLISHED without
  // moving its release config fails the per-package test above instead.
  assert.deepEqual([...DECLARED].sort(), [...PUBLISHABLE].sort());

  // The exemption assumes pnpm packs these. In CI that is the release config's
  // job; everywhere else it is the hooks'. `npm pack` runs only prepack, and
  // `npm publish <tarball>` runs neither, so both are required.
  for (const dir of DECLARED) {
    const pkg = JSON.parse(repoFile(`${dir}/package.json`));
    for (const hook of ['prepack', 'prepublishOnly']) {
      assert.match(
        pkg.scripts?.[hook] ?? '',
        /require-pnpm-publish\.mjs/,
        `${dir} must run the guard on ${hook}`
      );
    }
  }
});

test('every declared package passes --provenance and --embed-readme', async () => {
  // Neither is optional and neither fails loudly if dropped: pnpm ignores
  // publishConfig.provenance (and no package carries one any more), and
  // defaults embed-readme to false where npm defaults it true. Asserted
  // against the command, not the file: both flags appear in the shared
  // helper's comments, so a source grep passed with them deleted from
  // publishCmd.
  //
  // Looped over every package even though one helper builds all four commands,
  // because that helper is an implementation detail. What must hold is that
  // each package's config actually produces them.
  for (const dir of DECLARED) {
    const cmd = await publishCommand(dir);
    assert.match(cmd, /(^|\s)--provenance(\s|$)/, `${dir} loses provenance`);
    assert.match(cmd, /(^|\s)--embed-readme(\s|$)/, `${dir} loses its README`);
  }
});

test('the scripts the release config names all exist', async () => {
  // The guard the deleted pack-hook block carried. Read from the commands
  // through the same tokenizer that has to undo the config's quoting, rather
  // than by pattern-matching filenames out of the source — which broke on any
  // path shape other than `path.join(SCRIPTS, 'x.mjs')` and invented
  // requirements for filenames mentioned in comments.
  for (const dir of DECLARED) await assertNamedScriptsExist(dir);
});

async function assertNamedScriptsExist(dir) {
  const exec = await execOptions(dir);
  assert.ok(exec, `${dir} must publish through @semantic-release/exec`);

  // Only the *Cmd options are shell commands. execCwd is a raw, unquoted path,
  // and feeding it to tokenize threw on a checkout containing an apostrophe —
  // the very case shell-words exists to survive.
  const named = Object.entries(exec)
    .filter(([key, v]) => key.endsWith('Cmd') && typeof v === 'string')
    .flatMap(([, cmd]) => tokenize(cmd))
    .filter(word => /\.(mjs|cjs|js)$/.test(word));

  assert.ok(
    named.length >= 2,
    `expected ${dir}'s config to name scripts, got ${named}`
  );
  for (const abs of named) {
    assert.ok(
      existsSync(abs),
      `${dir}/release.config.js runs "${abs}", which does not exist`
    );
  }
}

test('the release stays on a single branch, or the dist-tag needs revisiting', async () => {
  // publishCmd passes no --tag, which is only correct while every release goes
  // to `latest`. @semantic-release/npm's get-channel.js maps a channel that is
  // a valid semver range to `release-<channel>`, and nothing here reimplements
  // that.
  //
  // Read from the loaded config, not the source. This assertion was the third
  // source-text grep in this file and the only one left after the other two
  // were found matching the config's own comments: a line reading
  // `// branches: ['main']` would have satisfied it while the real value was
  // ['main', 'next'], which is the direction that publishes a prerelease to
  // the stable dist-tag.
  for (const dir of DECLARED) {
    assert.deepEqual(await releaseBranches(dir), ['main'], dir);
  }
});

// --- the rule ----------------------------------------------------------------
//
// bestax-migrate is the only package carrying a pack-time specifier and it is
// exempt for that one, so none of these branches executes during a real run.
// Without them, inverting the rule leaves CI green.

// A declared package must also wire the prepublishOnly guard, so fixtures for
// the pnpm side carry it; otherwise every one of them picks up that violation
// instead of the one under test.
const GUARD = {
  prepack: 'node ../scripts/require-pnpm-publish.mjs',
  prepublishOnly: 'node ../scripts/require-pnpm-publish.mjs',
};

const WS = spec => ({
  scripts: GUARD,
  devDependencies: { '@allxsmith/bestax-bulma': spec },
});

// Directory NAMES, because manifestViolations consults the declaration itself
// rather than taking a verdict as an argument — a rule that ignored the
// declaration would pass these fixtures.
//
// NPM_PKG used to be `bulma-ui`, a real undeclared package. #532 declared the
// last of those, so nothing real is left to play the part and the npm branch
// is exercised through a name that is deliberately not a workspace package:
// the case it now guards is a package that does not exist yet. The assertion
// below is what keeps that true, since declaring this name would silently turn
// every npm-branch test into a pnpm-branch one.
const NPM_PKG = 'a-package-that-has-not-moved-yet';
const PNPM_PKG = 'bestax-migrate';

test('the npm-publisher fixture really is undeclared', () => {
  assert.ok(!DECLARED.has(NPM_PKG), `${NPM_PKG} must not be declared`);
  assert.ok(DECLARED.has(PNPM_PKG), `${PNPM_PKG} must be declared`);
});

test('an npm publisher is held to every pack-time protocol', () => {
  for (const spec of [
    'workspace:^',
    'catalog:',
    'jsr:@scope/pkg@^1',
    'link:../y',
    'portal:../y',
    'file:../y',
  ]) {
    const v = manifestViolations(NPM_PKG, WS(spec));
    assert.equal(v.length, 1, `${spec} must be flagged for an npm publisher`);
    // `file:` is the one npm genuinely understands, so it is not an
    // EUNSUPPORTEDPROTOCOL; its message says what actually goes wrong instead.
    assert.match(
      v[0],
      spec.startsWith('file:') ? /none of their machines/ : /#412/
    );
  }
});

test('a pnpm publisher is exempt only for the protocols pnpm resolves', () => {
  for (const spec of ['workspace:^', 'catalog:', 'catalog:default']) {
    assert.deepEqual(manifestViolations(PNPM_PKG, WS(spec)), [], spec);
  }
  for (const spec of [
    'jsr:@scope/pkg@^1',
    'link:../y',
    'portal:../y',
    'file:../y',
  ]) {
    const v = manifestViolations(PNPM_PKG, WS(spec));
    assert.equal(v.length, 1, `${spec} must still be flagged`);
    // These do not fail as EUNSUPPORTEDPROTOCOL, so the message must not say so.
    assert.doesNotMatch(v[0], /EUNSUPPORTEDPROTOCOL/);
  }
});

test('a pnpm publisher is exempt only in devDependencies', () => {
  for (const section of [
    'dependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    const v = manifestViolations(PNPM_PKG, {
      scripts: GUARD,
      [section]: { x: 'workspace:^' },
    });
    assert.equal(v.length, 1, `${section} must be flagged`);
    assert.match(v[0], /resolved by consumers/);
    // And must not tell a pnpm publisher to switch to pnpm publish.
    assert.doesNotMatch(v[0], /move bestax-migrate to `pnpm publish`/);
  }
});

test('each message explains the failure that actually applies', () => {
  const npm = manifestViolations(NPM_PKG, WS('workspace:^'))[0];
  const jsr = manifestViolations(PNPM_PKG, {
    scripts: GUARD,
    dependencies: { x: 'jsr:@s/p@^1' },
  })[0];
  const consumer = manifestViolations(PNPM_PKG, {
    scripts: GUARD,
    dependencies: { x: 'workspace:^' },
  })[0];
  assert.match(npm, /npm publish/);
  assert.match(jsr, /@jsr registry/);
  assert.match(consumer, /resolved by consumers/);
  // Three distinct explanations, not one shared tail re-deriving the predicate.
  assert.notEqual(npm, jsr);
  assert.notEqual(jsr, consumer);
});

test('a plain semver range is nobody’s business', () => {
  const clean = {
    scripts: GUARD,
    dependencies: { bulma: '^1.0.4' },
    devDependencies: { jest: '^30' },
  };
  for (const dir of [NPM_PKG, PNPM_PKG]) {
    assert.deepEqual(manifestViolations(dir, clean), []);
  }
});

test('a non-string specifier does not crash the rule', () => {
  for (const spec of [undefined, null, 42, {}]) {
    assert.deepEqual(
      manifestViolations(NPM_PKG, { dependencies: { x: spec } }),
      []
    );
  }
});

test('a private package is not held to any of this', () => {
  assert.deepEqual(
    manifestViolations('docs', { private: true, ...WS('workspace:^') }),
    []
  );
});

// --- lifecycle hook script paths ---------------------------------------------

test('hookScripts collects paths from pack and publish hooks only', () => {
  const found = hookScripts({
    scripts: {
      prepublishOnly: 'node ../scripts/guard.mjs',
      prepack: 'node scripts/a.mjs',
      start: 'node dist/index.js',
      test: 'node ./tools/t.js',
    },
  });
  assert.deepEqual(found.sort(), ['../scripts/guard.mjs', 'scripts/a.mjs']);
});

test('hookScripts recognises interpreters other than node', () => {
  // `tsx ./x.ts` and `bash ./x.sh` name a script exactly as much as node does.
  assert.deepEqual(
    hookScripts({ scripts: { prepack: 'tsx ./scripts/stamp.ts' } }),
    ['./scripts/stamp.ts']
  );
  assert.deepEqual(
    hookScripts({ scripts: { postpack: 'bash ./scripts/g.sh' } }),
    ['./scripts/g.sh']
  );
});

test('hookScripts ignores flags and bare filenames', () => {
  // A build output is not a script to demand exists: this check runs before the
  // build in ci.yml.
  assert.deepEqual(
    hookScripts({
      scripts: {
        prepack: 'node ./scripts/x.mjs --out=bundle.js --require=./p.js',
      },
    }),
    ['./scripts/x.mjs']
  );
});

test('hookScripts survives a quoted path with a space', () => {
  assert.deepEqual(
    hookScripts({ scripts: { prepack: `node '/My Projects/x/a.mjs'` } }),
    ['/My Projects/x/a.mjs']
  );
});

test('hookScripts tolerates a manifest with no scripts', () => {
  assert.deepEqual(hookScripts({}), []);
  assert.deepEqual(hookScripts(undefined), []);
});

test('an undeclared package gets no exemption, whatever the walk does', () => {
  // The mutation this exists for: a walk that hands every package the pnpm
  // verdict. Because manifestViolations consults the declaration itself, a
  // package that is not in it cannot be exempted from anywhere.
  const v = manifestViolations(NPM_PKG, WS('workspace:^'));
  assert.equal(
    v.length,
    1,
    `${NPM_PKG} is not declared and must not be exempt`
  );
  assert.match(v[0], /npm publish/);
  // …and a declared one still is.
  assert.deepEqual(manifestViolations(PNPM_PKG, WS('workspace:^')), []);
});

test('a declared package that drops the guard is flagged for it', () => {
  // The exemption and its compensating guard are checked together, so a package
  // cannot gain one and lose the other in a single edit.
  const v = manifestViolations(PNPM_PKG, {
    devDependencies: { '@allxsmith/bestax-bulma': 'workspace:^' },
  });
  assert.equal(v.length, 1);
  assert.match(v[0], /prepublishOnly/);
  assert.match(v[0], /require-pnpm-publish\.mjs/);
});

test('an undeclared package is not asked for the guard', () => {
  // An undeclared package has no exemption, so it has nothing to compensate
  // for. This said `bulma-ui` until #532 declared it, which made the comment
  // describe the opposite of what the fixture does.
  const v = manifestViolations(NPM_PKG, { dependencies: { bulma: '^1.0.4' } });
  assert.deepEqual(v, []);
});

test('every declared package pins its exec cwd to itself', async () => {
  // `pnpm publish` resolves its target package from the cwd, which for exec is
  // wherever semantic-release was started. Without execCwd a run from the repo
  // root reaches the publish step — after the release commit and tag are
  // pushed — and fails on the private root package.
  //
  // Looped, and matched against the package it belongs to, because
  // pnpmPublishPlugins now takes the directory as an ARGUMENT. A config that
  // passed a copy-pasted path would publish the wrong package from a release
  // whose commit and tag are already on main, and asserting only that execCwd
  // is truthy would not notice.
  for (const dir of DECLARED) {
    const exec = await execOptions(dir);
    assert.ok(exec, `${dir} must publish through @semantic-release/exec`);
    assert.ok(exec.execCwd, `${dir}: execCwd must be set`);
    assert.match(exec.execCwd, new RegExp(`(^|/)${dir}$`), `${dir}: execCwd`);
    // The release-info tail is pointed by --dir= and has the same failure mode.
    assert.match(
      exec.publishCmd,
      new RegExp(`--dir=(['"]?)[^'"\\s]*/${dir}\\1(\\s|$)`),
      `${dir}: publishCmd --dir must name the same package`
    );
  }
});

test('a violation names a fix that fits the protocol', () => {
  // Both halves of the npm message have to match. `file:` is not an
  // EUNSUPPORTEDPROTOCOL, and suggesting a pnpm migration for a protocol pnpm
  // does not resolve sends the maintainer through a migration that lands on
  // the same specifier.
  const ws = manifestViolations(NPM_PKG, WS('workspace:^'))[0];
  assert.match(ws, /EUNSUPPORTEDPROTOCOL/);
  assert.match(ws, /PNPM_PUBLISHED/);

  const file = manifestViolations(NPM_PKG, WS('file:../y'))[0];
  assert.doesNotMatch(file, /EUNSUPPORTEDPROTOCOL/);
  assert.doesNotMatch(file, /PNPM_PUBLISHED/);
  assert.match(file, /does not resolve it either/);

  for (const spec of ['jsr:@s/p@^1', 'link:../y', 'portal:../y']) {
    assert.doesNotMatch(
      manifestViolations(NPM_PKG, WS(spec))[0],
      /PNPM_PUBLISHED/,
      `${spec} must not be advertised as fixable by moving to pnpm publish`
    );
  }
});

test('the suggested prepublishOnly path fits the package depth', () => {
  // Hardcoding `../scripts/…` is only right for a package one level down.
  const v = manifestViolations(PNPM_PKG, {
    devDependencies: { '@allxsmith/bestax-bulma': 'workspace:^' },
  })[0];
  assert.match(v, /node \.\.\/scripts\/require-pnpm-publish\.mjs/);
});

test('hookScripts skips paths it cannot resolve rather than inventing them', () => {
  // A shell variable cannot be expanded here, and access()ing the literal text
  // would report a working hook as broken.
  assert.deepEqual(
    hookScripts({ scripts: { prepack: 'node $INIT_CWD/scripts/a.mjs' } }),
    []
  );
  // An unbalanced quote is a command the shell would reject outright.
  assert.deepEqual(hookScripts({ scripts: { prepack: `node './x.mjs` } }), []);
});

test('hookScripts sees every script in a chained hook', () => {
  // `;`, `|` and `>` end a word without whitespace, so a path abutting one was
  // previously missed — the direction that lets a moved script through.
  assert.deepEqual(
    hookScripts({
      scripts: { prepack: 'node ./scripts/a.mjs;node ./scripts/b.mjs' },
    }).sort(),
    ['./scripts/a.mjs', './scripts/b.mjs']
  );
  assert.deepEqual(
    hookScripts({ scripts: { postpack: 'node ./scripts/a.mjs|tee log' } }),
    ['./scripts/a.mjs']
  );
});

test('a peer dependency is told to pin a range, not to move', () => {
  // A peer dep is meant to reach consumers, so "move it to devDependencies"
  // would break the contract rather than fix the specifier.
  const peer = manifestViolations(PNPM_PKG, {
    scripts: GUARD,
    peerDependencies: { x: 'workspace:^' },
  })[0];
  assert.match(peer, /semver range/);
  assert.doesNotMatch(peer, /Move it to devDependencies/);

  // A runtime dependency still gets the move suggestion.
  const runtime = manifestViolations(PNPM_PKG, {
    scripts: GUARD,
    dependencies: { x: 'workspace:^' },
  })[0];
  assert.match(runtime, /Move it to devDependencies/);
});

test('the guard must be run, not merely mentioned', () => {
  // Both bypasses that satisfied a substring test: naming the file in another
  // command, and short-circuiting past it.
  const flagged = scripts =>
    manifestViolations(PNPM_PKG, { scripts }).some(v => /does not run/.test(v));

  const REAL = 'node ../scripts/require-pnpm-publish.mjs';
  assert.equal(flagged({ prepack: REAL, prepublishOnly: REAL }), false);
  assert.equal(
    flagged({ prepack: REAL, prepublishOnly: 'echo require-pnpm-publish.mjs' }),
    true,
    'a mention must not satisfy the check'
  );
  assert.equal(
    flagged({ prepack: REAL, prepublishOnly: `true || ${REAL}` }),
    true,
    'short-circuiting past the guard must not satisfy the check'
  );
  assert.equal(
    flagged({ prepack: REAL, prepublishOnly: `${REAL} && echo ok` }),
    false,
    'chaining after the guard is fine'
  );
});

test('both pack hooks are required, since npm pack runs only prepack', () => {
  // `npm pack` never runs prepublishOnly, and `npm publish <tarball>` runs no
  // scripts at all, so prepublishOnly alone leaves a two-step hand publish
  // shipping the unresolved specifier.
  const REAL = 'node ../scripts/require-pnpm-publish.mjs';
  const only = manifestViolations(PNPM_PKG, {
    scripts: { prepublishOnly: REAL },
  });
  assert.equal(only.length, 1);
  assert.match(only[0], /prepack/);
});

test('an unresolvable protocol in devDependencies is explained honestly', () => {
  // Consumers never resolve a dependency's devDependencies, so the
  // consumer-facing complaint does not apply there — and "give it a semver
  // range" is not a possible fix for a local path.
  const v = manifestViolations(PNPM_PKG, {
    scripts: GUARD,
    devDependencies: { x: 'file:../fixtures' },
  })[0];
  assert.match(v, /consumers do not resolve devDependencies/);
  assert.doesNotMatch(v, /no consumer can resolve it/);
  assert.doesNotMatch(v, /plain semver range/);
});
