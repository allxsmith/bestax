import type React from 'react';

/**
 * The ref type of whatever element `as` renders.
 *
 * Derived from `ComponentPropsWithRef` rather than `React.ComponentRef` so it
 * resolves on every `@types/react` a consumer may be on: this package supports
 * React 18 and 19, and the CI matrix pins only `react`/`react-dom`, never the
 * types, so a types-only regression here would not be caught.
 */
export type PolymorphicRef<T extends React.ElementType> =
  React.ComponentPropsWithRef<T>['ref'];

/**
 * A component's own props, plus the attributes of the element `as` names.
 *
 * `Own` wins every collision — a component that declares `color` as a Bulma
 * variant keeps it, rather than inheriting the DOM attribute of the same name.
 *
 * Each component writes this intersection out in its own `*Props` alias rather
 * than referring to this type: the API-docs extractor
 * (`scripts/lib/props-extract.mjs`) walks heritage syntactically, and a generic
 * alias leaves it resolving a type parameter it cannot see through.
 * This type is here for the component's cast target and for consumers writing
 * wrappers.
 */
export type PolymorphicProps<T extends React.ElementType, Own> = Own &
  Omit<React.ComponentPropsWithoutRef<T>, keyof Own | 'as'> & {
    /** The element or component to render. */
    as?: T;
  };

/**
 * A component whose props and forwarded ref both follow `as`.
 *
 * `forwardRef` cannot express a generic component, so the implementation is
 * cast to this. `displayName` is part of the type because the library sets it
 * on every `forwardRef` component, and `withSubComponents` constrains its base
 * to `{ displayName?: string }`.
 *
 * **A wrapping HOC erases the genericity.** `React.memo(Button)`,
 * `React.lazy`, a `styled()` wrapper — anything that infers its props through
 * `ComponentProps<T>` — instantiates the type parameter once and hands back a
 * component with a single widened prop type. Calls still work, but the checks
 * stop: `<MemoButton as="div" href="/x" />` compiles where `<Button>` rejects
 * it. This is inherent to polymorphic components in TypeScript, not something
 * this library can fix. Re-assert the type to get the checks back:
 *
 * ```tsx
 * const MemoButton = React.memo(Button) as typeof Button;
 * ```
 */
export interface PolymorphicComponent<Own, Default extends React.ElementType> {
  <T extends React.ElementType = Default>(
    props: PolymorphicProps<T, Own> & { ref?: PolymorphicRef<T> }
  ): React.ReactElement | null;
  displayName?: string;
}

/**
 * A component whose props follow `as` but which forwards no ref.
 *
 * For components that own the node they observe — `Reveal` keeps its own ref on
 * the element it watches for scroll intersection, which is not always the
 * element `as` names.
 */
export interface PolymorphicComponentWithoutRef<
  Own,
  Default extends React.ElementType,
> {
  <T extends React.ElementType = Default>(
    props: PolymorphicProps<T, Own>
  ): React.ReactElement | null;
  displayName?: string;
}
