/**
 * Minimal semver-range reading for the manifest passes, shared by every source.
 *
 * Not a semver implementation: the workspace deliberately carries no `semver`
 * dependency for this, and the two questions the passes ask are narrow. Both
 * are answered conservatively, so an unrecognised shape is left alone rather
 * than guessed at.
 */

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
    // Both endpoints must be tokens this parser reads; `not-a-range - 0.9.4`
    // was accepted on its upper bound alone and overwritten.
    const lower = majorOf(hyphen[1]);
    const upper = majorOf(hyphen[2]);
    if (lower === null || upper === null) return false;
    return upper === 0 || (upper === 1 && isPrereleaseOfOne(hyphen[2]));
  }

  let cappedBelowOne = false;
  for (const token of text.split(/\s+/)) {
    // Prefix handling (`v`, `^`, `~`, `=`) lives in majorOf alone; stripping a
    // `v` here too let `vv0.9.4` through as two single strips.
    const match = token.match(/^(>=|<=|>|<|=)?(.*)$/);
    if (!match) return false;
    const [, op = '', version] = match;
    const major = majorOf(version);
    if (major === null) return false;
    switch (op) {
      case '>':
      case '>=':
        if (major >= 1) return false;
        break;
      case '<':
        // `<1`, `<1.0`, `<1.0.0` exclude every v1, and so does npm's canonical
        // `<1.0.0-0` (below the lowest 1.0.0 prerelease); `<0.9` does too.
        if (
          major === 0 ||
          (major === 1 && /^1(\.0){0,2}(\+[0-9A-Za-z.-]+)?$/.test(version)) ||
          isPrereleaseOfOne(version)
        ) {
          cappedBelowOne = true;
        } else {
          return false;
        }
        break;
      case '<=':
        // `<=1.0.0-0` caps at the lowest 1.0.0 prerelease, so it excludes every
        // stable v1 just as `<1.0.0-0` does.
        if (major === 0 || isPrereleaseOfOne(version)) {
          cappedBelowOne = true;
        } else {
          return false;
        }
        break;
      default:
        // `0.9.4`, `=0.9.4`, `^0.9`, `~0.7.5`, `0.x`: caret and tilde never
        // cross a major, so major 0 stays below 1. An exact `1.0.0-rc.1` pins
        // a prerelease and admits no stable v1 either; `^1.0.0-rc.1` does.
        if (major === 0) cappedBelowOne = true;
        else if (!/^[~^]/.test(version) && isPrereleaseOfOne(version)) {
          cappedBelowOne = true;
        } else return false;
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
 */
function isPrereleaseOfOne(version: string): boolean {
  return /^1\.0\.0-/.test(version);
}

function glueOperators(set: string): string {
  return set.trim().replace(/(>=|<=|>|<|=)\s+/g, '$1');
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
        return majorOf(hyphen[1]) !== null && majorOf(hyphen[2]) !== null;
      }
      return text
        .split(/\s+/)
        .every(tok => majorOf(tok.replace(/^(>=|<=|>|<|=)/, '')) !== null);
    });
}

/**
 * The major of a COMPLETE semver token, or null. Reading only the numeric
 * prefix accepted a dist-tag like `0.next` as major 0, and the manifest was
 * then overwritten with `^1.0.4`, which is the one thing this parser must
 * never do to a value it does not understand. A prerelease or build suffix is
 * accepted only after three numeric parts, matching semver itself; x-ranges
 * (`0.x`, `0.7.*`) are accepted in the minor and patch positions.
 */
function majorOf(version: string): number | null {
  // At most one of `^`, `~`, `=` and at most one `v`: stripping any run of
  // them accepted `^^0.9.4` and `vv0.9.4` as major 0 and overwrote them.
  const m = version
    .replace(/^(?:[~^=]v?|v)?/, '')
    .match(
      /^(\d+)(?:\.(?:\d+|x|X|\*)(?:\.(?:x|X|\*|\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?))?)?$/
    );
  return m ? Number(m[1]) : null;
}
