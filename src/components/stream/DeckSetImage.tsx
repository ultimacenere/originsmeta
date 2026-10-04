import type { StreamDeckSetView, StreamSetDeck } from "@/lib/community/streamView";
import { fill, splitColumns, type DeckImageFormat } from "@/lib/stream";
import { BADGE, C, CardRow, Gem, Star, scaled } from "./DeckImage";

/**
 * Disegno dell'immagine di un mazzo torneo per next/og (04/10/2026): lo rende `ImageResponse` in
 * src/app/api/deck-set-image/[slug]/route.tsx. Stesse regole di `DeckImage` (solo flexbox, colori ripetuti, niente
 * illustrazioni delle carte né materiale Koin, testi degli utenti già passati da `imageSafe` nella rotta, la stella è
 * un SVG) e gli stessi pezzi (riga della carta, gemma, stella, colori dei ruoli).
 *
 * - 16:9 e og (1280×720 e 1200×630, misure pensate per 1280×720 e scalate): titolo del trio e autore in alto, i tre
 *   mazzi affiancati (lettera, nome, Leggendaria con il costo, le dodici carte per costo in una colonna), link breve e
 *   dicitura "non affiliato" in basso. Conti: 720 − 56 − 12 − 56 = 596 px di altezza utile; tolti titolo (≈104), piede
 *   (≈28) e i due spazi, a ogni mazzo restano ≈430 px, cioè ≈28 px per carta.
 * - 9:16 (1080×1920): i tre mazzi in colonna, le dodici carte di ognuno in due colonne da sei. Conti: 1732 px utili,
 *   ≈445 per mazzo, ≈50 per riga di carte.
 */

export type DeckSetImageLabels = {
  kicker: string;
  by: string;
  deck: string;
  unofficial: string;
  badge: string | null;
};

function DeckBox({ deck, label, portrait, u }: { deck: StreamSetDeck; label: string; portrait: boolean; u: number }) {
  const px = (n: number) => Math.round(n * u);
  const legendary = deck.legendary;
  const row = portrait ? { height: 44, font: 26, gem: 32, scale: 0.8 } : { height: px(24), font: px(15), gem: px(19), scale: 0.55 * u };
  const columns = splitColumns(deck.cards, portrait ? 2 : 1);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        borderRadius: px(portrait ? 22 : 16),
        border: `${px(3)}px solid ${C.night3}`,
        backgroundColor: "rgba(34, 48, 75, 0.45)",
        padding: px(portrait ? 20 : 14),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: px(portrait ? 14 : 10) }}>
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            padding: `${px(portrait ? 5 : 3)}px ${px(portrait ? 14 : 10)}px`,
            borderRadius: 999,
            backgroundColor: C.sky,
            color: C.ink,
            fontSize: px(portrait ? 22 : 13),
            letterSpacing: px(2),
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        <div style={{ display: "block", flex: 1, fontSize: px(portrait ? 34 : 20), color: C.sky, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{deck.name}</div>
      </div>
      {legendary ? (
        <div style={{ display: "flex", alignItems: "center", gap: px(portrait ? 12 : 8), marginTop: px(portrait ? 10 : 8) }}>
          <Star size={px(portrait ? 36 : 22)} />
          <div
            style={{
              display: "block",
              flex: 1,
              fontSize: px(portrait ? 34 : 19),
              color: C.gold,
              WebkitTextStroke: `${px(portrait ? 1 : 0.6)}px ${C.gold}`,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {legendary.custom ? `${legendary.name} *` : legendary.name}
          </div>
          {legendary.mana !== undefined ? <Gem mana={legendary.mana} size={px(portrait ? 42 : 26)} /> : null}
        </div>
      ) : null}
      <div style={{ display: "flex", flex: 1, gap: px(portrait ? 14 : 10), marginTop: px(portrait ? 14 : 10) }}>
        {columns.map((col, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, justifyContent: "space-between" }}>
            {col.map((card) => (
              <CardRow key={card.slug} card={card} u={row.scale} height={row.height} font={row.font} gem={row.gem} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeckSetImage({ view, format, labels, shortLink }: { view: StreamDeckSetView; format: DeckImageFormat; labels: DeckSetImageLabels; shortLink: string }) {
  const portrait = format === "9x16";
  // unità: misure pensate per 1280×720 (orizzontale) e 1080×1920 (verticale), scalate per l'og da 1200×630
  const u = portrait ? 1 : format === "og" ? 630 / 720 : 1;
  const px = (n: number) => Math.round(n * u);
  const badge = labels.badge && view.badge ? BADGE[view.badge] : undefined;

  const header = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: px(portrait ? 26 : 17), letterSpacing: px(portrait ? 4 : 3), color: C.mint, textTransform: "uppercase" }}>{labels.kicker}</div>
      <div
        style={{
          display: "block",
          lineClamp: portrait ? 2 : 1,
          marginTop: px(portrait ? 16 : 8),
          fontSize: scaled(view.name, px(portrait ? 72 : 44), 18, 30),
          lineHeight: 1.06,
          color: C.sky,
          WebkitTextStroke: `${px(portrait ? 2 : 1.5)}px ${C.sky}`,
        }}
      >
        {view.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: px(portrait ? 16 : 12), marginTop: px(portrait ? 16 : 8), fontSize: px(portrait ? 34 : 22), color: C.pale }}>
        <div style={{ display: "flex" }}>{`${labels.by} ${view.author}`}</div>
        {badge && labels.badge ? (
          <div
            style={{
              display: "flex",
              padding: `${px(portrait ? 6 : 4)}px ${px(portrait ? 16 : 12)}px`,
              borderRadius: 999,
              // satori non accetta proprietà con valore undefined: si mette solo quella che serve
              ...(badge.background.startsWith("linear") ? { backgroundImage: badge.background } : { backgroundColor: badge.background }),
              color: badge.color,
              fontSize: px(portrait ? 22 : 14),
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

  const footer = (
    <div
      style={{
        display: "flex",
        flexDirection: portrait ? "column" : "row",
        alignItems: portrait ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: px(portrait ? 8 : 16),
      }}
    >
      <div style={{ display: "flex", fontSize: scaled(shortLink, px(portrait ? 36 : 24), 32, 40), color: C.mint }}>{shortLink}</div>
      <div style={{ display: "flex", fontSize: px(portrait ? 20 : 13), color: C.paleMuted }}>{labels.unofficial}</div>
    </div>
  );

  const decks = view.decks.map((deck) => <DeckBox key={deck.letter} deck={deck} label={fill(labels.deck, { letter: deck.letter })} portrait={portrait} u={u} />);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: px(portrait ? 44 : 28),
        backgroundColor: C.felt,
        backgroundImage: "radial-gradient(circle at 10% 0%, rgba(49, 227, 189, 0.22), rgba(21, 12, 44, 0) 55%), radial-gradient(circle at 100% 0%, rgba(200, 30, 122, 0.22), rgba(21, 12, 44, 0) 50%)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: px(portrait ? 24 : 16),
          borderRadius: px(28),
          border: `${px(6)}px solid ${C.sky}`,
          backgroundImage: `linear-gradient(180deg, ${C.night} 0%, ${C.night2} 100%)`,
          padding: px(portrait ? 44 : 28),
        }}
      >
        {header}
        <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", flex: 1, gap: px(portrait ? 20 : 18) }}>{decks}</div>
        {footer}
      </div>
    </div>
  );
}
