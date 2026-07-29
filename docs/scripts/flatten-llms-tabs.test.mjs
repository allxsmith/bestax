import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transform, isLlmArtifact } from './flatten-llms-tabs.mjs';

const fence = (lang, body) => '```' + lang + '\n' + body + '\n```';

test('PackageManagerTabs collapses to a single pnpm block', () => {
  const out = transform(
    '<PackageManagerTabs command="add @allxsmith/bestax-bulma" />'
  );
  assert.equal(out.trim(), fence('bash', 'pnpm add @allxsmith/bestax-bulma'));
});

test('PackageManagerTabs passes the pnpm verb vocabulary through', () => {
  for (const [command, expected] of [
    ['create bestax@latest my-app', 'pnpm create bestax@latest my-app'],
    [
      'dlx create-next-app@latest my-app',
      'pnpm dlx create-next-app@latest my-app',
    ],
    ['add -D typescript', 'pnpm add -D typescript'],
    ['install', 'pnpm install'],
  ]) {
    const out = transform(`<PackageManagerTabs command="${command}" />`);
    assert.equal(out.trim(), fence('bash', expected));
  }
});

test('PackageManagerTabs accepts a single-quoted command', () => {
  assert.match(
    transform("<PackageManagerTabs command='add foo' />"),
    /pnpm add foo/
  );
});

test('a braced-template command is left alone, by design', () => {
  // Its backticks are indistinguishable from an inline code span, and masking
  // has to run first. Authors use a plain string; this asserts we fail loudly
  // (untouched JSX in the artifact) rather than silently mangling it.
  const src = '<PackageManagerTabs command={`add foo`} />';
  assert.equal(transform(src), src);
});

test('generic Tabs keep every body and promote labels to headings', () => {
  const src = [
    '<Tabs>',
    '<TabItem value="component" label="ProfileCard.tsx">',
    '',
    fence('tsx', 'const x = 1;'),
    '',
    '</TabItem>',
    '<TabItem value="usage" label="Usage">',
    '',
    fence('tsx', 'const y = 2;'),
    '',
    '</TabItem>',
    '</Tabs>',
  ].join('\n');

  const out = transform(src);

  // Complementary content — dropping non-first tabs would delete documentation.
  assert.match(out, /^#### ProfileCard\.tsx$/m);
  assert.match(out, /^#### Usage$/m);
  assert.match(out, /const x = 1;/);
  assert.match(out, /const y = 2;/);
  assert.doesNotMatch(out, /<Tabs|<TabItem/);
});

test('generic Tabs fall back to value when label is absent', () => {
  const src = '<Tabs>\n<TabItem value="scss">\n\nbody\n\n</TabItem>\n</Tabs>';
  assert.match(transform(src), /^#### scss$/m);
});

test("bestax-bulma's own Tabs component survives inside fences", () => {
  // Regression: `<Tabs\b` matches `<Tabs.List` — \b sits between the s and dot.
  const src = [
    '## Usage',
    '',
    fence(
      'tsx live',
      [
        '<Tabs.List>',
        '  <Tabs.Item active>Home</Tabs.Item>',
        '</Tabs.List>',
      ].join('\n')
    ),
  ].join('\n');

  assert.equal(transform(src), src);
});

test('Tabs mentioned in inline code spans in prose survive', () => {
  const src =
    'You can use helper props with `<Tabs />` and its subcomponents.\n\n' +
    'The legacy `<Tabs.Item>` API is preserved, and `<Tabs>` now provides context.';

  assert.equal(transform(src), src);
});

test('a fenced Tabs example is not flattened by a later real Tabs block', () => {
  const src = [
    fence('mdx', '<Tabs>\n<TabItem label="Doc example">x</TabItem>\n</Tabs>'),
    '',
    '<Tabs>',
    '<TabItem label="Real">real body</TabItem>',
    '</Tabs>',
  ].join('\n');

  const out = transform(src);

  assert.match(
    out,
    /```mdx\n<Tabs>\n<TabItem label="Doc example">x<\/TabItem>\n<\/Tabs>\n```/
  );
  assert.match(out, /^#### Real$/m);
  assert.match(out, /real body/);
});

test('orphaned tab imports are dropped', () => {
  const src = [
    "import Tabs from '@theme/Tabs';",
    "import TabItem from '@theme/TabItem';",
    "import PackageManagerTabs from '@site/src/components/PackageManagerTabs';",
    "import { ExampleMeta } from '@site/src/components/SkillExamples';",
    '',
    '# Title',
  ].join('\n');

  const out = transform(src);

  assert.doesNotMatch(out, /@theme\/Tabs|@theme\/TabItem|PackageManagerTabs/);
  // Unrelated imports are left alone — the llms plugin owns that stripping.
  assert.match(out, /ExampleMeta/);
});

test('transform is idempotent', () => {
  const src = [
    '<PackageManagerTabs command="add foo" />',
    '',
    '<Tabs>',
    '<TabItem label="One">',
    '',
    fence('ts', 'const a = 1;'),
    '',
    '</TabItem>',
    '</Tabs>',
    '',
    'Prose about `<Tabs>` stays put.',
  ].join('\n');

  const once = transform(src);
  assert.equal(transform(once), once);
});

test('content is never lost to placeholder collisions', () => {
  // Masked code is NUL-delimited, so digit runs in prose cannot be mistaken
  // for a placeholder on restore.
  const src = 'Release 5 8 0 shipped.\n\n' + fence('bash', 'pnpm add foo');
  assert.equal(transform(src), src);
});

test('isLlmArtifact selects .md twins and llms*.txt only', () => {
  assert.equal(isLlmArtifact('build/docs/guides/intro.md'), true);
  assert.equal(isLlmArtifact('build/llms.txt'), true);
  assert.equal(isLlmArtifact('build/llms-full.txt'), true);
  assert.equal(isLlmArtifact('build/robots.txt'), false);
  assert.equal(isLlmArtifact('build/assets/js/main.js'), false);
  assert.equal(isLlmArtifact('build/index.html'), false);
});
