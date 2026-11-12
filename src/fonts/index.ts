import localFont from "next/font/local";

/*
  I caratteri del sito dal 12/11/2026 (scelta di Pierluigi): Sofia Sans, una famiglia sola in tre larghezze.
    - Extra Condensed  i titoli (h1-h4 e le classi .t-*): variabile CSS --font-title
    - Condensed        tasti, menu, nomi di carte e mazzi, etichette: --font-display (la utility `font-display`)
    - normale          il testo e i numeri: --font-body e --font-mono
  I file stanno in ./sofia-sans (woff2 variabili, pesi 1-1000, licenza OFL accanto), divisi per gruppi di caratteri come li
  divide Google Fonts: il browser scarica solo quelli che la pagina usa, quindi il cirillico parte solo dove c'è del russo
  e non servono più istanze a parte per /ru. Si precaricano solo i tre file latini.

  `size-adjust` ingrandisce il carattere senza toccare le misure scritte nel codice: tutte le misure del sito erano
  tarate su Unbounded, che è molto largo, e un condensato alla stessa misura sarebbe minuscolo. Con il 162% un titolo da
  20 px occupa in larghezza un po' meno di prima ed è alto come uno da 32. Vale per ogni testo che usa la famiglia e non
  si eredita: un testo in un altro carattere dentro un titolo resta della sua misura. L'interlinea invece si calcola
  sulla misura scritta: per i titoli la corregge globals.css (regola dei titoli, `--title-leading`).
  Chi cambia una percentuale qui ricontrolla `--title-leading` e le interlinee dei nomi su due righe in globals.css.

  Le opzioni devono essere scritte per esteso in ogni chiamata: next/font le legge alla compilazione e non accetta
  variabili né funzioni. Gli intervalli di caratteri sono quelli di Google Fonts, uguali per le tre larghezze.
*/

// ---------- Extra Condensed: i titoli ----------
const titleLatin = localFont({
  src: "./sofia-sans/sofia-sans-extra-condensed-latin.woff2",
  weight: "1 1000",
  display: "swap",
  variable: "--font-xc-l",
  adjustFontFallback: false,
  declarations: [
    { prop: "size-adjust", value: "162%" },
    { prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  ],
});
const titleLatinExt = localFont({
  src: "./sofia-sans/sofia-sans-extra-condensed-latin-ext.woff2",
  weight: "1 1000",
  display: "swap",
  preload: false,
  variable: "--font-xc-le",
  adjustFontFallback: false,
  declarations: [
    { prop: "size-adjust", value: "162%" },
    { prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  ],
});
const titleCyrillic = localFont({
  src: "./sofia-sans/sofia-sans-extra-condensed-cyrillic.woff2",
  weight: "1 1000",
  display: "swap",
  preload: false,
  variable: "--font-xc-c",
  adjustFontFallback: false,
  declarations: [
    { prop: "size-adjust", value: "162%" },
    { prop: "unicode-range", value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" },
  ],
});
const titleCyrillicExt = localFont({
  src: "./sofia-sans/sofia-sans-extra-condensed-cyrillic-ext.woff2",
  weight: "1 1000",
  display: "swap",
  preload: false,
  variable: "--font-xc-ce",
  adjustFontFallback: false,
  declarations: [
    { prop: "size-adjust", value: "162%" },
    { prop: "unicode-range", value: "U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F" },
  ],
});

// ---------- Condensed: tasti, menu, nomi ed etichette ----------
const displayLatin = localFont({
  src: "./sofia-sans/sofia-sans-condensed-latin.woff2",
  weight: "1 1000",
  display: "swap",
  variable: "--font-cd-l",
  adjustFontFallback: false,
  declarations: [
    { prop: "size-adjust", value: "130%" },
    { prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  ],
});
const displayLatinExt = localFont({
  src: "./sofia-sans/sofia-sans-condensed-latin-ext.woff2",
  weight: "1 1000",
  display: "swap",
  preload: false,
  variable: "--font-cd-le",
  adjustFontFallback: false,
  declarations: [
    { prop: "size-adjust", value: "130%" },
    { prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  ],
});
const displayCyrillic = localFont({
  src: "./sofia-sans/sofia-sans-condensed-cyrillic.woff2",
  weight: "1 1000",
  display: "swap",
  preload: false,
  variable: "--font-cd-c",
  adjustFontFallback: false,
  declarations: [
    { prop: "size-adjust", value: "130%" },
    { prop: "unicode-range", value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" },
  ],
});
const displayCyrillicExt = localFont({
  src: "./sofia-sans/sofia-sans-condensed-cyrillic-ext.woff2",
  weight: "1 1000",
  display: "swap",
  preload: false,
  variable: "--font-cd-ce",
  adjustFontFallback: false,
  declarations: [
    { prop: "size-adjust", value: "130%" },
    { prop: "unicode-range", value: "U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F" },
  ],
});

// ---------- Larghezza normale: il testo e i numeri ----------
const bodyLatin = localFont({
  src: "./sofia-sans/sofia-sans-latin.woff2",
  weight: "1 1000",
  display: "swap",
  variable: "--font-sf-l",
  adjustFontFallback: false,
  declarations: [
    { prop: "size-adjust", value: "107%" },
    { prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" },
  ],
});
const bodyLatinExt = localFont({
  src: "./sofia-sans/sofia-sans-latin-ext.woff2",
  weight: "1 1000",
  display: "swap",
  preload: false,
  variable: "--font-sf-le",
  adjustFontFallback: false,
  declarations: [
    { prop: "size-adjust", value: "107%" },
    { prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" },
  ],
});
const bodyCyrillic = localFont({
  src: "./sofia-sans/sofia-sans-cyrillic.woff2",
  weight: "1 1000",
  display: "swap",
  preload: false,
  variable: "--font-sf-c",
  adjustFontFallback: false,
  declarations: [
    { prop: "size-adjust", value: "107%" },
    { prop: "unicode-range", value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" },
  ],
});
const bodyCyrillicExt = localFont({
  src: "./sofia-sans/sofia-sans-cyrillic-ext.woff2",
  weight: "1 1000",
  display: "swap",
  preload: false,
  variable: "--font-sf-ce",
  adjustFontFallback: false,
  declarations: [
    { prop: "size-adjust", value: "107%" },
    { prop: "unicode-range", value: "U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F" },
  ],
});

/** Le classi da mettere sull'<html> di ogni layout radice: dichiarano le variabili che globals.css compone nei token. */
export const siteFontVariables = [
  titleLatin,
  titleLatinExt,
  titleCyrillic,
  titleCyrillicExt,
  displayLatin,
  displayLatinExt,
  displayCyrillic,
  displayCyrillicExt,
  bodyLatin,
  bodyLatinExt,
  bodyCyrillic,
  bodyCyrillicExt,
]
  .map((font) => font.variable)
  .join(" ");
