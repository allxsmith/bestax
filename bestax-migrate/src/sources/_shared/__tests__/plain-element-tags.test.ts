/**
 * rbx and react-bulma-components rendered their components through an
 * element prop (`as`, `renderAs`), as bloomer did through `tag`. Where the
 * codemod writes one as plain markup it writes the element that prop named
 * when it's a literal, the element the library rendered by default when
 * there's none, and that default plus a TODO when it can't read the value
 * (#1622). `heading.test.ts` holds each source's `Heading` to the same rule.
 */

import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';
import { SOURCES } from '../../registry.js';

interface Case {
  source: 'react-bulma-components' | 'rbx';
  name: string;
  imports: string;
  /** The component, with `ATTR` where the element prop goes. */
  jsx: string;
  prop: 'renderAs' | 'as';
  /** What each value writes: none, `"span"`, and one the codemod can't read. */
  none: string;
  literal: string;
  dynamic: string;
}

const RBC = 'react-bulma-components';

const CASES: Case[] = [
  {
    source: RBC,
    name: 'Form.Label',
    imports: 'Form',
    jsx: '<Form.Label ATTR>Name</Form.Label>',
    prop: 'renderAs',
    none: '<label className="label">Name</label>',
    literal: '<span className="label">Name</span>',
    dynamic: '<label className="label">Name</label>',
  },
  {
    source: RBC,
    name: 'Form.Help',
    imports: 'Form',
    jsx: '<Form.Help ATTR>Required</Form.Help>',
    prop: 'renderAs',
    none: '<p className="help">Required</p>',
    literal: '<span className="help">Required</span>',
    dynamic: '<p className="help">Required</p>',
  },
  {
    source: RBC,
    name: 'Loader',
    imports: 'Loader',
    jsx: '<Loader ATTR />',
    prop: 'renderAs',
    none: '<div className="loader"></div>',
    literal: '<span className="loader"></span>',
    dynamic: '<div className="loader"></div>',
  },
  {
    source: RBC,
    name: 'Panel.Tabs.Tab',
    imports: 'Panel',
    jsx: '<Panel.Tabs.Tab ATTR>All</Panel.Tabs.Tab>',
    prop: 'renderAs',
    none: '<a>All</a>',
    literal: '<span>All</span>',
    dynamic: '<a>All</a>',
  },
  {
    source: RBC,
    name: 'Breadcrumb.Item',
    imports: 'Breadcrumb',
    jsx: '<Breadcrumb.Item ATTR>Home</Breadcrumb.Item>',
    prop: 'renderAs',
    none: '<li><a>Home</a></li>',
    literal: '<span>Home</span>',
    dynamic: '<li><a>Home</a></li>',
  },
  {
    source: RBC,
    name: 'Table.Container',
    imports: 'Table',
    jsx: '<Table.Container ATTR>No rows</Table.Container>',
    prop: 'renderAs',
    none: '<div className="table-container">No rows</div>',
    literal: '<span className="table-container">No rows</span>',
    dynamic: '<div className="table-container">No rows</div>',
  },
  {
    source: RBC,
    name: 'Tabs.Tab',
    imports: 'Tabs',
    jsx: '<Tabs.Tab ATTR>Music</Tabs.Tab>',
    prop: 'renderAs',
    none: '<Tabs.Item><a>Music</a></Tabs.Item>',
    literal: '<Tabs.Item><span>Music</span></Tabs.Item>',
    dynamic: '<Tabs.Item><a>Music</a></Tabs.Item>',
  },
  {
    source: 'rbx',
    name: 'Help',
    imports: 'Help',
    jsx: '<Help ATTR>Required</Help>',
    prop: 'as',
    none: '<p className="help">Required</p>',
    literal: '<span className="help">Required</span>',
    dynamic: '<p className="help">Required</p>',
  },
  {
    source: 'rbx',
    name: 'Label',
    imports: 'Label',
    jsx: '<Label ATTR>Name</Label>',
    prop: 'as',
    none: '<label className="label">Name</label>',
    literal: '<span className="label">Name</span>',
    dynamic: '<label className="label">Name</label>',
  },
  {
    source: 'rbx',
    name: 'Loader',
    imports: 'Loader',
    jsx: '<Loader ATTR />',
    prop: 'as',
    none: '<div className="loader"></div>',
    literal: '<span className="loader"></span>',
    dynamic: '<div className="loader"></div>',
  },
  {
    source: 'rbx',
    name: 'Panel.Tab',
    imports: 'Panel',
    jsx: '<Panel.Tab ATTR>All</Panel.Tab>',
    prop: 'as',
    none: '<a>All</a>',
    literal: '<span>All</span>',
    dynamic: '<a>All</a>',
  },
  {
    source: 'rbx',
    name: 'Breadcrumb.Item',
    imports: 'Breadcrumb',
    jsx: '<Breadcrumb.Item ATTR>Home</Breadcrumb.Item>',
    prop: 'as',
    none: '<li><a>Home</a></li>',
    literal: '<li><span>Home</span></li>',
    dynamic: '<li><a>Home</a></li>',
  },
  {
    source: 'rbx',
    name: 'Select.Option',
    imports: 'Select',
    jsx: '<Select.Option ATTR value="a">A</Select.Option>',
    prop: 'as',
    none: '<option value="a">A</option>',
    literal: '<span value="a">A</span>',
    dynamic: '<option value="a">A</option>',
  },
  {
    source: 'rbx',
    name: 'Fieldset in a Field',
    imports: 'Field, Fieldset',
    jsx: '<Field><Fieldset ATTR>Fields</Fieldset></Field>',
    prop: 'as',
    none: '<fieldset>Fields</fieldset>',
    literal: '<span>Fields</span>',
    dynamic: '<fieldset>Fields</fieldset>',
  },
];

function migrate(source: string, imports: string, jsx: string) {
  const input = `import { ${imports} } from '${source}';\nexport const A = ({ t }: { t: 'div' }) => (${jsx});\n`;
  const todos: TodoEntry[] = [];
  const { output } = runTransform(SOURCES[source].transform, 'a.tsx', input, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? input, rules: todos.map(t => t.rule) };
}

describe.each(CASES)('$source $name', c => {
  const run = (attr: string) =>
    migrate(c.source, c.imports, c.jsx.replace(' ATTR', attr));

  it('writes the element the library rendered by default', () => {
    expect(run('').output).toContain(c.none);
  });

  it(`writes the element a literal \`${c.prop}\` names, with no TODO for it`, () => {
    const { output, rules } = run(` ${c.prop}="span"`);
    expect(output).toContain(c.literal);
    expect(rules).not.toContain(`prop:${c.prop}`);
    expect(rules).not.toContain('plain-element');
  });

  it(`keeps the default beside a \`${c.prop}\` value it can't read, and flags it`, () => {
    const { output, rules } = run(` ${c.prop}={t}`);
    expect(output).toContain(c.dynamic);
    expect(rules).toContain(`prop:${c.prop}`);
  });
});
