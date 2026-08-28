---
description: Find open issues a PR likely resolves with 5 parallel search agents and report them for publication
allowed-tools: Task, Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh search:*)
---

# /triage-find-issues — link a PR to the issues it resolves

Find OPEN issues the target PR likely resolves or relates to, and REPORT them.
Context from the caller: `REPO`, `NUMBER` (the target PR), and `TRIGGER`
(`opened`/`labeled`). If `NUMBER` is missing, ask.

**You do not post anything.** You have no comment tool. Your findings go out as
a structured payload on this command's `TRIAGE-RESULT:` line, and
`scripts/render-triage-comment.mjs` renders and publishes the comment — it owns
the marker, the `Fixes #N` block, and the decision to comment at all.

## Pre-checks (each exit is a `skip`, never a comment)

1. `gh pr view NUMBER --repo REPO --json state,title,body,comments` — if the
   PR is not open, stop and report `skip (not open)`.
2. Marker check — a comment authored by bestaxbot or a bot account
   containing `<!-- ai-triage:find-issues -->` (match marker + that
   author class, never one specific login — the workflow posts as
   bestaxbot today; older comments are from github-actions[bot] or
   claude[bot]):
   - `TRIGGER=opened` and marker present → stop, report
     `skip (already triaged)`. This is a cost gate that saves the fan-out
     below; the publisher independently refuses to overwrite an existing
     triage comment on an `opened` run.
   - `TRIGGER=labeled` → continue regardless; the publisher refreshes its
     own marker comment in place.
3. Note every issue already referenced in the PR body (`#N`, `Fixes #N`,
   `Closes #N`, full URLs) — those are EXCLUDED from the results.

## Search — 5 parallel agents

Read the PR title, body, and `gh pr diff NUMBER --repo REPO` (never check
out or execute its code). Extract signals, then fan out FIVE Task agents in
a single message, one strategy each.

Sub-agents run SYNCHRONOUSLY: every Task call MUST pass
`run_in_background: false`. If the runtime backgrounds them anyway, NEVER
end your turn while any sub-agent is still pending — in the headless CI
session an ended turn terminates the session immediately, orphaning the
agents before anything is reported (#338). Collect every agent's result,
then continue with the filter pass.

The five strategies:

1. **Error strings** — messages or test names the diff fixes or touches.
2. **Component + file names** — components and paths the diff changes.
3. **API + prop names** — props, exports, and CSS classes the diff touches.
4. **Title keywords** — the strongest words of the PR title, plus synonyms.
5. **Broad area terms** — the feature area of the change.

Rules for every agent: scope EVERY search to this repository
(`repo:REPO` or `--repo REPO`); OPEN issues only (`is:open` /
`--state open`); ONE `gh` command per Bash call, starting with the `gh`
binary — no shell loops, `echo` prefixes, `;`/`&&` chains, pipes, or
command substitution (the permission allowlist matches command prefixes;
anything else is denied and wastes turns); at most 6 searches per agent
(the shared API limit 403s on bursts); return numbers + titles + a
one-line justification.

## Filter pass

Keep only issues this PR plausibly resolves (the diff addresses the issue's
root cause) or directly relates to. Exclude everything already linked in
the PR body (pre-check 3). Drop weak keyword-only matches.

If nothing credible remains, report an EMPTY `items` list — do not report
`skip`. The two mean different things, and the renderer needs the difference:
an empty result stays silent on an `opened` run and posts "No open issues
found that this PR resolves." on a `labeled` one (an explicit human request,
where silence would read as a malfunction). `skip` means a pre-check stopped
you before you searched at all.

## Report

Emit this command's sentinel line, best match first — the first `items` entry
becomes the published `Fixes #N` suggestion:

```
TRIAGE-RESULT: triage-find-issues publish {"items":[{"number":123,"title":"…","reason":"…"}]}
```

- `items` — REQUIRED, may be `[]` (see the filter pass). The renderer keeps
  at most 5.
- `number` must be a JSON integer, never a string. `title` is required;
  `reason` is a short one-liner and is optional.
- Compact JSON on ONE line. A pretty-printed payload fails the job.
- If a search tool errors, or you are rate-limited and cannot complete the
  fan-out, report `skip (search failed)`. Do NOT report an empty list in that
  case — empty means "I searched and found nothing", which is a claim a failed
  search has not earned.
- Do NOT write markers, `Fixes #N`, or any heading into a field — the
  renderer emits them from its own constants, and structural text inside a
  field is defanged, not honored.

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
  --exec-file=/tmp/exec.json --expect=triage-find-issues --number=<n> \
  --is-pr=true \
  --trigger=labeled --autoclose=off --out-dir=/tmp/out --dry-run
```

Nothing in that path can post: `--mode=render` never opens a network
connection, and `--mode=publish --dry-run` stops before its first request.

## Size limits

The whole payload must stay under **8000 bytes** or the run fails, so report
your best candidates rather than everything you saw: at most **5** items. Keep
`title` under **256** characters and `reason` under **400** — one line each,
no markdown, no HTML. The renderer escapes both, so formatting is wasted
effort.

## Hard rules

Never apply or remove labels; never close, merge, push, or resolve
anything; never edit the PR body yourself — the published comment only
suggests; never write "@claude" or "@coderabbitai" in any text. You have no
comment tool — report your findings and stop.
