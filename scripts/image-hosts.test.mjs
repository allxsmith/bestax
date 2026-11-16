/**
 * Holds the `image-hosts` conformance rule (#1700) to what it promises: a
 * story, a docs page or a skill with a URL on a placeholder or stock-photo
 * host fails, naming the file, the line and the fix for its area,
 * while a link that credits a photo's page, a picture on another host, a
 * bare host name in prose, and files outside those areas pass. The walker is
 * tested on a temporary tree as well as the matcher, so it cannot shrink to
 * reading nothing with every test green.
 */
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'vitest';
import assert from 'node:assert/strict';

import { imageHostUrls, isImageHostUrl } from './lib/template-images.mjs';
import { checkImageHosts } from './check-conformance.mjs';

test('a URL on an image host is caught whatever its path ends in', () => {
  assert.deepEqual(
    imageHostUrls(
      [
        "image: 'https://picsum.photos/seed/1/600/400',",
        'src="https://images.unsplash.com/photo-1?auto=format&w=600"',
        "url('https://bulma.io/assets/images/placeholders/128x128.png')",
        'src="https://via.placeholder.com/300"',
        'src="//placehold.co/600x400"',
      ].join('\n')
    ),
    [
      'https://picsum.photos/seed/1/600/400',
      'https://images.unsplash.com/photo-1?auto=format&w=600',
      'https://bulma.io/assets/images/placeholders/128x128.png',
      'https://via.placeholder.com/300',
      '//placehold.co/600x400',
    ]
  );
});

test('a credit link, another host and a bare host name pass', () => {
  assert.deepEqual(
    imageHostUrls(
      [
        'by [Andrew Ridley](https://unsplash.com/photos/Kt5hRENuotI)',
        'src="https://github.com/allxsmith.png"',
        'see https://bulma.io/documentation/elements/image/',
        "Don't point it at a service such as picsum.photos.",
        "src: '/img/carousel/carousel-banner-1.jpg'",
      ].join('\n')
    ),
    []
  );
  assert.equal(isImageHostUrl('not a url'), false);
});

async function tree(files) {
  const root = await mkdtemp(join(tmpdir(), 'image-hosts-'));
  for (const [path, text] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), text);
  }
  return root;
}

const HOTLINK = "const src = 'https://picsum.photos/id/1015/800/400';\n";
const FENCE = '```';

test('the rule reads stories, docs pages and skills, each with its fix', async () => {
  const root = await tree({
    'bulma-ui/src/components/Card.stories.tsx': `// story\n${HOTLINK}`,
    'bulma-ui/src/components/Avatar.stories.ts': HOTLINK,
    'bulma-ui/src/components/Box.stories.js': HOTLINK,
    'bulma-ui/src/components/Tag.stories.jsx': HOTLINK,
    'bulma-ui/src/components/Title.stories.mjs': HOTLINK,
    'bulma-ui/src/Introduction.mdx': HOTLINK,
    'docs/docs/api/components/card.md': `# Card\n\n${FENCE}tsx live\n${HOTLINK}${FENCE}\n`,
    'docs/docs/skills/layout-scaffold.mdx': HOTLINK,
    'docs/src/pages/index.js': HOTLINK,
    'skills/bestax-layout-scaffold/examples/card-grid.tsx': HOTLINK,
    'skills/bestax-layout-scaffold/references/archetypes.md': HOTLINK,
    'skills/bestax-layout-scaffold/assets/hero.svg':
      '<image href="https://images.unsplash.com/photo-1" />\n',
  });
  const violations = await checkImageHosts(root);
  assert.equal(violations.length, 12);
  const byFile = Object.fromEntries(
    violations.map(v => [v.slice(0, v.indexOf(' ')), v])
  );
  assert.match(
    byFile['bulma-ui/src/components/Card.stories.tsx:2'],
    /has https:\/\/picsum\.photos\/id\/1015\/800\/400, .*import a picture from bulma-ui\/images/
  );
  for (const story of [
    'components/Avatar.stories.ts',
    'components/Box.stories.js',
    'components/Tag.stories.jsx',
    'components/Title.stories.mjs',
  ]) {
    assert.ok(byFile[`bulma-ui/src/${story}:1`], story);
  }
  assert.ok(byFile['bulma-ui/src/Introduction.mdx:1']);
  assert.match(
    byFile['docs/docs/api/components/card.md:4'],
    /docs\/static\/img/
  );
  assert.ok(byFile['docs/docs/skills/layout-scaffold.mdx:1']);
  assert.match(byFile['docs/src/pages/index.js:1'], /docs\/static\/img/);
  assert.match(
    byFile['skills/bestax-layout-scaffold/examples/card-grid.tsx:1'],
    /a file the reader's app serves itself/
  );
  assert.ok(byFile['skills/bestax-layout-scaffold/references/archetypes.md:1']);
  assert.match(
    byFile['skills/bestax-layout-scaffold/assets/hero.svg:1'],
    /images\.unsplash\.com/
  );
});

test('files outside the areas are not read', async () => {
  const root = await tree({
    'bulma-ui/src/components/Card.tsx': HOTLINK,
    'bulma-ui/src/components/__tests__/Card.test.tsx': HOTLINK,
    'docs/blog/2026-11-01-post.md': HOTLINK,
    'docs/static/img/carousel/LICENSE.md': HOTLINK,
    'templates/hotel/src/App.tsx': HOTLINK,
  });
  assert.deepEqual(await checkImageHosts(root), []);
});

test('a tree with none of the areas has nothing to report', async () => {
  assert.deepEqual(await checkImageHosts(await tree({})), []);
});
