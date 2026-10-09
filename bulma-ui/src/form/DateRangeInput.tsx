import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import {
  DateRangeInputBase,
  DateRangeInputBaseProps,
} from './DateRangeInputBase';
import {
  useInsideField,
  useInsideControl,
  rendersOwnField,
  rendersOwnControl,
} from './FormContext';
import { useAutoLabelledBy } from './useAutoLabelId';

/**
 * Props for the DateRangeInput convenience wrapper. Extends
 * `DateRangeInputBaseProps` with Field-level (label, horizontal) and
 * Control-level (icons, loading) props. Inside an existing `Control` it
 * renders no `Control` of its own, so its Control-level props do nothing
 * there and warn in development; set them on that `Control` instead. In
 * `inline` mode it renders no `Control` anywhere, so they do nothing inside a
 * `Control` or out, and warn in development there too. Inside an outer
 * `Field`, or a `Control` with no `Field` around it, it renders no `Field` of
 * its own either. The exception is
 * `label`, `message`, `horizontal` or `fieldClassName` in that bare
 * `Control`: it keeps a `Field` for them, nested in the `.control`, and warns
 * in development. Wrap the `Control` in a `Field` instead.
 * @extraProp {string} [className] - Additional CSS classes for the root, the `role="group"` that holds the two inputs.
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Forwarded to the start `<input>`.
 */
export interface DateRangeInputProps extends DateRangeInputBaseProps {
  /** Field label naming the whole range. Associated through `aria-labelledby` on the `role="group"` root, since it names two inputs rather than one; uses your `labelProps.id` when provided, otherwise a generated one. Each input keeps its own name, "Start date" or "End date" (`labels.rangeStart` / `labels.rangeEnd`). Dropped inside an outer `Field`, whose own label names the group instead through `aria-labelledby` when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`). An `aria-label` or `aria-labelledby` you set on the group wins over either label, which still renders but no longer names it. An `aria-labelledby` key counts even when undefined, since it is spread over the group's own. */
  label?: React.ReactNode;
  /** Size for the label. */
  labelSize?: FieldProps['labelSize'];
  /** Props for the label element. An `htmlFor` here is dropped, since the label names the group rather than one input. */
  labelProps?: FieldProps['labelProps'];
  /** Render the field with horizontal layout. */
  horizontal?: boolean;
  /**
   * Icon props for the left icon.
   * Bulma gives control icons `pointer-events: none`, so a clickable node here
   * never receives a click. Put a button beside the field in its own addon `Control` instead.
   */
  iconLeft?: ControlBaseProps['iconLeft'];
  /**
   * Icon props for the right icon.
   * Bulma gives control icons `pointer-events: none`, so a clickable node here
   * never receives a click. Put a button beside the field in its own addon `Control` instead.
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
  /** Help/validation text below the field. */
  message?: React.ReactNode;
  /** Color modifier for the help message. */
  messageColor?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Additional CSS classes for the Field wrapper. */
  fieldClassName?: string;
  /** Additional CSS classes for the Control wrapper. */
  controlClassName?: string;
}

/**
 * The `DateRangeInput` component is a form input for a start and end date, picked from one popover calendar or typed into two segmented inputs.
 *
 * @function
 * @param {DateRangeInputProps} props - Props for the DateRangeInput.
 * @returns {JSX.Element}
 *
 * @example
 * <DateRangeInput label="Stay" name="stay" min={new Date()} />
 */
export const DateRangeInput = forwardRef<HTMLInputElement, DateRangeInputProps>(
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
    const ownField = rendersOwnField('DateRangeInput', {
      insideField,
      insideControl,
      label,
      message,
      horizontal,
      fieldClassName,
    });
    // Inline mode renders a bare calendar with no input, so the Control's
    // icon containers have nothing to anchor to, and it renders no Control
    // inside one or out. The left icon is checked as the caller passed it:
    // the default glyph is this component's own choice, not a prop the
    // caller set, so it goes in only for the advice.
    const ownControl = rendersOwnControl('DateRangeInput', {
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
    const { ariaLabelledBy, fieldLabelProps } = useAutoLabelledBy({
      label,
      labelProps,
      rendersLabel: ownField,
      callerProps: baseProps,
    });
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    let content: React.ReactNode = (
      <DateRangeInputBase
        ref={ref}
        aria-labelledby={ariaLabelledBy}
        {...baseProps}
      />
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

DateRangeInput.displayName = 'DateRangeInput';

export default DateRangeInput;
