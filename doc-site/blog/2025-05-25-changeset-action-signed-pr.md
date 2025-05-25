---
slug: changeset-action-signed-pr
title: Changeset Action Signed Pull Request
authors: [asmith]
tags: [github, actions, lib, changeset, publish, version, signed, gpg]
---

After much suffering, GPG signing on the PRs is finally working.

<!-- truncate -->

Turns out changeset/action@v1 recently added this feature. Signed commits. To enable it, we enabled an option:

commitMode: 'github-api'
