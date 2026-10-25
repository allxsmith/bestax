/**
 * Each bulma-classes fixture renders the same HTML before and after the
 * migration. The input needs no library at all (it is plain JSX), so unlike
 * the other sources' fixtures it can run here, next to its output. Both are
 * compared with what a conversion changes on purpose restated: Font
 * Awesome's own `aria-hidden` moved up off the `<i>`, and the one `Icon`
 * writes on an icon in a link or button its own label names
 * (`support/hidden-glyph.ts`), a Bulma 0.9 class v1 removed written as the v1
 * class that replaced it (`withV1Classes`), and Font Awesome 6's long name for
 * a style written as its short one (`support/font-awesome-styles.ts`).
 */

import classNames from 'classnames';
import clsx from 'clsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withShortStyles } from './support/font-awesome-styles.js';
import {
  moveGlyphHidden,
  withLabelledGlyphsHidden,
} from './support/hidden-glyph.js';
import {
  loadModules,
  normalizeHtml,
  renderExports,
  withImplicitListRoles,
  withV1Classes,
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
    Object.entries(html).map(([name, markup]) => [
      name,
      moveGlyphHidden(normalizeHtml(markup)),
    ])
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
    const after = render(`${name}.output.tsx`);
    expect(after).toEqual(
      Object.fromEntries(
        Object.entries(before).map(([exported, html]) => {
          const converted = after[exported] ?? '';
          const restated = [
            withV1Classes,
            withImplicitListRoles,
            withShortStyles,
            withLabelledGlyphsHidden,
          ].reduce((markup, restate) => restate(markup, converted), html);
          return [exported, restated];
        })
      )
    );
  });
});
