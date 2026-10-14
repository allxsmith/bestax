// The words around a "The State of React" changes table (Changes.js): its
// legend note and the line that links the pull requests behind its
// corrections. A published edition can't be edited, so these are pure
// functions that run under `node --test` without the React side of the
// component (comparison-changes-text.test.mjs).

/** The legend note, which explains the dashed cells only when there are some. */
export function legendNote(hasCorrections) {
  return hasCorrections
    ? 'Highlighted cells changed (before → after). Dashed ones are corrections: the last edition had them wrong. The rest of each row is shown for context.'
    : 'Highlighted cells changed (before → after); the rest of each row is shown for context.';
}

/**
 * Join items as prose: "a", "a and b", "a, b, and c". Returns the items with
 * the separators between them, so an item can be an element as well as text.
 */
export function joinAnd(items) {
  return items.flatMap((item, i) => {
    if (i === 0) return [item];
    if (items.length === 2) return [' and ', item];
    return [i === items.length - 1 ? ', and ' : ', ', item];
  });
}

/**
 * The line under the table naming the pull requests behind its corrections,
 * each one rendered by `link`.
 */
export function fixedInLine(fixes, link) {
  return [
    'The reasons for each correction are in ',
    ...joinAnd(fixes.map(link)),
    '.',
  ];
}
