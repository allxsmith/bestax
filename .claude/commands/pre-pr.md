---
description: Run the full pre-PR gate (pnpm all) and self-review the diff against the component checklist
allowed-tools: Read, Bash(pnpm all), Bash(pnpm run:*), Bash(pnpm exec:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*)
---

# /pre-pr — gate + self-review before opening a PR

1. Run `pnpm all` (the pre-PR chain listed under Commands in `CLAUDE.md`).
   If it fails, report the failing task and stop: fix it before reviewing.
2. Read the working diff (`git status`, `git diff main...HEAD` plus any
   uncommitted changes). Check every diff against "Finishing a change" in
   the root `CLAUDE.md`, and against the `CLAUDE.md` in each directory the
   diff touches. If it adds a component, also review it against
   `CONTRIBUTING-COMPONENTS.md` (repo root — Read it), focusing on what CI
   can NOT catch:
   - prop-level changes without matching story/docs/skills updates
   - missing listing surfaces (guide page section, homepage card — step 2)
   - skills sync for themeable or shared-helper changes (step 3)
     Always check each commit's type and scope: a scope-gated type needs a
     scope from `RELEASE_SCOPES` in `commitlint.config.js`, and a change to
     more than one package needs a commit per package.
3. Report a short summary: gate result, then each checklist gap with the
   file to touch. Do not fix anything — this command only reviews.
