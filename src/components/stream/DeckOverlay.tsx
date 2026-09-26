import type { StreamCard, StreamDeckView } from "@/lib/community/streamView";
import type { OverlayLayout } from "@/lib/stream";
import type { StreamLabels } from "@/lib/streamLabels";
import { initials, sagaHue } from "@/lib/cardArt";

/**
 * L'overlay per OBS di un mazzo (pacchetto STREAM, 26/09/2026), dentro il layout nudo di src/app/overlay:
 *
 * - verticale (default, 360 px di larghezza): la Leggendaria intera in alto e la lista delle dodici carte con il costo,
 *   come il tracker di un gioco di carte a lato dello schermo;
 * - orizzontale (?layout=horizontal, 1600 px): una fila con la Leggendaria e le dodici carte intere, per il bordo
 *   basso dello schermo.
 *
 * Le carte sono contenuto (regola del materiale Koin in CLAUDE.md): sempre intere, rimpicciolite ma mai ritagliate,
 * e sopra c'è solo la gemma del costo nell'angolo in alto, lontano dai crediti stampati in basso (ILLUS // …). Le carte
 * senza illustrazione (inserite a mano dall'autore) hanno il fondale della saga con le iniziali, come nel sito.
 * Pannello blu notte leggermente trasparente, perché resti leggibile sopra il gioco.
 */
const panel = "rounded-2xl border-[3px] border-sky shadow-card";
const panelBg = { background: "linear-gradient(180deg, rgba(24, 34, 56, 0.94) 0%, rgba(18, 26, 44, 0.94) 100%)" };
const gem = "grid shrink-0 place-items-center rounded-full bg-mint font-mono font-bold text-ink";

export function OverlayMessage({ text, lang }: { text: string; lang: string }) {
  return (
    <main lang={lang} className="p-3" style={{ maxWidth: 420 }}>
      <p className={`${panel} p-4 text-sm text-pale`} style={panelBg}>
        <span className="kicker block text-mint">OriginsMeta</span>
        <span className="mt-1 block">{text}</span>
      </p>
    </main>
  );
}

/** Carta intera rimpicciolita (mai ritagliata) con la gemma del costo; fondale della saga se manca l'illustrazione. */
function WholeCard({ card, src, width, gemSize }: { card: StreamCard; src?: string; width: number; gemSize: number }) {
  return (
    <span className="relative block overflow-hidden rounded-lg" style={{ width }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={card.name} width={width} className="block h-auto w-full" decoding="async" />
      ) : (
        <span
          className="grid aspect-[0.7] w-full place-items-center rounded-lg border-2 border-dashed border-sky font-display text-lg font-extrabold text-chalk"
          style={{ background: sagaHue[card.saga ?? "other"] ?? sagaHue.other }}
          aria-label={card.name}
        >
          {initials(card.name) || "?"}
        </span>
      )}
      {card.mana !== undefined ? (
        <span className={`${gem} absolute left-1 top-1 text-sm`} style={{ width: gemSize, height: gemSize, boxShadow: "0 0 0 2px var(--color-night)" }}>
          {card.mana}
        </span>
      ) : null}
    </span>
  );
}

export function DeckOverlay({
  view,
  layout,
  lang,
  labels,
  shortLink,
}: {
  view: StreamDeckView;
  layout: OverlayLayout;
  lang: string;
  labels: StreamLabels["overlay"];
  shortLink: string;
}) {
  const legendary = view.legendary;
  const byline = `${labels.by} ${view.author}`;

  if (layout === "horizontal") {
    return (
      <main lang={lang} className="p-3" style={{ width: 1600 }}>
        <section className={`${panel} flex items-center gap-4 p-3`} style={panelBg}>
          <div className="flex w-[250px] shrink-0 flex-col gap-1 self-stretch">
            <p className="kicker text-mint">OriginsMeta</p>
            <h1 className="font-display text-xl font-extrabold leading-tight text-sky">{view.name}</h1>
            <p className="text-sm text-pale">{byline}</p>
            {legendary ? (
              <p className="mt-1 font-display text-sm font-bold text-gold">
                <span className="legendary-star" aria-hidden="true">
                  ★
                </span>
                {legendary.name}
                <span className="sr-only"> ({labels.legendary})</span>
              </p>
            ) : null}
            <p className="mt-auto font-mono text-sm font-medium text-mint">{shortLink}</p>
          </div>
          {legendary ? (
            <div className="shrink-0 rounded-xl border-[3px] border-gold p-1">
              <WholeCard card={legendary} src={legendary.image ?? legendary.thumb} width={150} gemSize={30} />
            </div>
          ) : null}
          <ol className="flex min-w-0 flex-1 items-start gap-2">
            {view.cards.map((card) => (
              <li key={card.slug} className="flex w-[92px] min-w-0 flex-col items-center gap-1">
                <WholeCard card={card} src={card.thumb ?? card.image} width={92} gemSize={24} />
                <span className="w-full truncate text-center text-[11px] font-bold text-chalk">{card.custom ? `${card.name} *` : card.name}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    );
  }

  return (
    <main lang={lang} className="p-3" style={{ width: 360 }}>
      <section className={`${panel} p-4`} style={panelBg}>
        <p className="kicker text-mint">OriginsMeta</p>
        <h1 className="mt-1 font-display text-xl font-extrabold leading-tight text-sky">{view.name}</h1>
        <p className="mt-1 text-sm text-pale">{byline}</p>
        {legendary ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="shrink-0 rounded-xl border-[3px] border-gold p-1">
              <WholeCard card={legendary} src={legendary.image ?? legendary.thumb} width={112} gemSize={26} />
            </div>
            <div className="min-w-0">
              <p className="kicker text-gold">{labels.legendary}</p>
              <p className="mt-1 font-display text-base font-bold leading-tight text-gold">
                <span className="legendary-star" aria-hidden="true">
                  ★
                </span>
                {legendary.custom ? `${legendary.name} *` : legendary.name}
              </p>
            </div>
          </div>
        ) : null}
        <p className="kicker mt-4 text-pale-muted">{labels.cards}</p>
        <ol className="mt-2 space-y-1">
          {view.cards.map((card) => (
            <li key={card.slug} className="flex items-center gap-2 rounded-lg border-2 border-sky/35 bg-night-3/90 px-2 py-1">
              <span className={`${gem} h-7 min-w-7 px-1 text-sm`}>{card.mana ?? "?"}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-chalk">{card.custom ? `${card.name} *` : card.name}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 font-mono text-sm font-medium text-mint">{shortLink}</p>
      </section>
    </main>
  );
}
