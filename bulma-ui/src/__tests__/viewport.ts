/**
 * jsdom lays nothing out, so the root element's `clientWidth` reads 0, and a
 * panel kept inside the viewport would be pushed to its edge. Called in
 * a `describe`, this has `document.documentElement.clientWidth` read
 * `window.innerWidth` for each test in it, as a page without a classic
 * scrollbar does, so a test that sets `innerWidth` sets both.
 */
export function clientWidthFollowsWindow(): void {
  beforeEach(() => {
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      get: () => window.innerWidth,
    });
  });
  afterEach(() => {
    // Back to jsdom's own, which reads 0.
    Reflect.deleteProperty(document.documentElement, 'clientWidth');
  });
}

/**
 * A 375px window, as a phone's, with an anchor 160px wide from x 215 to its
 * right edge, and a panel 200px wide lined up with the anchor's left edge,
 * moved by the `--bulma-anchored-shift` it's drawn with, as a stylesheet's corner
 * and a browser's box would put it. Every other element measures nothing.
 * Restore it with `vi.restoreAllMocks()`.
 */
export function narrowWindow(
  isAnchor: (el: HTMLElement) => boolean,
  panelSelector: string
): void {
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      let box = { top: 0, left: 0, width: 0, height: 0 };
      if (isAnchor(this)) box = { top: 100, left: 215, width: 160, height: 30 };
      else if (this.matches(panelSelector)) {
        const moved =
          parseFloat(this.style.getPropertyValue('--bulma-anchored-shift')) ||
          0;
        box = { top: 130, left: 215 + moved, width: 200, height: 100 };
      }
      return {
        ...box,
        bottom: box.top + box.height,
        right: box.left + box.width,
        x: box.left,
        y: box.top,
        toJSON: () => ({}),
      } as DOMRect;
    }
  );
}

/**
 * Called in a `describe`: the root element's `clientWidth`, which jsdom reads
 * as 0, reads `width` in each test in it.
 */
export function clientWidthIs(width: number): void {
  beforeEach(() => {
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: width,
    });
  });
  afterEach(() => {
    Reflect.deleteProperty(document.documentElement, 'clientWidth');
  });
}

/**
 * Called in a `describe`: an element with `dir="rtl"` reads `direction: rtl`
 * from `getComputedStyle` in each test in it, which jsdom doesn't work out
 * from the attribute.
 */
export function directionFromDir(): void {
  let spy: { mockRestore: () => void } | undefined;
  beforeEach(() => {
    const computed = window.getComputedStyle;
    spy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation((el: Element, pseudo?: string | null) => {
        const style = computed(el, pseudo);
        if (el.getAttribute('dir') !== 'rtl') return style;
        // Every other property, and the methods, read the real declaration.
        return new Proxy(style, {
          get: (target, key) =>
            key === 'direction' ? 'rtl' : Reflect.get(target, key, target),
        });
      });
  });
  afterEach(() => {
    spy?.mockRestore();
  });
}
