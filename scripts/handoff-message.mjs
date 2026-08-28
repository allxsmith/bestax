#!/usr/bin/env node
/**
 * Slot-assembled convergence hand-off message for the AI fix loop (#576, rule 9).
 *
 * claude-pr-loop.yml's `handoff` job posts bestaxbot's sign-off: the comment
 * telling a human the PR converged and asking for a squash-merge. It used to
 * be one hardcoded string, so every converged PR got a byte-identical comment
 * and people stopped reading the one message that carries an action item. This
 * assembles it from four slots instead — opening, status, ask, kicker — each
 * drawn from its own pool: 2 x 5 x 5 x 5 x 5 = 1250 bodies from 30 lines.
 *
 * Everything the old string communicated survives by construction, and the
 * test sibling asserts each one across all 1250 combinations: the iteration
 * count, CI green, every AI review thread resolved, the @allxsmith
 * squash-merge ask, and that the loop itself never merges.
 *
 * Design constraints worth keeping when adding fragments:
 *
 * - Every fragment is SELF-CONTAINED — a complete sentence that never refers
 *   back to the previous slot's metaphor. Slots C and D joke about thumbs and
 *   merge buttons rather than terrain, which is what makes them theme-neutral
 *   and safe to combine with either theme. Break that and the combinations
 *   stop reading as sentences.
 * - The opening emoji carries the theme; the closing 🤙 is bestaxbot's
 *   signature and stays constant across both, so the bot stays recognisable.
 * - Fragments are single-line, and the assembled body must be flush left. The
 *   YAML literal this replaced got that for free: a block scalar strips its
 *   own indentation, so the multi-line string decoded clean. Assembling in JS
 *   removes that safety net — a stray leading space here reaches the comment
 *   verbatim, and >=4 of them after a blank line is an indented code block in
 *   Markdown, which would grey out the merge ask and silence the @-mention
 *   inside it. Hence the whitespace assertions in the test sibling.
 * - The draw is DETERMINISTIC per PR (re-running handoff posts the same text
 *   rather than a second, different-looking sign-off) and DECORRELATED per
 *   slot (each slot hashes its own salt, so consecutive PRs shift all four
 *   instead of rotating one). sha256 rather than a cheaper checksum: CRC32's
 *   low bit is a linear function of its input, which made the theme alternate
 *   in visible runs of exactly four across adjacent PR numbers.
 * - No untrusted text may ever reach this body. The comment is posted with a
 *   PAT, so it is published verbatim AND re-triggers workflows
 *   (.github/CLAUDE.md rule 5 / I2); the only interpolation is the iteration
 *   integer. Never add a fragment containing "@claude" or "@coderabbitai" —
 *   `contains()` matches raw substrings and would re-enter a write-capable
 *   session (rule 8).
 *
 * CLI contract (the YAML wrapper depends on every clause):
 *   node scripts/handoff-message.mjs --pr=<number> --iter=<number>
 *   node scripts/handoff-message.mjs --check-title=<pr title>   -> warn | ok
 * - Prints the assembled body on stdout and nothing else. The workflow appends
 *   its own `$WARN` after; that is deliberately NOT this script's business, so
 *   "unchanged, at the very end" stays visible at the call site.
 * - Exits non-zero with a message on stderr for any bad input, so the step's
 *   `set -euo pipefail` fails the job rather than posting an empty comment.
 * - Doubles as the local preview: `node scripts/handoff-message.mjs --pr=576
 *   --iter=3` renders exactly what that PR would get.
 */
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

/** Placeholder the status fragments carry, substituted by applyIter(). */
export const ITER_TOKEN = '$ITER';

/** Mirrors RELEASE_TYPES / RELEASE_SCOPES in commitlint.config.js. */
export const RELEASE_TYPES = [
  'feat',
  'fix',
  'perf',
  'refactor',
  'style',
  'revert',
];
export const RELEASE_SCOPES = [
  'bulma-ui',
  'docs',
  'create-bestax',
  'bestax-migrate',
  'bestax-mcp',
];

/** `type(scope)!: subject` — the same shape commitlint parses. */
const CONVENTIONAL_HEADER = /^([a-z]+)(?:\(([^)]*)\))?!?:/;

/**
 * True when the PR title would release a package but names no valid scope —
 * i.e. when the hand-off comment should carry its :warning:.
 *
 * Anchored on the whole conventional header rather than a bare type prefix:
 * matching `^(feat|fix|...)` alone also flags ordinary prose like "fixture
 * cleanup" or "reverted flaky change", which semantic-release never parses as
 * a release at all.
 *
 * Residual, the same one commitlint.config.js already documents: a git-style
 * `Revert "..."` title is not a conventional header, so it is not flagged
 * here either — yet commit-analyzer's default `{ revert: true, release:
 * 'patch' }` would still patch-release every package. Reverts have to be kept
 * conventional and scoped by hand.
 */
export function needsScopeWarning(title) {
  const match = CONVENTIONAL_HEADER.exec(title);
  if (!match) return false;
  const [, type, scope] = match;
  if (!RELEASE_TYPES.includes(type)) return false;
  return !RELEASE_SCOPES.includes(scope ?? '');
}

export const SURF = {
  name: 'surf',
  emoji: '🏄',
  openings: [
    "🏄 **Surf's up and I rode the whole set — total convergence, brah.**",
    "🏄 **Clean sets, no drop-ins — this one's converged.**",
    '🏄 **Paddled out, dropped in, kicked out clean — converged, zero wipeouts.**',
    '🏄 **Waxed the board, read the tide chart, rode it all the way in.**',
    '🏄 **Called the drop, made the section, converged clean.**',
  ],
  statuses: [
    "$ITER iteration(s) in, CI's glassy green, and every AI review thread closed out clean like a perfect barrel.",
    '$ITER iteration(s) deep, CI is offshore-glassy, and every AI review thread paddled back to the beach.',
    '$ITER iteration(s) in the water, CI green as a dawn-patrol horizon, and every AI review thread is stone-cold resolved.',
    '$ITER iteration(s) of grinding, CI lit up greener than a kelp bed, and not one AI review thread left in the impact zone.',
    '$ITER iteration(s), CI glassy top to bottom, every AI review thread resolved and dried off. 🌊',
  ],
};

export const SNOW = {
  name: 'snow',
  emoji: '🏂',
  openings: [
    '🏂 **Dropped the cornice and rode it clean to the lodge — total convergence, brah.**',
    '🏂 **First chair, fresh corduroy, straight-lined the whole thing — converged.**',
    "🏂 **Bluebird day, boot-deep pow, not one yard sale — she's converged.**",
    '🏂 **Strapped in, dropped in, stomped the landing — full convergence.**',
    '🏂 **Rode it summit to base without catching a single edge.**',
  ],
  statuses: [
    "$ITER iteration(s) in, CI's greener than the bunny slope, and every AI review thread carved clean off the mountain. ❄️",
    '$ITER iteration(s) deep, CI all-green top to base, and every AI review thread resolved and stomped flat.',
    '$ITER lap(s) down the hill, CI lighting up green the whole way, and not one AI review thread left in the trees. 🏔️',
    '$ITER iteration(s), CI green as a freshly groomed run at 8am, and every AI review thread buried and packed down.',
    '$ITER run(s) in, CI green from the summit to the lodge, and every AI review thread closed out before last chair. 🧊',
  ],
};

/** Theme order is part of the draw — appending is safe, reordering is not. */
export const THEMES = [SURF, SNOW];

/** Slot C: the ask. Theme-neutral — every entry @-mentions the owner. */
export const ASKS = [
  "You fleshbags kept the merge button for yourselves — so @allxsmith, wiggle those opposable thumbs and squash-merge when you're stoked.",
  'The merge button lives in the wetware, brah — @allxsmith, flex those digits and squash-merge when the vibes align.',
  "Merge button's still locked to the carbon units — so @allxsmith, unfold those beautiful thumbs and squash-merge whenever you're ready.",
  'Only the meat build ships with merge permissions — @allxsmith, do the wet-mammal thing and squash-merge when it feels right.',
  "Final call is a wetware exclusive — @allxsmith, put a thumb on it and squash-merge when you're feeling it.",
];

/** Slot D: the kicker. Theme-neutral — every entry closes with the 🤙 sig. */
export const KICKERS = [
  "The loop never merges; apparently 'judgment' is still a squishy-brain-only feature. 🤙",
  "Loop never merges — 'is this actually a good idea' is still a protein-based subroutine. 🤙",
  "The loop never merges; turns out 'taste' only ships in the carbon build. 🤙",
  "Loop never merges; apparently 'ship it' needs a pulse. 🤙",
  'The loop never merges — you fleshbags reserved the final call for yourselves and honestly? Respect. 🤙',
];

/**
 * Stable index in [0, n) for this PR and slot.
 *
 * Salting per slot is the point: one hash reused across slots would rotate
 * them in lockstep, so neighbouring PRs would share three of four fragments.
 */
export function draw(salt, pr, n) {
  const digest = createHash('sha256').update(`${salt}:${pr}`).digest('hex');
  return parseInt(digest.slice(0, 8), 16) % n;
}

/** Substitute the iteration count into a status fragment. */
export function applyIter(status, iter) {
  return status.replaceAll(ITER_TOKEN, String(iter));
}

/**
 * Join four chosen fragments into the posted body.
 *
 * Pure and slot-agnostic so the test can enumerate all 1250 combinations
 * directly, rather than trusting the draw to reach every one of them.
 */
export function assemble({ opening, status, ask, kicker, iter }) {
  return `${opening} ${applyIter(status, iter)}\n\n${ask} ${kicker}`;
}

/** The fragments this PR number draws, theme included. */
export function chooseSlots(pr) {
  const theme = THEMES[draw('theme', pr, THEMES.length)];
  return {
    theme,
    opening: theme.openings[draw('open', pr, theme.openings.length)],
    status: theme.statuses[draw('stat', pr, theme.statuses.length)],
    ask: ASKS[draw('ask', pr, ASKS.length)],
    kicker: KICKERS[draw('kick', pr, KICKERS.length)],
  };
}

export function buildBody({ pr, iter }) {
  return assemble({ ...chooseSlots(pr), iter });
}

/** Parse argv into { pr, iter }; throws Error(message) on misuse. */
export function parseArgs(argv) {
  for (const arg of argv)
    if (!/^--(pr|iter|check-title)=/.test(arg))
      throw new Error(`Unknown argument: ${arg}`);
  const flag = name =>
    argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);
  const int = (name, min) => {
    const raw = flag(name);
    if (raw === undefined) throw new Error(`missing --${name}=<number>`);
    if (!/^\d+$/.test(raw))
      throw new Error(`--${name} must be a number, got "${raw}"`);
    const value = Number(raw);
    // A long enough digit run parses to Infinity, and anything past
    // MAX_SAFE_INTEGER collapses distinct PR numbers onto the same draw.
    if (!Number.isSafeInteger(value))
      throw new Error(`--${name} is not a safe integer: "${raw}"`);
    if (value < min)
      throw new Error(`--${name} must be >= ${min}, got ${value}`);
    return value;
  };
  const title = flag('check-title');
  if (title !== undefined) {
    if (argv.length !== 1)
      throw new Error('--check-title= takes no other arguments');
    return { mode: 'check-title', title };
  }
  // iter may legitimately be 0: a PR can converge before the loop ever pushed.
  return { mode: 'body', pr: int('pr', 1), iter: int('iter', 0) };
}

export function main(argv = process.argv.slice(2)) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    console.error(`handoff-message: ${err.message}`);
    console.error(
      'usage: node scripts/handoff-message.mjs --pr=<number> --iter=<number>\n' +
        '       node scripts/handoff-message.mjs --check-title=<pr title>'
    );
    process.exit(2);
  }
  if (opts.mode === 'check-title') {
    console.log(needsScopeWarning(opts.title) ? 'warn' : 'ok');
    return;
  }
  console.log(buildBody(opts));
}

// Run only when executed directly (keeps the pure helpers importable).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
