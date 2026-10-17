// A fixture for scripts/templates.test.mjs, in the shape the Templates page's
// docs/src/data/templates.js takes: a `templates` list, one entry per folder.
export const templates = [
  {
    slug: 'example',
    title: 'Example',
    description: 'A fixture shaped like a real template.',
    author: { name: 'Example Author', url: 'https://github.com/example' },
    source: 'https://github.com/example/bulma-example-template',
    sourceSha: '0123456789abcdef0123456789abcdef01234567',
    demo: 'https://example.github.io/bulma-example-template/',
    license: 'MIT',
    tags: ['landing'],
  },
];
