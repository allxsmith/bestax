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
        `|\\ball\\s+${NUMBER}\\b` +
        // A tally standing alone as its own sentence: "Three." opening a
        // section counts what the section then lists. Words only — a digit
        // at the start of a line is an ordered-list marker.
        `|^\\s*(?:${NUMBER_WORDS})\\s*[.:;]`,
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
 * Blank the comments in one line, carrying state across lines. Returns the
 * line with every commented span replaced by spaces (length preserved, so a
 * reported column still points at the right place) and the state to hand the
 * next line. Both spellings are handled, a line may open and close several,
 * and text after a close is scanned again — otherwise a second comment on the
 * same line would read as prose. Delimiters are looked for in a copy with
 * inline code blanked, so a backticked `{/*` does not open a comment.
 */
function stripComments(line, comment) {
  let out = '';
  let rest = line;
  for (;;) {
    if (comment) {
      const found = comment.close.exec(rest);
      comment.close.lastIndex = 0;
      if (!found) return { text: out + ' '.repeat(rest.length), comment };
      const after = found.index + found[0].length;
      out += ' '.repeat(after);
      rest = rest.slice(after);
      comment = null;
      continue;
    }
    const masked = blank(rest, /(`+)[\s\S]*?\1/g);
    let best = null;
    // HTML accepts `--!>` as well as `-->` to end a comment, so the close is
    // a pattern rather than a literal.
    for (const [open, close] of [
      ['<!--', /--!?>/g],
      ['{/*', /\*\/\}/g],
    ]) {
      const i = masked.indexOf(open);
      if (i !== -1 && (best === null || i < best.i)) best = { i, open, close };
    }
    if (best === null) return { text: out + rest, comment: null };
    best.close.lastIndex = best.i + best.open.length;
    const found = best.close.exec(masked);
    best.close.lastIndex = 0;
    if (!found) {
      return {
        text: out + rest.slice(0, best.i) + ' '.repeat(rest.length - best.i),
        comment: { close: best.close },
      };
    }
    const after = found.index + found[0].length;
    out += rest.slice(0, best.i) + ' '.repeat(after - best.i);
    rest = rest.slice(after);
  }
}

/**
 * The lines of a markdown file with fenced blocks, front matter, and comments
 * blanked, so only prose remains. Fence detection follows the same CommonMark
 * rules as `fenceMask` in api-page.mjs (backtick or tilde runs of three or
 * more, closed by a run at least as long); it is inlined here so this module
 * depends on nothing.
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
  let comment = null; // { close } while inside a multi-line comment
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (fence) {
      const close = line.match(/^\s{0,3}(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fence.char && close[1].length >= fence.len) {
        fence = null;
      }
      continue;
    }
    if (!comment) {
      const open = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (
        open &&
        !(open[1][0] === '`' && line.slice(open[0].length).includes('`'))
      ) {
        fence = { char: open[1][0], len: open[1].length };
        continue;
      }
    }
    const stripped = stripComments(line, comment);
    comment = stripped.comment;
    out[i] = stripped.text;
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
  // break — and with a narrow wrap, more than one. Each line is scanned
  // joined to the next few, enough to cover the three-word window the count
  // pattern allows, and a hit is reported at the line the match starts in.
  // The count pattern allows three words between the number and the noun, so
  // at one word per line the noun can be the fourth line down.
  const WINDOW = 4;
  const joined = prose.map((line, i) => {
    if (!line.trim()) return line;
    let text = line;
    for (let n = 1; n <= WINDOW && prose[i + n]?.trim(); n++) {
      text += ` ${prose[i + n]}`;
    }
    return text;
  });
  prose.forEach((line, idx) => {
    if (!line.trim()) return;
    // The marker only excuses a line when it says why: a bare token is the
    // reflexive exemption the rule exists to avoid.
    if (hasReasonedMarker(raw[idx], kind)) return;
    // A ticket makes a count historical: "twelve commits behind on #361"
    // records what happened there, and history does not go stale. It never
    // excuses a line reference, which moves whatever the history says.
    const ownTicket = /#\d+\b/.test(line);
    const pairTicket = /#\d+\b/.test(joined[idx]);
    const inline = maskInline(line);
    const pairInline = maskInline(joined[idx]);
    const own = maskNotCounts(inline);
    const pair = maskNotCounts(pairInline);
    for (const { why, re, kinds } of PATTERNS) {
      if (kinds && !kinds.includes(kind)) continue;
      // The pair only widens the count rule: a run id or a line reference is
      // a single token and cannot straddle a break, though the words of a
      // spelled-out one can ("see line" / "224"), so it reads the window too.
      // It reads the inline-masked text rather than the count-masked one,
      // because a locator like "lines 224-229" is itself the range those
      // masks remove.
      const subject =
        why === 'count' ? pair : why === 'line reference' ? pairInline : own;
      const m = subject.match(re);
      // A match beginning past this line belongs to the next, which reports
      // it on its own turn; without this an unrelated first line would
      // absorb the hit and name the wrong one.
      if (!m || m.index >= line.length) continue;
      if (why === 'count') {
        // A ticket on the next line only excuses a count that wraps into it.
        // Otherwise an unrelated reference below would clear the line above.
        const wraps = m.index + m[0].length > line.length;
        if (ownTicket || (wraps && pairTicket)) continue;
      }
      hits.push({
        line: idx + 1,
        why,
        text: m[0].replace(/\s+/g, ' ').trim(),
      });
      return;
    }
  });
  return hits;
}

/**
 * Whether the line carries the exemption marker AND says why, inside the same
 * comment. The reason has to sit between the token and that comment's closing
 * delimiter: prose after the comment is not a reason, and neither is the
 * delimiter itself. The token needs a boundary, so `bestax:count-okfoo` is a
 * typo rather than an exemption.
 */
function hasReasonedMarker(line, kind) {
  // Only a token inside a comment exempts anything. In markdown that means
  // one of the two comment spellings; prose or inline code that merely names
  // the marker is explaining it, not claiming it. A YAML prose line is itself
  // a comment, so its whole body counts.
  const spans =
    kind === 'yaml'
      ? [line.replace(/^\s*#\s?/, '')]
      : [
          ...line.matchAll(/<!--([\s\S]*?)(?:--!?>|$)/g),
          ...line.matchAll(/\{\/\*([\s\S]*?)(?:\*\/\}|$)/g),
        ].map(m => m[1]);
  const token = new RegExp(`${ALLOW_TOKEN}(?![\\w-])`);
  return spans.some(span => {
    const m = token.exec(span);
    return m ? /\w/.test(span.slice(m.index + m[0].length)) : false;
  });
}

/** The house-format message for one hit, ready for check-conformance. */
export function describeHit(rel, hit) {
  const remedy = {
    count:
      'put the command that produces it, or move the evidence to the issue',
    'run id': 'move the evidence to the issue and link it',
    'line reference':
      'cite a heading, a step id, a job name, a flag or a rule number instead',
  }[hit.why];
  return (
    `${rel} line ${hit.line}: "${hit.text}" — a ${hit.why} in prose goes ` +
    `stale; ${remedy}, or mark the line ${ALLOW_TOKEN} with a reason`
  );
}
