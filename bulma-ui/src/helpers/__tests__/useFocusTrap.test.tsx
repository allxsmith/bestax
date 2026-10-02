import React, { useRef, useState } from 'react';
import { render, fireEvent, act, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { useFocusTrap, UseFocusTrapOptions } from '../useFocusTrap';
import { useIsHydrated } from '../useIsHydrated';

/** Portals into document.body once the page has hydrated, as overlays do. */
const AfterHydration: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (useIsHydrated() ? createPortal(children, document.body) : null);

/** The element with focus, inside open shadow roots too. */
function focused(): Element {
  let el = document.activeElement as Element;
  while (el.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

/** Presses Tab on whatever has focus, the way a browser dispatches it. */
function pressTab(shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    shiftKey,
    bubbles: true,
    cancelable: true,
    composed: true,
  });
  focused().dispatchEvent(event);
  return event;
}

const Trap: React.FC<
  UseFocusTrapOptions & { children?: React.ReactNode; withRef?: boolean }
> = ({ children, withRef = true, ...options }) => {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, options);
  return (
    <div ref={withRef ? ref : undefined} tabIndex={-1} data-testid="trap">
      {children ?? (
        <>
          <button>First</button>
          <button>Middle</button>
          <button>Last</button>
        </>
      )}
    </div>
  );
};

const button = (name: string) => screen.getByRole('button', { name });

// Browsers' own stylesheet gives an image map area `display: none`, where
// jsdom's doesn't, so every test here runs under the browser's rule.
let browserAreaRule: HTMLStyleElement;
beforeAll(() => {
  browserAreaRule = document.createElement('style');
  browserAreaRule.textContent = 'area { display: none; }';
  document.head.appendChild(browserAreaRule);
});
afterAll(() => browserAreaRule.remove());

describe('useFocusTrap', () => {
  describe('turning on', () => {
    it('is on by default and focuses the first tab stop', () => {
      render(<Trap />);
      expect(button('First')).toHaveFocus();
    });

    it('does nothing while inactive', () => {
      render(<Trap active={false} />);
      expect(document.body).toHaveFocus();
      button('Last').focus();
      const event = pressTab();
      expect(event.defaultPrevented).toBe(false);
    });

    it('focuses initialFocusRef when it points at an element', () => {
      const WithInitial: React.FC = () => {
        const initialRef = useRef<HTMLButtonElement>(null);
        return (
          <Trap initialFocusRef={initialRef}>
            <button>First</button>
            <button ref={initialRef}>Second</button>
          </Trap>
        );
      };
      render(<WithInitial />);
      expect(button('Second')).toHaveFocus();
    });

    it('falls back to the first tab stop while initialFocusRef is empty', () => {
      const WithEmptyInitial: React.FC = () => {
        const initialRef = useRef<HTMLButtonElement>(null);
        return <Trap initialFocusRef={initialRef} />;
      };
      render(<WithEmptyInitial />);
      expect(button('First')).toHaveFocus();
    });

    it('falls back to the first tab stop when initialFocusRef is outside the container', () => {
      const WithOutsideInitial: React.FC = () => {
        const outsideRef = useRef<HTMLButtonElement>(null);
        return (
          <>
            <button ref={outsideRef}>Outside</button>
            <Trap initialFocusRef={outsideRef} />
          </>
        );
      };
      render(<WithOutsideInitial />);
      expect(button('First')).toHaveFocus();
      // Focus is inside, so Tab reaches the trap's listener and wraps.
      button('Last').focus();
      expect(pressTab().defaultPrevented).toBe(true);
      expect(button('First')).toHaveFocus();
    });

    it('falls back to the container when initialFocusRef is outside and nothing inside can take focus', () => {
      const WithOutsideInitial: React.FC = () => {
        const outsideRef = useRef<HTMLButtonElement>(null);
        return (
          <>
            <button ref={outsideRef}>Outside</button>
            <Trap initialFocusRef={outsideRef}>
              <span>Nothing focusable</span>
            </Trap>
          </>
        );
      };
      render(<WithOutsideInitial />);
      expect(screen.getByTestId('trap')).toHaveFocus();
    });

    it('focuses the container when nothing inside can take focus', () => {
      render(
        <Trap>
          <span>Nothing focusable</span>
        </Trap>
      );
      expect(screen.getByTestId('trap')).toHaveFocus();
    });

    it('does nothing when the ref is never attached', () => {
      render(<Trap withRef={false} />);
      expect(document.body).toHaveFocus();
    });
  });

  describe('Tab', () => {
    it('wraps from the last stop to the first', () => {
      render(<Trap />);
      button('Last').focus();
      expect(pressTab().defaultPrevented).toBe(true);
      expect(button('First')).toHaveFocus();
    });

    it('wraps from the first stop to the last on Shift+Tab', () => {
      render(<Trap />);
      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(button('Last')).toHaveFocus();
    });

    it('leaves Tab to the browser between the ends', () => {
      render(<Trap />);
      button('Middle').focus();
      expect(pressTab().defaultPrevented).toBe(false);
      expect(pressTab(true).defaultPrevented).toBe(false);
      expect(button('Middle')).toHaveFocus();
    });

    it('ignores other keys', () => {
      render(<Trap />);
      button('Last').focus();
      fireEvent.keyDown(button('Last'), { key: 'ArrowDown' });
      expect(button('Last')).toHaveFocus();
    });

    it('holds focus on the container when there are no tab stops', () => {
      render(
        <Trap>
          <span>Nothing focusable</span>
        </Trap>
      );
      expect(pressTab().defaultPrevented).toBe(true);
      expect(screen.getByTestId('trap')).toHaveFocus();
    });

    it('wraps from the container itself on Shift+Tab, and lets Tab walk in', () => {
      render(<Trap />);
      const trap = screen.getByTestId('trap');
      trap.focus();
      expect(pressTab().defaultPrevented).toBe(false);
      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(button('Last')).toHaveFocus();
    });

    it('wraps from an element outside the tab order that sits after the last stop', () => {
      render(
        <Trap>
          <button>First</button>
          <button>Last</button>
          <button tabIndex={-1}>Roving</button>
        </Trap>
      );
      button('Roving').focus();
      expect(pressTab().defaultPrevented).toBe(true);
      expect(button('First')).toHaveFocus();
    });
  });

  describe('which elements are tab stops', () => {
    // Every decoy is focusable by selector but not by Tab. With any one of them
    // counted as an end, Tab from the real ends would leave the container.
    const Decoys: React.FC<{ where: 'start' | 'end' }> = ({ where }) => (
      <span data-decoys={where}>
        <a href="#x" tabIndex={-1}>
          negative tabindex link
        </a>
        <button tabIndex={-1}>negative tabindex button</button>
        <button disabled>disabled</button>
        <button disabled tabIndex={0}>
          disabled with tabindex
        </button>
        <fieldset disabled>
          <input aria-label="in a disabled fieldset" />
        </fieldset>
        <input type="hidden" />
        <button hidden>hidden attribute</button>
        <span hidden>
          <button>inside hidden</button>
        </span>
        <span style={{ display: 'none' }}>
          <button>inside display none</button>
        </span>
        <button style={{ visibility: 'hidden' }}>visibility hidden</button>
        <span style={{ visibility: 'collapse' }}>
          <button>inside visibility collapse</button>
        </span>
        {/* Set by hand: React 18 and 19 disagree on how to spell `inert`. */}
        <span ref={el => el?.setAttribute('inert', '')}>
          <button>inside inert</button>
        </span>
        <span ref={el => el?.setAttribute('tabindex', 'soon')}>
          invalid tabindex
        </span>
        <a>link without href</a>
        <video />
        <audio />
        <summary>summary outside a details</summary>
        <details open>
          <summary tabIndex={-1}>summary out of the tab order</summary>
          <summary>second summary</summary>
        </details>
        <details>
          <summary tabIndex={-1}>closed</summary>
          <button>inside a closed details</button>
        </details>
        <div contentEditable={false}>not editable</div>
        <div contentEditable="inherit">inherits nothing editable</div>
        <div contentEditable suppressContentEditableWarning tabIndex={-1}>
          <span contentEditable suppressContentEditableWarning>
            editable inside an editable region
          </span>
        </div>
        <iframe hidden title="hidden frame" />
      </span>
    );

    beforeEach(() => {
      render(
        <Trap>
          <Decoys where="start" />
          <button>Real first</button>
          <div tabIndex={0}>Real middle</div>
          <a href="#real">Real last</a>
          <Decoys where="end" />
        </Trap>
      );
    });

    it('starts on the first real stop', () => {
      expect(button('Real first')).toHaveFocus();
    });

    it('wraps between the real ends in both directions', () => {
      screen.getByRole('link', { name: 'Real last' }).focus();
      expect(pressTab().defaultPrevented).toBe(true);
      expect(button('Real first')).toHaveFocus();

      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(screen.getByRole('link', { name: 'Real last' })).toHaveFocus();
    });

    it('counts an element with a non-negative tabindex', () => {
      screen.getByText('Real middle').focus();
      expect(pressTab().defaultPrevented).toBe(false);
    });
  });

  // Kinds the browser visits without a tabindex. Placed after the only other
  // stop, each has to be counted or Tab wraps past it and it can't be reached.
  // Several aren't focusable in jsdom, so the wrap is proven by the call.
  describe.each([
    [
      'an editable region',
      () => (
        <div contentEditable suppressContentEditableWarning data-testid="kind">
          Notes
        </div>
      ),
    ],
    [
      'a plaintext-only editable region',
      () => (
        <div
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          data-testid="kind"
        >
          Notes
        </div>
      ),
    ],
    [
      'an editable region inside a non-editable one',
      () => (
        <div contentEditable={false}>
          <span
            contentEditable
            suppressContentEditableWarning
            data-testid="kind"
          >
            Notes
          </span>
        </div>
      ),
    ],
    [
      'the summary of a closed details',
      () => (
        <details>
          <summary data-testid="kind">More</summary>
          <p>Hidden until opened</p>
        </details>
      ),
    ],
    ['audio with controls', () => <audio controls data-testid="kind" />],
    ['video with controls', () => <video controls data-testid="kind" />],
    ['an iframe', () => <iframe title="Frame" data-testid="kind" />],
    ['an embed', () => <embed data-testid="kind" />],
    ['an object', () => <object aria-label="Object" data-testid="kind" />],
    [
      'an image map area',
      () => (
        <>
          <img alt="Map" useMap="#trap-map" />
          <map name="trap-map">
            <area href="#area" alt="Area" data-testid="kind" />
          </map>
        </>
      ),
    ],
  ])('%s', (_, renderKind) => {
    it('is a tab stop Tab reaches and Shift+Tab wraps to', () => {
      render(
        <Trap>
          <button>First</button>
          {renderKind()}
        </Trap>
      );
      const focusSpy = jest.spyOn(screen.getByTestId('kind'), 'focus');
      expect(button('First')).toHaveFocus();
      expect(pressTab().defaultPrevented).toBe(false);
      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(focusSpy).toHaveBeenCalled();
      // jsdom reports no active element at all once a focused iframe is
      // removed, where a browser falls back to <body>, so hand focus back
      // before cleanup unmounts it.
      button('First').focus();
    });
  });

  describe('image map areas', () => {
    const area = (alt: string) =>
      document.querySelector(`area[alt="${alt}"]`) as HTMLElement;

    it('count where an image using their map is shown, with no box of their own', () => {
      render(
        <Trap>
          <button>First</button>
          <img alt="Floor plan" useMap="#plan" />
          <map name="plan">
            <area href="#kitchen" alt="Kitchen" />
          </map>
        </Trap>
      );
      expect(getComputedStyle(area('Kitchen')).display).toBe('none');
      const focusSpy = jest.spyOn(area('Kitchen'), 'focus');
      expect(pressTab().defaultPrevented).toBe(false);
      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(focusSpy).toHaveBeenCalled();
    });

    it('find their map by id as well as by name', () => {
      render(
        <Trap>
          <button>First</button>
          <img alt="Floor plan" useMap="#plan-by-id" />
          <map id="plan-by-id">
            <area href="#hall" alt="Hall" />
          </map>
        </Trap>
      );
      expect(pressTab().defaultPrevented).toBe(false);
    });

    it.each([
      [
        'whose image is hidden',
        () => (
          <>
            <img alt="" useMap="#hidden" style={{ display: 'none' }} />
            <map name="hidden">
              <area href="#a" alt="Hidden image" />
            </map>
          </>
        ),
      ],
      [
        'whose image is invisible',
        () => (
          <>
            <img alt="" useMap="#invisible" style={{ visibility: 'hidden' }} />
            <map name="invisible">
              <area href="#a" alt="Invisible image" />
            </map>
          </>
        ),
      ],
      [
        'whose map no image uses',
        () => (
          <map name="unused">
            <area href="#a" alt="Unused map" />
          </map>
        ),
      ],
      [
        'whose image names its map without a #',
        () => (
          <>
            {/* Without the #, the rest happens to spell the map's name. */}
            <img alt="" useMap="xbare" />
            <map name="bare">
              <area href="#a" alt="No hash" />
            </map>
          </>
        ),
      ],
      ['outside any map', () => <area href="#a" alt="Stray" />],
      [
        'inside an inert map',
        () => (
          <>
            <img alt="" useMap="#inert" />
            <span ref={el => el?.setAttribute('inert', '')}>
              <map name="inert">
                <area href="#a" alt="Inert" />
              </map>
            </span>
          </>
        ),
      ],
    ])('skip an area %s', (_, renderDecoy) => {
      render(
        <Trap>
          <button>First</button>
          <button>Last</button>
          {renderDecoy()}
        </Trap>
      );
      button('Last').focus();
      expect(pressTab().defaultPrevented).toBe(true);
    });
  });

  describe('radio groups', () => {
    const Sizes: React.FC<{ checked?: string; disabled?: string }> = ({
      checked,
      disabled,
    }) => (
      <>
        {['Small', 'Medium', 'Large'].map(size => (
          <input
            key={size}
            type="radio"
            name="size"
            aria-label={size}
            defaultChecked={size === checked}
            disabled={size === disabled}
          />
        ))}
      </>
    );
    const radio = (name: string) => screen.getByRole('radio', { name });

    it('are one stop: the checked button', () => {
      render(
        <Trap>
          <button>First</button>
          <Sizes checked="Medium" />
        </Trap>
      );
      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(radio('Medium')).toHaveFocus();
      // Tab from the checked button leaves the group, so it wraps here.
      expect(pressTab().defaultPrevented).toBe(true);
      expect(button('First')).toHaveFocus();
    });

    it('are one stop: the first button when none is checked', () => {
      render(
        <Trap>
          <button>First</button>
          <Sizes />
        </Trap>
      );
      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(radio('Small')).toHaveFocus();
    });

    it('stand at the group’s place whichever button has focus', () => {
      render(
        <Trap>
          <button>First</button>
          <Sizes checked="Large" />
        </Trap>
      );
      // Focused by a script: Tab from here leaves the group all the same.
      radio('Small').focus();
      expect(pressTab().defaultPrevented).toBe(true);
      expect(button('First')).toHaveFocus();
    });

    it('pass over a checked button that is disabled', () => {
      render(
        <Trap>
          <button>First</button>
          <Sizes checked="Medium" disabled="Medium" />
        </Trap>
      );
      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(radio('Small')).toHaveFocus();
    });

    it('are told apart by form', () => {
      render(
        <Trap>
          <button>First</button>
          <form>
            <input type="radio" name="x" aria-label="In one" defaultChecked />
          </form>
          <form>
            <input type="radio" name="x" aria-label="In another" />
          </form>
        </Trap>
      );
      radio('In one').focus();
      expect(pressTab().defaultPrevented).toBe(false);
      radio('In another').focus();
      expect(pressTab().defaultPrevented).toBe(true);
    });

    it('leave a radio without a name as a stop of its own', () => {
      render(
        <Trap>
          <button>First</button>
          <input type="radio" aria-label="Unnamed" defaultChecked />
          <input type="radio" aria-label="Also unnamed" />
        </Trap>
      );
      radio('Unnamed').focus();
      expect(pressTab().defaultPrevented).toBe(false);
      radio('Also unnamed').focus();
      expect(pressTab().defaultPrevented).toBe(true);
    });

    // A group is every button with its name, form owner and tree, wherever
    // the trap ends. Each case below is what Chrome's Tab does with the
    // same markup.
    describe('that reach outside the container', () => {
      it('have no stop inside when their checked button is outside', () => {
        render(
          <>
            <input
              type="radio"
              name="size"
              aria-label="Outside"
              defaultChecked
            />
            <Trap>
              <Sizes />
              <button>Last</button>
            </Trap>
          </>
        );
        // Tab skips Small, Medium and Large, so Last is the only stop.
        expect(button('Last')).toHaveFocus();
        expect(pressTab(true).defaultPrevented).toBe(true);
        expect(button('Last')).toHaveFocus();
        expect(pressTab().defaultPrevented).toBe(true);
        expect(button('Last')).toHaveFocus();
      });

      it('are one stop inside when none is checked', () => {
        render(
          <>
            <input type="radio" name="size" aria-label="Outside" />
            <Trap>
              <button>First</button>
              <Sizes />
            </Trap>
          </>
        );
        // Tab from inside lands on the first button inside and leaves the
        // group after it, so the group is the last stop.
        expect(pressTab(true).defaultPrevented).toBe(true);
        expect(radio('Small')).toHaveFocus();
        expect(pressTab().defaultPrevented).toBe(true);
        expect(button('First')).toHaveFocus();
      });

      it('are their checked button when it is inside', () => {
        render(
          <>
            <input type="radio" name="size" aria-label="Outside" />
            <Trap>
              <button>First</button>
              <Sizes checked="Medium" />
            </Trap>
          </>
        );
        expect(pressTab(true).defaultPrevented).toBe(true);
        expect(radio('Medium')).toHaveFocus();
      });

      it.each([
        ['disabled', { disabled: true }],
        ['hidden', { hidden: true }],
        ['out of the tab order', { tabIndex: -1 }],
      ])(
        'are one stop inside when the checked button outside is %s',
        (_, props) => {
          render(
            <>
              <input
                type="radio"
                name="size"
                aria-label="Outside"
                defaultChecked
                {...props}
              />
              <Trap>
                <button>First</button>
                <Sizes />
              </Trap>
            </>
          );
          expect(pressTab(true).defaultPrevented).toBe(true);
          expect(radio('Small')).toHaveFocus();
        }
      );

      it('only include a checked button outside that shares their form', () => {
        render(
          <>
            <form>
              <input
                type="radio"
                name="size"
                aria-label="Outside"
                defaultChecked
              />
            </form>
            <Trap>
              <button>First</button>
              <Sizes />
            </Trap>
          </>
        );
        expect(pressTab(true).defaultPrevented).toBe(true);
        expect(radio('Small')).toHaveFocus();
      });
    });
  });

  describe('shadow roots inside the container', () => {
    /**
     * A custom-element-like host. Its open shadow root holds two buttons and
     * then a slot, unless `shadow` gives it other markup.
     */
    const Host: React.FC<{
      tabIndex?: number;
      shadow?: string;
      children?: React.ReactNode;
    }> = ({
      tabIndex,
      shadow = '<button>Shadow one</button><button>Shadow two</button><slot></slot>',
      children,
    }) => (
      <div
        data-testid="host"
        tabIndex={tabIndex}
        ref={el => {
          if (el && !el.shadowRoot) {
            el.attachShadow({ mode: 'open' }).innerHTML = shadow;
          }
        }}
      >
        {children}
      </div>
    );
    const inShadow = (name: string) =>
      Array.from(
        screen.getByTestId('host').shadowRoot!.querySelectorAll('button')
      ).find(b => b.textContent === name)!;

    it('reach the stops inside and wrap after the last of them', () => {
      render(
        <Trap>
          <button>First</button>
          <Host />
        </Trap>
      );
      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(focused()).toBe(inShadow('Shadow two'));

      inShadow('Shadow one').focus();
      expect(pressTab().defaultPrevented).toBe(false);
      inShadow('Shadow two').focus();
      expect(pressTab().defaultPrevented).toBe(true);
      expect(button('First')).toHaveFocus();
    });

    it('place shadow content after its host, and slotted content at its slot', () => {
      render(
        <Trap>
          <Host>
            <button>Slotted</button>
          </Host>
          <button>After</button>
        </Trap>
      );
      inShadow('Shadow two').focus();
      expect(pressTab().defaultPrevented).toBe(false);
      button('Slotted').focus();
      expect(pressTab(true).defaultPrevented).toBe(false);
      expect(pressTab().defaultPrevented).toBe(false);
      button('After').focus();
      expect(pressTab().defaultPrevented).toBe(true);
      expect(focused()).toBe(inShadow('Shadow one'));
    });

    it('put a host that is a tab stop before its shadow content', () => {
      render(
        <Trap>
          <Host tabIndex={0} />
        </Trap>
      );
      const host = screen.getByTestId('host');
      expect(host).toHaveFocus();
      expect(pressTab().defaultPrevented).toBe(false);
      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(focused()).toBe(inShadow('Shadow two'));
    });

    it('wrap Shift+Tab from a host that is focused but not a stop', () => {
      render(
        <Trap>
          <Host tabIndex={-1} />
          <button>Last</button>
        </Trap>
      );
      screen.getByTestId('host').focus();
      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(button('Last')).toHaveFocus();
    });

    it('place slotted content where its slot is, not where it sits in the page', () => {
      render(
        <Trap>
          <Host shadow="<slot></slot><button>Shadow one</button>">
            <button>Slotted</button>
          </Host>
        </Trap>
      );
      // The slot comes first, so the slotted button is the first stop.
      expect(button('Slotted')).toHaveFocus();
      inShadow('Shadow one').focus();
      expect(pressTab().defaultPrevented).toBe(true);
      expect(button('Slotted')).toHaveFocus();
    });

    it.each([
      ['inert', '<div inert><slot></slot></div>'],
      ['display: none', '<div style="display: none"><slot></slot></div>'],
    ])(
      'skip content slotted under a shadow ancestor that is %s',
      (_, shadow) => {
        render(
          <Trap>
            <Host shadow={shadow}>
              <button>Slotted</button>
            </Host>
            <button>Real</button>
          </Trap>
        );
        // Turning on, the trap goes past the slotted button to the real one.
        expect(button('Real')).toHaveFocus();
        expect(pressTab(true).defaultPrevented).toBe(true);
        expect(button('Real')).toHaveFocus();
      }
    );

    it('count content slotted under a shadow ancestor that is shown', () => {
      render(
        <Trap>
          <Host shadow="<div><slot></slot></div>">
            <button>Slotted</button>
          </Host>
          <button>Real</button>
        </Trap>
      );
      expect(button('Slotted')).toHaveFocus();
    });

    it('skip a host’s child that no slot takes, which is not rendered', () => {
      render(
        <Trap>
          <Host shadow='<slot name="named"></slot>'>
            <button>Unslotted</button>
          </Host>
          <button>Real</button>
        </Trap>
      );
      expect(button('Real')).toHaveFocus();
    });

    it('hold a radio group of their own, apart from the page’s', () => {
      render(
        <>
          <input type="radio" name="size" aria-label="Outside" defaultChecked />
          <Trap>
            <button>First</button>
            <Host shadow='<input type="radio" name="size" aria-label="Inside">' />
          </Trap>
        </>
      );
      expect(pressTab(true).defaultPrevented).toBe(true);
      expect(focused()).toBe(
        screen.getByTestId('host').shadowRoot!.querySelector('input')
      );
    });

    it('restore focus when it was last inside one', () => {
      // Deactivated with the container still on the page, so focus is still
      // inside the shadow root when the trap lets go.
      const Panel: React.FC = () => {
        const [active, setActive] = useState(true);
        const triggerRef = useRef<HTMLButtonElement>(null);
        return (
          <>
            <button ref={triggerRef} onClick={() => setActive(false)}>
              Trigger
            </button>
            <Trap active={active} restoreFocus={triggerRef}>
              <button>First</button>
              <Host />
            </Trap>
          </>
        );
      };
      render(<Panel />);
      inShadow('Shadow two').focus();
      fireEvent.click(button('Trigger'));
      expect(button('Trigger')).toHaveFocus();
    });
  });

  // The browser can skip a stop the trap counts (Safari passes over links by
  // default), so a Tab the trap lets through can still leave. jsdom has no
  // default Tab action, so each test moves focus the way the browser would.
  describe('when a Tab it let through leaves anyway', () => {
    const outside = () => screen.getByRole('button', { name: 'Outside' });
    const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <>
        <button>Outside</button>
        <Trap>{children}</Trap>
        <button>Also outside</button>
      </>
    );

    it('sends focus forward to the first stop', () => {
      render(
        <Page>
          <button>First</button>
          <a href="#skipped">Skipped by the browser</a>
        </Page>
      );
      expect(pressTab().defaultPrevented).toBe(false);
      button('Also outside').focus();
      expect(button('First')).toHaveFocus();
    });

    it('sends focus back to the last stop on Shift+Tab', () => {
      render(
        <Page>
          <a href="#skipped">Skipped by the browser</a>
          <button>Last</button>
        </Page>
      );
      button('Last').focus();
      expect(pressTab(true).defaultPrevented).toBe(false);
      outside().focus();
      expect(button('Last')).toHaveFocus();
    });

    it('leaves focus that moves on inside the container', () => {
      render(
        <Page>
          <button>First</button>
          <button>Second</button>
        </Page>
      );
      pressTab();
      button('Second').focus();
      expect(button('Second')).toHaveFocus();
    });

    it('leaves focus a pointer or a script moves out', () => {
      render(
        <Page>
          <button>First</button>
        </Page>
      );
      outside().focus();
      expect(outside()).toHaveFocus();
    });

    it('stops watching once that Tab is over', async () => {
      render(
        <Page>
          <button>First</button>
          <a href="#skipped">Skipped by the browser</a>
        </Page>
      );
      pressTab();
      await act(() => new Promise(resolve => setTimeout(resolve)));
      outside().focus();
      expect(outside()).toHaveFocus();
    });
  });

  describe('restoring focus', () => {
    const Toggle: React.FC<{
      restoreFocus?: UseFocusTrapOptions['restoreFocus'];
      content?: React.ReactNode;
    }> = ({ restoreFocus, content }) => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <button>Elsewhere</button>
          {open && (
            <Trap restoreFocus={restoreFocus}>
              {content ?? <button onClick={() => setOpen(false)}>Close</button>}
            </Trap>
          )}
          <button onClick={() => setOpen(false)}>Outside close</button>
        </>
      );
    };

    const open = () => {
      button('Open').focus();
      fireEvent.click(button('Open'));
    };

    it('returns focus to the element that had it when the trap turned on', () => {
      render(<Toggle />);
      open();
      expect(button('Close')).toHaveFocus();
      fireEvent.click(button('Close'));
      expect(button('Open')).toHaveFocus();
    });

    it('returns focus when active turns off with the container still mounted', () => {
      const Switchable: React.FC = () => {
        const [active, setActive] = useState(false);
        return (
          <>
            <button onClick={() => setActive(true)}>Arm</button>
            <Trap active={active}>
              <button onClick={() => setActive(false)}>Disarm</button>
            </Trap>
          </>
        );
      };
      render(<Switchable />);
      button('Arm').focus();
      fireEvent.click(button('Arm'));
      expect(button('Disarm')).toHaveFocus();
      fireEvent.click(button('Disarm'));
      expect(button('Arm')).toHaveFocus();
    });

    it('sends focus to the restoreFocus ref instead', () => {
      const WithTarget: React.FC = () => {
        const targetRef = useRef<HTMLButtonElement>(null);
        return (
          <>
            <button ref={targetRef}>Target</button>
            <Toggle restoreFocus={targetRef} />
          </>
        );
      };
      render(<WithTarget />);
      open();
      fireEvent.click(button('Close'));
      expect(button('Target')).toHaveFocus();
    });

    it('leaves focus alone when restoreFocus is false', () => {
      render(<Toggle restoreFocus={false} />);
      open();
      fireEvent.click(button('Close'));
      expect(document.body).toHaveFocus();
    });

    it('leaves focus alone, without throwing, when restoreFocus is null', () => {
      // Outside the types, but a caller without them can pass it.
      render(<Toggle restoreFocus={null as unknown as boolean} />);
      open();
      expect(() => fireEvent.click(button('Close'))).not.toThrow();
      expect(document.body).toHaveFocus();
    });

    it('does not take focus back from an element outside that already has it', () => {
      render(<Toggle />);
      open();
      button('Elsewhere').focus();
      fireEvent.click(button('Outside close'));
      expect(button('Elsewhere')).toHaveFocus();
    });

    it('loses the opener to content that took focus as it mounted, which a ref fixes', () => {
      const WithOpenerRef: React.FC<{ byRef: boolean }> = ({ byRef }) => {
        const openerRef = useRef<HTMLButtonElement>(null);
        const [open, setOpen] = useState(false);
        return (
          <>
            <button ref={openerRef} onClick={() => setOpen(true)}>
              Open
            </button>
            {open && (
              <Trap restoreFocus={byRef ? openerRef : true}>
                <input aria-label="Search" autoFocus />
              </Trap>
            )}
            <button onClick={() => setOpen(false)}>Outside close</button>
          </>
        );
      };

      // The autofocused input already has focus when the trap turns on, so it
      // is what `true` records, and it leaves with the container.
      const { unmount } = render(<WithOpenerRef byRef={false} />);
      open();
      expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus();
      fireEvent.click(button('Outside close'));
      expect(document.body).toHaveFocus();
      unmount();

      render(<WithOpenerRef byRef />);
      open();
      fireEvent.click(button('Outside close'));
      expect(button('Open')).toHaveFocus();
    });
  });

  it('works inside a shadow root, where document.activeElement is the host', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const mount = document.createElement('div');
    host.attachShadow({ mode: 'open' }).appendChild(mount);
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const inShadow = (name: string) =>
      Array.from(mount.querySelectorAll('button')).find(
        b => b.textContent === name
      )!;
    const tabFrom = (el: HTMLElement, shiftKey = false) => {
      el.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(event);
      return event;
    };
    try {
      const { unmount } = render(<Trap />, { container: mount });
      expect(document.activeElement).toBe(host);
      expect(host.shadowRoot!.activeElement).toBe(inShadow('First'));

      expect(tabFrom(inShadow('Last')).defaultPrevented).toBe(true);
      expect(host.shadowRoot!.activeElement).toBe(inShadow('First'));
      expect(tabFrom(inShadow('Middle')).defaultPrevented).toBe(false);
      expect(tabFrom(inShadow('First'), true).defaultPrevented).toBe(true);
      expect(host.shadowRoot!.activeElement).toBe(inShadow('Last'));

      unmount();
      expect(opener).toHaveFocus();
    } finally {
      document.body.removeChild(host);
      document.body.removeChild(opener);
    }
  });

  it('inside a shadow root, leaves focus the page holds when it lets go', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const mount = document.createElement('div');
    host.attachShadow({ mode: 'open' }).appendChild(mount);
    const elsewhere = document.createElement('button');
    document.body.appendChild(elsewhere);
    try {
      const { unmount } = render(<Trap />, { container: mount });
      elsewhere.focus();
      unmount();
      expect(elsewhere).toHaveFocus();
    } finally {
      document.body.removeChild(host);
      document.body.removeChild(elsewhere);
    }
  });

  it('lets a nested trap handle Tab without the outer one wrapping too', () => {
    const Nested: React.FC = () => {
      const outerRef = useRef<HTMLDivElement>(null);
      const innerRef = useRef<HTMLDivElement>(null);
      useFocusTrap(outerRef);
      useFocusTrap(innerRef);
      return (
        <div ref={outerRef} tabIndex={-1}>
          <button>Outer first</button>
          <div ref={innerRef} tabIndex={-1}>
            <button>Inner only</button>
          </div>
        </div>
      );
    };
    render(<Nested />);
    // The inner trap engages last, so it holds focus.
    expect(button('Inner only')).toHaveFocus();
    // Its only stop is also the outer trap's last one, so without the nested
    // check the outer trap would send focus to its first stop.
    expect(pressTab().defaultPrevented).toBe(true);
    expect(button('Inner only')).toHaveFocus();
  });

  it('reads focus from its container’s own document', () => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const doc = frame.contentDocument as Document;
    const opener = doc.createElement('button');
    opener.textContent = 'Opener';
    const mount = doc.createElement('div');
    doc.body.append(opener, mount);
    const inFrame = (name: string) =>
      Array.from(doc.querySelectorAll('button')).find(
        b => b.textContent === name
      ) as HTMLButtonElement;
    const tabFrom = (el: HTMLElement) => {
      el.focus();
      const event = new (doc.defaultView as typeof globalThis).KeyboardEvent(
        'keydown',
        { key: 'Tab', bubbles: true, cancelable: true }
      );
      el.dispatchEvent(event);
      return event;
    };
    try {
      opener.focus();
      const { rerender } = render(<Trap />, { container: mount });
      expect(doc.activeElement).toBe(inFrame('First'));
      // The wrap is decided from the frame's focus, not the page's.
      expect(tabFrom(inFrame('Last')).defaultPrevented).toBe(true);
      expect(doc.activeElement).toBe(inFrame('First'));
      expect(tabFrom(inFrame('Middle')).defaultPrevented).toBe(false);
      // So is the opener focus goes back to.
      rerender(<Trap active={false} />);
      expect(doc.activeElement).toBe(opener);
    } finally {
      frame.remove();
    }
  });

  describe('server rendering and hydration', () => {
    const PortaledPanel: React.FC = () => {
      const ref = useRef<HTMLDivElement>(null);
      useFocusTrap(ref);
      return (
        <main>
          <button>Page</button>
          <AfterHydration>
            <div ref={ref} tabIndex={-1} data-testid="panel">
              <button>In the panel</button>
            </div>
          </AfterHydration>
        </main>
      );
    };

    it('server-renders without running the trap', () => {
      expect(renderToString(<PortaledPanel />)).toBe(
        '<main><button>Page</button></main>'
      );
    });

    it('attaches to a portaled container once the page hydrates', async () => {
      const container = document.createElement('div');
      container.innerHTML = renderToString(<PortaledPanel />);
      document.body.appendChild(container);

      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      let unmountRoot = () => {};
      try {
        await act(async () => {
          const root = hydrateRoot(container, <PortaledPanel />);
          unmountRoot = () => root.unmount();
        });

        expect(errorSpy).not.toHaveBeenCalled();
        // The panel only exists from the commit after hydration; the trap
        // still found it, moved focus in, and wraps Tab there.
        const inPanel = button('In the panel');
        expect(inPanel).toHaveFocus();
        expect(pressTab().defaultPrevented).toBe(true);
        expect(inPanel).toHaveFocus();
      } finally {
        await act(async () => unmountRoot());
        errorSpy.mockRestore();
        document.body.removeChild(container);
      }
    });
  });
});
