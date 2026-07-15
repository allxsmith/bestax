---
title: Security
sidebar_label: Security
sidebar_position: 10
---

# Security

How Bestax protects its supply chain, how you can verify what you install, and
where to report a vulnerability.

## What you install is what we built

Both published packages — `@allxsmith/bestax-bulma` and `create-bestax` — are
released with **npm provenance**: every version carries a signed attestation
generated at publish time that links the tarball on the registry to the exact
source commit and the public CI run that built it. Releases authenticate to
npm via **OIDC trusted publishing** (short-lived, per-run tokens), so there is
no long-lived npm token that could leak and be used to push a rogue release.

Only the **latest release line** of each package receives security fixes
(currently bestax-bulma 5.x and create-bestax 3.x). Releases are fully
automated from `main` via semantic-release, so the newest published version is
always the patched one — staying current is the supported posture. See
[SECURITY.md](https://github.com/allxsmith/bestax/blob/main/SECURITY.md) for
the full policy.

## Verify it yourself

- **Provenance on npmjs.com** — the package pages for
  [`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma)
  and [`create-bestax`](https://www.npmjs.com/package/create-bestax) show a
  _Provenance_ section linking each version to its source commit and build.
- **`npm audit signatures`** — in projects installed with the npm CLI, run it
  to check registry signatures and provenance attestations for every package
  in your tree, Bestax included. (It's an npm command — for pnpm or yarn
  projects, rely on the lockfile guidance below and the provenance UI on
  npmjs.com.)
- **Lockfiles** — commit your lockfile and install with a frozen/ci install
  (`npm ci`, `pnpm install --frozen-lockfile`) so your builds resolve exactly
  what you reviewed. Bestax's own CI does the same.

## How the repository is protected

The monorepo applies defense-in-depth against supply-chain attacks:

- **Dependency install scripts are blocked by default.** pnpm only runs
  install/postinstall scripts for an explicit allow-list of native builders —
  any dependency outside that short list can't execute code at install time.
- **A 3-day dependency cooldown.** By default, versions published less than 3
  days ago refuse to install, which defeats the common pattern where a
  hijacked package's malicious release is yanked within hours. (The dev-only
  `prettier` formatter is the one pinned exclusion.)
- **Isolated `node_modules`.** pnpm's isolated linker makes undeclared
  (phantom) dependencies fail loudly instead of silently resolving.
- **Frozen-lockfile CI.** Build and release jobs install with
  `--frozen-lockfile`; the only exception is the React 18/19 compatibility
  matrix, which deliberately re-resolves React for testing and never
  publishes.
- **SHA-pinned GitHub Actions.** Every third-party action is pinned to a full
  commit SHA, so a moved tag can't inject code into the pipeline.
- **CodeQL, dependency review, and Dependabot.** Code scanning covers the
  TypeScript sources and the workflow files themselves; a dependency-review
  gate blocks PRs that introduce dependencies with known advisories; grouped
  Dependabot PRs keep the tree current on a weekly cadence.

## Reporting a vulnerability

Please report privately — don't open a public issue:

- Email [security@bestax.io](mailto:security@bestax.io), or
- Use GitHub's private reporting: **Security → Advisories → Report a
  vulnerability** on the
  [repository](https://github.com/allxsmith/bestax/security).

You'll get an acknowledgment within 48 hours, and we aim to triage and
confirm within 7 days; the full disclosure process is in
[SECURITY.md](https://github.com/allxsmith/bestax/blob/main/SECURITY.md).
