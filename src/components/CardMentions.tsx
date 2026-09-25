import Link from "next/link";
import type { ReactNode } from "react";
import { getDictionary, href, type Dictionary, type Locale } from "@/lib/i18n";
import { getCard, sagas, type Card } from "@/lib/data/cards";
import { linkCardNames } from "@/lib/cardlinks";
import { initials } from "@/lib/cardArt";
import { mentionHtml, type MentionPeek } from "@/lib/cardPeek";
import { CardMentionEdges } from "./CardMentionEdges";

/** `id` non serve più (gli id dei pannelli li dà il browser quando li crea): resta facoltativo perché le pagine lo passano. */
type Props = { text: string; locale: Locale; dict: Dictionary; id?: string };

/**
 * Testo semplice scritto dagli utenti (guide dei mazzi; in futuro i commenti) con i nomi ufficiali delle carte
 * trasformati in link alla scheda carta, con anteprima al passaggio del mouse o al focus da tastiera
 * (stili `.card-mention*` in globals.css). Restituisce nodi React (stringhe + elementi) da mettere in un
 * `<p className="whitespace-pre-line">`: gli a-capo restano e niente viene interpretato come HTML. Solo lato server:
 * il riconoscimento usa il database carte, che non deve finire nel bundle client.
 *
 * Nel testo della pagina resta solo il link con il nome (GEO-01, 25/09/2026): i dati dell'anteprima stanno in
 * `data-peek` (sulla prima menzione di ogni carta, le altre li prendono da lì) e il pannello lo crea
 * `CardMentionEdges` al primo passaggio del mouse o al focus, e lo tiene dentro la finestra. Se il testo cita almeno
 * una carta, `CardMentionEdges` arriva insieme ai nodi (non disegna niente).
 */
export function CardMentions({ text, locale, dict }: Props): ReactNode {
  const seen = new Set<string>();
  const nodes: ReactNode[] = linkCardNames(text).map((seg, i) => {
    if (typeof seg === "string") return seg;
    const card = getCard(seg.slug);
    if (!card) return seg.text;
    const first = !seen.has(card.slug);
    seen.add(card.slug);
    return <CardMention key={i} card={card} text={seg.text} locale={locale} peek={first ? peekJson(card, locale, dict) : undefined} />;
  });
  return seen.size ? [...nodes, <CardMentionEdges key="edges" />] : nodes;
}

/** Dati dell'anteprima (JSON per `data-peek`), per carta e lingua: una guida cita la stessa carta anche dieci volte. */
const peekCache = new Map<string, string>();

/**
 * Quello che il pannello mostra, nella lingua della pagina: carta intera (metà pannello, richiesta di Pierluigi del
 * 20/09/2026: la miniatura era troppo piccola e il riquadro restava mezzo vuoto), costo, potenza/salute, tipo,
 * Leggendaria, saga e testo. L'immagine da 480 px si scarica solo quando il pannello nasce, al primo passaggio.
 */
function peekJson(card: Card, locale: Locale, dict: Dictionary): string {
  const key = `${locale}:${card.slug}`;
  const cached = peekCache.get(key);
  if (cached) return cached;
  const c = dict.common;
  const typeLabel = { unit: c.unit, spell: c.spell, token: c.token }[card.type];
  const art = card.image ?? card.thumb;
  const hasStats = card.mana !== undefined || card.power !== undefined;
  const peek: MentionPeek = {
    name: card.name,
    legendary: card.legendary || undefined,
    art,
    initials: art ? undefined : initials(card.name),
    // Leggendaria detta a parole nella riga del tipo; la stella gialla sta davanti al nome, nello stesso colore
    kicker: [typeLabel, card.legendary ? c.legendary : "", sagas[card.saga][locale]].filter(Boolean).join(" · "),
    mana: card.mana,
    stats: card.power !== undefined ? `${card.power}/${card.health ?? "?"}` : undefined,
    ability: card.ability?.[locale] || undefined,
    labels: {
      preview: c.cardPreview,
      mana: card.mana !== undefined ? c.mana : undefined,
      stats: card.power !== undefined ? `${c.power}/${c.health}` : undefined,
      unknown: hasStats ? undefined : c.unknownStats,
    },
  };
  const json = JSON.stringify(peek);
  peekCache.set(key, json);
  return json;
}

/**
 * Link con il nome della carta; il pannello lo aggiunge il browser (su touch non si vede e il tocco porta alla scheda).
 * `peek` = dati dell'anteprima, solo sulla prima menzione della carta nel testo.
 */
function CardMention({ card, text, locale, peek }: { card: Card; text: string; locale: Locale; peek?: string }) {
  return (
    <span className="card-mention" data-peek={peek}>
      <Link href={href(locale, `/cards/${card.slug}`)} className="card-mention-link" prefetch={false}>
        {text}
      </Link>
    </span>
  );
}

/**
 * La stessa menzione di `CardMention` come stringa HTML, per il Markdown di news e guide (che arriva come HTML e non
 * può ospitare componenti React in mezzo a paragrafi, elenchi e tabelle). `linkHtml` è il testo del link già
 * convertito da `marked` (quindi già escapato); i dati dell'anteprima vengono dal nostro database e li escapa
 * `mentionHtml`. `withData`: è la prima menzione della carta nel testo, quella che porta i dati. Solo lato server,
 * come il resto del file.
 */
export function cardMentionHtml(card: Card, linkHtml: string, locale: Locale, withData = true): string {
  return mentionHtml(href(locale, `/cards/${card.slug}`), linkHtml, withData ? peekJson(card, locale, getDictionary(locale)) : undefined);
}
