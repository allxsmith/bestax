/**
 * Fixture-pair tests: every __testfixtures__/<case>.input.tsx must transform
 * into the committed <case>.output.tsx byte-for-byte (modulo trailing
 * whitespace). Fixtures are read as text — react-bulma-components is never
 * installed in this repository.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import transform from '../transform.js';
import { makeApi, runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '__testfixtures__'
);

const cases = fs
  .readdirSync(fixturesDir)
  .filter(file => file.endsWith('.input.tsx'))
  .map(file => file.replace(/\.input\.tsx$/, ''))
  .sort();

describe('react-bulma-components transform fixtures', () => {
  it('has at least one fixture pair', () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  test.each(cases)('%s', name => {
    const input = fs.readFileSync(
      path.join(fixturesDir, `${name}.input.tsx`),
      'utf8'
    );
    const expected = fs.readFileSync(
      path.join(fixturesDir, `${name}.output.tsx`),
      'utf8'
    );
    const todos: TodoEntry[] = [];
    const { output } = runTransform(transform, `${name}.input.tsx`, input, {
      add: entry => todos.push(entry),
    });
    expect((output ?? input).trimEnd()).toBe(expected.trimEnd());
  });

  it('provides inert stats/report hooks on the runner api', () => {
    const api = makeApi();
    expect(api.stats('noop')).toBeUndefined();
    expect(api.report('noop')).toBeUndefined();
  });

  it('returns null for files without react-bulma-components imports', () => {
    const source =
      "import { Button } from 'other-library';\nexport const A = () => <Button />;\n";
    const { output } = runTransform(transform, 'untouched.tsx', source);
    expect(output).toBeNull();
  });

  it('keeps tabs in tab-indented sources', () => {
    const source = [
      "import { Button } from 'react-bulma-components';",
      'export function App() {',
      '\treturn (',
      '\t\t<Button color="primary" loading>',
      '\t\t\tGo',
      '\t\t</Button>',
      '\t);',
      '}',
      '',
    ].join('\n');
    const { output } = runTransform(transform, 'tabbed.tsx', source);
    expect(output).toContain('\t\t<Button color="primary" isLoading>');
    expect(output).not.toMatch(/\n {2,}</);
  });

  it('parses the legacy import-assert syntax', () => {
    const source = [
      "import data from './data.json' assert { type: 'json' };",
      "import { Block } from 'react-bulma-components';",
      'export const A = () => <Block>{data}</Block>;',
      '',
    ].join('\n');
    const { output } = runTransform(transform, 'assert.tsx', source);
    expect(output).toContain('from "@allxsmith/bestax-bulma"');
    expect(output).toContain("assert { type: 'json' }");
  });

  it('parses legacy class, decorator and proposal syntax', () => {
    const source = [
      "import { Button } from 'react-bulma-components';",
      '@observer',
      'export class App extends React.Component {',
      '  state = { count: 1_000 };',
      '  #private = null;',
      '  static defaultProps = {};',
      '  render() {',
      '    return <Button color="primary">{this.props.a?.b ?? 0}</Button>;',
      '  }',
      '}',
      '',
    ].join('\n');
    const { output } = runTransform(transform, 'legacy.tsx', source);
    expect(output).toContain('from "@allxsmith/bestax-bulma"');
    // Every proposal-plugin shape in the fixture must survive the round trip,
    // not merely parse — a plugin dropped from PARSER_OPTIONS would still
    // parse the file if the syntax has since become standard, but recast
    // would lose the node.
    expect(output).toContain('@observer');
    expect(output).toContain('state = { count: 1_000 }');
    expect(output).toContain('#private = null');
    expect(output).toContain('static defaultProps = {}');
    expect(output).toContain('this.props.a?.b ?? 0');
  });

  it('parses the legacy React.createClass form', () => {
    const source = [
      "import { Button } from 'react-bulma-components';",
      'module.exports = React.createClass({',
      '  render: function () {',
      '    return <Button color="primary" loading>Go</Button>;',
      '  },',
      '});',
      '',
    ].join('\n');
    const { output } = runTransform(transform, 'create-class.tsx', source);
    expect(output).toContain('from "@allxsmith/bestax-bulma"');
    expect(output).toContain('isLoading');
    // The rename must replace the legacy prop, not sit alongside it.
    expect(output).not.toMatch(/\sloading[\s=/>]/);
    expect(output).toContain('React.createClass');
  });

  it('collects TODO entries with rules and line numbers', () => {
    const source = [
      "import { Tile } from 'react-bulma-components';",
      'export const T = () => <Tile kind="ancestor">x</Tile>;',
    ].join('\n');
    const todos: TodoEntry[] = [];
    runTransform(transform, 'tile.tsx', source, {
      add: entry => todos.push(entry),
    });
    expect(todos).toHaveLength(1);
    expect(todos[0].rule).toBe('component:Tile');
    expect(todos[0].line).toBe(2);
    expect(todos[0].file).toBe('tile.tsx');
  });

  it('flags default imports from react-bulma-components', () => {
    const source =
      "import RBC from 'react-bulma-components';\nexport const A = 1;\n";
    const todos: TodoEntry[] = [];
    const { output } = runTransform(transform, 'default.tsx', source, {
      add: entry => todos.push(entry),
    });
    expect(output).toContain('TODO(bestax-migrate)');
    expect(todos[0].rule).toBe('imports');
  });

  it('flags v3-style deep import paths', () => {
    const source =
      "import Button from 'react-bulma-components/lib/components/button';\nexport const A = 1;\n";
    const todos: TodoEntry[] = [];
    const { output } = runTransform(transform, 'deep.tsx', source, {
      add: entry => todos.push(entry),
    });
    expect(output).toContain('TODO(bestax-migrate)');
    expect(todos[0].message).toContain('v3 pattern');
  });

  it('flags destructuring it cannot fully resolve', () => {
    const source = [
      "import { Form } from 'react-bulma-components';",
      'const { Input, ...rest } = Form;',
      'export const A = () => <Input />;',
    ].join('\n');
    const todos: TodoEntry[] = [];
    const { output } = runTransform(transform, 'rest.tsx', source, {
      add: entry => todos.push(entry),
    });
    expect(todos.some(t => t.rule === 'imports')).toBe(true);
    // The unresolved destructure keeps its `Input` binding, so the new
    // import is aliased and the JSX points at the alias.
    expect(output).toContain('Input as BulmaInput');
    expect(output).toContain('<BulmaInput />');
  });

  it('collects bindings from classes, function expressions, and patterns', () => {
    const source = [
      "import { Form } from 'react-bulma-components';",
      'class Control {}',
      'const helper = function (Field: string) {',
      '  return Field;',
      '};',
      'const [Input = null, ...rest] = [] as unknown[];',
      'export const A = () => (',
      '  <div>',
      '    {helper(String(Control))}',
      '    {String(Input)}',
      '    {rest.length}',
      '    <Form.Field>',
      '      <Form.Control>',
      '        <Form.Input />',
      '      </Form.Control>',
      '    </Form.Field>',
      '  </div>',
      ');',
    ].join('\n');
    const { output } = runTransform(transform, 'bindings.tsx', source);
    expect(output).toContain('Field as BulmaField');
    expect(output).toContain('Control as BulmaControl');
    expect(output).toContain('Input as BulmaInput');
    expect(output).toContain('<BulmaField>');
    expect(output).toContain('<BulmaControl>');
    expect(output).toContain('<BulmaInput />');
  });

  it('aliases imports that collide with local bindings', () => {
    const source = [
      "import { Form } from 'react-bulma-components';",
      'export const Field = (args) => <Form.Field {...args} />;',
    ].join('\n');
    const { output } = runTransform(transform, 'collision.tsx', source);
    expect(output).toContain(
      'import { Field as BulmaField } from "@allxsmith/bestax-bulma";'
    );
    expect(output).toContain('<BulmaField {...args} />');
  });

  it('prunes only the RBC declarator from multi-declarator statements', () => {
    const source = [
      "import { Form } from 'react-bulma-components';",
      'const { Input } = Form,',
      '  other = 1;',
      'export const A = () => <Input placeholder={String(other)} />;',
    ].join('\n');
    const { output } = runTransform(transform, 'multi.tsx', source);
    expect(output).toContain('other = 1');
    expect(output).not.toContain('= Form');
    expect(output).toContain('from "@allxsmith/bestax-bulma"');
  });

  it('merges needed names into an existing bestax-bulma import', () => {
    const source = [
      "import { Box } from '@allxsmith/bestax-bulma';",
      "import { Button } from 'react-bulma-components';",
      'export const A = () => (',
      '  <Box>',
      '    <Button color="primary">Go</Button>',
      '  </Box>',
      ');',
    ].join('\n');
    const { output } = runTransform(transform, 'merge.tsx', source);
    expect(output).toContain(
      "import { Box, Button } from '@allxsmith/bestax-bulma';"
    );
    expect(output).not.toContain('react-bulma-components');
  });

  describe('value references', () => {
    it('rewrites flat-target member values (Icon.Text → IconText)', () => {
      const source = [
        "import { Icon } from 'react-bulma-components';",
        'const Wrapper = Icon.Text;',
        'export const A = () => <Wrapper>x</Wrapper>;',
      ].join('\n');
      const { output } = runTransform(transform, 'member.tsx', source);
      expect(output).toContain('const Wrapper = IconText;');
      expect(output).toContain('IconText');
      expect(output).not.toContain('react-bulma-components');
    });

    it('keeps same-compound member values on the bestax root', () => {
      const source = [
        "import { Card } from 'react-bulma-components';",
        'const Body = Card.Content;',
        'export const A = () => <Body>x</Body>;',
      ].join('\n');
      const { output } = runTransform(transform, 'compound.tsx', source);
      expect(output).toContain('const Body = Card.Content;');
      expect(output).toContain(
        'import { Card } from "@allxsmith/bestax-bulma"'
      );
    });

    it('flags member values whose target needs restructuring', () => {
      const source = [
        "import { Media } from 'react-bulma-components';",
        'const Item = Media.Item;',
        'export const A = () => <Item>x</Item>;',
      ].join('\n');
      const todos: TodoEntry[] = [];
      const { output } = runTransform(transform, 'special.tsx', source, {
        add: entry => todos.push(entry),
      });
      expect(todos.some(t => t.rule === 'value-reference')).toBe(true);
      expect(output).toContain("from 'react-bulma-components'");
    });
  });

  describe('behavior-preserving specials', () => {
    it('converts dynamic Columns multiline with the RBC default fallback', () => {
      const source = [
        "import { Columns } from 'react-bulma-components';",
        'export const A = ({ wrap }: { wrap?: boolean }) => (',
        '  <Columns multiline={wrap}>x</Columns>',
        ');',
      ].join('\n');
      const { output } = runTransform(transform, 'columns.tsx', source);
      expect(output).toContain('isMultiline={wrap ?? true}');
    });

    it('does not double-wrap Tabs items that already contain an anchor', () => {
      const source = [
        "import { Tabs } from 'react-bulma-components';",
        'export const A = () => (',
        '  <Tabs>',
        '    <Tabs.Tab active>',
        '      <a href="#one">One</a>',
        '    </Tabs.Tab>',
        '  </Tabs>',
        ');',
      ].join('\n');
      const { output } = runTransform(transform, 'tabs.tsx', source);
      expect(output).toContain('<a href="#one">One</a>');
      expect((output ?? '').match(/<a /g)).toHaveLength(1);
    });

    it('drops a literal `remove={false}` without becoming a Delete', () => {
      const source = [
        "import { Button } from 'react-bulma-components';",
        'export const A = () => <Button remove={false}>Save</Button>;',
      ].join('\n');
      const { output } = runTransform(transform, 'button-false.tsx', source);
      expect(output).toContain('<Button>Save</Button>');
      expect(output).not.toContain('remove');
      expect(output).not.toContain('Delete');
    });

    it('leaves a dynamic Button `remove` as a TODO instead of guessing', () => {
      const source = [
        "import { Button } from 'react-bulma-components';",
        'export const A = ({ isRemove }: { isRemove: boolean }) => (',
        '  <Button remove={isRemove}>Save</Button>',
        ');',
      ].join('\n');
      const todos: TodoEntry[] = [];
      const { output } = runTransform(transform, 'button-dynamic.tsx', source, {
        add: entry => todos.push(entry),
      });
      expect(todos.some(t => t.rule === 'prop:remove')).toBe(true);
      expect(output).toContain('<Button remove={isRemove}>Save</Button>');
      expect(output).not.toContain('<Delete');
    });

    it('resolves a static string/number `remove` by truthiness, not a TODO', () => {
      const source = [
        "import { Button } from 'react-bulma-components';",
        'export const A = () => (',
        '  <div>',
        '    <Button remove="true" />',
        '    <Button remove="">Save</Button>',
        '    <Button remove={0}>Save</Button>',
        '  </div>',
        ');',
      ].join('\n');
      const todos: TodoEntry[] = [];
      const { output } = runTransform(transform, 'button-static.tsx', source, {
        add: entry => todos.push(entry),
      });
      // Truthy literal renders the delete cross at RBC runtime → <Delete/>.
      expect(output).toContain('<Delete');
      // Falsy literals just drop the prop; the button stays a button.
      expect((output ?? '').match(/<Button>Save<\/Button>/g)).toHaveLength(2);
      // A statically-known value is never mislabeled as dynamic.
      expect(todos.some(t => t.rule === 'prop:remove')).toBe(false);
      expect(output).not.toContain('remove=');
    });

    it('flags a dynamic Heading subtitle and falls back to Title', () => {
      const source = [
        "import { Heading } from 'react-bulma-components';",
        'export const A = ({ isSub }: { isSub?: boolean }) => (',
        '  <Heading subtitle={isSub}>x</Heading>',
        ');',
      ].join('\n');
      const todos: TodoEntry[] = [];
      const { output } = runTransform(
        transform,
        'heading-subtitle.tsx',
        source,
        {
          add: entry => todos.push(entry),
        }
      );
      expect(todos.some(t => t.rule === 'prop:subtitle')).toBe(true);
      // The dynamic expression is preserved on the element (not deleted) so
      // the branch can be split by hand.
      expect(output).toContain('<Title subtitle={isSub}>x</Title>');
    });

    it('does not collapse `<Heading heading subtitle={expr}>` to a plain element and flags the dynamic subtitle', () => {
      const source = [
        "import { Heading } from 'react-bulma-components';",
        'export const A = ({ isSub }: { isSub?: boolean }) => (',
        '  <Heading heading subtitle={isSub}>x</Heading>',
        ');',
      ].join('\n');
      const todos: TodoEntry[] = [];
      const { output } = runTransform(transform, 'heading-both.tsx', source, {
        add: entry => todos.push(entry),
      });
      // The dynamic subtitle blocks the structural `heading` collapse: it must
      // NOT become a `<p className="heading">` (that would silently drop the
      // dynamic subtitle) and it must leave a prop:subtitle TODO.
      expect(todos.some(t => t.rule === 'prop:subtitle')).toBe(true);
      expect(output).not.toContain('className="heading"');
      expect(output).toContain('subtitle={isSub}');
      expect(output).toContain('<Title');
    });

    it('keeps the `subtitle` class when a literal-truthy `subtitle` collapses alongside `heading`', () => {
      const source = [
        "import { Heading } from 'react-bulma-components';",
        'export const A = () => <Heading heading subtitle>x</Heading>;',
      ].join('\n');
      const todos: TodoEntry[] = [];
      const { output } = runTransform(transform, 'heading-both.tsx', source, {
        add: entry => todos.push(entry),
      });
      // Both props are truthy literals, so the element collapses to the plain
      // `.heading` paragraph — but RBC applies the subtitle class independently,
      // so it must ride along rather than being silently dropped.
      expect(todos).toHaveLength(0);
      expect(output).toContain('className="heading subtitle"');
    });

    it('flags a dynamic Heading heading prop and keeps Title/SubTitle instead of collapsing to a plain element', () => {
      const source = [
        "import { Heading } from 'react-bulma-components';",
        'export const A = ({ useHeadingStyle }: { useHeadingStyle?: boolean }) => (',
        '  <Heading heading={useHeadingStyle}>x</Heading>',
        ');',
      ].join('\n');
      const todos: TodoEntry[] = [];
      const { output } = runTransform(
        transform,
        'heading-heading.tsx',
        source,
        {
          add: entry => todos.push(entry),
        }
      );
      expect(todos.some(t => t.rule === 'prop:heading')).toBe(true);
      // The dynamic expression is preserved on the element (not deleted).
      expect(output).toContain('<Title heading={useHeadingStyle}>x</Title>');
    });

    it('resolves a statically-truthy string `heading` literal without a dynamic TODO', () => {
      const source = [
        "import { Heading } from 'react-bulma-components';",
        'export const A = () => <Heading heading="heading">x</Heading>;',
      ].join('\n');
      const todos: TodoEntry[] = [];
      const { output } = runTransform(transform, 'heading-string.tsx', source, {
        add: entry => todos.push(entry),
      });
      // A statically-known truthy value renders the plain `.heading` paragraph
      // at runtime, so it collapses just like a bare `heading` — never the
      // "dynamic value" TODO that main resolved correctly.
      expect(todos.some(t => t.rule === 'prop:heading')).toBe(false);
      expect(output).toContain('className="heading"');
      expect(output).not.toContain('<Title');
    });

    it('resolves a statically-truthy string `subtitle` literal to SubTitle without a dynamic TODO', () => {
      const source = [
        "import { Heading } from 'react-bulma-components';",
        'export const A = () => <Heading subtitle="yes">x</Heading>;',
      ].join('\n');
      const todos: TodoEntry[] = [];
      const { output } = runTransform(
        transform,
        'subtitle-string.tsx',
        source,
        {
          add: entry => todos.push(entry),
        }
      );
      expect(todos.some(t => t.rule === 'prop:subtitle')).toBe(false);
      expect(output).toContain('<SubTitle>x</SubTitle>');
    });

    it('flags a Menu.List title it cannot lift to a sibling', () => {
      const source = [
        "import { Menu } from 'react-bulma-components';",
        'export const A = () => (',
        '  <Menu.List title="Orphan">',
        '    <Menu.List.Item>x</Menu.List.Item>',
        '  </Menu.List>',
        ');',
      ].join('\n');
      const todos: TodoEntry[] = [];
      runTransform(transform, 'menu.tsx', source, {
        add: entry => todos.push(entry),
      });
      expect(todos.some(t => t.rule === 'prop:title')).toBe(true);
    });

    it('resolves a truthy string `booleanToProp` literal instead of taking the dynamic-TODO branch', () => {
      const source = [
        "import { Button } from 'react-bulma-components';",
        'export const A = () => <Button rounded="true">Save</Button>;',
      ].join('\n');
      const todos: TodoEntry[] = [];
      const { output } = runTransform(transform, 'button-rounded.tsx', source, {
        add: entry => todos.push(entry),
      });
      expect(output).toContain('isRounded');
      expect(output).not.toContain('rounded=');
      expect(todos.some(t => t.rule === 'prop:rounded')).toBe(false);
    });

    it('drops a falsy string `booleanToProp` literal instead of taking the dynamic-TODO branch', () => {
      const source = [
        "import { Button } from 'react-bulma-components';",
        'export const A = () => <Button rounded="">Save</Button>;',
      ].join('\n');
      const todos: TodoEntry[] = [];
      const { output } = runTransform(
        transform,
        'button-unrounded.tsx',
        source,
        {
          add: entry => todos.push(entry),
        }
      );
      expect(output).not.toContain('rounded');
      expect(output).not.toContain('isRounded');
      expect(todos.some(t => t.rule === 'prop:rounded')).toBe(false);
    });

    it('resolves a static string/number Panel.Tabs.Tab `active` by truthiness, not a TODO', () => {
      const source = [
        "import { Panel } from 'react-bulma-components';",
        'export const A = () => (',
        '  <Panel>',
        '    <Panel.Tabs>',
        '      <Panel.Tabs.Tab active="true">All</Panel.Tabs.Tab>',
        '      <Panel.Tabs.Tab active={0}>None</Panel.Tabs.Tab>',
        '    </Panel.Tabs>',
        '  </Panel>',
        ');',
      ].join('\n');
      const todos: TodoEntry[] = [];
      const { output } = runTransform(transform, 'panel-tabs.tsx', source, {
        add: entry => todos.push(entry),
      });
      expect(output).toContain('className="is-active">All');
      expect(output).toContain('>None</a>');
      expect(todos.some(t => t.rule === 'prop:active')).toBe(false);
    });

    it('resolves a static string Breadcrumb.Item `active` by truthiness, not a TODO', () => {
      const source = [
        "import { Breadcrumb } from 'react-bulma-components';",
        'export const A = () => (',
        '  <Breadcrumb>',
        '    <Breadcrumb.Item active="true" href="/here">Here</Breadcrumb.Item>',
        '  </Breadcrumb>',
        ');',
      ].join('\n');
      const todos: TodoEntry[] = [];
      const { output } = runTransform(transform, 'breadcrumb.tsx', source, {
        add: entry => todos.push(entry),
      });
      expect(output).toContain('<li className="is-active">');
      expect(todos.some(t => t.rule === 'prop:active')).toBe(false);
    });

    it('drops a falsy `multiline={false}` by value instead of by presence', () => {
      const source = [
        "import { Form } from 'react-bulma-components';",
        'export const A = () => <Form.Field multiline={false} />;',
      ].join('\n');
      const { output } = runTransform(transform, 'field-false.tsx', source);
      // Presence-only classification would wrongly grant `grouped="multiline"`
      // to a falsy value; resolving by value drops it like an absent prop.
      expect(output).toContain('<Field />');
      expect(output).not.toContain('grouped');
    });

    it('keeps a dynamic Field `multiline` on the element with a TODO instead of dropping it', () => {
      const source = [
        "import { Form } from 'react-bulma-components';",
        'export const A = ({ wrap }: { wrap: boolean }) => (',
        '  <Form.Field kind="group" multiline={wrap} />',
        ');',
      ].join('\n');
      const todos: TodoEntry[] = [];
      const { output } = runTransform(transform, 'field-dynamic.tsx', source, {
        add: entry => todos.push(entry),
      });
      expect(output).toContain('multiline={wrap}');
      expect(todos.some(t => t.rule === 'prop:multiline')).toBe(true);
    });
  });

  describe('names bound by destructuring are value references too', () => {
    it('resolves a member chain through the alias', () => {
      // `const { Field } = Form` is deleted by the destructuring pass, so
      // skipping `Field` here left `Field.Label` referencing nothing once the
      // Form import was pruned.
      const source = [
        "import { Form } from 'react-bulma-components';",
        'const { Field } = Form;',
        'const value = Field.Label;',
        'export const A = () => <>{String(value)}</>;',
      ].join('\n');
      const { output } = runTransform(transform, 'alias-value.tsx', source);
      expect(output).toContain('const value = FieldLabel;');
      expect(output).not.toContain('react-bulma-components');
    });
  });

  describe('a destructured alias used as a bare value', () => {
    it('resolves a dotted target to a member expression', () => {
      const source = [
        "import { Card } from 'react-bulma-components';",
        'const { Header } = Card;',
        'const V = Header;',
        'export const A = () => <Header>{String(V)}</Header>;',
      ].join('\n');
      const { output } = runTransform(transform, 'bare-alias.tsx', source);
      expect(output).toContain('const V = Card.Header;');
      expect(output).not.toContain('react-bulma-components');
    });
  });

  describe('a namespace import survives when something still needs it', () => {
    it('keeps it when a retained component references it', () => {
      // `<RBC.Tile>` stays in the JSX (Tile is unmappable), so pruning the
      // import leaves `RBC is not defined`.
      const source = [
        "import * as RBC from 'react-bulma-components';",
        'export const A = () => <RBC.Tile><RBC.Box>x</RBC.Box></RBC.Tile>;',
      ].join('\n');
      const { output } = runTransform(transform, 'ns.tsx', source);
      expect(output).toContain("import * as RBC from 'react-bulma-components'");
      expect(output).toContain('<RBC.Tile>');
      expect(output).toContain('<Box>');
    });

    it('keeps it when the namespace is referenced as a value', () => {
      const source = [
        "import * as RBC from 'react-bulma-components';",
        'export const A = () => <RBC.Box>{String(RBC)}</RBC.Box>;',
      ].join('\n');
      const { output } = runTransform(transform, 'ns-value.tsx', source);
      expect(output).toContain("import * as RBC from 'react-bulma-components'");
    });

    it('still prunes it when nothing does', () => {
      const source = [
        "import * as RBC from 'react-bulma-components';",
        'export const A = () => <RBC.Box>x</RBC.Box>;',
      ].join('\n');
      const { output } = runTransform(transform, 'ns-clean.tsx', source);
      expect(output).not.toContain('react-bulma-components');
      expect(output).toContain('<Box>x</Box>');
    });
  });

  describe('a retained RBC binding never loses its name to a bestax import', () => {
    it('aliases the bestax local instead of dropping the retained specifier', () => {
      // `Element as Button` is unmappable and retained; another RBC component
      // wants bestax's `Button`. Dropping the retained specifier made
      // `<Button>` — which was an Element — silently render a bestax Button.
      const source = [
        "import { Element as Button, Button as RealButton } from 'react-bulma-components';",
        'export const A = () => (',
        '  <><Button>element</Button><RealButton>button</RealButton></>',
        ');',
      ].join('\n');
      const { output } = runTransform(transform, 'alias.tsx', source);
      expect(output).toContain(
        "import { Element as Button } from 'react-bulma-components'"
      );
      expect(output).toMatch(/Button as Bulma\w+/);
      expect(output).toContain('<Button>element</Button>');
    });
  });

  describe('shared helpers that changed under the rbx work', () => {
    // `_shared/specials-utils.ts` is used by both sources, so a fix made for
    // rbx changes react-bulma-components output too. These lock in the two
    // that did, which no RBC fixture previously covered.
    it('does not read a Font Awesome modifier as the icon name', () => {
      const source = [
        "import { Icon } from 'react-bulma-components';",
        'export const A = () => (',
        '  <Icon><i className="fas fa-rotate-90 fa-home" /></Icon>',
        ');',
      ].join('\n');
      const { output } = runTransform(transform, 'icon-modifier.tsx', source);
      expect(output).toContain('name="home"');
      expect(output).not.toContain('rotate-90"');
    });
  });

  describe('stylesheet imports', () => {
    const RBC_CSS =
      "import 'react-bulma-components/dist/react-bulma-components.min.css';\n";
    const BULMA_CSS_IMPORT = "import 'bulma/css/bulma.min.css';\n";

    it('default (bestax): converges on the combined bestax.css bundle', () => {
      const { output } = runTransform(transform, 'styles.ts', RBC_CSS);
      expect(output).toContain('import "@allxsmith/bestax-bulma/bestax.css";');
      expect(output).not.toContain('TODO');
    });

    it('bestax: rewrites plain bulma css and collapses a separate extras import', () => {
      const source =
        BULMA_CSS_IMPORT + "import '@allxsmith/bestax-bulma/extras.css';\n";
      const { output } = runTransform(transform, 'styles.ts', source);
      expect(output).toContain('import "@allxsmith/bestax-bulma/bestax.css";');
      expect(output).not.toContain('extras.css');
      expect(output).not.toContain('bulma/css');
    });

    it('bestax: dedupes when both RBC and bulma css imports exist', () => {
      const { output } = runTransform(
        transform,
        'styles.ts',
        RBC_CSS + BULMA_CSS_IMPORT
      );
      const matches = (output ?? '').match(/bestax\.css/g) ?? [];
      expect(matches).toHaveLength(1);
    });

    it('bulma mode: rewrites the RBC v3 css and adds the extras import', () => {
      const { output } = runTransform(
        transform,
        'styles.ts',
        RBC_CSS,
        undefined,
        { cssMode: 'bulma' }
      );
      expect(output).toContain('import "bulma/css/bulma.min.css";');
      expect(output).toContain('import "@allxsmith/bestax-bulma/extras.css";');
    });

    it('bulma mode: keeps plain bulma css and adds the extras import', () => {
      const { output } = runTransform(
        transform,
        'styles.ts',
        BULMA_CSS_IMPORT,
        undefined,
        { cssMode: 'bulma' }
      );
      expect(output).toContain("import 'bulma/css/bulma.min.css';");
      expect(output).toContain('import "@allxsmith/bestax-bulma/extras.css";');
    });

    it('keep mode: only fixes the dead RBC v3 css path, with a TODO', () => {
      const todos: TodoEntry[] = [];
      const { output } = runTransform(
        transform,
        'styles.ts',
        RBC_CSS + BULMA_CSS_IMPORT,
        { add: entry => todos.push(entry) },
        { cssMode: 'keep' }
      );
      expect(output).toContain('import "bulma/css/bulma.min.css";');
      expect(output).toContain("import 'bulma/css/bulma.min.css';");
      expect(output).not.toContain('bestax.css');
      expect(todos.some(t => t.rule === 'css')).toBe(true);
    });
  });

  /**
   * The bestax roots this codemod targets gained `forwardRef`, so the old
   * `domRef` advice ("use a ref on a DOM child or wrap the component") told
   * users to restructure markup around a ref that now works. rbx's `innerRef`
   * was corrected the same way; this pins the sibling.
   */
  describe('the domRef TODO describes refs that bestax actually forwards', () => {
    function domRefTodo(name: string): string {
      const todos: TodoEntry[] = [];
      runTransform(
        transform,
        'ref.tsx',
        `import { ${name} } from "react-bulma-components";\n` +
          `export const A = (r: any) => <${name} domRef={r}>x</${name}>;`,
        { add: entry => todos.push(entry) }
      );
      const todo = todos.find(t => t.rule === 'prop:domRef');
      expect(todo).toBeDefined();
      return todo!.message;
    }

    it.each(['Button', 'Modal', 'Dropdown', 'Navbar'])(
      'tells you to rename domRef to ref on %s rather than wrap it',
      name => {
        const message = domRefTodo(name);
        expect(message).toMatch(/rename `domRef` to `ref`/);
        expect(message).toMatch(new RegExp(`\`${name}\``));
      }
    );

    it('still offers the wrapping fallback for the components that forward no ref', () => {
      expect(domRefTodo('Card')).toMatch(/wrap the component/);
    });

    it('names the Navbar.Dropdown collision in both directions', () => {
      // The codemod retargets both sides of it: an RBC `Navbar.Item` wrapping a
      // dropdown becomes bestax `Navbar.Dropdown` (which forwards a ref), and
      // the RBC `Navbar.Dropdown` inside it becomes `Navbar.DropdownMenu`
      // (which does not). Reading only the name you wrote gets it backwards
      // in either direction.
      const todos: TodoEntry[] = [];
      const { output } = runTransform(
        transform,
        'ref.tsx',
        'import { Navbar } from "react-bulma-components";\n' +
          'export const A = (r: any) => <Navbar.Item domRef={r}><Navbar.Dropdown>x</Navbar.Dropdown></Navbar.Item>;',
        { add: entry => todos.push(entry) }
      );
      expect(output).toContain('<Navbar.Dropdown domRef={r}>');
      expect(output).toContain('<Navbar.DropdownMenu>');
      const message = todos.find(t => t.rule === 'prop:domRef')!.message;
      expect(message).toMatch(/`Navbar\.Item` that wrapped your dropdown/);
      expect(message).toMatch(/`Navbar\.DropdownMenu` and does not/);
    });
  });
});
