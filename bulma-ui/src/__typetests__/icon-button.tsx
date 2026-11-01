/**
 * Type-level tests for IconButton's required name (#1422).
 *
 * IconButton requires `aria-label`, or `aria-labelledby` in its place, and
 * these hold the types to that with `as` left alone and with `as="a"`. They
 * live here rather than in `__tests__/` for the reason `polymorphic.tsx`
 * gives: `pnpm typecheck` reads this directory, so an `@ts-expect-error` that
 * stops being an error fails the build as TS2578. Which property the error
 * names is checked by `elements/__tests__/IconButton.types.test.ts`, since a
 * directive can't see the message.
 *
 * Nothing renders these: no test file pattern reaches this directory, and the
 * coverage config excludes it.
 */
import React from 'react';
import {
  IconButton,
  type IconButtonName,
  type IconButtonOwnProps,
  type IconButtonProps,
} from '../elements/IconButton';
import { Icon } from '../elements/Icon';

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
// Either name alone compiles, with every way of giving the icon.
// --------------------------------------------------------------------------

export const accepted = (
  <>
    <IconButton icon="trash" aria-label="Delete" />
    <IconButton icon="trash" aria-labelledby="delete-label" />
    <IconButton aria-label="Settings">
      <Icon name="cog" />
    </IconButton>
    <IconButton icon={<svg viewBox="0 0 24 24" />} aria-label="Share" />
    <IconButton
      icon="search"
      aria-label="Search"
      type="submit"
      color="primary"
      size="small"
      isRounded
      isLoading
      m="2"
      ref={React.createRef<HTMLButtonElement>()}
    />
    {/* The DOM attributes and the ref follow `as`, as on Button. */}
    <IconButton
      as="a"
      href="/settings"
      icon="cog"
      aria-label="Settings"
      ref={React.createRef<HTMLAnchorElement>()}
    />
    <IconButton as="a" href="/x" icon="cog" aria-labelledby="settings" />
    <IconButton as={RouterLink} to="/home" icon="home" aria-label="Home" />
    {/* On an anchor, `type` is the MIME hint. */}
    <IconButton
      as="a"
      href="/report.pdf"
      type="application/pdf"
      icon="download"
      aria-label="Download the report"
    />
  </>
);

// --------------------------------------------------------------------------
// Neither, or both, is an error. An unused directive here is a build error,
// so each of these is also proof the rejection is real.
// --------------------------------------------------------------------------

export const rejected = (
  <>
    {/* @ts-expect-error a button with no name */}
    <IconButton icon="trash" />
    {/* @ts-expect-error an anchor with no name */}
    <IconButton as="a" href="/x" icon="trash" />
    {/* @ts-expect-error both names: aria-labelledby would win silently */}
    <IconButton icon="trash" aria-label="Delete" aria-labelledby="other" />
    {/* @ts-expect-error both names, on an anchor */}
    <IconButton
      as="a"
      href="/x"
      icon="cog"
      aria-label="Go"
      aria-labelledby="y"
    />
    {/* @ts-expect-error an anchor has no `formAction`, as on Button */}
    <IconButton as="a" href="/x" aria-label="Go" formAction="/post" />
  </>
);

// --------------------------------------------------------------------------
// The props type is for building on: CopyButton and FloatButton render
// through IconButton, and a wrapper has to carry the requirement along.
// --------------------------------------------------------------------------

/** A wrapper that sets the icon and takes the rest, name included. */
type TrashButtonProps = Omit<IconButtonOwnProps, 'icon'> & IconButtonName;
const TrashButton = (props: TrashButtonProps) => (
  <IconButton icon="trash" {...props} />
);
export const wrapped = (
  <>
    <TrashButton aria-label="Delete" color="danger" />
    <TrashButton aria-labelledby="row-3" />
    {/* @ts-expect-error the wrapper keeps the requirement */}
    <TrashButton color="danger" />
  </>
);

/** A wrapper that names the button itself, from a prop of its own. */
const ShareButton = ({
  what,
  ...props
}: Omit<IconButtonOwnProps, 'icon'> & { what: string }) => (
  <IconButton icon="share" aria-label={`Share ${what}`} {...props} />
);
export const named = <ShareButton what="this page" isRounded />;

/** Forwarding an optional name doesn't satisfy the requirement. */
const Loose = ({ name }: { name?: string }) => (
  // @ts-expect-error `string | undefined` isn't a name
  <IconButton icon="trash" aria-label={name} />
);
export const loose = <Loose />;

// The alias at its default element, and derived from the component, both
// keep the requirement and resolve to real props rather than `any`.
export const aliasProps: IconButtonProps = {
  icon: 'trash',
  'aria-label': 'Delete',
};
// @ts-expect-error the alias requires a name
export const aliasUnnamed: IconButtonProps = { icon: 'trash' };

type DerivedProps = React.ComponentProps<typeof IconButton>;
export const derived: DerivedProps = {
  'aria-label': 'Delete',
  color: 'danger',
  // @ts-expect-error a bogus key must not survive the derivation
  totallyBogus: true,
};
