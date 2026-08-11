# Post-review verification — three runs, both channels

Three runs against the tooling as it stands after the pre-PR review: two skills-arm
(`sk01`, `sk02`) and one MCP-arm (`mc01`), same `skynet-platform` brief, `rubric-v2.md`,
same caps and the same frozen completeness addendum as every arm before it.

**This is a regression check, not a measurement.** At n=2 and n=1 the arms cannot establish a
slot rate — `runs-v4` needed ten per arm to say anything about `LinkButton`, and this says
nothing about it either way. What three runs can establish is that the fixes did not break
either channel.

Spend: $50.53.

## No regression

|                          | sk01   | sk02   | mc01   | control (v2 skills / v3 MCP) |
| ------------------------ | ------ | ------ | ------ | ---------------------------- |
| green build              | ✓      | ✓      | ✓      | 10/10, 10/10                 |
| `tsc_errors`             | 0      | 0      | 0      | 0                            |
| `inline_style_count`     | **0**  | **0**  | **0**  | 0 ×10 / mean 1.1             |
| `raw_bulma_classnames`   | 1      | 1      | 1      | mean 1.1 / mean 1.5          |
| `bestax_named_imports`   | 67     | 73     | 73     | mean 70 / mean 67.7          |
| `custom_css_added_lines` | 614    | 13     | 37     | mean 351 / —                 |
| cost                     | $13.09 | $11.42 | $26.02 | $17.82 / $18.51              |

Every mechanised metric is in range. The CSS spread (13 to 614) is wide but sits inside the
control's own 20–802, which `runs-v2` established is not a channel signal.

**One number to watch:** `mc01` at $26.02 is the most expensive MCP run recorded, just above
the previous maximum of $24.92. The unfiltered `list_components` answer did grow by ~1,400
characters in this change, so that is a plausible cause — but the arm's own range is
$10.63–$24.92, a 2.3× spread, and at n=1 this cannot be attributed. An n=10 arm should watch
it.

## What the changes specifically put at risk, and what happened

| Risk introduced by the fix                                                                       | Result                                                                                |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| The MCP footer is now **sliced from the skill at runtime** — a restructured heading yields empty | `mc01` carries the marker; the block rendered                                         |
| It is **gated to unfiltered calls** — a filter-only builder would see nothing                    | `mc01` used `Dialog` and `Toast`; the gate did not starve it                          |
| The version probe gained a **semver guard and a 500 ms timeout**                                 | Verified in the live scaffold: 2 ms, resolved 5.9.0, classified minor drift correctly |
| The scaffolded `CLAUDE.md` **lost 1,184 characters**, including the whole table form             | Both skills runs used the guidance; nothing was lost that mattered                    |

## The result worth reporting, and not yet believing

**All three runs used `Dialog`, load-bearing, and not one of them built a `Modal` anywhere.**

| run    | how                                              | `Modal` in the app |
| ------ | ------------------------------------------------ | ------------------ |
| `sk01` | controlled `<Dialog>` in `Demo.tsx:405`          | none               |
| `sk02` | `await dialog.confirm({…})` in `Console.tsx:110` | none               |
| `mc01` | `await dialog.confirm({…})` in `Demo.tsx:116`    | none               |

The baseline is **0 uses in 44 recorded builds**, across every arm of every previous
campaign, with `<Modal>` hand-assembled in the booking surface of 43 of them.

Two things make this more than a curiosity:

- **It reproduced on both channels independently.** The skills arm gets it from the generated
  `CLAUDE.md`; the MCP arm gets it from the `list_components` footer. Those are different
  delivery paths and they agree.
- **`sk01` did not have the skill's table in context at all** (marker absent) and used
  `Dialog` anyway. That is precisely what the placement fix predicts: the guidance now lives
  on a surface that loads whether or not a skill triggers. `sk01` left the comment
  `// Mounted once so toast.* and dialog.* work from any page` — the guidance turning up in
  its reasoning, not just its imports.

And the reason to hold it loosely anyway: **n=3, and the comparison is before/after with
changed tooling, not a randomised arm.** This eval's own casualty table
([`runs-v2`](../runs-v2/aggregate.md)) lists four confident findings that died as runs
accumulated, and each looked at least this good early. `Dialog` moving off zero would be the
first thing to do so in 47 builds; that deserves a proper ten-run arm before anyone writes it
down as fixed.

`LinkButton` is 1 of 3 (`sk02` only) — consistent with the control's 5/10 and far too small to
read.

## Follow-up

- A ten-run arm against this tooling is what would settle `Dialog`. Until then #500 stays
  open: 43 of 44 builders hand-assembled a `Modal`, and three builders on new guidance is not
  evidence that the library-level problem went away.
- `get_helper_props()` still returns ~54,900 characters, unchanged by this work and still the
  largest single thing the server emits. Deferred deliberately; it needs a real fix to
  `format.ts` and the `group` filter.
- The committed MCP index is generated from `bulma-ui` 5.8.3 while npm serves 5.9.0, so every
  response in these runs carried a drift warning. The version check working correctly, but it
  means a `bestax-mcp` release has to follow each library release — worth noting on #502,
  which tracks the missing release step.
