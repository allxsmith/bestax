import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { usePrefixedClassNames } from '../helpers/classNames';
import { warnOnce } from '../helpers/devWarnings';
import { useLatestRef } from '../helpers/useLatestRef';
import { InputBase, InputBaseProps } from './InputBase';
import { useControlLoading } from './controlLoading';
import { useFieldsetDisabled } from './FormContext';

/** How PasswordInput's visibility toggle draws itself. */
export type PasswordInputVariant = 'icon' | 'text';

/** The strings PasswordInput's toggle shows and announces, for translating. */
export interface PasswordInputLabels {
  /**
   * The toggle's name. With the `icon` variant it's the name in both states,
   * and `aria-pressed` says whether the password shows. With `text`, it's the
   * name while the password is hidden, and it has to contain `show`, the word
   * on the button.
   * @defaultValue 'Show password'
   */
  showPassword?: string;
  /**
   * The `text` variant's name while the password shows. It has to contain
   * `hide`.
   * @defaultValue 'Hide password'
   */
  hidePassword?: string;
  /**
   * The `text` variant's word while the password is hidden.
   * @defaultValue 'Show'
   */
  show?: string;
  /**
   * The `text` variant's word while the password shows.
   * @defaultValue 'Hide'
   */
  hide?: string;
}

/**
 * Props for PasswordInputBase, the input and its toggle without a Field or a
 * Control. The helper props, the other input attributes and the `ref` land on
 * the `<input>`.
 *
 * @extraProp {string} [autoComplete="current-password"] - Tells the browser and password managers this is an existing password. Pass `"new-password"` where the user makes one up, on a sign-up or change-password form.
 * @extraProp {boolean} [spellCheck=false] - Off, so a browser's spellcheck never sees the password once it shows.
 * @extraProp {string} [autoCorrect="off"] - Off, so a phone's keyboard doesn't change what's typed.
 * @extraProp {string} [autoCapitalize="none"] - Off, so a phone's keyboard doesn't capitalize the first letter.
 * @extraProp {string} [value] - The password, controlled. React writes a controlled input's value into its `value` attribute, as it does on any input, so the password sits in the page's markup. Uncontrolled, read with `FormData`, the field never puts what's typed there.
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Ref forwarded to the `<input>`.
 */
export interface PasswordInputBaseProps extends Omit<InputBaseProps, 'type'> {
  /**
   * Whether the password shows, when you hold the state. Setting it makes
   * the visibility controlled: the toggle only calls `onVisibleChange`, and
   * so does hiding again on its own. Apply that `false` and the field is a
   * password field by the time the form reads it; keep `visible` true and
   * the field stays shown.
   */
  visible?: boolean;
  /**
   * Whether the password shows at first, when the input holds its own state.
   * @defaultValue false
   */
  defaultVisible?: boolean;
  /**
   * Called with the new visibility on each toggle, and with `false` when the
   * form submits or resets, when the page is left, and when it comes back
   * from the back-forward cache. React renders those hides at once, a state
   * update you make here included, so the form reads a password field. One
   * that fires while React is rendering or running layout effects, such as a
   * `requestSubmit()` from a layout effect, can't render there, and lands
   * just after.
   */
  onVisibleChange?: (visible: boolean) => void;
  /**
   * How the toggle draws itself: an eye icon with a fixed name and
   * `aria-pressed`, or the words "Show" and "Hide" with a name that follows
   * them.
   * @defaultValue 'icon'
   */
  variant?: PasswordInputVariant;
  /** Translations for the toggle. */
  labels?: PasswordInputLabels;
}

/** An eye, drawn while the password is hidden. */
const EyeIcon = () => (
  <svg viewBox="0 0 16 16" width="1.25em" height="1.25em" aria-hidden="true">
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 8s2.5-4.5 6.5-4.5 6.5 4.5 6.5 4.5-2.5 4.5-6.5 4.5S1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2" />
    </g>
  </svg>
);

/** The eye crossed out, drawn while the password shows. */
const EyeOffIcon = () => (
  <svg viewBox="0 0 16 16" width="1.25em" height="1.25em" aria-hidden="true">
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 8s2.5-4.5 6.5-4.5 6.5 4.5 6.5 4.5-2.5 4.5-6.5 4.5S1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2" />
      <path d="M2.5 2.5l11 11" />
    </g>
  </svg>
);

/**
 * Warns in development when the `text` toggle's name doesn't contain the
 * word on it, which a voice control user says to press it.
 */
const checkLabelInName = (name: string, word: string) => {
  if (name.toLocaleLowerCase().includes(word.toLocaleLowerCase())) return;
  warnOnce(
    `PasswordInput:label-in-name:${name}:${word}`,
    `[bestax-bulma] A PasswordInput with variant="text" is named ` +
      `"${name}" while its button says "${word}". A voice control user ` +
      `says the word they see, so the name has to contain it (WCAG 2.5.3, ` +
      `Label in Name). Set labels so each name contains its word.`
  );
};

/**
 * The raw PasswordInput: a password field with a button inside it that shows what was typed, without Field/Control wrapping.
 *
 * Use `PasswordInput` for the convenience wrapper.
 *
 * @function
 * @param {PasswordInputBaseProps} props - Props for PasswordInputBase.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the `<input>`.
 * @returns {JSX.Element} The input and its toggle, in a container.
 */
export const PasswordInputBase = forwardRef<
  HTMLInputElement,
  PasswordInputBaseProps
>((props, ref) => {
  const {
    visible: visibleProp,
    defaultVisible = false,
    onVisibleChange,
    variant = 'icon',
    labels,
    autoComplete = 'current-password',
    spellCheck = false,
    autoCorrect = 'off',
    autoCapitalize = 'none',
    disabled: disabledProp,
    ...rest
  } = props;
  const disabled = useFieldsetDisabled(disabledProp);
  // The toggle gives way to the loading spinner of a Control this sits in,
  // which shares its edge.
  const controlLoading = useControlLoading();
  const isText = variant === 'text';

  const showPassword = labels?.showPassword || 'Show password';
  const hidePassword = labels?.hidePassword || 'Hide password';
  const show = labels?.show || 'Show';
  const hide = labels?.hide || 'Hide';
  if (isText) {
    checkLabelInName(showPassword, show);
    checkLabelInName(hidePassword, hide);
  }

  const isControlled = visibleProp !== undefined;
  const [internalVisible, setInternalVisible] = useState(defaultVisible);
  const visible = isControlled ? visibleProp : internalVisible;
  const setVisible = (next: boolean) => {
    if (!isControlled) setInternalVisible(next);
    onVisibleChange?.(next);
  };

  const inputRef = useRef<HTMLInputElement | null>(null);
  const combinedRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  // Hides the password again: reports `false`, and sets its own state when it
  // holds it. Inside `flushSync`, React renders that, a caller's own state
  // update included, before the listener returns, so the browser reads the
  // form, or saves the page's form state, from a password field. The
  // component never sets the field's type itself, so a caller holding
  // `visible` that keeps it `true` keeps the field shown. The one catch: an
  // event fired while React is rendering or running layout effects (a
  // `requestSubmit()` from a layout effect) can't flush there, so React warns
  // in development and the hide lands after the form is read. Only the
  // listeners below call it, while the input is mounted.
  const hideRef = useLatestRef(() => {
    if (!visible) return;
    // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- the form is read, or the page saved, before React would render this on its own
    flushSync(() => setVisible(false));
  });

  // When the form it belongs to submits or resets.
  const formAttribute = rest.form;
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const hideAgain = () => hideRef.current();
    form.addEventListener('submit', hideAgain);
    form.addEventListener('reset', hideAgain);
    return () => {
      form.removeEventListener('submit', hideAgain);
      form.removeEventListener('reset', hideAgain);
    };
  }, [formAttribute, hideRef]);

  // When the page is left, so the history the browser keeps of the form
  // holds a password field rather than text, and when it comes back from the
  // back-forward cache, as it was left.
  useEffect(() => {
    const onPageHide = () => hideRef.current();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) hideRef.current();
    };
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [hideRef]);

  const containerClass = usePrefixedClassNames('passwordinput-container', {
    'is-text': isText,
  });
  const toggleClass = usePrefixedClassNames('passwordinput-toggle');

  // The icon keeps one name and reports its state; the words change, so
  // the name follows them and there's no state to report.
  const toggleName = isText && visible ? hidePassword : showPassword;
  const glyph = visible ? <EyeOffIcon /> : <EyeIcon />;

  return (
    <div className={containerClass}>
      <InputBase
        ref={combinedRef}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
        autoCorrect={autoCorrect}
        autoCapitalize={autoCapitalize}
        disabled={disabled}
        {...rest}
        type={visible ? 'text' : 'password'}
      />
      {!controlLoading && (
        <button
          type="button"
          className={toggleClass}
          aria-label={toggleName}
          aria-pressed={isText ? undefined : visible}
          disabled={disabled}
          // A pointer press leaves focus, and the caret, in the input.
          onMouseDown={event => event.preventDefault()}
          onClick={() => setVisible(!visible)}
        >
          {isText ? (visible ? hide : show) : glyph}
        </button>
      )}
    </div>
  );
});

PasswordInputBase.displayName = 'PasswordInputBase';

export default PasswordInputBase;
