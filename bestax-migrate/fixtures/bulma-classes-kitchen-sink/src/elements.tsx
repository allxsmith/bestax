import { useState } from 'react';

export function Elements() {
  const [count, setCount] = useState(0);
  return (
    <div className="box">
      <h2 className="title is-3 is-spaced">Elements</h2>
      <h3 className="subtitle is-5">Every element that converts</h3>
      <div className="buttons are-medium is-right">
        <button
          className="button is-primary is-rounded"
          type="button"
          onClick={() => setCount(count + 1)}
        >
          Clicked {count}
        </button>
        <button className="button is-warning is-outlined is-fullwidth" disabled>
          Disabled
        </button>
        <a className="button is-text" href="/docs" target="_blank" rel="noreferrer">
          Docs
        </a>
        <span className="button is-static">Static</span>
      </div>
      <div className="tags are-large has-addons">
        <span className="tag is-primary is-light">Light</span>
        <span className="tag is-medium is-hoverable">Medium</span>
      </div>
      <div className="notification is-success has-text-weight-bold">
        <button className="delete is-small" type="button" aria-label="Close" />
        Saved
      </div>
      <progress className="progress is-danger is-large" value={70} max={100}>
        70%
      </progress>
      <table className="table is-bordered is-narrow is-hoverable">
        <thead>
          <tr>
            <th>Plan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Starter</td>
          </tr>
        </tbody>
      </table>
      <div className="card has-background-white-ter">
        <header className="card-header">
          <div className="card-header-title is-centered">A card</div>
          <button className="card-header-icon" type="button" aria-label="Expand">
            +
          </button>
        </header>
        <div className="card-image">
          <img src="/cover.png" alt="Cover" />
        </div>
        <div className="card-content">
          <div className="content">Built from its parts</div>
        </div>
        <footer className="card-footer">
          <span className="card-footer-item">Saved</span>
        </footer>
      </div>
      <div className="block">A block</div>
    </div>
  );
}
