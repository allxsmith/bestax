import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { DateInputBase, DateInputBaseProps } from './DateInputBase';
import {
  useInsideField,
  useInsideControl,
  rendersOwnField,
  rendersOwnControl,
} from './FormContext';
import { useAutoLabelId } from './useAutoLabelId';

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
 * @extraProp {boolean} [required=false] - Marks the input as required.
 * @extraProp {string} [className] - Additional CSS classes for the input.
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Forwarded to the underlying `<input>`.
 */
export interface DateInputProps extends DateInputBaseProps {
  /** Field label (component auto-wraps in a `Field` if not already inside). Automatically associated with the input via `htmlFor` — uses your `id` when provided, otherwise a generated one. Not wired in `inline` mode (no visible input to label). Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`) and you set no `id` here. */
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
  /** Help/validation text below the input. */
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
 * <DateInput label="Date of birth" defaultValue={new Date(1990, 0, 1)} />
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
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    // The base hides its launcher while the Control it sits in is loading,
    // whether that is the one rendered below or an enclosing one.
    let content: React.ReactNode = (
      <DateInputBase ref={ref} {...baseProps} id={controlId} />
    );

    if (ownControl) {
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

DateInput.displayName = 'DateInput';

export default DateInput;
