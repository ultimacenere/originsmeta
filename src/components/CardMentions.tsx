import Link from "next/link";
import type { ReactNode } from "react";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { getCard, sagas, type Card } from "@/lib/data/cards";
import { linkCardNames } from "@/lib/cardlinks";
import { CardArt } from "./CardChip";

type Props = { text: string; locale: Locale; dict: Dictionary; id: string };

/**
 * Testo semplice scritto dagli utenti (guide dei mazzi; in futuro i commenti) con i nomi ufficiali delle carte
 * trasformati in link alla scheda carta, con anteprima al passaggio del mouse o al focus da tastiera
 * (stili `.card-mention*` in globals.css; `CardMentionEdges` sposta il pannello quando sfonderebbe il bordo della finestra).
 * Restituisce nodi React (stringhe + elementi) da mettere in un `<p className="whitespace-pre-line">`: gli a-capo restano
 * e niente viene interpretato come HTML. Solo lato server: il riconoscimento usa il database carte, che non deve finire
 * nel bundle client. `id` distingue i pannelli della pagina (serve per `aria-describedby`).
 */
export function CardMentions({ text, locale, dict, id }: Props): ReactNode {
  return linkCardNames(text).map((seg, i) => {
    if (typeof seg === "string") return seg;
    const card = getCard(seg.slug);
    if (!card) return seg.text;
    return <CardMention key={i} card={card} text={seg.text} locale={locale} dict={dict} id={`${id}-${i}`} />;
  });
}

/** Link con il nome della carta e pannello di anteprima: costo, potenza/salute, tipo, Leggendaria, saga e testo nella lingua della pagina. */
function CardMention({ card, text, locale, dict, id }: { card: Card; text: string; locale: Locale; dict: Dictionary; id: string }) {
  const c = dict.common;
  const typeLabel = { unit: c.unit, spell: c.spell, token: c.token }[card.type];
  const ability = card.ability?.[locale];
  const hasStats = card.mana !== undefined || card.power !== undefined;
  return (
    <span className="card-mention">
      <Link href={href(locale, `/cards/${card.slug}`)} className="card-mention-link" aria-describedby={id} prefetch={false}>
        {text}
      </Link>
      <span className="card-mention-preview" role="tooltip" id={id}>
        <span className={`card-mention-panel${card.legendary ? " is-legendary" : ""}`}>
          <span className="sr-only">{c.cardPreview}: </span>
          <span className="card-mention-head">
            <CardArt card={card} />
            <span className="min-w-0">
              <span className="block font-display text-[0.85rem] font-bold leading-tight text-sky">{card.name}</span>
              <span className="kicker mt-1 block text-[0.62rem] text-pale-muted">
                {typeLabel} · {sagas[card.saga][locale]}
              </span>
              {card.legendary ? <span className="mt-1 block font-mono text-[11px] font-semibold text-gold">★ {c.legendary}</span> : null}
            </span>
          </span>
          {hasStats ? (
            <span className="card-mention-stats">
              {card.mana !== undefined ? (
                <span className="stat-pill bg-night-3 text-pale">
                  {card.mana} <small>{c.mana}</small>
                </span>
              ) : null}
              {card.power !== undefined ? (
                <span className="stat-pill bg-night-3 text-pale">
                  {card.power}/{card.health ?? "?"} <small>{c.power}/{c.health}</small>
                </span>
              ) : null}
            </span>
          ) : (
            <span className="block font-mono text-[11px] text-pale-muted">{c.unknownStats}</span>
          )}
          {ability ? <span className="card-mention-text">{ability}</span> : null}
        </span>
      </span>
    </span>
  );
}
