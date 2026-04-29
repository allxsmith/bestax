---
title: Migration
sidebar_label: Migration
slug: /guides/getting-started/migration
---

# Migration

:::note Two independent migration paths
The pages below cover unrelated upgrades. Most readers only need one. If you're already on Bulma v1 and just bumping bestax, skip straight to **2.x to 3.x**.
:::

Pick whichever applies to your situation:

## [Upgrading bestax-bulma 2.x → 3.x](./bulma-ui-2-to-3.md)

The 3.x release is **mostly additive** — about 30 new components plus quality-of-life prop additions. Two changes need active attention:

- **Form input auto-wrap**: `<Input>`, `<Select>`, `<TextArea>`, and `<File>` now compose themselves with `<Field>` and `<Control>` automatically. If you already wrap inputs in `<Field><Control>`, nothing changes; new `InputBase` / `SelectBase` / `TextAreaBase` exports preserve the bare-element behavior for the rest.
- **Themed `<Radio>` and `<Checkbox>`** now use a custom-styled indicator that requires the new bestax extras CSS to render visibly. Import `dist/extras.css` or `dist/bestax.css`.

Also notable but not breaking: new optional context-driven APIs in `<Tabs>`, `<Checkboxes>`, and `<Radios>`; a new programmatic singleton API in `<Notification>`; and `bulma` moves from `peerDependencies` to `dependencies`.

[Read the full 2.x to 3.x guide →](./bulma-ui-2-to-3.md)

## [Migrating from Bulma v0.9.x → v1](./bulma-0-9-to-1.md)

bestax-bulma itself has always required Bulma v1 — there's no "bestax on Bulma 0.9" path. This guide is for two adjacent scenarios: (1) you're migrating off **another** React + Bulma library (`react-bulma-components`, Buefy, etc.) that was pinned to Bulma 0.9.x, or (2) you have **plain Bulma 0.9.x** in your own project that you want to upgrade alongside (or before) adopting bestax.

The HTML stays identical between Bulma 0.9 and 1, but Bulma v1 swaps Node Sass for Dart Sass, introduces CSS custom properties for runtime theming, ships a real CSS Grid system, and deprecates Tiles.

[Read the full Bulma 0.9.4 → 1.x guide →](./bulma-0-9-to-1.md)
