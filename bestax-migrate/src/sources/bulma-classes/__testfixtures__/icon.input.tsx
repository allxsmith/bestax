export function Icons() {
  return (
    <section>
      {/* A hidden icon converts with its glyph as props. */}
      <span className="icon is-medium has-text-warning" aria-hidden="true">
        <i className="fa-solid fa-star fa-lg"></i>
      </span>
      {/* Font Awesome 4 keeps its `fa`, which Icon renders as written. */}
      <span className="icon" aria-hidden="true">
        <i className="fa fa-envelope-o"></i>
      </span>
      {/* A named icon is an image, as Icon renders one. */}
      <span className="icon" role="img" aria-label="Verified">
        <i className="mdi mdi-check-decagram"></i>
      </span>
      {/* An <i> with an id of its own stays the icon's child. */}
      <span className="icon" aria-hidden="true">
        <i className="fas fa-moon" id="theme-icon"></i>
      </span>
      {/* So it keeps its own aria-hidden, which only a bare <i> moves up. */}
      <span className="icon">
        <i className="fas fa-sun" id="sun-icon" aria-hidden="true"></i>
      </span>
      <form>
        <div className="field">
          <div className="control has-icons-left has-icons-right">
            <input className="input" type="email" placeholder="Email" />
            {/* Font Awesome's own markup hides the <i>. */}
            <span className="icon is-small is-left">
              <i className="fas fa-envelope" aria-hidden="true"></i>
            </span>
            <span className="icon is-small is-right">
              <i className="fas fa-check"></i>
            </span>
          </div>
        </div>
        <button className="button is-info" type="submit">
          <span className="icon">
            <i className="far fa-bell" aria-hidden="true"></i>
          </span>
          <span>Notify me</span>
        </button>
      </form>
      <div className="buttons">
        {/* Labelled, so the icon is decoration. */}
        <a className="button is-medium" href="https://github.com/" aria-label="GitHub">
          <span className="icon">
            <i className="fab fa-github fa-lg"></i>
          </span>
        </a>
        <button className="button" type="button">
          <span className="icon">
            <i className="fas fa-paper-plane"></i>
          </span>
          <span>Send</span>
        </button>
        {/* Nothing names this link but its icon. */}
        <a className="button" href="https://twitter.com/">
          <span className="icon">
            <i className="fab fa-twitter"></i>
          </span>
        </a>
      </div>
    </section>
  );
}
