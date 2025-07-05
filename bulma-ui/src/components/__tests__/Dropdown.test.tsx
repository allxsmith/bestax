import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
  isBrowser,
} from '../Dropdown';
import * as DropdownModule from '../Dropdown';

describe('Dropdown', () => {
  test('renders label', () => {
    render(
      <Dropdown label="Menu">
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  test('opens and closes on button click', () => {
    render(
      <Dropdown label="Menu">
        <DropdownItem>Item 1</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /menu/i });
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
    fireEvent.click(button);
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
    fireEvent.click(button);
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
  });

  test('closes when clicking outside', async () => {
    render(
      <>
        <Dropdown label="Dropdown">
          <DropdownItem>Item</DropdownItem>
        </Dropdown>
        <button data-testid="outside">Outside</button>
      </>
    );
    // open the dropdown
    await userEvent.click(screen.getByRole('button', { name: /dropdown/i }));

    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');

    // close the dropdown
    await userEvent.click(screen.getByTestId('outside'));

    // wait for the dropdown to close
    await waitFor(() =>
      expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active')
    );
  });

  test('renders all dropdown items and divider', () => {
    render(
      <Dropdown label="Dropdown">
        <DropdownItem>One</DropdownItem>
        <DropdownDivider />
        <DropdownItem>Two</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByRole('menu')).toContainElement(screen.getByText('One'));
    expect(screen.getByRole('menu')).toContainElement(screen.getByText('Two'));
    expect(
      screen.getByRole('menu').querySelector('.dropdown-divider')
    ).toBeInTheDocument();
  });

  test('does not open if disabled', () => {
    render(
      <Dropdown label="Disabled" disabled>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /disabled/i });
    fireEvent.click(button);
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
  });

  test('calls onActiveChange when opened and closed', () => {
    const onActiveChange = jest.fn();
    render(
      <Dropdown label="Menu" onActiveChange={onActiveChange}>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onActiveChange).toHaveBeenCalledWith(true);
    fireEvent.click(button);
    expect(onActiveChange).toHaveBeenCalledWith(false);
  });

  test('can be controlled externally via active prop', () => {
    const { rerender } = render(
      <Dropdown label="Menu" active={false}>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
    rerender(
      <Dropdown label="Menu" active={true}>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
  });

  test('closes after clicking dropdown item if closeOnClick', () => {
    render(
      <Dropdown label="Menu" closeOnClick>
        <DropdownItem>Item 1</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(button); // open
    const item = screen.getByText('Item 1');
    fireEvent.click(item);
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
  });

  test('does not close after clicking dropdown item if closeOnClick is false', () => {
    render(
      <Dropdown label="Menu" closeOnClick={false}>
        <DropdownItem>Item 1</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(button); // open
    const item = screen.getByText('Item 1');
    fireEvent.click(item);
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
  });

  test('DropdownItem supports active class', () => {
    render(
      <Dropdown label="Menu">
        <DropdownItem active>Active Item</DropdownItem>
        <DropdownItem>Inactive Item</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByText('Active Item')).toHaveClass('is-active');
    expect(screen.getByText('Inactive Item')).not.toHaveClass('is-active');
  });

  test('Dropdown and DropdownItem accept Bulma helper classes', () => {
    render(
      <Dropdown label="Helpers" m="2">
        <DropdownItem color="primary" data-testid="dd-item">
          Color
        </DropdownItem>
      </Dropdown>
    );
    const dropdown = screen.getByTestId('dropdown-root');
    expect(dropdown).toHaveClass('m-2');
    expect(screen.getByTestId('dd-item')).toHaveClass('has-text-primary');
  });

  test('DropdownItem can render as anchor or div', () => {
    // Assume DropdownItem supports 'as' prop, fallback to anchor if not
    render(
      <Dropdown label="Custom">
        <DropdownItem as="a" href="https://example.com" target="_blank">
          Anchor Item
        </DropdownItem>
        <DropdownItem as="div">Div Item</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByText('Anchor Item').tagName.toLowerCase()).toBe('a');
    expect(screen.getByText('Div Item').tagName.toLowerCase()).toBe('div');
  });

  test('applies is-hoverable and is-active modifiers', () => {
    render(
      <Dropdown label="Hoverable" hoverable active>
        <DropdownItem>Hoverable Item</DropdownItem>
      </Dropdown>
    );
    const root = screen.getByTestId('dropdown-root');
    expect(root).toHaveClass('is-hoverable');
    expect(root).toHaveClass('is-active');
  });

  test('applies is-right modifier', () => {
    render(
      <Dropdown label="Right" right>
        <DropdownItem>Right Item</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-right');
  });

  test('applies is-up modifier', () => {
    render(
      <Dropdown label="Up" up>
        <DropdownItem>Up Item</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-up');
  });

  test('isBrowser returns false if window or document is undefined', () => {
    expect(isBrowser(undefined, document)).toBe(false);
    expect(isBrowser(window, undefined)).toBe(false);
    expect(isBrowser(window, document)).toBe(true);
  });

  test('does not attach event listeners in SSR (isBrowser false)', () => {
    const isBrowserSpy = jest
      .spyOn(DropdownModule, 'isBrowser')
      .mockReturnValue(false);
    render(
      <DropdownModule.Dropdown label="SSR">
        <DropdownModule.DropdownItem>SSR Item</DropdownModule.DropdownItem>
      </DropdownModule.Dropdown>
    );
    fireEvent.click(screen.getByRole('button', { name: /SSR/i }));
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
    isBrowserSpy.mockRestore();
  });

  test('applies menuClassName, id, and aria-controls', () => {
    render(
      <Dropdown
        label="With Menu Class"
        menuClassName="my-menu"
        id="dropdown-id"
      >
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    // menuClassName
    expect(screen.getByTestId('dropdown-menu')).toHaveClass('my-menu');
    // id and aria-controls
    expect(
      screen.getByRole('button', { name: /with menu class/i })
    ).toHaveAttribute('aria-controls', 'dropdown-id-menu');
    expect(screen.getByTestId('dropdown-menu').id).toBe('dropdown-id-menu');
  });

  test('applies up, right, hoverable, disabled class', () => {
    render(
      <Dropdown label="Modifiers" up right hoverable disabled>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    const root = screen.getByTestId('dropdown-root');
    expect(root).toHaveClass('is-up');
    expect(root).toHaveClass('is-right');
    expect(root).toHaveClass('is-hoverable');
    expect(root).toHaveClass('is-disabled');
    // Disabled: click does nothing
    fireEvent.click(screen.getByRole('button', { name: /modifiers/i }));
    expect(root).not.toHaveClass('is-active');
  });

  test('DropdownItem renders as button', () => {
    render(
      <Dropdown label="As Button">
        <DropdownItem as="button">Button Item</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByText('Button Item').tagName.toLowerCase()).toBe(
      'button'
    );
  });

  test('DropdownItem renders as div', () => {
    render(
      <Dropdown label="As Div">
        <DropdownItem as="div">Div Item</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByText('Div Item').tagName.toLowerCase()).toBe('div');
  });

  test('Dropdown renders with no children', () => {
    render(<Dropdown label="Empty">{null}</Dropdown>);
    expect(screen.getByTestId('dropdown-root')).toBeInTheDocument();
  });

  test('Dropdown root and menu accept custom className', () => {
    render(
      <Dropdown label="Class" className="root-class" menuClassName="menu-class">
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByTestId('dropdown-root')).toHaveClass('root-class');
    expect(screen.getByTestId('dropdown-menu')).toHaveClass('menu-class');
  });

  test('does NOT close when clicking inside the dropdown', async () => {
    render(
      <Dropdown label="Dropdown" closeOnClick={false}>
        <DropdownItem data-testid="inside-item">Item</DropdownItem>
      </Dropdown>
    );
    await userEvent.click(screen.getByRole('button', { name: /dropdown/i }));
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
    await userEvent.click(screen.getByTestId('inside-item'));
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
  });

  test('renders without id and does not set aria-controls or menu id', () => {
    render(
      <Dropdown label="NoID">
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /noid/i });
    expect(button).not.toHaveAttribute('aria-controls');
    expect(screen.getByTestId('dropdown-menu').id).toBe('');
  });
});
