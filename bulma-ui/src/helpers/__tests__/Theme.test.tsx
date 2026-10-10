import { StrictMode, useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Theme, ThemeProps } from '../Theme';
import { ConfigProvider } from '../Config';
import { resetDevWarnings } from '../devWarnings';

describe('Theme', () => {
  it('applies CSS variables from bulmaVars object to local div', () => {
    const vars = { '--bulma-scheme-h': '50', '--bulma-scheme-s': '51%' };
    const { container } = render(
      <Theme bulmaVars={vars}>
        <div data-testid="content">Test Content</div>
      </Theme>
    );

    const themeDiv = container.firstChild as HTMLElement;
    expect(themeDiv.style.getPropertyValue('--bulma-scheme-h')).toBe('50');
    expect(themeDiv.style.getPropertyValue('--bulma-scheme-s')).toBe('51%');
  });

  it('applies scheme background variables from bulmaVars to local div', () => {
    const vars = {
      '--bulma-scheme-main-bis': '#f2f4f8',
      '--bulma-scheme-main-ter': '#e8ecf2',
    };
    const { container } = render(
      <Theme bulmaVars={vars}>
        <div data-testid="content">Test Content</div>
      </Theme>
    );

    const themeDiv = container.firstChild as HTMLElement;
    expect(themeDiv.style.getPropertyValue('--bulma-scheme-main-bis')).toBe(
      '#f2f4f8'
    );
    expect(themeDiv.style.getPropertyValue('--bulma-scheme-main-ter')).toBe(
      '#e8ecf2'
    );
  });

  it('applies scheme background variables globally when isRoot is true', () => {
    render(
      <Theme bulmaVars={{ '--bulma-scheme-main-bis': '#10131a' }} isRoot>
        <div data-testid="content">Test Content</div>
      </Theme>
    );

    const styleElement = document.getElementById('bestax-bulma-theme-vars');
    expect(styleElement).toBeInTheDocument();
    expect(styleElement?.textContent).toContain(
      '--bulma-scheme-main-bis: #10131a'
    );
    expect(styleElement?.textContent).toContain(':root');
  });

  it('applies CSS variables from individual props to local div', () => {
    const { container } = render(
      <Theme schemeH="120" schemeS="40%">
        <div data-testid="content">Test Content</div>
      </Theme>
    );

    const themeDiv = container.firstChild as HTMLElement;
    expect(themeDiv.style.getPropertyValue('--bulma-scheme-h')).toBe('120');
    expect(themeDiv.style.getPropertyValue('--bulma-scheme-s')).toBe('40%');
  });

  it('individual props override bulmaVars object', () => {
    const vars = { '--bulma-scheme-h': '50', '--bulma-scheme-s': '51%' };
    const { container } = render(
      <Theme bulmaVars={vars} schemeH="99" schemeS="99%">
        <div data-testid="content">Test Content</div>
      </Theme>
    );

    const themeDiv = container.firstChild as HTMLElement;
    expect(themeDiv.style.getPropertyValue('--bulma-scheme-h')).toBe('99');
    expect(themeDiv.style.getPropertyValue('--bulma-scheme-s')).toBe('99%');
  });

  it('applies CSS variables globally when isRoot is true', () => {
    render(
      <Theme primaryH="200" primaryS="80%" isRoot>
        <div data-testid="content">Test Content</div>
      </Theme>
    );

    // Check that a style element was created with the CSS variables
    const styleElement = document.getElementById('bestax-bulma-theme-vars');
    expect(styleElement).toBeInTheDocument();
    expect(styleElement?.textContent).toContain('--bulma-primary-h: 200');
    expect(styleElement?.textContent).toContain('--bulma-primary-s: 80%');
    expect(styleElement?.textContent).toContain(':root');
  });

  it('applies className and Bulma helper classes when provided', () => {
    const { container } = render(
      <Theme className="custom-theme" p="4" m="2" textAlign="centered">
        <div data-testid="content">Test Content</div>
      </Theme>
    );

    const themeDiv = container.firstChild as HTMLElement;
    expect(themeDiv.className).toContain('custom-theme');
    expect(themeDiv.className).toContain('p-4');
    expect(themeDiv.className).toContain('m-2');
    expect(themeDiv.className).toContain('has-text-centered');
  });

  it('renders children correctly', () => {
    const { getByTestId } = render(
      <Theme bulmaVars={{}}>
        <div data-testid="test-child">Hello Theme</div>
      </Theme>
    );

    expect(getByTestId('test-child')).toBeInTheDocument();
    expect(getByTestId('test-child')).toHaveTextContent('Hello Theme');
  });

  it('handles empty props gracefully', () => {
    const { container } = render(
      <Theme>
        <div data-testid="content">Test Content</div>
      </Theme>
    );

    const themeDiv = container.firstChild as HTMLElement;
    expect(themeDiv).toBeInTheDocument();
    expect(themeDiv.tagName).toBe('DIV');
  });

  it('combines multiple CSS variable sources correctly', () => {
    const vars = {
      '--bulma-scheme-h': '50',
      '--bulma-primary-h': '100',
    };

    const { container } = render(
      <Theme bulmaVars={vars} schemeH="200" successH="300" infoL="60%">
        <div data-testid="content">Test Content</div>
      </Theme>
    );

    const themeDiv = container.firstChild as HTMLElement;
    // Props should override bulmaVars
    expect(themeDiv.style.getPropertyValue('--bulma-scheme-h')).toBe('200');
    // bulmaVars should be applied when no prop override
    expect(themeDiv.style.getPropertyValue('--bulma-primary-h')).toBe('100');
    // Individual props should be applied
    expect(themeDiv.style.getPropertyValue('--bulma-success-h')).toBe('300');
    expect(themeDiv.style.getPropertyValue('--bulma-info-l')).toBe('60%');
  });

  it('applies CSS variables to root when isRoot=true and cleans up on unmount', () => {
    const { unmount } = render(
      <Theme primaryH="240" isRoot>
        <div>Test</div>
      </Theme>
    );

    // Check that style element exists with the CSS variable
    const styleElement = document.getElementById('bestax-bulma-theme-vars');
    expect(styleElement).toBeInTheDocument();
    expect(styleElement?.textContent).toContain('--bulma-primary-h: 240');

    unmount();

    // Check that style element is removed after unmount
    const removedElement = document.getElementById('bestax-bulma-theme-vars');
    expect(removedElement).toBeNull();
  });

  it('renders children directly without wrapper when isRoot=true', () => {
    const { container, getByTestId } = render(
      <Theme primaryH="240" isRoot>
        <div data-testid="direct-child">Direct Child</div>
      </Theme>
    );

    // When isRoot=true, children should be rendered directly without a wrapper div
    const directChild = getByTestId('direct-child');
    expect(directChild).toBeInTheDocument();
    expect(directChild.parentElement).toBe(container); // Direct child of container
  });

  it('does not create style element when isRoot=true but no valid CSS variables provided', () => {
    render(
      <Theme isRoot bulmaVars={{}}>
        <div data-testid="content">Test Content</div>
      </Theme>
    );

    // Check that no style element was created when no valid CSS variables are provided
    const styleElement = document.getElementById('bestax-bulma-theme-vars');
    expect(styleElement).toBeNull();
  });

  it('reuses an existing style element when one already exists', () => {
    // Pre-create the style element so the isRoot effect re-uses it instead of
    // creating a new one (covers the `if (!styleElement)` false branch).
    const preExisting = document.createElement('style');
    preExisting.id = 'bestax-bulma-theme-vars';
    document.head.appendChild(preExisting);

    const { unmount } = render(
      <Theme primaryH="180" isRoot>
        <div>Test</div>
      </Theme>
    );

    const styleElement = document.getElementById('bestax-bulma-theme-vars');
    // Should be the SAME element we pre-created.
    expect(styleElement).toBe(preExisting);
    expect(styleElement?.textContent).toContain('--bulma-primary-h: 180');

    unmount();
  });

  it('cleanup is a no-op when style element was already removed', () => {
    // Render an isRoot Theme so the cleanup-on-unmount path runs.
    const { unmount } = render(
      <Theme primaryH="240" isRoot>
        <div>Test</div>
      </Theme>
    );

    // Remove the style element manually to exercise the `if (element)` false
    // branch in the cleanup function.
    const styleElement = document.getElementById('bestax-bulma-theme-vars');
    expect(styleElement).toBeInTheDocument();
    styleElement?.remove();
    expect(document.getElementById('bestax-bulma-theme-vars')).toBeNull();

    // Unmount — cleanup must not throw even though the element is gone.
    expect(() => unmount()).not.toThrow();
  });

  it('applies --bulma-shadow (and its h/s/l components) from bulmaVars', () => {
    // Regression test for #499: --bulma-shadow is the upstream token that
    // .box/.card/.dropdown/.panel derive their own shadow variables from, so
    // it must be settable via bulmaVars even though it isn't exposed as an
    // individual prop.
    const vars = {
      '--bulma-shadow': '0 0 0 2px hsl(0, 0%, 0%)',
      '--bulma-shadow-h': '200deg',
      '--bulma-shadow-s': '50%',
      '--bulma-shadow-l': '10%',
    };
    const { container } = render(
      <Theme bulmaVars={vars}>
        <div data-testid="content">Test Content</div>
      </Theme>
    );

    const themeDiv = container.firstChild as HTMLElement;
    expect(themeDiv.style.getPropertyValue('--bulma-shadow')).toBe(
      '0 0 0 2px hsl(0, 0%, 0%)'
    );
    expect(themeDiv.style.getPropertyValue('--bulma-shadow-h')).toBe('200deg');
    expect(themeDiv.style.getPropertyValue('--bulma-shadow-s')).toBe('50%');
    expect(themeDiv.style.getPropertyValue('--bulma-shadow-l')).toBe('10%');
  });

  it('keeps the `shadow` prop as the shadowless helper class, not a CSS var', () => {
    // Regression test for #499: --bulma-shadow's minted prop name ("shadow")
    // collides with the pre-existing BulmaOtherProps `shadow` prop
    // (shadow="shadowless" -> is-shadowless class). The `shadow` prop must
    // keep producing the class, not get diverted into --bulma-shadow.
    const { container } = render(
      <Theme shadow="shadowless">
        <div data-testid="content">Test Content</div>
      </Theme>
    );

    const themeDiv = container.firstChild as HTMLElement;
    expect(themeDiv.className).toContain('is-shadowless');
    expect(themeDiv.style.getPropertyValue('--bulma-shadow')).toBe('');
  });

  describe('radius (#694)', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      resetDevWarnings();
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('renders radiusless as the class and zeroes the radius inside', () => {
      const { container, getByTestId } = render(
        <Theme radius="radiusless">
          <div data-testid="inside">Test</div>
        </Theme>
      );

      // Before #694 this wrote `--bulma-radius: radiusless`, which is invalid
      // and so squared everything inside that reads the variable. A real 0
      // keeps that, as valid CSS, and the typed value never warns.
      const themeDiv = container.firstChild as HTMLElement;
      expect(themeDiv).toHaveClass('is-radiusless');
      expect(themeDiv.style.getPropertyValue('--bulma-radius')).toBe('0');
      // jsdom does not cascade custom properties, so pin what the browser
      // inherits from instead: the content sits in the element setting it.
      expect(getByTestId('inside').parentElement).toBe(themeDiv);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('writes radiusless at :root on an isRoot Theme, without warning', () => {
      render(
        <Theme isRoot radius="radiusless">
          <div>Test</div>
        </Theme>
      );

      expect(
        document.getElementById('bestax-bulma-theme-vars')?.textContent
      ).toBe(':root { --bulma-radius: 0; }');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('lets radiusless win over bulmaVars, as the prop always did', () => {
      const { container } = render(
        <Theme radius="radiusless" bulmaVars={{ '--bulma-radius': '6px' }}>
          <div>Test</div>
        </Theme>
      );

      const themeDiv = container.firstChild as HTMLElement;
      expect(themeDiv.style.getPropertyValue('--bulma-radius')).toBe('0');
    });

    it('prefixes the helper class like every other helper prop', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <Theme radius="radiusless">
            <div>Test</div>
          </Theme>
        </ConfigProvider>
      );

      expect(container.firstChild).toHaveClass('bestax-is-radiusless');
    });

    it('still sets --bulma-radius for any other value, and warns', () => {
      const { container } = render(
        // The type is the helper union, as it was before #694, so a length
        // is a type error. JavaScript callers can still pass one.
        // @ts-expect-error radius is typed as the helper, not a length
        <Theme radius="6px">
          <div>Test</div>
        </Theme>
      );

      const themeDiv = container.firstChild as HTMLElement;
      expect(themeDiv.style.getPropertyValue('--bulma-radius')).toBe('6px');
      expect(themeDiv.className).toBe('');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('<Theme radius="6px">')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("bulmaVars={{ '--bulma-radius': '6px' }}")
      );
    });

    // The sizes are Bulma's `has-radius-*` helpers, which read the radius
    // variables. Writing `--bulma-radius` from them would make `normal` refer
    // to itself, which computes to 0, and `rounded` would pill every control
    // inside, so they add the class and nothing else.
    it.each(['small', 'normal', 'large', 'rounded'] as const)(
      'renders radius="%s" as the class and writes no variable',
      size => {
        const { container } = render(
          <Theme radius={size} bulmaVars={{ '--bulma-radius': '2px' }}>
            <div>Test</div>
          </Theme>
        );

        const themeDiv = container.firstChild as HTMLElement;
        expect(themeDiv).toHaveClass(`has-radius-${size}`);
        expect(themeDiv.style.getPropertyValue('--bulma-radius')).toBe('2px');
        expect(warnSpy).not.toHaveBeenCalled();
      }
    );

    // A root Theme renders no wrapper, so a size has no element for its class
    // and writes no variable: it does nothing. Silence there would read as
    // the prop working, so it warns, once, and says what to do instead.
    it('writes nothing for a radius size on an isRoot Theme, and warns once', () => {
      const { rerender } = render(
        <Theme isRoot radius="rounded">
          <div>Test</div>
        </Theme>
      );
      rerender(
        <Theme isRoot radius="rounded">
          <div>Test</div>
        </Theme>
      );
      render(
        <Theme isRoot radius="small">
          <div>Test</div>
        </Theme>
      );

      expect(document.getElementById('bestax-bulma-theme-vars')).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('<Theme isRoot radius="rounded">')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('put radius="rounded" on it')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("bulmaVars={{ '--bulma-radius': '…' }}")
      );
    });

    it('does not warn for a radius size on a scoped Theme or radiusless at the root', () => {
      render(
        <Theme radius="large">
          <div>Test</div>
        </Theme>
      );
      const { unmount } = render(
        <Theme isRoot radius="radiusless">
          <div>Test</div>
        </Theme>
      );
      unmount();

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('does not warn for a radius size on an isRoot Theme in production', () => {
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        render(
          <Theme isRoot radius="normal">
            <div>Test</div>
          </Theme>
        );
      } finally {
        process.env.NODE_ENV = previous;
      }

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('names every helper value in the deprecation warning', () => {
      render(
        <Theme {...({ radius: '6px' } as unknown as ThemeProps)}>
          <div>Test</div>
        </Theme>
      );

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'the border radius helper ("radiusless", "small", "normal", "large", "rounded")'
        )
      );
    });

    it('warns once however many Themes pass a length', () => {
      const legacy = { radius: '6px' } as unknown as ThemeProps;
      const { rerender } = render(
        <Theme {...legacy}>
          <div>Test</div>
        </Theme>
      );
      rerender(
        <Theme {...legacy}>
          <div>Test</div>
        </Theme>
      );
      render(
        <Theme {...({ radius: '1rem' } as unknown as ThemeProps)}>
          <div>Test</div>
        </Theme>
      );

      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('lets the legacy value win over bulmaVars, as the prop always did', () => {
      const { container } = render(
        <Theme
          {...({ radius: '6px' } as unknown as ThemeProps)}
          bulmaVars={{ '--bulma-radius': '2px' }}
        >
          <div>Test</div>
        </Theme>
      );

      const themeDiv = container.firstChild as HTMLElement;
      expect(themeDiv.style.getPropertyValue('--bulma-radius')).toBe('6px');
    });

    it('sets the legacy value at :root on an isRoot Theme', () => {
      const { unmount } = render(
        <Theme isRoot {...({ radius: '12px' } as unknown as ThemeProps)}>
          <div>Test</div>
        </Theme>
      );

      expect(
        document.getElementById('bestax-bulma-theme-vars')?.textContent
      ).toBe(':root { --bulma-radius: 12px; }');
      unmount();
    });

    it('leaves --bulma-radius to bulmaVars when radius is unset', () => {
      const { container } = render(
        <Theme bulmaVars={{ '--bulma-radius': '2px' }}>
          <div>Test</div>
        </Theme>
      );

      const themeDiv = container.firstChild as HTMLElement;
      expect(themeDiv.style.getPropertyValue('--bulma-radius')).toBe('2px');
      expect(themeDiv.className).toBe('');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('ignores an empty radius, which never set anything', () => {
      const { container } = render(
        <Theme {...({ radius: '' } as unknown as ThemeProps)}>
          <div>Test</div>
        </Theme>
      );

      const themeDiv = container.firstChild as HTMLElement;
      expect(themeDiv.style.getPropertyValue('--bulma-radius')).toBe('');
      expect(themeDiv.className).toBe('');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('sends a non-string to the helper, which ignores it', () => {
      const { container } = render(
        <Theme {...({ radius: 6 } as unknown as ThemeProps)}>
          <div>Test</div>
        </Theme>
      );

      const themeDiv = container.firstChild as HTMLElement;
      expect(themeDiv.style.getPropertyValue('--bulma-radius')).toBe('');
      expect(themeDiv.className).toBe('');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('still sets the variable in production, without warning', () => {
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const { container } = render(
          <Theme {...({ radius: '6px' } as unknown as ThemeProps)}>
            <div>Test</div>
          </Theme>
        );

        const themeDiv = container.firstChild as HTMLElement;
        expect(themeDiv.style.getPropertyValue('--bulma-radius')).toBe('6px');
        expect(warnSpy).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = previous;
      }
    });
  });

  // Theme mints a prop for every Bulma variable, and `--bulma-column-gap`
  // minted `columnGap`, which is a shared helper prop now. It is the helper on
  // Theme too; a string that is not a gap step keeps the old variable route,
  // as `radius` kept its own.
  describe('columnGap', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      resetDevWarnings();
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('renders a gap step as the helper class and writes no variable', () => {
      const { container } = render(
        <Theme columnGap="2" bulmaVars={{ '--bulma-column-gap': '1rem' }}>
          <div>Test</div>
        </Theme>
      );

      const themeDiv = container.firstChild as HTMLElement;
      expect(themeDiv).toHaveClass('is-column-gap-2');
      expect(themeDiv.style.getPropertyValue('--bulma-column-gap')).toBe(
        '1rem'
      );
      expect(warnSpy).not.toHaveBeenCalled();
    });

    // The one value whose meaning moved: `'0'` was a valid length and zeroed
    // the gutters inside, and it is a gap step now.
    it('renders "0" as the class rather than the variable it used to set', () => {
      const { container } = render(
        <Theme columnGap="0">
          <div>Test</div>
        </Theme>
      );

      const themeDiv = container.firstChild as HTMLElement;
      expect(themeDiv).toHaveClass('is-column-gap-0');
      expect(themeDiv.style.getPropertyValue('--bulma-column-gap')).toBe('');
    });

    it('takes a gap step as a number', () => {
      const { container } = render(
        <Theme columnGap={1.5}>
          <div>Test</div>
        </Theme>
      );

      expect(container.firstChild).toHaveClass('is-column-gap-1.5');
    });

    it('still sets --bulma-column-gap for any other string, and warns', () => {
      const { container } = render(
        <Theme {...({ columnGap: '1rem' } as unknown as ThemeProps)}>
          <div>Test</div>
        </Theme>
      );

      const themeDiv = container.firstChild as HTMLElement;
      expect(themeDiv.style.getPropertyValue('--bulma-column-gap')).toBe(
        '1rem'
      );
      expect(themeDiv.className).toBe('');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('<Theme columnGap="1rem">')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("bulmaVars={{ '--bulma-column-gap': '1rem' }}")
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('the column gap helper ("0", "0.5", "1"')
      );
    });

    it('lets the legacy value win over bulmaVars, as the prop always did', () => {
      const { container } = render(
        <Theme
          {...({ columnGap: '2rem' } as unknown as ThemeProps)}
          bulmaVars={{ '--bulma-column-gap': '1rem' }}
        >
          <div>Test</div>
        </Theme>
      );

      const themeDiv = container.firstChild as HTMLElement;
      expect(themeDiv.style.getPropertyValue('--bulma-column-gap')).toBe(
        '2rem'
      );
    });

    it('sets the legacy value at :root on an isRoot Theme, without the root warning', () => {
      const { unmount } = render(
        <Theme isRoot {...({ columnGap: '12px' } as unknown as ThemeProps)}>
          <div>Test</div>
        </Theme>
      );

      expect(
        document.getElementById('bestax-bulma-theme-vars')?.textContent
      ).toBe(':root { --bulma-column-gap: 12px; }');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('<Theme isRoot columnGap=')
      );
      unmount();
    });

    // A root Theme has no wrapper for the class, and a step writes no
    // variable, so it does nothing. It reads like the gutter it once set, so
    // it says so, once.
    it('writes nothing for a gap step on an isRoot Theme, and warns once', () => {
      const { rerender } = render(
        <Theme isRoot columnGap="3">
          <div>Test</div>
        </Theme>
      );
      rerender(
        <Theme isRoot columnGap="3">
          <div>Test</div>
        </Theme>
      );
      render(
        <Theme isRoot columnGap={2}>
          <div>Test</div>
        </Theme>
      );

      expect(document.getElementById('bestax-bulma-theme-vars')).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('<Theme isRoot columnGap="3">')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("bulmaVars={{ '--bulma-column-gap': '…' }}")
      );

      // A step written as a number takes the same route and names itself as
      // the string it renders. Once more after a reset, since the warning
      // above has already used up `warnOnce`.
      resetDevWarnings();
      warnSpy.mockClear();
      render(
        <Theme isRoot columnGap={1.5}>
          <div>Test</div>
        </Theme>
      );

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('<Theme isRoot columnGap="1.5">')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('no wrapper element for is-column-gap-1.5')
      );
    });

    it('does not warn at the root in production', () => {
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        render(
          <Theme isRoot columnGap="3">
            <div>Test</div>
          </Theme>
        );
        render(
          <Theme {...({ columnGap: '1rem' } as unknown as ThemeProps)}>
            <div>Test</div>
          </Theme>
        );
      } finally {
        process.env.NODE_ENV = previous;
      }

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('ignores an empty string and a value that is no step, as the helper does', () => {
      const { container } = render(
        <>
          <Theme {...({ columnGap: '' } as unknown as ThemeProps)}>
            <div>Test</div>
          </Theme>
          <Theme {...({ columnGap: 9 } as unknown as ThemeProps)}>
            <div>Test</div>
          </Theme>
          <Theme isRoot {...({ columnGap: null } as unknown as ThemeProps)}>
            <div>Test</div>
          </Theme>
        </>
      );

      for (const themeDiv of Array.from(container.children)) {
        expect(themeDiv.className).toBe('');
        expect(
          (themeDiv as HTMLElement).style.getPropertyValue('--bulma-column-gap')
        ).toBe('');
      }
      expect(document.getElementById('bestax-bulma-theme-vars')).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    // `gap` and `rowGap` mint no Theme variable, so they were always plain
    // props there and are the helpers now, like every other helper prop.
    it('takes the other gap helpers as classes', () => {
      const { container } = render(
        <Theme gap="1" rowGap="2" gapless>
          <div>Test</div>
        </Theme>
      );

      expect(container.firstChild).toHaveClass('is-gap-1', 'is-row-gap-2');
    });
  });

  it('skips invalid CSS variable keys when building the local style object', () => {
    // Inject a non-Bulma key via bulmaVars; the local-style branch's
    // `bulmaCssVars.includes(key) && value` guard should drop it.
    const vars = {
      '--bulma-scheme-h': '50',
      // Deliberately invalid key — exercises the `false &&` path.
      '--not-a-bulma-var': 'oops',
    } as Record<string, string>;
    const { container } = render(
      <Theme bulmaVars={vars}>
        <div>Test</div>
      </Theme>
    );

    const themeDiv = container.firstChild as HTMLElement;
    // Valid var applied.
    expect(themeDiv.style.getPropertyValue('--bulma-scheme-h')).toBe('50');
    // Invalid var skipped.
    expect(themeDiv.style.getPropertyValue('--not-a-bulma-var')).toBe('');
  });

  // Bulma declares variables like `--bulma-delete-dimensions` on the component
  // itself, and an element's own declaration beats anything it inherits, so a
  // Theme setting one changes nothing on the page. The keys stay accepted (a
  // breaking change otherwise), and say so in development instead.
  describe('variables Bulma declares on the component (#1021)', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      resetDevWarnings();
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('still writes the variable, and warns naming it and where to set it', () => {
      const { container } = render(
        <Theme bulmaVars={{ '--bulma-delete-dimensions': '2.5rem' }}>
          <div>Test</div>
        </Theme>
      );

      const themeDiv = container.firstChild as HTMLElement;
      expect(themeDiv.style.getPropertyValue('--bulma-delete-dimensions')).toBe(
        '2.5rem'
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0][0] as string;
      expect(message).toContain('--bulma-delete-dimensions');
      expect(message).toContain('on the component itself');
      expect(message).toContain('never reaches it.');
      expect(message).toContain('Set it on that component instead');
      expect(message).toContain('className or style');
    });

    it('names every such variable at once, sorted, under isRoot too', () => {
      render(
        <Theme
          isRoot
          bulmaVars={{
            '--bulma-radius': '6px',
            '--bulma-tag-radius': '0',
            '--bulma-card-radius': '0',
          }}
        >
          <div>Test</div>
        </Theme>
      );

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0][0] as string;
      expect(message).toContain('--bulma-card-radius, --bulma-tag-radius on');
      expect(message).toContain('never reaches them.');
      // `--bulma-radius` is declared on `:root`, so Theme does reach it.
      expect(message).not.toContain('--bulma-radius,');
    });

    it('warns for a variable prop that sets one too', () => {
      render(
        <Theme {...({ cardRadius: '0' } as unknown as ThemeProps)}>
          <div>Test</div>
        </Theme>
      );

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('--bulma-card-radius');
    });

    it('warns once per set of variables, however often it renders', () => {
      const vars = { '--bulma-box-radius': '0' } as const;
      const { rerender } = render(
        <Theme bulmaVars={vars}>
          <div>Test</div>
        </Theme>
      );
      rerender(
        <Theme bulmaVars={{ ...vars }}>
          <div>Again</div>
        </Theme>
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);

      // A different set is a different mistake, so it is reported too.
      rerender(
        <Theme bulmaVars={{ ...vars, '--bulma-box-padding': '0' }}>
          <div>More</div>
        </Theme>
      );
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it('stays quiet for global variables and for empty values', () => {
      render(
        <Theme
          primaryH="200"
          bulmaVars={{
            '--bulma-radius': '6px',
            '--bulma-skeleton-radius': '0',
            '--bulma-grid-cell-column-start': '2',
            '--bulma-delete-dimensions': '',
          }}
        >
          <div>Test</div>
        </Theme>
      );

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  // A root Theme renders no wrapper, so className and the helper props have
  // nowhere to go. Silence would read as the props working, so it warns.
  describe('isRoot with props meant for the wrapper', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      resetDevWarnings();
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('drops className and helper props, names them, and warns once', () => {
      const { container, rerender } = render(
        <Theme
          isRoot
          className="brand"
          m="4"
          shadow="shadowless"
          primaryH="200"
        >
          <span data-testid="child">Test</span>
        </Theme>
      );
      rerender(
        <Theme
          isRoot
          className="brand"
          m="4"
          shadow="shadowless"
          primaryH="200"
        >
          <span data-testid="child">Test</span>
        </Theme>
      );

      // Rendering is unchanged: no wrapper, no classes, variables at :root.
      expect(container.innerHTML).toBe('<span data-testid="child">Test</span>');
      expect(
        document.getElementById('bestax-bulma-theme-vars')?.textContent
      ).toContain('--bulma-primary-h: 200;');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '<Theme isRoot>: a root Theme renders no wrapper element, so ' +
            'className, m, shadow have nothing to apply to.'
        )
      );
    });

    it('uses the singular for one dropped prop', () => {
      render(
        <Theme isRoot className="brand">
          <div>Test</div>
        </Theme>
      );

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('so className has nothing to apply to')
      );
    });

    it('ignores helper props that are off or unset', () => {
      render(
        <Theme
          isRoot
          className=""
          m={undefined}
          clearfix={false}
          {...({ p: null } as unknown as ThemeProps)}
        >
          <div>Test</div>
        </Theme>
      );

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('does not warn on a scoped Theme, which applies them to its wrapper', () => {
      const { container } = render(
        <Theme className="brand" m="4">
          <div>Test</div>
        </Theme>
      );

      expect(container.firstChild).toHaveClass('brand', 'm-4');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('does not warn in production', () => {
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        render(
          <Theme isRoot className="brand" m="4">
            <div>Test</div>
          </Theme>
        );
      } finally {
        process.env.NODE_ENV = previous;
      }

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('several isRoot Themes (#736)', () => {
    const rootCss = () =>
      document.getElementById('bestax-bulma-theme-vars')?.textContent;

    it('applies every root Theme, each as its own :root block', () => {
      render(
        <>
          <Theme isRoot primaryH="350">
            <span />
          </Theme>
          <Theme isRoot bulmaVars={{ '--bulma-radius': '12px' }}>
            <span />
          </Theme>
        </>
      );

      expect(rootCss()).toBe(
        ':root { --bulma-primary-h: 350; }\n' +
          ':root { --bulma-radius: 12px; }'
      );
      expect(
        document.querySelectorAll('#bestax-bulma-theme-vars')
      ).toHaveLength(1);
    });

    it('keeps the other Theme when one unmounts (the issue reproduction)', () => {
      function App() {
        const [rounded, setRounded] = useState(true);
        return (
          <Theme isRoot primaryH="350" primaryS="73%" primaryL="44%">
            {rounded && (
              <Theme isRoot bulmaVars={{ '--bulma-radius': '12px' }}>
                <span />
              </Theme>
            )}
            <button onClick={() => setRounded(false)}>drop</button>
          </Theme>
        );
      }

      render(<App />);
      expect(rootCss()).toContain('--bulma-radius: 12px;');
      expect(rootCss()).toContain('--bulma-primary-h: 350;');

      fireEvent.click(screen.getByText('drop'));

      expect(rootCss()).toBe(
        ':root { --bulma-primary-h: 350; --bulma-primary-s: 73%; ' +
          '--bulma-primary-l: 44%; }'
      );
    });

    it('removes the element only when the last root Theme unmounts', () => {
      const first = render(
        <Theme isRoot primaryH="10">
          <span />
        </Theme>
      );
      const second = render(
        <Theme isRoot primaryH="20">
          <span />
        </Theme>
      );

      first.unmount();
      expect(rootCss()).toBe(':root { --bulma-primary-h: 20; }');

      second.unmount();
      expect(document.getElementById('bestax-bulma-theme-vars')).toBeNull();
    });

    it('lets an inner root Theme win over the one around it', () => {
      render(
        <Theme isRoot primaryH="1">
          <Theme isRoot primaryH="2">
            <span />
          </Theme>
        </Theme>
      );

      // Later in the stylesheet wins a variable both set, so the inner
      // Theme's block must come second even though React runs its effects
      // first.
      expect(rootCss()).toBe(
        ':root { --bulma-primary-h: 1; }\n:root { --bulma-primary-h: 2; }'
      );
    });

    it('lets a later-mounted root Theme win, and keeps that on update', () => {
      function App({ hue }: { hue: string }) {
        const [late, setLate] = useState(false);
        return (
          <>
            <Theme isRoot primaryH={hue}>
              <span />
            </Theme>
            {late && (
              <Theme isRoot primaryH="200">
                <span />
              </Theme>
            )}
            <button onClick={() => setLate(true)}>mount</button>
          </>
        );
      }

      const { rerender } = render(<App hue="100" />);
      fireEvent.click(screen.getByText('mount'));
      expect(rootCss()).toBe(
        ':root { --bulma-primary-h: 100; }\n:root { --bulma-primary-h: 200; }'
      );

      // Updating the earlier Theme rewrites its own block in place. It does
      // not move to the end, which would flip which Theme wins.
      rerender(<App hue="150" />);
      expect(rootCss()).toBe(
        ':root { --bulma-primary-h: 150; }\n:root { --bulma-primary-h: 200; }'
      );
    });

    it('rewrites the same element on update rather than replacing it', () => {
      const { rerender } = render(
        <Theme isRoot primaryH="10">
          <span />
        </Theme>
      );
      const element = document.getElementById('bestax-bulma-theme-vars');

      rerender(
        <Theme isRoot primaryH="30">
          <span />
        </Theme>
      );

      expect(document.getElementById('bestax-bulma-theme-vars')).toBe(element);
      expect(rootCss()).toBe(':root { --bulma-primary-h: 30; }');
    });

    it('withdraws a Theme whose isRoot is cleared', () => {
      const { rerender } = render(
        <>
          <Theme isRoot primaryH="10">
            <span />
          </Theme>
          <Theme isRoot primaryH="20">
            <span />
          </Theme>
        </>
      );

      rerender(
        <>
          <Theme isRoot primaryH="10">
            <span />
          </Theme>
          <Theme primaryH="20">
            <span />
          </Theme>
        </>
      );

      expect(rootCss()).toBe(':root { --bulma-primary-h: 10; }');
    });

    it('writes each Theme once under StrictMode', () => {
      const { unmount } = render(
        <StrictMode>
          <Theme isRoot primaryH="1">
            <Theme isRoot primaryH="2">
              <span />
            </Theme>
          </Theme>
          <Theme isRoot primaryH="3">
            <span />
          </Theme>
        </StrictMode>
      );

      expect(rootCss()).toBe(
        ':root { --bulma-primary-h: 1; }\n' +
          ':root { --bulma-primary-h: 2; }\n' +
          ':root { --bulma-primary-h: 3; }'
      );
      expect(
        document.querySelectorAll('#bestax-bulma-theme-vars')
      ).toHaveLength(1);

      unmount();
      expect(document.getElementById('bestax-bulma-theme-vars')).toBeNull();
    });

    it('leaves an existing element alone when a root Theme has no variables', () => {
      const preExisting = document.createElement('style');
      preExisting.id = 'bestax-bulma-theme-vars';
      preExisting.textContent = ':root { --bulma-primary-h: 5; }';
      document.head.appendChild(preExisting);

      const { unmount } = render(
        <Theme isRoot>
          <span />
        </Theme>
      );
      unmount();

      expect(document.getElementById('bestax-bulma-theme-vars')).toBe(
        preExisting
      );
      expect(preExisting.textContent).toBe(':root { --bulma-primary-h: 5; }');
      preExisting.remove();
    });
  });

  describe('colorMode', () => {
    afterEach(() => {
      // Unmount first: a Theme restores the attributes it found when it
      // unmounts, and the automatic cleanup runs after this hook.
      cleanup();
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.removeAttribute('data-bestax-theme');
    });

    /** Every theme attribute on the document root, as `name=value`. */
    const themeAttributes = () =>
      Array.from(document.documentElement.attributes)
        .filter(attr => attr.name.endsWith('theme'))
        .map(attr => `${attr.name}=${attr.value}`)
        .sort();

    it('writes only data-theme when no class prefix is configured', () => {
      render(
        <Theme colorMode="dark">
          <div>Test</div>
        </Theme>
      );
      expect(themeAttributes()).toEqual(['data-theme=dark']);
    });

    it.each(['light', 'dark'] as const)(
      'writes the prefixed attribute as well under a class prefix (%s)',
      colorMode => {
        render(
          <ConfigProvider classPrefix="bestax-">
            <Theme colorMode={colorMode}>
              <div>Test</div>
            </Theme>
          </ConfigProvider>
        );
        expect(themeAttributes()).toEqual([
          `data-bestax-theme=${colorMode}`,
          `data-theme=${colorMode}`,
        ]);
      }
    );

    it('writes the prefixed attribute from a root Theme too', () => {
      render(
        <ConfigProvider classPrefix="bestax-">
          <Theme isRoot colorMode="dark">
            <div>Test</div>
          </Theme>
        </ConfigProvider>
      );
      expect(themeAttributes()).toEqual([
        'data-bestax-theme=dark',
        'data-theme=dark',
      ]);
    });

    it('removes both attributes for "system" under a class prefix', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-bestax-theme', 'dark');
      render(
        <ConfigProvider classPrefix="bestax-">
          <Theme colorMode="system">
            <div>Test</div>
          </Theme>
        </ConfigProvider>
      );
      expect(themeAttributes()).toEqual([]);
    });

    it('restores each attribute on unmount under a class prefix', () => {
      document.documentElement.setAttribute('data-bestax-theme', 'light');
      const { unmount } = render(
        <ConfigProvider classPrefix="bestax-">
          <Theme colorMode="dark">
            <div>Test</div>
          </Theme>
        </ConfigProvider>
      );
      expect(themeAttributes()).toEqual([
        'data-bestax-theme=dark',
        'data-theme=dark',
      ]);
      unmount();
      expect(themeAttributes()).toEqual(['data-bestax-theme=light']);
    });

    it('still writes data-theme when the prefix makes no valid attribute name', () => {
      // A slash is fine in a class name and refused in an attribute name.
      resetDevWarnings();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { unmount } = render(
        <ConfigProvider classPrefix="md/">
          <Theme colorMode="dark">
            <div>Test</div>
          </Theme>
        </ConfigProvider>
      );
      expect(themeAttributes()).toEqual(['data-theme=dark']);
      // The prefixed sheet's scheme does not change, so say so rather than
      // fail quietly.
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('data-md/theme');
      unmount();
      expect(themeAttributes()).toEqual([]);
      warnSpy.mockRestore();
    });

    it('sets data-theme="dark" on the document root', () => {
      render(
        <Theme colorMode="dark">
          <div>Test</div>
        </Theme>
      );
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('sets data-theme="light" on the document root', () => {
      render(
        <Theme colorMode="light">
          <div>Test</div>
        </Theme>
      );
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('removes data-theme for "system"', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      render(
        <Theme colorMode="system">
          <div>Test</div>
        </Theme>
      );
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    });

    it('leaves data-theme untouched when colorMode is omitted', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      render(
        <Theme>
          <div>Test</div>
        </Theme>
      );
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('restores the previous data-theme on unmount', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      const { unmount } = render(
        <Theme colorMode="dark">
          <div>Test</div>
        </Theme>
      );
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      unmount();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });
});
