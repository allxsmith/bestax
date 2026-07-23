# skill-loop — empirical improvement loop for the create-bestax AI tooling

Ten iterations of: scaffold a fresh app with the **current** skills → a cold-start
("incognito") Opus 4.8 `claude -p` session builds a fixed SaaS brief in it → grade against
the frozen [rubric.md](rubric.md) → revise `skills/` + the `CLAUDE_MD()` template in
`create-bestax/src/constants.ts` from the findings → rebuild create-bestax → next iteration.
Iteration i01 is the unmodified baseline. `base-prompt.md` and `rubric.md` are **frozen** —
improvements go into the skills, never into the prompt or the yardstick.

## Layout

- `base-prompt.md`, `rubric.md` — frozen inputs
- `bin/collect-metrics.mjs <appDir> <transcript.jsonl>` — mechanized metrics (JSON to stdout)
- `state.json` — loop state machine; updated at every phase boundary; source of truth
- `iteration-log.md` — human-readable running log (scores, changes, anomalies)
- `runs/iNN/` — per-iteration artifacts: `metrics.json`, `scorecard.md`, `builder.diff`,
  `app-src/` (final src snapshot), `notes.md`; `transcript.jsonl` + `builder-stderr.log`
  stay on disk only (gitignored)
- `report.md`, `issue-draft.md` — final synthesis (written after i10)

## Per-iteration phases (recorded in state.json)

A `scaffolding` → B `building` → C `snapshotting` → D `grading` → E `improving` →
F `committed` (→ G optional visual check). Scaffold/install failures are infra (retry ×2,
don't consume an iteration). Builder timeout/budget-exhaustion/broken output **is a
datapoint** — grade it, never fix the app. After i10: compare-only, no edits.

## The frozen incognito invocation

From the app dir (scaffolded into the session scratchpad, OUTSIDE this repo, so pnpm
installs from the registry):

```bash
env -u CLAUDECODE claude -p "$(cat base-prompt.md)" \
  --model opus --output-format stream-json --verbose \
  --dangerously-skip-permissions --setting-sources project \
  --no-session-persistence --max-budget-usd 15
```

45-min wall-clock watchdog wraps the process (macOS has no timeout(1)). The smoke-test
result and the exact verified flag set are recorded in `state.json.flags_verified`.

## Resuming after interruption

1. Read `state.json`. Every iteration listed in `completed` is durable (committed).
2. If `phase` is mid-flight and the scratchpad app dir no longer exists (new session ⇒ new
   scratchpad), restart the current iteration from Phase A — nothing measured is lost.
3. Before any scaffold, ensure `pnpm --filter create-bestax build` has run since the last
   `skills/` or `constants.ts` edit (`rebuild_done_for_next_scaffold` flag).

## Guardrails (binding on the improve phase)

- Never edit `rubric.md`, `base-prompt.md`, or anything under `runs/`.
- Skill guidance stays generic — no leakage of the eval brief (Skynet/Netadyne/SaaS copy).
- Respect `skills/CLAUDE.md` authoring contract; hand-written bundle ≤ 3,950 lines
  (baseline 3,599), net +60 lines/iteration unless offset; `CLAUDE_MD()` output ≤ 90 lines.
- `skills/bestax-custom-component/references/component-catalog.md` is generated — never
  hand-edit (change `scripts/gen-component-catalog.mjs` or `docs/docs/api/**` and run
  `pnpm gen:catalog`; flag such changes prominently).
- Noise rule: one build is one sample — act only on metric-corroborated, repeated, or
  plainly factual findings.
