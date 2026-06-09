import {
  playAudioTick,
  unlockAudioTick,
  __resetAudioTickForTest,
} from '../_pickerInternals/audioTick';

describe('audioTick', () => {
  let originalAudioContext: typeof window.AudioContext | undefined;
  let mockCtx: {
    state: AudioContextState;
    currentTime: number;
    resume: jest.Mock;
    close: jest.Mock;
    createOscillator: jest.Mock;
    createGain: jest.Mock;
    destination: object;
  };
  let lastOsc: {
    connect: jest.Mock;
    start: jest.Mock;
    stop: jest.Mock;
    type: OscillatorType;
    frequency: {
      setValueAtTime: jest.Mock;
      exponentialRampToValueAtTime: jest.Mock;
    };
  };
  let lastGain: {
    gain: {
      setValueAtTime: jest.Mock;
      linearRampToValueAtTime: jest.Mock;
      exponentialRampToValueAtTime: jest.Mock;
    };
    connect: jest.Mock;
  };

  beforeEach(() => {
    originalAudioContext = window.AudioContext;
    lastOsc = {
      connect: jest.fn().mockReturnThis(),
      start: jest.fn(),
      stop: jest.fn(),
      type: 'sine',
      frequency: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
    };
    lastGain = {
      gain: {
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn().mockReturnThis(),
    };
    mockCtx = {
      state: 'running',
      currentTime: 0,
      resume: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      createOscillator: jest.fn(() => lastOsc),
      createGain: jest.fn(() => lastGain),
      destination: {},
    };
    (window as unknown as { AudioContext: jest.Mock }).AudioContext = jest.fn(
      () => mockCtx
    );
  });

  afterEach(() => {
    __resetAudioTickForTest();
    if (originalAudioContext) {
      window.AudioContext = originalAudioContext;
    } else {
      delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    }
  });

  it('plays a short tick via Web Audio when the context is running', () => {
    playAudioTick();
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockCtx.createGain).toHaveBeenCalledTimes(1);
    expect(lastOsc.start).toHaveBeenCalledTimes(1);
    expect(lastOsc.stop).toHaveBeenCalledTimes(1);
  });

  it('uses a triangle oscillator (haptic-thunk timbre)', () => {
    playAudioTick();
    expect(lastOsc.type).toBe('triangle');
  });

  it('sweeps frequency from 160Hz down to 110Hz over 30ms', () => {
    playAudioTick();
    expect(lastOsc.frequency.setValueAtTime).toHaveBeenCalledWith(160, 0);
    expect(lastOsc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      110,
      0.03
    );
  });

  it('uses an exponential gain decay (avoids hard envelope edge)', () => {
    playAudioTick();
    // Attack: silence → 0.08 over 1ms
    expect(lastGain.gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
    expect(lastGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0.08,
      0.001
    );
    // Release: exponential ramp to near-zero over 30ms (target must be > 0
    // for exponentialRampToValueAtTime to be valid).
    expect(lastGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      0.0001,
      0.03
    );
  });

  it('does not play when the context is suspended', () => {
    mockCtx.state = 'suspended';
    playAudioTick();
    expect(mockCtx.createOscillator).not.toHaveBeenCalled();
  });

  it('resumes a suspended context via unlockAudioTick', () => {
    mockCtx.state = 'suspended';
    unlockAudioTick();
    expect(mockCtx.resume).toHaveBeenCalledTimes(1);
  });

  it('no-ops when AudioContext is unavailable', () => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    __resetAudioTickForTest();
    expect(() => playAudioTick()).not.toThrow();
    expect(() => unlockAudioTick()).not.toThrow();
  });

  it('swallows errors from oscillator setup', () => {
    mockCtx.createOscillator = jest.fn(() => {
      throw new Error('aborted');
    });
    expect(() => playAudioTick()).not.toThrow();
  });

  it('reuses the same AudioContext across calls', () => {
    playAudioTick();
    playAudioTick();
    playAudioTick();
    expect(
      (window as unknown as { AudioContext: jest.Mock }).AudioContext
    ).toHaveBeenCalledTimes(1);
  });
});
