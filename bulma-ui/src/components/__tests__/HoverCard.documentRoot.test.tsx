/**
 * HoverCard with React's root on the document, the way an app that hydrates
 * the whole page has it. React's own listener and the card's listener for a
 * press outside then share the document, so a press that something in the
 * card stops still reaches the card's listener, though React never brought
 * it to the wrapper. Under a root anywhere else, React's stop keeps the
 * press from the document altogether, which `HoverCard.test.tsx` covers.
 *
 * A file of its own, because React puts its listeners on a root's document
 * only for the first root there, and a page that already rendered into a
 * container under <body> has had its first.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HoverCard } from '../HoverCard';
import { Button } from '../../elements/Button';

/** A finger's press and lift on `el`, as pointer events with a `pointerType`. */
const tap = (el: Element) => {
  for (const type of ['pointerdown', 'pointerup']) {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    Object.defineProperty(event, 'pointerType', { value: 'touch' });
    fireEvent(el, event);
  }
};

const button = (name: string) =>
  within(document.body).getByRole('button', { name });
const card = () => document.querySelector('.hover-card-content');

let unmount: () => void;

const renderOnDocument = (body: React.ReactElement) => {
  const page = document.documentElement;
  const root = createRoot(document);
  act(() => {
    root.render(
      <html>
        <head />
        <body>{body}</body>
      </html>
    );
  });
  unmount = () => {
    act(() => root.unmount());
    // React 18 swaps in a page of its own, so put the original back.
    if (document.documentElement !== page) {
      if (document.documentElement) {
        document.replaceChild(page, document.documentElement);
      } else {
        document.appendChild(page);
      }
    }
  };
};

afterEach(() => unmount());

describe('HoverCard with openOnTap, under a root on the document', () => {
  it.each([
    ['in place', {}],
    ['portaled', { appendToBody: true }],
  ])(
    'stays open for a tap on a control in the card that stops it, %s',
    (_, props) => {
      renderOnDocument(
        <>
          <HoverCard
            openOnTap
            trigger={<Button>Engine team</Button>}
            {...props}
          >
            <button onPointerDown={e => e.stopPropagation()}>Follow</button>
          </HoverCard>
          <button>Elsewhere</button>
        </>
      );
      tap(button('Engine team'));
      tap(button('Follow'));
      expect(card()).toBeInTheDocument();
      tap(button('Elsewhere'));
      expect(card()).toBeNull();
    }
  );

  it('closes on a second tap on a trigger that stops it', () => {
    renderOnDocument(
      <HoverCard
        openOnTap
        trigger={
          <Button onPointerDown={e => e.stopPropagation()}>Ada Lovelace</Button>
        }
      >
        Analytical Engine team
      </HoverCard>
    );
    tap(button('Ada Lovelace'));
    expect(card()).toBeInTheDocument();
    tap(button('Ada Lovelace'));
    expect(card()).toBeNull();
  });
});
