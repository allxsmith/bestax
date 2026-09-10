/**
 * Type-level tests for the polymorphic `as` contract (#641).
 *
 * These assert types, not behaviour, so they deliberately live OUTSIDE
 * `__tests__/`: `bulma-ui/tsconfig.json` excludes that directory and every
 * `*.test.tsx`, and ts-jest runs transpile-only (the repo sets
 * `isolatedModules`), so an `@ts-expect-error` in a test file is checked by
 * nothing. Here `tsc --noEmit` reads the file — which means `pnpm typecheck`
 * and the React 18/19 matrix both enforce it, and an `@ts-expect-error` that
 * stops being an error fails the build as TS2578.
 *
 * Nothing renders these; jest's testMatch does not reach this directory and
 * `collectCoverageFrom` excludes it.
 */
import React from 'react';
import { Avatar } from '../components/Avatar';
import { Menu } from '../components/Menu';
import { Navbar } from '../components/Navbar';
import { Reveal } from '../components/Reveal';
import { Button } from '../elements/Button';
import { Link } from '../elements/Link';
import { LinkButton } from '../elements/LinkButton';

/** A component that forwards no ref, the way most hand-written ones do. */
const PlainFC = (props: { children?: React.ReactNode }) => (
  <span>{props.children}</span>
);

/** A router-style link, standing in for `react-router`'s `Link`. */
const RouterLink = React.forwardRef<
  HTMLAnchorElement,
  { to: string; children?: React.ReactNode }
>(function RouterLink({ to, children }, ref) {
  return (
    <a href={to} ref={ref}>
      {children}
    </a>
  );
});

// --------------------------------------------------------------------------
// Correct code must compile. Every one of these was rejected before #641, or
// only compiled because an index signature turned excess-property checking off.
// --------------------------------------------------------------------------

export const accepted = (
  <>
    {/* The ref follows `as`, including to an element the component never mentions. */}
    <Button as="div" ref={React.createRef<HTMLDivElement>()} />
    <Button ref={React.createRef<HTMLButtonElement>()} />
    <Button as="a" href="/x" target="_blank" rel="noreferrer" />
    <Button as={RouterLink} to="/visit" color="primary" />
    <LinkButton as={RouterLink} to="/dash" variant="underline" />
    <LinkButton as="a" href="/x" ref={React.createRef<HTMLAnchorElement>()} />

    <Link as="span" ref={React.createRef<HTMLSpanElement>()} />
    <Link href="/x" ref={React.createRef<HTMLAnchorElement>()} />

    {/* Inferred from the component, not waved through by an index signature. */}
    <Navbar.Item as={RouterLink} to="/pricing" />
    <Navbar.Item as="span" />
    <Navbar.Link
      as="button"
      type="button"
      ref={React.createRef<HTMLButtonElement>()}
    />
    <Navbar.Link href="/x" />

    <Menu.Item as={RouterLink} to="/dashboard" active>
      Dashboard
    </Menu.Item>
    <Menu.Item as="a" href="/foo" tabIndex={-1}>
      Foo
    </Menu.Item>

    <Avatar name="Ada" href="https://example.com" />
    <Avatar name="Ada" as="button" type="button" />

    <Reveal as="section" id="s" />
    <Reveal animation="fade" />
  </>
);

// --------------------------------------------------------------------------
// Incorrect code must be rejected. An unused directive here is a build error,
// so each of these is also proof the rejection is real.
// --------------------------------------------------------------------------

// A union-typed `as` — a ternary, or a variable typed `'a' | 'button'` — must
// keep each member's own props. `Omit<A | B, K>` keys off `keyof (A | B)`,
// which is only the keys COMMON to both, so a non-distributive form silently
// dropped `href` here. This is the one shape that worked before #641 and
// briefly stopped working during it.
declare const cond: boolean;
export const unionAs = (
  <>
    <Button as={cond ? 'a' : 'button'} href="/x" />
    <Button as={cond ? 'a' : 'span'} />
  </>
);

// `ComponentProps<typeof Button>` must resolve to real props. With only a
// generic call signature it instantiated at the constraint and collapsed to
// `any`, so a consumer deriving their own prop type from ours lost every check.
type DerivedButtonProps = React.ComponentProps<typeof Button>;
export const derived: DerivedButtonProps = {
  color: 'primary',
  children: 'ok',
  // @ts-expect-error a bogus key must not survive the derivation
  totallyBogus: true,
};

// The same derivation guard for the ref-less variant. `Reveal` is cast through
// `PolymorphicComponentWithoutRef`, whose second overload exists for exactly
// this and is otherwise exercised by nothing — so it could regress to `any`
// with every gate green.
type DerivedRevealProps = React.ComponentProps<typeof Reveal>;
export const derivedReveal: DerivedRevealProps = {
  animation: 'fade',
  children: 'ok',
  // @ts-expect-error a bogus key must not survive the derivation
  totallyBogus: true,
};

// A wrapping HOC instantiates the type parameter and hands back one widened
// prop type, so the checks stop at the wrapper. Inherent to the pattern; the
// cast is the documented way back. Pinned here so the workaround cannot rot.
const MemoButton = React.memo(Button) as typeof Button;

export const hocWorkaround = (
  <>
    <MemoButton as="a" href="/x" />
    <MemoButton ref={React.createRef<HTMLButtonElement>()} />
    {/* @ts-expect-error the re-assertion restores what React.memo erased */}
    <MemoButton as="div" href="/x" />
  </>
);

export const rejected = (
  <>
    {/* @ts-expect-error href is not an attribute of a div */}
    <Button as="div" href="/x" />
    {/* @ts-expect-error a div ref is not a button ref */}
    <Button ref={React.createRef<HTMLDivElement>()} />
    {/* @ts-expect-error type/name are button-only, and the target takes neither */}
    <Button as="a" type="submit" name="foo" />
    {/* @ts-expect-error `to` belongs to the router link, not to a plain button */}
    <Button to="/x" />

    {/* @ts-expect-error LinkButton follows Button: no href on a div */}
    <LinkButton as="div" href="/x" />

    {/* @ts-expect-error a span takes no href */}
    <Link as="span" href="/x" />

    {/* @ts-expect-error a span takes no href, target or rel */}
    <Navbar.Link as="span" href="/x" target="_blank" rel="noreferrer" />
    {/* @ts-expect-error an anchor ref is not a button ref */}
    <Navbar.Link as="button" ref={React.createRef<HTMLAnchorElement>()} />
    {/* @ts-expect-error `dropdown` is not a prop of Navbar.Item or of a div */}
    <Navbar.Item dropdown as="div" />
    {/* @ts-expect-error `to` is not an anchor attribute; the default `as` is 'a' */}
    <Navbar.Item to="/x" />

    {/* @ts-expect-error a span takes no href */}
    <Menu.Item as="span" href="/x">
      Nope
    </Menu.Item>

    {/* @ts-expect-error a div takes no href */}
    <Reveal as="div" href="/x" />

    {/* A plain function component cannot receive a ref — React's own types
        reject it, and a ref passed here would leave `ref.current` null
        forever. `PolymorphicRef` resolves to `never` for such a target. */}
    {/* @ts-expect-error PlainFC forwards no ref */}
    <Button as={PlainFC} ref={React.createRef<HTMLSpanElement>()} />

    {/* The deprecated presentational HTML `color` attribute must not arrive
        through the element's props on a component whose own props declare no
        Bulma `color` — it would render as a helper class. */}
    {/* @ts-expect-error not a Bulma color */}
    <Navbar.Link color="not-a-bulma-color" />
    {/* @ts-expect-error same on Link, whose own props omit color too */}
    <Link color="nope" />
  </>
);
