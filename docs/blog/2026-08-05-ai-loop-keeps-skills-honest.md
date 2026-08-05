---
slug: ai-loop-keeps-skills-honest
title: How Our AI Loop Keeps the Skills Honest
description: 'Seven agent skills are a claim: agents build better bestax apps with them than without. So we grade cold-start agent runs against a frozen rubric and iterate: 85/100 baseline to a 95.2 mean.'
authors: [asmith]
tags: [ai, skills, ci, storybook]
canonical_url: https://bestax.io/blog/ai-loop-keeps-skills-honest
publish_to_devto: true
image: /img/ai-loop-keeps-skills-honest.png
cover_image: /img/ai-loop-keeps-skills-honest.png
---

![How Our AI Loop Keeps the Skills Honest, drawn as pixel art: a builder robot hands a glowing bestax cartridge across a workbench to a grader robot whose clipboard scorecard reads 95.2](/img/ai-loop-keeps-skills-honest.svg)

Shipping seven agent skills is a claim: hand a coding agent this tooling and it builds better bestax apps than it would cold. Claims want numbers. So we grade cold agents against a frozen rubric, feed every finding back into the skills, and keep the receipts. This post is the receipts.

<!-- truncate -->

This is post seven of the catch-up series ([tracker](https://github.com/allxsmith/bestax/issues/384)). The [last post](/blog/fighting-ai-training-bias) was the what and the why: docs, skills, and a catalog that make the library machine-legible. This one is the proof and the process, how we verify the skills actually improve agentic coding, and how we improve the skills themselves, iteratively, on evidence. None of it is hypothetical. Every number below comes from a committed record you can read.

## Skills Are a Shipped Product

![Skills as a shipped product, drawn as pixel art: a bestax cartridge in an open retail box on a store counter beside a tray of bug tickets numbered 194 to 197, with a robot shopkeeper filing one](/img/ai-loop-keeps-skills-honest-shipped.png)

Start with the stakes. The first line of the skills directory's [contributor contract](https://github.com/allxsmith/bestax/blob/main/skills/CLAUDE.md) says it plainly: "Agent Skills are a shipped product." The [seven skills](/docs/skills/intro) reach users two ways, bundled into every `create-bestax` scaffold and installable with `npx skills add`, and the contract draws the conclusion: treat changes like library code, because "they get bug reports (#194, #195, #196, #197) and ship to users."

My favorite rule in that file is about repair. When fixing a skill bug, fix "the guidance that produced the bad output, not just the example." A wrong example is a symptom. The skill taught the mistake, so the skill is what gets fixed.

A shipped product with bug reports deserves what every shipped product deserves: proof that it works. Ours is a harness.

## The Proof: Graded Cold-Start Runs

![A graded cold-start run, drawn as pixel art: a builder robot types at a bare desk inside a test chamber while a grader robot watches through the window holding a clipboard rubric, the chamber door stamped cold start](/img/ai-loop-keeps-skills-honest-proof.png)

How do you grade "agents code better with this"? Cold. The harness lives in [`eval/skill-loop`](https://github.com/allxsmith/bestax/tree/main/eval/skill-loop), and one run is deliberately unsentimental:

- Scaffold a fresh app with the current tooling, the seven skills plus the CLAUDE.md the scaffolder generates.
- Hand a frozen brief to a cold-start `claude -p` session: fresh directory, no repo context, empty memory, the library installed from the registry. Exactly what a stranger's agent sees on day one.
- Collect mechanized metrics from the result: build pass, type errors, inline styles, raw Bulma classNames, hand-rolled tags, which skill files the agent actually read.
- A grader subagent scores a frozen [100-point rubric](https://github.com/allxsmith/bestax/blob/main/eval/skill-loop/rubric.md): build integrity, component adoption, prop fidelity, hallucination penalty, custom-component conformance, theming, site completeness, skill engagement. The mechanized metrics are ground truth the grader may not contradict.

The rubric's first check is my favorite kind of paranoia. An untouched scaffold typechecks, builds, and reports zero inline styles, zero invented APIs, zero hand-rolled tags. Graded naively, doing nothing collects 50 of 100 points. So before any category is scored, a gate checks whether the builder modified the app at all and zeroes the run if it didn't. Doing nothing is a failed run, not a clean sheet.

## The Improvement Loop: 85 to 95.2

![The improvement loop, drawn as pixel art: cartridges ride a circular conveyor past a wrench station and a scoreboard ticking from 85 to 95.2, with a robot tightening one cartridge mid-lap](/img/ai-loop-keeps-skills-honest-loop.png)

Measurement without iteration is trivia. The loop is grade, revise, re-run: read the scorecards, change the tooling (the skills, the generated CLAUDE.md template, the catalog generator), rebuild, and put the next cold agent through the same brief. We ran ten iterations against a fixed SaaS-site brief and wrote the whole thing down: findings in [#363](https://github.com/allxsmith/bestax/issues/363), method and per-run evidence in the committed [report](https://github.com/allxsmith/bestax/blob/main/eval/skill-loop/report.md).

|                      | Baseline (i01) | Revised runs (i02–i10)                                |
| -------------------- | -------------- | ----------------------------------------------------- |
| Rubric score         | 85/100         | mean 95.2 (median 96, min 89, max 99)                 |
| Raw Bulma classNames | 42             | 0 in all nine runs                                    |
| Custom CSS added     | 77 lines       | 10 to 21, converging on a sanctioned ~10-line pattern |
| Builder cost / turns | $10.55 / 127   | mean $6.00 / 79                                       |

The score rose while the cost of earning it fell 43% and the turn count fell 38%. Better guidance doesn't just produce better apps; it produces them with less thrashing.

The finding I keep reusing: **placement beats content**. Facts on always-loaded surfaces (the generated CLAUDE.md, the SKILL.md bodies, the catalog itself) held in every subsequent run. Facts one reference-hop away failed stochastically, even when the pointer to them was read. If you want an agent to know something every time, put it where the agent already is.

That finding is also the honest name for what this loop automates: preserving the model's context. Training data won't carry current bestax, which was the last post's whole argument. The skills are that context, and the loop is how it stays correct and gets better, on a schedule we control, at the pace of a script instead of the pace of organic bug reports.

Two disciplines keep the numbers trustworthy. The yardstick is frozen for the whole loop, same brief, same rubric, same caps, same model, so improvements go into the tooling and never into the test. And the graders get audited: three of the ten scorecards contained a factual error, caught by cross-checking them against the run transcripts before anything acted on them. After the final iteration, a compare-only pass confirmed the gains without shipping anything unvalidated.

The harness is reusable on purpose. Swap the brief, the skills state, or the model, freeze everything else, and the same protocol answers a new question. The first loop was the expensive one; the next ones are cheap.

## Captured Agent Runs

![A captured agent run, drawn as pixel art: a retro console replays a recorded build on screen while a label card beside it lists skill, prompt, model, and date, with a robot pointing at the card](/img/ai-loop-keeps-skills-honest-captured-runs.png)

Numbers convince maintainers. Seeing convinces everyone else. [Storybook](https://bestax.io/storybook) has a `Skills` section where the showcases are agent-generated: a skill's canonical example, built by an agent, rendered live. Each one opens with an `ExampleMeta` header recording exactly what produced it:

```tsx
<ExampleMeta
  skill="bestax-custom-component"
  skillHref={SKILL_HREF}
  model="Claude Opus 4.8"
  date="2026-06-27"
  prompt="Build a ProfileCard component — avatar on top, then name, role, and a short description — following the bestax custom-component skill."
/>
```

Prompt in, rendered output out, versioned alongside the components. The date tells you which era of the skill produced the example, and the current set lists two different models, Claude Opus 4.8 and Claude Fable 5, because the record keeps what actually ran. It's the same idea as the eval harness at a different altitude: a run you can replay with your eyes.

## Between Loops: Review and Gates

![Review and gates, drawn as pixel art: two reviewer robots flank a turnstile gate topped with a check-marked shield, one cartridge passing with an approved stamp while a dusty one bounces off with a yellow X](/img/ai-loop-keeps-skills-honest-gates.png)

An eval loop runs when we run it. Between loops, verification is continuous.

Every skill change is a PR through the same adversarial review as library code, CodeRabbit plus a Claude deep review, with a human doing every merge (the [AI-assisted development guide](/docs/guides/getting-started/ai-development) documents the machinery). That's how the [bestax-icons skill](https://github.com/allxsmith/bestax/pull/302) landed, how [dark-mode contrast rules](https://github.com/allxsmith/bestax/pull/303) got into the theming and layout skills, how the [skills-sync check](https://github.com/allxsmith/bestax/pull/326) itself arrived, and how [bestax-optimize](https://github.com/allxsmith/bestax/pull/329) shipped.

And CI fails outright when skill content drifts from the library:

- The component catalog the custom-component skill leads with is **generated from the API docs**; CI regenerates it and fails on any diff. The generator itself fails if an exported component lacks an API page, so the 87-entry list an agent reads is complete by construction.
- A **skills-sync conformance check**: the theming skill's shipped inventories must name every registered `--bulma-*` variable and every component with its own `color` prop. Add a themeable component without updating the skill and the build says no.
- The contributor checklist makes it a habit, not a heroic act. The heading in the component checklist reads, verbatim: "Skills sync (same PR, always)."

## What the Loop Keeps Finding

![What the loop keeps finding, drawn as pixel art: a corkboard pinned with issue tickets numbered 367 through 371 while a robot pins one more, a glowing cartridge resting on the shelf below](/img/ai-loop-keeps-skills-honest-findings.png)

A working loop's output is a to-do list. The ten runs didn't just raise the score; they filed library bugs and feature gaps that are open right now:

- [#367](https://github.com/allxsmith/bestax/issues/367): color props typecheck values that ship no CSS, and `Box` color falls through to a text class
- [#368](https://github.com/allxsmith/bestax/issues/368): the form `label` prop renders a Label but wires no `htmlFor`/`id`
- [#369](https://github.com/allxsmith/bestax/issues/369): no scheme-aware background route for dark mode
- [#370](https://github.com/allxsmith/bestax/issues/370): API-consistency traps agents actually hit, like `isFullWidth` vs `isFullwidth` and `Tag isLight`
- [#371](https://github.com/allxsmith/bestax/issues/371): scaffold polish, from a `.gitignore` gap to a dev-server port fallback

I like that list more than I like the 95.2. The eval's job isn't to certify the skills; it's to find where the skills and the library still let an agent down, faster than waiting for a user to hit it.

The honest limits come straight from the harness docs: one brief, one model, ten runs, and single-run scores swung by six points with identical tooling, so one run is one sample and trends need several. That's fine. The yardstick is built, the baseline is recorded, and the next loop inherits both.

The [tracker](https://github.com/allxsmith/bestax/issues/384) has the rest of the publishing plan, and the [last post](/blog/fighting-ai-training-bias) has every entrypoint if you want the skills in your own agent. This post just wanted to show you the grading. Skills are a shipped product, so they get what shipped products deserve: proof.
