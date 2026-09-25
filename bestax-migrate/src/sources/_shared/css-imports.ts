/**
 * The stylesheet-import pass every source runs before its JSX work.
 *
 * `--css bestax` (the default) converges every Bulma stylesheet import on the
 * combined `bestax.css` bundle, which already carries the extras; `bulma`
 * keeps plain Bulma v1 CSS and adds the extras import beside it; `keep`
 * leaves the app's own Bulma import alone and only retargets a source
 * library's stylesheet, which no longer resolves once the library is gone.
 *
 * What differs per source is the source's own stylesheet (react-bulma-components'
 * v3 bundle, `rbx/index.css`; bloomer ships none) and anything the source
 * handles before the shared rules (rbx's extension stylesheets).
 */

import type { CssMode } from '../../types.js';
import { addTodo, type TransformContext } from './jsx-utils.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

const BULMA_CSS = 'bulma/css/bulma.min.css';
const BESTAX_CSS = '@allxsmith/bestax-bulma/bestax.css';
const EXTRAS_CSS = '@allxsmith/bestax-bulma/extras.css';

const BULMA_CSS_SPECIFIERS = new Set([
  'bulma/css/bulma.css',
  'bulma/css/bulma.min.css',
]);
const BESTAX_CSS_SPECIFIERS = new Set([
  BESTAX_CSS,
  '@allxsmith/bestax-bulma/bestax.min.css',
  '@allxsmith/bestax-bulma/dist/bestax.css',
  '@allxsmith/bestax-bulma/dist/bestax.min.css',
]);
const EXTRAS_CSS_SPECIFIERS = new Set([
  EXTRAS_CSS,
  '@allxsmith/bestax-bulma/dist/extras.css',
]);

export interface StylesheetImportOptions {
  /** The source library's own stylesheet, retargeted wherever Bulma's is. */
  isSourceCss?: (specifier: string) => boolean;
  /**
   * How the keep-mode TODO names that stylesheet, e.g. "rbx's CSS import".
   * Required when `isSourceCss` is given.
   */
  sourceCssLabel?: string;
  /**
   * Runs first for every import; returning true means the source handled it
   * and the shared rules skip it.
   */
  handleOwn?: (path: any, specifier: string) => boolean;
}

export function rewriteStylesheetImports(
  ctx: TransformContext,
  root: any,
  cssMode: CssMode,
  options: StylesheetImportOptions = {}
): void {
  const { j } = ctx;
  const isSourceCss = options.isSourceCss ?? (() => false);
  const specifierOf = (p: any): string => String(p.node.source.value);

  let sawBestaxCss = root
    .find(j.ImportDeclaration)
    .paths()
    .some((p: any) => BESTAX_CSS_SPECIFIERS.has(specifierOf(p)));

  // Whether some import in this file will become bestax.css, regardless of
  // where it sits relative to an existing extras import.
  const willAdoptBestaxCss =
    cssMode === 'bestax' &&
    root
      .find(j.ImportDeclaration)
      .paths()
      .some((p: any) => {
        const specifier = specifierOf(p);
        return isSourceCss(specifier) || BULMA_CSS_SPECIFIERS.has(specifier);
      });

  root.find(j.ImportDeclaration).forEach((path: any) => {
    const source = specifierOf(path);
    if (options.handleOwn?.(path, source)) return;
    const isOwnCss = isSourceCss(source);
    const isBulmaCss = BULMA_CSS_SPECIFIERS.has(source);
    const isExtrasCss = EXTRAS_CSS_SPECIFIERS.has(source);
    if (!isOwnCss && !isBulmaCss && !isExtrasCss) return;

    if (cssMode === 'bestax') {
      if (isOwnCss || isBulmaCss) {
        if (sawBestaxCss) {
          path.prune(); // bestax.css already imported elsewhere in this file
        } else {
          path.node.source = j.stringLiteral(BESTAX_CSS);
          sawBestaxCss = true;
        }
        ctx.dirty = true;
      } else if (isExtrasCss && (sawBestaxCss || willAdoptBestaxCss)) {
        // bestax.css already contains the extras. `willAdoptBestaxCss` covers
        // the case where the extras import comes FIRST in the file and the
        // import that becomes bestax.css has not been visited yet —
        // otherwise the extras survive alongside it and double-load.
        path.prune();
        ctx.dirty = true;
      }
    } else if (cssMode === 'bulma') {
      if (isOwnCss) {
        path.node.source = j.stringLiteral(BULMA_CSS);
        ctx.dirty = true;
      }
      if ((isOwnCss || isBulmaCss) && !sawBestaxCss) {
        const hasExtras = root
          .find(j.ImportDeclaration)
          .paths()
          .some((p: any) => EXTRAS_CSS_SPECIFIERS.has(specifierOf(p)));
        if (!hasExtras) {
          // Themed Radio/Checkbox need the bestax extras next to plain Bulma.
          path.insertAfter(
            j.importDeclaration([], j.stringLiteral(EXTRAS_CSS))
          );
          ctx.dirty = true;
        }
      }
    } else if (isOwnCss) {
      // keep: minimal fix — the source's stylesheet goes with the source.
      path.node.source = j.stringLiteral(BULMA_CSS);
      addTodo(
        ctx,
        path,
        'css',
        `replaced ${options.sourceCssLabel} with '${BULMA_CSS}'; install bulma@^1 (see https://bestax.io/docs/guides/getting-started/installation)`
      );
    }
  });
}
