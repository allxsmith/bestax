/**
 * Type-check every live example in the docs, the way a reader's new app would.
 *
 * A `tsx live` fence runs on the site through react-live, which strips types
 * without checking them, so an example can pass a prop a component does not
 * take, or start state as `useState(null)` and hand the setter to a typed
 * callback, and still render. The ESLint pass in eslint-plugin-docs.test.mjs
 * reads the same fences, but it checks the plugin's rules, not the types. This
 * compiles each fence as its own module against the library's build, with the
 * compiler options a new Vite `react-ts` app starts with, and fails on any
 * error.
 *
 * Each fence is read the way the site runs it. `transformCode` in
 * `docs/src/theme/CodeBlock/index.js` drops a live fence's `import` and
 * `export default` lines, and react-live wraps what is left in `return (…)`, so
 * the fence is one expression: an element or a function. The module here
 * drops the same lines and exports that expression. An `import type` line
 * stays, since the site drops it only because types do not run, and it is how
 * an example names a library type. Every other name comes from what the site
 * puts in scope: `React`, `useState`, `useEffect`, every export of the
 * library, and the docs-only `ProfileCard`. A fence that uses something else,
 * such as a bare `useRef`, fails here as it would on the page.
 *
 * Because the fence's own value imports are dropped, a missing or extra name
 * in one is not caught. Unused locals are, as the template's
 * `noUnusedLocals` would catch them in a reader's app.
 *
 * `notypecheck` in the info string (```` ```tsx live notypecheck ````) exempts
 * one fence that is wrong on purpose. It holds only while the fence still has
 * a type error, so the marker goes when the mistake does, the way `nolint`
 * works for the ESLint pass.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { fenceSpans, splitLines } from './lib/api-page.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const LIBRARY = '@allxsmith/bestax-bulma';
const LIBRARY_DIR = join(REPO, 'bulma-ui');
const ROOT = 'docs/docs';
const OPT_OUT = 'notypecheck';
const PROFILE_CARD = join(
  REPO,
  'docs/src/components/SkillExamples/ProfileCard.jsx'
);

/**
 * The `compilerOptions` of a new Vite `react-ts` app's `tsconfig.app.json`,
 * with `strict` spelled out (TypeScript 6 turns it on by default; earlier
 * versions do not) and `allowJs` added for the docs-only `ProfileCard`, which
 * is a `.jsx` file. `types` is empty because the template's `vite/client` only
 * declares asset imports, and the fences' imports are dropped.
 */
const VITE_REACT_TS = {
  target: 'es2023',
  lib: ['ES2023', 'DOM'],
  module: 'esnext',
  types: [],
  skipLibCheck: true,
  moduleResolution: 'bundler',
  allowImportingTsExtensions: true,
  verbatimModuleSyntax: true,
  moduleDetection: 'force',
  noEmit: true,
  jsx: 'react-jsx',
  strict: true,
  noUnusedLocals: true,
  noUnusedParameters: true,
  erasableSyntaxOnly: true,
  noFallthroughCasesInSwitch: true,
  allowJs: true,
};

/** The live fences in one markdown source, with their opening line index. */
export function liveFences(src) {
  const { lines } = splitLines(src);
  const out = [];
  for (const { open, close } of fenceSpans(lines)) {
    const [lang, ...meta] = lines[open]
      .replace(/^ {0,3}(`{3,}|~{3,})/, '')
      .trim()
      .split(/\s+/);
    if (lang !== 'tsx' || !meta.includes('live')) continue;
    out.push({
      open,
      body: lines.slice(open + 1, close),
      optOut: meta.includes(OPT_OUT),
    });
  }
  return out;
}

/**
 * One fence as a module. The header binds the site's scope; the body keeps
 * every line where it was, so a diagnostic's line maps straight back to the
 * page. Returns the source and how many header lines precede the body.
 */
function asModule(body, libraryNames) {
  const header = [
    "import React, { useEffect, useState } from 'react';",
    `import { ${libraryNames.join(', ')} } from '${LIBRARY}';`,
    `import { ProfileCard } from ${JSON.stringify(PROFILE_CARD)};`,
  ];
  const lines = body.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('import type ')) return line;
    return trimmed.startsWith('import') || trimmed.startsWith('export default')
      ? ''
      : line;
  });
  const code = lines.map((line, i) =>
    line.trim() && !line.trim().startsWith('import type ') ? i : -1
  );
  const first = code.find(i => i >= 0);
  const last = code.findLast(i => i >= 0);
  if (first !== undefined) {
    lines[first] = `export default (${lines[first]}`;
    // The paren closes on the last code line because react-live's wrapper
    // closes it there too. A fence that ends in a `//` comment swallows it in
    // both, so the preview fails on the page and this reports the comment line.
    lines[last] = `${lines[last].replace(/;\s*$/, '')});`;
  }
  return {
    source: [...header, ...lines].join('\n'),
    headerLines: header.length,
  };
}

/** Everything a check needs, built once. */
function loadTools() {
  const types = join(LIBRARY_DIR, 'dist', 'types', 'index.d.ts');
  assert.ok(
    existsSync(types),
    'bulma-ui/dist is absent, so the docs examples cannot be type-checked ' +
      'against the library. Build first, or run `pnpm all`.'
  );
  const ts = createRequire(join(REPO, 'package.json'))('typescript');
  const library = createRequire(join(LIBRARY_DIR, 'package.json'))(
    join(LIBRARY_DIR, 'dist', 'index.cjs')
  );
  const libraryNames = Object.keys(library).filter(name =>
    /^[A-Za-z_$][\w$]*$/.test(name)
  );
  const { options, errors } = ts.convertCompilerOptionsFromJson(
    VITE_REACT_TS,
    LIBRARY_DIR
  );
  assert.deepEqual(errors, [], 'the compiler options did not parse');
  return { ts, options, libraryNames };
}

/**
 * Type-check the live fences of every page given, in one program, and return
 * one line per problem. Pages are `{ file, src }`; the modules sit in the
 * library's directory so its own name and its React types resolve as they do
 * for an app that installed it.
 */
export function checkPages(pages, tools) {
  const { ts, options, libraryNames } = tools;
  const modules = new Map();
  for (const { file, src } of pages) {
    for (const fence of liveFences(src)) {
      const name = join(
        LIBRARY_DIR,
        '.docs-fences',
        `${file.replace(/[^\w]/g, '_')}_L${fence.open + 1}.tsx`
      );
      modules.set(name, {
        file,
        fence,
        ...asModule(fence.body, libraryNames),
      });
    }
  }

  const host = ts.createCompilerHost(options);
  const { getSourceFile, fileExists, readFile } = host;
  host.fileExists = name => modules.has(name) || fileExists.call(host, name);
  host.readFile = name =>
    modules.get(name)?.source ?? readFile.call(host, name);
  host.getSourceFile = (name, version, ...rest) =>
    modules.has(name)
      ? ts.createSourceFile(name, modules.get(name).source, version, true)
      : getSourceFile.call(host, name, version, ...rest);
  const program = ts.createProgram([...modules.keys()], options, host);

  const problems = [];
  const global = program.getGlobalDiagnostics();
  for (const d of [...program.getOptionsDiagnostics(), ...global]) {
    problems.push(
      `compiler: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`
    );
  }
  for (const [name, { file, fence, headerLines }] of modules) {
    const sourceFile = program.getSourceFile(name);
    const found = [
      ...program.getSyntacticDiagnostics(sourceFile),
      ...program.getSemanticDiagnostics(sourceFile),
    ]
      .map(d => ({
        line: sourceFile.getLineAndCharacterOfPosition(d.start ?? 0).line,
        code: d.code,
        text: ts.flattenDiagnosticMessageText(d.messageText, ' '),
      }))
      // The header imports the whole scope, and most of it goes unused.
      .filter(d => d.line >= headerLines);
    if (fence.optOut) {
      if (found.length === 0) {
        problems.push(
          `${file}:${fence.open + 1}: the live fence is marked \`${OPT_OUT}\` ` +
            'and type-checks. Remove the marker so the fence is checked again.'
        );
      }
      continue;
    }
    for (const d of found) {
      // Body line i is markdown line open + 2 + i, counting from 1.
      const line = fence.open + 2 + d.line - headerLines;
      problems.push(`${file}:${line}: TS${d.code} ${d.text}`);
    }
  }
  return problems;
}

/** Every markdown page under the docs root, in a stable order. */
function docsPages() {
  const out = [];
  const visit = dir => {
    const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (/\.mdx?$/.test(entry.name)) {
        out.push({
          file: relative(REPO, path).split(sep).join('/'),
          src: readFileSync(path, 'utf8'),
        });
      }
    }
  };
  visit(join(REPO, ROOT));
  return out;
}

/** A page holding one live fence, for the checks on the checker itself. */
const page = (file, body, info = 'tsx live') => ({
  file,
  src: ['# Page', '', `\`\`\`${info}`, body, '```', ''].join('\n'),
});

const FIXTURES = [
  page('fixture/wrong-prop.md', '<Button outlined>Go</Button>'),
  page(
    'fixture/untyped-state.md',
    [
      'function example() {',
      '  const [date, setDate] = useState(null);',
      '  return <DateInput value={date} onChange={setDate} />;',
      '}',
    ].join('\n')
  ),
  page(
    'fixture/out-of-scope.md',
    [
      'function example() {',
      '  const ref = useRef(null);',
      '  return <Box ref={ref} />;',
      '}',
    ].join('\n')
  ),
  page(
    'fixture/imports.md',
    [
      "import { Box } from 'some-other-library';",
      `import type { TaginputTag } from '${LIBRARY}';`,
      '',
      'function example() {',
      "  const [tags, setTags] = useState<TaginputTag[]>(['React']);",
      '  return (',
      '    <Box>',
      '      <Taginput value={tags} onChange={setTags} />',
      '    </Box>',
      '  );',
      '}',
    ].join('\n')
  ),
  page(
    'fixture/trailing-comment.md',
    ['<Button color="primary">', '  Go', '</Button>', '// a note'].join('\n')
  ),
  page('fixture/scope-only.md', '<ProfileCard name="Ada" />;'),
  page(
    'fixture/marked-and-wrong.md',
    '<Button outlined>Go</Button>',
    `tsx live ${OPT_OUT}`
  ),
  page(
    'fixture/marked-and-fine.md',
    '<Button isOutlined>Go</Button>',
    `tsx live ${OPT_OUT}`
  ),
];

describe('the docs live examples type-check', () => {
  const tools = loadTools();
  const pages = docsPages();
  const problems = checkPages([...pages, ...FIXTURES], tools);
  const about = file => problems.filter(p => p.startsWith(`${file}:`));

  it('binds the library exports the site puts in scope', () => {
    assert.ok(
      tools.libraryNames.includes('Box') &&
        tools.libraryNames.includes('useBulmaClasses'),
      'the library exports read from the build look wrong'
    );
  });

  it('finds live examples under docs/docs', () => {
    const count = pages.reduce((n, p) => n + liveFences(p.src).length, 0);
    assert.ok(count > 0, 'no live fences found under docs/docs');
  });

  it('reports a prop the component does not take, at its page line', () => {
    const [problem, ...rest] = about('fixture/wrong-prop.md');
    assert.equal(rest.length, 0);
    assert.match(problem, /^fixture\/wrong-prop\.md:4: TS\d+ /);
  });

  it('reports state too narrow for the callback it feeds', () => {
    assert.match(about('fixture/untyped-state.md').join('\n'), /:6: TS2322 /);
  });

  it('reports a name the site does not put in scope', () => {
    assert.match(
      about('fixture/out-of-scope.md').join('\n'),
      /:5: TS2304 Cannot find name 'useRef'/
    );
  });

  it('reports a fence whose last line is a comment, as its preview fails', () => {
    assert.deepEqual(about('fixture/trailing-comment.md'), [
      "fixture/trailing-comment.md:7: TS1005 ')' expected.",
    ]);
  });

  it('drops value imports as the site does and keeps import type', () => {
    assert.deepEqual(about('fixture/imports.md'), []);
  });

  it('binds the docs-only ProfileCard, as the live scope does', () => {
    assert.deepEqual(about('fixture/scope-only.md'), []);
  });

  it(`holds a \`${OPT_OUT}\` fence only while it has an error`, () => {
    assert.deepEqual(about('fixture/marked-and-wrong.md'), []);
    assert.deepEqual(about('fixture/marked-and-fine.md'), [
      `fixture/marked-and-fine.md:3: the live fence is marked \`${OPT_OUT}\` ` +
        'and type-checks. Remove the marker so the fence is checked again.',
    ]);
  });

  it('every live example under docs/docs type-checks', () => {
    assert.deepEqual(
      problems.filter(p => !p.startsWith('fixture/')),
      [],
      'Fix the example so it compiles in a new Vite react-ts app. One that ' +
        `is wrong on purpose takes \`${OPT_OUT}\` in its info string.`
    );
  });
});
