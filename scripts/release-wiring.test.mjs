/**
 * Covers the `release-wiring` conformance check (#710).
 *
 * The check exists because a package can be declared publishable and still
 * publish nowhere with CI green, which is what #706 was. The fixtures below
 * pin what counts as wiring; the real-repo tests at the bottom pin that the
 * reader understands the workflows as they are actually written, since a
 * reader that could not would fail every package rather than none.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  checkReleaseWiring,
  npmInstallNames,
  releaseWiringViolations,
  yamlGet,
  yamlItems,
  yamlMap,
  yamlScalar,
} from './check-conformance.mjs';

const CI = '.github/workflows/ci.yml';
const SUPPLY_CHAIN = '.github/workflows/supply-chain.yml';

const PACKAGES = [
  { dir: 'bulma-ui', name: '@allxsmith/bestax-bulma' },
  { dir: 'create-bestax', name: 'create-bestax' },
  { dir: 'eslint-plugin', name: '@allxsmith/eslint-plugin-bestax' },
];
const DIRS = PACKAGES.map(p => p.dir);
const NAMES = PACKAGES.map(p => p.name);

const releaseStep = dir => `
      - name: Semantic Release (${dir})
        working-directory: ${dir}
        env:
          GITHUB_TOKEN: \${{ steps.app-token.outputs.token }}
        run: |
          git log -1 --show-signature
          pnpm exec semantic-release
`;

/** A ci.yml in the real one's shape, reduced to what the check reads. */
const ci = ({
  release = DIRS.map(releaseStep).join(''),
  coverage = DIRS.map(dir => `            ${dir}/coverage`).join('\n'),
  publishJob = 'publish',
} = {}) => `name: CI

on:
  push:
    branches: [main]

jobs:
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest
    steps:
      - name: Test Coverage
        run: pnpm run test:coverage

      - name: Archive Coverage
        uses: actions/upload-artifact@0000000000000000000000000000000000000000 # v7
        with:
          name: coverage
          path: |
${coverage}
          retention-days: 7

  ${publishJob}:
    name: Publish to npm
    needs: build-and-test
    steps:
      - name: Build
        run: pnpm run build
${release}`;

const slug = name => name.replace(/^@/, '').replace('/', '-');

/** A supply-chain.yml in the real one's shape, reduced the same way. */
const supplyChain = ({
  legs = NAMES.map(
    name => `          - package: '${name}'\n            slug: ${slug(name)}`
  ).join('\n'),
  install = `          npm install --ignore-scripts \\\n            ${NAMES.join(' ')}`,
} = {}) => `name: Supply Chain Evidence

on:
  release:
    types: [published]

jobs:
  consumer-sbom:
    name: Consumer SBOM (\${{ matrix.package }})
    strategy:
      fail-fast: false
      matrix:
        include:
${legs}

    steps:
      - name: Decide which version to install
        run: node scripts/consumer-sbom-meta.mjs spec

  verify-provenance:
    name: Verify published provenance
    runs-on: ubuntu-latest
    steps:
      - name: Install published packages into a scratch tree
        run: |
          mkdir -p "$RUNNER_TEMP/verify"
          cd "$RUNNER_TEMP/verify"
          npm init -y > /dev/null
${install}

      - name: Assert the attestations say this repository built these tarballs
        run: node scripts/verify-attestation.mjs --dir "$RUNNER_TEMP/verify"
`;

const check = (over = {}) =>
  releaseWiringViolations(over.packages ?? PACKAGES, {
    ci: over.ci ?? ci(),
    supplyChain: over.supplyChain ?? supplyChain(),
  });

/** Exactly one violation, which names the file, the package and the step. */
const only = (violations, ...patterns) => {
  assert.equal(violations.length, 1, violations.join('\n'));
  for (const pattern of patterns) assert.match(violations[0], pattern);
  return violations[0];
};

test('fully wired fixtures are clean', () => {
  assert.deepEqual(check(), []);
});

test('an empty roster is refused, not silently satisfied', () => {
  only(check({ packages: [] }), /No packages were read from PNPM_PUBLISHED/);
});

// --- 1. the semantic-release step ---------------------------------------------

test('a package with no release step is named, with the file and the step', () => {
  // #706's exact shape: declared, and nothing ever runs its release.
  const v = only(
    check({ ci: ci({ release: DIRS.slice(0, 2).map(releaseStep).join('') }) }),
    /^\.github\/workflows\/ci\.yml: /,
    /`publish` job has no semantic-release step for eslint-plugin/,
    /@allxsmith\/eslint-plugin-bestax is declared in PNPM_PUBLISHED/,
    /Semantic Release \(eslint-plugin\)/
  );
  assert.match(v, /working-directory: eslint-plugin/);
});

test('a copied step renamed but not retargeted does not count', () => {
  // The name is a label. The working directory decides what releases, so a
  // step called "Semantic Release (eslint-plugin)" that still runs in
  // create-bestax never releases the plugin.
  const release =
    DIRS.slice(0, 2).map(releaseStep).join('') +
    releaseStep('eslint-plugin').replace(
      'working-directory: eslint-plugin',
      'working-directory: create-bestax'
    );
  only(check({ ci: ci({ release }) }), /release step for eslint-plugin/);
});

test('a working directory spelled with ./ or a trailing slash still counts', () => {
  const release =
    DIRS.slice(0, 2).map(releaseStep).join('') +
    releaseStep('eslint-plugin').replace(
      'working-directory: eslint-plugin',
      'working-directory: ./eslint-plugin/'
    );
  assert.deepEqual(check({ ci: ci({ release }) }), []);
});

test('a step that does not run semantic-release does not count', () => {
  const release =
    DIRS.slice(0, 2).map(releaseStep).join('') +
    releaseStep('eslint-plugin').replace(
      'pnpm exec semantic-release',
      'pnpm run build'
    );
  only(check({ ci: ci({ release }) }), /release step for eslint-plugin/);
});

test('semantic-release named only in a shell comment does not count', () => {
  const release =
    DIRS.slice(0, 2).map(releaseStep).join('') +
    releaseStep('eslint-plugin').replace(
      'pnpm exec semantic-release',
      '# pnpm exec semantic-release\n          echo skipped'
    );
  only(check({ ci: ci({ release }) }), /release step for eslint-plugin/);
});

test('a plugin path is not an invocation', () => {
  // `@semantic-release/npm` contains the word; it does not run the tool.
  const release =
    DIRS.slice(0, 2).map(releaseStep).join('') +
    releaseStep('eslint-plugin').replace(
      'pnpm exec semantic-release',
      'pnpm add @semantic-release/npm'
    );
  only(check({ ci: ci({ release }) }), /release step for eslint-plugin/);
});

test('a commented-out release step does not count', () => {
  const commented = releaseStep('eslint-plugin')
    .split('\n')
    .map(line => (line.trim() ? `      # ${line.trimStart()}` : line))
    .join('\n');
  const release = DIRS.slice(0, 2).map(releaseStep).join('') + commented;
  only(check({ ci: ci({ release }) }), /release step for eslint-plugin/);
});

test('a release step outside the publish job does not count', () => {
  // Only the publish job runs on main with the OIDC grant a publish needs.
  const text = ci({
    release: DIRS.slice(0, 2).map(releaseStep).join(''),
  }).replace(
    '      - name: Test Coverage\n',
    releaseStep('eslint-plugin').slice(1) + '\n      - name: Test Coverage\n'
  );
  only(check({ ci: text }), /release step for eslint-plugin/);
});

test('a missing publish job is one message naming the constant to update', () => {
  only(
    check({ ci: ci({ publishJob: 'release' }) }),
    /^\.github\/workflows\/ci\.yml has no `publish` job/,
    /update RELEASE_JOB in scripts\/check-conformance\.mjs/
  );
});

// --- 2. the archived coverage directory --------------------------------------

test('a coverage directory missing from Archive Coverage is named', () => {
  only(
    check({
      ci: ci({
        coverage: DIRS.slice(0, 2)
          .map(dir => `            ${dir}/coverage`)
          .join('\n'),
      }),
    }),
    /^\.github\/workflows\/ci\.yml: the "Archive Coverage" step's `path` list has no eslint-plugin\/coverage/,
    /Add `eslint-plugin\/coverage` to that list/
  );
});

test('a coverage path commented out inside the list does not count', () => {
  // Block-scalar content, so the reader keeps it, but it is not the path.
  const coverage = [
    ...DIRS.slice(0, 2).map(dir => `            ${dir}/coverage`),
    '            # eslint-plugin/coverage',
  ].join('\n');
  only(check({ ci: ci({ coverage }) }), /has no eslint-plugin\/coverage/);
});

test('coverage paths spelled with ./ or a trailing slash still count', () => {
  const coverage = DIRS.map(dir => `            ./${dir}/coverage/`).join('\n');
  assert.deepEqual(check({ ci: ci({ coverage }) }), []);
});

test('a missing Archive Coverage step is one message naming the constant', () => {
  only(
    check({
      ci: ci().replace('- name: Archive Coverage', '- name: Keep Coverage'),
    }),
    /has no "Archive Coverage" step/,
    /update COVERAGE_STEP/
  );
});

// --- 3. the consumer-sbom leg ------------------------------------------------

test('a package with no consumer-sbom leg is named by what consumers install', () => {
  only(
    check({
      supplyChain: supplyChain({
        legs: NAMES.slice(0, 2)
          .map(n => `          - package: '${n}'\n            slug: ${slug(n)}`)
          .join('\n'),
      }),
    }),
    /^\.github\/workflows\/supply-chain\.yml: /,
    /`consumer-sbom` matrix has no leg for @allxsmith\/eslint-plugin-bestax \(eslint-plugin\)/,
    /package: '@allxsmith\/eslint-plugin-bestax'/
  );
});

test('plain and double-quoted leg names read the same as single-quoted', () => {
  const legs = [
    `          - package: "${NAMES[0]}"\n            slug: a`,
    `          - package: ${NAMES[1]}\n            slug: b`,
    `          - slug: c\n            package: '${NAMES[2]}' # scoped`,
  ].join('\n');
  assert.deepEqual(check({ supplyChain: supplyChain({ legs }) }), []);
});

test('a matrix the reader cannot read is one message, not a pass', () => {
  // Flow mappings are valid YAML this reader does not parse. They must read
  // as no legs, and say so, rather than as whatever they happen to contain.
  const legs = `          - { package: '${NAMES.join("' }\n          - { package: '")}' }`;
  only(
    check({ supplyChain: supplyChain({ legs }) }),
    /no legs could be read from the `consumer-sbom` job's `strategy\.matrix\.include`/
  );
});

test('a leg commented out does not count', () => {
  const legs = [
    ...NAMES.slice(0, 2).map(
      n => `          - package: '${n}'\n            slug: ${slug(n)}`
    ),
    `          # - package: '${NAMES[2]}'`,
  ].join('\n');
  only(
    check({ supplyChain: supplyChain({ legs }) }),
    /no leg for @allxsmith\/eslint-plugin-bestax/
  );
});

// --- 4. the verify-provenance install roster ---------------------------------

test('a package verify-provenance never installs is named', () => {
  only(
    check({
      supplyChain: supplyChain({
        install: `          npm install --ignore-scripts ${NAMES.slice(0, 2).join(' ')}`,
      }),
    }),
    /^\.github\/workflows\/supply-chain\.yml: the `verify-provenance` job never installs @allxsmith\/eslint-plugin-bestax \(eslint-plugin\)/,
    /verify-attestation\.mjs/
  );
});

test('a package named only in an echo is not installed', () => {
  const install = [
    `          npm install --ignore-scripts ${NAMES.slice(0, 2).join(' ')}`,
    `          echo "npm install ${NAMES[2]}"`,
    `          echo npm install ${NAMES[2]}`,
  ].join('\n');
  only(
    check({ supplyChain: supplyChain({ install }) }),
    /never installs @allxsmith\/eslint-plugin-bestax/
  );
});

test('a package after an inline comment is not installed', () => {
  const install = `          npm install ${NAMES.slice(0, 2).join(' ')} # ${NAMES[2]}`;
  only(
    check({ supplyChain: supplyChain({ install }) }),
    /never installs @allxsmith\/eslint-plugin-bestax/
  );
});

test('a missing install is one message, not one per package', () => {
  only(
    check({ supplyChain: supplyChain({ install: '          true' }) }),
    /no `npm install` could be read from the `verify-provenance` job/
  );
});

test('npmInstallNames reads continuations, versions and chained commands', () => {
  assert.deepEqual(
    npmInstallNames(
      [
        'cd "$RUNNER_TEMP/verify" && npm init -y > /dev/null',
        'CI=1 npm i --no-audit \\',
        '  @scope/a@1.2.3 b@latest \\',
        '  c; npm add d',
        'npm ci',
        'npx npm install e',
      ].join('\n')
    ),
    ['@scope/a', 'b', 'c', 'd']
  );
});

// --- the reader --------------------------------------------------------------

test('yamlScalar reads literal blocks and quoting, and refuses what it cannot', () => {
  const entry = yaml => yamlMap(yaml.split('\n')).get('k');
  assert.equal(yamlScalar(entry('k: |\n  a\n\n    b\n  c\n')), 'a\n\n  b\nc');
  assert.equal(yamlScalar(entry('k: |-\n  a\n# after\n')), 'a');
  assert.equal(yamlScalar(entry("k: 'it''s' # c")), "it's");
  assert.equal(yamlScalar(entry('k: "a\\tb"')), 'a\tb');
  assert.equal(yamlScalar(entry('k: plain # comment')), 'plain');
  // Folded scalars, flow collections and aliases read as missing.
  assert.equal(yamlScalar(entry('k: >\n  a\n  b\n')), null);
  assert.equal(yamlScalar(entry('k: [a, b]')), null);
  assert.equal(yamlScalar(entry('k: *anchor')), null);
});

test('yamlItems and yamlGet walk nested sequences and mappings', () => {
  const lines = [
    'jobs:',
    '  a:',
    '    steps:',
    '      # a comment between items',
    '      - name: one',
    '        run: x',
    '      -',
    '        name: two',
  ];
  const steps = yamlItems(yamlGet(lines, 'jobs', 'a', 'steps').lines).map(
    yamlMap
  );
  assert.deepEqual(
    steps.map(s => yamlScalar(s.get('name'))),
    ['one', 'two']
  );
  assert.equal(yamlGet(lines, 'jobs', 'b'), null);
});

// --- unreadable files ---------------------------------------------------------

test('an unreadable workflow is a violation naming the file, not a throw', () => {
  const v = releaseWiringViolations(PACKAGES, {
    ci: null,
    supplyChain: supplyChain(),
  });
  only(v, /^\.github\/workflows\/ci\.yml could not be read/);
  const w = releaseWiringViolations(PACKAGES, { ci: ci(), supplyChain: null });
  only(w, /^\.github\/workflows\/supply-chain\.yml could not be read/);
});

// --- the real repo -----------------------------------------------------------

const repoFile = rel =>
  readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8');

test('the real repo is wired for every declared package', async () => {
  assert.deepEqual(await checkReleaseWiring(), []);
});

test('the reader bites on the real workflows, not only on fixtures', () => {
  // A reader that failed to parse the real files would fail every package,
  // which the test above catches. This catches the other direction: that each
  // surface is really being read, by removing one package from it.
  const real = { ci: repoFile(CI), supplyChain: repoFile(SUPPLY_CHAIN) };
  const plugin = PACKAGES.find(p => p.dir === 'eslint-plugin');
  const run = over => releaseWiringViolations([plugin], { ...real, ...over });

  assert.deepEqual(run({}), []);
  only(
    run({
      ci: real.ci.replace(
        /working-directory: eslint-plugin\b/g,
        'working-directory: elsewhere'
      ),
    }),
    /release step for eslint-plugin/
  );
  only(
    run({ ci: real.ci.replace(/^(\s*)eslint-plugin\/coverage$/m, '$1x') }),
    /has no eslint-plugin\/coverage/
  );
  const renamed = real.supplyChain.replaceAll(plugin.name, `${plugin.name}-x`);
  const v = run({ supplyChain: renamed });
  assert.equal(v.length, 2, v.join('\n'));
  assert.match(v[0], /`consumer-sbom` matrix has no leg/);
  assert.match(v[1], /`verify-provenance` job never installs/);
});
