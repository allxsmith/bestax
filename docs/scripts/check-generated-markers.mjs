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
 * build/ cannot be read, when an entry under build/ is neither a regular file
 * nor a directory, such as a link, which it reports without following, and
 * when build/docs holds no twin, a `.md` that is not a copy of one in
 * static/. llms.txt and llms-full.txt are taken from the same walk, so a
 * link there is reported as one and nothing else. It reports every problem
 * it finds before it fails, walking past a directory it cannot read, and
 * says nothing of a missing file or twin where that walk already reported a
 * problem. Whether the LLM output is complete is not this check's job.
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
 * The regular files under `dir`. A directory that cannot be read, and an
 * entry that is neither a regular file nor a directory, such as a link, go
 * to `report` with why, and the walk carries on past them. A link is not
 * followed, so the walk can never loop.
 */
function filesUnder(dir, report) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    report(dir, `could not be read: ${err.code ?? err.message}.`);
    return [];
  }
  return entries.flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return filesUnder(path, report);
    if (entry.isFile()) return [path];
    report(path, 'is not a regular file or directory, so it was not checked.');
    return [];
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
  const reported = [];
  const report = (path, why) => {
    reported.push(path);
    problems.push(`${relative(docs, path)} ${why}`);
  };
  const found = filesUnder(outDir, report);
  // Whether the walk reported a problem at `path`, under it or above it, in
  // which case nothing can be said about what the plugin wrote there.
  const blocked = path =>
    reported.some(
      p => p === path || p.startsWith(path + sep) || path.startsWith(p + sep)
    );

  const pages = found.filter(file => file.endsWith('.md'));
  const docsDir = join(outDir, 'docs');
  // Docusaurus copies static/ into build/ as is, so a .md there is no twin.
  const isTwin = file =>
    file.startsWith(docsDir + sep) &&
    !existsSync(join(docs, 'static', relative(outDir, file)));
  if (!pages.some(isTwin) && !blocked(docsDir)) {
    problems.push(
      'build/docs holds no twin, a .md that is not a copy of one in ' +
        'static/, so docusaurus-plugin-llms wrote none, or this step ran ' +
        'before it.'
    );
  }
  const joined = ['llms.txt', 'llms-full.txt'].map(name => join(outDir, name));
  for (const file of joined) {
    if (!found.includes(file) && !blocked(file)) {
      problems.push(
        `${relative(docs, file)} is missing, so docusaurus-plugin-llms did ` +
          `not write it, or this step ran before it.`
      );
    }
  }

  // One file at a time, so a growing site never holds them all open.
  const files = [...pages, ...joined.filter(file => found.includes(file))];
  for (const file of files) {
    const rel = relative(docs, file);
    let text;
    try {
      text = await readFile(file, 'utf8');
    } catch (err) {
      report(file, `could not be read: ${err.code ?? err.message}.`);
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
