/**
 * Minimal semver-range reading for the manifest passes, shared by every source.
 *
 * Not a semver implementation: the workspace deliberately carries no `semver`
 * dependency for this, and the two questions the passes ask are narrow. Both
 * are answered conservatively, so an unrecognised shape is left alone rather
 * than guessed at. The one thing this file must never do is rewrite a value it
 * does not understand, so every accepting path below goes through one grammar.
 */

const NUMERIC = String.raw`(?:0|[1-9]\d*)`;
const WILD = String.raw`(?:x|X|\*)`;
// SemVer's own identifier grammar: dot-separated, non-empty, no leading zero on
// a numeric prerelease identifier. Looser fragments accepted `0.9.0-alpha..1`,
// `0.9.0-01` and `0.9.0+foo..bar` as complete versions and overwrote them.
const PRE_ID = String.raw`(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)`;
const PRERELEASE = String.raw`-${PRE_ID}(?:\.${PRE_ID})*`;
const BUILD = String.raw`\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*`;
/**
 * An exclusive upper bound that sits exactly at 1.0.0: `1`, `1.0`, `1.0.0`,
 * and the x-ranges that desugar to it (`1.x`, `1.0.x`, `1.*`), optionally with
 * build metadata, which carries no precedence. `1.1.x` desugars to 1.1.0 and
 * still admits 1.0.x, so it is deliberately not here.
 */
const STABLE_ONE_BOUND = new RegExp(
  `^1(?:\\.(?:0|${WILD}))?(?:\\.(?:0|${WILD}))?(?:${BUILD})?$`
);
/**
 * A plain version or x-range: `N`, `N.N`, `N.N.N[-pre][+build]`, `N.x`,
 * `N.x.x`, `N.N.x`. SemVer forbids leading zeros in numeric parts, and once a
 * component is a wildcard everything after it must be a wildcard or omitted.
 */
const VERSION = new RegExp(
  `^(${NUMERIC})(?:\\.(?:${NUMERIC}(?:\\.(?:${WILD}|${NUMERIC}(?:${PRERELEASE})?(?:${BUILD})?))?|${WILD}(?:\\.${WILD})?))?$`
);

/**
 * True only when `range` PROVABLY admits no version >= 1.0.0.
 *
 * The first version of this matched a leading `0` and nothing else, so a range
 * written as comparators (`>=0.7 <1`) was left on 0.x and then reported as
 * already v1. It lived in the rbx source only; the react-bulma-components
 * manifest pass kept the regex until review found the unported half.
 * This walks each `||` alternative and its comparators: a set is pre-v1 when
 * some comparator caps it below 1.0.0 and none of them opens it at 1 or above.
 *
 * Conservative by design: an unrecognised shape returns false and the range is
 * left alone (and reported as such). Bumping a range that might already admit
 * v1 would be the best-guess rewrite this package refuses to make.
 */
export function isPreV1(range: string): boolean {
  const alternatives = range.trim().split(/\s*\|\|\s*/);
  return alternatives.length > 0 && alternatives.every(setIsPreV1);
}

function setIsPreV1(set: string): boolean {
  // npm accepts whitespace between an operator and its version
  // (`>= 0.7.0 < 1.0.0`); splitting on whitespace first made the operator a
  // token of its own, so the range parsed as unrecognised and was left alone.
  const text = glueOperators(set);
  if (text === '' || /^(\*|x|X|latest)$/.test(text)) return false;
  const hyphen = text.match(/^(\S+)\s+-\s+(\S+)$/);
  if (hyphen) {
    // Both endpoints must be plain versions; `not-a-range - 0.9.4` was
    // accepted on its upper bound alone and overwritten.
    const lower = versionMajor(hyphen[1]);
    const upper = versionMajor(hyphen[2]);
    if (lower === null || upper === null) return false;
    return upper === 0 || (upper === 1 && isPrereleaseOfOne(hyphen[2]));
  }

  let cappedBelowOne = false;
  for (const token of text.split(/\s+/)) {
    const match = token.match(/^(>=|<=|>|<|=)?(.*)$/);
    if (!match) return false;
    const [, op = '', version] = match;
    // After a comparator only a plain version may follow: `==0.9.4` and
    // `<^0.9` were each read by stripping a second operator, then overwritten.
    const major = op ? versionMajor(version) : majorOf(version);
    if (major === null) return false;
    const plain = version.replace(/^v/, '');
    switch (op) {
      case '>':
      case '>=':
        // A lower bound on a 1.0.0 prerelease (`>=1.0.0-rc.1`) does not open
        // the range at a stable v1; keep scanning for an upper cap.
        if (major >= 1 && !isPrereleaseOfOne(version)) return false;
        break;
      case '<':
        // `<1`, `<1.0`, `<1.0.0` (build metadata carries no precedence, so
        // `<1.0.0+build.1` is the same) exclude every stable v1, as does a
        // prerelease of 1.0.0 (`<1.0.0-0`, `<1.0.0-rc.1`); `<0.9` does too.
        // A higher upper bound (`<2` in `<1 <2`) never widens the set, so it
        // is neutral rather than disqualifying; the result still needs some
        // other comparator to cap it. Alone, `<2` therefore stays unbumped.
        if (
          major === 0 ||
          (major === 1 && STABLE_ONE_BOUND.test(plain)) ||
          isPrereleaseOfOne(version)
        ) {
          cappedBelowOne = true;
        }
        break;
      case '<=':
        // `<=1.0.0-0` caps at the lowest 1.0.0 prerelease, so it excludes
        // every stable v1 just as `<1.0.0-0` does. A higher inclusive bound
        // is neutral for the same reason as above.
        if (major === 0 || isPrereleaseOfOne(version)) {
          cappedBelowOne = true;
        }
        break;
      default:
        // `0.9.4`, `=0.9.4`, `^0.9`, `~0.7.5`, `0.x`: caret and tilde never
        // cross a major, so major 0 stays below 1. An exact `1.0.0-rc.1` pins
        // a prerelease and admits no stable v1 either; `^1.0.0-rc.1` does.
        if (major === 0) {
          cappedBelowOne = true;
        } else if (
          !/^[~^]/.test(version) &&
          isPrereleaseOfOne(version.replace(/^=/, ''))
        ) {
          cappedBelowOne = true;
        } else {
          return false;
        }
    }
  }
  return cappedBelowOne;
}

/**
 * `1.0.0-0`, `1.0.0-rc.1`: a prerelease of exactly 1.0.0 orders below every
 * stable 1.x, so as an upper bound or an exact pin it admits no usable v1.
 * Three numeric parts only, matching semver; `1.0-beta` is not a token this
 * parser reads and is left alone. A caret or tilde on one is different
 * (`^1.0.0-rc.1` admits 1.0.4), which is why the callers check the operator.
 * Accepts the same optional `v` that the version grammar does.
 */
function isPrereleaseOfOne(version: string): boolean {
  return /^v?1\.0\.0-/.test(version);
}

function glueOperators(set: string): string {
  // Only when what follows starts a plain version. Gluing unconditionally
  // turned the invalid `> =0.7` into a valid `>=0.7`, which was then bumped.
  // node-semver normalises a spaced tilde or caret (`~ 0.7.5`) the same way.
  return set.trim().replace(/(>=|<=|>|<|=|~|\^)\s+(?=[0-9vxX*])/g, '$1');
}

/**
 * True when every comparator in every alternative parses to a semver major,
 * so the headline can tell "already v1" apart from "not a version range at
 * all" (`latest`, a git URL) rather than calling both v1.
 */
export function isRecognisedRange(range: string): boolean {
  return range
    .trim()
    .split(/\s*\|\|\s*/)
    .every(alt => {
      const text = glueOperators(alt);
      if (/^(\*|x|X)$/.test(text)) return true;
      const hyphen = text.match(/^(\S+)\s+-\s+(\S+)$/);
      if (hyphen) {
        return (
          versionMajor(hyphen[1]) !== null && versionMajor(hyphen[2]) !== null
        );
      }
      return text.split(/\s+/).every(tok => {
        const m = tok.match(/^(>=|<=|>|<|=)?(.*)$/);
        if (!m) return false;
        const [, op = '', v] = m;
        return (op ? versionMajor(v) : majorOf(v)) !== null;
      });
    });
}

/**
 * The major of a COMPLETE plain version or x-range, or null. npm's optional
 * leading `v` is the only prefix allowed here. Reading a numeric prefix alone
 * accepted a dist-tag like `0.next` as major 0, and the manifest was then
 * overwritten with `^1.0.4`, which is the one thing this parser must never do
 * to a value it does not understand.
 */
function versionMajor(version: string): number | null {
  const m = version.replace(/^v/, '').match(VERSION);
  return m ? Number(m[1]) : null;
}

/**
 * The major of a BARE token, which may carry exactly one range prefix (`^`,
 * `~`, `=`) before the version. Stripping any run of prefix characters
 * accepted `^^0.9.4` and `vv0.9.4` as major 0 and overwrote them.
 */
function majorOf(token: string): number | null {
  return versionMajor(token.replace(/^[~^=]/, ''));
}
