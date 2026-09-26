import { useState } from 'react';
import { TEAM } from '../data';

export function Team() {
  const [showHiring, setShowHiring] = useState(true);

  return (
    <section className="section" id="team">
      <div className="container">
        <h2 className="title is-2">Who's behind Lumen</h2>
        {showHiring && (
          <div className="notification is-warning is-light">
            <button
              type="button"
              className="delete"
              aria-label="Dismiss"
              onClick={() => setShowHiring(false)}
            />
            We're hiring: two engineering roles are open this month.
          </div>
        )}
        {TEAM.map(member => (
          <article className="media" key={member.name}>
            <figure className="media-left">
              <p className="image is-64x64">
                <img className="is-rounded" src="/vite.svg" alt="" />
              </p>
            </figure>
            <div className="media-content">
              <div className="content">
                <p>
                  <strong>{member.name}</strong> <small>{member.role}</small>
                  <br />
                  {member.bio}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
