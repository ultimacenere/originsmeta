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
 * - Il cinese semplificato (04/11/2026, `"zh-cn"`) usa dall'11/11/2026 i nomi del gioco, letti nelle sue tabelle delle
 *   traduzioni (展示时, 守护者, 双重攻击, 践踏, 移动, 眩晕, 狙击…; prima il glossario provvisorio aveva 揭示时, 守卫, 连击); le
 *   categorie sono nomi brevi d'azione (召唤, 抽牌, 弃牌, 摧毁 come il verbo delle carte), "Vanilla" è 白板 come nel gergo
 *   dei giocatori, e "Ongoing" è 持续, come nel gioco.
 * Un tag nuovo portato da `npm run import:woo` senza etichetta qui si mostra in inglese e fa fallire il test.
 */
type Label = { it: string; es: string; fr: string; pt: string; de: string; ru: string; "zh-cn": string; game?: true };

export const keywordLabels: Record<string, Label> = {
  // parole chiave del gioco: nomi ufficiali
  "On Reveal": { it: "Alla rivelazione", es: "Al revelar", fr: "À la révélation", pt: "Ao revelar", de: "Beim Aufdecken", ru: "При раскрытии", "zh-cn": "展示时", game: true },
  "On Death": { it: "Alla morte", es: "Al morir", fr: "À la mort", pt: "Ao morrer", de: "Bei Tod", ru: "При смерти", "zh-cn": "死亡时", game: true },
  "On Kill": { it: "All'uccisione", es: "Al matar", fr: "À l'élimination", pt: "Ao matar", de: "Bei Vernichtung", ru: "При убийстве", "zh-cn": "击杀时", game: true },
  Shield: { it: "Scudo", es: "Escudo", fr: "Bouclier", pt: "Escudo", de: "Schild", ru: "Щит", "zh-cn": "护盾", game: true },
  Trample: { it: "Travolgere", es: "Arrollar", fr: "Piétinement", pt: "Atropelar", de: "Überrennen", ru: "Пробивной удар", "zh-cn": "践踏", game: true },
  Deathtouch: { it: "Tocco letale", es: "Toque mortal", fr: "Contact mortel", pt: "Toque mortífero", de: "Todesberührung", ru: "Смертельное касание", "zh-cn": "死触", game: true },
  Defender: { it: "Difensore", es: "Defensor", fr: "Défenseur", pt: "Defensor", de: "Verteidiger", ru: "Защитник", "zh-cn": "守护者", game: true },
  Rebirth: { it: "Rinascita", es: "Renacer", fr: "Renaissance", pt: "Renascimento", de: "Wiedergeburt", ru: "Возрождение", "zh-cn": "重生", game: true },
  "First Strike": { it: "Primo colpo", es: "Primer golpe", fr: "Première frappe", pt: "Primeiro golpe", de: "Erstschlag", ru: "Первый удар", "zh-cn": "先攻", game: true },
  "Double Attack": { it: "Doppio attacco", es: "Ataque doble", fr: "Double attaque", pt: "Ataque duplo", de: "Doppelangriff", ru: "Двойная атака", "zh-cn": "双重攻击", game: true },
  Snipe: { it: "Tiro di precisione", es: "Disparo certero", fr: "Tir de précision", pt: "Tiro certeiro", de: "Präzisionsschuss", ru: "Меткий выстрел", "zh-cn": "狙击", game: true },
  Move: { it: "Muovere", es: "Mover", fr: "Déplacer", pt: "Mover", de: "Bewegen", ru: "Перемещение", "zh-cn": "移动", game: true },
  Stun: { it: "Stordisci", es: "Aturde", fr: "Étourdir", pt: "Atordoa", de: "Betäube", ru: "Оглушение", "zh-cn": "眩晕", game: true },
  Ongoing: { it: "Ongoing", es: "Ongoing", fr: "Ongoing", pt: "Ongoing", de: "Ongoing", ru: "Ongoing", "zh-cn": "持续" },
  // categorie di World of Origins: il verbo o il nome che usa il testo delle carte
  "Deal Damage": { it: "Infliggi danni", es: "Inflige daño", fr: "Infligez des dégâts", pt: "Causa dano", de: "Füge Schaden zu", ru: "Наносит урон", "zh-cn": "造成伤害" },
  Summon: { it: "Evoca", es: "Invoca", fr: "Invoquez", pt: "Invoca", de: "Beschwöre", ru: "Призывает", "zh-cn": "召唤" },
  Discard: { it: "Scarta", es: "Descarta", fr: "Défaussez", pt: "Descarta", de: "Wirf ab", ru: "Сбросьте", "zh-cn": "弃牌" },
  Draw: { it: "Pesca", es: "Roba", fr: "Piochez", pt: "Compra", de: "Ziehe", ru: "Возьмите карту", "zh-cn": "抽牌" },
  Add: { it: "Aggiungi", es: "Añade", fr: "Ajoutez", pt: "Adiciona", de: "Füge hinzu", ru: "Добавляет", "zh-cn": "加入手牌" },
  Destroy: { it: "Distruggi", es: "Destruye", fr: "Détruisez", pt: "Destrói", de: "Zerstöre", ru: "Уничтожает", "zh-cn": "摧毁" },
  Return: { it: "Riporta", es: "Devuelve", fr: "Renvoyez", pt: "Devolve", de: "Bringe zurück", ru: "Возвращает", "zh-cn": "移回手牌" },
  Heal: { it: "Cura", es: "Cura", fr: "Soignez", pt: "Cura", de: "Heile", ru: "Исцеляет", "zh-cn": "治疗" },
  Transform: { it: "Trasforma", es: "Transforma", fr: "Transformez", pt: "Transforma", de: "Verwandle", ru: "Превращает", "zh-cn": "变形" },
  Shuffle: { it: "Mescola", es: "Baraja", fr: "Mélangez", pt: "Embaralha", de: "Mische", ru: "Замешивает", "zh-cn": "洗入卡组" },
  Choose: { it: "Scegli", es: "Elige", fr: "Choisissez", pt: "Escolhe", de: "Wähle", ru: "Выберите", "zh-cn": "选择" },
  Buff: { it: "Potenziamento", es: "Mejora", fr: "Amélioration", pt: "Fortalecimento", de: "Verstärkung", ru: "Усиление", "zh-cn": "增益" },
  "Self Buff": { it: "Autopotenziamento", es: "Automejora", fr: "Auto-amélioration", pt: "Autofortalecimento", de: "Selbstverstärkung", ru: "Самоусиление", "zh-cn": "自我增益" },
  Debuff: { it: "Indebolimento", es: "Penalización", fr: "Affaiblissement", pt: "Enfraquecimento", de: "Schwächung", ru: "Ослабление", "zh-cn": "减益" },
  Spell: { it: "Magia", es: "Hechizo", fr: "Sort", pt: "Feitiço", de: "Zauber", ru: "Заклинание", "zh-cn": "法术" },
  Vanilla: { it: "Senza abilità", es: "Sin habilidad", fr: "Sans capacité", pt: "Sem habilidade", de: "Ohne Fähigkeit", ru: "Без способностей", "zh-cn": "白板" },
  Mana: { it: "Mana", es: "Maná", fr: "Mana", pt: "Mana", de: "Mana", ru: "Мана", "zh-cn": "法力" },
  Food: { it: "Cibo", es: "Comida", fr: "Nourriture", pt: "Comida", de: "Essen", ru: "Еда", "zh-cn": "食物" },
  Graveyard: { it: "Cimitero", es: "Cementerio", fr: "Cimetière", pt: "Cemitério", de: "Friedhof", ru: "Кладбище", "zh-cn": "墓地" },
  Location: { it: "Luogo", es: "Ubicación", fr: "Lieu", pt: "Local", de: "Ort", ru: "Локация", "zh-cn": "地点" },
  Good: { it: "Personaggi Buoni", es: "Personajes Buenos", fr: "Personnages Bons", pt: "Personagens Bons", de: "Gute Charaktere", ru: "Добрые персонажи", "zh-cn": "善良角色" },
  Evil: { it: "Personaggi Malvagi", es: "Personajes Malvados", fr: "Personnages Mauvais", pt: "Personagens Malignos", de: "Böse Charaktere", ru: "Злые персонажи", "zh-cn": "邪恶角色" },
};

/** Etichetta di un tag nella lingua della pagina; l'inglese è il tag stesso, un tag sconosciuto resta com'è. */
export function keywordLabel(tag: string, locale: Locale): string {
  if (locale === "en") return tag;
  return keywordLabels[tag]?.[locale] ?? tag;
}
