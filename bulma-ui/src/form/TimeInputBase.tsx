import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import {
  PickerPosition,
  HourFormat,
  PickerLabels,
  mergeLabels,
} from './_pickerInternals/pickerTypes';
import {
  formatTime,
  hourCycleFromFormat,
  parseTime,
  DateFormatOption,
  DEFAULT_TIME_FORMAT_24,
  DEFAULT_TIME_FORMAT_12,
} from './_pickerInternals/formatters';
import {
  setTimeOfDay,
  isWithin,
  snapTimeToIncrement,
} from './_pickerInternals/dateUtils';
import { TimeWheels } from './_pickerInternals/TimeWheels';
import { PickerPopover } from './_pickerInternals/PickerPopover';
import { useNativeMobilePicker } from './_pickerInternals/useNativeMobilePicker';
import { useSegmentedEntry } from './_pickerInternals/useSegmentedEntry';
import { Icon } from '../elements/Icon';
import { Buttons } from '../elements/Buttons';

const toIsoTime = (d: Date, withSeconds: boolean): string => {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (!withSeconds) return `${hh}:${mm}`;
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

const fromIsoTime = (s: string): Date | null => {
  // The HTML time value may carry fractional seconds (the spec allows them
  // and some engines normalize to `:ss.sss`); accept and drop.
  const m = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/.exec(s);
  if (!m) return null;
  const today = new Date();
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    Number(m[1]),
    Number(m[2]),
    m[3] ? Number(m[3]) : 0,
    0
  );
};

/**
 * Props for the raw TimeInput base. Use the higher-level `TimeInput` for
 * Field/Control composition; `TimeInputBase` is the input + popover only.
 */
export interface TimeInputBaseProps
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
  /** Controlled selected time (date portion is preserved). */
  value?: Date | null;
  /** Initial value for uncontrolled usage. */
  defaultValue?: Date | null;
  /** Fired when the value changes. */
  onChange?: (d: Date | null) => void;
  /** Fired when the popover opens. */
  onOpen?: () => void;
  /** Fired when the popover closes. */
  onClose?: () => void;
  /** Earliest selectable time. */
  min?: Date;
  /** Latest selectable time. */
  max?: Date;
  /** Disable the input. */
  disabled?: boolean;
  /** Make the input read-only. */
  readOnly?: boolean;
  /** Placeholder text for the input. */
  placeholder?: string;
  /**
   * Token format string or `Intl.DateTimeFormat` options.
   * @defaultValue (see below)
   */
  format?: DateFormatOption;
  /** Custom parser. */
  parse?: (s: string) => Date | null;
  /** BCP-47 locale tag for Intl formatting. */
  locale?: string;
  /** Render the spinner inline (no popover). */
  inline?: boolean;
  /** Use `<input type="time">` on coarse-pointer + small-viewport devices. Use native `<input type="time">` on coarse-pointer devices. */
  mobileNative?: boolean | 'auto';
  /** Allow segmented keyboard typing in the input (type the time directly, auto-advancing across segments). `false` makes the field picker-only. Allow segmented keyboard typing in the input (type the time directly, auto-advancing across segments). Default `true`. */
  editable?: boolean;
  /** Whether the spinner popover exists. `false` makes the field input-only (segmented typing with no popover). Default `true`. */
  popover?: boolean;
  /** Open the popover when the input is focused. Open the popover on focus. Default `true`. */
  openOnFocus?: boolean;
  /** Close the popover after a time is selected (off by default). Close after selection. Default `false`. */
  closeOnSelect?: boolean;
  /** Popover anchor position relative to the input. */
  position?: PickerPosition;
  /** Render the popover into `document.body` via portal. */
  appendToBody?: boolean;
  /** Bulma color modifier. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Size variant. */
  size?: 'small' | 'medium' | 'large';
  /** Render the input with rounded corners. */
  isRounded?: boolean;
  /** Hour format. `'12'` shows an AM/PM toggle. `'12'` or `'24'`. Default `'24'`. */
  hourFormat?: HourFormat;
  /** Show a seconds column. Note: iOS Safari's native time picker UI does not include a seconds wheel; pass `mobileNative={false}` if you need one on iOS. Show a seconds column. Note: iOS Safari's native time picker has no seconds wheel; combine with `mobileNative={false}` if a seconds wheel is required on iOS. */
  enableSeconds?: boolean;
  /** Hour step for the spinner. Hour step. Default `1`. */
  incrementHours?: number;
  /** Minute step. Combine with `min`/`max` for slot-style pickers. Minute step. Default `1`. */
  incrementMinutes?: number;
  /** Second step. Default `1`. */
  incrementSeconds?: number;
  /** Predicate returning `true` for times that should be skipped. Blocked times are also rejected during manual typing. Predicate for blocked times (the spinner skips ahead; manual typing rejects them). */
  unselectableTimes?: (d: Date) => boolean;
  /** Decorative left icon glyph for the wrapping `Control` (shown by default). Set `''` to hide. */
  iconLeftName?: string;
  /** Show a clickable launcher button on the right that toggles the popover. Default `true`. */
  triggerIcon?: boolean;
  /** Glyph name for the right launcher button. Default `'chevron-down'`. */
  triggerIconName?: string;
  /** Optional translatable string overrides. */
  labels?: PickerLabels;
  /** Play a short audible click on each wheel-item crossing. Substitute for haptic feedback on iOS Safari (which has no web haptic API as of May 2026); on Android, `navigator.vibrate(5)` fires automatically regardless. Play a short audible tick on each wheel-item crossing. Provides a substitute for haptic feedback on iOS Safari, which has no web- accessible haptic API as of May 2026. Off by default to avoid surprising users with sound; the tick respects the device's silent switch and is suppressed when no audio device is available. */
  audioTick?: boolean;
  /** Auto-route platform-appropriate feedback: vibrate on Android (already happening), audio thunk on iOS (where vibrate is unavailable). One switch instead of platform-sniffing on the consumer side. `audioTick={true}` always wins. Auto-route platform-appropriate tactile feedback per wheel tick. When `true`: - On platforms where `navigator.vibrate` is implemented (Android Chrome / Firefox Android / Samsung Internet), the existing unconditional `navigator.vibrate(5)` carries the haptic — no audio is added (don't want to subject Android users to extra sound). - On platforms where `navigator.vibrate` is absent (notably iOS Safari, which has no web-accessible haptic API as of May 2026), the audio thunk is enabled automatically — same as setting `audioTick={true}` manually. - The visual band pulse fires regardless (gated only by `prefers-reduced-motion`). Off by default for backward compat. If `audioTick` is also set, the audio fires regardless of detection (manual opt-in wins). */
  haptics?: boolean;
}

/**
 * Raw TimeInput — input + popover spinner without Field/Control wrapping.
 * Use `TimeInput` for the convenience wrapper.
 *
 * @function
 * @param {TimeInputBaseProps} props
 * @returns {JSX.Element}
 */
export const TimeInputBase = forwardRef<HTMLInputElement, TimeInputBaseProps>(
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
      closeOnSelect = false,
      position = 'bottom-left',
      appendToBody = false,
      color,
      size,
      isRounded,
      hourFormat = '24',
      enableSeconds = false,
      incrementHours = 1,
      incrementMinutes = 1,
      incrementSeconds = 1,
      unselectableTimes,
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
      audioTick = false,
      haptics = false,
      ...rest
    } = props;

    // Platform-appropriate feedback routing: when `haptics` is opted in and
    // the runtime has no Vibration API (notably iOS Safari), enable the
    // audio thunk so the user still gets *some* tactile cue. When vibrate
    // is available (Android Chrome etc.), the existing unconditional
    // `navigator.vibrate(5)` carries the haptic — no audio added unless
    // the consumer explicitly set `audioTick`. `audioTick` always wins.
    const hasVibrate =
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function';
    const effectiveAudioTick = audioTick || (haptics && !hasVibrate);
    const t = mergeLabels(labels);

    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<Date | null>(
      defaultValue ?? null
    );
    const value = isControlled ? (controlledValue ?? null) : internalValue;

    const defaultFormat: DateFormatOption =
      format ??
      (hourFormat === '12'
        ? enableSeconds
          ? 'hh:mm:ss A'
          : DEFAULT_TIME_FORMAT_12
        : enableSeconds
          ? 'HH:mm:ss'
          : DEFAULT_TIME_FORMAT_24);

    // The displayed format is the source of truth for the hour cycle: an
    // explicit 12-hour `format` must drive a 12-hour wheel even when
    // `hourFormat` was left at its default. Fall back to the raw prop only when
    // the cycle can't be read from the format (an Intl-options object, or no
    // hour token).
    const effectiveHourFormat =
      hourCycleFromFormat(defaultFormat) ?? hourFormat;

    const [open, setOpenState] = useState(false);
    const [text, setText] = useState<string>(
      value ? formatTime(value, defaultFormat, locale) : ''
    );

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // Snapshot of value at the moment the popover opens, used by Cancel.
    const valueAtOpenRef = useRef<Date | null>(null);
    const reactId = useId();
    const popoverId = id ? `${id}-popover` : `picker-${reactId}`;

    const { bulmaHelperClasses, rest: cleanRest } = useBulmaClasses(rest);

    const { shouldUseNative, isSmallViewport } = useNativeMobilePicker({
      force: mobileNative === 'auto' ? undefined : mobileNative,
    });
    const useNative = !inline && shouldUseNative;
    const wheelItemHeight = isSmallViewport ? 40 : 32;

    const inputClass = usePrefixedClassNames('input', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
      'is-rounded': isRounded,
    });
    const containerClass = usePrefixedClassNames('timeinput-container');
    const triggerClass = usePrefixedClassNames('timeinput-trigger');
    const panelClass = usePrefixedClassNames('timeinput-panel');
    const footerClass = usePrefixedClassNames('timeinput-footer');
    const footerButton = usePrefixedClassNames('button', 'is-small');
    const footerOkClass = usePrefixedClassNames(
      'button',
      'is-small',
      'timeinput-footer-ok'
    );
    const mobileFooterClass = usePrefixedClassNames('timeinput-footer-mobile');
    const mobileFooterResetClass = usePrefixedClassNames(
      'timeinput-footer-reset'
    );
    const mobileFooterDoneClass = usePrefixedClassNames(
      'timeinput-footer-done'
    );

    const setOpen = useCallback(
      (next: boolean) => {
        setOpenState(prev => {
          if (prev === next) return prev;
          if (next) {
            valueAtOpenRef.current = value;
            onOpen?.();
          } else {
            onClose?.();
          }
          return next;
        });
      },
      [onOpen, onClose, value]
    );

    useEffect(() => {
      setText(value ? formatTime(value, defaultFormat, locale) : '');
    }, [value, defaultFormat, locale]);

    const commitValue = useCallback(
      (next: Date | null) => {
        if (!isControlled) setInternalValue(next);
        onChange?.(next);
      },
      [isControlled, onChange]
    );

    const handleSpinnerChange = useCallback(
      (parts: { hours: number; minutes: number; seconds?: number }) => {
        const base = value ?? new Date();
        const next = setTimeOfDay(base, parts);
        if (!isWithin(next, min, max)) return;
        commitValue(next);
      },
      [value, min, max, commitValue]
    );

    const tryParse = useCallback(
      (s: string): Date | null => {
        const trimmed = s.trim();
        if (!trimmed) return null;
        const fmt = typeof format === 'string' ? format : undefined;
        return parse
          ? parse(trimmed)
          : parseTime(
              trimmed,
              fmt ??
                (typeof defaultFormat === 'string'
                  ? defaultFormat
                  : DEFAULT_TIME_FORMAT_24)
            );
      },
      [parse, format, defaultFormat]
    );

    // The Date the user edits when starting without a current value. Noon so
    // the 12h / 24h hour calculations are unambiguous.
    const makeBaseDate = useCallback((): Date => {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      return d;
    }, []);

    const inputReadOnlyAttr = !!readOnly || !editable;
    const canOpen = !!popover && !disabled && !readOnly;

    const { inputHandlers } = useSegmentedEntry({
      format: defaultFormat,
      value,
      commitValue,
      formatFn: formatTime,
      tryParse,
      text,
      setText,
      makeBaseDate,
      locale,
      min,
      max,
      isBlocked: unselectableTimes,
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

    if (useNative) {
      const nativeStep = enableSeconds
        ? incrementSeconds
        : incrementMinutes * 60;
      return (
        <input
          {...cleanRest}
          ref={combinedRef}
          type="time"
          step={nativeStep}
          className={classNames(inputClass, bulmaHelperClasses, className)}
          value={value ? toIsoTime(value, enableSeconds) : ''}
          onChange={e => {
            const parsed = e.target.value ? fromIsoTime(e.target.value) : null;
            commitValue(parsed);
          }}
          min={min ? toIsoTime(min, enableSeconds) : undefined}
          max={max ? toIsoTime(max, enableSeconds) : undefined}
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

    const spinnerValue = {
      hours: value?.getHours() ?? 0,
      minutes: value?.getMinutes() ?? 0,
      seconds: enableSeconds ? (value?.getSeconds() ?? 0) : undefined,
    };

    const panel = (
      <div className={panelClass}>
        <TimeWheels
          value={spinnerValue}
          onChange={handleSpinnerChange}
          hourFormat={effectiveHourFormat}
          enableSeconds={enableSeconds}
          incrementHours={incrementHours}
          incrementMinutes={incrementMinutes}
          incrementSeconds={incrementSeconds}
          unselectableTimes={unselectableTimes}
          color={color}
          size={size}
          disabled={disabled}
          id={popoverId}
          labels={labels}
          itemHeight={wheelItemHeight}
          audioTick={effectiveAudioTick}
          onCommit={() => setOpen(false)}
        />
        {/* Footer is popover-only. Desktop gets the OK / Now / Cancel triad;
            mobile drops to an iOS-style "Reset / ✓" pair to match the OS
            picker's footer affordances and free up vertical space on small
            screens. */}
        {!inline && !isSmallViewport && (
          <Buttons className={footerClass} hasAddons>
            <button
              type="button"
              className={footerOkClass}
              onClick={() => setOpen(false)}
            >
              {t.ok}
            </button>
            <button
              type="button"
              className={footerButton}
              onClick={() => {
                commitValue(
                  snapTimeToIncrement(new Date(), {
                    incrementHours,
                    incrementMinutes,
                    incrementSeconds,
                    enableSeconds,
                  })
                );
                setOpen(false);
              }}
            >
              {t.now}
            </button>
            <button
              type="button"
              className={footerButton}
              onClick={() => {
                commitValue(valueAtOpenRef.current);
                setOpen(false);
              }}
            >
              {t.cancel}
            </button>
          </Buttons>
        )}
        {!inline && isSmallViewport && (
          <div className={mobileFooterClass}>
            <button
              type="button"
              className={mobileFooterResetClass}
              onClick={() => {
                commitValue(valueAtOpenRef.current);
                setOpen(false);
              }}
            >
              {t.reset}
            </button>
            <button
              type="button"
              className={mobileFooterDoneClass}
              aria-label={t.done}
              onClick={() => setOpen(false)}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                aria-hidden="true"
              >
                <path
                  d="M5 11l4 4 8-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    );

    if (inline) {
      return (
        <div
          {...cleanRest}
          ref={containerRef}
          className={classNames(containerClass, bulmaHelperClasses, className)}
        >
          {panel}
          {name && (
            <input
              type="hidden"
              name={name}
              form={form}
              value={value ? toIsoTime(value, enableSeconds) : ''}
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
            aria-label={t.chooseTime}
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
            onClose={() => setOpen(false)}
            anchorRef={containerRef}
            position={position}
            appendToBody={appendToBody}
            ariaLabel={t.chooseTime}
            id={popoverId}
          >
            {panel}
          </PickerPopover>
        )}
      </div>
    );
  }
);

TimeInputBase.displayName = 'TimeInputBase';

export default TimeInputBase;
