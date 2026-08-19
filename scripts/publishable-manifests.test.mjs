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
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  hookScripts,
  manifestViolations,
  parseWorkspacePackages,
} from './check-conformance.mjs';

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

const PUBLISHABLE = parseWorkspacePackages(
  repoFile('pnpm-workspace.yaml')
).filter(dir => {
  try {
    return !JSON.parse(repoFile(`${dir}/package.json`)).private;
  } catch {
    return false;
  }
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

for (const dir of PUBLISHABLE) {
  test(`${dir}: the release config agrees with the declaration`, () => {
    // Read as TEXT on purpose. Deciding "does this publish with pnpm" by
    // parsing the config is what failed four times; a substring is dumb enough
    // to be right, and its failure mode is a red test rather than a silent
    // exemption.
    let source = '';
    for (const name of [
      'release.config.js',
      'release.config.mjs',
      'release.config.cjs',
      '.releaserc',
      '.releaserc.js',
      '.releaserc.json',
      '.releaserc.yaml',
      '.releaserc.yml',
    ]) {
      try {
        source = repoFile(`${dir}/${name}`);
        break;
      } catch {
        /* try the next name */
      }
    }

    const runsPnpmPublish = /pnpm[^\n'"]*\bpublish\b/.test(source);
    if (DECLARED.has(dir)) {
      assert.ok(
        runsPnpmPublish,
        `${dir} is declared in PNPM_PUBLISHED but its release config never ` +
          `runs pnpm publish, so it holds an exemption it has not earned.`
      );
    } else {
      assert.ok(
        !runsPnpmPublish,
        `${dir}'s release config runs pnpm publish but ${dir} is not declared ` +
          `in PNPM_PUBLISHED, so it is being held to the npm rule. Declare it, ` +
          `or remove the mention.`
      );
    }
  });
}

test('bestax-migrate is the one declared package, and it wires the guard', () => {
  // Stated rather than derived, so adding a package to the declaration is a
  // deliberate act that fails this test first.
  assert.deepEqual([...DECLARED], ['bestax-migrate']);
  const pkg = JSON.parse(repoFile('bestax-migrate/package.json'));
  assert.match(pkg.scripts.prepublishOnly, /require-pnpm-publish\.mjs/);
});

test('the declared package passes --provenance and --embed-readme', () => {
  // Neither is optional and neither fails loudly if dropped: pnpm ignores
  // publishConfig.provenance, and defaults embed-readme to false where npm
  // defaults it true.
  const source = repoFile('bestax-migrate/release.config.js');
  assert.match(source, /--provenance/);
  assert.match(source, /--embed-readme/);
});

test('the scripts the release config names all exist', () => {
  // The guard the deleted pack-hook block carried. Asserted against the real
  // config, where the paths are absolute and computed at load time.
  const source = repoFile('bestax-migrate/release.config.js');
  const named = [...source.matchAll(/'([\w-]+\.mjs)'/g)].map(m => m[1]);
  assert.ok(
    named.length > 0,
    'expected the config to name at least one script'
  );
  for (const name of named) {
    assert.doesNotThrow(
      () => repoFile(`scripts/${name}`),
      `release.config.js names scripts/${name}, which does not exist`
    );
  }
});

test('the release stays on a single branch, or the dist-tag needs revisiting', () => {
  // publishCmd passes no --tag, which is only correct while every release goes
  // to `latest`. @semantic-release/npm's get-channel.js maps a channel that is
  // a valid semver range to `release-<channel>`, and nothing here reimplements
  // that.
  assert.match(
    repoFile('bestax-migrate/release.config.js'),
    /branches: \['main'\]/
  );
});

// --- the rule ----------------------------------------------------------------
//
// bestax-migrate is the only package carrying a pack-time specifier and it is
// exempt for that one, so none of these branches executes during a real run.
// Without them, inverting the rule leaves CI green.

// A declared package must also wire the prepublishOnly guard, so fixtures for
// the pnpm side carry it; otherwise every one of them picks up that violation
// instead of the one under test.
const GUARD = { prepublishOnly: 'node ../scripts/require-pnpm-publish.mjs' };

const WS = spec => ({
  scripts: GUARD,
  devDependencies: { '@allxsmith/bestax-bulma': spec },
});

// Real directory names, because manifestViolations consults the declaration
// itself. `bulma-ui` is not declared, so it stands for an npm publisher;
// `bestax-migrate` is, so it stands for a pnpm one. A rule that ignored the
// declaration would pass fixtures that carried the verdict as an argument.
const NPM_PKG = 'bulma-ui';
const PNPM_PKG = 'bestax-migrate';

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
    assert.match(v[0], /#412/);
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
    assert.match(v[0], /made to install/);
    // And must not tell a pnpm publisher to switch to pnpm publish.
    assert.doesNotMatch(v[0], /move bestax-migrate to `pnpm publish`/);
  }
});

test('each message explains the failure that actually applies', () => {
  const npm = manifestViolations(NPM_PKG, WS('workspace:^'))[0];
  const jsr = manifestViolations(PNPM_PKG, WS('jsr:@s/p@^1'))[0];
  const consumer = manifestViolations(PNPM_PKG, {
    scripts: GUARD,
    dependencies: { x: 'workspace:^' },
  })[0];
  assert.match(npm, /npm publish/);
  assert.match(jsr, /@jsr registry/);
  assert.match(consumer, /devDependencies/);
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
    hookScripts({ scripts: { prepare: 'bash ./scripts/g.sh' } }),
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
  const v = manifestViolations('bulma-ui', WS('workspace:^'));
  assert.equal(v.length, 1, 'bulma-ui is not declared and must not be exempt');
  assert.match(v[0], /npm publish/);
  // …and the declared one still is.
  assert.deepEqual(manifestViolations('bestax-migrate', WS('workspace:^')), []);
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
  // bulma-ui has no exemption, so it has nothing to compensate for.
  const v = manifestViolations(NPM_PKG, { dependencies: { bulma: '^1.0.4' } });
  assert.deepEqual(v, []);
});
