import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  Switch,
  Numberinput,
  Slider,
  Rate,
  Taginput,
  Box,
} from '@allxsmith/bestax-bulma';
import useDemoLoop, { CANCELLED } from './useDemoLoop';
import { dispatchClick, dispatchNativeInput } from './demoEvents';

// Rendered inside the shadow root, so its styles ship with it.
const DEMO_CSS = `
  .form-demo {
    min-height: 360px;
    max-width: 24rem;
    margin: 0 auto;
    padding-top: 1.5rem;
  }
  .form-demo .switch-row {
    display: block;
    margin-bottom: 1rem;
  }
`;

const FRUITS = [
  'Apple',
  'Apricot',
  'Banana',
  'Blackberry',
  'Blueberry',
  'Cherry',
  'Grape',
  'Mango',
  'Peach',
  'Strawberry',
];

const TAGS = ['React', 'Bulma', 'TypeScript'];

const SWITCH_ROWS = [
  { label: 'Dark mode', color: 'primary' },
  { label: 'Notifications', color: 'success' },
  { label: 'Auto-save', color: 'info' },
];

const INITIAL = {
  autocomplete: '',
  switch: [false, false, false],
  number: 0,
  slider: 10,
  rate: 0,
  tags: [],
};

const STATIC = {
  autocomplete: 'Banana',
  switch: [true, true, false],
  number: 7,
  slider: 65,
  rate: 4.5,
  tags: TAGS,
};

/**
 * Value-driven, looping demos for the advanced form controls — the controls
 * fill themselves out (typing, toggling, sweeping, rating, tagging) with no
 * cursor, just the actions. Pauses on hover so the visitor can take over.
 * `kind`: 'autocomplete' | 'switch' | 'number' | 'slider' | 'rate' | 'tags'.
 */
export default function FormDemo({ kind, active }) {
  const wrapperRef = useRef(null);
  const [value, setValue] = useState(INITIAL[kind]);
  const valueRef = useRef(setValue);
  valueRef.current = setValue;

  // Don't stay frozen mid-script when the carousel moves on
  useEffect(() => {
    if (!active) setValue(INITIAL[kind]);
  }, [active, kind]);

  const run = useCallback(
    async ({ sleep }) => {
      const set = v => valueRef.current(v);

      // Let the slide transition settle before the show starts
      await sleep(900);

      switch (kind) {
        case 'autocomplete': {
          const wrapper = wrapperRef.current;
          if (!wrapper) throw CANCELLED;
          const input = wrapper.querySelector('input');
          if (!input) throw CANCELLED;
          input.focus({ preventScroll: true });
          await sleep(400);
          // Type through the native setter so the dropdown opens like real typing
          for (const text of ['B', 'Ba']) {
            dispatchNativeInput(input, text);
            await sleep(450);
          }
          await sleep(800);
          const item = wrapper.querySelector('.dropdown-item');
          if (item) dispatchClick(item);
          await sleep(2000);
          input.blur();
          set('');
          break;
        }
        case 'switch': {
          for (let i = 0; i < SWITCH_ROWS.length; i++) {
            set(prev => prev.map((on, j) => (j === i ? true : on)));
            await sleep(650);
          }
          await sleep(1500);
          for (let i = SWITCH_ROWS.length - 1; i >= 0; i--) {
            set(prev => prev.map((on, j) => (j === i ? false : on)));
            await sleep(450);
          }
          break;
        }
        case 'number': {
          for (let n = 1; n <= 7; n++) {
            set(n);
            await sleep(350);
          }
          await sleep(1500);
          for (let n = 6; n >= 0; n--) {
            set(n);
            await sleep(150);
          }
          break;
        }
        case 'slider': {
          for (let n = 13; n <= 85; n += 3) {
            set(n);
            await sleep(60);
          }
          await sleep(1500);
          for (let n = 82; n >= 10; n -= 3) {
            set(n);
            await sleep(40);
          }
          break;
        }
        case 'rate': {
          for (let n = 0.5; n <= 4.5; n += 0.5) {
            set(n);
            await sleep(280);
          }
          await sleep(1500);
          set(0);
          break;
        }
        case 'tags': {
          for (let i = 1; i <= TAGS.length; i++) {
            set(TAGS.slice(0, i));
            await sleep(700);
          }
          await sleep(1500);
          set(TAGS.slice(0, TAGS.length - 1));
          await sleep(900);
          set([]);
          break;
        }
        default:
          break;
      }

      await sleep(1200);
    },
    [kind]
  );

  const { reducedMotion, hoverProps } = useDemoLoop({
    active,
    wrapperRef,
    run,
  });

  const shown = reducedMotion ? STATIC[kind] : value;

  return (
    <div ref={wrapperRef} className="form-demo" {...hoverProps}>
      <style>{DEMO_CSS}</style>
      <Box>
        {kind === 'autocomplete' && (
          <Autocomplete
            data={FRUITS}
            value={shown}
            onInput={setValue}
            onSelect={item => setValue(typeof item === 'string' ? item : '')}
            placeholder="Search fruit…"
            color="primary"
          />
        )}
        {kind === 'switch' &&
          SWITCH_ROWS.map((row, i) => (
            <Switch
              key={row.label}
              className="switch-row"
              checked={shown[i]}
              onChange={e => {
                const next = [...shown];
                next[i] = e.target.checked;
                setValue(next);
              }}
              color={row.color}
            >
              {row.label}
            </Switch>
          ))}
        {kind === 'number' && (
          <Numberinput
            value={shown}
            onChange={setValue}
            min={0}
            max={10}
            color="primary"
          />
        )}
        {kind === 'slider' && (
          <Slider
            value={shown}
            onChange={setValue}
            min={0}
            max={100}
            color="primary"
          />
        )}
        {kind === 'rate' && (
          <Rate
            value={shown}
            onChange={setValue}
            max={5}
            precision={0.5}
            color="warning"
          />
        )}
        {kind === 'tags' && (
          <Taginput
            value={shown}
            onChange={setValue}
            placeholder="Add a tag…"
            color="primary"
          />
        )}
      </Box>
    </div>
  );
}
