/**
 * react-bulma-components gives a Dropdown's `color` to its trigger button,
 * while bestax's Dropdown has no prop for that and puts its own `color` on
 * the root as a text helper, so it keeps a TODO rather than carrying over with
 * a new meaning (#1792).
 */

import transform from '../transform.js';
import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';

function migrate(source: string) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(transform, 'case.tsx', source, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? '', todos };
}

it.each(['color="info"', 'color={c}'])(
  "flags a Dropdown's %s, which colored its trigger",
  attr => {
    const { output, todos } = migrate(
      "import { Dropdown } from 'react-bulma-components';\n" +
        `export const A = ({ c }: { c: string }) => <Dropdown label="Pick" ${attr}>x</Dropdown>;\n`
    );
    expect(output).toContain(attr);
    expect(todos).toHaveLength(1);
    expect(todos[0].rule).toBe('prop:color');
    expect(todos[0].message).toContain('trigger button');
    expect(todos[0].message).toContain(
      "bestax's Dropdown has no prop for that"
    );
    expect(todos[0].message).toContain('remove it');
  }
);
