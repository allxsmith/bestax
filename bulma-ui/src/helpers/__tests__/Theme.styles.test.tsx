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
import type { ReactElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { ConfigProvider } from '../Config';
import { Theme } from '../Theme';

const PKG = path.resolve(__dirname, '../../..');
const SCSS = path.join(PKG, 'src', 'scss');

/** Each sheet compiled once, for every block below that loads it. */
const compiled = new Map<string, string>();

const compile = (file: string) => {
  let css = compiled.get(file);
  if (css === undefined) {
    css = sass.compile(path.join(SCSS, file), {
      loadPaths: [path.resolve(PKG, '../node_modules')],
      quietDeps: true,
      logger: sass.Logger.silent,
    }).css;
    compiled.set(file, css);
  }
  return css;
};

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

// A color's on-scheme lightness given per scheme (#1184) has to land where
// Bulma's own value for that scheme would, whichever way the page picks its
// scheme. So these load the same stylesheets, put a root Theme's rules after
// them as the browser would, and resolve the variable on the root and on an
// element that names a scheme of its own. jsdom ranks rules by their order
// alone, not by specificity, so that every one of Theme's selectors is as
// specific as `:root` is pinned by the rule text in Theme.test.tsx.
describe.each(SHEETS)(
  'an on-scheme value per scheme, $file',
  ({ file, prefix }) => {
    const KEY = '--bulma-primary-on-scheme-l';
    let css: string;
    let bulmaDark: string;
    let sheet: HTMLStyleElement | undefined;

    beforeAll(() => {
      css = compile(file);
      const rule = new RegExp(
        `\\[data-${prefix}theme=dark\\][^{]*\\{[^}]*${KEY}:\\s*([^;]+);`
      ).exec(css);
      if (!rule) throw new Error(`${file} sets no dark ${KEY}`);
      bulmaDark = rule[1].trim();
    }, 60000);

    afterEach(() => {
      cleanup();
      sheet?.remove();
      sheet = undefined;
    });

    /**
     * Load the sheet as a visitor whose OS prefers `os` sees it, then render
     * `ui` and give the root Theme's own `prefers-color-scheme` rules the same
     * treatment, so they keep their place after the sheet.
     */
    const renderFor = (os: Os, ui: ReactElement) => {
      sheet = document.createElement('style');
      sheet.textContent = forOs(css, os);
      document.head.appendChild(sheet);
      const result = render(
        <ConfigProvider classPrefix={prefix}>{ui}</ConfigProvider>
      );
      const own = document.getElementById('bestax-bulma-theme-vars');
      if (own?.textContent) {
        own.textContent = own.textContent
          .split(`@media (prefers-color-scheme: ${os})`)
          .join('@media screen');
      }
      return result;
    };

    const resolved = (element: Element = document.documentElement) =>
      getComputedStyle(element).getPropertyValue(KEY).trim();

    const both = { light: '30%', dark: '70%' };

    describe.each(['light', 'dark'] as const)('on a %s OS', os => {
      it.each([
        [undefined, os],
        ['system', os],
        ['light', 'light'],
        ['dark', 'dark'],
      ] as const)(
        'with colorMode %s, takes the %s value',
        (colorMode, scheme) => {
          renderFor(
            os,
            <Theme isRoot colorMode={colorMode} bulmaVars={{ [KEY]: both }}>
              <span />
            </Theme>
          );
          expect(resolved()).toBe(both[scheme]);
        }
      );

      it('leaves a scheme it has no value for to the stylesheet', () => {
        renderFor(
          os,
          <Theme
            isRoot
            colorMode="dark"
            bulmaVars={{ [KEY]: { light: '30%' } }}
          >
            <span />
          </Theme>
        );
        expect(resolved()).toBe(bulmaDark);
      });

      it('applies on an element that names the other scheme', () => {
        const other = os === 'light' ? 'dark' : 'light';
        const { getByTestId } = renderFor(
          os,
          <Theme isRoot bulmaVars={{ [KEY]: both }}>
            <div data-testid="named" className={`${prefix}theme-${other}`} />
          </Theme>
        );
        expect(resolved()).toBe(both[os]);
        expect(resolved(getByTestId('named'))).toBe(both[other]);
      });

      it('loses to a later root Theme that gives one value', () => {
        renderFor(
          os,
          <>
            <Theme isRoot bulmaVars={{ [KEY]: both }}>
              <span />
            </Theme>
            <Theme isRoot bulmaVars={{ [KEY]: '50%' }}>
              <span />
            </Theme>
          </>
        );
        expect(resolved()).toBe('50%');
      });
    });
  }
);
