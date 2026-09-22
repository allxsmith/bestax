---
slug: fighting-ai-training-bias
title: Fighting AI Training Bias
description: 'I built a React component library for Bulma, did the usual work to get it found, and then asked coding agents what they would use. This is the slow attempt to become visible to them.'
authors: [asmith]
tags: [ai, bulma, react, opensource]
canonical_url: https://bestax.io/blog/fighting-ai-training-bias
publish_to_devto: true
image: /img/fighting-ai-training-bias.png
cover_image: /img/fighting-ai-training-bias.png
---

![Fighting AI Training Bias, drawn as pixel art: a robot coding agent turns away from a toppling stack of identical gray cartridges under a most popular marquee toward a glowing bestax cartridge seated in a retro console whose screen reads llms.txt](/img/fighting-ai-training-bias.svg)

I built [`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma) because the React options for Bulma were thin wrappers over an older Bulma, or they had gone quiet. I wanted a typed component library you could build an app with, on Bulma v1, closer to MUI than to a handful of class bindings. I did the things that used to get a package found. Almost nobody came. Then I asked coding agents what they would use to start a web app, and the answers explained the quiet better than another pass over the README.

Updated September 2026. The first version of this post was a tour of the machinery. This is the story.

<!-- truncate -->

## The Work That Used to Be Enough

The usual launch work did not produce a usual launch.

I wrote the README like it mattered, on npm and on GitHub. I posted on Reddit. I spent real time on SEO, put the docs on Cloudflare so they would be fast, and kept writing, on this site and on dev.to and Medium. The docs site alone ate more hours than I like to admit. On September 21, 2026, the repo had [eleven GitHub stars](https://github.com/allxsmith/bestax).

Two explanations offered themselves. Bulma was dead, or the people who used to go looking for a library had started asking a model instead.

Dead was the wrong guess. Bulma 1.0.4 has been the npm release since April 2025, and the [repository](https://github.com/jgthms/bulma) took fixes as recently as September 21, 2026. That is a maintained project with a quiet release cadence. Small is the accurate description.

I had also started hearing that people were done using Google for this kind of question, and I figured npm search was headed the same way. I figured fewer people read an article about a library when an agent will write the integration. I can't prove any of that from eleven stars. I could test the part about the agents.

Here is the room those agents are standing in. Downloads are npm's public counts for the week of September 14 to 20, 2026. Stars are GitHub's counts on September 21.

| Framework                                                    | Weekly downloads  | GitHub stars  |
| ------------------------------------------------------------ | ----------------- | ------------- |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss)  | about 96 million  | about 98,000  |
| [Bootstrap](https://github.com/twbs/bootstrap)               | about 5.1 million | about 175,000 |
| [Bulma](https://github.com/jgthms/bulma)                     | about 279,000     | about 50,000  |
| [Foundation](https://github.com/foundation/foundation-sites) | about 87,000      | about 30,000  |

The two columns disagree, and that disagreement is the point. Stars remember a decade. Weekly installs are what a new project reaches for now. Tailwind's weekly downloads are about 340 times Bulma's. Bootstrap's are about 18 times Bulma's, and Bootstrap still leads the star count by a wide margin. Foundation's last npm release is September 2024, and its weekly installs sit under Bulma's, with a star count that remembers a longer life. Bulma is a real framework. Next to those numbers it is a thin slice.

## What the Models Kept Picking

Asked for a web app, the models picked React, then Tailwind and shadcn/ui.

React was a relief. The rest was the same answer, over and over, no matter how I rephrased the prompt. Tailwind for the styling. shadcn/ui for the components.

Then I asked for a new project on Bulma. They recommended [`react-bulma-components`](https://www.npmjs.com/package/react-bulma-components). That package last published 4.1.0 in February 2022, and it still targets Bulma 0.9. They put it ahead of this library, and ahead of newer Bulma libraries, [`reactive-bulma`](https://www.npmjs.com/package/reactive-bulma) and [`trunx`](https://www.npmjs.com/package/trunx). Both of those were publishing releases in September 2026. The models were not picking the thing under active work. They were picking the name they had seen.

It got stranger. A lot of the answers talked me out of a component library entirely. Wrappers, they said, were a dead end. The better experience was Bulma's classes, written straight into the markup. bestax often wasn't in the conversation at all.

I asked what I would have to do for it to become a choice. The advice was unglamorous. Keep doing the things you would do for human readers in a world before these tools. The README, the posts, the docs. So I kept going.

## A Library, Not a Wrapper

A thin wrapper was never going to win that comparison. The classes were already in the training data. A model that has seen `class="button is-primary"` over and over has no reason to invent a `<Button>` it has barely seen.

That was the original bet anyway. I didn't set out to publish bindings and stop. Over 2026 the library grew past Bulma's own catalog: a carousel, dialogs, toasts, a sidebar, and form controls Bulma doesn't ship, a switch, a slider, autocomplete, a tag input, a rating. An avatar and a badge came later. The [Bulma v1 guide](/docs/guides/features/bulma-v1) is the list, if you want it. There had to be something in the package that raw classes could not stand in for.

I had started thinking of it the way I think of MUI, a full set of components. Mantine sits in that same category for me. Becoming that kind of library did not change the cold start. In the chats I ran, MUI and Mantine were not the default either. Tailwind and shadcn/ui were. The default is whatever the training set can reconstruct without looking anything up.

I posted more, and I rewrote docs I had already rewritten. Asked again, the answer moved one step. Popular training data is why a one-shot looks finished. The model has seen that library constantly, so the shape of a correct file is already in the weights.

## The Source Was the Tell

The pages looked acceptable. The source did not.

I would prompt for a small site and get something that rendered, and that I would not want to ship. I know the library can look better than that, because I have built the screens. The shock was the markup. A lot of it was Bulma classes, assembled by hand, with a custom bit of React wherever a component already existed. Tooltip rebuilt. Avatar implied with a div and a background color. The model was not refusing the package. It did not know the package well enough to reach for it.

That's the stale half of the same problem. A model whose training ended in the spring has never met a component that shipped in July. Even a model that met bestax once met a bestax that has since grown new props, new components, and a different shape. Under-represented, and out of date, at the same time.

## What I Built So a Model Could Read It

When I asked what would help, three suggestions came back. Machine-readable docs. Skills. An MCP server. I built them in that order, and none of them worked the way the first conversation promised.

![The LLM docs pipeline, drawn as pixel art: a dot matrix printer feeds a long perforated sheet labeled llms-full.txt, a card index box labeled llms.txt sits on the desk beside it, and a docs page marked button stands next to its glowing twin marked button.md](/img/fighting-ai-training-bias-docs.png)

The docs part was the cheap one. The site already runs on Docusaurus, and [`docusaurus-plugin-llms`](https://www.npmjs.com/package/docusaurus-plugin-llms) generates three artifacts on every build. [`llms.txt`](https://bestax.io/llms.txt) is a curated index. [`llms-full.txt`](https://bestax.io/llms-full.txt) is the documentation in one file. Every docs page also has a markdown twin, so a URL like [bestax.io/docs/api/elements/button.md](https://bestax.io/docs/api/elements/button.md) is one component instead of the whole library. They regenerate with the deploy, so they can't drift behind the site. The [LLMs guide](/docs/guides/llms) is the map of what exists.

I also opened the door on purpose in [`robots.txt`](https://bestax.io/robots.txt). The file carries a content signal of `search=yes, ai-input=yes, ai-train=yes`. In that vocabulary, search is an index, ai-input is using the page as context when a model answers, and ai-train is training. Some maintainers would refuse the third. I want this library in the next training set, so the signal says yes.

Separately, I turned on Cloudflare's [Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/) for the zone. The toggle lives under AI Crawl Control. When a client sends `Accept: text/markdown`, Cloudflare converts the HTML and responds with `content-type: text/markdown`. Cloudflare's announcement names agents, Claude Code among them, that already send that header. I checked this site. The LLMs guide comes back as markdown. Worth knowing the difference, if you try this: the plugin writes the docs source, which is what I want in a context window, and Cloudflare's conversion is the rendered page, navigation included. Easy, and a bit messy. I kept both.

![Agent skills as pixel art game cartridges: a robot snaps a glowing cartridge labeled form into its open chest slot while six more cartridges labeled layout, theming, icons, custom, optimize, and migrate wait in a wall rack](/img/fighting-ai-training-bias-skills.png)

Skills were the slow part. A skill is a folder of instructions an agent can load, and I wrote a handful, one per job: laying out a page, building a form, theming, icons, and so on. The [skills overview](/docs/skills/intro) lists them. Knowing every prop is not the same as knowing the house way, and the first versions of the skills proved it. I would generate a site, dislike the result, rewrite the skill, and generate again. That loop helped. Then a session would ignore the skill entirely.

![The component catalog as a pixel art inventory screen: item slots labeled Button, Tooltip, Avatar, and Badge with the Tooltip slot glowing, a robot hand at a crafting bench lowering a half built duplicate tooltip, and a shield stamped with a check marked ci guard at the corner of the grid](/img/fighting-ai-training-bias-catalog.png)

One failure showed up before any of that machinery, and it is the one I would want another maintainer to design against. An agent would hand-roll a tooltip that was already exported, tested, and documented. A wrong prop fails in the type checker. A rebuilt component looks close enough to ship, and then you own it. The custom-component skill now starts from a generated catalog of every documented component, names and one-line purposes. CI fails if an exported component has no API page, which is what that list is built from. A component the catalog can't see is a component the agent will reinvent.

I asked a session that had skipped the skill what it was actually using. It said the types.

![Meeting agents in node_modules, drawn as pixel art: a robot holding a lantern kneels in a dark mine of stacked crates labeled node_modules before three glowing files labeled llms.txt, AGENTS.md, and CLAUDE.md, beside a signpost pointing to a lit doorway labeled bestax.io](/img/fighting-ai-training-bias-node-modules.png)

That was a useful embarrassment. The prop documentation inside the components was thin, so an agent reading TypeScript was reading a weak version of the library. I rewrote the TSDoc. On this project those comments also generate the props tables in the docs, so fixing them fixed two readers at once. If you take one practical thing from this post, take that one. The comments in the published package are a distribution channel. An agent will open `node_modules` and skip your essay. Since 5.8.0 the tarball also ships short pointers at the package root, `llms.txt`, `AGENTS.md`, and `CLAUDE.md`, aimed at the filenames agents look for. The guide's section on [what the npm package carries](/docs/guides/llms#in-the-npm-package) is the exact list. They point back at the site, so the package doesn't grow a stale copy of the docs.

I also taught the scaffolder to offer the skills. `pnpm create bestax@latest` can drop them into the new app's `.claude/skills/` and write a `CLAUDE.md` that records the choices just made: CSS flavor, class prefix, icon library. Almost nobody was scaffolding an app. If you build it, they will come. I didn't believe that, and I seeded the files anyway. When an agent is the one building, starting from those files produces a better site than starting from the types alone.

The MCP server came last. The first version of this post was written before it existed. [`bestax-mcp`](https://www.npmjs.com/package/bestax-mcp) is a [Model Context Protocol](https://modelcontextprotocol.io) server an agent can query for props, examples, and the skills while it builds. The [LLMs guide](/docs/guides/llms#mcp-server) covers it. What I saw from using it was about the same gain I had already gotten from the skills. Better looking pages. Components in the source, where before there had been class strings and one-off markup. Another door into the same information.

## Some of Them Started Naming It

It started to get named. Mostly when the model searched the web, or when I turned effort well up.

The one-shot sites got better in the way I actually care about. They used the components. They looked closer to something I would have built on purpose. Bot traffic on the docs climbed. Some of those requests might be people. I can't cleanly separate the two, and I won't pretend I have a number for it.

Then I asked the recommendation question again, across a few assistants, in September 2026. This is what those chats did. It is not a benchmark, and it will move.

Claude still tends to sit on older data unless I turn effort well up. Even then it often names `react-bulma-components` first, wonders aloud why anyone would take a newer library, and lands on plain Bulma classes as the honest advice. Grok has recommended bestax without that extra push. ChatGPT and Gemini have recommended it too. A Google search for "what's the best Bulma React library" has been surfacing this package.

Read that again before you take it as a win. The unprompted web app is still React, Tailwind, and shadcn/ui. Bulma is still something you have to ask for. And when you do ask, a common answer is still the 2022 package, followed by "have you considered not using a library?"

## I Still Want Bulma on the Menu

I stay because I like Bulma, and the chart is not the reason.

Bulma is the CSS framework I find the most carefully designed. The class names are long, and I know some people bounce off that. I would rather read them in six months than decode a string of utilities. Tailwind is genuinely useful, and to my eye a Tailwind markup line reads like an inline style that exploded into words. Bootstrap is the older relative. Solid conventions, a decade of being the safe answer, less of the thing I like in Bulma. None of that makes the other two bad. It makes them different, which is the whole thing the download chart flattens.

The models treat the chart as a quality ranking. It isn't. It is a history of what got written down the most.

## If You Maintain the Other Package

I hope the labs that train these models do something about that. Training data narrows the menu, the recommendation becomes the next project's training data, and a person who used to compare two or three options now accepts the one answer. That comparison is how a third and a fourth framework stayed alive. If the assistant can only reconstruct what it has seen the most, the web converges on one styling answer and one component answer, and a lot of careful work becomes invisible. Bulma has a decade of real sites behind it and about 279,000 weekly downloads next to Tailwind's 96 million. I don't want that fraction to become a zero because a model never learned the name.

This is my attempt to stay findable. It is unfinished, and there is a long way to go. I may be inconsequential. The package may only come up when someone asks in a particular way, with search turned on, or with effort turned up, or with a skill already on disk. Heck, it's a start.

If you maintain something the models don't know, the quiet is not a verdict on the work. Keep publishing for people. Keep the README honest, keep the docs current, write the post. Then publish the same knowledge in shapes a model can read without a scavenger hunt: the types, a markdown dump of the docs, a skill that encodes the moves you wish it would stop inventing. It does not happen overnight. It does move, slowly, and you can watch it move if you keep asking the same silly question every few weeks and reading the source it writes back.
