import React, { forwardRef } from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import { warnOnce } from '../helpers/devWarnings';
import { Field, FieldProps } from './Field';
import { Control, ControlBaseProps } from './Control';
import { PasswordInputBase, PasswordInputBaseProps } from './PasswordInputBase';
import {
  useInsideField,
  useInsideControl,
  rendersOwnField,
  rendersOwnControl,
} from './FormContext';
import { useAutoLabelId } from './useAutoLabelId';

/**
 * Props for the PasswordInput component: PasswordInputBase's, plus Input's
 * Field and Control props, except the right icon, whose place the toggle
 * takes. Inside an existing `Control` it renders no `Control` of its own, so
 * its Control-level props do nothing there and warn in development; set them
 * on that `Control` instead. Inside an outer `Field`, or a `Control` with no
 * `Field` around it, it renders no `Field` of its own either. The exception
 * is `label`, `message`, `horizontal` or `fieldClassName` in that bare
 * `Control`: it keeps a `Field` for them, nested in the `.control`, and warns
 * in development. Wrap the `Control` in a `Field` instead, and set the
 * `label`, `horizontal` and class name on that `Field`.
 *
 * @extraProp {string} [autoComplete="current-password"] - Tells the browser and password managers this is an existing password. Pass `"new-password"` where the user makes one up, on a sign-up or change-password form.
 * @extraProp {boolean} [spellCheck=false] - Off, so a browser's spellcheck never sees the password once it shows.
 * @extraProp {string} [autoCorrect="off"] - Off, so a phone's keyboard doesn't change what's typed.
 * @extraProp {string} [autoCapitalize="none"] - Off, so a phone's keyboard doesn't capitalize the first letter.
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Ref forwarded to the `<input>`.
 */
export interface PasswordInputProps extends PasswordInputBaseProps {
  /** Field label. Automatically associated with the input via `htmlFor`, using your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`) and you set no `id` here. */
  label?: React.ReactNode;
  /** Size for the label. */
  labelSize?: FieldProps['labelSize'];
  /** Props for the label element when the component renders its own `Field`; dropped inside an outer `Field` (use that `Field`'s `labelProps` instead). An explicit `htmlFor` key, even `undefined`, overrides the automatic association and no id is generated. */
  labelProps?: FieldProps['labelProps'];
  /** Horizontal field layout. */
  horizontal?: boolean;
  /**
   * Icon props for the left icon.
   * Bulma gives control icons `pointer-events: none`, so a clickable node here
   * never receives a click.
   */
  iconLeft?: ControlBaseProps['iconLeft'];
  /** Shortcut for the left icon's name. */
  iconLeftName?: string;
  /** Shortcut for the left icon's size. */
  iconLeftSize?: ControlBaseProps['iconLeftSize'];
  /** Force the left icon container. */
  hasIconsLeft?: boolean;
  /**
   * Shows a loading spinner on the `Control` it renders, at the edge the
   * toggle uses, so the toggle isn't drawn meanwhile. Inside your own
   * `Control` it renders none, so this draws nothing and warns in
   * development; set `isLoading` on that `Control`, which hides the toggle
   * too.
   */
  isLoading?: boolean;
  /** Expand the control. */
  isExpanded?: boolean;
  /** Control size. */
  controlSize?: ControlBaseProps['size'];
  /** Help/validation message below the input. */
  message?: React.ReactNode;
  /** Bulma color for the message. */
  messageColor?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Additional CSS classes for the Field. */
  fieldClassName?: string;
  /** Additional CSS classes for the Control. */
  controlClassName?: string;
  /** Not offered: the toggle takes the right icon's place. Warns in development if passed. @internal */
  iconRight?: never;
  /** Not offered, as `iconRight`. @internal */
  iconRightName?: never;
  /** Not offered, as `iconRight`. @internal */
  iconRightSize?: never;
  /** Not offered, as `iconRight`. @internal */
  hasIconsRight?: never;
}

/** The right-icon props, which the toggle's place leaves no room for. */
const RIGHT_ICON_PROPS = [
  'iconRight',
  'iconRightName',
  'iconRightSize',
  'hasIconsRight',
] as const;

/**
 * The `PasswordInput` component is a password field with a button inside it that shows what was typed.
 *
 * By default the button is an eye named "Show password" that reports
 * whether the password shows with `aria-pressed`; `variant="text"` makes it
 * the words "Show" and "Hide". The field asks for
 * `autocomplete="current-password"` and no spellcheck, and hides the
 * password again when its form submits.
 *
 * @function
 * @param {PasswordInputProps} props - Props for PasswordInput.
 * @returns {JSX.Element} The composed field element.
 *
 * @example
 * <PasswordInput label="Password" />
 *
 * @example
 * <PasswordInput label="New password" autoComplete="new-password" variant="text" />
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const {
      // Field props
      label,
      labelSize,
      labelProps,
      horizontal,
      // Control props
      iconLeft,
      iconLeftName,
      iconLeftSize,
      hasIconsLeft,
      isLoading,
      isExpanded,
      controlSize,
      // Message props
      message,
      messageColor,
      // Container class overrides
      fieldClassName,
      controlClassName,
      // Not offered, and not passed on
      iconRight: _iconRight,
      iconRightName: _iconRightName,
      iconRightSize: _iconRightSize,
      hasIconsRight: _hasIconsRight,
      // Everything else goes to the base
      ...baseProps
    } = props;

    const rightIcon = RIGHT_ICON_PROPS.filter(prop => props[prop]);
    if (rightIcon.length > 0) {
      const names = rightIcon.join(' ');
      warnOnce(
        `PasswordInput:right-icon:${names}`,
        `[bestax-bulma] <PasswordInput ${names}> draws no right icon: the ` +
          `visibility toggle sits at that edge. Leave ` +
          `${rightIcon.length > 1 ? 'them' : 'it'} out, or use a left icon.`
      );
    }

    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const ownField = rendersOwnField('PasswordInput', {
      insideField,
      insideControl,
      label,
      message,
      horizontal,
      fieldClassName,
    });
    const ownControl = rendersOwnControl('PasswordInput', {
      insideControl,
      isLoading,
      iconLeft,
      iconLeftName,
      iconLeftSize,
      hasIconsLeft,
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

    // The base hides its toggle while the Control it sits in is loading,
    // whether that is the one rendered below or an enclosing one.
    let content: React.ReactNode = (
      <PasswordInputBase ref={ref} {...baseProps} id={controlId} />
    );

    if (ownControl) {
      content = (
        <Control
          iconLeft={iconLeft}
          iconLeftName={iconLeftName}
          iconLeftSize={iconLeftSize}
          hasIconsLeft={hasIconsLeft}
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

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
