#!/usr/bin/env bash
# run-iteration.sh — one measured cold-start build for the skill-loop eval harness.
#
# Phases A–C of the loop protocol (see README.md): rebuild tooling → scaffold a fresh
# app → incognito `claude -p` build under a wall-clock watchdog → snapshot + metrics.
# Grading (D) and improving (E) are agent-driven; this script produces their inputs.
# Extracted from the pipeline that ran the original 10-iteration experiment (report.md).
#
# Usage:
#   bin/run-iteration.sh <run-id> <brief.md> <work-dir> [--model opus] [--budget 15]
#                        [--timeout 2700] [--runs-dir <dir>]
#
#   run-id    label for this run (e.g. i11, briefA-3) — becomes runs/<run-id>/
#   brief.md  the FROZEN builder prompt for this eval (see briefs/)
#   work-dir  where the app is scaffolded — MUST be outside any pnpm workspace/repo
#             tree (otherwise install workspace-links the local library instead of
#             the registry package)
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
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # eval/skill-loop
REPO="$(cd "$HARNESS_DIR/../.." && pwd)"                          # repo root
RUNS_DIR="$HARNESS_DIR/runs"

while [ $# -gt 0 ]; do
  case "$1" in
    --model)    MODEL="$2"; shift 2 ;;
    --budget)   BUDGET="$2"; shift 2 ;;
    --timeout)  TIMEOUT="$2"; shift 2 ;;
    --runs-dir) RUNS_DIR="$2"; shift 2 ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
done

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

RUN="$RUNS_DIR/$RUN_ID"
if [ -e "$RUN/metrics.json" ]; then echo "runs/$RUN_ID already has metrics.json — pick a new run-id" >&2; exit 1; fi
mkdir -p "$RUN" "$WORK"

echo "[$RUN_ID] rebuild create-bestax (syncs skills/ -> templates; picks up CLAUDE_MD edits)"
pnpm -C "$REPO" --filter create-bestax build >/dev/null

echo "[$RUN_ID] kill orphaned dev servers under $WORK (survivors steal :5173 strictPort)"
# Trailing `|| true`: "no vite running" / "no match" are exit-1 from pgrep|grep, not failures.
pgrep -fl vite | grep -F "$WORK" | awk '{print $1}' | while read -r p; do kill "$p" 2>/dev/null || true; done || true

echo "[$RUN_ID] scaffold + install + baseline tag"
APP="$WORK/app"
( cd "$WORK" && node "$REPO/create-bestax/dist/index.js" app -t vite-ts -b complete -i none --skills -y >/dev/null )
( cd "$APP" && pnpm install >/dev/null && git init -q && git add -A && git commit -qm baseline && git tag baseline )

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
node "$HARNESS_DIR/bin/collect-metrics.mjs" "$APP" "$RUN/transcript.jsonl" "$BRIEF_NAME" > "$RUN/metrics.json.tmp"
mv "$RUN/metrics.json.tmp" "$RUN/metrics.json"

node -e "
const m=require('$RUN/metrics.json');
console.log('[$RUN_ID] tsc_errors=%s build_pass=%s inline=%s rawcls=%s handrolled=%s imports=%s css_added=%s cost=\$%s turns=%s',
  m.tsc_errors, m.build_pass, m.inline_style_count, m.raw_bulma_classnames,
  m.handrolled_total, m.bestax_named_imports, m.custom_css_added_lines,
  m.cost_usd?.toFixed?.(2), m.num_turns);"
echo "[$RUN_ID] done: $RUN  (transcript stays on disk, gitignored)"
echo "[$RUN_ID] grade next — bin/grader-prompt.md with RUN=$RUN RUBRIC=$HARNESS_DIR/rubric.md COMPLETENESS=$COMPLETENESS"
