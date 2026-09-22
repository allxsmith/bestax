---
slug: fighting-ai-training-bias
title: Fighting AI Training Bias
description: "I built a full React component library for Bulma and did the usual things to get people to find it. Then I noticed coding agents were the ones picking libraries. This is how that's gone."
authors: [asmith]
tags: [ai, bulma, react, opensource]
canonical_url: https://bestax.io/blog/fighting-ai-training-bias
publish_to_devto: true
image: /img/fighting-ai-training-bias.png
cover_image: /img/fighting-ai-training-bias.png
---

![Fighting AI Training Bias, drawn as pixel art: a robot coding agent turns away from a toppling stack of identical gray cartridges under a most popular marquee toward a glowing bestax cartridge seated in a retro console whose screen reads llms.txt](/img/fighting-ai-training-bias.svg)

I decided to build a React component library for Bulma. A full one. [`@allxsmith/bestax-bulma`](https://www.npmjs.com/package/@allxsmith/bestax-bulma) is that library. I didn't want another thin wrapper, the kind of package that hangs a React prop off a Bulma class and stops there. I wanted something you could actually build an app with, on Bulma v1.

Updated September 2026. I rewrote this post. The first version was a tour of the tools. This one is what I was doing, and why.

<!-- truncate -->

## What I Tried First

I did the things that are supposed to get a package used. I wrote a real README, for npm and for GitHub. I posted about it. I posted on Reddit. I kept adding to it, and I kept thinking people would go looking once it was obviously worth finding.

They mostly didn't. On September 21, 2026 the repo had [eleven GitHub stars](https://github.com/allxsmith/bestax).

I had two explanations, and I still go back and forth on them. One is that Bulma is dead. That doesn't feel true, but maybe. The other is that people have moved over to AI, and if that's how they're picking tools now, then the old ways of getting someone to notice a package don't work the way they used to.

Before I landed on that, I'd already spent a lot of time on the old ways. SEO, so Google would find the site. Cloudflare in front of it, so the docs would be fast. A docs site I put a ridiculous number of hours into. Blog posts, here and on dev.to and Medium. Still not much traction.

I'd been hearing that people aren't really searching Google for this stuff anymore, because they ask an AI. I figure npm search is in the same place. And I don't think people are sitting down to read an article about a library when an AI will just write the integration. I can't prove any of that. It's what it felt like, looking at eleven stars.

## Asking the Models What They'd Use

So I started testing it. If people are mostly using AI, then maybe the AI is the thing finding libraries, and maybe people aren't trying new ones because the model picks for them. I opened chats and asked what it would use to build a web app, and what it would start a new project with.

It surprised me. React, still, which was good. That's what I built for. Then it steered me toward Tailwind. Then toward shadcn/ui. I'd close the chat, phrase it a different way, and it would steer me there again.

When I asked for a new Bulma project, it recommended [`react-bulma-components`](https://www.npmjs.com/package/react-bulma-components). That package last published 4.1.0 in February 2022, and it still targets Bulma 0.9. It recommended that over mine, and over newer libraries like [`reactive-bulma`](https://www.npmjs.com/package/reactive-bulma) and [`trunx`](https://www.npmjs.com/package/trunx). Both of those were still publishing releases in September 2026. The models were reaching for the old name.

Then it got weirder, and maybe "weirder" is the wrong word, but it felt weird to me. A lot of the answers said to skip the component library. Use Bulma's classes. Wrappers might be a dead end. Most people have a perfectly fine time writing the classes straight into the markup. And bestax-bulma often wasn't in the answer at all. It didn't seem to know the package existed.

I asked what I could do so it would at least see bestax as a choice. The answer was the unexciting one. Keep doing the things you'd do for people in a world before this. The README, the posts, the docs. So I did.

## Keeping On With the Library

I kept going, like the tortoise in that race. Slow, and I didn't stop.

Along the way I got serious about not being a dumb wrapper. If the model already knows the classes, a thin binding doesn't give it a reason to import anything. So I built the parts I actually wanted in an app. Real form controls. A carousel, dialogs, toasts, a sidebar, a switch, a slider, autocomplete, a tag input, a rating. An avatar and a badge came later. The [Bulma v1 guide](/docs/guides/features/bulma-v1) has the list, if you want to look. I was trying to make bestax a full component library, more like MUI. And MUI, for what it's worth, is still not what these models normally pick. Mantine neither. Ask for a web app and you get Tailwind and shadcn/ui.

I wrote a couple more posts. The dev.to and Medium pieces were part of that. I built more of the docs, and then I went back over them and refined them. Then I asked the models again.

What I kept hearing was that training data on the popular stuff is why one-shotting and few-shotting works. The model has seen that library so many times that it already knows what a decent file looks like.

## The Source Code Was the Shock

I tried some prompts of my own. The sites looked sort of okay. Not polished, not really attractive, and I know it can look better than that because I've built the screens. The shock was the source. It was messy. A lot of it was Bulma classes, written out by hand, instead of my components. A tooltip built from scratch. An avatar that was basically a div with a background. I don't think it was rejecting the library. The training data is thin, so it doesn't really know what to use.

There's a stale version of the same problem. A model trained in the spring has never seen a component I shipped in July. And even a model that met bestax once met an older bestax. The package has grown since then.

## llms.txt, Skills, and an MCP Server

I asked what I could do to help. It suggested a few things. `llms.txt`, since I already had the docs on Docusaurus. Skills. And an MCP server. So I started building those.

![The LLM docs pipeline, drawn as pixel art: a dot matrix printer feeds a long perforated sheet labeled llms-full.txt, a card index box labeled llms.txt sits on the desk beside it, and a docs page marked button stands next to its glowing twin marked button.md](/img/fighting-ai-training-bias-docs.png)

`llms.txt` turned out to be the simple one. I enabled [`docusaurus-plugin-llms`](https://www.npmjs.com/package/docusaurus-plugin-llms). Every build writes three things. [`llms.txt`](https://bestax.io/llms.txt) is a short index of the docs. [`llms-full.txt`](https://bestax.io/llms-full.txt) is the whole documentation in one file. And every docs page has a markdown twin, so a URL like [bestax.io/docs/api/elements/button.md](https://bestax.io/docs/api/elements/button.md) is just that one component. They get regenerated when the site deploys, so they don't drift off from what's actually published. The [LLMs guide](/docs/guides/llms) is where I wrote this down properly.

I also made sure [`robots.txt`](https://bestax.io/robots.txt) was set up. It carries a content signal, `search=yes, ai-input=yes, ai-train=yes`. Search means building an index. ai-input means a model can use the page when it's answering. ai-train means training. Some people would turn the training one off. I want this library in the next round of training data, so I left all three on.

Then I turned on Cloudflare's [Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/). The switch is under AI Crawl Control. When a client sends `Accept: text/markdown`, Cloudflare converts the HTML and answers with `content-type: text/markdown`. Their writeup says agents like Claude Code already send that header. I checked this site, and the LLMs guide does come back as markdown. The plugin's files are the clean docs, which is what I want sitting in a context window. Cloudflare's conversion is the rendered page, nav and everything. A little messy. I kept both, because different agents show up in different ways.

![Agent skills as pixel art game cartridges: a robot snaps a glowing cartridge labeled form into its open chest slot while six more cartridges labeled layout, theming, icons, custom, optimize, and migrate wait in a wall rack](/img/fighting-ai-training-bias-skills.png)

Skills were harder. I started writing them, and the output still wasn't great. So I kept building sites with an agent, looking at what came out, and rewriting the skill. That did help. A skill is a folder of instructions the agent can load, and I ended up with a handful, one per job. Layout, forms, theming, icons, and a few others. The [skills overview](/docs/skills/intro) lists them. Knowing the props and knowing how I actually want a page built are different, and the early skills made that obvious.

![The component catalog as a pixel art inventory screen: item slots labeled Button, Tooltip, Avatar, and Badge with the Tooltip slot glowing, a robot hand at a crafting bench lowering a half built duplicate tooltip, and a shield stamped with a check marked ci guard at the corner of the grid](/img/fighting-ai-training-bias-catalog.png)

One thing I watched happen, more than once, was an agent lovingly building its own tooltip while [Tooltip](/docs/api/components/tooltip) was already there. Shipped, tested, documented. A wrong prop fails in the type checker, so you see it. A handmade component kind of works, and then you own it forever. The custom-component skill now starts from a generated catalog of every documented component, names and a one-line description, so it has a chance to use the one that exists. CI fails if an exported component has no API page, and that list is built from those pages. If the catalog can't see it, the agent is going to rebuild it.

Even with the skills, it didn't always use them. I'd ask it to build something and it would just go off on its own. I asked what it was actually using. It said the types.

![Meeting agents in node_modules, drawn as pixel art: a robot holding a lantern kneels in a dark mine of stacked crates labeled node_modules before three glowing files labeled llms.txt, AGENTS.md, and CLAUDE.md, beside a signpost pointing to a lit doorway labeled bestax.io](/img/fighting-ai-training-bias-node-modules.png)

That sent me back into the code. The docs on the types weren't very good, so an agent reading TypeScript was reading a weak version of the library. I revised the TSDoc. On this project those comments are also what generates the props tables in the docs, so fixing them fixed both. This is the part I'd tell another package author to look at. The comments ship in the package. An agent will open `node_modules` and never read your post.

Since 5.8.0 the published tarball also has `llms.txt`, `AGENTS.md`, and `CLAUDE.md` sitting at the root. They're short pointers back to the site, named that way because that's what a lot of the tools look for by filename. The guide's section on [what the npm package carries](/docs/guides/llms#in-the-npm-package) is the list. I didn't want a second copy of the docs in the tarball, going stale between releases.

I added the skills to the scaffolder too. `pnpm create bestax@latest` can drop them into the new app's `.claude/skills/`, and it writes a `CLAUDE.md` that records the choices you just made. CSS flavor, class prefix, icon library. I figured if anyone uses the scaffolder, which probably isn't many people, at least a new project starts with the skills already there. Field of Dreams, a little. If you build it, they will come. And it does seem to help when the one building the site is an agent.

The MCP server came after the first version of this post. [`bestax-mcp`](https://www.npmjs.com/package/bestax-mcp) is a [Model Context Protocol](https://modelcontextprotocol.io) server, so an agent can ask for props, examples, and the skills while it builds. The [LLMs guide](/docs/guides/llms#mcp-server) covers how it works. What I saw from using it was about the same as the skills. Equally good. Better looking sites, and the source using the components instead of a pile of custom markup.

## Some of Them Started Recommending It

I kept asking. Silly prompts, the kind where you just want to see which name comes back. Eventually it started to change. It would recommend mine in some cases, mostly when the effort was high or higher, and when it searched the web.

My Cloudflare numbers started going up around then. AI bots, and some of it might be people. Hard to tell which is which. The one-shot web apps started to look better, and the agent started using my components instead of making its own.

I asked again later, plain questions this time. It does recommend bestax now, when the question is about Bulma. But sometimes, and really most of the time, it still questions why someone would use mine. It recommends react-bulma-components, and then the honest recommendation is to use the plain CSS classes.

With Claude, I have to turn the effort up to extra before it recommends bestax. Unless I do that, it feels like the model is sitting on older data. Grok has recommended the package without me turning anything up. ChatGPT and Gemini have recommended it too. And Google, for the search "what's the best Bulma React library", has been recommending mine.

This is just what I was seeing in the chats I ran in September 2026. Ask for a web app with no other hint and it's still React, Tailwind, and shadcn/ui. Bulma only comes up when you ask for Bulma. And even then, a common answer is the 2022 package, followed by "you might be happier with the classes."

I hope the steady work makes the library more appealing to the models and to actual people. It's still slow. Training bias is real, and the models still recommend something other than Bulma almost every time you don't force the question. I hope that sticking with the Bulma ecosystem gives them something to find later. There's a ton of stuff built on Bulma. It's still a tiny fraction of Tailwind, Bootstrap, and Foundation.

I pulled the numbers so this wasn't only a feeling. Weekly downloads are npm's public counts for the week of September 14 to 20, 2026. Stars are GitHub's counts on September 21.

| Framework                                                    | Weekly downloads  | GitHub stars  |
| ------------------------------------------------------------ | ----------------- | ------------- |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss)  | about 96 million  | about 98,000  |
| [Bootstrap](https://github.com/twbs/bootstrap)               | about 5.1 million | about 175,000 |
| [Bulma](https://github.com/jgthms/bulma)                     | about 279,000     | about 50,000  |
| [Foundation](https://github.com/foundation/foundation-sites) | about 87,000      | about 30,000  |

Tailwind did about 96 million downloads that week. Bootstrap about 5.1 million. Bulma about 279,000. Foundation about 87,000. So Tailwind was somewhere around 340 times Bulma, and Bootstrap around 18 times. Stars are a different pile, because they add up over years. Bootstrap has about 175,000, Tailwind about 98,000, Bulma about 50,000, Foundation about 30,000. Foundation's last release on npm was September 2024. Bulma on npm is still 1.0.4, from April 2025, but the [repository](https://github.com/jgthms/bulma) took fixes on September 21, 2026. I don't think Bulma is dead. It's small, and that size is what I keep running into.

## Why I'm Still on Bulma

I really do think Bulma is the most eloquently designed of these. I know some people will bounce off that word. Tailwind is useful, genuinely. To me it looks like an inline style that exploded into word spaghetti. Bootstrap is closer to Bulma. Older, and the conventions aren't bad, they just don't feel as considered. Bulma is wordy. I know some people don't like that. I still think it's the one I'd rather come back to in six months and be able to read.

When a model talks about those numbers, it treats them like one framework is better than the others. I don't buy that. The numbers are mostly a record of what people have written down the most.

## Don't Get Discouraged

I hope the labs training these models do something about how one-note the training data is, and the bias that comes out of it. Otherwise I think the internet, and a lot of what we know how to build, converges on a single kind of answer. One CSS approach, one component library, and the rest fade out. Diversity dies. I don't want that, and I don't think it has to go that way, but it will if the training data stays this lopsided and nobody pushes the other direction.

This is my attempt to push. I'm trying to get the library adopted, and I'm trying to give Bulma a better shot at being one of the things a model can name. It's a work in progress. There's a long, long way to go. I'm going to keep trying, and if you're maintaining a package the models don't know, I hope you do too. Don't get discouraged. It doesn't happen overnight. If you keep at it, you will see it move. Slowly.

I might be inconsequential. The model might only recommend my package to the few people who ask in a particular way. Heck, it's a start.
