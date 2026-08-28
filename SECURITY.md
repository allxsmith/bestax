# Security Policy

## Supported Versions

Security fixes land on the **latest release line only** — currently
`@allxsmith/bestax-bulma` 5.x, `create-bestax` 4.x, `bestax-migrate` 2.x, and
`bestax-mcp` 1.x. All four packages release automatically from `main`
(semantic-release), so the latest published version is always the patched one.
Older majors may still work but receive no security updates; please upgrade.

| Package                   | Supported    | Unsupported |
| ------------------------- | ------------ | ----------- |
| `@allxsmith/bestax-bulma` | 5.x (latest) | < 5.0       |
| `create-bestax`           | 4.x (latest) | < 4.0       |
| `bestax-migrate`          | 2.x (latest) | < 2.0       |
| `bestax-mcp`              | 1.x (latest) | —           |

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
  patch in ahead of the cooldown. Every such bypass — here, in `overrides`, and
  in `auditConfig.ignoreGhsas` — carries a `# bestax:review <date>` marker in
  the comment above it stating why, and CI fails once that date arrives
  (`check:conformance --only=bypass-expiry`), so a temporary exception cannot
  quietly become permanent. The date is a review-by, not a removal deadline:
  it forces the question, and the answer may be to extend it with a reason.
  Standing policy that is not debt, like the `prettier` pin, is marked
  `# bestax:permanent` instead.
- **Isolated `node_modules`** — pnpm's isolated linker prevents phantom
  (undeclared) dependencies from being imported.
- **Frozen lockfile in CI** — builds and releases install with
  `pnpm install --frozen-lockfile`, so what ships is exactly what the
  reviewed lockfile resolves. (The React 18/19 compatibility matrix is the
  one deliberate exception: it re-resolves to pin the requested React major
  for testing, and never publishes.)
- **npm provenance** — every release now carries a signed attestation linking
  the tarball to the exact commit and CI run that built it (versions older than
  the currently supported lines predate it). Releases come from CI
  and nowhere else, which is what backs that claim. No package carries a
  `publishConfig.provenance` — having one would imply the flag was redundant,
  and dropping the flag is the quiet way to lose attestations entirely. The
  `prepack`/`prepublishOnly` guards refuse packers they recognise as not being
  pnpm. They cannot see CLI flags at all, so they do not refuse a hand-run
  `pnpm publish` that omits `--provenance`; the `prepublishOnly` hook prints an
  unconditional reminder on every non-CI hand publish — including one that
  passes the flags correctly — and only outside CI, so that inspecting a
  tarball with `pnpm pack` stays quiet. Why it works that way is in
  [`VERSIONING.md`](./VERSIONING.md#release-process).
- **Licence text comes from the workspace root** — no package carries its own
  `LICENSE` file, and `pnpm publish` copies the root one into every tarball.
  npm did not, so releases before #532 shipped none. It is the right file
  today because every package is MIT, but a package published under different
  terms would need its own `LICENSE` rather than inheriting this one.
- **OIDC trusted publishing** — releases authenticate to npm with
  short-lived OIDC tokens minted per run; there is no long-lived `NPM_TOKEN`
  to steal.
- **SHA-pinned GitHub Actions** — every third-party action is pinned to a
  full commit SHA, not a movable tag.
- **Socket.dev** — the Socket GitHub App reviews every pull request for
  malware, install scripts, obfuscated code, and privilege escalation in
  dependency changes, and posts two checks on every pull request. Its policy
  is managed in the Socket dashboard rather than in this repository, so it has
  no config file here.
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
  These rules live in a repository ruleset. It has exactly one automation
  bypass: a GitHub App that carries out the release. Its token pushes
  semantic-release's signed `chore(release)` commit and tag — the only writes
  that bypass the ruleset — and is also what `@semantic-release/github`
  authenticates with to create the GitHub Release and to comment on and label
  the issues and pull requests a release closes. Its permissions are therefore
  `contents`, `issues` and `pull-requests` write, scoped to this repository
  alone. The token expires after an hour and is minted only after the install
  and build steps have run, so repo-owned build code can never reach it.
- **Layered automated review** — every PR is reviewed by CodeRabbit and by an
  independent adversarial Claude review that deliberately runs a different
  model from the one used to write AI-authored changes. AI agents working in
  this repository are barred from modifying the workflows, release
  configuration, or supply-chain settings that gate them.
- **Inbound security triage** — new issues and pull requests are assessed by a
  read-only AI session for three things: code crafted to harm whoever runs it,
  prompt injection aimed at this repository's own automation, and social
  engineering. Anything not positively clean is labeled `needs-security-review`,
  which every AI entry point we control refuses until a maintainer clears it.
  Three properties make it worth trusting: it **fails closed** (a crashed or
  unparsable scan flags rather than passes), the session holds **no write tools,
  no PAT, and no write-scoped token** so an injected scan cannot post or act —
  the labeling runs in a separate job, with its own credentials, that the
  session never executes in — and its reasoning is never
  published — only a coarse category — so a flag cannot be used as an oracle for
  tuning an evasion. A clean verdict covers the text as it stood when the item
  opened, not edits made afterwards.

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
