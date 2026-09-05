/**
 * bloomer's `tag` is on nearly every component; bestax's `as` is on a subset.
 * The prop-map documents which components carry it over, and that list is a
 * shipped product surface an agent follows. This holds the list to the table
 * — every component the mapping renames `tag` → `as` must be named there, and
 * nothing else may be — and pins the three behaviours the codemod promises:
 * the rename, the TODO elsewhere, and the plain-element tags.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAPPING } from '../mapping.js';
import transform from '../transform.js';
import { runTransform } from '../../../runner.js';
import type { TodoEntry } from '../../../types.js';

const DOC = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../../skills/bestax-migrate/references/bloomer/prop-map.md'
);

function migrate(source: string) {
  const todos: TodoEntry[] = [];
  const { output } = runTransform(transform, 'case.tsx', source, {
    add: entry => todos.push(entry),
  });
  return { output: output ?? '', rules: todos.map(t => t.rule) };
}

const renamesTag = Object.entries(MAPPING)
  .filter(([, entry]) => entry.props?.tag?.rename === 'as')
  .map(([name]) => name)
  .sort();

describe('the documented `tag` → `as` list', () => {
  it('names exactly the components whose mapping renames tag to as', () => {
    const doc = fs.readFileSync(DOC, 'utf8');
    const section = doc.slice(
      doc.indexOf('## `tag` → `as`'),
      doc.indexOf('Everywhere else `tag` is left in place')
    );
    const listed = [...section.matchAll(/`([A-Z][A-Za-z]*)`/g)]
      .map(m => m[1])
      .sort();
    expect(listed).toEqual(renamesTag);
  });

  test.each(renamesTag)('%s carries a literal tag over as `as`', name => {
    const { output, rules } = migrate(
      `import { ${name} } from 'bloomer';\nexport const A = () => <${name} tag="span">x</${name}>;\n`
    );
    expect(rules).not.toContain('prop:tag');
    expect(output).toContain('as="span"');
    expect(output).not.toContain('tag=');
  });

  it('flags tag on a component whose bestax counterpart has no `as`', () => {
    const { output, rules } = migrate(
      'import { Box } from \'bloomer\';\nexport const A = () => <Box tag="section">x</Box>;\n'
    );
    expect(rules).toEqual(['prop:tag']);
    expect(output).toContain('<Box tag="section">');
  });

  it('honours a literal tag on markup that becomes plain HTML', () => {
    const { output, rules } = migrate(
      'import { Help, TabLink } from \'bloomer\';\nexport const A = () => <><Help tag="span">a</Help><TabLink tag="button">b</TabLink></>;\n'
    );
    expect(rules).toEqual([]);
    expect(output).toContain('<span className="help">a</span>');
    expect(output).toContain('<button>b</button>');
  });
});
