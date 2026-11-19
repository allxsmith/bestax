// INTERNAL: deliberately not exported from src/index.ts. What a locale says
// about its direction, read from `Intl.Locale` where the engine has the data,
// and about its week, read from a copy of CLDR's week data.

import type { DayOfWeek } from '../form/_pickerInternals/pickerTypes';

/** The parts of `Intl.Locale` newer than the ES2020 library types. */
interface LocaleInfo {
  getTextInfo?: () => { direction?: string };
  textInfo?: { direction?: string };
}

/**
 * Scripts written right to left: every script for which ICU's text info
 * says `rtl`, as Node reported it, and `Aran`, the Nastaliq form of Arabic
 * that WebKit fills in for Urdu. Read only where the engine has no text info
 * of its own, which includes Firefox before 153.
 */
const RTL_SCRIPTS =
  ' Adlm Arab Aran Armi Avst Chrs Cprt Elym Gara Hatr Hebr Hung Khar Lydi ' +
  'Mand Mani Mend Merc Mero Narb Nbat Nkoo Orkh Ougr Palm Phli Phlp Phnx ' +
  'Prti Rohg Samr Sarb Sidt Sogd Sogo Syrc Thaa Yezi ';

/**
 * Widely used languages whose usual script reads right to left, for an engine
 * that can't fill in a locale's script with `maximize()`.
 */
const RTL_LANGUAGES =
  ' ar ckb dv fa he iw ji ks mzn nqo pnb ps sd syr ug ur yi ';

/**
 * The regions whose week doesn't start on Monday, by the day it starts on
 * (0 = Sunday, 5 = Friday, 6 = Saturday), from CLDR 48's week data as Node
 * reported it. The library reads this rather than `Intl.Locale`'s week info
 * because engines disagree: Firefox before 153 has none, and WebKit's differs
 * from Node's, Chromium's and current Firefox's for China, Algeria, Jordan and
 * Iceland among others, so an inline calendar rendered on the server would
 * fail to hydrate there. With one table, the server and every browser agree.
 */
const WEEK_STARTS: ReadonlyArray<readonly [DayOfWeek, string]> = [
  [
    0,
    ' AG AS BD BR BS BT BU BW BZ CA CO DM DO ET GT GU HK HN ID IL IN IS JM JP ' +
      'KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY RH SA SG SV TH ' +
      'TT TW UM US VE VI WS YD YE ZA ZW ',
  ],
  [5, ' MV '],
  [6, ' AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY '],
];

/** Whether a space-separated list, padded with spaces, holds `code`. */
const listed = (list: string, code: string) => list.includes(` ${code} `);

/** The `-u-fw-` keyword's values, by the day they name. */
const FW_DAYS: Record<string, DayOfWeek> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

/**
 * The canonical form of a BCP 47 tag (`"en-us"` becomes `"en-US"`), or
 * `undefined` for an empty or missing one. Throws a `RangeError` for a tag
 * `Intl` refuses, as `Intl.DateTimeFormat` would.
 */
export function canonicalLocale(tag: string | undefined): string | undefined {
  if (!tag) return undefined;
  return Intl.getCanonicalLocales(tag)[0];
}

/**
 * The direction a locale's script is written in: from `Intl.Locale`'s text
 * info, else from the script `maximize()` fills in, else from the language.
 *
 * @param locale - A canonical tag, as `canonicalLocale` returns.
 */
export function localeDirection(locale: string): 'ltr' | 'rtl' {
  const intlLocale = new Intl.Locale(locale);
  const info = intlLocale as unknown as LocaleInfo;
  const direction =
    typeof info.getTextInfo === 'function'
      ? info.getTextInfo().direction
      : info.textInfo?.direction;
  if (direction === 'rtl' || direction === 'ltr') return direction;
  if (typeof intlLocale.maximize === 'function') {
    const script = intlLocale.maximize().script;
    return script && listed(RTL_SCRIPTS, script) ? 'rtl' : 'ltr';
  }
  return listed(RTL_LANGUAGES, intlLocale.language) ? 'rtl' : 'ltr';
}

/**
 * The day a locale's week starts on, 0 for Sunday, as `getWeekInfo()` reads
 * it: the tag's `-u-fw-` keyword, else the region its `-u-rg-` keyword names,
 * else its own region or the one `maximize()` fills in, looked up in CLDR's
 * week data, where a region not listed starts on Monday.
 *
 * @param locale - A canonical tag, as `canonicalLocale` returns.
 */
export function localeFirstDay(locale: string): DayOfWeek {
  const fw = /-u(?:-[a-z0-9]{2,8})*?-fw-([a-z]{3})(?=-|$)/i.exec(locale);
  if (fw && fw[1].toLowerCase() in FW_DAYS) return FW_DAYS[fw[1].toLowerCase()];
  const rg = /-u(?:-[a-z0-9]{2,8})*?-rg-([a-z]{2})[a-z0-9]{1,4}(?=-|$)/i.exec(
    locale
  );
  const intlLocale = new Intl.Locale(locale);
  const region = rg
    ? rg[1].toUpperCase()
    : typeof intlLocale.maximize === 'function'
      ? intlLocale.maximize().region
      : intlLocale.region;
  if (region) {
    for (const [day, regions] of WEEK_STARTS) {
      if (listed(regions, region)) return day;
    }
  }
  return 1;
}
