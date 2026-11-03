// INTERNAL: deliberately not exported from src/index.ts. The field a picker
// of tree data opens its panel from: TreeSelect's, and Cascader's after it.

import React, { useCallback, useId, useRef } from 'react';
import { classNames, usePrefixedClassNames } from '../../helpers/classNames';
import {
  useBulmaClasses,
  type BulmaClassesProps,
} from '../../helpers/useBulmaClasses';
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
   * Escape, Alt+Up, a press outside, Tab out of the panel and the clear
   * button.
   */
  onOpenChange: (open: boolean) => void;
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
  position?: PickerPosition;
  appendToBody?: boolean;
  /** The field's own ref, which a picker focuses after a tag's button. */
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  /** The ref the picker's caller gave, for the field. */
  forwardedRef: React.ForwardedRef<HTMLInputElement>;
  /** The ids of the tags that describe the field. */
  describedBy?: string;
  /** Shown under the field, inside its Field: the tags. */
  below?: React.ReactNode;
  /** Selects what takes focus as the panel opens. */
  initialFocusSelector?: string;
  /** The panel's content, handed the panel's name. */
  children: (name: PanelName) => React.ReactNode;
}

/** A field hidden behind the real one, so the browser's `required` check reads it. */
const requiredProxyStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  bottom: 0,
  width: '100%',
  height: '1px',
  margin: 0,
  padding: 0,
  border: 0,
  opacity: 0,
  pointerEvents: 'none',
};

const ignoreChange = () => {};

/**
 * A read-only `role="combobox"` field, wired as the date pickers' are, that
 * opens a `PickerPopover` dialog panel: in a `Field` of its own unless one is
 * around it, with a chevron at its inline end, a clear button, the hidden
 * inputs for `name` and what the browser's `required` check reads. A click,
 * Enter, Space, Down or Alt+Down opens the panel. Escape and Alt+Up close it
 * and put focus back on the field, and so does Shift+Tab past its first
 * stop. Tab past its last stop closes it and goes on from the field, and a
 * press outside closes it where the press put focus.
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
  position = 'bottom-left',
  appendToBody = false,
  inputRef,
  forwardedRef,
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

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [inputRef, forwardedRef]
  );

  // The panel is named as the field is, unless it's given a name of its own.
  const panelName: PanelName = chooseLabel
    ? { 'aria-label': chooseLabel }
    : ariaLabel
      ? { 'aria-label': ariaLabel }
      : ariaLabelledBy
        ? { 'aria-labelledby': ariaLabelledBy }
        : labelId
          ? { 'aria-labelledby': labelId }
          : {};

  const showClear = !!clearable && hasValue && !disabled;
  const rootClasses = usePrefixedClassNames(rootClass, {
    'is-disabled': disabled,
    'has-clear': showClear,
  });
  const inputClass = usePrefixedClassNames('input', {
    [`is-${color}`]: !!color,
    [`is-${size}`]: !!size,
    'is-rounded': !!isRounded,
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

  const field = (
    <>
      <input
        ref={setInputRef}
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
        aria-describedby={
          [ariaDescribedBy, describedBy].filter(Boolean).join(' ') || undefined
        }
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
          tabIndex={-1}
          aria-hidden="true"
          required
          value={hasValue ? 'picked' : ''}
          onChange={ignoreChange}
          form={form}
          disabled={disabled}
          // The browser focuses it to show why the form didn't submit.
          onFocus={() => inputRef.current?.focus()}
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
        onTabOut={event => {
          // Shift+Tab goes back to the field, which comes before the panel.
          // Tab goes on from the field, as if the panel weren't there.
          if (event.shiftKey) event.preventDefault();
          else inputRef.current?.focus();
          onOpenChange(false);
        }}
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
