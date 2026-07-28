---
title: 'Bulma: The 3rd Most Used CSS Framework'
description: 'Bulma is the third most used CSS framework, behind Tailwind and Bootstrap. Here is why third place is the interesting place to be, and how to scaffold a React + Bulma site in one command with create-bestax.'
sidebar_label: 'Bulma: The 3rd Most Used CSS Framework'
tags: [bulma, css, react, create-bestax, opensource]
authors: [asmith]
hide_table_of_contents: false
# dev.to specific
publish_to_devto: false
published: false
canonical_url: https://bestax.io/blog/2026/07/28/bulma-3rd-most-used-css-framework
---

Tailwind is first. Bootstrap is second. Bulma is third.

That's the whole leaderboard, and it has been remarkably stable for years. Every survey, every npm download chart, every "what CSS framework should I use in 2026" thread lands in the same order.

So let's talk about third place — because third place is the interesting place to be.

**Congrats on being different.** Now here's what to do.

<!-- truncate -->

## Third Place Is Not Second Loser

There's a certain kind of developer who reads "third most used" and hears "the one that lost." I'd like to gently push back on that.

First place in a popularity contest tells you almost nothing about fit. It tells you about momentum, marketing budget, and the gravitational pull of defaults. Tailwind is genuinely excellent and deserves its adoption. Bootstrap earned its position over a decade of being the safe answer. Neither of those facts makes them the right answer for _your_ project.

Here's what third place actually means for Bulma:

- **Big enough to be safe.** Millions of downloads, a decade of production use, active v1 development. This isn't a weekend project you're betting your app on.
- **Small enough to still have a point of view.** Bulma didn't chase the utility-first trend. It didn't bolt on a JavaScript runtime. It stayed a CSS framework.
- **Boring in the good way.** No build step required. No config file with 400 lines. No plugin ecosystem you have to keep in sync.

Bulma is what you pick when you want your HTML to be readable six months from now.

## What Bulma Actually Gives You

Bulma v1 (2024) was not a maintenance release. It was a rebuild of the foundations:

- **CSS variables throughout** — theming without a Sass pipeline
- **HSL-based color system** — derive an entire palette from a few values
- **CSS Grid support** — modern layouts, not just flexbox columns
- **Native dark mode** — first-class, not an afterthought
- **Skeleton loaders** — built into the components you already use
- **Prefixed distribution** — run Bulma next to another framework without class collisions

And the thing that hasn't changed since 2016: `class="button is-primary is-large"` means exactly what it looks like it means. You can read a Bulma template out loud. Try that with a wall of utility classes.

:::note Pure CSS, no JavaScript

Bulma ships zero JavaScript. That's a feature. It means the framework never fights your React state, never needs a wrapper to initialize, and never breaks when your bundler changes. You bring the behavior; Bulma brings the styles.

:::

## Now: Scaffold a Site

Enough theory. Let's build something. One command:

```bash
npm create bestax@latest my-app
```

Answer four short questions and you have a working React + Bulma application. Then:

```bash
cd my-app
npm install
npm run dev
```

That's a running dev server with hot reload, Bulma v1 wired up, and the [@allxsmith/bestax-bulma](https://bestax.io) component library ready to import.

### The Prompts

**1. Project name** — validated to be npm-compatible.

```
? Project name: my-app
```

**2. Framework** — JavaScript or TypeScript, both on Vite.

```
? Select a framework:
  ❯ Vite
    Vite + TypeScript
```

**3. Bulma flavor** — this is the part nobody else automates.

```
? Which Bulma CSS flavor would you like to use?
  ❯ Complete (Recommended) - Full Bulma CSS with all components and helpers
    Prefixed - All classes prefixed with "bulma-" to avoid conflicts
    No Helpers - Core components only, no utility classes
    No Helpers, Prefixed - Core components only with "bulma-" prefix
    No Dark Mode - Light mode only, smaller bundle size
```

Bulma v1 publishes several CSS distributions. Figuring out which one you want — and how to import it correctly — is exactly the kind of yak-shave that kills a Saturday. create-bestax picks the file, wires the import, and moves on.

**4. Icon library** — installed and configured, not just mentioned in a README.

```
? Would you like to add an icon library?
  ❯ None (I'll add icons later)
    Font Awesome
    Material Design Icons
    Ionicons
    Google Material Icons
    Material Symbols
```

### Skip the Prompts

Every answer has a flag:

```bash
# All defaults, zero questions
npm create bestax@latest my-app -y

# TypeScript + Font Awesome
npm create bestax@latest my-app -t vite-ts -i fontawesome

# Prefixed Bulma (running alongside another framework) + Material Design Icons
npm create bestax@latest my-app -b prefixed -i mdi

# Everything specified
npm create bestax@latest my-app -t vite-ts -b complete -i fontawesome
```

| Flag             | Values                                                                         |
| ---------------- | ------------------------------------------------------------------------------ |
| `-t, --template` | `vite`, `vite-ts`                                                              |
| `-b, --bulma`    | `complete`, `prefixed`, `no-helpers`, `no-helpers-prefixed`, `no-dark-mode`    |
| `-i, --icon`     | `none`, `fontawesome`, `mdi`, `ionicons`, `material-icons`, `material-symbols` |
| `-y, --yes`      | skip all prompts                                                               |

### What You End Up With

A working project, not a starting point you still have to finish: React on Vite, Bulma v1 in the flavor you picked, the `@allxsmith/bestax-bulma` component library installed, your icon library wired up, sample components to crib from, and build scripts that already work. TypeScript if you asked for it. Zero configuration either way.

Every component is typed, supports Bulma's helper props, and is documented with examples at [bestax.io/docs/api](https://bestax.io/docs/api).

## Thank You

Seriously — thank you.

If you're reading a post about the _third_ most popular CSS framework, you are already the kind of developer who evaluates tools instead of inheriting them. And if you use Bulma, or bestax-bulma, or create-bestax, you're using software that someone wrote and gave away.

That's true of most of your stack. The framework, the bundler, the test runner, the linter, the type checker, the package manager — free, maintained by people who mostly aren't paid for it, and used by companies that will never send them a dollar.

Open source works because people keep showing up. You showing up — filing the issue, reading the docs, choosing the smaller option — is what keeps the ecosystem from collapsing into three vendors and a pricing page.

So: thank you for supporting open source software. It's not a throwaway line. It's the actual business model.

## Stars Cost Nothing. They're Worth a Lot.

Here's the most concrete thing you can do in the next ten seconds.

**Star the projects you actually use.** A GitHub star costs you nothing — no money, no email, no signup, no ongoing commitment. But for a legitimate open source project, stars are load-bearing:

- **Discovery.** GitHub search, trending pages, and "most starred" lists are ranked by stars. So are a lot of the "best X library" blog posts that developers actually read.
- **Trust.** Star count is the first thing an engineer checks before adopting a dependency, and the first thing they show their team lead when justifying it.
- **Training data and recommendations.** Popularity signals feed the tools that now answer "which library should I use?" for millions of developers.
- **Momentum.** Stars bring contributors, contributors bring features, features bring users. It compounds.

The important qualifier: **when legitimate projects receive them.** Bought stars, star-for-star rings, and engagement farms poison the signal for everyone — they're why the metric gets dismissed. The fix isn't to abandon stars; it's for real users to star real projects they've genuinely used. That's what makes the number mean something again.

:::tip Ten seconds, no cost, real impact

If Bulma, bestax-bulma, or create-bestax has saved you time:

⭐ **[github.com/allxsmith/bestax](https://github.com/allxsmith/bestax)**
⭐ **[github.com/jgthms/bulma](https://github.com/jgthms/bulma)**

And then go star the other five dependencies in your `package.json` that you've never thanked anyone for.

:::

I maintain this ecosystem — the component library, the CLI, the docs, the examples, the AI skills — largely on stars and Diet Coke. The Diet Coke I can buy myself.

## Diversity Is the Thing AI Is Quietly Eating

Now the part I actually want to talk about.

AI coding assistants are extraordinary. I use them daily; this project ships Agent Skills specifically so they can use bestax-bulma well. This is not an anti-AI post.

But there's a feedback loop forming, and it's worth naming.

An AI assistant recommends what's most represented in its training data. What's most represented is what's most popular. What gets recommended becomes more popular. Which means it's more represented next time. **Popularity now compounds automatically, without a human ever comparing two options.**

Before AI assistants, a developer picking a CSS framework read a few blog posts, skimmed three docs sites, and made a call. Some of them picked the third option because it fit better. That's how alternatives survived: a steady trickle of people actually evaluating.

Now the default path is "ask the assistant," and the assistant — reasonably, statistically — says the most popular thing. Multiply that by millions of scaffolded projects and the long tail stops getting watered. Not because it's worse. Because nobody's asking anymore.

The endpoint of that loop is a monoculture: one framework per category, permanently, because the recommendation engine can't recommend what nobody's writing about, and nobody writes about what nobody uses.

That's bad even if you like the winner:

- **Monocultures don't innovate.** Bulma didn't get CSS Grid support and HSL theming because it was winning. It got them because it had to stay worth choosing.
- **Monocultures are fragile.** One license change, one acquisition, one abandoned repo, and an entire category of the web has no plan B.
- **Monocultures set the price.** "Free and open" holds as long as there's somewhere else to go.

### What Actually Helps

None of this is fixed by complaining about AI. It's fixed by feeding the signal:

1. **Write about the tools you use.** A blog post, a Stack Overflow answer, a README, a comment in a thread. Text is the substrate now. If your framework isn't written about, it doesn't exist to the next model.
2. **Star and link.** Both are signals. Both are free. Both take seconds.
3. **Evaluate at least once.** Before you accept a scaffold recommendation, spend five minutes on the second and third options. You'll sometimes change your mind — and even when you don't, you've made a real choice instead of an inherited one.
4. **Teach your assistant.** Point it at real docs. This is why bestax publishes an [LLM index](https://bestax.io/docs/guides/llms) and ships Agent Skills: an assistant that has read the docs will happily use Bulma. The gap is availability, not capability.
5. **Contribute upstream.** Issues, docs fixes, examples. Every one of them is a durable artifact that outlives the conversation.

Third place stays on the board because people keep choosing it on purpose. That's the whole mechanism. It doesn't survive on merit alone.

## Get Started

```bash
npm create bestax@latest my-app
cd my-app
npm install
npm run dev
```

- **Docs**: [bestax.io](https://bestax.io)
- **Components**: [bestax.io/docs/api](https://bestax.io/docs/api)
- **Getting started**: [bestax.io/docs/guides/getting-started](https://bestax.io/docs/guides/getting-started)
- **For AI agents**: [bestax.io/docs/guides/llms](https://bestax.io/docs/guides/llms)
- **npm**: [create-bestax](https://www.npmjs.com/package/create-bestax) · [@allxsmith/bestax-bulma](https://www.npmjs.com/package/@allxsmith/bestax-bulma)
- **Star it**: [github.com/allxsmith/bestax](https://github.com/allxsmith/bestax)

---

**Questions?** [Open an issue](https://github.com/allxsmith/bestax/issues) or [start a discussion](https://github.com/allxsmith/bestax/discussions).

**Want to contribute?** PRs welcome — see the [contributing guide](https://github.com/allxsmith/bestax/blob/main/CONTRIBUTING.md).

Congrats on being different. Now go build something.
