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
          <a
            className="pagination-link"
            aria-label="Goto page 1"
            href="#1"
            tabIndex={0}
          >
            1
          </a>
        </li>
        <li>
          <span className="pagination-ellipsis">&hellip;</span>
        </li>
        <li>
          <a
            className="pagination-link is-current"
            aria-label="Page 46"
            aria-current="page"
            tabIndex={0}
          >
            46
          </a>
        </li>
        <li>
          <a className="pagination-link has-text-danger" href="#47" tabIndex={0}>
            47
          </a>
        </li>
      </ul>
    </nav>
  );
}

export function PageRefusals({ pages = [48, 49] }: { pages?: number[] }) {
  return (
    <nav className="pagination" role="navigation" aria-label="pagination">
      <ul className="pagination-list">
        <li>
          <a className="pagination-link" href="#1">
            A link with no tabIndex would gain one
          </a>
        </li>
        <li>
          <a className="pagination-link is-current" tabIndex={0}>
            Current, with no aria-current of its own: the class stays
          </a>
        </li>
        <li className="my-item">
          <a className="pagination-link" tabIndex={0}>
            A class on the li
          </a>
        </li>
        <li>
          <a className="pagination-link" tabIndex={0}>
            Beside something else
          </a>{' '}
          and text
        </li>
        <a className="pagination-link" tabIndex={0}>
          In no li
        </a>
        <li>
          <span className="pagination-ellipsis my-gap">&hellip;</span>
        </li>
        <li>
          <span className="pagination-ellipsis">...</span>
        </li>
        {pages.map(page => (
          <li key={page}>
            <a className="pagination-link" href={`#${page}`} tabIndex={0}>
              {page}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
