---
title: Icons
sidebar_label: Icons
sidebar_position: 3
---

# Icons

bestax-bulma supports these icon libraries out of the box: **Font Awesome**, **Material Design Icons**, **Ionicons**, **Google Material Icons**, and **Material Symbols**. Font Awesome is the default when no `library` prop is set.

:::tip Easiest path: `create-bestax`
The [Quick Start](/docs/guides/intro) installer prompts you to pick an icon library (or none) and handles the install, CSS import, and any needed `ConfigProvider` wiring automatically. Use the manual steps below if you're adding icons to an existing project or want to switch libraries later.
:::

---

## Font Awesome

Font Awesome is the default icon library — no `library` prop required.

**Install:**

<PackageManagerTabs>

```bash
pnpm add @fortawesome/fontawesome-free
```

</PackageManagerTabs>

**Import:**

Add this to your main application file (e.g., `main.tsx` or `App.tsx`):

```js
import '@fortawesome/fontawesome-free/css/all.min.css';
```

**Usage:**

```tsx live
import { Button, Icon } from '@allxsmith/bestax-bulma';

function FontAwesomeExample() {
  return (
    <Button color="primary">
      <Icon name="user" aria-hidden="true" />
      <span>Profile</span>
    </Button>
  );
}
```

**Variants** (Font Awesome styles):

- Solid (default): `<Icon name="user" />`
- Regular: `<Icon name="user" variant="regular" />`
- Brands: `<Icon name="github" variant="brands" />`
- Light, Duotone, and Thin are also available via the `variant` prop.

:::info Library values
The `library` prop defaults to `"fa"` (Font Awesome). You only need to set it when using another library, e.g., `library="mdi"`.
:::

---

## Material Design Icons

Material Design Icons (MDI) is a comprehensive icon library that follows Google's Material Design guidelines.

**Install:**

<PackageManagerTabs>

```bash
pnpm add @mdi/font
```

</PackageManagerTabs>

**Import:**

Add this to your main application file (e.g., `main.tsx` or `App.tsx`):

```js
import '@mdi/font/css/materialdesignicons.min.css';
```

**Usage:**

```tsx live
import { Button, Icon } from '@allxsmith/bestax-bulma';

function MaterialIconExample() {
  return (
    <Button color="primary">
      <Icon library="mdi" name="home" aria-hidden="true" />
      <span>Home</span>
    </Button>
  );
}
```

---

## Ionicons

Ionicons is a modern icon library designed specifically for web, iOS, Android, and desktop apps. The library now uses web components for better performance and loading.

**Install:**

<PackageManagerTabs>

```bash
pnpm add ionicons@^8.0.13
```

</PackageManagerTabs>

**Import:**

:::info No CSS Import Needed

Ionicons v8 uses web components that are automatically loaded in your documentation examples.

:::

**Setup for Your Application:**

For your own application, you need to import the ionicons ES module. Add this to your main application file (e.g., `index.js`, `App.js`, or `main.tsx`):

```js
// Import ionicons as ES module - this will auto-register the web components
import 'ionicons/dist/ionicons/ionicons.esm.js';
```

**Alternative Setup (CDN):**

You can also load ionicons via CDN by adding this script tag to your HTML. Ionicons v8 ships
only an ES module build, so no `nomodule` fallback script is needed:

```html
<script
  type="module"
  src="https://unpkg.com/ionicons@8.0.13/dist/ionicons/ionicons.esm.js"
></script>
```

**Usage:**

```tsx live
import { Button, Icon } from '@allxsmith/bestax-bulma';

function IoniconExample() {
  return (
    <Button color="info">
      <Icon library="ion" name="settings" aria-hidden="true" />
      <span>Settings</span>
    </Button>
  );
}
```

**Available Icon Variants:**

Ionicons v8 provides these variants for most icons:

```tsx live
import { Icon, Columns, Column, Block } from '@allxsmith/bestax-bulma';

function IoniconVariants() {
  return (
    <Columns isVCentered>
      <Column isNarrow textAlign="centered">
        <Icon library="ion" name="heart" aria-hidden="true" />
        <Block textSize="7" mt="1">
          Default
        </Block>
      </Column>
      <Column isNarrow textAlign="centered">
        <Icon library="ion" name="heart-outline" aria-hidden="true" />
        <Block textSize="7" mt="1">
          Outline
        </Block>
      </Column>
      <Column isNarrow textAlign="centered">
        <Icon library="ion" name="heart-sharp" aria-hidden="true" />
        <Block textSize="7" mt="1">
          Sharp
        </Block>
      </Column>
    </Columns>
  );
}
```

:::info Ionicons v8 Web Components
Ionicons v8 uses modern web components instead of CSS fonts. This provides:

- **Better performance**: Only loads icons that are actually used
- **Smaller bundle size**: No need to include entire font files
- **SVG-based rendering**: Crisp icons at any size
- **Automatic loading**: Icons load dynamically as needed

Web components are automatically registered in documentation examples, so no additional setup is required.
:::

:::tip Icon Naming Convention
Ionicons v8 simplified the naming convention:

- **Default (filled)**: `heart`, `settings`, `home`
- **Outline**: `heart-outline`, `settings-outline`, `home-outline`
- **Sharp**: `heart-sharp`, `settings-sharp`, `home-sharp`

The old iOS/MD prefixes (`ios-heart`, `md-heart`) are no longer used in v8.

You can also pass the variant separately — `<Icon library="ion" name="heart" variant="outline" />` is equivalent to `<Icon library="ion" name="heart-outline" />`.
:::

---

## Google Material Icons

Google's official Material Icons library provides the core set of Material Design icons.

**Install:**

<PackageManagerTabs>

```bash
pnpm add material-icons
```

</PackageManagerTabs>

**Import:**

Add this to your main application file (e.g., `main.tsx` or `App.tsx`):

```js
// Default import (includes all styles)
import 'material-icons';

// Or import the base CSS file
import 'material-icons/iconfont/material-icons.css';
```

**SASS Import:**

```scss
@import 'material-icons/iconfont/material-icons.scss';
```

**Selective Imports (for smaller bundle size):**

```js
// Import only specific styles you need
import 'material-icons/iconfont/filled.css'; // Default filled style
import 'material-icons/iconfont/outlined.css'; // Outlined style
import 'material-icons/iconfont/round.css'; // Round style
import 'material-icons/iconfont/sharp.css'; // Sharp style
import 'material-icons/iconfont/two-tone.css'; // Two-tone style
```

**Usage:**

```tsx live
import { Button, Icon } from '@allxsmith/bestax-bulma';

function GoogleMaterialIconExample() {
  return (
    <Button color="success">
      <Icon library="material-icons" name="home" aria-hidden="true" />
      <span>Home</span>
    </Button>
  );
}
```

**Available Icon Styles:**

The Google Material Icons library includes different styles that can be used via `variant`:

```tsx live
import { Icon, Columns, Column } from '@allxsmith/bestax-bulma';

function MaterialIconStyles() {
  return (
    <Columns isVCentered>
      <Column isNarrow>
        <Icon library="material-icons" name="account_circle" color="danger" />
      </Column>
      <Column isNarrow>
        <Icon
          library="material-icons"
          name="account_circle"
          variant="outlined"
          color="danger"
        />
      </Column>
      <Column isNarrow>
        <Icon
          library="material-icons"
          name="account_circle"
          variant="round"
          color="danger"
        />
      </Column>
      <Column isNarrow>
        <Icon
          library="material-icons"
          name="account_circle"
          variant="sharp"
          color="danger"
        />
      </Column>
    </Columns>
  );
}
```

:::tip Icon Styles

- **Default (Filled)**: Standard filled icons (default, no `variant` needed)
- **Outlined**: `variant="outlined"`
- **Round**: `variant="round"`
- **Sharp**: `variant="sharp"`
  :::

:::info Documentation
For a complete list of available icons and detailed usage instructions, visit the [material-icons package documentation](https://www.npmjs.com/package/material-icons).
:::

---

## Material Symbols

The newest icon library from Google, offering more comprehensive icon coverage and modern design.

**Install:**

<PackageManagerTabs>

```bash
pnpm add material-symbols
```

</PackageManagerTabs>

**Import:**

Add this to your main application file (e.g., `main.tsx` or `App.tsx`):

```js
// Default import (includes all styles)
import 'material-symbols';
```

**SASS Import:**

```scss
@import 'material-symbols';
```

**Selective Imports (for smaller bundle size):**

```js
// Import only specific styles you need
import 'material-symbols/outlined.css'; // Outlined style (most common)
import 'material-symbols/rounded.css'; // Rounded style
import 'material-symbols/sharp.css'; // Sharp style
```

**Usage:**

```tsx live
import { Button, Icon } from '@allxsmith/bestax-bulma';

function MaterialSymbolExample() {
  return (
    <Button color="warning">
      <Icon library="material-symbols" name="home" aria-hidden="true" />
      <span>Home</span>
    </Button>
  );
}
```

**Available Symbol Styles:**

Material Symbols come in several styles. The default import includes all of them, but you can import selectively:

```tsx live
import { Icon, Columns, Column } from '@allxsmith/bestax-bulma';

function MaterialSymbolStyles() {
  return (
    <>
      <Columns isVCentered>
        <Column size={2} textWeight="bold">
          Outlined:
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="delete"
            size="large"
            features="is-size-1"
          />
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="settings"
            size="large"
            features="is-size-1"
          />
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="grade"
            size="large"
            features="is-size-1"
          />
        </Column>
      </Columns>

      <Columns isVCentered>
        <Column size={2} textWeight="bold">
          Rounded:
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="delete"
            variant="rounded"
            size="large"
            features="is-size-1"
          />
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="settings"
            variant="rounded"
            size="large"
            features="is-size-1"
          />
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="grade"
            variant="rounded"
            size="large"
            features="is-size-1"
          />
        </Column>
      </Columns>

      <Columns isVCentered>
        <Column size={2} textWeight="bold">
          Sharp:
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="delete"
            variant="sharp"
            size="large"
            features="is-size-1"
          />
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="settings"
            variant="sharp"
            size="large"
            features="is-size-1"
          />
        </Column>
        <Column isNarrow>
          <Icon
            library="material-symbols"
            name="grade"
            variant="sharp"
            size="large"
            features="is-size-1"
          />
        </Column>
      </Columns>
    </>
  );
}
```

:::tip Symbol Styles

- **Outlined**: Default style (no `variant` needed)
- **Rounded**: `variant="rounded"`
- **Sharp**: `variant="sharp"`
  :::

:::info Material Symbols vs Material Icons
Material Symbols is Google's newer icon system with:

- More comprehensive icon coverage
- Better optical sizing and variable font support
- Consistent design across all platforms
- Recommended for new projects

For a complete list of available symbols and detailed usage instructions, visit the [material-symbols package documentation](https://www.npmjs.com/package/material-symbols).
:::

### Making the font smaller

Material Symbols is a variable font, and `material-symbols/outlined.css` loads all of it: every symbol, at every fill, weight, grade and optical size. That's several megabytes, and an app that shows a few icons downloads the lot. `create-bestax` sets it up that way on purpose, because it's one import, it works offline, and any name you give `Icon` just renders. For most apps that's the right trade. If the download matters to yours, you have other ways to load it.

**Ask Google Fonts for only the icons you use.** Google Fonts' CSS2 API takes an `icon_names` parameter and serves a font holding just those glyphs. Drop the `material-symbols` import and link the stylesheet from `index.html` instead:

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&icon_names=home,palette,settings&display=block"
/>
```

[Google's guide](https://developers.google.com/fonts/docs/material_symbols#optimize_the_icon_font) asks for the names comma-separated and sorted alphabetically, and for `&display=block`, which stops the names flashing up as text before the font arrives. The stylesheet defines the same `material-symbols-outlined` class `Icon` renders, so your components stay as they are. What it costs you:

- The icons now load from Google's servers, so every visitor's browser talks to Google. That's a privacy question for some apps, and an app that has to work offline loses its icons.
- The list has to keep up with the icons the app renders. A name that isn't on it shows up as plain text.
- The font comes at the default fill, weight, grade and optical size. If the app sets `font-variation-settings`, request those axes in the URL too, the way Google's guide shows.
- `variant="rounded"` and `variant="sharp"` use other font families, so request `Material+Symbols+Rounded` or `Material+Symbols+Sharp` for those.

**Self-host a subset.** To keep the small font without the request to Google, cut a subset from the package's `.woff2` yourself with a font subsetting tool such as [fontTools' subsetter](https://fonttools.readthedocs.io/en/latest/subset/), keeping only the glyphs for the names the app renders. Then load it with your own `@font-face` and `.material-symbols-outlined` rules in place of the package import. The "Self-hosting the font" section of Google's guide shows both. The list still has to keep up with the app's icons.

**Use a font with fewer variations.** [`@material-symbols/font-400`](https://www.npmjs.com/package/@material-symbols/font-400) comes from the same project as `material-symbols` and keeps every symbol, but fixes the weight, grade and optical size, so its font is a fraction of the size. Its `outlined.css` defines the same class, so installing it and importing `@material-symbols/font-400/outlined.css` in place of `material-symbols/outlined.css` is the whole change, with no list to maintain. You give up the axes it fixes.

---

:::tip Skip the manual setup
If you haven't started your project yet, `pnpm create bestax@latest` will wire up any of these icon libraries for you. See the [Quick Start](/docs/guides/intro).
:::

---

## Icon-Only Buttons

Every button example above pairs its icon with visible text. When the icon _is_ the whole label — a toolbar or a card action with no room for words — the accessible name has to come from somewhere else, because there is no text for a screen reader to announce.

Put the name on the `Button` with `aria-label`, and leave the `Icon` hidden from assistive technology, as it is whenever it has no `ariaLabel`:

```tsx live
import { Button, Icon } from '@allxsmith/bestax-bulma';

function IconOnlyExample() {
  return (
    <Button color="danger" aria-label="Delete item">
      <Icon name="trash" aria-hidden="true" />
    </Button>
  );
}
```

The two attributes do different jobs, and only the first one names the button:

- **`aria-label` on the `Button`** is the accessible name. It takes precedence over anything inside the button, so it alone supplies the name a screen reader reads out (alongside the "button" role and any state, which come from the element itself). Make it name the action ("Delete item"), not the picture ("Trash icon").
- **`aria-hidden` on the `Icon`** does not change that name. It keeps the icon out of the accessibility tree entirely, so assistive technology never exposes a stray node when moving through the page element by element. An `Icon` with no `ariaLabel` renders it on its own, so writing it out, as these examples do, changes nothing. Correct decorative markup, not part of the naming.

Leave the `aria-label` off and the button has no name at all, since the only thing inside it is a hidden icon. Don't fix that with the `Icon`'s `ariaLabel`: it would name the picture, not the action.

The same pattern applies to every library on this page. Only the `library` prop and the icon `name` change:

```tsx live
import { Button, Buttons, Icon } from '@allxsmith/bestax-bulma';

function IconOnlyLibraries() {
  return (
    <Buttons>
      <Button color="primary" aria-label="Edit profile">
        <Icon library="mdi" name="pencil" aria-hidden="true" />
      </Button>
      <Button color="info" aria-label="Open settings">
        <Icon library="ion" name="settings" aria-hidden="true" />
      </Button>
      <Button color="success" aria-label="Add to favorites">
        <Icon library="material-icons" name="favorite" aria-hidden="true" />
      </Button>
    </Buttons>
  );
}
```

:::tip Icons alongside text
When the button already has visible text, the icon is decorative and needs only `aria-hidden` — no `aria-label` on the button, since the visible text is already the name. Adding `aria-hidden` there stops the default `"icon"` label being announced next to the word it duplicates.
:::

See [Button Accessibility](/docs/api/elements/button#accessibility) and the [Icon API](/docs/api/elements/icon) for the full prop lists.

---

## Choosing the Right Icon Library

| Library                   | Icons Count | Best For                        |
| ------------------------- | ----------- | ------------------------------- |
| **Font Awesome**          | 2,000+      | General purpose, most popular   |
| **Material Design Icons** | 7,000+      | Material Design projects        |
| **Ionicons v8**           | 1,300+      | Modern web components, mobile   |
| **Google Material Icons** | 1,100+      | Official Google Material Design |
| **Material Symbols**      | 2,500+      | Modern Material Design projects |

---

## Icon Name References

- **Font Awesome**: [fontawesome.com/icons](https://fontawesome.com/icons)
- **Material Design Icons**: [materialdesignicons.com](https://materialdesignicons.com/)
- **Ionicons v8**: [ionicons.com](https://ionicons.com/) • [NPM Package](https://www.npmjs.com/package/ionicons)
- **Google Material Icons**: [fonts.google.com/icons](https://fonts.google.com/icons?icon.set=Material+Icons) • [NPM Package](https://www.npmjs.com/package/material-icons)
- **Material Symbols**: [fonts.google.com/icons](https://fonts.google.com/icons?icon.set=Material+Symbols) • [NPM Package](https://www.npmjs.com/package/material-symbols)

---

## Next Steps

- **Learn about Icon component props**: [Icon API](/docs/api/elements/icon)
- **Explore IconText component**: [IconText API](/docs/api/elements/icontext)
- **Browse CSS variations**: [CSS Variations](/docs/guides/getting-started/variations)
