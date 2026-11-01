/**
 * Every library source has a `Heading` that rendered Bulma 0.9's `.heading`
 * label, and each leaves it as plain markup with the class, since bestax has
 * no component for it. Bulma v1 has no rule for `.heading`, so the class
 * styles nothing there. bloomer said so and rbx and react-bulma-components
 * didn't (#1370); these hold all three to one rule and one message.
 */

import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';
import { SOURCES } from '../../registry.js';

const CASES = [
  {
    source: 'react-bulma-components',
    input:
      "import { Heading } from 'react-bulma-components';\nexport const A = () => <Heading heading>Followers</Heading>;\n",
  },
  {
    source: 'rbx',
    input:
      "import { Heading } from 'rbx';\nexport const A = () => <Heading>Followers</Heading>;\n",
  },
  {
    source: 'bloomer',
    input:
      "import { Heading } from 'bloomer';\nexport const A = () => <Heading>Followers</Heading>;\n",
  },
];

function migrate(source: string, input: string) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(SOURCES[source].transform, 'a.tsx', input, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? input, todos };
}

describe.each(CASES)('$source', ({ source, input }) => {
  it('keeps the label as a plain <p className="heading">', () => {
    expect(migrate(source, input).output).toContain(
      '<p className="heading">Followers</p>'
    );
  });

  it('says Bulma v1 dropped `.heading` and names the helper props', () => {
    const { todos } = migrate(source, input);
    expect(todos.map(t => t.rule)).toEqual(['component:Heading']);
    expect(todos[0].message).toContain('Bulma v1 dropped the `.heading`');
    expect(todos[0].message).toContain(
      '<Paragraph textSize="7" textTransform="uppercase" textWeight="semibold" mb="1">'
    );
  });
});

it('gives the same message in every source', () => {
  const messages = new Set(
    CASES.map(({ source, input }) => migrate(source, input).todos[0]?.message)
  );
  expect(messages.size).toBe(1);
});

it('names the element bloomer wrote when its `tag` picked another', () => {
  const { output, todos } = migrate(
    'bloomer',
    'import { Heading } from \'bloomer\';\nexport const A = () => <Heading tag="h6">Label</Heading>;\n'
  );
  expect(output).toContain('<h6 className="heading">Label</h6>');
  expect(todos[0].message).toContain('this plain <h6>');
});
