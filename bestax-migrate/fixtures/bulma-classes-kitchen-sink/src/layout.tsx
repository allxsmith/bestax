export function Layout() {
  return (
    <section className="section is-large">
      <nav
        className="navbar is-primary is-fixed-top has-shadow"
        role="navigation"
        aria-label="main navigation"
      >
        <div className="navbar-brand">
          <a className="navbar-item" href="/">
            Brand
          </a>
        </div>
        <div className="navbar-menu is-active">
          <div className="navbar-start">
            <a className="navbar-item is-active" href="/docs">
              Docs
            </a>
            <div className="navbar-item has-dropdown is-hoverable">
              <div className="navbar-dropdown is-right">
                <a className="navbar-item" href="/about">
                  About
                </a>
                <hr className="navbar-divider" />
                <a className="navbar-item" href="/jobs">
                  Jobs
                </a>
              </div>
            </div>
          </div>
          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">
                <a className="button is-light" href="/login">
                  Log in
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="container is-fluid">
        <div className="columns is-multiline is-centered is-3">
          <div className="column is-one-third is-offset-1">One third</div>
          <div className="column is-6-tablet is-4-desktop is-offset-2-desktop">
            Responsive
          </div>
          <div className="column is-narrow is-narrow-touch">Narrow</div>
        </div>
        <div className="grid is-column-gap-3 is-row-gap-1 is-col-min-10">
          <div className="cell is-col-span-2 is-row-span-2">Wide</div>
          <div className="cell is-col-start-3">Third column</div>
          <div className="cell is-row-from-end-1 mt-2">Last row</div>
        </div>
        <div className="fixed-grid has-2-cols has-1-cols-mobile">
          <div className="grid">
            <div className="cell">Fixed</div>
            <div className="cell">Columns</div>
          </div>
        </div>
        <div className="table-container">
          <table className="table is-narrow">
            <tbody>
              <tr>
                <td>Responsive</td>
              </tr>
            </tbody>
          </table>
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
