import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { LocaleProvider } from '../LocaleProvider';
import {
  useLocaleMatcher,
  useNumberFormat,
  type NumberFormatter,
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

/** How `locale` writes `value`, as the tests expect to see it. */
const write = (
  locale: string,
  value: number,
  options?: Intl.NumberFormatOptions
) => new Intl.NumberFormat(locale, options).format(value);

/** Renders `node` inside an Egyptian Arabic provider, whose digits differ. */
const inArabic = (node: React.ReactElement) =>
  render(<LocaleProvider locale="ar-EG">{node}</LocaleProvider>);

describe('useNumberFormat', () => {
  let seen: NumberFormatter | null;
  function Probe({ own }: { own?: string }) {
    seen = useNumberFormat(own);
    return null;
  }

  beforeEach(() => {
    seen = undefined as unknown as null;
  });

  it('is null outside a provider, even with a locale of its own', () => {
    render(<Probe own="de" />);
    expect(seen).toBeNull();
  });

  it('is null inside a provider with no locale and none of its own', () => {
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

  it('lets its own locale win inside a provider', () => {
    render(
      <LocaleProvider locale="de">
        <Probe own="ar-EG" />
      </LocaleProvider>
    );
    expect(seen!(12)).toBe(write('ar-EG', 12));
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
    const spy = jest
      .spyOn(Intl, 'Collator')
      .mockImplementation(
        (...args: ConstructorParameters<typeof Intl.Collator>) => {
          const real = new RealCollator(...args);
          return {
            compare: (a: string, b: string) => {
              compared++;
              return real.compare(a, b);
            },
          } as Intl.Collator;
        }
      );
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
      const filter = jest.fn((_: string, all: CommandAction[]) => all.slice(3));
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
