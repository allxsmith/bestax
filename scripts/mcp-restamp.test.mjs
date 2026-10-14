/**
 * Covers the MCP index restamp in ci.yml's publish job (#521, #932, #993).
 *
 * Two steps do it. "Regenerate the MCP index" runs the generator without the
 * release App's token, and "Commit and push the MCP index restamp" holds the
 * token and runs nothing from the repository. That second property is why the
 * push's retry loop stays in the workflow rather than moving to a script here:
 * a script would be repository code running beside the token. So these tests
 * read the step out of ci.yml and run it in bash against scratch remotes, the
 * way gen-skills-repo.test.mjs runs skills-publish's steps.
 */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  yamlGet,
  yamlItems,
  yamlMap,
  yamlScalar,
} from './check-conformance.mjs';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CI = '.github/workflows/ci.yml';
const REGENERATE = 'Regenerate the MCP index';
const PUSH = 'Commit and push the MCP index restamp';
const RELEASE = /^Semantic Release \((.+)\)$/;
const APP_TOKEN = '${{ steps.app-token.outputs.token }}';

/** The publish job's steps, in order, each with its name, keys and env. */
function publishSteps() {
  const lines = fs.readFileSync(path.join(REPO, CI), 'utf8').split('\n');
  const job = yamlGet(lines, 'jobs', 'publish');
  assert.ok(job, `${CI} has a publish job`);
  return yamlItems(yamlGet(job.lines, 'steps')?.lines ?? []).map(step => ({
    name: yamlScalar(yamlGet(step, 'name')),
    get: key => yamlScalar(yamlGet(step, key)),
    env: new Map(
      [...yamlMap(yamlGet(step, 'env')?.lines ?? [])].map(([key, entry]) => [
        key,
        yamlScalar(entry),
      ])
    ),
  }));
}

const stepNamed = (steps, name) => {
  const found = steps.filter(s => s.name === name);
  assert.equal(found.length, 1, `exactly one "${name}" step in publish`);
  return found[0];
};

const indexOf = (steps, name) => steps.indexOf(stepNamed(steps, name));

// --- where the steps sit ------------------------------------------------------

test('the index is regenerated after bulma-ui releases and before bestax-mcp does', () => {
  // #932: bestax-mcp packs data/ from the working tree, so a regeneration
  // after its release ships the previous bulma-ui version's stamp.
  const steps = publishSteps();
  const regenerate = indexOf(steps, REGENERATE);
  assert.ok(indexOf(steps, 'Semantic Release (bulma-ui)') < regenerate);
  assert.ok(regenerate < indexOf(steps, 'Semantic Release (bestax-mcp)'));
});

test('the restamp push is the last step, after every release', () => {
  // #521: a failure in it must not be able to cost a release.
  const steps = publishSteps();
  assert.equal(steps.at(-1).name, PUSH);
  assert.ok(steps.some(s => RELEASE.test(s.name)));
});

test('the push runs only when the regeneration changed the index', () => {
  const steps = publishSteps();
  const id = stepNamed(steps, REGENERATE).get('id');
  assert.ok(id, `"${REGENERATE}" has an id`);
  assert.equal(
    stepNamed(steps, PUSH).get('if'),
    `steps.${id}.outputs.changed == 'true'`
  );
});

// --- what holds the token -----------------------------------------------------

test('only the releases and the restamp push hold the release token', () => {
  const holders = publishSteps()
    .filter(s => [...s.env.values()].some(v => v?.includes(APP_TOKEN)))
    .map(s => s.name);
  assert.ok(holders.includes(PUSH));
  assert.ok(!holders.includes(REGENERATE));
  for (const name of holders) {
    assert.ok(name === PUSH || RELEASE.test(name), `${name} holds the token`);
  }
});

test('the restamp push runs nothing from the repository', () => {
  // Comments and plain quoted text (the error messages name `pnpm gen:mcp`)
  // are not commands. A quoted string that substitutes one stays in.
  const code = stepNamed(publishSteps(), PUSH)
    .get('run')
    .split('\n')
    .filter(line => !line.trim().startsWith('#'))
    .join('\n')
    .replace(/"(?:[^"\\]|\\.)*"/g, s => (/\$\(|`/.test(s) ? s : '""'))
    .replace(/'[^']*'/g, "''");
  assert.doesNotMatch(code, /\b(pnpm|npm|npx|node|corepack|turbo|husky)\b/);
  assert.doesNotMatch(code, /(^|[\s;&|(])(\.\/|\.\s|source\s|scripts\/)/m);
});

test('no git hook can run in the restamp push, whichever command fires it', () => {
  // The env form reaches every git command in the step, which is the point.
  const { env } = stepNamed(publishSteps(), PUSH);
  assert.equal(env.get('GIT_CONFIG_COUNT'), '1');
  assert.equal(env.get('GIT_CONFIG_KEY_0'), 'core.hooksPath');
  assert.equal(env.get('GIT_CONFIG_VALUE_0'), '/dev/null');
});

// --- running the push step ----------------------------------------------------

const temps = [];
function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-restamp-'));
  temps.push(dir);
  return dir;
}
after(() => {
  for (const dir of temps) fs.rmSync(dir, { recursive: true, force: true });
});

const TOKEN = 'restamp-test-token';
const REPOSITORY = 'allxsmith/bestax';
const PUSH_URL = `https://x-access-token:${TOKEN}@github.com/${REPOSITORY}.git`;

/** Hooks the step's git commands could fire. */
const HOOKS = [
  'pre-commit',
  'prepare-commit-msg',
  'commit-msg',
  'post-commit',
  'pre-push',
  'post-checkout',
  'post-merge',
  'post-rewrite',
  'pre-rebase',
  'pre-auto-gc',
  'reference-transaction',
];

const executable = (file, body) => {
  fs.writeFileSync(file, body);
  fs.chmodSync(file, 0o755);
};

/** A catalog in the generator's shape, stamped `version`. */
const catalog = (version, components = ['Box', 'Button']) =>
  JSON.stringify(
    {
      schemaVersion: 2,
      generatedFrom: { package: '@allxsmith/bestax-bulma', version },
      docsBase: 'https://bestax.io/docs',
      categories: [{ id: 'elements', label: 'Elements', components }],
    },
    null,
    2
  ) + '\n';

const manifest = version =>
  JSON.stringify({ name: '@allxsmith/bestax-bulma', version }, null, 2) + '\n';

const CATALOG = 'bestax-mcp/data/catalog.json';
const BULMA_UI = 'bulma-ui/package.json';

/**
 * A release mid-flight: `remote.git` is main, carrying bulma-ui's release of
 * 1.1.0 on an index stamped 1.0.0, and `work` is the publish job's checkout,
 * with the regenerated index (stamped 1.1.0) not yet committed. Commits that
 * land on main during the release are made in `other` with `land`.
 */
function sandbox() {
  const root = tempDir();
  const at = (...parts) => path.join(root, ...parts);
  fs.mkdirSync(at('bin'));
  fs.mkdirSync(at('hooks'));

  // Stands in for gpg: git only needs a status line and something to embed.
  executable(
    at('bin', 'fake-gpg'),
    [
      '#!/bin/sh',
      'cat > /dev/null',
      'echo "[GNUPG:] KEY_CONSIDERED TESTKEY 0" >&2',
      'echo "[GNUPG:] SIG_CREATED D 1 8 00 0 TESTKEY" >&2',
      "printf '%s\\n' '-----BEGIN PGP SIGNATURE-----' '' 'dGVzdA==' '-----END PGP SIGNATURE-----'",
      '',
    ].join('\n')
  );
  // Records each wait instead of taking it, then runs that wait's scripted
  // event, if any, so a test can move main while the step is backing off.
  executable(
    at('bin', 'sleep'),
    [
      '#!/bin/sh',
      `echo "$1" >> '${at('sleeps')}'`,
      `n=$(wc -l < '${at('sleeps')}' | tr -d ' ')`,
      `[ -x '${root}/on-sleep-'"$n" ] && '${root}/on-sleep-'"$n"`,
      'exit 0',
      '',
    ].join('\n')
  );
  for (const hook of HOOKS) {
    executable(
      at('hooks', hook),
      `#!/bin/sh\necho ${hook} >> '${at('hooks-ran')}'\n`
    );
  }

  // The job's global identity, as "Import GPG key" leaves it, plus the
  // rewrites that send the step's github.com URL to scratch repositories:
  // fetches to `fetch`, pushes to `push`.
  const route = ({ fetch = 'remote.git', push = fetch } = {}) =>
    fs.writeFileSync(
      at('gitconfig'),
      [
        '[user]',
        '  name = Release Bot',
        '  email = release@example.com',
        '  signingkey = TESTKEY',
        '[commit]',
        '  gpgsign = true',
        '[gpg]',
        `  program = ${at('bin', 'fake-gpg')}`,
        '[init]',
        '  defaultBranch = main',
        '[advice]',
        '  detachedHead = false',
        `[url "${at(fetch)}"]`,
        `  insteadOf = ${PUSH_URL}`,
        `[url "${at(push)}"]`,
        `  pushInsteadOf = ${PUSH_URL}`,
        '',
      ].join('\n')
    );
  route();
  const env = {
    PATH: `${at('bin')}${path.delimiter}${process.env.PATH}`,
    HOME: root,
    GIT_CONFIG_GLOBAL: at('gitconfig'),
    GIT_CONFIG_NOSYSTEM: '1',
    LC_ALL: 'C',
  };
  const git = (cwd, ...args) =>
    execFileSync('git', args, {
      cwd,
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  const write = (dir, rel, text) => {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  };

  git(root, 'init', '--quiet', '--bare', 'remote.git');
  git(root, 'clone', '--quiet', 'remote.git', 'other');
  const other = at('other');
  write(other, BULMA_UI, manifest('1.0.0'));
  write(other, CATALOG, catalog('1.0.0'));
  write(other, 'docs/page.md', 'first\n');
  git(other, 'add', '.');
  git(other, 'commit', '--quiet', '-m', 'feat(bulma-ui): something');
  write(other, BULMA_UI, manifest('1.1.0'));
  git(other, 'commit', '--quiet', '-am', 'chore(release): 1.1.0 [skip ci]');
  git(other, 'push', '--quiet', 'origin', 'main');

  git(root, 'clone', '--quiet', 'remote.git', 'work');
  const work = at('work');
  write(work, CATALOG, catalog('1.1.0'));
  // Hooks the step must not run, wherever git looks for them.
  git(work, 'config', 'core.hooksPath', at('hooks'));

  const remote = (...args) => git(root, '--git-dir=remote.git', ...args);
  return {
    root,
    at,
    git,
    route,
    work,
    remote,
    released: remote('rev-parse', 'main'),
    /** Commits `files` on main, as a merge landing during the release. */
    land(message, files) {
      git(other, 'pull', '--quiet', '--ff-only', 'origin', 'main');
      for (const [rel, text] of Object.entries(files)) write(other, rel, text);
      git(other, 'add', '.');
      git(other, 'commit', '--quiet', '-m', message);
      git(other, 'push', '--quiet', 'origin', 'main');
      return git(other, 'rev-parse', 'HEAD');
    },
    env,
  };
}

/** The step's env from ci.yml, with the token expression given a value. */
function stepEnv() {
  const env = {};
  for (const [key, value] of stepNamed(publishSteps(), PUSH).env) {
    if (value === APP_TOKEN) env[key] = TOKEN;
    else {
      assert.doesNotMatch(value, /\$\{\{/, `${key} is a literal`);
      env[key] = value;
    }
  }
  return env;
}

/** Runs the push step in `box.work` the way the runner does: `bash -e`. */
function runPush(box) {
  const run = spawnSync(
    'bash',
    ['-e', '-c', stepNamed(publishSteps(), PUSH).get('run')],
    {
      cwd: box.work,
      encoding: 'utf8',
      env: { ...box.env, ...stepEnv(), GITHUB_REPOSITORY: REPOSITORY },
    }
  );
  const read = rel =>
    fs.existsSync(box.at(rel))
      ? fs.readFileSync(box.at(rel), 'utf8').split('\n').filter(Boolean)
      : [];
  return {
    ...run,
    out: run.stdout + run.stderr,
    sleeps: read('sleeps'),
    hooks: read('hooks-ran'),
  };
}

const mainFile = (box, rel) => box.remote('show', `main:${rel}`) + '\n';
const stampOn = (box, ref = 'main') =>
  JSON.parse(box.remote('show', `${ref}:${CATALOG}`)).generatedFrom.version;

/** The restamp on main: its message, signature and parent. */
function assertRestampOnMain(box, parent) {
  const commit = box.remote('cat-file', '-p', 'main');
  assert.match(
    commit,
    /^chore\(bestax-mcp\): restamp index after release \[skip ci\]$/m
  );
  assert.match(commit, /^gpgsig -----BEGIN PGP SIGNATURE-----/m);
  assert.match(commit, /^author Release Bot <release@example\.com>/m);
  assert.equal(box.remote('rev-parse', 'main^'), parent);
  assert.deepEqual(
    box.remote('diff', '--name-only', 'main^', 'main').split('\n'),
    [CATALOG]
  );
  assert.equal(stampOn(box), '1.1.0');
}

test('the restamp is pushed straight to main when nothing landed', () => {
  const box = sandbox();
  const run = runPush(box);
  assert.equal(run.status, 0, run.out);
  assertRestampOnMain(box, box.released);
  assert.deepEqual(run.sleeps, []);
  assert.deepEqual(run.hooks, []);
});

test('a merge that landed during the release gets the restamp replayed onto it (#993)', () => {
  const box = sandbox();
  // A PR that changed the index's content, stamped with the version it was
  // tested against, and one that did not touch the index at all.
  box.land('feat(bulma-ui): add Card', {
    [CATALOG]: catalog('1.0.0', ['Box', 'Button', 'Card']),
  });
  const landed = box.land('docs: a page', { 'docs/page.md': 'second\n' });

  const run = runPush(box);
  assert.equal(run.status, 0, run.out);
  assertRestampOnMain(box, landed);
  assert.equal(
    mainFile(box, CATALOG),
    catalog('1.1.0', ['Box', 'Button', 'Card'])
  );
  assert.equal(mainFile(box, 'docs/page.md'), 'second\n');
  assert.match(run.out, new RegExp(`onto main at ${landed}`));
  assert.deepEqual(run.sleeps, ['5']);
  assert.deepEqual(run.hooks, []);
});

test('main moving again between the fetch and the push is replayed onto too', () => {
  const box = sandbox();
  const first = box.land('docs: a page', { 'docs/page.md': 'second\n' });
  // Fetches read a copy of main that only catches up on the second wait, so
  // the first replay lands on a tip main has already left: a real second
  // non-fast-forward, not a simulated one.
  box.git(box.root, 'clone', '--quiet', '--bare', 'remote.git', 'stale.git');
  const second = box.land('docs: another page', { 'docs/more.md': 'more\n' });
  box.route({ fetch: 'stale.git', push: 'remote.git' });
  executable(
    box.at('on-sleep-2'),
    `#!/bin/sh\ngit --git-dir='${box.at('stale.git')}' fetch --quiet '${box.at('remote.git')}' +main:main\n`
  );

  const run = runPush(box);
  assert.equal(run.status, 0, run.out);
  assertRestampOnMain(box, second);
  assert.match(run.out, new RegExp(`onto main at ${first}`));
  assert.match(run.out, new RegExp(`onto main at ${second}`));
  assert.deepEqual(run.sleeps, ['5', '10']);
  assert.deepEqual(run.hooks, []);
});

test('a main that already carries the restamp is left as it is', () => {
  // A hand restamp (#991's shape) merged while the release ran.
  const box = sandbox();
  const landed = box.land('chore: restamp the index', {
    [CATALOG]: catalog('1.1.0'),
  });
  const run = runPush(box);
  assert.equal(run.status, 0, run.out);
  assert.equal(box.remote('rev-parse', 'main'), landed);
  assert.deepEqual(run.hooks, []);
});

test('a replay that conflicts fails loudly and pushes nothing', () => {
  const box = sandbox();
  const landed = box.land('chore: a different stamp', {
    [CATALOG]: catalog('1.0.9'),
  });
  const run = runPush(box);
  assert.notEqual(run.status, 0);
  assert.match(
    run.out,
    /::error::Packages published, but the MCP index restamp conflicts with a commit that landed on main/
  );
  assert.equal(box.remote('rev-parse', 'main'), landed);
  assert.deepEqual(run.hooks, []);
});

test("a tip whose bulma-ui version moved is refused, since this run's stamp is out of date", () => {
  const box = sandbox();
  const landed = box.land('chore(release): 1.2.0 [skip ci]', {
    [BULMA_UI]: manifest('1.2.0'),
  });
  const run = runPush(box);
  assert.notEqual(run.status, 0);
  assert.match(
    run.out,
    /::error::Packages published, but bulma-ui on main moved to 1\.2\.0 during the release, so the restamp for 1\.1\.0 was not pushed/
  );
  assert.equal(box.remote('rev-parse', 'main'), landed);
  assert.equal(stampOn(box), '1.0.0');
});

test('a push that keeps failing gives up after a bounded number of tries', () => {
  // Pushes go nowhere while fetches still read main, which has not moved, so
  // each retry replays the restamp onto the same tip and fails the same way.
  const box = sandbox();
  box.route({ fetch: 'remote.git', push: 'missing.git' });
  const run = runPush(box);
  assert.notEqual(run.status, 0);
  assert.match(
    run.out,
    /::error::Packages published, but pushing the MCP index restamp to main failed\. Run 'pnpm gen:mcp' on main and commit/
  );
  // A wait between tries and none after the last, each longer than the one
  // before it.
  const waits = run.sleeps.map(Number);
  assert.ok(waits.length > 1, run.out);
  waits.reduce((before, wait) => (assert.ok(wait > before), wait), 0);
  assert.equal(box.remote('rev-parse', 'main'), box.released);
  assert.deepEqual(run.hooks, []);
});

test('the scratch hooks do run when the step does not switch them off', () => {
  // Otherwise the hooks assertions above would pass on hooks that never ran.
  const box = sandbox();
  box.git(box.work, 'add', CATALOG);
  box.git(box.work, 'commit', '--quiet', '-m', 'chore: commit with hooks');
  const ran = fs.readFileSync(box.at('hooks-ran'), 'utf8');
  assert.match(ran, /^pre-commit$/m);
  assert.match(ran, /^commit-msg$/m);
});
