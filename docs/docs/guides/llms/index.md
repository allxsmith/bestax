---
title: LLMs
sidebar_label: LLMs
---

# bestax-bulma with LLMs

`@allxsmith/bestax-bulma` ships LLM-optimized documentation so AI coding agents —
Claude Code, Cursor, GitHub Copilot, ChatGPT — can read the docs in full and build
with the library correctly. This page explains what's published and how to use it.

## Using bestax docs with AI tools

Point your assistant at the docs — the approach is the same across Claude Code,
Cursor, Copilot, and ChatGPT:

- **Give it the index.** Add `https://bestax.io/llms.txt` to your project docs / rules,
  or paste it into the chat, so the model can discover every page and fetch what it needs.
- **Feed it everything.** For a one-shot load of the whole library, use
  `https://bestax.io/llms-full.txt`.
- **Fetch a single page.** For a focused question, link the page's Markdown directly —
  e.g. `https://bestax.io/docs/api/elements/button.md` — to keep the context small.

## Skills

Beyond the raw docs, bestax ships **Agent Skills** that teach an agent _how_ to build
with the library (conventions, patterns, and a component catalog). Install one with the
[`skills`](https://skills.sh/) CLI:

<!-- bestax:generated skills-install -->

```bash
npx skills add https://github.com/allxsmith/bestax --skill bestax-custom-component
npx skills add https://github.com/allxsmith/bestax --skill bestax-form
npx skills add https://github.com/allxsmith/bestax --skill bestax-icons
npx skills add https://github.com/allxsmith/bestax --skill bestax-layout-scaffold
npx skills add https://github.com/allxsmith/bestax --skill bestax-migrate
npx skills add https://github.com/allxsmith/bestax --skill bestax-optimize
npx skills add https://github.com/allxsmith/bestax --skill bestax-theming
```

<!-- /bestax:generated skills-install -->

Starting a new app? `pnpm create bestax@latest` offers to **preinstall these skills**
into the generated app's `.claude/skills/` (alongside a `CLAUDE.md` and a
`.claude/launch.json` that lets Claude Code's browser preview start the dev server by
name), so a Claude Code session picks them up automatically. See the
[Skills overview](/docs/skills/intro) for what each one does.

## In the npm package

The published `@allxsmith/bestax-bulma` tarball also carries three small pointer
files at the package root, so an agent that explores `node_modules` by filename
(`find` / `ls` for `AGENTS.md`, `CLAUDE.md`, `llms.txt`) lands on these resources
even if it never opens the README or reaches the network first:

| File        | What it is                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------- |
| `llms.txt`  | A stub index pointing at the site artifacts above, plus the compact security-posture summary. |
| `AGENTS.md` | The same links, the core library conventions, and the same security-posture summary.          |
| `CLAUDE.md` | A copy of `AGENTS.md` under the filename Claude-family tooling probes for first.              |

They are pointers plus a compact, verifiable security-posture summary — the site
artifacts stay the source of truth for everything else, so the rest of the
tarball cannot go stale between releases.

## MCP server

`bestax-mcp` is the first-party [Model Context Protocol](https://modelcontextprotocol.io)
server. Where `llms.txt` gives an agent the docs to read, the MCP server lets it **ask
questions** — every component's props (including compound parts like `Navbar.Brand`), ~900
working examples, the `--bulma-*` variables behind each component, the helper props that
replace inline styles, and the Agent Skills as invocable prompts.

### Setup

**Claude Code:**

```bash
claude mcp add bestax -- npx -y bestax-mcp@1
```

**Cursor, Claude Desktop, Windsurf, Cline** — add to your MCP config
(`.cursor/mcp.json`, `claude_desktop_config.json`, …):

```json
{
  "mcpServers": {
    "bestax": {
      "command": "npx",
      "args": ["-y", "bestax-mcp@1"]
    }
  }
}
```

Run it from your project directory, so it can find your installed
`@allxsmith/bestax-bulma`.

The `@1` pins the major version. Without it, `npx` resolves whatever is newest on every
launch — so a breaking change, or a compromised release, reaches your agent the next time it
starts, with no review step. Add it to your project's dev dependencies instead if you would
rather your lockfile decide.

### Tools

Start with `list_components` — its output names the tool to call next. Reach for
`search_bestax` when you need a component whose name you do not know.

| Tool                | What it gives the agent                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `list_components`   | Every component with a one-line purpose, by category                                               |
| `search_bestax`     | Components, props, examples, CSS variables and skills in one ranked list                           |
| `get_component`     | Import, summary and props; optionally examples, CSS variables, accessibility, related              |
| `get_props`         | One prop table, including compound sub-paths (`Navbar.Brand`)                                      |
| `get_examples`      | Working `tsx` examples from the component's documentation page                                     |
| `get_css_variables` | The `--bulma-*` custom properties a component reads, with Sass names and defaults                  |
| `get_helper_props`  | Spacing, colour, typography, flexbox and visibility props — the alternative to hand-written styles |
| `list_skills`       | The seven [Agent Skills](/docs/skills/intro)                                                       |
| `get_skill`         | A skill's instructions, or one of its reference documents                                          |

It also exposes each skill as an MCP **prompt** (`theming`, `form`, `layout-scaffold`, …) and
serves `bestax://catalog`, `bestax://components/{name}` and `bestax://skills/{name}` as
**resources** — useful in clients where the _user_ attaches context (`@`-mentioning a
resource), rather than a channel the model reaches for mid-task the way it does the tools
above.

### Offline, and pinned to a version

The index ships inside the package — there are no network calls, so nothing rate-limits and
nothing breaks when you are offline.

It also means the server documents one specific `bestax-bulma` release. On startup it resolves
the version actually installed in your project, and if that differs by a minor or major version
it appends a warning to its answers rather than confidently describing props you do not have.
Set `BESTAX_MCP_NO_VERSION_CHECK=1` to turn that off.

Because the index is generated from the same source as this site — TSDoc for props, the SCSS for
variables, these pages for examples — it cannot drift from the documentation you are reading.

## Contributing

Found the LLM docs unclear, incomplete, or wrong for your agent? Please
[open an issue](https://github.com/allxsmith/bestax/issues/new/choose) describing what
you expected and what happened — feedback on how well the docs work with AI tools is
especially welcome.

## How these docs are generated

The LLM docs are generated at build time by
[`docusaurus-plugin-llms`](https://github.com/rachfop/docusaurus-plugin-llms)
(configured in `docs/docusaurus.config.js`), following the
[llmstxt.org](https://llmstxt.org) standard. Three artifacts are produced and served
from the site root:

| File                                                | What it is                                                                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`/llms.txt`](https://bestax.io/llms.txt)           | Curated **index** — a table of contents linking every doc page (per the llmstxt.org spec).                                          |
| [`/llms-full.txt`](https://bestax.io/llms-full.txt) | The **entire documentation** concatenated into a single plain-text file.                                                            |
| Per-page `.md`                                      | Every page is also served as clean Markdown at `<page>.md`, e.g. [`/docs/guides/intro.md`](https://bestax.io/docs/guides/intro.md). |

All three are regenerated on every docs build, so they always match the deployed site.
