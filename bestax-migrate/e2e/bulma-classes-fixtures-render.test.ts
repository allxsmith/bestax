/**
 * Each bulma-classes fixture renders the same HTML before and after the
 * migration. The input needs no library at all (it is plain JSX), so unlike
 * the other sources' fixtures it can run here, next to its output.
 */

import classNames from 'classnames';
import clsx from 'clsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadModules,
  normalizeHtml,
  renderExports,
} from './support/render-module.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'sources',
  'bulma-classes',
  '__testfixtures__'
);

const cases = fs
  .readdirSync(fixturesDir)
  .filter(file => file.endsWith('.input.tsx'))
  .map(file => file.replace(/\.input\.tsx$/, ''))
  .sort();

/** The class joiners a fixture may import, as the real packages. */
const JOINERS = {
  clsx: { __esModule: true, default: clsx, clsx },
  classnames: { __esModule: true, default: classNames },
};

function render(file: string): Record<string, string> {
  const source = fs.readFileSync(path.join(fixturesDir, file), 'utf8');
  const html = renderExports(loadModules({ fixture: source }, JOINERS).fixture);
  return Object.fromEntries(
    Object.entries(html).map(([name, markup]) => [name, normalizeHtml(markup)])
  );
}

describe('bulma-classes fixtures render the same before and after', () => {
  test.each(cases)('%s', name => {
    const before = render(`${name}.input.tsx`);
    expect(Object.keys(before).length).toBeGreaterThan(0);
    // Rendered with no props, an export that renders nothing proves nothing.
    expect(
      Object.entries(before)
        .filter(([, html]) => html === '')
        .map(([exported]) => exported)
    ).toEqual([]);
    expect(render(`${name}.output.tsx`)).toEqual(before);
  });
});
