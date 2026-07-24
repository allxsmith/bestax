# eval/skill-loop — cold-start eval harness for the create-bestax AI tooling

A reusable harness for measuring how well an **unassisted, memoryless coding agent** uses
`@allxsmith/bestax-bulma` when guided only by what create-bestax ships (the 7 skills + the
generated app CLAUDE.md) — and for running improvement loops against that measurement.

It was built and validated by a 10-iteration experiment (baseline 85/100 → revised-runs
mean 95.2, builder cost −43%): full writeup in [report.md](report.md), per-run evidence in
[runs/](runs/), running narrative in [iteration-log.md](iteration-log.md).

## What a "run" is

One run = scaffold a fresh app with the **current** tooling → a cold-start
`claude -p` session (fresh cwd ⇒ no repo CLAUDE.md, empty auto-memory, registry-installed
library) builds a **frozen brief** in it → mechanized metrics + a rubric-graded scorecard.

```
bin/run-iteration.sh i11 briefs/skynet-saas.md /tmp/skill-loop-work/i11
```

does phases A–C (rebuild tooling → scaffold+install+baseline-tag → watchdogged incognito
build → snapshot + `metrics.json`). Grading and improving are agent phases (below).

## The loop protocol (what the 10-run experiment executed)

| Phase | Actor                  | What happens                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A–C   | `bin/run-iteration.sh` | Scaffold, cold-start build (45-min watchdog, `--max-budget-usd` cap), snapshot, metrics. Builder timeout/budget-kill/broken output **is a datapoint** — grade what exists, never fix the app. Scaffold/install failures are infra: retry, don't count the run.                                                                                                                                                                                                                                            |
| D     | grader subagent        | Dispatch with [bin/grader-prompt.md](bin/grader-prompt.md) + the frozen [rubric.md](rubric.md). Read-only; mechanized metrics are ground truth it may not contradict; no cross-run comparisons. Orchestrator writes `runs/<id>/scorecard.md`.                                                                                                                                                                                                                                                             |
| E     | improver subagent      | Dispatch with [bin/improver-prompt.md](bin/improver-prompt.md). Editable surface: `skills/**`, the `CLAUDE_MD()` template in `create-bestax/src/constants.ts`, `scripts/gen-component-catalog.mjs`. Hard guardrails: guidance stays generic (no eval-brief leakage), verify every fact against `bulma-ui/src` before writing it, line budgets, noise rule (act only on metric-corroborated / repeated / plainly-factual findings). **After i-final: compare-only, no edits** — nothing unvalidated ships. |
| F     | orchestrator           | `pnpm gen:catalog` (if generator/docs changed) → `pnpm --filter create-bestax build` (**always** after skills/template edits — scaffolds read the synced copy, not `skills/`) → commit one `chore:` per iteration.                                                                                                                                                                                                                                                                                        |

**Frozen per eval, never edited mid-loop:** the brief, the rubric, the invocation flags,
the caps, the model. Improvements go into the tooling — never into the prompt or the
yardstick, or runs stop being comparable.

## Comparing variants (prompts, skills states, models)

The loop above varies exactly one factor — tooling state — against a frozen
brief+rubric+model. The same harness compares anything else the same way:

- **Brief/prompt A vs B:** add `briefs/<name>.md` per variant, same rubric+model+tooling;
  run n per variant with distinct run-ids (`briefA-1`, `briefB-1`, …).
- **Skills state A vs B:** check out each state, rebuild create-bestax, run n each.
- **Model A vs B:** `--model` flag, everything else frozen.

Read mechanized metrics first (they don't drift with grader mood), scorecards second.
**One run is one sample** — the experiment saw ±6-point single-run swings with identical
tooling (runs i05/i10 in [report.md](report.md)); trends need several runs per variant,
and adjacent-pair deltas are weak evidence.

## Writing a new eval

1. Write the brief (`briefs/<name>.md`) — what the cold agent is asked to build. Freeze it.
2. Write (or reuse) the rubric — anchored 0/half/full descriptors per category, and say
   which categories are mechanized. Freeze it.
3. Decide caps (`--timeout`, `--budget`, `--model`) and n. Freeze them.
4. Keep loop state in a `state.json` (current run, phase, completed→commit-SHA map) so an
   interrupted loop resumes from committed artifacts — every finished run is durable.

## Gotchas (all learned the hard way — details in report.md §threats + iteration-log)

- **Work dirs must live outside the repo tree** or `pnpm install` workspace-links the
  local `bulma-ui` instead of the registry package. The runner enforces this.
- **Rebuild create-bestax after every `skills/` or `constants.ts` edit** — the scaffolder
  copies `templates/skills/` (synced at build time), not `skills/`. The runner always
  rebuilds first.
- The scaffolder takes a **bare directory name** relative to cwd (absolute paths are
  rejected by the project-name validator).
- **Nested `claude` invocation** (verified flag set, in the runner): `env -u CLAUDECODE`,
  `--setting-sources project` (no user-level settings bleed), `--no-session-persistence`,
  `< /dev/null` (skips a 3 s stdin wait). A fresh work dir per run ⇒ empty auto-memory.
- **Kill orphaned dev servers between runs** — a builder's `npm run dev` child can outlive
  it and squat `:5173` (`--strictPort`), breaking the next run's preview. Runner does this.
- Metrics caveats (known, keep in mind when reading `metrics.json`):
  - `handrolled_tags` regex-matches JSX **comments** too (one false positive in run i09);
  - `skill_files` harvests Read-tool paths only — builders that `cat`/`sed` references
    show an empty list while `skill_file_reads` still counts them;
  - `claude_md_read` is `false` in every run — CLAUDE.md is auto-injected by `claude -p`;
    judge CLAUDE.md engagement by whether its rules show up in the code.
- Graders err: 3 of 10 scorecards in the experiment contained a factual error. The
  improver prompt's transcript cross-check caught them — keep that step.

## Layout

```
briefs/            frozen builder prompts (one per eval variant)
rubric.md          the frozen 100-pt rubric used by the original experiment
bin/run-iteration.sh    phases A–C, turnkey
bin/collect-metrics.mjs mechanized metrics (JSON to stdout)
bin/grader-prompt.md    phase-D subagent instructions
bin/improver-prompt.md  phase-E subagent instructions + guardrails
runs/<id>/         per-run record: metrics.json, scorecard.md, notes.md
                   (builder.diff + app-src/ + transcript.jsonl stay local, gitignored)
report.md          the original 10-run experiment's full findings
iteration-log.md   the original experiment's per-iteration narrative
```

The original experiment's bulky evidence (app-src snapshots, builder diffs, transcripts)
lives on the archived branch `chore/skill-improvement-loop`, not here.
