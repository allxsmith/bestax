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
  if (!fs.existsSync(agentsMd)) {
    console.error('pack-pointer-files: AGENTS.md not found');
    process.exit(1);
  }
  if (fs.existsSync(backup)) {
    // `pnpm pack --dry-run` runs prepack and never postpack, and neither does a
    // pack that fails partway, so either leaves the swap in place, and nothing
    // tells this hook a run is a dry one. While CLAUDE.md is still the consumer
    // copy byte for byte, the swap this pack wants is already done, and
    // postpack puts the backup back as usual.
    const swapped =
      fs.existsSync(claudeMd) &&
      fs.readFileSync(claudeMd).equals(fs.readFileSync(agentsMd));
    if (!swapped) {
      console.error(
        'pack-pointer-files: CLAUDE.md.bak holds the contributor CLAUDE.md from an earlier pack, ' +
          'and CLAUDE.md is missing or no longer matches AGENTS.md, since one of them changed.\n' +
          'Put the contributor file back as CLAUDE.md, keeping any edits you need, then remove CLAUDE.md.bak.'
      );
      process.exit(1);
    }
    console.log(
      'pack-pointer-files: CLAUDE.md is still the consumer copy an earlier pack left'
    );
    process.exit(0);
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
