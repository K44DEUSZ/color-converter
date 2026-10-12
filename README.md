# color-utils

[English version](README.en.md)

Jeśli masz kolor zapisany w HEX i potrzebujesz RGB, HSL, HSV albo OKLCH, te funkcje pozwalają go przeliczyć. Biblioteka obsługuje też przezroczystość i oblicza kontrast z jednolitym szarym tłem, w tym białym i czarnym.

## Jak użyć

Pobierz paczkę wybranego wydania z [Releases](https://github.com/K44DEUSZ/color-utils/releases), a następnie zainstaluj ją w swoim projekcie:

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

## Co warto wiedzieć

`parseColor` przyjmuje obsługiwany zapis tekstowy i zwraca RGBA lub `null`. `formatValues` przygotowuje pięć formatów do wyświetlenia. Konwersje liczbowe, np. `rgbToHsl`, `hslToRgb` i `rgbToOklch`, możesz wywołać osobno.

To parser wybranych formatów, a nie całej składni CSS: nie odczytuje nazw kolorów, zmiennych ani Display P3. Wynik OKLCH jest ograniczany do zakresu sRGB. Kontrast uwzględnia nałożenie przezroczystego koloru na wskazane tło.

Przeliczenie OKLab/OKLCH korzysta z [opisu modelu Björna Ottossona](https://bottosson.github.io/posts/oklab/).

Wejścia liczbowe muszą być skończone i mieścić się w zakresie danego modelu. Biblioteka przyjmuje chromę OKLCH od 0 do 4; większą odrzuca.

## Praca z kodem

Do pracy nad biblioteką użyj Node.js 24. Kod jest w TypeScript; wydania zawierają JavaScript ESM i deklaracje typów.

```sh
npm ci
npm run check
npm test
```

Po poprawnym sprawdzeniu zmian na `main` automat publikuje wydanie. Jeśli numer już istnieje, zwiększa ostatnią część wersji i zapisuje tę zmianę w Git. Paczki są dostępne na GitHubie; nie wymagają konta w rejestrze npm.

## Licencja

MIT. Copyright 2026 Bartosz Golat.
