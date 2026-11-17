import {
  clippingAncestors,
  clipsOverflow,
  scrollsOverflow,
} from '../clippingAncestors';

/** An element with `style`, drawn with a box, which jsdom leaves out. */
function boxed(tag: string, style: Partial<CSSStyleDeclaration> = {}) {
  const el = document.createElement(tag);
  Object.assign(el.style, style);
  el.getClientRects = () =>
    [{ width: 100, height: 100 }] as unknown as DOMRectList;
  return el;
}

/** Nests each element in the one before it, in the body, and returns the last. */
function nest(...elements: HTMLElement[]) {
  elements.reduce((parent, child) => parent.appendChild(child));
  document.body.appendChild(elements[0]);
  return elements[elements.length - 1];
}

/** The ancestors that clip `element`, as their ids and axes. */
const clippersOf = (element: Element, throughBody = false) =>
  [...clippingAncestors(element, { throughBody })].map(
    ({ element: el, clipsX, clipsY }) => [el.id, clipsX, clipsY]
  );

describe('clippingAncestors', () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.body.removeAttribute('style');
    document.documentElement.removeAttribute('style');
    delete (document.body as Partial<HTMLElement>).getClientRects;
  });

  it('lists the ancestors that clip, nearest first, and which ways each does', () => {
    const outer = Object.assign(boxed('div', { overflowY: 'auto' }), {
      id: 'outer',
    });
    const plain = boxed('div');
    const inner = Object.assign(boxed('div', { overflowX: 'clip' }), {
      id: 'inner',
    });
    const target = nest(outer, plain, inner, boxed('div'));

    expect(clippersOf(target)).toEqual([
      ['inner', true, false],
      ['outer', false, true],
    ]);
  });

  it('stops below the body, whatever it clips', () => {
    document.body.style.overflowY = 'auto';
    const target = nest(boxed('div'));

    expect(clippersOf(target)).toEqual([]);
  });

  it('takes the body in, when asked to, while the page clips what overflows it and the body scrolls on its own', () => {
    document.body.id = 'body';
    document.body.style.overflowY = 'auto';
    document.body.getClientRects = () =>
      [{ width: 100, height: 100 }] as unknown as DOMRectList;
    const target = nest(boxed('div'));
    expect(clippersOf(target, true)).toEqual([]);

    document.documentElement.style.overflowY = 'hidden';
    expect(clippersOf(target, true)).toEqual([['body', false, true]]);
    expect(clippersOf(target)).toEqual([]);
    document.body.removeAttribute('id');
  });

  it('stops at the first ancestor a caller looks at, finding the next only when asked', () => {
    const outer = boxed('div', { overflowY: 'auto' });
    const looked = vi.fn(outer.getClientRects);
    outer.getClientRects = looked;
    const inner = boxed('div', { overflowY: 'auto' });
    const target = nest(outer, inner, boxed('div'));

    const ancestors = clippingAncestors(target);
    expect(ancestors.next().value?.element).toBe(inner);
    expect(looked).not.toHaveBeenCalled();

    expect(ancestors.next().value?.element).toBe(outer);
    expect(looked).toHaveBeenCalled();
  });

  it('counts each value that clips what overflows, and only those', () => {
    expect(['auto', 'scroll', 'hidden', 'clip'].map(clipsOverflow)).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect(clipsOverflow('visible')).toBe(false);
  });

  it('counts each value that lets the reader scroll what overflows, and only those', () => {
    expect(
      ['auto', 'scroll', 'hidden', 'clip', 'visible'].map(scrollsOverflow)
    ).toEqual([true, true, false, false, false]);
  });

  it('takes an ancestor with no box for no clip, whatever its overflow', () => {
    const noBox = document.createElement('div');
    noBox.style.overflowY = 'hidden';
    const target = nest(noBox, boxed('div'));

    expect(clippersOf(target)).toEqual([]);
  });

  it('climbs through the slot an element is assigned to, inside a shadow root', () => {
    const host = document.createElement('div');
    const scroller = Object.assign(boxed('div', { overflowY: 'auto' }), {
      id: 'scroller',
    });
    scroller.appendChild(document.createElement('slot'));
    host.attachShadow({ mode: 'open' }).appendChild(scroller);
    const target = nest(host, boxed('div'));

    expect(clippersOf(target)).toEqual([['scroller', false, true]]);
  });

  it('skips a static ancestor for an absolutely positioned element, up to the positioned one it is laid out in', () => {
    const positioned = Object.assign(
      boxed('div', { position: 'relative', overflowY: 'hidden' }),
      { id: 'positioned' }
    );
    const skipped = boxed('div', { overflowY: 'hidden' });
    const target = nest(
      positioned,
      skipped,
      boxed('div', { position: 'absolute' })
    );

    expect(clippersOf(target)).toEqual([['positioned', false, true]]);
  });

  it('keeps an ancestor that holds an absolutely positioned element with a transform', () => {
    const holds = Object.assign(
      boxed('div', { transform: 'scale(1)', overflowY: 'hidden' }),
      { id: 'holds' }
    );
    const target = nest(holds, boxed('div', { position: 'absolute' }));

    expect(clippersOf(target)).toEqual([['holds', false, true]]);
  });

  it('skips every ancestor of a fixed element but one that holds it', () => {
    const holds = Object.assign(
      boxed('div', { transform: 'scale(1)', overflowY: 'hidden' }),
      { id: 'holds' }
    );
    const positioned = boxed('div', {
      position: 'relative',
      overflowY: 'hidden',
    });
    const target = nest(holds, positioned, boxed('div', { position: 'fixed' }));

    expect(clippersOf(target)).toEqual([['holds', false, true]]);
  });
});
