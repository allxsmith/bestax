import React, { forwardRef, useEffect, useState } from 'react';
import {
  classNames,
  usePrefixedClassNames,
  prefixedClassNames,
} from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';
import {
  useInsideField,
  useInsideControl,
  rendersOwnField,
} from './FormContext';
import { Field } from './Field';
import { FormFieldProps } from './fieldProps';
import { useAutoLabelId } from './useAutoLabelId';

/**
 * Props for the File component.
 * Inside an outer `Field`, or a `Control` with no `Field` around it, it
 * renders no `Field` of its own. The exception is `label`, `message`,
 * `horizontal` or `fieldClassName` in that bare `Control`: it keeps a `Field`
 * for them, nested in the `.control`, and warns in development. Wrap the
 * `Control` in a `Field` instead, and set the `label`, `horizontal` and class
 * name on that `Field`.
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
  /** Whether the file input expands to full width. @deprecated Use `isFullwidth` instead — `isFullwidth` wins if both are set. */
  isFullWidth?: boolean;
  /** Position the CTA on the right (with `hasName`). */
  isRight?: boolean;
  /** Center the file input within its container. */
  isCentered?: boolean;
  /**
   * Show a file name area. Without `fileName` it shows what the user picked: the file's name, or
   * a count when `multiple` lets them pick several (see `pickedFilesLabel`). Before a pick there is
   * no name area. A reset of the input's form clears the name, but clearing the input from code
   * fires no change event and leaves it showing, so pass `fileName` to control the text then.
   */
  hasName?: boolean;
  /** Text on the file CTA button (defaults to "Choose a file…"). */
  buttonLabel?: React.ReactNode;
  /**
   * Left icon element. It renders inside the `<label>` that names the file input, beside
   * `buttonLabel`, so pass an `Icon` with `aria-hidden` (`<Icon name="upload" aria-hidden="true" />`);
   * otherwise its default `aria-label="icon"` becomes part of the input's accessible name.
   */
  iconLeft?: React.ReactNode;
  /**
   * Right icon element. Sits inside the same `<label>` as `iconLeft`, so the same applies:
   * give an `Icon` here `aria-hidden`, or "icon" joins the input's accessible name.
   */
  iconRight?: React.ReactNode;
  /** Additional CSS classes to apply. */
  className?: string;
  /** Additional CSS classes for the `<input>`. */
  inputClassName?: string;
  /**
   * Text for the file name area (with `hasName`), for a file chosen earlier or your own wording.
   * Setting it takes over from the picked file's name; an empty string shows no name area.
   */
  fileName?: string;
  /**
   * Builds the text `hasName` shows when several files are picked, from their count, for
   * localization. Default: `` `${count} files` ``. A single pick shows its file's name.
   */
  pickedFilesLabel?: (count: number) => string;
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
      isFullWidth,
      isRight,
      isCentered,
      hasName,
      buttonLabel,
      iconLeft,
      iconRight,
      className,
      inputClassName,
      fileName,
      pickedFilesLabel,
      onChange,
      ...props
    },
    ref
  ) => {
    // What the user last picked, and the form a reset of which clears it.
    const [picked, setPicked] = useState<{
      count: number;
      firstName: string;
      form: HTMLFormElement | null;
    }>();
    const pickedForm = picked?.form;
    useEffect(() => {
      if (!pickedForm) return;
      let timer: ReturnType<typeof setTimeout> | undefined;
      // The reset event fires before the form resets, and a listener after this one can still
      // cancel it, so the name is cleared a task later, and only if the reset went ahead.
      const onReset = (event: Event) => {
        timer = setTimeout(() => {
          if (!event.defaultPrevented) setPicked(undefined);
        });
      };
      pickedForm.addEventListener('reset', onReset);
      return () => {
        pickedForm.removeEventListener('reset', onReset);
        clearTimeout(timer);
      };
    }, [pickedForm]);
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const { files, form } = event.target;
      setPicked(
        files?.length
          ? { count: files.length, firstName: files[0].name, form }
          : undefined
      );
      onChange?.(event);
    };
    const pickedText =
      picked &&
      (picked.count === 1
        ? picked.firstName
        : (pickedFilesLabel?.(picked.count) ?? `${picked.count} files`));
    const shownName = fileName ?? pickedText;

    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const ownField = rendersOwnField('File', {
      insideField,
      insideControl,
      label,
      message,
      horizontal,
      fieldClassName,
    });
    const { controlId, fieldLabelProps } = useAutoLabelId({
      label,
      id: props.id,
      labelProps,
      rendersLabel: ownField,
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
      'is-fullwidth': isFullwidth ?? isFullWidth,
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
            onChange={handleChange}
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
          {hasName && shownName && (
            <span className={prefixedClassNames(classPrefix, 'file-name')}>
              {shownName}
            </span>
          )}
        </label>
      </div>
    );

    if (ownField) {
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
