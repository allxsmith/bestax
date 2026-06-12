import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import {
  PickerPosition,
  DayOfWeek,
  PickerLabels,
  mergeLabels,
} from './_pickerInternals/pickerTypes';
import {
  formatDate,
  parseDate,
  DateFormatOption,
  DEFAULT_DATE_FORMAT,
} from './_pickerInternals/formatters';
import { isWithin, clampDate } from './_pickerInternals/dateUtils';
import { Calendar } from './_pickerInternals/Calendar';
import { PickerPopover } from './_pickerInternals/PickerPopover';
import { useNativeMobilePicker } from './_pickerInternals/useNativeMobilePicker';
import { useSegmentedEntry } from './_pickerInternals/useSegmentedEntry';
import { Icon } from '../elements/Icon';

const toIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const fromIsoDate = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

/**
 * Props for the raw DateInput base. Use the higher-level `DateInput` for
 * Field/Control composition; `DateInputBase` is the input + popover only.
 *
 * @property {Date | null} [value] - Controlled selected date.
 * @property {Date | null} [defaultValue] - Initial date for uncontrolled usage.
 * @property {(d: Date | null) => void} [onChange] - Fired when the value changes.
 * @property {() => void} [onOpen] - Fired when the popover opens.
 * @property {() => void} [onClose] - Fired when the popover closes.
 * @property {Date} [min] - Earliest selectable date.
 * @property {Date} [max] - Latest selectable date.
 * @property {boolean} [disabled] - Disable the input.
 * @property {boolean} [readOnly] - Make the input read-only.
 * @property {string} [placeholder] - Placeholder text.
 * @property {DateFormatOption} [format] - Token format string or `Intl.DateTimeFormat` options. Default `'YYYY-MM-DD'`.
 * @property {(s: string) => Date | null} [parse] - Custom parser (use when `format` is `Intl.DateTimeFormatOptions`).
 * @property {string} [locale] - BCP-47 locale tag for day/month names.
 * @property {boolean} [inline] - Render the calendar inline (no popover).
 * @property {boolean | 'auto'} [mobileNative] - Use native `<input type="date">` on coarse-pointer + small-viewport devices.
 * @property {boolean} [editable] - Allow segmented keyboard typing in the input (type the date directly, auto-advancing across segments). Default `true`.
 * @property {boolean} [popover] - Whether the calendar popover exists. `false` makes the field input-only (segmented typing with no popover). Default `true`.
 * @property {boolean} [openOnFocus] - Open the popover on focus. Default `true`.
 * @property {boolean} [closeOnSelect] - Close the popover after selection. Default `true`.
 * @property {PickerPosition} [position] - Popover anchor position.
 * @property {boolean} [appendToBody] - Render the popover into `document.body` via portal.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color modifier.
 * @property {'small'|'medium'|'large'} [size] - Size variant.
 * @property {boolean} [isRounded] - Render the input with rounded corners.
 * @property {(d: Date) => boolean} [shouldDisableDate] - Predicate to disable specific dates.
 * @property {Date[]} [unselectableDates] - Convenience array of disabled dates.
 * @property {DayOfWeek} [firstDayOfWeek] - Day the week starts on (0 = Sunday).
 * @property {string[]} [dayNames] - Override the 7 day-name labels.
 * @property {string[]} [monthNames] - Override the 12 month-name labels.
 * @property {boolean} [nearbyMonthDays] - Show dimmed dates from adjacent months. Default `true`.
 * @property {string} [iconLeftName] - Decorative left icon glyph for the wrapping Control (shown by default; set to '' to hide).
 * @property {boolean} [triggerIcon] - Show a clickable launcher button on the right that toggles the popover. Default `true`.
 * @property {string} [triggerIconName] - Glyph name for the right launcher button. Default `'chevron-down'`.
 */
export interface DateInputBaseProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      | 'value'
      | 'defaultValue'
      | 'onChange'
      | 'size'
      | 'color'
      | 'min'
      | 'max'
      | 'type'
      | 'popover'
    >,
    Omit<BulmaClassesProps, 'color'> {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (d: Date | null) => void;
  onOpen?: () => void;
  onClose?: () => void;
  min?: Date;
  max?: Date;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  format?: DateFormatOption;
  parse?: (s: string) => Date | null;
  locale?: string;
  inline?: boolean;
  mobileNative?: boolean | 'auto';
  editable?: boolean;
  popover?: boolean;
  openOnFocus?: boolean;
  closeOnSelect?: boolean;
  position?: PickerPosition;
  appendToBody?: boolean;
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isRounded?: boolean;
  shouldDisableDate?: (d: Date) => boolean;
  unselectableDates?: Date[];
  firstDayOfWeek?: DayOfWeek;
  dayNames?: string[];
  monthNames?: string[];
  nearbyMonthDays?: boolean;
  iconLeftName?: string;
  triggerIcon?: boolean;
  triggerIconName?: string;
  /** Optional translatable string overrides (ARIA labels, button text). */
  labels?: PickerLabels;
}

/**
 * Raw DateInput — input + popover calendar without Field/Control wrapping.
 * Use `DateInput` for the convenience wrapper.
 *
 * @function
 * @param {DateInputBaseProps} props
 * @returns {JSX.Element}
 */
export const DateInputBase = forwardRef<HTMLInputElement, DateInputBaseProps>(
  (props, ref) => {
    const {
      value: controlledValue,
      defaultValue,
      onChange,
      onOpen,
      onClose,
      min,
      max,
      disabled,
      readOnly,
      placeholder,
      format,
      parse,
      locale,
      inline = false,
      mobileNative = 'auto',
      editable = true,
      popover = true,
      openOnFocus = true,
      closeOnSelect = true,
      position = 'bottom-left',
      appendToBody = false,
      color,
      size,
      isRounded,
      shouldDisableDate,
      unselectableDates,
      firstDayOfWeek = 0,
      dayNames,
      monthNames,
      nearbyMonthDays = true,
      className,
      name,
      form,
      required,
      id,
      onFocus,
      onClick,
      onKeyDown,
      onBlur,
      iconLeftName: _iconLeftName,
      triggerIcon = true,
      triggerIconName = 'chevron-down',
      labels,
      ...rest
    } = props;

    const t = mergeLabels(labels);

    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<Date | null>(
      defaultValue ?? null
    );
    const value = isControlled ? (controlledValue ?? null) : internalValue;

    const initialFocused = useMemo(
      () => clampDate(value ?? new Date(), min, max),
      // intentionally only on mount: keep focusedDate stable until value/open change
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );
    const [focusedDate, setFocusedDate] = useState<Date>(initialFocused);
    // Re-clamp focusedDate if min/max change after mount so the focused cell
    // never disappears outside the displayable range.
    useEffect(() => {
      setFocusedDate(prev => clampDate(prev, min, max));
    }, [min, max]);
    const [open, setOpenState] = useState(false);
    const [text, setText] = useState<string>(
      value ? formatDate(value, format, locale) : ''
    );

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const reactId = useId();
    const popoverId = id ? `${id}-popover` : `picker-${reactId}`;

    const { bulmaHelperClasses, rest: cleanRest } = useBulmaClasses(rest);

    const { shouldUseNative } = useNativeMobilePicker({
      force: mobileNative === 'auto' ? undefined : mobileNative,
    });
    const useNative = !inline && shouldUseNative;

    const inputClass = usePrefixedClassNames('input', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
      'is-rounded': isRounded,
    });
    const containerClass = usePrefixedClassNames('dateinput-container');
    const triggerClass = usePrefixedClassNames('dateinput-trigger');

    const setOpen = useCallback(
      (next: boolean) => {
        setOpenState(prev => {
          if (prev === next) return prev;
          if (next) onOpen?.();
          else onClose?.();
          return next;
        });
      },
      [onOpen, onClose]
    );

    // Sync displayed text with value when value changes externally.
    useEffect(() => {
      setText(value ? formatDate(value, format, locale) : '');
    }, [value, format, locale]);

    const commitValue = useCallback(
      (next: Date | null) => {
        if (!isControlled) setInternalValue(next);
        // Keep the calendar's focused cell tracking typed / parsed values.
        if (next) setFocusedDate(next);
        onChange?.(next);
      },
      [isControlled, onChange]
    );

    const handleSelect = useCallback(
      (d: Date) => {
        if (!isWithin(d, min, max)) return;
        commitValue(d);
        setFocusedDate(d);
        if (closeOnSelect) setOpen(false);
      },
      [min, max, commitValue, closeOnSelect, setOpen]
    );

    const tryParse = useCallback(
      (s: string): Date | null => {
        const trimmed = s.trim();
        if (!trimmed) return null;
        const fmt = typeof format === 'string' ? format : undefined;
        return parse
          ? parse(trimmed)
          : parseDate(trimmed, fmt ?? DEFAULT_DATE_FORMAT, locale);
      },
      [parse, format, locale]
    );

    // The Date the user edits when starting without a current value (today at
    // midnight; the hook clamps to min/max on commit).
    const makeBaseDate = useCallback((): Date => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }, []);

    const inputReadOnlyAttr = !!readOnly || !editable;
    const canOpen = !!popover && !disabled && !readOnly;

    const { inputHandlers } = useSegmentedEntry({
      format: format ?? DEFAULT_DATE_FORMAT,
      value,
      commitValue,
      formatFn: formatDate,
      tryParse,
      text,
      setText,
      makeBaseDate,
      locale,
      min,
      max,
      disabled,
      readOnly,
      editable,
      popover,
      openOnFocus,
      closeOnSelect,
      isOpen: open,
      setOpen,
      inputRef,
      containerRef,
      onFocus,
      onClick,
      onKeyDown,
      onBlur,
    });

    const handlePopoverClose = useCallback(() => setOpen(false), [setOpen]);

    const combinedRef = useCallback(
      (node: HTMLInputElement | null) => {
        (inputRef as React.MutableRefObject<HTMLInputElement | null>).current =
          node;
        if (typeof ref === 'function') ref(node);
        else if (ref)
          (ref as React.MutableRefObject<HTMLInputElement | null>).current =
            node;
      },
      [ref]
    );

    // Native mobile path renders <input type="date">.
    if (useNative) {
      return (
        <input
          {...cleanRest}
          ref={combinedRef}
          type="date"
          className={classNames(inputClass, bulmaHelperClasses, className)}
          value={value ? toIsoDate(value) : ''}
          onChange={e => {
            const parsed = e.target.value ? fromIsoDate(e.target.value) : null;
            commitValue(parsed);
          }}
          min={min ? toIsoDate(min) : undefined}
          max={max ? toIsoDate(max) : undefined}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          name={name}
          form={form}
          required={required}
          id={id}
        />
      );
    }

    const calendar = (
      <Calendar
        value={value}
        focusedDate={focusedDate}
        onSelect={handleSelect}
        onFocusedDateChange={setFocusedDate}
        min={min}
        max={max}
        shouldDisableDate={shouldDisableDate}
        unselectableDates={unselectableDates}
        firstDayOfWeek={firstDayOfWeek}
        locale={locale}
        dayNames={dayNames}
        monthNames={monthNames}
        nearbyMonthDays={nearbyMonthDays}
        color={color}
        size={size}
        id={popoverId}
        autoFocusCell={open}
        labels={labels}
      />
    );

    if (inline) {
      return (
        <div
          {...cleanRest}
          ref={containerRef}
          className={classNames(containerClass, bulmaHelperClasses, className)}
        >
          {calendar}
          {name && (
            <input
              type="hidden"
              name={name}
              form={form}
              value={value ? toIsoDate(value) : ''}
              required={required}
            />
          )}
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={classNames(containerClass, bulmaHelperClasses, className)}
        {...cleanRest}
      >
        <input
          ref={combinedRef}
          type="text"
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={popoverId}
          autoComplete="off"
          className={inputClass}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={inputReadOnlyAttr}
          name={name}
          form={form}
          required={required}
          id={id}
          {...inputHandlers}
        />
        {popover && triggerIcon && (
          <button
            type="button"
            className={triggerClass}
            onClick={() => {
              if (canOpen) setOpen(!open);
            }}
            disabled={!canOpen}
            aria-label={t.chooseDate}
            aria-haspopup="dialog"
            aria-controls={popoverId}
            aria-expanded={open}
            tabIndex={canOpen ? 0 : -1}
          >
            <Icon name={triggerIconName} size={size} />
          </button>
        )}
        {popover && (
          <PickerPopover
            isOpen={open}
            onClose={handlePopoverClose}
            anchorRef={containerRef}
            position={position}
            appendToBody={appendToBody}
            ariaLabel={t.chooseDate}
            id={popoverId}
          >
            {calendar}
          </PickerPopover>
        )}
      </div>
    );
  }
);

DateInputBase.displayName = 'DateInputBase';

export default DateInputBase;
