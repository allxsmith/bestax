---
slug: the-floor-is-react-18
title: The Floor Is React 18
description: 'bestax-bulma v4.0.0 dropped React 16 and 17. One breaking change, three honest reasons, and what it means for you (probably nothing).'
authors: [asmith]
tags: [release, v4, react]
canonical_url: https://bestax.io/blog/the-floor-is-react-18
publish_to_devto: true
image: /img/the-floor-is-react-18.png
cover_image: /img/the-floor-is-react-18.png
---

![The Floor Is React 18, drawn as a pixel art lava level: tiles labeled 16 and 17 sink into the lava while the React atom hops between a solid brick floor labeled React 18 and a floating 19 platform](/img/the-floor-is-react-18.svg)

In June, bestax-bulma v4.0.0 dropped support for React 16 and 17. That's the whole release: one breaking change, no new components, and if you're on React 18 or 19 you won't feel a thing. Here's why I moved the floor anyway.

<!-- truncate -->

Same housekeeping as the [v3 forms recap](/blog/v3-forms-release): this is a recap, not breaking news. [v4.0.0](https://github.com/allxsmith/bestax/blob/main/bulma-ui/CHANGELOG.md) was tagged on June 20, 2026, three days after v3.0.0, the library sits at 5.8.0 today, and this is the third post in the [catch-up series](https://github.com/allxsmith/bestax/issues/384).

## What Changed

Two lines in `package.json`. Honestly, that's it:

```diff
-    "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
-    "react-dom": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
+    "react": "^18.0.0 || ^19.0.0",
+    "react-dom": "^18.0.0 || ^19.0.0"
```

No components changed, no props were renamed, no CSS moved. The rest of the release was internal lint tooling that never ships to you. The [3.x to 4.x migration guide](/docs/guides/getting-started/migration/bulma-ui-3-to-4) is the shortest one we have, and it exists mostly to say there's nothing to migrate.

## Why I Dropped 16 and 17

**The support claim wasn't real.** CI built and tested this library against React 18 and 19. Nothing ever ran against 16 or 17, so the `^16.8.0` in the peer range was a claim, not a fact. I know exactly what untested claims are worth, because the day I [added a React 18 + 19 test matrix](https://github.com/allxsmith/bestax/commit/abdee88caa5636b7fe9b1b1dae017bed8eb97a04), its very first run failed on React 18: a Carousel test helper passed `ref` through a prop spread, which only works on React 19's ref-as-prop. If React 18 could break quietly inside the range I actually test, what do you figure the odds were that React 16.8 still worked?

**v3 had already crossed the line.** The [date and time pickers](/blog/v3-forms-release) that headlined v3.0.0 call [`useId`](https://react.dev/reference/react/useId) for SSR-safe accessible IDs, and `useId` doesn't exist before React 18. So v3 shipped claiming React 16.8 support while its newest components would have crashed there on mount. [v4.0.0](https://github.com/allxsmith/bestax/commit/c7251b0a4a1f92ab90c4eda59c60c0ee931e91e1) didn't really drop 16 and 17; it stopped claiming something that had already stopped being true.

**Old floors are expensive.** Keeping 16 and 17 would have meant a fallback ID generator and shims for exactly the versions almost nobody runs. React 18 came out in [March 2022](https://react.dev/blog/2022/03/29/react-v18), React 19 has been [stable since December 2024](https://react.dev/blog/2024/12/05/react-19), and React 16.8 is from [February 2019](https://legacy.reactjs.org/blog/2019/02/06/react-v16.8.0.html). Every major in a peer range is a promise to test against it, reproduce bugs on it, and design APIs around its limits. I'd rather make a smaller promise and keep it.

## The React 18 + 19 Matrix

Narrowing the range was half the move. The other half was making what's left verifiable: since that same day, every CI run builds, type-checks, and tests the library twice, once against React 18 and once against React 19, with real peer installs (no `--legacy-peer-deps` anywhere) and fail-fast off so a break on either major reports on its own. The peer range and the test matrix now say the same thing. `^18.0.0 || ^19.0.0` isn't a hope, it's what CI verified on the latest commit.

## Upgrading

- **On React 18 or 19**: bump to 4.x (or straight to the current 5.x) and you're done. Same components, same props, same CSS.
- **On React 16 or 17**: stay on `@allxsmith/bestax-bulma@^3` until your app can move to React 18, and mind that the v3 date and time pickers already assume a modern React.

The [migration guide](/docs/guides/getting-started/migration/bulma-ui-3-to-4) covers both paths.

## Sometimes You Gotta Move On

If you maintain a package, a wide peer range feels like generosity. It's also the easiest promise to make, because nothing enforces it: peer ranges aren't verified by your test suite unless you build that verification yourself, and the versions at the old end are exactly the ones your CI stopped seeing years ago. That's how support rots. Not in one decision, but in one hook you adopt, one helper you refactor, one API you design around, until the range describes a library that no longer exists.

So this is me saying the quiet part in a changelog font: I dropped React 16 and 17 because I couldn't keep the promise, and pretending is worse than a major bump. React 16.8 gave us hooks and changed how all of us write components, and 17 carried the whole ecosystem across a bridge. Genuinely: thanks. But sometimes you gotta move on.

## What's Next

The catch-up series rolls on: next is v5.0.0, the release that made the CSS story one story, any prefix. The [tracker](https://github.com/allxsmith/bestax/issues/384) has the full plan.

Meanwhile, the floor is holding.
