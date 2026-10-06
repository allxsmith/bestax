import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { DateTimeInputBase, DateTimeInputBaseProps } from './DateTimeInputBase';
import { useInsideField, useInsideControl } from './FormContext';
import { useAutoLabelId } from './useAutoLabelId';

/**
 * Props for the DateTimeInput convenience wrapper. Extends
 * `DateTimeInputBaseProps` with Field-level and Control-level props.
 * Inside an existing `Control` within a `Field` it renders no `Field` or
 * `Control` of its own, so set the Control-level props on that `Control` instead.
 * With `isLoading` there, pass `triggerIcon={false}` too (see `triggerIcon`).
 * @extraProp {string} [name] - Form field name.
 * @extraProp {string} [form] - Optional id of the form the input belongs to.
 * @extraProp {boolean} [required=false] - Marks the field as required for native HTML form validation.
 */
export interface DateTimeInputProps extends DateTimeInputBaseProps {
  /** Field label. Automatically associated with the input via `htmlFor` — uses your `id` when provided, otherwise a generated one. Not wired in `inline` mode (no visible input to label) and dropped inside an outer `Field`. */
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
   * launcher (`triggerIcon`) while it does.
   * Under `prefers-reduced-motion: reduce` the spinner stops and stays
   * drawn (with bestax's CSS loaded).
   */
  isLoading?: boolean;
  /**
   * Show a clickable launcher button on the right that toggles the popover.
   * Off by default while the `Control` this component renders shows its
   * `isLoading` spinner, which sits at the same right edge. Inside your own
   * `<Control isLoading>` the spinner is that `Control`'s, which this
   * component cannot see, so pass `false` there or the two overlap.
   * @defaultValue !isLoading
   */
  triggerIcon?: boolean;
  /** Expand the control to fill its container. */
  isExpanded?: boolean;
  /** Size of the wrapping Control. */
  controlSize?: ControlBaseProps['size'];
  /** Help/validation text below the input. */
  message?: React.ReactNode;
  /** Message color. */
  messageColor?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Additional CSS classes for the Field wrapper. */
  fieldClassName?: string;
  /** Additional CSS classes for the Control wrapper. */
  controlClassName?: string;
}

/**
 * The `DateTimeInput` combines a calendar and a time **wheel spinner** in a single popover — an iOS-style layout.
 *
 * @function
 * @param {DateTimeInputProps} props
 * @returns {JSX.Element}
 *
 * @example
 * <DateTimeInput label="Appointment" defaultValue={new Date()} />
 *
 * @example
 * <DateTimeInput
 *   label="When"
 *   hourFormat="12"
 *   shouldDisableDate={d => d.getDay() === 0 || d.getDay() === 6}
 * />
 */
export const DateTimeInput = forwardRef<HTMLInputElement, DateTimeInputProps>(
  (
    {
      label,
      labelSize,
      labelProps,
      horizontal,
      iconLeft,
      iconRight,
      iconLeftName = 'calendar-alt',
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
    },
    ref
  ) => {
    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const { controlId, fieldLabelProps } = useAutoLabelId({
      label,
      id: baseProps.id,
      labelProps,
      // Inline mode renders a bare picker with no input to label.
      rendersLabel: !insideField && !baseProps.inline,
    });
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    // Inline mode renders a bare picker with no input, so the Control's
    // icon-left container has nothing to anchor to. Skip the Control wrap.
    const rendersControl = !insideControl && !baseProps.inline;

    // The right-side launcher is on by default; suppress it while the Control
    // rendered here shows its loading spinner (also on the right) unless
    // explicitly set. Inside another Control no spinner is drawn here.
    let content: React.ReactNode = (
      <DateTimeInputBase
        ref={ref}
        id={controlId}
        {...baseProps}
        triggerIcon={baseProps.triggerIcon ?? !(isLoading && rendersControl)}
      />
    );

    if (rendersControl) {
      content = (
        <Control
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

    const messageEl = message ? <p className={helpClass}>{message}</p> : null;

    if (!insideField) {
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

DateTimeInput.displayName = 'DateTimeInput';

export default DateTimeInput;
