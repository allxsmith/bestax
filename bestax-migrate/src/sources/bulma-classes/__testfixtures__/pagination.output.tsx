import { Pagination } from "@allxsmith/bestax-bulma";
export function Pages() {
  // TODO(bestax-migrate): bestax `Pagination.Next` renders `tabIndex="0"` when the element does not set it; add it here if that is what you want, then re-run
  return (
    <Pagination
      align="centered"
      size="small"
      rounded
      role="navigation"
      aria-label="pagination">
      <Pagination.Previous href="#prev" tabIndex={0}>
        Previous
      </Pagination.Previous>
      <a className="pagination-next" href="#next">
        A link with no tabIndex would gain one
      </a>
      <Pagination.List>
        <Pagination.Link aria-label="Goto page 1" href="#1" tabIndex={0}>
          1
        </Pagination.Link>
        <Pagination.Ellipsis />
        <Pagination.Link
          active
          aria-label="Page 46"
          aria-current="page"
          href="#46"
          tabIndex={0}
        >
          46
        </Pagination.Link>
        <Pagination.Link textColor="danger" href="#47" tabIndex={0}>
          47
        </Pagination.Link>
      </Pagination.List>
    </Pagination>
  );
}

export function PageRefusals({ pages = [48, 49] }: { pages?: number[] }) {
  // TODO(bestax-migrate): bestax `Pagination.Link` renders `tabIndex="0"` when the element does not set it; add it here if that is what you want, then re-run
  // TODO(bestax-migrate): bestax `Pagination.Link` renders `role="button"` when the element does not set it; add it here if that is what you want, then re-run
  // TODO(bestax-migrate): bestax `Pagination.Link` renders its own bare <li> around the <a>, so this converts only as the only thing inside a bare <li>, which it takes the place of; keep it as markup
  // TODO(bestax-migrate): bestax `Pagination.Ellipsis` keeps `.pagination-ellipsis` beside a `className` from @allxsmith/bestax-bulma 5.78.4 on, and an older release writes the `className` in its place. This project isn't sure to get 5.78.4, so the element converts only with no other class: declare `@allxsmith/bestax-bulma` at `^5.78.4` or later and re-run, or keep it as markup
  // TODO(bestax-migrate): bestax `Pagination.Ellipsis` renders its own `…` as its content, so this converts only holding exactly that; keep it as markup
  // TODO(bestax-migrate): bestax `Pagination.Link` renders `tabIndex="0"` when it has an `href` and `tabIndex="0"` and `role="button"` when it has none, and this element's `href` is an expression that may render as either; set `role` here to what you want and re-run, or convert it by hand
  return (
    <Pagination role="navigation" aria-label="pagination">
      <Pagination.List>
        <li>
          <a className="pagination-link" href="#1">
            A link with no tabIndex would gain one
          </a>
        </li>
        <Pagination.Link className="is-current" href="#c" tabIndex={0}>
          Current, with no aria-current of its own: the class stays
        </Pagination.Link>
        <li>
          <a className="pagination-link" tabIndex={0}>
            No href, so a button, with no role of its own
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
      </Pagination.List>
    </Pagination>
  );
}
