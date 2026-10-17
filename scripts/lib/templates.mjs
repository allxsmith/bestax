/**
 * The checks that keep each ported template honest (#1121), and the schema of
 * the docs Templates page's data (#1120).
 *
 * A template is a Bulma template from aldi's awesome-bulma-templates rebuilt
 * as a create-bestax vite-ts project in `templates/<slug>/`, which StackBlitz
 * imports from GitHub on its own (templates/CLAUDE.md is the porting guide).
 * The docs page lists each one from `docs/src/data/templates.js`, with a
 * screenshot at `docs/static/img/templates/<slug>.jpg`. So a template is
 * three things that have to agree: a folder, an entry, and a screenshot.
 *
 * Every path is derived from the `root` passed in, so
 * scripts/templates.test.mjs runs the same checks over a fixture tree and
 * over the repo. With no template anywhere the repo passes, having nothing to
 * hold.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { isLintPackage } from '../../docs/src/theme/CodeBlock/sandbox/projects.mjs';
import { compareVersions } from './version-regression.mjs';
import { DEP_SECTIONS } from './pack-time-protocols.mjs';

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
 * Whether a caret range admits `version`: the same leftmost non-zero part,
 * and no lower. Plain `X.Y.Z` versions only, which is what a release is.
 */
export function caretAdmits(range, version) {
  const floor = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(range ?? '');
  const actual = /^(\d+)\.(\d+)\.(\d+)$/.exec(version ?? '');
  if (!floor || !actual) return false;
  const lead = floor.slice(1).findIndex(part => Number(part) !== 0);
  const fixed = lead === -1 ? 3 : lead + 1;
  for (let i = 1; i <= fixed; i += 1) {
    if (Number(floor[i]) !== Number(actual[i])) return false;
  }
  return compareVersions(version, range.slice(1)) >= 0;
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
  for (const key of ['title', 'description', 'license']) {
    if (!nonEmpty(entry[key])) problems.push(`${at} needs a \`${key}\``);
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

/** Problems with one template folder, read against its entry. */
export function folderProblems(root, entry, bestaxVersion) {
  const dir = join(root, 'templates', entry.slug);
  const at = relative(root, dir).split('\\').join('/');
  const problems = [];

  for (const file of REQUIRED_FILES) {
    const path = join(dir, file);
    const ok = file.endsWith('/')
      ? existsSync(path) && statSync(path).isDirectory()
      : existsSync(path) && statSync(path).isFile();
    if (!ok) problems.push(`${at} is missing ${file}`);
  }
  for (const name of readdirSync(dir)) {
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
  const manifest = join(dir, 'package.json');
  if (existsSync(manifest)) {
    try {
      pkg = JSON.parse(readFileSync(manifest, 'utf8'));
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
    } else if (!caretAdmits(range, bestaxVersion)) {
      problems.push(
        `${at}/package.json: ${LIBRARY} is "${range}", which ` +
          `${bestaxVersion} does not satisfy; give it the current release's ` +
          `caret range, ^${bestaxVersion}`
      );
    }
  }

  const license = join(dir, 'LICENSE');
  if (nonEmpty(entry.copyright) && existsSync(license)) {
    if (!readFileSync(license, 'utf8').includes(entry.copyright)) {
      problems.push(
        `${at}/LICENSE does not carry the upstream notice's line ` +
          `"${entry.copyright}"; keep the upstream MIT notice verbatim`
      );
    }
  }
  const readme = join(dir, 'README.md');
  if (existsSync(readme)) {
    const text = readFileSync(readme, 'utf8');
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

/** The template folders under `templates/`, by slug. */
export function templateFolders(root) {
  const dir = join(root, 'templates');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      entry =>
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        entry.name !== 'node_modules'
    )
    .map(entry => entry.name)
    .sort();
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
 * against an entry.
 */
export function templatesProblems({ root, tags, templates, bestaxVersion }) {
  const problems = [...tagProblems(tags)];
  if (!Array.isArray(templates)) {
    return [...problems, '`templates` must be an array'];
  }
  const slugs = [];
  const folders = templateFolders(root);
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
        `template "${entry.slug}" has no templates/${entry.slug}/ folder`
      );
    } else {
      problems.push(...folderProblems(root, entry, bestaxVersion));
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
  });
}
