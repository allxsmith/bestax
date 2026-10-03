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
and **Manual** means someone has to edit or resubmit it when the trigger in the last column
happens.

## Package registries

| Where                                                                                                              | Carries                                                                                                       | Updates   | When to act                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [npm](https://www.npmjs.com/~allxsmith)                                                                            | `@allxsmith/bestax-bulma`, `create-bestax`, `bestax-migrate`, `bestax-mcp`, `@allxsmith/eslint-plugin-bestax` | Automatic | semantic-release publishes from `ci.yml`, keyed by commit scope. See `VERSIONING.md`.                                                                                            |
| [Glama](https://glama.ai/mcp/servers/allxsmith/bestax)                                                             | `bestax-mcp`                                                                                                  | Automatic | Auto-Release rebuilds on every GitHub release in the repo and installs `bestax-mcp@latest`. Edit the Dockerfile in Glama's admin if the start command changes.                   |
| [skills.sh](https://skills.sh/allxsmith/bestax)                                                                    | The skills                                                                                                    | Automatic | Listed from `npx skills add` installs.                                                                                                                                           |
| [Context7](https://context7.com/allxsmith/bestax)                                                                  | The docs                                                                                                      | Automatic | Indexes the repo's markdown. Refresh it from the Context7 dashboard if it falls behind.                                                                                          |
| [cursor.directory](https://cursor.directory/plugins/bestax)                                                        | The skills and `bestax-mcp`                                                                                   | Manual    | A snapshot of the skills, plus an MCP entry added by hand. Edit it when a skill is added, renamed or removed, or when the MCP command changes.                                   |
| [Official MCP Registry](https://registry.modelcontextprotocol.io/v0/servers?search=io.github.allxsmith/bestax-mcp) | `bestax-mcp`, as `io.github.allxsmith/bestax-mcp`                                                             | Automatic | `mcp-registry.yml` publishes each `bestax-mcp@` release. Bump the mcp-publisher version and hash pinned in that workflow by hand.                                                |
| [Codemod Registry](https://app.codemod.com/registry/bestax-migrate)                                                | `bestax-migrate`                                                                                              | Manual    | A wrapper that pins one bestax-migrate release. After each release, run `node scripts/codemod-registry.mjs bump`, merge it, then run the Codemod Registry workflow with publish. |
| [ClawHub](https://clawhub.ai/allxsmith)                                                                            | The skills                                                                                                    | Manual    | One upload per skill. Re-upload a skill when it changes, and upload a new one when it is added. ClawHub republishes them under MIT-0.                                            |

Glama labels its builds with its own version numbers, so they don't match npm.

## Directories

| Where                                                                              | Carries        | Updates   | When to act                                   |
| ---------------------------------------------------------------------------------- | -------------- | --------- | --------------------------------------------- |
| [mcpservers.org](https://mcpservers.org)                                           | `bestax-mcp`   | Manual    | Resubmit when what the server offers changes. |
| [TensorBlock](https://tensorblock.co/mcp/servers/github-allxsmith-bestax-191463f6) | `bestax-mcp`   | Automatic | Built from the TensorBlock list entry below.  |
| [LibHunt](https://www.libhunt.com/r/bestax)                                        | The repo       | Automatic | Reads the repo.                               |
| [mcpmarket.com](https://mcpmarket.com)                                             | `bestax-mcp`   | Manual    | In review.                                    |
| [Made with React.js](https://madewithreactjs.com)                                  | bestax-bulma   | Manual    | In review.                                    |
| [llms.txt directory](https://directory.llmstxt.cloud)                              | bestax.io      | Automatic | In review. Reads `/llms.txt`.                 |
| [skillsindex.dev](https://skillsindex.dev)                                         | Skills and MCP | Manual    | In review. Two entries, one for each.         |
| [agenticskills.io](https://agenticskills.io)                                       | Skills and MCP | Manual    | In review. Two entries, one for each.         |

## Awesome lists

### Listed

| List                                                                                                                | Entry          | Pull request                                                                     |
| ------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------- |
| [aldi/awesome-bulma](https://github.com/aldi/awesome-bulma)                                                         | Bestax         | [#5](https://github.com/aldi/awesome-bulma/pull/5)                               |
| [jaywcjlove/awesome-uikit](https://github.com/jaywcjlove/awesome-uikit)                                             | bestax-bulma   | [#49](https://github.com/jaywcjlove/awesome-uikit/pull/49)                       |
| [anubhavsrivastava/awesome-ui-component-library](https://github.com/anubhavsrivastava/awesome-ui-component-library) | bestax-bulma   | [#58](https://github.com/anubhavsrivastava/awesome-ui-component-library/pull/58) |
| [jelmer/awesome-codemods](https://github.com/jelmer/awesome-codemods)                                               | bestax-migrate | [#7](https://github.com/jelmer/awesome-codemods/pull/7)                          |
| [acvnace/awesome-vibe-coding-resources](https://github.com/acvnace/awesome-vibe-coding-resources)                   | Bestax         | [#111](https://github.com/acvnace/awesome-vibe-coding-resources/pull/111)        |
| [TensorBlock/awesome-mcp-servers](https://github.com/TensorBlock/awesome-mcp-servers)                               | Bestax MCP     | [#2872](https://github.com/TensorBlock/awesome-mcp-servers/pull/2872)            |
| [AlexMili/Awesome-MCP](https://github.com/AlexMili/Awesome-MCP)                                                     | Bestax MCP     | [#231](https://github.com/AlexMili/Awesome-MCP/pull/231)                         |

### In review

| List                                                                                                      | Entry                  | Pull request                                                                  |
| --------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| [enaqx/awesome-react](https://github.com/enaqx/awesome-react)                                             | bestax-bulma           | [#1862](https://github.com/enaqx/awesome-react/pull/1862)                     |
| [brillout/awesome-react-components](https://github.com/brillout/awesome-react-components)                 | Bestax                 | [#616](https://github.com/brillout/awesome-react-components/pull/616)         |
| [jgthms/bulma](https://github.com/jgthms/bulma) (README)                                                  | Bestax                 | [#4014](https://github.com/jgthms/bulma/pull/4014)                            |
| [aycanogut/front-end-resources](https://github.com/aycanogut/front-end-resources)                         | bestax-bulma           | [#89](https://github.com/aycanogut/front-end-resources/pull/89)               |
| [iamismile/web-dev-resources](https://github.com/iamismile/web-dev-resources)                             | Bestax                 | [#61](https://github.com/iamismile/web-dev-resources/pull/61)                 |
| [pegaltier/awesome-utils-dev](https://github.com/pegaltier/awesome-utils-dev)                             | Bestax                 | [#81](https://github.com/pegaltier/awesome-utils-dev/pull/81)                 |
| [OSSDrop/OSSDrop](https://github.com/OSSDrop/OSSDrop)                                                     | Bestax                 | [#64](https://github.com/OSSDrop/OSSDrop/pull/64)                             |
| [semlinker/awesome-typescript](https://github.com/semlinker/awesome-typescript)                           | create-bestax          | [#198](https://github.com/semlinker/awesome-typescript/pull/198)              |
| [SecretiveShell/Awesome-llms-txt](https://github.com/SecretiveShell/Awesome-llms-txt)                     | bestax.io llms.txt     | [#200](https://github.com/SecretiveShell/Awesome-llms-txt/pull/200)           |
| [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)                           | allxsmith/bestax       | [#15446](https://github.com/punkpeye/awesome-mcp-servers/pull/15446)          |
| [yzfly/Awesome-MCP-ZH](https://github.com/yzfly/Awesome-MCP-ZH)                                           | Bestax                 | [#653](https://github.com/yzfly/Awesome-MCP-ZH/pull/653)                      |
| [MobinX/awesome-mcp-list](https://github.com/MobinX/awesome-mcp-list)                                     | allxsmith/bestax       | [#560](https://github.com/MobinX/awesome-mcp-list/pull/560)                   |
| [toolsdk-ai/toolsdk-mcp-registry](https://github.com/toolsdk-ai/toolsdk-mcp-registry)                     | bestax-mcp             | [#587](https://github.com/toolsdk-ai/toolsdk-mcp-registry/pull/587)           |
| [ai-for-developers/awesome-ai-coding-tools](https://github.com/ai-for-developers/awesome-ai-coding-tools) | Bestax                 | [#817](https://github.com/ai-for-developers/awesome-ai-coding-tools/pull/817) |
| [Piebald-AI/awesome-gemini-cli](https://github.com/Piebald-AI/awesome-gemini-cli)                         | Bestax                 | [#161](https://github.com/Piebald-AI/awesome-gemini-cli/pull/161)             |
| [alvinreal/awesome-opensource-ai](https://github.com/alvinreal/awesome-opensource-ai)                     | bestax-mcp             | [#800](https://github.com/alvinreal/awesome-opensource-ai/pull/800)           |
| [eltociear/awesome-AI-driven-development](https://github.com/eltociear/awesome-AI-driven-development)     | bestax-mcp             | [#146](https://github.com/eltociear/awesome-AI-driven-development/pull/146)   |
| [narrowin/awesome-generative-ui](https://github.com/narrowin/awesome-generative-ui)                       | bestax-mcp             | [#21](https://github.com/narrowin/awesome-generative-ui/pull/21)              |
| [slavakurilyak/awesome-ai-agents](https://github.com/slavakurilyak/awesome-ai-agents)                     | bestax-mcp             | [issue #688](https://github.com/slavakurilyak/awesome-ai-agents/issues/688)   |
| [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)                       | allxsmith/bestax       | [#1132](https://github.com/VoltAgent/awesome-agent-skills/pull/1132)          |
| [abubakarsiddik31/claude-skills-collection](https://github.com/abubakarsiddik31/claude-skills-collection) | Bestax                 | [#57](https://github.com/abubakarsiddik31/claude-skills-collection/pull/57)   |
| [GetBindu/awesome-claude-code-and-skills](https://github.com/GetBindu/awesome-claude-code-and-skills)     | allxsmith/bestax       | [#237](https://github.com/GetBindu/awesome-claude-code-and-skills/pull/237)   |
| [JayLZhou/Awesome-Agent-Skills](https://github.com/JayLZhou/Awesome-Agent-Skills)                         | Bestax Skills          | [#48](https://github.com/JayLZhou/Awesome-Agent-Skills/pull/48)               |
| [kodustech/awesome-agent-skills](https://github.com/kodustech/awesome-agent-skills)                       | bestax-layout-scaffold | [#128](https://github.com/kodustech/awesome-agent-skills/pull/128)            |
| [ZeroPointRepo/awesome-hermes-skills](https://github.com/ZeroPointRepo/awesome-hermes-skills)             | Bestax skills          | [#103](https://github.com/ZeroPointRepo/awesome-hermes-skills/pull/103)       |
| [laolaoshiren/claude-code-skills-zh](https://github.com/laolaoshiren/claude-code-skills-zh)               | Bestax skills          | [#31](https://github.com/laolaoshiren/claude-code-skills-zh/pull/31)          |

Every list entry is Manual: it holds the text we submitted until someone opens a pull request
against that list.

## Planned

Not live yet. Each needs a merge or a sign-in first.

| Where                                                                       | Carries                 | Updates   | Notes                                                                                    |
| --------------------------------------------------------------------------- | ----------------------- | --------- | ---------------------------------------------------------------------------------------- |
| GitHub MCP Registry                                                         | `bestax-mcp`            | Unknown   | The official listing exists, so onboarding can be requested.                             |
| Coding-agent plugin from the repo (Claude Code, Codex, Copilot, Grok Build) | Skills and `bestax-mcp` | Automatic | Waits on [#870](https://github.com/allxsmith/bestax/pull/870). Installs follow the repo. |
| Anthropic plugin directory                                                  | The skills              | Manual    | After #870. Each version is reviewed before it goes live.                                |
| OpenAI plugin directory                                                     | The skills              | Manual    | After #870. Each upload is a ZIP with a new version.                                     |
| Cursor Marketplace                                                          | Skills and `bestax-mcp` | Manual    | After #870. Each update is reviewed.                                                     |
| Kiro                                                                        | Skills and `bestax-mcp` | Manual    | After #870. Needs a privacy policy and support contact in the README.                    |
| [Grok Build marketplace](https://github.com/xai-org/plugin-marketplace)     | Skills and `bestax-mcp` | Manual    | After #870. The entry pins a commit, so a pull request there bumps it.                   |
| [awesome-copilot](https://github.com/github/awesome-copilot)                | Skills and `bestax-mcp` | Manual    | After #870. Pins the `version` in the root `plugin.json`.                                |

## What goes stale

Third-party entries copy facts from this repo. A change to any of these makes some of them wrong.
Say in the pull request which listings need an update, then open those updates once it ships.

- **Adding, renaming or removing a skill.** Entries that name skills or say how many there are:
  claude-skills-collection, awesome-hermes-skills, claude-code-skills-zh, Awesome-Agent-Skills
  (JayLZhou), awesome-claude-code-and-skills and kodustech (both name
  `bestax-layout-scaffold`), skillsindex.dev, agenticskills.io, cursor.directory and ClawHub.
- **Changing what `bestax-mcp` offers.** Most MCP entries say it serves props, examples, CSS
  variables and Agent Skills, offline, with no API key. awesome-AI-driven-development also gives
  an example count, in English and Japanese. toolsdk-mcp-registry documents the
  `BESTAX_MCP_NO_VERSION_CHECK` variable.
- **A new major of `bestax-mcp`.** Awesome-MCP-ZH, TensorBlock and cursor.directory give
  `npx -y bestax-mcp@1` as the command.
- **Changing how `bestax-mcp` starts.** Glama's Dockerfile runs the `bestax-mcp` command, so edit
  it in Glama's admin. cursor.directory's MCP entry and the entries above that give the command
  need the same change.
- **A bestax-migrate release.** The Codemod Registry wrapper keeps running the version it pins
  until it is bumped and republished. CONTRIBUTING.md has the steps under "Codemod Registry".
- **Changing an install command.** awesome-claude-code-and-skills and claude-code-skills-zh give
  `npx skills add https://github.com/allxsmith/bestax --skill <name>`.
- **Moving or renaming a package folder.** Entries link to `tree/main/bestax-mcp`,
  `tree/main/skills`, `tree/main/skills/bestax-layout-scaffold`, `tree/main/create-bestax` and
  `tree/main/bestax-migrate`.
- **Renaming a package or moving a page on bestax.io.** Entries use the package names,
  `https://bestax.io`, `/llms.txt` and `/llms-full.txt`.
- **A new Bulma major.** Nearly every entry says "Bulma v1".

Bestax is called bestax-bulma on React component-library lists and Bestax everywhere else.
Package names stay as they are.
