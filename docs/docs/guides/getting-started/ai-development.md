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
| `needs-security-review` | PRs & issues | Auto-applied by the security scanner when it flags an item; blocks every entry point this repo controls — `claude-repro`, `claude-fix`, `@claude`, `@bestaxbot` — until a maintainer removes it (third-party reviewers are not gated)                          |
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
passes). It is **opt-in**: it runs only when `AI_SCAN_MODE` is exactly `on`, so an unset or
deleted variable means no scanning. `AI_SCAN_DAILY_LIMIT` caps it (auto scans per
UTC day, default 20); `AI_LOOP_ENABLED=false` stops it with everything else.

A **clean verdict is advisory** — it only covers the static text scanned at open time, so treat
it as "nothing obvious at the moment it opened", not as a guarantee about later edits or
comments.

A **flag gates every entry point this repository controls**: while `needs-security-review` is on
an item, `claude-repro`, `claude-fix`, `@claude` and `@bestaxbot` all refuse it in their job
`if:`. So a flagged item cannot be investigated by mentioning the bot — inspect it by hand and
remove the label once you are satisfied. That is also the answer when `@claude` appears to
ignore a mention: check for the label before assuming the workflow is broken.

Two limits are worth knowing before you lean on it:

- **Third-party reviewers are not gated.** CodeRabbit and Copilot run on their own triggers and
  never see this label, so they still review a flagged PR.
- **There is an open-time window.** The scanner and its consumers both fire on the `opened`
  event, so a path evaluating its `if:` on that same event does so before the label exists.
  Every such path independently requires a trusted author, which bounds it — but the flag is a
  gate from the moment it lands, not from the moment the item is created.

The loop itself: Claude implements the issue and opens the PR → CodeRabbit reviews it and a
second, independent Claude review (a stronger model than the implementer) does a deep pass →
Claude addresses every finding, fixing what's right and refuting what's wrong → both reviewers
re-verify their own findings against the pushed code (nothing is closed on the fixer's word
alone) → after at most 4 fix rounds, the PR either converges (CI green, all review threads
resolved) or is handed to a human with the open disagreements listed.

**Screenshots at handoff.** When the loop flips a PR to `needs-human-review` it also
dispatches a screenshot pass (`story-screenshots.yml`): Playwright captures the Storybook
stories affected by the PR's changed files — once light, once dark — and posts them to the PR
as a single (upserted) comment plus a 30-day workflow artifact, so the reviewer sees the
rendered result and not just the diff. The images are served from the `story-screenshots`
branch, which is disposable storage — deleting it only breaks images in old handoff comments,
and the next run re-creates it. To run the pass on any PR, apply the `needs-human-review`
label yourself or dispatch it directly: `gh workflow run story-screenshots.yml -f pr=123`, with
`123` swapped for your PR number.
Cross-cutting changes (shared helpers, theme plumbing) map to no specific stories and produce
an explicit "nothing to screenshot" comment. If the pass itself breaks, the same comment says
so and links the failed run — a silent handoff always means there was nothing to show, never
that the screenshots were lost.

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

### Repository variables

Every switch above is a **repository variable** (Settings → Secrets and variables → Actions →
Variables), not a secret. They are listed here because the workflows that read them are public
in `.github/workflows/`, so the names and their effects are already readable — a control nobody
can find is the only thing that would be worse. Values are never sensitive; secrets are a
separate store and none are documented here.

**Defaults matter more than the values**, because an unset variable is not "off":

| Variable                | Unset means           | Values                 | Controls                                                                                                                                   |
| ----------------------- | --------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `AI_LOOP_ENABLED`       | **disabled**          | must be exactly `true` | The master switch. Everything below is additionally gated on this                                                                          |
| `AI_TRIAGE_MODE`        | `label` (opt-in only) | `auto`, `label`, `off` | Whether new issues/PRs are triaged automatically, by label only, or not at all                                                             |
| `AI_TRIAGE_DAILY_LIMIT` | `10`                  | integer                | Auto-triage sessions per UTC day. Label runs and triage+ authors are exempt                                                                |
| `AI_TRIAGE_AUTOCLOSE`   | `off`                 | `on`, `dry-run`, `off` | Whether a flagged duplicate is auto-closed after the objection window                                                                      |
| `AI_SCAN_MODE`          | **disabled**          | must be exactly `on`   | The security scan on new issues/PRs                                                                                                        |
| `AI_SCAN_DAILY_LIMIT`   | `20`                  | integer                | Auto scans per UTC day                                                                                                                     |
| `AI_LOOP_COPILOT`       | `false`               | must be exactly `true` | Requests a Copilot review on loop PRs (Copilot's own automatic review skips bot-authored PRs on personal repos, so it has to be asked for) |

Anything that spends model usage is **explicit opt-in** — it must be present and set, and
deleting it turns the feature off rather than on:

- `AI_LOOP_ENABLED` (`== 'true'`), `AI_SCAN_MODE` (`== 'on'`) and `AI_LOOP_COPILOT`
  (`== 'true'`) all require the exact value. Unset, empty, or a typo means off.

`AI_TRIAGE_MODE` is the one exception: its label-triggered path is an `!= 'off'` check, so an
unset variable still allows a triage+ user to run triage by applying the label. Automatic
triage on every new item is separate and needs `auto`.

`COPILOT_AGENT_FIREWALL_ENABLED` and `COPILOT_AGENT_FIREWALL_ALLOW_LIST_ADDITIONS` may also
appear in the variable list. They belong to GitHub's Copilot coding agent, are read by GitHub
rather than by anything in `.github/workflows/`, and are unrelated to the automation described
here.

## AI-ready scaffolds

New apps can start AI-ready too: accepting the AI-skills prompt in `npm create bestax@latest`
installs the bestax Agent Skills and a `CLAUDE.md`, plus a `.claude/launch.json` that tells
Claude Code's browser preview how to start the app's dev server (`npm run dev` on port 5173,
with `--strictPort` so a busy port fails loudly instead of silently drifting to another port).
See the [LLMs guide](/docs/guides/llms) for the full AI tooling story.
