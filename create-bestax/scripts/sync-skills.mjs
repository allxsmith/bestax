// Sync the canonical Agent Skills from the monorepo's top-level `skills/` dir
// into `create-bestax/templates/skills`, so they ship inside the published
// package and can be copied into scaffolded apps' `.claude/skills/`.
//
// `/skills` is the single source of truth; `templates/skills` is generated and
// gitignored. Runs on `build` and `prepack`.
//
// The roster is READ, not listed (#540). This file used to carry a hardcoded
// `SKILLS` array. It errored when a LISTED skill was missing from disk, but
// never when a skill on disk was missing from the list, so a new skill
// directory that nobody added to it silently never bundled and no gate
// noticed. Every skill directory now bundles by construction.
//
// State the provenance precisely, because it is easy to overstate: #385
// settled ONE skill's case (bestax-migrate bundles) and explicitly kept the
// per-skill decision rule — "The per-skill-decision rule stays". What it did
// give is the reasoning this generalises, "a per-skill carve-out is exactly
// the kind of thing that drifts, and this issue is the proof". Removing the
// rule outright is a NEW decision made in #540, not something #385 already
// concluded. If a skill ever must not bundle, add an explicit opt-out here,
// so the omission is a decision in this file rather than an absence nobody
// sees.
//
// This was the last of the three roster consumers to be listed rather than
// read; `bestax-mcp/scripts/sync-skills.mjs` and `scripts/gen-mcp-index.mjs`
// already read the directory. The copies that CANNOT be derived are prose
// (README, docs, the scaffolded CLAUDE.md), and those are held by
// `pnpm check:conformance --only=skills-roster`.
//
// Two deliberate differences from bestax-mcp's copy survive, and its header
// lists the same two: fs-extra stays (this package already depends on it, so
// avoiding it buys nothing), and this is still not concurrency-safe (the only
// callers are `build` and `prepack`, which never overlap — port the locking if
// a third is ever added).
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'fs-extra';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, '..');
const skillsSrc = path.resolve(pkgRoot, '..', 'skills');
const skillsDest = path.join(pkgRoot, 'templates', 'skills');

if (!fs.existsSync(skillsSrc)) {
  console.error(`[sync-skills] source not found: ${skillsSrc}`);
  process.exit(1);
}

// A directory with a SKILL.md is a skill. That predicate is what excludes
// `skills/README.md` and `skills/CLAUDE.md` without naming them, so a new
// non-skill file at that level does not become a phantom skill. Sorted so the
// copy order — and the count in the success line — is deterministic.
const skills = (await fs.readdir(skillsSrc, { withFileTypes: true }))
  .filter(
    entry =>
      entry.isDirectory() &&
      fs.existsSync(path.join(skillsSrc, entry.name, 'SKILL.md'))
  )
  .map(entry => entry.name)
  .sort();

// Checked BEFORE emptying the destination, which the hardcoded version did not
// have to think about. Reading a roster off disk means a wrong path or a
// renamed directory now yields zero skills instead of an error, and emptying
// first would ship an empty bundle rather than failing.
if (!skills.length) {
  console.error(`[sync-skills] no skills found in ${skillsSrc}`);
  process.exit(1);
}

await fs.emptyDir(skillsDest);

for (const name of skills) {
  await fs.copy(path.join(skillsSrc, name), path.join(skillsDest, name));
}

console.log(`[sync-skills] copied ${skills.length} skills -> templates/skills`);
