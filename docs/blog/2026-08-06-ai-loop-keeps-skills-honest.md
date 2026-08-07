---
slug: ai-loop-keeps-skills-honest
title: Accelerated Evolution for Agent Skills
description: 'Coding agents barely know new libraries, so bestax ships skills that teach them. Then we proved the skills work with graded cold-start runs and evolved them for ten generations: 85/100 to a 95.2 mean.'
authors: [asmith]
tags: [ai, skills, ci, storybook]
canonical_url: https://bestax.io/blog/ai-loop-keeps-skills-honest
publish_to_devto: true
image: /img/ai-loop-keeps-skills-honest.png
cover_image: /img/ai-loop-keeps-skills-honest.png
---

![Accelerated Evolution for Agent Skills, drawn as pixel art: a builder robot hands a glowing bestax cartridge across a workbench to a grader robot whose clipboard scorecard reads 95.2](/img/ai-loop-keeps-skills-honest.svg)

Ask a coding agent for a dashboard in a library its training data barely saw, and one of two things happens: it quietly switches to the popular library it has seen a million times, or it stays loyal and invents props that don't exist. We fought that with agent skills, playbooks that teach an agent our library. This is the story of what came after: proving the skills actually work, then making them better the way evolution would, just faster.

<!-- truncate -->

The fight itself is quick to retell. bestax is our React component library for Bulma, young enough and niche enough that no model's training data carries it properly. Whatever is over-represented gets recommended, recommendations compound, and a library outside that flywheel barely exists to an agent; even a model that has met bestax has met an old bestax, frozen at its training cutoff. I made the long version of that argument in [Fighting AI Training Bias](/blog/fighting-ai-training-bias), along with everything we ship to counter it: docs a machine can read whole, a complete component catalog, and seven agent skills. What that post couldn't answer was the question that matters: do the skills actually make agents better? This one is about how we found out, and what we did with the answer.

## Skills in the Wild

![Skills as a shipped product, drawn as pixel art: a bestax cartridge in an open retail box on a store counter beside a tray of bug tickets numbered 194 to 197, with a robot shopkeeper filing one](/img/ai-loop-keeps-skills-honest-shipped.png)

A skill is a folder of instructions and reference files a coding agent loads before it works. Documentation tells an agent what exists; a skill tells it how we actually build things. bestax ships [seven](/docs/skills/intro): page layouts, forms, theming, icons, custom components, CSS optimization, and migrating off an older Bulma library.

They aren't an internal experiment, either. Every app scaffolded with `npm create bestax@latest` gets the bundle preinstalled, and one `npx skills add` command drops them into any existing project. That makes them a product, and products meet reality: people install them, hit the gaps, and [file them as bugs](https://github.com/allxsmith/bestax/issues/196). Good. A skill that teaches a wrong pattern is worse than no skill at all, because it teaches that mistake to every agent that loads it. It's why skill bugs get a particular kind of fix around here: repair the guidance that produced the bad output, not just the example that exposed it.

But bug reports only tell you where a skill failed someone. They can't tell you whether the skills work at all. For that, we built an exam.

## The Exam: Cold-Start Runs

![A graded cold-start run, drawn as pixel art: a builder robot types at a bare desk inside a test chamber while a grader robot watches through the window holding a clipboard rubric, the chamber door stamped cold start](/img/ai-loop-keeps-skills-honest-proof.png)

You can't ask an agent whether the skills helped. You have to strip everything away and watch one work. One run of [our harness](https://github.com/allxsmith/bestax/tree/main/eval/skill-loop) goes like this:

- Scaffold a brand-new app with the current tooling: the seven skills plus the small rules file the scaffolder writes.
- Hand a frozen brief (build this SaaS marketing site) to a cold-start agent session: fresh directory, no project history, empty memory, the library installed from the public registry. Exactly what a stranger's agent sees on day one.
- Measure the result by machine: did it build, how many type errors, how many inline styles, how many raw CSS classes where a component prop existed, how many hand-rolled widgets, which skill files the agent actually opened.
- Have a separate grader agent score it against a frozen [100-point rubric](https://github.com/allxsmith/bestax/blob/main/eval/skill-loop/rubric.md), under one hard rule: the machine-measured numbers are ground truth the grader may not contradict.

My favorite part is the gate at the very top of the rubric, a specific kind of paranoia. An untouched scaffold typechecks, builds, and reports zero inline styles, zero invented props, zero hand-rolled widgets. Graded naively, an agent that does nothing collects 50 of 100 points. So before anything is scored, the harness checks whether the agent modified the app at all, and zeroes the run if it didn't. Doing nothing is a failed exam, not a clean sheet.

## Accelerated Evolution

![The improvement loop, drawn as pixel art: cartridges ride a circular conveyor past a wrench station and a scoreboard ticking from 85 to 95.2, with a robot tightening one cartridge mid-lap](/img/ai-loop-keeps-skills-honest-loop.png)

One exam gives you a score. The interesting move is running it as a loop, because the loop is evolution with the waiting removed.

Evolution needs three things. A fixed environment: the brief, the rubric, the model, and the budget caps stayed frozen for the whole experiment. Variation: after each run we read the scorecard and revised the tooling, the skills, the generated rules file, the component catalog, then rebuilt. Selection: a fresh cold agent took the same exam against the revised tooling, and revisions that didn't survive the grading didn't stay. We ran ten generations that way and [wrote everything down](https://github.com/allxsmith/bestax/blob/main/eval/skill-loop/report.md), scorecards and metrics per run.

|                            | First run (baseline) | Nine revised runs                                                                      |
| -------------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| Rubric score               | 85/100               | mean 95.2 (median 96, min 89, max 99)                                                  |
| Raw CSS classes in output  | 42                   | 0, in every run                                                                        |
| Custom CSS added           | 77 lines             | 56 in the first, then 10 to 21, settling near the ~10-line pattern the skills sanction |
| Agent cost / turns per run | $10.55 / 127         | mean $6.00 / 79                                                                        |

The score rose while the cost of earning it fell 43% and the turn count fell 38%. Better guidance doesn't just produce better apps; it produces them with less thrashing.

Two disciplines kept the selection honest. The yardstick never moved: improvements went into the tooling, never into the brief or the rubric, or the generations stop being comparable. And the graders got audited: three of the ten scorecards contained a factual error, caught by checking them against the run transcripts before anything acted on them. After the last generation, a compare-only pass confirmed the gains without shipping anything unvalidated.

One lesson from those generations transfers to anyone writing guidance for agents: **placement beats content**. Facts that lived on surfaces the agent always loads held in every generation that followed. Facts one reference-hop away failed randomly, even when the agent read the pointer to them. If an agent must know something every time, put it where the agent already is.

And that's what "accelerated" means here. The slow version of this loop exists everywhere: ship guidance, wait months for bug reports, fix, wait again. Model training is slower still; a fix in our skills reaches agents today, while a fix in training data reaches them a model from now. The loop compresses a feedback cycle we don't control into one we run on a schedule, ten generations for the price of a script.

## Runs You Can Watch

![A captured agent run, drawn as pixel art: a retro console replays a recorded build on screen while a label card beside it lists skill, prompt, model, and date, with a robot pointing at the card](/img/ai-loop-keeps-skills-honest-captured-runs.png)

Numbers convince maintainers. Seeing convinces everyone else. Our [Storybook](https://bestax.io/storybook) has a Skills section where the showcases are agent-generated: each skill's canonical example was built by an agent following that skill, and it renders live next to the components themselves. Every example opens with a small header recording exactly what produced it: the skill, the prompt, the model, and the date. The current set lists two different models, because the record keeps what actually ran. It's the exam at eye level: prompt in, rendered page out, replayable with your own eyes.

## Holding the Line Between Generations

![Review and gates, drawn as pixel art: two reviewer robots flank a turnstile gate topped with a check-marked shield, one cartridge passing with an approved stamp while a dusty one bounces off with a yellow X](/img/ai-loop-keeps-skills-honest-gates.png)

Evolution only accumulates if survivors don't quietly regress between generations, so the daily machinery guards the skills the way it guards the library code.

Every skill change goes through the same adversarial review as a component change: two AI reviewers pick at it and a human does every merge (that pipeline is [its own story](/docs/guides/getting-started/ai-development)). The [icons](https://github.com/allxsmith/bestax/pull/302) and [optimization](https://github.com/allxsmith/bestax/pull/329) skills landed that way, and so did the [dark-mode contrast rules](https://github.com/allxsmith/bestax/pull/303) in the theming and layout skills.

The build itself also fails when the skills drift from the library:

- The component catalog agents read is generated from the docs, and CI fails on any diff, so the list is complete and current on every commit. A component the catalog can't see is a component an agent will rebuild.
- The theming skill's inventories must name every themable component and CSS variable the library registers. Add a themable component without updating the skill, and the build says no.
- A house rule with teeth: a library change that invalidates skill guidance updates the skill in the same pull request, always.

None of that replaces the loop. It keeps the loop's winnings from eroding while nobody's looking.

## Still Evolving

![What the loop keeps finding, drawn as pixel art: a corkboard pinned with issue tickets numbered 367 through 371 while a robot pins one more, a glowing cartridge resting on the shelf below](/img/ai-loop-keeps-skills-honest-findings.png)

A working loop's best output isn't the score; it's the to-do list. The ten generations filed real bugs and gaps, open right now: color props that typecheck [values with no shipped styles](https://github.com/allxsmith/bestax/issues/367), a form label [never wired to its input](https://github.com/allxsmith/bestax/issues/368) for screen readers, [no clean route](https://github.com/allxsmith/bestax/issues/369) to a scheme-aware background in dark mode, [casing traps](https://github.com/allxsmith/bestax/issues/370) like `isFullWidth` on one component and `isFullwidth` on another, and [scaffold rough edges](https://github.com/allxsmith/bestax/issues/371) an agent shouldn't have to route around. I like that list more than I like the 95.2. Agents tripped over these in a test chamber so users don't have to in production.

The honest limits, straight from the harness's own docs: one brief, one model, ten runs, and single-run scores swung by six points on identical tooling, so one run is one sample and trends need several. That's fine. The yardstick is built, the baseline is recorded, and the next loop starts where this one stopped: swap the brief or the model, freeze everything else, and evolve again.

That's the whole story. Training bias made our library invisible to agents, so we [made it legible](/blog/fighting-ai-training-bias) and taught the technique with skills. The exam made the skills provable. Evolution, run fast, keeps making them better. If you want the skills in your own agent, the last post has every entrypoint, and the [tracker](https://github.com/allxsmith/bestax/issues/384) is where the next generation lands.
