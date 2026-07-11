# Reference: Dialog, the canonical worked example

**Library-contributor worked example** — the in-monorepo counterpart to `examples/stat-card.tsx`;
follow it together with `library-contributor.md`.

`Dialog` is the library's reference implementation of the custom-component pattern. Read the
real files alongside this:

- `bulma-ui/src/components/Dialog.tsx`
- `bulma-ui/src/scss/components/_dialog.scss`
- `bulma-ui/src/components/Dialog.stories.tsx`
- `bulma-ui/src/components/__tests__/Dialog.test.tsx`
- `docs/docs/api/components/dialog.md`

## What Dialog demonstrates

### Props interface

```tsx
export type DialogType = 'default' | 'success' | 'danger' | 'warning' | 'info';

export interface DialogProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  isOpen: boolean;
  title?: string;
  message: string | React.ReactNode;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  canCancel?: boolean;
  focusCancel?: boolean;
  icon?: React.ReactNode;
}
```

It omits `color` from both `HTMLAttributes` and `BulmaClassesProps` and exposes its own typed
`type` variant instead — the standard move when a component has bespoke color/variant semantics.

### Render body

```tsx
export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  (
    { isOpen, title, message, type = 'default', /* ... */ className, ...props },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const dialogClasses = usePrefixedClassNames('dialog', {
      [`is-${type}`]: type !== 'default',
    });
    const combined = classNames(dialogClasses, bulmaHelperClasses, className);
    // ...keyboard handling, focus management, scroll lock, render via <Modal>
  }
);
```

Note the order — `usePrefixedClassNames` for the component's own classes, then `classNames`
merges them with the helper classes and the caller's `className`. `rest` (not `props`) is what
gets spread onto the DOM node.

### SCSS

`_dialog.scss` is the model for the CSS-variable pattern:

```scss
@use 'bulma/sass/utilities/initial-variables' as iv;
@use 'bulma/sass/utilities/css-variables' as cv;

$dialog-width: 420px !default;
$dialog-radius: cv.getVar('radius') !default;
$dialog-background: cv.getVar('scheme-main') !default;
$dialog-title-color: cv.getVar('text-strong') !default;

.#{iv.$class-prefix}dialog {
  @include cv.register-vars(
    (
      'dialog-width': #{$dialog-width},
      'dialog-radius': #{$dialog-radius},
      'dialog-background': #{$dialog-background},
      'dialog-title-color': #{$dialog-title-color},
    )
  );
}

.#{iv.$class-prefix}dialog {
  width: cv.getVar('dialog-width');
  background-color: cv.getVar('dialog-background');
  border-radius: cv.getVar('dialog-radius');
}

// Variant: colorize the header per type, reusing Bulma's color vars.
.#{iv.$class-prefix}dialog.#{iv.$class-prefix}is-success
  .#{iv.$class-prefix}dialog-header {
  color: cv.getVar('success');
}

@media (prefers-reduced-motion: reduce) {
  .#{iv.$class-prefix}dialog {
    animation: none;
  }
}
```

Takeaways:

1. Local layout values (`$dialog-width`) and Bulma references (`cv.getVar("radius")`) both get a
   `!default` SCSS var, then are registered so they're overridable at runtime.
2. Multi-part components (`-header`, `-body`, `-footer`, `-title`, `-icon`) prefix **every**
   sub-selector with `iv.$class-prefix`.
3. Variant classes (`is-success`, etc.) are also prefixed, and reuse Bulma's registered color
   vars (`cv.getVar("success")`) rather than hard-coded hex.

### Beyond the basics

Dialog also shows optional patterns you can borrow when relevant:

- An **imperative API** (`dialog.alert`, `dialog.confirm`, `dialog.close`) plus a
  `DialogContainer` for programmatic mounting, exported from the same module.
- **Accessibility**: `role="alertdialog"`, Escape-to-cancel, and focus management on open.
- **Body scroll lock** via a module-level ref count so chained/overlapping dialogs behave.

These are not required for every component — start from the simple template in
`library-contributor.md` and add only what your component needs.

## Other components worth reading for variety

- `Switch`, `Slider`, `Rate` — components with their own typed `color`/`size`/variant unions.
- `Carousel`, `Tabs` — components with internal state and sub-elements.

All of them follow the same `useBulmaClasses` + `usePrefixedClassNames` + `classNames` spine and
the same SCSS register-vars/getVar convention shown above.
