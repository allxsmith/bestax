/**
 * Helper-flattening coverage: the shapes a fixture can show once, but whose
 * failure paths need one case each. bloomer's `isDisplay` has three shapes
 * and every one of them can be handed something the codemod must refuse to
 * guess at rather than silently mangle.
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

/** The output without its TODO comment lines, for assertions about the JSX. */
const jsx = (s: string): string =>
  s
    .split('\n')
    .filter(l => !l.trimStart().startsWith('//'))
    .join('\n');

const box = (attrs: string) =>
  `import { Box } from 'bloomer';\nexport const A = (p: Record<string, any>) => <Box ${attrs}>x</Box>;`;
const column = (attrs: string) =>
  `import { Column } from 'bloomer';\nexport const A = (p: Record<string, any>) => <Column ${attrs}>x</Column>;`;

describe('isDisplay', () => {
  it('flattens every viewport suffix bestax declares', () => {
    const { output, rules } = migrate(
      box(
        'isDisplay={["flex-mobile", "flex-tablet", "flex-tablet-only", "flex-touch", "flex-desktop", "flex-desktop-only", "flex-widescreen", "flex-widescreen-only", "flex-fullhd"]}'
      )
    );
    expect(rules).toEqual([]);
    for (const suffix of [
      'Mobile',
      'Tablet',
      'TabletOnly',
      'Touch',
      'Desktop',
      'DesktopOnly',
      'Widescreen',
      'WidescreenOnly',
      'Fullhd',
    ]) {
      expect(output).toContain(`display${suffix}="flex"`);
    }
  });

  it('reads inline-block and inline-flex as displays, not inline plus a viewport', () => {
    const { output } = migrate(
      box('isDisplay={["inline-block-mobile", "inline-flex"]}')
    );
    expect(output).toContain('displayMobile="inline-block"');
    expect(output).toContain('display="inline-flex"');
  });

  it('flags a string that is not a display', () => {
    const { output, rules } = migrate(box('isDisplay="grid-mobile"'));
    expect(rules).toEqual(['prop:isDisplay']);
    expect(jsx(output)).not.toContain('display');
  });

  it('flags an entry that lands on a prop already set', () => {
    const { output, rules } = migrate(box('isDisplay={["flex", "block"]}'));
    expect(rules).toEqual(['prop:isDisplay']);
    expect(output).toContain('display="flex"');
    expect(jsx(output)).not.toContain('display="block"');
  });

  it('flags a dynamic array entry and keeps the literal ones', () => {
    const { output, rules } = migrate(box('isDisplay={["flex", p.d]}'));
    expect(rules).toEqual(['prop:isDisplay']);
    expect(output).toContain('display="flex"');
  });

  it('flags object keys that are not displays and dynamic object values', () => {
    const { output, rules } = migrate(
      box('isDisplay={{ grid: "mobile", flex: p.v }}')
    );
    expect(rules).toEqual(['prop:isDisplay', 'prop:isDisplay']);
    expect(jsx(output)).not.toContain('isplay');
  });

  it('flags an object value naming a viewport bestax does not have', () => {
    const { rules } = migrate(
      box('isDisplay={{ flex: ["default", "print"] }}')
    );
    expect(rules).toEqual(['prop:isDisplay']);
  });
});

describe('isHidden', () => {
  it('flags a viewport bestax does not have', () => {
    const { output, rules } = migrate(box('isHidden="print"'));
    expect(rules).toEqual(['prop:isHidden']);
    expect(jsx(output)).not.toContain('idden');
  });

  it('flags a dynamic array entry and keeps the literal ones', () => {
    const { output, rules } = migrate(box('isHidden={["tablet", p.v]}'));
    expect(rules).toEqual(['prop:isHidden']);
    expect(output).toContain('visibilityTablet="hidden"');
  });

  it('flags an entry that lands on a prop already set', () => {
    const { rules } = migrate(box('isHidden={["tablet", "tablet"]}'));
    expect(rules).toEqual(['prop:isHidden']);
  });
});

describe('Column isSize / isOffset', () => {
  it('accepts numeric strings and rejects the rest', () => {
    const ok = migrate(column('isSize="6" isOffset="3"'));
    expect(ok.output).toContain('<Column size="6" offset="3">');
    const bad = migrate(column('isSize="13"'));
    expect(bad.rules).toEqual(['prop:isSize']);
    expect(bad.output).toContain('<Column>');
  });

  it('refuses a narrow offset', () => {
    const { output, rules } = migrate(column('isOffset="narrow"'));
    expect(rules).toEqual(['prop:isOffset']);
    expect(output).toContain('<Column>');
  });

  it('flags a dynamic scalar', () => {
    const { rules } = migrate(column('isSize={p.s}'));
    expect(rules).toEqual(['prop:isSize']);
  });

  it('flags object keys bestax has no column props for', () => {
    const { output, rules } = migrate(
      column('isSize={{ print: 4, touch: 6 }} isOffset={{ touch: "narrow" }}')
    );
    expect(rules).toEqual(['prop:isSize', 'prop:isSize', 'prop:isOffset']);
    expect(output).toContain('<Column>');
  });

  it('keeps a numeric literal inside an object numeric', () => {
    const { output } = migrate(
      column('isSize={{ desktop: 3, default: "1/4" }}')
    );
    expect(output).toContain('size="one-quarter"');
    expect(output).toContain('sizeDesktop={3}');
  });

  it('does not touch isSize on components that are not columns', () => {
    const { output } = migrate(
      `import { Title } from 'bloomer';\nexport const A = () => <Title isSize={{ mobile: 1 }}>x</Title>;`
    );
    expect(output).toContain('<Title size={{ mobile: 1 }}>');
  });
});
