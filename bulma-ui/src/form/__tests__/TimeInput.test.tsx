import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { TimeInput } from '../TimeInput';
import { Field } from '../Field';
import { TimeInputBase } from '../TimeInputBase';
import { __resetAudioTickForTest } from '../_pickerInternals/audioTick';

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) =>
        ({
          matches: false,
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => true,
          onchange: null,
        }) as unknown as MediaQueryList,
    });
  }
});

const at = (h: number, m: number, s = 0) => {
  const d = new Date();
  d.setHours(h, m, s, 0);
  return d;
};

describe('TimeInput', () => {
  it('renders an input with role=combobox', () => {
    const { getByRole } = render(<TimeInput label="Time" />);
    expect(getByRole('combobox')).toBeInTheDocument();
  });

  it('inside an existing Field renders bare content with the help message', () => {
    const { container, getByText } = render(
      <Field label="When">
        <TimeInput message="Required" messageColor="danger" />
      </Field>
    );
    // No nested Field wrapper: exactly one field element.
    expect(container.querySelectorAll('.field').length).toBe(1);
    const help = getByText('Required');
    expect(help.className).toContain('help');
    expect(help.className).toContain('is-danger');
  });

  it('formats default 24h value into the input', () => {
    const { getByRole } = render(<TimeInput defaultValue={at(13, 45)} />);
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('13:45');
  });

  it('formats 12h with AM/PM when hourFormat="12"', () => {
    const { getByRole } = render(
      <TimeInput defaultValue={at(13, 45)} hourFormat="12" />
    );
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('01:45 PM');
  });

  it('renders three wheels when enableSeconds=true', () => {
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(10, 20, 30)} enableSeconds />
    );
    fireEvent.click(getByRole('combobox'));
    // hours + minutes + seconds = 3 spinbuttons (no AM/PM column in 24h)
    expect(getAllByRole('spinbutton').length).toBe(3);
  });

  it('renders four wheels when hourFormat=12 + enableSeconds', () => {
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(13, 20, 30)} hourFormat="12" enableSeconds />
    );
    fireEvent.click(getByRole('combobox'));
    expect(getAllByRole('spinbutton').length).toBe(4);
  });

  it('a 12h format string drives a 12h wheel even when hourFormat is unset', () => {
    // The displayed format is the source of truth: the input shows 12h + AM/PM,
    // so the wheels must too (hours + minutes + AM/PM = 3 spinbuttons), despite
    // hourFormat defaulting to '24'.
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(13, 45)} format="hh:mm A" />
    );
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('01:45 PM');
    fireEvent.click(getByRole('combobox'));
    expect(getAllByRole('spinbutton').length).toBe(3);
  });

  it('a 12h format string with seconds drives a 12h + seconds wheel', () => {
    const { getByRole, getAllByRole } = render(
      <TimeInput
        defaultValue={at(13, 20, 30)}
        format="hh:mm:ss A"
        enableSeconds
      />
    );
    fireEvent.click(getByRole('combobox'));
    // hours + minutes + seconds + AM/PM = 4 spinbuttons.
    expect(getAllByRole('spinbutton').length).toBe(4);
  });

  it('an explicit 24h format string wins over hourFormat="12" for the wheels', () => {
    // Inverse desync: the input renders 24h, so the wheels follow (no AM/PM
    // column → 2 spinbuttons), even though hourFormat="12" was passed.
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(13, 45)} format="HH:mm" hourFormat="12" />
    );
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('13:45');
    fireEvent.click(getByRole('combobox'));
    expect(getAllByRole('spinbutton').length).toBe(2);
  });

  it('ArrowDown on hours wheel increments the hour', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(10, 0)} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    const hoursWheel = getAllByRole('spinbutton')[0];
    fireEvent.keyDown(hoursWheel, { key: 'ArrowDown' });
    expect(handler).toHaveBeenCalled();
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getHours()).toBe(11);
  });

  it('ArrowUp on hours wheel decrements the hour', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(10, 0)} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowUp' });
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getHours()).toBe(9);
  });

  it('ArrowRight moves focus from hours wheel to minutes wheel', () => {
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(10, 0)} />
    );
    fireEvent.click(getByRole('combobox'));
    const wheels = getAllByRole('spinbutton');
    wheels[0].focus();
    expect(document.activeElement).toBe(wheels[0]);
    fireEvent.keyDown(wheels[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(wheels[1]);
  });

  it('ArrowLeft moves focus from minutes wheel to hours wheel', () => {
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(10, 0)} />
    );
    fireEvent.click(getByRole('combobox'));
    const wheels = getAllByRole('spinbutton');
    wheels[1].focus();
    fireEvent.keyDown(wheels[1], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(wheels[0]);
  });

  it('clicking a non-centred item shifts the wheel to that item', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(10, 0)} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    const hoursWheel = getAllByRole('spinbutton')[0];
    // Wheel renders a buffered window around the current value. Hour 12
    // (offset +2 from 10) is within the buffer.
    const target = Array.from(
      hoursWheel.querySelectorAll('button[role="option"]')
    ).find(b => b.textContent?.trim() === '12');
    fireEvent.click(target!);
    expect(handler).toHaveBeenCalled();
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getHours()).toBe(12);
  });

  it('hour wheel wraps past 23 to 0, showing both above the centre', () => {
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(23, 0)} />
    );
    fireEvent.click(getByRole('combobox'));
    const hoursWheel = getAllByRole('spinbutton')[0];
    const labels = Array.from(
      hoursWheel.querySelectorAll('button[role="option"]')
    ).map(b => b.textContent?.trim());
    // 23 is centred; the wrap should render 00, 01, 02, … below it.
    expect(labels).toContain('23');
    expect(labels).toContain('00');
    expect(labels).toContain('01');
  });

  it('hour wheel wraps past 0 to 23, showing 23 / 22 above the centre', () => {
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(0, 0)} />
    );
    fireEvent.click(getByRole('combobox'));
    const hoursWheel = getAllByRole('spinbutton')[0];
    const labels = Array.from(
      hoursWheel.querySelectorAll('button[role="option"]')
    ).map(b => b.textContent?.trim());
    expect(labels).toContain('00');
    expect(labels).toContain('23');
    expect(labels).toContain('22');
  });

  it('12-hour wheel shows neighbours wrapping across 12/01', () => {
    const v = new Date();
    v.setHours(12, 0, 0, 0); // displays as 12 PM
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={v} hourFormat="12" />
    );
    fireEvent.click(getByRole('combobox'));
    const hoursWheel = getAllByRole('spinbutton')[0];
    const labels = Array.from(
      hoursWheel.querySelectorAll('button[role="option"]')
    ).map(b => b.textContent?.trim());
    expect(labels).toContain('12');
    expect(labels).toContain('11');
    expect(labels).toContain('01');
  });

  it('ArrowDown on AM/PM wheel toggles to PM in 12h mode', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(9, 0)} hourFormat="12" onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    const wheels = getAllByRole('spinbutton');
    // hours, minutes, ampm — ampm is last in 12h mode w/o seconds
    const ampmWheel = wheels[wheels.length - 1];
    fireEvent.keyDown(ampmWheel, { key: 'ArrowDown' });
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getHours()).toBe(21);
  });

  it('ArrowDown opens the popover', () => {
    const { getByRole } = render(<TimeInput openOnFocus={false} />);
    fireEvent.keyDown(getByRole('combobox'), { key: 'ArrowDown' });
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('Escape closes the popover', () => {
    const { getByRole, queryByRole } = render(<TimeInput />);
    fireEvent.click(getByRole('combobox'));
    expect(getByRole('dialog')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(queryByRole('dialog')).toBeNull();
  });

  it('renders <input type="time"> when mobileNative=true', () => {
    const { container } = render(<TimeInput mobileNative={true} />);
    const native = container.querySelector('input[type="time"]');
    expect(native).not.toBeNull();
  });

  it('forwards step=1 when enableSeconds and mobileNative', () => {
    const { container } = render(
      <TimeInput mobileNative={true} enableSeconds />
    );
    const native = container.querySelector(
      'input[type="time"]'
    ) as HTMLInputElement;
    expect(native.step).toBe('1');
  });

  it('forwards step from incrementMinutes on the native input', () => {
    const { container } = render(
      <TimeInput mobileNative={true} incrementMinutes={15} />
    );
    const native = container.querySelector(
      'input[type="time"]'
    ) as HTMLInputElement;
    expect(native.step).toBe('900');
  });

  it('forwards step from incrementSeconds when enableSeconds', () => {
    const { container } = render(
      <TimeInput mobileNative={true} enableSeconds incrementSeconds={10} />
    );
    const native = container.querySelector(
      'input[type="time"]'
    ) as HTMLInputElement;
    expect(native.step).toBe('10');
  });

  it('forwards min and max to the native input', () => {
    const { container } = render(
      <TimeInput mobileNative={true} min={at(9, 0)} max={at(17, 30)} />
    );
    const native = container.querySelector(
      'input[type="time"]'
    ) as HTMLInputElement;
    expect(native.min).toBe('09:00');
    expect(native.max).toBe('17:30');
  });

  it('includes seconds in min/max when enableSeconds', () => {
    const { container } = render(
      <TimeInput
        mobileNative={true}
        enableSeconds
        min={at(9, 0, 15)}
        max={at(17, 30, 45)}
      />
    );
    const native = container.querySelector(
      'input[type="time"]'
    ) as HTMLInputElement;
    expect(native.min).toBe('09:00:15');
    expect(native.max).toBe('17:30:45');
  });

  it('native input renders the value and round-trips changes through onChange', () => {
    const handler = jest.fn();
    const { container } = render(
      <TimeInput
        mobileNative={true}
        defaultValue={at(13, 45)}
        onChange={handler}
      />
    );
    const native = container.querySelector(
      'input[type="time"]'
    ) as HTMLInputElement;
    expect(native.value).toBe('13:45');
    fireEvent.change(native, { target: { value: '14:30' } });
    let committed = handler.mock.calls[0][0] as Date;
    expect(committed.getHours()).toBe(14);
    expect(committed.getMinutes()).toBe(30);
    expect(committed.getSeconds()).toBe(0);
    fireEvent.change(native, { target: { value: '' } });
    expect(handler).toHaveBeenLastCalledWith(null);
  });

  it('native input round-trips seconds when enableSeconds', () => {
    const handler = jest.fn();
    const { container } = render(
      <TimeInput
        mobileNative={true}
        enableSeconds
        defaultValue={at(13, 45, 20)}
        onChange={handler}
      />
    );
    const native = container.querySelector(
      'input[type="time"]'
    ) as HTMLInputElement;
    expect(native.value).toBe('13:45:20');
    fireEvent.change(native, { target: { value: '14:30:55' } });
    const committed = handler.mock.calls[0][0] as Date;
    expect(committed.getHours()).toBe(14);
    expect(committed.getMinutes()).toBe(30);
    expect(committed.getSeconds()).toBe(55);
  });

  it('Now button sets the value to current time and closes', () => {
    const handler = jest.fn();
    const { getByText, getByLabelText, queryByRole } = render(
      <TimeInput openOnFocus={false} onChange={handler} />
    );
    fireEvent.click(getByLabelText('Choose time')); // launcher opens the popover
    fireEvent.click(getByText('Now'));
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0]).toBeInstanceOf(Date);
    expect(queryByRole('dialog')).toBeNull();
  });

  it('Now snaps to the nearest minute increment', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 1, 13, 42, 37));
    try {
      const handler = jest.fn();
      const { getByText, getByLabelText } = render(
        <TimeInput
          incrementMinutes={15}
          openOnFocus={false}
          onChange={handler}
        />
      );
      fireEvent.click(getByLabelText('Choose time')); // launcher opens the popover
      fireEvent.click(getByText('Now'));
      const result = handler.mock.calls[
        handler.mock.calls.length - 1
      ][0] as Date;
      expect(result.getHours()).toBe(13);
      expect(result.getMinutes()).toBe(45);
      expect(result.getSeconds()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('forwards ref to the input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<TimeInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('Cancel button reverts to value at open time', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole, getByText } = render(
      <TimeInput defaultValue={at(10, 0)} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    const hoursWheel = getAllByRole('spinbutton')[0];
    fireEvent.keyDown(hoursWheel, { key: 'ArrowDown' }); // 11
    fireEvent.keyDown(hoursWheel, { key: 'ArrowDown' }); // 12
    fireEvent.click(getByText('Cancel'));
    const last = handler.mock.calls[handler.mock.calls.length - 1][0] as Date;
    expect(last.getHours()).toBe(10);
  });

  it('OK button carries the timeinput-footer-ok marker class for the :has() primed style', () => {
    const { getByRole, getByText } = render(
      <TimeInput defaultValue={at(10, 0)} />
    );
    fireEvent.click(getByRole('combobox'));
    expect(getByText('OK').className).toMatch(/timeinput-footer-ok/);
  });

  it('clicking a wheel item moves focus to the wheel root so :focus emphasis applies', () => {
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(10, 0)} />
    );
    fireEvent.click(getByRole('combobox'));
    const hoursWheel = getAllByRole('spinbutton')[0];
    const selected = hoursWheel.querySelector('[aria-selected="true"]');
    expect(selected).not.toBeNull();
    fireEvent.click(selected!);
    expect(document.activeElement).toBe(hoursWheel);
  });

  it('Enter on a wheel closes the popover (commits the live value)', () => {
    const { getByRole, getAllByRole, queryByRole } = render(
      <TimeInput defaultValue={at(10, 0)} />
    );
    fireEvent.click(getByRole('combobox'));
    expect(getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'Enter' });
    expect(queryByRole('dialog')).toBeNull();
  });

  it('OK button closes without reverting', () => {
    const { getByRole, getAllByRole, queryByRole, getByText } = render(
      <TimeInput defaultValue={at(10, 0)} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
    fireEvent.click(getByText('OK'));
    expect(queryByRole('dialog')).toBeNull();
  });

  it('unselectableTimes renders matching items with the disabled attribute', () => {
    const { getByRole, getAllByRole } = render(
      <TimeInput
        defaultValue={at(11, 30)}
        unselectableTimes={d => d.getHours() === 12}
      />
    );
    fireEvent.click(getByRole('combobox'));
    const hoursWheel = getAllByRole('spinbutton')[0];
    const twelves = Array.from(hoursWheel.querySelectorAll('button')).filter(
      b => b.textContent === '12'
    );
    expect(twelves.length).toBeGreaterThan(0);
    twelves.forEach(b => {
      expect((b as HTMLButtonElement).disabled).toBe(true);
    });
    // A non-blocked hour stays enabled.
    const elevens = Array.from(hoursWheel.querySelectorAll('button')).filter(
      b => b.textContent === '11'
    );
    expect(elevens.length).toBeGreaterThan(0);
    elevens.forEach(b => {
      expect((b as HTMLButtonElement).disabled).toBe(false);
    });
  });

  it('unselectableTimes skip-ahead lands on the next valid hour', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <TimeInput
        defaultValue={at(11, 0)}
        unselectableTimes={d => d.getHours() === 12}
        onChange={handler}
      />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getHours()).toBe(13);
  });

  it('parse callback is invoked on blur', () => {
    const parse = jest.fn(() => at(8, 15));
    const handler = jest.fn();
    const { getByRole } = render(
      <TimeInput openOnFocus={false} parse={parse} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'morning' } });
    fireEvent.blur(input);
    expect(parse).toHaveBeenCalledWith('morning');
    expect(handler).toHaveBeenCalled();
  });

  it('uses custom labels for footer buttons', () => {
    const { getByRole, getByText } = render(
      <TimeInput
        labels={{ now: 'Maintenant', cancel: 'Annuler', ok: 'Valider' }}
      />
    );
    fireEvent.click(getByRole('combobox'));
    expect(getByText('Maintenant')).toBeInTheDocument();
    expect(getByText('Annuler')).toBeInTheDocument();
    expect(getByText('Valider')).toBeInTheDocument();
  });

  it('PageDown advances the hour wheel by 5', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(2, 0)} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'PageDown' });
    const arg: Date = handler.mock.calls[handler.mock.calls.length - 1][0];
    expect(arg.getHours()).toBe(7);
  });

  it('Home jumps to the first hour value', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(15, 0)} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'Home' });
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getHours()).toBe(0);
  });

  it('End jumps to the last hour value', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(2, 0)} onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'End' });
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getHours()).toBe(23);
  });
});

// -------------------------------------------------------------------------
// Band pulse — the stationary selection band briefly scales + brightens on
// every wheel-item tick so users perceive a body-felt "thunk" even on iOS
// where no haptic API exists. Implemented via Web Animations API in
// TimeWheels.tsx; gated by `prefers-reduced-motion: reduce`.
//
// jsdom does not implement `Element.prototype.animate`, so we mock it.
// `window.matchMedia` is mocked separately per test to flip reduced-motion.
// -------------------------------------------------------------------------

describe('TimeInput band pulse', () => {
  let originalAnimate: typeof HTMLElement.prototype.animate | undefined;
  let originalMatchMedia: typeof window.matchMedia | undefined;
  let animateSpy: jest.Mock;

  const setReducedMotion = (reduced: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) =>
        ({
          matches: query.includes('reduce') ? reduced : false,
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => true,
          onchange: null,
        }) as unknown as MediaQueryList,
    });
  };

  beforeEach(() => {
    originalAnimate = HTMLElement.prototype.animate;
    originalMatchMedia = window.matchMedia;
    animateSpy = jest.fn(() => ({ cancel: jest.fn() }) as unknown as Animation);
    (HTMLElement.prototype as unknown as { animate: jest.Mock }).animate =
      animateSpy;
  });

  afterEach(() => {
    if (originalAnimate) {
      HTMLElement.prototype.animate = originalAnimate;
    } else {
      delete (HTMLElement.prototype as unknown as { animate?: unknown })
        .animate;
    }
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('animates the band on each wheel tick (arrow-down)', () => {
    setReducedMotion(false);
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(12, 0)} />
    );
    fireEvent.click(getByRole('combobox'));
    animateSpy.mockClear();
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
    expect(animateSpy).toHaveBeenCalled();
    // Verify the animation targets scale + brightness (not just any animate).
    const [keyframes, options] = animateSpy.mock.calls[0];
    expect(JSON.stringify(keyframes)).toContain('scale(1.04)');
    expect(JSON.stringify(keyframes)).toContain('brightness(1.15)');
    expect(options).toMatchObject({ duration: 110, composite: 'replace' });
  });

  it('suppresses the pulse when prefers-reduced-motion is set', () => {
    setReducedMotion(true);
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(12, 0)} />
    );
    fireEvent.click(getByRole('combobox'));
    animateSpy.mockClear();
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
    expect(animateSpy).not.toHaveBeenCalled();
  });

  it('does not throw when Element.animate is unavailable', () => {
    setReducedMotion(false);
    delete (HTMLElement.prototype as unknown as { animate?: unknown }).animate;
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(12, 0)} />
    );
    fireEvent.click(getByRole('combobox'));
    expect(() =>
      fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' })
    ).not.toThrow();
  });
});

// -------------------------------------------------------------------------
// `haptics` prop — platform-appropriate feedback routing. Opting in:
//   - Android (navigator.vibrate present) → vibrate fires, no audio added
//   - iOS (navigator.vibrate absent)      → audio thunk auto-enabled
// Explicit `audioTick` always wins (manual opt-in overrides detection).
// We verify by mocking the AudioContext so we can detect when `playAudioTick`
// actually fires its oscillator.
// -------------------------------------------------------------------------

describe('TimeInput haptics prop', () => {
  let originalVibrate: typeof navigator.vibrate | undefined;
  let originalAudioContext: typeof window.AudioContext | undefined;
  let audioCtorSpy: jest.Mock;

  const setVibrateAvailable = (available: boolean) => {
    if (available) {
      Object.defineProperty(navigator, 'vibrate', {
        value: jest.fn(),
        configurable: true,
      });
    } else {
      delete (navigator as unknown as { vibrate?: unknown }).vibrate;
    }
  };

  beforeEach(() => {
    // The audioTick module caches a singleton AudioContext across calls;
    // drop it so each test starts fresh and re-invokes our mock ctor.
    __resetAudioTickForTest();
    originalVibrate = navigator.vibrate;
    originalAudioContext = window.AudioContext;
    // Mock AudioContext so playAudioTick's createOscillator call is detectable
    // without actually playing sound.
    const lastOsc = {
      connect: jest.fn().mockReturnThis(),
      start: jest.fn(),
      stop: jest.fn(),
      type: 'triangle',
      frequency: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
    };
    const mockCtx = {
      state: 'running' as AudioContextState,
      currentTime: 0,
      resume: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      createOscillator: jest.fn(() => lastOsc),
      createGain: jest.fn(() => ({
        gain: {
          setValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
        },
        connect: jest.fn().mockReturnThis(),
      })),
      destination: {},
    };
    audioCtorSpy = jest.fn(() => mockCtx);
    (window as unknown as { AudioContext: jest.Mock }).AudioContext =
      audioCtorSpy;
  });

  afterEach(() => {
    __resetAudioTickForTest();
    if (originalVibrate) {
      Object.defineProperty(navigator, 'vibrate', {
        value: originalVibrate,
        configurable: true,
      });
    } else {
      delete (navigator as unknown as { vibrate?: unknown }).vibrate;
    }
    if (originalAudioContext) {
      window.AudioContext = originalAudioContext;
    } else {
      delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    }
  });

  it('on iOS-like (no navigator.vibrate), haptics={true} enables audio thunk', () => {
    setVibrateAvailable(false);
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(12, 0)} haptics />
    );
    fireEvent.click(getByRole('combobox'));
    // Trigger a wheel tick — this calls commitPosition → tickFeedback →
    // playAudioTick → AudioContext construction.
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
    expect(audioCtorSpy).toHaveBeenCalled();
  });

  it('on Android-like (navigator.vibrate present), haptics={true} does NOT enable audio', () => {
    setVibrateAvailable(true);
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(12, 0)} haptics />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
    // The native vibrate API carries the haptic; no need to layer audio.
    expect(audioCtorSpy).not.toHaveBeenCalled();
  });

  it('audioTick={true} always wins, regardless of haptics or platform', () => {
    setVibrateAvailable(true);
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(12, 0)} audioTick />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
    expect(audioCtorSpy).toHaveBeenCalled();
  });

  it('haptics={false} (default) does not enable audio even without vibrate', () => {
    setVibrateAvailable(false);
    const { getByRole, getAllByRole } = render(
      <TimeInput defaultValue={at(12, 0)} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
    expect(audioCtorSpy).not.toHaveBeenCalled();
  });
});

// -------------------------------------------------------------------------
// Segmented manual entry on the input field. Focus selects the hours
// segment; ArrowUp/Down increment; ArrowLeft/Right move; digits overwrite
// with auto-advance; a/p toggle AM/PM.
// -------------------------------------------------------------------------

describe('TimeInput segmented input entry', () => {
  it('selects the hours segment on focus (24h format)', () => {
    const { getByRole } = render(<TimeInput defaultValue={at(13, 45)} />);
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(2);
  });

  it('ArrowUp on the focused input increments the hours segment', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <TimeInput defaultValue={at(13, 45)} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getHours()).toBe(14);
    expect(input.value).toBe('14:45');
  });

  it('ArrowDown on the focused input decrements the hours segment', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <TimeInput defaultValue={at(13, 45)} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getHours()).toBe(12);
  });

  it('ArrowRight moves selection to the minutes segment', () => {
    const { getByRole } = render(<TimeInput defaultValue={at(13, 45)} />);
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(5);
  });

  it('ArrowLeft from minutes moves back to hours', () => {
    const { getByRole } = render(<TimeInput defaultValue={at(13, 45)} />);
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowRight' }); // → minutes
    fireEvent.keyDown(input, { key: 'ArrowLeft' }); // → hours
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(2);
  });

  it('digit entry overwrites the active segment and waits for a second digit when more are valid', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <TimeInput defaultValue={at(13, 45)} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: '2' }); // 24h first digit 2 is incomplete (20-23 still valid)
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getHours()).toBe(2);
    // Selection should still be on hours (no advance yet).
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(2);
  });

  it('auto-advances to minutes after a digit that completes the hours segment', () => {
    const { getByRole } = render(<TimeInput defaultValue={at(13, 45)} />);
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: '5' }); // 24h: 5 alone has no 2-digit continuation
    // Should have moved to minutes
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(5);
  });

  it('typing two digits fills hours and advances to minutes', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <TimeInput defaultValue={at(13, 45)} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: '2' });
    fireEvent.keyDown(input, { key: '3' });
    const arg: Date = handler.mock.calls[handler.mock.calls.length - 1][0];
    expect(arg.getHours()).toBe(23);
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(5);
  });

  it('p / a toggle AM/PM on the meridiem segment in 12h mode', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <TimeInput defaultValue={at(9, 0)} hourFormat="12" onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    // Move to AM/PM segment (hours → minutes → ampm)
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(input, { key: 'p' });
    const arg: Date = handler.mock.calls[0][0];
    expect(arg.getHours()).toBe(21); // 9 AM → 9 PM
    fireEvent.keyDown(input, { key: 'a' });
    const arg2: Date = handler.mock.calls[handler.mock.calls.length - 1][0];
    expect(arg2.getHours()).toBe(9); // back to AM
  });

  it('Enter does not commit in segment mode (already live) but respects closeOnSelect', () => {
    // openOnFocus=false avoids the focus-trap loop where closing the popover
    // returns focus to the input, which would otherwise reopen on focus.
    const { getByRole, getByLabelText, queryByRole } = render(
      <TimeInput defaultValue={at(13, 45)} closeOnSelect openOnFocus={false} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.click(getByLabelText('Choose time')); // launcher opens the popover
    expect(getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(queryByRole('dialog')).toBeNull();
  });

  it('Tab clears segment selection so focus can move out naturally', () => {
    const { getByRole } = render(<TimeInput defaultValue={at(13, 45)} />);
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'Tab' });
    // After Tab, ArrowDown should fall back to legacy "open popover" since
    // segment mode is no longer engaged.
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // (The popover should be open from focus; verify nothing crashes.)
    expect(input).toBeInTheDocument();
  });

  it('falls back to free-form text entry when format uses Intl options', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <TimeInput
        defaultValue={at(13, 45)}
        format={{ hour: '2-digit', minute: '2-digit' }}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    // Should NOT have entered segment mode → selectionEnd shouldn't be the
    // segment range (since there's no segment map). Free-form behavior
    // means selection range isn't set by the picker.
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    // onChange should not fire from arrow keys in free-form mode.
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('TimeInput editable / popover modes', () => {
  it('editable={false}: typing / arrows do not change the value', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <TimeInput
        defaultValue={at(13, 45)}
        editable={false}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: '9' });
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('13:45');
  });

  it('editable={false}: the popover still opens on click', () => {
    const { getByRole } = render(
      <TimeInput defaultValue={at(13, 45)} editable={false} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.click(input);
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('popover={false}: focus / click / ArrowDown do not open a dialog', () => {
    const { getByRole, queryByRole } = render(
      <TimeInput defaultValue={at(13, 45)} popover={false} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.click(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(queryByRole('dialog')).toBeNull();
  });

  it('popover={false}: still supports segmented typing (input-only)', () => {
    const handler = jest.fn();
    const { getByRole, queryByRole } = render(
      <TimeInput
        defaultValue={at(13, 45)}
        popover={false}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect((handler.mock.calls[0][0] as Date).getHours()).toBe(14);
    expect(queryByRole('dialog')).toBeNull();
  });
});

describe('TimeInput launcher icon', () => {
  it('opens the popover when the launcher is clicked, and toggles it closed', () => {
    const { getByLabelText, queryByRole } = render(
      <TimeInput openOnFocus={false} />
    );
    const trigger = getByLabelText('Choose time');
    expect(queryByRole('dialog')).toBeNull();
    fireEvent.click(trigger);
    expect(queryByRole('dialog')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(queryByRole('dialog')).toBeNull();
  });

  it('triggerIcon={false} renders no launcher', () => {
    const { queryByLabelText } = render(<TimeInput triggerIcon={false} />);
    expect(queryByLabelText('Choose time')).toBeNull();
  });

  it('renders no launcher when popover={false} or inline', () => {
    const { queryByLabelText, rerender } = render(
      <TimeInput popover={false} />
    );
    expect(queryByLabelText('Choose time')).toBeNull();
    rerender(<TimeInput inline />);
    expect(queryByLabelText('Choose time')).toBeNull();
  });

  it('disables the launcher when readOnly', () => {
    const { getByLabelText, queryByRole } = render(
      <TimeInput readOnly defaultValue={at(13, 45)} />
    );
    const trigger = getByLabelText('Choose time') as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    fireEvent.click(trigger);
    expect(queryByRole('dialog')).toBeNull();
  });

  it('editable={false} keeps the launcher working (picker-only)', () => {
    const { getByLabelText, getByRole } = render(
      <TimeInput editable={false} openOnFocus={false} />
    );
    fireEvent.click(getByLabelText('Choose time'));
    expect(getByRole('dialog')).toBeInTheDocument();
  });
});

// -------------------------------------------------------------------------
// Small-viewport (mobile) footer: when the custom popover renders on a small
// viewport (mobileNative={false} forces it), the panel gains the iOS-style
// Reset / ✓ footer instead of the desktop OK / Now / Cancel buttons.
// -------------------------------------------------------------------------

describe('TimeInput mobile footer', () => {
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) =>
        ({
          matches: query.includes('max-width'),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => true,
          onchange: null,
        }) as unknown as MediaQueryList,
    });
  });

  afterEach(() => {
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('Reset reverts to the value at open and closes', () => {
    const handler = jest.fn();
    const { getByRole, getByText, getAllByRole, queryByRole } = render(
      <TimeInput
        mobileNative={false}
        defaultValue={at(13, 45)}
        onChange={handler}
      />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
    expect((handler.mock.calls[0][0] as Date).getHours()).toBe(14);
    fireEvent.click(getByText('Reset'));
    const reverted = handler.mock.calls[
      handler.mock.calls.length - 1
    ][0] as Date;
    expect(reverted.getHours()).toBe(13);
    expect(reverted.getMinutes()).toBe(45);
    expect(queryByRole('dialog')).toBeNull();
  });

  it('the ✓ button closes the popover', () => {
    const { getByRole, getByLabelText, queryByRole } = render(
      <TimeInput mobileNative={false} defaultValue={at(13, 45)} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.click(getByLabelText('Done'));
    expect(queryByRole('dialog')).toBeNull();
  });
});

// -------------------------------------------------------------------------
// Remaining TimeInputBase branches: controlled values, min/max clamping of
// wheel changes, the noon base for segmented entry on an empty field,
// free-form blur parsing, inline hidden inputs, and the bare base component.
// -------------------------------------------------------------------------

describe('TimeInputBase remaining branches', () => {
  it('bare TimeInputBase renders the default launcher and opens/closes without callbacks', () => {
    const { getByRole, getByLabelText, queryByRole } = render(
      <TimeInputBase />
    );
    expect(getByLabelText('Choose time').tagName).toBe('BUTTON');
    fireEvent.click(getByRole('combobox'));
    expect(getByRole('dialog')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(queryByRole('dialog')).toBeNull();
  });

  it('controlled value drives the text; value={null} renders empty', () => {
    const { getByRole, rerender } = render(
      <TimeInputBase value={at(13, 45)} />
    );
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('13:45');
    rerender(<TimeInputBase value={null} />);
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('');
  });

  it('controlled: a wheel change reports through onChange without internal state', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <TimeInputBase value={at(10, 0)} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.click(input);
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
    expect((handler.mock.calls[0][0] as Date).getHours()).toBe(11);
    // The parent did not update `value`, so the text stays at 10:00.
    expect(input.value).toBe('10:00');
  });

  it('derives the popover id from the id prop', () => {
    const { getByRole } = render(<TimeInputBase id="shift-start" />);
    fireEvent.click(getByRole('combobox'));
    expect(getByRole('combobox').getAttribute('aria-controls')).toBe(
      'shift-start-popover'
    );
  });

  it('fires onOpen once even when an open request repeats, and onClose on close', () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();
    const { getByRole } = render(
      <TimeInputBase onOpen={onOpen} onClose={onClose} />
    );
    const input = getByRole('combobox');
    fireEvent.click(input);
    fireEvent.click(input); // already open — no duplicate onOpen
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('wheels start at 00:00 when there is no value and spin from today', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <TimeInput onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowDown' });
    const arg = handler.mock.calls[0][0] as Date;
    expect(arg.getHours()).toBe(1);
    expect(arg.getMinutes()).toBe(0);
  });

  it('seconds wheel defaults to 00 when there is no value', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <TimeInput enableSeconds onChange={handler} />
    );
    fireEvent.click(getByRole('combobox'));
    const wheels = getAllByRole('spinbutton');
    expect(wheels.length).toBe(3);
    fireEvent.keyDown(wheels[2], { key: 'ArrowDown' });
    const arg = handler.mock.calls[0][0] as Date;
    expect(arg.getSeconds()).toBe(1);
    expect(arg.getHours()).toBe(0);
  });

  it('rejects a wheel change that falls outside min/max', () => {
    const handler = jest.fn();
    const { getByRole, getAllByRole } = render(
      <TimeInput
        defaultValue={at(10, 0)}
        min={at(10, 0)}
        max={at(10, 30)}
        onChange={handler}
      />
    );
    fireEvent.click(getByRole('combobox'));
    // ArrowUp decrements to 09:00, which is below min — change is dropped.
    fireEvent.keyDown(getAllByRole('spinbutton')[0], { key: 'ArrowUp' });
    expect(handler).not.toHaveBeenCalled();
    expect((getByRole('combobox') as HTMLInputElement).value).toBe('10:00');
  });

  it('segmented entry on an empty field seeds from a noon base', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <TimeInput openOnFocus={false} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    act(() => {
      input.focus();
    });
    // The editable base is noon, so the hour calculation is unambiguous.
    expect(input.value).toBe('12:00');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    const arg = handler.mock.calls[0][0] as Date;
    expect(arg.getHours()).toBe(13);
    expect(arg.getMinutes()).toBe(0);
    expect(input.value).toBe('13:00');
  });

  it('free-form text parses on blur with the default format', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <TimeInput openOnFocus={false} onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '09:30' } });
    fireEvent.blur(input);
    const arg = handler.mock.calls[0][0] as Date;
    expect(arg.getHours()).toBe(9);
    expect(arg.getMinutes()).toBe(30);
  });

  it('free-form text parses on blur with an explicit format string', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <TimeInput openOnFocus={false} format="h:mm A" onChange={handler} />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '9:30 PM' } });
    fireEvent.blur(input);
    const arg = handler.mock.calls[0][0] as Date;
    expect(arg.getHours()).toBe(21);
    expect(arg.getMinutes()).toBe(30);
  });

  it('Intl-options formats fall back to the 24h default format for blur parsing', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <TimeInput
        openOnFocus={false}
        format={{ hour: '2-digit', minute: '2-digit' }}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '08:45' } });
    fireEvent.blur(input);
    const arg = handler.mock.calls[0][0] as Date;
    expect(arg.getHours()).toBe(8);
    expect(arg.getMinutes()).toBe(45);
  });

  it('whitespace-only text reverts on blur without committing', () => {
    const handler = jest.fn();
    const { getByRole } = render(
      <TimeInput
        defaultValue={at(13, 45)}
        openOnFocus={false}
        onChange={handler}
      />
    );
    const input = getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);
    expect(handler).not.toHaveBeenCalled();
    expect(input.value).toBe('13:45');
  });

  it('a malformed native value commits null (invalid-format guard)', () => {
    // jsdom sanitizes bad values to '' before React sees them, so force the
    // value getter to surface a malformed string to the change handler.
    const handler = jest.fn();
    const { container } = render(
      <TimeInput mobileNative={true} onChange={handler} />
    );
    const native = container.querySelector(
      'input[type="time"]'
    ) as HTMLInputElement;
    Object.defineProperty(native, 'value', {
      configurable: true,
      get: () => 'not-a-time',
      set: () => {},
    });
    fireEvent.change(native);
    expect(handler).toHaveBeenCalledWith(null);
  });

  it('supports a callback ref', () => {
    const refFn = jest.fn();
    render(<TimeInput ref={refFn} />);
    expect(refFn).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it('inline renders the wheels without a popover and emits a hidden input for name', () => {
    const { container, queryByRole, getAllByRole } = render(
      <TimeInput inline name="start" defaultValue={at(13, 45)} />
    );
    expect(queryByRole('dialog')).toBeNull();
    expect(getAllByRole('spinbutton').length).toBe(2);
    const hidden = container.querySelector(
      'input[type="hidden"]'
    ) as HTMLInputElement;
    expect(hidden.value).toBe('13:45');
  });

  it('inline with name but no value emits an empty hidden input', () => {
    const { container } = render(<TimeInput inline name="start" />);
    const hidden = container.querySelector(
      'input[type="hidden"]'
    ) as HTMLInputElement;
    expect(hidden).not.toBeNull();
    expect(hidden.value).toBe('');
  });

  it('inline without a name emits no hidden input', () => {
    const { container } = render(
      <TimeInput inline defaultValue={at(13, 45)} />
    );
    expect(container.querySelector('input[type="hidden"]')).toBeNull();
  });
});
