#!/usr/bin/env node
/**
 * Strip `<!-- bestax:generated <id> -->` markers from the BUILT site.
 *
 * The markers are a source-control mechanism: they tell `scripts/gen-api-docs.mjs`
 * which regions it owns, and they tell a human editor which lines a `pnpm gen`
 * will overwrite. Neither audience reads the built output.
 *
 * They matter here because this site's LLM surface is first-class (see
 * docs/CLAUDE.md): llms.txt, llms-full.txt and the per-page `.md` twins are the
 * exact files agents ingest, and they are the files this step reads. Other
 * built markdown, such as the dev.to copies of blog posts, is not part of that
 * surface and is left alone. docusaurus-plugin-llms drops HTML comments outside
 * code itself, the markers included, so this pass usually strips nothing. It
 * stays as the check that none got through, and strips any that did. Nothing
 * is lost: the content between a marker pair is ordinary markdown and is left
 * untouched.
 *
 * Why a build STEP and not a Docusaurus plugin: `postBuild` hooks run under
 * `Promise.all` (docusaurus/core buildLocale.js), so declaring a plugin after
 * docusaurus-plugin-llms does NOT make it run after — it races, and on the
 * first attempt it ran first and found nothing to strip. Chaining after
 * `docusaurus build` is the only ordering guarantee available.
 *
 * The step fails when a source page carries markers but the build lacks
 * llms-full.txt or that page's own twin, since a check over files that are
 * not there passes quietly.
 *
 * The strip is fence-aware (generated-markers-lib.mjs), so a marker a page
 * shows inside a code block stays. After stripping, a twin may keep no more
 * marker lines than its own source page shows inside fences, and llms.txt and
 * llms-full.txt no more than all the source pages together. More means a
 * fence left open earlier in that file hid real markers, which matters most in
 * llms-full.txt, where one page's open fence reaches every page after it. The
 * step fails then, naming the file. It fails the same way when a file names
 * `bestax:generated` on more lines than its source pages do outside their
 * marker lines, which is a marker that reached it in a form the strip does not
 * recognize.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainModule } from '../../scripts/lib/main-module.mjs';
import {
  leakedMarkers,
  markerCounts,
  stripMarkers,
} from './generated-markers-lib.mjs';

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The joined files, each holding every source page. */
const JOINED = ['llms.txt', 'llms-full.txt'];

/** The lines of `src` that name the marker at all, in any form. */
const mentions = src =>
  src.split('\n').filter(line => line.includes('bestax:generated')).length;

/** `path` with `/` between its segments, whatever the platform's separator. */
const slashed = path => path.split(sep).join('/');

async function filesUnder(dir, pattern) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await filesUnder(full, pattern)));
    else if (pattern.test(entry.name)) out.push(full);
  }
  return out;
}

/** A page's frontmatter `slug`, or null. */
function frontMatterSlug(text) {
  const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  const slug = front?.[1].match(/^slug:[ \t]*(['"]?)([^'"\r\n]*?)\1[ \t]*$/m);
  return slug?.[2] || null;
}

/**
 * Where docusaurus-plugin-llms writes the `.md` twin of the source page at
 * `rel` (relative to docs/docs, `/`-separated), relative to build/. The plugin
 * names a twin after its page's route, so this follows Docusaurus's routing
 * for the cases this site uses: a frontmatter `slug`, absolute or relative to
 * the page's folder, and a category index (`index`, `README`, or a file named
 * after its folder) taking its folder's route. A page these rules route wrongly
 * gets a path with no twin at it, which fails the build when the page carries
 * markers rather than passing it.
 */
export function twinPath(rel, text) {
  const dir = posix.dirname(rel) === '.' ? '' : posix.dirname(rel);
  const slug = frontMatterSlug(text);
  let route;
  if (slug) {
    route = posix.join('/', slug.startsWith('/') ? '' : dir, slug);
  } else {
    const name = posix.basename(rel).replace(/\.mdx?$/, '');
    const indexNames = ['index', 'readme', posix.basename(dir).toLowerCase()];
    const isIndex = indexNames.includes(name.toLowerCase());
    route = posix.join('/', dir, isIndex ? '' : name);
  }
  return `${posix.join('docs', route).replace(/\/+$/, '')}.md`;
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

  // Each source page with its twin: how many markers it carries, how many it
  // shows inside a fence, which is all its twin may keep, and how many other
  // lines name the marker, fenced or in prose, which its twin may keep too.
  // The joined files hold every page, so they are held to the totals.
  const pages = [];
  const all = { fenced: 0, named: 0 };
  let inSource = 0;
  const sources = existsSync(srcDir) ? await filesUnder(srcDir, /\.mdx?$/) : [];
  for (const file of sources) {
    const text = await readFile(file, 'utf8');
    const counts = markerCounts(text);
    const page = {
      source: slashed(relative(docs, file)),
      twin: twinPath(slashed(relative(srcDir, file)), text),
      markers: counts.unfenced,
      fenced: counts.fenced,
      named: mentions(text) - counts.unfenced,
    };
    pages.push(page);
    inSource += page.markers;
    all.fenced += page.fenced;
    all.named += page.named;
  }

  // Stripping nothing is the normal case, since the plugin drops the markers
  // itself. Checking nothing is not. This step exists BECAUSE a postBuild
  // plugin silently ran too early and found no markers (see the header), and
  // a pass over files that are not there, or are not where the plugin writes
  // them, would let markers ship into llms-full.txt and the `.md` twins with
  // a green build. So when the source pages carry markers, the build must hold
  // the files they feed: llms-full.txt, and the twin of every page that
  // carries them. Comparing against the SOURCE pages is what tells "no managed
  // pages yet" from "this step stopped working".
  const missing = [];
  if (!existsSync(join(outDir, 'llms-full.txt'))) {
    missing.push('no llms-full.txt');
  }
  const twinless = pages.filter(
    page => page.markers && !existsSync(join(outDir, page.twin))
  );
  if (twinless.length) {
    const named = twinless
      .slice(0, 3)
      .map(page => `${page.source} (expected build/${page.twin})`);
    if (twinless.length > named.length) {
      named.push(`${twinless.length - named.length} more`);
    }
    missing.push(
      `no .md twin for ${twinless.length} page(s) carrying them: ` +
        named.join(', ')
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

  // A twin is held to its own page, and a joined file to every page. A page
  // without markers whose twin is not at the path twinPath gives has nothing
  // for that twin to leak, so it is skipped rather than failed.
  const targets = [];
  for (const page of pages) {
    const file = join(outDir, page.twin);
    if (existsSync(file)) {
      targets.push({ file, ...page, from: page.source });
    }
  }
  for (const name of JOINED) {
    const file = join(outDir, name);
    if (existsSync(file)) {
      targets.push({ file, ...all, from: 'the source pages' });
    }
  }

  let stripped = 0;
  let touched = 0;
  const leaks = [];
  for (const target of targets) {
    const result = stripMarkers(await readFile(target.file, 'utf8'));
    if (result.stripped) {
      await writeFile(target.file, result.out);
      stripped += result.stripped;
      touched++;
    }
    const rel = slashed(relative(docs, target.file));
    const leak = leakedMarkers(rel, result.kept, target.fenced, target.from);
    const named = mentions(result.out);
    if (leak) leaks.push(leak);
    else if (named > target.named) {
      leaks.push(
        `${rel}: ${named} line(s) still name bestax:generated, against ` +
          `${target.named} such line(s) outside the marker lines in ` +
          `${target.from}. A marker reached this file in a form the strip ` +
          `does not recognize, so it would ship.`
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
