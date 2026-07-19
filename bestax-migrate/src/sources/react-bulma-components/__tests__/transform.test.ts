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
    expect(output).toContain('<Input />');
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

  it('rewrites v3 bundled CSS imports to bulma', () => {
    const source =
      "import 'react-bulma-components/dist/react-bulma-components.min.css';\n";
    const { output } = runTransform(transform, 'styles.ts', source);
    expect(output).toContain('import "bulma/css/bulma.min.css";');
    expect(output).toContain('TODO(bestax-migrate)');
  });
});
