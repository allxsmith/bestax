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
const {
  BULMA_FLAVORS,
  CSS_ORDER_COMMENT,
  ICON_LIBRARIES,
  NO_HELPERS_STARTER_CLASSES,
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
const HELPER_PROP = new RegExp(`\\s(?:${HELPER_PROPS.join('|')})=`);

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
    expect(' displayTablet="flex"').toMatch(HELPER_PROP);
    expect(' color="info"').not.toMatch(HELPER_PROP);
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

        expect(app).not.toMatch(HELPER_PROP);
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
        expect(app).not.toMatch(HELPER_PROP);
      }
    );

    it('leaves the helper props alone in a flavor that has them', async () => {
      const target = await scaffold(template);
      await projectCreator.setupBulmaFlavor(target, 'complete', template);

      const app = await fs.readFile(
        path.join(target, 'src', appFile(template)),
        'utf8'
      );
      expect(app).toMatch(HELPER_PROP);
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
