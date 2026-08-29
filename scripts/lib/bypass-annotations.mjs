/**
 * Parse the dated annotations on pnpm-workspace.yaml's supply-chain bypasses.
 *
 * Four lists in that file weaken a default we otherwise hold: `allowBuilds`
 * re-enables install/postinstall lifecycle scripts, `overrides` forces a
 * transitive version, `minimumReleaseAgeExclude` waives the cooldown, and
 * `auditConfig.ignoreGhsas` waives the audit gate itself.
 *
 * Each entry is meant to be temporary — it stops being load-bearing once the
 * ecosystem catches up — but nothing made that expiry observable, so entries
 * outlived their own stated reason and were only ever noticed by an unrelated
 * PR that happened to audit the file (#391).
 *
 * `allowBuilds` is the odd one, and why it arrived a release later than the
 * other three (#516): its entries carry a value, and only `pkg: true` is a
 * bypass. A `pkg: false` entry restates the block-by-default rule, so requiring
 * a marker on one would be noise. See `classifyAllowBuild`.
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

/**
 * Which `allowBuilds` values are grants, which are denials, and which are
 * neither. Returns 'bypass' | 'denial' | null.
 *
 * `allowBuilds` is the one block whose entries are not uniformly bypasses:
 * `pkg: false` RESTATES the block-by-default rule rather than weakening it, and
 * demanding a marker for one would make the gate noise — which trains people to
 * add markers reflexively, and a reflexive marker is worth less than none.
 *
 * ONLY the literal lowercase `true` and `false` are recognised. Everything else
 * — a typo, an uppercase `TRUE`, or a YAML 1.1 habit like `yes`/`no`/`on`/`off`
 * — is `null` and gets reported. This is a CANONICAL-SPELLING rule, and the two
 * things it catches are different, so do not collapse them:
 *
 * - `TRUE`/`True` (and `FALSE`/`False`) are real booleans: YAML 1.2's core
 *   schema resolves all three capitalisations, so `esbuild: TRUE` is a genuine,
 *   live grant. Reporting it is what stops a live grant going unannotated.
 * - `yes`/`no`/`on`/`off` are plain STRINGS under YAML 1.2, and pnpm's
 *   `createAllowBuildFunction` switches on the actual booleans — `case true:` /
 *   `case false:`, nothing else — so a string matches neither arm and the entry
 *   is simply DROPPED. It is inert: it neither grants nor denies, and whatever
 *   the author meant by it silently did not happen.
 *
 * That second half corrects what an earlier revision of this comment claimed.
 * It said a string value is truthy and therefore grants the build. It does not:
 * pnpm never coerces it, and an entry it cannot read is one it ignores. The
 * reason to reject those spellings is that an ignored entry is a policy not in
 * force with nothing to tell you, not that it is a live bypass. Verified in the
 * pinned pnpm 11.9.0 rather than assumed — see the switch in dist/pnpm.mjs.
 */
const classifyAllowBuild = value => {
  if (value === 'true') return 'bypass';
  if (value === 'false') return 'denial';
  return null;
};

/** Lists we police, in file order, with the vocabulary each violation uses. */
export const BYPASS_BLOCKS = [
  {
    key: 'allowBuilds',
    // First in this array because the array is file order and `allowBuilds:`
    // sits above `overrides:`. Nothing depends on the order, but a reader
    // checking coverage against the file should not have to jump around.
    header: /^allowBuilds:\s*$/,
    // A mapping, so `{}` — see the note on `overrides` below.
    empty: /^allowBuilds:[ \t]*\{[ \t]*\}[ \t]*$/,
    emptyLiteral: 'allowBuilds: {}',
    // Group 2 is the VALUE, which only this block needs: `classify` reads it to
    // tell a grant from a denial.
    //
    // The comment tail requires LEADING WHITESPACE, which is not cosmetic. YAML
    // starts an inline comment only at ` #`, so `pkg: false#note` is the single
    // scalar string "false#note" — not the boolean `false` plus a note. An
    // earlier `(?:#.*)?` here matched the `#note` as a comment and handed
    // `classify` a tidy "false", so the gate read the line as a denial and asked
    // for no annotation, while pnpm reads a string it cannot switch on and drops
    // the entry entirely. The gate said "policy, deliberate"; the file said
    // nothing at all. Now the whole malformed scalar reaches `classify` and is
    // reported.
    entry: /^\s+(.+?):[ \t]*(\S+)(?:[ \t]+#.*)?[ \t]*$/,
    list: false,
    label: 'allowBuilds',
    classify: classifyAllowBuild,
  },
  {
    key: 'overrides',
    // `overrides:` sits at column 0; its entries are `key: value` pairs. The
    // trailing `.*` swallows any inline comment — only the key is used.
    header: /^overrides:\s*$/,
    // A mapping, so its empty literal is `{}` — NOT `[]`, which would be an
    // empty sequence and the wrong collection type for these key: value pairs.
    empty: /^overrides:[ \t]*\{[ \t]*\}[ \t]*$/,
    emptyLiteral: 'overrides: {}',
    entry: /^\s+(.+?):\s*\S.*$/,
    // A mapping: its pairs must be indented deeper than the key, so a line at
    // the key's own indentation really is a sibling and ends the block.
    list: false,
    label: 'overrides',
  },
  {
    key: 'minimumReleaseAgeExclude',
    header: /^minimumReleaseAgeExclude:\s*$/,
    empty: /^minimumReleaseAgeExclude:[ \t]*\[[ \t]*\][ \t]*$/,
    emptyLiteral: 'minimumReleaseAgeExclude: []',
    // `\s*` not `\s+`: an indentless item carries no leading whitespace.
    entry: /^\s*-\s*([^\s#]+)\s*(?:#.*)?$/,
    list: true,
    label: 'minimumReleaseAgeExclude',
  },
  {
    key: 'ignoreGhsas',
    // Nested under `auditConfig:`, so the header itself is indented.
    header: /^\s+ignoreGhsas:\s*$/,
    empty: /^[ \t]+ignoreGhsas:[ \t]*\[[ \t]*\][ \t]*$/,
    emptyLiteral: 'ignoreGhsas: []',
    entry: /^\s*-\s*([^\s#]+)\s*(?:#.*)?$/,
    list: true,
    label: 'auditConfig.ignoreGhsas',
  },
];

// A marker must OPEN its comment and END at whitespace or end of line. `\b`
// is not enough: it matches between "permanent" and a hyphen, so
// `# bestax:permanent-ish` read as a valid permanent exemption and silently
// disabled expiry. Anchoring also stops a marker mentioned mid-prose from
// being mistaken for one. `[ \t]` rather than `\s` throughout, so nothing
// spans a newline under the /m flag.
//
// Capture the rest of the marker line too: the contract asks for a reason, and
// an unexplained bypass is the thing this whole gate exists to prevent.
const REVIEW = /^[ \t]*#[ \t]*bestax:review(?=[ \t]|$)[ \t]*(\S+)?[ \t]*(.*)$/m;
const PERMANENT = /^[ \t]*#[ \t]*bestax:permanent(?=[ \t]|$)[ \t]*(.*)$/m;

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
//
// Two alphanumerics total, not three consecutive: this only has to tell a real
// reason from an empty one. A stricter bar rejected legitimately terse
// reasons ("CI", "n/a"), and it would do so while someone is mid-incident
// adding an urgent bypass — the worst possible moment to argue with a linter
// about prose. Judging reason QUALITY is review's job, not this gate's.
const hasReason = text =>
  (text.replace(/^[\s—:-]+/, '').match(/[\p{L}\p{N}]/gu) ?? []).length >= 2;

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
 * `blocksSeen` reports which headers were actually matched, so the caller can
 * fail on a block that has moved or been renamed. A total-entries guard is not
 * enough: one silent block still leaves the other two keeping the count
 * nonzero, which is the same fail-open shape as the termination bug above.
 *
 * @returns {{entries: {name: string, block: string, label: string,
 *   line: number, review: string|null, permanent: boolean,
 *   error: string|null}[], problems: {line: number, why: string}[],
 *   blocksSeen: Set<string>}}
 */
export function parseBypassEntries(yaml) {
  const entries = [];
  const problems = [];
  const blocksSeen = new Set();
  const lines = yaml.split(/\r?\n/);
  let active = null;
  let headerIndent = 0;
  let comments = [];

  const endBlock = () => {
    active = null;
    comments = [];
  };

  for (const [i, line] of lines.entries()) {
    // `key: []` — the list exists and is deliberately empty. Counts as seen so
    // pruning the last entry never requires editing BYPASS_BLOCKS, which would
    // unpolice that surface for good if the list came back later.
    const emptied = BYPASS_BLOCKS.find(b => b.empty.test(line));
    if (emptied) {
      blocksSeen.add(emptied.key);
      endBlock();
      continue;
    }

    const header = BYPASS_BLOCKS.find(b => b.header.test(line));
    if (header) {
      active = header;
      blocksSeen.add(header.key);
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
    // Comments BEFORE the dedent test: YAML comments carry no structure, so
    // one at column 0 sits legally inside an indented block. Testing indent
    // first ended the block on such a line and skipped every entry under it —
    // silently, since blocksSeen already held the block and the other lists
    // kept the total nonzero.
    if (line.trimStart().startsWith('#')) {
      comments.push(line);
      continue;
    }
    const indent = indentOf(line);
    // YAML block sequences may be INDENTLESS: items sit at their key's own
    // indentation rather than deeper. Such an item is still inside the block.
    // Reading it as a dedent dropped the whole list — silently, since
    // blocksSeen already held the block and no entry meant no problem either.
    const indentlessItem = active.list && /^[ \t]*-[ \t]/.test(line);
    if (indent < headerIndent || (indent === headerIndent && !indentlessItem)) {
      // Dedent on a real key: the block is genuinely over. Any comments picked
      // up on the way out belonged to whatever follows, so endBlock drops them.
      endBlock();
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
      // An unparsed line separates a comment block from the next entry, the
      // same way a blank line does. Keeping it would leak this line's marker
      // onto the following entry and report the wrong defect there.
      comments = [];
      continue;
    }

    // Value-dependent blocks (`allowBuilds`): only a grant is a bypass. Blocks
    // without `classify` keep the original contract — every entry is one.
    //
    // BOTH early exits below clear `comments`, and that is load-bearing rather
    // than tidiness. A comment block belongs to exactly one entry (see above),
    // so leaving it set would let the prose above `core-js: false` — or above a
    // typo'd line — carry down onto the NEXT entry, and an unannotated grant
    // beneath a denial would read as annotated. That is the same leak the
    // unparsed-line path guards against below, and it fails open.
    if (active.classify) {
      const verdict = active.classify(item[2] ?? '');
      if (verdict === null) {
        problems.push({
          line: i + 1,
          why:
            `inside \`${active.label}\`, ${JSON.stringify(
              unquote(item[1].trim())
            )} has the unrecognised value ${JSON.stringify(item[2] ?? '')}. ` +
            `Write lowercase \`true\` or \`false\`. pnpm switches on the real ` +
            `booleans and drops anything else, so this entry is inert — it ` +
            `neither grants nor denies, and nothing reports that whatever you ` +
            `meant by it did not happen. (\`TRUE\` is the exception that makes ` +
            `this fail closed rather than merely tidy: YAML resolves it to a ` +
            `real boolean, so it IS a live grant.)`,
        });
        comments = [];
        continue;
      }
      if (verdict === 'denial') {
        // A denial restates the safe default; it needs no annotation and is
        // deliberately absent from `entries` rather than merely unflagged.
        comments = [];
        continue;
      }
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

  return { entries, problems, blocksSeen };
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
