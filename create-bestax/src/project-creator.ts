import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import fs from 'fs-extra';
import {
  checkDirectoryExists,
  isDirectoryEmpty,
  emptyDirectory,
  ensureDirectory,
  copyDirectory,
  updatePackageJson,
} from './file-system.js';
import {
  promptProjectName,
  promptOverwriteDirectory,
  promptTemplate,
  promptIconLibrary,
  promptBulmaFlavor,
} from './prompts.js';
import {
  displayHeader,
  displaySuccess,
  displayError,
  displayCancelled,
} from './display.js';
import { validateProjectName } from './validators.js';
import { MESSAGES, ICON_LIBRARIES, BULMA_FLAVORS } from './constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface ProjectConfig {
  projectName: string;
  template: string;
  targetPath: string;
  iconLibrary?: string;
  bulmaFlavor?: string;
}

export interface CLIOptions {
  template?: string;
  bulma?: string;
  icon?: string;
  yes?: boolean;
}

export class ProjectCreator {
  private templatesDir: string;

  constructor(templatesDir?: string) {
    this.templatesDir =
      templatesDir || path.resolve(__dirname, '../../templates');
  }

  async getProjectName(projectDir?: string): Promise<string | null> {
    if (projectDir) {
      const validation = validateProjectName(projectDir);
      if (validation !== true) {
        console.log(chalk.red(`✖ ${validation}`));
        return null;
      }
      return projectDir;
    }

    return promptProjectName();
  }

  async checkExistingDirectory(
    targetPath: string,
    targetDir: string
  ): Promise<boolean> {
    const exists = await checkDirectoryExists(targetPath);
    const isEmpty = await isDirectoryEmpty(targetPath);

    if (exists && !isEmpty) {
      const shouldOverwrite = await promptOverwriteDirectory(targetDir);

      if (!shouldOverwrite) {
        return false;
      }

      console.log(chalk.yellow(`\n  Emptying ${targetDir}...`));
      await emptyDirectory(targetPath);
    }

    return true;
  }

  getTemplatePath(template: string): string {
    return path.join(this.templatesDir, template);
  }

  async copyTemplate(template: string, targetPath: string): Promise<void> {
    const templatePath = this.getTemplatePath(template);
    await ensureDirectory(targetPath);
    await copyDirectory(templatePath, targetPath);
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

      // Replace the default Bulma import with the selected flavor
      const bulmaImportRegex =
        /import\s+['"]bulma\/css\/bulma\.min\.css['"]\s*;?/;
      if (bulmaImportRegex.test(content)) {
        content = content.replace(bulmaImportRegex, flavor.importStatement);
      } else {
        // If no Bulma import found, add it after React import
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

  private getIconProps(
    iconLibrary: string,
    iconType: 'rocket' | 'book' | 'code'
  ): string {
    const iconName = this.getIconName(iconLibrary, iconType);
    if (!iconName) return '';

    return iconLibrary === 'fontawesome'
      ? `name="${iconName}" variant="solid"`
      : `name="${iconName}"`;
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
          const ioniconScripts = `    <!-- Ionicons -->
    <script type="module" src="https://unpkg.com/ionicons@8.0.13/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@8.0.13/dist/ionicons/ionicons.js"></script>
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
          packageJson.dependencies[library.packageName] = 'latest';
        }
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

        // Add import statement to main file
        if (library.importStatement) {
          const isTypeScript = template.includes('-ts');
          const mainFileName = isTypeScript ? 'main.tsx' : 'main.jsx';
          const mainFilePath = path.join(targetPath, 'src', mainFileName);

          if (fs.existsSync(mainFilePath)) {
            let content = await fs.readFile(mainFilePath, 'utf8');
            // Add the icon library import before the Bulma CSS import
            const bulmaImportMatch = content.match(
              /import\s+['"]bulma\/css\/.*?['"]/
            );
            if (bulmaImportMatch) {
              const insertPosition = bulmaImportMatch.index!;
              content =
                content.slice(0, insertPosition) +
                library.importStatement +
                '\n' +
                content.slice(insertPosition);
              await fs.writeFile(mainFilePath, content);
            }
          }
        }
      }
    }

    // Now add Icon components to App.jsx/App.tsx (for all icon libraries)
    const isTypeScript = template.includes('-ts');
    const appFileName = isTypeScript ? 'App.tsx' : 'App.jsx';
    const appFilePath = path.join(targetPath, 'src', appFileName);

    if (fs.existsSync(appFilePath)) {
      let appContent = await fs.readFile(appFilePath, 'utf8');

      // Add Icon import to the bestax-bulma imports
      const bulmaImportRegex =
        /(import\s+\{[\s\S]*?)(}\s+from\s+['"]@allxsmith\/bestax-bulma['"])/;
      if (bulmaImportRegex.test(appContent) && !appContent.includes('Icon')) {
        // Check if the import ends with a comma or not
        const importMatch = appContent.match(bulmaImportRegex);
        if (importMatch) {
          const beforeClosingBrace = importMatch[1];
          // Remove any trailing comma and whitespace, then add Icon properly
          const cleanedImport = beforeClosingBrace.replace(/,?\s*$/, '');
          appContent = appContent.replace(
            bulmaImportRegex,
            cleanedImport + ',\n  Icon$2'
          );
        }
      }

      // Add icon examples in the Cards section
      // Find the Quick Start Card and add an icon
      const quickStartRegex =
        /(Card\.Header\.Title>\s*Quick Start\s*<\/Card\.Header\.Title>)/;
      if (quickStartRegex.test(appContent)) {
        const iconProps = this.getIconProps(iconLibrary, 'rocket');
        if (iconProps) {
          appContent = appContent.replace(
            quickStartRegex,
            `Card.Header.Title>\n                          <Icon ${iconProps} size="small" mr="2" />\n                          Quick Start\n                        </Card.Header.Title>`
          );
        }
      }

      // Add icon to Documentation Card
      const docsRegex =
        /(Card\.Header\.Title>\s*Documentation\s*<\/Card\.Header\.Title>)/;
      if (docsRegex.test(appContent)) {
        const iconProps = this.getIconProps(iconLibrary, 'book');
        if (iconProps) {
          appContent = appContent.replace(
            docsRegex,
            `Card.Header.Title>\n                          <Icon ${iconProps} size="small" mr="2" />\n                          Documentation\n                        </Card.Header.Title>`
          );
        }
      }

      // Add icon to Examples Card
      const examplesRegex =
        /(Card\.Header\.Title>\s*Examples\s*<\/Card\.Header\.Title>)/;
      if (examplesRegex.test(appContent)) {
        const iconProps = this.getIconProps(iconLibrary, 'code');
        if (iconProps) {
          appContent = appContent.replace(
            examplesRegex,
            `Card.Header.Title>\n                          <Icon ${iconProps} size="small" mr="2" />\n                          Examples\n                        </Card.Header.Title>`
          );
        }
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
        configProps.push('classPrefix="bulma-"');
      }
      if (needsIconLibrary) {
        // Map the icon library name to the correct value for ConfigProvider
        const iconLibraryMap: Record<string, string> = {
          mdi: 'mdi',
          ionicons: 'ion',
          'material-icons': 'material-icons',
          'material-symbols': 'material-symbols',
        };
        const iconLibraryValue = iconLibraryMap[iconLibrary];
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

    // Get project name
    const targetDir = await this.getProjectName(projectDir);
    if (!targetDir) {
      displayCancelled();
      process.exit(1);
      return; // TypeScript flow control
    }

    const targetPath = path.resolve(process.cwd(), targetDir);
    const projectName = path.basename(targetPath);

    // Check existing directory (skip prompt if --yes is provided)
    const canContinue = options?.yes
      ? true
      : await this.checkExistingDirectory(targetPath, targetDir);
    if (!canContinue) {
      displayCancelled();
      process.exit(1);
    }

    // If --yes and directory exists, empty it
    if (
      options?.yes &&
      (await checkDirectoryExists(targetPath)) &&
      !(await isDirectoryEmpty(targetPath))
    ) {
      console.log(chalk.yellow(`\n  Emptying ${targetDir}...`));
      await emptyDirectory(targetPath);
    }

    // Select template (use option or prompt)
    let template: string | null;
    if (options?.template) {
      // Validate the provided template
      const validTemplates = ['vite', 'vite-ts'];
      if (!validTemplates.includes(options.template)) {
        displayError(
          `Invalid template: ${options.template}. Valid options are: ${validTemplates.join(', ')}`
        );
        process.exit(1);
      }
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

    // Select Bulma flavor (use option or prompt)
    let bulmaFlavor: string | null;
    if (options?.bulma) {
      // Validate the provided Bulma flavor
      const validFlavors = BULMA_FLAVORS.map(f => f.name);
      if (!validFlavors.includes(options.bulma)) {
        displayError(
          `Invalid Bulma flavor: ${options.bulma}. Valid options are: ${validFlavors.join(', ')}`
        );
        process.exit(1);
      }
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
      // Validate the provided icon library
      const validLibraries = ICON_LIBRARIES.map(lib => lib.name);
      if (!validLibraries.includes(options.icon)) {
        displayError(
          `Invalid icon library: ${options.icon}. Valid options are: ${validLibraries.join(', ')}`
        );
        process.exit(1);
      }
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

    // Create project
    console.log();
    console.log(chalk.green(MESSAGES.CREATING_PROJECT(targetPath)));

    try {
      await this.copyTemplate(template, targetPath);
      await updatePackageJson(targetPath, projectName);
      await this.setupBulmaFlavor(targetPath, bulmaFlavor, template);
      await this.setupIconLibrary(targetPath, iconLibrary, template);
      await this.setupConfigProvider(
        targetPath,
        bulmaFlavor,
        iconLibrary,
        template
      );
      displaySuccess(targetDir);
    } catch (error) {
      displayError((error as Error).message);
      process.exit(1);
    }
  }
}
