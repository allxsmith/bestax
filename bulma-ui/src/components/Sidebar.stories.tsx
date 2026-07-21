import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from './Menu';
import { Box } from '../elements/Box';
import { Message } from './Message';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Content } from '../elements/Content';
import { Delete } from '../elements/Delete';
import { Image } from '../elements/Image';
import { Paragraph } from '../elements/Paragraph';
import { Span } from '../elements/Span';
import { Strong } from '../elements/Strong';
import { SubTitle } from '../elements/SubTitle';
import { Title } from '../elements/Title';
import { Checkbox } from '../form/Checkbox';
import { Control } from '../form/Control';
import { Field } from '../form/Field';
import { Input } from '../form/Input';
import { Radio } from '../form/Radio';
import { Select } from '../form/Select';
import { Level } from '../layout/Level';
import { Media } from '../layout/Media';
import { Section } from '../layout/Section';
import { Block } from '../elements/Block';

const meta: Meta<typeof Sidebar> = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A slide-out navigation panel that appears from the left or right side of the screen. Supports overlay, keyboard navigation, and various customization options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the sidebar is open',
    },
    position: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Which side the sidebar appears from',
    },
    width: {
      control: 'text',
      description: 'Custom width (e.g., "300px", "80%")',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Sidebar takes full width',
    },
    overlay: {
      control: 'boolean',
      description: 'Show overlay behind sidebar',
    },
    overlayClose: {
      control: 'boolean',
      description: 'Close sidebar when overlay is clicked',
    },
    escapeClose: {
      control: 'boolean',
      description: 'Close sidebar on Escape key',
    },
    canCancel: {
      control: 'boolean',
      description: 'Allow closing the sidebar',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

/**
 * Basic sidebar with navigation menu.
 */
export const Default: Story = {
  render: function DefaultExample() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Section>
        <Button color="primary" onClick={() => setIsOpen(true)}>
          Open Sidebar
        </Button>
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <Sidebar.Header>
            <Sidebar.Title>Menu</Sidebar.Title>
            <Sidebar.Close onClick={() => setIsOpen(false)} />
          </Sidebar.Header>
          <Sidebar.Body>
            <Menu>
              <Menu.Label>General</Menu.Label>
              <Menu.List>
                <Menu.Item active href="#">
                  Dashboard
                </Menu.Item>
                <Menu.Item href="#">Customers</Menu.Item>
              </Menu.List>
              <Menu.Label>Administration</Menu.Label>
              <Menu.List>
                <Menu.Item href="#">Team Settings</Menu.Item>
                <Menu.Item href="#">Manage Your Team</Menu.Item>
                <Menu.Item href="#">Invitations</Menu.Item>
              </Menu.List>
            </Menu>
          </Sidebar.Body>
        </Sidebar>
      </Section>
    );
  },
};

/**
 * Sidebar appearing from the right side.
 */
export const RightPosition: Story = {
  render: function RightExample() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Section>
        <Button color="info" onClick={() => setIsOpen(true)}>
          Open Right Sidebar
        </Button>
        <Sidebar
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position="right"
        >
          <Sidebar.Header>
            <Sidebar.Title>Settings</Sidebar.Title>
            <Sidebar.Close onClick={() => setIsOpen(false)} />
          </Sidebar.Header>
          <Sidebar.Body>
            <Paragraph mb="4">Configure your preferences here.</Paragraph>
            <Field label="Theme">
              <Control>
                <Select className="is-fullwidth">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>System</option>
                </Select>
              </Control>
            </Field>
            <Field>
              <Checkbox> Enable notifications</Checkbox>
            </Field>
          </Sidebar.Body>
        </Sidebar>
      </Section>
    );
  },
};

/**
 * Custom width sidebar.
 */
export const CustomWidth: Story = {
  render: function CustomWidthExample() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Section>
        <Button color="success" onClick={() => setIsOpen(true)}>
          Open Wide Sidebar
        </Button>
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} width="400px">
          <Sidebar.Header>
            <Sidebar.Title>Wide Panel</Sidebar.Title>
            <Sidebar.Close onClick={() => setIsOpen(false)} />
          </Sidebar.Header>
          <Sidebar.Body>
            <Content>
              <p>This sidebar has a custom width of 400px.</p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </Content>
          </Sidebar.Body>
        </Sidebar>
      </Section>
    );
  },
};

/**
 * Full-width sidebar (mobile-style).
 */
export const FullWidth: Story = {
  render: function FullWidthExample() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Section>
        <Button color="warning" onClick={() => setIsOpen(true)}>
          Open Full Width
        </Button>
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} fullWidth>
          <Sidebar.Header>
            <Sidebar.Title>Full Width Panel</Sidebar.Title>
            <Sidebar.Close onClick={() => setIsOpen(false)} />
          </Sidebar.Header>
          <Sidebar.Body>
            <Content>
              <p>
                This sidebar takes up the full screen width, ideal for mobile
                views.
              </p>
              <Button color="primary" mt="4" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </Content>
          </Sidebar.Body>
        </Sidebar>
      </Section>
    );
  },
};

/**
 * Sidebar without overlay.
 */
export const NoOverlay: Story = {
  render: function NoOverlayExample() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Section>
        <Button color="link" onClick={() => setIsOpen(true)}>
          Open Without Overlay
        </Button>
        <Paragraph mt="4">
          You can still interact with the page content when the sidebar is open.
        </Paragraph>
        <Sidebar
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          overlay={false}
        >
          <Sidebar.Header>
            <Sidebar.Title>No Overlay</Sidebar.Title>
            <Sidebar.Close onClick={() => setIsOpen(false)} />
          </Sidebar.Header>
          <Sidebar.Body>
            <Menu>
              <Menu.List>
                <Menu.Item href="#">Home</Menu.Item>
                <Menu.Item href="#">About</Menu.Item>
                <Menu.Item href="#">Contact</Menu.Item>
              </Menu.List>
            </Menu>
          </Sidebar.Body>
        </Sidebar>
      </Section>
    );
  },
};

/**
 * Non-dismissible sidebar.
 */
export const NonDismissible: Story = {
  render: function NonDismissibleExample() {
    const [isOpen, setIsOpen] = useState(false);
    const [agreed, setAgreed] = useState(false);

    return (
      <Section>
        <Button
          color="danger"
          onClick={() => {
            setIsOpen(true);
            setAgreed(false);
          }}
        >
          Open Terms Panel
        </Button>
        <Sidebar
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          overlayClose={false}
          escapeClose={false}
          canCancel={agreed}
        >
          <Sidebar.Header>
            <Sidebar.Title>Terms of Service</Sidebar.Title>
          </Sidebar.Header>
          <Sidebar.Body>
            <Content>
              <p>Please read and accept our terms of service to continue.</p>
              <Box mt="4" style={{ maxHeight: '200px', overflow: 'auto' }}>
                <Paragraph>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit...
                </Paragraph>
                <Paragraph>
                  Sed do eiusmod tempor incididunt ut labore...
                </Paragraph>
                <Paragraph>
                  Et dolore magna aliqua ut enim ad minim veniam...
                </Paragraph>
              </Box>
              <Field mt="4">
                <Checkbox
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                >
                  {' '}
                  I agree to the terms of service
                </Checkbox>
              </Field>
              <Button
                color="primary"
                disabled={!agreed}
                onClick={() => setIsOpen(false)}
                mt="4"
              >
                Continue
              </Button>
            </Content>
          </Sidebar.Body>
        </Sidebar>
      </Section>
    );
  },
};

/**
 * Sidebar with footer.
 */
export const WithFooter: Story = {
  render: function WithFooterExample() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Section>
        <Button color="primary" onClick={() => setIsOpen(true)}>
          Open With Footer
        </Button>
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <Sidebar.Header>
            <Sidebar.Title>Navigation</Sidebar.Title>
            <Sidebar.Close onClick={() => setIsOpen(false)} />
          </Sidebar.Header>
          <Sidebar.Body>
            <Menu>
              <Menu.Label>Pages</Menu.Label>
              <Menu.List>
                <Menu.Item active href="#">
                  Home
                </Menu.Item>
                <Menu.Item href="#">Products</Menu.Item>
                <Menu.Item href="#">Services</Menu.Item>
                <Menu.Item href="#">Blog</Menu.Item>
                <Menu.Item href="#">Contact</Menu.Item>
              </Menu.List>
            </Menu>
          </Sidebar.Body>
          <Sidebar.Footer>
            <Paragraph textSize="7" textColor="grey">
              © 2024 Company Name
            </Paragraph>
          </Sidebar.Footer>
        </Sidebar>
      </Section>
    );
  },
};

/**
 * Multiple sidebars (left and right).
 */
export const MultipleSidebars: Story = {
  render: function MultipleSidebarsExample() {
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);

    return (
      <Section>
        <Buttons>
          <Button color="primary" onClick={() => setLeftOpen(true)}>
            Open Left Menu
          </Button>
          <Button color="info" onClick={() => setRightOpen(true)}>
            Open Right Panel
          </Button>
        </Buttons>
        <Sidebar
          isOpen={leftOpen}
          onClose={() => setLeftOpen(false)}
          position="left"
        >
          <Sidebar.Header>
            <Sidebar.Title>Menu</Sidebar.Title>
            <Sidebar.Close onClick={() => setLeftOpen(false)} />
          </Sidebar.Header>
          <Sidebar.Body>
            <Menu>
              <Menu.List>
                <Menu.Item href="#">Dashboard</Menu.Item>
                <Menu.Item href="#">Analytics</Menu.Item>
                <Menu.Item href="#">Reports</Menu.Item>
              </Menu.List>
            </Menu>
          </Sidebar.Body>
        </Sidebar>
        <Sidebar
          isOpen={rightOpen}
          onClose={() => setRightOpen(false)}
          position="right"
        >
          <Sidebar.Header>
            <Sidebar.Title>Notifications</Sidebar.Title>
            <Sidebar.Close onClick={() => setRightOpen(false)} />
          </Sidebar.Header>
          <Sidebar.Body>
            <Message color="info" mb="2">
              New message received
            </Message>
            <Message color="success" mb="2">
              Order completed
            </Message>
            <Message color="warning">Low inventory alert</Message>
          </Sidebar.Body>
        </Sidebar>
      </Section>
    );
  },
};

const svgToDataUri = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(svg)}`;

const toyCarImage = svgToDataUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#fef3e2" rx="8"/><rect x="10" y="28" width="44" height="14" fill="#e74c3c" rx="4"/><rect x="18" y="20" width="24" height="12" fill="#c0392b" rx="3"/><rect x="20" y="22" width="9" height="7" fill="#85c1e9" rx="1"/><rect x="31" y="22" width="9" height="7" fill="#85c1e9" rx="1"/><circle cx="20" cy="44" r="5" fill="#2c3e50"/><circle cx="44" cy="44" r="5" fill="#2c3e50"/><circle cx="20" cy="44" r="2" fill="#7f8c8d"/><circle cx="44" cy="44" r="2" fill="#7f8c8d"/></svg>`
);

const toyRobotImage = svgToDataUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#eaf2f8" rx="8"/><line x1="32" y1="8" x2="32" y2="14" stroke="#5dade2" stroke-width="2"/><circle cx="32" cy="7" r="2.5" fill="#e74c3c"/><rect x="20" y="14" width="24" height="18" fill="#5dade2" rx="4"/><circle cx="27" cy="23" r="3" fill="#fff"/><circle cx="37" cy="23" r="3" fill="#fff"/><circle cx="27" cy="23" r="1.5" fill="#2c3e50"/><circle cx="37" cy="23" r="1.5" fill="#2c3e50"/><rect x="26" y="28" width="12" height="2" fill="#2c3e50" rx="1"/><rect x="18" y="34" width="28" height="18" fill="#3498db" rx="4"/><rect x="24" y="38" width="16" height="4" fill="#5dade2" rx="2"/><rect x="24" y="44" width="6" height="4" fill="#5dade2" rx="1"/><rect x="34" y="44" width="6" height="4" fill="#5dade2" rx="1"/><rect x="12" y="36" width="5" height="12" fill="#5dade2" rx="2"/><rect x="47" y="36" width="5" height="12" fill="#5dade2" rx="2"/></svg>`
);

const teddyBearImage = svgToDataUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#fdf2e9" rx="8"/><circle cx="22" cy="14" r="7" fill="#b5651d"/><circle cx="22" cy="14" r="4" fill="#d4a053"/><circle cx="42" cy="14" r="7" fill="#b5651d"/><circle cx="42" cy="14" r="4" fill="#d4a053"/><circle cx="32" cy="24" r="13" fill="#b5651d"/><circle cx="27" cy="22" r="2" fill="#2c3e50"/><circle cx="37" cy="22" r="2" fill="#2c3e50"/><ellipse cx="32" cy="27" rx="4" ry="3" fill="#d4a053"/><circle cx="32" cy="26" r="1.5" fill="#2c3e50"/><ellipse cx="32" cy="44" rx="11" ry="13" fill="#b5651d"/><ellipse cx="32" cy="44" rx="7" ry="8" fill="#d4a053"/><ellipse cx="18" cy="40" rx="5" ry="7" fill="#b5651d" transform="rotate(-15 18 40)"/><ellipse cx="46" cy="40" rx="5" ry="7" fill="#b5651d" transform="rotate(15 46 40)"/></svg>`
);

const cartProducts = [
  { name: 'Toy Car', price: '$12.99', image: toyCarImage },
  { name: 'Toy Robot', price: '$24.99', image: toyRobotImage },
  { name: 'Teddy Bear', price: '$18.99', image: teddyBearImage },
];

/**
 * Shopping cart sidebar example.
 */
export const ShoppingCart: Story = {
  render: function ShoppingCartExample() {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState(cartProducts);

    const removeItem = (name: string) => {
      setItems(prev => prev.filter(item => item.name !== name));
    };

    const total = items
      .reduce((sum, item) => sum + parseFloat(item.price.slice(1)), 0)
      .toFixed(2);

    return (
      <Section>
        <Button color="primary" onClick={() => setIsOpen(true)}>
          <Span className="icon">🛒</Span>
          <Span>Cart ({items.length})</Span>
        </Button>
        <Sidebar
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position="right"
          width="350px"
        >
          <Sidebar.Header>
            <Sidebar.Title>Shopping Cart</Sidebar.Title>
            <Sidebar.Close onClick={() => setIsOpen(false)} />
          </Sidebar.Header>
          <Sidebar.Body>
            {items.length === 0 ? (
              <Paragraph
                textColor="grey-light"
                mt="5"
                className="has-text-centered"
              >
                Your cart is empty.
              </Paragraph>
            ) : (
              items.map(product => (
                <Box key={product.name} mb="3">
                  <Media>
                    <Media.Left>
                      <Image
                        size="64x64"
                        src={product.image}
                        alt={product.name}
                      />
                    </Media.Left>
                    <Media.Content>
                      <Title size="6">{product.name}</Title>
                      <SubTitle size="7">{product.price}</SubTitle>
                    </Media.Content>
                    <Media.Right>
                      <Delete
                        size="small"
                        onClick={() => removeItem(product.name)}
                      />
                    </Media.Right>
                  </Media>
                </Box>
              ))
            )}
          </Sidebar.Body>
          <Sidebar.Footer>
            <Level mb="3">
              <Level.Left>
                <Strong>Total:</Strong>
              </Level.Left>
              <Level.Right>
                <Strong>${total}</Strong>
              </Level.Right>
            </Level>
            <Button
              color="primary"
              className="is-fullwidth"
              disabled={items.length === 0}
            >
              Checkout
            </Button>
          </Sidebar.Footer>
        </Sidebar>
      </Section>
    );
  },
};

/**
 * Filter sidebar for e-commerce.
 */
export const FilterSidebar: Story = {
  render: function FilterExample() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Section>
        <Button onClick={() => setIsOpen(true)}>
          <Span className="icon">⚙</Span>
          <Span>Filters</Span>
        </Button>
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <Sidebar.Header>
            <Sidebar.Title>Filters</Sidebar.Title>
            <Sidebar.Close onClick={() => setIsOpen(false)} />
          </Sidebar.Header>
          <Sidebar.Body>
            <Content>
              <Block>
                <Field label="Category">
                  {['Electronics', 'Clothing', 'Home', 'Sports'].map(cat => (
                    <Control key={cat}>
                      <Checkbox> {cat}</Checkbox>
                    </Control>
                  ))}
                </Field>
                <Field label="Price Range">
                  <Control>
                    <Input
                      type="text"
                      placeholder="Min"
                      style={{ width: '45%' }}
                    />
                    <Span style={{ margin: '0 5%' }}>-</Span>
                    <Input
                      type="text"
                      placeholder="Max"
                      style={{ width: '45%' }}
                    />
                  </Control>
                </Field>
                <Field label="Rating">
                  {[4, 3, 2, 1].map(rating => (
                    <Control key={rating}>
                      <Radio name="rating"> {rating}+ stars</Radio>
                    </Control>
                  ))}
                </Field>
              </Block>
              <Buttons>
                <Button color="primary">Apply Filters</Button>
                <Button>Clear</Button>
              </Buttons>
            </Content>
          </Sidebar.Body>
        </Sidebar>
      </Section>
    );
  },
};

/**
 * Compound (dot-notation) usage: every sub-part is a static on Sidebar.
 */
export const CompoundUsage: Story = {
  render: function CompoundUsageExample() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Section>
        <Button color="primary" onClick={() => setIsOpen(true)}>
          Open Sidebar
        </Button>
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <Sidebar.Header>
            <Sidebar.Title>Dot Notation</Sidebar.Title>
            <Sidebar.Close onClick={() => setIsOpen(false)} />
          </Sidebar.Header>
          <Sidebar.Body>
            <Paragraph>
              Header, Title, Close, Body, and Footer are all available from the
              single Sidebar import.
            </Paragraph>
          </Sidebar.Body>
          <Sidebar.Footer>
            <Button color="primary" onClick={() => setIsOpen(false)}>
              Done
            </Button>
          </Sidebar.Footer>
        </Sidebar>
      </Section>
    );
  },
};
