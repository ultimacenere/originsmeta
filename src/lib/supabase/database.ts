/**
 * Tipi delle tabelle di supabase/schema.sql, scritti a mano (niente CLI Supabase in questo progetto).
 * Vanno aggiornati insieme allo schema: senza questi tipi supabase-js rifiuta insert/update (tipo `never`).
 */
import type { BuilderCard } from "@/lib/deckrules";
import type { DeckStatus, Guide } from "@/lib/community/types";
import type { DeckTranslations } from "@/lib/community/deckTranslation";
import type { Locale } from "@/lib/i18n";

export type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  discord_id: string | null;
  role: "user" | "admin";
  badge: string;
  created_at: string;
  /* profilo pubblico (pacchetto CREATOR, supabase/creator-CREATOR.sql): le sole colonne che l'utente può cambiare */
  bio: string | null;
  /** canali, [{kind, url}] nella forma canonica di src/lib/community/profileLinks.ts */
  links: { kind: string; url: string }[];
  content_langs: string[];
  /** ultima modifica di bio, canali, lingue o tag: la scrive solo il trigger profiles_touch_showcase */
  showcase_updated_at: string | null;
};

export type CommunityDeckRow = {
  id: string;
  slug: string;
  owner: string;
  name: string;
  legendary: string | null;
  cards: string[];
  custom_cards: BuilderCard[];
  archetype: string;
  deck_types: string[];
  video_url: string | null;
  guide: Guide;
  /** traduzioni automatiche della guida (25/09/2026): le scrive il sito dopo la pubblicazione, non l'autore */
  translations: DeckTranslations;
  code_om: string | null;
  status: DeckStatus;
  created_at: string;
  updated_at: string;
};

export type CommunityDeckInsert = Omit<CommunityDeckRow, "id" | "created_at" | "updated_at" | "status" | "video_url" | "code_om" | "legendary" | "deck_types" | "translations"> & {
  id?: string;
  translations?: DeckTranslations;
  deck_types?: string[];
  status?: DeckStatus;
  video_url?: string | null;
  code_om?: string | null;
  legendary?: string | null;
};

/* ---------- tier list salvate nel profilo (23/09/2026, §1 punto 27.5 della KB) ---------- */
export type TierListRow = {
  id: string;
  owner: string;
  /** le due schede del tool: Leggendarie o carte base */
  kind: "legendaries" | "cards";
  title: string;
  /** codice TL1: la fonte di verità, lo stesso del link e del salvataggio nel browser */
  code: string;
  /** le fasce già aperte ({"S":["dorothy"],…}): servono all'aggregazione SQL della tier list della community */
  entries: Record<string, string[]>;
  status: "published" | "hidden";
  created_at: string;
  updated_at: string;
};
export type TierListInsert = Omit<TierListRow, "id" | "created_at" | "updated_at" | "status" | "title"> & {
  id?: string;
  title?: string;
  status?: TierListRow["status"];
};

export type DeckVoteRow = { deck_id: string; user_id: string; stars: number; created_at: string; updated_at: string };
export type DeckReportRow = { id: number; deck_id: string; user_id: string | null; reason: string; created_at: string };

/* ---------- Tournament Organizer (16/09/2026) ---------- */
export type TournamentRow = {
  id: string;
  slug: string;
  tag: string;
  organizer: string;
  name: string;
  cover_url: string | null;
  description: string;
  rules: string;
  /** lingua del torneo scelta dall'organizzatore: una delle lingue del sito (dal 25/09/2026 anche lo spagnolo) */
  lang: Locale;
  starts_at: string;
  size: number;
  format: "single_elim";
  deck_mode: "free" | "conquest";
  conquest_decks: number;
  conquest_min_different: number;
  best_of: number;
  discord_url: string | null;
  status: "open" | "running" | "finished" | "cancelled";
  listed: boolean;
  report: string | null;
  /** pubblico per tutti; privato solo per organizzatore, admin, iscritti e invitati */
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
};
export type TournamentInsert = Omit<TournamentRow, "id" | "tag" | "status" | "report" | "created_at" | "updated_at" | "listed" | "cover_url" | "discord_url" | "format" | "visibility"> & {
  id?: string;
  tag?: string;
  status?: TournamentRow["status"];
  report?: string | null;
  listed?: boolean;
  cover_url?: string | null;
  discord_url?: string | null;
  format?: "single_elim";
  visibility?: TournamentRow["visibility"];
};
export type TournamentInviteRow = { tournament_id: string; user_id: string; invited_by: string | null; created_at: string };
export type TournamentSecretRow = { tournament_id: string; invite_code: string; updated_at: string };
export type TournamentPlayerRow = {
  tournament_id: string;
  user_id: string;
  status: "registered" | "dropped" | "disqualified";
  decks_submitted: boolean;
  created_at: string;
  updated_at: string;
};
export type TournamentDecksRow = { tournament_id: string; user_id: string; codes: string[]; created_at: string; updated_at: string };
export type TournamentMessageRow = { id: number; match_id: string; user_id: string; body: string; created_at: string };
export type TournamentMatchRow = {
  id: string;
  tournament_id: string;
  round: number;
  position: number;
  player_a: string | null;
  player_b: string | null;
  winner: string | null;
  score_a: number | null;
  score_b: number | null;
  status: "pending" | "reported" | "confirmed" | "disputed" | "bye";
  reported_by: string | null;
  forfeit: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      community_decks: {
        Row: CommunityDeckRow;
        Insert: CommunityDeckInsert;
        Update: Partial<CommunityDeckInsert>;
        Relationships: [
          {
            foreignKeyName: "community_decks_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      deck_votes: {
        Row: DeckVoteRow;
        Insert: { deck_id: string; user_id: string; stars: number; created_at?: string; updated_at?: string };
        Update: Partial<DeckVoteRow>;
        Relationships: [
          {
            foreignKeyName: "deck_votes_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "community_decks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deck_votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tier_lists: {
        Row: TierListRow;
        Insert: TierListInsert;
        Update: Partial<TierListInsert>;
        Relationships: [
          {
            foreignKeyName: "tier_lists_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      deck_reports: {
        Row: DeckReportRow;
        Insert: { deck_id: string; user_id?: string | null; reason: string };
        Update: Partial<DeckReportRow>;
        Relationships: [];
      };
      tournaments: {
        Row: TournamentRow;
        Insert: TournamentInsert;
        Update: Partial<TournamentInsert>;
        Relationships: [
          {
            foreignKeyName: "tournaments_organizer_fkey";
            columns: ["organizer"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_players: {
        Row: TournamentPlayerRow;
        Insert: { tournament_id: string; user_id: string; status?: TournamentPlayerRow["status"]; decks_submitted?: boolean };
        Update: Partial<TournamentPlayerRow>;
        Relationships: [
          {
            foreignKeyName: "tournament_players_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_players_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_decks: {
        Row: TournamentDecksRow;
        Insert: { tournament_id: string; user_id: string; codes: string[] };
        Update: Partial<TournamentDecksRow>;
        Relationships: [
          {
            foreignKeyName: "tournament_decks_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_decks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_matches: {
        Row: TournamentMatchRow;
        Insert: Partial<TournamentMatchRow> & { tournament_id: string; round: number; position: number };
        Update: Partial<TournamentMatchRow>;
        Relationships: [
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_invites: {
        Row: TournamentInviteRow;
        Insert: { tournament_id: string; user_id: string; invited_by?: string | null };
        Update: Partial<TournamentInviteRow>;
        Relationships: [
          {
            foreignKeyName: "tournament_invites_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_invites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_secrets: {
        Row: TournamentSecretRow;
        Insert: { tournament_id: string; invite_code?: string };
        Update: Partial<TournamentSecretRow>;
        Relationships: [];
      };
      tournament_messages: {
        Row: TournamentMessageRow;
        Insert: { match_id: string; user_id: string; body: string };
        Update: Partial<TournamentMessageRow>;
        Relationships: [
          {
            foreignKeyName: "tournament_messages_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "tournament_matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      deck_ratings: {
        Row: { deck_id: string; avg_stars: number; votes: number };
        Relationships: [];
      };
      /** Media delle fasce date dagli utenti a ogni carta (S=5 … D=1) e quanti l'hanno classificata: è la tier
          list della community. La fascia risultante la calcola il sito (src/lib/community/tierlists.ts). */
      tier_card_scores: {
        Row: { kind: "legendaries" | "cards"; slug: string; avg_score: number; votes: number };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      /** tetto ai mazzi pubblicati: 5 per un utente normale, nessuno per Influencer, Pro, Staff e admin */
      max_published_decks: { Args: { uid: string }; Returns: number };
      join_tournament: { Args: { tid: string }; Returns: undefined };
      leave_tournament: { Args: { tid: string }; Returns: undefined };
      submit_tournament_decks: { Args: { tid: string; codes: string[] }; Returns: undefined };
      start_tournament: { Args: { tid: string; seeded: string[] }; Returns: undefined };
      swap_players: { Args: { tid: string; u1: string; u2: string }; Returns: undefined };
      report_match_result: { Args: { mid: string; a: number; b: number }; Returns: undefined };
      set_match_result: { Args: { mid: string; a: number; b: number; forfeit?: boolean }; Returns: undefined };
      drop_player: { Args: { tid: string; uid: string }; Returns: undefined };
      finish_tournament: { Args: { tid: string; report?: string | null }; Returns: undefined };
      cancel_tournament: { Args: { tid: string }; Returns: undefined };
      send_message: { Args: { mid: string; body: string }; Returns: undefined };
      redeem_invite: { Args: { tag: string; code: string }; Returns: string };
      invite_player: { Args: { tid: string; uname: string }; Returns: undefined };
      revoke_invite: { Args: { tid: string; uid: string }; Returns: undefined };
      rotate_invite_code: { Args: { tid: string }; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
