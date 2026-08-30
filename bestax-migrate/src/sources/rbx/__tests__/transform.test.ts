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
