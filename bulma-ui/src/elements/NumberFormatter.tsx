import React, { forwardRef } from 'react';
import { classNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useNumberFormat } from '../helpers/localeFormat';

/**
 * Props for the NumberFormatter component. The helper props, the other
 * attributes and the `ref` land on the `<data>`.
 *
 * @extraProp {React.Ref<HTMLDataElement>} [ref] - Ref forwarded to the `<data>`.
 */
export interface NumberFormatterProps
  extends
    Omit<
      React.DataHTMLAttributes<HTMLDataElement>,
      'value' | 'color' | 'children'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * The number. The text is what `Intl.NumberFormat` writes for it, `NaN`
   * and `Infinity` included. The `<data>` element's `value` attribute holds
   * it as `String()` writes it, except that `-0` keeps its sign, so
   * `Number()` reads it back: `1234.5`, `1e+21` for a very large one and
   * `1e-7` for a very small one, `NaN`, `Infinity` and `-0`.
   */
  value: number;
  /**
   * `Intl.NumberFormat` options: a currency, a percentage, a unit, compact
   * notation, the fraction digits, the sign. Options `Intl` refuses, such as
   * `style: 'currency'` with no `currency`, throw its error.
   */
  format?: Intl.NumberFormatOptions;
  /**
   * BCP 47 locale tag. Unset, it's the `locale` of a `LocaleProvider` around
   * it, and with neither, the runtime's own. On a server render that's the
   * server's, so give it a locale, here or through a `LocaleProvider`, where
   * the server's and the browser's can differ. A tag `Intl` refuses, such as
   * `"en_US"`, is ignored, with a warning in development, as
   * `LocaleProvider` ignores one.
   */
  locale?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * The `NumberFormatter` component writes a number the way a locale writes it, such as a price, a percentage or a count, in a `<data>` element that keeps the number itself in its `value`.
 *
 * It formats with `Intl.NumberFormat`, in its own `locale`, else the
 * `LocaleProvider`'s around it, else the runtime's, with `format` as the
 * options. The `<data>` has no role and no class of its own, so a screen
 * reader reads the formatted text and it takes the look of the text around
 * it. For text outside JSX, such as an `aria-label`, `useNumberFormat`
 * gives the same formatting as a function.
 *
 * @function
 * @param {NumberFormatterProps} props - Props for the NumberFormatter component.
 * @param {React.Ref<HTMLDataElement>} ref - Forwarded ref to the `<data>`.
 * @returns {JSX.Element} The rendered number.
 *
 * @example
 * <NumberFormatter
 *   value={8456.4}
 *   format={{ style: 'currency', currency: 'USD' }}
 * />
 */
export const NumberFormatter = forwardRef<
  HTMLDataElement,
  NumberFormatterProps
>(({ className, textColor, bgColor, value, format, locale, ...props }, ref) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });
  const formatNumber = useNumberFormat(locale);
  return (
    <data
      ref={ref}
      className={classNames(bulmaHelperClasses, className) || undefined}
      {...rest}
      value={Object.is(value, -0) ? '-0' : String(value)}
    >
      {formatNumber(value, format)}
    </data>
  );
});

NumberFormatter.displayName = 'NumberFormatter';

export default NumberFormatter;
