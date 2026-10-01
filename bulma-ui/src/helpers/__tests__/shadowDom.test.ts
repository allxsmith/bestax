import {
  getActiveElementInTree,
  getDeepestActiveElement,
  isEventInside,
} from '../shadowDom';

describe('shadowDom helpers', () => {
  let host: HTMLDivElement;
  let shadowRoot: ShadowRoot;
  let inner: HTMLButtonElement;
  let outside: HTMLButtonElement;

  beforeEach(() => {
    host = document.createElement('div');
    shadowRoot = host.attachShadow({ mode: 'open' });
    inner = document.createElement('button');
    shadowRoot.appendChild(inner);
    outside = document.createElement('button');
    document.body.append(host, outside);
  });

  afterEach(() => {
    host.remove();
    outside.remove();
  });

  describe('isEventInside', () => {
    // Asks from a listener on `document`, the way the components do. The
    // question has to be asked during dispatch: an event's path is empty once
    // dispatch ends.
    const askFromDocument = (
      from: EventTarget,
      node: Node | null | undefined
    ) => {
      let answer: { inside: boolean; target: EventTarget | null } | undefined;
      const listener = (event: Event) => {
        answer = { inside: isEventInside(event, node), target: event.target };
      };
      document.addEventListener('mousedown', listener);
      from.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, composed: true })
      );
      document.removeEventListener('mousedown', listener);
      return answer!;
    };

    it('finds a node inside a shadow root, which the event target hides', () => {
      const { inside, target } = askFromDocument(inner, inner);
      expect(target).toBe(host);
      expect(inside).toBe(true);
      expect(askFromDocument(inner, host).inside).toBe(true);
    });

    it('reports a node the event did not pass through as outside', () => {
      expect(askFromDocument(outside, inner).inside).toBe(false);
    });

    it('reports an unmounted node as outside', () => {
      expect(askFromDocument(inner, null).inside).toBe(false);
      expect(askFromDocument(inner, undefined).inside).toBe(false);
    });
  });

  describe('getActiveElementInTree', () => {
    it('reads focus inside a shadow root, where the document sees the host', () => {
      inner.focus();
      expect(document.activeElement).toBe(host);
      expect(getActiveElementInTree(inner)).toBe(inner);
    });

    it('reads the document for a node outside any shadow root', () => {
      outside.focus();
      expect(getActiveElementInTree(outside)).toBe(outside);
    });

    it('falls back to the document when nothing in the shadow root has focus', () => {
      outside.focus();
      expect(shadowRoot.activeElement).toBeNull();
      expect(getActiveElementInTree(inner)).toBe(outside);
    });

    it('falls back to the document for a detached or missing node', () => {
      outside.focus();
      expect(getActiveElementInTree(document.createElement('div'))).toBe(
        outside
      );
      expect(getActiveElementInTree(null)).toBe(outside);
    });

    it("reads focus in a nested shadow root as that root's host", () => {
      const nestedHost = document.createElement('div');
      shadowRoot.appendChild(nestedHost);
      const deep = document.createElement('button');
      nestedHost.attachShadow({ mode: 'open' }).appendChild(deep);
      deep.focus();
      expect(getActiveElementInTree(inner)).toBe(nestedHost);
    });
  });

  describe('getDeepestActiveElement', () => {
    it('follows focus down through open shadow roots', () => {
      const nestedHost = document.createElement('div');
      shadowRoot.appendChild(nestedHost);
      const deep = document.createElement('button');
      nestedHost.attachShadow({ mode: 'open' }).appendChild(deep);
      deep.focus();
      expect(document.activeElement).toBe(host);
      expect(getDeepestActiveElement()).toBe(deep);
    });

    it('reads the document when focus is not in a shadow root', () => {
      outside.focus();
      expect(getDeepestActiveElement()).toBe(outside);
    });

    it('stops at the host of a closed shadow root', () => {
      const closedHost = document.createElement('div');
      const hidden = document.createElement('button');
      closedHost.attachShadow({ mode: 'closed' }).appendChild(hidden);
      document.body.appendChild(closedHost);
      hidden.focus();
      expect(getDeepestActiveElement()).toBe(closedHost);
      closedHost.remove();
    });

    it('stops at a shadow host whose root has nothing focused', () => {
      host.tabIndex = 0;
      host.focus();
      expect(shadowRoot.activeElement).toBeNull();
      expect(getDeepestActiveElement()).toBe(host);
    });
  });
});
