/**
 * Where a helper guide splits into the sections `get_helper_props` serves:
 * at a `##` or `###` heading outside fenced code, never at a heading line an
 * example holds (#2243). scripts/gen-mcp-index.test.mjs holds the generator,
 * which loads this same module, to the same split.
 */
import { describe, expect, it } from 'vitest';

import { sections } from '../fences.js';
import { propTable } from '../helper-props.js';

const lines = (...l: string[]) => l.join('\n');

describe('sections', () => {
  it('splits at each ## or ### heading, keeping what comes before the first', () => {
    const doc = lines(
      'Intro.',
      '## Spacing',
      'Margin.',
      '### Visibility',
      'Hidden.',
      '#### Not a section',
      'Still Visibility.'
    );
    expect(sections(doc)).toEqual([
      'Intro.',
      '## Spacing\nMargin.',
      '### Visibility\nHidden.\n#### Not a section\nStill Visibility.',
    ]);
    expect(sections(doc).join('\n')).toBe(doc);
  });

  it('keeps a heading line inside fenced code in its section', () => {
    const doc = lines(
      '## Spacing',
      '```jsx live',
      'const notes = `',
      '## Title',
      '`;',
      '<img src="/img/logo.svg" alt="" />',
      '```',
      '### Visibility',
      '~~~tsx',
      '### Also code',
      '~~~'
    );
    expect(sections(doc).map(s => s.split('\n')[0])).toEqual([
      '## Spacing',
      '### Visibility',
    ]);
    expect(sections(doc).join('\n')).toBe(doc);
  });

  it('keeps a fence open past a run indented deeper than three past its opener', () => {
    const doc = lines(
      '## Spacing',
      '```jsx',
      '<pre>',
      '      ```',
      '## Title',
      '</pre>',
      '```',
      '### Visibility'
    );
    expect(sections(doc).map(s => s.split('\n')[0])).toEqual([
      '## Spacing',
      '### Visibility',
    ]);
  });

  it('reads the fences of a CRLF guide too', () => {
    const doc = [
      '## Spacing',
      '```jsx',
      '## Title',
      '```',
      '### Visibility',
    ].join('\r\n');
    expect(sections(doc).map(s => s.split('\n')[0])).toEqual([
      '## Spacing\r',
      '### Visibility',
    ]);
    expect(sections(doc).join('\n')).toBe(doc);
  });

  it('leaves the rest of a guide in one section after a fence never closed', () => {
    const doc = lines('## Spacing', '```tsx', '## Title', '### Visibility');
    expect(sections(doc)).toEqual([doc]);
  });
});

describe('propTable reads the real Supported Props section', () => {
  it('passes over a heading of that name inside an example', () => {
    const doc = lines(
      '## Usage',
      '```tsx',
      'const md = `',
      '## Supported Props',
      '| Prop | Type |',
      '| --- | --- |',
      '| fake | string |',
      '`;',
      '```',
      '## Supported Props',
      '| Prop | Type |',
      '| --- | --- |',
      '| m | string |'
    );
    expect(propTable(doc)).toContain('| m |');
    expect(propTable(doc)).not.toContain('fake');
  });
});
