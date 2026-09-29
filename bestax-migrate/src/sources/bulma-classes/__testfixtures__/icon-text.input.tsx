export function IconTexts() {
  return (
    <section>
      <span className="icon-text">
        <span className="icon" aria-label="Home">
          <i className="fas fa-home"></i>
        </span>
        <span>Home</span>
      </span>
      <span className="icon-text has-text-success" id="saved">
        <span className="icon is-small has-text-info" aria-label="Saved">
          <i className="far fa-check-circle fa-lg"></i>
        </span>
        <span>Saved &amp; synced</span>
      </span>
      <span className="icon-text">
        <span className="icon" aria-label="Train">
          <i className="fas fa-train"></i>
        </span>
        <span>Paris</span>
        <span className="icon" aria-label="To">
          <i className="fas fa-arrow-right"></i>
        </span>
        <span>Budapest</span>
        <span className="icon" aria-label="Done">
          <i className="mdi mdi-check-bold mdi-24px"></i>
        </span>
      </span>
      <span className="icon-text">
        <span className="icon" aria-label="Star">
          <i className="fa-solid fa-star"></i>
        </span>
      </span>
      {/* The glyph has an attribute Icon doesn't render. */}
      <span className="icon-text">
        <span className="icon" aria-label="Info">
          <i className="fas fa-info-circle" aria-hidden="true"></i>
        </span>
        <span>Info</span>
      </span>
      {/* The icon has no aria-label, which Icon writes. */}
      <span className="icon-text">
        <span className="icon">
          <i className="fas fa-home"></i>
        </span>
        <span>Home</span>
      </span>
      {/* IconText renders a <span>, not a <div>. */}
      <div className="icon-text">
        <span className="icon" aria-label="Warning">
          <i className="fas fa-exclamation-triangle"></i>
        </span>
        <span>Warning</span>
      </div>
      {/* Text before the icon. */}
      <span className="icon-text">
        <span>Next</span>
        <span className="icon" aria-label="Next">
          <i className="fas fa-arrow-right"></i>
        </span>
      </span>
    </section>
  );
}
