import type { Locale } from "../i18n";
import type { BuilderCard, DeckState } from "../deckrules";
import type { DeckLink, StoredVideo } from "../videos";
import type { Profile } from "./types";
import { RULES, validateConquest } from "../deckrules";
import { OM_PREFIX, decodeOmCode, encodeOmCode } from "../deckcode";
import { TRANSLATION_RULES, textHash } from "./deckTranslation";
import { GUIDE_MIN_WORDS, countWords } from "./deckQuality";

/*
 * Mazzi torneo (Pierluigi, 04/10/2026: "nella sezione mazzi creiamo una sezione Mazzi torneo dove gli utenti potranno
 * inserire 3 mazzi insieme con relativa guida"). Un mazzo torneo è un trio di mazzi Conquest pubblicato insieme, con una
 * guida unica: tre Leggendarie diverse e almeno 8 carte uniche diverse fra ogni coppia (la regola della Crimson Cup,
 * `RULES.conquestMinDifferent`). Scelte di Pierluigi: tre liste nuove nel pacchetto (non tre mazzi singoli già
 * pubblicati), regole Conquest obbligatorie, voti, traduzione della guida, annuncio su Discord, statistiche e strumenti
 * per le dirette come i mazzi singoli.
 *
 * Qui le regole pure, con test (`deckSets.test.ts`): codici dei tre mazzi nell'indirizzo, controllo Conquest, guida
 * (sezioni, impronta, traduzioni, soglia di parole), errori del database. Il database (blocco "04/10/2026: MAZZI
 * TORNEO" di supabase/schema.sql) ripete forma e regole Conquest nel trigger guard_deck_set. Nessun import a runtime
 * che non sia puro: lo esegue anche Node nei test.
 */

/** Mazzi in un mazzo torneo (il Conquest della Crimson Cup). */
export const DECK_SET_SIZE = RULES.conquestDecks;
/** Carte uniche diverse fra due mazzi del trio: uguale a `min_different` del trigger guard_deck_set. */
export const DECK_SET_MIN_DIFFERENT = RULES.conquestMinDifferent;
/** Separatore dei tre codici OM1 nell'indirizzo (`#OM1…~OM1…~OM1…`): il base64url dei codici non lo usa mai. */
export const DECK_SET_CODE_SEPARATOR = "~";
/** I tre codici in attesa nel browser durante il giro dell'accesso (come PENDING_PUBLISH_KEY dei mazzi singoli). */
export const DECK_SET_PENDING_KEY = "originsmeta.publish.set.pending";
/** Bozza della guida del trio nel modulo di pubblicazione. */
export const DECK_SET_DRAFT_KEY = "originsmeta.publish.set.guide.v1";

/**
 * Sezioni facoltative della guida, nell'ordine in cui si mostrano: il ruolo di ognuno dei tre mazzi, poi punti di forza,
 * punti deboli, scontri e note. Uguali alle chiavi ammesse da `deck_set_guide_ok` nel database.
 */
export const DECK_SET_GUIDE_SECTIONS = ["deck_1", "deck_2", "deck_3", "strengths", "weaknesses", "matchups", "notes"] as const;
export type DeckSetSection = (typeof DECK_SET_GUIDE_SECTIONS)[number];
/** Limiti della guida, uguali a `deck_set_guide_ok`. */
export const DECK_SET_GUIDE_LIMITS = { summaryMin: 20, summaryMax: 600, sectionMax: 2000 } as const;

/** La guida del trio: lingua dell'autore, riassunto obbligatorio, sezioni facoltative. */
export type DeckSetGuide = { lang: Locale; summary: string } & Partial<Record<DeckSetSection, string>>;
export type DeckSetGuideText = { summary: string } & Partial<Record<DeckSetSection, string>>;
export type DeckSetTranslation = { hash: string; at: string; model?: string; guide: DeckSetGuideText };
export type DeckSetTranslations = Partial<Record<Locale, DeckSetTranslation>>;

/** Uno dei tre mazzi, come sta nella colonna `decks` (jsonb). */
export type DeckSetDeck = { name: string; legendary: string; cards: string[]; custom_cards: BuilderCard[]; archetype: string; code_om: string };

/** Riga di public.community_deck_sets con autore e media voti. */
export type CommunityDeckSet = {
  id: string;
  slug: string;
  owner: string;
  name: string;
  decks: DeckSetDeck[];
  legendaries: string[];
  guide: DeckSetGuide;
  translations?: DeckSetTranslations | null;
  videos?: StoredVideo[] | null;
  links?: DeckLink[] | null;
  status: "published" | "hidden";
  created_at: string;
  updated_at: string;
  profile?: Profile | null;
  rating?: { avg: number; votes: number };
};

// ——— Codici dei tre mazzi nell'indirizzo ———

/** I codici OM1 dei tre mazzi in un pezzo d'indirizzo: `OM1…~OM1…~OM1…`. */
export function joinSetCodes(codes: readonly string[]): string {
  return codes.join(DECK_SET_CODE_SEPARATOR);
}

/**
 * I codici OM1 di un testo (hash, `?decks=`, testo incollato): separati da `~`, da spazi, virgole o a capo, anche dentro
 * un link del deck builder. Al massimo `DECK_SET_SIZE`, nell'ordine in cui compaiono.
 */
export function splitSetCodes(raw: string | null | undefined): string[] {
  const text = String(raw ?? "");
  const out: string[] = [];
  let at = text.indexOf(OM_PREFIX);
  while (at >= 0 && out.length < DECK_SET_SIZE) {
    const rest = text.slice(at);
    const end = rest.slice(OM_PREFIX.length).search(/[~\s,;#&]/);
    out.push(end < 0 ? rest : rest.slice(0, OM_PREFIX.length + end));
    at = text.indexOf(OM_PREFIX, at + OM_PREFIX.length);
  }
  return out;
}

/** I tre mazzi da un testo con i loro codici; null se non sono esattamente tre o uno non si legge. */
export function decodeSetCodes(raw: string | null | undefined): DeckState[] | null {
  const codes = splitSetCodes(raw);
  if (codes.length !== DECK_SET_SIZE) return null;
  const decks = codes.map((c) => decodeOmCode(c));
  return decks.every((d): d is DeckState => d !== null) ? decks : null;
}

/** Il pezzo d'indirizzo dei tre mazzi salvati (per il deck builder e la pagina di modifica). */
export function setCodesOf(decks: readonly Pick<DeckSetDeck, "name" | "legendary" | "cards" | "custom_cards" | "code_om">[]): string {
  return joinSetCodes(decks.map((d) => d.code_om || encodeOmCode({ name: d.name, legendary: d.legendary, cards: d.cards, customCards: d.custom_cards ?? [] })));
}

// ——— Regole Conquest ———

/** Che cosa non va in un trio, nell'ordine in cui lo si dice: numero di mazzi, Leggendarie ripetute, mazzi troppo simili. */
export type DeckSetIssue = { code: "count" } | { code: "legendaries" } | { code: "similar"; decks: [number, number]; value: number };

/**
 * Il primo problema delle regole Conquest del trio, o null se si può pubblicare. Usa `validateConquest` del deck builder
 * con il minimo della Crimson Cup, lo stesso del trigger guard_deck_set.
 */
export function deckSetIssue(decks: readonly DeckState[]): DeckSetIssue | null {
  if (decks.length !== DECK_SET_SIZE) return { code: "count" };
  const issues = validateConquest([...decks], DECK_SET_MIN_DIFFERENT);
  if (issues.some((i) => i.code === "duplicateLegendary")) return { code: "legendaries" };
  const similar = issues.find((i) => i.code === "tooSimilar" && i.decks);
  return similar?.decks ? { code: "similar", decks: similar.decks, value: similar.value ?? 0 } : null;
}

/**
 * Errore di una scrittura di `community_deck_sets` → codice del modulo: le regole del trigger guard_deck_set, il tetto
 * (enforce_deck_set_limit), la tabella che non c'è ancora (migrazione non applicata); altrimenti "db".
 */
export function deckSetErrorCode(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return "db";
  const msg = error.message ?? "";
  if (msg.includes("deck_set_limit")) return "limit";
  if (msg.includes("deck_set_legendaries")) return "legendaries";
  if (msg.includes("deck_set_similar")) return "similar";
  if (msg.includes("deck_set_invalid")) return "invalidDeck";
  if (deckSetTableMissing(error)) return "unavailable";
  return "db";
}

/** Tabella dei mazzi torneo (o dei voti) non ancora nel database: il sito mostra la sezione vuota invece di un errore. */
export function deckSetTableMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /community_deck_sets|deck_set_votes|deck_set_ratings|deck_set_stats_daily/.test(error.message ?? "") && /does not exist|could not find/i.test(error.message ?? "");
}

// ——— Guida ———

/** Il testo della guida senza la lingua, con i campi sempre nello stesso ordine. */
export function deckSetGuideText(guide: DeckSetGuide): DeckSetGuideText {
  const text: DeckSetGuideText = { summary: guide.summary };
  for (const k of DECK_SET_GUIDE_SECTIONS) {
    const v = guide[k];
    if (typeof v === "string" && v.trim()) text[k] = v;
  }
  return text;
}

/** Impronta del testo originale (lingua compresa): cambia con la guida, e le traduzioni vecchie smettono di valere. */
export function deckSetGuideHash(guide: DeckSetGuide): string {
  const text = deckSetGuideText(guide);
  return textHash(["deck-set", guide.lang, text.summary, ...DECK_SET_GUIDE_SECTIONS.map((k) => text[k] ?? "")]);
}

type WithSetGuide = { guide: DeckSetGuide; translations?: DeckSetTranslations | null };

/** La traduzione in `locale`, solo se è stata fatta sul testo attuale. */
export function freshSetTranslation(set: WithSetGuide, locale: Locale): DeckSetTranslation | null {
  if (locale === set.guide.lang) return null;
  const t = set.translations?.[locale];
  return t && t.hash === deckSetGuideHash(set.guide) && typeof t.guide?.summary === "string" ? t : null;
}

/** Le lingue in cui la guida si legge davvero: quella dell'autore e quelle con una traduzione aggiornata. */
export function deckSetGuideLocales(set: WithSetGuide, all: readonly Locale[]): Locale[] {
  return all.filter((l) => l === set.guide.lang || freshSetTranslation(set, l) !== null);
}

/** Le lingue da tradurre: mancano o sono rimaste indietro rispetto al testo. */
export function missingSetLocales(set: WithSetGuide, all: readonly Locale[]): Locale[] {
  return all.filter((l) => l !== set.guide.lang && freshSetTranslation(set, l) === null);
}

/** La guida da mostrare nella pagina in `locale`: tradotta quando si può, altrimenti l'originale. */
export function localizedSetGuide(set: WithSetGuide, locale: Locale): { text: DeckSetGuideText; lang: Locale; translated: boolean } {
  const t = freshSetTranslation(set, locale);
  if (t) return { text: t.guide, lang: locale, translated: true };
  return { text: deckSetGuideText(set.guide), lang: set.guide.lang, translated: false };
}

/** Parole della guida originale (riassunto più sezioni), contate come la soglia dei mazzi singoli. */
export function deckSetWordCount(set: Pick<WithSetGuide, "guide">): number {
  return Object.values(deckSetGuideText(set.guide)).reduce((n, text) => n + countWords(text ?? ""), 0);
}

/** Le lingue in cui la pagina del trio si indicizza: nessuna sotto `GUIDE_MIN_WORDS` parole, come i mazzi singoli. */
export function deckSetIndexableLocales(set: WithSetGuide, all: readonly Locale[]): Locale[] {
  return deckSetWordCount(set) >= GUIDE_MIN_WORDS ? deckSetGuideLocales(set, all) : [];
}

/** Parole scritte nel modulo (`FormData` o bozza): gli stessi campi della soglia. */
export function deckSetFormWords(get: (field: "summary" | DeckSetSection) => unknown): number {
  return (["summary", ...DECK_SET_GUIDE_SECTIONS] as const).reduce((n, field) => {
    const value = get(field);
    return n + (typeof value === "string" ? countWords(value) : 0);
  }, 0);
}

/**
 * La guida dai campi del modulo: lingua (una di `locales`, altrimenti quella della pagina), riassunto 20–600 caratteri,
 * sezioni fino a 2000. null se il riassunto è troppo corto.
 */
export function readDeckSetGuide(get: (field: string) => unknown, locales: readonly Locale[], fallback: Locale): DeckSetGuide | null {
  const str = (k: string, max: number) =>
    String(get(k) ?? "")
      .replace(/\r\n/g, "\n")
      .trim()
      .slice(0, max);
  const rawLang = String(get("lang") ?? "");
  const lang = (locales as readonly string[]).includes(rawLang) ? (rawLang as Locale) : fallback;
  const summary = str("summary", DECK_SET_GUIDE_LIMITS.summaryMax);
  if (summary.length < DECK_SET_GUIDE_LIMITS.summaryMin) return null;
  const guide: DeckSetGuide = { lang, summary };
  for (const k of DECK_SET_GUIDE_SECTIONS) {
    const v = str(k, DECK_SET_GUIDE_LIMITS.sectionMax);
    if (v) guide[k] = v;
  }
  return guide;
}

/**
 * Istruzioni per tradurre la guida di un trio: le regole e il glossario di tutte le traduzioni del sito
 * (`TRANSLATION_RULES`), con i campi di questa guida.
 */
export const DECK_SET_TRANSLATION_SYSTEM = `You translate tournament deck guides written by players on OriginsMeta, an unofficial fan site about Origins TCG, a digital trading card game by Koin Games. A tournament deck is a set of three decks played together in a Conquest tournament. The guide is a JSON object whose fields are the parts of one guide: "summary" (the plan for the three decks), "deck_1", "deck_2" and "deck_3" (the role of each deck), "strengths", "weaknesses", "matchups" and "notes"; a guide can carry only some of them. Translate every field from the source language into the target language and return the same fields.

${TRANSLATION_RULES}`;
