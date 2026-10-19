import { useRef } from 'react';

const extra = { id: 'spread' };

export function Refusals() {
  const ref = useRef<HTMLDivElement>(null);
  const active = extra.id.length > 0;
  // TODO(bestax-migrate): this element spreads props, which bestax `Box` may read differently than the element did (a spread `className` merges with its classes instead of replacing them); convert it to `Box` by hand
  // TODO(bestax-migrate): bestax `Box` does not forward refs, so this `ref` would stop reaching the DOM node; keep this element as markup
  // TODO(bestax-migrate): bestax `Section` renders only <section>, not a <div>; keep the markup, or change the tag and re-run
  // TODO(bestax-migrate): bestax `Panel.Block` renders <a>, <div>, <label>, not a <button>; keep the markup, or change the tag and re-run
  // TODO(bestax-migrate): `color` is also a bestax `Box` prop, which would read it differently; rename or drop the attribute, then re-run
  // TODO(bestax-migrate): bestax `Delete` renders `type="button"` and `aria-label="Close"` when the element does not set them; add them here if that is what you want, then re-run
  // TODO(bestax-migrate): this `className` is computed, and the codemod reads only a `clsx` or `classnames` call of class strings and conditional classes; convert this element to bestax `Box` by hand, turning each condition into its prop
  // TODO(bestax-migrate): `.dropdown` stays as markup: bestax `Dropdown` renders its own trigger and menu from props
  // TODO(bestax-migrate): bestax `Card` renders its children inside a `.card-content` of its own unless one of them is a `Card.Header`, `Card.Header.Icon`, `Card.Image`, `Card.Content`, `Card.Footer` or `Card.FooterItem`, so this element stays markup
  // TODO(bestax-migrate): Bulma v1 removed tiles; rebuild the layout with `Grid` and `Cell` (see the Bulma 0.9 to 1 guide)
  // TODO(bestax-migrate): Bulma v1 removed `is-marginless`, so it styles nothing now; write v1's `m-0` in its place, or `m="0"` on a bestax component. The codemod does that itself wherever the element converts
  // TODO(bestax-migrate): `is-64x64` is an `.image` modifier, and Bulma styles it only on the element that carries `.image`, so on this one it styles nothing unless the project's own CSS gives it a rule; if this element is the image, add `image`, which bestax `Image` renders, then re-run, and otherwise drop the class
  return (
    <div>
      <div className="box" {...extra}>
        A spread
      </div>
      <div className="box" ref={ref}>
        A ref Box does not forward
      </div>
      <div className="section">A section on a div</div>
      <button className="panel-block" type="submit">
        A panel block on a button, whose type is not inert
      </button>
      <div className="box" color="red">
        An attribute Box reads as a prop
      </div>
      <button className="delete"></button>
      <div className={active ? 'box is-active' : 'box'}>A computed class</div>
      <div className="dropdown">
        <div className="dropdown-menu">A family converted later</div>
      </div>
      <div className="card">
        <p>Content Card would wrap in a part of its own</p>
      </div>
      <div className="tile is-ancestor">A Bulma 0.9 tile</div>
      <div className="is-marginless">A Bulma 0.9 class on a plain div</div>
      <figure className="is-64x64">An image size away from its image</figure>
    </div>
  );
}
