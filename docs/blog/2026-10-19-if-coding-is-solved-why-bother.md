---
slug: if-coding-is-solved-why-bother
title: 'If Coding Is Solved, Why Bother?'
authors: [asmith]
tags: [ai, opinion]
---

People keep saying coding is a solved problem. Maybe it mostly is. What I don't get is what everyone is doing with it.

<!-- truncate -->

Look at what gets launched. To-do apps, note-taking apps, chat wrappers around the same few models, landing-page generators, and clones of SaaS products that already have a free tier. It's the same handful of ideas over and over.

If code is cheap now, then rebuilding something that already exists is worth even less than it used to be. The ideas that are actually good are still hard to execute, and most people aren't working on them.

## Copying Is Easy

AI models are trained on what already exists, so they're best at reproducing things that have been built many times. Ask for a Kanban board or a checkout flow and you'll get a decent one, because there are thousands of examples to learn from.

That's why a clone takes a weekend. Whoever built the original had to work out what to build and what to leave out. Whoever copies it can just look at the finished product.

The result is a lot of wasted effort. People are spending compute, API credits, and their own time rebuilding apps that already exist, and the next person can copy theirs just as quickly.

## Why Coding Went First

Code has two things most fields don't: a huge amount of public training data, and a fast, cheap way to check the work. You write it, run the tests, read the error, and try again.

An agent can run that loop many times in a few minutes for very little money. When checking is that cheap, a model can keep trying until something works.

Most hard problems don't have a loop like that. Checking the answer might take a lab experiment, a hardware prototype, a clinical trial, or years of waiting. AI has a hard time closing the loop in those settings, and that's where the unsolved problems are.

## Where AI Is Easy, and Where It Isn't

![Four boxes in a grid. Top left, plenty of data and cheap to check: solved and crowded, with to-do apps, chat wrappers, clones, landing pages, and CRUD dashboards. Top right, plenty of data and expensive to check: high stakes, slow proof, with self-driving, medical diagnosis, and safety-critical software. Bottom left, little data and cheap to check: open math and algorithms, with novel proofs, faster algorithms, and formal verification. Bottom right, little data and expensive to check: the frontier, with robotics, materials, batteries, lab science, fusion, and new drugs.](/img/if-coding-is-solved-why-bother-matrix.png)

Most of what people are building sits in the top left, where there's plenty of data and the answer can be checked in seconds. The bottom right has little data and expensive checks, and that's where the hardest unsolved problems are.

## The Hard Problems

These are the areas where AI still struggles, either because there isn't much data, the work is expensive to check, or the physical world has to be involved.

- **Computationally expensive work.** Protein design, drug discovery, materials, weather and climate models. The limit is compute and the math behind it, not how fast someone can write code.
- **New math and algorithms.** Novel proofs, faster algorithms, formal verification. There's nothing to copy because nobody has done it yet.
- **The physical world.** Robotics, batteries, chips, manufacturing, lab science. Every test costs time, materials, and money, and simulations often don't match what happens in reality.
- **Proving software is correct.** Aviation, medical devices, cars, power grids. Passing tests isn't enough; these systems need evidence they won't fail.
- **Data that doesn't exist yet.** Rare diseases, equipment failures, events that seldom happen. Someone has to collect that data before anything can be trained on it.
- **Long feedback loops.** Drug trials, infrastructure, agriculture. It can take years to find out whether something worked.
- **Legacy and regulated systems.** Decades-old code that runs pensions, payroll, and benefits, under rules with real legal liability. Modernizing it without breaking anything is slow, careful work.
- **Making AI cheaper to run.** Faster inference, smaller models, better chips, lower energy use.
- **Getting people to adopt things.** Hospitals, school districts, and city governments move slowly, and trust takes time to build.

The AI results that have actually mattered came out of this kind of work. Protein structure prediction, plasma control in fusion reactors, and olympiad-level math all took large compute budgets, domain experts, and a reliable way to check the results.

## Using AI on Hard Problems

AI can help with all of the above. It just isn't where most people are pointing it. A few ways it's useful:

- Generating a large number of candidates (molecules, designs, proof steps) so the expensive real-world testing goes to the most promising few.
- Pairing it with something that can check its output, like a proof assistant, a simulator, a lab, or an expert reviewer. Without a check, you can't tell good output from output that only looks right.
- Taking over routine work like literature review, data cleanup, and test harnesses, so specialists spend more of their time on the hard parts.
- Connecting it to sensors, instruments, and automated labs so it can learn from real measurements instead of only from text.

That last one is the area I find most interesting. Getting AI to reliably test its ideas against the physical world is still an open problem, and very few people are working on it compared to how many are building apps.

## Builders and Founders

I don't think shipping a clone makes someone a founder. Starting a company usually means taking on a problem without a known solution, and then finding out whether anyone will pay for yours.

A lot of the people calling themselves builders are generating apps that already exist. The people doing the difficult work, like connecting AI to lab equipment, proof checkers, or industrial systems, mostly aren't posting about it. Their progress is slower and harder to show off in a demo.

## So Why Bother?

If the plan is to rebuild an app that already exists, I'm not sure there's a good reason anymore. Anyone else can do the same thing in the same amount of time.

The reason to bother is the work that's still hard: problems where the data doesn't exist, the math isn't known, or the only way to check the answer is in the real world. That's where AI could help the most, and it's where the fewest people are looking.
