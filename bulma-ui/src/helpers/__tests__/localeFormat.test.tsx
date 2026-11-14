import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { LocaleProvider } from '../LocaleProvider';
import { resetDevWarnings } from '../devWarnings';
import {
  useLocaleMatcher,
  useNumberFormat,
  useScopedNumberFormat,
  type NumberFormatFunction,
  type TextMatcher,
} from '../localeFormat';
import { Pagination } from '../../components/Pagination';
import { Steps } from '../../components/Steps';
import { Avatars } from '../../components/Avatars';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { RingProgress } from '../../elements/RingProgress';
import { Taginput } from '../../form/Taginput';
import { File } from '../../form/File';
import { Slider } from '../../form/Slider';
import { Rate } from '../../form/Rate';
import { Combobox } from '../../form/Combobox';
import { Autocomplete } from '../../form/Autocomplete';
import { Command, type CommandAction } from '../../components/Command';
import { DataTable } from '../../components/DataTable';
import { ColorPicker } from '../../form/ColorPicker';

/** `Intl.NumberFormat` as it is before any test counts what it builds. */
const RealNumberFormat = Intl.NumberFormat;

/**
 * How `locale` writes `value`, as the tests expect to see it, the runtime's
 * locale for `undefined`.
 */
const write = (
  locale: string | undefined,
  value: number,
  options?: Intl.NumberFormatOptions
) => new RealNumberFormat(locale, options).format(value);

/** Renders `node` inside an Egyptian Arabic provider, whose digits differ. */
const inArabic = (node: React.ReactElement) =>
  render(<LocaleProvider locale="ar-EG">{node}</LocaleProvider>);

/** Counts the `Intl.NumberFormat`s built from here on, each a real one. */
const countNumberFormats = () =>
  vi
    .spyOn(Intl, 'NumberFormat')
    // A `function`, not an arrow: the code under test calls it with `new`.
    .mockImplementation(function (
      ...args: ConstructorParameters<typeof Intl.NumberFormat>
    ) {
      return new RealNumberFormat(...args);
    });

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('useNumberFormat', () => {
  let seen: NumberFormatFunction;
  function Probe({ locale }: { locale?: string }) {
    seen = useNumberFormat(locale);
    return null;
  }

  it("writes in the runtime's locale outside a provider, with options", () => {
    render(<Probe />);
    expect(seen(1234.5)).toBe(write(undefined, 1234.5));
    expect(seen(0.25, { style: 'percent' })).toBe(
      write(undefined, 0.25, { style: 'percent' })
    );
  });

  it('writes in its own locale outside a provider', () => {
    render(<Probe locale="de" />);
    expect(seen(1234.5)).toBe(write('de', 1234.5));
  });

  it("writes in the provider's locale, and lets its own win", () => {
    const { rerender } = render(
      <LocaleProvider locale="de">
        <Probe />
      </LocaleProvider>
    );
    expect(seen(1234.5)).toBe(write('de', 1234.5));
    rerender(
      <LocaleProvider locale="de">
        <Probe locale="ar-EG" />
      </LocaleProvider>
    );
    expect(seen(12)).toBe(write('ar-EG', 12));
    // An empty tag is no locale, so the provider's stands.
    rerender(
      <LocaleProvider locale="de">
        <Probe locale="" />
      </LocaleProvider>
    );
    expect(seen(1234.5)).toBe(write('de', 1234.5));
  });

  it("writes in the runtime's locale in a provider that gives none", () => {
    render(
      <LocaleProvider dir="rtl">
        <Probe />
      </LocaleProvider>
    );
    expect(seen(1234.5)).toBe(write(undefined, 1234.5));
  });

  it('is the same function from render to render for one locale', () => {
    const { rerender } = render(<Probe locale="de" />);
    const first = seen;
    rerender(<Probe locale="de" />);
    expect(seen).toBe(first);
    rerender(<Probe locale="fr" />);
    expect(seen).not.toBe(first);
    expect(seen(1234.5)).toBe(write('fr', 1234.5));
  });

  it('builds one Intl.NumberFormat for many numbers written alike', () => {
    let other: NumberFormatFunction | undefined;
    function Other() {
      other = useNumberFormat('de-CH');
      return null;
    }
    const built = countNumberFormats();
    render(
      <>
        <Probe locale="de-CH" />
        <Other />
      </>
    );
    // Options no other test uses, so nothing is kept from before.
    const options = { maximumSignificantDigits: 4 };
    expect(seen(1234.5, options)).toBe(write('de-CH', 1234.5, options));
    expect(seen(98765, options)).toBe(write('de-CH', 98765, options));
    expect(other!(0.5, { ...options })).toBe(write('de-CH', 0.5, options));
    expect(built).toHaveBeenCalledTimes(1);
    // Another locale or other options build their own.
    other!(1, { maximumSignificantDigits: 3 });
    expect(built).toHaveBeenCalledTimes(2);
  });

  it('lets the one used longest ago go once it holds many', () => {
    render(<Probe locale="en-GB" />);
    // `Intl` ignores a key it doesn't know, which makes each set distinct.
    const set = (name: string) => ({ [name]: 1 }) as Intl.NumberFormatOptions;
    // As many as it holds, which pushes out whatever earlier tests left.
    for (let n = 0; n < 200; n++) seen(1, set(`fill${n}`));
    const built = countNumberFormats();
    // A hit makes fill0 the most recently used, so the next new set pushes
    // out fill1, the one used longest ago, and fill0 stays.
    seen(1, set('fill0'));
    expect(built).not.toHaveBeenCalled();
    seen(1, set('new'));
    expect(built).toHaveBeenCalledTimes(1);
    seen(1, set('fill0'));
    expect(built).toHaveBeenCalledTimes(1);
    seen(1, set('fill1'));
    expect(built).toHaveBeenCalledTimes(2);
  });

  describe('the cache key', () => {
    it("tells NaN and Infinity from null, so each gets Intl's own answer", () => {
      render(<Probe locale="en-AU" />);
      // `null` reads as 0 fraction digits; NaN and Infinity are refused.
      expect(seen(1.234, { maximumFractionDigits: null as never })).toBe(
        write('en-AU', 1.234, { maximumFractionDigits: 0 })
      );
      expect(() => seen(1.234, { maximumFractionDigits: NaN })).toThrow(
        RangeError
      );
      expect(() => seen(1.234, { maximumFractionDigits: Infinity })).toThrow(
        RangeError
      );
      // And the other way round: NaN first leaves nothing for null to find.
      expect(() => seen(1.5, { minimumFractionDigits: NaN })).toThrow(
        RangeError
      );
      expect(seen(1.5, { minimumFractionDigits: null as never })).toBe(
        write('en-AU', 1.5, { minimumFractionDigits: 0 })
      );
    });

    it('reads inherited options, as Intl does', () => {
      render(<Probe locale="en-NZ" />);
      const inherited = Object.create({
        maximumFractionDigits: 0,
      }) as Intl.NumberFormatOptions;
      // A plain set first, so a key that missed the inherited option would
      // hand it this formatter.
      expect(seen(1.5, {})).toBe(write('en-NZ', 1.5));
      expect(seen(1.5, inherited)).toBe(
        write('en-NZ', 1.5, { maximumFractionDigits: 0 })
      );
      expect(seen(1.5, {})).toBe(write('en-NZ', 1.5));
    });

    it('treats an option set to undefined as unset, and -0 as Intl does', () => {
      render(<Probe locale="en-IE" />);
      const built = countNumberFormats();
      seen(1, { style: 'decimal' });
      seen(1, { style: 'decimal', currency: undefined });
      expect(built).toHaveBeenCalledTimes(1);
      expect(seen(1.5, { maximumFractionDigits: -0 })).toBe(
        write('en-IE', 1.5, { maximumFractionDigits: 0 })
      );
      expect(seen(1, { useGrouping: false })).toBe(
        write('en-IE', 1, { useGrouping: false })
      );
    });

    it('reads a getter once, and builds from what it read', () => {
      render(<Probe locale="en-ZA" />);
      let reads = 0;
      const options = {
        get maximumFractionDigits() {
          reads++;
          return reads === 1 ? 0 : 3;
        },
      };
      expect(seen(1.2345, options)).toBe(
        write('en-ZA', 1.2345, { maximumFractionDigits: 0 })
      );
      expect(reads).toBe(1);
    });

    it("leaves out a key Intl doesn't read that holds an object or a function", () => {
      render(<Probe locale="en-SG" />);
      const built = countNumberFormats();
      // A currency config with fields of its own beside Intl's options.
      const config = (id: number) =>
        ({
          style: 'currency',
          currency: 'SGD',
          meta: { id },
          toLabel: () => 'S$',
        }) as Intl.NumberFormatOptions;
      expect(seen(1234.5, config(1))).toBe(
        write('en-SG', 1234.5, { style: 'currency', currency: 'SGD' })
      );
      seen(99, config(2));
      expect(built).toHaveBeenCalledTimes(1);
      // A key it doesn't read that holds a primitive still counts, in case
      // Intl comes to read it.
      seen(1, { style: 'currency', currency: 'SGD', tier: 1 } as never);
      seen(1, { style: 'currency', currency: 'SGD', tier: 2 } as never);
      expect(built).toHaveBeenCalledTimes(3);
    });

    it("leaves values it can't key, and options that aren't an object, to Intl", () => {
      render(<Probe locale="en-CA" />);
      const built = countNumberFormats();
      const digits = { valueOf: () => 2 } as unknown as number;
      expect(seen(1.5, { minimumFractionDigits: digits })).toBe(
        write('en-CA', 1.5, { minimumFractionDigits: 2 })
      );
      seen(1.5, { minimumFractionDigits: digits });
      expect(built).toHaveBeenCalledTimes(2);
      expect(() =>
        seen(1, { maximumFractionDigits: 2n as unknown as number })
      ).toThrow(TypeError);
      expect(() => seen(1, null as unknown as undefined)).toThrow(TypeError);
    });
  });

  it('throws what Intl throws for options it refuses, and keeps nothing', () => {
    render(<Probe locale="de" />);
    const built = countNumberFormats();
    expect(() => seen(1, { style: 'currency' })).toThrow(TypeError);
    expect(() => seen(1, { style: 'currency' })).toThrow(TypeError);
    expect(built).toHaveBeenCalledTimes(2);
  });

  it('ignores a tag Intl refuses, warning once, and falls back', () => {
    resetDevWarnings();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<Probe locale="en_US" />);
    expect(seen(1234.5)).toBe(write(undefined, 1234.5));
    rerender(
      <LocaleProvider locale="de">
        <Probe locale="en_US" />
      </LocaleProvider>
    );
    expect(seen(1234.5)).toBe(write('de', 1234.5));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(
      'NumberFormatter or useNumberFormat was given the locale "en_US"'
    );
  });
});

describe('useScopedNumberFormat', () => {
  let seen: NumberFormatFunction | null;
  function Probe() {
    seen = useScopedNumberFormat();
    return null;
  }

  beforeEach(() => {
    seen = undefined as unknown as null;
  });

  it('is null outside a provider', () => {
    render(<Probe />);
    expect(seen).toBeNull();
  });

  it('is null inside a provider that gives no locale', () => {
    render(
      <LocaleProvider dir="rtl">
        <Probe />
      </LocaleProvider>
    );
    expect(seen).toBeNull();
  });

  it("formats in the provider's locale, with options", () => {
    render(
      <LocaleProvider locale="de">
        <Probe />
      </LocaleProvider>
    );
    expect(seen!(1234.5)).toBe(write('de', 1234.5));
    expect(seen!(0.25, { style: 'percent' })).toBe(
      write('de', 0.25, { style: 'percent' })
    );
    // A second call with the same options reuses the formatter.
    expect(seen!(0.5, { style: 'percent' })).toBe(
      write('de', 0.5, { style: 'percent' })
    );
  });
});

describe('useLocaleMatcher', () => {
  let seen: TextMatcher | null;
  function Probe() {
    seen = useLocaleMatcher();
    return null;
  }

  it('is null outside a provider, or in one with no locale', () => {
    render(<Probe />);
    expect(seen).toBeNull();
    render(
      <LocaleProvider dir="rtl">
        <Probe />
      </LocaleProvider>
    );
    expect(seen).toBeNull();
  });

  it('finds the query anywhere, ignoring case and accents', () => {
    render(
      <LocaleProvider locale="fr">
        <Probe />
      </LocaleProvider>
    );
    expect(seen!('Café crème', 'cafe')).toBe(true);
    expect(seen!('Café crème', 'CREME')).toBe(true);
    expect(seen!('Café crème', 'thé')).toBe(false);
    expect(seen!('Café', '')).toBe(true);
    expect(seen!('Ca', 'Café')).toBe(false);
  });

  it('compares composed and decomposed letters alike', () => {
    render(
      <LocaleProvider locale="fr">
        <Probe />
      </LocaleProvider>
    );
    expect(seen!('Café', 'café')).toBe(true);
  });

  it('keeps letters apart where the language does', () => {
    render(
      <LocaleProvider locale="sv">
        <Probe />
      </LocaleProvider>
    );
    expect(seen!('Åre', 'are')).toBe(false);
    expect(seen!('Åre', 'åre')).toBe(true);
    // Decomposed, the ring is a mark, and still a letter of its own here.
    expect(seen!('A\u030Are', 'are')).toBe(false);
    expect(seen!('Vasa', 'va\u030A')).toBe(false);
  });

  /** The matcher for `locale`, read through a provider. */
  const matcherFor = (locale: string) => {
    render(
      <LocaleProvider locale={locale}>
        <Probe />
      </LocaleProvider>
    );
    return seen!;
  };

  it('finds Arabic with and without harakat, either way round', () => {
    const match = matcherFor('ar-EG');
    expect(match('مُحَمَّد علي', 'محمد')).toBe(true);
    expect(match('علي مُحَمَّد', 'محمد')).toBe(true);
    expect(match('محمد علي', 'مُحَمَّد')).toBe(true);
    expect(match('محمد علي', 'علي')).toBe(true);
    expect(match('محمد علي', 'حسن')).toBe(false);
  });

  it('finds Hebrew with and without niqqud, either way round', () => {
    const match = matcherFor('he');
    expect(match('שָׁלוֹם עֲלֵיכֶם', 'שלום')).toBe(true);
    expect(match('שלום עליכם', 'שָׁלוֹם')).toBe(true);
    expect(match('שלום עליכם', 'תודה')).toBe(false);
  });

  it('finds a Latin letter with a mark it has no single character for', () => {
    const match = matcherFor('en');
    // q with a tilde stays a q and a combining tilde under NFC.
    expect(match('Taq\u0303i', 'taqi')).toBe(true);
    expect(match('Taqi', 'taq\u0303')).toBe(true);
    expect(match('Taq\u0303i', 'tai')).toBe(false);
  });

  it('finds an expansion either way round', () => {
    const match = matcherFor('de');
    expect(match('Straße', 'strasse')).toBe(true);
    expect(match('Strasse', 'straße')).toBe(true);
  });

  it('matches everything for a query of only ignored marks', () => {
    const match = matcherFor('ar-EG');
    expect(match('محمد', '\u064E')).toBe(true);
    expect(match('محمد', '')).toBe(true);
  });

  it('finds nothing for a query longer than the text', () => {
    const match = matcherFor('fr');
    expect(match('Ca', 'Café')).toBe(false);
    expect(match('', 'a')).toBe(false);
  });

  it('compares a bounded number of slices on a long label', () => {
    const RealCollator = Intl.Collator;
    let compared = 0;
    const spy = vi
      .spyOn(Intl, 'Collator')
      // A `function`, not an arrow: the code under test calls it with `new`.
      .mockImplementation(function (
        ...args: ConstructorParameters<typeof Intl.Collator>
      ) {
        const real = new RealCollator(...args);
        return {
          compare: (a: string, b: string) => {
            compared++;
            return real.compare(a, b);
          },
        } as Intl.Collator;
      });
    try {
      const match = matcherFor('ar-EG');
      const label = 'مُحَمَّد '.repeat(250);
      compared = 0;
      expect(match(label, 'علي')).toBe(false);
      // Each letter starts at most twice the query's three letters of slices.
      const letters = Array.from(label).filter(c => !/\p{M}/u.test(c)).length;
      expect(compared).toBeLessThanOrEqual(letters * 6 + 1);
      expect(match(label + 'علي', 'علي')).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('numbers inside a LocaleProvider', () => {
  it('writes Pagination page numbers, and the default name with them', () => {
    inArabic(<Pagination total={3} current={2} />);
    const link = screen.getByRole('button', { current: 'page' });
    expect(link).toHaveTextContent(write('ar-EG', 2));
    expect(link).toHaveAccessibleName(`Page ${write('ar-EG', 2)}`);
  });

  it('leaves a getPageLabel name to the app', () => {
    inArabic(<Pagination total={3} current={2} getPageLabel={p => `ص ${p}`} />);
    expect(
      screen.getByRole('button', { current: 'page' })
    ).toHaveAccessibleName('ص 2');
  });

  it('writes Steps markers', () => {
    const { container } = inArabic(
      <Steps value={0} items={[{ label: 'A' }, { label: 'B' }]} />
    );
    const markers = container.querySelectorAll('.steps-marker');
    expect(markers[1]).toHaveTextContent(write('ar-EG', 2));
  });

  it('writes the Avatars surplus and its default name', () => {
    inArabic(
      <Avatars max={1}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Alan Turing" />
      </Avatars>
    );
    const surplus = screen.getByRole('img', {
      name: `${write('ar-EG', 2)} more`,
    });
    expect(surplus).toHaveTextContent(
      write('ar-EG', 2, { signDisplay: 'always' })
    );
  });

  it('writes a Badge count and its cap', () => {
    const { rerender } = inArabic(<Badge content={7} />);
    expect(screen.getByRole('status')).toHaveTextContent(write('ar-EG', 7));
    expect(screen.getByRole('status')).toHaveAccessibleName(write('ar-EG', 7));
    rerender(
      <LocaleProvider locale="ar-EG">
        <Badge content={150} max={99} />
      </LocaleProvider>
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      `${write('ar-EG', 99)}+`
    );
  });

  it('writes the RingProgress section shares as percentages', () => {
    inArabic(
      <RingProgress
        label="Storage"
        sections={[{ value: 40, label: 'Documents' }]}
      />
    );
    expect(screen.getByRole('img')).toHaveAccessibleName(
      `Storage: Documents ${write('ar-EG', 0.4, { style: 'percent' })}`
    );
  });

  it('writes the Taginput counters', () => {
    const { container, rerender } = inArabic(
      <Taginput defaultValue={['a']} maxTags={5} hasCounter />
    );
    expect(container.querySelector('.counter')).toHaveTextContent(
      `${write('ar-EG', 1)} / ${write('ar-EG', 5)}`
    );
    rerender(
      <LocaleProvider locale="ar-EG">
        <Taginput maxlength={20} hasCounter />
      </LocaleProvider>
    );
    expect(container.querySelector('.counter')).toHaveTextContent(
      `${write('ar-EG', 0)} / ${write('ar-EG', 20)}`
    );
  });

  it('writes the count of picked files', () => {
    const { container } = inArabic(<File hasName multiple />);
    const files = ['a.txt', 'b.txt', 'c.txt'].map(
      name => new window.File(['x'], name, { type: 'text/plain' })
    );
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files },
    });
    expect(container.querySelector('.file-name')).toHaveTextContent(
      `${write('ar-EG', 3)} files`
    );
  });

  it("writes the Slider output and a scaled value's text", () => {
    const { container } = inArabic(
      <Slider value={50} showOutput scale={v => v / 10} ariaLabel="Level" />
    );
    expect(container.querySelector('.slider-output')).toHaveTextContent(
      write('ar-EG', 5)
    );
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      write('ar-EG', 5)
    );
  });

  it("leaves a Slider's formatOutput to the app", () => {
    const { container } = inArabic(
      <Slider value={50} showOutput formatOutput={v => `${v}%`} />
    );
    expect(container.querySelector('.slider-output')).toHaveTextContent('50%');
  });

  it('writes the Rate score, with one decimal for a fraction', () => {
    const { rerender } = inArabic(<Rate value={4} showScore />);
    expect(screen.getByText(write('ar-EG', 4))).toBeInTheDocument();
    rerender(
      <LocaleProvider locale="ar-EG">
        <Rate value={3.5} precision={0.5} showScore />
      </LocaleProvider>
    );
    expect(
      screen.getByText(
        write('ar-EG', 3.5, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      )
    ).toBeInTheDocument();
  });

  it('writes nothing differently outside a provider', () => {
    const { container } = render(
      <>
        <Pagination total={3} current={2} />
        <Badge content={7} />
        <Rate value={3.5} precision={0.5} showScore />
      </>
    );
    expect(
      screen.getByRole('button', { current: 'page' })
    ).toHaveAccessibleName('Page 2');
    expect(screen.getByRole('status')).toHaveTextContent('7');
    expect(container).toHaveTextContent('3.5');
  });
});

/**
 * The library's own numbers go through `useScopedNumberFormat`, not the
 * public `useNumberFormat`, so outside a provider each is written as it was
 * before either existed: no `Intl.NumberFormat` is built, and a number past a
 * thousand has no grouping, where the runtime's locale would give it one.
 */
describe('numbers the library writes outside a provider', () => {
  let built: ReturnType<typeof countNumberFormats>;
  beforeEach(() => {
    built = countNumberFormats();
  });

  it('writes Pagination page numbers, and the names with them', () => {
    render(<Pagination total={1500} current={1234} />);
    const link = screen.getByRole('button', { current: 'page' });
    expect(link).toHaveTextContent('1234');
    expect(link).toHaveAccessibleName('Page 1234');
    expect(built).not.toHaveBeenCalled();
  });

  it('writes a Badge count and its cap', () => {
    const { rerender } = render(<Badge content={12345} max={99999} />);
    expect(screen.getByRole('status')).toHaveTextContent('12345');
    rerender(<Badge content={15000} max={9999} />);
    expect(screen.getByRole('status')).toHaveTextContent('9999+');
    expect(built).not.toHaveBeenCalled();
  });

  it('writes the Taginput counter and the Slider output', () => {
    const { container } = render(
      <>
        <Taginput maxlength={2000} hasCounter />
        <Slider value={1500} max={2000} showOutput ariaLabel="Level" />
      </>
    );
    expect(container.querySelector('.counter')).toHaveTextContent('0 / 2000');
    expect(container.querySelector('.slider-output')).toHaveTextContent('1500');
    expect(built).not.toHaveBeenCalled();
  });

  it('writes the DataTable counts', () => {
    vi.useFakeTimers();
    const ui = (search: string) => (
      <DataTable
        caption="People"
        columns={[{ id: 'name', header: 'Name' }]}
        data={[{ id: '1', name: 'Ada' }]}
        manual
        rowCount={12345}
        pageSize={1}
        search={search}
      />
    );
    const { rerender } = render(ui(''));
    rerender(ui('a'));
    act(() => vi.advanceTimersByTime(600));
    expect(screen.getByRole('status')).toHaveTextContent('12345 rows match');
    expect(built).not.toHaveBeenCalled();
  });

  it('writes Steps, Avatars, RingProgress, Rate, File and ColorPicker numbers', () => {
    const { container } = render(
      <>
        <Steps value={0} items={[{ label: 'A' }, { label: 'B' }]} />
        <Avatars max={1}>
          <Avatar name="Ada Lovelace" />
          <Avatar name="Grace Hopper" />
          <Avatar name="Alan Turing" />
        </Avatars>
        <RingProgress
          label="Storage"
          sections={[{ value: 40, label: 'Documents' }]}
        />
        <Rate value={3.5} precision={0.5} showScore />
        <File hasName multiple />
        <ColorPicker label="Brand" alpha />
      </>
    );
    const files = ['a.txt', 'b.txt', 'c.txt'].map(
      name => new window.File(['x'], name, { type: 'text/plain' })
    );
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files },
    });
    expect(container.querySelectorAll('.steps-marker')[1]).toHaveTextContent(
      '2'
    );
    expect(screen.getByRole('img', { name: '2 more' })).toHaveTextContent('+2');
    expect(
      screen.getByRole('img', { name: 'Storage: Documents 40%' })
    ).toBeInTheDocument();
    expect(container).toHaveTextContent('3.5');
    expect(container.querySelector('.file-name')).toHaveTextContent('3 files');
    expect(built).not.toHaveBeenCalled();
  });
});

describe('matching inside a LocaleProvider', () => {
  const drinks = ['Café', 'Thé', 'Chocolat'];

  const type = (value: string) => {
    const field = screen.getByRole('combobox');
    act(() => field.focus());
    fireEvent.change(field, { target: { value } });
  };
  const shown = () =>
    screen.queryAllByRole('option').map(option => option.textContent);

  it('finds accented Combobox items from plain letters', () => {
    render(
      <LocaleProvider locale="fr">
        <Combobox data={drinks} aria-label="Drink" />
      </LocaleProvider>
    );
    type('  cafe ');
    expect(shown()).toEqual(['Café']);
  });

  it('keeps Combobox matching as it was outside a provider', () => {
    render(<Combobox data={drinks} aria-label="Drink" />);
    type('cafe');
    expect(shown()).toEqual([]);
    type('CAF');
    expect(shown()).toEqual(['Café']);
  });

  it('finds accented Autocomplete options from plain letters', () => {
    render(
      <LocaleProvider locale="fr">
        <Autocomplete data={drinks} />
      </LocaleProvider>
    );
    type('the');
    expect(shown()).toEqual(['Thé']);
  });

  it('keeps Autocomplete matching as it was outside a provider', () => {
    render(<Autocomplete data={drinks} />);
    type('the');
    expect(shown()).toEqual([]);
  });

  it('finds accented Taginput suggestions from plain letters', () => {
    render(
      <LocaleProvider locale="fr">
        <Taginput data={drinks} />
      </LocaleProvider>
    );
    type('the');
    expect(shown()).toEqual(['Thé']);
  });

  it('keeps Taginput matching as it was outside a provider', () => {
    render(<Taginput data={drinks} />);
    type('the');
    expect(shown()).toEqual([]);
  });

  describe('in Command', () => {
    const actions: CommandAction[] = [
      { id: 'cafe', label: 'Café' },
      { id: 'tea', label: 'Thé', keywords: ['infusion'] },
      { id: 'dessert', label: 'Dessert', description: 'Crème brûlée' },
      { id: 'water', label: 'Eau', keywords: ['Évian'] },
    ];
    const search = (value: string) =>
      fireEvent.change(screen.getByRole('combobox'), { target: { value } });
    /** The labels of the actions shown, in order. */
    const labels = () =>
      screen
        .queryAllByRole('option')
        .map(
          option =>
            actions.find(a => option.textContent!.startsWith(a.label))!.label
        );

    it('finds labels, descriptions and keywords from plain letters', () => {
      render(
        <LocaleProvider locale="fr">
          <Command actions={actions} />
        </LocaleProvider>
      );
      search('  cafe ');
      expect(labels()).toEqual(['Café']);
      search('creme');
      expect(labels()).toEqual(['Dessert']);
      search('evian');
      expect(labels()).toEqual(['Eau']);
      search('');
      expect(labels()).toEqual(['Café', 'Thé', 'Dessert', 'Eau']);
    });

    it('keeps label matches first', () => {
      render(
        <LocaleProvider locale="fr">
          <Command
            actions={[
              { id: 'one', label: 'Fichiers', keywords: ['thé'] },
              { id: 'two', label: 'Thème' },
            ]}
          />
        </LocaleProvider>
      );
      search('the');
      expect(
        screen.queryAllByRole('option').map(option => option.textContent)
      ).toEqual(['Thème', 'Fichiers']);
    });

    it('keeps its matching as it was outside a provider', () => {
      render(<Command actions={actions} />);
      search('cafe');
      expect(labels()).toEqual([]);
      search('CAF');
      expect(labels()).toEqual(['Café']);
    });

    it('lets a filter of its own take over inside a provider', () => {
      const filter = vi.fn((_: string, all: CommandAction[]) => all.slice(3));
      render(
        <LocaleProvider locale="fr">
          <Command actions={actions} filter={filter} />
        </LocaleProvider>
      );
      search('cafe');
      expect(labels()).toEqual(['Eau']);
      expect(filter).toHaveBeenLastCalledWith('cafe', actions);
    });
  });
});
