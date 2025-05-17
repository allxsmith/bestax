---
slug: configure-component-library
title: Configuring the Component Library
authors: [asmith]
tags: [github, actions, lib, turbo, typescript, rollup]
---

We've started configuring the component library & the toolchain. It's a fresh start, trying some new things.

<!-- truncate -->

To speed up builds, and help manage our mono repository, we're trying [Turbo](https://vercel.com/solutions/turborepo) out.

I'm a longtime Babel/Webpack user, but this go around I'm using [Rollup](https://rollupjs.org/) to bundle the new module.

We've tested a basic the build of a basic Button component and a corresponding unit test to make sure the library is building correctly.

Lastly, this project is going to use Typescript instead of plain'ole Javascript. This is not us choosing sides between Javascript and Typescript.  We are doing this to be different from our past projects. The code will be new and fresh.

I can't promise we'll stick with this new configuration. We will be improving and enhancing it as we "get this show on the road"!
