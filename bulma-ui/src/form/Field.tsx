import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { FieldProvider } from './FormContext';
import { Control } from './Control';

/**
 * Props for the Field component.
 *
 * @property {boolean} [horizontal] - Renders the field as horizontal (label and control side by side).
 * @property {boolean|'centered'|'right'|'multiline'} [grouped] - Group controls in a row (optionally centered, right, or multiline).
 * @property {boolean|'centered'|'right'} [hasAddons] - Group controls as addons (optionally centered or right-aligned).
 * @property {boolean} [narrow] - Constrains the field to its content's width (used inside horizontal field bodies).
 * @property {React.ReactNode} [label] - Field label.
 * @property {'small'|'normal'|'medium'|'large'} [labelSize] - Size for the label.
 * @property {object} [labelProps] - Props for the label element.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color for the field.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color for the field.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color for the field.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Field content.
 */
export interface FieldProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  horizontal?: boolean;
  grouped?: boolean | 'centered' | 'right' | 'multiline';
  hasAddons?: boolean | 'centered' | 'right';
  narrow?: boolean;
  label?: React.ReactNode;
  labelSize?: 'small' | 'normal' | 'medium' | 'large';
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Props for the FieldLabel component.
 *
 * @property {'small'|'normal'|'medium'|'large'} [size] - Size for the field label.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color for the label.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color for the label.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color for the label.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Field label content.
 */
export interface FieldLabelProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  size?: 'small' | 'normal' | 'medium' | 'large';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Props for the FieldBody component.
 *
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color for the field body.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color for the field body.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color for the field body.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Field body content.
 */
export interface FieldBodyProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

/**
 * FieldLabel component for rendering a Bulma field label.
 *
 * @function
 * @param {FieldLabelProps} props - Props for the FieldLabel component.
 * @returns {JSX.Element} The rendered field label.
 *
 * @example
 * <FieldLabel size="normal">Name</FieldLabel>
 */
export const FieldLabel: React.FC<FieldLabelProps> = ({
  size,
  textColor,
  bgColor,
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const mainClass = usePrefixedClassNames('field-label', {
    [`is-${size}`]: !!size,
  });
  const fieldLabelClass = classNames(mainClass, bulmaHelperClasses, className);
  // Spread ...props and ...rest so custom props like data-testid are included
  return (
    <div className={fieldLabelClass} {...props} {...rest}>
      {children}
    </div>
  );
};

/**
 * FieldBody component for rendering Bulma field body.
 *
 * @function
 * @param {FieldBodyProps} props - Props for the FieldBody component.
 * @returns {JSX.Element} The rendered field body.
 *
 * @example
 * <FieldBody><input className="input" /></FieldBody>
 */
export const FieldBody: React.FC<FieldBodyProps> = ({
  textColor,
  bgColor,
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const mainClass = usePrefixedClassNames('field-body');
  const fieldBodyClass = classNames(mainClass, bulmaHelperClasses, className);
  // Spread ...props and ...rest so custom props like data-testid are included
  return (
    <div className={fieldBodyClass} {...props} {...rest}>
      {children}
    </div>
  );
};

/**
 * Field component for rendering a Bulma field container.
 * Supports horizontal, grouped, and labelled fields.
 *
 * @function
 * @param {FieldProps} props - Props for the Field component.
 * @returns {JSX.Element} The rendered field container.
 * @see {@link https://bulma.io/documentation/form/general/#field | Bulma Field documentation}
 *
 * @example
 * // Labelled field
 * <Field label="Email">
 *   <input className="input" type="email" />
 * </Field>
 *
 * @example
 * // Horizontal field
 * <Field horizontal label="Name">
 *   <input className="input" />
 * </Field>
 */
const FieldComponent: React.FC<FieldProps> = ({
  horizontal,
  grouped,
  hasAddons,
  narrow,
  label,
  labelSize,
  labelProps,
  textColor,
  color: _fieldColor,
  bgColor,
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const mainClass = usePrefixedClassNames('field', {
    'is-horizontal': horizontal,
    'has-addons': !!hasAddons,
    'has-addons-centered': hasAddons === 'centered',
    'has-addons-right': hasAddons === 'right',
    'is-narrow': narrow,
    'is-grouped':
      grouped === true ||
      grouped === 'centered' ||
      grouped === 'right' ||
      grouped === 'multiline',
    'is-grouped-centered': grouped === 'centered',
    'is-grouped-right': grouped === 'right',
    'is-grouped-multiline': grouped === 'multiline',
  });
  const fieldClass = classNames(mainClass, bulmaHelperClasses, className);

  // Default labelSize to 'normal' when horizontal for proper baseline alignment
  const effectiveLabelSize = labelSize ?? (horizontal ? 'normal' : undefined);

  const labelClass = usePrefixedClassNames('label');

  let renderedLabel = null;
  if (label) {
    if (horizontal) {
      renderedLabel = (
        <FieldLabel size={effectiveLabelSize}>
          <label
            {...labelProps}
            className={classNames(labelClass, labelProps?.className)}
            style={labelProps?.style}
          >
            {label}
          </label>
        </FieldLabel>
      );
    } else {
      renderedLabel = (
        <label
          {...labelProps}
          className={classNames(labelClass, labelProps?.className)}
          style={{ display: 'block', ...(labelProps?.style || {}) }}
        >
          {label}
        </label>
      );
    }
  }

  // If horizontal, wrap children in FieldBody (unless the user already provided
  // a FieldBody — either as the single child, or as one element among siblings
  // like <Field.Label/> + <Field.Body/>).
  let content = children;
  if (horizontal) {
    const isFieldBody = (c: React.ReactNode): boolean =>
      React.isValidElement(c) &&
      // @ts-expect-error displayName isn't on the public type
      (c.type === FieldBody || c.type?.displayName === 'FieldBody');
    const isFieldLabel = (c: React.ReactNode): boolean =>
      React.isValidElement(c) &&
      // @ts-expect-error displayName isn't on the public type
      (c.type === FieldLabel || c.type?.displayName === 'FieldLabel');
    const childArray = React.Children.toArray(children);
    const userProvidedStructure = childArray.some(
      c => isFieldBody(c) || isFieldLabel(c)
    );
    if (userProvidedStructure) {
      content = children;
    } else {
      content = <FieldBody>{children}</FieldBody>;
    }
  }

  return (
    <FieldProvider value={true}>
      <div className={fieldClass} {...rest}>
        {renderedLabel}
        {content}
      </div>
    </FieldProvider>
  );
};

FieldLabel.displayName = 'FieldLabel';
FieldBody.displayName = 'FieldBody';

export const Field = withSubComponents(
  FieldComponent,
  {
    Label: FieldLabel,
    Body: FieldBody,
    Control,
  },
  'Field'
);

export default Field;
