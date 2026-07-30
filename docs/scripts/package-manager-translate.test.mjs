/**
 * The pnpm → npm/yarn/bun translation table.
 *
 * Lives in docs/scripts/ rather than beside the module because `docs` has no
 * jest config — `node --test "scripts/*.test.mjs"` is the only place a unit test
 * in this package actually runs in CI.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PACKAGE_MANAGERS,
  splitSegments,
  translateSegment,
  renderCommand,
  lintCommand,
} from '../src/components/PackageManagerTabs/translate.mjs';
import { transform } from './flatten-llms-tabs.mjs';

test('pnpm is first, so it is the default tab', () => {
  assert.deepEqual(PACKAGE_MANAGERS, ['pnpm', 'npm', 'yarn', 'bun']);
});

// [authored, pnpm, npm, yarn, bun]
const TABLE = [
  [
    'add @allxsmith/bestax-bulma',
    'pnpm add @allxsmith/bestax-bulma',
    'npm install @allxsmith/bestax-bulma',
    'yarn add @allxsmith/bestax-bulma',
    'bun add @allxsmith/bestax-bulma',
  ],
  [
    'add -D typescript @types/react',
    'pnpm add -D typescript @types/react',
    'npm install -D typescript @types/react',
    'yarn add -D typescript @types/react',
    'bun add -d typescript @types/react',
  ],
  ['install', 'pnpm install', 'npm install', 'yarn', 'bun install'],
  [
    'install --frozen-lockfile',
    'pnpm install --frozen-lockfile',
    'npm install --frozen-lockfile',
    'yarn install --frozen-lockfile',
    'bun install --frozen-lockfile',
  ],
  [
    'remove node-sass',
    'pnpm remove node-sass',
    'npm uninstall node-sass',
    'yarn remove node-sass',
    'bun remove node-sass',
  ],
  [
    'create bestax@latest my-app',
    'pnpm create bestax@latest my-app',
    'npm create bestax@latest my-app',
    'yarn create bestax@latest my-app',
    'bun create bestax@latest my-app',
  ],
  [
    // The `--` quirk: npm needs it to pass flags through, yarn and bun would
    // forward it to the scaffolder.
    'create vite@latest my-app -- --template react',
    'pnpm create vite@latest my-app -- --template react',
    'npm create vite@latest my-app -- --template react',
    'yarn create vite@latest my-app --template react',
    'bun create vite@latest my-app --template react',
  ],
  ['run dev', 'pnpm run dev', 'npm run dev', 'yarn dev', 'bun run dev'],
  [
    'dlx bestax-migrate src/',
    'pnpm dlx bestax-migrate src/',
    'npx bestax-migrate src/',
    'yarn dlx bestax-migrate src/',
    'bunx bestax-migrate src/',
  ],
];

for (const [authored, ...expected] of TABLE) {
  test(`translates "${authored}"`, () => {
    PACKAGE_MANAGERS.forEach((manager, i) => {
      assert.equal(
        translateSegment(authored, manager),
        expected[i],
        `${manager} rendering of "${authored}"`
      );
    });
  });
}

test('an unknown first token passes through identically for all managers', () => {
  for (const segment of [
    'cd my-app',
    '# Install the peer dep',
    'corepack enable',
  ]) {
    for (const manager of PACKAGE_MANAGERS) {
      assert.equal(translateSegment(segment, manager), segment);
    }
  }
});

test('a trailing comment rides along untouched', () => {
  assert.equal(
    translateSegment('dlx bestax-migrate src/ --dry # preview', 'npm'),
    'npx bestax-migrate src/ --dry # preview'
  );
});

test('splitSegments trims, collapses whitespace and drops empties', () => {
  assert.deepEqual(splitSegments('add  foo ;  cd app ; ; install ; '), [
    'add foo',
    'cd app',
    'install',
  ]);
});

test('renderCommand joins segments one per line', () => {
  assert.equal(
    renderCommand('create bestax@latest my-app; cd my-app; install', 'yarn'),
    ['yarn create bestax@latest my-app', 'cd my-app', 'yarn'].join('\n')
  );
});

test('the pnpm rendering is always a pure prefix', () => {
  // This identity is why commands are authored in pnpm vocabulary.
  for (const [authored] of TABLE) {
    assert.equal(renderCommand(authored, 'pnpm'), `pnpm ${authored}`);
  }
});

test('the flattener emits exactly the pnpm tab', () => {
  // The single assertion that mechanically keeps llms.txt and the default tab in
  // sync. If these ever diverge, agents copy a command no reader is shown.
  for (const [authored] of TABLE) {
    const out = transform(`<PackageManagerTabs command="${authored}" />`);
    const body = out.trim().split('\n').slice(1, -1).join('\n');
    assert.equal(body, renderCommand(authored, 'pnpm'));
  }
});

test('the flattener emits the pnpm tab for multi-segment commands too', () => {
  const authored =
    'create vite@latest my-app -- --template react; cd my-app; install';
  const out = transform(`<PackageManagerTabs command="${authored}" />`);
  const body = out.trim().split('\n').slice(1, -1).join('\n');
  assert.equal(body, renderCommand(authored, 'pnpm'));
});

test('lintCommand flags a command that already names a package manager', () => {
  assert.deepEqual(lintCommand('add foo'), []);
  assert.equal(lintCommand('pnpm add foo').length, 1);
  assert.equal(lintCommand('npx skills add x').length, 1);
  assert.equal(lintCommand('add foo; yarn add bar').length, 1);
});

test('an unknown manager is a programming error, not silent output', () => {
  assert.throws(
    () => translateSegment('add foo', 'cnpm'),
    /Unknown package manager/
  );
});
