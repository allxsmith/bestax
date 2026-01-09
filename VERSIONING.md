# Synchronized Versioning Strategy

This monorepo uses **synchronized versioning** between `@allxsmith/bestax-bulma` and `create-bestax` packages.

## How It Works

Both packages maintain **identical version numbers** and are released together whenever either package has changes.

### Release Rules

Both packages analyze commits with the following scopes:

- `feat(bulma-ui)` or `feat(create-bestax)` → **Minor version bump** (e.g., 1.0.0 → 1.1.0)
- `fix(bulma-ui)` or `fix(create-bestax)` → **Patch version bump** (e.g., 1.0.0 → 1.0.1)
- Breaking changes in either → **Major version bump** (e.g., 1.0.0 → 2.0.0)

### Ignored Scopes

The following scopes do NOT trigger releases:

- `docs` - Documentation changes
- `chore` - Maintenance tasks
- `ci` - CI/CD configuration
- `test` - Test updates
- `build` - Build system changes

## Example Scenarios

### Scenario 1: bulma-ui Feature

```bash
git commit -m "feat(bulma-ui): add new Modal component"
```

**Result:**

- ✅ `@allxsmith/bestax-bulma`: 1.0.0 → 1.1.0
- ✅ `create-bestax`: 1.0.0 → 1.1.0
- Both packages published with version 1.1.0

### Scenario 2: create-bestax Fix

```bash
git commit -m "fix(create-bestax): correct template scaffolding issue"
```

**Result:**

- ✅ `@allxsmith/bestax-bulma`: 1.1.0 → 1.1.1
- ✅ `create-bestax`: 1.1.0 → 1.1.1
- Both packages published with version 1.1.1

### Scenario 3: Documentation Update

```bash
git commit -m "docs: update README"
```

**Result:**

- ❌ No version bump
- ❌ No packages published

### Scenario 4: Mixed Changes

```bash
git commit -m "feat(bulma-ui): add Button variants"
git commit -m "fix(create-bestax): fix icon library setup"
```

**Result:**

- ✅ `@allxsmith/bestax-bulma`: 1.1.1 → 1.2.0 (minor wins over patch)
- ✅ `create-bestax`: 1.1.1 → 1.2.0
- Both packages published with version 1.2.0

## Why Synchronized Versioning?

1. **User Clarity**: Users always know which versions work together
2. **Simplified Dependency Management**: create-bestax templates always use the matching bulma-ui version
3. **Consistent Releases**: Both packages stay in lockstep, reducing confusion

## Version Determination

When commits affect both packages, the **highest semantic level** determines the bump:

- Major > Minor > Patch
- Breaking change > feat > fix

## Release Process

The CI workflow (`ci.yml`) handles releases automatically:

1. Analyzes all commits since last release
2. Determines version bump based on commit scopes
3. Publishes `@allxsmith/bestax-bulma` first
4. Publishes `create-bestax` with the same version
5. Creates git tags for both packages
6. Updates CHANGELOGs
7. Creates GitHub releases

## Commit Message Format

Follow conventional commits with scopes:

```bash
<type>(<scope>): <subject>

# Examples:
feat(bulma-ui): add new component
fix(create-bestax): resolve scaffolding bug
docs: update API documentation
chore(bulma-ui): refactor tests
```

## Initial Setup

The packages were manually synchronized to version **2.3.3** to establish the baseline for synchronized versioning.

Commit used:

```bash
git commit -m "chore: synchronize package versions to 2.3.3 [skip ci]"
```

## Manual Version Sync

In rare cases where versions drift (e.g., after manual intervention), you can manually sync by:

1. Updating both `package.json` files to the same version
2. Committing with `chore: sync package versions to X.X.X [skip ci]`
3. Creating matching git tags if needed (usually not necessary)

## Troubleshooting

**Q: What if I only want to release one package?**
A: Not supported with this strategy. Both packages always release together to maintain version parity.

**Q: Can I still use docs commits?**
A: Yes! Commits with `scope: docs` or `type: docs` won't trigger releases.

**Q: What about pre-releases?**
A: Configure pre-release branches in both `release.config.js` files identically.

## Related Files

- `bulma-ui/release.config.js` - Semantic release config for bulma-ui
- `create-bestax/release.config.js` - Semantic release config for create-bestax
- `.github/workflows/ci.yml` - CI/CD workflow with release steps
