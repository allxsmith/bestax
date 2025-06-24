import React, { forwardRef } from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

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
  fileName?: string; // For custom file name display
}

/**
 * Bulma File upload component with full Bulma helper class support.
 * isRight and isCentered are mutually exclusive (Bulma spec).
 */
const File = forwardRef<HTMLInputElement, FileProps>(
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
    const { bulmaHelperClasses, rest } = useBulmaClasses({
      color,
      ...props,
    });

    // Mutually exclusive alignment
    let alignmentClass: string | undefined;
    if (isRight && isCentered) {
      // If both are set, prefer isRight and warn in dev
      alignmentClass = 'is-right';
    } else if (isRight) {
      alignmentClass = 'is-right';
    } else if (isCentered) {
      alignmentClass = 'is-centered';
    }

    const fileClass = classNames(
      'file',
      bulmaHelperClasses,
      {
        [`is-${color}`]: color,
        [`is-${size}`]: size,
        'is-boxed': isBoxed,
        'is-fullwidth': isFullwidth,
        'has-name': hasName,
      },
      alignmentClass,
      className
    );

    return (
      <div className={fileClass}>
        <label className="file-label">
          <input
            ref={ref}
            className={classNames('file-input', inputClassName)}
            type="file"
            {...rest}
          />
          <span className="file-cta">
            {iconLeft && <span className="file-icon">{iconLeft}</span>}
            <span className="file-label">{label || 'Choose a file…'}</span>
            {iconRight && <span className="file-icon">{iconRight}</span>}
          </span>
          {hasName && fileName && <span className="file-name">{fileName}</span>}
        </label>
      </div>
    );
  }
);

File.displayName = 'File';

export default File;
