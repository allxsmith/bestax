import React, { forwardRef } from 'react';
import {
  classNames,
  usePrefixedClassNames,
  prefixedClassNames,
} from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

/**
 * Props for the File component.
 *
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'|'black'|'dark'|'light'|'white'} [color] - Bulma color modifier for the file input.
 * @property {'small'|'medium'|'large'} [size] - Size modifier for the file input.
 * @property {boolean} [isBoxed] - Whether the file input is boxed.
 * @property {boolean} [isFullwidth] - Whether the file input expands to full width.
 * @property {boolean} [isRight] - Align file input to the right.
 * @property {boolean} [isCentered] - Center the file input.
 * @property {boolean} [hasName] - Show a file name indicator.
 * @property {React.ReactNode} [label] - Custom label text or node.
 * @property {React.ReactNode} [iconLeft] - Left icon element.
 * @property {React.ReactNode} [iconRight] - Right icon element.
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {string} [inputClassName] - Additional CSS classes for the input.
 * @property {string} [fileName] - File name to display.
 */
export interface FileProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'color' | 'type'
    >,
    Omit<BulmaClassesProps, 'color'> {
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
  size?: 'small' | 'medium' | 'large';
  isBoxed?: boolean;
  isFullwidth?: boolean;
  isRight?: boolean;
  isCentered?: boolean;
  hasName?: boolean;
  label?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  fileName?: string;
}

/**
 * Bulma File upload component with full Bulma helper class support.
 * isRight and isCentered are mutually exclusive (Bulma spec).
 *
 * @function
 * @param {FileProps} props - Props for the File component.
 * @returns {JSX.Element} The rendered file upload field.
 * @see {@link https://bulma.io/documentation/form/file/ | Bulma File documentation}
 */
export const File = forwardRef<HTMLInputElement, FileProps>(
  (
    {
      color,
      size,
      isBoxed,
      isFullwidth,
      isRight,
      isCentered,
      hasName,
      label,
      iconLeft,
      iconRight,
      className,
      inputClassName,
      fileName,
      ...props
    },
    ref
  ) => {
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

    return (
      <div className={fileClass}>
        <label className={usePrefixedClassNames('file-label')}>
          <input
            ref={ref}
            className={classNames(
              usePrefixedClassNames('file-input'),
              inputClassName
            )}
            type="file"
            {...rest}
          />
          <span className={usePrefixedClassNames('file-cta')}>
            {iconLeft && (
              <span className={prefixedClassNames(classPrefix, 'file-icon')}>
                {iconLeft}
              </span>
            )}
            <span className={usePrefixedClassNames('file-label')}>
              {label || 'Choose a file…'}
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
  }
);

File.displayName = 'File';

export default File;
