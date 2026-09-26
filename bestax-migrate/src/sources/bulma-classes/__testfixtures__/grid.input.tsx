export function Gallery() {
  return (
    <section>
      <div className="grid is-gap-2 is-col-min-8">
        <div className="cell">One</div>
        <div className="cell is-col-span-2">Two, spanning</div>
        <div className="cell is-row-start-2 is-col-from-end-1">Three</div>
        <div className="cell has-background-light">Four</div>
      </div>
      <div className="grid is-gap-0.5">
        <div className="cell">A half-step gap stays a class</div>
      </div>
      <div className="fixed-grid has-3-cols">
        <div className="grid">
          <div className="cell">Fixed</div>
        </div>
      </div>
    </section>
  );
}
