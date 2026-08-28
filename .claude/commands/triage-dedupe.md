---
description: Find likely duplicates of an issue with 5 parallel search agents and post one triage comment
allowed-tools: Task, Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh pr list:*), Bash(gh search:*), Bash(gh issue comment:*)
---

# /triage-dedupe — duplicate search for an issue

Find likely duplicates of the target issue and post EXACTLY ONE comment (or
nothing — see pre-checks). Context comes from the caller (the ai-triage
workflow prompt, or the user when run locally): `REPO` (owner/repo), `NUMBER`
(the target issue), `TRIGGER` (`opened` or `labeled`; assume `labeled` when
run locally), and `AUTOCLOSE` (`active` or `off`; assume `off` locally — in
CI it is not passed to the session at all, see below). If `NUMBER` is
missing, ask — never guess.

## In CI (ai-triage.yml)

The workflow session must NOT post or edit comments — its tool allowlist is
GET-only and every `gh … comment` attempt is denied. Run the pre-checks,
search, and filter pass below unchanged, then, instead of the Post section,
report the result as the `TRIAGE-PAYLOAD:` line the workflow prompt specifies:
`"action":"skip"` for a pre-check exit, `"action":"post"` with an empty
`duplicates` array when nothing credible remains, `"action":"post"` with the
entries otherwise. A deterministic step
(`scripts/render-triage-comments.mjs`) renders the format below from that
payload and upserts the comment by marker as bestaxbot. Everything in this
file about `gh … comment`, `--edit-last`, and the AUTOCLOSE notice therefore
applies to LOCAL runs only.

## Pre-checks (in order; each exit is SILENT — post nothing)

1. `gh issue view NUMBER --repo REPO --json state,title,body,comments` — if
   the issue is not open, stop.
2. Marker check — does any existing comment authored by bestaxbot or a
   bot account contain `<!-- ai-triage:dedupe -->`? (Match the marker +
   that author class, never one specific login — the workflow posts as
   bestaxbot today; older comments are from github-actions[bot] or
   claude[bot].)
   - `TRIGGER=opened` and marker present → stop (already triaged).
   - `TRIGGER=labeled` and marker present → continue; at the end REFRESH
     that comment instead of posting a new one. In CI the publish step does
     that refresh by marker, so just report fresh findings; locally, use
     `gh issue comment NUMBER --repo REPO --edit-last --body ...` ONLY when
     your most recent comment on the issue is itself the
     `<!-- ai-triage:dedupe -->` comment: `--edit-last` selects by author,
     not by marker, and every automation here posts as bestaxbot now, so a
     newer repro draft or other machine comment would be the one it
     overwrites. If anything else is newer, post a fresh comment (the old
     one stays as history). See `.github/CLAUDE.md` rule 6.
3. If the issue is too vague to search meaningfully (no error text, no
   component or file name, no concrete behavior), stop.

## Search — 5 parallel agents

Summarize the issue first: symptoms, component/file names, API/prop names,
exact error strings, and the general area. Then fan out FIVE Task agents in
a single message, each pursuing ONE distinct strategy.

Sub-agents run SYNCHRONOUSLY: every Task call MUST pass
`run_in_background: false`. If the runtime backgrounds them anyway, NEVER
end your turn while any sub-agent is still pending — in the headless CI
session an ended turn terminates the session immediately, orphaning the
agents before any comment is posted (#338). Collect every agent's result,
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

## Post ONE comment

Local runs post this via `gh issue comment NUMBER --repo REPO --body ...` (or
the refresh path from pre-check 2). In CI the renderer produces this exact
format from your payload — `scripts/render-triage-comments.mjs` is the source
of truth for the posted body, and this section documents what it emits:

```markdown
### AI triage

**Likely duplicates**

- #N — <title>: <one-line reason>
- (at most 3 entries, best match first)

Duplicate of #N

**Related** (optional, at most 3)

- #M — <title>: <one-line reason>

<!-- ai-triage:dedupe -->
```

- The line `Duplicate of #N` — with N the single best duplicate — must use
  THIS EXACT FORMAT on its own line: the auto-close cron machine-parses it.
  Include it only when you found at least one credible duplicate. In CI the
  renderer emits this line from the payload's `duplicateOf` — report that
  field, and never put the line inside a payload string.
- If `AUTOCLOSE=active`, add this sentence directly after the
  `Duplicate of #N` line: "This issue may be auto-closed in 14 days unless
  someone objects (comment or 👎)." If `AUTOCLOSE=off`, omit it. In CI the
  renderer decides this from the workflow's own AUTOCLOSE value; the session
  is not told it.
- The marker `<!-- ai-triage:dedupe -->` goes on its own line at the end.
- No credible duplicates → post "No duplicates found." under the heading,
  plus the marker, WITHOUT any `Duplicate of #N` line or auto-close notice.
  In CI that is an empty `duplicates` array, not a skip.

## Hard rules

Never apply or remove labels; never close, merge, push, or resolve
anything; never write "@claude" or "@coderabbitai" in any text; post at
most one comment and nothing else — and in CI, post none: report the
payload.
