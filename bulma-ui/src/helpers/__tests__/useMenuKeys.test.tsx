import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  enabledMenuItems,
  isEnabledMenuItem,
  TYPEAHEAD_TIMEOUT,
  useMenuKeys,
} from '../useMenuKeys';

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

/** A `role="menu"` element with the hook's handler on it. */
const Menu = ({
  children,
  onKeyDown,
}: {
  children: React.ReactNode;
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
}) => {
  const menuKeys = useMenuKeys();
  return (
    <div
      role="menu"
      aria-label="Actions"
      tabIndex={-1}
      onKeyDown={event => {
        onKeyDown?.(event);
        menuKeys(event);
      }}
    >
      {children}
    </div>
  );
};

const item = (name: string) => screen.getByRole('menuitem', { name });
const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(document.activeElement!, { key, ...init });

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useMenuKeys', () => {
  describe('the items', () => {
    it('are every menu-item role, without the disabled ones', () => {
      render(
        <Menu>
          <div role="menuitem">Open</div>
          <div role="menuitemcheckbox" aria-checked="true">
            Show hidden files
          </div>
          <div role="menuitemradio" aria-checked="false">
            Sort by name
          </div>
          <button role="menuitem" disabled>
            Cut
          </button>
          <div role="menuitem" aria-disabled="true">
            Copy
          </div>
          <div role="menuitem" aria-disabled="false">
            Paste
          </div>
          <hr />
        </Menu>
      );
      expect(
        enabledMenuItems(screen.getByRole('menu')).map(el => el.textContent)
      ).toEqual(['Open', 'Show hidden files', 'Sort by name', 'Paste']);
      expect(isEnabledMenuItem(screen.getByText('Cut'))).toBe(false);
      expect(isEnabledMenuItem(screen.getByText('Copy'))).toBe(false);
      expect(isEnabledMenuItem(screen.getByText('Paste'))).toBe(true);
    });
  });

  describe('moving', () => {
    const Items = () => (
      <Menu>
        <button role="menuitem">Rename</button>
        <button role="menuitem" disabled>
          Move
        </button>
        <button role="menuitem">Duplicate</button>
        <hr />
        <button role="menuitem">Delete</button>
      </Menu>
    );

    it('moves down and up, wrapping, past disabled items and dividers', () => {
      render(<Items />);
      item('Rename').focus();
      expect(press('ArrowDown')).toBe(false);
      expect(item('Duplicate')).toHaveFocus();
      press('ArrowDown');
      expect(item('Delete')).toHaveFocus();
      press('ArrowDown');
      expect(item('Rename')).toHaveFocus();
      expect(press('ArrowUp')).toBe(false);
      expect(item('Delete')).toHaveFocus();
      press('ArrowUp');
      expect(item('Duplicate')).toHaveFocus();
    });

    it('jumps to the first and the last with Home and End', () => {
      render(<Items />);
      item('Duplicate').focus();
      expect(press('End')).toBe(false);
      expect(item('Delete')).toHaveFocus();
      expect(press('Home')).toBe(false);
      expect(item('Rename')).toHaveFocus();
    });

    it('goes from the menu itself to the first item on Down and the last on Up', () => {
      render(<Items />);
      screen.getByRole('menu').focus();
      press('ArrowDown');
      expect(item('Rename')).toHaveFocus();
      screen.getByRole('menu').focus();
      press('ArrowUp');
      expect(item('Delete')).toHaveFocus();
    });

    it('does nothing in a menu with no enabled items', () => {
      render(
        <Menu>
          <button role="menuitem" disabled>
            Cut
          </button>
        </Menu>
      );
      screen.getByRole('menu').focus();
      for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'c']) {
        expect(press(key)).toBe(true);
      }
      expect(screen.getByRole('menu')).toHaveFocus();
    });

    it('leaves other keys alone', () => {
      render(<Items />);
      item('Rename').focus();
      for (const key of ['ArrowLeft', 'Escape', 'Tab', 'F10', 'PageDown']) {
        expect(press(key)).toBe(true);
      }
      expect(item('Rename')).toHaveFocus();
    });
  });

  describe('activating', () => {
    it('clicks an item the browser does not, on Enter and on Space', () => {
      const onClick = jest.fn();
      render(
        <Menu>
          <div role="menuitem" tabIndex={0} onClick={onClick}>
            Delete
          </div>
          <a role="menuitem" tabIndex={0} onClick={onClick}>
            Archive
          </a>
        </Menu>
      );
      item('Delete').focus();
      expect(press('Enter')).toBe(false);
      expect(press(' ')).toBe(false);
      item('Archive').focus();
      expect(press('Enter')).toBe(false);
      expect(onClick).toHaveBeenCalledTimes(3);
    });

    it('leaves a button’s keys and a link’s Enter to the browser, and clicks a link on Space', () => {
      const onClick = jest.fn();
      render(
        <Menu>
          <button role="menuitem" onClick={onClick}>
            Rename
          </button>
          <a role="menuitem" href="#download" onClick={onClick}>
            Download
          </a>
        </Menu>
      );
      item('Rename').focus();
      expect(press('Enter')).toBe(true);
      expect(press(' ')).toBe(true);
      item('Download').focus();
      expect(press('Enter')).toBe(true);
      expect(onClick).not.toHaveBeenCalled();
      expect(press(' ')).toBe(false);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('activates once for a held key, without the page scrolling on the repeats', () => {
      const onClick = jest.fn();
      render(
        <Menu>
          <div role="menuitemcheckbox" tabIndex={0} onClick={onClick}>
            Show hidden files
          </div>
          <button role="menuitem">Rename</button>
          <a role="menuitem" href="#download">
            Download
          </a>
        </Menu>
      );
      screen.getByRole('menuitemcheckbox').focus();
      press(' ');
      expect(press(' ', { repeat: true })).toBe(false);
      expect(press(' ', { repeat: true })).toBe(false);
      expect(onClick).toHaveBeenCalledTimes(1);

      // The browser clicks on each Enter keydown, so its repeats are stopped.
      item('Rename').focus();
      expect(press('Enter', { repeat: true })).toBe(false);
      item('Download').focus();
      expect(press('Enter', { repeat: true })).toBe(false);
      // Space clicks a button on keyup, once, so its repeats are let be.
      item('Rename').focus();
      expect(press(' ', { repeat: true })).toBe(true);
    });

    it('leaves a key an item’s own handler claimed', () => {
      const onClick = jest.fn();
      render(
        <Menu>
          <div
            role="menuitem"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={e => e.preventDefault()}
          >
            Delete
          </div>
        </Menu>
      );
      item('Delete').focus();
      press('Enter');
      press(' ');
      expect(onClick).not.toHaveBeenCalled();
    });

    it('activates nothing with focus on the menu itself', () => {
      const onClick = jest.fn();
      render(
        <Menu>
          <div role="menuitem" tabIndex={0} onClick={onClick}>
            Delete
          </div>
        </Menu>
      );
      screen.getByRole('menu').focus();
      expect(press('Enter')).toBe(true);
      expect(press(' ')).toBe(true);
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('typeahead', () => {
    const Files = () => (
      <Menu>
        <button role="menuitem">Rename</button>
        <button role="menuitem">Remove</button>
        <button role="menuitem" disabled>
          Download
        </button>
        <button role="menuitem">
          <span aria-hidden="true">content_copy</span> Duplicate
        </button>
        <button role="menuitem">Delete</button>
        <button role="menuitem">
          <strong>Share</strong>
        </button>
      </Menu>
    );

    it('moves to the next item whose text starts with the letter, past disabled ones', () => {
      render(<Files />);
      item('Rename').focus();
      expect(press('s')).toBe(false);
      expect(item('Share')).toHaveFocus();
      advance(TYPEAHEAD_TIMEOUT);
      press('D');
      expect(item('Duplicate')).toHaveFocus();
    });

    it('cycles through the items that start with a letter typed again, wrapping', () => {
      render(<Files />);
      item('Rename').focus();
      press('r');
      expect(item('Remove')).toHaveFocus();
      press('r');
      expect(item('Rename')).toHaveFocus();
      press('r');
      expect(item('Remove')).toHaveFocus();
    });

    it('matches what is typed in quick succession as one search, from the focused item', () => {
      render(<Files />);
      item('Share').focus();
      press('r');
      expect(item('Rename')).toHaveFocus();
      press('e');
      expect(item('Rename')).toHaveFocus();
      press('m');
      expect(item('Remove')).toHaveFocus();
    });

    it('starts a new search once typing pauses', () => {
      render(<Files />);
      item('Share').focus();
      press('r');
      advance(TYPEAHEAD_TIMEOUT - 1);
      press('e');
      expect(item('Rename')).toHaveFocus();
      advance(TYPEAHEAD_TIMEOUT);
      press('d');
      expect(item('Duplicate')).toHaveFocus();
    });

    it('stays put when nothing matches', () => {
      render(<Files />);
      item('Rename').focus();
      expect(press('z')).toBe(false);
      expect(item('Rename')).toHaveFocus();
    });

    it('reads what an item says, without what is hidden from assistive technology', () => {
      render(<Files />);
      item('Duplicate').appendChild(document.createComment('copy'));
      item('Rename').focus();
      press('c');
      expect(item('Rename')).toHaveFocus();
      advance(TYPEAHEAD_TIMEOUT);
      press('d');
      press('u');
      expect(item('Duplicate')).toHaveFocus();
    });

    it('starts from the first item with focus on the menu itself', () => {
      render(<Files />);
      screen.getByRole('menu').focus();
      press('r');
      expect(item('Rename')).toHaveFocus();
    });

    it.each([
      ['Ctrl', { ctrlKey: true }],
      ['Meta', { metaKey: true }],
      ['Alt', { altKey: true }],
    ])('leaves a letter typed with %s alone', (_, init) => {
      render(<Files />);
      item('Rename').focus();
      expect(press('s', init)).toBe(true);
      expect(item('Rename')).toHaveFocus();
    });

    it('leaves a letter an item’s own handler claimed', () => {
      render(
        <Menu onKeyDown={e => e.preventDefault()}>
          <button role="menuitem">Rename</button>
          <button role="menuitem">Share</button>
        </Menu>
      );
      item('Rename').focus();
      press('s');
      expect(item('Rename')).toHaveFocus();
    });

    it('leaves no timer behind once it unmounts', () => {
      const { unmount } = render(<Files />);
      item('Rename').focus();
      press('s');
      unmount();
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
