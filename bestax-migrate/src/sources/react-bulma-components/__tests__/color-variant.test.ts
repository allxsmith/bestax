/**
 * react-bulma-components renders `colorVariant` as the `is-light` or
 * `is-dark` class on any component. On Button, Notification and Tag, whose
 * bestax components render `is-light` from `isLight`, a literal `light`
 * converts to it; every other value, a dynamic one and every other target
 * keep the universal TODO (#1732).
 */

import transform from '../transform.js';
import { UNIVERSAL_PROPS } from '../mapping.js';
import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';

function migrate(source: string) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(transform, 'case.tsx', source, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? '', todos };
}

const run = (name: string, attrs: string) =>
  migrate(
    `import { ${name} } from 'react-bulma-components';\n` +
      `export const A = ({ v }: { v: 'light' | 'dark' }) => <${name} color="info" ${attrs}>x</${name}>;\n`
  );

const UNIVERSAL_TODO = [
  [
    'prop:colorVariant',
    `\`colorVariant\` — ${UNIVERSAL_PROPS.colorVariant.todo}`,
  ],
];
const todosOf = (todos: TodoEntry[]) => todos.map(t => [t.rule, t.message]);

describe.each(['Button', 'Notification', 'Tag'])('colorVariant on %s', name => {
  it('turns "light" into isLight', () => {
    const { output, todos } = run(name, 'colorVariant="light"');
    expect(output).toContain(`<${name} color="info" isLight>`);
    expect(output).not.toContain('colorVariant');
    expect(todos).toEqual([]);
  });

  it.each(['colorVariant="dark"', 'colorVariant={v}', 'colorVariant="Light"'])(
    'leaves %s with the universal TODO',
    attr => {
      const { output, todos } = run(name, attr);
      expect(output).toContain(`<${name} color="info" ${attr}>`);
      expect(todosOf(todos)).toEqual(UNIVERSAL_TODO);
    }
  );

  it.each(['isLight', 'isLight={false}', 'isLight={v === "light"}'])(
    'replaces %s with a bare isLight, since the class rendered either way',
    attr => {
      const { output, todos } = run(name, `${attr} colorVariant="light"`);
      expect(output).toContain(`<${name} color="info" isLight>`);
      expect(todos).toEqual([]);
    }
  );

  it('keeps the TODO where a later spread could override it', () => {
    const { output, todos } = migrate(
      `import { ${name} } from 'react-bulma-components';\n` +
        `export const A = (rest: object) => <${name} colorVariant="light" {...rest}>x</${name}>;\n`
    );
    expect(output).toContain(`<${name} colorVariant="light" {...rest}>`);
    expect(todosOf(todos)).toEqual(UNIVERSAL_TODO);
  });
});

it("replaces Notification's own light prop, read or not, with a bare isLight", () => {
  for (const light of ['light', 'light={c}']) {
    const { output, todos } = migrate(
      "import { Notification } from 'react-bulma-components';\n" +
        `export const A = ({ c }: { c: boolean }) => <Notification ${light} colorVariant="light">x</Notification>;\n`
    );
    expect(output).toContain('<Notification isLight>');
    expect(todos).toEqual([]);
  }
});

it('keeps the TODO on a component whose bestax target has no isLight', () => {
  const { output, todos } = run('Box', 'colorVariant="light"');
  expect(output).toContain('colorVariant="light"');
  expect(todosOf(todos)).toEqual(UNIVERSAL_TODO);
});

it('keeps the TODO on a Button that becomes Delete', () => {
  const { output, todos } = migrate(
    'import { Button } from \'react-bulma-components\';\nexport const A = () => <Button remove colorVariant="light" />;\n'
  );
  expect(output).toContain('<Delete colorVariant="light" />');
  expect(todosOf(todos)).toEqual(UNIVERSAL_TODO);
});
