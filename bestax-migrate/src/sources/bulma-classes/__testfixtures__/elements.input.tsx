export function Elements() {
  return (
    <div className="block">
      <div className="buttons are-small has-addons">
        <button className="button is-primary is-outlined">Save</button>
        <a className="button is-link is-light" href="/docs">
          Docs
        </a>
        <button className="button is-loading" disabled>
          Wait
        </button>
      </div>
      <div className="tags has-addons">
        <span className="tag is-dark">npm</span>
        <span className="tag is-success is-rounded">v5</span>
      </div>
      <div className="notification is-danger is-light">
        <button className="delete" type="button" aria-label="Dismiss"></button>
        Something broke
      </div>
      <progress className="progress is-info is-small" value="40" max="100">
        40%
      </progress>
      <table className="table is-striped is-fullwidth">
        <tbody>
          <tr>
            <td>Cell</td>
          </tr>
        </tbody>
      </table>
      <p className={'has-text-centered'}>An expression string</p>
      <p className={`has-text-right`}>A template with no expressions</p>
    </div>
  );
}
