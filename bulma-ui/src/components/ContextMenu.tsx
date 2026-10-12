import React, { cloneElement, useEffect, useRef, useState } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { Portal } from '../helpers/portal';
import { useConfig } from '../helpers/Config';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { getDeepestActiveElement, isEventInside } from '../helpers/shadowDom';
import { warnOnce } from '../helpers/devWarnings';
import {
  useContextMenuTrigger,
  type ContextMenuPoint,
  type ContextMenuTriggerHandlers,
} from '../helpers/useContextMenuTrigger';
import {
  enabledMenuItems,
  isEnabledMenuItem,
  MENU_ITEM_SELECTOR,
  useMenuKeys,
} from '../helpers/useMenuKeys';
import { DropdownDivider, DropdownItem } from './Dropdown';

/**
 * Props for the ContextMenu component. `className`, `id`, `aria-label`, the
 * other HTML attributes and the helper props land on the menu
 * (`role="menu"`). The trigger keeps its own.
 * @extraProp {string} [aria-label] - The menu's accessible name, such as "Actions for report.pdf". There's no button to borrow a name from, so pass this or `aria-labelledby`, and a development build warns when the menu opens with neither.
 * @extraProp {string} [className] - Additional classes for the menu (`role="menu"`). The trigger keeps its own.
 */
export interface ContextMenuProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'children'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * The element a right-click, Shift+F10, the context menu key or a long
   * press opens the menu from: a table row, a card, an image. It's cloned,
   * not wrapped, so a row stays a row, which means it has to be a single
   * element that passes `className` and the `onContextMenu`,
   * `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel` and
   * `onTouchEnd` handlers to its DOM node. Its own handlers for those run
   * first, and one that calls `preventDefault()` on `contextmenu` keeps the
   * menu closed. A `ContextMenu` inside it opens instead of this one.
   *
   * It gets no ARIA and no tab stop, since it can be any element and a
   * right-click isn't an activation. Keyboard users reach it through
   * something focusable inside it, such as the row's own `Dropdown` button,
   * or a `tabIndex={0}` you give it, and press Shift+F10 or the context menu
   * key there. It gets `-webkit-touch-callout: none`, so iOS doesn't put its
   * own callout for a link or an image over the menu. A long press still
   * selects text the way it does anywhere, so give a region where it
   * shouldn't `interaction="unselectable"`.
   */
  trigger: React.ReactElement;
  /**
   * The menu's items: `ContextMenu.Item` and `ContextMenu.Divider`, the same
   * components as `Dropdown.Item` and `Dropdown.Divider`. Every action in it
   * needs a visible way in as well, such as a `Dropdown` on the same row:
   * nothing tells a screen reader user the menu is there, and on macOS only
   * VoiceOver opens it from the keyboard.
   */
  children: React.ReactNode;
  /**
   * Called with `true` when the menu opens and `false` when it closes,
   * whatever closed it, such as for highlighting the row whose menu is open.
   * Nothing fires after ContextMenu unmounts. There's no `open` prop to go
   * with it: a menu opened from code has no point to open at.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Close the menu when an item is clicked, or activated with Enter or
   * Space. A click on a divider or between items leaves it open either way.
   */
  closeOnClick?: boolean;
  /**
   * Leave the trigger to the browser: a right-click shows the browser's own
   * menu, a long press does what it does anywhere, and an open menu closes.
   */
  disabled?: boolean;
}

/** Where the menu goes once it's measured. */
interface Placement {
  /** The box's corner in the viewport, which the menu hangs from. */
  top: number;
  left: number;
  /** The menu sits above the box rather than below it. */
  up: boolean;
  /** The menu sits to the left of the box rather than to its right. */
  right: boolean;
}

/** An open menu. */
interface OpenMenu {
  point: ContextMenuPoint;
  /** The trigger's document, where presses and scrolling are watched. */
  doc: Document;
  /** Unset until the menu is measured, which happens before it paints. */
  placed?: Placement;
}

/**
 * Where the menu goes along one axis, from the point at `at`: after it when
 * there's room, before it when there's room there instead, and otherwise
 * moved in until it fits in `room`.
 */
function placeAlong(
  at: number,
  size: number,
  room: number
): { start: number; flip: boolean } {
  if (at + size <= room) return { start: at, flip: false };
  if (at - size >= 0) return { start: at, flip: true };
  return { start: Math.max(0, room - size), flip: false };
}

/** Runs the trigger's own handler, then the context menu's. */
function chain<E>(
  own: ((event: E) => void) | undefined,
  ours: (event: E) => void
): (event: E) => void {
  return event => {
    own?.(event);
    ours(event);
  };
}

/**
 * The `ContextMenu` component opens a menu of actions where you right-click an element, such as a table row or a card, or long press it on a touch screen.
 *
 * Shift+F10 and the context menu key open it too, where the browser fires
 * `contextmenu` for them, which Windows and Linux do. The menu is Dropdown's
 * markup, portaled into the `portalContainer` a `ConfigProvider` sets, or
 * the end of the trigger's own document's `<body>`, so it never has server
 * markup. It opens below and to the right of the point, flips above or to
 * the left where there's no room, moves in where it fits neither way, and
 * scrolls inside when it's taller than the viewport. It doesn't follow the
 * trigger, since scrolling closes it. Inside a `Modal` or a shadow root,
 * point `portalContainer` inside it, so screen readers that honor
 * `aria-modal` reach the menu and the shadow root's styles apply.
 *
 * Opening moves focus to the first enabled item. The arrow keys, Home, End
 * and typing move between items, and Enter and Space activate one. Escape,
 * Tab, an item, a press outside, scrolling, resizing and the window losing
 * focus close it, handing focus back to what had it unless an item moved it
 * somewhere else. For a menu opened from a button use `Dropdown`.
 *
 * @function
 * @param {ContextMenuProps} props - Props for the ContextMenu component.
 * @returns {JSX.Element} The trigger, and the menu while open.
 *
 * @example
 * <ContextMenu
 *   aria-label="Actions for report.pdf"
 *   trigger={<Box>report.pdf</Box>}
 * >
 *   <ContextMenu.Item as="button">Rename</ContextMenu.Item>
 *   <ContextMenu.Divider />
 *   <ContextMenu.Item as="button">Delete</ContextMenu.Item>
 * </ContextMenu>
 */
const ContextMenuComponent: React.FC<ContextMenuProps> = ({
  trigger,
  children,
  onOpenChange,
  closeOnClick = true,
  disabled = false,
  className,
  onKeyDown,
  onClick,
  onContextMenu,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const { portalContainer } = useConfig();
  const [menu, setMenu] = useState<OpenMenu | null>(null);
  // Turning `disabled` on closes it.
  if (disabled && menu) setMenu(null);
  const open = menu !== null;
  const doc = menu?.doc;
  const placed = menu?.placed;

  const boxRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);
  const reportedRef = useRef(false);
  const menuKeys = useMenuKeys();
  const named = Boolean(props['aria-label'] || props['aria-labelledby']);

  const handlers = useContextMenuTrigger({
    disabled,
    onOpen: (point, triggerNode) => {
      const ownerDoc = triggerNode.ownerDocument;
      openerRef.current = getDeepestActiveElement(ownerDoc);
      setMenu({ point, doc: ownerDoc });
    },
  });

  // Measured once per opening, before it paints, against what a fixed box
  // resolves against: the root element's client area, which leaves out a
  // classic scrollbar. `useAnchoredPosition` and Tooltip read innerWidth and
  // innerHeight, which count it. A menu pinned to the viewport's edge would
  // sit under the scrollbar by that much, so this reads the narrower box.
  useClientLayoutEffect(() => {
    const menuNode = menuRef.current;
    if (!menu || menu.placed || !menuNode) return;
    const root = menuNode.ownerDocument.documentElement;
    const { width, height } = menuNode.getBoundingClientRect();
    const x = placeAlong(menu.point.x, width, root.clientWidth);
    const y = placeAlong(menu.point.y, height, root.clientHeight);
    setMenu({
      ...menu,
      placed: { left: x.start, top: y.start, right: x.flip, up: y.flip },
    });
  }, [menu]);
  const isPlaced = Boolean(placed);

  // What closes it while it's open, and focus back on closing. Nothing
  // listens while it's closed.
  useEffect(() => {
    const box = boxRef.current;
    const menuNode = menuRef.current;
    if (!doc || !box || !menuNode) return undefined;
    const view = doc.defaultView as Window;
    // What had focus when it opened. This runs once per opening, so opening
    // again at a new point while it's open keeps it.
    const opener = openerRef.current as HTMLElement | null;
    const close = () => setMenu(null);
    const closeOutside = (event: Event) => {
      if (!isEventInside(event, box)) close();
    };
    doc.addEventListener('pointerdown', closeOutside, true);
    view.addEventListener('resize', close);
    view.addEventListener('blur', close);
    return () => {
      doc.removeEventListener('pointerdown', closeOutside, true);
      view.removeEventListener('resize', close);
      view.removeEventListener('blur', close);
      // Back to what had focus while the menu still has it, or it dropped to
      // <body> when the menu left. An item that put it somewhere else, such
      // as a Modal or a rename field, keeps it there.
      const now = getDeepestActiveElement(doc);
      if (!now || now === doc.body || menuNode.contains(now)) opener?.focus();
    };
  }, [doc]);

  // Focus in, and closing on scroll, once it's placed. Placed, it's inside
  // the viewport, so its first item has nothing to scroll into view, and
  // `preventScroll` makes sure: a scroll the focus caused would close it as
  // it opened. Opening again at a new point places it again, and leaves
  // focus where it is in the menu.
  useEffect(() => {
    const box = boxRef.current;
    const menuNode = menuRef.current;
    if (!doc || !isPlaced || !box || !menuNode) return undefined;
    if (!menuNode.contains(getDeepestActiveElement(doc))) {
      menuKeys.reset();
      (enabledMenuItems(menuNode)[0] ?? menuNode).focus({
        preventScroll: true,
      });
    }
    const closeOutside = (event: Event) => {
      if (!isEventInside(event, box)) setMenu(null);
    };
    doc.addEventListener('scroll', closeOutside, true);
    return () => doc.removeEventListener('scroll', closeOutside, true);
  }, [doc, isPlaced, menuKeys]);

  // Before paint, so what the caller does with it, such as highlighting the
  // row, shows with the menu rather than a frame behind it.
  useClientLayoutEffect(() => {
    if (open === reportedRef.current) return;
    reportedRef.current = open;
    onOpenChange?.(open);
  });

  useEffect(() => {
    if (open && !named) {
      warnOnce(
        'ContextMenu:unnamed',
        '[bestax-bulma] <ContextMenu> opened a menu with no accessible ' +
          'name. Pass aria-label or aria-labelledby.'
      );
    }
  }, [open, named]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    // The menu has the keyboard while focus is in it. React brings its keys
    // up the tree to wherever the ContextMenu sits, where a table that moves
    // between rows on the arrow keys, or a Popover or a Modal waiting for
    // Escape, would take them too.
    event.stopPropagation();
    if (event.key === 'Escape' || event.key === 'Tab') {
      // Tab would go on from the end of <body>, past the rest of the page.
      event.preventDefault();
      setMenu(null);
      return;
    }
    menuKeys.onKeyDown(event);
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
    if (!closeOnClick) return;
    const item = (event.target as Element).closest(MENU_ITEM_SELECTOR);
    if (item && isEnabledMenuItem(item)) setMenu(null);
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    onContextMenu?.(event);
    // No other menu over this one: not the browser's, and not a trigger's
    // that React brings the event up to.
    event.preventDefault();
    event.stopPropagation();
  };

  const own = trigger.props as Partial<ContextMenuTriggerHandlers> & {
    className?: string;
  };
  const triggerClass = usePrefixedClassNames('context-menu');
  const clonedTrigger = cloneElement(
    trigger as React.ReactElement<Record<string, unknown>>,
    {
      className:
        classNames(own.className, !disabled && triggerClass) || undefined,
      onContextMenu: chain(own.onContextMenu, handlers.onContextMenu),
      onPointerDown: chain(own.onPointerDown, handlers.onPointerDown),
      onPointerMove: chain(own.onPointerMove, handlers.onPointerMove),
      onPointerUp: chain(own.onPointerUp, handlers.onPointerUp),
      onPointerCancel: chain(own.onPointerCancel, handlers.onPointerCancel),
      onTouchEnd: chain(own.onTouchEnd, handlers.onTouchEnd),
    }
  );

  const boxClasses = usePrefixedClassNames('context-menu-content', 'dropdown', {
    'is-active': true,
    'is-up': placed?.up,
    'is-right': placed?.right,
  });
  const menuClasses = classNames(
    usePrefixedClassNames('dropdown-menu'),
    bulmaHelperClasses,
    className
  );
  const contentClasses = usePrefixedClassNames('dropdown-content');

  return (
    <>
      {clonedTrigger}
      {menu && (
        <Portal container={portalContainer || menu.doc.body}>
          <div
            ref={boxRef}
            className={boxClasses}
            style={{
              top: placed?.top ?? menu.point.y,
              left: placed?.left ?? menu.point.x,
            }}
          >
            <div
              {...rest}
              ref={menuRef}
              role="menu"
              tabIndex={-1}
              className={menuClasses}
              onKeyDown={handleKeyDown}
              onClick={handleClick}
              onContextMenu={handleContextMenu}
            >
              <div className={contentClasses}>{children}</div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

/**
 * ContextMenu with Item and Divider sub-components, which are `Dropdown.Item`
 * and `Dropdown.Divider`, so items written for a Dropdown work here
 * unchanged.
 */
export const ContextMenu = withSubComponents(
  ContextMenuComponent,
  {
    Item: DropdownItem,
    Divider: DropdownDivider,
  },
  'ContextMenu'
);

export default ContextMenu;
