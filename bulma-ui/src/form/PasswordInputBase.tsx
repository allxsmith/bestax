import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { warnOnce } from '../helpers/devWarnings';
import { useBulmaClasses } from '../helpers/useBulmaClasses';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
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
 * Control.
 *
 * @helperProps Helper props go on the `.passwordinput-container` `<div>`, with
 * `className` and `style`, so they move and size the field and its toggle
 * together. The other attributes go on the `<input>`.
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
   * form submits or resets, or the page is left, which it also is on the way
   * into the back-forward cache. React renders those hides at once, a state
   * update you make here included, so the form reads a password field. One
   * that fires while React is rendering or committing, which includes your
   * `useEffect` and `useLayoutEffect` callbacks, such as a `requestSubmit()`
   * from an effect, can't render there, and lands just after the form is
   * read: hide the password first, or submit from an event handler.
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
    color,
    className,
    style,
    ...others
  } = props;
  // Helper props, `className` and `style` go on the container, so a margin,
  // a width or a display moves the field and its toggle together. `color`
  // stays with the input, whose border it colors.
  const { bulmaHelperClasses, rest } = useBulmaClasses(others);
  const disabled = useFieldsetDisabled(disabledProp);
  // The toggle gives way to the loading spinner of a Control this sits in,
  // which takes its slot, and the field hides the password meanwhile, as
  // there's no button to hide it with.
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
  // Whether the field shows now: as last reported, until `visible` changes.
  // Two hide events before React renders, as from an effect, or a caller
  // holding `visible` that keeps it `true`, report `false` once.
  const shownRef = useRef(visible);
  useClientLayoutEffect(() => {
    shownRef.current = visible;
  }, [visible]);
  const setVisible = (next: boolean) => {
    shownRef.current = next;
    if (!isControlled) setInternalVisible(next);
    onVisibleChange?.(next);
  };

  const inputRef = useRef<HTMLInputElement | null>(null);
  // A caller's callback ref may return a cleanup, as React 19 allows. It's
  // held here and run on detach in place of a call with `null`, on React 18
  // as well, since this ref is the one React calls.
  const refCleanup = useRef<(() => void) | null>(null);
  const combinedRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') {
        if (node === null) {
          const cleanup = refCleanup.current;
          refCleanup.current = null;
          if (cleanup) cleanup();
          else ref(null);
          return;
        }
        const cleanup: unknown = ref(node);
        refCleanup.current =
          typeof cleanup === 'function' ? (cleanup as () => void) : null;
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  // A toggle with focus that leaves while the input stays, as it does when a
  // Control starts loading, hands focus to the input rather than dropping it
  // to the page. React lets go of the toggle before it takes it out of the
  // page, so the toggle still has focus here; when the whole field unmounts,
  // React has let go of the input first.
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const setToggle = useCallback((node: HTMLButtonElement | null) => {
    // React lets go only of a toggle it handed over, so there is one.
    const leaving = toggleRef.current as HTMLButtonElement;
    toggleRef.current = node;
    if (node) return;
    const root = leaving.getRootNode() as Document | ShadowRoot;
    if (root.activeElement === leaving) inputRef.current?.focus();
  }, []);

  // Hides the password again: reports `false`, and sets its own state when it
  // holds it. Inside `flushSync`, React renders that, a caller's own state
  // update included, before the listener returns, so the browser reads the
  // form, or saves the page's form state, from a password field. The
  // component never sets the field's type itself, so a caller holding
  // `visible` that keeps it `true` keeps the field shown. The one catch: an
  // event fired while React is rendering or committing, which includes
  // `useEffect` and `useLayoutEffect` callbacks (a `requestSubmit()` from
  // an effect), can't flush there, so React warns in development and the
  // hide lands after the form is read. Only the listeners below call it,
  // while the input is mounted.
  const hideRef = useLatestRef(() => {
    if (!shownRef.current) return;
    // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- the form is read, or the page saved, before React would render this on its own
    flushSync(() => setVisible(false));
  });

  // When the form it belongs to submits or resets: whichever form that is
  // when it happens, so a form mounted after the field, or mounted again,
  // counts. Neither event leaves a shadow root, so it listens on the field's
  // own root, the document or the shadow root it renders in, and in the
  // capture phase, before any listener on the form.
  useEffect(() => {
    const input = inputRef.current as HTMLInputElement;
    const root = input.getRootNode();
    const onFormEvent = (event: Event) => {
      if (event.target === input.form) hideRef.current();
    };
    root.addEventListener('submit', onFormEvent, true);
    root.addEventListener('reset', onFormEvent, true);
    return () => {
      root.removeEventListener('submit', onFormEvent, true);
      root.removeEventListener('reset', onFormEvent, true);
    };
  }, [hideRef]);

  // When the page is left, so the history the browser keeps of the form
  // holds a password field rather than text. It fires on the way into the
  // back-forward cache too, so a page coming back from there is hidden.
  useEffect(() => {
    const onPageHide = () => hideRef.current();
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
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
    <div
      className={classNames(containerClass, bulmaHelperClasses, className)}
      style={style}
    >
      <InputBase
        ref={combinedRef}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
        autoCorrect={autoCorrect}
        autoCapitalize={autoCapitalize}
        disabled={disabled}
        color={color}
        {...rest}
        type={visible && !controlLoading ? 'text' : 'password'}
      />
      {!controlLoading && (
        <button
          ref={setToggle}
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
