import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { Pre, type PreProps } from '../Pre';
import { ConfigProvider } from '../../helpers/Config';

describe('Pre Component', () => {
  test('renders children content', () => {
    render(<Pre>Preformatted text</Pre>);
    expect(screen.getByText('Preformatted text')).toBeInTheDocument();
  });

  test('renders as pre element', () => {
    render(<Pre data-testid="pre">Test</Pre>);
    const pre = screen.getByTestId('pre');
    expect(pre.tagName).toBe('PRE');
  });

  test('applies custom className', () => {
    render(<Pre className="custom-class">Test</Pre>);
    expect(screen.getByText('Test')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  test('applies textColor class', () => {
    render(<Pre textColor="primary">Test</Pre>);
    expect(screen.getByText('Test')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  test('applies bgColor class', () => {
    render(<Pre bgColor="light">Test</Pre>);
    expect(screen.getByText('Test')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  test('applies Bulma helper classes', () => {
    render(
      <Pre m="3" p="4" textSize="5" data-testid="pre">
        Test
      </Pre>
    );
    const pre = screen.getByTestId('pre');
    expect(pre).toHaveClass('m-3', { exact: false });
    expect(pre).toHaveClass('p-4', { exact: false });
    expect(pre).toHaveClass('is-size-5', { exact: false });
  });

  test('passes HTML attributes to pre', () => {
    render(
      <Pre id="pre-id" data-testid="pre" aria-label="Pre" title="Pre title">
        Test
      </Pre>
    );
    const pre = screen.getByTestId('pre');
    expect(pre).toHaveAttribute('id', 'pre-id');
    expect(pre).toHaveAttribute('aria-label', 'Pre');
    expect(pre).toHaveAttribute('title', 'Pre title');
  });

  test('does not pass non-HTML props to pre', () => {
    render(
      <Pre textColor="primary" bgColor="light" m="3" data-testid="pre">
        Test
      </Pre>
    );
    const pre = screen.getByTestId('pre');
    expect(pre).not.toHaveAttribute('textColor');
    expect(pre).not.toHaveAttribute('bgColor');
    expect(pre).not.toHaveAttribute('m');
  });

  test('renders without className when no classes are applied', () => {
    render(<Pre data-testid="pre">Plain Pre</Pre>);
    const pre = screen.getByTestId('pre');
    expect(pre.getAttribute('class')).toBeNull();
  });

  test('combines multiple color-related classes', () => {
    render(
      <Pre textColor="white" bgColor="dark">
        Styled Pre
      </Pre>
    );
    const pre = screen.getByText('Styled Pre');
    expect(pre).toHaveClass('has-text-white', { exact: false });
    expect(pre).toHaveClass('has-background-dark', { exact: false });
  });

  test('preserves whitespace and formatting', () => {
    const multilineContent = `line 1
line 2
  indented line`;
    render(<Pre data-testid="pre">{multilineContent}</Pre>);
    expect(screen.getByTestId('pre').textContent).toBe(multilineContent);
  });

  test('preserves multiple spaces', () => {
    const spacedContent = 'word    word';
    render(<Pre data-testid="pre">{spacedContent}</Pre>);
    expect(screen.getByTestId('pre').textContent).toBe('word    word');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Pre m="2" p="3">
            Test Pre
          </Pre>
        </ConfigProvider>
      );
      const pre = screen.getByText('Test Pre');
      expect(pre).toHaveClass('bulma-m-2');
      expect(pre).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      render(
        <Pre m="4" textAlign="centered">
          Standard Pre
        </Pre>
      );
      const pre = screen.getByText('Standard Pre');
      expect(pre).toHaveClass('m-4');
      expect(pre).toHaveClass('has-text-centered');
    });

    it('uses default classes when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Pre m="2">Test</Pre>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('m-2');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Pre p="3">Test</Pre>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('p-3');
    });
  });
});

describe('a Pre that overflows, from the keyboard (#1854)', () => {
  // jsdom lays nothing out, so a <pre>'s widths and heights come from `sizes`,
  // which each test sets before it renders or before it scrolls.
  const sizes = {
    scrollWidth: 200,
    clientWidth: 200,
    scrollHeight: 50,
    clientHeight: 50,
  };
  type Size = keyof typeof sizes;
  const saved = new Map<Size, PropertyDescriptor | undefined>();

  beforeAll(() => {
    for (const key of Object.keys(sizes) as Size[]) {
      saved.set(
        key,
        Object.getOwnPropertyDescriptor(HTMLElement.prototype, key)
      );
      Object.defineProperty(HTMLElement.prototype, key, {
        configurable: true,
        get(this: HTMLElement) {
          return this.tagName === 'PRE' ? sizes[key] : 0;
        },
      });
    }
  });

  afterAll(() => {
    for (const [key, descriptor] of saved) {
      if (descriptor)
        Object.defineProperty(HTMLElement.prototype, key, descriptor);
      else
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
          key
        ];
    }
  });

  const fit = () =>
    Object.assign(sizes, {
      scrollWidth: 200,
      clientWidth: 200,
      scrollHeight: 50,
      clientHeight: 50,
    });
  const overflowSideways = () =>
    Object.assign(sizes, { scrollWidth: 600, clientWidth: 200 });
  const overflowDown = () =>
    Object.assign(sizes, { scrollHeight: 400, clientHeight: 50 });

  beforeEach(fit);

  it('is a tab stop while a line runs past its edge', () => {
    overflowSideways();
    render(<Pre data-testid="pre">npm install a-very-long-package-name</Pre>);
    const pre = screen.getByTestId('pre');
    expect(pre).toHaveAttribute('tabindex', '0');
    // No name, so no region: the plain focusable scroller other browsers make.
    expect(pre).not.toHaveAttribute('role');
  });

  it('is one while it overflows downward too, under a height of its own', () => {
    overflowDown();
    render(<Pre data-testid="pre">lots of lines</Pre>);
    expect(screen.getByTestId('pre')).toHaveAttribute('tabindex', '0');
  });

  it('takes its name from its own aria-label or aria-labelledby', () => {
    overflowSideways();
    render(
      <>
        <Pre aria-label="Install command">npm install</Pre>
        <h3 id="config">The config file</h3>
        <Pre aria-labelledby="config">{'{ "a": 1 }'}</Pre>
      </>
    );
    expect(
      screen.getByRole('region', { name: 'Install command' })
    ).toHaveAttribute('tabindex', '0');
    expect(
      screen.getByRole('region', { name: 'The config file' })
    ).toHaveAttribute('tabindex', '0');
  });

  it('stays a plain pre with no tab stop while it fits, keeping its name', () => {
    render(
      <Pre data-testid="pre" aria-label="Install command">
        npm install
      </Pre>
    );
    const pre = screen.getByTestId('pre');
    expect(pre).not.toHaveAttribute('tabindex');
    expect(pre).not.toHaveAttribute('role');
    expect(pre).toHaveAttribute('aria-label', 'Install command');
  });

  it('passes a ref given as a prop, as React 19 gives one, to the pre', () => {
    overflowSideways();
    const ref = createRef<HTMLPreElement>();
    // Called as a function, so `ref` arrives as a prop on React 18 as well,
    // where JSX would hold it back.
    const props = { ref, children: 'npm install' } as PreProps;
    const Host = () => Pre(props);
    render(<Host />);
    expect(ref.current?.tagName).toBe('PRE');
  });

  it('keeps the tab stop while it has focus, and drops it once focus leaves', () => {
    overflowSideways();
    render(<Pre data-testid="pre">npm install a-very-long-package-name</Pre>);
    const pre = screen.getByTestId('pre');
    act(() => pre.focus());
    fit();
    fireEvent.scroll(pre);
    expect(pre).toHaveAttribute('tabindex', '0');
    expect(pre).toHaveFocus();
    act(() => pre.blur());
    expect(pre).not.toHaveAttribute('tabindex');
    expect(pre).not.toHaveAttribute('role');
  });

  it('lets a role and a tabIndex the caller passes win', () => {
    overflowSideways();
    render(
      <Pre data-testid="pre" role="figure" tabIndex={-1}>
        npm install a-very-long-package-name
      </Pre>
    );
    const pre = screen.getByTestId('pre');
    expect(pre).toHaveAttribute('role', 'figure');
    expect(pre).toHaveAttribute('tabindex', '-1');
  });

  it('still calls the caller’s scroll, focus and blur handlers', () => {
    overflowSideways();
    const onScroll = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <Pre
        data-testid="pre"
        onScroll={onScroll}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        npm install a-very-long-package-name
      </Pre>
    );
    const pre = screen.getByTestId('pre');
    fireEvent.scroll(pre);
    act(() => pre.focus());
    act(() => pre.blur());
    expect(onScroll).toHaveBeenCalledTimes(1);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('renders a plain pre on the server', () => {
    overflowSideways();
    const html = renderToString(<Pre>npm install</Pre>);
    expect(html).toBe('<pre>npm install</pre>');
  });
});
