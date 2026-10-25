/**
 * Every image a template under templates/ ships was made for the port and
 * has an entry in its image-provenance.json whose hash matches the file, and
 * no template loads an image from elsewhere (#1260).
 *
 * The checks live in lib/template-images.mjs and take a root, so most of this
 * file builds a small fixture repository, as scripts/templates.test.mjs does,
 * and breaks one thing at a time. The first test runs the checks over the
 * repo.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, it } from 'node:test';
import {
  RECORD,
  checkTemplateImages,
  decodeXml,
  externalImages,
  isImagePath,
  isImageUrl,
  isIsoDate,
  sha256,
} from './lib/template-images.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));

const HERO = '<svg xmlns="http://www.w3.org/2000/svg"/>\n';

/** An entry that passes, for `path` holding `content`. */
const original = (path, content = HERO) => ({
  path,
  sha256: sha256(Buffer.from(content)),
  origin: 'original',
  made: '2026-10-23',
  madeBy: 'Claude, for this bestax port',
  method: 'Written by hand as SVG markup.',
  depicts: 'A hill.',
  license: "MIT, under this template's LICENSE",
});

const thirdParty = path => ({
  path,
  sha256: sha256(Buffer.from(HERO)),
  origin: 'third-party',
  source: 'https://example.com/hill',
  author: 'A. Photographer',
  licenseName: 'CC0 1.0',
  licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  retrieved: '2026-10-23',
  depicts: 'A hill.',
  license: 'CC0 1.0',
});

const roots = [];
afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function write(root, path, content) {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

const git = (root, ...args) =>
  execFileSync('git', ['-c', 'init.defaultBranch=main', '-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const stage = root => git(root, 'add', '--all');

const recordOf = (images, template = 'login') =>
  JSON.stringify({ template, images }, null, 2);

/**
 * A repository holding templates/login with `files` (path to content), all
 * staged. By default a hero image and the record that passes for it.
 */
function tree(
  files = {
    'src/App.tsx': "const hero = '/media/hero.svg';\n",
    'public/media/hero.svg': HERO,
    [RECORD]: recordOf([original('public/media/hero.svg')]),
  }
) {
  const root = mkdtempSync(join(tmpdir(), 'template-images-'));
  roots.push(root);
  git(root, 'init', '--quiet');
  write(root, 'templates/CLAUDE.md', '![not a template](https://x.io/a.png)\n');
  for (const [path, content] of Object.entries(files)) {
    write(root, `templates/login/${path}`, content);
  }
  stage(root);
  return root;
}

/** The problems with a passing tree once `path` holds `content`. */
function withFile(path, content) {
  const root = tree();
  write(root, `templates/login/${path}`, content);
  stage(root);
  return checkTemplateImages(root);
}

const withRecord = (images, template) =>
  withFile(RECORD, recordOf(images, template));

/** Assert exactly one problem, matching `pattern`. */
function assertOne(problems, pattern) {
  assert.equal(problems.length, 1, problems.join('\n'));
  assert.match(problems[0], pattern);
}

describe('the repo', () => {
  it('ships only images made for its templates, each recorded', () => {
    assert.deepEqual(checkTemplateImages(REPO), []);
  });
});

describe('a template', () => {
  it('passes with every image recorded', () => {
    assert.deepEqual(checkTemplateImages(tree()), []);
  });

  it('needs no record without images', () => {
    assert.deepEqual(
      checkTemplateImages(tree({ 'src/App.tsx': 'export {};\n' })),
      []
    );
  });

  it('needs a record once it has an image, wherever it sits', () => {
    const root = tree({
      'public/favicon.ico': 'ico',
      'src/assets/Logo.PNG': 'png',
    });
    assertOne(
      checkTemplateImages(root),
      /templates\/login ships public\/favicon\.ico, src\/assets\/Logo\.PNG with no image-provenance\.json to say where/
    );
  });

  it('reads what git tracks, and nothing else', () => {
    const root = tree();
    write(root, 'templates/login/public/media/draft.png', 'png');
    write(
      root,
      'templates/login/src/Draft.tsx',
      'const a = "//i.imgur.com/a";'
    );
    assert.deepEqual(checkTemplateImages(root), []);
  });

  it('reports an image with no entry, and an entry with no image', () => {
    const root = tree();
    write(root, 'templates/login/public/media/extra.svg', HERO);
    write(
      root,
      `templates/login/${RECORD}`,
      recordOf([
        original('public/media/hero.svg'),
        original('public/media/gone.svg'),
      ])
    );
    stage(root);
    const problems = checkTemplateImages(root);
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.match(problems[0], /"public\/media\/gone\.svg" names no image git/);
    assert.match(
      problems[1],
      /templates\/login\/public\/media\/extra\.svg has no entry in .*; draw it/
    );
  });

  it('reports an image tracked as a link or gone, with no bytes to hash', () => {
    const root = tree({
      [RECORD]: recordOf([original('public/hero.svg'), original('a.svg')]),
      'a.svg': HERO,
    });
    mkdirSync(join(root, 'templates/login/public'));
    symlinkSync('/etc/hosts', join(root, 'templates/login/public/hero.svg'));
    stage(root);
    rmSync(join(root, 'templates/login/a.svg'));
    const problems = checkTemplateImages(root);
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.match(problems[0], /"public\/hero\.svg" names no image/);
    assert.match(problems[1], /"a\.svg" names no image/);
  });

  it('reads nothing from a source or a record that is gone from disk', () => {
    // The templates test reports each as tracked but missing.
    const root = tree();
    rmSync(join(root, 'templates/login/src/App.tsx'));
    assert.deepEqual(checkTemplateImages(root), []);
    rmSync(join(root, `templates/login/${RECORD}`));
    assertOne(checkTemplateImages(root), /is not valid JSON/);
  });

  it('reports an image recorded twice', () => {
    const entry = original('public/media/hero.svg');
    assertOne(withRecord([entry, entry]), /is recorded twice/);
  });

  it("reports a file whose hash isn't the recorded one, naming its hash", () => {
    const changed = '<svg xmlns="http://www.w3.org/2000/svg"><g/></svg>\n';
    const problems = withFile('public/media/hero.svg', changed);
    assertOne(problems, /changed after its record was written/);
    assert.ok(problems[0].includes(sha256(Buffer.from(changed))));
  });

  it('needs a record that parses to an object with an images array', () => {
    assertOne(
      withFile(RECORD, '{'),
      /image-provenance\.json is not valid JSON/
    );
    for (const text of ['[]', '{"template":"login"}', 'null']) {
      assertOne(withFile(RECORD, text), /must be an object with an `images`/);
    }
  });

  it('names its own folder', () => {
    assertOne(
      withRecord([original('public/media/hero.svg')], 'logn'),
      /`template` must be "login", its folder's name/
    );
  });
});

describe('an entry', () => {
  const hero = 'public/media/hero.svg';
  const problemsOf = entry => withRecord([entry]);

  it('passes as an original, with or without what it replaces', () => {
    assert.deepEqual(problemsOf({ ...original(hero), replaces: 'a.png' }), []);
  });

  it('is an SVG when it is an original, and any image when third-party', () => {
    const photo = 'public/media/photo.png';
    const withPhoto = entry =>
      checkTemplateImages(tree({ [photo]: HERO, [RECORD]: recordOf([entry]) }));
    assertOne(
      withPhoto(original(photo)),
      /"public\/media\/photo\.png": an original image is drawn as SVG, so its file must be an \.svg or \.svgz/
    );
    assert.deepEqual(withPhoto(thirdParty(photo)), []);
  });

  it('passes as third-party, with its source and license', () => {
    assert.deepEqual(problemsOf(thirdParty(hero)), []);
  });

  it('is an object', () => {
    const problems = withRecord(['public/media/hero.svg']);
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.match(problems[0], /images\[0\] must be an object/);
    assert.match(problems[1], /hero\.svg has no entry/);
  });

  it('needs a path', () => {
    const { path, ...rest } = original(hero);
    assert.equal(path, hero);
    const problems = problemsOf(rest);
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.match(problems[0], /images\[0\] needs a non-empty `path`/);
    assert.match(problems[1], /hero\.svg has no entry/);
  });

  it("needs an original's maker and method, said in words", () => {
    const problems = problemsOf({ ...original(hero), madeBy: ' ', method: '' });
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.match(problems[0], /needs a non-empty `madeBy`/);
    assert.match(problems[1], /needs a non-empty `method`/);
  });

  it('needs every common field', () => {
    const { depicts, license, sha256: hash, ...rest } = original(hero);
    assert.ok(depicts && license && hash);
    const problems = problemsOf(rest);
    assert.equal(problems.length, 3, problems.join('\n'));
    assert.match(problems[0], /needs a non-empty `sha256`/);
    assert.match(problems[1], /needs a non-empty `depicts`/);
    assert.match(problems[2], /needs a non-empty `license`/);
  });

  it('names a known origin', () => {
    assertOne(
      problemsOf({ ...original(hero), origin: 'stock' }),
      /`origin` must be "original" or "third-party"/
    );
  });

  it("takes only its origin's fields, and no unknown one", () => {
    const problems = problemsOf({
      ...original(hero),
      author: 'Someone',
      credit: 'x',
    });
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.match(problems[0], /`author` belongs to the other origin/);
    assert.match(problems[1], /unknown field `credit`; the fields are path/);
  });

  it('dates and links in the forms they are read in', () => {
    const problems = problemsOf({
      ...thirdParty(hero),
      retrieved: '2026-02-30',
      licenseUrl: 'http://example.com/license',
    });
    assert.equal(problems.length, 2, problems.join('\n'));
    assert.match(problems[0], /`licenseUrl` must be an https URL/);
    assert.match(problems[1], /`retrieved` must be a date written YYYY-MM-DD/);
  });

  it('records a hash as 64 lowercase hex digits', () => {
    const entry = original(hero);
    assertOne(
      problemsOf({ ...entry, sha256: entry.sha256.toUpperCase() }),
      /`sha256` must be 64 lowercase hex digits/
    );
  });

  it('says what it replaces in words, when it says it', () => {
    assertOne(
      problemsOf({ ...original(hero), replaces: '' }),
      /needs a non-empty `replaces`/
    );
  });
});

describe('code', () => {
  it('loads no image from elsewhere', () => {
    const problems = withFile(
      'src/index.css',
      [
        '.a { background: url(https://example.com/img/sky.JPG); }',
        ".b { background: url('//images.unsplash.com/photo-1?w=500'); }",
        '.c { background: url("data:image/svg+xml;utf8,<svg/>"); }',
      ].join('\n')
    );
    assert.equal(problems.length, 3, problems.join('\n'));
    assert.match(
      problems[0],
      /index\.css loads https:\/\/example\.com\/img\/sky\.JPG, an image/
    );
    assert.match(
      problems[1],
      /loads \/\/images\.unsplash\.com\/photo-1\?w=500/
    );
    assert.match(problems[2], /loads data:image\/svg\+xml URI/);
  });

  it('is every kind of script, stylesheet, page and data a template ships', () => {
    for (const file of [
      'index.html',
      'page.htm',
      'src/App.tsx',
      'src/util.mjs',
      'src/util.cts',
      'src/data.json',
      'src/theme.scss',
      'src/theme.sass',
      'src/theme.less',
      'public/site.webmanifest',
      'public/browserconfig.xml',
    ]) {
      assertOne(
        withFile(file, '{ "src": "https://picsum.photos/192" }'),
        /loads https:\/\/picsum\.photos\/192, an image/
      );
    }
  });

  it('names no outside URL off the allowlist, wherever it sits', () => {
    const problems = withFile(
      'src/index.css',
      [
        '/* Dawn: the sky, from https://example.com/render?id=1 */',
        ':root { --hero: url(https://example.com/render?id=2); }',
        '.a { background-image: var(--hero); }',
        '.b { background: url(//cdn.example.com/render?id=3); }',
      ].join('\n')
    );
    assert.deepEqual(
      problems.map(p => /names (\S+), outside/.exec(p)?.[1]),
      [
        'https://example.com/render?id=1',
        'https://example.com/render?id=2',
        '//cdn.example.com/render?id=3',
      ],
      problems.join('\n')
    );
    assert.match(
      problems[0],
      /on a host ALLOWED_HOSTS in scripts\/lib\/template-images\.mjs does not list\. If it loads an image, draw that for the port; if not, add its host there with the reason/
    );
    assertOne(
      withFile(
        'src/gallery.ts',
        "export const gallery = [{ url: 'https://example.com/render?id=4' }];"
      ),
      /gallery\.ts names https:\/\/example\.com\/render\?id=4, outside/
    );
  });

  it('may name an allowlisted host, for what is not an image', () => {
    assert.deepEqual(
      withFile(
        'index.html',
        [
          '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
          '<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />',
          '<iframe src="https://www.google.com/maps/embed?pb=1"></iframe>',
          '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
          '<script type="application/ld+json">{ "@context": "https://schema.org" }</script>',
          '<!-- https://vite.dev/config/ -->',
          '<a href="https://github.com/aldi">aldi</a> <a href="https://bulma.io">Bulma</a>',
          '<a href="https://www.facebook.com/your-page">Facebook</a>',
          '<script>// a comment, //not-a-url</script>',
        ].join('\n')
      ),
      []
    );
  });

  it('names no image on an allowlisted host, or a page beside its path', () => {
    const problems = withFile(
      'src/App.tsx',
      [
        "const logo = 'https://bulma.io/assets/brand/Bulma Logo';",
        "const avatar = 'https://github.com/aldi.png';",
        "const search = 'https://www.google.com/search?q=x';",
      ].join('\n')
    );
    assert.equal(problems.length, 3, problems.join('\n'));
    assert.match(
      problems[0],
      /loads https:\/\/bulma\.io\/assets\/brand\/Bulma, an image/
    );
    assert.match(
      problems[1],
      /loads https:\/\/github\.com\/aldi\.png, an image/
    );
    assert.match(
      problems[2],
      /names https:\/\/www\.google\.com\/search\?q=x, outside/
    );
  });

  it('reports each URL once', () => {
    assertOne(
      withFile(
        'src/App.tsx',
        "const a = 'https://example.com/x'; const b = 'https://example.com/x';"
      ),
      /names https:\/\/example\.com\/x, outside/
    );
  });

  it('leaves out the record, whose `replaces` may name a hot-link', () => {
    assert.deepEqual(
      withRecord([
        {
          ...original('public/media/hero.svg'),
          replaces: 'https://images.unsplash.com/photo-1',
        },
      ]),
      []
    );
  });
});

describe('prose', () => {
  it('shows no outside image, whatever its URL looks like', () => {
    const problems = withFile(
      'README.md',
      [
        '![The demo](https://example.com/render?id=1 "A title")',
        'A badge: ![build][badge], and ![coverage][].',
        '',
        '[badge]: https://img.example.com/badge/build',
        '[coverage]: https://img.example.com/badge/coverage',
        '<img src="https://example.com/render?id=2" alt="" />',
        '<picture><source srcset="//cdn.example.com/p" /></picture>',
        '![Inline](data:image/png;base64,iVBORw0=)',
      ].join('\n')
    );
    assert.deepEqual(
      problems.map(p => /loads (.*), an image/.exec(p)?.[1]),
      [
        'https://example.com/render?id=1',
        'https://img.example.com/badge/build',
        'https://img.example.com/badge/coverage',
        'https://example.com/render?id=2',
        '//cdn.example.com/p',
        'data:image/png URI',
      ],
      problems.join('\n')
    );
  });

  it('links freely, to a page or an image file alike', () => {
    assert.deepEqual(
      withFile(
        'README.md',
        [
          'Made by [aldi](https://github.com/aldi), from https://example.com/x.',
          'The [logo](https://example.com/logo.png) is theirs.',
          'An image with no definition: ![missing][nowhere].',
          '',
          '[upstream]: https://example.com/render?id=1',
        ].join('\n')
      ),
      []
    );
  });

  it('is every kind of prose a template ships', () => {
    for (const file of ['LICENSE', 'NOTES.txt', 'docs/guide.markdown']) {
      assertOne(
        withFile(file, '![A photo](https://example.com/photo)'),
        /loads https:\/\/example\.com\/photo, an image/
      );
    }
  });
});

describe('an SVG', () => {
  const svg = body =>
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 10 10">` +
    `${body}</svg>\n`;

  /** The problems with a tree whose recorded image `path` holds `content`. */
  function withImage(content, path = 'public/media/hero.svg') {
    return checkTemplateImages(
      tree({
        [path]: content,
        [RECORD]: recordOf([original(path, content)]),
      })
    );
  }

  it('may point at its own fragments, and declare its namespaces', () => {
    assert.deepEqual(
      withImage(
        svg(
          '<defs><linearGradient id="g"/><path id="p" d="M0 0H1"/></defs>' +
            '<style>.a { fill: url( "#g" ); }</style>' +
            '<use href="#p"/><use xlink:href=\'#p\'/><rect fill="url(#g)"/>' +
            '<a href="">nothing</a>'
        )
      ),
      []
    );
  });

  it('embeds no image as a data: URI, reported once', () => {
    assertOne(
      withImage(svg('<image href="data:image/png;base64,iVBORw0KGgo="/>')),
      /hero\.svg draws a data:image\/png URI from outside the file; an SVG/
    );
  });

  it('draws no image, stylesheet or file from elsewhere', () => {
    const problems = withImage(
      svg(
        '<image xlink:href="https://images.unsplash.com/photo-1?w=500"/>' +
          '<image href="https://example.com/photo?id=3"/>' +
          "<style>@import 'https://fonts.example/a.css';" +
          '.b { background: url(https://example.com/bg) }</style>' +
          '<use href="icons.svg#star"/>' +
          '<foreignObject><img src="portrait.jpg"/></foreignObject>'
      )
    );
    assert.deepEqual(
      problems.map(p => /draws (.*) from outside/.exec(p)?.[1]),
      [
        'https://images.unsplash.com/photo-1?w=500',
        'https://example.com/photo?id=3',
        'icons.svg#star',
        'portrait.jpg',
        'https://example.com/bg',
        'https://fonts.example/a.css',
      ],
      problems.join('\n')
    );
  });

  it('is read for a hot-link or data: URI outside any reference too', () => {
    assertOne(
      withImage(svg('<desc>data:image/gif;base64,R0lGOD</desc>')),
      /hero\.svg loads data:image\/gif URI, an image the template/
    );
  });

  it('names a long target by its start', () => {
    const long = `https://example.com/${'a'.repeat(200)}`;
    const [problem] = withImage(svg(`<image href="${long}"/>`));
    assert.ok(problem.includes(`draws ${long.slice(0, 117)}... from`), problem);
  });

  it('is read under any prefix the XLink namespace is bound to', () => {
    const bound = body =>
      `<svg xmlns="http://www.w3.org/2000/svg" ` +
      `xmlns:x="http://www.w3.org/1999/xlink">${body}</svg>\n`;
    assertOne(
      withImage(bound('<image x:href="https://example.com/photo?id=3"/>')),
      /draws https:\/\/example\.com\/photo\?id=3 from outside the file/
    );
    assertOne(
      withImage(bound('<image x:href="data:image/png;base64,iVBORw0="/>')),
      /draws a data:image\/png URI from outside the file/
    );
    assert.deepEqual(withImage(bound('<use x:href="#a"/>')), []);
  });

  it('is read as its parser reads it, with references decoded', () => {
    // `&#100;ata:` is `data:`, and the hot-link is reported once, decoded.
    const problems = withImage(
      svg(
        '<image href="&#100;ata:image/jpeg;base64,/9j/4AAQ"/>' +
          '<image href="https://x.io/a.png?w=1&amp;h=2"/>' +
          '<use href="&#x23;a"/><use href="#b&nbsp;"/><use href="&#1114112;"/>'
      )
    );
    assert.deepEqual(
      problems.map(p => /draws (.*) from outside/.exec(p)?.[1]),
      ['a data:image/jpeg URI', 'https://x.io/a.png?w=1&h=2', '&#1114112;'],
      problems.join('\n')
    );
    assert.equal(decodeXml('&lt;&gt;&quot;&apos;&#65;&#x42;'), '<>"\'AB');
  });

  it('is read gzipped, as an .svgz', () => {
    const path = 'public/media/hero.svgz';
    assert.deepEqual(withImage(gzipSync(svg('<use href="#a"/>')), path), []);
    assertOne(
      withImage(gzipSync(svg('<image href="https://x.io/a.png"/>')), path),
      /hero\.svgz draws https:\/\/x\.io\/a\.png from outside the file/
    );
    assertOne(
      withImage(svg(''), path),
      /hero\.svgz is not gzip-compressed, as an \.svgz must be/
    );
  });
});

describe('what counts as an image', () => {
  it('is a file with an image extension, in any case', () => {
    for (const path of [
      'a.svg',
      'b/c.PNG',
      'd.jpeg',
      'e.ico',
      'f.avif',
      'g.heic',
      'h.TIFF',
      'i.jxl',
      'j.jfif',
      'k.apng',
      'l.svgz',
      'm.cur',
    ]) {
      assert.ok(isImagePath(path), path);
    }
    for (const path of [
      'a.svg.txt',
      'README.md',
      'png',
      'font.woff2',
      'clip.mp4',
    ]) {
      assert.ok(!isImagePath(path), path);
    }
  });

  it('needs a record in any of those formats, and is hot-linked in them', () => {
    const root = tree({ 'public/media/photo.jfif': 'jfif' });
    assertOne(
      checkTemplateImages(root),
      /ships public\/media\/photo\.jfif with no image-provenance\.json/
    );
    assert.ok(isImageUrl('https://example.com/photos/a.heic'));
  });

  it('is a URL to an image file, or to an image host', () => {
    for (const url of [
      'https://example.com/a/b.webp',
      'https://via.placeholder.com/640x360',
      'https://bulma.io/assets/brand/Bulma%20Logo.svg',
      'https://bulma.io/images/placeholders/128x128',
      'https://bulma.io/assets',
    ]) {
      assert.ok(isImageUrl(url), url);
    }
    for (const url of [
      'https://bulma.io/',
      'https://bulma.io/assetsmore/x',
      'https://notplaceholder.com/x',
      'https://unsplash.com/photos/abc',
      'not a url',
    ]) {
      assert.ok(!isImageUrl(url), url);
    }
  });

  it('is found in text with its sentence left off', () => {
    assert.deepEqual(
      externalImages('Logo: https://picsum.photos/200. Then (//x.io/a.gif)'),
      ['https://picsum.photos/200', '//x.io/a.gif']
    );
  });
});

describe('isIsoDate', () => {
  it('takes a real date written YYYY-MM-DD', () => {
    assert.ok(isIsoDate('2026-10-23'));
    assert.ok(isIsoDate('2028-02-29'));
    for (const value of ['2026-02-30', '2026-13-01', '23/10/2026', '', 7]) {
      assert.ok(!isIsoDate(value), String(value));
    }
  });
});
