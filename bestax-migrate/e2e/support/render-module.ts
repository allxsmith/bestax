/**
 * Render TSX modules to static HTML against the real, built
 * `@allxsmith/bestax-bulma` (turbo builds bulma-ui first).
 *
 * The library is loaded through ITS OWN `react` and `react-dom`, never this
 * package's: the workspace can hold two React copies at once, and a component
 * rendered by the other copy's renderer fails on its first hook. So React,
 * `react/jsx-runtime`, `react-dom/server` and the library's CommonJS build
 * are all required from bulma-ui's directory, with Node's own require rather
 * than the test runner's module loader, and every module rendered here gets
 * exactly those instances.
 *
 * A module is transpiled to CommonJS and evaluated with a fixed require map:
 * the four modules above, sibling files of the same module set, and
 * stylesheets (which render nothing). Any other import throws, so a module
 * never reaches past what the caller handed in.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { REPLACED_IN_V1 } from '../../src/sources/bulma-classes/class-map.js';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

const libraryRoot = fs.realpathSync(
  path.join(packageRoot, 'node_modules', '@allxsmith', 'bestax-bulma')
);
const requireFromLibrary = createRequire(
  path.join(libraryRoot, 'package.json')
);

/* eslint-disable @typescript-eslint/no-explicit-any */
const React: any = requireFromLibrary('react');
const { renderToStaticMarkup }: any = requireFromLibrary('react-dom/server');

/** The built library, as a module that imports it would see it. */
export const bestax: Record<string, any> = requireFromLibrary(
  path.join(libraryRoot, 'dist', 'index.cjs')
);

const SHARED_MODULES: Record<string, unknown> = {
  react: React,
  'react/jsx-runtime': requireFromLibrary('react/jsx-runtime'),
  '@allxsmith/bestax-bulma': bestax,
};

/**
 * One element, for rendering or for another element's children. `type` is a
 * tag or a component; dotted names (`Hero.Body`) are looked up on the library.
 */
export function createElement(
  type: string,
  props: Record<string, unknown>,
  children?: unknown
): unknown {
  const component = /^[A-Z]/.test(type)
    ? type.split('.').reduce((owner, key) => owner?.[key], bestax as any)
    : type;
  if (!component) throw new Error(`bestax has no ${type}`);
  return React.createElement(component, props, children);
}

/** Render one element (see `createElement`) to static HTML. */
export function renderElement(
  type: string,
  props: Record<string, unknown>,
  children?: unknown
): string {
  return renderToStaticMarkup(createElement(type, props, children) as any);
}

const STYLESHEET = /\.(?:css|scss|sass)$/;

/** Transpile one TSX module to CommonJS. */
function toCommonJs(source: string, fileName: string): string {
  return ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
}

/**
 * Evaluate a set of TSX modules, keyed by file name without extension
 * (`App`, `components`), and return each one's exports. `extra` supplies
 * stand-ins for any other module a file imports.
 */
export function loadModules(
  files: Record<string, string>,
  extra: Record<string, unknown> = {}
): Record<string, Record<string, unknown>> {
  const loaded: Record<string, Record<string, unknown>> = {};
  const load = (name: string): Record<string, unknown> => {
    if (loaded[name]) return loaded[name];
    const source = files[name];
    if (source === undefined) throw new Error(`no module named ${name}`);
    const module = { exports: {} as Record<string, unknown> };
    // Registered before evaluation, as Node does, so a cycle sees the
    // partially filled exports rather than recursing forever.
    loaded[name] = module.exports;
    const require = (specifier: string): unknown => {
      if (specifier in SHARED_MODULES) return SHARED_MODULES[specifier];
      if (specifier in extra) return extra[specifier];
      if (STYLESHEET.test(specifier)) return {};
      if (specifier.startsWith('./')) {
        return load(specifier.slice(2).replace(/\.[jt]sx?$/, ''));
      }
      throw new Error(`${name} imports ${specifier}, which is not available`);
    };
    new Function(
      'require',
      'module',
      'exports',
      toCommonJs(source, `${name}.tsx`)
    )(require, module, module.exports);
    loaded[name] = module.exports;
    return module.exports;
  };
  for (const name of Object.keys(files)) load(name);
  return loaded;
}

/**
 * Every exported component, rendered with no props: plain functions, and the
 * objects `memo` and `forwardRef` return, which React marks with `$$typeof`.
 */
export function renderExports(
  exports: Record<string, unknown>
): Record<string, string> {
  const rendered: Record<string, string> = {};
  for (const [name, value] of Object.entries(exports)) {
    const component =
      typeof value === 'function' ||
      (typeof value === 'object' && value !== null && '$$typeof' in value);
    if (!component) continue;
    rendered[name] = renderToStaticMarkup(React.createElement(value as any));
  }
  return rendered;
}

/**
 * Make two renders comparable: attributes in name order, class tokens in
 * order and once each (a class list is a set to CSS, and bestax dedupes it),
 * and React's `<!-- -->` text separators gone. Nothing else changes, so any
 * remaining difference is a real difference in the markup.
 */
export function normalizeHtml(html: string): string {
  return html
    .replace(/<!-- -->/g, '')
    .replace(
      /<([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*(\/?)>/g,
      (_match, tag: string, attrs: string, selfClosing: string) => {
        const parsed = [
          ...attrs.matchAll(/\s+([^\s=>/]+)(?:="([^"]*)")?/g),
        ].map(([, name, value]) => {
          if (name === 'class' && value !== undefined) {
            value = [...new Set(value.split(/\s+/).filter(Boolean))]
              .sort()
              .join(' ');
          }
          return value === undefined ? name : `${name}="${value}"`;
        });
        parsed.sort();
        return `<${tag}${parsed.map(a => ` ${a}`).join('')}${selfClosing ? '/' : ''}>`;
      }
    );
}

/** Each `<ul>` or `<ol>` opening tag, in document order. */
const LIST_TAG = /<(?:ul|ol)(?=[\s>/])[^>]*>/g;

/**
 * `raw`, normalised, with `role="list"` written on each `<ul>` or `<ol>` that
 * has no role where the same list in `converted` has that one, so the two
 * compare equal there and nowhere else.
 *
 * `role="list"` is a list's own implicit role, written out. `Menu.List`
 * writes it because WebKit stops exposing a list as one once its markers are
 * hidden (#1108), so a raw `<ul class="menu-list">` and the `Menu.List` it
 * becomes are the same list. Only that role, only on those two tags, and only
 * where the raw list has no role of its own: a conversion that drops a list's
 * `role="list"`, or swaps another role for it, still differs. Lists pair up
 * in document order, and a pair that doesn't line up differs anyway.
 */
export function withImplicitListRoles(raw: string, converted: string): string {
  const written = [...converted.matchAll(LIST_TAG)].map(([tag]) =>
    /\srole="list"/.test(tag)
  );
  let at = 0;
  return normalizeHtml(
    raw.replace(LIST_TAG, tag =>
      written[at++] && !/\srole=/.test(tag)
        ? tag.replace(/^<(ul|ol)/, '$& role="list"')
        : tag
    )
  );
}

/** Each opening tag, in document order. */
const OPEN_TAG = /<[a-zA-Z][\w-]*(?:\s+[^\s=>/]+(?:="[^"]*")?)*\s*\/?>/g;

function classesOf(tag: string): string[] {
  return (/\sclass="([^"]*)"/.exec(tag)?.[1] ?? '').split(/\s+/);
}

/** The two attributes a loading `Button` writes, as `normalizeHtml` writes them. */
const LOADING_STATE = ['aria-busy="true"', 'aria-disabled="true"'];

/**
 * `raw`, normalised, with `aria-busy="true"` and `aria-disabled="true"`
 * written on each element with Bulma's `button` and `is-loading` classes that
 * sets neither, where the same element in `converted` has both, so the two
 * compare equal there and nowhere else.
 *
 * bestax's `Button` writes them while `isLoading` is set (#1870): it tells a
 * screen reader the button is busy and won't respond, and drops the click,
 * where Bulma's spinner stops only a pointer. A raw loading `.button`
 * converts to `Button isLoading` on purpose, so a migrated app gets that
 * button. Only those two attributes, both of them, on a loading `.button`
 * that sets neither: a conversion that writes them anywhere else, writes one
 * alone, or adds one beside a raw element that set the other, still differs.
 * A raw element that already set both to `true` is left as it is, and
 * compares equal to a conversion that keeps them. Elements pair up in
 * document order, and a pair that doesn't line up differs anyway.
 */
export function withLoadingButtonsBusy(raw: string, converted: string): string {
  const busy = [...normalizeHtml(converted).matchAll(OPEN_TAG)].map(([tag]) =>
    LOADING_STATE.every(attribute => tag.includes(` ${attribute}`))
  );
  let at = 0;
  return normalizeHtml(
    raw.replace(OPEN_TAG, tag => {
      const classes = classesOf(tag);
      return busy[at++] &&
        classes.includes('button') &&
        classes.includes('is-loading') &&
        !/\saria-(busy|disabled)(=|[\s/>])/.test(tag)
        ? tag.replace(/^<[a-zA-Z][\w-]*/, `$& ${LOADING_STATE.join(' ')}`)
        : tag;
    })
  );
}

/** The hit area `Delete` writes as a delete button's last child, as `normalizeHtml` writes it. */
const DELETE_TARGET = '<span aria-hidden="true" class="delete-target"></span>';

/** A `<button>`'s opening tag, read the way `OPEN_TAG` reads one. */
const BUTTON_OPEN = /^<button(?:\s+[^\s=>/]+(?:="[^"]*")?)*\s*>/;

/** Each `<button>`, from its opening tag to the first `</button>` after it. */
const BUTTON = new RegExp(
  `${BUTTON_OPEN.source.slice(1)}[\\s\\S]*?<\\/button>`,
  'g'
);

/** Whether a `<button>` from `BUTTON` has Bulma's `delete` class. */
const isDeleteButton = (button: string) =>
  classesOf(BUTTON_OPEN.exec(button)?.[0] ?? '').includes('delete');

/**
 * `raw`, normalised, with the hit area `Delete` writes, an empty
 * `aria-hidden` span with the `delete-target` class, written as the last
 * child of each `<button>` with Bulma's `delete` class that doesn't end in
 * one, where the same button in `converted` does, so the two compare equal
 * there and nowhere else.
 *
 * Bulma draws its delete button 20px across, 16px small, under WCAG 2.5.8's
 * 24px minimum target, and bestax's `Delete` holds that span, which its
 * stylesheet makes a transparent box at least 24px square, so a press beside
 * the circle still reaches the button (#2198). It draws nothing and assistive
 * tech skips it. A raw `.delete` converts to `Delete` on purpose, so a
 * migrated app gets that target. Only that span, only as a delete button's
 * last child, and only where the raw button doesn't end in one already: a
 * conversion that writes it anywhere else, or writes something else there,
 * still differs. Buttons pair up in document order, and a pair that doesn't
 * line up differs anyway. Run it before the restatements that pair every
 * element in document order, since the span is an element they count.
 */
export function withDeleteTargets(raw: string, converted: string): string {
  const targeted = [...normalizeHtml(converted).matchAll(BUTTON)]
    .map(([button]) => button)
    .filter(isDeleteButton)
    .map(button => button.endsWith(`${DELETE_TARGET}</button>`));
  let at = 0;
  return normalizeHtml(raw).replace(BUTTON, button =>
    isDeleteButton(button) &&
    targeted[at++] &&
    !button.endsWith(`${DELETE_TARGET}</button>`)
      ? `${button.slice(0, -'</button>'.length)}${DELETE_TARGET}</button>`
      : button
  );
}

/**
 * `raw`, normalised, with each Bulma 0.9 class v1 removed written as the v1
 * class `REPLACED_IN_V1` names for it, on each element where `converted` has
 * that class in its place, so the two compare equal there and nowhere else.
 *
 * Such a class styles nothing under v1, and the codemod converts it as the
 * v1 helper that does its job (`is-marginless` as `m="0"`, which renders
 * `m-0`), the conversion that changes a class on purpose. Only those
 * classes, and only where the converted element has the v1 class and not the
 * old one: a conversion that drops the class, or keeps it beside the prop,
 * still differs. Elements pair up in document order, and a pair that doesn't
 * line up differs anyway.
 */
export function withV1Classes(raw: string, converted: string): string {
  const rendered = [...converted.matchAll(OPEN_TAG)].map(([tag]) =>
    classesOf(tag)
  );
  let at = 0;
  return normalizeHtml(
    raw.replace(OPEN_TAG, tag => {
      const theirs = rendered[at++] ?? [];
      return tag.replace(
        /(\sclass=")([^"]*)"/,
        (_match, open: string, value: string) =>
          `${open}${value
            .split(/\s+/)
            .map(token => {
              const v1 = Object.hasOwn(REPLACED_IN_V1, token)
                ? REPLACED_IN_V1[token]
                : undefined;
              return v1 && theirs.includes(v1) && !theirs.includes(token)
                ? v1
                : token;
            })
            .join(' ')}"`
      );
    })
  );
}
