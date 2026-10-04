/**
 * Tipi delle tabelle di supabase/schema.sql, scritti a mano (niente CLI Supabase in questo progetto).
 * Vanno aggiornati insieme allo schema: senza questi tipi supabase-js rifiuta insert/update (tipo `never`).
 */
import type { BuilderCard } from "@/lib/deckrules";
import type { DeckStatus, Guide } from "@/lib/community/types";
import type { DeckTranslations } from "@/lib/community/deckTranslation";
import type { Locale } from "@/lib/i18n";
import type { DeckLink, StoredVideo } from "@/lib/videos";
import type { CommunityGuideTranslations } from "@/lib/community/guides";
import type { ComicEditions, ComicTranslations } from "@/lib/community/comics";
import type { DeckSetDeck, DeckSetGuide, DeckSetTranslations } from "@/lib/community/deckSets";

export type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  discord_id: string | null;
  role: "user" | "admin";
  badge: string;
  created_at: string;
  /* profilo pubblico (pacchetto CREATOR, supabase/schema.sql, blocco CREATOR): le sole colonne che l'utente può cambiare */
  bio: string | null;
  /** canali, [{kind, url}] nella forma canonica di src/lib/community/profileLinks.ts */
  links: { kind: string; url: string }[];
  content_langs: string[];
  /** ultima modifica di bio, canali, lingue o tag: la scrive solo il trigger profiles_touch_showcase */
  showcase_updated_at: string | null;
  /* vetrina (pacchetto VETRINA, blocco VETRINA di supabase/schema.sql; regole in src/lib/community/showcase.ts): foto caricata per tutti,
     il resto solo per i ruoli con vetrina (trigger guard_profile_vetrina). Prima della migrazione le colonne non ci sono:
     le letture lo riconoscono (errore 42703) */
  avatar_path?: string | null;
  cover_preset?: string | null;
  cover_path?: string | null;
  /** sfondo della pagina del profilo (27/09/2026, blocco SFONDO di supabase/schema.sql) */
  background_preset?: string | null;
  background_path?: string | null;
  accent?: string | null;
  tagline?: string | null;
  favorite_legendary?: string | null;
  featured_deck?: string | null;
  featured_video?: string | null;
  /** [{day 0-6 (0 = lunedì), time "HH:MM", minutes?}] nel fuso schedule_tz (che c'è solo con degli orari) */
  schedule?: { day: number; time: string; minutes?: number }[];
  schedule_tz?: string | null;
  /** ultime modifiche di foto e vetrina: le scrive solo il trigger guard_profile_vetrina (limiti di frequenza) */
  avatar_updated_at?: string | null;
  vetrina_updated_at?: string | null;
  /** numeri pubblici sulla vetrina /u (pacchetto TRAGUARDI, blocco TRAGUARDI di supabase/schema.sql): solo ruoli con vetrina, difesa da trigger */
  show_stats: boolean;
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
  /** video e risorse del mazzo (supabase/schema.sql, blocco VIDEO, 26/09/2026): forme e host controllati da vincoli SQL */
  videos: StoredVideo[];
  links: DeckLink[];
  guide: Guide;
  /** traduzioni automatiche della guida (25/09/2026): le scrive il sito dopo la pubblicazione, non l'autore */
  translations: DeckTranslations;
  code_om: string | null;
  /** versione delle carte e ultimo cambio di carte (blocco VERSIONI, 30/09/2026): le scrive solo il trigger guard_deck_version */
  version: number;
  cards_updated_at: string | null;
  status: DeckStatus;
  created_at: string;
  updated_at: string;
  /** artwork della Leggendaria (supabase/schema.sql, blocco IMMAGINI, 29/09/2026): <owner>/deck/<file> nel bucket profile-media,
   *  solo Creator, Staff e admin (trigger guard_deck_art) */
  art_path: string | null;
};

export type CommunityDeckInsert = Omit<CommunityDeckRow, "id" | "created_at" | "updated_at" | "status" | "video_url" | "code_om" | "legendary" | "deck_types" | "translations" | "videos" | "links" | "art_path" | "version" | "cards_updated_at"> & {
  id?: string;
  videos?: StoredVideo[];
  links?: DeckLink[];
  translations?: DeckTranslations;
  deck_types?: string[];
  status?: DeckStatus;
  video_url?: string | null;
  code_om?: string | null;
  legendary?: string | null;
  art_path?: string | null;
};

/* ---------- mazzi torneo (blocco MAZZI TORNEO, 04/10/2026): tre mazzi Conquest con una guida ---------- */
export type CommunityDeckSetRow = {
  id: string;
  slug: string;
  owner: string;
  name: string;
  decks: DeckSetDeck[];
  /** le tre Leggendarie nell'ordine dei mazzi: le scrive solo il trigger guard_deck_set */
  legendaries: string[];
  guide: DeckSetGuide;
  translations: DeckSetTranslations | null;
  videos: StoredVideo[];
  links: DeckLink[];
  status: "published" | "hidden";
  created_at: string;
  updated_at: string;
};
export type CommunityDeckSetInsert = Pick<CommunityDeckSetRow, "slug" | "owner" | "name" | "decks" | "guide"> &
  Partial<Pick<CommunityDeckSetRow, "translations" | "videos" | "links" | "status">>;

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

/** `version`: la versione del mazzo votata, scritta dal trigger guard_vote_version (blocco VERSIONI, 30/09/2026) */
export type DeckVoteRow = { deck_id: string; user_id: string; stars: number; version: number; created_at: string; updated_at: string };
/** Mazzo salvato da un utente ("Salva", blocco PREFERITI E TENDENZA, 30/09/2026): ognuno vede solo i suoi. */
export type DeckFavoriteRow = { user_id: string; deck_id: string; created_at: string };
/** Versioni di prima delle carte di un mazzo (blocco VERSIONI, 30/09/2026): solo lettura, le scrive il trigger. */
export type CommunityDeckVersionRow = {
  deck_id: string;
  version: number;
  legendary: string | null;
  cards: string[];
  custom_cards: BuilderCard[];
  code_om: string | null;
  started_at: string;
  ended_at: string;
};
/** Statistiche dei mazzi per gli autori (26/09/2026, supabase/schema.sql, blocco STATS): totali per mazzo e giorno UTC. */
export type DeckStatsDailyRow = { deck_id: string; day: string; views: number; code_copies: number; link_clicks: number; video_plays: number };
export type DeckReportRow = { id: number; deck_id: string; user_id: string | null; reason: string; created_at: string };

/* guide della community (pacchetto GUIDE, 27/09/2026, blocco GUIDE di supabase/schema.sql): regole in src/lib/community/guides.ts */
export type CommunityGuideRow = {
  id: string;
  slug: string;
  owner: string;
  lang: Locale;
  title: string;
  summary: string;
  sections: { heading: string; body: string }[];
  category: string;
  cards: string[];
  videos: StoredVideo[];
  links: DeckLink[];
  cover_preset: string;
  cover_path: string | null;
  status: "draft" | "published" | "hidden";
  translations: CommunityGuideTranslations;
  /** parole e impronta del testo originale, scritte dal sito con il testo (le leggono elenchi e sitemap) */
  words: number | null;
  text_hash: string | null;
  created_at: string;
  updated_at: string;
  /** prima pubblicazione: la scrive solo il trigger guard_community_guide */
  published_at: string | null;
};
/** Le colonne con la grant di insert (slug, owner e testo); date, id e traduzioni no. */
export type CommunityGuideInsert = Pick<CommunityGuideRow, "slug" | "owner" | "lang" | "title"> &
  Partial<Pick<CommunityGuideRow, "summary" | "sections" | "category" | "cards" | "videos" | "links" | "cover_preset" | "cover_path" | "status" | "words" | "text_hash">>;
/** Le colonne con la grant di update: mai slug, owner, id e date. */
export type CommunityGuideUpdate = Partial<
  Pick<CommunityGuideRow, "lang" | "title" | "summary" | "sections" | "category" | "cards" | "videos" | "links" | "cover_preset" | "cover_path" | "status" | "translations" | "words" | "text_hash">
>;
/* fumetti dei Creator pubblicati come news (pacchetto FUMETTI, 29/09/2026, blocco FUMETTI di supabase/schema.sql): regole in src/lib/community/comics.ts */
export type CommunityComicRow = {
  id: string;
  slug: string;
  owner: string;
  lang: Locale;
  title: string;
  summary: string;
  /** tavole: file nella cartella `<owner>/comic/` del bucket profile-media, misure e testo */
  pages: { path: string; width: number; height: number; text: string }[];
  cover_path: string | null;
  status: "draft" | "published" | "hidden";
  translations: ComicTranslations;
  /** versioni disegnate nelle altre lingue (blocco FUMETTI IN PIÙ LINGUE, 30/09/2026) */
  editions: ComicEditions;
  /** indirizzi dei fumetti uniti in questo: li scrive solo scripts/merge-comics.mjs (nessuna grant) */
  former_slugs: string[];
  text_hash: string | null;
  created_at: string;
  updated_at: string;
  /** prima pubblicazione: la scrive solo il trigger guard_community_comic */
  published_at: string | null;
};
/** Le colonne con la grant di insert; date, id e traduzioni no. */
export type CommunityComicInsert = Pick<CommunityComicRow, "slug" | "owner" | "lang" | "title"> &
  Partial<Pick<CommunityComicRow, "summary" | "pages" | "cover_path" | "status" | "text_hash" | "editions">>;
/** Le colonne con la grant di update: mai slug, owner, id e date. */
export type CommunityComicUpdate = Partial<Pick<CommunityComicRow, "lang" | "title" | "summary" | "pages" | "cover_path" | "status" | "translations" | "text_hash" | "editions">>;
/** `first_in_day`: prima segnalazione della guida nelle 24 ore (la scrive il trigger; solo allora il sito avvisa lo staff) */
export type CommunityGuideReportRow = { id: number; guide_id: string; user_id: string; reason: string; created_at: string; first_in_day: boolean };

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

/* ---------- casella messaggi utente ↔ staff (26/09/2026, supabase/schema.sql, blocco INBOX) ---------- */
export type ConversationRow = {
  id: string;
  /** l'utente della conversazione: l'altra parte è sempre lo staff */
  user_id: string;
  subject: string;
  origin: "user" | "staff" | "feedback";
  status: "open" | "closed";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_user_message_at: string | null;
  last_staff_message_at: string | null;
  last_from_staff: boolean;
  last_preview: string;
  read_by_user_at: string | null;
  read_by_staff_at: string | null;
  /** colonne calcolate dal database (generated always as … stored) */
  unread_by_user: boolean;
  unread_by_staff: boolean;
};
export type MessageRow = { id: number; conversation_id: string; author_id: string | null; from_staff: boolean; body: string; created_at: string };

/* ---------- "Segui" e avvisi (27/09/2026, blocco SEGUI di supabase/schema.sql) ---------- */
export type FollowRow = { follower: string; followed: string; created_at: string };
/** authenticated legge solo queste colonne (grant per colonna): `event_key` resta fuori */
export type NotificationRow = {
  id: number;
  user_id: string;
  kind: "deck_published" | "live" | "guide_published" | "comic_published" | "deck_set_published";
  actor_id: string;
  /** percorso interno senza lingua: /decks/community/<slug>, /guides/community/<slug>, /u/<nome utente> */
  target: string;
  created_at: string;
  read_at: string | null;
};

/* ---------- tracker/overlay (30/09/2026, blocco TRACKER di supabase/schema.sql) ---------- */
/** partita registrata dall'app OriginsMeta Tracker: la legge solo il proprietario, si scrive solo con tracker_submit */
export type TrackedMatchRow = {
  owner: string;
  /** impronta della partita (mai l'id del gioco) */
  id: string;
  device_id: string | null;
  ended_at: string | null;
  result: "W" | "L" | null;
  queue: "ranked" | "normal";
  /** patch in vigore alla fine della partita (id di patchOrder), la scrive il sito all'invio */
  patch: string | null;
  deck_name: string | null;
  deck_legendary: string | null;
  deck_cards: string[];
  /** le 13 carte in ordine, separate da virgole (la calcola il database) */
  deck_list: string | null;
  archetype: string | null;
  deck_code: string | null;
  rank: string | null;
  opponent_legendary: string | null;
  opponent_played: string[];
  turns: number | null;
  plays: { t: number; m: boolean; c: string | null; l: number | null }[];
  created_at: string;
};
/** authenticated legge solo queste colonne dei propri PC (grant per colonna): mai l'impronta del token */
export type TrackerDeviceRow = { id: string; owner: string; name: string; created_at: string; last_seen_at: string | null; revoked_at: string | null };
type TrackerStatCount = { games: number; wins: number; players: number };

/** Stanza del draft online (blocco DRAFT ONLINE di schema.sql): solo dati pubblici fra i due giocatori, lo stato sta altrove. */
export type DraftRoomRow = {
  id: string;
  code: string;
  format: "exchange" | "triple" | "packs";
  status: "waiting" | "drafting" | "done";
  creator: string;
  joiner: string | null;
  invited: string | null;
  next_code: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      /** draft online (blocco DRAFT ONLINE, 02/10/2026): i due giocatori leggono solo la loro riga, per il tempo reale; nessuna scrittura diretta */
      draft_rooms: {
        Row: DraftRoomRow;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      /**
       * si scrivono solo con le RPC inbox_* (nessuna scrittura diretta: policy restrittive e nessun grant); authenticated
       * legge solo alcune colonne (grant per colonna): non created_by, read_by_*_at, last_user/staff_message_at di
       * conversations né author_id di messages, che lo staff riceve da inbox_message_authors
       */
      conversations: {
        Row: ConversationRow;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: MessageRow;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
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
        Insert: { deck_id: string; user_id: string; stars: number; version?: number; created_at?: string; updated_at?: string };
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
      deck_favorites: {
        Row: DeckFavoriteRow;
        Insert: { user_id: string; deck_id: string; created_at?: string };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "deck_favorites_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "community_decks";
            referencedColumns: ["id"];
          },
        ];
      };
      community_deck_versions: {
        Row: CommunityDeckVersionRow;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "community_deck_versions_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "community_decks";
            referencedColumns: ["id"];
          },
        ];
      };
      community_deck_sets: {
        Row: CommunityDeckSetRow;
        Insert: CommunityDeckSetInsert;
        Update: Partial<CommunityDeckSetInsert>;
        Relationships: [
          {
            foreignKeyName: "community_deck_sets_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      deck_set_votes: {
        Row: { set_id: string; user_id: string; stars: number; created_at: string; updated_at: string };
        Insert: { set_id: string; user_id: string; stars: number };
        Update: { stars?: number };
        Relationships: [
          {
            foreignKeyName: "deck_set_votes_set_id_fkey";
            columns: ["set_id"];
            isOneToOne: false;
            referencedRelation: "community_deck_sets";
            referencedColumns: ["id"];
          },
        ];
      };
      /** la leggono l'autore del trio e lo staff; nessuna scrittura diretta: solo la RPC bump_deck_set_stat */
      deck_set_stats_daily: {
        Row: { set_id: string; day: string; views: number; code_copies: number; link_clicks: number; video_plays: number };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "deck_set_stats_daily_set_id_fkey";
            columns: ["set_id"];
            isOneToOne: false;
            referencedRelation: "community_deck_sets";
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
      /** la leggono l'autore del mazzo e lo staff; nessuna scrittura diretta: solo la RPC bump_deck_stat */
      deck_stats_daily: {
        Row: DeckStatsDailyRow;
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "deck_stats_daily_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "community_decks";
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
      /** guide della community (pacchetto GUIDE): scrivono solo i ruoli con can_publish_guides, sulla propria riga */
      community_guides: {
        Row: CommunityGuideRow;
        Insert: CommunityGuideInsert;
        Update: CommunityGuideUpdate;
        Relationships: [
          {
            foreignKeyName: "community_guides_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      community_comics: {
        Row: CommunityComicRow;
        Insert: CommunityComicInsert;
        Update: CommunityComicUpdate;
        Relationships: [
          {
            foreignKeyName: "community_comics_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      /** segnalazioni delle guide: le scrive chi ha fatto l'accesso (mai sulla propria guida), le legge lo staff e ognuno le sue */
      community_guide_reports: {
        Row: CommunityGuideReportRow;
        Insert: { guide_id: string; user_id: string; reason: string };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "community_guide_reports_guide_id_fkey";
            columns: ["guide_id"];
            isOneToOne: false;
            referencedRelation: "community_guides";
            referencedColumns: ["id"];
          },
        ];
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
      /** "Segui" (blocco SEGUI): ognuno legge, aggiunge e toglie solo i propri; si seguono solo i profili vetrina */
      follows: {
        Row: FollowRow;
        Insert: { follower: string; followed: string };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "follows_follower_fkey";
            columns: ["follower"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_followed_fkey";
            columns: ["followed"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      /** avvisi (blocco SEGUI): si scrivono solo con notify_followers e notify_live, si segnano come letti con notifications_mark_read */
      notifications: {
        Row: NotificationRow;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      /** partite del tracker (blocco TRACKER): lettura solo del proprietario, scrittura solo con tracker_submit */
      tracked_matches: {
        Row: TrackedMatchRow;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "tracked_matches_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      /** PC collegati (blocco TRACKER): lettura per colonna del proprietario, scrittura solo con le funzioni tracker_* */
      tracker_devices: {
        Row: TrackerDeviceRow;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "tracker_devices_owner_fkey";
            columns: ["owner"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      deck_set_ratings: {
        Row: { set_id: string; avg_stars: number; votes: number };
        Relationships: [];
      };
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
      /** draft online (02/10/2026): solo dal server, con la sessione del giocatore e il segreto del cron (src/lib/draft/onlineActions.ts) */
      draft_room_create: { Args: { p_key: string; p_code: string; p_format: string; p_from?: string | null }; Returns: string };
      draft_room_get: { Args: { p_key: string; p_code: string }; Returns: (DraftRoomRow & { creator_name: string | null; joiner_name: string | null; seat: number | null; state: unknown })[] };
      draft_room_join: { Args: { p_key: string; p_code: string; p_state: unknown }; Returns: number };
      draft_room_put: { Args: { p_key: string; p_code: string; p_version: number; p_state: unknown; p_done: boolean }; Returns: number | null };
      draft_rooms_cleanup: { Args: { p_key: string }; Returns: number };
      /** preferiti e "Di tendenza" (blocco PREFERITI E TENDENZA, 30/09/2026): solo aggregati per mazzo pubblicato */
      deck_favorite_counts: { Args: Record<string, never>; Returns: { deck_id: string; favorites: number }[] };
      deck_trending: { Args: Record<string, never>; Returns: { deck_id: string; score: number }[] };
      /** tetto ai mazzi pubblicati: 5 per la community, 20 per l'Autore, nessuno per Creator, Pro, Staff e admin (27/09/2026) */
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
      /** vincoli di video e risorse dei mazzi (schema.sql, blocco VIDEO): funzioni pure, il sito non le chiama */
      deck_text_ok: { Args: { t: string; maxlen: number }; Returns: boolean };
      deck_video_url_ok: { Args: { u: string }; Returns: boolean };
      deck_link_host_ok: { Args: { u: string }; Returns: boolean };
      deck_videos_ok: { Args: { v: StoredVideo[] }; Returns: boolean };
      deck_links_ok: { Args: { v: DeckLink[] }; Returns: boolean };
      /** +1 al contatore di oggi di un mazzo pubblicato (p_kind: view, code, link, video); anon e authenticated */
      /** mazzi torneo (04/10/2026): +1 al contatore di oggi di un trio pubblicato; anon e authenticated */
      bump_deck_set_stat: { Args: { p_slug: string; p_kind: string }; Returns: undefined };
      deck_set_stats_owns: { Args: { sid: string }; Returns: boolean };
      bump_deck_stat: { Args: { p_slug: string; p_kind: string }; Returns: undefined };
      deck_stats_is_staff: { Args: Record<string, never>; Returns: boolean };
      deck_stats_owns: { Args: { did: string }; Returns: boolean };
      /* "Segui" e avvisi (blocco SEGUI): errori con raise exception '<codice>' (notificationErrorCode, followErrorCode) */
      /** follower del profilo (solo il numero), se chi guarda lo segue, se si può seguire; anon e authenticated */
      follow_state: { Args: { p_profile: string }; Returns: { followers: number; following: boolean; followable: boolean } };
      /**
       * avviso ai follower dell'autore (p_actor, assente = chi chiama) per un mazzo o una guida appena pubblicati: la riga
       * deve essere pubblicata e sua, chi chiama deve essere l'autore o lo staff; restituisce i destinatari
       */
      notify_followers: { Args: { p_kind: "deck_published" | "guide_published" | "comic_published" | "deck_set_published"; p_target: string; p_actor?: string | null }; Returns: number };
      /** avviso di diretta, dal cron (anon) con il segreto CRON_SECRET; restituisce i destinatari */
      notify_live: { Args: { p_key: string; p_actor: string; p_stream_id: string }; Returns: number };
      /** pulizia degli avvisi scaduti (90 giorni) e del registro degli invii (180), dal cron con il segreto CRON_SECRET */
      notifications_cleanup: { Args: { p_key: string }; Returns: undefined };
      /** segna come letti i propri avvisi: tutti (p_ids assente) o quelli indicati; restituisce quanti */
      notifications_mark_read: { Args: { p_ids?: number[] | null }; Returns: number };
      /* casella messaggi (supabase/schema.sql, blocco INBOX): scritture solo da qui, errori con raise exception '<codice>' */
      is_staff: { Args: Record<string, never>; Returns: boolean };
      inbox_status: { Args: Record<string, never>; Returns: { unread: number; staff: boolean; staff_unread: number } };
      inbox_start: { Args: { topic: string; content: string; via_feedback?: boolean }; Returns: string };
      inbox_staff_start: { Args: { uname: string; topic: string; content: string }; Returns: string };
      /** restituisce from_staff del messaggio scritto */
      inbox_send: { Args: { cid: string; content: string }; Returns: boolean };
      inbox_mark_read: { Args: { cid: string; seen?: string | null }; Returns: boolean };
      inbox_set_status: { Args: { cid: string; new_status: "open" | "closed" }; Returns: undefined };
      /** chi ha scritto i messaggi di una conversazione: righe solo per lo staff (gli utenti non leggono author_id) */
      inbox_message_authors: { Args: { cid: string }; Returns: { message_id: number; author_id: string }[] };
      /* vetrina dei profili (blocco VETRINA di supabase/schema.sql): usate dal trigger guard_profile_vetrina, dai vincoli e dalla policy
         di caricamento del bucket profile-media; il sito non le chiama. EXECUTE solo per authenticated e service_role */
      profile_schedule_entry_ok: { Args: { e: unknown }; Returns: boolean };
      profile_schedule_ok: { Args: { s: unknown }; Returns: boolean };
      /** indirizzo pubblico di un file del bucket profile-media */
      profile_media_url: { Args: { p: string }; Returns: string };
      /** il file c'è nella propria cartella, con tipo ammesso e al massimo max_bytes (con i privilegi di chi chiama) */
      profile_media_ok: { Args: { p: string; max_bytes: number }; Returns: boolean };
      /** file dell'utente collegato nel bucket (tetto della policy di caricamento: 12, 60 per i ruoli con vetrina dal 29/09/2026) */
      profile_media_count: { Args: Record<string, never>; Returns: number };
      /** il file è in uso (profilo, copertina di una guida, artwork di un mazzo): policy di cancellazione del bucket e --orphans
       *  di clear-profile-media.mjs (blocco IMMAGINI, 29/09/2026; security definer) */
      profile_media_in_use: { Args: { p: string }; Returns: boolean };
      /** foto di Discord dai metadati dell'accesso (security definer): solo il proprio profilo o un admin, solo host Discord */
      profile_discord_avatar: { Args: { uid: string }; Returns: string | null };
      /* traguardi e numeri pubblici del profilo /u (blocco TRAGUARDI di supabase/schema.sql); risposte ricontrollate da achievements.ts */
      profile_achievement_facts: { Args: { pid: string }; Returns: unknown };
      profile_public_stats: { Args: { pid: string }; Returns: { decks: number; views: number; code_copies: number; votes: number; since: string | null }[] };
      /* guide della community (blocco GUIDE di supabase/schema.sql): permesso e vincoli; il sito non le chiama direttamente */
      can_publish_guides: { Args: { uid: string }; Returns: boolean };
      /* fumetti (blocco FUMETTI di supabase/schema.sql): permesso e controlli; il sito non le chiama direttamente */
      can_publish_comics: { Args: { uid: string }; Returns: boolean };
      /** file dell'utente collegato in una sua cartella del bucket profile-media (tetto della cartella dei fumetti) */
      profile_media_count_in: { Args: { folder: string }; Returns: number };
      community_guide_text_ok: { Args: { t: string; minlen: number; maxlen: number; multiline: boolean }; Returns: boolean };
      community_guide_sections_ok: { Args: { s: { heading: string; body: string }[]; complete: boolean }; Returns: boolean };
      community_guide_cards_ok: { Args: { c: string[] }; Returns: boolean };
      community_guide_translation_ok: { Args: { t: unknown; n: number }; Returns: boolean };
      /* tracker/overlay (blocco TRACKER): errori con raise exception '<codice>' (trackerErrorCode di src/lib/tracker/upload.ts) */
      /** codice monouso "ABCD-EFGH" per collegare l'app (10 minuti, al massimo 5 l'ora), per chi ha fatto l'accesso */
      tracker_link_code: { Args: Record<string, never>; Returns: string };
      /** l'app scambia il codice con il token (anon, dalla rotta /api/tracker/link) */
      tracker_link_claim: { Args: { p_code: string; p_name: string }; Returns: { token: string; username: string | null }[] };
      /** l'app si scollega con il suo token; true se valeva */
      tracker_device_unlink: { Args: { p_token: string }; Returns: boolean };
      /** partite dall'app (anon, con il token, dalla rotta /api/tracker/sync); restituisce quante aggiunte */
      tracker_submit: { Args: { p_token: string; p_matches: unknown[] }; Returns: number };
      /** scollega un proprio PC; true se c'era */
      tracker_revoke: { Args: { p_device: string }; Returns: boolean };
      /** cancella tutte le proprie partite; restituisce quante */
      tracker_forget: { Args: Record<string, never>; Returns: number };
      /* interesse per OriginsMeta Analytics (02/10/2026, pagina /analytics): una volta per browser e per account */
      analytics_interest_add: { Args: { p_client: string; p_locale: string; p_source: string }; Returns: { total: number; accounts: number; added: boolean }[] };
      analytics_interest_count: { Args: Record<string, never>; Returns: { total: number; accounts: number }[] };
      /* statistiche anonime (anon): solo aggregati di una patch, ogni numero sopra la soglia (stats.ts le ricontrolla) */
      tracker_stats_overview: { Args: { p_patch: string }; Returns: (TrackerStatCount & { with_opponent: number | null })[] };
      tracker_stats_legendaries: { Args: { p_patch: string }; Returns: (TrackerStatCount & { legendary: string })[] };
      tracker_stats_lists: { Args: { p_patch: string }; Returns: (TrackerStatCount & { list: string; legendary: string | null })[] };
      tracker_stats_archetypes: { Args: { p_patch: string }; Returns: (TrackerStatCount & { archetype: string })[] };
      tracker_stats_cards: {
        Args: { p_patch: string };
        Returns: {
          card: string;
          deck_games: number | null;
          deck_wins: number | null;
          deck_players: number | null;
          played_games: number | null;
          played_wins: number | null;
          played_players: number | null;
          avg_turn: number | null;
        }[];
      };
      tracker_stats_matchups: { Args: { p_patch: string }; Returns: (TrackerStatCount & { legendary: string; opponent: string })[] };
      tracker_stats_opponents: { Args: { p_patch: string }; Returns: (TrackerStatCount & { opponent: string })[] };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
