#!/usr/bin/env node
/**
 * Draw the ported templates' images from their scenes.
 *
 * Every image in `templates/<slug>/` is drawn by code: `scenes/<slug>.mjs`
 * here lists the template's images, each with the path it is written to, one
 * plain sentence on what it shows, and a `draw()` that builds the scene with
 * the voxel renderer (`voxel.mjs`, the block library in `blocks.mjs`, the
 * flat layers in `backdrop.mjs`) and returns the SVG. Nothing reads an image,
 * so what a scene draws is exactly what its code says.
 *
 * Writing an image also writes its entry in the template's
 * `image-provenance.json`: the hash, and, when the drawing changed, today's
 * date. An entry's `replaces`, which says what upstream image the file stands
 * in for, is kept. `template-art.test.mjs` beside this script holds each file
 * to what its scene draws, so an image can only change by changing its code.
 *
 * Usage:
 *   pnpm --filter @allxsmith/bestax-docs draw:template-art [slug...]
 *   node docs/scripts/template-art/draw.mjs [slug...]
 *
 * With no slug it draws every template that has a scene module.
 */
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO = dirname(dirname(dirname(HERE)));
export const SCENES = join(HERE, 'scenes');

export const MADE_BY = 'Alex Smith, for this bestax port';
export const LICENSE = "MIT, under this template's LICENSE";

/** How every image here was made, naming the scene file that draws it. */
export function method(slug) {
  return (
    `Drawn by code: docs/scripts/template-art/scenes/${slug}.mjs places every block and shape, ` +
    'and the voxel renderer in docs/scripts/template-art writes the SVG, with every texture ' +
    'generated from a palette and a seed. No photograph, stock image or other third-party ' +
    'image was used as an input or as a tracing reference.'
  );
}

/** The slugs that have a scene module. */
export function sceneSlugs() {
  return readdirSync(SCENES)
    .filter(f => f.endsWith('.mjs'))
    .map(f => f.slice(0, -4))
    .sort();
}

/** Each image of a template: `{ path, depicts, svg }`, drawn now. */
export async function drawTemplate(slug) {
  const mod = await import(pathToFileURL(join(SCENES, `${slug}.mjs`)).href);
  return mod.default.map(image => ({
    path: image.path,
    depicts: image.depicts,
    svg: image.draw(),
  }));
}

const sha256 = text => createHash('sha256').update(text).digest('hex');

/** Write a template's images and their provenance entries. */
export async function writeTemplate(
  slug,
  today = new Date().toISOString().slice(0, 10)
) {
  const folder = join(REPO, 'templates', slug);
  const recordPath = join(folder, 'image-provenance.json');
  const record = existsSync(recordPath)
    ? JSON.parse(readFileSync(recordPath, 'utf8'))
    : { template: slug, images: [] };
  const byPath = new Map(record.images.map(e => [e.path, e]));
  const images = await drawTemplate(slug);
  const changed = [];
  for (const { path, depicts, svg } of images) {
    const file = join(folder, path);
    const old = existsSync(file) ? readFileSync(file, 'utf8') : null;
    const prev = byPath.get(path);
    const hash = sha256(svg);
    if (old !== svg) {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, svg);
      changed.push(path);
    }
    const keepDate = prev && prev.sha256 === hash && prev.origin === 'original';
    const entry = {
      path,
      sha256: hash,
      origin: 'original',
      made: keepDate ? prev.made : today,
      madeBy: MADE_BY,
      method: method(slug),
      depicts,
      license: LICENSE,
    };
    if (prev?.replaces) entry.replaces = prev.replaces;
    byPath.set(path, entry);
  }
  const drawn = new Set(images.map(i => i.path));
  record.images = [
    ...images.map(i => byPath.get(i.path)),
    ...record.images.filter(e => !drawn.has(e.path)),
  ];
  writeFileSync(recordPath, JSON.stringify(record, null, 2) + '\n');
  return changed;
}

async function main() {
  const slugs = process.argv.slice(2);
  for (const slug of slugs.length ? slugs : sceneSlugs()) {
    const changed = await writeTemplate(slug);
    console.log(
      `${slug}: ${changed.length ? changed.join(', ') : 'unchanged'}`
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
