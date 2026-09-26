import { useRef } from 'react';

const extra = { id: 'spread' };

export function Refusals() {
  const ref = useRef<HTMLDivElement>(null);
  const active = extra.id.length > 0;
  // TODO(bestax-migrate): this element spreads props, which bestax `Box` may read differently than the element did (a spread `className` merges with its classes instead of replacing them); convert it to `Box` by hand
  // TODO(bestax-migrate): bestax `Box` does not forward refs, so this `ref` would stop reaching the DOM node; keep this element as markup
  // TODO(bestax-migrate): bestax `Section` renders only <section>, not a <div>; keep the markup, or change the tag and re-run
  // TODO(bestax-migrate): `color` is also a bestax `Box` prop, which would read it differently; rename or drop the attribute, then re-run
  // TODO(bestax-migrate): bestax `Delete` renders `type="button"` and `aria-label="Close"` when the element does not set them; add them here if that is what you want, then re-run
  // TODO(bestax-migrate): this `className` is computed, and the codemod converts static class strings only; convert this element to bestax `Box` by hand, turning each condition into its prop
  // TODO(bestax-migrate): `.card` stays as markup: bestax `Card` wraps any child that is not one of its parts in `.card-content`, so convert the card and its parts together, by hand
  // TODO(bestax-migrate): Bulma v1 removed tiles; rebuild the layout with `Grid` and `Cell` (see the Bulma 0.9 to 1 guide)
  return (
    <div>
      <div className="box" {...extra}>
        A spread
      </div>
      <div className="box" ref={ref}>
        A ref Box does not forward
      </div>
      <div className="section">A section on a div</div>
      <div className="box" color="red">
        An attribute Box reads as a prop
      </div>
      <button className="delete"></button>
      <div className={active ? 'box is-active' : 'box'}>A computed class</div>
      <div className="card">
        <div className="card-content">A family converted later</div>
      </div>
      <div className="tile is-ancestor">A Bulma 0.9 tile</div>
    </div>
  );
}
