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
