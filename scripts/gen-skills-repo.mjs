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
 * goes here, in `plugin/`, or in `skills/`.
 *
 * Inputs, all read at generation time:
 *
 * - `plugin/manifest.json`: the hand-written manifest fields, in three
 *   sections. `plugin` goes into both plugin manifests, `claude` into the
 *   Claude one only, and `marketplace` into marketplace.json. A key this
 *   script does not place fails (TEMPLATE_KEYS), so a new field is placed on
 *   purpose instead of vanishing.
 * - `plugin/README.md`: the repository's README, copied as is.
 * - `bestax-mcp/package.json`: the exact version the MCP server is pinned to.
 * - every tracked file of every skill directory (`skills/<name>/` holding a
 *   SKILL.md, read with scripts/lib/skills.mjs), and LICENSE and NOTICE from
 *   the repo root. skills/README.md and skills/CLAUDE.md describe the
 *   monorepo, not the plugin, so they stay here.
 *
 * Before writing, and again on what landed on disk, the tree is held to
 * Anthropic's plugin directory checks
 * (https://claude.com/docs/plugins/pre-submission-checklist) in
 * treeViolations, so a skill change that would block or hold a directory
 * listing fails here, in the PR's test run, instead of after publishing.
 *
 * Pure apart from readSources, writeTree, scanTree, generate and main, and it
 * imports node: builtins and local modules only, so the publish job runs it
 * with the runner's Node and no install.
 */
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SEMVER } from './consumer-sbom-meta.mjs';
import {
  byCodePoint,
  pathsInsideSkills,
  readSkillNames,
} from './lib/skills.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');

export const TEMPLATE = {
  manifest: 'plugin/manifest.json',
  readme: 'plugin/README.md',
};

/** Repo-root files copied into the tree under the same name. */
export const COPIED = ['LICENSE', 'NOTICE'];

export const MCP_PACKAGE = 'bestax-mcp/package.json';
export const MCP_SERVER = 'bestax';

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

/** A problem list, thrown as one error so every problem is reported at once. */
export class TreeError extends Error {
  constructor(problems) {
    super(problems.join('\n'));
    this.name = 'TreeError';
    this.problems = problems;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseObject(text, file) {
  let value;
  try {
    value = JSON.parse(text);
  } catch (err) {
    throw new Error(`${file}: is not valid JSON (${err.message}).`, {
      cause: err,
    });
  }
  if (!isObject(value)) throw new Error(`${file}: is not a JSON object.`);
  return value;
}

/**
 * The template, checked. Throws one TreeError naming every problem: an
 * unknown section or key, a missing key, or a value of the wrong shape.
 */
export function parseTemplate(text) {
  const file = TEMPLATE.manifest;
  const template = parseObject(text, file);
  const problems = [];
  for (const section of Object.keys(template)) {
    if (!(section in TEMPLATE_KEYS)) {
      problems.push(
        `${file}: section "${section}" is not one gen-skills-repo places. ` +
          `Use one of ${Object.keys(TEMPLATE_KEYS).join(', ')}.`
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
          `${file}: ${section}.${key} is not placed in any generated file. ` +
            `Place it in a render function in scripts/gen-skills-repo.mjs, ` +
            `then list it in TEMPLATE_KEYS.`
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
      `${file}: plugin.name ${JSON.stringify(plugin.name)} must be lowercase ` +
        `letters, digits and hyphens, at most 64 characters, starting and ` +
        `ending with a letter or digit.`
    );
  }
  if (typeof plugin.version !== 'string' || !SEMVER.test(plugin.version)) {
    problems.push(
      `${file}: plugin.version must be a semantic version such as 1.0.0, ` +
        `not ${JSON.stringify(plugin.version)}.`
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
      `${file}: marketplace.name ${JSON.stringify(marketplace.name)} must be ` +
        `letters, digits, dots, underscores and hyphens, starting with a ` +
        `letter or digit.`
    );
  }
  string(marketplace.description, 'marketplace.description');
  person(marketplace.owner, 'marketplace.owner');
  if (problems.length) throw new TreeError(problems);
  return template;
}

/**
 * `bestax-mcp@<exact version>` from bestax-mcp's package.json. The
 * directory blocks an npx launcher pinned to a range or `@latest`, and an
 * exact pin read at generation time follows every release with nothing to
 * bump by hand: a release run of skills-publish.yml republishes the tree.
 */
export function mcpPin(text) {
  const file = MCP_PACKAGE;
  const pkg = parseObject(text, file);
  if (pkg.name !== 'bestax-mcp') {
    throw new Error(
      `${file}: "name" is ${JSON.stringify(pkg.name)}, not "bestax-mcp".`
    );
  }
  if (typeof pkg.version !== 'string' || !SEMVER.test(pkg.version)) {
    throw new Error(
      `${file}: "version" is ${JSON.stringify(pkg.version)}, not an exact ` +
        `semantic version, so the plugin has no version to pin.`
    );
  }
  return `bestax-mcp@${pkg.version}`;
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
export function buildTree({ template, readme, pin, copied, skillFiles }) {
  const tree = new Map([
    [FILES.marketplace, json(renderMarketplace(template))],
    [FILES.claude, json(renderClaudeManifest(template, pin))],
    [FILES.agent, json(renderAgentManifest(template))],
    [FILES.mcp, json(renderMcpConfig(pin))],
    [FILES.readme, readme],
  ]);
  for (const [path, content] of copied) tree.set(path, content);
  for (const { path, content } of skillFiles) tree.set(path, content);
  return new Map([...tree].sort(([a], [b]) => byCodePoint(a, b)));
}

/**
 * Words in a README outside code, the way the directory counts them: fenced
 * blocks do not count. Inline code, HTML comments and link targets are left
 * out as well, so the count errs low rather than passing a README the
 * directory would call too short.
 */
export function readmeWordCount(text) {
  const prose = text
    .replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[^\n]*$/gm, ' ')
    .replace(/^ {0,3}(`{3,}|~{3,})[\s\S]*$/m, ' ')
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

/** An npm package spec pinned to one exact version: `name@1.2.3`. */
export function exactNpmSpec(spec) {
  const m = /^((?:@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*)@(.+)$/i.exec(spec);
  return Boolean(m && SEMVER.test(m[2]));
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
    const where = `${file}: mcpServers.${name}`;
    if (!isObject(server) || typeof server.command !== 'string') {
      violations.push(`${where} has no command.`);
      continue;
    }
    const command = server.command.split('/').pop();
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
          `${where} runs npx ${spec ?? '(no package)'}, which is not pinned ` +
            `to an exact version. Anthropic's directory blocks an unpinned ` +
            `npx launcher. Pin it as name@1.2.3.`
        );
      }
    } else if (LAUNCHERS.has(command)) {
      violations.push(
        `${where} runs ${command}, a package launcher this check cannot ` +
          `read. Add a pin check for it to launcherViolations first.`
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
    try {
      return parseObject(content.toString('utf8'), file);
    } catch (err) {
      violations.push(err.message);
      return null;
    }
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
        `${file}: name ${JSON.stringify(manifest.name)} does not match ` +
          `${PLUGIN_NAME}.`
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
        `${FILES.agent}: mcpServers names ${agent.mcpServers}, which is not in the tree.`
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
 * `content` a Buffer (null for a symbolic link). Pure, so fixtures reach each
 * rule.
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
    const words = readmeWordCount(byPath.get(FILES.readme).toString('utf8'));
    if (words < LIMITS.readmeWords) {
      violations.push(
        `README.md: has ${words} words outside code, and the directory needs ` +
          `at least ${LIMITS.readmeWords}.`
      );
    }
  }
  if (!byPath.has('LICENSE')) violations.push('LICENSE: missing.');
  if (![...byPath.keys()].some(p => /^skills\/[^/]+\/SKILL\.md$/.test(p))) {
    violations.push('skills/: holds no skills/<name>/SKILL.md.');
  }

  const seen = new Map();
  for (const { path, content, symlink } of entries) {
    const segments = path.split('/');
    const base = segments.at(-1);
    if (symlink) {
      violations.push(`${path}: is a symbolic link. Commit a regular file.`);
      continue;
    }
    if (
      SYSTEM_FILES.has(base.toLowerCase()) ||
      segments.some(s => s === '__MACOSX')
    ) {
      violations.push(`${path}: is a macOS or Windows system file.`);
      continue;
    }
    if (PACKAGE_MANAGER_CONFIG.has(base.toLowerCase())) {
      violations.push(
        `${path}: is package-manager configuration, which the directory ` +
          `blocks in a plugin that runs npx.`
      );
    }
    if (segments.length === 1 && ROOT_INSTALL_FILES.has(base)) {
      violations.push(
        `${path}: at the plugin root makes Claude Code install dependencies, ` +
          `and the plugin installs nothing.`
      );
    }
    if (segments.some(s => s.startsWith('.')) && !HIDDEN_ALLOWED.has(path)) {
      violations.push(
        `${path}: is hidden, and the plugin ships no hidden files.`
      );
    }
    for (const segment of segments) {
      const problem = nameProblem(segment);
      if (problem) violations.push(`${path}: ${problem}.`);
    }
    for (let i = 1; i <= segments.length; i++) {
      const prefix = segments.slice(0, i).join('/');
      const first = seen.get(prefix.toLowerCase());
      if (first === undefined) seen.set(prefix.toLowerCase(), prefix);
      else if (first !== prefix) {
        violations.push(`${prefix}: differs from ${first} only by case.`);
      }
    }
    const size = content.length;
    if (size >= LIMITS.anyBytes) {
      violations.push(`${path}: is ${size} bytes, at or over the 5 MiB limit.`);
    } else if (!IMAGE_OR_FONT.test(path)) {
      if (size >= LIMITS.textBytes) {
        violations.push(
          `${path}: is ${size} bytes, at or over the 256 KiB limit.`
        );
      }
      if (!isText(content)) {
        violations.push(
          `${path}: is not UTF-8 text. The directory takes text, images and ` +
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
 * The tracked files under `dir` (relative to `repo`), as git prints them.
 * Throws unless `repo` is the top of a git checkout: an exported tree has no
 * record of which files were vetted, and a checkout further up would answer
 * for the wrong repository. `run` is injectable for tests.
 */
export function trackedFiles(repo, dir, run = execFileSync) {
  const git = args =>
    run('git', ['-C', repo, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  const notCheckout =
    `${repo} is not the top of a git checkout, so which skill files are ` +
    `tracked is unknown. Run this from a clone of allxsmith/bestax.`;
  let toplevel;
  try {
    toplevel = git(['rev-parse', '--show-toplevel']).trim();
  } catch (err) {
    throw new Error(notCheckout, { cause: err });
  }
  if (realpathSync(toplevel) !== realpathSync(repo))
    throw new Error(notCheckout);
  return git(['ls-files', '-z', '--', dir]).split('\0').filter(Boolean);
}

/**
 * Every input, read from `repo`. A tracked skill file that is hidden or a
 * symbolic link is reported in `problems` and not read: the plugin ships
 * neither, and dropping one silently could break the skill that uses it.
 */
export async function readSources(repo = REPO) {
  const text = rel => readFile(join(repo, rel), 'utf8');
  const template = parseTemplate(await text(TEMPLATE.manifest));
  const readme = await readFile(join(repo, TEMPLATE.readme));
  const pin = mcpPin(await text(MCP_PACKAGE));
  const copied = [];
  for (const file of COPIED)
    copied.push([file, await readFile(join(repo, file))]);

  const names = await readSkillNames(join(repo, 'skills'));
  if (!names.length) throw new Error(`${repo}/skills holds no skills.`);
  const inSkills = trackedFiles(repo, 'skills')
    .filter(p => p.startsWith('skills/'))
    .map(p => p.slice('skills/'.length));
  const problems = [];
  const skillFiles = [];
  for (const rel of pathsInsideSkills(inSkills, names)) {
    const path = `skills/${rel}`;
    if (rel.split('/').some(s => s.startsWith('.'))) {
      problems.push(
        `${path}: is hidden, and the plugin ships no hidden files.`
      );
      continue;
    }
    if ((await lstat(join(repo, path))).isSymbolicLink()) {
      problems.push(`${path}: is a symbolic link. Commit a regular file.`);
      continue;
    }
    skillFiles.push({ path, content: await readFile(join(repo, path)) });
  }
  return { template, readme, pin, copied, skillFiles, problems };
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
    throw new Error(
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
    if (!got) problems.push(`${path}: was planned but is not on disk.`);
    else if (!got.equals(content))
      problems.push(`${path}: on disk differs from the plan.`);
  }
  for (const path of onDisk.keys()) {
    if (!tree.has(path))
      problems.push(`${path}: is on disk but was not planned.`);
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
  const before = [...sources.problems, ...treeViolations(planned)];
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
    const problems = err instanceof TreeError ? err.problems : [err.message];
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
