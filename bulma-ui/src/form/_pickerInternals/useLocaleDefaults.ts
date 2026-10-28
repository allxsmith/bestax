import { useMemo } from 'react';
import { useLocaleScope } from '../../helpers/LocaleProvider';
import { canonicalLocale, localeFirstDay } from '../../helpers/localeInfo';
import type { DayOfWeek } from './pickerTypes';

/**
 * A picker's locale: its own `locale`, else the one a `LocaleProvider` around
 * it sets, else `undefined`, which leaves `Intl` to use the runtime's.
 */
export function usePickerLocale(own: string | undefined): string | undefined {
  const scope = useLocaleScope();
  return own || scope?.locale;
}

/**
 * Whether a picker's `dayNames` replace the calendar's own, which `Calendar`
 * does only for a full week of seven.
 */
export function hasOwnDayNames(dayNames: string[] | undefined): boolean {
  return dayNames !== undefined && dayNames.length === 7;
}

/**
 * The day a picker's week starts on: its own `firstDayOfWeek`, else, inside a
 * `LocaleProvider`, the first day of the locale the picker uses, else Sunday.
 * Outside a provider it stays Sunday whatever the locale, as it always has,
 * and so does a picker inside one with no locale from either, since the
 * runtime's own differs between the server and the browser.
 *
 * It also stays Sunday for a picker that brings its own `dayNames`. The
 * calendar shows those exactly as given, in calendar order, and before the
 * provider an unset `firstDayOfWeek` was always Sunday, so names written
 * Sunday first would sit a day or more off their columns if the week moved
 * under them.
 */
export function usePickerFirstDayOfWeek(
  own: DayOfWeek | undefined,
  locale: string | undefined,
  hasDayNames: boolean
): DayOfWeek {
  const inProvider = useLocaleScope() !== null;
  return useMemo(() => {
    if (own !== undefined) return own;
    if (!inProvider || !locale || hasDayNames) return 0;
    try {
      return localeFirstDay(canonicalLocale(locale) as string);
    } catch {
      // A tag Intl refuses: the picker's own formatting says so.
      return 0;
    }
  }, [own, inProvider, locale, hasDayNames]);
}
