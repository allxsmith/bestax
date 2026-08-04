---
slug: v5-one-css-story
title: 'bestax-bulma v5.0.0: One CSS, Any Prefix'
description: 'bestax-bulma v5.0.0 shipped one breaking change, and it was a deletion. One prefix scheme, a runtime classPrefix, and everything that landed from 5.1 to 5.8.'
authors: [asmith]
tags: [release, v5, css, theme]
canonical_url: https://bestax.io/blog/v5-one-css-story
publish_to_devto: true
image: /img/v5-one-css-story.png
cover_image: /img/v5-one-css-story.png
---

![One CSS, Any Prefix, drawn as pixel art: a glowing bestax cartridge wired to three identical buttons captioned .button, .bestax-button, and .acme-button, while a faded bulma- cartridge crumbles into loose pixels at the edge of the frame](/img/v5-one-css-story.svg)

In June, bestax-bulma v5.0.0 shipped exactly one breaking change, and it was a deletion: 3 files touched, 22 lines removed, 0 lines added. The second prefixed stylesheet is gone, and what's left is one CSS story with any prefix you want. If you never imported `versions/bestax-bulma-prefixed.css`, you won't feel a thing.

<!-- truncate -->

Same housekeeping as [the v4 post](/blog/the-floor-is-react-18): this is a recap, not breaking news. [v5.0.0](https://github.com/allxsmith/bestax/blob/main/bulma-ui/CHANGELOG.md) was tagged on June 26, 2026, six days after v4.0.0, and this is the fifth post in the [catch-up series](https://github.com/allxsmith/bestax/issues/384). It's also the one that reaches the present: the library sits at 5.8.0 today, so after the breaking change we'll sweep through everything 5.1 to 5.8 shipped along the way.

## The Breaking Change

4.x shipped **two** prefixed CSS bundles. `versions/bestax-prefixed.css` prefixed every class with `bestax-`, and `versions/bestax-bulma-prefixed.css` prefixed every class with `bulma-`. Two bundles with identical contents except for the string glued onto every class name. 5.0.0 deletes the `bulma-` one.

The [whole change](https://github.com/allxsmith/bestax/commit/94baa3489ac54587e6026a8bece9f86816af9372) is `package.json`, the rollup config, and one fifteen-line Sass file: 22 deletions, 0 insertions. I don't think I've ever cut a major release this small, and honestly, a breaking change that adds nothing is my favorite kind.

Some history, since I'm the one who did this to myself. `classPrefix` and the prefixed bundles [arrived back in v2](/blog/prefixed-bulma-and-theming), and that post pitched the pair of prefixed stylesheets with a straight face. The pitch aged fine; the pair didn't. As the [migration guide](/docs/guides/getting-started/migration/bulma-ui-4-to-5) puts it, "maintaining two parallel prefixed bundles doubled the prefixed build and test surface without adding capability". Anything the `bulma-` bundle could do, the `bestax-` bundle or a custom Sass build does equally well.

To be precise about the title: the [five CSS variations](/docs/guides/getting-started/variations#choosing-the-right-variation) all still ship (complete, prefixed, no-helpers, no-helpers-prefixed, no-dark-mode). What v5 removed is the second prefix **scheme**. One scheme, `bestax-`, plus one runtime knob that can wear whatever prefix your stylesheet does. Migrating is a two-line swap:

**Before (4.x):**

```tsx
import { ConfigProvider, Button } from '@allxsmith/bestax-bulma';
import '@allxsmith/bestax-bulma/versions/bestax-bulma-prefixed.css';

function App() {
  return (
    <ConfigProvider classPrefix="bulma-">
      <Button color="primary">Save</Button>
    </ConfigProvider>
  );
}
```

**After (5.x):**

```tsx
import { ConfigProvider, Button } from '@allxsmith/bestax-bulma';
import '@allxsmith/bestax-bulma/versions/bestax-prefixed.css';

function App() {
  return (
    <ConfigProvider classPrefix="bestax-">
      <Button color="primary">Save</Button>
    </ConfigProvider>
  );
}
```

And the rendered HTML moves with it:

```html
<!-- 4.x with bestax-bulma-prefixed.css -->
<button class="bulma-button bulma-is-primary">Save</button>

<!-- 5.x with bestax-prefixed.css -->
<button class="bestax-button bestax-is-primary">Save</button>
```

If you had custom CSS overrides or test selectors targeting `.bulma-*` names, update those alongside the swap. And if you upgrade and miss the memo, the failure is loud: the package export is gone, so the old import dies at build time with `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of quietly serving an unstyled page. Need to keep the `bulma-` prefix anyway? It isn't reserved; [rebuild the same stylesheet from Sass](/docs/guides/getting-started/migration/bulma-ui-4-to-5#if-you-need-to-keep-the-bulma--prefix) with `$class-prefix: 'bulma-'` and keep going.

None of this changes how prefixing works. [`classPrefix`](/docs/api/helpers/config#basic-usage-with-class-prefix) is the same `ConfigProvider` prop it's been since v2, and the [configuration guide](/docs/guides/features/configuration#css-class-prefixing) covers it end to end. 5.x just stopped shipping two stylesheets for it to pair with.

## Scaffolding Follows

create-bestax cut 3.0.0 the same day, and it's the half of this story where I get to own a bug. Before 3.0.0, only the `complete` flavor scaffolded the bundled bestax CSS. The other four flavors imported stock Bulma from the `bulma` package plus a separate `extras.css` for the bestax-only components, and on the prefixed flavors that combination was broken out of the box: components emitted prefixed class names while `extras.css` was unprefixed, so the bestax extras (Tooltip and friends) rendered unstyled in a brand-new project. An unstyled component in your first five minutes with a scaffolder is a rotten first impression, and I shipped it.

[The fix](https://github.com/allxsmith/bestax/commit/43621dc7cebef2dd51f017feccc91a2154e1f7a3) is the v5 thesis applied to the scaffolder: every flavor now imports the single bundled bestax variant for its choice (Bulma and the extras together, one file), and the prefixed flavors set `classPrefix="bestax-"` to match. The bug existed because there were two CSS stories to wire up, and one of them was easy to wire wrong. Delete the second story, and the one that's left is correct by construction. (Changelog trivia: the [3.0.0 entry](https://github.com/allxsmith/bestax/blob/main/create-bestax/CHANGELOG.md)'s breaking-change text is the stylesheet removal shared with bulma-ui 5.0.0, propagated by the workspace release tooling; the flavor swap itself rode along as a fix.)

create-bestax sits at 4.0.0 today, so `pnpm create bestax@latest` already gives you all of this. [Two minutes to a running app](/docs/guides/intro) if you want to see it, and the [installation guide](/docs/guides/getting-started/installation) covers the manual path.

## Everything Since: 5.1 to 5.8

The major carried one deletion; the minors carried the features. Eight of them in three weeks:

| Release             | What Landed                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **5.1.0** (July 1)  | [`colorMode`](/docs/api/helpers/theme#dark-mode) on `Theme`: `'light'`, `'dark'`, or `'system'`                                                                                                              |
| **5.2.0** (July 7)  | Polymorphic `as` on [Button](/docs/api/elements/button#polymorphic-as-router-links) and [Link](/docs/api/elements/link#polymorphic-as-router-links), built for [router links](/docs/guides/features/routing) |
| **5.3.0** (July 8)  | [Reveal](/docs/api/components/reveal), scroll-triggered animations                                                                                                                                           |
| **5.4.0** (July 10) | [Avatar](/docs/api/components/avatar), [Avatars](/docs/api/components/avatars), and [Badge](/docs/api/components/badge)                                                                                      |
| **5.5.0** (July 14) | Accessibility batch for Avatar and Badge                                                                                                                                                                     |
| **5.6.0** (July 14) | A consistent [`gap` prop on Columns](/docs/api/columns#gap-sizes--responsive-gaps)                                                                                                                           |
| **5.7.0** (July 20) | [Dot-notation sub-components](/docs/api/components/message#compound-dot-notation-usage) across 30 families                                                                                                   |
| **5.8.0** (July 22) | [Agent files in the npm tarball](/docs/guides/llms#in-the-npm-package), plus the first release of bestax-migrate                                                                                             |

Three of those rows already have a whole post: Reveal, the avatar family, and the accessibility batch are covered properly in [Enhanced Add-Ons, Round Two](/blog/enhanced-addons-round-two), so 5.3 through 5.5 stay one-liners here. And bestax-migrate (a codemod that moves react-bulma-components apps over) deserves more than a table cell; its post is queued in the tracker.

One patch release earns a mention in a post with this title: [5.6.1](https://github.com/allxsmith/bestax/pull/301) routed every hardcoded class name in the library through the prefix helpers and added a sweep test that renders everything under a custom prefix and fails on any class that ignores [`classPrefix`](/docs/api/helpers/config#useclassprefix). "Any prefix" is a claim CI checks now, not a vibe.

Four of the minors deserve more than a row.

### Dark Mode on Demand

Since 5.1.0, `Theme` takes a `colorMode` prop: `'light'`, `'dark'`, or `'system'`. It sets Bulma's `data-theme` on `<html>`, so the whole page flips scheme, and `'system'` follows the OS preference. Omitting it leaves whatever's already set, which is why single-mode designs should pin it ([the Theme docs](/docs/api/helpers/theme#dark-mode) explain the contrast trap).

```tsx
import { useState } from 'react';
import { Theme, Button } from '@allxsmith/bestax-bulma';

function App() {
  const [mode, setMode] = useState<'light' | 'dark' | 'system'>('system');
  return (
    <Theme isRoot colorMode={mode}>
      <Button color="primary" onClick={() => setMode('dark')}>
        Dark
      </Button>
      <Button color="primary" onClick={() => setMode('light')}>
        Light
      </Button>
      <Button onClick={() => setMode('system')}>System</Button>
    </Theme>
  );
}
```

That one's a static snippet on purpose. This blog's live demos render inside a sandbox that pins its own light and dark preview, and a control that flips the whole document's theme can't run honestly in there. Paste it into your app and it does exactly what it says.

### One Gap Scale for Columns and Grid

`Grid` takes `gap` on Bulma's 0 to 8 scale, but `Columns` wanted `gapSize`. Same concept, two names. 5.6.0 gives `Columns` the same [`gap` prop](/docs/api/columns#gap-sizes--responsive-gaps), with `gapMobile`, `gapTablet`, and the rest of the responsive variants along for the ride, and `gapSize` still works as a deprecated alias so nothing breaks. This one is live, poke it:

```tsx live
function GapDemo() {
  const [gap, setGap] = React.useState(2);
  return (
    <Block>
      <Buttons mb="2">
        <Button onClick={() => setGap(Math.max(0, gap - 1))}>Tighter</Button>
        <Button onClick={() => setGap(Math.min(8, gap + 1))}>Wider</Button>
      </Buttons>
      <Paragraph mb="2">Current gap: {gap}</Paragraph>
      <Columns gap={gap}>
        <Column>
          <Notification color="primary">One</Notification>
        </Column>
        <Column>
          <Notification color="info">Two</Notification>
        </Column>
        <Column>
          <Notification color="success">Three</Notification>
        </Column>
      </Columns>
    </Block>
  );
}
```

### Dot-Notation Sub-Components for 30 Families

Since 5.7.0, every parent/child family hangs its children off the parent: `Card.Header`, `Modal.Card`, `Navbar.Item`, `Message.Body`, thirty families in all ([#331](https://github.com/allxsmith/bestax/pull/331)). One import per family, and your editor's autocomplete does the remembering. The statics are the same components as the named exports (attached, not wrapped), so identity checks like `child.type === Modal.Card` keep working. And if your muscle memory comes from react-bulma-components, this shape [will feel like home](/docs/guides/getting-started/migration/react-bulma-components).

```tsx live
<Message color="info">
  <Message.Header>
    <Paragraph>One Import, Dot Notation</Paragraph>
    <Delete aria-label="delete" />
  </Message.Header>
  <Message.Body>
    <Paragraph>
      Message.Header and Message.Body ride along on the Message import, so the
      whole family stays in one place.
    </Paragraph>
  </Message.Body>
</Message>
```

### The npm Package Reads Itself

Since 5.8.0, the npm tarball ships `llms.txt`, `AGENTS.md`, and a consumer-facing `CLAUDE.md` ([#345](https://github.com/allxsmith/bestax/pull/345)). When an AI coding agent goes spelunking in your `node_modules`, it finds a map instead of guessing: what the library is, where the real docs live, and an `llms.txt` index of what to fetch next. Less hallucinated API, straight from the package. The [LLMs guide](/docs/guides/llms#in-the-npm-package) covers exactly what ships where.

## Documentation

Everything above, in reference form:

- The [4.x to 5.x migration guide](/docs/guides/getting-started/migration/bulma-ui-4-to-5): the two-step swap, the rendered-HTML diff, and the keep-`bulma-` escape hatch
- [`ConfigProvider` and `classPrefix`](/docs/api/helpers/config), plus the [configuration guide](/docs/guides/features/configuration#css-class-prefixing)
- [Choosing a CSS variation](/docs/guides/getting-started/variations#choosing-the-right-variation): which of the five bundles to import
- [Theme and dark mode](/docs/api/helpers/theme#dark-mode)
- [The LLMs guide](/docs/guides/llms): every AI-facing artifact the project publishes

## What's Next

The catch-up series rolls on. Next up: how the bundled agent skills fight AI training bias, and after that, a proper deep dive on bestax-migrate 1.0. The [tracker](https://github.com/allxsmith/bestax/issues/384) has the full plan.

One CSS, any prefix. Turns out the best thing I shipped in v5 was a deletion.
