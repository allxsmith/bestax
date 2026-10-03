#!/usr/bin/env node
/**
 * Write the derivable skill rosters from the `skills/` directory (#542).
 *
 * Three files carry an install block that is a pure function of the directory
 * listing — one `npx skills add … --skill <name>` line per skill. They used to
 * be hand-maintained and conformance-checked, which meant the check knew the
 * exact line that was missing and asked a human to type it. Now the machine
 * types it: the blocks live between `bestax:generated` markers and regenerate
 * with `pnpm gen`.
 *
 * The markers wrap the FENCE, not the lines inside it — an HTML comment
 * inside a fenced block is literal text, not a marker.
 *
 * What stays hand-written, deliberately (#542 records the evidence): the two
 * "Use it when…" tables (SKILL.md frontmatter descriptions are 250-430 chars
 * of agent-trigger prose, unusable as table cells), the layout tree (28
 * hand-aligned comments derivable from nothing on disk), the scaffolded
 * CLAUDE_MD roster (a TS template literal), and AGENTS.md's parenthetical.
 * Those remain covered by the `skills-roster` conformance check; the three
 * blocks here are covered by the same check comparing the committed region
 * against this module's output, so a stale roster still fails CI without a
 * separate `gen:skills:check` step.
 *
 * Design contract, inherited from gen-component-catalog.mjs: plain node, no
 * build step, deterministic output (code-point sort, CRLF tolerated by the
 * region reader), and the whole file is reformatted through prettier before
 * writing so the committed bytes are exactly what `format:check` wants.
 *
 * A missing marker pair is a HARD ERROR naming the file, never a skip.
 * `replaceRegion` treats absence as an opt-out by design, and for the API
 * pages it is one — but nothing here may opt out silently: a generator that
 * quietly emits nothing while every gate stays green is the failure mode that
 * hid LinkButton's CSS variables for months (#464).
 *
 * It also writes the plugin manifests derived from `.claude-plugin/plugin.json`:
 * `skills/.claude-plugin/plugin.json` (SKILLS_PLUGIN below) and the root
 * `plugin.json` (AGENT_PLUGIN below). Each says why it exists.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

import { readRegions, replaceRegion } from './lib/api-page.mjs';
import { readSkillNames } from './lib/skills.mjs';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');

export const REGION_ID = 'skills-install';

/**
 * The files carrying a generated install block. `fence` is each file's
 * existing info string — skills/README.md uses `sh`, the docs pages `bash` —
 * preserved rather than unified so this change is about who writes the lines,
 * not a drive-by restyle.
 */
export const TARGETS = [
  { file: 'skills/README.md', fence: 'sh' },
  { file: 'docs/docs/skills/intro.md', fence: 'bash' },
  { file: 'docs/docs/guides/llms/index.md', fence: 'bash' },
];

// The roster reader lives in scripts/lib/skills.mjs — the one predicate all
// consumers share (the local-copy-to-avoid-a-cycle rationale predates the
// lib; a lib import cannot cycle with check-conformance).

/**
 * The region body: the fenced block, one install line per skill,
 * alphabetical. Pure, so the conformance check can compare and the tests can
 * drive it without touching disk. Alphabetical because a derived order is a
 * non-decision: the three copies once drifted apart on hand-curated order,
 * and a sort nobody maintains cannot.
 */
export function renderInstallBlock(skills, fence) {
  return [
    '',
    `\`\`\`${fence}`,
    ...skills.map(
      name =>
        `npx skills add https://github.com/allxsmith/bestax --skill ${name}`
    ),
    '```',
    '',
  ].join('\n');
}

/**
 * `skills/` doubles as a skills-only plugin for Anthropic's plugin directory.
 * The directory reads only the folder a submission names, and the repo-root
 * plugin does not fit it: the root holds far more files than the directory
 * accepts without review, and its MCP server runs through a ranged `npx` pin,
 * which the directory refuses. This folder is small and runs nothing.
 *
 * Its manifest is the Claude manifest minus the MCP server, with `skills`
 * pointed at the folder itself, because the skills sit directly under it.
 * Derived rather than hand-written so the two cannot drift: edit
 * `.claude-plugin/plugin.json` and run `pnpm gen:skills`. The skills-roster
 * check compares the parsed JSON, so it needs no prettier.
 */
export const SKILLS_PLUGIN = {
  source: '.claude-plugin/plugin.json',
  target: 'skills/.claude-plugin/plugin.json',
  description:
    'The bestax Agent Skills, for building with @allxsmith/bestax-bulma, ' +
    'React components for Bulma v1',
};

export function renderSkillsPluginManifest(root) {
  // The JSON round trip drops fields the root does not set, so the result
  // compares equal to a parsed file that never had them.
  return JSON.parse(
    JSON.stringify({
      name: root.name,
      description: SKILLS_PLUGIN.description,
      author: root.author,
      homepage: root.homepage,
      repository: root.repository,
      license: root.license,
      keywords: root.keywords,
      skills: './',
    })
  );
}

/**
 * The root `plugin.json`, in the vendor-neutral Agent Plugins format. Cursor,
 * Kiro and the awesome-copilot catalog read only this shape, and Codex,
 * Copilot CLI, VS Code and Grok Build prefer it over `.claude-plugin/` when
 * both exist. It is the Claude manifest plus `$schema` and `version`, so it is
 * derived from that manifest too.
 *
 * Two fields are deliberate. `mcpServers` is not in the Agent Plugins schema,
 * whose clients read `mcp.json` by convention and ignore unknown fields, but
 * Grok Build reads this file first and finds MCP servers only through that
 * field. `version` is the one field a person owns: the generator keeps
 * whatever the committed file says, because it names a plugin release cut for
 * the catalogs that pin one, and nothing in the repo can infer it.
 */
export const AGENT_PLUGIN = {
  target: 'plugin.json',
  schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  firstVersion: '1.0.0',
};

export function renderAgentPluginManifest(root, version) {
  return JSON.parse(
    JSON.stringify({
      $schema: AGENT_PLUGIN.schema,
      name: root.name,
      version,
      description: root.description,
      author: root.author,
      homepage: root.homepage,
      repository: root.repository,
      license: root.license,
      keywords: root.keywords,
      mcpServers: root.mcpServers,
    })
  );
}

/**
 * Every derived plugin manifest as `[repo-relative path, object]`, read from
 * the Claude manifest and the committed root `plugin.json`'s version. `repo`
 * is injectable so a test can reach the no-root-manifest-yet branch.
 */
export async function pluginManifests(repo = REPO) {
  const root = JSON.parse(
    await readFile(join(repo, SKILLS_PLUGIN.source), 'utf8')
  );
  const committedVersion = await readFile(
    join(repo, AGENT_PLUGIN.target),
    'utf8'
  )
    .then(text => JSON.parse(text).version)
    .catch(() => undefined);
  return [
    [SKILLS_PLUGIN.target, renderSkillsPluginManifest(root)],
    [
      AGENT_PLUGIN.target,
      renderAgentPluginManifest(
        root,
        committedVersion ?? AGENT_PLUGIN.firstVersion
      ),
    ],
  ];
}

export async function main() {
  const skills = await readSkillNames(join(REPO, 'skills'));
  if (!skills.length) {
    throw new Error('no skill directories with a SKILL.md found under skills/');
  }

  const prettier = require('prettier');
  for (const { file, fence } of TARGETS) {
    const abs = join(REPO, file);
    const src = await readFile(abs, 'utf8');
    if (!readRegions(src, file).has(REGION_ID)) {
      throw new Error(
        `${file}: no <!-- bestax:generated ${REGION_ID} --> marker pair. ` +
          'The install roster cannot be written, and skipping would ship a ' +
          'stale one silently. Restore the markers.'
      );
    }
    let out = replaceRegion(src, REGION_ID, renderInstallBlock(skills, fence));
    out = await prettier.format(out, {
      ...(await prettier.resolveConfig(abs)),
      filepath: abs,
    });
    if (out !== src) {
      await writeFile(abs, out);
      process.stdout.write(`Wrote ${file}\n`);
    }
  }
  process.stdout.write(`Skill install rosters: ${skills.length} skills\n`);

  const manifests = await pluginManifests();
  for (const [rel, manifest] of manifests) {
    const target = join(REPO, rel);
    const text = await prettier.format(JSON.stringify(manifest), {
      ...(await prettier.resolveConfig(target)),
      filepath: target,
    });
    const current = await readFile(target, 'utf8').catch(() => null);
    if (text !== current) {
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, text);
      process.stdout.write(`Wrote ${rel}\n`);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
