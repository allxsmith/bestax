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
