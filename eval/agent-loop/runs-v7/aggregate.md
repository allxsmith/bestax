# Post-routing verification — three MCP runs, and the streak breaks

Three MCP-arm runs against the routing fixes in [`cd6ce12`](../../..), same `skynet-platform`
brief, `rubric-v2.md`, same caps and frozen addendum as every arm before.

Spend: $56.20.

## No regression

| run    | build | tsc | inline styles | raw classes | imports | CSS lines | cost   | duration |
| ------ | ----- | --- | ------------- | ----------- | ------- | --------- | ------ | -------- |
| `mc01` | ✓     | 0   | **0**         | 1           | 71      | 105       | $15.51 | 1,848 s  |
| `mc02` | ✓     | 0   | **0**         | 1           | 71      | 58        | $15.27 | 1,826 s  |
| `mc03` | ✓     | 0   | **0**         | 13          | 65      | 621       | $25.42 | 3,160 s  |

Green throughout, no truncation, inline styles at zero, and the near-miss block rendered in
all three.

## `Dialog` is 8 of 9, not 9 of 9

`mc03` had the near-miss block in context, mounted `<DialogContainer />` at the app root, and
then built its confirm step out of `<Modal>` at `Demo.tsx:364` anyway — the exact
half-adoption `runs-v4/sk01` showed, on guidance that now says in as many words that mounting
a container without calling the API is not usage.

| campaign          | `Dialog`  |
| ----------------- | --------- |
| everything before | 0 / 44    |
| `runs-v5`         | 3 / 3     |
| `runs-v6`         | 3 / 3     |
| **`runs-v7`**     | **2 / 3** |
| **since the fix** | **8 / 9** |

Two reports ago this was written up as "6 of 6 across both channels against 0 of 44". The
perfect record was carrying more of the argument than it deserved, and it is gone at the first
opportunity. 8/9 is still a large move from 0/44 — but "it always works now" was never what
the evidence supported, and this is the run that shows it.
[#500](https://github.com/allxsmith/bestax/issues/500) stays open, and the ten-run arm it asks
for is more clearly justified than before, not less.

## `mc03` is an outlier on everything at once

13 raw Bulma classnames against 1, 621 CSS lines against 58–105, 65 imports against 71, and
$25.42 against ~$15.40. One run drifting on every quality metric simultaneously, with a
`Modal` in it, reads more like a builder that engaged less with the library than a tooling
regression — but that is a story about one run and it is not established here.

## The routing fix was never exercised

`cd6ce12` changed where `get_props` on a helper and a `search_bestax` helper hit point: both
now name `get_helper_props` instead of bouncing through `get_component`. Across all three
runs, **no builder called `get_props` on the helper or searched for it**. `useBulmaClasses`
appears only as a catalog line and inside a skill description; `mc03` made a single
`search_bestax` call and it was not for the helper.

So that fix remains verified by tests alone. Three runs failing to reach a path is itself
mild evidence the path is rare — which lowers the value of the fix without changing its
correctness.

## Caveats

- One brief, one model, one client, n=3.
- These runs share tooling with `runs-v6` except for three routing strings and a
  fence guard in `reflowTables`, so they are a regression check on those and not an
  independent measurement of the helper-props narrowing (that is `runs-v6`).
- Cost is not evidence here either. Two runs at ~$15.40 sit at the low end and one at $25.42
  near the top; the arm's range across ten `runs-v3` runs was $10.63–$24.92.
