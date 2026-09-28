import { Pagination } from "@allxsmith/bestax-bulma";
export function Pages() {
  // TODO(bestax-migrate): bestax `Pagination.Next` renders `tabIndex="0"` when the element does not set it; add it here if that is what you want, then re-run
  // TODO(bestax-migrate): `.pagination-link` stays as markup: bestax `Pagination.Link` renders its own `<li>` around the `<a>`
  // TODO(bestax-migrate): `.pagination-ellipsis` stays as markup: bestax `Pagination.Ellipsis` renders its own `<li>` and its own `&hellip;`
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
        <li>
          <a className="pagination-link" aria-label="Goto page 1" href="#1">
            1
          </a>
        </li>
        <li>
          <span className="pagination-ellipsis">&hellip;</span>
        </li>
      </Pagination.List>
    </Pagination>
  );
}
