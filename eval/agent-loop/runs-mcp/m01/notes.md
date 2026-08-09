# m01 — run notes

**Question this run answers:** is `bestax-mcp` sufficient on its own, with no `.claude/skills/`
and no `CLAUDE.md` in the app?

## Configuration

|                       |                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Brief                 | `briefs/skynet-saas-mcp.md` — the frozen `skynet-saas` brief with only its final guidance paragraph changed |
| Completeness addendum | symlink to `skynet-saas.completeness.md` (unchanged, so category 7 stays comparable to i01–i10)             |
| Scaffold              | `--scaffold-skills no` → `create-bestax --no-skills`: no `.claude/skills/`, no `CLAUDE.md`                  |
| Guidance channel      | `.mcp.json` → `node <repo>/bestax-mcp/dist/index.js` (local build, `tooling_rev` b44bb2e)                   |
| Caps                  | `--model opus --budget 15 --timeout 2700` — the settings i01–i10 ran under                                  |

Verified before the run: the builder's `system/init` event reports
`mcp_servers: [{"name":"bestax","status":"connected"}]` and all nine `mcp__bestax__*` tools.

## Environment deviation

`--dangerously-skip-permissions` refuses to run as root, which is how this container executes.
The run was launched as `IS_SANDBOX=1 bash bin/run-iteration.sh …`. This changes nothing the
rubric measures — it only re-permits the flag the runner already passes — but a reader
reproducing the run on a non-root host will not need it.

## Rubric adaptation — category 8 only

`rubric.md` is **not edited**. Category 8's anchors name `CLAUDE.md` and `.claude/skills/`,
neither of which exists in this scaffold, so `skill_file_reads=0`, `skill_files=[]` and
`claude_md_read=false` are all correct and all measure a channel this run does not have.
Scoring them literally would report 0/10 for a builder that made 41 MCP calls before writing
its first line of code.

For **m01 only**, category 8 is re-anchored onto the MCP counters added to
`collect-metrics.mjs`, keeping the shape of the original anchors:

- **10** — called a discovery tool (`search_bestax` / `list_components` / `list_skills`) early
  and pulled ≥2 detail tools whose output demonstrably shapes the code, including guidance
  covering the areas `$COMPLETENESS` names as expected skills.
- **5** — some calls, but late, shallow, or visibly ignored in the code.
- **0** — never called the server.

m02 grades category 8 on the **original** anchors, because that scaffold has both channels.

This is an adaptation of one category's anchors to a channel the rubric predates, recorded
here rather than in `rubric.md` so the yardstick i01–i10 were graded against does not move.
Categories 1–7 are scored exactly as written.

## Note on what "MCP only" turned out to mean

The scaffold had no skills on disk, but the server **serves the skills** — the builder pulled
four of them through `mcp__bestax__get_skill`, including both that `$COMPLETENESS` names
(`bestax-layout-scaffold`, `bestax-theming`). So m01 is not "no skills"; it is "the same
skills, delivered over MCP instead of the filesystem." The m01↔m02 delta therefore measures
**delivery mechanism**, not presence of guidance. Read the two scorecards with that in mind.
