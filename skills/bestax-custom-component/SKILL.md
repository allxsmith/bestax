---
name: bestax-custom-component
description: Build a new custom Bulma "extra" component for @allxsmith/bestax-bulma — a React + TypeScript component with Bulma v1 SCSS (the CSS-variable pattern), Storybook stories, tests, and docs. Use when adding a component that goes beyond stock Bulma (like Dialog, Carousel, Switch, Slider, Rate, Taginput), or when extending an existing one to match the library's conventions.
license: MIT
---

# Building a custom bestax-bulma component

This skill teaches the end-to-end pattern the library uses for its custom "extra"
components — the ones that aren't part of stock Bulma. Follow it whenever you add a new
component to `@allxsmith/bestax-bulma`, or refactor a component to match house style.

## Use when

- Creating a new component beyond stock Bulma (an interactive widget, a composed element).
- Writing the component's SCSS and you need it to follow the **Bulma v1 CSS-variable pattern**
  (`register-vars` / `getVar`, `--bulma-*` custom properties, the class prefix).
- Wiring a component into the package exports, the SCSS bundle, Storybook, tests, and docs.

For **form** components (Field/Control/Input/etc.) use the `bestax-form` skill instead.

## Check for an existing component first

Before building anything, **search the library for a component that already does this — or a
close synonym** — and tell the user what you found. Many requests are covered by an existing
element, or are best built by composing existing ones. Building a near-duplicate (a "label" when
`Tag` exists, a "banner" when `Notification` exists) fragments the API and is usually the wrong
call.

Where to look:

- `bulma-ui/src/index.ts` — the full export list; scan it for the name and its synonyms.
- `docs/docs/api/{elements,components,form}/` — one doc page per shipped component.
- Storybook titles — `Elements/*`, `Components/*`, `Form/*`.

Then decide, and **surface the decision to the user**:

- **Exact / synonym match exists** → recommend using it. Don't build a duplicate. (E.g. a small
  colored label/badge/chip → `Tag` / `Tags` already exist.)
- **Partial overlap** → prefer **composing or extending** the existing pieces inside your new
  component rather than re-implementing them. (E.g. a "profile card" → there's no `ProfileCard`,
  but `Card`, `Image`, `Title`, `SubTitle`, and `Content` exist; build `ProfileCard` to compose
  them.)
- **Genuine gap** → build the new component using the pattern below.

State plainly which case applies before writing code, e.g. _"`Tag` already covers a colored
label — use that instead"_ or _"No `ProfileCard` exists; I'll build one composing the existing
`Card`/`Image`/`Title` elements."_

## File layout

Every custom component has five files. Mirror the existing names exactly (PascalCase TSX,
`_kebab.scss` partial):

```
bulma-ui/src/components/MyComponent.tsx              # React + TS component
bulma-ui/src/components/MyComponent.stories.tsx      # Storybook stories
bulma-ui/src/components/__tests__/MyComponent.test.tsx  # Jest + RTL tests
bulma-ui/src/scss/components/_mycomponent.scss       # SCSS partial
docs/docs/api/components/mycomponent.md              # Docusaurus docs page
```

Then wire two index files (see **Wiring & build**).

## Component template

Components use `forwardRef`, accept Bulma helper props via `BulmaClassesProps`, run them
through `useBulmaClasses`, build their own classes with `usePrefixedClassNames`, and merge
everything with `classNames`. Spread `rest` (the non-helper props) onto the DOM node.

```tsx
import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export type MyComponentColor =
  'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Props for the MyComponent component.
 *
 * @property {MyComponentColor} [color] - Bulma color modifier.
 * @property {'small' | 'medium' | 'large'} [size] - Size modifier.
 * @property {boolean} [isActive] - Whether the component is active.
 */
export interface MyComponentProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  color?: MyComponentColor;
  size?: 'small' | 'medium' | 'large';
  isActive?: boolean;
}

/**
 * MyComponent — short description of what it does.
 *
 * @example
 * <MyComponent color="primary" size="large" isActive>Hello</MyComponent>
 */
export const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
  ({ color, size, isActive, className, children, ...props }, ref) => {
    // 1. Pull Bulma helper classes (m/p, text*, display, etc.) out of props.
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);

    // 2. Build this component's own classes (respects the Config classPrefix).
    const mainClasses = usePrefixedClassNames('mycomponent', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
      'is-active': !!isActive,
    });

    // 3. Merge: own classes + helper classes + caller className.
    const combined = classNames(mainClasses, bulmaHelperClasses, className);

    return (
      <div ref={ref} className={combined} {...rest}>
        {children}
      </div>
    );
  }
);

MyComponent.displayName = 'MyComponent';

export default MyComponent;
```

Rules that keep components consistent:

- **Always `Omit<…, 'color'>`** from both `HTMLAttributes` and `BulmaClassesProps` when the
  component exposes its own typed `color`, so the native/helper `color` doesn't collide.
- **Never hand-build class strings.** Use `usePrefixedClassNames(base, conditionalMap)` so the
  optional `classPrefix` from `Config` is honored, then `classNames(...)` to merge.
- **Spread `rest`, not `props`**, onto the DOM node — `useBulmaClasses` has already stripped the
  helper props out of `rest`, so they don't leak to the DOM as invalid attributes.
- **Set `displayName`** on `forwardRef` components (needed for tests and Storybook autodocs).
- **Element sizing uses an inline `'small' | 'medium' | 'large'` union**, mapped to `is-small` /
  `is-medium` / `is-large` (see `Tabs.tsx`, `Control.tsx`). Do **not** reach for the `validSizes`
  constant — that one is `'0'…'6' | 'auto'` and exists for **spacing** helpers, not element size.
- **Format before you lint.** The repo enforces Prettier and ESLint fails on unformatted code.
  Run `pnpm exec prettier --write` on your new files (or `pnpm format` from the repo root) before
  `pnpm lint`. Copy snippets as a starting point, then let Prettier normalize them.

See `references/api.md` for the full helper API and `references/patterns.md` for the complete
Dialog walkthrough.

## SCSS pattern (required)

This is the library's house convention — **the Bulma v1 CSS-variable pattern**. Do not write
plain hard-coded CSS or homebrew `--mycomponent-*` variables. Import Bulma's utilities, declare
SCSS vars with `!default`, register them as `--bulma-*` custom properties on the root selector
with `cv.register-vars`, then consume them with `cv.getVar`. Prefix every selector with
`iv.$class-prefix`.

```scss
// bulma-ui/src/scss/components/_mycomponent.scss
@use 'bulma/sass/utilities/initial-variables' as iv;
@use 'bulma/sass/utilities/css-variables' as cv;

// 1. SCSS variables, overridable, referencing Bulma vars via cv.getVar.
$mycomponent-radius: cv.getVar('radius') !default;
$mycomponent-background: cv.getVar('scheme-main') !default;
$mycomponent-color: cv.getVar('text') !default;
$mycomponent-padding: 1rem !default;

// 2. Register them as runtime --bulma-* custom properties on the root selector.
.#{iv.$class-prefix}mycomponent {
  @include cv.register-vars(
    (
      'mycomponent-radius': #{$mycomponent-radius},
      'mycomponent-background': #{$mycomponent-background},
      'mycomponent-color': #{$mycomponent-color},
      'mycomponent-padding': #{$mycomponent-padding},
    )
  );
}

// 3. Consume via cv.getVar. Prefix every selector with iv.$class-prefix.
.#{iv.$class-prefix}mycomponent {
  background-color: cv.getVar('mycomponent-background');
  border-radius: cv.getVar('mycomponent-radius');
  color: cv.getVar('mycomponent-color');
  padding: cv.getVar('mycomponent-padding');
}

// Color variants reuse Bulma's registered color vars.
.#{iv.$class-prefix}mycomponent.#{iv.$class-prefix}is-primary {
  background-color: cv.getVar('primary');
  color: cv.getVar('primary-invert');
}

// Respect reduced-motion if you animate.
@media (prefers-reduced-motion: reduce) {
  .#{iv.$class-prefix}mycomponent {
    animation: none;
  }
}
```

Why this matters: registering vars makes the component themeable at runtime (the docs site and
`Theme`/`Config` providers override `--bulma-*` properties), and the `iv.$class-prefix` keeps
the component working when consumers opt into a class prefix to avoid collisions.

The canonical reference file is `bulma-ui/src/scss/components/_dialog.scss`.

## Stories

`MyComponent.stories.tsx` beside the component. Use `tags: ['autodocs']` so the JSDoc becomes
the docs page, declare `argTypes`, and write one named `function`-style render per variant.

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
    },
    isActive: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {
  render: function DefaultExample() {
    return <MyComponent>Default</MyComponent>;
  },
};

export const Colors: Story = {
  render: function ColorsExample() {
    return (
      <>
        <MyComponent color="primary">Primary</MyComponent>
        <MyComponent color="danger">Danger</MyComponent>
      </>
    );
  },
};
```

## Tests

`__tests__/MyComponent.test.tsx`, Jest + `@testing-library/react`. Cover render, each prop →
class mapping, the helper-prop passthrough, ref forwarding, and any interaction/a11y.

```tsx
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders children', () => {
    render(<MyComponent>Hello</MyComponent>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies the color modifier', () => {
    render(<MyComponent color="primary">x</MyComponent>);
    expect(screen.getByText('x')).toHaveClass('mycomponent', 'is-primary');
  });

  it('passes Bulma helper props through', () => {
    render(<MyComponent m="3">x</MyComponent>);
    expect(screen.getByText('x')).toHaveClass('m-3');
  });

  it('forwards the ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<MyComponent ref={ref}>x</MyComponent>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
```

## Docs page

`docs/docs/api/components/mycomponent.md` — Overview, Import, a Props table, and `Usage` with
live examples. Live code blocks use the ` ```tsx live ` fence (Docusaurus live-codeblock).

````md
---
title: MyComponent
sidebar_label: MyComponent
---

# MyComponent

## Overview

Short description of the component.

## Import

```tsx
import { MyComponent } from '@allxsmith/bestax-bulma';
```

## Props

| Prop       | Type                         | Default | Description           |
| ---------- | ---------------------------- | ------- | --------------------- |
| `color`    | `'primary' \| 'link' \| ...` | —       | Bulma color modifier. |
| `isActive` | `boolean`                    | `false` | Active state.         |

## Usage

### Default

```tsx live
<MyComponent>Hello</MyComponent>
```
````

> Note: the Docusaurus docs load the **built** dist CSS. After SCSS changes, run
> `cd bulma-ui && pnpm build` before the new styles show up in the docs site (Storybook
> compiles SCSS live and does not need this).

## Wiring & build

Two index files must be updated or the component won't ship:

1. **Package export** — add to `bulma-ui/src/index.ts`, in the **components** group (the file
   groups exports by directory — keep yours next to the other `./components/*` lines):
   ```ts
   export * from './components/MyComponent';
   ```
2. **SCSS bundle** — add to `bulma-ui/src/scss/components/_index.scss`:
   ```scss
   @use 'mycomponent';
   ```

Then build and verify:

```sh
cd bulma-ui
pnpm exec prettier --write src/components/MyComponent.tsx src/scss/components/_mycomponent.scss
pnpm lint
pnpm test
pnpm build      # compiles JS + the bestax/extras CSS bundles
```

## Visually inspect it in a browser

Types and unit tests don't see layout. **Render the component and actually look at it** before
you call it done — spacing, padding, vertical centering, alignment, and every variant/state
(colors, sizes, hover/active, dark mode). Visual bugs hide from `tsc` and `@testing-library`.

1. Run a surface that renders it: `pnpm storybook` (compiles SCSS live) or the docs dev server.
2. Open the component and inspect it. If a browser-automation tool (claude-in-chrome, Playwright)
   is available, drive the browser and screenshot each variant; otherwise open it yourself and
   eyeball it.
3. Check the usual offenders:
   - **Vertical centering of inline text** — `display: inline-block` + `line-height: 1` makes
     text sit low. For chips/labels/buttons use `display: inline-flex; align-items: center;
justify-content: center;` with a normal `line-height` (Bulma's `Tag` is the reference).
   - Padding/gaps look balanced; nothing clips or overflows.
   - Every color/size variant renders; dark mode is legible.

Fix what you see, then re-inspect. A green test suite with a misaligned component is not done.

## Checklist

- [ ] **Checked the inventory first** — searched `src/index.ts` / docs / Storybook for an existing
      match or synonym, and told the user (reuse/extend it, or confirm there's a genuine gap).
- [ ] `MyComponent.tsx` — `forwardRef`, `Omit<…, 'color'>`, `useBulmaClasses`,
      `usePrefixedClassNames`, `classNames`, spread `rest`, `displayName` set.
- [ ] `_mycomponent.scss` — `@use` Bulma utilities, `$vars !default`, `cv.register-vars`,
      `cv.getVar`, every selector prefixed with `iv.$class-prefix`.
- [ ] `MyComponent.stories.tsx` — `tags: ['autodocs']`, `argTypes`, one story per variant.
- [ ] `__tests__/MyComponent.test.tsx` — render, prop→class, helper passthrough, ref.
- [ ] `docs/docs/api/components/mycomponent.md` — Overview / Import / Props / `tsx live`.
- [ ] `src/index.ts` exports the component (in the `./components/*` group).
- [ ] `scss/components/_index.scss` `@use`s the partial.
- [ ] Prettier-formatted, then `pnpm lint && pnpm test && pnpm build` all pass.
- [ ] **Rendered and visually inspected in a browser** — centering/spacing/variants all look
      right (not just green tests).
