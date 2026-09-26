import { useState, type FormEvent } from 'react';

export function Contact() {
  const [sent, setSent] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <section className="section" id="contact">
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-half">
            <h2 className="title is-3">Talk to sales</h2>
            <form onSubmit={submit}>
              <div className="field">
                <label className="label" htmlFor="name">
                  Name
                </label>
                <div className="control">
                  <input
                    id="name"
                    className="input"
                    type="text"
                    placeholder="Ada Lovelace"
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label className="label" htmlFor="email">
                  Work email
                </label>
                <div className="control">
                  <input
                    id="email"
                    className="input"
                    type="email"
                    placeholder="ada@example.com"
                    required
                  />
                </div>
                <p className="help">We reply within one business day.</p>
              </div>
              <div className="field">
                <label className="label" htmlFor="size">
                  Team size
                </label>
                <div className="control">
                  <div className="select is-fullwidth">
                    <select id="size">
                      <option>1 to 10</option>
                      <option>11 to 50</option>
                      <option>51 or more</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="label" htmlFor="message">
                  Message
                </label>
                <div className="control">
                  <textarea id="message" className="textarea" rows={4} />
                </div>
              </div>
              <div className="field">
                <div className="control">
                  <label className="checkbox">
                    <input type="checkbox" /> Send me the monthly product update
                  </label>
                </div>
              </div>
              <div className="field is-grouped">
                <div className="control">
                  <button type="submit" className="button is-primary">
                    Send
                  </button>
                </div>
                <div className="control">
                  <button type="reset" className="button is-light">
                    Clear
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className={`modal ${sent ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setSent(false)} />
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Thanks for reaching out</p>
            <button
              type="button"
              className="delete"
              aria-label="close"
              onClick={() => setSent(false)}
            />
          </header>
          <section className="modal-card-body">
            We got your message and will be in touch soon.
          </section>
          <footer className="modal-card-foot">
            <button
              type="button"
              className="button is-success"
              onClick={() => setSent(false)}
            >
              Done
            </button>
          </footer>
        </div>
      </div>
    </section>
  );
}
