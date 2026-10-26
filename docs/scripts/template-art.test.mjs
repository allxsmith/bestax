/**
 * Every image a ported template ships is drawn by code, in
 * `template-art/scenes/<slug>.mjs`, and this holds each file to it: every
 * image git tracks in a template is one its scene draws, byte for byte, and
 * its provenance entry names that scene. So an image can only change when
 * the code that draws it does, and `draw.mjs` is how it changes.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { isImagePath, RECORD } from '../../scripts/lib/template-images.mjs';
import {
  templatePaths,
  trackedTemplates,
} from '../../scripts/lib/templates.mjs';
import {
  REPO,
  drawTemplate,
  method,
  sceneSlugs,
} from './template-art/draw.mjs';
import {
  Scene,
  cos,
  material,
  renderScene,
  sin,
} from './template-art/voxel.mjs';

const { slugs, files } = templatePaths(trackedTemplates(REPO));

describe('template images', () => {
  it('has a scene for every template, and none for a template that is gone', () => {
    assert.deepEqual(sceneSlugs(), slugs);
  });

  for (const slug of slugs) {
    describe(slug, async () => {
      const images = await drawTemplate(slug);
      const record = JSON.parse(
        readFileSync(join(REPO, 'templates', slug, RECORD), 'utf8')
      );
      // An image the maintainer keeps as someone else's is recorded as such,
      // and is the one kind no scene draws.
      const thirdParty = new Set(
        record.images.filter(e => e.origin === 'third-party').map(e => e.path)
      );
      const tracked = files
        .filter(f => f.path.startsWith(`${slug}/`) && isImagePath(f.path))
        .map(f => f.path.slice(slug.length + 1))
        .filter(path => !thirdParty.has(path))
        .sort();

      it('draws exactly the images the template ships', () => {
        assert.deepEqual(images.map(i => i.path).sort(), tracked);
      });

      it('ships each image as its scene draws it', () => {
        for (const { path, svg } of images) {
          const file = readFileSync(
            join(REPO, 'templates', slug, path),
            'utf8'
          );
          assert.ok(
            file === svg,
            `templates/${slug}/${path} differs from what scenes/${slug}.mjs draws; ` +
              `run node docs/scripts/template-art/draw.mjs ${slug}`
          );
        }
      });

      it('records each image as drawn by its scene', () => {
        for (const { path, depicts } of images) {
          const entry = record.images.find(e => e.path === path);
          assert.ok(entry, `${RECORD} has no entry for ${path}`);
          assert.equal(entry.method, method(slug));
          assert.equal(entry.depicts, depicts);
        }
      });
    });
  }
});

describe('the renderer', () => {
  it('draws the same bytes twice', async () => {
    const [first] = await drawTemplate('login');
    const [again] = await drawTemplate('login');
    assert.equal(first.svg, again.svg);
  });

  it('keeps sin and cos within a hair of the engine', () => {
    for (let x = -20; x <= 20; x += 0.37) {
      assert.ok(Math.abs(sin(x) - Math.sin(x)) < 1e-8, `sin(${x})`);
      assert.ok(Math.abs(cos(x) - Math.cos(x)) < 1e-8, `cos(${x})`);
    }
  });

  it('draws only the faces the viewer can see', () => {
    const red = material({ color: '#ff0000' });
    const one = new Scene().set(0, 0, 0, red);
    const two = new Scene().set(0, 0, 0, red).set(1, 0, 0, red);
    const count = s =>
      (renderScene(s, { light: false }).body.match(/M/g) ?? []).length;
    // A lone block shows three faces, merged into one path of three parallelograms.
    assert.equal(count(one), 3);
    // Two side by side merge their tops and their left faces, and the right
    // face of the first is hidden by the second.
    assert.equal(count(two), 3);
  });

  it('leaves a buried block out of the drawing', () => {
    const grey = material({ color: '#808080' });
    const solid = new Scene().box(0, 0, 0, 3, 3, 3, grey);
    const hollow = new Scene().box(0, 0, 0, 3, 3, 3, grey).set(1, 1, 1, null);
    assert.equal(renderScene(solid).body, renderScene(hollow).body);
  });
});
