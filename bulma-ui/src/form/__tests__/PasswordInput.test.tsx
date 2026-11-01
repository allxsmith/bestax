import type { MockInstance } from 'vitest';
import { createRef, useEffect, useRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { PasswordInput, type PasswordInputProps } from '../PasswordInput';
import { PasswordInputBase } from '../PasswordInputBase';
import { Field } from '../Field';
import { Control } from '../Control';
import { Fieldset } from '../Fieldset';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';
import { useClientLayoutEffect } from '../../helpers/useClientLayoutEffect';

let warnSpy: MockInstance;

beforeEach(() => {
  resetDevWarnings();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

const input = () => screen.getByLabelText('Password') as HTMLInputElement;
const toggle = () =>
  document.querySelector('.passwordinput-toggle') as HTMLButtonElement;

/** A field whose visibility callback the test reads back. */
function setup(props: Partial<PasswordInputProps> = {}) {
  const onVisibleChange = vi.fn();
  const utils = render(
    <PasswordInput
      label="Password"
      onVisibleChange={onVisibleChange}
      {...props}
    />
  );
  return { ...utils, onVisibleChange };
}

/** The props a JavaScript caller can pass, which the types leave out. */
const untyped = (props: Record<string, unknown>) =>
  props as Partial<PasswordInputProps>;

describe('PasswordInput', () => {
  describe('Markup', () => {
    it('renders a Field and a Control around the input and its toggle', () => {
      const { container } = setup();
      const field = container.firstElementChild as HTMLElement;
      expect(field).toHaveClass('field');
      const box = field.querySelector(
        ':scope > .control > .passwordinput-container'
      ) as HTMLElement;
      expect(box).not.toBeNull();
      expect(box.children).toHaveLength(2);
      expect(box.children[0]).toBe(input());
      expect(input()).toHaveClass('input');
      expect(input()).toHaveAttribute('type', 'password');
      expect(box.children[1]).toBe(toggle());
      expect(toggle()).toHaveAttribute('type', 'button');
      expect(box).not.toHaveClass('is-text');
    });

    it('asks for a current password and no spellcheck, autocorrect or capitals', () => {
      setup();
      expect(input()).toHaveAttribute('autocomplete', 'current-password');
      expect(input()).toHaveAttribute('spellcheck', 'false');
      expect(input()).toHaveAttribute('autocorrect', 'off');
      expect(input()).toHaveAttribute('autocapitalize', 'none');
    });

    it("takes the caller's own values for each of those", () => {
      setup({
        autoComplete: 'new-password',
        spellCheck: true,
        autoCorrect: 'on',
        autoCapitalize: 'sentences',
      });
      expect(input()).toHaveAttribute('autocomplete', 'new-password');
      expect(input()).toHaveAttribute('spellcheck', 'true');
      expect(input()).toHaveAttribute('autocorrect', 'on');
      expect(input()).toHaveAttribute('autocapitalize', 'sentences');
    });

    it('puts helper props, classes and other attributes on the input', () => {
      setup({
        color: 'danger',
        size: 'small',
        isRounded: true,
        mt: '3',
        className: 'custom',
        name: 'password',
        placeholder: 'Your password',
        required: true,
      });
      expect(input()).toHaveClass(
        'input',
        'is-danger',
        'is-small',
        'is-rounded',
        'mt-3',
        'custom'
      );
      expect(input()).toHaveAttribute('name', 'password');
      expect(input()).toHaveAttribute('placeholder', 'Your password');
      expect(input()).toBeRequired();
      expect(input().parentElement?.className).toBe('passwordinput-container');
    });

    it('keeps its own type whatever a caller passes', () => {
      setup(untyped({ type: 'email' }));
      expect(input()).toHaveAttribute('type', 'password');
    });

    it('forwards an object ref and a callback ref to the input', () => {
      const ref = createRef<HTMLInputElement>();
      const { unmount } = render(<PasswordInput label="Password" ref={ref} />);
      expect(ref.current).toBe(input());
      unmount();

      const callback = vi.fn();
      render(<PasswordInput label="Password" ref={callback} />);
      expect(callback).toHaveBeenCalledWith(input());
    });

    it('renders the container alone as PasswordInputBase', () => {
      const { container } = render(<PasswordInputBase aria-label="Password" />);
      const box = container.firstElementChild as HTMLElement;
      expect(box).toHaveClass('passwordinput-container');
      expect(container.querySelector('.field, .control')).toBeNull();
      expect(box.firstElementChild).toBe(input());
      expect(input()).not.toHaveAttribute('id');
    });
  });

  describe('The icon toggle', () => {
    it('keeps one name and reports whether the password shows', () => {
      const { onVisibleChange } = setup();
      const button = screen.getByRole('button', { name: 'Show password' });
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(button.querySelectorAll('path')).toHaveLength(1);
      expect(button.querySelector('svg')).toHaveAttribute(
        'aria-hidden',
        'true'
      );

      fireEvent.click(button);
      expect(input()).toHaveAttribute('type', 'text');
      expect(button).toHaveAccessibleName('Show password');
      expect(button).toHaveAttribute('aria-pressed', 'true');
      // The eye takes a line through it.
      expect(button.querySelectorAll('path')).toHaveLength(2);
      expect(onVisibleChange).toHaveBeenLastCalledWith(true);

      fireEvent.click(button);
      expect(input()).toHaveAttribute('type', 'password');
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('takes its name from labels, and falls back on an empty one', () => {
      const { unmount } = setup({ labels: { showPassword: 'Afficher' } });
      expect(toggle()).toHaveAccessibleName('Afficher');
      unmount();
      setup({ labels: { showPassword: '' } });
      expect(toggle()).toHaveAccessibleName('Show password');
    });

    it('leaves focus where it is on a pointer press', () => {
      setup();
      // A cancelled mousedown is what keeps focus and the caret in the input.
      expect(fireEvent.mouseDown(toggle())).toBe(false);
    });

    it('needs no callback', () => {
      render(<PasswordInput label="Password" />);
      fireEvent.click(toggle());
      expect(input()).toHaveAttribute('type', 'text');
    });
  });

  describe('The text toggle', () => {
    it('shows the word and is named after it, with no pressed state', () => {
      const { container } = setup({ variant: 'text' });
      expect(container.querySelector('.passwordinput-container')).toHaveClass(
        'is-text'
      );
      expect(toggle()).toHaveTextContent('Show');
      expect(toggle()).toHaveAccessibleName('Show password');
      expect(toggle()).not.toHaveAttribute('aria-pressed');

      fireEvent.click(toggle());
      expect(input()).toHaveAttribute('type', 'text');
      expect(toggle()).toHaveTextContent('Hide');
      expect(toggle()).toHaveAccessibleName('Hide password');
      expect(toggle()).not.toHaveAttribute('aria-pressed');
    });

    it('takes its words and names from labels', () => {
      setup({
        variant: 'text',
        labels: {
          showPassword: 'Mostrar contraseña',
          hidePassword: 'Ocultar contraseña',
          show: 'Mostrar',
          hide: 'Ocultar',
        },
      });
      expect(toggle()).toHaveTextContent('Mostrar');
      expect(toggle()).toHaveAccessibleName('Mostrar contraseña');
      fireEvent.click(toggle());
      expect(toggle()).toHaveTextContent('Ocultar');
      expect(toggle()).toHaveAccessibleName('Ocultar contraseña');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('warns once for each name that lacks its word, ignoring case', () => {
      const labels = { showPassword: 'Reveal password', hidePassword: 'HIDE' };
      const { rerender } = setup({ variant: 'text', labels });
      rerender(
        <PasswordInput label="Password" variant="text" labels={labels} />
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain(
        'named "Reveal password" while its button says "Show"'
      );
      expect(warnSpy.mock.calls[0][0]).toContain('Label in Name');

      render(
        <PasswordInput
          aria-label="Other"
          variant="text"
          labels={{ hidePassword: 'Conceal' }}
        />
      );
      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy.mock.calls[1][0]).toContain(
        'named "Conceal" while its button says "Hide"'
      );
    });

    it('checks no names with the icon, which shows no words', () => {
      setup({ labels: { showPassword: 'Reveal', hidePassword: 'Conceal' } });
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Visibility', () => {
    it('starts shown with defaultVisible', () => {
      setup({ defaultVisible: true });
      expect(input()).toHaveAttribute('type', 'text');
      expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    });

    it('follows visible, and only reports a press', () => {
      const { onVisibleChange, rerender } = setup({ visible: false });
      fireEvent.click(toggle());
      expect(onVisibleChange).toHaveBeenCalledWith(true);
      expect(input()).toHaveAttribute('type', 'password');

      rerender(
        <PasswordInput
          label="Password"
          visible
          onVisibleChange={onVisibleChange}
        />
      );
      expect(input()).toHaveAttribute('type', 'text');
      fireEvent.click(toggle());
      expect(onVisibleChange).toHaveBeenLastCalledWith(false);
      expect(input()).toHaveAttribute('type', 'text');
    });

    it('shows two fields together from one state', () => {
      function Pair() {
        const [visible, setVisible] = useState(false);
        return (
          <>
            <PasswordInput
              label="Current"
              visible={visible}
              onVisibleChange={setVisible}
            />
            <PasswordInput
              label="New"
              autoComplete="new-password"
              visible={visible}
              onVisibleChange={setVisible}
            />
          </>
        );
      }
      render(<Pair />);
      fireEvent.click(screen.getAllByRole('button')[0]);
      expect(screen.getByLabelText('Current')).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('New')).toHaveAttribute('type', 'text');
    });
  });

  describe('Hiding again', () => {
    function inForm(props: Partial<PasswordInputProps> = {}) {
      const onVisibleChange = vi.fn();
      const typeAtSubmit = vi.fn();
      const utils = render(
        <form
          data-testid="form"
          onSubmit={event => {
            event.preventDefault();
            typeAtSubmit(input().type);
          }}
        >
          <PasswordInput
            label="Password"
            onVisibleChange={onVisibleChange}
            {...props}
          />
        </form>
      );
      return {
        ...utils,
        form: screen.getByTestId('form'),
        onVisibleChange,
        typeAtSubmit,
      };
    }

    it('hides when the form submits, before the form sees it', () => {
      const { form, onVisibleChange, typeAtSubmit } = inForm();
      fireEvent.click(toggle());
      fireEvent.submit(form);
      expect(typeAtSubmit).toHaveBeenCalledWith('password');
      expect(input()).toHaveAttribute('type', 'password');
      expect(toggle()).toHaveAttribute('aria-pressed', 'false');
      expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('hides when the form resets', () => {
      const { form, onVisibleChange } = inForm({ variant: 'text' });
      fireEvent.click(toggle());
      fireEvent.reset(form);
      expect(input()).toHaveAttribute('type', 'password');
      expect(toggle()).toHaveTextContent('Show');
      expect(onVisibleChange).toHaveBeenLastCalledWith(false);
    });

    it('reports nothing when it was already hidden', () => {
      const { form, onVisibleChange } = inForm();
      fireEvent.submit(form);
      fireEvent.reset(form);
      expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it.each(['icon', 'text'] as const)(
      'switches the field back when the caller holds the state, and the %s toggle follows',
      variant => {
        const typeAtSubmit = vi.fn();
        function Held() {
          const [visible, setVisible] = useState(true);
          return (
            <form
              data-testid="form"
              onSubmit={event => {
                event.preventDefault();
                typeAtSubmit(input().type);
              }}
            >
              <PasswordInput
                label="Password"
                variant={variant}
                visible={visible}
                onVisibleChange={setVisible}
              />
            </form>
          );
        }
        render(<Held />);
        expect(input()).toHaveAttribute('type', 'text');
        fireEvent.submit(screen.getByTestId('form'));
        // The caller's own update rendered before the form read the field.
        expect(typeAtSubmit).toHaveBeenCalledWith('password');
        expect(input()).toHaveAttribute('type', 'password');
        if (variant === 'icon') {
          expect(toggle()).toHaveAttribute('aria-pressed', 'false');
          expect(toggle()).toHaveAccessibleName('Show password');
        } else {
          expect(toggle()).not.toHaveAttribute('aria-pressed');
          expect(toggle()).toHaveTextContent('Show');
          expect(toggle()).toHaveAccessibleName('Show password');
        }
        // And the next press shows it again.
        fireEvent.click(toggle());
        expect(input()).toHaveAttribute('type', 'text');
      }
    );

    it('keeps the field shown when the caller keeps visible true, and tells it', () => {
      const { form, onVisibleChange, typeAtSubmit } = inForm({
        visible: true,
        variant: 'text',
      });
      fireEvent.submit(form);
      expect(onVisibleChange).toHaveBeenCalledWith(false);
      expect(typeAtSubmit).toHaveBeenCalledWith('text');
      expect(input()).toHaveAttribute('type', 'text');
      expect(toggle()).toHaveTextContent('Hide');
      expect(toggle()).toHaveAccessibleName('Hide password');
    });

    it.each([
      ['useLayoutEffect', useClientLayoutEffect],
      ['useEffect', useEffect],
    ])(
      'hides just after a form submitted from %s, where React can’t render at once',
      (_name, useSubmitEffect) => {
        const errorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const onVisibleChange = vi.fn();
        const typeAtSubmit = vi.fn();
        function SubmitsWhenAsked({ ask }: { ask: boolean }) {
          const formRef = useRef<HTMLFormElement>(null);
          useSubmitEffect(() => {
            if (ask) formRef.current?.requestSubmit();
          }, [ask]);
          return (
            <form
              ref={formRef}
              onSubmit={event => {
                event.preventDefault();
                typeAtSubmit(input().type);
              }}
            >
              <PasswordInput
                label="Password"
                defaultVisible
                onVisibleChange={onVisibleChange}
              />
            </form>
          );
        }
        try {
          const { rerender } = render(<SubmitsWhenAsked ask={false} />);
          rerender(<SubmitsWhenAsked ask />);
          // The form read a text field, and the hide landed just after.
          expect(typeAtSubmit).toHaveBeenCalledWith('text');
          expect(onVisibleChange).toHaveBeenCalledWith(false);
          expect(input()).toHaveAttribute('type', 'password');
          expect(String(errorSpy.mock.calls[0]?.[0])).toContain('flushSync');
        } finally {
          errorSpy.mockRestore();
        }
      }
    );

    it('reports one false for two hide events before React renders', () => {
      // A caller that keeps `visible` true renders nothing, so a submit and
      // then a reset in one handler find the field as the first left it.
      const { form, onVisibleChange } = inForm({ visible: true });
      act(() => {
        form.dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true })
        );
        form.dispatchEvent(new Event('reset', { bubbles: true }));
      });
      expect(onVisibleChange).toHaveBeenCalledTimes(1);
      expect(onVisibleChange).toHaveBeenCalledWith(false);
    });

    it('reports one false for a submit and a reset from a layout effect', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const onVisibleChange = vi.fn();
      function SendsAndClears({ ask }: { ask: boolean }) {
        const formRef = useRef<HTMLFormElement>(null);
        useClientLayoutEffect(() => {
          if (!ask) return;
          formRef.current?.dispatchEvent(
            new Event('submit', { bubbles: true, cancelable: true })
          );
          formRef.current?.dispatchEvent(new Event('reset', { bubbles: true }));
        }, [ask]);
        return (
          <form ref={formRef} onSubmit={event => event.preventDefault()}>
            <PasswordInput
              label="Password"
              defaultVisible
              onVisibleChange={onVisibleChange}
            />
          </form>
        );
      }
      try {
        const { rerender } = render(<SendsAndClears ask={false} />);
        rerender(<SendsAndClears ask />);
        expect(onVisibleChange).toHaveBeenCalledTimes(1);
        expect(input()).toHaveAttribute('type', 'password');
      } finally {
        errorSpy.mockRestore();
      }
    });

    it('reports again once the field shows again', () => {
      const { form, onVisibleChange } = inForm({ defaultVisible: true });
      fireEvent.submit(form);
      fireEvent.click(toggle());
      fireEvent.submit(form);
      expect(onVisibleChange.mock.calls).toEqual([[false], [true], [false]]);
    });

    it('listens to the form its form attribute names', () => {
      const onVisibleChange = vi.fn();
      render(
        <>
          <form id="elsewhere" data-testid="form" />
          <PasswordInput
            label="Password"
            form="elsewhere"
            defaultVisible
            onVisibleChange={onVisibleChange}
          />
        </>
      );
      fireEvent.submit(screen.getByTestId('form'));
      expect(input()).toHaveAttribute('type', 'password');
      expect(onVisibleChange).toHaveBeenCalledWith(false);
    });

    it('hides for a form mounted after the field, and mounted again', () => {
      const onVisibleChange = vi.fn();
      const field = (
        <PasswordInput
          label="Password"
          form="late"
          defaultVisible
          onVisibleChange={onVisibleChange}
        />
      );
      const { rerender } = render(<>{field}</>);
      expect(input().form).toBeNull();
      rerender(
        <>
          {field}
          <form id="late" key="first" data-testid="form" />
        </>
      );
      fireEvent.submit(screen.getByTestId('form'));
      expect(input()).toHaveAttribute('type', 'password');
      expect(onVisibleChange).toHaveBeenCalledTimes(1);

      fireEvent.click(toggle());
      rerender(
        <>
          {field}
          <form id="late" key="second" data-testid="form" />
        </>
      );
      fireEvent.reset(screen.getByTestId('form'));
      expect(input()).toHaveAttribute('type', 'password');
      expect(onVisibleChange.mock.calls).toEqual([[false], [true], [false]]);
    });

    it('leaves another form alone', () => {
      const onVisibleChange = vi.fn();
      render(
        <>
          <form>
            <PasswordInput
              label="Password"
              defaultVisible
              onVisibleChange={onVisibleChange}
            />
          </form>
          <form data-testid="other" />
        </>
      );
      fireEvent.submit(screen.getByTestId('other'));
      fireEvent.reset(screen.getByTestId('other'));
      expect(input()).toHaveAttribute('type', 'text');
      expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it('stops listening once it unmounts', () => {
      const { form, onVisibleChange, rerender } = inForm({
        defaultVisible: true,
      });
      rerender(<form data-testid="form" />);
      fireEvent.submit(form);
      expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it('leaves the page coming back from the back-forward cache as it was', () => {
      const { onVisibleChange } = setup({ defaultVisible: true });
      act(() => {
        window.dispatchEvent(
          new PageTransitionEvent('pageshow', { persisted: true })
        );
      });
      // The pagehide on the way in already hid it.
      expect(input()).toHaveAttribute('type', 'text');
      expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it.each([false, true])(
      'hides when the page is left, kept for back-forward or not (persisted: %s)',
      persisted => {
        const { onVisibleChange, unmount } = setup({
          defaultVisible: true,
          variant: 'text',
        });
        act(() => {
          window.dispatchEvent(
            new PageTransitionEvent('pagehide', { persisted })
          );
          // Rendered before the listener returned, inside the same act.
          expect(input()).toHaveAttribute('type', 'password');
        });
        expect(toggle()).toHaveTextContent('Show');
        expect(onVisibleChange).toHaveBeenCalledWith(false);

        unmount();
        onVisibleChange.mockClear();
        act(() => {
          window.dispatchEvent(
            new PageTransitionEvent('pagehide', { persisted })
          );
        });
        expect(onVisibleChange).not.toHaveBeenCalled();
      }
    );

    it('works outside a form', () => {
      setup({ defaultVisible: true });
      expect(input().form).toBeNull();
      expect(input()).toHaveAttribute('type', 'text');
    });
  });

  describe('The value', () => {
    function Controlled(props: Partial<PasswordInputProps>) {
      const [value, setValue] = useState('');
      return (
        <PasswordInput
          label="Password"
          value={value}
          onChange={event => setValue(event.target.value)}
          {...props}
        />
      );
    }

    it('is left in a controlled field’s attribute, where React writes it', () => {
      render(<Controlled />);
      fireEvent.change(input(), { target: { value: 'hunter2' } });
      expect(input()).toHaveValue('hunter2');
      expect(input()).toHaveAttribute('value', 'hunter2');
    });

    it('stays out of an uncontrolled field’s attribute as it’s typed', () => {
      render(<PasswordInput label="Password" />);
      fireEvent.change(input(), { target: { value: 'hunter2' } });
      expect(input()).toHaveValue('hunter2');
      expect(input()).not.toHaveAttribute('value');
    });

    it.each([
      ['hidden', false],
      ['shown', true],
    ])(
      'goes back to defaultValue when the form resets, %s',
      (_state, defaultVisible) => {
        render(
          <form data-testid="form">
            <PasswordInput
              label="Password"
              defaultValue="swordfish"
              defaultVisible={defaultVisible}
            />
          </form>
        );
        fireEvent.change(input(), { target: { value: 'hunter2' } });
        expect(input()).toHaveValue('hunter2');
        act(() => {
          (screen.getByTestId('form') as HTMLFormElement).reset();
        });
        expect(input()).toHaveValue('swordfish');
        expect(input()).toHaveAttribute('type', 'password');
      }
    );
  });

  describe('Disabled and loading', () => {
    it('disables the toggle with the input', () => {
      setup({ disabled: true });
      expect(input()).toBeDisabled();
      expect(toggle()).toBeDisabled();
    });

    it('disables both inside a disabled Fieldset, unless it says otherwise', () => {
      render(
        <Fieldset legend="Account" disabled>
          <PasswordInput label="Password" />
          <PasswordInput label="Other" disabled={false} />
        </Fieldset>
      );
      expect(input()).toHaveAttribute('disabled');
      expect(toggle()).toHaveAttribute('disabled');
      // The browser still disables both inside the fieldset; its own
      // `disabled` is what the component renders.
      const other = screen.getByLabelText('Other');
      expect(other).not.toHaveAttribute('disabled');
      expect(other.nextElementSibling).not.toHaveAttribute('disabled');
    });

    it('draws no toggle while its Control is loading', () => {
      const { container } = setup({ isLoading: true });
      expect(container.querySelector('.control')).toHaveClass('is-loading');
      expect(toggle()).toBeNull();
      expect(input()).not.toHaveClass('is-loading');
    });

    it("draws no toggle while a caller's Control is loading", () => {
      render(
        <Field label="Password">
          <Control isLoading>
            <PasswordInput />
          </Control>
        </Field>
      );
      expect(toggle()).toBeNull();
    });
  });

  describe('The right icon', () => {
    it('draws none, and warns once naming the prop', () => {
      const { container, rerender } = setup(
        untyped({ iconRightName: 'check' })
      );
      rerender(
        <PasswordInput
          label="Password"
          {...untyped({ iconRightName: 'check' })}
        />
      );
      expect(container.querySelector('.icon.is-right')).toBeNull();
      expect(container.querySelector('.control')).not.toHaveClass(
        'has-icons-right'
      );
      expect(input()).not.toHaveAttribute('iconRightName');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toBe(
        '[bestax-bulma] <PasswordInput iconRightName> draws no right icon: ' +
          'the visibility toggle sits at that edge. Leave it out, or use a ' +
          'left icon.'
      );
    });

    it('names every one passed', () => {
      const { container } = setup(
        untyped({
          iconRight: <span className="custom-right">R</span>,
          iconRightSize: 'small',
          hasIconsRight: true,
        })
      );
      expect(container.querySelector('.custom-right')).toBeNull();
      expect(warnSpy.mock.calls[0][0]).toContain(
        '<PasswordInput iconRight iconRightSize hasIconsRight> draws no right icon'
      );
      expect(warnSpy.mock.calls[0][0]).toContain('Leave them out');
    });
  });

  describe('Field and Control', () => {
    it('wraps itself in a Field and a Control, with a message', () => {
      const { container } = setup({
        message: 'At least 15 characters.',
        messageColor: 'info',
        fieldClassName: 'custom-field',
        controlClassName: 'custom-control',
        controlSize: 'small',
        isExpanded: true,
        horizontal: true,
        labelSize: 'small',
        labelProps: { className: 'custom-label' },
      });
      const fieldEl = container.querySelector('.field.custom-field');
      expect(
        fieldEl?.querySelector(
          '.control.custom-control > .passwordinput-container'
        )
      ).not.toBeNull();
      expect(container.querySelector('.control')).toHaveClass(
        'is-expanded',
        'is-small'
      );
      expect(container.querySelector('.label')).toHaveClass('custom-label');
      expect(screen.getByText('At least 15 characters.')).toHaveClass(
        'help',
        'is-info'
      );
    });

    it('takes a left icon on its Control', () => {
      const { container } = setup({
        iconLeftName: 'lock',
        iconLeftSize: 'small',
      });
      expect(container.querySelector('.control')).toHaveClass('has-icons-left');
      expect(container.querySelector('.icon.is-left')).not.toBeNull();

      const { container: node } = render(
        <PasswordInput
          aria-label="Other"
          iconLeft={<span className="custom-left">L</span>}
          hasIconsLeft
        />
      );
      expect(node.querySelector('.custom-left')).not.toBeNull();
    });

    it('is named by a Field around it, and renders none of its own', () => {
      const { container } = render(
        <Field label="Password">
          <PasswordInput />
        </Field>
      );
      expect(input()).toHaveClass('input');
      expect(container.querySelectorAll('.field')).toHaveLength(1);
    });

    it('renders no Control inside one, keeping the message', () => {
      const { container } = render(
        <Control>
          <PasswordInput aria-label="Password" message="Help" />
        </Control>
      );
      expect(container.querySelectorAll('.control')).toHaveLength(1);
      expect(screen.getByText('Help')).toHaveClass('help');
    });

    it('uses an id of its own', () => {
      setup({ id: 'pw' });
      expect(input()).toHaveAttribute('id', 'pw');
    });

    it('lets PasswordInputBase take a Field label', () => {
      render(
        <Field label="Password">
          <Control>
            <PasswordInputBase />
          </Control>
        </Field>
      );
      expect(input()).toHaveClass('input');
    });
  });

  describe('Server rendering', () => {
    function Fields() {
      const [value, setValue] = useState('hunter2');
      return (
        <>
          <PasswordInput
            label="Password"
            value={value}
            onChange={event => setValue(event.target.value)}
          />
          <PasswordInput label="Shown" defaultVisible defaultValue="open" />
        </>
      );
    }

    it('renders the type it starts with on the server', () => {
      const html = renderToString(<Fields />);
      expect(html).toContain('type="password"');
      expect(html).toContain('type="text"');
    });

    it('hydrates without a mismatch, keeping the values', async () => {
      const container = document.createElement('div');
      container.innerHTML = renderToString(<Fields />);
      document.body.appendChild(container);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let unmountRoot = () => {};
      try {
        await act(async () => {
          const root = hydrateRoot(container, <Fields />);
          unmountRoot = () => root.unmount();
        });
        expect(errorSpy).not.toHaveBeenCalled();
        expect(input()).toHaveValue('hunter2');
        expect(screen.getByLabelText('Shown')).toHaveValue('open');
      } finally {
        errorSpy.mockRestore();
        await act(async () => unmountRoot());
        document.body.removeChild(container);
      }
    });
  });

  describe('Class prefix', () => {
    it.each(['icon', 'text'] as const)(
      'prefixes every class under ConfigProvider classPrefix (%s)',
      variant => {
        const { container } = render(
          <ConfigProvider classPrefix="bestax-">
            <PasswordInput
              label="Password"
              size="small"
              variant={variant}
              iconLeftName="lock"
              message="Help"
              messageColor="info"
            />
          </ConfigProvider>
        );
        const classes = Array.from(container.querySelectorAll('[class]'))
          .flatMap(el => Array.from(el.classList))
          .filter(name => !name.startsWith('bestax-'))
          // Font Awesome's own classes, which no prefix reaches.
          .filter(name => !/^fa/.test(name));
        expect(classes).toEqual([]);
        const box = container.querySelector('.bestax-passwordinput-container');
        expect(box?.lastElementChild).toHaveClass(
          'bestax-passwordinput-toggle'
        );
        expect(box?.classList.contains('bestax-is-text')).toBe(
          variant === 'text'
        );
      }
    );
  });
});
