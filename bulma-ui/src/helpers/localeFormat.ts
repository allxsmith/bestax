// Number formatting and text matching in a locale.
//
// `useNumberFormat` and its `NumberFormatFunction` type are public, exported
// from src/index.ts. The rest is INTERNAL, deliberately not exported.
//
// Which a component calls depends on its job. A component whose job is to
// write a number, such as `NumberFormatter`, uses `useNumberFormat`, which
// writes in the runtime's locale outside a `LocaleProvider`, as the pickers
// do. Any other component that shows a number in passing, such as a badge
// count, a page number or a step's number, uses `useScopedNumberFormat`,
// and filters a list through `useLocaleMatcher`. Those two return `null`
// outside a provider, and inside one that gives no locale, as a provider
// with only a `dir` doesn't, so the component keeps the formatting and the
// matching it has always had there, as `LocaleProvider` promises.

import { useMemo } from 'react';
import { useLocaleScope, validLocale } from './LocaleProvider';
import { warnOnce } from './devWarnings';

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
 * The warning about a locale `Intl` refuses, given to `useNumberFormat`,
 * and so to `NumberFormatter`, the only callers that pass one.
 */
const warnOwnLocale = (tag: string) =>
  warnOnce(
    `number-format-invalid-locale:${tag}`,
    `[bestax-bulma] NumberFormatter or useNumberFormat was given the locale ` +
      `"${tag}", which is not a language tag Intl accepts, so it is ` +
      "ignored and numbers are written in the LocaleProvider's locale, " +
      'else the runtime\'s. Use a BCP 47 tag such as "en-US", with a ' +
      'hyphen rather than an underscore.'
  );

/**
 * The locale a component formats and matches in: the locale given, else the
 * `LocaleProvider`'s, else none. A tag `Intl` refuses counts as none, with a
 * development warning, as `LocaleProvider` treats one.
 */
function useResolvedLocale(own: string | undefined): string | undefined {
  const scope = useLocaleScope();
  const valid = useMemo(() => validLocale(own, warnOwnLocale), [own]);
  return valid || scope?.locale;
}

/**
 * The options `Intl.NumberFormat` reads, as ECMA-402 lists them. A key reads
 * each by name, so an inherited option counts as `Intl` counts it.
 */
const NUMBER_FORMAT_OPTIONS = [
  'localeMatcher',
  'numberingSystem',
  'style',
  'currency',
  'currencyDisplay',
  'currencySign',
  'unit',
  'unitDisplay',
  'notation',
  'minimumIntegerDigits',
  'minimumFractionDigits',
  'maximumFractionDigits',
  'minimumSignificantDigits',
  'maximumSignificantDigits',
  'roundingIncrement',
  'roundingMode',
  'roundingPriority',
  'trailingZeroDisplay',
  'compactDisplay',
  'useGrouping',
  'signDisplay',
];
const KNOWN_OPTIONS = new Set(NUMBER_FORMAT_OPTIONS);

/** One option's value with its type, or `null` for one a key can't hold. */
function writeOption(value: unknown): string | null {
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'number':
      // `NaN` and `Infinity` as themselves, which `JSON.stringify` makes
      // `null`, and `-0` with its sign.
      return Object.is(value, -0) ? '-0' : String(value);
    case 'boolean':
      return String(value);
    case 'bigint':
      return `${value}n`;
    default:
      return value === null ? 'null' : null;
  }
}

/**
 * The options as `Intl` will read them, and a key that tells apart any two
 * sets it would read differently; `null` when an option `Intl` reads holds
 * an object, a function or a symbol, which `Intl` converts in ways a key
 * can't follow. It reads each option `Intl` reads by name, inherited ones
 * included, then every other enumerable key, own or inherited, so an option
 * `Intl` gains later still keeps two sets apart. Since `Intl`'s options are
 * all primitives, one of those other keys holding anything else is left
 * out. An option set to `undefined` is unset, as it is for `Intl`. The
 * formatter is built from the copy, so `Intl` sees what the key says, even
 * of a getter.
 */
function readOptions(
  options: object
): { key: string; read: Record<string, unknown> } | null {
  const others: string[] = [];
  for (const name in options) {
    if (!KNOWN_OPTIONS.has(name)) others.push(name);
  }
  const names = NUMBER_FORMAT_OPTIONS.concat(others.sort());
  const read: Record<string, unknown> = {};
  const parts: string[] = [];
  for (const name of names) {
    const value = (options as Record<string, unknown>)[name];
    if (value === undefined) continue;
    const written = writeOption(value);
    if (written === null) {
      // An option `Intl` reads converts an object; a key it doesn't read,
      // such as a config's own `meta`, means nothing to it.
      if (KNOWN_OPTIONS.has(name)) return null;
      continue;
    }
    read[name] = value;
    parts.push(`${JSON.stringify(name)}:${written}`);
  }
  return { key: parts.join(','), read };
}

/**
 * Every formatter's `Intl.NumberFormat`s, by locale and options, so a page of
 * numbers in one locale and format builds one. Building one is the expensive
 * part of formatting. Past `MOST_NUMBER_FORMATS`, the one used longest ago
 * goes, so a server that writes numbers in many locales doesn't keep them
 * all, and the ones in use stay. A `Map` keeps its keys in the order they
 * were set, so a formatter is set again each time it's used.
 */
const numberFormats = new Map<string, Intl.NumberFormat>();
const MOST_NUMBER_FORMATS = 200;

/** The `Intl.NumberFormat` for `locale` and `options`, built once. */
function numberFormatFor(
  locale: string | undefined,
  options: Intl.NumberFormatOptions | undefined
): Intl.NumberFormat {
  let read: Intl.NumberFormatOptions | undefined;
  let key = '';
  if (options !== undefined) {
    const copy =
      typeof options === 'object' && options !== null
        ? readOptions(options)
        : null;
    // Options a key can't hold get a formatter of their own, which also
    // throws what `Intl` throws for them.
    if (!copy) return new Intl.NumberFormat(locale, options);
    read = copy.read;
    key = copy.key;
  }
  // A locale tag has no spaces, so the key can't be read two ways.
  const cacheKey = `${locale ?? ''} ${key}`;
  let format = numberFormats.get(cacheKey);
  if (format) {
    numberFormats.delete(cacheKey);
  } else {
    // Built before anything is stored, so options `Intl` refuses throw its
    // error and leave nothing behind.
    format = new Intl.NumberFormat(locale, read);
    if (numberFormats.size >= MOST_NUMBER_FORMATS) {
      numberFormats.delete(numberFormats.keys().next().value as string);
    }
  }
  numberFormats.set(cacheKey, format);
  return format;
}

/** A function that writes numbers in `locale`, the same one for each locale. */
function useFormatIn(locale: string | undefined): NumberFormatFunction {
  return useMemo<NumberFormatFunction>(
    () => (value, options) => numberFormatFor(locale, options).format(value),
    [locale]
  );
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
 * `LocaleProvider`, where the server's and the browser's can differ. A tag
 * `Intl` refuses is ignored, with a warning in development, as
 * `LocaleProvider` ignores one. Options `Intl` refuses throw its error when
 * the function is called.
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
  return useFormatIn(useResolvedLocale(locale));
}

/**
 * INTERNAL, deliberately not exported from `src/index.ts`. Number formatting
 * for a component that shows a number in passing, as `useNumberFormat`
 * writes it in the `LocaleProvider`'s locale, or `null` outside a provider
 * and inside one that gives no locale, as a provider with only a `dir`
 * doesn't, where the component keeps the formatting it has always had.
 */
export function useScopedNumberFormat(): NumberFormatFunction | null {
  const scoped = useResolvedLocale(undefined);
  const format = useFormatIn(scoped);
  return scoped ? format : null;
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
  const locale = useResolvedLocale(undefined);
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
