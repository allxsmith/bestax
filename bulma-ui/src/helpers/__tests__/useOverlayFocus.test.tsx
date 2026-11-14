import { renderHook } from '@testing-library/react';
import { useOverlayFocus } from '../useOverlayFocus';

/** An overlay with a button in it, and an opener beside it, in `doc`. */
function setUp(doc: Document) {
  const opener = doc.createElement('button');
  const overlay = doc.createElement('div');
  overlay.tabIndex = -1;
  const inside = doc.createElement('button');
  overlay.appendChild(inside);
  doc.body.append(opener, overlay);
  return { opener, overlay, inside };
}

describe('useOverlayFocus', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('moves focus in as it opens and back to the opener as it closes', () => {
    const { opener, overlay, inside } = setUp(document);
    opener.focus();
    const { rerender } = renderHook(
      ({ open }) =>
        useOverlayFocus({ current: overlay }, open, { modal: true }),
      { initialProps: { open: true } }
    );
    expect(inside).toHaveFocus();
    rerender({ open: false });
    expect(opener).toHaveFocus();
  });

  it('reads the opener in the overlay’s own document, an iframe’s', () => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const doc = frame.contentDocument as Document;
    const { opener, overlay, inside } = setUp(doc);
    opener.focus();
    const ref = { current: overlay };
    const { rerender } = renderHook(
      ({ open }) => useOverlayFocus(ref, open, { modal: true }),
      { initialProps: { open: true } }
    );
    expect(doc.activeElement).toBe(inside);
    rerender({ open: false });
    expect(doc.activeElement).toBe(opener);
  });

  it('hands focus back when it was dropped to the overlay document’s body', () => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const doc = frame.contentDocument as Document;
    const { opener, overlay, inside } = setUp(doc);
    opener.focus();
    const ref = { current: overlay };
    const { rerender } = renderHook(
      ({ open }) => useOverlayFocus(ref, open, { modal: true }),
      { initialProps: { open: true } }
    );
    inside.blur();
    expect(doc.activeElement).toBe(doc.body);
    rerender({ open: false });
    expect(doc.activeElement).toBe(opener);
  });

  it('takes no opener from inside the overlay, as an autoFocus there would leave it', () => {
    const { opener, overlay, inside } = setUp(document);
    opener.focus();
    // Focus already inside as the overlay opens.
    inside.focus();
    const { rerender } = renderHook(
      ({ open }) =>
        useOverlayFocus({ current: overlay }, open, { modal: true }),
      { initialProps: { open: true } }
    );
    rerender({ open: false });
    expect(inside).toHaveFocus();
    expect(opener).not.toHaveFocus();
  });

  it('leaves focus where it is when restore says no', () => {
    const { opener, overlay, inside } = setUp(document);
    opener.focus();
    const { rerender } = renderHook(
      ({ open }) =>
        useOverlayFocus({ current: overlay }, open, {
          modal: true,
          restore: () => false,
        }),
      { initialProps: { open: true } }
    );
    rerender({ open: false });
    expect(inside).toHaveFocus();
  });
});
