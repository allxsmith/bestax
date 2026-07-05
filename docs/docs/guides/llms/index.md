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

```bash
npx skills add https://github.com/allxsmith/bestax --skill bestax-custom-component
npx skills add https://github.com/allxsmith/bestax --skill bestax-form
npx skills add https://github.com/allxsmith/bestax --skill bestax-theming
npx skills add https://github.com/allxsmith/bestax --skill bestax-layout-scaffold
```

Starting a new app? `pnpm create bestax@latest` offers to **preinstall these skills**
into the generated app's `.claude/skills/` (alongside a `CLAUDE.md`), so a Claude Code
session picks them up automatically. See the [Skills overview](/docs/skills/intro) for
what each one does.

## MCP server (coming soon)

A first-party bestax **MCP server** — for querying components, props, and examples
directly from an MCP-compatible client — is planned. This page will document it once it
ships. (bestax will provide its own server; it does not rely on a third-party one.)

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
