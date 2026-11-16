// `elements/_table.scss` adjusts stock Bulma's table twice. While a responsive
// table overflows, its `.table-container` is a region you can tab to (#1839),
// and the partial draws its keyboard focus ring in Bulma's focus color, style
// and width, just inside the container. And in forced colors, which replaces
// Bulma's fill for a selected row or cell, it outlines that row or cell in
// Highlight (#1843). These read the compiled partial, not a browser: jsdom
// evaluates neither `:focus-visible` nor a media query.
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

const FORCED = '@media (forced-colors: active)';

/** The compiled CSS outside the forced-colors block, and the block's inside. */
const split = (css: string) => {
  const at = css.indexOf(FORCED);
  if (at < 0) return { outside: css, forced: '' };
  const open = css.indexOf('{', at);
  let depth = 0;
  let end = open;
  for (; end < css.length; end++) {
    if (css[end] === '{') depth++;
    else if (css[end] === '}' && --depth === 0) break;
  }
  return {
    outside: css.slice(0, at) + css.slice(end + 1),
    forced: css.slice(open + 1, end),
  };
};

describe('the responsive table container’s focus ring', () => {
  it.each([
    ['no prefix', ''],
    ['a class prefix', 'bestax-'],
  ])(
    'is Bulma’s focus outline, inside the container, on :focus-visible only, with %s',
    (_label, prefix) => {
      expect(blocksOf(split(compile(prefix)).outside)).toEqual([
        {
          selector: `.${prefix}table-container:focus-visible`,
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

describe('a selected row or cell in forced colors', () => {
  it.each([
    ['no prefix', ''],
    ['a class prefix', 'bestax-'],
  ])(
    'is outlined in Highlight, inside it, in forced colors only, with %s',
    (_label, prefix) => {
      const table = `.${prefix}table`;
      expect(blocksOf(split(compile(prefix)).forced)).toEqual([
        {
          selector: [
            `${table} tr.${prefix}is-selected`,
            `${table} td.${prefix}is-selected`,
            `${table} th.${prefix}is-selected`,
          ].join(', '),
          declarations: {
            outline: '2px solid Highlight',
            'outline-offset': '-2px',
          },
        },
      ]);
      // Outside forced colors, nothing names a selected row or cell.
      expect(
        blocksOf(split(compile(prefix)).outside).filter(rule =>
          rule.selector.includes('is-selected')
        )
      ).toEqual([]);
    }
  );

  it.each([
    ['bulma.css', ''],
    ['versions/bulma-prefixed.css', 'bulma-'],
  ])(
    'meets no outline of Bulma’s on a selected row or cell in %s, so it wins in either order',
    (file, prefix) => {
      const css = fs.readFileSync(path.join(BULMA, 'css', file), 'utf8');
      const selectedRules = blocksOf(css).filter(
        rule =>
          rule.selector.includes(`.${prefix}table`) &&
          rule.selector.includes(`.${prefix}is-selected`)
      );
      expect(selectedRules.length).toBeGreaterThan(0);
      for (const rule of selectedRules) {
        expect(
          Object.keys(rule.declarations).filter(name =>
            name.startsWith('outline')
          )
        ).toEqual([]);
      }
    }
  );
});
