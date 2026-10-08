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
  unrenderPnpm,
  lintCommand,
  commandFromFence,
} from '../src/components/PackageManagerTabs/translate.mjs';

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
    // npm has no --frozen-lockfile; `npm ci` is the frozen install, and
    // guides/security.md tells readers exactly that. Berry spells it
    // --immutable. bun takes the flag as written.
    'install --frozen-lockfile',
    'pnpm install --frozen-lockfile',
    'npm ci',
    'yarn install --immutable',
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
    // Yarn Classic reads `bestax@latest` as a binary name and fails, so yarn
    // gets the bare starter name, which Classic and Berry both run at its
    // latest version.
    'create bestax@latest my-app',
    'pnpm create bestax@latest my-app',
    'npm create bestax@latest my-app',
    'yarn create bestax my-app',
    'bun create bestax@latest my-app',
  ],
  [
    // Flags for the scaffolder are authored as pnpm takes them, with no `--`.
    // npm needs one to pass them through, so its tab gains it before the first
    // flag. yarn and bun take them as written.
    'create vite@latest my-app --template react',
    'pnpm create vite@latest my-app --template react',
    'npm create vite@latest my-app -- --template react',
    'yarn create vite my-app --template react',
    'bun create vite@latest my-app --template react',
  ],
  [
    'create vite@latest --template react-ts',
    'pnpm create vite@latest --template react-ts',
    'npm create vite@latest -- --template react-ts',
    'yarn create vite --template react-ts',
    'bun create vite@latest --template react-ts',
  ],
  [
    // Only `@latest` goes: a pinned version is a real request, and a scoped
    // starter keeps its scope.
    'create @scope/starter@latest my-app',
    'pnpm create @scope/starter@latest my-app',
    'npm create @scope/starter@latest my-app',
    'yarn create @scope/starter my-app',
    'bun create @scope/starter@latest my-app',
  ],
  [
    // Kept as written, which makes the yarn line Berry-only: Yarn Classic looks
    // for a binary named `create-vite@5`, the same failure `@latest` caused.
    'create vite@5 my-app',
    'pnpm create vite@5 my-app',
    'npm create vite@5 my-app',
    'yarn create vite@5 my-app',
    'bun create vite@5 my-app',
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

test('passthrough segments are normalized, not byte-preserved', () => {
  // The guarantee is "the same on every tab", not "identical to the source" —
  // splitSegments collapses whitespace so authors can pad around the separators.
  const authored = '#   Remove    the  old  dep; remove node-sass';
  const rendered = PACKAGE_MANAGERS.map(pm => renderCommand(authored, pm));

  for (const out of rendered) {
    assert.match(out, /^# Remove the old dep$/m);
  }
  // Same passthrough line on all four tabs.
  const firstLines = rendered.map(out => out.split('\n')[0]);
  assert.equal(new Set(firstLines).size, 1);
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
    ['yarn create bestax my-app', 'cd my-app', 'yarn'].join('\n')
  );
});

test('the pnpm rendering is always a pure prefix', () => {
  // This identity is why commands are authored in pnpm vocabulary.
  for (const [authored] of TABLE) {
    assert.equal(renderCommand(authored, 'pnpm'), `pnpm ${authored}`);
  }
});

test('the pnpm rendering round-trips back to the authored command', () => {
  // The identity the whole design rests on now. The component is handed a pnpm
  // fence, derives the authored command from it, and renders the other three
  // managers off that — so if this inverse were lossy, npm/yarn/bun users would
  // get a command derived from something the page never showed. The component
  // asserts the same equality at prerender, which turns a bad fence into a build
  // failure rather than three wrong tabs.
  for (const [authored] of TABLE) {
    const pnpmForm = renderCommand(authored, 'pnpm');
    assert.equal(renderCommand(unrenderPnpm(pnpmForm), 'pnpm'), pnpmForm);
  }
});

test('the round trip holds for multi-segment commands too', () => {
  const authored =
    'create vite@latest my-app --template react; cd my-app; install';
  const pnpmForm = renderCommand(authored, 'pnpm');
  assert.equal(unrenderPnpm(pnpmForm), authored);
  assert.equal(renderCommand(unrenderPnpm(pnpmForm), 'pnpm'), pnpmForm);
});

test('a fence delimiter that leaks into the text is invisible to the round trip', () => {
  // Why the component checks for ``` separately instead of relying on the round
  // trip. If MDX doesn't parse the block (missing blank lines around it), the
  // delimiters arrive as text; they aren't known verbs, so they pass through on
  // every tab and the equality still holds — while the rendered tabs would show
  // fence markers inside the code block.
  const leaked = '```bash\npnpm add foo\n```';
  assert.equal(
    renderCommand(unrenderPnpm(leaked), 'pnpm'),
    leaked,
    'round trip passes, so it cannot be the guard for this case'
  );
  assert.match(renderCommand(unrenderPnpm(leaked), 'npm'), /^```bash$/m);
});

test('lintCommand flags a command that already names a package manager', () => {
  assert.deepEqual(lintCommand('add foo'), []);
  assert.equal(lintCommand('pnpm add foo').length, 1);
  assert.equal(lintCommand('npx skills add x').length, 1);
  assert.equal(lintCommand('add foo; yarn add bar').length, 1);
});

test('a create command authored with `--` fails, on every tab', () => {
  // pnpm hands the `--` on to the scaffolder, which then reads the flags after
  // it as plain arguments: `pnpm create vite@latest app -- --template react`
  // scaffolds without the template. The pnpm tab cannot drop it either, since
  // the pnpm rendering has to stay the authored fence exactly, so the fence is
  // the thing to fix, and a build that renders it fails.
  for (const manager of PACKAGE_MANAGERS) {
    assert.throws(
      () =>
        translateSegment(
          'create vite@latest my-app -- --template react',
          manager
        ),
      /pnpm passes `--` on to the scaffolder/
    );
  }
});

test('the npm tab looks for flags before a trailing comment only', () => {
  // A word in the comment that starts with `-` is prose, not a flag to pass on.
  assert.equal(
    translateSegment(
      'create bestax@latest my-app # use --template to pick',
      'npm'
    ),
    'npm create bestax@latest my-app # use --template to pick'
  );
  assert.equal(
    translateSegment(
      'create vite@latest my-app --template react # scaffold',
      'npm'
    ),
    'npm create vite@latest my-app -- --template react # scaffold'
  );
  // Nor does a `--` in the comment trip the authored-`--` check.
  assert.equal(
    translateSegment('create vite@latest my-app # npm wants -- here', 'pnpm'),
    'pnpm create vite@latest my-app # npm wants -- here'
  );
});

test('commandFromFence recovers the command behind a canonical fence', () => {
  assert.equal(
    commandFromFence(
      'pnpm create vite@latest my-app --template react\ncd my-app'
    ),
    'create vite@latest my-app --template react; cd my-app'
  );
});

test('commandFromFence fails a fence that is not canonical pnpm', () => {
  assert.throws(
    () => commandFromFence('pnpm add  foo'),
    /not a canonical pnpm command/
  );
});

test('commandFromFence fails a fence that names a package manager', () => {
  // Every tab would show this line as written, so the pnpm tab would carry
  // npm's `--` and pnpm would hand it to create-vite, dropping --template.
  // The round trip cannot see it, since nothing in it is translated.
  for (const fence of [
    'npm create vite@latest my-app -- --template react',
    'npx skills add x',
    'pnpm add foo\nyarn add bar',
  ]) {
    assert.throws(
      () => commandFromFence(fence),
      /already names a package manager/,
      fence
    );
  }
});

test('an unknown manager is a programming error, not silent output', () => {
  assert.throws(
    () => translateSegment('add foo', 'cnpm'),
    /Unknown package manager/
  );
});
