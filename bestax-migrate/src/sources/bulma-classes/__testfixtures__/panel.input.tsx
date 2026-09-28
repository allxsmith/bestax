export function Repositories() {
  return (
    <nav className="panel is-primary mb-4">
      <p className="panel-heading">Repositories</p>
      <p className="panel-tabs">
        <a className="is-active">All</a>
        <a>Public</a>
      </p>
      <a className="panel-block is-active" href="/bulma">
        <span className="panel-icon">
          <i className="fas fa-book" aria-hidden="true"></i>
        </span>
        bulma
      </a>
      <a className="panel-block" href="/marksheet">
        marksheet
      </a>
      <label className="panel-block">
        <input type="checkbox" />
        remember me
      </label>
    </nav>
  );
}
