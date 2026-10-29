import React, { forwardRef, useId } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import {
  ControlProvider,
  FieldLabelElementIdProvider,
  FieldLabelFor,
  FieldLabelForProvider,
  FieldLabelForReportProvider,
  FieldLabelIdProvider,
  FieldProvider,
  FieldsetDisabledProvider,
  useFieldsetDisabled,
} from './FormContext';
import type { FormFieldProps } from './fieldProps';

/** The looks a Fieldset comes in. */
export type FieldsetVariant = 'default' | 'filled' | 'unstyled';

/**
 * Props for the Fieldset component. The helper props, the other attributes
 * and the `ref` land on its `<fieldset>`.
 *
 * @extraProp {React.Ref<HTMLFieldSetElement>} [ref] - Ref forwarded to the `<fieldset>`, whose `elements` lists the controls inside.
 * @extraProp {string} [aria-describedby] - Ids of more text that describes the group. The `message`'s id is added after them.
 * @extraProp {string} [name] - The fieldset's name in its form's `elements`. Nothing is submitted under it.
 */
export interface FieldsetProps
  extends
    Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * The group's name, shown in a `<legend>`, which names the fieldset with no
   * ids to wire. The `default` and `filled` variants draw it on the border,
   * and `unstyled` above the content. Controls you put in it, such as a
   * `Checkbox` that turns the section on, stay enabled when the Fieldset is
   * disabled, as the browser leaves them.
   */
  legend?: React.ReactNode;
  /** Props for the `<legend>`, such as an `id` or a `className`. */
  legendProps?: React.HTMLAttributes<HTMLLegendElement>;
  /**
   * The look: `default` draws a border round the group, `filled` adds a
   * tinted background, and `unstyled` draws no box at all, which suits a
   * Fieldset that's there to name or disable a group.
   */
  variant?: FieldsetVariant;
  /**
   * Disables every control inside. The browser disables the native ones and
   * leaves them out of the form's data, and each bestax input with a
   * `disabled` prop takes this as that prop's default, which also stops
   * widgets the browser doesn't reach, such as `Rate`'s stars and the time
   * wheels, and gives them their disabled look. An input's own `disabled`
   * still wins when you set it, though the browser keeps its native parts
   * disabled whatever it says. Links and `LinkButton`s stay operable, as in
   * plain HTML.
   */
  disabled?: boolean;
  /**
   * Help text under the group. It describes the fieldset through
   * `aria-describedby`, alongside any ids you pass there. Nothing passes it
   * to the inputs, so each still shows its own errors.
   */
  message?: React.ReactNode;
  /** Bulma color for the message. */
  messageColor?: FormFieldProps['messageColor'];
  /** Text color helper, for the text in the group. The legend keeps its own color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** The group's content, such as `Field`s and inputs. */
  children?: React.ReactNode;
}

// What an unlabeled Field passes on: no label names anything inside.
const NO_LABEL: FieldLabelFor = {};

/**
 * The `Fieldset` component groups a section of a form in a native
 * `<fieldset>`, named by its `legend`, which a `disabled` switches off as a
 * whole.
 *
 * It starts its own Field scope: inside it, nothing reads as inside a
 * `Field` or `Control`, so the convenience inputs render their own `Field`,
 * and a labeled `Field` around the Fieldset names nothing in it.
 *
 * @function
 * @param {FieldsetProps} props - Props for the Fieldset component.
 * @returns {JSX.Element} The rendered fieldset.
 *
 * @example
 * <Fieldset legend="Shipping address" message="We only ship within the EU.">
 *   <Input label="Street" name="street" />
 *   <Input label="City" name="city" />
 * </Fieldset>
 *
 * @example
 * // A form that's saving
 * <Fieldset disabled={saving} variant="unstyled">
 *   <Input label="Name" name="name" />
 *   <Rate label="Rating" name="rating" />
 * </Fieldset>
 */
export const Fieldset = forwardRef<HTMLFieldSetElement, FieldsetProps>(
  (
    {
      legend,
      legendProps,
      variant = 'default',
      disabled,
      message,
      messageColor,
      textColor,
      bgColor,
      className,
      children,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color: textColor,
      backgroundColor: bgColor,
      ...props,
    });

    const mainClass = usePrefixedClassNames('fieldset', {
      'is-filled': variant === 'filled',
      'is-unstyled': variant === 'unstyled',
    });
    const legendClass = usePrefixedClassNames('fieldset-legend');
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    // The legend's controls take the state from outside, as the browser
    // leaves the first legend's controls enabled, and the content takes this
    // Fieldset's on top of it, as a disabled one disables those inside it.
    const outerDisabled = useFieldsetDisabled(undefined);
    const groupDisabled = !!disabled || outerDisabled;

    const messageId = `${useId()}-message`;
    const describedBy =
      [ariaDescribedBy, message ? messageId : undefined]
        .filter(Boolean)
        .join(' ') || undefined;

    return (
      <FieldProvider value={false}>
        <ControlProvider value={false}>
          <FieldLabelIdProvider value={undefined}>
            <FieldLabelElementIdProvider value={undefined}>
              <FieldLabelForProvider value={NO_LABEL}>
                <FieldLabelForReportProvider value={undefined}>
                  <fieldset
                    ref={ref}
                    className={classNames(
                      mainClass,
                      bulmaHelperClasses,
                      className
                    )}
                    disabled={disabled}
                    aria-describedby={describedBy}
                    {...rest}
                  >
                    {legend ? (
                      <legend
                        {...legendProps}
                        className={classNames(
                          legendClass,
                          legendProps?.className
                        )}
                      >
                        {legend}
                      </legend>
                    ) : null}
                    <FieldsetDisabledProvider value={groupDisabled}>
                      {children}
                    </FieldsetDisabledProvider>
                    {message ? (
                      <p id={messageId} className={helpClass}>
                        {message}
                      </p>
                    ) : null}
                  </fieldset>
                </FieldLabelForReportProvider>
              </FieldLabelForProvider>
            </FieldLabelElementIdProvider>
          </FieldLabelIdProvider>
        </ControlProvider>
      </FieldProvider>
    );
  }
);

Fieldset.displayName = 'Fieldset';

export default Fieldset;
