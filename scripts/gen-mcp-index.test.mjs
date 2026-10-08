/**
 * Guards on the MCP index generator.
 *
 * This index is what an agent reads INSTEAD of the source, so its failure modes
 * are quiet and downstream: a leaked backtick becomes literal backticks in
 * generated JSX, a missing component becomes a component the agent reinvents by
 * hand, and non-determinism turns the CI staleness gate into noise everyone
 * learns to re-run. None of those show up in a diff review of the generator —
 * the code reads fine either way — so the assertions here are written around
 * the consequence.
 *
 * Runs the real extraction (no fixtures): the contract worth testing is the one
 * against the actual library, and the TypeScript Program it needs is built once
 * and cached.
 *
 * `.mjs` and `node --test` rather than jest: these are root-level scripts with
 * no package of their own, matching how docs/scripts is covered.
 */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  build,
  helperImport,
  orderDeclarers,
  readSkills,
  reportFailure,
} from './gen-mcp-index.mjs';
import { sectionSpans } from './lib/api-page.mjs';
import { failureText, skillRefusal, skillSlug } from './lib/skills.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

let catalog;
let components;
let missing;
let skills;
let bulmaClasses;

before(async () => {
  ({ catalog, components, missing, skills, bulmaClasses } = await build());
});

test('the catalog pins the library version it was generated from', async () => {
  const pkg = JSON.parse(
    await readFile(join(REPO, 'bulma-ui', 'package.json'), 'utf8')
  );
  assert.equal(catalog.generatedFrom.package, '@allxsmith/bestax-bulma');
  assert.equal(catalog.generatedFrom.version, pkg.version);
  assert.equal(typeof catalog.schemaVersion, 'number');
});

test('every exported component reaches the index', () => {
  // The completeness guard in main() fails the build on this; assert it here
  // too so the reason is visible without reading a process exit code.
  assert.deepEqual(missing, []);
  assert.ok(components.size >= 80, `only ${components.size} components`);
  for (const name of ['Button', 'Navbar', 'Field', 'Columns', 'Hero']) {
    assert.ok(components.has(name), `${name} missing from the index`);
  }
  assert.equal(catalog.components.length, components.size);
});

test('no markdown escaping leaks into props', () => {
  // The whole reason props-extract grew a structured mode.
  for (const [name, record] of components) {
    for (const part of record.parts) {
      for (const p of [...part.props, ...part.extraProps]) {
        assert.ok(
          !p.type.includes('`') && !p.type.includes(']('),
          `${name}.${part.path}.${p.name} type is escaped: ${p.type}`
        );
      }
      if (part.catchAll) {
        assert.ok(
          !part.catchAll.includes('`'),
          `${name} catch-all is escaped: ${part.catchAll}`
        );
      }
    }
  }
});

test('compound families keep every dot-path, including table-less subs', () => {
  const navbar = components.get('Navbar');
  const paths = navbar.parts.map(p => p.path);
  assert.ok(paths.includes('Navbar'), 'root part missing');
  assert.ok(paths.includes('Navbar.Brand'));
  // `Navbar.Divider` types its props inline rather than via a `*Props`
  // interface. It has no table, but dropping it would hide the sub-component.
  const divider = navbar.parts.find(p => p.path === 'Navbar.Divider');
  assert.ok(divider, 'Navbar.Divider missing');
  assert.deepEqual(divider.props, []);
  assert.ok(divider.summary.length > 0, 'sub-components keep their summary');

  // A sub re-exported standalone names its own export, so the server can point
  // at that component instead of restating 25 rows.
  const thead = components
    .get('Table')
    .parts.find(p => p.path === 'Table.Thead');
  assert.equal(thead.component, 'Thead');
});

test('helper pages ship as prose, not as an empty props table', () => {
  // Four of the six helpers/ pages use `## API` with a signature block and have
  // no props interface at all — an empty table would read as "no props".
  const hook = components.get('useBulmaClasses');
  assert.equal(hook.kind, 'helper');
  assert.deepEqual(hook.parts, []);
  assert.ok(hook.doc.length > 1000, 'helper doc body is missing');
  assert.ok(!hook.doc.startsWith('---'), 'frontmatter must be stripped');
});

test('every import the index shows is an import statement', () => {
  // The constants page used to ship `import { Valid value constants } from …`,
  // built from its title (#935).
  const statement =
    /^import \{\s*([\s\S]+?)\s*\} from '@allxsmith\/bestax-bulma';$/;
  for (const [name, record] of components) {
    const m = record.import.match(statement);
    assert.ok(m, `${name} imports with ${JSON.stringify(record.import)}`);
    for (const binding of m[1]
      .split(',')
      .map(b => b.trim())
      .filter(Boolean)) {
      assert.match(binding, /^[A-Za-z_$][\w$]*$/, `${name}: ${binding}`);
    }
  }
  assert.match(
    components.get('Valid value constants').import,
    /\bvalidColors\b/
  );
});

test("a prose page's import comes from its Import section", () => {
  const importOf = (name, body) => {
    const { lines, sections } = sectionSpans(
      `---\ntitle: X\n---\n\n## Import\n\n${body}\n`
    );
    const section = sections.find(s => s.heading === 'Import');
    return helperImport(name, lines, section, 'helpers/x.md');
  };
  assert.equal(
    importOf(
      'Some constants',
      "```tsx\nimport { a, b } from '@allxsmith/bestax-bulma';\n```"
    ),
    "import { a, b } from '@allxsmith/bestax-bulma';"
  );
  // A block importing from somewhere else is not the library's import.
  assert.equal(
    importOf('useThing', "```ts\nimport { x } from 'elsewhere';\n```"),
    "import { useThing } from '@allxsmith/bestax-bulma';"
  );
  assert.throws(
    () => importOf('Some constants', 'No code here.'),
    /helpers\/x\.md: "Some constants" is not an identifier/
  );
  assert.equal(
    helperImport('useThing', [], undefined, 'helpers/x.md'),
    "import { useThing } from '@allxsmith/bestax-bulma';"
  );
});

test('usage examples are harvested with their headings', () => {
  const button = components.get('Button');
  assert.ok(button.examples.length > 10, 'Button examples missing');
  for (const ex of button.examples) {
    assert.ok(ex.title, 'example has no heading');
    assert.ok(ex.code.trim(), 'example has no code');
    assert.ok(!ex.code.includes('```'), 'fence markers leaked into the code');
  }
  const total = [...components.values()].reduce(
    (n, c) => n + c.examples.length,
    0
  );
  assert.ok(total > 500, `only ${total} examples across the library`);
});

test('CSS variables are indexed back to their component', () => {
  const button = components.get('Button');
  assert.ok(button.cssVars.length > 0);
  const row = button.cssVars.find(v => v.css === '--bulma-button-h');
  assert.ok(row, '--bulma-button-h missing');
  assert.deepEqual(catalog.cssVarIndex['--bulma-button-h'], ['Button']);
  for (const v of button.cssVars) {
    assert.match(v.css, /^--/);
    assert.ok(['root', 'compound', 'element', 'global'].includes(v.scope));
  }
});

test('every CSS variable lists every declarer, the one it is named after first (#964)', () => {
  // The index kept one name per variable, whichever declarer the generator read
  // last, so DateInput's calendar variables were "declared by DateTimeInput".
  const declarers = new Map();
  for (const [name, record] of components) {
    for (const v of record.cssVars) {
      if (!declarers.has(v.css)) declarers.set(v.css, new Set());
      declarers.get(v.css).add(name);
    }
  }
  const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const OWNERLESS = ['--bulma-picker-popover-'];
  // How much of the variable a component's name accounts for: its lower-cased
  // name, with or without hyphens between words, followed by `-` or the end.
  const namedLength = (css, name) => {
    const rest = css.replace(/^--bulma-/, '');
    const keys = [
      name.toLowerCase(),
      name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
    ].filter(k => rest === k || rest.startsWith(`${k}-`));
    return Math.max(0, ...keys.map(k => k.length));
  };

  assert.deepEqual(
    Object.keys(catalog.cssVarIndex).sort(byCode),
    [...declarers.keys()].sort(byCode),
    'the index covers exactly the variables the components declare'
  );
  let shared = 0;
  for (const [css, listed] of Object.entries(catalog.cssVarIndex)) {
    assert.ok(Array.isArray(listed), `${css} is not a list`);
    assert.deepEqual(
      [...listed].sort(byCode),
      [...declarers.get(css)].sort(byCode),
      `${css} lists ${listed}`
    );
    if (listed.length > 1) shared++;
    const best = Math.max(...listed.map(n => namedLength(css, n)));
    const [first, ...others] = listed;
    // A variable several components declare is named after one of them, except
    // the popover the pickers share. Without this an owner the rule failed to
    // find would fall to code-point order, #964's own failure, and pass. A new
    // exception is one to add here on purpose.
    if (listed.length > 1 && !OWNERLESS.some(p => css.startsWith(p))) {
      assert.ok(best > 0, `${css} has no owner among ${listed}`);
    }
    if (best > 0) {
      assert.equal(namedLength(css, first), best, `${css} lists ${listed}`);
    }
    // Code-point order after the owner, or throughout when there is none.
    const tail = best > 0 ? others : listed;
    assert.deepEqual([...tail].sort(byCode), tail, `${css} lists ${listed}`);
  }
  assert.ok(shared > 0, 'no variable is declared by more than one component');

  // The cases the rule exists for: a variable several components declare goes
  // first to the one it is named after. Who else declares it moves as
  // components are added (DateRangeInput reads the calendar's), so only the
  // owner is pinned here; the loop above holds the rest of each list.
  for (const [css, owner] of [
    ['--bulma-dateinput-cell-color', 'DateInput'],
    ['--bulma-timeinput-separator-color', 'TimeInput'],
    ['--bulma-subtitle-color', 'SubTitle'],
    ['--bulma-title-color', 'Title'],
    ['--bulma-input-border-color', 'Input'],
    // Decided by the hyphenated form of the name, `icon-text`, over `icon`.
    ['--bulma-icon-text-spacing', 'IconText'],
  ]) {
    const listed = catalog.cssVarIndex[css];
    assert.equal(listed?.[0], owner, `${css} lists ${listed}`);
    assert.ok(listed.length > 1, `${css} has no other declarer to rank`);
  }
  assert.ok(
    catalog.cssVarIndex['--bulma-dateinput-cell-color'].includes(
      'DateTimeInput'
    ),
    'the declarer #964 named stays listed'
  );
});

test('a variable goes to the declarer whose name accounts for most of it', () => {
  assert.deepEqual(
    orderDeclarers('--bulma-icon-text-spacing', ['Icon', 'IconText']),
    ['IconText', 'Icon']
  );
  assert.deepEqual(
    orderDeclarers('--bulma-icon-dimensions', ['IconText', 'Icon']),
    ['Icon', 'IconText']
  );
  // Named after none of them: code-point order, and each name once.
  assert.deepEqual(
    orderDeclarers('--bulma-picker-popover-shadow', [
      'TimeInput',
      'DateInput',
      'DateTimeInput',
      'TimeInput',
    ]),
    ['DateInput', 'DateTimeInput', 'TimeInput']
  );
  // A name the variable merely starts with, mid-word, is not its name.
  assert.deepEqual(
    orderDeclarers('--bulma-dateinputs-x', ['TimeInput', 'DateInput']),
    ['DateInput', 'TimeInput']
  );
  assert.deepEqual(orderDeclarers('--bulma-box', ['Card', 'Box']), [
    'Box',
    'Card',
  ]);
});

test('related components resolve to real component names', () => {
  // Resolved through the target page's frontmatter, not the link text, so a
  // pluralised or lower-cased link still yields something the server can look up.
  const button = components.get('Button');
  assert.ok(button.related.includes('Buttons'));
  for (const [name, record] of components) {
    for (const rel of record.related) {
      assert.ok(
        components.has(rel),
        `${name} links to "${rel}", which is not in the index`
      );
    }
  }
});

/**
 * Every id the built Storybook answers to, derived the way its indexer derives
 * them: Storybook's own CSF parser, from bulma-ui's `storybook`, run over the
 * files bulma-ui's `.storybook/main.ts` globs. Borrowing the parser rather than
 * re-implementing its id rules is the point, since a hand-written link that
 * squashed `MutuallyExclusive` to `mutuallyexclusive` is the bug this guards,
 * and resolving it from bulma-ui adds no dependency to the root.
 *
 * Besides each story, a component id on its own (`form-dateinput`) is a link
 * Storybook resolves to that component's first entry, and a component tagged
 * `autodocs` also answers to `<component>--docs`.
 */
async function storybookIds() {
  const { readdir } = await import('node:fs/promises');
  const { createRequire } = await import('node:module');
  const { pathToFileURL } = await import('node:url');
  const ui = join(REPO, 'bulma-ui');
  const uiRequire = createRequire(join(ui, 'package.json'));
  const { loadCsf } = await import(
    pathToFileURL(uiRequire.resolve('storybook/internal/csf-tools')).href
  );
  const { sanitize } = await import(
    pathToFileURL(uiRequire.resolve('storybook/internal/csf')).href
  );
  const ids = new Set();
  const entries = await readdir(join(ui, 'src'), {
    recursive: true,
    withFileTypes: true,
  });
  for (const entry of entries) {
    if (!entry.isFile() || !/\.stories\.[cm]?[jt]sx?$/.test(entry.name)) {
      continue;
    }
    const file = join(entry.parentPath, entry.name);
    const csf = loadCsf(await readFile(file, 'utf8'), {
      fileName: file,
      makeTitle: title => {
        // Storybook would auto-title it from the path, which this does not model.
        assert.ok(title, `${file} has no title`);
        return title;
      },
    }).parse();
    const component = sanitize(csf.meta.title);
    ids.add(component);
    if (csf.meta.tags?.includes('autodocs')) ids.add(`${component}--docs`);
    for (const story of csf.stories) ids.add(story.id);
  }
  return ids;
}

/** The Storybook links in `text` whose id Storybook does not build. */
function brokenStorybookLinks(text, ids) {
  const urls = [
    ...text.matchAll(/https:\/\/bestax\.io\/storybook\/\?path=[^\s)"\\]+/g),
  ].map(m => m[0]);
  return {
    count: urls.length,
    broken: urls.filter(url => {
      const id = url.match(/[?&]path=\/(?:story|docs)\/([^&#]+)/)?.[1];
      return !id || !ids.has(id);
    }),
  };
}

test('every Storybook link in the index and the docs opens a story that exists', async () => {
  // The links are hand-written on the API pages, and three of them opened
  // "Couldn't find story" (#936). Every link anywhere in a record counts, the
  // helper pages' prose included, and so does every link on a docs page: the
  // index copies only the one under Additional Resources, and bestax.io
  // publishes the rest, such as the See Also links on the Columns and Grid
  // pages.
  const { readdir } = await import('node:fs/promises');
  const ids = await storybookIds();
  assert.ok(ids.has('elements-button--default'), 'story ids were not derived');
  const broken = [];

  let inIndex = 0;
  for (const [name, record] of components) {
    const found = brokenStorybookLinks(JSON.stringify(record), ids);
    inIndex += found.count;
    broken.push(...found.broken.map(url => `index ${name}: ${url}`));
  }
  // An extraction that broke would empty the field on every record at once, and
  // the few links in helper-page prose would still pass a smaller floor.
  const linked = [...components.values()].filter(r => r.storybook).length;
  assert.ok(
    linked > components.size / 2,
    `only ${linked} of ${components.size} records have a Storybook link`
  );

  const docs = join(REPO, 'docs', 'docs');
  let onPages = 0;
  for (const entry of await readdir(docs, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
    const file = join(entry.parentPath, entry.name);
    const found = brokenStorybookLinks(await readFile(file, 'utf8'), ids);
    onPages += found.count;
    const page = file.slice(REPO.length + 1);
    broken.push(...found.broken.map(url => `${page}: ${url}`));
  }
  assert.ok(onPages >= inIndex, 'the docs pages were not read');

  assert.deepEqual(broken, []);
});

test('the skills roster is read from the directory, not a hardcoded list', () => {
  assert.ok(skills.skills.length >= 7, 'skills missing');
  const names = skills.skills.map(s => s.name);
  assert.ok(names.includes('bestax-theming'));
  assert.deepEqual([...names].sort(), names, 'skills are not sorted');
  for (const s of skills.skills) {
    assert.ok(
      s.description.length > 40,
      `${s.name} has no trigger description`
    );
    // Keyed off the directory, with the shared slug rule.
    assert.equal(s.name, s.dir);
    assert.equal(s.promptName, skillSlug(s.name));
    assert.ok(Array.isArray(s.references));
  }
  const theming = skills.skills.find(s => s.name === 'bestax-theming');
  assert.ok(theming.references.some(r => r.id === 'css-variables'));
});

test('references nested one level per subject still reach the index', () => {
  // A skill that serves more than one subject groups its references into
  // subdirectories. A flat readdir dropped every one of those silently — the
  // file stopped being served while the staleness gate stayed green, because
  // the output it compared was consistently wrong. Keyed by path so two
  // subjects can each have a `component-map`.
  const migrate = skills.skills.find(s => s.name === 'bestax-migrate');
  assert.ok(migrate, 'bestax-migrate skill missing');
  for (const id of [
    'rbx-component-map',
    'rbx-prop-map',
    'rbx-unmappables',
    'react-bulma-components-component-map',
    'react-bulma-components-prop-map',
    'react-bulma-components-unmappables',
    'bloomer-component-map',
    'bloomer-prop-map',
    'bloomer-unmappables',
    'bulma-classes-component-map',
    'bulma-classes-prop-map',
    'bulma-classes-unmappables',
  ]) {
    const ref = migrate.references.find(r => r.id === id);
    assert.ok(ref, `${id} is not indexed`);
    assert.match(ref.file, /^references\/[^/]+\/[^/]+\.md$/);
    assert.ok(ref.bytes > 0, `${id} indexed as empty`);
  }
  // `id` is the lookup key behind bestax://skills/{name}/references/{ref},
  // so a slash in it would not resolve.
  for (const s of skills.skills) {
    for (const r of [...s.references, ...s.examples]) {
      assert.ok(!r.id.includes('/'), `${s.name}/${r.id} has a slash in its id`);
    }
  }
});

test('the skills manifest lists exactly what the sync scripts ship', async t => {
  // The sync scripts refuse untracked files and leave `.DS_Store` out of the
  // copy. The index used to list every regular file on disk, so a local run
  // could commit a manifest naming a file the server never ships.
  const { mkdtempSync, mkdirSync, rmSync, writeFileSync } =
    await import('node:fs');
  const { execFileSync } = await import('node:child_process');
  const { tmpdir } = await import('node:os');

  const root = mkdtempSync(join(tmpdir(), 'bestax-mcp-skills-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const skillsDir = join(root, 'skills');
  const skill = join(skillsDir, 'bestax-form');
  mkdirSync(join(skill, 'references', 'sub'), { recursive: true });
  writeFileSync(
    join(skill, 'SKILL.md'),
    '---\nname: bestax-form\ndescription: Build forms.\n---\n'
  );
  writeFileSync(join(skill, 'references', 'api.md'), '# api\n');
  writeFileSync(join(skill, 'references', 'sub', 'map.md'), '# map\n');
  writeFileSync(join(skill, 'references', '.DS_Store'), 'finder');
  writeFileSync(join(skill, 'references', 'sub', '.DS_Store'), 'finder');
  writeFileSync(join(root, '.gitignore'), '*.log\n');

  // No repository yet, like an exported tarball: the disk minus .DS_Store.
  const listed = async () =>
    (await readSkills(skillsDir))[0].references.map(r => r.file);
  const shipped = ['references/api.md', 'references/sub/map.md'];
  assert.deepEqual(await listed(), shipped);

  const git = (...args) =>
    execFileSync('git', ['-C', root, ...args], { stdio: 'ignore' });
  git('init', '-q');
  git('add', 'skills', '.gitignore');
  assert.deepEqual(await listed(), shipped, '.DS_Store stays exempt');

  writeFileSync(join(skill, 'references', 'scratch.md'), 'draft\n');
  await assert.rejects(
    readSkills(skillsDir),
    /refusing to index untracked file\(s\) under skills\/: bestax-form\/references\/scratch\.md/
  );
  rmSync(join(skill, 'references', 'scratch.md'));

  // Gitignored is still unvetted: the sync scripts would refuse it too.
  writeFileSync(join(skill, 'references', 'debug.log'), 'noise\n');
  await assert.rejects(readSkills(skillsDir), /debug\.log/);
});

test('the index refuses a symbolic link wherever the sync scripts do', async t => {
  // The sync scripts refuse a link anywhere in a skill. The index used to
  // walk only references/ and examples/, so it listed a linked skill
  // directory, or a skill whose SKILL.md was a link, that no build can copy.
  const {
    mkdtempSync,
    mkdirSync,
    renameSync,
    rmSync,
    symlinkSync,
    unlinkSync,
    writeFileSync,
  } = await import('node:fs');
  const { tmpdir } = await import('node:os');

  const root = mkdtempSync(join(tmpdir(), 'bestax-mcp-links-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const skillsDir = join(root, 'skills');
  const skill = join(skillsDir, 'bestax-form');
  mkdirSync(join(skill, 'references'), { recursive: true });
  writeFileSync(
    join(skill, 'SKILL.md'),
    '---\nname: bestax-form\ndescription: Build forms.\n---\n'
  );
  writeFileSync(join(skill, 'references', 'api.md'), '# api\n');
  const [form] = await readSkills(skillsDir);
  assert.deepEqual(form.references, [
    { id: 'api', file: 'references/api.md', bytes: 6 },
  ]);
  assert.deepEqual(form.examples, []);

  const outside = join(root, 'outside');
  mkdirSync(outside);
  writeFileSync(
    join(outside, 'SKILL.md'),
    '---\nname: bestax-linked\ndescription: Linked.\n---\n'
  );
  symlinkSync(outside, join(skillsDir, 'bestax-linked'));
  const linked = await readSkills(skillsDir).then(
    () => assert.fail('a linked skill directory was indexed'),
    err => err
  );
  assert.match(
    linked.message,
    /skills\/bestax-linked is a symbolic link\. Commit the real directory\.$/
  );
  assert.equal(failureText(linked), linked.message);
  unlinkSync(join(skillsDir, 'bestax-linked'));

  renameSync(join(skill, 'SKILL.md'), join(root, 'SKILL.md'));
  symlinkSync(join(root, 'SKILL.md'), join(skill, 'SKILL.md'));
  await assert.rejects(
    readSkills(skillsDir),
    /bestax-form\/SKILL\.md is a symbolic link\. Commit the real file or directory\./
  );
});

test('the command line prints a refusal as its message, anything else as its stack', () => {
  const report = err => {
    const out = [];
    reportFailure(err, {
      error: text => out.push(text),
      exit: code => out.push(code),
    });
    return out;
  };
  const refusal = skillRefusal('refusing to index untracked file(s)');
  assert.deepEqual(report(refusal), [refusal.message, 1]);
  const crash = new TypeError('boom');
  assert.deepEqual(report(crash), [crash.stack, 1]);
  assert.match(crash.stack, /^TypeError: boom\n\s+at /);
});

test('every skill reference id is unique within its skill', () => {
  for (const s of skills.skills) {
    const ids = [...s.references, ...s.examples].map(r => r.id);
    assert.equal(new Set(ids).size, ids.length, `${s.name} has duplicate ids`);
  }
});

test('output is deterministic and code-point sorted', () => {
  const names = catalog.components.map(c => c.name);
  assert.deepEqual(
    [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    names
  );
  const cssKeys = Object.keys(catalog.cssVarIndex);
  assert.deepEqual(
    [...cssKeys].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    cssKeys
  );
  for (const cat of catalog.categories) {
    assert.deepEqual(
      [...cat.components].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
      cat.components,
      `${cat.id} members are not sorted`
    );
  }
});

test("the bulma-classes table is bestax-migrate's own, whole", () => {
  const { roots, helpers, passthrough, precedence, wrappers } = bulmaClasses;
  assert.equal(roots.button.target, 'Button');
  assert.deepEqual(roots.button.modifiers['is-primary'].writes, [
    { prop: 'color', value: 'primary' },
  ]);
  // A family the codemod leaves as markup still says why, for the lookup.
  assert.equal(roots.dropdown.status, 'todo');
  assert.match(roots.dropdown.why, /Dropdown/);
  // And the parts that take no helpers say so.
  assert.equal(roots['navbar-dropdown'].noHelpers, true);
  assert.equal(roots.button.noHelpers, false);
  // And the ones that leave some helpers out say which, and why.
  assert.match(roots.columns.helpersLeftOut.gap, /gutter/);
  assert.deepEqual(roots.button.helpersLeftOut, {});
  // And a part that renders its class only at the top level says so.
  assert.equal(roots['menu-list'].topLevelOnly, true);
  assert.equal(roots.menu.topLevelOnly, false);
  // And a list whose items convert by where they sit says what they become.
  assert.equal(roots['menu-list'].items.target, 'Menu.Item');
  assert.equal(roots['menu-list'].items.after.target, 'Menu.List');
  assert.equal(roots.menu.items, null);
  // And a component that converts only beside one of its parts says which.
  assert.ok(roots.card.wrapsChildren.unless.includes('Card.Content'));
  assert.equal(roots.button.wrapsChildren, null);
  assert.deepEqual(helpers['mt-4'], {
    group: 'spacing',
    write: { prop: 'mt', value: '4' },
  });
  assert.equal(wrappers.p, 'Paragraph');
  assert.ok(precedence.includes('columns'));
  // The RegExps travel as sources, and each must come back as one.
  for (const group of passthrough) {
    assert.doesNotThrow(() => new RegExp(group.match), group.why);
  }
});
