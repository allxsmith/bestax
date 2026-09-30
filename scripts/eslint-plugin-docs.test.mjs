/**
 * Hold the documentation's examples to what the plugin does, in two passes.
 *
 * The first pass is about the plugin's own claims. `eslint-plugin/README.md`
 * and the docs guide annotate their examples with `✗` and `✓`, which is a
 * claim about behaviour written in prose. Every one of them was right when
 * written and nothing re-checks them, so a rule that changes its mind leaves
 * the documentation asserting the old answer.
 *
 * Be precise about the coverage, because it is narrower than "the docs are
 * correct": this reads only lines carrying one of those two markers. Prose
 * claims are not checked, and a false one has shipped before (the README said
 * a CommonJS config could not `require()` the plugin, which it can). What this
 * does cover is every example a reader would copy.
 *
 * The fences carry no imports, so one is synthesised from the capitalised tag
 * roots on the line. That is also why each line is linted on its own: a fence
 * is a list of independent examples, not a program.
 *
 * The second pass is about everyone else's examples: every jsx and tsx
 * example under `docs/docs` and `skills` is linted with the `recommended`
 * preset, as shipped. A helper prop given a value it does not recognise
 * renders nothing and says nothing, so a wrong value in an example ships
 * green, and the fences compile nowhere that would catch it. That pass is
 * described where it starts, below.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, it } from 'node:test';
import { fenceSpans, splitLines } from './lib/api-page.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const PLUGIN = join(REPO, 'eslint-plugin');
const DOCS = [
  ['README', join(PLUGIN, 'README.md')],
  [
    'guide',
    join(REPO, 'docs', 'docs', 'guides', 'getting-started', 'eslint-plugin.md'),
  ],
];

/**
 * The real rules from the plugin's build, and the ESLint it is tested with.
 * Both passes load the built entry, as a consumer would, not the source.
 */
async function loadPlugin() {
  const dist = join(PLUGIN, 'dist', 'index.js');
  const linterPath = join(PLUGIN, 'node_modules', 'eslint', 'lib', 'api.js');
  assert.ok(
    existsSync(dist),
    'eslint-plugin/dist is absent, so the documented examples cannot be run ' +
      'against the real rules. Build first, or run `pnpm all`.'
  );
  const { Linter } = await import(pathToFileURL(linterPath).href);
  const plugin = (await import(pathToFileURL(dist).href)).default;
  return { Linter, plugin };
}

/**
 * Lines inside a jsx/tsx/js/ts fence that carry a ✗ or ✓ verdict, each tagged
 * with the rule its section is about.
 *
 * Both documents give every rule its own `###` heading, so the nearest
 * heading above an example names the rule the example is demonstrating. That
 * matters for the ✗ cases: asserting only that SOMETHING reported passes an
 * example whose intended rule has gone quiet while another one fires, which
 * is the interesting way for these to rot. A heading that is not a rule name
 * (a setup section, say) leaves `rule` null and the case falls back to
 * asserting a report at all.
 */
function annotatedExamples(markdown, ruleNames) {
  const out = [];
  // One pass over the document so headings and fences stay interleaved.
  const token = /^###\s+(.+)$|```(?:jsx|tsx|js|ts)[^\n]*\n([\s\S]*?)```/gm;
  let heading = null;
  let m;
  while ((m = token.exec(markdown))) {
    if (m[1] !== undefined) {
      const name = m[1].trim().replace(/^`|`$/g, '');
      heading = ruleNames.includes(name) ? name : null;
      continue;
    }
    for (const raw of m[2].split('\n')) {
      const marker = /\/\/\s*(✗|✓)/.exec(raw);
      if (!marker) continue;
      const code = raw.slice(0, marker.index).trim();
      // A verdict on a line that is not itself an element, such as a comment
      // introducing the next one, has nothing to lint.
      if (!code.startsWith('<')) continue;
      out.push({
        code,
        reports: marker[1] === '✗',
        rule: heading,
        line: raw.trim(),
      });
    }
  }
  return out;
}

/** `<Buttons.Button color="x" />` → the `Buttons` the fence would import. */
function tagRoots(code) {
  const roots = new Set();
  for (const m of code.matchAll(/<([A-Z][A-Za-z0-9]*)/g)) roots.add(m[1]);
  return [...roots];
}

describe('the plugin documents what it does', async () => {
  const { Linter, plugin } = await loadPlugin();
  const linter = new Linter();
  const config = [
    {
      files: ['**/*.jsx'],
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { '@allxsmith/bestax': plugin },
      // Every rule, including the opt-in one: the docs annotate its examples
      // too, and which preset a rule sits in is a separate assertion.
      rules: Object.fromEntries(
        Object.keys(plugin.rules).map(name => [
          `@allxsmith/bestax/${name}`,
          'error',
        ])
      ),
    },
  ];

  const ruleNames = Object.keys(plugin.rules);

  for (const [label, path] of DOCS) {
    const examples = annotatedExamples(readFileSync(path, 'utf8'), ruleNames);

    it(`attributes most ${label} examples to a named rule`, () => {
      // If the heading pattern stops matching, every ✗ case quietly weakens
      // to "something reported". This keeps that from happening silently.
      const attributed = examples.filter(e => e.rule !== null).length;
      assert.ok(
        attributed > examples.length / 2,
        `only ${attributed} of ${examples.length} ${label} examples sit under ` +
          'a rule heading; the heading pattern has probably stopped matching'
      );
    });

    it(`finds annotated examples in the ${label}`, () => {
      // A derived list that silently empties would pass every case below
      // having checked nothing.
      assert.ok(
        examples.length > 5,
        `only ${examples.length} annotated examples found in ${label}; the ` +
          'marker or fence pattern has probably stopped matching'
      );
    });

    for (const { code, reports, rule, line } of examples) {
      it(`${label}: ${line}`, () => {
        const roots = tagRoots(code);
        const source =
          `import { ${roots.join(', ')} } from '@allxsmith/bestax-bulma';\n` +
          `const x = ${code.replace(/;\s*$/, '')};\n`;
        const messages = linter
          .verify(source, config, 'example.jsx')
          .filter(m => m.ruleId);
        const parseError = linter
          .verify(source, config, 'example.jsx')
          .find(m => !m.ruleId);
        assert.equal(
          parseError,
          undefined,
          `the example does not parse: ${parseError?.message}`
        );
        if (reports) {
          assert.ok(
            messages.length > 0,
            'the docs mark this ✗ and no rule reports it'
          );
          if (rule !== null) {
            assert.ok(
              messages.some(m => m.ruleId === `@allxsmith/bestax/${rule}`),
              `the docs mark this ✗ under the \`${rule}\` heading, and that ` +
                `rule did not report it. What did: ${messages
                  .map(m => m.ruleId)
                  .join(', ')}`
            );
          }
        } else {
          assert.deepEqual(
            messages.map(m => `${m.ruleId}: ${m.message}`),
            [],
            'the docs mark this ✓ and a rule reports it'
          );
        }
      });
    }
  }
});

/*
 * The second pass: every example a reader or an agent copies, against the
 * `recommended` preset.
 *
 * Why the preset and not every rule: `recommended` is the set that reports
 * code which does not do what it says. The opt-in rules report working code
 * spelled a way someone might prefer not to, and the docs are full of correct
 * examples of exactly that.
 *
 * What counts as an example:
 *
 *   - a fence whose info string starts `jsx` or `tsx`, in any markdown file
 *     under `EXAMPLE_ROOTS`. Fences are found with `fenceSpans`, the same
 *     CommonMark reading the conformance checks and the API-page generator use.
 *   - a `.jsx`/`.tsx` file under those roots, such as a skill's `examples/`.
 *     Those are real modules and ship with the skills, and nothing else lints
 *     them.
 *
 * The blog is not under either root, on purpose: posts are dated snapshots
 * rather than reference (see `docs/blog/CLAUDE.md`).
 *
 * Most fences carry no import, and every rule resolves an element through its
 * import, so an unimported `<Box>` would be invisible to them. The import is
 * synthesised, but only for names the fence uses and does not bind itself:
 * a fence that declares its own `Box`, or imports `Button` from another
 * library (a migration guide's "before"), keeps its own meaning. And only for
 * names the library really exports, read from the build the plugin resolves,
 * so an app's `<App>` or a router's `<Route>` is not linted as Bulma's.
 *
 * Two readings keep that exemption from hiding the library itself. A subpath
 * of the package (`@allxsmith/bestax-bulma/elements/Box`) is read as the
 * package: the rules match the bare specifier only, so as written the name
 * would count as bound elsewhere. And a `live` fence is read the way the site
 * runs it. `docs/src/theme/CodeBlock/index.js` drops a live fence's import
 * lines and binds every tag from the library, so an import there binds nothing
 * on the page, and the gate drops those lines too.
 *
 * A fence is read the first way that parses: as a module, then as bare JSX
 * (react-live renders a fence that is one or more sibling elements), then as a
 * list of one-line elements, the shape of a rule's ✗/✓ list or a migration
 * note. In a list, a line that opens a tag without closing it
 * (`<Modal active={open} onClose={close}>`, "change the opening tag to this")
 * is closed for the check. Lines that are not elements, such as a comment or a
 * closing tag, are skipped. A fence that parses none of those ways fails,
 * because no rule can read it and a mistake in it would pass unseen.
 *
 * `nolint` in the info string (```` ```jsx nolint ````) exempts one fence, for
 * an example that is wrong on purpose, such as a rule's ✗ case. It is a
 * per-fence word rather than a path exclusion so the rest of that page is
 * still checked, and a `nolint` fence that no rule reports anything in fails
 * too, so the marker cannot outlive the mistake it was there for. The ESLint
 * guide's wrong-on-purpose fences carry it, and the first pass above still
 * holds each marked line in them to its verdict.
 */

const EXAMPLE_ROOTS = ['docs/docs', 'skills'];
const EXAMPLE_LANGS = new Set(['jsx', 'tsx']);
const OPT_OUT = 'nolint';
const LIBRARY = '@allxsmith/bestax-bulma';

/**
 * A live fence's code as the site runs it: the same lines the docs code block
 * drops are blanked, so every line keeps its number.
 */
function asRendered(lines) {
  return lines.map(line => (line.trim().startsWith('import') ? '' : line));
}

/** The jsx/tsx fences in one markdown source, with their 1-based opening line. */
function fencedExamples(src) {
  const { lines } = splitLines(src);
  const out = [];
  for (const { open, close } of fenceSpans(lines)) {
    const [lang, ...meta] = lines[open]
      .replace(/^ {0,3}(`{3,}|~{3,})/, '')
      .trim()
      .split(/\s+/);
    if (!EXAMPLE_LANGS.has(lang)) continue;
    const body = lines.slice(open + 1, close);
    out.push({
      fence: open + 1,
      lang,
      code: (meta.includes('live') ? asRendered(body) : body).join('\n'),
      optOut: meta.includes(OPT_OUT),
    });
  }
  return out;
}

/** Every example under one root, in a stable order. */
function examplesUnder(root) {
  const out = [];
  const visit = dir => {
    const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );
    for (const entry of entries) {
      const path = join(dir, entry.name);
      const file = relative(REPO, path).split(sep).join('/');
      if (entry.isDirectory()) {
        visit(path);
      } else if (/\.mdx?$/.test(entry.name)) {
        for (const ex of fencedExamples(readFileSync(path, 'utf8'))) {
          out.push({ file, ...ex });
        }
      } else if (/\.[jt]sx$/.test(entry.name)) {
        out.push({
          file,
          fence: 0,
          lang: entry.name.slice(-3),
          code: readFileSync(path, 'utf8'),
          optOut: false,
        });
      }
    }
  };
  visit(join(REPO, root));
  return out;
}

/** Everything linting an example needs, built once. */
async function loadExampleLinter() {
  const { Linter, plugin } = await loadPlugin();
  // The TypeScript parser the plugin's own tests parse TSX with, resolved the
  // way the plugin resolves it, so this adds no dependency to the root.
  const pluginRequire = createRequire(join(PLUGIN, 'package.json'));
  const tsParser = pluginRequire('@typescript-eslint/parser');
  // The same build the rules read their value tuples from.
  const libraryExports = new Set(Object.keys(pluginRequire(LIBRARY)));
  const config = [
    { files: ['**/*.tsx'], languageOptions: { parser: tsParser } },
    plugin.configs.recommended,
  ];
  const parse = source =>
    tsParser.parseForESLint(source, {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 'latest',
      sourceType: 'module',
      filePath: 'example.tsx',
      // No lib declarations, so every name the fence leaves unbound lands in
      // `through` rather than resolving to a global of the same name.
      lib: [],
    });
  return { linter: new Linter(), config, parse, libraryExports };
}

/**
 * Lint one snippet as `head` + newline + `code` + `tail`, with the library
 * import synthesised onto the first line. The code therefore always starts on
 * line 2, whatever wraps it, and a message's line maps straight back.
 *
 * Returns `{ messages }` with lines relative to `code`, or `{ parseError }`.
 */
function lintSnippet(code, head, tail, tools) {
  const body = `${head}\n${code}${tail}`;
  let scopeManager;
  try {
    ({ scopeManager } = tools.parse(body));
  } catch (err) {
    return { parseError: err };
  }
  const unbound = new Set(
    scopeManager.globalScope.through
      .map(ref => ref.identifier.name)
      .filter(name => tools.libraryExports.has(name))
  );
  const imports = unbound.size
    ? `import { ${[...unbound].join(', ')} } from '${LIBRARY}';`
    : '';
  const messages = tools.linter.verify(
    imports + body,
    tools.config,
    'example.tsx'
  );
  const fatal = messages.find(m => !m.ruleId);
  if (fatal)
    return { parseError: { message: fatal.message, lineNumber: fatal.line } };
  return {
    messages: messages.map(m => ({
      line: m.line - 1,
      ruleId: m.ruleId,
      message: m.message,
    })),
  };
}

/** A line that starts an element, and the tag it opens. */
const ELEMENT_LINE = /^\s*<([A-Za-z][\w.]*)/;

/** A quoted module specifier naming a subpath of the package. */
const LIBRARY_SUBPATH = new RegExp(`(['"])${LIBRARY}/[^'"\\n]*\\1`, 'g');

/**
 * Lint an example the first way it parses (see the header above). Returns
 * `{ messages }` with lines relative to the example, or `{ parseError }`
 * carrying the error from reading it whole, which is the one an author can act
 * on.
 */
function lintExample(source, tools) {
  const code = source.replace(LIBRARY_SUBPATH, `$1${LIBRARY}$1`);
  const whole = lintSnippet(code, '', '', tools);
  if (!whole.parseError) return whole;
  const bare = lintSnippet(code, '<>', '\n</>', tools);
  if (!bare.parseError) return bare;

  const messages = [];
  let elements = 0;
  for (const [i, text] of code.split('\n').entries()) {
    const tag = ELEMENT_LINE.exec(text);
    if (!tag) continue;
    let linted = lintSnippet(text, '', '', tools);
    if (linted.parseError)
      linted = lintSnippet(text, '', `\n</${tag[1]}>`, tools);
    if (linted.parseError) return { parseError: whole.parseError };
    elements++;
    for (const m of linted.messages) messages.push({ ...m, line: i + 1 });
  }
  return elements ? { messages } : { parseError: whole.parseError };
}

/** Every problem in a list of examples, one self-contained line each. */
function problemsIn(examples, tools) {
  const problems = [];
  for (const { file, fence, lang, code, optOut } of examples) {
    const where = fence ? ` (the ${lang} fence opened at line ${fence})` : '';
    const { messages, parseError } = lintExample(code, tools);
    if (optOut) {
      // An opt-out on a fence no rule can read is still doing its job.
      if (messages && messages.length === 0) {
        problems.push(
          `${file}:${fence}: the ${lang} fence is marked \`${OPT_OUT}\` and ` +
            'no rule reports anything in it. Remove the marker so the fence ' +
            'is checked again.'
        );
      }
      continue;
    }
    if (parseError) {
      const at = parseError.lineNumber
        ? fence + parseError.lineNumber - 1
        : fence;
      problems.push(
        `${file}:${at}${where} does not parse, so no rule can read it: ` +
          `${parseError.message.replace(/\.$/, '')}. Make it valid ${lang}, or a list of ` +
          `one-line elements; a fence that is not meant to be copied takes ` +
          `\`${OPT_OUT}\`.`
      );
      continue;
    }
    for (const m of messages) {
      problems.push(
        `${file}:${fence + m.line}${where} ${m.ruleId}: ${m.message}`
      );
    }
  }
  return problems;
}

describe('the docs and skills examples pass the recommended rules', async () => {
  const tools = await loadExampleLinter();
  const lint = code => lintExample(code, tools);
  const rules = result => result.messages?.map(m => `${m.line} ${m.ruleId}`);

  it('reads the library exports the import is synthesised from', () => {
    // An empty set would leave every unimported fence invisible to the rules,
    // and the corpus below would pass having checked almost nothing.
    assert.ok(
      tools.libraryExports.has('Box') && tools.libraryExports.has('Columns'),
      `the library exports read from ${LIBRARY} look wrong`
    );
  });

  it('reaches an element the fence never imports', () => {
    assert.deepEqual(rules(lint('<Box textAlign="center" />')), [
      '1 @allxsmith/bestax/valid-helper-value',
    ]);
  });

  it('leaves an element the fence binds itself alone', () => {
    const own = 'const Box = props => <div {...props} />;\n<Box mt="1rem" />;';
    const elsewhere = `import { Box } from 'react-bulma-components';\n<Box mt="1rem" />;`;
    assert.deepEqual(rules(lint(own)), []);
    assert.deepEqual(rules(lint(elsewhere)), []);
  });

  it('reads a subpath of the package as the package', () => {
    const subpath = `import { Box } from '${LIBRARY}/elements/Box';\n<Box mt="1rem" />;`;
    assert.deepEqual(rules(lint(subpath)), [
      '2 @allxsmith/bestax/valid-helper-value',
    ]);
  });

  it('reads a live fence without its imports, as the site runs it', () => {
    const body = [
      "import { Buttons } from './Buttons';",
      '',
      '<Buttons mt="1rem" />;',
      '```',
    ];
    const [live] = fencedExamples(['```tsx live', ...body].join('\n'));
    const [copied] = fencedExamples(['```tsx', ...body].join('\n'));
    // On the page that import binds nothing, so `Buttons` is the library's.
    assert.deepEqual(rules(lint(live.code)), [
      '3 @allxsmith/bestax/valid-helper-value',
    ]);
    // In code a reader copies, an import means what it says.
    assert.deepEqual(rules(lint(copied.code)), []);
  });

  it('reads sibling elements, and a list of one-line elements', () => {
    assert.deepEqual(rules(lint('<Box />\n<Box mt="1rem" />')), [
      '2 @allxsmith/bestax/valid-helper-value',
    ]);
    // Neither a module nor bare JSX: a comment naming a tag, and an opening
    // tag with nothing inside it.
    const list = [
      '// Before: <Button state="hover">',
      '<Button isHovered={hovered}>',
      '<Box justifyContent="center">   // the flex prop without display',
      '</Box>',
    ].join('\n');
    assert.deepEqual(rules(lint(list)), [
      '3 @allxsmith/bestax/no-inert-flex-props',
    ]);
  });

  it('fails a fence it cannot read at all', () => {
    // An element split across lines, broken, so no line of it stands alone.
    assert.ok(lint('<Box\n  mt="1rem"\n  <Box />').parseError);
    // No element to read line by line either.
    assert.ok(lint('function Example() {\n  return (\n').parseError);
  });

  it('reads the opt-out from the info string, beside other words', () => {
    const src = [
      '```tsx live nolint',
      '<Box />',
      '```',
      '```jsx title="src/App.jsx"',
      '<Box />',
      '```',
    ].join('\n');
    assert.deepEqual(
      fencedExamples(src).map(({ fence, optOut }) => [fence, optOut]),
      [
        [1, true],
        [4, false],
      ]
    );
  });

  it('fails an opt-out that no longer suppresses anything', () => {
    const example = { file: 'x.md', fence: 3, lang: 'jsx', optOut: true };
    assert.equal(
      problemsIn([{ ...example, code: '<Box mt="4" />' }], tools).length,
      1
    );
    assert.deepEqual(
      problemsIn([{ ...example, code: '<Box mt="4rem" />' }], tools),
      []
    );
  });

  const corpus = EXAMPLE_ROOTS.map(root => [root, examplesUnder(root)]);

  it('finds the standalone jsx and tsx example files', () => {
    // The walk's file branch can go dead on its own, and those files are the
    // examples nothing else lints. No root has to hold one, so this asks the
    // corpus as a whole.
    assert.ok(
      corpus.some(([, examples]) => examples.some(e => e.fence === 0)),
      'no standalone .jsx/.tsx example files found; the file pattern in the ' +
        'walk has probably stopped matching'
    );
  });

  for (const [root, examples] of corpus) {
    it(`finds jsx and tsx examples under ${root}`, () => {
      // A walk or fence pattern that silently stopped matching would pass the
      // gate below having checked nothing.
      assert.ok(
        examples.some(e => e.fence > 0),
        `no jsx/tsx fences found under ${root}`
      );
    });

    it(`every jsx and tsx example under ${root} passes`, () => {
      const problems = problemsIn(examples, tools);
      assert.equal(
        problems.length,
        0,
        `${problems.length} problem(s) in the jsx/tsx examples under ` +
          `${root}. A rule's report is a mistake a reader would copy, so fix ` +
          `the example; one that is wrong on purpose takes \`${OPT_OUT}\` in ` +
          `its fence's info string.\n` +
          problems.map(p => `  ${p}`).join('\n')
      );
    });
  }
});
