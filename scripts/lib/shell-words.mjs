/**
 * POSIX shell quoting and its inverse, in one place (#436).
 *
 * These two are halves of one contract. `quote` builds the commands in
 * bestax-migrate/release.config.js; `tokenize` is how
 * scripts/check-conformance.mjs reads those same commands back to find the
 * script paths they name. They lived in different files, implemented
 * differently, with nothing linking them, and they disagreed: quote emits the
 * `'\''` escape for an embedded apostrophe, and tokenize stripped quote
 * characters blindly, so a checkout path containing an apostrophe quoted
 * correctly for the shell and then tokenized into a path that does not exist.
 *
 * That is the same two-implementations-of-one-rule shape #435 was created to
 * catch, so they are colocated and the round trip is asserted directly
 * (scripts/shell-words.test.mjs) rather than left to agree by inspection.
 */

/** Single-quote a value for /bin/sh, escaping embedded apostrophes. */
export function quote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

/**
 * Split a command into shell words, undoing one level of quoting.
 *
 * A word is a run of quoted and unquoted chunks with no whitespace between
 * them, so `--dir='/My Projects/x'` stays one word rather than splitting at the
 * `=`. Handles the `'\''` escape `quote` emits.
 */
export function tokenize(cmd) {
  const words = [];
  let word = null;
  let quoteChar = null;

  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];

    if (quoteChar) {
      if (ch === quoteChar) quoteChar = null;
      else word += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quoteChar = ch;
      word ??= '';
      continue;
    }
    if (ch === '\\' && i + 1 < cmd.length) {
      word ??= '';
      word += cmd[++i];
      continue;
    }
    if (/\s/.test(ch)) {
      if (word !== null) words.push(word);
      word = null;
      continue;
    }
    word ??= '';
    word += ch;
  }
  if (word !== null) words.push(word);
  return words;
}
