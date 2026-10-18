/**
 * The checks that keep each ported template honest (#1121), and the schema of
 * the docs Templates page's data (#1120).
 *
 * A template is a Bulma template from aldi's awesome-bulma-templates rebuilt
 * as a create-bestax vite-ts project in `templates/<slug>/`, which StackBlitz
 * opens on its own, from the mirror scripts/gen-templates-repo.mjs writes
 * (templates/CLAUDE.md is the porting guide).
 * The docs page lists each one from `docs/src/data/templates.js`, with a
 * screenshot at `docs/static/img/templates/<slug>.jpg`. So a template is
 * three things that have to agree: a folder, an entry, and a screenshot.
 *
 * Every path is derived from the `root` passed in, so
 * scripts/templates.test.mjs runs the same checks over a fixture tree and
 * over the repo. With no template anywhere the repo passes, having nothing to
 * hold.
 *
 * A template is what git tracks under its folder, the same listing
 * scripts/gen-templates-repo.mjs publishes (`templatePaths`), so the two
 * agree on what a template holds: an untracked file, such as a local
 * install's lockfile or an image not yet added, is neither checked here nor
 * published there. `root` must therefore be a git checkout.
 */
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { join } from 'node:path';
import { isLintPackage } from '../../docs/src/theme/CodeBlock/sandbox/projects.mjs';
import { compareVersions } from './version-regression.mjs';
import { DEP_SECTIONS } from './pack-time-protocols.mjs';
import { byCodePoint, trackedRepoPaths } from './skills.mjs';

export const LIBRARY = '@allxsmith/bestax-bulma';

/**
 * What a template folder holds: the project create-bestax scaffolds, less
 * its lint setup, plus the upstream's notice and a README crediting it.
 * `public/` holds the upstream's images and the favicon index.html names.
 */
export const REQUIRED_FILES = [
  'LICENSE',
  'README.md',
  'index.html',
  'package.json',
  'public/',
  'src/App.tsx',
  'src/main.tsx',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
];

/** Whoever opens a template installs it, from its registry ranges alone. */
export const LOCKFILES = [
  'bun.lock',
  'bun.lockb',
  'npm-shrinkwrap.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
];

/**
 * `dev` is what the README tells a reader to run; `build` and `preview` are
 * what docs/scripts/screenshot-template.mjs runs.
 */
export const REQUIRED_SCRIPTS = ['dev', 'build', 'preview'];

/**
 * The package each command a template's scripts may run comes from. A script
 * that runs a command not listed here is refused until it is added, so a new
 * tool cannot ship without its package declared.
 */
export const SCRIPT_BINARIES = { vite: 'vite', tsc: 'typescript' };

/** Where a template's code imports packages from: its sources and its Vite config. */
const SOURCE_FILE = /\.(?:[cm]?[jt]sx?)$/;

/**
 * Upstream licenses a port can keep: permissive ones whose notice the
 * template's LICENSE carries beside the notice for the port. Anything else
 * fails until someone has read what it asks of a port and added it here.
 */
export const LICENSES = [
  'MIT',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'Apache-2.0',
];

/** The fields of an entry in docs/src/data/templates.js. */
export const ENTRY_FIELDS = [
  'slug',
  'title',
  'description',
  'author',
  'source',
  'sourceSha',
  'demo',
  'license',
  'copyright',
  'tags',
];

/**
 * The page backgrounds a tag's color swatch sits on: Infima's light
 * background, and its dark background and surface. A swatch is the only
 * place a tag's color shows, so it needs the 3:1 contrast WCAG asks of a
 * graphic against each.
 */
export const TAG_BACKGROUNDS = ['#ffffff', '#1b1b1d', '#242526'];
const SWATCH_CONTRAST = 3;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA = /^[0-9a-f]{40}$/;
const HEX = /^#[0-9a-f]{6}$/;

const nonEmpty = value => typeof value === 'string' && value.trim() !== '';
const isObject = value =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** An absolute https URL. */
export function isHttpsUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname !== '';
  } catch {
    return false;
  }
}

/**
 * A specifier npm resolves from the registry: a range or a dist-tag. Any
 * protocol (`workspace:`, `catalog:`, `link:`, `file:`, `npm:`, `git+…`) has
 * a colon and any path or GitHub shorthand a slash, and none of those
 * resolves for a folder opened on its own.
 */
export const isRegistrySpecifier = spec =>
  nonEmpty(spec) && !spec.includes(':') && !spec.includes('/');

/**
 * Why a template's bestax range would not install a working release, given
 * `current`, bulma-ui's version in this checkout, or null when it would.
 *
 * The range is a caret range, and what StackBlitz needs is that npm finds a
 * published release in it. So its floor must not be newer than `current`,
 * which would ask for a release that does not exist yet. A floor one major
 * behind still installs that major's latest release, which works, so it
 * passes: semantic-release raises bulma-ui's version in a release commit no
 * PR gates, and failing on the first new major would turn every template red
 * on main and on every open PR at once. Two or more majors behind fails,
 * since by then the template is two breaking releases from the library its
 * docs describe.
 */
export function bestaxRangeProblem(range, current) {
  const floor = /^\^((\d+)\.\d+\.\d+)$/.exec(range ?? '');
  if (!floor) {
    return `is "${range}"; give it a caret range, ^${current}`;
  }
  if (compareVersions(floor[1], current) > 0) {
    return (
      `is "${range}", newer than ${current}, the release in this ` +
      `checkout, so npm would find nothing to install; give it ^${current}`
    );
  }
  const behind = Number(current.split('.')[0]) - Number(floor[2]);
  if (behind >= 2) {
    return (
      `is "${range}", two or more majors behind ${current}; give it ` +
      `^${current}`
    );
  }
  return null;
}

/**
 * The package a bare import specifier names (`@scope/name/sub` is
 * `@scope/name`, `name/sub` is `name`), or null for one npm installs
 * nothing for: a relative or absolute path, a protocol such as `node:` or
 * `virtual:`, or a Node builtin.
 */
export function importedPackage(specifier) {
  if (/^[./]/.test(specifier) || specifier.includes(':')) return null;
  const parts = specifier.split('/');
  const name = specifier.startsWith('@')
    ? parts.slice(0, 2).join('/')
    : parts[0];
  return builtinModules.includes(name) ? null : name;
}

/**
 * Every module specifier `source` imports: static imports, side-effect
 * imports such as a stylesheet's, re-exports and dynamic `import()`. Read
 * with patterns rather than a parser, so the generator's job needs no
 * install; block comments are dropped first so an example in one is not
 * read as an import.
 */
export function importSpecifiers(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const found = [];
  for (const re of [
    /^\s*import\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/gm,
    /^\s*export\s+[^'";]*?\s+from\s+['"]([^'"]+)['"]/gm,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]) {
    for (const match of code.matchAll(re)) found.push(match[1]);
  }
  return found;
}

/**
 * The commands a package.json script runs: the first word of each command
 * between `&&`, `||`, `;` and `|`, past any `NAME=value` assignment.
 */
export function scriptCommands(script) {
  return script
    .split(/&&|\|\||[;|]/)
    .map(part => part.trim().split(/\s+/).filter(Boolean))
    .map(words => words.find(word => !/^\w+=/.test(word)))
    .filter(Boolean);
}

/** WCAG contrast ratio between two `#rrggbb` colors. */
export function contrast(a, b) {
  const luminance = hex => {
    const [r, g, bl] = hex
      .slice(1)
      .match(/../g)
      .map(part => parseInt(part, 16) / 255)
      .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Problems with the `Tags` map: what each filter checkbox is built from. */
export function tagProblems(tags) {
  if (!isObject(tags) || Object.keys(tags).length === 0) {
    return ['`Tags` must be an object with at least one tag'];
  }
  const problems = [];
  for (const [key, tag] of Object.entries(tags)) {
    const at = `tag "${key}"`;
    if (!SLUG.test(key)) {
      problems.push(`${at}: a tag key is lowercase, as it is in the URL`);
    }
    if (!nonEmpty(tag?.label)) problems.push(`${at} needs a \`label\``);
    if (!nonEmpty(tag?.description)) {
      problems.push(`${at} needs a \`description\`, its checkbox's tooltip`);
    }
    if (!HEX.test(tag?.color ?? '')) {
      problems.push(`${at}: \`color\` must be a lowercase #rrggbb hex`);
      continue;
    }
    for (const background of TAG_BACKGROUNDS) {
      const ratio = contrast(tag.color, background);
      if (ratio < SWATCH_CONTRAST) {
        problems.push(
          `${at}: ${tag.color} has ${ratio.toFixed(2)}:1 contrast against ` +
            `${background}, under the ${SWATCH_CONTRAST}:1 a swatch needs`
        );
      }
    }
  }
  return problems;
}

/** Problems with one entry's shape, before any file is looked at. */
export function entryProblems(entry, tags) {
  if (!isObject(entry)) return ['every template entry must be an object'];
  const at = nonEmpty(entry.slug) ? `template "${entry.slug}"` : 'a template';
  const problems = [];
  for (const key of Object.keys(entry)) {
    if (!ENTRY_FIELDS.includes(key)) {
      problems.push(
        `${at} has an unknown field \`${key}\`; the fields are ` +
          ENTRY_FIELDS.join(', ')
      );
    }
  }
  if (!SLUG.test(entry.slug ?? '')) {
    problems.push(
      `${at}: \`slug\` must be lowercase words joined by hyphens, the ` +
        'name of its folder under templates/'
    );
  }
  for (const key of ['title', 'description']) {
    if (!nonEmpty(entry[key])) problems.push(`${at} needs a \`${key}\``);
  }
  if (!LICENSES.includes(entry.license)) {
    problems.push(
      `${at}: \`license\` must be the upstream's SPDX identifier, one of ` +
        `${LICENSES.join(', ')}; a license not listed needs reading first, ` +
        'then a row in LICENSES in scripts/lib/templates.mjs'
    );
  }
  if (!isObject(entry.author) || !nonEmpty(entry.author.name)) {
    problems.push(`${at} needs an \`author.name\`, the original's author`);
  }
  for (const [key, value] of [
    ['author.url', entry.author?.url],
    ['source', entry.source],
    ['demo', entry.demo],
  ]) {
    if (!isHttpsUrl(value)) {
      problems.push(`${at}: \`${key}\` must be an https URL`);
    }
  }
  if (!SHA.test(entry.sourceSha ?? '')) {
    problems.push(
      `${at}: \`sourceSha\` must be the full commit SHA the port was made from`
    );
  }
  if (!/^Copyright\b/.test(entry.copyright ?? '')) {
    problems.push(
      `${at}: \`copyright\` must be the upstream LICENSE's copyright line, ` +
        'verbatim'
    );
  }
  if (!Array.isArray(entry.tags) || entry.tags.length === 0) {
    problems.push(`${at} needs at least one tag`);
  } else {
    const known = Object.keys(isObject(tags) ? tags : {});
    for (const tag of entry.tags) {
      if (!known.includes(tag)) {
        problems.push(`${at} has the unknown tag \`${tag}\``);
      }
    }
    if (new Set(entry.tags).size !== entry.tags.length) {
      problems.push(`${at} lists a tag twice`);
    }
  }
  return problems;
}

/** The packages a manifest installs: what npm puts in node_modules. */
const INSTALLED_SECTIONS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
];

/**
 * Problems with the packages a template needs and its manifest leaves out.
 * A template needs every package its scripts run (SCRIPT_BINARIES) and every
 * package its sources and its Vite config import, stylesheets included, and
 * StackBlitz installs only what the manifest declares. The monorepo's gates
 * cannot see a gap: the type-check resolves React and the library from
 * bulma-ui's install, and vite/client's `declare module '*.css'` stands in
 * for any stylesheet, so this is the check that reads the manifest.
 */
export function undeclaredProblems(at, pkg, sources) {
  const declared = new Set(
    INSTALLED_SECTIONS.flatMap(section => Object.keys(pkg[section] ?? {}))
  );
  const problems = [];
  const needs = new Map();
  const need = (name, why) => {
    if (!needs.has(name)) needs.set(name, why);
  };
  for (const [name, script] of Object.entries(pkg.scripts ?? {})) {
    // The lint script is refused on its own, with its packages.
    if (name === 'lint' || typeof script !== 'string') continue;
    for (const command of scriptCommands(script)) {
      if (Object.hasOwn(SCRIPT_BINARIES, command)) {
        need(SCRIPT_BINARIES[command], `the "${name}" script runs ${command}`);
      } else {
        problems.push(
          `${at}/package.json: the "${name}" script runs ${command}, which ` +
            'no row in SCRIPT_BINARIES in scripts/lib/templates.mjs maps to ' +
            'a package; add one, so the check can hold the manifest to it'
        );
      }
    }
  }
  for (const [file, source] of sources) {
    for (const specifier of importSpecifiers(source)) {
      const name = importedPackage(specifier);
      if (name) need(name, `${file} imports '${specifier}'`);
    }
  }
  for (const [name, why] of needs) {
    if (!declared.has(name)) {
      problems.push(
        `${at}/package.json does not declare ${name}, and ${why}; ` +
          'StackBlitz installs from this manifest alone'
      );
    }
  }
  return problems;
}

/** lstat, or null for a path that is not there. */
function lstatOrNull(path) {
  try {
    return lstatSync(path);
  } catch {
    return null;
  }
}

/**
 * Problems with one template folder, read against its entry. `files` are the
 * paths git tracks in the folder, relative to it.
 */
export function folderProblems(root, entry, bestaxVersion, files = []) {
  const dir = join(root, 'templates', entry.slug);
  const at = `templates/${entry.slug}`;
  const problems = [];
  const tracked = new Set(files);

  // Each tracked file as the generator reads it: a regular file on disk.
  const readable = new Set();
  for (const file of files) {
    const info = lstatOrNull(join(dir, file));
    if (!info) problems.push(`${at}/${file} is tracked but missing on disk`);
    else if (info.isSymbolicLink()) {
      problems.push(`${at}/${file} is a symbolic link; commit a regular file`);
    } else if (!info.isFile()) {
      problems.push(`${at}/${file} is tracked but not a regular file`);
    } else readable.add(file);
  }
  const read = file =>
    readable.has(file) ? readFileSync(join(dir, file), 'utf8') : undefined;

  for (const file of REQUIRED_FILES) {
    const ok = file.endsWith('/')
      ? files.some(f => f.startsWith(file))
      : tracked.has(file);
    if (!ok) problems.push(`${at} is missing ${file}, as git tracks it`);
  }
  for (const name of files.filter(file => !file.includes('/'))) {
    if (LOCKFILES.includes(name)) {
      problems.push(
        `${at} carries ${name}; a template is installed from its ranges ` +
          'alone, so drop the lockfile'
      );
    }
    if (/^eslint\.config\.[cm]?[jt]s$/.test(name)) {
      problems.push(
        `${at} carries ${name}; ESLint would read it in place of ` +
          "templates/eslint.config.js, so drop it with the scaffold's lint setup"
      );
    }
  }

  let pkg;
  const manifest = read('package.json');
  if (manifest !== undefined) {
    try {
      pkg = JSON.parse(manifest);
    } catch {
      problems.push(`${at}/package.json is not valid JSON`);
    }
  }
  if (pkg !== undefined && !isObject(pkg)) {
    problems.push(`${at}/package.json is not a JSON object`);
  } else if (isObject(pkg)) {
    if (pkg.private !== true) {
      problems.push(`${at}/package.json must set "private": true`);
    }
    for (const script of REQUIRED_SCRIPTS) {
      if (!nonEmpty(pkg.scripts?.[script])) {
        problems.push(`${at}/package.json needs a "${script}" script`);
      }
    }
    if (pkg.scripts?.lint !== undefined) {
      problems.push(
        `${at}/package.json keeps the scaffold's "lint" script; drop it ` +
          'with the lint packages'
      );
    }
    for (const section of DEP_SECTIONS) {
      for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
        if (!isRegistrySpecifier(spec)) {
          problems.push(
            `${at}/package.json: ${section}.${name} is "${spec}", which ` +
              'does not resolve for a folder opened on its own; give it a ' +
              'registry range'
          );
        }
        if (isLintPackage(name)) {
          problems.push(
            `${at}/package.json keeps the lint package ${name}; strip it ` +
              'as the docs StackBlitz builder does, so the sandbox installs ' +
              'quickly'
          );
        }
        if (name === 'bulma') {
          problems.push(
            `${at}/package.json still depends on bulma; the library ships ` +
              'it, so the port drops it'
          );
        }
      }
    }
    const range = pkg.dependencies?.[LIBRARY];
    if (range === undefined) {
      problems.push(`${at}/package.json must depend on ${LIBRARY}`);
    } else {
      const problem = bestaxRangeProblem(range, bestaxVersion);
      if (problem) problems.push(`${at}/package.json: ${LIBRARY} ${problem}`);
    }
    const sources = files
      .filter(
        file =>
          (file.startsWith('src/') && SOURCE_FILE.test(file)) ||
          /^vite\.config\.[cm]?[jt]s$/.test(file)
      )
      .filter(file => readable.has(file))
      .map(file => [`${at}/${file}`, read(file)]);
    problems.push(...undeclaredProblems(at, pkg, sources));
  }

  const license = read('LICENSE');
  if (nonEmpty(entry.copyright) && license !== undefined) {
    if (!license.includes(entry.copyright)) {
      problems.push(
        `${at}/LICENSE does not carry the upstream notice's line ` +
          `"${entry.copyright}"; keep the upstream license notice verbatim`
      );
    }
  }
  const text = read('README.md');
  if (text !== undefined) {
    for (const [what, value] of [
      ['upstream repository', entry.source],
      ['upstream commit', entry.sourceSha],
    ]) {
      if (nonEmpty(value) && !text.includes(value)) {
        problems.push(`${at}/README.md does not name the ${what} (${value})`);
      }
    }
  }
  return problems;
}

/**
 * The tracked files of each template, from a `git ls-files` listing of the
 * repo: `{ slugs, files }`, where `files` are `{ path, source }` with `path`
 * relative to templates/ (`<slug>/<rest>`) and `source` relative to the
 * repo. A tracked file at the top of templates/, such as its CLAUDE.md, is
 * not a template's and is left out. scripts/gen-templates-repo.mjs publishes
 * exactly these files, and the checks here read exactly these.
 */
export function templatePaths(tracked) {
  const slugs = new Set();
  const files = [];
  for (const source of tracked) {
    const match = /^templates\/([^/]+)\/(.+)$/.exec(source);
    if (!match) continue;
    slugs.add(match[1]);
    files.push({ path: `${match[1]}/${match[2]}`, source });
  }
  return {
    slugs: [...slugs].sort(byCodePoint),
    files: files.sort((a, b) => byCodePoint(a.path, b.path)),
  };
}

/** What git tracks under templates/ in the checkout at `root`. */
export function trackedTemplates(root) {
  return trackedRepoPaths(root, ['templates'], { requireCheckout: true });
}

/** The screenshots under `docs/static/img/templates/`, by file name. */
function screenshots(root) {
  const dir = join(root, 'docs', 'static', 'img', 'templates');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(name => !name.startsWith('.'));
}

/**
 * The page's data, imported from source the way docs/scripts reads its other
 * data files: as text, so neither package's module type decides how it loads.
 */
export async function loadTemplatesData(root) {
  const source = readFileSync(
    join(root, 'docs', 'src', 'data', 'templates.js'),
    'utf8'
  );
  return import(
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  );
}

/**
 * Every problem with the templates under `root`: the data's shape, each
 * entry against its folder and screenshot, and each folder and screenshot
 * against an entry. `tracked` is what git tracks under templates/, as
 * trackedTemplates lists it.
 */
export function templatesProblems({
  root,
  tags,
  templates,
  bestaxVersion,
  tracked,
}) {
  const problems = [...tagProblems(tags)];
  if (!Array.isArray(templates)) {
    return [...problems, '`templates` must be an array'];
  }
  const slugs = [];
  const { slugs: folders, files } = templatePaths(tracked);
  const filesOf = slug =>
    files
      .filter(file => file.path.startsWith(`${slug}/`))
      .map(file => file.path.slice(slug.length + 1));
  const shots = screenshots(root);
  // Any slug an entry names, well-formed or not, so a malformed one is
  // reported once, by its entry, rather than again from its folder.
  const named = new Set(templates.filter(isObject).map(entry => entry.slug));
  for (const entry of templates) {
    problems.push(...entryProblems(entry, tags));
    if (!isObject(entry) || !SLUG.test(entry.slug ?? '')) continue;
    if (slugs.includes(entry.slug)) {
      problems.push(`template "${entry.slug}" is listed twice`);
      continue;
    }
    slugs.push(entry.slug);
    if (!folders.includes(entry.slug)) {
      problems.push(
        `template "${entry.slug}" has no templates/${entry.slug}/ folder ` +
          'that git tracks'
      );
    } else {
      problems.push(
        ...folderProblems(root, entry, bestaxVersion, filesOf(entry.slug))
      );
    }
    if (!shots.includes(`${entry.slug}.jpg`)) {
      problems.push(
        `template "${entry.slug}" has no docs/static/img/templates/` +
          `${entry.slug}.jpg; run ` +
          '`pnpm --filter @allxsmith/bestax-docs screenshot:template ' +
          `${entry.slug}\``
      );
    }
  }
  for (const folder of folders) {
    if (!named.has(folder)) {
      problems.push(
        `templates/${folder}/ has no entry in docs/src/data/templates.js`
      );
    }
  }
  for (const shot of shots) {
    if (![...named].some(slug => shot === `${slug}.jpg`)) {
      problems.push(
        `docs/static/img/templates/${shot} belongs to no template entry`
      );
    }
  }
  return problems;
}

/** Every problem with the templates in the tree at `root`. */
export async function checkTemplates(root) {
  const { Tags, templates } = await loadTemplatesData(root);
  const { version } = JSON.parse(
    readFileSync(join(root, 'bulma-ui', 'package.json'), 'utf8')
  );
  return templatesProblems({
    root,
    tags: Tags,
    templates,
    bestaxVersion: version,
    tracked: trackedTemplates(root),
  });
}
