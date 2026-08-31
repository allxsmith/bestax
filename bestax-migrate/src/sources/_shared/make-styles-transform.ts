/**
 * Stylesheet migration, shared by every source: Bulma 0.9-era Sass
 * (`@import` + `$var !default` overrides, `_all` aggregator partials) →
 * Bulma v1 modules (`@use "bulma/sass" with (…)`), plus the bestax extras.
 *
 * Sass has no jscodeshift parser, so this is a conservative line-based text
 * transform: it only rewrites patterns it can prove safe and leaves a
 * `// TODO(bestax-migrate): …` everywhere else (line comments are valid in
 * both SCSS and indented Sass).
 *
 * Everything about Bulma itself is source-independent — the only per-source
 * parts are which package's own stylesheet specifiers to retire and which
 * migration guide to link, so those arrive through `StylesConfig`.
 */

import path from 'node:path';
import type { StylesTransform, TodoCollector } from '../../types.js';

export interface StylesConfig {
  /** npm package name of the source library, e.g. `rbx`. */
  packageName: string;
  /** URL of that source's migration guide, linked from every TODO. */
  guideUrl: string;
  /**
   * Regex fragments (not literals) for the path suffixes that, together with
   * the bare package name, count as the package's *root* stylesheet rather
   * than one of its partials — these are replaced with a Bulma v1 root
   * instead of being dropped.
   */
  rootStylesheetSuffixes: string[];
}

const TODO = 'TODO(bestax-migrate)';
const EXTRAS_USE = "@use '@allxsmith/bestax-bulma/scss/extras';";

/** Bulma v1 sass tree — directories that replaced the 0.9 `_all` partials. */
const V1_DIRS = new Set([
  'utilities',
  'base',
  'elements',
  'form',
  'components',
  'grid',
  'layout',
  'helpers',
  'themes',
]);

/** Known Bulma v1 leaf partials (path after `bulma/sass/`). */
const V1_LEAVES = new Set([
  'utilities/initial-variables',
  'utilities/derived-variables',
  'utilities/css-variables',
  'utilities/mixins',
  'utilities/functions',
  'utilities/controls',
  'utilities/extends',
  'themes/light',
  'themes/dark',
  'themes/setup',
]);

/**
 * The 0.9 root imports that become `@use "bulma/sass"`. The specifier may be
 * bare (`bulma/bulma`), tilde-prefixed (webpack), or a relative path into
 * node_modules (`../../node_modules/bulma/bulma`, common under Parcel) —
 * relative prefixes are preserved in the emitted `@use`.
 */
const ROOT_IMPORT =
  /^(\s*)@import\s+(['"])((?:\.\.?\/)+node_modules\/|~)?bulma\/(?:bulma(?:\.sass|\.scss)?|css\/bulma(?:\.min)?\.css)\2\s*;?\s*$/;

/** 0.9 partial imports under bulma/sass/… (same prefix forms as the root). */
const PARTIAL_IMPORT =
  /^(\s*)@import\s+(['"])((?:\.\.?\/)+node_modules\/|~)?bulma\/sass\/([\w/-]+)\2\s*;?\s*$/;

/** A preserved path prefix for the rewritten `@use` (tilde never survives). */
function keptPrefix(prefix: string | undefined): string {
  return prefix && prefix !== '~' ? prefix : '';
}

/** Any other line that still `@import`s something bulma-ish. */
const OTHER_BULMA_IMPORT = /^\s*@import\s+['"][^'"]*bulma[^'"]*['"]/;

/**
 * Third-party Bulma extension packages (`bulma-checkradio`, `bulma-switch`,
 * …) — 0.9-era add-ons whose v1 compatibility varies; several are covered
 * by the bestax extras. The `bulma-` package name must start at a specifier
 * segment boundary (right after the quote/`~`, or after a `/`) so this does
 * not also match a name that merely *contains* `bulma-`, like
 * `react-bulma-components` (see EXTENSION_IMPORT's own regression test).
 */
const EXTENSION_IMPORT =
  /^\s*@import\s+['"](?:~|[^'"]*\/)?bulma-([\w-]+?)(?:\/|\.|['"])/;

/**
 * The source library's own stylesheet. This is not a third-party extension:
 * it is the library being migrated away from, and `deps.ts` removes its
 * package.json entry in the same run, so leaving the import in place breaks
 * the Sass build. Any `react-bulma-components/…` specifier is dead the same
 * way — the documented v3 setup paths (the bundled CSS, the "advanced" Sass
 * entry point), but also deep partials and extensionless forms — so, like
 * `transform.ts`, we match on the package prefix rather than enumerating
 * shapes. The prefix may be bare, `~`-prefixed, or a relative node_modules
 * path (the Parcel form `ROOT_IMPORT` also supports).
 */

/**
 * The subset of RBC stylesheet imports that are the library's own *root*: the
 * bare package specifier, the documented Sass entry point (`src/index`), and
 * the bundled v3 CSS (`dist/react-bulma-components(.min).css`). These pull in
 * the whole library, which `bulma/sass` supersedes — so when the file already
 * has a Bulma root, dropping one of these loses nothing. A deep RBC partial
 * (`src/components/navbar.sass`) is NOT a root: `bulma/sass` doesn't carry a
 * given partial's styles, so removing one silently would drop CSS. We flag
 * those instead (the package's "never a silent skip" rule).
 */

/**
 * A Bulma module root already pulled in via `@use` — the file's own
 * `@use 'bulma/sass'` (any prefix, configured or not) or the bestax bundle
 * (`scss/bestax`, which itself loads `bulma/sass with (…)`). When one is
 * present we must not emit a second root: a duplicate `bulma/sass` namespace,
 * or reconfiguring an already-loaded module, is a hard Sass error.
 */
const USE_BULMA_ROOT =
  /^\s*@use\s+(['"])(?:~|(?:\.\.?\/)+node_modules\/)?(?:bulma\/sass|@allxsmith\/bestax-bulma\/(?:src\/)?scss\/bestax)\1/;

/** Any `$name: value;` declaration (with or without `!default`). */
const VAR_DECL = /^\s*\$([\w-]+)\s*:\s*(.+?)\s*(!default)?\s*;\s*$/;

/**
 * Strips Sass block comments (slash-star … star-slash spans) from a value
 * before it is analyzed for foldability or top-level commas. A comment can
 * carry an unbalanced quote (an apostrophe in `user's`) or a stray `(`/`$`
 * that would otherwise fool the character scanners into mis-reading the
 * value's structure; the comment is inert to Sass, so removing it for
 * analysis is safe. The emitted value still carries the comment verbatim.
 *
 * The scan tracks quote state first and only recognizes a block comment
 * outside a string, in one pass — a bare regex would treat a slash-star …
 * star-slash-shaped span that straddles two quoted strings (opening marker in
 * one string, closing marker in the next) as a comment and delete the real
 * top-level comma between them, so a genuine list would fold unparenthesized.
 * An unterminated comment consumes the rest of the value.
 */
function stripSassComments(value: string): string {
  let result = '';
  let quote: string | null = null;
  let escaped = false;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (quote) {
      result += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '/' && value[i + 1] === '*') {
      const end = value.indexOf('*/', i + 2);
      if (end === -1) break; // unterminated comment — drop the rest
      i = end + 1; // resume after the closing */
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    result += char;
  }
  return result;
}

/**
 * A value is fold-safe for `with (…)` when it is a plain literal — no
 * function calls, interpolation, variable references, or at-rules. Hex
 * colors (`#ff6b35`) are fine; `#{…}` interpolation is not. Block comments are
 * ignored for this test — their contents don't make the value non-literal.
 */
function isFoldableValue(value: string): boolean {
  return !/[()$@]|#\{/.test(stripSassComments(value));
}

/**
 * Whether `value` has a comma outside any quoted string — a bare Sass list
 * (`'Nunito', sans-serif`) that must be parenthesized before it can sit
 * inside `with (…)`, or Dart Sass reads the comma as an argument separator
 * instead of a list delimiter. Block comments are stripped first so a quote or
 * comma inside one (an apostrophe in `user's`) can't skew the scan.
 */
function hasTopLevelComma(value: string): boolean {
  let quote: string | null = null;
  let escaped = false;
  for (const char of stripSassComments(value)) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ',') {
      return true;
    }
  }
  return false;
}

/** Formats a folded value for the `with (…)` clause, parenthesizing a bare list. */
function formatFoldedValue(value: string): string {
  return hasTopLevelComma(value) ? `(${value})` : value;
}

function report(
  collector: TodoCollector | undefined,
  file: string,
  line: number | null,
  rule: string,
  message: string
): void {
  collector?.add({ file, line, rule, message });
}

/**
 * Build the stylesheet transform for one source library.
 *
 * `packageName` drives two regexes — one matching any `@import` of that
 * package, one narrowing to its *root* stylesheet (which becomes a Bulma v1
 * root rather than being dropped). Everything else is Bulma-side and shared.
 */
export function makeStylesTransform(config: StylesConfig): StylesTransform {
  const { packageName, guideUrl: GUIDE } = config;
  const pkg = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Already regex fragments — see StylesConfig.
  const roots = config.rootStylesheetSuffixes.join('|');

  /**
   * Any @import of the source package's own stylesheets. The path after the
   * package name is optional: `@import '~rbx'` resolves through the package's
   * `style`/`sass` field and is a plausible spelling for a short package name,
   * and SOURCE_ROOT_STYLESHEET below already accepts that bare form — so
   * requiring the slash here made the bare case unreachable.
   */
  const SOURCE_STYLE_IMPORT = new RegExp(
    `^(\\s*)@import\\s+(['"])((?:\\.\\.?/)+node_modules/|~)?${pkg}(?:/[^'"]*)?\\2\\s*;?\\s*$`
  );
  /** Cheap "is this file even about us?" pre-filter (see the guard below). */
  const SOURCE_MENTION = new RegExp(pkg);

  /** …narrowed to the ones that stand in for a whole Bulma root. */
  const SOURCE_ROOT_STYLESHEET = new RegExp(
    `^\\s*@import\\s+(['"])(?:(?:\\.\\.?/)+node_modules/|~)?${pkg}${roots ? `(?:${roots})?` : ''}\\1\\s*;?\\s*$`
  );

  const transformStyles: StylesTransform = (
    filePath,
    source,
    collector,
    options
  ) => {
    const cssMode = options.cssMode ?? 'bestax';
    // Cheap pre-filter. It must accept a file that names only the SOURCE
    // package: rbx's documented Sass entry is `@import '~rbx/rbx'` and rbx
    // pulls Bulma in itself, so such a file contains no "bulma" substring at
    // all. Bailing on it left a dead import behind with no TODO and no report
    // entry while deps.ts deleted the package in the same run — a silent
    // build break, which is exactly what this package promises never to do.
    if (!/bulma/.test(source) && !SOURCE_MENTION.test(source)) return null;

    // Indented-syntax files: flag only — rewriting without a parser is unsafe.
    if (path.extname(filePath) === '.sass') {
      if (source.includes(`${TODO}`)) return null;
      report(
        collector,
        filePath,
        1,
        'sass',
        `indented-syntax file references Bulma; convert its @import lines to @use "bulma/sass" by hand — see ${GUIDE}`
      );
      return `// ${TODO}: convert Bulma 0.9 @import lines to @use "bulma/sass" with (…) — see ${GUIDE}\n${source}`;
    }

    const lines = source.split('\n');
    const out: string[] = [];
    let changed = false;
    let extrasAdded = source.includes('@allxsmith/bestax-bulma/scss');

    // Pass 1: locate the file's Bulma root and the safe leading variable
    // overrides that fold into it. A real `bulma/…` @import root wins; otherwise
    // the RBC stylesheet, which we rewrite into a root the same way — so a file
    // that starts from RBC and one that starts from a bulma @import converge on
    // the identical shape. A pre-existing `@use` root means we create no new one.
    const rootImportIndex = lines.findIndex(line => ROOT_IMPORT.test(line));
    // DELIBERATELY any source specifier, not just the root stylesheet. A
    // reviewer flagged that a lone deep partial (`~rbx/base/helpers/badge`) is
    // rewritten into a full `@use 'bulma/sass'` as though it were the whole
    // framework. That is the intended behaviour, and it predates rbx: the
    // react-bulma-components suite asserts it by name ("regardless of
    // specifier shape"). The reasoning holds for both sources — every one of
    // these imports is dead once deps.ts removes the package, and a file that
    // styled itself from the library needs SOME Bulma root afterwards, so
    // emitting one beats dropping it and leaving the file unstyled.
    const sourceRootIndex = lines.findIndex(
      line => SOURCE_STYLE_IMPORT.test(line) && !line.includes(TODO)
    );
    const hasUseBulmaRoot = lines.some(line => USE_BULMA_ROOT.test(line));
    const foldTargetIndex = hasUseBulmaRoot
      ? -1
      : rootImportIndex !== -1
        ? rootImportIndex
        : sourceRootIndex;
    const foldableVars: Array<{ index: number; name: string; value: string }> =
      [];
    const unsafeVarLines: number[] = [];
    if (foldTargetIndex !== -1) {
      for (let i = 0; i < foldTargetIndex; i += 1) {
        const line = lines[i];
        const match = line.match(VAR_DECL);
        if (match && isFoldableValue(match[2])) {
          foldableVars.push({
            index: i,
            name: match[1],
            value: match[2].trim(),
          });
        } else if (/^\s*\$[\w-]+\s*:/.test(line)) {
          unsafeVarLines.push(i);
        }
      }
    }
    const folded = new Set(foldableVars.map(v => v.index));

    /**
     * Emit a Bulma module root at `indent` (folding the leading var overrides
     * gathered above into `with (…)`, flagging any unsafe ones), then, in
     * bestax mode, the extras. `prefix` is a preserved relative-path prefix
     * (raw-file toolchains resolve paths, not package specifiers) or ''.
     */
    const emitBulmaRoot = (
      indent: string,
      prefix: string,
      lineNo: number
    ): void => {
      const bulmaSass = `${prefix}bulma/sass`;
      if (foldableVars.length > 0) {
        out.push(`${indent}@use '${bulmaSass}' with (`);
        foldableVars.forEach(({ name, value }, index) => {
          const comma = index < foldableVars.length - 1 ? ',' : '';
          out.push(`${indent}  $${name}: ${formatFoldedValue(value)}${comma}`);
        });
        out.push(`${indent});`);
      } else {
        out.push(`${indent}@use '${bulmaSass}';`);
      }
      if (unsafeVarLines.length > 0) {
        out.push(
          `${indent}// ${TODO}: the variable override(s) above use computed values; move them into the @use "bulma/sass" with (…) configuration by hand`
        );
        report(
          collector,
          filePath,
          lineNo,
          'sass',
          'variable overrides with computed values could not be folded into `with (…)`'
        );
      }
      if (cssMode === 'bestax' && !extrasAdded) {
        out.push(
          prefix
            ? `${indent}@use '${prefix}@allxsmith/bestax-bulma/src/scss/extras';`
            : `${indent}${EXTRAS_USE}`
        );
        extrasAdded = true;
      }
    };

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];

      if (i === rootImportIndex) {
        const rootMatch = line.match(ROOT_IMPORT);
        // A path-prefixed root import means the toolchain resolves raw file
        // paths, not package specifiers — point at the shipped files directly.
        emitBulmaRoot(rootMatch?.[1] ?? '', keptPrefix(rootMatch?.[3]), i + 1);
        changed = true;
        continue;
      }

      if (folded.has(i)) {
        changed = true; // folded into with(...) above
        continue;
      }

      const partial = line.match(PARTIAL_IMPORT);
      if (partial) {
        const [, indent, , rawPrefix, importPath] = partial;
        const prefix = keptPrefix(rawPrefix);
        // Partial-only files (modular builds with no root import) still need
        // the extras for the bestax components' styling; the extras tree only
        // reads Bulma utilities, never configures them, so this is load-safe.
        const pushExtras = () => {
          if (cssMode !== 'bestax' || extrasAdded || rootImportIndex !== -1) {
            return;
          }
          out.push(
            prefix
              ? `${indent}@use '${prefix}@allxsmith/bestax-bulma/src/scss/extras';`
              : `${indent}${EXTRAS_USE}`
          );
          extrasAdded = true;
        };
        const segments = importPath.split('/');
        const last = segments[segments.length - 1].replace(/^_/, '');
        const dir = segments[0];
        if ((last === 'all' || last === 'index') && V1_DIRS.has(dir)) {
          out.push(`${indent}@use '${prefix}bulma/sass/${dir}';`);
          pushExtras();
          changed = true;
          continue;
        }
        const leaf = segments.map(s => s.replace(/^_/, '')).join('/');
        if (V1_DIRS.has(leaf) || V1_LEAVES.has(leaf)) {
          out.push(`${indent}@use '${prefix}bulma/sass/${leaf}';`);
          pushExtras();
          changed = true;
          continue;
        }
        out.push(
          `${indent}// ${TODO}: this Bulma 0.9 partial path no longer exists in Bulma v1; find its replacement under bulma/sass/ — see ${GUIDE}`
        );
        out.push(line);
        report(
          collector,
          filePath,
          i + 1,
          'sass',
          `Bulma 0.9 partial path \`bulma/sass/${importPath}\` has no direct v1 equivalent`
        );
        changed = true;
        continue;
      }

      const sourceStyle = line.match(SOURCE_STYLE_IMPORT);
      if (sourceStyle && !line.includes(TODO)) {
        const indent = sourceStyle[1];
        const prefix = keptPrefix(sourceStyle[3]);
        if (
          i === sourceRootIndex &&
          rootImportIndex === -1 &&
          !hasUseBulmaRoot
        ) {
          // The library's own stylesheet never resolves post-migration (deps.ts
          // removes react-bulma-components in the same run), and it is this
          // file's only Bulma root, so rewrite it into one — the same shape the
          // @import root path emits, folding any leading var overrides. Emitting
          // a real `bulma/sass` (+ extras) rather than the hard-configured
          // bestax bundle keeps this convergent with the @import path and avoids
          // reconfiguring `bulma/sass` if a themed root exists elsewhere.
          emitBulmaRoot(indent, prefix, i + 1);
          if (cssMode === 'keep') {
            // The replacement is unavoidable even in keep mode: RBC's own
            // stylesheet is a v3 (Bulma 0.9) asset the migrated v1 components
            // can't use. What changed depends on whether the manifest step ran.
            const depsRan = options.deps !== false;
            const detail = depsRan
              ? 'its package.json entry is removed, so the old import no longer resolves; install bulma@^1'
              : 'it targets Bulma 0.9, not the v1 your components now use; --no-deps kept the dependency, so install bulma@^1 alongside it';
            out.push(
              `${indent}// ${TODO}: replaced ${packageName}'s own stylesheet with @use 'bulma/sass' — ${detail} — see ${GUIDE}`
            );
            report(
              collector,
              filePath,
              i + 1,
              'sass',
              depsRan
                ? `replaced ${packageName}'s stylesheet import with bulma/sass; the package is removed from dependencies, so the old import would not resolve`
                : `replaced ${packageName}'s stylesheet import with bulma/sass; it is a Bulma 0.9 asset the migrated v1 components can't use (--no-deps left the package in place)`
            );
          } else {
            // bestax/bulma modes rewrite the file's root without a TODO — still
            // report it so the migration summary reflects the restructured root.
            report(
              collector,
              filePath,
              i + 1,
              'sass',
              `replaced ${packageName}'s stylesheet import with a Bulma v1 @use root`
            );
          }
        } else {
          // A Bulma root already covers this file (a `bulma/…` @import we
          // convert, the file's own `@use` root, or an earlier RBC line we
          // rewrote). In bestax mode keep that root and add only the extras —
          // never a second root, never the configured bundle that would
          // reconfigure an already-loaded module.
          if (cssMode === 'bestax' && !extrasAdded) {
            out.push(
              prefix
                ? `${indent}@use '${prefix}@allxsmith/bestax-bulma/src/scss/extras';`
                : `${indent}${EXTRAS_USE}`
            );
            extrasAdded = true;
          }
          // Dropping the RBC line is only safe for its root/index stylesheet,
          // which `bulma/sass` supersedes. A deep RBC partial can carry styles
          // `bulma/sass` doesn't, so removing it silently would lose CSS — flag
          // it with a TODO + report entry instead (never a silent skip).
          if (!SOURCE_ROOT_STYLESHEET.test(line)) {
            out.push(
              `${indent}// ${TODO}: dropped a ${packageName} stylesheet partial that has no Bulma v1 root equivalent; port any styles it carried beyond Bulma's own by hand — see ${GUIDE}`
            );
            report(
              collector,
              filePath,
              i + 1,
              'sass',
              `${packageName} stylesheet partial dropped; port any styles it carried beyond Bulma’s own by hand`
            );
          }
        }
        changed = true;
        continue;
      }

      if (OTHER_BULMA_IMPORT.test(line) && !line.includes(TODO)) {
        const extension = line.match(EXTENSION_IMPORT);
        if (extension) {
          out.push(
            `// ${TODO}: bulma-${extension[1]} is a Bulma 0.9-era extension — check its Bulma v1 compatibility; the bestax extras already style Radio/Checkbox and the advanced form controls — see ${GUIDE}`
          );
          out.push(line);
          report(
            collector,
            filePath,
            i + 1,
            'sass',
            `third-party Bulma extension \`bulma-${extension[1]}\` left in place; verify it against Bulma v1 or replace it with the bestax extras`
          );
          changed = true;
          continue;
        }
        out.push(
          `// ${TODO}: Bulma v1 uses @use instead of @import — see ${GUIDE}`
        );
        out.push(line);
        report(
          collector,
          filePath,
          i + 1,
          'sass',
          'unrecognized Bulma @import left in place; convert to @use by hand'
        );
        changed = true;
        continue;
      }

      out.push(line);
    }

    return changed ? out.join('\n') : null;
  };

  return transformStyles;
}
