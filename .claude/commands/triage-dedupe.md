---
description: Find likely duplicates of an issue with 5 parallel search agents and report them for publication
allowed-tools: Task, Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh pr list:*), Bash(gh search:*)
---

# /triage-dedupe — duplicate search for an issue

Find likely duplicates of the target issue and REPORT them. Context comes from
the caller (the ai-triage workflow prompt, or you when run locally — see "Running
this locally" below):
`REPO` (owner/repo), `NUMBER` (the target issue), and `TRIGGER` (`opened` or `labeled`). If `NUMBER` is missing, ask — never guess.

**You do not post anything.** You have no comment tool. Your findings go out as
a structured payload on this command's `TRIAGE-RESULT:` line, and
`scripts/render-triage-comment.mjs` renders and publishes the comment. That
script — not you — owns the marker, the `Duplicate of #N` line, the auto-close
notice, and the decision to comment at all.

## Pre-checks (in order; each exit is a `skip`, never a comment)

1. `gh issue view NUMBER --repo REPO --json state,title,body,comments` — if
   the issue is not open, stop and report `skip (not open)`.
2. Marker check — does any existing comment authored by bestaxbot or a
   bot account END WITH `<!-- ai-triage:dedupe -->`? (Match the marker +
   that author class, never one specific login — the workflow posts as
   bestaxbot today; older comments are from github-actions[bot] or
   claude[bot].)
   A comment COUNTS only when the marker is its LAST non-empty line — the same
   predicate the publisher and the auto-close cron use. Matching it here
   matters: a bot reply that merely QUOTES a triage comment carries the marker
   verbatim, so a looser "contains" test would report `already triaged` and
   skip the search while the publisher saw no triage comment at all, leaving
   the item silently un-triaged.
   - `TRIGGER=opened` and marker present → stop, report
     `skip (already triaged)`. This is a cost gate: it saves the search
     fan-out below. The publisher also refuses to overwrite an existing
     triage comment on an `opened` run, so the guarantee does not depend on
     you getting this right.
   - `TRIGGER=labeled` → continue regardless. A maintainer re-ran triage
     deliberately; the publisher refreshes its own marker comment in place.
3. If the issue is too vague to search meaningfully (no error text, no
   component or file name, no concrete behavior), stop and report
   `skip (too vague)`.

## Search — 5 parallel agents

Summarize the issue first: symptoms, component/file names, API/prop names,
exact error strings, and the general area. Then fan out FIVE Task agents in
a single message, each pursuing ONE distinct strategy.

Sub-agents run SYNCHRONOUSLY: every Task call MUST pass
`run_in_background: false`. If the runtime backgrounds them anyway, NEVER
end your turn while any sub-agent is still pending — in the headless CI
session an ended turn terminates the session immediately, orphaning the
agents before anything is reported (#338). Collect every agent's result,
then continue with the filter pass.

The five strategies:

1. **Error strings** — exact quoted messages, stack-trace lines, warning text.
2. **Component + file names** — `Button`, `Modal`, `useConfig`, source paths.
3. **API + prop names** — prop names, exported symbols, CSS class names.
4. **Title keywords** — the strongest 2–4 words of the title, plus synonyms.
5. **Broad area terms** — the general feature area (theming, SSR, a11y, docs).

Rules for every agent:

- EVERY search is scoped to this repository: `repo:REPO` in the query (or
  the `--repo REPO` flag). Never search outside it.
- Use `gh search issues`, `gh issue list --search`; include closed issues
  (a duplicate of a closed issue is still a duplicate).
- ONE `gh` command per Bash call, starting with the `gh` binary — no shell
  loops, `echo` prefixes, `;`/`&&` chains, pipes (`| head`, `| jq`), or
  command substitution (`$(...)`) (the permission allowlist matches command
  prefixes; anything else is denied and wastes turns).
- At most 6 searches per agent — the GitHub API limit is shared across all
  agents, and a burst of searches 403s the whole session.
- Return candidate numbers with title and a one-line justification each.

## Filter pass (you, not the agents)

Judge every candidate against the target: same root cause or clearly the
same feature request = duplicate; same area or a blocking relationship =
related. DROP weak keyword-only matches — an empty result beats a wrong one.
Read the top candidates with `gh issue view` when unsure.

## Report

Emit this command's sentinel line, best match first — the first `items` entry
becomes the published `Duplicate of #N`:

```
TRIAGE-RESULT: triage-dedupe publish {"items":[{"number":123,"title":"…","reason":"…"}],"related":[{"number":456,"title":"…","reason":"…"}]}
```

- `items` — the duplicates. REQUIRED, and may be `[]`: an empty list is a
  real finding ("I searched and found nothing credible"), and the renderer
  publishes "No duplicates found." for it. The renderer keeps at most 3.
- `related` — optional, same shape, at most 3 kept.
- `number` must be a JSON integer, never a string. `title` is required;
  `reason` is a short one-liner and is optional.
- Compact JSON on ONE line. A pretty-printed payload fails the job.
- If a search tool errors, or you are rate-limited and cannot complete the
  fan-out, report `skip (search failed)`. Do NOT report an empty list in that
  case — empty means "I searched and found nothing", which is a claim a failed
  search has not earned.
- Do NOT write markers, `Duplicate of #N`, the auto-close notice, or any
  heading into a field. The renderer emits all of them from its own
  constants; structural text inside a field is defanged, not honored.

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
  --exec-file=/tmp/exec.json --expect=triage-dedupe --number=<n> \
  --is-pr=false \
  --trigger=labeled --autoclose=off --out-dir=/tmp/out --dry-run
```

Nothing in that path can post: `--mode=render` never opens a network
connection, and `--mode=publish --dry-run` stops before its first request.

## Size limits

Keep `title` under **256** characters and `reason` under **400** — one line
each, no markdown, no HTML (the renderer escapes both, so formatting is
wasted effort). Report at most **3** items, plus up to **3** in `related`.

Obeying those is sufficient. The renderer also enforces a byte cap, but it is
sized to clear the largest payload these limits allow, so a compliant report is
never rejected for size — you do not need to count bytes.

## Hard rules

Never apply or remove labels; never close, merge, push, or resolve
anything; never write "@claude" or "@coderabbitai" in any text. You have no
comment tool — report your findings and stop.
