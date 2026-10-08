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
 * - Il francese (07/10/2026) usa le parole del gioco lette l'08/10/2026 (docs/francese.md): fino a quel giorno era un
 *   glossario provvisorio nostro (First Strike era "Initiative", ora "Première frappe").
 * Un tag nuovo portato da `npm run import:woo` senza etichetta qui si mostra in inglese e fa fallire il test.
 */
type Label = { it: string; es: string; fr: string; game?: true };

export const keywordLabels: Record<string, Label> = {
  // parole chiave del gioco: nomi ufficiali
  "On Reveal": { it: "Alla rivelazione", es: "Al revelar", fr: "À la révélation", game: true },
  "On Death": { it: "Alla morte", es: "Al morir", fr: "À la mort", game: true },
  "On Kill": { it: "All'uccisione", es: "Al matar", fr: "À l'élimination", game: true },
  Shield: { it: "Scudo", es: "Escudo", fr: "Bouclier", game: true },
  Trample: { it: "Travolgere", es: "Arrollar", fr: "Piétinement", game: true },
  Deathtouch: { it: "Tocco letale", es: "Toque mortal", fr: "Contact mortel", game: true },
  Defender: { it: "Difensore", es: "Defensor", fr: "Défenseur", game: true },
  Rebirth: { it: "Rinascita", es: "Renacer", fr: "Renaissance", game: true },
  "First Strike": { it: "Primo colpo", es: "Primer golpe", fr: "Première frappe", game: true },
  "Double Attack": { it: "Doppio attacco", es: "Ataque doble", fr: "Double attaque", game: true },
  Snipe: { it: "Tiro di precisione", es: "Disparo certero", fr: "Tir de précision", game: true },
  Move: { it: "Muovere", es: "Mover", fr: "Déplacer", game: true },
  Stun: { it: "Stordisci", es: "Aturde", fr: "Étourdir", game: true },
  Ongoing: { it: "Ongoing", es: "Ongoing", fr: "Ongoing" },
  // categorie di World of Origins: il verbo o il nome che usa il testo delle carte
  "Deal Damage": { it: "Infliggi danni", es: "Inflige daño", fr: "Infligez des dégâts" },
  Summon: { it: "Evoca", es: "Invoca", fr: "Invoquez" },
  Discard: { it: "Scarta", es: "Descarta", fr: "Défaussez" },
  Draw: { it: "Pesca", es: "Roba", fr: "Piochez" },
  Add: { it: "Aggiungi", es: "Añade", fr: "Ajoutez" },
  Destroy: { it: "Distruggi", es: "Destruye", fr: "Détruisez" },
  Return: { it: "Riporta", es: "Devuelve", fr: "Renvoyez" },
  Heal: { it: "Cura", es: "Cura", fr: "Soignez" },
  Transform: { it: "Trasforma", es: "Transforma", fr: "Transformez" },
  Shuffle: { it: "Mescola", es: "Baraja", fr: "Mélangez" },
  Choose: { it: "Scegli", es: "Elige", fr: "Choisissez" },
  Buff: { it: "Potenziamento", es: "Mejora", fr: "Amélioration" },
  "Self Buff": { it: "Autopotenziamento", es: "Automejora", fr: "Auto-amélioration" },
  Debuff: { it: "Indebolimento", es: "Penalización", fr: "Affaiblissement" },
  Spell: { it: "Magia", es: "Hechizo", fr: "Sort" },
  Vanilla: { it: "Senza abilità", es: "Sin habilidad", fr: "Sans capacité" },
  Mana: { it: "Mana", es: "Maná", fr: "Mana" },
  Food: { it: "Cibo", es: "Comida", fr: "Nourriture" },
  Graveyard: { it: "Cimitero", es: "Cementerio", fr: "Cimetière" },
  Location: { it: "Luogo", es: "Ubicación", fr: "Lieu" },
  Good: { it: "Personaggi Buoni", es: "Personajes Buenos", fr: "Personnages Bons" },
  Evil: { it: "Personaggi Malvagi", es: "Personajes Malvados", fr: "Personnages Mauvais" },
};

/** Etichetta di un tag nella lingua della pagina; l'inglese è il tag stesso, un tag sconosciuto resta com'è. */
export function keywordLabel(tag: string, locale: Locale): string {
  if (locale === "en") return tag;
  return keywordLabels[tag]?.[locale] ?? tag;
}
