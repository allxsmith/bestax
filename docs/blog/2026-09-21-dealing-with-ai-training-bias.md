---
slug: dealing-with-ai-training-bias
title: Me Dealing with AI Training Bias
description: "Bulma v1 came out in 2024 and I couldn't find a React package that supported it. I filled that gap, tried to get the package found, and then ran into how coding agents pick libraries."
authors: [asmith]
tags: [ai, bulma, react, opensource]
canonical_url: https://bestax.io/blog/dealing-with-ai-training-bias
publish_to_devto: true
image: /img/fighting-ai-training-bias.png
cover_image: /img/fighting-ai-training-bias.png
---

![Fighting AI Training Bias, drawn as pixel art: a robot coding agent turns away from a toppling stack of identical gray cartridges under a most popular marquee toward a glowing bestax cartridge seated in a retro console whose screen reads llms.txt](/img/fighting-ai-training-bias.svg)

This started for me in 2024, when Bulma v1 came out. I went looking for a React package that supported it. There wasn't one yet. The packages people already knew were still on the older Bulma, and from where I sat they looked dormant. So I decided to fill that gap. I worked on it until I had what I considered a minimum viable product, and then I started trying to get the package recognized and used.

<!-- truncate -->

## What I Tried First

That effort was 2025. I wrote a real README, for npm and for GitHub, and I treated it like the front door. I posted about the package. I posted on Reddit. Between posts I kept enhancing it, small improvements, the kind of work you do when you figure the next person who comes looking should find something obviously worth using. I was pretty sure people would go looking.

They mostly didn't. As I write this in September 2026, the repo has [eleven GitHub stars](https://github.com/allxsmith/bestax).

I also spent a lot of 2025 on being findable in the usual places. SEO, so Google would surface the site. Cloudflare in front of it, so the docs would be fast. A docs site I put a ridiculous number of hours into, then went back and polished again. Blog posts, here and on dev.to and Medium. I'd publish something, check whether anyone had noticed, and wait. Still not much traction. The odd part was how quiet it stayed while I was doing all the things that used to be enough.

## Early 2026

In 2026 I revamped how I was approaching the library. Early in the year I started the major redo of the forms. The big release of that work landed in June, but the redo itself started in those first months.

I kept going, like the tortoise in that race. Slow, and I didn't stop.

That's when I got serious about not being a dumb wrapper. If someone already knows the classes, a thin package doesn't give them a reason to bother, and I was starting to feel that. So I spent those months on the parts a real app needs. The forms redo was the long one. Around it I built things Bulma doesn't ship, a carousel, dialogs, toasts, an avatar, that kind of thing. I was trying to make a full component library, closer to MUI than to a handful of bindings. A lot of nights. I didn't know yet that doing all of that still wouldn't matter to a model.

I wrote a couple more posts. The dev.to and Medium pieces were part of that. I built more of the docs, and then I went back over them and refined them.

## Asking the Models What They'd Use

By summer I had two explanations, and I still go back and forth on them. One is that Bulma is dead. That doesn't feel true, but maybe. The other is that people have moved over to AI, and if that's how they're picking tools now, then the old ways of getting someone to notice a package don't work the way they used to.

I'd been hearing that people aren't really searching Google for this stuff anymore, because they ask an AI. I figure npm search is in the same place. And I don't think people are sitting down to read an article about a library when an AI will just write the integration. I can't prove any of that. It's what it felt like, looking at eleven stars.

So I started testing it. If people are mostly using AI, then maybe the AI is the thing finding libraries, and maybe people aren't trying new ones because the model picks for them. I opened chats and asked what it would use to build a web app, and what it would start a new project with.

It surprised me. React, still, which was good. That's what I built for. Then it steered me toward Tailwind. Then toward shadcn/ui. I'd close the chat, phrase it a different way, and it would steer me there again. MUI and Mantine weren't the default either, which was interesting, because I'd been building toward that kind of library all year.

When I asked for a new Bulma project, it recommended [`react-bulma-components`](https://www.npmjs.com/package/react-bulma-components). That package last published 4.1.0 in February 2022, and it still targets Bulma 0.9. It recommended that over mine, and over newer libraries like [`reactive-bulma`](https://www.npmjs.com/package/reactive-bulma) and [`trunx`](https://www.npmjs.com/package/trunx). Both of those were still publishing releases in September 2026. The models were reaching for the old name.

Then it got weirder, and maybe "weirder" is the wrong word, but it felt weird to me. A lot of the answers said to skip the component library. Use Bulma's classes. Wrappers might be a dead end. Most people have a perfectly fine time writing the classes straight into the markup. And bestax-bulma often wasn't in the answer at all. It didn't seem to know the package existed.

I asked what I could do so it would at least see bestax as a choice. The answer was the unexciting one. Keep doing the things you'd do for people in a world before this. The README, the posts, the docs. I was already doing that. I kept at it.

What I kept hearing, when I asked again, was that training data on the popular stuff is why one-shotting and few-shotting works. The model has seen that library so many times that it already knows what a decent file looks like.

## The Source Code Was the Shock

I tried some prompts of my own. The sites looked sort of okay. Not polished, not really attractive, and I know it can look better than that because I've built the screens. The shock was the source. It was messy. A lot of it was Bulma classes, written out by hand, instead of my components. A tooltip built from scratch. An avatar that was basically a div with a background. I don't think it was rejecting the library. The training data is thin, so it doesn't really know what to use.

There's a stale version of the same problem. A model trained in the spring has never seen a component I shipped in July. And even a model that met bestax once met an older bestax. The package has grown since then.

## A Summer of Trying Things

I asked what I could do to help. It suggested a few things. `llms.txt`, since I already had the docs on Docusaurus. Skills. And an MCP server. So, still in the summer, I started building those. I was tired, and I did it anyway.

![The LLM docs pipeline, drawn as pixel art: a dot matrix printer feeds a long perforated sheet labeled llms-full.txt, a card index box labeled llms.txt sits on the desk beside it, and a docs page marked button stands next to its glowing twin marked button.md](/img/fighting-ai-training-bias-docs.png)

`llms.txt` was the easy one, and I was grateful, because nothing else that year had been easy. I turned on [`docusaurus-plugin-llms`](https://www.npmjs.com/package/docusaurus-plugin-llms). The build writes a short index, the docs as one big file, and a markdown copy of each page, and it does that again on every deploy, so this particular thing can't drift away from me. That was the whole win. It did not make the models know the library.

I also made sure [`robots.txt`](https://bestax.io/robots.txt) was set up. It carries a content signal, `search=yes, ai-input=yes, ai-train=yes`. Search means building an index. ai-input means a model can use the page when it's answering. ai-train means training. Some people would turn the training one off. I want this library in the next round of training data, so I left all three on.

Then I turned on Cloudflare's [Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/). The switch is under AI Crawl Control. When a client sends `Accept: text/markdown`, Cloudflare converts the HTML and answers with `content-type: text/markdown`. Their writeup says agents like Claude Code already send that header. I checked this site, and the LLMs guide does come back as markdown. The plugin's files are the clean docs, which is what I want sitting in a context window. Cloudflare's conversion is the rendered page, nav and everything. A little messy. I kept both, because different agents show up in different ways.

![Agent skills as pixel art game cartridges: a robot snaps a glowing cartridge labeled form into its open chest slot while six more cartridges labeled layout, theming, icons, custom, optimize, and migrate wait in a wall rack](/img/fighting-ai-training-bias-skills.png)

Skills were harder, and they stung more, because I could watch them almost work. I wrote them, generated a site, and the result was still wrong. So I did that again, and again, rewriting the skill each time. A skill is just a folder of instructions an agent can load. I ended up with a [handful](/docs/skills/intro), layout, forms, theming, icons, and a few others. Knowing the props is not the same as knowing how you actually want a page built. The early ones taught me that by failing. The loop did help. It just never helped all the way.

![The component catalog as a pixel art inventory screen: item slots labeled Button, Tooltip, Avatar, and Badge with the Tooltip slot glowing, a robot hand at a crafting bench lowering a half built duplicate tooltip, and a shield stamped with a check marked ci guard at the corner of the grid](/img/fighting-ai-training-bias-catalog.png)

One thing I watched more than once was an agent happily building its own tooltip while mine was already there, shipped and documented. That one hurt. A wrong prop at least shows up in the type checker. A homemade component kind of works, and then you own it. I started putting a generated list of every component at the front of one of the skills, just the name and a line about what it's for. CI fails now if something ships without a docs page, because that's what the list is built from. I learned the hard way that if the agent can't see it, the agent will rebuild it.

Even with the skills, it didn't always use them. I'd ask it to build something and it would just go off on its own. I asked what it was actually using. It said the types.

![Meeting agents in node_modules, drawn as pixel art: a robot holding a lantern kneels in a dark mine of stacked crates labeled node_modules before three glowing files labeled llms.txt, AGENTS.md, and CLAUDE.md, beside a signpost pointing to a lit doorway labeled bestax.io](/img/fighting-ai-training-bias-node-modules.png)

That sent me back into the code, which was a humbling place to end up after all the docs work. The comments on the types weren't very good, so an agent reading TypeScript was reading a weak version of the library. I rewrote them. On this project those comments also generate the props tables, so fixing them fixed both, and I wish I had noticed sooner. If you maintain a package, this is the part that got me. The comments ship inside `node_modules`. An agent will open that and never read your post.

Since 5.8.0 the published tarball also has `llms.txt`, `AGENTS.md`, and `CLAUDE.md` sitting at the root. They're short pointers back to the site, named that way because that's what a lot of the tools look for by filename. The guide's section on [what the npm package carries](/docs/guides/llms#in-the-npm-package) is the list. I didn't want a second copy of the docs in the tarball, going stale between releases.

I put the skills in the scaffolder too, and a `CLAUDE.md` that remembers the choices someone just made. CSS flavor, class prefix, icon library. Almost nobody was starting a new app with it. I did the work anyway. Field of Dreams, a little. If you build it, they will come. When an agent is the one building, those files do seem to help. When a person is, I still don't know. There haven't been many people.

The [MCP server](https://www.npmjs.com/package/bestax-mcp) came later in the summer. Same hope, another way for an agent to ask instead of guess. What I got was about the same as the skills. Not a breakthrough. Better looking sites, and the source finally using my components instead of a pile of custom markup. I was glad, and I was also tired.

## Some of Them Started Recommending It

I kept asking. Silly prompts, the kind where you just want to see which name comes back. Eventually it started to change. It would recommend mine in some cases, mostly when the effort was high or higher, and when it searched the web.

My Cloudflare numbers started going up around then. AI bots, and some of it might be people. Hard to tell which is which. The one-shot web apps started to look better, and the agent started using my components instead of making its own.

I asked again later, plain questions this time. It does recommend bestax now, when the question is about Bulma. But sometimes, and really most of the time, it still questions why someone would use mine. It recommends react-bulma-components, and then the honest recommendation is to use the plain CSS classes.

With Claude, I have to turn the effort up to extra before it recommends bestax. Unless I do that, it feels like the model is sitting on older data. Grok has recommended the package without me turning anything up. ChatGPT and Gemini have recommended it too. And Google, for the search "what's the best Bulma React library", has been recommending mine.

This is just what I was seeing in the chats I ran in September 2026. Ask for a web app with no other hint and it's still React, Tailwind, and shadcn/ui. Bulma only comes up when you ask for Bulma. And even then, a common answer is the 2022 package, followed by "you might be happier with the classes."

I hope the steady work wasn't wasted. It's still slow, and most days it feels slow. Training bias is real. Ask for a web app and you still get anything but Bulma, unless you force the question. There's a ton of stuff built on Bulma. It's still a tiny fraction of Tailwind, Bootstrap, and Foundation. I feel that every time I open a new chat.

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

This is me trying anyway. I'm still building, and I'm still hoping a model can name more than the one popular answer. It's a work in progress. There's a long, long way to go. If you're maintaining a package the models don't know, I hope you keep going too. The quiet is awful. Don't take it as a verdict. It doesn't happen overnight. If you keep at it, you will see it move. Slowly. Some days that is a very small comfort.

I might be inconsequential. The model might only recommend my package to the few people who ask in a particular way. Heck, it's a start.
