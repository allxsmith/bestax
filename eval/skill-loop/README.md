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
bin/run-iteration.sh i11 briefs/skynet-saas.md /tmp/skill-loop-work/i11 \
  --runs-dir eval/skill-loop/runs-2026-08
```

does phases A–C (rebuild tooling → scaffold+install+baseline-tag → watchdogged incognito
build → snapshot + `metrics.json`). Grading and improving are agent phases (below).

### Measuring a guidance channel other than the shipped skills

By default a run measures what create-bestax ships. Two options let a loop point the builder
at something else instead of, or alongside, that — both default to the behaviour above, so a
call site that omits them is unaffected:

| Option                      | Default | What it does                                                                                                     |
| --------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `--scaffold-skills yes\|no` | `yes`   | Picks `--skills` / `--no-skills` on the scaffold. `no` means no `.claude/skills/` and no app `CLAUDE.md`.        |
| `--post-scaffold <cmd>`     | none    | Runs `<cmd> "$APP"` after install and **before** the baseline commit — the hook for writing config into the app. |

The hook runs pre-baseline on purpose: config the harness installs is not builder output, so
committing it into `baseline` keeps it out of `builder.diff` and out of
`files_changed_vs_baseline`, and the `app_modified` gate keeps meaning "the builder changed
something".

`bin/install-mcp.mjs` is the hook the MCP eval uses — it writes an `.mcp.json` pointing at
this repo's **local** `bestax-mcp/dist/index.js`, and refuses if that build or its generated
data is missing (a server that never connects is indistinguishable in the transcript from
one the builder chose not to call). Run `pnpm --filter bestax-mcp build` first:

```
bin/run-iteration.sh m01 briefs/skynet-saas-mcp.md /tmp/mcp-eval-m01 \
  --runs-dir eval/skill-loop/runs-mcp --scaffold-skills no \
  --post-scaffold "node eval/skill-loop/bin/install-mcp.mjs"
```

The collector counts that channel too: `mcp_tool_calls`, `mcp_tools_used` and
`mcp_resource_reads`. They exist because rubric category 8 reads `skill_file_reads` /
`skill_files` / `claude_md_read`, all correctly zero in a run with no skills on disk — a
builder that queried an MCP server 41 times before writing a line would otherwise score 0/10
for engagement. Grading such a run means **re-anchoring category 8 in that run's `notes.md`,
not editing `rubric.md`**; see [runs-mcp/m01/notes.md](runs-mcp/m01/notes.md) for the worked
form. Categories 1–7 are unaffected and stay directly comparable.

Note that a server which _serves_ the skills does not remove them from the run — the m01
builder pulled four skills through `get_skill` with no `.claude/skills/` present. Such a
comparison measures **delivery mechanism**, not presence of guidance; say so in the notes.

**Every loop needs its own `--runs-dir`.** Phase E consumes a runs directory as one loop's
evidence, so a new run dropped beside an old loop's scorecards hands the improver another
brief's, another tooling revision's findings as if they were this loop's. The shipped
`runs/` is the completed, committed i01–i10 loop; the runner **refuses** to write into it.

## The loop protocol (what the 10-run experiment executed)

| Phase | Actor                  | What happens                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A–C   | `bin/run-iteration.sh` | Scaffold, cold-start build (45-min watchdog, `--max-budget-usd` cap), snapshot, metrics. Builder timeout/budget-kill/broken output **is a datapoint** — grade what exists, never fix the app. Scaffold/install failures are infra: retry, don't count the run. So is a builder that never _started_ (empty transcript — e.g. `claude` refusing to launch): the runner refuses to write `metrics.json` rather than record the untouched scaffold, whose `build_pass=true, tsc_errors=0, handrolled_total=0` would score 15/15 on category 1.                                                                           |
| D     | grader subagent        | Dispatch with [bin/grader-prompt.md](bin/grader-prompt.md) + the frozen [rubric.md](rubric.md). Read-only; mechanized metrics are ground truth it may not contradict; no cross-run comparisons. Dispatched with `$RUN`, `$RUBRIC` and `$COMPLETENESS`; orchestrator writes `$RUNS_DIR/<id>/scorecard.md`.                                                                                                                                                                                                                                                                                                             |
| E     | improver subagent      | Dispatch with [bin/improver-prompt.md](bin/improver-prompt.md) and `$RUNS_DIR` — **this loop's runs directory only**; it reads that whole directory as the loop's evidence. Editable surface: `skills/**`, the `CLAUDE_MD()` template in `create-bestax/src/constants.ts`, `scripts/gen-component-catalog.mjs`. Hard guardrails: guidance stays generic (no eval-brief leakage), verify every fact against `bulma-ui/src` before writing it, line budgets, noise rule (act only on metric-corroborated / repeated / plainly-factual findings). **After i-final: compare-only, no edits** — nothing unvalidated ships. |
| F     | orchestrator           | `pnpm gen:catalog` (if generator/docs changed) → `pnpm --filter create-bestax build` (**always** after skills/template edits — scaffolds read the synced copy, not `skills/`) → commit one `chore:` per iteration.                                                                                                                                                                                                                                                                                                                                                                                                    |

**Frozen per eval, never edited mid-loop:** the brief, its completeness addendum, the
rubric, the invocation flags, the caps, the model. Improvements go into the tooling — never
into the prompt or the yardstick, or runs stop being comparable. _Frozen means for the
duration of a loop, not forever_ — refine the rubric between loops if it measures the wrong
thing, and record which version a loop ran against.

## Comparing variants (prompts, skills states, models)

The loop above varies exactly one factor — tooling state — against a frozen
brief+rubric+model. The same harness compares anything else the same way:

- **Brief/prompt A vs B:** add `briefs/<name>.md` **and its
  `briefs/<name>.completeness.md`** per variant, same core rubric+model+tooling; run n per
  variant with distinct run-ids (`briefA-1`, `briefB-1`, …). **Compare the 85-pt core
  (categories 1–6 and 8), never the totals** — category 7 scores each brief against its own
  surface list, so cross-brief totals are not the same measurement. `metrics.brief` records
  which brief a run built.
- **Skills state A vs B:** check out each state, rebuild create-bestax, run n each.
- **Model A vs B:** `--model` flag, everything else frozen.

Read mechanized metrics first (they don't drift with grader mood), scorecards second.
**One run is one sample** — the experiment saw ±6-point single-run swings with identical
tooling (runs i05/i10 in [report.md](report.md)); trends need several runs per variant,
and adjacent-pair deltas are weak evidence.

## Writing a new eval

1. Write the brief (`briefs/<name>.md`) — what the cold agent is asked to build. Freeze it.
2. Write its completeness addendum (`briefs/<name>.completeness.md`) — the surfaces
   category 7 requires, and which skills category 8 should expect. **Grader-only: never
   show it to the builder**, or you have told it what it is scored on. `rubric.md` is
   brief-agnostic and gets reused unchanged; the runner warns if the addendum is missing.
3. Decide caps (`--timeout`, `--budget`, `--model`) and n. Freeze them.
4. Give the loop its own `--runs-dir` (e.g. `runs-2026-08/`). Phase E reads that directory
   as this loop's complete evidence, so it must contain this loop's runs and no others.
5. Keep loop state in a `state.json` (current run, phase, completed→commit-SHA map) so an
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
- **The collector measures the baseline diff BEFORE running its own tsc/vite.** It has to:
  `tsc -b` writes `tsconfig.tsbuildinfo` into the app root and the scaffold `.gitignore`
  does not cover it (scaffold flag, recorded in `runs/i09`), so measuring afterwards would
  count the collector's own artifacts as builder work and mark every run modified —
  silently disabling the rubric gate. `bin/test-app-modified.mjs` guards the ordering.
- **A clean-looking build can mean nothing happened.** The pristine scaffold typechecks and
  builds, so `build_pass=true, tsc_errors=0` is also what an untouched app reports — and
  `inline_style_count`, `raw_bulma_classnames` and `handrolled_total` all read 0 for it,
  which looks like flawless work. Check **`app_modified`** before reading any of them;
  rubric category 1 scores `app_modified=false` as 0, ahead of the 15 anchor.
- Metrics caveats (known, keep in mind when reading `metrics.json`):
  - `handrolled_tags` regex-matches JSX **comments** too (one false positive in run i09);
  - each run records its identity — `brief`, `model`, `budget_usd`, `timeout_s`,
    `tooling_rev` — so "the previous run of the same variant" is mechanically determinable
    instead of inferred from run-id ordering. In the committed i01–i10 metrics `tooling_rev`
    is `null`: `report.md`'s per-iteration commit table lists the commit each improve pass
    _produced_, not the revision each run was _built against_, so it was left unknown rather
    than guessed. The model and caps there are backfilled from `report.md` §Method, which
    lists them as frozen for the whole experiment;
  - `files_changed_vs_baseline` is `null` in the committed i01–i10 metrics — the exact count
    is not recomputable, since those app-src git repos are archived rather than committed.
    Their `app_modified: true` is proven from data the runs already carry — every one has
    `custom_css_added_lines > 0`, which is by definition divergence from the baseline tag —
    not assumed. Like the pair above, it is deliberately **not** reproducible by the
    collector's `files_changed_vs_baseline > 0` derivation, which would read `null` as
    `false` and wrongly zero a real run under the gate. Check the same artifact's
    `custom_css_added_lines` if you want to re-verify; only the archived runs carry this;
  - `skill_file_reads` counts every tool input mentioning `.claude/skills/`, so a bare
    listing (`ls .claude/skills/`) counts as a "read" — it **over-reports** category-8
    engagement. Read it alongside `skill_files`, which now holds only resolved file paths:
    a listing contributes to the count but not the list;
  - all skill counters match the forward-slash literal only, so a Windows-style backslash
    path would be invisible to every one of them (consistently — the harness is POSIX-only);
  - `skill_files` is harvested from every tool input (Bash `cat`/`sed` included).
    `skill_refs_unresolved` counts references the pattern could not turn into a whole path:
    a bare directory listing, a full expansion (`.claude/skills/${skill}/SKILL.md`), or a
    _partial_ one (`.claude/skills/bestax-${name}/SKILL.md`, which would otherwise capture
    the fragment `bestax-`). A capture counts only when it stops at a real delimiter rather
    than a shell metacharacter. `skill_files_complete` is `true` only when the unresolved
    count is zero — only then is `skill_files` the full inventory rather than whatever
    happened to be recoverable. Residual limitation: a skill path quoted _and_ containing a
    space would still truncate silently; generated skill directories are kebab-case, so this
    has not occurred, but the flag does not prove it cannot;
  - the committed i01–i10 metrics predate both fixes and their transcripts are archived, not
    committed, so completeness cannot be recomputed: `skill_files_complete` is `null`
    (unknown) there, except i05/i08/i10, which are `false`. A nonzero read count with no
    recovered path does **not** on its own prove incompleteness — `skill_file_reads` counts
    directory listings too, and a run of pure listings resolves nothing while missing
    nothing. What proves it for those three is their scorecards, which document `cat`/`sed`
    reads of actual reference **files** (i10: "10 file reads (cat/sed…)"; i08: reads before
    first Write incl. `archetypes.md`; i05: "cat'd references"). Treat `null` as "not
    established", never as a pass. Note that
    this `false`-beside-`null` pair is hand-set and is **not** reproducible by the
    collector's own "complete when unresolved is zero" derivation: incompleteness is proven
    without an exact count. Only the historical files carry it; anything the collector emits
    derives both fields from one pass;
  - `app_dir` records only the trailing `<run>/<app>` segments — the scaffold lives outside
    the repo, so its absolute path is host-specific and is deliberately not committed;
  - `claude_md_read` is `false` in every run — CLAUDE.md is auto-injected by `claude -p`;
    judge CLAUDE.md engagement by whether its rules show up in the code.
- Graders err: 3 of 10 scorecards in the experiment contained a factual error. The
  improver prompt's transcript cross-check caught them — keep that step.

## Layout

```
briefs/<name>.md   frozen builder prompt (one per eval variant)
briefs/<name>.completeness.md
                   its category-7 surface list + expected skills — GRADER-ONLY,
                   never shown to the builder
rubric.md          brief-agnostic core rubric (85 pts); + category 7 (15) = 100
bin/run-iteration.sh    phases A–C, turnkey
bin/collect-metrics.mjs mechanized metrics (JSON to stdout)
bin/install-mcp.mjs     --post-scaffold hook: writes .mcp.json pointing at the
                        LOCAL bestax-mcp build (see "Measuring a guidance
                        channel other than the shipped skills" above)
bin/lib/skill-paths.mjs shared skill-path harvest (imported by the collector
                        AND its guard, so the guard cannot drift from the code)
bin/test-skill-paths.mjs regression guard — `node bin/test-skill-paths.mjs`;
                        run it before and after touching that pattern
bin/test-app-modified.mjs guard for app_modified (what the rubric gate zeroes a
                        run on): real git fixtures, stubbed toolchain
bin/grader-prompt.md    phase-D subagent instructions
bin/improver-prompt.md  phase-E subagent instructions + guardrails
runs/<id>/         the ARCHIVED i01–i10 loop; the runner refuses to write here
runs-<loop>/<id>/  one directory per loop (--runs-dir), each holding only that
                   loop's runs: metrics.json, scorecard.md, notes.md
                   (builder.diff + app-src/ + transcript.jsonl stay local, gitignored)
report.md          the original 10-run experiment's full findings
iteration-log.md   the original experiment's per-iteration narrative
```

The original experiment's bulky evidence (app-src snapshots, builder diffs, transcripts)
lives on the archived branch `chore/skill-improvement-loop`, not here.
