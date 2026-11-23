/**
 * Fenced code in the markdown the server serves, and the sections a helper
 * guide splits into around it.
 *
 * Dependency-free, and in plain erasable TypeScript, on purpose:
 * `scripts/gen-mcp-index.mjs` loads this file with node's type stripping, so
 * the notes it adds to a guide's sections land in the sections
 * `get_helper_props` serves (#2243).
 */

/**
 * The fence open after a line, given the one open before it: the opening run
 * with its indent, or null. A run of three or more backticks or tildes, at any
 * indent, as in a list item, opens one. Only a run of its own character, at
 * least as long, with nothing after it, indented at most three more than the
 * opening run, closes it, so "```ts" inside a "```" fence is code, and so is a
 * run an example indents deeper. A backtick run with a backtick after it is a
 * code span (```a```), which opens nothing.
 */
export function fenceAfter(line: string, open: string | null): string | null {
  // A line split from CRLF text keeps its \r, and is read the same.
  const marker = line.match(/^([ \t]*)(`{3,}|~{3,})([^\r]*)\r?$/);
  if (!marker) return open;
  const [, indent, run, after] = marker;
  if (open === null) {
    return run[0] === '`' && after.includes('`') ? null : indent + run;
  }
  const openRun = open.trimStart();
  const openIndent = open.length - openRun.length;
  const closes =
    run[0] === openRun[0] &&
    run.length >= openRun.length &&
    !after.trim() &&
    indent.length <= openIndent + 3;
  return closes ? null : open;
}

/** A heading a helper guide starts a section at. */
const SECTION_HEADING = /^#{2,3} /;

/**
 * A helper guide's sections, each starting at a `##` or `###` heading outside
 * fenced code, with the text before the first heading as a section of its own.
 * A heading line inside a fence, in an example's template literal, say, is
 * code. Joined with a newline, the sections give back the guide.
 */
export function sections(doc: string): string[] {
  const out: string[][] = [[]];
  let fence: string | null = null;
  for (const line of doc.split('\n')) {
    const current = out[out.length - 1];
    if (fence === null && SECTION_HEADING.test(line) && current.length) {
      out.push([line]);
    } else {
      current.push(line);
    }
    fence = fenceAfter(line, fence);
  }
  return out.map(lines => lines.join('\n'));
}
