import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Theme } from '../Theme';

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

  describe('colorMode', () => {
    afterEach(() => {
      document.documentElement.removeAttribute('data-theme');
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
