import React from 'react';
import { act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { LocaleProvider } from '../LocaleProvider';
import { Portal } from '../portal';
import { DateInput } from '../../form/DateInput';

/**
 * Server rendering. The provider's attributes come from its props, so the
 * server and the browser write the same ones. An inline calendar's day names
 * come from `Intl`, which with no locale uses the runtime's own: the server's
 * on the server, the browser's in the browser. These tests stand the two
 * apart by giving the server render a different default locale.
 */

const RealDateTimeFormat = Intl.DateTimeFormat;

/** Makes `Intl.DateTimeFormat` default to `locale`, as a server set up for it would. */
function defaultLocaleIs(locale: string) {
  const Patched = function (
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ) {
    return new RealDateTimeFormat(locales ?? locale, options);
  } as unknown as typeof Intl.DateTimeFormat;
  Object.defineProperty(Patched, 'prototype', {
    value: RealDateTimeFormat.prototype,
  });
  Intl.DateTimeFormat = Patched;
}

afterEach(() => {
  Intl.DateTimeFormat = RealDateTimeFormat;
});

/**
 * Renders on a "server" whose default locale is German, then hydrates in a
 * "browser" whose default is English.
 */
async function hydrateFromGermanServer(app: React.ReactElement) {
  defaultLocaleIs('de-DE');
  const html = renderToString(app);
  // The browser defaults to English.
  defaultLocaleIs('en-US');

  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  const recoverable: unknown[] = [];
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  let unmount = () => {};
  try {
    await act(async () => {
      const root = hydrateRoot(container, app, {
        onRecoverableError: error => recoverable.push(error),
      });
      unmount = () => root.unmount();
    });
    return { html, recoverable, errors: errorSpy.mock.calls.length };
  } finally {
    await act(async () => unmount());
    errorSpy.mockRestore();
    document.body.removeChild(container);
  }
}

describe('LocaleProvider on the server', () => {
  it('writes dir and lang into the server markup', () => {
    expect(
      renderToString(
        <LocaleProvider locale="ar-EG" p="2">
          <p>Hi</p>
        </LocaleProvider>
      )
    ).toBe('<div class="p-2" dir="rtl" lang="ar-EG"><p>Hi</p></div>');
  });

  it('renders nothing for a Portal inside it, as without one', () => {
    expect(
      renderToString(
        <LocaleProvider locale="he">
          <Portal>
            <p>Portaled</p>
          </Portal>
        </LocaleProvider>
      )
    ).toBe('<div dir="rtl" lang="he"></div>');
  });

  it("hydrates an inline calendar in the provider's locale with no mismatch", async () => {
    const result = await hydrateFromGermanServer(
      <LocaleProvider locale="fr">
        <DateInput
          inline
          aria-label="Date"
          defaultValue={new Date(2026, 9, 1)}
        />
      </LocaleProvider>
    );
    expect(result.html).toContain('octobre');
    expect(result.recoverable).toEqual([]);
    expect(result.errors).toBe(0);
  });

  it('mismatches with no locale when the server defaults to another one', async () => {
    // The case the docs warn about, and the reason to set a locale: the
    // server names the days in German, the browser in English.
    const result = await hydrateFromGermanServer(
      <DateInput inline aria-label="Date" defaultValue={new Date(2026, 9, 1)} />
    );
    expect(result.html).toContain('Oktober');
    expect(result.recoverable.length + result.errors).toBeGreaterThan(0);
  });
});
