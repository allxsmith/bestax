import {
  canonicalLocale,
  localeDirection,
  localeFirstDay,
} from '../localeInfo';

const proto = Intl.Locale.prototype as unknown as Record<string, unknown>;
const INFO_KEYS = [
  'getTextInfo',
  'textInfo',
  'getWeekInfo',
  'weekInfo',
  'maximize',
];
let saved: Record<string, PropertyDescriptor | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(
    INFO_KEYS.map(key => [key, Object.getOwnPropertyDescriptor(proto, key)])
  );
});

afterEach(() => {
  for (const key of INFO_KEYS) {
    const descriptor = saved[key];
    if (descriptor) Object.defineProperty(proto, key, descriptor);
    else delete proto[key];
  }
});

/** Takes the named members off `Intl.Locale`, as an older engine has them. */
const without = (...keys: string[]) => {
  for (const key of keys) delete proto[key];
};

/**
 * Gives `Intl.Locale` a getter in place of a method, as Chrome 99 to 129 did.
 * An engine with only the getter, such as Node 22, already is that engine.
 */
const asGetter = (method: string, getter: string) => {
  const descriptor = saved[method];
  if (!descriptor) return;
  const call = descriptor.value as (this: Intl.Locale) => unknown;
  delete proto[method];
  Object.defineProperty(proto, getter, {
    configurable: true,
    get(this: Intl.Locale) {
      return call.call(this);
    },
  });
};

describe('canonicalLocale', () => {
  it('returns the canonical form of a tag', () => {
    expect(canonicalLocale('EN-us')).toBe('en-US');
    expect(canonicalLocale('ar-eg')).toBe('ar-EG');
  });

  it('returns undefined for no tag', () => {
    expect(canonicalLocale(undefined)).toBeUndefined();
    expect(canonicalLocale('')).toBeUndefined();
  });

  it('throws for a tag Intl refuses', () => {
    expect(() => canonicalLocale('en_US')).toThrow(RangeError);
  });
});

describe('localeDirection', () => {
  it("reads the engine's text info", () => {
    expect(localeDirection('ar-EG')).toBe('rtl');
    expect(localeDirection('he')).toBe('rtl');
    expect(localeDirection('de')).toBe('ltr');
    expect(localeDirection('az-Arab')).toBe('rtl');
  });

  it('reads the text info getter of an engine that has no method', () => {
    asGetter('getTextInfo', 'textInfo');
    expect(localeDirection('fa')).toBe('rtl');
    expect(localeDirection('en')).toBe('ltr');
  });

  it('falls back to the script maximize() fills in', () => {
    without('getTextInfo', 'textInfo');
    expect(localeDirection('ar')).toBe('rtl');
    expect(localeDirection('ur')).toBe('rtl');
    expect(localeDirection('dv')).toBe('rtl');
    expect(localeDirection('ckb')).toBe('rtl');
    expect(localeDirection('pa-Arab')).toBe('rtl');
    expect(localeDirection('pa')).toBe('ltr');
    expect(localeDirection('en-US')).toBe('ltr');
  });

  it('reads a direction it does not know as missing', () => {
    Object.defineProperty(proto, 'getTextInfo', {
      configurable: true,
      value: () => ({ direction: 'ttb' }),
    });
    expect(localeDirection('ar')).toBe('rtl');
    expect(localeDirection('ja')).toBe('ltr');
  });

  it('falls back to the language without maximize()', () => {
    without('getTextInfo', 'textInfo', 'maximize');
    expect(localeDirection('he-IL')).toBe('rtl');
    expect(localeDirection('yi')).toBe('rtl');
    expect(localeDirection('fr')).toBe('ltr');
  });

  it('reads an empty script from maximize() as left to right', () => {
    without('getTextInfo', 'textInfo');
    Object.defineProperty(proto, 'maximize', {
      configurable: true,
      value: () => ({}),
    });
    expect(localeDirection('ar')).toBe('ltr');
  });
});

describe('localeFirstDay', () => {
  it("looks the region maximize() fills in up in CLDR's week data", () => {
    expect(localeFirstDay('en')).toBe(0);
    expect(localeFirstDay('en-US')).toBe(0);
    expect(localeFirstDay('en-GB')).toBe(1);
    expect(localeFirstDay('de')).toBe(1);
    expect(localeFirstDay('fr-CA')).toBe(0);
    expect(localeFirstDay('pt-BR')).toBe(0);
    expect(localeFirstDay('ar')).toBe(6);
    expect(localeFirstDay('ar-EG')).toBe(6);
    expect(localeFirstDay('ar-SA')).toBe(0);
    expect(localeFirstDay('fa')).toBe(6);
    expect(localeFirstDay('dv')).toBe(5);
    expect(localeFirstDay('he')).toBe(0);
    expect(localeFirstDay('ja')).toBe(0);
    expect(localeFirstDay('zh')).toBe(1);
  });

  it("matches this engine's own week info for the common locales", () => {
    // Node 22 has a `weekInfo` getter, and later releases a method.
    const engine = (tag: string) => {
      const locale = new Intl.Locale(tag) as unknown as {
        getWeekInfo?: () => { firstDay: number };
        weekInfo?: { firstDay: number };
      };
      const info = locale.getWeekInfo ? locale.getWeekInfo() : locale.weekInfo;
      return info!.firstDay % 7;
    };
    for (const tag of ['en-US', 'en-GB', 'de', 'fr', 'ar-EG', 'he', 'ja']) {
      expect(localeFirstDay(tag)).toBe(engine(tag));
    }
  });

  it("ignores the engine's week info, so every engine agrees", () => {
    Object.defineProperty(proto, 'getWeekInfo', {
      configurable: true,
      value: () => ({ firstDay: 3 }),
    });
    expect(localeFirstDay('zh-CN')).toBe(1);
    expect(localeFirstDay('en-US')).toBe(0);
  });

  it('takes the -u-fw- keyword first, as getWeekInfo does', () => {
    expect(localeFirstDay('en-US-u-fw-mon')).toBe(1);
    expect(localeFirstDay('de-u-ca-gregory-fw-sun')).toBe(0);
    expect(localeFirstDay('de-u-fw-sat-nu-latn')).toBe(6);
    expect(localeFirstDay('de-u-fw-sun-rg-uszzzz')).toBe(0);
  });

  it('ignores an fw value that names no day', () => {
    expect(localeFirstDay('de-u-fw-xyz')).toBe(1);
  });

  it('takes the region a -u-rg- keyword names over its own', () => {
    expect(localeFirstDay('en-US-u-rg-gbzzzz')).toBe(1);
    expect(localeFirstDay('en-GB-u-rg-uszzzz')).toBe(0);
    expect(localeFirstDay('de-u-ca-gregory-rg-egzzzz')).toBe(6);
  });

  it("reads the tag's own region without maximize()", () => {
    without('maximize');
    expect(localeFirstDay('pt-BR')).toBe(0);
    expect(localeFirstDay('ar-SA')).toBe(0);
    expect(localeFirstDay('ar-EG')).toBe(6);
    expect(localeFirstDay('en-GB')).toBe(1);
    expect(localeFirstDay('en')).toBe(1);
  });
});
