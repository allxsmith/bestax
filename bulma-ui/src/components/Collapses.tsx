import React, { useState } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { Collapse } from './Collapse';
import { CollapsesItemContext } from './collapsesContext';

/**
 * Props shared by both modes of the Collapses component.
 */
interface CollapsesBaseProps
  extends
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'color' | 'defaultValue' | 'onChange'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Joins the items into one block, with no gap between them and only the outer corners rounded. The joins show on `bordered` items. */
  seamless?: boolean;
  /** Additional CSS classes to apply. */
  className?: string;
  /** The `Collapse` items. Each child element is one item, indexed from 0 in order, with the children of a fragment counted one by one. A child that sets its own `open` keeps it: the group leaves that item alone. */
  children?: React.ReactNode;
}

/**
 * Props for Collapses in single mode, the accordion: opening one item closes the others.
 */
export interface CollapsesSingleProps extends CollapsesBaseProps {
  /**
   * Lets items open independently. Without it, opening one item closes the others.
   * @defaultValue false
   */
  multiple?: false;
  /** Controlled open items: the index of the open item, or `null` for none. With `multiple`, an array of indexes. An index is a position among the children, so rendering an item conditionally or reordering them moves the open state onto a neighbour: render every item and hide one with `visibility="hidden"`, or keep `value` in step yourself. */
  value?: number | null;
  /** Open items for uncontrolled use, as an index or `null` (the default, none open). With `multiple`, an array of indexes, empty by default. Indexes are positions among the children, as for `value`. */
  defaultValue?: number | null;
  /** Called with the new open items each time a trigger asks for a change, whether or not `value` is set: an index or `null`, or with `multiple` an array of indexes in ascending order. Indexes are positions among the children, as for `value`. */
  onChange?: (value: number | null) => void;
}

/**
 * Props for Collapses with `multiple`: items open and close independently.
 */
export interface CollapsesMultipleProps extends CollapsesBaseProps {
  /**
   * Lets items open independently. Without it, opening one item closes the others.
   * @defaultValue false
   */
  multiple: true;
  /** Controlled open items: the index of the open item, or `null` for none. With `multiple`, an array of indexes. An index is a position among the children, so rendering an item conditionally or reordering them moves the open state onto a neighbour: render every item and hide one with `visibility="hidden"`, or keep `value` in step yourself. */
  value?: number[];
  /** Open items for uncontrolled use, as an index or `null` (the default, none open). With `multiple`, an array of indexes, empty by default. Indexes are positions among the children, as for `value`. */
  defaultValue?: number[];
  /** Called with the new open items each time a trigger asks for a change, whether or not `value` is set: an index or `null`, or with `multiple` an array of indexes in ascending order. Indexes are positions among the children, as for `value`. */
  onChange?: (value: number[]) => void;
}

/**
 * Props for the Collapses component, a discriminated union on `multiple`: the open items are an index (or `null`) in single mode and an array of indexes with `multiple`.
 */
export type CollapsesProps = CollapsesSingleProps | CollapsesMultipleProps;

/** Either mode's value as the list of open indexes. */
function toIndexes(value: number | number[] | null | undefined): number[] {
  if (Array.isArray(value)) return value;
  return typeof value === 'number' ? [value] : [];
}

/**
 * Flattens Fragment children (recursively) so each item inside one gets its
 * own index rather than sharing the fragment's. Children.toArray keys restart
 * at ".0" inside each fragment, so those children are re-keyed with the
 * fragment's own key as a prefix, the way Avatars does it.
 */
function flattenChildren(
  children: React.ReactNode,
  keyPrefix = ''
): React.ReactNode[] {
  return React.Children.toArray(children).flatMap(child => {
    if (!React.isValidElement(child)) return [child];
    if (child.type === React.Fragment) {
      return flattenChildren(
        (child.props as { children?: React.ReactNode }).children,
        keyPrefix + child.key
      );
    }
    return [
      keyPrefix
        ? React.cloneElement(child, { key: keyPrefix + child.key })
        : child,
    ];
  });
}

/**
 * The `Collapses` component groups `Collapse` items into an accordion that keeps one item open at a time, or any number with `multiple`.
 *
 * @function
 * @param {CollapsesProps} props - Props for the Collapses component.
 * @returns {JSX.Element} The rendered group.
 *
 * @example
 * // Accordion: one item open at a time, the first to start with
 * <Collapses defaultValue={0}>
 *   <Collapse bordered trigger={<strong>Shipping</strong>}>…</Collapse>
 *   <Collapse bordered trigger={<strong>Returns</strong>}>…</Collapse>
 * </Collapses>
 *
 * @example
 * // Controlled, with items that open independently
 * const [open, setOpen] = useState<number[]>([]);
 * <Collapses multiple value={open} onChange={setOpen}>…</Collapses>
 */
const CollapsesComponent: React.FC<CollapsesProps> = ({
  multiple = false,
  value,
  defaultValue,
  onChange,
  seamless = false,
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  // Controlled vs uncontrolled, as in Tabs. State is held as a list of open
  // indexes in both modes; `multiple` only decides how a change is computed
  // and which shape `onChange` receives.
  const isControlled = value !== undefined;
  const [internalOpen, setInternalOpen] = useState(() =>
    toIndexes(defaultValue)
  );
  const openIndexes = isControlled ? toIndexes(value) : internalOpen;

  // Each mode types `onChange` for its own shape, and the value built below
  // always matches `multiple`, the union's discriminant.
  const reportChange = onChange as
    ((next: number | number[] | null) => void) | undefined;

  const setItemOpen = (index: number, open: boolean) => {
    const others = openIndexes.filter(i => i !== index);
    // Single mode keeps at most one item open, so opening one drops the rest.
    // Ascending order, whatever order the items were opened in, so the value
    // reads and compares the same way however the user got there.
    const next = (
      open ? (multiple ? [...others, index] : [index]) : others
    ).sort((a, b) => a - b);
    if (!isControlled) setInternalOpen(next);
    reportChange?.(multiple ? next : (next[0] ?? null));
  };

  const groupClasses = usePrefixedClassNames('collapses', {
    'is-seamless': seamless,
  });
  const combinedClasses = classNames(
    groupClasses,
    bulmaHelperClasses,
    className
  );

  const items: React.ReactNode[] = [];
  let index = 0;
  for (const child of flattenChildren(children)) {
    if (!React.isValidElement(child)) {
      items.push(child);
      continue;
    }
    const itemIndex = index;
    index += 1;
    items.push(
      <CollapsesItemContext.Provider
        key={child.key}
        value={{
          open: openIndexes.includes(itemIndex),
          setOpen: open => setItemOpen(itemIndex, open),
        }}
      >
        {child}
      </CollapsesItemContext.Provider>
    );
  }

  return (
    <div className={combinedClasses} {...rest}>
      {items}
    </div>
  );
};

export const Collapses = withSubComponents(
  CollapsesComponent,
  { Collapse },
  'Collapses'
);

export default Collapses;
