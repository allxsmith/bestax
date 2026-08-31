/**
 * Fixture-pair tests: every __testfixtures__/<case>.input.tsx must transform
 * into the committed <case>.output.tsx byte-for-byte (modulo trailing
 * whitespace). Fixtures are read as text — rbx is never installed in this
 * repository.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import transform from '../transform.js';
import { runTransform } from '../../../runner.js';
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

describe('rbx transform fixtures', () => {
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

  it('returns null for files without rbx imports', () => {
    const source =
      "import { Button } from 'other-library';\nexport const A = () => <Button />;\n";
    const { output } = runTransform(transform, 'untouched.tsx', source);
    expect(output).toBeNull();
  });
});

describe('rbx imports', () => {
  it('flags default imports from rbx', () => {
    const source = "import RBX from 'rbx';\nexport const A = 1;\n";
    const todos: TodoEntry[] = [];
    const { output } = runTransform(transform, 'default.tsx', source, {
      add: entry => todos.push(entry),
    });
    expect(output).toContain('TODO(bestax-migrate)');
    expect(todos[0].rule).toBe('imports');
  });

  it('points deep rbx imports at the bestax theming helpers', () => {
    const source = [
      "import { ThemeContext } from 'rbx/base/theme';",
      "import { Box } from 'rbx';",
      'export const A = () => <Box />;',
    ].join('\n');
    const todos: TodoEntry[] = [];
    runTransform(transform, 'deep.tsx', source, {
      add: entry => todos.push(entry),
    });
    expect(todos.some(t => t.message.includes('ConfigProvider'))).toBe(true);
  });

  it('resolves `const { Item } = Card` destructuring', () => {
    const source = [
      "import { Card } from 'rbx';",
      'const { Content } = Card;',
      'export const A = () => <Content>x</Content>;',
    ].join('\n');
    const { output } = runTransform(transform, 'destructure.tsx', source);
    expect(output).toContain('<Card.Content>x</Card.Content>');
    expect(output).not.toContain('= Card');
  });

  it('flags destructuring it cannot fully resolve', () => {
    const source = [
      "import { Card } from 'rbx';",
      'const { Content, ...rest } = Card;',
      'export const A = () => <Content>x</Content>;',
    ].join('\n');
    const todos: TodoEntry[] = [];
    runTransform(transform, 'rest.tsx', source, {
      add: entry => todos.push(entry),
    });
    expect(todos.some(t => t.rule === 'imports')).toBe(true);
  });

  it('prunes only the rbx declarator from multi-declarator statements', () => {
    const source = [
      "import { Card } from 'rbx';",
      'const { Content } = Card,',
      '  other = 1;',
      'export const A = () => <Content>{other}</Content>;',
    ].join('\n');
    const { output } = runTransform(transform, 'multi.tsx', source);
    expect(output).toContain('other = 1');
    expect(output).not.toContain('= Card');
  });

  it('aliases imports that collide with local bindings', () => {
    const source = [
      "import { Box } from 'rbx';",
      'export const Box2 = 1;',
      'class Button {}',
      "import { Button as RbxButton } from 'rbx';",
      'export const A = () => <RbxButton>{String(Button)}</RbxButton>;',
    ].join('\n');
    const { output } = runTransform(transform, 'collision.tsx', source);
    expect(output).toContain('Button as BulmaButton');
    expect(output).toContain('<BulmaButton>');
  });

  it('merges needed names into an existing bestax-bulma import', () => {
    const source = [
      "import { Box } from '@allxsmith/bestax-bulma';",
      "import { Button } from 'rbx';",
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
    expect(output).not.toContain("from 'rbx'");
  });

  it('handles namespace imports', () => {
    const source = [
      "import * as Rbx from 'rbx';",
      'export const A = () => <Rbx.Box>x</Rbx.Box>;',
    ].join('\n');
    const { output } = runTransform(transform, 'namespace.tsx', source);
    expect(output).toContain('<Box>x</Box>');
  });

  it('keeps tabs in tab-indented sources', () => {
    const source = [
      "import { Button } from 'rbx';",
      'export function App() {',
      '\treturn (',
      '\t\t<Button color="primary" outlined>',
      '\t\t\tGo',
      '\t\t</Button>',
      '\t);',
      '}',
      '',
    ].join('\n');
    const { output } = runTransform(transform, 'tabbed.tsx', source);
    expect(output).toContain('\t\t<Button color="primary" isOutlined>');
  });
});

describe('rbx value references', () => {
  it('rewrites flat-target member values (Tag.Group → Tags)', () => {
    const source = [
      "import { Tag } from 'rbx';",
      'const Group = Tag.Group;',
      'export const A = () => <Group>x</Group>;',
    ].join('\n');
    const { output } = runTransform(transform, 'member.tsx', source);
    expect(output).toContain('const Group = Tags;');
  });

  it('keeps same-compound member values on the bestax root', () => {
    const source = [
      "import { Card } from 'rbx';",
      'const Body = Card.Content;',
      'export const A = () => <Body>x</Body>;',
    ].join('\n');
    const { output } = runTransform(transform, 'compound.tsx', source);
    expect(output).toContain('const Body = Card.Content;');
  });

  it('flags member values whose target needs restructuring', () => {
    const source = [
      "import { Media } from 'rbx';",
      'const Item = Media.Item;',
      'export const A = () => <Item>x</Item>;',
    ].join('\n');
    const todos: TodoEntry[] = [];
    const { output } = runTransform(transform, 'special.tsx', source, {
      add: entry => todos.push(entry),
    });
    expect(todos.some(t => t.rule === 'value-reference')).toBe(true);
    expect(output).toContain("from 'rbx'");
  });

  it('flags a bare component used as a value when it has no flat target', () => {
    const source = [
      "import { Tile } from 'rbx';",
      'const X = Tile;',
      'export const A = () => String(X);',
    ].join('\n');
    const todos: TodoEntry[] = [];
    runTransform(transform, 'bare.tsx', source, {
      add: entry => todos.push(entry),
    });
    expect(todos.some(t => t.rule === 'value-reference')).toBe(true);
  });

  it('rewrites a bare component used as a value when it maps flatly', () => {
    const source = [
      "import { Box } from 'rbx';",
      'const X = Box;',
      'export const A = () => String(X);',
    ].join('\n');
    const { output } = runTransform(transform, 'bare-ok.tsx', source);
    expect(output).toContain('from "@allxsmith/bestax-bulma"');
  });
});

describe('rbx stylesheet imports', () => {
  const RBX_CSS = "import 'rbx/index.css';\n";
  const BULMA_CSS_IMPORT = "import 'bulma/css/bulma.min.css';\n";

  it('default (bestax): converges on the combined bestax.css bundle', () => {
    const { output } = runTransform(transform, 'styles.ts', RBX_CSS);
    expect(output).toContain('import "@allxsmith/bestax-bulma/bestax.css";');
    expect(output).not.toContain('TODO');
  });

  it('bestax: dedupes when both rbx and bulma css imports exist', () => {
    const { output } = runTransform(
      transform,
      'styles.ts',
      RBX_CSS + BULMA_CSS_IMPORT
    );
    const matches = (output ?? '').match(/bestax\.css/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('bestax: collapses a separate extras import', () => {
    const source =
      BULMA_CSS_IMPORT + "import '@allxsmith/bestax-bulma/extras.css';\n";
    const { output } = runTransform(transform, 'styles.ts', source);
    expect(output).toContain('import "@allxsmith/bestax-bulma/bestax.css";');
    expect(output).not.toContain('extras.css');
  });

  it('drops the Bulma extension stylesheets rbx pinned', () => {
    const source =
      "import 'bulma-tooltip/dist/css/bulma-tooltip.min.css';\n" +
      "import 'bulma-badge/dist/css/bulma-badge.min.css';\n";
    const todos: TodoEntry[] = [];
    const { output } = runTransform(transform, 'ext.ts', source, {
      add: entry => todos.push(entry),
    });
    // The IMPORTS go; the TODO comments naming them stay, so assert on the
    // emitted code rather than the whole output.
    const code = (output ?? '')
      .split('\n')
      .filter(l => !l.trim().startsWith('// TODO(bestax-migrate)'))
      .join('\n');
    expect(code).not.toContain('bulma-tooltip');
    expect(code).not.toContain('bulma-badge');
    expect(todos.filter(t => t.rule === 'css')).toHaveLength(2);
  });

  it('bulma mode: rewrites the rbx css and adds the extras import', () => {
    const { output } = runTransform(
      transform,
      'styles.ts',
      RBX_CSS,
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

  it('keep mode: only retargets the rbx css, with a TODO', () => {
    const todos: TodoEntry[] = [];
    const { output } = runTransform(
      transform,
      'styles.ts',
      RBX_CSS,
      { add: entry => todos.push(entry) },
      { cssMode: 'keep' }
    );
    expect(output).toContain('import "bulma/css/bulma.min.css";');
    expect(output).not.toContain('bestax.css');
    expect(todos.some(t => t.rule === 'css')).toBe(true);
  });
});
