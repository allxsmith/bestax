export function Sections() {
  return (
    <section>
      <div className="tabs is-centered is-boxed">
        <ul>
          <li className="is-active">
            <a>Pictures</a>
          </li>
          <li>
            <a>Music</a>
          </li>
        </ul>
      </div>
      <div className="tabs is-toggle is-toggle-rounded is-fullwidth mt-2">
        <ul>
          <li>
            <a>
              <span className="icon is-small" aria-hidden="true">
                <i className="fas fa-image" aria-hidden="true"></i>
              </span>
              <span>Pictures</span>
            </a>
          </li>
        </ul>
      </div>
      <span className="icon has-text-info" role="img" aria-label="Info">
        <i className="fas fa-info-circle"></i>
      </span>
      <span className="icon">
        <i className="fas fa-home"></i>
      </span>
    </section>
  );
}
