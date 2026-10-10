import React, { useId, useMemo } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import {
  FieldProvider,
  FieldLabelIdProvider,
  FieldLabelElementIdProvider,
  FieldLabelForProvider,
  useFieldLabelFor,
} from './FormContext';
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
  /** Field label, rendered above the widget. Automatically names the one control the Field holds: a composed `InputBase`, `SelectBase` or `TextAreaBase`, or a bestax input that renders a single input of its own (`Input`, `Select`, `TextArea`, `Numberinput`, `Slider`, `DateInput`, `TimeInput`, `DateTimeInput`, `Autocomplete`, `Taginput`, `File`), adopts a generated id that the label's `htmlFor` points at, and a group (`Radios`, `Checkboxes`, `Rate`, `DateRangeInput`) points `aria-labelledby` at the label's own id unless you gave the group an `aria-label` or `aria-labelledby`. A range `Slider` takes the id on its low thumb and also starts each thumb's name with the label through `aria-labelledby`, unless its `ariaLabel` names that thumb or its own `aria-label` or `aria-labelledby` takes the label's place. An `Autocomplete` also names its open suggestion list after the label through `aria-labelledby`. Nothing else takes the label: `Checkbox`, `Radio` and `Switch` are named by their own children. Only the single inputs take the `htmlFor`, so with a group or any other content it matches nothing. Pass `labelProps={{ htmlFor }}` to wire your own `id`, or `labelProps={{ htmlFor: undefined }}` to opt out. Skipped for `grouped`/`hasAddons` fields (multiple controls), and a nested `Field` starts its own scope, so a horizontal Field whose body holds an inner `Field` names the control there only when you wire it. Two controls in one plain labeled Field would both adopt the id, so give each an `id` of its own. */
  label?: React.ReactNode;
  /** Size for the label. */
  labelSize?: 'small' | 'normal' | 'medium' | 'large';
  /** Props for the label element. An explicit `htmlFor` key — even set to `undefined` — takes over the association. While the association is on, the label renders with the `id` given here, or a generated one, and a group control, a range `Slider`'s thumbs and an `Autocomplete`'s suggestion list point `aria-labelledby` at it. A label you take over gets no generated id, and no group points at it on its own. With an `id` here, though, a range `Slider` or an `Autocomplete` whose `id` your `htmlFor` names still points its thumbs or its suggestion list at it, in a `grouped` or `hasAddons` Field too. To point a group in an inner `Field` at this label by hand, pass that `id` with `htmlFor: undefined`, or the label keeps a generated `htmlFor` that nothing takes. */
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
 * // Labelled field — the label auto-associates with the composed base
 * <Field label="Email">
 *   <Control>
 *     <InputBase type="email" />
 *   </Control>
 * </Field>
 *
 * @example
 * // Horizontal field
 * <Field horizontal label="Name">
 *   <Control>
 *     <InputBase />
 *   </Control>
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
  // A group control (Radios, Checkboxes, Rate, DateRangeInput) cannot take
  // that `for`, so it points `aria-labelledby` at the label itself (#939).
  // The label gets an id whenever the association is on, unless the caller
  // gave it one.
  const labelId =
    labelProps?.id ?? (targetId ? `${targetId}-label` : undefined);
  // What the rendered label's `for` points at, generated or the caller's, and
  // the id it renders with, so a control can tell when a label wired by hand
  // names it and point at that label. An unlabeled Field passes on its
  // parent's. Unlike `targetId`, a label wired by hand passes on its own in
  // `grouped`/`hasAddons` Fields too, on purpose: those only stop the Field
  // picking one control out of several, and the caller's `for` has picked
  // one, so a range Slider or Autocomplete it names points at that label in
  // a row as well. A group reads the label element id below instead, which
  // stays off for a label wired by hand, since no group takes its `for`.
  const inheritedLabelFor = useFieldLabelFor();
  const labelForTarget = userWiredLabel ? labelProps.htmlFor : targetId;
  const ownLabelFor = useMemo(
    () => ({ htmlFor: labelForTarget, id: labelId }),
    [labelForTarget, labelId]
  );
  const labelFor = label ? ownLabelFor : inheritedLabelFor;

  let renderedLabel = null;
  if (label) {
    if (horizontal) {
      renderedLabel = (
        <FieldLabel size={effectiveLabelSize}>
          <label
            htmlFor={targetId}
            {...labelProps}
            id={labelId}
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
          id={labelId}
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
        <FieldLabelElementIdProvider value={targetId ? labelId : undefined}>
          <FieldLabelForProvider value={labelFor}>
            <div className={fieldClass} {...rest}>
              {renderedLabel}
              {content}
            </div>
          </FieldLabelForProvider>
        </FieldLabelElementIdProvider>
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
