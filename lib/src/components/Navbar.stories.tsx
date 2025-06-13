import { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-vite';
import Navbar from './Navbar';
import logo from '../../images/logo.svg';

const meta: Meta<typeof Navbar> = {
  title: 'Components/Navbar',
  component: Navbar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Navbar>;

// Helper for stories with stateful burger/menu
type NavbarColor =
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'black'
  | 'dark'
  | 'light'
  | 'white'
  | undefined;

interface StatefulNavbarBurgerMenuProps {
  color?: NavbarColor;
  transparent?: boolean;
  fixed?: 'top' | 'bottom';
}

const StatefulNavbarBurgerMenu = ({
  color,
  transparent,
  fixed,
}: StatefulNavbarBurgerMenuProps) => {
  const [active, setActive] = useState(false);
  return (
    <Navbar color={color} transparent={transparent} fixed={fixed}>
      <Navbar.Brand>
        <Navbar.Item href="#">
          <img src={logo} alt="Logo" width="112" height="28" />
        </Navbar.Item>
        <Navbar.Burger
          active={active}
          onClick={() => setActive(a => !a)}
          aria-label="menu"
          aria-expanded={active}
          data-testid="burger"
        />
      </Navbar.Brand>
      <Navbar.Menu active={active}>
        <Navbar.Start>
          <Navbar.Item href="#">Home</Navbar.Item>
          <Navbar.Item href="#">Docs</Navbar.Item>
          <Navbar.Item href="#">About</Navbar.Item>
          <Navbar.Item href="#">Contact</Navbar.Item>
        </Navbar.Start>
        <Navbar.End>
          <Navbar.Item href="#">Login</Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  );
};

// Default story: everything
export const Default: Story = {
  render: () => <StatefulNavbarBurgerMenu />,
};

// Brand only
export const BrandOnly: Story = {
  render: () => (
    <Navbar>
      <Navbar.Brand>
        <Navbar.Item href="#">
          <img src={logo} alt="Logo" width="112" height="28" />
        </Navbar.Item>
      </Navbar.Brand>
    </Navbar>
  ),
};

// Navbar burger only
export const BurgerOnly: Story = {
  render: () => (
    <Navbar>
      <Navbar.Burger aria-label="menu" aria-expanded={false} />
    </Navbar>
  ),
};

// Navbar burger is-active
export const BurgerActive: Story = {
  render: () => (
    <Navbar>
      <Navbar.Burger active aria-label="menu" aria-expanded />
    </Navbar>
  ),
};

// Navbar menu with start and end
export const MenuStartEnd: Story = {
  render: () => (
    <Navbar>
      <Navbar.Menu active>
        <Navbar.Start>
          <Navbar.Item href="#">Home</Navbar.Item>
        </Navbar.Start>
        <Navbar.End>
          <Navbar.Item href="#">Login</Navbar.Item>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  ),
};

// Navbar items - navigation links, brand logo, parent of dropdown
export const ItemsNavLinksAndDropdown: Story = {
  render: () => (
    <Navbar>
      <Navbar.Brand>
        <Navbar.Item>
          <img src={logo} alt="Logo" width="112" height="28" />
        </Navbar.Item>
      </Navbar.Brand>
      <Navbar.Menu active>
        <Navbar.Start>
          <Navbar.Item href="#">Home</Navbar.Item>
          <Navbar.Item href="#">Docs</Navbar.Item>
          <Navbar.Dropdown hoverable>
            <Navbar.Item as="a">More</Navbar.Item>
            <Navbar.DropdownMenu>
              <Navbar.Item href="#">About</Navbar.Item>
              <Navbar.Item href="#">Jobs</Navbar.Item>
              <Navbar.Item href="#">Contact</Navbar.Item>
              <Navbar.Divider />
              <Navbar.Item href="#">Report an issue</Navbar.Item>
            </Navbar.DropdownMenu>
          </Navbar.Dropdown>
        </Navbar.Start>
      </Navbar.Menu>
    </Navbar>
  ),
};

// Transparent navbar
export const Transparent: Story = {
  render: () => <StatefulNavbarBurgerMenu transparent />,
};

// Fixed navbar
export const FixedTop: Story = {
  render: () => <StatefulNavbarBurgerMenu fixed="top" />,
};

// Dropdown navbar
export const Dropdown: Story = {
  render: () => (
    <Navbar>
      <Navbar.Menu active>
        <Navbar.Start>
          <Navbar.Dropdown hoverable>
            <Navbar.Item as="a">Dropdown</Navbar.Item>
            <Navbar.DropdownMenu>
              <Navbar.Item href="#">First</Navbar.Item>
              <Navbar.Item href="#">Second</Navbar.Item>
              <Navbar.Item href="#">Third</Navbar.Item>
            </Navbar.DropdownMenu>
          </Navbar.Dropdown>
        </Navbar.Start>
      </Navbar.Menu>
    </Navbar>
  ),
};

// Dropdown right
export const DropdownRight: Story = {
  render: () => (
    <Navbar>
      <Navbar.Menu active>
        <Navbar.End>
          <Navbar.Dropdown hoverable right>
            <Navbar.Item as="a">Right Dropdown</Navbar.Item>
            <Navbar.DropdownMenu right>
              <Navbar.Item href="#">Profile</Navbar.Item>
              <Navbar.Item href="#">Settings</Navbar.Item>
            </Navbar.DropdownMenu>
          </Navbar.Dropdown>
        </Navbar.End>
      </Navbar.Menu>
    </Navbar>
  ),
};

// Dropup
export const Dropup: Story = {
  render: () => (
    <Navbar>
      <Navbar.Menu active>
        <Navbar.Start>
          <Navbar.Dropdown hoverable up>
            <Navbar.Item as="a">Dropup</Navbar.Item>
            <Navbar.DropdownMenu up>
              <Navbar.Item href="#">Up1</Navbar.Item>
              <Navbar.Item href="#">Up2</Navbar.Item>
            </Navbar.DropdownMenu>
          </Navbar.Dropdown>
        </Navbar.Start>
      </Navbar.Menu>
    </Navbar>
  ),
};

// Dropdown without arrow
export const DropdownNoArrow: Story = {
  render: () => (
    <Navbar>
      <Navbar.Menu active>
        <Navbar.Start>
          <Navbar.Dropdown hoverable className="no-arrow">
            <Navbar.Item as="a">No Arrow</Navbar.Item>
            <Navbar.DropdownMenu>
              <Navbar.Item href="#">A</Navbar.Item>
              <Navbar.Item href="#">B</Navbar.Item>
            </Navbar.DropdownMenu>
          </Navbar.Dropdown>
        </Navbar.Start>
      </Navbar.Menu>
    </Navbar>
  ),
};

// Active dropdown navbar item
export const ActiveDropdownItem: Story = {
  render: () => (
    <Navbar>
      <Navbar.Menu active>
        <Navbar.Start>
          <Navbar.Dropdown active>
            <Navbar.Item as="a">Active Dropdown</Navbar.Item>
            <Navbar.DropdownMenu>
              <Navbar.Item href="#">A1</Navbar.Item>
              <Navbar.Item href="#">A2</Navbar.Item>
            </Navbar.DropdownMenu>
          </Navbar.Dropdown>
        </Navbar.Start>
      </Navbar.Menu>
    </Navbar>
  ),
};

// Dropdown divider
export const DropdownWithDivider: Story = {
  render: () => (
    <Navbar>
      <Navbar.Menu active>
        <Navbar.Start>
          <Navbar.Dropdown hoverable>
            <Navbar.Item as="a">With Divider</Navbar.Item>
            <Navbar.DropdownMenu>
              <Navbar.Item href="#">One</Navbar.Item>
              <Navbar.Item href="#">Two</Navbar.Item>
              <Navbar.Divider />
              <Navbar.Item href="#">Three</Navbar.Item>
            </Navbar.DropdownMenu>
          </Navbar.Dropdown>
        </Navbar.Start>
      </Navbar.Menu>
    </Navbar>
  ),
};

// Color modifier stories
export const Primary: Story = {
  render: () => <StatefulNavbarBurgerMenu color="primary" />,
};
export const Link: Story = {
  render: () => <StatefulNavbarBurgerMenu color="link" />,
};
export const Info: Story = {
  render: () => <StatefulNavbarBurgerMenu color="info" />,
};
export const Success: Story = {
  render: () => <StatefulNavbarBurgerMenu color="success" />,
};
export const Warning: Story = {
  render: () => <StatefulNavbarBurgerMenu color="warning" />,
};
export const Danger: Story = {
  render: () => <StatefulNavbarBurgerMenu color="danger" />,
};
export const Black: Story = {
  render: () => <StatefulNavbarBurgerMenu color="black" />,
};
export const Dark: Story = {
  render: () => <StatefulNavbarBurgerMenu color="dark" />,
};
export const Light: Story = {
  render: () => <StatefulNavbarBurgerMenu color="light" />,
};
export const White: Story = {
  render: () => <StatefulNavbarBurgerMenu color="white" />,
};
