import React, { useId } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { FieldProvider, FieldLabelIdProvider } from './FormContext';
import { Control } from './Control';

/**
 * Props for the Field component.
 */
export interface FieldProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Renders the field as horizontal (label and control side by side). */
  horizontal?: boolean;
  /** Group controls in a row (optionally centered, right, or multiline). */
  grouped?: boolean | 'centered' | 'right' | 'multiline';
  /** Group controls as addons (optionally centered or right-aligned). */
  hasAddons?: boolean | 'centered' | 'right';
  /** Constrains the field to its content's width (used inside horizontal field bodies). */
  narrow?: boolean;
  /** Field label, rendered above the widget. Automatically associated with a single composed `InputBase`, `SelectBase`, or `TextAreaBase` via a generated id and `htmlFor`. Pass `labelProps={{ htmlFor }}` to wire your own `id`, or `labelProps={{ htmlFor: undefined }}` to opt out. Skipped for `grouped`/`hasAddons` fields (multiple controls). */
  label?: React.ReactNode;
  /** Size for the label. */
  labelSize?: 'small' | 'normal' | 'medium' | 'large';
  /** Props for the label element. An explicit `htmlFor` key — even set to `undefined` — takes over the association. */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  /** Text color for the field. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color for the field. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color for the field. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Field content. */
  children?: React.ReactNode;
}

/**
 * Props for the FieldLabel component.
 */
export interface FieldLabelProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Size for the field label. */
  size?: 'small' | 'normal' | 'medium' | 'large';
  /** Text color for the label. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color for the label. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color for the label. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Field label content. */
  children?: React.ReactNode;
}

/**
 * Props for the FieldBody component.
 */
export interface FieldBodyProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Text color for the field body. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color for the field body. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color for the field body. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Field body content. */
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
 * The `Field` component is a Bulma-styled form field container.
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

  // Auto-associate the label with a single composed base control (#495): the
  // label points at a generated id shared via context, which InputBase/
  // SelectBase/TextAreaBase adopt when the user supplied no id of their own.
  // Presence semantics on htmlFor — even an explicit `htmlFor: undefined`
  // means the caller owns the association. Grouped/addons fields hold several
  // controls, so no single association is generated for them.
  const generatedId = useId();
  const userWiredLabel = !!labelProps && 'htmlFor' in labelProps;
  const targetId =
    label && !userWiredLabel && !grouped && !hasAddons
      ? generatedId
      : undefined;

  let renderedLabel = null;
  if (label) {
    if (horizontal) {
      renderedLabel = (
        <FieldLabel size={effectiveLabelSize}>
          <label
            htmlFor={targetId}
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
          htmlFor={targetId}
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
      <FieldLabelIdProvider value={targetId}>
        <div className={fieldClass} {...rest}>
          {renderedLabel}
          {content}
        </div>
      </FieldLabelIdProvider>
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
