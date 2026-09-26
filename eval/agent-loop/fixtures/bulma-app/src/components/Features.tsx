import { FEATURES } from '../data';

export function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <h2 className="title is-2 has-text-centered">
          Everything in one place
        </h2>
        <p className="subtitle is-5 has-text-centered has-text-grey mb-6">
          Three tools, one login, no spreadsheets.
        </p>
        <div className="columns is-multiline">
          {FEATURES.map(feature => (
            <div className="column is-one-third" key={feature.title}>
              <div className="card">
                <header className="card-header">
                  <p className="card-header-title">{feature.title}</p>
                </header>
                <div className="card-content">
                  <div className="content">
                    <p>{feature.body}</p>
                  </div>
                  <div className="tags">
                    {feature.tags.map(tag => (
                      <span className="tag is-info is-light" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
