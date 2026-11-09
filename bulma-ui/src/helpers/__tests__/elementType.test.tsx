import React, { Suspense } from 'react';
import { act, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { elementType, isElementOf } from '../elementType';
import { Card, CardContent, CardHeader } from '../../components/Card';

/**
 * A lazy type whose module has loaded, the shape a client component written
 * in a Server Component reaches the client with.
 */
const loaded = <T,>(component: T): T =>
  ({
    $$typeof: Symbol.for('react.lazy'),
    _payload: component,
    _init: (payload: T) => payload,
  }) as unknown as T;

describe('elementType', () => {
  it('returns the type of an element that is not lazy', () => {
    expect(elementType(<CardHeader />)).toBe(CardHeader);
    expect(elementType(<div />)).toBe('div');
  });

  it('reads through a lazy type, and a lazy type of a lazy type', () => {
    const Header = loaded(CardHeader);
    const Twice = loaded(Header);
    expect(elementType(<Header />)).toBe(CardHeader);
    expect(elementType(<Twice />)).toBe(CardHeader);
  });

  it('leaves a lazy type it cannot read as it is', () => {
    const odd = { $$typeof: Symbol.for('react.lazy'), _payload: CardHeader };
    const element = React.createElement(odd as unknown as React.FC);
    expect(elementType(element)).toBe(odd);
  });

  it('throws what a lazy type throws while its module loads', () => {
    const pending = Promise.resolve();
    const Loading = {
      $$typeof: Symbol.for('react.lazy'),
      _payload: null,
      _init: () => {
        throw pending;
      },
    } as unknown as React.FC;
    let thrown: unknown;
    try {
      elementType(<Loading />);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBe(pending);
  });
});

describe('isElementOf', () => {
  it('matches an element of any of the types given, lazy or not', () => {
    expect(isElementOf(<CardHeader />, CardContent, CardHeader)).toBe(true);
    const Header = loaded(CardHeader);
    expect(isElementOf(<Header />, CardContent, CardHeader)).toBe(true);
    expect(isElementOf(<Header />, CardContent)).toBe(false);
  });

  it('is false for text, null and an unreadable lazy type', () => {
    expect(isElementOf('text', CardHeader)).toBe(false);
    expect(isElementOf(null, CardHeader)).toBe(false);
    const odd = { $$typeof: Symbol.for('react.lazy'), _payload: CardHeader };
    const element = React.createElement(odd as unknown as React.FC);
    expect(isElementOf(element, CardHeader)).toBe(false);
  });

  it('suspends at the same boundary while a part loads, then lays it out', async () => {
    const consoleError = vi.spyOn(console, 'error');
    let resolve!: (module: { default: typeof CardHeader }) => void;
    const Header = React.lazy(
      () =>
        new Promise<{ default: typeof CardHeader }>(done => {
          resolve = done;
        })
    );
    const { container } = render(
      <div data-testid="outside">
        <Suspense fallback={<p>Loading</p>}>
          <Card>
            <Header>Title</Header>
          </Card>
        </Suspense>
      </div>
    );
    // The boundary around the Card shows its fallback, as it would for the
    // part on its own, and nothing outside it is replaced.
    expect(screen.getByTestId('outside')).toContainElement(
      screen.getByText('Loading')
    );
    expect(container.querySelector('.card')).toBeNull();

    await act(async () => resolve({ default: CardHeader }));
    await screen.findByText('Title');
    expect(container.querySelector('[data-testid="outside"]')!.innerHTML).toBe(
      renderToStaticMarkup(
        <Card>
          <CardHeader>Title</CardHeader>
        </Card>
      )
    );
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
