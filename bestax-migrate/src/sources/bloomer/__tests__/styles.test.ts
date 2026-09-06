/**
 * bloomer ships no stylesheet, so the shared Bulma pass is configured with no
 * source root. These pin the two things that configuration must still do:
 * rewrite the app's own Bulma import, and stay out of files that mention
 * neither.
 */

import { transformStyles } from '../styles.js';
import type { TodoEntry } from '../../../types.js';

function run(file: string, source: string) {
  const todos: TodoEntry[] = [];
  const output = transformStyles(
    file,
    source,
    { add: entry => todos.push(entry) },
    { cssMode: 'bestax' }
  );
  return { output, todos };
}

describe('bloomer transformStyles', () => {
  it('leaves files without Bulma references untouched', () => {
    expect(run('app.scss', '.card { color: red; }\n').output).toBeNull();
  });

  it('rewrites the 0.6-era Bulma root import to the v1 module', () => {
    const { output } = run(
      'styles.scss',
      "$primary: #1e6b99 !default;\n@import '~bulma/bulma';\n.app { color: $grey; }\n"
    );
    expect(output).toContain("@use 'bulma/sass' with (");
    expect(output).toMatch(/\$primary: #1e6b99/);
    expect(output).toContain("@use '@allxsmith/bestax-bulma/scss/extras';");
    expect(output).not.toContain('@import');
  });

  it('flags an indented-syntax file rather than rewriting it', () => {
    const { output, todos } = run('styles.sass', "@import '~bulma/bulma'\n");
    expect(output).toContain('TODO(bestax-migrate)');
    expect(todos.map(t => t.rule)).toEqual(['sass']);
  });

  it('treats a bloomer specifier like any dead source import', () => {
    // bloomer never shipped a stylesheet, so this line never existed in a
    // real app. The shared pass keeps its contract regardless: an import of
    // the package being removed is dead, and a file that styled itself from
    // it needs SOME Bulma root afterwards.
    const { output } = run('styles.scss', "@import 'bloomer';\n");
    expect(output).toContain("@use 'bulma/sass'");
    expect(output).not.toContain("@import 'bloomer'");
  });
});
