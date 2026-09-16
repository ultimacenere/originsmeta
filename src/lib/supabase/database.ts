/**
 * Tipi delle tabelle di supabase/schema.sql, scritti a mano (niente CLI Supabase in questo progetto).
 * Vanno aggiornati insieme allo schema: senza questi tipi supabase-js rifiuta insert/update (tipo `never`).
 */
import type { BuilderCard } from "@/lib/deckrules";
import type { DeckStatus, Guide } from "@/lib/community/types";

export type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  discord_id: string | null;
  role: "user" | "admin";
  badge: string;
  created_at: string;
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
  code_om: string | null;
  status: DeckStatus;
  created_at: string;
  updated_at: string;
};

export type CommunityDeckInsert = Omit<CommunityDeckRow, "id" | "created_at" | "updated_at" | "status" | "video_url" | "code_om" | "legendary" | "deck_types"> & {
  id?: string;
  deck_types?: string[];
  status?: DeckStatus;
  video_url?: string | null;
  code_om?: string | null;
  legendary?: string | null;
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
  lang: "en" | "it";
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
  created_at: string;
  updated_at: string;
};
export type TournamentInsert = Omit<TournamentRow, "id" | "tag" | "status" | "report" | "created_at" | "updated_at" | "listed" | "cover_url" | "discord_url" | "format"> & {
  id?: string;
  tag?: string;
  status?: TournamentRow["status"];
  report?: string | null;
  listed?: boolean;
  cover_url?: string | null;
  discord_url?: string | null;
  format?: "single_elim";
};
export type TournamentPlayerRow = {
  tournament_id: string;
  user_id: string;
  status: "registered" | "dropped" | "disqualified";
  decks_submitted: boolean;
  created_at: string;
  updated_at: string;
};
export type TournamentDecksRow = { tournament_id: string; user_id: string; codes: string[]; created_at: string; updated_at: string };
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
    };
    Views: {
      deck_ratings: {
        Row: { deck_id: string; avg_stars: number; votes: number };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
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
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
