/**
 * What a stylesheet or script a page loads is, read from its URL, and what
 * each message says about it. How a page's notes and its Bulma import come
 * out of these is `html.test.ts`'s.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FONT_AWESOME_PEER_RANGE } from '../../_shared/deps-common.js';
import {
  bulmaBuildMessage,
  bulmaMediaMessage,
  bulmaStylesheetMessage,
  classifyAsset,
  EXTENSION_COMPONENTS,
  extensionMessage,
  extensionPackage,
  fontAwesomeMessage,
  GUIDE_0_9_TO_1,
  PRIMARY_CLASS,
  scriptMessage,
  stylesheetMessage,
  webfontMessage,
  type Asset,
} from '../html-assets.js';

const bulmaUi = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  '..',
  'bulma-ui'
);

describe('classifyAsset', () => {
  it.each<[string, 'stylesheet' | 'script', Asset]>([
    [
      'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css',
      'stylesheet',
      { kind: 'bulma', build: null, version: '0.9.4' },
    ],
    [
      'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.4/css/bulma.min.css?v=2',
      'stylesheet',
      { kind: 'bulma', build: null, version: '0.9.4' },
    ],
    [
      'https://cdn.jsdelivr.net/npm/bulma@1/css/bulma.css',
      'stylesheet',
      { kind: 'bulma', build: null, version: '1' },
    ],
    [
      'css/bulma.min.css',
      'stylesheet',
      { kind: 'bulma', build: null, version: null },
    ],
    [
      'https://unpkg.com/bulma@1.0.4/css/versions/bulma-no-helpers-prefixed.min.css',
      'stylesheet',
      { kind: 'bulma', build: 'no-helpers-prefixed', version: '1.0.4' },
    ],
    [
      'node_modules/bulma/css/bulma-rtl.css',
      'stylesheet',
      { kind: 'bulma', build: 'rtl', version: null },
    ],
    [
      'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0/css/all.min.css',
      'stylesheet',
      { kind: 'font-awesome', major: 7, kit: false },
    ],
    [
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
      'stylesheet',
      { kind: 'font-awesome', major: 4, kit: false },
    ],
    [
      'https://use.fontawesome.com/releases/v5.15.4/css/all.css',
      'stylesheet',
      { kind: 'font-awesome', major: 5, kit: false },
    ],
    [
      'https://kit.fontawesome.com/0a1b2c3d4e.js',
      'script',
      { kind: 'font-awesome', major: null, kit: true },
    ],
    [
      'css/fontawesome.min.css',
      'stylesheet',
      { kind: 'font-awesome', major: null, kit: false },
    ],
    [
      'https://cdn.jsdelivr.net/npm/bulma-carousel@4.0.4/dist/js/bulma-carousel.min.js',
      'script',
      { kind: 'bulma-extension', name: 'bulma-carousel' },
    ],
    [
      'https://cdn.jsdelivr.net/npm/@creativebulma/bulma-tooltip@1.2.0/dist/bulma-tooltip.min.css',
      'stylesheet',
      { kind: 'bulma-extension', name: '@creativebulma/bulma-tooltip' },
    ],
    [
      'css/bulma-switch.min.css',
      'stylesheet',
      { kind: 'bulma-extension', name: 'bulma-switch' },
    ],
    // The bundle's combined stylesheet, and one extension's own file in it.
    [
      'https://cdn.jsdelivr.net/npm/bulma-extensions@6.2.7/dist/css/bulma-extensions.min.css',
      'stylesheet',
      { kind: 'bulma-extension', name: 'bulma-extensions' },
    ],
    [
      'https://cdn.jsdelivr.net/npm/bulma-extensions@6.2.7/bulma-carousel/dist/css/bulma-carousel.min.css',
      'stylesheet',
      { kind: 'bulma-extension', name: 'bulma-carousel' },
    ],
    [
      'node_modules/bulma-extensions/bulma-tooltip/dist/js/bulma-tooltip.min.js',
      'script',
      { kind: 'bulma-extension', name: 'bulma-tooltip' },
    ],
    [
      'https://code.jquery.com/jquery-3.7.1.slim.min.js',
      'script',
      { kind: 'jquery' },
    ],
    [
      'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js',
      'script',
      { kind: 'jquery' },
    ],
    ['https://cdn.jsdelivr.net/npm/jquery@3', 'script', { kind: 'jquery' }],
    [
      'https://code.jquery.com/ui/1.13.2/jquery-ui.min.js',
      'script',
      { kind: 'script' },
    ],
    [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
      'stylesheet',
      { kind: 'webfont', icons: null },
    ],
    [
      'https://fonts.googleapis.com/icon?family=Material+Icons',
      'stylesheet',
      { kind: 'webfont', icons: 'material-icons' },
    ],
    [
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
      'stylesheet',
      { kind: 'webfont', icons: 'material-symbols' },
    ],
    [
      'https://fonts.googleapis.com/css2?family=%E0%A4%A',
      'stylesheet',
      { kind: 'webfont', icons: null },
    ],
    [
      '//use.typekit.net/abc1def.css',
      'stylesheet',
      { kind: 'webfont', icons: null },
    ],
    ['https://example.com/theme.css', 'stylesheet', { kind: 'stylesheet' }],
    ['js/scripts.js', 'script', { kind: 'script' }],
    // Bulma's file name, loaded as a script, is no stylesheet of Bulma's.
    ['js/bulma.min.css', 'script', { kind: 'script' }],
  ])('reads %s (%s)', (url, loads, asset) => {
    expect(classifyAsset(url, loads)).toEqual(asset);
  });
});

describe("Bulma's stylesheet", () => {
  const facts = {
    quoted: 'https://cdn/bulma@0.9.4/css/bulma.min.css',
    version: '0.9.4' as string | null,
    css: 'keep' as const,
    usesPrimary: false,
  };

  it('says to keep loading it under keep, with the version the page names', () => {
    expect(bulmaStylesheetMessage(facts)).toContain(
      "from its entry (`import 'bulma/css/bulma.min.css'`, with `bulma@0.9.4` installed)"
    );
    expect(bulmaStylesheetMessage({ ...facts, version: null })).toContain(
      'with `bulma` installed'
    );
  });

  it('says nothing under bestax or bulma for a Bulma 1 page with no primary class', () => {
    for (const css of ['bestax', 'bulma'] as const) {
      expect(bulmaStylesheetMessage({ ...facts, css, version: '1.0.4' })).toBe(
        null
      );
    }
  });

  it("names the 0.9 to 1 guide for an older page, or one whose URL doesn't say", () => {
    const older = bulmaStylesheetMessage({ ...facts, css: 'bestax' });
    expect(older).toContain('the page was made for Bulma 0.9.4');
    expect(older).toContain(GUIDE_0_9_TO_1);
    expect(older).toContain('`@allxsmith/bestax-bulma/bestax.css`');
    const unknown = bulmaStylesheetMessage({
      ...facts,
      css: 'bulma',
      version: null,
    });
    expect(unknown).toContain("the URL doesn't say which Bulma it is");
    expect(unknown).toContain('`--css bulma` moves the app to Bulma 1');
  });

  it("names bestax's primary only under bestax, and only for a page that uses one", () => {
    const blue = bulmaStylesheetMessage({
      ...facts,
      css: 'bestax',
      version: '1',
      usesPrimary: true,
    });
    expect(blue).toContain('--bulma-primary-invert-l');
    expect(blue).not.toContain(GUIDE_0_9_TO_1);
    expect(
      bulmaStylesheetMessage({
        ...facts,
        css: 'bulma',
        version: '1',
        usesPrimary: true,
      })
    ).toBe(null);
    expect(
      bulmaStylesheetMessage({ ...facts, css: 'bestax', usesPrimary: true })
    ).toMatch(/0-9-to-1\) for what changed; and bestax's bundle/);
  });

  it.each(['is-primary', 'has-text-primary-dark', 'has-background-primary'])(
    'reads %s as a primary color class',
    token => expect(PRIMARY_CLASS.test(token)).toBe(true)
  );

  it.each(['is-primaryish', 'primary', 'has-text-link'])(
    'reads %s as none',
    token => expect(PRIMARY_CLASS.test(token)).toBe(false)
  );

  it("names bestax's own builds for one of Bulma's other builds", () => {
    expect(bulmaBuildMessage('rtl', 'css/bulma-rtl.css')).toContain(
      "Bulma's `rtl` build"
    );
    expect(fs.existsSync(path.join(bulmaUi, 'src', 'scss', 'versions'))).toBe(
      true
    );
  });
});

describe('Font Awesome', () => {
  const message = (
    url: string,
    loads: 'stylesheet' | 'script' = 'stylesheet'
  ) =>
    fontAwesomeMessage(
      classifyAsset(url, loads) as Extract<Asset, { kind: 'font-awesome' }>,
      url
    );

  it("names bestax-bulma's own peer range", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(bulmaUi, 'package.json'), 'utf8')
    );
    expect(FONT_AWESOME_PEER_RANGE).toBe(
      pkg.peerDependencies['@fortawesome/fontawesome-free']
    );
  });

  it('offers the v4 shims or the current names for Font Awesome 4', () => {
    const text = message(
      'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css'
    );
    expect(text).toContain('Font Awesome 4');
    // The icons it converts keep 4's own `fa`, which `Icon` writes as given.
    expect(text).toContain(
      'the codemod keeps that `fa` on each icon it converts (`variant="fa"`), which 4 styles'
    );
    expect(text).toContain('`css/v4-shims.min.css`');
    expect(text).toContain('`variant="regular"`');
    expect(text).toContain(FONT_AWESOME_PEER_RANGE);
    // A brand's glyph under `fa` draws in 5 and later only with the shims.
    expect(text).toContain(
      'a brand\'s glyph (`fa fa-github`) needs `variant="brands"`'
    );
  });

  it('says Font Awesome 5 works from a link, and installs as 6 or 7, where the handsets turned', () => {
    const text = message(
      'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.13.0/css/all.min.css'
    );
    expect(text).toContain('Font Awesome 5');
    expect(text).toContain('ERESOLVE');
    expect(text).toContain(
      "write 5's `phone` and `phone-square` as `phone-flip` and `square-phone-flip`, and 5's `phone-alt` and `phone-square-alt` as `phone` and `square-phone`"
    );
  });

  it('names only what the Font Awesome bestax-bulma builds with has', () => {
    const css = (file: string) =>
      fs.readFileSync(
        path.join(
          bulmaUi,
          'node_modules',
          '@fortawesome',
          'fontawesome-free',
          'css',
          file
        ),
        'utf8'
      );
    const all = css('all.css');
    const glyph = (name: string) =>
      new RegExp(`\\.fa-${name}\\s*[,{]`).exec(all);
    // The names the message writes, and the older ones it reads, are there.
    for (const name of [
      'phone',
      'phone-flip',
      'phone-alt',
      'square-phone',
      'square-phone-flip',
      'phone-square',
      'phone-square-alt',
      'magnifying-glass',
      'search',
      'envelope',
      'github',
    ]) {
      expect({ name, found: glyph(name) !== null }).toEqual({
        name,
        found: true,
      });
    }
    // 5's names keep the code point each had: their look is what turned.
    const point = (name: string) =>
      new RegExp(`\\.fa-${name}\\s*\\{\\s*--fa:\\s*"([^"]+)"`).exec(all)?.[1];
    expect(point('phone-alt')).toBe(point('phone-flip'));
    expect(point('phone-square-alt')).toBe(point('square-phone-flip'));
    // The v4 shims draw 4's `fa fa-github` with the brands' font.
    expect(css('v4-shims.css')).toMatch(
      /\.fa\.fa-github\s*\{\s*font-family:\s*"Font Awesome \d+ Brands"/
    );
  });

  it.each([6, 7])('keeps Font Awesome %i as it is', major => {
    const text = message(
      `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@${major}/css/all.min.css`
    );
    expect(text).toContain(`Font Awesome ${major} from`);
    expect(text).toContain('`css/all.min.css`');
    expect(text).not.toContain('v4-shims');
  });

  it('says a newer major is outside the peer range', () => {
    expect(
      message(
        'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@8/css/all.min.css'
      )
    ).toContain('where no peer range applies');
  });

  it("covers a kit, and a URL that doesn't say its version", () => {
    expect(message('https://kit.fontawesome.com/abc.js', 'script')).toContain(
      'a Font Awesome kit'
    );
    expect(message('css/fontawesome.css')).toContain(
      'with `css/v4-shims.min.css` beside it if'
    );
    expect(message('css/fontawesome.css')).toContain(
      "the bestax-icons skill's `references/icon-libraries.md` names the older names"
    );
  });
});

describe('Bulma extensions', () => {
  const read = (component: string) =>
    fs.readFileSync(path.join(bulmaUi, 'src', component), 'utf8');

  it.each([
    ['bulma-carousel', 'components/Carousel.tsx', 'CarouselItem'],
    ['bulma-switch', 'form/Switch.tsx', 'Switch'],
    ['bulma-toast', 'components/Toast.tsx', 'ToastContainer'],
    ['bulma-pageloader', 'components/Loading.tsx', 'isFullPage'],
    ['bulma-accordion', 'components/Collapses.tsx', 'Collapses'],
  ])('names a component for %s that is there', (name, file, word) => {
    expect(EXTENSION_COMPONENTS[name]).toContain(`\`${word}`);
    expect(read(file)).toContain(word);
  });

  it('names the component, and its script only when the page loads one', () => {
    const both = extensionMessage(
      'bulma-carousel',
      ['a.css', 'a.js'],
      new Set(['stylesheet', 'script']),
      'keep'
    );
    expect(both).toContain('`Carousel`');
    expect(both).toContain('from `a.css` and `a.js`');
    expect(both).toContain("in place of the extension's markup and script");
    const sheet = extensionMessage(
      '@creativebulma/bulma-tooltip',
      ['t.css'],
      new Set(['stylesheet']),
      'keep'
    );
    expect(sheet).toContain('`Tooltip`');
    expect(sheet).toContain("in place of the extension's markup, and stop");
  });

  it("says bulma-carousel's is-covered images need a rule of their own, only when the page has them", () => {
    const covered = (name: string, has: boolean) =>
      extensionMessage(name, ['c.css'], new Set(['stylesheet']), 'keep', has);
    expect(covered('bulma-carousel', true)).toMatch(
      /stop loading the extension once nothing the app keeps uses its classes; the page's `is-covered` images are cropped by its stylesheet only inside its own slides, .*the `html-extension:is-covered` TODO has$/
    );
    expect(covered('bulma-carousel', false)).not.toContain('is-covered');
    expect(covered('bulma-slider', true)).not.toContain('is-covered');
  });

  it('reads an extension by its package, without a scope', () => {
    expect(extensionPackage('@creativebulma/Bulma-Tooltip')).toBe(
      'bulma-tooltip'
    );
    expect(extensionPackage('bulma-carousel')).toBe('bulma-carousel');
  });

  it("puts bulma-social's classes on Button, as the templates do", () => {
    const text = extensionMessage(
      'bulma-social',
      ['s.css'],
      new Set(['stylesheet']),
      'bestax'
    );
    expect(text).toContain('bestax has no component for it');
    expect(text).toContain('go on `Button` through `className`');
  });

  it('points the bundle at the reference, and says to keep an unknown one', () => {
    expect(
      extensionMessage(
        'bulma-extensions',
        ['x.css'],
        new Set(['stylesheet']),
        'keep'
      )
    ).toContain('references/bulma-classes/unmappables.md');
    const keep = extensionMessage(
      'bulma-ribbon',
      ['r.css'],
      new Set(['stylesheet']),
      'keep'
    );
    expect(keep).toContain('keep loading it once for the app');
    expect(keep).not.toContain('Bulma 1');
    expect(
      extensionMessage(
        'bulma-ribbon',
        ['r.css'],
        new Set(['stylesheet']),
        'bestax'
      )
    ).toContain('check it works with Bulma 1');
  });
});

describe('web fonts, stylesheets and scripts', () => {
  it("names Icon's library for Google's icon fonts", () => {
    expect(
      webfontMessage({ kind: 'webfont', icons: 'material-icons' }, 'u')
    ).toContain('`library="material-icons"`');
    expect(
      webfontMessage({ kind: 'webfont', icons: 'material-symbols' }, 'u')
    ).toContain("Google's Material Symbols");
    expect(webfontMessage({ kind: 'webfont', icons: null }, 'u')).toContain(
      'self-host the font'
    );
  });

  it('reads where a stylesheet or a script is', () => {
    expect(stylesheetMessage('css/a.css', 'beside', 'css/a.css')).toContain(
      'imports it as `./css/a.css`'
    );
    expect(stylesheetMessage('./css/a.css', 'beside', './css/a.css')).toContain(
      'imports it as `./css/a.css`'
    );
    expect(stylesheetMessage('css/a.css', 'missing', 'css/a.css')).toContain(
      "isn't beside the page"
    );
    expect(stylesheetMessage('https://x/a.css', 'elsewhere', '')).toContain(
      'load it once for the app'
    );
    expect(scriptMessage('js/a.js', 'beside', 'js/a.js')).toContain(
      'its code is still in `js/a.js`'
    );
    expect(scriptMessage('js/a.js', 'missing', 'js/a.js')).toContain(
      'find the one it meant'
    );
    expect(scriptMessage('https://x/a.js', 'elsewhere', '')).toContain(
      'replace what it does with React code'
    );
  });

  it("says where a stylesheet's own relative URLs resolve, and from the site root when it can", () => {
    const urls = {
      folder: 'css',
      written: '`../media/bg.webp`',
      fromRoot: '`/media/bg.webp`',
    };
    expect(
      stylesheetMessage('css/a.css', 'beside', 'css/a.css', urls)
    ).toContain(
      "; the relative URLs in it (`../media/bg.webp`) resolve against `css/`, the stylesheet's folder, so moving its rules into the app's stylesheet (such as `src/index.css`) means rewriting each against that file's folder, or copying the files into the app's `public/` folder and pointing at them from the site root (`/media/bg.webp`)"
    );
    const beside = stylesheetMessage('a.css', 'beside', 'a.css', {
      folder: null,
      written: '`../bg.png`',
      fromRoot: null,
    });
    expect(beside).toContain(
      "resolve against the stylesheet's folder, the page's, so"
    );
    expect(beside).toMatch(/pointing at them from the site root$/);
    // Only a stylesheet beside the page is read for them.
    expect(
      stylesheetMessage('css/a.css', 'missing', 'css/a.css', urls)
    ).not.toContain('relative URLs');
  });

  it("says only what the page's folder shows about a file that isn't there", () => {
    // A `<base href>` may have sent the browser somewhere else for it.
    for (const message of [
      stylesheetMessage('css/a.css', 'missing', 'css/a.css'),
      scriptMessage('js/a.js', 'missing', 'js/a.js'),
    ]) {
      expect(message).toContain("isn't beside the page");
      expect(message).not.toMatch(/never/);
    }
  });
});

describe('a Bulma link an import cannot stand for', () => {
  const facts = {
    quoted: 'https://cdn/bulma@1.0.4/css/bulma.min.css',
    version: '1.0.4',
    usesPrimary: false,
    nextjs: true,
  };

  it("names a Next.js app's root layout and pages/_app, in every mode but keep", () => {
    const bestax = bulmaStylesheetMessage({ ...facts, css: 'bestax' });
    expect(bestax).toContain('`pages/_app`');
    expect(bestax).toContain(
      "write `import '@allxsmith/bestax-bulma/bestax.css'` there"
    );
    const older = bulmaStylesheetMessage({
      ...facts,
      css: 'bulma',
      version: '0.9.4',
    });
    expect(older).toContain('(with `bulma` in package.json)');
    expect(older).toContain(GUIDE_0_9_TO_1);
    expect(bulmaStylesheetMessage({ ...facts, css: 'keep' })).not.toContain(
      'Next.js'
    );
  });

  it('names the media query a link was for', () => {
    expect(bulmaMediaMessage('css/bulma.css', null, 'print')).toContain(
      'for `media="print"` only'
    );
  });
});
