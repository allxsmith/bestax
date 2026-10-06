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
 * The Agent Plugins manifest's version is MAJOR.MINOR from the template and
 * a patch: the commits on HEAD that touched CONTENT_PATHS, the paths whose
 * bytes reach the tree, plus OUTPUT_FORMAT. main is squash-merged and never
 * rewritten, so the count only grows, and a catalog that pins the version
 * sees every content change. A commit to this script alone does not count.
 * One that changes the output raises OUTPUT_FORMAT, which the test sibling
 * enforces. Git that cannot count, or a shallow clone, is a refusal.
 * pluginVersion has the rest.
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
 * Before writing, and again on what landed on disk, the tree is held to
 * Anthropic's plugin directory checks
 * (https://claude.com/docs/plugins/pre-submission-checklist) in
 * treeViolations, so a skill change that would block or hold a directory
 * listing fails here, in the PR's test run, instead of after publishing.
 * That is also where a hidden file in a skill is refused, since skillFiles
 * lists one and the plugin ships none.
 *
 * Pure apart from inputCommitCount, readSources, writeTree, scanTree,
 * generate and main, and it imports node: builtins and local modules only,
 * so the workflow's generate job runs it with the runner's Node and no
 * install.
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
import { isMainModule } from './lib/main-module.mjs';
import { readJson, readServer } from './mcp-registry-publish.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');

export const TEMPLATE = {
  manifest: 'plugin/manifest.json',
  readme: 'plugin/README.md',
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
  `${MCP_DIR}/package.json`,
  `${MCP_DIR}/server.json`,
  SKILL_INDEX,
  ...COPIED,
];

/**
 * Every path whose bytes reach the tree: the skills and INPUT_FILES. The
 * version's patch counts the commits on HEAD that touched one of them
 * (inputCommitCount), so a commit that changes only the generator's code
 * does not move it. OUTPUT_FORMAT covers the code instead.
 *
 * Adding a path only adds commits to the count. Dropping or renaming one can
 * lower it, as the commits that touched only that path stop counting, so a
 * change that drops a path also bumps the minor in plugin/manifest.json.
 */
export const CONTENT_PATHS = [
  'skills/**',
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
 * equal and the list to the generator's imports. A run for a code change
 * publishes only when the tree it writes differs from the published one.
 */
export const PUBLISH_PATHS = [
  ...CONTENT_PATHS,
  'scripts/gen-skills-repo.mjs',
  'scripts/lib/skills.mjs',
  'scripts/lib/api-page.mjs',
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
 * the OUTPUT_FORMAT it was recorded at. A change that alters the output
 * fails that test until this is raised and the hash pinned again. A change
 * that leaves the output alone, such as one to comments, passes.
 */
export const OUTPUT_FORMAT = 1;

/** The flag the generate job passes, so a failed git listing stops the run. */
export const REQUIRE_CHECKOUT = '--require-checkout';

/** The generated regions plugin/README.md must carry. */
export const README_REGIONS = { skills: 'skills', mcp: 'mcp-server' };

export const AGENT_PLUGIN_SCHEMA =
  'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
export const AGENT_MCP_SCHEMA =
  'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json';

/**
 * Every key the template may hold, by section. Each one is placed by a
 * render function below. `plugin.version` is MAJOR.MINOR, and only the
 * Agent Plugins manifest carries the full version (see renderClaudeManifest
 * and pluginVersion).
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
  marketplace: ['name', 'description', 'owner'],
};

/** The generated files besides the copies and the skills. */
export const FILES = {
  marketplace: '.claude-plugin/marketplace.json',
  claude: '.claude-plugin/plugin.json',
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

/** The hand-owned part of the plugin version, such as 1.0. */
export const MAJOR_MINOR = /^(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/** The checklist's plugin name rule. */
export const PLUGIN_NAME = /^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/;

/** Claude Code's marketplace name rule (marketplace-reference). */
export const MARKETPLACE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** Exempt from the text and 256 KiB rules, though not from the 5 MiB one. */
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

/** The only hidden paths the tree has, both generated here. */
const HIDDEN_ALLOWED = new Set([FILES.marketplace, FILES.claude]);

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

  const { plugin, claude, marketplace } = template;
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
 * No `version`, on purpose. Claude Code keeps every user on a manifest's
 * `version` until the string changes, and without one it versions the plugin
 * by the commit it installed. bestax-skills only gets a commit when its tree
 * changes, so users can update to every one. A version here would hold them
 * back until it changed. Anthropic's directory only warns about the missing
 * field.
 */
export function renderClaudeManifest(template, pin) {
  const { plugin, claude } = template;
  return {
    name: plugin.name,
    description: plugin.description,
    author: plugin.author,
    homepage: plugin.homepage,
    repository: plugin.repository,
    license: plugin.license,
    keywords: plugin.keywords,
    privacyPolicyUrl: claude.privacyPolicyUrl,
    supportUrl: claude.supportUrl,
    mcpServers: { [MCP_SERVER]: mcpServer(pin) },
  };
}

/**
 * The vendor-neutral Agent Plugins manifest, which Cursor, Kiro and the
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
  copied,
  skillFiles,
}) {
  const tree = new Map([
    [FILES.marketplace, json(renderMarketplace(template))],
    [FILES.claude, json(renderClaudeManifest(template, launch.pin))],
    [FILES.agent, json(renderAgentManifest(template, version))],
    [FILES.mcp, json(renderMcpConfig(launch.pin))],
    [FILES.readme, generated(readme)],
  ]);
  for (const { path, content, mode } of [...copied, ...skillFiles]) {
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
  const claude = read(FILES.claude);
  const agent = read(FILES.agent);
  const marketplace = read(FILES.marketplace);
  const mcp = read(FILES.mcp);
  for (const [file, manifest] of [
    [FILES.claude, claude],
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
    const target = agent.mcpServers.replace(/^\.\//, '');
    if (!byPath.has(target)) {
      violations.push(
        `${FILES.agent}: mcpServers names ${forLog(agent.mcpServers)}, ` +
          `which is not in the tree.`
      );
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
  const pathspecs = CONTENT_PATHS.map(p => p.replace(/\/\*\*$/, '/'));
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
  return { template, version, readme, launch, copied, skillFiles };
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
 * Reads, checks, writes and checks again. Returns the sorted file list, or
 * throws a TreeError listing every problem. `options` go to readSources.
 */
export async function generate(outDir, repo = REPO, options = {}) {
  const sources = await readSources(repo, options);
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
 * The command line: `[--require-checkout] <output directory>`. `repo` and
 * `inputCommits` are for tests, as in readSources.
 */
export async function main(
  argv = process.argv.slice(2),
  io = process,
  { repo = REPO, inputCommits } = {}
) {
  const flags = argv.filter(a => a.startsWith('-'));
  const dirs = argv.filter(a => !a.startsWith('-'));
  if (
    dirs.length !== 1 ||
    flags.length > 1 ||
    flags.some(f => f !== REQUIRE_CHECKOUT)
  ) {
    io.stderr.write(
      `usage: node scripts/gen-skills-repo.mjs [${REQUIRE_CHECKOUT}] ` +
        `<output directory>\n`
    );
    return 2;
  }
  const outDir = resolve(dirs[0]);
  try {
    const files = await generate(outDir, repo, {
      requireCheckout: flags.length === 1,
      inputCommits,
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
