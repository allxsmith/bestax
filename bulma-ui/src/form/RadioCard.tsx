import React, { forwardRef, useCallback, useId } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useRadiosGroup } from './FormContext';

// The colors `Radio` takes, as `radioColors` lists them. Declared here as
// well, so the API page can read them off this module, and a type test holds
// the two lists to each other.
const radioCardColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

/**
 * Props for the RadioCard component.
 *
 * @helperProps Helper props go on the outer `<label>`, the `.card`, with
 * `className`. The other attributes go on the `<input>`.
 * @extraProp {string} [name] - The form field name, which the cards of one choice share, so the arrow keys move between them. Inside `Radios`, the group's `name` when this is unset.
 * @extraProp {string} [value] - What a form sends when this card is the one picked. Inside a `Radios` group that takes `value`, `defaultValue` or `onChange`, the card is checked while the group's value is this.
 */
export interface RadioCardProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'type' | 'color' | 'title'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  /**
   * What the option is, such as "Express". It names the radio, so a screen
   * reader says it with the state and its place in the group. Without it,
   * the card's whole text names the radio, as a label's text does.
   */
  title?: React.ReactNode;
  /**
   * A line or two about the option, read after the name and the state. It's
   * the radio's description when `title`, `aria-label` or `aria-labelledby`
   * names it. Without one of those it's part of the name already, so it
   * isn't read twice.
   */
  description?: React.ReactNode;
  /**
   * Anything else in the card, after the description, such as a price. A
   * label holds phrasing content only, so spans, images and links: a link
   * works and doesn't pick the card, but a button or another input can't go
   * inside a label at all. It isn't read when the radio takes focus, so put
   * what a screen reader should hear in `title` and `description`.
   */
  children?: React.ReactNode;
  /**
   * Shows the radio at the start of the card. Without it, the card's edge
   * alone shows the selection, and it's thicker when picked, so the
   * selection never rests on color.
   */
  hasIndicator?: boolean;
  /** The color of the radio and of a picked card's edge. */
  color?: (typeof radioCardColors)[number];
  /**
   * Text color helper, on the card. The title and the children take it, and
   * the description keeps its own color.
   */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Whether the card is disabled. A disabled card dims, takes no clicks, and the arrow keys skip it. */
  disabled?: boolean;
  /**
   * Additional CSS classes, on the outer `<label>`, the card. That's the
   * element that declares the `--bulma-radio-card-*` variables, and Bulma's
   * `--bulma-card-*` ones, so a class is how to set one: `style` and the
   * other input attributes go to the `<input>`. Name `.radio-card` beside
   * your class in the selector, so it beats the card's own declaration
   * whatever order the stylesheets load in. A `color` prop declares the
   * active color again on `.radio-card.is-<color>`, which ties that
   * selector, so leave `color` unset when a class sets it.
   */
  className?: string;
}

/**
 * The `RadioCard` component is a radio button drawn as a card, with a title and a description, picked wherever you click it.
 *
 * It's a `<label>` around a real radio, so it sends its `value` with a form,
 * and the cards that share a `name` are one choice the arrow keys move
 * through. The title names the radio and the description describes it.
 * Inside `Radios` it takes the group's name and selection, as `Radio` does.
 *
 * @function
 * @param {RadioCardProps} props - Props for the RadioCard component.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the `<input>`.
 * @returns {JSX.Element} The rendered card.
 *
 * @example
 * <Radios label="Shipping" name="shipping" defaultValue="standard">
 *   <RadioCard value="standard" title="Standard" description="Arrives in 4 to 6 days." />
 *   <RadioCard value="express" title="Express" description="Arrives tomorrow." />
 * </Radios>
 */
export const RadioCard = forwardRef<HTMLInputElement, RadioCardProps>(
  (
    {
      title,
      description,
      children,
      hasIndicator = true,
      color,
      className,
      textColor,
      disabled,
      name,
      value,
      checked,
      defaultChecked,
      onChange,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      ...props,
    });

    // A surrounding <Radios> hands down its name and, when it manages the
    // selection, whether this card is the one picked. The card's own props
    // win, as they do on Radio.
    const group = useRadiosGroup();
    const effectiveName = name ?? group?.name;
    const groupManaged = group?.value !== undefined && value !== undefined;
    const effectiveChecked =
      checked !== undefined
        ? checked
        : groupManaged
          ? group!.value === value
          : undefined;
    const effectiveDefaultChecked = groupManaged ? undefined : defaultChecked;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e);
        if (group?.onChange && value !== undefined) {
          group.onChange(String(value));
        }
      },
      [onChange, group, value]
    );

    // The title names the input and the description describes it. A name
    // passed in wins, and without one of either the label's own text names
    // the input, description included, so it isn't described again.
    const titleId = useId();
    const descriptionId = useId();
    const ariaLabel = rest['aria-label'];
    const ariaLabelledBy =
      rest['aria-labelledby'] || (!ariaLabel && title ? titleId : undefined);
    const ariaDescribedBy =
      rest['aria-describedby'] ||
      (description && (ariaLabel || ariaLabelledBy)
        ? descriptionId
        : undefined);

    const cardClass = usePrefixedClassNames('radio-card', 'card', {
      [`is-${color}`]: color && radioCardColors.includes(color),
    });
    const contentClass = usePrefixedClassNames(
      'card-content',
      'radio-card-content'
    );
    const checkClass = usePrefixedClassNames('radio-card-check');
    const bodyClass = usePrefixedClassNames('radio-card-body');
    const titleClass = usePrefixedClassNames('radio-card-title');
    const descriptionClass = usePrefixedClassNames('radio-card-description');

    return (
      <label className={classNames(cardClass, bulmaHelperClasses, className)}>
        <input
          ref={ref}
          type="radio"
          disabled={disabled}
          name={effectiveName}
          value={value}
          checked={effectiveChecked}
          defaultChecked={effectiveDefaultChecked}
          onChange={handleChange}
          {...rest}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
        />
        <span className={contentClass}>
          {hasIndicator && <span className={checkClass} />}
          <span className={bodyClass}>
            {title ? (
              <span id={titleId} className={titleClass}>
                {title}
              </span>
            ) : null}
            {description ? (
              <span id={descriptionId} className={descriptionClass}>
                {description}
              </span>
            ) : null}
            {children}
          </span>
        </span>
      </label>
    );
  }
);

RadioCard.displayName = 'RadioCard';

export default RadioCard;
