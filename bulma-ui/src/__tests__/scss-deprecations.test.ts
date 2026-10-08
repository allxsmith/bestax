/**
 * @jest-environment node
 */
// A consumer who builds from our SCSS (`@use '@allxsmith/bestax-bulma/scss'`)
// compiles it with their own Sass and sees every deprecation warning it raises.
// This compiles every entry point rollup builds a published stylesheet from,
// each of which a consumer can also load through the package's `./scss/*`
// export, with nothing silenced, and fails on any deprecation raised from our
// own sources. Bulma's are left out: they are Bulma's to fix and a consumer
// sees them with or without bestax. The controls at the end prove the logger
// is wired, so a clean run means clean sources rather than a filter that
// stopped matching.
import * as sass from 'sass';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const SCSS = path.resolve(__dirname, '../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../node_modules');

/** The entry points: every non-partial `.scss` at the top and in `versions/`. */
const ENTRIES = ['', 'versions'].flatMap(dir =>
  readdirSync(path.join(SCSS, dir))
    .filter(file => file.endsWith('.scss') && !file.startsWith('_'))
    .map(file => path.posix.join(dir, file))
);

/**
 * A logger that records each deprecation raised from a file under src/scss,
 * as `file:line id`. `path.relative` decides "under": it compares
 * case-insensitively on Windows, where Sass lower-cases the paths it loads.
 */
function ownDeprecations(found: string[]): sass.Logger {
  return {
    warn(_message, options) {
      if (!options.deprecation || !options.span?.url) return;
      const file = path.relative(SCSS, fileURLToPath(options.span.url));
      if (file.startsWith('..') || path.isAbsolute(file)) return;
      found.push(
        `${file.split(path.sep).join('/')}:${options.span.start.line + 1} ` +
          options.deprecationType.id
      );
    },
  };
}

const OPTIONS = {
  loadPaths: [SCSS, NODE_MODULES],
  // Report every occurrence, not the first few of each kind.
  verbose: true,
};

it('finds the entry points rollup builds', () => {
  expect(ENTRIES).toEqual(
    expect.arrayContaining([
      'bestax.scss',
      'extras.scss',
      'versions/bestax-prefixed.scss',
    ])
  );
});

describe.each(ENTRIES)('%s', entry => {
  it('raises no Sass deprecation warning from our own sources', () => {
    const found: string[] = [];
    sass.compile(path.join(SCSS, entry), {
      ...OPTIONS,
      logger: ownDeprecations(found),
    });
    expect(found).toEqual([]);
  }, 30_000);
});

describe('the deprecation logger', () => {
  // The global `nth()` the picker popover partial used to call.
  const source = '$l: (a b);\n.x { c: nth($l, 1); }';
  const compileAt = (file: string) => {
    const found: string[] = [];
    sass.compileString(source, {
      ...OPTIONS,
      url: pathToFileURL(file),
      logger: ownDeprecations(found),
    });
    return found;
  };

  it('reports a deprecation raised from our sources', () => {
    expect(compileAt(path.join(SCSS, 'form', '_probe.scss'))).toEqual([
      'form/_probe.scss:2 global-builtin',
    ]);
  });

  it('leaves out a deprecation raised from Bulma', () => {
    expect(compileAt(path.join(NODE_MODULES, 'bulma', '_probe.scss'))).toEqual(
      []
    );
  });
});
