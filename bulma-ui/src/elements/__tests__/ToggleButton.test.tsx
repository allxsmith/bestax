import React, { createRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { ToggleButton, type ToggleButtonColor } from '../ToggleButton';
import type { ButtonOwnProps } from '../Button';
import { Buttons } from '../Buttons';
import { ConfigProvider } from '../../helpers/Config';

const toggle = (name = 'Mute') => screen.getByRole('button', { name });

/** Whether two types are the same, both ways round. */
type Same<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

describe('ToggleButton', () => {
  describe('what it renders', () => {
    it('renders one <button type="button"> with Bulma’s button class', () => {
      const { container } = render(<ToggleButton>Mute</ToggleButton>);
      expect(container.querySelectorAll('button')).toHaveLength(1);
      expect(toggle().tagName).toBe('BUTTON');
      expect(toggle()).toHaveAttribute('type', 'button');
      expect(toggle()).toHaveClass('button');
    });

    it('is not pressed by default, and says so with aria-pressed="false"', () => {
      render(<ToggleButton>Mute</ToggleButton>);
      expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    });

    it('exposes the toggle as pressed or not pressed', () => {
      render(
        <>
          <ToggleButton>Mute</ToggleButton>
          <ToggleButton defaultPressed>Pin</ToggleButton>
        </>
      );
      expect(screen.getByRole('button', { pressed: false })).toBe(toggle());
      expect(screen.getByRole('button', { pressed: true })).toBe(toggle('Pin'));
    });

    it('passes other attributes and the helper props through to the button', () => {
      render(
        <ToggleButton
          id="mute"
          title="Mute the player"
          data-testid="mute"
          mr="2"
          className="custom"
        >
          Mute
        </ToggleButton>
      );
      const button = screen.getByTestId('mute');
      expect(button).toHaveAttribute('id', 'mute');
      expect(button).toHaveAttribute('title', 'Mute the player');
      expect(button).toHaveClass('button', 'mr-2', 'custom');
      expect(button.className.split(' ').pop()).toBe('custom');
    });

    it('forwards its ref to the <button>', () => {
      const ref = createRef<HTMLButtonElement>();
      render(<ToggleButton ref={ref}>Mute</ToggleButton>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toBe(toggle());
    });

    it('has a displayName for dev tools', () => {
      expect(ToggleButton.displayName).toBe('ToggleButton');
    });
  });

  describe('holding its own state', () => {
    it('starts where defaultPressed says', () => {
      render(<ToggleButton defaultPressed>Mute</ToggleButton>);
      expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    });

    it('flips once per click and reports each new state', async () => {
      const user = userEvent.setup();
      const onPressedChange = jest.fn();
      render(
        <ToggleButton onPressedChange={onPressedChange}>Mute</ToggleButton>
      );
      await user.click(toggle());
      expect(toggle()).toHaveAttribute('aria-pressed', 'true');
      expect(onPressedChange).toHaveBeenLastCalledWith(true);
      await user.click(toggle());
      expect(toggle()).toHaveAttribute('aria-pressed', 'false');
      expect(onPressedChange).toHaveBeenLastCalledWith(false);
      expect(onPressedChange).toHaveBeenCalledTimes(2);
    });

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('flips once on %s, reports it, and keeps focus', async (_key, keys) => {
      const user = userEvent.setup();
      const onPressedChange = jest.fn();
      render(
        <ToggleButton onPressedChange={onPressedChange}>Mute</ToggleButton>
      );
      await user.tab();
      expect(toggle()).toHaveFocus();
      await user.keyboard(keys);
      expect(toggle()).toHaveAttribute('aria-pressed', 'true');
      expect(onPressedChange).toHaveBeenCalledTimes(1);
      expect(onPressedChange).toHaveBeenCalledWith(true);
      expect(toggle()).toHaveFocus();
      await user.keyboard(keys);
      expect(toggle()).toHaveAttribute('aria-pressed', 'false');
      expect(onPressedChange).toHaveBeenLastCalledWith(false);
      expect(toggle()).toHaveFocus();
    });

    it('keeps its accessible name in both states', async () => {
      const user = userEvent.setup();
      render(
        <ToggleButton aria-label="Bold">
          <span aria-hidden="true">B</span>
        </ToggleButton>
      );
      const button = screen.getByRole('button', { name: 'Bold' });
      await user.click(button);
      expect(screen.getByRole('button', { name: 'Bold' })).toBe(button);
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('when you hold the state', () => {
    it('asks for the other state and changes nothing until pressed does', async () => {
      const user = userEvent.setup();
      const onPressedChange = jest.fn();
      const { rerender } = render(
        <ToggleButton pressed={false} onPressedChange={onPressedChange}>
          Mute
        </ToggleButton>
      );
      await user.click(toggle());
      expect(onPressedChange).toHaveBeenCalledWith(true);
      expect(toggle()).toHaveAttribute('aria-pressed', 'false');
      expect(toggle()).not.toHaveClass('is-link');

      rerender(
        <ToggleButton pressed onPressedChange={onPressedChange}>
          Mute
        </ToggleButton>
      );
      expect(toggle()).toHaveAttribute('aria-pressed', 'true');
      await user.click(toggle());
      expect(onPressedChange).toHaveBeenLastCalledWith(false);
      expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    });

    it('follows pressed when it is wired to the caller’s state', async () => {
      const user = userEvent.setup();
      function Player() {
        const [muted, setMuted] = useState(false);
        return (
          <>
            <ToggleButton pressed={muted} onPressedChange={setMuted}>
              Mute
            </ToggleButton>
            <p>{muted ? 'Muted' : 'Playing'}</p>
          </>
        );
      }
      render(<Player />);
      await user.click(toggle());
      expect(toggle()).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Muted')).toBeInTheDocument();
      await user.keyboard(' ');
      expect(toggle()).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByText('Playing')).toBeInTheDocument();
    });

    it('ignores defaultPressed once pressed is set', () => {
      render(
        <ToggleButton pressed={false} defaultPressed>
          Mute
        </ToggleButton>
      );
      expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('onClick', () => {
    it('runs before the toggle', async () => {
      const user = userEvent.setup();
      const calls: string[] = [];
      render(
        <ToggleButton
          onClick={event =>
            calls.push(
              `click while ${event.currentTarget.getAttribute('aria-pressed')}`
            )
          }
          onPressedChange={next => calls.push(`change to ${next}`)}
        >
          Mute
        </ToggleButton>
      );
      await user.click(toggle());
      expect(calls).toEqual(['click while false', 'change to true']);
    });

    it('stops the toggle when it calls preventDefault()', async () => {
      const user = userEvent.setup();
      const onPressedChange = jest.fn();
      render(
        <ToggleButton
          onClick={event => event.preventDefault()}
          onPressedChange={onPressedChange}
        >
          Mute
        </ToggleButton>
      );
      await user.click(toggle());
      await user.keyboard('{Enter}');
      expect(toggle()).toHaveAttribute('aria-pressed', 'false');
      expect(onPressedChange).not.toHaveBeenCalled();
    });

    it('stops a controlled toggle from asking for a change', async () => {
      const user = userEvent.setup();
      const onPressedChange = jest.fn();
      render(
        <ToggleButton
          pressed
          onClick={event => event.preventDefault()}
          onPressedChange={onPressedChange}
        >
          Mute
        </ToggleButton>
      );
      await user.click(toggle());
      expect(onPressedChange).not.toHaveBeenCalled();
    });
  });

  describe('disabled', () => {
    it.each([
      ['isDisabled', { isDisabled: true }],
      ['disabled', { disabled: true }],
    ])(
      'with %s, clicks and keys neither flip it nor report',
      async (_prop, disabling) => {
        const user = userEvent.setup();
        const onPressedChange = jest.fn();
        render(
          <ToggleButton {...disabling} onPressedChange={onPressedChange}>
            Mute
          </ToggleButton>
        );
        expect(toggle()).toBeDisabled();
        fireEvent.click(toggle());
        await user.click(toggle());
        await user.tab();
        expect(toggle()).not.toHaveFocus();
        await user.keyboard('{Enter}');
        await user.keyboard(' ');
        expect(toggle()).toHaveAttribute('aria-pressed', 'false');
        expect(onPressedChange).not.toHaveBeenCalled();
      }
    );

    it('keeps a pressed fill under the disabled look', () => {
      render(
        <ToggleButton defaultPressed isDisabled>
          Mute
        </ToggleButton>
      );
      expect(toggle()).toHaveAttribute('aria-pressed', 'true');
      expect(toggle()).toHaveClass('is-link', 'is-selected', 'is-disabled');
    });
  });

  describe('loading', () => {
    it('holds still for a click, Enter and Space, and says it is busy and unavailable', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      const onPressedChange = jest.fn();
      render(
        <ToggleButton
          isLoading
          onClick={onClick}
          onPressedChange={onPressedChange}
        >
          Mute
        </ToggleButton>
      );
      expect(toggle()).toHaveAttribute('aria-busy', 'true');
      expect(toggle()).toHaveAttribute('aria-disabled', 'true');
      expect(toggle()).not.toBeDisabled();
      await user.tab();
      expect(toggle()).toHaveFocus();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      // jsdom applies no Bulma CSS, so this click reaches the button the way
      // a key does in a browser, where the spinner stops only the pointer.
      await user.click(toggle());
      expect(toggle()).toHaveAttribute('aria-pressed', 'false');
      expect(onClick).not.toHaveBeenCalled();
      expect(onPressedChange).not.toHaveBeenCalled();
      expect(toggle()).toHaveFocus();
    });

    it('toggles again once the change it was saving lands', async () => {
      const user = userEvent.setup();
      const changes: boolean[] = [];
      let finishSaving = () => {};
      function Pin() {
        const [pinned, setPinned] = useState(false);
        const [saving, setSaving] = useState(false);
        finishSaving = () => setSaving(false);
        return (
          <ToggleButton
            pressed={pinned}
            isLoading={saving}
            onPressedChange={next => {
              changes.push(next);
              setPinned(next);
              setSaving(true);
            }}
          >
            Pin
          </ToggleButton>
        );
      }
      render(<Pin />);
      await user.click(toggle('Pin'));
      expect(toggle('Pin')).toHaveAttribute('aria-pressed', 'true');
      expect(toggle('Pin')).toHaveAttribute('aria-busy', 'true');
      expect(toggle('Pin')).toHaveAttribute('aria-disabled', 'true');
      expect(toggle('Pin')).toHaveFocus();

      await user.keyboard(' ');
      await user.keyboard('{Enter}');
      expect(changes).toEqual([true]);
      expect(toggle('Pin')).toHaveAttribute('aria-pressed', 'true');

      act(() => finishSaving());
      expect(toggle('Pin')).not.toHaveAttribute('aria-busy');
      expect(toggle('Pin')).not.toHaveAttribute('aria-disabled');
      await user.keyboard(' ');
      expect(changes).toEqual([true, false]);
      expect(toggle('Pin')).toHaveAttribute('aria-pressed', 'false');
    });

    it('keeps the caller’s aria-busy and aria-disabled while it is not loading', () => {
      render(
        <ToggleButton aria-busy="true" aria-disabled="true">
          Mute
        </ToggleButton>
      );
      expect(toggle()).toHaveAttribute('aria-busy', 'true');
      expect(toggle()).toHaveAttribute('aria-disabled', 'true');
    });

    it('sets neither while it is not loading and the caller sets neither', () => {
      render(<ToggleButton>Mute</ToggleButton>);
      expect(toggle()).not.toHaveAttribute('aria-busy');
      expect(toggle()).not.toHaveAttribute('aria-disabled');
    });
  });

  describe('the pressed look', () => {
    it('adds is-link and is-selected while pressed, and neither when not', async () => {
      const user = userEvent.setup();
      render(<ToggleButton>Mute</ToggleButton>);
      expect(toggle()).not.toHaveClass('is-link');
      expect(toggle()).not.toHaveClass('is-selected');
      await user.click(toggle());
      expect(toggle()).toHaveClass('button', 'is-link', 'is-selected');
      await user.click(toggle());
      expect(toggle()).not.toHaveClass('is-link');
      expect(toggle()).not.toHaveClass('is-selected');
    });

    it('fills with color while pressed, and only then', async () => {
      const user = userEvent.setup();
      render(<ToggleButton color="danger">Mute</ToggleButton>);
      expect(toggle()).not.toHaveClass('is-danger');
      await user.click(toggle());
      expect(toggle()).toHaveClass('is-danger', 'is-selected');
      expect(toggle()).not.toHaveClass('is-link');
    });

    it('never holds is-active, so hover and the press shade keep working', () => {
      render(<ToggleButton defaultPressed>Mute</ToggleButton>);
      expect(toggle()).not.toHaveClass('is-active');
    });

    it('takes the deprecated isFullWidth the way Button does', () => {
      render(
        <>
          <ToggleButton isFullWidth>Mute</ToggleButton>
          <ToggleButton isFullwidth>Pin</ToggleButton>
          <ToggleButton isFullwidth={false} isFullWidth>
            Star
          </ToggleButton>
        </>
      );
      expect(toggle()).toHaveClass('button', 'is-fullwidth');
      expect(toggle('Pin').className).toBe(toggle().className);
      // `isFullwidth` wins when both are set, as on Button.
      expect(toggle('Star')).not.toHaveClass('is-fullwidth');
    });

    it.each([false, true])(
      'applies size, isRounded, isFullwidth and isLoading (pressed: %s)',
      pressed => {
        render(
          <ToggleButton
            pressed={pressed}
            size="small"
            isRounded
            isFullwidth
            isLoading
          >
            Mute
          </ToggleButton>
        );
        expect(toggle()).toHaveClass(
          'button',
          'is-small',
          'is-rounded',
          'is-fullwidth',
          'is-loading'
        );
      }
    );

    it('sits in Buttons hasAddons as a named group', () => {
      render(
        <Buttons hasAddons role="group" aria-label="Text style">
          <ToggleButton aria-label="Bold" defaultPressed>
            B
          </ToggleButton>
          <ToggleButton aria-label="Italic">I</ToggleButton>
        </Buttons>
      );
      const group = screen.getByRole('group', { name: 'Text style' });
      expect(group).toHaveClass('buttons', 'has-addons');
      expect(screen.getByRole('button', { name: 'Bold' })).toHaveClass(
        'is-selected'
      );
      expect(screen.getByRole('button', { name: 'Italic' })).not.toHaveClass(
        'is-selected'
      );
    });
  });

  describe('inside a form', () => {
    it('never submits it', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn((event: React.FormEvent) =>
        event.preventDefault()
      );
      render(
        <form onSubmit={onSubmit}>
          <ToggleButton>Mute</ToggleButton>
        </form>
      );
      await user.click(toggle());
      await user.keyboard('{Enter}');
      expect(toggle()).toHaveAttribute('aria-pressed', 'false');
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('props it leaves out', () => {
    it('takes Button’s colors except the ones that don’t stand out pressed', () => {
      // Checked by `typecheck:tests`: a color Button gains makes this false.
      // `text` and `ghost` don't fill, and the other four fill about as light
      // or dark as a plain button already is in one theme or the other.
      const same: Same<
        ToggleButtonColor,
        Exclude<
          ButtonOwnProps['color'],
          'text' | 'ghost' | 'white' | 'light' | 'dark' | 'black' | undefined
        >
      > = true;
      expect(same).toBe(true);
    });

    it('rejects them at the type level', () => {
      render(
        <>
          {/* @ts-expect-error: always a button, since only a button can be pressed */}
          <ToggleButton as="a">A</ToggleButton>
          {/* @ts-expect-error: always type="button" */}
          <ToggleButton type="submit">B</ToggleButton>
          {/* @ts-expect-error: the state is aria-pressed's to report */}
          <ToggleButton aria-pressed="mixed">C</ToggleButton>
          {/* @ts-expect-error: pressed replaces isActive */}
          <ToggleButton isActive>D</ToggleButton>
          {/* @ts-expect-error: a toggle you can't press */}
          <ToggleButton isStatic>E</ToggleButton>
          {/* @ts-expect-error: a light fill blurs on and off */}
          <ToggleButton isLight>F</ToggleButton>
          {/* @ts-expect-error: an outline colors both states */}
          <ToggleButton isOutlined>G</ToggleButton>
          {/* @ts-expect-error: nor an inverted one */}
          <ToggleButton isInverted>H</ToggleButton>
          {/* @ts-expect-error: a text color shows in both states */}
          <ToggleButton textColor="primary">I</ToggleButton>
          {/* @ts-expect-error: and so does a background */}
          <ToggleButton bgColor="primary">J</ToggleButton>
          {/* @ts-expect-error: text doesn't fill */}
          <ToggleButton color="text">K</ToggleButton>
          {/* @ts-expect-error: and neither does ghost */}
          <ToggleButton color="ghost">L</ToggleButton>
          {/* @ts-expect-error: white fills like a plain button in a light theme */}
          <ToggleButton color="white">M</ToggleButton>
          {/* @ts-expect-error: and light nearly so */}
          <ToggleButton color="light">N</ToggleButton>
          {/* @ts-expect-error: dark fills like a plain button in a dark theme */}
          <ToggleButton color="dark">O</ToggleButton>
          {/* @ts-expect-error: and black fills darker than one */}
          <ToggleButton color="black">P</ToggleButton>
        </>
      );
      expect(screen.getAllByRole('button')).toHaveLength(16);
    });

    it('stays a pressed-or-not button whatever a spread passes along', () => {
      const untyped = {
        as: 'a',
        href: '#mute',
        type: 'submit',
        'aria-pressed': 'mixed',
      } as Record<string, unknown>;
      render(
        <ToggleButton defaultPressed {...untyped}>
          Mute
        </ToggleButton>
      );
      expect(toggle().tagName).toBe('BUTTON');
      expect(toggle()).toHaveAttribute('type', 'button');
      expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <ToggleButton defaultPressed size="small" mr="2">
          Mute
        </ToggleButton>
      </ConfigProvider>
    );
    expect(toggle()).toHaveClass(
      'bestax-button',
      'bestax-is-link',
      'bestax-is-selected',
      'bestax-is-small',
      'bestax-mr-2'
    );
    expect(toggle()).not.toHaveClass('button');
    expect(toggle()).not.toHaveClass('is-selected');
  });

  describe('server rendering', () => {
    it.each([
      [false, 'aria-pressed="false"'],
      [true, 'aria-pressed="true"'],
    ])(
      'renders its starting state (pressed: %s) in the server markup',
      (defaultPressed, attribute) => {
        const html = renderToString(
          <ToggleButton defaultPressed={defaultPressed}>Mute</ToggleButton>
        );
        expect(html).toContain(attribute);
        expect(html).toContain('type="button"');
        if (defaultPressed) {
          expect(html).toMatch(/class="button is-link is-selected"/);
        } else {
          expect(html).toMatch(/class="button"/);
        }
      }
    );

    it('hydrates without a mismatch, then toggles', async () => {
      const ui = <ToggleButton defaultPressed>Mute</ToggleButton>;
      const container = document.createElement('div');
      container.innerHTML = renderToString(ui);
      document.body.appendChild(container);
      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, ui);
        });
        expect(errorSpy).not.toHaveBeenCalled();
        const button = container.querySelector('button')!;
        expect(button).toHaveAttribute('aria-pressed', 'true');
        await act(async () => {
          button.click();
        });
        expect(button).toHaveAttribute('aria-pressed', 'false');
      } finally {
        errorSpy.mockRestore();
        await act(async () => root!.unmount());
        container.remove();
      }
    });
  });
});
