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
  SKILLS_ADDED:
    '✔ Installed bestax AI skills into .claude/skills/ (+ CLAUDE.md)',
} as const;

export const PROMPTS = {
  PROJECT_NAME: 'Project name:',
  SELECT_FRAMEWORK: 'Select a framework:',
  SELECT_ICON_LIBRARY: 'Would you like to add an icon library?',
  SELECT_BULMA_FLAVOR: 'Which Bulma CSS flavor would you like to use?',
  INSTALL_SKILLS:
    'Install the bestax AI skills (.claude/skills) for Claude Code and other agents?',
} as const;

// Minimal CLAUDE.md scaffolded alongside the skills so an AI agent knows the
// stack and where the skills live.
export const CLAUDE_MD = (projectName: string): string => `# ${projectName}

This app is built with [\`@allxsmith/bestax-bulma\`](https://bestax.io) — React components for
Bulma 1.x.

## AI skills

\`.claude/skills/\` contains Agent Skills that teach Claude how to build with this library. They load
automatically when the task matches:

- **bestax-custom-component** — build a new custom component the bestax way.
- **bestax-form** — build forms with the bestax form components (no form library).
- **bestax-theming** — colors, branding, and dark mode via the \`Theme\` component (\`colorMode\`).
- **bestax-layout-scaffold** — scaffold full pages (app shell, landing, centered, card grid).

Prefer the library's components and these skills over hand-written Bulma markup or custom CSS.

## Docs

- Docs site: https://bestax.io
- LLM-ready docs: https://bestax.io/llms.txt (curated index) and https://bestax.io/llms-full.txt
- Using bestax with AI tools: https://bestax.io/docs/guides/llms
`;

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
    importStatement: "import '@allxsmith/bestax-bulma/bestax.css';",
  },
  {
    name: 'prefixed',
    display: 'Prefixed',
    description: 'All classes prefixed with "bestax-" to avoid conflicts',
    color: chalk.blue,
    importStatement:
      "import '@allxsmith/bestax-bulma/versions/bestax-prefixed.css';",
    needsPrefix: true,
  },
  {
    name: 'no-helpers',
    display: 'No Helpers',
    description: 'Core components only, no utility classes',
    color: chalk.yellow,
    importStatement:
      "import '@allxsmith/bestax-bulma/versions/bestax-no-helpers.css';",
  },
  {
    name: 'no-helpers-prefixed',
    display: 'No Helpers, Prefixed',
    description: 'Core components only with "bestax-" prefix',
    color: chalk.magenta,
    importStatement:
      "import '@allxsmith/bestax-bulma/versions/bestax-no-helpers-prefixed.css';",
    needsPrefix: true,
  },
  {
    name: 'no-dark-mode',
    display: 'No Dark Mode',
    description: 'Light mode only, smaller bundle size',
    color: chalk.cyan,
    importStatement:
      "import '@allxsmith/bestax-bulma/versions/bestax-no-dark-mode.css';",
  },
];
