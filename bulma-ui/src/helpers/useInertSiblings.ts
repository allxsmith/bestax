// INTERNAL: deliberately not exported from src/index.ts.
import { useEffect } from 'react';
import type { RefObject } from 'react';
import { getDeepestActiveElement } from './shadowDom';

/**
 * How many callers hold each element inert. Shared across callers, the way
 * the scroll lock's count is, so two that cover the same element don't take
 * `inert` off it while the other still needs it. An element that was inert
 * before any caller came isn't counted, so it's left as it was.
 */
const holds = new Map<Element, number>();

/**
 * Makes `el` inert for one more caller. Returns `false`, touching nothing,
 * when it was inert already and no caller made it so.
 */
function hold(el: Element): boolean {
  const count = holds.get(el) ?? 0;
  if (count === 0 && el.hasAttribute('inert')) return false;
  holds.set(el, count + 1);
  el.setAttribute('inert', '');
  return true;
}

/** Lets go of one caller's hold, and takes `inert` off with the last one. */
function release(el: Element): void {
  const count = (holds.get(el) as number) - 1;
  if (count > 0) {
    holds.set(el, count);
    return;
  }
  holds.delete(el);
  el.removeAttribute('inert');
}

/** The element's siblings, in a shadow root as anywhere else. */
function siblingsOf(el: Element): Element[] {
  const siblings: Element[] = [];
  for (let s = el.previousElementSibling; s; s = s.previousElementSibling) {
    siblings.push(s);
  }
  for (let s = el.nextElementSibling; s; s = s.nextElementSibling) {
    siblings.push(s);
  }
  return siblings;
}

/**
 * The element above `el` in the page: its parent, or the host of the shadow
 * root it sits at the top of. Nothing above the top of a detached tree.
 */
const above = (el: Element): Element | undefined =>
  el.parentElement ?? (el.getRootNode() as Partial<ShadowRoot>).host;

/**
 * Makes the elements beside `ref`'s element inert while `active` is true,
 * and takes it off again when `active` turns false or the caller unmounts.
 * With `wholePage`, it does the same beside each element above it up to
 * `<body>`, so everything on the page but `ref`'s element is inert, the way a
 * modal layer leaves it. The element itself and its own content are never
 * touched.
 *
 * It sets the `inert` attribute through the DOM in an effect, so it works the
 * same on React 18 and 19 and a server render has nothing to show for it. An
 * element that was inert already is left alone, and keeps its `inert` once
 * this lets go. It makes inert what's there when it turns on: an element that
 * mounts beside it afterwards isn't. It follows the DOM, so content a web
 * component renders around a slot this sits in, and text with no element of
 * its own, stays as it is.
 *
 * Focus on an element that turns inert is lost: the browser moves it to
 * `<body>`. So if focus is still on `<body>` when this lets go, it goes back
 * to the element that had it when this turned on. Focus the user or the app
 * has put somewhere else meanwhile stays there.
 *
 * @function useInertSiblings
 * @param ref - Ref to the element that stays reachable.
 * @param active - Whether what's beside it is inert.
 * @param wholePage - Whether that goes for the whole page rather than only
 * the element's siblings.
 */
export function useInertSiblings(
  ref: RefObject<Element | null>,
  active: boolean,
  wholePage: boolean
): void {
  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return undefined;
    const doc = el.ownerDocument;
    const opener = getDeepestActiveElement(doc) as HTMLElement | null;

    const held: Element[] = [];
    for (
      let node: Element | undefined = el;
      node && node !== doc.body;
      node = wholePage ? above(node) : undefined
    ) {
      held.push(...siblingsOf(node).filter(hold));
    }

    return () => {
      held.forEach(release);
      if (doc.activeElement === doc.body) opener?.focus();
    };
  }, [ref, active, wholePage]);
}
