import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { isGiven } from '../helpers/isGiven';

const validDescriptionListOrientations = ['vertical', 'horizontal'] as const;
/** Whether each label sits above its value (`vertical`) or beside it (`horizontal`). */
export type DescriptionListOrientation =
  (typeof validDescriptionListOrientations)[number];

const isOrientation = (
  orientation?: string
): orientation is DescriptionListOrientation =>
  !!orientation &&
  (validDescriptionListOrientations as readonly string[]).includes(orientation);

/**
 * Props for the DescriptionList component. The helper props, the other
 * attributes and the `ref` land on the `<dl>`.
 *
 * @extraProp {React.Ref<HTMLDListElement>} [ref] - Ref forwarded to the `<dl>`.
 * @extraProp {string} [aria-labelledby] - The id of the heading above the list, which names it.
 */
export interface DescriptionListProps
  extends
    Omit<React.HTMLAttributes<HTMLDListElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** `DescriptionList.Item`s, one for each fact. */
  children?: React.ReactNode;
  /**
   * Whether each label sits above its value or beside it, at every width no
   * `orientation<Viewport>` prop covers. Those props read the way a
   * `Column`'s `size<Viewport>` props do: `orientationMobile` applies below
   * Bulma's tablet breakpoint, each of the others from its own breakpoint
   * up, and where several apply the widest one wins. With none of them,
   * labels sit above their values below the tablet breakpoint and beside
   * them from it up. Beside, the labels share one column as wide as the
   * longest label, up to `--bulma-description-list-label-max-width`, so the
   * values line up.
   */
  orientation?: DescriptionListOrientation;
  /**
   * The orientation below Bulma's tablet breakpoint (769px). Falls back to
   * `orientation`, then to `vertical`.
   */
  orientationMobile?: DescriptionListOrientation;
  /**
   * The orientation from Bulma's tablet breakpoint (769px) up, until a wider
   * viewport's prop takes over. Falls back to `orientation`, then to
   * `horizontal`.
   */
  orientationTablet?: DescriptionListOrientation;
  /**
   * The orientation from Bulma's desktop breakpoint (1024px) up, until a
   * wider viewport's prop takes over. Falls back to `orientationTablet`, and
   * on down.
   */
  orientationDesktop?: DescriptionListOrientation;
  /**
   * The orientation from Bulma's widescreen breakpoint (1216px) up, until
   * `orientationFullhd` takes over. Falls back to `orientationDesktop`, and
   * on down.
   */
  orientationWidescreen?: DescriptionListOrientation;
  /**
   * The orientation from Bulma's fullhd breakpoint (1408px) up. Falls back to
   * `orientationWidescreen`, and on down.
   */
  orientationFullhd?: DescriptionListOrientation;
  /**
   * Draws a line between items, which helps the eye from a label to its
   * value across a wide list, and shows where each item ends to someone
   * zoomed in.
   */
  hasDividers?: boolean;
  /** Text color helper. It colors the values; the labels keep their own color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Props for DescriptionList.Item, one fact. The helper props, the other
 * attributes and the `ref` land on its `<div>`.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the `<div>`.
 */
export interface DescriptionListItemProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * The label, such as "Order", as a `DescriptionList.Label` before the
   * children.
   */
  label?: React.ReactNode;
  /**
   * The value, such as "#1234", as a `DescriptionList.Value` after the
   * children. Text, a link, a `Tag`: anything that renders. `undefined`,
   * `null` and `''` render nothing, so when a value is missing, say so in
   * words, such as "Not given", rather than leave a label with nothing after
   * it.
   */
  value?: React.ReactNode;
  /**
   * `DescriptionList.Label`s and `DescriptionList.Value`s, for what `label`
   * and `value` don't cover, such as a label with an info tip or several
   * values. They render between the two, so a `Label` here reads before
   * `value`, and a `Value` here after `label`.
   */
  children?: React.ReactNode;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Props for DescriptionList.Label. The helper props, the other attributes and
 * the `ref` land on its `<dt>`.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the `<dt>`.
 */
export interface DescriptionListLabelProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * The label. A button may sit in it, such as one that opens a `Popover`
   * about the label, but not a heading, which HTML doesn't allow here.
   */
  children?: React.ReactNode;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Props for DescriptionList.Value. The helper props, the other attributes and
 * the `ref` land on its `<dd>`.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the `<dd>`.
 */
export interface DescriptionListValueProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** The value. Anything goes, a list or a paragraph included. */
  children?: React.ReactNode;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * A label, the name of a fact: a `<dt>`, in the weaker text color.
 *
 * @function
 * @param {DescriptionListLabelProps} props - Props for DescriptionList.Label.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the `<dt>`.
 * @returns {JSX.Element} The rendered label.
 *
 * @example
 * <DescriptionList.Label>Placed on</DescriptionList.Label>
 */
export const DescriptionListLabel = forwardRef<
  HTMLElement,
  DescriptionListLabelProps
>(({ className, textColor, bgColor, children, ...props }, ref) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });
  const labelClass = usePrefixedClassNames('description-list-label');
  return (
    <dt
      ref={ref}
      className={classNames(labelClass, bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </dt>
  );
});

DescriptionListLabel.displayName = 'DescriptionList.Label';

/**
 * A value, what the label says about the thing: a `<dd>`. An item may have several.
 *
 * @function
 * @param {DescriptionListValueProps} props - Props for DescriptionList.Value.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the `<dd>`.
 * @returns {JSX.Element} The rendered value.
 *
 * @example
 * <DescriptionList.Value>14 October 2026</DescriptionList.Value>
 */
export const DescriptionListValue = forwardRef<
  HTMLElement,
  DescriptionListValueProps
>(({ className, textColor, bgColor, children, ...props }, ref) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });
  const valueClass = usePrefixedClassNames('description-list-value');
  return (
    <dd
      ref={ref}
      className={classNames(valueClass, bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </dd>
  );
});

DescriptionListValue.displayName = 'DescriptionList.Value';

/**
 * One fact: its label and its value, in a `<div>`, from the `label` and `value` props or from `Label` and `Value` children.
 *
 * @function
 * @param {DescriptionListItemProps} props - Props for DescriptionList.Item.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the `<div>`.
 * @returns {JSX.Element} The rendered item.
 *
 * @example
 * <DescriptionList.Item label="Order" value="#1234" />
 *
 * @example
 * <DescriptionList.Item label="Tags">
 *   <DescriptionList.Value>Gift</DescriptionList.Value>
 *   <DescriptionList.Value>Priority</DescriptionList.Value>
 * </DescriptionList.Item>
 */
export const DescriptionListItem = forwardRef<
  HTMLDivElement,
  DescriptionListItemProps
>(
  (
    { className, label, value, textColor, bgColor, children, ...props },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });
    const itemClass = usePrefixedClassNames('description-list-item');
    return (
      <div
        ref={ref}
        className={classNames(itemClass, bulmaHelperClasses, className)}
        {...rest}
      >
        {isGiven(label) && <DescriptionListLabel>{label}</DescriptionListLabel>}
        {children}
        {isGiven(value) && <DescriptionListValue>{value}</DescriptionListValue>}
      </div>
    );
  }
);

DescriptionListItem.displayName = 'DescriptionList.Item';

/**
 * The `DescriptionList` component lists facts about one thing, each a label and its value, such as an order's details or a profile.
 *
 * It's a `<dl>`, with a `<div>` for each item, a `<dt>` for each label and
 * a `<dd>` for each value, so assistive tech gets HTML's own list of terms
 * and definitions and no roles are added. Labels sit above their values on
 * a phone and beside them from Bulma's tablet breakpoint up, where every
 * label shares one column so the values line up. For data with two
 * dimensions, such as several records with the same fields, use a `Table`.
 *
 * @function
 * @param {DescriptionListProps} props - Props for the DescriptionList component.
 * @param {React.Ref<HTMLDListElement>} ref - Forwarded ref to the `<dl>`.
 * @returns {JSX.Element} The rendered list.
 *
 * @example
 * <DescriptionList aria-labelledby="order-heading">
 *   <DescriptionList.Item label="Order" value="#1234" />
 *   <DescriptionList.Item label="Placed on" value="14 October 2026" />
 * </DescriptionList>
 */
const DescriptionListRoot = forwardRef<HTMLDListElement, DescriptionListProps>(
  (
    {
      className,
      orientation,
      orientationMobile,
      orientationTablet,
      orientationDesktop,
      orientationWidescreen,
      orientationFullhd,
      hasDividers,
      textColor,
      bgColor,
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
    // A class for each orientation given, which the stylesheet applies from
    // that viewport's breakpoint, so the layout is right on the first paint
    // and on the server. With none, the stylesheet's default is responsive.
    const rootClass = usePrefixedClassNames('description-list', {
      [`is-${orientation}`]: isOrientation(orientation),
      [`is-${orientationMobile}-mobile`]: isOrientation(orientationMobile),
      [`is-${orientationTablet}-tablet`]: isOrientation(orientationTablet),
      [`is-${orientationDesktop}-desktop`]: isOrientation(orientationDesktop),
      [`is-${orientationWidescreen}-widescreen`]: isOrientation(
        orientationWidescreen
      ),
      [`is-${orientationFullhd}-fullhd`]: isOrientation(orientationFullhd),
      'has-dividers': !!hasDividers,
    });
    return (
      <dl
        ref={ref}
        className={classNames(rootClass, bulmaHelperClasses, className)}
        {...rest}
      >
        {children}
      </dl>
    );
  }
);

export const DescriptionList = withSubComponents(
  DescriptionListRoot,
  {
    Item: DescriptionListItem,
    Label: DescriptionListLabel,
    Value: DescriptionListValue,
  },
  'DescriptionList'
);

export default DescriptionList;
