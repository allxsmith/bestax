import type { ComponentProps } from 'react';
import { createLink } from '@tanstack/react-router';
import { Navbar } from '@allxsmith/bestax-bulma';

// Navbar.Item made into a TanStack Router link, so each `to` is checked
// against the routes. `<Navbar.Item as={Link}>` compiles too, but stops
// checking `to`. TanStack adds aria-current="page" to the active link itself,
// and activeProps={{ active: true }} gives it Bulma's is-active, through
// bestax so a class prefix applies.
const NavbarLink = createLink(
  (props: ComponentProps<typeof Navbar.Item<'a'>>) => <Navbar.Item {...props} />
);

export default NavbarLink;
