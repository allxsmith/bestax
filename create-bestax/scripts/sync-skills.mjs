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
// The copy itself is scripts/lib/sync-skills.mjs, shared with bestax-mcp's
// sync, so the checks and the `.DS_Store` filter cannot drift between them.
// This caller passes no `stateDir`, so it takes no lock and keeps no
// fingerprint: its only callers are `build` and `prepack`, which never
// overlap, and a state directory under templates/ would ship in the tarball.
// Pass one if a third caller is ever added, and keep it out of `files`.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { syncFailureText, syncSkills } from '../../scripts/lib/sync-skills.mjs';

const pkgRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

await syncSkills({
  src: path.resolve(pkgRoot, '..', 'skills'),
  dest: path.join(pkgRoot, 'templates', 'skills'),
  label: 'templates/skills',
}).catch(err => {
  console.error(syncFailureText(err));
  process.exit(1);
});
