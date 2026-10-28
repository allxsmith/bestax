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
 * The day a picker's week starts on: its own `firstDayOfWeek`, else, inside a
 * `LocaleProvider`, the first day of the locale the picker uses, else Sunday.
 * Outside a provider it stays Sunday whatever the locale, as it always has,
 * and so does a picker inside one with no locale from either, since the
 * runtime's own differs between the server and the browser.
 */
export function usePickerFirstDayOfWeek(
  own: DayOfWeek | undefined,
  locale: string | undefined
): DayOfWeek {
  const inProvider = useLocaleScope() !== null;
  return useMemo(() => {
    if (own !== undefined) return own;
    if (!inProvider || !locale) return 0;
    try {
      return localeFirstDay(canonicalLocale(locale) as string);
    } catch {
      // A tag Intl refuses: the picker's own formatting says so.
      return 0;
    }
  }, [own, inProvider, locale]);
}
