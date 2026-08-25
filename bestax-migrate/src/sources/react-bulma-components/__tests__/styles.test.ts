import { transformStyles } from '../styles.js';
import type { TodoEntry } from '../../../types.js';

function run(
  file: string,
  source: string,
  cssMode: 'bestax' | 'bulma' | 'keep' = 'bestax'
): { output: string | null; todos: TodoEntry[] } {
  const todos: TodoEntry[] = [];
  const output = transformStyles(
    file,
    source,
    { add: entry => todos.push(entry) },
    { cssMode }
  );
  return { output, todos };
}

describe('transformStyles (.scss)', () => {
  it('leaves files without bulma references untouched', () => {
    const { output } = run('app.scss', '.card { color: red; }\n');
    expect(output).toBeNull();
  });

  it('converts the 0.9 root import with folded variable overrides', () => {
    const source = [
      '$primary: #ff6b35 !default;',
      "$family-primary: 'Nunito', sans-serif;",
      '',
      "@import 'bulma/bulma.sass';",
      '',
      '.app { color: $grey; }',
    ].join('\n');
    const { output } = run('theme.scss', source);
    expect(output).toContain("@use 'bulma/sass' with (");
    expect(output).toContain('$primary: #ff6b35,');
    expect(output).toContain("$family-primary: ('Nunito', sans-serif)");
    expect(output).toContain("@use '@allxsmith/bestax-bulma/scss/extras';");
    expect(output).not.toContain('@import');
    expect(output).not.toContain('!default');
  });

  it('wraps a folded value with a top-level comma in parens (#554)', () => {
    // A bare comma list inside `with (…)` reads as extra arguments to Dart
    // Sass, not a single list value — this is the repo's own kitchen-sink
    // fixture, which used to emit Sass that fails to compile.
    const source = [
      '$primary: #1e6b99;',
      "$family-primary: 'Nunito', sans-serif;",
      '',
      "@import 'bulma/bulma.sass';",
    ].join('\n');
    const { output } = run('fonts.scss', source);
    expect(output).toContain(
      "@use 'bulma/sass' with (\n  $primary: #1e6b99,\n  $family-primary: ('Nunito', sans-serif)\n);"
    );
  });

  it('does not wrap a single quoted string whose escaped quote precedes a comma', () => {
    // `"a\", b"` is one string value — the escaped `"` must not close the
    // quote and expose the comma as top-level, or we would emit needless
    // parens. Track backslash escapes while scanning.
    const source = ['$foo: "a\\", b";', '', "@import 'bulma/bulma.sass';"].join(
      '\n'
    );
    const { output } = run('escaped.scss', source);
    expect(output).toContain('$foo: "a\\", b"\n');
    expect(output).not.toContain('$foo: ("a\\", b")');
  });

  it('wraps a folded value whose block comment holds a quote before the comma', () => {
    // The `/* … */` comment carries an apostrophe (`user's`); without stripping
    // it the scanner enters string state on that apostrophe, never closes, and
    // misses the real top-level comma — emitting the bare list Dart Sass rejects
    // with `expected "$"`.
    const source = [
      "$family-primary: /* user's choice */ Arial, sans-serif;",
      '',
      "@import 'bulma/bulma.sass';",
    ].join('\n');
    const { output } = run('commented.scss', source);
    expect(output).toContain(
      "$family-primary: (/* user's choice */ Arial, sans-serif)"
    );
  });

  it('wraps a value whose /* … */-shaped span straddles two quoted strings', () => {
    // The `/*`…`*/` markers each sit inside a different quoted string, so the
    // span between them is NOT a comment. A strip-first regex would delete it
    // together with the real top-level comma, folding the list unparenthesized;
    // recognizing comments only outside strings keeps the comma top-level.
    const source = [
      '$foo: "a /* b", "c */ d";',
      '',
      "@import 'bulma/bulma.sass';",
    ].join('\n');
    const { output } = run('straddle.scss', source);
    expect(output).toContain('$foo: ("a /* b", "c */ d")');
  });

  it('leaves a comma-free folded value unparenthesized', () => {
    const source = [
      '$primary: #1e6b99;',
      '',
      "@import 'bulma/bulma.sass';",
    ].join('\n');
    const { output } = run('plain.scss', source);
    expect(output).toContain('$primary: #1e6b99\n');
    expect(output).not.toContain('$primary: (#1e6b99)');
  });

  it('handles the plain root import without variables', () => {
    const { output } = run('main.scss', '@import "~bulma/bulma";\n');
    expect(output).toContain("@use 'bulma/sass';");
    expect(output).toContain("@use '@allxsmith/bestax-bulma/scss/extras';");
  });

  it('omits the extras @use outside bestax css mode', () => {
    const { output } = run('main.scss', "@import 'bulma/bulma';\n", 'bulma');
    expect(output).toContain("@use 'bulma/sass';");
    expect(output).not.toContain('extras');
  });

  it('flags computed variable overrides instead of folding them', () => {
    const source = [
      '$primary: lighten(#333, 10%);',
      "@import 'bulma/bulma';",
    ].join('\n');
    const { output, todos } = run('computed.scss', source);
    expect(output).toContain('$primary: lighten(#333, 10%);');
    expect(output).toContain("@use 'bulma/sass';");
    expect(output).toContain('TODO(bestax-migrate)');
    expect(todos.some(t => t.rule === 'sass')).toBe(true);
  });

  it('maps 0.9 _all aggregator partials onto the v1 directory modules', () => {
    const source = [
      "@import 'bulma/sass/utilities/_all';",
      "@import 'bulma/sass/base/_all';",
      "@import 'bulma/sass/elements/all';",
    ].join('\n');
    const { output } = run('partials.scss', source);
    expect(output).toContain("@use 'bulma/sass/utilities';");
    expect(output).toContain("@use 'bulma/sass/base';");
    expect(output).toContain("@use 'bulma/sass/elements';");
  });

  it('keeps known v1 leaf partials and flags unknown ones', () => {
    const source = [
      "@import 'bulma/sass/utilities/initial-variables';",
      "@import 'bulma/sass/utilities/animations';",
    ].join('\n');
    const { output, todos } = run('leaves.scss', source);
    expect(output).toContain("@use 'bulma/sass/utilities/initial-variables';");
    expect(output).toContain("@import 'bulma/sass/utilities/animations';");
    expect(todos.some(t => t.message.includes('animations'))).toBe(true);
  });

  it('adds the extras once to partial-only files in bestax mode', () => {
    const source = [
      "@import 'bulma/sass/utilities/_all';",
      "@import 'bulma/sass/elements/_all';",
    ].join('\n');
    const { output } = run('modular.scss', source);
    const extras = output!.match(/scss\/extras/g) ?? [];
    expect(extras).toHaveLength(1);
    expect(output!.indexOf("@use 'bulma/sass/utilities';")).toBeLessThan(
      output!.indexOf("@use '@allxsmith/bestax-bulma/scss/extras';")
    );
    const bulmaMode = run('modular.scss', source, 'bulma');
    expect(bulmaMode.output).not.toContain('extras');
  });

  it('preserves a relative node_modules prefix on the root import', () => {
    const source = [
      '$primary: #123456;',
      '@import "../../../../node_modules/bulma/bulma";',
    ].join('\n');
    const { output } = run('deep/nested.scss', source);
    expect(output).toContain(
      "@use '../../../../node_modules/bulma/sass' with ("
    );
    expect(output).toContain(
      "@use '../../../../node_modules/@allxsmith/bestax-bulma/src/scss/extras';"
    );
  });

  it('preserves a relative node_modules prefix on partial imports', () => {
    const { output } = run(
      'partial.scss',
      '@import "../../node_modules/bulma/sass/utilities/_all";\n'
    );
    expect(output).toContain("@use '../../node_modules/bulma/sass/utilities';");
  });

  it('flags third-party bulma extension imports with a targeted hint', () => {
    const { output, todos } = run(
      'checkradio.scss',
      '@import "../node_modules/bulma-checkradio/dist/css/bulma-checkradio.min.css";\n'
    );
    expect(output).toContain('bulma-checkradio is a Bulma 0.9-era extension');
    expect(todos[0].message).toContain('bulma-checkradio');
  });

  it('flags any other bulma @import it does not recognize', () => {
    const { output, todos } = run(
      'other.scss',
      "@import 'bulma-extensions/bulma-divider';\n"
    );
    expect(output).toContain('TODO(bestax-migrate)');
    expect(todos).toHaveLength(1);
  });

  describe("the source library's own stylesheet", () => {
    it.each([
      [
        'bare Sass entry point',
        "@import 'react-bulma-components/src/index.sass';\n",
      ],
      [
        '~-prefixed Sass entry point',
        "@import '~react-bulma-components/src/index.sass';\n",
      ],
      [
        'bundled v3 CSS',
        "@import 'react-bulma-components/dist/react-bulma-components.min.css';\n",
      ],
    ])(
      'is not mislabeled as a third-party extension (%s)',
      (_label, source) => {
        const { output, todos } = run('main.scss', source);
        expect(output).not.toContain('third-party');
        expect(output).not.toContain('bulma-components');
        // The mislabel we guard against is calling the library's own root a
        // third-party `bulma-components` *extension*; a report that names the
        // package while rewriting its root is fine.
        expect(todos.every(t => !t.message.includes('third-party'))).toBe(true);
        expect(todos.every(t => !t.message.includes('extension'))).toBe(true);
      }
    );

    it('bestax mode: rewrites the bare Sass entry point to bulma/sass + extras', () => {
      const { output } = run(
        'main.scss',
        "@import 'react-bulma-components/src/index.sass';\n"
      );
      expect(output).toContain("@use 'bulma/sass';");
      expect(output).toContain("@use '@allxsmith/bestax-bulma/scss/extras';");
      // Never the hard-configured bundle: it can't take the user's own theme
      // vars and reconfiguring bulma/sass elsewhere in the build is a hard error.
      expect(output).not.toContain('scss/bestax');
      expect(output).not.toContain('@import');
      expect(output).not.toContain('TODO');
    });

    it('bestax mode: rewrites the ~-prefixed Sass entry point the same way', () => {
      const { output } = run(
        'main.scss',
        "@import '~react-bulma-components/src/index.sass';\n"
      );
      expect(output).toContain("@use 'bulma/sass';");
      expect(output).toContain("@use '@allxsmith/bestax-bulma/scss/extras';");
    });

    it('bestax mode: rewrites the bundled v3 CSS entry point the same way', () => {
      const { output } = run(
        'main.scss',
        "@import 'react-bulma-components/dist/react-bulma-components.min.css';\n"
      );
      expect(output).toContain("@use 'bulma/sass';");
      expect(output).toContain("@use '@allxsmith/bestax-bulma/scss/extras';");
    });

    it('folds leading $var overrides above the RBC stylesheet into with (…)', () => {
      const source = [
        '$primary: #ff6b35;',
        "@import '~react-bulma-components/src/index.sass';",
      ].join('\n');
      const { output } = run('theme.scss', source);
      expect(output).toContain("@use 'bulma/sass' with (");
      expect(output).toContain('$primary: #ff6b35');
      expect(output).toContain("@use '@allxsmith/bestax-bulma/scss/extras';");
      expect(output).not.toContain('scss/bestax');
    });

    it('parenthesizes a comma-valued override folded through the RBC root', () => {
      // The seam between the two fixes: the RBC path folds vars through the
      // same emission as the @import root, so a bare Sass list must come out
      // parenthesized here too — Dart Sass otherwise reads the comma as an
      // extra with (…) argument.
      const source = [
        "$family-primary: 'Nunito', sans-serif;",
        "@import '~react-bulma-components/src/index.sass';",
      ].join('\n');
      const { output } = run('theme.scss', source);
      expect(output).toContain("$family-primary: ('Nunito', sans-serif)");
    });

    it.each([
      [
        'relative node_modules Sass path',
        "@import '../../node_modules/react-bulma-components/src/index.sass';\n",
      ],
      [
        'extensionless Sass entry point',
        "@import 'react-bulma-components/src/index';\n",
      ],
      [
        'deep component partial',
        "@import 'react-bulma-components/src/components/navbar.sass';\n",
      ],
    ])(
      'rewrites the RBC stylesheet regardless of specifier shape (%s)',
      (_l, source) => {
        const { output } = run('main.scss', source);
        expect(output).toContain('bulma/sass');
        expect(output).not.toContain('react-bulma-components');
        expect(output).not.toContain('convert to @use by hand');
      }
    );

    it('preserves the relative node_modules prefix on the rewritten root', () => {
      const { output } = run(
        'deep/nested.scss',
        "@import '../../node_modules/react-bulma-components/src/index.sass';\n"
      );
      expect(output).toContain("@use '../../node_modules/bulma/sass';");
      expect(output).toContain(
        "@use '../../node_modules/@allxsmith/bestax-bulma/src/scss/extras';"
      );
    });

    it('adds only the extras when the file already has its own @use bulma root', () => {
      const source = [
        "@use 'bulma/sass';",
        "@import 'react-bulma-components/src/index.sass';",
      ].join('\n');
      const { output } = run('main.scss', source);
      const bulmaRoots = (output ?? '').match(/@use '[^']*bulma\/sass'/g) ?? [];
      expect(bulmaRoots).toHaveLength(1); // the existing one, not a second
      expect(output).toContain("@use '@allxsmith/bestax-bulma/scss/extras';");
      expect(output).not.toContain('scss/bestax');
      expect(output).not.toContain('react-bulma-components');
    });

    it('drops the RBC line entirely (no second root) with an existing @use root in bulma mode', () => {
      const source = [
        "@use 'bulma/sass';",
        "@import 'react-bulma-components/src/index.sass';",
      ].join('\n');
      const { output } = run('main.scss', source, 'bulma');
      const bulmaRoots = (output ?? '').match(/@use '[^']*bulma\/sass'/g) ?? [];
      expect(bulmaRoots).toHaveLength(1);
      expect(output).not.toContain('extras');
      expect(output).not.toContain('react-bulma-components');
    });

    it('keep mode under --no-deps does not claim the package was removed', () => {
      const todos: TodoEntry[] = [];
      const output = transformStyles(
        'main.scss',
        "@import 'react-bulma-components/src/index.sass';\n",
        { add: entry => todos.push(entry) },
        { cssMode: 'keep', deps: false }
      );
      expect(output).toContain("@use 'bulma/sass';");
      expect(output).not.toContain('is removed');
      expect(output).not.toContain('entry is removed');
      expect(todos[0].message).not.toContain('removed from dependencies');
      expect(todos[0].message).toContain('--no-deps');
    });

    it('bulma mode: rewrites to plain bulma/sass with no extras', () => {
      const { output } = run(
        'main.scss',
        "@import 'react-bulma-components/src/index.sass';\n",
        'bulma'
      );
      expect(output).toContain("@use 'bulma/sass';");
      expect(output).not.toContain('extras');
    });

    it('keep mode: still replaces the dead import, with an accurate TODO', () => {
      const { output, todos } = run(
        'main.scss',
        "@import 'react-bulma-components/src/index.sass';\n",
        'keep'
      );
      expect(output).toContain("@use 'bulma/sass';");
      expect(output).toContain('TODO(bestax-migrate)');
      expect(output).not.toContain('@import');
      expect(todos[0].message).toContain('removed from dependencies');
      expect(todos[0].message).not.toContain('third-party');
    });

    it('drops the now-redundant import when a real bulma root import already exists', () => {
      const source = [
        "@import 'bulma/bulma';",
        "@import 'react-bulma-components/src/index.sass';",
      ].join('\n');
      const { output } = run('main.scss', source);
      const bulmaUses = (output ?? '').match(/@use '[^']*bulma\/sass'/g) ?? [];
      expect(bulmaUses).toHaveLength(1);
      expect(output).not.toContain('react-bulma-components');
    });

    it('flags a dropped RBC deep partial instead of losing its CSS (bulma mode)', () => {
      const source = [
        "@import 'bulma/bulma.sass';",
        "@import 'react-bulma-components/src/components/navbar.sass';",
      ].join('\n');
      const { output, todos } = run('main.scss', source, 'bulma');
      const bulmaRoots = (output ?? '').match(/@use '[^']*bulma\/sass'/g) ?? [];
      expect(bulmaRoots).toHaveLength(1);
      expect(output).not.toContain('react-bulma-components/src/components');
      expect(output).toContain('stylesheet partial');
      expect(todos.some(t => t.message.includes('partial dropped'))).toBe(true);
    });

    it('flags a second RBC deep partial in bestax mode (root + extras, partial not lost)', () => {
      const source = [
        "@import 'react-bulma-components/src/index.sass';",
        "@import 'react-bulma-components/src/components/tooltip.sass';",
      ].join('\n');
      const { output, todos } = run('main.scss', source);
      const bulmaRoots = (output ?? '').match(/@use '[^']*bulma\/sass'/g) ?? [];
      expect(bulmaRoots).toHaveLength(1);
      const extras = (output ?? '').match(/bestax-bulma\/scss\/extras/g) ?? [];
      expect(extras).toHaveLength(1);
      expect(output).not.toContain('react-bulma-components/src/components');
      expect(output).toContain('stylesheet partial');
      expect(todos.some(t => t.message.includes('partial dropped'))).toBe(true);
    });

    it('flags an RBC deep partial dropped beside the file’s own @use root (bestax mode)', () => {
      const source = [
        "@use 'bulma/sass';",
        "@import 'react-bulma-components/src/components/navbar.sass';",
      ].join('\n');
      const { output, todos } = run('main.scss', source);
      const bulmaRoots = (output ?? '').match(/@use '[^']*bulma\/sass'/g) ?? [];
      expect(bulmaRoots).toHaveLength(1);
      expect(output).toContain("@use '@allxsmith/bestax-bulma/scss/extras';");
      expect(output).toContain('stylesheet partial');
      expect(todos.some(t => t.message.includes('partial dropped'))).toBe(true);
    });

    it('does not flag the RBC root/index import when it is dropped as redundant', () => {
      const source = [
        "@import 'bulma/bulma';",
        "@import 'react-bulma-components/src/index.sass';",
      ].join('\n');
      const { output, todos } = run('main.scss', source, 'bulma');
      expect(output).not.toContain('stylesheet partial');
      expect(todos.some(t => t.message.includes('partial dropped'))).toBe(
        false
      );
    });

    it('still detects a genuine bulma-* extension alongside the RBC stylesheet', () => {
      const source = [
        "@import 'react-bulma-components/src/index.sass';",
        "@import 'bulma-checkradio/dist/css/bulma-checkradio.min.css';",
      ].join('\n');
      const { output, todos } = run('main.scss', source);
      expect(output).toContain('bulma-checkradio is a Bulma 0.9-era extension');
      expect(todos.some(t => t.message.includes('bulma-checkradio'))).toBe(
        true
      );
    });
  });
});

describe('transformStyles (.sass indented syntax)', () => {
  it('flags but does not rewrite indented-syntax files', () => {
    const source = '@import "bulma/bulma"\n.app\n  color: red\n';
    const { output, todos } = run('main.sass', source);
    expect(output).toContain('// TODO(bestax-migrate): convert Bulma 0.9');
    expect(output).toContain('@import "bulma/bulma"');
    expect(todos[0].rule).toBe('sass');
  });

  it('is idempotent on already-flagged files', () => {
    const source = '@import "bulma/bulma"\n';
    const first = run('main.sass', source).output!;
    expect(run('main.sass', first).output).toBeNull();
  });
});
