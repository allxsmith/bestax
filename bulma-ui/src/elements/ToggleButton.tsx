import React, { forwardRef, useState } from 'react';
import { Button, type ButtonOwnProps } from './Button';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';

// Spelled out rather than as an `Exclude` of Button's colors so the API page
// can list the values. The tests hold it to that `Exclude`, so a color Button
// gains fails there until it's added here or left out on purpose.
/**
 * The fills a pressed `ToggleButton` takes: `Button`'s colors, minus `text`
 * and `ghost`, which don't fill, and `white`, `light`, `dark` and `black`.
 * Bulma's color modifier fills the button and drops its border, and those four
 * fill it with about the lightness a plain button already has in one theme or
 * the other, so pressed would look like off without its border.
 */
export type ToggleButtonColor =
  'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Props for the ToggleButton component. The helper props, the other button
 * attributes and the `ref` all land on the `<button>`.
 *
 * Some of `Button`'s props are left out on purpose. `as`, since only a button
 * can be pressed, and `type`, which is always `button`. `isActive`, which is
 * `pressed` here, and `isStatic`, a toggle you couldn't press. And the props
 * that change the fill (`isLight`, `isOutlined`, `isInverted`, `textColor`,
 * `bgColor` and their shades), since each would color the button in both
 * states or turn "on" into a faint tint. `color` takes only the fills that
 * stand out from a plain button: see `ToggleButtonColor`.
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
   * is the difference people see. `white`, `light`, `dark` and `black` aren't
   * offered, since in one theme or the other each fills about as light or dark
   * as a plain button already is. Of the rest, a pale one such as `warning`
   * changes less than the default `link`.
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
   * Shows Bulma's spinner in place of the label and holds the toggle where it
   * is: a click, Enter or Space does nothing, so neither `onClick` nor
   * `onPressedChange` fires, until it's cleared. Set it while a change is
   * saving. The button carries `aria-busy` and `aria-disabled` meanwhile, and
   * stays focusable, so focus isn't lost mid-save. Under
   * `prefers-reduced-motion: reduce` the spinner stops and stays drawn (with
   * bestax's CSS loaded).
   */
  isLoading?: boolean;
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
      isLoading,
      'aria-busy': ariaBusy,
      'aria-disabled': ariaDisabled,
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
    //
    // A loading one gets the click but drops it. Bulma's spinner only stops a
    // pointer, so without this a key flipped a toggle the mouse couldn't.
    // `disabled` would stop both, but it takes focus away mid-save.
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isLoading) return;
      onClick?.(event);
      if (event.defaultPrevented) return;
      const next = !pressed;
      onPressedChange?.(next);
      if (!isControlled) setInternalPressed(next);
    };

    // The props are spread first, so what a toggle depends on wins over
    // anything a JavaScript caller or a spread object passes along: it stays
    // a button, never submits, reports the state it's in, and says it's busy
    // and won't respond while it's loading. A caller's own `aria-busy` or
    // `aria-disabled` stays when it isn't loading.
    return (
      <Button
        {...props}
        ref={ref}
        as="button"
        type="button"
        isLoading={isLoading}
        aria-busy={isLoading || ariaBusy}
        aria-disabled={isLoading || ariaDisabled}
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
