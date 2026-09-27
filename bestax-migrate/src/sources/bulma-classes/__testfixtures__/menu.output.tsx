import { Menu } from "@allxsmith/bestax-bulma";
export function Sidebar({
  pages = ['Billing', 'Invoices'],
}: {
  pages?: string[];
}) {
  // TODO(bestax-migrate): bestax `Menu.List` renders `.menu-list` only when no other `Menu.List` is around it, and this element sits inside another `.menu-list`, so it would lose the class; keep it as markup
  return (
    <Menu mt="4">
      <Menu.Label textWeight="bold">General</Menu.Label>
      <Menu.List>
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
      </Menu.List>
      <Menu.Label>Account</Menu.Label>
      <Menu.List>
        <li>
          <a>Settings</a>
          <ul className="menu-list">
            <li>
              <a>A nested list keeps its class only as markup</a>
            </li>
          </ul>
        </li>
      </Menu.List>
    </Menu>
  );
}
