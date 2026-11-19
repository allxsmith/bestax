#!/usr/bin/env node
/**
 * Open an issue when create-bestax's templates fall behind create-vite (#1304).
 *
 * `create-bestax/templates/vite` and `vite-ts` follow the `react` and
 * `react-ts` starters `npm create vite@latest` writes, and `--lint eslint` and
 * the React Compiler templates follow what its `--eslint` and react-compiler
 * options add (create-bestax/CLAUDE.md). Nothing bumps the templates: they
 * aren't workspace packages, so Dependabot never sees them, and minors and
 * patches piled up between catch-ups until #1304. This compares them with the
 * create-vite release npm calls `latest` and says what moved.
 *
 * What it compares, per template:
 * - each dependency and script in its package.json, against the starter's;
 * - the files whose content follows the starter's (CONTENT_FILES), ignoring
 *   whitespace;
 * - the list of files, outside the image folders (ASSET_DIRS), so a config
 *   file create-vite adds or drops shows up.
 * And the packages create-bestax adds for `--lint eslint` and the compiler
 * templates (the CODE_CONSTANTS in create-bestax/src/constants.ts), against
 * the ranges create-vite's bundled CLI writes for the same packages.
 *
 * What it does not: the App, its assets, the README, index.html, the entry
 * file and vite.config differ on purpose, and `_gitignore` carries entries of
 * our own, so none of those is compared.
 *
 * create-vite is read, never run. The tarball comes from the npm registry,
 * its sha512 is checked against the registry's integrity field, and it is
 * unpacked in memory. Nothing from it is installed or executed.
 *
 * Design (mirrors check-security-txt-expiry.mjs): plain node, zero npm deps —
 * node: builtins plus global fetch, against the npm registry and the GitHub
 * REST API. Pure helpers are exported and main only runs when the file is
 * executed directly.
 *
 * Idempotency: the issue body carries MARKER. A run that finds drift updates
 * the open issue carrying it, or opens one. A run that finds none closes that
 * issue with a comment, so it doesn't outlive the catch-up that fixed it. Only
 * an issue the workflow opened counts (ISSUE_AUTHOR), so a copy of the marker
 * in someone else's issue is never touched.
 *
 * CI consumption: .github/workflows/create-vite-drift.yml, weekly cron plus
 * workflow_dispatch.
 *
 * Usage:
 *   node scripts/check-create-vite-drift.mjs --report
 *   GITHUB_TOKEN=… node scripts/check-create-vite-drift.mjs \
 *     --repo=owner/name [--dry-run]
 *
 * --report prints what it found and touches no issue. --dry-run says what it
 * would do to the issue.
 *
 * Exit codes: 0 clean run (drift or not),
 *             1 a registry, integrity or API failure, or a file it can't read,
 *             2 bad usage.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';

export const MARKER = '<!-- create-vite-drift -->';
export const LIBRARY = '@allxsmith/bestax-bulma';

/** Each create-bestax template and the create-vite starter it follows. */
export const TEMPLATE_PAIRS = [
  { ours: 'vite', theirs: 'template-react' },
  { ours: 'vite-ts', theirs: 'template-react-ts' },
];

/** Files whose content follows the starter's, when the starter has them. */
export const CONTENT_FILES = [
  '_oxlintrc.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
];

/** Folders whose files differ on purpose: the starters' images and ours. */
export const ASSET_DIRS = ['public/', 'src/assets/'];

/** The create-bestax constants that follow create-vite's bundled CLI. */
export const CODE_CONSTANTS = [
  'ESLINT_DEV_DEPENDENCIES',
  'ESLINT_TYPESCRIPT_DEV_DEPENDENCIES',
  'REACT_COMPILER_DEV_DEPENDENCIES',
  'REACT_COMPILER_TYPESCRIPT_DEV_DEPENDENCIES',
];

const REGISTRY = 'https://registry.npmjs.org';
const API_BASE = 'https://api.github.com';
const FETCH_TIMEOUT_MS = 30_000;
const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const TEMPLATES_DIR = path.join(REPO_ROOT, 'create-bestax', 'templates');
const CONSTANTS_FILE = path.join(
  REPO_ROOT,
  'create-bestax',
  'src',
  'constants.ts'
);
const DEPENDENCY_SECTIONS = ['dependencies', 'devDependencies'];

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests).
// ---------------------------------------------------------------------------

/** Parse argv into { repo, dryRun, report }; throws Error on misuse. */
export function parseArgs(argv) {
  const report = argv.includes('--report');
  const repo = argv.find(a => a.startsWith('--repo='))?.slice('--repo='.length);
  if (!report && (!repo || !/^[^/\s]+\/[^/\s]+$/.test(repo))) {
    throw new Error('usage: --repo=owner/name is required, or pass --report');
  }
  return { repo, dryRun: argv.includes('--dry-run'), report };
}

/**
 * Throws unless buffer's sha512 is the one integrity names. Only sha512 is
 * taken: it's what the registry publishes, and a weaker hash in its place
 * would be a reason to stop, not to check less.
 */
export function verifyIntegrity(buffer, integrity) {
  const match = /^sha512-([A-Za-z0-9+/]+={0,2})$/.exec(String(integrity ?? ''));
  if (!match) {
    throw new Error(
      `the registry gave no sha512 integrity for the tarball: "${integrity}"`
    );
  }
  const actual = createHash('sha512').update(buffer).digest('base64');
  if (actual !== match[1]) {
    throw new Error(
      'the tarball does not match the integrity the registry published for it'
    );
  }
}

/** The fields of a tar header block, as text, trimmed at the first NUL. */
function field(block, start, length) {
  const text = block.toString('utf8', start, start + length);
  const nul = text.indexOf('\0');
  return nul === -1 ? text : text.slice(0, nul);
}

/** The path a pax extended header sets, or undefined. */
function paxPath(data) {
  for (const record of data.toString('utf8').split('\n')) {
    const match = /^\d+ path=(.*)$/.exec(record);
    if (match) return match[1];
  }
  return undefined;
}

/**
 * The regular files in a tar archive, by path with npm's `package/` prefix
 * dropped. Reads ustar headers (with their name prefix) and a pax header's
 * path, which npm uses for long names, and skips everything that isn't a
 * regular file. Throws on a header whose size isn't octal.
 */
export function readTar(buffer) {
  const files = new Map();
  let offset = 0;
  let nextPath;
  while (offset + 512 <= buffer.length) {
    const block = buffer.subarray(offset, offset + 512);
    if (block.every(byte => byte === 0)) break;
    const sizeText = field(block, 124, 12).trim();
    if (!/^[0-7]*$/.test(sizeText)) {
      throw new Error(
        `a tar header at byte ${offset} has a size that isn't octal`
      );
    }
    const size = parseInt(sizeText || '0', 8);
    const type = field(block, 156, 1) || '0';
    const prefix = field(block, 345, 155);
    const name = field(block, 0, 100);
    const data = buffer.subarray(offset + 512, offset + 512 + size);
    offset += 512 + Math.ceil(size / 512) * 512;

    if (type === 'x') {
      nextPath = paxPath(data);
      continue;
    }
    const filePath = nextPath ?? (prefix ? `${prefix}/${name}` : name);
    nextPath = undefined;
    if (type === '0') {
      files.set(filePath.replace(/^package\//, ''), Buffer.from(data));
    }
  }
  return files;
}

/** The files under prefix in a path-keyed map, keyed by path below prefix. */
export function filesUnder(files, prefix) {
  const below = new Map();
  for (const [filePath, content] of files) {
    if (filePath.startsWith(`${prefix}/`)) {
      below.set(filePath.slice(prefix.length + 1), content);
    }
  }
  return below;
}

/**
 * Each dependency and script that differs between our package.json and the
 * starter's, as { kind, name, ours, theirs } with undefined where one side
 * has none. The library is ours alone, so it's left out.
 */
export function compareManifests(ours, theirs) {
  const rows = [];
  for (const section of DEPENDENCY_SECTIONS) {
    const mine = ours[section] ?? {};
    const upstream = theirs[section] ?? {};
    const names = new Set([...Object.keys(mine), ...Object.keys(upstream)]);
    names.delete(LIBRARY);
    for (const name of [...names].sort()) {
      if (mine[name] !== upstream[name]) {
        rows.push({
          kind: section,
          name,
          ours: mine[name],
          theirs: upstream[name],
        });
      }
    }
  }
  const scripts = new Set([
    ...Object.keys(ours.scripts ?? {}),
    ...Object.keys(theirs.scripts ?? {}),
  ]);
  for (const name of [...scripts].sort()) {
    if (ours.scripts?.[name] !== theirs.scripts?.[name]) {
      rows.push({
        kind: 'scripts',
        name,
        ours: ours.scripts?.[name],
        theirs: theirs.scripts?.[name],
      });
    }
  }
  return rows;
}

/** Text with its whitespace dropped, so formatting alone never reads as drift. */
const squeeze = text => String(text).replace(/\s+/g, '');

const isAsset = filePath => ASSET_DIRS.some(dir => filePath.startsWith(dir));

/**
 * How our template's files differ from the starter's: files only one side
 * has, outside ASSET_DIRS, and CONTENT_FILES the starter has whose content
 * differs from ours.
 */
export function compareFiles(ours, theirs) {
  const onlyTheirs = [...theirs.keys()]
    .filter(file => !isAsset(file) && !ours.has(file))
    .sort();
  const onlyOurs = [...ours.keys()]
    .filter(file => !isAsset(file) && !theirs.has(file))
    .sort();
  const differing = CONTENT_FILES.filter(
    file =>
      theirs.has(file) &&
      ours.has(file) &&
      squeeze(theirs.get(file)) !== squeeze(ours.get(file))
  );
  return { onlyTheirs, onlyOurs, differing };
}

/**
 * The `name: range` pairs of `export const <name>: Record<string, string> =
 * { … };` in constants.ts, or null when the declaration isn't there in that
 * shape. Read as text rather than imported, so the run needs no install; a
 * null is reported rather than skipped.
 */
export function scrapeConstant(source, name) {
  const declaration = new RegExp(
    `export const ${name}: Record<\\s*string,\\s*string\\s*> = \\{([\\s\\S]*?)\\};`
  ).exec(source);
  if (!declaration) return null;
  const pairs = {};
  for (const [, key, range] of declaration[1].matchAll(
    /^\s*'?([@\w./-]+)'?:\s*'([^']+)',?\s*$/gm
  )) {
    pairs[key] = range;
  }
  return Object.keys(pairs).length > 0 ? pairs : null;
}

/**
 * The range create-vite's bundled CLI writes for name, or undefined. It
 * pushes `[\`name\`,\`range\`]` pairs onto a starter's devDependencies, and
 * sets TypeScript's with `devDependencies.typescript=\`range\``.
 */
export function rangeInCreateViteCode(code, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const pushed = new RegExp(`\\[\`${escaped}\`,\`([^\`]+)\`\\]`).exec(code);
  if (pushed) return pushed[1];
  if (name === 'typescript') {
    return /devDependencies\.typescript=`([^`]+)`/.exec(code)?.[1];
  }
  return undefined;
}

/**
 * Each package in CODE_CONSTANTS whose range differs from the one
 * create-vite's code writes, as { constant, name, ours, theirs }, plus
 * `unreadable` for a constant that wasn't in the shape scrapeConstant reads.
 * A package create-vite's code doesn't name at all comes back with theirs
 * undefined, since that means a look by hand.
 */
export function compareCodeConstants(constantsSource, code) {
  const rows = [];
  const unreadable = [];
  for (const constant of CODE_CONSTANTS) {
    const pairs = scrapeConstant(constantsSource, constant);
    if (!pairs) {
      unreadable.push(constant);
      continue;
    }
    for (const [name, range] of Object.entries(pairs)) {
      const theirs = rangeInCreateViteCode(code, name);
      if (theirs !== range) rows.push({ constant, name, ours: range, theirs });
    }
  }
  return { rows, unreadable };
}

/** Whether a drift result has anything to report. */
export function hasDrift({ templates, code }) {
  return (
    templates.some(
      t =>
        t.manifest.length > 0 ||
        t.files.onlyTheirs.length > 0 ||
        t.files.onlyOurs.length > 0 ||
        t.files.differing.length > 0 ||
        t.missing
    ) ||
    code.rows.length > 0 ||
    code.unreadable.length > 0
  );
}

const cell = value => (value === undefined ? '—' : `\`${value}\``);

/** The markdown report of a drift result, against create-vite `version`. */
export function renderReport({ templates, code }, version) {
  const lines = [];
  for (const t of templates) {
    lines.push(`### \`templates/${t.ours}\` and \`${t.theirs}\``, '');
    if (t.missing) {
      lines.push(
        `create-vite ${version} has no \`${t.theirs}\` starter any more.`,
        ''
      );
      continue;
    }
    const clean =
      t.manifest.length === 0 &&
      t.files.onlyTheirs.length === 0 &&
      t.files.onlyOurs.length === 0 &&
      t.files.differing.length === 0;
    if (clean) {
      lines.push('No difference.', '');
      continue;
    }
    if (t.manifest.length > 0) {
      lines.push(
        '| In | Name | Ours | create-vite |',
        '| --- | --- | --- | --- |'
      );
      for (const row of t.manifest) {
        lines.push(
          `| ${row.kind} | \`${row.name}\` | ${cell(row.ours)} | ${cell(row.theirs)} |`
        );
      }
      lines.push('');
    }
    for (const file of t.files.onlyTheirs) {
      lines.push(`- create-vite has \`${file}\`, and the template doesn't.`);
    }
    for (const file of t.files.onlyOurs) {
      lines.push(`- The template has \`${file}\`, and create-vite doesn't.`);
    }
    for (const file of t.files.differing) {
      lines.push(`- \`${file}\` differs from create-vite's.`);
    }
    if (
      t.files.onlyTheirs.length +
        t.files.onlyOurs.length +
        t.files.differing.length >
      0
    ) {
      lines.push('');
    }
  }

  lines.push('### `--lint eslint` and the React Compiler templates', '');
  if (code.rows.length === 0 && code.unreadable.length === 0) {
    lines.push('No difference.', '');
  } else {
    if (code.rows.length > 0) {
      lines.push(
        '| Constant | Name | Ours | create-vite |',
        '| --- | --- | --- | --- |'
      );
      for (const row of code.rows) {
        lines.push(
          `| \`${row.constant}\` | \`${row.name}\` | ${cell(row.ours)} | ${cell(row.theirs)} |`
        );
      }
      lines.push(
        '',
        'A — under create-vite means its code no longer names the package, so check it by hand.',
        ''
      );
    }
    for (const constant of code.unreadable) {
      lines.push(
        `- \`${constant}\` isn't declared as a \`Record<string, string>\` object literal in \`create-bestax/src/constants.ts\` any more, so it wasn't compared.`
      );
    }
    if (code.unreadable.length > 0) lines.push('');
  }
  return lines.join('\n').trimEnd();
}

/** Title and body for the drift issue. Pure, so the wording is testable. */
export function renderIssue(drift, version) {
  const title = `create-bestax's templates are behind create-vite ${version}`;
  const body = [
    MARKER,
    '',
    `create-vite ${version} is out, and create-bestax's templates differ from its starters ` +
      'in the ways below. Catch up as `create-bestax/CLAUDE.md` describes, taking each ' +
      'version past the 3-day cooldown, and close this issue from the PR.',
    '',
    renderReport(drift, version),
    '',
    '<sub>Opened by `.github/workflows/create-vite-drift.yml` (#1304). It is updated in ' +
      'place each week while the templates differ, and closed by the first run that ' +
      'finds them matching.</sub>',
  ].join('\n');
  return { title, body };
}

/**
 * The account the workflow's GITHUB_TOKEN opens issues as. Only an issue it
 * opened counts as ours: the marker is plain text anyone can put in an issue,
 * and one that matched would be updated or closed in place of the real one.
 */
export const ISSUE_AUTHOR = 'github-actions[bot]';

/** The open issue carrying our marker that the workflow opened, or undefined. */
export function findMarkerIssue(issues, author = ISSUE_AUTHOR) {
  return (issues ?? []).find(
    issue =>
      !issue.pull_request &&
      issue.user?.login === author &&
      typeof issue.body === 'string' &&
      issue.body.includes(MARKER)
  );
}

/**
 * Compare create-vite's unpacked files with our templates and constants.
 * `ourTemplates` maps a template name to its files, `files` is create-vite's
 * package by path.
 */
export function findDrift({ files, ourTemplates, constantsSource }) {
  const templates = TEMPLATE_PAIRS.map(({ ours, theirs }) => {
    const upstream = filesUnder(files, theirs);
    const mine = ourTemplates.get(ours) ?? new Map();
    if (!upstream.has('package.json')) {
      return {
        ours,
        theirs,
        missing: true,
        manifest: [],
        files: { onlyTheirs: [], onlyOurs: [], differing: [] },
      };
    }
    return {
      ours,
      theirs,
      missing: false,
      manifest: compareManifests(
        JSON.parse(String(mine.get('package.json') ?? '{}')),
        JSON.parse(String(upstream.get('package.json')))
      ),
      files: compareFiles(mine, upstream),
    };
  });
  const code = compareCodeConstants(
    constantsSource,
    String(files.get('dist/index.js') ?? '')
  );
  return { templates, code };
}

// ---------------------------------------------------------------------------
// I/O: the npm registry, our files, and the GitHub REST API.
// ---------------------------------------------------------------------------

async function request(url, { method = 'GET', body, github = false } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      'User-Agent': 'bestax-create-vite-drift',
      ...(github
        ? {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          }
        : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    // A hung request must not stall the cron run.
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `${method} ${url} failed: ${res.status} ${res.statusText} ${text.slice(0, 300)}`
    );
  }
  return res;
}

const api = (apiPath, options = {}) =>
  request(apiPath.startsWith('https://') ? apiPath : `${API_BASE}${apiPath}`, {
    ...options,
    github: true,
  });

/**
 * Every page of a GET endpoint, following Link rel="next": the marker lookup
 * has to see every open issue, or it opens a second one (see
 * check-security-txt-expiry.mjs).
 */
async function getAllPages(apiPath) {
  const items = [];
  let url = apiPath;
  while (url) {
    const res = await api(url);
    items.push(...(await res.json()));
    const link = res.headers.get('link') ?? '';
    url = link.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
  }
  return items;
}

/** create-vite's latest version and its files, checked against the registry. */
export async function fetchCreateVite() {
  const manifest = await (
    await request(`${REGISTRY}/create-vite/latest`)
  ).json();
  const tarball = manifest?.dist?.tarball;
  if (typeof tarball !== 'string' || !tarball.startsWith(`${REGISTRY}/`)) {
    throw new Error(
      `the registry named an unexpected tarball URL: "${tarball}"`
    );
  }
  const packed = Buffer.from(await (await request(tarball)).arrayBuffer());
  verifyIntegrity(packed, manifest.dist.integrity);
  return { version: manifest.version, files: readTar(gunzipSync(packed)) };
}

/** Each template's tracked files, by path inside it. */
export async function readOurTemplates(dir = TEMPLATES_DIR) {
  const templates = new Map();
  for (const { ours } of TEMPLATE_PAIRS) {
    const root = path.join(dir, ours);
    const files = new Map();
    for (const entry of await readdir(root, {
      recursive: true,
      withFileTypes: true,
    })) {
      if (!entry.isFile()) continue;
      const full = path.join(entry.parentPath, entry.name);
      const relative = path.relative(root, full).split(path.sep).join('/');
      if (relative.startsWith('node_modules/') || relative.startsWith('dist/'))
        continue;
      files.set(relative, await readFile(full));
    }
    templates.set(ours, files);
  }
  return templates;
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------

/**
 * Exported, with argv and the template and constants paths as parameters, so
 * the open, update and close paths run against a stubbed globalThis.fetch and
 * fixture files rather than the live repo.
 */
export async function main(
  argv = process.argv.slice(2),
  { templatesDir = TEMPLATES_DIR, constantsFile = CONSTANTS_FILE } = {}
) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }

  const { version, files } = await fetchCreateVite();
  const drift = findDrift({
    files,
    ourTemplates: await readOurTemplates(templatesDir),
    constantsSource: await readFile(constantsFile, 'utf8'),
  });
  const drifted = hasDrift(drift);

  if (opts.report) {
    console.log(`create-vite ${version}\n\n${renderReport(drift, version)}`);
    return;
  }

  const existing = findMarkerIssue(
    await getAllPages(
      `/repos/${opts.repo}/issues?state=open&per_page=100&sort=created&direction=desc`
    )
  );

  if (!drifted) {
    if (!existing) {
      console.log(`The templates match create-vite ${version}. Nothing to do.`);
      return;
    }
    if (opts.dryRun) {
      console.log(
        `[dry-run] would close #${existing.number}: the templates match create-vite ${version}`
      );
      return;
    }
    await api(`/repos/${opts.repo}/issues/${existing.number}/comments`, {
      method: 'POST',
      body: {
        body: `create-bestax's templates match create-vite ${version} now, so this is closed.`,
      },
    });
    await api(`/repos/${opts.repo}/issues/${existing.number}`, {
      method: 'PATCH',
      body: { state: 'closed', state_reason: 'completed' },
    });
    console.log(
      `Closed #${existing.number}: the templates match create-vite ${version}`
    );
    return;
  }

  const { title, body } = renderIssue(drift, version);
  if (opts.dryRun) {
    console.log(
      `[dry-run] would ${existing ? `update #${existing.number}` : 'open an issue'} titled: ${title}`
    );
    return;
  }
  if (existing) {
    await api(`/repos/${opts.repo}/issues/${existing.number}`, {
      method: 'PATCH',
      body: { title, body },
    });
    console.log(`Updated #${existing.number}: ${title}`);
    return;
  }
  const created = await api(`/repos/${opts.repo}/issues`, {
    method: 'POST',
    body: { title, body, labels: ['dependencies'] },
  });
  console.log(`Opened #${(await created.json()).number}: ${title}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
