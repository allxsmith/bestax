/**
 * Stylesheet migration for react-bulma-components apps: Bulma 0.9 Sass
 * (`@import` + `$var !default` overrides, `_all` aggregator partials) →
 * Bulma v1 modules (`@use "bulma/sass" with (…)`), plus the bestax extras.
 *
 * Sass has no jscodeshift parser, so this is a conservative line-based text
 * transform: it only rewrites patterns it can prove safe and leaves a
 * `// TODO(bestax-migrate): …` everywhere else (line comments are valid in
 * both SCSS and indented Sass).
 */

import path from 'node:path';
import type { StylesTransform, TodoCollector } from '../../types.js';

const TODO = 'TODO(bestax-migrate)';
const GUIDE =
  'https://bestax.io/docs/guides/getting-started/migration/react-bulma-components';
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
 * by the bestax extras.
 */
const EXTENSION_IMPORT =
  /^\s*@import\s+['"][^'"]*\bbulma-([\w-]+?)(?:\/|\.|['"])/;

/** Any `$name: value;` declaration (with or without `!default`). */
const VAR_DECL = /^\s*\$([\w-]+)\s*:\s*(.+?)\s*(!default)?\s*;\s*$/;

/**
 * A value is fold-safe for `with (…)` when it is a plain literal — no
 * function calls, interpolation, variable references, or at-rules. Hex
 * colors (`#ff6b35`) are fine; `#{…}` interpolation is not.
 */
function isFoldableValue(value: string): boolean {
  return !/[()$@]|#\{/.test(value);
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

export const transformStyles: StylesTransform = (
  filePath,
  source,
  collector,
  options
) => {
  const cssMode = options.cssMode ?? 'bestax';
  if (!/bulma/.test(source)) return null;

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

  // Pass 1: find safe leading variable overrides and the first root import.
  const rootImportIndex = lines.findIndex(line => ROOT_IMPORT.test(line));
  const foldableVars: Array<{ index: number; name: string; value: string }> =
    [];
  const unsafeVarLines: number[] = [];
  if (rootImportIndex !== -1) {
    for (let i = 0; i < rootImportIndex; i += 1) {
      const line = lines[i];
      const match = line.match(VAR_DECL);
      if (match && isFoldableValue(match[2])) {
        foldableVars.push({ index: i, name: match[1], value: match[2].trim() });
      } else if (/^\s*\$[\w-]+\s*:/.test(line)) {
        unsafeVarLines.push(i);
      }
    }
  }
  const folded = new Set(foldableVars.map(v => v.index));

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (i === rootImportIndex) {
      const rootMatch = line.match(ROOT_IMPORT);
      const indent = rootMatch?.[1] ?? '';
      const bulmaSass = `${keptPrefix(rootMatch?.[3])}bulma/sass`;
      if (foldableVars.length > 0) {
        out.push(`${indent}@use '${bulmaSass}' with (`);
        foldableVars.forEach(({ name, value }, index) => {
          const comma = index < foldableVars.length - 1 ? ',' : '';
          out.push(`${indent}  $${name}: ${value}${comma}`);
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
          i + 1,
          'sass',
          'variable overrides with computed values could not be folded into `with (…)`'
        );
      }
      if (cssMode === 'bestax' && !extrasAdded) {
        // A path-prefixed root import means the toolchain resolves raw file
        // paths, not package specifiers — point at the shipped file directly.
        const extrasPrefix = keptPrefix(rootMatch?.[3]);
        out.push(
          extrasPrefix
            ? `${indent}@use '${extrasPrefix}@allxsmith/bestax-bulma/src/scss/extras';`
            : `${indent}${EXTRAS_USE}`
        );
        extrasAdded = true;
      }
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
