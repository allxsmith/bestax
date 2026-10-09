/**
 * The skill's bulma-classes component map is a shipped product surface (it
 * reaches agents through the MCP index and the create-bestax bundle), so it
 * must say what the table does. This holds its two tables to `ROOTS` and
 * `WRAPPERS`, and its lists of families and left-alone classes to the
 * table's `todo` and `plain` roots. The recipe it gives for a `.file` with
 * an empty name slot, which the unmappables reference repeats under that
 * TODO, comes from the planner rather than the table, so it is held to `plan`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOTS, WRAPPERS, type RootEntry } from '../class-map.js';
import { plan, type ChildFacts, type ElementFacts } from '../plan.js';

const DOC = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../../skills/bestax-migrate/references/bulma-classes/component-map.md'
);

const doc = fs.readFileSync(DOC, 'utf8');

/** The table rows under a heading, as arrays of trimmed cells. */
function rowsUnder(heading: string): string[][] {
  const start = doc.indexOf(`## ${heading}`);
  const end = doc.indexOf('\n## ', start + 1);
  return doc
    .slice(start, end === -1 ? undefined : end)
    .split('\n')
    .filter(line => line.startsWith('|') && !/^\|\s*-/.test(line))
    .slice(1)
    .map(line =>
      line
        .split('|')
        .slice(1, -1)
        .map(cell => cell.trim())
    );
}

function tagsCell(entry: RootEntry): string {
  if (entry.as === 'any') return `\`<${entry.tag}>\`, any tag via \`as\``;
  if (entry.as) {
    return `${entry.as.map(tag => `\`<${tag}>\``).join(', ')} via \`as\``;
  }
  return `\`<${entry.tag}>\` only`;
}

describe('the shipped bulma-classes component map matches the table', () => {
  it('lists every mapped root, with its target and tags', () => {
    const expected = Object.entries(ROOTS)
      .filter(([, entry]) => entry.status === 'mapped')
      .map(([root, entry]) => [
        `\`.${root}\``,
        `\`${entry.target}\``,
        tagsCell(entry),
      ]);
    expect(rowsUnder('Components')).toEqual(expected);
  });

  it('lists every wrapper it folds, with the props that render it', () => {
    expect(rowsUnder('Wrappers a component renders')).toEqual(
      Object.entries(ROOTS)
        .filter(([, entry]) => entry.status === 'fold')
        .map(([root, entry]) => [
          `\`.${root}\``,
          `\`${[entry.target, ...(entry.folds ?? []).map(write => write.prop)].join(' ')}\``,
        ])
    );
  });

  it('lists every plain-tag wrapper', () => {
    expect(rowsUnder('Plain tags with helper classes')).toEqual(
      Object.entries(WRAPPERS).map(([tag, target]) => [
        `\`<${tag}>\``,
        `\`${target}\``,
      ])
    );
  });

  it('names every class it leaves alone', () => {
    const section = doc.slice(doc.indexOf('## Classes left alone'));
    for (const [root, entry] of Object.entries(ROOTS)) {
      if (entry.status !== 'plain') continue;
      expect({ root, named: section.includes(`\`.${root}\``) }).toEqual({
        root,
        named: true,
      });
    }
  });

  it('gives every family it leaves as markup a recipe', () => {
    const unmappables = fs.readFileSync(
      path.join(path.dirname(DOC), 'unmappables.md'),
      'utf8'
    );
    for (const [root, entry] of Object.entries(ROOTS)) {
      if (entry.status !== 'todo' || entry.part) continue;
      expect({
        root,
        documented: unmappables.includes(`\`family:${root}\``),
      }).toEqual({ root, documented: true });
    }
  });
});

describe('the shipped .file recipe for a name slot with no name matches the planner', () => {
  const unmappables = fs.readFileSync(
    path.join(path.dirname(DOC), 'unmappables.md'),
    'utf8'
  );

  /**
   * The paragraph in a heading's section that says `marker`, its lines
   * joined, so rewrapping the prose moves nothing.
   */
  function paragraph(text: string, heading: string, marker: string): string {
    const start = text.indexOf(heading);
    if (start === -1) return '';
    const end = text.indexOf('\n#', start + heading.length);
    return (
      text
        .slice(start, end === -1 ? undefined : end)
        .split(/\n\s*\n/)
        .map(lines => lines.replace(/\s+/g, ' '))
        .find(lines => lines.includes(marker)) ?? ''
    );
  }

  const node = (
    tag: string,
    tokens: string[],
    extra: Partial<ChildFacts> = {}
  ): ChildFacts => ({
    tag,
    tokens,
    attributes: new Map(),
    hasSpread: false,
    isEmpty: false,
    ...extra,
  });
  /** A `has-name` `.file` inside a `.field`, with no `.file-name`. */
  const nameless = (className: string, extra: Partial<ElementFacts> = {}) =>
    plan({
      tag: 'div',
      tokens: className.split(' '),
      attributes: new Map(),
      hasSpread: false,
      hasRef: false,
      hasChildren: true,
      classesAround: ['field'],
      childElements: [
        node('label', ['file-label'], {
          children: [
            node('input', ['file-input'], {
              attributes: new Map([['type', 'file']]),
              isEmpty: true,
            }),
            node('span', ['file-cta'], {
              children: [
                node('span', ['file-label'], {
                  staticContent: true,
                  text: 'Upload',
                }),
              ],
            }),
          ],
        }),
      ],
      ...extra,
    });

  const written = nameless('file has-name is-empty');
  const bare = nameless('file has-name');
  const conditional = nameless('file has-name', {
    conditional: [['is-empty']],
  });
  const rule = bare.todos.map(todo => todo.rule).join(' ');
  // An agent sent to the unmappables by this TODO reads the section its rule
  // names, so that is where the recipe has to be.
  const recipes = {
    'component-map.md': paragraph(
      doc,
      '## A tree a component renders from props',
      '`has-name` `.file` with no `.file-name`'
    ),
    'unmappables.md': paragraph(
      unmappables,
      `### \`${rule.split(':')[0]}:<Target>\``,
      '`has-name` `.file` with no `.file-name`'
    ),
  };

  it('converts it only with is-empty written out, and the references say so', () => {
    expect(written.conversion).not.toBeNull();
    expect(rule).toBe('defaults:File');
    expect(conditional.todos.map(todo => todo.rule).join(' ')).toBe(rule);
    for (const [file, text] of Object.entries(recipes)) {
      expect({
        file,
        // Within one sentence: a code span's dot (`.file`) ends none.
        static: /`is-empty` (?:[^.`]|`[^`]*`)*as a static class/.test(text),
        condition: /a condition on (?:it|`is-empty`) can't stand in/.test(text),
      }).toEqual({ file, static: true, condition: true });
    }
    expect(recipes['component-map.md']).toContain(`\`${rule}\``);
  });

  it('pins the name empty, and the references say so', () => {
    expect(written.conversion?.file?.fileName).toBe('');
    // The class goes with the rest of the tree, since `File` renders it.
    expect(written.conversion?.className).toBeNull();
    for (const [file, text] of Object.entries(recipes)) {
      expect({ file, pins: text.includes('`fileName=""`') }).toEqual({
        file,
        pins: true,
      });
    }
    expect(recipes['component-map.md']).toContain(
      'The class then goes with the rest of the tree.'
    );
  });
});
