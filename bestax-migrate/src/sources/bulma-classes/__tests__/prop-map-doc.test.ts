/**
 * The skill's prop map says which components render a color helper through
 * a prop other than the usual one, and which keep the class. Those are the
 * table's `textColor` and `bgColor` settings, so they are held to it here:
 * an agent follows this file, and a wrong entry there becomes a wrong edit.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOTS } from '../class-map.js';

const doc = fs.readFileSync(
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../../../skills/bestax-migrate/references/bulma-classes/prop-map.md'
  ),
  'utf8'
);

const mapped = Object.values(ROOTS).filter(entry => entry.status === 'mapped');

function targetsWhere(
  predicate: (entry: (typeof mapped)[number]) => boolean
): string[] {
  return mapped
    .filter(predicate)
    .map(entry => entry.target!)
    .sort();
}

/** The backticked names in a piece of prose. */
function names(text: string): string[] {
  return [...text.matchAll(/`([A-Z][\w.]*)`/g)].map(match => match[1]).sort();
}

describe('the shipped bulma-classes prop map matches the table', () => {
  it('names where each color class stays a class', () => {
    const sentence = doc.match(
      // The list ends at a full stop, not at the dot in a part's name.
      /the class stays: `has-text-\*`\s+on ([^;]+);\s+`has-background-\*` on ([\s\S]+?)\.(?:\s|$)/
    );
    expect(sentence).not.toBeNull();
    expect(names(sentence![1])).toEqual(
      targetsWhere(entry => entry.textColor === null)
    );
    expect(names(sentence![2])).toEqual(
      targetsWhere(entry => entry.bgColor === null)
    );
  });

  it('names the components that take a color through another prop', () => {
    const row = (token: string) =>
      doc.split('\n').find(line => line.startsWith(`| \`${token}\``)) ?? '';
    expect(names(row('has-text-{color}'))).toEqual(
      targetsWhere(entry => entry.textColor === 'color')
    );
    expect(names(row('has-background-{color}'))).toEqual(
      targetsWhere(entry => entry.bgColor === 'backgroundColor')
    );
  });
});
