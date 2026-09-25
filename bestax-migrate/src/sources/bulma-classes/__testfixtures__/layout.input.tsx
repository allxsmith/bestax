export function Landing() {
  return (
    <section className="section is-medium">
      <div className="container is-max-desktop">
        <h1 className="title is-1 has-text-centered">Ship faster</h1>
        <p className="subtitle is-4">A subtitle on a paragraph</p>
        <h3 className="subtitle">A smaller heading, no size class</h3>
        <div className="columns is-multiline pricing-grid">
          <div className="column is-4 is-offset-2 is-narrow-mobile">
            <div className="box has-background-light p-5">
              <p className="has-text-weight-semibold is-size-5 mb-2">Fast</p>
              <span className="has-text-grey is-italic">and quiet</span>
            </div>
          </div>
          <div className="column is-half-tablet is-4-desktop">
            <div className="content is-small">
              <ul className="mt-2">
                <li>One</li>
              </ul>
            </div>
          </div>
        </div>
        <nav className="level is-mobile">
          <div className="level-left">
            <div className="level-item">Left</div>
          </div>
          <div className="level-right">
            <p className="level-item">Right</p>
          </div>
        </nav>
        <article className="media">
          <figure className="media-left">Avatar</figure>
          <div className="media-content">Body</div>
        </article>
      </div>
      <section className="hero is-primary is-small">
        <div className="hero-body">Hero</div>
      </section>
      <footer className="footer has-text-centered">Footer</footer>
    </section>
  );
}
