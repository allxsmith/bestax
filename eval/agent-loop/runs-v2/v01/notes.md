# v01 — run notes

**Why this run exists:** to validate a new instrument before spending on a channel matrix.
It had to answer three questions — does one brief hold, does the brief pull the extras, and
does rubric v2 discriminate. All three answered; see `scorecard.md`.

## Configuration

|                       |                                                                              |
| --------------------- | ---------------------------------------------------------------------------- |
| Brief                 | `briefs/skynet-platform.md` — new, demands the components beyond stock Bulma |
| Completeness addendum | `briefs/skynet-platform.completeness.md`                                     |
| Rubric                | `rubric-v2.md` (`rubric_version: 2`, recorded in `metrics.json`)             |
| Scaffold              | default `--skills` — the shipping channel, no MCP server                     |
| Caps                  | `--model opus --budget 30 --timeout 3600`                                    |
| `tooling_rev`         | e6047be                                                                      |

Same `IS_SANDBOX=1` environment deviation as the earlier runs (see
`../../runs-mcp/m01/notes.md`).

## Two addendum bugs this run exposed, now fixed

Both were mine, in the spec rather than the build, and both are corrected in
`skynet-platform.completeness.md` with the correction noted inline:

1. **`Skeleton` was listed as an extra.** Bulma 1 ships `is-skeleton`, so it is core. It has
   been moved to the core paragraph and does not count toward §9. This is what makes the
   denominator 20 slots rather than 21.
2. **The `LinkButton` clause contradicted itself** — "satisfied by any genuinely text-styled
   secondary action" and then "a `Button` with a colour variant does not satisfy it", when
   `color="text"` is both. Resolved in favour of the category's purpose: §9 scores whether
   the build found the differentiator, so only `LinkButton` satisfies the slot. That makes it
   consistent with how `Dialog` and `Toast` were already scored.

Neither changed the total. Under either reading the run lands on the 10 anchor for §9 — which
is itself the calibration problem recorded in the scorecard.

## Calibration defect found, deliberately not patched

§9's top anchor (≥85%) is too loose at 20 slots: v01 cleared it while substituting core Bulma
for three purpose-built components. `rubric-v2.md` is **frozen for this loop**, so v01 is
graded against the anchors as written and the defect is recorded instead of fixed mid-run —
the same discipline `rubric.md` states and the reason v1 was closed rather than edited.

Raise §9's top anchor to ≥95% (≥19/20) in the next revision. Do not apply it retroactively to
v01.

## What this does not establish

- **One channel, one run.** v01 is the skills channel only. The MCP-only and MCP+skills arms
  have not been run against this brief, so nothing here says anything about `bestax-mcp`.
- **n = 1.** The 647-line CSS result is dramatic (9–16 lines on every previous brief) and the
  mechanism is legible, but it is one run. A second run would establish whether it reproduces.
- **Not comparable to i01–i10, m01–m02 or s01.** Different rubric version _and_ different
  brief. The 75-pt core is not comparable to the old 85-pt core either — the weights moved.
  `runs-v2/` starts its own scale.
