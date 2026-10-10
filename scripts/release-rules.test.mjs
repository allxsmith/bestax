/**
 * Holds bestax-mcp's release rules to bulma-ui's (#932).
 *
 * bestax-mcp ships an index of the library, which the release job regenerates
 * after bulma-ui's release and before bestax-mcp's. That only reaches npm when
 * bestax-mcp releases too, so its config releases a patch on every commit that
 * releases bulma-ui. Nothing else notices if that stops: both packages keep
 * releasing on their own commits while the published index falls behind the
 * library again, which is what #932 found.
 *
 * So these run commits through commit-analyzer itself rather than reading the
 * rules. What a rule list does depends on how the analyzer walks it, and the
 * bestax-mcp config leans on that walk: its bulma-ui breaking rule sits last
 * for a reason a reading would not check. The analyzer is the copy
 * semantic-release loads, resolved through semantic-release the way its plugin
 * loader resolves it, so an upgrade that changes the walk shows up here.
 */
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import conventional from '@commitlint/config-conventional';

import { pluginOptions } from './lib/release-config.mjs';

const ANALYZER = '@semantic-release/commit-analyzer';
const REPO = fileURLToPath(new URL('..', import.meta.url));

const semanticRelease = createRequire(import.meta.url).resolve(
  'semantic-release'
);
const { analyzeCommits } = await import(
  pathToFileURL(createRequire(semanticRelease).resolve(ANALYZER)).href
);

const LIBRARY = await pluginOptions('bulma-ui', ANALYZER);
const SERVER = await pluginOptions('bestax-mcp', ANALYZER);

const BREAKING = '\n\nBREAKING CHANGE: a prop was renamed';

/** The release type a package's rules give these commits, or null. */
async function release(options, ...messages) {
  return analyzeCommits(options, {
    cwd: REPO,
    logger: { log() {} },
    commits: messages.map((message, i) => ({ message, hash: `c${i}` })),
  });
}

/**
 * Every type a commit here can carry, which commitlint holds to its
 * conventional list, plus any type either rule list names, so a rule for a
 * type commitlint does not know is still exercised.
 */
const TYPES = [
  ...new Set([
    ...conventional.rules['type-enum'][2],
    ...[LIBRARY, SERVER].flatMap(o => o.releaseRules.map(r => r.type)),
  ]),
].filter(Boolean);

test('bestax-mcp patches on exactly the bulma-ui commits that release bulma-ui', async () => {
  const seen = new Set();
  for (const type of TYPES) {
    for (const footer of ['', BREAKING]) {
      const message = `${type}(bulma-ui): change the library${footer}`;
      const library = await release(LIBRARY, message);
      seen.add(library);
      assert.equal(
        await release(SERVER, message),
        library ? 'patch' : null,
        `${JSON.stringify(message)} gives bulma-ui ${library}, so bestax-mcp ` +
          `should ${library ? 'patch' : 'not release'}. The bulma-ui group in ` +
          'bestax-mcp/release.config.js says how its rules meet these.'
      );
    }
  }
  // Not vacuous: the loop met every kind of bulma-ui release.
  for (const kind of ['major', 'minor', 'patch', null]) {
    assert.ok(seen.has(kind), `no bulma-ui commit gave ${kind}`);
  }
});

test('a bulma-ui commit never lifts bestax-mcp past patch or lowers its own bump', async () => {
  assert.equal(
    await release(
      SERVER,
      `feat(bulma-ui): rename a prop${BREAKING}`,
      'fix(bestax-mcp): answer a lookup'
    ),
    'patch'
  );
  assert.equal(
    await release(
      SERVER,
      `feat(bulma-ui): rename a prop${BREAKING}`,
      'feat(bestax-mcp): add a tool'
    ),
    'minor'
  );
  assert.equal(
    await release(
      SERVER,
      'feat(bulma-ui): add a helper',
      `feat(bestax-mcp): drop a tool${BREAKING}`
    ),
    'major'
  );
});

test("bestax-mcp's own commits keep their own bumps", async () => {
  const cases = {
    'feat(bestax-mcp): add a tool': 'minor',
    'fix(bestax-mcp): answer a lookup': 'patch',
    'perf(bestax-mcp): answer faster': 'patch',
    'refactor(bestax-mcp): split a module': 'patch',
    'style(bestax-mcp): format': 'patch',
    [`feat(bestax-mcp): drop a tool${BREAKING}`]: 'major',
    'docs(bestax-mcp): explain a tool': null,
    'test(bestax-mcp): cover a tool': null,
  };
  for (const [message, expected] of Object.entries(cases)) {
    assert.equal(await release(SERVER, message), expected, message);
  }
});

test("other scopes and the release job's own commits release no bestax-mcp", async () => {
  for (const message of [
    'fix(create-bestax): handle a missing TTY',
    `feat(create-bestax): change a template${BREAKING}`,
    'feat(bestax-migrate): convert a class',
    'feat(eslint-plugin): add a rule',
    'feat(docs): add a page',
    'fix(docs): word a page',
    'docs: tidy the readme',
    'chore: regenerate',
    'chore(release): 5.27.9 [skip ci]',
    'chore(bestax-mcp): restamp index after release [skip ci]',
  ]) {
    assert.equal(await release(SERVER, message), null, message);
  }
});

test('the link runs one way: a bestax-mcp commit releases no bulma-ui', async () => {
  assert.equal(await release(LIBRARY, 'feat(bestax-mcp): add a tool'), null);
  assert.equal(await release(LIBRARY, 'feat(bulma-ui): add a helper'), 'minor');
});
