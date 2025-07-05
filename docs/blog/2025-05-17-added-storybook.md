---
slug: storybook-added-to-lib-project
title: Storybook Added to the Lib project
authors: [asmith]
tags: [github, actions, lib, storybook]
---

Storybook has been added to the Component Library project. Starting from now, all components should have a corresponding story. Starting with the Button.

<!-- truncate -->

We also added a perfom **all** kind of script to the parent package.

```bash
npm run all
```

This **all** command is an alias for all the CI/CD commands, all in one.

```bash
turbo run build typecheck test test:coverage bundle:stats lint format:check && turbo run build-storybook --filter=@allxsmith/bestax-lib
```

We also added the building of the storybook to our CI/CD. The artifacts are saved each build.
