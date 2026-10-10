#!/usr/bin/env node
/**
 * Strip `<!-- bestax:generated <id> -->` markers from the BUILT site's LLM
 * files, and check that none is left.
 *
 * The markers are a source-control mechanism: they tell `scripts/gen-api-docs.mjs`
 * which regions it owns, and they tell a human editor which lines a `pnpm gen`
 * will overwrite. Neither audience reads the built output.
 *
 * They matter here because this site's LLM surface is first-class (see
 * docs/CLAUDE.md). That surface is every `.md` under build/docs (the per-page
 * twins), llms.txt and llms-full.txt, and the rule is that none of those
 * files holds a marker comment outside code, written as a comment or
 * HTML-escaped. Code is a fenced block or an inline code span, so a page that
 * shows a marker in code keeps it, and prose that names `bestax:generated`
 * without the comment syntax is fine. Other built markdown, such as the
 * dev.to copies of blog posts, is not part of the surface and is left alone.
 *
 * docusaurus-plugin-llms drops HTML comments outside code itself, so this
 * pass usually strips nothing. It strips any whole marker line that got
 * through, then fails the build on a marker left outside code, and on a file
 * that ends inside a fence it never closed, since that fence would hide every
 * marker after it. Nothing is lost: the content between a marker pair is
 * ordinary markdown and is left untouched.
 *
 * Checking nothing fails too: a build without llms.txt or llms-full.txt, or
 * with no `.md` under build/docs while the source pages carry markers.
 *
 * Why a build STEP and not a Docusaurus plugin: `postBuild` hooks run under
 * `Promise.all` (docusaurus/core buildLocale.js), so declaring a plugin after
 * docusaurus-plugin-llms does NOT make it run after — it races, and on the
 * first attempt it ran first and found nothing to strip. Chaining after
 * `docusaurus build` is the only ordering guarantee available.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainModule } from '../../scripts/lib/main-module.mjs';
import {
  countGeneratedMarkers,
  markersOutsideCode,
  stripMarkers,
  unclosedFence,
} from './generated-markers-lib.mjs';

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The files under `dir` whose names match `pattern`, none if it is absent. */
async function filesUnder(dir, pattern) {
  if (!existsSync(dir)) return [];
  const names = await readdir(dir, { recursive: true });
  return names.filter(name => pattern.test(name)).map(name => join(dir, name));
}

const readAll = files => Promise.all(files.map(file => readFile(file, 'utf8')));

/**
 * Strips the markers from `docs`'s build/ in place and checks what is left.
 * Returns the exit code. `docs` and `io` are for tests.
 */
export async function stripBuild(docs = DOCS, io = console) {
  const outDir = join(docs, 'build');
  if (!existsSync(outDir)) {
    io.error(`${outDir} does not exist — run \`docusaurus build\` first.`);
    return 1;
  }

  // Stripping nothing is the normal case, since the plugin drops the markers
  // itself. Checking nothing is not. This step exists BECAUSE a postBuild
  // plugin silently ran too early and found no markers (see the header), and
  // a pass over files that are not there would let markers ship with a green
  // build. The source pages tell "no managed pages yet" from "the twins moved".
  const twins = await filesUnder(join(outDir, 'docs'), /\.md$/);
  const joined = ['llms.txt', 'llms-full.txt'];
  const missing = joined.filter(name => !existsSync(join(outDir, name)));
  if (!twins.length) {
    const pages = await filesUnder(join(docs, 'docs'), /\.mdx?$/);
    const sources = await readAll(pages);
    if (sources.some(src => countGeneratedMarkers(src) > 0)) {
      missing.push(
        '.md under build/docs, though the source pages carry markers'
      );
    }
  }
  if (missing.length) {
    io.error(
      `strip-generated-markers: the build has no ${missing.join(' and no ')}. ` +
        `The built markdown moved, or this step ran before ` +
        `docusaurus-plugin-llms, so nothing here checked the LLM surface. ` +
        `Refusing to pass silently.`
    );
    return 1;
  }

  const files = [...twins, ...joined.map(name => join(outDir, name))];
  const results = (await readAll(files)).map(stripMarkers);
  await Promise.all(
    files.map(
      (file, i) => results[i].stripped && writeFile(file, results[i].out)
    )
  );

  const leaks = [];
  files.forEach((file, i) => {
    const { out } = results[i];
    const rel = relative(docs, file);
    const lines = markersOutsideCode(out);
    if (lines.length) {
      leaks.push(
        `${rel}: a bestax:generated marker comment outside code, on ` +
          `line(s) ${lines.join(', ')}, would ship.`
      );
    }
    const fence = unclosedFence(out);
    if (fence) {
      leaks.push(
        `${rel}: the code fence opened on line ${fence} is never closed, ` +
          `so everything after it reads as code and a marker there would ` +
          `ship unseen.`
      );
    }
  });
  if (leaks.length) {
    for (const leak of leaks) io.error(`strip-generated-markers: ${leak}`);
    return 1;
  }

  const touched = results.filter(result => result.stripped);
  const stripped = touched.reduce((sum, result) => sum + result.stripped, 0);
  io.log(
    `strip-generated-markers: removed ${stripped} marker(s) from ` +
      `${touched.length} file(s), of ${files.length} checked`
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
