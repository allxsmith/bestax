/**
 * Find prose that goes stale on the next unrelated edit.
 *
 * Three shapes of text kept drawing review findings on #643 and were each
 * fixed by adding more of the same: a count of things written into a
 * sentence ("nineteen jobs", "9 occurrences"), a workflow run id pasted as
 * evidence, and a `path:123` line reference. None of them is wrong the day it
 * is written; all of them are wrong soon after, and nothing re-measures them.
 * The rules that replace them are in `.github/CLAUDE.md` ("How to be exact")
 * and `docs/CLAUDE.md`: a count lives in a command, evidence lives on the
 * issue, a reference names a step id or a heading.
 *
 * This scanner reads only prose: `#` comment lines in YAML, and markdown with
 * fenced blocks, inline code, HTML comments, and front matter masked out. A
 * count inside a shell string, a jq filter, or a code sample is never a hit,
 * because those are the commands the rule points people at.
 *
 * Numbers that are not counts of things are masked before matching: dates,
 * versions, SHAs, issue and PR references, percentages, durations, clock
 * times, and sizes. Number words start at "three" and include the magnitude
 * forms ("dozens of", "thousands of"): "one" and "two" are ordinary English
 * far more often than they are a tally.
 *
 * A line carrying `bestax:count-ok` is skipped. The marker is for the few
 * deliberate cases (a number the surrounding text already calls a scale, not
 * a checksum) and should say why on the same line.
 */

export const ALLOW_TOKEN = 'bestax:count-ok';

const NUMBER_WORDS =
  'three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|' +
  'fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|' +
  'thirty|forty|fifty|sixty|seventy|eighty|ninety|dozens?|hundreds?|' +
  'thousands?';

// Nouns whose count changes when code changes. A curated list, not a general
// plural rule: English spells plural nouns and third-person verbs the same, so
// matching any word ending in s turns "the script removes 8" and "4000 covers
// it" into counts. Precision matters more than recall here, because this gate
// blocks CI — a false positive teaches people to work around the check, while
// a miss only means the rule went uncaught once. Durations, sizes and ports
// are not counts of things and are masked below. Nor is a rhetorical
// enumeration: "three consequences" or "three things" introduces the list that
// follows it, and the list is right there to check, so those nouns stay out.
const COUNTED_NOUNS =
  'jobs?|hosts?|runs?|entries|entry|occurrences?|components?|props?|' +
  'packages?|workflows?|checks?|files?|lines?|rows?|copies|copy|attempts?|' +
  'reviews?|threads?|commits?|exports?|examples?|pages?|apps?|stories|' +
  'story|tests?|rules?|steps?|variables?|labels?|reviewers?|actors?|' +
  'members?|items?|services?|calls?|requests?|endpoints?|secrets?|' +
  'tokens?|branches|scripts?|generators?|sections?|tables?|bullets?|' +
  'skills?|libraries|library|artifacts?|targets?|sources?|hooks?|' +
  'flags?|inputs?|outputs?|fields?|keys?|paths?|variants?|levers?|' +
  'questions?|apis?|options?|ways?|kinds?|modes?|reasons?|cases?|' +
  'surfaces?|helpers?|classes|utilities|styles?|strategies|strategy|' +
  'shapes?|blocks?|viewports?|fixes|breakpoints?|tabs?';

const NUMBER = `(?:${NUMBER_WORDS}|\\d{1,4})`;

const PATTERNS = [
  {
    why: 'count',
    // "nineteen jobs", "9 occurrences", "fifteen of its API calls" — a
    // number followed within three words by a counted noun.
    re: new RegExp(
      `\\b${NUMBER}\\b(?:[\\s-]+[\\w']+){0,3}?[\\s-]+(?:${COUNTED_NOUNS})\\b`,
      'i'
    ),
  },
  {
    why: 'count',
    // "nineteen of them", "twelve of those", "all three are regenerated" —
    // idioms that count without naming what they count.
    re: new RegExp(
      `\\b(?:all\\s+)?${NUMBER}\\s+(?:of\\s+(?:them|those|these)|so\\s+far)\\b` +
        `|\\ball\\s+${NUMBER}\\b`,
      'i'
    ),
  },
  {
    why: 'run id',
    // A bare integer of nine or more digits is a workflow run or job id.
    // Guides only: in a workflow comment or a CLAUDE.md a run id is the
    // receipt for the policy flip it justified, which `.github/CLAUDE.md`
    // asks for; in a published guide it is a statistic nothing re-measures.
    re: /\b\d{9,}\b/,
    kinds: ['guide'],
  },
  {
    why: 'line reference',
    // "claude-pr-loop.yml:224", "(:729)" style, or the words "line 224",
    // "lines 224-229", "L224".
    re: /(?:[\w./-]+\.(?:ya?ml|mdx?|[cm]?jsx?|tsx?|json|sh|scss|css|go|py|rs)|[\s(]):\d{1,4}(?:-\d{1,4})?\b|\b(?:lines?|L)\s?\d{1,4}(?:\s?[-–]\s?\d{1,4})?\b/i,
  },
];

// Numbers that are never counts of things. Each is blanked to spaces (length
// preserved so column positions in a message stay honest) before matching.
const NOT_A_COUNT = [
  /\b\d{4}-\d{2}-\d{2}\b/g, // dates
  /\b\d{1,2}:\d{2}(?::\d{2})?(?:Z|\s?(?:UTC|am|pm))?\b/gi, // clock times
  /\bv?\d+\.\d+(?:\.\d+)*(?:[-+][\w.]+)?\b/g, // versions
  /\b(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b/gi, // SHAs: a hex run with at least one letter, so a run id stays visible
  /#\d+\b/g, // issue and PR references
  /\b\d+(?:\.\d+)?\s?%/g, // percentages
  /\b\d+(?:\.\d+)?[\s-]?(?:ms|s|sec|secs|seconds?|min|mins|minutes?|h|hrs?|hours?|hourly|days?|weeks?|months?|years?)\b/gi, // durations, including "30-day"
  /\b\d+(?:\.\d+)?\s?(?:B|KB|MB|GB|KiB|MiB)\b/g, // sizes
  /\b(?:port|node|react|bulma|docusaurus|typescript|es)\s?\d+\b/gi, // named versions and ports
  /\b(?:step|rule|phase|stage|point|item|no\.|number)\s?\d+\b/gi, // identifiers, not tallies
  /\b\d+\s?[-–—]\s?\d+\b/g, // a range is guidance ("a 1-3 sentence hook"), not a tally
  /\b\d+-(?:column|row|cell|bit|byte|core|only)\b/gi, // named systems, not inventories
];

function blank(str, re) {
  return str.replace(re, m => ' '.repeat(m.length));
}

function maskNotCounts(line) {
  let out = line;
  for (const re of NOT_A_COUNT) out = blank(out, re);
  return out;
}

// Inline code, HTML comments and URLs on one line (an issue-comment anchor
// is a nine-digit number too). Multi-line HTML comments are handled by the
// markdown masker below; the comment pattern still spans newlines so it
// cannot half-match a comment if this is ever handed more than one line.
function maskInline(line) {
  let out = blank(blank(line, /(`+)[\s\S]*?\1/g), /<!--[\s\S]*?-->/g);
  // A link's visible text is prose and its destination is not, so keep the
  // text and blank the rest; emphasis markers go the same way. Without this a
  // count inside a link or in bold reads as markup and slips the detector.
  out = out.replace(
    /\[([^\]]*)\]\([^)]*\)/g,
    (m, text) => ' ' + text + ' '.repeat(m.length - text.length - 1)
  );
  // MDX comments, which the docs tree uses instead of the HTML form.
  out = blank(out, /\{\s*\/\*[\s\S]*?\*\/\s*\}/g);
  out = out.replace(/(\*\*|__|\*|_)(?=\S)/g, m => ' '.repeat(m.length));
  out = out.replace(/(?<=\S)(\*\*|__|\*|_)/g, m => ' '.repeat(m.length));
  return blank(out, /https?:\/\/\S+/g);
}

/**
 * The lines of a markdown file with fenced blocks, front matter, and HTML
 * comments blanked, so only prose remains. Fence detection follows the same
 * CommonMark rules as `fenceMask` in api-page.mjs (backtick or tilde runs of
 * three or more, closed by a run at least as long); it is inlined here so this
 * module depends on nothing.
 */
function proseLinesOfMarkdown(text) {
  const lines = text.split('\n');
  const out = new Array(lines.length).fill('');
  let i = 0;
  // front matter
  if (lines[0] === '---') {
    i = 1;
    while (i < lines.length && lines[i] !== '---') i++;
    i++;
  }
  let fence = null; // { char, len }
  let inHtml = false;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (fence) {
      const close = line.match(/^\s{0,3}(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fence.char && close[1].length >= fence.len) {
        fence = null;
      }
      continue;
    }
    const open = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (
      open &&
      !(open[1][0] === '`' && line.slice(open[0].length).includes('`'))
    ) {
      fence = { char: open[1][0], len: open[1].length };
      continue;
    }
    if (inHtml) {
      const end = line.indexOf('-->');
      if (end === -1) continue;
      inHtml = false;
      out[i] = ' '.repeat(end + 3) + line.slice(end + 3);
      continue;
    }
    let kept = line;
    const start = kept.indexOf('<!--');
    if (start !== -1 && !kept.includes('-->', start)) {
      inHtml = true;
      kept = kept.slice(0, start);
    }
    out[i] = kept;
  }
  return out;
}

/**
 * The `#` comment lines of a YAML file, with the marker stripped. Whole-line
 * comments only: a trailing `# …` after code is not scanned, because `#` also
 * appears inside shell strings and jq filters and telling the two apart needs
 * a real parser. Prose worth policing is written as its own line here anyway.
 */
function proseLinesOfYaml(text) {
  return text.split('\n').map(line => {
    const m = line.match(/^\s*#\s?(.*)$/);
    return m ? m[1] : '';
  });
}

/**
 * Scan `text` for fragile prose. `kind` is 'yaml' (comment lines only),
 * 'markdown' (prose outside code, comments and front matter), or 'guide'
 * (markdown that is published reference, where a run id is also a hit). Returns one
 * `{ line, why, text }` per offending line (1-based line numbers), naming the
 * first pattern that hit. A line containing `bestax:count-ok` is skipped.
 */
export function scanFragileProse(text, { kind }) {
  const raw = text.split('\n');
  const prose =
    kind === 'yaml' ? proseLinesOfYaml(text) : proseLinesOfMarkdown(text);
  // 'guide' is markdown for masking purposes; only the pattern set differs.
  const hits = [];
  // Markdown wraps sentences, so a count and its noun can straddle a line
  // break. Each line is scanned joined to the next, and a hit is reported at
  // the first of the two; the join is why a noun three words away still
  // matches when the author's editor happened to wrap there.
  const joined = prose.map((line, i) =>
    line.trim() && prose[i + 1]?.trim() ? `${line} ${prose[i + 1]}` : line
  );
  prose.forEach((line, idx) => {
    if (!line.trim()) return;
    if (raw[idx].includes(ALLOW_TOKEN)) return;
    if (raw[idx + 1]?.includes(ALLOW_TOKEN) && !line.trim()) return;
    // A line that cites an issue or PR is recording what happened there
    // ("twelve commits behind on #361"), and history does not go stale. The
    // maintained counts this rule exists for name no ticket.
    // A ticket makes a count historical, not a line number: "the guard at
    // foo.yml:42, fixed in #643" still cites a line that will move.
    const receipt = /#\d+\b/.test(line);
    const own = maskNotCounts(maskInline(line));
    const pair = maskNotCounts(maskInline(joined[idx]));
    for (const { why, re, kinds } of PATTERNS) {
      if (kinds && !kinds.includes(kind)) continue;
      if (receipt && why === 'count') continue;
      // The pair only widens the count rule: a run id or a line reference is
      // a single token and cannot straddle a break.
      const subject = why === 'count' ? pair : own;
      const m = subject.match(re);
      // A match that begins past this line belongs to the next one, which
      // reports it on its own turn; without this an unrelated first line
      // would absorb the hit and name the wrong line.
      if (m && m.index < line.length) {
        hits.push({
          line: idx + 1,
          why,
          text: m[0].replace(/\s+/g, ' ').trim(),
        });
        return;
      }
    }
  });
  return hits;
}

/** The house-format message for one hit, ready for check-conformance. */
export function describeHit(rel, hit) {
  return (
    `${rel} line ${hit.line}: "${hit.text}" — a ${hit.why} in prose goes ` +
    `stale; put the command that produces it, move the evidence to the ` +
    `issue, or mark the line ${ALLOW_TOKEN} with a reason`
  );
}
