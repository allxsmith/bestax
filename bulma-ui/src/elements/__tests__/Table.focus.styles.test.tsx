// While a responsive table overflows, its `.table-container` is a region you
// can tab to (#1839), and `elements/_table.scss` draws its keyboard focus ring
// the way Bulma draws its own on a link or a button. These read the compiled
// partial, not a browser: jsdom evaluates no `:focus-visible`.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json, so an
// upgrade moves its Sass and CSS and these together.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'elements/table';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

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

describe('the responsive table container’s focus ring', () => {
  it.each([
    ['no prefix', ''],
    ['a class prefix', 'bestax-'],
  ])(
    'is Bulma’s focus outline, on :focus-visible only, with %s',
    (_label, prefix) => {
      expect(blocksOf(compile(prefix))).toEqual([
        {
          selector: `.${prefix}table-container:focus-visible`,
          declarations: {
            'outline-color':
              'hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))',
            'outline-style': 'var(--bulma-focus-style)',
            'outline-width': 'var(--bulma-focus-width)',
            'outline-offset': 'var(--bulma-focus-offset)',
          },
        },
      ]);
    }
  );

  it.each([
    ['bulma.css', ''],
    ['versions/bulma-prefixed.css', 'bulma-'],
  ])(
    'meets no outline of Bulma’s on the container in %s, so one class wins in either order',
    (file, prefix) => {
      const css = fs.readFileSync(path.join(BULMA, 'css', file), 'utf8');
      const containerRules = blocksOf(css).filter(rule =>
        rule.selector.includes(`.${prefix}table-container`)
      );
      expect(containerRules.length).toBeGreaterThan(0);
      for (const rule of containerRules) {
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
    expect(index).toMatch(/^@use 'table';$/m);
  });
});
