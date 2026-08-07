import React, { forwardRef } from 'react';
import {
  classNames,
  usePrefixedClassNames,
  prefixedClassNames,
} from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';
import { useInsideField } from './FormContext';
import { Field } from './Field';
import { FormFieldProps } from './fieldProps';
import { useAutoLabelId } from './useAutoLabelId';

/**
 * Props for the File component.
 */
export interface FileProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'color' | 'type'
    >,
    Omit<BulmaClassesProps, 'color'>,
    FormFieldProps {
  /** Field label. Automatically associated with the file input via `htmlFor` — uses your `id` when provided, otherwise a generated one. The input then has two labels (this one plus the wrapping `file-label`); assistive tech reads both. Dropped inside an outer `Field` (label that `Field` yourself). */
  label?: React.ReactNode;
  /** Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then). */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  /** Bulma color modifier for the file input. */
  color?:
    | 'primary'
    | 'link'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'black'
    | 'dark'
    | 'light'
    | 'white';
  /** Size modifier for the file input. */
  size?: 'small' | 'medium' | 'large';
  /** Boxed file input. */
  isBoxed?: boolean;
  /** Whether the file input expands to full width. */
  isFullwidth?: boolean;
  /** Position the CTA on the right (with `hasName`). */
  isRight?: boolean;
  /** Center the file input within its container. */
  isCentered?: boolean;
  /** Show a file name indicator. */
  hasName?: boolean;
  /** Text on the file CTA button (defaults to "Choose a file…"). */
  buttonLabel?: React.ReactNode;
  /** Left icon element. */
  iconLeft?: React.ReactNode;
  /** Right icon element. */
  iconRight?: React.ReactNode;
  /** Additional CSS classes to apply. */
  className?: string;
  /** Additional CSS classes for the `<input>`. */
  inputClassName?: string;
  /** File name to display. */
  fileName?: string;
}

/**
 * The `File` component provides a Bulma-styled file input, supporting color, size, boxed/fullwidth/align styles, icons, "has name", and filename display.
 *
 * @function
 * @param {FileProps} props - Props for the File component.
 * @returns {JSX.Element} The rendered file upload field.
 * @see {@link https://bulma.io/documentation/form/file/ | Bulma File documentation}
 */
export const File = forwardRef<HTMLInputElement, FileProps>(
  (
    {
      // Field props
      label,
      labelSize,
      labelProps,
      horizontal,
      message,
      messageColor,
      fieldClassName,
      color,
      size,
      isBoxed,
      isFullwidth,
      isRight,
      isCentered,
      hasName,
      buttonLabel,
      iconLeft,
      iconRight,
      className,
      inputClassName,
      fileName,
      ...props
    },
    ref
  ) => {
    const insideField = useInsideField();
    const { controlId, fieldLabelProps } = useAutoLabelId({
      label,
      id: props.id,
      labelProps,
      rendersLabel: !insideField,
    });
    const { classPrefix } = useConfig();
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color,
      ...props,
    });

    // Mutually exclusive alignment
    let alignmentClass: string | undefined;
    if (isRight && isCentered) {
      // If both are set, prefer isRight and warn in dev
      alignmentClass = prefixedClassNames(classPrefix, 'is-right');
    } else if (isRight) {
      alignmentClass = prefixedClassNames(classPrefix, 'is-right');
    } else if (isCentered) {
      alignmentClass = prefixedClassNames(classPrefix, 'is-centered');
    }

    const mainClass = usePrefixedClassNames('file', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
      'is-boxed': isBoxed,
      'is-fullwidth': isFullwidth,
      'has-name': hasName,
    });
    const fileClass = classNames(
      mainClass,
      bulmaHelperClasses,
      alignmentClass,
      className
    );

    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });
    const messageEl = message ? <p className={helpClass}>{message}</p> : null;

    const fileElement = (
      <div className={fileClass}>
        <label className={usePrefixedClassNames('file-label')}>
          <input
            ref={ref}
            className={classNames(
              usePrefixedClassNames('file-input'),
              inputClassName
            )}
            type="file"
            id={controlId}
            {...rest}
          />
          <span className={usePrefixedClassNames('file-cta')}>
            {iconLeft && (
              <span className={prefixedClassNames(classPrefix, 'file-icon')}>
                {iconLeft}
              </span>
            )}
            <span className={usePrefixedClassNames('file-label')}>
              {buttonLabel || 'Choose a file\u2026'}
            </span>
            {iconRight && (
              <span className={prefixedClassNames(classPrefix, 'file-icon')}>
                {iconRight}
              </span>
            )}
          </span>
          {hasName && fileName && (
            <span className={prefixedClassNames(classPrefix, 'file-name')}>
              {fileName}
            </span>
          )}
        </label>
      </div>
    );

    if (!insideField) {
      return (
        <Field
          label={label}
          labelSize={labelSize}
          labelProps={fieldLabelProps}
          horizontal={horizontal}
          className={fieldClassName}
        >
          {fileElement}
          {messageEl}
        </Field>
      );
    }

    return (
      <>
        {fileElement}
        {messageEl}
      </>
    );
  }
);

File.displayName = 'File';

export default File;
