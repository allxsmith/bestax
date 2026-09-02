# bestax-migrate

[![npm version](https://img.shields.io/npm/v/bestax-migrate.svg)](https://www.npmjs.com/package/bestax-migrate)
[![npm downloads](https://img.shields.io/npm/dm/bestax-migrate.svg)](https://www.npmjs.com/package/bestax-migrate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Socket Badge](https://socket.dev/api/badge/npm/package/bestax-migrate)](https://socket.dev/npm/package/bestax-migrate/overview)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/allxsmith/bestax/badge)](https://scorecard.dev/viewer/?uri=github.com/allxsmith/bestax)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/14361/badge)](https://www.bestpractices.dev/projects/14361)
[![npm provenance](https://img.shields.io/badge/npm-provenance-3fb950.svg)](https://www.npmjs.com/package/bestax-migrate#provenance)
[![Security policy](https://img.shields.io/badge/security-policy-blue.svg)](https://github.com/allxsmith/bestax/blob/main/SECURITY.md)

Codemods that migrate existing React apps to [`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma) — the actively maintained React component library for **Bulma v1**.

Currently supported source libraries:

| Source                                                                           | Status                                                              |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`react-bulma-components`](https://github.com/couds/react-bulma-components) (v4) | ✅ All 32 components mapped (a few patterns are flagged as TODOs)   |
| [`rbx`](https://github.com/dfee/rbx) (v2)                                        | ✅ Full export surface mapped (a few patterns are flagged as TODOs) |

Pass the source library as the first argument: `bestax-migrate <source> <paths…>`.

## Requirements

**Node.js 22 or newer.** Node 18 and 20 are both past end-of-life. On an older runtime the CLI
exits immediately with an explicit upgrade message.

This applies only to the Node version the codemod itself runs on. It places no requirement on
the app being migrated — the source is read as text and is never executed.

## Usage

```bash
# Preview what would change (no writes)
pnpm dlx bestax-migrate react-bulma-components src/ --dry
# …or, for an rbx app
pnpm dlx bestax-migrate rbx src/ --dry

# Apply the migration
pnpm dlx bestax-migrate react-bulma-components src/
```

npm and yarn work too: `npx bestax-migrate …` / `yarn dlx bestax-migrate …`.

The codemod uses [jscodeshift](https://github.com/facebook/jscodeshift) to:

- rewrite the source library's imports to `@allxsmith/bestax-bulma` (including destructuring and namespace imports)
- rename components and compound sub-components (`Form.Textarea` → `TextArea`, `Card.Footer.Item` → `Card.FooterItem`, `Hero.Footer` → `Hero.Foot`, …)
- convert props (`renderAs` → `as`, `loading` → `isLoading`, numeric spacing/text sizes → string unions, `textAlign="center"` → `textAlign="centered"`, …)
- flatten responsive breakpoint objects (`mobile={{ size: 4 }}` → `sizeMobile={4}`)
- restructure patterns bestax models differently (`Table.Container`, Navbar dropdowns, `Form.Help`, icon-font children → `<Icon name=…>`)
- migrate stylesheets: CSS imports converge on `@allxsmith/bestax-bulma/bestax.css`, and SCSS files move from Bulma 0.9's `@import` + `$var !default` overrides to `@use 'bulma/sass' with (…)` plus `@use '@allxsmith/bestax-bulma/scss/extras'`
- update `package.json`: remove the source library, add `@allxsmith/bestax-bulma`, raise a declared pre-1.0 `bulma` to `^1` (adding it only when your sources import `bulma/…` directly — otherwise it arrives transitively), and swap the dead `node-sass` for dart `sass` (no install is ever run). Migrating **rbx** is what frees an app from Bulma 0.7.5: rbx pinned it as a _direct_ dependency, so the app could not choose its own Bulma version at all. The four Bulma extensions rbx also pulled in (`bulma-badge`, `bulma-divider`, `bulma-pageloader`, `bulma-tooltip`) are **reported rather than removed** — bestax replaces all four, but a manifest entry is a deliberate declaration and your own Sass may import them

Anything without a safe automatic conversion is left in place with a `// TODO(bestax-migrate): …` comment, and the run ends with a report of every TODO by file and line. TODOs are expected output, not errors — resolve them with the migration guide ([react-bulma-components](https://bestax.io/docs/guides/getting-started/migration/react-bulma-components), [rbx](https://bestax.io/docs/guides/getting-started/migration/rbx)), or let the [`bestax-migrate` Agent Skill](https://bestax.io/docs/skills/intro) walk them for you:

```bash
npx skills add https://github.com/allxsmith/bestax --skill bestax-migrate
```

## Options

| Flag                 | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `--dry`, `-d`        | Report what would change without writing files                 |
| `--print`, `-p`      | Print transformed sources to stdout                            |
| `--extensions`, `-e` | File extensions to include (default `js,jsx,ts,tsx,scss,sass`) |
| `--css <mode>`       | Stylesheet target: `bestax` (default), `bulma`, or `keep`      |
| `--no-deps`          | Skip updating package.json dependencies                        |

## After the codemod

1. Run your package manager's install (the codemod rewrote `package.json` but never installs)
2. Search for `TODO(bestax-migrate)` and resolve each comment
3. Typecheck/build and review the rendered app

Full walkthrough: [react-bulma-components migration guide](https://bestax.io/docs/guides/getting-started/migration/react-bulma-components) · [rbx migration guide](https://bestax.io/docs/guides/getting-started/migration/rbx).

## Hardened by default

A codemod rewrites your source in place, so how it is built and published matters:

- **Signed provenance** — every release carries a sigstore attestation linking the tarball to the exact commit and CI run that built it. Check the **Provenance** section on the [npm page](https://www.npmjs.com/package/bestax-migrate#provenance), or run `npm audit signatures`.
- **npm OIDC trusted publishing** — short-lived, per-run credentials; no long-lived `NPM_TOKEN` exists to be stolen. Release commits and tags are GPG-signed.
- **Socket.dev scans every PR** for malware, install scripts, obfuscated code, and privilege escalation before it can reach `main`.
- **The libraries this tool migrates away from are never installed here** — source fixtures are read as text only, so no unmaintained third-party package enters the dependency tree.
- **Dependencies are a deliberate act** — install scripts are blocked unless individually allow-listed, freshly published versions are refused for 3 days, and CI installs only what the reviewed lockfile resolves.
- **Every GitHub Action is pinned to a full commit SHA**, and CodeQL, Dependency Review, and Dependabot run continuously alongside a high-severity `pnpm audit` gate.
- **Layered AI review before merge** — [CodeRabbit](https://coderabbit.ai) plus an independent adversarial Claude review (a different model from the one writing AI-authored changes), on top of required green CI, an approving review, and a human merge.

Full detail: [`SECURITY.md`](https://github.com/allxsmith/bestax/blob/main/SECURITY.md) · [Security guide](https://bestax.io/docs/guides/security)

## Telemetry

`bestax-migrate` can send one **anonymous** usage event after a successful
run — only if you opt in when asked (once, on an interactive terminal). The
event is just the run's shape — source library, CSS mode, the dry/deps flags, a
capped changed-file count, and per-rule TODO counts — plus the CLI version,
Node major version, and OS platform name. Never file paths, file contents,
code, names, IPs, or machine IDs, and no identifier exists that could link two
events together. Opt out any time with `--no-telemetry`,
`BESTAX_TELEMETRY=0`, or `DO_NOT_TRACK=1`.

Full disclosure of every field and control: [Telemetry guide](https://bestax.io/docs/guides/telemetry)

## License

Source code licensed MIT
