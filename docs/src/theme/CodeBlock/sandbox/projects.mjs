/**
 * Builds the StackBlitz and CodeSandbox projects for one converted example.
 *
 * Both start from the create-bestax `vite-ts` template, so a sandbox looks
 * like the app `npm create bestax` makes. StackBlitz runs that Vite project
 * as it is. CodeSandbox gets the Create React App layout instead, the shape
 * its define API is known to open without an account.
 *
 * Pure: the template files and package versions come in as arguments, so
 * the docs bundle and the unit tests feed it the same template.
 */

const LIBRARY = '@allxsmith/bestax-bulma';

/** The template files a sandbox is built from, by path in the template. */
export const TEMPLATE_FILES = [
  'index.html',
  'package.json',
  'public/bestax.svg',
  'src/index.css',
  'src/main.tsx',
  'src/vite-env.d.ts',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
];

/**
 * What each icon library needs in a project, following the icon guide: a
 * stylesheet inside its package, or for Ionicons a script, loaded from a CDN
 * because its package does not export the module a bundler would import.
 */
export const ICON_LIBRARIES = {
  fa: {
    package: '@fortawesome/fontawesome-free',
    stylesheet: 'css/all.min.css',
  },
  mdi: { package: '@mdi/font', stylesheet: 'css/materialdesignicons.min.css' },
  'material-icons': {
    package: 'material-icons',
    stylesheet: 'iconfont/material-icons.css',
  },
  'material-symbols': { package: 'material-symbols', stylesheet: 'index.css' },
  ion: { package: 'ionicons', script: 'dist/ionicons/ionicons.esm.js' },
};

/**
 * The icon libraries an example draws from. Font Awesome is the Icon
 * component's default and several components render icons of their own, so
 * it is always included; the others only when the example names them.
 *
 * @param {string} code
 * @returns {string[]}
 */
export function iconLibrariesIn(code) {
  const found = ['fa'];
  if (/\bmdi\b/.test(code)) found.push('mdi');
  if (/material-icons/.test(code)) found.push('material-icons');
  if (/material-symbols/.test(code)) found.push('material-symbols');
  if (/['"`]ion['"`]|<ion-icon\b/.test(code)) found.push('ion');
  return found;
}

/** The lowest version a range allows, for a CDN URL that wants one. */
function lowestVersion(range) {
  return range.replace(/^[\s=v^~>]+/, '');
}

/** A file inside a package, on jsDelivr. */
function cdnUrl(versions, name, file) {
  return `https://cdn.jsdelivr.net/npm/${name}@${lowestVersion(versionOf(versions, name))}/${file}`;
}

function versionOf(versions, name) {
  const range = versions[name];
  if (!range) {
    throw new Error(`No version was given for ${name}.`);
  }
  return range;
}

function sortKeys(object) {
  return Object.fromEntries(
    Object.entries(object).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  );
}

function requireTemplate(template) {
  const missing = TEMPLATE_FILES.filter(
    path => typeof template[path] !== 'string'
  );
  if (missing.length > 0) {
    throw new Error(`The sandbox template is missing ${missing.join(', ')}.`);
  }
}

/** The npm packages the example's icon libraries install. */
function iconPackages(icons, versions) {
  return Object.fromEntries(
    icons
      .filter(id => ICON_LIBRARIES[id].stylesheet)
      .map(id => [
        ICON_LIBRARIES[id].package,
        versionOf(versions, ICON_LIBRARIES[id].package),
      ])
  );
}

/** `<script>` tags for icon libraries that load from a CDN. */
function iconScripts(icons, versions) {
  return icons
    .filter(id => ICON_LIBRARIES[id].script)
    .map(id => {
      const { package: name, script } = ICON_LIBRARIES[id];
      return `<script type="module" src="${cdnUrl(versions, name, script)}"></script>`;
    });
}

/** `<link>` tags for the icon stylesheets, from a CDN. */
function iconLinks(icons, versions) {
  return icons
    .filter(id => ICON_LIBRARIES[id].stylesheet)
    .map(id => {
      const { package: name, stylesheet } = ICON_LIBRARIES[id];
      return `<link rel="stylesheet" href="${cdnUrl(versions, name, stylesheet)}" />`;
    });
}

/** The template's entry file, importing the example's icon stylesheets. */
function withStylesheets(main, icons) {
  const lines = main.split('\n');
  const at = lines.findIndex(
    line => line.includes(`'${LIBRARY}/`) && line.includes('.css')
  );
  if (at === -1) {
    throw new Error(
      "The template's main.tsx no longer imports the bestax stylesheet, " +
        'so the sandbox builder cannot place the icon imports after it.'
    );
  }
  const imports = icons
    .filter(id => ICON_LIBRARIES[id].stylesheet)
    .map(
      id =>
        `import '${ICON_LIBRARIES[id].package}/${ICON_LIBRARIES[id].stylesheet}';`
    );
  lines.splice(at + 1, 0, ...imports);
  return lines.join('\n');
}

/**
 * @typedef {object} SandboxInput
 * @property {string} app The example module, written as `src/App.tsx`.
 * @property {string[]} icons Icon library ids, from `iconLibrariesIn`.
 * @property {Record<string, string>} template The template files, by path.
 * @property {Record<string, string>} versions Version ranges for the library
 *   and the icon packages.
 * @property {string} title
 * @property {string} [sourceUrl] The docs page the example came from.
 */

/**
 * A project for the StackBlitz SDK's `openProject`.
 *
 * @param {SandboxInput} input
 */
export function stackblitzProject({
  app,
  icons,
  template,
  versions,
  title,
  sourceUrl,
}) {
  requireTemplate(template);
  const pkg = JSON.parse(template['package.json']);
  pkg.name = 'bestax-example';
  // The template's lint setup is not copied, so its packages and script go.
  delete pkg.scripts.lint;
  pkg.devDependencies = Object.fromEntries(
    Object.entries(pkg.devDependencies).filter(
      ([name]) => !name.includes('eslint') && name !== 'globals'
    )
  );
  pkg.dependencies = sortKeys({
    ...pkg.dependencies,
    [LIBRARY]: versionOf(versions, LIBRARY),
    ...iconPackages(icons, versions),
  });

  const scripts = iconScripts(icons, versions);
  const html = scripts.length
    ? template['index.html'].replace(
        '</head>',
        `  ${scripts.join('\n    ')}\n  </head>`
      )
    : template['index.html'];

  const copied = TEMPLATE_FILES.filter(
    path =>
      !['index.html', 'package.json', 'src/main.tsx'].includes(path) &&
      template[path] !== undefined
  );
  return {
    title,
    description: sourceUrl ?? title,
    template: 'node',
    files: {
      ...Object.fromEntries(copied.map(path => [path, template[path]])),
      'index.html': html,
      'package.json': `${JSON.stringify(pkg, null, 2)}\n`,
      'src/main.tsx': withStylesheets(template['src/main.tsx'], icons),
      'src/App.tsx': app,
    },
  };
}

/**
 * Compiler options for the CodeSandbox editor. `moduleResolution` is `node`
 * rather than the template's `bundler` because the editor's TypeScript
 * predates `bundler` and, given it, cannot find the library's types at all.
 */
const CODESANDBOX_TSCONFIG = {
  compilerOptions: {
    target: 'ES2020',
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    moduleResolution: 'node',
    jsx: 'react-jsx',
    strict: true,
    skipLibCheck: true,
    isolatedModules: true,
    esModuleInterop: true,
    noEmit: true,
  },
  include: ['src'],
};

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * The `files` object for CodeSandbox's define API.
 *
 * Icon stylesheets load from a CDN here rather than from the installed
 * packages. CodeSandbox's in-browser bundler inlines a package's CSS without
 * rewriting its relative `url()`s, so the icon fonts would resolve against the
 * sandbox's own address and fail; from the CDN they resolve beside the CSS.
 *
 * @param {SandboxInput} input
 */
export function codesandboxFiles({
  app,
  icons,
  template,
  versions,
  title,
  sourceUrl,
}) {
  requireTemplate(template);
  const vite = JSON.parse(template['package.json']);
  const fromTemplate = names =>
    Object.fromEntries(
      names.map(name => [
        name,
        vite.dependencies[name] ?? vite.devDependencies[name],
      ])
    );

  const main = template['src/main.tsx'];
  if (!main.includes("from './App.tsx'")) {
    throw new Error(
      "The template's main.tsx no longer imports './App.tsx', so the " +
        'CodeSandbox entry cannot be derived from it.'
    );
  }

  const head = [
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `<title>${escapeHtml(title)}</title>`,
    ...iconLinks(icons, versions),
    ...iconScripts(icons, versions),
  ];
  const html = [
    '<!doctype html>',
    '<html lang="en">',
    '  <head>',
    ...head.map(line => `    ${line}`),
    '  </head>',
    '  <body>',
    '    <div id="root"></div>',
    '  </body>',
    '</html>',
    '',
  ].join('\n');

  return {
    'package.json': {
      content: {
        name: 'bestax-example',
        private: true,
        description: sourceUrl ?? title,
        main: 'src/index.tsx',
        dependencies: sortKeys({
          ...fromTemplate(['react', 'react-dom']),
          [LIBRARY]: versionOf(versions, LIBRARY),
        }),
        devDependencies: sortKeys({
          ...fromTemplate(['@types/react', '@types/react-dom', 'typescript']),
          'react-scripts': 'latest',
        }),
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build',
          test: 'react-scripts test',
          eject: 'react-scripts eject',
        },
      },
    },
    'public/index.html': { content: html },
    'src/index.tsx': {
      content: main.replace("from './App.tsx'", "from './App'"),
    },
    'src/index.css': { content: template['src/index.css'] },
    'src/App.tsx': { content: app },
    'tsconfig.json': {
      content: `${JSON.stringify(CODESANDBOX_TSCONFIG, null, 2)}\n`,
    },
  };
}
