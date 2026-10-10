---
title: AI-Assisted Development
sidebar_label: AI-Assisted Development
sidebar_position: 11
---

# AI-Assisted Development

bestax uses AI in two ways. Pull requests get **AI review**: CodeRabbit, plus a deep review
that this repository's own workflow runs and that posts as `claude[bot]`. And a
maintainer-steered bot, **bestaxbot**, implements approved issues. bestaxbot is a GitHub App
maintained outside this repository. Everything it does here is labelled, a human reviews and
merges everything, and the bot never merges.

## For Users: Filing Issues the Bot Can Pick Up

File issues normally: bug report, feature request, accessibility issue, and the other
[issue templates](https://github.com/allxsmith/bestax/issues/new/choose) all work. During
triage, a maintainer may add the **`claude-fix`** label to an issue. A pull request that
references your issue (`Fixes #N`) appears, the reviewers and the bot go back and forth on
it, and the issue closes when a maintainer merges the PR.

The more actionable your issue, the better the bot does with it:

- **Name the component** (`Button`, `Modal`, `useConfig`) and the package
  (`@allxsmith/bestax-bulma`, `create-bestax`, docs).
- **Show a minimal reproduction.** A code snippet beats a description.
- **State expected vs. actual behavior**, with screenshots for visual issues.
- Mention your React and Bulma versions when they might matter.

## For Contributors: What Reviews Your PR

- **CodeRabbit** reviews a PR automatically once it targets the default branch and is out of
  draft. Respond in-thread or just push fixes; it re-reviews each push and marks the comments
  it considers addressed. If you think a finding is wrong, say so in the thread; a maintainer
  has the final word. It rate-limits on open-source repositories, and after it says the
  review limit is reached it won't retry on its own: once the window resets, push a commit or
  comment `@coderabbitai review`.
- **The Claude deep review** posts as `claude[bot]`. It runs on the bot's PRs once CI is
  green, and on any same-repo PR a maintainer labels `deep-review`. It never runs on a PR
  from a fork. Every finding, advisory ones included, lands as an inline review thread on the
  line it concerns, so the threads are the work list.
- **`@claude` mentions** are for the owner, members, and invited collaborators (they spend the
  maintainer's Claude usage). External contributors don't need them. Just push.
- **Copilot review** may also appear.

**A PR based on another PR's branch gets no automatic CodeRabbit review.** CodeRabbit
auto-reviews only PRs whose base is the default branch (`auto_review.base_branches` in
`.coderabbit.yaml`). On any other base it posts a "Review skipped" notice, and that notice
names `@coderabbitai review` as the way to get a single review anyway. Prefer landing a stack
one PR at a time, so each is reviewed against the default branch.

A green AI review is not approval. A human maintainer still reviews and merges every PR, and
the review-time requirements (a Storybook story for UI changes, a docs page for API changes,
`skills/` updates for component changes) still apply.

## The Bot

bestaxbot is a GitHub App maintained outside this repository. This is what you can see it do
here:

- **It implements `claude-fix` issues.** It works on a `claude/` branch and opens the pull
  request, which references the issue.
- **It answers every review thread on its own PRs.** It fixes what is right and says so in the
  thread, and it refutes what it judges wrong. It never resolves a reviewer's own threads; it
  asks the reviewer to re-check by re-applying `deep-review`.
- **It drafts a reproduction test** when a maintainer applies `claude-repro` to an issue, and
  posts the draft for a human to run. CI never runs it.
- **It triages new issues and PRs** for likely duplicates and related work, and posts what it
  found.
- **It screens new items** for malicious code, prompt injection aimed at this repository's
  automation, and social engineering, and flags anything not positively clean with
  `needs-security-review`.
- **It keeps a status comment current on its PR:** what it is doing, where CI stands, and which
  findings are fixed, refuted, or still open.
- **It hands a converged PR to a human** with `needs-human-review`, which also runs the
  screenshot pass.
- **It replies** when a maintainer addresses `@bestaxbot`.

And what it never does:

- Merge, approve, or enable auto-merge.
- Push to any branch outside `claude/`.
- Change workflows, release, commitlint, coverage, or dependency policy, or add a dependency.
- Act on an item carrying `needs-security-review`.
- Run code from a fork. Fork PRs are only read.

## The Labels Are the Contract

| Label                   | Who applies it                                              | What it means                                                                                                                                                                | What the bot does                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claude-fix`            | A maintainer (triage access or higher), on an issue         | The issue is approved for the bot                                                                                                                                            | Implements it on a `claude/` branch and opens a PR that references the issue                                                                                                                                                                                                                                                                                                                                                                                        |
| `claude-repro`          | A maintainer, on an issue                                   | A reproduction test is wanted                                                                                                                                                | Drafts one and posts it for a human to run; CI never runs it. The label comes off once the draft is posted                                                                                                                                                                                                                                                                                                                                                          |
| `ai-triage`             | A maintainer, on an issue or PR                             | Triage on demand                                                                                                                                                             | Posts likely duplicates and related work. The label comes off when it is done                                                                                                                                                                                                                                                                                                                                                                                       |
| `deep-review`           | A maintainer, on a same-repo PR; the bot, on its own PRs    | Run the Claude deep review                                                                                                                                                   | Nothing by itself; the review runs from this repository's workflow. A re-run means removing the label and adding it back, since re-applying a label that is already present starts nothing. A re-run settles that review's open threads and raises nothing new. A comment starting `deep-review: fresh` from a maintainer asks for a full review of the current code instead, and stays in force until a newer `deep-review:` comment from a maintainer replaces it |
| `ai-loop`               | The bot, once its PR's CI is green; a maintainer, to resume | The bot is working this PR                                                                                                                                                   | Fixes CI, answers threads, and asks for re-checks. Removing the label stops the bot on that PR; adding it back resumes from the current head                                                                                                                                                                                                                                                                                                                        |
| `ai-loop-paused`        | The bot                                                     | The bot parked itself; its note on the PR says why                                                                                                                           | Waits. A maintainer resumes it by adding `ai-loop` back                                                                                                                                                                                                                                                                                                                                                                                                             |
| `needs-human-review`    | The bot, at handoff; a maintainer, on any PR                | Converged or contested; a human reviews and merges                                                                                                                           | Stops working the PR unless addressed. The label also runs the screenshot pass                                                                                                                                                                                                                                                                                                                                                                                      |
| `review-converged`      | This repository's workflow                                  | The newest deep review is pinned to the head commit with nothing open, every review thread is resolved, and checks are green. A later push takes it off until a fresh review | On its own PRs, treats it as the signal to hand off                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `needs-security-review` | The bot's screen; a maintainer, by hand                     | The item is held until a maintainer looks at it                                                                                                                              | Refuses the item until a maintainer removes the label. Third-party reviewers are not gated by it, and a clean screen covers the text as it was when the item opened, not later edits                                                                                                                                                                                                                                                                                |
| `claude-assisted`       | Automatically                                               | Provenance: the bot's PRs, and any PR carrying the Claude Code footer                                                                                                        | Nothing                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `stale`                 | The stale sweep, after a long stretch of inactivity         | The PR closes later unless activity resumes                                                                                                                                  | Nothing                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `neverstale`            | A maintainer                                                | Exempt from the stale sweep                                                                                                                                                  | Nothing                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `slop`                  | A maintainer                                                | A low-quality AI-generated PR                                                                                                                                                | Nothing; this repository's workflow posts a standard explanation and closes the PR                                                                                                                                                                                                                                                                                                                                                                                  |

Please don't add or remove the bot's labels on PRs you don't own.

## Steering It

Everything here needs triage access or higher, since GitHub only lets those users apply
labels.

- **Start it:** add `claude-fix` to an issue you have read and want implemented.
- **Ask for a repro:** add `claude-repro` to an issue.
- **Triage on demand:** add `ai-triage` to an issue or PR.
- **Deep review:** add `deep-review` to a same-repo PR. To re-run it, remove the label and
  add it back. To review the current code in full rather than settle the open threads, post a
  comment starting `deep-review: fresh` first, then toggle the label; that steer stays in
  force until a newer `deep-review:` comment replaces it. Pushes and comments start nothing on
  their own.
- **Stop one PR:** remove `ai-loop`. The bot stops working that PR.
- **Resume:** add `ai-loop` back. The bot picks up from the current head.
- **Hold an item:** leave `needs-security-review` on it, or add it by hand. The bot refuses
  the item until the label comes off.
- **Keep a PR:** add `neverstale`.
- **Flag slop:** add `slop`. The PR is closed with a standard note.
- **Talk to it:** mention `@bestaxbot` on an issue or PR.

A parked PR nobody resumes for a while is closed by the bot with a note.

## Screenshots at Handoff

When a PR gets `needs-human-review`, a screenshot pass runs: Playwright captures the
Storybook stories affected by the PR's changed files, once light and once dark, and posts
them to the PR as a single comment, which later passes update in place, plus a workflow
artifact. The reviewer sees the rendered result and not just the diff. The images are served
from the `story-screenshots` branch, which is disposable storage: deleting it only breaks
images in old handoff comments, and the next run re-creates it. To run the pass on any PR,
apply the `needs-human-review` label yourself or dispatch it directly with
`gh workflow run story-screenshots.yml -f pr=<number>`. Cross-cutting changes (shared helpers,
theme plumbing) map to no specific stories and produce an explicit "nothing to screenshot"
comment. If the pass itself breaks, the same comment says so and links the failed run. A
silent handoff always means there was nothing to show, never that the screenshots were lost.

## Guardrails

- **Humans always merge.** The bot cannot merge, enable auto-merge, or approve its own work,
  and `main` requires an approving review from a human.
- **Its branches are confined.** A repository ruleset keeps the bot on `claude/` branches,
  and its App holds no permission to change workflows.
- **It parks rather than thrashes.** After a bounded number of fix rounds on a PR it stops,
  labels the PR `ai-loop-paused`, and says why.
- **Kill switches.** Remove `ai-loop` to stop the bot on one PR. The maintainers can stop the
  bot entirely, and the repository variables below switch off the AI workflows that run in this
  repository.

### Repository Variables

The deep review and `@claude` run from this repository's own workflows. This repository also
still carries its own copies of the workflows for the security screen, triage, implementing
`claude-fix` issues and working their reviews, repro drafts, and the `@bestaxbot` reply, from
before the bot took that work over. Each reads a repository variable (Settings, then Secrets
and variables, then Actions, then Variables), so an operator can stop any of them, or turn a
copy back on, without touching the bot. Anything that spends model usage needs an exact value
to run, so unset, empty, `off`, and a typo all mean off. `AI_TRIAGE_MODE` is the exception, as
its row says.

| Variable                | Unset means     | Values                    | Controls                                                                                                                                                                                                        |
| ----------------------- | --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AI_CLAUDE_ENABLED`     | off             | exactly `true`            | The Claude deep review (`claude-review.yml`) and `@claude` (`claude.yml`)                                                                                                                                       |
| `AI_LOOP_ENABLED`       | off             | exactly `true`            | This repository's copies of the screen, triage, `claude-fix`, repro, and `@bestaxbot` workflows. The screen and triage each also need their own variable below                                                  |
| `AI_SCAN_MODE`          | off             | `on` or `y`               | This repository's copy of the security screen (`ai-scan.yml`)                                                                                                                                                   |
| `AI_SCAN_DAILY_LIMIT`   | `20`            | an integer                | Automatic scans per UTC day                                                                                                                                                                                     |
| `AI_TRIAGE_MODE`        | label runs only | `auto`, `label`, or `off` | This repository's copy of triage (`ai-triage.yml`). `label` runs it only on the `ai-triage` label, `auto` also on new issues and PRs as they open, and `off` not at all                                         |
| `AI_TRIAGE_DAILY_LIMIT` | `10`            | an integer                | Automatic triage runs per UTC day. Label runs and items from triage+ authors are exempt                                                                                                                         |
| `AI_TRIAGE_AUTOCLOSE`   | off             | `on` or `dry-run`         | Closing a flagged duplicate once its objection window passes (`auto-close-duplicates.yml`); `dry-run` logs what it would close and closes nothing. That workflow runs no model, so it reads this variable alone |
| `AI_LOOP_COPILOT`       | off             | exactly `true`            | Whether this repository's copy of the `claude-fix` workflow asks Copilot to review the PRs it opens                                                                                                             |

## Where the Bot Lives, and Reporting It

bestaxbot is a GitHub App maintained outside this repository. Its behaviour here is bounded
by gates GitHub enforces against its identity, whether or not its code is readable: the
ruleset that confines its branches, the permissions its App holds, and the human approval and
merge that `main` requires.

To report a misbehaving bot, comment on the PR or issue so a maintainer sees it, and remove
`ai-loop` if it is working a PR. For anything security-shaped, use the channels in
[SECURITY.md](https://github.com/allxsmith/bestax/blob/main/SECURITY.md).

## AI-ready scaffolds

New apps can start AI-ready too: accepting the AI-skills prompt in `npm create bestax@latest`
installs the bestax Agent Skills and a `CLAUDE.md`, plus a `.claude/launch.json` that tells
Claude Code's browser preview how to start the app's dev server (`npm run dev` on port 5173,
with `--strictPort` so a busy port fails loudly instead of silently drifting to another port).
If 5173 is already taken, the usual cause is an orphaned dev server from an earlier session;
the generated CLAUDE.md tells agents to kill the listener
(`lsof -tiTCP:5173 -sTCP:LISTEN | xargs kill`) rather than move ports. See the [LLMs guide](/docs/guides/llms) for the full AI tooling story.
