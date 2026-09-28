import { Menu } from '@allxsmith/bestax-bulma';

export function Sidebar({
  pages = ['Billing', 'Invoices'],
}: {
  pages?: string[];
}) {
  return (
    <aside className="menu mt-4">
      <p className="menu-label has-text-weight-bold">General</p>
      <ul className="menu-list">
        <li>
          <a className="is-active">Dashboard</a>
        </li>
        <li>
          <a>Team</a>
          <ul>
            <li>
              <a>Members</a>
            </li>
          </ul>
        </li>
        {pages.map(page => (
          <li key={page}>
            <a>{page}</a>
          </li>
        ))}
      </ul>
      <p className="menu-label">Account</p>
      <ul className="menu-list">
        <li>
          <a>Settings</a>
          <ul className="menu-list">
            <li>
              <a>A nested list keeps its class only as markup</a>
            </li>
          </ul>
        </li>
      </ul>
    </aside>
  );
}

export function ItemAttributes() {
  return (
    <ul className="menu-list">
      <li
        className="my-item has-text-danger"
        id="home"
        title="Home"
        role="menuitem"
        tabIndex="0"
        style={{ fontWeight: 'bold' }}
        data-testid="home-item"
      >
        <a
          className="is-active"
          href="/home"
          aria-current="page"
          ref={() => {}}
        >
          <span>Home</span> page
        </a>
      </li>
      <li>
        <a href="/docs">
          Docs
        </a>
        <ul>
          <li>
            <a href="/docs/start"> Start</a>
            <ul>
              <li>
                <a href="/docs/start/install">Install</a>
              </li>
            </ul>
          </li>
          <li>
            <a href="/docs/faq">Q &amp; A</a>
            <ul>
              <li>
                <a>
                  <strong>Why</strong> this?
                </a>
              </li>
            </ul>
          </li>
          <li>
            <a>
              <strong>Tips</strong> and tricks
            </a>
            <ul>
              <li>
                <a>First</a>
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  );
}

export function ItemRefusals() {
  const active = true;
  return (
    <ul className="menu-list">
      <li onClick={() => {}}>
        <a>Its onClick would move to the link</a>
      </li>
      <li className="">
        <a>An empty class on the item</a>
      </li>
      <li>
        <a title="Would move to the item">A title on the link</a>
      </li>
      <li>
        <a className="my-link">Another class on the link</a>
      </li>
      <li>
        <a className="">An empty class on the link</a>
      </li>
      <li>
        <a className={active ? 'is-active' : undefined}>A computed class</a>
      </li>
      <li>
        <a>Text beside the link</a> and more
      </li>
      <li>
        <a>A nested list with a class</a>
        <ul className="mt-2">
          <li>
            <a>Inside it</a>
          </li>
        </ul>
      </li>
      <li>
        <a></a>
      </li>
      <li>
        <button type="button">A button item</button>
      </li>
    </ul>
  );
}

export function InsideAList(props: Record<string, string>) {
  return (
    <aside className="menu">
      <ul className="menu-list" {...props}>
        <li>
          <a>Converts, since it needs no list around it</a>
        </li>
        <li>
          <a>Stays, since its nested list would render the class</a>
          <ul>
            <li>
              <a>Converts on its own</a>
            </li>
          </ul>
        </li>
      </ul>
      <Menu.List>
        <li>
          <a>Inside a Menu.List already in the file</a>
          <ul>
            <li>
              <a>Nested</a>
            </li>
          </ul>
        </li>
      </Menu.List>
    </aside>
  );
}
