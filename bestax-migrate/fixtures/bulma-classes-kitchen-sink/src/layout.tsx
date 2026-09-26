export function Layout() {
  return (
    <section className="section is-large">
      <div className="container is-fluid">
        <div className="columns is-multiline is-centered is-3">
          <div className="column is-one-third is-offset-1">One third</div>
          <div className="column is-6-tablet is-4-desktop is-offset-2-desktop">
            Responsive
          </div>
          <div className="column is-narrow is-narrow-touch">Narrow</div>
        </div>
        <div className="columns is-gapless is-vcentered is-desktop">
          <div className="column is-full">Full</div>
        </div>
      </div>
      <div className="container is-widescreen has-background-white-ter">
        <nav className="level">
          <div className="level-left">
            <div className="level-item">
              <p className="subtitle is-5">Left</p>
            </div>
          </div>
          <div className="level-right">
            <p className="level-item">
              <a href="/more">More</a>
            </p>
            <a className="level-item" href="/other">
              Other
            </a>
          </div>
        </nav>
        <div className="media">
          <figure className="media-left">Avatar</figure>
          <div className="media-content">
            <div className="content is-medium">
              <p>Body copy</p>
            </div>
          </div>
          <div className="media-right">Right</div>
        </div>
      </div>
      <section className="hero is-info is-fullheight-with-navbar">
        <div className="hero-head">Head</div>
        <div className="hero-body">
          <p className="title">Hero title</p>
          <p className="subtitle">Hero subtitle</p>
        </div>
        <div className="hero-foot">Foot</div>
      </section>
      <div className="footer has-text-centered">A footer on a div</div>
    </section>
  );
}
