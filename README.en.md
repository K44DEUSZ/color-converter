# color-converter

[Wersja polska](README.md)

Use these functions to convert a HEX color into RGB, HSL, HSV or OKLCH. They also handle alpha and calculate contrast against a solid grayscale background, including white and black.

## Usage

Download the package for your chosen version from [Releases](https://github.com/K44DEUSZ/color-converter/releases), then install it in your project:

```sh
npm install ./k44deusz-color-converter-1.0.1.tgz
```

```ts
import { parseColor, formatValues, contrast } from "@k44deusz/color-converter";

const color = parseColor("#CEFF49");
if (color) {
  const formats = formatValues(color);
  const ratio = contrast(color, 255);
}
```

## Details

`parseColor` reads a supported string and returns RGBA or `null`. `formatValues` produces five display formats. Numeric conversions such as `rgbToHsl`, `hslToRgb` and `rgbToOklch` are also available separately.

This parses selected formats rather than the complete CSS grammar: named colors, variables and Display P3 are not supported. OKLCH output is clipped to sRGB. Contrast includes compositing the alpha color against the selected background.

The OKLab/OKLCH conversion follows [Björn Ottosson's model](https://bottosson.github.io/posts/oklab/).

Numeric inputs must be finite and within the range of their model. The library accepts OKLCH chroma from 0 to 4 and rejects higher values.

## Models and API

| Type    | Units                                                                   |
| ------- | ----------------------------------------------------------------------- |
| `Rgba`  | `{ r, g, b, a }`: channels `0..255`, including fractions; alpha `0..1`. |
| `Hsl`   | `{ h, s, l }`: hue in degrees, saturation and lightness `0..1`.         |
| `Hsv`   | `{ h, s, v }`: hue in degrees, saturation and value `0..1`.             |
| `Oklch` | `{ l, c, h }`: lightness `0..1`, chroma `0..4`, hue in degrees.         |

Hue may be any finite number and wraps modulo 360. HSL conversions remain finite close to black and white; calculations use JavaScript `number` precision rather than exact arithmetic.

| Function                                                                       | Result and behavior                                                                                                                                        |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hexToRgba(text)`                                                              | RGBA or `null`; case-insensitive 3/4/6/8-digit HEX, with an optional `#`.                                                                                  |
| `rgbaToHex(color)`                                                             | Uppercase `#RRGGBB` or `#RRGGBBAA`; channels are rounded to bytes.                                                                                         |
| `parseColor(text)`                                                             | RGBA or `null`. Supports HEX, `rgb`/`rgba`, `hsl`/`hsla`, `hsv`, `oklch`; at most 256 characters.                                                          |
| `formatValues(color)`                                                          | An object with rounded display strings under `HEX`, `RGB`, `HSL`, `HSV`, `OKLCH`. `ColorFormat` is the union of these keys.                                |
| `rgbToHsl(color)`, `rgbToHsv(color)`, `rgbToOklch(color)`                      | Convert RGB channels; the result models have no alpha component.                                                                                           |
| `hslToRgb(value, a = 1)`, `hsvToRgb(value, a = 1)`, `oklchToRgb(value, a = 1)` | Return RGBA and retain the supplied alpha. Out-of-gamut OKLCH is clipped by channel, without perceptual gamut mapping.                                     |
| `composite(color, background)`                                                 | RGB after compositing against opaque grayscale `0..255`; the result has no alpha.                                                                          |
| `luminance({ r, g, b })`                                                       | Relative sRGB luminance `0..1`.                                                                                                                            |
| `contrast(color, background)`                                                  | Ratio `1..21` after alpha compositing against grayscale. `255` means white and `0` means black; the number is a grayscale channel, not a packed HEX color. |
| `clamp(value, min = 0, max = 1)`, `byte(value)`                                | Clamp a number; `byte` also rounds to an integer in `0..255`.                                                                                              |
| `srgbToLinear(value)`, `linearToSrgb(value)`                                   | Convert a channel from sRGB `0..255` to linear `0..1` and back; out-of-range values are clipped.                                                           |
| `parseNumber(text, percentBase)`                                               | A number or `null`; percentages scale against `percentBase`.                                                                                               |
| `parseHue(text)`                                                               | Degrees or `null`; accepts `deg`, `grad`, `rad`, `turn` or a unitless number.                                                                              |

Functional text accepts space-separated channels and optional `/ alpha`; RGB, HSL and HSV also accept commas with an optional fourth alpha argument. Do not mix commas and slashes. HSL/HSV saturation and lightness/value use percentage points (`50` or `50%`); OKLCH accepts `l=0.5` or `50%`, `c=0.1` or `25%`. Out-of-range text values are clipped, negative chroma becomes zero, and chroma above 4 is rejected. Parsed RGB channels are rounded to bytes.

`parseColor`, `hexToRgba`, `parseHue` and `parseNumber` also return `null` for non-string JavaScript inputs. Other functions raise `RangeError` for invalid channels or non-finite/non-numeric components; incomplete objects or `null` may raise `TypeError`. `parseNumber` and `parseHue` do not trim their own input. `formatValues` is not a lossless storage format; keep numerical RGBA for storage.

## Node.js and browsers

This ESM package needs no DOM, canvas or framework. In Node.js, use `.mjs` or `"type": "module"`. In browsers, use a bundler or import `dist/index.js` as a module. There is no separate CommonJS export. This example works in both environments:

```js
import { parseColor, contrast, hslToRgb } from "@k44deusz/color-converter";

const color = parseColor("rgb(0 0 0 / 50%)");
if (color) console.log(contrast(color, 255)); // Translucent black against white.
const darkGreen = hslToRgb({ h: 120, s: 1, l: 1e-20 });
```

## Development

Use Node.js 24 for development. The source is TypeScript; releases contain ESM JavaScript and type declarations.

```sh
npm ci
npm run check
npm test
npm run check:package
```

A push to `main` runs checks and tests. Releases are published separately through GitHub Actions, using the version saved in `package.json`. Automation does not change that version or overwrite an existing release. A published release updates the dependency used by the website after its checks pass.

## License

MIT. Copyright 2026 Bartosz Golat.
