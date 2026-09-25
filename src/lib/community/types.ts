import type { BuilderCard } from "@/lib/deckrules";
import type { Locale } from "@/lib/i18n";
import { guideSections, type DeckTranslations } from "./deckTranslation";

/** Lingua in cui l'autore ha scritto la guida: una delle lingue del sito (dal 25/09/2026 anche lo spagnolo). */
export type GuideLang = Locale;

/**
 * Sezioni facoltative della guida, nell'ordine in cui vengono mostrate. La definizione sta in deckTranslation.ts,
 * che deve restare senza import a runtime (lo esegue anche Node, negli script e nei test).
 */
export { guideSections };
export type GuideSection = (typeof guideSections)[number];

export type Guide = { lang: GuideLang; summary: string } & Partial<Record<GuideSection, string>>;

export type DeckStatus = "published" | "hidden" | "draft";

/** Tipo di mazzo dichiarato da chi pubblica (note per sito 5.0). */
export const deckTypes = ["ladder", "competitive", "fun", "tournament"] as const;
export type DeckType = (typeof deckTypes)[number];

/** Tag autore: lo assegna solo lo staff (scripts/set-badge.mjs), mai l'utente. */
export const authorBadges = ["community", "influencer", "pro", "staff"] as const;
export type AuthorBadge = (typeof authorBadges)[number];

export type Profile = { username: string | null; display_name: string | null; avatar_url: string | null; badge?: string | null };

/** Riga di public.community_decks (vedi supabase/schema.sql) con autore e media voti. */
export type CommunityDeck = {
  id: string;
  slug: string;
  owner: string;
  name: string;
  legendary: string | null;
  cards: string[];
  custom_cards: BuilderCard[];
  archetype: string;
  /** uno o più tipi: ladder, competitive, fun, tournament */
  deck_types: string[];
  video_url: string | null;
  guide: Guide;
  /** traduzioni automatiche della guida nelle altre lingue del sito (colonna `translations`, dal 25/09/2026) */
  translations?: DeckTranslations | null;
  code_om: string | null;
  status: DeckStatus;
  created_at: string;
  updated_at: string;
  profile?: Profile | null;
  rating?: { avg: number; votes: number };
};

export const PENDING_PUBLISH_KEY = "originsmeta.publish.pending";
export const BUILDER_STORAGE_KEY = "originsmeta.deckbuilder.v1";
/** Bozza della guida nel modulo di pubblicazione: salvata a ogni modifica, così un'interruzione non cancella il testo. */
export const GUIDE_DRAFT_KEY = "originsmeta.publish.guide.v1";

/**
 * Tetto ai mazzi privati (stato 'draft', "Salva privato" del deck builder) di un utente: largo per l'uso
 * normale, ferma chi riempirebbe la tabella. Sta qui perché actions.ts ("use server") esporta solo funzioni.
 */
export const MAX_PRIVATE_DECKS = 50;

/**
 * Tetto ai mazzi PUBBLICATI di un utente normale (Pierluigi, 23/09/2026: "mazzi 5 massimo per utente normale,
 * per staff, influencer e pro senza limiti"). Chi ha un tag autore (Influencer, Pro, Staff) e gli admin non
 * hanno tetto. Il conto tiene insieme pubblicati e nascosti; i privati hanno il loro tetto qui sopra.
 * Lo applica il trigger enforce_deck_limit di supabase/schema.sql, questa costante lo ripete al sito.
 */
export const MAX_PUBLISHED_DECKS = 5;
