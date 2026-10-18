/**
 * Writes the whole allxsmith/bestax-templates repository into a directory.
 *
 *   node scripts/gen-templates-repo.mjs <empty or new directory>
 *
 * bestax-templates is where StackBlitz opens the ported Bulma templates from
 * (templates/CLAUDE.md). It is a repository of its own because StackBlitz's
 * GitHub import clones the whole repository it names, and on the monorepo
 * that took minutes for each new commit. Every file in it comes from this
 * script, and .github/workflows/templates-publish.yml replaces its tree with
 * this output on each change. Nobody edits it by hand, so a fix goes here, in
 * templates/, or in the docs data the README is written from.
 *
 * The tree:
 *
 * - `<slug>/...`: each folder under templates/, as the files git tracks
 *   there, read from disk with their executable bit. The files at the top of
 *   templates/ (its CLAUDE.md and eslint.config.js) serve the monorepo and
 *   stay out. Each tracked file must be a regular file, not a link, and an
 *   untracked one never ships, so a local install or build left in a
 *   template's folder publishes nothing.
 * - `README.md`, written here: what the repository is, the credit to aldi's
 *   awesome-bulma-templates and to each template's upstream author and
 *   repository, and a StackBlitz link per template. The credits come from
 *   docs/src/data/templates.js, whose entries are held to the schema
 *   scripts/templates.test.mjs holds them to (`entryProblems`), and the links
 *   from its `stackblitzUrl`, the one the Templates page uses.
 * - `LICENSE` and `NOTICE`, the monorepo's, copied.
 *
 * What it reuses rather than copies: the tracked listing and the refusal
 * that names what to do (`trackedRepoPaths`, `skillRefusal`, `failureText`)
 * from scripts/lib/skills.mjs, through the same gate gen-skills-repo.mjs
 * reads its inputs with, here always requiring a checkout, since the tree is
 * defined as what git tracks. That listing is split into templates by
 * scripts/lib/templates.mjs's `templatePaths`, the same split the templates
 * test checks, so the test and the mirror read the same files. The README
 * names each template's own `license` from its entry, which the schema
 * holds to an allowlist. The tree helpers (`writeTree`, `scanTree`,
 * `planMismatch`, `fileMode`, `nameProblem`, `TreeError`) come from
 * gen-skills-repo.mjs, and file-derived values in messages go through
 * consumer-sbom-meta.mjs's `forLog`.
 *
 * No version: nothing installs a release of this repository, so a publish
 * is its tree at a monorepo commit and nothing more.
 *
 * Pure apart from readSources, generate and main. It imports node: builtins
 * and local modules only, so the workflow's generate job runs it with the
 * runner's Node and no install.
 */
import { lstat, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { forLog } from './consumer-sbom-meta.mjs';
import {
  SOURCE_REPOSITORY,
  TreeError,
  fileMode,
  nameProblem,
  planMismatch,
  scanTree,
  writeTree,
} from './gen-skills-repo.mjs';
import { isMainModule } from './lib/main-module.mjs';
import {
  byCodePoint,
  failureText,
  skillRefusal,
  trackedRepoPaths,
} from './lib/skills.mjs';
import {
  entryProblems,
  loadTemplatesData,
  templatePaths,
} from './lib/templates.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The docs data the README is written from. */
export const DATA_FILE = 'docs/src/data/templates.js';

/** Repo-root files copied into the tree under the same name. */
export const COPIED = ['LICENSE', 'NOTICE'];

/** Every file the tree is built from besides the templates' own. */
export const INPUT_FILES = [DATA_FILE, ...COPIED];

export const TEMPLATES_DIR = 'templates';

export const AWESOME = 'https://github.com/aldi/awesome-bulma-templates';
export const SITE_PAGE = 'https://bestax.io/templates';

/**
 * Everything a publish depends on: templates/, INPUT_FILES, every local
 * module the generator runs, and the workflow. This is the push paths filter
 * in .github/workflows/templates-publish.yml. The test sibling holds the list
 * to the generator's imports, and the two to each other once the workflow
 * exists. It takes all of templates/, wider than what ships, which costs at
 * most a run that publishes nothing: a run publishes only when the tree it
 * writes differs from the published one.
 */
export const PUBLISH_PATHS = [
  'templates/**',
  ...INPUT_FILES,
  'scripts/gen-templates-repo.mjs',
  'scripts/gen-skills-repo.mjs',
  'scripts/lib/templates.mjs',
  'scripts/lib/skills.mjs',
  'scripts/lib/api-page.mjs',
  'scripts/lib/fetch-retry.mjs',
  'scripts/lib/main-module.mjs',
  'scripts/lib/version-regression.mjs',
  'scripts/lib/pack-time-protocols.mjs',
  'scripts/consumer-sbom-meta.mjs',
  'scripts/mcp-registry-publish.mjs',
  'scripts/npm-install-retry.mjs',
  'docs/scripts/generated-markers-lib.mjs',
  'docs/src/theme/CodeBlock/sandbox/projects.mjs',
  '.github/workflows/templates-publish.yml',
];

/**
 * The docs entries the README credits, in the page's order, after checking
 * that the entries and the template folders name the same slugs and that
 * each entry has the shape the docs test holds it to. Throws one TreeError
 * naming every problem.
 */
export function creditedTemplates(data, slugs) {
  const problems = [];
  if (typeof data?.stackblitzUrl !== 'function') {
    problems.push(`${DATA_FILE}: exports no stackblitzUrl(slug).`);
  }
  const entries = Array.isArray(data?.sortedTemplates)
    ? data.sortedTemplates
    : [];
  if (!Array.isArray(data?.sortedTemplates)) {
    problems.push(`${DATA_FILE}: exports no sortedTemplates array.`);
  }
  for (const entry of entries) {
    for (const problem of entryProblems(entry, data.Tags)) {
      problems.push(`${DATA_FILE}: ${forLog(problem)}`);
    }
  }
  const named = entries.map(entry => entry?.slug);
  for (const slug of slugs) {
    if (!named.includes(slug)) {
      problems.push(
        `${forLog(`templates/${slug}/`)} has no entry in ${DATA_FILE}, so ` +
          `the README cannot credit its upstream.`
      );
    }
  }
  for (const slug of named) {
    if (!slugs.includes(slug)) {
      problems.push(
        `${DATA_FILE}: ${forLog(slug)} has no tracked files under ` +
          `${forLog(`templates/${slug}/`)}.`
      );
    }
  }
  if (problems.length) {
    throw new TreeError([
      ...problems,
      'Run `pnpm test:scripts`, whose templates test names the fix.',
    ]);
  }
  return entries;
}

/** A repository URL as link text: owner/name on GitHub, the URL elsewhere. */
export function repoLabel(url) {
  return url.replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
}

/** The README, from the credited entries and the page's link builder. */
export function renderReadme(templates, stackblitzUrl) {
  const listed = templates.length
    ? templates.flatMap(t => [
        `### ${t.title}`,
        '',
        t.description,
        '',
        `- [Open in StackBlitz](${stackblitzUrl(t.slug)})`,
        `- Ported from [${repoLabel(t.source)}](${t.source}) by ` +
          `[${t.author.name}](${t.author.url}), at commit ` +
          `\`${t.sourceSha.slice(0, 7)}\``,
        `- License: ${t.license}, the upstream's, in [LICENSE](${t.slug}/LICENSE)`,
        '',
      ])
    : [
        'None yet. Each one lands in allxsmith/bestax first, and this ' +
          'repository follows.',
        '',
      ];
  return [
    '# bestax templates',
    '',
    `Free Bulma templates from aldi's [awesome-bulma-templates](${AWESOME}), ` +
      'rebuilt with [bestax](https://bestax.io), the React component library ' +
      'for Bulma. Each folder is a complete Vite, React and TypeScript ' +
      'project that runs on its own and credits the template it was ported ' +
      'from.',
    '',
    `Browse them with screenshots and filters at [bestax.io/templates](${SITE_PAGE}).`,
    '',
    '## Templates',
    '',
    ...listed,
    '## Run one',
    '',
    'Each folder is its own project:',
    '',
    '```bash',
    'cd <folder>',
    'npm install',
    'npm run dev',
    '```',
    '',
    '## License',
    '',
    "Each template is under its upstream's license, named with it above, " +
      "and its LICENSE keeps the upstream author's notice followed by the " +
      "notice for the bestax port. This repository's own LICENSE covers the " +
      'rest, and NOTICE credits the projects these build on.',
    '',
    '## Where this comes from',
    '',
    `This repository is generated from [\`templates/\`](${SOURCE_REPOSITORY}/tree/main/templates) ` +
      `in [allxsmith/bestax](${SOURCE_REPOSITORY}) and replaced on each ` +
      'change there, so it is never edited by hand. Open issues and pull ' +
      'requests in allxsmith/bestax.',
    '',
  ].join('\n');
}

/** A tree of `{ content, mode }` by path, sorted the way git lists it. */
export function buildTree({ readme, copied, templateFiles }) {
  const tree = new Map([
    ['README.md', { content: Buffer.from(readme), mode: 0o644 }],
  ]);
  for (const { path, content, mode } of [...copied, ...templateFiles]) {
    tree.set(path, { content, mode });
  }
  return new Map([...tree].sort(([a], [b]) => byCodePoint(a, b)));
}

/**
 * Everything wrong with a tree: a missing root file, a name Windows or
 * macOS refuses (nameProblem), a `.git` part in any case, a symbolic link,
 * or two paths that differ only by case. `entries` are `{ path, symlink }`,
 * as scanTree returns them. Every path in a message goes through forLog.
 */
export function treeProblems(entries) {
  const problems = [];
  const paths = new Set(entries.map(e => e.path));
  for (const file of ['README.md', ...COPIED]) {
    if (!paths.has(file)) problems.push(`${file}: missing.`);
  }
  const seen = new Map();
  for (const { path, symlink } of entries) {
    const at = forLog(path);
    if (symlink) problems.push(`${at}: is a symbolic link.`);
    const segments = path.split('/');
    if (segments.some(s => s.toLowerCase() === '.git')) {
      problems.push(`${at}: has a .git part.`);
    }
    for (const segment of segments) {
      const problem = nameProblem(segment);
      if (problem) problems.push(`${at}: ${problem}.`);
    }
    for (let i = 1; i <= segments.length; i++) {
      const prefix = segments.slice(0, i).join('/');
      const first = seen.get(prefix.toLowerCase());
      if (first === undefined) seen.set(prefix.toLowerCase(), prefix);
      else if (first !== prefix) {
        problems.push(
          `${forLog(prefix)}: differs from ${forLog(first)} only by case.`
        );
      }
    }
  }
  return [...new Set(problems)];
}

/** A tree entry for the file at `full`, refusing anything but a file. */
async function fileEntry(path, full, problems) {
  const info = await lstat(full).catch(() => null);
  if (!info) {
    problems.push(`${forLog(path)}: is tracked but missing on disk.`);
    return null;
  }
  if (info.isSymbolicLink()) {
    problems.push(
      `${forLog(path)}: is a symbolic link. Commit a regular file.`
    );
    return null;
  }
  if (!info.isFile()) {
    problems.push(`${forLog(path)}: is not a regular file.`);
    return null;
  }
  return { path, content: await readFile(full), mode: fileMode(info.mode) };
}

/**
 * Every input, read from `repo`, which must be a git checkout: the listing
 * of what git tracks under templates/ is what the tree holds. Throws a
 * TreeError naming every unreadable input.
 */
export async function readSources(repo = REPO) {
  const tracked = trackedRepoPaths(repo, [TEMPLATES_DIR, ...INPUT_FILES], {
    requireCheckout: true,
  });
  const problems = [];
  for (const file of INPUT_FILES) {
    if (!tracked.includes(file)) {
      problems.push(`${file}: is not tracked by git. \`git add\` it.`);
    }
  }
  const copied = [];
  for (const file of COPIED) {
    const entry = await fileEntry(file, join(repo, file), problems);
    if (entry) copied.push(entry);
  }
  const { slugs, files } = templatePaths(tracked);
  const templateFiles = [];
  for (const { path, source } of files) {
    const entry = await fileEntry(path, join(repo, source), problems);
    if (entry) templateFiles.push(entry);
  }
  const info = await lstat(join(repo, DATA_FILE)).catch(() => null);
  if (info?.isSymbolicLink() || (info && !info.isFile())) {
    problems.push(`${DATA_FILE}: is not a regular file.`);
  }
  if (problems.length) throw new TreeError(problems);

  let data;
  try {
    data = await loadTemplatesData(repo);
  } catch (err) {
    throw skillRefusal(`${DATA_FILE} could not be read: ${err.message}`, {
      cause: err,
    });
  }
  const templates = creditedTemplates(data, slugs);
  return {
    readme: renderReadme(templates, data.stackblitzUrl),
    copied,
    templateFiles,
  };
}

/**
 * Reads, checks, writes and checks again. Returns the sorted file list, or
 * throws a TreeError listing every problem.
 */
export async function generate(outDir, repo = REPO) {
  const tree = buildTree(await readSources(repo));
  const before = treeProblems(
    [...tree.keys()].map(path => ({ path, symlink: false }))
  );
  if (before.length) throw new TreeError(before);
  await writeTree(outDir, tree);
  const written = await scanTree(outDir);
  const after = [...treeProblems(written), ...planMismatch(tree, written)];
  if (after.length) throw new TreeError(after);
  return [...tree.keys()];
}

/** The command line: `<output directory>`. `repo` is for tests. */
export async function main(
  argv = process.argv.slice(2),
  io = process,
  { repo = REPO } = {}
) {
  if (argv.length !== 1 || argv[0].startsWith('-')) {
    io.stderr.write(
      'usage: node scripts/gen-templates-repo.mjs <output directory>\n'
    );
    return 2;
  }
  const outDir = resolve(argv[0]);
  try {
    const files = await generate(outDir, repo);
    io.stdout.write(`Wrote the bestax-templates tree to ${outDir}:\n`);
    for (const file of files) io.stdout.write(`  ${file}\n`);
    return 0;
  } catch (err) {
    // A TreeError's problems are escaped where they are made. Anything else
    // goes through forLog, since it can quote a path.
    const problems =
      err instanceof TreeError ? err.problems : [forLog(failureText(err))];
    io.stderr.write(
      'gen-templates-repo: the bestax-templates tree failed its checks:\n'
    );
    for (const problem of problems) io.stderr.write(`  ${problem}\n`);
    return 1;
  }
}

if (isMainModule(import.meta.url)) {
  process.exitCode = await main();
}
