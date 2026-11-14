/**
 * Every library source has a `Heading` that rendered Bulma 0.9's `.heading`
 * label, and each leaves it as plain markup with the class, since bestax has
 * no component for it. Bulma v1 has no rule for `.heading`, so the class
 * styles nothing there. bloomer said so and rbx and react-bulma-components
 * didn't (#1370); these hold all three to one rule and one message, and to
 * the element each source rendered: its default, or the one its own element
 * prop named (#1415).
 */

import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';
import { SOURCES } from '../../registry.js';

const CASES = [
  {
    source: 'react-bulma-components',
    // RBC's label is a `Heading` with a truthy `heading`, rendered through
    // `renderAs`, an <h1> by default.
    open: 'Heading heading',
    prop: 'renderAs',
    tag: 'h1',
  },
  { source: 'rbx', open: 'Heading', prop: 'as', tag: 'p' },
  { source: 'bloomer', open: 'Heading', prop: 'tag', tag: 'p' },
];

function migrate(source: string, jsx: string) {
  const input = `import { Heading } from '${source}';\nexport const A = ({ t }: { t: 'h2' }) => ${jsx};\n`;
  const todos: TodoEntry[] = [];
  const { output } = runTransform(SOURCES[source].transform, 'a.tsx', input, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? input, todos };
}

describe.each(CASES)('$source', ({ source, open, prop, tag }) => {
  it(`keeps the label as the plain <${tag}> it rendered`, () => {
    expect(migrate(source, `<${open}>Followers</Heading>`).output).toContain(
      `<${tag} className="heading">Followers</${tag}>`
    );
  });

  it('says Bulma v1 dropped `.heading` and names the helper props', () => {
    const { todos } = migrate(source, `<${open}>Followers</Heading>`);
    expect(todos.map(t => t.rule)).toEqual(['component:Heading']);
    expect(todos[0].message).toContain('Bulma v1 dropped the `.heading`');
    expect(todos[0].message).toContain(`this plain <${tag}>`);
    expect(todos[0].message).toContain(
      '<Paragraph textSize="7" textTransform="uppercase" textWeight="semibold" mb="1">'
    );
  });

  it(`writes the element a literal \`${prop}\` named, and says so`, () => {
    const { output, todos } = migrate(
      source,
      `<${open} ${prop}="h6">Label</Heading>`
    );
    expect(output).toContain('<h6 className="heading">Label</h6>');
    expect(todos.map(t => t.rule)).toEqual(['component:Heading']);
    expect(todos[0].message).toContain('this plain <h6>');
  });

  it(`keeps the <${tag}> beside a \`${prop}\` value it can't read, and flags it`, () => {
    const { output, todos } = migrate(
      source,
      `<${open} ${prop}={t}>Label</Heading>`
    );
    expect(output).toContain(`<${tag} className="heading">Label</${tag}>`);
    expect(todos.map(t => t.rule)).toEqual([
      `prop:${prop}`,
      'component:Heading',
    ]);
    expect(todos[0].message).toContain(`it became a plain <${tag}>`);
  });
});

it('gives the same message in every source', () => {
  const messages = new Set(
    CASES.map(
      ({ source, open, prop }) =>
        migrate(source, `<${open} ${prop}="h6">Followers</Heading>`).todos[0]
          ?.message
    )
  );
  expect(messages.size).toBe(1);
});

// RBC wrote its `size` and `weight` as classes on the label as well, which
// Bulma v1 still styles beside `.subtitle` and on their own.
describe('react-bulma-components label classes', () => {
  it('keeps a literal size and weight as the classes RBC wrote', () => {
    expect(
      migrate(
        'react-bulma-components',
        '<Heading heading size={6} weight="bold">Tweets</Heading>'
      ).output
    ).toContain(
      '<h1 className="heading is-6 has-text-weight-bold">Tweets</h1>'
    );
    const small = migrate(
      'react-bulma-components',
      '<Heading heading subtitle size="6">Likes</Heading>'
    );
    expect(small.output).toContain(
      '<h1 className="heading subtitle is-6">Likes</h1>'
    );
    expect(small.todos.map(t => t.rule)).toEqual(['component:Heading']);
  });

  it("flags a size or weight it can't read", () => {
    const { output, todos } = migrate(
      'react-bulma-components',
      '<Heading heading size={t.length} weight={t}>Tweets</Heading>'
    );
    expect(output).toContain('<h1 className="heading">Tweets</h1>');
    expect(todos.map(t => t.rule)).toEqual([
      'component:Heading',
      'prop:size',
      'prop:weight',
    ]);
    expect(todos[2].message).toContain('has-text-weight-*');
  });
});
