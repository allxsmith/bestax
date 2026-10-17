/**
 * What a project under `templates/` has to be.
 *
 * Each `templates/<slug>/` is a free Bulma template rebuilt as a create-bestax
 * `vite-ts` project (#1118). StackBlitz imports the folder on its own, straight
 * from GitHub, so it has to install and build with nothing else from this
 * repo. And it is someone else's work, so it has to carry their notice.
 * templates/CLAUDE.md is the pipeline a port goes through. This module is what
 * a finished one is held to, run by scripts/templates.test.mjs in
 * `pnpm test:scripts`:
 *
 * - the project files a scaffold has (REQUIRED_FILES and REQUIRED_DIRS), and
 *   a kebab-case folder name, since the slug is part of every link to it;
 * - `"private": true`, and a registry range for every dependency. StackBlitz
 *   installs this folder alone, so `workspace:`, `link:`, `file:` and
 *   `catalog:` point at nothing there, and neither does a git or path
 *   specifier;
 * - no `bulma` in any dependency section, since bestax's stylesheet carries it;
 * - `@allxsmith/bestax-bulma` in `dependencies`, at a range the library's
 *   current version satisfies, so a major release fails here until the
 *   templates move with it;
 * - none of the scaffold's ESLint setup. The docs sandbox builder strips the
 *   same packages so StackBlitz installs quickly, and ESLint reads the config
 *   nearest each file, so a template's own config would replace
 *   templates/eslint.config.js, the one the root lint holds it to;
 * - no `TODO(bestax-migrate)` left in `src/`;
 * - a LICENSE that keeps the upstream copyright line, ahead of the port's;
 * - a README naming the upstream repo and the commit it was ported from;
 * - a docs data entry, a screenshot, and a line in NOTICE's Templates section.
 *
 * And the other way round: every data entry, screenshot and NOTICE line names
 * a folder that exists.
 *
 * The docs data belongs to the Templates page (#1120): DATA_FILE, whose
 * `templates` export holds one entry per template. This reads `slug`, `source`
 * and `sourceSha` from each entry, and holds the README and the NOTICE line to
 * the last two, so each upstream is written down in one place. The rest of the
 * schema is #1120's to check. The file is loaded the way
 * docs/scripts/snapshot-comparison.mjs loads the comparison matrix, as a
 * `data:` URL, so it has to import nothing. Until #1120 lands it does not
 * exist, which passes while there are no templates and fails, naming the file,
 * once there is one.
 *
 * A template's `src/` is type-checked in skill-examples-typecheck.test.mjs and
 * linted by the root `pnpm lint` through templates/eslint.config.js.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEP_SECTIONS, packTimeProtocol } from './pack-time-protocols.mjs';

const REPO = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

// The root declares no semver of its own; create-bestax depends on it.
const semver = createRequire(join(REPO, 'create-bestax', 'package.json'))(
  'semver'
);

export const TEMPLATES_DIR = 'templates';
export const DATA_FILE = 'docs/src/data/templates.js';
export const DATA_EXPORT = 'templates';
export const SCREENSHOTS_DIR = 'docs/static/img/templates';
export const SCREENSHOT_EXT = '.jpg';
export const NOTICE_FILE = 'NOTICE';
export const NOTICE_HEADING = 'Templates';
export const LIBRARY = '@allxsmith/bestax-bulma';
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * The files every template has. The scaffold's, with `src/App.tsx` named
 * because the Templates page opens StackBlitz on it, plus the attribution.
 * Only the root tsconfig.json is listed: the type-check follows its
 * references to the project that compiles `src/`, and fails when none does,
 * so a template keeps passing when create-bestax changes how it splits its
 * tsconfigs.
 */
export const REQUIRED_FILES = [
  'package.json',
  'index.html',
  'tsconfig.json',
  'vite.config.ts',
  'src/main.tsx',
  'src/App.tsx',
  'src/index.css',
  'LICENSE',
  'README.md',
];
export const REQUIRED_DIRS = ['public'];

/** Every name ESLint's flat config lookup reads. */
const ESLINT_CONFIG = /^eslint\.config\.[cm]?[jt]s$/;

/**
 * The packages the docs sandbox builder drops from the template it copies
 * (`stackblitzProject` in docs/src/theme/CodeBlock/sandbox/projects.mjs).
 */
const isLintPackage = name => name.includes('eslint') || name === 'globals';

const TODO = 'TODO(bestax-migrate)';
const SOURCE = /\.[cm]?[jt]sx?$/;

/** A copyright line: `Copyright (c) 2024 Name`, `(c) Name` or `© Name`. */
const COPYRIGHT = /^\s*(?:copyright\b|\(c\)|©)/i;

/** Output and installs a porter may leave behind; never part of a template. */
const SKIP_DIRS = new Set(['node_modules', 'dist']);

const isFile = path => existsSync(path) && statSync(path).isFile();
const isDir = path => existsSync(path) && statSync(path).isDirectory();
const readIfFile = path => (isFile(path) ? readFileSync(path, 'utf8') : null);

/** Every file under `dir`, as paths relative to it, in a stable order. */
function filesUnder(dir, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        out.push(...filesUnder(join(dir, entry.name), rel));
      }
    } else {
      out.push(rel);
    }
  }
  return out.sort();
}

/**
 * The template slugs: every directory directly under `templates/` whose name
 * does not start with a dot. Files there (this folder's own CLAUDE.md and
 * eslint.config.js) are not templates. Empty when `templates/` is absent.
 */
export function templateSlugs(root = REPO) {
  const dir = join(root, TEMPLATES_DIR);
  if (!isDir(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .map(entry => entry.name)
    .sort();
}

/**
 * The docs data's entries, or null when DATA_FILE does not exist. A file that
 * exists but cannot be read as a module with a `templates` array throws, so a
 * renamed export cannot pass as a list with nothing in it.
 */
export async function readTemplateData(root = REPO) {
  const source = readIfFile(join(root, DATA_FILE));
  if (source === null) return null;
  let module;
  try {
    module = await import(
      `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
    );
  } catch (error) {
    throw new Error(
      `${DATA_FILE} could not be loaded on its own: ${error.message}. ` +
        'scripts/lib/templates.mjs reads it as a data: URL, so it has to ' +
        'import nothing.',
      { cause: error }
    );
  }
  const list = module[DATA_EXPORT];
  if (!Array.isArray(list)) {
    throw new Error(
      `${DATA_FILE} has no \`${DATA_EXPORT}\` array export, which is the ` +
        'list of templates scripts/lib/templates.mjs reads.'
    );
  }
  return list;
}

/** The copyright lines in a license, with their line index. */
function copyrightLines(text) {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => COPYRIGHT.test(line));
}

/**
 * The holder a license's first copyright line names, with the `Copyright`,
 * `(c)` and years taken off: `Copyright (c) 2025 Alex Smith` is `Alex Smith`.
 * The root LICENSE's is the port's holder, so a template's LICENSE tells its
 * upstream notice from the port's by it.
 */
export function copyrightHolder(license) {
  const [first] = copyrightLines(license);
  const holder = first?.line
    .replace(/^copyright\b/i, '')
    .replace(/\(c\)|©/gi, '')
    .replace(/\b\d{4}(?:\s*[-,]\s*\d{4})*\b/g, '')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '');
  if (!holder) {
    throw new Error('the license has no copyright line naming a holder');
  }
  return holder;
}

/**
 * The lines in NOTICE's Templates section, by the slug each opens with
 * (`templates/<slug> is a port of ...`), or null when NOTICE has no such
 * section. The section runs from its heading, a line of its own, to the end
 * of the file.
 */
export function noticeLines(notice) {
  const lines = notice.split(/\r?\n/);
  const start = lines.findIndex(line => line.trim() === NOTICE_HEADING);
  if (start === -1) return null;
  const out = new Map();
  for (const line of lines.slice(start + 1)) {
    const m = /^templates\/([^\s/]+)\s/.exec(line);
    if (m) out.set(m[1], line);
  }
  return out;
}

/** What is wrong with a template's package.json. */
function manifestProblems(dir, rel, libraryVersion) {
  const text = readIfFile(join(dir, 'package.json'));
  // A missing manifest is reported with the other required files.
  if (text === null) return [];
  const file = `${rel}/package.json`;
  let pkg;
  try {
    pkg = JSON.parse(text);
  } catch (error) {
    return [`${file} could not be read as JSON: ${error.message}.`];
  }
  const problems = [];
  if (pkg.private !== true) {
    problems.push(
      `${file} is not \`"private": true\`. A template is an app to start ` +
        'from, never a package to publish.'
    );
  }
  for (const section of DEP_SECTIONS) {
    for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
      if (typeof spec !== 'string' || semver.validRange(spec) === null) {
        const protocol = packTimeProtocol(spec);
        problems.push(
          `${file} gives ${name} ${JSON.stringify(spec)} in ${section}, ` +
            'which is not a registry range. ' +
            (protocol
              ? `\`${protocol}\` only means something inside this workspace, and `
              : '') +
            'StackBlitz installs this folder on its own, from the registry.'
        );
      }
      if (name === 'bulma') {
        problems.push(
          `${file} has bulma in ${section}. bestax's stylesheet carries ` +
            'Bulma, so a finished port drops it.'
        );
      }
      if (isLintPackage(name)) {
        problems.push(
          `${file} has ${name} in ${section}. A template carries none of the ` +
            "scaffold's ESLint setup: the repo lints it with " +
            'templates/eslint.config.js, and StackBlitz installs quicker ' +
            'without it.'
        );
      }
    }
  }
  if (pkg.scripts?.lint !== undefined) {
    problems.push(
      `${file} has a lint script. A template carries none of the ` +
        "scaffold's ESLint setup, so drop it with the ESLint packages."
    );
  }
  const spec = pkg.dependencies?.[LIBRARY];
  if (spec === undefined) {
    problems.push(`${file} has no ${LIBRARY} in dependencies.`);
  } else if (
    typeof spec === 'string' &&
    semver.validRange(spec) !== null &&
    !semver.satisfies(libraryVersion, spec)
  ) {
    problems.push(
      `${file} gives ${LIBRARY} ${JSON.stringify(spec)}, which the ` +
        `library's current version, ${libraryVersion}, does not satisfy. ` +
        `Move it to "^${libraryVersion}" and check the template still builds.`
    );
  }
  return problems;
}

/** An ESLint config anywhere in a template, and a TODO left in its source. */
function treeFileProblems(dir, rel) {
  const problems = [];
  for (const path of filesUnder(dir)) {
    const name = path.split('/').pop();
    if (ESLINT_CONFIG.test(name)) {
      problems.push(
        `${rel}/${path} would replace templates/eslint.config.js for the ` +
          'files beside and below it, since ESLint reads the config nearest ' +
          "each file. A template carries none of the scaffold's ESLint setup."
      );
    }
    if (
      path.startsWith('src/') &&
      SOURCE.test(name) &&
      readFileSync(join(dir, path), 'utf8').includes(TODO)
    ) {
      problems.push(
        `${rel}/${path} still has a ${TODO}. Resolve every one with the ` +
          'skills and the MCP server, as templates/CLAUDE.md says.'
      );
    }
  }
  return problems;
}

/** What is wrong with a template's LICENSE, given the port's holder. */
function licenseProblems(dir, rel, holder) {
  const text = readIfFile(join(dir, 'LICENSE'));
  if (text === null) return [];
  const lines = copyrightLines(text);
  const upstream = lines.find(({ line }) => !line.includes(holder));
  const port = lines.find(({ line }) => line.includes(holder));
  const problems = [];
  if (!upstream) {
    problems.push(
      `${rel}/LICENSE has no upstream copyright line. It starts with the ` +
        "original's MIT notice, verbatim."
    );
  }
  if (!port) {
    problems.push(
      `${rel}/LICENSE has no notice for the bestax port, a copyright line ` +
        `naming ${holder} after the upstream notice.`
    );
  }
  if (upstream && port && port.index < upstream.index) {
    problems.push(
      `${rel}/LICENSE puts the port's notice first. The upstream notice ` +
        "comes first, verbatim, followed by the port's."
    );
  }
  return problems;
}

/** The data entry, README, screenshot and NOTICE line for one template. */
function attributionProblems(root, dir, slug, rel, { entries, notice }) {
  const problems = [];
  const entry = entries?.find(e => e?.slug === slug);
  if (entries === null) {
    problems.push(
      `${DATA_FILE} does not exist, so ${rel} has no entry on the Templates ` +
        'page. The page adds that file (#1120).'
    );
  } else if (!entry) {
    problems.push(
      `${DATA_FILE} has no entry with slug "${slug}", so the Templates page ` +
        `has no card for ${rel}.`
    );
  }

  // Where the upstream is written down; the README and NOTICE must agree.
  const upstream = {};
  for (const field of entry ? ['source', 'sourceSha'] : []) {
    if (typeof entry[field] === 'string' && entry[field].trim()) {
      upstream[field] = entry[field];
    } else {
      problems.push(
        `${DATA_FILE}'s entry for "${slug}" has no ${field}, so ${rel}'s ` +
          'README and NOTICE line cannot be held to its upstream.'
      );
    }
  }
  const readme = readIfFile(join(dir, 'README.md'));
  if (readme !== null && upstream.source && !readme.includes(upstream.source)) {
    problems.push(
      `${rel}/README.md does not name the upstream repo, ${upstream.source}.`
    );
  }
  if (
    readme !== null &&
    upstream.sourceSha &&
    !readme.includes(upstream.sourceSha)
  ) {
    problems.push(
      `${rel}/README.md does not name the commit it was ported from, ` +
        `${upstream.sourceSha}.`
    );
  }

  const screenshot = `${SCREENSHOTS_DIR}/${slug}${SCREENSHOT_EXT}`;
  if (!isFile(join(root, screenshot))) {
    problems.push(
      `${screenshot} does not exist, so ${rel}'s card has no image.`
    );
  }

  // A NOTICE with no Templates section is reported once, for the tree.
  const line = notice?.get(slug);
  if (notice && !line) {
    problems.push(
      `${NOTICE_FILE}'s ${NOTICE_HEADING} section has no line for ${rel}.`
    );
  } else if (line && upstream.source && !line.includes(upstream.source)) {
    problems.push(
      `${NOTICE_FILE}'s line for ${rel} does not link its upstream repo, ` +
        `${upstream.source}.`
    );
  }
  return problems;
}

/** Everything wrong with one template folder. */
export function templateProblems(root, slug, context) {
  const dir = join(root, TEMPLATES_DIR, slug);
  const rel = `${TEMPLATES_DIR}/${slug}`;
  const problems = [];
  if (!SLUG.test(slug)) {
    problems.push(
      `${rel} is not a kebab-case slug (lowercase letters, digits and ` +
        'hyphens), and the slug is part of every link to the template.'
    );
  }
  for (const file of REQUIRED_FILES) {
    if (!isFile(join(dir, file))) problems.push(`${rel} has no ${file}.`);
  }
  for (const sub of REQUIRED_DIRS) {
    if (!isDir(join(dir, sub))) problems.push(`${rel} has no ${sub}/ folder.`);
  }
  return [
    ...problems,
    ...manifestProblems(dir, rel, context.libraryVersion),
    ...treeFileProblems(dir, rel),
    ...licenseProblems(dir, rel, context.holder),
    ...attributionProblems(root, dir, slug, rel, context),
  ];
}

/**
 * What is wrong across the tree: a NOTICE without its Templates section, and
 * a data entry, screenshot or NOTICE line naming a folder that does not exist.
 */
export function treeProblems(root, slugs, { entries, notice }) {
  const have = new Set(slugs);
  const problems = [];
  if (notice === null) {
    problems.push(
      `${NOTICE_FILE} has no "${NOTICE_HEADING}" section, the heading every ` +
        "template's line goes under."
    );
  }
  for (const slug of notice?.keys() ?? []) {
    if (!have.has(slug)) {
      problems.push(
        `${NOTICE_FILE} has a line for ${TEMPLATES_DIR}/${slug}, which does ` +
          'not exist.'
      );
    }
  }
  const seen = new Set();
  for (const [index, entry] of (entries ?? []).entries()) {
    const slug = entry?.slug;
    if (typeof slug !== 'string') {
      problems.push(`${DATA_FILE}'s entry at index ${index} has no slug.`);
      continue;
    }
    if (seen.has(slug)) {
      problems.push(`${DATA_FILE} has more than one entry for "${slug}".`);
    }
    seen.add(slug);
    if (!have.has(slug)) {
      problems.push(
        `${DATA_FILE} has an entry for ${TEMPLATES_DIR}/${slug}, which does ` +
          'not exist.'
      );
    }
  }
  const shots = join(root, SCREENSHOTS_DIR);
  for (const name of isDir(shots) ? readdirSync(shots).sort() : []) {
    if (!name.endsWith(SCREENSHOT_EXT)) continue;
    if (!have.has(name.slice(0, -SCREENSHOT_EXT.length))) {
      problems.push(
        `${SCREENSHOTS_DIR}/${name} belongs to no folder in ${TEMPLATES_DIR}/.`
      );
    }
  }
  return problems;
}

/**
 * Every template under `root`, each with its problems, and the problems
 * across the tree. `libraryVersion` defaults to bulma-ui's, and `holder`, the
 * port's copyright holder, to the one the root LICENSE names.
 */
export async function checkTemplates(root = REPO, options = {}) {
  const libraryVersion =
    options.libraryVersion ??
    JSON.parse(readFileSync(join(root, 'bulma-ui', 'package.json'), 'utf8'))
      .version;
  const holder =
    options.holder ??
    copyrightHolder(readFileSync(join(root, 'LICENSE'), 'utf8'));
  const slugs = templateSlugs(root);
  const noticeText = readIfFile(join(root, NOTICE_FILE));
  const context = {
    libraryVersion,
    holder,
    entries: await readTemplateData(root),
    notice: noticeText === null ? null : noticeLines(noticeText),
  };
  return {
    slugs,
    templates: Object.fromEntries(
      slugs.map(slug => [slug, templateProblems(root, slug, context)])
    ),
    tree: treeProblems(root, slugs, context),
  };
}
