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

| Where                                                                              | Carries            | Updates   | When to act                                                                                                                                                                |
| ---------------------------------------------------------------------------------- | ------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [mcpservers.org](https://mcpservers.org)                                           | `bestax-mcp`       | Manual    | Resubmit when what the server offers changes.                                                                                                                              |
| [mcprush](https://mcprush.com/allxsmith/bestax-mcp)                                | `bestax-mcp`       | Unknown   | mcprush built the page from the npm package. We did not submit it, and claiming the page is what lets us edit it.                                                          |
| [TensorBlock](https://tensorblock.co/mcp/servers/github-allxsmith-bestax-191463f6) | `bestax-mcp`       | Automatic | Built from the TensorBlock list entry below.                                                                                                                               |
| [LibHunt](https://www.libhunt.com/r/bestax)                                        | The repo           | Automatic | Reads the repo.                                                                                                                                                            |
| [mcpmarket.com](https://mcpmarket.com)                                             | `bestax-mcp`       | Manual    | In review.                                                                                                                                                                 |
| [Made with React.js](https://madewithreactjs.com)                                  | bestax-bulma       | Manual    | In review.                                                                                                                                                                 |
| [llms.txt directory](https://directory.llmstxt.cloud)                              | bestax.io          | Automatic | In review. Reads `/llms.txt`.                                                                                                                                              |
| [skillsindex.dev](https://skillsindex.dev)                                         | Skills and MCP     | Manual    | In review.                                                                                                                                                                 |
| [agenticskills.io](https://agenticskills.io)                                       | Skills and MCP     | Manual    | In review.                                                                                                                                                                 |
| [mcpm.sh registry](https://github.com/pathintegral-institute/mcpm.sh)              | `bestax-mcp`       | Manual    | In review in [#427](https://github.com/pathintegral-institute/mcpm.sh/pull/427). The entry gives `npx -y bestax-mcp@1` and lists each tool by name.                        |
| [Kilo marketplace](https://github.com/Kilo-Org/kilo-marketplace)                   | `bestax-mcp`       | Manual    | In review in [#339](https://github.com/Kilo-Org/kilo-marketplace/pull/339). The entry gives `npx -y bestax-mcp@1`.                                                         |
| [Goose extensions directory](https://block.github.io/goose/extensions/)            | `bestax-mcp`       | Manual    | In review in [#12784](https://github.com/aaif-goose/goose/pull/12784). One object in `servers.json` giving `npx -y bestax-mcp@1`.                                          |
| [llms-txt-hub](https://llmstxthub.com)                                             | bestax.io llms.txt | Manual    | In review in [#1925](https://github.com/thedaviddias/llms-txt-hub/pull/1925). An `.mdx` file with the name, description and both URLs.                                     |
| [mcp.directory](https://mcp.directory)                                             | `bestax-mcp`       | Mixed     | In review; submitted through the form on 2026-10-09 and reviewed within a day. It reads the repo for metadata. Claiming the page is an email to hello@mcp.directory.       |
| [Tessl Registry](https://tessl.io/registry/skills/github/allxsmith/bestax)         | The skills         | Manual    | Listed, with evaluation pending. One entry per skill from a scan of the `skills/` folder; run the analysis again after a skill changes.                                    |
| [Skills Directory](https://www.skillsdirectory.com/skills/allxsmith-bestax-form)   | The skills         | Manual    | Listed, one page per skill: A for `bestax-form`, `bestax-layout-scaffold` and `bestax-theming`, B for the other four. Each entry is scanned once; resubmit after a change. |
| [Cline MCP Marketplace](https://github.com/cline/mcp-marketplace)                  | `bestax-mcp`       | Manual    | In review in [issue #2883](https://github.com/cline/mcp-marketplace/issues/2883). The issue gives `npx -y bestax-mcp@1` and the logo URL.                                  |

## Plugin directories and marketplaces

Each of these takes the `bestax` plugin from allxsmith/bestax-skills. The last column says whether it lists the plugin yet.

| Where                                                                   | Carries                 | Updates   | When to act                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------- | ----------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anthropic plugin directory                                              | Skills and `bestax-mcp` | Mixed     | In review. A GitHub push webhook on bestax-skills sends it each publish, and a reviewer checks each version before it goes live.                                                                                                                     |
| Cursor Marketplace                                                      | Skills and `bestax-mcp` | Manual    | In review. Cursor reads bestax-skills through `.cursor-plugin/plugin.json` and reviews each update.                                                                                                                                                  |
| Kiro                                                                    | Skills and `bestax-mcp` | Manual    | In review. Kiro reaches out if it takes the power into its registry.                                                                                                                                                                                 |
| [Grok Build marketplace](https://github.com/xai-org/plugin-marketplace) | Skills and `bestax-mcp` | Automatic | In review in [#1237](https://github.com/xai-org/plugin-marketplace/pull/1237). The entry pins a commit, which moves when their maintainers merge a version-bump pull request.                                                                        |
| [awesome-copilot](https://github.com/github/awesome-copilot)            | Skills and `bestax-mcp` | Manual    | In review in [issue #4541](https://github.com/github/awesome-copilot/issues/4541). It pins a commit and the version in the root `plugin.json`, which stay put until we send an update.                                                               |
| [Build with Claude](https://github.com/davepoon/buildwithclaude)        | Skills and `bestax-mcp` | Manual    | Listed through [#385](https://github.com/davepoon/buildwithclaude/pull/385). The entry carries the version from `plugin.json`, so a pull request there bumps it.                                                                                     |
| [HOL Registry](https://hol.org/plugins)                                 | Skills and `bestax-mcp` | Mixed     | Listed through the awesome-ai-plugins entry below. HOL scans bestax-skills on its own, and the list entry is a line of text.                                                                                                                         |
| [Gemini CLI extensions](https://geminicli.com/extensions)               | Skills and `bestax-mcp` | Automatic | Listed. The gallery lists repositories with a `gemini-extension.json` and the `gemini-cli-extension` topic, and bestax-skills has both. Installs follow the repository.                                                                              |
| [aitmpl.com](https://www.aitmpl.com/plugins)                            | Skills and `bestax-mcp` | Manual    | In review in [#1132](https://github.com/davila7/claude-code-templates/pull/1132). A repo tuple in its generator plus a generated entry; the entry counted no skills because the marketplace source is `./`, and they regenerate the list themselves. |
| [Claude Plugin Hub](https://www.claudepluginhub.com)                    | Skills and `bestax-mcp` | Automatic | Listed. It indexes bestax-skills from the manifest on its own. Claiming the listing needs a sign-in.                                                                                                                                                 |

## Awesome lists

### Listed

| List                                                                                                                | Entry                              | Pull request                                                                       |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| [aldi/awesome-bulma](https://github.com/aldi/awesome-bulma)                                                         | Bestax                             | [#5](https://github.com/aldi/awesome-bulma/pull/5)                                 |
| [jaywcjlove/awesome-uikit](https://github.com/jaywcjlove/awesome-uikit)                                             | bestax-bulma                       | [#49](https://github.com/jaywcjlove/awesome-uikit/pull/49)                         |
| [anubhavsrivastava/awesome-ui-component-library](https://github.com/anubhavsrivastava/awesome-ui-component-library) | bestax-bulma                       | [#58](https://github.com/anubhavsrivastava/awesome-ui-component-library/pull/58)   |
| [jelmer/awesome-codemods](https://github.com/jelmer/awesome-codemods)                                               | bestax-migrate                     | [#7](https://github.com/jelmer/awesome-codemods/pull/7)                            |
| [acvnace/awesome-vibe-coding-resources](https://github.com/acvnace/awesome-vibe-coding-resources)                   | Bestax                             | [#111](https://github.com/acvnace/awesome-vibe-coding-resources/pull/111)          |
| [TensorBlock/awesome-mcp-servers](https://github.com/TensorBlock/awesome-mcp-servers)                               | Bestax MCP                         | [#2872](https://github.com/TensorBlock/awesome-mcp-servers/pull/2872)              |
| [AlexMili/Awesome-MCP](https://github.com/AlexMili/Awesome-MCP)                                                     | Bestax MCP                         | [#231](https://github.com/AlexMili/Awesome-MCP/pull/231)                           |
| [iamismile/web-dev-resources](https://github.com/iamismile/web-dev-resources)                                       | Bestax                             | [#61](https://github.com/iamismile/web-dev-resources/pull/61)                      |
| [OSSDrop/OSSDrop](https://github.com/OSSDrop/OSSDrop)                                                               | Bestax                             | [#64](https://github.com/OSSDrop/OSSDrop/pull/64)                                  |
| [MobinX/awesome-mcp-list](https://github.com/MobinX/awesome-mcp-list)                                               | allxsmith/bestax                   | [38f0646](https://github.com/MobinX/awesome-mcp-list/commit/38f0646)               |
| [toolsdk-ai/toolsdk-mcp-registry](https://github.com/toolsdk-ai/toolsdk-mcp-registry)                               | bestax-mcp                         | [#587](https://github.com/toolsdk-ai/toolsdk-mcp-registry/pull/587)                |
| [Piebald-AI/awesome-gemini-cli](https://github.com/Piebald-AI/awesome-gemini-cli)                                   | Bestax                             | [#161](https://github.com/Piebald-AI/awesome-gemini-cli/pull/161)                  |
| [alvinreal/awesome-opensource-ai](https://github.com/alvinreal/awesome-opensource-ai)                               | bestax-mcp                         | [#800](https://github.com/alvinreal/awesome-opensource-ai/pull/800)                |
| [slavakurilyak/awesome-ai-agents](https://github.com/slavakurilyak/awesome-ai-agents)                               | bestax-mcp                         | [issue #688](https://github.com/slavakurilyak/awesome-ai-agents/issues/688)        |
| [laolaoshiren/claude-code-skills-zh](https://github.com/laolaoshiren/claude-code-skills-zh)                         | Bestax skills                      | [3256076](https://github.com/laolaoshiren/claude-code-skills-zh/commit/3256076)    |
| [hashgraph-online/awesome-ai-plugins](https://github.com/hashgraph-online/awesome-ai-plugins)                       | Bestax                             | [#623](https://github.com/hashgraph-online/awesome-ai-plugins/pull/623)            |
| [pegaltier/awesome-utils-dev](https://github.com/pegaltier/awesome-utils-dev)                                       | Bestax                             | [#81](https://github.com/pegaltier/awesome-utils-dev/pull/81)                      |
| [mcpHQ/awesome-mcp-servers](https://github.com/mcpHQ/awesome-mcp-servers)                                           | Bestax                             | [#135](https://github.com/mcpHQ/awesome-mcp-servers/pull/135)                      |
| [bradtraversy/design-resources-for-developers](https://github.com/bradtraversy/design-resources-for-developers)     | Bestax                             | [#1797](https://github.com/bradtraversy/design-resources-for-developers/pull/1797) |
| [Chat2AnyLLM/awesome-repo-configs](https://github.com/Chat2AnyLLM/awesome-repo-configs)                             | allxsmith/bestax and bestax-skills | [#221](https://github.com/Chat2AnyLLM/awesome-repo-configs/pull/221)               |
| [gmh5225/awesome-skills](https://github.com/gmh5225/awesome-skills)                                                 | bestax-skills                      | [#82](https://github.com/gmh5225/awesome-skills/pull/82)                           |
| [lauthieb/awesome-storybook](https://github.com/lauthieb/awesome-storybook)                                         | Bestax Storybook                   | [#21](https://github.com/lauthieb/awesome-storybook/pull/21)                       |
| [Piebald-AI/awesome-gemini-cli-extensions](https://github.com/Piebald-AI/awesome-gemini-cli-extensions)             | Bestax                             | [#61](https://github.com/Piebald-AI/awesome-gemini-cli-extensions/pull/61)         |
| [VoltAgent/official-mcp-servers](https://github.com/VoltAgent/official-mcp-servers)                                 | allxsmith/bestax                   | [#9](https://github.com/VoltAgent/official-mcp-servers/pull/9)                     |

### In review

| List                                                                                                      | Entry                                     | Pull request                                                                  |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| [enaqx/awesome-react](https://github.com/enaqx/awesome-react)                                             | bestax-bulma                              | [#1862](https://github.com/enaqx/awesome-react/pull/1862)                     |
| [brillout/awesome-react-components](https://github.com/brillout/awesome-react-components)                 | Bestax                                    | [#616](https://github.com/brillout/awesome-react-components/pull/616)         |
| [jgthms/bulma](https://github.com/jgthms/bulma) (README)                                                  | Bestax                                    | [#4014](https://github.com/jgthms/bulma/pull/4014)                            |
| [aycanogut/front-end-resources](https://github.com/aycanogut/front-end-resources)                         | bestax-bulma                              | [#89](https://github.com/aycanogut/front-end-resources/pull/89)               |
| [semlinker/awesome-typescript](https://github.com/semlinker/awesome-typescript)                           | create-bestax                             | [#198](https://github.com/semlinker/awesome-typescript/pull/198)              |
| [SecretiveShell/Awesome-llms-txt](https://github.com/SecretiveShell/Awesome-llms-txt)                     | bestax.io llms.txt                        | [#200](https://github.com/SecretiveShell/Awesome-llms-txt/pull/200)           |
| [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)                           | allxsmith/bestax                          | [#15446](https://github.com/punkpeye/awesome-mcp-servers/pull/15446)          |
| [yzfly/Awesome-MCP-ZH](https://github.com/yzfly/Awesome-MCP-ZH)                                           | Bestax                                    | [#653](https://github.com/yzfly/Awesome-MCP-ZH/pull/653)                      |
| [ai-for-developers/awesome-ai-coding-tools](https://github.com/ai-for-developers/awesome-ai-coding-tools) | Bestax                                    | [#817](https://github.com/ai-for-developers/awesome-ai-coding-tools/pull/817) |
| [eltociear/awesome-AI-driven-development](https://github.com/eltociear/awesome-AI-driven-development)     | bestax-mcp                                | [#146](https://github.com/eltociear/awesome-AI-driven-development/pull/146)   |
| [narrowin/awesome-generative-ui](https://github.com/narrowin/awesome-generative-ui)                       | bestax-mcp                                | [#21](https://github.com/narrowin/awesome-generative-ui/pull/21)              |
| [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)                       | allxsmith/bestax                          | [#1132](https://github.com/VoltAgent/awesome-agent-skills/pull/1132)          |
| [abubakarsiddik31/claude-skills-collection](https://github.com/abubakarsiddik31/claude-skills-collection) | Bestax                                    | [#57](https://github.com/abubakarsiddik31/claude-skills-collection/pull/57)   |
| [GetBindu/awesome-claude-code-and-skills](https://github.com/GetBindu/awesome-claude-code-and-skills)     | allxsmith/bestax                          | [#237](https://github.com/GetBindu/awesome-claude-code-and-skills/pull/237)   |
| [JayLZhou/Awesome-Agent-Skills](https://github.com/JayLZhou/Awesome-Agent-Skills)                         | Bestax Skills                             | [#48](https://github.com/JayLZhou/Awesome-Agent-Skills/pull/48)               |
| [kodustech/awesome-agent-skills](https://github.com/kodustech/awesome-agent-skills)                       | bestax-layout-scaffold                    | [#128](https://github.com/kodustech/awesome-agent-skills/pull/128)            |
| [ZeroPointRepo/awesome-hermes-skills](https://github.com/ZeroPointRepo/awesome-hermes-skills)             | Bestax skills                             | [#103](https://github.com/ZeroPointRepo/awesome-hermes-skills/pull/103)       |
| [karanb192/awesome-claude-skills](https://github.com/karanb192/awesome-claude-skills)                     | Bestax skills                             | [#383](https://github.com/karanb192/awesome-claude-skills/pull/383)           |
| [alexpate/awesome-design-systems](https://github.com/alexpate/awesome-design-systems)                     | Bestax                                    | [#368](https://github.com/alexpate/awesome-design-systems/pull/368)           |
| [vitejs/awesome-vite](https://github.com/vitejs/awesome-vite)                                             | create-bestax                             | [#1155](https://github.com/vitejs/awesome-vite/pull/1155)                     |
| [dustinspecker/awesome-eslint](https://github.com/dustinspecker/awesome-eslint)                           | Bestax (eslint-plugin)                    | [#313](https://github.com/dustinspecker/awesome-eslint/pull/313)              |
| [nafasebra/awesome-webdesign-tools](https://github.com/nafasebra/awesome-webdesign-tools)                 | Bestax                                    | [#149](https://github.com/nafasebra/awesome-webdesign-tools/pull/149)         |
| [aldi/awesome-bulma](https://github.com/aldi/awesome-bulma)                                               | bestax-mcp and Bestax Skills, new section | [#6](https://github.com/aldi/awesome-bulma/pull/6)                            |
| [tolkonepiu/best-of-mcp-servers](https://github.com/tolkonepiu/best-of-mcp-servers)                       | allxsmith/bestax                          | [#481](https://github.com/tolkonepiu/best-of-mcp-servers/pull/481)            |
| [AIAnytime/Awesome-MCP-Server](https://github.com/AIAnytime/Awesome-MCP-Server)                           | Bestax                                    | [#169](https://github.com/AIAnytime/Awesome-MCP-Server/pull/169)              |
| [YuzeHao2023/Awesome-MCP-Servers](https://github.com/YuzeHao2023/Awesome-MCP-Servers)                     | Bestax                                    | [#594](https://github.com/YuzeHao2023/Awesome-MCP-Servers/pull/594)           |
| [ccplugins/awesome-claude-code-plugins](https://github.com/ccplugins/awesome-claude-code-plugins)         | Bestax and allxsmith/bestax-skills        | [#661](https://github.com/ccplugins/awesome-claude-code-plugins/pull/661)     |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills)                   | bestax-skills                             | [#2154](https://github.com/ComposioHQ/awesome-claude-skills/pull/2154)        |
| [BehiSecc/awesome-claude-skills](https://github.com/BehiSecc/awesome-claude-skills)                       | bestax-skills                             | [#880](https://github.com/BehiSecc/awesome-claude-skills/pull/880)            |
| [composio-community/awesome-codex-skills](https://github.com/composio-community/awesome-codex-skills)     | bestax-skills                             | [#332](https://github.com/composio-community/awesome-codex-skills/pull/332)   |
| [heilcheng/awesome-agent-skills](https://github.com/heilcheng/awesome-agent-skills)                       | Skills by Bestax                          | [#561](https://github.com/heilcheng/awesome-agent-skills/pull/561)            |
| [spencerpauly/awesome-cursor-skills](https://github.com/spencerpauly/awesome-cursor-skills)               | bestax-skills                             | [#106](https://github.com/spencerpauly/awesome-cursor-skills/pull/106)        |
| [rohitg00/awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit)           | bestax-skills                             | [#832](https://github.com/rohitg00/awesome-claude-code-toolkit/pull/832)      |
| [Prat011/awesome-llm-skills](https://github.com/Prat011/awesome-llm-skills)                               | bestax-skills                             | [#273](https://github.com/Prat011/awesome-llm-skills/pull/273)                |
| [finfin/awesome-frontend-skills](https://github.com/finfin/awesome-frontend-skills)                       | allxsmith/bestax                          | [#6](https://github.com/finfin/awesome-frontend-skills/pull/6)                |
| [VoltAgent/awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills)                 | bestax-layout-scaffold                    | [#591](https://github.com/VoltAgent/awesome-openclaw-skills/pull/591)         |

Every list entry is Manual: it holds the text we submitted until someone opens a pull request
against that list.

## Planned

Not live yet. Each needs a submission or a sign-in first.

| Where                                                                                                                                                                           | Carries                     | Updates   | Notes                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub MCP Registry                                                                                                                                                             | `bestax-mcp`                | Unknown   | Onboarding requested in [discussion #1257](https://github.com/github/github-mcp-server/discussions/1257#discussioncomment-18787001). New versions sync from the official listing once it is added.                                           |
| OpenAI plugin directory                                                                                                                                                         | The skills                  | Manual    | It takes remote MCP servers only, so `bestax-mcp` would not come along. Each upload is a ZIP with a new version.                                                                                                                             |
| [agentskill.sh](https://agentskill.sh/submit)                                                                                                                                   | The skills                  | Manual    | The import of `allxsmith/bestax` hit its rate limit on 2026-10-09 ("try again in an hour"); submit the repo again.                                                                                                                           |
| [llmstxt.site](https://llmstxt.site/submit)                                                                                                                                     | bestax.io llms.txt          | Manual    | The form requires an email address; everything else is filled in.                                                                                                                                                                            |
| [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)                                                                                         | The skills                  | Manual    | Issue form only, and issue creation was limited to collaborators on 2026-10-09. The monorepo qualifies on age; retry when the limit lifts.                                                                                                   |
| [Smithery](https://smithery.ai/skills)                                                                                                                                          | The skills                  | Manual    | Publish needs a login, and it does not index the skills on its own. Its MCP side needs a `.mcpb` bundle.                                                                                                                                     |
| [ModelScope MCP marketplace](https://modelscope.cn/mcp)                                                                                                                         | `bestax-mcp`                | Manual    | Create MCP needs a ModelScope account. It feeds Cherry Studio.                                                                                                                                                                               |
| [mcp.so](https://mcp.so/submit)                                                                                                                                                 | `bestax-mcp`                | Manual    | Submission is a one-time paid listing or an untriaged GitHub issue. Skipped.                                                                                                                                                                 |
| LobeHub marketplace                                                                                                                                                             | `bestax-mcp`                | Unknown   | No self-serve submission found; market.lobehub.com is an API endpoint.                                                                                                                                                                       |
| [Best of JS](https://bestofjs.org)                                                                                                                                              | The repo                    | Manual    | Takes projects from 100 GitHub stars.                                                                                                                                                                                                        |
| [MunGell/awesome-for-beginners](https://github.com/MunGell/awesome-for-beginners)                                                                                               | The repo                    | Manual    | Needs open `good first issue` issues first.                                                                                                                                                                                                  |
| Claude Desktop connectors directory                                                                                                                                             | `bestax-mcp`                | Manual    | Needs a `.mcpb` bundle, as does Smithery's MCP side.                                                                                                                                                                                         |
| [hashgraph-online/awesome-codex-plugins](https://github.com/hashgraph-online/awesome-codex-plugins)                                                                             | The plugin                  | Manual    | Needs `.codex-plugin/plugin.json` in bestax-skills and a HOL scanner score of 80 or more.                                                                                                                                                    |
| [Docker MCP Catalog](https://github.com/docker/mcp-registry)                                                                                                                    | `bestax-mcp`                | Manual    | Needs a Dockerfile in this repo. Its queue had three merges in the six months to October 2026.                                                                                                                                               |
| [PulseMCP](https://www.pulsemcp.com)                                                                                                                                            | `bestax-mcp`                | Automatic | Closed to submissions; says it will import from the official MCP registry when it reopens.                                                                                                                                                   |
| [RoggeOhta/awesome-codex-cli](https://github.com/RoggeOhta/awesome-codex-cli) and [awesome-opencode](https://github.com/awesome-opencode/awesome-opencode)                      | The skills                  | Manual    | Each wants docs that cover its agent, and the skills docs mention neither Codex nor OpenCode.                                                                                                                                                |
| [markodenic/web-development-resources](https://github.com/markodenic/web-development-resources) and [agarrharr/awesome-cli-apps](https://github.com/agarrharr/awesome-cli-apps) | bestax-bulma, create-bestax | Manual    | Both refuse submissions written with an LLM, so a maintainer writes these by hand.                                                                                                                                                           |
| farhan523/awesome-js-starters                                                                                                                                                   | `@allxsmith/bestax-bulma`   | Manual    | The repository stopped resolving on 2026-10-09, hours after [#59](https://github.com/farhan523/awesome-js-starters/pull/59) opened with a package README. The fork `allxsmith/awesome-js-starters` keeps that README if the list comes back. |

## GitHub topics

Topic pages are the one listing GitHub keeps itself. `allxsmith/bestax` carries `agent-skills`,
`bulma`, `bulma-css`, `component-library`, `design-system`, `llms-txt`, `mcp-server`, `react`,
`react-bulma`, `react-component-library`, `react-components`, `typescript`, `ui-components` and
`ui-library`. `allxsmith/bestax-skills` carries `agent-skills`, `bulma`, `claude-code`,
`claude-code-plugin`, `claude-plugin`, `claude-skills`, `cursor-plugin`, `gemini-cli-extension`,
`mcp`, `mcp-server`, `react` and `skills`; the Gemini CLI gallery reads `gemini-cli-extension`, so
that one stays. Topics are repository settings, so `skills-publish.yml` regenerating bestax-skills
does not touch them. Add a topic when a package gains a new surface.

## What goes stale

Third-party entries copy facts from this repo. A change to any of these makes some of them wrong.
Say in the pull request which listings need an update, then open those updates once it ships.

- **Adding, renaming or removing a skill.** Entries that name skills or say how many there are:
  claude-skills-collection, awesome-hermes-skills, claude-code-skills-zh, Awesome-Agent-Skills
  (JayLZhou), awesome-claude-code-and-skills and kodustech (both name
  `bestax-layout-scaffold`), skillsindex.dev, agenticskills.io, cursor.directory, ClawHub, Build
  with Claude (which also gives a count), awesome-ai-plugins, karanb192/awesome-claude-skills,
  heilcheng/awesome-agent-skills (one line per skill), awesome-openclaw-skills and
  awesome-frontend-skills (both name `bestax-layout-scaffold`), and the Tessl Registry and Skills
  Directory, which hold one entry per skill. Chat2AnyLLM's config scans the `skills/` folder on
  its own.
- **Editing a skill.** cursor.directory and ClawHub hold copies of each skill's text, so they keep
  the old wording until someone pastes or uploads the new one. The Tessl Registry and Skills
  Directory publish a score and a security grade from a scan of each skill, and show the old one
  until the skill is analysed or resubmitted again.
- **Changing what `bestax-mcp` offers.** Most MCP entries say it serves props, examples, CSS
  variables and Agent Skills, offline, with no API key. awesome-AI-driven-development also gives
  an example count, in English and Japanese. toolsdk-mcp-registry documents the
  `BESTAX_MCP_NO_VERSION_CHECK` variable, and the mcpm.sh registry lists each tool by name. The
  goose extensions directory, AIAnytime, YuzeHao2023, ccplugins, official-mcp-servers,
  best-of-mcp-servers, Chat2AnyLLM's `mcp_server_repos.json`, the Cline issue and mcp.directory
  carry the same description.
- **A new major of `bestax-mcp`.** Awesome-MCP-ZH, TensorBlock, cursor.directory, the mcpm.sh
  registry, the Kilo marketplace, the goose extensions directory, AIAnytime, ccplugins,
  Chat2AnyLLM, the Cline issue and mcp.directory give `npx -y bestax-mcp@1` as the command. The `bestax` plugin does not go stale here: it pins the
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
- **Changing an install command.** awesome-claude-code-and-skills, claude-code-skills-zh,
  BehiSecc, gmh5225, awesome-cursor-skills, awesome-claude-code-toolkit, awesome-frontend-skills
  and awesome-llm-skills give `npx skills add https://github.com/allxsmith/bestax --skill <name>`.
  awesome-codex-skills gives the Codex skill-installer form, `--repo allxsmith/bestax --path
skills/<name>`. ccplugins and awesome-claude-code-toolkit give `/plugin marketplace add
allxsmith/bestax-skills` and `/plugin install bestax@bestax`.
- **Moving or renaming a package folder.** Entries link to `tree/main/bestax-mcp`,
  `tree/main/skills`, `tree/main/skills/bestax-layout-scaffold` (and every other skill folder, in
  heilcheng/awesome-agent-skills), `tree/main/create-bestax`, `tree/main/eslint-plugin` and
  `tree/main/bestax-migrate`. Chat2AnyLLM pins `skillsPath: skills` and `subPath: bestax-mcp`, and
  aitmpl.com pins the bestax-skills repo with `https://bestax.io`. Plugin listings point at
  allxsmith/bestax-skills instead.
- **Renaming a package or moving a page on bestax.io.** Entries use the package names,
  `https://bestax.io`, `/llms.txt` and `/llms-full.txt`.
- **A new Bulma major.** Nearly every entry says "Bulma v1".

Bestax is called bestax-bulma on React component-library lists and Bestax everywhere else.
Package names stay as they are. Write a new or refreshed description so it says early on that
Bestax is for building with Bulma v1, since Bulma is the name people search for. Older entries,
such as the description in `bestax-mcp/server.json`, still put it last.
