import type { CSSProperties } from "react";
import Link from "next/link";
import { alignStyle } from "@/lib/cardArt";

/**
 * Carta intera che si gira: UNA sola implementazione per il database /cards (CardExplorer), la scheda di un mazzo
 * (DeckCardGrid) e la pagina /style. Richiesta di Pierluigi del 22/09/2026: le carte della scheda di un mazzo
 * "come le carte nella sezione carte, più grandi, che al mouse over si flippano e fanno vedere i testi sempre
 * facendo vedere il mana". Prima c'erano due carte diverse (giro, gemma del costo, stella, piede): ora il markup e
 * gli stili sono gli stessi ovunque, e gli stili stanno in globals.css (`.card-tile*`).
 *
 * - FRONTE: la carta da collezione ufficiale (materiale Koin usato come contenuto), intera. Nessun ritaglio: i
 *   crediti impressi in basso (`ILLUS // …`, `KOIN GAMES INC`) restano scoperti.
 * - RETRO (solo dove il mouse esiste, `hover: hover`): tipo, Good o Evil, Leggendaria, Rimossa e il testo nella
 *   lingua della pagina. Il giro è di taglio, in due tempi da 160 ms. Dalla riunione del 23/09/2026 il retro tiene
 *   solo questo: saga, Neutral, parole chiave, rarità delle carte normali e pastiglia dell'ultimo bilanciamento
 *   sono rimaste nella scheda della carta, dove c'è lo spazio per leggerle.
 * - Gemma del costo in alto a sinistra e stella della Leggendaria in alto a destra: stanno sopra il retro e non
 *   girano mai, così il costo si vede sempre.
 * - PIEDE: nome e statistiche sotto la carta. `foot="always"` (database carte) lo mostra sempre; `foot="touch"`
 *   (scheda di un mazzo: "togliere le scritte blu ridondanti", il nome è già stampato sulla carta) lo mostra solo
 *   su touch, e col mouse nome e statistiche passano sul retro.
 *
 * Comandi, uguali nelle due pagine: col mouse la carta si gira al passaggio e il clic apre la scheda della carta;
 * da tastiera la carta si gira col focus e Invio apre la scheda; su touch non c'è retro, restano nome e statistiche
 * sotto la carta e il tocco apre la scheda (lì il testo completo). Scelta voluta: un tocco che gira la carta
 * avrebbe tolto il tocco che apre la scheda, e /cards (il riferimento) si comporta così da sempre.
 * Lettori di schermo: il link ha un nome breve (nome, Leggendaria, costo, statistiche); illustrazione e retro sono
 * nascosti (il testo completo sta nella scheda della carta), come prima in /cards.
 * Con "riduci animazioni" niente giro: il retro compare e basta.
 */

export type FlipCardData = {
  slug: string;
  /** scheda della carta, già con la lingua */
  href: string;
  name: string;
  /** carta ufficiale a 160 px e a 480 px */
  thumb?: string;
  image?: string;
  /** fondale e iniziali quando l'illustrazione manca */
  hue?: string;
  initials: string;
  mana?: number;
  power?: number;
  health?: number;
  legendary?: boolean;
  typeLabel: string;
  /** Good o Evil: il neutro non si mostra (riunione del 23/09/2026) */
  alignment?: "good" | "evil" | "neutral";
  alignmentLabel?: string;
  removed?: boolean;
  removedLabel?: string;
  /** testo dell'abilità già nella lingua della pagina */
  ability?: string;
};

export type FlipCardLabels = { legendary: string; mana: string; power: string; health: string };

/** Nome breve del link per i lettori di schermo: "Dorothy (Leggendaria). Mana 4. 3 Potenza, 5 Salute." */
function linkName(c: FlipCardData, labels: FlipCardLabels): string {
  const parts = [`${c.name}${c.legendary ? ` (${labels.legendary})` : ""}.`];
  if (c.mana !== undefined) parts.push(`${labels.mana} ${c.mana}.`);
  if (c.power !== undefined) parts.push(`${c.power} ${labels.power}, ${c.health ?? "?"} ${labels.health}.`);
  if (c.removed && c.removedLabel) parts.push(`${c.removedLabel}.`);
  return parts.join(" ");
}

export function FlipCard({
  card: c,
  labels,
  foot = "always",
  sizes = "(min-width: 1024px) 220px, (min-width: 640px) 30vw, 46vw",
}: {
  card: FlipCardData;
  labels: FlipCardLabels;
  foot?: "always" | "touch";
  sizes?: string;
}) {
  const src = c.thumb ?? c.image;
  // Nome e statistiche sul retro quando col mouse il piede non c'è (scheda di un mazzo)
  const headOnBack = foot !== "always";
  const stats = c.power !== undefined ? `${c.power}/${c.health ?? "?"}` : null;
  const star = c.legendary ? <span className="legendary-star">★</span> : null;

  return (
    <Link href={c.href} prefetch={false} className={`card-tile${c.legendary ? " is-legendary" : ""}${c.removed ? " is-removed" : ""}`}>
      <span className="card-tile-art" aria-hidden="true" style={src ? undefined : { background: c.hue }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            srcSet={c.thumb && c.image ? `${c.thumb} 160w, ${c.image} 480w` : undefined}
            sizes={c.thumb && c.image ? sizes : undefined}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="card-tile-initials">{c.initials}</span>
        )}

        {/* La carta del fronte torna come fondo del retro (--card-art, vedi `.card-tile-info::before` in globals.css):
            girando, l'illustrazione vera ruota via, e senza questa il retro sarebbe un rettangolo scuro. Si passa la
            versione a 480 px quando c'è: sfocata, la miniatura da 160 basterebbe, ma è già in cache dal fronte. */}
        <span
          className={`card-tile-info${headOnBack ? " has-head" : ""}`}
          style={src ? ({ "--card-art": `url("${(c.image ?? src).replace(/"/g, "%22")}")` } as CSSProperties) : undefined}
        >
          {headOnBack ? (
            <span className="card-tile-name">
              {star}
              {c.name}
            </span>
          ) : null}
          {/*
            Che cosa resta sul retro (riunione del 23/09/2026): nome, tipo, la Leggendaria e l'effetto. Via tutto
            il resto, che era rumore su un pannello grande come un francobollo: la saga ("Horror gotico" non dice
            niente di come si gioca la carta), l'allineamento Neutral (non è un valore: restano solo Good ed Evil),
            le parole chiave (Vanilla, Self Buff, Summon…), la pastiglia dell'ultimo bilanciamento e la rarità
            delle carte normali, che andrà alle varianti. Nella scheda della carta invece resta tutto.
          */}
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="stat-pill bg-night-3 text-[11px] text-pale">{c.typeLabel}</span>
            {/* Good ed Evil sì, Neutral no: sulla carta il neutro è l'assenza di schieramento */}
            {c.alignmentLabel && c.alignment && c.alignment !== "neutral" ? (
              <span className={`stat-pill text-[11px] ${alignStyle[c.alignment]}`}>{c.alignmentLabel}</span>
            ) : null}
            {c.legendary ? <span className="stat-pill bg-gold text-[11px] font-bold text-ink">{labels.legendary}</span> : null}
            {c.removed && c.removedLabel ? <span className="stat-pill bg-bad text-[11px] font-bold text-ink">{c.removedLabel}</span> : null}
          </span>
          {c.ability ? <span className="card-tile-text">{c.ability}</span> : null}
          {headOnBack && stats ? (
            <span className="card-tile-stats">
              <span className="gc-atk">{c.power} ⚔</span>
              <span className="gc-hp">{c.health ?? "?"} ♥</span>
            </span>
          ) : null}
        </span>

        {/* Sopra il retro, ferma: la gemma del costo, che resta sempre visibile. Il "×2" delle copie è sparito il
            23/09/2026: in un mazzo le carte base stanno sempre in due copie e la Leggendaria in una, quindi non
            informava nessuno. */}
        {c.mana !== undefined ? (
          <span className="card-tile-pills">
            <span className="card-tile-mana">{c.mana}</span>
          </span>
        ) : null}
        {c.legendary ? <span className="card-tile-star">★</span> : null}
      </span>

      <span className="sr-only">{linkName(c, labels)}</span>

      {/* Piede: nome (.t-item, stella gialla sulla Leggendaria) e statistiche. Nascosto ai lettori di schermo, che hanno già il nome del link. */}
      <span className={`card-tile-foot${foot === "touch" ? " is-touch-only" : ""}`} aria-hidden="true">
        <span className="t-item min-w-0 flex-1 truncate text-sm leading-tight">
          {star}
          {c.name}
        </span>
        {stats ? <span className="shrink-0 font-mono text-xs tabular text-pale">{stats}</span> : null}
      </span>
    </Link>
  );
}
