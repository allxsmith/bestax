/**
 * A Bulma HTML page → a React module, written beside it.
 *
 * The page is parsed the way a browser builds it (`_shared/html/`), its body
 * becomes the JSX a component returns, laid out with Bulma's displays so the
 * whitespace beside a block, flex or grid box goes, and then the bulma-classes
 * transform runs on that module unchanged, so the HTML converts exactly as
 * the same markup written as JSX would. A number attribute on a plain element
 * is written as a number last, since the planner reads attributes as strings.
 *
 * What a component can't carry becomes a `TODO(bestax-migrate)` line and a
 * report entry under the `html-*` rules (`html-rules.ts`): the head, the
 * `<html>` and `<body>` attributes, scripts (dropped, since a component runs
 * none; their code stays in the page), the stylesheets and scripts it loads
 * (`html-assets.ts` says what each is), and what the converter couldn't
 * write as it was. Document-level ones sit above the component, the rest
 * above its `return`, where the planner's own go. A report entry names the
 * page and its line, never the module's.
 *
 * Under `--css bestax` or `--css bulma` the page's link to Bulma's stylesheet
 * becomes `import 'bulma/css/bulma.min.css'` at the top of the module, which
 * the transform's stylesheet pass then retargets exactly as it would in a JSX
 * file, so the CLI's manifest step reads the module the same way too.
 *
 * Nothing is ever overwritten: a module already beside the page stops it
 * (`html-file:exists`), so a second run changes nothing, and the page itself
 * stays as it was. A page with no Bulma component class writes nothing (a
 * Vite `index.html` is a page like any other), and a server template
 * (`{{`, `{%`, `<?php`, `<%`) is refused rather than read as HTML.
 */

import fs from 'node:fs';
import path from 'node:path';
import type {
  CssMode,
  HtmlResult,
  TodoCollector,
  TodoEntry,
  TransformOptions,
} from '../../types.js';
import { makeApi, runTransform } from '../../runner.js';
import { isNumberProp, numberLiteral } from '../_shared/html/attributes.js';
import { emitJsx, type Reported } from '../_shared/html/emit.js';
import {
  childrenOf,
  isElement,
  isText,
  parseHtml,
  type ChildNode,
  type CommentNode,
  type Element,
  type ParentNode,
  type ParsedHtml,
} from '../_shared/html/parse.js';
import {
  boxOfDisplay,
  uaDisplay,
  validInlineDisplay,
  type DisplayOf,
  type Inner,
} from '../_shared/html/whitespace.js';
import { flaggableRoot } from './class-map.js';
import { bulmaDisplay, bulmaOutOfFlow, HELPER_DISPLAY } from './display.js';
import {
  bulmaBuildMessage,
  bulmaMediaMessage,
  bulmaStylesheetMessage,
  classifyAsset,
  extensionMessage,
  fontAwesomeMessage,
  jqueryMessage,
  PRIMARY_CLASS,
  scriptMessage,
  stylesheetMessage,
  webfontMessage,
  type Asset,
  type Loads,
  type Place,
} from './html-assets.js';
import {
  htmlRuleId,
  NAVBAR_FIXED_CLASSES,
  THEME_CLASSES,
} from './html-rules.js';
import { inNextApp, writesTypeScript } from './project.js';
import transform, { FILE_RULES } from './transform.js';

const HTML_NS = 'http://www.w3.org/1999/xhtml';

function attributeOf(element: Element, name: string): string | undefined {
  return element.attrs.find(attr => attr.name === name && !attr.prefix)?.value;
}

function classesOf(element: Element): string[] {
  return (attributeOf(element, 'class') ?? '')
    .split(/[ \t\n\f\r]+/)
    .filter(Boolean);
}

function textContent(node: ParentNode): string {
  return childrenOf(node)
    .map(child =>
      isText(child) ? child.value : isElement(child) ? textContent(child) : ''
    )
    .join('');
}

function quote(text: string, limit = 60): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > limit ? `${flat.slice(0, limit - 1)}…` : flat;
}

// ---- Display --------------------------------------------------------------

const INLINE_FORM: Readonly<Record<Inner, string>> = {
  inline: 'inline',
  block: 'inline-block',
  boxes: 'inline-flex',
};
const BLOCK_FORM: Readonly<Record<Inner, string>> = {
  inline: 'block',
  block: 'block',
  boxes: 'flex',
};

/**
 * One display that keeps every run of whitespace any of `displays` would.
 * An inline box keeps the runs beside it, `none` (or a box out of the flow)
 * leaves them to what is past it, and a block drops them, so the result sits
 * inline if any of them does, and is no box if any is, before it is a block.
 * Inside, flowing on the line keeps the most and laying children out as boxes
 * the least.
 */
export function keepingMost(displays: ReadonlySet<string>): string {
  if (displays.size === 1) return [...displays][0];
  const boxes = [...displays].map(boxOfDisplay);
  const shown = boxes.filter(box => box.outer !== 'none');
  const inner: Inner = shown.some(box => box.inner === 'inline')
    ? 'inline'
    : shown.some(box => box.inner === 'block')
      ? 'block'
      : 'boxes';
  if (shown.some(box => box.outer === 'inline')) return INLINE_FORM[inner];
  if (shown.length < boxes.length) return 'none';
  return BLOCK_FORM[inner];
}

/**
 * An element's display on a Bulma page: its inline `style`'s when CSS reads
 * it, else what Bulma's classes give it at each viewport (its tag's own where
 * no rule reaches), else its tag's own. Bulma's display helpers are
 * `!important`, so beside one an inline display is one case among theirs.
 * A box Bulma takes out of the flow is beside nothing, so `none` counts too.
 * Where the cases differ, the one display kept is the one that keeps every
 * run any of them would (`keepingMost`): whitespace beside an element goes
 * only when every case drops it.
 *
 * The page's own stylesheets are out of reach, as they are for the
 * converter: a class of the page's that changes a display is the limit.
 */
export const pageDisplayOf: DisplayOf = element => {
  const classes = classesOf(element);
  const tagDisplay = uaDisplay(element) ?? 'inline';
  const bulma = [...(bulmaDisplay(element.tagName, classes) ?? [])].map(
    display => display ?? tagDisplay
  );
  const inline = validInlineDisplay(element);
  const displays = new Set<string>();
  if (inline !== undefined) {
    displays.add(inline);
    if (classes.some(token => `.${token}` in HELPER_DISPLAY)) {
      for (const display of bulma) displays.add(display);
    }
  } else if (bulma.length > 0) {
    for (const display of bulma) displays.add(display);
  } else {
    displays.add(tagDisplay);
  }
  if (bulmaOutOfFlow(classes)) displays.add('none');
  return keepingMost(displays);
};

// ---- Naming and placing the module -----------------------------------------

/** A page's name with nothing but its words, as a component's name. */
function pageName(named: string): string {
  const words = named.split(/[^\p{L}\p{Nd}]+/u).filter(Boolean);
  const pascal = words
    .map(word => {
      const [first, ...rest] = [...word];
      return first.toUpperCase() + rest.join('');
    })
    .join('');
  let name: string;
  if (/^\p{Nd}/u.test(pascal)) name = `Page${pascal}`;
  else if (pascal.endsWith('Page')) name = pascal;
  else name = `${pascal}Page`;
  return /^[\p{ID_Start}$_][\p{ID_Continue}$]*$/u.test(name) ? name : 'Page';
}

const HOME = 'HomePage';

/**
 * The component a page becomes: its file's name in PascalCase and `Page`, so
 * `hero.html` can't shadow bestax's `Hero`. A name starting with a digit
 * starts with `Page` instead (`404.html` is `Page404`), and one with nothing
 * to go by is `Page`. An `index.html` is named after its folder, which is
 * what tells `docs/index.html` from `blog/index.html`, but for the site's home
 * page: the `index.html` in a folder the run starts from (`roots`, the
 * project's `runRoots`), with other pages beside it and none of them named
 * `HomePage` already. Another spelling of the index beside it (`index.htm`)
 * is no other page: it only competes for the name, and an `index.html` wins
 * it, so one folder writes one `HomePage`. Only that page's folder is read
 * for the pages beside it.
 */
export function componentName(file: string, roots?: unknown): string {
  const stem = path.basename(file, path.extname(file));
  if (!/^index$/i.test(stem)) return pageName(stem);
  const dir = path.dirname(path.resolve(file));
  const atRoot = Array.isArray(roots) && roots.includes(dir);
  const beside = atRoot ? pagesBeside(file) : [];
  const rivals = beside.filter(isIndexPage);
  const pages = beside.filter(sibling => !isIndexPage(sibling));
  const own = indexRank(path.basename(file));
  const home =
    pages.length > 0 &&
    pages.every(
      page => pageName(path.basename(page, path.extname(page))) !== HOME
    ) &&
    rivals.every(rival => indexRank(rival) > own);
  return home ? HOME : pageName(path.basename(dir));
}

/** Whether a page beside another is its folder's index, by another spelling. */
function isIndexPage(name: string): boolean {
  return /^index\.html?$/i.test(name);
}

/** Which of a folder's index pages is its home: `.html` first, then by name. */
function indexRank(name: string): string {
  return `${path.extname(name).toLowerCase() === '.html' ? 0 : 1}${name}`;
}

/** The other HTML pages in a page's folder, by file name. */
export function pagesBeside(file: string): string[] {
  const dir = path.dirname(path.resolve(file));
  let names: string[];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const own = path.basename(file);
  const isPage = (name: string) => {
    try {
      return fs.statSync(path.join(dir, name)).isFile();
    } catch {
      return false;
    }
  };
  return names
    .filter(name => name !== own && /\.html?$/i.test(name) && isPage(name))
    .sort();
}

/**
 * Where a page's module goes: beside it, `.tsx` when the package around it is
 * TypeScript (a tsconfig, or a dependency on `typescript`), `.jsx` otherwise.
 */
export function outputPathFor(
  file: string,
  options: TransformOptions = {}
): string {
  const extension = writesTypeScript(file, options.packageLanguages)
    ? '.tsx'
    : '.jsx';
  return path.join(
    path.dirname(file),
    `${path.basename(file, path.extname(file))}${extension}`
  );
}

// ---- What the page is ------------------------------------------------------

/** The first element in the content with a class bestax has a component for. */
function firstBulmaElement(root: ParentNode): Element | undefined {
  for (const child of childrenOf(root)) {
    if (!isElement(child)) continue;
    if (classesOf(child).some(token => flaggableRoot(token))) return child;
    const inner = firstBulmaElement(child);
    if (inner) return inner;
  }
  return undefined;
}

/** Server-template syntax: Handlebars, Jinja, Liquid, PHP, ERB and EJS. */
const TEMPLATE_SYNTAX = /\{\{|\{%|<\?(?:php\b|=)|<%/i;

function lineAt(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

/**
 * For a page a folder walk found but left out: whether to say so. `-e`
 * matches an extension exactly, as it does for every other file, so the
 * advice names the page's own (`-e html` takes no `.htm` page).
 */
export function excludedHtml(file: string, source: string): TodoEntry | null {
  const element = firstBulmaElement(parseHtml(source).root);
  if (!element) return null;
  const extension = path.extname(file).replace(/^\./, '');
  return {
    file,
    line: element.sourceCodeLocation?.startLine ?? null,
    rule: htmlRuleId('html-file', 'not-included'),
    message: `this page has Bulma classes the bulma-classes source converts, but a folder walk takes a page only when \`--extensions\` lists its extension, and it doesn't list \`${extension}\`: name the page, or add \`${extension}\` to \`--extensions\` (\`-e ${extension}\` for the pages alone)`,
  };
}

// ---- What a component can't carry -----------------------------------------

/** A report entry, and the TODO line it becomes. */
interface Note {
  rule: string;
  message: string;
  line: number | null;
  /** The last line of what it is about, for a range in the TODO line. */
  endLine?: number;
  /** Every line it is about, when there are several apart. */
  lines?: number[];
  /** A relative URL's value; those share one TODO line (`contentLines`). */
  url?: string;
}

interface Notes {
  /** Above the component: the head, `<html>` and `<body>`, scripts. */
  document: Note[];
  /** Above its `return`: the content. */
  content: Note[];
}

const JAVASCRIPT_TYPES =
  /^(?:|module|(?:text|application)\/(?:x-)?(?:javascript|ecmascript)|text\/(?:jscript|livescript)|text\/javascript1\.[0-5])$/i;

/** The patterns an inline script's code is looked over for, in order. */
const SCRIPT_PATTERNS: ReadonlyArray<readonly [string, RegExp, string]> = [
  [
    'burger',
    // Bulma 0.x's docs gave the burger a `burger` class beside its own.
    /navbar-burger|['"`][^'"`\n]*\.burger\b/,
    "toggles the navbar burger: bestax's `Navbar.Burger` takes `active` and `onClick`, and `Navbar.Menu` the same `active`, so keep the open state in `useState` and pass it to both",
  ],
  [
    'modal',
    /modal/,
    "opens or closes a modal: bestax's `Modal` shows while `active` is true and calls `onClose` from its background, its close button and Escape, so keep the open state in `useState`",
  ],
  [
    'dismiss',
    /['"`][^'"`\n]*\.delete\b/,
    "removes an element when its `.delete` is clicked: bestax's `Notification` takes `hasDelete` and `onDelete`, `Tag` takes `onDelete` and `Message` takes `onClose`, so keep whether it shows in state",
  ],
  [
    'carousel',
    /carousel/i,
    "drives a carousel: bestax's `Carousel` takes its slides as `CarouselItem` children and renders its own arrows and indicators (`autoplay` for a timed one); its styles ship in bestax's `extras.css` and `bestax.css`, not in Bulma's stylesheet",
  ],
  [
    'theme',
    /data-theme|dataset\.theme|theme-(?:dark|light)|prefers-color-scheme/,
    "switches Bulma's light and dark schemes: bestax's `Theme` writes `data-theme` on `<html>` from its `colorMode` (`light`, `dark` or `system`), so keep the choice in state, saved in `localStorage`, and pass it; `Theme` writes the attribute from an effect, after the first paint, so for a saved choice to paint first, keep a small inline script in the `<head>` of the app's index.html that reads it (or the OS's, with none saved) and writes `data-theme` before the app loads, and start the state from what that script wrote (the bestax-theming skill's `examples/dark-mode.tsx` has the script and the app's side)",
  ],
];

/**
 * The patterns a script beside the page is looked over for. A whole file is
 * more than one inline script, so only the ones that name what they drive.
 */
const LOCAL_SCRIPT_PATTERNS = SCRIPT_PATTERNS.filter(([token]) =>
  ['burger', 'carousel', 'theme'].includes(token)
);

/** Larger than this, a script beside the page is a bundle, not the page's. */
const LOCAL_SCRIPT_LIMIT = 256 * 1024;

const SCRIPT_KEPT =
  "it was dropped, since a component doesn't run a page's scripts, and its code is still in the page";

/** A stylesheet or script the page loads, before it becomes a note. */
interface AssetLoad {
  url: string;
  loads: Loads;
  line: number | null;
  /** A stylesheet's `media`, when it names one. */
  media?: string;
}

/** What the page's notes are read against. */
interface PageContext {
  /** The page's folder. */
  dir: string;
  css: CssMode;
  /** Whether its module goes into a Next.js app. */
  nextjs: boolean;
  /** The `<link>` and `<script src>` tags, in the page's order. */
  loads: AssetLoad[];
}

/** A `media` an import can't stand for: anything but every medium. */
function forSomeMedia(media: string | undefined): boolean {
  const query = media?.trim().toLowerCase() ?? '';
  return query !== '' && query !== 'all';
}

function scriptNotes(script: Element, page: PageContext): Note[] {
  const location = script.sourceCodeLocation;
  const line = location?.startLine ?? null;
  const endLine = location?.endLine;
  const src = attributeOf(script, 'src');
  const type = (attributeOf(script, 'type') ?? '').trim().toLowerCase();
  // A browser loads a `src` only for a script of a JavaScript type; one of
  // any other type (a template, data) is the page's own text, not code.
  if (src !== undefined && JAVASCRIPT_TYPES.test(type)) {
    page.loads.push({ url: src, loads: 'script', line });
    return [];
  }
  const kept = src === undefined ? 'still in the page' : `in \`${quote(src)}\``;
  if (type === 'application/ld+json') {
    return [
      {
        rule: htmlRuleId('html-script', 'json-ld'),
        message: `structured data for search engines (JSON-LD) was dropped with the page's scripts: data about the whole site, or about a single-page app's one page, goes in the app's index.html as it is, where a crawler that runs no JavaScript still reads it, and data that differs from page to page goes where the app sets each page's head, as \`<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />\`; the JSON is ${kept}`,
        line,
        endLine,
      },
    ];
  }
  if (!JAVASCRIPT_TYPES.test(type)) {
    return [
      {
        rule: htmlRuleId('html-script'),
        message: `a \`<script type="${quote(type, 40)}">\` was dropped with the page's scripts: if the page's code reads it (a template, data), move what it holds into the component; it is ${kept}`,
        line,
        endLine,
      },
    ];
  }
  const code = textContent(script);
  const found = SCRIPT_PATTERNS.filter(([, pattern]) => pattern.test(code));
  if (found.length === 0) {
    return [
      {
        rule: htmlRuleId('html-script'),
        message: `an inline script was dropped, since a component doesn't run a page's scripts: port what it does into the component (state, effects, event handlers); its code is still in the page`,
        line,
        endLine,
      },
    ];
  }
  return found.map(([token, , recipe]) => ({
    rule: htmlRuleId('html-script', token),
    message: `an inline script ${recipe}; ${SCRIPT_KEPT}`,
    line,
    endLine,
  }));
}

/** Remove every `<script>` from the content, with a note for each. */
function dropScripts(
  parent: ParentNode,
  notes: Note[],
  page: PageContext
): void {
  const nodes = childrenOf(parent);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!isElement(node)) continue;
    if (node.tagName === 'script' && node.namespaceURI === HTML_NS) {
      notes.push(...scriptNotes(node, page));
      nodes.splice(i, 1);
      i--;
    } else if (node.tagName !== 'template') {
      dropScripts(node, notes, page);
    }
  }
}

// ---- Stylesheets and scripts it loads --------------------------------------

/** The import a page's Bulma `<link>` becomes, before `--css` retargets it. */
export const BULMA_IMPORT = 'import "bulma/css/bulma.min.css";';

/**
 * Where a relative URL points, read beside the page: a file there, nothing
 * there, or somewhere the page's folder can't say: any other URL, one a
 * `../` takes out of the page's folder (which isn't beside it, and isn't
 * the codemod's to open), and one whose path can't be read.
 */
function placeOf(url: string, dir: string): { place: Place; target: string } {
  const elsewhere = { place: 'elsewhere' as const, target: url };
  if (!isRelative(url)) return elsewhere;
  const target = urlPath(url);
  const file = path.resolve(dir, target);
  if (path.relative(dir, file).split(/[/\\]/)[0] === '..') return elsewhere;
  let stat: fs.Stats | undefined;
  try {
    stat = fs.statSync(file, { throwIfNoEntry: false });
  } catch {
    // A folder on the way that can't be searched (`EACCES`), say.
    return elsewhere;
  }
  return stat?.isFile()
    ? { place: 'beside', target }
    : { place: 'missing', target };
}

/**
 * A script beside the page, looked over the way an inline script is, for
 * the patterns that name what they drive. Null when it can't be read, is too
 * large to be the page's own, or shows none of them.
 */
function localScriptNotes(
  quoted: string,
  target: string,
  dir: string,
  line: number | null
): Note[] | null {
  let code: string;
  try {
    const file = path.resolve(dir, target);
    if (fs.statSync(file).size > LOCAL_SCRIPT_LIMIT) return null;
    code = fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
  const found = LOCAL_SCRIPT_PATTERNS.filter(([, pattern]) =>
    pattern.test(code)
  );
  if (found.length === 0) return null;
  return found.map(([token, , recipe]) => ({
    rule: htmlRuleId('html-script', token),
    message: `the page's script \`${quoted}\` ${recipe}; a component doesn't load it, and its code is still in \`${target}\``,
    line,
  }));
}

/** Whether the page's markup has a primary color class. */
function usesPrimary(root: ParentNode): boolean {
  return childrenOf(root).some(
    child =>
      isElement(child) &&
      (classesOf(child).some(token => PRIMARY_CLASS.test(token)) ||
        usesPrimary(child))
  );
}

/**
 * The stylesheets and scripts the page loads, as notes: one for each, but
 * one for an extension's stylesheet and script together, since they are one
 * thing to replace. Under `--css bestax` or `--css bulma`, Bulma's standard
 * stylesheet becomes an import in the module (`importsBulma`), which the
 * transform then retargets as it would the same import in a JSX file, and is
 * noted only for what that leaves to do. Not for a link with a media query,
 * which an import can't stand for, nor in a Next.js app, which takes a
 * global stylesheet only in its root layout or `pages/_app`.
 */
function assetNotes(
  page: PageContext,
  root: ParentNode
): { notes: Note[]; importsBulma: boolean } {
  const notes: Note[] = [];
  const shared = new Map<string, { asset: Asset; loads: AssetLoad[] }>();
  const note = (rule: string, message: string, line: number | null) =>
    notes.push({ rule, message, line });
  for (const load of page.loads) {
    const asset = classifyAsset(load.url, load.loads);
    const quoted = quote(load.url);
    if (
      asset.kind === 'bulma' &&
      asset.build === null &&
      forSomeMedia(load.media)
    ) {
      note(
        htmlRuleId('html-asset', 'bulma'),
        bulmaMediaMessage(quoted, asset.version, quote(load.media!, 40)),
        load.line
      );
      continue;
    }
    const key =
      asset.kind === 'bulma-extension'
        ? `extension:${asset.name.toLowerCase()}`
        : asset.kind === 'bulma' && asset.build === null
          ? 'bulma'
          : null;
    if (key !== null) {
      const group = shared.get(key);
      if (group) group.loads.push(load);
      else shared.set(key, { asset, loads: [load] });
      continue;
    }
    switch (asset.kind) {
      case 'bulma':
        note(
          htmlRuleId('html-asset', 'bulma'),
          bulmaBuildMessage(asset.build!, quoted),
          load.line
        );
        break;
      case 'font-awesome':
        note(
          htmlRuleId('html-asset', 'font-awesome'),
          fontAwesomeMessage(asset, quoted),
          load.line
        );
        break;
      case 'jquery':
        note(
          htmlRuleId('html-asset', 'jquery'),
          jqueryMessage(quoted),
          load.line
        );
        break;
      case 'webfont':
        note(
          htmlRuleId('html-asset', 'webfont'),
          webfontMessage(asset, quoted),
          load.line
        );
        break;
      case 'stylesheet': {
        const { place, target } = placeOf(load.url, page.dir);
        note(
          htmlRuleId('html-asset', 'stylesheet'),
          stylesheetMessage(quoted, place, quote(target)),
          load.line
        );
        break;
      }
      case 'script': {
        const { place, target } = placeOf(load.url, page.dir);
        const local =
          place === 'beside'
            ? localScriptNotes(quoted, target, page.dir, load.line)
            : null;
        if (local) notes.push(...local);
        else {
          note(
            htmlRuleId('html-asset', 'script'),
            scriptMessage(quoted, place, quote(target)),
            load.line
          );
        }
        break;
      }
    }
  }
  let importsBulma = false;
  for (const { asset, loads } of shared.values()) {
    const lines = [
      ...new Set(
        loads.flatMap(load => (load.line === null ? [] : [load.line]))
      ),
    ];
    const quoted = [...new Set(loads.map(load => quote(load.url)))];
    let message: string | null;
    let rule: string;
    if (asset.kind === 'bulma') {
      rule = htmlRuleId('html-asset', 'bulma');
      importsBulma = page.css !== 'keep' && !page.nextjs;
      message = bulmaStylesheetMessage({
        quoted: quoted[0],
        version: asset.version,
        css: page.css,
        usesPrimary: usesPrimary(root),
        nextjs: page.nextjs,
      });
    } else {
      rule = htmlRuleId('html-asset', 'bulma-extension');
      message = extensionMessage(
        (asset as Extract<Asset, { kind: 'bulma-extension' }>).name,
        quoted,
        new Set(loads.map(load => load.loads)),
        page.css
      );
    }
    if (message === null) continue;
    notes.push({
      rule,
      message,
      line: loads[0].line,
      ...(lines.length > 1 ? { lines } : {}),
    });
  }
  return { notes, importsBulma };
}

/** A `<meta http-equiv>` that sets the page's Content Security Policy. */
function isCsp(meta: Element): boolean {
  return (
    (attributeOf(meta, 'http-equiv') ?? '').trim().toLowerCase() ===
    'content-security-policy'
  );
}

/** What a `<meta>` is for: its `name`, `property`, `http-equiv` or charset. */
function metaKind(meta: Element): string {
  if (attributeOf(meta, 'charset') !== undefined) return 'charset';
  return (
    attributeOf(meta, 'name') ??
    attributeOf(meta, 'property') ??
    attributeOf(meta, 'http-equiv') ??
    attributeOf(meta, 'itemprop') ??
    'meta'
  ).toLowerCase();
}

function listed(values: string[]): string {
  const unique = [...new Set(values.map(value => quote(value, 30)))];
  const shown = unique.slice(0, 6).join(', ');
  return unique.length > 6 ? `${shown}, …` : shown;
}

function headNotes(head: ChildNode[], notes: Note[], page: PageContext): void {
  const metas: Element[] = [];
  const links: Element[] = [];
  for (const node of head) {
    if (!isElement(node)) continue;
    const line = node.sourceCodeLocation?.startLine ?? null;
    const endLine = node.sourceCodeLocation?.endLine;
    switch (node.tagName) {
      case 'title':
        notes.push({
          rule: htmlRuleId('html-head', 'title'),
          message: `the page's \`<title>\` ("${quote(textContent(node))}") isn't part of a component: set it where the app sets each page's title (under React 19 a component can render \`<title>\` itself, and React moves it into the head)`,
          line,
        });
        break;
      case 'meta':
        if (isCsp(node)) {
          notes.push({
            rule: htmlRuleId('html-head', 'csp'),
            message:
              "the page's `<head>` sets a Content Security Policy in a `<meta http-equiv>`, which a component can't carry: it was written for what this page loads, and copied into the app's index.html as it is, it can block what the app loads instead (a Vite dev server runs an inline script for React's fast refresh and opens a socket for hot reloading, and the build serves the app's own scripts, styles and fonts), so write the app's own policy, best sent as a response header, and try it under both the dev server and the build",
            line,
            endLine,
          });
        } else {
          metas.push(node);
        }
        break;
      case 'link': {
        const rel = (attributeOf(node, 'rel') ?? '').toLowerCase().split(/\s+/);
        const href = attributeOf(node, 'href');
        if (rel.includes('stylesheet') && href !== undefined) {
          page.loads.push({
            url: href,
            loads: 'stylesheet',
            line,
            media: attributeOf(node, 'media'),
          });
        } else {
          links.push(node);
        }
        break;
      }
      case 'style':
        notes.push({
          rule: htmlRuleId('html-head', 'style'),
          message:
            "the page's `<head>` has a `<style>` block, which was dropped: move its rules into the app's stylesheet; they are still in the page",
          line,
          endLine,
        });
        break;
      case 'script':
        notes.push(...scriptNotes(node, page));
        break;
      case 'base':
        notes.push({
          rule: htmlRuleId('html-head', 'base'),
          message: `the page sets \`<base href="${quote(attributeOf(node, 'href') ?? '')}">\`, which changes how every relative URL on it resolves, and a component can't carry it: check the page's relative URLs resolve without it`,
          line,
        });
        break;
      default:
        notes.push({
          rule: htmlRuleId('html-head'),
          message: `the page's \`<head>\` has a \`<${node.tagName}>\`, which a component can't carry: move it into the app's index.html if the app needs it`,
          line,
        });
    }
  }
  if (metas.length > 0) {
    notes.push({
      rule: htmlRuleId('html-head', 'meta'),
      message: `the page's \`<head>\` has \`<meta>\` tags (${listed(metas.map(metaKind))}) that a component can't carry: the app's index.html holds charset and viewport once, and a page's own (a description, social cards) go where the app sets each page's head`,
      line: metas[0].sourceCodeLocation?.startLine ?? null,
    });
  }
  if (links.length > 0) {
    notes.push({
      rule: htmlRuleId('html-head', 'link'),
      message: `the page's \`<head>\` has \`<link>\` tags (${listed(
        links.map(link => attributeOf(link, 'rel') ?? 'link')
      )}) that a component can't carry: keep the app-wide ones (icons, preconnects, preloads) in the app's index.html, and a page's own (canonical) where the app sets each page's head`,
      line: links[0].sourceCodeLocation?.startLine ?? null,
    });
  }
}

/** Bulma's light and dark schemes, by `data-theme` value. */
const SCHEMES = new Set(['light', 'dark']);

/**
 * Where a page's scheme goes in the app: on its `<html>`, which the first
 * paint reads, since `Theme` writes the attribute from an effect, after it.
 */
const SCHEME_ON_HTML =
  "put it on the `<html>` in the app's index.html, where the first paint has it";
const SCHEME_TOGGLE =
  "for a scheme the visitor switches, bestax's `Theme colorMode` writes the choice only after that paint, so write a saved one before it too, as the `html-script:theme` recipe says and the bestax-theming skill's `examples/dark-mode.tsx` does";

function documentAttributeNotes(
  where: 'html' | 'body',
  element: Element | undefined,
  notes: Note[]
): void {
  if (!element) return;
  const location = element.sourceCodeLocation;
  const lineOf = (name: string) =>
    location?.attrs?.[name]?.startLine ?? location?.startLine ?? null;
  const other: string[] = [];
  for (const attr of element.attrs) {
    const name = attr.prefix ? `${attr.prefix}:${attr.name}` : attr.name;
    const value = attr.value;
    const line = lineOf(name);
    if (/^on./i.test(name)) {
      notes.push({
        rule: htmlRuleId('html-event', name.toLowerCase()),
        message: `the page's \`<${where} ${name}="${quote(value)}">\` runs code a component can't take as a string: port it into the component (an effect, for \`onload\`)`,
        line,
      });
      continue;
    }
    if (name === 'class') {
      for (const token of value.split(/[ \t\n\f\r]+/).filter(Boolean)) {
        if (NAVBAR_FIXED_CLASSES.includes(token)) {
          notes.push({
            rule: htmlRuleId('html-document', token),
            message: `the page's \`<${where}>\` has \`${token}\`, which Bulma reads to pad the page for a fixed navbar: put it on the \`<html>\` in the app's index.html, since bestax's \`Navbar\` adds no class there, whatever its \`fixed\` says`,
            line,
          });
        } else if (THEME_CLASSES.includes(token)) {
          notes.push({
            rule: htmlRuleId('html-document', token),
            message: `the page's \`<${where}>\` has \`${token}\`, which sets Bulma's ${token.slice(6)} scheme: ${SCHEME_ON_HTML}; ${SCHEME_TOGGLE}`,
            line,
          });
        } else {
          other.push(token);
        }
      }
      if (other.length > 0) {
        notes.push({
          rule: htmlRuleId('html-document', 'class'),
          message: `the page's \`<${where}>\` has classes a component can't carry (\`${quote(other.join(' '))}\`): put them on the app's own \`<${where}>\`, or on an element around this page's content`,
          line,
        });
      }
      continue;
    }
    if (name === 'data-theme') {
      const scheme = value.trim().toLowerCase();
      notes.push({
        rule: htmlRuleId('html-document', name),
        message: `the page's \`<${where}>\` has \`data-theme="${quote(value)}"\`, which sets Bulma's color scheme: ${SCHEME_ON_HTML}${
          SCHEMES.has(scheme) ? `; ${SCHEME_TOGGLE}` : ''
        }`,
        line,
      });
      continue;
    }
    if (where === 'html' && (name === 'lang' || name === 'dir')) {
      notes.push({
        rule: htmlRuleId('html-document', name),
        message: `the page's \`<html ${name}="${quote(value)}">\` belongs to the whole document, which a component can't reach: set it on the \`<html>\` in the app's index.html`,
        line,
      });
      continue;
    }
    notes.push({
      rule: htmlRuleId('html-document', name),
      message: `the page's \`<${where}>\` has \`${name}="${quote(value)}"\`, which a component can't carry: move it to the app's own \`<${where}>\`, or onto an element around this page's content`,
      line,
    });
  }
}

/**
 * React's own props, which no HTML attribute is spelled like. `classname`
 * and `htmlfor` aren't here: the attribute table reads them as `className`
 * and `htmlFor` already.
 */
const REACT_PROPS: readonly string[] = [
  'defaultValue',
  'defaultChecked',
  'dangerouslySetInnerHTML',
  'suppressContentEditableWarning',
  'suppressHydrationWarning',
];

/** HTML's old presentational attributes, whose work CSS does now. */
const PRESENTATIONAL: ReadonlySet<string> = new Set([
  'alink',
  'bgcolor',
  'bordercolor',
  'bottommargin',
  'charoff',
  'compact',
  'hspace',
  'leftmargin',
  'noshade',
  'nowrap',
  'rightmargin',
  'topmargin',
  'valign',
  'vlink',
  'vspace',
]);

/**
 * What to do about an attribute React has no prop for by that name: rename
 * one that is a React prop in the wrong case (`defaultvalue`, which HTML
 * never read), move a presentational one into CSS, and otherwise drop it or
 * say what reads it. Whether TypeScript takes it depends on the element
 * (React's types list `valign` on a `<td>` and not on a `<th>`), which a
 * report can't see, so no message claims either way.
 */
function unknownAttribute(token: string): { message: string } {
  const prop = REACT_PROPS.find(
    name => name.toLowerCase() === token.toLowerCase()
  );
  if (prop) {
    return {
      message: `\`${token}\` isn't an HTML attribute, so the page never read it, and it reads as React's \`${prop}\` in the wrong case: rename it to \`${prop}\`, or drop it if it isn't meant`,
    };
  }
  if (PRESENTATIONAL.has(token.toLowerCase())) {
    return {
      message: `\`${token}\` is an obsolete presentational attribute, which CSS replaced: write it as CSS or a class`,
    };
  }
  return {
    message: `\`${token}\` is written as it was, which React renders under that name: drop it if nothing reads it, make it a \`data-\` attribute if a script of the page's does, and if React's types don't list it on this element, declare it for a TypeScript build`,
  };
}

/** What the converter reports, as notes. */
function convertedNote(issue: Reported): Note {
  const line = issue.line;
  const token = issue.token;
  switch (issue.kind) {
    case 'event-handler':
      return {
        rule: htmlRuleId('html-event', token.toLowerCase()),
        message: `\`${token}="${quote(issue.detail ?? '')}"\` was dropped, since React takes a function rather than code in a string: port it into a handler passed as \`${issue.prop}\``,
        line,
      };
    case 'attribute-name':
      // A name with no letter or digit in it is no directive: it is a stray
      // character the browser read as an attribute (`<figure … \>`).
      if (!/[\p{L}\p{N}]/u.test(token)) {
        return {
          rule: htmlRuleId('html-attr', 'stray'),
          message: `\`${quote(token, 20)}\` in the tag is a stray character, a typo (such as \`\\>\` meant as \`/>\`) that the browser read as the name of an empty attribute: it was left out, so there is nothing to port, and it can go from the page too`,
          line,
        };
      }
      return {
        rule: htmlRuleId('html-attr', 'name'),
        message: `the attribute \`${token}\` was left out, since JSX can't write that name (a framework's directive, such as \`@click\` or \`:class\`, is code to port into the component), or the element already has it under another spelling`,
        line,
      };
    case 'ignored-attribute':
      return {
        rule: htmlRuleId('html-attr', 'ignored'),
        message: `\`${token}\` was left out: HTML gives a \`<${issue.detail}>\` no \`${token}\` attribute, so the browser ignored it, and React's types reject it there; there is nothing to port, unless a stylesheet or script of the page's selects on it`,
        line,
      };
    case 'unknown-attribute':
      return {
        rule: htmlRuleId('html-attr', 'unknown'),
        ...unknownAttribute(token),
        line,
      };
    case 'javascript-url':
      return {
        rule: htmlRuleId('html-url', 'javascript'),
        message: `a \`javascript:\` URL in \`${token}\` won't run: React 19 replaces one with a URL that throws, and React 18 warns; move the code into an \`onClick\` handler`,
        line,
      };
    case 'style':
      return {
        rule: htmlRuleId('html-attr', 'style'),
        message: `the declaration \`${quote(issue.detail ?? '')}\` in a \`style\` isn't CSS a browser reads, so it was left out, as a browser leaves it out: delete it, or rewrite it if it meant something`,
        line,
      };
    case 'style-important':
      return {
        rule: htmlRuleId('html-attr', 'important'),
        message: `\`${quote(issue.detail ?? token)}\` is written without its \`!important\`, since React sets a style without a priority: if a stylesheet rule beats it now, move it into a class in the app's stylesheet`,
        line,
      };
    case 'custom-element':
      return {
        rule: htmlRuleId('html-element', 'custom'),
        message: `\`<${token}>\` is a custom element: React renders it as written, but the script that defines it isn't loaded by this module, and a TypeScript build needs it declared in \`JSX.IntrinsicElements\``,
        line,
      };
    case 'obsolete-element':
      return {
        rule: htmlRuleId('html-element', 'obsolete'),
        message: `\`<${token}>\` is obsolete HTML: browsers still render it, but React's types list few of these, so a TypeScript build may reject it; replace it with current markup (a helper class such as \`has-text-centered\`, or CSS)`,
        line,
      };
    case 'unknown-element':
      return {
        rule: htmlRuleId('html-element', 'unknown'),
        message: `\`<${token}>\` isn't an HTML element: it renders as an unknown inline element, and a TypeScript build rejects it; replace it with the element it stands for`,
        line,
      };
    case 'template':
      return {
        rule: htmlRuleId('html-element', 'template'),
        message:
          '`<template>` holds markup for a script to clone, which React has no use for: render that markup from the component, where the script would have used it',
        line,
      };
    case 'element-name':
      return {
        rule: htmlRuleId('html-element', 'name'),
        message: `\`<${token}>\` has a name JSX can't write, so its children were written in its place: put back the element it stood for, if it mattered`,
        line,
      };
    case 'conditional-comment':
      return {
        rule: htmlRuleId('html-element', 'conditional-comment'),
        message:
          'an Internet Explorer conditional comment was dropped, since no browser React supports reads one: nothing to do unless the markup inside it matters',
        line,
      };
  }
}

/** Attributes holding a URL a browser resolves against the page's address. */
const URL_ATTRIBUTES = new Set([
  'href',
  'src',
  'poster',
  'action',
  'formaction',
  'xlink:href',
  'data',
]);

/** A URL with no scheme, not from the site root, and not just a fragment. */
function isRelative(url: string): boolean {
  const trimmed = url.trim();
  return (
    trimmed !== '' &&
    !/^[a-z][a-z\d+.-]*:/i.test(trimmed) &&
    !/^[/\\#?]/.test(trimmed)
  );
}

/** A relative URL without its query or fragment, decoded where it can be. */
function urlPath(url: string): string {
  const bare = url.trim().replace(/[?#].*$/, '');
  try {
    return decodeURIComponent(bare);
  } catch {
    return bare;
  }
}

/**
 * A relative URL as a note: what to do about it depends on what it points
 * at, read beside the page the way the browser resolved it. A file there
 * moves to the app's public folder, another page becomes a route, and a
 * target that isn't there is a dead link already.
 */
function relativeUrlNote(
  name: string,
  url: string,
  dir: string,
  line: number | null,
  candidate: boolean
): Note {
  const target = urlPath(url);
  // A srcset holds several URLs, so one is quoted as itself, in it.
  const written = candidate
    ? `\`${quote(url)}\` in \`${name}\``
    : `\`${name}="${quote(url)}"\``;
  if (!fs.existsSync(path.resolve(dir, target))) {
    return {
      rule: htmlRuleId('html-url', 'missing'),
      message: `${written} points at nothing beside the page (no \`${quote(target)}\` in its folder): point it somewhere real, or drop it`,
      line,
      url,
    };
  }
  const resolves =
    'in the app it resolves against the address the component renders at';
  if (/\.html?$/i.test(target)) {
    return {
      rule: htmlRuleId('html-url', 'relative'),
      message: `${written} links to another page beside this one, and ${resolves}: point it at the route that page becomes`,
      line,
      url,
    };
  }
  const fromRoot = `/${target.replace(/^(?:\.\.?\/)+/, '')}`;
  return {
    rule: htmlRuleId('html-url', 'relative'),
    message: `${written} is relative to the page's folder, and ${resolves}: copy the file into the app's \`public/\` folder and point at it from the site root (\`${quote(fromRoot)}\`), or import it`,
    line,
    url,
  };
}

function relativeUrlNotes(root: ParentNode, dir: string, notes: Note[]): void {
  for (const child of childrenOf(root)) {
    if (!isElement(child)) continue;
    const location = child.sourceCodeLocation;
    for (const attr of child.attrs) {
      const name = attr.prefix ? `${attr.prefix}:${attr.name}` : attr.name;
      if (name === 'data' && child.tagName !== 'object') continue;
      const candidates = name === 'srcset' || name === 'imagesrcset';
      const urls = candidates
        ? attr.value
            .split(',')
            .map(candidate => candidate.trim().split(/\s+/)[0] ?? '')
        : URL_ATTRIBUTES.has(name)
          ? [attr.value]
          : [];
      const line =
        location?.attrs?.[name]?.startLine ?? location?.startLine ?? null;
      for (const url of new Set(urls.filter(isRelative))) {
        notes.push(relativeUrlNote(name, url, dir, line, candidates));
      }
    }
    relativeUrlNotes(child, dir, notes);
  }
}

function parseNotes(parsed: ParsedHtml, notes: Note[]): void {
  const byCode = new Map<string, { line: number; count: number }>();
  for (const error of parsed.errors) {
    const seen = byCode.get(error.code);
    if (seen) seen.count++;
    else byCode.set(error.code, { line: error.line, count: 1 });
  }
  for (const [code, { line, count }] of byCode) {
    const more = count > 1 ? `, and ${count - 1} more like it` : '';
    notes.push({
      rule: htmlRuleId('html-parse', code),
      message: `the HTML has a parse error here (\`${code}\`)${more}: the component follows the DOM a browser builds from it, so check that part of the page renders as meant`,
      line,
    });
  }
}

// ---- Writing the module ----------------------------------------------------

/**
 * Comments outside the body (a credit, a licence) as line comments, split on
 * every line terminator JavaScript knows: a U+2028 or U+2029 ends a `//`
 * line too, and what follows it would be code.
 */
function outsideCommentLines(comments: CommentNode[]): string[] {
  return comments.flatMap(comment => {
    const lines = comment.data
      .split(/\r\n|[\r\n\u2028\u2029]/)
      .map(line => line.trimEnd());
    // Text on the `<!--` line is set off from it, not indented, so it
    // takes no part in the margin the lines below it share.
    const opening = lines[0].trim() === '' ? undefined : lines.shift()!.trim();
    while (
      opening === undefined &&
      lines.length > 0 &&
      lines[0].trim() === ''
    ) {
      lines.shift();
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
      lines.pop();
    }
    const margin = Math.min(
      ...lines
        .filter(line => line.trim() !== '')
        .map(line => line.match(/^[ \t]*/)![0].length)
    );
    return [
      ...(opening === undefined ? [] : [`// ${opening}`]),
      ...lines.map(line =>
        line.trim() === '' ? '//' : `// ${line.slice(margin)}`
      ),
    ];
  });
}

function todoLine(note: Note, page: string): string {
  const message = todoText(note.message);
  const at =
    note.line === null
      ? ''
      : note.lines !== undefined
        ? ` (${page}:${note.lines.join(', ')})`
        : ` (${page}:${note.line}${
            note.endLine !== undefined && note.endLine > note.line
              ? `-${note.endLine}`
              : ''
          })`;
  return `// TODO(bestax-migrate): ${message}${at}`;
}

/** What a shared line says about several relative URLs, by rule. */
const SHARED_URL_ADVICE: Readonly<Record<string, string>> = {
  [htmlRuleId('html-url', 'relative')]:
    "resolve against the page's folder, and in the app against the address the component renders at: copy each file into the app's `public/` folder and point at it from the site root, or import it, and point a link to another page at the route it becomes",
  [htmlRuleId('html-url', 'missing')]:
    'point at nothing beside the page: point each somewhere real, or drop it',
};

/**
 * The TODO lines above the `return`. A page can hold many relative URLs, all
 * with the one recipe, so where a rule has several they share a line, which
 * lists them and their lines; each is still its own report entry.
 */
function contentLines(notes: Note[], page: string): string[] {
  const groups = new Map<string, Note[]>();
  for (const note of notes) {
    if (note.url === undefined) continue;
    groups.set(note.rule, [...(groups.get(note.rule) ?? []), note]);
  }
  return notes.flatMap(note => {
    const group = note.url === undefined ? undefined : groups.get(note.rule);
    if (!group || group.length < 2) return [todoLine(note, page)];
    if (note !== group[0]) return [];
    const lines = [
      ...new Set(
        group.flatMap(each => (each.line === null ? [] : [each.line]))
      ),
    ];
    return [
      `// TODO(bestax-migrate): relative URLs (${listed(
        group.map(each => `\`${each.url}\``)
      )}) ${SHARED_URL_ADVICE[note.rule]} (${page}:${lines.join(', ')})`,
    ];
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The SVG or HTML table a JSX element's attributes are read from: an
 * `<svg>`'s and a `<foreignObject>`'s own are SVG's, and what is inside a
 * `<foreignObject>` is HTML again.
 */
function spaceOf(elementPath: any): 'html' | 'svg' {
  const own = elementPath.node.openingElement.name.name;
  if (own === 'svg' || own === 'foreignObject') return 'svg';
  for (let up = elementPath.parent; up?.node; up = up.parent) {
    if (up.node.type !== 'JSXElement') continue;
    const name = up.node.openingElement.name;
    if (name.type !== 'JSXIdentifier') continue;
    if (name.name === 'foreignObject') return 'html';
    if (name.name === 'svg') return 'svg';
  }
  return 'html';
}

/**
 * The module as written, after the planner: a number attribute on a plain
 * element as a number (`tabIndex="-1"` as `tabIndex={-1}`), which React's
 * types want and React renders the same, when it is spelled the way it
 * renders; a component's are the planner's. And a blank line after the
 * imports, which the transform puts straight above the component.
 */
export function finishModule(code: string): string {
  const j = makeApi().jscodeshift;
  const root = j(code);
  const edits: Array<{ start: number; end: number; text: string }> = [];
  root.find(j.JSXAttribute).forEach((attrPath: any) => {
    const { name, value } = attrPath.node;
    if (name.type !== 'JSXIdentifier' || value?.type !== 'StringLiteral') {
      return;
    }
    const tag = attrPath.parent.node.name;
    if (tag.type !== 'JSXIdentifier' || !/^[a-z][A-Za-z\d]*$/.test(tag.name)) {
      return;
    }
    const literal = numberLiteral(value.value);
    if (literal === null) return;
    if (!isNumberProp(name.name, spaceOf(attrPath.parent.parent))) return;
    edits.push({ start: value.start, end: value.end, text: `{${literal}}` });
  });
  const imports = root.find(j.ImportDeclaration).nodes();
  const last: any = imports[imports.length - 1];
  if (last && /^\n(?!\n)/.test(code.slice(last.end))) {
    edits.push({ start: last.end, end: last.end, text: '\n' });
  }
  let out = code;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  }
  return out;
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/** A page as a module: the one written, and the one before the planner ran. */
export interface ConvertedPage extends HtmlResult {
  /** The page's content as plain JSX, before the bulma-classes transform. */
  intermediate: string | null;
}

function refuse(
  collector: TodoCollector | undefined,
  entry: TodoEntry,
  outputPath: string
): ConvertedPage {
  collector?.add(entry);
  return { outputPath, output: null, intermediate: null };
}

export function convertPage(
  file: string,
  source: string,
  collector: TodoCollector | undefined,
  options: TransformOptions = {}
): ConvertedPage {
  const outputPath = outputPathFor(file, options);
  const parsed = parseHtml(source);
  const first = firstBulmaElement(parsed.root);
  if (!first) return { outputPath, output: null, intermediate: null };

  if (fs.existsSync(outputPath)) {
    return refuse(
      collector,
      {
        file,
        line: null,
        rule: htmlRuleId('html-file', 'exists'),
        message: `\`${path.basename(outputPath)}\` is already beside the page, and the codemod never overwrites a file: move or delete it to convert the page again`,
      },
      outputPath
    );
  }
  const template = TEMPLATE_SYNTAX.exec(source);
  if (template) {
    return refuse(
      collector,
      {
        file,
        line: lineAt(source, template.index),
        rule: htmlRuleId('html-file', 'template-syntax'),
        message: `the page has server-template syntax (\`${template[0]}\`), which isn't HTML a browser reads as written: convert the HTML the template renders, or the template by hand`,
      },
      outputPath
    );
  }

  const notes: Notes = { document: [], content: [] };
  const context: PageContext = {
    dir: path.dirname(file),
    css: options.cssMode ?? 'keep',
    nextjs: inNextApp(file, options.packageLanguages),
    loads: [],
  };
  parseNotes(parsed, notes.document);
  headNotes(parsed.head, notes.document, context);
  const body = parsed.kind === 'document' ? (parsed.root as Element) : null;
  documentAttributeNotes(
    'html',
    body?.parentNode && isElement(body.parentNode)
      ? body.parentNode
      : undefined,
    notes.document
  );
  documentAttributeNotes('body', body ?? undefined, notes.document);
  dropScripts(parsed.root, notes.document, context);
  const assets = assetNotes(context, parsed.root);
  notes.document.push(...assets.notes);

  const emitted = emitJsx(parsed.root, {
    displayOf: pageDisplayOf,
    indent: 2,
  });
  notes.content.push(...emitted.reported.map(convertedNote));
  relativeUrlNotes(parsed.root, path.dirname(file), notes.content);

  // In the page's order, which is how a reader works through them.
  const byLine = (a: Note, b: Note) =>
    (a.line ?? Infinity) - (b.line ?? Infinity);
  notes.document.sort(byLine);
  notes.content.sort(byLine);

  const page = path.basename(file);
  const header = outsideCommentLines(parsed.outsideComments);
  const lines = [
    ...header,
    ...(header.length > 0 ? [''] : []),
    // The transform retargets it under `--css`, as it would in a JSX file.
    ...(assets.importsBulma ? [BULMA_IMPORT] : []),
    ...notes.document.map(note => todoLine(note, page)),
    `export default function ${componentName(file, options.runRoots)}() {`,
    ...contentLines(notes.content, page).map(line => `  ${line}`),
    '  return (',
  ];
  const jsxStart = lines.length + 1;
  const intermediate = [...lines, emitted.code, '  );', '}', ''].join('\n');

  for (const note of [...notes.document, ...notes.content]) {
    collector?.add({
      file,
      line: note.line,
      rule: note.rule,
      message: note.message,
    });
  }
  // The transform reads the module's path, so the gates for a server
  // component or another JSX runtime apply to it; its report names the page.
  const planned = new Map<string, number[]>();
  const onPage: TodoCollector = {
    add: entry => {
      const line =
        entry.line === null || entry.line < jsxStart
          ? null
          : emitted.htmlLineOf(entry.line - jsxStart + 1);
      // A file-level gate's TODO is about the whole page, so it gets no
      // page line of the element it sits on.
      const forFile = (FILE_RULES as readonly string[]).includes(entry.rule);
      if (line !== null && !forFile) {
        const text = todoText(entry.message);
        planned.set(text, [...(planned.get(text) ?? []), line]);
      }
      collector?.add({ ...entry, file, line });
    },
  };
  const { output } = runTransform(transform, outputPath, intermediate, onPage, {
    ...options,
    collector: onPage,
  });
  return {
    outputPath,
    output: finishModule(withPageLines(output ?? intermediate, planned, page)),
    intermediate,
  };
}

/** A TODO's message as its comment writes it, on one line. */
function todoText(message: string): string {
  return message.replace(/[\r\n\u2028\u2029]+/g, ' ').trim();
}

/**
 * The planner's TODO lines, each with the page's lines it is about. The
 * transform writes one line for each message, however many elements share
 * it (five `.icon`s missing the same attribute), above the `return`, so the
 * lines go on after, the way the page's own notes carry theirs. Nothing from
 * the `return` on is read, since the page's text is there.
 */
function withPageLines(
  code: string,
  planned: ReadonlyMap<string, readonly number[]>,
  page: string
): string {
  if (planned.size === 0) return code;
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*return\b/.test(lines[i])) break;
    const todo = /^\s*\/\/ TODO\(bestax-migrate\): (.*)$/.exec(lines[i]);
    const on = todo ? planned.get(todo[1]) : undefined;
    if (!on) continue;
    const at = [...new Set(on)].sort((a, b) => a - b).join(', ');
    lines[i] = `${lines[i]} (${page}:${at})`;
  }
  return lines.join('\n');
}

/** The `transformHtml` the CLI calls. */
export function transformHtml(
  file: string,
  source: string,
  collector: TodoCollector | undefined,
  options: TransformOptions = {}
): HtmlResult {
  const { outputPath, output } = convertPage(file, source, collector, options);
  return { outputPath, output };
}
