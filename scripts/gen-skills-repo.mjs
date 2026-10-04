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
 * Without git, as in an exported tree, this does what the sync scripts do.
 * The lib's gate has nothing to vet against, so the skill directories are
 * read from disk, minus `.DS_Store`. An export from `git archive` holds only
 * tracked files, and the publish job always runs on a checkout, where the
 * gate is live.
 *
 * Before writing, and again on what landed on disk, the tree is held to
 * Anthropic's plugin directory checks
 * (https://claude.com/docs/plugins/pre-submission-checklist) in
 * treeViolations, so a skill change that would block or hold a directory
 * listing fails here, in the PR's test run, instead of after publishing.
 * That is also where a hidden file in a skill is refused, since skillFiles
 * lists one and the plugin ships none.
 *
 * Pure apart from readSources, writeTree, scanTree, generate and main, and it
 * imports node: builtins and local modules only, so the publish job runs it
 * with the runner's Node and no install.
 */
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
  skillRefusal,
  trackedRepoPaths,
  vettedSkillFiles,
} from './lib/skills.mjs';
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

/** The generated regions plugin/README.md must carry. */
export const README_REGIONS = { skills: 'skills', mcp: 'mcp-server' };

export const AGENT_PLUGIN_SCHEMA =
  'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
export const AGENT_MCP_SCHEMA =
  'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json';

/**
 * Every key the template may hold, by section. Each one is placed by a
 * render function below. `plugin.version` goes into the Agent Plugins
 * manifest only (see renderClaudeManifest).
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

/** Commands that download a package and run it (the checklist's list). */
const LAUNCHERS = new Set(['npx', 'bunx', 'uvx', 'pipx', 'pnpm', 'yarn', 'uv']);

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
  if (typeof plugin.version !== 'string' || !SEMVER.test(plugin.version)) {
    problems.push(
      `${file}: plugin.version must be a semantic version such as 1.0.0, ` +
        `not ${forLog(plugin.version)}.`
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
 * The published README: the template with its regions filled and every
 * marker stripped. Throws when a region is missing, rather than publish a
 * README whose lists silently stopped updating.
 */
export function renderReadme(src, skills, launch) {
  const label = TEMPLATE.readme;
  const regions = readRegions(src, label);
  const missing = Object.values(README_REGIONS).filter(id => !regions.has(id));
  if (missing.length) {
    throw skillRefusal(
      `${label}: has no <!-- bestax:generated ${missing.join(' / ')} --> ` +
        `marker pair, so the README cannot say what the plugin carries. ` +
        `Restore the markers.`
    );
  }
  let out = replaceRegion(
    src,
    README_REGIONS.skills,
    renderSkillList(skills),
    label
  );
  out = replaceRegion(out, README_REGIONS.mcp, renderMcpServer(launch), label);
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
 * changes, so each commit is a real change and users can update to every
 * one. A hand-owned version would hold them back until someone remembered to
 * bump it. Anthropic's directory only warns about the missing field.
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
 * Grok Build prefer to `.claude-plugin/`. Its `version` is the hand-owned
 * one, for the catalogs that pin a release.
 *
 * `mcpServers` is not in the Agent Plugins schema. Its clients find
 * `mcp.json` by location, and the spec has them report and ignore an unknown
 * top-level field. Grok Build reads this file first, though, and without the
 * field it looks for `.mcp.json`, so dropping it would cost Grok the server.
 */
export function renderAgentManifest(template) {
  const { plugin } = template;
  return {
    $schema: AGENT_PLUGIN_SCHEMA,
    name: plugin.name,
    version: plugin.version,
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

const json = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);

/**
 * The complete tree as a Map of repo-relative path to contents, from what
 * readSources returned (or a fixture of the same shape).
 */
export function buildTree({ template, readme, launch, copied, skillFiles }) {
  const tree = new Map([
    [FILES.marketplace, json(renderMarketplace(template))],
    [FILES.claude, json(renderClaudeManifest(template, launch.pin))],
    [FILES.agent, json(renderAgentManifest(template))],
    [FILES.mcp, json(renderMcpConfig(launch.pin))],
    [FILES.readme, readme],
  ]);
  for (const [path, content] of copied) tree.set(path, content);
  for (const { path, content } of skillFiles) tree.set(path, content);
  return new Map([...tree].sort(([a], [b]) => byCodePoint(a, b)));
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
 * An npm package spec pinned to one exact version, such as `name@1.2.3`,
 * split on its last `@` the way release tags are.
 */
/**
 * A package name on the npm registry, scoped or not. A git, URL or file spec
 * such as github:owner/repo@1.0.0 also ends in @<version>, so the name is held
 * to the registry's grammar before the version counts as an exact pin.
 */
const NPM_NAME = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/;

export function exactNpmSpec(spec) {
  const parsed = parseReleaseTag(spec);
  return Boolean(
    parsed && NPM_NAME.test(parsed.package) && SEMVER.test(parsed.version)
  );
}

/**
 * Each MCP server in `servers` (an mcpServers map) that runs a launcher
 * without an exact pin. Only npx is understood. Any other launcher fails
 * until a pin check for it is written, rather than passing unchecked.
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
    // and NPX.EXE all launch npx.
    const command = server.command
      .split(/[\\/]/)
      .pop()
      .toLowerCase()
      .replace(/\.(?:cmd|exe|bat|ps1)$/, '');
    if (command === 'npx') {
      const args = Array.isArray(server.args) ? server.args : [];
      if (args.some(a => a === '-p' || String(a).startsWith('--package'))) {
        violations.push(
          `${where} passes npx a package flag, which this check does not ` +
            `read. Give the pinned package as the first argument instead.`
        );
        continue;
      }
      const spec = args.find(a => typeof a === 'string' && !a.startsWith('-'));
      if (!spec || !exactNpmSpec(spec)) {
        violations.push(
          `${where} runs npx ${spec ? forLog(spec) : '(no package)'}, which ` +
            `is not pinned to an exact version. Anthropic's directory blocks ` +
            `an unpinned npx launcher. Pin it as name@1.2.3.`
        );
      }
    } else if (LAUNCHERS.has(command)) {
      violations.push(
        `${where} runs ${forLog(command)}, a package launcher this check ` +
          `cannot read. Add a pin check for it to launcherViolations first.`
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
  if (!byPath.has(FILES.readme)) violations.push('README.md: missing.');
  else {
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
 */
export async function readSources(repo = REPO) {
  const blocked = await inputProblems(
    repo,
    trackedRepoPaths(repo, INPUT_FILES)
  );
  if (blocked.length) throw new TreeError(blocked);

  const template = checkTemplate(readInput(repo, TEMPLATE.manifest));
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
    copied.push([file, await readFile(join(repo, file))]);

  const skillFiles = [];
  for (const { name, dir, files } of await vettedSkillFiles(
    skillsDir,
    names,
    'publish'
  )) {
    for (const rel of files) {
      skillFiles.push({
        path: `skills/${name}/${rel}`,
        content: await readFile(join(dir, rel)),
      });
    }
  }
  return { template, readme, launch, copied, skillFiles };
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
  for (const [path, content] of tree) {
    const target = join(outDir, ...path.split('/'));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
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
        symlink: false,
      });
  }
  return entries;
}

/** Files that differ between the plan and what landed on disk. */
export function planMismatch(tree, written) {
  const onDisk = new Map(written.map(e => [e.path, e.content]));
  const problems = [];
  for (const [path, content] of tree) {
    const got = onDisk.get(path);
    if (!got) problems.push(`${forLog(path)}: was planned but is not on disk.`);
    else if (!got.equals(content)) {
      problems.push(`${forLog(path)}: on disk differs from the plan.`);
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
 * throws a TreeError listing every problem.
 */
export async function generate(outDir, repo = REPO) {
  const sources = await readSources(repo);
  const tree = buildTree(sources);
  const planned = [...tree].map(([path, content]) => ({
    path,
    content,
    symlink: false,
  }));
  const before = treeViolations(planned);
  if (before.length) throw new TreeError(before);
  await writeTree(outDir, tree);
  const written = await scanTree(outDir);
  const after = [...treeViolations(written), ...planMismatch(tree, written)];
  if (after.length) throw new TreeError(after);
  return [...tree.keys()];
}

export async function main(argv = process.argv.slice(2), io = process) {
  if (argv.length !== 1 || argv[0].startsWith('-')) {
    io.stderr.write(
      'usage: node scripts/gen-skills-repo.mjs <output directory>\n'
    );
    return 2;
  }
  const outDir = resolve(argv[0]);
  try {
    const files = await generate(outDir);
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

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = await main();
}
