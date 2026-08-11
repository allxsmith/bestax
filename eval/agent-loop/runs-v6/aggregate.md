# Post-narrowing verification — three MCP runs

Three MCP-arm runs against the reshaped `get_helper_props` surface (`b865651`), same
`skynet-platform` brief, `rubric-v2.md`, same caps and frozen addendum as every arm before.
Only the MCP channel changed, so the skills arm was not re-run.

Spend: $62.92.

## The check that mattered

The inline-style rule is still prepended to every `get_helper_props` answer, but the document
under it went from 51,054 characters to 4,648. If the rule was only working because of what
surrounded it, `inline_style_count` is where that shows.

| run    | build | tsc | **inline styles** | raw classes | imports | CSS lines | cost   | turns | MCP calls |
| ------ | ----- | --- | ----------------- | ----------- | ------- | --------- | ------ | ----- | --------- |
| `mc01` | ✓     | 0   | **0**             | 1           | 72      | 135       | $15.80 | 176   | 55        |
| `mc02` | ✓     | 0   | **0**             | 2           | 74      | 35        | $22.64 | 179   | 11        |
| `mc03` | ✓     | 0   | **0**             | 1           | 72      | 77        | $24.48 | 239   | 15        |

Zero across all three, and import breadth is at the top of the arm's history (72–74 against a
`runs-v3` mean of 67.7). Narrowing the reference did not cost a builder access to props it
needed — which is what keeping all 46 prop names in the default was for.

`Toast`, `Dialog` and `LinkButton` are **3/3 each**, load-bearing.

One run passed `group: "responsive"`, so the curated-group path was exercised in the wild and
resolved, not just in tests.

## The claim that did not survive

I predicted the 42% character reduction would show up in cost. **It did not, and it should not
have been expected to.**

| arm                  | cost                             |
| -------------------- | -------------------------------- |
| `runs-v3` MCP (n=10) | mean $18.51, range $10.63–$24.92 |
| `runs-v5` `mc01`     | $26.02                           |
| **`runs-v6` (n=3)**  | **mean $20.97, $15.80–$24.48**   |

Squarely inside the historical range, and three runs cannot separate a real effect from a
2.4× spread. The arithmetic says why: ~46,000 characters saved is ~11.5k tokens, which is
cents against a $20 run dominated by writing seven pages of TSX. `mc01` made 55 tool calls
for $15.80 while `mc02` made 11 for $22.64 — tool traffic is not what these runs cost.

**So the win is context-window headroom, not money**, which is what was actually asked for.
The measurement that supports it is the character count, taken directly through the protocol;
cost was never going to be the evidence and citing it would have been motivated reasoning.

## Where `Dialog` now stands

`Dialog` is **6 of 6** across `runs-v5` and `runs-v6`, on both channels, against **0 of 44**
before the placement fix. That is a much stronger position than the n=3 in `runs-v5` — but it
is still six runs of new tooling compared against a before-period, not a randomised arm, and
[`runs-v2`](../runs-v2/aggregate.md) lists four confident findings that died as runs
accumulated. [#500](https://github.com/allxsmith/bestax/issues/500) stays open until a
ten-run arm says otherwise.

## Caveats

- One brief, one model, one client, n=3.
- The three runs share tooling with `runs-v5` except for the `get_helper_props` reshape, so
  they are a regression check on that change and not an independent measurement of anything
  else.
- `custom_css_added_lines` (35–135) is well under the arm's historical mean but the metric has
  never been a channel signal; no claim is made from it.
