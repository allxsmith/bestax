import React, { forwardRef, useCallback, useId, useRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import {
  useCheckboxesGroup,
  useFieldsetDisabled,
  useRegisterChecked,
} from './FormContext';

// The colors `Checkbox` takes, as `checkboxColors` lists them. Declared here as
// well, so the API page can read them off this module, and a type test holds
// the two lists to each other.
const checkboxCardColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

/**
 * Props for the CheckboxCard component.
 *
 * @helperProps Helper props go on the outer `<label>`, the `.card`, with
 * `className`. The other attributes go on the `<input>`.
 * @extraProp {string} [name] - The form field name. Inside `Checkboxes`, the group's `name` when this is unset.
 * @extraProp {string} [value] - What a form sends for the card when it's checked. Inside a `Checkboxes` group that takes `value`, `defaultValue` or `onChange`, the card is checked while the group's value holds it. A group given only `onChange` starts from the cards' own `defaultChecked`.
 */
export interface CheckboxCardProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'type' | 'color' | 'title'
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  /**
   * What the option is, such as "Daily backups". It names the checkbox, so
   * a screen reader says it with the state. Without it, the card's whole
   * text names the checkbox, as a label's text does.
   */
  title?: React.ReactNode;
  /**
   * A line or two about the option, read after the name and the state. It's
   * the checkbox's description when `title`, `aria-label` or
   * `aria-labelledby` names it. Without one of those it's part of the name
   * already, so it isn't read twice.
   */
  description?: React.ReactNode;
  /**
   * Anything else in the card, after the description, such as a price. A
   * label holds phrasing content only, so spans, images and links: a link
   * works and doesn't toggle the card, but a button or another input can't
   * go inside a label at all. It isn't read when the checkbox takes focus,
   * so put what a screen reader should hear in `title` and `description`.
   */
  children?: React.ReactNode;
  /**
   * Shows the checkbox at the start of the card. Without it, the card's
   * edge alone shows the selection, and it's thicker when checked, so the
   * selection never rests on color.
   */
  hasIndicator?: boolean;
  /** The color of the checkbox and of a checked card's edge. */
  color?: (typeof checkboxCardColors)[number];
  /**
   * Text color helper, on the card. The title and the children take it, and
   * the description keeps its own color.
   */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Whether the card is disabled. A disabled card dims, takes no clicks, and leaves the Tab order. */
  disabled?: boolean;
  /**
   * Shows the mixed state, as in a "Select all" card when some of what it
   * covers is checked. It's a look and an announcement only: `checked` is
   * still the value, and a click still toggles `checked`. Set to `true` or
   * `false`, it's controlled: a browser clears the mixed state on a click,
   * so the component sets it again from this prop after every click and
   * every render. Unset isn't `false`. The component leaves the input's own
   * `indeterminate` property alone, so a ref can set it, and going from set
   * to unset clears it once and hands it back. It has no HTML attribute, so
   * server-rendered markup can't carry it, and a mixed card renders unmixed
   * until hydration.
   */
  indeterminate?: boolean;
  /**
   * Additional CSS classes, on the outer `<label>`, the card. That's the
   * element that declares the `--bulma-checkbox-card-*` variables, and
   * Bulma's `--bulma-card-*` ones, so a class is how to set one: `style` and
   * the other input attributes go to the `<input>`. Name `.checkbox-card`
   * beside your class in the selector, so it beats the card's own
   * declaration whatever order the stylesheets load in. A `color` prop
   * declares the active color again on `.checkbox-card.is-<color>`, which
   * ties that selector, so leave `color` unset when a class sets it.
   */
  className?: string;
}

/**
 * The `CheckboxCard` component is a checkbox drawn as a card, with a title and a description, that toggles wherever you click it.
 *
 * It's a `<label>` around a real checkbox, so it sends its `value` with a
 * form and Space toggles it. The title names the checkbox and the
 * description describes it. Alone it's one choice; inside `Checkboxes` it
 * takes the group's name and selection, as `Checkbox` does.
 *
 * @function
 * @param {CheckboxCardProps} props - Props for the CheckboxCard component.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the `<input>`.
 * @returns {JSX.Element} The rendered card.
 *
 * @example
 * <Checkboxes label="Add-ons" name="extras" defaultValue={['backups']}>
 *   <CheckboxCard value="backups" title="Daily backups" description="Kept for 30 days." />
 *   <CheckboxCard value="domain" title="Custom domain" description="Bring your own." />
 * </Checkboxes>
 */
export const CheckboxCard = forwardRef<HTMLInputElement, CheckboxCardProps>(
  (
    {
      title,
      description,
      children,
      hasIndicator = true,
      color,
      className,
      textColor,
      disabled: disabledProp,
      name,
      value,
      checked,
      defaultChecked,
      indeterminate,
      onChange,
      ...props
    },
    ref
  ) => {
    const disabled = useFieldsetDisabled(disabledProp);
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      ...props,
    });

    // The input's own ref, merged with the forwarded one, as Checkbox does,
    // so the mixed state can be set on it.
    const inputRef = useRef<HTMLInputElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') return ref(node);
        if (ref) ref.current = node;
      },
      [ref]
    );

    // `indeterminate` is a DOM property with no attribute, and a click clears
    // it, so it's set after every render while the prop is set, and cleared
    // once when the prop goes back to unset. Checkbox does the same.
    const ownsIndeterminateRef = useRef(false);
    useClientLayoutEffect(() => {
      if (indeterminate !== undefined) {
        ownsIndeterminateRef.current = true;
        inputRef.current!.indeterminate = indeterminate;
      } else if (ownsIndeterminateRef.current) {
        ownsIndeterminateRef.current = false;
        inputRef.current!.indeterminate = false;
      }
    });

    // A surrounding <Checkboxes> hands down its name and, when it manages
    // the selection, whether this card's value is in it. The card's own
    // props win, as they do on Checkbox. A group given only `onChange` holds
    // no value until its first change, and until then the card shows its own
    // `defaultChecked`, controlled all the same, and registers it, so that
    // change starts from what was checked, as Checkbox does.
    const group = useCheckboxesGroup();
    const effectiveName = name ?? group?.name;
    const valueKey = value === undefined ? undefined : String(value);
    const groupManaged =
      group?.onChange !== undefined && valueKey !== undefined;
    const effectiveChecked =
      checked !== undefined
        ? checked
        : groupManaged
          ? group!.value
            ? group!.value.includes(valueKey!)
            : !!defaultChecked
          : undefined;
    const effectiveDefaultChecked = groupManaged ? undefined : defaultChecked;
    useRegisterChecked(group, valueKey, !!(checked ?? defaultChecked));

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (indeterminate !== undefined) e.target.indeterminate = indeterminate;
        onChange?.(e);
        if (group?.onChange && valueKey !== undefined) {
          const current = group.value ?? group.startingValue!();
          group.onChange(
            e.target.checked
              ? current.includes(valueKey)
                ? current
                : [...current, valueKey]
              : current.filter(v => v !== valueKey)
          );
        }
      },
      [onChange, group, valueKey, indeterminate]
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

    const cardClass = usePrefixedClassNames('checkbox-card', 'card', {
      [`is-${color}`]: color && checkboxCardColors.includes(color),
    });
    const contentClass = usePrefixedClassNames(
      'card-content',
      'checkbox-card-content'
    );
    const checkClass = usePrefixedClassNames('checkbox-card-check');
    const bodyClass = usePrefixedClassNames('checkbox-card-body');
    const titleClass = usePrefixedClassNames('checkbox-card-title');
    const descriptionClass = usePrefixedClassNames('checkbox-card-description');

    return (
      <label className={classNames(cardClass, bulmaHelperClasses, className)}>
        <input
          ref={setRefs}
          type="checkbox"
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

CheckboxCard.displayName = 'CheckboxCard';

export default CheckboxCard;
