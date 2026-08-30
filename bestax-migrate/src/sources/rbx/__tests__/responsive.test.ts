/**
 * Breakpoint-flattening coverage: the shapes a fixture can show once, but
 * whose failure paths need one case each. rbx has three breakpoint shapes and
 * every one of them can be handed something the codemod must refuse to guess
 * at rather than silently mangle.
 */

import transform from '../transform.js';
import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';

function migrate(source: string) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(transform, 'case.tsx', source, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? '', todos, rules: todos.map(t => t.rule) };
}

const box = (attrs: string) =>
  `import { Box } from 'rbx';\nexport const A = (p: Record<string, unknown>) => <Box ${attrs}>x</Box>;`;
const column = (attrs: string) =>
  `import { Column } from 'rbx';\nexport const A = (p: Record<string, unknown>) => <Column ${attrs}>x</Column>;`;
const group = (attrs: string) =>
  `import { Column } from 'rbx';\nexport const A = (p: Record<string, unknown>) => <Column.Group ${attrs}>x</Column.Group>;`;

describe('the universal `responsive` helper prop', () => {
  it('flattens every helper it knows', () => {
    const { output } = migrate(
      box(
        'responsive={{ mobile: { hide: { value: true } }, tablet: { display: { value: "flex" }, textSize: { value: 3 }, textAlign: { value: "centered" } } }}'
      )
    );
    expect(output).toContain('visibilityMobile="hidden"');
    expect(output).toContain('displayTablet="flex"');
    expect(output).toContain('textSizeTablet="3"');
    expect(output).toContain('textAlignTablet="centered"');
  });

  it('always removes the prop — bestax has its own unrelated `responsive`', () => {
    const { output } = migrate(
      box(
        'responsive={{ desktop: { display: { value: "block", only: true } } }}'
      )
    );
    expect(output).not.toContain('responsive=');
  });

  it('drops a `hide: { value: false }` as the no-op it is', () => {
    const { output, todos } = migrate(
      box('responsive={{ mobile: { hide: { value: false } } }}')
    );
    expect(output).not.toContain('visibilityMobile');
    expect(todos).toHaveLength(0);
  });

  it('TODOs the touch breakpoint, which bestax has no viewport for', () => {
    const { rules } = migrate(
      box('responsive={{ touch: { hide: { value: true } } }}')
    );
    expect(rules).toContain('responsive');
  });

  it('TODOs a breakpoint bestax does not know', () => {
    const { todos } = migrate(
      box('responsive={{ nope: { hide: { value: true } } }}')
    );
    expect(todos.some(t => /is not a breakpoint/.test(t.message))).toBe(true);
  });

  it('TODOs a non-object responsive value', () => {
    const { todos } = migrate(box('responsive={p.r as never}'));
    expect(
      todos.some(t => /must be an inline object literal/.test(t.message))
    ).toBe(true);
  });

  it('TODOs a non-object breakpoint value', () => {
    const { todos } = migrate(box('responsive={{ tablet: p.t as never }}'));
    expect(
      todos.some(t =>
        /responsive\.tablet` must be an inline object/.test(t.message)
      )
    ).toBe(true);
  });

  it('TODOs a cell that is not the { value } shape', () => {
    const { todos } = migrate(box('responsive={{ tablet: { display: 5 } }}'));
    expect(todos.some(t => /the `\{ value \}` shape/.test(t.message))).toBe(
      true
    );
  });

  it('TODOs an unknown helper inside a breakpoint', () => {
    const { todos } = migrate(
      box('responsive={{ tablet: { nope: { value: 1 } } }}')
    );
    expect(todos.some(t => /could not be flattened/.test(t.message))).toBe(
      true
    );
  });

  it.each([
    [
      'display',
      'responsive={{ tablet: { display: { value: p.d as never } } }}',
    ],
    [
      'textAlign',
      'responsive={{ tablet: { textAlign: { value: p.a as never } } }}',
    ],
    [
      'textSize',
      'responsive={{ tablet: { textSize: { value: p.s as never } } }}',
    ],
    ['hide', 'responsive={{ tablet: { hide: { value: p.h as never } } }}'],
  ])('TODOs a dynamic %s value', (_name, attrs) => {
    const { todos } = migrate(box(attrs));
    expect(todos.some(t => /dynamic value/.test(t.message))).toBe(true);
  });

  it('names the breakpoints that could not carry when it drops the prop', () => {
    const { todos } = migrate(
      box('responsive={{ tablet: { nope: { value: 1 } } }}')
    );
    expect(
      todos.some(t =>
        /dropped the `responsive` prop; the `tablet`/.test(t.message)
      )
    ).toBe(true);
  });
});

describe('Column and Column.Group breakpoint props', () => {
  it('flattens Column sizing', () => {
    const { output } = migrate(
      column('tablet={{ size: 6, offset: 1, narrow: true }}')
    );
    expect(output).toContain('sizeTablet={6}');
    expect(output).toContain('offsetTablet={1}');
    expect(output).toContain('isNarrowTablet');
  });

  it('emits a bare string for a named column size', () => {
    const { output } = migrate(column('desktop={{ size: "one-third" }}'));
    expect(output).toContain('sizeDesktop="one-third"');
    expect(output).not.toContain('sizeDesktop={"one-third"}');
  });

  it('drops a falsy narrow', () => {
    const { output } = migrate(column('tablet={{ narrow: false }}'));
    expect(output).not.toContain('isNarrowTablet');
  });

  it('drops a dynamic narrow, naming it', () => {
    const { output, todos } = migrate(
      column('tablet={{ narrow: p.n as never }}')
    );
    expect(output).not.toContain('tablet={{');
    expect(todos.some(t => /narrow \(dynamic value\)/.test(t.message))).toBe(
      true
    );
  });

  it('drops a touch size, which bestax has no column variant for', () => {
    const { output, todos } = migrate(column('touch={{ size: 12 }}'));
    expect(output).not.toContain('touch=');
    // bestax has `isNarrowTouch` but no `sizeTouch`, so the key is named
    // rather than the whole breakpoint being written off.
    expect(todos.some(t => /dropped `touch\.size`/.test(t.message))).toBe(true);
  });

  it('drops a non-object breakpoint on a Column', () => {
    const { output, todos } = migrate(column('tablet={p.t as never}'));
    expect(output).not.toContain('tablet=');
    expect(
      todos.some(t => /must be an inline object literal/.test(t.message))
    ).toBe(true);
  });

  it('drops a key it cannot flatten on a Column, naming it', () => {
    const { output, todos } = migrate(column('tablet={{ nope: 1 }}'));
    expect(output).not.toContain('tablet={{');
    expect(todos.some(t => /dropped `tablet\.nope`/.test(t.message))).toBe(
      true
    );
  });

  it('maps Column.Group gapSize onto bestax gap', () => {
    const { output } = migrate(group('tablet={{ gapSize: 2 }} gapSize={4}'));
    expect(output).toContain('gapTablet={2}');
    expect(output).toContain('gap={4}');
  });

  it('drops a key it cannot flatten on a Column.Group, naming it', () => {
    const { output, todos } = migrate(group('tablet={{ nope: 1 }}'));
    expect(output).not.toContain('tablet={{');
    expect(todos.some(t => /dropped `tablet\.nope`/.test(t.message))).toBe(
      true
    );
  });
});
