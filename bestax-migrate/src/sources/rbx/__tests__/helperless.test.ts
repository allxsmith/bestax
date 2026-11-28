/**
 * rbx's universal helpers on the bestax parts that take no helper props
 * (#2348): each becomes the Bulma class it stood for, as bloomer's do, or a
 * TODO naming that class where it can't be written.
 */

import transform from '../transform.js';
import { UNIVERSAL_PROPS, helperClassHint } from '../mapping.js';
import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';

function migrate(source: string, options: Record<string, unknown> = {}) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(
    transform,
    '/app/src/case.tsx',
    source,
    { add: entry => todos.push(entry) },
    options
  );
  return { output: output ?? '', todos, rules: todos.map(t => t.rule) };
}

const panel = (heading: string) =>
  `import { Panel } from 'rbx';\nexport const A = (p: any) => <Panel>${heading}</Panel>;\n`;

describe('rbx helpers on a bestax part that takes no helper props (#2348)', () => {
  it('writes each literal helper as its Bulma class', () => {
    const { output, rules } = migrate(
      panel(
        '<Panel.Heading textAlign="centered" marginless textSize={4} hidden={false} className="mine">x</Panel.Heading>'
      )
    );
    expect(rules).toEqual([]);
    expect(output).toContain(
      '<Panel.Heading className="mine has-text-centered m-0 is-size-4">x</Panel.Heading>'
    );
  });

  it('names the class in a TODO for a dynamic value or a dynamic className', () => {
    const dynamicValue = migrate(
      panel('<Panel.Block pull={p.side}>x</Panel.Block>')
    );
    expect(dynamicValue.rules).toEqual(['prop:pull']);
    expect(dynamicValue.todos[0].message).toContain('`is-pulled-<side>`');
    expect(dynamicValue.output).toContain('<Panel.Block>x</Panel.Block>');
    const dynamicClass = migrate(
      panel('<Panel.Block srOnly className={p.c}>x</Panel.Block>')
    );
    expect(dynamicClass.rules).toEqual(['prop:srOnly']);
    expect(dynamicClass.todos[0].message).toContain('`is-sr-only`');
    // A dynamic flag sets its class only where its value did.
    const dynamicFlag = migrate(
      panel('<Panel.Block hidden={p.h}>x</Panel.Block>')
    );
    expect(dynamicFlag.todos[0].message).toContain('wherever its value set it');
  });

  it('writes no placeholder class for a value helper given no value', () => {
    const { output, todos } = migrate(
      panel('<Panel.Heading pull>x</Panel.Heading>')
    );
    expect(todos.map(t => t.rule)).toEqual(['prop:pull']);
    expect(todos[0].message).toContain('carries no value here');
    expect(output).toContain('<Panel.Heading>x</Panel.Heading>');
  });

  it('writes no class for a falsy literal, as rbx wrote none', () => {
    const { output, rules } = migrate(
      panel('<Panel.Heading hidden={0} srOnly="">x</Panel.Heading>')
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<Panel.Heading>x</Panel.Heading>');
  });

  it('flags a helper beside a spread that could replace its className', () => {
    for (const [heading, kept] of [
      [
        '<Panel.Heading {...p} hidden>x</Panel.Heading>',
        '<Panel.Heading {...p}>',
      ],
      [
        '<Panel.Heading className="a" {...p} hidden>x</Panel.Heading>',
        '<Panel.Heading className="a" {...p}>',
      ],
    ]) {
      const { output, rules } = migrate(panel(heading));
      expect(rules).toEqual(['prop:hidden']);
      expect(output).toContain(kept);
    }
    // One before the `className` can't replace it.
    const before = migrate(
      panel('<Panel.Heading {...p} className="a" hidden>x</Panel.Heading>')
    );
    expect(before.rules).toEqual([]);
    expect(before.output).toContain(
      '<Panel.Heading {...p} className="a is-hidden">'
    );
  });

  it('names every helper on Dropdown.Divider, which takes no props at all', () => {
    const { output, todos } = migrate(
      "import { Dropdown } from 'rbx';\nexport const A = () => <Dropdown><Dropdown.Menu><Dropdown.Content><Dropdown.Divider hidden responsive={{ mobile: { hide: { value: true } } }} /></Dropdown.Content></Dropdown.Menu></Dropdown>;\n"
    );
    const divider = todos.filter(t => /Dropdown\.Divider`/.test(t.message));
    expect(divider.map(t => t.rule)).toEqual([
      'prop:hidden',
      'prop:responsive',
    ]);
    for (const todo of divider) {
      expect(todo.message).toContain('takes no props at all');
    }
    expect(output).toContain('<Dropdown.Divider />');
  });

  it("names Dropdown.Divider's other attributes and a spread, keeping its key (#2371)", () => {
    const divider = (attrs: string) =>
      `import { Dropdown } from 'rbx';\nexport const A = (p: any) => <Dropdown><Dropdown.Menu><Dropdown.Content><Dropdown.Divider ${attrs} /></Dropdown.Content></Dropdown.Menu></Dropdown>;\n`;
    const named = migrate(divider('className="thin" id="d" key="k"'));
    const left = named.todos.filter(
      t => t.rule === 'component:Dropdown.Divider'
    );
    expect(left).toHaveLength(1);
    expect(left[0].message).toContain('`className`, `id` were removed');
    expect(named.output).toContain('<Dropdown.Divider key="k" />');
    const spread = migrate(divider('{...p}'));
    const dropped = spread.todos.filter(
      t => t.rule === 'component:Dropdown.Divider'
    );
    expect(dropped).toHaveLength(1);
    expect(dropped[0].message).toContain('drops whatever this spread carries');
    expect(spread.output).toContain('<Dropdown.Divider {...p} />');
    // The passes before it take what they can first: the tooltip becomes
    // its wrapper, and `as` and `innerRef` keep their own TODOs.
    const passes = migrate(
      divider('tooltip="hi" as="div" innerRef={p.r} key="k"')
    );
    expect(passes.output).toContain(
      '<Tooltip key="k" label="hi"><Dropdown.Divider /></Tooltip>'
    );
    expect(passes.todos.map(t => t.rule)).toEqual(
      expect.arrayContaining([
        'prop:as',
        'prop:innerRef',
        'component:Dropdown.Divider',
      ])
    );
  });

  it('flags a breakpoint object, which has no one class to write', () => {
    const { output, rules } = migrate(
      "import { Message } from 'rbx';\nexport const A = () => <Message><Message.Body responsive={{ mobile: { hide: { value: true } } }}>x</Message.Body></Message>;\n"
    );
    expect(rules).toEqual(['prop:responsive']);
    expect(output).toContain('<Message.Body>x</Message.Body>');
  });

  it('leaves a part that takes the helper props as it was', () => {
    const { output, rules } = migrate(
      "import { Pagination } from 'rbx';\nexport const A = () => <Pagination><Pagination.List><Pagination.Link hidden>1</Pagination.Link></Pagination.List></Pagination>;\n"
    );
    expect(rules).toEqual([]);
    expect(output).toContain(
      '<Pagination.Link visibility="hidden">1</Pagination.Link>'
    );
  });

  it('names them with the release on Pagination.Ellipsis where the project may not get it', () => {
    const source =
      'import { Pagination } from \'rbx\';\nexport const A = () => <Pagination><Pagination.List><Pagination.Ellipsis hidden pull="right" /></Pagination.List></Pagination>;\n';
    const added = migrate(source, {
      bestaxPackages: [{ dir: '/app', written: true }],
      deps: true,
    });
    expect(added.rules).toEqual([]);
    expect(added.output).toContain(
      '<Pagination.Ellipsis className="is-hidden is-pulled-right" />'
    );
    const older = migrate(source, {
      bestaxPackages: [{ dir: '/app', floor: '5.70.0', written: true }],
    });
    expect(older.rules).toEqual(['prop:hidden', 'prop:pull']);
    for (const todo of older.todos) {
      expect(todo.message).toContain('`^5.78.4` or later and re-run');
    }
    expect(older.output).toContain('<Pagination.Ellipsis />');
    // A breakpoint object waits for the release the same way.
    const responsive = migrate(
      "import { Pagination } from 'rbx';\nexport const A = () => <Pagination><Pagination.List><Pagination.Ellipsis responsive={{ mobile: { hide: { value: true } } }} /></Pagination.List></Pagination>;\n"
    );
    expect(responsive.rules).toEqual(['prop:responsive']);
    expect(responsive.todos[0].message).toContain('`^5.78.4` or later');
    expect(responsive.todos[0].message).not.toContain('to `className`');
  });

  it('knows a class for every universal helper but the ones other passes handle', () => {
    // `as` and `innerRef` aren't helpers, and the colors have passes of
    // their own that flag them on these parts.
    const elsewhere = new Set([
      'as',
      'innerRef',
      'textColor',
      'backgroundColor',
    ]);
    for (const name of Object.keys(UNIVERSAL_PROPS)) {
      expect({ name, known: helperClassHint(name, 'x') !== null }).toEqual({
        name,
        known: !elsewhere.has(name),
      });
    }
  });
});
