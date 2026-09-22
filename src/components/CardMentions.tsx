import Link from "next/link";
import type { ReactNode } from "react";
import { getDictionary, href, type Dictionary, type Locale } from "@/lib/i18n";
import { getCard, sagas, type Card } from "@/lib/data/cards";
import { linkCardNames } from "@/lib/cardlinks";
import { initials } from "@/lib/cardArt";

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

/*
  Classi del pannello, condivise dalla versione React (testi della community) e da quella in HTML (`cardMentionHtml`,
  per il Markdown di news e guide): le due devono restare identiche.
*/
const KICKER = "kicker block text-[0.62rem] text-pale-muted";
const MANA_PILL = "stat-pill bg-mint font-bold text-ink";
const STAT_PILL = "stat-pill bg-night-3 text-pale";
const UNKNOWN = "block font-mono text-[11px] text-pale-muted";

/** Quello che il pannello mostra, nella lingua della pagina. */
function previewOf(card: Card, locale: Locale, dict: Dictionary) {
  const c = dict.common;
  const typeLabel = { unit: c.unit, spell: c.spell, token: c.token }[card.type];
  return {
    art: card.image ?? card.thumb,
    // Leggendaria detta a parole nella riga del tipo; la stella gialla sta davanti al nome, nello stesso colore
    kicker: [typeLabel, card.legendary ? c.legendary : "", sagas[card.saga][locale]].filter(Boolean).join(" · "),
    ability: card.ability?.[locale],
    hasStats: card.mana !== undefined || card.power !== undefined,
  };
}

/**
 * Link con il nome della carta e pannello di anteprima: costo (pastiglia menta, sempre in vista), potenza/salute,
 * tipo, Leggendaria, saga e testo nella lingua della pagina. Metà pannello è la carta intera con le sue proporzioni,
 * metà è il testo (richiesta di Pierluigi del 20/09/2026: la miniatura era troppo piccola e il riquadro restava
 * mezzo vuoto). L'immagine da 480 px si scarica solo al primo passaggio del mouse: fino ad allora il pannello è
 * `display: none`. Su touch il pannello non esiste e il tocco porta alla scheda.
 */
function CardMention({ card, text, locale, dict, id }: { card: Card; text: string; locale: Locale; dict: Dictionary; id: string }) {
  const c = dict.common;
  const p = previewOf(card, locale, dict);
  return (
    <span className="card-mention">
      <Link href={href(locale, `/cards/${card.slug}`)} className="card-mention-link" aria-describedby={id} prefetch={false}>
        {text}
      </Link>
      <span className="card-mention-preview" role="tooltip" id={id}>
        <span className={`card-mention-panel${card.legendary ? " is-legendary" : ""}`}>
          <span className="sr-only">{c.cardPreview}: </span>
          <span className={`card-mention-art${card.legendary ? " is-legendary" : ""}`}>
            {p.art ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.art} alt="" loading="lazy" decoding="async" />
            ) : (
              <span className="card-mention-art-empty" aria-hidden="true">
                {initials(card.name)}
              </span>
            )}
          </span>
          <span className="card-mention-body">
            <span className="card-mention-name">
              {card.legendary ? (
                <span className="legendary-star" aria-hidden="true">
                  ★
                </span>
              ) : null}
              {card.name}
            </span>
            <span className={KICKER}>{p.kicker}</span>
            {p.hasStats ? (
              <span className="card-mention-stats">
                {card.mana !== undefined ? (
                  <span className={MANA_PILL}>
                    {card.mana} <small>{c.mana}</small>
                  </span>
                ) : null}
                {card.power !== undefined ? (
                  <span className={STAT_PILL}>
                    {card.power}/{card.health ?? "?"} <small>{c.power}/{c.health}</small>
                  </span>
                ) : null}
              </span>
            ) : (
              <span className={UNKNOWN}>{c.unknownStats}</span>
            )}
            {p.ability ? <span className="card-mention-text">{p.ability}</span> : null}
          </span>
        </span>
      </span>
    </span>
  );
}

/** Escape per testo e attributi dell'HTML costruito a mano. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * La stessa menzione di `CardMention` come stringa HTML, per il Markdown di news e guide (che arriva come HTML e non
 * può ospitare componenti React in mezzo a paragrafi, elenchi e tabelle). `linkHtml` è il testo del link già
 * convertito da `marked` (quindi già escapato); tutto il resto viene dal nostro database ed è escapato qui.
 * Solo lato server, come il resto del file.
 */
export function cardMentionHtml(card: Card, linkHtml: string, locale: Locale, id: string): string {
  const dict = getDictionary(locale);
  const c = dict.common;
  const p = previewOf(card, locale, dict);
  const leg = card.legendary ? " is-legendary" : "";
  const art = p.art ? `<img src="${esc(p.art)}" alt="" loading="lazy" decoding="async">` : `<span class="card-mention-art-empty" aria-hidden="true">${esc(initials(card.name))}</span>`;
  const star = card.legendary ? `<span class="legendary-star" aria-hidden="true">★</span>` : "";
  const mana = card.mana !== undefined ? `<span class="${MANA_PILL}">${card.mana} <small>${esc(c.mana)}</small></span>` : "";
  const power = card.power !== undefined ? `<span class="${STAT_PILL}">${card.power}/${card.health ?? "?"} <small>${esc(c.power)}/${esc(c.health)}</small></span>` : "";
  const stats = p.hasStats ? `<span class="card-mention-stats">${mana}${power}</span>` : `<span class="${UNKNOWN}">${esc(c.unknownStats)}</span>`;
  const ability = p.ability ? `<span class="card-mention-text">${esc(p.ability)}</span>` : "";
  return (
    `<span class="card-mention"><a href="${esc(href(locale, `/cards/${card.slug}`))}" class="card-mention-link" aria-describedby="${esc(id)}">${linkHtml}</a>` +
    `<span class="card-mention-preview" role="tooltip" id="${esc(id)}"><span class="card-mention-panel${leg}">` +
    `<span class="sr-only">${esc(c.cardPreview)}: </span><span class="card-mention-art${leg}">${art}</span>` +
    `<span class="card-mention-body"><span class="card-mention-name">${star}${esc(card.name)}</span><span class="${KICKER}">${esc(p.kicker)}</span>${stats}${ability}</span>` +
    `</span></span></span>`
  );
}
