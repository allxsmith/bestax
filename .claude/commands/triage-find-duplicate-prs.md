---
description: Find open PRs that duplicate a PR with 3 parallel search agents; silent when none found
allowed-tools: Task, Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh pr list:*), Bash(gh search:*), Bash(gh pr comment:*)
---

# /triage-find-duplicate-prs — overlapping-work check for a PR

Find OPEN, unmerged PRs that duplicate or overlap the target PR. SILENT by
default: when nothing credible turns up, post NOTHING. Context from the
caller: `REPO`, `NUMBER` (the target PR), `TRIGGER` (`opened`/`labeled`;
assume `labeled` locally). If `NUMBER` is missing, ask.

## Pre-checks (each exit is SILENT)

1. `gh pr view NUMBER --repo REPO --json state,title,body,files,comments` —
   if the PR is not open, stop.
2. Marker check — a claude-bot comment containing
   `<!-- ai-triage:find-duplicate-prs -->`:
   - `TRIGGER=opened` and marker present → stop.
   - `TRIGGER=labeled` and marker present → continue; at the end refresh
     that comment (`gh pr comment NUMBER --repo REPO --edit-last --body ...`
     if it is your most recent comment on the PR; otherwise post fresh).

## Search — 3 parallel agents

Read the PR title, body, and changed file list, then fan out THREE Task
agents in a single message, one strategy each:

1. **Changed files** — other PRs touching the same components or paths.
2. **Title + body keywords** — the strongest words plus synonyms.
3. **Feature/fix intent** — what the PR accomplishes, phrased differently.

Rules for every agent: EVERY search scoped
`repo:REPO is:pr is:open is:unmerged` (via `gh search prs` or
`gh pr list --search`); exclude the target PR itself and draft PRs; return
numbers + titles + a one-line justification.

## Filter pass

A duplicate solves the same problem or implements the same feature — same
files alone is NOT enough. Compare diffs (`gh pr diff`) when unsure. Drop
weak matches. Zero credible duplicates → stop SILENTLY: no comment, no
marker.

## Post ONE comment (only when duplicates exist)

Via `gh pr comment NUMBER --repo REPO --body ...` (or the refresh path):

```markdown
### AI triage — possible duplicate PRs

- #N — <title>: <one-line reason> (at most 3, best match first)

<!-- ai-triage:find-duplicate-prs -->
```

The marker `<!-- ai-triage:find-duplicate-prs -->` goes on its own line at
the end.

## Hard rules

Never apply or remove labels; never close, merge, push, or resolve
anything; never write "@claude" or "@coderabbitai" in any text; post at
most one comment, and none at all when nothing was found.
