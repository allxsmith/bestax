/**
 * The StackBlitz and CodeSandbox builders behind a live example's sandbox
 * buttons (src/theme/CodeBlock/sandbox). The project builders read the real
 * create-bestax template, so a template change that breaks them fails here.
 * Whether every live example converts into a module that type-checks is
 * checked over the whole docs tree by scripts/docs-fence-types.test.mjs at
 * the repo root.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  blankNonCode,
  toExampleModule,
} from '../src/theme/CodeBlock/sandbox/example.mjs';
import { stripModuleLines } from '../src/theme/CodeBlock/sandbox/moduleLines.mjs';
import {
  TEMPLATE_FILES,
  codesandboxFiles,
  iconLibrariesIn,
  stackblitzProject,
} from '../src/theme/CodeBlock/sandbox/projects.mjs';

const DOCS = dirname(dirname(fileURLToPath(import.meta.url)));
const TEMPLATE_DIR = join(DOCS, '..', 'create-bestax', 'templates', 'vite-ts');
const TEMPLATE = Object.fromEntries(
  TEMPLATE_FILES.map(path => [
    path,
    readFileSync(join(TEMPLATE_DIR, path), 'utf8'),
  ])
);
const docsPackage = createRequire(import.meta.url)('../package.json');

const OPTIONS = {
  libraryExports: [
    'Block',
    'Box',
    'Button',
    'Buttons',
    'Card',
    'Columns',
    'Column',
    'Delete',
    'Icon',
    'Notification',
    'Section',
    'Taginput',
    'Title',
    'notification',
    'toast',
    'useConfig',
  ],
  reactNames: ['useState', 'useEffect'],
  docsOnlyNames: ['ProfileCard'],
};

const lowest = range => range.replace(/^[\s=v^~>]+/, '');

const convert = (code, extra = {}) =>
  toExampleModule(code, { ...OPTIONS, ...extra });

const importsOf = source =>
  source.split('\n').filter(line => line.startsWith('import '));

describe('stripModuleLines', () => {
  it('drops import and export default lines, as the live editor does', () => {
    const code = [
      "import { Box } from '@allxsmith/bestax-bulma';",
      '  import type { X } from "y";',
      'function A() {}',
      'export default A;',
    ].join('\n');
    assert.equal(stripModuleLines(code), 'function A() {}');
  });
});

describe('blankNonCode', () => {
  it('blanks strings, comments and template text but keeps template code', () => {
    const src = 'a(\'Box\') // Box\n/* Box */ `Box ${Card} Box` + "Box"';
    const out = blankNonCode(src);
    assert.equal(out.length, src.length);
    assert.doesNotMatch(out, /Box/);
    assert.match(out, /\bCard\b/);
    assert.match(out, /^a\(/);
  });

  it('blanks a regex literal, quotes and all, but not a division', () => {
    const out = blankNonCode(
      "const ok = /^[^'@]+@Box/.test(v); const r = a / b / Card;"
    );
    assert.doesNotMatch(out, /Box/);
    assert.match(out, /a \/ b \/ Card/);
  });
});

describe('toExampleModule', () => {
  it('wraps a bare element in a default-exported component', () => {
    const { source } = convert('<Box>\n  <Button>Go</Button>\n</Box>;');
    assert.equal(
      source,
      [
        "import { Box, Button } from '@allxsmith/bestax-bulma';",
        '',
        'export default function Example() {',
        '  return (',
        '    <Box>',
        '      <Button>Go</Button>',
        '    </Box>',
        '  );',
        '}',
        '',
      ].join('\n')
    );
  });

  it('exports a named function component by its name', () => {
    const { source } = convert('function Demo() {\n  return <Box>Hi</Box>;\n}');
    assert.match(source, /\n\nexport default Demo;\n$/);
    assert.match(source, /^function Demo\(\) \{$/m);
  });

  it('assigns any other expression, such as an arrow component', () => {
    const { source } = convert('() => <Box>Hi</Box>');
    assert.match(source, /^const Example = \(\) => <Box>Hi<\/Box>;$/m);
    assert.match(source, /\nexport default Example;\n$/);
  });

  it('imports what the example references and nothing it only says', () => {
    const { libraryImports } = convert(
      '<Section>\n  <Title>Delete the Box</Title>\n  <Button title="Notification">Card</Button>\n</Section>'
    );
    assert.deepEqual(libraryImports, ['Button', 'Section', 'Title']);
  });

  it('reads a member expression by its object only', () => {
    const { libraryImports } = convert('<Card.Header>Hi</Card.Header>');
    assert.deepEqual(libraryImports, ['Card']);
  });

  it('skips object keys but keeps a spread', () => {
    const { libraryImports } = convert(
      'function A() {\n  const props = { toast: 1, ...useConfig() };\n  return <Box {...props} />;\n}'
    );
    assert.deepEqual(libraryImports, ['Box', 'useConfig']);
  });

  it('leaves out library names the example binds itself', () => {
    const { libraryImports } = convert(
      [
        'function A() {',
        '  const [notification, setNotification] = useState(null);',
        '  const items = [1, 2].map(Block => Block);',
        '  const list = [3].map((Column, i) => Column + i);',
        '  function Delete() { return null; }',
        '  return <Box>{notification}{items}{list}<Delete /></Box>;',
        '}',
      ].join('\n')
    );
    assert.deepEqual(libraryImports, ['Box']);
  });

  it('imports a library function called as a value', () => {
    const { libraryImports } = convert(
      "<Button onClick={() => toast.success('Saved')}>Save</Button>"
    );
    assert.deepEqual(libraryImports, ['Button', 'toast']);
  });

  it('imports the hooks it uses, and React when it is named', () => {
    const hooks = convert(
      'function A() {\n  const [n] = useState(0);\n  return <Box>{n}</Box>;\n}'
    );
    assert.equal(
      importsOf(hooks.source)[0],
      "import { useState } from 'react';"
    );

    const both = convert(
      'function A() {\n  const ref = React.useRef(null);\n  useEffect(() => {}, []);\n  return <Box ref={ref} />;\n}'
    );
    assert.equal(
      importsOf(both.source)[0],
      "import React, { useEffect } from 'react';"
    );

    const none = convert('<Box>React.js</Box>');
    assert.equal(importsOf(none.source).length, 1);
  });

  it('imports React for a type annotation the scan compiles away', () => {
    const { source } = convert(
      'function A() {\n  const on = (e: React.ChangeEvent<HTMLInputElement>) => e;\n  return <Box onClick={on} />;\n}'
    );
    assert.equal(importsOf(source)[0], "import React from 'react';");
  });

  it('keeps an import type line and rewrites value imports', () => {
    const { source } = convert(
      [
        "import { Box, Taginput } from 'some-other-library';",
        "import type { TaginputTag } from '@allxsmith/bestax-bulma';",
        '',
        'function A() {',
        "  const [tags, setTags] = useState<TaginputTag[]>(['React']);",
        '  return <Taginput value={tags} onChange={setTags} />;',
        '}',
      ].join('\n')
    );
    assert.deepEqual(importsOf(source), [
      "import { useState } from 'react';",
      "import { Taginput } from '@allxsmith/bestax-bulma';",
      "import type { TaginputTag } from '@allxsmith/bestax-bulma';",
    ]);
  });

  it('breaks a long import over lines the way Prettier does', () => {
    const { source } = convert(
      '<Section><Columns><Column><Card><Title><Notification><Button><Buttons><Block><Box /></Block></Buttons></Button></Notification></Title></Card></Column></Columns></Section>'
    );
    assert.match(
      source,
      /^import \{\n {2}Block,\n(?: {2}\w+,\n)+\} from '@allxsmith\/bestax-bulma';$/m
    );
  });

  it('does not indent an element holding a template literal', () => {
    const { source } = convert('<Box>{`line one\nline two`}</Box>');
    assert.match(source, /\n<Box>\{`line one\nline two`\}<\/Box>\n/);
  });

  it('heads the module with the docs page it came from', () => {
    const { source } = convert('<Box />', {
      sourceUrl: 'https://bestax.io/docs/api/elements/box',
    });
    assert.match(
      source,
      /^\/\/ Live example from https:\/\/bestax\.io\/docs\/api\/elements\/box\n\nimport /
    );
  });

  it('keeps leading comments with the example', () => {
    const { source } = convert('// Try editing this code!\n<Box />');
    assert.match(source, / {4}\/\/ Try editing this code!\n {4}<Box \/>/);
    const named = convert('// note\nfunction A() { return <Box />; }');
    assert.match(named.source, /\n\nexport default A;\n$/);
  });

  it('returns null for an example that uses a docs-only component', () => {
    assert.equal(convert('<ProfileCard name="Ada" />'), null);
  });

  it('still converts an edit that does not compile', () => {
    const result = convert('<Box>\n  <Button>Go</Butto\n</Box>');
    assert.deepEqual(result.libraryImports, ['Box', 'Button']);
  });
});

describe('iconLibrariesIn', () => {
  it('always includes Font Awesome and adds the libraries an example names', () => {
    assert.deepEqual(iconLibrariesIn('<Box />'), ['fa']);
    assert.deepEqual(
      iconLibrariesIn(
        '<><Icon library="mdi" name="home" /><Icon library="ion" name="heart" /></>'
      ),
      ['fa', 'mdi', 'ion']
    );
    assert.deepEqual(
      iconLibrariesIn(
        '<ConfigProvider iconLibrary="material-symbols"><Icon library="material-icons" /></ConfigProvider>'
      ),
      ['fa', 'material-icons', 'material-symbols']
    );
  });
});

const INPUT = {
  app: 'export default function Example() {\n  return null;\n}\n',
  icons: ['fa', 'mdi', 'ion'],
  template: TEMPLATE,
  versions: {
    '@allxsmith/bestax-bulma': '^5.16.8',
    '@fortawesome/fontawesome-free':
      docsPackage.dependencies['@fortawesome/fontawesome-free'],
    '@mdi/font': docsPackage.dependencies['@mdi/font'],
    ionicons: '^8.1.0',
  },
  title: 'Button <example>',
  sourceUrl: 'https://bestax.io/docs/api/elements/button',
};

describe('stackblitzProject', () => {
  const project = stackblitzProject(INPUT);
  const pkg = JSON.parse(project.files['package.json']);

  it('is a Node project built from the create-bestax template', () => {
    assert.equal(project.template, 'node');
    assert.equal(project.title, INPUT.title);
    assert.equal(project.description, INPUT.sourceUrl);
    assert.deepEqual(
      Object.keys(project.files).sort(),
      [...TEMPLATE_FILES, 'src/App.tsx'].sort()
    );
    assert.equal(project.files['src/App.tsx'], INPUT.app);
    assert.equal(project.files['vite.config.ts'], TEMPLATE['vite.config.ts']);
  });

  it('installs the documented library and the icon packages, without lint', () => {
    assert.equal(pkg.dependencies['@allxsmith/bestax-bulma'], '^5.16.8');
    assert.ok(pkg.dependencies['@fortawesome/fontawesome-free']);
    assert.ok(pkg.dependencies['@mdi/font']);
    assert.equal(pkg.dependencies.ionicons, undefined);
    assert.ok(pkg.dependencies.react && pkg.devDependencies.vite);
    assert.equal(pkg.scripts.lint, undefined);
    assert.deepEqual(
      Object.keys(pkg.devDependencies).filter(name =>
        /eslint|^globals$/.test(name)
      ),
      []
    );
  });

  it('imports the icon stylesheets after the bestax one', () => {
    const lines = project.files['src/main.tsx'].split('\n');
    const at = lines.indexOf("import '@allxsmith/bestax-bulma/bestax.css';");
    assert.ok(at >= 0);
    assert.deepEqual(lines.slice(at + 1, at + 3), [
      "import '@fortawesome/fontawesome-free/css/all.min.css';",
      "import '@mdi/font/css/materialdesignicons.min.css';",
    ]);
  });

  it('loads Ionicons from its CDN build', () => {
    assert.match(
      project.files['index.html'],
      /<script type="module" src="https:\/\/cdn\.jsdelivr\.net\/npm\/ionicons@8\.1\.0\/dist\/ionicons\/ionicons\.esm\.js"><\/script>\n {2}<\/head>/
    );
  });

  it('names what it is missing instead of building a broken project', () => {
    const partial = { ...TEMPLATE };
    delete partial['vite.config.ts'];
    assert.throws(
      () => stackblitzProject({ ...INPUT, template: partial }),
      /missing vite\.config\.ts/
    );
    assert.throws(
      () =>
        stackblitzProject({
          ...INPUT,
          template: {
            ...TEMPLATE,
            'src/main.tsx': "import App from './App.tsx';",
          },
        }),
      /no longer imports the bestax stylesheet/
    );
    assert.throws(
      () => stackblitzProject({ ...INPUT, versions: {} }),
      /No version was given for @allxsmith\/bestax-bulma/
    );
  });
  it('darkens the page and pads the example, in index.html and index.css', () => {
    assert.match(
      project.files['index.html'],
      /<html lang="en" data-theme="dark">/
    );
    const css = project.files['src/index.css'];
    assert.match(css, /background: #16171d/);
    assert.match(css, /#root \{[^}]*padding: 1\.5rem/);
  });
});

/**
 * The template files a StackBlitz project leaves out, each with the reason.
 * Every other file is in TEMPLATE_FILES, so a file the template gains when it
 * catches up with create-vite reaches the sandbox, or fails here, instead of
 * the sandbox falling a step behind the scaffold.
 */
const LEFT_OUT = {
  _gitignore: 'a sandbox is not a repository',
  'README.md': 'it describes the starter app, not the example',
  'eslint.config.js': 'a sandbox runs no lint, and drops its packages too',
  'public/react.svg': 'only the starter App shows it',
  'public/vite.svg': 'only the starter App shows it',
  'src/App.css': 'only the starter App imports it',
  'src/App.tsx': 'the example is written in its place',
};

/**
 * The files the template tracks, by path in it. Read from git rather than
 * the disk, so a lockfile or dist/ that an install or build inside the
 * template leaves behind is not taken for a file the template gained. A
 * tracked file deleted but not yet staged is gone from the template already.
 */
function templateFiles() {
  return execFileSync('git', ['ls-files', '-z'], {
    cwd: TEMPLATE_DIR,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(path => path && existsSync(join(TEMPLATE_DIR, path)));
}

/**
 * What open.js copies: each key of its TEMPLATE, with the template file the
 * raw-loader import bound to that key reads. open.js only runs under webpack,
 * so it is read here as text.
 */
function openJsTemplate() {
  const source = readFileSync(
    join(DOCS, 'src', 'theme', 'CodeBlock', 'sandbox', 'open.js'),
    'utf8'
  );
  const imports = new Map(
    [
      ...source.matchAll(
        /^import (\w+) from '!!raw-loader!@site\/\.\.\/create-bestax\/templates\/vite-ts\/([^']+)';$/gm
      ),
    ].map(([, name, path]) => [name, path])
  );
  const body = source.match(/^const TEMPLATE = \{\n([\s\S]*?)\n\};$/m)?.[1];
  assert.ok(body, 'open.js no longer declares `const TEMPLATE = { … };`');
  return new Map(
    [...body.matchAll(/^ {2}'([^']+)': (\w+),$/gm)].map(([, key, name]) => [
      key,
      imports.get(name),
    ])
  );
}

describe('the template files', () => {
  it('each reach the StackBlitz project or are left out for a reason', () => {
    const files = templateFiles();
    assert.deepEqual(
      files.filter(
        path => !TEMPLATE_FILES.includes(path) && !Object.hasOwn(LEFT_OUT, path)
      ),
      [],
      'Add each file to TEMPLATE_FILES (projects.mjs) and TEMPLATE (open.js), ' +
        'or to LEFT_OUT here with the reason the sandbox does without it.'
    );
    assert.deepEqual(
      Object.keys(LEFT_OUT).filter(path => !files.includes(path)),
      [],
      'LEFT_OUT names a file the template no longer has.'
    );
  });

  // A file TEMPLATE_FILES names and open.js leaves out passes the docs build
  // and the builders' tests, and the button then throws on the reader's click.
  it("are each copied by open.js's TEMPLATE, from the file of that name", () => {
    const copied = openJsTemplate();
    assert.deepEqual(
      [...copied.keys()].sort(),
      [...TEMPLATE_FILES].sort(),
      "open.js's TEMPLATE must hold a key for exactly the files in TEMPLATE_FILES."
    );
    assert.deepEqual(
      TEMPLATE_FILES.filter(path => copied.get(path) !== path),
      [],
      "Each key in open.js's TEMPLATE must be bound to the raw-loader import of that file."
    );
  });
});

describe('codesandboxFiles', () => {
  const files = codesandboxFiles(INPUT);
  const pkg = files['package.json'].content;

  it('lays the example out as a Create React App project', () => {
    assert.deepEqual(Object.keys(files).sort(), [
      'package.json',
      'public/index.html',
      'src/App.tsx',
      'src/css.d.ts',
      'src/index.css',
      'src/index.tsx',
      'tsconfig.json',
    ]);
    assert.equal(pkg.main, 'src/index.tsx');
    assert.equal(pkg.scripts.start, 'react-scripts start');
    assert.ok(pkg.devDependencies['react-scripts']);
    assert.equal(
      pkg.dependencies.react,
      JSON.parse(TEMPLATE['package.json']).dependencies.react
    );
    assert.equal(pkg.dependencies['@allxsmith/bestax-bulma'], '^5.16.8');
    assert.equal(files['src/App.tsx'].content, INPUT.app);
  });

  it('enters through the template main file, importing App without extension', () => {
    const entry = files['src/index.tsx'].content;
    assert.match(entry, /^import App from '\.\/App';$/m);
    // The library stylesheet loads from the CDN in index.html instead, since
    // CodeSandbox inlines an imported stylesheet and keeps its byte-order mark.
    assert.doesNotMatch(entry, /bestax-bulma\/bestax\.css/);
    assert.match(
      files['public/index.html'].content,
      /<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/@allxsmith\/bestax-bulma@[\d.]+\/dist\/bestax\.css" \/>/
    );
    // The editor's TypeScript predates `bundler` and cannot resolve the
    // library's types under it.
    assert.equal(
      JSON.parse(files['tsconfig.json'].content).compilerOptions
        .moduleResolution,
      'node'
    );
  });

  it('writes a page with a root, the escaped title and the Ionicons script', () => {
    const html = files['public/index.html'].content;
    assert.match(html, /<div id="root"><\/div>/);
    assert.match(html, /<title>Button &lt;example&gt;<\/title>/);
    assert.match(html, /ionicons@8\.1\.0\/dist\/ionicons\/ionicons\.esm\.js/);
  });

  it('links the icon stylesheets from the CDN instead of installing them', () => {
    // CodeSandbox inlines a package stylesheet without rewriting its font
    // URLs, so an installed icon font never loads there.
    const html = files['public/index.html'].content;
    const mdi = lowest(INPUT.versions['@mdi/font']);
    assert.ok(
      html.includes(
        `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@${mdi}/css/materialdesignicons.min.css" />`
      )
    );
    assert.match(html, /fontawesome-free@[\d.]+\/css\/all\.min\.css/);
    assert.doesNotMatch(files['src/index.tsx'].content, /fontawesome|@mdi/);
    assert.equal(pkg.dependencies['@mdi/font'], undefined);
    assert.equal(pkg.dependencies['@fortawesome/fontawesome-free'], undefined);
  });

  it('darkens the page and pads the example in the CodeSandbox page and CSS', () => {
    assert.match(
      files['public/index.html'].content,
      /<html lang="en" data-theme="dark">/
    );
    const css = files['src/index.css'].content;
    assert.match(css, /background: #16171d/);
    assert.match(css, /#root \{[^}]*padding: 1\.5rem/);
  });
});

/*
 * The live preview on the docs page and the sandboxes paint the same dark
 * surface, but in two files. This keeps the page's copy from drifting.
 */
describe('docs live preview surface', () => {
  it("matches the sandboxes' dark background and padding", () => {
    const css = readFileSync(join(DOCS, 'src', 'css', 'custom.css'), 'utf8');
    assert.match(css, /\.live-preview-slot \{[^}]*background: #16171d/);
    assert.match(css, /\.live-preview-slot \{[^}]*padding: 1\.5rem/);
  });
});
