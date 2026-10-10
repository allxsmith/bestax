/**
 * The `<!-- bestax:generated <id> -->` marker lines and the functions that
 * count and strip them, with no side effects, so scripts/gen-skills-repo.mjs
 * can strip them from the README it publishes and check-generated-markers.mjs
 * can count them in the source pages.
 *
 * Fence-aware, through the fence rules scripts/lib/api-page.mjs writes and
 * reads the regions with: a marker shown inside a fenced code block is
 * content, and so is every blank line there.
 */
import { fenceMask } from '../../scripts/lib/api-page.mjs';

/** One whole line that is a marker, opening or closing, with no line ending. */
export const MARKER_LINE =
  /^[ \t]*<!--[ \t]*\/?bestax:generated[ \t][^>]*-->[ \t]*$/;

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
