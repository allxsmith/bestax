import { useMemo } from 'react';
import {
  useLocaleScope,
  type PortalLocale,
} from '../../helpers/LocaleProvider';
import {
  canonicalLocale,
  localeDirection,
  localeFirstDay,
} from '../../helpers/localeInfo';
import type { DayOfWeek } from './pickerTypes';

/**
 * A picker's locale: its own `locale`, else the one a `LocaleProvider` around
 * it sets, else `undefined`, which leaves `Intl` to use the runtime's.
 */
export function usePickerLocale(own: string | undefined): string | undefined {
  const scope = useLocaleScope();
  return own || scope?.locale;
}

/** Where a picker's own language and direction go, inside a `LocaleProvider`. */
export interface PickerLocaleScope {
  /**
   * The `lang` and `dir` for the picker's root, so what renders inside it,
   * an inline calendar or a popover in place, follows them. Empty unless the
   * picker has a `locale` of its own.
   */
  rootAttrs: { lang?: string; dir?: string };
  /** What its portaled panel carries; unset outside a provider. */
  panel?: PortalLocale;
}

const NO_ROOT_ATTRS = {};

/**
 * A picker's language and direction inside a `LocaleProvider`, by the rule a
 * nested provider follows: its `lang` is its own `locale`, else the
 * provider's, and its `dir` is the `dir` passed to it, else its own locale's
 * direction when it has one, else the provider's. Outside a provider it
 * changes nothing. A `locale` `Intl` refuses counts as none here, since the
 * picker's own formatting reports it.
 */
export function usePickerLocaleScope(
  ownLocale: string | undefined,
  ownDir: string | undefined
): PickerLocaleScope {
  const scope = useLocaleScope();
  return useMemo(() => {
    if (!scope) return { rootAttrs: NO_ROOT_ATTRS };
    let own: string | undefined;
    try {
      own = canonicalLocale(ownLocale);
    } catch {
      own = undefined;
    }
    const dir = ownDir || (own ? localeDirection(own) : scope.dir);
    return {
      rootAttrs: own ? { lang: own, dir } : NO_ROOT_ATTRS,
      panel: { locale: own || scope.locale, dir },
    };
  }, [scope, ownLocale, ownDir]);
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
