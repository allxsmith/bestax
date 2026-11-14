import { act, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { usePrefersReducedMotion } from '../usePrefersReducedMotion';

type Listener = (event: { matches: boolean }) => void;

/** A `matchMedia` answering the reduced-motion query, with its listeners. */
function mockMatchMedia(matches: boolean) {
  const listeners: Listener[] = [];
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn((_event: string, cb: Listener) => {
      listeners.push(cb);
    }),
    removeEventListener: vi.fn(),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql);
  return { mql, listeners };
}

function Probe() {
  return <p>{usePrefersReducedMotion() ? 'reduce' : 'motion'}</p>;
}

describe('usePrefersReducedMotion', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('is false on the server', () => {
    mockMatchMedia(true);
    expect(renderToStaticMarkup(<Probe />)).toBe('<p>motion</p>');
  });

  it('reads the media query once mounted', () => {
    mockMatchMedia(true);
    render(<Probe />);
    expect(window.matchMedia).toHaveBeenCalledWith(
      '(prefers-reduced-motion: reduce)'
    );
    expect(screen.getByText('reduce')).toBeInTheDocument();
  });

  it('follows a change to the preference', () => {
    const { listeners } = mockMatchMedia(false);
    render(<Probe />);
    expect(screen.getByText('motion')).toBeInTheDocument();

    act(() => listeners.forEach(listener => listener({ matches: true })));
    expect(screen.getByText('reduce')).toBeInTheDocument();
  });

  it('stops listening on unmount', () => {
    const { mql } = mockMatchMedia(false);
    const { unmount } = render(<Probe />);
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith(
      'change',
      mql.addEventListener.mock.calls[0][1]
    );
  });

  it('stays false where matchMedia is missing', () => {
    // @ts-expect-error -- an environment without matchMedia
    window.matchMedia = undefined;
    render(<Probe />);
    expect(screen.getByText('motion')).toBeInTheDocument();
  });
});
