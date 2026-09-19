import { type Card, type L10n } from "@/lib/data/cards";
import { type Locale } from "@/lib/i18n";
import { initials, sagaHue } from "@/lib/cardArt";

/**
 * La carta come si legge in partita, disegnata da noi: cornice e palette del sito, dati del nostro database
 * (quindi anche in italiano, cosa che le immagini fisse dei database concorrenti non possono fare) e la sola
 * finestra d'arte ufficiale. La carta da collezione ufficiale, con la sua cornice e i crediti, resta `CardArt`.
 */

/** Parole chiave del gioco: restano in inglese come nelle pill del sito, e vanno evidenziate nel testo. */
const KEYWORDS = [
  "On Reveal",
  "On Death",
  "Ongoing",
  "Double Attack",
  "Deathtouch",
  "Defender",
  "Discard",
  "Rebirth",
  "Shield",
  "Snipe",
  "Stun",
  "Summon",
  "Trample",
  "Vanilla",
  "Heal",
];

const ALIGN: Record<string, { label: string; color: string }> = {
  good: { label: "Good", color: "var(--color-mint)" },
  evil: { label: "Evil", color: "var(--color-crimson)" },
  neutral: { label: "Neutral", color: "var(--color-pale-muted)" },
};

/**
 * Evidenzia nel testo dell'abilità le parole chiave, i bonus e i danni, come fa il gioco.
 * Il testo viene dal nostro database (non da input degli utenti): niente HTML in ingresso, solo nodi React.
 */
function formatAbility(text: string): React.ReactNode[] {
  const pattern = new RegExp(`(${KEYWORDS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}|[+-]?\\d+⚔️|[+-]?\\d+❤️|\\b\\d+ (?:damage|danni)\\b|\\bQUALSIASI\\b|\\bANY\\b)`, "g");
  return text.split(pattern).map((part, i) => {
    if (!part) return null;
    if (KEYWORDS.includes(part)) return <b key={i} className="gc-kw">{part}</b>;
    if (/⚔️$/.test(part)) return <b key={i} className="gc-atk">{part.replace("⚔️", "⚔")}</b>;
    if (/❤️$/.test(part)) return <b key={i} className="gc-hp">{part.replace("❤️", "♥")}</b>;
    if (/^\d+ (damage|danni)$/.test(part)) return <b key={i} className="gc-dmg">{part}</b>;
    if (part === "QUALSIASI" || part === "ANY") return <b key={i} className="gc-any">{part}</b>;
    return <span key={i}>{part}</span>;
  });
}

const line = (t: L10n | undefined, locale: Locale) => (t ? t[locale] ?? t.en : "");

export function GameCard({ card, locale, className = "", priority = false }: { card: Card; locale: Locale; className?: string; priority?: boolean }) {
  const align = card.alignment ? ALIGN[card.alignment] : undefined;
  const type = card.type === "spell" ? (locale === "it" ? "Magia" : "Spell") : card.type === "token" ? (locale === "it" ? "Creata" : "Token") : locale === "it" ? "Unità" : "Unit";
  return (
    <article className={`game-card ${card.legendary ? "is-legendary" : ""} ${className}`}>
      <div className="gc-window" style={card.art ? undefined : { background: sagaHue[card.saga] ?? sagaHue.other }}>
        {card.art ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.art} alt="" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" />
        ) : (
          <span className="gc-initials" aria-hidden="true">
            {initials(card.name)}
          </span>
        )}
        {card.mana !== undefined ? <span className="gc-mana">{card.mana}</span> : null}
        {card.legendary ? <span className="gc-star" aria-hidden="true">★</span> : null}
      </div>
      <h3 className="gc-name">{card.name}</h3>
      <p className="gc-tags">
        <span className="gc-type">{type}</span>
        {align ? (
          <span className="gc-align" style={{ ["--gc-al" as string]: align.color }}>
            {align.label}
          </span>
        ) : null}
      </p>
      {card.ability ? <p className="gc-text">{formatAbility(line(card.ability, locale))}</p> : <p className="gc-text" />}
      {card.power !== undefined ? (
        <p className="gc-stats">
          <span className="gc-atk">{card.power} ⚔</span>
          <span className="gc-hp">{card.health} ♥</span>
        </p>
      ) : null}
    </article>
  );
}
