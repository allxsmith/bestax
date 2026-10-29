import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ColorSwatch } from '../ColorSwatch';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  resetDevWarnings();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe('ColorSwatch', () => {
  it('is an image named by its label, showing its color', () => {
    render(<ColorSwatch color="#1e6b99" label="Brand blue" />);
    const swatch = screen.getByRole('img', { name: 'Brand blue' });
    expect(swatch.tagName).toBe('SPAN');
    expect(swatch).toHaveClass('color-swatch');
    expect(swatch.style.getPropertyValue('--color-swatch-color')).toBe(
      '#1e6b99'
    );
  });

  it('is named by its color as written without a label', () => {
    render(<ColorSwatch color="rgba(255, 0, 0, 0.4)" />);
    expect(
      screen.getByRole('img', { name: 'rgba(255, 0, 0, 0.4)' })
    ).toBeInTheDocument();
  });

  it('takes aria-label over label, and an empty label falls through', () => {
    const { rerender } = render(
      <ColorSwatch color="#000" label="Black" aria-label="Ink" />
    );
    expect(screen.getByRole('img')).toHaveAccessibleName('Ink');
    rerender(<ColorSwatch color="#000" label="" />);
    expect(screen.getByRole('img')).toHaveAccessibleName('#000');
  });

  it('keeps a role passed in from winning', () => {
    const props = { role: 'button' } as unknown as { color: string };
    render(<ColorSwatch {...props} color="#000" />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('adds size and shape classes, and ignores an unknown size', () => {
    const { container, rerender } = render(
      <ColorSwatch color="red" size="large" isRounded />
    );
    const swatch = container.firstChild as HTMLElement;
    expect(swatch).toHaveClass('color-swatch', 'is-large', 'is-rounded');
    rerender(
      <ColorSwatch
        color="red"
        size={'huge' as unknown as 'small'}
        className="extra"
      />
    );
    expect(swatch.className).toBe('color-swatch extra');
  });

  it('draws children on the swatch, hidden from assistive tech', () => {
    render(
      <ColorSwatch color="red" label="Red">
        <svg data-testid="icon" />
      </ColorSwatch>
    );
    const holder = screen.getByTestId('icon').parentElement as HTMLElement;
    expect(holder).toHaveAttribute('aria-hidden', 'true');
    expect(holder.parentElement).toHaveClass('color-swatch');
  });

  it('renders nothing inside without children', () => {
    const { container } = render(<ColorSwatch color="red" />);
    expect((container.firstChild as HTMLElement).childElementCount).toBe(0);
  });

  it('keeps its own style alongside the color', () => {
    render(<ColorSwatch color="red" label="Red" style={{ margin: 4 }} />);
    const swatch = screen.getByRole('img');
    expect(swatch.style.margin).toBe('4px');
    expect(swatch.style.getPropertyValue('--color-swatch-color')).toBe('red');
  });

  it('passes helper props and attributes through, and forwards the ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <ColorSwatch
        ref={ref}
        color="red"
        label="Red"
        textColor="white"
        m="2"
        data-testid="swatch"
      />
    );
    const swatch = screen.getByTestId('swatch');
    expect(ref.current).toBe(swatch);
    expect(swatch).toHaveClass('has-text-white', 'm-2');
  });

  describe('naming a CSS variable', () => {
    it('warns once when a var() has no name', () => {
      render(<ColorSwatch color="var(--bulma-primary)" />);
      render(<ColorSwatch color=" VAR(--bulma-link)" />);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('no label');
    });

    it.each([
      ['label', { label: 'Primary' }],
      ['aria-label', { 'aria-label': 'Primary' }],
      ['aria-labelledby', { 'aria-labelledby': 'x' }],
      ['aria-hidden', { 'aria-hidden': true }],
    ])('stays quiet with %s', (_, extra) => {
      render(<ColorSwatch color="var(--bulma-primary)" {...extra} />);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('stays quiet for a plain color', () => {
      render(<ColorSwatch color="#123" />);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  it('renders the same on the server', () => {
    expect(
      renderToString(<ColorSwatch color="#1e6b99" label="Brand" size="small" />)
    ).toBe(
      '<span class="color-swatch is-small" style="--color-swatch-color:#1e6b99" role="img" aria-label="Brand"></span>'
    );
  });

  it('prefixes its classes under ConfigProvider classPrefix', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <ColorSwatch color="red" size="small" isRounded />
      </ConfigProvider>
    );
    const swatch = container.firstChild as HTMLElement;
    expect(swatch).toHaveClass(
      'bestax-color-swatch',
      'bestax-is-small',
      'bestax-is-rounded'
    );
    expect(swatch).not.toHaveClass('color-swatch');
  });
});
