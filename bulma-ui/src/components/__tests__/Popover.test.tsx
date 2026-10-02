import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverFooter,
  PopoverHeader,
} from '../Popover';
import { Button } from '../../elements/Button';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';

const FilterPopover: React.FC<
  Partial<React.ComponentProps<typeof Popover>>
> = ({ trigger = <button>Filters</button>, ...props }) => (
  <Popover trigger={trigger} {...props}>
    <Popover.Header>Filter rows</Popover.Header>
    <Popover.Body>
      <button>First</button>
      <button>Last</button>
    </Popover.Body>
  </Popover>
);

const panel = () => screen.queryByRole('dialog');
const openWith = (name = 'Filters') =>
  fireEvent.click(screen.getByRole('button', { name }));

afterEach(() => {
  resetDevWarnings();
  jest.restoreAllMocks();
});

describe('Popover', () => {
  describe('trigger', () => {
    it('describes the popover it opens, and leaves aria-controls off while closed', () => {
      render(<FilterPopover />);
      const trigger = screen.getByRole('button', { name: 'Filters' });
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).not.toHaveAttribute('aria-controls');
      expect(panel()).toBeNull();
    });

    it('opens and closes the panel on click, naming it in aria-controls while open', () => {
      const onOpenChange = jest.fn();
      render(<FilterPopover onOpenChange={onOpenChange} />);
      const trigger = screen.getByRole('button', { name: 'Filters' });

      fireEvent.click(trigger);
      const dialog = screen.getByRole('dialog', { name: 'Filter rows' });
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-controls', dialog.id);
      expect(onOpenChange).toHaveBeenLastCalledWith(true);

      fireEvent.click(trigger);
      expect(panel()).toBeNull();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it("runs the trigger's own onClick first, and keeps it closed when that prevents the default", () => {
      const calls: string[] = [];
      const { rerender } = render(
        <FilterPopover
          trigger={<button onClick={() => calls.push('own')}>Filters</button>}
          onOpenChange={() => calls.push('popover')}
        />
      );
      openWith();
      expect(calls).toEqual(['own', 'popover']);
      expect(panel()).toBeInTheDocument();
      openWith();

      rerender(
        <FilterPopover
          trigger={<button onClick={e => e.preventDefault()}>Filters</button>}
        />
      );
      openWith();
      expect(panel()).toBeNull();
    });

    it('keeps a ref on the trigger element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<FilterPopover trigger={<Button ref={ref}>Filters</Button>} />);
      expect(ref.current).toBe(screen.getByRole('button', { name: 'Filters' }));
    });

    it('leaves a button trigger to the browser for Enter and Space', () => {
      render(<FilterPopover />);
      const trigger = screen.getByRole('button', { name: 'Filters' });
      fireEvent.keyDown(trigger, { key: 'Enter' });
      fireEvent.keyDown(trigger, { key: ' ' });
      expect(panel()).toBeNull();
    });

    it('gives an intrinsic non-control trigger a button role and a tab stop, and toggles it with Enter and Space', () => {
      render(<FilterPopover trigger={<span>Filters</span>} />);
      const trigger = screen.getByRole('button', { name: 'Filters' });
      expect(trigger.tagName).toBe('SPAN');
      expect(trigger).toHaveAttribute('tabindex', '0');

      fireEvent.keyDown(trigger, { key: 'Enter' });
      expect(panel()).toBeInTheDocument();
      fireEvent.keyDown(trigger, { key: 'Enter' });
      expect(panel()).toBeNull();

      const space = fireEvent.keyDown(trigger, { key: ' ' });
      expect(space).toBe(false); // default prevented, so the page doesn't scroll
      expect(panel()).toBeInTheDocument();
    });

    it("keeps an intrinsic trigger's own role and tabIndex", () => {
      render(
        <FilterPopover
          trigger={
            <span role="link" tabIndex={-1}>
              Filters
            </span>
          }
        />
      );
      const trigger = screen.getByRole('link', { name: 'Filters' });
      expect(trigger).toHaveAttribute('tabindex', '-1');
    });

    it('does not toggle on a held key', () => {
      render(<FilterPopover trigger={<span>Filters</span>} />);
      const trigger = screen.getByRole('button', { name: 'Filters' });
      fireEvent.keyDown(trigger, { key: 'Enter', repeat: true });
      expect(panel()).toBeNull();
    });

    it('ignores other keys and keys from inside the trigger', () => {
      render(
        <FilterPopover
          trigger={
            <div>
              <span tabIndex={0}>Inner</span>
            </div>
          }
        />
      );
      const trigger = screen.getByRole('button', { name: 'Inner' });
      fireEvent.keyDown(trigger, { key: 'a' });
      fireEvent.keyDown(screen.getByText('Inner'), { key: 'Enter' });
      expect(panel()).toBeNull();
    });

    it("runs the trigger's own onKeyDown first, and stands aside when it prevents the default", () => {
      const own = jest.fn((e: React.KeyboardEvent) => e.preventDefault());
      render(<FilterPopover trigger={<span onKeyDown={own}>Filters</span>} />);
      fireEvent.keyDown(screen.getByRole('button', { name: 'Filters' }), {
        key: 'Enter',
      });
      expect(own).toHaveBeenCalled();
      expect(panel()).toBeNull();
    });

    it('treats a link with an href as a link: Enter is the browser’s, Space opens', () => {
      render(<FilterPopover trigger={<a href="#filters">Filters</a>} />);
      const trigger = screen.getByRole('link', { name: 'Filters' });
      expect(trigger).not.toHaveAttribute('tabindex');
      fireEvent.keyDown(trigger, { key: 'Enter' });
      expect(panel()).toBeNull();
      fireEvent.keyDown(trigger, { key: ' ' });
      expect(panel()).toBeInTheDocument();
    });

    it('gives a link without an href a button role', () => {
      render(<FilterPopover trigger={<a>Filters</a>} />);
      expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute(
        'tabindex',
        '0'
      );
    });

    it('adds no role to a component trigger', () => {
      render(<FilterPopover trigger={<Button>Filters</Button>} />);
      const trigger = screen.getByRole('button', { name: 'Filters' });
      expect(trigger).not.toHaveAttribute('role');
      expect(trigger).not.toHaveAttribute('tabindex');
    });
  });

  describe('open state', () => {
    it('starts open with defaultOpen', () => {
      render(<FilterPopover defaultOpen />);
      expect(panel()).toBeInTheDocument();
    });

    it('follows `open` when controlled, reporting the trigger through onOpenChange', () => {
      const onOpenChange = jest.fn();
      const { rerender } = render(
        <FilterPopover open onOpenChange={onOpenChange} />
      );
      openWith();
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(panel()).toBeInTheDocument();

      rerender(<FilterPopover open={false} onOpenChange={onOpenChange} />);
      expect(panel()).toBeNull();
    });

    it('lets the trigger drive a controlled popover through onOpenChange', () => {
      const Controlled = () => {
        const [open, setOpen] = useState(false);
        return <FilterPopover open={open} onOpenChange={setOpen} />;
      };
      render(<Controlled />);
      openWith();
      expect(panel()).toBeInTheDocument();
      fireEvent.keyDown(screen.getByRole('button', { name: 'First' }), {
        key: 'Escape',
      });
      expect(panel()).toBeNull();
    });
  });

  describe('focus', () => {
    it('moves focus to the first tab stop on open and back to the trigger on close', () => {
      render(<FilterPopover />);
      const trigger = screen.getByRole('button', { name: 'Filters' });
      trigger.focus();
      fireEvent.click(trigger);
      expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();

      fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
      expect(panel()).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it('returns focus to the trigger even when the click did not focus it', () => {
      render(<FilterPopover />);
      const trigger = screen.getByRole('button', { name: 'Filters' });
      fireEvent.click(trigger); // as Safari does, without focusing the button
      fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
      expect(trigger).toHaveFocus();
    });

    it('focuses the panel itself when it holds no tab stop', () => {
      render(
        <Popover trigger={<button>Help</button>} ariaLabel="Help">
          Plain text only.
        </Popover>
      );
      openWith('Help');
      expect(screen.getByRole('dialog', { name: 'Help' })).toHaveFocus();
    });

    it('wraps Tab inside the panel by default', () => {
      render(<FilterPopover />);
      openWith();
      const last = screen.getByRole('button', { name: 'Last' });
      last.focus();
      fireEvent.keyDown(last, { key: 'Tab' });
      expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    });

    describe('with trapFocus={false}', () => {
      it('still moves focus in and back, and lets Tab leave', () => {
        render(<FilterPopover trapFocus={false} />);
        const trigger = screen.getByRole('button', { name: 'Filters' });
        fireEvent.click(trigger);
        const first = screen.getByRole('button', { name: 'First' });
        expect(first).toHaveFocus();

        const last = screen.getByRole('button', { name: 'Last' });
        last.focus();
        // Not prevented: the browser moves on past the panel.
        expect(fireEvent.keyDown(last, { key: 'Tab' })).toBe(true);
        expect(last).toHaveFocus();

        fireEvent.keyDown(last, { key: 'Escape' });
        expect(panel()).toBeNull();
        expect(trigger).toHaveFocus();
      });

      it('focuses the panel when it holds no tab stop', () => {
        render(
          <Popover
            trigger={<button>Help</button>}
            ariaLabel="Help"
            trapFocus={false}
          >
            Plain text only.
          </Popover>
        );
        openWith('Help');
        expect(screen.getByRole('dialog')).toHaveFocus();
      });

      it('leaves focus alone when it already moved outside the panel', () => {
        const Page = () => {
          const [open, setOpen] = useState(true);
          return (
            <>
              <FilterPopover
                trapFocus={false}
                open={open}
                onOpenChange={setOpen}
              />
              <button onClick={() => setOpen(false)}>Elsewhere</button>
            </>
          );
        };
        render(<Page />);
        const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
        elsewhere.focus();
        fireEvent.click(elsewhere);
        expect(panel()).toBeNull();
        expect(elsewhere).toHaveFocus();
      });

      it('hands focus back from <body> once the panel is gone', () => {
        render(<FilterPopover trapFocus={false} />);
        openWith();
        (document.activeElement as HTMLElement).blur();
        fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
        expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus();
      });
    });

    it('has nothing to hand focus back to when the trigger renders nothing', () => {
      const Nothing = () => null;
      const { rerender } = render(
        <Popover trigger={<Nothing />} ariaLabel="Orphan" defaultOpen>
          <button>Inside</button>
        </Popover>
      );
      expect(screen.getByRole('button', { name: 'Inside' })).toHaveFocus();
      fireEvent.keyDown(screen.getByRole('button', { name: 'Inside' }), {
        key: 'Escape',
      });
      expect(panel()).toBeNull();
      expect(document.body).toHaveFocus();

      rerender(
        <Popover
          trigger={<Nothing />}
          ariaLabel="Orphan"
          appendToBody
          trapFocus={false}
          open
        >
          <button>Inside</button>
        </Popover>
      );
      rerender(
        <Popover
          trigger={<Nothing />}
          ariaLabel="Orphan"
          appendToBody
          trapFocus={false}
          open={false}
        >
          <button>Inside</button>
        </Popover>
      );
      expect(document.body).toHaveFocus();
    });
  });

  describe('dismissal', () => {
    it('closes on Escape from inside the panel', () => {
      render(<FilterPopover defaultOpen />);
      const event = fireEvent.keyDown(
        screen.getByRole('button', { name: 'First' }),
        { key: 'Escape' }
      );
      expect(event).toBe(false);
      expect(panel()).toBeNull();
    });

    it('keeps the panel open on Escape when closeOnEscape is false', () => {
      render(<FilterPopover defaultOpen closeOnEscape={false} />);
      fireEvent.keyDown(screen.getByRole('button', { name: 'First' }), {
        key: 'Escape',
      });
      fireEvent.keyDown(screen.getByRole('button', { name: 'Filters' }), {
        key: 'Escape',
      });
      expect(panel()).toBeInTheDocument();
    });

    it('ignores other keys in the panel', () => {
      render(<FilterPopover defaultOpen />);
      fireEvent.keyDown(screen.getByRole('button', { name: 'First' }), {
        key: 'a',
      });
      expect(panel()).toBeInTheDocument();
    });

    it('leaves an Escape that content already handled', () => {
      render(
        <Popover trigger={<button>Open</button>} ariaLabel="Search" defaultOpen>
          <input
            aria-label="Query"
            onKeyDown={e => e.key === 'Escape' && e.preventDefault()}
          />
        </Popover>
      );
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
      expect(panel()).toBeInTheDocument();
    });

    it('leaves Escape to a dialog nested in the panel', () => {
      render(
        <Popover trigger={<button>Open</button>} ariaLabel="Outer" defaultOpen>
          <div role="dialog" aria-label="Calendar">
            <button>Day</button>
          </div>
        </Popover>
      );
      fireEvent.keyDown(screen.getByRole('button', { name: 'Day' }), {
        key: 'Escape',
      });
      expect(screen.getByRole('dialog', { name: 'Outer' })).toBeInTheDocument();
    });

    it('closes on Escape from content the panel portals elsewhere', () => {
      const Elsewhere = () =>
        createPortal(<button>Portaled</button>, document.body);
      render(
        <Popover trigger={<button>Open</button>} ariaLabel="Outer" defaultOpen>
          <Elsewhere />
        </Popover>
      );
      fireEvent.keyDown(screen.getByRole('button', { name: 'Portaled' }), {
        key: 'Escape',
      });
      expect(panel()).toBeNull();
    });

    it('closes only the innermost of two nested popovers on Escape', () => {
      render(
        <Popover trigger={<button>Outer</button>} ariaLabel="Outer" defaultOpen>
          <Popover
            trigger={<button>Inner</button>}
            ariaLabel="Inner"
            appendToBody
            defaultOpen
          >
            <button>Deep</button>
          </Popover>
        </Popover>
      );
      fireEvent.keyDown(screen.getByRole('button', { name: 'Deep' }), {
        key: 'Escape',
      });
      expect(screen.queryByRole('dialog', { name: 'Inner' })).toBeNull();
      expect(screen.getByRole('dialog', { name: 'Outer' })).toBeInTheDocument();
    });

    it('closes on Escape from the trigger while open, and does nothing while closed', () => {
      const onOpenChange = jest.fn();
      render(<FilterPopover onOpenChange={onOpenChange} trapFocus={false} />);
      const trigger = screen.getByRole('button', { name: 'Filters' });
      fireEvent.keyDown(trigger, { key: 'Escape' });
      expect(onOpenChange).not.toHaveBeenCalled();

      fireEvent.click(trigger);
      trigger.focus();
      expect(fireEvent.keyDown(trigger, { key: 'Escape' })).toBe(false);
      expect(panel()).toBeNull();
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('closes on a pointerdown outside, and not on one inside or on the trigger', () => {
      render(
        <>
          <button>Outside</button>
          <FilterPopover defaultOpen />
        </>
      );
      fireEvent.pointerDown(screen.getByRole('button', { name: 'First' }));
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Filters' }));
      expect(panel()).toBeInTheDocument();

      fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));
      expect(panel()).toBeNull();
    });

    it('keeps the panel open on an outside pointerdown when closeOnClickOutside is false', () => {
      render(
        <>
          <button>Outside</button>
          <FilterPopover defaultOpen closeOnClickOutside={false} />
        </>
      );
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));
      expect(panel()).toBeInTheDocument();
    });

    it('counts content the panel portals elsewhere as inside', () => {
      const Elsewhere = () =>
        createPortal(<button>Portaled</button>, document.body);
      render(
        <>
          <button>Outside</button>
          <Popover
            trigger={<button>Open</button>}
            ariaLabel="Outer"
            defaultOpen
          >
            <Elsewhere />
          </Popover>
        </>
      );
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Portaled' }));
      expect(panel()).toBeInTheDocument();
      // The next press is judged on its own.
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));
      expect(panel()).toBeNull();
    });

    it('closes from Popover.Close, after its own onClick, and hands focus back', () => {
      const onClick = jest.fn();
      render(
        <Popover trigger={<button>Open</button>} ariaLabel="Share">
          <Popover.Footer>
            <Popover.Close onClick={onClick}>Done</Popover.Close>
          </Popover.Footer>
        </Popover>
      );
      openWith('Open');
      fireEvent.click(screen.getByRole('button', { name: 'Done' }));
      expect(onClick).toHaveBeenCalled();
      expect(panel()).toBeNull();
      expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
    });

    it('stays open when the Close button’s onClick prevents the default', () => {
      render(
        <Popover trigger={<button>Open</button>} ariaLabel="Share" defaultOpen>
          <Popover.Close onClick={e => e.preventDefault()}>Done</Popover.Close>
        </Popover>
      );
      fireEvent.click(screen.getByRole('button', { name: 'Done' }));
      expect(panel()).toBeInTheDocument();
    });
  });

  describe('accessible name', () => {
    it('is named by its header', () => {
      render(<FilterPopover defaultOpen />);
      const dialog = screen.getByRole('dialog');
      const header = screen.getByText('Filter rows');
      expect(dialog).toHaveAttribute('aria-labelledby', header.id);
      expect(dialog).not.toHaveAttribute('aria-modal');
      expect(dialog).toHaveAccessibleName('Filter rows');
    });

    it('takes ariaLabel over the header', () => {
      render(<FilterPopover defaultOpen ariaLabel="Row filters" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Row filters');
      expect(dialog).not.toHaveAttribute('aria-labelledby');
    });

    it('warns in development when the panel has no name', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <Popover trigger={<button>Open</button>} defaultOpen>
          Nameless
        </Popover>
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('no accessible name')
      );
    });

    it('does not warn when the panel is named', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(<FilterPopover defaultOpen />);
      render(
        <Popover trigger={<button>Open</button>} ariaLabel="Named" defaultOpen>
          Text
        </Popover>
      );
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('placement', () => {
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;

    const setViewport = (width: number, height: number) => {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: width,
      });
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: height,
      });
    };

    afterEach(() => setViewport(originalWidth, originalHeight));

    const rect = (r: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    }) =>
      ({
        ...r,
        width: r.right - r.left,
        height: r.bottom - r.top,
        x: r.left,
        y: r.top,
        toJSON: () => ({}),
      }) as DOMRect;

    /** Mocks the wrapper's and the panel's rects, then re-measures. */
    const measure = (
      container: HTMLElement,
      anchor: DOMRect,
      size: { width: number; height: number }
    ) => {
      jest
        .spyOn(container.querySelector('.popover')!, 'getBoundingClientRect')
        .mockReturnValue(anchor);
      jest
        .spyOn(screen.getByRole('dialog'), 'getBoundingClientRect')
        .mockReturnValue(
          rect({ top: 0, left: 0, right: size.width, bottom: size.height })
        );
      act(() => {
        fireEvent(window, new Event('resize'));
      });
    };

    it('opens below on the left by default, placed by CSS', () => {
      render(<FilterPopover defaultOpen />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('popover-content', 'is-bottom-left');
      expect(dialog).not.toHaveClass('is-portal');
      expect(dialog).not.toHaveAttribute('style');
    });

    it.each(['bottom-right', 'top-left', 'top-right'] as const)(
      'takes position="%s"',
      position => {
        render(<FilterPopover defaultOpen position={position} />);
        expect(screen.getByRole('dialog')).toHaveClass(`is-${position}`);
      }
    );

    it('flips an auto panel above the trigger when there is no room below', () => {
      setViewport(1000, 1000);
      const { container } = render(
        <FilterPopover defaultOpen position="auto" />
      );
      measure(
        container,
        rect({ top: 900, bottom: 930, left: 50, right: 150 }),
        {
          width: 200,
          height: 150,
        }
      );
      expect(screen.getByRole('dialog')).toHaveClass('is-top-left');
      expect(screen.getByRole('dialog')).not.toHaveAttribute('style');
    });

    it('portals into document.body with fixed coordinates at the trigger’s edge', () => {
      setViewport(1000, 1000);
      const { container } = render(
        <FilterPopover defaultOpen appendToBody position="auto" />
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog.parentElement).toBe(document.body);
      expect(dialog).toHaveClass('is-portal');
      expect(dialog.style.position).toBe('fixed');

      measure(
        container,
        rect({ top: 100, bottom: 130, left: 900, right: 960 }),
        {
          width: 200,
          height: 150,
        }
      );
      expect(dialog).toHaveClass('is-bottom-right');
      // The gap is the stylesheet's, so the coordinates are the edge itself.
      expect(dialog.style.top).toBe('130px');
      expect(dialog.style.left).toBe('760px');

      measure(
        container,
        rect({ top: 900, bottom: 930, left: 50, right: 110 }),
        {
          width: 200,
          height: 150,
        }
      );
      expect(dialog).toHaveClass('is-top-left');
      expect(dialog.style.top).toBe('750px');
      expect(dialog.style.left).toBe('50px');
    });

    it('closes a portaled panel on an outside pointerdown but not on one inside it', () => {
      render(
        <>
          <button>Outside</button>
          <FilterPopover defaultOpen appendToBody />
        </>
      );
      fireEvent.pointerDown(screen.getByRole('button', { name: 'First' }));
      expect(panel()).toBeInTheDocument();
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));
      expect(panel()).toBeNull();
    });
  });

  describe('props and classes', () => {
    it('puts className, helper props and attributes on the wrapper, contentClassName on the panel', () => {
      const { container } = render(
        <FilterPopover
          defaultOpen
          className="custom"
          m="2"
          data-testid="wrapper"
          contentClassName="panel-extra"
        />
      );
      const wrapper = screen.getByTestId('wrapper');
      expect(wrapper).toBe(container.firstChild);
      expect(wrapper).toHaveClass('popover', 'is-active', 'custom', 'm-2');
      expect(screen.getByRole('dialog')).toHaveClass(
        'popover-content',
        'panel-extra'
      );
    });

    it('renders the parts with their classes and helper props', () => {
      render(
        <Popover trigger={<button>Open</button>} defaultOpen>
          <Popover.Header color="primary">Title</Popover.Header>
          <Popover.Body p="2" className="b">
            Body
          </Popover.Body>
          <Popover.Footer mt="1">
            <Popover.Close color="primary">Done</Popover.Close>
          </Popover.Footer>
        </Popover>
      );
      expect(screen.getByText('Title')).toHaveClass(
        'popover-header',
        'has-text-primary'
      );
      expect(screen.getByText('Body')).toHaveClass('popover-body', 'p-2', 'b');
      expect(screen.getByText('Done').parentElement).toHaveClass(
        'popover-footer',
        'mt-1'
      );
      const close = screen.getByRole('button', { name: 'Done' });
      expect(close).toHaveClass('button', 'is-primary');
      expect(close).toHaveAttribute('type', 'button');
    });

    it('keeps a submit type on Popover.Close', () => {
      render(
        <Popover trigger={<button>Open</button>} ariaLabel="Form" defaultOpen>
          <Popover.Close type="submit">Apply</Popover.Close>
        </Popover>
      );
      expect(screen.getByRole('button', { name: 'Apply' })).toHaveAttribute(
        'type',
        'submit'
      );
    });

    it('renders the parts outside a Popover without failing', () => {
      render(
        <>
          <PopoverHeader>Loose header</PopoverHeader>
          <PopoverClose>Loose close</PopoverClose>
        </>
      );
      expect(screen.getByText('Loose header')).not.toHaveAttribute('id');
      fireEvent.click(screen.getByRole('button', { name: 'Loose close' }));
    });

    it('prefixes every class under ConfigProvider classPrefix', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <Popover trigger={<button>Open</button>} defaultOpen appendToBody>
            <Popover.Header>Title</Popover.Header>
            <Popover.Body>Body</Popover.Body>
            <Popover.Footer>
              <Popover.Close>Done</Popover.Close>
            </Popover.Footer>
          </Popover>
        </ConfigProvider>
      );
      expect(container.firstChild).toHaveClass(
        'bestax-popover',
        'bestax-is-active'
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass(
        'bestax-popover-content',
        'bestax-is-bottom-left',
        'bestax-is-portal'
      );
      expect(screen.getByText('Title')).toHaveClass('bestax-popover-header');
      expect(screen.getByText('Body')).toHaveClass('bestax-popover-body');
      expect(screen.getByText('Done').parentElement).toHaveClass(
        'bestax-popover-footer'
      );
      expect(screen.getByRole('button', { name: 'Done' })).toHaveClass(
        'bestax-button'
      );
      expect(dialog.className).not.toMatch(/(^|\s)popover-content(\s|$)/);
    });
  });

  describe('Compound components', () => {
    it('attaches the parts as statics', () => {
      expect(Popover.Header).toBe(PopoverHeader);
      expect(Popover.Body).toBe(PopoverBody);
      expect(Popover.Footer).toBe(PopoverFooter);
      expect(Popover.Close).toBe(PopoverClose);
      expect(Popover.displayName).toBe('Popover');
    });

    it('renders through the dot-notation', () => {
      render(<FilterPopover defaultOpen />);
      expect(screen.getByText('Filter rows')).toHaveClass('popover-header');
    });
  });

  describe('in a shadow root', () => {
    it('tells a press inside the shadow-rooted panel from one outside it', () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const root = host.attachShadow({ mode: 'open' });
      const mount = document.createElement('div');
      root.appendChild(mount);
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      try {
        render(<FilterPopover defaultOpen />, {
          container: mount,
          baseElement: mount,
        });
        fireEvent.pointerDown(mount.querySelector('.popover-body button')!);
        expect(mount.querySelector('[role="dialog"]')).not.toBeNull();
        fireEvent.pointerDown(outside);
        expect(mount.querySelector('[role="dialog"]')).toBeNull();
      } finally {
        host.remove();
        outside.remove();
      }
    });
  });

  describe('hydration', () => {
    const hydrate = async (ui: React.ReactElement) => {
      const container = document.createElement('div');
      container.innerHTML = renderToString(ui);
      document.body.appendChild(container);
      const serverHtml = container.innerHTML;
      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      await act(async () => {
        root = hydrateRoot(container, ui);
      });
      return {
        container,
        serverHtml,
        errorSpy,
        cleanup: async () => {
          await act(async () => root!.unmount());
          container.remove();
        },
      };
    };

    it('server-renders an open inline panel and hydrates it without a mismatch', async () => {
      const ui = <FilterPopover defaultOpen />;
      const { serverHtml, errorSpy, cleanup } = await hydrate(ui);
      try {
        expect(serverHtml).toContain('role="dialog"');
        expect(errorSpy).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
      } finally {
        await cleanup();
      }
    });

    it('leaves a portaled panel out of the server markup and shows it after hydration', async () => {
      const ui = <FilterPopover defaultOpen appendToBody />;
      const { container, serverHtml, errorSpy, cleanup } = await hydrate(ui);
      try {
        expect(serverHtml).not.toContain('role="dialog"');
        expect(serverHtml).not.toContain('aria-controls');
        expect(errorSpy).not.toHaveBeenCalled();
        const dialog = screen.getByRole('dialog');
        expect(dialog.parentElement).toBe(document.body);
        expect(container.querySelector('button')).toHaveAttribute(
          'aria-controls',
          dialog.id
        );
        expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
      } finally {
        await cleanup();
      }
    });
  });
});
