#!/usr/bin/env node
/**
 * Strip `<!-- bestax:generated <id> -->` markers from the BUILT site.
 *
 * The markers are a source-control mechanism: they tell `scripts/gen-api-docs.mjs`
 * which regions it owns, and they tell a human editor which lines a `pnpm gen`
 * will overwrite. Neither audience reads the built output.
 *
 * They matter here because this site's LLM surface is first-class (see
 * docs/CLAUDE.md): `docusaurus-plugin-llms` copies markdown straight from disk
 * and does not strip HTML comments, so without this pass the markers appear
 * ~600 times in llms-full.txt and in all 81 per-page `.md` twins — the exact
 * files agents ingest. Nothing is lost: the content between a marker pair is
 * ordinary markdown and is left untouched.
 *
 * Why a build STEP and not a Docusaurus plugin: `postBuild` hooks run under
 * `Promise.all` (docusaurus/core buildLocale.js), so declaring a plugin after
 * docusaurus-plugin-llms does NOT make it run after — it races, and on the
 * first attempt it ran first and found nothing to strip. Chaining after
 * `docusaurus build` is the only ordering guarantee available.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'build');
const MARKER =
  /^[ \t]*<!--[ \t]*\/?bestax:generated[ \t][^>]*-->[ \t]*\r?\n?/gm;

async function markdownFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await markdownFiles(full)));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

async function main() {
  if (!existsSync(OUT_DIR)) {
    console.error(
      `${OUT_DIR} does not exist — run \`docusaurus build\` first.`
    );
    process.exit(1);
  }

  const targets = await markdownFiles(OUT_DIR);
  for (const name of ['llms.txt', 'llms-full.txt']) {
    const full = join(OUT_DIR, name);
    if (existsSync(full)) targets.push(full);
  }

  let stripped = 0;
  let touched = 0;
  for (const file of targets) {
    const src = await readFile(file, 'utf8');
    const hits = src.match(MARKER);
    if (!hits) continue;
    // Removing a marker line leaves the blank line that followed it, which
    // would open a gap mid-paragraph. Collapse runs of 3+ newlines back to 2.
    await writeFile(file, src.replace(MARKER, '').replace(/\n{3,}/g, '\n\n'));
    stripped += hits.length;
    touched++;
  }
  console.log(
    `strip-generated-markers: removed ${stripped} marker(s) from ${touched} file(s)`
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
