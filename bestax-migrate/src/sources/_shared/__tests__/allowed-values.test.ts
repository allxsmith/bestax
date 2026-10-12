/**
 * `PropAction.allowed`: a group or message `size` carries over only when it
 * is one bestax takes, and anything else stays as written with a TODO. Run
 * through both sources that use it, since the action is shared and a
 * mapping that forgot it would pass every value through again.
 */

import rbcTransform from '../../react-bulma-components/transform.js';
import rbxTransform from '../../rbx/transform.js';
import { runTransform } from '../../../runner.js';
import { SIZE_UNIONS } from '../size-unions.js';
import type { TodoEntry } from '../../../types.js';

type Transform = typeof rbcTransform;

function migrate(transform: Transform, source: string) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(transform, 'case.tsx', source, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? '', todos };
}

/** [source, transform, import line, element as written, bestax element, the sizes it takes]. */
const CASES: Array<
  [string, Transform, string, string, string, readonly string[]]
> = [
  [
    'react-bulma-components',
    rbcTransform,
    "import { Button } from 'react-bulma-components';",
    'Button.Group',
    'Buttons',
    SIZE_UNIONS.Buttons,
  ],
  [
    'react-bulma-components',
    rbcTransform,
    "import { Message } from 'react-bulma-components';",
    'Message',
    'Message',
    SIZE_UNIONS.Message,
  ],
  [
    'rbx',
    rbxTransform,
    "import { Button } from 'rbx';",
    'Button.Group',
    'Buttons',
    SIZE_UNIONS.Buttons,
  ],
  [
    'rbx',
    rbxTransform,
    "import { Tag } from 'rbx';",
    'Tag.Group',
    'Tags',
    SIZE_UNIONS.Tags,
  ],
  [
    'rbx',
    rbxTransform,
    "import { Message } from 'rbx';",
    'Message',
    'Message',
    SIZE_UNIONS.Message,
  ],
];

describe.each(CASES)(
  '%s %s size',
  (_source, transform, imp, from, to, sizes) => {
    const run = (attr: string) =>
      migrate(
        transform,
        `${imp}\nexport const A = ({ s }: { s: string }) => <${from} ${attr}>x</${from}>;\n`
      );

    it.each([...sizes])('carries size="%s" over with no TODO', size => {
      const { output, todos } = run(`size="${size}"`);
      expect(output).toContain(`<${to} size="${size}">`);
      expect(todos).toEqual([]);
    });

    it.each([
      ['an unknown string', 'size="normal"', 'size="normal"'],
      ['a number', 'size={2}', 'size={2}'],
      ['a bare attribute', 'size', 'size'],
      ['false', 'size={false}', 'size={false}'],
    ])('keeps %s as written, with a TODO naming it', (_name, attr, written) => {
      const { output, todos } = run(attr);
      expect(output).toContain(`<${to} ${attr}>`);
      expect(todos.map(t => t.rule)).toEqual(['prop:size']);
      expect(todos[0].message).toContain(
        `\`${written}\` on \`<${to}>\` is not a value bestax-bulma takes`
      );
      for (const size of sizes) expect(todos[0].message).toContain(`'${size}'`);
    });

    it('keeps a dynamic size as written, with a TODO', () => {
      const { output, todos } = run('size={s}');
      expect(output).toContain(`<${to} size={s}>`);
      expect(todos.map(t => t.rule)).toEqual(['prop:size']);
      expect(todos[0].message).toContain(
        `\`size\` on \`<${to}>\` has a dynamic value`
      );
    });
  }
);
