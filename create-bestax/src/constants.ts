import chalk from 'chalk';

export interface Template {
  name: string;
  display: string;
  color: typeof chalk.yellow;
}

export const TEMPLATES: Template[] = [
  { name: 'vite', display: 'Vite', color: chalk.yellow },
  { name: 'vite-ts', display: 'Vite + TypeScript', color: chalk.blue },
];

export const DEFAULT_PROJECT_NAME = 'my-bestax-app';
export const MAX_PROJECT_NAME_LENGTH = 214;
export const PROJECT_NAME_REGEX = /^[a-zA-Z0-9-._]+$/;

export const MESSAGES = {
  PROJECT_NAME_REQUIRED: 'Project name is required',
  PROJECT_NAME_TOO_LONG: 'Project name too long',
  PROJECT_NAME_INVALID_CHARS:
    'Project name can only contain letters, numbers, dots, dashes and underscores',
  OPERATION_CANCELLED: '✖ Operation cancelled',
  DIRECTORY_NOT_EMPTY: (dir: string) =>
    `Directory ${chalk.yellow(dir)} is not empty. Remove existing files and continue?`,
  EMPTYING_DIRECTORY: (dir: string) => `\n  Emptying ${dir}...`,
  CREATING_PROJECT: (path: string) =>
    `✔ Creating project in ${chalk.bold(path)}`,
  TEMPLATE_NOT_FOUND: (template: string) => `Template not found at ${template}`,
  PROJECT_CREATED: '✔ Done! Project created successfully.',
  NEXT_STEPS: 'Next steps:',
  HAPPY_CODING: 'Happy coding! 🎉',
} as const;

export const PROMPTS = {
  PROJECT_NAME: 'Project name:',
  SELECT_FRAMEWORK: 'Select a framework:',
  SELECT_ICON_LIBRARY: 'Would you like to add an icon library?',
  SELECT_BULMA_FLAVOR: 'Which Bulma CSS flavor would you like to use?',
} as const;

export interface IconLibrary {
  name: string;
  display: string;
  color: typeof chalk.yellow;
  packageName?: string;
  importStatement?: string;
  setupInstructions?: string;
}

export const ICON_LIBRARIES: IconLibrary[] = [
  {
    name: 'none',
    display: "None (I'll add icons later)",
    color: chalk.gray,
  },
  {
    name: 'fontawesome',
    display: 'Font Awesome',
    color: chalk.blue,
    packageName: '@fortawesome/fontawesome-free',
    importStatement: "import '@fortawesome/fontawesome-free/css/all.min.css';",
  },
  {
    name: 'mdi',
    display: 'Material Design Icons',
    color: chalk.cyan,
    packageName: '@mdi/font',
    importStatement: "import '@mdi/font/css/materialdesignicons.min.css';",
  },
  {
    name: 'ionicons',
    display: 'Ionicons',
    color: chalk.green,
    // Note: ionicons doesn't need packageName or importStatement
    // as it's loaded via CDN in index.html
  },
  {
    name: 'material-icons',
    display: 'Google Material Icons',
    color: chalk.yellow,
    packageName: 'material-icons',
    importStatement: "import 'material-icons';",
  },
  {
    name: 'material-symbols',
    display: 'Material Symbols',
    color: chalk.magenta,
    packageName: 'material-symbols',
    importStatement: "import 'material-symbols';",
  },
];

export interface BulmaFlavor {
  name: string;
  display: string;
  description?: string;
  color: typeof chalk.yellow;
  importStatement: string;
  needsPrefix?: boolean;
}

export const BULMA_FLAVORS: BulmaFlavor[] = [
  {
    name: 'complete',
    display: 'Complete (Recommended)',
    description: 'Full Bulma CSS with all components and helpers',
    color: chalk.green,
    importStatement: "import 'bulma/css/bulma.min.css';",
  },
  {
    name: 'prefixed',
    display: 'Prefixed',
    description: 'All classes prefixed with "bulma-" to avoid conflicts',
    color: chalk.blue,
    importStatement: "import 'bulma/css/versions/bulma-prefixed.min.css';",
    needsPrefix: true,
  },
  {
    name: 'no-helpers',
    display: 'No Helpers',
    description: 'Core components only, no utility classes',
    color: chalk.yellow,
    importStatement: "import 'bulma/css/versions/bulma-no-helpers.min.css';",
  },
  {
    name: 'no-helpers-prefixed',
    display: 'No Helpers, Prefixed',
    description: 'Core components only with "bulma-" prefix',
    color: chalk.magenta,
    importStatement:
      "import 'bulma/css/versions/bulma-no-helpers-prefixed.min.css';",
    needsPrefix: true,
  },
  {
    name: 'no-dark-mode',
    display: 'No Dark Mode',
    description: 'Light mode only, smaller bundle size',
    color: chalk.cyan,
    importStatement: "import 'bulma/css/versions/bulma-no-dark-mode.min.css';",
  },
];
