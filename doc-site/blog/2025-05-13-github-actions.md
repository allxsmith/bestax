---
slug: github-actions
title: Github Actions Integrated
authors: [asmith]
tags: [github, actions, pages]
---

If you are seeing this on **bestax.us**, that means our docusaurus site has successfully deployed on github pages with a github action workflow.

<!-- truncate -->

We have two github actions configured, a test-deploy and deploy.

- **test-deploy**: is run whenever a pull request is made on _main_. This action ensures the site can build successfully.

- **deploy**: is run whenever a pull request is merged into main, or when someone successfully pushes to main directly.

Yay CI/CD!
