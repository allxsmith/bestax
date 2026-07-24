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
# datapoint — grade what exists, never fix the app.

set -uo pipefail

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
case "$WORK" in "$REPO"*) echo "work-dir must be OUTSIDE the repo tree: $WORK" >&2; exit 1 ;; esac
RUN="$RUNS_DIR/$RUN_ID"
if [ -e "$RUN/metrics.json" ]; then echo "runs/$RUN_ID already has metrics.json — pick a new run-id" >&2; exit 1; fi
mkdir -p "$RUN" "$WORK"

echo "[$RUN_ID] rebuild create-bestax (syncs skills/ -> templates; picks up CLAUDE_MD edits)"
pnpm -C "$REPO" --filter create-bestax build >/dev/null

echo "[$RUN_ID] kill orphaned dev servers under $WORK (survivors steal :5173 strictPort)"
pgrep -fl vite | grep -F "$WORK" | awk '{print $1}' | while read -r p; do kill "$p" 2>/dev/null || true; done

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

echo "[$RUN_ID] snapshot + mechanized metrics"
( cd "$APP" && git add -A && git diff baseline > "$RUN/builder.diff" )
mkdir -p "$RUN/app-src"
cp -R "$APP/src" "$RUN/app-src/src"
cp "$APP/package.json" "$RUN/app-src/" 2>/dev/null || true
cp "$APP/index.html" "$RUN/app-src/" 2>/dev/null || true
node "$HARNESS_DIR/bin/collect-metrics.mjs" "$APP" "$RUN/transcript.jsonl" > "$RUN/metrics.json"

node -e "
const m=require('$RUN/metrics.json');
console.log('[$RUN_ID] tsc_errors=%s build_pass=%s inline=%s rawcls=%s handrolled=%s imports=%s css_added=%s cost=\$%s turns=%s',
  m.tsc_errors, m.build_pass, m.inline_style_count, m.raw_bulma_classnames,
  m.handrolled_total, m.bestax_named_imports, m.custom_css_added_lines,
  m.cost_usd?.toFixed?.(2), m.num_turns);"
echo "[$RUN_ID] done: $RUN  (grade next — see bin/grader-prompt.md; transcript stays on disk, gitignored)"
