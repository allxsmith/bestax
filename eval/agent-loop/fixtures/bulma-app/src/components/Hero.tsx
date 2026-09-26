export function Hero() {
  const showFeatures = () =>
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="hero is-primary is-medium" id="top">
      <div className="hero-body">
        <div className="container has-text-centered">
          <h1 className="title is-1">
            Dashboards your team will actually read
          </h1>
          <p className="subtitle is-4">
            Lumen turns your product data into weekly reports, alerts and goals.
          </p>
          <div className="buttons is-centered mt-5">
            <a className="button is-light is-medium" href="#pricing">
              See pricing
            </a>
            <button
              type="button"
              className="button is-primary is-inverted is-outlined is-medium"
              onClick={showFeatures}
            >
              How it works
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
