import React from 'react';
import { createPortal } from 'react-dom';
import { useIsHydrated } from './useIsHydrated';
import { useConfig } from './Config';

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
 * Where a component's portal goes, as a function to call when the portal is
 * created: the target the component was given, else the `portalContainer` a
 * `ConfigProvider` sets, else `document.body`, each read as
 * `resolvePortalContainer` reads it. A component that portals resolves its
 * target through this, so the provider's default reaches it.
 *
 * The hook only reads context, so it is safe to call on the server, ahead of
 * any early return. The function it returns reads the DOM, so call it only
 * where the portal is created, which the server never reaches.
 *
 * @function usePortalContainer
 * @returns A function that takes the component's own target, if any, and
 * returns the DOM node to portal into.
 */
export function usePortalContainer(): (
  container?: string | HTMLElement
) => HTMLElement {
  const { portalContainer } = useConfig();
  return container => resolvePortalContainer(container || portalContainer);
}

/**
 * Props for the Portal component.
 */
export interface PortalProps {
  /** Content to render into the container. */
  children?: React.ReactNode;
  /**
   * Where the content goes: an element, or a `document.querySelector`
   * selector. Omitted or empty, it goes to the `portalContainer` a
   * `ConfigProvider` sets, and to `document.body` when none is set. A
   * selector that matches nothing means `document.body` too. A selector is
   * looked up again on each render, so the
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
 * Renders its children into another part of the page, `document.body` unless `container` or a `ConfigProvider` says otherwise, so floating content escapes an ancestor's `overflow`, `transform` or stacking context.
 *
 * React's server renderer can't render a portal, so `Portal` renders nothing
 * on the server and during hydration, and mounts its children in the commit
 * that follows. The first client render then matches the server markup. In an app
 * without server rendering it portals on the first render.
 *
 * React context, such as `ConfigProvider`'s class prefix, reaches the
 * portaled children, and their React events bubble through the React tree.
 * CSS inheritance follows the DOM instead: a scoped (non-`isRoot`) `Theme`
 * sets its variables on a wrapper element the portaled content has left, so
 * that content sees the page-level theme, and styles scoped to a shadow root
 * don't reach `document.body` at all. To keep them, portal into an element
 * inside the themed area or the shadow root: pass it as `container`, or as
 * the `portalContainer` of a `ConfigProvider` around that area. The second
 * also reaches what the library's components portal, such as Popover's
 * `appendToBody` panel or a `Modal` with `portal`.
 *
 * Tab order and focus follow the DOM too. Content portaled from inside a
 * focus trap is no longer inside the trapped element, so the trap neither
 * reaches it nor holds focus there: render nested overlays inside the
 * trapped element, or give them a trap of their own. To trap portaled
 * content, put `useFocusTrap`'s ref on the element inside the `Portal`.
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
  const resolveContainer = usePortalContainer();
  if (disabled) return <>{children}</>;
  if (!hydrated) return null;
  return createPortal(children, resolveContainer(container));
}
