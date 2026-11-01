/**
 * Type-level tests for Stack, Group, Center and Flex, whose `as` is a closed
 * set of elements that don't share one prop surface: a `<form>` takes
 * `action`, an `<ol>` takes `start` and a `<fieldset>` takes `disabled`, and
 * each gives the ref a different element. So the props and the ref follow
 * `as` (`ConstrainedPolymorphicComponent`), the way `Dropdown.Item`'s do.
 * `polymorphic.tsx` says why these live outside `__tests__/`; an
 * `@ts-expect-error` that stops being an error fails the build as TS2578.
 */
import React from 'react';
import { Stack, type StackProps } from '../layout/Stack';
import { Group } from '../layout/Group';
import { Center } from '../layout/Center';
import { Flex } from '../layout/Flex';
import type { LayoutElement } from '../index';

/** A component, which `as` doesn't take. */
const Custom = (props: { children?: React.ReactNode }) => (
  <div>{props.children}</div>
);

// --------------------------------------------------------------------------
// Correct code must compile.
// --------------------------------------------------------------------------

export const accepted = (
  <>
    <Stack />
    <Stack
      ref={React.createRef<HTMLDivElement>()}
      gap="2"
      alignItems="center"
      justifyContent="flex-end"
    />
    <Stack gap={1.5} gapless={false} />
    <Stack
      as="form"
      action="/search"
      method="get"
      ref={React.createRef<HTMLFormElement>()}
    />
    <Group
      as="fieldset"
      disabled
      name="actions"
      ref={React.createRef<HTMLFieldSetElement>()}
    />
    <Group breakpoint="tablet" isFullwidth flexWrap="nowrap" />
    <Flex
      as="ol"
      start={3}
      reversed
      ref={React.createRef<HTMLOListElement>()}
    />
    <Flex flexDirection="column-reverse" alignContent="center" rowGap="1" />
    <Center
      as="section"
      aria-label="Loading"
      ref={React.createRef<HTMLElement>()}
    />
    <Center display="inline-flex" textColor="success" bgColor="light" />
    <Stack as="ul" ref={React.createRef<HTMLUListElement>()}>
      <li>One</li>
    </Stack>
  </>
);

// The bare alias keeps every element `as` takes, as Dropdown.Item's does.
export const aliasTakesEveryElement: StackProps[] = (
  ['div', 'ul', 'form', 'fieldset'] as LayoutElement[]
).map(as => ({ as }));

// `ComponentProps` resolves to real props through the derivation overload,
// rather than collapsing to `any`.
export const derived: React.ComponentProps<typeof Group> = {
  gap: '1',
  isFullwidth: true,
};

// --------------------------------------------------------------------------
// Incorrect code must be rejected.
// --------------------------------------------------------------------------

export const rejected = (
  <>
    {/* @ts-expect-error a div takes no action */}
    <Stack action="/search" />
    {/* @ts-expect-error a section takes no disabled */}
    <Group as="section" disabled />
    {/* @ts-expect-error a span isn't one of the elements `as` takes */}
    <Flex as="span" />
    {/* @ts-expect-error nor is a component: that would be a general primitive */}
    <Center as={Custom} />
    {/* @ts-expect-error a list's ref isn't a div's */}
    <Stack as="ul" ref={React.createRef<HTMLDivElement>()} />
    {/* @ts-expect-error Stack is always a column */}
    <Stack flexDirection="row" />
    {/* @ts-expect-error Group is a row, or a column below its breakpoint */}
    <Group flexDirection="column" />
    {/* @ts-expect-error Center never reorders */}
    <Center flexDirection="row-reverse" />
    {/* @ts-expect-error only Group has a breakpoint */}
    <Stack breakpoint="tablet" />
    {/* @ts-expect-error the breakpoints are Container's */}
    <Group breakpoint="mobile" />
    {/* @ts-expect-error only Group shares the row equally */}
    <Flex isFullwidth />
    {/* @ts-expect-error `color` would be the presentational attribute; use textColor */}
    <Stack color="primary" />
    {/* @ts-expect-error gap takes Bulma's gap steps */}
    <Group gap="9" />
  </>
);

// @ts-expect-error gap takes Bulma's gap steps, through the derived props too
export const derivedRejects: React.ComponentProps<typeof Flex> = { gap: '10' };
