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
});
