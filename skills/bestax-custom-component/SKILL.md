---
name: bestax-custom-component
description: Build a custom React component in the bestax/Bulma style. In an app using @allxsmith/bestax-bulma — compose existing components, helper props, public hooks (useBulmaClasses, usePrefixedClassNames), and --bulma-* CSS variables. In the bestax monorepo — the full component pipeline (SCSS partial, stories, tests, docs, wiring). Use when creating a component beyond stock Bulma or extending one.
license: MIT
---

# Building a custom component the bestax way

This skill teaches how to build a component that isn't in the library — composed from bestax
pieces in an app, or as a full library "extra" inside the bestax monorepo.

## Which context are you in?

- **The bestax monorepo** (the repo contains `bulma-ui/src/`) → follow
  `references/library-contributor.md` instead of this file: five-file layout, SCSS partial,
  stories, jest tests, docs page, wiring.
- **An app depending on `@allxsmith/bestax-bulma`** (e.g. scaffolded by `npm create bestax`) →
  continue here. Everything below assumes public package imports and a plain Vite app.

For **form** components (Field/Control/Input/etc.) use the `bestax-form` skill instead.

## Check for an existing component first

Before building anything, **search the library for a component that already does this — or a
close synonym** — and tell the user what you found. Many requests are covered by an existing
element, or are best built by composing existing ones. Building a near-duplicate (a "label" when
`Tag` exists, a "banner" when `Notification` exists) fragments the API and is usually the wrong
call.

Where to look:

- `references/component-catalog.md` — **start here.** Every documented component with a one-line
  purpose, grouped by category. Scan it for the name and its synonyms before anything else.
- https://bestax.io/docs/api — one doc page per shipped component (full props).

Then decide, and **surface the decision to the user**:

- **Exact / synonym match exists** → recommend using it. Don't build a duplicate. (E.g. a small
  colored label/badge/chip → `Tag` / `Tags` already exist.)
- **Partial overlap** → prefer **composing** the existing pieces inside your new component
  rather than re-implementing them. (E.g. a "profile card" → there's no `ProfileCard`, but
  `Card`, `Image`, `Title`, `SubTitle`, and `Content` exist; build `ProfileCard` to compose them.)
- **Genuine gap** → build the new component using the pattern below.

State plainly which case applies before writing code, e.g. _"`Tag` already covers a colored
label — use that instead"_ or _"No `ProfileCard` exists; I'll build one composing the existing
`Card`/`Image`/`Title` elements."_

## Composition first

Build from existing components before writing any CSS: `Box`, `Card`, `Title`, `SubTitle`,
`Icon`, `Block`, `Content`, `Tag`, plus the Bulma helper props every component accepts (spacing,
color, typography, flexbox). Most "custom components" are a composition function — zero new
styles. See `examples/stat-card.tsx` for a complete worked example.

## The component spine

Same shape the library itself uses, with all imports from the package. File at
`src/components/MyComponent.tsx`:

```tsx
import type React from 'react';
import {
  classNames,
  usePrefixedClassNames,
  useBulmaClasses,
  type BulmaClassesProps,
} from '@allxsmith/bestax-bulma';

export interface MyComponentProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
}

export function MyComponent({
  color,
  className,
  children,
  ...props
}: MyComponentProps) {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const mainClasses = usePrefixedClassNames('mycomponent', {
    [`is-${color}`]: !!color,
  });
  return (
    <div
      className={classNames(mainClasses, bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </div>
  );
}
```

This gives your component the full Bulma helper-prop surface (`m`, `p`, `textAlign`, …) for
free. `references/api.md` documents the helpers.

## Styling ladder — use the lowest rung that works

**Rung 1 — helper props only (default).** House rules: never `style={{}}`. Layout with
`Block`/`Box` and `display="flex"`, `flexDirection`, `alignItems`, `justifyContent`. There is
**no `gap` helper** — space children with `m*`/`p*` margins instead.

**Rung 2 — a plain CSS file**, scoped under the component's class, consuming `--bulma-*`
variables — never literal colors, so `Theme` and dark mode keep working:

```css
/* src/components/MyComponent.css — import from the .tsx file */
.mycomponent {
  /* component-scoped custom props, initialized from Bulma tokens:
     any ancestor (or Theme) can re-theme by overriding them */
  --mycomponent-radius: var(--bulma-radius);
  --mycomponent-accent: var(--bulma-primary);
  border-radius: var(--mycomponent-radius);
  border: 1px solid var(--bulma-border);
  background: var(--bulma-scheme-main);
  color: var(--bulma-text);
}
.mycomponent .mycomponent-value {
  color: var(--mycomponent-accent);
}
```

Caveat: with the prefixed CSS flavor / `ConfigProvider classPrefix`, `usePrefixedClassNames`
prefixes your classes too — your CSS selectors must match (or build them with plain
`classNames` instead).

**Rung 3 — real Sass (optional).** `npm i -D sass` — nothing else; Vite compiles imported
`.scss` zero-config, and `bulma` is resolvable because it's a runtime dependency of
bestax-bulma. Then the full `register-vars`/`getVar` pattern from
`references/library-contributor.md` works in-app. Prefixed flavor:
`@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: 'bestax-')`.

## Verify in the browser

Types don't see layout. Run `npm run dev`, render the component, and actually look at it:
vertical centering of inline text (use `display="flex" alignItems="center"`, not line-height
hacks), balanced padding, nothing clipping, every color/size variant, and **dark mode**
legibility. Fix what you see, then re-check.

## Tests and stories in an app

The scaffolded app has **no test runner and no Storybook** — do not install or scaffold them
unasked. If the app already has vitest/jest + Testing Library, write the four test shapes:
render, prop→class mapping, helper-prop passthrough (`m="3"` → `m-3`), and the
`ConfigProvider classPrefix` case if the app uses a prefix.

## Checklist

- [ ] Inventory checked (catalog + bestax.io/docs/api) and the decision surfaced to the user.
- [ ] All imports from `@allxsmith/bestax-bulma` (no deep/internal paths).
- [ ] Composition first — existing components + helper props before any CSS.
- [ ] No inline `style={{}}` anywhere.
- [ ] Lowest sufficient ladder rung (helper props → scoped CSS vars → Sass).
- [ ] All colors/radii derived from `--bulma-*` variables — no literals.
- [ ] Renders correctly via `npm run dev`, including dark mode.
