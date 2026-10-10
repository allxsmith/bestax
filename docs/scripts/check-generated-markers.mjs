#!/usr/bin/env node
/**
 * Check that no `<!-- bestax:generated <id> -->` marker reaches the BUILT
 * site's LLM files.
 *
 * The markers are a source-control mechanism: they tell `scripts/gen-api-docs.mjs`
 * which regions it owns, and they tell a human editor which lines a `pnpm gen`
 * will overwrite. Neither audience reads the built output, and this site's
 * LLM surface is first-class (see docs/CLAUDE.md). docusaurus-plugin-llms
 * drops HTML comments outside code, the markers with them, and this step
 * checks that it did, without reading the markdown: every `.md` under build/,
 * llms.txt and llms-full.txt must contain the keyword `bestax:generated` zero
 * times. Every marker carries it however its `<` or its line ending is
 * written. It changes no file.
 *
 * A page that wants to show marker syntax would fail this check, so it shows
 * the syntax without the keyword, or changes this check in the same PR.
 *
 * The step also fails when llms.txt or llms-full.txt is missing or empty,
 * when a `.md` it checks is empty, and when build/docs holds no `.md`, the
 * sign that the plugin wrote no twins. Whether the LLM output is complete is
 * not this check's job.
 *
 * Why a build STEP and not a Docusaurus plugin: `postBuild` hooks run under
 * `Promise.all` (docusaurus/core buildLocale.js), so declaring a plugin after
 * docusaurus-plugin-llms does NOT make it run after — it races, and on the
 * first attempt it ran first and found nothing. Chaining after
 * `docusaurus build` is the only ordering guarantee available.
 */
import { readdirSync, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainModule } from '../../scripts/lib/main-module.mjs';

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '..');

/** What every marker carries, however it is escaped. */
const KEYWORD = 'bestax:generated';

/** The files under `dir` whose names match `pattern`. */
function filesUnder(dir, pattern) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && pattern.test(entry.name))
    .map(entry => join(entry.parentPath ?? entry.path, entry.name));
}

/**
 * Checks the LLM files in `docs`'s build/ and returns the exit code. `docs`
 * and `io` are for tests.
 */
export async function checkBuild(docs = DOCS, io = console) {
  const outDir = join(docs, 'build');
  if (!existsSync(outDir)) {
    io.error(`${outDir} does not exist — run \`docusaurus build\` first.`);
    return 1;
  }

  const pages = filesUnder(outDir, /\.md$/);
  const joined = ['llms.txt', 'llms-full.txt'].map(name => join(outDir, name));
  const missing = joined
    .filter(file => !existsSync(file))
    .map(file => relative(outDir, file));
  const twins = join(outDir, 'docs', sep);
  if (!pages.some(file => file.startsWith(twins))) {
    missing.push('.md under build/docs');
  }
  if (missing.length) {
    io.error(
      `check-generated-markers: the build has no ${missing.join(' and no ')}. ` +
        `The built markdown moved, or this step ran before ` +
        `docusaurus-plugin-llms, so nothing here checked the LLM surface. ` +
        `Refusing to pass silently.`
    );
    return 1;
  }

  const files = [...pages, ...joined];
  const texts = await Promise.all(files.map(file => readFile(file, 'utf8')));
  const empty = files.filter((_, i) => !texts[i]);
  if (empty.length) {
    for (const file of empty) {
      io.error(
        `check-generated-markers: ${relative(docs, file)} is empty, so ` +
          `there is nothing in it to check. Refusing to pass silently.`
      );
    }
    return 1;
  }
  const leaks = files.filter((_, i) => texts[i].includes(KEYWORD));
  if (leaks.length) {
    for (const file of leaks) {
      io.error(
        `check-generated-markers: ${relative(docs, file)} contains ` +
          `${KEYWORD}. A marker reached the LLM output, or a page shows ` +
          `marker syntax with the keyword in it.`
      );
    }
    return 1;
  }

  io.log(`check-generated-markers: checked ${files.length} file(s)`);
  return 0;
}

if (isMainModule(import.meta.url)) {
  checkBuild().then(
    code => {
      process.exitCode = code;
    },
    err => {
      console.error(err);
      process.exitCode = 1;
    }
  );
}
