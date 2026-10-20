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
 * - Il portoghese del Brasile (20/10/2026) usa le parole del gioco lette quel giorno (docs/portoghese.md); le categorie
 *   hanno il verbo dei testi delle carte in terza persona, come il gioco (Invoca, Compra, Descarta).
 * - Il tedesco (20/10/2026) usa il glossario del gioco letto quel giorno (docs/tedesco.md: Bei Tod, Bei Vernichtung,
 *   Überrennen…); le categorie hanno il verbo all'imperativo dei testi delle carte (Beschwöre, Ziehe, Wirf ab).
 * - Il russo (20/10/2026) usa il glossario del gioco letto la notte del 20/10/2026 (docs/russo.md: При раскрытии,
 *   Пробивной удар, Перемещение, Оглушение, Меткий выстрел…); le categorie hanno il verbo dei testi delle carte in terza
 *   persona, come il gioco (Наносит урон, Призывает, Уничтожает), e l'imperativo col «вы» dove lo usa il gioco
 *   (Возьмите карту, Сбросьте, Выберите).
 * Un tag nuovo portato da `npm run import:woo` senza etichetta qui si mostra in inglese e fa fallire il test.
 */
type Label = { it: string; es: string; fr: string; pt: string; de: string; ru: string; game?: true };

export const keywordLabels: Record<string, Label> = {
  // parole chiave del gioco: nomi ufficiali
  "On Reveal": { it: "Alla rivelazione", es: "Al revelar", fr: "À la révélation", pt: "Ao revelar", de: "Beim Aufdecken", ru: "При раскрытии", game: true },
  "On Death": { it: "Alla morte", es: "Al morir", fr: "À la mort", pt: "Ao morrer", de: "Bei Tod", ru: "При смерти", game: true },
  "On Kill": { it: "All'uccisione", es: "Al matar", fr: "À l'élimination", pt: "Ao matar", de: "Bei Vernichtung", ru: "При убийстве", game: true },
  Shield: { it: "Scudo", es: "Escudo", fr: "Bouclier", pt: "Escudo", de: "Schild", ru: "Щит", game: true },
  Trample: { it: "Travolgere", es: "Arrollar", fr: "Piétinement", pt: "Atropelar", de: "Überrennen", ru: "Пробивной удар", game: true },
  Deathtouch: { it: "Tocco letale", es: "Toque mortal", fr: "Contact mortel", pt: "Toque mortífero", de: "Todesberührung", ru: "Смертельное касание", game: true },
  Defender: { it: "Difensore", es: "Defensor", fr: "Défenseur", pt: "Defensor", de: "Verteidiger", ru: "Защитник", game: true },
  Rebirth: { it: "Rinascita", es: "Renacer", fr: "Renaissance", pt: "Renascimento", de: "Wiedergeburt", ru: "Возрождение", game: true },
  "First Strike": { it: "Primo colpo", es: "Primer golpe", fr: "Première frappe", pt: "Primeiro golpe", de: "Erstschlag", ru: "Первый удар", game: true },
  "Double Attack": { it: "Doppio attacco", es: "Ataque doble", fr: "Double attaque", pt: "Ataque duplo", de: "Doppelangriff", ru: "Двойная атака", game: true },
  Snipe: { it: "Tiro di precisione", es: "Disparo certero", fr: "Tir de précision", pt: "Tiro certeiro", de: "Präzisionsschuss", ru: "Меткий выстрел", game: true },
  Move: { it: "Muovere", es: "Mover", fr: "Déplacer", pt: "Mover", de: "Bewegen", ru: "Перемещение", game: true },
  Stun: { it: "Stordisci", es: "Aturde", fr: "Étourdir", pt: "Atordoa", de: "Betäube", ru: "Оглушение", game: true },
  Ongoing: { it: "Ongoing", es: "Ongoing", fr: "Ongoing", pt: "Ongoing", de: "Ongoing", ru: "Ongoing" },
  // categorie di World of Origins: il verbo o il nome che usa il testo delle carte
  "Deal Damage": { it: "Infliggi danni", es: "Inflige daño", fr: "Infligez des dégâts", pt: "Causa dano", de: "Füge Schaden zu", ru: "Наносит урон" },
  Summon: { it: "Evoca", es: "Invoca", fr: "Invoquez", pt: "Invoca", de: "Beschwöre", ru: "Призывает" },
  Discard: { it: "Scarta", es: "Descarta", fr: "Défaussez", pt: "Descarta", de: "Wirf ab", ru: "Сбросьте" },
  Draw: { it: "Pesca", es: "Roba", fr: "Piochez", pt: "Compra", de: "Ziehe", ru: "Возьмите карту" },
  Add: { it: "Aggiungi", es: "Añade", fr: "Ajoutez", pt: "Adiciona", de: "Füge hinzu", ru: "Добавляет" },
  Destroy: { it: "Distruggi", es: "Destruye", fr: "Détruisez", pt: "Destrói", de: "Zerstöre", ru: "Уничтожает" },
  Return: { it: "Riporta", es: "Devuelve", fr: "Renvoyez", pt: "Devolve", de: "Bringe zurück", ru: "Возвращает" },
  Heal: { it: "Cura", es: "Cura", fr: "Soignez", pt: "Cura", de: "Heile", ru: "Исцеляет" },
  Transform: { it: "Trasforma", es: "Transforma", fr: "Transformez", pt: "Transforma", de: "Verwandle", ru: "Превращает" },
  Shuffle: { it: "Mescola", es: "Baraja", fr: "Mélangez", pt: "Embaralha", de: "Mische", ru: "Замешивает" },
  Choose: { it: "Scegli", es: "Elige", fr: "Choisissez", pt: "Escolhe", de: "Wähle", ru: "Выберите" },
  Buff: { it: "Potenziamento", es: "Mejora", fr: "Amélioration", pt: "Fortalecimento", de: "Verstärkung", ru: "Усиление" },
  "Self Buff": { it: "Autopotenziamento", es: "Automejora", fr: "Auto-amélioration", pt: "Autofortalecimento", de: "Selbstverstärkung", ru: "Самоусиление" },
  Debuff: { it: "Indebolimento", es: "Penalización", fr: "Affaiblissement", pt: "Enfraquecimento", de: "Schwächung", ru: "Ослабление" },
  Spell: { it: "Magia", es: "Hechizo", fr: "Sort", pt: "Feitiço", de: "Zauber", ru: "Заклинание" },
  Vanilla: { it: "Senza abilità", es: "Sin habilidad", fr: "Sans capacité", pt: "Sem habilidade", de: "Ohne Fähigkeit", ru: "Без способностей" },
  Mana: { it: "Mana", es: "Maná", fr: "Mana", pt: "Mana", de: "Mana", ru: "Мана" },
  Food: { it: "Cibo", es: "Comida", fr: "Nourriture", pt: "Comida", de: "Essen", ru: "Еда" },
  Graveyard: { it: "Cimitero", es: "Cementerio", fr: "Cimetière", pt: "Cemitério", de: "Friedhof", ru: "Кладбище" },
  Location: { it: "Luogo", es: "Ubicación", fr: "Lieu", pt: "Local", de: "Ort", ru: "Локация" },
  Good: { it: "Personaggi Buoni", es: "Personajes Buenos", fr: "Personnages Bons", pt: "Personagens Bons", de: "Gute Charaktere", ru: "Добрые персонажи" },
  Evil: { it: "Personaggi Malvagi", es: "Personajes Malvados", fr: "Personnages Mauvais", pt: "Personagens Malignos", de: "Böse Charaktere", ru: "Злые персонажи" },
};

/** Etichetta di un tag nella lingua della pagina; l'inglese è il tag stesso, un tag sconosciuto resta com'è. */
export function keywordLabel(tag: string, locale: Locale): string {
  if (locale === "en") return tag;
  return keywordLabels[tag]?.[locale] ?? tag;
}
