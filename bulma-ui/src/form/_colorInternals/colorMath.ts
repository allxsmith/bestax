// INTERNAL: deliberately not exported from src/index.ts. Reading, converting
// and writing the CSS colors the color picker takes and gives.
//
// The picker works in HSV (hue, saturation and value, which the square
// calls brightness), since its square is saturation by brightness. Every
// color it reads becomes HSV, and every value it writes comes out of HSV in
// the format asked for.

/** The formats a color picker writes its value in. */
export type ColorFormat = 'hsl' | 'hex' | 'rgb';

/**
 * A color as the picker holds it: hue in degrees from 0 to 360, saturation
 * and value (brightness) from 0 to 100, and alpha from 0 to 1.
 */
export interface Hsva {
  h: number;
  s: number;
  v: number;
  a: number;
}

/** Red, green and blue from 0 to 255, and alpha from 0 to 1. */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const clamp = (value: number, low: number, high: number): number =>
  Math.min(Math.max(value, low), high);

/** Rounds to a number of decimal places, so `0.1 + 0.2` writes as `0.3`. */
const round = (value: number, places: number): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

/** HSV to RGB, each channel unrounded. */
export function hsvaToRgba({ h, s, v, a }: Hsva): Rgba {
  const sat = s / 100;
  const val = v / 100;
  const at = (n: number) => {
    const k = (n + h / 60) % 6;
    return val - val * sat * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return { r: at(5) * 255, g: at(3) * 255, b: at(1) * 255, a };
}

/** RGB to HSV. A gray has no hue, so it gets 0. */
export function rgbaToHsva({ r, g, b, a }: Rgba): Hsva {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const delta = max - Math.min(red, green, blue);
  let h = 0;
  if (delta > 0) {
    if (max === red) h = ((green - blue) / delta) % 6;
    else if (max === green) h = (blue - red) / delta + 2;
    else h = (red - green) / delta + 4;
  }
  return {
    h: (h * 60 + 360) % 360,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
    a,
  };
}

/** HSL (saturation and lightness from 0 to 100) to HSV, keeping the hue. */
export function hslaToHsva(h: number, s: number, l: number, a: number): Hsva {
  const sat = s / 100;
  const light = l / 100;
  const v = light + sat * Math.min(light, 1 - light);
  return { h, s: v === 0 ? 0 : 2 * (1 - light / v) * 100, v: v * 100, a };
}

/** HSV to HSL, saturation and lightness from 0 to 100, keeping the hue. */
export function hsvaToHsla({ h, s, v, a }: Hsva): {
  h: number;
  s: number;
  l: number;
  a: number;
} {
  const sat = s / 100;
  const val = v / 100;
  const light = val * (1 - sat / 2);
  const lowest = Math.min(light, 1 - light);
  return {
    h,
    s: lowest === 0 ? 0 : ((val - light) / lowest) * 100,
    l: light * 100,
    a,
  };
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

const hexByte = (value: number) =>
  Math.round(clamp(value, 0, 255))
    .toString(16)
    .padStart(2, '0');

/** Alpha as CSS writes it, to two decimal places: `0.5`, `1`. */
const writeAlpha = (a: number) => String(round(clamp(a, 0, 1), 2));

/**
 * Writes a color in a format: `hsl(171, 100%, 41%)`, `#00d1b2` or
 * `rgb(0, 209, 178)`, with alpha as `hsla(…)`, `#00d1b2ff` and `rgba(…)`.
 * Channels are whole numbers, and the legacy comma form is used, which every
 * CSS parser and color library reads.
 */
export function formatColor(
  color: Hsva,
  format: ColorFormat,
  alpha: boolean
): string {
  if (format === 'hsl') {
    const { h, s, l, a } = hsvaToHsla(color);
    const channels = `${Math.round(h) % 360}, ${Math.round(s)}%, ${Math.round(l)}%`;
    return alpha ? `hsla(${channels}, ${writeAlpha(a)})` : `hsl(${channels})`;
  }
  const { r, g, b, a } = hsvaToRgba(color);
  if (format === 'hex') {
    const hex = `#${hexByte(r)}${hexByte(g)}${hexByte(b)}`;
    return alpha ? `${hex}${hexByte(a * 255)}` : hex;
  }
  const channels = `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`;
  return alpha ? `rgba(${channels}, ${writeAlpha(a)})` : `rgb(${channels})`;
}

/** The color as 8-bit RGB and alpha to two places, for telling colors apart. */
const key = (color: Hsva): string => {
  const { r, g, b, a } = hsvaToRgba(color);
  return [r, g, b].map(c => Math.round(c)).join(',') + `,${writeAlpha(a)}`;
};

/** Whether two colors are the same once written as 8-bit RGB with alpha. */
export const sameColor = (one: Hsva, other: Hsva): boolean =>
  key(one) === key(other);

/**
 * The relative luminance of a color, from 0 for black to 1 for white, as
 * WCAG defines it.
 */
export function luminance(color: Hsva): number {
  const { r, g, b } = hsvaToRgba(color);
  const linear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * Whether black reads better than white on a color, by WCAG contrast
 * ratio. Used for the check on a chosen swatch.
 */
export function prefersDarkInk(color: Hsva): boolean {
  const l = luminance(color);
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05);
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

// The CSS named colors, each name followed by its six hex digits.
const NAMED =
  'aliceblue:f0f8ff,antiquewhite:faebd7,aqua:00ffff,aquamarine:7fffd4,' +
  'azure:f0ffff,beige:f5f5dc,bisque:ffe4c4,black:000000,' +
  'blanchedalmond:ffebcd,blue:0000ff,blueviolet:8a2be2,brown:a52a2a,' +
  'burlywood:deb887,cadetblue:5f9ea0,chartreuse:7fff00,chocolate:d2691e,' +
  'coral:ff7f50,cornflowerblue:6495ed,cornsilk:fff8dc,crimson:dc143c,' +
  'cyan:00ffff,darkblue:00008b,darkcyan:008b8b,darkgoldenrod:b8860b,' +
  'darkgray:a9a9a9,darkgreen:006400,darkgrey:a9a9a9,darkkhaki:bdb76b,' +
  'darkmagenta:8b008b,darkolivegreen:556b2f,darkorange:ff8c00,' +
  'darkorchid:9932cc,darkred:8b0000,darksalmon:e9967a,' +
  'darkseagreen:8fbc8f,darkslateblue:483d8b,darkslategray:2f4f4f,' +
  'darkslategrey:2f4f4f,darkturquoise:00ced1,darkviolet:9400d3,' +
  'deeppink:ff1493,deepskyblue:00bfff,dimgray:696969,dimgrey:696969,' +
  'dodgerblue:1e90ff,firebrick:b22222,floralwhite:fffaf0,' +
  'forestgreen:228b22,fuchsia:ff00ff,gainsboro:dcdcdc,' +
  'ghostwhite:f8f8ff,gold:ffd700,goldenrod:daa520,gray:808080,' +
  'green:008000,greenyellow:adff2f,grey:808080,honeydew:f0fff0,' +
  'hotpink:ff69b4,indianred:cd5c5c,indigo:4b0082,ivory:fffff0,' +
  'khaki:f0e68c,lavender:e6e6fa,lavenderblush:fff0f5,' +
  'lawngreen:7cfc00,lemonchiffon:fffacd,lightblue:add8e6,' +
  'lightcoral:f08080,lightcyan:e0ffff,lightgoldenrodyellow:fafad2,' +
  'lightgray:d3d3d3,lightgreen:90ee90,lightgrey:d3d3d3,' +
  'lightpink:ffb6c1,lightsalmon:ffa07a,lightseagreen:20b2aa,' +
  'lightskyblue:87cefa,lightslategray:778899,lightslategrey:778899,' +
  'lightsteelblue:b0c4de,lightyellow:ffffe0,lime:00ff00,' +
  'limegreen:32cd32,linen:faf0e6,magenta:ff00ff,maroon:800000,' +
  'mediumaquamarine:66cdaa,mediumblue:0000cd,mediumorchid:ba55d3,' +
  'mediumpurple:9370db,mediumseagreen:3cb371,mediumslateblue:7b68ee,' +
  'mediumspringgreen:00fa9a,mediumturquoise:48d1cc,' +
  'mediumvioletred:c71585,midnightblue:191970,mintcream:f5fffa,' +
  'mistyrose:ffe4e1,moccasin:ffe4b5,navajowhite:ffdead,navy:000080,' +
  'oldlace:fdf5e6,olive:808000,olivedrab:6b8e23,orange:ffa500,' +
  'orangered:ff4500,orchid:da70d6,palegoldenrod:eee8aa,' +
  'palegreen:98fb98,paleturquoise:afeeee,palevioletred:db7093,' +
  'papayawhip:ffefd5,peachpuff:ffdab9,peru:cd853f,pink:ffc0cb,' +
  'plum:dda0dd,powderblue:b0e0e6,purple:800080,' +
  'rebeccapurple:663399,red:ff0000,rosybrown:bc8f8f,' +
  'royalblue:4169e1,saddlebrown:8b4513,salmon:fa8072,' +
  'sandybrown:f4a460,seagreen:2e8b57,seashell:fff5ee,sienna:a0522d,' +
  'silver:c0c0c0,skyblue:87ceeb,slateblue:6a5acd,slategray:708090,' +
  'slategrey:708090,snow:fffafa,springgreen:00ff7f,steelblue:4682b4,' +
  'tan:d2b48c,teal:008080,thistle:d8bfd8,tomato:ff6347,' +
  'turquoise:40e0d0,violet:ee82ee,wheat:f5deb3,white:ffffff,' +
  'whitesmoke:f5f5f5,yellow:ffff00,yellowgreen:9acd32';

let namedColors: Map<string, string> | undefined;

/** The hex digits of a CSS color name, or undefined for any other word. */
const namedHex = (name: string): string | undefined => {
  if (!namedColors) {
    namedColors = new Map(
      NAMED.split(',').map(entry => entry.split(':') as [string, string])
    );
  }
  return namedColors.get(name);
};

/** Reads `#rgb`, `#rgba`, `#rrggbb` and `#rrggbbaa`, the `#` optional. */
function parseHex(text: string): Hsva | null {
  const digits = text.startsWith('#') ? text.slice(1) : text;
  if (!/^[0-9a-f]+$/.test(digits) || ![3, 4, 6, 8].includes(digits.length)) {
    return null;
  }
  const full =
    digits.length < 6
      ? digits
          .split('')
          .map(d => d + d)
          .join('')
      : digits;
  const byte = (i: number) => parseInt(full.slice(i, i + 2), 16);
  return rgbaToHsva({
    r: byte(0),
    g: byte(2),
    b: byte(4),
    a: full.length === 8 ? byte(6) / 255 : 1,
  });
}

/**
 * The arguments of a CSS color function, in either syntax: commas
 * (`rgb(0, 209, 178)`) or spaces with the alpha after a slash
 * (`rgb(0 209 178 / 50%)`). Null when they're neither.
 */
function splitArguments(body: string): string[] | null {
  if (body.includes(',')) {
    const parts = body.split(',').map(part => part.trim());
    return parts.includes('') ? null : parts;
  }
  const [channels, alpha, ...more] = body.split('/');
  const parts = channels.trim().split(/\s+/).filter(Boolean);
  if (more.length > 0 || parts.length !== 3) return null;
  if (alpha === undefined) return parts;
  const a = alpha.trim();
  return a && !/\s/.test(a) ? [...parts, a] : null;
}

/** A plain number or a percentage of `whole`, or NaN. */
const numberOf = (part: string, whole: number): number => {
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?%?$/.test(part)) return NaN;
  const value = parseFloat(part);
  return part.endsWith('%') ? (value / 100) * whole : value;
};

/** An alpha, `0.5` or `50%`, clamped to 0 to 1, or NaN. */
const alphaOf = (part: string | undefined): number =>
  part === undefined ? 1 : clamp(numberOf(part, 1), 0, 1);

const ANGLE_UNITS: Record<string, number> = {
  deg: 1,
  grad: 360 / 400,
  rad: 180 / Math.PI,
  turn: 360,
};

/** A hue in degrees from 0 to 360, from a number or an angle, or NaN. */
const hueOf = (part: string): number => {
  const match =
    /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(deg|grad|rad|turn)?$/.exec(part);
  if (!match) return NaN;
  const degrees = parseFloat(match[1]) * ANGLE_UNITS[match[2] ?? 'deg'];
  return ((degrees % 360) + 360) % 360;
};

/** Reads `rgb()`, `rgba()`, `hsl()` and `hsla()` in either syntax. */
function parseFunction(text: string): Hsva | null {
  const match = /^(rgba?|hsla?)\((.*)\)$/.exec(text);
  if (!match) return null;
  const parts = splitArguments(match[2]);
  if (!parts || parts.length < 3 || parts.length > 4) return null;
  const [first, second, third, fourth] = parts;
  const a = alphaOf(fourth);
  if (match[1].startsWith('rgb')) {
    const [r, g, b] = [first, second, third].map(part =>
      clamp(numberOf(part, 255), 0, 255)
    );
    if ([r, g, b, a].some(Number.isNaN)) return null;
    return rgbaToHsva({ r, g, b, a });
  }
  const h = hueOf(first);
  // Modern syntax lets saturation and lightness drop the percent sign.
  const [s, l] = [second, third].map(part =>
    clamp(numberOf(part.replace(/%$/, ''), 100), 0, 100)
  );
  if ([h, s, l, a].some(Number.isNaN)) return null;
  return hslaToHsva(h, s, l, a);
}

/**
 * Reads a CSS color: hex (with or without `#`), `rgb()`, `rgba()`, `hsl()`
 * and `hsla()` in either syntax, the named colors, and `transparent`. Null
 * for anything else, such as `oklch()` or `var(--x)`, which only the
 * browser can resolve.
 */
export function parseColor(input: string | null | undefined): Hsva | null {
  if (!input) return null;
  const text = input.trim().toLowerCase();
  if (text === 'transparent') return { h: 0, s: 0, v: 0, a: 0 };
  const named = namedHex(text);
  if (named) return parseHex(named);
  if (text.includes('(')) return parseFunction(text);
  return parseHex(text);
}
