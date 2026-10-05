// `colorMode` flips Bulma's scheme by writing a theme attribute on <html>.
// Bulma names that attribute after the class prefix a sheet was built with
// (`data-<prefix>theme`), so a prefixed build never reads `data-theme`. An
// attribute reaching the DOM proves nothing about which one the sheet reads,
// so these compile every published stylesheet that carries a dark scheme and
// resolve the scheme variable on the root, the way DateInput.styles.test.tsx
// checks the calendar against its real SCSS.
//
// jsdom applies an `@media` block only when its list names `screen`, so the
// visitor's OS preference is simulated by renaming the sheet's own
// `prefers-color-scheme` block for that scheme, which keeps the block where
// Bulma put it in the cascade.
import fs from 'fs';
import path from 'path';
import * as sass from 'sass';
import { render } from '@testing-library/react';
import { ConfigProvider } from '../Config';
import { Theme } from '../Theme';

const PKG = path.resolve(__dirname, '../../..');
const SCSS = path.join(PKG, 'src', 'scss');

const compile = (file: string) =>
  sass.compile(path.join(SCSS, file), {
    loadPaths: [path.resolve(PKG, '../node_modules')],
    quietDeps: true,
    logger: sass.Logger.silent,
  }).css;

/**
 * Every published stylesheet, read off `exports` the way
 * Loader.styles.test.tsx does, as the SCSS source it is built from.
 */
function publishedStylesheets(): Array<{ file: string; source: string }> {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(PKG, 'package.json'), 'utf8')
  ) as { exports: Record<string, { default?: string }> };
  const files = new Set<string>();
  for (const entry of Object.values(manifest.exports)) {
    const target = entry?.default;
    if (target?.endsWith('.css')) {
      files.add(target.replace(/^\.\/dist\//, '').replace(/\.css$/, '.scss'));
    }
  }
  return [...files].sort().map(file => ({
    file,
    source: fs.readFileSync(path.join(SCSS, file), 'utf8'),
  }));
}

const PUBLISHED = publishedStylesheets();

/**
 * The published stylesheets built with Bulma's full theme set, with the
 * class prefix each sets.
 */
const SHEETS = PUBLISHED.filter(({ source }) =>
  /bulma\/sass(?:\/themes)?['"]/.test(source)
).map(({ file, source }) => ({
  file,
  prefix: /\$class-prefix:\s*["']([^"']*)["']/.exec(source)?.[1] ?? '',
}));

it('checks every stylesheet with a dark scheme, prefixed and unprefixed', () => {
  // Floor against the manifest read or the filter going quietly wrong. A
  // sheet the filter leaves out is named here as having no dark scheme for
  // `colorMode` to reach, so a themed sheet it drops fails this even while
  // a sibling still covers its prefix.
  const themed = new Set(SHEETS.map(sheet => sheet.file));
  expect(
    PUBLISHED.map(({ file }) => file).filter(file => !themed.has(file))
  ).toEqual(['extras.scss', 'versions/bestax-no-dark-mode.scss']);
  expect(SHEETS.map(sheet => sheet.prefix)).toEqual(
    expect.arrayContaining(['', 'bestax-'])
  );
});

type Os = 'light' | 'dark';

/** The sheet as a visitor whose OS prefers `os` sees it. */
const forOs = (css: string, os: Os) => {
  const block = `@media (prefers-color-scheme: ${os})`;
  expect(css).toContain(block);
  return css.split(block).join('@media screen');
};

/** What the root resolves `--bulma-scheme-main-l` to. */
const schemeMainL = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue('--bulma-scheme-main-l')
    .trim();

describe.each(SHEETS)('$file', ({ file, prefix }) => {
  let css: string;
  let light: string;
  let dark: string;
  let sheet: HTMLStyleElement | undefined;

  const loadAs = (os: Os) => {
    sheet?.remove();
    sheet = document.createElement('style');
    sheet.textContent = forOs(css, os);
    document.head.appendChild(sheet);
  };

  beforeAll(() => {
    css = compile(file);
    // The scheme each of Bulma's own theme blocks sets, read off the sheet,
    // so the expectations follow Bulma rather than restating its values.
    const value = (scheme: Os) => {
      const rule = new RegExp(
        `\\[data-${prefix}theme=${scheme}\\][^{]*\\{[^}]*--bulma-scheme-main-l:\\s*([^;]+);`
      ).exec(css);
      if (!rule) throw new Error(`${file} has no ${scheme} theme block`);
      return rule[1].trim();
    };
    light = value('light');
    dark = value('dark');
    expect(light).not.toBe(dark);
  }, 60000);

  afterEach(() => {
    sheet?.remove();
    sheet = undefined;
    for (const name of Array.from(document.documentElement.attributes)) {
      if (name.name.endsWith('theme')) {
        document.documentElement.removeAttribute(name.name);
      }
    }
  });

  const renderTheme = (
    colorMode: 'light' | 'dark' | 'system',
    isRoot: boolean
  ) =>
    render(
      <ConfigProvider classPrefix={prefix}>
        <Theme colorMode={colorMode} isRoot={isRoot}>
          <span>Content</span>
        </Theme>
      </ConfigProvider>
    );

  it('follows the OS when nothing sets the scheme', () => {
    loadAs('light');
    expect(schemeMainL()).toBe(light);
    loadAs('dark');
    expect(schemeMainL()).toBe(dark);
  });

  describe.each([
    ['a scoped Theme', false],
    ['a root Theme', true],
  ])('%s', (_label, isRoot) => {
    it('turns the page dark with colorMode="dark" on a light OS', () => {
      loadAs('light');
      renderTheme('dark', isRoot);
      expect(schemeMainL()).toBe(dark);
    });

    it('keeps the page light with colorMode="light" on a dark OS', () => {
      loadAs('dark');
      renderTheme('light', isRoot);
      expect(schemeMainL()).toBe(light);
    });

    it('hands the scheme back to the OS with colorMode="system"', () => {
      loadAs('dark');
      const { rerender } = renderTheme('light', isRoot);
      expect(schemeMainL()).toBe(light);
      rerender(
        <ConfigProvider classPrefix={prefix}>
          <Theme colorMode="system" isRoot={isRoot}>
            <span>Content</span>
          </Theme>
        </ConfigProvider>
      );
      expect(schemeMainL()).toBe(dark);
    });

    it('hands the scheme back when it unmounts', () => {
      loadAs('light');
      const { unmount } = renderTheme('dark', isRoot);
      expect(schemeMainL()).toBe(dark);
      unmount();
      expect(schemeMainL()).toBe(light);
    });
  });
});
