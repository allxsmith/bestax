# skill-loop iteration log

One entry per iteration: scores, mechanized-metric highlights, changes applied, anomalies.
Newest entries at the bottom. Commit SHAs recorded so the report can link per-iteration diffs.

---

## i00 — setup (2026-07-23)

- Worktree `chore/skill-improvement-loop` created from main @ 4aecef2; `pnpm install` +
  `pnpm --filter create-bestax build` green (sync-skills copied all 7 skills).
- Smoke test: scaffolded `smoke` app (note: scaffolder requires a **bare dir name** relative
  to cwd — absolute paths are rejected by the project-name validator), registry install
  resolved `@allxsmith/bestax-bulma@5.8.0`, nested
  `env -u CLAUDECODE claude -p … --setting-sources project` run discovered **all 7 skills**,
  read CLAUDE.md, exited 0 with parseable stream-json and `total_cost_usd` populated
  ($0.127). `< /dev/null` added to the frozen invocation (skips a 3s stdin wait).
- Frozen from here on: `base-prompt.md`, `rubric.md`, invocation flags, caps
  (45 min / $15 / opus).
