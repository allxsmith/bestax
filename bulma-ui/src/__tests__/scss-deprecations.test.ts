/**
 * @jest-environment node
 */
// A consumer who builds from our SCSS (`@use '@allxsmith/bestax-bulma/scss'`)
// compiles it with their own Sass and sees every deprecation warning it raises.
// rollup's own build silences some of those (`silenceDeprecations` in
// rollup.config.js), so the published CSS gives no sign of them. This compiles
// the two SCSS entry points the package exports, with nothing silenced, and
// fails on any deprecation raised from our own sources. Bulma's are left out:
// they are Bulma's to fix and a consumer sees them with or without bestax.
import * as sass from 'sass';
import path from 'path';
import { fileURLToPath } from 'url';

const SCSS = path.resolve(__dirname, '../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../node_modules');

/** Deprecations raised from a file under src/scss, as `file:line id`. */
function ownDeprecations(entry: string): string[] {
  const found: string[] = [];
  sass.compile(path.join(SCSS, entry), {
    loadPaths: [SCSS, NODE_MODULES],
    // Report every occurrence, not the first few of each kind.
    verbose: true,
    logger: {
      warn(_message, options) {
        if (!options.deprecation || !options.span?.url) return;
        const file = fileURLToPath(options.span.url);
        if (!file.startsWith(SCSS + path.sep)) return;
        found.push(
          `${path.relative(SCSS, file)}:${options.span.start.line + 1} ` +
            options.deprecationType.id
        );
      },
    },
  });
  return found;
}

describe.each(['extras.scss', 'bestax.scss'])('%s', entry => {
  it('raises no Sass deprecation warning from our own sources', () => {
    expect(ownDeprecations(entry)).toEqual([]);
  }, 30_000);
});
