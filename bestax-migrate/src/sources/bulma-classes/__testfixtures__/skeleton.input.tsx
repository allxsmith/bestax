export function Placeholder() {
  return (
    <div className="box">
      <div className="skeleton-block mb-3">Loading the heading</div>
      <div className="skeleton-lines">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div className="skeleton-lines">
        <div className="is-short"></div>
        <div></div>
      </div>
    </div>
  );
}
