import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
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

/** The nearest provider's wrapper element, for `LocalePortalScope` to test targets against. */
const LocaleElementContext =
  createContext<React.RefObject<HTMLDivElement | null> | null>(null);

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
 * `firstDayOfWeek` is set, and a picker with a `locale` of its own is read
 * like a nested provider. With a `locale`, the numbers the library writes,
 * such as page numbers and badge counts, follow it, and so does the
 * filtering in `Combobox`, `Autocomplete` and `Taginput`, which then ignores
 * accents where the language treats letters as the same. The library's
 * portaled content, such as a `Popover` panel, a `Modal` with `portal`, a
 * `Toast` or a `Portal`'s children, keeps the same `dir` and `lang` though
 * it renders outside the wrapper: in a container outside the wrapper, it
 * sits in a `display: contents` element that carries them. Without a
 * provider none of this changes.
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

    // The wrapper, for portaled content to tell whether its target is inside
    // it, and the caller's ref. A callback ref's cleanup is held and run on
    // detach, as Toast and Modal do, since React 18 discards the return value.
    const elementRef = useRef<HTMLDivElement | null>(null);
    const consumerCleanupRef = useRef<(() => void) | null>(null);
    const setElement = useCallback(
      (node: HTMLDivElement | null) => {
        elementRef.current = node;
        if (typeof ref === 'function') {
          if (node === null) {
            const consumerCleanup = consumerCleanupRef.current;
            consumerCleanupRef.current = null;
            if (consumerCleanup) consumerCleanup();
            else ref(null);
            return;
          }
          const cleanup: unknown = ref(node);
          consumerCleanupRef.current =
            typeof cleanup === 'function' ? (cleanup as () => void) : null;
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    return (
      <LocaleContext.Provider value={value}>
        <LocaleElementContext.Provider value={elementRef}>
          <div
            ref={setElement}
            className={classNames(bulmaHelperClasses, className) || undefined}
            {...rest}
            dir={dir}
            lang={locale}
          >
            {children}
          </div>
        </LocaleElementContext.Provider>
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

/** The `dir` and `lang` portaled content carries: a provider's, or a picker's own. */
export interface PortalLocale {
  /** The `lang` to carry, unset for none. */
  locale?: string;
  /** The `dir` to carry, unset for none. */
  dir?: string;
}

/**
 * INTERNAL, deliberately not exported from `src/index.ts`. Keeps the `dir`
 * and `lang` of the nearest provider, or the `scope` given in their place,
 * on content the library portals into `target`, which has left the
 * provider's wrapper behind.
 *
 * A target inside the provider's own wrapper gets the content as it is: it
 * inherits from the wrapper, and follows it when the provider changes.
 * Content that must be its container's direct child, a `<tr>` portaled into
 * a `<tbody>` there, stays one. Any other target, `document.body` included,
 * gets the content inside a `display: contents` element carrying the
 * values, which adds no box. So does content with a `scope` of its own, a
 * picker's panel, since the provider's values aren't its own.
 *
 * Which of the two is decided once, when the content mounts, and kept while
 * it stays: switching between them would put a different element in its
 * place and remount everything inside, losing typed text, focus and timers.
 * A change of locale or direction updates the wrapper's attributes instead.
 * A target is never left bare because something else, such as `<html>`,
 * happens to carry the same values, since that can stop being true without
 * the content remounting. Outside a provider it renders the children alone,
 * so nothing changes there.
 */
export function LocalePortalScope({
  children,
  target,
  scope,
}: {
  children: React.ReactNode;
  /** The element the content is portaled into. */
  target: Element;
  /** Values to carry in place of the provider's, such as a picker's own. */
  scope?: PortalLocale;
}) {
  const provider = useContext(LocaleContext);
  const element = useContext(LocaleElementContext);
  const [wrap] = useState(
    () => scope !== undefined || !element?.current?.contains(target)
  );
  if (!provider || !wrap) return <>{children}</>;
  const values = scope ?? provider;
  return (
    <div dir={values.dir} lang={values.locale} style={displayContents}>
      {children}
    </div>
  );
}
