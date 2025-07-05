---
slug: changeset-action
title: Changeset Action
authors: [asmith]
tags: [github, actions, lib, changeset, publish]
---

As the second phase of versioning. We integrated changesets into the CI/CD.

<!-- truncate -->

In our github CI workflow, we changed the publish task to use the changeset action
to automatically version and publish.

Also, we configured **GPG** signed commits for the github bot.
