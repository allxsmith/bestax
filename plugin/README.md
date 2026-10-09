# bestax plugin

The `bestax` plugin helps coding agents build with
[@allxsmith/bestax-bulma](https://bestax.io), React components for Bulma v1. It
installs the bestax [Agent Skills](https://bestax.io/docs/skills/intro) and the
[bestax-mcp](https://bestax.io/docs/guides/llms#mcp-server) server, which
answers questions about components, props, examples and CSS variables.

This repository is generated from
[allxsmith/bestax](https://github.com/allxsmith/bestax) each time the skills or
the server change there. Nothing here is edited by hand, so please open issues
and pull requests in
[allxsmith/bestax](https://github.com/allxsmith/bestax/issues).

## What's included

These Agent Skills, each of which your agent loads when a task calls for it:

<!-- bestax:generated skills -->
<!-- /bestax:generated skills -->

And the bestax-mcp server, which your agent can ask about any component.

## Install

### Claude Code

```text
/plugin marketplace add allxsmith/bestax-skills
/plugin install bestax@bestax
```

To pick up changes, choose **Update now** on bestax in the **Installed** tab of
`/plugin`, or run `claude plugin update bestax@bestax` in your shell and then
`/reload-plugins` in your session. Claude Code does not auto-update plugins
from this marketplace until you choose **Enable auto-update** for it in the
**Marketplaces** tab of `/plugin`.

### Other agents

Codex, GitHub Copilot CLI and Grok Build install the plugin from this
repository:

```bash
codex plugin marketplace add allxsmith/bestax-skills
copilot plugin install allxsmith/bestax-skills
grok plugin install allxsmith/bestax-skills --trust
```

In Codex, adding the marketplace only lists the plugin. Run `/plugins`,
install bestax and turn it on.

In VS Code, run **Chat: Install Plugin From Source** from the Command Palette
and enter `https://github.com/allxsmith/bestax-skills`.

Gemini CLI installs this repository as an extension:

```bash
gemini extensions install https://github.com/allxsmith/bestax-skills
```

Kiro installs the plugin as a
[power](https://kiro.dev/docs/powers/installation/), from the `plugin.json` at
the root of this repository. In the IDE, open the Powers panel, choose **Add
Custom Power**, then **Import power from GitHub**, and enter
`https://github.com/allxsmith/bestax-skills`. Kiro CLI installs a power from a
local folder, so clone this repository and run
`kiro-cli powers install ./bestax-skills`.

Cursor installs plugins from the Cursor Marketplace, which does not list
bestax yet. Until it does, set up the
[MCP server](https://bestax.io/docs/guides/llms#mcp-server) and the
[skills](https://bestax.io/docs/skills/intro) on their own.

Each agent updates plugins its own way, such as `copilot plugin update bestax`
or `grok plugin update bestax`.

## What the plugin runs, sends and fetches

- **The skills** are Markdown instructions your agent reads when a task calls
  for them. They run nothing on their own. Some suggest commands for your
  agent to run, such as `npm create bestax`, `pnpm dlx bestax-migrate` or
  installing an icon package, and those download packages from npm when your
  agent runs them.
- **The MCP server** comes from npm, at the exact version shown below. The
  first time your agent starts it, npx downloads that version and its
  dependencies from your npm registry (registry.npmjs.org unless you changed
  it) and caches them. Those dependencies include `@allxsmith/bestax-bulma`,
  `bulma`, `react` and `react-dom`.
- The server then runs on your machine and talks to your agent over stdio. It
  answers from an index bundled in the package, makes no network requests,
  and has no update check.
- To warn you when your project uses a different bestax-bulma release than
  its index describes, the server reads
  `node_modules/@allxsmith/bestax-bulma/package.json` in your working folder
  and the folders above it. It reads nothing else from your project.
- Some links the server prints carry `utm_source=bestax-mcp`, so a visit to
  bestax.io through one of them shows up in the site's traffic analytics. The
  links inside its component answers are tagged too. Skill bodies are served
  as written, so their links stay untagged.
- The plugin has no hooks, commands, agents or scripts of its own.

Your agent starts the server with this command, the same one in
`.claude-plugin/plugin.json`, `gemini-extension.json` and `mcp.json`:

<!-- bestax:generated mcp-server -->
<!-- /bestax:generated mcp-server -->

## Privacy Policy

The plugin and its MCP server collect no data and send no telemetry. Two
bestax command-line tools that the skills may suggest, `create-bestax` and
`bestax-migrate`, can send one anonymous usage event per run, and only after
you opt in. The [Telemetry](https://bestax.io/docs/guides/telemetry) page on
bestax.io is the full disclosure for every bestax package: what is sent, what
never is, where it goes, and how to turn it off.

## Support

Questions and bug reports go to the
[allxsmith/bestax issue tracker](https://github.com/allxsmith/bestax/issues).
The [bestax docs](https://bestax.io/docs/guides/llms) cover the skills, the MCP
server and the other ways to use bestax with an AI agent.

## License

MIT. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
