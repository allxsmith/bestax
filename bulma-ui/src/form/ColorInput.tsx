import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { ColorInputBase, ColorInputBaseProps } from './ColorInputBase';
import {
  useInsideField,
  useInsideControl,
  rendersOwnField,
  rendersOwnControl,
} from './FormContext';
import { useAutoLabelId } from './useAutoLabelId';

/**
 * Props for the ColorInput convenience wrapper. Extends
 * `ColorInputBaseProps` with Field-level (label, horizontal, message) and
 * Control-level (loading, expanded) props. Inside an existing `Control` it
 * renders no `Control` of its own, so its Control-level props do nothing
 * there and warn in development; set them on that `Control` instead. Inside
 * an outer `Field`, or a `Control` with no `Field` around it, it renders no
 * `Field` of its own either. The exception is `label`, `message`,
 * `horizontal` or `fieldClassName` in that bare `Control`: it keeps a `Field`
 * for them, nested in the `.control`, and warns in development. Wrap the
 * `Control` in a `Field` instead, and set the `label`, `horizontal` and class
 * name on that `Field`.
 *
 * @helperProps Helper props go on the `.colorinput` `<div>`, with
 * `className`. The other attributes go on the text `<input>`.
 * @extraProp {string} [name] - Form field name. The field submits the text it shows, the value in `format`, or nothing when it's empty.
 * @extraProp {boolean} [required=false] - Marks the field required, so an empty one fails the form's constraint validation.
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Forwarded to the text `<input>`.
 */
export interface ColorInputProps extends ColorInputBaseProps {
  /** Field label (component auto-wraps in a `Field` if not already inside). Automatically associated with the text field via `htmlFor`, using your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`) and you set no `id` here. */
  label?: React.ReactNode;
  /** Size for the label. */
  labelSize?: FieldProps['labelSize'];
  /** Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then). */
  labelProps?: FieldProps['labelProps'];
  /** Render the field with horizontal layout. */
  horizontal?: boolean;
  /**
   * Shows a loading spinner on the `Control` it renders, and hides the
   * launcher (`triggerIcon`) while it does. Inside your own `Control` it
   * renders none, so this draws nothing and warns in development; set
   * `isLoading` on that `Control`.
   */
  isLoading?: boolean;
  /**
   * Shows the launcher on the field's end that toggles the panel. Hidden by
   * default while a spinner shows at the same edge: this component's
   * `isLoading` when it renders its own `Control`, or the enclosing
   * `Control`'s `isLoading` inside one.
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
 * The `ColorInput` component is a form field for a color: type it, or open a color picker from its launcher or its swatch.
 *
 * The value is a CSS color string, HSL by default, or empty. The panel is
 * the `ColorPicker`'s square, hue slider and, when asked for, alpha slider,
 * swatches and eye dropper, in the same popover the date pickers use.
 *
 * @function
 * @param {ColorInputProps} props - Props for the ColorInput.
 * @returns {JSX.Element}
 *
 * @example
 * <ColorInput label="Brand color" defaultValue="hsl(202, 67%, 36%)" swatches="bulma" />
 */
export const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  (props, ref) => {
    const {
      label,
      labelSize,
      labelProps,
      horizontal,
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
    const ownField = rendersOwnField('ColorInput', {
      insideField,
      insideControl,
      label,
      message,
      horizontal,
      fieldClassName,
    });
    const ownControl = rendersOwnControl('ColorInput', {
      insideControl,
      isLoading,
      isExpanded,
      controlSize,
      controlClassName,
    });
    const { controlId, fieldLabelProps } = useAutoLabelId({
      label,
      id: baseProps.id,
      labelProps,
      rendersLabel: ownField,
    });
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    // The base hides its launcher while the Control it sits in is loading,
    // whether that is the one rendered below or an enclosing one.
    let content: React.ReactNode = (
      <ColorInputBase ref={ref} {...baseProps} id={controlId} />
    );

    if (ownControl) {
      content = (
        <Control
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

ColorInput.displayName = 'ColorInput';

export default ColorInput;
