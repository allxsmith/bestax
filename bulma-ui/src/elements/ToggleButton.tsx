import React, { forwardRef, useState } from 'react';
import { Button, type ButtonOwnProps } from './Button';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';

// Spelled out rather than `Exclude<ButtonOwnProps['color'], 'text' | 'ghost'>`
// so the API page can list the values. The tests hold it to that expression,
// so a color Button gains fails there until it's added here too.
/**
 * The fills a pressed `ToggleButton` takes: `Button`'s colors, minus `text`
 * and `ghost`, which don't fill.
 */
export type ToggleButtonColor =
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'white'
  | 'light'
  | 'dark'
  | 'black';

/**
 * Props for the ToggleButton component. The helper props, the other button
 * attributes and the `ref` all land on the `<button>`.
 *
 * Some of `Button`'s props are left out on purpose. `as`, since only a button
 * can be pressed, and `type`, which is always `button`. `isActive`, which is
 * `pressed` here, and `isStatic`, a toggle you couldn't press. And the props
 * that change the fill (`isLight`, `isOutlined`, `isInverted`, `textColor`,
 * `bgColor` and their shades), since each would color the button in both
 * states or turn "on" into a faint tint.
 *
 * @extraProp {React.Ref<HTMLButtonElement>} [ref] - Ref forwarded to the `<button>`.
 */
export interface ToggleButtonProps
  extends
    Omit<
      ButtonOwnProps,
      | 'color'
      | 'isActive'
      | 'isStatic'
      | 'isLight'
      | 'isOutlined'
      | 'isInverted'
      | 'textColor'
      | 'bgColor'
      | 'colorShade'
      | 'backgroundColorShade'
      | 'isFullWidth'
    >,
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      keyof ButtonOwnProps | 'type' | 'aria-pressed'
    > {
  /**
   * Whether it's pressed, when you hold the state. Setting it makes the toggle
   * controlled: a click only calls `onPressedChange`, and nothing changes until
   * you pass the new value. Pick this or `defaultPressed` for the button's
   * lifetime.
   */
  pressed?: boolean;
  /** Whether it starts pressed, when it holds its own state. */
  defaultPressed?: boolean;
  /**
   * Called with the new state each time it's toggled, by a click, Enter or
   * Space, whether or not `pressed` is set. An `onClick` that calls
   * `preventDefault()` stops the toggle, and this doesn't fire.
   */
  onPressedChange?: (pressed: boolean) => void;
  /**
   * The fill while it's pressed. Not pressed, it's a plain button, so the fill
   * is the difference people see: prefer a strong one. A pale fill such as
   * `warning` changes less, and `white` and `light` barely differ from a plain
   * button in a light theme, as `dark` and `black` do in a dark one.
   */
  color?: ToggleButtonColor;
  /**
   * The label, which stays the same in both states: a screen reader announces
   * whether it's pressed, so "Mute" stays "Mute". An icon can swap, but an
   * icon-only toggle needs an `aria-label` that doesn't. A label that changes
   * ("Play", then "Pause") belongs on a plain `Button`.
   */
  children?: React.ReactNode;
  /**
   * Not accepted: `aria-pressed` follows the state. Declared because JSX lets a
   * hyphenated attribute through when the props don't name it, so leaving it
   * out of the type alone would not reject `aria-pressed="mixed"`.
   * @internal
   */
  'aria-pressed'?: never;
}

/**
 * The `ToggleButton` component renders a button that stays pressed until it's pressed again, and says whether it's on through `aria-pressed`.
 *
 * It's always a `<button type="button">`, so it never submits a form and
 * carries no form value: a setting saved with a form is a `Checkbox` or a
 * `Switch`. A set of toggles that each turn on and off on their own goes in
 * `Buttons hasAddons` with `role="group"` and an `aria-label`. A set where only
 * one can be on is a radio group rather than a row of these: use `Radios`.
 *
 * @function
 * @param {ToggleButtonProps} props - Props for the ToggleButton component.
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref to the `<button>`.
 * @returns {JSX.Element} The rendered toggle button.
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/button/ | APG button pattern}
 *
 * @example
 * <ToggleButton onPressedChange={setMuted}>Mute</ToggleButton>
 *
 * @example
 * <Buttons hasAddons role="group" aria-label="Text style">
 *   <ToggleButton aria-label="Bold" pressed={bold} onPressedChange={setBold}>
 *     <Icon name="bold" />
 *   </ToggleButton>
 * </Buttons>
 */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  function ToggleButton(
    {
      pressed: controlledPressed,
      defaultPressed = false,
      onPressedChange,
      color = 'link',
      className,
      onClick,
      ...props
    },
    ref
  ) {
    const isControlled = controlledPressed !== undefined;
    const [internalPressed, setInternalPressed] = useState(defaultPressed);
    const pressed = controlledPressed ?? internalPressed;

    // Prefixed like Button's own classes, which a hand-written
    // `className="is-selected"` could not be under ConfigProvider classPrefix.
    // Bulma lifts `is-selected` above its neighbours in `.buttons.has-addons`.
    const selectedClass = usePrefixedClassNames({ 'is-selected': pressed });

    // The caller's onClick runs first, so a `preventDefault()` there vetoes
    // the toggle, as it does in Radix, MUI and Zag. Enter and Space reach here
    // through the button's own click, and a disabled button gets no click.
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const next = !pressed;
      onPressedChange?.(next);
      if (!isControlled) setInternalPressed(next);
    };

    // The props are spread first, so the four things a toggle depends on win
    // over anything a JavaScript caller or a spread object passes along: it
    // stays a button, never submits, and reports the state it's in.
    return (
      <Button
        {...props}
        ref={ref}
        as="button"
        type="button"
        aria-pressed={pressed}
        color={pressed ? color : undefined}
        className={classNames(selectedClass, className)}
        onClick={handleClick}
      />
    );
  }
);

ToggleButton.displayName = 'ToggleButton';

export default ToggleButton;
