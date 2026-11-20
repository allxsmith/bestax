import type { MockInstance } from 'vitest';
import { resetDevWarnings, warnIfUnnamed, warnOnce } from '../devWarnings';

describe('devWarnings', () => {
  let warnSpy: MockInstance;

  beforeEach(() => {
    resetDevWarnings();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
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

  describe('warnIfUnnamed', () => {
    afterEach(() => {
      document.body.innerHTML = '';
    });

    /** The input in `html`, put in the page so its labels are found. */
    const inputIn = (html: string) => {
      document.body.innerHTML = html;
      return document.querySelector('input');
    };

    it('warns once about an input nothing names', () => {
      const input = inputIn('<input type="range" />');
      warnIfUnnamed(input, 'A:unnamed', 'unnamed');
      warnIfUnnamed(input, 'A:unnamed', 'unnamed again');
      expect(warnSpy.mock.calls).toEqual([['unnamed']]);
    });

    it.each([
      [
        'a label pointing at it',
        '<label for="x">Volume</label><input id="x" />',
      ],
      ['a label around it', '<label>Volume <input /></label>'],
      ['an aria-label', '<input aria-label="Volume" />'],
      [
        'an aria-labelledby',
        '<p id="v">Volume</p><input aria-labelledby="v" />',
      ],
      ['a title', '<input title="Volume" />'],
    ])('stays quiet about an input named by %s', (_how, html) => {
      const input = inputIn(html);
      expect(input).toHaveAccessibleName('Volume');
      warnIfUnnamed(input, 'A:unnamed', 'unnamed');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('does not count a placeholder, which names only a text field', () => {
      warnIfUnnamed(
        inputIn('<input type="range" placeholder="Volume" />'),
        'A:unnamed',
        'unnamed'
      );
      expect(warnSpy).toHaveBeenCalledWith('unnamed');
    });

    it('warns about an input whose naming attributes are blank', () => {
      const input = inputIn('<input aria-label=" " title="" />');
      expect(input).toHaveAccessibleName('');
      warnIfUnnamed(input, 'A:unnamed', 'unnamed');
      expect(warnSpy).toHaveBeenCalledWith('unnamed');
    });

    it('stays quiet with no input to read', () => {
      warnIfUnnamed(null, 'A:unnamed', 'unnamed');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('reads an element that takes no label by its attributes alone', () => {
      document.body.innerHTML =
        '<div role="dialog" id="named" aria-label="Edit"></div>' +
        '<div role="dialog" id="unnamed"></div>';
      warnIfUnnamed(document.getElementById('named'), 'A:named', 'named');
      warnIfUnnamed(document.getElementById('unnamed'), 'A:unnamed', 'x');
      expect(warnSpy.mock.calls).toEqual([['x']]);
    });

    it('reads nothing in production', () => {
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        warnIfUnnamed(inputIn('<input />'), 'A:unnamed', 'hidden');
      } finally {
        process.env.NODE_ENV = previous;
      }
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
