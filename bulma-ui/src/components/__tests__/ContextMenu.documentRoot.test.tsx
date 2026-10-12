/**
 * ContextMenu rendered somewhere other than the page's own document: inside
 * a shadow root, and inside an iframe. A listener on a document reads an
 * event from inside a shadow root with its target set to the host, and
 * `document.activeElement` names the host rather than what has focus, so
 * outside presses and handing focus back have to see through it. An iframe
 * has a document and a window of its own, where its presses, scrolling and
 * focus happen.
 */
import { useState } from 'react';
import { act, fireEvent, render, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContextMenu } from '../ContextMenu';
import { ConfigProvider } from '../../helpers/Config';

/** A press, from the element's own window, which jsdom has no PointerEvent in. */
const press = (
  el: Element,
  { pointerType = 'mouse', pointerId = 1, type = 'pointerdown' } = {}
) => {
  const view = el.ownerDocument.defaultView as typeof window;
  const event = new view.MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
  });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  fireEvent(el, event);
};

const FileMenu = () => (
  <ContextMenu
    aria-label="Actions for report.pdf"
    trigger={
      <div data-region>
        report.pdf <button>Details</button>
      </div>
    }
  >
    <ContextMenu.Item as="button">Rename</ContextMenu.Item>
    <ContextMenu.Item as="button">Delete</ContextMenu.Item>
  </ContextMenu>
);

describe('ContextMenu in a shadow root', () => {
  let host: HTMLDivElement;
  let shadow: ShadowRoot;
  let mount: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });
    mount = document.createElement('div');
    shadow.appendChild(mount);
  });

  afterEach(() => {
    host.remove();
  });

  const details = () =>
    mount.querySelector('[data-region] button') as HTMLButtonElement;

  it('portals into a portalContainer inside it, and closes on a press outside', () => {
    const InShadow = () => {
      const [target, setTarget] = useState<HTMLElement | null>(null);
      return (
        <>
          <div data-overlays ref={setTarget} />
          {target && (
            <ConfigProvider portalContainer={target}>
              <FileMenu />
              <p>Elsewhere</p>
            </ConfigProvider>
          )}
        </>
      );
    };
    render(<InShadow />, { container: mount, baseElement: mount });
    details().focus();
    fireEvent.contextMenu(details());
    const menu = within(mount).getByRole('menu');
    expect(menu.parentElement?.parentElement).toBe(
      mount.querySelector('[data-overlays]')
    );
    expect(within(menu).getByRole('menuitem', { name: 'Rename' })).toBe(
      shadow.activeElement
    );

    // From inside the menu, the document sees the host; the path sees the menu.
    press(within(menu).getByRole('menuitem', { name: 'Delete' }));
    expect(within(mount).queryByRole('menu')).toBeInTheDocument();

    press(within(mount).getByText('Elsewhere'));
    expect(within(mount).queryByRole('menu')).toBeNull();
    expect(shadow.activeElement).toBe(details());
  });

  it('hands focus back inside it on Escape from a menu portaled to the page', () => {
    render(<FileMenu />, { container: mount, baseElement: mount });
    details().focus();
    fireEvent.contextMenu(details());
    const menu = within(document.body).getByRole('menu');
    expect(menu.parentElement?.parentElement).toBe(document.body);
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(within(document.body).queryByRole('menu')).toBeNull();
    expect(shadow.activeElement).toBe(details());
  });
});

describe('ContextMenu in an iframe', () => {
  let iframe: HTMLIFrameElement;
  let frameDoc: Document;
  let mount: HTMLDivElement;

  beforeEach(() => {
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    frameDoc = iframe.contentDocument!;
    mount = frameDoc.createElement('div');
    frameDoc.body.appendChild(mount);
  });

  afterEach(() => {
    iframe.remove();
  });

  const details = () =>
    mount.querySelector('[data-region] button') as HTMLButtonElement;
  const frameMenu = () => frameDoc.querySelector('[role="menu"]');

  it('portals into the iframe’s own body, and closes on a press there, handing focus back', () => {
    render(
      <>
        <FileMenu />
        <p>Elsewhere</p>
      </>,
      { container: mount, baseElement: frameDoc.body }
    );
    details().focus();
    fireEvent.contextMenu(details());
    expect(frameMenu()?.parentElement?.parentElement).toBe(frameDoc.body);
    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(frameDoc.activeElement).toHaveTextContent('Rename');

    press(within(frameDoc.body).getByText('Elsewhere'));
    expect(frameMenu()).toBeNull();
    expect(frameDoc.activeElement).toBe(details());
  });

  it('cancels a long press for a second finger in the iframe, not on the page around it', () => {
    jest.useFakeTimers();
    try {
      render(
        <>
          <FileMenu />
          <p>Elsewhere</p>
        </>,
        { container: mount, baseElement: frameDoc.body }
      );
      const region = mount.querySelector('[data-region]')!;
      press(region, { pointerType: 'touch' });
      press(document.body, { pointerType: 'touch', pointerId: 2 });
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(frameMenu()).toBeInTheDocument();
      fireEvent.keyDown(frameDoc.activeElement!, { key: 'Escape' });
      press(region, { pointerType: 'touch', type: 'pointerup' });

      press(region, { pointerType: 'touch', pointerId: 3 });
      expect(jest.getTimerCount()).toBe(1);
      press(within(frameDoc.body).getByText('Elsewhere'), {
        pointerType: 'touch',
        pointerId: 4,
      });
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(frameMenu()).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('closes on the iframe’s scrolling, resizing and losing focus, not the page’s', () => {
    render(<FileMenu />, { container: mount, baseElement: frameDoc.body });
    const view = frameDoc.defaultView as typeof window;
    fireEvent.contextMenu(details());
    act(() => {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('blur'));
      document.dispatchEvent(new Event('scroll'));
    });
    expect(frameMenu()).toBeInTheDocument();

    for (const happen of [
      () => view.dispatchEvent(new view.Event('resize')),
      () => view.dispatchEvent(new view.Event('blur')),
      () => frameDoc.dispatchEvent(new view.Event('scroll')),
    ]) {
      fireEvent.contextMenu(details());
      expect(frameMenu()).toBeInTheDocument();
      act(happen);
      expect(frameMenu()).toBeNull();
    }
  });
});
