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
 *   skills-roster        every skill directory under skills/ is named in each
 *                        hand-maintained roster (README, docs, the scaffolded
 *                        CLAUDE.md), and no roster names one that is gone
 *                        (#540). Distinct from skills-sync above.
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
 *   telemetry-core       create-bestax and bestax-migrate telemetry-core.ts
 *                        copies are byte-identical
 *   telemetry-allowlists worker schema enums are a superset of the CLI values
 *                        (templates, flavors, icons, sources, css modes, PMs)
 */
import { readFile, readdir, writeFile, access } from 'node:fs/promises';
import { join, relative, dirname, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The registration parser lives in lib/ so the API-docs generator shares it —
// it additionally exposes values and selector nesting, which the CSS variable
// tables need. registerVarsKeys delegates to registerVarsEntries, so both
// spellings of register-vars count everywhere either import is used.
import { registerVarsKeys, registerVarsEntries } from './lib/scss-vars.mjs';
// The inverse of the quoting bestax-migrate/release.config.js uses to build its
// exec commands. Shared so the two halves cannot drift (#436).
import { tokenize } from './lib/shell-words.mjs';
import {
  PNPM_RESOLVES_TO_PLAIN_RANGE,
  DEP_SECTIONS,
  CONSUMER_SECTIONS,
  packTimeProtocol,
} from './lib/pack-time-protocols.mjs';
import {
  fenceMask,
  readRegions,
  sectionSpans,
  splitLines,
} from './lib/api-page.mjs';
import {
  SKILL_DIR_NAME,
  readSkillDirs as libReadSkillDirs,
  readSkillNames as libReadSkillNames,
  rosterSkillNames,
} from './lib/skills.mjs';
import { renderPage } from './gen-api-docs.mjs';
import {
  REGION_ID as SKILLS_INSTALL_REGION,
  TARGETS as SKILLS_INSTALL_TARGETS,
  renderInstallBlock,
} from './gen-skills-rosters.mjs';
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

/**
 * Partials that register variables no component claims, held as decisions
 * rather than drift. Each entry names why it is unclaimed and where the work
 * to claim it is tracked. Remove an entry once its partial is claimed — the
 * check fails on a stale exemption, so this list cannot quietly outlive the
 * problem it defers.
 */
const ORPHAN_EXEMPT = new Map([
  [
    'bulma-ui/src/scss/form/_picker-popover.scss',
    'shared picker chrome owned by no single component; needs an ownership ' +
      'decision before it can be claimed — #543',
  ],
]);

/**
 * A registered CSS variable that reaches no documentation surface is #464's
 * shape, whatever the file's claim status: an UNCLAIMED partial suppresses
 * its whole section, and a CLAIMED partial can still register keys the
 * attribution walk cannot place (a sibling class like `.sidebar-background`)
 * — those shipped invisibly too, with the boolean version of this rule
 * green. So the rule compares KEYS against what is actually documented: the
 * committed MCP catalog's variable set, whose own staleness is gated by
 * `gen:mcp:check`, making it an exact ledger of what the generators can
 * attribute.
 *
 * Exemption semantics follow: an exemption on a claimed partial is ACTIVE
 * while any of its keys are undocumented, and stale once all are — and on an
 * unclaimed partial, stale once it stops registering at all. The caller
 * sweeps for exemptions naming files the walk never visited, so a rename or
 * delete cannot leave one alive (the docstring's cannot-outlive-the-problem
 * guarantee used to hold only for the claimed-and-present case).
 *
 * Pure and fixture-driven for the usual reason: no real partial trips these
 * branches once the exemptions are settled, so without the seam an inverted
 * rule stays green.
 *
 * @param rel            repo-relative partial path
 * @param keys           variable keys the partial registers (either spelling)
 * @param claimed        Set of repo-relative paths appearing in SCSS_SOURCES
 * @param documentedKeys Set of variable keys the committed MCP catalog carries
 */
export function orphanPartialViolations(rel, keys, claimed, documentedKeys) {
  const exemptWhy = ORPHAN_EXEMPT.get(rel);
  if (claimed.has(rel)) {
    const undocumented = keys.filter(k => !documentedKeys.has(k));
    if (exemptWhy) {
      return undocumented.length
        ? [] // the exemption is doing its documented job
        : [
            `${rel} is claimed and every variable it registers is ` +
              `documented, yet it is still listed in ORPHAN_EXEMPT ` +
              `(“${exemptWhy}”). Remove the stale exemption.`,
          ];
    }
    return undocumented.length
      ? [
          `${rel} is claimed by SCSS_SOURCES, but registers ` +
            undocumented.map(k => `\`--bulma-${k}\``).join(', ') +
            ` absent from the committed MCP data, so ` +
            `${undocumented.length === 1 ? 'it appears' : 'they appear'} on ` +
            `no API page and in no MCP data. Run \`pnpm gen\` first — if ` +
            `${undocumented.length === 1 ? 'it' : 'they'} still fail, the ` +
            `attribution walk cannot place ` +
            `${undocumented.length === 1 ? 'its' : 'their'} selector: give ` +
            `${undocumented.length === 1 ? 'it' : 'them'} an attributable ` +
            `home (the claimant's root, compound, or constituent-element ` +
            `selector, \`:root\`, or a \`@mixin <prefix>\` body), or add an ` +
            `ORPHAN_EXEMPT entry saying why and where it is tracked.`,
        ]
      : [];
  }
  if (!keys.length) {
    return exemptWhy
      ? [
          `${rel} no longer registers any CSS variables, yet it is still ` +
            `listed in ORPHAN_EXEMPT (“${exemptWhy}”). The exemption ` +
            `outlived the problem — remove it.`,
        ]
      : [];
  }
  if (exemptWhy) return [];
  return [
    `${rel} registers CSS variables but no component claims it in ` +
      `SCSS_SOURCES (scripts/lib/api-sources.mjs), so they appear on no API ` +
      `page. Run \`pnpm gen:api-sources\` — it claims a partial only when ` +
      `the attribution walk can place its keys, so if that changes nothing, ` +
      `either give the keys an attributable home (or fix the matcher — see ` +
      `the compound-selector case, #464), or add an ORPHAN_EXEMPT entry ` +
      `saying why and where it is tracked.`,
  ];
}

async function checkScssConformance() {
  const violations = [];
  const scssRoot = join(REPO, 'bulma-ui', 'src', 'scss');
  // Every repo path SCSS_SOURCES claims, for the orphan rule below. Computed
  // once — the map is committed, importable state.
  const claimedPaths = new Set(
    Object.values(SCSS_SOURCES)
      .flat()
      .map(e => e.path)
  );
  // The documentation ledger the orphan rule compares registered keys
  // against: every variable in the committed MCP catalog. gen:mcp:check
  // gates its staleness, so committed data is exactly what the generators
  // can attribute — no need to re-run the extraction here.
  const documentedKeys = new Set();
  try {
    const dataDir = join(REPO, 'bestax-mcp', 'data', 'components');
    for (const f of await readdir(dataDir)) {
      if (!f.endsWith('.json')) continue;
      const record = JSON.parse(await readFile(join(dataDir, f), 'utf8'));
      for (const v of record.cssVars ?? []) {
        if (typeof v.css === 'string' && v.css.startsWith('--bulma-')) {
          documentedKeys.add(v.css.slice('--bulma-'.length));
        }
      }
    }
  } catch {
    violations.push(
      'bestax-mcp/data/components could not be read, so the orphan rule ' +
        'has no documentation ledger to compare registered variables against.'
    );
  }
  const visited = new Set();
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

      // 0. Registered variables must reach a documentation surface (#464) —
      // compared key-by-key, so a claimed partial registering under a
      // selector the walk cannot place is caught too, not just wholly
      // unclaimed files. registerVarsEntries reads both spellings
      // (registerVarsKeys now delegates to it for the same reason).
      visited.add(rel);
      const registeredKeys = [
        ...new Set(registerVarsEntries(src).map(e => e.key)),
      ];
      violations.push(
        ...orphanPartialViolations(
          rel,
          registeredKeys,
          claimedPaths,
          documentedKeys
        )
      );
      // A register-vars call the parser reads no entries from — passing a
      // map variable instead of a literal map — would otherwise slip past
      // the orphan rule as "registers nothing". (A file mixing a literal
      // call with a variable-form one still parses entries and is not
      // caught; no repo partial does either today, this pins that.)
      const registerCalls = (
        src.match(/@include\s+(?:[\w-]+\.)?register-vars?\b/g) ?? []
      ).length;
      if (registerCalls > 0 && registeredKeys.length === 0) {
        violations.push(
          `${rel} calls register-vars in a form the parser reads no ` +
            `entries from (e.g. passing a map variable), so its variables ` +
            `bypass the docs pipeline and the orphan rule. Inline the ` +
            `literal map, or add an ORPHAN_EXEMPT entry saying why and ` +
            `where it is tracked.`
        );
      }

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
  // The lifecycle sweep the exemption docstring promises: an ORPHAN_EXEMPT
  // entry naming a path the walk never visited is an exemption for a
  // renamed or deleted partial — the old path would otherwise keep its
  // entry alive forever while the new one prompts a second exemption.
  for (const [rel, why] of ORPHAN_EXEMPT) {
    if (!visited.has(rel)) {
      violations.push(
        `ORPHAN_EXEMPT lists ${rel} (“${why}”), but no such partial exists ` +
          `on that path. The file was renamed or removed — delete the ` +
          `entry, or update its path.`
      );
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
// Why the duplication PERSISTS, which is the question this header used to leave
// open (#547). Deliberately NOT a byte diff: the two files legitimately differ,
// one wrapping the guidance in a blockquote and the other in a Docusaurus
// admonition, and the docs page links absolute GitHub URLs where the root file
// links relative paths. A diff would fail on all of that and teach people to
// ignore it. Generating the shared block into both files between
// `bestax:generated` markers — the #542 skill-roster shape — was considered for
// exactly this and DECLINED: it puts machine-owned regions in the repo's
// most-read contributor document, where every future hand-editor of raw
// CONTRIBUTING.md meets them. A broken marker pair fails loudly (readRegions
// throws), so the objection is friction rather than safety — but that friction
// is paid by every editor forever, and the drift class it removes is one
// enumeration per file. So both copies stay hand-written, and this rule holds
// them together. Please stop re-proposing the generator.
//
// Why the assertions are SCOPED rather than file-wide. Whole-file matching
// would have caught the failure that prompted #536 — bestax-migrate and
// bestax-mcp appeared ZERO times in either guide — but it is vacuous for the
// facts (CONTRIBUTING.md links VERSIONING.md twice more for unrelated reasons)
// and nearly vacuous for the packages, since every publishable name is also
// spelled out in the commit-scope prose. Each assertion is therefore scoped to
// the construct that OWNS the list, and then reduced to whole-token membership
// inside it.
//
// What that scoping deliberately does NOT do, since the previous generation
// did: it does not parse shell. Reading loop word lists, command position and
// echo-vs-invoke bought one refinement — a package named inside the recipe
// fence but absent from the loop itself — and that refinement is where all four
// bugs #548 fixed lived, each one a false red whose suggested remedy was "drop
// this file from RELEASE_DOC_FILES", i.e. switch the check off. The trade taken
// in #547: a package named anywhere in the recipe fence now counts, as does one
// named anywhere below the `- Packages:` bullet in its own section. Both holes
// are bounded by a construct measured in lines, and on today's documents the
// names appear only in the loop word list and only in the bullet itself, so the
// two readings agree. Comment and quoted text are still stripped from the fence
// (shellOperative) and fenced lines are still dropped from the publisher list,
// which keeps the cheapest of those exclusions without any shell grammar.
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
 * Fence-aware, and it ends at ANY heading rather than `##`/`###`. Both were
 * bugs: a `####` heading did not close the block, so it ran to EOF and restored
 * the file-wide search this exists to prevent; and a `---` or `:::` inside a
 * fenced example truncated it early, in the other direction.
 *
 * The `:::` terminator is nesting-aware for the same reason (#547). On the docs
 * page the guidance IS the admonition, so its own closing `:::` is the end —
 * but a nested `:::note` inside it closes first, and taking that as the end
 * truncated the block above most of the facts. Docusaurus nests by widening the
 * outer run, so a close only ends the block when it matches the run that opened
 * it.
 */
// One definition of a markdown heading line for every release-docs
// extractor: four hand-copies of this regex had already picked up a \s-vs-
// space disagreement with fenceMask's CommonMark reading (#548 review).
const MD_HEADING = /^ {0,3}#{1,6}\s/;

/**
 * The reader's view of a markdown source, in one interleaved pass:
 *
 *   fenced[i]   — line i is part of a fenced code block (delimiters included)
 *   visible[i]  — line i's RENDERED text: comment content excised, '' for
 *                 fenced lines (their content is reachable via `lines` and the
 *                 spans; it is example text, not prose)
 *   spans       — the fenced blocks, as [{ open, close }] line-index pairs,
 *                 delimiters included, an unterminated fence running to EOF
 *
 * One pass rather than fenceMask + a comment mask layered on top, because the
 * two grammars gate each other in BOTH directions and a layered computation
 * gets one of them wrong (#547 review, round 5). A `<!--` inside a fenced
 * block is literal text and must not open a comment — docs pages display HTML
 * comments in `html` fences on purpose. A fence delimiter inside a comment is
 * comment text and must not open a fence — layering comment state over a
 * comment-blind fenceMask let a commented-out ``` fragment open a phantom
 * fence that swallowed the comment's own close, masking the document to EOF.
 * So: inside a fence, comments cannot open; inside a comment, fences cannot
 * open; each construct is closed only by its own terminator.
 *
 * Excised text rather than a boolean line mask, which round 5 killed: a
 * boolean cannot say "part of this line is rendered". It masked an anchor
 * line annotated with a trailing `<!-- keep in sync -->` (false red on the
 * likeliest lines to receive such a note — the check's own anchors), while
 * leaving a commented-out fact INSIDE the guidance block satisfying
 * `includes()` (fail-open). Visible text gets both right for free: the
 * annotation vanishes, the anchor stays; the commented fact vanishes, the
 * assertion bites.
 *
 * The comment grammar, and why each production is here:
 *
 *   `<!-->` and `<!--->`   complete empty comments (CommonMark 0.31's abrupt
 *                          closes). Matching `<!--` first and never the
 *                          overlapping close left `open` stuck true and the
 *                          whole visible document masked — a one-character
 *                          typo of `<!-- -->` red-flagged every assertion.
 *   `<!-- … -->` / `--!>`  the HTML comment; both close forms end it. `--!>`
 *                          is the parse-error close browsers honor (CodeQL
 *                          js/bad-tag-filter; the repro sanitizer breaks it
 *                          for the same reason).
 *   `{/* … *\/}`           the MDX comment (its close is written with a
 *                          backslash here only because the raw sequence would
 *                          end this docblock). The docs mirror is MDX-compiled
 *                          — docusaurus.config.js leaves markdown.format as
 *                          mdx — so MDX comments hide rendered content there.
 *                          Without this production, the commented-out-content
 *                          fail-open this file closes for HTML comments
 *                          stayed fully open on one of the two release docs
 *                          via its native comment syntax. In the
 *                          GitHub-rendered file `{/*` is literal, but only if
 *                          someone writes it in prose, which no release doc
 *                          does.
 *
 * Inline code spans are protected: `` `<!--` `` documenting marker syntax is
 * literal text, so delimiters are scanned on a copy with code spans blanked
 * (positions preserved). Scanned, not excised — the span stays visible.
 *
 * Accepted residuals, recorded rather than modeled: the two files' renderers
 * genuinely disagree on `--!>` (browsers close there, remark-comment does
 * not), so on the MDX mirror text between a `--!>` and a later `-->` counts
 * as visible while the published page hides it — modeling per-file comment
 * grammars buys that corner and nothing else. A code span AFTER a same-line
 * comment close is scanned unstripped. Both need comment constructs no
 * release doc contains.
 */
const COMMENT_TOKEN = /<!--->|<!-->|<!--|--!?>|\{\/\*|\*\/\}/g;

function docStructure(lines) {
  const fenced = new Array(lines.length).fill(false);
  const visible = new Array(lines.length).fill('');
  const spans = [];
  let fence = null; // { char, len, open } — open is the delimiter line index
  let comment = null; // null | 'html' | 'mdx'
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fence) {
      fenced[i] = true;
      const m = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (
        m &&
        m[1][0] === fence.char &&
        m[1].length >= fence.len &&
        !m[2].trim()
      ) {
        spans.push({ open: fence.open, close: i });
        fence = null;
      }
      continue;
    }
    if (!comment) {
      const m = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      // An opening ``` fence may not contain a backtick in its info string.
      if (m && !(m[1][0] === '`' && m[2].includes('`'))) {
        fence = { char: m[1][0], len: m[1].length, open: i };
        fenced[i] = true;
        continue;
      }
    }
    // Delimiters are found on a code-span-blanked copy (same length, so
    // indices line up with `line`); the visible text is cut from the real
    // line. Inside a comment the text is not markdown, so it scans raw.
    // Spans pair per CommonMark: an N-backtick run closes with a run of
    // exactly N, so ``<!--`` protects its opener too — a single-tick-only
    // blank left the double-tick form's `<!--` visible to the scanner, which
    // then hid the rest of the document (round 6).
    const scan = comment
      ? line
      : line.replace(/(?<!`)(`+)(?!`)(.*?[^`])\1(?!`)/g, s =>
          ' '.repeat(s.length)
        );
    let out = '';
    let from = comment ? line.length : 0;
    for (const m of scan.matchAll(COMMENT_TOKEN)) {
      const t = m[0];
      if (!comment) {
        if (t === '<!--' || t === '{/*') {
          out += line.slice(from, m.index);
          from = line.length;
          comment = t === '<!--' ? 'html' : 'mdx';
        } else if (t === '<!-->' || t === '<!--->') {
          out += line.slice(from, m.index);
          from = m.index + t.length;
        }
        // A stray close with nothing open is literal text.
      } else if (
        comment === 'html' ? t === '-->' || t === '--!>' : t === '*/}'
      ) {
        comment = null;
        from = m.index + t.length;
      }
    }
    if (!comment) out += line.slice(from);
    visible[i] = out;
  }
  if (fence) spans.push({ open: fence.open, close: lines.length - 1 });
  return { fenced, visible, spans };
}

/**
 * Comment- and quote-stripped shell text — the OPERATIVE part of a recipe.
 * Quotes go because both fail-opens this family ever saw arrived through prose
 * inside the fence: a `# …` line naming a package the loop skipped, and an
 * echoed banner naming one. In these recipes the operative shell — the loop
 * word list, the release invocation — is never quoted, so what survives is
 * what runs.
 *
 * Whitespace is then normalised, which is NOT loop parsing and is load-bearing
 * for the ANCHOR rather than for any word list. A wrapped invocation —
 * `pnpm exec semantic-release \` breaking before `--dry-run` — splits the
 * string recipeFences searches for, so the fence stops being a recipe at all
 * and the page is reported as having none: a false red whose stated remedy is
 * to drop the file from RELEASE_DOC_FILES, i.e. the exact failure this rule
 * keeps being rewritten to avoid.
 *
 * It takes BOTH replacements, which is why the continuation join alone never
 * fixed this and the case was broken before #547 as well (found in review).
 * Joining leaves the space that sat BEFORE the backslash in place, so the
 * result is `semantic-release  --dry-run` with two spaces and the anchor still
 * misses. Collapsing horizontal runs afterwards is what actually closes it.
 * The continuation regex takes `[ \t]*` rather than `\s*` so it joins one
 * line, not every blank line that happens to follow.
 *
 * ORDER: comments per line, then the join, then quotes, then whitespace.
 * Quote-stripping before the join was a fail-open the other way (#547 review,
 * round 5): a double-quoted banner WRAPPED across a continuation has no quote
 * pair on either physical line, so nothing stripped, and the join then
 * manufactured the anchor inside pure echo text — a fence that runs nothing
 * became "the recipe" and red-flagged every package. Joining first restores
 * the pair, and the banner strips like any other quoted prose. Comments stay
 * per-line and FIRST, so a `\` at the end of a commented line cannot join the
 * next line into the comment.
 *
 * The comment strip is QUOTE-AWARE (round 6): running before the quote strip,
 * a bare /#.*$/ took the `#` inside `echo "Step #1"` as a comment and deleted
 * the invocation after it — the "no fenced block" false red again. The
 * alternation consumes paired quoted strings intact (keeping them for the
 * quote pass after the join) and removes only a `#` that sits outside them.
 * A `#` inside a string that a continuation WRAPS is still mis-stripped —
 * that needs a hash inside quotes inside a wrapped line, and each of this
 * function's passes is line-local by design.
 *
 * Beyond that, this is all that is left of the shell reading. The
 * command-position and loop-segmentation layers that used to sit here were
 * deleted in #547; the header above records what that traded.
 */
function shellOperative(text) {
  return text
    .split('\n')
    .map(l => l.replace(/("[^"\n]*"|'[^'\n]*')|#.*$/g, (m, q) => q ?? ''))
    .join('\n')
    .replace(/\\\n[ \t]*/g, ' ')
    .replace(/"[^"\n]*"|'[^'\n]*'/g, '""')
    .replace(/[ \t]+/g, ' ');
}

function safeToRunBlock(src) {
  const { lines } = splitLines(src);
  const { fenced, visible } = docStructure(lines);
  // VISIBLE text throughout — the search, the terminators, and the returned
  // block alike (#547 review, round 5). Searching raw lines let a fenced
  // example or a commented-out copy of the marker BE the block; returning raw
  // lines let a fact whose only occurrence was commented out still satisfy
  // `includes()`, which is the commented-out-not-deleted fail-open this file
  // closes elsewhere; and terminating on raw lines let a heading inside an
  // HTML comment — a parked draft, invisible to every reader — end the block
  // above most of the facts. Fenced lines are the one exception: their raw
  // text stays in the returned block (an example inside the guidance is part
  // of the guidance), and they never terminate it.
  const text = i => (fenced[i] ? lines[i] : visible[i]);
  const start = visible.findIndex(l =>
    l.includes('Safe to run; never publishes')
  );
  if (start < 0) return null;
  // The run that opened the guidance, when the marker line IS the opener (the
  // docs page): only a bare close at least that wide ends the block; anything
  // narrower is a nested admonition closing itself, since Docusaurus nests by
  // widening the OUTER run. In the blockquote form there is no opener, and the
  // terminator is exactly `:::` — a wider bare run is stray junk, not a close,
  // which is what this scan did before nesting was considered (a `::::` line
  // ending the blockquote block was an undocumented behavior flip the round-5
  // review caught). Closes match on trimmed text, so an indented `:::` still
  // terminates, as it always had.
  const outer = visible[start].match(/^ {0,3}(:{3,}).*\S/)?.[1].length ?? null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (fenced[i]) continue; // a terminator inside a fenced example is content
    const l = visible[i];
    const close = l.trim().match(/^(:{3,})$/)?.[1].length ?? 0;
    if (close && (outer === null ? close === 3 : close >= outer)) {
      end = i;
      break;
    }
    if (MD_HEADING.test(l) || l.trim() === '---') {
      end = i;
      break;
    }
  }
  return lines
    .slice(start, end)
    .map((_, k) => text(start + k))
    .join('\n');
}

/**
 * Every fenced block that runs the semantic-release dry run, comment- and
 * quote-stripped. Located by CONTENT rather than by heading, so renaming the
 * section does not silently switch this check off.
 *
 * The fence is the scope, and that is the whole of the reading (#547): a fence
 * is a recipe, so a prose mention of the command — "run `semantic-release
 * --dry-run` to preview" in some other section — is excluded by construction
 * rather than by inspecting command position.
 *
 * ALL matching fences are returned, not the best one. Picking a single fence
 * was itself a bug twice over: first-match let an example fence above the
 * recipe become "the recipe", and preferring the one that looked like it
 * invoked let a stale second recipe hide behind a fresh one. Every fence that
 * runs the dry run is a recipe a contributor might copy, so every one of them
 * has to be complete.
 *
 * Fences come from `docStructure`'s state machine rather than a
 * /```[\s\S]*?```/g match, which pairs backtick runs in document order: one
 * stray ``` in prose, or a ````markdown wrapper around a nested fence, shifts
 * every pair after it and the real recipe stops being found. The remedy the
 * violation then offers is "drop this file from RELEASE_DOC_FILES", i.e.
 * switch the check off, which is the worst way to be wrong. An UNTERMINATED
 * fence runs to EOF and is still returned, for the same reason — dropping it
 * produced that same false violation. The spans are comment-aware by
 * construction, so a complete recipe inside `<!-- … -->` — which renders as
 * nothing — is not a fence at all, and cannot cover for the visible recipe
 * being removed (pre-#547, in every generation).
 *
 * What is knowingly NOT found (#547 review, round 5, declined): a recipe
 * driving the invocation through a variable — `CMD="… --dry-run"; $CMD` —
 * since quote-stripping deletes the anchor before the filter sees it. The
 * previous generation's raw-containment fallback covered that, but the same
 * fallback is what let a quoted echo banner count as a recipe, and membership
 * alone cannot tell those two quoted anchors apart; telling them apart is
 * command-position parsing, which is the layer #547 deleted. Both committed
 * recipes invoke directly, and a variable-form rewrite that reds CI names its
 * own remedy in the violation text.
 */
export function recipeFences(src) {
  const { lines } = splitLines(src);
  // From open + 1: the OPENING delimiter is markup, not shell. Its info string
  // was inside the operative text in every generation of this check, and under
  // membership that let ```bash bestax-mcp count as naming bestax-mcp — the
  // loop-word-list narrowing used to exclude it, so this one is a regression
  // (found in review). It also let an info string carrying the anchor conjure
  // a recipe out of a fence with no invocation at all, which was fail-open on
  // main too. Sliced through `close`, not `close - 1`: for an unterminated
  // fence `close` is the last line of the file and is real content.
  return docStructure(lines)
    .spans.map(({ open, close }) =>
      shellOperative(lines.slice(open + 1, close + 1).join('\n'))
    )
    .filter(b => b.includes('semantic-release --dry-run'));
}

/**
 * Every `- Packages:` list in every heading section whose TITLE claims trusted
 * publishing — the section that owns the packages needing a publisher
 * configured on npmjs.com. Each entry runs from its bullet to the NEXT
 * `- Packages:` bullet, or to the end of the section, in VISIBLE text —
 * fenced examples contribute nothing and commented content is excised.
 *
 * What #547 changed: the bullet is still ANCHORED by its literal `- Packages:`
 * prefix, which is a one-line find and a stable marker in the document, but the
 * end-bound scan around it is gone. That scan stopped at the next bullet, blank
 * line, fenced line or section end, and three of those four bounds had been a
 * bug in their own right — a continuation line dropped at EOF, a butted heading
 * sweeping the next section in, a butted fence doing the same.
 *
 * One bound survives, and it is not optional: the next anchor. Running to the
 * section end merged a stale list with the complete one below it and the union
 * passed — a fail-open, and the single regression this rewrite introduced,
 * caught in review. Bounding each list by the next keeps every one of them
 * judged on its own, which is stronger than either previous generation: the
 * old scan only ever validated the FIRST bullet in a section, so a stale
 * duplicate underneath a good list went unchecked.
 *
 * The trade is that anything else below a bullet counts toward it: on the
 * committed page that is the Provider/Repository/Workflow bullets and one
 * paragraph, none of which names a package. Fenced lines are the exception and
 * stay excluded — `npm owner ls bestax-mcp` in an example must not stand in for
 * the list.
 *
 * A candidate section with NO bullet contributes nothing rather than
 * anchoring-and-failing, so a prose aside titled like this section does not
 * produce a false red; but if no candidate owns a bullet, "the section lost its
 * list" still fires from the caller. Every candidate that does own one is
 * validated: the first-match anchor let an earlier aside steal the search
 * (false red), and preferring the section that owned a bullet let a LATER
 * aside absorb the check while the real list was deleted (fail-open — #548
 * review caught both generations).
 *
 * Sections run to the next heading at ANY level, so a `####` sub-heading closes
 * one rather than letting it swallow the rest of the file.
 */
export function publisherSections(src) {
  const { lines } = splitLines(src);
  const { visible } = docStructure(lines);
  // VISIBLE text throughout (#547 review, round 5): a commented-out heading
  // does not anchor a section, a commented-out bullet is not a list, and a
  // fenced line's visible text is '' — while a bullet ANNOTATED with a
  // trailing `<!-- keep in sync -->` keeps its anchor, since only the comment
  // is excised. Boolean masking got the last one wrong on exactly the lines
  // likeliest to carry such a note: the check's own anchors.
  const isHeading = i => MD_HEADING.test(visible[i]);
  const sections = [];
  for (let i = 0; i < lines.length; i++) {
    if (!(isHeading(i) && /trusted[- ]publish/i.test(visible[i]))) continue;
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (isHeading(j)) {
        end = j;
        break;
      }
    }
    // EVERY `- Packages:` anchor in the section, each bounded by the NEXT one.
    // Running the first anchor to the section end merged a stale list with the
    // complete one below it, and the union passed — a fail-open, and the one
    // regression this rewrite introduced (found in review). Bounding by the
    // next anchor is the only bound this needs: continuation lines and the
    // Provider/Repository/Workflow bullets sit before it, so they still count,
    // and each list is judged on its own.
    const anchors = [];
    for (let j = i + 1; j < end; j++) {
      if (visible[j].trimStart().startsWith('- Packages:')) {
        anchors.push(j);
      }
    }
    for (const [k, start] of anchors.entries()) {
      const stop = anchors[k + 1] ?? end;
      sections.push(visible.slice(start, stop).join('\n'));
    }
  }
  return sections;
}

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
 * Violations for workspace entries whose manifest could not be read.
 *
 * Pure and exported for the same reason releaseDocViolations is: the branch
 * that used to build these messages lived inside checkReleaseDocsSync, where a
 * test could not reach it — so the test named for this case asserted the clean
 * case instead and would have stayed green through a regression.
 */
export function unreadableManifestViolations(unreadable) {
  return unreadable.map(
    dir =>
      dir +
      '/package.json could not be read or parsed, or is not a JSON object, ' +
      'so the release-docs checks ' +
      'cannot tell whether ' +
      dir +
      ' needs to appear in the dry-run recipe and the trusted-publisher list. ' +
      'Fix the manifest — leaving it unreadable removes ' +
      dir +
      ' from both lists silently (#536).'
  );
}

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
        'A flow sequence or a glob now throws in parseWorkspacePackages ' +
        'itself (#438), so reaching this means the block list is empty or ' +
        'every entry is private (#536).',
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
    const recipes = recipeFences(src);
    if (!recipes.length) {
      violations.push(
        `${rel} has no fenced block running \`semantic-release --dry-run\`. ` +
          `That recipe is how a contributor previews a release without ` +
          `publishing — restore it, or drop ${rel} from RELEASE_DOC_FILES in ` +
          `scripts/check-conformance.mjs if the page no longer covers releases.`
      );
    }
    // Every one of them, not the best-looking one: a contributor copies
    // whichever fence they land on, so a second recipe that went short is a
    // wrong instruction even with a complete one further up the page.
    for (const recipe of recipes) {
      const named = packageTokens(recipe);
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
  //
  // Absent from the map is also a different fact from present-but-empty, and it
  // already has its own message in checkReleaseDocsSync. Coercing one into the
  // other told a reader the file had no bullet when the file was never read.
  const [primary] = RELEASE_DOC_FILES;
  if (docs.has(primary)) {
    const sections = publisherSections(docs.get(primary));
    if (!sections.length) {
      violations.push(
        primary +
          ' has no "- Packages:" line in the OIDC trusted publishing section. ' +
          'It names the packages that need a trusted publisher configured on ' +
          'npmjs.com; without it nobody can tell which ones do.'
      );
    } else {
      // EVERY list under a trusted-publishing heading must be complete: a
      // stale duplicate must not hide behind a fresh one, whichever order they
      // appear in.
      for (const section of sections) {
        const named = packageTokens(section);
        const missing = packages.filter(p => !named.has(p.name));
        if (missing.length) {
          violations.push(
            primary +
              "'s trusted-publisher list omits " +
              missing.map(p => p.name).join(', ') +
              '. Every publishable package authenticates by OIDC, and a ' +
              'missing trusted publisher fails the publish after the release ' +
              'commit and tag are already pushed — which spends the version ' +
              '(#536).'
          );
        }
      }
    }
  }

  return violations;
}

/**
 * Every publishable workspace package, plus the workspace entries whose
 * manifest could not be read.
 *
 * Shared by checkReleaseDocsSync and its test, so the real-repo assertion
 * checks the same set the check does — previously the test re-derived it, and a
 * drift between them would make a passing test mean less than it looks like.
 * (checkPublishableManifests still walks the workspace itself: it needs the
 * manifest bodies, not just the names.)
 *
 * The unreadable ones are RETURNED rather than skipped, because skipping
 * narrows both derived assertions silently — a manifest with a syntax error
 * drops its package from the lists those assertions require, and the check
 * prints a tick. That is the same fail-open shape the PNPM_PUBLISHED comment
 * above argues against.
 */
export async function publishablePackages(root = REPO) {
  const packages = [];
  const unreadable = [];
  const yaml = await readFile(join(root, 'pnpm-workspace.yaml'), 'utf8');
  for (const dir of parseWorkspacePackages(yaml)) {
    let pkg;
    try {
      pkg = JSON.parse(await readFile(join(root, dir, 'package.json'), 'utf8'));
    } catch {
      unreadable.push(dir);
      continue;
    }
    // JSON.parse succeeds on `null`, `42`, `"x"`, `[]` — shapes a truncated
    // write really produces. `null` dereferenced below threw a TypeError past
    // the runner's loop; an ARRAY passes typeof and instead vanished silently
    // (no name, so it never joined the package list) — the same outcome by a
    // quieter road. Both count as unreadable manifests, checked here in the
    // open rather than by throwing into the catch above.
    if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
      unreadable.push(dir);
      continue;
    }
    if (!pkg.private && pkg.name) packages.push({ dir, name: pkg.name });
  }
  return { packages, unreadable };
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

  const { packages, unreadable } = await publishablePackages();
  const unreadableViolations = unreadableManifestViolations(unreadable);
  if (unreadableViolations.length) return unreadableViolations;

  return releaseDocViolations(docs, packages);
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
//
// Still a hand parser, on purpose (#438 weighed the alternatives): the repo
// declares no YAML dependency anywhere, and bypass-annotations.mjs records the
// house position that adding one to police this file would itself be subject
// to the cooldown the file configures. Asking pnpm (`pnpm m ls --json`) would
// be scripts/' first subprocess and would break the fixture-driven purity two
// test files rely on. So the parser stays, and its known cliffs are fenced:
// an entry it cannot represent THROWS naming the limitation, instead of
// silently truncating the list — the direction that mattered, because every
// check walking this list quietly loses coverage for whatever falls off it.
export function parseWorkspacePackages(yaml) {
  const dirs = [];
  let inBlock = false;
  for (const line of yaml.split(/\r?\n/)) {
    const flow = line.match(/^packages:\s*(\[.*)$/);
    if (flow) {
      // `packages: [a, b]` is valid YAML this parser does not read. Returning
      // [] here used to fall through to the vaguer "no packages: entries"
      // guards, two calls away from the cause.
      throw new Error(
        'pnpm-workspace.yaml: `packages:` is a flow sequence ' +
          `(${flow[1].trim()}), which parseWorkspacePackages does not read. ` +
          'Use a block list (one `- dir` per line).'
      );
    }
    if (/^packages:\s*$/.test(line)) {
      inBlock = true;
      continue;
    }
    if (!inBlock) continue;
    // An inline ` # comment` ends the entry, it does not end the block. The
    // old parser matched the whole rest-of-line, so `- create-bestax # x`
    // failed the match, fell into the terminator branch, and silently dropped
    // every entry after it (#438's worse half). Stripped only when whitespace
    // precedes the `#`, matching YAML: `- a#b` is one scalar, not `a` plus a
    // comment.
    const item = line.replace(/\s#.*$/, '').match(/^\s+-\s*(\S+)\s*$/);
    if (item) {
      // ` #` inside a QUOTED scalar is data, and the strip above cannot know
      // that: it leaves a mutilated token behind (`- "docs # archive"`
      // becomes `"docs`), which used to be silently returned as `docs` — the
      // wrong directory, inspected with confidence. Each delimiter is
      // validated independently (#545 review): a combined quote-count parity
      // check both rejected the valid `- "foo's"` and accepted the malformed
      // `- "foo'` as `foo`.
      let entry = item[1];
      const quote = entry[0] === '"' || entry[0] === "'" ? entry[0] : null;
      if (quote) {
        if (
          entry.length < 2 ||
          entry[entry.length - 1] !== quote ||
          entry.slice(1, -1).includes(quote)
        ) {
          throw new Error(
            `pnpm-workspace.yaml: cannot parse the entry ${line.trim()} — a ` +
              'quoted scalar must open and close with the same quote, with ' +
              'none of that quote inside. Use a bare directory name.'
          );
        }
        entry = entry.slice(1, -1);
      } else if (entry.includes('"') || entry.includes("'")) {
        // A quote mid-token in an unquoted scalar is the comment-strip
        // fingerprint, or a shape this parser does not read.
        throw new Error(
          `pnpm-workspace.yaml: cannot parse the entry ${line.trim()} — ` +
            'stray quote in an unquoted scalar. Use a bare directory name.'
        );
      }
      if (/[*?[\]]/.test(entry)) {
        // A glob is a real pnpm feature this repo deliberately does not use:
        // nothing here expands it, so every package under it would silently
        // fall outside every check that walks this list.
        throw new Error(
          `pnpm-workspace.yaml: "${entry}" is a glob, which ` +
            'parseWorkspacePackages does not expand — every package under it ' +
            'would be silently exempt from the conformance checks. List each ' +
            'directory explicitly.'
        );
      }
      dirs.push(entry);
    } else if (/^\s+-/.test(line)) {
      // A sequence entry this parser cannot read (`- &anchor x`, a quoted
      // scalar with spaces). Breaking here would keep the fail-open truncation
      // this change exists to end: everything after the odd entry silently
      // vanishes from every check. The block ends only at a dedented line.
      throw new Error(
        `pnpm-workspace.yaml: cannot parse the entry ${line.trim()}. ` +
          'parseWorkspacePackages reads plain (optionally quoted) directory ' +
          'names only.'
      );
    } else if (line.trim() && !line.trimStart().startsWith('#')) break;
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
export function manifestViolations(dir, pkg, siblings = new Map()) {
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
      // install that one too — but when the target is a workspace SIBLING,
      // siblingViolations owns the case: its move-to-devDependencies fix is
      // the right one, while this rule's pin-a-range advice would keep the
      // sibling dependency in place and just trade one violation for another
      // (#546 review). A `catalog:` entry can point at an external package,
      // which is no sibling, so the skip is by name, not by protocol.
      if (CONSUMER_SECTIONS.includes(section) && !siblings.has(name)) {
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
 * No published package may depend on a workspace sibling in a section
 * consumers resolve, however the specifier is spelled (#537).
 *
 * The protocol rule above is one spelling of this policy caught by side
 * effect: `workspace:^` in `dependencies` is flagged because pnpm resolving
 * it does not stop consumers installing it. But since every package publishes
 * with pnpm (#532), `workspace:^` and a plain `^5.11.2` land in the tarball
 * as the same installable range — so the likelier spelling, a hand-written
 * semver range, passed every check while making every consumer of a
 * four-file codemod CLI install the component library. bestax-migrate's
 * CLAUDE.md carried "that one is on review" as the only enforcement.
 *
 * The rule is blanket over published packages rather than an opt-in set: no
 * package has a sibling dep in a consumer section today, so nothing is
 * grandfathered, and a scaffolder or an MCP server has no more business
 * pulling in the component library than the codemod does. If a package ever
 * legitimately needs one, that PR adds the exemption — a decision at the
 * moment it is cheap, the PNPM_PUBLISHED shape.
 *
 * peerDependencies are deliberately OUTSIDE the rule, and this departs from
 * the protocol rule above, which does fire on a `workspace:` peer (with
 * pin-a-range advice). The departure is the point: a peer on a sibling is
 * the one section where "consumers install this" is the intended semantic —
 * a component add-on peering on the core library is a normal thing to want.
 *
 * `siblings` (a Map of name → { private }) arrives as an argument because
 * this function is pure and fixture-driven like manifestViolations, and the
 * names live in manifests only the async walk can read. It is DERIVED from
 * the workspace there, never declared — a hardcoded name list is the drift
 * class #540 closed. Private-ness rides along because the fix differs: a
 * private sibling cannot become a peerDependency, since no consumer could
 * resolve it.
 */
export function siblingViolations(dir, pkg, siblings) {
  if (pkg?.private) return [];
  const violations = [];
  for (const section of ['dependencies', 'optionalDependencies']) {
    for (const [name, spec] of Object.entries(pkg?.[section] ?? {})) {
      // An npm alias installs its TARGET, so `"ui": "npm:@allxsmith/…@^5"`
      // pulls in the sibling under another key. Compared on the target, or
      // the rule is bypassable by renaming — review on the PR caught exactly
      // that hole. The last `@` splits off the range; a scoped name's leading
      // `@` survives because the slice starts past `npm:`.
      let target = name;
      if (typeof spec === 'string' && spec.startsWith('npm:')) {
        const aliased = spec.slice(4);
        const at = aliased.lastIndexOf('@');
        target = at > 0 ? aliased.slice(0, at) : aliased;
      }
      const sibling = siblings.get(target);
      if (!sibling || target === pkg?.name) continue;
      // A PRIVATE sibling gets different advice: it does not exist on the
      // registry, so "make it a peerDependency" would leave every consumer
      // unable to install — the dependency cannot ship in any section
      // consumers resolve.
      const fix = sibling.private
        ? `"${target}" is private and unpublishable, so no consumer could ` +
          `ever resolve it — this dependency cannot ship at all. Move it ` +
          `to devDependencies.`
        : `Move it to devDependencies, or if consumers really must resolve ` +
          `it, make it a peerDependency with an explicit range.`;
      violations.push(
        `${dir}/package.json depends on workspace sibling "${target}" in ` +
          `${section}${target === name ? '' : ` (aliased as "${name}")`}. ` +
          `Whatever the specifier says, consumers of ${dir} would be made ` +
          `to install it and its whole tree — a codemod CLI pulling in the ` +
          `component library is the case this rule exists for (#537). ${fix}`
      );
    }
  }
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

  // First pass: read every manifest once, so the sibling-name set exists
  // before any package is judged. Derived from the workspace, not declared —
  // a hardcoded name list is the drift class #540 closed. Private packages'
  // NAMES still count as siblings (depending on one is broken for consumers
  // either way), but private packages are not themselves judged.
  const manifests = [];
  for (const dir of packages) {
    try {
      const pkg = JSON.parse(
        await readFile(join(REPO, dir, 'package.json'), 'utf8')
      );
      // JSON.parse succeeds on `null`, `42`, `"x"` — shapes a truncated write
      // or merge artifact really produces. Dereferencing one later would
      // throw a TypeError past the runner's loop and abort every remaining
      // check with a stack trace, when this exact case has a violation
      // written for it. Review caught the sibling-map pass doing just that.
      // An ARRAY passes typeof and instead vanishes silently — no name, so
      // it never joins the sibling map. Same outcome, quieter road.
      if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
        throw new Error('not an object');
      }
      manifests.push({ dir, pkg });
    } catch {
      violations.push(
        `pnpm-workspace.yaml lists "${dir}" but ${dir}/package.json is missing ` +
          `or unparseable.`
      );
    }
  }
  const siblings = new Map(
    manifests
      .filter(m => m.pkg.name)
      .map(m => [m.pkg.name, { private: Boolean(m.pkg.private) }])
  );

  for (const { dir, pkg } of manifests) {
    // The private check lives in manifestViolations, not here, so there is one
    // copy of it. hookScripts still runs for private packages: a broken pack
    // hook is worth reporting whether or not the package publishes.
    violations.push(...manifestViolations(dir, pkg, siblings));
    violations.push(...siblingViolations(dir, pkg, siblings));

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

// --- skills-roster -----------------------------------------------------------

/**
 * Every hand-maintained copy of the skills roster, and the shape it uses.
 *
 * The three consumers that CAN derive the roster do: create-bestax's and
 * bestax-mcp's `sync-skills.mjs` copy each directory holding a `SKILL.md`, and
 * `gen-mcp-index.mjs` indexes the same set (#540) — all through
 * `scripts/lib/skills.mjs`, the single definition of that predicate. What is
 * left is prose, which cannot be derived and so drifts silently — the repo-root
 * README was already four skills behind seven when this check landed, on the
 * project's front page.
 *
 * Not to be confused with `skills-sync`, which despite the name is about the
 * bestax-theming skill's two reference inventories and never reads the roster.
 *
 * Each copy is located by its STRUCTURE — a table row, a tree entry, a slug
 * link — rather than by the bare skill name occurring anywhere in the file.
 * `bestax-migrate` is why: it is also a package, a CLI, and the marker the
 * codemod leaves behind, so it appears in prose in most of these files, and a
 * bare-name search would pass on a table that had lost its row.
 *
 * Two install lines are deliberately NOT rosters. `bulma-ui/README.md` and
 * `bulma-ui/AGENTS.md` each show a single `--skill` command as an example;
 * holding them to all seven would demand a list neither is trying to be. Their
 * real rosters (a table and a parenthetical) are covered instead.
 *
 * The one fenced copy — the hand-written layout tree — anchors on its
 * `<!-- skills-roster:tree -->` marker line and takes the fence that follows,
 * parsed with `fenceMask`. (The three install blocks are no longer prose
 * copies at all: gen-skills-rosters.mjs writes them between
 * `bestax:generated` markers, and checkSkillsRoster diffs the committed
 * region against the generator's output.) The anchoring history still
 * matters for the tree: the first fence-scope here content-sniffed "the
 * first fence containing" its shape, so a decoy block could hijack it, and
 * its `/^```[a-z]*\n/` opener could not parse info strings
 * (```bash title=…), frame-shifting every later fence. The Agent Skills
 * tables anchor on their own `| Skill |` header row for the same reason:
 * `bestax-migrate` in the first cell of some OTHER table must not stand in
 * for a deleted row.
 *
 * The capture group is the point: reading the names back out checks BOTH
 * directions, so a roster still advertising a deleted skill fails too. That
 * half has no other guard — sync-skills.mjs just silently stops copying it.
 *
 * The docs-site surfaces are held through the slug transform (directory name
 * minus `bestax-`, exactly what gen-mcp-index.mjs ships as `promptName`): the
 * sidebar entries and the intro bullet roster here, and the per-skill page
 * files in `skillsPageViolations`. A new skill fails conformance until its
 * docs page, sidebar entry, and intro bullet exist.
 */
export const SKILL_ROSTERS = [
  {
    file: 'skills/README.md',
    copies: [
      {
        what: 'the Skills table',
        scope: skillsTableScope(),
        list: /^\|[ \t]*\[`([a-z][a-z0-9-]*)`\]/gm,
        example: n => `| [\`${n}\`](./${n}/SKILL.md) | Use it when… |`,
      },
      {
        what: 'the Layout tree',
        scope: markerFence('skills-roster:tree'),
        list: /^ {2}([a-z][a-z0-9-]*)\/$/gm,
        example: n => `  ${n}/`,
      },
    ],
  },
  {
    file: 'create-bestax/src/constants.ts',
    // Scoped: this file is mostly other prose, and `- **bold**` is a bullet
    // shape the CLAUDE_MD template uses in several unrelated sections.
    scope: section('## AI skills'),
    copies: [
      {
        what: 'the scaffolded CLAUDE.md "AI skills" roster',
        list: /^- \*\*([a-z][a-z0-9-]*)\*\*/gm,
        example: n => `- **${n}** — one line on what it does.`,
      },
    ],
  },
  {
    file: 'docs/docs/skills/intro.md',
    copies: [
      // The install block above the bullets is GENERATED between
      // bestax:generated markers (gen-skills-rosters.mjs) and held fresh by
      // the staleness comparison in checkSkillsRoster, not by a prose copy.
      {
        what: 'the per-skill bullet roster',
        names: text =>
          [...text.matchAll(/^- \*\*\[[^\]]+\]\(\.\/([a-z0-9-]+)\)\*\*/gm)].map(
            m => m[1]
          ),
        fromToken: slug => `bestax-${slug}`,
        example: n =>
          `- **[…](./${n.replace(/^bestax-/, '')})** — one line on when to reach for it.`,
      },
    ],
  },
  {
    // The repo's front page, and the roster with the widest audience. It was
    // already stale when this check landed — four skills against seven — which
    // is the drift the check exists for, sitting in the most visible place.
    file: 'README.md',
    copies: [agentSkillsTable()],
  },
  {
    file: 'bulma-ui/README.md',
    copies: [agentSkillsTable()],
  },
  {
    file: 'bulma-ui/AGENTS.md',
    // This one ships in the npm tarball, so a stale roster here is
    // consumer-facing rather than internal. Fence-aware like every other
    // scope — the #548 deep review named this as the one straggler in the
    // class: a fenced example quoting "Agent skills (…)" before the real
    // parenthetical would steal the match and scope the check to the quote.
    scope: text => {
      const { lines } = splitLines(text);
      const masked = fenceMask(lines);
      // The parenthetical wraps across lines, so match on the joined
      // unmasked text from the first unmasked occurrence.
      const start = lines.findIndex(
        (l, i) => !masked[i] && l.includes('Agent skills (')
      );
      if (start < 0) return null;
      const rest = lines
        .slice(start)
        .filter((_, i) => !masked[start + i])
        .join('\n');
      return rest.match(/Agent skills \(([^)]*)\)/)?.[1] ?? null;
    },
    copies: [
      {
        what: 'the "Agent skills (…)" list',
        // A prose comma list, so it is SPLIT rather than pattern-matched: the
        // first version's regex only recognized a conjunction after a comma,
        // and the non-serial spelling "…, x and y" silently dropped the last
        // TWO names. Conjunctions need surrounding whitespace so a hyphenated
        // name containing "and" can never be split apart.
        names: text =>
          text
            .split(/,|\s+and\s+|\s+or\s+/)
            .map(s => s.trim())
            .filter(s => /^[a-z][a-z0-9-]*$/.test(s)),
        example: n => `${n} (comma-separated, inside the parenthetical)`,
      },
    ],
  },
  {
    file: 'docs/sidebars.js',
    copies: [
      {
        what: 'the skillsSidebar entries',
        names: text =>
          [...text.matchAll(/'skills\/([a-z0-9-]+)'/g)]
            .map(m => m[1])
            .filter(slug => slug !== 'intro'),
        fromToken: slug => `bestax-${slug}`,
        example: n => `'skills/${n.replace(/^bestax-/, '')}',`,
      },
    ],
  },
];

/** The Agent Skills table both READMEs carry, scoped to its own header row. */
function agentSkillsTable() {
  return {
    what: 'the Agent Skills table',
    scope: skillsTableScope(),
    list: /^[ \t]*\|[ \t]*\[?`([a-z][a-z0-9-]*)`/gm,
    example: n => `  | \`${n}\` | Use it when… |`,
  };
}

/**
 * The body of the table whose header row's first cell is "Skill": every row
 * from the separator line to the first non-table line. Anchoring on the header
 * is what keeps a kebab-case first cell in some OTHER table (`bestax-migrate`
 * is also a package name) from standing in for a roster row — in either
 * direction.
 */
function skillsTableScope() {
  return text => {
    const m = text.match(
      /^[ \t]*\|[ \t]*Skill[ \t]*\|.*\n[ \t]*\|[ \t:|-]+\|?[ \t]*\n((?:[ \t]*\|.*(?:\n|$))*)/m
    );
    return m ? m[1] : null;
  };
}

/**
 * The fenced block following a `<!-- marker -->` line.
 *
 * Anchored on an explicit marker rather than on the first fence whose body
 * looks right: content-sniffing is how an example block hijacked the install
 * roster. Fences are walked with `fenceMask`, which parses info strings and
 * ~~~ fences per CommonMark, so a decorated fence earlier in the file cannot
 * frame-shift the pairing. Only blank lines may sit between the marker and
 * its fence — anything else is a moved marker, reported as a missing anchor.
 */
function markerFence(marker) {
  const markerLine = `<!-- ${marker} -->`;
  return text => {
    const { lines } = splitLines(text);
    const mask = fenceMask(lines);
    const at = lines.findIndex((l, i) => !mask[i] && l.trim() === markerLine);
    if (at === -1) return null;

    let open = -1;
    for (let i = at + 1; i < lines.length; i++) {
      if (mask[i]) {
        open = i;
        break;
      }
      if (lines[i].trim() !== '') return null;
    }
    if (open === -1) return null;

    // The closer is matched against the OPENER (same char, at least as long,
    // no info string — CommonMark), not against the fenceMask run: mask marks
    // delimiters and interiors alike, so two fences with no blank line between
    // them form one continuous run and the first version merged them into a
    // single scope, letting tokens from an unrelated adjacent block satisfy or
    // pollute the roster (#550 review).
    const opener = lines[open].match(/^ {0,3}(`{3,}|~{3,})/);
    const char = opener[1][0];
    const len = opener[1].length;
    let close = lines.length;
    for (let i = open + 1; i < lines.length; i++) {
      const m = lines[i].match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
      if (m && m[1][0] === char && m[1].length >= len) {
        close = i;
        break;
      }
    }
    return lines.slice(open + 1, close).join('\n');
  };
}

/**
 * A markdown section by heading, up to the next heading of the same depth or
 * shallower — counting only headings OUTSIDE fenced blocks. The first version
 * matched `^#{1,depth} ` anywhere, so a flush-left `# comment` inside a fenced
 * bash example truncated the scope: everything below the fence silently went
 * unchecked. `fenceMask` is the same guard the release-docs extractors use.
 */
function section(heading) {
  const depth = heading.match(/^#+/)[0].length;
  const endRe = new RegExp(`^#{1,${depth}} `);
  return text => {
    const { lines } = splitLines(text);
    const mask = fenceMask(lines);
    const start = lines.findIndex(
      (l, i) => !mask[i] && l.trimEnd() === heading
    );
    if (start === -1) return null;

    let end = lines.length;
    for (let i = start + 1; i < lines.length; i++) {
      if (!mask[i] && endRe.test(lines[i])) {
        end = i;
        break;
      }
    }
    return lines.slice(start + 1, end).join('\n');
  };
}

// The roster definition itself lives in scripts/lib/skills.mjs, shared with
// both sync scripts and gen-mcp-index.mjs so the four consumers cannot drift.
// Re-exported here because this check and its tests are the historical home.
export { SKILL_DIR_NAME, rosterSkillNames };

export async function readSkillDirs(dir = join(REPO, 'skills')) {
  return libReadSkillDirs(dir);
}

export async function readSkillNames(dir = join(REPO, 'skills')) {
  return libReadSkillNames(dir);
}

/**
 * What is wrong with the directories themselves, before any roster is read.
 * Pure, and separate from the walk, for the same reason rosterViolations is:
 * neither branch fires on the real tree, so only fixtures execute them.
 */
export function skillDirViolations(dirs) {
  const violations = [];
  for (const { name, hasSkillFile } of dirs) {
    if (!hasSkillFile) {
      // A directory that looks like a skill and is not. The old hardcoded list
      // at least failed on a name it could not resolve; discovery just skips
      // it, which would be the same silent omission in a new place.
      violations.push(
        `skills/${name}/: has no SKILL.md, so nothing bundles it and no roster ` +
          `is required to name it. Add SKILL.md, or remove the directory.`
      );
    } else if (!SKILL_DIR_NAME.test(name)) {
      violations.push(
        `skills/${name}/: skill directories must be kebab-case ` +
          `(a-z, 0-9, single hyphens). Every roster pattern captures that ` +
          `shape, so this name cannot be expressed in one, and the check could ` +
          `not be satisfied by editing prose.`
      );
    }
  }
  return violations;
}

/**
 * Split from the filesystem walk so the branches below can be driven with
 * fixtures. Every roster agrees today, so without that seam none of them ever
 * executes and inverting the rule would leave CI green — the same reason
 * manifestViolations is shaped this way.
 */
export function rosterViolations(skills, sources) {
  const violations = [];
  const known = new Set(skills);

  for (const roster of SKILL_ROSTERS) {
    const text = sources?.[roster.file];
    if (typeof text !== 'string') {
      violations.push(
        `${roster.file}: could not be read, so its skill roster went ` +
          `unchecked. If the file moved, update SKILL_ROSTERS in ` +
          `scripts/check-conformance.mjs.`
      );
      continue;
    }

    for (const copy of roster.copies) {
      // A copy may narrow further than its file does: skills/README.md carries
      // three rosters and only one of them is a fenced install block.
      const scope = copy.scope ?? roster.scope;
      const scoped = scope ? scope(text) : text;
      if (scoped == null) {
        violations.push(
          `${roster.file}: ${copy.what} — the block this check anchors on is ` +
            `gone, so it went unchecked. Restore it, or update SKILL_ROSTERS ` +
            `in scripts/check-conformance.mjs.`
        );
        continue;
      }

      // A copy either captures tokens with a regex or parses them with a
      // `names` function (the AGENTS.md comma list); `fromToken` maps slugs
      // back to directory names for the docs-site copies.
      const tokens = copy.names
        ? copy.names(scoped)
        : [...scoped.matchAll(copy.list)].map(m => m[1]);
      const seq = copy.fromToken ? tokens.map(copy.fromToken) : tokens;
      const listed = new Set(seq);

      const missing = skills.filter(name => !listed.has(name));
      if (missing.length) {
        violations.push(
          `${roster.file}: ${copy.what} does not name ${missing.join(', ')}. ` +
            `Add one entry per skill, e.g. ${copy.example(missing[0])}`
        );
      }

      // The other direction, which nothing else covers: sync-skills.mjs stops
      // copying a deleted skill without a word, leaving every prose copy
      // advertising something users cannot install.
      const stale = [...listed].filter(name => !known.has(name)).sort();
      if (stale.length) {
        violations.push(
          `${roster.file}: ${copy.what} still names ${stale.join(', ')}, ` +
            `which is not a directory with a SKILL.md under skills/. Drop the ` +
            `entry, or restore the skill.`
        );
      }
    }
  }

  return violations;
}

/**
 * The per-skill docs pages, keyed by slug (directory name minus `bestax-`) —
 * the same transform gen-mcp-index.mjs ships as `promptName`. Pure, like
 * rosterViolations, so the branches can be driven with fixtures.
 */
export function skillsPageViolations(skills, pageFiles) {
  if (!Array.isArray(pageFiles)) {
    return [
      'docs/docs/skills/: could not be read, so the per-skill docs pages ' +
        'went unchecked.',
    ];
  }
  const violations = [];
  const slugs = new Set(
    pageFiles
      .filter(f => /\.(md|mdx)$/.test(f))
      .map(f => f.replace(/\.(md|mdx)$/, ''))
  );
  for (const name of skills) {
    const slug = name.replace(/^bestax-/, '');
    if (!slugs.has(slug)) {
      violations.push(
        `docs/docs/skills/${slug}.mdx: missing — every skill has a docs page ` +
          `named by its slug (directory name minus "bestax-"). Add the page, ` +
          `its docs/sidebars.js entry, and its intro bullet.`
      );
    }
  }
  const knownSlugs = new Set(skills.map(n => n.replace(/^bestax-/, '')));
  for (const slug of slugs) {
    if (slug === 'intro' || knownSlugs.has(slug)) continue;
    violations.push(
      `docs/docs/skills/${slug}: no skill directory maps to this page ` +
        `(directory name minus "bestax-"). Remove the page, or restore the ` +
        `skill.`
    );
  }
  return violations;
}

/**
 * Frontmatter `name:` must equal the directory name. Every prose roster and
 * install line is held to the DIRECTORY name, while gen-mcp-index.mjs keys the
 * shipped MCP manifest off the FRONTMATTER (`fm.name || name`, and promptName
 * derives from it) — with no gate, one edit ships two disagreeing rosters
 * while everything stays green.
 */
export function frontmatterNameViolations(entries) {
  const violations = [];
  for (const { name, fmName } of entries) {
    if (fmName && fmName !== name) {
      violations.push(
        `skills/${name}/SKILL.md: frontmatter says "name: ${fmName}" but the ` +
          `directory is ${name}. The rosters follow the directory and the MCP ` +
          `manifest follows the frontmatter, so a mismatch ships two ` +
          `disagreeing rosters. Rename one to match the other.`
      );
    }
  }
  return violations;
}

function skillFrontmatterName(text) {
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return null;
  return fm[1].match(/^name:\s*['"]?([^'"\r\n]+?)['"]?\s*$/m)?.[1] ?? null;
}

async function checkSkillsRoster() {
  const skillsDir = join(REPO, 'skills');

  // Guarded rather than left to throw: readdir on a missing directory rejects,
  // and an unhandled rejection here takes down every remaining check in the
  // run instead of reporting this one. sync-skills.mjs guards the same way.
  let dirs;
  try {
    dirs = await readSkillDirs(skillsDir);
  } catch {
    return [
      `skills/: could not be read (${skillsDir}), so every roster this check ` +
        `compares against went unchecked.`,
    ];
  }

  const violations = skillDirViolations(dirs);
  // Only names a roster could actually express take part in the comparison.
  // An unexpressible one already has its own violation above, and asking nine
  // prose rosters to name something they cannot spell would bury it. The same
  // derivation the tests use — rosterSkillNames — so the two cannot diverge.
  const skills = rosterSkillNames(dirs);
  // Fail rather than pass vacuously: an empty roster would make every
  // comparison below trivially satisfied.
  if (!skills.length) {
    violations.push(
      'skills/: no directory with a SKILL.md was found, so every roster ' +
        'this check compares against went unchecked.'
    );
    return violations;
  }

  const fmEntries = [];
  for (const name of skills) {
    try {
      fmEntries.push({
        name,
        fmName: skillFrontmatterName(
          await readFile(join(skillsDir, name, 'SKILL.md'), 'utf8')
        ),
      });
    } catch {
      // The dir listing said SKILL.md exists; a read race is not this
      // check's problem.
    }
  }
  violations.push(...frontmatterNameViolations(fmEntries));

  let pageFiles = null;
  try {
    pageFiles = await readdir(join(REPO, 'docs', 'docs', 'skills'));
  } catch {
    // Reported by skillsPageViolations rather than skipped.
  }
  violations.push(...skillsPageViolations(skills, pageFiles));

  // The three install blocks are GENERATED (gen-skills-rosters.mjs) between
  // bestax:generated markers; freshness is enforced by recomputing the region
  // from the same roster the generator reads and diffing — a stale or missing
  // region fails conformance without a separate gen:check step. Compared on
  // the BUNDLED name set (every dir with a SKILL.md), matching the generator,
  // not the prose-expressible subset the copies above are held to.
  const bundled = dirs.filter(d => d.hasSkillFile).map(d => d.name);
  for (const { file, fence } of SKILLS_INSTALL_TARGETS) {
    let text;
    try {
      text = await readFile(join(REPO, file), 'utf8');
    } catch {
      violations.push(
        `${file}: could not be read, so its generated install roster went ` +
          `unchecked.`
      );
      continue;
    }
    const region = readRegions(text, file).get(SKILLS_INSTALL_REGION);
    if (!region) {
      violations.push(
        `${file}: no \`<!-- bestax:generated ${SKILLS_INSTALL_REGION} -->\` ` +
          `marker pair, so the generated install roster went unchecked. ` +
          `Restore the markers and run pnpm gen:skills.`
      );
      continue;
    }
    if (region.body !== renderInstallBlock(bundled, fence)) {
      violations.push(
        `${file}: the generated install roster is stale. Run pnpm gen:skills.`
      );
    }
  }

  const sources = {};
  for (const { file } of SKILL_ROSTERS) {
    try {
      sources[file] = await readFile(join(REPO, file), 'utf8');
    } catch {
      // Left undefined on purpose; rosterViolations reports the unreadable
      // file rather than skipping it.
    }
  }

  return [...violations, ...rosterViolations(skills, sources)];
}

// ---------------------------------------------------------------------------
// Telemetry: two standalone CLIs cannot share a package, so the kernel is
// copied. The worker allowlists are the privacy backstop — a new template
// that isn't listed there is silently dropped.
// ---------------------------------------------------------------------------

const TELEMETRY_CORE_CANONICAL = 'create-bestax/src/telemetry-core.ts';
const TELEMETRY_CORE_COPY = 'bestax-migrate/src/telemetry-core.ts';

async function checkTelemetryCore() {
  const violations = [];
  let canonical;
  let copy;
  try {
    canonical = await readFile(join(REPO, TELEMETRY_CORE_CANONICAL), 'utf8');
  } catch {
    return [
      `${TELEMETRY_CORE_CANONICAL} is missing (canonical telemetry kernel).`,
    ];
  }
  try {
    copy = await readFile(join(REPO, TELEMETRY_CORE_COPY), 'utf8');
  } catch {
    return [
      `${TELEMETRY_CORE_COPY} is missing. Copy ${TELEMETRY_CORE_CANONICAL} ` +
        `over it so the two CLI kernels stay in lockstep.`,
    ];
  }
  if (canonical !== copy) {
    violations.push(
      `${TELEMETRY_CORE_COPY} differs from ${TELEMETRY_CORE_CANONICAL} ` +
        `(canonical). Copy ${TELEMETRY_CORE_CANONICAL} over ${TELEMETRY_CORE_COPY} ` +
        `so the two CLI kernels stay in lockstep — they cannot share a package ` +
        `(published standalone).`
    );
  }
  return violations;
}

function quotedStringsIn(block) {
  return [...block.matchAll(/'([^']+)'/g)].map(m => m[1]);
}

export function constStringArray(src, name) {
  const m = src.match(
    new RegExp(`const ${name} = \\[([\\s\\S]*?)\\] as const`)
  );
  return m ? quotedStringsIn(m[1]) : null;
}

/**
 * Import a CLI module and pick the producer values out of it. Importing beats
 * regex-scraping wherever the module is a leaf (#550 review: a scrape that
 * stops matching a reshaped declaration silently narrows the comparison — an
 * import either yields the real array or fails loudly as null here).
 * constants.ts and package-manager.ts import nothing but chalk, so pulling
 * them into a conformance run is cheap; node's type stripping loads the .ts
 * directly.
 */
async function importProducer(relPath, pick) {
  try {
    const mod = await import(pathToFileURL(join(REPO, relPath)).href);
    return pick(mod);
  } catch {
    return null;
  }
}

// bestax-migrate/src/cli.ts stays regex-scraped: importing it would drag the
// whole transform chain (jscodeshift included) into every conformance run.
// The scrape fails loudly as null when the declaration stops matching.
export function cssModes(src) {
  const m = src.match(/const CSS_MODES: CssMode\[\] = \[([\s\S]*?)\];/);
  return m ? quotedStringsIn(m[1]) : null;
}

/**
 * Every source's registry name, plus the directories whose index.ts exists
 * but did not yield one — a non-matching declaration must be REPORTED, not
 * skipped (#550 review): a silently-dropped source would leave its enum
 * unchecked against the worker, and its production events would 400 at
 * ingest with every gate green.
 */
export async function migrateSourceNames(
  dir = join(REPO, 'bestax-migrate/src/sources')
) {
  const names = [];
  const unparsed = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    let src;
    try {
      src = await readFile(join(dir, entry.name, 'index.ts'), 'utf8');
    } catch {
      continue; // a directory without an index.ts is not a source
    }
    const m = src.match(/: MigrationSource = \{[\s\S]*?name: '([^']+)'/);
    if (m) names.push(m[1]);
    else unparsed.push(entry.name);
  }
  return { names, unparsed };
}

export function missingFromWorker(label, producer, worker, workerFile) {
  if (producer === null) {
    return [`could not parse producer values for ${label}`];
  }
  if (worker === null) {
    return [
      `could not parse ${label} from ${workerFile} — the worker schema ` +
        `array is missing or malformed.`,
    ];
  }
  const missing = producer.filter(value => !worker.includes(value));
  return missing.map(
    value =>
      `${label} value '${value}' is used by a CLI but missing from ` +
      `${workerFile} — add it there first or its events are silently dropped.`
  );
}

export async function checkTelemetryAllowlists() {
  const workerFile = 'telemetry-worker/src/schema.ts';
  const constantsFile = 'create-bestax/src/constants.ts';
  const cliFile = 'bestax-migrate/src/cli.ts';
  const [schema, cli] = await Promise.all([
    readFile(join(REPO, workerFile), 'utf8'),
    readFile(join(REPO, cliFile), 'utf8'),
  ]);
  const [templates, flavors, icons, pms] = await Promise.all([
    importProducer(constantsFile, m => m.TEMPLATES.map(t => t.name)),
    importProducer(constantsFile, m => m.BULMA_FLAVORS.map(f => f.name)),
    importProducer(constantsFile, m => m.ICON_LIBRARIES.map(i => i.name)),
    importProducer('create-bestax/src/package-manager.ts', m => [
      ...m.KNOWN_PACKAGE_MANAGERS,
    ]),
  ]);
  const sources = await migrateSourceNames();
  const violations = [];
  if (!sources.names.length) {
    violations.push(
      'bestax-migrate/src/sources/*/index.ts: no MigrationSource `name` was ' +
        'found, so the worker allowlist went unchecked.'
    );
  }
  for (const dir of sources.unparsed) {
    violations.push(
      `bestax-migrate/src/sources/${dir}/index.ts: has an index.ts but no ` +
        `parseable \`: MigrationSource = { name: '…' }\` declaration, so its ` +
        `enum would silently skip the worker comparison and its production ` +
        `events would be dropped at ingest. Match the shape, or update ` +
        `migrateSourceNames in scripts/check-conformance.mjs.`
    );
  }
  violations.push(
    ...missingFromWorker(
      'template',
      templates,
      constStringArray(schema, 'TEMPLATE_VALUES'),
      workerFile
    ),
    ...missingFromWorker(
      'bulmaFlavor',
      flavors,
      constStringArray(schema, 'BULMA_FLAVOR_VALUES'),
      workerFile
    ),
    ...missingFromWorker(
      'iconLibrary',
      icons,
      constStringArray(schema, 'ICON_LIBRARY_VALUES'),
      workerFile
    ),
    ...missingFromWorker(
      'packageManager',
      pms,
      constStringArray(schema, 'PACKAGE_MANAGER_VALUES'),
      workerFile
    ),
    ...missingFromWorker(
      'migrate source',
      sources.names,
      constStringArray(schema, 'MIGRATE_SOURCE_VALUES'),
      workerFile
    ),
    ...missingFromWorker(
      'cssMode',
      cssModes(cli),
      constStringArray(schema, 'CSS_MODE_VALUES'),
      workerFile
    )
  );
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
  'skills-roster': checkSkillsRoster,
  'style-mapping-sync': checkStyleMappingSync,
  'near-miss-sync': checkNearMissSync,
  'release-docs-sync': checkReleaseDocsSync,
  'story-per-component': checkStoryPerComponent,
  'compound-family': checkCompoundFamily,
  'autodocs-tag': checkAutodocsTag,
  'publishable-manifests': checkPublishableManifests,
  'bypass-expiry': checkBypassExpiry,
  'telemetry-core': checkTelemetryCore,
  'telemetry-allowlists': checkTelemetryAllowlists,
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
