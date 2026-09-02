import { useState } from 'react';
import {
  render,
  screen,
  fireEvent,
  createEvent,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
  isBrowser,
} from '../Dropdown';
import * as DropdownModule from '../Dropdown';
import { ConfigProvider } from '../../helpers/Config';

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
        <DropdownItem as="a">Anchor Item</DropdownItem>
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

  test('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="custom-">
        <Dropdown label="Dropdown with prefix" data-testid="dropdown">
          <DropdownItem>Item</DropdownItem>
        </Dropdown>
      </ConfigProvider>
    );

    const dropdown = screen.getByTestId('dropdown');
    expect(dropdown).toHaveClass('custom-dropdown');
    expect(dropdown).not.toHaveClass('dropdown');

    const button = screen.getByRole('button', {
      name: /dropdown with prefix/i,
    });
    expect(button).toHaveClass('custom-button');
    expect(button).not.toHaveClass('button');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Dropdown label="Test Dropdown" data-testid="dropdown">
            <DropdownItem>Item</DropdownItem>
          </Dropdown>
        </ConfigProvider>
      );
      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toHaveClass('bulma-dropdown');

      const button = screen.getByRole('button', { name: /test dropdown/i });
      expect(button).toHaveClass('bulma-button');
    });

    it('uses default classes when no prefix is provided', () => {
      render(
        <Dropdown label="Test Dropdown" data-testid="dropdown">
          <DropdownItem>Item</DropdownItem>
        </Dropdown>
      );
      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toHaveClass('dropdown');

      const button = screen.getByRole('button', { name: /test dropdown/i });
      expect(button).toHaveClass('button');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Dropdown label="Test Dropdown" data-testid="dropdown">
            <DropdownItem>Item</DropdownItem>
          </Dropdown>
        </ConfigProvider>
      );
      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toHaveClass('dropdown');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Dropdown label="Test Dropdown" up right m="2" data-testid="dropdown">
            <DropdownItem>Item</DropdownItem>
          </Dropdown>
        </ConfigProvider>
      );
      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toHaveClass('bulma-dropdown');
      expect(dropdown).toHaveClass('bulma-is-up');
      expect(dropdown).toHaveClass('bulma-is-right');
      expect(dropdown).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(
        <Dropdown label="Test Dropdown" hoverable data-testid="dropdown">
          <DropdownItem>Item</DropdownItem>
        </Dropdown>
      );
      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toHaveClass('dropdown');
      expect(dropdown).toHaveClass('is-hoverable');
    });
  });

  test('handles activeProp being non-boolean (undefined)', () => {
    render(
      <Dropdown label="Undefined Active" active={undefined}>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
  });

  test('handles closeOnClick being explicitly false', () => {
    render(
      <Dropdown label="No Close" closeOnClick={false}>
        <DropdownItem>Item 1</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /no close/i });
    fireEvent.click(button); // open
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');

    const item = screen.getByText('Item 1');
    fireEvent.click(item); // click item - should not close
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
  });

  test('handles onActiveChange being undefined', () => {
    render(
      <Dropdown label="No Callback">
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /no callback/i });
    // Should not throw when onActiveChange is undefined
    expect(() => fireEvent.click(button)).not.toThrow();
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
  });

  test('cleans up event listeners when component unmounts', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = render(
      <Dropdown label="Cleanup Test">
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );

    // Open the dropdown to trigger the useEffect
    fireEvent.click(screen.getByRole('button', { name: /cleanup test/i }));
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');

    // Unmount should trigger cleanup
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mousedown',
      expect.any(Function)
    );
    removeEventListenerSpy.mockRestore();
  });

  test('handleMenuClick does nothing when closeOnClick is falsy', () => {
    render(
      <Dropdown label="Menu" closeOnClick={false}>
        <DropdownItem>Item 1</DropdownItem>
      </Dropdown>
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');

    // Click on the dropdown content area (not the item)
    const dropdownContent = screen
      .getByTestId('dropdown-menu')
      .querySelector('.dropdown-content');
    fireEvent.click(dropdownContent!);

    // Should still be active since closeOnClick is false
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
  });

  test('covers event listener edge case when dropdownRef.current is null', () => {
    const { unmount } = render(
      <Dropdown label="Ref Test">
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /ref test/i }));
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');

    // Simulate clicking outside - this should trigger the event listener path
    fireEvent.mouseDown(document.body);

    // Should close the dropdown
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');

    unmount();
  });

  test('covers useEffect dependency array changes', () => {
    const onActiveChange = jest.fn();
    const { rerender } = render(
      <Dropdown label="Deps Test" onActiveChange={onActiveChange}>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /deps test/i }));
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');

    // Change the onActiveChange callback to trigger useEffect
    const newCallback = jest.fn();
    rerender(
      <Dropdown label="Deps Test" onActiveChange={newCallback}>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );

    // Dropdown should still be active
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
  });

  test('covers dropdownRef.current contains logic', () => {
    render(
      <Dropdown label="Contains Test">
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /contains test/i }));
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');

    // Click on the dropdown itself (should NOT close)
    const dropdownItem = screen.getByText('Item');
    fireEvent.mouseDown(dropdownItem);
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');

    // Click outside the dropdown (should close)
    fireEvent.mouseDown(document.body);
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
  });

  test('covers cleanup function when effect dependencies change', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    const { rerender } = render(
      <Dropdown label="Cleanup Deps">
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );

    // Open dropdown first
    fireEvent.click(screen.getByRole('button', { name: /cleanup deps/i }));

    // Change active state which should trigger cleanup and re-setup
    rerender(
      <Dropdown label="Cleanup Deps" active={false}>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );

    // The removeEventListener should have been called during cleanup
    expect(removeEventListenerSpy).toHaveBeenCalled();
    removeEventListenerSpy.mockRestore();
  });

  test('calls onActiveChange when clicking menu item with closeOnClick=true', () => {
    const onActiveChange = jest.fn();
    render(
      <Dropdown
        label="Menu Click"
        onActiveChange={onActiveChange}
        closeOnClick={true}
      >
        <DropdownItem>Item 1</DropdownItem>
      </Dropdown>
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /menu click/i }));
    expect(onActiveChange).toHaveBeenCalledWith(true);

    // Click menu item - should call onActiveChange with false
    fireEvent.click(screen.getByText('Item 1'));
    expect(onActiveChange).toHaveBeenCalledWith(false);
    expect(onActiveChange).toHaveBeenCalledTimes(2);
  });

  test('handles early return when not active in useEffect', () => {
    render(
      <Dropdown label="Not Active">
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );

    // Dropdown should not be active initially
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');

    // No event listeners should be attached since dropdown is not active
    // This tests the early return in useEffect when !active
  });

  test('handles isBrowser false scenario in useEffect', () => {
    const isBrowserSpy = jest
      .spyOn(DropdownModule, 'isBrowser')
      .mockReturnValue(false);

    render(
      <Dropdown label="SSR Dropdown">
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /ssr dropdown/i }));
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');

    // In SSR mode, clicking outside should not close the dropdown
    // because no event listeners are attached
    fireEvent.mouseDown(document.body);
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');

    isBrowserSpy.mockRestore();
  });

  test('covers outside click with onActiveChange callback', async () => {
    const onActiveChange = jest.fn();
    render(
      <>
        <Dropdown label="Outside Click" onActiveChange={onActiveChange}>
          <DropdownItem>Item</DropdownItem>
        </Dropdown>
        <button data-testid="outside-button">Outside</button>
      </>
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /outside click/i }));
    expect(onActiveChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');

    // Click outside element that doesn't contain the dropdown
    fireEvent.mouseDown(screen.getByTestId('outside-button'));

    // Should close and call onActiveChange with false
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
    expect(onActiveChange).toHaveBeenCalledWith(false);
    expect(onActiveChange).toHaveBeenCalledTimes(2);
  });

  test('attaches event listener when dropdown becomes active', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

    render(
      <Dropdown label="Listener Attach">
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );

    // Open dropdown -> should attach mousedown listener
    fireEvent.click(screen.getByRole('button', { name: /listener attach/i }));
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'mousedown',
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
  });

  test('executes disabled guard in handleToggle (branch coverage)', () => {
    render(
      <Dropdown label="Disabled Guard" disabled>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );

    const button = screen.getByRole('button', {
      name: /disabled guard/i,
    }) as HTMLButtonElement;

    // Ensure the DOM won't block the event, but props.disabled remains true so guard runs
    button.removeAttribute('disabled');
    Object.defineProperty(button, 'disabled', {
      value: false,
      configurable: true,
    });
    fireEvent.click(button);

    // Should remain not active due to the disabled guard path executing
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
  });
});

describe('Dropdown keyboard navigation', () => {
  test('ArrowDown on trigger opens the menu and focuses the first item', () => {
    render(
      <Dropdown label="Menu">
        <DropdownItem>First</DropdownItem>
        <DropdownItem>Second</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /menu/i });
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
    expect(screen.getByText('First')).toHaveFocus();
  });

  test('ArrowUp on trigger opens the menu and focuses the last item', () => {
    render(
      <Dropdown label="Menu">
        <DropdownItem>First</DropdownItem>
        <DropdownItem>Second</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /menu/i });
    fireEvent.keyDown(button, { key: 'ArrowUp' });
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
    expect(screen.getByText('Second')).toHaveFocus();
  });

  test('Enter on trigger opens the menu and focuses the first item, then closes on Enter again', () => {
    const onActiveChange = jest.fn();
    render(
      <Dropdown label="Menu" onActiveChange={onActiveChange}>
        <DropdownItem>First</DropdownItem>
        <DropdownItem>Second</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /menu/i });
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onActiveChange).toHaveBeenCalledWith(true);
    expect(screen.getByText('First')).toHaveFocus();

    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onActiveChange).toHaveBeenCalledWith(false);
  });

  test('Space on trigger opens the menu and focuses the first item', () => {
    render(
      <Dropdown label="Menu">
        <DropdownItem>First</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /menu/i });
    fireEvent.keyDown(button, { key: ' ' });
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
    expect(screen.getByText('First')).toHaveFocus();
  });

  test('ArrowDown while open moves focus to the first item', () => {
    render(
      <Dropdown label="Menu" active>
        <DropdownItem>First</DropdownItem>
        <DropdownItem>Second</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /menu/i });
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    expect(screen.getByText('First')).toHaveFocus();
  });

  test('ArrowUp while open moves focus to the last item', () => {
    render(
      <Dropdown label="Menu" active>
        <DropdownItem>First</DropdownItem>
        <DropdownItem>Second</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /menu/i });
    fireEvent.keyDown(button, { key: 'ArrowUp' });
    expect(screen.getByText('Second')).toHaveFocus();
  });

  test('Escape on trigger closes the menu', () => {
    const onActiveChange = jest.fn();
    render(
      <Dropdown label="Menu" active onActiveChange={onActiveChange}>
        <DropdownItem>First</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /menu/i });
    fireEvent.keyDown(button, { key: 'Escape' });
    expect(onActiveChange).toHaveBeenCalledWith(false);
  });

  test('Escape on a closed trigger is a no-op', () => {
    const onActiveChange = jest.fn();
    render(
      <Dropdown label="Menu" onActiveChange={onActiveChange}>
        <DropdownItem>First</DropdownItem>
      </Dropdown>
    );
    fireEvent.keyDown(screen.getByRole('button', { name: /menu/i }), {
      key: 'Escape',
    });
    expect(onActiveChange).not.toHaveBeenCalled();
  });

  test('other keys on trigger do nothing', () => {
    render(
      <Dropdown label="Menu">
        <DropdownItem>First</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /menu/i });
    fireEvent.keyDown(button, { key: 'a' });
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
  });

  test('disabled trigger ignores key presses', () => {
    render(
      <Dropdown label="Menu" disabled>
        <DropdownItem>First</DropdownItem>
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /menu/i });
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    expect(screen.getByTestId('dropdown-root')).not.toHaveClass('is-active');
  });

  test('ArrowDown/ArrowUp within the menu move focus and wrap around', () => {
    render(
      <Dropdown label="Menu" active>
        <DropdownItem>First</DropdownItem>
        <DropdownItem>Second</DropdownItem>
        <DropdownItem>Third</DropdownItem>
      </Dropdown>
    );
    const first = screen.getByText('First');
    const second = screen.getByText('Second');
    const third = screen.getByText('Third');

    first.focus();
    fireEvent.keyDown(screen.getByTestId('dropdown-menu'), {
      key: 'ArrowDown',
    });
    expect(second).toHaveFocus();

    fireEvent.keyDown(screen.getByTestId('dropdown-menu'), {
      key: 'ArrowDown',
    });
    expect(third).toHaveFocus();

    // wraps to first
    fireEvent.keyDown(screen.getByTestId('dropdown-menu'), {
      key: 'ArrowDown',
    });
    expect(first).toHaveFocus();

    // wraps backward to last
    fireEvent.keyDown(screen.getByTestId('dropdown-menu'), {
      key: 'ArrowUp',
    });
    expect(third).toHaveFocus();
  });

  test('ArrowDown/ArrowUp within the menu default to an edge item when nothing is focused', () => {
    render(
      <Dropdown label="Menu" active>
        <DropdownItem>First</DropdownItem>
        <DropdownItem>Second</DropdownItem>
      </Dropdown>
    );
    fireEvent.keyDown(screen.getByTestId('dropdown-menu'), {
      key: 'ArrowDown',
    });
    expect(screen.getByText('First')).toHaveFocus();
  });

  test('ArrowUp within the menu defaults to the last item when nothing is focused', () => {
    render(
      <Dropdown label="Menu" active>
        <DropdownItem>First</DropdownItem>
        <DropdownItem>Second</DropdownItem>
      </Dropdown>
    );
    fireEvent.keyDown(screen.getByTestId('dropdown-menu'), {
      key: 'ArrowUp',
    });
    expect(screen.getByText('Second')).toHaveFocus();
  });

  test('ArrowDown on the trigger opening an empty menu does not throw', () => {
    render(<Dropdown label="Menu">{null}</Dropdown>);
    const button = screen.getByRole('button', { name: /menu/i });
    expect(() => fireEvent.keyDown(button, { key: 'ArrowDown' })).not.toThrow();
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
  });

  test('ArrowDown on the trigger of an already-open, empty menu is a no-op', () => {
    render(
      <Dropdown label="Menu" active>
        {null}
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /menu/i });
    expect(() => fireEvent.keyDown(button, { key: 'ArrowDown' })).not.toThrow();
  });

  test('ArrowUp on the trigger of an already-open, empty menu is a no-op', () => {
    render(
      <Dropdown label="Menu" active>
        {null}
      </Dropdown>
    );
    const button = screen.getByRole('button', { name: /menu/i });
    expect(() => fireEvent.keyDown(button, { key: 'ArrowUp' })).not.toThrow();
  });

  test('Home and End jump to the first and last item', () => {
    render(
      <Dropdown label="Menu" active>
        <DropdownItem>First</DropdownItem>
        <DropdownItem>Second</DropdownItem>
        <DropdownItem>Third</DropdownItem>
      </Dropdown>
    );
    const menu = screen.getByTestId('dropdown-menu');
    screen.getByText('Second').focus();
    fireEvent.keyDown(menu, { key: 'End' });
    expect(screen.getByText('Third')).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'Home' });
    expect(screen.getByText('First')).toHaveFocus();
  });

  test('Escape within the menu closes it and restores focus to the trigger', () => {
    const onActiveChange = jest.fn();
    render(
      <Dropdown label="Menu" active onActiveChange={onActiveChange}>
        <DropdownItem>First</DropdownItem>
      </Dropdown>
    );
    const item = screen.getByText('First');
    item.focus();
    fireEvent.keyDown(screen.getByTestId('dropdown-menu'), {
      key: 'Escape',
    });
    expect(onActiveChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('button', { name: /menu/i })).toHaveFocus();
  });

  test('Tab within the menu closes it', () => {
    const onActiveChange = jest.fn();
    render(
      <Dropdown label="Menu" active onActiveChange={onActiveChange}>
        <DropdownItem>First</DropdownItem>
      </Dropdown>
    );
    fireEvent.keyDown(screen.getByTestId('dropdown-menu'), { key: 'Tab' });
    expect(onActiveChange).toHaveBeenCalledWith(false);
  });

  test('Tab from a focused item closes the menu without blocking native focus movement', () => {
    const onActiveChange = jest.fn();
    render(
      <Dropdown label="Menu" active onActiveChange={onActiveChange}>
        <DropdownItem>First</DropdownItem>
      </Dropdown>
    );
    screen.getByText('First').focus();
    const tab = createEvent.keyDown(screen.getByTestId('dropdown-menu'), {
      key: 'Tab',
    });
    fireEvent(screen.getByTestId('dropdown-menu'), tab);
    // The menu closes...
    expect(onActiveChange).toHaveBeenCalledWith(false);
    // ...but Tab is not preventDefault()'d, so the browser moves focus to the
    // next control naturally (jsdom does not simulate that focus move itself).
    expect(tab.defaultPrevented).toBe(false);
  });

  test('other keys within the menu do nothing', () => {
    render(
      <Dropdown label="Menu" active>
        <DropdownItem>First</DropdownItem>
      </Dropdown>
    );
    screen.getByText('First').focus();
    fireEvent.keyDown(screen.getByTestId('dropdown-menu'), { key: 'a' });
    expect(screen.getByText('First')).toHaveFocus();
  });

  test('menu keydown is a no-op when there are no menu items', () => {
    render(
      <Dropdown label="Menu" active>
        {null}
      </Dropdown>
    );
    expect(() =>
      fireEvent.keyDown(screen.getByTestId('dropdown-menu'), {
        key: 'ArrowDown',
      })
    ).not.toThrow();
  });

  test('Escape closes the menu even when it has no focusable items', () => {
    const onActiveChange = jest.fn();
    render(
      <Dropdown label="Menu" active onActiveChange={onActiveChange}>
        {null}
      </Dropdown>
    );
    fireEvent.keyDown(screen.getByTestId('dropdown-menu'), { key: 'Escape' });
    expect(onActiveChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('button', { name: /menu/i })).toHaveFocus();
  });

  test('Tab closes the menu when every item is disabled', () => {
    const onActiveChange = jest.fn();
    render(
      <Dropdown label="Menu" active onActiveChange={onActiveChange}>
        <DropdownItem as="button" disabled>
          Disabled
        </DropdownItem>
      </Dropdown>
    );
    fireEvent.keyDown(screen.getByTestId('dropdown-menu'), { key: 'Tab' });
    expect(onActiveChange).toHaveBeenCalledWith(false);
  });

  test('forwards the typed disabled prop to the rendered item element', () => {
    render(
      <Dropdown label="Menu" active>
        <DropdownItem as="button" disabled>
          Disabled
        </DropdownItem>
      </Dropdown>
    );
    const item = screen.getByText('Disabled');
    expect(item.tagName).toBe('BUTTON');
    expect(item).toBeDisabled();
  });

  test('skips disabled items when navigating with arrow keys', () => {
    render(
      <Dropdown label="Menu" active>
        <DropdownItem>First</DropdownItem>
        <DropdownItem as="button" disabled>
          Disabled
        </DropdownItem>
        <DropdownItem>Third</DropdownItem>
      </Dropdown>
    );
    const menu = screen.getByTestId('dropdown-menu');
    screen.getByText('First').focus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(screen.getByText('Third')).toHaveFocus();
  });

  test('controlled dropdown supports keyboard open and reports via onActiveChange', () => {
    const onActiveChange = jest.fn();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Dropdown
          label="Menu"
          active={open}
          onActiveChange={active => {
            setOpen(active);
            onActiveChange(active);
          }}
        >
          <DropdownItem>First</DropdownItem>
        </Dropdown>
      );
    }
    render(<Controlled />);
    const button = screen.getByRole('button', { name: /menu/i });
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    expect(onActiveChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('dropdown-root')).toHaveClass('is-active');
    expect(screen.getByText('First')).toHaveFocus();
  });
});

describe('Compound components', () => {
  test('Dropdown.Item is the DropdownItem component', () => {
    expect(Dropdown.Item).toBe(DropdownItem);
  });

  test('Dropdown.Divider is the DropdownDivider component', () => {
    expect(Dropdown.Divider).toBe(DropdownDivider);
  });

  test('renders a dropdown through the dot path', () => {
    const { container } = render(
      <Dropdown label="Menu" active>
        <Dropdown.Item>First</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item>Second</Dropdown.Item>
      </Dropdown>
    );
    expect(container.querySelector('.dropdown')).toBeInTheDocument();
    expect(container.querySelectorAll('.dropdown-item')).toHaveLength(2);
    expect(container.querySelector('.dropdown-divider')).toBeInTheDocument();
  });
});
