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

export function Program() {
  return (
    <section className="panel is-info" aria-labelledby="program">
      <p className="panel-heading" id="program">
        Program
      </p>
      <div className="panel-block">
        <table className="table is-fullwidth">
          <tbody>
            <tr>
              <td>9:00</td>
              <td>Grand Opening</td>
            </tr>
          </tbody>
        </table>
      </div>
      <label className="panel-block" htmlFor="remember">
        Remember me
      </label>
    </section>
  );
}
