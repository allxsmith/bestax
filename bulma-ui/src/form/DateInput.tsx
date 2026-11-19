import React, { forwardRef } from 'react';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { DateInputBase, DateInputBaseProps } from './DateInputBase';
import {
  useInsideField,
  useInsideControl,
  rendersOwnField,
  rendersOwnControl,
} from './FormContext';
import { useAutoLabelId, useAutoLabelledBy } from './useAutoLabelId';
import { FieldMessageIdProvider, useFieldMessage } from './useFieldMessage';
import { usePickerDirAttrs } from './_pickerInternals/useLocaleDefaults';

/**
 * Props for the DateInput convenience wrapper. Extends `DateInputBaseProps`
 * with Field-level (label, horizontal) and Control-level (icons, loading) props.
 * Inside an existing `Control` it renders no `Control` of its own, so its
 * Control-level props do nothing there and warn in development; set them on
 * that `Control` instead. In `inline` mode it renders no `Control` anywhere,
 * so they do nothing inside a `Control` or out, and warn in development
 * there too. Inside an outer `Field`, or a `Control` with no `Field` around
 * it, it renders no `Field` of its own either.
 * The exception is `label`, `message`, `horizontal` or `fieldClassName` in that
 * bare `Control`: it keeps a `Field` for them, nested in the `.control`, and
 * warns in development. Wrap the `Control` in a `Field` instead, and set the
 * `label`, `horizontal` and class name on that `Field`.
 * @extraProp {string} [name] - Form field name. The text field submits the text it displays. The native input on touch devices submits the ISO value (`YYYY-MM-DD`, or `YYYY-MM` at month granularity), and an `inline` calendar, which has no visible input, submits it from a hidden input (`YYYY-MM-DD`, `YYYY-MM` or `YYYY`).
 * @extraProp {string} [form] - Form id the input belongs to.
 * @extraProp {string} [autoComplete=off] - An autofill token for the field, such as `bday` for a date of birth, so the browser and assistive technology know what it asks for. On the text field it's `off` unless you give one, since the browser's own suggestions would cover the calendar. The native input on touch devices takes yours too, and the browser's default without one, and an `inline` calendar, with no field, takes none. A date that autofill writes commits when it reads in the token `format` (the default one when `format` is `Intl` options) or through your `parse`. One it can't read, or that `min`, `max` or a blocked day rules out, isn't committed, as with typing: the field shows it as written, and submits it under a `name`, until focus next leaves the field.
 * @extraProp {boolean} [required=false] - Marks the input as required.
 * @extraProp {string} [className] - Additional CSS classes for the input.
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Forwarded to the underlying `<input>`.
 */
export interface DateInputProps extends DateInputBaseProps {
  /** Field label (component auto-wraps in a `Field` if not already inside). Automatically associated with the input via `htmlFor` — uses your `id` when provided, otherwise a generated one. In `inline` mode, where there's no input, it names the picker instead, which is then a `role="group"`, through `aria-labelledby`, unless `labelProps.htmlFor` wires it by hand. An `aria-label` or `aria-labelledby` you set names the picker over it, and an `aria-labelledby` key counts even when undefined. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`) and you set no `id` here. Inline, that `Field`'s label names the picker's group whatever the `id`. */
  label?: React.ReactNode;
  /** Size for the label. */
  labelSize?: FieldProps['labelSize'];
  /** Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then). */
  labelProps?: FieldProps['labelProps'];
  /** Render the field with horizontal layout. */
  horizontal?: boolean;
  /**
   * Icon props for the left icon.
   * Bulma gives control icons `pointer-events: none`, so a clickable node here
   * never receives a click. Put a button beside the input in its own addon `Control` instead.
   */
  iconLeft?: ControlBaseProps['iconLeft'];
  /**
   * Icon props for the right icon.
   * Bulma gives control icons `pointer-events: none`, so a clickable node here
   * never receives a click. Put a button beside the input in its own addon `Control` instead.
   */
  iconRight?: ControlBaseProps['iconRight'];
  /** Shortcut for the right icon name. */
  iconRightName?: string;
  /** Shortcut for left icon size. */
  iconLeftSize?: ControlBaseProps['iconLeftSize'];
  /** Shortcut for right icon size. */
  iconRightSize?: ControlBaseProps['iconRightSize'];
  /** Force the left icon container. */
  hasIconsLeft?: boolean;
  /** Force the right icon container. */
  hasIconsRight?: boolean;
  /**
   * Shows a loading spinner on the `Control` it renders, and hides the
   * launcher (`triggerIcon`) while it does. Inside your own `Control` it
   * renders none, so this draws nothing and warns in development; set
   * `isLoading` on that `Control`.
   * Under `prefers-reduced-motion: reduce` the spinner stops and stays
   * drawn (with bestax's CSS loaded).
   */
  isLoading?: boolean;
  /**
   * Show a clickable launcher button on the right that toggles the popover.
   * Hidden by default while a spinner shows at the same right edge: this
   * component's `isLoading` when it renders its own `Control`, or the
   * enclosing `Control`'s `isLoading` inside one.
   * @defaultValue true
   */
  triggerIcon?: boolean;
  /** Expand the control to fill its container. */
  isExpanded?: boolean;
  /** Size of the wrapping Control. */
  controlSize?: ControlBaseProps['size'];
  /**
   * Help or validation text under the input. It describes the input through
   * `aria-describedby`; inline, with no input, it describes the picker's
   * group when something names it.
   */
  message?: React.ReactNode;
  /** Color modifier for the help message. */
  messageColor?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Additional CSS classes for the Field wrapper. */
  fieldClassName?: string;
  /** Additional CSS classes for the Control wrapper. */
  controlClassName?: string;
}

/**
 * The `DateInput` component is a form input that opens a popover calendar for date selection.
 *
 * @function
 * @param {DateInputProps} props - Props for the DateInput.
 * @returns {JSX.Element}
 *
 * @example
 * <DateInput
 *   label="Date of birth"
 *   autoComplete="bday"
 *   defaultValue={new Date(1990, 0, 1)}
 * />
 *
 * @example
 * <DateInput
 *   label="Booking"
 *   min={new Date()}
 *   shouldDisableDate={d => d.getDay() === 0 || d.getDay() === 6}
 * />
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (props, ref) => {
    const {
      label,
      labelSize,
      labelProps,
      horizontal,
      iconLeft,
      iconRight,
      iconLeftName = 'calendar',
      iconRightName,
      iconLeftSize,
      iconRightSize,
      hasIconsLeft,
      hasIconsRight,
      isLoading,
      isExpanded,
      controlSize,
      message,
      messageColor,
      fieldClassName,
      controlClassName,
      ...baseProps
    } = props;
    // The picker's own direction, which the Control below takes too.
    const pickerDirAttrs = usePickerDirAttrs(baseProps.locale, baseProps.dir);
    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const ownField = rendersOwnField('DateInput', {
      insideField,
      insideControl,
      label,
      message,
      horizontal,
      fieldClassName,
    });
    // Inline mode renders a bare calendar with no input, so the Control's
    // icon-left container has nothing to anchor to, and it renders no
    // Control inside one or out. The left icon is checked as the caller
    // passed it: the default glyph is this component's own choice, not a
    // prop the caller set, so it goes in only for the advice.
    const ownControl = rendersOwnControl('DateInput', {
      insideControl,
      inline: baseProps.inline,
      isLoading,
      iconLeft,
      iconLeftName: props.iconLeftName,
      defaultIconLeftName: iconLeftName,
      iconLeftSize,
      iconRight,
      iconRightName,
      iconRightSize,
      hasIconsLeft,
      hasIconsRight,
      isExpanded,
      controlSize,
      controlClassName,
    });
    const { controlId, fieldLabelProps } = useAutoLabelId({
      label,
      id: baseProps.id,
      labelProps,
      // Inline mode renders a bare calendar with no input to label.
      rendersLabel: ownField && !baseProps.inline,
      hasInput: !baseProps.inline,
    });
    // Inline there's no input for the label's `for`, so the label names the
    // picker, a group, through `aria-labelledby`, as DateRangeInput's does,
    // unless you wired it yourself with `labelProps.htmlFor`.
    const labelsGroup =
      !!baseProps.inline && !(labelProps && 'htmlFor' in labelProps);
    const group = useAutoLabelledBy({
      label,
      labelProps,
      rendersLabel: ownField && labelsGroup,
      callerProps: baseProps,
    });
    const { messageEl, messageId } = useFieldMessage(message, messageColor);

    // The base hides its launcher while the Control it sits in is loading,
    // whether that is the one rendered below or an enclosing one.
    let content: React.ReactNode = (
      <FieldMessageIdProvider value={messageId}>
        <DateInputBase
          ref={ref}
          {...(labelsGroup && { 'aria-labelledby': group.ariaLabelledBy })}
          {...baseProps}
          id={controlId}
        />
      </FieldMessageIdProvider>
    );

    if (ownControl) {
      content = (
        <Control
          {...pickerDirAttrs}
          iconLeft={iconLeft}
          iconRight={iconRight}
          iconLeftName={iconLeftName}
          iconRightName={iconRightName}
          iconLeftSize={iconLeftSize}
          iconRightSize={iconRightSize}
          hasIconsLeft={hasIconsLeft || !!iconLeftName}
          hasIconsRight={hasIconsRight}
          isLoading={isLoading}
          isExpanded={isExpanded}
          size={controlSize}
          className={controlClassName}
        >
          {content}
        </Control>
      );
    }

    if (ownField) {
      return (
        <Field
          label={label}
          labelSize={labelSize}
          labelProps={labelsGroup ? group.fieldLabelProps : fieldLabelProps}
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

DateInput.displayName = 'DateInput';

export default DateInput;
