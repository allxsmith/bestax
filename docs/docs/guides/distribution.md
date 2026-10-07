---
title: Distribution and Listings
sidebar_label: Distribution
sidebar_position: 12
description: The registries, marketplaces, directories and curated lists we know carry Bestax, and which of them only change when a maintainer updates them by hand.
---

# Distribution and Listings

Bestax ships to npm, and copies or descriptions of it live in registries, plugin marketplaces,
directories and curated lists. Some follow our releases on their own. The rest keep what was
submitted until a person changes it.

Read [What goes stale](#what-goes-stale) before a change that could make a listing wrong, and
update this page when a listing is added, accepted, removed or changes how it updates.

In the tables below, **Automatic** means it picks up releases or the repo with nothing from us,
**Manual** means someone has to edit or resubmit it when the trigger in the last column happens,
**Mixed** means releases flow through on their own but the change in the last column needs a
person, and **Unknown** means we have not confirmed how it updates.

## Package registries

| Where                                                                                                              | Carries                                                                                                       | Updates   | When to act                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [npm](https://www.npmjs.com/~allxsmith)                                                                            | `@allxsmith/bestax-bulma`, `create-bestax`, `bestax-migrate`, `bestax-mcp`, `@allxsmith/eslint-plugin-bestax` | Automatic | semantic-release publishes from `ci.yml`, keyed by commit scope. See `VERSIONING.md`.                                                                                                           |
| [`bestax` plugin](https://github.com/allxsmith/bestax-skills), in allxsmith/bestax-skills                          | The skills and `bestax-mcp`                                                                                   | Automatic | `skills-publish.yml` regenerates it from `main` on each change and after each `bestax-mcp` release.                                                                                             |
| [Glama](https://glama.ai/mcp/servers/allxsmith/bestax)                                                             | `bestax-mcp`                                                                                                  | Mixed     | Auto-Release rebuilds on every GitHub release in the repo and installs `bestax-mcp@latest`. Edit the Dockerfile in Glama's admin if the start command changes.                                  |
| [skills.sh](https://skills.sh/allxsmith/bestax)                                                                    | The skills                                                                                                    | Automatic | Listed from `npx skills add` installs.                                                                                                                                                          |
| [Context7](https://context7.com/allxsmith/bestax)                                                                  | The docs                                                                                                      | Mixed     | Indexes the repo's markdown. Refresh it from the Context7 dashboard if it falls behind.                                                                                                         |
| [cursor.directory](https://cursor.directory/plugins/bestax)                                                        | The skills and `bestax-mcp`                                                                                   | Manual    | A copy of each skill's text and an MCP entry, pasted by hand. Refresh the copies when a skill changes, and edit the entry when a skill is added, renamed or removed or the MCP command changes. |
| [Official MCP Registry](https://registry.modelcontextprotocol.io/v0/servers?search=io.github.allxsmith/bestax-mcp) | `bestax-mcp`, as `io.github.allxsmith/bestax-mcp`                                                             | Automatic | `mcp-registry.yml` publishes each `bestax-mcp@` release.                                                                                                                                        |
| [Codemod Registry](https://app.codemod.com/registry/bestax-migrate)                                                | `bestax-migrate`                                                                                              | Manual    | A wrapper that pins one bestax-migrate release. Bump and republish it after each release, as `CONTRIBUTING.md` describes under "Codemod Registry".                                              |
| [ClawHub](https://clawhub.ai/allxsmith)                                                                            | The skills                                                                                                    | Manual    | One upload per skill. Re-upload a skill when it changes, and upload a new one when it is added. ClawHub republishes them under MIT-0.                                                           |

Glama labels its builds with its own version numbers, so they don't match npm.

## Directories

| Where                                                                              | Carries        | Updates   | When to act                                                                                                                                         |
| ---------------------------------------------------------------------------------- | -------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [mcpservers.org](https://mcpservers.org)                                           | `bestax-mcp`   | Manual    | Resubmit when what the server offers changes.                                                                                                       |
| [mcprush](https://mcprush.com/allxsmith/bestax-mcp)                                | `bestax-mcp`   | Unknown   | mcprush built the page from the npm package. We did not submit it, and claiming the page is what lets us edit it.                                   |
| [TensorBlock](https://tensorblock.co/mcp/servers/github-allxsmith-bestax-191463f6) | `bestax-mcp`   | Automatic | Built from the TensorBlock list entry below.                                                                                                        |
| [LibHunt](https://www.libhunt.com/r/bestax)                                        | The repo       | Automatic | Reads the repo.                                                                                                                                     |
| [mcpmarket.com](https://mcpmarket.com)                                             | `bestax-mcp`   | Manual    | In review.                                                                                                                                          |
| [Made with React.js](https://madewithreactjs.com)                                  | bestax-bulma   | Manual    | In review.                                                                                                                                          |
| [llms.txt directory](https://directory.llmstxt.cloud)                              | bestax.io      | Automatic | In review. Reads `/llms.txt`.                                                                                                                       |
| [skillsindex.dev](https://skillsindex.dev)                                         | Skills and MCP | Manual    | In review.                                                                                                                                          |
| [agenticskills.io](https://agenticskills.io)                                       | Skills and MCP | Manual    | In review.                                                                                                                                          |
| [mcpm.sh registry](https://github.com/pathintegral-institute/mcpm.sh)              | `bestax-mcp`   | Manual    | In review in [#427](https://github.com/pathintegral-institute/mcpm.sh/pull/427). The entry gives `npx -y bestax-mcp@1` and lists each tool by name. |
| [Kilo marketplace](https://github.com/Kilo-Org/kilo-marketplace)                   | `bestax-mcp`   | Manual    | In review in [#339](https://github.com/Kilo-Org/kilo-marketplace/pull/339). The entry gives `npx -y bestax-mcp@1`.                                  |

## Plugin directories and marketplaces

Each of these takes the `bestax` plugin from allxsmith/bestax-skills. The last column says whether it lists the plugin yet.

| Where                                                                   | Carries                 | Updates   | When to act                                                                                                                                                                            |
| ----------------------------------------------------------------------- | ----------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anthropic plugin directory                                              | Skills and `bestax-mcp` | Mixed     | In review. A GitHub push webhook on bestax-skills sends it each publish, and a reviewer checks each version before it goes live.                                                       |
| Cursor Marketplace                                                      | Skills and `bestax-mcp` | Manual    | In review. Cursor reads bestax-skills through `.cursor-plugin/plugin.json` and reviews each update.                                                                                    |
| Kiro                                                                    | Skills and `bestax-mcp` | Manual    | In review. Kiro reaches out if it takes the power into its registry.                                                                                                                   |
| [Grok Build marketplace](https://github.com/xai-org/plugin-marketplace) | Skills and `bestax-mcp` | Automatic | In review in [#1237](https://github.com/xai-org/plugin-marketplace/pull/1237). The entry pins a commit, which moves when their maintainers merge a version-bump pull request.          |
| [awesome-copilot](https://github.com/github/awesome-copilot)            | Skills and `bestax-mcp` | Manual    | In review in [issue #4541](https://github.com/github/awesome-copilot/issues/4541). It pins a commit and the version in the root `plugin.json`, which stay put until we send an update. |
| [Build with Claude](https://github.com/davepoon/buildwithclaude)        | Skills and `bestax-mcp` | Manual    | Listed through [#385](https://github.com/davepoon/buildwithclaude/pull/385). The entry carries the version from `plugin.json`, so a pull request there bumps it.                       |
| [HOL Registry](https://hol.org/plugins)                                 | Skills and `bestax-mcp` | Mixed     | Listed through the awesome-ai-plugins entry below. HOL scans bestax-skills on its own, and the list entry is a line of text.                                                           |
| [Gemini CLI extensions](https://geminicli.com/extensions)               | Skills and `bestax-mcp` | Automatic | Listed. The gallery lists repositories with a `gemini-extension.json` and the `gemini-cli-extension` topic, and bestax-skills has both. Installs follow the repository.                |

## Awesome lists

### Listed

| List                                                                                                                | Entry            | Pull request                                                                     |
| ------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------- |
| [aldi/awesome-bulma](https://github.com/aldi/awesome-bulma)                                                         | Bestax           | [#5](https://github.com/aldi/awesome-bulma/pull/5)                               |
| [jaywcjlove/awesome-uikit](https://github.com/jaywcjlove/awesome-uikit)                                             | bestax-bulma     | [#49](https://github.com/jaywcjlove/awesome-uikit/pull/49)                       |
| [anubhavsrivastava/awesome-ui-component-library](https://github.com/anubhavsrivastava/awesome-ui-component-library) | bestax-bulma     | [#58](https://github.com/anubhavsrivastava/awesome-ui-component-library/pull/58) |
| [jelmer/awesome-codemods](https://github.com/jelmer/awesome-codemods)                                               | bestax-migrate   | [#7](https://github.com/jelmer/awesome-codemods/pull/7)                          |
| [acvnace/awesome-vibe-coding-resources](https://github.com/acvnace/awesome-vibe-coding-resources)                   | Bestax           | [#111](https://github.com/acvnace/awesome-vibe-coding-resources/pull/111)        |
| [TensorBlock/awesome-mcp-servers](https://github.com/TensorBlock/awesome-mcp-servers)                               | Bestax MCP       | [#2872](https://github.com/TensorBlock/awesome-mcp-servers/pull/2872)            |
| [AlexMili/Awesome-MCP](https://github.com/AlexMili/Awesome-MCP)                                                     | Bestax MCP       | [#231](https://github.com/AlexMili/Awesome-MCP/pull/231)                         |
| [iamismile/web-dev-resources](https://github.com/iamismile/web-dev-resources)                                       | Bestax           | [#61](https://github.com/iamismile/web-dev-resources/pull/61)                    |
| [OSSDrop/OSSDrop](https://github.com/OSSDrop/OSSDrop)                                                               | Bestax           | [#64](https://github.com/OSSDrop/OSSDrop/pull/64)                                |
| [MobinX/awesome-mcp-list](https://github.com/MobinX/awesome-mcp-list)                                               | allxsmith/bestax | [38f0646](https://github.com/MobinX/awesome-mcp-list/commit/38f0646)             |
| [toolsdk-ai/toolsdk-mcp-registry](https://github.com/toolsdk-ai/toolsdk-mcp-registry)                               | bestax-mcp       | [#587](https://github.com/toolsdk-ai/toolsdk-mcp-registry/pull/587)              |
| [Piebald-AI/awesome-gemini-cli](https://github.com/Piebald-AI/awesome-gemini-cli)                                   | Bestax           | [#161](https://github.com/Piebald-AI/awesome-gemini-cli/pull/161)                |
| [alvinreal/awesome-opensource-ai](https://github.com/alvinreal/awesome-opensource-ai)                               | bestax-mcp       | [#800](https://github.com/alvinreal/awesome-opensource-ai/pull/800)              |
| [slavakurilyak/awesome-ai-agents](https://github.com/slavakurilyak/awesome-ai-agents)                               | bestax-mcp       | [issue #688](https://github.com/slavakurilyak/awesome-ai-agents/issues/688)      |
| [laolaoshiren/claude-code-skills-zh](https://github.com/laolaoshiren/claude-code-skills-zh)                         | Bestax skills    | [3256076](https://github.com/laolaoshiren/claude-code-skills-zh/commit/3256076)  |
| [hashgraph-online/awesome-ai-plugins](https://github.com/hashgraph-online/awesome-ai-plugins)                       | Bestax           | [#623](https://github.com/hashgraph-online/awesome-ai-plugins/pull/623)          |
| [pegaltier/awesome-utils-dev](https://github.com/pegaltier/awesome-utils-dev)                                       | Bestax           | [#81](https://github.com/pegaltier/awesome-utils-dev/pull/81)                    |

### In review

| List                                                                                                      | Entry                  | Pull request                                                                  |
| --------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| [enaqx/awesome-react](https://github.com/enaqx/awesome-react)                                             | bestax-bulma           | [#1862](https://github.com/enaqx/awesome-react/pull/1862)                     |
| [brillout/awesome-react-components](https://github.com/brillout/awesome-react-components)                 | Bestax                 | [#616](https://github.com/brillout/awesome-react-components/pull/616)         |
| [jgthms/bulma](https://github.com/jgthms/bulma) (README)                                                  | Bestax                 | [#4014](https://github.com/jgthms/bulma/pull/4014)                            |
| [aycanogut/front-end-resources](https://github.com/aycanogut/front-end-resources)                         | bestax-bulma           | [#89](https://github.com/aycanogut/front-end-resources/pull/89)               |
| [semlinker/awesome-typescript](https://github.com/semlinker/awesome-typescript)                           | create-bestax          | [#198](https://github.com/semlinker/awesome-typescript/pull/198)              |
| [SecretiveShell/Awesome-llms-txt](https://github.com/SecretiveShell/Awesome-llms-txt)                     | bestax.io llms.txt     | [#200](https://github.com/SecretiveShell/Awesome-llms-txt/pull/200)           |
| [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)                           | allxsmith/bestax       | [#15446](https://github.com/punkpeye/awesome-mcp-servers/pull/15446)          |
| [yzfly/Awesome-MCP-ZH](https://github.com/yzfly/Awesome-MCP-ZH)                                           | Bestax                 | [#653](https://github.com/yzfly/Awesome-MCP-ZH/pull/653)                      |
| [ai-for-developers/awesome-ai-coding-tools](https://github.com/ai-for-developers/awesome-ai-coding-tools) | Bestax                 | [#817](https://github.com/ai-for-developers/awesome-ai-coding-tools/pull/817) |
| [eltociear/awesome-AI-driven-development](https://github.com/eltociear/awesome-AI-driven-development)     | bestax-mcp             | [#146](https://github.com/eltociear/awesome-AI-driven-development/pull/146)   |
| [narrowin/awesome-generative-ui](https://github.com/narrowin/awesome-generative-ui)                       | bestax-mcp             | [#21](https://github.com/narrowin/awesome-generative-ui/pull/21)              |
| [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)                       | allxsmith/bestax       | [#1132](https://github.com/VoltAgent/awesome-agent-skills/pull/1132)          |
| [abubakarsiddik31/claude-skills-collection](https://github.com/abubakarsiddik31/claude-skills-collection) | Bestax                 | [#57](https://github.com/abubakarsiddik31/claude-skills-collection/pull/57)   |
| [GetBindu/awesome-claude-code-and-skills](https://github.com/GetBindu/awesome-claude-code-and-skills)     | allxsmith/bestax       | [#237](https://github.com/GetBindu/awesome-claude-code-and-skills/pull/237)   |
| [JayLZhou/Awesome-Agent-Skills](https://github.com/JayLZhou/Awesome-Agent-Skills)                         | Bestax Skills          | [#48](https://github.com/JayLZhou/Awesome-Agent-Skills/pull/48)               |
| [kodustech/awesome-agent-skills](https://github.com/kodustech/awesome-agent-skills)                       | bestax-layout-scaffold | [#128](https://github.com/kodustech/awesome-agent-skills/pull/128)            |
| [ZeroPointRepo/awesome-hermes-skills](https://github.com/ZeroPointRepo/awesome-hermes-skills)             | Bestax skills          | [#103](https://github.com/ZeroPointRepo/awesome-hermes-skills/pull/103)       |
| [karanb192/awesome-claude-skills](https://github.com/karanb192/awesome-claude-skills)                     | Bestax skills          | [#383](https://github.com/karanb192/awesome-claude-skills/pull/383)           |
| [mcpHQ/awesome-mcp-servers](https://github.com/mcpHQ/awesome-mcp-servers)                                 | Bestax                 | [#135](https://github.com/mcpHQ/awesome-mcp-servers/pull/135)                 |

Every list entry is Manual: it holds the text we submitted until someone opens a pull request
against that list.

## Planned

Not live yet. Each needs a submission or a sign-in first.

| Where                   | Carries      | Updates | Notes                                                                                                                                                                                              |
| ----------------------- | ------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub MCP Registry     | `bestax-mcp` | Unknown | Onboarding requested in [discussion #1257](https://github.com/github/github-mcp-server/discussions/1257#discussioncomment-18787001). New versions sync from the official listing once it is added. |
| OpenAI plugin directory | The skills   | Manual  | It takes remote MCP servers only, so `bestax-mcp` would not come along. Each upload is a ZIP with a new version.                                                                                   |

## What goes stale

Third-party entries copy facts from this repo. A change to any of these makes some of them wrong.
Say in the pull request which listings need an update, then open those updates once it ships.

- **Adding, renaming or removing a skill.** Entries that name skills or say how many there are:
  claude-skills-collection, awesome-hermes-skills, claude-code-skills-zh, Awesome-Agent-Skills
  (JayLZhou), awesome-claude-code-and-skills and kodustech (both name
  `bestax-layout-scaffold`), skillsindex.dev, agenticskills.io, cursor.directory, ClawHub, Build
  with Claude (which also gives a count), awesome-ai-plugins and karanb192/awesome-claude-skills.
- **Editing a skill.** cursor.directory and ClawHub hold copies of each skill's text, so they keep
  the old wording until someone pastes or uploads the new one.
- **Changing what `bestax-mcp` offers.** Most MCP entries say it serves props, examples, CSS
  variables and Agent Skills, offline, with no API key. awesome-AI-driven-development also gives
  an example count, in English and Japanese. toolsdk-mcp-registry documents the
  `BESTAX_MCP_NO_VERSION_CHECK` variable, and the mcpm.sh registry lists each tool by name.
- **A new major of `bestax-mcp`.** Awesome-MCP-ZH, TensorBlock, cursor.directory, the mcpm.sh
  registry and the Kilo marketplace give `npx -y bestax-mcp@1` as the command. The `bestax` plugin does not go stale here: it pins the
  exact version, and `skills-publish.yml` regenerates it after each release.
- **A plugin release.** Once listed, awesome-copilot, the OpenAI directory and Kiro pin the
  `version` in bestax-skills' root `plugin.json`, Cursor Marketplace the same version in
  `.cursor-plugin/plugin.json`, and Build with Claude a copy of it in its own entry. Its patch counts the commits
  that touched the plugin's content, plus a number the generator raises when its output changes,
  so it rises with each change without a hand bump, and
  the MAJOR.MINOR comes from `plugin.version` in `plugin/manifest.json`. Update those entries when a
  release should reach them. Codex keys its plugin cache on the version too, and Claude Code reads
  the same version from `.claude-plugin/plugin.json`. The Grok Build entry pins a commit instead,
  which moves when their maintainers merge a version-bump pull request.
- **Changing the plugin icon.** Anthropic's plugin directory takes the icon in bestax-skills'
  `.claude-plugin/icon.png` only the first time the plugin is saved or submitted, so a new
  `plugin/icon.png` does not reach that listing on its own. Cursor Marketplace has its own logo,
  `assets/logo.png` in bestax-skills, from `plugin/logo.png`.
- **Raising the Node version `bestax-mcp` needs.** The mcpm.sh registry and the Kilo marketplace
  repeat the `engines` floor from `bestax-mcp/package.json` as a requirement.
- **Changing how `bestax-mcp` starts.** Glama's Dockerfile runs the `bestax-mcp` command, so edit
  it in Glama's admin. cursor.directory's MCP entry and the entries above that give the command
  need the same change.
- **A bestax-migrate release.** The Codemod Registry wrapper keeps running the version it pins
  until it is bumped and republished. CONTRIBUTING.md has the steps under "Codemod Registry".
- **Changing an install command.** awesome-claude-code-and-skills and claude-code-skills-zh give
  `npx skills add https://github.com/allxsmith/bestax --skill <name>`.
- **Moving or renaming a package folder.** Entries link to `tree/main/bestax-mcp`,
  `tree/main/skills`, `tree/main/skills/bestax-layout-scaffold`, `tree/main/create-bestax` and
  `tree/main/bestax-migrate`. Plugin listings point at allxsmith/bestax-skills instead.
- **Renaming a package or moving a page on bestax.io.** Entries use the package names,
  `https://bestax.io`, `/llms.txt` and `/llms-full.txt`.
- **A new Bulma major.** Nearly every entry says "Bulma v1".

Bestax is called bestax-bulma on React component-library lists and Bestax everywhere else.
Package names stay as they are. Write a new or refreshed description so it says early on that
Bestax is for building with Bulma v1, since Bulma is the name people search for. Older entries,
such as the description in `bestax-mcp/server.json`, still put it last.
