import React, { createRef, useRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  FloatButton,
  FloatButtonBackToTop,
  FloatButtonSpeedDial,
  type FloatButtonProps,
  type FloatButtonSpeedDialDirection,
} from '../FloatButton';
import { FloatButtons } from '../FloatButtons';
import { Badge } from '../Badge';
import { Icon } from '../../elements/Icon';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';

beforeEach(() => resetDevWarnings());
afterEach(() => vi.restoreAllMocks());

/** Props as a JavaScript caller might pass them, past the types. */
const untyped = (props: Record<string, unknown>) =>
  props as unknown as FloatButtonProps;

const tooltipOf = (button: HTMLElement) =>
  button.parentElement!.querySelector('[role="tooltip"]');

describe('FloatButton', () => {
  it('renders a round IconButton inside an Affix in the bottom-right corner, with its name as a tooltip', () => {
    render(<FloatButton aria-label="New message" icon="pen" />);
    const button = screen.getByRole('button', { name: 'New message' });
    expect(button.className).toBe('button is-rounded icon-button float-button');
    expect(button).toHaveAttribute('type', 'button');
    const wrapper = button.parentElement!;
    expect(wrapper).toHaveClass('tooltip', 'is-left');
    expect(wrapper.parentElement!.className).toBe('affix is-bottom-right');
    const tooltip = tooltipOf(button)!;
    expect(tooltip).toHaveTextContent('New message');
    expect(tooltip).toHaveAttribute('aria-hidden', 'true');
    expect(button).not.toHaveAttribute('aria-describedby');
  });

  it('opens its tooltip away from a left corner', () => {
    render(
      <FloatButton aria-label="Help" icon="question" position="top-left" />
    );
    const button = screen.getByRole('button', { name: 'Help' });
    expect(button.parentElement).toHaveClass('is-right');
    expect(button.closest('.affix')).toHaveClass('is-top-left');
  });

  it('gives a button named by aria-labelledby no tooltip', () => {
    render(
      <>
        <span id="compose-name">Compose</span>
        <FloatButton aria-labelledby="compose-name" icon="pen" />
      </>
    );
    const button = screen.getByRole('button', { name: 'Compose' });
    expect(button.parentElement).toHaveClass('affix');
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('gives a button with a blank name no tooltip, and IconButton warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<FloatButton aria-label=" " icon="pen" />);
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('<IconButton> has no accessible name')
    );
  });

  it('passes the IconButton props, the helper props and the attributes to the button', () => {
    const onClick = vi.fn();
    render(
      <FloatButton
        aria-label="Save"
        icon="save"
        color="primary"
        size="large"
        isLoading
        m="2"
        className="mine"
        data-testid="save"
        onClick={onClick}
      />
    );
    const button = screen.getByTestId('save');
    expect(button).toHaveClass(
      'button',
      'is-primary',
      'is-large',
      'is-loading',
      'is-rounded',
      'icon-button',
      'float-button',
      'm-2',
      'mine'
    );
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('forwards its ref to the button, and follows as', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <FloatButton as="a" href="/new" ref={ref} aria-label="New" icon="plus" />
    );
    const link = screen.getByRole('link', { name: 'New' });
    expect(ref.current).toBe(link);
    expect(link).toHaveAttribute('href', '/new');
    expect(link).not.toHaveAttribute('type');
  });

  it('renders into a portal with portal', async () => {
    const { container } = render(
      <FloatButton aria-label="Chat" icon="comment" portal />
    );
    await act(async () => {});
    const affix = screen
      .getByRole('button', { name: 'Chat' })
      .closest('.affix');
    expect(affix!.parentElement).toBe(document.body);
    expect(container).toBeEmptyDOMElement();
  });

  it('stays round when a caller past the types turns isRounded off', () => {
    render(
      <FloatButton
        {...untyped({ 'aria-label': 'New', icon: 'plus', isRounded: false })}
      />
    );
    expect(screen.getByRole('button', { name: 'New' })).toHaveClass(
      'is-rounded'
    );
  });

  describe('showLabel', () => {
    it('prints the name beside the icon as a pill, through Button, with no aria-label or tooltip', () => {
      render(
        <FloatButton
          aria-label="Compose"
          icon="pen"
          showLabel
          color="primary"
        />
      );
      const button = screen.getByRole('button', { name: 'Compose' });
      expect(button.className).toBe(
        'button is-primary is-rounded float-button'
      );
      expect(button).not.toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('type', 'button');
      expect(button.children).toHaveLength(2);
      expect(button.children[0]).toHaveClass('icon');
      expect(button.children[0].querySelector('i')).toHaveClass('fa-pen');
      expect(button.children[1]).toHaveTextContent('Compose');
      expect(document.querySelector('[role="tooltip"]')).toBeNull();
    });

    it('draws a glyph given as children, and keeps a submit type', () => {
      render(
        <FloatButton aria-label="Send" showLabel type="submit">
          <Icon name="paper-plane" />
        </FloatButton>
      );
      const button = screen.getByRole('button', { name: 'Send' });
      expect(button).toHaveAttribute('type', 'submit');
      expect(button.querySelector('i')).toHaveClass('fa-paper-plane');
    });

    it('gives a link no type', () => {
      render(
        <FloatButton
          as="a"
          href="/new"
          aria-label="New"
          icon="plus"
          showLabel
        />
      );
      expect(screen.getByRole('link', { name: 'New' })).not.toHaveAttribute(
        'type'
      );
    });

    it('warns, and draws the icon alone, when aria-labelledby names it', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <>
          <span id="name">Compose</span>
          <FloatButton aria-labelledby="name" icon="pen" showLabel />
          <FloatButton aria-labelledby="name" icon="pen" showLabel />
        </>
      );
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('has no aria-label to print')
      );
      const [button] = screen.getAllByRole('button', { name: 'Compose' });
      expect(button).toHaveClass('icon-button');
    });
  });

  it('renders the same markup on the server and the client', async () => {
    const ui = <FloatButton aria-label="New message" icon="pen" />;
    const html = renderToString(ui);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(container, ui);
    });
    expect(error).not.toHaveBeenCalled();
    expect(container.innerHTML).toBe(html);
    await act(async () => root!.unmount());
    container.remove();
  });

  it('prefixes every class under a ConfigProvider classPrefix', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <FloatButton aria-label="New" icon="plus" />
        <FloatButton aria-label="Compose" icon="pen" showLabel />
      </ConfigProvider>
    );
    const classes = Array.from(container.querySelectorAll('[class]')).flatMap(
      el => Array.from(el.classList)
    );
    expect(classes.length).toBeGreaterThan(0);
    expect(classes.filter(c => !c.startsWith('bestax-'))).toEqual([
      'fas',
      'fa-plus',
      'fas',
      'fa-pen',
    ]);
    expect(container.querySelector('.bestax-float-button')).not.toBeNull();
  });

  describe('Compound components', () => {
    it('attaches SpeedDial and BackToTop', () => {
      expect(FloatButton.SpeedDial).toBe(FloatButtonSpeedDial);
      expect(FloatButton.BackToTop).toBe(FloatButtonBackToTop);
      expect(FloatButton.displayName).toBe('FloatButton');
    });

    it('renders the parts through dot notation', () => {
      render(
        <FloatButtons>
          <FloatButton.BackToTop />
          <FloatButton.SpeedDial aria-label="Create" icon="plus">
            <FloatButton aria-label="Note" icon="note-sticky" />
          </FloatButton.SpeedDial>
        </FloatButtons>
      );
      expect(
        screen.getByRole('button', { name: 'Create' })
      ).toBeInTheDocument();
      expect(
        document.querySelector('.float-button-back-to-top')
      ).not.toBeNull();
    });
  });
});

describe('FloatButtons', () => {
  it('places the buttons inside in its own Affix, with their tooltips away from its side', () => {
    render(
      <FloatButtons position="bottom-left">
        <FloatButton aria-label="Help" icon="question" />
        <FloatButton aria-label="Chat" icon="comment" />
      </FloatButtons>
    );
    const help = screen.getByRole('button', { name: 'Help' });
    const stack = help.closest('.affix')!;
    expect(stack.className).toBe('affix is-bottom-left float-buttons');
    expect(document.querySelectorAll('.affix')).toHaveLength(1);
    expect(help.parentElement).toHaveClass('tooltip', 'is-right');
    expect(help.parentElement!.parentElement).toBe(stack);
  });

  it('lets a button inside turn the stack’s or the dial’s showLabels off', () => {
    render(
      <FloatButtons showLabels>
        <FloatButton aria-label="Help" icon="question" showLabel={false} />
        <FloatButton.SpeedDial
          aria-label="Create"
          icon="plus"
          defaultOpen
          showLabels
        >
          <FloatButton aria-label="Note" icon="note-sticky" />
          <FloatButton aria-label="Task" icon="check" showLabel={false} />
        </FloatButton.SpeedDial>
      </FloatButtons>
    );
    const help = screen.getByRole('button', { name: 'Help' });
    expect(help).toHaveAttribute('aria-label', 'Help');
    expect(help).toHaveClass('icon-button');
    expect(screen.getByRole('menuitem', { name: 'Note' })).toHaveTextContent(
      'Note'
    );
    expect(screen.getByRole('menuitem', { name: 'Task' })).toHaveAttribute(
      'aria-label',
      'Task'
    );
  });

  it('prints every button’s name with showLabels, and hands it to a speed dial’s actions', () => {
    render(
      <FloatButtons showLabels>
        <FloatButton aria-label="Help" icon="question" />
        <FloatButton.SpeedDial aria-label="Create" icon="plus" defaultOpen>
          <FloatButton aria-label="Note" icon="note-sticky" />
        </FloatButton.SpeedDial>
        <FloatButton.SpeedDial
          aria-label="Share"
          icon="share"
          defaultOpen
          showLabels={false}
        >
          <FloatButton aria-label="Copy" icon="link" />
        </FloatButton.SpeedDial>
      </FloatButtons>
    );
    const help = screen.getByRole('button', { name: 'Help' });
    expect(help).toHaveTextContent('Help');
    expect(help).not.toHaveAttribute('aria-label');
    expect(screen.getByRole('menuitem', { name: 'Note' })).toHaveTextContent(
      'Note'
    );
    // A dial's own showLabels wins, and its trigger stays an icon.
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveAttribute(
      'aria-label',
      'Copy'
    );
    expect(screen.getByRole('button', { name: 'Create' })).toHaveClass(
      'icon-button'
    );
  });

  it('takes a Badge around a FloatButton', () => {
    render(
      <FloatButtons>
        <Badge content={3} overlap="circle">
          <FloatButton aria-label="Inbox" icon="inbox" />
        </Badge>
      </FloatButtons>
    );
    const inbox = screen.getByRole('button', { name: 'Inbox' });
    expect(document.querySelectorAll('.affix')).toHaveLength(1);
    expect(inbox.closest('.affix')).toHaveClass('float-buttons');
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('puts the helper props, className, attributes and ref on its div', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <FloatButtons ref={ref} mb="6" className="mine" id="stack">
        <FloatButton aria-label="Help" icon="question" />
      </FloatButtons>
    );
    expect(ref.current).toHaveAttribute('id', 'stack');
    expect(ref.current).toHaveClass('affix', 'float-buttons', 'mb-6', 'mine');
    expect(ref.current).not.toHaveAttribute('mb');
  });

  it('prefixes its classes', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ConfigProvider classPrefix="bestax-">
        <FloatButtons ref={ref}>
          <FloatButton aria-label="Help" icon="question" />
        </FloatButtons>
      </ConfigProvider>
    );
    expect(ref.current!.className).toBe(
      'bestax-affix bestax-is-bottom-right bestax-float-buttons'
    );
  });
});

/** A dial with three actions that log what runs. */
const Dial = ({
  log = [],
  ...props
}: Partial<React.ComponentProps<typeof FloatButtonSpeedDial>> & {
  log?: string[];
}) => (
  <FloatButton.SpeedDial
    aria-label="Create"
    icon="plus"
    data-testid="dial"
    {...(props as object)}
  >
    <FloatButton
      aria-label="Note"
      icon="note-sticky"
      onClick={() => log.push('note')}
    />
    <FloatButton
      aria-label="Task"
      icon="check"
      onClick={() => log.push('task')}
    />
    <FloatButton
      aria-label="Event"
      icon="calendar"
      onClick={() => log.push('event')}
    />
  </FloatButton.SpeedDial>
);

const dialTrigger = () =>
  screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement;
const action = (name: string) => screen.getByRole('menuitem', { name });
const menu = () => screen.queryByRole('menu');
const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(document.activeElement!, { key, ...init });

describe('FloatButton.SpeedDial', () => {
  it('renders a closed menu button in an Affix, with no menu in the DOM', () => {
    render(<Dial />);
    const trigger = dialTrigger();
    expect(trigger.className).toBe(
      'button is-rounded icon-button float-button'
    );
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-controls');
    const root = screen.getByTestId('dial');
    expect(root.className).toBe('float-button-speed-dial is-up');
    expect(root.parentElement!.className).toBe('affix is-bottom-right');
    expect(menu()).toBeNull();
    expect(tooltipOf(trigger)).toHaveAttribute('aria-hidden', 'true');
  });

  it('opens down by default from a top corner', () => {
    render(<Dial position="top-left" />);
    expect(screen.getByTestId('dial')).toHaveClass('is-down');
    expect(screen.getByTestId('dial').parentElement).toHaveClass('is-top-left');
  });

  it('takes its corner from FloatButtons, with no Affix of its own', () => {
    render(
      <FloatButtons position="top-right">
        <Dial />
      </FloatButtons>
    );
    const root = screen.getByTestId('dial');
    expect(root).toHaveClass('is-down');
    expect(root.parentElement).toHaveClass('float-buttons');
    expect(document.querySelectorAll('.affix')).toHaveLength(1);
  });

  it('opens on Enter on its nearest action, a menu the trigger names and controls', () => {
    render(<Dial />);
    dialTrigger().focus();
    press('Enter');
    const trigger = dialTrigger();
    const list = menu()!;
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', list.id);
    expect(list).toHaveAttribute('aria-labelledby', trigger.id);
    expect(list).toHaveAccessibleName('Create');
    expect(list).toHaveClass('float-button-actions');
    expect(list).not.toHaveAttribute('aria-orientation');
    expect(screen.getByTestId('dial')).toHaveClass('is-active');
    expect(action('Note')).toHaveFocus();
    for (const name of ['Note', 'Task', 'Event']) {
      expect(action(name)).toHaveAttribute('tabindex', '-1');
      expect(action(name)).toHaveClass('float-button');
      expect(action(name).parentElement).toHaveClass('tooltip', 'is-left');
    }
    expect(document.querySelectorAll('.affix')).toHaveLength(1);
  });

  it('names its menu by the element that names the trigger', () => {
    render(
      <>
        <span id="dial-name">Create</span>
        <Dial aria-label={undefined} aria-labelledby="dial-name" />
      </>
    );
    fireEvent.click(dialTrigger());
    expect(menu()).toHaveAttribute('aria-labelledby', 'dial-name');
    expect(menu()).toHaveAccessibleName('Create');
    // No tooltip around the trigger: it sits in the dial itself.
    expect(dialTrigger().parentElement).toBe(screen.getByTestId('dial'));
  });

  it('toggles on Space and Enter, once for a held key', () => {
    render(<Dial />);
    dialTrigger().focus();
    expect(press(' ')).toBe(false);
    expect(action('Note')).toHaveFocus();
    dialTrigger().focus();
    press('Enter', { repeat: true });
    expect(menu()).not.toBeNull();
    press('Enter');
    expect(menu()).toBeNull();
  });

  it('opens on the arrow along the dial on the nearest action, and on the other on the farthest', () => {
    render(<Dial />);
    dialTrigger().focus();
    expect(press('ArrowUp')).toBe(false);
    expect(action('Note')).toHaveFocus();
    dialTrigger().focus();
    press('ArrowDown');
    expect(action('Event')).toHaveFocus();
    expect(menu()).not.toBeNull();
    dialTrigger().focus();
    press('ArrowUp');
    expect(action('Note')).toHaveFocus();
    dialTrigger().focus();
    expect(press('ArrowLeft')).toBe(true);
    expect(dialTrigger()).toHaveFocus();
  });

  it('closes on Escape on the trigger, and lets Escape by while closed', () => {
    render(<Dial />);
    dialTrigger().focus();
    expect(press('Escape')).toBe(true);
    press('Enter');
    dialTrigger().focus();
    expect(press('Escape')).toBe(false);
    expect(menu()).toBeNull();
  });

  it('moves through the actions with the arrows, Home and End, and closes on Escape back on the trigger', () => {
    render(<Dial />);
    dialTrigger().focus();
    press('Enter');
    press('ArrowUp');
    expect(action('Task')).toHaveFocus();
    press('ArrowDown');
    expect(action('Note')).toHaveFocus();
    press('End');
    expect(action('Event')).toHaveFocus();
    press('Home');
    expect(action('Note')).toHaveFocus();
    expect(press('Escape')).toBe(false);
    expect(menu()).toBeNull();
    expect(dialTrigger()).toHaveFocus();
  });

  it('leaves an Escape something in the menu already used', () => {
    render(
      <FloatButton.SpeedDial aria-label="Create" icon="plus" defaultOpen>
        <FloatButton
          aria-label="Note"
          icon="note-sticky"
          onKeyDown={e => e.key === 'Escape' && e.preventDefault()}
        />
      </FloatButton.SpeedDial>
    );
    action('Note').focus();
    press('Escape');
    expect(menu()).not.toBeNull();
  });

  it('closes once Tab has moved focus out of the menu', () => {
    render(
      <>
        <Dial />
        <button>After</button>
      </>
    );
    dialTrigger().focus();
    press('Enter');
    press('Tab');
    // Still open while focus is in the menu: the browser moves it after.
    expect(menu()).not.toBeNull();
    act(() => screen.getByRole('button', { name: 'After' }).focus());
    expect(menu()).toBeNull();
  });

  it('forgets a Tab that moved nothing once a press comes, so focus the press brings back keeps it open', () => {
    render(<Dial />);
    dialTrigger().focus();
    press('Enter');
    // A handler kept this Tab from moving focus.
    press('Tab');
    fireEvent.pointerDown(dialTrigger());
    act(() => dialTrigger().focus());
    expect(menu()).not.toBeNull();
  });

  it('stays open when focus moves within the menu, after Tab or after another key', () => {
    render(<Dial />);
    dialTrigger().focus();
    press('Enter');
    press('Tab');
    act(() => action('Task').focus());
    expect(menu()).not.toBeNull();
    press('ArrowUp');
    act(() => dialTrigger().focus());
    expect(menu()).not.toBeNull();
  });

  it('runs an action, closes and hands focus back to the trigger', () => {
    const log: string[] = [];
    const onOpenChange = vi.fn();
    render(<Dial log={log} onOpenChange={onOpenChange} />);
    dialTrigger().focus();
    press('Enter');
    press('ArrowUp');
    fireEvent.click(action('Task'));
    expect(log).toEqual(['task']);
    expect(menu()).toBeNull();
    expect(dialTrigger()).toHaveFocus();
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it('leaves focus where it is when it wasn’t in the menu', () => {
    render(
      <>
        <button>Elsewhere</button>
        <Dial defaultOpen />
      </>
    );
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    elsewhere.focus();
    fireEvent.click(action('Note'));
    expect(menu()).toBeNull();
    expect(elsewhere).toHaveFocus();
  });

  it('stays open for a click on a disabled action or between the actions', () => {
    render(
      <FloatButton.SpeedDial aria-label="Create" icon="plus" defaultOpen>
        <FloatButton
          aria-label="Note"
          icon="note-sticky"
          as="a"
          href="#n"
          isDisabled
        />
        <FloatButton aria-label="Task" icon="check" />
      </FloatButton.SpeedDial>
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Note' }));
    expect(menu()).not.toBeNull();
    fireEvent.click(menu()!);
    expect(menu()).not.toBeNull();
    // The keys pass over the disabled one.
    menu()!.focus();
    press('ArrowUp');
    expect(action('Task')).toHaveFocus();
  });

  it('toggles on a click, and closes on a press outside', () => {
    render(
      <>
        <button>Outside</button>
        <Dial />
      </>
    );
    fireEvent.click(dialTrigger());
    expect(menu()).not.toBeNull();
    expect(dialTrigger()).not.toHaveFocus();
    fireEvent.pointerDown(action('Note'));
    expect(menu()).not.toBeNull();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));
    expect(menu()).toBeNull();
    fireEvent.click(dialTrigger());
    fireEvent.click(dialTrigger());
    expect(menu()).toBeNull();
  });

  it('is controlled by open and onOpenChange', () => {
    const Controlled = () => {
      const [open, setOpen] = useState(true);
      return (
        <>
          <span data-testid="state">{String(open)}</span>
          <Dial open={open} onOpenChange={setOpen} />
        </>
      );
    };
    render(<Controlled />);
    expect(menu()).not.toBeNull();
    fireEvent.click(dialTrigger());
    expect(screen.getByTestId('state')).toHaveTextContent('false');
    expect(menu()).toBeNull();
  });

  it('stays as its open prop says when the change is turned down', () => {
    const onOpenChange = vi.fn();
    render(<Dial open={false} onOpenChange={onOpenChange} />);
    fireEvent.click(dialTrigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(menu()).toBeNull();
  });

  it('forgets the action a turned-down key asked for, so a later open elsewhere moves no focus', () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(<Dial open={false} />);
      dialTrigger().focus();
      press('ArrowDown');
      act(() => vi.runAllTimers());
      rerender(<Dial open />);
      expect(menu()).not.toBeNull();
      expect(dialTrigger()).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the action a key asked for when the open goes through', () => {
    vi.useFakeTimers();
    try {
      render(<Dial />);
      dialTrigger().focus();
      press('ArrowDown');
      act(() => vi.runAllTimers());
      expect(action('Event')).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  describe('directions', () => {
    const keysOf = (direction: FloatButtonSpeedDialDirection, rtl = false) => {
      const { unmount } = render(
        <Dial direction={direction} style={rtl ? { direction: 'rtl' } : {}} />
      );
      dialTrigger().focus();
      press('Enter');
      // jsdom doesn't inherit `direction`, which the hook reads off the menu.
      if (rtl) menu()!.style.direction = 'rtl';
      const seen: string[] = [];
      for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
        action('Note').focus();
        press(key);
        seen.push(
          `${key}:${document.activeElement!.getAttribute('aria-label')}`
        );
      }
      const orientation = menu()!.getAttribute('aria-orientation');
      unmount();
      return { seen, orientation };
    };

    it.each<[FloatButtonSpeedDialDirection, boolean, string, string]>([
      ['up', false, 'ArrowUp', 'ArrowDown'],
      ['down', false, 'ArrowDown', 'ArrowUp'],
      ['left', false, 'ArrowLeft', 'ArrowRight'],
      ['right', false, 'ArrowRight', 'ArrowLeft'],
      ['up', true, 'ArrowUp', 'ArrowDown'],
      ['left', true, 'ArrowLeft', 'ArrowRight'],
      ['right', true, 'ArrowRight', 'ArrowLeft'],
    ])(
      'moves %s (right-to-left: %s) on the arrow that points that way',
      (direction, rtl, away, back) => {
        const { seen, orientation } = keysOf(direction, rtl);
        expect(seen).toContain(`${away}:Task`);
        expect(seen).toContain(`${back}:Event`);
        expect(seen.filter(s => s.endsWith(':Note'))).toHaveLength(2);
        expect(orientation).toBe(
          direction === 'left' || direction === 'right' ? 'horizontal' : null
        );
      }
    );

    it('opens a sideways dial’s action tooltips above it in a bottom corner and below it in a top one, and its trigger’s toward the page', () => {
      const { unmount } = render(<Dial direction="left" defaultOpen />);
      expect(dialTrigger().parentElement).toHaveClass('is-left');
      expect(action('Note').parentElement).toHaveClass('is-top');
      unmount();
      render(<Dial direction="right" position="top-left" defaultOpen />);
      expect(dialTrigger().parentElement).toHaveClass('is-right');
      expect(action('Note').parentElement).toHaveClass('is-bottom');
    });

    it('marks a sideways dial is-rtl once it opens in right-to-left text, from the direction the browser computes', () => {
      const { rerender } = render(
        <Dial direction="left" style={{ direction: 'rtl' }} />
      );
      // Closed, nothing is read.
      expect(screen.getByTestId('dial')).not.toHaveClass('is-rtl');
      fireEvent.click(dialTrigger());
      expect(screen.getByTestId('dial')).toHaveClass('is-left', 'is-rtl');
      fireEvent.click(dialTrigger());
      rerender(<Dial direction="left" style={{ direction: 'ltr' }} />);
      fireEvent.click(dialTrigger());
      expect(screen.getByTestId('dial')).not.toHaveClass('is-rtl');
    });

    it('never marks a dial that runs up or down is-rtl', () => {
      render(<Dial style={{ direction: 'rtl' }} defaultOpen />);
      expect(screen.getByTestId('dial')).not.toHaveClass('is-rtl');
    });

    it('opens on the arrow pointing its way from the trigger', () => {
      render(<Dial direction="left" />);
      dialTrigger().focus();
      press('ArrowLeft');
      expect(action('Note')).toHaveFocus();
      dialTrigger().focus();
      press('ArrowRight');
      expect(action('Event')).toHaveFocus();
    });
  });

  describe('showLabels', () => {
    it('prints every action’s name as a pill, with no tooltips', () => {
      render(<Dial showLabels defaultOpen />);
      for (const name of ['Note', 'Task', 'Event']) {
        const item = action(name);
        expect(item).not.toHaveAttribute('aria-label');
        expect(item).toHaveTextContent(name);
        expect(item).toHaveAttribute('role', 'menuitem');
        expect(item).not.toHaveClass('icon-button');
      }
      expect(
        document.querySelectorAll('.float-button-actions .tooltip')
      ).toHaveLength(0);
      // The trigger keeps its icon and its tooltip.
      expect(dialTrigger()).toHaveClass('icon-button');
    });
  });

  describe('openOnHover', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    /** The pointer arrives on `el`, from outside, as a mouse. */
    const hover = (
      el: Element,
      type: 'pointerover' | 'pointerout' = 'pointerover',
      to: Element | null = null
    ) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        relatedTarget: to,
      });
      Object.defineProperty(event, 'pointerType', { value: 'mouse' });
      fireEvent(el, event);
    };
    const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

    it('opens when the pointer rests on the trigger, and closes once it leaves', () => {
      const onPointerEnter = vi.fn();
      render(<Dial openOnHover onPointerEnter={onPointerEnter} />);
      hover(dialTrigger());
      expect(onPointerEnter).toHaveBeenCalled();
      advance(99);
      expect(menu()).toBeNull();
      advance(1);
      expect(menu()).not.toBeNull();
      hover(dialTrigger(), 'pointerout', document.body);
      advance(299);
      expect(menu()).not.toBeNull();
      advance(1);
      expect(menu()).toBeNull();
    });

    it('doesn’t open for keyboard focus on the trigger', () => {
      render(<Dial openOnHover />);
      act(() => dialTrigger().focus());
      advance(1000);
      expect(menu()).toBeNull();
    });

    it('stays open while focus is in the actions, and Escape closes it back on the trigger', () => {
      render(<Dial openOnHover />);
      dialTrigger().focus();
      press('Enter');
      expect(action('Note')).toHaveFocus();
      advance(1000);
      expect(menu()).not.toBeNull();
      press('Escape');
      expect(menu()).toBeNull();
      expect(dialTrigger()).toHaveFocus();
    });

    it('doesn’t open on hover without it', () => {
      render(<Dial />);
      hover(dialTrigger());
      advance(1000);
      expect(menu()).toBeNull();
    });
  });

  it('puts the helper props, className, attributes and ref on its root', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Dial ref={ref} m="2" className="mine" id="create" direction="right" />
    );
    expect(ref.current).toBe(screen.getByTestId('dial'));
    expect(ref.current!.className).toBe(
      'float-button-speed-dial is-right m-2 mine'
    );
    expect(ref.current).toHaveAttribute('id', 'create');
  });

  it('hands its root to a callback ref, and null when it goes', () => {
    const ref = vi.fn();
    const { unmount } = render(<Dial ref={ref} />);
    expect(ref).toHaveBeenCalledWith(screen.getByTestId('dial'));
    unmount();
    expect(ref).toHaveBeenLastCalledWith(null);
  });

  it('runs the cleanup a callback ref returns in place of a call with null', () => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const { unmount } = render(<Dial ref={ref} />);
    expect(ref).toHaveBeenCalledTimes(1);
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(ref).toHaveBeenCalledTimes(1);
  });

  it('moves no focus when a controlled parent turns down a close', () => {
    vi.useFakeTimers();
    try {
      const onOpenChange = vi.fn();
      const { rerender } = render(<Dial open onOpenChange={onOpenChange} />);
      act(() => action('Note').focus());
      press('Escape');
      act(() => vi.runAllTimers());
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(menu()).not.toBeNull();
      expect(action('Note')).toHaveFocus();
      fireEvent.click(action('Task'));
      act(() => vi.runAllTimers());
      expect(menu()).not.toBeNull();
      expect(dialTrigger()).not.toHaveFocus();
      // Closing later, some other way, leaves focus alone too.
      rerender(<Dial open={false} onOpenChange={onOpenChange} />);
      expect(dialTrigger()).not.toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaves the dial open after an action with closeOnClick off', () => {
    const log: string[] = [];
    render(<Dial log={log} closeOnClick={false} />);
    dialTrigger().focus();
    press('Enter');
    fireEvent.click(action('Note'));
    expect(log).toEqual(['note']);
    expect(menu()).not.toBeNull();
    expect(action('Note')).toHaveFocus();
  });

  it('takes Button’s normal size', () => {
    render(<Dial size="normal" />);
    expect(dialTrigger()).toHaveClass('is-normal');
  });

  it('passes the trigger its icon, color and size', () => {
    render(<Dial color="primary" size="large" icon={<Icon name="bolt" />} />);
    const trigger = dialTrigger();
    expect(trigger).toHaveClass('is-primary', 'is-large');
    expect(trigger.querySelector('i')).toHaveClass('fa-bolt');
  });

  it('prefixes every class', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <Dial defaultOpen />
      </ConfigProvider>
    );
    expect(screen.getByTestId('dial').className).toBe(
      'bestax-float-button-speed-dial bestax-is-up bestax-is-active'
    );
    expect(menu()!.className).toBe('bestax-float-button-actions');
    expect(dialTrigger()).toHaveClass('bestax-float-button');
  });

  it('renders the same closed markup on the server and the client', async () => {
    const ui = <Dial />;
    const html = renderToString(ui);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(container, ui);
    });
    expect(error).not.toHaveBeenCalled();
    expect(container.innerHTML).toBe(html);
    await act(async () => root!.unmount());
    container.remove();
  });
});

describe('FloatButton.BackToTop', () => {
  let frames: FrameRequestCallback[] = [];
  const flush = () =>
    act(() => {
      const now = frames;
      frames = [];
      now.forEach(cb => cb(0));
    });
  let scrollTo: ReturnType<typeof vi.fn>;

  const setScroll = (y: number) => {
    Object.defineProperty(window, 'scrollY', {
      value: y,
      configurable: true,
      writable: true,
    });
    fireEvent.scroll(window);
    flush();
  };

  beforeEach(() => {
    frames = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      frames.push(cb);
      return frames.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      configurable: true,
      writable: true,
    });
  });

  const backToTop = () =>
    document.querySelector('.float-button-back-to-top') as HTMLButtonElement;

  it('renders a hidden button named Back to top, with an up arrow, in its own Affix', () => {
    render(<FloatButton.BackToTop />);
    flush();
    const button = backToTop();
    expect(button).toHaveAccessibleName('Back to top');
    expect(button.className).toBe(
      'button is-rounded icon-button float-button float-button-back-to-top'
    );
    expect(button.querySelector('svg')).toHaveAttribute(
      'stroke',
      'currentColor'
    );
    expect(tooltipOf(button)).toHaveTextContent('Back to top');
    expect(button.closest('.affix')).toHaveClass('is-bottom-right');
  });

  it('shows past visibilityHeight, and hides back above it', () => {
    render(<FloatButton.BackToTop visibilityHeight={100} />);
    flush();
    setScroll(100);
    expect(backToTop()).not.toHaveClass('is-shown');
    setScroll(101);
    expect(backToTop()).toHaveClass('is-shown');
    setScroll(20);
    expect(backToTop()).not.toHaveClass('is-shown');
  });

  it('reads the scroll at most once a frame', () => {
    render(<FloatButton.BackToTop />);
    flush();
    fireEvent.scroll(window);
    fireEvent.scroll(window);
    fireEvent.scroll(window);
    expect(frames).toHaveLength(1);
  });

  it('shows at once on a page already scrolled down, and stops listening once it unmounts', () => {
    window.scrollY = 900;
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<FloatButton.BackToTop />);
    flush();
    expect(backToTop()).toHaveClass('is-shown');
    unmount();
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('scrolls smoothly to the top, then focuses <main>, which can take focus until it loses it', () => {
    const onClick = vi.fn();
    render(
      <>
        <main>
          <a href="#a">First</a>
        </main>
        <FloatButton.BackToTop onClick={onClick} />
      </>
    );
    flush();
    const main = screen.getByRole('main');
    const focus = vi.spyOn(main, 'focus');
    fireEvent.click(backToTop());
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(main).toHaveFocus();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(main).toHaveAttribute('tabindex', '-1');
    act(() => screen.getByRole('link').focus());
    expect(main).not.toHaveAttribute('tabindex');
  });

  it('jumps at once when the user prefers reduced motion', () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    try {
      render(<FloatButton.BackToTop />);
      flush();
      fireEvent.click(backToTop());
      expect(window.matchMedia).toHaveBeenCalledWith(
        '(prefers-reduced-motion: reduce)'
      );
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  it('draws no ring on a target it gives a tabindex, and puts its own outline back', () => {
    render(
      <>
        <main style={{ outline: '1px dotted' }}>
          <a href="#a">First</a>
        </main>
        <FloatButton.BackToTop />
      </>
    );
    flush();
    const main = screen.getByRole('main');
    fireEvent.click(backToTop());
    expect(main).toHaveFocus();
    expect(main.style.outline).toBe('none');
    act(() => screen.getByRole('link').focus());
    expect(main).not.toHaveAttribute('tabindex');
    expect(main.style.outline).toBe('1px dotted');
  });

  it('leaves a tabindex the target has of its own, even when focus doesn’t take', () => {
    render(
      <>
        <main tabIndex={0}>Content</main>
        <FloatButton.BackToTop />
      </>
    );
    flush();
    const main = screen.getByRole('main');
    vi.spyOn(main, 'focus').mockImplementation(() => {});
    fireEvent.click(backToTop());
    expect(main).toHaveAttribute('tabindex', '0');
    expect(main.style.outline).toBe('');
  });

  it('takes back the tabindex and the outline when the target still won’t take focus', () => {
    render(
      <>
        <main>Content</main>
        <FloatButton.BackToTop />
      </>
    );
    flush();
    const main = screen.getByRole('main');
    vi.spyOn(main, 'focus').mockImplementation(() => {});
    fireEvent.click(backToTop());
    expect(main).not.toHaveAttribute('tabindex');
    expect(main).not.toHaveAttribute('style');
  });

  it('leaves a target that takes focus as it is', () => {
    render(
      <>
        <main tabIndex={0}>Content</main>
        <FloatButton.BackToTop />
      </>
    );
    flush();
    fireEvent.click(backToTop());
    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '0');
  });

  it('focuses <body> when there is no <main>, until focus moves on', () => {
    render(
      <>
        <a href="#first">First</a>
        <FloatButton.BackToTop />
      </>
    );
    flush();
    fireEvent.click(backToTop());
    expect(document.activeElement).toBe(document.body);
    expect(document.body).toHaveAttribute('tabindex', '-1');
    expect(document.body.style.outline).toBe('none');
    act(() => screen.getByRole('link').focus());
    expect(document.body).not.toHaveAttribute('tabindex');
    expect(document.body).not.toHaveAttribute('style');
  });

  it('focuses the element a moveFocus ref holds, or nothing with moveFocus off', () => {
    const Page = ({ off }: { off?: boolean }) => {
      const headingRef = useRef<HTMLHeadingElement>(null);
      return (
        <>
          <h1 ref={headingRef}>Title</h1>
          <FloatButton.BackToTop moveFocus={off ? false : headingRef} />
        </>
      );
    };
    const { rerender } = render(<Page />);
    flush();
    fireEvent.click(backToTop());
    expect(screen.getByRole('heading')).toHaveFocus();
    act(() => backToTop().focus());
    rerender(<Page off />);
    fireEvent.click(backToTop());
    expect(backToTop()).toHaveFocus();
  });

  describe('scrollContainer', () => {
    const feedOf = () => screen.getByTestId('feed');

    it.each([
      ['an element', 'element'],
      ['a ref', 'ref'],
      ['a selector', 'selector'],
    ])('watches, scrolls and focuses %s', (_, kind) => {
      const Feed = () => {
        const ref = useRef<HTMLDivElement>(null);
        const [el, setEl] = useState<HTMLDivElement | null>(null);
        const container =
          kind === 'ref' ? ref : kind === 'selector' ? '#feed' : el;
        return (
          <>
            <div
              id="feed"
              data-testid="feed"
              ref={node => {
                ref.current = node;
                if (node !== el) setEl(node);
              }}
            />
            {(kind !== 'element' || el) && (
              <FloatButton.BackToTop scrollContainer={container ?? undefined} />
            )}
          </>
        );
      };
      render(<Feed />);
      flush();
      const feed = feedOf();
      const feedScroll = vi.fn();
      feed.scrollTo = feedScroll as unknown as typeof feed.scrollTo;
      feed.scrollTop = 500;
      fireEvent.scroll(feed);
      flush();
      expect(backToTop()).toHaveClass('is-shown');
      fireEvent.click(backToTop());
      expect(feedScroll).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      expect(scrollTo).not.toHaveBeenCalled();
      expect(feed).toHaveFocus();
      expect(feed).toHaveAttribute('tabindex', '-1');
    });

    it('stays on the window when a selector finds nothing', () => {
      render(<FloatButton.BackToTop scrollContainer="#missing" />);
      flush();
      setScroll(800);
      expect(backToTop()).toHaveClass('is-shown');
      fireEvent.click(backToTop());
      expect(scrollTo).toHaveBeenCalled();
    });
  });

  it('takes a name of its own, keeps the default for an empty one, and takes aria-labelledby with no tooltip', () => {
    const { rerender } = render(
      <FloatButton.BackToTop aria-label="Nach oben" />
    );
    flush();
    expect(backToTop()).toHaveAccessibleName('Nach oben');
    expect(tooltipOf(backToTop())).toHaveTextContent('Nach oben');
    rerender(<FloatButton.BackToTop aria-label="" />);
    expect(backToTop()).toHaveAccessibleName('Back to top');
    rerender(
      <>
        <span id="top-name">Top</span>
        <FloatButton.BackToTop aria-labelledby="top-name" />
      </>
    );
    expect(backToTop()).toHaveAccessibleName('Top');
    expect(tooltipOf(backToTop())).toBeNull();
  });

  it('takes an icon of its own, and forwards its ref', () => {
    const ref = createRef<HTMLButtonElement>();
    const callback = vi.fn();
    render(
      <>
        <FloatButton.BackToTop ref={ref} icon="arrow-up" />
        <FloatButton.BackToTop ref={callback} />
      </>
    );
    flush();
    const [first, second] = document.querySelectorAll(
      '.float-button-back-to-top'
    );
    expect(ref.current).toBe(first);
    expect(callback).toHaveBeenCalledWith(second);
    expect(first.querySelector('i')).toHaveClass('fa-arrow-up');
  });

  it('runs the cleanup its callback ref returns once it goes', () => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const { unmount } = render(<FloatButton.BackToTop ref={ref} />);
    flush();
    expect(ref).toHaveBeenCalledWith(backToTop());
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(ref).toHaveBeenCalledTimes(1);
  });

  it('puts the helper props, className and attributes on its button', () => {
    render(<FloatButton.BackToTop mt="2" className="mine" data-testid="top" />);
    flush();
    const button = screen.getByTestId('top');
    expect(button).toBe(backToTop());
    expect(button).toHaveClass('mt-2', 'mine', 'float-button-back-to-top');
    expect(button).not.toHaveAttribute('mt');
  });

  it('keeps its place inside FloatButtons, with no Affix of its own', () => {
    render(
      <FloatButtons>
        <FloatButton.BackToTop />
        <FloatButton aria-label="Help" icon="question" />
      </FloatButtons>
    );
    flush();
    expect(document.querySelectorAll('.affix')).toHaveLength(1);
    expect(backToTop().closest('.affix')).toHaveClass('float-buttons');
  });

  it('renders nothing on the server, and appears once hydrated', async () => {
    const ui = (
      <FloatButtons>
        <FloatButton.BackToTop />
        <FloatButton aria-label="Help" icon="question" />
      </FloatButtons>
    );
    const html = renderToString(ui);
    expect(html).not.toContain('back-to-top');
    expect(renderToString(<FloatButton.BackToTop />)).toBe('');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(container, ui);
    });
    expect(error).not.toHaveBeenCalled();
    expect(container.querySelector('.float-button-back-to-top')).not.toBeNull();
    await act(async () => root!.unmount());
    container.remove();
  });

  it('prefixes its classes', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <FloatButton.BackToTop />
      </ConfigProvider>
    );
    setScroll(900);
    const button = document.querySelector('.bestax-float-button-back-to-top')!;
    expect(button).toHaveClass('bestax-is-shown', 'bestax-float-button');
  });
});
