/**
 * Hold the plugin's own documented examples to what the plugin does.
 *
 * `eslint-plugin/README.md` and the docs guide annotate their examples with
 * `✗` and `✓`, which is a claim about behaviour written in prose. Every one of
 * them was right when written and nothing re-checks them, so a rule that
 * changes its mind leaves the documentation asserting the old answer. The
 * plugin's own CLAUDE.md already says running the rules over the docs is worth
 * repeating whenever a rule changes; this is that, as a gate rather than as a
 * habit.
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
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, it } from 'node:test';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const PLUGIN = join(REPO, 'eslint-plugin');
const DOCS = [
  ['README', join(PLUGIN, 'README.md')],
  [
    'guide',
    join(REPO, 'docs', 'docs', 'guides', 'getting-started', 'eslint-plugin.md'),
  ],
];

/** Lines inside a jsx/tsx/js/ts fence that carry a ✗ or ✓ verdict. */
function annotatedExamples(markdown) {
  const out = [];
  const fence = /```(?:jsx|tsx|js|ts)[^\n]*\n([\s\S]*?)```/g;
  let block;
  while ((block = fence.exec(markdown))) {
    for (const raw of block[1].split('\n')) {
      const marker = /\/\/\s*(✗|✓)/.exec(raw);
      if (!marker) continue;
      const code = raw.slice(0, marker.index).trim();
      // A verdict on a line that is not itself an element, such as a comment
      // introducing the next one, has nothing to lint.
      if (!code.startsWith('<')) continue;
      out.push({ code, reports: marker[1] === '✗', line: raw.trim() });
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
  const dist = join(PLUGIN, 'dist', 'index.js');
  const linterPath = join(PLUGIN, 'node_modules', 'eslint', 'lib', 'api.js');
  assert.ok(
    existsSync(dist),
    'eslint-plugin/dist is absent, so the documented examples cannot be run ' +
      'against the real rules. Build first, or run `pnpm all`.'
  );

  const { Linter } = await import(pathToFileURL(linterPath).href);
  const plugin = (await import(pathToFileURL(dist).href)).default;
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

  for (const [label, path] of DOCS) {
    const examples = annotatedExamples(readFileSync(path, 'utf8'));

    it(`finds annotated examples in the ${label}`, () => {
      // A derived list that silently empties would pass every case below
      // having checked nothing.
      assert.ok(
        examples.length > 5,
        `only ${examples.length} annotated examples found in ${label}; the ` +
          'marker or fence pattern has probably stopped matching'
      );
    });

    for (const { code, reports, line } of examples) {
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
