/**
 * The stylesheets and scripts a Bulma page loads, read from their URLs: what
 * each one is (`html-asset:<kind>`, `ASSET_KINDS` in `html-rules.ts`) and what
 * to do about it now that a component renders the page. Pure: the caller
 * reads the page, decides where a note goes and whether Bulma's stylesheet
 * becomes an import.
 *
 * A message names bestax's component for an extension only where one does
 * what the extension did; each claim here was read off the component.
 */

import type { CssMode } from '../../types.js';
import { FONT_AWESOME_PEER_RANGE } from '../_shared/deps-common.js';

export type Loads = 'stylesheet' | 'script';

export type Asset =
  /** Bulma's stylesheet; `build` names one of its other builds. */
  | { kind: 'bulma'; build: string | null; version: string | null }
  | { kind: 'font-awesome'; major: number | null; kit: boolean }
  /** `name` is the package, as the URL spells it (`bulma-carousel`). */
  | { kind: 'bulma-extension'; name: string }
  | { kind: 'jquery' }
  | {
      kind: 'webfont';
      icons: 'material-icons' | 'material-symbols' | null;
    }
  | { kind: 'stylesheet' }
  | { kind: 'script' };

/** A URL's path, without its query and fragment. */
function pathOf(url: string): string {
  return url.trim().replace(/[?#].*$/, '');
}

function hostOf(url: string): string | null {
  return url.trim().match(/^(?:[a-z][a-z\d+.-]*:)?\/\/([^/?#]+)/i)?.[1] ?? null;
}

/**
 * Bulma's own stylesheets: the standard one, and the other builds Bulma 1
 * ships under `css/versions/` and Bulma 0.9 shipped beside it (`bulma-rtl`).
 */
const BULMA_BUILD =
  /(?:^|[/\\])bulma(?:-(rtl|no-dark-mode|no-helpers-prefixed|no-helpers|prefixed))?(?:\.min)?\.css$/i;

/** `bulma@0.9.4` (npm CDNs) and `bulma/0.9.4/` (cdnjs). */
const BULMA_VERSION = /(?:^|[/@])bulma(?:@|\/)v?(\d+(?:\.\d+){0,2})(?=\/|$)/i;

const FONT_AWESOME = /font-?awesome/i;
const FONT_AWESOME_MAJOR = [
  /(?:fontawesome-(?:free|pro)|font-awesome)(?:@|\/)v?(\d+)/i,
  /fontawesome\.com\/releases\/v(\d+)/i,
];
const FONT_AWESOME_KIT = /(?:^|\/\/)kit\.fontawesome\.com\//i;

/** A package whose name starts `bulma-`, as a path segment or a file. */
const EXTENSION =
  /(?:^|[/\\])((?:@creativebulma\/)?bulma-[a-z\d]+(?:-[a-z\d]+)*)(?=@|[/\\]|(?:\.min)?\.(?:css|js)$)/i;

/** jQuery itself, not a plugin: `jquery-3.7.1.min.js`, `jquery@3`. */
const JQUERY =
  /(?:^|[/\\])jquery(?:-\d+(?:\.\d+)*)?(?:\.slim)?(?:\.min)?\.js$|(?:^|\/)jquery@[\d.]+$/i;

/** Hosts that serve a web font's stylesheet. */
const WEBFONT_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.bunny.net',
  'use.typekit.net',
  'fonts.cdnfonts.com',
  'api.fontshare.com',
]);

export function classifyAsset(url: string, loads: Loads): Asset {
  const urlPath = pathOf(url);
  if (loads === 'stylesheet') {
    const build = BULMA_BUILD.exec(urlPath);
    if (build) {
      return {
        kind: 'bulma',
        build: build[1]?.toLowerCase() ?? null,
        version: BULMA_VERSION.exec(urlPath)?.[1] ?? null,
      };
    }
  }
  if (FONT_AWESOME.test(url)) {
    const major = FONT_AWESOME_MAJOR.map(pattern => pattern.exec(urlPath)).find(
      Boolean
    )?.[1];
    return {
      kind: 'font-awesome',
      major: major === undefined ? null : Number(major),
      kit: FONT_AWESOME_KIT.test(url.trim()),
    };
  }
  const extension = EXTENSION.exec(urlPath)?.[1];
  if (extension) return { kind: 'bulma-extension', name: extension };
  if (loads === 'script') {
    return JQUERY.test(urlPath) ? { kind: 'jquery' } : { kind: 'script' };
  }
  const host = hostOf(url)?.toLowerCase();
  if (host && WEBFONT_HOSTS.has(host)) {
    let family = url.replace(/\+/g, ' ');
    try {
      family = decodeURIComponent(family);
    } catch {
      // A malformed escape: read the families as written.
    }
    return {
      kind: 'webfont',
      icons: /family=Material Symbols/i.test(family)
        ? 'material-symbols'
        : /family=Material Icons/i.test(family)
          ? 'material-icons'
          : null,
    };
  }
  return { kind: 'stylesheet' };
}

// ---- Bulma's stylesheet ------------------------------------------------------

export const GUIDE_0_9_TO_1 =
  'https://bestax.io/docs/guides/getting-started/migration/bulma-0-9-to-1';

/** Whether a version Bulma's URL names is older than 1. */
function preV1(version: string): boolean {
  return Number(version.split('.')[0]) < 1;
}

/** A primary color class: `is-primary`, `has-text-primary-dark`, … */
export const PRIMARY_CLASS = /^(?:is|has-text|has-background)-primary(?:-|$)/;

export interface BulmaFacts {
  /** The URL, as the TODO quotes it. */
  quoted: string;
  version: string | null;
  css: CssMode;
  /** Whether the page's markup has a primary color class. */
  usesPrimary: boolean;
  /** Whether the page's module goes into a Next.js app. */
  nextjs?: boolean;
}

/**
 * What a page's link to Bulma's standard stylesheet leaves to do. Under
 * `keep` it is only reported. Under `bestax` and `bulma` the module imports
 * the stylesheet in its place, so what is left is the move to Bulma 1 (for a
 * page made for an older one, or one whose URL doesn't say) and, under
 * `bestax`, its primary color: nothing at all for a Bulma 1 page with no
 * primary class, which then has no note. A Next.js app is the exception: its
 * Pages Router takes a global stylesheet only in `pages/_app`, so there the
 * module imports none, and the note says where it goes.
 */
export function bulmaStylesheetMessage(facts: BulmaFacts): string | null {
  const { quoted, version, css, usesPrimary, nextjs = false } = facts;
  const named = version === null ? 'Bulma' : `Bulma ${version}`;
  if (css === 'keep') {
    return `the page loads ${named} from \`${quoted}\`, and a component doesn't: load Bulma once for the app, from its entry (\`import 'bulma/css/bulma.min.css'\`, with \`bulma${version === null ? '' : `@${version}`}\` installed) or a \`<link>\` in its index.html`;
  }
  const said: string[] = [];
  if (version === null) {
    said.push(
      `the URL doesn't say which Bulma it is, so if it predates Bulma 1, read the Bulma 0.9 to 1 guide (${GUIDE_0_9_TO_1}) for what changed`
    );
  } else if (preV1(version)) {
    said.push(
      `the page was made for ${named}, so read the Bulma 0.9 to 1 guide (${GUIDE_0_9_TO_1}) for what changed`
    );
  }
  if (css === 'bestax' && usesPrimary) {
    said.push(
      "bestax's bundle builds Bulma with bestax blue as its primary, so the page's primary colors (`is-primary` and its kind) turn from Bulma's turquoise to blue: to keep them, set the `--bulma-primary-*` variables, `--bulma-primary-invert-l` among them (the bestax-migrate skill's `references/css-migration.md` says which), or use `--css bulma`"
    );
  }
  if (nextjs) {
    const target =
      css === 'bestax'
        ? "`import '@allxsmith/bestax-bulma/bestax.css'`"
        : "`import 'bulma/css/bulma.min.css'` (with `bulma` in package.json) and `import '@allxsmith/bestax-bulma/extras.css'`";
    return [
      `the page loads ${named} from \`${quoted}\`, and in a Next.js app a global stylesheet is imported once, from the root layout (App Router) or \`pages/_app\` (Pages Router, which takes one nowhere else), so the module imports none: write ${target} there`,
      ...said,
    ].join('; and ');
  }
  if (said.length === 0) return null;
  const imported =
    css === 'bestax'
      ? "the module imports bestax's bundle in its place (`@allxsmith/bestax-bulma/bestax.css`), which is Bulma 1 with bestax's extras"
      : "the module imports Bulma's stylesheet in its place (`bulma/css/bulma.min.css`, with bestax's `extras.css`), and `--css bulma` moves the app to Bulma 1";
  return `the page loaded ${named} from \`${quoted}\`, and ${imported}: ${said.join('; and ')}`;
}

/**
 * A link to Bulma's stylesheet for some media only (`print`), which an
 * import, applying to every medium, can't stand for.
 */
export function bulmaMediaMessage(
  quoted: string,
  version: string | null,
  media: string
): string {
  const named = version === null ? 'Bulma' : `Bulma ${version}`;
  return `the page loads ${named} from \`${quoted}\` for \`media="${media}"\` only, and a component doesn't: load it once for the app from a \`<link>\` in its index.html with the same \`media\`; the codemod writes an import only for a link with no media query, since an import applies to every medium`;
}

/** One of Bulma's other builds, which no `--css` mode imports for the page. */
export function bulmaBuildMessage(build: string, quoted: string): string {
  return `the page loads Bulma's \`${build}\` build from \`${quoted}\`, and a component doesn't: load it once for the app, from its entry or a \`<link>\` in its index.html; the codemod writes an import only for Bulma's standard stylesheet (bestax's own builds, Bulma with its extras, are under \`@allxsmith/bestax-bulma/versions/\`)`;
}

// ---- Font Awesome ------------------------------------------------------------

const ICON_LOADS_NO_FONT = "bestax's `Icon` loads no font of its own";
/** Where the older names that draw another glyph in 6 and 7 are listed. */
const OLDER_NAMES =
  "the bestax-icons skill's `references/icon-libraries.md` names the older names that draw another glyph in 6 and 7";
const INSTALL_FONT_AWESOME = `install \`@fortawesome/fontawesome-free\` (bestax-bulma's optional peer range is \`${FONT_AWESOME_PEER_RANGE}\`) and import its \`css/all.min.css\` from the app's entry`;

export function fontAwesomeMessage(
  asset: Extract<Asset, { kind: 'font-awesome' }>,
  quoted: string
): string {
  const { major, kit } = asset;
  if (kit) {
    return `the page loads a Font Awesome kit from \`${quoted}\`, whose version the URL doesn't say: ${ICON_LOADS_NO_FONT}, so keep loading the kit once for the app, from its index.html, or ${INSTALL_FONT_AWESOME}`;
  }
  if (major === null) {
    return `the page loads Font Awesome from \`${quoted}\`, whose version the URL doesn't say: ${ICON_LOADS_NO_FONT} and writes the classes Font Awesome 5 and later read (\`fas fa-<name>\`), so keep loading it once for the app, or ${INSTALL_FONT_AWESOME}, with \`css/v4-shims.min.css\` beside it if the page's names are Font Awesome 4's (\`fa fa-<name>\`); ${OLDER_NAMES}`;
  }
  const loads = `the page loads Font Awesome ${major} from \`${quoted}\``;
  if (major <= 4) {
    return `${loads}, whose classes are \`fa fa-<name>\`: the codemod keeps that \`fa\` on each icon it converts (\`variant="fa"\`), which ${major} styles, but bestax's \`Icon\` given no \`variant\` writes \`fas fa-<name>\`, which ${major} doesn't, so for icons written from here on, ${INSTALL_FONT_AWESOME}, then either import \`css/v4-shims.min.css\` beside it, so the page's ${major} names keep working, or move them to the current names: \`fa-envelope-o\` is \`envelope\` with \`variant="regular"\`, and a brand's glyph (\`fa fa-github\`) needs \`variant="brands"\`, since 5 and later draw brands in a style of their own, and show a missing-glyph box for one under \`fa\` without the shims`;
  }
  if (major === 5) {
    return `${loads}: ${ICON_LOADS_NO_FONT} and writes the \`fas fa-<name>\` classes 5 reads, so the \`<link>\` keeps working from the app's index.html; installed from npm, \`@fortawesome/fontawesome-free\` takes 6 or 7 (bestax-bulma's optional peer range is \`${FONT_AWESOME_PEER_RANGE}\`, and an older one fails \`npm install\` with ERESOLVE), which still read 5's names, many of them since renamed (\`search\` is \`magnifying-glass\`), but turned the handsets round: to keep the glyph the page shows, write 5's \`phone\` and \`phone-square\` as \`phone-flip\` and \`square-phone-flip\`, and 5's \`phone-alt\` and \`phone-square-alt\` as \`phone\` and \`square-phone\``;
  }
  if (major <= 7) {
    return `${loads}: ${ICON_LOADS_NO_FONT}, so keep loading it once for the app, from a \`<link>\` in its index.html, or ${INSTALL_FONT_AWESOME}`;
  }
  return `${loads}: ${ICON_LOADS_NO_FONT}, and bestax-bulma's optional peer range for it is \`${FONT_AWESOME_PEER_RANGE}\`, so keep loading this one from a \`<link>\` in the app's index.html, where no peer range applies`;
}

// ---- Bulma extensions --------------------------------------------------------

/**
 * The extensions bestax has a component for, by package (a scoped one by its
 * name alone), with the component that does what the extension did.
 */
export const EXTENSION_COMPONENTS: Readonly<Record<string, string>> = {
  'bulma-accordion': '`Collapses`, with a `Collapse` for each item',
  'bulma-badge': '`Badge`',
  'bulma-calendar':
    '`DateInput` (and `TimeInput`, `DateTimeInput` and `DateRangeInput`)',
  'bulma-carousel': '`Carousel`, with a `CarouselItem` for each slide',
  'bulma-checkradio': '`Checkbox` and `Radio`, which draw their own box',
  'bulma-collapsible': '`Collapse` (`Collapses` for an accordion)',
  'bulma-pageloader': '`Loading` (`isFullPage` for one over the whole page)',
  'bulma-quickview': '`Sidebar`',
  'bulma-slider': '`Slider`',
  'bulma-steps': '`Steps`',
  'bulma-switch': '`Switch`',
  'bulma-tagsinput': '`Taginput`',
  'bulma-timeline': '`Timeline`',
  'bulma-toast':
    '`Toast` (`toast.show()` from code, with a `ToastContainer` rendered once)',
  'bulma-tooltip': '`Tooltip`',
};

export function extensionMessage(
  name: string,
  quoted: string[],
  loads: ReadonlySet<Loads>,
  css: CssMode
): string {
  const from = `from ${quoted.map(url => `\`${url}\``).join(' and ')}`;
  const bare = name.replace(/^@[^/]+\//, '').toLowerCase();
  if (bare === 'bulma-social') {
    return `the page loads bulma-social, a Bulma extension for brand-colored buttons, ${from}, and bestax has no component for it: keep loading it once for the app (\`bulma-social\` from npm, imported from its entry, or the \`<link>\` in its index.html), since its classes (\`is-twitter\`, \`is-github\` and the rest) style Bulma's \`.button\`, which bestax's \`Button\` renders, so they go on \`Button\` through \`className\``;
  }
  if (bare === 'bulma-extensions') {
    return `the page loads bulma-extensions, a bundle of Bulma extensions, ${from}: bestax has components for several of them (the bestax-migrate skill's \`references/bulma-classes/unmappables.md\` lists which), so render those in place of the extensions' markup and scripts, and keep loading the bundle only while the app still uses one bestax has no component for`;
  }
  const component = EXTENSION_COMPONENTS[bare];
  if (component) {
    return `the page loads ${name}, a Bulma extension, ${from}, and bestax has a component for what it does: ${component}, whose styles ship in bestax's \`extras.css\` and \`bestax.css\`; render that in place of the extension's markup${loads.has('script') ? ' and script' : ''}, and stop loading the extension once nothing the app keeps uses its classes`;
  }
  return `the page loads ${name}, a Bulma extension, ${from}, and a component doesn't: keep loading it once for the app (from npm, imported from its entry, or a \`<link>\` in its index.html) while the page's markup uses its classes, which go on bestax's components through \`className\`${css === 'keep' ? '' : ', and check it works with Bulma 1, which an extension can predate'}`;
}

// ---- Everything else ---------------------------------------------------------

export function jqueryMessage(quoted: string): string {
  return `the page loads jQuery from \`${quoted}\`, and a component runs no page scripts: React renders the page now, so what the page's scripts did with jQuery (toggling classes, handlers, showing and hiding) becomes state and event props in the component; load jQuery in the app only if a library the app keeps still needs it`;
}

export function webfontMessage(
  asset: Extract<Asset, { kind: 'webfont' }>,
  quoted: string
): string {
  if (asset.icons !== null) {
    const name =
      asset.icons === 'material-icons'
        ? "Google's Material Icons"
        : "Google's Material Symbols";
    return `the page loads ${name}, an icon font, from \`${quoted}\`: bestax's \`Icon\` writes its classes with \`library="${asset.icons}"\` and loads no font of its own, so keep the \`<link>\` in the app's index.html, or install the \`${asset.icons}\` package and import its stylesheet from the entry`;
  }
  return `the page loads a web font's stylesheet from \`${quoted}\`, and a component doesn't: keep the \`<link>\` in the app's index.html, with the preconnects that go with it, or self-host the font and import it from the app's entry`;
}

/** Where a stylesheet or script is, read beside the page. */
export type Place = 'beside' | 'missing' | 'elsewhere';

/**
 * The relative URLs in a stylesheet of the page's own (its `url()`s and
 * `@import`s), which resolve against the stylesheet's folder rather than the
 * page's, as its TODO names them: each list already quoted and in backticks.
 */
export interface StylesheetUrls {
  /** The stylesheet's folder, from the page's, or null for the page's own. */
  folder: string | null;
  /** The URLs as they are written. */
  written: string;
  /** The ones inside the page's folder, from the site root, or null if none is. */
  fromRoot: string | null;
}

export function stylesheetMessage(
  quoted: string,
  place: Place,
  target: string,
  urls?: StylesheetUrls
): string {
  if (place === 'beside') {
    // Beside the page is inside its folder, so this never climbs out of it.
    const specifier = `./${target.replace(/^(?:\.\/)+/, '')}`;
    const moved = urls
      ? `; the relative URLs in it (${urls.written}) resolve against ${urls.folder === null ? "the stylesheet's folder, the page's" : `\`${urls.folder}/\`, the stylesheet's folder`}, so moving its rules into the app's stylesheet (such as \`src/index.css\`) means rewriting each against that file's folder, or copying the files into the app's \`public/\` folder and pointing at them from the site root${urls.fromRoot === null ? '' : ` (${urls.fromRoot})`}`
      : '';
    return `the page's own stylesheet \`${quoted}\` is beside it, and a component doesn't load it: import it once for the app, in the order the page loads it, so its rules still win over Bulma's where they did (a module beside the page imports it as \`${specifier}\`), or move its rules into the app's stylesheet${moved}`;
  }
  // Only what the page's folder shows: a `<base href>` may have sent the
  // browser somewhere else, so nothing here says the page never loaded it.
  if (place === 'missing') {
    return `the page loads the stylesheet \`${quoted}\`, which isn't beside the page (no \`${target}\` in its folder): load the stylesheet it meant once for the app, or drop it`;
  }
  return `the page loads the stylesheet \`${quoted}\`, and a component doesn't: load it once for the app, from its entry or a \`<link>\` in its index.html`;
}

export function scriptMessage(
  quoted: string,
  place: Place,
  target: string
): string {
  if (place === 'beside') {
    return `the page's own script \`${quoted}\` is beside it, and a component runs no page scripts: port what it does into the component (state, effects, event handlers); its code is still in \`${target}\``;
  }
  if (place === 'missing') {
    return `the page loads the script \`${quoted}\`, which isn't beside the page (no \`${target}\` in its folder): find the one it meant and port what it does into the component, or drop it`;
  }
  return `the page loads the script \`${quoted}\`, and a component runs no page scripts: load it in the app if the app still needs it, or replace what it does with React code`;
}
