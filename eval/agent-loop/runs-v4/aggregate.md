# Loop iteration 3 — the skills arm re-run, and a null result

Ten skills-only runs of the `skynet-platform` brief against `rubric-v2.md`, identical caps
(`--model opus --budget 30 --timeout 3600`) and the same frozen completeness addendum as
[`runs-v2`](../runs-v2/aggregate.md), whose skills arm is the control. The only thing that
changed is the skills: [`22dcff7`](../..) added a near-miss table naming `Toast`, `Dialog`
and `LinkButton` against the core-Bulma substitutions they lose to, and `2935bb2` replaced a
`Theme bulmaVars` recipe that did not compile.

Spend: $184.

## The headline is a null

|                          | control skills (n=10)  | **v4 (n=10)**    |
| ------------------------ | ---------------------- | ---------------- |
| `LinkButton`             | 5/10                   | **5/10**         |
| `Toast`                  | 10/10                  | **9/10**         |
| `Dialog`                 | 0/10                   | **0/10**         |
| green builds             | 10/10                  | 10/10            |
| not truncated            | 10/10                  | 9/10             |
| `inline_style_count`     | 0 ×10                  | **0 ×10**        |
| `raw_bulma_classnames`   | mean 1, max 2          | mean 1, max 1    |
| `bestax_named_imports`   | mean 70, range 65–75   | mean 71, 63–77   |
| `custom_css_added_lines` | mean 351, range 20–802 | mean 308, 13–625 |
| `tsc_errors`             | 0                      | 0                |
| cost                     | mean $17.82            | mean $18.41      |

**The guidance change moved nothing at the arm level.** `LinkButton` is 5/10 against 5/10 —
identical. `Toast` is one lower, which is noise. `Dialog` is zero in both.

The guard metric held: the same commit widened the decorative-CSS budget from two rules /
10 lines to three / 13, and inline styles stayed at zero in all ten runs while total custom
CSS actually fell (351 → 308 mean). Widening the budget did not license more CSS.

`sk08` was killed by the wall-clock watchdog at 3598 s of 3600. Kept as a datapoint and
flagged, per the harness rule that a timeout kill stops at a point the rubric can read.

## Two corrections this arm forced

Both were found while analysing it, and both matter more than the result.

**1. `Toast` never had a gap.** The extras check scored slots by presence in
`bestax_import_list`, and Toast is normally used as `import { ToastContainer, toast }` then
`toast.success('…')` — no symbol named `Toast` exists in such a build. Every run using the
imperative API scored as a miss. `runs-v2` published `Toast` at 0/10 skills and 6/10 MCP;
by call sites both arms were at **10/10**. So half of what `22dcff7` set out to fix was an
artifact of the counter. Corrected in [`d36caf7`](../..), which moves the rule into
`bin/lib/extras-usage.mjs` and guards it with 16 cases in `bin/test-extras-usage.mjs`. Both
earlier reports are struck through in place.

**2. Guidance placement is not observable from `metrics.json`.** `skill_files` counts explicit
reads under `.claude/skills/`; an auto-triggered `SKILL.md` is injected with no tool call, so
a run with the whole skill in context is indistinguishable from one that never saw it. The
`runs-v2` mechanism story leaned on that distinction without being able to make it.
`bin/check-skill-reach.mjs` now greps each transcript for text unique to the edit — and
enforces that uniqueness, after the first version used the class name `featured-ring`, which
appears in two skills, and scored `sk08` as having loaded a file it never opened.

## Why the null happened: the table reached 4 runs in 10

| near-miss table in context? | runs                               | `LinkButton` |
| --------------------------- | ---------------------------------- | ------------ |
| yes                         | sk01, sk05, sk07, sk09             | **4/4**      |
| no                          | sk02, sk03, sk04, sk06, sk08, sk10 | **1/6**      |

Fisher exact, one-sided: **p ≈ 0.024**.

**This is a post-hoc subgroup split and must be read as one.** The pre-registered test was
arm-level, and arm-level is the flat null above. Conditioning on whether the skill actually
loaded is an analysis invented after watching `sk02` miss — which is precisely how spurious
effects get published, so the number alone is not the argument.

What gives it weight is that the failure mode was named in advance. Every run without the
table produced one of the two substitutions the table's "not this" column lists by name:

| run                    | what it used for the "go back and edit" action |
| ---------------------- | ---------------------------------------------- |
| sk01, sk05, sk07, sk09 | `<LinkButton variant="underline">`             |
| sk02, sk04, sk06, sk10 | `Button color="text"`                          |
| sk03                   | `<a href="#">`                                 |

Two confounds were checked and ruled out. No run fetched any documentation page
(`docs_fetches: 0`, all ten), so the `LinkButton` docs fix in `2b1e188` cannot be the cause.
And the phrase "go back and edit" comes from the **brief** (line 42), which every run sees
identically — it is not leaking from the new guidance.

`sk08` is the exception that keeps this honest: no table, and it used `LinkButton` anyway.
One builder reached the right component unaided.

## The `Dialog` asymmetry is the real finding

`Dialog` is **0/10 here, including all four runs that had the table in context** — the same
file, the same delivery, the same builders that acted on the table's `LinkButton` row.
`sk01` went further: it imported `DialogContainer`, mounted it at the app root, never called
`dialog.confirm`, and hand-built the confirm step out of `Modal`.

Across every run of every arm ever recorded against this brief — 27 builds — `Dialog` is
used **0 times**, and `<Modal>` appears in the booking surface of **26**. The exception is
`sk07`, which built its confirm as an inline review stage needing no dialog at all. That is a
legitimate reading of the brief ("make them confirm" does not demand a blocking dialog), and
it suggests the completeness addendum's `Dialog` slot is somewhat over-specified. It does not
change the picture: 26 of 27 builders chose a modal _shape_ and then assembled it by hand
rather than using the component built for it.

Guidance was delivered, read, acted on for one component in the same table, and declined for
this one. That is about as clean a demonstration as this eval can produce that
**`Dialog` is a library-level problem, not a guidance-level one** — which is what
[#500](https://github.com/allxsmith/bestax/issues/500) argues.

## What to do with this

1. **Move the near-miss guidance to a surface that always loads — for scaffolded apps, that
   is the generated `CLAUDE.md`.** Not this repo's `CLAUDE.md`: the one
   `create-bestax` writes into the user's new project (`CLAUDE_MD` in
   `create-bestax/src/constants.ts`). Claude Code injects a project `CLAUDE.md` into the
   system prompt on every session, where a skill body only arrives when the model chooses to
   `Skill`-invoke or read it — which is the 4-in-10 above.

   **This is by design, not measured here.** `transcript.jsonl` does not record the system
   prompt, so the marker method cannot see `CLAUDE.md` delivery at all (it scores 0/20 in
   `runs-v2` and 1/10 here, and that one is an explicit read). The supporting evidence is
   indirect but strong: the no-inline-style rule lives in the generated `CLAUDE.md`, and
   `inline_style_count` is 0 across all ten skills runs **including the six that never
   loaded `layout-scaffold`** — while the pre-fix MCP arm, which is scaffolded with
   `--no-skills` and therefore has no `CLAUDE.md` at all, wrote 46 to 162.

   **Its reach is narrower than "every run".** `CLAUDE.md` is written inside `setupSkills()`
   (`project-creator.ts:145`), so it exists only when skills are installed. An MCP-only user,
   or anyone who added skills to an existing project with `npx skills add`, never gets one.
   For the MCP channel the equivalent always-on surface is the server's `instructions` plus
   the `list_components` footer — already proven in [`runs-v3`](../runs-v3/aggregate.md),
   where moving one rule onto a tool every builder calls took inline styles from a mean of
   76.7 to 1.1.

   This is #363's "placement beats content" finding, re-learned at a cost of $184.

2. **Leave the skills copy in place.** It is accurate, it costs nothing, and it works when
   delivered.
3. **`Dialog` needs the library-level decision in #500.** No amount of guidance placement
   will fix it; four builders read the instruction and ignored it.
4. **Re-run only after (1).** Repeating this arm without changing placement would buy another
   null at the same price.

## Caveats

- One brief, one model, one rubric version, one client. Auto-trigger behaviour is Claude
  Code's; a different host may load skills on entirely different terms.
- The reach split is post-hoc, as stated above. A pre-registered test would fix the placement
  first and compare arms.
- `sk08` truncated at the watchdog. It is included; excluding it would make the `LinkButton`
  conditional split look _better_ (4/4 vs 0/5), which is a reason to keep it.
- The control arm is from `runs-v2` rather than run concurrently. Nothing about the harness
  changed between them except the analysis code, which was re-applied to both.
