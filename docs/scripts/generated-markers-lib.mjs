/**
 * The `<!-- bestax:generated <id> -->` marker lines and the function that
 * strips them, with no side effects, so both strip-generated-markers.mjs and
 * scripts/gen-skills-repo.mjs can import it.
 *
 * Fence-aware, through the fence rules scripts/lib/api-page.mjs writes and
 * reads the regions with: a marker shown inside a fenced code block is
 * content, and so is every blank line there.
 *
 * That has one failure mode, and leakedMarkers is its guard. In a file that
 * joins many pages, such as llms-full.txt, one page that leaves a fence open
 * makes every marker after it look fenced, so they would all be kept.
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

/** The marker lines in `src`, as many outside a fence and as many inside. */
export function markerCounts(src) {
  const { fenced, marker } = scan(src);
  let unfenced = 0;
  let inFence = 0;
  marker.forEach((is, i) => {
    if (is && fenced[i]) inFence++;
    else if (is) unfenced++;
  });
  return { unfenced, fenced: inFence };
}

/** How many marker lines stripGeneratedMarkers would remove from `src`. */
export function countGeneratedMarkers(src) {
  return markerCounts(src).unfenced;
}

/**
 * `src` with every marker line outside a fence removed, each with its own
 * line ending, in one pass: `out` is the result, `stripped` the marker lines
 * removed, and `kept` the marker lines left because a fence holds them. A
 * marker that sat between two blank lines would leave both, opening a double
 * gap, so the blank line after it goes too. No other line changes, inside a
 * fence or out.
 */
export function stripMarkers(src) {
  const { lines, bare, fenced, marker } = scan(src);
  const out = [];
  let stripped = 0;
  let kept = 0;
  let lastBlank = false;
  let gap = false;
  for (let i = 0; i < lines.length; i++) {
    if (marker[i] && !fenced[i]) {
      stripped++;
      gap ||= lastBlank;
      continue;
    }
    if (marker[i]) kept++;
    const blank = bare[i] === '';
    if (gap && blank) {
      gap = false;
      continue;
    }
    gap = false;
    lastBlank = blank;
    out.push(lines[i]);
  }
  return { out: out.join(''), stripped, kept };
}

/** stripMarkers' text alone. */
export function stripGeneratedMarkers(src) {
  return stripMarkers(src).out;
}

/**
 * Why a stripped file cannot ship, or null. `kept` is stripMarkers' count
 * for the file, and `fencedInSources` the marker lines the source pages show
 * inside fences, which no single built file can hold more of. More than that
 * means a fence left open earlier in the file hid real markers.
 */
export function leakedMarkers(file, kept, fencedInSources) {
  if (kept <= fencedInSources) return null;
  return (
    `${file}: ${kept} marker line(s) are left inside code fences, and the ` +
    `source pages show ${fencedInSources} there. A code fence left open ` +
    `earlier in the file hides the rest, so they would ship.`
  );
}
