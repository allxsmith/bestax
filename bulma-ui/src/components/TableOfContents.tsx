import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useScrollSpy } from '../helpers/useScrollSpy';
import { MenuItem, MenuLabel, MenuList } from './Menu';

export { useScrollSpy } from '../helpers/useScrollSpy';
export type { UseScrollSpyOptions } from '../helpers/useScrollSpy';

/** One entry in a TableOfContents. */
export interface TableOfContentsItem {
  /** **Required.** The `id` of the section or heading it links to, without the `#`. Unique on the page. */
  id: string;
  /** **Required.** What the link says, usually the heading's own text. */
  label: React.ReactNode;
  /** Entries under this one, drawn as a nested list. */
  children?: TableOfContentsItem[];
}

/** The visible strings, in your app's language. */
export interface TableOfContentsLabels {
  /**
   * The list's visible title, which also names its `<nav>`.
   * @defaultValue 'On this page'
   */
  title?: string;
}

/**
 * Props for the TableOfContents component. The helper props, the other
 * attributes and the `ref` land on the `<nav>`.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the `<nav>`.
 */
export interface TableOfContentsProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color' | 'children'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * **Required.** The sections, in page order, as links to their ids. Each
   * link is a plain `<a href="#id">`, so following one is the browser's own
   * jump: put `scroll-padding-top` on the page to land clear of a sticky
   * header, and smooth scrolling, if you want it, in page CSS inside
   * `@media (prefers-reduced-motion: no-preference)`.
   */
  items: TableOfContentsItem[];
  /**
   * Called with the current section's id when it changes, or `null` above
   * the first section. Never called on the server or before hydration.
   */
  onCurrentChange?: (id: string | null) => void;
  /**
   * Pixels from the viewport's top where a section counts as reached.
   * Unset, it's the page's `scroll-padding-top`, so the highlight agrees
   * with where a jump lands under a sticky header.
   */
  offset?: number;
  /**
   * Sticks to the top of the viewport as the page scrolls, at
   * `--bulma-table-of-contents-sticky-top`, and scrolls itself when it's
   * taller than the viewport. Adds `is-sticky`.
   */
  isSticky?: boolean;
  /** The visible strings, in your app's language. */
  labels?: TableOfContentsLabels;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/** Every id in the tree, in page order. */
const idsOf = (items: TableOfContentsItem[]): string[] =>
  items.flatMap(item => [item.id, ...idsOf(item.children ?? [])]);

/**
 * The entries as `MenuItem` links, each entry's own entries in a nested
 * `MenuList`, and the current one marked.
 */
const entries = (items: TableOfContentsItem[], active: string | null) =>
  items.map(item => {
    const current = item.id === active;
    return (
      <MenuItem
        key={item.id}
        href={`#${encodeURIComponent(item.id)}`}
        active={current}
        aria-current={current ? 'location' : undefined}
      >
        {item.label}
        {item.children?.length ? (
          <MenuList>{entries(item.children, active)}</MenuList>
        ) : null}
      </MenuItem>
    );
  });

/**
 * The `TableOfContents` component lists a long page's sections as links in Bulma's menu look, and marks the one being read.
 *
 * It's a `<nav>` named by its title, holding `MenuList` and `MenuItem` links
 * to each `#id`, rendered in full on the server. `useScrollSpy` picks the
 * current section, and its link alone gets `is-active` and
 * `aria-current="location"`. Use the hook on its own to mark the section in
 * view somewhere else, such as an app's nav `Menu`.
 *
 * @function
 * @param {TableOfContentsProps} props - Props for the TableOfContents component.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the `<nav>`.
 * @returns {JSX.Element} The rendered table of contents.
 *
 * @example
 * <TableOfContents
 *   isSticky
 *   items={[
 *     { id: 'install', label: 'Install' },
 *     { id: 'usage', label: 'Usage', children: [{ id: 'props', label: 'Props' }] },
 *   ]}
 * />
 */
export const TableOfContents = forwardRef<HTMLElement, TableOfContentsProps>(
  (
    {
      className,
      textColor,
      bgColor,
      items,
      onCurrentChange,
      offset,
      isSticky,
      labels,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });
    const titleId = useId();
    const active = useScrollSpy({ ids: idsOf(items), offset, onCurrentChange });

    const navRef = useRef<HTMLElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLElement | null) => {
        navRef.current = node;
        if (typeof ref === 'function') return ref(node);
        if (ref) ref.current = node;
      },
      [ref]
    );

    // A list taller than the room it has scrolls itself to keep the current
    // link in view. Only the list moves: scrollIntoView would move the page
    // too whenever the link is off screen.
    useEffect(() => {
      const nav = navRef.current!;
      const link = nav.querySelector('a[aria-current="location"]');
      if (!link || nav.scrollHeight <= nav.clientHeight) return;
      const top = nav.getBoundingClientRect().top + nav.clientTop;
      const bottom = top + nav.clientHeight;
      const at = link.getBoundingClientRect();
      if (at.top < top) nav.scrollTop -= top - at.top;
      else if (at.bottom > bottom) nav.scrollTop += at.bottom - bottom;
    }, [active]);

    // Bulma's menu, which draws it, and its own class beside it.
    const menuClass = usePrefixedClassNames('menu');
    const rootClass = usePrefixedClassNames('table-of-contents', {
      'is-sticky': !!isSticky,
    });

    return (
      <nav
        ref={setRefs}
        className={classNames(
          menuClass,
          rootClass,
          bulmaHelperClasses,
          className
        )}
        aria-labelledby={titleId}
        {...rest}
      >
        <MenuLabel id={titleId}>{labels?.title || 'On this page'}</MenuLabel>
        <MenuList>{entries(items, active)}</MenuList>
      </nav>
    );
  }
);

TableOfContents.displayName = 'TableOfContents';

export default TableOfContents;
