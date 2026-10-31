// How a suite that compiles a whole published stylesheet compiles its SCSS,
// partials included: with `sass-embedded`, which runs Dart Sass natively and
// compiles a full sheet faster than `sass`, the same compiler built to
// JavaScript, and with the load path the build gives Sass (`includePaths` in
// rollup.config.js). It starts slower, so a suite that compiles only partials
// keeps `sass`. sass-compilers.test.ts holds the two to the version the build
// compiles with.
import path from 'path';
import * as sass from 'sass-embedded';

export { sass };

/** `src/scss`, which the sheets below are named relative to. */
export const SCSS = path.resolve(__dirname, '../scss');

/** The workspace's `node_modules`, which Bulma loads from. */
export const NODE_MODULES = path.resolve(__dirname, '../../../node_modules');

/** The build's load path. */
export const LOAD_PATHS = [SCSS, NODE_MODULES];

/** Quiet about Bulma's own warnings, which are Bulma's to fix. */
const OPTIONS = {
  loadPaths: LOAD_PATHS,
  quietDeps: true,
  logger: sass.Logger.silent,
};

/** The CSS the file at `file` under `src/scss` compiles to. */
export const compileSheet = (file: string) =>
  sass.compile(path.join(SCSS, file), OPTIONS).css;

/** The CSS `source` compiles to, its `@use`s loaded as a sheet's are. */
export const compileScss = (source: string) =>
  sass.compileString(source, OPTIONS).css;
