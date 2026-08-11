# Loop iteration 2 — the MCP arm re-run against the fixed server

Ten MCP-only runs of the `skynet-platform` brief against `rubric-v2.md`, identical caps
(`--model opus --budget 30 --timeout 3600`) and the same frozen completeness addendum as
[`runs-v2`](../runs-v2/aggregate.md). The only thing that changed is the server:
[`ffc627a`](../../..) moved the inline-style prohibition into `get_helper_props`, and
`8ddb2fd` gave `list_components` a next-step footer.

**The skills arm was not re-run.** Its tooling is unchanged, so `runs-v2`'s ten skills runs
remain the frozen control. Re-running them would have cost ~$180 to reproduce a known
number.

Spend: $185.

## Result

|                        | MCP before (n=10)                        | **MCP after (n=10)**             | skills control (n=10)  |
| ---------------------- | ---------------------------------------- | -------------------------------- | ---------------------- |
| `inline_style_count`   | 0, 0, 46, 52, 92, 94, 104, 108, 109, 162 | **0, 0, 0, 0, 0, 0, 1, 3, 3, 4** | 0 ×10                  |
| mean                   | 76.7                                     | **1.1**                          | 0.0                    |
| runs at exactly zero   | 2/10                                     | **6/10**                         | 10/10                  |
| runs in single digits  | 2/10                                     | **10/10**                        | 10/10                  |
| `raw_bulma_classnames` | mean 33.1, max 148                       | **mean 1.5, max 3**              | mean 1.1, max 2        |
| `bestax_named_imports` | mean 61.1, range 54–73                   | **mean 67.7, range 58–78**       | mean 70.2, range 65–75 |
| green builds           | 10/10                                    | 10/10                            | 10/10                  |
| cost                   | $20.68                                   | **$18.51**                       | $17.82                 |

### Against the pre-registered bar

Set before the arm started, so it could not be moved afterwards: _"8 or more of ten at or
near zero is a real effect; 3 to 5 is ambiguous."_ Both readings, so the threshold is the
reader's to apply:

- **Strictly zero: 6/10.** Short of 8. On the harshest reading the bar is missed.
- **At or near zero: 10/10.** Every run is ≤4, against a before-arm where eight of ten sat
  between 46 and 162. A run at 3 is two orders of magnitude closer to the skills arm than to
  the MCP arm it replaced.

The pre-registered phrase was "at or near zero", and on that wording the effect is
unambiguous. The strict-zero count is reported alongside it because the distinction is real
and hiding it would be the sort of goalpost-shifting this eval exists to prevent.

## Does the MCP now beat skills alone?

**No — it reaches parity, which is a different and smaller claim.**

- Skills hit exactly zero **ten times out of ten**. The improved MCP hits zero six times and
  never exceeds four. Skills remain strictly better on the discipline metric.
- `raw_bulma_classnames` is effectively tied: 1.5 against 1.1, where it was 33.1 before.
- Import breadth closed most of its gap (61.1 → 67.7, against 70.2) but has not caught up.
- The improved MCP is **cheaper** than the arm it replaced ($18.51 vs $20.68) — repairing
  fewer escapes costs fewer turns — though still above skills at $17.82.
- ~~Where the MCP was already ahead it stays ahead: `Toast` was found by 6/10 MCP runs and
  0/10 skills runs in `runs-v2`.~~ **Withdrawn (`d36caf7`)** — that gap was a counting
  artifact. The extras check scored slots by presence in `bestax_import_list`, and Toast is
  normally used as `import { ToastContainer, toast }` + `toast.success('…')`, which contains
  no symbol named `Toast`. By call sites both arms used it in all ten runs. The MCP's real
  remaining edge over the skills arm is `LinkButton`, 9/10 against 5/10.

So the shipping recommendation is unchanged and now better evidenced: **use both.** The
channels fail in different places, and the MCP no longer drags discipline down when it is
the only channel present.

## Why it worked

The `runs-v2` mechanism was that the no-inline-style rule lived only in
`bestax-layout-scaffold`, which MCP builders pulled 2 times in 10 — and those two runs were
the only two that wrote zero inline styles. The fix moved that rule into `get_helper_props`,
which every run already called.

The decisive evidence that this is the operative mechanism rather than a coincidence:

| run                               | skills pulled    | `inline_style_count`          |
| --------------------------------- | ---------------- | ----------------------------- |
| v2 — any run pulling theming only | theming (±icons) | 46–162, **without exception** |
| **v3 mc03**                       | **theming only** | **0**                         |
| v3 mc02                           | theming only     | 4                             |

`mc03` pulled exactly the skill set that in `runs-v2` guaranteed 46–162 inline styles, and
wrote none. The rule reached a builder that never asked for the skill containing it, which
is precisely what the change was for.

A secondary effect shows up too: `layout-scaffold` was pulled by 2/10 before and by roughly
half the runs after, which is the `list_components` footer naming it at the moment builders
are choosing components.

## Caveats

- One brief, one model, one rubric version — as with `runs-v2`.
- The skills control is from the previous iteration rather than run concurrently. Nothing
  about the skills tooling changed between them, but the two arms are not
  simultaneously-sampled.
- `custom_css_added_lines` remains high-variance in both arms and is still not a channel
  signal.
- These runs measure the MCP as the **only** channel. The shipping configuration is MCP plus
  skills, which this campaign does not test at n=10 — the one v1-era observation (`m02`)
  suggested it was the strongest of the three.
