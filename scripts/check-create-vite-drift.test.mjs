/**
 * Guards on check-create-vite-drift.mjs (#1304).
 *
 * Its failure mode is silence: a comparison that quietly matches nothing
 * reports "no difference" every week while the templates fall behind, which
 * is how #1304 happened. So the assertions are written around what it would
 * tell a maintainer, and the create-vite side is a real tarball built here,
 * read back through the same tar reader and integrity check the live run uses.
 *
 * `.mjs` and `node --test` rather than jest, like the other root scripts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import {
  MARKER,
  CODE_CONSTANTS,
  parseArgs,
  verifyIntegrity,
  readTar,
  filesUnder,
  compareManifests,
  compareFiles,
  scrapeConstant,
  rangeInCreateViteCode,
  compareCodeConstants,
  hasDrift,
  renderReport,
  renderIssue,
  findMarkerIssue,
  findDrift,
  readOurTemplates,
  main,
} from './check-create-vite-drift.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- fixtures ----------------------------------------------------------------

/** One 512-byte ustar header. */
function header(name, size, type = '0', prefix = '') {
  const block = Buffer.alloc(512);
  block.write(name, 0, 100, 'utf8');
  block.write('0000644\0', 100, 8, 'utf8');
  block.write(`${size.toString(8).padStart(11, '0')}\0`, 124, 12, 'utf8');
  block.write(type, 156, 1, 'utf8');
  block.write('ustar\0', 257, 6, 'utf8');
  block.write(prefix, 345, 155, 'utf8');
  return block;
}

const pad = data =>
  Buffer.concat([data, Buffer.alloc((512 - (data.length % 512)) % 512)]);

/**
 * A tar archive of entries, each { name, content } or { name, type }. A name
 * longer than 100 bytes goes in a pax header, the way npm writes one.
 */
function tar(entries) {
  const parts = [];
  for (const { name, content = '', type = '0', prefix = '' } of entries) {
    const data = Buffer.from(content);
    if (name.length > 100) {
      const record = ` path=${name}\n`;
      const pax = Buffer.from(`${record.length + 3}${record}`);
      parts.push(header('PaxHeader', pax.length, 'x'), pad(pax));
      parts.push(
        header(name.slice(0, 100), data.length, type, prefix),
        pad(data)
      );
    } else {
      parts.push(header(name, data.length, type, prefix), pad(data));
    }
  }
  parts.push(Buffer.alloc(1024));
  return Buffer.concat(parts);
}

const integrityOf = buffer =>
  `sha512-${createHash('sha512').update(buffer).digest('base64')}`;

const REACT = {
  name: 'vite-react-starter',
  scripts: {
    dev: 'vite',
    build: 'vite build',
    lint: 'oxlint',
    preview: 'vite preview',
  },
  dependencies: { react: '^19.3.1', 'react-dom': '^19.3.1' },
  devDependencies: {
    '@types/react': '^19.3.0',
    '@vitejs/plugin-react': '^6.1.2',
    oxlint: '^1.89.0',
    vite: '^8.3.5',
  },
};
const REACT_TS = {
  ...REACT,
  scripts: { ...REACT.scripts, build: 'tsc -b && vite build' },
  devDependencies: { ...REACT.devDependencies, typescript: '~7.0.2' },
};
const OXLINTRC = '{\n  "plugins": ["react", "oxc"]\n}\n';
const TSCONFIG =
  '{ "files": [], "references": [{ "path": "./tsconfig.app.json" }] }\n';
const CODE =
  'r.push([`@eslint/js`,`^10.0.1`],[`eslint`,`^10.13.0`]),n&&(r.push([`typescript-eslint`,`^8.72.0`]),' +
  't.devDependencies.typescript=`~6.0.3`);r.push([`@babel/core`,`^7.29.7`]),' +
  't&&r.push([`@types/babel__core`,`^7.20.5`]);';
const CONSTANTS = `
export const ESLINT_DEV_DEPENDENCIES: Record<string, string> = {
  '@eslint/js': '^10.0.1',
  eslint: '^10.13.0',
};

export const ESLINT_TYPESCRIPT_DEV_DEPENDENCIES: Record<string, string> = {
  typescript: '~6.0.3',
  'typescript-eslint': '^8.72.0',
};

export const REACT_COMPILER_DEV_DEPENDENCIES: Record<string, string> = {
  '@babel/core': '^7.29.7',
};

export const REACT_COMPILER_TYPESCRIPT_DEV_DEPENDENCIES: Record<
  string,
  string
> = {
  '@types/babel__core': '^7.20.5',
};
`;

/** create-vite's package as tar entries, with `changes` applied to its files. */
function createViteEntries(changes = {}) {
  const files = {
    'package/package.json': '{"name":"create-vite","version":"9.9.9"}',
    'package/dist/index.js': CODE,
    'package/template-react/package.json': JSON.stringify(REACT),
    'package/template-react/_oxlintrc.json': OXLINTRC,
    'package/template-react/src/App.jsx': 'upstream app',
    'package/template-react/public/favicon.svg': '<svg/>',
    'package/template-react-ts/package.json': JSON.stringify(REACT_TS),
    'package/template-react-ts/_oxlintrc.json': OXLINTRC,
    'package/template-react-ts/tsconfig.json': TSCONFIG,
    'package/template-react-ts/src/assets/hero.png': 'png',
    ...changes,
  };
  return Object.entries(files)
    .filter(([, content]) => content !== null)
    .map(([name, content]) => ({ name, content }));
}

/** Our two templates on disk, matching createViteEntries() unchanged. */
async function ourTemplatesFixture(changes = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'create-vite-drift-'));
  const files = {
    'vite/package.json': JSON.stringify({
      ...REACT,
      name: 'vite-bestax-app',
      dependencies: {
        ...REACT.dependencies,
        '@allxsmith/bestax-bulma': 'workspace:^',
      },
    }),
    'vite/_oxlintrc.json': '{ "plugins": [ "react", "oxc" ] }',
    'vite/src/App.jsx': 'our app',
    'vite/public/bestax.svg': '<svg/>',
    'vite-ts/package.json': JSON.stringify({
      ...REACT_TS,
      name: 'vite-ts-bestax-app',
      dependencies: {
        ...REACT_TS.dependencies,
        '@allxsmith/bestax-bulma': 'workspace:^',
      },
    }),
    'vite-ts/_oxlintrc.json': OXLINTRC,
    'vite-ts/tsconfig.json': TSCONFIG,
    'vite-ts/node_modules/vite/package.json': '{}',
    ...changes,
  };
  for (const [file, content] of Object.entries(files)) {
    if (content === null) continue;
    await mkdir(dirname(join(dir, file)), { recursive: true });
    await writeFile(join(dir, file), content);
  }
  const constantsFile = join(dir, 'constants.ts');
  await writeFile(constantsFile, CONSTANTS);
  return { templatesDir: dir, constantsFile };
}

/**
 * A fetch stub: the registry's latest manifest, the tarball, then the GitHub
 * calls, answered from `issues` for the list and recorded for the writes.
 */
function stubFetch({
  entries = createViteEntries(),
  issues = [],
  manifest,
} = {}) {
  const tarball = gzipSync(tar(entries));
  const calls = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const method = init.method ?? 'GET';
    calls.push({ url: String(url), method, body: init.body });
    let body = {};
    let bytes;
    if (String(url) === 'https://registry.npmjs.org/create-vite/latest') {
      body = manifest ?? {
        version: '9.9.9',
        dist: {
          tarball:
            'https://registry.npmjs.org/create-vite/-/create-vite-9.9.9.tgz',
          integrity: integrityOf(tarball),
        },
      };
    } else if (String(url).endsWith('.tgz')) {
      bytes = tarball;
    } else if (method === 'GET') {
      body = issues;
    } else {
      body = { number: 99 };
    }
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      json: async () => body,
      text: async () => JSON.stringify(body),
      arrayBuffer: async () =>
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
    };
  };
  return {
    calls,
    writes: () => calls.filter(c => c.method !== 'GET'),
    restore: () => {
      globalThis.fetch = real;
    },
  };
}

async function quietly(fn) {
  const log = console.log;
  const lines = [];
  console.log = (...args) => lines.push(args.join(' '));
  try {
    await fn();
  } finally {
    console.log = log;
  }
  return lines.join('\n');
}

// --- arguments and integrity -------------------------------------------------

test('parseArgs takes --report alone, and needs a repo otherwise', () => {
  assert.deepEqual(parseArgs(['--report']), {
    repo: undefined,
    dryRun: false,
    report: true,
  });
  assert.deepEqual(parseArgs(['--repo=a/b', '--dry-run']), {
    repo: 'a/b',
    dryRun: true,
    report: false,
  });
  assert.throws(() => parseArgs([]), /--repo=owner\/name is required/);
  assert.throws(() => parseArgs(['--repo=nope']), /--repo=owner\/name/);
});

test('verifyIntegrity takes a matching sha512 and refuses anything else', () => {
  const data = Buffer.from('tarball');
  verifyIntegrity(data, integrityOf(data));
  assert.throws(
    () => verifyIntegrity(Buffer.from('tampered'), integrityOf(data)),
    /does not match/
  );
  assert.throws(
    () => verifyIntegrity(data, 'sha1-abc='),
    /no sha512 integrity/
  );
  assert.throws(() => verifyIntegrity(data, undefined), /no sha512 integrity/);
});

// --- the tar reader ----------------------------------------------------------

test('readTar returns the regular files, without npm’s package/ prefix', () => {
  const longName = `package/${'deep/'.repeat(25)}file.txt`;
  const files = readTar(
    tar([
      { name: 'package/package.json', content: '{}' },
      { name: 'package/template-react', type: '5' },
      { name: 'package/link', type: '2' },
      { name: 'file.ts', prefix: 'package/src', content: 'prefixed' },
      { name: longName, content: 'long' },
      { name: 'package/empty.txt', content: '' },
    ])
  );
  assert.deepEqual(
    [...files.keys()],
    [
      'package.json',
      'src/file.ts',
      longName.slice('package/'.length),
      'empty.txt',
    ]
  );
  assert.equal(String(files.get('src/file.ts')), 'prefixed');
  assert.equal(String(files.get(longName.slice('package/'.length))), 'long');
});

test('readTar refuses a header whose size is not octal', () => {
  const bad = header('package/x', 1);
  bad.write('9'.repeat(11), 124, 11, 'utf8');
  assert.throws(
    () => readTar(Buffer.concat([bad, Buffer.alloc(1024)])),
    /isn't octal/
  );
});

test('filesUnder keys a folder’s files by their path inside it', () => {
  const files = new Map([
    ['template-react/package.json', 'a'],
    ['template-react-ts/package.json', 'b'],
    ['dist/index.js', 'c'],
  ]);
  assert.deepEqual(
    [...filesUnder(files, 'template-react')],
    [['package.json', 'a']]
  );
});

// --- the comparisons ---------------------------------------------------------

test('compareManifests names each range and script that moved, and skips the library', () => {
  const ours = {
    scripts: { dev: 'vite', lint: 'eslint .' },
    dependencies: {
      react: '^19.2.0',
      '@allxsmith/bestax-bulma': 'workspace:^',
    },
    devDependencies: { vite: '^8.1.0', eslint: '^10.0.0' },
  };
  const theirs = {
    scripts: { dev: 'vite', lint: 'oxlint', preview: 'vite preview' },
    dependencies: { react: '^19.3.1' },
    devDependencies: { vite: '^8.1.0', oxlint: '^1.89.0' },
  };
  assert.deepEqual(compareManifests(ours, theirs), [
    { kind: 'dependencies', name: 'react', ours: '^19.2.0', theirs: '^19.3.1' },
    {
      kind: 'devDependencies',
      name: 'eslint',
      ours: '^10.0.0',
      theirs: undefined,
    },
    {
      kind: 'devDependencies',
      name: 'oxlint',
      ours: undefined,
      theirs: '^1.89.0',
    },
    { kind: 'scripts', name: 'lint', ours: 'eslint .', theirs: 'oxlint' },
    {
      kind: 'scripts',
      name: 'preview',
      ours: undefined,
      theirs: 'vite preview',
    },
  ]);
  assert.deepEqual(compareManifests(theirs, theirs), []);
  assert.deepEqual(compareManifests({}, {}), []);
});

test('compareFiles ignores the image folders and whitespace, and names the rest', () => {
  const ours = new Map([
    ['package.json', '{}'],
    ['_oxlintrc.json', '{ "a": 1 }'],
    ['tsconfig.json', '{"b":2}'],
    ['eslint.config.js', 'x'],
    ['public/bestax.svg', '<svg/>'],
  ]);
  const theirs = new Map([
    ['package.json', '{}'],
    ['_oxlintrc.json', '{\n  "a": 1\n}\n'],
    ['tsconfig.json', '{"b":3}'],
    ['tsconfig.app.json', '{}'],
    ['src/assets/hero.png', 'png'],
  ]);
  assert.deepEqual(compareFiles(ours, theirs), {
    onlyTheirs: ['tsconfig.app.json'],
    onlyOurs: ['eslint.config.js'],
    differing: ['tsconfig.json'],
  });
});

test('scrapeConstant reads the object literals create-bestax actually declares', async () => {
  const source = await readFile(
    join(ROOT, 'create-bestax/src/constants.ts'),
    'utf8'
  );
  for (const constant of CODE_CONSTANTS) {
    const pairs = scrapeConstant(source, constant);
    assert.ok(pairs, `${constant} should read as name: range pairs`);
    for (const range of Object.values(pairs)) {
      assert.match(range, /^[~^]?\d+\.\d+\.\d+$/);
    }
  }
  assert.equal(
    scrapeConstant(source, 'ESLINT_DEV_DEPENDENCIES').eslint !== undefined,
    true
  );
});

test('scrapeConstant is null for a constant missing, reshaped or empty', () => {
  assert.equal(scrapeConstant('', 'X'), null);
  assert.equal(scrapeConstant('export const X = { a: 1 };', 'X'), null);
  assert.equal(
    scrapeConstant('export const X: Record<string, string> = {};', 'X'),
    null
  );
});

test('rangeInCreateViteCode finds a pushed pair, and TypeScript’s assignment', () => {
  assert.equal(rangeInCreateViteCode(CODE, '@eslint/js'), '^10.0.1');
  assert.equal(rangeInCreateViteCode(CODE, '@babel/core'), '^7.29.7');
  assert.equal(rangeInCreateViteCode(CODE, 'typescript'), '~6.0.3');
  assert.equal(rangeInCreateViteCode(CODE, 'globals'), undefined);
  assert.equal(rangeInCreateViteCode('', 'typescript'), undefined);
});

test('compareCodeConstants names a moved range, a dropped package and an unreadable constant', () => {
  const moved = CODE.replace('`^10.13.0`', '`^10.14.0`');
  const { rows, unreadable } = compareCodeConstants(
    CONSTANTS.replace(
      "'@babel/core': '^7.29.7',",
      "'@babel/core': '^7.29.7',\n  extra: '^1.0.0',"
    ).replace("  '@types/babel__core': '^7.20.5',\n", ''),
    moved
  );
  assert.deepEqual(rows, [
    {
      constant: 'ESLINT_DEV_DEPENDENCIES',
      name: 'eslint',
      ours: '^10.13.0',
      theirs: '^10.14.0',
    },
    {
      constant: 'REACT_COMPILER_DEV_DEPENDENCIES',
      name: 'extra',
      ours: '^1.0.0',
      theirs: undefined,
    },
  ]);
  // Emptied above, so it reads as nothing to compare.
  assert.deepEqual(unreadable, ['REACT_COMPILER_TYPESCRIPT_DEV_DEPENDENCIES']);
  assert.deepEqual(compareCodeConstants(CONSTANTS, CODE), {
    rows: [],
    unreadable: [],
  });
});

// --- reading our side --------------------------------------------------------

test('readOurTemplates reads both real templates, by path inside each', async () => {
  const templates = await readOurTemplates(
    join(ROOT, 'create-bestax/templates')
  );
  assert.deepEqual([...templates.keys()], ['vite', 'vite-ts']);
  for (const files of templates.values()) {
    assert.ok(files.has('package.json'));
    assert.ok(files.has('_oxlintrc.json'));
    assert.ok([...files.keys()].every(file => !file.includes('\\')));
  }
  assert.ok(templates.get('vite-ts').has('tsconfig.app.json'));
});

test('readOurTemplates leaves out an install’s node_modules', async () => {
  const { templatesDir } = await ourTemplatesFixture();
  const files = (await readOurTemplates(templatesDir)).get('vite-ts');
  assert.ok([...files.keys()].every(file => !file.startsWith('node_modules/')));
});

// --- the whole comparison and the report -------------------------------------

test('findDrift and renderReport: a missing starter, moved ranges and files', () => {
  const files = readTar(
    tar(
      createViteEntries({
        'package/template-react/package.json': null,
        'package/template-react/src/App.jsx': null,
        'package/template-react/_oxlintrc.json': null,
        'package/template-react/public/favicon.svg': null,
        'package/template-react-ts/package.json': JSON.stringify({
          ...REACT_TS,
          devDependencies: { ...REACT_TS.devDependencies, vite: '^8.4.0' },
        }),
        'package/template-react-ts/eslint.config.js': 'new',
      })
    )
  );
  const drift = findDrift({
    files,
    ourTemplates: new Map([
      [
        'vite-ts',
        new Map([
          ['package.json', JSON.stringify(REACT_TS)],
          ['_oxlintrc.json', OXLINTRC],
          ['tsconfig.json', '{}'],
        ]),
      ],
    ]),
    constantsSource: 'nothing here',
  });
  assert.equal(hasDrift(drift), true);
  assert.equal(drift.templates[0].missing, true);
  assert.deepEqual(drift.templates[1].manifest, [
    { kind: 'devDependencies', name: 'vite', ours: '^8.3.5', theirs: '^8.4.0' },
  ]);
  assert.deepEqual(drift.code.unreadable, CODE_CONSTANTS);

  const report = renderReport(drift, '9.9.9');
  assert.match(
    report,
    /create-vite 9\.9\.9 has no `template-react` starter any more\./
  );
  assert.match(
    report,
    /\| devDependencies \| `vite` \| `\^8\.3\.5` \| `\^8\.4\.0` \|/
  );
  assert.match(
    report,
    /create-vite has `eslint\.config\.js`, and the template doesn't\./
  );
  assert.match(report, /`tsconfig\.json` differs from create-vite's\./);
  assert.match(report, /`ESLINT_DEV_DEPENDENCIES` isn't declared/);
});

test('renderReport shows a dash for a side with nothing, and notes what it means', () => {
  const drift = {
    templates: [
      {
        ours: 'vite',
        theirs: 'template-react',
        missing: false,
        manifest: [],
        files: { onlyTheirs: [], onlyOurs: ['extra.js'], differing: [] },
      },
    ],
    code: {
      rows: [
        { constant: 'C', name: 'gone', ours: '^1.0.0', theirs: undefined },
      ],
      unreadable: [],
    },
  };
  const report = renderReport(drift, '9.9.9');
  assert.match(
    report,
    /The template has `extra\.js`, and create-vite doesn't\./
  );
  assert.match(report, /\| `C` \| `gone` \| `\^1\.0\.0` \| — \|/);
  assert.match(report, /no longer names the package/);
});

test('renderIssue carries the marker and names the create-vite version', () => {
  const drift = {
    templates: [],
    code: { rows: [], unreadable: ['C'] },
  };
  const { title, body } = renderIssue(drift, '9.9.9');
  assert.equal(title, "create-bestax's templates are behind create-vite 9.9.9");
  assert.ok(body.startsWith(MARKER));
  assert.match(body, /3-day cooldown/);
});

test('findMarkerIssue skips pull requests and other issues', () => {
  assert.equal(
    findMarkerIssue([
      { number: 1, body: MARKER, pull_request: {} },
      { number: 2, body: 'other' },
      { number: 3, body: `${MARKER}\nx` },
    ]).number,
    3
  );
  assert.equal(findMarkerIssue(undefined), undefined);
});

// --- main: the registry, then the issue --------------------------------------

test('--report prints the comparison and touches no issue', async () => {
  const paths = await ourTemplatesFixture();
  const s = stubFetch();
  let out;
  try {
    out = await quietly(() => main(['--report'], paths));
  } finally {
    s.restore();
  }
  assert.match(out, /create-vite 9\.9\.9/);
  assert.equal(out.match(/No difference\./g).length, 3);
  assert.equal(s.calls.length, 2, 'the manifest and the tarball, nothing else');
});

test('opens one issue, labelled dependencies, when the templates are behind', async () => {
  const paths = await ourTemplatesFixture({
    'vite/package.json': JSON.stringify({
      ...REACT,
      devDependencies: { ...REACT.devDependencies, vite: '^8.1.0' },
    }),
  });
  const s = stubFetch({ issues: [{ number: 1, body: 'unrelated' }] });
  try {
    await quietly(() => main(['--repo=a/b'], paths));
  } finally {
    s.restore();
  }
  const writes = s.writes();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].method, 'POST');
  assert.match(writes[0].url, /\/repos\/a\/b\/issues$/);
  const sent = JSON.parse(writes[0].body);
  assert.deepEqual(sent.labels, ['dependencies']);
  assert.ok(sent.body.includes(MARKER));
  assert.match(sent.body, /`\^8\.1\.0` \| `\^8\.3\.5`/);
});

test('updates the open issue rather than opening a second', async () => {
  const paths = await ourTemplatesFixture({ 'vite-ts/tsconfig.json': '{}' });
  const s = stubFetch({ issues: [{ number: 7, body: `${MARKER}\nold` }] });
  try {
    await quietly(() => main(['--repo=a/b'], paths));
  } finally {
    s.restore();
  }
  const writes = s.writes();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].method, 'PATCH');
  assert.match(writes[0].url, /\/issues\/7$/);
});

test('closes the open issue with a comment once the templates match', async () => {
  const paths = await ourTemplatesFixture();
  const s = stubFetch({ issues: [{ number: 7, body: `${MARKER}\nold` }] });
  try {
    await quietly(() => main(['--repo=a/b'], paths));
  } finally {
    s.restore();
  }
  const writes = s.writes();
  assert.deepEqual(
    writes.map(w => [w.method, w.url.replace(/^.*\/repos\/a\/b/, '')]),
    [
      ['POST', '/issues/7/comments'],
      ['PATCH', '/issues/7'],
    ]
  );
  assert.deepEqual(JSON.parse(writes[1].body), {
    state: 'closed',
    state_reason: 'completed',
  });
});

test('does nothing when the templates match and no issue is open', async () => {
  const paths = await ourTemplatesFixture();
  const s = stubFetch();
  let out;
  try {
    out = await quietly(() => main(['--repo=a/b'], paths));
  } finally {
    s.restore();
  }
  assert.equal(s.writes().length, 0);
  assert.match(out, /match create-vite 9\.9\.9\. Nothing to do\./);
});

test('--dry-run says what it would do, and writes nothing', async () => {
  const behind = await ourTemplatesFixture({ 'vite-ts/tsconfig.json': '{}' });
  const level = await ourTemplatesFixture();
  const outputs = [];
  for (const [paths, issues] of [
    [behind, []],
    [behind, [{ number: 7, body: MARKER }]],
    [level, [{ number: 7, body: MARKER }]],
  ]) {
    const s = stubFetch({ issues });
    try {
      outputs.push(
        await quietly(() => main(['--repo=a/b', '--dry-run'], paths))
      );
    } finally {
      s.restore();
    }
    assert.equal(s.writes().length, 0);
  }
  assert.match(outputs[0], /would open an issue titled/);
  assert.match(outputs[1], /would update #7/);
  assert.match(outputs[2], /would close #7/);
});

test('refuses a tarball that does not match its integrity, or one off the registry', async () => {
  const paths = await ourTemplatesFixture();
  for (const manifest of [
    {
      version: '9.9.9',
      dist: {
        tarball:
          'https://registry.npmjs.org/create-vite/-/create-vite-9.9.9.tgz',
        integrity: integrityOf(Buffer.from('something else')),
      },
    },
    {
      version: '9.9.9',
      dist: { tarball: 'https://example.com/create-vite.tgz' },
    },
  ]) {
    const s = stubFetch({ manifest });
    try {
      await assert.rejects(
        () => main(['--report'], paths),
        /integrity|unexpected tarball URL/
      );
    } finally {
      s.restore();
    }
  }
});

test('a failed request rejects with the status and URL', async () => {
  const paths = await ourTemplatesFixture();
  const real = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    statusText: 'Service Unavailable',
    text: async () => 'down',
  });
  try {
    await assert.rejects(
      () => main(['--report'], paths),
      /GET https:\/\/registry\.npmjs\.org\/create-vite\/latest failed: 503 Service Unavailable down/
    );
  } finally {
    globalThis.fetch = real;
  }
});

test('bad usage exits 2 before any request', async () => {
  const exit = process.exit;
  const error = console.error;
  let code;
  process.exit = c => {
    code = c;
    throw new Error('exit');
  };
  console.error = () => {};
  const s = stubFetch();
  try {
    await assert.rejects(() => main([]), /exit/);
  } finally {
    process.exit = exit;
    console.error = error;
    s.restore();
  }
  assert.equal(code, 2);
  assert.equal(s.calls.length, 0);
});
