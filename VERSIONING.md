# Independent Versioning Strategy

`@allxsmith/bestax-bulma`, `create-bestax`, `bestax-migrate`, `bestax-mcp`, and
`@allxsmith/eslint-plugin-bestax` are versioned
and released **independently**. Each package releases when a commit is scoped to it, except that
bestax-mcp also releases with bestax-bulma ([below](#bestax-mcp-releases-with-bestax-bulma)). The
version numbers are unrelated (e.g. bestax-bulma 5.x alongside create-bestax 3.x).

The source of truth is the `releaseRules` in each package's semantic-release config:
[`bulma-ui/release.config.js`](./bulma-ui/release.config.js),
[`create-bestax/release.config.js`](./create-bestax/release.config.js),
[`bestax-migrate/release.config.js`](./bestax-migrate/release.config.js),
[`bestax-mcp/release.config.js`](./bestax-mcp/release.config.js), and
[`eslint-plugin/release.config.js`](./eslint-plugin/release.config.js).

## Release Rules

A commit releases **only** the package its scope names, apart from the bestax-mcp patch that
follows every bestax-bulma release ([below](#bestax-mcp-releases-with-bestax-bulma)). Representative
examples follow, and the same `feat`/`fix`/`perf`/`refactor`/`style` and `BREAKING CHANGE:` rules
apply to every package through its own scope:

| Commit                                          | bestax-bulma | create-bestax | bestax-migrate | bestax-mcp | eslint-plugin |
| ----------------------------------------------- | ------------ | ------------- | -------------- | ---------- | ------------- |
| `feat(bulma-ui): …`                             | minor        | —             | —              | patch      | —             |
| `fix(bulma-ui): …`                              | patch        | —             | —              | patch      | —             |
| `perf/refactor/style(bulma-ui): …`              | patch        | —             | —              | patch      | —             |
| `feat(create-bestax): …`                        | —            | minor         | —              | —          | —             |
| `fix(bestax-migrate): …`                        | —            | —             | patch          | —          | —             |
| `feat(bestax-mcp): …`                           | —            | —             | —              | minor      | —             |
| `feat(eslint-plugin): …`                        | —            | —             | —              | —          | minor         |
| `feat(bulma-ui): …` + `BREAKING CHANGE:` footer | major        | —             | —              | patch      | —             |

Notes:

- **Breaking changes require a `BREAKING CHANGE:` footer** in the commit body. The angular
  commit-analyzer preset does **not** parse `feat(bulma-ui)!:` bang headers.
- Commits of a scope-gated type (`feat`, `fix`, `perf`, `refactor`, `style`, `revert`) **must**
  carry a scope of `bulma-ui`, `docs`, `create-bestax`, `bestax-migrate`, `bestax-mcp`, or
  `eslint-plugin` —
  enforced by commitlint ([`commitlint.config.js`](./commitlint.config.js)) via the husky
  `commit-msg` hook. This is what guarantees the per-scope release rules can't be bypassed by
  an unscoped commit.
- `revert` is scope-gated too, but a scoped revert **releases nothing** — plan rollbacks
  accordingly. The only revert rule anywhere is commit-analyzer's default
  `{ revert: true, release: 'patch' }`, keyed on the parser's revert _detection_, and the
  angular `revertPattern` matches only a `Revert "…"`/`revert: …` header followed by a
  `This reverts commit <sha>` body — a scoped `revert(bulma-ui): …` header is invisible to
  it, and no `releaseRules` entry here names the `revert` type. To actually publish a
  rollback, follow the revert with `fix(<scope>): …` (or commit the rollback as a `fix`
  directly). The hazard runs the other way for git's own `Revert "…"` form, which
  commitlint's default ignore rules let through unexamined: with its generated body it trips the default
  revert rule with **no scope to confine it** and would patch-release every package — so
  keep reverts in conventional, scoped form, and don't expect them to publish on their own.
- A commit scoped to `docs` never releases any package.

### bestax-mcp releases with bestax-bulma

bestax-mcp ships an index of the library, and a new index only reaches npm when bestax-mcp
releases. So every commit that releases bestax-bulma releases bestax-mcp too, in the same run, and
the published index keeps up with the library (#932). That release is a patch whatever
bestax-bulma's own bump, a major included. The rules, the reasons for them and what they do to
bestax-mcp's changelog are in [`bestax-mcp/release.config.js`](./bestax-mcp/release.config.js),
and `scripts/release-rules.test.mjs` holds them to bulma-ui's.

## Tags & Changelogs

Each package tags and logs its own releases:

- `@allxsmith/bestax-bulma@X.Y.Z` tags, changelog at `bulma-ui/CHANGELOG.md`
- `create-bestax@X.Y.Z` tags, changelog at `create-bestax/CHANGELOG.md`
- `bestax-migrate@X.Y.Z` tags, changelog at `bestax-migrate/CHANGELOG.md`
- `bestax-mcp@X.Y.Z` tags, changelog at `bestax-mcp/CHANGELOG.md`
- `@allxsmith/eslint-plugin-bestax@X.Y.Z` tags, changelog at
  `eslint-plugin/CHANGELOG.md`

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
3. A push may release any subset of the packages. None bumps another, apart from bestax-mcp
   following bestax-bulma.

For `bestax-mcp`, the GitHub release then triggers `.github/workflows/mcp-registry.yml`, which
lists that version in the official MCP Registry. The listing is metadata pointing at the npm
package, and the registry accepts it only once npm serves that version with its `mcpName`, so
a release whose npm publish failed gets no listing.

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

`bestax-migrate`'s Codemod Registry package (`bestax-migrate/codemod/`) is not part of this
process. It pins one `bestax-migrate` release, which semantic-release does not move, so a
release leaves the registry serving the previous version until a `build(bestax-migrate)`
change moves the pin and a maintainer publishes it with `codemod-registry.yml`. The steps
are in [`CONTRIBUTING.md`](./CONTRIBUTING.md#codemod-registry-bestax-migrate).

## Example Scenarios

```bash
git commit -m "feat(bulma-ui): add new Modal variant"
# → bestax-bulma minor bump, bestax-mcp patch; create-bestax untouched

git commit -m "fix(create-bestax): correct template scaffolding issue"
# → create-bestax patch bump; bestax-bulma untouched

git commit -m "docs: update README"
# → no release

git commit -m "feat(bulma-ui): rename Theme props" -m "BREAKING CHANGE: bulmaVars renamed to vars"
# → bestax-bulma major bump, bestax-mcp patch
```

## History

Versions 2.x and earlier used a synchronized scheme where both packages released together with
identical version numbers. That was removed — the per-scope `release: false` rules in each
config exist precisely so a `feat(bulma-ui)` commit no longer bumps `create-bestax`.
