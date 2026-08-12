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

A commit releases **only** the package its scope names:

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
- Commits of a releasing type (`feat`, `fix`, `perf`, `refactor`, `style`) **must** carry a
  scope of `bulma-ui`, `docs`, `create-bestax`, `bestax-migrate`, or `bestax-mcp` — enforced by commitlint
  ([`commitlint.config.js`](./commitlint.config.js)) via the husky `commit-msg` hook. This is
  what guarantees the per-scope release rules can't be bypassed by an unscoped commit.
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
2. If a release is due: version bump, `CHANGELOG.md` update, npm publish (OIDC trusted
   publishing — no `NPM_TOKEN`), a signed `chore(release): X.Y.Z [skip ci]` commit, git tag,
   and GitHub release.
3. A push may release any subset of the packages — they never bump each other.

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
