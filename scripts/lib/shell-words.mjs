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
 * `=`. Handles the `'\''` escape `quote` emits, and backslash escapes both
 * bare and inside double quotes, which is where /bin/sh honours them.
 *
 * Shell operators (`;`, `|`, `&`, `>`, `<`) terminate a word even without
 * whitespace, because `node ./a.mjs;node ./b.mjs` names two scripts and callers
 * that scan for paths must see both.
 *
 * Throws on an unbalanced quote rather than inventing a word. The shell would
 * reject that command outright, so silently accepting it would let a caller
 * assert things about a command that cannot run.
 */
export function tokenize(cmd) {
  const OPERATORS = new Set([';', '|', '&', '>', '<']);
  const words = [];
  let word = null;
  let quoteChar = null;

  const push = () => {
    if (word !== null) words.push(word);
    word = null;
  };

  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];

    if (quoteChar === "'") {
      // Single quotes are literal in sh: no escapes inside them at all.
      if (ch === "'") quoteChar = null;
      else word += ch;
      continue;
    }
    if (quoteChar === '"') {
      if (ch === '\\' && i + 1 < cmd.length && /["\\$`]/.test(cmd[i + 1])) {
        word += cmd[++i];
      } else if (ch === '"') {
        quoteChar = null;
      } else {
        word += ch;
      }
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
    if (OPERATORS.has(ch)) {
      push();
      // Operators are their own words, so a caller splitting on them still can.
      words.push(ch);
      continue;
    }
    if (/\s/.test(ch)) {
      push();
      continue;
    }
    word ??= '';
    word += ch;
  }

  if (quoteChar) {
    throw new Error(
      `shell-words: unbalanced ${quoteChar === "'" ? 'single' : 'double'} ` +
        `quote in: ${cmd}`
    );
  }
  push();
  return words;
}
