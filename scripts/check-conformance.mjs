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
 *   docs-section-order   managed API pages keep the canonical section order and
 *                        carry their generated-region markers
 *   docs-generated       generated regions match the source (`pnpm gen`)
 *   scss-conformance     SCSS partials follow the register-vars pattern
 *   story-per-component  every exported component module has a .stories.tsx
 *   compound-family      withSubComponents families ship a CompoundUsage story
 *                        and a "Compound (dot-notation) usage" docs subsection
 *   autodocs-tag         every story file opts into autodocs
 *   inline-style         no NEW inline style={{}} in stories/docs (ratcheted
 *                        against scripts/conformance-baseline.json; after
 *                        removing styles, shrink it with `--update-baseline`)
 *   skills-sync          the theming skill's references name every registered
 *                        CSS variable and every color-prop component
 *   near-miss-sync       the Toast/Dialog/LinkButton guidance says the same thing
 *                        in the generated CLAUDE.md and bestax-layout-scaffold,
 *                        pairing each component with the substitution it loses to
 *   release-docs-sync    CONTRIBUTING.md and its docs-site mirror keep the
 *                        facts a contributor acts on, and both name every
 *                        package that actually releases (#536)
 *   style-mapping-sync   the inline-style → helper-prop mapping (#350) says
 *                        the same thing in all three deliberate copies
 *                        (CLAUDE_MD template + both JSX-generating skills),
 *                        and names only props that really exist
 *   publishable-manifests  no published package ships a specifier consumers
 *                        cannot resolve (#412). Which packages publish with
 *                        `pnpm publish` is declared, not inferred (#436,
 *                        #532)
 *   bypass-expiry        every supply-chain bypass in pnpm-workspace.yaml
 *                        carries a `# bestax:review <date>` or
 *                        `# bestax:permanent` marker, and no review date has
 *                        passed (#391)
 */
import { readFile, readdir, writeFile, access } from 'node:fs/promises';
import { join, relative, dirname, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// `registerVarsKeys` lives in lib/ so the API-docs generator can share the same
// parser — it additionally exposes values and selector nesting, which the CSS
// variable tables need. Key extraction is byte-for-byte the behaviour this file
// used to implement inline (verified against all 26 partials).
import { registerVarsKeys } from './lib/scss-vars.mjs';
// The inverse of the quoting bestax-migrate/release.config.js uses to build its
// exec commands. Shared so the two halves cannot drift (#436).
import { tokenize } from './lib/shell-words.mjs';
import {
  PNPM_RESOLVES_TO_PLAIN_RANGE,
  DEP_SECTIONS,
  CONSUMER_SECTIONS,
  packTimeProtocol,
} from './lib/pack-time-protocols.mjs';
import { readRegions, sectionSpans } from './lib/api-page.mjs';
import { renderPage } from './gen-api-docs.mjs';
import {
  ORDERED_CATEGORIES,
  MANAGED_CATEGORIES,
  GENERATED_EXEMPT,
  SCSS_SOURCES,
} from './lib/api-sources.mjs';
import {
  BYPASS_BLOCKS,
  parseBypassEntries,
  findExpired,
} from './lib/bypass-annotations.mjs';

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
  'Tbody',
  'Td',
  'Tfoot',
  'Th',
  'Thead',
  'Tr', // covered by Table.stories.tsx
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
      // The CSS variable section is data-driven, never universal: Paragraph,
      // Span and the Table sub-elements have no SCSS at all, and Container has
      // SCSS but registers no CSS variables.
      //
      // It is also only required of a MANAGED page. `SCSS_SOURCES` is derived
      // for every component whether or not its page is generated yet, so
      // requiring the section outside a managed category would demand a table
      // that nothing is there to write.
      const title = frontmatterTitle(src);
      if (
        MANAGED_CATEGORIES.has(rel.split('/')[0]) &&
        SCSS_SOURCES[title]?.length &&
        !hasHeading(src, 'CSS & Sass Variables')
      ) {
        violations.push(
          `docs/docs/api/${rel} is missing its "## CSS & Sass Variables" ` +
            `section, but ${title} registers CSS variables (see SCSS_SOURCES ` +
            `in scripts/lib/api-sources.mjs). Run \`pnpm gen\`.`
        );
      }
    }
  }
  return violations;
}

// The canonical top-level section order for a managed API page. Sections not
// listed keep their place in the middle bucket, so pages with extras like
// "Keyboard Navigation" or "Form Submission" are not forced to drop them.
const SECTION_RANK = {
  Overview: 0,
  Import: 1,
  Usage: 2,
  Accessibility: 4,
  'Related Components': 5,
  'Additional Resources': 6,
  Props: 7,
  'CSS & Sass Variables': 8,
};
// Order applies to every reference page; generation only to pages that really
// are a component props table. Keeping these separate is what lets helpers/
// share the canonical section order without growing markers it cannot fill.
function orderedPage(rel) {
  return ORDERED_CATEGORIES.has(rel.split('/')[0]);
}

function managedPage(rel) {
  const cat = rel.split('/')[0];
  return (
    MANAGED_CATEGORIES.has(cat) &&
    !GENERATED_EXEMPT.has(cat) &&
    !GENERATED_EXEMPT.has(rel)
  );
}

// Section order + marker presence on generator-managed pages. Deleting a marker
// pair is the documented per-region opt-out, so it must not be silent.
async function checkDocsSectionOrder() {
  const violations = [];
  for (const file of await mdFiles(API_DIR)) {
    const rel = relative(API_DIR, file).split('\\').join('/');
    if (!orderedPage(rel)) continue;
    const src = await readFile(file, 'utf8');
    const title = frontmatterTitle(src);

    // Only the CANONICAL sections are ordered relative to each other. Sections
    // the house format does not name (`## API`, `## Supported Props`, `## Notes`)
    // keep whatever position their author chose — constraining them would flag
    // helpers pages, whose `## API` legitimately precedes `## Usage`.
    const { sections } = sectionSpans(src);
    const known = sections.filter(s => SECTION_RANK[s.heading] !== undefined);
    for (let i = 1; i < known.length; i++) {
      if (SECTION_RANK[known[i].heading] < SECTION_RANK[known[i - 1].heading]) {
        violations.push(
          `docs/docs/api/${rel} has "## ${known[i].heading}" after ` +
            `"## ${known[i - 1].heading}". API pages run Overview, Import, ` +
            `Usage, …, Accessibility, Related Components, Additional ` +
            `Resources, Props, CSS & Sass Variables.`
        );
        break;
      }
    }

    if (!managedPage(rel)) continue; // ordered but not generated
    let regions;
    try {
      regions = readRegions(src, `docs/docs/api/${rel}`);
    } catch (err) {
      violations.push(err.message);
      continue;
    }
    const expected = ['overview', 'import', 'props'];
    if (SCSS_SOURCES[title]?.length) expected.push('cssvars');
    for (const id of expected) {
      if (!regions.has(id)) {
        violations.push(
          `docs/docs/api/${rel} has no "${id}" generated region. Add the ` +
            `<!-- bestax:generated ${id} --> / <!-- /bestax:generated ${id} --> ` +
            `marker pair, or move the page out of MANAGED_CATEGORIES if it is ` +
            `a deliberate exception.`
        );
      }
    }
  }
  return violations;
}

// Staleness gate for the generated regions. Recomputes each managed page in
// memory and diffs — no writes, so it is safe inside a read-only check. This
// lives here rather than as a separate CI step because check:conformance is
// already wired into the workflow, and the ai-loop refuses PRs touching
// .github/**.
async function checkDocsGenerated() {
  const violations = [];
  for (const file of await mdFiles(API_DIR)) {
    const rel = relative(API_DIR, file).split('\\').join('/');
    if (!managedPage(rel)) continue;
    const src = await readFile(file, 'utf8');
    let out;
    try {
      ({ src: out } = await renderPage(file, src));
    } catch (err) {
      violations.push(`docs/docs/api/${rel}: ${err.message}`);
      continue;
    }
    if (out !== src) {
      violations.push(
        `docs/docs/api/${rel} has stale generated content. Run \`pnpm gen\` ` +
          `and commit the result — the Overview sentence, Import, Props table ` +
          `and CSS variables are generated from the source, not hand-edited.`
      );
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

// A component "has its own color modifier" when it interpolates a color prop
// into a modifier class itself (`is-${color}`, Avatar's `is-${resolvedColor}`,
// LinkButton's `link-button-${color}`) instead of only passing it to the
// has-text-* helper. Wrapper-level unions like `is-${messageColor}` /
// `is-${tagColor}` deliberately don't match — those files re-enter via their
// `*Base` module.
const COLOR_MODIFIER_RE =
  /\b(?:is|has-background|link-button)-\$\{(?:resolved)?[cC]olor\}/;

// The theming skill ships to users (bundled into create-bestax), so its two
// reference inventories must track the library. Name-presence only, and
// one-directional by design (#285): every registered CSS var / detected
// color-prop component must be named, but a documented entry the detector no
// longer matches (Box, Title, SubTitle) is never flagged.
async function checkSkillsSync() {
  const violations = [];
  const refsRel = 'skills/bestax-theming/references';
  const refsDir = join(REPO, 'skills', 'bestax-theming', 'references');

  // 1. Every registered component-scoped CSS variable is named (as its full
  //    `--bulma-*` form) in css-variables.md.
  const varsDoc = await readFile(join(refsDir, 'css-variables.md'), 'utf8');
  for (const dir of ['components', 'elements', 'form']) {
    const dirPath = join(REPO, 'bulma-ui', 'src', 'scss', dir);
    let files;
    try {
      files = (await readdir(dirPath)).filter(
        f => f.endsWith('.scss') && f !== '_index.scss'
      );
    } catch {
      continue;
    }
    for (const f of files) {
      const keys = registerVarsKeys(await readFile(join(dirPath, f), 'utf8'));
      // The lookahead keeps `--bulma-foo-bar` in the doc from satisfying a
      // lookup for `--bulma-foo`.
      const missing = [...keys]
        .filter(k => !new RegExp(`--bulma-${k}(?![a-z0-9-])`).test(varsDoc))
        .sort();
      if (missing.length) {
        violations.push(
          `bulma-ui/src/scss/${dir}/${f} registers ${missing.length} CSS ` +
            `variable(s) missing from ${refsRel}/css-variables.md: ` +
            `${missing.map(k => `--bulma-${k}`).join(', ')}. Name each one ` +
            `in that component's "Extras component variables" list — it is ` +
            `the shipped inventory the theming skill relies on.`
        );
      }
    }
  }

  // 2. Every public component with its own color modifier prop is named (as a
  //    backticked code span) in themeable-components.md.
  const compDoc = await readFile(
    join(refsDir, 'themeable-components.md'),
    'utf8'
  );
  const modules = parseExportedModules(await readFile(INDEX_TS, 'utf8'));
  const detected = new Map(); // public name -> source rel path
  for (const { cat, mod } of modules) {
    let src;
    try {
      src = await readFile(
        join(REPO, 'bulma-ui', 'src', cat, `${mod}.tsx`),
        'utf8'
      );
    } catch {
      continue; // .ts modules (helpers) have no component surface
    }
    if (!COLOR_MODIFIER_RE.test(src)) continue;
    const name = mod.replace(/Base$/, ''); // InputBase -> Input, etc.
    if (!detected.has(name)) {
      detected.set(name, `bulma-ui/src/${cat}/${mod}.tsx`);
    }
  }
  for (const [name, rel] of [...detected].sort(([a], [b]) =>
    a < b ? -1 : 1
  )) {
    if (!compDoc.includes(`\`${name}\``)) {
      violations.push(
        `${name} (from ${rel}) has its own \`color\` modifier prop but is ` +
          `not named in ${refsRel}/themeable-components.md. Add a ` +
          `\`${name}\` row to the "Component \`color\` / \`size\` props" ` +
          `table with the verbatim color union.`
      );
    }
  }
  return violations;
}

// The inline-style → helper-prop mapping (#350) is deliberately triplicated so
// it is in context at generation time: the scaffolded CLAUDE_MD template plus
// the two skills that generate the most JSX. Only the template copy is guarded
// by jest, so this check pins the mapping three ways:
//   1. the load-bearing facts (spacing scale, value sets, the gap rule, the
//      named-class fallback) appear verbatim in every copy;
//   2. the copies name the same set of props, so a row added to one skill
//      cannot silently go missing from the others;
//   3. every prop named is really declared in bulma-ui/src — a mapping that
//      points at a prop the library lacks makes the model emit an inert
//      attribute, which is the exact failure #350 exists to prevent.
// Matching strips backslashes first so the TS template's escaped backticks
// compare equal to the markdown copies.
const MAPPING_FILES = [
  'create-bestax/src/constants.ts',
  'skills/bestax-layout-scaffold/SKILL.md',
  'skills/bestax-custom-component/SKILL.md',
];

// Prop tokens in the "Helper props instead" column. Two unambiguous forms:
// `name="value"` (always a prop) and a bare `name` with an internal capital
// (textColor, flexDirection). Bare all-lowercase spans are values, not props
// (`bold`, `centered`, `primary`), and PascalCase spans are component names.
function mappingPropTokens(source) {
  const lines = source.replace(/\\`/g, '`').split('\n');
  const start = lines.findIndex(
    l => l.includes('|') && l.includes('Helper props instead')
  );
  if (start < 0) return null;
  const props = new Set();
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) break;
    if (/^\|[\s:|-]+\|$/.test(line)) continue; // separator row
    // Column 1 is the CSS declaration being replaced; only scan the rest.
    const helper = line.split('|').slice(2, -1).join('|');
    for (const m of helper.matchAll(/`([a-z][a-zA-Z0-9]*)="[^"]*"`/g)) {
      props.add(m[1]);
    }
    for (const m of helper.matchAll(/`([a-z][a-zA-Z0-9]*)`/g)) {
      if (/[A-Z]/.test(m[1])) props.add(m[1]);
    }
  }
  return props;
}

// The three components that lose to a core-Bulma near-miss are stated in more than one
// place because each channel reaches a different builder: the generated app CLAUDE.md is
// injected into every session of a scaffolded project, and the two skills carry it for the
// tasks they trigger on. (The MCP server is deliberately NOT in this list — it slices the
// section out of bestax-layout-scaffold at runtime, so it cannot drift by construction.)
//
// Without this check they drift, and they already had: one copy cited a 20-run eval and
// another 44 builds, and a third named LinkButton with no variant prop at all, so an agent
// reading only that one learned the component's name and not how to call it.
const NEAR_MISS_FILES = [
  'create-bestax/src/constants.ts',
  'skills/bestax-layout-scaffold/SKILL.md',
];

// Every copy must pair the component with the substitution it loses to. Naming the right
// answer alone is what the guidance did before runs-v4, and that arm was a flat null.
const NEAR_MISS_PAIRS = [
  ['`Toast`', '`Notification`'],
  ['`Dialog`', '`Modal`'],
  ['`LinkButton`', '`Button color="text"`'],
];

// The setup a builder cannot guess, and the half-adoption that looks like use.
const NEAR_MISS_FACTS = [
  'ToastContainer',
  "toast.success('Saved')",
  '<DialogContainer />',
  'dialog.confirm(',
  'variant="text"',
  'Mounting a container without ever calling',
];

async function checkNearMissSync() {
  const violations = [];
  for (const rel of NEAR_MISS_FILES) {
    const src = (await readFile(join(REPO, rel), 'utf8')).replace(/\\/g, '');
    for (const [right, wrong] of NEAR_MISS_PAIRS) {
      if (!src.includes(right) || !src.includes(wrong)) {
        violations.push(
          `${rel} must pair ${right} with the substitution it loses to (${wrong}). ` +
            `The near-miss guidance is deliberately duplicated across ` +
            `${NEAR_MISS_FILES.join(', ')} so it is in context whichever channel a ` +
            `builder has — apply the same edit to both.`
        );
      }
    }
    for (const fact of NEAR_MISS_FACTS) {
      if (!src.includes(fact)) {
        violations.push(
          `${rel} is missing "${fact}" from the near-miss guidance. Every copy has to ` +
            `carry the container-plus-imperative setup and the LinkButton variants, or a ` +
            `builder reading that copy learns the component name and not its API.`
        );
      }
    }
  }
  return violations;
}

async function checkStyleMappingSync() {
  const violations = [];
  const FILES = MAPPING_FILES;
  const FACTS = [
    '`1`=0.25rem, `2`=0.5rem, `3`=0.75rem, `4`=1rem, `5`=1.5rem, `6`=3rem',
    '`textAlign="centered"`',
    '`textColor`',
    '`bgColor`',
    '`textSize="1"`…`"7"`',
    '`textWeight`: `light`, `normal`, `medium`, `semibold`, `bold`',
    '`textTransform`: `uppercase`, `lowercase`, `capitalized`, `italic`',
    '`display="flex"`, `flexDirection`, `justifyContent`, `alignItems`, `flexWrap`',
    '`flexGrow="1"`',
    '`visibility="hidden"`',
    '`displayMobile`',
    'no `gap` helper',
    'take a `gap` prop',
    'named class',
  ];
  for (const rel of FILES) {
    const src = (await readFile(join(REPO, rel), 'utf8')).replace(/\\/g, '');
    for (const fact of FACTS) {
      if (!src.includes(fact)) {
        violations.push(
          `${rel} is missing "${fact}" from the inline-style → helper-prop ` +
            `mapping (#350). The mapping is deliberately triplicated ` +
            `(create-bestax CLAUDE_MD template + both skills) so it is ` +
            `always in context — apply the same edit to all three copies.`
        );
      }
    }
  }

  // 2. The copies must name the same props. A row added to (or dropped from)
  //    one table but not the others is drift the FACTS list cannot see,
  //    because FACTS only pins rows that exist today.
  const tables = new Map();
  for (const rel of FILES) {
    const props = mappingPropTokens(await readFile(join(REPO, rel), 'utf8'));
    if (props === null) {
      violations.push(
        `${rel} no longer contains an inline-style → helper-prop mapping ` +
          `table (no row with a "Helper props instead" header cell). The ` +
          `mapping must stay in all of ${FILES.join(', ')} — it is only ` +
          `useful when it is in context as JSX is generated (#350).`
      );
      continue;
    }
    tables.set(rel, props);
  }
  if (tables.size !== FILES.length) return violations;

  const union = new Set([...tables.values()].flatMap(s => [...s]));
  for (const [rel, props] of tables) {
    const missing = [...union].filter(p => !props.has(p)).sort();
    if (missing.length) {
      violations.push(
        `${rel}'s mapping table omits ${missing.length} prop(s) named in the ` +
          `other copies: ${missing.join(', ')}. Add the matching row(s) — the ` +
          `copies in ${FILES.join(', ')} must stay in sync.`
      );
    }
  }

  // 3. Every prop named must really exist. Helper props live in the helpers/
  //    interfaces; component-remapped ones (textColor, bgColor) are declared
  //    on the components themselves, so scan the whole source tree.
  const srcDir = join(REPO, 'bulma-ui', 'src');
  const declared = new Set();
  for (const file of [
    ...(await walk(srcDir, '.ts')),
    ...(await walk(srcDir, '.tsx')),
  ]) {
    const src = await readFile(file, 'utf8');
    for (const m of src.matchAll(/^\s+([a-zA-Z][a-zA-Z0-9]*)\?:/gm)) {
      declared.add(m[1]);
    }
  }
  for (const [rel, props] of tables) {
    const unknown = [...props].filter(p => !declared.has(p)).sort();
    if (unknown.length) {
      violations.push(
        `${rel}'s mapping table names ${unknown.length} prop(s) that are not ` +
          `declared anywhere in bulma-ui/src: ${unknown.join(', ')}. Fix the ` +
          `name or drop the row — a mapping that points at a prop the ` +
          `library does not have makes the model emit an inert attribute.`
      );
    }
  }

  return violations;
}

// The release documentation says the same things in two places: CONTRIBUTING.md
// and the docs-site page that mirrors it. That mirror is hand-maintained — no
// generator writes into docs/docs/guides — and by the time #536 was filed the
// two had drifted in eight hunks, including a coverage threshold that was
// simply wrong and a dry-run recipe naming two of the four packages that
// actually release.
//
// The full rationale for the publish flags lives in scripts/lib/pnpm-publish.mjs
// and VERSIONING.md; these two files are meant to carry only what a contributor
// acts on, plus a pointer. So this check pins the small set of facts that must
// survive in BOTH copies, and derives the package lists from the workspace
// rather than restating them — the two staleness classes #536 found were both
// "a list of packages that stopped being all of them".
//
// Deliberately NOT a byte diff. The two files legitimately differ: one uses a
// blockquote, the other a Docusaurus admonition, and the docs page links
// absolute GitHub URLs where the root file links relative paths. A diff would
// fail on all of that and teach people to ignore it.
const RELEASE_DOC_FILES = [
  'CONTRIBUTING.md',
  'docs/docs/guides/getting-started/contributing.md',
];

// What a contributor must still learn from either copy. Each is load-bearing:
// the flags because pnpm's defaults silently drop provenance and the README,
// the hook names because those are what refuse a stray publish, the
// --ignore-scripts caveat because it is the documented hole in that guard, and
// the two pointers because the mechanism was deliberately moved out of these
// files and a reader who needs it has to be told where it went.
const RELEASE_DOC_FACTS = [
  '--provenance --embed-readme --access public',
  'prepack',
  'prepublishOnly',
  '--ignore-scripts',
  'VERSIONING.md',
  'scripts/require-pnpm-publish.mjs',
];

/**
 * The "safe to run; never publishes" guidance, which is the block these facts
 * have to live in.
 *
 * Scoped rather than searched file-wide, because file-wide was vacuous:
 * CONTRIBUTING.md links VERSIONING.md twice more for unrelated reasons, so
 * deleting the pointer from this block left the check green. That is the same
 * failure publishable-manifests.test.mjs records against its own first version
 * — the prose satisfied the assertion while the thing being asserted was gone.
 *
 * Ends at the admonition close, the next heading, or a horizontal rule, which
 * covers both the blockquote form and the Docusaurus `:::tip` form.
 */
function safeToRunBlock(src) {
  const lines = src.split('\n');
  const start = lines.findIndex(l =>
    l.includes('Safe to run; never publishes')
  );
  if (start < 0) return null;
  const rest = lines.slice(start + 1);
  let end = rest.findIndex(
    l => l.trim() === ':::' || /^#{2,3}\s/.test(l) || l.trim() === '---'
  );
  if (end < 0) end = rest.length;
  return [lines[start], ...rest.slice(0, end)].join('\n');
}

/**
 * The fenced block that runs the semantic-release dry run, or null. Located by
 * content rather than by heading, so renaming the section does not silently
 * switch this check off.
 */
function dryRunRecipe(src) {
  // Walked line by line rather than matched with /```[\s\S]*?```/g, which pairs
  // backtick runs in document order: one stray ``` in prose, or a ````markdown
  // wrapper around a nested fence — both ordinary in contributor docs — shift
  // every pair after it and the real recipe stops being found. The remedy the
  // violation then offers is "drop this file from RELEASE_DOC_FILES", i.e.
  // switch the check off, which is the worst way to be wrong.
  const lines = src.split('\n');
  const blocks = [];
  let open = null;
  let current = [];
  for (const line of lines) {
    const fence = line.match(/^\s*(`{3,})/);
    if (open === null) {
      if (fence) {
        open = fence[1];
        current = [];
      }
      continue;
    }
    // Only a run at least as long as the opener closes it.
    if (fence && fence[1].length >= open.length && line.trim() === fence[1]) {
      blocks.push(current.join('\n'));
      open = null;
      continue;
    }
    current.push(line);
  }
  return blocks.find(b => b.includes('semantic-release --dry-run')) ?? null;
}

/**
 * The command lines of a shell block: everything that is not a comment.
 *
 * A package named only in a `# …` comment satisfied the recipe assertion while
 * being absent from the loop that actually runs — which is the #536 failure the
 * assertion exists to catch, reintroduced one level down.
 */
const commandLines = block =>
  block
    .split('\n')
    .map(l => l.replace(/#.*$/, ''))
    .join('\n');

/**
 * Package identifiers in `text`, as whole tokens.
 *
 * Substring matching looked fine and was not: every publishable name here
 * contains "bestax", so a package literally named `bestax` would read as
 * already present in a recipe listing only `create-bestax` and `bestax-mcp` —
 * and being present is the verdict that switches this rule off. That is the
 * same fail-open shape #436 warns about for the publisher declaration, arrived
 * at from a different direction.
 *
 * The character class keeps `@scope/name` and `kebab-case` whole, so tokens
 * compare as identifiers rather than as spans of text.
 */
const packageTokens = text => new Set(text.match(/[@\w./-]+/g) ?? []);

/**
 * Violations for the release docs. Pure, so scripts/release-docs-sync.test.mjs
 * can drive it on fixtures — the four existing sync checks have no tests, and
 * publishable-manifests is the precedent worth following instead.
 *
 * @param docs Map of repo-relative path -> file contents
 * @param packages [{ dir, name }] for every publishable workspace package
 */
export function releaseDocViolations(docs, packages) {
  const violations = [];

  // Both derived assertions are satisfied by an empty list, so an enumeration
  // that silently returned nothing would print a tick while asserting nothing.
  // checkPublishableManifests guards the same case for the same reason.
  if (!packages.length) {
    return [
      'No publishable packages were found, so the release-docs checks that ' +
        'derive their package list would pass without asserting anything. ' +
        'That usually means pnpm-workspace.yaml changed shape — ' +
        'parseWorkspacePackages reads a block list of plain entries, not a ' +
        'flow sequence or a glob (#536).',
    ];
  }

  // No backslash normalisation here, unlike near-miss-sync: that check compares
  // a markdown copy against a TS template literal, and these are two markdown
  // files. Stripping backslashes would only delete them from documented shell
  // and path content, where they are the point.
  for (const [rel, src] of docs) {
    const block = safeToRunBlock(src);
    if (block === null) {
      violations.push(
        `${rel} has no "Safe to run; never publishes" guidance. That block is ` +
          `where a contributor is told not to hand-publish and where the ` +
          `pointers to the full reasoning live — restore it, or drop ${rel} ` +
          `from RELEASE_DOC_FILES in scripts/check-conformance.mjs (#536).`
      );
    }
    for (const fact of RELEASE_DOC_FACTS) {
      if (!(block ?? '').includes(fact)) {
        if (block === null) continue; // already reported, once, above
        violations.push(
          `${rel}'s "Safe to run" guidance no longer mentions "${fact}". The ` +
            `release guidance is ` +
            `deliberately duplicated across ${RELEASE_DOC_FILES.join(' and ')} ` +
            `so a contributor meets it wherever they land — apply the same ` +
            `edit to both, and keep the full reasoning in VERSIONING.md and ` +
            `scripts/lib/pnpm-publish.mjs rather than copying it here (#536).`
        );
      }
    }

    // Derived, not restated: the recipe has to cover whatever releases today.
    const recipe = dryRunRecipe(src);
    if (recipe === null) {
      violations.push(
        `${rel} has no fenced block running \`semantic-release --dry-run\`. ` +
          `That recipe is how a contributor previews a release without ` +
          `publishing — restore it, or drop ${rel} from RELEASE_DOC_FILES in ` +
          `scripts/check-conformance.mjs if the page no longer covers releases.`
      );
    } else {
      const named = packageTokens(commandLines(recipe));
      const missing = packages.filter(p => !named.has(p.dir));
      if (missing.length) {
        violations.push(
          `${rel}'s semantic-release dry-run recipe omits ` +
            `${missing.map(p => p.dir).join(', ')}. Every publishable package ` +
            `runs semantic-release in CI, so a recipe that names only some of ` +
            `them tells a contributor a release is a no-op when it is not ` +
            `(#536).`
        );
      }
    }
  }

  // The trusted-publisher list is CONTRIBUTING-only, and getting it wrong is
  // not a documentation problem: a package with no trusted publisher fails its
  // publish AFTER the release commit and tag are pushed, and the version is
  // spent.
  // Keyed off the declared list, not a hardcoded name: with the string inline,
  // renaming the file and updating RELEASE_DOC_FILES made the
  // highest-consequence assertion in this check silently no-op.
  const [primary] = RELEASE_DOC_FILES;
  const contributing = docs.get(primary);
  {
    // The bullet plus any wrapped continuation lines. Taking only the line that
    // starts with "- Packages:" meant re-wrapping that bullet — it is far
    // longer than the file's usual width — dropped the trailing packages and
    // failed against documentation that was correct.
    const lines = (contributing ?? '').split('\n');
    const start = lines.findIndex(l => l.trimStart().startsWith('- Packages:'));
    const section =
      start < 0
        ? ''
        : [
            lines[start],
            ...lines.slice(start + 1).slice(
              0,
              Math.max(
                0,
                lines
                  .slice(start + 1)
                  .findIndex(l => !l.trim() || /^\s*[-*]\s/.test(l))
              )
            ),
          ].join('\n');
    if (!section) {
      violations.push(
        `${primary} has no "- Packages:" line in the OIDC trusted ` +
          `publishing section. It names the packages that need a trusted ` +
          `publisher configured on npmjs.com; without it nobody can tell ` +
          `which ones do.`
      );
    } else {
      const named = packageTokens(section);
      const missing = packages.filter(p => !named.has(p.name));
      if (missing.length) {
        violations.push(
          `${primary}'s trusted-publisher list omits ` +
            `${missing.map(p => p.name).join(', ')}. Every publishable ` +
            `package authenticates by OIDC, and a missing trusted publisher ` +
            `fails the publish after the release commit and tag are already ` +
            `pushed — which spends the version (#536).`
        );
      }
    }
  }

  return violations;
}

/**
 * Every publishable workspace package, as `{ dir, name }`.
 *
 * One copy, because the enumeration — parse the workspace, read each manifest,
 * keep the ones that are not private — was about to have three, each with
 * slightly different error handling. The test's copy is the one that decides
 * whether the real-repo assertion checks the same set the check does, so
 * letting them drift would make a passing test mean less than it appears to.
 */
export async function publishablePackages() {
  const packages = [];
  const yaml = await readFile(join(REPO, 'pnpm-workspace.yaml'), 'utf8');
  for (const dir of parseWorkspacePackages(yaml)) {
    let pkg;
    try {
      pkg = JSON.parse(await readFile(join(REPO, dir, 'package.json'), 'utf8'));
    } catch {
      continue; // publishable-manifests owns "this dir has no manifest"
    }
    if (!pkg.private && pkg.name) packages.push({ dir, name: pkg.name });
  }
  return packages;
}

async function checkReleaseDocsSync() {
  const docs = new Map();
  const missing = [];
  for (const rel of RELEASE_DOC_FILES) {
    try {
      docs.set(rel, await readFile(join(REPO, rel), 'utf8'));
    } catch {
      // A renamed or deleted release doc is a violation with a fix, not an
      // ENOENT out of the middle of the run. Throwing here aborts every other
      // check and hands the contributor a stack trace, which is the one thing
      // the house rule at the top of this file says not to do.
      missing.push(rel);
    }
  }
  if (missing.length) {
    return missing.map(
      rel =>
        `${rel} is listed in RELEASE_DOC_FILES but does not exist. Restore it, ` +
        `or update RELEASE_DOC_FILES in scripts/check-conformance.mjs if the ` +
        `release guidance moved (#536).`
    );
  }

  return releaseDocViolations(docs, await publishablePackages());
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

// The compound-family standard (bulma-ui/CLAUDE.md): every component that
// attaches statics via withSubComponents ships a story named exactly
// `CompoundUsage` and a `### Compound (dot-notation) usage` example as the
// LAST subsection of its API page's `## Usage` section. Detection is
// source-driven (the withSubComponents call site), so a new compound family
// is covered the moment it adopts the helper.
async function checkCompoundFamily() {
  const violations = [];
  const modules = parseExportedModules(await readFile(INDEX_TS, 'utf8'));
  const pages = new Map(); // frontmatter title -> relPath
  for (const comps of (await apiComponents()).values()) {
    for (const { title, relPath } of comps) pages.set(title, relPath);
  }
  const HEADING = '### Compound (dot-notation) usage';
  const seen = new Set();
  for (const { cat, mod } of modules) {
    const key = `${cat}/${mod}`;
    if (seen.has(key) || !/^[A-Z]/.test(mod) || mod.endsWith('Base')) continue;
    seen.add(key);
    let src;
    try {
      src = await readFile(
        join(REPO, 'bulma-ui', 'src', cat, `${mod}.tsx`),
        'utf8'
      );
    } catch {
      continue; // .ts modules (helpers) have no component surface
    }
    if (!src.includes('withSubComponents(')) continue;

    // 1. A story named exactly CompoundUsage. (A missing story file is
    //    story-per-component's finding, not repeated here.)
    const storyRel = `bulma-ui/src/${cat}/${mod}.stories.tsx`;
    let storySrc = null;
    try {
      storySrc = await readFile(join(REPO, storyRel), 'utf8');
    } catch {
      /* reported by story-per-component */
    }
    if (storySrc !== null && !/^export const CompoundUsage\b/m.test(storySrc)) {
      violations.push(
        `${storyRel} has no \`export const CompoundUsage\` story. ${mod} is ` +
          `a compound family (it calls withSubComponents), which ships a ` +
          `CompoundUsage story — rename the primary dot-notation story or ` +
          `add one (exemplar: bulma-ui/src/components/Menu.stories.tsx).`
      );
    }

    // 2. The API page's `## Usage` section ends with the compound subsection.
    const rel = pages.get(mod);
    if (!rel) {
      violations.push(
        `${mod} (bulma-ui/src/${cat}/${mod}.tsx) is a compound family but no ` +
          `API page under docs/docs/api has frontmatter \`title: ${mod}\`.`
      );
      continue;
    }
    const docSrc = await readFile(join(API_DIR, rel), 'utf8');
    const lines = docSrc.split(/\r?\n/);
    const start = lines.findIndex(l => /^## Usage[ \t]*$/.test(l));
    let end = lines.length;
    for (let i = start + 1; i < lines.length; i++) {
      if (/^## /.test(lines[i])) {
        end = i;
        break;
      }
    }
    const subs = lines
      .slice(start + 1, end)
      .filter(l => /^### /.test(l))
      .map(l => l.trim());
    if (start === -1 || subs[subs.length - 1] !== HEADING) {
      violations.push(
        `docs/docs/api/${rel} must end its "## Usage" section with a ` +
          `"${HEADING}" subsection (${mod} is a compound family). Mirror ` +
          `docs/docs/api/components/dropdown.md: one sentence naming the ` +
          `\`${mod}.*\` statics, then a \`\`\`tsx live example.`
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

// The `packages:` list out of pnpm-workspace.yaml. Reads only that block —
// other keys in the file (minimumReleaseAgeExclude, publicHoistPattern) are
// lists too, so scanning the whole file for `- item` would pick them up.
export function parseWorkspacePackages(yaml) {
  const dirs = [];
  let inBlock = false;
  for (const line of yaml.split(/\r?\n/)) {
    if (/^packages:\s*$/.test(line)) {
      inBlock = true;
      continue;
    }
    if (!inBlock) continue;
    const item = line.match(/^\s+-\s*(\S+)\s*$/);
    if (item) dirs.push(item[1].replace(/^['"]|['"]$/g, ''));
    else if (line.trim() && !line.trimStart().startsWith('#')) break;
  }
  return dirs;
}

/**
 * `npm publish` — which is what @semantic-release/npm shells out to — does NOT
 * resolve pnpm's `workspace:` protocol. A `workspace:^` left in a published
 * manifest is uninstallable by every package manager (`EUNSUPPORTEDPROTOCOL`);
 * that shipped as bestax-migrate@1.0.0 (#412), invisibly, because nothing in
 * CI installs the published artifact.
 *
 * Every package here publishes with `pnpm publish` instead — bestax-migrate
 * first (#436), the other three once one real release had proved the OIDC
 * handshake (#532) — which resolves those protocols at pack time, so each is
 * exempt from part of this rule. Which packages those are is DECLARED below,
 * not inferred from their release config.
 *
 * The npm branch below therefore has no package left to fire on today, and it
 * stays anyway: it is what holds a NEW package to the strict rule until it is
 * deliberately moved and declared. Deleting it would make "not yet declared"
 * mean "exempt", which is the failure mode the rest of this comment is about.
 *
 * That is the whole design, and it is worth saying why, because the obvious
 * alternative was tried and failed four times. Reading `release.config.js` and
 * working out how a package publishes means modelling semantic-release's config
 * format: a plugin may be a bare string, a `[name, config]` tuple, or a
 * `{ path, ...config }` object; a step may be an array or a single one of those;
 * the config may live in eight different filenames or in package.json; the
 * command may be `publishCmd` or the generic `cmd`, and may say `pnpm publish`
 * or `pnpm --filter x publish`. Every one of those was missed at some point by
 * a parser that looked obviously correct, and every miss fell through to the
 * exempt branch — the one verdict that switches the rule OFF. A parser that
 * fails open is worse than no parser.
 *
 * So the exemption is a declaration, which cannot be misparsed, and
 * scripts/publishable-manifests.test.mjs checks the declaration against what
 * the release configs actually do. Getting THAT wrong fails a test, loudly,
 * instead of silently exempting a package.
 */
const PNPM_PUBLISHED = new Set([
  'bulma-ui',
  'create-bestax',
  'bestax-migrate',
  'bestax-mcp',
]);

/**
 * The per-package rule, split out from the filesystem walk so it can be driven
 * with fixtures. Without this seam the violation branches never execute during
 * a real run — bestax-migrate is the only package carrying a pack-time
 * specifier and it is exempt for it — so inverting the rule would leave CI
 * green.
 *
 * Each offender carries the reason it survived the filter, so the message does
 * not re-derive the predicate that produced it. Two copies of one rule inside
 * one function is the drift this repo keeps paying for.
 */
export function manifestViolations(dir, pkg) {
  if (pkg?.private) return [];

  // The declaration is consulted HERE rather than by the caller, so that a test
  // driving this function also exercises the wiring. Passing the verdict in
  // meant a walk that ignored the declaration entirely still passed every test.
  const publishesWithPnpm = PNPM_PUBLISHED.has(dir);

  const violations = [];

  // The exemption assumes pnpm packs this package. In CI that is the release
  // config's job; everywhere else it is the prepublishOnly guard's, and a
  // package can otherwise gain the exemption and lose the guard in one edit.
  // Checked here, alongside the exemption it compensates for, so a test that
  // covers one covers the other.
  // Both hooks, and the command has to RUN the guard rather than mention it:
  // `echo skipping require-pnpm-publish.mjs` satisfied a substring test while
  // the exemption stayed granted. `prepack` matters as much as
  // `prepublishOnly`, because `npm pack` runs only the former and its tarball
  // can then be published directly.
  const runsGuard = hook => {
    const cmd = pkg?.scripts?.[hook];
    if (typeof cmd !== 'string') return false;
    let words;
    try {
      words = tokenize(cmd);
    } catch {
      return false;
    }
    // The guard must run before anything else can short-circuit past it, but
    // "first" is about ORDER, not about the exact spelling: `node --flag x`
    // and `pnpm node x` both execute it, and demanding a literal `node <path>`
    // reported those as missing with no satisfying form to offer.
    const i = words.findIndex(w => w.endsWith('require-pnpm-publish.mjs'));
    if (i < 1) return false;
    // Everything ahead of it must be an interpreter or a flag. A separator
    // there means something else ran, or could run instead of, the guard.
    return words
      .slice(0, i)
      .every(w => w.startsWith('-') || /^(node|pnpm|exec)$/.test(w));
  };

  const missingGuard = publishesWithPnpm
    ? ['prepack', 'prepublishOnly'].filter(h => !runsGuard(h))
    : [];

  if (missingGuard.length) {
    violations.push(
      `${dir} is declared in PNPM_PUBLISHED, but does not run ` +
        `scripts/require-pnpm-publish.mjs on ${missingGuard.join(' or ')}. ` +
        `The exemption ` +
        `then holds only for releases from CI: a hand-run \`npm publish\` in ` +
        `that directory would ship the specifier verbatim (#412). Add ` +
        `${missingGuard.map(h => `"${h}"`).join(' and ')}: "node ${relative(
          join(REPO, dir),
          join(REPO, 'scripts', 'require-pnpm-publish.mjs')
        )}".`
    );
  }

  const offenders = [];
  for (const section of DEP_SECTIONS) {
    for (const [name, spec] of Object.entries(pkg?.[section] ?? {})) {
      const protocol = packTimeProtocol(spec);
      if (!protocol) continue;

      if (!publishesWithPnpm) {
        offenders.push({ section, name, spec, protocol, why: 'npm' });
        continue;
      }
      if (!PNPM_RESOLVES_TO_PLAIN_RANGE.includes(protocol)) {
        offenders.push({ section, name, spec, protocol, why: 'unresolved' });
        continue;
      }
      // pnpm turns this into a real range, so it installs. It is still wrong in
      // a section consumers resolve: it makes everyone installing this package
      // install that one too.
      if (CONSUMER_SECTIONS.includes(section)) {
        offenders.push({ section, name, spec, protocol, why: 'consumer' });
      }
    }
  }

  violations.push(
    ...offenders.map(({ section, name, spec, protocol, why }) => {
      const head = `${dir}/package.json declares "${name}": "${spec}" in ${section}. `;
      if (why === 'npm') {
        // Both halves have to match the protocol. `file:` is not an
        // EUNSUPPORTEDPROTOCOL — npm understands it perfectly and resolves it
        // to a path that exists on this machine and no consumer's. And
        // suggesting a move to `pnpm publish` is only useful for the protocols
        // pnpm turns into a range; for the rest it sends the maintainer through
        // a publish migration that lands on the same specifier.
        const pnpmWouldFixIt = PNPM_RESOLVES_TO_PLAIN_RANGE.includes(protocol);
        return (
          head +
          `${dir} publishes with \`npm publish\`, which does not resolve ` +
          `${protocol} ` +
          (protocol === 'file:'
            ? 'into anything a consumer can use: it points at a path that ' +
              'exists here and on none of their machines'
            : 'at all, so the published package would be uninstallable ' +
              '(EUNSUPPORTEDPROTOCOL, #412)') +
          '. Give it a plain semver range' +
          (pnpmWouldFixIt
            ? `, or move ${dir} to \`pnpm publish\` and declare it in ` +
              `PNPM_PUBLISHED (#436).`
            : '. `pnpm publish` does not resolve it either.')
        );
      }
      if (why === 'unresolved') {
        if (section === 'devDependencies') {
          // No consumer resolves a dependency's devDependencies, so the
          // consumer-facing complaint does not apply and "give it a semver
          // range" is not even possible for a local path. It is still worth a
          // human decision, because it means nothing outside this workspace.
          return (
            head +
            `\`pnpm publish\` does not rewrite ${protocol}, so the published ` +
            `manifest carries a specifier that means nothing outside this ` +
            `workspace. Nothing installs it (consumers do not resolve ` +
            `devDependencies), but it should not ship: drop it, or depend on ` +
            `the package by name.`
          );
        }
        const detail =
          protocol === 'jsr:'
            ? 'rewrites it to an aliased `npm:@jsr/…` specifier, which resolves ' +
              'only for consumers who have configured the @jsr registry'
            : 'does not rewrite it at all, so no consumer can resolve it';
        return (
          head + `\`pnpm publish\` ${detail}. Give it a plain semver range.`
        );
      }
      return (
        head +
        `\`pnpm publish\` resolves ${protocol} to a real range, so it installs, ` +
        `but ${section} is resolved by consumers and this specifier only means ` +
        `something inside the workspace. ` +
        (section === 'peerDependencies'
          ? // A peer dep is SUPPOSED to reach consumers, so "move it to
            // devDependencies" would break the contract rather than fix it.
            'A peer dependency is meant to reach them, so give it an explicit ' +
            'semver range naming the versions this package actually supports.'
          : `Move it to devDependencies if only this package's own build or ` +
            `tests need it, or give it a plain semver range if consumers ` +
            `really do need it at runtime.`)
      );
    })
  );

  return violations;
}

/**
 * Lifecycle hooks that run during a pack or publish, and therefore name scripts
 * whose absence would fail a release rather than CI.
 *
 * Deliberately not every script: `"start": "node dist/index.js"` is a correct
 * entry naming a build OUTPUT, and this check runs before the build in ci.yml,
 * so demanding it exist would red the pipeline on a working config.
 *
 * `prepare` is excluded for the same reason and it is not obvious: it runs
 * after the build during a pack, so `"prepare": "node ./dist/postbuild.mjs"` is
 * a normal entry whose target legitimately does not exist when this runs.
 */
const LIFECYCLE_HOOKS = [
  'prepublishOnly',
  'prepublish',
  'prepack',
  'postpack',
  'publish',
  'postpublish',
];

/**
 * Script paths a lifecycle hook names. Path-shaped words only: a bare
 * `bundle.js` or a `--require=./polyfill.js` flag is not a script to demand
 * exists.
 *
 * Extensions rather than "anything path-shaped", because a hook may legitimately
 * name a directory or a non-file argument. `.ts` and `.sh` are included since
 * `tsx ./x.ts` and `bash ./x.sh` name a script exactly as much as `node ./x.mjs`.
 */
const SCRIPT_EXT = /\.(mjs|cjs|js|ts|mts|cts|sh)$/;

export function hookScripts(pkg) {
  const referenced = new Set();
  for (const hook of LIFECYCLE_HOOKS) {
    const cmd = pkg?.scripts?.[hook];
    if (typeof cmd !== 'string') continue;
    let words;
    try {
      words = tokenize(cmd);
    } catch {
      // An unbalanced quote is a command the shell would reject anyway.
      // Reporting a path invented from it would be a violation about a file
      // nobody named.
      continue;
    }
    for (const word of words) {
      if (word.startsWith('-')) continue;
      // A build OUTPUT is not a script to demand exists: this check runs
      // before the build in ci.yml, and `"prepack": "node ./dist/stamp.mjs"`
      // is a working config. `prepare` was excluded wholesale for this, but
      // prepack/postpack/publish run at the same moment and needed the same
      // allowance.
      if (/(^|\/)(dist|build|lib|out|es|esm|cjs)\//.test(word)) continue;
      // A path built from a shell variable cannot be resolved here, and
      // access()ing the literal text would report a working hook as broken.
      if (word.includes('$')) continue;
      if (!word.includes('/')) continue;
      if (SCRIPT_EXT.test(word)) referenced.add(word);
    }
  }
  return [...referenced];
}

async function checkPublishableManifests() {
  const violations = [];

  const packages = parseWorkspacePackages(
    await readFile(join(REPO, 'pnpm-workspace.yaml'), 'utf8')
  );
  if (!packages.length) {
    return ['pnpm-workspace.yaml has no `packages:` entries — cannot check.'];
  }

  for (const dir of packages) {
    let pkg;
    try {
      pkg = JSON.parse(await readFile(join(REPO, dir, 'package.json'), 'utf8'));
    } catch {
      violations.push(
        `pnpm-workspace.yaml lists "${dir}" but ${dir}/package.json is missing ` +
          `or unparseable.`
      );
      continue;
    }
    // The private check lives in manifestViolations, not here, so there is one
    // copy of it. hookScripts still runs for private packages: a broken pack
    // hook is worth reporting whether or not the package publishes.
    violations.push(...manifestViolations(dir, pkg));

    // Naming a script is not the same as shipping it. A hook pointing at a
    // moved path fails during the release rather than in CI, which is the one
    // moment where a failure is most expensive. npm and pnpm both run lifecycle
    // scripts from the package root, so these resolve from `dir`.
    for (const rel of hookScripts(pkg)) {
      const abs = isAbsolute(rel) ? rel : join(REPO, dir, rel);
      try {
        await access(abs);
      } catch {
        violations.push(
          `${dir}/package.json runs "${rel}" from a lifecycle hook, but ` +
            `${relative(REPO, abs)} does not exist. That would fail during ` +
            `the release rather than in CI (#436).`
        );
      }
    }
  }
  return violations;
}

/**
 * Supply-chain bypasses expire (#391). `overrides`, `minimumReleaseAgeExclude`
 * and `auditConfig.ignoreGhsas` each weaken a default we otherwise hold, and
 * every one of them is written as temporary — but nothing made that observable,
 * so entries outlived their stated reason until an unrelated PR happened to
 * audit the file.
 *
 * Two failure modes, and the second is what gives this teeth: a review date
 * that has arrived, and an entry with no annotation at all. Without the latter,
 * a new bypass just omits the marker and the check is decorative.
 *
 * Expired entries report as ONE violation per list rather than one each: a
 * quarterly batch coming due is a single chore, and this check already risks
 * failing a PR that has nothing to do with dependencies.
 */
async function checkBypassExpiry() {
  const path = join(REPO, 'pnpm-workspace.yaml');
  const { entries, problems, blocksSeen } = parseBypassEntries(
    await readFile(path, 'utf8')
  );

  // Per block, not merely in total: one block going silent while the other two
  // keep the count nonzero is the same fail-open the parser guards against.
  const missing = BYPASS_BLOCKS.filter(b => !blocksSeen.has(b.key));
  if (missing.length) {
    return missing.map(
      b =>
        `pnpm-workspace.yaml: the \`${b.label}\` block was not found, so ` +
        `nothing in it is policed. If it moved or was renamed, fix its ` +
        `pattern in scripts/lib/bypass-annotations.mjs. If you pruned its ` +
        `last entry, keep the key and write \`${b.emptyLiteral}\` rather than ` +
        `deleting it — dropping a block from BYPASS_BLOCKS unpolices that ` +
        `surface permanently, so entries would sail through unannotated if ` +
        `the list ever came back.`
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const { expired, unannotated, malformed } = findExpired(entries, today);
  const violations = [];

  for (const { line, why } of problems) {
    violations.push(`pnpm-workspace.yaml line ${line}: ${why}`);
  }

  for (const entry of malformed) {
    violations.push(
      `pnpm-workspace.yaml line ${entry.line}: ${entry.label} entry ` +
        `"${entry.name}" ${entry.error}`
    );
  }

  for (const label of new Set(expired.map(e => e.label))) {
    const due = expired.filter(e => e.label === label);
    violations.push(
      `pnpm-workspace.yaml: ${due.length} ${label} entr${
        due.length === 1 ? 'y is' : 'ies are'
      } due for review as of ${today} — ` +
        due.map(e => `${e.name} (line ${e.line}, ${e.review})`).join(', ') +
        `. For each: drop it, re-resolve, and leave it out if the resolved ` +
        `version is unchanged and \`pnpm audit --audit-level=high\` stays ` +
        `clean. Still load-bearing? Push its \`# bestax:review\` date out and ` +
        `say why in the same comment.`
    );
  }

  for (const entry of unannotated) {
    violations.push(
      `pnpm-workspace.yaml line ${entry.line}: ${entry.label} entry ` +
        `"${entry.name}" has no expiry annotation. Add ` +
        `\`# bestax:review YYYY-MM-DD — why this date\` to the comment ` +
        `directly above it, or \`# bestax:permanent — why\` if it is a ` +
        `deliberate standing policy rather than a patch waiting on the ` +
        `ecosystem. See the contract at the top of pnpm-workspace.yaml.`
    );
  }

  return violations;
}

// ---------------------------------------------------------------------------

const CHECKS = {
  'listings-sync': checkListingsSync,
  'docs-sections': checkDocsSections,
  'docs-section-order': checkDocsSectionOrder,
  'docs-generated': checkDocsGenerated,
  'scss-conformance': checkScssConformance,
  'skills-sync': checkSkillsSync,
  'style-mapping-sync': checkStyleMappingSync,
  'near-miss-sync': checkNearMissSync,
  'release-docs-sync': checkReleaseDocsSync,
  'story-per-component': checkStoryPerComponent,
  'compound-family': checkCompoundFamily,
  'autodocs-tag': checkAutodocsTag,
  'publishable-manifests': checkPublishableManifests,
  'bypass-expiry': checkBypassExpiry,
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

// Only run the suite when invoked as a command. `manifestViolations` and
// `hookScripts` above are imported by scripts/publishable-manifests.test.mjs,
// and importing a module should not run a repo-wide conformance sweep as a
// side effect.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
