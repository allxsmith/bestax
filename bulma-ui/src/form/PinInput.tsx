import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  classNames,
  prefixedClassNames,
  usePrefixedClassNames,
} from '../helpers/classNames';
import { useClassPrefix } from '../helpers/Config';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { getActiveElementInTree } from '../helpers/shadowDom';
import {
  useInsideField,
  useInsideControl,
  rendersOwnField,
  rendersOwnControl,
} from './FormContext';
import { Field } from './Field';
import { Control } from './Control';
import { FormFieldProps } from './fieldProps';
import { useAutoLabelId } from './useAutoLabelId';

/**
 * What a PinInput takes: `'number'` keeps digits only, and `'alphanumeric'`
 * keeps the letters A to Z, in either case, and digits. A digit from any
 * script, such as an Arabic-Indic `٣` or a Persian `۳`, is kept as its ASCII
 * digit, `3`.
 */
export type PinInputType = 'number' | 'alphanumeric';

/**
 * Props for the PinInput component.
 * Inside an existing `Control` it renders no `Control` of its own. Inside an
 * outer `Field`, or a `Control` with no `Field` around it, it renders no
 * `Field` of its own either. The exception is `label`, `message`, `horizontal`
 * or `fieldClassName` in that bare `Control`: it keeps a `Field` for them,
 * nested in the `.control`, and warns in development. Wrap the `Control` in a
 * `Field` instead, and set the `label`, `horizontal` and class name on that
 * `Field`.
 * Every other prop goes to the `<input>` that holds the code, except
 * `className` and the helper props, which go to the row of boxes.
 * @helperProps Helper props go on the `.pin-input` `<div>`, the row of boxes,
 * with `className`. The other attributes go on the `<input>` that holds the
 * code.
 * @extraProp {string} [name] - Form field name, on the input, so a form submits the code under it.
 * @extraProp {string} [autoComplete="one-time-code"] - Lets the browser offer a code it received by text message, and tells a password manager this is a one-time code.
 * @extraProp {string} [inputMode] - The keyboard a phone shows: `"numeric"` with `type="number"`, `"text"` with `type="alphanumeric"`.
 * @extraProp {string} [pattern] - Exactly `length` of what `type` takes, `[0-9]{6}` by default, so a form with `required` won't submit a partial code. Any non-empty partial code fails it, `required` or not.
 * @extraProp {string} [className] - Additional CSS classes for the row of boxes.
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Ref forwarded to the input that holds the code.
 */
export interface PinInputProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      | 'color'
      | 'size'
      | 'type'
      | 'value'
      | 'defaultValue'
      | 'onChange'
      | 'maxLength'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'>,
    FormFieldProps {
  /** Field label. Automatically associated with the input that holds the code via `htmlFor`, so a screen reader announces one field under this name. Uses your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`) and you set no `id` here. */
  label?: React.ReactNode;
  /** Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then). */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  /** Applied to the input that holds the code (the labellable control), not the row of boxes. */
  id?: string;
  /** How many characters the code has. Each gets a box, and it is the input's `maxLength`. */
  length?: number;
  /** The code (controlled). Only its first `length` characters are shown and submitted. */
  value?: string;
  /** The code to start with (uncontrolled). Only its first `length` characters are kept. */
  defaultValue?: string;
  /**
   * What the code takes. A digit from any script, such as an Arabic-Indic or
   * a Persian one, goes in as its ASCII digit, so the code reaches
   * `onChange`, `onComplete` and the form as `0` to `9`. Anything else typed
   * or pasted is dropped, and the caret stays where it was. The input stays a
   * text field either way, so a code keeps its leading zeros.
   */
  type?: PinInputType;
  /**
   * Shows a dot in each filled box in place of its character, and makes the
   * input a password field, so a screen reader doesn't read the code out
   * either.
   */
  isMasked?: boolean;
  /** Bulma color for the boxes, the colors an `Input` takes. */
  color?:
    | 'primary'
    | 'link'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'black'
    | 'dark'
    | 'light'
    | 'white';
  /** Size of the boxes. */
  size?: 'small' | 'medium' | 'large';
  /** Round boxes. */
  isRounded?: boolean;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /**
   * Called with the code each time it changes. A paste replaces the whole
   * code with what was pasted, kept to what `type` takes and cut to `length`,
   * and a paste with nothing the code takes changes nothing.
   */
  onChange?: (value: string) => void;
  /**
   * Called with the code when a change makes it `length` characters long,
   * such as typing the last character, a paste or autofill. It fires once for
   * each change that fills the last box with a new code, and never on a
   * render. A `value` you set yourself doesn't call it.
   */
  onComplete?: (value: string) => void;
}

type Selection = readonly [start: number, end: number];

/** What a masked box shows for its character, a filled circle. */
const MASK = '\u25CF';

/**
 * `text` with each decimal digit, in any script, turned into its ASCII digit:
 * `١٢٣` and `۱۲۳` become `123`. Unicode assigns decimal digits in runs of ten,
 * from 0 to 9, so a digit's value is how far it is from the start of its run,
 * modulo ten for runs that sit next to each other.
 */
const toAsciiDigits = (text: string) =>
  text.replace(/\p{Nd}/gu, digit => {
    const point = digit.codePointAt(0)!;
    let start = point;
    while (/\p{Nd}/u.test(String.fromCodePoint(start - 1))) start--;
    return String((point - start) % 10);
  });

/**
 * The `PinInput` component is a field for a short code, such as a one-time
 * code or a PIN, drawn as a row of boxes with one character in each.
 *
 * The code lives in one real `<input>` that lies over the boxes, so it is
 * one field to a screen reader, and paste, autofill from a text message and
 * password managers work on it as they do on any input. The boxes draw what
 * it holds, and the box at the caret, or every box in a selection, shows
 * Bulma's focus look.
 *
 * @function
 * @param {PinInputProps} props - Props for the PinInput component.
 * @returns {JSX.Element} The rendered code field.
 *
 * @example
 * <PinInput
 *   label="Verification code"
 *   value={code}
 *   onChange={setCode}
 *   onComplete={verify}
 * />
 */
export const PinInput = forwardRef<HTMLInputElement, PinInputProps>(
  (
    {
      // Field props
      label,
      labelSize,
      labelProps,
      horizontal,
      message,
      messageColor,
      fieldClassName,
      length = 6,
      value: controlledValue,
      defaultValue = '',
      type = 'number',
      isMasked = false,
      color,
      size,
      isRounded = false,
      disabled = false,
      onChange,
      onComplete,
      onPaste,
      onFocus,
      onBlur,
      className,
      ...props
    },
    ref
  ) => {
    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const ownField = rendersOwnField('PinInput', {
      insideField,
      insideControl,
      label,
      message,
      horizontal,
      fieldClassName,
    });
    const ownControl = rendersOwnControl('PinInput', { insideControl });
    const { controlId, fieldLabelProps } = useAutoLabelId({
      label,
      id: props.id,
      labelProps,
      rendersLabel: ownField,
    });
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const classPrefix = useClassPrefix();

    const [internalValue, setInternalValue] = useState(defaultValue);
    // Cut to `length`, so the boxes, the input and the form all hold the same
    // code.
    const code = (
      controlledValue !== undefined ? controlledValue : internalValue
    ).slice(0, length);

    const allowed = type === 'alphanumeric' ? '[0-9A-Za-z]' : '[0-9]';
    /** The characters of `text` the code takes, digits in ASCII, cut to `length`. */
    const keep = (text: string) =>
      (toAsciiDigits(text).match(new RegExp(allowed, 'g')) ?? [])
        .join('')
        .slice(0, length);

    const commit = (next: string) => {
      if (next === code) return;
      if (controlledValue === undefined) setInternalValue(next);
      onChange?.(next);
      if (next.length === length) onComplete?.(next);
    };

    const inputRef = useRef<HTMLInputElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') return ref(node);
        if (ref) ref.current = node;
      },
      [ref]
    );

    // The input's selection while it has focus, which the boxes draw.
    const [selection, setSelection] = useState<Selection | null>(null);
    const follow = useCallback(() => {
      const input = inputRef.current!;
      const next: Selection | null =
        getActiveElementInTree(input) === input
          ? [input.selectionStart!, input.selectionEnd!]
          : null;
      setSelection(prev =>
        prev?.[0] === next?.[0] && prev?.[1] === next?.[1] ? prev : next
      );
    }, []);
    // A new code moves the caret, and so can a value set from outside.
    useClientLayoutEffect(follow, [code, follow]);
    // React's `onSelect` never fires inside a shadow root, so the boxes
    // follow the browser's own `selectionchange`. A caret that moves fires it
    // at the input, and it bubbles to the document, but in a shadow root some
    // browsers fire it at the document alone and others at the input alone,
    // so both are followed.
    useEffect(() => {
      const input = inputRef.current!;
      const doc = input.ownerDocument;
      input.addEventListener('selectionchange', follow);
      doc.addEventListener('selectionchange', follow);
      return () => {
        input.removeEventListener('selectionchange', follow);
        doc.removeEventListener('selectionchange', follow);
      };
    }, [follow]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const typed = input.value;
      const next = keep(typed);
      if (next !== typed) {
        // Drop what the code doesn't take before React sees the value, so
        // the caret stays where it was rather than jumping to the end.
        const caret = keep(typed.slice(0, input.selectionStart!)).length;
        input.value = next;
        input.setSelectionRange(caret, caret);
      }
      commit(next);
    };

    // The browser cuts a paste to `maxLength` before anything else sees it,
    // so a code pasted as "123 456" would lose its last digit. What the code
    // takes is kept first, and it replaces the whole code, since what you
    // paste into a code field is the code.
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      onPaste?.(e);
      if (e.defaultPrevented) return;
      e.preventDefault();
      const pasted = keep(e.clipboardData.getData('text'));
      if (pasted && !e.currentTarget.readOnly) commit(pasted);
    };

    const rootClass = classNames(
      usePrefixedClassNames('pin-input'),
      bulmaHelperClasses,
      className
    );
    const fieldClass = usePrefixedClassNames('pin-input-field');
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    // The boxes the selection covers: the one at a caret, or every selected
    // one. A caret after the last character marks the last box.
    const [start, end] = selection ?? [-1, -1];
    const first = Math.min(start, length - 1);
    const last = Math.max(first + 1, Math.min(end, length));
    const boxes = Array.from({ length }, (_, i) => {
      const char = code[i];
      const active = i >= first && i < last;
      return (
        <div
          key={i}
          aria-hidden="true"
          className={prefixedClassNames(classPrefix, 'input', 'pin-input-box', {
            [`is-${color}`]: !!color,
            [`is-${size}`]: !!size,
            'is-rounded': isRounded,
            'is-focused': active,
            'has-caret': active && start === end && !char,
            'is-disabled': disabled,
          })}
        >
          {char && (isMasked ? MASK : char)}
        </div>
      );
    });

    // Left to right on a right-to-left page too: a code is written that way,
    // so its first character stays in the first box on the left, and the
    // arrow keys move the caret the way the boxes run.
    let content = (
      <div className={rootClass} dir="ltr">
        <input
          ref={setRefs}
          className={fieldClass}
          type={isMasked ? 'password' : 'text'}
          inputMode={type === 'alphanumeric' ? 'text' : 'numeric'}
          autoComplete="one-time-code"
          autoCorrect="off"
          spellCheck={false}
          // A partial code fails constraint validation. `minLength` would
          // say so only after a keystroke, never after a paste or a filtered
          // character, which set the value from script.
          pattern={`${allowed}{${length}}`}
          {...rest}
          value={code}
          maxLength={length}
          disabled={disabled}
          onChange={handleChange}
          onPaste={handlePaste}
          onFocus={e => {
            follow();
            onFocus?.(e);
          }}
          onBlur={e => {
            setSelection(null);
            onBlur?.(e);
          }}
          // After the spread: an undefined `id` key in rest would wipe it.
          id={controlId}
        />
        {boxes}
      </div>
    );

    if (ownControl) {
      content = <Control>{content}</Control>;
    }

    const messageEl = message ? <p className={helpClass}>{message}</p> : null;

    if (ownField) {
      return (
        <Field
          label={label}
          labelSize={labelSize}
          labelProps={fieldLabelProps}
          horizontal={horizontal}
          className={fieldClassName}
        >
          {content}
          {messageEl}
        </Field>
      );
    }

    return (
      <>
        {content}
        {messageEl}
      </>
    );
  }
);

PinInput.displayName = 'PinInput';

export default PinInput;
