/**
 * Type-level tests for FloatButton's required name (#1434).
 *
 * FloatButton and FloatButton.SpeedDial take IconButton's name, `aria-label`
 * or `aria-labelledby`, which the types require, and FloatButton.BackToTop
 * has a default, so it compiles without one. They live here rather than in
 * `__tests__/` for the reason `icon-button.tsx` gives: `pnpm typecheck` reads
 * this directory, so an `@ts-expect-error` that stops being an error fails
 * the build as TS2578.
 *
 * Nothing renders these: no test file pattern reaches this directory, and the
 * coverage config excludes it.
 */
import React from 'react';
import { FloatButton, type FloatButtonProps } from '../components/FloatButton';
import { FloatButtons } from '../components/FloatButtons';
import { Badge } from '../components/Badge';
import { Icon } from '../elements/Icon';

// --------------------------------------------------------------------------
// Either name alone compiles, and the props follow `as`.
// --------------------------------------------------------------------------

export const accepted = (
  <FloatButtons position="bottom-left" mb="6">
    <FloatButton.BackToTop />
    <FloatButton.BackToTop
      aria-label="Nach oben"
      visibilityHeight={200}
      moveFocus={false}
      showLabel
      ref={React.createRef<HTMLButtonElement>()}
    />
    <Badge content={3} overlap="circle">
      <FloatButton aria-label="Inbox" icon="inbox" size="small" />
    </Badge>
    <FloatButton aria-labelledby="compose-name" color="primary">
      <Icon name="pen" />
    </FloatButton>
    <FloatButton
      as="a"
      href="/new"
      aria-label="New"
      icon="plus"
      ref={React.createRef<HTMLAnchorElement>()}
    />
    <FloatButton.SpeedDial
      aria-label="Create"
      icon="plus"
      direction="left"
      open
      onOpenChange={open => void open}
      ref={React.createRef<HTMLDivElement>()}
    >
      <FloatButton aria-label="Note" icon="note-sticky" />
    </FloatButton.SpeedDial>
    <FloatButton.SpeedDial aria-labelledby="create-name" icon="plus">
      <FloatButton aria-label="Task" icon="check" />
    </FloatButton.SpeedDial>
  </FloatButtons>
);

// --------------------------------------------------------------------------
// A FloatButton or a dial without a name, or with both, doesn't.
// --------------------------------------------------------------------------

export const rejected = (
  <>
    {/* @ts-expect-error a FloatButton needs aria-label or aria-labelledby */}
    <FloatButton icon="plus" />
    {/* @ts-expect-error not both names */}
    <FloatButton icon="plus" aria-label="New" aria-labelledby="new-name" />
    {/* @ts-expect-error a dial needs aria-label or aria-labelledby */}
    <FloatButton.SpeedDial icon="plus" />
    {/* @ts-expect-error a size outside the union */}
    <FloatButton icon="plus" aria-label="New" size="normal" />
    {/* @ts-expect-error a direction outside the four */}
    <FloatButton.SpeedDial aria-label="Create" direction="around" />
    {/* @ts-expect-error back to top renders a button, with no `as` */}
    <FloatButton.BackToTop as="a" />
    {/* @ts-expect-error is-active is what shows back to top, so it isn't a prop */}
    <FloatButton.BackToTop isActive />
    {/* @ts-expect-error back to top's glyph is `icon`, not children */}
    <FloatButton.BackToTop>↑</FloatButton.BackToTop>
    {/* @ts-expect-error a link's attributes need `as="a"` */}
    <FloatButton aria-label="New" icon="plus" href="/new" />
  </>
);

// --------------------------------------------------------------------------
// The props type keeps the name required for consumers building on it.
// --------------------------------------------------------------------------

// @ts-expect-error the props type needs a name too
export const unnamed: FloatButtonProps = { icon: 'plus' };
export const named: FloatButtonProps = { icon: 'plus', 'aria-label': 'New' };
