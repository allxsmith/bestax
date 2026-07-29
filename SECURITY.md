# Security Policy

## Supported Versions

Security fixes land on the **latest release line only** — currently
`@allxsmith/bestax-bulma` 5.x, `create-bestax` 3.x, and `bestax-migrate` 1.x.
All three packages release automatically from `main` (semantic-release), so the
latest published version is always the patched one. Older majors may still work
but receive no security updates; please upgrade.

| Package                   | Supported    | Unsupported |
| ------------------------- | ------------ | ----------- |
| `@allxsmith/bestax-bulma` | 5.x (latest) | < 5.0       |
| `create-bestax`           | 3.x (latest) | < 3.0       |
| `bestax-migrate`          | 1.x (latest) | —           |

## Supply-Chain Security

Measures active in this repository and its release pipeline:

- **Install scripts blocked by default** — pnpm refuses dependency
  install/postinstall scripts unless explicitly allow-listed
  (`allowBuilds` in `pnpm-workspace.yaml`).
- **Dependency cooldown** — by default, versions published less than 3 days
  ago won't install (`minimumReleaseAge`), defending against just-published
  malicious releases. Exceptions are listed in `minimumReleaseAgeExclude` and
  are the deliberate minority: `prettier` is excluded (and pinned) so
  formatting stays deterministic and is never shipped to users, and an
  individual package may be excluded temporarily to pull an urgent security
  patch in ahead of the cooldown — each such entry carries an inline rationale
  and a removal date.
- **Isolated `node_modules`** — pnpm's isolated linker prevents phantom
  (undeclared) dependencies from being imported.
- **Frozen lockfile in CI** — builds and releases install with
  `pnpm install --frozen-lockfile`, so what ships is exactly what the
  reviewed lockfile resolves. (The React 18/19 compatibility matrix is the
  one deliberate exception: it re-resolves to pin the requested React major
  for testing, and never publishes.)
- **npm provenance** — all three published packages set
  `publishConfig.provenance`, so every release carries a signed attestation
  linking the tarball to the exact commit and CI run that built it.
- **OIDC trusted publishing** — releases authenticate to npm with
  short-lived OIDC tokens minted per run; there is no long-lived `NPM_TOKEN`
  to steal.
- **SHA-pinned GitHub Actions** — every third-party action is pinned to a
  full commit SHA, not a movable tag.
- **Socket.dev** — the Socket GitHub App reviews every pull request for
  malware, install scripts, obfuscated code, and privilege escalation in
  dependency changes, and posts two required checks. Its policy is managed in
  the Socket dashboard rather than in this repository, so it has no config
  file here.
- **CodeQL** — GitHub code scanning runs on JavaScript/TypeScript and the
  workflow files themselves. It uses GitHub's _default setup_, so there is no
  `codeql.yml` in `.github/workflows/`.
- **OpenSSF Scorecard** — `.github/workflows/scorecard.yml` scores this
  repository's supply-chain posture weekly and publishes the result publicly.
- **Dependency review** — a workflow blocks PRs that introduce dependencies
  with known advisories.
- **Dependabot** — weekly, grouped dependency update PRs.
- **Protected `main`** — unsigned commits, force pushes, and branch deletion
  are rejected. Merges require green CI (`Build and Test`, the React 18/19
  compatibility matrix, and `Dependency Review`) plus an approving review.
- **Layered automated review** — every PR is reviewed by CodeRabbit and by an
  independent adversarial Claude review that deliberately runs a different
  model from the one used to write AI-authored changes. AI agents working in
  this repository are barred from modifying the workflows, release
  configuration, or supply-chain settings that gate them.

Consumers can verify provenance themselves: the npm package pages show the
attestation ("Provenance" section), and — in projects installed with the npm
CLI — `npm audit signatures` checks registry signatures and provenance
attestations for everything in your tree.

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
