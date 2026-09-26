export function Wrappers() {
  return (
    <section>
      <div className="table-container">
        <table className="table is-striped is-fullwidth">
          <tbody>
            <tr>
              <td>Scrolls on a small screen</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="fixed-grid has-3-cols has-1-cols-mobile">
        <div className="grid is-gap-2">
          <div className="cell">One</div>
          <div className="cell">Two</div>
        </div>
      </div>
      <div className="fixed-grid has-auto-count">
        <div className="grid">
          <div className="cell">Auto</div>
        </div>
      </div>
      <div className="table-container">
        <p>A caption beside the table stays inside the wrapper</p>
        <table className="table">
          <tbody>
            <tr>
              <td>x</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
