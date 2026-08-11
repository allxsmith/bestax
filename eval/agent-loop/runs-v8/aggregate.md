# The ten-run arm — `Dialog` is 12 of 19, not "fixed"

Ten runs against the current tooling, five per channel, same `skynet-platform` brief,
`rubric-v2.md`, same caps and frozen addendum as every arm since `runs-v2`. Run to answer one
question: **what is the `Dialog` rate now?**

Spend: $186.42. All ten green, zero tsc errors, none truncated.

## The answer

| campaign           | `Dialog`    |
| ------------------ | ----------- |
| everything before  | 0 / 44      |
| `runs-v5`          | 3 / 3       |
| `runs-v6`          | 3 / 3       |
| `runs-v7`          | 2 / 3       |
| **`runs-v8`**      | **4 / 10**  |
| **post-fix total** | **12 / 19** |

**63%, with a 95% interval of roughly 41–80%.**

That was the point of running ten. Significance was never in question — 12/19 against 0/44 is
p ≈ 10⁻⁹ — but at 8/9 the interval was 52–100%, which could not distinguish "essentially
fixed" from "works about half the time". It is now clearly the latter.

Against the bar registered before these runs started:

- ≥ 15/19 → the placement fix works, #500 closes as guidance-solved
- **10–14/19 → reachable but unreliable; the library-level argument stands** ← this
- < 10/19 → the 8/9 was luck

So **#500 stays open on its merits, not as a formality.** Guidance moved `Dialog` from never
to sometimes. It did not make it reliable, and three campaigns of "3/3, 3/3, 2/3" had me
describing something as near-solved that is a coin flip.

## By channel

| arm    | n   | `Dialog` | `Toast` | `LinkButton` | inline styles | raw classnames |
| ------ | --- | -------- | ------- | ------------ | ------------- | -------------- |
| MCP    | 5   | **1/5**  | 5/5     | 4/5          | mean 1.8      | mean 10.2      |
| skills | 5   | **3/5**  | 5/5     | 3/5          | **mean 0.0**  | mean 0.8       |

Post-fix by channel: MCP **7/12**, skills **5/7**. Both land in the same band and neither
separates from the other at these sizes.

The old channel signal reproduces exactly: the skills arm wrote **zero** inline styles in all
five runs and 0.8 raw Bulma classnames, against 1.8 and 10.2 for MCP. That has been true in
every campaign since `runs-v2` and is the strongest argument for shipping both channels.

`Toast` is **10/10**. Same table, same responses, same delivery as `Dialog` — which is the
sharpest version of the point: the guidance is being read and acted on, and `Dialog`
specifically is where builders decline.

## A caveat about the reach column

`check-skill-reach` reports "table absent" for `sk03`–`sk05`, and `sk03` used `Dialog` anyway.
That is not a contradiction: the marker matches the wording in
`bestax-layout-scaffold/SKILL.md`, and the skills arm's real delivery path is the **compressed
copy in the generated `CLAUDE.md`**, which is worded differently and which the transcript
cannot see at all (Claude Code injects it into the system prompt). So for the skills arm those
rows mean "did not load the skill file", not "had no guidance". The MCP rows are sound — that
block is a tool result and is captured.

## The v6/v7 → v8 swing has no explanation

The MCP arm went 5/7 across `runs-v6` and `runs-v7` and then 1/5 here. Fisher on that split is
p ≈ 0.06. The only code change between the campaigns was a redirect string, a search hint and
a fence guard, none of which has any path to `Dialog` adoption, and the rendered block was
checked directly mid-campaign: 2,250 characters with the `Dialog` row intact.

No mechanism was found, so none is claimed. The most likely reading is that 3/3, 3/3 and 2/3
were a lucky opening against a true rate near 60% — which is exactly the failure mode
`runs-v2`'s casualty table exists to record, and this is the fifth entry for it.

## Other numbers

- `custom_css_added_lines` 46–607, straddling both arms, still not a channel signal.
- Cost $11.14–$27.66, mean $18.62 — indistinguishable from every previous arm.
- `mc03`'s outlier profile from `runs-v7` (13 raw classnames, 621 CSS lines) did **not**
  recur as a pattern, though `mc02` here hit 37 raw classnames. High-variance metric, no trend.
