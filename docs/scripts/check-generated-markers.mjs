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
 * checks that none got through, without reading the markdown: every built
 * `.md` under build/, the dev.to syndication copies of blog posts included,
 * plus llms.txt and llms-full.txt, must contain the keyword
 * `bestax:generated` zero times. Every marker carries it however its `<` or
 * its line ending is written. It changes no file.
 *
 * A docs page or blog post that wants to show marker syntax would fail this
 * check, so it shows the syntax without the keyword, or changes this check in
 * the same PR.
 *
 * The step also fails when llms.txt or llms-full.txt is missing, when a file
 * it checks is empty or only whitespace, and when build/docs holds no `.md`,
 * the sign that the plugin wrote no twins. It reports every problem it finds
 * before it fails. Whether the LLM output is complete is not this check's job.
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
    .map(entry => join(entry.parentPath, entry.name));
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
  const pages = filesUnder(outDir, /\.md$/);
  if (!pages.some(file => file.startsWith(join(outDir, 'docs', sep)))) {
    problems.push(
      'build/docs holds no .md, so docusaurus-plugin-llms wrote no twins, ' +
        'or this step ran before it.'
    );
  }
  const joined = ['llms.txt', 'llms-full.txt'].map(name => join(outDir, name));
  for (const file of joined.filter(file => !existsSync(file))) {
    problems.push(
      `${relative(docs, file)} is missing, so docusaurus-plugin-llms did ` +
        `not write it, or this step ran before it.`
    );
  }

  const files = [...pages, ...joined.filter(file => existsSync(file))];
  const texts = await Promise.all(files.map(file => readFile(file, 'utf8')));
  files.forEach((file, i) => {
    const rel = relative(docs, file);
    if (!texts[i].trim()) {
      problems.push(`${rel} is empty, so there is nothing in it to check.`);
    } else if (texts[i].includes(KEYWORD)) {
      problems.push(
        `${rel} contains ${KEYWORD}, so the keyword reached built output: ` +
          `a marker got through, or a page shows marker syntax with the ` +
          `keyword in it.`
      );
    }
  });
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
