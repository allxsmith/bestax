import { useState } from 'react';

export function SiteNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="navbar is-primary"
      role="navigation"
      aria-label="main navigation"
    >
      <div className="container">
        <div className="navbar-brand">
          <a className="navbar-item has-text-weight-bold" href="#top">
            Lumen
          </a>
          <a
            role="button"
            className={`navbar-burger ${open ? 'is-active' : ''}`}
            aria-label="menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </a>
        </div>
        <div className={`navbar-menu ${open ? 'is-active' : ''}`}>
          <div className="navbar-start">
            <a className="navbar-item" href="#features">
              Features
            </a>
            <a className="navbar-item" href="#pricing">
              Pricing
            </a>
            <a className="navbar-item" href="#team">
              Team
            </a>
          </div>
          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">
                <a className="button is-light" href="#contact">
                  Contact sales
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
