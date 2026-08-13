/**
 * Parse the dated annotations on pnpm-workspace.yaml's supply-chain bypasses.
 *
 * Three lists in that file weaken a default we otherwise hold: `overrides`
 * forces a transitive version, `minimumReleaseAgeExclude` waives the cooldown,
 * and `auditConfig.ignoreGhsas` waives the audit gate itself. Each entry is
 * meant to be temporary — it stops being load-bearing once the ecosystem
 * catches up — but nothing made that expiry observable, so entries outlived
 * their own stated reason and were only ever noticed by an unrelated PR that
 * happened to audit the file (#391).
 *
 * The contract this parser reads: every entry carries either
 *
 *   # bestax:review YYYY-MM-DD — why this date
 *   # bestax:permanent — why this is not debt
 *
 * in the comment block directly above it. The dated form is a review-by, not a
 * hard deadline: the date passing means "re-check whether this is still
 * needed", which is a decision, not a removal.
 *
 * Line scanning rather than a YAML library, matching parseWorkspacePackages in
 * check-conformance.mjs: the repo declares no YAML parser anywhere, and adding
 * one to police the cooldown would itself be subject to the cooldown.
 */

/** Lists we police, in file order, with the vocabulary each violation uses. */
export const BYPASS_BLOCKS = [
  {
    key: 'overrides',
    // `overrides:` sits at column 0; its entries are `key: value` pairs. The
    // trailing `.*` swallows any inline comment — only the key is used.
    header: /^overrides:\s*$/,
    entry: /^\s+(.+?):\s*\S.*$/,
    label: 'overrides',
  },
  {
    key: 'minimumReleaseAgeExclude',
    header: /^minimumReleaseAgeExclude:\s*$/,
    entry: /^\s+-\s*([^\s#]+)\s*(?:#.*)?$/,
    label: 'minimumReleaseAgeExclude',
  },
  {
    key: 'ignoreGhsas',
    // Nested under `auditConfig:`, so the header itself is indented.
    header: /^\s+ignoreGhsas:\s*$/,
    entry: /^\s+-\s*([^\s#]+)\s*(?:#.*)?$/,
    label: 'auditConfig.ignoreGhsas',
  },
];

// Capture the rest of the marker line too: the contract asks for a reason, and
// an unexplained bypass is the thing this whole gate exists to prevent.
const REVIEW = /#\s*bestax:review\b[ \t]*(\S+)?[ \t]*(.*)$/m;
const PERMANENT = /#\s*bestax:permanent\b[ \t]*(.*)$/m;

// `String.match` without /g keeps only the first hit, so counting is the only
// way to notice a block carrying two markers — where the first would silently
// win and the other be ignored.
const countMatches = (text, re) =>
  (text.match(new RegExp(re.source, 'gm')) ?? []).length;

const unquote = s => s.replace(/^['"]|['"]$/g, '');

const indentOf = line => line.length - line.trimStart().length;

/**
 * A real calendar date in ISO form, not merely ten digits shaped like one.
 * `9999-99-99` matches a naive pattern and then sorts after every real date,
 * so a typo would silently make a bypass permanent — the exact failure this
 * check exists to catch.
 */
const isCalendarDate = s => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  // `toISOString` throws on an Invalid Date rather than returning a mismatch,
  // which would take the whole conformance run down with a stack trace.
  const parsed = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === s;
};

// Reasons are prose, so accept any separator the house comments already use
// (em dash, hyphen, colon) and just require some words after it.
const hasReason = text =>
  /[\p{L}\p{N}]{3}/u.test(text.replace(/^[\s—:-]+/, ''));

/**
 * Read the one annotation a comment block is allowed to carry.
 *
 * Returns `{review, permanent, error}`. Anything malformed becomes an `error`
 * rather than a silent pass, because every malformed shape here fails OPEN:
 * an unparsed date never arrives, and a stray `bestax:permanent` outranks a
 * real review date.
 */
function readAnnotation(text) {
  const review = text.match(REVIEW);
  const permanent = text.match(PERMANENT);
  const none = { review: null, permanent: false };

  // Exactly one marker, whatever the mix. Two of the same kind is the likelier
  // mistake in practice — adding a fresh date above a stale one instead of
  // replacing it — and only the first would be read.
  const total = countMatches(text, REVIEW) + countMatches(text, PERMANENT);
  if (total > 1) {
    return {
      ...none,
      error:
        `carries ${total} \`bestax:\` markers; only the first would be read ` +
        `and the rest silently ignored. Keep exactly one — replace a stale ` +
        `date rather than stacking a new line above it.`,
    };
  }
  if (permanent) {
    return hasReason(permanent[1])
      ? { review: null, permanent: true, error: null }
      : {
          ...none,
          error:
            '`bestax:permanent` has no reason. Write ' +
            '`# bestax:permanent — why this is standing policy, not debt`.',
        };
  }
  if (review) {
    if (!isCalendarDate(review[1] ?? '')) {
      return {
        ...none,
        error:
          `\`bestax:review\` date ${JSON.stringify(review[1] ?? '')} is not a ` +
          `real calendar date in YYYY-MM-DD form. An unparseable date never ` +
          `comes due, so this would be a permanent bypass by typo.`,
      };
    }
    return hasReason(review[2])
      ? { review: review[1], permanent: false, error: null }
      : {
          ...none,
          error:
            '`bestax:review` has a date but no reason. Write ' +
            '`# bestax:review YYYY-MM-DD — why this date`.',
        };
  }
  return { ...none, error: null };
}

/**
 * Every bypass entry in the file, each with the annotation found in the comment
 * block immediately above it.
 *
 * A comment block is the run of consecutive `#` lines ending at the entry, and
 * it belongs to exactly ONE entry: the block is consumed when its entry is
 * read, so a second entry sitting directly beneath inherits nothing. Sharing
 * one marker across a group would fail open — appending a bypass under an
 * annotated neighbour, with no comment of its own, would silently borrow that
 * neighbour's date. It is also wrong on the merits: `brace-expansion@1` can
 * become droppable while `@5` is still load-bearing, so each line is its own
 * decision and carries its own date.
 *
 * A blank line breaks the association too: a comment separated from the entry
 * by whitespace is prose about the section, not that entry's annotation.
 *
 * A block ends only at a real dedent — a non-blank line indented no further
 * than its header. Ending it at the first line the entry pattern does not
 * match would fail OPEN: one unsupported-but-valid line (`- GHSA-x # note`
 * before inline comments were handled) would drop that entry and every entry
 * below it, while the other blocks kept the total nonzero and the gate green.
 * Indented lines that do not parse are reported instead, via `problems`.
 *
 * @returns {{entries: {name: string, block: string, label: string,
 *   line: number, review: string|null, permanent: boolean,
 *   error: string|null}[], problems: {line: number, why: string}[]}}
 */
export function parseBypassEntries(yaml) {
  const entries = [];
  const problems = [];
  const lines = yaml.split(/\r?\n/);
  let active = null;
  let headerIndent = 0;
  let comments = [];

  const endBlock = () => {
    active = null;
    comments = [];
  };

  for (const [i, line] of lines.entries()) {
    const header = BYPASS_BLOCKS.find(b => b.header.test(line));
    if (header) {
      active = header;
      headerIndent = indentOf(line);
      comments = [];
      continue;
    }
    if (!active) continue;

    if (!line.trim()) {
      // Blank line: ends the comment association, but not the block — the
      // audit-exceptions banner sits between `auditConfig:` and its list.
      comments = [];
      continue;
    }
    if (indentOf(line) <= headerIndent) {
      // Dedent to a sibling or parent key: the block is genuinely over.
      endBlock();
      continue;
    }
    if (line.trimStart().startsWith('#')) {
      comments.push(line);
      continue;
    }

    const item = line.match(active.entry);
    if (!item) {
      problems.push({
        line: i + 1,
        why:
          `inside \`${active.label}\` but not recognisable as an entry: ` +
          `${JSON.stringify(line.trim())}. Teach ` +
          `scripts/lib/bypass-annotations.mjs this shape — an unparsed line ` +
          `here means an unpoliced bypass.`,
      });
      continue;
    }

    entries.push({
      name: unquote(item[1].trim()),
      block: active.key,
      label: active.label,
      line: i + 1,
      ...readAnnotation(comments.join('\n')),
    });
    // Consume the block: it annotated this entry and nothing else. The next
    // entry needs its own marker or it is unannotated.
    comments = [];
  }

  return { entries, problems };
}

/**
 * Split parsed entries into the three failure modes and the healthy rest.
 *
 * `today` is passed in rather than read from the clock so the check is
 * testable and so a single run cannot disagree with itself across midnight.
 * Comparison is lexicographic on ISO dates, which is ordering-correct and
 * sidesteps timezone drift entirely: an entry is due the day it names — and
 * `isCalendarDate` has already guaranteed both sides are really dates.
 */
export function findExpired(entries, today) {
  const expired = [];
  const unannotated = [];
  const malformed = [];

  for (const entry of entries) {
    // A malformed annotation is neither permanent nor absent — reporting it as
    // either would tell the author the wrong fix.
    if (entry.error) {
      malformed.push(entry);
      continue;
    }
    if (entry.permanent) continue;
    if (!entry.review) {
      unannotated.push(entry);
      continue;
    }
    if (entry.review <= today) expired.push(entry);
  }

  return { expired, unannotated, malformed };
}
