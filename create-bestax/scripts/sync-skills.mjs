// Sync the canonical Agent Skills from the monorepo's top-level `skills/` dir
// into `create-bestax/templates/skills`, so they ship inside the published
// package and can be copied into scaffolded apps' `.claude/skills/`.
//
// `/skills` is the single source of truth; `templates/skills` is generated and
// gitignored. Runs on `build` and `prepack`.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'fs-extra';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, '..');
const skillsSrc = path.resolve(pkgRoot, '..', 'skills');
const skillsDest = path.join(pkgRoot, 'templates', 'skills');

const SKILLS = [
  'bestax-custom-component',
  'bestax-form',
  'bestax-theming',
  'bestax-layout-scaffold',
];

if (!fs.existsSync(skillsSrc)) {
  console.error(`[sync-skills] source not found: ${skillsSrc}`);
  process.exit(1);
}

await fs.emptyDir(skillsDest);

for (const name of SKILLS) {
  const from = path.join(skillsSrc, name);
  if (!fs.existsSync(from)) {
    console.error(`[sync-skills] missing skill: ${from}`);
    process.exit(1);
  }
  await fs.copy(from, path.join(skillsDest, name));
}

console.log(`[sync-skills] copied ${SKILLS.length} skills -> templates/skills`);
