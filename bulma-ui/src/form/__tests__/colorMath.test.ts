import {
  formatColor,
  hslaToHsva,
  hsvaToHsla,
  hsvaToRgba,
  luminance,
  namesHue,
  parseColor,
  prefersDarkInk,
  rgbaToHsva,
  sameColor,
  type Hsva,
} from '../_colorInternals/colorMath';

/** A color read and written back in a format, alpha written too. */
const roundTrip = (
  text: string,
  format: 'hsl' | 'hex' | 'rgb',
  alpha = false
) => formatColor(parseColor(text) as Hsva, format, alpha);

describe('colorMath', () => {
  describe('parseColor', () => {
    it('reads hex in each length, with or without #', () => {
      expect(roundTrip('#00d1b2', 'hex')).toBe('#00d1b2');
      expect(roundTrip('00D1B2', 'hex')).toBe('#00d1b2');
      expect(roundTrip('#fff', 'hex')).toBe('#ffffff');
      expect(roundTrip('#f008', 'hex', true)).toBe('#ff000088');
      expect(roundTrip('#00d1b280', 'rgb', true)).toBe(
        'rgba(0, 209, 178, 0.5)'
      );
    });

    it('turns down hex of a wrong length or with other letters', () => {
      for (const bad of ['#12', '#12345', '#1234567', '#ggg', 'abcde', '#']) {
        expect(parseColor(bad)).toBeNull();
      }
    });

    it('reads rgb() and rgba() with commas or spaces', () => {
      expect(roundTrip('rgb(0, 209, 178)', 'hex')).toBe('#00d1b2');
      expect(roundTrip('rgba(0,209,178,0.5)', 'rgb', true)).toBe(
        'rgba(0, 209, 178, 0.5)'
      );
      expect(roundTrip('rgb(0 209 178 / 50%)', 'rgb', true)).toBe(
        'rgba(0, 209, 178, 0.5)'
      );
      expect(roundTrip('rgb(0 209 178)', 'hex')).toBe('#00d1b2');
      expect(roundTrip('rgb(100%, 0%, 50%)', 'rgb')).toBe('rgb(255, 0, 128)');
    });

    it('clamps channels and alpha outside their range', () => {
      expect(roundTrip('rgb(300, -5, 0)', 'rgb')).toBe('rgb(255, 0, 0)');
      expect(roundTrip('rgba(0, 0, 0, 2)', 'rgb', true)).toBe(
        'rgba(0, 0, 0, 1)'
      );
      expect(roundTrip('hsl(0, 150%, 50%)', 'hsl')).toBe('hsl(0, 100%, 50%)');
    });

    it('reads hsl() and hsla() with angles, commas or spaces', () => {
      expect(roundTrip('hsl(171, 100%, 41%)', 'hsl')).toBe(
        'hsl(171, 100%, 41%)'
      );
      expect(roundTrip('hsla(171deg, 100%, 41%, 1)', 'hsl', true)).toBe(
        'hsla(171, 100%, 41%, 1)'
      );
      expect(roundTrip('hsl(171 100% 41% / 0.25)', 'hsl', true)).toBe(
        'hsla(171, 100%, 41%, 0.25)'
      );
      expect(roundTrip('hsl(0.5turn 100 50)', 'hsl')).toBe(
        'hsl(180, 100%, 50%)'
      );
      expect(roundTrip('hsl(200grad, 100%, 50%)', 'hsl')).toBe(
        'hsl(180, 100%, 50%)'
      );
      expect(roundTrip(`hsl(${Math.PI}rad, 100%, 50%)`, 'hsl')).toBe(
        'hsl(180, 100%, 50%)'
      );
      expect(roundTrip('hsl(-90, 100%, 50%)', 'hsl')).toBe(
        'hsl(270, 100%, 50%)'
      );
      expect(roundTrip('hsl(1e2, 100%, 50%)', 'hsl')).toBe(
        'hsl(100, 100%, 50%)'
      );
    });

    it('keeps the hue of an HSL gray', () => {
      expect(parseColor('hsl(171, 0%, 50%)')?.h).toBe(171);
    });

    it('reads the named colors and transparent, in any case', () => {
      expect(roundTrip('RebeccaPurple', 'hex')).toBe('#663399');
      expect(roundTrip(' tomato ', 'rgb')).toBe('rgb(255, 99, 71)');
      expect(parseColor('transparent')).toEqual({ h: 0, s: 0, v: 0, a: 0 });
    });

    it('turns down what only a browser can resolve, and malformed functions', () => {
      for (const bad of [
        '',
        null,
        undefined,
        'notacolor',
        'oklch(60% 0.15 250)',
        'var(--bulma-primary)',
        'rgb(1, 2)',
        'rgb(1, 2, 3, 4, 5)',
        'rgb(1, , 3)',
        'rgb(1 2 3 4)',
        'rgb(1 2 / 3)',
        'rgb(1 2 3 / 4 / 5)',
        'rgb(1 2 3 / )',
        'rgb(1 2 3 / 4 5)',
        'rgb(a, b, c)',
        'hsl(x, 50%, 50%)',
        'hsl(10, y, 50%)',
        'rgba(0, 0, 0, z)',
        'cmyk(0, 0, 0, 0)',
      ]) {
        expect(parseColor(bad)).toBeNull();
      }
    });
  });

  describe('formatColor', () => {
    const teal: Hsva = { h: 171, s: 100, v: 82, a: 0.5 };

    it('writes each format, with and without alpha', () => {
      expect(formatColor(teal, 'hsl', false)).toBe('hsl(171, 100%, 41%)');
      expect(formatColor(teal, 'hsl', true)).toBe('hsla(171, 100%, 41%, 0.5)');
      expect(formatColor(teal, 'hex', false)).toBe('#00d1b2');
      expect(formatColor(teal, 'hex', true)).toBe('#00d1b280');
      expect(formatColor(teal, 'rgb', false)).toBe('rgb(0, 209, 178)');
      expect(formatColor(teal, 'rgb', true)).toBe('rgba(0, 209, 178, 0.5)');
    });

    it('writes a hue of 360 as 0 and alpha to two places', () => {
      expect(
        formatColor({ h: 360, s: 100, v: 100, a: 0.123 }, 'hsl', true)
      ).toBe('hsla(0, 100%, 50%, 0.12)');
    });

    it('writes black and white with no saturation', () => {
      expect(formatColor({ h: 40, s: 30, v: 0, a: 1 }, 'hsl', false)).toBe(
        'hsl(40, 0%, 0%)'
      );
      expect(formatColor({ h: 40, s: 0, v: 100, a: 1 }, 'hsl', false)).toBe(
        'hsl(40, 0%, 100%)'
      );
    });
  });

  describe('conversions', () => {
    it('goes RGB to HSV and back, through each hue sector', () => {
      for (const rgba of [
        { r: 255, g: 0, b: 0, a: 1 },
        { r: 0, g: 255, b: 0, a: 1 },
        { r: 0, g: 0, b: 255, a: 1 },
        { r: 255, g: 0, b: 255, a: 1 },
        { r: 128, g: 128, b: 128, a: 1 },
        { r: 0, g: 0, b: 0, a: 1 },
      ]) {
        const back = hsvaToRgba(rgbaToHsva(rgba));
        expect(back.r).toBeCloseTo(rgba.r);
        expect(back.g).toBeCloseTo(rgba.g);
        expect(back.b).toBeCloseTo(rgba.b);
      }
    });

    it('goes HSL to HSV and back', () => {
      const hsva = hslaToHsva(202, 67, 36, 1);
      const hsla = hsvaToHsla(hsva);
      expect(hsla.h).toBe(202);
      expect(hsla.s).toBeCloseTo(67);
      expect(hsla.l).toBeCloseTo(36);
      expect(hslaToHsva(0, 50, 0, 1)).toEqual({ h: 0, s: 0, v: 0, a: 1 });
    });
  });

  describe('namesHue', () => {
    it('is true for hsl() and hsla() text only', () => {
      expect(namesHue('hsl(200, 0%, 50%)')).toBe(true);
      expect(namesHue('  HSLA(200deg 0% 50% / 1)')).toBe(true);
      for (const text of ['#808080', 'gray', 'rgb(128, 128, 128)', '']) {
        expect(namesHue(text)).toBe(false);
      }
    });
  });

  describe('comparing and contrast', () => {
    it('calls colors the same once written as 8-bit RGB', () => {
      const one = parseColor('#1e6b99') as Hsva;
      expect(sameColor(one, { ...one, s: one.s + 0.01 })).toBe(true);
      expect(sameColor(one, parseColor('#1e6b9a') as Hsva)).toBe(false);
    });

    it('measures luminance and picks the ink that reads better', () => {
      expect(luminance(parseColor('white') as Hsva)).toBeCloseTo(1);
      expect(luminance(parseColor('black') as Hsva)).toBe(0);
      expect(luminance(parseColor('#010101') as Hsva)).toBeGreaterThan(0);
      expect(prefersDarkInk(parseColor('#ffdd57') as Hsva)).toBe(true);
      expect(prefersDarkInk(parseColor('#1e6b99') as Hsva)).toBe(false);
    });
  });
});
