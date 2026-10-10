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
// How many of a non-empty directory's entries a message names before it
// switches to "and N more".
export const MAX_LISTED_ENTRIES = 5;

const listEntries = (entries: string[]): string =>
  entries.length > MAX_LISTED_ENTRIES
    ? `${entries.slice(0, MAX_LISTED_ENTRIES).join(', ')} and ${entries.length - MAX_LISTED_ENTRIES} more`
    : entries.join(', ');

export const MESSAGES = {
  PROJECT_NAME_REQUIRED: 'Project name is required',
  PROJECT_NAME_TOO_LONG: 'Project name too long',
  PROJECT_NAME_INVALID_CHARS:
    'Project name can only contain letters, numbers, dots, dashes and underscores',
  PROJECT_NAME_DOT:
    'Project name cannot start with a dot (names like "." or ".." would scaffold outside a new directory) — pass a directory name',
  PROJECT_NAME_NO_PACKAGE_NAME:
    'Project name must contain a letter, number or dash (npm package names cannot start with "_" or ".")',
  PACKAGE_NAME_NORMALIZED: (name: string) =>
    `  package.json name: ${name} (npm package names are lower-case and cannot start with "_")`,
  OPERATION_CANCELLED: '✖ Operation cancelled',
  NO_TTY:
    'No interactive terminal detected — cannot prompt for input.\n' +
    'Re-run non-interactively with a project name and flags, e.g.:\n' +
    '  npm create bestax@latest my-app -- -t vite-ts -b complete -i none -y\n' +
    'Run with --help to see all options.',
  DIRECTORY_NOT_EMPTY: (dir: string, entries: string[]) =>
    `Directory ${chalk.yellow(dir)} is not empty (${listEntries(entries)}). Remove existing files and continue?`,
  NOT_A_DIRECTORY: (dir: string) =>
    `${dir} already exists and is not a directory, so nothing was written. Choose another project name.`,
  // Shown instead of the question above when it cannot be asked: under -y, or
  // without a terminal. -y never answers it (#945), so this must not suggest -y.
  DIRECTORY_NOT_EMPTY_REFUSED: (dir: string, entries: string[]) =>
    `Directory ${dir} is not empty (${listEntries(entries)}), so nothing was written.\n` +
    '  Re-run with --overwrite to delete its contents first, or choose a new or empty directory.\n' +
    '  -y alone never deletes files.',
  EMPTYING_DIRECTORY: (dir: string) => `\n  Emptying ${dir}...`,
  CREATING_PROJECT: (path: string) =>
    `✔ Creating project in ${chalk.bold(path)}`,
  TEMPLATE_NOT_FOUND: (template: string) => `Template not found at ${template}`,
  PROJECT_CREATED: '✔ Done! Project created successfully.',
  NEXT_STEPS: 'Next steps:',
  HAPPY_CODING: 'Happy coding! 🎉',
  SKILLS_ADDED:
    '✔ Installed bestax AI skills into .claude/skills/ (+ CLAUDE.md, .claude/launch.json)',
  ICON_CSS_NOT_ADDED: (file: string, importStatement: string) =>
    `  Warning: ${file} has no bestax stylesheet import to follow, so ${importStatement} ` +
    'was not added. Add it by hand or the icons will not render.',
  TELEMETRY_NOTICE:
    'Help improve bestax — share anonymous usage stats?\n' +
    'Sends only the options you chose (template, Bulma flavor, icon library,\n' +
    'skills, package manager) plus CLI version, Node major, and OS name.\n' +
    'Never your name, paths, project names, or any personal data.\n' +
    '  Details & opt-out: https://bestax.io/docs/guides/telemetry\n' +
    '  Feedback welcome:  https://github.com/allxsmith/bestax/issues',
  TELEMETRY_ACK_ON: 'Thanks! Opt out anytime with --no-telemetry.',
  TELEMETRY_ACK_OFF: "No problem — we won't ask again.",
  TELEMETRY_ACK_UNSAVED:
    "Couldn't save your choice (config dir not writable) — you may be asked again.",
} as const;

// Dev-server manifest written into .claude/ with the skills opt-in so Claude
// Code's browser preview (`preview_start`) can boot the app by name instead of
// rediscovering the dev command from package.json. `npm` is deliberately
// package-manager-neutral (`npm run dev` works whichever PM installed the
// project), and `--strictPort` stops Vite from silently auto-incrementing to
// 5174 when 5173 is busy — a mismatch with the declared `port` must fail
// loudly, not point the preview at nothing.
export const LAUNCH_JSON =
  JSON.stringify(
    {
      version: '0.0.1',
      configurations: [
        {
          name: 'dev',
          runtimeExecutable: 'npm',
          runtimeArgs: ['run', 'dev', '--', '--strictPort'],
          port: 5173,
        },
      ],
    },
    null,
    2
  ) + '\n';

export const PROMPTS = {
  PROJECT_NAME: 'Project name:',
  SELECT_FRAMEWORK: 'Select a framework:',
  SELECT_ICON_LIBRARY: 'Would you like to add an icon library?',
  SELECT_BULMA_FLAVOR: 'Which Bulma CSS flavor would you like to use?',
  INSTALL_SKILLS:
    'Install the bestax AI skills (.claude/skills) for Claude Code and other agents?',
  TELEMETRY_CONSENT: 'Share anonymous usage stats?',
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

// The house style opens with the inline-style table for a flavor that has the
// helper classes, and with the named-class rule for one that does not.
const HELPER_HOUSE_STYLE = `**Never inline \`style={{}}\`** — the components accept helper props that cover the common
cases. Before writing \`style\`, translate each declaration with this table:

| Inline style you're about to write         | Helper props instead                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| \`marginTop: '1rem'\` (any margin/padding) | \`mt="4"\` — \`m\`/\`mt\`/\`mx\`/\`p\`/\`py\`/… scale: \`1\`=0.25rem, \`2\`=0.5rem, \`3\`=0.75rem, \`4\`=1rem, \`5\`=1.5rem, \`6\`=3rem (nearest step) |
| \`textAlign: 'center'\`                    | \`textAlign="centered"\` (also \`left\`, \`right\`, \`justified\`)                                                                          |
| \`color: '#…'\`                            | \`textColor\` with the nearest Bulma color: \`primary\`, \`link\`, \`info\`, \`success\`, \`warning\`, \`danger\`, \`white\`, \`black\`, \`grey\` (+ \`grey-light\`, \`grey-dark\`, …) |
| \`backgroundColor: '#…'\`                  | \`bgColor\` (same palette)                                                                                                                  |
| \`fontSize: …\`                            | \`textSize="1"\`…\`"7"\` (\`1\` largest) — for headings use \`Title\`/\`SubTitle\` \`size\`                                                 |
| \`fontWeight: …\`                          | \`textWeight\`: \`light\`, \`normal\`, \`medium\`, \`semibold\`, \`bold\`                                                                   |
| \`textTransform\`, italics                 | \`textTransform\`: \`uppercase\`, \`lowercase\`, \`capitalized\`, \`italic\`                                                                |
| \`display: 'flex'\` + flex properties      | same-named props: \`display="flex"\`, \`flexDirection\`, \`justifyContent\`, \`alignItems\`, \`flexWrap\`                                   |
| \`height: '100%'\` on a flex child         | \`flexGrow="1"\`                                                                                                                            |
| \`display: 'none'\`                        | \`visibility="hidden"\`, or responsive \`display*\` props (\`displayMobile\`, \`displayTablet\`, …)                                         |
| \`gap: '1rem'\` (flex or grid)             | \`gap="2"\`, or one axis: \`columnGap\`, \`rowGap\`; gap scale: \`1\`=0.5rem, \`2\`=1rem, \`4\`=2rem, half steps (\`"1.5"\`)               |

- Spacing, typography, and flex helpers are on every component; \`textColor\`/\`bgColor\` are
  on the content components (\`Box\`, \`Block\`, \`Title\`, \`Content\`, \`Hero\`, \`Card\`, …) — the
  ones with a semantic \`color\` variant (\`Tag\`, \`Tabs\`, \`Panel\`) take \`color\` instead.
  \`Notification\` is the mixed case: it takes \`textColor\`, but its background comes from
  the semantic \`color\` prop, not \`bgColor\`.
- No helper matches (e.g. \`maxWidth\`, a one-off gradient)? Add a named class to
  \`src/App.css\` and pass it via \`className\` — still never inline \`style\`.`;

const NO_HELPERS_HOUSE_STYLE = `**Never inline \`style={{}}\`**, and don't reach for helper props in its place either:
this app's flavor leaves out Bulma's helper classes, so \`mt="4"\`, \`textAlign="centered"\` and \`flexGrow="1"\`
render nothing. Write a named class in \`src/App.css\`, which loads after Bulma's CSS, and pass it via \`className\`.
`;

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
  if (flavor?.noHelpers) {
    setupLines.push(
      `- This flavor leaves out Bulma's helper classes, so **helper props that add those classes render nothing**: ` +
        `\`mt\`, \`gap\`, \`textAlign\`, \`textColor\`, \`display\` and \`flexGrow\` still add ` +
        `class names, but no rule matches them. \`skeleton\` still works, because the flavor keeps ` +
        `Bulma's skeleton styles. The starter page lays itself out with named classes in ` +
        `\`src/App.css\` instead.`
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
            : '') +
          (icon?.setupInstructions ? ` ${icon.setupInstructions}` : '')
  );
  const houseStyleOpening = flavor?.noHelpers
    ? NO_HELPERS_HOUSE_STYLE
    : HELPER_HOUSE_STYLE;
  // The wrapper elements are only a way out where their helper props render.
  const utilityClassRule = flavor?.noHelpers
    ? `- Don't hand-write Bulma utility classes either: this flavor doesn't ship them, so a
  \`has-text-…\` class renders nothing, and the named class above is what works.`
    : `- Don't hand-write Bulma utility classes either — bare text/markup has wrapper elements that
  take the same helper props: \`Span\`, \`Paragraph\`, \`Strong\`, not \`<span className="has-text-…">\`.`;
  return `# ${projectName}

This app is built with [\`@allxsmith/bestax-bulma\`](https://bestax.io) — React components for
Bulma 1.x.

## This app's setup

${setupLines.join('\n')}

## House style

${houseStyleOpening}
${utilityClassRule}
  The one exception: companion classes Bulma requires on \`<html>\`/\`<body>\` (e.g.
  \`has-navbar-fixed-top\` with \`Navbar fixed="top"\`) are hand-added in \`index.html\` — no
  component renders those elements.
- Compound sub-parts (\`Modal.*\`, \`Tabs.*\`, \`Message.*\`) take \`className\` + HTML
  attributes and their own few props — no Bulma helper props, no \`as\`/\`href\`: nest a
  \`Link\`/\`Span\` inside instead. \`Tabs.Tab\` and \`Tabs.Content.Item\` each require \`index={i}\`,
  and \`Tabs.Tab\` has built-in \`icon\`/\`disabled\` props — no nested \`Icon\` needed.
- Compose existing components before writing custom CSS; theme via \`Theme\` and \`--bulma-*\`
  variables, never hardcoded colors.

- \`Navbar.Burger\`/\`Navbar.Menu\` are controlled — wire \`active\` via state on both, and pair
  \`Navbar fixed="top"\` with the \`has-navbar-fixed-top\` class on \`<html>\` (never an inline
  padding offset).
- Reusable components you write get the library's spine so helper props work on them too:
  extend \`BulmaClassesProps\`, run your props through \`useBulmaClasses\`, merge the
  \`bulmaHelperClasses\` it returns into \`className\`, and spread **its** \`rest\` (not the raw
  props) — the bestax-custom-component skill has the full template.
- There is no test runner or Storybook in this app — don't assume one.
- \`index.html\`'s \`<title>\` starts as the project name and \`README.md\` is stock template
  boilerplate — once this app has a real identity, set the title (and any meta tags) to match
  it and rewrite the README to describe *this* app, not the template.
- Before adding a dependency, match the package manager to the app's lockfile
  (\`pnpm-lock.yaml\` → pnpm, \`package-lock.json\` → npm, \`yarn.lock\` → yarn) — a mismatched
  install fails or forks the lockfile.

### Three components Bulma will talk you out of

Everything else here gets found because Bulma has no equivalent; these three have a near-miss
close enough to end the search.

- **Confirmation after an action** — \`Toast\`, not \`Notification\`/\`Message\`. Mount
  \`<ToastContainer position="top-right" />\` once at the root, then \`toast.success('Saved')\`.
- **A confirm or alert** — \`Dialog\`, not \`Modal\`. Mount \`<DialogContainer />\`, then
  \`if (await dialog.confirm({ title, message })) …\`.
- **A control that reads as text or a link** — \`LinkButton\`
  (\`variant="text" \\| "ghost" \\| "underline"\`), not \`<a href="#">\`, \`<div onClick>\` or
  \`Button color="text"\`.

Mounting a container without ever calling \`toast.*\`/\`dialog.*\` does nothing. Both also work
as controlled components (\`<Toast message … onClose>\`, \`<Dialog isOpen … onConfirm>\`).

## AI skills

\`.claude/skills/\` contains Agent Skills that teach Claude how to build with this library. They load
automatically when the task matches:

- **bestax-custom-component** — build a new custom component the bestax way.
- **bestax-form** — build forms with the bestax form components (no form library).
- **bestax-theming** — colors, branding, and dark mode via the \`Theme\` component (\`colorMode\`).
- **bestax-layout-scaffold** — scaffold full pages (app shell, landing, centered, card grid).
- **bestax-icons** — icons via \`Icon\`/\`IconText\`: library setup, name formats, variants, a11y.
- **bestax-optimize** — shrink the built CSS: measure raw+gzip, then flavor switch or a modular Sass build.
- **bestax-migrate** — migrate code off react-bulma-components (v4), rbx (v2), bloomer (0.6) or raw Bulma classNames: run the codemod, resolve its TODOs.

Prefer the library's components and these skills over hand-written Bulma markup or custom CSS.
Read skill \`references/\` files with absolute paths — the shell's cwd is not stable between commands.

\`.claude/launch.json\` declares this app's dev server for Claude Code's browser preview
(\`npm run dev\` on port 5173, \`--strictPort\`) — start it from there rather than rediscovering
the command. \`--strictPort\` failing because 5173 is busy means an orphaned dev server from an
earlier session owns the port — kill the listener (\`lsof -tiTCP:5173 -sTCP:LISTEN | xargs kill\`)
and relaunch; don't move the app to another port.

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
  // Anything about the library's setup an agent needs beyond its name and
  // provider value, appended to the icon line of the generated CLAUDE.md.
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
    // The package's bare import puts the filled, outlined, round, sharp and
    // two-tone fonts into the build. Filled is the style Icon renders by
    // default, so it is the only one imported.
    importStatement: "import 'material-icons/iconfont/filled.css';",
    setupInstructions:
      'Only the filled style is loaded (`material-icons/iconfont/filled.css`, the variant `<Icon>` ' +
      'uses by default). Import `outlined.css`, `round.css`, `sharp.css` or `two-tone.css` from ' +
      '`material-icons/iconfont/` in `src/main.*` before using those variants.',
  },
  {
    name: 'material-symbols',
    display: 'Material Symbols',
    color: chalk.magenta,
    packageName: 'material-symbols',
    // 0.x, so the caret holds the minor: this follows the newest minor
    // bestax-bulma's material-symbols peer range admits, not the newest
    // published one, or npm refuses the install as a peer conflict.
    packageVersion: '^0.47.0',
    // The package's bare import puts the outlined, rounded and sharp fonts
    // into the build. Outlined is the style Icon renders by default, so it is
    // the only one imported.
    importStatement: "import 'material-symbols/outlined.css';",
    setupInstructions:
      'Only the outlined style is loaded (`material-symbols/outlined.css`, the variant `<Icon>` ' +
      'uses by default). Import `material-symbols/rounded.css` or `sharp.css` in `src/main.*` ' +
      'before using `variant="rounded"` or `"sharp"`.',
  },
];

export interface BulmaFlavor {
  name: string;
  display: string;
  description?: string;
  color: typeof chalk.yellow;
  importStatement: string;
  needsPrefix?: boolean;
  // The flavor's CSS leaves out Bulma's helper classes, so a helper prop that
  // adds one (`mt`, `textAlign`, `flexGrow`, …) renders a class nothing styles.
  noHelpers?: boolean;
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
    noHelpers: true,
  },
  {
    name: 'no-helpers-prefixed',
    display: 'No Helpers, Prefixed',
    description: 'Core components only with "bestax-" prefix (~69 KB gzip)',
    color: chalk.magenta,
    importStatement:
      "import '@allxsmith/bestax-bulma/versions/bestax-no-helpers-prefixed.css';",
    needsPrefix: true,
    noHelpers: true,
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

// Sits above the stylesheet import in the templates' entry files, and the
// scaffolder writes it back when it swaps in a flavor's stylesheet, so the
// reason for the import order survives. The no-helpers classes depend on it.
export const CSS_ORDER_COMMENT =
  "// Bestax's stylesheet loads before the app's own CSS, so a named class in\n" +
  '// src/App.css wins over a Bulma rule of the same weight.';

export interface StarterClass {
  // The helper prop exactly as the starter App writes it.
  prop: string;
  // The named class that replaces it.
  className: string;
  // That class's rule body in src/App.css.
  declaration: string;
}

// Every helper prop the starter App uses, with the named class that stands in
// for it under a `noHelpers` flavor, where the prop would render nothing. The
// scaffolder swaps each prop for its class and writes the rules into
// src/App.css, so the starter keeps its layout and shows that flavor's way of
// styling. A helper prop added to the starter needs a row here.
export const NO_HELPERS_STARTER_CLASSES: StarterClass[] = [
  {
    prop: 'textAlign="centered"',
    className: 'page-title',
    declaration: 'text-align: center;',
  },
  {
    prop: 'display="flex"',
    className: 'card-column',
    declaration: 'display: flex;',
  },
  {
    prop: 'flexGrow="1"',
    className: 'card-fill',
    declaration: 'flex-grow: 1;',
  },
];

export const NO_HELPERS_APP_CSS =
  '\n/* This flavor of Bulma leaves out the helper classes, so helper props such\n' +
  '   as textAlign and flexGrow render nothing here. Named classes like these do\n' +
  '   the job instead: write one, then pass it with className. */\n' +
  NO_HELPERS_STARTER_CLASSES.map(
    ({ className, declaration }) => `.${className} {\n  ${declaration}\n}\n`
  ).join('\n');
