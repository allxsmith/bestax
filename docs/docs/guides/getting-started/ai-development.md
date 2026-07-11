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

| Label                | Where  | Meaning                                                                                        |
| -------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `claude-fix`         | issues | Maintainer-approved: Claude implements this issue and opens a PR                               |
| `ai-loop`            | PRs    | The PR is inside the autonomous review/fix loop                                                |
| `needs-human-review` | PRs    | The loop converged (or hit a disagreement) — awaiting maintainer review/merge                  |
| `ai-loop-paused`     | PRs    | The loop hit its iteration cap or a guardrail — a maintainer must intervene                    |
| `deep-review`        | PRs    | Opt-in: a triage+ user applies it to run the Claude deep review on any PR (re-apply to re-run) |
| `claude-assisted`    | PRs    | Auto-applied provenance for AI-assisted PRs (bestaxbot or the Claude footer)                   |

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
