/**
 * react-bulma-components' universal helpers on the bestax parts that take no
 * helper props (#2372): each becomes the Bulma class it stood for, as
 * bloomer's and rbx's do, or a TODO naming that class where it can't be
 * written. `Dropdown.Divider` takes no props at all.
 */

import transform from '../transform.js';
import { UNIVERSAL_PROPS, helperClassHint } from '../mapping.js';
import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';

function migrate(source: string) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(transform, 'case.tsx', source, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? '', todos, rules: todos.map(t => t.rule) };
}

const panel = (header: string) =>
  `import { Panel } from 'react-bulma-components';\nexport const A = (p: any) => <Panel>${header}</Panel>;\n`;

describe('react-bulma-components helpers on a part that takes no helper props (#2372)', () => {
  it('writes each literal helper as its Bulma class', () => {
    const { output, rules } = migrate(
      panel(
        '<Panel.Header textAlign="center" pull="right" m={2} display="flex" textColor="primary" srOnly={false} mt={0}>x</Panel.Header>'
      )
    );
    expect(rules).toEqual([]);
    expect(output).toContain(
      'className="has-text-centered is-pulled-right m-2 is-flex has-text-primary">x</Panel.Heading>'
    );
  });

  it('names the class in a TODO for a dynamic value or a breakpoint object', () => {
    const { output, rules, todos } = migrate(
      panel(
        "<Panel.Header pull={p.side} mobile={{ display: 'flex' }}>x</Panel.Header>"
      )
    );
    expect(rules).toEqual(['prop:pull', 'prop:mobile']);
    expect(todos[1].message).toContain("`mobile={{ display: 'flex' }}`");
    expect(todos[0].message).toContain('`is-pulled-<side>`');
    expect(output).toContain('<Panel.Heading>x</Panel.Heading>');
  });

  it('keeps `hidden`, which RBC passed to the DOM as HTML’s own attribute', () => {
    const { output, rules } = migrate(
      panel('<Panel.Header hidden={p.h}>x</Panel.Header>')
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Panel.Heading hidden={p.h}>x</Panel.Heading>');
  });

  it('gives a part that takes helper props the universal pass, as before', () => {
    const { output, rules } = migrate(
      panel('x').replace('<Panel>', '<Panel textAlign="center">')
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Panel textAlign="centered">');
  });

  it('names what Dropdown.Divider carries, keeping its key', () => {
    const { output, todos } = migrate(
      'import { Dropdown } from \'react-bulma-components\';\nexport const A = () => <Dropdown><Dropdown.Item value="a">a</Dropdown.Item><Dropdown.Divider hidden className="thin" key="k" /></Dropdown>;\n'
    );
    const divider = todos.filter(t => /Dropdown\.Divider`/.test(t.message));
    expect(divider.map(t => t.rule)).toEqual(['component:Dropdown.Divider']);
    expect(divider[0].message).toContain('`hidden`, `className` were removed');
    expect(output).toContain('<Dropdown.Divider key="k" />');
    // What the later passes would only flag is named once, as removed.
    const once = migrate(
      'import { Dropdown } from \'react-bulma-components\';\nexport const A = (p: any) => <Dropdown><Dropdown.Divider renderAs="div" domRef={p.r} /></Dropdown>;\n'
    );
    const named = once.todos.filter(t => /Dropdown\.Divider`/.test(t.message));
    expect(named.map(t => t.rule)).toEqual(['component:Dropdown.Divider']);
    expect(named[0].message).toContain('`renderAs`, `domRef` were removed');
  });

  it('knows a class for every universal helper but the ones other passes handle', () => {
    // `renderAs` and `domRef` aren't helpers, `colorVariant` has a pass of
    // its own, and RBC passed `hidden` to the DOM as HTML's own attribute.
    const elsewhere = new Set(['renderAs', 'domRef', 'colorVariant', 'hidden']);
    for (const name of Object.keys(UNIVERSAL_PROPS)) {
      expect({ name, known: helperClassHint(name, 'x') !== null }).toEqual({
        name,
        known: !elsewhere.has(name),
      });
    }
  });
});
