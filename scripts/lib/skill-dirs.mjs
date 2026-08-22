/**
 * The one skill-discovery predicate, shared by everything that reads the
 * `skills/` roster off disk.
 *
 * There used to be four copies — create-bestax's and bestax-mcp's
 * sync-skills.mjs, gen-mcp-index.mjs, and check-conformance's readSkillDirs —
 * and they already disagreed: only one had a dot-directory policy, and two
 * sorted with localeCompare while the others used code-unit order, so a
 * locale-sensitive skill name would have failed the suite on one contributor's
 * machine only. Worse, the conformance check validated rosters against ITS
 * copy rather than the ones the bundlers actually run, so any predicate change
 * applied unevenly would silently re-open the drift #540 closed: the check
 * green while create-bestax and bestax-mcp ship different skill sets.
 *
 * Symlink-aware, because Dirent.isDirectory() is false for a symlink TO a
 * directory. The deleted allowlist-era bundler followed links (existsSync +
 * copy) and shipped a symlinked skill; discovery silently dropped it, and the
 * roster check then misdiagnosed the fully-present skill as deleted — advice
 * that would have made the non-bundling permanent.
 *
 * Sorted by code point, never locale: regenerate-and-diff gates flake when
 * the order depends on the machine's collation.
 */
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const byCodePoint = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Every candidate directory under `dir`, with whether it holds a SKILL.md.
 * A dotted directory WITHOUT one is tooling and is skipped; one WITH a
 * SKILL.md is reported, so the conformance check can refuse it by name
 * rather than discovery shipping it silently.
 */
export async function readSkillDirs(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    let isDir = entry.isDirectory();
    if (!isDir && entry.isSymbolicLink()) {
      try {
        isDir = (await stat(join(dir, entry.name))).isDirectory();
      } catch {
        // A dangling symlink is not a directory.
      }
    }
    if (!isDir) continue;

    let hasSkillFile = true;
    try {
      await stat(join(dir, entry.name, 'SKILL.md'));
    } catch {
      hasSkillFile = false;
    }
    if (entry.name.startsWith('.') && !hasSkillFile) continue;
    found.push({ name: entry.name, hasSkillFile });
  }
  return found.sort((a, b) => byCodePoint(a.name, b.name));
}

/** The roster: names of directories holding a SKILL.md, code-point sorted. */
export async function readSkillNames(dir) {
  return (await readSkillDirs(dir))
    .filter(d => d.hasSkillFile)
    .map(d => d.name);
}

/**
 * What discovery found versus what the committed authority says should
 * exist. The bundlers run this against bestax-mcp/data/skills.json — which
 * is committed and staleness-gated by gen:mcp:check — before packing, so a
 * partial skills/ tree fails loudly at pack time instead of shipping a
 * silent subset, and an untracked scratch directory fails instead of
 * shipping unreviewed. The deleted allowlist gave exactly this guarantee by
 * accident of being hardcoded; this restores it from a derived source.
 */
export function rosterDiff(found, authority) {
  const have = new Set(found);
  const want = new Set(authority);
  return {
    missing: authority.filter(n => !have.has(n)),
    extra: found.filter(n => !want.has(n)),
  };
}
