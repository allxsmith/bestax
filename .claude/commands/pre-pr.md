---
description: Run the full pre-PR gate (pnpm all) and self-review the diff against the component checklist
allowed-tools: Bash(pnpm all), Bash(pnpm run:*), Bash(pnpm exec:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*)
---

# /pre-pr — gate + self-review before opening a PR

1. Run `pnpm all` (build, typecheck, test+coverage, bundle:stats, lint,
   format:check, storybook build). If it fails, report the failing task and
   stop — fix before reviewing.
2. Read the working diff (`git status`, `git diff main...HEAD` plus any
   uncommitted changes) and review it against the checklist in
   `/CONTRIBUTING-COMPONENTS.md`, focusing on what CI can NOT catch:
   - prop-level changes without matching story/docs/skills updates
   - missing listing surfaces (guide page section, homepage card — step 2)
   - skills sync for themeable or shared-helper changes (step 3)
   - commit message type/scope (`feat|fix|perf|refactor|style` need scope
     `bulma-ui|docs|create-bestax`)
3. Report a short summary: gate result, then each checklist gap with the
   file to touch. Do not fix anything — this command only reviews.
