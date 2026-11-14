import React, { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useIsHydrated } from './useIsHydrated';
import { useConfig } from './Config';
import { LocalePortalScope } from './LocaleProvider';
import { MenuRailContext } from './menuRail';

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
 * The element the overlay around a popup hands it to portal into, `null`
 * outside any, and inside one whose element hasn't mounted yet.
 */
const PortalScopeContext = createContext<HTMLElement | null>(null);

/**
 * INTERNAL, deliberately not exported from `src/index.ts`. Makes `node` where
 * the popups inside it portal, unless a `ConfigProvider` sets a
 * `portalContainer`. Modal, Dialog and Command.Dialog wrap their content in
 * it, each with the element that carries their `aria-modal`, since a screen
 * reader that honors it hides everything outside that element. AppFrame's
 * nav does too while it's a drawer, which draws over the page, so its popups
 * show above it. The nearest one wins, so a Dialog's own box wins over the
 * Modal it renders. An `undefined` node leaves the scope around it in place,
 * for a part that only takes its popups some of the time, so its content
 * keeps one tree either way.
 *
 * @function PortalScope
 * @param props - `node`, the element popups portal into, and `children`.
 * @returns The children, inside the scope.
 */
export function PortalScope({
  node,
  children,
}: {
  node: HTMLElement | null | undefined;
  children?: React.ReactNode;
}) {
  const outer = useContext(PortalScopeContext);
  return (
    <PortalScopeContext.Provider value={node === undefined ? outer : node}>
      {children}
    </PortalScopeContext.Provider>
  );
}

/**
 * INTERNAL. Where a popup portals, a panel a component opens against
 * something on the page, such as Popover's: the `portalContainer` a
 * `ConfigProvider` sets, else the overlay it's in (see `PortalScope`), else
 * `undefined`, which `resolvePortalContainer` reads as `document.body`.
 *
 * The overlay's element only exists once it has mounted, so a popup open as
 * the overlay first renders mounts in `document.body`, and moves into the
 * overlay in the update that follows, before the browser paints. Moving
 * remounts it, as any change of portal target does. It isn't held back
 * instead, because the popups measure their panel against the trigger as
 * they open, and a panel that isn't there yet is never placed.
 *
 * @function usePopupContainer
 * @returns The popup's container, `undefined` for `document.body`.
 */
export function usePopupContainer(): string | HTMLElement | undefined {
  const { portalContainer } = useConfig();
  const scope = useContext(PortalScopeContext);
  return portalContainer || scope || undefined;
}

/**
 * What a component that takes Modal's `portal` prop does with it now. See
 * `usePortalProp`.
 */
export interface PortalPropState {
  /**
   * Whether the content renders in its portal: `portal` is set and
   * hydration is over. Before that it renders in place.
   */
  isPortaled: boolean;
  /**
   * The target to pass `Portal` as its `container`: the selector or element
   * `portal` names, or `undefined` for `true`, which leaves the choice to the
   * `portalContainer` a `ConfigProvider` sets and then `document.body`.
   */
  container?: string | HTMLElement;
  /**
   * The `portalContainer` a `ConfigProvider` sets, while it's what places the
   * content (portaled, with `portal` set to `true`), else `undefined`. A
   * change to it moves the content, so effects that hold its nodes depend
   * on it.
   */
  defaultTarget?: string | HTMLElement;
}

/**
 * Reads Modal's `portal` prop (`boolean | string | HTMLElement`) for a
 * component that takes it: whether the content is in its portal yet, and
 * where it goes.
 *
 * A portal has no server-rendered counterpart, so such a component renders in
 * place on the server and while hydrating, and moves into its portal once the
 * client takes over. Render the content in `Portal` with
 * `disabled={!isPortaled}` and this `container`. Moving remounts the content,
 * so an effect that holds one of its nodes depends on `isPortaled`, `portal`
 * and `defaultTarget`.
 *
 * @function usePortalProp
 * @param portal - The component's `portal` prop.
 * @returns Whether it's portaled now, its `container`, and the provider's
 * target while that places it.
 */
export function usePortalProp(
  portal?: boolean | string | HTMLElement
): PortalPropState {
  const hydrated = useIsHydrated();
  const { portalContainer } = useConfig();
  const isPortaled = Boolean(portal) && hydrated;
  return {
    isPortaled,
    container: typeof portal === 'boolean' ? undefined : portal,
    defaultTarget: isPortaled && portal === true ? portalContainer : undefined,
  };
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
 * Inside a `LocaleProvider`, the children keep its `dir` and `lang`. A
 * container inside the provider's own wrapper takes the children as they
 * are, and they follow the provider through the page. Any other,
 * `document.body` included, gets them inside one `<div>` carrying the
 * provider's values, with `display: contents` so it adds no box. It is
 * still an element, so content that must be the container's direct child,
 * a `<tr>` in a `<tbody>`, or that a direct-child selector styles, belongs
 * in a container inside the provider. Which of the two is settled when the
 * children mount, so a change of locale updates them in place rather than
 * remounting them.
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
  const target = resolveContainer(container);
  // A Menu portaled out of an AppFrame nav with a rail, such as one in a
  // Popover opened from it, isn't in the rail, so the rail stops here.
  return createPortal(
    <MenuRailContext.Provider value={null}>
      <LocalePortalScope target={target}>{children}</LocalePortalScope>
    </MenuRailContext.Provider>,
    target
  );
}

/**
 * INTERNAL. `Portal` for a popup, into the container `usePopupContainer`
 * names, so a popup opened inside a Modal, Dialog or Command.Dialog stays
 * inside it. `disabled` renders the children in place, as `Portal`'s does.
 *
 * @function PopupPortal
 * @param props - The children, and `disabled`.
 * @returns The portal, the children in place when `disabled`, or nothing
 * before hydration.
 */
export function PopupPortal({
  children,
  disabled = false,
}: Omit<PortalProps, 'container'>) {
  const container = usePopupContainer();
  return (
    <Portal disabled={disabled} container={container}>
      {children}
    </Portal>
  );
}
