export function Layout() {
  return (
    <section>
      <div className="box is-flex is-gap-1.5 is-row-gap-3">Gaps</div>
      <p className="is-position-sticky is-overflow-y-auto">A sticky note</p>
      <span className="has-radius-rounded is-overflow-x-clip">A pill</span>
      <figure className="is-aspect-ratio-16by9 is-overflow-hidden">Video</figure>
      <div className="grid is-gap-0.5 is-gapless">
        <div className="cell">Grid renders both</div>
      </div>
    </section>
  );
}

export function StaysBeside() {
  return (
    <section>
      <p className="is-gap-2 is-gapless">A gap drops gapless</p>
      <p className="is-relative is-position-absolute is-overlay">
        A position drops relative
      </p>
      <p className="is-overflow-hidden is-overflow-y-auto">
        An axis overflow is written per axis
      </p>
      <div className="columns is-gap-2 is-column-gap-1 is-gapless">
        <div className="column">The gutter is Columns&apos; own gap</div>
      </div>
    </section>
  );
}

export function Bulma09Spacing() {
  return (
    <section className="section is-paddingless">
      <div className="box is-paddingless">Bulma 0.9&apos;s, as v1&apos;s</div>
      <p className="has-text-centered is-marginless">Centered, no margin</p>
      <p className="has-text-centered marginless">v1&apos;s own name stays</p>
    </section>
  );
}

export function Shades() {
  return (
    <section>
      <p className="has-text-primary-on-scheme">On the scheme</p>
      <span className="has-background-info-light has-text-info-dark">
        A light tag
      </span>
      <div className="box has-text-link-30">A darker link color</div>
      <a className="has-text-danger-on-scheme" href="/x">
        A readable link
      </a>
      <p className="has-text-primary-30 has-text-info-40">The second stays</p>
      <p className="has-text-primary-30-invert">No single shade writes it</p>
    </section>
  );
}
