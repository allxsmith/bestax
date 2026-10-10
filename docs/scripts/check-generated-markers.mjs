#!/usr/bin/env node
/**
 * Check that no `<!-- bestax:generated <id> -->` marker reaches the BUILT
 * site's markdown.
 *
 * The markers are a source-control mechanism: they tell `scripts/gen-api-docs.mjs`
 * which regions it owns, and they tell a human editor which lines a `pnpm gen`
 * will overwrite. Neither audience reads the built output, and this site's
 * LLM surface is first-class (see docs/CLAUDE.md). docusaurus-plugin-llms
 * drops HTML comments outside code, the markers with them, and this step
 * checks that none got through, without parsing it: every built `.md` under
 * build/, the dev.to syndication copies of blog posts included, plus
 * llms.txt and llms-full.txt, must contain the keyword `bestax:generated`
 * zero times. Every marker carries it however its `<` or its line ending is
 * written. It changes no file.
 *
 * So a docs page fails if it names the keyword in code or in prose, which the
 * plugin keeps as written, and a post syndicated to dev.to fails if it names
 * it anywhere, since that copy keeps the post's comments too. A marker
 * comment outside code on a docs page is the plugin's to drop, and a post
 * that is not syndicated is not in build/ as markdown at all. A page or post
 * that wants to show marker syntax shows it without the keyword, or changes
 * this check in the same PR.
 *
 * The step also fails when llms.txt or llms-full.txt is missing, when a file
 * it checks is empty or only whitespace, when a file or directory under
 * build/ cannot be read, and when build/docs holds no twin, a `.md` that is
 * not a copy of one in static/. It reports every problem it finds before it
 * fails, walking past a directory it cannot read. Whether the LLM output is
 * complete is not this check's job.
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

/**
 * The files under `dir` whose names match `pattern`. A directory that cannot
 * be read goes to `unreadable`, and the walk carries on past it.
 */
function filesUnder(dir, pattern, unreadable) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    unreadable(dir, err);
    return [];
  }
  return entries.flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return filesUnder(path, pattern, unreadable);
    return entry.isFile() && pattern.test(entry.name) ? [path] : [];
  });
}

/**
 * Checks the built markdown in `docs`'s build/, with llms.txt and
 * llms-full.txt, and returns the exit code. `docs` and `io` are for tests.
 */
export async function checkBuild(docs = DOCS, io = console) {
  const outDir = join(docs, 'build');
  if (!existsSync(outDir)) {
    io.error(`${outDir} does not exist — run \`docusaurus build\` first.`);
    return 1;
  }

  const problems = [];
  const unreadable = (path, err) =>
    problems.push(
      `${relative(docs, path)} could not be read: ${err.code ?? err.message}.`
    );
  const pages = filesUnder(outDir, /\.md$/, unreadable);
  // Docusaurus copies static/ into build/ as is, so a .md there is no twin.
  const isTwin = file =>
    file.startsWith(join(outDir, 'docs', sep)) &&
    !existsSync(join(docs, 'static', relative(outDir, file)));
  if (!pages.some(isTwin)) {
    problems.push(
      'build/docs holds no twin, a .md that is not a copy of one in ' +
        'static/, so docusaurus-plugin-llms wrote none, or this step ran ' +
        'before it.'
    );
  }
  const present = [];
  for (const name of ['llms.txt', 'llms-full.txt']) {
    const file = join(outDir, name);
    if (existsSync(file)) {
      present.push(file);
    } else {
      problems.push(
        `${relative(docs, file)} is missing, so docusaurus-plugin-llms did ` +
          `not write it, or this step ran before it.`
      );
    }
  }

  // One file at a time, so a growing site never holds them all open.
  const files = [...pages, ...present];
  for (const file of files) {
    const rel = relative(docs, file);
    let text;
    try {
      text = await readFile(file, 'utf8');
    } catch (err) {
      unreadable(file, err);
      continue;
    }
    if (!text.trim()) {
      problems.push(`${rel} is empty, so there is nothing in it to check.`);
    } else if (text.includes(KEYWORD)) {
      problems.push(
        `${rel} contains ${KEYWORD}, so the keyword reached built output: ` +
          `a marker got through, or a page shows marker syntax with the ` +
          `keyword in it.`
      );
    }
  }
  if (problems.length) {
    for (const problem of problems) {
      io.error(`check-generated-markers: ${problem}`);
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
