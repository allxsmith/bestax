#!/usr/bin/env node
// Swaps the internal contributor CLAUDE.md for a consumer-facing copy of
// AGENTS.md while the tarball is packed (issue #344). The repo file must come
// back untouched, so `prepack` backs it up and `postpack` restores it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const claudeMd = path.join(pkgRoot, 'CLAUDE.md');
const backup = path.join(pkgRoot, 'CLAUDE.md.bak');
const agentsMd = path.join(pkgRoot, 'AGENTS.md');

const mode = process.argv[2];

if (mode === 'prepack') {
  if (fs.existsSync(backup)) {
    console.error(
      'pack-pointer-files: CLAUDE.md.bak already exists — a previous pack did not finish.\n' +
        'Restore the contributor file first: mv CLAUDE.md.bak CLAUDE.md'
    );
    process.exit(1);
  }
  if (!fs.existsSync(agentsMd)) {
    console.error('pack-pointer-files: AGENTS.md not found');
    process.exit(1);
  }
  fs.copyFileSync(claudeMd, backup);
  fs.copyFileSync(agentsMd, claudeMd);
  console.log(
    'pack-pointer-files: CLAUDE.md swapped to the consumer copy of AGENTS.md'
  );
} else if (mode === 'postpack') {
  if (!fs.existsSync(backup)) {
    console.error(
      'pack-pointer-files: CLAUDE.md.bak missing — nothing to restore'
    );
    process.exit(1);
  }
  fs.copyFileSync(backup, claudeMd);
  fs.rmSync(backup);
  console.log('pack-pointer-files: contributor CLAUDE.md restored');
} else {
  console.error(
    'Usage: node scripts/pack-pointer-files.mjs <prepack|postpack>'
  );
  process.exit(1);
}
