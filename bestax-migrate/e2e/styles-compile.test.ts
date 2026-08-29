/**
 * Dedicated compile gate for the RBC stylesheet-root path added in #560
 * (`emitBulmaRoot`, existing-root detection): the kitchen-sink fixture's own
 * `styles.scss` never exercises it (its root is a plain `bulma/…` @import,
 * not react-bulma-components's own stylesheet), so it needs coverage here
 * to be compiled the same way the kitchen-sink e2e compiles its output.
 */
import { reactBulmaComponents } from '../src/sources/react-bulma-components/index.js';
import { compileMigratedScss } from './support/compile-scss.js';

const transform = reactBulmaComponents.transformStyles!;

function migrate(source: string, cssMode: 'bestax' | 'bulma'): string {
  const output = transform(
    'styles.scss',
    source,
    { add: () => {} },
    {
      cssMode,
    }
  );
  return output ?? source;
}

describe('styles-compile e2e: RBC stylesheet-root path (#560)', () => {
  it.each(['bestax', 'bulma'] as const)(
    "compiles when react-bulma-components's own stylesheet is the file's only root (%s mode)",
    cssMode => {
      const migrated = migrate(
        "@import 'react-bulma-components/src/index.sass';\n.app { color: red; }\n",
        cssMode
      );
      const { status, diagnostics } = compileMigratedScss(migrated);
      expect({ status, diagnostics }).toEqual({ status: 0, diagnostics: '' });
    }
  );

  it.each(['bestax', 'bulma'] as const)(
    "compiles when react-bulma-components's stylesheet is redundant beside an existing bulma root (%s mode)",
    cssMode => {
      // Regression coverage for the existing-root detection itself: if the
      // transform ever emitted a second `@use 'bulma/sass'` here instead of
      // dropping the RBC line, this would be a hard Dart Sass compile error
      // ("already a module with namespace"), not just a wrong-looking diff.
      const migrated = migrate(
        [
          "@use 'bulma/sass';",
          "@import 'react-bulma-components/src/index.sass';",
          '.app { color: red; }',
        ].join('\n'),
        cssMode
      );
      const { status, diagnostics } = compileMigratedScss(migrated);
      expect({ status, diagnostics }).toEqual({ status: 0, diagnostics: '' });
    }
  );
});
