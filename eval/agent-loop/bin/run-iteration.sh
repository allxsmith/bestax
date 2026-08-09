#!/usr/bin/env bash
# run-iteration.sh — one measured cold-start build for the agent-loop eval harness.
#
# Phases A–C of the loop protocol (see README.md): rebuild tooling → scaffold a fresh
# app → incognito `claude -p` build under a wall-clock watchdog → snapshot + metrics.
# Grading (D) and improving (E) are agent-driven; this script produces their inputs.
# Extracted from the pipeline that ran the original 10-iteration experiment (report.md).
#
# Usage:
#   bin/run-iteration.sh <run-id> <brief.md> <work-dir> [--model opus] [--budget 15]
#                        [--timeout 2700] [--runs-dir <dir>]
#                        [--scaffold-skills yes|no] [--post-scaffold <cmd>]
#                        [--rubric <rubric.md>]
#
#   run-id    label for this run (e.g. i11, briefA-3) — becomes runs/<run-id>/
#   brief.md  the FROZEN builder prompt for this eval (see briefs/)
#   work-dir  where the app is scaffolded — MUST be outside any pnpm workspace/repo
#             tree (otherwise install workspace-links the local library instead of
#             the registry package)
#
# The two guidance-channel options exist so a loop can measure a channel OTHER than the
# bundled skills (the MCP server, say) without a second copy of this script. Both default
# to the original behaviour, so an existing call site is unaffected:
#   --scaffold-skills no    scaffold with --no-skills: no .claude/skills/, no CLAUDE.md
#   --post-scaffold <cmd>   run `<cmd> "$APP"` after scaffold+install, before the builder
#                           starts — the hook for writing .mcp.json or other config
#
# --rubric names the rubric this run is to be GRADED against (default rubric.md). This
# script never grades; it only records the choice and its declared version into
# metrics.json, so a scorecard is always attributable to a yardstick.
#
# The builder's exit code is recorded, not enforced: a timeout/budget kill is a valid
# datapoint — grade what exists, never fix the app. The one exception is a builder that
# never started (empty transcript): that is infra failure, and the run is refused rather
# than recorded, because the untouched scaffold's metrics look like a perfect build.

# Fail fast: a broken rebuild/scaffold/install/snapshot/metrics step is INFRA failure, not a
# datapoint — it must not fall through to "done" and record a run built from stale tooling.
# The builder's own exit code is captured inside its subshell (below) and stays unenforced.
set -euo pipefail

RUN_ID="${1:?usage: run-iteration.sh <run-id> <brief.md> <work-dir> [...]}"
BRIEF="${2:?missing brief.md}"
WORK="${3:?missing work-dir}"
shift 3

MODEL=opus BUDGET=15 TIMEOUT=2700
SCAFFOLD_SKILLS=yes POST_SCAFFOLD=
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # eval/agent-loop
REPO="$(cd "$HARNESS_DIR/../.." && pwd)"                          # repo root
RUNS_DIR="$HARNESS_DIR/runs"
RUBRIC="$HARNESS_DIR/rubric.md"

while [ $# -gt 0 ]; do
  case "$1" in
    --model)    MODEL="$2"; shift 2 ;;
    --budget)   BUDGET="$2"; shift 2 ;;
    --timeout)  TIMEOUT="$2"; shift 2 ;;
    --runs-dir) RUNS_DIR="$2"; shift 2 ;;
    --scaffold-skills) SCAFFOLD_SKILLS="$2"; shift 2 ;;
    --post-scaffold)   POST_SCAFFOLD="$2"; shift 2 ;;
    --rubric)   RUBRIC="$2"; shift 2 ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
done

# The rubric is phase D's authority, not phase C's — this script never grades. It records
# WHICH rubric the run is to be graded against, because rubric.md itself says to "record
# which rubric version a loop ran against" and nothing did: a scorecard six months on could
# not tell you whether its 96 was out of v1's weights or v2's. Resolved and read here so a
# bad path fails now rather than at grading time, after the money is spent.
if [ ! -f "$RUBRIC" ] || [ ! -r "$RUBRIC" ]; then
  echo "rubric must be a readable file: $RUBRIC" >&2
  exit 1
fi
RUBRIC="$(cd "$(dirname "$RUBRIC")" && pwd)/$(basename "$RUBRIC")"
RUBRIC_NAME="$(basename "$RUBRIC")"
# `**Rubric version: N**` — the declaration every rubric file carries near its top.
RUBRIC_VERSION="$(sed -n 's/^\*\*Rubric version: *\([0-9][0-9]*\)\*\*.*/\1/p' "$RUBRIC" | head -1)"
if [ -z "$RUBRIC_VERSION" ]; then
  echo "no '**Rubric version: N**' line in $RUBRIC — add one before running" >&2
  exit 1
fi

# Validated here rather than passed through: a typo like --scaffold-skills non would
# otherwise reach create-bestax as neither flag and silently scaffold WITH skills, which
# is the exact condition the run is trying to exclude.
case "$SCAFFOLD_SKILLS" in
  yes) SKILLS_FLAG=--skills ;;
  no)  SKILLS_FLAG=--no-skills ;;
  *)   echo "--scaffold-skills must be yes or no (got: $SCAFFOLD_SKILLS)" >&2; exit 1 ;;
esac

# Canonicalization alone accepts a NONEXISTENT file under an existing directory, and the
# builder is launched with `claude -p "$(cat "$0")"` — so a typo'd brief path yields an empty
# prompt and burns a full run on nothing. Infra failure: check before launching.
if [ ! -f "$BRIEF" ] || [ ! -r "$BRIEF" ]; then
  echo "brief must be a readable file: $BRIEF" >&2
  exit 1
fi
if [ ! -s "$BRIEF" ]; then
  echo "brief is empty: $BRIEF" >&2
  exit 1
fi
BRIEF="$(cd "$(dirname "$BRIEF")" && pwd)/$(basename "$BRIEF")"
BRIEF_NAME="$(basename "$BRIEF" .md)"
# Rubric category 7 is brief-specific and its anchors live beside the brief. Warn now rather
# than at grading time, so a missing addendum is fixable while the build is still running.
# Not fatal: the run itself is valid evidence either way; only phase D needs this file.
COMPLETENESS="${BRIEF%.md}.completeness.md"
if [ ! -f "$COMPLETENESS" ]; then
  echo "[$RUN_ID] WARNING: no completeness addendum at $COMPLETENESS" >&2
  echo "[$RUN_ID]          rubric category 7 (15 pts) cannot be graded for this brief until" >&2
  echo "[$RUN_ID]          you write one — see rubric.md §7 and briefs/skynet-saas.completeness.md" >&2
fi

# Resolve WORK to an absolute, symlink-free path BEFORE the isolation check — a relative arg
# like "eval/work" would otherwise slip past a raw prefix match and scaffold inside the repo,
# where pnpm workspace-links the local library and invalidates the registry-package measurement.
# Resolved without creating anything, so a rejected work-dir leaves no directory behind.
if [ -d "$WORK" ]; then
  WORK="$(cd "$WORK" && pwd -P)"
else
  # Not created yet: walk up to the nearest existing ancestor and canonicalize from there,
  # so a fresh nested work-dir still resolves (mkdir -p semantics are preserved below).
  work_tail="" work_probe="$WORK"
  while [ ! -d "$work_probe" ]; do
    work_tail="$(basename "$work_probe")${work_tail:+/$work_tail}"
    work_next="$(dirname "$work_probe")"
    if [ "$work_next" = "$work_probe" ]; then break; fi
    work_probe="$work_next"
  done
  if [ ! -d "$work_probe" ]; then echo "cannot resolve work-dir: $WORK" >&2; exit 1; fi
  WORK="$(cd "$work_probe" && pwd -P)/$work_tail"
fi
# Trailing slashes on both sides make this a path-COMPONENT test: /repo/eval/work is rejected,
# a sibling like /repo-scratch is not.
REPO_REAL="$(cd "$REPO" && pwd -P)"
case "$WORK/" in "$REPO_REAL"/*) echo "work-dir must be OUTSIDE the repo tree: $WORK" >&2; exit 1 ;; esac

# Loop isolation. The shipped runs/ holds the COMPLETED, committed i01-i10 loop. The improver
# consumes a runs directory as one loop's evidence, so writing a new run there hands it ten
# months-old scorecards from another brief and tooling revision as if they were this loop's.
# Refused rather than warned: the failure is silent wrong comparisons, not a visible error.
if [ "$(cd "$RUNS_DIR" 2>/dev/null && pwd -P || echo "$RUNS_DIR")" = "$(cd "$HARNESS_DIR/runs" && pwd -P)" ]; then
  echo "runs/ is the archived i01-i10 loop — give this loop its own directory:" >&2
  echo "  bin/run-iteration.sh $RUN_ID <brief> <work-dir> --runs-dir <fresh-dir>" >&2
  exit 1
fi

RUN="$RUNS_DIR/$RUN_ID"
if [ -e "$RUN/metrics.json" ]; then echo "runs/$RUN_ID already has metrics.json — pick a new run-id" >&2; exit 1; fi
mkdir -p "$RUN" "$WORK"
# Absolute from here on. The builder subshell runs `cd "$APP"`, so a relative --runs-dir
# resolves against the APP and every redirection into "$RUN" fails — the builder never
# starts, and the failure surfaces as three "No such file or directory" lines attributed to
# the brief (bash reports $0). Canonicalized after mkdir, matching BRIEF and WORK above.
RUN="$(cd "$RUN" && pwd -P)"

echo "[$RUN_ID] rebuild create-bestax (syncs skills/ -> templates; picks up CLAUDE_MD edits)"
pnpm -C "$REPO" --filter create-bestax build >/dev/null

echo "[$RUN_ID] kill orphaned dev servers under $WORK (survivors steal :5173 strictPort)"
# Match "$WORK/" not "$WORK": a bare prefix also matches SIBLINGS — with WORK=/tmp/work it
# would kill dev servers under /tmp/work-old and /tmp/workspace, i.e. another loop's run.
# Same path-component boundary the work-dir isolation check enforces above.
# Trailing `|| true`: "no vite running" / "no match" are exit-1 from pgrep|grep, not failures.
pgrep -fl vite | grep -F "$WORK/" | awk '{print $1}' | while read -r p; do kill "$p" 2>/dev/null || true; done || true

echo "[$RUN_ID] scaffold ($SKILLS_FLAG) + install + baseline tag"
APP="$WORK/app"
( cd "$WORK" && node "$REPO/create-bestax/dist/index.js" app -t vite-ts -b complete -i none "$SKILLS_FLAG" -y >/dev/null )
( cd "$APP" && pnpm install >/dev/null )

# Guidance-channel setup — runs BEFORE the baseline commit on purpose. Config the harness
# installs is not builder output; committing it into `baseline` keeps it out of
# builder.diff and out of files_changed_vs_baseline, so the app_modified gate still means
# "the builder changed something".
if [ -n "$POST_SCAFFOLD" ]; then
  echo "[$RUN_ID] post-scaffold hook: $POST_SCAFFOLD"
  # Unquoted on purpose: the option carries a command line ("node bin/install-mcp.mjs"),
  # not a single executable path.
  # shellcheck disable=SC2086
  $POST_SCAFFOLD "$APP"
fi

( cd "$APP" && git init -q && git add -A && git commit -qm baseline && git tag baseline )

echo "[$RUN_ID] incognito build: model=$MODEL budget=\$$BUDGET timeout=${TIMEOUT}s"
date -u +%Y-%m-%dT%H:%M:%SZ > "$RUN/started-at.txt"
( cd "$APP" && env -u CLAUDECODE bash -c '
    claude -p "$(cat "$0")" --model "$2" --output-format stream-json --verbose \
      --dangerously-skip-permissions --setting-sources project \
      --no-session-persistence --max-budget-usd "$3" < /dev/null \
      > "$1/transcript.jsonl" 2> "$1/builder-stderr.log" &
    pid=$!
    ( sleep "$4"; kill -TERM $pid 2>/dev/null; sleep 30; kill -KILL $pid 2>/dev/null ) & w=$!
    wait $pid; rc=$?; kill $w 2>/dev/null
    echo "$rc" > "$1/builder-exit-code.txt"
    date -u +%Y-%m-%dT%H:%M:%SZ > "$1/finished-at.txt"
  ' "$BRIEF" "$RUN" "$MODEL" "$BUDGET" "$TIMEOUT" )

RC="$(cat "$RUN/builder-exit-code.txt" 2>/dev/null || echo unknown)"
echo "[$RUN_ID] builder exited rc=$RC (nonzero = timeout/budget/crash — still a datapoint)"

# A builder that was KILLED still wrote events before dying — that is a datapoint, and the
# exit code above stays unenforced for it. A builder that never STARTED emits nothing, and
# is infra failure in the same class as a failed scaffold. The two are distinguishable by
# exactly this: an empty transcript. Without the check, the pristine scaffold's own numbers
# (build_pass=true, tsc_errors=0, handrolled_total=0) get written as metrics.json, and
# rubric category 1 — "scored directly from metrics.json" — reads 15/15 for a run in which
# nothing happened.
if [ ! -s "$RUN/transcript.jsonl" ]; then
  echo "[$RUN_ID] builder produced NO output — infra failure, NOT a datapoint. Cause:" >&2
  sed 's/^/  /' "$RUN/builder-stderr.log" >&2 2>/dev/null || true
  echo "[$RUN_ID] refusing to write metrics.json: the untouched scaffold would score 15/15" >&2
  echo "[$RUN_ID] on build integrity. Fix the cause and re-run $RUN_ID." >&2
  exit 1
fi

echo "[$RUN_ID] snapshot + mechanized metrics"
( cd "$APP" && git add -A && git diff baseline > "$RUN/builder.diff" )
mkdir -p "$RUN/app-src"
cp -R "$APP/src" "$RUN/app-src/src"
cp "$APP/package.json" "$RUN/app-src/" 2>/dev/null || true
cp "$APP/index.html" "$RUN/app-src/" 2>/dev/null || true
# Write via a temp file: a collector crash must not leave a truncated metrics.json behind,
# which would both look like a datapoint and trip the "already has metrics.json" guard on retry.
TOOLING_REV="$(git -C "$REPO" rev-parse --short HEAD 2>/dev/null || echo unknown)"
# Serialized by node, not printf: a quote or backslash in --model, --budget or the brief
# basename produces invalid JSON, and the collector's fallback would then read the whole
# blob as a bare brief name and silently drop the run identity.
RUN_META="$(node -e 'process.stdout.write(JSON.stringify({
  brief: process.argv[1], model: process.argv[2], budget_usd: process.argv[3],
  timeout_s: process.argv[4], tooling_rev: process.argv[5],
  rubric: process.argv[6], rubric_version: process.argv[7],
}))' "$BRIEF_NAME" "$MODEL" "$BUDGET" "$TIMEOUT" "$TOOLING_REV" "$RUBRIC_NAME" "$RUBRIC_VERSION")"
node "$HARNESS_DIR/bin/collect-metrics.mjs" "$APP" "$RUN/transcript.jsonl" "$RUN_META" > "$RUN/metrics.json.tmp"
mv "$RUN/metrics.json.tmp" "$RUN/metrics.json"

node -e "
const m=require('$RUN/metrics.json');
console.log('[$RUN_ID] tsc_errors=%s build_pass=%s inline=%s rawcls=%s handrolled=%s imports=%s css_added=%s cost=\$%s turns=%s',
  m.tsc_errors, m.build_pass, m.inline_style_count, m.raw_bulma_classnames,
  m.handrolled_total, m.bestax_named_imports, m.custom_css_added_lines,
  m.cost_usd?.toFixed?.(2), m.num_turns);"
echo "[$RUN_ID] done: $RUN  (transcript stays on disk, gitignored)"
echo "[$RUN_ID] grade next — bin/grader-prompt.md with RUN=$RUN RUBRIC=$RUBRIC COMPLETENESS=$COMPLETENESS"
