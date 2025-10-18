---
name: '⬆️ Dependency Upgrade'
about: Track upgrades for Docusaurus, Storybook, Turbo, and other major dependencies
title: '[Upgrade] <dependency name and version>'
labels: dependencies, enhancement, triage
assignees: allxsmith
---

## Dependencies to Upgrade

Please check the dependencies that need to be upgraded:

### Docusaurus
- [ ] @docusaurus/core@latest
- [ ] @docusaurus/preset-classic@latest
- [ ] @docusaurus/theme-live-codeblock@latest
- [ ] @docusaurus/module-type-aliases@latest
- [ ] @docusaurus/types@latest

**Upgrade command:**
```bash
npm i @docusaurus/core@latest @docusaurus/preset-classic@latest @docusaurus/theme-live-codeblock@latest @docusaurus/module-type-aliases@latest @docusaurus/types@latest --workspace=docs
```

### Storybook
- [ ] Storybook (Current: 9.0.12, Available: 9.1.11)

**Upgrade command:**
```bash
npx storybook@latest upgrade
```

### Turbo
- [ ] Turbo (Current: v2.5.4, Available: v2.5.8)

**Upgrade command:**
```bash
npx @turbo/codemod@latest update
```

### Other Dependencies
- [ ] Other (please specify):

---

## Current Versions

Please document the current versions before upgrading:

- Docusaurus:
- Storybook: 9.0.12
- Turbo: v2.5.4
- Other:

---

## Target Versions

Please document the target versions:

- Docusaurus: latest
- Storybook: 9.1.11
- Turbo: v2.5.8
- Other:

---

## Affected Package(s)

Which package(s) in the monorepo will be affected?

- [ ] bulma-ui (`@allxsmith/bestax-bulma`) - Storybook
- [ ] docs (`@allxsmith/bestax-docs`) - Docusaurus
- [ ] Root - Turbo
- [ ] Other (please specify):

---

## Breaking Changes

Are there any breaking changes in the new versions? Please document:

- [ ] No breaking changes expected
- [ ] Breaking changes identified (list below):

**Breaking changes:**


---

## Testing Plan

Please describe how the upgrades will be tested:

- [ ] Run `npm run build` to ensure all packages build
- [ ] Run `npm run test` to ensure all tests pass
- [ ] Run `npm run lint` to ensure linting passes
- [ ] Run `npm run typecheck` to ensure type checking passes
- [ ] Run `npm run storybook` to verify Storybook works
- [ ] Run `npm run docs` to verify Docusaurus works
- [ ] Run `npm run all` for complete quality checks
- [ ] Manual testing of key functionality
- [ ] Other (please specify):

---

## Migration Notes

Document any migration steps or configuration changes needed:


---

## Links

- Docusaurus Changelog: https://docusaurus.io/changelog
- Storybook Changelog: https://github.com/storybookjs/storybook/blob/main/CHANGELOG.md
- Turbo Changelog: https://github.com/vercel/turborepo/releases
- Other:

---

## Additional Context

Add any other context, warnings, or notes about the dependency upgrades:
