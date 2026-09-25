import type { Locale } from "./i18n";

/**
 * Etichette delle parole chiave delle carte (i tag di World of Origins, `card.keywords`) nelle lingue del sito
 * (25/09/2026, richiesta di Pierluigi: "traduci anche le pastiglie").
 *
 * - Le parole chiave del gioco (`game: true`) hanno il nome ufficiale del gioco tradotto, lo stesso dei testi delle
 *   carte e delle guide: glossario in `docs/testi-di-gioco.md`, e lo stesso glossario sta nel prompt del traduttore
 *   dei mazzi (`TRANSLATION_SYSTEM`, un test controlla che coincidano).
 * - Le altre sono categorie di World of Origins, non del gioco: si scrivono con il verbo che la carta usa nel suo
 *   testo (Evoca / Invoca, Pesca / Roba…), così l'etichetta si ritrova nel testo.
 * - "Ongoing" resta in inglese: c'era solo in una carta rimossa (Firebird) e il gioco tradotto non ha un nome da cui
 *   prenderlo.
 * Un tag nuovo portato da `npm run import:woo` senza etichetta qui si mostra in inglese e fa fallire il test.
 */
type Label = { it: string; es: string; game?: true };

export const keywordLabels: Record<string, Label> = {
  // parole chiave del gioco: nomi ufficiali
  "On Reveal": { it: "Alla rivelazione", es: "Al revelar", game: true },
  "On Death": { it: "Alla morte", es: "Al morir", game: true },
  "On Kill": { it: "All'uccisione", es: "Al matar", game: true },
  Shield: { it: "Scudo", es: "Escudo", game: true },
  Trample: { it: "Travolgere", es: "Arrollar", game: true },
  Deathtouch: { it: "Tocco letale", es: "Toque mortal", game: true },
  Defender: { it: "Difensore", es: "Defensor", game: true },
  Rebirth: { it: "Rinascita", es: "Renacer", game: true },
  "First Strike": { it: "Primo colpo", es: "Primer golpe", game: true },
  "Double Attack": { it: "Doppio attacco", es: "Ataque doble", game: true },
  Snipe: { it: "Tiro di precisione", es: "Disparo certero", game: true },
  Move: { it: "Muovere", es: "Mover", game: true },
  Stun: { it: "Stordisci", es: "Aturde", game: true },
  Ongoing: { it: "Ongoing", es: "Ongoing" },
  // categorie di World of Origins: il verbo o il nome che usa il testo delle carte
  "Deal Damage": { it: "Infliggi danni", es: "Inflige daño" },
  Summon: { it: "Evoca", es: "Invoca" },
  Discard: { it: "Scarta", es: "Descarta" },
  Draw: { it: "Pesca", es: "Roba" },
  Add: { it: "Aggiungi", es: "Añade" },
  Destroy: { it: "Distruggi", es: "Destruye" },
  Return: { it: "Riporta", es: "Devuelve" },
  Heal: { it: "Cura", es: "Cura" },
  Transform: { it: "Trasforma", es: "Transforma" },
  Shuffle: { it: "Mescola", es: "Baraja" },
  Choose: { it: "Scegli", es: "Elige" },
  Buff: { it: "Potenziamento", es: "Mejora" },
  "Self Buff": { it: "Autopotenziamento", es: "Automejora" },
  Debuff: { it: "Indebolimento", es: "Penalización" },
  Spell: { it: "Magia", es: "Hechizo" },
  Vanilla: { it: "Senza abilità", es: "Sin habilidad" },
  Mana: { it: "Mana", es: "Maná" },
  Food: { it: "Cibo", es: "Comida" },
  Graveyard: { it: "Cimitero", es: "Cementerio" },
  Location: { it: "Luogo", es: "Ubicación" },
  Good: { it: "Personaggi Buoni", es: "Personajes Buenos" },
  Evil: { it: "Personaggi Malvagi", es: "Personajes Malvados" },
};

/** Etichetta di un tag nella lingua della pagina; l'inglese è il tag stesso, un tag sconosciuto resta com'è. */
export function keywordLabel(tag: string, locale: Locale): string {
  if (locale === "en") return tag;
  return keywordLabels[tag]?.[locale] ?? tag;
}
