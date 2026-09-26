export function Cards() {
  return (
    <div className="columns">
      <div className="column">
        <div className="card has-background-light">
          <header className="card-header">
            <div className="card-header-title is-centered">Built from parts</div>
            <button className="card-header-icon" aria-label="more options">
              More
            </button>
          </header>
          <div className="card-image">
            <img src="/cover.png" alt="Cover" />
          </div>
          <div className="card-content content">Every element converts.</div>
          <footer className="card-footer">
            <span className="card-footer-item">Saved</span>
          </footer>
        </div>
      </div>
      <div className="column">
        <div className="card">
          <header className="card-header">
            <p className="card-header-title">Bulma's own example</p>
          </header>
          <div className="card-content">The title and the links stay.</div>
          <footer className="card-footer">
            <a href="#save" className="card-footer-item">
              Save
            </a>
          </footer>
        </div>
      </div>
      <div className="column">
        <div className="card" />
      </div>
    </div>
  );
}
