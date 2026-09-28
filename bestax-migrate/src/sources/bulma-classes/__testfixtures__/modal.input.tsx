export function Dialogs() {
  return (
    <section>
      <div className="modal">
        <div className="modal-background"></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Modal title</p>
            <button className="delete" type="button" aria-label="close"></button>
          </header>
          <section className="modal-card-body has-text-centered">Content</section>
          <footer className="modal-card-foot">
            <div className="buttons">
              <button className="button is-success">Save changes</button>
              <button className="button">Cancel</button>
            </div>
          </footer>
        </div>
      </div>
      <div className="modal">
        <div className="modal-background" />
        <div className="modal-content has-background-white p-4">
          Any content
        </div>
        <button className="modal-close is-large" aria-label="close" />
      </div>
    </section>
  );
}
