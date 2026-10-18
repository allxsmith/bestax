/**
 * @jest-environment node
 */
// Every class a partial selects has to carry `$class-prefix`, or the
// prefixed builds ship a rule that matches nothing. That was #1100:
// Checkbox, Radio and Switch selected `.check` and `.control-label` bare, so
// with a prefix they drew no box. `check:conformance` only reads top-level
// selectors, so this compiles every partial with a prefix and reads the
// classes out of every selector, nested ones included, which also covers a
// partial added later. The bare classes allowed are an icon library's own,
// which `Icon` renders as the library spells them, since that library's CSS
// is what styles them.
import * as sass from 'sass';
import { readdirSync } from 'fs';
import path from 'path';

const SCSS = path.resolve(__dirname, '../scss');

// The Bulma bulma-ui depends on, resolved through package.json since jest
// maps any `.css` specifier to a stub.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const PREFIX = 'bestax-';

/** Every partial each folder's `_index.scss` can register. */
const PARTIALS = ['components', 'elements', 'form', 'helpers'].flatMap(dir =>
  readdirSync(path.join(SCSS, dir))
    .filter(
      file =>
        file.startsWith('_') && file.endsWith('.scss') && file !== '_index.scss'
    )
    .map(file => `${dir}/${file.slice(1, -'.scss'.length)}`)
);

/** Icon-library classes, which `Icon` renders without the prefix. */
const ICON_LIBRARY_CLASSES = new Set([
  // Font Awesome's style classes.
  ...['fas', 'far', 'fab', 'fal', 'fad', 'fat'],
  ...['solid', 'regular', 'brands', 'light', 'duotone', 'thin'].map(
    style => `fa-${style}`
  ),
  // Material Icons' and Material Symbols' font classes.
  'material-icons',
  ...['outlined', 'round', 'sharp', 'two-tone'].map(
    style => `material-icons-${style}`
  ),
  ...['outlined', 'rounded', 'sharp'].map(style => `material-symbols-${style}`),
]);

const compile = (source: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${PREFIX}');\n${source}`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

/**
 * Each class a selector in `css` names without the prefix, as
 * `.class in selector`. Comments and quoted strings go first, so a class
 * written inside an attribute value or a comment isn't read as one.
 */
function bareClasses(css: string): string[] {
  const found: string[] = [];
  const text = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"[^"]*"|'[^']*'/g, '""');
  for (const [, selector] of text.matchAll(/([^{};]+)\{/g)) {
    const trimmed = selector.trim();
    if (trimmed.startsWith('@')) continue;
    for (const [, name] of trimmed.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
      if (name.startsWith(PREFIX) || ICON_LIBRARY_CLASSES.has(name)) continue;
      found.push(`.${name} in ${trimmed.replace(/\s+/g, ' ')}`);
    }
  }
  return found;
}

it('finds the partials of every folder', () => {
  expect(PARTIALS).toEqual(
    expect.arrayContaining([
      'components/collapse',
      'elements/kbd',
      'form/checkbox',
      'helpers/cursor',
    ])
  );
});

describe.each(PARTIALS)('%s', partial => {
  it('selects every class with the prefix', () => {
    expect(bareClasses(compile(`@use '${partial}';`))).toEqual([]);
  });
});

describe('the check', () => {
  it('finds a bare class nested inside a prefixed one', () => {
    expect(
      bareClasses(
        compile(`@use 'bulma/sass/utilities/initial-variables' as iv;
          .#{iv.$class-prefix}styled-checkbox {
            input:checked + .check { color: red; }
            &:not(.is-on) { color: blue; }
          }`)
      )
    ).toEqual([
      '.check in .bestax-styled-checkbox input:checked + .check',
      '.is-on in .bestax-styled-checkbox:not(.is-on)',
    ]);
  });

  it('lets an icon library class through, and nothing in a string', () => {
    expect(
      bareClasses(
        compile(`.#{'bestax-'}icon .fa-solid, .#{'bestax-'}icon .material-icons { color: red; }
          a[href$=".pdf"] { color: blue; }`)
      )
    ).toEqual([]);
  });
});
