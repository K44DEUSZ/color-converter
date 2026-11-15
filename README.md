# color-converter

[English version](README.en.md)

Jeśli masz kolor zapisany w HEX i potrzebujesz RGB, HSL, HSV albo OKLCH, te funkcje pozwalają go przeliczyć. Biblioteka obsługuje też przezroczystość i oblicza kontrast z jednolitym szarym tłem, w tym białym i czarnym.

Wydanie 1.0.1 zawiera poprawki po audycie i zachowuje dotychczasowe API. Changelog pozostaje w repozytorium i nie trafia do paczki.

## Jak użyć

Pobierz paczkę wybranego wydania z [Releases](https://github.com/K44DEUSZ/color-converter/releases), a następnie zainstaluj ją w swoim projekcie:

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

## Co warto wiedzieć

`parseColor` przyjmuje obsługiwany zapis tekstowy i zwraca RGBA lub `null`. `formatValues` przygotowuje pięć formatów do wyświetlenia. Konwersje liczbowe, np. `rgbToHsl`, `hslToRgb` i `rgbToOklch`, możesz wywołać osobno.

To parser wybranych formatów, a nie całej składni CSS: nie odczytuje nazw kolorów, zmiennych ani Display P3. Wynik OKLCH jest ograniczany do zakresu sRGB. Kontrast uwzględnia nałożenie przezroczystego koloru na wskazane tło.

Przeliczenie OKLab/OKLCH korzysta z [opisu modelu Björna Ottossona](https://bottosson.github.io/posts/oklab/).

Wejścia liczbowe muszą być skończone i mieścić się w zakresie danego modelu. Biblioteka przyjmuje chromę OKLCH od 0 do 4; większą odrzuca.

## Modele i API

| Typ     | Jednostki                                                         |
| ------- | ----------------------------------------------------------------- |
| `Rgba`  | `{ r, g, b, a }`: kanały `0..255`, również ułamkowe; alfa `0..1`. |
| `Hsl`   | `{ h, s, l }`: hue w stopniach, nasycenie i jasność `0..1`.       |
| `Hsv`   | `{ h, s, v }`: hue w stopniach, nasycenie i wartość `0..1`.       |
| `Oklch` | `{ l, c, h }`: jasność `0..1`, chroma `0..4`, hue w stopniach.    |

Hue może być dowolną skończoną liczbą i jest zawijane modulo 360. Konwersje HSL pozostają skończone także bardzo blisko czerni i bieli; obliczenia używają precyzji JavaScript `number`, nie arytmetyki dokładnej.

| Funkcja                                                                        | Wynik i zachowanie                                                                                                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `hexToRgba(text)`                                                              | RGBA albo `null`; HEX z opcjonalnym `#`, 3/4/6/8 cyfr, bez rozróżniania wielkości liter.                                              |
| `rgbaToHex(color)`                                                             | Wielkie litery `#RRGGBB` lub `#RRGGBBAA`; kanały zaokrąglane do bajtów.                                                               |
| `parseColor(text)`                                                             | RGBA albo `null`. Obsługuje HEX, `rgb`/`rgba`, `hsl`/`hsla`, `hsv`, `oklch`; do 256 znaków.                                           |
| `formatValues(color)`                                                          | Obiekt `HEX`, `RGB`, `HSL`, `HSV`, `OKLCH` z tekstami zaokrąglonymi do wyświetlania. `ColorFormat` jest unią tych kluczy.             |
| `rgbToHsl(color)`, `rgbToHsv(color)`, `rgbToOklch(color)`                      | Konwersja kanałów RGB; alfa nie jest składnikiem modeli wynikowych.                                                                   |
| `hslToRgb(value, a = 1)`, `hsvToRgb(value, a = 1)`, `oklchToRgb(value, a = 1)` | Zwracają RGBA, zachowują przekazaną alfę. OKLCH poza gamutem jest obcinane po kanałach, bez perceptualnego mapowania gamutu.          |
| `composite(color, background)`                                                 | RGB po nałożeniu koloru na nieprzezroczyste szare tło `0..255`; wynik nie zawiera alfy.                                               |
| `luminance({ r, g, b })`                                                       | Względna luminancja sRGB `0..1`.                                                                                                      |
| `contrast(color, background)`                                                  | Współczynnik `1..21` po nałożeniu alfy na szare tło. `255` to biel, `0` to czerń; liczba oznacza kanał szarości, nie pełny kolor HEX. |
| `clamp(value, min = 0, max = 1)`, `byte(value)`                                | Ograniczenie liczby do zakresu; `byte` także zaokrągla do liczby całkowitej `0..255`.                                                 |
| `srgbToLinear(value)`, `linearToSrgb(value)`                                   | Kanał sRGB `0..255` do liniowego `0..1` i odwrotnie; wartości poza zakresem są obcinane.                                              |
| `parseNumber(text, percentBase)`                                               | Liczba albo `null`; procent skaluje względem `percentBase`.                                                                           |
| `parseHue(text)`                                                               | Stopnie albo `null`; przyjmuje `deg`, `grad`, `rad`, `turn` lub liczbę bez jednostki.                                                 |

Parser funkcyjny przyjmuje formy ze spacjami i opcjonalnym `/ alfa`; RGB, HSL i HSV przyjmują także przecinki i czwarty argument alfa. Nie mieszaj przecinków ze slashem. HSL/HSV zapisuje nasycenie i jasność/wartość w punktach procentowych (`50` lub `50%`); OKLCH przyjmuje `l=0.5` lub `50%`, `c=0.1` lub `25%`. Tekstowe wartości spoza zakresu są obcinane, ujemna chroma staje się zerem, a chroma ponad 4 jest odrzucana. RGB z parsera jest zaokrąglane do bajtów.

`parseColor`, `hexToRgba`, `parseHue` i `parseNumber` zwracają `null` także dla nie-tekstowych argumentów JavaScript. Pozostałe funkcje zgłaszają `RangeError` dla nieprawidłowych kanałów lub nieskończonych/nie-liczbowych składowych; niepełny obiekt lub `null` może dać `TypeError`. `parseNumber` i `parseHue` nie trimują argumentu samodzielnie. Nie traktuj tekstów z `formatValues` jako bezstratnego formatu przechowywania; zachowaj liczbowy RGBA.

## Node.js i przeglądarka

Paczka ESM nie wymaga DOM, canvas ani frameworka. W Node.js użyj `.mjs` albo `"type": "module"`. W przeglądarce użyj bundlera lub importu pliku `dist/index.js` jako modułu. Nie ma osobnego eksportu CommonJS. Przykład działa w obu środowiskach:

```js
import { parseColor, contrast, hslToRgb } from "@k44deusz/color-converter";

const color = parseColor("rgb(0 0 0 / 50%)");
if (color) console.log(contrast(color, 255)); // Przezroczysta czerń na bieli.
const darkGreen = hslToRgb({ h: 120, s: 1, l: 1e-20 });
```

## Praca z kodem

Do pracy nad biblioteką użyj Node.js 24. Kod jest w TypeScript; wydania zawierają JavaScript ESM i deklaracje typów.

```sh
npm ci
npm run check
npm test
npm run check:package
```

Push na `main` uruchamia sprawdzenie kodu i testy. Wydanie publikuję osobno przez GitHub Actions, z numerem zapisanym w `package.json`. Automat nie zmienia tego numeru ani nie nadpisuje istniejącego wydania. Opublikowana paczka trafia do narzędzi na stronie po przejściu ich kontroli.

## Licencja

MIT. Copyright 2026 Bartosz Golat.
