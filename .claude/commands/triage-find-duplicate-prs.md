---
description: Find open PRs that duplicate a PR with 3 parallel search agents; silent when none found
allowed-tools: Task, Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh pr list:*), Bash(gh search:*), Bash(gh pr comment:*)
---

# /triage-find-duplicate-prs — overlapping-work check for a PR

Find OPEN, unmerged PRs that duplicate or overlap the target PR. SILENT by
default: when nothing credible turns up, post NOTHING. Context from the
caller: `REPO`, `NUMBER` (the target PR), `TRIGGER` (`opened`/`labeled`;
assume `labeled` locally). If `NUMBER` is missing, ask.

## In CI (ai-triage.yml)

The workflow session must NOT post or edit comments — its tool allowlist is
GET-only and every `gh … comment` attempt is denied. Run the pre-checks,
search, and filter pass below unchanged, then, instead of the Post section,
report the result as the `TRIAGE-PAYLOAD:` line the workflow prompt
specifies: `"action":"skip"` for a pre-check exit, `"action":"post"` with an
empty `prs` array when nothing credible remains, `"action":"post"` with the
entries otherwise. A deterministic step
(`scripts/render-triage-comments.mjs`) renders the format below from that
payload and upserts the comment by marker as bestaxbot. Everything in this
file about `gh … comment` and `--edit-last` applies to LOCAL runs only.

## Pre-checks (each exit is SILENT)

1. `gh pr view NUMBER --repo REPO --json state,title,body,files,comments` —
   if the PR is not open, stop.
2. Marker check — a comment authored by bestaxbot or a bot account
   containing `<!-- ai-triage:find-duplicate-prs -->` (match marker + that
   author class, never one specific login — the workflow posts as
   bestaxbot today; older comments are from github-actions[bot] or
   claude[bot]):
   - `TRIGGER=opened` and marker present → stop.
   - `TRIGGER=labeled` and marker present → continue; at the end refresh
     that comment. In CI the publish step does that by marker, so just
     report fresh findings; locally, refresh with
     `gh pr comment NUMBER --repo REPO --edit-last --body ...` ONLY when
     your most recent comment on the PR is itself the
     `<!-- ai-triage:find-duplicate-prs -->` comment. `--edit-last` selects
     by author, not by marker, and the other triage commands post as the
     same account — so a newer `find-issues` marker is what it would
     overwrite. Otherwise post fresh. See `.github/CLAUDE.md` rule 6.

## Search — 3 parallel agents

Read the PR title, body, and changed file list, then fan out THREE Task
agents in a single message, one strategy each.

Sub-agents run SYNCHRONOUSLY: every Task call MUST pass
`run_in_background: false`. If the runtime backgrounds them anyway, NEVER
end your turn while any sub-agent is still pending — in the headless CI
session an ended turn terminates the session immediately, orphaning the
agents before any comment is posted (#338). Collect every agent's result,
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
weak matches. Zero credible duplicates: on `TRIGGER=opened`, stop SILENTLY
— no comment, no marker; on `TRIGGER=labeled` (an explicit human request),
post/refresh the comment with the single line "No duplicate PRs found."
plus the marker (matches the pre-check refresh path). In CI, just report an
empty `prs` array — the renderer applies this opened-silent/labeled-post
rule itself, so the rule cannot be forgotten.

## Post ONE comment (when duplicates exist, or on a labeled rerun)

Local runs post this via `gh pr comment NUMBER --repo REPO --body ...` (or
the refresh path). In CI the renderer produces this exact format from your
payload — `scripts/render-triage-comments.mjs` is the source of truth for the
posted body, and this section documents what it emits:

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
most one comment, and none at all when nothing was found — and in CI, post
none: report the payload.
