/**
 * Drops import lines and `export default` lines from a live example.
 *
 * The live editor evaluates an example with the library already in scope, so
 * these lines would be syntax errors there. The sandbox converter starts from
 * the same stripped text and writes its own imports, which keeps the two
 * readings of an example identical. One line at a time, so a multi-line
 * import would leave its tail behind; no example uses one.
 *
 * @param {string} code
 * @returns {string}
 */
export function stripModuleLines(code) {
  return code
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return (
        !trimmed.startsWith('import') && !trimmed.startsWith('export default')
      );
    })
    .join('\n');
}

/**
 * The stylesheets an example imports for their effect, such as
 * `import '@allxsmith/bestax-bulma/versions/bestax-prefixed.css';`, in the
 * order it imports them. Read one line at a time, as `stripModuleLines` drops
 * them, and a comment after the import is allowed.
 *
 * @param {string} code
 * @returns {string[]}
 */
export function importedStylesheets(code) {
  const sheets = [];
  for (const line of code.split('\n')) {
    const match = line
      .trim()
      .match(/^import\s+(['"])([^'"]+\.css)\1\s*;?\s*(?:\/\/.*)?$/);
    if (match && !sheets.includes(match[2])) sheets.push(match[2]);
  }
  return sheets;
}
