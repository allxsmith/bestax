/**
 * Writes the whole allxsmith/bestax-skills repository into a directory.
 *
 *   node scripts/gen-skills-repo.mjs <empty or new directory>
 *
 * bestax-skills holds the `bestax` coding-agent plugin: the Agent Skills in
 * `skills/` plus the bestax-mcp server. It is a repository of its own because
 * Claude Code's `/plugin marketplace add owner/repo` clones the whole
 * repository, history included, and a plugin rooted here made every install
 * download the monorepo for a few hundred KB of skills. Every file in it comes
 * from this script, and `.github/workflows/skills-publish.yml` replaces its
 * tree with this output on each change. Nobody edits it by hand, so a fix
 * goes here, in `plugin/`, in `skills/` or in what bestax-mcp generates.
 *
 * This script reuses the repo's own readers rather than its own copies:
 *
 * - The skills come from scripts/lib/skills.mjs, through the walk and the
 *   vetting gate that create-bestax's and bestax-mcp's sync scripts use:
 *   `readSkillNames` for the roster, and `vettedSkillFiles` for the files.
 *   It lists each skill with `skillFiles`, which refuses a symbolic link and
 *   leaves `.DS_Store` out, then refuses an untracked file with
 *   `assertSkillsVetted`. The tree takes exactly the files it listed. Every
 *   other input is held to the same gate with `trackedRepoPaths` and must be
 *   a regular file, not a link.
 * - The MCP server entry comes from `bestax-mcp/server.json`, the file the
 *   official MCP Registry listing is published from, read and checked by
 *   scripts/mcp-registry-publish.mjs (`readServer`). Its one npm package and
 *   stdio transport become `npx -y <identifier>@<version>`, with the version
 *   from bestax-mcp's package.json, since server.json holds a placeholder.
 *   Its `environmentVariables` are listed in the README.
 * - The README's skill list comes from `bestax-mcp/data/skills.json`, the
 *   skill metadata scripts/gen-mcp-index.mjs reads out of each SKILL.md and
 *   `gen:mcp:check` holds fresh. Each summary is cut with api-page.mjs's
 *   `firstSentence`, the rule both catalogs use. The README regions use the
 *   `<!-- bestax:generated <id> -->` helpers in scripts/lib/api-page.mjs, and
 *   the published README loses its markers through the same function that
 *   strips them from the built docs (docs/scripts/generated-markers-lib.mjs).
 * - Versions are checked with consumer-sbom-meta.mjs's `assertVersion`,
 *   `parseReleaseTag` and `SEMVER`, and file-derived values in messages go
 *   through its `forLog`, so a file name cannot forge a workflow command on
 *   the failure path.
 * - An expected failure carries the lib's refusal code (`skillRefusal`), as
 *   the syncs' and gen-mcp-index's do, and main prints it with `failureText`:
 *   the message for a refusal, the stack for anything else.
 *
 * gen-skills-rosters.mjs's `renderInstallBlock` feeds nothing here. Its lines
 * install single skills with `npx skills add` from this monorepo, without the
 * MCP server. The README installs the plugin, and its generated skill list
 * already carries the roster.
 *
 * Every plugin manifest carries the same version: MAJOR.MINOR from the template
 * and a patch, the commits on HEAD that touched CONTENT_PATHS, the paths whose
 * bytes reach the tree, plus OUTPUT_FORMAT. main is squash-merged and never
 * rewritten, so the count only grows, and Claude Code and every catalog that
 * pins the version see each content change. A commit to this script alone
 * does not count. One that changes the output raises OUTPUT_FORMAT, which the
 * test sibling enforces. Git that cannot count, or a shallow clone, is a
 * refusal. pluginVersion has the rest.
 *
 * Without git, as in an exported tree, the skill gate does what the sync
 * scripts do. It has nothing to vet against, so the skill directories are
 * read from disk, minus `.DS_Store`. An export from `git archive` holds only
 * tracked files. The version still needs git history, so a run there stops
 * at the count. The workflow's generate job passes `--require-checkout`,
 * which turns a failed git listing into a refusal naming the cause instead
 * of skipping the gate.
 *
 * Each file keeps its executable bit, as the sync scripts' copyFile does: a
 * skill or copied file is written 0755 when its owner can execute it and
 * 0644 otherwise, the two modes git records.
 *
 * plugin/icon.png is the plugin's icon. It is published as
 * `.claude-plugin/icon.png`, where Anthropic's directory looks for one, and
 * the Claude manifest names it in `icon`. It is read as bytes, and in place
 * of the text rules treeViolations holds it to the directory's icon rules
 * (iconViolations): a complete PNG, square, 512 to 2048 px a side and under
 * 2 MB. It is rendered from the docs logo with ImageMagick 7:
 *
 *   magick -background none -density 737.28 docs/static/img/logo.svg \
 *     -resize 1024x1024 -gravity center -extent 1024x1024 -strip \
 *     PNG32:plugin/icon.png
 *
 * The directory takes a listing's icon only the first time the plugin is
 * saved or submitted, so a new icon here does not reach a listing that
 * already exists.
 *
 * plugin/logo.png is the same logo on a white background, for the Cursor
 * Marketplace, which asks for a square logo with a background plate. It is
 * published as `assets/logo.png` and named by `logo` in the Cursor manifest,
 * `.cursor-plugin/plugin.json`, which Cursor's review looks for. It is read
 * as bytes too, and logoViolations holds it to a square PNG with no alpha
 * channel and no transparent colour. It is rendered with:
 *
 *   magick -background white -density 589.824 docs/static/img/logo.svg \
 *     -resize 820x820 -gravity center -extent 1024x1024 -alpha remove \
 *     -alpha off -strip PNG24:plugin/logo.png
 *
 * Before writing, and again on what landed on disk, the tree is held to
 * Anthropic's plugin directory checks
 * (https://claude.com/docs/plugins/pre-submission-checklist) in
 * treeViolations, so a skill change that would block or hold a directory
 * listing fails here, in the PR's test run, instead of after publishing.
 * That is also where a hidden file in a skill is refused, since skillFiles
 * lists one and the plugin ships none.
 *
 * With `--require-published`, the run first asks the npm registry for the
 * exact bestax-mcp version the plugin pins, and refuses one npm does not
 * serve. assertPublished says when that happens.
 *
 * Pure apart from inputCommitCount, assertPublished, readSources, writeTree,
 * scanTree, generate and main, and it imports node: builtins and local
 * modules only, so the workflow's generate job runs it with the runner's
 * Node and no install.
 */
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripGeneratedMarkers } from '../docs/scripts/generated-markers-lib.mjs';
import {
  SEMVER,
  assertVersion,
  forLog,
  parseReleaseTag,
} from './consumer-sbom-meta.mjs';
import {
  fenceMask,
  firstSentence,
  readRegions,
  replaceRegion,
  splitLines,
} from './lib/api-page.mjs';
import {
  SKILL_REFUSAL,
  byCodePoint,
  failureText,
  readSkillNames,
  rootGit,
  skillRefusal,
  trackedRepoPaths,
  vettedSkillFiles,
} from './lib/skills.mjs';
import { fetchWithRetry } from './lib/fetch-retry.mjs';
import { isMainModule } from './lib/main-module.mjs';
import { readJson, readServer } from './mcp-registry-publish.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');

export const TEMPLATE = {
  manifest: 'plugin/manifest.json',
  readme: 'plugin/README.md',
  icon: 'plugin/icon.png',
  logo: 'plugin/logo.png',
};

/** Repo-root files copied into the tree under the same name. */
export const COPIED = ['LICENSE', 'NOTICE'];

export const MCP_DIR = 'bestax-mcp';
export const SKILL_INDEX = 'bestax-mcp/data/skills.json';
export const MCP_SERVER = 'bestax';

/**
 * Every file the tree is built from besides the skills. Each must be a
 * tracked regular file, like the skill files. The workflow's paths filter
 * covers these, and the test sibling holds it to them.
 */
export const INPUT_FILES = [
  TEMPLATE.manifest,
  TEMPLATE.readme,
  TEMPLATE.icon,
  TEMPLATE.logo,
  `${MCP_DIR}/package.json`,
  `${MCP_DIR}/server.json`,
  SKILL_INDEX,
  ...COPIED,
];

/**
 * Every path whose bytes reach the tree: the files inside the skill
 * directories and INPUT_FILES, as git globs, where `*` stops at a slash. The
 * version's patch counts the commits on HEAD that touched one of them
 * (inputCommitCount), so a commit that changes only the generator's code
 * does not move it, and neither does one that changes only skills/README.md
 * or skills/CLAUDE.md, which do not ship. OUTPUT_FORMAT covers the code.
 *
 * Adding a path only adds commits to the count. Dropping or renaming one can
 * lower it, as the commits that touched only that path stop counting, so a
 * change that drops a path also bumps the minor in plugin/manifest.json.
 */
export const CONTENT_PATHS = [
  'skills/*/**',
  'plugin/**',
  'bestax-mcp/package.json',
  'bestax-mcp/server.json',
  'bestax-mcp/data/skills.json',
  'LICENSE',
  'NOTICE',
];

/**
 * Everything a publish depends on: CONTENT_PATHS, every local module the
 * generator runs, and the workflow. This is the push paths filter in
 * .github/workflows/skills-publish.yml, and the test sibling holds the two
 * equal and the list to the generator's imports. It takes all of skills/,
 * wider than CONTENT_PATHS, which costs at most a run that publishes nothing.
 * A run for a code change publishes only when the tree it writes differs
 * from the published one.
 */
export const PUBLISH_PATHS = [
  'skills/**',
  ...CONTENT_PATHS.filter(p => !p.startsWith('skills/')),
  'scripts/gen-skills-repo.mjs',
  'scripts/lib/skills.mjs',
  'scripts/lib/api-page.mjs',
  'scripts/lib/fetch-retry.mjs',
  'scripts/lib/main-module.mjs',
  'scripts/consumer-sbom-meta.mjs',
  'scripts/mcp-registry-publish.mjs',
  'scripts/npm-install-retry.mjs',
  'docs/scripts/generated-markers-lib.mjs',
  '.github/workflows/skills-publish.yml',
];

/**
 * The generator's output format, added to the content commit count to make
 * the version's patch. Raise it by one in any change that alters the tree
 * the generator writes from the same inputs, so the plugin's version rises
 * with that change. Never lower it. The count only grows because main is
 * never rewritten, and this only grows by that rule, so their sum never goes
 * back.
 *
 * The test sibling pins a hash of the tree built from fixed inputs, next to
 * the OUTPUT_FORMAT it was recorded at. A change that alters the output for
 * those inputs fails that test until this is raised and the hash pinned
 * again, and a change that leaves it alone, such as one to comments, passes.
 * The test sees only what its inputs reach, so a change that adds a
 * rendering path adds an input that reaches it.
 */
export const OUTPUT_FORMAT = 3;

/** The flag the generate job passes, so a failed git listing stops the run. */
export const REQUIRE_CHECKOUT = '--require-checkout';

/** The flag the generate job passes, so a pin npm cannot serve stops the run. */
export const REQUIRE_PUBLISHED = '--require-published';

/** The registry the plugin's `npx -y` installs bestax-mcp from. */
export const NPM_REGISTRY = 'https://registry.npmjs.org';

/**
 * Waits between asks of the registry, in ms. A run a release starts reaches
 * the registry soon after `pnpm publish`, when a new version can still
 * answer 404, so a 404 is asked again for about a minute before it counts.
 */
export const PUBLISHED_BACKOFF_MS = [5_000, 10_000, 20_000, 30_000];

/** The generated regions plugin/README.md must carry. */
export const README_REGIONS = { skills: 'skills', mcp: 'mcp-server' };

export const AGENT_PLUGIN_SCHEMA =
  'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
export const AGENT_MCP_SCHEMA =
  'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json';

/**
 * Every key the template may hold, by section. Each one is placed by a
 * render function below. `plugin.version` is MAJOR.MINOR, and every plugin
 * manifest carries the full version that pluginVersion makes from it.
 */
export const TEMPLATE_KEYS = {
  plugin: [
    'name',
    'version',
    'description',
    'author',
    'homepage',
    'repository',
    'license',
    'keywords',
  ],
  claude: ['privacyPolicyUrl', 'supportUrl'],
  cursor: ['displayName'],
  marketplace: ['name', 'description', 'owner'],
};

/**
 * The files the tree holds besides the COPIED files and the skills. The
 * icon and the logo are plugin/icon.png's and plugin/logo.png's bytes, and
 * the rest are generated here.
 */
export const FILES = {
  marketplace: '.claude-plugin/marketplace.json',
  claude: '.claude-plugin/plugin.json',
  icon: '.claude-plugin/icon.png',
  cursor: '.cursor-plugin/plugin.json',
  logo: 'assets/logo.png',
  agent: 'plugin.json',
  mcp: 'mcp.json',
  readme: 'README.md',
};

/** The directory's limits, from the checklist in the header. */
export const LIMITS = {
  files: 512,
  textBytes: 256 * 1024,
  anyBytes: 5 * 1024 * 1024,
  readmeWords: 40,
};

/**
 * The directory's icon rules, from the warning it gives a plugin without an
 * icon: 512 to 2048 px on each side, under 2 MB. The size takes 2 MB as
 * 2,000,000 bytes, the stricter reading.
 */
export const ICON_LIMITS = { minSide: 512, maxSide: 2048, bytes: 2_000_000 };

/** The hand-owned part of the plugin version, such as 1.0. */
export const MAJOR_MINOR = /^(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/** The checklist's plugin name rule. */
export const PLUGIN_NAME = /^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/;

/** Claude Code's marketplace name rule (marketplace-reference). */
export const MARKETPLACE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * Exempt from the text and 256 KiB rules, though not from the 5 MiB one. The
 * icon is held to iconViolations instead, and the logo to logoViolations.
 */
const IMAGE_OR_FONT = /\.(png|jpe?g|gif|webp|svg|woff2?|ttf|otf)$/i;

const SYSTEM_FILES = new Set(['.ds_store', 'thumbs.db', 'desktop.ini']);

/**
 * Package-manager configuration that can set a registry, index, proxy or
 * other package source, or rewrite what an install resolves. The checklist
 * blocks these in a plugin that runs a launcher.
 */
const PACKAGE_MANAGER_CONFIG = new Set([
  '.npmrc',
  '.yarnrc',
  '.yarnrc.yml',
  '.pnpmfile.cjs',
  'pnpm-workspace.yaml',
  'bunfig.toml',
  '.bunfig.toml',
  'uv.toml',
  'pip.conf',
  'pip.ini',
  '.pypirc',
  'poetry.toml',
]);

/**
 * At the plugin root, a package.json beside a lockfile makes Claude Code
 * install dependencies when a user installs the plugin, which the directory
 * holds for a reviewer. The plugin installs nothing, so none of these belong.
 */
const ROOT_INSTALL_FILES = new Set([
  'package.json',
  'package-lock.json',
  'npm-shrinkwrap.json',
  'bun.lock',
  'bun.lockb',
  'yarn.lock',
  'pnpm-lock.yaml',
]);

/** The only hidden paths the tree has, all placed here. */
const HIDDEN_ALLOWED = new Set([
  FILES.marketplace,
  FILES.claude,
  FILES.icon,
  FILES.cursor,
]);

/** The npx options launcherViolations reads. Any other one is refused. */
const NPX_FLAGS = new Set(['-y', '--yes']);

const WINDOWS_DEVICE = /^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])(\..*)?$/i;
// eslint-disable-next-line no-control-regex
const FORBIDDEN_CHARS = /[<>:"/\\|?*\u0000-\u001f]/;

/**
 * A problem list, thrown as one error so every problem is reported at once.
 * It is a refusal (SKILL_REFUSAL), like every expected failure here.
 */
export class TreeError extends Error {
  constructor(problems) {
    super(problems.join('\n'));
    this.name = 'TreeError';
    this.code = SKILL_REFUSAL;
    this.problems = problems;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * The template object, checked. Throws one TreeError naming every problem:
 * an unknown section or key, a missing key, or a value of the wrong shape.
 */
export function checkTemplate(template) {
  const file = TEMPLATE.manifest;
  if (!isObject(template))
    throw new TreeError([`${file}: is not a JSON object.`]);
  const problems = [];
  for (const section of Object.keys(template)) {
    if (!(section in TEMPLATE_KEYS)) {
      problems.push(
        `${file}: section ${forLog(section)} is not one gen-skills-repo ` +
          `places. Use one of ${Object.keys(TEMPLATE_KEYS).join(', ')}.`
      );
    }
  }
  for (const [section, keys] of Object.entries(TEMPLATE_KEYS)) {
    const fields = template[section];
    if (!isObject(fields)) {
      problems.push(`${file}: "${section}" must be an object.`);
      continue;
    }
    for (const key of Object.keys(fields)) {
      if (!keys.includes(key)) {
        problems.push(
          `${file}: ${section}.${forLog(key)} is not placed in any generated ` +
            `file. Place it in a render function in ` +
            `scripts/gen-skills-repo.mjs, then list it in TEMPLATE_KEYS.`
        );
      }
    }
    for (const key of keys) {
      if (!(key in fields))
        problems.push(`${file}: ${section}.${key} is missing.`);
    }
  }
  if (problems.length) throw new TreeError(problems);

  const { plugin, claude, cursor, marketplace } = template;
  const string = (value, where) => {
    if (typeof value !== 'string' || !value.trim()) {
      problems.push(`${file}: ${where} must be a non-empty string.`);
    }
  };
  const https = (value, where) => {
    if (typeof value !== 'string' || !value.startsWith('https://')) {
      problems.push(`${file}: ${where} must be an https:// URL.`);
    }
  };
  const person = (value, where) => {
    if (!isObject(value)) problems.push(`${file}: ${where} must be an object.`);
    else string(value.name, `${where}.name`);
  };
  if (typeof plugin.name !== 'string' || !PLUGIN_NAME.test(plugin.name)) {
    problems.push(
      `${file}: plugin.name ${forLog(plugin.name)} must be lowercase ` +
        `letters, digits and hyphens, at most 64 characters, starting and ` +
        `ending with a letter or digit.`
    );
  }
  if (typeof plugin.version !== 'string' || !MAJOR_MINOR.test(plugin.version)) {
    problems.push(
      `${file}: plugin.version must be MAJOR.MINOR, such as 1.0, not ` +
        `${forLog(plugin.version)}. The patch is counted from git history ` +
        `(pluginVersion in scripts/gen-skills-repo.mjs).`
    );
  }
  string(plugin.description, 'plugin.description');
  person(plugin.author, 'plugin.author');
  https(plugin.homepage, 'plugin.homepage');
  https(plugin.repository, 'plugin.repository');
  string(plugin.license, 'plugin.license');
  if (
    !Array.isArray(plugin.keywords) ||
    !plugin.keywords.every(k => typeof k === 'string' && k)
  ) {
    problems.push(`${file}: plugin.keywords must be an array of strings.`);
  }
  https(claude.privacyPolicyUrl, 'claude.privacyPolicyUrl');
  https(claude.supportUrl, 'claude.supportUrl');
  string(cursor.displayName, 'cursor.displayName');
  if (
    typeof marketplace.name !== 'string' ||
    !MARKETPLACE_NAME.test(marketplace.name) ||
    marketplace.name.includes('..')
  ) {
    problems.push(
      `${file}: marketplace.name ${forLog(marketplace.name)} must be ` +
        `letters, digits, dots, underscores and hyphens, starting with a ` +
        `letter or digit.`
    );
  }
  string(marketplace.description, 'marketplace.description');
  person(marketplace.owner, 'marketplace.owner');
  if (problems.length) throw new TreeError(problems);
  return template;
}

/** server.json package fields the launch config does not carry over. */
const UNCARRIED_PACKAGE_FIELDS = [
  'runtimeHint',
  'runtimeArguments',
  'packageArguments',
];

/**
 * The plugin's launch config from a server.json and package.json pair that
 * readServer has already checked: one npm package, named after the
 * manifest, over stdio. Returns `{ pin, env }`, where `pin` is
 * `<identifier>@<exact version>` and `env` is the package's
 * environmentVariables. Throws when the pair describes a launch the plugin
 * would not reproduce, so the plugin and the registry listing cannot start
 * the server in different ways. The directory blocks an npx launcher pinned
 * to a range or `@latest`, so the version must be exact.
 */
export function mcpLaunch(server, manifest) {
  const file = `${MCP_DIR}/server.json`;
  const [pkg] = server.packages;
  const uncarried = UNCARRIED_PACKAGE_FIELDS.filter(
    key =>
      pkg[key] !== undefined && !(key === 'runtimeHint' && pkg[key] === 'npx')
  );
  if (uncarried.length) {
    throw skillRefusal(
      `${file}: packages[0] sets ${uncarried.join(', ')}, which the plugin's ` +
        `launch config does not carry. Teach mcpLaunch in ` +
        `scripts/gen-skills-repo.mjs to carry it, or drop it.`
    );
  }
  const env = pkg.environmentVariables ?? [];
  const wellFormed =
    Array.isArray(env) &&
    env.every(
      v =>
        isObject(v) &&
        typeof v.name === 'string' &&
        /^[A-Z_][A-Z0-9_]*$/.test(v.name) &&
        typeof v.description === 'string' &&
        v.description.trim() !== ''
    );
  if (!wellFormed) {
    throw skillRefusal(
      `${file}: packages[0].environmentVariables must be a list of ` +
        `{ name, description } entries with upper-case names.`
    );
  }
  const required = env.filter(v => v.isRequired === true).map(v => v.name);
  if (required.length) {
    throw skillRefusal(
      `${file}: ${required.join(', ')} is required, and the plugin has no ` +
        `way to ask a user for it. Add a userConfig entry for it first.`
    );
  }
  const version = assertVersion(
    manifest.version,
    `${MCP_DIR}/package.json "version"`
  );
  return { pin: `${pkg.identifier}@${version}`, env };
}

/**
 * The skills in bestax-mcp's index, sorted by name, after checking that the
 * index lists exactly the skill directories on disk. A stale index would
 * publish a README that drifts from what the plugin carries.
 */
export function skillIndex(index, names) {
  const file = SKILL_INDEX;
  const rerun = 'Run pnpm gen:mcp, which gen:mcp:check holds fresh in CI.';
  const skills = index?.skills;
  if (
    !Array.isArray(skills) ||
    !skills.every(
      s =>
        isObject(s) &&
        typeof s.name === 'string' &&
        typeof s.dir === 'string' &&
        typeof s.description === 'string' &&
        s.description.trim() !== ''
    )
  ) {
    throw skillRefusal(
      `${file}: needs a skills array of { name, dir, description }. ${rerun}`
    );
  }
  const listed = skills.map(s => s.dir).sort(byCodePoint);
  const onDisk = [...names].sort(byCodePoint);
  if (listed.join('\n') !== onDisk.join('\n')) {
    throw skillRefusal(
      `${file}: lists ${forLog(listed.join(', '))}, but skills/ holds ` +
        `${forLog(onDisk.join(', '))}. ${rerun}`
    );
  }
  return [...skills].sort((a, b) => byCodePoint(a.name, b.name));
}

const EM_DASH = '\u2014';

/**
 * The concise form of a skill description that the README lists: its first
 * sentence by firstSentence, the rule both catalogs cut their one-liners
 * with, then cut before its first spaced em dash, with one closing period.
 */
export function skillSummary(description) {
  const [clause] = firstSentence(description).split(` ${EM_DASH} `);
  return `${clause.replace(/[\s.]+$/, '')}.`;
}

/** The `skills` region: one line per skill, name and summary. */
export function renderSkillList(skills) {
  return [
    '',
    ...skills.map(s => `- **${s.name}**: ${skillSummary(s.description)}`),
    '',
  ].join('\n');
}

/** The `mcp-server` region: the launch command and the variables it reads. */
export function renderMcpServer({ pin, env }) {
  const lines = ['', '```text', `npx -y ${pin}`, '```', ''];
  if (env.length) {
    lines.push(
      'The server reads these environment variables, all optional:',
      '',
      ...env.map(v => {
        const format = v.format ? ` (${v.format})` : '';
        const text = v.description.trim().replace(/[\s.]+$/, '');
        return `- \`${v.name}\`${format}: ${text}.`;
      }),
      ''
    );
  }
  return lines.join('\n');
}

/**
 * readRegions or replaceRegion, with the plain Error they throw for a
 * malformed marker (unclosed, nested or repeated) turned into a refusal
 * carrying its message, since a template edit is an expected input error
 * and not a bug to print a stack for. Any other error keeps its stack.
 */
function regionCall(fn) {
  try {
    return fn();
  } catch (err) {
    if (err?.constructor !== Error) throw err;
    throw skillRefusal(err.message, { cause: err });
  }
}

/**
 * The published README: the template with its regions filled and every
 * marker stripped. Throws when a region is missing, rather than publish a
 * README whose lists silently stopped updating.
 */
export function renderReadme(src, skills, launch) {
  const label = TEMPLATE.readme;
  const regions = regionCall(() => readRegions(src, label));
  const missing = Object.values(README_REGIONS).filter(id => !regions.has(id));
  if (missing.length) {
    throw skillRefusal(
      `${label}: has no <!-- bestax:generated ${missing.join(' / ')} --> ` +
        `marker pair, so the README cannot say what the plugin carries. ` +
        `Restore the markers.`
    );
  }
  let out = regionCall(() =>
    replaceRegion(src, README_REGIONS.skills, renderSkillList(skills), label)
  );
  out = regionCall(() =>
    replaceRegion(out, README_REGIONS.mcp, renderMcpServer(launch), label)
  );
  // A region at the end of the file would leave a blank line before EOF.
  return stripGeneratedMarkers(out).replace(/\n+$/, '\n');
}

/** How every manifest starts the server. */
export function mcpServer(pin) {
  return { command: 'npx', args: ['-y', pin] };
}

export function renderMarketplace(template) {
  const { plugin, marketplace } = template;
  return {
    name: marketplace.name,
    description: marketplace.description,
    owner: marketplace.owner,
    plugins: [{ name: plugin.name, source: './' }],
  };
}

/**
 * The Claude Code manifest. It declares the server inline, because Claude
 * Code reads `.mcp.json` and not the Agent Plugins `mcp.json`.
 *
 * Its `version` is pluginVersion's, the same as the Agent Plugins manifest's.
 * Claude Code keeps every user on a manifest's `version` until the string
 * changes. This one rises with every content commit, and with OUTPUT_FORMAT
 * when the output changes, so users still get each update. Without it,
 * Anthropic's directory and `claude plugin validate` warn.
 *
 * Anthropic's directory reads `icon` and the two URLs for the listing, and
 * Claude Code ignores them. The directory would also find the icon at its
 * path without the field.
 */
export function renderClaudeManifest(template, pin, version) {
  const { plugin, claude } = template;
  return {
    name: plugin.name,
    version,
    description: plugin.description,
    author: plugin.author,
    homepage: plugin.homepage,
    repository: plugin.repository,
    license: plugin.license,
    keywords: plugin.keywords,
    icon: `./${FILES.icon}`,
    privacyPolicyUrl: claude.privacyPolicyUrl,
    supportUrl: claude.supportUrl,
    mcpServers: { [MCP_SERVER]: mcpServer(pin) },
  };
}

/**
 * The Cursor manifest. Cursor's marketplace review checks a plugin for
 * `.cursor-plugin/plugin.json` and a logo committed in the repository and
 * named by a relative path. `skills` and `mcpServers` name the folder and the
 * Agent Plugins `mcp.json`, the file name Cursor looks for. Its `version` is
 * pluginVersion's, like the other manifests'.
 */
export function renderCursorManifest(template, version) {
  const { plugin, cursor } = template;
  return {
    name: plugin.name,
    displayName: cursor.displayName,
    version,
    description: plugin.description,
    author: plugin.author,
    homepage: plugin.homepage,
    repository: plugin.repository,
    license: plugin.license,
    keywords: plugin.keywords,
    logo: FILES.logo,
    skills: './skills/',
    mcpServers: `./${FILES.mcp}`,
  };
}

/**
 * The vendor-neutral Agent Plugins manifest, which Kiro and the
 * awesome-copilot catalog read, and which Codex, Copilot CLI, VS Code and
 * Grok Build prefer to `.claude-plugin/`. Its `version` is pluginVersion's,
 * for the catalogs that pin a release.
 *
 * `mcpServers` is not in the Agent Plugins schema. Its clients find
 * `mcp.json` by location, and the spec has them report and ignore an unknown
 * top-level field. Grok Build reads this file first, though, and without the
 * field it looks for `.mcp.json`, so dropping it would cost Grok the server.
 */
export function renderAgentManifest(template, version) {
  const { plugin } = template;
  return {
    $schema: AGENT_PLUGIN_SCHEMA,
    name: plugin.name,
    version,
    description: plugin.description,
    author: plugin.author,
    homepage: plugin.homepage,
    repository: plugin.repository,
    license: plugin.license,
    keywords: plugin.keywords,
    mcpServers: `./${FILES.mcp}`,
  };
}

/** The Agent Plugins MCP config. */
export function renderMcpConfig(pin) {
  return {
    $schema: AGENT_MCP_SCHEMA,
    mcpServers: { [MCP_SERVER]: { type: 'stdio', ...mcpServer(pin) } },
  };
}

/** A generated file: its bytes, written 0644. */
const generated = content => ({ content, mode: 0o644 });
const json = value =>
  generated(Buffer.from(`${JSON.stringify(value, null, 2)}\n`));

/**
 * The complete tree as a Map of repo-relative path to `{ content, mode }`,
 * from what readSources returned (or a fixture of the same shape).
 */
export function buildTree({
  template,
  version,
  readme,
  launch,
  icon,
  logo,
  copied,
  skillFiles,
}) {
  const tree = new Map([
    [FILES.marketplace, json(renderMarketplace(template))],
    [FILES.claude, json(renderClaudeManifest(template, launch.pin, version))],
    [FILES.cursor, json(renderCursorManifest(template, version))],
    [FILES.agent, json(renderAgentManifest(template, version))],
    [FILES.mcp, json(renderMcpConfig(launch.pin))],
    [FILES.readme, generated(readme)],
  ]);
  for (const { path, content, mode } of [
    icon,
    logo,
    ...copied,
    ...skillFiles,
  ]) {
    tree.set(path, { content, mode });
  }
  return new Map([...tree].sort(([a], [b]) => byCodePoint(a, b)));
}

/** treeViolations entries for a tree buildTree made. */
export function planEntries(tree) {
  return [...tree].map(([path, { content, mode }]) => ({
    path,
    content,
    mode,
    symlink: false,
  }));
}

/**
 * Words in a README outside code, the way the directory counts them: fenced
 * blocks do not count, found with the fence rules scripts/lib/api-page.mjs
 * uses. Inline code, HTML comments and link targets are left out as well, so
 * the count errs low rather than passing a README the directory would call
 * too short.
 */
export function readmeWordCount(text) {
  const { lines } = splitLines(text);
  const fenced = fenceMask(lines);
  const prose = lines
    .filter((_, i) => !fenced[i])
    .join('\n')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/https?:\/\/\S+/g, ' ');
  return (prose.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).length;
}

/** Why a path segment is not a valid name on Windows and macOS, or null. */
export function nameProblem(segment) {
  if (!segment) return 'has an empty name';
  if (FORBIDDEN_CHARS.test(segment)) {
    return 'has a character Windows or macOS refuses (< > : " / \\ | ? * or a control character)';
  }
  if (/[. ]$/.test(segment)) return 'ends in a dot or a space';
  if (WINDOWS_DEVICE.test(segment)) return 'is a Windows device name';
  if (Buffer.byteLength(segment) > 255)
    return 'has a name longer than 255 bytes';
  return null;
}

/**
 * A package name on the npm registry, scoped or not. A git, URL or file spec
 * such as github:owner/repo@1.0.0 also ends in @<version>, so the name is held
 * to the registry's grammar before the version counts as an exact pin.
 */
const NPM_NAME = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/;

/**
 * An npm package spec pinned to one exact version, such as `name@1.2.3`,
 * split on its last `@` the way release tags are.
 */
export function exactNpmSpec(spec) {
  const parsed = parseReleaseTag(spec);
  return Boolean(
    parsed && NPM_NAME.test(parsed.package) && SEMVER.test(parsed.version)
  );
}

/**
 * The package npx would run for `args`, as `{ spec }` (null when there is
 * none), or `{ problem }` for a form this check does not read: an argument
 * that is not a string, or any option other than -y before the package.
 * Options such as --package, --call or --registry change what npx runs, or
 * take a value that would pass for the package.
 */
function npxPackage(args) {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (typeof arg !== 'string') {
      return { problem: 'passes npx an argument that is not a string' };
    }
    if (arg === '--') {
      const next = args[i + 1];
      return typeof next === 'string' ? { spec: next } : { spec: null };
    }
    if (!arg.startsWith('-')) return { spec: arg };
    if (!NPX_FLAGS.has(arg)) {
      return {
        problem:
          `passes npx ${forLog(arg)}, an option this check does not read. ` +
          `Give only -y before the pinned package`,
      };
    }
  }
  return { spec: null };
}

/**
 * Each MCP server in `servers` (an mcpServers map) that does not start as
 * npx with an exact pin, which is the one launch this check reads. The
 * plugin ships no program of its own, so any other command runs something
 * from outside it: another package launcher (npm exec or npm x, pnpm dlx,
 * pnpx, yarn dlx, bunx or bun x, uvx, pipx), a shell or env that could start
 * one, or a program the check does not know. Each fails until a check for it
 * is written here, rather than passing unread.
 */
export function launcherViolations(file, servers) {
  if (!isObject(servers)) return [`${file}: mcpServers is not an object.`];
  const violations = [];
  for (const [name, server] of Object.entries(servers)) {
    const where = `${file}: mcpServers.${forLog(name)}`;
    if (!isObject(server) || typeof server.command !== 'string') {
      violations.push(`${where} has no command.`);
      continue;
    }
    // The bare program name, on any platform: /usr/bin/npx, C:\\x\\npx.cmd
    // and NPX.EXE all launch npx. A name with a space in it, such as
    // "npx -y x", is not npx, and is refused below with the rest.
    const command = server.command
      .split(/[\\/]/)
      .pop()
      .toLowerCase()
      .replace(/\.(?:cmd|exe|bat|ps1)$/, '');
    if (command !== 'npx') {
      violations.push(
        `${where} runs ${forLog(command)}, and this check reads only npx. ` +
          `Start the server with npx and an exact pin, or teach ` +
          `launcherViolations to read ${forLog(command)} first.`
      );
      continue;
    }
    if (server.args !== undefined && !Array.isArray(server.args)) {
      violations.push(`${where} has args that are not a list.`);
      continue;
    }
    const { spec, problem } = npxPackage(server.args ?? []);
    if (problem) violations.push(`${where} ${problem}.`);
    else if (!spec || !exactNpmSpec(spec)) {
      violations.push(
        `${where} runs npx ${spec ? forLog(spec) : '(no package)'}, which ` +
          `is not pinned to an exact version. Anthropic's directory blocks ` +
          `an unpinned npx launcher. Pin it as name@1.2.3.`
      );
    }
  }
  return violations;
}

function manifestViolations(byPath) {
  const violations = [];
  const read = file => {
    const content = byPath.get(file);
    if (!content) {
      violations.push(`${file}: missing.`);
      return null;
    }
    let value;
    try {
      value = JSON.parse(content.toString('utf8'));
    } catch {
      violations.push(`${file}: is not valid JSON.`);
      return null;
    }
    if (isObject(value)) return value;
    violations.push(`${file}: is not a JSON object.`);
    return null;
  };
  // A path a manifest names: a file, or a folder when it ends in a slash.
  const named = (file, field, ref) => {
    if (typeof ref !== 'string') {
      violations.push(`${file}: ${field} must name a path in the tree.`);
      return;
    }
    const target = ref.replace(/^\.\//, '');
    const found = target.endsWith('/')
      ? [...byPath.keys()].some(p => p.startsWith(target))
      : byPath.has(target);
    if (!found) {
      violations.push(
        `${file}: ${field} names ${forLog(ref)}, which is not in the tree.`
      );
    }
  };
  const claude = read(FILES.claude);
  const cursor = read(FILES.cursor);
  const agent = read(FILES.agent);
  const marketplace = read(FILES.marketplace);
  const mcp = read(FILES.mcp);
  for (const [file, manifest] of [
    [FILES.claude, claude],
    [FILES.cursor, cursor],
    [FILES.agent, agent],
  ]) {
    if (manifest && !PLUGIN_NAME.test(String(manifest.name))) {
      violations.push(
        `${file}: name ${forLog(manifest.name)} does not match ${PLUGIN_NAME}.`
      );
    }
  }
  if (claude)
    violations.push(...launcherViolations(FILES.claude, claude.mcpServers));
  if (mcp) violations.push(...launcherViolations(FILES.mcp, mcp.mcpServers));
  if (agent && typeof agent.mcpServers === 'string') {
    named(FILES.agent, 'mcpServers', agent.mcpServers);
  }
  if (cursor) {
    for (const field of ['logo', 'skills', 'mcpServers']) {
      named(FILES.cursor, field, cursor[field]);
    }
  }
  if (marketplace) {
    const entries = Array.isArray(marketplace.plugins)
      ? marketplace.plugins
      : [];
    if (
      entries.length !== 1 ||
      entries[0]?.source !== './' ||
      (claude && entries[0]?.name !== claude.name)
    ) {
      violations.push(
        `${FILES.marketplace}: must list exactly the one plugin, with ` +
          `source "./" and the name in ${FILES.claude}.`
      );
    }
  }
  return violations;
}

/** The eight bytes every PNG starts with. */
const PNG_SIGNATURE = Buffer.from('\x89PNG\r\n\x1a\n', 'latin1');

/** IHDR colour types that carry an alpha channel: grey and RGB with alpha. */
const ALPHA_COLOUR_TYPES = new Set([4, 6]);

/**
 * The size of the PNG in `content`, as `{ width, height, transparent }`, or
 * `{ problem }` when it is not a complete PNG: no PNG signature, a first
 * chunk that is not IHDR, no IDAT, or bytes that do not end with an empty
 * IEND chunk, as in a file cut short. `transparent` says whether it can hold
 * a pixel that is not opaque: an IHDR colour type with alpha, or a tRNS
 * chunk. It walks the chunks and does not decode the pixels.
 */
export function pngSize(content) {
  if (!content.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { problem: 'is not a PNG' };
  }
  const incomplete = why => ({ problem: `is not a complete PNG: ${why}` });
  let at = PNG_SIGNATURE.length;
  let pixels = false;
  let transparent = false;
  while (at + 12 <= content.length) {
    const length = content.readUInt32BE(at);
    const type = content.toString('latin1', at + 4, at + 8);
    if (at === PNG_SIGNATURE.length) {
      if (type !== 'IHDR' || length !== 13) {
        return incomplete('it does not start with an IHDR chunk');
      }
      transparent = ALPHA_COLOUR_TYPES.has(content[at + 17]);
    }
    at += 12 + length;
    if (type === 'IDAT') pixels = true;
    if (type === 'tRNS') transparent = true;
    if (type === 'IEND') {
      if (length !== 0 || at !== content.length) break;
      if (!pixels) return incomplete('it has no IDAT chunk');
      return {
        width: content.readUInt32BE(16),
        height: content.readUInt32BE(20),
        transparent,
      };
    }
  }
  return incomplete('it does not end with an IEND chunk');
}

/**
 * Why `content` cannot be the plugin's icon under the directory's rules
 * (ICON_LIMITS): it must be a complete PNG (pngSize), square, 512 to 2048 px
 * a side and under 2 MB. Empty when it can be. A JPEG, SVG or WebP is
 * refused too, as the icon's path promises a PNG.
 */
export function iconViolations(content) {
  const at = forLog(FILES.icon);
  const { minSide, maxSide, bytes } = ICON_LIMITS;
  const rule =
    `The directory takes a square PNG, ${minSide} to ${maxSide} px a side ` +
    `and under 2 MB, as the icon.`;
  const violations = [];
  if (content.length >= bytes) {
    violations.push(
      `${at}: is ${content.length} bytes, at or over ${bytes}. ${rule}`
    );
  }
  const { width, height, problem } = pngSize(content);
  if (problem) violations.push(`${at}: ${problem}. ${rule}`);
  else if (width !== height || width < minSide || width > maxSide) {
    violations.push(`${at}: is ${width} by ${height} px. ${rule}`);
  }
  return violations;
}

/**
 * Why `content` cannot be the Cursor logo: the marketplace asks for a square
 * logo with a background plate, so it must be a complete PNG (pngSize),
 * square, and unable to hold a transparent pixel. Empty when it can be.
 */
export function logoViolations(content) {
  const at = forLog(FILES.logo);
  const rule =
    'The Cursor Marketplace takes a square logo with a background plate, ' +
    'as a PNG with no alpha channel and no transparent colour.';
  const { width, height, transparent, problem } = pngSize(content);
  if (problem) return [`${at}: ${problem}. ${rule}`];
  const violations = [];
  if (width !== height) {
    violations.push(`${at}: is ${width} by ${height} px. ${rule}`);
  }
  if (transparent) {
    violations.push(`${at}: can hold transparent pixels. ${rule}`);
  }
  return violations;
}

/**
 * Everything wrong with a tree against the directory's checks. `entries` are
 * `{ path, content, symlink }` with POSIX paths relative to the tree root and
 * `content` a Buffer (null for a symbolic link). Every path in a message goes
 * through forLog. Pure, so fixtures reach each rule.
 */
export function treeViolations(entries) {
  const violations = [];
  const byPath = new Map();
  for (const entry of entries) byPath.set(entry.path, entry.content);

  if (entries.length > LIMITS.files) {
    violations.push(
      `the tree holds ${entries.length} files, over the directory's limit of ` +
        `${LIMITS.files}.`
    );
  }
  // A README that is a link has no content here. The loop below reports it.
  if (!byPath.has(FILES.readme)) violations.push('README.md: missing.');
  else if (byPath.get(FILES.readme)) {
    const readme = byPath.get(FILES.readme).toString('utf8');
    const words = readmeWordCount(readme);
    if (words < LIMITS.readmeWords) {
      violations.push(
        `README.md: has ${words} words outside code, and the directory needs ` +
          `at least ${LIMITS.readmeWords}.`
      );
    }
    if (readme.includes('bestax:generated')) {
      violations.push(
        'README.md: still carries a bestax:generated marker, which only the ' +
          'template should hold.'
      );
    }
  }
  if (!byPath.has('LICENSE')) violations.push('LICENSE: missing.');
  if (!byPath.has(FILES.icon)) violations.push(`${FILES.icon}: missing.`);
  if (!byPath.has(FILES.logo)) violations.push(`${FILES.logo}: missing.`);
  if (![...byPath.keys()].some(p => /^skills\/[^/]+\/SKILL\.md$/.test(p))) {
    violations.push('skills/: holds no skills/<name>/SKILL.md.');
  }

  const seen = new Map();
  for (const { path, content, symlink } of entries) {
    const at = forLog(path);
    const segments = path.split('/');
    const base = segments.at(-1);
    if (symlink) {
      violations.push(`${at}: is a symbolic link. Commit a regular file.`);
      continue;
    }
    if (
      SYSTEM_FILES.has(base.toLowerCase()) ||
      segments.some(s => s === '__MACOSX')
    ) {
      violations.push(`${at}: is a macOS or Windows system file.`);
      continue;
    }
    if (PACKAGE_MANAGER_CONFIG.has(base.toLowerCase())) {
      violations.push(
        `${at}: is package-manager configuration, which the directory ` +
          `blocks in a plugin that runs npx.`
      );
    }
    if (segments.length === 1 && ROOT_INSTALL_FILES.has(base)) {
      violations.push(
        `${at}: at the plugin root makes Claude Code install dependencies, ` +
          `and the plugin installs nothing.`
      );
    }
    if (segments.some(s => s.startsWith('.')) && !HIDDEN_ALLOWED.has(path)) {
      violations.push(
        `${at}: is hidden, and the plugin ships no hidden files.`
      );
    }
    for (const segment of segments) {
      const problem = nameProblem(segment);
      if (problem) violations.push(`${at}: ${problem}.`);
    }
    for (let i = 1; i <= segments.length; i++) {
      const prefix = segments.slice(0, i).join('/');
      const first = seen.get(prefix.toLowerCase());
      if (first === undefined) seen.set(prefix.toLowerCase(), prefix);
      else if (first !== prefix) {
        violations.push(
          `${forLog(prefix)}: differs from ${forLog(first)} only by case.`
        );
      }
    }
    const size = content.length;
    if (size >= LIMITS.anyBytes) {
      violations.push(`${at}: is ${size} bytes, at or over the 5 MiB limit.`);
    } else if (path === FILES.icon) {
      violations.push(...iconViolations(content));
    } else if (path === FILES.logo) {
      violations.push(...logoViolations(content));
    } else if (!IMAGE_OR_FONT.test(path)) {
      if (size >= LIMITS.textBytes) {
        violations.push(
          `${at}: is ${size} bytes, at or over the 256 KiB limit.`
        );
      }
      if (!isText(content)) {
        violations.push(
          `${at}: is not UTF-8 text. The directory takes text, images and ` +
            `fonts only.`
        );
      }
    }
  }
  // A case collision on a directory repeats once per file inside it.
  return [...new Set([...violations, ...manifestViolations(byPath)])];
}

const UTF8 = new TextDecoder('utf-8', { fatal: true });

function isText(content) {
  if (content.includes(0)) return false;
  try {
    UTF8.decode(content);
    return true;
  } catch {
    return false;
  }
}

/**
 * Why each of INPUT_FILES cannot be read as a vetted input: missing, a
 * symbolic link, not a regular file, or untracked. `tracked` is
 * trackedRepoPaths' answer, and null (no git) skips only the tracked rule,
 * as the skills' gate does.
 */
export async function inputProblems(repo, tracked) {
  const problems = [];
  for (const file of INPUT_FILES) {
    const at = forLog(file);
    const info = await lstat(join(repo, file)).catch(() => null);
    if (!info) problems.push(`${at}: is missing.`);
    else if (info.isSymbolicLink()) {
      problems.push(`${at}: is a symbolic link. Commit a regular file.`);
    } else if (!info.isFile()) problems.push(`${at}: is not a regular file.`);
    else if (tracked && !tracked.includes(file)) {
      problems.push(
        `${at}: is not tracked by git. \`git add\` it to vet it, as the ` +
          `skill syncs require.`
      );
    }
  }
  return problems;
}

/**
 * The number of commits on HEAD in `repo` that touched CONTENT_PATHS, by
 * `git rev-list --count`. Throws a refusal naming the cause when git cannot
 * count: no git, no repository or another one (rootGit), no HEAD, or a
 * shallow clone, whose count would be too low and take the version back.
 */
export function inputCommitCount(repo) {
  const shallow = rootGit(repo, repo, [
    'rev-parse',
    '--is-shallow-repository',
  ]).trim();
  if (shallow !== 'false') {
    throw skillRefusal(
      `${repo} is a shallow clone, so git cannot count every commit that ` +
        `touched the plugin's inputs, and the version would go back. Fetch ` +
        `the whole history, as actions/checkout does with fetch-depth: 0.`
    );
  }
  const pathspecs = CONTENT_PATHS.map(p => `:(glob)${p}`);
  const out = rootGit(repo, repo, [
    'rev-list',
    '--count',
    'HEAD',
    '--',
    ...pathspecs,
  ]).trim();
  if (!/^\d+$/.test(out)) {
    throw skillRefusal(`git rev-list --count printed ${forLog(out)}.`);
  }
  return Number(out);
}

/**
 * The Agent Plugins version: the template's MAJOR.MINOR, then `commits`,
 * inputCommitCount's answer, plus `format` as the patch. A minor bump keeps
 * the version rising whatever the count does, which is why dropping a path
 * from CONTENT_PATHS goes with one.
 */
export function pluginVersion(majorMinor, commits, format = OUTPUT_FORMAT) {
  if (!Number.isSafeInteger(commits) || commits < 0) {
    throw skillRefusal(
      `the input commit count must be a whole number, not ${forLog(commits)}.`
    );
  }
  return `${majorMinor}.${commits + format}`;
}

/** The mode git would record for a file of `mode`: 0755 or 0644. */
export function fileMode(mode) {
  return mode & 0o100 ? 0o755 : 0o644;
}

/** A tree entry for the file at `full`, with its bytes and fileMode. */
async function fileEntry(path, full) {
  const [content, info] = await Promise.all([readFile(full), stat(full)]);
  return { path, content, mode: fileMode(info.mode) };
}

/** readJson for an input, its failure a refusal like the checks' own. */
function readInput(repo, file) {
  try {
    return readJson(join(repo, file));
  } catch (err) {
    throw skillRefusal(err.message, { cause: err });
  }
}

/**
 * Every input, read from `repo`. The inputs outside skills/ are checked
 * first and stop the run before any is read. The skill files are the ones
 * vettedSkillFiles lists, so a symbolic link or an untracked file in a skill
 * stops the run as it stops the syncs, and nothing it did not list is read.
 *
 * `requireCheckout` makes a failed git listing a refusal rather than a
 * skipped gate. `inputCommits` stands in for inputCommitCount, so a test
 * gets the same version on any clone.
 */
export async function readSources(
  repo = REPO,
  { requireCheckout = false, inputCommits } = {}
) {
  const blocked = await inputProblems(
    repo,
    trackedRepoPaths(repo, INPUT_FILES, { requireCheckout })
  );
  if (blocked.length) throw new TreeError(blocked);

  const template = checkTemplate(readInput(repo, TEMPLATE.manifest));
  const version = pluginVersion(
    template.plugin.version,
    inputCommits ?? inputCommitCount(repo)
  );
  let launch;
  try {
    const { server, manifest } = readServer(join(repo, MCP_DIR));
    launch = mcpLaunch(server, manifest);
  } catch (err) {
    throw skillRefusal(
      `${MCP_DIR}/server.json no longer gives the plugin an npm package to ` +
        `start over stdio: ${err.message}`,
      { cause: err }
    );
  }
  const skillsDir = join(repo, 'skills');
  const names = await readSkillNames(skillsDir);
  if (!names.length) throw skillRefusal(`${repo}/skills holds no skills.`);
  const skills = skillIndex(readInput(repo, SKILL_INDEX), names);
  const readme = Buffer.from(
    renderReadme(
      await readFile(join(repo, TEMPLATE.readme), 'utf8'),
      skills,
      launch
    )
  );
  const icon = await fileEntry(FILES.icon, join(repo, TEMPLATE.icon));
  const logo = await fileEntry(FILES.logo, join(repo, TEMPLATE.logo));
  const copied = [];
  for (const file of COPIED)
    copied.push(await fileEntry(file, join(repo, file)));

  const skillFiles = [];
  for (const { name, dir, files } of await vettedSkillFiles(
    skillsDir,
    names,
    'publish',
    { requireCheckout }
  )) {
    for (const rel of files) {
      skillFiles.push(await fileEntry(`skills/${name}/${rel}`, join(dir, rel)));
    }
  }
  return { template, version, readme, launch, icon, logo, copied, skillFiles };
}

/** Writes `tree` into `outDir`, which must be empty or not exist yet. */
export async function writeTree(outDir, tree) {
  let existing = [];
  try {
    existing = await readdir(outDir);
  } catch (err) {
    if (err?.code !== 'ENOENT') throw err;
  }
  if (existing.length) {
    throw skillRefusal(
      `${outDir} is not empty. Give a new or empty directory, so no stale ` +
        `file survives into the published tree.`
    );
  }
  for (const [path, { content, mode }] of tree) {
    const target = join(outDir, ...path.split('/'));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
    // chmod rather than writeFile's mode, which the umask would trim.
    await chmod(target, mode);
  }
}

/** Every file under `dir` as treeViolations entries, never following a link. */
export async function scanTree(dir, prefix = '') {
  const entries = [];
  const names = (await readdir(join(dir, prefix))).sort(byCodePoint);
  for (const name of names) {
    const rel = prefix ? `${prefix}/${name}` : name;
    const full = join(dir, rel);
    const info = await lstat(full);
    if (info.isSymbolicLink())
      entries.push({ path: rel, content: null, symlink: true });
    else if (info.isDirectory()) entries.push(...(await scanTree(dir, rel)));
    else
      entries.push({
        path: rel,
        content: await readFile(full),
        mode: info.mode & 0o777,
        symlink: false,
      });
  }
  return entries;
}

const octal = mode => `0${mode.toString(8)}`;

/** Files whose bytes or mode differ between the plan and the disk. */
export function planMismatch(tree, written) {
  const onDisk = new Map(written.map(e => [e.path, e]));
  const problems = [];
  for (const [path, { content, mode }] of tree) {
    const got = onDisk.get(path);
    if (!got?.content) {
      problems.push(`${forLog(path)}: was planned but is not on disk.`);
      continue;
    }
    if (!got.content.equals(content)) {
      problems.push(`${forLog(path)}: on disk differs from the plan.`);
    }
    if (got.mode !== mode) {
      problems.push(
        `${forLog(path)}: has mode ${octal(got.mode)} on disk, and the ` +
          `plan has ${octal(mode)}.`
      );
    }
  }
  for (const path of onDisk.keys()) {
    if (!tree.has(path))
      problems.push(`${forLog(path)}: is on disk but was not planned.`);
  }
  return problems;
}

/**
 * Resolves when the npm registry serves `pin`, the exact name@version the
 * plugin's npx starts, and throws a refusal otherwise. It fails closed: a
 * registry that never answers is a refusal too.
 *
 * bestax-mcp/package.json on main can name a version npm does not serve.
 * semantic-release runs every prepare step before any publish step, so
 * @semantic-release/git pushes the release commit before
 * @semantic-release/exec runs `pnpm publish`, and a publish that fails
 * leaves main at the new version. A tree built then would send every plugin
 * user to an npx 404. `fetchOptions` go to fetchWithRetry, for tests.
 */
export async function assertPublished(pin, fetchOptions = {}) {
  const at = pin.lastIndexOf('@');
  const name = pin.slice(0, at);
  const version = pin.slice(at + 1);
  const url =
    `${NPM_REGISTRY}/${name.replace('/', '%2f')}/` +
    encodeURIComponent(version);
  const res = await fetchWithRetry(url, {
    attempts: PUBLISHED_BACKOFF_MS.length + 1,
    backoffMs: PUBLISHED_BACKOFF_MS,
    methods: ['GET'],
    alsoRetryable: [404],
    ...fetchOptions,
  });
  if (res.outcome === 'ok') return;
  if (res.status === 404) {
    throw skillRefusal(
      `npm does not serve ${forLog(pin)}: ${url} answered ` +
        `${forLog(res.detail)} on each of ${res.attempts} asks. ` +
        `${MCP_DIR}/package.json names a version that is not published, as ` +
        `after a release whose publish failed, and the plugin's npx would ` +
        `fail for every user. Publish it, and the next run carries it over.`
    );
  }
  throw skillRefusal(
    `could not ask npm whether it serves ${forLog(pin)} ` +
      `(${forLog(res.detail ?? res.outcome)}), so nothing was published. ` +
      `Run the workflow again.`
  );
}

/**
 * Reads, checks, writes and checks again. Returns the sorted file list, or
 * throws a TreeError listing every problem. `options` go to readSources,
 * and `requirePublished` runs assertPublished on the pin first, with
 * `fetchOptions`.
 */
export async function generate(outDir, repo = REPO, options = {}) {
  const sources = await readSources(repo, options);
  if (options.requirePublished) {
    await assertPublished(sources.launch.pin, options.fetchOptions);
  }
  const tree = buildTree(sources);
  const before = treeViolations(planEntries(tree));
  if (before.length) throw new TreeError(before);
  await writeTree(outDir, tree);
  const written = await scanTree(outDir);
  const after = [...treeViolations(written), ...planMismatch(tree, written)];
  if (after.length) throw new TreeError(after);
  return [...tree.keys()];
}

/**
 * The command line: `[--require-checkout] [--require-published] <output
 * directory>`. `repo`, `inputCommits` and `fetchOptions` are for tests, as
 * in readSources and assertPublished.
 */
export async function main(
  argv = process.argv.slice(2),
  io = process,
  { repo = REPO, inputCommits, fetchOptions } = {}
) {
  const known = [REQUIRE_CHECKOUT, REQUIRE_PUBLISHED];
  const flags = argv.filter(a => a.startsWith('-'));
  const dirs = argv.filter(a => !a.startsWith('-'));
  if (
    dirs.length !== 1 ||
    new Set(flags).size !== flags.length ||
    flags.some(f => !known.includes(f))
  ) {
    io.stderr.write(
      `usage: node scripts/gen-skills-repo.mjs ` +
        `${known.map(f => `[${f}]`).join(' ')} <output directory>\n`
    );
    return 2;
  }
  const outDir = resolve(dirs[0]);
  try {
    const files = await generate(outDir, repo, {
      requireCheckout: flags.includes(REQUIRE_CHECKOUT),
      requirePublished: flags.includes(REQUIRE_PUBLISHED),
      inputCommits,
      fetchOptions,
    });
    io.stdout.write(`Wrote the bestax-skills tree to ${outDir}:\n`);
    for (const file of files) io.stdout.write(`  ${file}\n`);
    return 0;
  } catch (err) {
    // A TreeError's problems are escaped where they are made. Anything else
    // goes through forLog, since it can quote a path: failureText gives a
    // refusal's message and the stack of an unexpected error.
    const problems =
      err instanceof TreeError ? err.problems : [forLog(failureText(err))];
    io.stderr.write(
      'gen-skills-repo: the bestax-skills tree failed its checks:\n'
    );
    for (const problem of problems) io.stderr.write(`  ${problem}\n`);
    return 1;
  }
}

if (isMainModule(import.meta.url)) {
  process.exitCode = await main();
}
