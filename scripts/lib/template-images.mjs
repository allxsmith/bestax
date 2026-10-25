/**
 * Every image a ported template ships was made for the port, and the
 * template's `image-provenance.json` records how: an entry per image file,
 * favicons included, with that file's SHA-256. templates/CLAUDE.md ("Every
 * image is made for the port") gives the record's format and why it exists,
 * and the field lists below are the ones it names.
 *
 * The hash ties an entry to the file it describes, so an image swapped after
 * its record was written fails until someone writes the record anew. The
 * sources are read for the images a file cannot show: a hot-link (an http(s)
 * URL to an image file or to an image host) and an image embedded as a
 * `data:` URI. The record is left out of that read, since its `replaces` may
 * name the hot-link an image replaced. An SVG's own markup is read too, for
 * anything it draws from outside the file (svgReferences), since a drawing
 * that wraps a photo would otherwise pass on its hash alone.
 *
 * A template is what git tracks under its folder, as scripts/lib/templates.mjs
 * defines it, so `root` must be a git checkout.
 */
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { extname, join } from 'node:path';
import { templatePaths, trackedTemplates } from './templates.mjs';

/** The record's name, at the top of a template's folder. */
export const RECORD = 'image-provenance.json';

/**
 * What a file is an image by: the formats a browser draws, with the other
 * names a JPEG goes by, the formats a phone or an editor saves a photo in
 * (HEIC, TIFF, JPEG XL), and a CSS cursor. Fonts and video are not images
 * here.
 */
export const IMAGE_EXTENSIONS = [
  'apng',
  'avif',
  'bmp',
  'cur',
  'gif',
  'heic',
  'heif',
  'ico',
  'jfif',
  'jp2',
  'jpe',
  'jpeg',
  'jpg',
  'jxl',
  'pjp',
  'pjpeg',
  'png',
  'svg',
  'svgz',
  'tif',
  'tiff',
  'webp',
];

/**
 * The images whose own markup is read, for what svgReferences says an SVG
 * must not draw from; an `.svgz` is that markup gzipped.
 */
export const SVG_EXTENSIONS = ['svg', 'svgz'];

/** The files read for hot-linked and embedded images. */
export const SOURCE_EXTENSIONS = [
  'cjs',
  'css',
  'cts',
  'htm',
  'html',
  'js',
  'json',
  'jsx',
  'less',
  'md',
  'mjs',
  'mts',
  'sass',
  'scss',
  'ts',
  'tsx',
  'webmanifest',
  'xml',
];

/**
 * Hosts that serve images whatever the URL's path ends in. An entry with a
 * path holds only that path and what is under it. A host matches its
 * subdomains too.
 */
export const IMAGE_HOSTS = [
  'bulma.io/assets',
  'bulma.io/images',
  'cdn.pixabay.com',
  'dummyimage.com',
  'i.imgur.com',
  'images.pexels.com',
  'images.unsplash.com',
  'img.icons8.com',
  'loremflickr.com',
  'picsum.photos',
  'placehold.co',
  'placehold.it',
  'placeholder.com',
  'plus.unsplash.com',
  'source.unsplash.com',
];

/** Every entry's fields. */
const COMMON_FIELDS = ['path', 'sha256', 'origin', 'depicts', 'license'];

/** The fields each origin adds, all of them required. */
export const ORIGIN_FIELDS = {
  original: ['made', 'madeBy', 'method'],
  'third-party': ['source', 'author', 'licenseName', 'licenseUrl', 'retrieved'],
};

/** Fields an entry may leave out. */
const OPTIONAL_FIELDS = ['replaces'];

const DATE_FIELDS = ['made', 'retrieved'];
const URL_FIELDS = ['source', 'licenseUrl'];
const HEX = /^[0-9a-f]{64}$/;

const GUIDE = 'templates/CLAUDE.md, "Every image is made for the port"';

const nonEmpty = value => typeof value === 'string' && value.trim() !== '';
const isObject = value =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const extensionOf = path => extname(path).slice(1).toLowerCase();

/** Whether `path` names an image file. */
export const isImagePath = path => IMAGE_EXTENSIONS.includes(extensionOf(path));

/** A real calendar date written YYYY-MM-DD. */
export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** The lowercase hex SHA-256 of `bytes`. */
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

/** Whether `url`, absolute, loads an image: by its path or by its host. */
export function isImageUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (isImagePath(parsed.pathname)) return true;
  const host = parsed.hostname.toLowerCase();
  return IMAGE_HOSTS.some(entry => {
    const [name, ...rest] = entry.split('/');
    if (host !== name && !host.endsWith(`.${name}`)) return false;
    const prefix = rest.length ? `/${rest.join('/')}` : '';
    return (
      !prefix ||
      parsed.pathname === prefix ||
      parsed.pathname.startsWith(`${prefix}/`)
    );
  });
}

/**
 * The images `text` loads from elsewhere or embeds: each http(s) URL that
 * isImageUrl takes, each protocol-relative one (`//host/...`) after a quote,
 * a `(` or an `=`, and each `data:image/` URI, shortened to its type.
 */
export function externalImages(text) {
  const found = [];
  const url = /(https?:)?\/\/[^\s"'`()<>\\]+/gi;
  for (const match of text.matchAll(url)) {
    if (!match[1] && !['"', "'", '(', '='].includes(text[match.index - 1])) {
      continue;
    }
    // Prose ends a sentence after a URL, and the stop is not the URL's.
    const link = match[0].replace(/[.,;:!?]+$/, '');
    if (isImageUrl(match[1] ? link : `https:${link}`)) found.push(link);
  }
  for (const match of text.matchAll(/data:image\/[\w.+-]+/gi)) {
    found.push(`${match[0]} URI`);
  }
  return found;
}

/**
 * The attributes a tag loads an image from, by its name in lowercase. `image`
 * is SVG's element in JSX and bestax's `Image`, `avatar` and `card` are
 * bestax's components that take one. `<link>` and `<meta>` load one only
 * for some `rel`s and `property`s (imageAttributes), and other tags
 * (`<iframe>`, `<script>`, `<a>`) load none.
 */
const IMAGE_ATTRIBUTES = {
  avatar: ['src'],
  card: ['image'],
  feimage: ['href', 'xlink:href', 'xlinkhref'],
  image: ['href', 'src', 'xlink:href', 'xlinkhref'],
  img: ['src', 'srcset'],
  input: ['src'],
  source: ['src', 'srcset'],
  video: ['poster'],
};

/**
 * The CSS properties that draw an image from a `url()` or an `image-set()`.
 * `src`, in `@font-face`, loads a font, and `@import` a stylesheet.
 */
const CSS_IMAGE_PROPERTIES = [
  '-webkit-mask',
  '-webkit-mask-image',
  'background',
  'background-image',
  'border-image',
  'border-image-source',
  'content',
  'cursor',
  'list-style',
  'list-style-image',
  'mask',
  'mask-image',
];

/** How far a tag's attributes are read before it is taken to have ended. */
const TAG_LIMIT = 4000;

/** Each absolute URL in `value`: http(s), or protocol-relative (`//host`). */
function absoluteUrls(value) {
  const found = [];
  for (const match of value.matchAll(/(https?:)?\/\/[^\s"'`()<>\\,{}]+/gi)) {
    const before = value[match.index - 1];
    if (!match[1] && before !== undefined && !/["'`(\s,=]/.test(before)) {
      continue;
    }
    found.push(match[0].replace(/[.,;:!?]+$/, ''));
  }
  return found;
}

/** The index past the `}` that closes the `{` at `start`, or the end. */
function pastBraces(text, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < text.length; i += 1) {
    const c = text[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '{') depth += 1;
    else if (c === '}' && (depth -= 1) === 0) return i + 1;
  }
  return text.length;
}

/**
 * The attributes of the tag whose name ends at `from`, by lowercase name:
 * HTML's quoted and bare values and JSX's `{...}` expressions, whose text is
 * kept as written. A `>` inside quotes or braces does not end the tag.
 */
function readTag(text, from) {
  const attributes = new Map();
  const name = /[^\s=/>"'`{}]+/y;
  const equals = /\s*=\s*/y;
  const limit = Math.min(text.length, from + TAG_LIMIT);
  let i = from;
  while (i < limit && text[i] !== '>') {
    if (text[i] === '{') {
      i = pastBraces(text, i); // a spread, `{...props}`
      continue;
    }
    name.lastIndex = i;
    const match = name.exec(text);
    if (!match) {
      i += 1; // whitespace, the `/` of `/>`, a stray quote
      continue;
    }
    i = name.lastIndex;
    equals.lastIndex = i;
    if (!equals.exec(text)) {
      attributes.set(match[0].toLowerCase(), '');
      continue;
    }
    i = equals.lastIndex;
    let value;
    if (text[i] === '"' || text[i] === "'") {
      const end = text.indexOf(text[i], i + 1);
      const stop = end === -1 ? text.length : end;
      value = text.slice(i + 1, stop);
      i = stop + 1;
    } else if (text[i] === '{') {
      const end = pastBraces(text, i);
      value = text.slice(i + 1, end - 1);
      i = end;
    } else {
      const bare = /[^\s>]*/y;
      bare.lastIndex = i;
      value = bare.exec(text)[0];
      i = bare.lastIndex;
    }
    attributes.set(match[0].toLowerCase(), value);
  }
  return attributes;
}

/** An attribute's value with JSX's quotes taken off, in lowercase. */
const plain = value => (value ?? '').replace(/["'`]/g, '').toLowerCase();

/** The attributes of a `tag` with `attributes` that load an image. */
function imageAttributes(tag, attributes) {
  if (tag === 'link') {
    const rel = plain(attributes.get('rel')).split(/\s+/);
    const preload = rel.includes('preload') || rel.includes('prefetch');
    const image =
      rel.some(token => token.includes('icon')) ||
      (preload && plain(attributes.get('as')) === 'image');
    return image ? ['href', 'imagesrcset'] : ['imagesrcset'];
  }
  if (tag === 'meta') {
    const kind = ['property', 'name', 'itemprop']
      .map(key => plain(attributes.get(key)))
      .join(' ');
    return /image|logo/.test(kind) ? ['content'] : [];
  }
  return IMAGE_ATTRIBUTES[tag];
}

/** The `url()` targets in a CSS value, and the strings of its `image-set()`. */
function cssTargets(value) {
  const targets = [...value.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)].map(
    match => match[2]
  );
  const set = value.search(/image-set\(/i);
  if (set !== -1) {
    for (const match of value.slice(set).matchAll(/(["'])(.*?)\1/g)) {
      targets.push(match[2]);
    }
  }
  return targets;
}

/**
 * The words that name an image, as the last word of a property or a
 * variable (`src`, `heroImage`, `PLACEHOLDER`, `photos`), or the word before
 * a closing `url` (`avatarUrl`).
 */
const IMAGE_WORDS = [
  'art',
  'artwork',
  'avatar',
  'background',
  'banner',
  'cover',
  'icon',
  'illustration',
  'image',
  'img',
  'logo',
  'photo',
  'picture',
  'placeholder',
  'poster',
  'src',
  'srcset',
  'thumb',
  'thumbnail',
];

/** Whether an identifier names an image, by its words (IMAGE_WORDS). */
function namesImage(identifier) {
  const words = identifier
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[\s_$-]+/)
    .map(word => word.replace(/([^s])s$/, '$1'));
  const last = words.at(-1) === 'url' ? words.at(-2) : words.at(-1);
  return IMAGE_WORDS.includes(last);
}

/**
 * The absolute URLs that script and data name as images: a string, or an
 * array of them, given to a property or a variable named for one
 * (namesImage), such as `src: '...'`, `"image": "..."` in JSON, or
 * `const photos = ['...']`. That is where a port keeps the images it
 * renders with `src={photo}`. An HTML or JSX attribute (`src="..."` on an
 * `<iframe>`) is not one: its images are imageLoads' tags.
 */
function namedImages(text) {
  const found = [];
  const binding =
    /(?:\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=;]+)?=|(["']?)([A-Za-z_$][\w$-]*)\2\s*:)(?=\s*(\[[^\]]*\]|"[^"]*"|'[^']*'|`[^`]*`))/g;
  for (const match of text.matchAll(binding)) {
    if (namesImage(match[1] ?? match[3])) found.push(...absoluteUrls(match[4]));
  }
  return found;
}

/**
 * Every absolute URL `text` loads as an image, whatever its path ends in: in
 * an image attribute of a tag (IMAGE_ATTRIBUTES, and imageAttributes for
 * `<link>` and `<meta>`), in a `url()` or `image-set()` of an image property
 * (CSS_IMAGE_PROPERTIES), written in CSS, in a `style` attribute or in a JSX
 * style object (`backgroundImage`), and in a property or variable named for
 * an image (namedImages). It reads the places an image loads from, where
 * externalImages reads what a URL looks like, so it finds an image a URL with
 * no extension serves, and leaves fonts, stylesheets, embedded maps and
 * links alone.
 */
export function imageLoads(text) {
  const found = [];
  for (const match of text.matchAll(/<([A-Za-z][\w.:-]*)/g)) {
    const tag = match[1].toLowerCase();
    const known = Object.hasOwn(IMAGE_ATTRIBUTES, tag);
    if (!known && tag !== 'link' && tag !== 'meta') continue;
    const attributes = readTag(text, match.index + match[0].length);
    for (const name of imageAttributes(tag, attributes)) {
      found.push(...absoluteUrls(attributes.get(name) ?? ''));
    }
  }
  const declaration = /([A-Za-z-]+)\s*:\s*(?:(["'`])([\s\S]*?)\2|([^;{}]*))/g;
  for (const match of text.matchAll(declaration)) {
    const property = match[1].replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
    if (!CSS_IMAGE_PROPERTIES.includes(property)) continue;
    for (const target of cssTargets(match[3] ?? match[4])) {
      found.push(...absoluteUrls(target));
    }
  }
  found.push(...namedImages(text));
  // One place can be read twice, as a tag's style and as a named value.
  return [...new Set(found)];
}

/** A reference as a message names it: a `data:` URI by its type alone. */
const describeTarget = target => {
  const data = /^data:([^;,]*)/i.exec(target);
  if (data) return `a data:${data[1]} URI`;
  return target.length > 120 ? `${target.slice(0, 117)}...` : target;
};

/** The entities XML predefines, by name. */
const XML_ENTITIES = { amp: '&', apos: "'", gt: '>', lt: '<', quot: '"' };

/**
 * `text` with its XML character and entity references decoded, as the
 * parser reads it: `&#100;ata:` is `data:`, and `&#x23;id` is `#id`. A
 * reference XML does not define is left as written.
 */
export function decodeXml(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (reference, name) => {
    if (!name.startsWith('#')) return XML_ENTITIES[name] ?? reference;
    const code = /^#x/i.test(name)
      ? parseInt(name.slice(2), 16)
      : Number(name.slice(1));
    return code <= 0x10ffff ? String.fromCodePoint(code) : reference;
  });
}

/**
 * What an SVG draws from outside itself: the target of each `href` or `src`
 * attribute, under any namespace prefix (XLink's is `xlink:` by custom, but
 * a file may bind it to any other), each `url(...)` and each `@import` that
 * is not a fragment of the same file (`#id`), read after decodeXml as the
 * parser reads it. An SVG drawn for the port holds every shape it shows, so
 * any other target is an image, a font or a stylesheet from elsewhere, or a
 * file embedded as a `data:` URI, and the record can vouch for none of them.
 * Namespace declarations (`xmlns`, `xmlns:xlink`) are attributes of another
 * name, and an empty target loads nothing.
 */
export function svgReferences(text) {
  const found = [];
  for (const re of [
    /\s(?:[\w.-]+:)?(?:href|src)\s*=\s*(["'])(.*?)\1/gis,
    /url\(\s*(["']?)(.*?)\1\s*\)/gis,
    /@import\s+(["'])(.*?)\1/gi,
  ]) {
    for (const match of text.matchAll(re)) {
      const target = decodeXml(match[2]).trim();
      if (target !== '' && !target.startsWith('#')) {
        found.push(describeTarget(target));
      }
    }
  }
  return found;
}

/**
 * Problems with one record entry's own fields: the shape every entry needs,
 * before its path and hash are held to the folder.
 */
export function entryFieldProblems(at, entry) {
  const problems = [];
  const origin = ORIGIN_FIELDS[entry.origin] ? entry.origin : null;
  if (!origin) {
    problems.push(
      `${at}: \`origin\` must be "original" or "third-party" (${GUIDE})`
    );
  }
  const required = [...COMMON_FIELDS, ...(origin ? ORIGIN_FIELDS[origin] : [])];
  const known = [
    ...COMMON_FIELDS,
    ...Object.values(ORIGIN_FIELDS).flat(),
    ...OPTIONAL_FIELDS,
  ];
  for (const key of Object.keys(entry)) {
    if (!known.includes(key)) {
      problems.push(
        `${at} has an unknown field \`${key}\`; the fields are ` +
          known.join(', ')
      );
    } else if (
      origin &&
      !required.includes(key) &&
      !OPTIONAL_FIELDS.includes(key)
    ) {
      problems.push(
        `${at}: \`${key}\` belongs to the other origin; an image is ` +
          `"${origin}" with ${ORIGIN_FIELDS[origin].join(', ')}`
      );
    }
  }
  for (const key of [...required, ...OPTIONAL_FIELDS]) {
    if (key === 'origin') continue;
    const optional = OPTIONAL_FIELDS.includes(key);
    if (optional && entry[key] === undefined) continue;
    if (!nonEmpty(entry[key])) {
      problems.push(`${at} needs a non-empty \`${key}\` (${GUIDE})`);
    } else if (DATE_FIELDS.includes(key) && !isIsoDate(entry[key])) {
      problems.push(`${at}: \`${key}\` must be a date written YYYY-MM-DD`);
    } else if (
      URL_FIELDS.includes(key) &&
      !/^https:\/\/\S+$/.test(entry[key])
    ) {
      problems.push(`${at}: \`${key}\` must be an https URL`);
    }
  }
  if (nonEmpty(entry.sha256) && !HEX.test(entry.sha256)) {
    problems.push(`${at}: \`sha256\` must be 64 lowercase hex digits`);
  }
  // A drawing made for the port is SVG, its own source; a raster image is a
  // photo or a render of something, so only a third-party entry may name one.
  if (
    origin === 'original' &&
    nonEmpty(entry.path) &&
    !SVG_EXTENSIONS.includes(extensionOf(entry.path))
  ) {
    problems.push(
      `${at}: an original image is drawn as SVG, so its file must be an ` +
        `.svg or .svgz; draw it as one (${GUIDE})`
    );
  }
  return problems;
}

/**
 * Problems with a template's record, read against `images`, a map from each
 * image file's path in the folder to its SHA-256. `record` is the parsed
 * JSON, or undefined for a folder without one.
 */
export function recordProblems(slug, record, images) {
  const at = `templates/${slug}/${RECORD}`;
  if (record === undefined) {
    if (images.size === 0) return [];
    return [
      `templates/${slug} ships ${[...images.keys()].join(', ')} with no ` +
        `${RECORD} to say where they came from; write one, an entry per ` +
        `image (${GUIDE})`,
    ];
  }
  if (!isObject(record) || !Array.isArray(record.images)) {
    return [`${at} must be an object with an \`images\` array (${GUIDE})`];
  }
  const problems = [];
  if (record.template !== slug) {
    problems.push(`${at}: \`template\` must be "${slug}", its folder's name`);
  }
  const recorded = new Set();
  record.images.forEach((entry, index) => {
    if (!isObject(entry)) {
      problems.push(`${at}: images[${index}] must be an object`);
      return;
    }
    const path = entry.path;
    const where = nonEmpty(path)
      ? `${at}, "${path}"`
      : `${at}, images[${index}]`;
    problems.push(...entryFieldProblems(where, entry));
    if (!nonEmpty(path)) return;
    if (recorded.has(path)) {
      problems.push(`${where} is recorded twice; keep one entry per image`);
      return;
    }
    recorded.add(path);
    if (!images.has(path)) {
      problems.push(
        `${where} names no image git tracks in templates/${slug}; give the ` +
          'path from the folder, as `public/...`, or drop an entry whose ' +
          'image is gone'
      );
      return;
    }
    if (HEX.test(entry.sha256 ?? '') && entry.sha256 !== images.get(path)) {
      problems.push(
        `${where}: the file's sha256 is ${images.get(path)}, not the ` +
          'recorded one, so it changed after its record was written. If it ' +
          'is still the image the entry describes, record that hash; if not, ' +
          'write the entry anew'
      );
    }
  });
  for (const path of images.keys()) {
    if (!recorded.has(path)) {
      problems.push(
        `templates/${slug}/${path} has no entry in ${at}; draw it for the ` +
          `port and record it, or drop it (${GUIDE})`
      );
    }
  }
  return problems;
}

/** A tracked file's bytes, or null for one that is not a regular file. */
function readRegular(path) {
  try {
    return lstatSync(path).isFile() ? readFileSync(path) : null;
  } catch {
    return null;
  }
}

/**
 * Problems with one template's images. `files` are the paths git tracks in
 * its folder, relative to it.
 */
export function templateImageProblems(root, slug, files) {
  const dir = join(root, 'templates', slug);
  const problems = [];
  const images = new Map();
  for (const file of files.filter(isImagePath)) {
    const bytes = readRegular(join(dir, file));
    // A tracked file that is missing or a link is the templates test's to
    // report; with no bytes it has no hash, so its entry fails here too.
    if (bytes) images.set(file, sha256(bytes));
  }
  // Undefined when the folder has no record.
  let record;
  let parsed = true;
  if (files.includes(RECORD)) {
    try {
      record = JSON.parse(readRegular(join(dir, RECORD)) ?? '');
    } catch {
      problems.push(`templates/${slug}/${RECORD} is not valid JSON`);
      parsed = false;
    }
  }
  if (parsed) problems.push(...recordProblems(slug, record, images));

  for (const file of files) {
    const extension = extensionOf(file);
    const svg = SVG_EXTENSIONS.includes(extension);
    if (file === RECORD || !(svg || SOURCE_EXTENSIONS.includes(extension))) {
      continue;
    }
    const bytes = readRegular(join(dir, file));
    if (!bytes) continue;
    const at = `templates/${slug}/${file}`;
    let text;
    try {
      text = (extension === 'svgz' ? gunzipSync(bytes) : bytes).toString(
        'utf8'
      );
    } catch {
      problems.push(
        `${at} is not gzip-compressed, as an .svgz must be, so what it ` +
          'draws cannot be read; save it as a plain .svg'
      );
      continue;
    }
    const drawn = svg ? svgReferences(text) : [];
    for (const target of drawn) {
      problems.push(
        `${at} draws ${target} from outside the file; an SVG drawn for the ` +
          'port holds every shape it shows, so draw that into the file and ' +
          `point at it with a #fragment (${GUIDE})`
      );
    }
    // An SVG is read as its parser reads it, so a reference written with
    // character references is found, and matches the one reported above.
    // Another source is read for its image loads too, each reported once.
    const loads = svg
      ? externalImages(decodeXml(text))
      : new Set([...externalImages(text), ...imageLoads(text)]);
    for (const image of loads) {
      if (drawn.some(target => target.includes(image))) continue;
      problems.push(
        `${at} loads ${image}, an image the template does not ship; draw ` +
          `one for the port into public/, record it in ${RECORD}, and point ` +
          `at that (${GUIDE})`
      );
    }
  }
  return problems;
}

/**
 * Every problem with the images of the templates in `tracked`, a listing of
 * what git tracks under templates/ in the checkout at `root`.
 */
export function imagesProblems(root, tracked) {
  const { slugs, files } = templatePaths(tracked);
  return slugs.flatMap(slug =>
    templateImageProblems(
      root,
      slug,
      files
        .filter(file => file.path.startsWith(`${slug}/`))
        .map(file => file.path.slice(slug.length + 1))
    )
  );
}

/** Every problem with the template images in the checkout at `root`. */
export function checkTemplateImages(root) {
  return imagesProblems(root, trackedTemplates(root));
}
