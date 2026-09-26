import { useRef } from 'react';

const extra = { id: 'spread' };

export function Refusals() {
  const ref = useRef<HTMLDivElement>(null);
  const active = extra.id.length > 0;
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
