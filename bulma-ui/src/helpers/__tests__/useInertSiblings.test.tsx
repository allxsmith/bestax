import { renderHook } from '@testing-library/react';
import { useInertSiblings } from '../useInertSiblings';

/**
 * Builds markup under a fresh element on the page and returns it, with each
 * element that has an `id` looked up by it.
 */
function page(html: string): Record<string, HTMLElement> {
  const root = document.createElement('div');
  root.id = 'root';
  root.innerHTML = html;
  document.body.appendChild(root);
  const byId: Record<string, HTMLElement> = { root };
  root.querySelectorAll<HTMLElement>('[id]').forEach(el => {
    byId[el.id] = el;
  });
  return byId;
}

const inert = (...els: Element[]) => els.map(el => el.hasAttribute('inert'));

describe('useInertSiblings', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('does nothing while inactive', () => {
    const { loading, before, after } = page(
      '<div id="before"></div><div id="loading"></div><div id="after"></div>'
    );
    renderHook(() => useInertSiblings({ current: loading }, false, false));
    expect(inert(before, after)).toEqual([false, false]);
  });

  it('does nothing while active with no element', () => {
    const { before } = page('<div id="before"></div>');
    expect(() =>
      renderHook(() => useInertSiblings({ current: null }, true, true))
    ).not.toThrow();
    expect(inert(before)).toEqual([false]);
  });

  it('makes only the siblings inert, and puts them back when it turns off', () => {
    const { root, outside, container, loading, child, before, after } = page(`
      <div id="outside"></div>
      <div id="container">
        <div id="before"></div>
        <div id="loading"><button id="child"></button></div>
        <div id="after"></div>
      </div>
    `);
    const { rerender } = renderHook(
      ({ active }) => useInertSiblings({ current: loading }, active, false),
      { initialProps: { active: true } }
    );
    expect(inert(before, after)).toEqual([true, true]);
    // The element, its content, its parent and the parent's siblings.
    expect(inert(loading, child, container, outside, root)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);

    rerender({ active: false });
    expect(inert(before, after)).toEqual([false, false]);
  });

  it('puts them back on unmount', () => {
    const { loading, before } = page(
      '<div id="before"></div><div id="loading"></div>'
    );
    const { unmount } = renderHook(() =>
      useInertSiblings({ current: loading }, true, false)
    );
    expect(inert(before)).toEqual([true]);
    unmount();
    expect(inert(before)).toEqual([false]);
  });

  it('with wholePage, makes everything but the element and its ancestors inert', () => {
    const { root, nav, main, section, loading, beside, aside } = page(`
      <nav id="nav"></nav>
      <main id="main">
        <section id="section">
          <div id="beside"></div>
          <div id="loading"></div>
        </section>
        <aside id="aside"></aside>
      </main>
    `);
    const elsewhere = document.createElement('div');
    document.body.appendChild(elsewhere);
    const { unmount } = renderHook(() =>
      useInertSiblings({ current: loading }, true, true)
    );
    expect(inert(beside, aside, nav, elsewhere)).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect(inert(loading, section, main, root, document.body)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
    // It stops at <body>: nothing beside it is touched.
    expect(inert(document.head)).toEqual([false]);

    unmount();
    expect(inert(beside, aside, nav, elsewhere)).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it('follows a change to wholePage while active', () => {
    const { nav, beside, loading } = page(`
      <nav id="nav"></nav>
      <section><div id="beside"></div><div id="loading"></div></section>
    `);
    const { rerender } = renderHook(
      ({ wholePage }) =>
        useInertSiblings({ current: loading }, true, wholePage),
      { initialProps: { wholePage: false } }
    );
    expect(inert(beside, nav)).toEqual([true, false]);
    rerender({ wholePage: true });
    expect(inert(beside, nav)).toEqual([true, true]);
    rerender({ wholePage: false });
    expect(inert(beside, nav)).toEqual([true, false]);
  });

  it('leaves an element that was inert already as it was', () => {
    const { loading, before, after } = page(
      '<div id="before" inert></div><div id="loading"></div><div id="after"></div>'
    );
    const { unmount } = renderHook(() =>
      useInertSiblings({ current: loading }, true, false)
    );
    expect(inert(before, after)).toEqual([true, true]);
    unmount();
    expect(inert(before, after)).toEqual([true, false]);
  });

  it('keeps an element inert until the last caller holding it lets go', () => {
    // Two loadings in one container: each covers the content beside both,
    // and each other, so neither one's cancel button is reachable. That's
    // the limit `Loading`'s TSDoc on `active` records: one at a time over
    // the same content.
    const { first, second, content } = page(
      '<div id="content"></div><div id="first"></div><div id="second"></div>'
    );
    const a = renderHook(() =>
      useInertSiblings({ current: first }, true, false)
    );
    const b = renderHook(() =>
      useInertSiblings({ current: second }, true, false)
    );
    expect(inert(content)).toEqual([true]);
    expect(inert(first, second)).toEqual([true, true]);

    a.unmount();
    expect(inert(content)).toEqual([true]);

    b.unmount();
    expect(inert(content)).toEqual([false]);
  });

  it('walks out of a shadow root to its host, and on up the page', () => {
    const { host, nav } = page('<nav id="nav"></nav><div id="host"></div>');
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<header id="header"></header><div id="loading"></div>';
    const header = shadow.getElementById('header')!;
    const loading = shadow.getElementById('loading')!;

    const { unmount } = renderHook(() =>
      useInertSiblings({ current: loading }, true, true)
    );
    expect(inert(header, nav)).toEqual([true, true]);
    expect(inert(loading, host)).toEqual([false, false]);

    unmount();
    expect(inert(header, nav)).toEqual([false, false]);
  });

  it('stops at the top of a tree that is not on the page', () => {
    const detached = document.createElement('div');
    detached.innerHTML = '<div id="beside"></div><div id="loading"></div>';
    const beside = detached.querySelector('#beside')!;
    const loading = detached.querySelector('#loading')!;

    const { unmount } = renderHook(() =>
      useInertSiblings({ current: loading }, true, true)
    );
    expect(inert(beside, detached)).toEqual([true, false]);
    unmount();
    expect(inert(beside)).toEqual([false]);
  });

  describe('focus', () => {
    it('gives focus back to the element that lost it', () => {
      const { loading, button } = page(
        '<button id="button">Save</button><div id="loading"></div>'
      );
      button.focus();
      const { rerender } = renderHook(
        ({ active }) => useInertSiblings({ current: loading }, active, false),
        { initialProps: { active: true } }
      );
      // jsdom doesn't move focus off an inert element. A browser does,
      // to <body>.
      button.blur();
      expect(document.activeElement).toBe(document.body);

      rerender({ active: false });
      expect(document.activeElement).toBe(button);
    });

    it('leaves focus that moved somewhere else meanwhile where it is', () => {
      const { loading, button, link } = page(`
        <div><button id="button">Save</button><div id="loading"></div></div>
        <a id="link" href="#next">Next</a>
      `);
      button.focus();
      const { rerender } = renderHook(
        ({ active }) => useInertSiblings({ current: loading }, active, false),
        { initialProps: { active: true } }
      );
      link.focus();

      rerender({ active: false });
      expect(document.activeElement).toBe(link);
    });

    it("doesn't hand back focus it never took", () => {
      // Focus outside what's covered, then on <body> by the time the loading
      // goes away, as a click on the overlay leaves it.
      const { loading, link } = page(`
        <div><button>Save</button><div id="loading"></div></div>
        <a id="link" href="#next">Next</a>
      `);
      link.focus();
      const { rerender } = renderHook(
        ({ active }) => useInertSiblings({ current: loading }, active, false),
        { initialProps: { active: true } }
      );
      link.blur();

      rerender({ active: false });
      expect(document.activeElement).toBe(document.body);
    });

    it('gives focus back inside a shadow root under what it covered', () => {
      const { loading, host } = page(
        '<div id="host"></div><div id="loading"></div>'
      );
      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<button id="inner">Save</button>';
      const inner = shadow.getElementById('inner')!;
      inner.focus();
      const { rerender } = renderHook(
        ({ active }) => useInertSiblings({ current: loading }, active, false),
        { initialProps: { active: true } }
      );
      inner.blur();
      expect(document.activeElement).toBe(document.body);

      rerender({ active: false });
      expect(shadow.activeElement).toBe(inner);
    });

    it('copes with a document where nothing has focus', () => {
      const { loading, before } = page(
        '<div id="before"></div><div id="loading"></div>'
      );
      const spy = jest
        .spyOn(document, 'activeElement', 'get')
        .mockReturnValue(null);
      const { unmount } = renderHook(() =>
        useInertSiblings({ current: loading }, true, false)
      );
      spy.mockRestore();
      expect(() => unmount()).not.toThrow();
      expect(inert(before)).toEqual([false]);
    });
  });
});
