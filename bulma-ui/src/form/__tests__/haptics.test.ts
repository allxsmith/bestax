import { tickHaptic } from '../_pickerInternals/haptics';

describe('tickHaptic', () => {
  let originalVibrate: typeof navigator.vibrate | undefined;

  beforeEach(() => {
    originalVibrate = navigator.vibrate;
  });

  afterEach(() => {
    if (originalVibrate) {
      Object.defineProperty(navigator, 'vibrate', {
        value: originalVibrate,
        configurable: true,
      });
    } else {
      delete (navigator as unknown as { vibrate?: unknown }).vibrate;
    }
  });

  it('calls navigator.vibrate with a short duration when available', () => {
    const spy = jest.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: spy,
      configurable: true,
    });
    tickHaptic();
    expect(spy).toHaveBeenCalledWith(5);
  });

  it('no-ops when navigator.vibrate is unavailable', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      configurable: true,
    });
    expect(() => tickHaptic()).not.toThrow();
  });

  it('swallows errors thrown by navigator.vibrate', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: () => {
        throw new Error('hidden document');
      },
      configurable: true,
    });
    expect(() => tickHaptic()).not.toThrow();
  });
});
