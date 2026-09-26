import type { StreamCard, StreamDeckView } from "@/lib/community/streamView";
import { splitColumns, type DeckImageFormat } from "@/lib/stream";

/**
 * Disegno dell'immagine del mazzo per next/og (pacchetto STREAM, 26/09/2026): lo rende `ImageResponse` in
 * src/app/api/deck-image/[slug]/route.tsx. Satori capisce solo flexbox e una parte del CSS: ogni blocco con più figli
 * dichiara `display: flex`, niente classi né variabili CSS (i colori sono quelli dei token di globals.css, ripetuti
 * qui), niente griglie.
 *
 * Solo testo e forme, niente illustrazioni delle carte: satori non legge il WebP (accetta PNG, JPEG, GIF e SVG) e le
 * carte del sito sono tutte WebP; convertirle servirebbe sharp, una dipendenza che il progetto non dichiara. Resta
 * così fuori anche ogni materiale Koin: l'immagine è una lista, con i colori del sito e la dicitura "non affiliato".
 * Font: quello incluso in next/og (Geist Regular), finché i file TTF di Unbounded e Manrope non sono nel repo; il
 * titolo prende corpo con un contorno dello stesso colore. Niente simboli fuori dal latino (★, →): un glifo che il
 * font non ha farebbe scaricare a next/og un font da Google durante la richiesta. La stella è un SVG.
 */

const C = {
  felt: "#150c2c",
  night: "#182238",
  night2: "#121a2c",
  night3: "#22304b",
  sky: "#3fc4e8",
  mint: "#31e3bd",
  gold: "#f2d23c",
  pale: "#c8d1dd",
  paleMuted: "#8e9bb1",
  chalk: "#d9dfe8",
  ink: "#16102a",
};

/** Tag autore sull'immagine: gli stessi colori di `badgeStyle` (cardArt.ts); la community non si mostra. */
const BADGE: Record<string, { background: string; color: string }> = {
  staff: { background: C.gold, color: C.ink },
  pro: { background: "#a9e6f7", color: "#b3003c" },
  influencer: { background: "linear-gradient(45deg, #dc2743 0%, #cc2366 50%, #bc1888 100%)", color: "#ffffff" },
  creator: { background: C.sky, color: C.ink },
};

export type DeckImageLabels = {
  kicker: string;
  by: string;
  legendary: string;
  cards: string;
  unofficial: string;
  badge: string | null;
  archetype: string;
};

function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 1.8l3 6.9 7.4.6-5.6 4.9 1.7 7.3L12 17.6l-6.5 3.9 1.7-7.3L1.6 9.3 9 8.7z" fill={C.gold} />
    </svg>
  );
}

function Gem({ mana, size }: { mana?: number; size: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: C.mint,
        color: C.ink,
        fontSize: Math.round(size * 0.56),
        boxShadow: `0 0 0 ${Math.max(2, Math.round(size / 18))}px ${C.night}`,
      }}
    >
      {mana === undefined ? "?" : String(mana)}
    </div>
  );
}

function CardRow({ card, u, height, font, gem }: { card: StreamCard; u: number; height: number; font: number; gem: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: Math.round(14 * u),
        height,
        padding: `0 ${Math.round(14 * u)}px`,
        borderRadius: Math.round(12 * u),
        backgroundColor: C.night3,
        border: `${Math.max(2, Math.round(2 * u))}px solid rgba(63, 196, 232, 0.35)`,
      }}
    >
      <Gem mana={card.mana} size={gem} />
      <div style={{ display: "block", flex: 1, fontSize: font, color: C.chalk, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
        {card.custom ? `${card.name} *` : card.name}
      </div>
    </div>
  );
}

/** Misura di un testo che può essere lungo (nome del mazzo, della Leggendaria, link breve): scende di corpo invece di andare su troppe righe. */
function scaled(text: string, big: number, short: number, medium: number): number {
  if (text.length <= short) return big;
  if (text.length <= medium) return Math.round(big * 0.84);
  return Math.round(big * 0.72);
}

export function DeckImage({ view, format, labels, shortLink }: { view: StreamDeckView; format: DeckImageFormat; labels: DeckImageLabels; shortLink: string }) {
  const portrait = format === "9x16";
  // unità: misure pensate per 1280×720 (orizzontale) e 1080×1920 (verticale), scalate per l'og da 1200×630
  const u = portrait ? 1 : format === "og" ? 630 / 720 : 1;
  const px = (n: number) => Math.round(n * u);
  const badge = labels.badge && view.badge ? BADGE[view.badge] : undefined;
  const legendary = view.legendary;

  const header = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: px(portrait ? 26 : 17), letterSpacing: px(portrait ? 4 : 3), color: C.mint, textTransform: "uppercase" }}>{labels.kicker}</div>
      <div
        style={{
          display: "block",
          lineClamp: portrait ? 3 : 3,
          marginTop: px(portrait ? 20 : 12),
          fontSize: scaled(view.name, px(portrait ? 88 : 56), 16, 28),
          lineHeight: 1.06,
          color: C.sky,
          WebkitTextStroke: `${px(portrait ? 2 : 1.5)}px ${C.sky}`,
        }}
      >
        {view.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: px(portrait ? 16 : 12), marginTop: px(portrait ? 22 : 14), fontSize: px(portrait ? 36 : 24), color: C.pale }}>
        <div style={{ display: "flex" }}>{`${labels.by} ${view.author}`}</div>
        {badge && labels.badge ? (
          <div
            style={{
              display: "flex",
              padding: `${px(portrait ? 6 : 5)}px ${px(portrait ? 16 : 12)}px`,
              borderRadius: 999,
              // satori non accetta proprietà con valore undefined: si mette solo quella che serve
              ...(badge.background.startsWith("linear") ? { backgroundImage: badge.background } : { backgroundColor: badge.background }),
              color: badge.color,
              fontSize: px(portrait ? 22 : 15),
              letterSpacing: px(2),
              textTransform: "uppercase",
            }}
          >
            {labels.badge}
          </div>
        ) : null}
      </div>
    </div>
  );

  const legendaryBox = legendary ? (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: `${px(4)}px solid ${C.gold}`,
        borderRadius: px(18),
        backgroundColor: "rgba(242, 210, 60, 0.08)",
        padding: `${px(portrait ? 20 : 14)}px ${px(portrait ? 26 : 18)}px`,
      }}
    >
      <div style={{ display: "flex", fontSize: px(portrait ? 22 : 15), letterSpacing: px(3), color: C.gold, textTransform: "uppercase" }}>{labels.legendary}</div>
      <div style={{ display: "flex", alignItems: "center", gap: px(portrait ? 16 : 12), marginTop: px(portrait ? 10 : 6) }}>
        <Star size={px(portrait ? 52 : 34)} />
        <div
          style={{
            display: "block",
            flex: 1,
            lineClamp: 2,
            lineHeight: 1.08,
            fontSize: scaled(legendary.name, px(portrait ? 60 : 38), 14, 20),
            color: C.gold,
            WebkitTextStroke: `${px(1)}px ${C.gold}`,
          }}
        >
          {legendary.custom ? `${legendary.name} *` : legendary.name}
        </div>
        {legendary.mana !== undefined ? <Gem mana={legendary.mana} size={px(portrait ? 60 : 40)} /> : null}
      </div>
    </div>
  ) : null;

  const archetype = (
    <div style={{ display: "flex" }}>
      <div style={{ display: "flex", padding: `${px(portrait ? 8 : 5)}px ${px(portrait ? 18 : 12)}px`, borderRadius: 999, backgroundColor: C.sky, color: C.ink, fontSize: px(portrait ? 24 : 16) }}>
        {labels.archetype}
      </div>
    </div>
  );

  const footer = (
    <div style={{ display: "flex", flexDirection: "column", gap: px(portrait ? 10 : 6) }}>
      <div style={{ display: "flex", fontSize: scaled(shortLink, px(portrait ? 40 : 26), 32, 40), color: C.mint }}>{shortLink}</div>
      <div style={{ display: "flex", fontSize: px(portrait ? 20 : 13), color: C.paleMuted }}>{labels.unofficial}</div>
    </div>
  );

  const cardsLabel = (
    <div style={{ display: "flex", fontSize: px(portrait ? 24 : 16), letterSpacing: px(3), color: C.paleMuted, textTransform: "uppercase" }}>{labels.cards}</div>
  );

  const root = {
    display: "flex",
    width: "100%",
    height: "100%",
    padding: px(portrait ? 44 : 28),
    backgroundColor: C.felt,
    backgroundImage: "radial-gradient(circle at 10% 0%, rgba(49, 227, 189, 0.22), rgba(21, 12, 44, 0) 55%), radial-gradient(circle at 100% 0%, rgba(200, 30, 122, 0.22), rgba(21, 12, 44, 0) 50%)",
  } as const;
  const panel = {
    display: "flex",
    flex: 1,
    borderRadius: px(28),
    border: `${px(6)}px solid ${C.sky}`,
    backgroundImage: `linear-gradient(180deg, ${C.night} 0%, ${C.night2} 100%)`,
  } as const;

  if (portrait) {
    return (
      <div style={root}>
        <div style={{ ...panel, flexDirection: "column", padding: 52 }}>
          {header}
          <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 34 }}>
            {legendaryBox}
            {archetype}
          </div>
          <div style={{ display: "flex", marginTop: 34 }}>{cardsLabel}</div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", marginTop: 14, marginBottom: 30 }}>
            {view.cards.map((card) => (
              <CardRow key={card.slug} card={card} u={1.3} height={76} font={38} gem={54} />
            ))}
          </div>
          {footer}
        </div>
      </div>
    );
  }

  const columns = splitColumns(view.cards, 2);
  return (
    <div style={root}>
      <div style={{ ...panel, padding: px(34), gap: px(36) }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: px(440), flexShrink: 0 }}>
          {header}
          <div style={{ display: "flex", flexDirection: "column", gap: px(14) }}>
            {legendaryBox}
            {archetype}
          </div>
          {footer}
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {cardsLabel}
          <div style={{ display: "flex", flex: 1, gap: px(18), marginTop: px(14) }}>
            {columns.map((col, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                {col.map((card) => (
                  <CardRow key={card.slug} card={card} u={u} height={px(68)} font={px(23)} gem={px(40)} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
