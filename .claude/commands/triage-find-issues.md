---
description: Find open issues a PR likely resolves with 5 parallel search agents and post one triage comment
allowed-tools: Task, Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh search:*), Bash(gh pr comment:*)
---

# /triage-find-issues — link a PR to the issues it resolves

Find OPEN issues the target PR likely resolves or relates to, and post
EXACTLY ONE comment (or nothing). Context from the caller: `REPO`, `NUMBER`
(the target PR), `TRIGGER` (`opened`/`labeled`; assume `labeled` locally),
`AUTOCLOSE` (unused here). If `NUMBER` is missing, ask.

## In CI (ai-triage.yml)

The workflow session must NOT post or edit comments — its tool allowlist is
GET-only and every `gh … comment` attempt is denied. Run the pre-checks,
search, and filter pass below unchanged, then, instead of the Post section,
report the result as the `TRIAGE-PAYLOAD:` line the workflow prompt
specifies: `"action":"skip"` for a pre-check exit, `"action":"post"` with an
empty `issues` array when nothing credible remains, `"action":"post"` with the
entries otherwise. A deterministic step
(`scripts/render-triage-comments.mjs`) renders the format below from that
payload and upserts the comment by marker as bestaxbot. Everything in this
file about `gh … comment` and `--edit-last` applies to LOCAL runs only.

## Pre-checks (each exit is SILENT)

1. `gh pr view NUMBER --repo REPO --json state,title,body,comments` — if the
   PR is not open, stop.
2. Marker check — a comment authored by bestaxbot or a bot account
   containing `<!-- ai-triage:find-issues -->` (match marker + that
   author class, never one specific login — the workflow posts as
   bestaxbot today; older comments are from github-actions[bot] or
   claude[bot]):
   - `TRIGGER=opened` and marker present → stop.
   - `TRIGGER=labeled` and marker present → continue; at the end refresh
     that comment. In CI the publish step does that by marker, so just
     report fresh findings; locally, refresh with
     `gh pr comment NUMBER --repo REPO --edit-last --body ...` ONLY when
     your most recent comment on the PR is itself the
     `<!-- ai-triage:find-issues -->` comment. `--edit-last` selects by
     author, not by marker, and the other triage commands post as the same
     account — so a newer `find-duplicate-prs` marker is what it would
     overwrite. Otherwise post fresh. See `.github/CLAUDE.md` rule 6.
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
agents before any comment is posted (#338). Collect every agent's result,
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
the PR body (pre-check 3). Drop weak keyword-only matches. If nothing
credible remains: on `TRIGGER=opened`, stop SILENTLY — no comment, no
marker; on `TRIGGER=labeled` (an explicit human request — silence would
read as a malfunction), post/refresh the comment with the single line
"No open issues found that this PR resolves." plus the marker (matches
pre-check 2's refresh path). In CI, just report an empty `issues` array —
the renderer applies this opened-silent/labeled-post rule itself, so the
rule cannot be forgotten.

## Post ONE comment

Local runs post this via `gh pr comment NUMBER --repo REPO --body ...` (or
the refresh path). In CI the renderer produces this exact format from your
payload — `scripts/render-triage-comments.mjs` is the source of truth for the
posted body, and this section documents what it emits:

````markdown
### AI triage — issues this PR may resolve

- #N — <title>: <one-line reason> (best match first, at most 5)

If this PR resolves one of these, add the line below to the PR description
so the issue closes on merge:

```
Fixes #N
```

<!-- ai-triage:find-issues -->
````

The marker `<!-- ai-triage:find-issues -->` goes on its own line at the end.

## Hard rules

Never apply or remove labels; never close, merge, push, or resolve
anything; never edit the PR body yourself — only suggest; never write
"@claude" or "@coderabbitai" in any text; post at most one comment — and in
CI, post none: report the payload.
