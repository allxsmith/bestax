/**
 * Shaping of the helper-prop reference.
 *
 * These run against the committed index rather than a fixture, like every other suite here:
 * the document being sliced is the product, and a test that stubs it proves nothing about
 * what a client receives.
 *
 * The governing invariant is the last test in the first block — **no call may lose a prop
 * name**. Everything else here is about size; that one is about correctness, and it is the
 * reason the default keeps the whole table instead of a curated subset.
 */
import { describe, expect, it, beforeAll } from '@jest/globals';

import { loadComponent } from '../data.js';
import {
  GROUP_NAMES,
  HELPER_GROUPS,
  propTable,
  reflowTables,
  renderHelperDefault,
  renderHelperGroup,
  resolveGroup,
} from '../helper-props.js';

let doc: string;
/** Every prop name in the `## Supported Props` table, parsed from the index itself. */
let allProps: string[];

beforeAll(async () => {
  const record = await loadComponent('useBulmaClasses');
  doc = record.doc ?? '';
  const chunk = doc
    .split(/\n(?=#{2,3} )/)
    .find(c => c.startsWith('## Supported Props'));
  allProps = (chunk ?? '')
    .split('\n')
    .filter(l => l.trim().startsWith('|'))
    .slice(2)
    .map(l => l.match(/^\s*\|\s*`?([A-Za-z][A-Za-z0-9]*)`?\s*\|/)?.[1])
    .filter((p): p is string => Boolean(p));
});

describe('the default answer', () => {
  it('is a fraction of the page it replaced', () => {
    const out = renderHelperDefault(doc);
    expect(doc.length).toBeGreaterThan(50_000);
    expect(out.length).toBeLessThan(10_000);
  });

  // The whole point of keeping the complete table in the default: a builder has to be able
  // to look up a valid value in one call. Dropping prose is a size decision; dropping a prop
  // name would be a correctness one.
  it('still names every prop in the index', () => {
    const out = renderHelperDefault(doc);
    expect(allProps.length).toBeGreaterThan(40);
    const missing = allProps.filter(p => !out.includes(`\`${p}\``));
    expect(missing).toEqual([]);
  });

  // The test above parses prop names with the same regex `propTable` uses, so a row that
  // regex cannot see would be missing from both and still pass. Counting table rows is
  // independent of that regex and catches it.
  it('carries as many table rows as the index has, parsed or not', () => {
    const chunk = doc
      .split(/\n(?=#{2,3} )/)
      .find(c => c.startsWith('## Supported Props'));
    const sourceRows = (chunk ?? '')
      .split('\n')
      .filter(l => l.trim().startsWith('|')).length;
    const renderedRows = renderHelperDefault(doc)
      .split('\n')
      .filter(l => l.trim().startsWith('|')).length;
    expect(renderedRows).toBe(sourceRows);
    expect(renderedRows).toBe(allProps.length + 2); // + header + separator
  });

  it('points at the groups so the prose is one call away', () => {
    const out = renderHelperDefault(doc);
    for (const g of GROUP_NAMES) expect(out).toContain(g);
  });
});

describe('groups', () => {
  // A prop absent from every group is a prop no `group` call can ever surface.
  it('assign every prop in the table to exactly one group', () => {
    const assigned = GROUP_NAMES.flatMap(g => HELPER_GROUPS[g].props);
    expect(allProps.filter(p => !assigned.includes(p))).toEqual([]);
    expect(new Set(assigned).size).toBe(assigned.length);
  });

  it('each return their own props and stay small', () => {
    for (const name of GROUP_NAMES) {
      const out = renderHelperGroup(doc, name);
      expect(out.length).toBeLessThan(10_000);
      for (const p of HELPER_GROUPS[name].props) {
        expect(out).toContain(`\`${p}\``);
      }
    }
  });

  it('returns nothing for a group that does not exist', () => {
    expect(renderHelperGroup(doc, 'not-a-group')).toBe('');
  });
});

describe('resolveGroup', () => {
  it.each(GROUP_NAMES)('resolves its own name: %s', name => {
    expect(resolveGroup(name)).toBe(name);
  });

  // The words a builder actually reaches for. `text` and `spacing` matter most: both are
  // named in the tool's own description, and under the old whole-body substring filter
  // `text` returned 87% of the page while a heading-only filter would have returned nothing.
  it.each([
    ['margin', 'spacing'],
    ['padding', 'spacing'],
    ['mt', 'spacing'],
    ['colour', 'color'],
    ['background', 'color'],
    ['text', 'typography'],
    ['font', 'typography'],
    ['textWeight', 'typography'],
    ['flexbox', 'flex'],
    ['justify', 'flex'],
    ['hidden', 'layout'],
    ['visibility', 'layout'],
    ['hover', 'interaction'],
    ['mobile', 'responsive'],
    ['breakpoint', 'responsive'],
    ['COLORS', 'color'],
    ['  spacing  ', 'spacing'],
  ])('maps %p to %p', (input, expected) => {
    expect(resolveGroup(input)).toBe(expected);
  });

  it.each(['', '   ', 'zzzz', 'quantum'])('gives up on %p', input => {
    expect(resolveGroup(input)).toBeNull();
  });
});

describe('reflowTables', () => {
  it('strips column padding without touching cell contents', () => {
    const padded = [
      '| Prop      | Type        |',
      '| --------- | ----------- |',
      '| `m`       | `1`–`6`     |',
    ].join('\n');
    expect(reflowTables(padded)).toBe(
      ['| Prop | Type |', '|---|---|', '| `m` | `1`–`6` |'].join('\n')
    );
  });

  it('keeps alignment markers, which carry meaning', () => {
    expect(reflowTables('| :--- | ---: |')).toBe('|:---|---:|');
  });

  it('does not touch a table inside a fenced code block', () => {
    const withFence = [
      '| Real | Table |',
      '| --- | --- |',
      '```md',
      '| Sample   | Table   |',
      '| -------- | ------- |',
      '```',
    ].join('\n');
    const out = reflowTables(withFence).split('\n');
    expect(out[0]).toBe('| Real | Table |');
    expect(out[1]).toBe('|---|---|');
    // Inside the fence, byte for byte.
    expect(out[3]).toBe('| Sample   | Table   |');
    expect(out[4]).toBe('| -------- | ------- |');
  });

  // An escaped pipe is how a cell writes a literal `|` — the natural spelling for a value
  // union. Splitting on it invents a column, which is information loss in a function whose
  // whole claim is that it causes none. Not reachable from today's index (no escaped pipes
  // in it), so this pins the property rather than a current behaviour.
  it('does not split a cell on an escaped pipe', () => {
    const escaped = [
      '| Prop | Values |',
      '| ---- | ------ |',
      '| `textAlign` | `left` \\| `right` |',
    ].join('\n');
    const out = reflowTables(escaped).split('\n');
    expect(out[2]).toBe('| `textAlign` | `left` \\| `right` |');
    // Two columns, not three.
    expect(out[2].split(/(?<!\\)\|/).length - 2).toBe(2);
  });

  it('leaves non-table lines alone', () => {
    const prose = 'A sentence | with a pipe in it.';
    expect(reflowTables(prose)).toBe(prose);
  });

  it('is a pure whitespace change — every cell survives', () => {
    const before = propTable(doc);
    const cells = (s: string) =>
      s
        .split('\n')
        .flatMap(l => l.split('|').map(c => c.trim()))
        .filter(c => c && !/^:?-+:?$/.test(c));
    expect(cells(reflowTables(before))).toEqual(cells(before));
  });
});

describe('propTable', () => {
  it('returns only the rows asked for', () => {
    const out = propTable(doc, ['m', 'mt']);
    expect(out).toContain('`m`');
    expect(out).toContain('`mt`');
    expect(out).not.toContain('`textSize`');
  });

  it('says nothing rather than emitting a header with no rows', () => {
    expect(propTable(doc, ['not-a-prop'])).toBe('');
  });

  it('returns nothing when the section is absent', () => {
    expect(propTable('# Some other document', ['m'])).toBe('');
  });
});
