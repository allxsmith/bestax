/**
 * Hold `no-bulma-component-class`'s "converts" message to the codemod (#1164).
 *
 * The rule tells a plain element styled with a class bestax-migrate's table
 * converts that `bestax-migrate bulma-classes` converts elements like it
 * where the markup allows. That holds only while the codemod, wherever it
 * leaves such an element as markup, says why in a TODO. A
 * `<div className="panel-block">` it once left with none was linted with a
 * message saying the codemod converts it.
 *
 * So this runs the codemod's build over one element for each converting
 * class in the rule's table, on every tag the codemod's table renders or
 * reaches through `as`, lints what it wrote with the rule's build, and fails
 * on an element the rule still says converts that the codemod left with no
 * TODO, and on output that doesn't parse, which the rule can't read. One
 * element a run keeps each report with its element. Elements are
 * read alone, so a part left as markup because of what is around it is out
 * of reach here; the kitchen sinks hold those to their TODOs.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, it } from 'vitest';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const PLUGIN = join(REPO, 'eslint-plugin');
const MIGRATE = join(REPO, 'bestax-migrate', 'dist');
const RULE = 'bestax/no-bulma-component-class';

/** HTML's void elements, which take no children. */
const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

const importFrom = file => import(pathToFileURL(file).href);

/** The two builds, as their consumers load them, and ESLint with the parser. */
async function load() {
  for (const [dist, name] of [
    [join(PLUGIN, 'dist', 'index.js'), 'eslint-plugin'],
    [join(MIGRATE, 'runner.js'), 'bestax-migrate'],
  ]) {
    assert.ok(
      existsSync(dist),
      `${name}/dist is absent, so the codemod's output cannot be linted. Build first, or run \`pnpm all\`.`
    );
  }
  const { Linter } = await importFrom(
    join(PLUGIN, 'node_modules', 'eslint', 'lib', 'api.js')
  );
  const plugin = (await importFrom(join(PLUGIN, 'dist', 'index.js'))).default;
  const { BULMA_COMPONENT_CLASSES } = await importFrom(
    join(PLUGIN, 'dist', 'generated', 'metadata.js')
  );
  const { runTransform } = await importFrom(join(MIGRATE, 'runner.js'));
  const bulmaClasses = join(MIGRATE, 'sources', 'bulma-classes');
  const transform = (await importFrom(join(bulmaClasses, 'transform.js')))
    .default;
  const { ROOTS } = await importFrom(join(bulmaClasses, 'class-map.js'));
  // Resolved the way the plugin resolves it, so the root adds no dependency.
  const parser = createRequire(join(PLUGIN, 'package.json'))(
    '@typescript-eslint/parser'
  );
  return {
    linter: new Linter(),
    config: [
      {
        files: ['**/*.tsx'],
        languageOptions: { parser },
        plugins: { bestax: plugin },
        rules: { [RULE]: 'error' },
      },
    ],
    classes: BULMA_COMPONENT_CLASSES,
    roots: ROOTS,
    runTransform,
    transform,
  };
}

/** Every tag an entry of the codemod's table renders or reaches with `as`. */
function tagsOf(roots) {
  const tags = new Set();
  for (const entry of Object.values(roots)) {
    if (entry.tag) tags.add(entry.tag);
    if (Array.isArray(entry.as)) for (const tag of entry.as) tags.add(tag);
  }
  return [...tags].sort();
}

describe("the codemod's output, linted", () => {
  it('leaves a TODO on every element the rule says the codemod converts', async () => {
    const tools = await load();
    const silent = [];
    const unparsed = [];
    let flagged = 0;
    let converted = 0;
    for (const [cls, { converts }] of tools.classes) {
      if (!converts) continue;
      for (const tag of tagsOf(tools.roots)) {
        const element = VOID.has(tag)
          ? `<${tag} className="${cls}" />`
          : `<${tag} className="${cls}">x</${tag}>`;
        const source = `export const A = () => ${element};\n`;
        const todos = [];
        const { output } = tools.runTransform(
          tools.transform,
          'a.tsx',
          source,
          { add: todo => todos.push(todo) }
        );
        const messages = tools.linter.verify(
          output ?? source,
          tools.config,
          'a.tsx'
        );
        // Output that doesn't parse reports nothing the rule says, which
        // would read as converted.
        const fatal = messages.find(message => message.fatal);
        if (fatal) {
          unparsed.push(`<${tag} className="${cls}">: ${fatal.message}`);
          continue;
        }
        const reports = messages.filter(
          message => message.ruleId === RULE && message.messageId === 'converts'
        );
        if (reports.length === 0) {
          converted++;
          continue;
        }
        flagged++;
        if (todos.length === 0) silent.push(`<${tag} className="${cls}">`);
      }
    }
    // Neither half is empty, so the rule and the codemod both ran.
    assert.ok(converted > 0, 'no element converted');
    assert.ok(flagged > 0, 'the rule reported no element the codemod left');
    assert.deepEqual(unparsed, []);
    assert.deepEqual(silent, []);
  });
});
