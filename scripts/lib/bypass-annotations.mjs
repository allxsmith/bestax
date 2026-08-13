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
    // `overrides:` sits at column 0; its entries are `key: value` pairs.
    header: /^overrides:\s*$/,
    entry: /^\s+(.+?):\s*\S.*$/,
    label: 'overrides',
  },
  {
    key: 'minimumReleaseAgeExclude',
    header: /^minimumReleaseAgeExclude:\s*$/,
    entry: /^\s+-\s*(\S+)\s*$/,
    label: 'minimumReleaseAgeExclude',
  },
  {
    key: 'ignoreGhsas',
    // Nested under `auditConfig:`, so the header itself is indented.
    header: /^\s+ignoreGhsas:\s*$/,
    entry: /^\s+-\s*(\S+)\s*$/,
    label: 'auditConfig.ignoreGhsas',
  },
];

const REVIEW = /#\s*bestax:review\s+(\d{4}-\d{2}-\d{2})\b/;
const PERMANENT = /#\s*bestax:permanent\b/;

const unquote = s => s.replace(/^['"]|['"]$/g, '');

/**
 * Every bypass entry in the file, each with the annotation found in the comment
 * block immediately above it.
 *
 * A comment block is the run of consecutive `#` lines ending at the entry. A
 * blank line breaks the association deliberately: a comment separated from the
 * entry by whitespace is prose about the section, not that entry's annotation.
 * Entries sharing one comment block (the four brace-expansion majors) each
 * inherit it, which is why the annotation is read per entry rather than
 * consumed by the first one.
 *
 * @returns {{name: string, block: string, label: string, line: number,
 *   review: string|null, permanent: boolean}[]}
 */
export function parseBypassEntries(yaml) {
  const entries = [];
  const lines = yaml.split(/\r?\n/);
  let active = null;
  let comments = [];
  let afterEntry = false;

  for (const [i, line] of lines.entries()) {
    const header = BYPASS_BLOCKS.find(b => b.header.test(line));
    if (header) {
      active = header;
      comments = [];
      afterEntry = false;
      continue;
    }
    if (!active) continue;

    if (!line.trim()) {
      // Blank line: ends the comment association, but not the block — the
      // audit-exceptions banner sits between `auditConfig:` and its list.
      comments = [];
      continue;
    }
    if (line.trimStart().startsWith('#')) {
      // A comment that follows an entry opens a new block rather than
      // extending the previous one. Without this, an unannotated entry would
      // inherit the date of whichever annotated entry happened to precede it.
      if (afterEntry) comments = [];
      comments.push(line);
      afterEntry = false;
      continue;
    }

    const item = line.match(active.entry);
    if (!item) {
      // A non-indented, non-comment line is the next top-level key.
      active = null;
      comments = [];
      afterEntry = false;
      continue;
    }

    const text = comments.join('\n');
    const review = text.match(REVIEW);
    entries.push({
      name: unquote(item[1].trim()),
      block: active.key,
      label: active.label,
      line: i + 1,
      review: review ? review[1] : null,
      permanent: PERMANENT.test(text),
    });
    // Consecutive entries with no comment between them share one block (the
    // four brace-expansion majors, js-yaml 3 and 4).
    afterEntry = true;
  }

  return entries;
}

/**
 * Split parsed entries into the two failure modes and the healthy rest.
 *
 * `today` is passed in rather than read from the clock so the check is
 * testable and so a single run cannot disagree with itself across midnight.
 * Comparison is lexicographic on ISO dates, which is ordering-correct and
 * sidesteps timezone drift entirely: an entry is due the day it names.
 */
export function findExpired(entries, today) {
  const expired = [];
  const unannotated = [];

  for (const entry of entries) {
    if (entry.permanent) continue;
    if (!entry.review) {
      unannotated.push(entry);
      continue;
    }
    if (entry.review <= today) expired.push(entry);
  }

  return { expired, unannotated };
}
