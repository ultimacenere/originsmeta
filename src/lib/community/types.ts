import type { BuilderCard } from "@/lib/deckrules";

export type GuideLang = "en" | "it";

/** Sezioni facoltative della guida, nell'ordine in cui vengono mostrate. */
export const guideSections = ["strengths", "weaknesses", "mulligan", "combos", "matchups", "notes"] as const;
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
  deck_type: string;
  video_url: string | null;
  guide: Guide;
  code_om: string | null;
  status: DeckStatus;
  created_at: string;
  updated_at: string;
  profile?: Profile | null;
  rating?: { avg: number; votes: number };
};

export const PENDING_PUBLISH_KEY = "originsmeta.publish.pending";
export const BUILDER_STORAGE_KEY = "originsmeta.deckbuilder.v1";
