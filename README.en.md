# color-utils

[Wersja polska](README.md)

Use these functions to convert a HEX color into RGB, HSL, HSV or OKLCH. They also handle alpha and calculate contrast against a solid grayscale background, including white and black.

## Usage

Download the package for your chosen version from [Releases](https://github.com/K44DEUSZ/color-utils/releases), then install it in your project:

```sh
npm install ./k44deusz-color-utils-1.0.0.tgz
```

```ts
import { parseColor, formatValues, contrast } from "@k44deusz/color-utils";

const color = parseColor("#CEFF49");
if (color) {
  const formats = formatValues(color);
  const ratio = contrast(color, 255);
}
```

## Details

`parseColor` reads a supported string and returns RGBA or `null`. `formatValues` produces five display formats. Numeric conversions such as `rgbToHsl`, `hslToRgb` and `rgbToOklch` are also available separately.

This parses selected formats rather than the complete CSS grammar: named colors, variables and Display P3 are not supported. OKLCH output is clipped to sRGB. Contrast includes compositing the alpha color against the selected background.

The OKLab/OKLCH conversion follows [Björn Ottosson's model](https://bottosson.github.io/posts/oklab/); the model itself is not my invention.

Numeric inputs must be finite and within the range of their model. The library accepts OKLCH chroma from 0 to 4 and rejects higher values.

## Development

Use Node.js 24 for development. The source is TypeScript; releases contain ESM JavaScript and type declarations.

```sh
npm ci
npm run check
npm test
```

A successful check of changes on `main` publishes a release. If the version already exists, automation increments its patch number and commits the change. Packages are available on GitHub; an npm-registry account is not required.

## License

MIT. Copyright 2026 Bartosz Golat.
