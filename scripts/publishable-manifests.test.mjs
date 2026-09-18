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
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SIBLING_RUNTIME_DEPS,
  dependencyTarget,
  hookScripts,
  manifestViolations,
  parseWorkspacePackages,
  siblingViolations,
} from './check-conformance.mjs';
import {
  execOptions,
  npmOptions,
  releaseBranches,
} from './lib/release-config.mjs';
import { basename } from 'node:path';
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

// A glob now throws inside parseWorkspacePackages itself (#438), so the case
// this filter fences is the remaining one: a listed directory whose manifest
// cannot be read (deleted, moved, or misspelled). Swallowing that would
// quietly shrink PUBLISHABLE, and PUBLISHABLE is what the declaration is
// compared against — the "a new package must be declared" guarantee would
// stop holding while this file stayed green. So an unreadable manifest is a
// failure, not a filtered-out row.
const PUBLISHABLE = parseWorkspacePackages(
  repoFile('pnpm-workspace.yaml')
).filter(dir => {
  let manifest;
  try {
    manifest = repoFile(`${dir}/package.json`);
  } catch {
    throw new Error(
      `pnpm-workspace.yaml lists "${dir}", which has no readable package.json. ` +
        'Every check in this file silently exempts a package it cannot read.'
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

// --- the workspace parser (#438) ------------------------------------------

test('an inline comment ends the entry, not the block', () => {
  // The old parser required end-of-line after the token, so a commented entry
  // fell into the terminator branch and every entry after it silently
  // vanished — the direction that mattered, because each check walking the
  // list quietly lost coverage for whatever fell off it.
  assert.deepEqual(
    parseWorkspacePackages(
      'packages:\n  - bulma-ui\n  - create-bestax # scaffolder\n  - bestax-migrate\n'
    ),
    ['bulma-ui', 'create-bestax', 'bestax-migrate']
  );
});

test('a hash inside a token is a scalar, not a comment', () => {
  // YAML only starts a comment after whitespace; stripping every `#` would
  // mis-parse `a#b` as `a`, which is the same silent-wrong-answer class.
  assert.deepEqual(parseWorkspacePackages('packages:\n  - a#b\n'), ['a#b']);
});

test('a glob entry throws naming the limitation', () => {
  // Nothing expands globs here, so returning it as literal text sent the
  // failure two calls downstream as a confusing unreadable-manifest error.
  assert.throws(
    () => parseWorkspacePackages('packages:\n  - packages/*\n'),
    /glob.*List each directory explicitly/s
  );
});

test('a flow sequence throws instead of parsing as nothing', () => {
  // `packages: [a, b]` used to return [] and surface as the vaguer "no
  // packages: entries" guard, two calls from the cause.
  assert.throws(
    () => parseWorkspacePackages('packages: [a, b]\n'),
    /flow sequence/
  );
});

test('a quoted scalar hiding a comment throws instead of misparsing', () => {
  // `- "docs # archive"` is one scalar in YAML, but the comment strip cannot
  // know it is inside quotes; it used to come back as `docs` — the wrong
  // directory, inspected with confidence. The mutilated token it leaves
  // behind (an opening quote with no closer) is the fingerprint the parser
  // now throws on. Each delimiter is validated independently (#545 review):
  // the valid `- "foo's"` parses, and the malformed `- "foo'` throws rather
  // than shedding both mismatched quotes.
  assert.throws(
    () => parseWorkspacePackages('packages:\n  - "docs # archive"\n'),
    /quoted scalar|stray quote/
  );
  assert.deepEqual(parseWorkspacePackages(`packages:\n  - "foo's"\n`), [
    "foo's",
  ]);
  assert.throws(
    () => parseWorkspacePackages(`packages:\n  - "foo'\n`),
    /quoted scalar/
  );
});

test('an unreadable sequence entry throws instead of truncating', () => {
  // `- &core bulma-ui` is valid YAML this parser cannot read. Breaking there
  // would silently drop the entry AND everything after it — the fail-open
  // truncation #438 exists to end — so any dash line that fails the match
  // throws, and only a dedented line ends the block.
  assert.throws(
    () => parseWorkspacePackages('packages:\n  - &core bulma-ui\n  - docs\n'),
    /cannot parse the entry/
  );
  assert.throws(
    () => parseWorkspacePackages('packages:\n  - "foo bar"\n'),
    /cannot parse the entry/
  );
});

test('quotes, blank lines, and comment lines still parse as before', () => {
  assert.deepEqual(
    parseWorkspacePackages(
      'packages:\n  - \'bulma-ui\'\n\n  # a note\n  - "docs"\nminimumReleaseAge: 1\n'
    ),
    ['bulma-ui', 'docs']
  );
});

// --- the rule ----------------------------------------------------------------
//
// Every package carrying a pack-time specifier is declared exempt for it, so
// none of these branches executes during a real run. Without them, inverting
// the rule leaves CI green.

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

test('every declared package disables the npm plugin publish step', async () => {
  // The other half of the publish decision, and the half with no symptom.
  // @semantic-release/npm is kept ONLY for its prepare step, which writes the
  // version the release commit carries. Delete `npmPublish: false` and it
  // publishes with `npm publish` first — shipping whatever pack-time protocol
  // the manifest holds, which is #412 — and THEN the exec plugin runs
  // `pnpm publish` against a version that is already on the registry.
  //
  // Every other assertion here pins the exec half. Nothing pinned this one, so
  // deleting one line left the whole suite green.
  for (const dir of DECLARED) {
    const npm = await npmOptions(dir);
    assert.ok(
      npm,
      `${dir} must keep @semantic-release/npm for its prepare step`
    );
    assert.equal(
      npm.npmPublish,
      false,
      `${dir} must set npmPublish: false, or it publishes twice`
    );
  }
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
    // The release-info tail is pointed by --dir= and has the same failure
    // mode. Read through tokenize rather than a regex over the raw command:
    // the path is shell-quoted, so a checkout under "~/My Projects" or a
    // directory with an apostrophe puts characters inside the quotes that a
    // naive pattern reads as the end of the argument. The first version of
    // this assertion did exactly that and would have failed CI for those
    // contributors — which is the case shell-words exists to survive.
    const dirArg = tokenize(exec.publishCmd)
      .filter(w => w.startsWith('--dir='))
      .map(w => w.slice('--dir='.length));
    assert.equal(dirArg.length, 1, `${dir}: expected exactly one --dir`);
    assert.equal(
      basename(dirArg[0]),
      dir,
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

// --- the sibling-at-runtime rule (#537) --------------------------------------
//
// Driven with an explicit name set because the rule is pure and the real set
// is derived inside the async walk. The violating fixtures below use pairs that
// are NOT in SIBLING_RUNTIME_DEPS, because the declared pair (#644) is the one
// the real tree carries and it passes — the same seam rationale as everything
// above: a test that used the real, exempt pair would pass with the rule off.

const SIBLINGS = new Map([
  ['@allxsmith/bestax-bulma', { private: false }],
  ['create-bestax', { private: false }],
  ['bestax-migrate', { private: false }],
  ['bestax-mcp', { private: false }],
  ['@allxsmith/bestax-docs', { private: true }],
]);

test('a plain-semver sibling in dependencies is flagged, whatever the range', () => {
  const v = siblingViolations(
    'bestax-mcp',
    {
      name: 'bestax-mcp',
      dependencies: { 'create-bestax': '^4' },
    },
    SIBLINGS
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /consumers of bestax-mcp/);
  assert.match(v[0], /#537/);
});

test('an optionalDependencies sibling is flagged the same way', () => {
  const v = siblingViolations(
    'bestax-mcp',
    { name: 'bestax-mcp', optionalDependencies: { 'create-bestax': '^4' } },
    SIBLINGS
  );
  assert.equal(v.length, 1);
});

test('a peer sibling is outside this rule, deliberately', () => {
  // A departure from the protocol rule, which does fire on a workspace: peer:
  // peers are the one section where "consumers install this" is the intended
  // semantic. The protocol rule still polices HOW a peer is spelled.
  assert.deepEqual(
    siblingViolations(
      'bulma-ui',
      {
        name: '@allxsmith/bestax-bulma',
        peerDependencies: { 'bestax-mcp': '^1' },
      },
      SIBLINGS
    ),
    []
  );
});

test('a devDependencies sibling stays legal — it reaches no consumer', () => {
  assert.deepEqual(
    siblingViolations(
      'bestax-migrate',
      {
        name: 'bestax-migrate',
        devDependencies: { '@allxsmith/bestax-bulma': 'workspace:^' },
      },
      SIBLINGS
    ),
    []
  );
});

test('a private package may depend on any sibling it likes', () => {
  // docs really does dep the library; nobody installs docs from a registry.
  assert.deepEqual(
    siblingViolations(
      'docs',
      {
        name: '@allxsmith/bestax-docs',
        private: true,
        dependencies: { '@allxsmith/bestax-bulma': 'workspace:*' },
      },
      SIBLINGS
    ),
    []
  );
});

test("a non-sibling dependency is still nobody's business", () => {
  assert.deepEqual(
    siblingViolations(
      'bestax-migrate',
      { name: 'bestax-migrate', dependencies: { bulma: '^1.0.4' } },
      SIBLINGS
    ),
    []
  );
});

test('an npm alias pointing at a sibling is still a sibling', () => {
  // `"ui": "npm:@allxsmith/bestax-bulma@^5"` installs the sibling under
  // another key, so a key-only comparison was bypassable by renaming —
  // review caught the hole. The message names both the target and the alias.
  const v = siblingViolations(
    'bestax-mcp',
    {
      name: 'bestax-mcp',
      dependencies: { scaffold: 'npm:create-bestax@^4' },
    },
    SIBLINGS
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /"create-bestax"/);
  assert.match(v[0], /aliased as "scaffold"/);
});

test('a private sibling is not offered the peerDependency escape', () => {
  // docs is unpublishable, so "make it a peerDependency" would leave every
  // consumer unable to install. The advice must not name an impossible fix.
  const v = siblingViolations(
    'bestax-migrate',
    {
      name: 'bestax-migrate',
      dependencies: { '@allxsmith/bestax-docs': 'workspace:*' },
    },
    SIBLINGS
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /private and unpublishable/);
  assert.doesNotMatch(v[0], /make it a peerDependency/);
});

test('one violation, one fix: the sibling rule owns a workspace: sibling dep', () => {
  // Before the dedupe, a `workspace:^` sibling in dependencies drew BOTH the
  // protocol rule (pin a range) and the sibling rule (move to devDependencies)
  // — contradictory advice for one defect (#546 review). The sibling rule's
  // fix is the correct one, so the protocol rule stands down by name; a
  // `catalog:` entry pointing at an EXTERNAL package is no sibling and stays
  // protocol-flagged.
  const siblings = new Map([['create-bestax', { private: false }]]);
  const pkg = {
    name: 'bestax-mcp',
    dependencies: { 'create-bestax': 'workspace:^' },
  };
  const protocol = manifestViolations('bestax-mcp', pkg, siblings).filter(v =>
    v.includes('create-bestax')
  );
  const sibling = siblingViolations('bestax-mcp', pkg, siblings);
  assert.equal(protocol.length, 0);
  assert.equal(sibling.length, 1);
  assert.match(sibling[0], /Move it to devDependencies/);

  const external = manifestViolations(
    'x',
    { name: 'x', dependencies: { leftpad: 'catalog:' } },
    siblings
  );
  assert.ok(external.some(v => v.includes('leftpad')));
});

// --- the declared runtime siblings (#644) -------------------------------------
//
// SIBLING_RUNTIME_DEPS is the one way through the rule above. These pin its
// edges: exempt exactly the declared (directory, target) pair in
// `dependencies`, and nothing adjacent to it.

test('a declared runtime sibling in dependencies is exempt', () => {
  for (const [dir, targets] of SIBLING_RUNTIME_DEPS) {
    for (const target of targets) {
      assert.deepEqual(
        siblingViolations(
          dir,
          { name: dir, dependencies: { [target]: 'workspace:^' } },
          SIBLINGS
        ),
        [],
        `${dir} -> ${target}`
      );
    }
  }
});

test('the exemption is by target, so an alias to a declared sibling is exempt too', () => {
  assert.deepEqual(
    siblingViolations(
      'create-bestax',
      {
        name: 'create-bestax',
        dependencies: { ui: 'npm:@allxsmith/bestax-bulma@^5' },
      },
      SIBLINGS
    ),
    []
  );
});

test('a declared sibling in optionalDependencies is still flagged', () => {
  const v = siblingViolations(
    'create-bestax',
    {
      name: 'create-bestax',
      optionalDependencies: { '@allxsmith/bestax-bulma': 'workspace:^' },
    },
    SIBLINGS
  );
  assert.equal(v.length, 1, v.join('\n'));
});

test('a declared directory depending on a different sibling is still flagged', () => {
  const v = siblingViolations(
    'create-bestax',
    { name: 'create-bestax', dependencies: { 'bestax-mcp': 'workspace:^' } },
    SIBLINGS
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /"bestax-mcp"/);
});

test('an undeclared directory depending on a declared target is still flagged', () => {
  const v = siblingViolations(
    'bulma-ui',
    {
      name: '@allxsmith/bestax-bulma',
      dependencies: { 'create-bestax': 'workspace:^' },
    },
    SIBLINGS
  );
  assert.equal(v.length, 1, v.join('\n'));
});

test('a private sibling is never exempt, even when declared', () => {
  // The real map cannot declare a private target without failing the reality
  // test below, so the guard is reached the only other way: a fixture
  // declaration that does. The same fixture shape with a public target IS
  // exempt, so the guard is what makes the difference, not the fixture.
  const privateDecl = new Map([
    ['bestax-migrate', new Set(['@allxsmith/bestax-docs'])],
  ]);
  const v = siblingViolations(
    'bestax-migrate',
    {
      name: 'bestax-migrate',
      dependencies: { '@allxsmith/bestax-docs': 'workspace:*' },
    },
    SIBLINGS,
    privateDecl
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /private and unpublishable/);

  const publicDecl = new Map([
    ['bestax-migrate', new Set(['@allxsmith/bestax-bulma'])],
  ]);
  assert.deepEqual(
    siblingViolations(
      'bestax-migrate',
      {
        name: 'bestax-migrate',
        dependencies: { '@allxsmith/bestax-bulma': 'workspace:^' },
      },
      SIBLINGS,
      publicDecl
    ),
    []
  );
});

test('dependencyTarget follows an npm alias in either direction', () => {
  assert.equal(
    dependencyTarget('ui', 'npm:@allxsmith/bestax-bulma@^5'),
    '@allxsmith/bestax-bulma'
  );
  assert.equal(
    dependencyTarget('ui', 'npm:@allxsmith/bestax-bulma'),
    '@allxsmith/bestax-bulma'
  );
  // The sibling's own key pointing somewhere else is NOT a dependency on it.
  assert.equal(
    dependencyTarget('@allxsmith/bestax-bulma', 'npm:other@^1'),
    'other'
  );
  assert.equal(
    dependencyTarget('@allxsmith/bestax-bulma', 'workspace:^'),
    '@allxsmith/bestax-bulma'
  );
  assert.equal(dependencyTarget('bulma', '^1.0.4'), 'bulma');
});

test('every declared runtime sibling matches the real manifests', () => {
  // The declaration is the exemption, so it has to describe the tree as it is:
  // a directory that stopped depending on the sibling must lose its line, or
  // the exemption outlives the dependency it was granted for. Read through the
  // same helpers as the PNPM_PUBLISHED checks above, so an unreadable manifest
  // throws rather than shrinking the set.
  const manifests = new Map(
    parseWorkspacePackages(repoFile('pnpm-workspace.yaml')).map(dir => [
      dir,
      JSON.parse(repoFile(`${dir}/package.json`)),
    ])
  );
  const privateByName = new Map(
    [...manifests.values()].map(p => [p.name, Boolean(p.private)])
  );
  assert.ok(SIBLING_RUNTIME_DEPS.size > 0, 'SIBLING_RUNTIME_DEPS is empty');
  for (const [dir, targets] of SIBLING_RUNTIME_DEPS) {
    assert.ok(
      DECLARED.has(dir),
      `${dir} is declared in SIBLING_RUNTIME_DEPS but not in PNPM_PUBLISHED`
    );
    const pkg = manifests.get(dir);
    assert.ok(pkg, `${dir} is not a workspace package`);
    for (const target of targets) {
      assert.ok(
        privateByName.has(target),
        `${target} is not a workspace package`
      );
      assert.equal(privateByName.get(target), false, `${target} is private`);
      // Compared on what each entry installs, not on its key, exactly as the
      // rule compares: `"@allxsmith/bestax-bulma": "npm:other@^1"` would keep
      // the key and drop the dependency, and a key check would keep the
      // exemption standing over it.
      const installs = new Set(
        Object.entries(pkg.dependencies ?? {}).map(([n, spec]) =>
          dependencyTarget(n, spec)
        )
      );
      assert.ok(
        installs.has(target),
        `${dir} declares ${target} in SIBLING_RUNTIME_DEPS but nothing in ` +
          `its package.json dependencies installs it`
      );
    }
  }
});

/**
 * Entry-point extensions (#688).
 *
 * `type` decides what a `.js` file means, so a `"type": "module"` package's
 * CommonJS bundle at `dist/index.cjs.js` is read as ESM and cannot load
 * through `require`. The extension is the only thing that overrides `type`.
 * Fixture-driven like the rules above, plus one test against the real
 * manifests so the repo cannot drift back into it.
 */
const entryViolations = pkg =>
  manifestViolations('pkg', pkg).filter(v => v.includes('#688'));

test('a type:module package may not require a .js entry', () => {
  const found = entryViolations({
    name: 'x',
    type: 'module',
    main: 'dist/index.cjs.js',
    exports: { '.': { require: './dist/index.cjs.js' } },
  });
  // Only the exports condition. `main` is not judged: an `exports` map means
  // Node never reads it.
  assert.equal(found.length, 1, found.join('\n'));
  assert.ok(found.every(v => v.includes('`.cjs`')));
});

test('a type:module package requiring a .cjs entry is fine', () => {
  assert.deepEqual(
    entryViolations({
      name: 'x',
      type: 'module',
      main: 'dist/index.cjs',
      exports: {
        '.': { import: './dist/index.esm.js', require: './dist/index.cjs' },
      },
    }),
    []
  );
});

test('the import direction is deliberately not judged', () => {
  // It looks symmetrical and is not. Node's `import` condition matches
  // regardless of the target's format, and importing a CommonJS file is legal,
  // so a `.js` import target says nothing about whether the file loads. Judging
  // it failed a CommonJS package serving one file to both conditions, and
  // advised a `.mjs` rename that would have broken it.
  assert.deepEqual(
    entryViolations({
      name: 'x',
      exports: { '.': { import: './index.js', require: './index.js' } },
    }),
    []
  );
  assert.deepEqual(
    entryViolations({
      name: 'x',
      exports: { '.': { import: './dist/index.esm.js' } },
    }),
    []
  );
});

test('condition ORDER decides the require path, not membership', () => {
  // Node walks a conditions object in key order and takes the first match, so
  // a `default` written above `require` is what `require()` actually resolves.
  // Reading the keys as an unordered set left exactly that shape silent.
  const first = entryViolations({
    name: 'x',
    type: 'module',
    exports: { '.': { default: './a.js', require: './a.cjs' } },
  });
  assert.equal(first.length, 1, first.join('\n'));
  assert.ok(first[0].includes('exports["."].default'), first[0]);

  // `node` matches a require() too, so it outranks a later `require`.
  const second = entryViolations({
    name: 'x',
    type: 'module',
    exports: { '.': { node: './x.js', require: './x.cjs' } },
  });
  assert.equal(second.length, 1, second.join('\n'));
  assert.ok(second[0].includes('exports["."].node'), second[0]);

  // Written the right way round, the same targets are correct.
  assert.deepEqual(
    entryViolations({
      name: 'x',
      type: 'module',
      exports: { '.': { require: './a.cjs', default: './a.js' } },
    }),
    []
  );
});

test('a require nested inside import is unreachable and not judged', () => {
  // `import` is not a key `require()` matches, so nothing below it resolves for
  // require — the mirror of the over-reach this rule kept making.
  assert.deepEqual(
    entryViolations({
      name: 'x',
      type: 'module',
      exports: { '.': { import: { require: './a.js' } } },
    }),
    []
  );
});

test('a map that does not distinguish the formats is left alone', () => {
  // Without a `require` or `import` key there is nothing to tell a CommonJS
  // target from what an honestly ESM-only package writes, so both the bare
  // string and a `default`-only map stay unjudged.
  assert.deepEqual(
    entryViolations({ name: 'x', type: 'module', exports: './index.js' }),
    []
  );
  assert.deepEqual(
    entryViolations({
      name: 'x',
      type: 'module',
      exports: { '.': { default: './index.js' } },
    }),
    []
  );
});

test('an array fallback stops at the first valid target', () => {
  // Node does not keep going past a valid "./…" entry, so a later one is
  // unreachable. Judging every entry reddened a manifest that loads — this test
  // asserted the wrong behaviour until the resolver replaced the walk.
  assert.deepEqual(
    entryViolations({
      name: 'x',
      type: 'module',
      exports: { '.': { import: './a.mjs', require: ['./a.cjs', './b.js'] } },
    }),
    []
  );

  // The first entry is the one that resolves, so a bad one there is real.
  const found = entryViolations({
    name: 'x',
    type: 'module',
    exports: { '.': { import: './a.mjs', require: ['./b.js', './a.cjs'] } },
  });
  assert.equal(found.length, 1, found.join('\n'));
  assert.ok(found[0].includes('exports["."].require.0'), found[0]);
});

test('a branch that maps nothing falls through to the next condition', () => {
  // Node does not stop at the first key it MATCHES, only at the first that
  // resolves: a `node` wrapper with no require mapping inside leaves the
  // `require` beside it still reachable.
  const found = entryViolations({
    name: 'x',
    type: 'module',
    exports: { '.': { node: { import: './a.mjs' }, require: './b.js' } },
  });
  assert.equal(found.length, 1, found.join('\n'));
  assert.ok(found[0].includes('exports["."].require'), found[0]);
});

test('a dual pair nested under a wrapper condition is judged', () => {
  // The shape Node's own docs use. Asking whether the map distinguishes the
  // formats one level up returned before ever reaching the `require` key.
  const found = entryViolations({
    name: 'x',
    type: 'module',
    exports: { '.': { node: { require: './a.js', import: './a.mjs' } } },
  });
  assert.equal(found.length, 1, found.join('\n'));
  assert.ok(found[0].includes('exports["."].node.require'), found[0]);
});

test('a null target blocks the subpath rather than falling through', () => {
  // Node stops on `null` and throws ERR_PACKAGE_PATH_NOT_EXPORTED; it does not
  // try the next key. Continuing past it flagged a target require() never
  // reaches.
  assert.deepEqual(
    entryViolations({
      name: 'x',
      type: 'module',
      exports: { '.': { import: './a.mjs', require: null, default: './x.js' } },
    }),
    []
  );
});

test('module-sync is recognised however it is spelled', () => {
  // It is ordinarily written with a `types` of its own, so the key that names
  // the file is `default`. Reading the exemption off that leaf key judged an
  // ESM target Node serves to require() by design.
  assert.deepEqual(
    entryViolations({
      name: 'x',
      type: 'module',
      exports: {
        '.': {
          'module-sync': { types: './m.d.ts', default: './m.js' },
          require: './m.cjs',
        },
      },
    }),
    []
  );
});

test('module-sync serves ESM by contract and is not judged', () => {
  // It matches a `require()`, but it exists so that require() can be handed an
  // ES module deliberately — a `.js` target there is the condition working.
  assert.deepEqual(
    entryViolations({
      name: 'x',
      type: 'module',
      exports: { '.': { 'module-sync': './m.js', require: './m.cjs' } },
    }),
    []
  );
});

test('the remedy names reordering when a non-require condition served it', () => {
  // Renaming a `node` or `default` target would break the import side, which
  // resolves the same file.
  const [viaDefault] = entryViolations({
    name: 'x',
    type: 'module',
    exports: { '.': { default: './a.js', require: './a.cjs' } },
  });
  assert.match(viaDefault, /Put a `require` condition ahead of it/);

  const [viaRequire] = entryViolations({
    name: 'x',
    type: 'module',
    exports: { '.': { import: './a.mjs', require: './a.js' } },
  });
  assert.match(viaRequire, /Emit it with a `\.cjs` extension/);
});

test('a map with no require condition is left alone', () => {
  // `require()` does fall through to `default` here, but an `import` key is not
  // enough to prove the package MEANT a CommonJS target: an ESM-only package
  // naming one file for both conditions has the same shape, and telling it to
  // ship a `.cjs` it has no build for is the false positive this rule kept
  // producing. An explicit `require` key is the signal that is not a guess.
  assert.deepEqual(
    entryViolations({
      name: 'x',
      type: 'module',
      exports: { '.': { import: './a.mjs', default: './index.cjs.js' } },
    }),
    []
  );
  assert.deepEqual(
    entryViolations({
      name: 'x',
      type: 'module',
      exports: { '.': { import: './x.js', default: './x.js' } },
    }),
    []
  );
});

test('a default below an explicit require IS judged', () => {
  // With a `require` key present the package is declaring a dual build, so the
  // ordering bug is real rather than ambiguous.
  const found = entryViolations({
    name: 'x',
    type: 'module',
    exports: { '.': { default: './a.js', require: './a.cjs' } },
  });
  assert.equal(found.length, 1, found.join('\n'));
  assert.ok(found[0].includes('exports["."].default'), found[0]);
});

test('default is not a require path when a require sibling outranks it', () => {
  // `require` matches first, so `default` is serving some other condition and
  // judging it would flag a correct manifest.
  assert.deepEqual(
    entryViolations({
      name: 'x',
      type: 'module',
      exports: {
        '.': { import: './a.js', require: './a.cjs', default: './a.js' },
      },
    }),
    []
  );
});

test('a commonjs package may point main at a .js entry', () => {
  assert.deepEqual(entryViolations({ name: 'x', main: 'dist/index.js' }), []);
});

test('an ESM-only package may point main at a .js entry', () => {
  // `main` is not simply a require path: with no `exports`, Node's ESM resolver
  // reaches it through legacyMainResolve, so this is the ordinary ESM-only
  // package. Judging `main` unconditionally reported it as broken, with advice
  // that would have pointed an ESM entry at a `.cjs` file.
  assert.deepEqual(
    entryViolations({ name: 'x', type: 'module', main: 'dist/index.js' }),
    []
  );
});

test('main is never judged', () => {
  // An `exports` map means Node does not read `main` at all, and without one
  // there is no `require` condition to say the package distinguishes the
  // formats. Judging it whenever `exports` resolved a require target had it
  // exactly backwards, and flagged real packages (`node-emoji`, `unplugin`)
  // whose maps are correct.
  assert.deepEqual(
    entryViolations({
      name: 'x',
      type: 'module',
      main: 'dist/index.cjs.js',
      exports: { '.': { require: './dist/index.cjs' } },
    }),
    []
  );
  assert.deepEqual(
    entryViolations({ name: 'x', type: 'module', main: 'dist/index.cjs.js' }),
    []
  );
});

test('a require condition spelled as an object is walked into', () => {
  // The standard dual-package shape, with per-condition types. A walk that
  // recorded only string-valued `require` keys saw nothing here — the exact
  // #688 defect, invisible to the gate meant to catch it.
  const found = entryViolations({
    name: 'x',
    type: 'module',
    exports: {
      '.': { require: { types: './d.d.cts', default: './dist/index.cjs.js' } },
    },
  });
  assert.equal(found.length, 1, found.join('\n'));
  assert.ok(found[0].includes('exports["."].require.default'), found[0]);
});

test('a types condition is never judged as code', () => {
  // `types` names a declaration file, which has its own extension rules.
  assert.deepEqual(
    entryViolations({
      name: 'x',
      type: 'module',
      exports: {
        '.': { types: './dist/types/index.d.ts', require: './x.cjs' },
      },
    }),
    []
  );
});

test('nested export conditions are walked, not just the top level', () => {
  // A subpath's condition is as loadable-or-not as the root's, and the rule
  // that only read `exports['.']` would have passed the package that bit.
  const found = entryViolations({
    name: 'x',
    type: 'module',
    exports: { './constants': { require: './dist/constants.cjs.js' } },
  });
  assert.equal(found.length, 1, found.join('\n'));
  assert.ok(found[0].includes('exports["./constants"].require'));
});

test('every published manifest loads through the condition it advertises', () => {
  for (const dir of parseWorkspacePackages(repoFile('pnpm-workspace.yaml'))) {
    const pkg = JSON.parse(repoFile(`${dir}/package.json`));
    assert.deepEqual(
      entryViolations(pkg),
      [],
      `${dir} advertises an entry point Node cannot load as the format it claims`
    );
  }
});

test('every entry point the manifest advertises is emitted in that format', async () => {
  // The manifest half of #688 is the conformance rule; this is the artifact
  // half. Nothing in this suite builds the package, so the rule alone would let
  // a rollup change ship a manifest promising a file the build no longer writes
  // — or, worse, writes in the other format under the right name.
  //
  // The config is IMPORTED rather than pattern-matched, so this reads what
  // rollup is actually configured to emit: a name matched by regex would pass
  // while `entryFileNames` sat in the wrong output block.
  const rollup = (await import('../bulma-ui/rollup.config.js')).default({});
  const emitted = new Map();
  for (const entry of rollup) {
    for (const output of [].concat(entry.output ?? [])) {
      if (!output.entryFileNames) continue;
      // Rollup treats `es`, `esm` and `module` as one format, so comparing the
      // literal would fail a correct build that spelled the ES output any of
      // the other ways.
      const format = ['es', 'esm', 'module'].includes(output.format)
        ? 'esm'
        : output.format;
      emitted.set(output.entryFileNames, format);
    }
  }
  assert.ok(emitted.size > 0, 'rollup.config.js emits no named entry points');

  // `require` must land on a CommonJS bundle and `import` on an ES one. Walked
  // rather than read off `exports['.']`, since `./constants` spells both as
  // objects.
  const expected = { require: 'cjs', import: 'esm' };
  const pkg = JSON.parse(repoFile('bulma-ui/package.json'));
  const checked = [];
  const walk = (node, label, condition) => {
    if (typeof node === 'string') {
      if (!condition) return;
      const name = basename(node);
      // Judged by EXTENSION, not by whether the name happens to be emitted:
      // skipping unknown names let a newly advertised bundle pointing at a file
      // rollup never writes pass unnoticed. CSS and SCSS targets are not
      // bundles and have no format to check.
      if (!/\.(js|cjs|mjs)$/.test(name)) return;
      checked.push(label);
      assert.ok(
        emitted.has(name),
        `${label} points at ${name}, which rollup.config.js does not emit ` +
          `(it emits ${[...emitted.keys()].join(', ')})`
      );
      assert.equal(
        emitted.get(name),
        expected[condition],
        `${label} points at ${name}, which rollup emits as ` +
          `'${emitted.get(name)}' rather than '${expected[condition]}'`
      );
      return;
    }
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (key === 'types') continue;
      const seg = key.startsWith('.') ? `[${JSON.stringify(key)}]` : `.${key}`;
      walk(
        value,
        `${label}${seg}`,
        key === 'require' || key === 'import' ? key : condition
      );
    }
  };
  walk(pkg.exports, 'exports', undefined);

  // Fails closed: if the walk stops finding bundles, the assertions above stop
  // running and nothing would notice.
  assert.ok(
    checked.length >= 4,
    `only checked ${checked.length} entry points: ${checked.join(', ')}`
  );
});

test('the root entry really loads through both conditions', async () => {
  // #688 is a LOADING failure, and the rest of this gate is static — the
  // manifest rule reads JSON, the rollup test reads config. Neither would
  // notice the bundle itself becoming unloadable, which is the thing the issue
  // was actually about. `./constants` has had a real load test since #686; this
  // is the same check one subpath up.
  const repo = fileURLToPath(new URL('..', import.meta.url));
  assert.ok(
    existsSync(join(repo, 'bulma-ui', 'dist')),
    'bulma-ui/dist is absent, so this cannot load what it exists to check. ' +
      'Run `pnpm --filter @allxsmith/bestax-bulma build` first, or the whole ' +
      'gate with `pnpm all`.'
  );

  // Resolved by SPECIFIER so Node's own condition matching picks the file:
  // loading the path out of the manifest would prove the file works and say
  // nothing about the map choosing it. The anchor sits in a package that
  // declares the dependency, because the linker is isolated.
  const consumerRequire = createRequire(
    pathToFileURL(join(repo, 'bestax-migrate', 'package.json')).href
  );
  const cjs = consumerRequire('@allxsmith/bestax-bulma');
  assert.ok(
    Object.keys(cjs).length > 0,
    'the require condition produced no exports — the symptom of a CommonJS ' +
      'bundle being read as ESM, which yields an empty namespace object on a ' +
      'Node with require(esm) and throws on an older one (#688)'
  );
  assert.ok(cjs.Button, 'the require condition served no Button');

  // The import side is loaded by PATH: a bare specifier does not resolve from
  // the repo root under the isolated linker, and the require side above is
  // where specifier resolution is the thing under test.
  const pkgManifest = JSON.parse(repoFile('bulma-ui/package.json'));
  const esm = await import(
    pathToFileURL(
      join(
        repo,
        'bulma-ui',
        pkgManifest.exports['.'].import.replace(/^\.\//, '')
      )
    ).href
  );
  // Both conditions must serve the same surface, or what a consumer gets
  // depends on how they happened to load it.
  assert.deepEqual(
    Object.keys(cjs).sort(),
    Object.keys(esm)
      .filter(k => k !== 'default')
      .sort(),
    'the require and import conditions export different names'
  );
});
