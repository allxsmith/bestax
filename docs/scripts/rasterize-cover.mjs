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
/* global document, getComputedStyle -- page.evaluate() callbacks execute in the browser */
import { existsSync } from 'node:fs';
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

    // Enforce the cover contract from blog/CLAUDE.md using the browser's own
    // XML parsing and computed styles. Regexes over the source are fooled by
    // quoting, whitespace, data-* attributes, and transparent paint; the DOM
    // is not, and a wrong-size or letterboxed PNG would otherwise be
    // reported as success.
    const cover = await page.evaluate(
      ({ width, height }) => {
        const root = document.documentElement;
        if (root.tagName.toLowerCase() !== 'svg') return { notSvg: true };
        const fullBleed = Array.from(document.querySelectorAll('rect')).some(
          rect => {
            try {
              const box = rect.getBBox();
              const style = getComputedStyle(rect);
              return (
                box.x <= 0 &&
                box.y <= 0 &&
                box.width >= width &&
                box.height >= height &&
                style.fill !== 'none' &&
                style.fill !== 'rgba(0, 0, 0, 0)' &&
                Number(style.opacity) > 0 &&
                Number(style.fillOpacity) > 0
              );
            } catch {
              return false;
            }
          }
        );
        return {
          width: root.getAttribute('width'),
          height: root.getAttribute('height'),
          viewBox: root.getAttribute('viewBox'),
          fullBleed,
        };
      },
      { width: WIDTH, height: HEIGHT }
    );

    const problems = [];
    if (cover.notSvg) {
      problems.push('the file did not parse as an SVG document');
    } else {
      if (cover.width !== String(WIDTH) || cover.height !== String(HEIGHT)) {
        problems.push(
          `the root <svg> must declare width="${WIDTH}" height="${HEIGHT}" ` +
            `(found width="${cover.width ?? 'none'}" ` +
            `height="${cover.height ?? 'none'}")`
        );
      }
      if (
        cover.viewBox &&
        cover.viewBox.trim().split(/\s+/).join(' ') !== `0 0 ${WIDTH} ${HEIGHT}`
      ) {
        problems.push(
          `viewBox, when present, must be "0 0 ${WIDTH} ${HEIGHT}" ` +
            `(found "${cover.viewBox}"); any other aspect letterboxes the capture`
        );
      }
      if (!cover.fullBleed) {
        problems.push(
          'no opaque full-bleed background rect found; paint ' +
            `<rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" ` +
            'fill="..."/> first'
        );
      }
    }
    if (problems.length > 0) {
      console.error(
        'rasterize-cover: refusing to rasterize:\n  - ' +
          problems.join('\n  - ') +
          '\n  See the cover conventions in docs/blog/CLAUDE.md.'
      );
      process.exitCode = 1;
      return;
    }

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
