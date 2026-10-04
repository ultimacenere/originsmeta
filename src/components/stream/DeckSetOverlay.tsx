import type { StreamCard, StreamDeckSetView, StreamSetDeck } from "@/lib/community/streamView";
import { fill, type OverlayLayout } from "@/lib/stream";
import type { StreamLabels } from "@/lib/streamLabels";
import { WholeCard, gem, note, panel, panelBg } from "./DeckOverlay";

/**
 * L'overlay per OBS di un mazzo torneo (04/10/2026, /overlay/deck-set/<slug>), dentro il layout nudo di src/app/overlay
 * e con gli stessi pezzi di `DeckOverlay` (pannello, gemma del costo, carta intera, dicitura "non affiliato"):
 *
 * - verticale (default, 420 px di larghezza, `OVERLAY_SET_SIZE`): nome del trio e autore, poi i tre mazzi uno sotto
 *   l'altro, ognuno con la lettera (A, B, C), la Leggendaria intera (miniatura ufficiale, mai ritagliata) accanto al
 *   nome e le dodici carte compatte in due colonne da sei, per costo. Conti: 420 − 24 (main) − 38 (bordo e padding) =
 *   358 px; un mazzo è alto circa 250 px (carta da 56 px, sei righe da 22), i tre stanno in 1000 px con titolo e piede;
 * - orizzontale (?layout=horizontal, 1600 × 300): colonna di testo da 220 px e i tre mazzi affiancati, ognuno con la
 *   Leggendaria da 76 px e le dodici carte in due colonne da sei. Conti: 1600 − 24 − 30 − 220 − 3 × 16 = 1278, cioè
 *   426 px per mazzo.
 *
 * Le dodici carte si leggono per costo dall'alto in basso e poi nella seconda colonna (griglia che scorre per colonne),
 * come la lista dei mazzi singoli. Le carte inserite a mano dall'autore hanno l'asterisco.
 */

/** Le dodici carte in due colonne consecutive (prima colonna i costi più bassi). */
function CompactCards({ cards, small }: { cards: StreamCard[]; small?: boolean }) {
  const rows = Math.max(1, Math.ceil(cards.length / 2));
  return (
    <ol className="grid min-w-0 flex-1 grid-flow-col grid-cols-2 gap-x-2 gap-y-0.5" style={{ gridTemplateRows: `repeat(${rows}, auto)` }}>
      {cards.map((card) => (
        <li key={card.slug} className={`flex min-w-0 items-center gap-1.5 rounded-md bg-night-3 px-1.5 ${small ? "py-px" : "py-0.5"}`}>
          <span className={`${gem} h-[18px] min-w-[18px] px-0.5 text-[11px]`}>{card.mana ?? "?"}</span>
          <span className={`min-w-0 flex-1 truncate font-bold text-chalk ${small ? "text-[11px]" : "text-xs"}`}>{card.custom ? `${card.name} *` : card.name}</span>
        </li>
      ))}
    </ol>
  );
}

/** Lettera del mazzo nel trio, come nella scheda (A, B, C), con l'etichetta per chi legge lo schermo. */
function Letter({ deck, labels }: { deck: StreamSetDeck; labels: StreamLabels["overlay"] }) {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-sky font-display text-xs font-extrabold text-ink" title={fill(labels.deck, { letter: deck.letter })}>
      <span aria-hidden="true">{deck.letter}</span>
      <span className="sr-only">{fill(labels.deck, { letter: deck.letter })}</span>
    </span>
  );
}

function LegendaryName({ deck, labels, className }: { deck: StreamSetDeck; labels: StreamLabels["overlay"]; className: string }) {
  const legendary = deck.legendary;
  if (!legendary) return null;
  return (
    <p className={`font-display font-bold leading-tight text-gold ${className}`}>
      <span className="legendary-star" aria-hidden="true">
        ★
      </span>
      {legendary.custom ? `${legendary.name} *` : legendary.name}
      <span className="sr-only"> ({labels.legendary})</span>
    </p>
  );
}

function LegendaryCard({ deck, width, gemSize }: { deck: StreamSetDeck; width: number; gemSize: number }) {
  const legendary = deck.legendary;
  if (!legendary) return null;
  return (
    <div className="shrink-0 self-start rounded-lg border-[3px] border-gold p-0.5">
      <WholeCard card={legendary} src={legendary.thumb ?? legendary.image} width={width} gemSize={gemSize} />
    </div>
  );
}

export function DeckSetOverlay({
  view,
  layout,
  lang,
  labels,
  shortLink,
}: {
  view: StreamDeckSetView;
  layout: OverlayLayout;
  lang: string;
  labels: StreamLabels["overlay"];
  shortLink: string;
}) {
  const byline = `${labels.by} ${view.author}`;

  if (layout === "horizontal") {
    return (
      <main lang={lang} className="p-3" style={{ width: 1600 }}>
        <section className={`${panel} flex items-stretch gap-4 p-3`} style={panelBg}>
          <div className="flex w-[220px] shrink-0 flex-col gap-1">
            <p className="kicker text-mint">OriginsMeta · {labels.set}</p>
            <h1 className="font-display text-xl font-extrabold leading-tight text-sky">{view.name}</h1>
            <p className="text-sm text-pale">{byline}</p>
            <p className="mt-auto font-mono text-sm font-medium text-mint">{shortLink}</p>
            <p className={note}>{labels.unofficial}</p>
          </div>
          {view.decks.map((deck) => (
            <div key={deck.letter} className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl bg-night-2/70 p-2">
              <div className="flex min-w-0 items-center gap-2">
                <Letter deck={deck} labels={labels} />
                <p className="min-w-0 flex-1 truncate font-display text-sm font-bold text-sky">{deck.name}</p>
                <LegendaryName deck={deck} labels={labels} className="max-w-[45%] truncate text-xs" />
              </div>
              <div className="flex min-w-0 items-start gap-2">
                <LegendaryCard deck={deck} width={76} gemSize={22} />
                <CompactCards cards={deck.cards} small />
              </div>
            </div>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main lang={lang} className="p-3" style={{ width: 420 }}>
      <section className={`${panel} p-4`} style={panelBg}>
        <p className="kicker text-mint">OriginsMeta · {labels.set}</p>
        <h1 className="mt-1 font-display text-xl font-extrabold leading-tight text-sky">{view.name}</h1>
        <p className="mt-1 text-sm text-pale">{byline}</p>
        <div className="mt-3 space-y-3">
          {view.decks.map((deck) => (
            <div key={deck.letter} className="rounded-xl bg-night-2/70 p-2">
              <div className="flex items-center gap-2">
                <LegendaryCard deck={deck} width={56} gemSize={20} />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <Letter deck={deck} labels={labels} />
                    <p className="min-w-0 flex-1 truncate font-display text-sm font-bold text-sky">{deck.name}</p>
                  </div>
                  <LegendaryName deck={deck} labels={labels} className="mt-1 truncate text-sm" />
                </div>
              </div>
              <div className="mt-2 flex">
                <CompactCards cards={deck.cards} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-sm font-medium text-mint">{shortLink}</p>
        <p className={`${note} mt-1`}>{labels.unofficial}</p>
      </section>
    </main>
  );
}
