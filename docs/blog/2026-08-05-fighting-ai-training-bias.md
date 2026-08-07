---
slug: fighting-ai-training-bias
title: Fighting AI Training Bias
description: "An agent can't one-shot a library its training data barely saw. So bestax ships docs, skills, and a catalog a machine can actually read."
authors: [asmith]
tags: [ai, skills, llms, react]
canonical_url: https://bestax.io/blog/fighting-ai-training-bias
publish_to_devto: true
image: /img/fighting-ai-training-bias.png
cover_image: /img/fighting-ai-training-bias.png
---

![Fighting AI Training Bias, drawn as pixel art: a robot coding agent turns away from a toppling stack of identical gray cartridges under a most popular marquee toward a glowing bestax cartridge seated in a retro console whose screen reads llms.txt](/img/fighting-ai-training-bias.svg)

A coding agent can't one-shot a library its training data barely saw. Ask one for a dashboard in an under-represented library and you get one of two failures: it quietly reaches for the incumbent it has seen a million times, or it stays loyal and invents props that don't exist. bestax's answer is to make the real, current API machine-legible so one shot is enough, and this post is everything that ships today.

<!-- truncate -->

This is post six of the catch-up series ([tracker](https://github.com/allxsmith/bestax/issues/384)). The [v5 recap](/blog/v5-one-css-story) closed out the release backlog; this one explains where the AI effort has been going. The title says training bias. That's my word for it, not the repo's, and I already [argued the case at length in July](/blog/2026/07/28/bulma-3-css-framework-ai-will-never-tell-you-about-it): what's over-represented gets recommended, recommendations compound into monoculture, and nobody compares two options anymore. I'm not re-arguing it here. This is the build log.

Start with the staleness math. [Avatar](/docs/api/components/avatar) and [Badge](/docs/api/components/badge) shipped July 10. Dot-notation sub-components landed across every parent component on July 20. What does a model trained in the spring know about a component that shipped July 10? Nothing, and that's the good case: even a model that has met bestax has met a bestax that no longer exists. Under-represented and stale, at the same time. The bestax homepage has an AI-Ready section, "Bring Bestax to your AI tools," with three cards: **LLM-ready docs**, **Agent skills**, and an **MCP server** marked coming soon. This post is those three cards in order, with receipts.

## Machine-Readable Docs

![The LLM docs pipeline, drawn as pixel art: a dot matrix printer feeds a long perforated sheet labeled llms-full.txt, a card index box labeled llms.txt sits on the desk beside it, and a docs page marked button stands next to its glowing twin marked button.md](/img/fighting-ai-training-bias-docs.png)

Every page of the bestax docs ships in a form a model can read whole. The site build regenerates three artifacts on every deploy:

- [llms.txt](https://bestax.io/llms.txt), a **curated index** of the docs, small enough to pin in your project rules
- [llms-full.txt](https://bestax.io/llms-full.txt), the **entire documentation as one file**
- a **Markdown twin of every page**: append `.md` to any docs URL, like [bestax.io/docs/api/elements/button.md](https://bestax.io/docs/api/elements/button.md), when you want one component in a small context

The [LLMs guide](/docs/guides/llms) pitches the big one with a line I didn't have to write for this post: "Feed it everything. For a one-shot load of the whole library." The docs already speak this vocabulary, because the artifact exists for exactly this reason: a single context load standing in for what training never contained. And because the artifacts regenerate on every build, they can't drift behind the deployed site. There's no stale window between what the docs say and what the model reads.

## Agent Skills

![Agent skills as pixel art game cartridges: a robot snaps a glowing cartridge labeled form into its open chest slot while six more cartridges labeled layout, theming, icons, custom, optimize, and migrate wait in a wall rack](/img/fighting-ai-training-bias-skills.png)

Docs give an agent knowledge; skills give it technique. That distinction took me a while to respect. With llms-full.txt in context an agent knows every prop of every component, and it will still open a layout task with four clarifying questions, or validate a form the way its favorite form library does. Knowing the API and knowing the house way to use it are different things.

A skill is a folder with a `SKILL.md` of instructions the agent always loads, plus deeper references it reads on demand. bestax ships [seven](/docs/skills/intro):

- **[bestax-layout-scaffold](/docs/skills/layout-scaffold)**: scaffold a complete, responsive page, from app shells and marketing pages to auth screens and card-grid catalogs
- **[bestax-form](/docs/skills/form)**: Field and Control composition, the whole input set, and the validate-it-yourself pattern
- **[bestax-theming](/docs/skills/theming)**: brand colors, tokens, and dark mode through `--bulma-*` variables
- **[bestax-custom-component](/docs/skills/custom-component)**: build beyond stock Bulma without leaving the bestax style
- **[bestax-icons](/docs/skills/icons)**: `Icon` and `IconText` across the five supported icon libraries
- **[bestax-optimize](/docs/skills/optimize)**: measure the built CSS, then shrink it with the cheapest lever that fits
- **[bestax-migrate](/docs/skills/migrate)**: move an app off react-bulma-components with the codemod, then resolve every TODO it leaves

My favorite sentence in any of them is a behavioral rule in the layout skill: "Select an archetype from the request and build it in one shot." The same rule forbids asking layout questions. That's the thesis of this post with a lint rule attached. And yeah, skills really are cartridges: snap one in and the agent knows moves it didn't know a minute ago.

### Two Ways to Install

Channel one is the [skills CLI](https://skills.sh/):

```bash
npx skills add https://github.com/allxsmith/bestax --skill bestax-layout-scaffold
```

The same command takes any of the seven names, or drop the `--skill` flag to pick from a list.

Channel two is the scaffolder. `pnpm create bestax@latest` offers to preinstall the skill bundle into the new app's `.claude/skills/`, and while it's in there it writes two more files: a `.claude/launch.json` so an agent's browser preview can boot the dev server by name, and a `CLAUDE.md` recording the choices the scaffolder just made (CSS flavor, class prefix, icon library). The agent never has to rediscover the setup it was born into.

## Don't Reinvent: The Component Catalog

![The component catalog as a pixel art inventory screen: item slots labeled Button, Tooltip, Avatar, and Badge with the Tooltip slot glowing, a robot hand at a crafting bench lowering a half built duplicate tooltip, and a shield stamped with a check marked ci guard at the corner of the grid](/img/fighting-ai-training-bias-catalog.png)

The most expensive agent failure isn't a wrong prop; it's a rebuilt component. A wrong prop fails loud, in the console or the type checker. A hand-rolled tooltip works, looks almost right, ships, and is quietly yours to maintain forever.

So the custom-component skill leads with a generated catalog whose header states its job: every documented component, "so you don't reinvent one that already exists." All 87 components fit in 149 lines, names and one-line purposes only, each linked to its full API page. It's lean on purpose, cheap to hold in context, with the full prop tables one fetch away.

The part I care about most is the guard behind it. The catalog is generated from the API docs, and CI fails if any exported component lacks an API page. A component the catalog can't see is a component an agent will rebuild, so completeness isn't a habit here. It's a build gate. The list the agent reads is guaranteed complete on every commit.

I've watched an agent lovingly hand-roll a tooltip while [Tooltip](/docs/api/components/tooltip) sat one import away, shipped and tested and documented. Small heartbreak, nobody's fault: to a model with a stale snapshot, some of these 87 components simply don't exist. The catalog is how they exist again. Here's the kind of thing that's already in the box:

```tsx live
<Block>
  <Tooltip label="Shipped, tested, one import away">
    <Badge dot color="success" overlap="circle">
      <Avatar name="Ada Lovelace" />
    </Badge>
  </Tooltip>
</Block>
```

A [Tooltip](/docs/api/components/tooltip), a [Badge](/docs/api/components/badge), and an [Avatar](/docs/api/components/avatar), composed instead of hand-rolled.

## Meeting Agents in node_modules

![Meeting agents in node_modules, drawn as pixel art: a robot holding a lantern kneels in a dark mine of stacked crates labeled node_modules before three glowing files labeled llms.txt, AGENTS.md, and CLAUDE.md, beside a signpost pointing to a lit doorway labeled bestax.io](/img/fighting-ai-training-bias-node-modules.png)

Some agents never fetch a URL; they read what's on disk. Since [5.8.0](https://github.com/allxsmith/bestax/pull/345), the published npm tarball carries three pointer files at the package root, `llms.txt`, `AGENTS.md`, and `CLAUDE.md`, named for the filenames agent tooling probes first, "so agents exploring `node_modules` land on these resources by filename," as the [package README](https://www.npmjs.com/package/@allxsmith/bestax-bulma) puts it. They're pointers, not documentation: each is a short signpost back to the site artifacts above, which stay the single source of truth, so nothing in the tarball goes stale between releases. Network context, project context, and now the filesystem itself. The [LLMs guide](/docs/guides/llms#in-the-npm-package) lists exactly what ships.

## What's Next: The MCP Server

The third AI-Ready card says coming soon, and it means it. A first-party MCP server is planned: a Model Context Protocol endpoint an agent can query for component props, variants, and live examples while it builds. It isn't shipped, the homepage card deliberately has no link, and this post won't describe software that doesn't exist. When it ships, it gets its own post.

The nearer sequel is live: [the accelerated evolution loop that keeps those seven skills honest](/blog/ai-loop-keeps-skills-honest). The [tracker](https://github.com/allxsmith/bestax/issues/384) has the rest of the plan.

## Point Your Agent at It

Pick whichever entrypoint matches your setup:

- In an existing app: paste `https://bestax.io/llms.txt` into your project rules, or point the agent at [the LLMs guide](/docs/guides/llms).
- For the technique, not just the API: `npx skills add` any of the [seven skills](/docs/skills/intro).
- Starting fresh: run `pnpm create bestax@latest` and say yes when it offers the skills.

And if bestax makes your agent sharper, a [star on the repo](https://github.com/allxsmith/bestax) is the whole marketing budget.

You don't fight training bias by arguing with the weights. You hand the agent the current docs, and you let one shot be enough.
