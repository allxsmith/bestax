# m02 — run notes

**Question this run answers:** does `bestax-mcp` add anything on top of the shipped skills,
or get in their way?

## Configuration

|                       |                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Brief                 | `briefs/skynet-saas-mcp-skills.md` — the frozen `skynet-saas` brief with only its final guidance paragraph changed |
| Completeness addendum | symlink to `skynet-saas.completeness.md` (unchanged)                                                               |
| Scaffold              | `--scaffold-skills yes` → the default `create-bestax --skills`: 7 skills + app `CLAUDE.md`                         |
| Extra channel         | `.mcp.json` → `node <repo>/bestax-mcp/dist/index.js` (local build, `tooling_rev` a588b2e)                          |
| Caps                  | `--model opus --budget 15 --timeout 2700` — the settings i01–i10 ran under                                         |

Same `IS_SANDBOX=1` environment deviation as m01 (see `../m01/notes.md`); it re-permits
`--dangerously-skip-permissions` under root and changes nothing the rubric measures.

## No rubric adaptation

Unlike m01, this scaffold has both channels, so **category 8 is graded on `rubric.md`'s
original anchors** and the MCP counters are supporting evidence only. Nothing in the rubric
was re-anchored for this run.

## Reading the m01 ↔ m02 comparison

The delta table is in `scorecard.md`. Two cautions on what it does and does not show:

- **It is not "with skills vs without".** The MCP serves the skills, and the m01 builder
  pulled four of them through `get_skill`. Both runs had the same guidance available; they
  differ in how it was delivered and, decisively, in whether anything **pushed** it at the
  builder. m02's `CLAUDE.md` and `.claude/skills/` are present in the project whether or not
  the builder asks; m01's had to be requested by name, and the one skill it never thought to
  request — `bestax-custom-component` — is exactly where it lost half its category-5 points.
- **n = 1 per arm.** These are single runs, not means. The archived loop's own spread on a
  fixed configuration was ±7 points (i03 96 → i04 99 → i05 91 with tooling improving
  monotonically), so a 13-point gap is larger than that noise band but a 2-point gap in any
  single category would not be. Treat category-level deltas below ~5 as unresolved.
