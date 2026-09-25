export function Helpers() {
  return (
    <div className="box p-4 mb-6 has-text-centered-mobile">
      <p className="has-text-primary is-size-4 is-size-6-mobile has-text-right-tablet">
        Sized and aligned
      </p>
      <p className="is-uppercase has-text-weight-light is-family-monospace">
        Typography
      </p>
      <span className="has-background-dark has-text-white px-2 py-1">
        Colored
      </span>
      <strong className="has-text-danger">Strong</strong>
      <em className="is-italic">Emphasis</em>
      <code className="has-text-info">code()</code>
      <pre className="is-clipped">pre</pre>
      <ul className="mt-3 ml-5">
        <li className="is-pulled-left is-clearfix">Pulled</li>
      </ul>
      <ol className="is-unselectable">
        <li>Unselectable list</li>
      </ol>
      <figure className="is-relative">Figure</figure>
      <a className="is-clickable has-text-link" href="/x">
        Link
      </a>
      <div className="box is-flex is-justify-content-space-between is-align-items-center">
        A flex box
      </div>
      <div className="box is-hidden-mobile is-invisible-desktop">Hidden</div>
      <div className="box is-flex-tablet is-block-mobile is-shadowless is-radiusless">
        Per-viewport display
      </div>
      <p className="is-sr-only">Screen readers only</p>
    </div>
  );
}
