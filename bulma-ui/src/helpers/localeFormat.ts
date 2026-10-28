// INTERNAL: deliberately not exported from src/index.ts. Number formatting
// and text matching in a LocaleProvider's locale. Both return `null` outside
// a provider that gives a locale, so each caller keeps the formatting and the
// matching it has always had there.

import { useMemo } from 'react';
import { useLocaleScope } from './LocaleProvider';

/** Formats a number for display, with `Intl.NumberFormat` options. */
export type NumberFormatter = (
  value: number,
  options?: Intl.NumberFormatOptions
) => string;

/** Whether `text` contains `query`, as the locale compares letters. */
export type TextMatcher = (text: string, query: string) => boolean;

/**
 * The locale a component formats and matches in: inside a `LocaleProvider`,
 * the component's own locale when it has one (a picker's `locale`), else the
 * provider's; outside a provider, none.
 */
function useScopedLocale(own: string | undefined): string | undefined {
  const scope = useLocaleScope();
  if (!scope) return undefined;
  return own || scope.locale;
}

/**
 * A formatter for numbers shown on screen, in the locale of the
 * `LocaleProvider` around the component, or `null` outside one that gives a
 * locale. Formatters are kept per set of options, since building one is the
 * expensive part.
 *
 * @param own - The component's own locale, such as a picker's `locale`,
 * which wins inside a provider.
 */
export function useNumberFormat(own?: string): NumberFormatter | null {
  const locale = useScopedLocale(own);
  return useMemo(() => {
    if (!locale) return null;
    const formats = new Map<string, Intl.NumberFormat>();
    return (value, options) => {
      const key = options ? JSON.stringify(options) : '';
      let format = formats.get(key);
      if (!format) {
        format = new Intl.NumberFormat(locale, options);
        formats.set(key, format);
      }
      return format.format(value);
    };
  }, [locale]);
}

/**
 * A matcher for filtering a list by what was typed, in the locale of the
 * `LocaleProvider` around the component, or `null` outside one that gives a
 * locale. It compares with `Intl.Collator` at `usage: 'search'` and
 * `sensitivity: 'base'`, so it ignores case and accents where the language
 * treats the letters as the same: "cafe" finds "Café", while in Swedish "a"
 * doesn't find "å", a letter of its own there. An empty query matches
 * everything.
 */
export function useLocaleMatcher(): TextMatcher | null {
  const locale = useScopedLocale(undefined);
  return useMemo(() => {
    if (!locale) return null;
    const collator = new Intl.Collator(locale, {
      usage: 'search',
      sensitivity: 'base',
    });
    return (text, query) => {
      const needle = query.normalize('NFC');
      if (needle.length === 0) return true;
      const haystack = text.normalize('NFC');
      for (let i = 0; i + needle.length <= haystack.length; i++) {
        if (
          collator.compare(haystack.slice(i, i + needle.length), needle) === 0
        ) {
          return true;
        }
      }
      return false;
    };
  }, [locale]);
}
