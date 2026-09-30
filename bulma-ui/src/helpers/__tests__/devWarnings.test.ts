import { resetDevWarnings, warnOnce } from '../devWarnings';

describe('devWarnings', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    resetDevWarnings();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('warns once per key', () => {
    warnOnce('A:x', 'first');
    warnOnce('A:x', 'second');
    warnOnce('B:x', 'third');
    expect(warnSpy.mock.calls).toEqual([['first'], ['third']]);
  });

  it('re-arms a fired key on reset', () => {
    warnOnce('A:x', 'first');
    resetDevWarnings();
    warnOnce('A:x', 'again');
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('is silent in production, and does not spend the key', () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      warnOnce('A:x', 'hidden');
    } finally {
      process.env.NODE_ENV = previous;
    }
    expect(warnSpy).not.toHaveBeenCalled();
    warnOnce('A:x', 'shown');
    expect(warnSpy).toHaveBeenCalledWith('shown');
  });

  it('stays silent when the process global is missing (fail closed)', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'process')!;
    Object.defineProperty(globalThis, 'process', {
      value: undefined,
      configurable: true,
    });
    try {
      warnOnce('A:x', 'hidden');
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, 'process', descriptor);
    }
  });
});
