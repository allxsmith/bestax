---
description: Find open PRs that duplicate a PR with 3 parallel search agents; silent when none found
allowed-tools: Task, Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh pr list:*), Bash(gh search:*)
---

# /triage-find-duplicate-prs — overlapping-work check for a PR

Find OPEN, unmerged PRs that duplicate or overlap the target PR, and REPORT
them. Context from the caller: `REPO`, `NUMBER` (the target PR), and `TRIGGER`
(`opened`/`labeled`). If `NUMBER` is missing, ask.

**You do not post anything.** You have no comment tool. Your findings go out as
a structured payload on this command's `TRIAGE-RESULT:` line, and
`scripts/render-triage-comment.mjs` renders and publishes the comment — it owns
the marker and the decision to comment at all, including this command's
silent-by-default behavior.

## Pre-checks (each exit is a `skip`, never a comment)

1. `gh pr view NUMBER --repo REPO --json state,title,body,files,comments` —
   if the PR is not open, stop and report `skip (not open)`.
2. Marker check — a comment authored by bestaxbot or a bot account
   containing `<!-- ai-triage:find-duplicate-prs -->` (match marker + that
   author class, never one specific login — the workflow posts as
   bestaxbot today; older comments are from github-actions[bot] or
   claude[bot]):
   - `TRIGGER=opened` and marker present → stop, report
     `skip (already triaged)`. This is a cost gate that saves the fan-out
     below; the publisher independently refuses to overwrite an existing
     triage comment on an `opened` run.
   - `TRIGGER=labeled` → continue regardless; the publisher refreshes its
     own marker comment in place.

## Search — 3 parallel agents

Read the PR title, body, and changed file list, then fan out THREE Task
agents in a single message, one strategy each.

Sub-agents run SYNCHRONOUSLY: every Task call MUST pass
`run_in_background: false`. If the runtime backgrounds them anyway, NEVER
end your turn while any sub-agent is still pending — in the headless CI
session an ended turn terminates the session immediately, orphaning the
agents before anything is reported (#338). Collect every agent's result,
then continue with the filter pass.

The three strategies:

1. **Changed files** — other PRs touching the same components or paths.
2. **Title + body keywords** — the strongest words plus synonyms.
3. **Feature/fix intent** — what the PR accomplishes, phrased differently.

Rules for every agent: EVERY search scoped
`repo:REPO is:pr is:open is:unmerged` (via `gh search prs` or
`gh pr list --search`); exclude the target PR itself and draft PRs; ONE
`gh` command per Bash call, starting with the `gh` binary — no shell
loops, `echo` prefixes, `;`/`&&` chains, pipes, or command substitution
(the permission allowlist matches command prefixes; anything else is
denied and wastes turns); at most 6 searches per agent (the shared API
limit 403s on bursts); return numbers + titles + a one-line
justification.

## Filter pass

A duplicate solves the same problem or implements the same feature — same
files alone is NOT enough. Compare diffs (`gh pr diff`) when unsure. Drop
weak matches.

If nothing credible remains, report an EMPTY `items` list — do not report
`skip`. The two mean different things, and the renderer needs the difference:
an empty result stays silent on an `opened` run and posts "No duplicate PRs
found." on a `labeled` one (an explicit human request). `skip` means a
pre-check stopped you before you searched at all.

## Report

Emit this command's sentinel line, best match first:

```
TRIAGE-RESULT: triage-find-duplicate-prs publish {"items":[{"number":123,"title":"…","reason":"…"}]}
```

- `items` — REQUIRED, may be `[]` (see the filter pass). The renderer keeps
  at most 3.
- `number` must be a JSON integer, never a string. `title` is required;
  `reason` is a short one-liner and is optional.
- Compact JSON on ONE line. A pretty-printed payload fails the job.
- If a search tool errors, or you are rate-limited and cannot complete the
  fan-out, report `skip (search failed)`. Do NOT report an empty list in that
  case — empty means "I searched and found nothing", which is a claim a failed
  search has not earned.
- Do NOT write markers or headings into a field — the renderer emits them
  from its own constants, and structural text inside a field is defanged,
  not honored.

## Running this locally

The workflow supplies `REPO`, `NUMBER` and `TRIGGER`; run by hand, assume
`TRIGGER=labeled` and ask for `NUMBER` rather than guessing. Locally the
sentinel line is the whole output — nothing publishes it, and that is the
point: you get to read the payload before it ever becomes a comment. To see
the comment it would produce, pipe the line into the renderer's dry run:

```bash
# with the TRIAGE-RESULT line saved to /tmp/result.txt
printf '[{"type":"result","is_error":false,"result":%s}]' \
  "$(jq -Rs . </tmp/result.txt)" > /tmp/exec.json
node scripts/render-triage-comment.mjs --mode=render \
  --exec-file=/tmp/exec.json --expect=triage-find-duplicate-prs --number=<n> \
  --is-pr=true \
  --trigger=labeled --autoclose=off --out-dir=/tmp/out --dry-run
```

Nothing in that path can post: `--mode=render` never opens a network
connection, and `--mode=publish --dry-run` stops before its first request.

## Size limits

The whole payload must stay under **8000 bytes** or the run fails, so report
your best candidates rather than everything you saw: at most **3** items. Keep
`title` under **256** characters and `reason` under **400** — one line each,
no markdown, no HTML. The renderer escapes both, so formatting is wasted
effort.

## Hard rules

Never apply or remove labels; never close, merge, push, or resolve
anything; never write "@claude" or "@coderabbitai" in any text. You have no
comment tool — report your findings and stop.
