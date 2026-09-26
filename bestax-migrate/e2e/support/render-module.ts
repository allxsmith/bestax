/**
 * Render TSX modules to static HTML against the real, built
 * `@allxsmith/bestax-bulma` (turbo builds bulma-ui first).
 *
 * The library is loaded through ITS OWN `react` and `react-dom`, never this
 * package's: the workspace can hold two React copies at once, and a component
 * rendered by the other copy's renderer fails on its first hook. So React,
 * `react/jsx-runtime`, `react-dom/server` and the library's CommonJS build
 * are all required from bulma-ui's directory, with Node's own require rather
 * than jest's module registry, and every module rendered here gets exactly
 * those instances.
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
