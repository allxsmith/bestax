# create-bestax

[![npm version](https://img.shields.io/npm/v/create-bestax.svg)](https://www.npmjs.com/package/create-bestax)
[![npm downloads](https://img.shields.io/npm/dm/create-bestax.svg)](https://www.npmjs.com/package/create-bestax)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Socket Badge](https://socket.dev/api/badge/npm/package/create-bestax)](https://socket.dev/npm/package/create-bestax/overview)
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

# Alternative naming
npm create bestax-bulma@latest my-app
```

### Interactive Mode

Running without arguments will prompt you for all options:

```bash
npm create bestax@latest
```

You'll be asked to:

1. Enter a project name
2. Select a framework (Vite or Vite + TypeScript)
3. Choose a Bulma CSS flavor (Complete or Minimal)
4. Select an icon library (Font Awesome, Material Icons, etc.)
5. Choose whether to install the bestax AI skills into `.claude/skills/`

Every prompt has a flag equivalent, so the whole flow is scriptable and CI-friendly — see the options below.

### Command Line Options

```bash
npm create bestax@latest [project-directory] [options]
```

**Arguments:**

- `[project-directory]` - Optional project directory name

**Options:**

- `-t, --template <template>` - Template to use: `vite` or `vite-ts`  
  **Default:** `vite`
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
  - Bulma flavor: `complete`
  - Icon library: `none`
  - AI skills: installed (pass `--no-skills` to opt out)

**Example:**

```bash
# Create a TypeScript project with Font Awesome icons
npm create bestax@latest my-app -t vite-ts -i fontawesome -b complete

# Use all defaults (skip prompts)
npm create bestax@latest my-app -y
```

## Templates

Available templates:

- `vite` - Vite + JavaScript
- `vite-ts` - Vite + TypeScript

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
