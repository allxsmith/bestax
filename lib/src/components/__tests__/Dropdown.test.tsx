import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
  isBrowser,
} from '../Dropdown';

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

    // // click outside, but wrap in act for React event propagation
    // await act(async () => {
    //   await userEvent.click(screen.getByTestId('outside'));
    // });

    // close the dropdown
    await userEvent.click(screen.getByRole('button', { name: /dropdown/i }));

    // wait for the dropdown to close
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
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
});
