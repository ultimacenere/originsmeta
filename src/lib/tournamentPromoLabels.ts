import type { Dictionary, Locale } from "./i18n";
import type { TournamentPromo } from "./tournamentPromo";

/**
 * Testi del popup di un torneo (05/11/2026, src/lib/tournamentPromo.ts). Le parole dei tornei (tipo di torneo,
 * "Organizzato da", Conquest, "Al meglio delle 3", eliminazione diretta, check-in) vengono dai dizionari, come nella
 * scheda del torneo; qui solo quelle del popup. `en` è il tipo di riferimento; nessun import a runtime (lo legge il test).
 * {total}, {first} e {second} sono cifre già scritte nella lingua (`promoMoney`), {n} un numero.
 */
const en = {
  decks: "{n} decks",
  prize: "{total} prize pool · 1st {first} · 2nd {second}",
  cta: "Sign up for the tournament",
  later: "Not now",
  close: "Close",
  note: "Rules and prizes are set by the organizer.",
};

export type TournamentPromoLabels = typeof en;

const it: TournamentPromoLabels = {
  decks: "{n} mazzi",
  prize: "Montepremi di {total} · 1° {first} · 2° {second}",
  cta: "Iscriviti al torneo",
  later: "Non ora",
  close: "Chiudi",
  note: "Regole e montepremi li decide l'organizzatore.",
};

const es: TournamentPromoLabels = {
  decks: "{n} mazos",
  prize: "Bolsa de premios de {total} · 1.º {first} · 2.º {second}",
  cta: "Inscríbete en el torneo",
  later: "Ahora no",
  close: "Cerrar",
  note: "Las reglas y los premios los decide el organizador.",
};

const fr: TournamentPromoLabels = {
  decks: "{n} decks",
  prize: "Dotation de {total} · 1er {first} · 2e {second}",
  cta: "S'inscrire au tournoi",
  later: "Plus tard",
  close: "Fermer",
  note: "Les règles et la dotation sont fixées par l'organisateur.",
};

const pt: TournamentPromoLabels = {
  decks: "{n} decks",
  prize: "Premiação de {total} · 1º {first} · 2º {second}",
  cta: "Inscrever-se no torneio",
  later: "Agora não",
  close: "Fechar",
  note: "As regras e a premiação são definidas pelo organizador.",
};

const de: TournamentPromoLabels = {
  decks: "{n} Decks",
  prize: "Preisgeld: {total} · 1. Platz {first} · 2. Platz {second}",
  cta: "Zum Turnier anmelden",
  later: "Nicht jetzt",
  close: "Schließen",
  note: "Regeln und Preisgeld legt der Veranstalter fest.",
};

const ru: TournamentPromoLabels = {
  decks: "{n} колоды",
  prize: "Призовой фонд {total} · 1-е место {first} · 2-е место {second}",
  cta: "Записаться на турнир",
  later: "Не сейчас",
  close: "Закрыть",
  note: "Правила и призы определяет организатор.",
};

const zhCn: TournamentPromoLabels = {
  decks: "{n} 套卡组",
  prize: "奖金池 {total} · 冠军 {first} · 亚军 {second}",
  cta: "报名参赛",
  later: "以后再说",
  close: "关闭",
  note: "规则和奖金由主办方决定。",
};

export const tournamentPromoLabels: Record<Locale, TournamentPromoLabels> = { en, it, es, fr, pt, de, ru, "zh-cn": zhCn };

/** Quello che il popup scrive, già nella lingua della pagina (le cifre e la data le scrive il browser). */
export type TournamentPromoText = {
  kicker: string;
  organizedBy: string;
  /** "Conquest · 2 mazzi · Al meglio delle 3 · Eliminazione diretta · Check-in obbligatorio" */
  format: string;
  pitch: string;
  prize: string;
  cta: string;
  later: string;
  close: string;
  note: string;
};

function fillIn(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Per il layout: le etichette del popup con le parole dei tornei del dizionario della lingua. */
export function tournamentPromoText(locale: Locale, t: Dictionary["tournaments"], promo: TournamentPromo): TournamentPromoText {
  const l = tournamentPromoLabels[locale];
  return {
    kicker: t.kicker,
    organizedBy: t.organizedBy,
    format: [t.deckModes.conquest, fillIn(l.decks, { n: promo.decks }), fillIn(t.bestOf, { n: promo.bestOf }), t.formats.single_elim, t.checkin.pillRequired].join(" · "),
    pitch: promo.pitch[locale],
    prize: l.prize,
    cta: l.cta,
    later: l.later,
    close: l.close,
    note: l.note,
  };
}
