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
    };
    Views: {
      deck_ratings: {
        Row: { deck_id: string; avg_stars: number; votes: number };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
