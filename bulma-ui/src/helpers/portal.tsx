import React from 'react';
import { createPortal } from 'react-dom';
import { useIsHydrated } from './useIsHydrated';

/**
 * Resolves a portal target: an `HTMLElement` is used directly, a non-empty
 * `string` is treated as a `document.querySelector` selector (falling back to
 * `document.body` when it matches nothing), and any falsy value — `undefined`
 * or the empty string — resolves to `document.body`.
 *
 * The empty string is deliberately treated as "no target" rather than passed
 * through: `document.querySelector('')` throws a `SyntaxError`, and callers
 * building a selector from state can easily hand us `''`.
 *
 * @function resolvePortalContainer
 * @param container - The requested portal target, if any.
 * @returns The resolved DOM node to portal into.
 */
export function resolvePortalContainer(
  container?: string | HTMLElement
): HTMLElement {
  if (!container) {
    return document.body;
  }
  if (typeof container === 'string') {
    return (
      (document.querySelector(container) as HTMLElement | null) ?? document.body
    );
  }
  return container;
}

/**
 * Props for the Portal component.
 */
export interface PortalProps {
  /** Content to render into the container. */
  children?: React.ReactNode;
  /**
   * Where the content goes: an element, or a `document.querySelector`
   * selector. Omitted, empty, or a selector that matches nothing, it goes to
   * `document.body`. A selector is looked up again on each render, so the
   * content follows the target when it changes. Moving to another target
   * remounts the children and resets their state, which includes a selector
   * that only starts matching after the content has shown in `document.body`.
   * Render the target first, or pass the element once you have it.
   */
  container?: string | HTMLElement;
  /**
   * Render the children in place instead, on the server as well as the
   * client. Lets a component that portals only sometimes keep a single code
   * path.
   * @defaultValue false
   */
  disabled?: boolean;
}

/**
 * Renders its children into another part of the page, `document.body` unless `container` says otherwise, so floating content escapes an ancestor's `overflow`, `transform` or stacking context.
 *
 * A portal has nothing to render on the server, so `Portal` renders nothing
 * there and during hydration, and mounts its children in the commit that
 * follows. The first client render then matches the server markup. In an app
 * without server rendering it portals on the first render.
 *
 * React context, such as `ConfigProvider`'s class prefix, reaches the
 * portaled children, and their React events bubble through the React tree.
 * CSS inheritance follows the DOM instead: a scoped (non-`isRoot`) `Theme`
 * sets its variables on a wrapper element the portaled content has left, so
 * that content sees the page-level theme. Point `container` at an element
 * inside the themed area to keep it.
 *
 * Tab order and focus follow the DOM too. Content portaled from inside a
 * focus trap is no longer inside the trapped element, so the trap neither
 * reaches it nor holds focus there: render nested overlays inside the
 * trapped element, or give them a trap of their own.
 *
 * @function
 * @param {PortalProps} props - Props for the Portal component.
 * @returns The portal, the children in place when `disabled`, or nothing
 * before hydration.
 *
 * @example
 * <Portal>
 *   <div className="box">Rendered at the end of document.body</div>
 * </Portal>
 *
 * @example
 * // Into a dedicated overlay root
 * <Portal container="#overlays">
 *   <CommandPalette />
 * </Portal>
 */
export function Portal({ children, container, disabled = false }: PortalProps) {
  const hydrated = useIsHydrated();
  if (disabled) return <>{children}</>;
  if (!hydrated) return null;
  return createPortal(children, resolvePortalContainer(container));
}
