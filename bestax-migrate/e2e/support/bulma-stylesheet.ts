/**
 * Bulma v1's compiled stylesheet, for the suites that hold a bulma-classes
 * table to it. It is read from the copy bestax-bulma depends on, so a Bulma
 * release the library moves to is the one the tables answer to.
 *
 * `scripts/gen-mcp-index.mjs` imports `stylesheetClasses` too, for the class
 * names the MCP index ships, so the index and the vocabulary test read the
 * stylesheet with one walk. Node strips this file's types to load it there,
 * which keeps it to TypeScript that is only annotations.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

export function bulmaStylesheet(): string {
  const library = fs.realpathSync(
    path.join(packageRoot, 'node_modules', '@allxsmith', 'bestax-bulma')
  );
  return fs.readFileSync(
    createRequire(path.join(library, 'package.json')).resolve(
      'bulma/css/bulma.css'
    ),
    'utf8'
  );
}

export interface StylesheetRule {
  /** The selector list, as written. */
  readonly selector: string;
  /**
   * Inside an at-rule (`@media`, `@container`), so it holds only where that
   * applies.
   */
  readonly conditional: boolean;
  /** The declarations, as written. */
  readonly body: string;
}

/**
 * The stylesheet's style rules, in order. A compiled stylesheet nests
 * nothing but rules inside at-rules, and its strings hold no braces, so a
 * walk over the braces is enough; comments go first, since they can hold
 * either.
 */
export function stylesheetRules(css: string): StylesheetRule[] {
  const rules: StylesheetRule[] = [];
  const open: string[] = [];
  let text = '';
  for (const char of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (char === '{') {
      open.push(text.trim());
      text = '';
    } else if (char === '}') {
      const prelude = open.pop() ?? '';
      if (!prelude.startsWith('@')) {
        rules.push({
          selector: prelude,
          conditional: open.length > 0,
          body: text,
        });
      }
      text = '';
    } else if (char === ';' && open.length === 0) {
      // A statement at-rule (`@charset`) ends here, and is no selector.
      text = '';
    } else {
      text += char;
    }
  }
  return rules;
}

/** Class names used in the stylesheet's selectors. */
export function stylesheetClasses(css: string): Set<string> {
  const classes = new Set<string>();
  // Only selectors are read, so declaration bodies (which hold URLs like
  // `.svg`) never reach the match.
  for (const { selector } of stylesheetRules(css)) {
    const bare = selector
      .replace(/\[[^\]]*\]/g, '')
      .replace(/"[^"]*"|'[^']*'/g, '');
    // A name can carry an escaped character (`.is-gap-0\.5`), which the
    // class itself spells plainly.
    for (const match of bare.matchAll(/\.(-?[_a-zA-Z](?:[\w-]|\\.)*)/g)) {
      classes.add(match[1].replace(/\\(.)/g, '$1'));
    }
  }
  return classes;
}
