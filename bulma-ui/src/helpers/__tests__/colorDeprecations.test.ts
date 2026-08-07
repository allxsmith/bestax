import {
  UNSTYLED_MODIFIER_COLORS,
  resetColorDeprecationWarnings,
  warnDeprecatedColorProp,
  warnUnstyledColor,
} from '../colorDeprecations';

describe('colorDeprecations', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    resetColorDeprecationWarnings();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('warnUnstyledColor', () => {
    it('warns once for a dead value', () => {
      warnUnstyledColor('Progress', 'grey');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('<Progress color="grey">')
      );
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('is-grey'));
    });

    it('does not warn twice for the same component and value', () => {
      warnUnstyledColor('Progress', 'grey');
      warnUnstyledColor('Progress', 'grey');
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('warns again for the same value on a different component', () => {
      warnUnstyledColor('Progress', 'grey');
      warnUnstyledColor('Notification', 'grey');
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it('covers every listed dead value', () => {
      UNSTYLED_MODIFIER_COLORS.forEach(value => {
        warnUnstyledColor('Progress', value);
      });
      expect(warnSpy).toHaveBeenCalledTimes(UNSTYLED_MODIFIER_COLORS.length);
    });

    it('is silent for undefined', () => {
      warnUnstyledColor('Progress', undefined);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('is silent for a CSS-backed value', () => {
      warnUnstyledColor('Progress', 'primary');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('is silent for a value outside every list', () => {
      warnUnstyledColor('Progress', 'not-a-color');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('warns for extraUnstyled values when provided', () => {
      warnUnstyledColor('Hero', 'inherit', ['inherit', 'current']);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('is-inherit')
      );
    });

    it('is silent for extra values when extraUnstyled is omitted', () => {
      warnUnstyledColor('Hero', 'inherit');
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('warnDeprecatedColorProp', () => {
    it('warns once for any defined value, including the hint', () => {
      warnDeprecatedColorProp('Tabs', 'primary', 'Remove the prop.');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Remove the prop.')
      );
    });

    it('does not warn twice for the same component', () => {
      warnDeprecatedColorProp('Tabs', 'primary', 'Remove the prop.');
      warnDeprecatedColorProp('Tabs', 'danger', 'Remove the prop.');
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('is silent for undefined', () => {
      warnDeprecatedColorProp('Tabs', undefined, 'Remove the prop.');
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('environment handling', () => {
    it('is silent in production', () => {
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        warnUnstyledColor('Progress', 'grey');
        warnDeprecatedColorProp('Tabs', 'primary', 'Remove the prop.');
        expect(warnSpy).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = previous;
      }
    });

    it('treats a missing process global as development', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        'process'
      )!;
      Object.defineProperty(globalThis, 'process', {
        value: undefined,
        configurable: true,
      });
      try {
        warnUnstyledColor('Progress', 'grey');
        expect(warnSpy).toHaveBeenCalledTimes(1);
      } finally {
        Object.defineProperty(globalThis, 'process', descriptor);
      }
    });
  });

  describe('resetColorDeprecationWarnings', () => {
    it('re-arms a fired key', () => {
      warnUnstyledColor('Progress', 'grey');
      resetColorDeprecationWarnings();
      warnUnstyledColor('Progress', 'grey');
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });
});
