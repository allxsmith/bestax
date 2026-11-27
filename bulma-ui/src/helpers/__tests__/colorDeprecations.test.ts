import type { MockInstance } from 'vitest';
import {
  UNSTYLED_MODIFIER_COLORS,
  resetColorDeprecationWarnings,
  warnDeprecatedColorProp,
  warnTextHelperColorProp,
  warnUnstyledColor,
} from '../colorDeprecations';

describe('colorDeprecations', () => {
  let warnSpy: MockInstance;

  beforeEach(() => {
    resetColorDeprecationWarnings();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
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

    it('says the prop has no visual effect', () => {
      warnDeprecatedColorProp('Tabs', 'primary', 'Remove the prop.');
      expect(warnSpy).toHaveBeenLastCalledWith(
        '[bestax-bulma] The Tabs "color" prop is deprecated: Bulma ships no ' +
          'tabs color CSS, so it has no visual effect. It will be removed in ' +
          'the next major version. Remove the prop.'
      );
    });
  });

  describe('warnTextHelperColorProp', () => {
    it('warns once, saying the prop renders the text color helper', () => {
      warnTextHelperColorProp('Field.Label', { color: 'info' });
      warnTextHelperColorProp('Field.Label', { color: 'danger' });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0][0] as string;
      expect(message).toBe(
        '[bestax-bulma] The Field.Label "color" prop is deprecated: it ' +
          'renders the text color helper (has-text-<color>), not a modifier, ' +
          'in place of textColor, and passed as undefined it still keeps ' +
          'textColor from rendering. It will be removed in the next major ' +
          'version. Use the textColor prop instead.'
      );
    });

    it('warns for a color key with an undefined value', () => {
      warnTextHelperColorProp('Field.Label', { color: undefined });
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('is silent when the props carry no color key', () => {
      warnTextHelperColorProp('Field.Label', {});
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

    it('stays silent when the process global is missing (fail closed)', () => {
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
        expect(warnSpy).not.toHaveBeenCalled();
      } finally {
        Object.defineProperty(globalThis, 'process', descriptor);
      }
    });

    it('warns in an explicit development environment', () => {
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      try {
        warnUnstyledColor('Progress', 'grey');
        expect(warnSpy).toHaveBeenCalledTimes(1);
      } finally {
        process.env.NODE_ENV = previous;
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
