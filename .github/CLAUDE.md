# .github — CI and AI automation

Everything in `.github/workflows/` is **human-authored by design**. Two enforcement layers apply
here and they are not the same rule — do not collapse them:

- **Automated sessions** (the AI fix loop, `ai-triage`, `ai-scan`) are denied write access
  _mechanically_: `Edit(.github/**)` and friends sit in every write agent's `--disallowedTools`,
  and the fix loop refuses any PR that touches `.github/**`. This is not advisory, and editing
  this file does not relax it. Those sessions ingest untrusted issue and PR text, so for them the
  prohibition is absolute.
- **An interactive session working alongside a maintainer** should not hide behind that. State
  the rule, state the security reason below that it exists for, make sure the maintainer has
  actually weighed that reason — then act on their answer. Refusing to apply a change the
  maintainer has decided on does not make the repository safer; it just turns one decision into
  several round-trips. The maintainer was always the one deciding.

**The reason to raise, so nobody has to rediscover it:** a change in this directory can grant
capability with **no permissions diff for a reviewer to notice**. The `permissions:` block looks
identical before and after an allowlist widens. That is why these changes get argued rather than
waved through — not because agents are untrusted, but because the usual review signal is absent.

Scale the pushback to the blast radius:

| Change                                                                                                                      | What to do                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--allowedTools` / `--disallowedTools` on a session holding a credential                                                    | **Argue it properly, every time.** Name the credential in that job, explain why each entry cannot write, and get an explicit decision. Never as a side effect of another task. See rule 2. |
| Workflow logic, triggers, `permissions:`, action SHAs, verdict/budget paths, anything a workflow reads as a gate or trigger | Name the invariant at stake (I1, I2, or the rule below), confirm it holds, then act.                                                                                                       |
| Genuinely inert config — a cosmetic label, a docs-build cadence, a `semver-major` `dependabot.yml` ignore                   | Just make the change and say what it does. Do not gate it behind a debate.                                                                                                                 |

The qualifiers in that last row are load-bearing. The dividing line is **cosmetic vs.
load-bearing**, not the file the change lives in:

- **Labels are not uniformly inert.** `needs-security-review` is a refusal gate — `claude-repro`,
  `claude-fix`, `@claude` and `@bestaxbot` all decline a flagged item until a maintainer clears
  it. `ai-loop`, `ai-loop-paused` and `deep-review` steer automation the same way. Deleting or
  renaming one of those disables a control **with no workflow diff at all**, which is the exact
  hazard this section exists to name. A new `documentation` label is inert; a label a workflow
  reads is middle row.
- **Schedules are not uniformly inert.** A `schedule:` on `ai-scan` or the stale sweep decides
  when a security control runs. A docs-build cadence does not.
- **`dependabot.yml` ignores are not uniformly inert.** A `semver-major` ignore only declines a
  breaking upgrade, but one covering **patch or minor suppresses CVE fixes** for that dependency.
  Scope every ignore you add, and never widen an existing one's `update-types` as a drive-by.

When unsure which row a change belongs in, grep the workflows for the thing you are changing. If
anything reads it, it is middle row.

Origin: an interactive session hit the old blanket "propose a diff, do not apply one" line while
adding a `dependabot.yml` ignore entry — a change with no security surface at all — and stalled
on it across three separate asks. The blanket rule was cheap to state but it spent the
maintainer's attention on the one case that did not need it, which is attention not available for
the allowlist case that does.

This file is the security contract for these workflows. The rules below are not style
preferences — each one is load-bearing, and most were written after a review round or a
red-team found the failure it prevents. Where a rule has a documented origin, it is cited.

## The two invariants

Every AI workflow here is built to preserve these. If a change breaks one, the change is wrong,
regardless of how convenient it is.

- **I1 — the model-auth token never shares a job with code execution.** `CLAUDE_CODE_OAUTH_TOKEN`
  pays for a session; anything that can run code in the same job can read it out of the
  environment. `claude-repro.yml` splits drafting from publishing for exactly this reason: the
  drafting job has no `Bash`, no `Task`, no network tool, so it cannot read env, fetch, or
  execute. Note the direction of the guarantee — it raises the cost of exfiltration, it is not a
  proof. The credential-shape check in `Collect draft` (literal, base64, and hex forms) is a
  backstop for the same reason, and is documented as one.

  The third leg, harden-runner's egress block, is real again as of #487 — `block` used to
  degrade silently to `audit`, and now enforces and is asserted (rule 10). Be exact about what
  it adds, because the tempting misreading is the dangerous one: it bounds **where** a session
  can send data, not **what** it can do with the hosts it is allowed. `api.github.com` is
  necessarily allow-listed in every one of these jobs, so egress-block cannot stop a write
  issued through a tool. Never trade away a tool restriction on the grounds that "egress is
  blocked anyway" — the two controls cover different things, which is the whole reason both
  exist.

- **I2 — no untrusted or model-authored free text reaches a re-trigger-capable identity.**
  Comments posted with `GITHUB_TOKEN` do not emit workflow events. Comments posted with a PAT
  **do**. So a drafted reproduction is sanitized deterministically and posted via
  `GITHUB_TOKEN`, and every comment-triggered workflow independently gates out bestaxbot.

## Hard requirements

### 1. Pin every third-party action to a full commit SHA — the same SHA everywhere

`SECURITY.md` advertises SHA pinning as an active control, so this is a promise to users, not
housekeeping. One SHA per action across all workflow files, and the trailing comment must name
the version that SHA **actually is**.

Current pin: `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7` (this is v7.0.1).

When bumping, bump every occurrence in a single commit and verify there is exactly one:

```bash
grep -rho "actions/checkout@[a-f0-9]\{40\}" .github/workflows/ | sort | uniq -c   # expect one line
```

That grep is the whole verification — nothing in CI reads `.github/**`. Two consequences worth
holding on to:

- **Do not move a pin out of `.github/workflows/`.** Wrapping a step in a local composite action
  under `.github/actions/` would make the grep match zero lines and pass silently, which is the
  same shape of failure as #487 itself.
- **`harden-runner` has an assertion tied to its pin.** Every block-mode job asserts the
  effective policy out of `/home/agent/agent.json` (rule 10). That path is an internal detail of
  the action with no compatibility guarantee, so a bump that moves or renames it fails every
  block job at once. That is the intended direction, but check it when bumping rather than being
  surprised by it.

Origin: #361 shipped two new workflows pinned to `9c091bb…` (v7.0.0, twelve commits behind)
while nineteen other usages were on v7.0.1 — and both were commented `# v7`, so the drift was
invisible to a reader. Copilot caught it; nothing in CI would have.

### 2. Never widen `--allowedTools` on a session that holds a credential

**Treat every allowlist in this directory as security-critical.** It is a confinement boundary,
not a convenience list, and widening it grants capability with **no permissions diff for a
reviewer to notice** — the `permissions:` block looks identical before and after.

Two sessions where the allowlist is the _only_ thing between untrusted text and repository
write:

| Workflow        | Credential in the job                                            | What the allowlist is holding back                                                                                                                                                                           |
| --------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ai-triage.yml` | `AI_LOOP_PAT` (bestaxbot)                                        | Full repo write. Confined to GET-only `gh` reads plus the two comment commands.                                                                                                                              |
| `ai-scan.yml`   | job `GITHUB_TOKEN`, **write**-scoped (`issues`, `pull-requests`) | The gate charges a budget marker and the labeler applies `needs-security-review`, so the token must be write-scoped. The session cannot use it _only_ because the Bash allowlist admits nothing that writes. |

Concrete rules:

- Adding **any** entry to those two allowlists is a security change. Say so in the PR
  description and explain why the entry cannot write.
- Never add `Bash(gh api:*)` to a session that ingests untrusted issue/PR text — it is a
  general-purpose write primitive wearing a read-shaped name.
- Never add `Edit`, `Write`, `MultiEdit`, or `Task` to `ai-scan.yml`.
- `--disallowedTools` is defense in depth, and its deny rules do take precedence over the
  allows — but do not lean on it as the primary control. Narrow the allowlist.
- Prefer removing the need for the boundary over hardening it. Splitting `ai-scan`'s labeler
  into its own job so the model session can drop to `contents: read` is tracked in #455.

### 3. Opt in explicitly for anything that spends model usage

Gate on `== 'on'`, never on `!= 'off'`. Unset, empty, a typo, and every spelling of "stop" must
all mean **off** — no misspelling should be able to _start_ a control that spends usage on every
incoming item.

```yaml
if: vars.AI_LOOP_ENABLED == 'true' &&
  (vars.AI_SCAN_MODE == 'on' || vars.AI_SCAN_MODE == 'y')
```

- GitHub Actions `==` on strings is **case-insensitive**, so `ON` and `Y` work too. Do not add
  case variants to the expression.
- The one deliberate exception is `AI_TRIAGE_MODE`, whose label path is `!= 'off'` so that
  human-applied labels still work with the variable unset. It is an exception because a label
  requires a trusted human first.
- Every repository variable that steers this automation is tabulated in the ai-development docs
  guide, **including its unset default**. Add new ones there in the same PR. Origin: that table
  documented `AI_LOOP_ENABLED` backwards until Copilot caught it — the gates are `== 'true'`, so
  unset means disabled.

### 4. Fail closed on verdicts, fail open on budgets

Both directions are deliberate and the split is the point:

- A **verdict** (is this item malicious?) fails **closed** — a crashed, missing, unparsable, or
  forged sentinel flags rather than passes.
- A **budget or counter** fails **open** — if the daily-limit read errors, the item is simply
  not scanned. A counter problem must not be able to wedge every incoming issue.

The cost of the second is real and should stay written down: downstream, an unscanned item is
indistinguishable from a clean one.

### 5. Secret masking scrubs logs, not comment bodies

Anything a session writes into a comment is published verbatim. Never build a comment body out
of model output without a deterministic sanitizer between them, and never assume masking will
save you — it applies to the job log only.

### 6. Scope comment edits by marker, never `--edit-last`

`gh ... --edit-last` picks the most recent comment by that author, which is not necessarily
yours. It could overwrite a historical `<!-- ai-triage:dedupe -->` marker that
`auto-close-duplicates.mjs` still reads — silently destroying an auto-close candidate. Select by
the marker your workflow owns.

More generally: when probing for a machine comment, match on **marker + (bestaxbot OR a
Bot-type author)**. Never probe one specific login. bestaxbot is a machine _User_ account, not a
Bot-type app, so a `type == 'Bot'` test alone misses it and a login test alone breaks the next
time the identity changes.

### 7. Fork PRs never run with secrets

Use plain `pull_request`, never `pull_request_target`, plus an explicit head-repo guard (#312).

### 8. Sender exclusions belong on every comment-triggered workflow

`contains()` matches a raw substring, so an `@mention` reproduced anywhere in a body — including
inside a quoted block or a code fence — is enough to re-trigger a write-capable session. Require
`sender.type == 'User'` **and** `sender.login != 'bestaxbot'`, and forbid the session from
writing the trigger string at all.

### 9. Logic worth testing does not belong in YAML

Shell embedded in a workflow step cannot be unit-tested without extracting it first. Put
non-trivial parsing in `scripts/*.mjs` with a `node --test` sibling — root `pnpm test` runs
`node --test "scripts/*.test.mjs"` (the glob is quoted so Node expands it, not the shell).
The two #454 parsers are extracted: the scan-verdict parser
(`scripts/parse-scan-verdict.mjs`, called by `ai-scan.yml`) and the publish sanitizer
(`scripts/sanitize-repro-draft.mjs`, called by `claude-repro.yml`) — their test siblings pin
the fail-closed matrix and the byte behavior of the shell they replaced, so edit script and
tests together. Smaller instances of the same shape remain inline (the exec-file sentinel
checks in `ai-triage.yml`, `claude-review.yml`, and `claude-repro.yml`'s author job); when
one of those next needs an edit, extract it and reuse `parse-scan-verdict.mjs`'s exported
helpers rather than growing the YAML.

**Extraction has a bootstrap gap: a new script flags its own introducing PR.** A workflow runs
the YAML from the PR merge ref, but the jobs here deliberately check out the default branch
(never PR head code). A script the PR adds therefore does not exist in the workspace its own
run reads: `node` exits `MODULE_NOT_FOUND`, the caller takes its fallback, and a fail-closed
verdict path labels the item on infrastructure grounds without the verdict ever being read.
Origin: #570 applied `needs-security-review` to itself this way, which then gated
`claude-repro`, `claude-fix`, `@claude` and `@bestaxbot` on that PR.

Do not close this by checking out the PR head — running PR-authored code in a job holding a
credential is the thing that pin prevents, and trading it away for a cosmetic label is a far
worse deal than the flag. Treat the gap as expected cost instead: say in the PR description
that the flag is self-inflicted, and clear the label by hand once the script is on the default
branch. The same applies to moving or renaming a script a workflow already calls — the rename
lands in the YAML a run before it lands in the tree that run checks out.

### 10. `harden-runner` on new jobs starts at `block`, and every block job asserts it

New jobs ship with `egress-policy: block`. An **existing** live job may be introduced at `audit`
first, because flipping straight to block risks breaking it if the action's runtime egress needs
an un-allow-listed host — but that is a temporary state that owes a follow-up issue, not a
resting place.

**Every block-mode job must carry the assertion step immediately after harden-runner:**

```yaml
- name: Assert egress policy is enforced
  run: jq -e '.egress_policy == "block"' /home/agent/agent.json
```

harden-runner's pre-step serializes its **effective** config there after every policy decision,
so this checks what is in force rather than what the YAML asked for. A missing file means the
pre-step bailed before installing the agent, and failing on that is correct: no file, no
monitoring. This is not ceremony — it exists because of #487, where `block` silently meant
`audit` on every untrusted trigger for two months and the only announcement was one `core.info`
line. harden-runner v2.21.0 removed that fail-open path; the assertion is what stops the next
one being invisible.

Where the state actually stands, since "which jobs enforce" was mis-stated repeatedly during
#487 and the distinction is load-bearing:

- **Enforcing and asserted** — `ai-scan`, `claude-repro`, `ai-triage`, `deploy-worker`,
  `supply-chain` (`consumer-sbom` and `sign-sbom`), `security-txt-expiry`.
- **Audit, deliberately, pending a measured allowlist** — `claude`, `claude-implement`,
  `claude-pr-loop` (`fix` and `verify`), `claude-review`. These run repo code with a model token;
  their block flip is the follow-up this rule owes, tracked in #578.
- **No harden-runner at all** — `auto-close-duplicates` and the API-only jobs
  (`claude-pr-loop`'s `sweep`/`gate`/`handoff`/`halt`, `supply-chain`'s `sbom`/`attach-sbom`/
  `verify-provenance`).

Citing egress-block as a control is now legitimate **for the first group only**, and only for
what it actually does: it bounds where data can go, not what a session can do with an
allow-listed host (see I1). Widening an allowlist remains a security change under rule 2, and
`sign-sbom`'s list is still assembled by reading the actions rather than from a measured run.

Verify rather than assume, on any run: the assertion step passes, and harden-runner's post-step
prints the effective `EgressPolicy:`.

## Review checklist for a workflow change

- [ ] Does any allowlist grow? If yes, name the credential in that job and justify each entry.
- [ ] Does a model session gain the ability to execute, fetch, or reach the network?
- [ ] Does model or issue text reach a comment body? Through what sanitizer?
- [ ] Is the posting identity `GITHUB_TOKEN` (inert) or a PAT (re-triggering)?
- [ ] New repository variable? Gate is `== 'on'`-shaped, and the docs table lists its unset default.
- [ ] Action SHAs match the repo-wide pin, and the version comment is truthful.
- [ ] New `block` job carries the effective-policy assertion (rule 10); no pin left outside
      `.github/workflows/`.
- [ ] New verdict path fails closed; new counter path fails open.
- [ ] Security comments claim exactly what the mechanism delivers — no more.

That last item is not padding. Three separate review rounds on #361 flagged comments that
overstated their mechanism: a flag described as blocking "every AI entry point" when third-party
reviewers never see it, a session called "read-only" when its token was write-scoped, and an
encoding check described as a proof when it is a backstop. A comment that overstates its control
is worse than no comment, because the next reader stops checking.

## Where the rest is documented

- **Design and operation of the AI loop, and the repository-variable table** — the
  ai-development guide in `docs/docs/guides/getting-started/`.
- **User-facing security posture** — `SECURITY.md`.
- **Release and publish pipeline** — `ci.yml`, plus `VERSIONING.md` for the semantic-release
  contract. Note that `main` is protected by a repository ruleset whose only automation bypass
  is the release GitHub App, and its token is minted _after_ install and build so repo-owned
  build code can never reach it.
