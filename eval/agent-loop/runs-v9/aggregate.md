# The published artifact — three runs against `bestax-mcp@1.0.0` from npm

Three MCP-arm runs against the server **installed from the registry**, not `bestax-mcp/dist`.
Same `skynet-platform-mcp` brief, `rubric-v2.md`, opus, $30 budget and 3600 s cap as the
`runs-v8` MCP arm. The only variable changed is which artifact serves the tools.

Spend: $52.19. All three green, zero tsc errors, none truncated.

## Why this arm exists

Every previous run measured the working tree. The tarball is a different object: it is
assembled by `files` plus `prepack`, so it can differ from the tree in ways no test in this
repo observes. `data/skills/` is the sharp case — gitignored, synced at pack time, and read
by `get_skill`, `list_skills`, `inlineStyleRule` and `nearMissRule`. If it had not shipped,
the server would still start and still answer component questions, and the failure would show
up only as guidance quietly going missing.

It shipped. All seven skills are in the tarball, and a 12-check protocol smoke test against
the published package passes end to end.

## Results

| metric                | pb01   | pb02   | pb03   |
| --------------------- | ------ | ------ | ------ |
| build / tsc errors    | ✓ / 0  | ✓ / 0  | ✓ / 0  |
| inline styles         | 0      | 0      | 1      |
| raw Bulma classnames  | 1      | 1      | 1      |
| hand-rolled tags      | 0      | 0      | 0      |
| bestax named imports  | 70     | 71     | 74     |
| custom CSS lines      | 117    | 46     | 49     |
| MCP tool calls        | 53     | 49     | 54     |
| distinct tools (of 9) | 8      | 7      | 8      |
| cost                  | $17.47 | $22.92 | $11.80 |

Call-site scoring (`extras-usage`, not import names):

| run  | `Dialog` | `Toast` | `LinkButton` |
| ---- | -------- | ------- | ------------ |
| pb01 | 1        | 9       | 0            |
| pb02 | 1        | 13      | 3            |
| pb03 | 1        | 10      | 2            |

`check-skill-reach` reports the near-miss table in context for **3/3**, and the
`--bulma-shadow` recipe from `bestax-layout-scaffold` for 3/3. That is the guidance arriving
through the published server with no `.claude/skills/` on disk — the path that only works
because `data/skills/` reached the tarball.

## What this does and does not establish

**Establishes:** the published artifact behaves like the tree. Builders reach the server (49–54
calls across 7–8 of 9 tools), the guidance lands, builds come out green, and every quality
metric sits inside the established distribution. Cost mean $17.40 against `runs-v8`'s $18.62 is
indistinguishable.

**Does not establish:** anything about whether the guidance works better than before.
`Dialog` at 3/3 looks like an improvement and is not one:

| campaign           | `Dialog`    |
| ------------------ | ----------- |
| everything pre-fix | 0 / 44      |
| `runs-v5`–`v7`     | 8 / 9       |
| `runs-v8`          | 4 / 10      |
| **`runs-v9`**      | **3 / 3**   |
| **post-fix total** | **15 / 22** |

**68%, CI 47–84%** — barely moved from the 63% (41–81%) it was before these runs. Fisher on
3/3 against 12/19 gives **p = 0.52**. Three runs cannot separate those hypotheses and this one
does not.

`runs-v8`'s aggregate exists precisely because "3/3, 3/3, 2/3" was read as near-solved and then
came back 4/10. A fourth consecutive small green arm is exactly what that failure mode looks
like from the inside, so it is recorded here as consistent-with, not as evidence-for.

## A correction to the interim read

Mid-campaign these three were flagged as notable for `raw_bulma_classnames` — 1, 1, 1 against a
`runs-v8` **mean** of 10.2. That comparison was wrong. The MCP arm's 32 prior runs have a mean
of 13.0 but a **median of 1.5**: the distribution is a spike at 1 with a long right tail
(148, 74, 62, 37, 23 …), almost all of it from the pre-fix `runs-v2`. `1, 1, 1` is the modal
outcome, not a low one, and `runs-v8`'s 10.2 was itself two outliers dragging five runs.

No signal. The metric is doing what it always does.

## Caveats

- One brief, one model, one client, n=3.
- `mcp_resource_reads` is 0 in all three, as in every prior arm — the `bestax://` resource
  remains unexercised by real builders and is verified by tests alone.
- `pb01` used `Dialog` without importing the `dialog` imperative API; `pb02` and `pb03` used
  both shapes. All three count as use under the call-site rule.
