import { Menu, UnorderedList } from '@allxsmith/bestax-bulma';

export function Sidebar({
  pages = ['Billing', 'Invoices'],
}: {
  pages?: string[];
}) {
  // TODO(bestax-migrate): bestax `Menu.Item` renders the <a> inside the <li> itself, and the <ul> after it as a `Menu.List`, which this converts only bare and holding its items, as Bulma nests one; keep this element as markup, or convert it by hand
  // TODO(bestax-migrate): bestax `Menu.List` renders `.menu-list` only when no other `Menu.List` is around it, and this element sits inside another `.menu-list`, so it would lose the class; keep it as markup
  return (
    <Menu mt="4">
      <Menu.Label textWeight="bold">General</Menu.Label>
      <Menu.List>
        <Menu.Item active>Dashboard</Menu.Item>
        <Menu.Item>
          Team
          <Menu.List>
            <Menu.Item>Members</Menu.Item>
          </Menu.List>
        </Menu.Item>
        {pages.map(page => (
          <Menu.Item key={page}>{page}</Menu.Item>
        ))}
      </Menu.List>
      <Menu.Label>Account</Menu.Label>
      <Menu.List>
        <li>
          <a>Settings</a>
          <ul className="menu-list">
            <Menu.Item>A nested list keeps its class only as markup</Menu.Item>
          </ul>
        </li>
      </Menu.List>
    </Menu>
  );
}

export function ItemAttributes() {
  return (
    <Menu.List>
      <Menu.Item
        className="my-item has-text-danger"
        id="home"
        title="Home"
        role="menuitem"
        tabIndex={0}
        style={{ fontWeight: 'bold' }}
        data-testid="home-item"
        active
        href="/home"
        aria-current="page"
        ref={() => {}}>
        <span>Home</span> page
      </Menu.Item>
      <Menu.Item href="/docs">
        Docs
        <Menu.List>
          <Menu.Item href="/docs/start">
            {" Start"}
            <Menu.List>
              <Menu.Item href="/docs/start/install">Install</Menu.Item>
            </Menu.List>
          </Menu.Item>
          <Menu.Item href="/docs/faq">
            {"Q & A"}
            <Menu.List>
              <Menu.Item>
                <strong>Why</strong> this?
              </Menu.Item>
            </Menu.List>
          </Menu.Item>
          <Menu.Item>
            <strong>Tips</strong>{" and tricks"}
            <Menu.List>
              <Menu.Item>First</Menu.Item>
            </Menu.List>
          </Menu.Item>
        </Menu.List>
      </Menu.Item>
    </Menu.List>
  );
}

export function ItemRefusals() {
  const active = true;
  // TODO(bestax-migrate): bestax `Menu.Item` puts `className`, `id`, `title`, `role`, `tabIndex`, `style` and `data-testid` on the <li>, and everything else on the <a> inside, so this element's `onClick` would move there; keep this element as markup
  // TODO(bestax-migrate): bestax `Menu.Item` puts `title` on the <li>, so the <a>'s would move there; keep this element as markup
  // TODO(bestax-migrate): bestax `Menu.Item` renders the <a> inside the <li> itself, with no class on it but `is-active`, so its `my-link` would be lost; keep this element as markup
  // TODO(bestax-migrate): the <a> inside has an empty `className`, which renders `class=""`, and bestax `Menu.Item` renders it with no class attribute; drop the empty `className`, then re-run
  // TODO(bestax-migrate): the <a> inside has a computed `className`, which the codemod does not read there; convert the two to bestax `Menu.Item` by hand, turning each condition into its prop
  // TODO(bestax-migrate): bestax `Menu.Item` renders the <a> inside the <li> itself, and a `Menu.List` after it from among its children, so this element converts only around a single <a>, and at most one <ul> after it, with nothing else beside them
  // TODO(bestax-migrate): bestax `Menu.Item` renders the <a> inside the <li> itself, and the <ul> after it as a `Menu.List`, which this converts only bare and holding its items, as Bulma nests one; keep this element as markup, or convert it by hand
  // TODO(bestax-migrate): bestax `Menu.Item` requires children, and renders the <a>'s as its own, so this element converts only when the <a> inside holds something; keep it as markup
  return (
    <Menu.List>
      <li onClick={() => {}}>
        <a>Its onClick would move to the link</a>
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
        <UnorderedList mt="2">
          <li>
            <a>Inside it</a>
          </li>
        </UnorderedList>
      </li>
      <li>
        <a></a>
      </li>
      <li>
        <button type="button">A button item</button>
      </li>
    </Menu.List>
  );
}

export function InsideAList(props: Record<string, string>) {
  // TODO(bestax-migrate): this element spreads props, which bestax `Menu.List` may read differently than the element did (a spread `className` merges with its classes instead of replacing them); convert it to `Menu.List` by hand
  // TODO(bestax-migrate): bestax `Menu.Item` renders the list nested in it as a `Menu.List`, which renders `.menu-list` unless another `Menu.List` is around it, and no list around this element is one or becomes one here; keep it as markup, or convert the list around it first, then re-run
  return (
    <Menu>
      <ul className="menu-list" {...props}>
        <Menu.Item>Converts, since it needs no list around it</Menu.Item>
        <li>
          <a>Stays, since its nested list would render the class</a>
          <ul>
            <Menu.Item>Converts on its own</Menu.Item>
          </ul>
        </li>
      </ul>
      <Menu.List>
        <Menu.Item>
          Inside a Menu.List already in the file
          <Menu.List>
            <Menu.Item>Nested</Menu.Item>
          </Menu.List>
        </Menu.Item>
      </Menu.List>
    </Menu>
  );
}
