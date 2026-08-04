#!/usr/bin/env node
/**
 * Rasterize a 1200x630 blog cover SVG to the PNG that og:image and dev.to need.
 *
 * Covers are hand-authored SVGs (crisp at any width in the post body), but
 * neither `og:image` nor a dev.to `cover_image` accepts SVG, so every cover
 * ships a PNG raster at the same stem. This script is that step: open the SVG
 * in headless Chromium at exactly 1200x630 and screenshot it. It used to be a
 * prose recipe in blog/CLAUDE.md that each post re-improvised; now it is one
 * command.
 *
 * Usage:
 *   pnpm --filter @allxsmith/bestax-docs rasterize:cover static/img/<slug>.svg
 *   node docs/scripts/rasterize-cover.mjs <cover.svg> [out.png]
 *
 * The PNG path defaults to the SVG path with the extension swapped. The SVG
 * must declare width="1200" height="630" and paint a full-bleed background
 * rect; the script refuses inputs that don't, because a letterboxed capture
 * would otherwise report success. Browsers resolve through Playwright's
 * default cache; if Chromium is missing, install it once:
 *   pnpm --filter @allxsmith/bestax-docs exec playwright install chromium
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const WIDTH = 1200;
const HEIGHT = 630;

async function main() {
  const [svgArg, pngArg] = process.argv.slice(2);
  if (!svgArg) {
    console.error('usage: rasterize-cover.mjs <cover.svg> [out.png]');
    process.exit(1);
  }
  const svgPath = resolve(svgArg);
  if (!svgPath.endsWith('.svg')) {
    console.error(`rasterize-cover: expected an .svg input, got: ${svgPath}`);
    process.exit(1);
  }
  if (!existsSync(svgPath)) {
    console.error(`rasterize-cover: no such file: ${svgPath}`);
    process.exit(1);
  }
  const pngPath = pngArg ? resolve(pngArg) : svgPath.replace(/\.svg$/, '.png');

  // Enforce the cover contract from blog/CLAUDE.md before launching anything:
  // a wrong-size or letterboxed PNG would otherwise be reported as success.
  const src = readFileSync(svgPath, 'utf8');
  const rootTag = src.match(/<svg\b[^>]*>/)?.[0];
  const rootAttr = name =>
    rootTag?.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];
  if (
    rootAttr('width') !== String(WIDTH) ||
    rootAttr('height') !== String(HEIGHT)
  ) {
    console.error(
      `rasterize-cover: the root <svg> must declare width="${WIDTH}" ` +
        `height="${HEIGHT}" (found width="${rootAttr('width') ?? 'none'}" ` +
        `height="${rootAttr('height') ?? 'none'}"). og:image and dev.to ` +
        'covers are exactly 1200x630.'
    );
    process.exit(1);
  }
  const fullBleed = (src.match(/<rect\b[^>]*>/g) ?? []).some(tag => {
    const attr = name => tag.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];
    return (
      Number(attr('x') ?? 0) === 0 &&
      Number(attr('y') ?? 0) === 0 &&
      Number(attr('width')) === WIDTH &&
      Number(attr('height')) === HEIGHT &&
      (attr('fill') ?? 'none') !== 'none'
    );
  });
  if (!fullBleed) {
    console.error(
      'rasterize-cover: no full-bleed background rect found. Paint ' +
        `<rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="..."/> ` +
        'first so the capture cannot letterbox (see the cover conventions ' +
        'in docs/blog/CLAUDE.md).'
    );
    process.exit(1);
  }

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error(
      'rasterize-cover: playwright is not installed. Run `pnpm install`; it ' +
        'is a devDependency of @allxsmith/bestax-docs.'
    );
    process.exit(1);
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    console.error(String(err?.message ?? err));
    console.error(
      'rasterize-cover: could not launch Chromium. Install it once with:\n' +
        '  pnpm --filter @allxsmith/bestax-docs exec playwright install chromium'
    );
    process.exit(1);
  }

  try {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
    });
    await page.goto(pathToFileURL(svgPath).href);
    await page.screenshot({ path: pngPath });
    console.log(`rasterize-cover: wrote ${pngPath} (${WIDTH}x${HEIGHT})`);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
