import React, { createRef } from 'react';
import { act, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { NumberFormatter } from '../NumberFormatter';
import { ConfigProvider } from '../../helpers/Config';
import { LocaleProvider } from '../../helpers/LocaleProvider';

/** `Intl.NumberFormat` as it is before any test replaces it. */
const RealNumberFormat = Intl.NumberFormat;

/** How `locale` writes `value`, the runtime's locale for `undefined`. */
const write = (
  locale: string | undefined,
  value: number,
  options?: Intl.NumberFormatOptions
) => new RealNumberFormat(locale, options).format(value);

const dataOf = (container: HTMLElement) =>
  container.querySelector('data') as HTMLDataElement;

afterEach(() => {
  vi.restoreAllMocks();
  Intl.NumberFormat = RealNumberFormat;
});

describe('NumberFormatter', () => {
  it("renders a <data> with the number as its value and Intl's text", () => {
    const { container } = render(<NumberFormatter value={1234.5} />);
    const data = dataOf(container);
    expect(data).toHaveAttribute('value', '1234.5');
    expect(data.textContent).toBe(write(undefined, 1234.5));
    expect(data).not.toHaveAttribute('class');
    expect(data).not.toHaveAttribute('role');
  });

  it('passes format to Intl.NumberFormat', () => {
    const { container, rerender } = render(
      <NumberFormatter
        value={8456.4}
        locale="en-US"
        format={{ style: 'currency', currency: 'USD' }}
      />
    );
    expect(dataOf(container).textContent).toBe('$8,456.40');
    expect(dataOf(container)).toHaveAttribute('value', '8456.4');
    const cases: [number, Intl.NumberFormatOptions][] = [
      [0.125, { style: 'percent', maximumFractionDigits: 1 }],
      [123456, { notation: 'compact' }],
      [12, { style: 'unit', unit: 'kilometer-per-hour' }],
      [-1.9, { signDisplay: 'exceptZero' }],
    ];
    for (const [value, format] of cases) {
      rerender(<NumberFormatter value={value} locale="de" format={format} />);
      expect(dataOf(container).textContent).toBe(write('de', value, format));
    }
  });

  it("writes NaN and Infinity as Intl does, with JavaScript's digits as the value", () => {
    const { container, rerender } = render(<NumberFormatter value={NaN} />);
    expect(dataOf(container)).toHaveAttribute('value', 'NaN');
    expect(dataOf(container).textContent).toBe(write(undefined, NaN));
    rerender(<NumberFormatter value={-Infinity} />);
    expect(dataOf(container)).toHaveAttribute('value', '-Infinity');
    expect(dataOf(container).textContent).toBe(write(undefined, -Infinity));
  });

  describe('Locale', () => {
    it("takes the runtime's outside a provider, and its own locale", () => {
      const { container, rerender } = render(
        <NumberFormatter value={1234.5} />
      );
      expect(dataOf(container).textContent).toBe(write(undefined, 1234.5));
      rerender(<NumberFormatter value={1234.5} locale="de-DE" />);
      expect(dataOf(container).textContent).toBe(write('de-DE', 1234.5));
    });

    it("takes the LocaleProvider's, and lets its own win", () => {
      const { container, rerender } = render(
        <LocaleProvider locale="fr-FR">
          <NumberFormatter
            value={1234.5}
            format={{ style: 'unit', unit: 'kilometer-per-hour' }}
          />
        </LocaleProvider>
      );
      expect(dataOf(container).textContent).toBe(
        write('fr-FR', 1234.5, { style: 'unit', unit: 'kilometer-per-hour' })
      );
      rerender(
        <LocaleProvider locale="fr-FR">
          <NumberFormatter value={1234.5} locale="ar-EG" />
        </LocaleProvider>
      );
      expect(dataOf(container).textContent).toBe(write('ar-EG', 1234.5));
      // An empty tag is no locale, so the provider's stands.
      rerender(
        <LocaleProvider locale="fr-FR">
          <NumberFormatter value={1234.5} locale="" />
        </LocaleProvider>
      );
      expect(dataOf(container).textContent).toBe(write('fr-FR', 1234.5));
    });

    it("takes the runtime's in a provider that gives no locale", () => {
      const { container } = render(
        <LocaleProvider dir="rtl">
          <NumberFormatter value={1234.5} />
        </LocaleProvider>
      );
      expect(dataOf(container).textContent).toBe(write(undefined, 1234.5));
    });
  });

  it('builds one Intl.NumberFormat for many numbers written alike', () => {
    let built = 0;
    vi.spyOn(Intl, 'NumberFormat').mockImplementation(function (
      ...args: ConstructorParameters<typeof Intl.NumberFormat>
    ) {
      built++;
      return new RealNumberFormat(...args);
    });
    // Options no other test uses, so nothing is kept from before.
    const format = { style: 'currency', currency: 'CHF' } as const;
    const { container } = render(
      <>
        {[1, 22, 333, 4444].map(value => (
          <NumberFormatter
            key={value}
            value={value}
            locale="it-CH"
            format={{ ...format }}
          />
        ))}
      </>
    );
    expect(built).toBe(1);
    expect(container.lastElementChild!.textContent).toBe(
      write('it-CH', 4444, format)
    );
  });

  describe('What Intl refuses', () => {
    it('throws its error for options it refuses', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() =>
        render(<NumberFormatter value={1} format={{ style: 'currency' }} />)
      ).toThrow(TypeError);
    });

    it('throws its error for a tag it refuses', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() =>
        render(<NumberFormatter value={1} locale="en_US" />)
      ).toThrow(RangeError);
    });
  });

  describe('The <data> element', () => {
    it('takes the helper props, className and other attributes', () => {
      const { container } = render(
        <NumberFormatter
          value={42}
          textColor="success"
          bgColor="light"
          textWeight="bold"
          className="total"
          id="total"
          title="Order total"
        />
      );
      const data = dataOf(container);
      expect(data).toHaveClass(
        'has-text-success',
        'has-background-light',
        'has-text-weight-bold',
        'total'
      );
      expect(data).toHaveAttribute('id', 'total');
      expect(data).toHaveAttribute('title', 'Order total');
    });

    it('prefixes the helper classes under ConfigProvider classPrefix', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <NumberFormatter value={42} textColor="primary" m="2" />
        </ConfigProvider>
      );
      const data = dataOf(container);
      expect(data).toHaveClass('bestax-has-text-primary', 'bestax-m-2');
      expect(data).not.toHaveClass('has-text-primary');
    });

    it('forwards its ref to the <data>', () => {
      const ref = createRef<HTMLDataElement>();
      render(<NumberFormatter ref={ref} value={42} />);
      expect(ref.current).toBeInstanceOf(HTMLDataElement);
      expect(ref.current).toHaveAttribute('value', '42');
    });
  });

  describe('Server rendering', () => {
    /** Makes `Intl.NumberFormat` default to `locale`, as a runtime set up for it would. */
    function defaultLocaleIs(locale: string) {
      const Patched = function (
        locales?: string | string[],
        options?: Intl.NumberFormatOptions
      ) {
        return new RealNumberFormat(locales ?? locale, options);
      } as unknown as typeof Intl.NumberFormat;
      Object.defineProperty(Patched, 'prototype', {
        value: RealNumberFormat.prototype,
      });
      Intl.NumberFormat = Patched;
    }

    /**
     * Renders on a "server" whose own locale is German, then hydrates in a
     * "browser" whose own locale is English.
     */
    async function hydrateFromGermanServer(app: React.ReactElement) {
      defaultLocaleIs('de-DE');
      const html = renderToString(app);
      defaultLocaleIs('en-US');
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);
      const recoverable: unknown[] = [];
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, app, {
            onRecoverableError: error => recoverable.push(error),
          });
        });
        return {
          html,
          text: container.textContent,
          recoverable,
          errors: errorSpy.mock.calls.length,
        };
      } finally {
        await act(async () => root!.unmount());
        container.remove();
      }
    }

    it('writes the same text on the server and in the browser inside a LocaleProvider', async () => {
      // Options no other test uses, so the server builds its own formatter.
      const format = { minimumFractionDigits: 3 };
      const result = await hydrateFromGermanServer(
        <LocaleProvider locale="fr-FR">
          <NumberFormatter value={1234.5} format={format} />
        </LocaleProvider>
      );
      expect(result.html).toContain('<data value="1234.5">');
      expect(result.text).toBe(write('fr-FR', 1234.5, format));
      expect(result.recoverable).toEqual([]);
      expect(result.errors).toBe(0);
    });

    it('writes the same text with a locale of its own', async () => {
      const format = { minimumFractionDigits: 4 };
      const result = await hydrateFromGermanServer(
        <NumberFormatter value={1234.5} locale="ja-JP" format={format} />
      );
      expect(result.text).toBe(write('ja-JP', 1234.5, format));
      expect(result.recoverable).toEqual([]);
      expect(result.errors).toBe(0);
    });
  });
});
