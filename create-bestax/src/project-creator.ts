import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import fs from 'fs-extra';
import {
  checkDirectoryExists,
  listDirectoryEntries,
  findNonDirectoryInPath,
  realPath,
  emptyDirectory,
  ensureDirectory,
  copyDirectory,
  updatePackageJson,
} from './file-system.js';
import {
  promptProjectName,
  promptOverwriteDirectory,
  promptTemplate,
  promptLinter,
  promptIconLibrary,
  promptBulmaFlavor,
  promptInstallSkills,
  promptImmediate,
  promptTelemetryConsent,
} from './prompts.js';
import { reportScaffold, type ScaffoldChoices } from './telemetry.js';
import {
  displayHeader,
  displaySuccess,
  displayError,
  displayCancelled,
  quoteShellArgument,
} from './display.js';
import {
  validateProjectDirectory,
  toValidPackageName,
  isCurrentDirectory,
} from './validators.js';
import { runCommand } from './run-command.js';
import {
  MESSAGES,
  TEMPLATES,
  ICON_LIBRARIES,
  BULMA_FLAVORS,
  LINTERS,
  ESLINT_CONFIG,
  ESLINT_DEV_DEPENDENCIES,
  ESLINT_TYPESCRIPT_DEV_DEPENDENCIES,
  REACT_COMPILER_DEV_DEPENDENCIES,
  REACT_COMPILER_TYPESCRIPT_DEV_DEPENDENCIES,
  REACT_COMPILER_README,
  REACT_ROUTER_DEPENDENCIES,
  REACT_ROUTER_NODE_ENGINE,
  REACT_ROUTER_README,
  CLAUDE_MD,
  LAUNCH_JSON,
  CONFIG_PROVIDER_ICON_VALUES,
  NO_HELPERS_STARTER_CLASSES,
  NO_HELPERS_APP_CSS,
  CSS_ORDER_COMMENT,
  type ClaudeMdOptions,
} from './constants.js';
import { detectPackageManager } from './package-manager.js';
import { LIBRARY, libraryRange } from './library-range.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// npm strips literal `.gitignore` files from published tarballs, so the
// templates track `_gitignore` instead and the scaffolder renames it back
// on copy — otherwise published scaffolds would ship with no .gitignore.
// The Oxlint config follows create-vite, which names it the same way.
const TEMPLATE_RENAMES: Record<string, string> = {
  _gitignore: '.gitignore',
  '_oxlintrc.json': '.oxlintrc.json',
};

export interface ProjectConfig {
  projectName: string;
  template: string;
  targetPath: string;
  iconLibrary?: string;
  bulmaFlavor?: string;
}

export interface CLIOptions {
  template?: string;
  lint?: string;
  bulma?: string;
  icon?: string;
  skills?: boolean;
  telemetry?: boolean;
  yes?: boolean;
  overwrite?: boolean;
  immediate?: boolean;
}

/**
 * What create() does with the target directory once every prompt is answered:
 * write into it as is ('empty'), remove what it holds first ('overwrite'), or
 * nothing at all ('stop', with the reason already shown).
 */
export type ExistingDirectoryPlan = 'empty' | 'overwrite' | 'stop';

/**
 * runCommand, with a command that couldn't start at all, such as a package
 * manager missing from PATH, reported and ending the run with 1 rather than
 * escaping create() as an unhandled rejection. The project is written either
 * way.
 */
function runOrExit(command: string, cwd: string): number {
  try {
    return runCommand(command, cwd);
  } catch (error) {
    displayError((error as Error).message);
    process.exit(1);
  }
}

/** A dependency map in code-point order, the order the templates keep. */
function sortedByName(
  dependencies: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(dependencies).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0
    )
  );
}

export class ProjectCreator {
  private templatesDir: string;

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.resolve(__dirname, '../templates');
  }

  /**
   * The project directory, as typed or answered: a name or a path, absolute
   * or relative, whose last segment must be a valid project name (#1154).
   */
  async getProjectName(projectDir?: string): Promise<string | null> {
    if (projectDir) {
      const validation = validateProjectDirectory(projectDir);
      if (validation !== true) {
        console.log(chalk.red(`✖ ${validation}`));
        return null;
      }
      return projectDir;
    }

    return promptProjectName();
  }

  /**
   * Decides what happens to an existing target directory without touching it:
   * create() empties it only after the last prompt, so a Ctrl+C at any later
   * question leaves the user's files where they were (#945). Only --overwrite
   * or a yes at the prompt removes files. -y never does, and neither -y nor a
   * missing terminal can ask, so both stop at a non-empty directory instead.
   * Whatever the flags say, the run stops at a file on the target path or in
   * place of one of its parents, and before emptying the working directory or
   * one that holds it (#310), however the path spells it. create() calls this
   * straight after the project name, so neither waits for the other prompts.
   */
  async checkExistingDirectory(
    targetPath: string,
    targetDir: string,
    options?: CLIOptions
  ): Promise<ExistingDirectoryPlan> {
    const blocker = await findNonDirectoryInPath(targetPath);
    if (blocker !== null) {
      displayError(
        MESSAGES.NOT_A_DIRECTORY(
          blocker === path.resolve(targetPath) ? targetDir : blocker
        )
      );
      return 'stop';
    }

    // A directory holding only .git counts as empty, as create-vite counts
    // it, so `git init` then `create bestax .` works. The scaffold is written
    // beside .git, which nothing here ever removes.
    const entries = await listDirectoryEntries(targetPath);
    if (
      entries.length === 0 ||
      (entries.length === 1 && entries[0] === '.git')
    ) {
      return 'empty';
    }

    if (await this.holdsWorkingDirectory(targetPath)) {
      displayError(
        isCurrentDirectory(targetDir)
          ? MESSAGES.CURRENT_DIRECTORY_NOT_EMPTY(entries)
          : MESSAGES.DIRECTORY_HOLDS_CWD(targetDir)
      );
      return 'stop';
    }

    if (options?.overwrite) {
      return 'overwrite';
    }

    if (options?.yes || !process.stdin.isTTY) {
      displayError(MESSAGES.DIRECTORY_NOT_EMPTY_REFUSED(targetDir, entries));
      return 'stop';
    }

    if (!(await promptOverwriteDirectory(targetDir, entries))) {
      displayCancelled();
      return 'stop';
    }
    return 'overwrite';
  }

  /**
   * Whether targetPath is the working directory or one of its ancestors, with
   * symbolic links resolved on both sides. Emptying either deletes the folder
   * the user is standing in, which the leading-dot rule refuses for "." and
   * "..", and a path such as "../<its name>" or its absolute spelling reaches
   * the same folder (#310, #1154).
   */
  private async holdsWorkingDirectory(targetPath: string): Promise<boolean> {
    const relative = path.relative(
      await realPath(targetPath),
      await realPath(process.cwd())
    );
    return (
      relative === '' ||
      (!path.isAbsolute(relative) &&
        relative !== '..' &&
        !relative.startsWith(`..${path.sep}`))
    );
  }

  /**
   * Every flag's value is checked here, before any prompt runs or anything on
   * disk changes, so a typo can never cost the user an emptied directory (#945).
   */
  validateOptions(options?: CLIOptions): string | null {
    const validTemplates = TEMPLATES.map(t => t.name);
    if (options?.template && !validTemplates.includes(options.template)) {
      return `Invalid template: ${options.template}. Valid options are: ${validTemplates.join(', ')}`;
    }

    const validLinters = LINTERS.map(l => l.name);
    if (options?.lint && !validLinters.includes(options.lint)) {
      return `Invalid linter: ${options.lint}. Valid options are: ${validLinters.join(', ')}`;
    }

    const validFlavors = BULMA_FLAVORS.map(f => f.name);
    if (options?.bulma && !validFlavors.includes(options.bulma)) {
      return `Invalid Bulma flavor: ${options.bulma}. Valid options are: ${validFlavors.join(', ')}`;
    }

    const validLibraries = ICON_LIBRARIES.map(lib => lib.name);
    if (options?.icon && !validLibraries.includes(options.icon)) {
      return `Invalid icon library: ${options.icon}. Valid options are: ${validLibraries.join(', ')}`;
    }

    return null;
  }

  getTemplatePath(template: string): string {
    const directory =
      TEMPLATES.find(t => t.name === template)?.directory ?? template;
    return path.join(this.templatesDir, directory);
  }

  async copyTemplate(template: string, targetPath: string): Promise<void> {
    const templatePath = this.getTemplatePath(template);
    await ensureDirectory(targetPath);
    await copyDirectory(templatePath, targetPath, TEMPLATE_RENAMES);
  }

  async updateIndexHtmlTitle(
    targetPath: string,
    projectName: string
  ): Promise<void> {
    const indexHtmlPath = path.join(targetPath, 'index.html');
    if (!fs.existsSync(indexHtmlPath)) return;

    const htmlContent = await fs.readFile(indexHtmlPath, 'utf8');
    // projectName is validated against PROJECT_NAME_REGEX (letters, digits,
    // dots, dashes, underscores only), so it needs no HTML escaping.
    const updated = htmlContent.replace(
      /<title>[^<]*<\/title>/,
      `<title>${projectName}</title>`
    );
    if (updated !== htmlContent) {
      await fs.writeFile(indexHtmlPath, updated);
    }
  }

  /**
   * The template README is written with pnpm commands and lists no icon
   * library. Rewrite the commands for the package manager that ran the CLI
   * (the one the success message names too) and list the icon library the
   * user picked, if any.
   */
  async updateReadme(targetPath: string, iconLibrary: string): Promise<void> {
    const readmePath = path.join(targetPath, 'README.md');
    if (!fs.existsSync(readmePath)) return;

    const pm = detectPackageManager();
    let readme = await fs.readFile(readmePath, 'utf8');
    readme = readme.replace(/\bpnpm (install|run)\b/g, `${pm} $1`);

    const library = ICON_LIBRARIES.find(lib => lib.name === iconLibrary);
    if (library && iconLibrary !== 'none') {
      readme = readme.replace(
        /^(- .*bestax-bulma component library)$/m,
        `$1\n- 🎯 ${library.display} icons`
      );
    }
    await fs.writeFile(readmePath, readme);
  }

  /**
   * The templates ship create-vite's default lint setup, Oxlint. For ESLint,
   * write what create-vite's `--eslint` writes in its place: the config, the
   * packages and the lint script, and for TypeScript, TypeScript 6, since
   * typescript-eslint can't load TypeScript 7 (#394).
   */
  async setupLinter(
    targetPath: string,
    linter: string,
    template: string
  ): Promise<void> {
    if (linter !== 'eslint') return;
    const isTypeScript = template.includes('-ts');

    await fs.remove(path.join(targetPath, '.oxlintrc.json'));
    await fs.writeFile(
      path.join(targetPath, 'eslint.config.js'),
      ESLINT_CONFIG(isTypeScript)
    );

    const packageJsonPath = path.join(targetPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      const devDependencies: Record<string, string> = {
        ...packageJson.devDependencies,
        ...ESLINT_DEV_DEPENDENCIES,
        ...(isTypeScript ? ESLINT_TYPESCRIPT_DEV_DEPENDENCIES : {}),
      };
      delete devDependencies.oxlint;
      packageJson.devDependencies = sortedByName(devDependencies);
      packageJson.scripts = { ...packageJson.scripts, lint: 'eslint .' };
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }

    const readmePath = path.join(targetPath, 'README.md');
    if (fs.existsSync(readmePath)) {
      const readme = await fs.readFile(readmePath, 'utf8');
      await fs.writeFile(readmePath, readme.replace(/\bOxlint\b/g, 'ESLint'));
    }
  }

  /**
   * A React Compiler template is its plain template with the compiler turned
   * on, the way create-vite builds its react-compiler starters: the Babel
   * packages, the compiler preset in vite.config, and a README section.
   */
  async setupReactCompiler(
    targetPath: string,
    template: string
  ): Promise<void> {
    if (!TEMPLATES.find(t => t.name === template)?.reactCompiler) return;
    const isTypeScript = template.includes('-ts');

    const packageJsonPath = path.join(targetPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.devDependencies = sortedByName({
        ...packageJson.devDependencies,
        ...REACT_COMPILER_DEV_DEPENDENCIES,
        ...(isTypeScript ? REACT_COMPILER_TYPESCRIPT_DEV_DEPENDENCIES : {}),
      });
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }

    const configFileName = isTypeScript ? 'vite.config.ts' : 'vite.config.js';
    const configPath = path.join(targetPath, configFileName);
    if (fs.existsSync(configPath)) {
      const config = await fs.readFile(configPath, 'utf8');
      const pluginImport =
        /^import react from ['"]@vitejs\/plugin-react['"];?$/m;
      const plugins = /^([ \t]*)plugins: \[react\(\)\],$/m;
      if (pluginImport.test(config) && plugins.test(config)) {
        await fs.writeFile(
          configPath,
          config
            .replace(
              pluginImport,
              "import react, { reactCompilerPreset } from '@vitejs/plugin-react';\n" +
                "import babel from '@rolldown/plugin-babel';"
            )
            .replace(
              plugins,
              '$1plugins: [react(), babel({ presets: [reactCompilerPreset()] })],'
            )
        );
      } else {
        console.log(
          chalk.yellow(MESSAGES.REACT_COMPILER_NOT_ADDED(configFileName))
        );
      }
    }

    const readmePath = path.join(targetPath, 'README.md');
    if (fs.existsSync(readmePath)) {
      const readme = await fs.readFile(readmePath, 'utf8');
      await fs.writeFile(
        readmePath,
        readme.replace(/\n*$/, '\n') + REACT_COMPILER_README
      );
    }
  }

  /**
   * --immediate: install with the package manager that ran the CLI, then run
   * the dev server in the foreground until it's stopped, as create-vite does.
   * A failed install ends the run with its exit code, and so does the server.
   * Its message names the cd into the project, since the next steps that
   * would have named it weren't printed.
   */
  installAndStart(targetPath: string, targetDir: string, pm: string): void {
    console.log(chalk.green(MESSAGES.INSTALLING(pm)));
    const installed = runOrExit(`${pm} install`, targetPath);
    if (installed !== 0) {
      const cd = isCurrentDirectory(targetDir)
        ? ''
        : `cd ${quoteShellArgument(targetDir)}, then `;
      displayError(MESSAGES.INSTALL_FAILED(pm, cd));
      process.exit(installed);
    }
    console.log(chalk.green(MESSAGES.STARTING_DEV_SERVER));
    process.exitCode = runOrExit(`${pm} run dev`, targetPath);
  }

  /**
   * A React Router template is its plain template with the router's files
   * copied over it from templates/overlays/react-router: a navbar layout, a
   * second page and the routes, with App, the starter page, as the home page.
   * The entry file then renders the router where it rendered App, inside any
   * ConfigProvider the earlier steps wrapped App in, so a prefix or an icon
   * library reaches every page. It runs after those steps, which edit the
   * entry file and App as they do in the plain template.
   */
  async setupRouter(targetPath: string, template: string): Promise<void> {
    const entry = TEMPLATES.find(t => t.name === template);
    if (!entry?.router) return;
    const ext = template.includes('-ts') ? 'tsx' : 'jsx';

    await fs.copy(
      path.join(this.templatesDir, 'overlays', 'react-router', entry.directory),
      targetPath
    );

    const packageJsonPath = path.join(targetPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.dependencies = sortedByName({
        ...packageJson.dependencies,
        ...REACT_ROUTER_DEPENDENCIES,
      });
      packageJson.engines = {
        ...packageJson.engines,
        node: REACT_ROUTER_NODE_ENGINE,
      };
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }

    const mainFileName = `main.${ext}`;
    const mainPath = path.join(targetPath, 'src', mainFileName);
    if (fs.existsSync(mainPath)) {
      const main = await fs.readFile(mainPath, 'utf8');
      const appImport = new RegExp(
        `^import App from ['"]\\./App\\.${ext}['"];?$`,
        'm'
      );
      const appElement = /<App\s*\/>/;
      if (appImport.test(main) && appElement.test(main)) {
        await fs.writeFile(
          mainPath,
          main
            .replace(
              appImport,
              "import { RouterProvider } from 'react-router';\n" +
                `import { router } from './router.${ext}';`
            )
            .replace(appElement, '<RouterProvider router={router} />')
        );
      } else {
        console.log(
          chalk.yellow(MESSAGES.REACT_ROUTER_NOT_ADDED(`src/${mainFileName}`))
        );
      }
    }

    const readmePath = path.join(targetPath, 'README.md');
    if (fs.existsSync(readmePath)) {
      const readme = await fs.readFile(readmePath, 'utf8');
      await fs.writeFile(
        readmePath,
        readme.replace(/\n*$/, '\n') + REACT_ROUTER_README(ext)
      );
    }
  }

  async setupSkills(
    targetPath: string,
    projectName: string,
    options: ClaudeMdOptions
  ): Promise<void> {
    const skillsSrc = path.join(this.templatesDir, 'skills');
    if (!(await checkDirectoryExists(skillsSrc))) {
      console.log(
        chalk.yellow('  Skipping skills — bundle not found in this build.')
      );
      return;
    }

    await fs.copy(skillsSrc, path.join(targetPath, '.claude', 'skills'));
    await fs.writeFile(
      path.join(targetPath, '.claude', 'launch.json'),
      LAUNCH_JSON
    );
    await fs.writeFile(
      path.join(targetPath, 'CLAUDE.md'),
      CLAUDE_MD(projectName, options)
    );
    console.log(chalk.green(MESSAGES.SKILLS_ADDED));
  }

  async setupBulmaFlavor(
    targetPath: string,
    bulmaFlavor: string,
    template: string
  ): Promise<void> {
    const flavor = BULMA_FLAVORS.find(f => f.name === bulmaFlavor);
    if (!flavor) {
      console.log(
        `Warning: Bulma flavor '${bulmaFlavor}' not found in BULMA_FLAVORS`
      );
      return;
    }

    const isTypeScript = template.includes('-ts');
    const mainFileName = isTypeScript ? 'main.tsx' : 'main.jsx';
    const mainFilePath = path.join(targetPath, 'src', mainFileName);

    if (fs.existsSync(mainFilePath)) {
      let content = await fs.readFile(mainFilePath, 'utf8');

      // Replace the default bestax CSS import, and the comment block directly
      // above it, with the selected flavor's import under the comment that
      // says why the stylesheets load before the app's own CSS.
      const bestaxImportRegex =
        /(?:[ \t]*\/\/[^\n]*\n)+[ \t]*import\s+['"]@allxsmith\/bestax-bulma\/bestax\.css['"]\s*;?/;
      const bestaxImportSimpleRegex =
        /import\s+['"]@allxsmith\/bestax-bulma\/bestax\.css['"]\s*;?/;
      if (bestaxImportRegex.test(content)) {
        content = content.replace(
          bestaxImportRegex,
          CSS_ORDER_COMMENT + '\n' + flavor.importStatement
        );
      } else if (bestaxImportSimpleRegex.test(content)) {
        content = content.replace(
          bestaxImportSimpleRegex,
          flavor.importStatement
        );
      } else {
        // If no bestax import found, add it after React import
        const reactImportMatch = content.match(
          /import\s+.*\s+from\s+['"]react['"]/
        );
        if (reactImportMatch) {
          const insertPosition =
            reactImportMatch.index! + reactImportMatch[0].length;
          content =
            content.slice(0, insertPosition) +
            '\n' +
            flavor.importStatement +
            content.slice(insertPosition);
        }
      }

      await fs.writeFile(mainFilePath, content);
    }

    if (flavor.noHelpers) {
      await this.replaceStarterHelperProps(targetPath, template);
    }
  }

  /**
   * A flavor without Bulma's helper classes leaves the starter's helper props
   * rendering nothing, so its title loses its centering and its cards their
   * equal heights. Swap each prop for the named class in
   * NO_HELPERS_STARTER_CLASSES and append the classes' rules to src/App.css.
   */
  async replaceStarterHelperProps(
    targetPath: string,
    template: string
  ): Promise<void> {
    const appFileName = template.includes('-ts') ? 'App.tsx' : 'App.jsx';
    const appFilePath = path.join(targetPath, 'src', appFileName);
    const appCssPath = path.join(targetPath, 'src', 'App.css');
    if (!fs.existsSync(appFilePath) || !fs.existsSync(appCssPath)) return;

    let appContent = await fs.readFile(appFilePath, 'utf8');
    for (const { prop, className } of NO_HELPERS_STARTER_CLASSES) {
      appContent = appContent.split(prop).join(`className="${className}"`);
    }
    await fs.writeFile(appFilePath, appContent);

    const css = await fs.readFile(appCssPath, 'utf8');
    await fs.writeFile(
      appCssPath,
      css.replace(/\n*$/, '\n') + NO_HELPERS_APP_CSS
    );
  }

  private getIconName(
    iconLibrary: string,
    iconType: 'rocket' | 'book' | 'code'
  ): string {
    const iconMappings: Record<string, Record<string, string>> = {
      fontawesome: { rocket: 'rocket', book: 'book', code: 'code' },
      mdi: {
        rocket: 'rocket-launch',
        book: 'book-open-page-variant',
        code: 'code-tags',
      },
      ionicons: { rocket: 'rocket', book: 'book', code: 'code-slash' },
      'material-icons': {
        rocket: 'rocket_launch',
        book: 'menu_book',
        code: 'code',
      },
      'material-symbols': {
        rocket: 'rocket_launch',
        book: 'menu_book',
        code: 'code',
      },
    };

    return iconMappings[iconLibrary]?.[iconType] || '';
  }

  /**
   * The `iconProps` entries for a starter card icon. Decorative, since the
   * card title beside it says the same thing, so it is hidden from screen
   * readers rather than announced as "icon".
   */
  private getIconProps(
    iconLibrary: string,
    iconType: 'rocket' | 'book' | 'code'
  ): string[] {
    const iconName = this.getIconName(iconLibrary, iconType);
    if (!iconName) return [];

    return [
      `name: '${iconName}'`,
      ...(iconLibrary === 'fontawesome' ? [`variant: 'solid'`] : []),
      `'aria-hidden': 'true'`,
    ];
  }

  async setupIconLibrary(
    targetPath: string,
    iconLibrary: string,
    template: string
  ): Promise<void> {
    if (iconLibrary === 'none') return;

    const library = ICON_LIBRARIES.find(lib => lib.name === iconLibrary);
    if (!library) return;

    // Special handling for ionicons - add to index.html instead of package.json
    if (iconLibrary === 'ionicons') {
      const indexHtmlPath = path.join(targetPath, 'index.html');
      if (fs.existsSync(indexHtmlPath)) {
        let htmlContent = await fs.readFile(indexHtmlPath, 'utf8');
        // Add ionicons scripts before the closing </head> tag
        const headEndMatch = htmlContent.match(/<\/head>/);
        if (headEndMatch) {
          const insertPosition = headEndMatch.index!;
          // The ionicons version is pinned to an immutable unpkg URL. SRI
          // integrity attributes are deliberately not added: the ionicons ESM
          // loader dynamically imports per-icon chunks that cannot carry
          // integrity hashes, so entry-file SRI would give false assurance.
          const ioniconScripts = `    <!-- Ionicons (v8 is ESM-only; no legacy nomodule fallback exists) -->
    <script type="module" src="https://unpkg.com/ionicons@8.0.13/dist/ionicons/ionicons.esm.js"></script>
  `;
          htmlContent =
            htmlContent.slice(0, insertPosition) +
            ioniconScripts +
            htmlContent.slice(insertPosition);
          await fs.writeFile(indexHtmlPath, htmlContent);
        }
      }
    } else if (!library.packageName) {
      return;
    }

    // For non-ionicons libraries, add the package to package.json dependencies
    if (iconLibrary !== 'ionicons') {
      const packageJsonPath = path.join(targetPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        if (!packageJson.dependencies) {
          packageJson.dependencies = {};
        }
        if (library.packageName) {
          packageJson.dependencies[library.packageName] =
            library.packageVersion ?? 'latest';
        }
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

        // Add import statement to main file
        if (library.importStatement) {
          const isTypeScript = template.includes('-ts');
          const mainFileName = isTypeScript ? 'main.tsx' : 'main.jsx';
          const mainFilePath = path.join(targetPath, 'src', mainFileName);

          if (fs.existsSync(mainFilePath)) {
            let content = await fs.readFile(mainFilePath, 'utf8');
            // Add the icon library import after the bestax stylesheet import,
            // whichever one the flavor wrote: bestax.css for complete, a
            // versions/bestax-*.css file for every other flavor (#946).
            const cssImportMatch = content.match(
              /import\s+['"](?:@allxsmith\/bestax-bulma\/[^'"]+\.css|bulma\/css\/.*?)['"]\s*;?/
            );
            if (cssImportMatch) {
              const insertPosition =
                cssImportMatch.index! + cssImportMatch[0].length;
              content =
                content.slice(0, insertPosition) +
                '\n' +
                library.importStatement +
                content.slice(insertPosition);
              await fs.writeFile(mainFilePath, content);
            } else {
              // Without its stylesheet every icon renders blank or as its
              // name, so say so rather than finish as if it worked (#946).
              console.log(
                chalk.yellow(
                  MESSAGES.ICON_CSS_NOT_ADDED(
                    `src/${mainFileName}`,
                    library.importStatement
                  )
                )
              );
            }
          }
        }
      }
    }

    // Now add an icon to each card title in App.jsx/App.tsx (for all icon
    // libraries). IconText spaces the icon from its text with Bulma's own
    // .icon-text rule rather than a margin helper, so the gap holds in the
    // no-helpers flavors too.
    const isTypeScript = template.includes('-ts');
    const appFileName = isTypeScript ? 'App.tsx' : 'App.jsx';
    const appFilePath = path.join(targetPath, 'src', appFileName);

    if (fs.existsSync(appFilePath)) {
      let appContent = await fs.readFile(appFilePath, 'utf8');

      // Add IconText to the bestax-bulma imports
      const bulmaImportRegex =
        /(import\s+\{[\s\S]*?)(}\s+from\s+['"]@allxsmith\/bestax-bulma['"])/;
      if (
        bulmaImportRegex.test(appContent) &&
        !/\bIconText\b/.test(appContent)
      ) {
        const importMatch = appContent.match(bulmaImportRegex);
        if (importMatch) {
          const beforeClosingBrace = importMatch[1];
          // Remove any trailing comma and whitespace, then add IconText properly
          const cleanedImport = beforeClosingBrace.replace(/,?\s*$/, '');
          appContent = appContent.replace(
            bulmaImportRegex,
            cleanedImport + ',\n  IconText,\n$2'
          );
        }
      }

      const cardIcons: Array<['rocket' | 'book' | 'code', string]> = [
        ['rocket', 'Quick Start'],
        ['book', 'Documentation'],
        ['code', 'Examples'],
      ];
      for (const [iconType, title] of cardIcons) {
        const iconProps = this.getIconProps(iconLibrary, iconType);
        if (iconProps.length === 0) continue;
        const titleRegex = new RegExp(
          `^([ \\t]*)(<Card\\.Header\\.Title[^>]*>)\\s*${title}\\s*(</Card\\.Header\\.Title>)`,
          'm'
        );
        appContent = appContent.replace(
          titleRegex,
          (_match, indent: string, open: string, close: string) =>
            [
              `${indent}${open}`,
              `${indent}  <IconText`,
              `${indent}    iconProps={{`,
              ...iconProps.map(entry => `${indent}      ${entry},`),
              `${indent}    }}`,
              `${indent}  >`,
              `${indent}    ${title}`,
              `${indent}  </IconText>`,
              `${indent}${close}`,
            ].join('\n')
        );
      }

      await fs.writeFile(appFilePath, appContent);
    }
  }

  async setupConfigProvider(
    targetPath: string,
    bulmaFlavor: string,
    iconLibrary: string,
    template: string
  ): Promise<void> {
    const flavor = BULMA_FLAVORS.find(f => f.name === bulmaFlavor);
    const needsPrefix = flavor?.needsPrefix || false;
    // Don't add ConfigProvider for 'none' or 'fontawesome' (default)
    const needsIconLibrary =
      iconLibrary !== 'none' && iconLibrary !== 'fontawesome';

    // Only add ConfigProvider if we need prefix or non-default icon library
    if (!needsPrefix && !needsIconLibrary) return;

    const isTypeScript = template.includes('-ts');
    const mainFileName = isTypeScript ? 'main.tsx' : 'main.jsx';
    const mainFilePath = path.join(targetPath, 'src', mainFileName);

    if (fs.existsSync(mainFilePath)) {
      let content = await fs.readFile(mainFilePath, 'utf8');

      // Add ConfigProvider import from bestax-bulma
      const configProviderImport =
        "import { ConfigProvider } from '@allxsmith/bestax-bulma';";

      // Check if ConfigProvider is already imported
      if (!content.includes('ConfigProvider')) {
        // Add import after the App import line
        const appImportMatch = content.match(
          /import\s+App\s+from\s+['"]\.\/App\.(jsx|tsx)?['"]\s*;?/
        );
        if (appImportMatch) {
          const insertPosition =
            appImportMatch.index! + appImportMatch[0].length;
          content =
            content.slice(0, insertPosition) +
            '\n' +
            configProviderImport +
            content.slice(insertPosition);
        }
      }

      // Build ConfigProvider props
      const configProps: string[] = [];
      if (needsPrefix) {
        configProps.push('classPrefix="bestax-"');
      }
      if (needsIconLibrary) {
        // Shared with the CLAUDE_MD template so the generated docs always
        // name the same provider value the scaffolder writes here.
        const iconLibraryValue = CONFIG_PROVIDER_ICON_VALUES[iconLibrary];
        if (iconLibraryValue) {
          configProps.push(`iconLibrary="${iconLibraryValue}"`);
        }
      }

      // Wrap <App /> with ConfigProvider in the render call
      const appRegex = /<App\s*\/>/;
      if (appRegex.test(content)) {
        const propsString =
          configProps.length > 0 ? ' ' + configProps.join(' ') : '';
        content = content.replace(
          appRegex,
          `<ConfigProvider${propsString}>\n      <App />\n    </ConfigProvider>`
        );
      }

      await fs.writeFile(mainFilePath, content);
    }
  }

  async create(projectDir?: string, options?: CLIOptions): Promise<void> {
    displayHeader();

    const optionsError = this.validateOptions(options);
    if (optionsError) {
      displayError(optionsError);
      process.exit(1);
    }

    // Get project name
    const targetDir = await this.getProjectName(projectDir);
    if (!targetDir) {
      displayCancelled();
      process.exit(1);
      return; // TypeScript flow control
    }

    // An absolute path is used as it is and a relative one from the working
    // directory. Its last segment names the package and the page title, and
    // copyTemplate creates it and any missing parent after the last prompt.
    const targetPath = path.resolve(process.cwd(), targetDir);
    const projectName = path.basename(targetPath);

    // Decide about an existing directory now, but empty it only after the
    // last prompt below (#945).
    const directoryPlan = await this.checkExistingDirectory(
      targetPath,
      targetDir,
      options
    );
    if (directoryPlan === 'stop') {
      process.exit(1);
    }

    // Select template (use option or prompt)
    let template: string | null;
    if (options?.template) {
      template = options.template;
    } else if (options?.yes) {
      template = 'vite'; // default template
    } else {
      template = await promptTemplate();
      if (!template) {
        displayCancelled();
        process.exit(1);
      }
    }

    // Select linter (use option or prompt). The question is newer than the
    // others, so a run without a terminal that answers every other one by
    // flag takes the default here rather than stopping, as it did before the
    // question existed (#192).
    let linter: string | null;
    if (options?.lint) {
      linter = options.lint;
    } else if (options?.yes || !process.stdin.isTTY) {
      linter = 'oxlint'; // default linter
    } else {
      linter = await promptLinter();
      if (linter === null) {
        displayCancelled();
        process.exit(1);
      }
    }

    // Select Bulma flavor (use option or prompt)
    let bulmaFlavor: string | null;
    if (options?.bulma) {
      bulmaFlavor = options.bulma;
    } else if (options?.yes) {
      bulmaFlavor = 'complete'; // default flavor
    } else {
      bulmaFlavor = await promptBulmaFlavor();
      if (bulmaFlavor === null) {
        displayCancelled();
        process.exit(1);
      }
    }

    // Select icon library (use option or prompt)
    let iconLibrary: string | null;
    if (options?.icon) {
      iconLibrary = options.icon;
    } else if (options?.yes) {
      iconLibrary = 'none'; // default icon library
    } else {
      iconLibrary = await promptIconLibrary();
      if (iconLibrary === null) {
        displayCancelled();
        process.exit(1);
      }
    }

    // Install AI skills? (use option -> --yes default -> prompt)
    let installSkills: boolean | null;
    if (options?.skills !== undefined) {
      installSkills = options.skills;
    } else if (options?.yes) {
      installSkills = true;
    } else {
      installSkills = await promptInstallSkills();
      if (installSkills === null) {
        displayCancelled();
        process.exit(1);
      }
    }

    // Install and start now? (use option -> no under -y or without a
    // terminal, so a scripted run never starts a server it can't stop -> prompt)
    const pm = detectPackageManager();
    let immediate: boolean | null;
    if (options?.immediate !== undefined) {
      immediate = options.immediate;
    } else if (options?.yes || !process.stdin.isTTY) {
      immediate = false;
    } else {
      immediate = await promptImmediate(pm);
      if (immediate === null) {
        displayCancelled();
        process.exit(1);
      }
    }

    try {
      // Read before the directory is emptied, so a failed read costs nothing.
      const libraryDependency = { [LIBRARY]: libraryRange() };

      if (directoryPlan === 'overwrite') {
        console.log(chalk.yellow(MESSAGES.EMPTYING_DIRECTORY(targetDir)));
        await emptyDirectory(targetPath);
      }

      // Create project
      console.log();
      console.log(chalk.green(MESSAGES.CREATING_PROJECT(targetPath)));
      const packageName = toValidPackageName(projectName);
      if (packageName !== projectName) {
        console.log(chalk.dim(MESSAGES.PACKAGE_NAME_NORMALIZED(packageName)));
      }

      await this.copyTemplate(template, targetPath);
      await updatePackageJson(targetPath, packageName, libraryDependency);
      await this.updateIndexHtmlTitle(targetPath, projectName);
      await this.updateReadme(targetPath, iconLibrary);
      await this.setupBulmaFlavor(targetPath, bulmaFlavor, template);
      await this.setupIconLibrary(targetPath, iconLibrary, template);
      await this.setupConfigProvider(
        targetPath,
        bulmaFlavor,
        iconLibrary,
        template
      );
      await this.setupLinter(targetPath, linter, template);
      await this.setupReactCompiler(targetPath, template);
      await this.setupRouter(targetPath, template);
      if (installSkills) {
        await this.setupSkills(targetPath, projectName, {
          bulmaFlavor,
          iconLibrary,
          router: TEMPLATES.find(t => t.name === template)?.router === true,
        });
      }
      displaySuccess(targetDir, immediate);
      await this.handleTelemetry(options, {
        template,
        bulmaFlavor,
        iconLibrary,
        skills: installSkills,
      });
    } catch (error) {
      displayError((error as Error).message);
      process.exit(1);
    }

    // Last, since the dev server holds the terminal until it's stopped.
    if (immediate) {
      this.installAndStart(targetPath, targetDir, pm);
    }
  }

  /**
   * Consent + beacon after a successful scaffold. Only success events are
   * reported, the beacon is awaited (so no process.exit(1) site can kill an
   * in-flight request), and nothing in here may throw or fail the scaffold.
   * The prompt is skipped for -y, an explicit flag, DO_NOT_TRACK, or a
   * missing TTY on EITHER end — with stdout redirected the question would
   * render into the log while the CLI blocked on an invisible prompt
   * (#192: the non-interactive path must never hang).
   */
  private async handleTelemetry(
    options: CLIOptions | undefined,
    choices: ScaffoldChoices
  ): Promise<void> {
    try {
      await reportScaffold(choices, options?.telemetry, {
        interactive:
          process.stdin.isTTY === true &&
          process.stdout.isTTY === true &&
          options?.yes !== true,
        promptConsent: promptTelemetryConsent,
        onDecided: (enabled, persisted) => {
          // Worded on whether the write actually stuck: promising "we won't
          // ask again" after a swallowed write failure would be false.
          if (!persisted) {
            console.log(chalk.dim(MESSAGES.TELEMETRY_ACK_UNSAVED));
          } else if (enabled) {
            console.log(chalk.dim(MESSAGES.TELEMETRY_ACK_ON));
          } else {
            console.log(chalk.dim(MESSAGES.TELEMETRY_ACK_OFF));
          }
        },
      });
    } catch {
      // Telemetry must never affect the scaffold's outcome.
    }
  }
}
