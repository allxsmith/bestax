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

/** The 0.9 root imports that become `@use "bulma/sass"`. */
const ROOT_IMPORT =
  /^(\s*)@import\s+(['"])~?bulma\/(?:bulma(?:\.sass|\.scss)?|css\/bulma(?:\.min)?\.css)\2\s*;?\s*$/;

/** 0.9 partial imports under bulma/sass/… */
const PARTIAL_IMPORT =
  /^(\s*)@import\s+(['"])~?bulma\/sass\/([\w/-]+)\2\s*;?\s*$/;

/** Any other line that still `@import`s something bulma-ish. */
const OTHER_BULMA_IMPORT = /^\s*@import\s+['"][^'"]*bulma[^'"]*['"]/;

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
      const indent = line.match(ROOT_IMPORT)?.[1] ?? '';
      if (foldableVars.length > 0) {
        out.push(`${indent}@use 'bulma/sass' with (`);
        foldableVars.forEach(({ name, value }, index) => {
          const comma = index < foldableVars.length - 1 ? ',' : '';
          out.push(`${indent}  $${name}: ${value}${comma}`);
        });
        out.push(`${indent});`);
      } else {
        out.push(`${indent}@use 'bulma/sass';`);
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
        out.push(`${indent}${EXTRAS_USE}`);
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
      const [, indent, , importPath] = partial;
      const segments = importPath.split('/');
      const last = segments[segments.length - 1].replace(/^_/, '');
      const dir = segments[0];
      if ((last === 'all' || last === 'index') && V1_DIRS.has(dir)) {
        out.push(`${indent}@use 'bulma/sass/${dir}';`);
        changed = true;
        continue;
      }
      const leaf = segments.map(s => s.replace(/^_/, '')).join('/');
      if (V1_DIRS.has(leaf) || V1_LEAVES.has(leaf)) {
        out.push(`${indent}@use 'bulma/sass/${leaf}';`);
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
