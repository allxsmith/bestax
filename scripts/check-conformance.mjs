#!/usr/bin/env node
/**
 * Conformance gates for house conventions that used to live only in review
 * comments. Run via `npm run check:conformance`; CI runs it right after the
 * catalog staleness check.
 *
 * Design (mirrors gen-component-catalog.mjs): plain node, source-only, no
 * build. Every failure message names the exact file and the exact fix, because
 * the error text is what a contributor — human or AI — acts on. Checks are
 * BLOCKING; legacy debt is handled by explicit exempt sets or the committed
 * baseline (never warnings).
 *
 * Sub-checks (run one with `--only=<name>[,<name>]`):
 *   listings-sync        new components must appear on the docs listing surfaces
 *   docs-sections        API pages must have the house sections
 *   scss-conformance     SCSS partials follow the register-vars pattern
 *   story-per-component  every exported component module has a .stories.tsx
 *   autodocs-tag         every story file opts into autodocs
 *   inline-style         no NEW inline style={{}} in stories/docs (ratcheted
 *                        against scripts/conformance-baseline.json; after
 *                        removing styles, shrink it with `--update-baseline`)
 */
import { readFile, readdir, writeFile, access } from 'node:fs/promises';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const API_DIR = join(REPO, 'docs', 'docs', 'api');
const INDEX_TS = join(REPO, 'bulma-ui', 'src', 'index.ts');
const BASELINE = join(HERE, 'conformance-baseline.json');

// ---------------------------------------------------------------------------
// Exempt sets. Shrink these over time; never grow them without a review
// discussion. A NEW file/component must satisfy every check.
// ---------------------------------------------------------------------------

// Plural group containers of "Beyond Bulma" extras are not listed as homepage
// cards (owner call on #257: Avatar yes, Avatars no). The guide page still
// lists them.
const HOME_EXEMPT = new Set(['Avatars']);

// Legacy API pages missing `## Accessibility`. New pages must have it.
const ACCESSIBILITY_EXEMPT = new Set([
  'columns/column.md',
  'columns/columns.md',
  'grid/cell.md',
  'grid/grid.md',
  'helpers/classnames.md',
  'helpers/config.md',
  'helpers/theme.md',
  'helpers/usebulmaclasses.md',
]);

// Legacy API pages missing the `## Related Components` / `## Additional
// Resources` footer sections. New pages must have both (exemplar:
// docs/docs/api/components/avatar.md).
const FOOTER_EXEMPT = new Set([
  'columns/column.md',
  'columns/columns.md',
  'components/collapse.md',
  'components/loading.md',
  'components/reveal.md',
  'components/tooltip.md',
  'form/switch.md',
  'grid/cell.md',
  'grid/grid.md',
  'helpers/classnames.md',
  'helpers/config.md',
  'helpers/theme.md',
  'helpers/usebulmaclasses.md',
]);

// Legacy partials with pre-existing hardcoded color literals (grey overlays/
// shadows that won't flip in dark mode). Burn these down by moving the
// literals into registered `$… !default` variables; NEW partials must be
// clean.
const SCSS_LEGACY_COLOR_EXEMPT = new Set([
  'bulma-ui/src/scss/components/_toast.scss',
  'bulma-ui/src/scss/form/_datetimeinput.scss',
  'bulma-ui/src/scss/form/_switch.scss',
  'bulma-ui/src/scss/form/_timeinput.scss',
]);

// Exported modules that intentionally have no story file. (`*Base` escape
// hatches are excluded by rule, like in gen-component-catalog.mjs.)
const STORY_EXEMPT = new Set([
  'FormContext', // context plumbing, no visual surface
  'Tbody', 'Td', 'Tfoot', 'Th', 'Thead', 'Tr', // covered by Table.stories.tsx
]);

// ---------------------------------------------------------------------------
// Shared helpers (same parsing rules as gen-component-catalog.mjs).
// ---------------------------------------------------------------------------

async function mdFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await mdFiles(full)));
    else if (/\.mdx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

async function walk(dir, ext) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, ext)));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

function frontmatterTitle(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const t = m[1].match(/^title:[ \t]*(.+?)[ \t]*$/m);
  return t ? t[1].replace(/^['"]|['"]$/g, '') : null;
}

function parseExportedModules(src) {
  const out = [];
  for (const line of src.split(/\r?\n/)) {
    const m =
      line.match(/^export \* from '\.\/([^/]+)\/([^'/]+)'/) ||
      line.match(/^export \{[^}]+\} from '\.\/([^/]+)\/([^'/]+)'/);
    if (m) out.push({ cat: m[1], mod: m[2] });
  }
  return out;
}

// API pages by category: cat -> [{ title, relPath }]
async function apiComponents() {
  const byCat = new Map();
  for (const file of await mdFiles(API_DIR)) {
    const title = frontmatterTitle(await readFile(file, 'utf8'));
    if (!title) continue;
    const rel = relative(API_DIR, file).split('\\').join('/');
    const cat = rel.split('/')[0];
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push({ title, relPath: rel });
  }
  return byCat;
}

function hasHeading(src, text) {
  return new RegExp(`^#{2,3}[ \\t]+${text}[ \\t]*$`, 'm').test(src);
}

// ---------------------------------------------------------------------------
// Checks. Each returns an array of violation strings (already actionable).
// ---------------------------------------------------------------------------

async function checkListingsSync() {
  const violations = [];
  const byCat = await apiComponents();

  const homeFiles = [
    'docs/src/data/componentCategories.js',
    'docs/src/components/EnhancedAddons/index.js',
  ];
  let homeSrc = '';
  for (const f of homeFiles) homeSrc += await readFile(join(REPO, f), 'utf8');
  // Card names may be compound ('Tabs/Tab') — index each part.
  const homeNames = new Set(
    [...homeSrc.matchAll(/name: '([^']+)'/g)].flatMap(m => m[1].split('/'))
  );

  const guides = {
    components: 'docs/docs/guides/library/components.md',
    form: 'docs/docs/guides/library/form.md',
  };
  const guideHeads = {};
  for (const [cat, rel] of Object.entries(guides)) {
    const src = await readFile(join(REPO, rel), 'utf8');
    guideHeads[cat] = new Set(
      [...src.matchAll(/^###[ \t]+(.+?)[ \t]*$/gm)].map(m => m[1])
    );
  }

  for (const [cat, comps] of byCat) {
    for (const { title } of comps) {
      // Homepage cards: everything except form controls and helpers (neither
      // is part of the homepage-cards convention — form inputs are grouped,
      // helpers are reference pages) and HOME_EXEMPT.
      if (
        cat !== 'form' &&
        cat !== 'helpers' &&
        !HOME_EXEMPT.has(title) &&
        !homeNames.has(title)
      ) {
        violations.push(
          `${title} (${cat}) is not on any homepage surface. Add it to ` +
            `docs/src/data/componentCategories.js (stock Bulma / gap element) ` +
            `OR docs/src/components/EnhancedAddons/index.js + a matching icon ` +
            `in icons.js (a "Beyond Bulma" extra) — one surface, not both. ` +
            `Plural group containers are exempt via HOME_EXEMPT in ` +
            `scripts/check-conformance.mjs.`
        );
      }
      // Category guide page: components and form have per-component sections.
      if (guides[cat] && !guideHeads[cat].has(title)) {
        violations.push(
          `${title} has no "### ${title}" section in ${guides[cat]}. Add one ` +
            `with a one-sentence description and a \`\`\`tsx live example.`
        );
      }
    }
  }
  return violations;
}

async function checkDocsSections() {
  const violations = [];
  for (const file of await mdFiles(API_DIR)) {
    const rel = relative(API_DIR, file).split('\\').join('/');
    const src = await readFile(file, 'utf8');
    const isHelper = rel.startsWith('helpers/');
    const required = isHelper
      ? ['Overview', 'Import']
      : ['Overview', 'Import', 'Props', 'Usage'];
    for (const section of required) {
      if (!hasHeading(src, section)) {
        violations.push(
          `docs/docs/api/${rel} is missing a "## ${section}" section. Mirror ` +
            `docs/docs/api/components/avatar.md (the house exemplar).`
        );
      }
    }
    if (!isHelper) {
      if (!ACCESSIBILITY_EXEMPT.has(rel) && !hasHeading(src, 'Accessibility')) {
        violations.push(
          `docs/docs/api/${rel} is missing a "## Accessibility" section ` +
            `(roles/labels/keyboard/reduced-motion notes). Legacy pages are ` +
            `listed in ACCESSIBILITY_EXEMPT in scripts/check-conformance.mjs; ` +
            `new pages must include it.`
        );
      }
      if (
        !FOOTER_EXEMPT.has(rel) &&
        (!hasHeading(src, 'Related Components') ||
          !hasHeading(src, 'Additional Resources'))
      ) {
        violations.push(
          `docs/docs/api/${rel} is missing the "## Related Components" and/or ` +
            `"## Additional Resources" footer sections. Mirror ` +
            `docs/docs/api/components/avatar.md.`
        );
      }
    }
  }
  return violations;
}

async function checkScssConformance() {
  const violations = [];
  const scssRoot = join(REPO, 'bulma-ui', 'src', 'scss');
  // Component partials live here; scss/helpers are static utility classes and
  // scss/versions are build entrypoints (both out of scope).
  const dirs = ['components', 'elements', 'form'];
  for (const dir of dirs) {
    const dirPath = join(scssRoot, dir);
    let files;
    try {
      files = (await readdir(dirPath)).filter(
        f => f.endsWith('.scss') && f !== '_index.scss'
      );
    } catch {
      continue;
    }
    const indexSrc = await readFile(join(dirPath, '_index.scss'), 'utf8');
    for (const f of files) {
      const rel = `bulma-ui/src/scss/${dir}/${f}`;
      const src = await readFile(join(dirPath, f), 'utf8');
      const partialName = f.replace(/^_/, '').replace(/\.scss$/, '');

      // 1. Partial must be wired into the flavor builds via _index.scss —
      //    an unregistered partial silently ships nothing.
      if (!new RegExp(`@use ['"]${partialName}['"]`).test(indexSrc)) {
        violations.push(
          `${rel} is not @use'd from bulma-ui/src/scss/${dir}/_index.scss — ` +
            `it silently ships no CSS. Add \`@use '${partialName}';\` there.`
        );
      }

      const registered = new Set();
      for (const m of src.matchAll(/['"]([a-z0-9-]+)['"][ \t]*:/g)) {
        registered.add(m[1]);
      }

      const lines = src.split(/\r?\n/);
      lines.forEach((line, i) => {
        const loc = `${rel}:${i + 1}`;
        const code = line.replace(/\/\/.*$/, '');

        // 2. Top-level class selectors must carry the ConfigProvider prefix.
        //    (Nested selectors may legitimately target internal structural
        //    classes or third-party icon classes like `.fa-solid`.)
        if (/^\.(?!#\{)[a-zA-Z]/.test(code) && /[,{]\s*$/.test(code)) {
          violations.push(
            `${loc} has an unprefixed top-level class selector — the ` +
              `bestax-prefixed flavor breaks silently. Write ` +
              `\`.#{iv.$class-prefix}...\`.`
          );
        }

        // 3. No literal colors outside `$var:` default declarations. Color
        //    functions composing Bulma tokens (`hsl(cv.getVar(...))`) are the
        //    house pattern and pass; a numeric first argument (`rgba(0, 0,`)
        //    or a hex literal is a hardcoded color that breaks theming and
        //    dark mode.
        if (
          /(#[0-9a-fA-F]{3,8}\b|rgba?\(\s*[\d.]|hsla?\(\s*[\d.])/.test(code) &&
          !/^\s*\$[a-z0-9-]+\s*:/.test(code) &&
          !SCSS_LEGACY_COLOR_EXEMPT.has(rel)
        ) {
          violations.push(
            `${loc} uses a hardcoded color literal. Derive it from a Bulma ` +
              `token (cv.getVar) or move it into a \`$… !default\` variable ` +
              `registered via register-vars.`
          );
        }

        // 4. Component-namespaced vars consumed via cv.getVar must be
        //    registered (register-vars) in this partial.
        for (const m of code.matchAll(/cv\.getVar\(\s*['"]([a-z0-9-]+)['"]/g)) {
          if (m[1].startsWith(`${partialName}-`) && !registered.has(m[1])) {
            violations.push(
              `${loc} consumes cv.getVar('${m[1]}') but never registers it. ` +
                `Add it to the cv.register-vars((...)) block — every themable ` +
                `value (colors, radii, durations, offsets) must be registered.`
            );
          }
        }
      });
    }
  }
  return violations;
}

async function checkStoryPerComponent() {
  const violations = [];
  const modules = parseExportedModules(await readFile(INDEX_TS, 'utf8'));
  const seen = new Set();
  for (const { cat, mod } of modules) {
    const key = `${cat}/${mod}`;
    if (
      seen.has(key) ||
      !/^[A-Z]/.test(mod) ||
      mod.endsWith('Base') ||
      STORY_EXEMPT.has(mod)
    )
      continue;
    seen.add(key);
    const story = join(REPO, 'bulma-ui', 'src', cat, `${mod}.stories.tsx`);
    try {
      await access(story);
    } catch {
      violations.push(
        `bulma-ui/src/${cat}/${mod}.tsx has no story. Add ` +
          `bulma-ui/src/${cat}/${mod}.stories.tsx (tags: ['autodocs'], a ` +
          `description on every argType, no inline style={{}}).`
      );
    }
  }
  return violations;
}

async function checkAutodocsTag() {
  const violations = [];
  const stories = await walk(join(REPO, 'bulma-ui', 'src'), '.stories.tsx');
  for (const file of stories) {
    const src = await readFile(file, 'utf8');
    if (!/tags:\s*\[[^\]]*'autodocs'[^\]]*\]/.test(src)) {
      violations.push(
        `${relative(REPO, file)} is missing \`tags: ['autodocs']\` in its ` +
          `meta — the component gets no generated docs page in Storybook.`
      );
    }
  }
  return violations;
}

async function countInlineStyles() {
  const counts = {};
  const stories = await walk(join(REPO, 'bulma-ui', 'src'), '.stories.tsx');
  const docs = await mdFiles(join(REPO, 'docs', 'docs'));
  for (const file of [...stories, ...docs]) {
    const n = ((await readFile(file, 'utf8')).match(/style=\{\{/g) || [])
      .length;
    if (n > 0) counts[relative(REPO, file).split('\\').join('/')] = n;
  }
  return counts;
}

async function checkInlineStyle(updateBaseline) {
  const current = await countInlineStyles();
  let baseline = {};
  try {
    baseline = JSON.parse(await readFile(BASELINE, 'utf8'));
  } catch {
    /* first run: empty baseline */
  }

  if (updateBaseline) {
    // Ratchet: the baseline can only shrink. Raising it is a reviewed edit.
    const next = {};
    for (const [file, n] of Object.entries(current)) {
      next[file] = file in baseline ? Math.min(baseline[file], n) : n;
    }
    const sorted = Object.fromEntries(
      Object.entries(next).sort(([a], [b]) => (a < b ? -1 : 1))
    );
    await writeFile(BASELINE, JSON.stringify(sorted, null, 2) + '\n');
    process.stdout.write(
      `Wrote ${relative(REPO, BASELINE)} (${Object.keys(sorted).length} files)\n`
    );
    return [];
  }

  const violations = [];
  for (const [file, n] of Object.entries(current)) {
    const allowed = baseline[file] ?? 0;
    if (n > allowed) {
      violations.push(
        `${file} has ${n} inline style={{}} (baseline allows ${allowed}). ` +
          `Use Bulma helper props instead: Block/Box with display="flex", ` +
          `flexDirection, alignItems, justifyContent, and m*/p* spacing ` +
          `(there is no gap helper — space children with margins).`
      );
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------

const CHECKS = {
  'listings-sync': checkListingsSync,
  'docs-sections': checkDocsSections,
  'scss-conformance': checkScssConformance,
  'story-per-component': checkStoryPerComponent,
  'autodocs-tag': checkAutodocsTag,
  'inline-style': null, // handled below (takes the flag)
};

async function main() {
  const args = process.argv.slice(2);
  const updateBaseline = args.includes('--update-baseline');
  const only = args
    .filter(a => a.startsWith('--only='))
    .flatMap(a => a.slice(7).split(','));
  const selected = only.length ? only : Object.keys(CHECKS);

  const unknown = selected.filter(name => !(name in CHECKS));
  if (unknown.length) {
    console.error(
      `Unknown check(s): ${unknown.join(', ')}. ` +
        `Valid: ${Object.keys(CHECKS).join(', ')}`
    );
    process.exit(2);
  }

  let failed = 0;
  for (const name of selected) {
    const run =
      name === 'inline-style'
        ? () => checkInlineStyle(updateBaseline)
        : CHECKS[name];
    const violations = await run();
    if (violations.length) {
      failed += violations.length;
      console.error(`\n✗ ${name} — ${violations.length} violation(s):`);
      for (const v of violations) console.error(`  - ${v}`);
    } else {
      process.stdout.write(`✓ ${name}\n`);
    }
  }

  if (failed) {
    console.error(
      `\n${failed} conformance violation(s). Each message above names the ` +
        `file and the fix; re-run a single check with ` +
        `\`node scripts/check-conformance.mjs --only=<name>\`.`
    );
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
