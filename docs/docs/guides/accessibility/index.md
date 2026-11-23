---
title: Accessibility Statement
sidebar_label: Accessibility
sidebar_position: 1
description: What Bestax aims for in accessibility, what it covers, how it's checked, what's known to fall short, and how to report a barrier.
---

# Accessibility Statement

Bestax wants its components, and this site, to work for everyone, including people who use a
screen reader, a keyboard, voice control, magnification or a high contrast theme. This page says
what we aim for, what that covers, how we check it, what we know falls short, and how to tell us
about a barrier.

## What We Aim For

Our target is [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA, for the components in
`@allxsmith/bestax-bulma` and for bestax.io. Section 508 and EN 301 549 both build on WCAG, so
meeting it is most of meeting them. The [conformance report](./conformance-report.md) goes
through WCAG, Section 508 and EN 301 549 criterion by criterion.

## What This Covers

- The components in `@allxsmith/bestax-bulma`, rendered the way their API pages document.
- bestax.io: the docs, the blog and the live examples on their pages.

An app built with Bestax isn't covered by this statement. The components give an app accessible
building blocks, with the roles, names, states and keyboard support their API pages describe,
but some things only the app can do:

- **Name every control.** Give each input a label, with a `Field` label or an `aria-label`, and
  each icon-only button a name.
- **Describe images.** Write the `alt` text, or mark an image as decorative.
- **Choose readable colors.** Bulma's stock colors fall short of WCAG's contrast minimum as text
  on white ([#2188](https://github.com/allxsmith/bestax/issues/2188)), so check the pairs you use.
- **Structure the page.** Headings in order, landmarks, a page title and the page's language.
- **Write the content.** Link text that says where it goes, error messages that say how to fix
  the error, captions and transcripts for media.

## Where We Are

Bestax partially meets WCAG 2.2 Level AA: parts of it aren't met yet. The
[conformance report](./conformance-report.md) says which criteria and why, and names the gaps
kept by design. The gaps still to fix are open issues with the
[`accessibility` label](https://github.com/allxsmith/bestax/issues?q=is%3Aissue%20state%3Aopen%20label%3Aaccessibility),
which is the up-to-date list.

Some fixes would change what existing apps rely on, such as what a screen reader calls a
component or which keys move focus. Those wait for the next major version, so they can land
together, and carry the
[`next-major` label](https://github.com/allxsmith/bestax/issues?q=is%3Aissue%20state%3Aopen%20label%3Anext-major%20label%3Aaccessibility).

## How We Check

- **Every story, on every pull request.** Each component's Storybook stories render in Chromium,
  in the light and the dark scheme, and [axe](https://github.com/dequelabs/axe-core) checks them
  against its WCAG A and AA rules. A violation fails the pull request unless the story's
  exemption names the open issue that tracks it, or the reason axe is wrong there.
- **Every page of this site, after each change reaches `main`.** The same check runs on every
  page of the built site in both color modes, including the live examples a page shows (one
  inside a closed tab or a closed `<details>` isn't checked). A site exemption may also name a
  gap the site keeps by design.
- **Unit tests** pin the components' keyboard behavior, ARIA roles and states, and how they draw
  in forced colors (Windows' contrast themes) and with reduced motion.
- **A simulated screen reader** checks what TreeView announces.

What these don't cover yet:

- **Color contrast.** axe's contrast rule is off for the stories until
  [#2188](https://github.com/allxsmith/bestax/issues/2188) is settled, and exempted on this site
  until [#2215](https://github.com/allxsmith/bestax/issues/2215).
- **Real assistive technology.** We haven't recorded the components with NVDA, JAWS, VoiceOver or
  TalkBack, or in a real Windows contrast theme rather than Chromium's emulation of one.
- **Other browsers.** The automated checks run in Chromium only.

Automated checks catch part of what makes a page hard to use, not all of it. A component can
pass every check here and still get in someone's way, and when it does we want to hear about it.

## Tell Us About a Barrier

Open an issue with the
[Accessibility Issue template](https://github.com/allxsmith/bestax/issues/new?template=accessibility-issue.md),
or ask on [Discord](https://discord.gg/zehJrQGtKu). It helps to say:

- the component or the page;
- what you expected, and what happened instead;
- the browser and any assistive technology you use.

An accessibility issue is a bug, and it's worked on like one.

## Technologies

Bestax relies on HTML, WAI-ARIA, CSS and JavaScript (React) to work with your browser and any
assistive technology you use.

## About This Page

This page changes as the library does. Its history is
[on GitHub](https://github.com/allxsmith/bestax/commits/main/docs/docs/guides/accessibility/index.md).
