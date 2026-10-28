import React, { createContext, forwardRef, useContext, useMemo } from 'react';
import { classNames } from './classNames';
import { useBulmaClasses, BulmaClassesProps } from './useBulmaClasses';
import { warnOnce } from './devWarnings';
import { canonicalLocale, localeDirection } from './localeInfo';

/** A writing direction. */
export type TextDirection = 'ltr' | 'rtl';

/** What the nearest `LocaleProvider` sets, both `undefined` outside one. */
export interface LocaleContextValue {
  /**
   * The locale, as a canonical BCP 47 tag such as `"ar-EG"`: the provider's
   * own, else the one an outer provider sets.
   */
  locale?: string;
  /**
   * The direction: the provider's own `dir`, else its own locale's, else the
   * one an outer provider sets.
   */
  dir?: TextDirection;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Props for the LocaleProvider component. The helper props, the other
 * attributes and the `ref` land on its `<div>`.
 */
export interface LocaleProviderProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'dir' | 'lang' | 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * A BCP 47 language tag, such as `"de"` or `"ar-EG"`. It becomes the
   * wrapper's `lang`, the default `locale` of the date and time pickers
   * inside, and, with no `dir`, the direction, from the way its script is
   * written. Unset, a nested provider keeps the outer one's. A tag `Intl`
   * refuses is ignored, with a warning in development.
   */
  locale?: string;
  /**
   * The direction, whatever the locale. Unset, it follows this provider's
   * `locale`, else an outer provider's direction, else the page's.
   */
  dir?: TextDirection;
  /** The part of the app it covers. */
  children?: React.ReactNode;
}

/** A tag in canonical form, or `undefined`, warning about one `Intl` refuses. */
function validLocale(tag: string | undefined): string | undefined {
  try {
    return canonicalLocale(tag);
  } catch {
    warnOnce(
      `locale-provider-invalid:${tag}`,
      `[bestax-bulma] <LocaleProvider locale="${tag}">: not a language ` +
        'tag Intl accepts, so it is ignored. Use a BCP 47 tag such as ' +
        '"en-US", with a hyphen rather than an underscore.'
    );
    return undefined;
  }
}

/**
 * Sets the language and writing direction for the part of the app inside it, on a wrapper `<div>` and on what the library portals out of it.
 *
 * The wrapper carries `dir` and `lang`, so CSS and the components that read
 * the computed direction follow it, as they follow `<html dir>`. A `locale`
 * alone sets the direction of its script, and a `dir` sets the direction
 * whatever the locale. A nested provider keeps whatever it leaves unset.
 *
 * Inside it, the date and time pickers take its `locale` unless given their
 * own, and their week starts on the first day of the locale they use unless
 * `firstDayOfWeek` is set. The library's portaled content, such as a
 * `Popover` panel, a `Modal` with `portal`, a `Toast` or a `Portal`'s
 * children, sits in an element carrying the same `dir` and `lang`, since it
 * renders outside the wrapper. Without a provider none of this changes.
 *
 * @function
 * @param {LocaleProviderProps} props - Props for the LocaleProvider.
 * @returns {JSX.Element} The wrapper, inside the context.
 *
 * @example
 * <LocaleProvider locale="ar-EG">
 *   <App />
 * </LocaleProvider>
 */
export const LocaleProvider = forwardRef<HTMLDivElement, LocaleProviderProps>(
  (
    { locale: localeProp, dir: dirProp, className, children, ...props },
    ref
  ) => {
    const outer = useContext(LocaleContext);
    const ownLocale = useMemo(() => validLocale(localeProp), [localeProp]);
    const ownLocaleDir = useMemo(
      () => (ownLocale ? localeDirection(ownLocale) : undefined),
      [ownLocale]
    );
    const locale = ownLocale || outer?.locale;
    const dir = dirProp || ownLocaleDir || outer?.dir;
    const value = useMemo(() => ({ locale, dir }), [locale, dir]);

    const { bulmaHelperClasses, rest } = useBulmaClasses(props);

    return (
      <LocaleContext.Provider value={value}>
        <div
          ref={ref}
          className={classNames(bulmaHelperClasses, className) || undefined}
          {...rest}
          dir={dir}
          lang={locale}
        >
          {children}
        </div>
      </LocaleContext.Provider>
    );
  }
);

LocaleProvider.displayName = 'LocaleProvider';

/** What `useLocale` returns outside a provider, the same object each time. */
const noLocale: LocaleContextValue = {};

/**
 * The locale and direction the nearest `LocaleProvider` sets, for an app's own `Intl` calls or its own portaled content; both are `undefined` outside one.
 *
 * It isn't the page's direction: with no provider, or one that sets no
 * direction, the page's `<html dir>` still decides. To act on the direction
 * an element is laid out in, read `getComputedStyle(element).direction`, as
 * the library's components do.
 *
 * @function
 * @returns {LocaleContextValue} The nearest provider's `locale` and `dir`.
 *
 * @example
 * const { locale } = useLocale();
 * const price = new Intl.NumberFormat(locale, {
 *   style: 'currency',
 *   currency: 'EUR',
 * }).format(12.5);
 */
export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext) ?? noLocale;
}

/**
 * INTERNAL, deliberately not exported from `src/index.ts`. The nearest
 * provider's settings, or `null` outside any provider, so a caller can tell
 * "no provider" from "a provider that sets nothing".
 */
export function useLocaleScope(): LocaleContextValue | null {
  return useContext(LocaleContext);
}

const displayContents: React.CSSProperties = { display: 'contents' };

/**
 * INTERNAL, deliberately not exported from `src/index.ts`. Wraps content the
 * library portals in an element carrying the nearest provider's `dir` and
 * `lang`, which the content has left behind with the provider's wrapper. The
 * element is `display: contents`, so it adds no box. Outside a provider it
 * renders the children alone, so nothing changes there. Inside one it is
 * there even while the provider sets nothing, so a provider that gains a
 * setting doesn't remount what is open.
 */
export function LocalePortalScope({ children }: { children: React.ReactNode }) {
  const scope = useContext(LocaleContext);
  if (!scope) return <>{children}</>;
  return (
    <div dir={scope.dir} lang={scope.locale} style={displayContents}>
      {children}
    </div>
  );
}
