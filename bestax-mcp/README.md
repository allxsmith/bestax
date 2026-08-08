# bestax-mcp

The official [MCP](https://modelcontextprotocol.io) server for
[`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma) —
React components for Bulma v1.

It gives a coding agent the whole library: every component's props (including
compound sub-parts like `Navbar.Brand`), ~900 working examples, the `--bulma-*`
CSS variables behind every component, the helper props that replace inline
styles, and the bestax [Agent Skills](https://bestax.io/docs/skills/intro) as
invocable prompts.

**Offline and version-pinned.** The index ships inside the package — no network
calls, nothing to rate-limit. It documents one specific `bestax-bulma` release,
and the server checks the version actually installed in your project and warns
you when they disagree, rather than confidently describing props you do not have.

## Setup

### Claude Code

```bash
claude mcp add bestax -- npx -y bestax-mcp
```

### Cursor, Claude Desktop, Windsurf, Cline

Add to your MCP config (`.cursor/mcp.json`, `claude_desktop_config.json`, …):

```json
{
  "mcpServers": {
    "bestax": {
      "command": "npx",
      "args": ["-y", "bestax-mcp"]
    }
  }
}
```

Run it from your project directory so it can find your installed
`@allxsmith/bestax-bulma` and check it against the indexed version.

## Tools

Start with `search_bestax` — every result names the tool to call next.

| Tool                | What it gives you                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `search_bestax`     | Components, props, examples, CSS variables and skills in one ranked list                                 |
| `list_components`   | All 87 components with a one-line purpose, by category                                                   |
| `get_component`     | Import, summary and props; optionally examples, CSS variables, accessibility, related                    |
| `get_props`         | One prop table, including compound sub-paths (`Navbar.Brand`)                                            |
| `get_examples`      | Working `tsx` examples from the component's docs page                                                    |
| `get_css_variables` | The `--bulma-*` custom properties a component reads, with Sass names and defaults                        |
| `get_helper_props`  | Spacing, colour, typography, flexbox and visibility props — **call this before writing an inline style** |
| `list_skills`       | The seven bestax Agent Skills                                                                            |
| `get_skill`         | A skill's instructions, or one of its reference documents                                                |

## Prompts

One per skill, so a task can start from the library's own guidance:
`custom-component`, `form`, `theming`, `layout-scaffold`, `icons`, `migrate`,
`optimize`.

## Resources

`bestax://catalog` · `bestax://components/{name}` · `bestax://skills/{name}` ·
`bestax://skills/{name}/references/{ref}`

## Environment

| Variable                      | Effect                                                  |
| ----------------------------- | ------------------------------------------------------- |
| `BESTAX_MCP_NO_VERSION_CHECK` | Set to `1` to skip the installed-version check entirely |

## Links

- [LLMs guide](https://bestax.io/docs/guides/llms) — the canonical entry point for
  bestax's AI surfaces, including `llms.txt` and the Agent Skills
- [Documentation](https://bestax.io)
- [GitHub](https://github.com/allxsmith/bestax)

MIT © Alex Smith
