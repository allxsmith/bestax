#!/usr/bin/env node
/**
 * Strip `<!-- bestax:generated <id> -->` markers from the BUILT site.
 *
 * The markers are a source-control mechanism: they tell `scripts/gen-api-docs.mjs`
 * which regions it owns, and they tell a human editor which lines a `pnpm gen`
 * will overwrite. Neither audience reads the built output.
 *
 * They matter here because this site's LLM surface is first-class (see
 * docs/CLAUDE.md): llms-full.txt and the per-page `.md` twins are the exact
 * files agents ingest. docusaurus-plugin-llms drops HTML comments outside code
 * itself, the markers included, so this pass usually strips nothing. It stays
 * as the check that none got through, and strips any that did. Nothing is
 * lost: the content between a marker pair is ordinary markdown and is left
 * untouched.
 *
 * Why a build STEP and not a Docusaurus plugin: `postBuild` hooks run under
 * `Promise.all` (docusaurus/core buildLocale.js), so declaring a plugin after
 * docusaurus-plugin-llms does NOT make it run after — it races, and on the
 * first attempt it ran first and found nothing to strip. Chaining after
 * `docusaurus build` is the only ordering guarantee available.
 *
 * The strip is fence-aware (generated-markers-lib.mjs), so a marker a page
 * shows inside a code block stays. After stripping, a built file may keep no
 * more marker lines than the source pages show inside fences. More means a
 * fence left open earlier in that file hid real markers, which matters most
 * in llms.txt and llms-full.txt, where one page's open fence reaches every
 * page after it. The step fails then, naming the file. It fails the same way
 * when a built file names `bestax:generated` on more lines than the source
 * pages do outside their marker lines, which is a marker that reached it in a
 * form the strip does not recognize.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainModule } from '../../scripts/lib/main-module.mjs';
import {
  leakedMarkers,
  markerCounts,
  stripMarkers,
} from './generated-markers-lib.mjs';

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The lines of `src` that name the marker at all, in any form. */
const mentions = src =>
  src.split('\n').filter(line => line.includes('bestax:generated')).length;

async function filesUnder(dir, pattern) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await filesUnder(full, pattern)));
    else if (pattern.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Strips the markers from `docs`'s build/ in place and checks what is left.
 * Returns the exit code. `docs` and `io` are for tests.
 */
export async function stripBuild(docs = DOCS, io = console) {
  const outDir = join(docs, 'build');
  const srcDir = join(docs, 'docs');
  if (!existsSync(outDir)) {
    io.error(`${outDir} does not exist — run \`docusaurus build\` first.`);
    return 1;
  }

  // The source pages: how many markers they carry, on how many pages, and how
  // many of them a fence holds, which is all a built file may keep. Every
  // other line that names the marker, fenced or in prose, may stay too.
  let inSource = 0;
  let pagesWithMarkers = 0;
  let fencedInSources = 0;
  let namedInSources = 0;
  const sources = existsSync(srcDir) ? await filesUnder(srcDir, /\.mdx?$/) : [];
  for (const file of sources) {
    const text = await readFile(file, 'utf8');
    const counts = markerCounts(text);
    inSource += counts.unfenced;
    if (counts.unfenced) pagesWithMarkers++;
    fencedInSources += counts.fenced;
    namedInSources += mentions(text) - counts.unfenced;
  }

  const twins = await filesUnder(outDir, /\.md$/);
  const targets = [...twins];
  for (const name of ['llms.txt', 'llms-full.txt']) {
    const full = join(outDir, name);
    if (existsSync(full)) targets.push(full);
  }

  // Stripping nothing is the normal case, since the plugin drops the markers
  // itself. Checking nothing is not. This step exists BECAUSE a postBuild
  // plugin silently ran too early and found no markers (see the header), and
  // a pass over files that are not there, or are not where the plugin writes
  // them, would let markers ship into llms-full.txt and the `.md` twins with
  // a green build. So when the source pages carry markers, the build must hold
  // the files they feed: llms-full.txt, and at least a `.md` file per page.
  // Comparing against the SOURCE pages is what tells "no managed pages yet"
  // from "this step stopped working".
  const missing = [];
  if (!existsSync(join(outDir, 'llms-full.txt'))) {
    missing.push('no llms-full.txt');
  }
  if (twins.length < pagesWithMarkers) {
    missing.push(
      `${twins.length} .md file(s) for ${pagesWithMarkers} page(s) carrying them`
    );
  }
  if (inSource > 0 && missing.length) {
    io.error(
      `strip-generated-markers: the source pages carry ${inSource} ` +
        `marker(s), but the build has ${missing.join(' and ')}. The built ` +
        `markdown moved, or this step ran before docusaurus-plugin-llms, so ` +
        `nothing here checked the LLM surface. Refusing to pass silently.`
    );
    return 1;
  }

  let stripped = 0;
  let touched = 0;
  const leaks = [];
  for (const file of targets) {
    const result = stripMarkers(await readFile(file, 'utf8'));
    if (result.stripped) {
      await writeFile(file, result.out);
      stripped += result.stripped;
      touched++;
    }
    const rel = relative(outDir, file);
    const leak = leakedMarkers(rel, result.kept, fencedInSources);
    const named = mentions(result.out);
    if (leak) leaks.push(leak);
    else if (named > namedInSources) {
      leaks.push(
        `${rel}: ${named} line(s) still name bestax:generated, ` +
          `and the source pages show ${namedInSources} outside their marker ` +
          `lines. A marker reached this file in a form the strip does not ` +
          `recognize, so it would ship.`
      );
    }
  }

  if (leaks.length) {
    for (const leak of leaks) io.error(`strip-generated-markers: ${leak}`);
    return 1;
  }

  io.log(
    `strip-generated-markers: removed ${stripped} marker(s) from ${touched} ` +
      `file(s), of ${targets.length} checked`
  );
  return 0;
}

if (isMainModule(import.meta.url)) {
  stripBuild().then(
    code => {
      process.exitCode = code;
    },
    err => {
      console.error(err);
      process.exitCode = 1;
    }
  );
}
