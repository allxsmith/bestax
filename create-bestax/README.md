# create-bestax

[![npm version](https://img.shields.io/npm/v/create-bestax.svg)](https://www.npmjs.com/package/create-bestax)
[![npm downloads](https://img.shields.io/npm/dm/create-bestax.svg)](https://www.npmjs.com/package/create-bestax)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Socket Badge](https://badge.socket.dev/npm/package/create-bestax/latest)](https://socket.dev/npm/package/create-bestax/overview)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/allxsmith/bestax/badge)](https://scorecard.dev/viewer/?uri=github.com/allxsmith/bestax)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/14361/badge)](https://www.bestpractices.dev/projects/14361)
[![npm provenance](https://img.shields.io/badge/npm-provenance-3fb950.svg)](https://www.npmjs.com/package/create-bestax#provenance)
[![Security policy](https://img.shields.io/badge/security-policy-blue.svg)](https://github.com/allxsmith/bestax/blob/main/SECURITY.md)

The scaffolder for [`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma) — spin up a Vite app pre-wired for the **Bulma v1** React component library in one command. Picks your framework (JS or TypeScript), CSS flavor, and icon library, and can drop in the bestax **AI skills** so an agent like Claude Code knows the library from the first prompt.

Part of the [bestax monorepo](https://github.com/allxsmith/bestax) — see also [`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma) for the components themselves.

## Requirements

- **Node.js 22 or newer.** Node 18 and 20 are both past end-of-life. On an older runtime the
  CLI exits immediately with an explicit upgrade message.
- npm 10 or newer (ships with Node 22), or yarn/pnpm.

## Usage

### Quick Start

```bash
# Using npm
npm create bestax@latest my-app

# Using npx
npx create-bestax@latest my-app
```

### Interactive Mode

Running without arguments will prompt you for all options:

```bash
npm create bestax@latest
```

You'll be asked to:

1. Enter a project name or path (and, if that directory already holds files, confirm removing
   them; nothing is removed until you have answered the last question)
2. Select a framework (Vite or Vite + TypeScript, each with or without the React Compiler)
3. Choose a linter (Oxlint or ESLint)
4. Choose a Bulma CSS flavor (the `--bulma` options below)
5. Select an icon library (Font Awesome, Material Icons, etc.)
6. Choose whether to install the bestax AI skills into `.claude/skills/`
7. Choose whether to install the dependencies and start the dev server right away

Every prompt has a flag equivalent, so the whole flow is scriptable and CI-friendly — see the options below.

### Command Line Options

```bash
npm create bestax@latest [project-directory] -- [options]
```

Put the options after `--`. npm needs it to pass them on at all, and so does bun, whose
`bun create` rejects short flags such as `-t` and `-y` itself. pnpm and Yarn 1 accept the options
with or without it.

**Arguments:**

- `[project-directory]` - Optional project directory: a name such as `my-app`, or a path,
  absolute or relative, such as `../apps/my-app`, whose missing folders are created. Its last
  part is the project name, held to the same rules as a bare name. It becomes the page title as
  typed, and the `package.json` name lower-cased the way `npm init` does and without a leading
  `_`, since npm rejects both. A bare `.` scaffolds into the current directory, named after it,
  as long as it's empty. It's never emptied, even with `--overwrite`. A bare `..`, or a path
  ending in `.` or `..`, is refused, so name the directory you want.

**Options:**

- `-t, --template <template>` - Template to use:
  - `vite` - Vite + JavaScript
  - `vite-ts` - Vite + TypeScript
  - `vite-compiler` - Vite + JavaScript, with the React Compiler
  - `vite-compiler-ts` - Vite + TypeScript, with the React Compiler  
    **Default:** `vite`
- `--lint <linter>` - Linter:
  - `oxlint` - Oxlint, as `npm create vite` sets up. `vite-ts` gets TypeScript 7.
  - `eslint` - ESLint with typescript-eslint, as `npm create vite -- --eslint` sets up.
    typescript-eslint doesn't support TypeScript 7 yet, so `vite-ts` stays on TypeScript 6.  
    **Default:** `oxlint`, which a run without a terminal also gets when it leaves `--lint` out
- `-b, --bulma <flavor>` - Bulma CSS flavor:
  - `complete` - Full Bulma CSS with all components and helpers
  - `prefixed` - Prefixed version for compatibility
  - `no-helpers` - Without helper classes
  - `no-helpers-prefixed` - Prefixed without helpers
  - `no-dark-mode` - Without dark mode support  
    **Default:** `complete`
- `-i, --icon <library>` - Icon library:
  - `none` - No icon library
  - `fontawesome` - Font Awesome
  - `mdi` - Material Design Icons
  - `ionicons` - Ionicons
  - `material-icons` - Material Icons
  - `material-symbols` - Material Symbols  
    **Default:** `none`
- `--skills` / `--no-skills` - Install (or skip) the bestax AI skills into
  `.claude/skills/` (with a `CLAUDE.md`) so a Claude Code session picks them up
  automatically. When omitted you're prompted; with `-y` the default is to install.
- `-y, --yes` - Skip prompts and use defaults or provided options.  
  When used, the following defaults are selected unless overridden by flags:
  - Template: `vite`
  - Linter: `oxlint`
  - Bulma flavor: `complete`
  - Icon library: `none`
  - AI skills: installed (pass `--no-skills` to opt out)
  - Install and start: no (pass `--immediate` to opt in)

  `-y` never deletes files. If the target directory is not empty, the run stops, lists what is
  there, and changes nothing; add `--overwrite` to empty it first. Earlier versions emptied the
  directory under `-y` alone, so a script that relied on that now needs `--overwrite`.

- `--no-interactive` - The same as `-y`, for anyone used to create-vite's spelling.

- `--immediate` / `--no-immediate` - Install the dependencies with the package manager that ran
  the CLI and start the dev server once the project is written (or don't), as create-vite's
  `--immediate` does. When omitted you're asked. With `-y`, or without a terminal, the project is
  only written, so a scripted run never starts a server it can't stop.

- `--overwrite` - Remove existing files if the target directory is not empty, without asking.
  Every other flag is checked first, so a typo stops the run before anything is deleted. It
  never empties the current directory or a folder that holds it, however the path is written.

**Example:**

```bash
# Create a TypeScript project with Font Awesome icons
npm create bestax@latest my-app -- -t vite-ts -i fontawesome -b complete

# The same, linted with ESLint (and on TypeScript 6)
npm create bestax@latest my-app -- -t vite-ts -i fontawesome --lint eslint

# Use all defaults (skip prompts)
npm create bestax@latest my-app -- -y

# Scaffold into a path; the package is named my-app
npm create bestax@latest ../apps/my-app -- -y

# Scaffold into the current, empty directory, then install and start it
npm create bestax@latest . -- -y --immediate

# Turn on the React Compiler
npm create bestax@latest my-app -- -t vite-compiler-ts -y

# The same with bun
bun create bestax@latest my-app -- -y
```

## Templates

Available templates:

- `vite` - Vite + JavaScript
- `vite-ts` - Vite + TypeScript
- `vite-compiler` - Vite + JavaScript, with the [React Compiler](https://react.dev/learn/react-compiler)
- `vite-compiler-ts` - Vite + TypeScript, with the React Compiler

The React Compiler templates are the plain ones with the compiler turned on through Babel in
`vite.config`, the way `npm create vite` builds its `react-compiler` starters.

Each template includes:

- Pre-configured bestax-bulma integration (React 19)
- The latest `@allxsmith/bestax-bulma`, which ships Bulma v1 automatically
- Icon library support (Font Awesome, Material Design, etc.)
- Sample components demonstrating library usage
- Development and build scripts

## For AI Tools

Scaffolding for an AI agent? Pass `--skills` (or accept the prompt) to drop the bestax
Agent Skills and a `CLAUDE.md` into the new project so Claude Code, Cursor, or Copilot
build the bestax way from the start. The library also ships LLM-optimized docs:

- [LLMs guide](https://bestax.io/docs/guides/llms) — using bestax with Claude Code, Cursor, Copilot
- [Agent Skills](https://bestax.io/docs/skills/intro) — teach your agent the bestax conventions
- [llms.txt](https://bestax.io/llms.txt) (curated index) · [llms-full.txt](https://bestax.io/llms-full.txt) (full docs)

## Development

```bash
npm run build    # Build the CLI
npm run dev      # Watch mode
npm test         # Run tests
npm run lint     # Lint CLI source code
npm run typecheck # Type check CLI source code
```

**Note on Templates:** Template files in `templates/` are excluded from linting. They should be manually validated by scaffolding a test project and running lint/build there before releasing.

## Hardened by default

A scaffolder runs with write access to your filesystem and picks your starting dependencies, so how it is built and published matters:

- **Signed provenance** — every release carries a sigstore attestation linking the tarball to the exact commit and CI run that built it. Check the **Provenance** section on the [npm page](https://www.npmjs.com/package/create-bestax#provenance), or run `npm audit signatures`.
- **npm OIDC trusted publishing** — short-lived, per-run credentials; no long-lived `NPM_TOKEN` exists to be stolen. Release commits and tags are GPG-signed.
- **Socket.dev scans every PR** for malware, install scripts, obfuscated code, and privilege escalation before it can reach `main`.
- **Dependencies are a deliberate act** — install scripts are blocked unless individually allow-listed, freshly published versions are refused for 3 days, and CI installs only what the reviewed lockfile resolves.
- **Every GitHub Action is pinned to a full commit SHA**, so a compromised action release can't roll silently into a build of this CLI.
- **CodeQL, Dependency Review, and Dependabot** run continuously, alongside a high-severity `pnpm audit` gate.
- **Layered AI review before merge** — [CodeRabbit](https://coderabbit.ai) plus an independent adversarial Claude review (a different model from the one writing AI-authored changes), on top of required green CI, an approving review, and a human merge.

Full detail: [`SECURITY.md`](https://github.com/allxsmith/bestax/blob/main/SECURITY.md) · [Security guide](https://bestax.io/docs/guides/security)

## Telemetry

`create-bestax` can send one **anonymous** usage event after a successful
scaffold — only if you opt in when asked (once, at the end of a scaffold). The
event is just the choices you made — template, Bulma flavor, icon library,
skills, package manager — plus the CLI version, Node major version, and OS
platform; never names, IPs, machine IDs, paths, or file contents, and no
identifier exists that could link two events together. Opt out any time with
`--no-telemetry`, `BESTAX_TELEMETRY=0`, or `DO_NOT_TRACK=1`.

Full disclosure of every field and control: [Telemetry guide](https://bestax.io/docs/guides/telemetry)

## Publishing

This package uses semantic-release with scope-based rules. Only commits with `feat(create-bestax)` or `fix(create-bestax)` will trigger releases.
