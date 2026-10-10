/**
 * The CSS variables `Theme` accepts, read from its source.
 *
 * `bulma-ui/src/helpers/Theme.tsx` keeps them in two tuples, by where Bulma
 * declares each one: `bulmaGlobalVars`, which a value set on an ancestor
 * reaches, and `bulmaComponentVars`, which Bulma declares on the component's
 * own element and Theme therefore cannot change (#1021). `bulmaCssVars` is
 * the two spread together, and is what the `BulmaVars` type and the variable
 * props are built from.
 *
 * Read as text because neither tuple is exported, and widening the library's
 * public API to make a guard convenient is the wrong trade. A brittle read is
 * acceptable BECAUSE it is asserted: when a pattern stops matching, this
 * throws and says what moved, rather than returning an empty or partial list
 * that would make every check built on it pass, or pass over the keys it
 * missed.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const THEME_SOURCE = join(
  dirname(dirname(dirname(fileURLToPath(import.meta.url)))),
  'bulma-ui',
  'src',
  'helpers',
  'Theme.tsx'
);

/** One named `as const` tuple of `--bulma-*` keys. */
function tuple(source, name) {
  const block = source.match(
    new RegExp(`\\nconst ${name} = \\[\\n([\\s\\S]*?)\\n\\] as const;`)
  );
  if (!block) {
    throw new Error(
      `could not find the \`${name}\` tuple in Theme.tsx. It is one half of ` +
        'the variables Theme accepts, so nothing that reads them can run. ' +
        'Fix this pattern in the same change that moved it.'
    );
  }
  // The body is read as a whole: comments dropped, split on commas, and
  // every entry required to be one quoted key. A per-line pattern skipped
  // any line it could not read, so a key with a trailing comment, or the
  // last one without a comma, fell out of every check built on this read
  // with no error, which is as quiet as an empty read and harder to spot.
  const body = block[1]
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  const keys = body
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(entry => {
      const key = entry.match(/^(['"])(--bulma-[a-z0-9-]+)\1$/);
      if (!key) {
        throw new Error(
          `could not read \`${entry}\` in the \`${name}\` tuple in ` +
            'Theme.tsx. Every entry has to be one quoted `--bulma-` key, or ' +
            'it drops out of every check built on this read. Fix the entry, ' +
            'or this reader, in the same change.'
        );
      }
      return key[2];
    });
  if (keys.length === 0) {
    throw new Error(`the \`${name}\` tuple in Theme.tsx read as empty`);
  }
  return keys;
}

/**
 * `{ global, component, all }`: the two tuples, and every key Theme accepts.
 * Throws unless `bulmaCssVars` is exactly the two spread together, since
 * that is what makes `all` the variables Theme intercepts.
 */
export function themeVars(source = readFileSync(THEME_SOURCE, 'utf8')) {
  const global = tuple(source, 'bulmaGlobalVars');
  const component = tuple(source, 'bulmaComponentVars');
  if (
    !/\nconst bulmaCssVars = \[\.\.\.bulmaGlobalVars, \.\.\.bulmaComponentVars\] as const;/.test(
      source
    )
  ) {
    throw new Error(
      'Theme.tsx no longer builds `bulmaCssVars` as ' +
        '`[...bulmaGlobalVars, ...bulmaComponentVars]`, so the two tuples ' +
        'read here may not be the variables Theme accepts. Re-derive both ' +
        'sides and fix this pattern in the same change.'
    );
  }
  return { global, component, all: [...global, ...component] };
}
