---
slug: changesets-added
title: Changesets Added
authors: [asmith]
tags: [github, actions, lib, changesets, publish]
---

We've added [Changeset](https://github.com/changesets/changesets) to our project to help with versioning.

So far, it's super basic, but we plan on building on it. We're super excited!

<!-- truncate -->

The project is configured with the new **changeset** package.

Npm scripts have been added:

- npm run changeset
- npm run version
- npm run publish

Our current CI/CD logic hasn't changed, but it will in the near future. A build still occurs, and it still attempts to publish.

The key difference with **changeset** is: the publish command now checks to see if the version number is not already published, and it doesn't fail if the version number has already been published.

Our next steps are to integrate the [changeset action](https://github.com/changesets/action) into our CI/CD.
