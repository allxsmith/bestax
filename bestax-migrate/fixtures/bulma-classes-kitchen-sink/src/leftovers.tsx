import { useRef } from 'react';

const props = { id: 'spread' };

/** Everything the codemod leaves as markup on purpose, each with its TODO. */
export function Leftovers() {
  const ref = useRef<HTMLDivElement>(null);
  const open = props.id.length > 3;
  return (
    <div>
      <div className="box" {...props}>
        A spread
      </div>
      <div className="notification" ref={ref}>
        A ref on a component that does not forward one
      </div>
      <div className="section">A section that is not a section</div>
      <div className="box" color="red">
        An attribute the component reads as a prop
      </div>
      <div className="level-item" rel="author">
        An attribute the component drops on a div
      </div>
      <button className="delete" />
      <div className={open ? 'column is-6' : 'column'}>A computed class</div>
      <div className="card">
        <p>Content Card would wrap in a part of its own</p>
      </div>
      <nav className="navbar">
        <div className="navbar-brand">A navbar without Bulma's role and label</div>
      </nav>
      <div className="navbar-item has-dropdown">
        <a className="navbar-link">A dropdown trigger</a>
      </div>
      <a
        role="button"
        className="navbar-burger"
        aria-label="menu"
        aria-expanded="false"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </a>
      <hr className="navbar-divider mt-2" />
      <div className="dropdown">A family converted later</div>
      <div className="tile is-ancestor">A Bulma 0.9 tile</div>
    </div>
  );
}
