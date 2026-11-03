import React, { forwardRef, useContext, useEffect, useMemo } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { isGiven } from '../helpers/isGiven';
import { useNumberFormat } from '../helpers/localeFormat';
import { warnOnce } from '../helpers/devWarnings';
import { NumberFormatter } from './NumberFormatter';
import { Skeleton } from './Skeleton';
import { StatScopeContext } from './statContext';

/** The colors a Stat's change can take, the union `messageColor` takes. */
export type StatChangeColor =
  'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';

/** How a change is written when no format is given: a signed percentage. */
const DEFAULT_CHANGE_FORMAT: Intl.NumberFormatOptions = {
  style: 'percent',
  signDisplay: 'exceptZero',
  maximumFractionDigits: 1,
};

/**
 * Props for the Stat component. The helper props, the other attributes and
 * the `ref` land on its root: a `<div>` inside `Stats`, or its own `<dl>` on
 * its own.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the root, a `<div>` inside `Stats` or a `<dl>` on its own.
 */
export interface StatProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * What the figure is ("Revenue"), as a `Stat.Label` before the children.
   * A Stat needs one, here or as a `Stat.Label` child: it's the figure's
   * name for assistive tech, and a definition list's values belong to a
   * term. A Stat with neither a `label` nor children warns in development.
   */
  label?: React.ReactNode;
  /**
   * The figure, as a `Stat.Value` after the children. A number is written by
   * `NumberFormatter` with `format` and `locale`; anything else, such as
   * "N/A", renders as given, and `0` renders. `undefined`, `null`, a boolean
   * and `''` leave it empty: in a Stat with no children its `<dd>` still
   * renders, so the label keeps a definition while the figure is missing.
   */
  value?: React.ReactNode;
  /**
   * `Intl.NumberFormat` options for a number `value`, as NumberFormatter's
   * `format`. A `value` that isn't a number ignores it.
   */
  format?: Intl.NumberFormatOptions;
  /**
   * The locale for `value` and `change`, as NumberFormatter's `locale`.
   * Unset, it's the `LocaleProvider`'s around it, and with neither, the
   * runtime's own, so give one, here or through a `LocaleProvider`, on a
   * page rendered on the server.
   */
  locale?: string;
  /**
   * The change, as a `Stat.Change` after the value. With the default format
   * it's a fraction (`0.12` for 12%); with your own `changeFormat`, it's in
   * that format's terms. It's written with its sign, so the direction is in
   * the text.
   */
  change?: number;
  /**
   * `Intl.NumberFormat` options for `change`. Yours replace the default, and
   * `signDisplay: 'exceptZero'` is added unless you set a `signDisplay`.
   * @defaultValue { style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 1 }
   */
  changeFormat?: Intl.NumberFormatOptions;
  /**
   * The change's color. Unset, it's the sign's: `success` up, `danger` down,
   * and none at zero. Set it where up is bad news, such as a cost or an
   * error rate.
   */
  changeColor?: StatChangeColor;
  /** A note under the figure ("since last month"), as a `Stat.Description` last. */
  description?: React.ReactNode;
  /**
   * The figure's size, a step of Bulma's size scale. The label, the change
   * and the note stay small.
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Shows a `Skeleton` in place of `value`, one line of the figure tall,
   * and sets `aria-busy` on the Stat. The label, the change and the note
   * render as given. It stands in for the `value` prop only: a `Stat.Value`
   * you give as a child renders as given, so put a `Skeleton` in it yourself.
   */
  loading?: boolean;
  /**
   * `Stat.Label`, `Stat.Value`, `Stat.Change` and `Stat.Description`, for
   * anything the props don't cover, such as a unit or an info tip. They
   * render between `label` and `value`. They're this Stat's own parts, so
   * not another Stat: that would be a list inside this one's. With children,
   * the figure's `<dd>` renders only for a `value`, so give the parts a
   * `Stat.Value` yourself.
   */
  children?: React.ReactNode;
  /**
   * Text color helper. It colors the figure; the label, the change and the
   * note keep their own colors. Inside `Stats`, a Stat without one takes the
   * row's.
   */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Props for Stat.Label, what the figure is. The helper props, the other
 * attributes and the `ref` land on its `<dt>`.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the `<dt>`.
 */
export interface StatLabelProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * The label. A button may sit in it, such as one that opens a `Popover`
   * about the figure, but not a heading, which HTML doesn't allow here.
   */
  children?: React.ReactNode;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Props for Stat.Value, the figure. The helper props, the other attributes
 * and the `ref` land on its `<dd>`.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the `<dd>`.
 */
export interface StatValueProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * The figure, written as you give it, so write a number with
   * `NumberFormatter`.
   */
  children?: React.ReactNode;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Props for Stat.Description, a note under the figure. The helper props, the
 * other attributes and the `ref` land on its `<dd>`.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the `<dd>`.
 */
export interface StatDescriptionProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** The note, such as "since last month". */
  children?: React.ReactNode;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Props for Stat.Change, a change written with its sign. The helper props,
 * the other attributes and the `ref` land on its `<dd>`.
 *
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the `<dd>`.
 */
export interface StatChangeProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color' | 'children'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * The change, as Stat's `change`. One that rounds to zero in its format,
   * such as `0.0004` at one decimal place of a percentage, reads as zero, so
   * it gets no arrow and no color of its own.
   */
  value: number;
  /**
   * As Stat's `changeFormat`: yours replace the default, and
   * `signDisplay: 'exceptZero'` is added unless you set a `signDisplay`.
   * @defaultValue { style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 1 }
   */
  format?: Intl.NumberFormatOptions;
  /** As Stat's `locale`. Unset, the Stat's. */
  locale?: string;
  /**
   * As Stat's `changeColor`. Unset, it's the sign's: `success` up, `danger`
   * down, and none at zero. Set, it applies at zero too.
   */
  color?: StatChangeColor;
}

/**
 * What the figure is: a `<dt>`, small and in the weaker text color.
 *
 * @function
 * @param {StatLabelProps} props - Props for Stat.Label.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the `<dt>`.
 * @returns {JSX.Element} The rendered label.
 *
 * @example
 * <Stat.Label>Revenue</Stat.Label>
 */
export const StatLabel = forwardRef<HTMLElement, StatLabelProps>(
  ({ className, textColor, bgColor, children, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });
    const labelClass = usePrefixedClassNames('stat-label');
    return (
      <dt
        ref={ref}
        className={classNames(labelClass, bulmaHelperClasses, className)}
        {...rest}
      >
        {children}
      </dt>
    );
  }
);

StatLabel.displayName = 'Stat.Label';

/**
 * The figure: a `<dd>`, large, in the Stat's color, with digits of one width so a figure that updates doesn't shift.
 *
 * @function
 * @param {StatValueProps} props - Props for Stat.Value.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the `<dd>`.
 * @returns {JSX.Element} The rendered figure.
 *
 * @example
 * <Stat.Value>
 *   <NumberFormatter value={182} format={{ style: 'unit', unit: 'millisecond' }} />
 * </Stat.Value>
 */
export const StatValue = forwardRef<HTMLElement, StatValueProps>(
  ({ className, textColor, bgColor, children, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });
    const valueClass = usePrefixedClassNames('stat-value');
    return (
      <dd
        ref={ref}
        className={classNames(valueClass, bulmaHelperClasses, className)}
        {...rest}
      >
        {children}
      </dd>
    );
  }
);

StatValue.displayName = 'Stat.Value';

/**
 * A note under the figure: a `<dd>`, small and in the weaker text color.
 *
 * @function
 * @param {StatDescriptionProps} props - Props for Stat.Description.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the `<dd>`.
 * @returns {JSX.Element} The rendered note.
 *
 * @example
 * <Stat.Description>since last month</Stat.Description>
 */
export const StatDescription = forwardRef<HTMLElement, StatDescriptionProps>(
  ({ className, textColor, bgColor, children, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });
    const descriptionClass = usePrefixedClassNames('stat-description');
    return (
      <dd
        ref={ref}
        className={classNames(descriptionClass, bulmaHelperClasses, className)}
        {...rest}
      >
        {children}
      </dd>
    );
  }
);

StatDescription.displayName = 'Stat.Description';

/**
 * A change written with its sign, such as "+12%", after an arrow that repeats the direction: a `<dd>`, green when it's up and red when it's down unless `color` says otherwise.
 *
 * The sign is in the text, written by `Intl` for the locale, so a screen
 * reader hears the direction; the arrow is hidden from assistive tech, and
 * the color repeats the direction for sighted readers rather than carry it.
 *
 * @function
 * @param {StatChangeProps} props - Props for Stat.Change.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the `<dd>`.
 * @returns {JSX.Element} The rendered change.
 *
 * @example
 * <Stat.Change value={-0.08} color="success" />
 */
export const StatChange = forwardRef<HTMLElement, StatChangeProps>(
  ({ className, value, format, locale, color, ...props }, ref) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const scope = useContext(StatScopeContext);
    const ownLocale = locale || scope.locale;
    const options = format
      ? { ...format, signDisplay: format.signDisplay || 'exceptZero' }
      : DEFAULT_CHANGE_FORMAT;
    // A change that rounds to zero gets no arrow and no tone, which would
    // contradict a figure of zero. Its size is compared rather than the
    // change itself, so the test holds whatever the `signDisplay`: under
    // 'auto' or 'always', -0.0004 is written "-0%", which zero isn't.
    const formatNumber = useNumberFormat(ownLocale);
    const direction =
      formatNumber(Math.abs(value), options) === formatNumber(0, options)
        ? 0
        : Math.sign(value);
    const tone =
      color ||
      (direction > 0 ? 'success' : direction < 0 ? 'danger' : undefined);
    const changeClass = usePrefixedClassNames('stat-change', {
      [`is-${tone}`]: !!tone,
    });
    return (
      <dd
        ref={ref}
        className={classNames(changeClass, bulmaHelperClasses, className)}
        {...rest}
      >
        {(direction > 0 || direction < 0) && (
          <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true">
            <path
              d={
                direction > 0
                  ? 'M8 13V3M3.5 7.5 8 3l4.5 4.5'
                  : 'M8 3v10M3.5 8.5 8 13l4.5-4.5'
              }
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <NumberFormatter value={value} format={options} locale={ownLocale} />
      </dd>
    );
  }
);

StatChange.displayName = 'Stat.Change';

/**
 * The `Stat` component shows a figure with its name, and often a change and a note, such as a dashboard's revenue or an account's storage used.
 *
 * It's a label and its values in a description list: a `<dt>` for the
 * label, and a `<dd>` each for the figure, the change and the note. On its
 * own it renders its own `<dl>`; inside `Stats` it's a `<div>` in the row's.
 * A number `value` is written by `NumberFormatter`, so it follows a
 * `LocaleProvider`. A change is written with its sign ("+12%"), so the
 * direction is in the text, beside a decorative arrow and a color.
 *
 * @function
 * @param {StatProps} props - Props for the Stat component.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the root.
 * @returns {JSX.Element} The rendered stat.
 *
 * @example
 * <Stat
 *   label="Revenue"
 *   value={8456.4}
 *   format={{ style: 'currency', currency: 'USD' }}
 *   change={0.12}
 *   description="since last month"
 * />
 */
const StatRoot = forwardRef<HTMLElement, StatProps>(
  (
    {
      className,
      label,
      value,
      format,
      locale,
      change,
      changeFormat,
      changeColor,
      description,
      size,
      loading,
      textColor,
      bgColor,
      children,
      ...props
    },
    ref
  ) => {
    const scope = useContext(StatScopeContext);
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor || scope.textColor,
      backgroundColor: bgColor,
      ...props,
    });
    const statClass = usePrefixedClassNames('stat', {
      [`is-${size}`]: !!size,
    });
    const hasParts = isGiven(children);
    // Without a label or parts that could hold one, the figure has no name
    // and the values no term. With parts, the label is the caller's to give.
    const unlabelled = !isGiven(label) && !hasParts;
    useEffect(() => {
      if (unlabelled) {
        warnOnce(
          'Stat:unlabelled',
          '[bestax-bulma] <Stat> has no label. Pass label, or a Stat.Label ' +
            'child, so the figure has a name for assistive tech and its ' +
            'values have a term in the list.'
        );
      }
    }, [unlabelled]);
    // Its parts take its locale and leave the row, so a Stat inside one of
    // them, in a `<dd>`, renders a `<dl>` of its own.
    const inner = useMemo(() => ({ row: false, locale }), [locale]);
    const Root = scope.row ? 'div' : 'dl';
    const figure = loading ? (
      <Skeleton />
    ) : typeof value === 'number' ? (
      <NumberFormatter value={value} format={format} locale={locale} />
    ) : isGiven(value) ? (
      value
    ) : null;
    return (
      <Root
        ref={ref as React.Ref<HTMLDivElement & HTMLDListElement>}
        className={classNames(statClass, bulmaHelperClasses, className)}
        {...rest}
        aria-busy={loading || rest['aria-busy']}
      >
        <StatScopeContext.Provider value={inner}>
          {isGiven(label) && <StatLabel>{label}</StatLabel>}
          {children}
          {/* Without parts, the figure's <dd> always renders, empty while
              there's no figure, so the label keeps its definition. */}
          {(figure !== null || !hasParts) && <StatValue>{figure}</StatValue>}
          {typeof change === 'number' && (
            <StatChange
              value={change}
              format={changeFormat}
              color={changeColor}
            />
          )}
          {isGiven(description) && (
            <StatDescription>{description}</StatDescription>
          )}
        </StatScopeContext.Provider>
      </Root>
    );
  }
);

export const Stat = withSubComponents(
  StatRoot,
  {
    Label: StatLabel,
    Value: StatValue,
    Change: StatChange,
    Description: StatDescription,
  },
  'Stat'
);

export default Stat;
