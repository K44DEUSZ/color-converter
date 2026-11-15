import assert from "node:assert/strict";
import test from "node:test";
import {
  parseColor,
  hexToRgba,
  rgbaToHex,
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  hsvToRgb,
  rgbToOklch,
  oklchToRgb,
  contrast,
  formatValues,
  composite,
  luminance,
  clamp,
  byte,
  srgbToLinear,
  linearToSrgb,
  parseNumber,
  parseHue,
} from "../dist/index.js";
const close = (actual, expected, tolerance = 0.0001) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
test("parses supported syntaxes, alpha and angle units", () => {
  assert.deepEqual(hexToRgba("#f00"), { r: 255, g: 0, b: 0, a: 1 });
  assert.deepEqual(parseColor("rgb(100% 0% 0% / 50%)"), { r: 255, g: 0, b: 0, a: 0.5 });
  assert.equal(rgbaToHex(parseColor("hsl(0.5turn 100% 50%)")), "#00FFFF");
  assert.equal(rgbaToHex(parseColor("hsv(120 100% 100%)")), "#00FF00");
  close(parseColor("#11223380").a, 128 / 255);
  assert.equal(rgbaToHex(parseColor("rgba(255, 0, 0, 0.5)")), "#FF000080");
  for (const text of [
    "nope",
    "rgb(1 2)",
    "rgb(NaN 0 0)",
    "oklch(1, 0, 0)",
    "#GGG",
    "a".repeat(257),
  ])
    assert.equal(parseColor(text), null);
});

test("HSL remains finite at floating-point distances from black and white", () => {
  for (const magnitude of [Number.MIN_VALUE, 1e-300, 1e-20, 1e-14, 1e-8, 1]) {
    for (const channels of [
      [magnitude, 0, 0],
      [0, magnitude, 0],
      [0, 0, magnitude],
      [magnitude, magnitude / 2, 0],
      [255, 255 - magnitude, 255 - magnitude],
    ]) {
      const color = { r: channels[0], g: channels[1], b: channels[2], a: 0.25 };
      const hsl = rgbToHsl(color);
      for (const value of Object.values(hsl)) assert.ok(Number.isFinite(value));
      assert.ok(hsl.s >= 0 && hsl.s <= 1 && hsl.l >= 0 && hsl.l <= 1);
      const restored = hslToRgb(hsl, color.a);
      for (const channel of ["r", "g", "b"]) close(restored[channel], color[channel], 1e-12);
      assert.equal(restored.a, color.a);
    }
  }
  for (const l of [1e-300, 1e-20, 1e-16]) {
    const green = hslToRgb({ h: 120, s: 1, l });
    assert.equal(green.r, 0);
    assert.equal(green.b, 0);
    close(green.g / (510 * l), 1, 1e-14);
    close(rgbToHsl(green).s, 1, 1e-14);
  }
});

test("numeric color spaces round trip a deterministic fractional RGB corpus", () => {
  let state = 123456789;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (let index = 0; index < 256; index += 1) {
    const color = { r: random() * 255, g: random() * 255, b: random() * 255, a: random() };
    for (const [forward, inverse, tolerance] of [
      [rgbToHsl, hslToRgb, 1e-10],
      [rgbToHsv, hsvToRgb, 1e-10],
      [rgbToOklch, oklchToRgb, 0.001],
    ]) {
      const restored = inverse(forward(color), color.a);
      for (const channel of ["r", "g", "b"]) close(restored[channel], color[channel], tolerance);
      assert.equal(restored.a, color.a);
    }
  }
});

test("alpha compositing, transfer functions and contrast preserve boundary identities", () => {
  const color = { r: 120, g: 50, b: 240, a: 0 };
  for (const background of [0, 12.5, 127, 255]) {
    assert.deepEqual(composite(color, background), {
      r: background,
      g: background,
      b: background,
    });
    close(contrast(color, background), 1);
    close(contrast({ r: background, g: background, b: background, a: 1 }, background), 1);
  }
  close(luminance({ r: 0, g: 0, b: 0 }), 0);
  close(luminance({ r: 255, g: 255, b: 255 }), 1);
  for (const value of [0, 0.1, 10, 10.31475, 128.25, 255])
    // Rounded transfer-function thresholds leave a tiny discontinuity at the boundary.
    close(linearToSrgb(srgbToLinear(value)), value, 1e-5);
});

test("text parsers and numeric APIs reject invalid JavaScript input predictably", () => {
  for (const value of [null, undefined, 42, {}, ["#fff"]]) {
    assert.equal(parseColor(value), null);
    assert.equal(hexToRgba(value), null);
    assert.equal(parseHue(value), null);
    assert.equal(parseNumber(value, 100), null);
  }
  for (const value of [NaN, Infinity, -Infinity, "1", null, undefined]) {
    assert.throws(() => clamp(value), RangeError);
    assert.throws(() => byte(value), RangeError);
    assert.throws(() => srgbToLinear(value), RangeError);
    assert.throws(() => linearToSrgb(value), RangeError);
    assert.throws(() => rgbToHsl({ r: value, g: 0, b: 0, a: 1 }), RangeError);
  }
  for (const color of [null, undefined]) {
    assert.throws(() => rgbToHsl(color), TypeError);
    assert.throws(() => hslToRgb(color), TypeError);
  }
  assert.throws(() => clamp(0, 1, 0), RangeError);
  assert.throws(() => contrast({ r: 0, g: 0, b: 0, a: 1 }, 256), RangeError);
  assert.throws(() => oklchToRgb({ l: 0.5, c: -1, h: 0 }), RangeError);
  for (const text of ["rgb(1 2 3 /)", "rgb(1, 2, 3 / 1)", "hsl(0 none 0%)", "var(--x)"])
    assert.equal(parseColor(text), null);
});
test("round trips primary and neutral colors across all numeric spaces", () => {
  for (const color of [
    { r: 0, g: 0, b: 0, a: 1 },
    { r: 255, g: 255, b: 255, a: 1 },
    { r: 255, g: 0, b: 0, a: 0.5 },
    { r: 42, g: 91, b: 177, a: 1 },
  ]) {
    for (const converted of [
      hslToRgb(rgbToHsl(color), color.a),
      hsvToRgb(rgbToHsv(color), color.a),
      oklchToRgb(rgbToOklch(color), color.a),
    ])
      for (const channel of ["r", "g", "b", "a"]) close(converted[channel], color[channel], 0.001);
  }
  const red = rgbToOklch({ r: 255, g: 0, b: 0, a: 1 });
  close(red.l, 0.6279553606);
  close(red.c, 0.2576833077);
  close(red.h, 29.233885);
});
test("contrast includes alpha compositing and known black/white ratios", () => {
  close(contrast({ r: 0, g: 0, b: 0, a: 1 }, 255), 21);
  close(contrast({ r: 255, g: 255, b: 255, a: 1 }, 255), 1);
  close(contrast({ r: 0, g: 0, b: 0, a: 0 }, 255), 1);
  assert.equal(formatValues({ r: 255, g: 0, b: 0, a: 1 }).HEX, "#FF0000");
});
test("rejects non-finite components and excessive chroma before conversion", () => {
  for (const input of ["oklch(1 1e300 0)", "oklch(1 5 0)"]) assert.equal(parseColor(input), null);
  assert.throws(() => hslToRgb({ h: Infinity, s: 1, l: 0.5 }), RangeError);
  assert.throws(() => rgbToOklch({ r: NaN, g: 0, b: 0, a: 1 }), RangeError);
  assert.throws(() => contrast({ r: 0, g: 0, b: 0, a: 2 }, 255), RangeError);
  assert.deepEqual(oklchToRgb({ l: 0.5, c: 0.1, h: 360 }), oklchToRgb({ l: 0.5, c: 0.1, h: 0 }));
});
test("dark saturated colors remain valid despite floating-point rounding", () => {
  for (const green of [1, 2, 3, 5, 17, 33, 127, 255]) {
    const color = { r: 0, g: green, b: 0, a: 1 };
    const converted = hslToRgb(rgbToHsl(color));
    close(converted.g, green);
    assert.equal(rgbaToHex(converted), rgbaToHex(color));
  }
  assert.equal(rgbaToHex(parseColor("hsl(120 100% 1%)")), "#000500");
});
