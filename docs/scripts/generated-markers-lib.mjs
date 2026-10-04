/**
 * The `<!-- bestax:generated <id> -->` marker lines and the function that
 * strips them, with no side effects, so both strip-generated-markers.mjs and
 * scripts/gen-skills-repo.mjs can import it. That script runs main() on
 * import, which a guard on process.argv cannot reliably skip: node gives the
 * main module its real path while argv keeps a symlinked one.
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
 * CRLF) and joining the lines gives `src` back, with whether each is a
 * marker outside a fence.
 */
function scan(src) {
  const lines = src.split(/(?<=\n)/);
  const bare = lines.map(line => line.replace(/\r?\n$/, ''));
  const fenced = fenceMask(bare);
  const marker = bare.map((line, i) => !fenced[i] && MARKER_LINE.test(line));
  return { lines, bare, marker };
}

/** How many marker lines stripGeneratedMarkers would remove from `src`. */
export function countGeneratedMarkers(src) {
  return scan(src).marker.filter(Boolean).length;
}

/**
 * `src` with every marker line outside a fence removed, each with its own
 * line ending. A marker that sat between two blank lines would leave both,
 * opening a double gap, so the blank line after it goes too. No other line
 * changes, inside a fence or out.
 */
export function stripGeneratedMarkers(src) {
  const { lines, bare, marker } = scan(src);
  const out = [];
  let lastBlank = false;
  let gap = false;
  for (let i = 0; i < lines.length; i++) {
    if (marker[i]) {
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
  return out.join('');
}
