export function Absorbed({ onPick }: { onPick: () => void }) {
  return (
    <section>
      <div className="select is-small is-fullwidth mb-3">
        <select id="plan" name="plan" onChange={onPick}>
          <option>Free</option>
          <option>Pro</option>
        </select>
      </div>
      <div className="select is-multiple">
        <select multiple size="4" className="is-focused">
          <option>One</option>
          <option>Two</option>
        </select>
      </div>
      <div className="select" id="kept">
        <select>
          <option>An attribute on the wrapper keeps it as markup</option>
        </select>
      </div>
      <nav
        className="breadcrumb has-succeeds-separator is-right"
        aria-label="breadcrumbs"
      >
        <ul>
          <li>
            <a href="#">Home</a>
          </li>
          <li className="is-active">
            <a href="#" aria-current="page">
              Here
            </a>
          </li>
        </ul>
      </nav>
    </section>
  );
}
