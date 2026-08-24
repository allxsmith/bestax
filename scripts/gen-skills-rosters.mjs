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
 */
import { readFile, writeFile } from 'node:fs/promises';
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
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
