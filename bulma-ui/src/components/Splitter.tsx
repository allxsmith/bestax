import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { flattenChildren } from '../helpers/flattenChildren';
import { withSubComponents } from '../helpers/withSubComponents';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { warnOnce } from '../helpers/devWarnings';
import {
  defaultSizes,
  fitSizes,
  limitToPercent,
  PaneBounds,
  primaryOf,
  primaryRange,
  resizePair,
  sameSizes,
  SplitterLimit,
} from '../helpers/splitterLayout';

/** The way the panes run: side by side, or one above the other. */
export type SplitterOrientation = 'horizontal' | 'vertical';

/**
 * Props for Splitter.Pane, one of the panes. The helper props, the other
 * attributes and the `ref` land on its `<div>`.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the pane's `<div>`.
 * @extraProp {string} [id] - The pane's id, which its handle's `aria-controls` points at. The splitter makes one when there's none.
 */
export interface SplitterPaneProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * What the pane is, such as "Files". It names the handle that speaks for
   * this pane, which is announced as "Files, separator, 25". That's the
   * handle after it, or the one before it when only this pane, of the two
   * beside that handle, can collapse. A development build warns when a
   * handle's pane has none.
   */
  label?: string;
  /**
   * Its starting size, in percent of the room the panes share. Panes without
   * one share what's left equally, and a total over 100 is scaled down.
   */
  defaultSize?: number;
  /**
   * The smallest it can be dragged: a percentage, or a CSS length in `px` or
   * `rem` such as `"12rem"`. A length applies once the splitter has measured
   * itself in the browser, so the server renders the default size.
   */
  minSize?: SplitterLimit;
  /** The largest it can be dragged, in the same units as `minSize`. */
  maxSize?: SplitterLimit;
  /**
   * Lets it collapse: dragging it below half its `minSize` shuts it, and
   * Enter on its handle shuts it and brings it back at the size it had. It
   * collapses only when the pane across its handle can take its room within
   * that pane's `maxSize`, since a handle moves only the two panes beside it.
   * A collapsed pane stays mounted, hidden, so it keeps its state.
   */
  collapsible?: boolean;
  /**
   * Whether it's collapsed, for a `collapsible` pane. With it, the state is
   * yours: a drag, a key or a double-click that would collapse it or bring
   * it back calls `onCollapsedChange` and leaves it as it is, and it changes
   * when `collapsed` does.
   */
  collapsed?: boolean;
  /** Whether a `collapsible` pane starts collapsed. */
  defaultCollapsed?: boolean;
  /**
   * Called when a drag, a key or a double-click collapses it or brings it
   * back, or, with `collapsed`, would. Not called for a change you made with
   * `collapsed`.
   */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** What's in it. Content that scrolls belongs in a `ScrollArea`, so a keyboard can reach it. */
  children?: React.ReactNode;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Props for the Splitter component. The helper props, the other attributes
 * and the `ref` land on the root `<div>`.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the root `<div>`.
 */
export interface SplitterProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * `Splitter.Pane`s, two or more, each a direct child, with Fragments
   * opened up. A handle goes between each pair. Changing which panes there
   * are puts every pane back to its default size.
   */
  children?: React.ReactNode;
  /**
   * The way the panes run: side by side (`horizontal`) or one above the
   * other (`vertical`).
   */
  orientation?: SplitterOrientation;
  /**
   * The splitter's height. A number is pixels, and a string any CSS length.
   * A vertical splitter needs a height to split.
   */
  height?: number | string;
  /**
   * Each pane's size, in percent, in order, adding up to 100. With it, the
   * sizes are yours: update them from `onSizesChange`. Without it, each
   * pane starts at its `defaultSize`.
   */
  sizes?: number[];
  /**
   * Called with every pane's size, in percent, whenever they change: on
   * each step of a drag or a key, on a collapse and on a reset.
   */
  onSizesChange?: (sizes: number[]) => void;
  /**
   * How far an arrow key moves a handle, in percent. Shift moves ten times
   * as far.
   */
  step?: number;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/** What the splitter tells each pane it renders. */
interface PaneState {
  id: string;
  size: number;
  collapsed: boolean;
}

const PaneContext = createContext<PaneState | null>(null);

/**
 * One pane of a Splitter, sized by the splitter around it.
 *
 * @function
 * @param {SplitterPaneProps} props - Props for Splitter.Pane.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the pane's `<div>`.
 * @returns {JSX.Element} The rendered pane.
 */
export const SplitterPane = forwardRef<HTMLDivElement, SplitterPaneProps>(
  (
    {
      className,
      textColor,
      bgColor,
      label: _label,
      defaultSize: _defaultSize,
      minSize: _minSize,
      maxSize: _maxSize,
      collapsible: _collapsible,
      collapsed: _collapsed,
      defaultCollapsed: _defaultCollapsed,
      onCollapsedChange: _onCollapsedChange,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const state = useContext(PaneContext);
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });
    const paneClass = usePrefixedClassNames('splitter-pane', {
      'is-collapsed': !!state?.collapsed,
    });
    return (
      <div
        ref={ref}
        className={classNames(paneClass, bulmaHelperClasses, className)}
        {...rest}
        id={state?.id ?? rest.id}
        // A percentage over a zero basis, so the server and the client lay
        // it out the same, with no measuring.
        style={state ? { ...style, flex: `${state.size} 1 0px` } : style}
        hidden={state?.collapsed || rest.hidden}
      >
        {children}
      </div>
    );
  }
);

SplitterPane.displayName = 'Splitter.Pane';

/** A pane's props as the splitter reads them off its child. */
type PaneElement = React.ReactElement<SplitterPaneProps>;

const isPane = (child: React.ReactNode): child is PaneElement =>
  React.isValidElement(child) && child.type === SplitterPane;

/** The bounds with pane `i`'s changed, for a move that mustn't snap it shut. */
const withBound = (
  bounds: PaneBounds[],
  i: number,
  change: Partial<PaneBounds>
) => bounds.map((bound, j) => (j === i ? { ...bound, ...change } : bound));

/** The bounds with neither pane beside handle `h` able to shut. */
const opened = (bounds: PaneBounds[], h: number) =>
  withBound(withBound(bounds, h, { collapsible: false }), h + 1, {
    collapsible: false,
  });

/**
 * The handle a pane's collapse goes through: the one that speaks for it. A
 * collapsible pane that isn't last always has the handle after it, so the
 * one left without is a last pane whose neighbour can collapse too, and it
 * goes through the handle before it.
 */
const handleFor = (pane: number, bounds: PaneBounds[]) =>
  pane < bounds.length - 1 && primaryOf(pane, bounds) === pane
    ? pane
    : pane - 1;

/**
 * The `Splitter` component lays out two or more panes side by side or one above the other, with a handle between each pair to drag or move by keyboard.
 *
 * Each handle is a focusable `separator`, named by the `label` of the pane
 * it speaks for. Sizes are percentages, so the server renders the layout
 * the browser does, and `minSize` and `maxSize` also take `px` and `rem`. A
 * `collapsible` pane shuts when dragged below half its minimum, and Enter on
 * its handle shuts it and brings it back. It doesn't store sizes itself:
 * keep them with `sizes` and `onSizesChange`.
 *
 * @function
 * @param {SplitterProps} props - Props for the Splitter component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the root `<div>`.
 * @returns {JSX.Element} The rendered splitter.
 *
 * @example
 * <Splitter height={480}>
 *   <Splitter.Pane label="Files" defaultSize={25} minSize="12rem">…</Splitter.Pane>
 *   <Splitter.Pane label="Editor">…</Splitter.Pane>
 * </Splitter>
 */
const SplitterRoot = forwardRef<HTMLDivElement, SplitterProps>(
  (
    {
      className,
      style,
      textColor,
      bgColor,
      orientation = 'horizontal',
      height,
      sizes: sizesProp,
      onSizesChange,
      step = 1,
      children,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });
    const vertical = orientation === 'vertical';
    const rootClass = usePrefixedClassNames('splitter', {
      'is-vertical': vertical,
    });
    const handleClass = usePrefixedClassNames('splitter-handle');
    const activeClass = usePrefixedClassNames('is-active');

    const panes = flattenChildren(children).filter(isPane);
    const baseId = useId();
    const ids = panes.map((pane, i) => pane.props.id ?? `${baseId}-pane-${i}`);

    // The room the panes share, in pixels, and a rem, both measured in the
    // browser. Until then, only percentage limits apply.
    const [length, setLength] = useState<number | null>(null);
    const [remPx, setRemPx] = useState(16);
    const bounds: PaneBounds[] = panes.map(({ props: pane }) => ({
      min: Math.max(0, limitToPercent(pane.minSize, length, remPx) ?? 0),
      max: Math.min(100, limitToPercent(pane.maxSize, length, remPx) ?? 100),
      collapsible: !!pane.collapsible,
    }));
    const boundsKey = JSON.stringify(bounds);

    // Shuts pane `i`, giving its room to the pane across the handle that
    // speaks for it, when that pane can take it within its maximum, as a
    // drag would. A lone pane has no handle and nowhere to give its room.
    const collapseIn = (current: number[], i: number) => {
      if (current.length < 2) return current;
      const h = handleFor(i, bounds);
      const across = h === i ? i + 1 : h;
      if (current[across] + current[i] > bounds[across].max + 1e-6) {
        return current;
      }
      const next = [...current];
      next[across] += next[i];
      next[i] = 0;
      return next;
    };

    const startSizes = () => {
      const base = defaultSizes(panes.map(pane => pane.props.defaultSize));
      let next = fitSizes(base, bounds);
      panes.forEach(({ props: pane }, i) => {
        if (pane.collapsible && (pane.collapsed ?? pane.defaultCollapsed)) {
          next = collapseIn(next, i);
        }
      });
      return next;
    };

    const paneKey = ids.join('|');
    const [state, setState] = useState(() => ({
      key: paneKey,
      sizes: startSizes(),
    }));
    // A different set of panes starts over from the defaults.
    let uncontrolled = state.sizes;
    if (state.key !== paneKey) {
      uncontrolled = startSizes();
      setState({ key: paneKey, sizes: uncontrolled });
    }
    const sizes =
      sizesProp && sizesProp.length === panes.length ? sizesProp : uncontrolled;

    // The size each pane comes back at after it's shut: the last size it had
    // open, or its default.
    const restoreRef = useRef<number[]>([]);
    const defaults = defaultSizes(panes.map(pane => pane.props.defaultSize));
    sizes.forEach((size, i) => {
      if (size > 0) restoreRef.current[i] = size;
      else restoreRef.current[i] ??= defaults[i];
    });

    const collapsedAt = (layout: number[]) =>
      layout.map((size, i) => bounds[i].collapsible && size <= 1e-6);

    // Moves the layout on, telling the app and each pane whose collapse
    // changed, unless the change came from its own `collapsed`. A move that
    // would collapse or open a pane whose `collapsed` the app holds only
    // asks: the app's answer comes back through `collapsed`.
    const sizesRef = useRef(sizes);
    sizesRef.current = sizes;
    const panesRef = useRef(panes);
    panesRef.current = panes;
    const commit = (next: number[], fromProp = false) => {
      const previous = sizesRef.current;
      if (sameSizes(previous, next)) return;
      const before = collapsedAt(previous);
      const after = collapsedAt(next);
      const flipped = after.flatMap((shut, i) =>
        shut !== before[i] ? [i] : []
      );
      if (
        !fromProp &&
        flipped.some(i => panesRef.current[i].props.collapsed !== undefined)
      ) {
        flipped.forEach(i =>
          panesRef.current[i].props.onCollapsedChange?.(after[i])
        );
        return;
      }
      sizesRef.current = next;
      if (!sizesProp) setState(current => ({ ...current, sizes: next }));
      onSizesChange?.(next);
      if (!fromProp) {
        flipped.forEach(i =>
          panesRef.current[i].props.onCollapsedChange?.(after[i])
        );
      }
    };

    // Brings pane `i` back at its restore size, taken from across the handle
    // that speaks for it.
    // A lone pane never shuts, so there's always a handle here.
    const expand = (current: number[], i: number) => {
      const h = handleFor(i, bounds);
      const target = restoreRef.current[i];
      const total = current[h] + current[h + 1];
      return resizePair(
        current,
        h,
        h === i ? target : total - target,
        // Opening one pane snaps neither shut: it stops at the limits.
        opened(bounds, h)
      );
    };

    // A pane's own `collapsed` moving: shut it or bring it back, before the
    // browser paints.
    const collapsedProps = panes.map(pane =>
      pane.props.collapsible ? pane.props.collapsed : undefined
    );
    const collapsedKey = JSON.stringify(collapsedProps);
    useClientLayoutEffect(() => {
      const current = sizesRef.current;
      const shut = collapsedAt(current);
      let next = current;
      collapsedProps.forEach((wanted, i) => {
        if (wanted === undefined || wanted === shut[i]) return;
        next = wanted ? collapseIn(next, i) : expand(next, i);
      });
      commit(next, true);
      // collapsedKey stands for collapsedProps.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collapsedKey]);

    // Measuring: the room the panes share, so `px` and `rem` limits can turn
    // into percentages, then the layout fitted to them.
    const rootRef = useRef<HTMLDivElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;
        if (typeof ref === 'function') return ref(node);
        if (ref) ref.current = node;
      },
      [ref]
    );
    // The room the panes share: the root's length less its handles'.
    const roomOf = useCallback(() => {
      const root = rootRef.current;
      /* istanbul ignore next: measuring only runs while it's mounted */
      if (!root) return null;
      const along = (el: Element) => {
        const rect = el.getBoundingClientRect();
        return vertical ? rect.height : rect.width;
      };
      const handles = Array.from(root.children).filter(child =>
        child.matches('[role="separator"]')
      );
      const room =
        along(root) - handles.reduce((sum, handle) => sum + along(handle), 0);
      return room > 0 ? room : null;
    }, [vertical]);
    const measure = useCallback(() => {
      setLength(roomOf());
      setRemPx(
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      );
    }, [roomOf]);
    useClientLayoutEffect(() => {
      measure();
      const root = rootRef.current;
      if (!root || typeof ResizeObserver === 'undefined') return;
      const resizes = new ResizeObserver(measure);
      resizes.observe(root);
      return () => resizes.disconnect();
    }, [measure]);
    // Limits that changed, from measuring or from props: fit the layout.
    useClientLayoutEffect(() => {
      commit(fitSizes(sizesRef.current, bounds));
      // boundsKey stands for bounds.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [boundsKey]);

    const rtl = () =>
      !vertical &&
      !!rootRef.current &&
      getComputedStyle(rootRef.current).direction === 'rtl';

    // ---- Dragging ----
    const [dragging, setDragging] = useState<number | null>(null);
    const dragRef = useRef<{
      handle: number;
      start: number;
      startSizes: number[];
      pixels: number;
      flip: boolean;
    } | null>(null);
    const onPointerDown =
      (h: number) => (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        const pixels = roomOf();
        if (!pixels) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        dragRef.current = {
          handle: h,
          start: vertical ? event.clientY : event.clientX,
          startSizes: sizesRef.current,
          pixels,
          flip: rtl(),
        };
        setDragging(h);
      };
    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const moved = (vertical ? event.clientY : event.clientX) - drag.start;
      const delta = ((drag.flip ? -moved : moved) / drag.pixels) * 100;
      commit(
        resizePair(
          sizesRef.current,
          drag.handle,
          drag.startSizes[drag.handle] + delta,
          bounds
        )
      );
    };
    const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      dragRef.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      setDragging(null);
    };
    // While dragging, the resize cursor shows wherever the pointer goes.
    useEffect(() => {
      if (dragging === null) return;
      const body = document.body.style;
      const { cursor, userSelect } = body;
      body.cursor = vertical ? 'row-resize' : 'col-resize';
      body.userSelect = 'none';
      return () => {
        body.cursor = cursor;
        body.userSelect = userSelect;
      };
    }, [dragging, vertical]);

    // Double-click: the two panes back to their default share of the room.
    const onDoubleClick = (h: number) => () => {
      const current = sizesRef.current;
      const total = current[h] + current[h + 1];
      const pair = defaults[h] + defaults[h + 1];
      const target = pair > 0 ? (defaults[h] / pair) * total : total / 2;
      const next = [...current];
      next[h] = target;
      next[h + 1] = total - target;
      commit(fitSizes(next, bounds));
    };

    // ---- Keys ----
    const onKeyDown =
      (h: number) => (event: React.KeyboardEvent<HTMLDivElement>) => {
        const current = sizesRef.current;
        const primary = primaryOf(h, bounds);
        const by = event.shiftKey ? step * 10 : step;
        const back = vertical ? 'ArrowUp' : 'ArrowLeft';
        const forward = vertical ? 'ArrowDown' : 'ArrowRight';
        // The line moves the way the key points, so right to left, moving
        // right shrinks the pane before, which sits on the right.
        const sign = rtl() ? -1 : 1;
        // Keys move within the limits; Enter is what shuts a pane.
        const open = opened(bounds, h);
        let next: number[] | null = null;
        if (event.key === back || event.key === forward) {
          const direction = (event.key === forward ? 1 : -1) * sign;
          next = resizePair(current, h, current[h] + direction * by, open);
        } else if (event.key === 'Home' || event.key === 'End') {
          const range = primaryRange(current, h, primary, open);
          const size = event.key === 'Home' ? range.min : range.max;
          const total = current[h] + current[h + 1];
          next = resizePair(
            current,
            h,
            primary === h ? size : total - size,
            open
          );
        } else if (event.key === 'Enter' && bounds[primary].collapsible) {
          next =
            current[primary] > 1e-6
              ? collapseIn(current, primary)
              : expand(current, primary);
        }
        if (!next) return;
        event.preventDefault();
        commit(next);
      };

    // A handle names its pane, so a pane without a label leaves it nameless.
    const unnamed = panes
      .slice(0, -1)
      .some((_, h) => !panes[primaryOf(h, bounds)].props.label);
    useEffect(() => {
      if (unnamed) {
        warnOnce(
          'Splitter:unlabelled',
          '[bestax-bulma] <Splitter> has a handle whose pane has no label. ' +
            'Give each Splitter.Pane a label, so a screen reader can say ' +
            'which pane a handle resizes.'
        );
      }
    }, [unnamed]);

    const collapsed = collapsedAt(sizes);
    const items: React.ReactNode[] = [];
    panes.forEach((pane, i) => {
      items.push(
        <PaneContext.Provider
          // Children.toArray, under flattenChildren, keys every child.
          key={`pane-${String(pane.key)}`}
          value={{ id: ids[i], size: sizes[i], collapsed: collapsed[i] }}
        >
          {pane}
        </PaneContext.Provider>
      );
      if (i === panes.length - 1) return;
      const primary = primaryOf(i, bounds);
      const range = primaryRange(sizes, i, primary, bounds);
      items.push(
        <div
          key={`handle-${i}`}
          className={classNames(handleClass, dragging === i && activeClass)}
          role="separator"
          tabIndex={0}
          aria-orientation={vertical ? 'horizontal' : 'vertical'}
          aria-valuenow={Math.round(range.now)}
          aria-valuemin={Math.round(range.min)}
          aria-valuemax={Math.round(range.max)}
          aria-controls={ids[primary]}
          aria-label={panes[primary].props.label}
          onPointerDown={onPointerDown(i)}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={onDoubleClick(i)}
          onKeyDown={onKeyDown(i)}
        />
      );
    });

    return (
      <div
        ref={setRefs}
        className={classNames(rootClass, bulmaHelperClasses, className)}
        style={height !== undefined ? { ...style, height } : style}
        {...rest}
      >
        {items}
      </div>
    );
  }
);

SplitterRoot.displayName = 'Splitter';

export const Splitter = withSubComponents(SplitterRoot, {
  Pane: SplitterPane,
});

export default Splitter;
