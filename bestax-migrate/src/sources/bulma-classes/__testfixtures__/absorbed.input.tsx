export function Absorbed({
  onPick,
  thumb,
}: {
  onPick: () => void;
  thumb: string;
}) {
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
      <figure className="image is-128x128 mb-2">
        <img src="/avatar.png" alt="Avatar" className="is-rounded" />
      </figure>
      <p className="image is-64x64">
        <img src={thumb} alt="" />
      </p>
      <figure className="image is-4by3">
        <img src="/photo.jpg" alt="A ratio stays a class" />
      </figure>
      <figure className="image is-48x48">
        <img src="/lazy.png" alt="Another attribute keeps both" loading="lazy" />
      </figure>
    </section>
  );
}
