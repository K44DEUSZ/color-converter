export type Rgba = { r: number; g: number; b: number; a: number };
export type Hsl = { h: number; s: number; l: number };
export type Hsv = { h: number; s: number; v: number };
export type Oklch = { l: number; c: number; h: number };

function finite(...values: number[]) {
  if (!values.every(Number.isFinite)) throw new RangeError("Expected finite color components");
}
function validateRgb(r: number, g: number, b: number, a = 1) {
  finite(r, g, b, a);
  if ([r, g, b].some((value) => value < 0 || value > 255) || a < 0 || a > 1)
    throw new RangeError("Color components are outside their ranges");
}
function validateUnit(...values: number[]) {
  finite(...values);
  if (values.some((value) => value < 0 || value > 1))
    throw new RangeError("Expected components between zero and one");
}
export const clamp = (value: number, min = 0, max = 1) => {
  finite(value, min, max);
  if (min > max) throw new RangeError("Invalid clamp bounds");
  return Math.min(max, Math.max(min, value));
};
const round = (value: number, precision = 2) => Number(value.toFixed(precision));
export const byte = (value: number) => Math.round(clamp(value / 255) * 255);

export function rgbaToHex({ r, g, b, a }: Rgba) {
  validateRgb(r, g, b, a);
  const part = (value: number) => byte(value).toString(16).padStart(2, "0").toUpperCase();
  const alpha = a < 0.999 ? part(a * 255) : "";
  return `#${part(r)}${part(g)}${part(b)}${alpha}`;
}

export function hexToRgba(value: string): Rgba | null {
  if (typeof value !== "string" || value.length > 256) return null;
  const hex = value.trim().replace(/^#/, "");
  if (![3, 4, 6, 8].includes(hex.length) || !/^[\da-f]+$/i.test(hex)) return null;
  const full = hex.length <= 4 ? [...hex].map((char) => char + char).join("") : hex;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
    a: full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
  };
}

export function rgbToHsl({ r, g, b }: Rgba): Hsl {
  validateRgb(r, g, b);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;

  if (delta) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }

  if (h < 0) h += 360;
  const s = delta ? delta / (1 - Math.abs(2 * l - 1)) : 0;
  return { h, s: clamp(s), l: clamp(l) };
}

export function hslToRgb({ h, s, l }: Hsl, a = 1): Rgba {
  finite(h);
  validateUnit(s, l, a);
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];

  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: clamp((r + m) * 255, 0, 255),
    g: clamp((g + m) * 255, 0, 255),
    b: clamp((b + m) * 255, 0, 255),
    a,
  };
}

export function rgbToHsv({ r, g, b }: Rgba): Hsv {
  validateRgb(r, g, b);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;

  if (delta) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }

  if (h < 0) h += 360;
  return { h, s: max ? delta / max : 0, v: max };
}

export function hsvToRgb({ h, s, v }: Hsv, a = 1): Rgba {
  finite(h);
  validateUnit(s, v, a);
  const hue = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = v - c;
  let [r, g, b] = [0, 0, 0];

  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: clamp((r + m) * 255, 0, 255),
    g: clamp((g + m) * 255, 0, 255),
    b: clamp((b + m) * 255, 0, 255),
    a,
  };
}

export function srgbToLinear(value: number) {
  const x = clamp(value / 255);
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

export function linearToSrgb(value: number) {
  finite(value);
  const x =
    value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(Math.max(0, value), 1 / 2.4) - 0.055;
  return clamp(x) * 255;
}

export function rgbToOklch(color: Rgba): Oklch {
  validateRgb(color.r, color.g, color.b, color.a);
  const r = srgbToLinear(color.r);
  const g = srgbToLinear(color.g);
  const b = srgbToLinear(color.b);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  const L = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const A = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const B = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;
  const c = Math.sqrt(A * A + B * B);
  const h = c < 0.00001 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;

  return { l: L, c, h };
}

export function oklchToRgb({ l, c, h }: Oklch, a = 1): Rgba {
  finite(c, h);
  validateUnit(l, a);
  if (c < 0 || c > 4) throw new RangeError("Expected chroma between zero and four");
  const radians = ((((h % 360) + 360) % 360) * Math.PI) / 180;
  const A = c * Math.cos(radians);
  const B = c * Math.sin(radians);

  const lRoot = l + 0.3963377774 * A + 0.2158037573 * B;
  const mRoot = l - 0.1055613458 * A - 0.0638541728 * B;
  const sRoot = l - 0.0894841775 * A - 1.291485548 * B;

  const L = lRoot ** 3;
  const M = mRoot ** 3;
  const S = sRoot ** 3;

  return {
    r: linearToSrgb(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S),
    g: linearToSrgb(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S),
    b: linearToSrgb(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S),
    a,
  };
}

export function parseNumber(value: string, percentBase: number) {
  if (typeof value !== "string" || value.length > 256 || !Number.isFinite(percentBase)) return null;
  const match = value.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%)?$/i);
  if (!match) return null;
  const number = Number(match[1]) * (match[2] ? percentBase / 100 : 1);
  return Number.isFinite(number) ? number : null;
}

export function parseHue(value: string) {
  if (typeof value !== "string" || value.length > 256) return null;
  const match = value.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(deg|grad|rad|turn)?$/i);
  if (!match) return null;
  const multiplier = { deg: 1, grad: 0.9, rad: 180 / Math.PI, turn: 360 };
  const hue =
    Number(match[1]) * multiplier[(match[2]?.toLowerCase() || "deg") as keyof typeof multiplier];
  return Number.isFinite(hue) ? hue : null;
}

export function parseColor(value: string): Rgba | null {
  if (typeof value !== "string" || value.length > 256) return null;
  const input = value.trim();
  const hex = hexToRgba(input);
  if (hex) return hex;
  const match = input.match(/^(rgba?|hsla?|hsv|oklch)\(([^()]*)\)$/i);
  if (!match) return null;
  const format = match[1].toLowerCase();
  const body = match[2].trim();
  let parts: string[];
  let alpha: string | undefined;
  if (body.includes(",")) {
    if (body.includes("/") || format === "oklch") return null;
    parts = body.split(",").map((part) => part.trim());
    if (parts.length === 4) alpha = parts.pop();
  } else {
    const sections = body.split("/");
    if (sections.length > 2) return null;
    parts = sections[0].trim().split(/\s+/);
    alpha = sections[1]?.trim();
  }
  if (parts.length !== 3) return null;
  const a = alpha === undefined ? 1 : parseNumber(alpha, 1);
  if (a === null) return null;
  if (format === "rgb" || format === "rgba") {
    const channels = parts.map((part) => parseNumber(part, 255));
    if (channels.some((channel) => channel === null)) return null;
    return { r: byte(channels[0]!), g: byte(channels[1]!), b: byte(channels[2]!), a: clamp(a) };
  }
  if (format === "oklch") {
    const l = parseNumber(parts[0], 1);
    const c = parseNumber(parts[1], 0.4);
    const h = parseHue(parts[2]);
    if (l === null || c === null || h === null || c > 4) return null;
    return oklchToRgb({ l: clamp(l), c: Math.max(0, c), h }, clamp(a));
  }
  const h = parseHue(parts[0]);
  const s = parseNumber(parts[1], 100);
  const level = parseNumber(parts[2], 100);
  if (h === null || s === null || level === null) return null;
  return format === "hsv"
    ? hsvToRgb({ h, s: clamp(s / 100), v: clamp(level / 100) }, clamp(a))
    : hslToRgb({ h, s: clamp(s / 100), l: clamp(level / 100) }, clamp(a));
}

export function composite(color: Rgba, background: number) {
  validateRgb(color.r, color.g, color.b, color.a);
  validateRgb(background, background, background);
  return {
    r: color.r * color.a + background * (1 - color.a),
    g: color.g * color.a + background * (1 - color.a),
    b: color.b * color.a + background * (1 - color.a),
  };
}

export function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  validateRgb(r, g, b);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrast(color: Rgba, background: number) {
  const fg = luminance(composite(color, background));
  const bg = luminance({ r: background, g: background, b: background });
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

export function formatValues(color: Rgba) {
  const hsl = rgbToHsl(color);
  const hsv = rgbToHsv(color);
  const oklch = rgbToOklch(color);
  const alpha = color.a < 0.999 ? ` / ${round(color.a, 3)}` : "";

  return {
    HEX: rgbaToHex(color),
    RGB: `rgb(${byte(color.r)} ${byte(color.g)} ${byte(color.b)}${alpha})`,
    HSL: `hsl(${round(hsl.h, 1)} ${round(hsl.s * 100, 1)}% ${round(hsl.l * 100, 1)}%${alpha})`,
    HSV: `hsv(${round(hsv.h, 1)} ${round(hsv.s * 100, 1)}% ${round(hsv.v * 100, 1)}%${alpha})`,
    OKLCH: `oklch(${round(oklch.l * 100, 2)}% ${round(oklch.c, 4)} ${round(oklch.h, 1)}${alpha})`,
  };
}

export type ColorFormat = keyof ReturnType<typeof formatValues>;
