import type { BuilderCard } from "@/lib/deckrules";
import type { Locale } from "@/lib/i18n";
import { guideSections, type DeckTranslations } from "./deckTranslation";
import type { DeckLink, StoredVideo } from "@/lib/videos";

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

/**
 * Ruolo (tag) del profilo: lo assegna solo lo staff (scripts/set-badge.mjs), mai l'utente. I cinque tag e i permessi
 * che ne dipendono stanno in badges.ts (27/09/2026); `badge` qui resta una stringa perché arriva dal database così
 * com'è: si legge con `normalizeBadge`.
 */
export type Profile = {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  badge?: string | null;
  /** foto caricata dal sito (pacchetto VETRINA, 27/09/2026): `Avatar` la mostra prima di `avatar_url`, quando la lettura la porta */
  avatar_path?: string | null;
};

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
  /** primo video (colonna storica): dal 26/09/2026 la scrive il sito con l'indirizzo canonico di `videos[0]` */
  video_url: string | null;
  /** fino a 3 video YouTube/Twitch e 5 risorse (supabase/schema.sql, blocco VIDEO); assenti finché la migrazione non c'è */
  videos?: StoredVideo[] | null;
  links?: DeckLink[] | null;
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

/*
 * Il tetto ai mazzi PUBBLICATI (5 per la community, 20 per l'Autore, nessuno per Creator, Pro, Staff e admin) sta in
 * badges.ts dal 27/09/2026: `publishedDeckCap`, `COMMUNITY_DECK_LIMIT`, `AUTHOR_DECK_LIMIT`.
 */
