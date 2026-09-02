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
  if (hyphen) return majorOf(hyphen[2]) === 0;

  let cappedBelowOne = false;
  for (const token of text.split(/\s+/)) {
    const match = token.match(/^(>=|<=|>|<|=)?\s*v?(.*)$/);
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
        // `<1`, `<1.0`, `<1.0.0` exclude every v1; `<0.9` does too.
        if (major === 0 || (major === 1 && /^1(\.0)*$/.test(version))) {
          cappedBelowOne = true;
        } else {
          return false;
        }
        break;
      case '<=':
        if (major === 0) cappedBelowOne = true;
        else return false;
        break;
      default:
        // `0.9.4`, `=0.9.4`, `^0.9`, `~0.7.5`, `0.x`: caret and tilde never
        // cross a major, so major 0 stays below 1.
        if (major === 0) cappedBelowOne = true;
        else return false;
    }
  }
  return cappedBelowOne;
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

function majorOf(version: string): number | null {
  const m = version.replace(/^[~^=v]+/, '').match(/^(\d+)(?:\.|$)/);
  return m ? Number(m[1]) : null;
}
