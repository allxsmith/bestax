import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

export interface FieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  horizontal?: boolean;
  grouped?: boolean | 'centered' | 'right' | 'multiline';
  hasAddons?: boolean;
  label?: React.ReactNode;
  labelSize?: 'small' | 'normal' | 'medium' | 'large'; // Optional: let user specify label size
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

export interface FieldLabelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  size?: 'small' | 'medium' | 'large';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

export interface FieldBodyProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

const FieldLabel: React.FC<FieldLabelProps> = ({
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
  return (
    <div className={fieldLabelClass} {...rest}>
      {children}
    </div>
  );
};

const FieldBody: React.FC<FieldBodyProps> = ({
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
  return (
    <div className={fieldBodyClass} {...rest}>
      {children}
    </div>
  );
};

const Field: React.FC<FieldProps> & {
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

  // If horizontal, default labelSize to undefined (normal) unless explicitly set
  const effectiveLabelSize = horizontal
    ? (labelSize ?? 'normal') // undefined means normal size (no Bulma size class)
    : labelSize;

  let renderedLabel = null;
  if (label) {
    if (horizontal) {
      renderedLabel = (
        <FieldLabel size={effectiveLabelSize}>
          <label
            {...labelProps}
            className={classNames('label', labelProps?.className)}
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
    content = <FieldBody>{children}</FieldBody>;
  }

  return (
    <div className={fieldClass} {...rest}>
      {renderedLabel}
      {content}
    </div>
  );
};

Field.Label = FieldLabel;
Field.Body = FieldBody;

export default Field;
