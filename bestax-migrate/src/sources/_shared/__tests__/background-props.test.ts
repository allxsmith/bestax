/**
 * react-bulma-components and rbx both take `backgroundColor` on every
 * component, and both rename it to `bgColor` by default. A target that has no
 * `bgColor` keeps `backgroundColor` when it takes that, and gets a TODO when
 * it takes neither (`BACKGROUND_PROPS`). Run
 * through both sources, since the helper is shared and each transform has to
 * call it.
 */

import rbcTransform from '../../react-bulma-components/transform.js';
import rbxTransform from '../../rbx/transform.js';
import { runTransform } from '../../../runner.js';
import jscodeshift from 'jscodeshift';
import {
  NO_BACKGROUND_TODO,
  applyBackgroundColor,
} from '../background-props.js';
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

const TAKES_BG_COLOR: Case[] = [
  [
    'react-bulma-components',
    rbcTransform,
    "import { Box } from 'react-bulma-components';",
    'Box',
    'Box',
  ],
  ['rbx', rbxTransform, "import { Box } from 'rbx';", 'Box', 'Box'],
];

const TAKES_BACKGROUND_COLOR: Case[] = [
  [
    'react-bulma-components',
    rbcTransform,
    "import { Tag } from 'react-bulma-components';",
    'Tag',
    'Tag',
  ],
  ['rbx', rbxTransform, "import { Tag } from 'rbx';", 'Tag', 'Tag'],
];

const TAKES_NEITHER: Case[] = [
  [
    'react-bulma-components',
    rbcTransform,
    "import { Notification } from 'react-bulma-components';",
    'Notification',
    'Notification',
  ],
  [
    'rbx',
    rbxTransform,
    "import { Notification } from 'rbx';",
    'Notification',
    'Notification',
  ],
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

describe.each(TAKES_BG_COLOR)('%s %s, which takes bgColor', (...c) => {
  it('renames backgroundColor to bgColor', () => {
    const { output, todos } = run(c, 'backgroundColor="primary"');
    expect(output).toContain(`<${c[4]} bgColor="primary">`);
    expect(todos).toEqual([]);
  });
});

describe.each(TAKES_BACKGROUND_COLOR)(
  '%s %s, which takes backgroundColor',
  (...c) => {
    it('keeps backgroundColor', () => {
      const { output, todos } = run(c, 'backgroundColor="primary"');
      expect(output).toContain(`<${c[4]} backgroundColor="primary">`);
      expect(output).not.toContain('bgColor');
      expect(todos).toEqual([]);
    });

    it('keeps a dynamic one too', () => {
      const { output, todos } = run(c, 'backgroundColor={c}');
      expect(output).toContain(`<${c[4]} backgroundColor={c}>`);
      expect(todos).toEqual([]);
    });
  }
);

describe.each(TAKES_NEITHER)('%s %s, which takes neither', (...c) => {
  it.each(['backgroundColor="primary"', 'backgroundColor={c}'])(
    'leaves %s as written, with a TODO, rather than renaming it to bgColor',
    attr => {
      const { output, todos } = run(c, attr);
      expect(output).toContain(`<${c[4]} ${attr}>`);
      expect(output).not.toContain('bgColor');
      expect(todos.map(t => [t.rule, t.message])).toEqual([
        ['prop:backgroundColor', `\`backgroundColor\` — ${NO_BACKGROUND_TODO}`],
      ]);
    }
  );
});

it("leaves a backgroundColor the component's own prop map handled alone", () => {
  const j = jscodeshift.withParser('tsx');
  const root = j('<Notification backgroundColor="info">x</Notification>;');
  const path = root.find(j.JSXElement).paths()[0];
  const before = root.toSource();
  const handled = new Set(['backgroundColor']);
  // The guard returns before it reads the context, so none is needed.
  applyBackgroundColor(
    {} as TransformContext,
    path,
    path.node,
    'Notification',
    handled
  );
  expect(root.toSource()).toBe(before);
});
