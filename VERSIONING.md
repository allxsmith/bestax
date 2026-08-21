# Independent Versioning Strategy

`@allxsmith/bestax-bulma`, `create-bestax`, `bestax-migrate`, and `bestax-mcp` are versioned
and released **independently**. Each package releases only when a commit is scoped to it — the
version numbers are unrelated (e.g. bestax-bulma 5.x alongside create-bestax 3.x).

The source of truth is the `releaseRules` in each package's semantic-release config:
[`bulma-ui/release.config.js`](./bulma-ui/release.config.js),
[`create-bestax/release.config.js`](./create-bestax/release.config.js),
[`bestax-migrate/release.config.js`](./bestax-migrate/release.config.js), and
[`bestax-mcp/release.config.js`](./bestax-mcp/release.config.js).

## Release Rules

A commit releases **only** the package its scope names. Representative examples — the same
`feat`/`fix`/`perf`/`refactor`/`style` and `BREAKING CHANGE:` rules apply to every package
through its own scope:

| Commit                                                            | bestax-bulma | create-bestax | bestax-migrate | bestax-mcp |
| ----------------------------------------------------------------- | ------------ | ------------- | -------------- | ---------- |
| `feat(bulma-ui): …`                                               | minor        | —             | —              | —          |
| `fix(bulma-ui): …`                                                | patch        | —             | —              | —          |
| `perf/refactor/style(bulma-ui): …`                                | patch        | —             | —              | —          |
| `feat(create-bestax): …`                                          | —            | minor         | —              | —          |
| `fix(bestax-migrate): …`                                          | —            | —             | patch          | —          |
| `feat(bestax-mcp): …`                                             | —            | —             | —              | minor      |
| `feat(bulma-ui): …` + `BREAKING CHANGE:` footer                   | major        | —             | —              | —          |
| `docs: …`, `chore: …`, `ci: …`, `test: …`, `build: …` (any scope) | —            | —             | —              | —          |

Notes:

- **Breaking changes require a `BREAKING CHANGE:` footer** in the commit body. The angular
  commit-analyzer preset does **not** parse `feat(bulma-ui)!:` bang headers.
- Commits of a releasing type (`feat`, `fix`, `perf`, `refactor`, `style`, `revert`) **must**
  carry a scope of `bulma-ui`, `docs`, `create-bestax`, `bestax-migrate`, or `bestax-mcp` —
  enforced by commitlint ([`commitlint.config.js`](./commitlint.config.js)) via the husky
  `commit-msg` hook. This is what guarantees the per-scope release rules can't be bypassed by
  an unscoped commit.
- `revert` is scope-gated too: commit-analyzer's default rules ship
  `{ revert: true, release: 'patch' }`, so an unscoped revert would patch-release **every**
  package. A scoped `revert(bulma-ui): …` patch-releases only its package. Caveat: commitlint's
  default ignores skip git-revert-style `Revert "…"` messages entirely, so keep reverts in
  conventional form.
- A commit scoped to `docs` never releases any package.

## Tags & Changelogs

Each package tags and logs its own releases:

- `@allxsmith/bestax-bulma@X.Y.Z` tags, changelog at `bulma-ui/CHANGELOG.md`
- `create-bestax@X.Y.Z` tags, changelog at `create-bestax/CHANGELOG.md`
- `bestax-migrate@X.Y.Z` tags, changelog at `bestax-migrate/CHANGELOG.md`
- `bestax-mcp@X.Y.Z` tags, changelog at `bestax-mcp/CHANGELOG.md`

## Release Process

On merge to `main`, CI (`.github/workflows/ci.yml`) runs semantic-release in each package:

1. Each package analyzes the commits since **its own** last tag against its `releaseRules`.
2. If a release is due: version bump, `CHANGELOG.md` update, publish to npm (OIDC trusted
   publishing — no `NPM_TOKEN`), a signed `chore(release): X.Y.Z [skip ci]` commit, git tag,
   and GitHub release.
   - **Every package publishes with `pnpm publish`** (`@semantic-release/exec`), not
     `npm publish`. `@semantic-release/npm` stays in each chain with `npmPublish: false`
     purely for its `prepare` step, which writes the version the release commit carries.
     bestax-migrate moved first, because it keeps a `workspace:` devDependency and
     `npm publish` ships that protocol verbatim — which is how its 1.0.0 went out
     uninstallable (#412, #436); the other three followed once one real release had proved
     the OIDC handshake (#532). The publish command and the reasons behind each of its flags
     live in `scripts/lib/pnpm-publish.mjs`.
   - Note the ordering, because it decides what a failed publish costs: semantic-release runs
     **every** `prepare` step — including the release commit and tag — before **any** `publish`
     step. A publish that fails leaves the commit and tag behind, and that version is spent.
3. A push may release any subset of the packages — they never bump each other.

Five things about that publish step are load-bearing, and none of them fails loudly:

- **`--provenance` is required.** pnpm reads `publishConfig.registry` and `.access` but takes
  `provenance` from options only. `publishConfig.provenance` is deliberately absent from every
  manifest rather than left in place: it does nothing under pnpm, and the most likely reason
  anyone would delete the flag is reading `"provenance": true` in a package.json and concluding
  it is redundant. Drop the flag and #411's provenance quietly stops being produced.
- **`--embed-readme` is required.** pnpm defaults it to false where npm defaults it to true;
  without it the npmjs.com page loses its README.
- **There is deliberately no `--tag`.** Correct only while every release goes to `latest`,
  which holds because every package's `branches` is `['main']` so the channel is always null.
  Adding a maintenance or prerelease branch means deriving the dist-tag first, and that
  derivation is not naive — see `scripts/lib/pnpm-publish.mjs`. A test fails if `branches`
  changes, so the decision cannot be made silently.
- **The publish command redirects pnpm's output to stderr.** `@semantic-release/exec` parses
  stdout as the JSON release object; pnpm prints prose there. Without the redirect the parse
  fails and the "release is available on" comment posted to every linked issue and PR shows a
  bare tag instead of an npm link. The reasoning, including why the trailing `|| true` lives in
  the shell rather than the script, is in `scripts/lib/pnpm-publish.mjs`.
- **The auth pre-flight is weaker than it was.** `@semantic-release/npm` exchanged a real OIDC
  token during `verifyConditions`. With `npmPublish: false` that is off, so
  `scripts/verify-oidc-context.mjs` runs as the exec plugin's `verifyConditionsCmd` and checks
  only that an OIDC context exists; it does not prove npm will accept the token. Combined with
  the ordering above, a failed publish spends the version.

Outside CI, each package's `prepack` and `prepublishOnly` hooks run
`scripts/require-pnpm-publish.mjs`, which refuses packers it recognises as not being pnpm — so
a stray `npm publish` or `npm pack` exits with an explanation instead of shipping a manifest
nobody can install. It is a guard against the likely mistake, not a proof: `--ignore-scripts`
skips it, and a tarball packed elsewhere carries no guard with it.

`main` is ruleset-protected, so the release commit and tag are pushed by a dedicated
GitHub App that is the ruleset's only automation bypass — not by `github-actions[bot]`.
The commit is still GPG-signed with the maintainer's key, so it shows as **Verified**.

Preview locally without publishing: see "semantic-release dry-run" in
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Example Scenarios

```bash
git commit -m "feat(bulma-ui): add new Modal variant"
# → bestax-bulma minor bump; create-bestax untouched

git commit -m "fix(create-bestax): correct template scaffolding issue"
# → create-bestax patch bump; bestax-bulma untouched

git commit -m "docs: update README"
# → no release

git commit -m "feat(bulma-ui): rename Theme props" -m "BREAKING CHANGE: bulmaVars renamed to vars"
# → bestax-bulma major bump
```

## History

Versions 2.x and earlier used a synchronized scheme where both packages released together with
identical version numbers. That was removed — the per-scope `release: false` rules in each
config exist precisely so a `feat(bulma-ui)` commit no longer bumps `create-bestax`.
