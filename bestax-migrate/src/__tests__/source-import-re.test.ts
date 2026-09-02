/**
 * The specifier matcher both CLI passes share. It decides two things that
 * pull in opposite directions: whether a file still references the source
 * package (so the manifest pass must not drop it), and whether an
 * unparseable file is worth reporting. Too loose and prose pins a dependency
 * forever; too tight and the package is removed out from under a live import.
 */

import { blankComments, makeSourceImportRe } from '../cli.js';

describe('makeSourceImportRe', () => {
  const matches = (src: string) =>
    makeSourceImportRe('rbx').test(blankComments(src));

  it.each([
    ['named import', `import { Box } from 'rbx';`],
    ['default import', `import rbx from 'rbx';`],
    ['namespace import', `import * as R from 'rbx';`],
    ['deep import', `import { Theme } from 'rbx/base/theme';`],
    ['side-effect import', `import 'rbx/index.sass';`],
    ['double-quoted', `import { Box } from "rbx";`],
    ['require', `const x = require('rbx');`],
    ['dynamic import', `const p = import('rbx');`],
    ['sass tilde import', `@import '~rbx/rbx';`],
    ['relative node_modules import', `@import '../node_modules/rbx/rbx';`],
  ])('matches a %s', (_label, src) => {
    expect(matches(src)).toBe(true);
  });

  it('matches through a webpack magic comment', () => {
    // `import(/* webpackChunkName: "x" */ 'rbx')` puts a comment exactly
    // where the matcher allowed only whitespace, so a lazily-loaded source
    // import read as no import at all.
    expect(
      matches(`const p = import(/* webpackChunkName: "x" */ 'rbx');`)
    ).toBe(true);
    expect(matches(`import { Box } from /* pinned */ 'rbx';`)).toBe(true);
  });

  it.each([
    [
      'a longer package that shares the prefix',
      `import { a } from 'rbx-utils';`,
    ],
    ['a longer package that shares the suffix', `import { a } from 'notrbx';`],
    ['a scoped lookalike', `import { a } from '@acme/rbx-helpers';`],
    ['prose in an mdx file', `This page explains how rbx handled themes.`],
    ['an identifier that contains the name', `const rbxConfig = {};`],
  ])('does not match %s', (_label, src) => {
    expect(matches(src)).toBe(false);
  });

  it.each([
    ['a commented-out import', `// import { Box } from 'rbx';`],
    ['a commented-out require', `  // const x = require('rbx');`],
    ['an identifier ending in require', `const x = myrequire('rbx');`],
  ])('does not match %s', (_label, src) => {
    expect(matches(src)).toBe(false);
  });

  it('matches an import that shares its line with a tag', () => {
    // Single-file components put the import inside `<script>`, so anchoring
    // to the start of the line would miss every .vue and .astro file.
    expect(matches(`<script>import { Box } from 'rbx';</script>`)).toBe(true);
  });

  it('matches require.resolve, which is as live as require', () => {
    expect(matches(`const p = require.resolve('rbx');`)).toBe(true);
    expect(matches(`require.resolve('rbx/index.sass')`)).toBe(true);
    expect(matches(`myrequire.resolve('rbx')`)).toBe(false);
  });

  it('matches a multi-line specifier list', () => {
    expect(matches(`import {\n  Box,\n  Button\n} from 'rbx';`)).toBe(true);
  });

  it('escapes regex metacharacters in the package name', () => {
    const re = makeSourceImportRe('react-bulma-components');
    expect(re.test(`import { Box } from 'react-bulma-components';`)).toBe(true);
    expect(re.test(`import { Box } from 'reactxbulmaxcomponents';`)).toBe(
      false
    );
  });
});

describe('blankComments', () => {
  // No lookbehind can do this job: `// import … from 'rbx'` is not an import,
  // while the `//` inside `'http://x'` is not a comment.
  it('blanks a line comment but keeps offsets and line breaks', () => {
    const src = "a\n// import { Box } from 'rbx';\nb";
    const out = blankComments(src);
    expect(out).toHaveLength(src.length);
    expect(out.split('\n')).toHaveLength(3);
    expect(out).not.toContain('rbx');
  });

  it('blanks a block comment', () => {
    expect(blankComments("/* import { Box } from 'rbx'; */")).not.toContain(
      'rbx'
    );
  });

  it('leaves a // inside a string alone', () => {
    const out = blankComments("const u = 'http://x//y';");
    expect(out).toContain("'http://x//y'");
  });

  it('handles an escaped quote without ending the string early', () => {
    const out = blankComments("const s = 'a\\'b'; // gone");
    expect(out).toContain("'a\\'b'");
    expect(out).not.toContain('gone');
  });

  it('leaves code with no comments byte-identical', () => {
    const src = "import { Box } from 'rbx';\nconst x = 1;";
    expect(blankComments(src)).toBe(src);
  });
});

describe('comment handling in the matcher', () => {
  it('matches through a line comment inside a dynamic import', () => {
    expect(matchesSrc("const p = import(\n// chunk\n'rbx');")).toBe(true);
  });

  it('matches a require after a string containing //', () => {
    expect(matchesSrc("const u = 'http://x//y'; require('rbx')")).toBe(true);
  });

  it('does not match an import inside a block comment', () => {
    expect(matchesSrc("/* import { Box } from 'rbx'; */")).toBe(false);
  });
});

function matchesSrc(src: string): boolean {
  return makeSourceImportRe('rbx').test(blankComments(src));
}
