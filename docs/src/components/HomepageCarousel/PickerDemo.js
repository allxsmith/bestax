import { useCallback, useEffect, useRef, useState } from 'react';
import { DateInput, TimeInput, DateTimeInput } from '@allxsmith/bestax-bulma';
import useDemoLoop, { CANCELLED } from './useDemoLoop';
import { dispatchKey, dispatchClick } from './demoEvents';

// Rendered inside the shadow root, so its styles ship with it.
const DEMO_CSS = `
  .picker-demo {
    position: relative;
  }
`;

const KEY_MS = 150;

// Keystrokes for each picker's segmented input (June 15, 2026 / 9:30 PM)
const TYPE_KEYS = {
  date: ['2', '0', '2', '6', '0', '6', '1', '5'],
  time: ['0', '9', '3', '0', 'p'],
  datetime: ['2', '0', '2', '6', '0', '6', '1', '5'],
};

function dayCells(rootEl) {
  return [
    ...rootEl.querySelectorAll(
      '.dateinput-cell:not([disabled]):not(.is-other-month)'
    ),
  ];
}

function findWheelItem(rootEl) {
  const wheels = rootEl.querySelectorAll('.timeinput-wheel');
  // Minutes wheel when present, otherwise the first one
  const wheel = wheels[1] || wheels[0];
  if (!wheel) return null;
  const items = Array.from(
    wheel.querySelectorAll('.timeinput-wheel-item:not([disabled])')
  );
  if (!items.length) return null;
  const selectedIdx = items.findIndex(item =>
    item.className.includes('is-selected')
  );
  return items[selectedIdx + 2] || items[selectedIdx - 2] || items[0];
}

/**
 * Wraps a date/time picker with a scripted, looping demo. In popover mode the
 * input gets focused, a value is typed in, and a date/time gets clicked. In
 * `inline` mode the calendar/wheels are always visible and the demo just
 * selects values on a loop. Pauses on hover so the real picker stays usable.
 * `kind`: 'date' | 'time' | 'datetime'. `label` renders it as a form field.
 */
export default function PickerDemo({ kind, active, label, inline = false }) {
  const wrapperRef = useRef(null);
  const [value, setValue] = useState(null);
  const valueRef = useRef(setValue);
  valueRef.current = setValue;

  // Don't stay frozen mid-script when the picker is deselected / scrolled away
  useEffect(() => {
    if (!active) {
      setValue(null);
      const input = wrapperRef.current?.querySelector('input');
      if (input) {
        dispatchKey(input, 'Escape');
        input.blur();
      }
    }
  }, [active]);

  const run = useCallback(
    async ({ sleep }) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) throw CANCELLED;

      // Inline mode: calendar/wheels are always shown — just pick values.
      if (inline) {
        await sleep(1000);
        const pickDay = idx => {
          const cells = dayCells(wrapper);
          const cell = cells[Math.min(idx, cells.length - 1)];
          if (cell) dispatchClick(cell);
        };
        const pickTime = () => {
          const item = findWheelItem(wrapper);
          if (item) dispatchClick(item);
        };

        if (kind === 'date' || kind === 'datetime') pickDay(13);
        if (kind === 'time' || kind === 'datetime') pickTime();
        await sleep(1700);
        if (kind === 'date' || kind === 'datetime') pickDay(20);
        if (kind === 'time' || kind === 'datetime') pickTime();
        await sleep(2000);
        valueRef.current(null);
        await sleep(900);
        return;
      }

      // Popover mode: focus, type, open, click.
      await sleep(900);
      const input = wrapper.querySelector('input');
      if (!input) throw CANCELLED;

      const clickOn = async el => {
        await sleep(400);
        dispatchClick(el);
        await sleep(300);
      };

      await clickOn(input);
      input.focus({ preventScroll: true });
      await sleep(500);

      for (const key of TYPE_KEYS[kind]) {
        dispatchKey(input, key);
        await sleep(KEY_MS);
      }
      await sleep(700);

      // Pick a calendar day (date + datetime).
      if (kind === 'date' || kind === 'datetime') {
        const cells = dayCells(wrapper);
        const day = cells[Math.min(17, cells.length - 1)];
        if (day) await clickOn(day);
      }
      // The datetime popover keeps its time behind a "Time" footer button —
      // open the wheel overlay before picking.
      if (kind === 'datetime') {
        const timeBtn = wrapper.querySelector('.datetimeinput-footer-time');
        if (timeBtn) await clickOn(timeBtn);
      }
      // Pick a time on the wheels (time + datetime).
      if (kind === 'time' || kind === 'datetime') {
        await sleep(200);
        const item = findWheelItem(wrapper);
        if (item) await clickOn(item);
      }

      // Admire, then close the popover and reset.
      await sleep(1600);
      const done = wrapper.querySelector('.datetimeinput-footer-done');
      if (kind === 'datetime' && done) {
        dispatchClick(done);
      } else {
        dispatchKey(input, 'Escape');
      }
      input.blur();
      valueRef.current(null);
      await sleep(1400);
    },
    [kind, inline]
  );

  const { reducedMotion, hoverProps } = useDemoLoop({
    active,
    wrapperRef,
    run,
  });

  const pickerProps = {
    color: 'primary',
    value,
    onChange: setValue,
    // Always demo the custom bestax picker, not the native touch-device one.
    mobileNative: false,
    ...(label ? { label } : {}),
    ...(inline || reducedMotion ? { inline: true } : {}),
  };

  return (
    <div ref={wrapperRef} className="picker-demo" {...hoverProps}>
      <style>{DEMO_CSS}</style>
      {kind === 'date' && <DateInput {...pickerProps} />}
      {kind === 'time' && <TimeInput {...pickerProps} hourFormat="12" />}
      {kind === 'datetime' && <DateTimeInput {...pickerProps} />}
    </div>
  );
}
