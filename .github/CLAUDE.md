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

- **I1 — in the publishing pipeline, the model-auth token never shares a job with code
  execution.** `CLAUDE_CODE_OAUTH_TOKEN` pays for a session; anything that can run code in the
  same job can read it out of the environment. `claude-repro.yml` splits drafting from publishing
  for exactly this reason: the drafting job has no `Bash`, no `Task`, no network tool, so it
  cannot read env, fetch, or execute. Note the direction of the guarantee — it raises the cost of
  exfiltration, it is not a proof. The credential-shape check in `Collect draft` (literal,
  base64, and hex forms) is a backstop for the same reason, and is documented as one.

  **Read the scope precisely, because the unqualified version is false.** This is a property
  `claude-repro` is _built_ to preserve, not a repo-wide fact. `claude-implement`,
  `claude-pr-loop` (`fix`/`verify`), `claude-review`, `claude` and `bestaxbot-reply` all check
  out a branch and run repository code in the same job as that token, and they must — fixing and
  reviewing code is the job. What holds them is a different, weaker set: the tool allowlist, the
  protected-path deny rules, the trusted-labeler gates, and (once #578 lands) an enforced egress
  policy. Saying I1 covers those jobs would be the exact overstatement the checklist at the
  bottom of this file ends on. It covers the pipeline that was designed around it.

  harden-runner's egress block enforces again as of #487 — `block` used to degrade silently to
  `audit`, and now enforces and is asserted (rule 10). **Do not promote it to a third leg of
  I1**, which an earlier draft of this file did while `claude-repro.yml` said the opposite: on
  the exfil path I1 exists to close — `Write` plus a later publishing job — the drafting job's
  egress policy bounds nothing, because the publishing job has no policy of its own. Be exact
  about what it does add: it bounds **where** a session can send data, not **what** it can do
  with the hosts it is allowed. `api.github.com` is
  necessarily allow-listed in every one of these jobs, so egress-block cannot stop a write
  issued through a tool. Never trade away a tool restriction on the grounds that "egress is
  blocked anyway" — the two controls cover different things, which is the whole reason both
  exist.

- **I2 — no untrusted or model-authored free text reaches a re-trigger-capable identity.**
  Comments posted with `GITHUB_TOKEN` do not emit workflow events. Comments posted with a PAT
  **do**. Two shapes address this, and only one of them is airtight — be precise about which
  you are relying on.

  `claude-repro.yml` changes the IDENTITY: the drafted reproduction is sanitized
  deterministically and posted via `GITHUB_TOKEN`, whose comments emit no events at all. That
  is structural — no text can re-trigger anything, whatever it says.

  `ai-triage.yml` keeps the PAT identity (#361 wanted it) and narrows the TEXT instead. Since
  #457 the session posts nothing; a deterministic renderer owns every structural string (the
  markers, `Duplicate of #N`, `Fixes #N`, the auto-close notice) and every issue reference is
  a validated integer. But the published body still carries two bounded model-authored fields,
  a candidate's title and a one-line reason, escaped and defanged against the KNOWN
  re-trigger vectors — mentions, markers, autolinks, machine sentinels. It cannot defang a
  trigger token nobody has invented yet: a literal `/retest` in a title survives into the
  comment today. So for that residual class rule 8's sender exclusions are still **the** layer,
  not a second one, and a future comment-triggered workflow that forgets them reopens it.

  Publishing the two fields is a deliberate, revisitable trade — a prose-free comment (bare
  `#N` references, or a renderer-owned enum in place of the reason) would make this structural
  too, at the cost of the signal a human reads the comment for. Do not describe the triage path
  as closing I2 by construction; describe it as narrowing the surface and keeping rule 8.

## Hard requirements

### 1. Pin every third-party action to a full commit SHA — the same SHA everywhere

`SECURITY.md` advertises SHA pinning as an active control, so this is a promise to users, not
housekeeping. One SHA per action across all workflow files, and the trailing comment must name
the version that SHA **actually is**.

Current pin: `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7` (this is v7.0.1).

When bumping, bump every occurrence in a single commit and verify there is exactly one:

```bash
grep -rho "actions/checkout@[a-f0-9]\{40\}" .github/ | sort | uniq -c   # expect one line
```

That one is scoped to the action you are bumping. Nothing scopes the rule that way, so also run
the repo-wide form, which names **any** action carrying more than one SHA:

```bash
grep -rhoE "[A-Za-z0-9_.-]+/[A-Za-z0-9_./-]+@[a-f0-9]{40}" .github/ \
  | sort -u | cut -d@ -f1 | uniq -d          # expect NO output
```

The per-action grep only ever sees the action you thought to type, so a second action left on a
stale SHA by an earlier bump stays invisible to it however many times you run it.

Note both greps cover `.github/`, not `.github/workflows/`: `.github/actions/verified-commit/`
pins `actions/github-script` too, and the narrower path cannot see it — it would print exactly
the "one line" this rule tells you to expect while the composite action sat on a stale SHA.

Those greps are the whole verification. **No CI gate checks workflow _content_** — `format:check`
does lint `.github` markdown and `.mjs`, and `ci.yml` runs `.github/scripts/pin-react.mjs`, so
the directory is not untouched by CI, but nothing verifies a pin, a policy or a permission.
Three consequences worth holding on to:

- **Do not move a security-relevant step into a local composite action.** Not for the pin's
  sake — both greps recurse over `.github/`, so a pin under `.github/actions/` still matches, and
  an earlier draft of this bullet claimed the opposite. The reason is that reading the job **is**
  the whole review signal here, and `harden-runner` is the case that matters: its `egress-policy`
  and `allowed-endpoints` are argued per job against the credential in _that_ job (rule 2), and
  rule 10's inventory is checked by reading each one. Behind a wrapper, a job's egress posture is
  no longer visible where the job is, and a shared wrapper collapses those separate allowlists
  into one — a widening with no `permissions:` diff, which is the hazard at the top of this file.
- **`harden-runner` has an assertion tied to its pin.** Every block-mode job asserts the
  effective policy out of `/home/agent/agent.json` (rule 10). That path is an internal detail of
  the action with no compatibility guarantee, so a bump that moves or renames it fails every
  block job at once. That is the intended direction, but check it when bumping rather than being
  surprised by it.
- **The pin does not fully determine which agent binary runs.** Before installing, the pre-step
  calls `isTLSEnabled(owner)`, a 3-second probe of a StepSecurity endpoint that **fails open** —
  on any error or timeout it logs `Unable to check TLS_STATUS. Defaulting to TLS enabled.` and
  returns true, selecting `agent-ebpf` instead of `agent`. Only the latter is source-available,
  so the paths and status strings rule 10 asserts can only be verified against that one. Today
  this org's endpoint answers 403 (`TLS_NOT_ENABLED`), so the verifiable binary is what runs; a
  StepSecurity outage would swap it with no diff and no pin change. If every block job goes red
  at once with no workflow change, check this before anything else.

Origin: #361 shipped two new workflows pinned to `9c091bb…` (v7.0.0, twelve commits behind)
while nineteen other usages were on v7.0.1 — and both were commented `# v7`, so the drift was
invisible to a reader. Copilot caught it; nothing in CI would have.

### 2. Never widen `--allowedTools` on a session that holds a credential

**Treat every allowlist in this directory as security-critical.** It is a confinement boundary,
not a convenience list, and widening it grants capability with **no permissions diff for a
reviewer to notice** — the `permissions:` block looks identical before and after.

Two sessions where the allowlist is the _only_ thing between untrusted text and a credential.
Read the third column for **which** credential — since #455 and #457 neither session can
reach repository write any more, and "the session can't write to the repo" is not the same
claim as "the allowlist stopped mattering":

| Workflow        | Credential in the session's job                                                                                   | What the allowlist is holding back                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-triage.yml` | `CLAUDE_CODE_OAUTH_TOKEN`; job `GITHUB_TOKEN` is **read**-scoped (`contents`/`issues`/`pull-requests`) since #457 | **Repository write: nothing any more.** This session held `AI_LOOP_PAT` — full repo write, unscoped by the job's `permissions:` block — until #457 split publishing out: the session emits a structured payload, `scripts/render-triage-comment.mjs` renders the comment, and the PAT lives only in a `publish` job that runs no model. **The model credential: everything.** The session still runs Bash (GET-only `gh`) and Task beside `CLAUDE_CODE_OAUTH_TOKEN`, so by I1 the allowlist is what stands between an injected session and reading that token out of the environment. #457 closed the concrete instance of that — `Read` is not workspace-confined, and the prefix match accepted `gh issue comment N --body "$CLAUDE_CODE_OAUTH_TOKEN"`. Narrow, not retired.    |
| `ai-scan.yml`   | `CLAUDE_CODE_OAUTH_TOKEN`; job `GITHUB_TOKEN` is **read**-scoped (`contents`/`issues`/`pull-requests`) since #455 | **Repository write: nothing any more.** The budget marker and the `needs-security-review` label moved to separate `gate` and `label` jobs that run no repository code, and only the coarse verdict enum crosses between them, so widening the allowlist can no longer grant issue/PR write. **The model credential: everything.** This job still runs Bash beside `CLAUDE_CODE_OAUTH_TOKEN`, so by I1 the allowlist is what stands between an injected session and reading that token out of the environment. Egress-block IS enforced here as of #487 (rule 10), and the two are complementary rather than redundant: it bounds **where** data can go, while `api.github.com` is necessarily allow-listed, so it cannot stop a write issued through a tool. Narrow, not retired. |

Concrete rules:

- Adding **any** entry to those two allowlists is a security change. Say so in the PR
  description and explain why the entry cannot write.
- Never add `Bash(gh api:*)` to a session that ingests untrusted issue/PR text — it is a
  general-purpose write primitive wearing a read-shaped name.
- Never add `Edit`, `Write`, `MultiEdit`, or `Task` to `ai-scan.yml`.
- `--disallowedTools` is defense in depth, and its deny rules do take precedence over the
  allows — but do not lean on it as the primary control. Narrow the allowlist.
- Prefer removing the need for the boundary over hardening it. #455 is the worked example:
  `ai-scan.yml` was one job whose write scopes the model session merely happened not to use,
  and it became three (`gate` / `scan` / `label`) so the session's own job grants are
  read-only. The allowlist did not change; what changed is that it is no longer the only
  thing standing behind it. When a session's job holds a write scope for the benefit of some
  _other_ step, that is the shape to look for.
- #457 is the same move against the harder case, and worth reading second: `ai-triage`'s
  session did not merely sit near a write credential, it **held** one — the Claude action
  installs its `github_token` as the session's `GH_TOKEN`, so passing `AI_LOOP_PAT` handed an
  untrusted-text-ingesting session full repo write. Splitting the job was the only way to get
  it a genuinely read-only credential without minting a new secret, because `GITHUB_TOKEN` is
  job-scoped and the budget marker needs `issues: write` somewhere. The lesson to carry: when
  a session's credential is passed _to the action_ rather than merely present in the job,
  narrowing the allowlist cannot reach it at all — only moving the work can.

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
Three extractions exist. The two from #454: the scan-verdict parser
(`scripts/parse-scan-verdict.mjs`, called by `ai-scan.yml`) and the publish sanitizer
(`scripts/sanitize-repro-draft.mjs`, called by `claude-repro.yml`) — their test siblings pin
the fail-closed matrix and the byte behavior of the shell they replaced, so edit script and
tests together. Then #457's triage renderer/publisher
(`scripts/render-triage-comment.mjs`, called twice by `ai-triage.yml` — once per mode), which
is the largest and the one to read first: it validates a model-authored payload, renders the
comment from renderer-owned constants, and upserts it by marker. Its test sibling runs the
real `auto-close-duplicates.mjs` consumer over rendered output, so the two cannot drift.
Smaller instances of the same shape remain inline (the exec-file sentinel
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

**Every block-mode job must carry the assertion step** (placement rules below the snippet):

```yaml
- name: Assert egress policy is enforced
  run: |
    set -uo pipefail
    [ -e /home/agent/agent.json ] || { echo "::error::harden-runner installed no agent"; exit 1; }
    jq -e '.egress_policy == "block"' /home/agent/agent.json || exit 1
    for _ in $(seq 1 30); do
      grep -q '^Initialized' /home/agent/agent.status 2>/dev/null && exit 0
      sleep 1
    done
    exit 1
```

Copy the full version from any block job — the three shapes above are each load-bearing:

- **The `-e` check comes first** because harden-runner has deliberate paths that install nothing
  and still exit 0 (a StepSecurity outage, the `skip-harden-runner` repo property, a container or
  slim runner). Without it a vendor outage fails every block job at once — twelve of them as of
  the inventory below, not the seven this line said before the `ai-scan`/`ai-triage` job splits —
  with a bare `jq: could not open file`. It still fails, because a job holding a credential must
  not run unprotected, but it says why. Do not hand-maintain that number: it is the count of
  block-mode jobs, and it has been wrong once already.
- **The status check polls** rather than testing once. The pre-step waits only for the file to
  _exist_ and gives up after ~9s, while the agent resolves every allow-listed host before writing
  its status, so a cold resolver or a long list can leave it absent or empty at this point.
- **`^Initialized`, not `-qx`.** `writeStatus` appends without a trailing newline, so a second
  status would concatenate onto the same line and an exact-line match would stop matching.

**Placement.** The default is immediately after harden-runner, and most jobs use it. Two things
override it, both derived from one rule:

> A fail-closed check must not be able to consume, skip, or precede the thing that keeps the
> fail-closed path reachable.

- **After any gate an `always()`-guarded fail-closed step depends on, and before any step that
  spends a metered budget.** `ai-scan`'s `gate` is the live example, and it needs both: putting
  the assertion first would abort before `run` is set and skip the labeler; letting the same step
  read _and_ charge the budget would spend a slot on every run that failed to prove enforcement,
  and `AI_SCAN_DAILY_LIMIT` such failures in a UTC day (a StepSecurity outage reaches every
  incoming item at once) set `run=false`, which skips that same labeler. So: decide → assert →
  charge. That job also records `enforcement=failed` before exiting, because `label` deliberately
  fails OPEN on ordinary gate trouble and must fail CLOSED on this one — see its comment.
- **After the write, when the job _is_ the fail-closed path.** `ai-scan`'s `label` and
  `ai-triage`'s `cleanup` exist to guarantee a label is applied and removed respectively; a check
  that can fail ahead of that call defeats the guarantee outright, which is also why their
  harden-runner steps are `continue-on-error`. Assert afterwards under `always()`: the write has
  happened, and a job that ran unprotected still goes red. These two are the only assertions in
  the repo placed after their job's work — if you add a third, say why here.

Both exceptions were previously "resolved" by simply leaving the assertion off those jobs. Do not
go back to that: an unasserted block job is indistinguishable from an enforcing one, which is the
whole failure #487 was.

**A related trap, one step earlier: harden-runner is step 0, so if the ACTION fails the job dies
before emitting anything.** In `ai-scan` that skipped the fail-closed labeler, because its guard
reads `needs.gate.outputs.run`. A vendor outage, not an attacker, and the assertion cannot help —
it never runs. The fix is `continue-on-error: true` on that harden-runner so the gate step still
emits its outputs, with the assertion immediately after to fail the job and set
`enforcement=failed`. Non-blocking there is not "unprotected and ignored": the job still goes red,
it just gets to record why first. Whenever a downstream `always()` job keys off an upstream job's
**outputs** rather than only its `result`, check what happens if step 0 dies.

Worth tracing the whole matrix when touching any of this, because five of these paths look alike
and only three should flag:

| What fails in `ai-scan`      | `label` runs?                              | Correct outcome                                    |
| ---------------------------- | ------------------------------------------ | -------------------------------------------------- |
| harden-runner action (gate)  | yes, via `enforcement=failed`              | flag — nothing was enforcing                       |
| the assertion (gate or scan) | yes                                        | flag — nothing was enforcing                       |
| the `scan` job               | yes (`result` is `failure`, not `skipped`) | flag — empty verdict hits the enum default         |
| the gate's budget read       | no                                         | **no flag** — counter trouble fails open (rule 4)  |
| budget spent, or bot author  | no                                         | no flag — nothing was scanned and nothing is wrong |

**Both lines are required; either alone is a false pass.** `agent.json` holds the policy the
pre-step _decided_, serialized after every policy decision, so it catches a downgrade — which is
what #487 was. `agent.status` is written only once the firewall rules are actually installed,
and it is the line that catches the other failure: `agent.json` is written _before_ the agent
starts, so if the agent fails to come up, the pre-step logs `timed out`, prints the agent log and
**still exits 0**, leaving `block` in the config and no firewall.

Note the actor there, because it is easy to state wrongly: **the pre-step never reverts
anything** — it contains no revert call at all (`grep -c RevertChanges src/setup.ts` → 0). Every
revert is the agent's; the pre-step only makes one visible by printing `agent.log`. When
debugging a red assertion, `Reverted changes` is in the agent's output, not harden-runner's.

**What the pair does NOT prove is that the policy stays armed.** In `step-security/agent`, the
sequence is `writeStatus("Initialized")` (agent.go:307) and then a serve loop whose
`case e := <-errc:` (:313) calls `RevertChanges` (:315). So any runtime error after
initialization tears the firewall down while `agent.status` still reads `Initialized` and
`agent.json` still reads `block` — **both assertion lines pass, nothing is enforcing.**
Separately, `refreshDNSEntries` re-resolves every 30s and on failure only logs
`failed to insert new ipaddress in firewall` (:357), so an allow-listed host whose IPs rotate can
quietly stop being reachable.

Two further false-pass modes are known and not covered, both latent for this repo but worth
knowing before anyone leans harder on the check:

- **A private repo or fork without an active StepSecurity subscription.** The agent re-decides
  the policy in-process (`if config.Private && !isActive` → audit) and writes `Initialized`
  outside every policy branch, while `agent.json` — written by the pre-step — still reads
  `block`. Both lines pass, audit rules are installed. bestax is public, so this does not bite
  here; a private mirror would inherit a green check asserting the opposite.
- **`denied-endpoints`**, new in v2.21.0. Set beside `allowed-endpoints` it is dropped with a
  `core.info`; set alone on a non-enterprise org the tier gate drops it too, leaving block with
  an empty allow list _and_ an empty deny list behind a `core.warning`. Both files still read as
  armed. We do not use the input; do not adopt it without re-reading this rule.

Take the assertion for exactly what it is: proof that enforcement was **armed at that step**, not
a guarantee for the life of a 30-60 minute session. There is no step-level check for the latter —
if a session behaves oddly, read the StepSecurity run report for `Reverted changes` rather than
trusting the green step.

**Do not "fix" this by adding a liveness check**, and this note exists because review has now
proposed it twice. Asserting `systemctl is-active agent` would only cover the fraction of a second
between the agent initializing and this step running; the revert that matters happens minutes
later, mid-session, where no step-level check reaches. In exchange it would hard-code an internal
unit name **and** bind every block job to the TLS-path binary selection described in rule 1 — so a
StepSecurity outage would turn all of them red at once. The gap is real and is stated here
deliberately rather than papered over with a check that does not close it.

That second failure is not theoretical. The PR that introduced this assertion shipped with only
the `jq` line and passed green on a job where the firewall had reverted. Which leads to the
sharpest operational rule here:

> **An unresolvable host in `allowed-endpoints` disables the entire policy.** harden-runner's
> agent aborts and reverts when it cannot resolve an allow-listed domain. A dead entry is not
> inert — `statsig.anthropic.com` had gone NXDOMAIN, and its presence silently turned the
> firewall off. Before adding a host, resolve it; when a run reports `Reverted changes` or
> `timed out`, suspect the allowlist before anything else.

Where the state actually stands, since "which jobs enforce" was mis-stated repeatedly during
issue #487 and the distinction is load-bearing. **Scope: this covers the AI/automation workflows
and the jobs adjacent to them, per job, not every job in the directory** — the ordinary build
jobs (`ci.yml`, `deploy.yml`, `test-deploy.yml`, `visual-regression.yml`, `story-screenshots.yml`,
`scorecard.yml`, `dependency-review.yml`) carry no harden-runner and are out of scope here.

- **Enforcing and asserted** — all three `ai-scan` jobs (`gate`, `scan`, `label`), all four
  `ai-triage` jobs (`gate`, `triage`, `publish`, `cleanup`), `claude-repro` (`author` **only**),
  `deploy-worker` (`deploy`), `supply-chain` (`consumer-sbom` and `sign-sbom`),
  `security-txt-expiry` (`check`). Twelve jobs; the command below is the check.
- **Audit, deliberately, pending a measured allowlist** — `claude`, `claude-implement`,
  `claude-pr-loop` (`fix` and `verify`), `claude-review`, `bestaxbot-reply`. These run repo code
  with a model token; their block flip is the follow-up this rule owes, tracked in #578.
- **No harden-runner at all**, and these are two different groups — do not merge them into one
  "API-only" line, which understates the second:
  - _Genuinely API-only_ — `auto-close-duplicates`, `on-slop`, `auto-label-claude-prs`,
    `close-stale-bestaxbot-prs`, `stale`; `claude-repro`'s `prepare`, `publish` and `cleanup`;
    and `claude-pr-loop`'s `sweep`/`gate`/`handoff`/`halt`. These call the GitHub API and run no
    build.
  - _Grandfathered, and they DO execute code_ — `supply-chain`'s `sbom` (installs the monorepo
    and runs SBOM generators), `attach-sbom` (downloads and uploads release artifacts) and
    `verify-provenance` (installs published packages and runs verification scripts). Calling
    these API-only, as this list did until review caught it, understates the unmonitored
    execution and egress surface in the one inventory meant to state it precisely.

Do not maintain the first bullet by hand — it was wrong twice. Regenerate it:

```bash
grep -rl "harden-runner@" .github/workflows/ | sort   # which files, then read the jobs
```

The authoritative check is that no `block` job lacks the assertion; parse the YAML rather than
eyeballing it, because the two are in different jobs and sometimes several steps apart.

`on-slop` and `auto-label-claude-prs` are the two to look at first if this group is ever
worked: both run on `pull_request_target` — the highest-privilege trigger class here — with
write scopes. They hold no model token, which is why they are not in the group above, but they
are not "API-only" in the harmless sense either.

`claude-repro` deserves the emphasis: only its `author` job is hardened. **`publish` — the job
that runs the sanitizer over attacker-influenced text and holds `issues: write` — has no egress
policy at all.** Anyone citing "claude-repro enforces egress" is overstating it by three jobs.

Keep this inventory correct when you add a job, and qualify per job rather than per workflow. Its
first version omitted `bestaxbot-reply` and named `claude-repro` unqualified — a table that
quietly misses a model-token job, or implies coverage a workflow only partly has, is worse than
no table, for the same reason a comment that overstates its mechanism is.

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
- [ ] Action SHAs match the repo-wide pin, and the version comment is truthful — run **both**
      greps in rule 1, including the repo-wide one that covers every action rather than the one
      you thought to type.
- [ ] New `block` job carries the effective-policy assertion (rule 10), placed per that rule's
      placement section; security-relevant steps stay in the workflow rather than moving behind a
      local composite action (rule 1 — pins under `.github/actions/` are fine and one exists, so
      this is about per-job review, not pin location).
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
