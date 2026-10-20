import type { BroadcastDeck, BroadcastLang, BroadcastState } from "./state";

/**
 * Stato di prova di Broadcasting OM, quello del mockup di Pierluigi (16/10/2026): Aldry contro Dav, 1 a 0, semifinale
 * al meglio delle 3, tre mazzi a testa. Le liste sono di prova (carte della demo, non mazzi giocati da loro): servono
 * a mostrare l'overlay pieno nella call con Koin. Dav ha in campo il terzo mazzo, quello con Spellbook e Roo, come
 * nello screenshot, e ne ha già giocata una copia.
 */
/** Segnaposto dello spazio sponsor nella partita di prova: nessun marchio vero, solo il posto da vendere. */
const SPONSOR_PLACEHOLDER: Record<BroadcastLang, string> = {
  en: "Your sponsor here",
  it: "Il tuo sponsor qui",
  es: "Tu patrocinador aquí",
  fr: "Votre sponsor ici",
  pt: "O seu patrocinador aqui",
};

const deck = (name: string, legendary: string, cards: string[], played: Record<string, number> = {}): BroadcastDeck => ({ name, legendary, cards, played });

export function demoState(lang: BroadcastLang = "en"): BroadcastState {
  return {
    v: 1,
    lang,
    tournament: { name: "OriginsMeta Cup", number: "#3", tag: "OM-DEMO", phase: "", bestOf: 3 },
    players: [
      {
        name: "Aldry",
        title: "",
        score: 1,
        active: 1,
        list: "right",
        decks: [
          deck("Mulan Swarm", "mulan", ["bagheera", "baby-bear", "roo", "jill", "jack", "beast", "beauty", "piglet", "kanga", "christopher-robin", "three-blind-mice", "card-soldier"]),
          deck("Merlin Spells", "merlin", ["spellbook", "mind-palace", "merlins-prophecy", "lady-of-the-lake", "sorcerers-apprentice", "galahad", "lancelot", "black-knight", "the-green-knight", "freeze", "lightning-strike", "searing-light"], { "mind-palace": 1 }),
          deck("Dracula Big", "dracula", ["mummy", "banshee", "boogeyman", "mothman", "imhotep", "koschei", "asanbosam", "impundulu", "basilisk", "cockatrice", "dark-omen", "underworld-flare"]),
        ],
      },
      {
        name: "Dav",
        title: "",
        score: 0,
        active: 2,
        list: "left",
        decks: [
          deck("Robin Hood Swarm", "robin-hood", ["little-john", "marian", "guy-of-gisborne", "rain-of-arrows", "bullseye", "axe-throw", "musketeer", "three-musketeers", "shield-maiden", "don-quixote", "huck-finn", "davy-crockett"]),
          deck("Dorothy Tempo", "dorothy", ["toto", "scarecrow", "tin-woodman", "cowardly-lion", "glinda", "flying-monkey", "wicked-witch-of-the-west", "hare", "pegasus", "thumbelina", "ugly-duckling", "golden-egg"]),
          deck("Van Helsing Spells", "van-helsing", ["spellbook", "roo", "jill", "baby-bear", "jack", "beauty", "beast", "frog-prince", "fairy-godmother", "stroke-of-midnight", "poison-apple", "first-aid"], { spellbook: 1, roo: 1 }),
        ],
      },
    ],
    sponsors: { on: true, scoreSeconds: 20, seconds: 7, items: [{ name: SPONSOR_PLACEHOLDER[lang], kind: "logo", logo: "", url: "" }] },
  };
}
