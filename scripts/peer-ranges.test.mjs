/**
 * Holds the `peer-ranges` conformance rule in scripts/check-conformance.mjs to
 * the drift it exists to catch (#997).
 *
 * The real tree agrees with itself by construction, so a full run only takes
 * the passing branch. These drive each violation directly, starting from the
 * one that went unnoticed: Dependabot moving the repo's copies of
 * material-symbols to a minor the published peer range refused (#1003), with
 * every check green. The same goes for its sibling rule, which holds
 * create-bestax's react and react-dom to the whole peer range after a
 * Dependabot bump narrowed both, again with every check green (#1012).
 */
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PEER_COPIES,
  WHOLE_RANGE_DEPENDENTS,
  checkPeerRanges,
  peerRangeViolations,
  wholeRangeViolations,
} from './check-conformance.mjs';

const LIB = 'bulma-ui/package.json';
const DOCS = 'docs/package.json';
const CLI = 'create-bestax/package.json';
const REACT = '^18.0.0 || ^19.0.0';

/** One copy per manifest, each naming `name` at `spec`. */
const copiesOf = (name, ...specs) =>
  specs.map((spec, i) => ({
    file: i === 0 ? LIB : DOCS,
    deps: { [name]: spec },
  }));

test('the real tree passes the whole check', async () => {
  assert.deepEqual(await checkPeerRanges(), []);
});

test('fails the Dependabot bump that passed every check (#1003)', () => {
  // The range stopped at 0.46 while Dependabot moved both copies to 0.47.
  const v = peerRangeViolations(
    { 'material-symbols': '^0.34.1 || ^0.45.0 || ^0.46.0' },
    copiesOf('material-symbols', '^0.47.6', '^0.47.6')
  );
  assert.equal(v.length, 2);
  assert.match(v[0], /^bulma-ui\/package\.json installs material-symbols/);
  assert.match(v[1], /^docs\/package\.json installs material-symbols/);
  for (const message of v) {
    assert.match(message, /does not admit/);
    assert.match(message, /ERESOLVE/);
    // The arm to add is the minor, not the patch Dependabot picked.
    assert.match(message, /add "\^0\.47\.0" to the range/);
  }
});

test('the next minor fails the same way', () => {
  const v = peerRangeViolations(
    { 'material-symbols': '^0.34.1 || ^0.45.0 || ^0.46.0 || ^0.47.0' },
    copiesOf('material-symbols', '^0.48.0')
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /add "\^0\.48\.0" to the range/);
});

test('a new major on a 1.x-and-up peer asks for the major arm', () => {
  const v = peerRangeViolations(
    { '@fortawesome/fontawesome-free': '^6.7.2 || ^7.0.0' },
    copiesOf('@fortawesome/fontawesome-free', '^8.0.1')
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /add "\^8\.0\.0" to the range/);
});

test('a 0.0.x peer holds the patch', () => {
  const v = peerRangeViolations({ tiny: '^0.0.3' }, copiesOf('tiny', '^0.0.4'));
  assert.equal(v.length, 1);
  assert.match(v[0], /add "\^0\.0\.4" to the range/);
});

test('a copy anywhere inside the newest arm passes', () => {
  const peers = {
    'material-symbols': '^0.34.1 || ^0.45.0 || ^0.46.0 || ^0.47.0',
    '@mdi/font': '^7.4.47',
    react: '^18.0.0 || ^19.0.0',
  };
  for (const spec of ['^0.47.0', '^0.47.6', '0.47.6']) {
    assert.deepEqual(
      peerRangeViolations(peers, [
        {
          file: LIB,
          deps: { 'material-symbols': spec, '@mdi/font': '^7.4.47' },
        },
        { file: DOCS, deps: { react: '^19.2.8' } },
      ]),
      [],
      spec
    );
  }
});

test('the newest arm is the highest one, whatever order they are written in', () => {
  const peers = { 'material-symbols': '^0.47.0 || ^0.34.1 || ^0.46.0' };
  assert.deepEqual(
    peerRangeViolations(peers, copiesOf('material-symbols', '^0.47.6')),
    []
  );
  const v = peerRangeViolations(peers, copiesOf('material-symbols', '^0.46.0'));
  assert.equal(v.length, 1);
  assert.match(v[0], /behind \^0\.47\.0/);
});

test('a copy behind the newest arm fails, even inside an older one', () => {
  // An arm added without moving the copies is a claim nothing here runs, and
  // it is the arm create-bestax pins the starter to.
  const v = peerRangeViolations(
    { 'material-symbols': '^0.46.0 || ^0.47.0' },
    copiesOf('material-symbols', '^0.46.0')
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /behind \^0\.47\.0, the newest arm/);
  assert.match(v[0], /Move the copy up into \^0\.47\.0/);
});

test('a copy below the floor of the newest arm fails', () => {
  const v = peerRangeViolations(
    { 'material-icons': '^1.13.10' },
    copiesOf('material-icons', '^1.13.5')
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /behind \^1\.13\.10/);
});

test('each copy is held on its own', () => {
  const v = peerRangeViolations(
    { ionicons: '^8.0.0' },
    copiesOf('ionicons', '^8.1.0', '^7.0.0')
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /^docs\/package\.json installs ionicons \^7\.0\.0/);
});

test('an arm it cannot read is reported, not skipped', () => {
  // The single bounded range PR #1010's review floated is a real option; the
  // check has to say it needs teaching rather than pass it unread.
  const v = peerRangeViolations(
    { 'material-symbols': '>=0.34.1 <0.48.0' },
    copiesOf('material-symbols', '^0.47.6')
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /cannot read \(">=0\.34\.1 <0\.48\.0"\)/);
  assert.match(v[0], /teach peerRangeViolations/);

  for (const range of ['^0.47.0 || ~0.48.0', '^0.48.0-beta.1', '*', '']) {
    assert.equal(
      peerRangeViolations({ x: range }, copiesOf('x', '^0.47.6')).length,
      1,
      range
    );
  }
});

test('a copy it cannot read is reported, not skipped', () => {
  for (const spec of ['latest', 'workspace:^', '^0.48.0-beta.1', '~0.47.6']) {
    const v = peerRangeViolations(
      { 'material-symbols': '^0.47.0' },
      copiesOf('material-symbols', spec)
    );
    assert.equal(v.length, 1, spec);
    assert.match(v[0], /cannot hold to bestax-bulma's peer range/, spec);
  }
});

test('a peer no copy installs is reported', () => {
  const v = peerRangeViolations({ 'material-symbols': '^0.47.0' }, [
    { file: LIB, deps: {} },
    { file: DOCS, deps: undefined },
  ]);
  assert.equal(v.length, 1);
  assert.match(v[0], /^No manifest in PEER_COPIES installs material-symbols/);
});

test('violations come out in peer name order', () => {
  const v = peerRangeViolations({ zeta: '^1.0.0', alpha: '^1.0.0' }, [
    { file: LIB, deps: { zeta: '^2.0.0', alpha: '^2.0.0' } },
  ]);
  assert.equal(v.length, 2);
  assert.match(v[0], /installs alpha/);
  assert.match(v[1], /installs zeta/);
  assert.deepEqual(peerRangeViolations(undefined, []), []);
});

test('PEER_COPIES names bulma-ui itself and the docs site', () => {
  assert.deepEqual(
    PEER_COPIES.map(({ file }) => file),
    [LIB, DOCS]
  );
});

test("fails the Dependabot bump that narrowed create-bestax's react (#1012)", () => {
  const v = wholeRangeViolations({ react: REACT, 'react-dom': REACT }, [
    {
      file: CLI,
      deps: {
        chalk: '^6.0.1',
        react: '^19.3.0',
        'react-dom': '^19.3.0',
      },
    },
  ]);
  assert.equal(v.length, 2);
  assert.match(
    v[0],
    /^create-bestax\/package\.json depends on react "\^19\.3\.0"/
  );
  assert.match(v[1], /^create-bestax\/package\.json depends on react-dom /);
  for (const message of v) {
    assert.match(
      message,
      /not bestax-bulma's peer range "\^18\.0\.0 \|\| \^19\.0\.0"/
    );
    assert.match(message, /Yarn 1, #950/);
    assert.match(message, /: "\^18\.0\.0 \|\| \^19\.0\.0"\. Dependabot/);
    assert.match(message, /as fix\(create-bestax\)/);
  }
  assert.match(v[0], /Restore "react": "\^18\.0\.0 \|\| \^19\.0\.0"\./);
});

test('the whole range, written the same way, passes', () => {
  assert.deepEqual(
    wholeRangeViolations({ react: REACT, 'react-dom': REACT }, [
      { file: CLI, deps: { react: REACT, 'react-dom': REACT } },
    ]),
    []
  );
});

test('any other spelling fails, narrower, wider or merely respaced', () => {
  // Narrower ranges are what Dependabot writes, and what a peer range that
  // gains an arm leaves behind; wider ones are what one that drops an arm
  // leaves behind. Compared as text, so even an equivalent spelling is told
  // the one value to write.
  for (const spec of [
    '^19.3.0',
    '^19.0.0',
    '^18.0.0',
    '^18.3.1 || ^19.0.0',
    '^17.0.0 || ^18.0.0 || ^19.0.0',
    '>=18',
    '*',
    'workspace:^',
    '^18.0.0||^19.0.0',
  ]) {
    const v = wholeRangeViolations({ react: REACT }, [
      { file: CLI, deps: { react: spec } },
    ]);
    assert.equal(v.length, 1, spec);
    assert.match(v[0], /Restore "react": "\^18\.0\.0 \|\| \^19\.0\.0"/, spec);
  }
});

test('the range follows the peer range when it moves', () => {
  // A new arm on the peer range leaves the old whole range narrower.
  const v = wholeRangeViolations({ react: '^18.0.0 || ^19.0.0 || ^20.0.0' }, [
    { file: CLI, deps: { react: REACT } },
  ]);
  assert.equal(v.length, 1);
  assert.match(
    v[0],
    /Restore "react": "\^18\.0\.0 \|\| \^19\.0\.0 \|\| \^20\.0\.0"/
  );
});

test('every peer it declares is held, optional ones included', () => {
  const peers = {
    react: REACT,
    'react-dom': REACT,
    'material-symbols': '^0.34.1 || ^0.45.0 || ^0.46.0 || ^0.47.0',
  };
  const v = wholeRangeViolations(peers, [
    {
      file: CLI,
      deps: { react: REACT, 'react-dom': REACT, 'material-symbols': '^0.47.6' },
    },
  ]);
  assert.equal(v.length, 1);
  assert.match(v[0], /depends on material-symbols "\^0\.47\.6"/);
});

test('peers it does not declare, and packages that are not peers, are left alone', () => {
  // `constructor` checks that "declares" means an own key, not one the
  // merged object inherits.
  assert.deepEqual(
    wholeRangeViolations(
      { react: REACT, ionicons: '^8.0.0', constructor: '^1.0.0' },
      [{ file: CLI, deps: { react: REACT, chalk: '^6.0.1' } }]
    ),
    []
  );
});

test('a dependent that declares none of the peers is reported', () => {
  for (const deps of [{ chalk: '^6.0.1' }, {}, undefined]) {
    const v = wholeRangeViolations({ react: REACT }, [{ file: CLI, deps }]);
    assert.equal(v.length, 1);
    assert.match(v[0], /^create-bestax\/package\.json declares none of/);
    assert.match(v[0], /Drop the entry if that is deliberate/);
  }
});

test('whole-range violations come out in peer name order', () => {
  const v = wholeRangeViolations({ zeta: '^1.0.0', alpha: '^1.0.0' }, [
    { file: CLI, deps: { zeta: '^2.0.0', alpha: '^2.0.0' } },
  ]);
  assert.equal(v.length, 2);
  assert.match(v[0], /depends on alpha/);
  assert.match(v[1], /depends on zeta/);
  assert.deepEqual(wholeRangeViolations(undefined, []), []);
});

test("WHOLE_RANGE_DEPENDENTS names create-bestax's runtime dependencies", () => {
  assert.deepEqual(WHOLE_RANGE_DEPENDENTS, [
    { file: CLI, sections: ['dependencies'] },
  ]);
});

const roots = [];
after(() =>
  Promise.all(roots.map(root => rm(root, { recursive: true, force: true })))
);

/** A fixture tree holding the given manifests, by repo-relative path. */
async function tree(files) {
  const root = await mkdtemp(join(tmpdir(), 'peer-ranges-'));
  roots.push(root);
  for (const [rel, body] of Object.entries(files)) {
    await mkdir(join(root, rel, '..'), { recursive: true });
    await writeFile(
      join(root, rel),
      typeof body === 'string' ? body : JSON.stringify(body)
    );
  }
  return root;
}

test('reads every declared section of every declared manifest', async () => {
  const root = await tree({
    [LIB]: {
      peerDependencies: { 'material-symbols': '^0.46.0', react: '^19.0.0' },
      devDependencies: { 'material-symbols': '^0.47.6' },
    },
    [DOCS]: {
      dependencies: { 'material-symbols': '^0.46.0' },
      devDependencies: { react: '^18.3.1' },
    },
    [CLI]: {
      dependencies: { react: '^19.3.0' },
      // Not a section WHOLE_RANGE_DEPENDENTS reads.
      devDependencies: { 'material-symbols': '^0.47.6' },
    },
  });
  const v = await checkPeerRanges(root);
  assert.equal(v.length, 3);
  assert.match(v[0], /^bulma-ui\/package\.json installs material-symbols/);
  assert.match(v[1], /^docs\/package\.json installs react \^18\.3\.1/);
  assert.match(
    v[2],
    /^create-bestax\/package\.json depends on react "\^19\.3\.0"/
  );
});

test("the real tree with #1012's create-bestax ranges fails on exactly those", async () => {
  const real = async file =>
    JSON.parse(await readFile(new URL(`../${file}`, import.meta.url), 'utf8'));
  const cli = await real(CLI);
  cli.dependencies = {
    ...cli.dependencies,
    react: '^19.3.0',
    'react-dom': '^19.3.0',
  };
  const root = await tree({
    [LIB]: await real(LIB),
    [DOCS]: await real(DOCS),
    [CLI]: cli,
  });
  const v = await checkPeerRanges(root);
  assert.equal(v.length, 2, v.join('\n'));
  assert.match(v[0], /depends on react "\^19\.3\.0"/);
  assert.match(v[1], /depends on react-dom "\^19\.3\.0"/);
});

test('an unreadable manifest is a violation, not a pass', async () => {
  const noLib = await tree({ [DOCS]: { dependencies: {} } });
  const v1 = await checkPeerRanges(noLib);
  assert.equal(v1.length, 1);
  assert.match(v1[0], /^bulma-ui\/package\.json could not be read/);

  const badDocs = await tree({
    [LIB]: {
      peerDependencies: { ionicons: '^8.0.0' },
      devDependencies: { ionicons: '^8.1.0' },
    },
    [DOCS]: '[]',
    [CLI]: { dependencies: { ionicons: '^8.0.0' } },
  });
  assert.deepEqual(await checkPeerRanges(badDocs), [
    'docs/package.json could not be read as a package manifest, so ' +
      "bestax-bulma's peer ranges cannot be held to it.",
  ]);

  const noCli = await tree({
    [LIB]: {
      peerDependencies: { ionicons: '^8.0.0' },
      devDependencies: { ionicons: '^8.1.0' },
    },
    [DOCS]: {},
  });
  assert.deepEqual(await checkPeerRanges(noCli), [
    'create-bestax/package.json could not be read as a package manifest, ' +
      "so bestax-bulma's peer ranges cannot be held to it.",
  ]);

  const brokenJson = await tree({ [LIB]: '{ not json' });
  assert.match(
    (await checkPeerRanges(brokenJson))[0],
    /could not be read as a package manifest/
  );
});

test('a library with no peers says the check is stale', async () => {
  const root = await tree({ [LIB]: { devDependencies: {} }, [DOCS]: {} });
  const v = await checkPeerRanges(root);
  assert.equal(v.length, 1);
  assert.match(v[0], /declares no peerDependencies/);
});
