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
});
