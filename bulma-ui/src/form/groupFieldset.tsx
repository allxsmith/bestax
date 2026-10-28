import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { FieldProvider } from './FormContext';
import type { FormFieldProps } from './fieldProps';

interface GroupFieldsetProps {
  /** The group's label, rendered as the `<legend>`. */
  label: React.ReactNode;
  /** Sizes the legend's label column when `horizontal`. */
  labelSize?: FormFieldProps['labelSize'];
  /** Props for the element that shows the label; any `htmlFor` is dropped. */
  labelProps?: FormFieldProps['labelProps'];
  /** Puts the legend in the label column and the rest in the body. */
  horizontal?: boolean;
  /** Set on the `<fieldset>` beside its `field` class. */
  fieldClassName?: string;
  /** The group's role, when it isn't the fieldset's own `group`. */
  role?: 'radiogroup';
  /** The group's own attributes: they describe the group, so they go on the `<fieldset>`. */
  attributes: object;
  /** The group's help text, after the content. */
  message: React.ReactNode;
  /** The group's content: its `Control` and the box of choices. */
  children: React.ReactNode;
}

/**
 * The `Field` a `Checkboxes` or `Radios` with `as="fieldset"` renders of its
 * own, as a native `<fieldset>`: Bulma's field markup, with its label as the
 * `<legend>` (inside the `field-label` column when horizontal), so the legend
 * names the group and needs no id. It holds a `Field`'s place for what is
 * inside, so the choices read as inside a `Field`. Internal; not part of the
 * public API.
 */
export const GroupFieldset: React.FC<GroupFieldsetProps> = ({
  label,
  labelSize,
  labelProps,
  horizontal,
  fieldClassName,
  role,
  attributes,
  message,
  children,
}) => {
  const fieldClass = usePrefixedClassNames('field', {
    'is-horizontal': !!horizontal,
  });
  const labelClass = usePrefixedClassNames('label');
  const fieldLabelClass = usePrefixedClassNames('field-label', {
    [`is-${labelSize || 'normal'}`]: true,
  });
  const fieldBodyClass = usePrefixedClassNames('field-body');

  // A legend names its fieldset with no `for`, so a `htmlFor` has nothing
  // to point at.
  const {
    htmlFor: _htmlFor,
    className: labelClassName,
    ...ownLabelProps
  } = labelProps ?? {};
  void _htmlFor;
  const shownLabel = {
    ...ownLabelProps,
    className: classNames(labelClass, labelClassName as string | undefined),
  } as React.HTMLAttributes<HTMLElement>;

  let legend: React.ReactNode = null;
  if (label) {
    legend = horizontal ? (
      <legend className={fieldLabelClass}>
        <span {...shownLabel}>{label}</span>
      </legend>
    ) : (
      <legend {...shownLabel}>{label}</legend>
    );
  }

  return (
    <FieldProvider value={true}>
      <fieldset
        className={classNames(fieldClass, fieldClassName)}
        role={role}
        {...attributes}
      >
        {legend}
        {horizontal ? (
          <div className={fieldBodyClass}>
            {children}
            {message}
          </div>
        ) : (
          <>
            {children}
            {message}
          </>
        )}
      </fieldset>
    </FieldProvider>
  );
};
