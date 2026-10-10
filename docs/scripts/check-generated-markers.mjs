#!/usr/bin/env node
/**
 * Check the BUILT site's LLM files for `<!-- bestax:generated <id> -->`
 * markers.
 *
 * The markers are a source-control mechanism: they tell `scripts/gen-api-docs.mjs`
 * which regions it owns, and they tell a human editor which lines a `pnpm gen`
 * will overwrite. Neither audience reads the built output.
 *
 * They matter here because this site's LLM surface is first-class (see
 * docs/CLAUDE.md). That surface is every `.md` under build/docs (the per-page
 * twins), llms.txt and llms-full.txt. docusaurus-plugin-llms drops HTML
 * comments outside code, and this step checks that no marker got through:
 * none of those files may hold a marker comment outside code, with its `<`
 * written as is or as an HTML entity. Prose that names `bestax:generated`
 * without the comment syntax is fine. The step changes no file, so a marker
 * the plugin lets through fails the build.
 *
 * Code is a fenced block or an inline code span. A fence opens on a line
 * that, with any blockquote `>` prefixes and leading whitespace set aside,
 * starts with three or more backticks or tildes, at any indent, so a sample
 * fenced inside a list item counts. A backtick fence's info string may not
 * hold a backtick. The fence closes on a line read the same way, with at
 * least as many of the same character and nothing after them. An HTML
 * `<code>` element is not code here.
 *
 * A file that ends inside a fence it never closed fails too, naming the line
 * the fence opened on, since everything after it reads as code. Every page's
 * fences are checked on its own twin, so a page that leaves one open fails
 * there. In llms-full.txt a later page's fence can close it, so the joined
 * file alone would not show it.
 *
 * Checking nothing fails as well: a build without llms.txt or llms-full.txt,
 * or with no `.md` under build/docs while the source pages carry markers.
 *
 * Why a build STEP and not a Docusaurus plugin: `postBuild` hooks run under
 * `Promise.all` (docusaurus/core buildLocale.js), so declaring a plugin after
 * docusaurus-plugin-llms does NOT make it run after — it races, and on the
 * first attempt it ran first and found nothing. Chaining after
 * `docusaurus build` is the only ordering guarantee available.
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainModule } from '../../scripts/lib/main-module.mjs';
import { countGeneratedMarkers } from './generated-markers-lib.mjs';

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '..');

/** A marker comment, its `<` written as is or as an HTML entity. */
const MARKER = /(?:<|&lt;|&#0*60;|&#x0*3c;)!--[ \t]*\/?bestax:generated\b/i;

/** An inline code span: a run of backticks, text, and a run as long. */
const CODE_SPAN = /(?<!`)(`+)(?!`).+?(?<!`)\1(?!`)/g;

/** A fence line, past any blockquote `>` prefixes and leading whitespace. */
const FENCE = /^(?:[ \t]*>)*[ \t]*(`{3,}|~{3,})(.*)$/;

/**
 * One pass over `src`: `outside` holds the lines, numbered from 1, with a
 * marker comment outside code, and `unclosedAt` the line a fence opened on
 * that `src` never closes, or 0.
 */
export function findMarkers(src) {
  const outside = [];
  let fence = null;
  src.split('\n').forEach((line, i) => {
    const m = line.match(FENCE);
    if (fence) {
      const closes =
        m && m[1][0] === fence.char && m[1].length >= fence.len && !m[2].trim();
      if (closes) fence = null;
    } else if (m && !(m[1][0] === '`' && m[2].includes('`'))) {
      fence = { char: m[1][0], len: m[1].length, at: i + 1 };
    } else if (MARKER.test(line.replace(CODE_SPAN, ''))) {
      outside.push(i + 1);
    }
  });
  return { outside, unclosedAt: fence?.at ?? 0 };
}

/** The files under `dir` whose names match `pattern`, none if it is absent. */
async function filesUnder(dir, pattern) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter(entry => entry.isFile() && pattern.test(entry.name))
    .map(entry => join(entry.parentPath ?? entry.path, entry.name));
}

const readAll = files => Promise.all(files.map(file => readFile(file, 'utf8')));

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

  // This step exists BECAUSE a postBuild plugin silently ran too early and
  // found no markers (see the header), and a pass over files that are not
  // there would let markers ship with a green build. The source pages tell
  // "no managed pages yet" from "the twins moved".
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
      `check-generated-markers: the build has no ${missing.join(' and no ')}. ` +
        `The built markdown moved, or this step ran before ` +
        `docusaurus-plugin-llms, so nothing here checked the LLM surface. ` +
        `Refusing to pass silently.`
    );
    return 1;
  }

  const files = [...twins, ...joined.map(name => join(outDir, name))];
  const texts = await readAll(files);
  const problems = [];
  files.forEach((file, i) => {
    const rel = relative(docs, file);
    const { outside, unclosedAt } = findMarkers(texts[i]);
    if (outside.length) {
      problems.push(
        `${rel}: a bestax:generated marker comment outside code, on ` +
          `line(s) ${outside.join(', ')}, would ship.`
      );
    }
    if (unclosedAt) {
      problems.push(
        `${rel}: the code fence opened on line ${unclosedAt} is never ` +
          `closed, so everything after it reads as code and a marker there ` +
          `would ship unseen.`
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
