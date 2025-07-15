import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Field component.
 *
 * @property {boolean} [horizontal] - Renders the field as horizontal (label and control side by side).
 * @property {boolean|'centered'|'right'|'multiline'} [grouped] - Group controls in a row (optionally centered, right, or multiline).
 * @property {boolean} [hasAddons] - Group controls as addons.
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
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  horizontal?: boolean;
  grouped?: boolean | 'centered' | 'right' | 'multiline';
  hasAddons?: boolean;
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
  extends React.HTMLAttributes<HTMLDivElement>,
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
  extends React.HTMLAttributes<HTMLDivElement>,
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

  const fieldLabelClass = classNames(
    'field-label',
    bulmaHelperClasses,
    { [`is-${size}`]: size },
    className
  );
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

  const fieldBodyClass = classNames(
    'field-body',
    bulmaHelperClasses,
    className
  );
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
 */
export const Field: React.FC<FieldProps> & {
  Label: typeof FieldLabel;
  Body: typeof FieldBody;
} = ({
  horizontal,
  grouped,
  hasAddons,
  label,
  labelSize,
  labelProps,
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

  const fieldClass = classNames(
    'field',
    bulmaHelperClasses,
    {
      'is-horizontal': horizontal,
      'has-addons': !!hasAddons,
      'is-grouped':
        grouped === true ||
        grouped === 'centered' ||
        grouped === 'right' ||
        grouped === 'multiline',
      'is-grouped-centered': grouped === 'centered',
      'is-grouped-right': grouped === 'right',
      'is-grouped-multiline': grouped === 'multiline',
    },
    className
  );

  // Map 'normal' to undefined for FieldLabel size prop
  const mappedLabelSize: FieldLabelProps['size'] =
    labelSize === 'normal' ? undefined : labelSize;

  let renderedLabel = null;
  if (label) {
    if (horizontal) {
      renderedLabel = (
        <FieldLabel size={mappedLabelSize}>
          <label
            {...labelProps}
            className={classNames('label', labelProps?.className)}
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
          className={classNames('label', labelProps?.className)}
          style={{ display: 'block', ...(labelProps?.style || {}) }}
        >
          {label}
        </label>
      );
    }
  }

  // If horizontal, wrap children in FieldBody (unless children is already a FieldBody)
  let content = children;
  if (horizontal) {
    // If children is a FieldBody already, don't double wrap
    // Simple check using displayName
    if (
      React.isValidElement(children) &&
      // @ts-expect-error children.type && children.type.displayName &&
      (children.type === FieldBody || children.type.displayName === 'FieldBody')
    ) {
      content = children;
    } else {
      content = <FieldBody>{children}</FieldBody>;
    }
  }

  return (
    <div className={fieldClass} {...rest}>
      {renderedLabel}
      {content}
    </div>
  );
};

FieldLabel.displayName = 'FieldLabel';
FieldBody.displayName = 'FieldBody';
Field.Label = FieldLabel;
Field.Body = FieldBody;

export default Field;
