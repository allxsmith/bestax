export function Pages() {
  return (
    <nav
      className="pagination is-centered is-small is-rounded"
      role="navigation"
      aria-label="pagination"
    >
      <a className="pagination-previous" href="#prev" tabIndex={0}>
        Previous
      </a>
      <a className="pagination-next" href="#next">
        A link with no tabIndex would gain one
      </a>
      <ul className="pagination-list">
        <li>
          <a className="pagination-link" aria-label="Goto page 1" href="#1">
            1
          </a>
        </li>
        <li>
          <span className="pagination-ellipsis">&hellip;</span>
        </li>
      </ul>
    </nav>
  );
}
