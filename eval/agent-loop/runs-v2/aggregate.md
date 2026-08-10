# Campaign aggregate — skills vs `bestax-mcp`, 20 runs

> **Correction (`d36caf7`) — the `Toast` figures below were wrong.**
> The extras check scored a slot by presence in `bestax_import_list`, and the ordinary way
> to use Toast is `import { ToastContainer, toast }` then `toast.success('…')` — no symbol
> named `Toast` exists in such a build. Counting call sites instead:
>
> |                      | as published | **actual** |
> | -------------------- | ------------ | ---------- |
> | `Toast`, skills      | 0/10         | **10/10**  |
> | `Toast`, MCP         | 6/10         | **10/10**  |
> | `Dialog`, both       | 0/20         | 0/20 ✓     |
> | `LinkButton`, skills | 5/10         | 5/10 ✓     |
> | `LinkButton`, MCP    | 9/10         | 9/10 ✓     |
>
> All 21 runs called `toast.success`/`toast.danger`, one to eight times each. `Dialog` and
> `LinkButton` were counted correctly — neither has an alias of that shape. **The claim that
> "`Toast` is the one place the MCP clearly beats the skills" is withdrawn**, and the skills
> change it motivated (`22dcff7`) closed a gap that did not exist. `Dialog` at 0/20 stands
> and is now established by call sites rather than by a missing import.
>
> The offending sentences are struck through in place below rather than edited away.
> `bin/test-extras-usage.mjs` now guards the rule.

Ten runs per arm of the `skynet-platform` brief against `rubric-v2.md`, `--model opus
--budget 30 --timeout 3600`. Both arms share the frozen
[`skynet-platform.completeness.md`](../briefs/skynet-platform.completeness.md) by symlink, so
categories 7 and 9 are comparable across arms. `v01` is an eleventh skills-arm observation
under the identical configuration and is reported separately rather than pooled.

**Total recorded spend: $408.**

Regenerate with:

```
node bin/aggregate-runs.mjs runs-v2 --extras briefs/skynet-platform.completeness.md
```

## Why 10 per arm

Every earlier conclusion in this eval rested on n=1 per arm, and four of them died as runs
accumulated. That is the campaign's real justification, so the casualties are listed here
rather than quietly dropped:

| Claim, when made                                              | Killed by                                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| "The MCP wins on discovery" (mc01 19/20 extras vs sk02 18/20) | n=3: 19, 18, 18 vs 18, 18 — no difference                                            |
| "647 lines of CSS is a scale effect the brief provokes"       | sk03 at 71 lines, then sk05 at 802 — within-arm variance, not a channel effect       |
| "Truncation is even across arms, therefore noise"             | sk01's truncation was a port collision I had introduced                              |
| "Depth of skill-pull predicts discipline"                     | mc08 and mc09 both made 3 `get_skill` calls and still wrote 92 and 108 inline styles |

The last one needs a correction on the record: refuting _depth_ is not refuting _which
skill_, and I over-generalised from one to the other. The specific-skill claim was still
alive and is confirmed below.

## Headline

|                          | skills (n=10)          | MCP (n=10)                      |
| ------------------------ | ---------------------- | ------------------------------- |
| green builds             | 10/10                  | 10/10                           |
| not truncated            | 10/10                  | 9/10                            |
| `inline_style_count`     | **0** (all ten)        | mean 77, median 93, range 0–162 |
| `raw_bulma_classnames`   | mean 1, range 1–2      | mean 33, median 6, range 1–148  |
| `bestax_named_imports`   | mean 70, range 65–75   | mean 61, range 54–73            |
| `custom_css_added_lines` | mean 351, range 20–802 | mean 485, range 59–853          |
| `handrolled_total`       | mean 0, range 0–1      | mean 2, range 0–5               |
| `tsc_errors`             | 0                      | 0                               |
| cost                     | mean $17.82            | mean $20.68                     |
| duration                 | mean 2115 s            | mean 2534 s                     |

Both channels produce **green builds every time** — 20 of 20, zero tsc errors throughout.
Nothing here is about correctness. It is about which parts of the library each channel
reaches, and which house rules survive contact with a seven-page build.

`custom_css_added_lines` overlaps heavily (20–802 vs 59–853) and is **not** a channel
signal, despite reading like one early on.

## The mechanism, confirmed

Two MCP runs wrote zero inline styles. Both pulled `bestax-layout-scaffold`. None of the
other eight did.

| pulled `layout-scaffold`? | runs             | `inline_style_count`               |
| ------------------------- | ---------------- | ---------------------------------- |
| yes                       | mc06, mc10       | 0, 0                               |
| no                        | mc01–05, mc07–09 | 46, 52, 92, 94, 104, 108, 109, 162 |

2/2 against 0/8. Both crossovers also land on 73 `bestax_named_imports` — the top of the MCP
arm and level with the skills arm.

The rule lives in exactly one skill.
[`bestax-layout-scaffold/SKILL.md:65`](../../../skills/bestax-layout-scaffold/SKILL.md):

> **Style with helper props — no inline `style`, no raw Bulma `className`s.** Before writing
> `style={{ … }}` anywhere, translate each declaration with the mapping table below

…followed by `## Inline style → helper prop mapping` at line 107.
`bestax-theming/SKILL.md` never mentions inline styles at all — and theming is what MCP
builders pull, **10 of 10**, against `layout-scaffold` at **2 of 10**.

The declarations the failing runs inline are line-for-line what that table covers:
`marginTop`, `maxWidth`, `display: inline-flex`, `alignItems`, `listStyle`, `marginLeft`,
`color`.

**The skills arm gets this for free.** Claude Code auto-triggers a skill on description
match, so `layout-scaffold` loads for any layout-shaped work — which a seven-page site
always is. Ten of ten skills runs wrote zero inline styles.

So the MCP was never missing the guidance. It was missing the **auto-trigger**, and the one
rule that matters most is filed under the one skill nobody thinks to request.

## MCP tool adoption

Across the 10 MCP runs, counting runs that called each tool at least once:

| tool                | runs     | note                                                  |
| ------------------- | -------- | ----------------------------------------------------- |
| `list_components`   | 10/10    |                                                       |
| `get_helper_props`  | 10/10    |                                                       |
| `list_skills`       | 10/10    |                                                       |
| `get_skill`         | 10/10    | but 10/10 pull `theming`, 2/10 pull `layout-scaffold` |
| `get_component`     | 6/10     |                                                       |
| `get_examples`      | 6/10     |                                                       |
| `get_props`         | 5/10     |                                                       |
| `get_css_variables` | 1/10     | every run themed the site                             |
| **`search_bestax`** | **0/10** | **the documented entry point**                        |

**MCP resources: 0 reads across all 20 runs.** `bestax://catalog`,
`bestax://components/{name}` and `bestax://skills/{name}` were never touched.

`search_bestax` being unused is the sharpest of these: the server's own `instructions` say
"Start with `search_bestax`; every result names the tool to call next", and the docs page
leads with it. Ten builders read that and every one went straight to `list_components`.

## Extras coverage

Both arms reach 18 of the 22 expected components in every run. The differences are at the
edges, and they run in **both** directions:

| slot            | skills             | MCP                                                        |
| --------------- | ------------------ | ---------------------------------------------------------- |
| `Dialog`        | **0/10**           | **0/10**                                                   |
| `DateTimeInput` | 0/10               | 0/10 (both satisfy the slot via `DateInput` + `TimeInput`) |
| `Toast`         | ~~0/10~~ **10/10** | ~~6/10~~ **10/10**                                         |
| `LinkButton`    | 5/10               | 9/10                                                       |
| `TimeInput`     | 9/10               | 8/10                                                       |
| everything else | 10/10              | 10/10                                                      |

- **`Dialog` is never used by either arm, 0 of 20.** Every run reaches for Bulma's `Modal`
  instead. Neither channel is at fault — this is a library-level discoverability problem.
  Unchanged by the correction, and now established by counting `dialog.confirm`/`<Dialog>`
  call sites rather than by the absence of an import.
- ~~**`Toast` is the one place the MCP clearly beats the skills**, 6/10 against 0/10. A
  searchable catalogue answers "what do I use for a brief confirmation"; a skills builder has
  to already suspect the component exists.~~ **Withdrawn — see the correction at the top.**
  Both arms used `Toast` in all ten runs. There was never a difference here, and the
  explanation offered for it was reasoning from a counting bug.
- `LinkButton` favours the MCP too, 9/10 against 5/10. This one survives the correction:
  `LinkButton` has no imperative alias, so the import-name rule counted it correctly.

## Follow-ups this campaign justifies

Every item is dispositioned — done here, or filed. Nothing is left as an observation.

**MCP**

1. ✅ Put the inline-style prohibition and the mapping table into `get_helper_props` — called
   by 10/10 runs, where `layout-scaffold` is pulled by 2/10. Highest-leverage single change.
   Shipped in `ffc627a`; **measured** at n=10 in [`runs-v3`](../runs-v3/aggregate.md), mean
   inline styles 76.7 → 1.1.
2. ✅ Fix or remove `search_bestax`: 0/10 despite being the documented entry point. Neither —
   it was the _claim_ that was wrong. `206380b` moved the entry point to `list_components`
   (10/10) in the server's `instructions` and both docs surfaces, and left search for the
   case it actually serves.
3. 📋 Remove the resources, or make them reachable: 0 reads in 20 runs → **#501**.
4. 📋 Surface CSS variables from `get_component`: `get_css_variables` is 1/10 in an arm where
   every run themed → **#501**.

**Skills**

5. ⚠️ ~~`Toast` at 0/10 and `LinkButton` at 5/10 — the MCP finds both more often.~~ **Half of
   this follow-up rested on the counting bug.** `Toast` was 10/10 in both arms, so there was
   nothing to fix; `LinkButton` at 5/10 vs 9/10 is real and remains open. `22dcff7` shipped
   guidance for all three anyway, in `bestax-layout-scaffold` (any page build) and
   `bestax-form` (post-submit). The guidance is accurate and harmless — it recommends the
   container-plus-imperative route builders already take — but its stated justification was
   wrong for `Toast`, and it is measured in [`runs-v4`](../runs-v4/aggregate.md) against the
   corrected counter.

**Library**

6. 📋 `Dialog` loses to `Modal` in 20 of 20 runs, on both channels → **#500**.

**Found while acting on the above, not in the original list**

7. ✅/📋 `bestax-layout-scaffold` was teaching `<Theme bulmaVars={{ '--bulma-shadow': … }}>`,
   which does not compile — the same invention this eval recorded 3 for 3, written into the
   always-loaded surface by the fix for it. Skill corrected to the CSS route in `2935bb2`;
   the library question (should the union just include it?) is **#499**.
8. 📋 `bestax-mcp` has a `release.config.js` and a commitlint release scope but no
   `Semantic Release (bestax-mcp)` step in `ci.yml`, so it can never publish → **#502**.
   Not fixed here: `.github/` is human-authored by design.
9. 📋 `Column size` is `number` while `Title size` is `'1'`–`'6'`, and the exports are
   `Numberinput`/`Taginput` with a lowercase `i` → added to **#370**, which already tracks
   this class of API trap.

## Caveats

- One brief, one model, one rubric version. `skynet-platform` is app-shaped and interactive;
  a different brief may not separate the arms this way.
- The MCP arm had one truncated run (mc02, 3596 s of 3600). Kept as a datapoint — a watchdog
  kill stops at a point the rubric can read.
- Six runs were discarded during the campaign for harness faults, never for their results:
  four to a container restart, one to a port collision, one to the same. Each is recorded in
  the commit history with its reason.
- Extras figures here are **presence in `bestax_import_list`**. Rubric-v2 §9 additionally
  requires each to be load-bearing, which only per-run grading establishes.
