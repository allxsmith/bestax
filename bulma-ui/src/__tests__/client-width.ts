/**
 * jsdom lays nothing out, so the root element's `clientWidth` reads 0, and a
 * panel kept inside the viewport would be pushed to its left edge. Called in
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
