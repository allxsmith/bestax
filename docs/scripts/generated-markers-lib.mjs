/**
 * The `<!-- bestax:generated <id> -->` marker line and the function that
 * strips it, with no side effects, so scripts/gen-skills-repo.mjs can strip
 * the markers from the README it publishes.
 *
 * The strip is fence-aware, through the fence rules scripts/lib/api-page.mjs
 * writes and reads the regions with: a marker shown inside a fenced code
 * block is content, and so is every blank line there.
 */
import { fenceMask } from '../../scripts/lib/api-page.mjs';

/** One whole line that is a marker, opening or closing, with no line ending. */
export const MARKER_LINE =
  /^[ \t]*<!--[ \t]*\/?bestax:generated[ \t][^>]*-->[ \t]*$/;

/**
 * `src` with every marker line outside a fence removed, each with its own
 * line ending (LF or CRLF), in one pass. A marker that sat between two blank
 * lines would leave both, opening a double gap, so the blank line after it
 * goes too. No other line changes, inside a fence or out.
 */
export function stripGeneratedMarkers(src) {
  const lines = src.split(/(?<=\n)/);
  const bare = lines.map(line => line.replace(/\r?\n$/, ''));
  const fenced = fenceMask(bare);
  const out = [];
  let lastBlank = false;
  let gap = false;
  for (let i = 0; i < lines.length; i++) {
    if (!fenced[i] && MARKER_LINE.test(bare[i])) {
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
