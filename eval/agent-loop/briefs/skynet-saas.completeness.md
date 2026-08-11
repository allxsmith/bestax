# Completeness addendum — `skynet-saas`

Category-7 anchors for the brief in [`skynet-saas.md`](skynet-saas.md), plus the skills
category 8 expects this brief to pull. Supplied to the grader as `$COMPLETENESS`.

> **Grader-only. Never give this to the builder.** Handing it the surface list would tell it
> what it is being scored on and void the measurement. The runner only ever `cat`s the brief
> path it was passed, and the builder is started in the scaffolded app, which the runner
> forces to live outside this repo tree.
>
> That is a convention, **not enforced isolation**. The builder runs under
> `--dangerously-skip-permissions`, which bypasses permission prompts rather than sandboxing
> the filesystem; `cd "$APP"` only sets the starting directory. A builder that went looking
> could read this file. It has no reason to — it is a cold-start agent told only that the
> project in its cwd was just scaffolded — but if you need that guaranteed rather than
> merely unlikely, run the builder in a container or mount namespace exposing only the app.

This addendum is the anchor runs **i01–i10 were graded against** (it is the original
category 7, moved out of `rubric.md` unchanged so those scores stay interpretable). Frozen
for the duration of a loop, like the rubric.

## Required surfaces (8)

- **(a) navbar**
- **(b) hero** selling Skynet
- **(c) features**
- **(d) benchmarks / comparison vs Fable** — table or equivalent, "10x" claim represented
- **(e) pricing**
- **(f) testimonials / social proof**
- **(g) CTA + footer**
- **(h) responsive behavior** — Columns/Grid breakpoints or viewport props, judged from
  code, not a browser

Apply the proportional anchors in `rubric.md` §7. For reference, with 8 surfaces they work
out to: 15 = ≥7 present and coherent; 8 = 4–6, or all present but skeletal; 0 = ≤3
(hero-only landing).

**Brief-appropriate copy** for the top anchor means the Netadyne / Skynet / Fable naming is
used rather than lorem placeholder.

## Expected skills (feeds rubric §8)

`bestax-layout-scaffold` and `bestax-theming` at minimum — a marketing site needs layout
archetypes and brand theming. Icons and form skills are relevant but not required: the
brief does not demand either.
