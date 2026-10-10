/**
 * The `<!-- bestax:generated <id> -->` marker lines, the function that strips
 * them, and the checks for any marker left, with no side effects, so both
 * strip-generated-markers.mjs and scripts/gen-skills-repo.mjs can import it.
 *
 * Fence-aware, through the fence rules scripts/lib/api-page.mjs writes and
 * reads the regions with: a marker shown inside a fenced code block is
 * content, and so is every blank line there. A fence left open hides every
 * marker after it, which is what unclosedFence is for.
 */
import { fenceMask, fenceSpans } from '../../scripts/lib/api-page.mjs';

/** One whole line that is a marker, opening or closing, with no line ending. */
export const MARKER_LINE =
  /^[ \t]*<!--[ \t]*\/?bestax:generated[ \t][^>]*-->[ \t]*$/;

/** A marker comment anywhere in a line, as written or HTML-escaped. */
const MARKER = /(?:<|&lt;)!--[ \t]*\/?bestax:generated\b/;

/** An inline code span: a run of backticks, text, and a run as long. */
const CODE_SPAN = /(?<!`)(`+)(?!`).+?(?<!`)\1(?!`)/g;

/**
 * `src` split after each newline, so each line keeps its own ending (LF or
 * CRLF) and joining the lines gives `src` back, with each line's text and
 * whether it is a marker and whether a fence holds it.
 */
function scan(src) {
  const lines = src.split(/(?<=\n)/);
  const bare = lines.map(line => line.replace(/\r?\n$/, ''));
  const fenced = fenceMask(bare);
  const marker = bare.map(line => MARKER_LINE.test(line));
  return { lines, bare, fenced, marker };
}

/** How many marker lines stripGeneratedMarkers would remove from `src`. */
export function countGeneratedMarkers(src) {
  const { fenced, marker } = scan(src);
  return marker.filter((is, i) => is && !fenced[i]).length;
}

/**
 * `src` with every marker line outside a fence removed, each with its own
 * line ending, in one pass: `out` is the result and `stripped` the marker
 * lines removed. A marker that sat between two blank lines would leave both,
 * opening a double gap, so the blank line after it goes too. No other line
 * changes, inside a fence or out.
 */
export function stripMarkers(src) {
  const { lines, bare, fenced, marker } = scan(src);
  const out = [];
  let stripped = 0;
  let lastBlank = false;
  let gap = false;
  for (let i = 0; i < lines.length; i++) {
    if (marker[i] && !fenced[i]) {
      stripped++;
      gap ||= lastBlank;
      continue;
    }
    const blank = bare[i] === '';
    if (gap && blank) {
      gap = false;
      continue;
    }
    gap = false;
    lastBlank = blank;
    out.push(lines[i]);
  }
  return { out: out.join(''), stripped };
}

/** stripMarkers' text alone. */
export function stripGeneratedMarkers(src) {
  return stripMarkers(src).out;
}

/**
 * The lines of `src`, numbered from 1, that hold a marker comment, as written
 * or HTML-escaped, outside code: outside a fenced block and outside an inline
 * code span. Prose that names `bestax:generated` without the comment syntax
 * is not a marker.
 */
export function markersOutsideCode(src) {
  const { bare, fenced } = scan(src);
  const found = [];
  bare.forEach((line, i) => {
    if (!fenced[i] && MARKER.test(line.replace(CODE_SPAN, ''))) {
      found.push(i + 1);
    }
  });
  return found;
}

/**
 * The line, numbered from 1, of a fence that `src` opens and never closes, or
 * 0. Everything after such a fence reads as code, so markersOutsideCode
 * passes over it.
 */
export function unclosedFence(src) {
  const { bare } = scan(src);
  // No fence closes on an empty line, so one still open at the end of `src`
  // is the only span that reaches the line added here.
  const last = fenceSpans([...bare, '']).at(-1);
  return last?.close === bare.length ? last.open + 1 : 0;
}
