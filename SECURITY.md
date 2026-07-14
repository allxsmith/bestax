# Security Policy

## Supported Versions

Security fixes land on the **latest release line only** — currently
`@allxsmith/bestax-bulma` 5.x and `create-bestax` 3.x. Both packages release
automatically from `main` (semantic-release), so the latest published version
is always the patched one. Older majors may still work but receive no security
updates; please upgrade.

| Package                   | Supported    | Unsupported |
| ------------------------- | ------------ | ----------- |
| `@allxsmith/bestax-bulma` | 5.x (latest) | < 5.0       |
| `create-bestax`           | 3.x (latest) | < 3.0       |

## Supply-Chain Security

Measures active in this repository and its release pipeline:

- **Install scripts blocked by default** — pnpm refuses dependency
  install/postinstall scripts unless explicitly allow-listed
  (`allowBuilds` in `pnpm-workspace.yaml`).
- **Dependency cooldown** — versions published less than 3 days ago won't
  install (`minimumReleaseAge`), defending against just-published malicious
  releases.
- **Isolated `node_modules`** — pnpm's isolated linker prevents phantom
  (undeclared) dependencies from being imported.
- **Frozen lockfile in CI** — builds and releases install with
  `pnpm install --frozen-lockfile`, so what ships is exactly what the
  reviewed lockfile resolves. (The React 18/19 compatibility matrix is the
  one deliberate exception: it re-resolves to pin the requested React major
  for testing, and never publishes.)
- **npm provenance** — both published packages set
  `publishConfig.provenance`, so every release carries a signed attestation
  linking the tarball to the exact commit and CI run that built it.
- **OIDC trusted publishing** — releases authenticate to npm with
  short-lived OIDC tokens minted per run; there is no long-lived `NPM_TOKEN`
  to steal.
- **SHA-pinned GitHub Actions** — every third-party action is pinned to a
  full commit SHA, not a movable tag.
- **CodeQL** — GitHub code scanning runs on JavaScript/TypeScript and the
  workflow files themselves.
- **Dependency review** — a workflow blocks PRs that introduce dependencies
  with known advisories.
- **Dependabot** — weekly, grouped dependency update PRs.

Consumers can verify provenance themselves: the npm package pages show the
attestation ("Provenance" section), and `npm audit signatures` checks
registry signatures and provenance attestations for everything in your tree.

## Reporting a Vulnerability

If you discover a security vulnerability in this library, please report it responsibly. Do not disclose the issue publicly until we've had a chance to address it.

### How to Report

- **Email us**: Send details to [security@bestax.io](mailto:security@bestax.io).
- **GitHub Security Advisory**: Under GitHub's Security tab, under Advisories. Press the "Report a vulnerability" button to report a vulnerability privately.
- Include as much information as possible: steps to reproduce, affected versions, potential impact, and any suggested fixes.

### What to Expect

- We will acknowledge your report within 48 hours.
- We aim to triage and confirm the issue within 7 days.
- If accepted, we'll work on a fix and coordinate a disclosure timeline with you.
- If declined (e.g., not a vulnerability or out of scope), we'll explain why.
- Credit: We'll credit you in the release notes or advisory unless you prefer anonymity.

We appreciate your help in keeping our library secure!

## Additional Notes

- For vulnerabilities in dependencies, please report them to the upstream projects.
- We follow responsible disclosure practices and may publish advisories on GitHub once resolved.
