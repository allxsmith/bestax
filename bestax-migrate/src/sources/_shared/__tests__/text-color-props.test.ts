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
import { NO_TEXT_COLOR_TODO, applyTextColor } from '../text-color-props.js';
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
    "import { Table } from 'react-bulma-components';",
    'Table',
    'Table',
  ],
  ['rbx', rbxTransform, "import { Table } from 'rbx';", 'Table', 'Table'],
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
