// INTERNAL: deliberately not exported from src/index.ts. The field a picker
// of tree data opens its panel from: TreeSelect's, and Cascader's after it.

import React, { useEffect, useId, useRef, useState } from 'react';
import { classNames, usePrefixedClassNames } from '../../helpers/classNames';
import {
  useBulmaClasses,
  type BulmaClassesProps,
} from '../../helpers/useBulmaClasses';
import { useLatestRef } from '../../helpers/useLatestRef';
import { Delete } from '../../elements/Delete';
import { Icon } from '../../elements/Icon';
import { Control } from '../Control';
import { Field } from '../Field';
import type { FormFieldProps } from '../fieldProps';
import {
  rendersOwnField,
  useInsideControl,
  useInsideField,
} from '../FormContext';
import { useAutoLabelId } from '../useAutoLabelId';
import { PickerPopover } from '../_pickerInternals/PickerPopover';
import {
  isPopoverToggleKey,
  type PickerPosition,
} from '../_pickerInternals/pickerTypes';
import { usePickerLocaleScope } from '../_pickerInternals/useLocaleDefaults';
import { HiddenValues } from './ValueTags';

/** What names the panel, for what's in it to take as well. */
export interface PanelName {
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/** Props for the field a tree picker opens its panel from. */
export interface DialogSelectProps
  extends
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'color' | 'onChange' | 'defaultValue' | 'children'
    >,
    Omit<BulmaClassesProps, 'color'>,
    FormFieldProps {
  /** The component's name, for development warnings. */
  component: string;
  /** The root's own class, before any prefix, such as `tree-select`. */
  rootClass: string;
  /** The panel's own class, beside `picker-popover`, before any prefix. */
  panelClass: string;
  /** What the field shows. */
  text: string;
  /** What `name` posts, a hidden input each. */
  values: string[];
  /** Something is picked: `required` is met, and the clear button shows. */
  hasValue: boolean;
  /** Whether the panel is open. */
  open: boolean;
  /**
   * Asked to open or close the panel: by a click on the field, its keys,
   * Escape, Alt+Up, a press outside and the clear button.
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Called once a reset of the field's form has gone ahead, so the picker
   * can put its value back.
   */
  onFormReset: () => void;
  /**
   * A printable key on the field. Returns whether it used the key, as a
   * search box opening with it does.
   */
  onPrintableKey?: (key: string) => boolean;
  /** Empties the value, from the clear button. */
  onClear: () => void;
  /** Shows the clear button while something is picked. */
  clearable?: boolean;
  /** Names the clear button. */
  clearLabel: string;
  /** Names the panel in place of the field's label. */
  chooseLabel?: string;
  placeholder?: string;
  name?: string;
  form?: string;
  required?: boolean;
  /** Already including a disabled `Fieldset` around it. */
  disabled: boolean;
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isRounded?: boolean;
  /** Left out, the panel lines up with the field's start edge. */
  position?: PickerPosition;
  appendToBody?: boolean;
  /** Holds the field, which focus goes back to. */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /**
   * Set on the field: the picker's callback that fills `inputRef` and the
   * ref its caller gave.
   */
  fieldRef: React.RefCallback<HTMLInputElement>;
  /** The ids of the tags that describe the field. */
  describedBy?: string;
  /** Shown under the field, inside its Field: the tags. */
  below?: React.ReactNode;
  /** Selects what takes focus as the panel opens. */
  initialFocusSelector?: string;
  /** The panel's content, handed the panel's name. */
  children: (name: PanelName) => React.ReactNode;
}

/**
 * A field laid over the real one, unseen and letting presses through, so the
 * browser's `required` check reads it and its message points at the field.
 */
const requiredProxyStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  padding: 0,
  border: 0,
  opacity: 0,
  pointerEvents: 'none',
  // Focused, it opens no on-screen keyboard (`inputMode`), and iOS zooms
  // in on a field set under 16px. It's unseen, so the size shows nowhere.
  fontSize: '16px',
};

/** Keys pressed on their own that don't act, such as Ctrl to stop speech. */
const MODIFIER_KEYS = new Set([
  'Alt',
  'AltGraph',
  'CapsLock',
  'Control',
  'Fn',
  'Meta',
  'NumLock',
  'ScrollLock',
  'Shift',
]);

const ignoreChange = () => {};

/**
 * A read-only `role="combobox"` field, wired as the date pickers' are, that
 * opens a `PickerPopover` dialog panel: in a `Field` of its own unless one is
 * around it, with a chevron at its inline end, a clear button, the hidden
 * inputs for `name` and what the browser's `required` check reads. A click,
 * Enter, Space, Down or Alt+Down opens the panel, which holds focus, as the
 * date pickers' does: Tab and Shift+Tab wrap inside it. Escape and Alt+Up
 * close it and put focus back on the field, and a press outside closes it
 * where the press put focus.
 */
export function DialogSelect({
  component,
  rootClass,
  panelClass,
  text,
  values,
  hasValue,
  open,
  onOpenChange,
  onFormReset,
  onPrintableKey,
  onClear,
  clearable,
  clearLabel,
  chooseLabel,
  placeholder,
  name,
  form,
  required = false,
  disabled,
  color,
  size,
  isRounded,
  position,
  appendToBody = false,
  inputRef,
  fieldRef,
  describedBy,
  below,
  initialFocusSelector,
  children,
  label,
  labelSize,
  labelProps,
  horizontal,
  message,
  messageColor,
  fieldClassName,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...props
}: DialogSelectProps) {
  const insideField = useInsideField();
  const insideControl = useInsideControl();
  const ownField = rendersOwnField(component, {
    insideField,
    insideControl,
    label,
    message,
    horizontal,
    fieldClassName,
  });
  const { controlId, fieldLabelProps, labelId } = useAutoLabelId({
    label,
    id,
    labelProps,
    rendersLabel: ownField,
    needsLabelId: true,
  });
  const reactId = useId();
  const panelId = `${controlId ?? reactId}-panel`;
  const localeScope = usePickerLocaleScope(undefined, props.dir);
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const rootRef = useRef<HTMLDivElement>(null);

  // The field's name, which the panel takes too unless it's given its own.
  const fieldName: PanelName = ariaLabel
    ? { 'aria-label': ariaLabel }
    : ariaLabelledBy
      ? { 'aria-labelledby': ariaLabelledBy }
      : labelId
        ? { 'aria-labelledby': labelId }
        : {};
  const panelName: PanelName = chooseLabel
    ? { 'aria-label': chooseLabel }
    : fieldName;

  // Whether the field `required` hangs on has focus, which the browser gives
  // it when it stops a submit. Taking it away or disabling it while it has
  // focus fires no blur, so that clears it too.
  const [proxyFocused, setProxyFocused] = useState(false);
  if (proxyFocused && (!required || disabled)) setProxyFocused(false);

  const showClear = !!clearable && hasValue && !disabled;
  const rootClasses = usePrefixedClassNames(rootClass, {
    'is-disabled': disabled,
    'has-clear': showClear,
  });
  const inputClass = usePrefixedClassNames('input', {
    [`is-${color}`]: !!color,
    [`is-${size}`]: !!size,
    'is-rounded': !!isRounded,
    'is-focused': proxyFocused,
  });
  const chevronClass = usePrefixedClassNames(`${rootClass}-chevron`);
  const clearClass = usePrefixedClassNames(`${rootClass}-clear`);
  const panelClasses = usePrefixedClassNames(panelClass, {
    [`is-${size}`]: !!size,
  });
  const helpClass = usePrefixedClassNames('help', {
    [`is-${messageColor}`]: !!messageColor,
  });
  const isOpen = open && !disabled;

  // A reset of the field's form puts the value back, as it does a native
  // field's. The reset event fires before the form resets, and a listener
  // after this one can still cancel it, so the value goes back a task later,
  // and only if the reset went ahead, as File's and Dropzone's do. It's
  // heard on the field's document, or the shadow root it's in, and matched
  // to the field's form as it is then, so a form its `form` names that
  // mounts later, or a `form` that changes, is followed, and a reset
  // already under way still lands.
  const onFormResetRef = useLatestRef(onFormReset);
  useEffect(() => {
    const root = inputRef.current!.getRootNode();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onReset = (event: Event) => {
      if (event.target !== inputRef.current?.form) return;
      timer = setTimeout(() => {
        if (!event.defaultPrevented) onFormResetRef.current();
      });
    };
    root.addEventListener('reset', onReset, true);
    return () => {
      root.removeEventListener('reset', onReset, true);
      clearTimeout(timer);
    };
  }, [inputRef, onFormResetRef]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (isPopoverToggleKey(event)) {
      event.preventDefault();
      if (event.key === 'ArrowDown') onOpenChange(true);
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'ArrowDown'
    ) {
      event.preventDefault();
      onOpenChange(true);
    } else if (
      event.key.length === 1 &&
      !event.nativeEvent.isComposing &&
      onPrintableKey?.(event.key)
    ) {
      event.preventDefault();
    }
  };

  const fieldDescription =
    [ariaDescribedBy, describedBy].filter(Boolean).join(' ') || undefined;

  const field = (
    <>
      <input
        ref={fieldRef}
        type="text"
        className={inputClass}
        id={controlId}
        readOnly
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={fieldDescription}
        aria-required={required || undefined}
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        form={form}
        // A disabled field takes no clicks.
        onClick={() => onOpenChange(!isOpen)}
        onKeyDown={handleKeyDown}
      />
      {showClear && (
        <Delete
          className={clearClass}
          size={size}
          ariaLabel={clearLabel}
          onClick={() => {
            onClear();
            onOpenChange(false);
            inputRef.current?.focus();
          }}
        />
      )}
      <span className={chevronClass} aria-hidden="true">
        <Icon name="chevron-down" size={size} />
      </span>
    </>
  );

  const root = (
    <div
      {...localeScope.rootAttrs}
      {...rest}
      ref={rootRef}
      className={classNames(rootClasses, bulmaHelperClasses, className)}
    >
      {insideControl ? field : <Control size={size}>{field}</Control>}
      {required && (
        <input
          // Focus puts it in the accessibility tree, and Chromium won't
          // leave focus hidden, so it's hidden only until it's focused, and
          // then reads as the field, shut.
          {...(proxyFocused
            ? {
                ...fieldName,
                role: 'combobox',
                'aria-haspopup': 'dialog' as const,
                'aria-expanded': false,
                'aria-describedby': fieldDescription,
              }
            : { 'aria-hidden': true })}
          tabIndex={-1}
          inputMode="none"
          required
          value={hasValue ? 'picked' : ''}
          onChange={ignoreChange}
          form={form}
          disabled={disabled}
          // When the browser stops a submit, it focuses this and shows its
          // message beside it, and every browser takes the message down as
          // this loses focus. So focus stays here, over the field, which
          // looks focused, and a press goes where it lands, as from any
          // field. The next key hands focus to the field and does there
          // what it would have. Firefox also stops taking clicks if focus
          // leaves while it's still focusing this.
          onFocus={() => setProxyFocused(true)}
          onBlur={() => setProxyFocused(false)}
          onKeyDown={event => {
            if (MODIFIER_KEYS.has(event.key)) return;
            inputRef.current?.focus();
            handleKeyDown(event);
          }}
          style={requiredProxyStyle}
        />
      )}
      <HiddenValues
        name={name}
        values={values}
        form={form}
        disabled={disabled}
      />
      <PickerPopover
        localeScope={localeScope.panel}
        isOpen={isOpen}
        onClose={() => onOpenChange(false)}
        anchorRef={rootRef}
        position={position}
        appendToBody={appendToBody}
        className={panelClasses}
        ariaLabel={panelName['aria-label']}
        ariaLabelledBy={panelName['aria-labelledby']}
        id={panelId}
        restoreFocusRef={inputRef}
        initialFocusSelector={initialFocusSelector}
        matchWidth
        followContent
      >
        {children(panelName)}
      </PickerPopover>
    </div>
  );

  const fieldElement =
    below === undefined ? (
      root
    ) : (
      <div>
        {root}
        {below}
      </div>
    );
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
        {fieldElement}
        {messageEl}
      </Field>
    );
  }
  return (
    <>
      {fieldElement}
      {messageEl}
    </>
  );
}
