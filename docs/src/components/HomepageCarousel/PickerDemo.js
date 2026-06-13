import { useCallback, useEffect, useRef, useState } from 'react';
import { DateInput, TimeInput, DateTimeInput } from '@allxsmith/bestax-bulma';
import useDemoLoop, { CANCELLED } from './useDemoLoop';
import { dispatchKey, dispatchClick } from './demoEvents';

// Rendered inside the shadow root, so its styles ship with it.
const DEMO_CSS = `
  .picker-demo {
    position: relative;
    min-height: 430px;
    max-width: 22rem;
    margin: 0 auto;
    padding-top: 0.5rem;
  }
`;

const KEY_MS = 150;

// Keystrokes for each picker's segmented input (June 15, 2026 / 9:30 PM)
const TYPE_KEYS = {
  date: ['2', '0', '2', '6', '0', '6', '1', '5'],
  time: ['0', '9', '3', '0', 'p'],
  datetime: ['2', '0', '2', '6', '0', '6', '1', '5'],
};

function findDayCell(rootEl) {
  const cells = rootEl.querySelectorAll(
    '.dateinput-cell:not([disabled]):not(.is-other-month)'
  );
  if (!cells.length) return null;
  // A day in the third week, away from the typed selection
  return cells[Math.min(17, cells.length - 1)];
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
 * Wraps a date/time picker with a scripted, looping demo: the input gets
 * focused, a value is typed into the segments, the popover opens, and a
 * date/time gets clicked — no cursor, just the actions. Pauses while the
 * visitor hovers so the real picker stays usable.
 * `kind`: 'date' | 'time' | 'datetime'.
 */
export default function PickerDemo({ kind, active }) {
  const wrapperRef = useRef(null);
  const [value, setValue] = useState(null);
  const valueRef = useRef(setValue);
  valueRef.current = setValue;

  // Don't stay frozen mid-script when the carousel moves on
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
      // Let the slide transition settle before the show starts
      await sleep(900);

      const wrapper = wrapperRef.current;
      if (!wrapper) throw CANCELLED;
      const input = wrapper.querySelector('input');
      if (!input) throw CANCELLED;

      const clickOn = async el => {
        await sleep(400);
        dispatchClick(el);
        await sleep(300);
      };

      // "Click" the input (real focus opens the popover)
      await clickOn(input);
      input.focus({ preventScroll: true });
      await sleep(500);

      // Type the value digit by digit
      for (const key of TYPE_KEYS[kind]) {
        dispatchKey(input, key);
        await sleep(KEY_MS);
      }
      await sleep(700);

      // Click inside the popover: a calendar day and/or a wheel value
      if (kind === 'date' || kind === 'datetime') {
        const day = findDayCell(wrapper);
        if (day) await clickOn(day);
      }
      if (kind === 'time' || kind === 'datetime') {
        await sleep(400);
        const item = findWheelItem(wrapper);
        if (item) await clickOn(item);
      }

      // Admire the result, then reset and replay
      await sleep(1800);
      dispatchKey(input, 'Escape');
      input.blur();
      valueRef.current(null);
      await sleep(1200);
    },
    [kind]
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
    ...(reducedMotion ? { inline: true } : {}),
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
