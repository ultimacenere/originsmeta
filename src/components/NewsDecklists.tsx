import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { archetypeLabels } from "@/lib/data/decks";
import { getCard } from "@/lib/data/cards";
import type { NewsDecklists as NewsDecklistsData } from "@/lib/data/news";
import { encodeOmCode } from "@/lib/deckcode";
import { deckGameCode } from "@/lib/deckGameCode";
import { setCodesOf } from "@/lib/community/deckSets";
import { fillLabel } from "@/lib/community/deckQuality";
import { deckLetter, deckSetLabels } from "@/lib/deckSetLabels";
import { CardName, DeckCardGrid } from "./CardChip";
import { CopyButton } from "./CopyButton";

/**
 * Le liste di un mazzo torneo dentro un articolo (28/10/2026, intervista a SouL; Pierluigi: "le sue decklist devono
 * diventare un deck da torneo e devono essere linkate e i codici facilmente copiabili"). In cima la scheda del mazzo
 * torneo e i tre mazzi nel deck builder; poi, per ogni mazzo, archetipo, nome e Leggendaria, le carte intere come nella
 * scheda del trio, il codice del gioco da copiare e il deck builder. La pagina della news lo mette al posto della riga
 * `{{decklists}}` del body (`splitDecklists` in news.ts).
 */
export async function NewsDecklists({ lists, locale, dict }: { lists: NewsDecklistsData; locale: Locale; dict: Dictionary }) {
  const S = deckSetLabels[locale];
  const c = dict.community;
  const decks = lists.decks.map((deck) => ({
    ...deck,
    custom_cards: [],
    code_om: encodeOmCode({ name: deck.name, legendary: deck.legendary, cards: deck.cards, customCards: [] }),
  }));
  const codes = await Promise.all(decks.map((deck) => deckGameCode(deck)));
  return (
    <section aria-label={S.page.decksTitle} className="my-8 space-y-5">
      <p className="flex flex-wrap gap-2">
        <Link href={href(locale, `/decks/tournament/${lists.set}`)} className="btn btn-primary text-xs">
          {S.page.openSet} →
        </Link>
        <Link href={`${href(locale, "/deck-builder")}#${setCodesOf(decks)}`} className="btn btn-ink text-xs" data-om-event="deck_open_builder" data-om-placement="news_decklists">
          {S.page.openSetInBuilder}
        </Link>
      </p>
      {decks.map((deck, i) => {
        const legendary = getCard(deck.legendary);
        const code = codes[i];
        return (
          <article key={deck.legendary} className="rounded-xl border-2 border-sky bg-night-2/80 p-4 sm:p-5">
            <p className="kicker text-mint">
              {fillLabel(S.page.deckLetter, { letter: deckLetter(i) })} · {archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype}
            </p>
            <h3 className="t-item mt-1">
              {deck.name} ·{" "}
              <span className="text-gold">
                <CardName name={legendary?.name ?? deck.legendary} legendary legendaryLabel={dict.common.legendary} />
              </span>
            </h3>
            <div className="mt-4">
              <DeckCardGrid slugs={[deck.legendary, ...deck.cards].filter((s) => getCard(s))} locale={locale} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {code.code ? (
                <CopyButton text={code.code} label={c.copyGameCode} copied={c.copied} className="btn btn-primary text-xs" event={{ name: "game_code_copy", params: { placement: "news_decklists" } }} />
              ) : (
                <span className="text-xs text-pale-muted">{c.gameCodeMissing}</span>
              )}
              <Link href={`${href(locale, "/deck-builder")}#${deck.code_om}`} className="btn btn-ink text-xs" data-om-event="deck_open_builder" data-om-placement="news_decklists">
                {S.page.openDeckInBuilder}
              </Link>
            </div>
          </article>
        );
      })}
    </section>
  );
}
