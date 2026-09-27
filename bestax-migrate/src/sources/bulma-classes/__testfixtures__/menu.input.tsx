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
