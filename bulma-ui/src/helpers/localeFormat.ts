// Number formatting and text matching in a locale.
//
// `useNumberFormat` and its `NumberFormatFunction` type are public, exported
// from src/index.ts. The rest is INTERNAL, deliberately not exported: the
// library's own callers format through `useScopedNumberFormat` and match
// through `useLocaleMatcher`, which return `null` outside a provider that
// gives a locale, so each keeps the formatting and the matching it has always
// had there.

import { useMemo } from 'react';
import { useLocaleScope } from './LocaleProvider';

/** A combining mark: an accent, a vowel sign or a point written on a letter. */
const MARK = /\p{M}/u;

/** Formats a number for display, with `Intl.NumberFormat` options. */
export type NumberFormatFunction = (
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
 * Every formatter's `Intl.NumberFormat`s, by locale and options, so a page of
 * numbers in one locale and format builds one. Building one is the expensive
 * part of formatting. The oldest goes once there are `MOST_NUMBER_FORMATS`,
 * so a server that writes numbers in many locales doesn't keep them all.
 */
const numberFormats = new Map<string, Intl.NumberFormat>();
const MOST_NUMBER_FORMATS = 200;

/** The `Intl.NumberFormat` for `locale` and `options`, built once. */
function numberFormatFor(
  locale: string | undefined,
  options: Intl.NumberFormatOptions | undefined
): Intl.NumberFormat {
  // A locale tag has no spaces, so the key can't be read two ways.
  const key = `${locale ?? ''} ${options ? JSON.stringify(options) : ''}`;
  let format = numberFormats.get(key);
  if (!format) {
    // Built before anything is stored, so options `Intl` refuses throw its
    // error and leave nothing behind.
    format = new Intl.NumberFormat(locale, options);
    if (numberFormats.size >= MOST_NUMBER_FORMATS) {
      numberFormats.delete(numberFormats.keys().next().value as string);
    }
    numberFormats.set(key, format);
  }
  return format;
}

/**
 * A function that writes numbers for display in a locale: `locale` when given, else the `LocaleProvider`'s around the component, else the runtime's.
 *
 * Formatters are kept per locale and set of options, since building one is
 * the expensive part, and shared, so many numbers written the same way build
 * one. The function is the same from one render to the next for the same
 * locale, so it's safe in a dependency array. Use it for text outside JSX,
 * such as an `aria-label`, a `placeholder` or a chart's axis; in JSX,
 * `NumberFormatter` also marks the number up. On a server render the
 * runtime's locale is the server's, so give it a locale, here or through a
 * `LocaleProvider`, where the server's and the browser's can differ. A tag or
 * options `Intl` refuses throw its error when the function is called.
 *
 * @function
 * @param locale - A BCP 47 locale tag, which wins over the provider's.
 * @returns {NumberFormatFunction} Writes `value` with `Intl.NumberFormat` options.
 *
 * @example
 * const format = useNumberFormat();
 * const placeholder = format(1500, { style: 'currency', currency: 'EUR' });
 */
export function useNumberFormat(locale?: string): NumberFormatFunction {
  const scope = useLocaleScope();
  const resolved = locale || scope?.locale;
  return useMemo<NumberFormatFunction>(
    () => (value, options) => numberFormatFor(resolved, options).format(value),
    [resolved]
  );
}

/**
 * INTERNAL, deliberately not exported from `src/index.ts`. The library's own
 * number formatting: `useNumberFormat`'s inside a `LocaleProvider` that gives
 * a locale, or with the component's own locale inside any provider, and
 * `null` outside one, so each caller keeps the formatting it has always had
 * there.
 *
 * @param own - The component's own locale, such as a picker's `locale`,
 * which wins inside a provider.
 */
export function useScopedNumberFormat(
  own?: string
): NumberFormatFunction | null {
  const format = useNumberFormat(own);
  return useScopedLocale(own) ? format : null;
}

/**
 * A matcher for filtering a list by what was typed, in the locale of the
 * `LocaleProvider` around the component, or `null` outside one that gives a
 * locale. It compares with `Intl.Collator` at `usage: 'search'` and
 * `sensitivity: 'base'`, so it ignores case and accents where the language
 * treats the letters as the same: "cafe" finds "Café", while in Swedish "a"
 * doesn't find "å", a letter of its own there. Marks the language ignores
 * count for nothing on either side, so in Arabic محمد finds مُحَمَّد and the
 * other way round. An empty query, or one of nothing but such marks,
 * matches everything.
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
      if (collator.compare(needle, '') === 0) return true;
      // Compared by code point, so a slice never splits a surrogate pair.
      const chars = Array.from(text.normalize('NFC'));
      const marks = chars.map(char => MARK.test(char));
      // A slice equal to the needle can be longer or shorter than it: the
      // marks the collator ignores, Arabic harakat or Hebrew niqqud, take
      // code points on one side and not the other, and the expansions the
      // collator makes, "ß" against "ss" or "æ" against "ae", turn one letter
      // into two. So each slice runs from a letter to just before the next
      // letter, never cutting a letter from its marks, and the slices from
      // one start grow until they hold twice the needle's letters, which
      // those expansions can't get past. That keeps the work proportional to
      // the text's length, however long a label is, rather than to its
      // square.
      const most =
        2 * Array.from(needle).filter(char => !MARK.test(char)).length;
      for (let start = 0; start < chars.length; start++) {
        if (marks[start]) continue;
        let letters = 0;
        for (let end = start + 1; end <= chars.length; end++) {
          if (!marks[end - 1]) letters++;
          if (letters > most) break;
          if (marks[end]) continue;
          if (
            collator.compare(chars.slice(start, end).join(''), needle) === 0
          ) {
            return true;
          }
        }
      }
      return false;
    };
  }, [locale]);
}
