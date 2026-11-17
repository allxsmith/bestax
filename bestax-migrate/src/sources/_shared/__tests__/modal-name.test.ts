/**
 * bestax's `Modal` is a dialog while it's open, and no conversion names it,
 * so a converted `Modal` with no `aria-label` or `aria-labelledby` gets a
 * `name:Modal` TODO (#1941). Run through every library source, since the
 * helper is shared and each transform has to call it.
 */

import bloomerTransform from '../../bloomer/transform.js';
import rbcTransform from '../../react-bulma-components/transform.js';
import rbxTransform from '../../rbx/transform.js';
import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';

type Transform = typeof rbcTransform;

function migrate(transform: Transform, source: string) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(transform, 'case.tsx', source, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? '', todos };
}

/**
 * [source, transform, import line, a Modal with `ATTRS` where the attributes
 * under test go].
 */
type Case = [string, Transform, string, string];

const CASES: Case[] = [
  [
    'react-bulma-components',
    rbcTransform,
    "import { Modal } from 'react-bulma-components';",
    '<Modal show ATTRS><Modal.Card><Modal.Card.Title id="t">Terms</Modal.Card.Title></Modal.Card></Modal>',
  ],
  [
    'rbx',
    rbxTransform,
    "import { Modal } from 'rbx';",
    '<Modal active ATTRS><Modal.Card><Modal.Card.Title id="t">Terms</Modal.Card.Title></Modal.Card></Modal>',
  ],
  // rbx's Modal.Container becomes the bestax Modal too.
  [
    'rbx (Modal.Container)',
    rbxTransform,
    "import { Modal } from 'rbx';",
    '<Modal.Container active ATTRS>x</Modal.Container>',
  ],
  [
    'bloomer',
    bloomerTransform,
    "import { Modal, ModalCard, ModalCardTitle } from 'bloomer';",
    '<Modal isActive ATTRS><ModalCard><ModalCardTitle id="t">Terms</ModalCardTitle></ModalCard></Modal>',
  ],
];

const run = (
  transform: Transform,
  imports: string,
  modal: string,
  attrs = ''
) =>
  migrate(
    transform,
    `${imports}\nexport const A = (props: any) => ${modal.replace('ATTRS', attrs)};\n`
  );

describe.each(CASES)('%s', (_source, transform, imports, modal) => {
  it('asks for a name on a Modal that has none', () => {
    const { output, todos } = run(transform, imports, modal);
    const named = todos.filter(t => t.rule === 'name:Modal');
    // One for the Modal, none for its parts.
    expect(named).toHaveLength(1);
    expect(named[0].message).toContain(
      'give it an `aria-label`, or an `aria-labelledby` pointing at the `id` of its title'
    );
    expect(output).toContain(
      "bestax `Modal` is a dialog while it's open, and this one has no `aria-label` or `aria-labelledby`"
    );
  });

  // An attribute the author wrote counts whatever its value, as for
  // `name:Table`: the codemod doesn't second-guess it.
  it.each([
    ['an aria-label', 'aria-label="Terms"'],
    ['an aria-labelledby', 'aria-labelledby="t"'],
    ['a dynamic aria-label', 'aria-label={props.label}'],
    ['an empty aria-label', 'aria-label=""'],
  ])('asks for none on a Modal with %s', (_case, attrs) => {
    const { output, todos } = run(transform, imports, modal, attrs);
    expect(todos.map(t => t.rule)).not.toContain('name:Modal');
    // The name carries over as written.
    expect(output).toContain(attrs);
  });

  it('asks for none on a Modal with a spread, which could hold a name', () => {
    const { todos } = run(transform, imports, modal, '{...props}');
    expect(todos.map(t => t.rule)).not.toContain('name:Modal');
  });
});

describe('react-bulma-components Modal as a value', () => {
  // The check runs after the prop passes rather than as a special: a special
  // on RBC's Modal would turn a value reference to it into a TODO.
  it('still converts a value reference to Modal', () => {
    const { output, todos } = migrate(
      rbcTransform,
      "import { Modal } from 'react-bulma-components';\nexport const M = Modal;\n"
    );
    expect(todos).toEqual([]);
    expect(output).toMatch(/from ["']@allxsmith\/bestax-bulma["']/);
    expect(output).not.toContain('react-bulma-components');
  });
});
