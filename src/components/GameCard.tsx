import { type Card, type L10n } from "@/lib/data/cards";
import { type Locale } from "@/lib/i18n";
import { initials, sagaHue } from "@/lib/cardArt";

/**
 * La carta come si legge in partita, disegnata da noi: cornice e palette del sito, dati del nostro database
 * (quindi anche in italiano, cosa che le immagini fisse dei database concorrenti non possono fare) e la sola
 * finestra d'arte ufficiale. La carta da collezione ufficiale, con la sua cornice e i crediti, resta `CardArt`.
 */

/**
 * Parole chiave del gioco da evidenziare nel testo. I testi italiani e spagnoli delle carte sono quelli ufficiali del
 * gioco, che traduce le parole chiave: qui ci sono i loro nomi nelle sei lingue (glossario in `docs/testi-di-gioco.md`;
 * il francese, letto nel gioco l'08/10/2026, in `docs/francese.md`; il portoghese del Brasile, letto il 20/10/2026, in
 * `docs/portoghese.md`; il tedesco, letto il 20/10/2026, in `docs/tedesco.md`); il russo, provvisorio, sta a parte
 * in `KEYWORDS_RU`.
 */
const KEYWORDS = [
  // inglese
  ...["On Reveal", "On Death", "On Kill", "Ongoing", "First Strike", "Double Attack", "Deathtouch", "Defender", "Discard", "Rebirth"],
  ...["Shield", "Snipe", "Stun", "Summon", "Trample", "Vanilla", "Heal"],
  // italiano
  ...["Alla rivelazione", "Alla morte", "All'uccisione", "Primo colpo", "Doppio attacco", "Tocco letale", "Difensore", "Rinascita"],
  ...["Scudo", "Tiro di precisione", "Stordisci", "Travolgere"],
  // spagnolo
  ...["Al revelar", "Al morir", "Al matar", "Primer golpe", "Ataque doble", "Toque mortal", "Defensor", "Renacer", "Escudo"],
  ...["Disparo certero", "Aturde", "Arrollar"],
  // francese
  ...["À la révélation", "À la mort", "À l'élimination", "Première frappe", "Double attaque", "Contact mortel", "Défenseur", "Renaissance"],
  ...["Bouclier", "Tir de précision", "Étourdissez", "Piétinement"],
  // portoghese del Brasile (Defensor ed Escudo come lo spagnolo)
  ...["Ao revelar", "Ao morrer", "Ao matar", "Primeiro golpe", "Ataque duplo", "Toque mortífero", "Renascimento"],
  ...["Tiro certeiro", "Atordoa", "Atropelar"],
  // tedesco (glossario del gioco, docs/tedesco.md)
  ...["Beim Aufdecken", "Bei Tod", "Bei Vernichtung", "Erstschlag", "Doppelangriff", "Todesberührung", "Verteidiger", "Wiedergeburt"],
  ...["Schild", "Präzisionsschuss", "Betäube", "Überrennen"],
];
/**
 * Russo (20/10/2026): glossario PROVVISORIO di `docs/russo.md`, finché non si legge il gioco in russo. Il russo declina
 * anche le parole chiave ("с Натиском", "Двойную атаку"), quindi ci sono anche le forme più comuni, e la regex le
 * cerca solo come parole intere (`\b` non vale per il cirillico): "Щит" non si evidenzia dentro "Щитом" a metà.
 */
const KEYWORDS_RU = [
  ...["При раскрытии", "При смерти", "При убийстве", "Первый удар", "Первым ударом", "Первого удара"],
  ...["Двойная атака", "Двойную атаку", "Двойной атакой", "Двойной атаки"],
  ...["Смертельное касание", "Смертельным касанием", "Смертельного касания", "Защитник", "Защитника", "Защитником"],
  ...["Возрождение", "Возрождением", "Возрождения", "Щит", "Щита", "Щитом", "Натиск", "Натиска", "Натиском"],
  ...["Меткий выстрел", "Метким выстрелом", "Меткого выстрела", "Оглушает", "Оглушите", "Оглушить"],
];
const escapeRe = (k: string) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const byLength = (a: string, b: string) => b.length - a.length;
/** Le più lunghe prima: nell'alternativa della regex vince la prima che combacia. */
const KEYWORD_PATTERN = [
  ...[...KEYWORDS].sort(byLength).map(escapeRe),
  `(?<![А-ЯЁа-яё])(?:${[...KEYWORDS_RU].sort(byLength).map(escapeRe).join("|")})(?![А-ЯЁа-яё])`,
].join("|");
const ALL_KEYWORDS = new Set([...KEYWORDS, ...KEYWORDS_RU]);

/*
  Allineamento come pastiglia piena: prima era testo colorato su un velo del suo colore, e l'Evil in magenta sul
  blu notte restava sotto la soglia di leggibilità. Stesse tinte di `alignStyle` (src/lib/cardArt.ts), così la
  carta e le pastiglie della scheda e del database dicono la stessa cosa: ink su menta tenue 15,3:1, ink su
  magenta tenue 12,1:1, pale su night-3 8,6:1.
*/
const ALIGN: Record<string, { label: string; bg: string; fg: string; ring: string }> = {
  good: { label: "Good", bg: "var(--color-mint-soft)", fg: "var(--color-ink)", ring: "var(--color-mint-soft)" },
  evil: { label: "Evil", bg: "var(--color-crimson-soft)", fg: "var(--color-ink)", ring: "var(--color-crimson-soft)" },
  // Stesso fondo della pastiglia del tipo accanto: l'anello grigio la distingue.
  neutral: { label: "Neutral", bg: "var(--color-night-3)", fg: "var(--color-pale)", ring: "var(--color-pale-muted)" },
};

/**
 * Evidenzia nel testo dell'abilità le parole chiave, i bonus e i danni, come fa il gioco.
 * Il testo viene dal nostro database (non da input degli utenti): niente HTML in ingresso, solo nodi React.
 */
function formatAbility(text: string): React.ReactNode[] {
  // danni e "qualsiasi" nelle sei lingue del testo: "3 damage", "3 danni", "1 danno", "3 de daño", "3 dégâts", "1 dégât",
  // "3 de dano", "3 Schaden", "3 урона" / "1 урон"; ANY, QUALSIASI, CUALQUIER, N'IMPORTE QUEL / N'IMPORTE QUELLE, QUALQUER, BELIEBIGEN / BELIEBIGE / BELIEBIGER, IRGENDEIN / IRGENDEINE,
  // ЛЮБОЙ / ЛЮБУЮ / ЛЮБОЕ e le altre forme (ALL resta ALLE)
  const pattern = new RegExp(`(${KEYWORD_PATTERN}|[+-]?\\d+⚔️|[+-]?\\d+❤️|\\b\\d+ (?:damage|danni|danno|de daño|de dano|dégâts|dégât|Schaden)\\b|\\b\\d+ (?:ед\\. )?урона?(?![А-ЯЁа-яё])|\\bQUALSIASI\\b|\\bCUALQUIER\\b|\\bQUALQUER\\b|\\bBELIEBIGE[NMRS]?\\b|\\bIRGENDEINE?[NMRS]?\\b|(?<![А-ЯЁа-яё])ЛЮБ(?:ОЙ|УЮ|ОЕ|ОГО|ОМУ|ОМ|ЫЕ|ЫХ|ЫМ|ЫМИ)(?![А-ЯЁа-яё])|\\bANY\\b|N'IMPORTE QUELLE?)`, "g");
  return text.split(pattern).map((part, i) => {
    if (!part) return null;
    if (ALL_KEYWORDS.has(part)) return <b key={i} className="gc-kw">{part}</b>;
    if (/⚔️$/.test(part)) return <b key={i} className="gc-atk">{part.replace("⚔️", "⚔")}</b>;
    if (/❤️$/.test(part)) return <b key={i} className="gc-hp">{part.replace("❤️", "♥")}</b>;
    if (/^\d+ (damage|danni|danno|de daño|de dano|dégâts|dégât|Schaden|(?:ед\. )?урона?)$/.test(part)) return <b key={i} className="gc-dmg">{part}</b>;
    if (part === "QUALSIASI" || part === "CUALQUIER" || part === "QUALQUER" || /^(?:BELIEBIGE[NMRS]?|IRGENDEINE?[NMRS]?|ЛЮБ(?:ОЙ|УЮ|ОЕ|ОГО|ОМУ|ОМ|ЫЕ|ЫХ|ЫМ|ЫМИ))$/.test(part) || part === "ANY" || part === "N'IMPORTE QUEL" || part === "N'IMPORTE QUELLE") return <b key={i} className="gc-any">{part}</b>;
    return <span key={i}>{part}</span>;
  });
}

const line = (t: L10n | undefined, locale: Locale) => (t ? t[locale] ?? t.en : "");

/**
 * Tipo della carta sulla riga del tipo, nella lingua della pagina (corto, come sulla carta del gioco). Le carte create
 * con il glossario del sito (docs/spagnolo.md, docs/francese.md, docs/portoghese.md): "created card", "carta generata",
 * "carta creada", "carte créée", "carta criada", "erschaffene Karte"; in portoghese il tipo del gioco è "Personagem", in
 * tedesco "Charakter" (glossario del gioco, docs/tedesco.md).
 */
const TYPE_LABEL: Record<string, Record<"unit" | "spell" | "token", string>> = {
  en: { unit: "Unit", spell: "Spell", token: "Created" },
  it: { unit: "Unità", spell: "Magia", token: "Generata" },
  es: { unit: "Unidad", spell: "Hechizo", token: "Creada" },
  fr: { unit: "Unité", spell: "Sort", token: "Créée" },
  pt: { unit: "Personagem", spell: "Feitiço", token: "Criada" },
  de: { unit: "Charakter", spell: "Zauber", token: "Erschaffen" },
  ru: { unit: "Персонаж", spell: "Заклинание", token: "Созданная" },
};

export function GameCard({ card, locale, className = "", priority = false }: { card: Card; locale: Locale; className?: string; priority?: boolean }) {
  const align = card.alignment ? ALIGN[card.alignment] : undefined;
  const type = (TYPE_LABEL[locale] ?? TYPE_LABEL.en)[card.type === "spell" ? "spell" : card.type === "token" ? "token" : "unit"];
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
      {/* Paragrafo, non titolo: sulla scheda carta il nome è già l'H1, un h3 qui spezzava la gerarchia. */}
      <p className="gc-name">{card.name}</p>
      <p className="gc-tags">
        <span className="gc-type">{type}</span>
        {align ? (
          // `.gc-align` disegna l'anello da 2 px con un'ombra interna del colore `--gc-al` (non ha un bordo vero):
          // fondo e testo pieni inline vincono sulle tinte della classe.
          <span className="gc-align" style={{ background: align.bg, color: align.fg, ["--gc-al" as string]: align.ring }}>
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
