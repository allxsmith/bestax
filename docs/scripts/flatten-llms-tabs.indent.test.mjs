/**
 * Indentation and multi-segment coverage for the flattener.
 *
 * Split from flatten-llms-tabs.test.mjs because these cover a distinct class of
 * defect: the flattener replaces JSX *in place*, so every line it emits has to
 * carry the indentation of the tag it replaced. A component nested in a list
 * item that emits its fence body at column 0 terminates the list item, turns the
 * command into prose, and leaves a stray ``` that opens a new block — and since
 * llms-full.txt is one concatenated document, the damage runs into the next page.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transform, verifyArtifact } from './flatten-llms-tabs.mjs';

/** Every line of a fenced block the flattener emitted, in order. */
function fenceLines(out) {
  return out.split('\n').filter(line => line.trim() !== '');
}

const indents = [
  { label: '2 spaces (bulleted list)', indent: '  ' },
  { label: '3 spaces (numbered list)', indent: '   ' },
  { label: '6 spaces (nested list)', indent: '      ' },
];

for (const { label, indent } of indents) {
  test(`indentation is carried onto every emitted line — ${label}`, () => {
    const out = transform(`${indent}<PackageManagerTabs command="add foo" />`);
    const lines = fenceLines(out);

    assert.equal(lines.length, 3, 'fence open, body, fence close');
    for (const line of lines) {
      assert.ok(
        line.startsWith(indent),
        `expected line to start with ${indent.length} spaces, got ${JSON.stringify(line)}`
      );
      assert.ok(
        !line.startsWith(indent + ' '),
        `expected exactly ${indent.length} spaces, got ${JSON.stringify(line)}`
      );
    }
    assert.equal(lines[0].trim(), '```bash');
    assert.equal(lines[1].trim(), 'pnpm add foo');
    assert.equal(lines[2].trim(), '```');
  });
}

test('an indented component keeps the surrounding list intact', () => {
  const src = [
    '1. **Create it:**',
    '',
    '   <PackageManagerTabs command="add foo" />',
    '',
    '2. **Then install:**',
    '',
    '   <PackageManagerTabs command="install" />',
    '',
  ].join('\n');

  const out = transform(src);

  // Both list markers survive at column 0 and neither command leaks out of its item.
  assert.match(out, /^1\. \*\*Create it:\*\*$/m);
  assert.match(out, /^2\. \*\*Then install:\*\*$/m);
  assert.match(out, /^ {3}```bash\n {3}pnpm add foo\n {3}```$/m);
  assert.match(out, /^ {3}```bash\n {3}pnpm install\n {3}```$/m);
  // No fence line may sit at column 0 — that is what ejects the block.
  assert.doesNotMatch(out, /^```/m);
});

test('an unindented component is unaffected by indentation handling', () => {
  const out = transform('<PackageManagerTabs command="add foo" />');
  assert.equal(out.trim(), '```bash\npnpm add foo\n```');
});

test('a component mid-line is left alone rather than mangled', () => {
  // Only a tag that starts its own line can be indented correctly. Anything else
  // should fail loudly as untouched JSX rather than emit a broken fence inline.
  const src = 'See <PackageManagerTabs command="add foo" /> above.';
  assert.equal(transform(src), src);
});

// --- multi-segment `command` -------------------------------------------------

test('semicolons split a command into one line per segment', () => {
  const out = transform(
    '<PackageManagerTabs command="create bestax@latest my-app; cd my-app; install" />'
  );

  assert.equal(
    out.trim(),
    [
      '```bash',
      'pnpm create bestax@latest my-app',
      'cd my-app',
      'pnpm install',
      '```',
    ].join('\n')
  );
});

test('segments that are not package-manager verbs pass through verbatim', () => {
  const out = transform(
    '<PackageManagerTabs command="# Remove the old dependency; remove node-sass; add sass" />'
  );

  const lines = fenceLines(out);
  assert.equal(lines[1], '# Remove the old dependency');
  assert.equal(lines[2], 'pnpm remove node-sass');
  assert.equal(lines[3], 'pnpm add sass');
});

test('a trailing comment survives on a translated segment', () => {
  const out = transform(
    '<PackageManagerTabs command="dlx bestax-migrate src/ --dry # preview" />'
  );
  assert.match(out, /^pnpm dlx bestax-migrate src\/ --dry # preview$/m);
});

test('irregular spacing and a trailing semicolon produce no blank lines', () => {
  const out = transform(
    '<PackageManagerTabs command="add foo ;   cd app ;  install ; " />'
  );

  assert.equal(
    out.trim(),
    ['```bash', 'pnpm add foo', 'cd app', 'pnpm install', '```'].join('\n')
  );
});

test('indentation and multi-segment combine', () => {
  const src = [
    '1. **Scaffold:**',
    '',
    '   <PackageManagerTabs command="create vite@latest my-app -- --template react; cd my-app; install" />',
  ].join('\n');

  const out = transform(src);

  assert.match(
    out,
    /^ {3}```bash\n {3}pnpm create vite@latest my-app -- --template react\n {3}cd my-app\n {3}pnpm install\n {3}```$/m
  );
  assert.doesNotMatch(out, /^```/m);
});

test('transform stays idempotent when indented and multi-segment', () => {
  const src = [
    '1. **Scaffold:**',
    '',
    '   <PackageManagerTabs command="create foo my-app; cd my-app; install" />',
    '',
    '2. Done.',
  ].join('\n');

  const once = transform(src);
  assert.equal(transform(once), once);
});

test('an indented component flattens with no import line present', () => {
  // Global MDXComponents registration means pages carry no import at all.
  const src = [
    '- Note:',
    '',
    '  <PackageManagerTabs command="add foo" />',
  ].join('\n');
  const out = transform(src);

  assert.doesNotMatch(out, /<PackageManagerTabs/);
  assert.match(out, /^ {2}```bash\n {2}pnpm add foo\n {2}```$/m);
});

// --- the build gate ----------------------------------------------------------

test('verifyArtifact passes clean output', () => {
  const out = transform('   <PackageManagerTabs command="add foo" />');
  assert.deepEqual(verifyArtifact(out), []);
});

test('verifyArtifact catches tab JSX that reached the artifact', () => {
  // The shape that slips past the line-anchored regex.
  const problems = verifyArtifact(
    'See <PackageManagerTabs command="add foo" /> above.'
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /unflattened tab JSX/);
});

test('verifyArtifact ignores tab JSX inside code, as the flattener does', () => {
  const src = [
    '```mdx',
    '<PackageManagerTabs command="add foo" />',
    '```',
  ].join('\n');
  assert.deepEqual(verifyArtifact(src), []);
  assert.deepEqual(verifyArtifact('Prose about `<Tabs>` and `<TabItem>`.'), []);
});

test('verifyArtifact catches an unterminated fence', () => {
  // What a wrongly-indented emission looks like downstream.
  const problems = verifyArtifact('```bash\npnpm add foo\n');
  assert.deepEqual(problems, ['unterminated code fence']);
});

test('verifyArtifact catches the pre-fix corruption shape', () => {
  // Exactly what the old flattener produced for an indented component: opening
  // fence at 3 spaces, body and closer at column 0. Note the fences still *pair*
  // — CommonMark lets a closer sit at 0-3 spaces regardless of the opening indent
  // — so parity alone sees nothing wrong. The dedent check is what catches it.
  const corrupted = [
    '1. **Create it:**',
    '',
    '   ```bash',
    'pnpm add foo',
    '```',
    '',
    '2. **Then install:**',
  ].join('\n');

  assert.deepEqual(verifyArtifact(corrupted), [
    'fenced block dedented below its opening fence',
  ]);
});

test('a correctly indented fence is not flagged as dedented', () => {
  const fine = [
    '1. **Create it:**',
    '',
    '   ```bash',
    '   pnpm add foo',
    '   ```',
    '',
    '2. **Then install:**',
  ].join('\n');

  assert.deepEqual(verifyArtifact(fine), []);
});

test('a blank line inside an indented fence is not a dedent', () => {
  const fine = [
    '  ```ts',
    '  const a = 1;',
    '',
    '  const b = 2;',
    '  ```',
  ].join('\n');
  assert.deepEqual(verifyArtifact(fine), []);
});

// --- the gate past the 3-space break -----------------------------------------

test('verifyArtifact catches the corruption shape nested past 3 spaces', () => {
  // The same damage as above, one list level deeper, and inside a *concatenated*
  // artifact — which is the case that used to escape entirely. CommonMark reads
  // an opening fence at 4+ spaces as indented code, so the dedent check could not
  // see this fence at all; the stray column-0 ``` then paired with the next
  // page's fence instead, masking the whole region as code. Nothing was reported.
  const corrupted = [
    '1. Outer step:',
    '',
    '   - Inner step:',
    '',
    '     ```bash',
    'pnpm add foo',
    '```',
    '',
    '# Next page',
    '',
    '```ts',
    'const a = 1;',
    '```',
  ].join('\n');

  assert.deepEqual(verifyArtifact(corrupted), [
    'fenced block dedented below its opening fence',
  ]);
});

test('a correctly indented fence past 3 spaces is not flagged', () => {
  // Also pins the closing fence rule: a closer at 6 spaces has to pair with an
  // opener at 6 spaces, or this would report an unterminated fence instead.
  const fine = [
    '1. Outer step:',
    '',
    '   - Inner step:',
    '',
    '      ```bash',
    '      pnpm add foo',
    '      ```',
    '',
    '2. Done.',
  ].join('\n');

  assert.deepEqual(verifyArtifact(fine), []);
});

test('an unclosed fence past 3 spaces is not reported as unterminated', () => {
  // Deliberate: at the top level this is an indented code block that happens to
  // contain a ``` line, which is valid and harms nothing. The wide view is
  // trusted with the dedent signal only, so it cannot redden a build over this.
  const indentedCodeBlock = [
    'An indented code block showing a fence:',
    '',
    '    ```bash',
    '    pnpm add foo',
    '',
    '<PackageManagerTabs command="install" />',
  ].join('\n');

  assert.deepEqual(verifyArtifact(transform(indentedCodeBlock)), []);
});

test('a tab-indented fence line is indented code, not a fence', () => {
  // A tab advances to the next multiple of four, so this sits at column 4 — the
  // same indented-code reading as four spaces. Measuring it as one column would
  // open a fence here and report the document as unterminated.
  assert.deepEqual(verifyArtifact('\t```bash\n\tpnpm add foo\n'), []);
});

test('the JSX scan keeps the transform view of code, not the wide one', () => {
  // A tag inside a fence opened at 4 spaces *is* rewritten by transform (that
  // fence is indented code in the top-level reading), so the residual-JSX scan
  // has to read the document the same way. Scanning it through the wide view
  // would mask this region and call a genuine miss clean.
  const src = ['    ```mdx', '    <Tabs>', '    </Tabs>', '    ```'].join('\n');

  assert.match(transform(src), /^\s*```mdx$/m);
  assert.doesNotMatch(transform(src), /<Tabs>/);
  assert.deepEqual(verifyArtifact(transform(src)), []);
});

// --- generic <Tabs> in a list item -------------------------------------------

test('an indented generic Tabs block keeps its indentation', () => {
  const src = [
    '1. Pick one:',
    '',
    '   <Tabs>',
    '   <TabItem label="A">body a</TabItem>',
    '   <TabItem label="B">body b</TabItem>',
    '   </Tabs>',
  ].join('\n');

  const out = transform(src);

  assert.match(out, /^ {3}#### A$/m);
  assert.match(out, /^ {3}#### B$/m);
  assert.doesNotMatch(out, /^#### /m);
});
