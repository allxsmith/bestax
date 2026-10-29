// The scaffolder edits the templates with string patterns, so a test against
// a hand-written stand-in proves the pattern and not that it still matches the
// file it ships with. Everything here runs against the real templates, copied
// to a temp directory, with the real filesystem.
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const { ProjectCreator } = await import('../project-creator.js');
const { updatePackageJson } = await import('../file-system.js');
const { LIBRARY, libraryRange } = await import('../library-range.js');
const {
  BULMA_FLAVORS,
  CSS_ORDER_COMMENT,
  ESLINT_CONFIG,
  ESLINT_DEV_DEPENDENCIES,
  ESLINT_TYPESCRIPT_DEV_DEPENDENCIES,
  ICON_LIBRARIES,
  NO_HELPERS_STARTER_CLASSES,
  REACT_COMPILER_DEV_DEPENDENCIES,
  REACT_COMPILER_TYPESCRIPT_DEV_DEPENDENCIES,
  REACT_COMPILER_README,
  ROUTER_SETUPS,
} = await import('../constants.js');

const testDir = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.resolve(testDir, '../../templates');
const TEMPLATES = ['vite', 'vite-ts'] as const;
const appFile = (template: string) =>
  template === 'vite-ts' ? 'App.tsx' : 'App.jsx';
const mainFile = (template: string) =>
  template === 'vite-ts' ? 'main.tsx' : 'main.jsx';

// The helper props are the ones useBulmaClasses takes out of a component's
// props and turns into classes, viewport variants such as `displayTablet`
// included. They are read from its source rather than listed here, so a
// helper added to the library is one this gate already knows.
function helperPropsOfUseBulmaClasses(): string[] {
  const file = path.resolve(
    testDir,
    '../../../bulma-ui/src/helpers/useBulmaClasses.tsx'
  );
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const names: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name) &&
      node.initializer &&
      ts.isIdentifier(node.initializer) &&
      node.initializer.text === 'props'
    ) {
      for (const element of node.name.elements) {
        if (element.dotDotDotToken) continue;
        names.push((element.propertyName ?? element.name).getText(source));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return names;
}

// `color` is left out: on Button and Notification it is the component's own
// modifier, which every flavor styles. `textColor` and `bgColor` are the
// names some components give the helper's `color` and `backgroundColor`.
const HELPER_PROPS = [
  ...helperPropsOfUseBulmaClasses().filter(name => name !== 'color'),
  'textColor',
  'bgColor',
];

// The helper props a JSX file writes. It parses the file rather than matching
// text, so a boolean prop written bare (`<Box relative>`) counts as much as one
// with a value, and the same word in a sentence or a comment does not.
function helperPropsIn(code: string): string[] {
  const source = ts.createSourceFile(
    'App.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(source);
      if (HELPER_PROPS.includes(name)) found.push(name);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe('the no-helpers gate', () => {
  // If the hook stopped destructuring its props in one place, the read above
  // would come back short and the gate would pass on helpers it can't see.
  it('reads every helper prop from useBulmaClasses, viewport variants included', () => {
    expect(HELPER_PROPS).toEqual(
      expect.arrayContaining([
        'mt',
        'textAlign',
        'display',
        'displayTablet',
        'displayTabletOnly',
        'textAlignMobile',
        'visibilityDesktopOnly',
        'overflowX',
        'overflowY',
        'flexGrow',
      ])
    );
  });

  it('finds a helper prop written bare, and nothing outside an attribute', () => {
    expect(helperPropsIn('<Box displayTablet="flex" />')).toEqual([
      'displayTablet',
    ]);
    expect(helperPropsIn('<Box relative>x</Box>')).toEqual(['relative']);
    expect(helperPropsIn('<Box\n  clearfix\n/>')).toEqual(['clearfix']);
    expect(helperPropsIn('<Box mt={size} />')).toEqual(['mt']);
    expect(
      helperPropsIn(
        '<Button color="info">\n  {/* a gap or display */} relative gap display\n</Button>'
      )
    ).toEqual([]);
  });
});

let workDir: string;
let projectCreator: InstanceType<typeof ProjectCreator>;

beforeEach(async () => {
  workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'create-bestax-tpl-'));
  projectCreator = new ProjectCreator(templatesDir);
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(async () => {
  jest.restoreAllMocks();
  await fs.remove(workDir);
});

async function scaffold(template: string): Promise<string> {
  const target = path.join(workDir, template);
  await projectCreator.copyTemplate(template, target);
  return target;
}

describe('vite-ts template TypeScript projects', () => {
  // `tsc -b` writes every referenced project's output unless it is told not
  // to, and a vite.config.js written next to vite.config.ts is the file Vite
  // then loads (#947).
  // The same walk has to reach both halves of the build: `vite build` checks
  // no types, so a graph that stopped reaching the project for `src/` would
  // build green while type-checking nothing.
  it('type-checks src/ and vite.config.ts, and emits nothing from either', () => {
    const templateDir = path.join(templatesDir, 'vite-ts');
    const seen = new Set<string>();
    const checked: string[] = [];
    const visit = (configPath: string) => {
      if (seen.has(configPath)) return;
      seen.add(configPath);
      const parsed = ts.getParsedCommandLineOfConfigFile(
        configPath,
        {},
        {
          ...ts.sys,
          onUnRecoverableConfigFileDiagnostic: d => {
            throw new Error(String(d.messageText));
          },
        }
      );
      if (!parsed) throw new Error(`could not parse ${configPath}`);
      if (parsed.fileNames.length > 0) {
        expect({
          config: path.basename(configPath),
          noEmit: parsed.options.noEmit,
        }).toEqual({
          config: path.basename(configPath),
          noEmit: true,
        });
        checked.push(...parsed.fileNames);
      }
      for (const ref of parsed.projectReferences ?? []) {
        visit(ts.resolveProjectReferencePath(ref));
      }
    };
    visit(path.join(templateDir, 'tsconfig.json'));

    const src = path.join(templateDir, 'src') + path.sep;
    expect(checked.some(file => file.startsWith(src))).toBe(true);
    expect(checked).toContain(path.join(templateDir, 'vite.config.ts'));
  });
});

describe.each(TEMPLATES)(
  '%s template under a flavor without helpers',
  template => {
    const noHelperFlavors = BULMA_FLAVORS.filter(f => f.noHelpers).map(
      f => f.name
    );

    it.each(noHelperFlavors)(
      'replaces every helper prop in the starter (%s)',
      async flavor => {
        const target = await scaffold(template);
        await projectCreator.setupBulmaFlavor(target, flavor, template);

        const app = await fs.readFile(
          path.join(target, 'src', appFile(template)),
          'utf8'
        );
        const css = await fs.readFile(
          path.join(target, 'src', 'App.css'),
          'utf8'
        );

        expect(helperPropsIn(app)).toEqual([]);
        for (const { className, declaration } of NO_HELPERS_STARTER_CLASSES) {
          expect(app).toContain(`className="${className}"`);
          expect(css).toContain(`.${className} {\n  ${declaration}\n}`);
        }
      }
    );

    // The icon step runs after the swap above and writes into the same App, so
    // a helper prop it adds (the old card icons' `mr="2"`) renders nothing
    // here and no row in the table can replace it. Scan the App a scaffold
    // ends with, after both steps, for every icon library.
    it.each(
      noHelperFlavors.flatMap(flavor =>
        ICON_LIBRARIES.map(lib => [flavor, lib.name] as const)
      )
    )(
      'leaves no helper prop once the icon step has run too (%s, %s)',
      async (flavor, iconLibrary) => {
        const target = await scaffold(template);
        await projectCreator.setupBulmaFlavor(target, flavor, template);
        await projectCreator.setupIconLibrary(target, iconLibrary, template);

        const app = await fs.readFile(
          path.join(target, 'src', appFile(template)),
          'utf8'
        );
        expect(helperPropsIn(app)).toEqual([]);
      }
    );

    it('leaves the helper props alone in a flavor that has them', async () => {
      const target = await scaffold(template);
      await projectCreator.setupBulmaFlavor(target, 'complete', template);

      const app = await fs.readFile(
        path.join(target, 'src', appFile(template)),
        'utf8'
      );
      expect(helperPropsIn(app)).not.toEqual([]);
      for (const { prop, className } of NO_HELPERS_STARTER_CLASSES) {
        expect(app).toContain(prop);
        expect(app).not.toContain(`className="${className}"`);
      }
    });
  }
);

describe.each(TEMPLATES)('%s template icon setup', template => {
  const libraries = ICON_LIBRARIES.filter(lib => lib.name !== 'none');

  it.each(libraries.map(lib => lib.name))(
    'titles every starter card with a decorative IconText (%s)',
    async iconLibrary => {
      const target = await scaffold(template);
      await projectCreator.setupIconLibrary(target, iconLibrary, template);

      const app = await fs.readFile(
        path.join(target, 'src', appFile(template)),
        'utf8'
      );
      expect(app).toMatch(
        /import\s*\{[^}]*\bIconText,[^}]*\}\s*from '@allxsmith\/bestax-bulma'/
      );
      for (const title of ['Quick Start', 'Documentation', 'Examples']) {
        expect(app).toMatch(
          new RegExp(
            `<Card\\.Header\\.Title[^>]*>\\s*<IconText\\s+iconProps=\\{\\{[^}]*'aria-hidden': 'true',[^}]*\\}\\}\\s*>\\s*${title}\\s*</IconText>`
          )
        );
      }
    }
  );

  // project-creator.test.ts covers every flavor and icon library for #946 on
  // an in-memory filesystem. This runs the same order end to end on disk,
  // where the flavor step also rewrites the starter under no-helpers, so the
  // template's entry file must still give the icon import a place to go.
  it.each(BULMA_FLAVORS.map(f => f.name))(
    'loads the icon stylesheet after the %s flavor stylesheet',
    async flavor => {
      const target = await scaffold(template);
      await projectCreator.setupBulmaFlavor(target, flavor, template);
      await projectCreator.setupIconLibrary(target, 'fontawesome', template);

      const main = await fs.readFile(
        path.join(target, 'src', mainFile(template)),
        'utf8'
      );
      const flavorImport = BULMA_FLAVORS.find(
        f => f.name === flavor
      )!.importStatement;
      const iconImport = ICON_LIBRARIES.find(
        lib => lib.name === 'fontawesome'
      )!.importStatement!;
      expect(main).toContain(iconImport);
      expect(main.indexOf(iconImport)).toBeGreaterThan(
        main.indexOf(flavorImport)
      );
    }
  );
});

// The entry file imports the stylesheets ahead of App, and the no-helpers
// classes in App.css depend on that order, so the comment saying why has to
// survive the flavor step rewriting the import under it.
describe.each(TEMPLATES)('%s template entry file', template => {
  it('explains the stylesheet order where the scaffolder will look for it', async () => {
    const main = await fs.readFile(
      path.join(templatesDir, template, 'src', mainFile(template)),
      'utf8'
    );
    expect(main).toContain(
      `${CSS_ORDER_COMMENT}\nimport '@allxsmith/bestax-bulma/bestax.css';`
    );
  });

  it.each(['complete', 'no-helpers'])(
    'keeps that comment above the %s flavor stylesheet',
    async flavor => {
      const target = await scaffold(template);
      await projectCreator.setupBulmaFlavor(target, flavor, template);
      await projectCreator.setupIconLibrary(target, 'fontawesome', template);

      const main = await fs.readFile(
        path.join(target, 'src', mainFile(template)),
        'utf8'
      );
      const flavorImport = BULMA_FLAVORS.find(
        f => f.name === flavor
      )!.importStatement;
      expect(main).toContain(`${CSS_ORDER_COMMENT}\n${flavorImport}`);
      expect(main.split(CSS_ORDER_COMMENT)).toHaveLength(2);
      expect(main.indexOf("import './index.css';")).toBeGreaterThan(
        main.indexOf(flavorImport)
      );
      expect(main.indexOf('import App from')).toBeGreaterThan(
        main.indexOf("import './index.css';")
      );
    }
  );
});

describe.each(TEMPLATES)('%s template README', template => {
  const originalAgent = process.env.npm_config_user_agent;
  afterEach(() => {
    if (originalAgent === undefined) delete process.env.npm_config_user_agent;
    else process.env.npm_config_user_agent = originalAgent;
  });

  it.each(['npm', 'yarn', 'bun', 'pnpm'])(
    'gives its commands for the package manager that ran the CLI (%s)',
    async pm => {
      process.env.npm_config_user_agent = `${pm}/1.0.0 node/v22 darwin arm64`;
      const target = await scaffold(template);
      await projectCreator.updateReadme(target, 'none');

      const readme = await fs.readFile(path.join(target, 'README.md'), 'utf8');
      expect(readme).toContain(`${pm} install\n${pm} run dev`);
      for (const script of ['dev', 'build', 'preview', 'lint']) {
        expect(readme).toContain(`\`${pm} run ${script}\``);
      }
      if (pm !== 'pnpm') expect(readme).not.toMatch(/\bpnpm\b/);
    }
  );

  it('names the icon library the user picked, and none when they picked none', async () => {
    const withIcons = await scaffold(template);
    await projectCreator.updateReadme(withIcons, 'mdi');
    const readme = await fs.readFile(path.join(withIcons, 'README.md'), 'utf8');
    expect(readme).toContain('- 🎯 Material Design Icons icons');

    await fs.remove(withIcons);
    const without = await scaffold(template);
    await projectCreator.updateReadme(without, 'none');
    const plain = await fs.readFile(path.join(without, 'README.md'), 'utf8');
    expect(plain).not.toMatch(/icons/i);
  });
});

// The templates ship create-vite's default lint setup, Oxlint, and --lint
// eslint swaps in what create-vite's --eslint writes.
describe.each(TEMPLATES)('%s template linter', template => {
  const typescript = template === 'vite-ts';
  const readPkg = (target: string) =>
    fs.readJson(path.join(target, 'package.json')) as Promise<{
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    }>;

  it('lints with Oxlint, and carries no ESLint', async () => {
    const target = await scaffold(template);
    await projectCreator.setupLinter(target, 'oxlint', template);

    expect(fs.existsSync(path.join(target, '.oxlintrc.json'))).toBe(true);
    expect(fs.existsSync(path.join(target, '_oxlintrc.json'))).toBe(false);
    expect(fs.existsSync(path.join(target, 'eslint.config.js'))).toBe(false);
    const pkg = await readPkg(target);
    expect(pkg.scripts.lint).toBe('oxlint');
    expect(Object.keys(pkg.devDependencies)).toContain('oxlint');
    expect(
      Object.keys(pkg.devDependencies).filter(name => /eslint/.test(name))
    ).toEqual([]);
    if (typescript) {
      expect(pkg.devDependencies.typescript).toMatch(/^~7\./);
    }
  });

  it('swaps in ESLint for --lint eslint, and TypeScript 6 with it', async () => {
    const target = await scaffold(template);
    await projectCreator.updateReadme(target, 'none');
    await projectCreator.setupLinter(target, 'eslint', template);

    expect(fs.existsSync(path.join(target, '.oxlintrc.json'))).toBe(false);
    expect(
      await fs.readFile(path.join(target, 'eslint.config.js'), 'utf8')
    ).toBe(ESLINT_CONFIG(typescript));

    const pkg = await readPkg(target);
    expect(pkg.scripts.lint).toBe('eslint .');
    expect(pkg.devDependencies).not.toHaveProperty('oxlint');
    expect(pkg.devDependencies).toMatchObject(ESLINT_DEV_DEPENDENCIES);
    if (typescript) {
      expect(pkg.devDependencies).toMatchObject(
        ESLINT_TYPESCRIPT_DEV_DEPENDENCIES
      );
    } else {
      expect(pkg.devDependencies).not.toHaveProperty('typescript');
      expect(pkg.devDependencies).not.toHaveProperty('typescript-eslint');
    }
    const names = Object.keys(pkg.devDependencies);
    expect(names).toEqual([...names].sort());

    const readme = await fs.readFile(path.join(target, 'README.md'), 'utf8');
    expect(readme).toContain('Run ESLint');
    expect(readme).not.toContain('Oxlint');
  });
});

// A React Compiler template copies its plain template and turns the compiler
// on, the way create-vite builds its react-compiler starters.
describe.each([
  ['vite-compiler', 'vite'],
  ['vite-compiler-ts', 'vite-ts'],
] as const)('%s template', (template, directory) => {
  const typescript = directory === 'vite-ts';
  const config = typescript ? 'vite.config.ts' : 'vite.config.js';

  it(`is the ${directory} folder`, () => {
    expect(projectCreator.getTemplatePath(template)).toBe(
      path.join(templatesDir, directory)
    );
  });

  it('turns the compiler on in vite.config, with its packages', async () => {
    const target = await scaffold(directory);
    await projectCreator.setupReactCompiler(target, template);

    const viteConfig = await fs.readFile(path.join(target, config), 'utf8');
    expect(viteConfig).toContain(
      "import react, { reactCompilerPreset } from '@vitejs/plugin-react';\n" +
        "import babel from '@rolldown/plugin-babel';"
    );
    expect(viteConfig).toContain(
      '  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],'
    );
    expect(viteConfig).not.toContain('plugins: [react()],');

    const pkg = await fs.readJson(path.join(target, 'package.json'));
    expect(pkg.devDependencies).toMatchObject(REACT_COMPILER_DEV_DEPENDENCIES);
    if (typescript) {
      expect(pkg.devDependencies).toMatchObject(
        REACT_COMPILER_TYPESCRIPT_DEV_DEPENDENCIES
      );
    } else {
      expect(pkg.devDependencies).not.toHaveProperty('@types/babel__core');
    }
    const names = Object.keys(pkg.devDependencies);
    expect(names).toEqual([...names].sort());

    const readme = await fs.readFile(path.join(target, 'README.md'), 'utf8');
    expect(readme.endsWith(REACT_COMPILER_README)).toBe(true);
  });

  it(`leaves ${directory} itself alone`, async () => {
    const target = await scaffold(directory);
    const before = await fs.readFile(path.join(target, config), 'utf8');
    await projectCreator.setupReactCompiler(target, directory);

    expect(await fs.readFile(path.join(target, config), 'utf8')).toBe(before);
  });
});

// A router template copies its plain template, runs the same steps on it, and
// lays the router's files over it. These run the real files through the steps
// a scaffold takes, in its order, since the router step rewrites what the
// provider step wrote.
describe.each([
  {
    template: 'react-router',
    directory: 'vite',
    ext: 'jsx',
    router: 'react-router',
    files: ['src/Layout.jsx', 'src/router.jsx', 'src/pages/About.jsx'],
    homeRoute: '{ index: true, element: <App /> }',
  },
  {
    template: 'react-router-ts',
    directory: 'vite-ts',
    ext: 'tsx',
    router: 'react-router',
    files: ['src/Layout.tsx', 'src/router.tsx', 'src/pages/About.tsx'],
    homeRoute: '{ index: true, element: <App /> }',
  },
  {
    template: 'tanstack-router-ts',
    directory: 'vite-ts',
    ext: 'tsx',
    router: 'tanstack-router',
    files: [
      'src/Layout.tsx',
      'src/NavbarLink.tsx',
      'src/router.tsx',
      'src/pages/About.tsx',
    ],
    homeRoute: "path: '/',\n  component: App,",
  },
] as const)(
  '$template template',
  ({ template, directory, ext, router, files, homeRoute }) => {
    const setup = ROUTER_SETUPS[router];
    const read = (target: string, file: string) =>
      fs.readFile(path.join(target, file), 'utf8');

    it(`is the ${directory} folder`, () => {
      expect(projectCreator.getTemplatePath(template)).toBe(
        path.join(templatesDir, directory)
      );
    });

    it('adds the layout, the routes and a second page, each importing what exists', async () => {
      const target = await scaffold(directory);
      await projectCreator.setupRouter(target, template);

      for (const file of files) {
        const source = await read(target, file);
        for (const [, relative] of source.matchAll(/from '(\.[^']+)'/g)) {
          expect({
            file,
            import: relative,
            exists: fs.existsSync(
              path.resolve(target, path.dirname(file), relative)
            ),
          }).toEqual({ file, import: relative, exists: true });
        }
      }
      expect(await read(target, `src/router.${ext}`)).toContain(homeRoute);
    });

    it('renders the router in place of App, inside the provider an earlier step wrote', async () => {
      const target = await scaffold(directory);
      await projectCreator.setupBulmaFlavor(target, 'prefixed', template);
      await projectCreator.setupIconLibrary(target, 'mdi', template);
      await projectCreator.setupConfigProvider(
        target,
        'prefixed',
        'mdi',
        template
      );
      await projectCreator.setupRouter(target, template);

      const main = await read(target, `src/main.${ext}`);
      expect(main).toContain(
        `import { RouterProvider } from '${setup.providerModule}';\n` +
          `import { router } from './router.${ext}';`
      );
      expect(main).not.toMatch(/import App\b/);
      expect(main).not.toMatch(/<App\s*\/>/);
      expect(main).toMatch(
        /<ConfigProvider classPrefix="bestax-" iconLibrary="mdi">\s*<RouterProvider router=\{router\} \/>\s*<\/ConfigProvider>/
      );
    });

    it('depends on its router, sets any Node floor it needs, and says so in the README', async () => {
      const target = await scaffold(directory);
      const before = await fs.readJson(path.join(target, 'package.json'));
      await projectCreator.setupIconLibrary(target, 'fontawesome', template);
      await projectCreator.setupRouter(target, template);

      const pkg = await fs.readJson(path.join(target, 'package.json'));
      expect(pkg.dependencies).toMatchObject(setup.dependencies);
      const names = Object.keys(pkg.dependencies);
      expect(names).toEqual([...names].sort());
      expect(pkg.engines.node).toBe(setup.nodeEngine ?? before.engines.node);

      const readme = await read(target, 'README.md');
      expect(readme.endsWith(setup.readme(ext))).toBe(true);
    });

    it(`leaves ${directory} itself alone`, async () => {
      const target = await scaffold(directory);
      const before = await read(target, `src/main.${ext}`);
      await projectCreator.setupRouter(target, directory);

      expect(await read(target, `src/main.${ext}`)).toBe(before);
      expect(fs.existsSync(path.join(target, `src/router.${ext}`))).toBe(false);
    });

    it('uses no helper prop in the files it adds, so a no-helpers flavor renders them as written', async () => {
      const target = await scaffold(directory);
      await projectCreator.setupRouter(target, template);
      const helpers = helperPropsOfUseBulmaClasses();
      for (const file of files.filter(f => !f.endsWith(`router.${ext}`))) {
        const source = await read(target, file);
        const used = helpers.filter(prop =>
          new RegExp(`\\s${prop}=`).test(source)
        );
        expect({ file, used }).toEqual({ file, used: [] });
      }
    });
  }
);

// A template asks for the library the way this CLI's own manifest does, and
// the scaffold writes the range that manifest resolves to in its place, so an
// app is floored at the release the CLI was built with rather than at a number
// in a template nobody moves. A scaffold that skipped the step would keep the
// protocol and fail to install instead of quietly taking an old floor (#1240).
describe.each(TEMPLATES)('%s template library range', template => {
  const require = createRequire(import.meta.url);
  const cliPkg = require('../../package.json') as {
    dependencies: Record<string, string>;
  };
  const bulmaUiPkg = require('../../../bulma-ui/package.json') as {
    version: string;
  };

  it('spells the library as the CLI does, and scaffolds the checkout release', async () => {
    const templatePkg = await fs.readJson(
      path.join(templatesDir, template, 'package.json')
    );
    expect(templatePkg.dependencies[LIBRARY]).toBe(
      cliPkg.dependencies[LIBRARY]
    );

    const target = await scaffold(template);
    await updatePackageJson(target, 'app', { [LIBRARY]: libraryRange() });

    const pkg = await fs.readJson(path.join(target, 'package.json'));
    expect(pkg.dependencies[LIBRARY]).toBe(`^${bulmaUiPkg.version}`);
    expect(JSON.stringify(pkg)).not.toContain('workspace:');
  });
});

describe('icon library versions', () => {
  // A 0.x caret holds the minor, so a pin newer than bestax-bulma's peer
  // range makes npm refuse the scaffold's install outright (ERESOLVE), and one
  // older than its newest arm leaves the app a minor behind for nothing.
  const require = createRequire(import.meta.url);
  const bulmaUiPkg = require('../../../bulma-ui/package.json') as {
    peerDependencies: Record<string, string>;
  };

  it.each(
    ICON_LIBRARIES.filter(lib => lib.packageName).map(lib => [
      lib.packageName!,
      lib.packageVersion!,
    ])
  )('pins %s within the newest arm of the library peer range', (pkg, pin) => {
    const range = bulmaUiPkg.peerDependencies[pkg];
    expect(range).toBeDefined();
    const newestArm = range
      .split('||')
      .map(arm => arm.trim())
      .sort((a, b) =>
        a
          .replace(/^\^/, '')
          .localeCompare(b.replace(/^\^/, ''), undefined, { numeric: true })
      )
      .pop()!;
    const [pinMajor, pinMinor] = pin.replace(/^\^/, '').split('.');
    const [armMajor, armMinor] = newestArm.replace(/^\^/, '').split('.');
    expect(pinMajor).toBe(armMajor);
    if (armMajor === '0') expect(pinMinor).toBe(armMinor);
  });
});
