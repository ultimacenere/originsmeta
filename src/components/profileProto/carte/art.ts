/*
  Le illustrazioni delle carte dei traguardi (prototipo «Il mazzo dei traguardi», 27/11/2026): disegni nostri, un'icona
  a tratto su un fondo della palette del sito, in un SVG in data URI. Mai materiale Koin: queste carte non esistono nel
  gioco. Il disegno sta a sinistra del centro perché la finestra d'arte delle magie ha l'angolo in alto a destra tagliato.
*/

export type ArtId =
  | "builder"
  | "architect"
  | "scholar"
  | "master"
  | "favorite"
  | "month"
  | "critic"
  | "challenger"
  | "organizer"
  | "champion"
  | "pioneer"
  | "field"
  | "me";

type Look = { top: string; bottom: string; ink: string; glyph: string };

const MINT = "#31e3bd";
const SKY = "#3fc4e8";
const GOLD = "#f2d23c";
const PINK = "#f6c3dd";
const CHALK = "#d9dfe8";

/* i disegni: tratto 4, centrati intorno a (86, 52) in un riquadro 200 × 100 */
const LOOKS: Record<ArtId, Look> = {
  builder: {
    top: "#21143c",
    bottom: "#182238",
    ink: MINT,
    glyph: `<rect x="62" y="22" width="34" height="48" rx="4"/><rect x="78" y="30" width="34" height="48" rx="4" fill="#182238"/><path d="M95 46v16M87 54h16"/>`,
  },
  architect: {
    top: "#182238",
    bottom: "#0e071f",
    ink: SKY,
    glyph: `<path d="M86 20 62 82M86 20l24 62M70 60h32"/><path d="M50 84h72"/><circle cx="86" cy="20" r="4"/>`,
  },
  scholar: {
    top: "#21143c",
    bottom: "#121a2c",
    ink: MINT,
    glyph: `<path d="M86 32c-10-7-22-8-32-6v48c10-2 22-1 32 6 10-7 22-8 32-6V26c-10-2-22-1-32 6Z"/><path d="M86 32v48M62 40h14M62 50h14M96 40h14M96 50h14"/>`,
  },
  master: {
    top: "#150c2c",
    bottom: "#22304b",
    ink: SKY,
    glyph: `<path d="M60 76 104 32c4-4 10-4 12 0s0 8-4 12L68 88l-12 4Z"/><path d="M98 38l12 12M60 76l8 12"/>`,
  },
  favorite: {
    top: "#21143c",
    bottom: "#150c2c",
    ink: GOLD,
    glyph: `<path d="m86 18 10 22 24 3-18 16 5 24-21-12-21 12 5-24-18-16 24-3Z"/>`,
  },
  month: {
    top: "#182238",
    bottom: "#21143c",
    ink: PINK,
    glyph: `<rect x="58" y="26" width="56" height="54" rx="6"/><path d="M58 42h56M72 18v14M100 18v14"/><path d="m86 50 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z"/>`,
  },
  critic: {
    top: "#121a2c",
    bottom: "#182238",
    ink: SKY,
    glyph: `<path d="M60 30h52M60 46h40M60 62h28M60 78h16"/>`,
  },
  challenger: {
    top: "#21143c",
    bottom: "#121a2c",
    ink: CHALK,
    glyph: `<path d="m60 24 40 44M112 24 72 68"/><path d="m92 62 12 12M80 62 68 74M100 80l8-8M72 80l-8-8"/>`,
  },
  organizer: {
    top: "#182238",
    bottom: "#150c2c",
    ink: MINT,
    glyph: `<path d="M54 28h18v20h18M54 68h18V48M90 48h12M54 28v0M102 48h14"/><circle cx="54" cy="28" r="3"/><circle cx="54" cy="68" r="3"/><circle cx="116" cy="48" r="4"/>`,
  },
  champion: {
    top: "#21143c",
    bottom: "#150c2c",
    ink: GOLD,
    glyph: `<path d="M68 22h36v18c0 10-8 18-18 18s-18-8-18-18Z"/><path d="M68 28H56c0 10 6 16 14 16M104 28h12c0 10-6 16-14 16M86 58v12M74 80h24M78 70h16v10H78Z"/>`,
  },
  pioneer: {
    top: "#150c2c",
    bottom: "#182238",
    ink: MINT,
    glyph: `<path d="M74 82V20"/><path d="M74 22h36l-8 12 8 12H74"/><path d="M48 84c14-10 38-10 52 0"/>`,
  },
  field: {
    top: "#121a2c",
    bottom: "#21143c",
    ink: SKY,
    glyph: `<path d="M54 80h68M58 80V24"/><path d="m64 68 14-16 12 8 22-26"/><circle cx="112" cy="34" r="4"/>`,
  },
  me: {
    top: "#21143c",
    bottom: "#0e071f",
    ink: MINT,
    glyph: `<circle cx="100" cy="40" r="16"/><path d="M68 92c4-18 18-28 32-28s28 10 32 28"/>`,
  },
};

/** L'illustrazione di una carta dei traguardi, come data URI (`src` dell'immagine della finestra d'arte). */
export function artUri(id: ArtId): string {
  const l = LOOKS[id];
  const sparks = [
    [18, 18],
    [150, 70],
    [36, 82],
    [170, 22],
    [128, 88],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${l.ink}" opacity=".45"/>`)
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${l.top}"/><stop offset="1" stop-color="${l.bottom}"/></linearGradient>` +
    `<radialGradient id="h" cx=".43" cy=".52" r=".45"><stop offset="0" stop-color="${l.ink}" stop-opacity=".22"/><stop offset="1" stop-color="${l.ink}" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="200" height="100" fill="url(#g)"/><rect width="200" height="100" fill="url(#h)"/>${sparks}` +
    `<g fill="none" stroke="${l.ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${l.glyph}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
