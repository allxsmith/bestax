/**
 * react-bulma-components and rbx both take `textColor` on every component,
 * and both pass it through. A target with no `textColor` gets a TODO instead
 * (`NO_TEXT_COLOR`). Run through both sources, since the helper is shared and
 * each transform has to call it.
 */

import rbcTransform from '../../react-bulma-components/transform.js';
import rbxTransform from '../../rbx/transform.js';
import { runTransform } from '../../../runner.js';
import jscodeshift from 'jscodeshift';
import {
  COLOR_TAKEN_TODO,
  COLOR_VALUE_TODO,
  NO_TEXT_COLOR_TODO,
  applyTextColor,
} from '../text-color-props.js';
import type { TransformContext } from '../jsx-utils.js';
import type { TodoEntry } from '../../../types.js';

type Transform = typeof rbcTransform;

function migrate(transform: Transform, source: string) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(transform, 'case.tsx', source, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? '', todos };
}

/** [source, transform, import line, element as written, bestax element]. */
type Case = [string, Transform, string, string, string];

const TAKES_TEXT_COLOR: Case[] = [
  [
    'react-bulma-components',
    rbcTransform,
    "import { Box } from 'react-bulma-components';",
    'Box',
    'Box',
  ],
  ['rbx', rbxTransform, "import { Box } from 'rbx';", 'Box', 'Box'],
];

const TAKES_NONE: Case[] = [
  [
    'react-bulma-components',
    rbcTransform,
    "import { Tag } from 'react-bulma-components';",
    'Tag',
    'Tag',
  ],
  ['rbx', rbxTransform, "import { Tag } from 'rbx';", 'Tag', 'Tag'],
  [
    'react-bulma-components',
    rbcTransform,
    "import { Tabs } from 'react-bulma-components';",
    'Tabs',
    'Tabs',
  ],
  ['rbx', rbxTransform, "import { Tab } from 'rbx';", 'Tab.Group', 'Tabs'],
];

/** Targets whose `color` sets the text, so textColor becomes it (#1781). */
const TAKES_COLOR: Case[] = [
  [
    'react-bulma-components',
    rbcTransform,
    "import { Table } from 'react-bulma-components';",
    'Table',
    'Table',
  ],
  ['rbx', rbxTransform, "import { Table } from 'rbx';", 'Table', 'Table'],
  [
    'react-bulma-components',
    rbcTransform,
    "import { Menu } from 'react-bulma-components';",
    'Menu',
    'Menu',
  ],
  ['rbx', rbxTransform, "import { Menu } from 'rbx';", 'Menu', 'Menu'],
  [
    'react-bulma-components',
    rbcTransform,
    "import { Dropdown } from 'react-bulma-components';",
    'Dropdown.Item',
    'Dropdown.Item',
  ],
  [
    'rbx',
    rbxTransform,
    "import { Table } from 'rbx';",
    'Table.Head',
    'Table.Thead',
  ],
];

const run = ([, transform, imp, from]: Case, attrs: string) =>
  migrate(
    transform,
    `${imp}\nexport const A = ({ c }: { c: string }) => <${from} ${attrs}>x</${from}>;\n`
  );

describe.each(TAKES_TEXT_COLOR)('%s %s, which takes textColor', (...c) => {
  it('keeps textColor with no TODO', () => {
    const { output, todos } = run(c, 'textColor="primary"');
    expect(output).toContain(`<${c[4]} textColor="primary">`);
    expect(todos).toEqual([]);
  });
});

describe.each(TAKES_NONE)('%s %s, which takes no textColor', (...c) => {
  it.each(['textColor="primary"', 'textColor={c}'])(
    'leaves %s as written, with a TODO',
    attr => {
      const { output, todos } = run(c, attr);
      expect(output).toContain(`<${c[4]} ${attr}>`);
      expect(todos.map(t => [t.rule, t.message])).toEqual([
        ['prop:textColor', `\`textColor\` — ${NO_TEXT_COLOR_TODO}`],
      ]);
    }
  );
});

describe.each(TAKES_COLOR)('%s %s, whose color sets the text', (...c) => {
  it.each(['textColor="primary"', 'textColor="inherit"'])(
    'renames %s to color with no TODO',
    attr => {
      const { output, todos } = run(c, attr);
      expect(output).toContain(
        `<${c[4]} ${attr.replace('textColor', 'color')}>`
      );
      expect(todos).toEqual([]);
    }
  );

  it.each(['textColor={c}', 'textColor="text"', 'textColor="primary-dark"'])(
    'leaves %s, which color may not take, with a TODO',
    attr => {
      const { output, todos } = run(c, attr);
      expect(output).toContain(`<${c[4]} ${attr}>`);
      expect(todos.map(t => [t.rule, t.message])).toEqual([
        ['prop:textColor', `\`textColor\` — ${COLOR_VALUE_TODO}`],
      ]);
    }
  );

  it.each([
    'color="info" textColor="primary"',
    'textColor="primary" {...rest}',
  ])('leaves %s with a TODO, since color is or may be set already', attrs => {
    const [, transform, imp, from] = c;
    const { output, todos } = migrate(
      transform,
      `${imp}\nexport const A = (rest: object) => <${from} ${attrs}>x</${from}>;\n`
    );
    expect(output).toContain('textColor="primary"');
    expect(todos.map(t => [t.rule, t.message])).toEqual([
      ['prop:textColor', `\`textColor\` — ${COLOR_TAKEN_TODO}`],
    ]);
  });
});

it("leaves a textColor the component's own prop map handled alone", () => {
  const j = jscodeshift.withParser('tsx');
  const root = j('<Tag textColor="white">x</Tag>;');
  const path = root.find(j.JSXElement).paths()[0];
  const before = root.toSource();
  // The guard returns before it reads the context, so none is needed.
  applyTextColor(
    {} as TransformContext,
    path,
    path.node,
    'Tag',
    new Set(['textColor'])
  );
  expect(root.toSource()).toBe(before);
});
