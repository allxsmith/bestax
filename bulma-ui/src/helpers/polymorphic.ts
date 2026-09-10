import type React from 'react';

/**
 * The ref type of whatever element `as` renders.
 *
 * Derived from `ComponentPropsWithRef` rather than `React.ComponentRef` so it
 * resolves on every `@types/react` a consumer may be on: this package supports
 * React 18 and 19, and the CI matrix pins only `react`/`react-dom`, never the
 * types, so a types-only regression here would not be caught.
 *
 * `never` when the target takes no ref. A plain function component has no `ref`
 * key at all, and React's own types reject `<PlainFC ref={…} />`; without the
 * guard the indexed access degraded to `unknown` and we accepted a ref that
 * silently does nothing — `ref.current` stays null and a later `.focus()`
 * throws. Matching React's strictness is the point.
 */
export type PolymorphicRef<T extends React.ElementType> =
  'ref' extends keyof React.ComponentPropsWithRef<T>
    ? React.ComponentPropsWithRef<T>['ref']
    : never;

/**
 * A component's own props, plus the attributes of the element `as` names.
 *
 * `Own` wins every collision — a component that declares `color` as a Bulma
 * variant keeps it, rather than inheriting the DOM attribute of the same name.
 * `color` is dropped from the element's side unconditionally, because every
 * component here treats `color` as a Bulma concept and routes it through
 * `useBulmaClasses`; without that, a component whose own props do NOT declare
 * one (Link, Navbar.Item, Navbar.Link) inherited the deprecated presentational
 * HTML attribute, so `<Navbar.Link color="not-a-bulma-color">` type-checked and
 * then rendered `has-text-not-a-bulma-color`.
 *
 * Distributive over `T` on purpose. `Omit<A | B, K>` keys off `keyof (A | B)`,
 * which is only what A and B share — so a union-typed `as` (a ternary, or a
 * variable typed `'a' | 'button'`) silently lost every prop that belongs to
 * just one member, `href` among them. Distributing produces a union of prop
 * shapes instead, and each member keeps its own.
 *
 * Each component writes this intersection out in its own `*Props` alias rather
 * than referring to this type: the API-docs extractor
 * (`scripts/lib/props-extract.mjs`) walks heritage syntactically, and a generic
 * alias leaves it resolving a type parameter it cannot see through.
 * This type is here for the component's cast target and for consumers writing
 * wrappers.
 */
export type PolymorphicProps<
  T extends React.ElementType,
  Own,
> = T extends unknown
  ? Own &
      Omit<React.ComponentPropsWithoutRef<T>, keyof Own | 'as' | 'color'> & {
        /** The element or component to render. */
        as?: T;
      }
  : never;

/**
 * A component whose props and forwarded ref both follow `as`.
 *
 * `forwardRef` cannot express a generic component, so the implementation is
 * cast to this. `displayName` is part of the type because the library sets it
 * on every `forwardRef` component, and `withSubComponents` constrains its base
 * to `{ displayName?: string }`.
 *
 * The second, non-generic signature exists for type DERIVATION rather than for
 * calls. `React.ComponentProps<typeof Button>` infers from the last overload;
 * with only the generic one it instantiated at the constraint and collapsed to
 * `any`, so a consumer building their own prop type on ours lost every check.
 * Calls still resolve against the generic signature first, so ordering here is
 * load-bearing — swapping the two puts the collapse back.
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
  (
    props: PolymorphicProps<Default, Own> & { ref?: PolymorphicRef<Default> }
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
