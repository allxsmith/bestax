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
  PROJECT_NAME_DOT:
    'Project name cannot start with a dot (names like "." or ".." would scaffold outside a new directory) — pass a directory name',
  OPERATION_CANCELLED: '✖ Operation cancelled',
  NO_TTY:
    'No interactive terminal detected — cannot prompt for input.\n' +
    'Re-run non-interactively with a project name and flags, e.g.:\n' +
    '  npm create bestax@latest my-app -- -t vite-ts -b complete -i none -y\n' +
    'Run with --help to see all options.',
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

// Icon libraries that require a `ConfigProvider iconLibrary` wrapper, mapped
// to the exact prop value the scaffolder writes into main.tsx/jsx ('none' and
// 'fontawesome' are the defaults and need no provider). Shared with
// project-creator.setupConfigProvider AND the CLAUDE_MD template below so the
// generated docs can never drift from the generated code.
export const CONFIG_PROVIDER_ICON_VALUES: Record<string, string> = {
  mdi: 'mdi',
  ionicons: 'ion',
  'material-icons': 'material-icons',
  'material-symbols': 'material-symbols',
};

// Minimal CLAUDE.md scaffolded alongside the skills so an AI agent knows the
// stack, this app's scaffold choices, and where the skills live. Kept short:
// it loads into every agent session.
export interface ClaudeMdOptions {
  bulmaFlavor: string;
  iconLibrary: string;
}

export const CLAUDE_MD = (
  projectName: string,
  { bulmaFlavor, iconLibrary }: ClaudeMdOptions
): string => {
  const flavor = BULMA_FLAVORS.find(f => f.name === bulmaFlavor);
  const icon = ICON_LIBRARIES.find(lib => lib.name === iconLibrary);
  const setupLines = [
    `- Bulma flavor: **${bulmaFlavor}** — the app imports **prebuilt** CSS` +
      (flavor ? ` (\`${flavor.importStatement.trim()}\`)` : '') +
      `; there is no Sass pipeline unless you add \`sass\`.`,
  ];
  if (flavor?.needsPrefix) {
    setupLines.push(
      `- Every Bulma class carries the \`bestax-\` prefix and the app is wrapped in ` +
        `\`<ConfigProvider classPrefix="bestax-">\` — custom CSS selectors must match the prefix.`
    );
  }
  const providerIconValue = CONFIG_PROVIDER_ICON_VALUES[iconLibrary];
  setupLines.push(
    iconLibrary === 'none'
      ? `- No icon library is installed — add one before using \`<Icon>\` ` +
          `(https://bestax.io/docs/api/elements/icon).`
      : `- Icon library: **${icon?.display ?? iconLibrary}** — use \`<Icon name="..." />\`.` +
          (providerIconValue
            ? ` The app is already wrapped in \`<ConfigProvider iconLibrary="${providerIconValue}">\` ` +
              `— extend that provider rather than adding a second one.`
            : '')
  );
  return `# ${projectName}

This app is built with [\`@allxsmith/bestax-bulma\`](https://bestax.io) — React components for
Bulma 1.x.

## This app's setup

${setupLines.join('\n')}

## House style

- Never inline \`style={{}}\` — use the helper props every component accepts (\`m*\`/\`p*\`
  spacing, \`textColor\`/\`bgColor\`, \`display="flex"\`, \`flexDirection\`, \`alignItems\`).
  Flex layouts have no \`gap\` helper — space children with margins (\`Grid\` and \`Columns\`
  take a \`gap\` prop, so prefer that there).
- Compose existing components before writing custom CSS; theme via \`Theme\` and \`--bulma-*\`
  variables, never hardcoded colors.
- There is no test runner or Storybook in this app — don't assume one.

## AI skills

\`.claude/skills/\` contains Agent Skills that teach Claude how to build with this library. They load
automatically when the task matches:

- **bestax-custom-component** — build a new custom component the bestax way.
- **bestax-form** — build forms with the bestax form components (no form library).
- **bestax-theming** — colors, branding, and dark mode via the \`Theme\` component (\`colorMode\`).
- **bestax-layout-scaffold** — scaffold full pages (app shell, landing, centered, card grid).
- **bestax-icons** — icons via \`Icon\`/\`IconText\`: library setup, name formats, variants, a11y.

Prefer the library's components and these skills over hand-written Bulma markup or custom CSS.

## Docs

- Docs site: https://bestax.io
- LLM-ready docs: https://bestax.io/llms.txt (curated index) and https://bestax.io/llms-full.txt
- Using bestax with AI tools: https://bestax.io/docs/guides/llms
`;
};

export interface IconLibrary {
  name: string;
  display: string;
  color: typeof chalk.yellow;
  packageName?: string;
  // Version range written into the generated app's package.json. Keep in sync
  // with the ranges bulma-ui/docs are tested against — never 'latest', which
  // would make scaffolded installs non-reproducible.
  packageVersion?: string;
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
    packageVersion: '^7.2.0',
    importStatement: "import '@fortawesome/fontawesome-free/css/all.min.css';",
  },
  {
    name: 'mdi',
    display: 'Material Design Icons',
    color: chalk.cyan,
    packageName: '@mdi/font',
    packageVersion: '^7.4.47',
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
    packageVersion: '^1.13.14',
    importStatement: "import 'material-icons';",
  },
  {
    name: 'material-symbols',
    display: 'Material Symbols',
    color: chalk.magenta,
    packageName: 'material-symbols',
    packageVersion: '^0.45.2',
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
    description: 'Full Bulma CSS with all components and helpers (~82 KB gzip)',
    color: chalk.green,
    importStatement: "import '@allxsmith/bestax-bulma/bestax.css';",
  },
  {
    name: 'prefixed',
    display: 'Prefixed',
    description:
      'All classes prefixed with "bestax-" to avoid conflicts (~84 KB gzip)',
    color: chalk.blue,
    importStatement:
      "import '@allxsmith/bestax-bulma/versions/bestax-prefixed.css';",
    needsPrefix: true,
  },
  {
    name: 'no-helpers',
    display: 'No Helpers',
    description:
      'Core components only, no utility classes — helper props need them (~67 KB gzip)',
    color: chalk.yellow,
    importStatement:
      "import '@allxsmith/bestax-bulma/versions/bestax-no-helpers.css';",
  },
  {
    name: 'no-helpers-prefixed',
    display: 'No Helpers, Prefixed',
    description: 'Core components only with "bestax-" prefix (~69 KB gzip)',
    color: chalk.magenta,
    importStatement:
      "import '@allxsmith/bestax-bulma/versions/bestax-no-helpers-prefixed.css';",
    needsPrefix: true,
  },
  {
    name: 'no-dark-mode',
    display: 'No Dark Mode',
    description: 'Light mode only, smaller bundle size (~70 KB gzip)',
    color: chalk.cyan,
    importStatement:
      "import '@allxsmith/bestax-bulma/versions/bestax-no-dark-mode.css';",
  },
];
