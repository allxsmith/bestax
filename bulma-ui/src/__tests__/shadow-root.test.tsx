/**
 * Components rendered inside an open shadow root, the way a web component or
 * a sandboxed preview hosts them. Code outside the root reads an event from
 * inside it with its `target` set to the shadow host, and reads
 * `document.activeElement` as that host. Each case drives a component down a
 * path that asks one of those questions from `document`, where the answer used
 * to be the host.
 *
 * React's root sits inside the shadow root here, so React's own handlers see
 * the real targets, as they do for an app rendered into one. jest-dom's
 * `toHaveFocus` reads `document.activeElement`, which is the host for all of
 * these, so focus is read from the shadow root instead.
 */
import React, { useState } from 'react';
import { render, fireEvent, act, createEvent } from '@testing-library/react';
import { Dropdown } from '../components/Dropdown';
import { Taginput } from '../form/Taginput';
import { Toast } from '../components/Toast';
import { Carousel, CarouselItem } from '../components/Carousel';
import { Modal } from '../components/Modal';

let host: HTMLDivElement;
let shadowRoot: ShadowRoot;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  shadowRoot = host.attachShadow({ mode: 'open' });
});

afterEach(() => {
  host.remove();
});

const renderInShadowRoot = (ui: React.ReactElement) => {
  const container = document.createElement('div');
  shadowRoot.appendChild(container);
  return render(ui, { container, baseElement: container });
};

describe('Dropdown in a shadow root', () => {
  test('pressing an item keeps the menu open, so the click that follows runs it', () => {
    const onClick = jest.fn();
    const { getByRole, getByTestId } = renderInShadowRoot(
      <Dropdown label="Menu">
        <Dropdown.Item onClick={onClick}>Archive</Dropdown.Item>
      </Dropdown>
    );
    fireEvent.click(getByRole('button', { name: 'Menu' }));
    const item = getByRole('menuitem', { name: 'Archive' });

    // A browser hides the menu as soon as it closes, so a menu that closed on
    // the press would leave the click nothing to land on.
    fireEvent.mouseDown(item);
    expect(getByTestId('dropdown-root')).toHaveClass('is-active');

    fireEvent.click(item);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(getByTestId('dropdown-root')).not.toHaveClass('is-active');
  });

  test('a press outside the dropdown still closes it, in the shadow root or out of it', () => {
    const { getByRole, getByTestId } = renderInShadowRoot(
      <>
        <Dropdown label="Menu">
          <Dropdown.Item>Archive</Dropdown.Item>
        </Dropdown>
        <button type="button">Elsewhere</button>
      </>
    );
    const trigger = getByRole('button', { name: 'Menu' });

    fireEvent.click(trigger);
    fireEvent.mouseDown(getByRole('button', { name: 'Elsewhere' }));
    expect(getByTestId('dropdown-root')).not.toHaveClass('is-active');

    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(getByTestId('dropdown-root')).not.toHaveClass('is-active');
  });

  test('arrow keys move between items', () => {
    const { getByText, getByTestId } = renderInShadowRoot(
      <Dropdown label="Menu" active>
        <Dropdown.Item>First</Dropdown.Item>
        <Dropdown.Item>Second</Dropdown.Item>
        <Dropdown.Item>Third</Dropdown.Item>
      </Dropdown>
    );
    const menu = getByTestId('dropdown-menu');

    getByText('First').focus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(shadowRoot.activeElement).toBe(getByText('Second'));
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(shadowRoot.activeElement).toBe(getByText('Third'));
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(shadowRoot.activeElement).toBe(getByText('Second'));
  });

  test('Enter on an item runs it and hands focus back to the trigger', () => {
    const onClick = jest.fn();
    const { getByRole, getByText } = renderInShadowRoot(
      <Dropdown label="Menu" active>
        <Dropdown.Item onClick={onClick}>Archive</Dropdown.Item>
      </Dropdown>
    );
    const item = getByText('Archive');

    item.focus();
    fireEvent.keyDown(item, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(shadowRoot.activeElement).toBe(
      getByRole('button', { name: 'Menu' })
    );
  });
});

describe('Taginput in a shadow root', () => {
  test('pressing a suggestion keeps the list open, so the click that follows adds it', () => {
    const onChange = jest.fn();
    const { getByRole, queryByRole } = renderInShadowRoot(
      <Taginput data={['React', 'Vue']} onChange={onChange} />
    );
    fireEvent.change(getByRole('textbox'), { target: { value: 'r' } });
    const option = getByRole('option', { name: 'React' });

    fireEvent.mouseDown(option);
    expect(queryByRole('listbox')).toBeInTheDocument();

    fireEvent.click(option);
    expect(onChange).toHaveBeenCalledWith(['React']);
  });

  test('a press outside the input still closes the list', () => {
    const { getByRole, queryByRole } = renderInShadowRoot(
      <>
        <Taginput data={['React', 'Vue']} />
        <button type="button">Elsewhere</button>
      </>
    );
    fireEvent.change(getByRole('textbox'), { target: { value: 'r' } });
    expect(queryByRole('listbox')).toBeInTheDocument();

    fireEvent.mouseDown(getByRole('button', { name: 'Elsewhere' }));
    expect(queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('Toast in a shadow root', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // The click-outside listener attaches a frame after the toast shows.
  const attachListener = () =>
    act(() => {
      jest.runOnlyPendingTimers();
    });

  test('a click inside the toast is not a click outside it', () => {
    const onClose = jest.fn();
    // A caller's own `onClick` takes the place of the toast's dismiss on
    // click, so only the click-outside check decides whether this closes it.
    const { getByText } = renderInShadowRoot(
      <Toast
        inline
        message="Saved"
        duration={0}
        onClick={() => {}}
        onClose={onClose}
      />
    );
    attachListener();

    fireEvent.click(getByText('Saved'));
    expect(onClose).not.toHaveBeenCalled();
  });

  test('a click outside the toast still closes it', () => {
    const onClose = jest.fn();
    const { getByRole } = renderInShadowRoot(
      <>
        <Toast inline message="Saved" duration={0} onClose={onClose} />
        <button type="button">Elsewhere</button>
      </>
    );
    attachListener();

    fireEvent.click(getByRole('button', { name: 'Elsewhere' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Carousel in a shadow root', () => {
  const slides = [
    <CarouselItem key="1">Slide 1</CarouselItem>,
    <CarouselItem key="2">Slide 2</CarouselItem>,
    <CarouselItem key="3">Slide 3</CarouselItem>,
  ];

  test('arrow keys turn the slides while focus is inside it', () => {
    const onChange = jest.fn();
    const { getByLabelText } = renderInShadowRoot(
      <Carousel value={0} onChange={onChange}>
        {slides}
      </Carousel>
    );
    const next = getByLabelText('Next slide');

    next.focus();
    fireEvent.keyDown(next, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith(1);
  });

  test('arrow keys leave it alone while focus is elsewhere in the shadow root', () => {
    const onChange = jest.fn();
    const { getByRole } = renderInShadowRoot(
      <>
        <Carousel value={0} onChange={onChange}>
          {slides}
        </Carousel>
        <button type="button">Elsewhere</button>
      </>
    );
    const elsewhere = getByRole('button', { name: 'Elsewhere' });

    elsewhere.focus();
    fireEvent.keyDown(elsewhere, { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Modal in a shadow root', () => {
  test('Tab from a control in the middle is left to the browser', () => {
    const { getByText } = renderInShadowRoot(
      <Modal active>
        <button type="button">First</button>
        <button type="button">Middle</button>
        <button type="button">Last</button>
      </Modal>
    );
    const middle = getByText('Middle');

    middle.focus();
    const tab = createEvent.keyDown(middle, { key: 'Tab' });
    fireEvent(middle, tab);
    expect(tab.defaultPrevented).toBe(false);
    expect(shadowRoot.activeElement).toBe(middle);
  });

  test('Tab from the last control wraps to the first', () => {
    const { getByText } = renderInShadowRoot(
      <Modal active>
        <button type="button">First</button>
        <button type="button">Last</button>
      </Modal>
    );
    const last = getByText('Last');

    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(shadowRoot.activeElement).toBe(getByText('First'));
  });

  test('closing hands focus back to the control that opened it', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Modal active={open} onClose={() => setOpen(false)}>
            <button type="button" onClick={() => setOpen(false)}>
              Done
            </button>
          </Modal>
        </>
      );
    }
    const { getByText } = renderInShadowRoot(<Harness />);
    const opener = getByText('Open');

    opener.focus();
    fireEvent.click(opener);
    expect(shadowRoot.activeElement).toBe(getByText('Done'));

    fireEvent.click(getByText('Done'));
    expect(shadowRoot.activeElement).toBe(opener);
  });
});
