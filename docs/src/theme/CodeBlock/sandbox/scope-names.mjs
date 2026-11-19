/**
 * The names the live scope provides bare. Kept apart from scope.js, which
 * imports React and the library, so the corpus gate can read them without
 * loading either. scope.js builds its objects from these lists, so the scope and
 * the lists cannot disagree.
 */

/** React exports the scope provides bare, beside `React` itself. */
export const REACT_SCOPE_NAMES = ['useEffect', 'useState'];

/** Components that exist only in this site. No sandbox can install them. */
export const DOCS_ONLY_NAMES = ['ProfileCard'];
