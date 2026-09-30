import { getActiveElement, isEventInside } from '../shadowDom';

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

  describe('getActiveElement', () => {
    it('reads focus inside a shadow root, where the document sees the host', () => {
      inner.focus();
      expect(document.activeElement).toBe(host);
      expect(getActiveElement(inner)).toBe(inner);
    });

    it('reads the document for a node outside any shadow root', () => {
      outside.focus();
      expect(getActiveElement(outside)).toBe(outside);
    });

    it('falls back to the document when nothing in the shadow root has focus', () => {
      outside.focus();
      expect(shadowRoot.activeElement).toBeNull();
      expect(getActiveElement(inner)).toBe(outside);
    });

    it('falls back to the document for a detached or missing node', () => {
      outside.focus();
      expect(getActiveElement(document.createElement('div'))).toBe(outside);
      expect(getActiveElement(null)).toBe(outside);
    });
  });
});
