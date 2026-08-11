# s01 — run notes

**Why this run exists:** to confirm that adding the guidance-channel options and renaming
`eval/skill-loop` → `eval/agent-loop` left the skills measurement path intact. It is a
regression check against the i01–i10 scale, not a new loop.

## Configuration

|                       |                                                                  |
| --------------------- | ---------------------------------------------------------------- |
| Brief                 | `briefs/skynet-saas.md` — the original, unmodified               |
| Completeness addendum | `briefs/skynet-saas.completeness.md` — the original, unmodified  |
| Scaffold              | default (no `--scaffold-skills`, no `--post-scaffold`)           |
| Caps                  | `--model opus --budget 15 --timeout 2700` — the i01–i10 settings |
| Launched from         | `eval/agent-loop/bin/run-iteration.sh`, i.e. the renamed path    |
| `tooling_rev`         | 4851e85 — the rename commit                                      |

Same `IS_SANDBOX=1` environment deviation as the MCP runs (see `../runs-mcp/m01/notes.md`).

## What it establishes

1. **Defaults are unchanged.** No channel flags were passed; the runner scaffolded with
   `--skills` and installed nothing extra.
2. **The rename is operationally clean.** Runner, collector, briefs, rubric and both
   self-tests all resolve from `eval/agent-loop/`.
3. **The added metrics are inert on a skills run** — `mcp_tool_calls` and
   `mcp_resource_reads` are both 0, `mcp_tools_used` is empty — and no pre-existing field
   changed shape.
4. **The score lands on the established scale**: 96, against a revised-run mean of 95.2.

## Why this is not a fourth comparable datapoint

`runs-skills/` holds one run and should not be read as a loop. It is also **not** directly
comparable to i01–i10 as a tooling measurement: those ran against successive tooling
revisions during the experiment, while s01 runs against current `main` plus this branch. It
answers "is the harness still measuring what it measured", not "did the skills change".

Do not point the phase-E improver at this directory — one run is not loop evidence.
