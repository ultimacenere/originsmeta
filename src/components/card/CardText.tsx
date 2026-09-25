import type { Locale } from "@/lib/i18n";
import type { Card } from "@/lib/data/cards";
import { cardLabels } from "@/lib/cardPage";

/**
 * Testo della carta con l'etichetta di che cosa è (SCHEDE-07, CARDS-14, 25/09/2026). Prima, sulle pagine italiane e
 * spagnole, il testo inglese compariva sotto la traduzione senza etichetta e senza `lang`, e né un lettore né un
 * assistente potevano sapere quale fosse il testo del gioco.
 * - Le 122 carte della collezione della Demo 2.0: il testo nella lingua della pagina è quello ufficiale del gioco
 *   (letto nel gioco il 25/09/2026 in italiano e spagnolo, `card-lore.ts`).
 * - Carte create e rimosse: la collezione non le mostra, quindi in italiano e spagnolo il testo è una traduzione di
 *   OriginsMeta fatta con il glossario ufficiale del gioco (docs/testi-di-gioco.md); in inglese viene da World of
 *   Origins.
 * - Sulle pagine italiane e spagnole segue il testo inglese, con `lang="en"`: "Testo inglese del gioco" sulle carte
 *   della collezione, "Testo inglese (World of Origins)" su create e rimosse, che nel gioco non si possono verificare
 *   (la stessa fonte che la pagina inglese dichiara). Se il testo locale manca e la scheda ripiega sull'inglese, c'è
 *   solo quello, con la sua etichetta e il suo `lang`.
 * `outdated`: una patch successiva ha cambiato il testo (`textOutdated`), e la scheda lo dice invece di lasciarlo
 * credere attuale.
 */
export function CardText({ card, locale, outdated }: { card: Card; locale: Locale; outdated?: boolean }) {
  if (!card.ability) return null;
  const l = cardLabels[locale];
  const inCollection = card.status === "active" && card.type !== "token";
  const local = card.ability[locale];
  const english = card.ability.en;
  const onlyEnglish = locale !== "en" && local === english;
  const localLabel = locale === "en" ? (inCollection ? l.textOfficial : l.textWoo) : inCollection ? l.textOfficial : l.textOurs;
  return (
    <div className="mt-6">
      {onlyEnglish ? null : (
        <>
          <p className="kicker text-chalk-muted">{localLabel}</p>
          <p className="mt-1 whitespace-pre-line text-lg text-pale">{local}</p>
        </>
      )}
      {locale !== "en" ? (
        <>
          <p className={`kicker text-chalk-muted ${onlyEnglish ? "" : "mt-3"}`}>{inCollection ? l.textEnglish : l.textEnglishWoo}</p>
          <p lang="en" className={`mt-1 whitespace-pre-line ${onlyEnglish ? "text-lg text-pale" : "text-sm text-pale-muted"}`}>
            {english}
          </p>
        </>
      ) : null}
      {outdated ? <p className="mt-2 text-xs text-crimson-soft">{l.textOutdated}</p> : null}
    </div>
  );
}
