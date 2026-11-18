import { act, render, screen } from '@testing-library/react';
import { passFocusOn, useFocusOrigin } from '../focusHandOff';

describe('passFocusOn', () => {
  // A stack of one, with focus on a button inside it.
  const mountClosing = () => {
    const closing = document.createElement('div');
    const inside = document.createElement('button');
    inside.textContent = 'Close';
    closing.appendChild(inside);
    document.body.appendChild(closing);
    inside.focus();
    return closing;
  };

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('gives focus back to an origin that took it only for a while, without a tab stop', () => {
    // Focus went into the stack from an element that held it only with a
    // tabindex of its own, as a toast the hotkey focused does, and lost the
    // tabindex when focus left it.
    const origin = document.createElement('div');
    document.body.appendChild(origin);
    const closing = mountClosing();
    passFocusOn({
      id: 'one',
      closing,
      showing: () => [],
      elements: () => [['one', closing]],
      pick: () => null,
      origin,
    });
    expect(document.activeElement).toBe(origin);
    expect(origin).toHaveAttribute('tabindex', '-1');
    origin.blur();
    expect(origin).not.toHaveAttribute('tabindex');
  });

  it('gives focus back to an origin that takes it on its own without touching its tabindex', () => {
    const origin = document.createElement('button');
    document.body.appendChild(origin);
    const closing = mountClosing();
    passFocusOn({
      id: 'one',
      closing,
      showing: () => [],
      elements: () => [['one', closing]],
      pick: () => null,
      origin,
    });
    expect(document.activeElement).toBe(origin);
    expect(origin).not.toHaveAttribute('tabindex');
  });
});

describe('useFocusOrigin', () => {
  const Origin = ({
    onOrigin,
  }: {
    onOrigin: (el: HTMLElement | null) => void;
  }) => {
    const originRef = useFocusOrigin(() => false);
    return (
      <button onClick={() => onOrigin(originRef.current)}>Read origin</button>
    );
  };

  it('starts from focus that is already outside when it mounts', () => {
    const { rerender } = render(<input aria-label="Name" />);
    const field = screen.getByRole('textbox', { name: 'Name' });
    act(() => {
      field.focus();
    });
    let origin: HTMLElement | null = null;
    rerender(
      <>
        <input aria-label="Name" />
        <Origin onOrigin={el => (origin = el)} />
      </>
    );
    act(() => {
      screen.getByRole('button', { name: 'Read origin' }).click();
    });
    expect(origin).toBe(field);
  });

  it('starts from nothing when the page itself has focus', () => {
    let origin: HTMLElement | null = null;
    render(<Origin onOrigin={el => (origin = el)} />);
    act(() => {
      screen.getByRole('button', { name: 'Read origin' }).click();
    });
    expect(origin).toBeNull();
  });
});
