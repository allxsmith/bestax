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
