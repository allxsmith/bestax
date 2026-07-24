---
title: AI-Assisted Development
sidebar_label: AI-Assisted Development
sidebar_position: 11
---

# AI-Assisted Development

bestax uses AI in two ways: **AI code review** on every pull request, and an **autonomous
development loop** that can implement maintainer-approved issues end to end. Every AI-authored
change is clearly labeled, and a human maintainer reviews and merges everything — nothing is
ever merged automatically.

## For users: filing issues the AI can pick up

File issues normally — bug report, feature request, accessibility issue, and the other
[issue templates](https://github.com/allxsmith/bestax/issues/new/choose) all work. During
triage, a maintainer may add the **`claude-fix`** label to an issue. That kicks off the
autonomous loop: Claude implements the fix on a branch, opens a pull request that references
your issue (`Fixes #N`), and the AI reviewers iterate on it. You'll see the linked PR appear
on your issue, and the issue closes automatically when a maintainer merges the PR.

The more actionable your issue, the better the agent does with it:

- **Name the component** (`Button`, `Modal`, `useConfig`, …) and the package
  (`@allxsmith/bestax-bulma`, `create-bestax`, docs).
- **Show a minimal reproduction** — a code snippet beats a description.
- **State expected vs. actual behavior**, with screenshots for visual issues.
- Mention your React/Bulma versions when they might matter.

## For contributors: what reviews your PR

Every PR gets AI review before human review:

- **CodeRabbit** reviews automatically. Respond in-thread or just push fixes — it re-reviews
  each push and marks addressed comments with "✅ Addressed in commit …". If you think a
  finding is wrong, say so in the thread; a maintainer has the final word.
- **`@claude` mentions** are restricted to the owner, members, and invited collaborators (they
  spend the maintainer's Claude usage). External contributors don't need them — just push.
- **Copilot review** may also appear when the maintainers have it enabled.

A green AI review is not approval: a human maintainer still reviews and merges every PR, and
the review-time requirements (Storybook story for UI changes, docs page for API changes,
`skills/` updates for component changes) still apply.

## The autonomous loop

PRs authored by the loop move through a small label lifecycle:

| Label                   | Where        | Meaning                                                                                                                                                                                                                                                        |
| ----------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claude-fix`            | issues       | Maintainer-approved: Claude implements this issue and opens a PR                                                                                                                                                                                               |
| `ai-loop`               | PRs          | The PR is inside the autonomous review/fix loop                                                                                                                                                                                                                |
| `needs-human-review`    | PRs          | The loop converged (or hit a disagreement) — awaiting maintainer review/merge                                                                                                                                                                                  |
| `ai-loop-paused`        | PRs          | The loop hit its iteration cap or a guardrail — a maintainer must intervene                                                                                                                                                                                    |
| `deep-review`           | PRs          | Opt-in: a triage+ user applies it to run the Claude deep review on any PR (re-apply to re-run). Optionally steer it by pre-posting a PR comment starting with `deep-review:` (focus areas, suspected weak spots) — only comments from triage+ authors are used |
| `ai-triage`             | PRs & issues | Runs one-shot AI triage (related issues + duplicates): automatic on new issues/PRs in auto mode (daily budget), or applied by a triage+ user (budget-exempt; label auto-removes)                                                                               |
| `claude-repro`          | issues       | Triage+ user applies it: Claude drafts a candidate reproduction test and github-actions[bot] posts it for a human to run (author-only — CI does not run it). Auto-removes                                                                                      |
| `needs-security-review` | PRs & issues | Auto-applied by the security scanner when it flags an item; pauses `claude-repro` and `claude-fix` until a maintainer reviews and removes it                                                                                                                   |
| `claude-assisted`       | PRs          | Auto-applied provenance for AI-assisted PRs (bestaxbot or the Claude footer)                                                                                                                                                                                   |
| `stale`                 | PRs          | Auto-applied after 30 days of inactivity; closes 14 days later unless activity resumes. Claude-assisted PRs skip this sweep — a separate closer sweeps them after 90 days instead                                                                              |
| `neverstale`            | PRs          | Exempts a PR from all stale automation (both the 30/14-day sweep and the 90-day Claude-assisted closer)                                                                                                                                                        |

### AI triage

New issues and PRs can get an automatic triage comment: likely duplicates (issues), the open
issues a PR probably resolves, and overlapping PRs. Triage comments are posted by the
`bestaxbot` machine account (the same account that authors the loop's PRs; older triage
comments were posted by `github-actions[bot]` or `claude[bot]`). **Only same-repo PRs are
triaged** — PRs opened from forks are always
skipped, automatic and label alike (the workflow deliberately avoids GitHub's
`pull_request_target` trigger, so fork-originated events can never run with repository
secrets); issues have no such restriction. Three repository variables control it:

- **`AI_TRIAGE_MODE`** — `auto` (new issues/PRs are triaged automatically and the label still
  works), `label` (opt-in only; the default when unset), or `off` (disables both automatic
  triage **and** the label).
- **`AI_TRIAGE_DAILY_LIMIT`** — maximum auto-triggered triage sessions per UTC day (default
  10). The cap only meters outside authors: label-triggered runs are exempt (each one is
  already human-metered by the click), and so are issues/PRs opened by collaborators with
  triage access or higher (their role is verified live against the repository).
- **`AI_TRIAGE_AUTOCLOSE`** — `on`, `dry-run`, or `off` (the default). When active, an issue
  whose triage comment names a `Duplicate of #N` is auto-closed after **14 days** — unless
  anyone objects: a human comment after the triage comment, a 👎 reaction on it, or reopening
  the issue each veto the close.

### Reproduction (author-only)

A triage+ user can apply `claude-repro` to an issue to have Claude **draft** a minimal Jest
reproduction test. `github-actions[bot]` posts the draft as a comment for a human to review and
run — **CI does not execute it**. This is deliberately author-only; the token that pays for the
model never shares a job with code execution, and the drafted (untrusted-influenced) test is
posted with the workflow's own token, not bestaxbot's, so a stray `@claude` or marker in the
draft cannot re-trigger anything. The whole pipeline holds no PAT. A flagged issue
(`needs-security-review`) is refused until the flag is cleared.

### Security scan

New issues and PRs are automatically assessed by a read-only Claude session for malicious code,
prompt injection aimed at this repo's automation, and social engineering. When it flags an item,
a deterministic step applies **`needs-security-review`** (the reason stays in the private run
output, never a public comment). The scan holds no write tools and no PAT, so it has no channel
to post or leak anything; it fails **closed** (a crashed or inconclusive scan flags rather than
passes). Controls: `AI_SCAN_MODE` (`off` disables it) and `AI_SCAN_DAILY_LIMIT` (auto scans per
UTC day, default 20); `AI_LOOP_ENABLED=false` stops it with everything else.

The flag is **advisory, not a gate**: a clean verdict only covers the static text scanned at open
time. It pauses `claude-repro` and `claude-fix`, but it does **not** block `@claude` / `@bestaxbot`
— so **do not `@claude` a flagged item to "investigate" it; inspect it by hand.** Clear a false
positive by removing the label.

The loop itself: Claude implements the issue and opens the PR → CodeRabbit reviews it and a
second, independent Claude review (a stronger model than the implementer) does a deep pass →
Claude addresses every finding, fixing what's right and refuting what's wrong → both reviewers
re-verify their own findings against the pushed code (nothing is closed on the fixer's word
alone) → after at most 4 fix rounds, the PR either converges (CI green, all review threads
resolved) or is handed to a human with the open disagreements listed.

Please don't add or remove the loop labels on PRs you don't own — they are the loop's state
machine.

## Guardrails

- **Humans always merge.** The loop cannot merge, enable auto-merge, or approve its own work;
  branch protection requires a human approval on `main`.
- **Hard iteration cap** (4 fix rounds per PR), plus concurrency limits so runs never stack.
- **Protected paths**: the loop refuses to operate on changes touching CI workflows, coverage
  thresholds, commitlint/release configuration, or dependency policy — the gates that keep it
  honest can't be edited by it.
- **Maintainer-only entry**: only collaborators with triage access or higher can start the loop
  (the workflow re-verifies the labeler's permission live), and only by labeling an issue after
  reading it.
- **Kill switches**: removing the `ai-loop` label stops one PR; a repository variable turns
  the whole system off.

## AI-ready scaffolds

New apps can start AI-ready too: accepting the AI-skills prompt in `npm create bestax@latest`
installs the bestax Agent Skills and a `CLAUDE.md`, plus a `.claude/launch.json` that tells
Claude Code's browser preview how to start the app's dev server (`npm run dev` on port 5173,
with `--strictPort` so a busy port fails loudly instead of silently drifting to another port).
See the [LLMs guide](/docs/guides/llms) for the full AI tooling story.
