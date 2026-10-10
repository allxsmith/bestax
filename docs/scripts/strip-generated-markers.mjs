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
 * Which pages to check, and where their twins are, comes from Docusaurus
 * itself: the metadata it writes for every doc page gives the page's source
 * and permalink, so a draft, an excluded file, a number prefix and an `id` or
 * `slug` in front matter all come out as Docusaurus routed them. A twin is
 * named from the permalink as the plugin names it (twinPath). The step fails
 * when it finds no rendered page to check, when two pages would get the same
 * twin, and when a page carries markers but the build lacks llms-full.txt or
 * that page's own twin, since a check over files that are not there passes
 * quietly.
 *
 * The strip is fence-aware (generated-markers-lib.mjs), so a marker a page
 * shows inside a code block stays. After stripping, a twin may keep no more
 * marker lines than its own source page shows inside fences, and may name
 * `bestax:generated` on no more lines than the page does outside its marker
 * lines. The plugin builds llms.txt and llms-full.txt from the same pages as
 * the twins, so each of them may keep and name no more than the twins in the
 * build do between them. More fenced markers mean a fence left open earlier in
 * that file hid real ones, which matters most in llms-full.txt, where one
 * page's open fence reaches every page after it. More named lines mean a
 * marker reached the file in a form the strip does not recognize. Either way
 * the step fails, naming the file.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripNumberPrefix } from 'docusaurus-plugin-llms/lib/numberPrefix.js';
import { isMainModule } from '../../scripts/lib/main-module.mjs';
import {
  leakedMarkers,
  markerCounts,
  stripMarkers,
} from './generated-markers-lib.mjs';

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The joined files, built from the same pages as the twins. */
const JOINED = ['llms.txt', 'llms-full.txt'];

/** Where Docusaurus writes each doc page's metadata, relative to the site. */
const PAGE_DATA = '.docusaurus/docusaurus-plugin-content-docs/default';

/** The site config as Docusaurus built with it, relative to the site. */
const SITE_CONFIG = '.docusaurus/docusaurus.config.mjs';

/** The lines of `src` that name the marker at all, in any form. */
const mentions = src =>
  src.split('\n').filter(line => line.includes('bestax:generated')).length;

/** `path` with `/` between its segments, whatever the platform's separator. */
const slashed = path => path.split(sep).join('/');

/** `route` relative to `baseUrl`, with no slash at either end. */
function underBase(route, baseUrl) {
  const base = baseUrl.replace(/\/+$/, '');
  const path = route.replace(/\/+$/, '') || '/';
  if (base && path === base) return '';
  const rest =
    base && path.startsWith(`${base}/`) ? path.slice(base.length) : path;
  return rest.replace(/^\/+/, '');
}

/**
 * Where docusaurus-plugin-llms writes the `.md` twin of the page at
 * `permalink`, relative to build/. The plugin names a twin after its page's
 * route below the baseUrl, with each segment's number prefix stripped (by the
 * plugin's own parser), an `.md` or `.mdx` ending dropped and `.md` added, and
 * the site root as `index.md`. Two pages it would name alike get numbered
 * files instead, which stripBuild refuses rather than follows.
 */
export function twinPath(permalink, baseUrl = '/') {
  const route = underBase(permalink, baseUrl);
  if (!route) return 'index.md';
  const name = route.split('/').map(stripNumberPrefix).join('/');
  return `${name.replace(/\.mdx?$/i, '')}.md`
    .split('/')
    .filter(segment => segment && segment !== '.' && segment !== '..')
    .join('/');
}

/**
 * Whether build/ holds the HTML Docusaurus renders for `route` (relative to
 * the baseUrl), in either layout its trailingSlash setting picks.
 */
function rendered(outDir, route) {
  if (!route) return existsSync(join(outDir, 'index.html'));
  return (
    existsSync(join(outDir, `${route}.html`)) ||
    existsSync(join(outDir, route, 'index.html'))
  );
}

/**
 * The doc pages this build rendered, each with its source relative to `docs`
 * and its twin relative to build/, or null when Docusaurus left no metadata to
 * read. `.docusaurus` keeps the metadata of a page deleted or made a draft
 * since it was last cleared, so a page counts only while its source is there
 * and its HTML is in build/, which Docusaurus empties before every build.
 */
async function builtPages(docs, outDir) {
  const dir = join(docs, PAGE_DATA);
  const config = join(docs, SITE_CONFIG);
  if (!existsSync(dir) || !existsSync(config)) return null;
  const { baseUrl = '/' } = (await import(pathToFileURL(config).href)).default;
  const pages = [];
  for (const name of (await readdir(dir)).sort()) {
    if (!name.endsWith('.json')) continue;
    const page = JSON.parse(await readFile(join(dir, name), 'utf8'));
    if (typeof page.source !== 'string') continue;
    if (typeof page.permalink !== 'string') continue;
    const source = page.source.replace(/^@site\//, '');
    if (!existsSync(join(docs, source))) continue;
    if (!rendered(outDir, underBase(page.permalink, baseUrl))) continue;
    pages.push({ source, twin: twinPath(page.permalink, baseUrl) });
  }
  return pages;
}

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
  // a pass over pages it could not find would let markers ship with a green
  // build. So no rendered page at all is a failure, not an empty pass.
  const pages = await builtPages(docs, outDir);
  if (!pages?.length) {
    io.error(
      `strip-generated-markers: found no doc page this build rendered in ` +
        `${PAGE_DATA}. Docusaurus moved the metadata it writes there, or ` +
        `this step ran before \`docusaurus build\`, so nothing here could ` +
        `check the LLM surface. Refusing to pass silently.`
    );
    return 1;
  }

  // Each page: how many markers it carries, how many it shows inside a
  // fence, which is all its twin may keep, and how many other lines name the
  // marker, fenced or in prose, which its twin may keep too.
  let inSource = 0;
  for (const page of pages) {
    const text = await readFile(join(docs, page.source), 'utf8');
    const counts = markerCounts(text);
    page.markers = counts.unfenced;
    page.fenced = counts.fenced;
    page.named = mentions(text) - counts.unfenced;
    inSource += page.markers;
  }

  // Two pages the plugin would name alike get numbered twins in the order it
  // reads the files, so which twin is whose cannot be worked out here, and
  // either could be held to the other page's counts.
  const byTwin = new Map();
  for (const page of pages) {
    const key = page.twin.toLowerCase();
    byTwin.set(key, [...(byTwin.get(key) ?? []), page]);
  }
  const clashes = [...byTwin.values()].filter(group => group.length > 1);
  if (clashes.length) {
    for (const group of clashes) {
      io.error(
        `strip-generated-markers: ${group.map(page => page.source).join(', ')} ` +
          `would all have the twin build/${group[0].twin}. ` +
          `docusaurus-plugin-llms numbers all but one of them in the order it ` +
          `reads the files, so this step cannot tell which twin is whose. ` +
          `Give each page a route of its own.`
      );
    }
    return 1;
  }

  // When the pages carry markers, the build must hold the files they feed:
  // llms-full.txt, and the twin of every page that carries them. Counting the
  // markers in the pages is what tells "no managed pages yet" from "this step
  // stopped working".
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

  let stripped = 0;
  let touched = 0;
  let checked = 0;
  const leaks = [];
  /** Strips `file`, holds what is left to `allowed`, and returns that. */
  async function check(file, allowed, from) {
    const result = stripMarkers(await readFile(file, 'utf8'));
    if (result.stripped) {
      await writeFile(file, result.out);
      stripped += result.stripped;
      touched++;
    }
    checked++;
    const rel = slashed(relative(docs, file));
    const leak = leakedMarkers(rel, result.kept, allowed.fenced, from);
    const named = mentions(result.out);
    if (leak) leaks.push(leak);
    else if (named > allowed.named) {
      leaks.push(
        `${rel}: ${named} line(s) still name bestax:generated, against ` +
          `${allowed.named} such line(s) outside the marker lines in ` +
          `${from}. A marker reached this file in a form the strip ` +
          `does not recognize, so it would ship.`
      );
    }
    return { fenced: result.kept, named };
  }

  // A twin is held to its own page. A page without markers whose twin is not
  // at the path twinPath gives has nothing for that twin to leak, so it is
  // skipped rather than failed. The joined files are built from the same
  // pages as the twins, so each is held to what the twins in the build hold
  // between them.
  const twins = { fenced: 0, named: 0 };
  for (const page of pages) {
    const file = join(outDir, page.twin);
    if (!existsSync(file)) continue;
    const left = await check(file, page, page.source);
    twins.fenced += left.fenced;
    twins.named += left.named;
  }
  for (const name of JOINED) {
    const file = join(outDir, name);
    if (existsSync(file)) await check(file, twins, 'the twins it joins');
  }

  if (leaks.length) {
    for (const leak of leaks) io.error(`strip-generated-markers: ${leak}`);
    return 1;
  }

  io.log(
    `strip-generated-markers: removed ${stripped} marker(s) from ${touched} ` +
      `file(s), of ${checked} checked`
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
