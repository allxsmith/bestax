#!/usr/bin/env bash
# run-batch.sh — run many iterations of run-iteration.sh with bounded concurrency.
#
# Usage:
#   bin/run-batch.sh <spec-file> <concurrency> <base-port> <log>
#
# The spec file is one run per line, whitespace-separated:
#   <run-id> <brief-path> <extra args…>
# Blank lines and #-comments are skipped. Every run additionally gets a unique --dev-port,
# because concurrent builders otherwise fight over the scaffold's pinned 5173 and the loser
# cannot start a dev server at all.
#
# NO QUOTED ARGUMENTS IN THE SPEC. Extra args are word-split, so a value containing spaces
# (`--post-scaffold "node foo.mjs"`) arrives as two tokens and the runner rejects the second
# as an unknown option. Pass an executable path instead — bin/install-mcp.mjs and
# bin/set-dev-port.mjs carry shebangs and the executable bit precisely so they are one token.
#
# Deliberately NOT `set -e` on the run loop: a failed run is a datapoint, and losing the
# other nineteen because one scaffold hiccuped is not acceptable. Failures are recorded in
# the log with their exit code and the batch continues. The caller decides what to re-run.
set -uo pipefail

SPEC="${1:?usage: run-batch.sh <spec-file> <concurrency> <base-port> <log>}"
CONC="${2:?missing concurrency}"
BASE_PORT="${3:?missing base port}"
LOG="${4:?missing log path}"

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNNER="$HARNESS_DIR/bin/run-iteration.sh"
[ -x "$RUNNER" ] || [ -f "$RUNNER" ] || { echo "no runner at $RUNNER" >&2; exit 1; }
[ -f "$SPEC" ] || { echo "no spec file at $SPEC" >&2; exit 1; }

mkdir -p "$(dirname "$LOG")"
: > "$LOG"

# Build the tooling ONCE, here, then pass --skip-rebuild to every run. run-iteration.sh
# normally rebuilds create-bestax itself, but that step rewrites shared template files, so
# concurrent runs race and lose. Tooling is frozen for the whole batch by definition, so one
# build up front is both correct and 20× less work.
REPO="$(cd "$HARNESS_DIR/../.." && pwd)"
echo "[batch] building create-bestax once for the whole batch" >&2
if ! pnpm -C "$REPO" --filter create-bestax build >/dev/null 2>&1; then
  echo "[batch] create-bestax build FAILED — refusing to run a batch on stale tooling" >&2
  exit 1
fi

# Work dir is keyed by RUN ID, never by slot index. Slot-keyed dirs are shared state between
# runs, and two batch invocations both start at slot 0 — the second `rm -rf`s the first's app
# out from under a live builder. That happened; both runs were destroyed and had to be
# discarded. Per-run dirs cost more disk (cleaned on success, below) and cannot collide.
#
# The PORT is derived from the run INDEX, not the slot — one unique port per run, never
# reused. Slot-derived ports look right and are not: a slot is only free when its previous
# occupant EXITED, and runs finish out of launch order, so `idx % CONC` hands a live run's
# port to a new one. It happened — sk01 (idx 0, port 5200) was still building when sk03
# (idx 4, same port) launched, and sk01 spent its final minutes running
# `ss -ltnp | grep 5200` to work out whether the listener was its own before relocating to
# another port. It then hit the wall clock and the run was discarded.
#
# With ~20 runs and only a handful live at once there is no shortage of ports, so the
# reuse that caused this buys nothing.
run_one() {
  local idx="$1" id="$2" brief="$3"; shift 3
  local port work started rc
  port=$(( BASE_PORT + idx ))
  work="/tmp/agent-loop-run-$id"
  rm -rf "$work"
  started="$(date -u +%H:%M:%S)"
  echo "[batch] $started start $id (port $port)" >&2
  IS_SANDBOX=1 bash "$RUNNER" "$id" "$brief" "$work" --dev-port "$port" --skip-rebuild "$@" \
    > "$LOG.$id.out" 2>&1
  rc=$?
  echo "$id rc=$rc started=$started finished=$(date -u +%H:%M:%S)" >> "$LOG"
  echo "[batch] $(date -u +%H:%M:%S) done  $id rc=$rc" >&2
  # Reclaim disk only on success — everything the grader needs (metrics, app-src snapshot,
  # builder.diff, transcript) is already copied into the run dir by then. A FAILED run's app
  # is left on disk deliberately: it is the only place the cause is still visible.
  if [ "$rc" -eq 0 ]; then rm -rf "$work"; fi
}

# Resume support. A container restart kills every in-flight builder, and re-running the
# whole spec would redo work already paid for. A run is DONE iff its metrics.json exists —
# the same definition run-iteration.sh uses for its own "already has metrics.json" guard.
# Anything else (a transcript with no metrics, an app with no exit code) is a partial killed
# mid-build: not a datapoint, since the truncation point is arbitrary rather than a budget or
# timeout the rubric knows how to read. Those are deleted and re-run from scratch.
runs_dir_of() { # scrape --runs-dir out of a spec line's extra args
  local prev=""
  for a in $1; do [ "$prev" = "--runs-dir" ] && { echo "$a"; return; }; prev="$a"; done
}

idx=0
pids=()
while read -r id brief rest; do
  case "$id" in ''|'#'*) continue ;; esac
  rd="$(runs_dir_of "$rest")"
  if [ -n "$rd" ] && [ -s "$rd/$id/metrics.json" ]; then
    echo "[batch] skip $id (already has metrics.json)" >&2
    echo "$id rc=0 skipped=already-complete" >> "$LOG"
    continue
  fi
  [ -n "$rd" ] && rm -rf "${rd:?}/$id"
  # shellcheck disable=SC2086
  run_one "$idx" "$id" "$brief" $rest &
  pids+=($!)
  idx=$(( idx + 1 ))
  # Block until a slot frees. `wait -n` returns as soon as ANY child exits, which keeps all
  # slots busy instead of draining the whole batch between waves.
  while [ "$(jobs -rp | wc -l)" -ge "$CONC" ]; do wait -n 2>/dev/null || break; done
done < "$SPEC"

wait
echo "[batch] all $idx runs finished; see $LOG" >&2
