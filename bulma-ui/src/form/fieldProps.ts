import React from 'react';

/**
 * Shared props for form components that render an optional Field wrapper.
 * When these props are provided and the component is not already inside a Field,
 * it will automatically render a Field around itself.
 */
export interface FormFieldProps {
  /** Field label. */
  label?: React.ReactNode;
  /** Size for the label (used in horizontal layouts). */
  labelSize?: 'small' | 'normal' | 'medium' | 'large';
  /** Props for the label element. */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  /** Horizontal field layout. */
  horizontal?: boolean;
  /** Help/validation message below the input. */
  message?: React.ReactNode;
  /** Bulma color for the message. */
  messageColor?:
    | 'primary'
    | 'link'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger';
  /** Additional CSS classes for the Field wrapper. */
  fieldClassName?: string;
}
