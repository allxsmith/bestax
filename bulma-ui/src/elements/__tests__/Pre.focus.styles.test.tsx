// While a `Pre` overflows, it's a tab stop (#1854), and
// `elements/_pre.scss` draws its keyboard focus ring in Bulma's focus color,
// style and width, just inside the block, as `_table.scss` does for a
// responsive table's container. These read the compiled partial, not a
// browser: jsdom evaluates no `:focus-visible`.
import fs from 'fs';
import path from 'path';
import { bulmaCss, compilePartial } from '../../__tests__/css-cascade';

const SCSS = path.resolve(__dirname, '../../scss');

/** Each innermost `selector { declarations }` block, whitespace collapsed. */
const blocksOf = (css: string) =>
  [
    ...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g),
  ].map(([, selector, body]) => ({
    selector: selector.replace(/\s+/g, ' ').trim(),
    declarations: Object.fromEntries(
      body
        .split(';')
        .map(part => part.trim())
        .filter(Boolean)
        .map(part => {
          const colon = part.indexOf(':');
          return [
            part.slice(0, colon).trim(),
            part
              .slice(colon + 1)
              .replace(/\s+/g, ' ')
              .trim(),
          ];
        })
    ),
  }));

describe('the Pre focus ring', () => {
  it.each([
    ['no prefix', ''],
    ['a class prefix', 'bestax-'],
  ])(
    'is Bulma’s focus outline, inside the block, on :focus-visible only, with %s',
    (_label, prefix) => {
      expect(blocksOf(compilePartial('elements/pre', prefix))).toEqual([
        {
          selector: 'pre:focus-visible',
          declarations: {
            'outline-color':
              'hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))',
            'outline-style': 'var(--bulma-focus-style)',
            'outline-width': 'var(--bulma-focus-width)',
            'outline-offset': 'calc(-1 * var(--bulma-focus-width))',
          },
        },
      ]);
    }
  );

  it.each([['bulma.css'], ['versions/bulma-prefixed.css']])(
    'meets no outline of Bulma’s on a pre in %s, so it wins in either order',
    file => {
      const preRules = blocksOf(bulmaCss(file)).filter(rule =>
        rule.selector
          .split(',')
          .some(part => /(^|[\s>+~])pre(\b|$)/.test(part.trim()))
      );
      expect(preRules.length).toBeGreaterThan(0);
      for (const rule of preRules) {
        expect(
          Object.keys(rule.declarations).filter(name =>
            name.startsWith('outline')
          )
        ).toEqual([]);
      }
    }
  );

  it('is in the elements index, so bestax.css and extras.css carry it', () => {
    const index = fs.readFileSync(
      path.join(SCSS, 'elements/_index.scss'),
      'utf8'
    );
    expect(index).toMatch(/^@use 'pre';$/m);
  });
});
