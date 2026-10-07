-- OriginsMeta: schema community (profili, mazzi con guida, voti, segnalazioni)
-- Applicare con: node scripts/db-migrate.mjs  (legge SUPABASE_DB_PASSWORD e SUPABASE_PROJECT_REF da .env.local)
-- Lo script è idempotente: si può rilanciare dopo ogni modifica.

create extension if not exists pgcrypto;

-- ---------- profili ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  discord_id text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1), 'player'), '[^a-zA-Z0-9]+', '-', 'g'));
  base := trim(both '-' from base);
  if base = '' then base := 'player'; end if;
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  -- 27/09/2026 (revisione dei profili): la foto solo se è davvero un indirizzo di Discord. Con il magic link i metadati
  -- li manda il browser (POST /auth/v1/otp con data.avatar_url): prima qualsiasi indirizzo finiva in avatar_url e il sito
  -- lo mostrava con <img> su /u, sui mazzi e sui tornei. Stessa espressione di profile_discord_avatar (blocco VETRINA)
  -- e di DISCORD_AVATAR_RE in src/lib/community/profileMedia.ts (showcase.test.ts le confronta).
  insert into public.profiles (id, username, display_name, avatar_url, discord_id)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'user_name', candidate),
    case when new.raw_user_meta_data->>'avatar_url' ~ '^https://(cdn\.discordapp\.com|media\.discordapp\.net)/[A-Za-z0-9/_.-]{1,255}(\?size=[0-9]{1,4})?$'
         then new.raw_user_meta_data->>'avatar_url' end,
    case when new.raw_app_meta_data->>'provider' = 'discord' then new.raw_user_meta_data->>'provider_id' else null end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- mazzi della community ----------
create table if not exists public.community_decks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  owner uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 60),
  legendary text,
  cards jsonb not null default '[]'::jsonb,
  custom_cards jsonb not null default '[]'::jsonb,
  archetype text not null default 'midrange',
  video_url text,
  guide jsonb not null default '{}'::jsonb,
  code_om text,
  status text not null default 'published' check (status in ('published','hidden','draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_decks_status_idx on public.community_decks (status, created_at desc);
create index if not exists community_decks_owner_idx on public.community_decks (owner);
create index if not exists community_decks_legendary_idx on public.community_decks (legendary);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists community_decks_touch on public.community_decks;
create trigger community_decks_touch before update on public.community_decks
  for each row execute function public.touch_updated_at();

-- ---------- voti (1-5 stelle, uno per utente per mazzo) ----------
create table if not exists public.deck_votes (
  deck_id uuid not null references public.community_decks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (deck_id, user_id)
);
drop trigger if exists deck_votes_touch on public.deck_votes;
create trigger deck_votes_touch before update on public.deck_votes
  for each row execute function public.touch_updated_at();

create or replace view public.deck_ratings as
  select deck_id, round(avg(stars)::numeric, 2) as avg_stars, count(*)::int as votes
  from public.deck_votes group by deck_id;

-- ---------- segnalazioni ----------
create table if not exists public.deck_reports (
  id bigserial primary key,
  deck_id uuid not null references public.community_decks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now()
);

-- ---------- regole di accesso (RLS) ----------
alter table public.profiles enable row level security;
alter table public.community_decks enable row level security;
alter table public.deck_votes enable row level security;
alter table public.deck_reports enable row level security;

drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select using (true);
drop policy if exists "users edit own profile" on public.profiles;
create policy "users edit own profile" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "published decks are public" on public.community_decks;
create policy "published decks are public" on public.community_decks for select
  using (status = 'published' or owner = auth.uid() or public.is_admin());
drop policy if exists "users insert own decks" on public.community_decks;
create policy "users insert own decks" on public.community_decks for insert
  with check (owner = auth.uid());
drop policy if exists "owners update decks" on public.community_decks;
create policy "owners update decks" on public.community_decks for update
  using (owner = auth.uid() or public.is_admin()) with check (owner = auth.uid() or public.is_admin());
drop policy if exists "owners delete decks" on public.community_decks;
create policy "owners delete decks" on public.community_decks for delete
  using (owner = auth.uid() or public.is_admin());

drop policy if exists "votes are public" on public.deck_votes;
create policy "votes are public" on public.deck_votes for select using (true);
drop policy if exists "users vote once" on public.deck_votes;
create policy "users vote once" on public.deck_votes for insert
  with check (user_id = auth.uid() and not exists (select 1 from public.community_decks d where d.id = deck_id and d.owner = auth.uid()));
drop policy if exists "users change own vote" on public.deck_votes;
-- 26/09/2026: anche cambiando il voto (l'upsert di castVote passa da qui) non si finisce su un mazzo proprio;
-- prima il controllo c'era solo nell'inserimento e un voto già dato si poteva spostare sul proprio mazzo
create policy "users change own vote" on public.deck_votes for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and not exists (select 1 from public.community_decks d where d.id = deck_id and d.owner = auth.uid()));
drop policy if exists "users remove own vote" on public.deck_votes;
create policy "users remove own vote" on public.deck_votes for delete using (user_id = auth.uid());

drop policy if exists "users report decks" on public.deck_reports;
create policy "users report decks" on public.deck_reports for insert with check (user_id = auth.uid());
drop policy if exists "admins read reports" on public.deck_reports;
create policy "admins read reports" on public.deck_reports for select using (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.community_decks, public.deck_votes, public.deck_ratings to anon, authenticated;
grant insert, update, delete on public.community_decks, public.deck_votes to authenticated;
grant insert, select on public.deck_reports to authenticated;
-- 26/09/2026, sicurezza: fino a oggi qui c'era "grant update on public.profiles to authenticated" e, con la policy
-- "users edit own profile", ogni iscritto poteva cambiare QUALSIASI colonna della propria riga via API con la chiave
-- pubblica, `role` compreso (cioè farsi admin, e da admin cambiare i tag, modificare o eliminare i mazzi di tutti,
-- leggere privati e segnalazioni). Verificato sul database vivo il 26/9: nessun abuso (admin solo aldrymus e
-- luigidavdasragoni). Il sito non modifica mai i profili con la sessione dell'utente: li crea handle_new_user e il tag
-- lo cambia lo staff con scripts/set-badge.mjs (connessione diretta). Quindi nessun UPDATE per anon e authenticated;
-- le colonne che l'utente potrà cambiare (per esempio bio e link) avranno un grant per colonna.
revoke update on public.profiles from anon, authenticated;

-- 15/09/2026 (note per sito 5.0): tipo di mazzo dichiarato da chi pubblica e ruolo (badge) assegnato dallo staff
alter table public.community_decks add column if not exists deck_type text not null default 'ladder';
alter table public.community_decks drop constraint if exists community_decks_deck_type_check;
alter table public.community_decks add constraint community_decks_deck_type_check check (deck_type in ('ladder','competitive','fun','tournament'));
alter table public.profiles add column if not exists badge text not null default 'community';
alter table public.profiles drop constraint if exists profiles_badge_check;
-- 27/09/2026 (Pierluigi: "Ti ripeto i ruoli e tag: Staff, Creator, Autore, Community"; "Pro rimane, Influencer
-- scompare"): chi era Influencer diventa Creator, che ne prende colore e permessi; `author` (Autore) è nuovo. Il
-- passaggio sta qui, prima del vincolo nuovo che altrimenti fallirebbe, e non fa nulla quando non c'è più nessun
-- Influencer (idempotente). Il resto delle regole dei tag sta nel blocco "27/09/2026: TAG E BIO" in fondo al file.
update public.profiles set badge = 'creator' where badge = 'influencer';
alter table public.profiles add constraint profiles_badge_check check (badge in ('community','creator','author','pro','staff'));

create or replace function public.protect_profile_badge()
returns trigger language plpgsql as $$
begin
  -- il ruolo (badge) lo cambia solo un admin dal sito o uno script con connessione diretta (auth.uid() nullo)
  if new.badge is distinct from old.badge and auth.uid() is not null and not public.is_admin() then
    raise exception 'badge is assigned by staff';
  end if;
  -- 26/09/2026: lo stesso per le altre colonne riservate (ruolo, nome utente, id Discord, id, data di nascita del
  -- profilo), anche se un grant per colonna le riaprisse per sbaglio. is_admin() legge la riga com'era prima.
  if auth.uid() is not null and not public.is_admin() and (
       new.role is distinct from old.role
    or new.username is distinct from old.username
    or new.discord_id is distinct from old.discord_id
    or new.id is distinct from old.id
    or new.created_at is distinct from old.created_at) then
    raise exception 'reserved profile fields are managed by staff';
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_badge on public.profiles;
create trigger profiles_protect_badge before update on public.profiles
  for each row execute function public.protect_profile_badge();

-- 15/09/2026 sera: un mazzo può avere più tipi (richiesta di Davdas); la vecchia colonna deck_type resta con il default
alter table public.community_decks add column if not exists deck_types text[] not null default '{ladder}';
update public.community_decks set deck_types = array[deck_type] where deck_type is not null and deck_type <> 'ladder' and deck_types = '{ladder}'::text[];
alter table public.community_decks drop constraint if exists community_decks_deck_types_check;
alter table public.community_decks add constraint community_decks_deck_types_check check (cardinality(deck_types) >= 1 and deck_types <@ array['ladder','competitive','fun','tournament']::text[]);

-- =====================================================================================================
-- 16/09/2026 — TOURNAMENT ORGANIZER (richiesta del coach e di Davdas): tornei creati dagli utenti,
-- iscrizioni con l'account del sito, mazzi consegnati prima dell'avvio, tabellone a eliminazione diretta.
-- Regole: le scritture di stato passano SOLO dalle funzioni RPC (security definer, lock sulla riga del
-- torneo); le policy RLS coprono le letture e i pochi campi descrittivi. Vedi README "Tournament Organizer".
-- =====================================================================================================

-- Tag corto e unico del torneo (es. OM-7KQ2), alfabeto senza caratteri ambigui (niente 0/O, 1/I).
create or replace function public.gen_tournament_tag()
returns text language plpgsql volatile as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  out text := '';
  i int;
begin
  for i in 1..4 loop
    out := out || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return 'OM-' || out;
end $$;

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  tag text unique not null default public.gen_tournament_tag(),
  organizer uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 60),
  cover_url text,
  description text not null default '' check (char_length(description) <= 2000),
  rules text not null default '' check (char_length(rules) <= 2000),
  lang text not null default 'en' check (lang in ('en','it','es','fr')),
  starts_at timestamptz not null,
  size int not null check (size in (4,8,16,32,64,128)),
  format text not null default 'single_elim' check (format in ('single_elim')),
  deck_mode text not null default 'free' check (deck_mode in ('free','conquest')),
  conquest_decks int not null default 3 check (conquest_decks between 2 and 4),
  conquest_min_different int not null default 9 check (conquest_min_different between 0 and 25),
  best_of int not null default 1 check (best_of in (1,3,5)),
  discord_url text,
  status text not null default 'open' check (status in ('open','running','finished','cancelled')),
  listed boolean not null default false,
  report text check (report is null or char_length(report) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tournaments_status_idx on public.tournaments (status, starts_at);
create index if not exists tournaments_organizer_idx on public.tournaments (organizer);
create index if not exists tournaments_listed_idx on public.tournaments (listed, starts_at);
drop trigger if exists tournaments_touch on public.tournaments;
create trigger tournaments_touch before update on public.tournaments
  for each row execute function public.touch_updated_at();

-- Sul calendario del sito finiscono solo i tornei di Creator, Pro e Staff (o di un admin); dal 27/09/2026 l'Autore no.
create or replace function public.protect_tournament_listing()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.listed and not exists (
    select 1 from public.profiles p where p.id = new.organizer and (p.badge in ('creator','pro','staff') or p.role = 'admin')
  ) then
    raise exception 'listing_not_allowed';
  end if;
  return new;
end $$;
drop trigger if exists tournaments_protect_listing on public.tournaments;
create trigger tournaments_protect_listing before insert or update of listed, organizer on public.tournaments
  for each row execute function public.protect_tournament_listing();

create table if not exists public.tournament_players (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered','dropped','disqualified')),
  decks_submitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tournament_id, user_id)
);
create index if not exists tournament_players_user_idx on public.tournament_players (user_id);
drop trigger if exists tournament_players_touch on public.tournament_players;
create trigger tournament_players_touch before update on public.tournament_players
  for each row execute function public.touch_updated_at();

-- Liste consegnate (codici OriginsMeta OM1...): 1 per il formato libero, conquest_decks per il Conquest.
create table if not exists public.tournament_decks (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  codes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tournament_id, user_id)
);
drop trigger if exists tournament_decks_touch on public.tournament_decks;
create trigger tournament_decks_touch before update on public.tournament_decks
  for each row execute function public.touch_updated_at();

-- Tabellone: tutte le partite vengono create all'avvio (giocatori null dove non ancora noti).
-- La partita successiva è (round + 1, position / 2); il lato è position % 2 (0 = player_a, 1 = player_b).
create table if not exists public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round int not null check (round >= 1),
  position int not null check (position >= 0),
  player_a uuid references public.profiles(id) on delete set null,
  player_b uuid references public.profiles(id) on delete set null,
  winner uuid references public.profiles(id) on delete set null,
  score_a int check (score_a is null or score_a between 0 and 3),
  score_b int check (score_b is null or score_b between 0 and 3),
  status text not null default 'pending' check (status in ('pending','reported','confirmed','disputed','bye')),
  reported_by uuid references public.profiles(id) on delete set null,
  forfeit boolean not null default false,
  note text check (note is null or char_length(note) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, round, position),
  check (score_a is null or score_b is null or score_a <> score_b)
);
create index if not exists tournament_matches_players_idx on public.tournament_matches (player_a, player_b);
drop trigger if exists tournament_matches_touch on public.tournament_matches;
create trigger tournament_matches_touch before update on public.tournament_matches
  for each row execute function public.touch_updated_at();

-- ---------- funzioni di appartenenza (usate dalle policy: restano eseguibili da tutti) ----------
create or replace function public.is_tournament_organizer(tid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (select 1 from public.tournaments t where t.id = tid and t.organizer = auth.uid());
$$;

-- Chi chiama è uno dei due giocatori della partita, l'organizzatore del torneo o un admin.
create or replace function public.is_match_party(mid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (
    select 1 from public.tournament_matches m join public.tournaments t on t.id = m.tournament_id
    where m.id = mid and (m.player_a = auth.uid() or m.player_b = auth.uid() or t.organizer = auth.uid() or public.is_admin())
  );
$$;

-- Chi chiama è (o è stato) avversario di uid in una partita del torneo tid.
create or replace function public.is_opponent_of(tid uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (
    select 1 from public.tournament_matches m
    where m.tournament_id = tid and ((m.player_a = uid and m.player_b = auth.uid()) or (m.player_b = uid and m.player_a = auth.uid()))
  );
$$;

-- ---------- RPC: iscrizione, ritiro, consegna dei mazzi ----------
create or replace function public.join_tournament(tid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  n int;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.status <> 'open' then raise exception 'not_open'; end if;
  if exists (select 1 from public.tournament_players where tournament_id = tid and user_id = auth.uid()) then raise exception 'already_joined'; end if;
  select count(*) into n from public.tournament_players where tournament_id = tid;
  if n >= t.size then raise exception 'full'; end if;
  insert into public.tournament_players (tournament_id, user_id) values (tid, auth.uid());
end $$;
revoke all on function public.join_tournament(uuid) from public, anon;
grant execute on function public.join_tournament(uuid) to authenticated;

create or replace function public.leave_tournament(tid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.tournaments%rowtype;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.status <> 'open' then raise exception 'not_open'; end if;
  delete from public.tournament_decks where tournament_id = tid and user_id = auth.uid();
  delete from public.tournament_players where tournament_id = tid and user_id = auth.uid();
end $$;
revoke all on function public.leave_tournament(uuid) from public, anon;
grant execute on function public.leave_tournament(uuid) to authenticated;

-- La legalità dei mazzi (checkDeck, validateConquest) è verificata prima dalla Server Action; qui si controlla solo il numero.
create or replace function public.submit_tournament_decks(tid uuid, codes jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  expected int;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.status <> 'open' then raise exception 'not_open'; end if;
  if not exists (select 1 from public.tournament_players where tournament_id = tid and user_id = auth.uid()) then raise exception 'not_registered'; end if;
  expected := case when t.deck_mode = 'conquest' then t.conquest_decks else 1 end;
  if jsonb_typeof(codes) <> 'array' or jsonb_array_length(codes) <> expected then raise exception 'decks_count'; end if;
  insert into public.tournament_decks (tournament_id, user_id, codes) values (tid, auth.uid(), codes)
    on conflict (tournament_id, user_id) do update set codes = excluded.codes;
  update public.tournament_players set decks_submitted = true where tournament_id = tid and user_id = auth.uid();
end $$;
revoke all on function public.submit_tournament_decks(uuid, jsonb) from public, anon;
grant execute on function public.submit_tournament_decks(uuid, jsonb) to authenticated;

-- ---------- RLS ----------
alter table public.tournaments enable row level security;
alter table public.tournament_players enable row level security;
alter table public.tournament_decks enable row level security;
alter table public.tournament_matches enable row level security;

drop policy if exists "tournaments are public" on public.tournaments;
create policy "tournaments are public" on public.tournaments for select using (true);
drop policy if exists "users create tournaments" on public.tournaments;
create policy "users create tournaments" on public.tournaments for insert with check (organizer = auth.uid());
drop policy if exists "organizers edit tournaments" on public.tournaments;
create policy "organizers edit tournaments" on public.tournaments for update
  using (organizer = auth.uid() or public.is_admin()) with check (organizer = auth.uid() or public.is_admin());
drop policy if exists "organizers delete open tournaments" on public.tournaments;
create policy "organizers delete open tournaments" on public.tournaments for delete
  using ((organizer = auth.uid() and status = 'open') or public.is_admin());

drop policy if exists "tournament players are public" on public.tournament_players;
create policy "tournament players are public" on public.tournament_players for select using (true);

drop policy if exists "tournament decks visibility" on public.tournament_decks;
create policy "tournament decks visibility" on public.tournament_decks for select using (
  user_id = auth.uid()
  or public.is_tournament_organizer(tournament_id)
  or public.is_admin()
  or public.is_opponent_of(tournament_id, user_id)
  or exists (select 1 from public.tournaments t where t.id = tournament_id and t.status = 'finished')
);

drop policy if exists "tournament matches are public" on public.tournament_matches;
create policy "tournament matches are public" on public.tournament_matches for select using (true);

grant select on public.tournaments, public.tournament_players, public.tournament_decks, public.tournament_matches to anon, authenticated;
grant insert, update, delete on public.tournaments to authenticated;
-- tournament_players, tournament_decks e tournament_matches si scrivono solo tramite le RPC (security definer).

-- ---------- Storage: copertine dei tornei (upload dal browser, solo Creator/Pro/Staff o admin, nella propria cartella) ----------
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('tournament-covers', 'tournament-covers', true, 1048576, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

  drop policy if exists "tournament covers are public" on storage.objects;
  create policy "tournament covers are public" on storage.objects for select using (bucket_id = 'tournament-covers');
  drop policy if exists "badged users upload tournament covers" on storage.objects;
  create policy "badged users upload tournament covers" on storage.objects for insert to authenticated with check (
    bucket_id = 'tournament-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.profiles p where p.id = auth.uid() and (p.badge in ('creator','pro','staff') or p.role = 'admin'))
  );
  drop policy if exists "users manage own tournament covers" on storage.objects;
  create policy "users manage own tournament covers" on storage.objects for delete to authenticated using (
    bucket_id = 'tournament-covers' and (storage.foldername(name))[1] = auth.uid()::text
  );
exception when others then
  raise notice 'Storage tournament-covers non configurato da SQL (%): creare bucket e policy dalla dashboard, vedi README.', sqlerrm;
end $$;

-- ---------- 16/09/2026 — Tournament Organizer, fase 2: tabellone e gestione (RPC security definer) ----------
-- Convenzioni: lock sempre nell'ordine torneo → partita; errori con raise exception 'codice' (chiavi del
-- dizionario tournaments.errors); solo `authenticated` può eseguire le RPC; tm_propagate è interna.

-- Ordine standard dei seed sui posti del primo turno (stessa definizione di seedOrder in src/lib/tournament/bracket.ts):
-- si parte da {1}; a ogni raddoppio fino a m posti ogni seed s diventa la coppia (s, m + 1 - s). Per 8: 1,8,4,5,2,7,3,6.
create or replace function public.bracket_order(size int)
returns int[] language plpgsql immutable as $$
declare
  ord int[] := array[1];
  nxt int[];
  m int := 1;
  s int;
begin
  if size < 2 or (size & (size - 1)) <> 0 then raise exception 'bad_size'; end if;
  while m < size loop
    m := m * 2;
    nxt := '{}';
    foreach s in array ord loop
      nxt := nxt || s || (m + 1 - s);
    end loop;
    ord := nxt;
  end loop;
  return ord;
end $$;

-- Scrive il vincitore di una partita nello slot della partita successiva (round + 1, position / 2; lato = position % 2).
create or replace function public.tm_propagate(mid uuid)
returns void language plpgsql as $$
declare m public.tournament_matches%rowtype;
begin
  select * into m from public.tournament_matches where id = mid;
  if not found or m.winner is null then return; end if;
  if m.position % 2 = 0 then
    update public.tournament_matches set player_a = m.winner where tournament_id = m.tournament_id and round = m.round + 1 and position = m.position / 2;
  else
    update public.tournament_matches set player_b = m.winner where tournament_id = m.tournament_id and round = m.round + 1 and position = m.position / 2;
  end if;
end $$;
revoke all on function public.tm_propagate(uuid) from public, anon, authenticated;

-- Avvio: `seeded` è l'elenco ordinato dei giocatori (seed 1 per primo; casuale o manuale, deciso dal client).
-- Devono essere iscritti con i mazzi consegnati; gli altri iscritti escono dal tabellone (dropped).
-- Dimensione = minima potenza di 2 >= giocatori; tutte le partite di tutti i turni vengono create subito;
-- i bye (seed mancanti) cadono sempre in player_b e passano il turno all'istante.
create or replace function public.start_tournament(tid uuid, seeded uuid[])
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  n int;
  size int := 2;
  rounds int := 0;
  cnt int;
  r int;
  pos int;
  ord int[];
  a uuid;
  b uuid;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.organizer <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;
  if t.status <> 'open' then raise exception 'not_open'; end if;
  n := coalesce(array_length(seeded, 1), 0);
  if n < 2 then raise exception 'too_few_players'; end if;
  if n > t.size then raise exception 'too_many_players'; end if;
  if (select count(distinct x) from unnest(seeded) x) <> n then raise exception 'bad_seeding'; end if;
  if exists (
    select 1 from unnest(seeded) x
    where not exists (select 1 from public.tournament_players p where p.tournament_id = tid and p.user_id = x and p.status = 'registered' and p.decks_submitted)
  ) then raise exception 'bad_seeding'; end if;
  if exists (select 1 from public.tournament_matches where tournament_id = tid) then raise exception 'already_started'; end if;

  update public.tournament_players set status = 'dropped' where tournament_id = tid and status = 'registered' and not (user_id = any(seeded));

  while size < n loop size := size * 2; end loop;
  cnt := size;
  while cnt > 1 loop cnt := cnt / 2; rounds := rounds + 1; end loop;
  ord := public.bracket_order(size);

  cnt := size;
  for r in 1..rounds loop
    cnt := cnt / 2;
    for pos in 0..cnt - 1 loop
      insert into public.tournament_matches (tournament_id, round, position) values (tid, r, pos);
    end loop;
  end loop;

  for pos in 0..size / 2 - 1 loop
    a := case when ord[2 * pos + 1] <= n then seeded[ord[2 * pos + 1]] else null end;
    b := case when ord[2 * pos + 2] <= n then seeded[ord[2 * pos + 2]] else null end;
    if a is null then raise exception 'bad_seeding'; end if;
    if b is null then
      update public.tournament_matches set player_a = a, winner = a, status = 'bye' where tournament_id = tid and round = 1 and position = pos;
      perform public.tm_propagate((select id from public.tournament_matches where tournament_id = tid and round = 1 and position = pos));
    else
      update public.tournament_matches set player_a = a, player_b = b where tournament_id = tid and round = 1 and position = pos;
    end if;
  end loop;

  update public.tournaments set status = 'running' where id = tid;
end $$;
revoke all on function public.start_tournament(uuid, uuid[]) from public, anon;
grant execute on function public.start_tournament(uuid, uuid[]) to authenticated;

-- Scambio di due giocatori tra le loro partite ancora da giocare (stesso turno), a torneo in corso.
create or replace function public.swap_players(tid uuid, u1 uuid, u2 uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  m1 public.tournament_matches%rowtype;
  m2 public.tournament_matches%rowtype;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.organizer <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;
  if t.status <> 'running' then raise exception 'not_running'; end if;
  if u1 = u2 then raise exception 'bad_swap'; end if;
  select * into m1 from public.tournament_matches where tournament_id = tid and status = 'pending' and (player_a = u1 or player_b = u1) order by round limit 1 for update;
  if not found then raise exception 'not_pending'; end if;
  select * into m2 from public.tournament_matches where tournament_id = tid and status = 'pending' and (player_a = u2 or player_b = u2) order by round limit 1 for update;
  if not found then raise exception 'not_pending'; end if;
  if m1.round <> m2.round then raise exception 'bad_swap'; end if;
  if m1.id = m2.id then
    update public.tournament_matches set player_a = player_b, player_b = player_a where id = m1.id;
    return;
  end if;
  if m1.player_a = u1 then update public.tournament_matches set player_a = u2 where id = m1.id; else update public.tournament_matches set player_b = u2 where id = m1.id; end if;
  if m2.player_a = u2 then update public.tournament_matches set player_a = u1 where id = m2.id; else update public.tournament_matches set player_b = u1 where id = m2.id; end if;
end $$;
revoke all on function public.swap_players(uuid, uuid, uuid) from public, anon;
grant execute on function public.swap_players(uuid, uuid, uuid) to authenticated;

-- Referto di un giocatore. Il primo referto mette la partita in 'reported'; il secondo, dell'avversario, la conferma
-- se il punteggio coincide (e il vincitore passa il turno) oppure la mette in 'disputed'. Chi ha refertato può correggersi.
create or replace function public.report_match_result(mid uuid, a int, b int)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  m public.tournament_matches%rowtype;
  t public.tournaments%rowtype;
  need int;
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not_logged_in'; end if;
  select * into m from public.tournament_matches where id = mid;
  if not found then raise exception 'not_found'; end if;
  select * into t from public.tournaments where id = m.tournament_id for update;
  select * into m from public.tournament_matches where id = mid for update;
  if t.status <> 'running' then raise exception 'not_running'; end if;
  if me <> m.player_a and me <> m.player_b then raise exception 'forbidden'; end if;
  if m.player_a is null or m.player_b is null then raise exception 'not_ready'; end if;
  if m.status not in ('pending', 'reported') then raise exception 'already_confirmed'; end if;
  need := (t.best_of + 1) / 2;
  if a is null or b is null or a < 0 or b < 0 or greatest(a, b) <> need or least(a, b) >= need then raise exception 'bad_score'; end if;
  if m.status = 'pending' then
    update public.tournament_matches set score_a = a, score_b = b, status = 'reported', reported_by = me where id = mid;
  elsif m.reported_by = me then
    update public.tournament_matches set score_a = a, score_b = b where id = mid;
  elsif m.score_a = a and m.score_b = b then
    update public.tournament_matches set status = 'confirmed', winner = case when a > b then m.player_a else m.player_b end where id = mid;
    perform public.tm_propagate(mid);
  else
    update public.tournament_matches set status = 'disputed', note = format('%s-%s vs %s-%s', m.score_a, m.score_b, a, b) where id = mid;
  end if;
end $$;
revoke all on function public.report_match_result(uuid, int, int) from public, anon;
grant execute on function public.report_match_result(uuid, int, int) to authenticated;

-- Risultato imposto dall'organizzatore (anche forfait / no-show). Ripropaga solo se la partita successiva è ancora
-- da giocare, altrimenti 'next_match_started'.
create or replace function public.set_match_result(mid uuid, a int, b int, forfeit boolean default false)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  m public.tournament_matches%rowtype;
  nm public.tournament_matches%rowtype;
  t public.tournaments%rowtype;
  need int;
  w uuid;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into m from public.tournament_matches where id = mid;
  if not found then raise exception 'not_found'; end if;
  select * into t from public.tournaments where id = m.tournament_id for update;
  select * into m from public.tournament_matches where id = mid for update;
  if t.organizer <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;
  if t.status <> 'running' then raise exception 'not_running'; end if;
  if m.player_a is null or m.player_b is null then raise exception 'not_ready'; end if;
  need := (t.best_of + 1) / 2;
  if a is null or b is null or a < 0 or b < 0 or greatest(a, b) <> need or least(a, b) >= need then raise exception 'bad_score'; end if;
  if forfeit and least(a, b) <> 0 then raise exception 'bad_score'; end if;
  w := case when a > b then m.player_a else m.player_b end;
  select * into nm from public.tournament_matches where tournament_id = m.tournament_id and round = m.round + 1 and position = m.position / 2;
  if found and nm.status <> 'pending' then raise exception 'next_match_started'; end if;
  if found and m.winner is not null and m.winner <> w then
    -- lo slot deve contenere ancora il vecchio vincitore, altrimenti qualcuno l'ha già spostato
    if (m.position % 2 = 0 and nm.player_a is distinct from m.winner) or (m.position % 2 = 1 and nm.player_b is distinct from m.winner) then raise exception 'next_match_started'; end if;
  end if;
  update public.tournament_matches set score_a = a, score_b = b, winner = w, status = 'confirmed', forfeit = set_match_result.forfeit, reported_by = null where id = mid;
  perform public.tm_propagate(mid);
end $$;
revoke all on function public.set_match_result(uuid, int, int, boolean) from public, anon;
grant execute on function public.set_match_result(uuid, int, int, boolean) to authenticated;

-- Abbandono: prima dell'avvio toglie l'iscrizione; a torneo in corso dà la partita all'avversario (forfait) e propaga.
create or replace function public.drop_player(tid uuid, uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  m public.tournament_matches%rowtype;
  need int;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.organizer <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;
  if t.status = 'open' then
    delete from public.tournament_decks where tournament_id = tid and user_id = uid;
    delete from public.tournament_players where tournament_id = tid and user_id = uid;
    return;
  end if;
  if t.status <> 'running' then raise exception 'not_running'; end if;
  need := (t.best_of + 1) / 2;
  select * into m from public.tournament_matches where tournament_id = tid and status in ('pending', 'reported', 'disputed') and (player_a = uid or player_b = uid) order by round limit 1 for update;
  if found then
    if m.player_a is null or m.player_b is null then raise exception 'no_opponent_yet'; end if;
    if m.player_a = uid then
      update public.tournament_matches set score_a = 0, score_b = need, winner = m.player_b, status = 'confirmed', forfeit = true, reported_by = null where id = m.id;
    else
      update public.tournament_matches set score_a = need, score_b = 0, winner = m.player_a, status = 'confirmed', forfeit = true, reported_by = null where id = m.id;
    end if;
    perform public.tm_propagate(m.id);
  end if;
  update public.tournament_players set status = 'dropped' where tournament_id = tid and user_id = uid;
end $$;
revoke all on function public.drop_player(uuid, uuid) from public, anon;
grant execute on function public.drop_player(uuid, uuid) to authenticated;

-- Chiusura: la finale deve avere un vincitore. Il referto (testo semplice) è facoltativo.
create or replace function public.finish_tournament(tid uuid, report text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  last_round int;
  f public.tournament_matches%rowtype;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.organizer <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;
  if t.status <> 'running' then raise exception 'not_running'; end if;
  select max(round) into last_round from public.tournament_matches where tournament_id = tid;
  select * into f from public.tournament_matches where tournament_id = tid and round = last_round and position = 0;
  if not found or f.winner is null or f.status not in ('confirmed', 'bye') then raise exception 'final_not_played'; end if;
  update public.tournaments set status = 'finished', report = left(coalesce(finish_tournament.report, ''), 2000) where id = tid;
end $$;
revoke all on function public.finish_tournament(uuid, text) from public, anon;
grant execute on function public.finish_tournament(uuid, text) to authenticated;

create or replace function public.cancel_tournament(tid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.tournaments%rowtype;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.organizer <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;
  if t.status not in ('open', 'running') then raise exception 'not_running'; end if;
  update public.tournaments set status = 'cancelled', listed = false where id = tid;
end $$;
revoke all on function public.cancel_tournament(uuid) from public, anon;
grant execute on function public.cancel_tournament(uuid) to authenticated;

-- ---------- 16/09/2026 — Tournament Organizer, fase 3: stanza partita (chat tra le parti, screenshot privati) ----------

create table if not exists public.tournament_messages (
  id bigserial primary key,
  match_id uuid not null references public.tournament_matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists tournament_messages_match_idx on public.tournament_messages (match_id, id);
alter table public.tournament_messages enable row level security;
drop policy if exists "match parties read messages" on public.tournament_messages;
create policy "match parties read messages" on public.tournament_messages for select using (public.is_match_party(match_id));
grant select on public.tournament_messages to authenticated;
-- si scrive solo con send_message (limite di 20 messaggi al minuto per utente e partita)

create or replace function public.send_message(mid uuid, body text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  m public.tournament_matches%rowtype;
  t public.tournaments%rowtype;
  recent int;
  clean text;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  clean := left(btrim(coalesce(send_message.body, '')), 500);
  if char_length(clean) < 1 then raise exception 'empty_message'; end if;
  select * into m from public.tournament_matches where id = mid;
  if not found then raise exception 'not_found'; end if;
  if not public.is_match_party(mid) then raise exception 'forbidden'; end if;
  select * into t from public.tournaments where id = m.tournament_id;
  if t.status <> 'running' then raise exception 'not_running'; end if;
  perform 1 from public.tournament_matches where id = mid for update;
  select count(*) into recent from public.tournament_messages where match_id = mid and user_id = auth.uid() and created_at > now() - interval '1 minute';
  if recent >= 20 then raise exception 'too_many_messages'; end if;
  insert into public.tournament_messages (match_id, user_id, body) values (mid, auth.uid(), clean);
end $$;
revoke all on function public.send_message(uuid, text) from public, anon;
grant execute on function public.send_message(uuid, text) to authenticated;

-- Le policy dello Storage ricevono la prima cartella del percorso come testo: qui si controlla che sia un uuid
-- prima di chiedere a is_match_party (l'ordine di valutazione degli AND in una policy non è garantito).
create or replace function public.is_match_party_path(folder text)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if folder is null or folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  return public.is_match_party(folder::uuid);
end $$;

-- Bucket privato: percorso <match_id>/<user_id>/<1|2|3>.(jpg|png|webp) → massimo 3 immagini per giocatore per partita.
-- Leggono solo le parti (i due giocatori, l'organizzatore, gli admin) tramite URL firmati generati sul server.
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('tournament-screenshots', 'tournament-screenshots', false, 2097152, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

  drop policy if exists "match parties read screenshots" on storage.objects;
  create policy "match parties read screenshots" on storage.objects for select to authenticated using (
    bucket_id = 'tournament-screenshots' and public.is_match_party_path((storage.foldername(name))[1])
  );
  drop policy if exists "players upload screenshots" on storage.objects;
  create policy "players upload screenshots" on storage.objects for insert to authenticated with check (
    bucket_id = 'tournament-screenshots'
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[123]\.(jpg|png|webp)$'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.is_match_party_path((storage.foldername(name))[1])
  );
  drop policy if exists "players replace own screenshots" on storage.objects;
  create policy "players replace own screenshots" on storage.objects for update to authenticated
    using (bucket_id = 'tournament-screenshots' and (storage.foldername(name))[2] = auth.uid()::text)
    with check (bucket_id = 'tournament-screenshots' and (storage.foldername(name))[2] = auth.uid()::text);
  drop policy if exists "players delete own screenshots" on storage.objects;
  create policy "players delete own screenshots" on storage.objects for delete to authenticated using (
    bucket_id = 'tournament-screenshots' and (storage.foldername(name))[2] = auth.uid()::text
  );
exception when others then
  raise notice 'Storage tournament-screenshots non configurato da SQL (%): creare bucket e policy dalla dashboard, vedi README.', sqlerrm;
end $$;

-- ---------- 16/09/2026 — Tournament Organizer: tornei pubblici e privati a invito (richiesta di Pierluigi) ----------
-- Privato = non compare in liste, calendario, sitemap e ricerca per tag; lo vedono e vi si iscrivono solo
-- l'organizzatore, gli admin, gli iscritti e gli invitati (link segreto o invito per nome utente).

alter table public.tournaments add column if not exists visibility text not null default 'public';
alter table public.tournaments drop constraint if exists tournaments_visibility_check;
alter table public.tournaments add constraint tournaments_visibility_check check (visibility in ('public','private'));
create index if not exists tournaments_visibility_idx on public.tournaments (visibility, status, starts_at);

-- Codice del link d'invito: in una tabella a parte, leggibile solo da organizzatore e admin (le policy sono per riga, non per colonna).
create or replace function public.gen_invite_code()
returns text language plpgsql volatile as $$
declare
  alphabet constant text := '23456789abcdefghjkmnpqrstuvwxyz';
  out text := '';
  i int;
begin
  for i in 1..10 loop
    out := out || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return out;
end $$;

create table if not exists public.tournament_secrets (
  tournament_id uuid primary key references public.tournaments(id) on delete cascade,
  invite_code text not null default public.gen_invite_code(),
  updated_at timestamptz not null default now()
);
-- ogni torneo ha il suo codice fin dalla creazione
create or replace function public.tournament_secret_row()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.tournament_secrets (tournament_id) values (new.id) on conflict (tournament_id) do nothing;
  return new;
end $$;
drop trigger if exists tournaments_secret_row on public.tournaments;
create trigger tournaments_secret_row after insert on public.tournaments
  for each row execute function public.tournament_secret_row();
insert into public.tournament_secrets (tournament_id) select id from public.tournaments on conflict (tournament_id) do nothing;

create table if not exists public.tournament_invites (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (tournament_id, user_id)
);
create index if not exists tournament_invites_user_idx on public.tournament_invites (user_id);

-- Chi può vedere il torneo: pubblico per tutti; privato per organizzatore, admin, iscritti e invitati.
create or replace function public.can_view_tournament(tid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.tournaments t
    where t.id = tid and (
      t.visibility = 'public'
      or (auth.uid() is not null and (
        t.organizer = auth.uid()
        or public.is_admin()
        or exists (select 1 from public.tournament_players p where p.tournament_id = t.id and p.user_id = auth.uid())
        or exists (select 1 from public.tournament_invites i where i.tournament_id = t.id and i.user_id = auth.uid())
      ))
    )
  );
$$;

-- Un torneo privato non va mai in calendario.
create or replace function public.protect_tournament_listing()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.listed and new.visibility = 'private' then
    raise exception 'private_not_listed';
  end if;
  if new.listed and not exists (
    select 1 from public.profiles p where p.id = new.organizer and (p.badge in ('creator','pro','staff') or p.role = 'admin')
  ) then
    raise exception 'listing_not_allowed';
  end if;
  return new;
end $$;
drop trigger if exists tournaments_protect_listing on public.tournaments;
create trigger tournaments_protect_listing before insert or update of listed, organizer, visibility on public.tournaments
  for each row execute function public.protect_tournament_listing();

-- ---------- policy: la visibilità vale per tutte le tabelle del torneo ----------
drop policy if exists "tournaments are public" on public.tournaments;
create policy "tournaments are public" on public.tournaments for select using (public.can_view_tournament(id));
drop policy if exists "tournament players are public" on public.tournament_players;
create policy "tournament players are public" on public.tournament_players for select using (public.can_view_tournament(tournament_id));
drop policy if exists "tournament matches are public" on public.tournament_matches;
create policy "tournament matches are public" on public.tournament_matches for select using (public.can_view_tournament(tournament_id));
drop policy if exists "tournament decks visibility" on public.tournament_decks;
create policy "tournament decks visibility" on public.tournament_decks for select using (
  public.can_view_tournament(tournament_id) and (
    user_id = auth.uid()
    or public.is_tournament_organizer(tournament_id)
    or public.is_admin()
    or public.is_opponent_of(tournament_id, user_id)
    or exists (select 1 from public.tournaments t where t.id = tournament_id and t.status = 'finished')
  )
);
alter table public.tournament_secrets enable row level security;
drop policy if exists "organizers read invite code" on public.tournament_secrets;
create policy "organizers read invite code" on public.tournament_secrets for select using (public.is_tournament_organizer(tournament_id) or public.is_admin());
alter table public.tournament_invites enable row level security;
drop policy if exists "invites visibility" on public.tournament_invites;
create policy "invites visibility" on public.tournament_invites for select using (user_id = auth.uid() or public.is_tournament_organizer(tournament_id) or public.is_admin());
grant select on public.tournament_secrets, public.tournament_invites to authenticated;

-- ---------- RPC ----------
-- Iscrizione: a un torneo privato serve un invito (o essere l'organizzatore).
create or replace function public.join_tournament(tid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  n int;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.status <> 'open' then raise exception 'not_open'; end if;
  if t.visibility = 'private' and t.organizer <> auth.uid() and not public.is_admin()
     and not exists (select 1 from public.tournament_invites i where i.tournament_id = tid and i.user_id = auth.uid()) then
    raise exception 'invite_required';
  end if;
  if exists (select 1 from public.tournament_players where tournament_id = tid and user_id = auth.uid()) then raise exception 'already_joined'; end if;
  select count(*) into n from public.tournament_players where tournament_id = tid;
  if n >= t.size then raise exception 'full'; end if;
  insert into public.tournament_players (tournament_id, user_id) values (tid, auth.uid());
end $$;
revoke all on function public.join_tournament(uuid) from public, anon;
grant execute on function public.join_tournament(uuid) to authenticated;

-- Link d'invito: chi lo apre da loggato riceve l'invito e può vedere il torneo. Restituisce lo slug. Per i tornei pubblici basta il tag.
create or replace function public.redeem_invite(tag text, code text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  s public.tournament_secrets%rowtype;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where tournaments.tag = redeem_invite.tag;
  if not found then raise exception 'not_found'; end if;
  if t.visibility = 'public' then return t.slug; end if;
  select * into s from public.tournament_secrets where tournament_id = t.id;
  if not found or s.invite_code <> code then raise exception 'bad_invite'; end if;
  insert into public.tournament_invites (tournament_id, user_id, invited_by) values (t.id, auth.uid(), null) on conflict (tournament_id, user_id) do nothing;
  return t.slug;
end $$;
revoke all on function public.redeem_invite(text, text) from public, anon;
grant execute on function public.redeem_invite(text, text) to authenticated;

-- Invito per nome utente (organizzatore o admin).
create or replace function public.invite_player(tid uuid, uname text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  target uuid;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid;
  if not found then raise exception 'not_found'; end if;
  if t.organizer <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;
  if t.status not in ('open', 'running') then raise exception 'not_open'; end if;
  select id into target from public.profiles where lower(username) = lower(btrim(replace(uname, '@', ''))) limit 1;
  if target is null then raise exception 'user_not_found'; end if;
  insert into public.tournament_invites (tournament_id, user_id, invited_by) values (tid, target, auth.uid()) on conflict (tournament_id, user_id) do nothing;
end $$;
revoke all on function public.invite_player(uuid, text) from public, anon;
grant execute on function public.invite_player(uuid, text) to authenticated;

create or replace function public.revoke_invite(tid uuid, uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.tournaments%rowtype;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid;
  if not found then raise exception 'not_found'; end if;
  if t.organizer <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;
  delete from public.tournament_invites where tournament_id = tid and user_id = uid;
end $$;
revoke all on function public.revoke_invite(uuid, uuid) from public, anon;
grant execute on function public.revoke_invite(uuid, uuid) to authenticated;

-- Nuovo link d'invito: il vecchio smette di funzionare (gli inviti già ricevuti restano).
create or replace function public.rotate_invite_code(tid uuid)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  fresh text := public.gen_invite_code();
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid;
  if not found then raise exception 'not_found'; end if;
  if t.organizer <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;
  insert into public.tournament_secrets (tournament_id, invite_code, updated_at) values (tid, fresh, now())
    on conflict (tournament_id) do update set invite_code = excluded.invite_code, updated_at = now();
  return fresh;
end $$;
revoke all on function public.rotate_invite_code(uuid) from public, anon;
grant execute on function public.rotate_invite_code(uuid) to authenticated;

-- ---------- 16/09/2026 — Avvio automatico: il tabellone nasce appena il torneo è al completo e tutti hanno consegnato i mazzi ----------
-- (richiesta di Pierluigi: non aspettare la data di inizio né l'organizzatore, che può comunque avviare prima a mano)

-- Generazione del tabellone senza controlli di permesso: la chiamano start_tournament (organizzatore/admin) e tm_autostart.
create or replace function public.tm_start(tid uuid, seeded uuid[])
returns void language plpgsql as $$
declare
  t public.tournaments%rowtype;
  n int;
  size int := 2;
  rounds int := 0;
  cnt int;
  r int;
  pos int;
  ord int[];
  a uuid;
  b uuid;
begin
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.status <> 'open' then raise exception 'not_open'; end if;
  n := coalesce(array_length(seeded, 1), 0);
  if n < 2 then raise exception 'too_few_players'; end if;
  if n > t.size then raise exception 'too_many_players'; end if;
  if (select count(distinct x) from unnest(seeded) x) <> n then raise exception 'bad_seeding'; end if;
  if exists (
    select 1 from unnest(seeded) x
    where not exists (select 1 from public.tournament_players p where p.tournament_id = tid and p.user_id = x and p.status = 'registered' and p.decks_submitted)
  ) then raise exception 'bad_seeding'; end if;
  if exists (select 1 from public.tournament_matches where tournament_id = tid) then raise exception 'already_started'; end if;

  update public.tournament_players set status = 'dropped' where tournament_id = tid and status = 'registered' and not (user_id = any(seeded));

  while size < n loop size := size * 2; end loop;
  cnt := size;
  while cnt > 1 loop cnt := cnt / 2; rounds := rounds + 1; end loop;
  ord := public.bracket_order(size);

  cnt := size;
  for r in 1..rounds loop
    cnt := cnt / 2;
    for pos in 0..cnt - 1 loop
      insert into public.tournament_matches (tournament_id, round, position) values (tid, r, pos);
    end loop;
  end loop;

  for pos in 0..size / 2 - 1 loop
    a := case when ord[2 * pos + 1] <= n then seeded[ord[2 * pos + 1]] else null end;
    b := case when ord[2 * pos + 2] <= n then seeded[ord[2 * pos + 2]] else null end;
    if a is null then raise exception 'bad_seeding'; end if;
    if b is null then
      update public.tournament_matches set player_a = a, winner = a, status = 'bye' where tournament_id = tid and round = 1 and position = pos;
      perform public.tm_propagate((select id from public.tournament_matches where tournament_id = tid and round = 1 and position = pos));
    else
      update public.tournament_matches set player_a = a, player_b = b where tournament_id = tid and round = 1 and position = pos;
    end if;
  end loop;

  update public.tournaments set status = 'running' where id = tid;
end $$;
revoke all on function public.tm_start(uuid, uuid[]) from public, anon, authenticated;

-- Avvio manuale dell'organizzatore (ordine casuale o scelto da lui).
create or replace function public.start_tournament(tid uuid, seeded uuid[])
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.tournaments%rowtype;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.organizer <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;
  perform public.tm_start(tid, seeded);
end $$;
revoke all on function public.start_tournament(uuid, uuid[]) from public, anon;
grant execute on function public.start_tournament(uuid, uuid[]) to authenticated;

-- Avvio automatico: torneo aperto, posti tutti occupati, mazzi di tutti consegnati → ordine casuale.
-- Va chiamata con la riga del torneo già bloccata (join_tournament e submit_tournament_decks lo fanno).
create or replace function public.tm_autostart(tid uuid)
returns void language plpgsql as $$
declare
  t public.tournaments%rowtype;
  total int;
  ready int;
  seeded uuid[];
begin
  select * into t from public.tournaments where id = tid;
  if not found or t.status <> 'open' then return; end if;
  select count(*), count(*) filter (where decks_submitted) into total, ready from public.tournament_players where tournament_id = tid and status = 'registered';
  if total < t.size or ready < total then return; end if;
  select array_agg(user_id order by random()) into seeded from public.tournament_players where tournament_id = tid and status = 'registered';
  perform public.tm_start(tid, seeded);
end $$;
revoke all on function public.tm_autostart(uuid) from public, anon, authenticated;

create or replace function public.join_tournament(tid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  n int;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.status <> 'open' then raise exception 'not_open'; end if;
  if t.visibility = 'private' and t.organizer <> auth.uid() and not public.is_admin()
     and not exists (select 1 from public.tournament_invites i where i.tournament_id = tid and i.user_id = auth.uid()) then
    raise exception 'invite_required';
  end if;
  if exists (select 1 from public.tournament_players where tournament_id = tid and user_id = auth.uid()) then raise exception 'already_joined'; end if;
  select count(*) into n from public.tournament_players where tournament_id = tid;
  if n >= t.size then raise exception 'full'; end if;
  insert into public.tournament_players (tournament_id, user_id) values (tid, auth.uid());
  perform public.tm_autostart(tid);
end $$;
revoke all on function public.join_tournament(uuid) from public, anon;
grant execute on function public.join_tournament(uuid) to authenticated;

create or replace function public.submit_tournament_decks(tid uuid, codes jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  expected int;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.status <> 'open' then raise exception 'not_open'; end if;
  if not exists (select 1 from public.tournament_players where tournament_id = tid and user_id = auth.uid()) then raise exception 'not_registered'; end if;
  expected := case when t.deck_mode = 'conquest' then t.conquest_decks else 1 end;
  if jsonb_typeof(codes) <> 'array' or jsonb_array_length(codes) <> expected then raise exception 'decks_count'; end if;
  insert into public.tournament_decks (tournament_id, user_id, codes) values (tid, auth.uid(), codes)
    on conflict (tournament_id, user_id) do update set codes = excluded.codes;
  update public.tournament_players set decks_submitted = true where tournament_id = tid and user_id = auth.uid();
  perform public.tm_autostart(tid);
end $$;
revoke all on function public.submit_tournament_decks(uuid, jsonb) from public, anon;
grant execute on function public.submit_tournament_decks(uuid, jsonb) to authenticated;

-- =====================================================================================================
-- 23/09/2026 — PROFILO CON UNA SUA UTILITÀ (richieste di Pierluigi, §1 punto 27.5 della KB):
--   1) le tier list create dagli utenti si salvano sul server, una per utente e per tipo, e alimentano la
--      tier list della community (/tier-list/community);
--   2) i mazzi pubblicati hanno un tetto: 5 per un utente normale, nessun tetto per Creator, Pro, Staff
--      e admin, 20 per l'Autore (27/09/2026). I mazzi privati ('draft') hanno già il loro tetto nel codice (MAX_PRIVATE_DECKS).
-- =====================================================================================================

create table if not exists public.tier_lists (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles(id) on delete cascade,
  -- le due schede del tool: Leggendarie e carte base (TierKind in src/lib/tiercode.ts)
  kind text not null check (kind in ('legendaries','cards')),
  title text not null default '' check (char_length(title) <= 60),
  -- codice TL1 (la fonte di verità, lo stesso del link e del salvataggio nel browser)
  code text not null check (char_length(code) between 3 and 4000),
  -- le fasce già aperte: {"S":["dorothy"],"A":[...]}. Serve all'aggregazione della community, che in SQL non
  -- può decifrare il codice TL1. La scrive il sito, dallo stesso codice.
  entries jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- una sola tier list per utente e per tipo (Pierluigi: "tierlist una sola per utente"): salvarne un'altra
-- sostituisce la propria, non ne aggiunge una seconda
create unique index if not exists tier_lists_owner_kind_idx on public.tier_lists (owner, kind);
create index if not exists tier_lists_status_idx on public.tier_lists (status, updated_at desc);

drop trigger if exists tier_lists_touch on public.tier_lists;
create trigger tier_lists_touch before update on public.tier_lists
  for each row execute function public.touch_updated_at();

alter table public.tier_lists enable row level security;
drop policy if exists "published tier lists are public" on public.tier_lists;
create policy "published tier lists are public" on public.tier_lists for select
  using (status = 'published' or owner = auth.uid() or public.is_admin());
drop policy if exists "users insert own tier lists" on public.tier_lists;
create policy "users insert own tier lists" on public.tier_lists for insert
  with check (owner = auth.uid());
drop policy if exists "owners update tier lists" on public.tier_lists;
create policy "owners update tier lists" on public.tier_lists for update
  using (owner = auth.uid() or public.is_admin()) with check (owner = auth.uid() or public.is_admin());
drop policy if exists "owners delete tier lists" on public.tier_lists;
create policy "owners delete tier lists" on public.tier_lists for delete
  using (owner = auth.uid() or public.is_admin());

grant select on public.tier_lists to anon, authenticated;
grant insert, update, delete on public.tier_lists to authenticated;

-- Tier list della community: la media delle fasce date dagli utenti a ogni carta (S=5 … D=1) e quante persone
-- l'hanno classificata. La fascia risultante la calcola il sito (src/lib/community/tierlists.ts), così la soglia
-- si cambia senza migrazione. Contano solo le tier list pubblicate.
create or replace view public.tier_card_scores as
  select l.kind,
         s.slug,
         round(avg(case t.key when 'S' then 5 when 'A' then 4 when 'B' then 3 when 'C' then 2 else 1 end)::numeric, 2) as avg_score,
         count(*)::int as votes
    from public.tier_lists l
    cross join lateral jsonb_each(l.entries) as t(key, value)
    cross join lateral jsonb_array_elements_text(t.value) as s(slug)
   where l.status = 'published'
     and t.key in ('S','A','B','C','D')
   group by l.kind, s.slug;
grant select on public.tier_card_scores to anon, authenticated;

-- ---------- tetto ai mazzi pubblicati (Pierluigi, 23/09/2026) ----------
-- "mazzi 5 massimo per utente normale, per staff, influencer e pro senza limiti". Dal 27/09/2026 (ruoli nuovi):
-- nessun tetto per Creator (che prende il posto dell'Influencer), Pro, Staff e admin; 20 per l'Autore ("più deck
-- pubblicabili"); 5 per la community. Gli stessi numeri stanno in src/lib/community/badges.ts (AUTHOR_DECK_LIMIT,
-- COMMUNITY_DECK_LIMIT: il test badges.test.ts li confronta). Il conto tiene insieme
-- pubblicati e nascosti (un mazzo nascosto è comunque un mazzo pubblicato dall'utente, che può rimettere online
-- quando vuole); i mazzi privati 'draft' non c'entrano e hanno il loro tetto nel sito.
-- Sta in un trigger e non solo nella Server Action perché il limite è una regola dei dati, non dell'interfaccia.
create or replace function public.max_published_decks(uid uuid)
returns int language sql stable security definer set search_path = public, pg_temp as $$
  select case when p.role = 'admin' or p.badge in ('creator','pro','staff') then 2147483647
              when p.badge = 'author' then 20
              else 5 end
    from public.profiles p where p.id = uid;
$$;

create or replace function public.enforce_deck_limit()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  used int;
  cap int;
begin
  if new.status = 'draft' then return new; end if;
  -- una modifica che non cambia né proprietario né stato non va contata di nuovo
  if tg_op = 'UPDATE' and old.status <> 'draft' and old.owner = new.owner then return new; end if;
  cap := coalesce(public.max_published_decks(new.owner), 5);
  select count(*) into used from public.community_decks
   where owner = new.owner and status <> 'draft' and id <> new.id;
  if used >= cap then raise exception 'deck_limit' using errcode = 'check_violation'; end if;
  return new;
end $$;
drop trigger if exists community_decks_limit on public.community_decks;
create trigger community_decks_limit before insert or update of status, owner on public.community_decks
  for each row execute function public.enforce_deck_limit();

-- ---------- traduzioni automatiche delle guide dei mazzi (Pierluigi, 25/09/2026) ----------
-- "I deck degli utenti vanno tradotti": l'autore scrive nella sua lingua, il sito traduce la guida nelle altre
-- lingue del sito (src/lib/community/deckTranslation.ts) e le salva qui, una per lingua, con l'impronta del testo
-- da cui sono state fatte: {"es": {"hash": "…", "at": "…", "model": "…", "guide": {"summary": "…", …}}}.
-- Le policy di community_decks valgono anche per questa colonna: la scrive il sito con la sessione del proprietario
-- (o lo staff con scripts/translate-decks.mjs). Il tetto di dimensione ferma chi volesse riempirla a mano.
alter table public.community_decks add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.community_decks drop constraint if exists community_decks_translations_check;
alter table public.community_decks add constraint community_decks_translations_check
  check (jsonb_typeof(translations) = 'object' and octet_length(translations::text) <= 120000);

-- La data di aggiornamento di un mazzo resta quella dell'autore: scrivere le traduzioni non la sposta (la scheda
-- del mazzo la mostra come "aggiornato il" e la sitemap la usa come lastmod).
create or replace function public.touch_deck_updated_at()
returns trigger language plpgsql as $$
begin
  if (to_jsonb(new) - 'translations' - 'updated_at') is distinct from (to_jsonb(old) - 'translations' - 'updated_at') then
    new.updated_at := now();
  end if;
  return new;
end $$;
drop trigger if exists community_decks_touch on public.community_decks;
create trigger community_decks_touch before update on public.community_decks
  for each row execute function public.touch_deck_updated_at();

-- ---------- spagnolo, terza lingua del sito (25/09/2026) ----------
-- La lingua di un torneo è una delle lingue del sito: il vincolo scritto nella create table sopra vale solo per un
-- database nuovo, su quello esistente si sostituisce qui (il nome è quello che Postgres dà ai check di colonna).
alter table public.tournaments drop constraint if exists tournaments_lang_check;
alter table public.tournaments add constraint tournaments_lang_check check (lang in ('en','it','es','fr'));

-- ===== 26/09/2026: CREATOR =====
-- =====================================================================================================
-- Profilo del creator (pacchetto CREATOR, 26/09/2026, richiesta di Pierluigi: "funzioni per i creator")
-- =====================================================================================================
-- Ogni iscritto può scrivere nella sua pagina pubblica /u/<nome> una bio (testo semplice, 600 caratteri dal
-- 27/09/2026, prima 280), fino a otto canali (Twitch, YouTube, X, TikTok, Instagram, Kick, Bluesky, Discord, sito web)
-- e le lingue in cui fa contenuti. Per chi ha il ruolo Creator, Autore, Pro o Staff (27/09/2026) gli stessi dati fanno la scheda
-- della directory /creators, le icone accanto al nome nei mazzi, lo stato "in diretta" su Twitch e i `sameAs`
-- della Person nei dati strutturati. Regole e forme canoniche in src/lib/community/profileLinks.ts (con test, che
-- controllano anche che le espressioni qui sotto siano uguali a quelle del codice).
--
-- ORDINE (da leggere prima di spostare questo blocco): sta DOPO la riga
--   revoke update on public.profiles from anon, authenticated;
-- (commit 6c6756d, più in alto in questo file). In Postgres un REVOKE sulla tabella toglie anche i grant per colonna:
-- se questo blocco girasse prima, il grant di bio/links/content_langs sparirebbe a ogni migrazione e il modulo di
-- /account risponderebbe "permission denied". Nessun blocco accodato dopo questo deve fare una revoke su profiles.
-- Non si lancia a pezzi nell'editor SQL: scripts/db-migrate.mjs applica tutto schema.sql ogni volta. Il test
-- src/lib/community/profileLinks.test.ts segue questo blocco dentro schema.sql e ne controlla la posizione.
--
-- Sicurezza (dopo la falla chiusa da 6c6756d): nessun grant di UPDATE sull'intera tabella. Gli utenti possono
-- cambiare SOLO bio, links e content_langs della propria riga (grant per colonna + policy "users edit own profile",
-- che resta com'è in schema.sql: using/with check auth.uid() = id); role, username, badge, discord_id, id e
-- created_at restano protetti anche dal trigger protect_profile_badge. showcase_updated_at la scrive solo il trigger.
-- Idempotente: si può rilanciare.

alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists links jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists content_langs text[] not null default '{}'::text[];
-- ultima modifica di bio, canali, lingue o tag: il lastmod di /u/<nome> e di /creators nella sitemap
alter table public.profiles add column if not exists showcase_updated_at timestamptz;

-- Un canale: esattamente {kind, url}, tipo noto, indirizzo https nella forma canonica della piattaforma (quella che
-- scrive il sito), al massimo 200 caratteri. Il sito web accetta qualsiasi dominio, ma non gli accorciatori di link, i
-- redirector e gli host delle piattaforme che hanno un tipo loro.
-- Niente sottoquery nei rami: ogni ramo del CASE si valuta solo se ci si arriva.
create or replace function public.profile_link_ok(link jsonb)
returns boolean language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case
    when jsonb_typeof(link) is distinct from 'object' then false
    when jsonb_typeof(link->'kind') is distinct from 'string' or jsonb_typeof(link->'url') is distinct from 'string' then false
    when (link - 'kind' - 'url') <> '{}'::jsonb then false
    when char_length(link->>'url') > 200 then false
    else case link->>'kind'
      when 'twitch' then (link->>'url') ~ '^https://www\.twitch\.tv/[a-z0-9_]{3,25}$'
      when 'youtube' then (link->>'url') ~ '^https://www\.youtube\.com/(@[A-Za-z0-9._-]{3,30}|channel/UC[A-Za-z0-9_-]{22}|c/[A-Za-z0-9._-]{1,100}|user/[A-Za-z0-9._-]{1,100})$'
      when 'x' then (link->>'url') ~ '^https://x\.com/[A-Za-z0-9_]{1,15}$'
      when 'tiktok' then (link->>'url') ~ '^https://www\.tiktok\.com/@[a-z0-9_.]{2,24}$'
      when 'instagram' then (link->>'url') ~ '^https://www\.instagram\.com/[a-z0-9_.]{1,30}$'
      when 'kick' then (link->>'url') ~ '^https://kick\.com/[a-z0-9_-]{3,25}$'
      when 'bluesky' then (link->>'url') ~ '^https://bsky\.app/profile/([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+|did:plc:[a-z0-9]{24})$'
      when 'discord' then (link->>'url') ~ '^https://discord\.gg/[A-Za-z0-9-]{2,32}$'
      -- sito web: qualsiasi dominio, ma non gli host delle piattaforme che hanno un tipo loro (sottodomini compresi),
      -- gli accorciatori e i redirector (per suffisso), né google.<tld>/url e /amp: WEBSITE_BLOCKED_HOST e
      -- GOOGLE_REDIRECT di profileLinks.ts, identiche (le controlla il test)
      when 'website' then (link->>'url') ~ '^https://[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,63}(/[^\s"<>\\^`{|}]*)?$'
        and coalesce(substring(link->>'url' from '^https://([^/?#]+)'), '') !~ '(^|\.)(twitch\.tv|youtube\.com|youtu\.be|x\.com|twitter\.com|tiktok\.com|instagram\.com|kick\.com|bsky\.app|discord\.com|discord\.gg|discordapp\.com|bit\.ly|bitly\.com|j\.mp|tinyurl\.com|tiny\.one|rotf\.lol|t\.co|goo\.gl|ow\.ly|is\.gd|v\.gd|buff\.ly|cutt\.ly|cutt\.us|rebrand\.ly|bl\.ink|shorturl\.at|shorturl\.com|tiny\.cc|rb\.gy|s\.id|lnkd\.in|t\.ly|adf\.ly|shorte\.st|ouo\.io|l\.facebook\.com|lm\.facebook\.com|l\.messenger\.com|out\.reddit\.com|href\.li|t\.umblr\.com|away\.vk\.com)$'
        and (link->>'url') !~ '^https://(www\.)?google(\.[a-z]{2,3}){1,2}/(url|amp)([/?#]|$)'
      else false
    end
  end
$$;

-- L'elenco dei canali: un array di al massimo otto canali validi (vuoto = nessun canale). Un canale che desse null
-- conta come non valido: bool_and ignora i null e un CHECK con risultato null passerebbe.
create or replace function public.profile_links_ok(links jsonb)
returns boolean language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case
    when jsonb_typeof(links) is distinct from 'array' then false
    when jsonb_array_length(links) > 8 then false
    else coalesce((select bool_and(coalesce(public.profile_link_ok(t.e), false)) from jsonb_array_elements(links) as t(e)), true)
  end
$$;

-- Le due funzioni girano dentro i vincoli, quindi con i privilegi di chi scrive la riga: serve EXECUTE per
-- authenticated (il modulo di /account) e service_role; anon non scrive mai i profili.
revoke all on function public.profile_link_ok(jsonb) from public, anon;
revoke all on function public.profile_links_ok(jsonb) from public, anon;
grant execute on function public.profile_link_ok(jsonb) to authenticated, service_role;
grant execute on function public.profile_links_ok(jsonb) to authenticated, service_role;

-- Vincoli: bio in testo semplice (a capo ammessi, nessun altro carattere di controllo), 1–600 caratteri o null;
-- canali validi; lingue dei contenuti fra quelle del sito, senza null.
-- La bio come la scrive `cleanBio` (profileLinks.ts), anche per chi salta il sito e scrive la riga via API: niente
-- caratteri a larghezza zero, segni di direzione del testo (con quelli un testo si legge al contrario) né BOM (la
-- classe INVISIBLE del codice, scritta con gli escape), almeno un carattere che non sia uno spazio, mai più di una
-- riga vuota di fila (tre a capo, anche con degli spazi in mezzo, allungherebbero la pagina a piacere) e, dal
-- 27/09/2026, al massimo 12 a capo in tutto (BIO_MAX_BREAKS: con 600 caratteri una colonna di righe corte sarebbe
-- lunga quanto la pagina; `cleanBio` unisce con uno spazio le righe oltre la tredicesima, quindi il sito non ne
-- scrive mai di più).
-- 27/09/2026, richiesta di Pierluigi: bio da 280 a 600 caratteri. Il limite sta QUI e non in un blocco più in basso:
-- il vincolo si toglie e si rimette a ogni migrazione, e se qui restasse 280 una bio più lunga, salvata dopo la
-- migrazione, farebbe fallire quella successiva. Le bio già scritte (al massimo 280 caratteri) rispettano il limite
-- nuovo; una bio con più di 12 a capo (possibile solo il 26-27/09, con il modulo di prima) diventa una riga sola
-- prima del vincolo, altrimenti la migrazione fallirebbe. Quando nessuna bio lo supera l'update non tocca nulla.
alter table public.profiles drop constraint if exists profiles_bio_check;
update public.profiles set bio = regexp_replace(bio, '[ \n]*\n[ \n]*', ' ', 'g')
  where bio is not null and char_length(bio) - char_length(replace(bio, chr(10), '')) > 12;
alter table public.profiles add constraint profiles_bio_check
  check (bio is null or (
    char_length(bio) between 1 and 600
    and replace(bio, chr(10), '') !~ '[[:cntrl:]]'
    and bio !~ '[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]'
    and bio ~ '[^[:space:]]'
    and strpos(replace(bio, ' ', ''), repeat(chr(10), 3)) = 0
    and char_length(bio) - char_length(replace(bio, chr(10), '')) <= 12));
alter table public.profiles drop constraint if exists profiles_links_check;
alter table public.profiles add constraint profiles_links_check check (public.profile_links_ok(links));
alter table public.profiles drop constraint if exists profiles_content_langs_check;
alter table public.profiles add constraint profiles_content_langs_check
  check (content_langs <@ array['en','it','es','fr']::text[] and cardinality(content_langs) <= 4 and array_position(content_langs, null) is null);

-- Data dell'ultima modifica della vetrina (bio, canali, lingue, tag): la scrive solo questo trigger, gli utenti non
-- hanno grant sulla colonna. Scatta anche quando lo staff cambia il tag con scripts/set-badge.mjs.
create or replace function public.touch_profile_showcase()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if (new.bio, new.links, new.content_langs, new.badge) is distinct from (old.bio, old.links, old.content_langs, old.badge) then
    new.showcase_updated_at := now();
  end if;
  return new;
end $$;
drop trigger if exists profiles_touch_showcase on public.profiles;
create trigger profiles_touch_showcase before update on public.profiles
  for each row execute function public.touch_profile_showcase();

-- L'unica scrittura concessa agli utenti sui profili: tre colonne, sulla propria riga (policy "users edit own profile").
-- MAI un grant di UPDATE sull'intera tabella: riaprirebbe role e badge (vedi 6c6756d).
grant update (bio, links, content_langs) on public.profiles to authenticated;

-- Directory /creators e rotta /api/live: leggono solo i profili con un ruolo (badge) Creator, Autore, Pro o Staff.
create index if not exists profiles_creator_badge_idx on public.profiles (badge) where badge <> 'community';

-- ===== 26/09/2026: VIDEO =====
-- =====================================================================================================
-- 26/09/2026 — VIDEO E RISORSE NEI MAZZI (pacchetto VIDEO delle funzioni per i creator, richiesta di Pierluigi)
-- Idempotente: si può rilanciare.
--
-- community_decks.videos: fino a 3 video {url, start?, title?}. `url` è l'indirizzo CANONICO scritto dal sito
--   (src/lib/videos.ts, `parseVideoUrl`): https://www.youtube.com/watch?v=<id>, https://www.youtube.com/shorts/<id>,
--   https://www.twitch.tv/videos/<numero>, https://clips.twitch.tv/<slug>; `start` = secondi dall'inizio (intero,
--   da 1 a 48 ore), facoltativo; `title` = titolo scritto dall'autore (testo semplice, 1-100 caratteri), facoltativo.
--   La vecchia colonna video_url resta: il sito la legge come primo video quando `videos` è vuota e ci scrive ancora
--   il primo video (compatibilità). Nessuna copia dei dati: il 26/09/2026 nessun mazzo pubblicato aveva un video.
-- community_decks.links: fino a 5 risorse {label, url}: etichetta di testo semplice (1-40 caratteri, niente caratteri
--   di controllo, segni di direzione del testo né invisibili), indirizzo https su un host ammesso (lista uguale a
--   LINK_HOSTS in src/lib/videos.ts, meno i sottodomini e i percorsi che reindirizzano altrove: un test di
--   videos.test.ts le confronta), niente credenziali né porte, al massimo 300 caratteri.
--
-- Permessi: community_decks ha già i grant di tabella (select ad anon e authenticated; insert, update, delete ad
-- authenticated) e le policy "users insert own decks", "owners update decks", "owners delete decks": un grant di
-- tabella vale per tutte le colonne, anche per quelle aggiunte dopo, quindi le due colonne nuove le scrive solo il
-- proprietario del mazzo (o un admin), come il resto della riga. Nessun grant nuovo. I vincoli e il trigger qui sotto
-- valgono anche per chi scrive direttamente via API con la chiave pubblica, saltando la Server Action; la pagina
-- rilegge comunque ogni voce con le regole di src/lib/videos.ts e scarta quelle che non riconosce.
-- =====================================================================================================

alter table public.community_decks add column if not exists videos jsonb not null default '[]'::jsonb;
alter table public.community_decks add column if not exists links jsonb not null default '[]'::jsonb;

-- Testo semplice di un utente (etichetta di un link, titolo di un video): da 1 a `maxlen` caratteri, niente caratteri
-- di controllo, trattino morbido, segni di direzione del testo (ALM, LRM, RLM, LRE…RLO, LRI…PDI: con quelli un nome
-- si legge al contrario) né invisibili (spazio a larghezza zero, BOM). Gli stessi che toglie `cleanText` nel sito.
create or replace function public.deck_text_ok(t text, maxlen integer)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select t is not null
     and char_length(t) between 1 and maxlen
     and t !~ '[[:cntrl:]]'
     and translate(t, U&'\00AD\061C\200B\200E\200F\202A\202B\202C\202D\202E\2066\2067\2068\2069\FEFF', '') = t;
$$;

-- Indirizzo canonico di un video (le forme che scrive parseVideoUrl in src/lib/videos.ts; un test le confronta).
-- VIDEO_URL_RE
create or replace function public.deck_video_url_ok(u text)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select u is not null
     and char_length(u) <= 300
     and u ~ '^https://(www\.youtube\.com/(watch\?v=|shorts/)[A-Za-z0-9_-]{11}|www\.twitch\.tv/videos/[0-9]{1,15}|clips\.twitch\.tv/[A-Za-z0-9_-]{1,100})$';
$$;

-- Host ammessi per le risorse, sottodomini compresi (www., m., old.reddit.com, store.steampowered.com…), meno i
-- sottodomini che reindirizzano (LINK_BLOCKED_HOSTS) e i percorsi di reindirizzamento (LINK_BLOCKED_PATH, sul
-- percorso in minuscolo); su discord.com solo inviti, canali ed eventi. Funzione pura (immutable, niente security
-- definer); `u` deve iniziare con https:// e l'host finire con / ? # o con la fine dell'indirizzo: così una porta
-- (":8080") o delle credenziali ("utente@") non passano. Liste e percorso uguali a src/lib/videos.ts.
create or replace function public.deck_link_host_ok(u text)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select coalesce((
    select exists (
             select 1
               from unnest(/* LINK_HOSTS */ array[
                 'youtube.com', 'youtu.be', 'twitch.tv', 'x.com', 'twitter.com', 'reddit.com', 'discord.gg', 'discord.com',
                 'origins-tcg.com', 'koingames.io', 'steampowered.com', 'steamcommunity.com', 'originsmeta.com',
                 'tiktok.com', 'instagram.com', 'bsky.app', 'kick.com'
               ]::text[]) as a(d)
              where s.host = a.d or right(s.host, char_length(a.d) + 1) = '.' || a.d)
       and s.host <> all (/* LINK_BLOCKED_HOSTS */ array[
             'l.instagram.com', 'out.reddit.com', 'vm.tiktok.com', 'vt.tiktok.com', 'go.bsky.app'
           ]::text[])
       and s.path !~ /* LINK_BLOCKED_PATH */ '^/(?:redirect|attribution_link|linkfilter|i/redirect)(?:/|$)|^/link/'
       and (not (s.host = 'discord.com' or right(s.host, 12) = '.discord.com') or s.path ~ '^/(invite|channels|events)/')
      from (select lower(substring(u from '^https://([A-Za-z0-9.-]+)(?:[/?#]|$)')) as host,
                   lower(coalesce(substring(u from '^https://[A-Za-z0-9.-]+(/[^?#]*)'), '/')) as path) as s
     where s.host is not null
  ), false);
$$;

-- Video di un mazzo: array di al massimo 3 oggetti con le sole chiavi url, start e title. I CASE fissano l'ordine dei
-- controlli (Postgres non garantisce quello di AND/OR), così un valore del tipo sbagliato non arriva mai a un cast.
create or replace function public.deck_videos_ok(v jsonb)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select case
    when v is null or jsonb_typeof(v) <> 'array' then false
    when jsonb_array_length(v) > 3 then false
    else not exists (
      select 1 from jsonb_array_elements(v) as e(x)
       where case
         when jsonb_typeof(x) <> 'object' then true
         when (x - 'url' - 'start' - 'title') <> '{}'::jsonb then true
         when jsonb_typeof(x -> 'url') is distinct from 'string' then true
         when not public.deck_video_url_ok(x ->> 'url') then true
         when (x ? 'title') and jsonb_typeof(x -> 'title') <> 'string' then true
         when (x ? 'title') and not public.deck_text_ok(x ->> 'title', 100) then true
         when not (x ? 'start') then false
         when jsonb_typeof(x -> 'start') <> 'number' then true
         when (x -> 'start')::numeric <> trunc((x -> 'start')::numeric) then true
         else (x -> 'start')::numeric not between 1 and 172800
       end)
  end;
$$;

-- Risorse di un mazzo: array di al massimo 5 oggetti con le sole chiavi label e url.
create or replace function public.deck_links_ok(v jsonb)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select case
    when v is null or jsonb_typeof(v) <> 'array' then false
    when jsonb_array_length(v) > 5 then false
    else not exists (
      select 1 from jsonb_array_elements(v) as e(x)
       where case
         when jsonb_typeof(x) <> 'object' then true
         when (x - 'label' - 'url') <> '{}'::jsonb then true
         when jsonb_typeof(x -> 'label') is distinct from 'string' then true
         when jsonb_typeof(x -> 'url') is distinct from 'string' then true
         when not public.deck_text_ok(x ->> 'label', 40) then true
         when char_length(x ->> 'url') > 300 then true
         else not public.deck_link_host_ok(x ->> 'url')
       end)
  end;
$$;

-- Il vecchio video_url: il sito ci scrive solo l'indirizzo canonico del primo video (o null). Un trigger e non un
-- vincolo: controlla il valore solo quando cambia (o alla creazione del mazzo), così una riga vecchia con un link
-- qualsiasi non blocca gli altri aggiornamenti (traduzioni, nascondi/ripubblica), ma via API non se ne scrive uno nuovo
-- verso un sito qualunque. La pagina mostra comunque un vecchio link solo se è su un host ammesso (`legacyResource`).
create or replace function public.guard_deck_video_url()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  if new.video_url is null then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if new.video_url is not distinct from old.video_url then
      return new;
    end if;
  end if;
  if not public.deck_video_url_ok(new.video_url) then
    raise exception 'video_url must be the canonical address of a YouTube or Twitch video' using errcode = '23514';
  end if;
  return new;
end $$;

-- Funzioni pure, ma esposte da PostgREST come /rpc/…: niente esecuzione per anon (non scrive mazzi). authenticated
-- deve poterle eseguire, perché Postgres controlla i vincoli con i permessi di chi scrive la riga.
revoke all on function public.deck_text_ok(text, integer) from public, anon;
revoke all on function public.deck_video_url_ok(text) from public, anon;
revoke all on function public.deck_link_host_ok(text) from public, anon;
revoke all on function public.deck_videos_ok(jsonb) from public, anon;
revoke all on function public.deck_links_ok(jsonb) from public, anon;
revoke all on function public.guard_deck_video_url() from public, anon, authenticated;
grant execute on function public.deck_text_ok(text, integer) to authenticated, service_role;
grant execute on function public.deck_video_url_ok(text) to authenticated, service_role;
grant execute on function public.deck_link_host_ok(text) to authenticated, service_role;
grant execute on function public.deck_videos_ok(jsonb) to authenticated, service_role;
grant execute on function public.deck_links_ok(jsonb) to authenticated, service_role;

alter table public.community_decks drop constraint if exists community_decks_videos_check;
alter table public.community_decks add constraint community_decks_videos_check check (public.deck_videos_ok(videos));
alter table public.community_decks drop constraint if exists community_decks_links_check;
alter table public.community_decks add constraint community_decks_links_check check (public.deck_links_ok(links));

-- Una versione precedente di questo file aveva un vincolo lasco su video_url (^https?://): al suo posto il trigger.
alter table public.community_decks drop constraint if exists community_decks_video_url_check;
drop trigger if exists community_decks_video_url_guard on public.community_decks;
create trigger community_decks_video_url_guard before insert or update of video_url on public.community_decks
  for each row execute function public.guard_deck_video_url();

-- ===== 26/09/2026: STREAM =====
-- Nessuna modifica al database: il pacchetto STREAM (link breve /d/<slug>, comando di chat, overlay per OBS,
-- immagine del mazzo) non ha tabelle, colonne né funzioni nuove. Il codice corto del link è lo slug del mazzo.

-- ===== 26/09/2026: STATS =====
-- =====================================================================================================
-- 26/09/2026 — STATISTICHE DEI MAZZI PER GLI AUTORI (pacchetto STATS; Pierluigi, funzioni per i creator)
--   Per ogni mazzo pubblicato e per ogni giorno (UTC): visite, copie del codice del gioco, clic sui link e video
--   avviati. Solo totali: nessun indirizzo IP, nessun id utente, nessun identificativo. Li legge l'autore del mazzo
--   (pannello "Le tue statistiche" in /account) e lo staff (admin o tag Staff, classifica dei mazzi per visite).
--   Si scrivono SOLO con la funzione bump_deck_stat (security definer), chiamata dal browser nella scheda del mazzo
--   (src/components/DeckStatsBeacon.tsx) e dal tasto di copia del codice nell'elenco /decks
--   (src/lib/community/deckStatsClient.ts): una volta per scheda del browser, per mazzo e per tipo, dopo qualche
--   secondo di pagina visibile per la visita; niente bot, niente browser dello staff, niente autore con l'accesso fatto
--   sul proprio mazzo. Sono stime: chi volesse gonfiarle con uno script può farlo fino al tetto giornaliero qui sotto.
--   Tutto è idempotente.
-- =====================================================================================================

create table if not exists public.deck_stats_daily (
  deck_id uuid not null references public.community_decks(id) on delete cascade,
  day date not null,
  views int not null default 0 check (views >= 0),
  code_copies int not null default 0 check (code_copies >= 0),
  link_clicks int not null default 0 check (link_clicks >= 0),
  video_plays int not null default 0 check (video_plays >= 0),
  primary key (deck_id, day)
);
-- la classifica dello staff legge gli ultimi 30 giorni di tutti i mazzi
create index if not exists deck_stats_daily_day_idx on public.deck_stats_daily (day);

alter table public.deck_stats_daily enable row level security;

-- Chi chiama può leggere i numeri di tutti i mazzi: admin (profiles.role) o ruolo Staff (profiles.badge).
create or replace function public.deck_stats_is_staff()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles p where p.id = auth.uid() and (p.role = 'admin' or p.badge = 'staff')
  );
$$;

-- Il mazzo è di chi chiama (anche nascosto: le statistiche restano all'autore quando lo toglie dalla vista).
create or replace function public.deck_stats_owns(did uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (select 1 from public.community_decks d where d.id = did and d.owner = auth.uid());
$$;

-- Le usano le policy qui sotto, valutate solo per authenticated (anon non ha grant sulla tabella).
revoke all on function public.deck_stats_is_staff() from public, anon;
grant execute on function public.deck_stats_is_staff() to authenticated;
revoke all on function public.deck_stats_owns(uuid) from public, anon;
grant execute on function public.deck_stats_owns(uuid) to authenticated;

-- Lettura: l'autore del mazzo, gli admin e lo Staff. `(select …)` fa valutare il controllo dello staff una volta
-- per query invece che per riga.
drop policy if exists "deck stats: owners and staff read" on public.deck_stats_daily;
create policy "deck stats: owners and staff read" on public.deck_stats_daily for select to authenticated
  using ((select public.deck_stats_is_staff()) or public.deck_stats_owns(deck_id));
-- Scrittura: nessuna policy di insert, update e delete, di proposito. Con RLS attiva anon e authenticated non
-- scrivono nulla; le righe le crea e le aggiorna solo bump_deck_stat, che gira come proprietario della tabella.

-- Supabase dà di default tutti i privilegi ad anon e authenticated sulle tabelle nuove: si tolgono e resta la sola
-- lettura per chi ha fatto l'accesso (filtrata dalla policy).
revoke all on public.deck_stats_daily from anon, authenticated;
grant select on public.deck_stats_daily to authenticated;

-- ---------- contatore: +1 al giorno di oggi (UTC) ----------
-- p_kind: 'view' (visita), 'code' (copia del codice del gioco), 'link' (clic su un link esterno o una risorsa),
-- 'video' (video avviato). Un tipo sconosciuto, uno slug lungo o un mazzo non pubblicato non fanno nulla (niente
-- errore: il browser non deve sapere perché). L'autore che guarda il proprio mazzo con l'accesso fatto non conta.
-- Tetto per contatore, mazzo e giorno: limita quanto uno script con la chiave pubblica può gonfiare un mazzo (e la
-- classifica dello staff). 2.000 è ben sopra il traffico vero di oggi, anche con una diretta Twitch che rimanda al
-- mazzo; il numero lo decide Pierluigi. Arrivato al tetto il contatore non si riscrive più: si esce prima di scrivere
-- (niente riga aggiornata a vuoto a ogni chiamata), e la clausola `where` del `do update` tiene il limite anche con due
-- chiamate nello stesso istante.
create or replace function public.bump_deck_stat(p_slug text, p_kind text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  did uuid;
  downer uuid;
  today date := (now() at time zone 'utc')::date;
  cap constant int := 2000;
begin
  if p_kind is null or p_kind not in ('view', 'code', 'link', 'video') then return; end if;
  if p_slug is null or char_length(p_slug) not between 1 and 120 then return; end if;
  select d.id, d.owner into did, downer from public.community_decks d where d.slug = p_slug and d.status = 'published';
  if did is null then return; end if;
  -- con auth.uid() nullo (visitatore anonimo) il confronto è nullo e si conta
  if downer = auth.uid() then return; end if;
  if exists (
    select 1 from public.deck_stats_daily s
    where s.deck_id = did and s.day = today
      and case p_kind when 'view' then s.views when 'code' then s.code_copies when 'link' then s.link_clicks else s.video_plays end >= cap
  ) then return; end if;
  insert into public.deck_stats_daily as s (deck_id, day, views, code_copies, link_clicks, video_plays)
  values (did, today, (p_kind = 'view')::int, (p_kind = 'code')::int, (p_kind = 'link')::int, (p_kind = 'video')::int)
  on conflict (deck_id, day) do update set
    views = s.views + excluded.views,
    code_copies = s.code_copies + excluded.code_copies,
    link_clicks = s.link_clicks + excluded.link_clicks,
    video_plays = s.video_plays + excluded.video_plays
  where case p_kind when 'view' then s.views when 'code' then s.code_copies when 'link' then s.link_clicks else s.video_plays end < cap;
end $$;
revoke all on function public.bump_deck_stat(text, text) from public;
grant execute on function public.bump_deck_stat(text, text) to anon, authenticated;

-- ===== 26/09/2026: INBOX =====
-- =====================================================================================================
-- 26/09/2026 — CASELLA MESSAGGI utente ↔ staff (pacchetto INBOX).
-- Richiesta di Pierluigi: "nella sezione profilo per ogni utente una casella messaggi, così possiamo scrivere ai
-- nostri utenti nel sito e possiamo rispondere a chi ci dà i feedback direttamente da lì".
-- Scelte prudenti (annunciate a Pierluigi):
--   - solo utente ↔ staff, niente messaggi fra utenti; l'utente può anche scrivere per primo allo staff;
--   - staff = profilo con role 'admin' o ruolo (badge) 'staff' (`is_staff()`); la casella dello staff è condivisa:
--     quello che legge uno dello staff risulta letto per tutti;
--   - avvisi solo sul sito (numero dei non letti accanto al menu dell'account); email più avanti;
--   - i messaggi restano finché esiste l'account e si cancellano con lui (on delete cascade dal profilo).
-- Sicurezza (stessa lezione del commit 6c6756d sui profili):
--   - le due tabelle si LEGGONO con le policy RLS (l'utente le sue conversazioni, lo staff tutte) e si SCRIVONO
--     solo con le RPC security definer qui sotto: niente grant di insert/update/delete ad anon e authenticated, e
--     policy restrittive che negano comunque ogni scrittura diretta, anche se un grant tornasse per sbaglio;
--   - `from_staff` lo decide il database: chi scrive è l'utente della conversazione → false, uno dello staff → true;
--   - limite di frequenza nel database: 20 messaggi l'ora per utente (200 per lo staff) e 10 conversazioni nuove al
--     giorno per utente, con un lock per utente così le richieste in parallelo non passano insieme;
--   - testo semplice: il database toglie caratteri di controllo e caratteri invisibili, rifiuta i testi senza nemmeno
--     un carattere visibile e tiene le lunghezze (oggetto 1..120 su una riga, messaggio 1..4000), con un tetto al testo
--     grezzo prima delle regex; il sito lo mostra sempre come testo, mai come HTML.
-- Idempotente: si può rilanciare (create ... if not exists, create or replace, drop policy if exists).
-- =====================================================================================================

-- ---------- chi è dello staff ----------
-- Admin (profiles.role) o ruolo (badge) 'staff' (profiles.badge): due colonne che l'utente non può cambiare
-- (revoke update on profiles e trigger protect_profile_badge, commit 6c6756d).
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles p where p.id = auth.uid() and (p.role = 'admin' or p.badge = 'staff')
  );
$$;
-- La usano le policy delle tabelle qui sotto, lette solo da `authenticated`. Se un giorno una policy su una tabella
-- leggibile da anon la usasse, va aggiunto anche anon (per anon restituisce comunque false).
revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- ---------- conversazioni ----------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  -- l'utente della conversazione; l'altra parte è sempre lo staff
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 120),
  -- chi l'ha aperta: l'utente ('user'), lo staff ('staff') o il riquadro dei feedback con l'accesso fatto ('feedback')
  origin text not null default 'user' check (origin in ('user','staff','feedback')),
  status text not null default 'open' check (status in ('open','closed')),
  -- chi ha scritto il primo messaggio (l'utente stesso o un membro dello staff); serve al limite di frequenza
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  -- ultimo messaggio di ciascuna parte: da qui si ricavano i non letti senza contare i messaggi
  last_user_message_at timestamptz,
  last_staff_message_at timestamptz,
  last_from_staff boolean not null default false,
  -- inizio dell'ultimo messaggio su una riga, per gli elenchi
  last_preview text not null default '' check (char_length(last_preview) <= 160),
  -- stato di lettura: fin dove ha letto l'utente, fin dove ha letto lo staff (uno qualsiasi dello staff)
  read_by_user_at timestamptz,
  read_by_staff_at timestamptz,
  -- colonne calcolate: PostgREST non confronta due colonne, così gli elenchi e i conteggi filtrano su un booleano
  unread_by_user boolean generated always as (
    last_staff_message_at is not null and (read_by_user_at is null or read_by_user_at < last_staff_message_at)
  ) stored,
  unread_by_staff boolean generated always as (
    last_user_message_at is not null and (read_by_staff_at is null or read_by_staff_at < last_user_message_at)
  ) stored
);
create index if not exists conversations_user_idx on public.conversations (user_id, last_message_at desc);
create index if not exists conversations_status_idx on public.conversations (status, last_message_at desc);
create index if not exists conversations_created_by_idx on public.conversations (created_by, created_at desc);
create index if not exists conversations_staff_unread_idx on public.conversations (last_message_at desc) where unread_by_staff;

-- ---------- messaggi ----------
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  -- chi ha scritto; null se l'account dello staff che l'aveva scritto non c'è più
  author_id uuid references public.profiles(id) on delete set null,
  from_staff boolean not null default false,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at, id);
create index if not exists messages_author_idx on public.messages (author_id, created_at desc);

-- ---------- RLS: letture ----------
-- auth.uid() e is_staff() dentro una (select …): Postgres li calcola una volta per richiesta, non per riga (consiglio
-- di Supabase sulle prestazioni delle policy).
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "inbox users read own conversations, staff all" on public.conversations;
create policy "inbox users read own conversations, staff all" on public.conversations for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));

drop policy if exists "inbox read messages of own conversations, staff all" on public.messages;
create policy "inbox read messages of own conversations, staff all" on public.messages for select to authenticated
  using (
    (select public.is_staff())
    or exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = (select auth.uid()))
  );

-- ---------- RLS: nessuna scrittura diretta (si scrive solo con le RPC qui sotto) ----------
-- Policy restrittive: una riga deve passarle tutte, quindi con `false` nessuna scrittura passa, qualunque policy
-- permissiva venga aggiunta in futuro. Le RPC security definer girano come proprietario delle tabelle e non le vedono.
drop policy if exists "inbox no direct insert" on public.conversations;
create policy "inbox no direct insert" on public.conversations as restrictive for insert to anon, authenticated with check (false);
drop policy if exists "inbox no direct update" on public.conversations;
create policy "inbox no direct update" on public.conversations as restrictive for update to anon, authenticated using (false) with check (false);
drop policy if exists "inbox no direct delete" on public.conversations;
create policy "inbox no direct delete" on public.conversations as restrictive for delete to anon, authenticated using (false);
drop policy if exists "inbox no direct insert" on public.messages;
create policy "inbox no direct insert" on public.messages as restrictive for insert to anon, authenticated with check (false);
drop policy if exists "inbox no direct update" on public.messages;
create policy "inbox no direct update" on public.messages as restrictive for update to anon, authenticated using (false) with check (false);
drop policy if exists "inbox no direct delete" on public.messages;
create policy "inbox no direct delete" on public.messages as restrictive for delete to anon, authenticated using (false);

-- Grant minimi: Supabase dà di default ALL ad anon e authenticated sulle tabelle nuove, qui si toglie tutto e si
-- ridà la sola lettura a chi ha fatto l'accesso (le righe le filtra la policy di select), PER COLONNA: fuori restano
-- chi dello staff ha scritto (messages.author_id), chi ha aperto la conversazione (conversations.created_by) e le date
-- di lettura e dell'ultimo messaggio di ciascuna parte (read_by_user_at, read_by_staff_at, last_user_message_at,
-- last_staff_message_at). L'utente vede le risposte firmate "Staff di OriginsMeta" e via API non può ricavare quale
-- account dello staff gli ha scritto (i profili sono pubblici) né quando lo staff ha letto. Lo staff legge gli autori
-- con la RPC inbox_message_authors qui sotto. La revoke sulla tabella toglie anche i grant per colonna, quindi il blocco
-- si può rilanciare. Le colonne concesse sono quelle che il sito legge (CONVERSATION_COLUMNS e listMessages in
-- src/lib/community/inboxQueries.ts); la policy dei messaggi legge conversations.id e user_id, concesse.
revoke all on public.conversations, public.messages from anon, authenticated;
grant select (id, user_id, subject, origin, status, created_at, updated_at, last_message_at, last_from_staff, last_preview, unread_by_user, unread_by_staff)
  on public.conversations to authenticated;
grant select (id, conversation_id, from_staff, body, created_at) on public.messages to authenticated;

-- ---------- funzioni interne (nessun client le esegue direttamente) ----------

-- Testo semplice: a capo uniformi, niente caratteri di controllo (tranne a capo e tabulazione) né caratteri invisibili
-- senza uso; una riga sola per l'oggetto, al massimo una riga vuota di fila per il messaggio. Il tetto al testo
-- grezzo (480 caratteri per l'oggetto, 16.000 per il messaggio) viene prima di ogni regex.
-- Il sito pulisce già il testo (src/lib/community/messages.ts, `plainMessage`): questa è la seconda linea, per chi
-- chiamasse le RPC direttamente con la chiave pubblica.
create or replace function public.inbox_clean(t text, single_line boolean default false)
returns text language plpgsql immutable set search_path = public, pg_temp as $$
declare
  s text := coalesce(t, '');
begin
  -- tetto al testo grezzo prima di ogni regex (quattro volte il massimo, come RAW_*_MAX di messages.ts): chi chiama la
  -- RPC direttamente non fa girare le regex su megabyte di testo
  if single_line and char_length(s) > 480 then raise exception 'subject_too_long'; end if;
  if not single_line and char_length(s) > 16000 then raise exception 'message_too_long'; end if;
  s := replace(replace(s, E'\r\n', E'\n'), E'\r', E'\n');
  -- controlli (tranne a capo e tabulazione), segni di direzione, spazio a larghezza zero, word joiner e operatori
  -- invisibili, BOM, separatore mongolo, trattino morbido (la stessa classe STRIP di messages.ts; i joiner
  -- U+200C/U+200D restano per le emoji composte)
  s := regexp_replace(s, '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F\u00AD\u061C\u180E\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]', '', 'g');
  if single_line then
    s := regexp_replace(s, '\s+', ' ', 'g');
  else
    s := regexp_replace(s, '[ \t]+\n', E'\n', 'g');
    s := regexp_replace(s, '\n{3,}', E'\n\n', 'g');
  end if;
  return btrim(s, E' \t\n');
end $$;
revoke all on function public.inbox_clean(text, boolean) from public, anon, authenticated;

-- Un testo senza nemmeno un carattere visibile (solo spazi di ogni tipo, joiner, riempitivi hangul, braille vuoto…) è
-- vuoto: stesso elenco di VISIBLE in messages.ts (`hasVisibleText`).
create or replace function public.inbox_blank(t text)
returns boolean language sql immutable set search_path = public, pg_temp as $$
  select coalesce(t, '') !~ '[^[:space:]\u00A0\u00AD\u034F\u061C\u115F\u1160\u1680\u17B4\u17B5\u180E\u2000-\u200F\u2028\u2029\u202A-\u202F\u205F-\u2064\u2066-\u2069\u2800\u3000\u3164\uFEFF\uFFA0]';
$$;
revoke all on function public.inbox_blank(text) from public, anon, authenticated;

-- Limite di frequenza di chi scrive: 20 messaggi l'ora (200 per lo staff, che risponde a molti) e, per le
-- conversazioni nuove aperte da un utente, 10 al giorno. Il lock per utente (fino alla fine della transazione)
-- mette in fila le richieste parallele dello stesso utente, così non passano il limite tutte insieme.
create or replace function public.inbox_rate_check(uid uuid, staff boolean, new_thread boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  n int;
begin
  perform pg_advisory_xact_lock(hashtext('om_inbox:' || uid::text));
  select count(*) into n from public.messages where author_id = uid and created_at > now() - interval '1 hour';
  if n >= (case when staff then 200 else 20 end) then raise exception 'too_many_messages'; end if;
  if new_thread and not staff then
    select count(*) into n from public.conversations where created_by = uid and created_at > now() - interval '1 day';
    if n >= 10 then raise exception 'too_many_conversations'; end if;
  end if;
end $$;
revoke all on function public.inbox_rate_check(uuid, boolean, boolean) from public, anon, authenticated;

-- ---------- RPC per il sito (solo authenticated) ----------
-- Errori con raise exception '<codice>': li traduce `inboxErrorCode` in src/lib/community/messages.ts.

-- Un utente scrive allo staff (conversazione nuova). `via_feedback` = arriva dal riquadro dei feedback con l'accesso
-- fatto (/api/feedback): stessa cosa, con origin 'feedback'. Restituisce l'id della conversazione.
create or replace function public.inbox_start(topic text, content text, via_feedback boolean default false)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := auth.uid();
  subj text := public.inbox_clean(topic, true);
  clean text := public.inbox_clean(content);
  cid uuid;
begin
  if me is null then raise exception 'not_logged_in'; end if;
  if public.inbox_blank(subj) then raise exception 'empty_subject'; end if;
  if char_length(subj) > 120 then raise exception 'subject_too_long'; end if;
  if public.inbox_blank(clean) then raise exception 'empty_message'; end if;
  if char_length(clean) > 4000 then raise exception 'message_too_long'; end if;
  perform public.inbox_rate_check(me, false, true);
  insert into public.conversations (user_id, subject, origin, created_by, last_message_at, last_user_message_at, last_from_staff, last_preview)
    values (me, subj, case when coalesce(via_feedback, false) then 'feedback' else 'user' end, me, now(), now(), false,
            left(regexp_replace(clean, '\s+', ' ', 'g'), 160))
    returning id into cid;
  insert into public.messages (conversation_id, author_id, from_staff, body) values (cid, me, false, clean);
  return cid;
end $$;
revoke all on function public.inbox_start(text, text, boolean) from public, anon;
grant execute on function public.inbox_start(text, text, boolean) to authenticated;

-- Lo staff scrive per primo a un utente, cercato per nome utente (senza @, maiuscole indifferenti).
create or replace function public.inbox_staff_start(uname text, topic text, content text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := auth.uid();
  subj text := public.inbox_clean(topic, true);
  clean text := public.inbox_clean(content);
  target uuid;
  cid uuid;
begin
  if me is null then raise exception 'not_logged_in'; end if;
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if public.inbox_blank(subj) then raise exception 'empty_subject'; end if;
  if char_length(subj) > 120 then raise exception 'subject_too_long'; end if;
  if public.inbox_blank(clean) then raise exception 'empty_message'; end if;
  if char_length(clean) > 4000 then raise exception 'message_too_long'; end if;
  if char_length(coalesce(uname, '')) > 200 then raise exception 'user_not_found'; end if;
  select p.id into target from public.profiles p where lower(p.username) = lower(btrim(replace(coalesce(uname, ''), '@', ''))) limit 1;
  if target is null then raise exception 'user_not_found'; end if;
  if target = me then raise exception 'self'; end if;
  perform public.inbox_rate_check(me, true, true);
  insert into public.conversations (user_id, subject, origin, created_by, last_message_at, last_staff_message_at, last_from_staff, last_preview)
    values (target, subj, 'staff', me, now(), now(), true, left(regexp_replace(clean, '\s+', ' ', 'g'), 160))
    returning id into cid;
  insert into public.messages (conversation_id, author_id, from_staff, body) values (cid, me, true, clean);
  return cid;
end $$;
revoke all on function public.inbox_staff_start(text, text, text) from public, anon;
grant execute on function public.inbox_staff_start(text, text, text) to authenticated;

-- Risposta in una conversazione. from_staff lo decide il database: l'utente della conversazione scrive come utente,
-- uno dello staff come staff, chiunque altro riceve 'not_found' (non si rivela che la conversazione esiste).
-- Un messaggio nuovo riapre una conversazione chiusa. Restituisce from_staff (il sito avvisa lo staff su Discord solo
-- per i messaggi degli utenti).
create or replace function public.inbox_send(cid uuid, content text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := auth.uid();
  clean text := public.inbox_clean(content);
  c public.conversations%rowtype;
  staff boolean;
begin
  if me is null then raise exception 'not_logged_in'; end if;
  if public.inbox_blank(clean) then raise exception 'empty_message'; end if;
  if char_length(clean) > 4000 then raise exception 'message_too_long'; end if;
  select * into c from public.conversations where id = cid for update;
  if not found then raise exception 'not_found'; end if;
  if c.user_id = me then
    staff := false;
  elsif public.is_staff() then
    staff := true;
  else
    raise exception 'not_found';
  end if;
  perform public.inbox_rate_check(me, staff, false);
  insert into public.messages (conversation_id, author_id, from_staff, body) values (cid, me, staff, clean);
  update public.conversations set
    status = 'open',
    updated_at = now(),
    last_message_at = greatest(last_message_at, now()),
    last_user_message_at = case when staff then last_user_message_at else greatest(last_user_message_at, now()) end,
    last_staff_message_at = case when staff then greatest(last_staff_message_at, now()) else last_staff_message_at end,
    last_from_staff = staff,
    last_preview = left(regexp_replace(clean, '\s+', ' ', 'g'), 160)
  where id = cid;
  return staff;
end $$;
revoke all on function public.inbox_send(uuid, text) from public, anon;
grant execute on function public.inbox_send(uuid, text) to authenticated;

-- Segna come letta una conversazione fino a `seen`, la data dell'ultimo messaggio mostrato nella pagina: un messaggio
-- arrivato dopo (mentre la pagina era aperta) resta da leggere. L'utente segna la sua lettura, lo staff quella dello
-- staff. Restituisce true solo se la conversazione era da leggere e DOPO risulta letta: se `seen` è precedente
-- all'ultimo messaggio, resta da leggere e la risposta è false (il sito non conta una lettura che non c'è stata).
create or replace function public.inbox_mark_read(cid uuid, seen timestamptz default null)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := auth.uid();
  c public.conversations%rowtype;
  upto timestamptz := least(coalesce(seen, now()), now());
  done boolean;
begin
  if me is null then raise exception 'not_logged_in'; end if;
  select * into c from public.conversations where id = cid for update;
  if not found then raise exception 'not_found'; end if;
  if c.user_id = me then
    if not c.unread_by_user then return false; end if;
    update public.conversations set read_by_user_at = greatest(read_by_user_at, upto) where id = cid
      returning not unread_by_user into done;
  elsif public.is_staff() then
    if not c.unread_by_staff then return false; end if;
    update public.conversations set read_by_staff_at = greatest(read_by_staff_at, upto) where id = cid
      returning not unread_by_staff into done;
  else
    raise exception 'not_found';
  end if;
  return coalesce(done, false);
end $$;
revoke all on function public.inbox_mark_read(uuid, timestamptz) from public, anon;
grant execute on function public.inbox_mark_read(uuid, timestamptz) to authenticated;

-- Chiusura e riapertura: solo lo staff.
create or replace function public.inbox_set_status(cid uuid, new_status text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if new_status is null or new_status not in ('open', 'closed') then raise exception 'bad_status'; end if;
  update public.conversations set status = new_status, updated_at = now() where id = cid;
  if not found then raise exception 'not_found'; end if;
end $$;
revoke all on function public.inbox_set_status(uuid, text) from public, anon;
grant execute on function public.inbox_set_status(uuid, text) to authenticated;

-- Numero dei non letti per il menu dell'account (rotta /api/inbox/status): conversazioni con messaggi dello staff da
-- leggere per l'utente; per lo staff anche le conversazioni degli altri con messaggi degli utenti da leggere.
create or replace function public.inbox_status()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  me uuid := auth.uid();
  staff boolean;
begin
  if me is null then return jsonb_build_object('unread', 0, 'staff', false, 'staff_unread', 0); end if;
  staff := public.is_staff();
  return jsonb_build_object(
    'unread', (select count(*) from public.conversations c where c.user_id = me and c.unread_by_user),
    'staff', staff,
    'staff_unread', case when staff then (select count(*) from public.conversations c where c.unread_by_staff and c.user_id <> me) else 0 end
  );
end $$;
revoke all on function public.inbox_status() from public, anon;
grant execute on function public.inbox_status() to authenticated;

-- Chi ha scritto i messaggi di una conversazione, SOLO per lo staff (vista dello staff: nome di chi ha risposto, "Tu"
-- sui propri messaggi). Gli utenti non hanno la colonna author_id (grant per colonna qui sopra) e qui ricevono zero
-- righe. Il sito legge poi i profili pubblici degli autori (`listMessages` in src/lib/community/inboxQueries.ts).
create or replace function public.inbox_message_authors(cid uuid)
returns table (message_id bigint, author_id uuid)
language sql stable security definer set search_path = public, pg_temp as $$
  select m.id, m.author_id
    from public.messages m
   where m.conversation_id = cid and m.author_id is not null and public.is_staff();
$$;
revoke all on function public.inbox_message_authors(uuid) from public, anon;
grant execute on function public.inbox_message_authors(uuid) to authenticated;

-- ===== 27/09/2026: TAG E BIO =====
-- =====================================================================================================
-- Ruoli e tag dei profili, bio più lunga (27/09/2026, decisioni di Pierluigi)
-- =====================================================================================================
-- "Ti ripeto i ruoli e tag: 1) Staff → tag Staff; 2) Creator → tag Creator; 3) Autore → tag Autore; 4) Community →
-- tag Community"; "Pro rimane, Influencer scompare"; l'Autore ha "più deck pubblicabili e se vuole può creare guide".
-- Il 25/09 l'id `creator` era stato rinominato "Autore" sul sito: da oggi `creator` è il Creator (gradiente stile
-- Instagram, i permessi che erano dell'Influencer) e l'Autore ha un id suo, `author`.
--
--   tag         tetto ai mazzi pubblicati   calendario e copertina dei tornei   vetrina /u e directory /creators
--   staff       nessuno                     sì                                  sì
--   creator     nessuno                     sì                                  sì
--   pro         nessuno                     sì                                  sì
--   author      20                          no                                  sì
--   community   5                           no                                  no
--   (un admin, role = 'admin', ha i permessi dello Staff qualunque sia il suo tag)
--
-- Le modifiche NON stanno tutte qui, e di proposito: il vincolo del tag (`profiles_badge_check`, con il passaggio
-- degli Influencer a Creator subito prima) e quello della bio (`profiles_bio_check`, 600 caratteri e al massimo
-- 12 a capo) si tolgono e si rimettono a ogni migrazione nel punto in cui sono nati: se lì restasse la versione
-- vecchia, un profilo scritto con le regole nuove farebbe fallire la migrazione successiva. Per coerenza sono
-- aggiornate nel loro punto anche le funzioni che elencano i tag: `protect_tournament_listing` (due definizioni,
-- vale la seconda), la policy "badged users upload tournament covers" e `max_published_decks`. Tutto idempotente.
-- Le stesse regole stanno nel codice in src/lib/community/badges.ts (tetti, permessi, `canPublishGuides` per la
-- pubblicazione diretta delle guide, prevista e non ancora costruita) e in profileLinks.ts (BIO_MAX, BIO_MAX_BREAKS):
-- badges.test.ts e profileLinks.test.ts controllano che coincidano con questo file.
-- Il tag lo cambia solo lo staff con `node scripts/set-badge.mjs <utente> <community|creator|author|pro|staff>`.

-- Le regole scritte anche nel catalogo del database, per chi lo apre dalla dashboard di Supabase.
comment on column public.profiles.badge is 'Tag assegnato dallo staff (scripts/set-badge.mjs): community, creator, author (Autore), pro, staff. Influencer tolto il 27/09/2026 (diventato creator). Permessi in src/lib/community/badges.ts.';
comment on column public.profiles.bio is 'Bio del profilo pubblico: testo semplice, 1-600 caratteri, al massimo 12 a capo (27/09/2026; regole in src/lib/community/profileLinks.ts).';
comment on function public.max_published_decks(uuid) is 'Tetto ai mazzi pubblicati: nessuno per creator, pro, staff e admin, 20 per author, 5 per community (27/09/2026).';

-- ===== 27/09/2026: VETRINA =====
-- =====================================================================================================
-- Vetrina dei profili (pacchetto VETRINA, 27/09/2026; Pierluigi: "OK A TUTTO, OTTIMO!!" alle proposte per i profili)
-- =====================================================================================================
-- Da accodare in fondo a supabase/schema.sql (scripts/db-migrate.mjs applica tutto il file ogni volta: ogni riga qui
-- sotto è idempotente). Regole e test nel codice: src/lib/community/showcase.ts e showcase.test.ts, che confronta
-- questo blocco con il codice (elenchi, limiti, espressioni).
--
-- Che cosa aggiunge:
--   - per TUTTI gli iscritti la foto profilo caricata dal sito (`avatar_path`, file nel bucket `profile-media`,
--     cartella <id>/avatar, 1 MB, png/jpeg/webp). Un trigger tiene `avatar_url` allineata: con una foto caricata diventa
--     l'indirizzo pubblico del file, togliendola torna quella di Discord (dai metadati dell'accesso, solo se è davvero
--     un indirizzo di Discord). Così ogni lettura che già chiede `avatar_url` (mazzi, tornei, header, directory) mostra
--     la foto nuova senza cambiare le query, e prima della migrazione nulla cambia;
--   - per i ruoli con vetrina (Creator, Autore, Pro, Staff: SHOWCASE_BADGES in src/lib/community/badges.ts) i campi
--     della vetrina su /u/<nome>: copertina (uno degli 8 sfondi preimpostati del sito oppure un'immagine caricata in
--     <id>/cover, 2 MB), colore d'accento, frase di presentazione (80 caratteri), Leggendaria del cuore (slug controllato
--     dal sito contro i dati delle carte), mazzo in evidenza (uno dei SUOI mazzi pubblicati), video in evidenza (le
--     forme canoniche di deck_video_url_ok, blocco VIDEO), orari delle dirette (fino a 7 voci) con il fuso IANA.
--
-- ORDINE: questo blocco sta DOPO `revoke update on public.profiles from anon, authenticated;` (commit 6c6756d) e dopo il
-- blocco CREATOR. Il grant qui sotto è per colonna, come quello di bio/links/content_langs: un REVOKE sulla tabella lo
-- cancellerebbe, quindi nessun blocco accodato dopo questo deve fare una revoke su profiles. scripts/schema-guard.mjs
-- conosce questo grant (PROFILES_GRANTS) e rifiuta qualsiasi altra grant su public.profiles.
--
-- Sicurezza:
--   - grant di UPDATE solo sulle colonne nuove che l'utente cambia dal sito (mai sull'intera tabella);
--   - trigger `guard_profile_vetrina` (con i privilegi di chi salva, search_path fissato): i campi della vetrina li
--     imposta solo chi ha un ruolo con vetrina (svuotarli si può sempre; script e admin passano), il mazzo in evidenza
--     dev'essere suo e pubblicato, le immagini devono esistere nella sua cartella del bucket con tipo e peso giusti.
--     L'unica funzione security definer è `profile_discord_avatar` (legge auth.users), limitata al proprio profilo;
--   - bucket `profile-media` pubblico in lettura (indirizzi pubblici), scrittura solo nella propria cartella, solo
--     png/jpeg/webp fino a 2 MB (limite del bucket: lo Storage prova la policy di caricamento PRIMA di conoscere il
--     peso del file, quindi il peso per tipo, 1 MB per la foto, lo controlla il trigger quando si salva), la copertina
--     solo per i ruoli con vetrina, un tetto di 12 file per utente (morbido: vale al momento della prova, non contro
--     caricamenti lanciati tutti insieme), e il file in uso non si cancella (niente immagini rotte sul profilo);
--   - lo staff toglie foto, copertina e frase di un utente con `node scripts/clear-profile-media.mjs` (README, "Vetrina
--     dei profili e foto caricate"); un admin vede e cancella dal sito i file di tutti, mai quelli in uso.
-- =====================================================================================================

alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists cover_preset text;
alter table public.profiles add column if not exists cover_path text;
-- sfondo della pagina del profilo (richiesta di Pierluigi del 27/09/2026: "mi va bene che ci sia una copertina ma ci deve
-- essere anche lo sfondo"): uno dei motivi della copertina o un'immagine caricata (<id>/background/<file>, 2 MB)
alter table public.profiles add column if not exists background_preset text;
alter table public.profiles add column if not exists background_path text;
alter table public.profiles add column if not exists accent text;
alter table public.profiles add column if not exists tagline text;
alter table public.profiles add column if not exists favorite_legendary text;
-- uno dei suoi mazzi pubblicati; se il mazzo viene eliminato il campo si svuota da solo
alter table public.profiles add column if not exists featured_deck uuid references public.community_decks(id) on delete set null;
alter table public.profiles add column if not exists featured_video text;
-- orari delle dirette: [{"day": 0-6 (0 = lunedì), "time": "HH:MM", "minutes": 15-720 facoltativo}], ora del fuso schedule_tz
alter table public.profiles add column if not exists schedule jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists schedule_tz text;
-- ultime modifiche della foto e della vetrina: le scrive solo il trigger qui sotto (nessun grant). Servono ai limiti di
-- frequenza dei due moduli di /account, separati fra loro e da quello di bio e canali (showcase_updated_at)
alter table public.profiles add column if not exists avatar_updated_at timestamptz;
alter table public.profiles add column if not exists vetrina_updated_at timestamptz;

create index if not exists profiles_featured_deck_idx on public.profiles (featured_deck) where featured_deck is not null;

-- Una voce degli orari: esattamente {day, time} più minutes facoltativo. I CASE fissano l'ordine dei controlli (Postgres
-- non garantisce quello di AND/OR): un valore del tipo sbagliato non arriva mai a un cast.
create or replace function public.profile_schedule_entry_ok(e jsonb)
returns boolean language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case
    when jsonb_typeof(e) is distinct from 'object' then false
    when (e - 'day' - 'time' - 'minutes') <> '{}'::jsonb then false
    when jsonb_typeof(e->'day') is distinct from 'number' or jsonb_typeof(e->'time') is distinct from 'string' then false
    when (e->>'day') !~ '^[0-6]$' then false
    when (e->>'time') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then false
    when not (e ? 'minutes') then true
    when jsonb_typeof(e->'minutes') is distinct from 'number' then false
    when (e->>'minutes') !~ '^[0-9]{1,3}$' then false
    else (e->>'minutes')::integer between 15 and 720
  end
$$;

-- Gli orari: un array di al massimo 7 voci valide (vuoto = nessun orario). Una voce che desse null conta come non
-- valida: bool_and ignora i null e un CHECK con risultato null passerebbe.
create or replace function public.profile_schedule_ok(s jsonb)
returns boolean language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case
    when jsonb_typeof(s) is distinct from 'array' then false
    when jsonb_array_length(s) > 7 then false
    else coalesce((select bool_and(coalesce(public.profile_schedule_entry_ok(t.e), false)) from jsonb_array_elements(s) as t(e)), true)
  end
$$;

-- Girano dentro i vincoli, con i privilegi di chi scrive la riga: EXECUTE per authenticated e service_role.
revoke all on function public.profile_schedule_entry_ok(jsonb) from public, anon;
revoke all on function public.profile_schedule_ok(jsonb) from public, anon;
grant execute on function public.profile_schedule_entry_ok(jsonb) to authenticated, service_role;
grant execute on function public.profile_schedule_ok(jsonb) to authenticated, service_role;

-- Vincoli (tolti e rimessi: idempotenti). Le espressioni sono quelle di showcase.ts (MEDIA_FILE_RE, COVER_PRESETS,
-- ACCENTS, TAGLINE_MAX, SCHEDULE_MAX…): il test le confronta.
alter table public.profiles drop constraint if exists profiles_avatar_path_check;
alter table public.profiles add constraint profiles_avatar_path_check
  check (avatar_path is null or avatar_path ~ ('^' || id::text || '/avatar/[A-Za-z0-9_-]{8,64}\.(png|jpg|jpeg|webp)$'));
alter table public.profiles drop constraint if exists profiles_cover_path_check;
alter table public.profiles add constraint profiles_cover_path_check
  check (cover_path is null or cover_path ~ ('^' || id::text || '/cover/[A-Za-z0-9_-]{8,64}\.(png|jpg|jpeg|webp)$'));
alter table public.profiles drop constraint if exists profiles_cover_preset_check;
alter table public.profiles add constraint profiles_cover_preset_check
  check (cover_preset is null or cover_preset in ('aurora', 'mint-tide', 'sky-crystal', 'gold-stars', 'crimson-rays', 'violet-nebula', 'night-grid', 'sunset'));
alter table public.profiles drop constraint if exists profiles_background_path_check;
alter table public.profiles add constraint profiles_background_path_check
  check (background_path is null or background_path ~ ('^' || id::text || '/background/[A-Za-z0-9_-]{8,64}\.(png|jpg|jpeg|webp)$'));
alter table public.profiles drop constraint if exists profiles_background_preset_check;
alter table public.profiles add constraint profiles_background_preset_check
  check (background_preset is null or background_preset in ('aurora', 'mint-tide', 'sky-crystal', 'gold-stars', 'crimson-rays', 'violet-nebula', 'night-grid', 'sunset'));
alter table public.profiles drop constraint if exists profiles_accent_check;
alter table public.profiles add constraint profiles_accent_check
  check (accent is null or accent in ('sky', 'mint', 'gold', 'crimson', 'violet', 'coral', 'green', 'peach'));
-- frase di presentazione: testo semplice su una riga (deck_text_ok del blocco VIDEO: niente caratteri di controllo, a
-- capo compresi, né invisibili), 1-80 caratteri, senza spazi in testa o in coda
alter table public.profiles drop constraint if exists profiles_tagline_check;
alter table public.profiles add constraint profiles_tagline_check
  check (tagline is null or (public.deck_text_ok(tagline, 80) and tagline ~ '[^[:space:]]' and tagline = btrim(tagline)));
alter table public.profiles drop constraint if exists profiles_favorite_legendary_check;
alter table public.profiles add constraint profiles_favorite_legendary_check
  check (favorite_legendary is null or (char_length(favorite_legendary) <= 60 and favorite_legendary ~ '^[a-z0-9]+(-[a-z0-9]+)*$'));
alter table public.profiles drop constraint if exists profiles_featured_video_check;
alter table public.profiles add constraint profiles_featured_video_check
  check (featured_video is null or public.deck_video_url_ok(featured_video));
-- orari validi, e il fuso se e solo se ci sono orari (un nome IANA ben formato: l'elenco fra cui scegliere lo tiene il
-- sito). Senza orari niente fuso: la colonna è pubblica e il fuso direbbe dove vive chi non pubblica nessun orario.
alter table public.profiles drop constraint if exists profiles_schedule_check;
alter table public.profiles add constraint profiles_schedule_check
  check (public.profile_schedule_ok(schedule) and ((schedule = '[]'::jsonb) = (schedule_tz is null)));
alter table public.profiles drop constraint if exists profiles_schedule_tz_check;
alter table public.profiles add constraint profiles_schedule_tz_check
  check (schedule_tz is null or (char_length(schedule_tz) <= 64 and schedule_tz ~ '^(UTC|[A-Z][A-Za-z_]+(/[A-Za-z0-9_+-]+){1,2})$'));

-- Indirizzo pubblico di un file del bucket profile-media: lo stesso di `mediaPublicUrl` in showcase.ts con l'URL del
-- progetto di src/lib/supabase/env.ts (il test li confronta). Se un giorno il progetto Supabase cambia, cambia qui.
create or replace function public.profile_media_url(p text)
returns text language sql immutable set search_path = pg_catalog, pg_temp as $$
  select 'https://obpnprlzxrlbvncpqlpq.supabase.co/storage/v1/object/public/profile-media/' || p
$$;

-- Il file c'è nel bucket, con un tipo ammesso e al massimo `max_bytes` (quando lo Storage li ha scritti nei metadati).
-- Gira con i privilegi di chi chiama (il trigger qui sotto, cioè l'utente che salva): vede i file della sua cartella
-- grazie alla policy "profile media owners read", nessun altro. Niente security definer: non serve saltare la RLS.
create or replace function public.profile_media_ok(p text, max_bytes bigint)
returns boolean language sql stable set search_path = public, pg_temp as $$
  select exists (
    select 1 from storage.objects o
     where o.bucket_id = 'profile-media'
       and o.name = p
       and (o.metadata->>'size' is null or (o.metadata->>'size')::bigint <= max_bytes)
       and (o.metadata->>'mimetype' is null or o.metadata->>'mimetype' in ('image/png', 'image/jpeg', 'image/webp')))
$$;

-- Quanti file ha l'utente collegato nel bucket (policy di caricamento: al massimo 12). Anche questa con i privilegi di
-- chi carica, e solo la sua cartella. Tetto morbido: lo Storage prova la policy in una transazione che annulla subito e
-- scrive poi il file con i suoi privilegi, quindi caricamenti lanciati tutti insieme vedono lo stesso conteggio (un
-- lucchetto qui non servirebbe: finirebbe con la transazione di prova). Il sito carica un file alla volta e pulisce la
-- cartella; i file mai usati li trova e li toglie `node scripts/clear-profile-media.mjs --orphans`.
create or replace function public.profile_media_count()
returns integer language sql stable set search_path = public, pg_temp as $$
  select count(*)::integer from storage.objects o
   where o.bucket_id = 'profile-media' and (storage.foldername(o.name))[1] = auth.uid()::text
$$;

-- La foto di Discord di un profilo, dai metadati dell'accesso (auth.users, che l'utente non legge: per questo è l'unica
-- security definer del blocco). Solo per il proprio profilo (o per un admin, o per uno script con connessione diretta),
-- e solo se è davvero un indirizzo di Discord: quei metadati l'utente li può cambiare via API.
create or replace function public.profile_discord_avatar(uid uuid)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select case
    when auth.uid() is not null and auth.uid() <> uid and not public.is_admin() then null
    else (select case when m ~ '^https://(cdn\.discordapp\.com|media\.discordapp\.net)/[A-Za-z0-9/_.-]{1,255}(\?size=[0-9]{1,4})?$' then m end
            from (select u.raw_user_meta_data->>'avatar_url' as m from auth.users u where u.id = uid) as x)
  end
$$;

-- Le chiamano il trigger (con i privilegi dell'utente che salva) e la policy di caricamento: EXECUTE per authenticated.
revoke all on function public.profile_media_url(text) from public, anon;
revoke all on function public.profile_media_ok(text, bigint) from public, anon;
revoke all on function public.profile_media_count() from public, anon;
revoke all on function public.profile_discord_avatar(uuid) from public, anon;
grant execute on function public.profile_media_url(text) to authenticated, service_role;
grant execute on function public.profile_media_ok(text, bigint) to authenticated, service_role;
grant execute on function public.profile_media_count() to authenticated, service_role;
grant execute on function public.profile_discord_avatar(uuid) to authenticated, service_role;

-- I controlli che un vincolo non può fare, con i privilegi di chi salva (niente security definer: legge i mazzi pubblicati
-- e i file della propria cartella, che vede già). Script con connessione diretta (auth.uid() nullo) e admin passano il
-- controllo del ruolo; mazzo e immagini si controllano per tutti.
create or replace function public.guard_profile_vetrina()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  -- 1) i campi della vetrina li imposta solo chi ha un ruolo con vetrina; svuotarli si può sempre (anche dopo aver
  --    perso il ruolo). avatar_path no: la foto profilo è di tutti.
  if auth.uid() is not null and not public.is_admin()
     and old.badge not in ('creator', 'author', 'pro', 'staff') and (
          (new.cover_preset is not null and new.cover_preset is distinct from old.cover_preset)
       or (new.cover_path is not null and new.cover_path is distinct from old.cover_path)
       or (new.background_preset is not null and new.background_preset is distinct from old.background_preset)
       or (new.background_path is not null and new.background_path is distinct from old.background_path)
       or (new.accent is not null and new.accent is distinct from old.accent)
       or (new.tagline is not null and new.tagline is distinct from old.tagline)
       or (new.favorite_legendary is not null and new.favorite_legendary is distinct from old.favorite_legendary)
       or (new.featured_deck is not null and new.featured_deck is distinct from old.featured_deck)
       or (new.featured_video is not null and new.featured_video is distinct from old.featured_video)
       or (new.schedule <> '[]'::jsonb and new.schedule is distinct from old.schedule)
       or (new.schedule_tz is not null and new.schedule_tz is distinct from old.schedule_tz)) then
    raise exception 'showcase fields are reserved to showcase roles';
  end if;

  -- 2) mazzo in evidenza: uno dei SUOI mazzi pubblicati
  if new.featured_deck is not null and new.featured_deck is distinct from old.featured_deck
     and not exists (select 1 from public.community_decks d where d.id = new.featured_deck and d.owner = new.id and d.status = 'published') then
    raise exception 'featured deck must be one of your published decks';
  end if;

  -- 3) copertina caricata: il file c'è, nella sua cartella (vincolo), con tipo e peso ammessi
  if new.cover_path is not null and new.cover_path is distinct from old.cover_path
     and not public.profile_media_ok(new.cover_path, 2097152) then
    raise exception 'cover image not found or not allowed';
  end if;
  -- 3b) sfondo caricato (27/09/2026): stesse regole della copertina
  if new.background_path is not null and new.background_path is distinct from old.background_path
     and not public.profile_media_ok(new.background_path, 2097152) then
    raise exception 'background image not found or not allowed';
  end if;

  -- 4) foto profilo: controllo del file e avatar_url allineata (caricata → indirizzo del file; tolta → Discord, o nessuna)
  if new.avatar_path is distinct from old.avatar_path then
    if new.avatar_path is not null then
      if not public.profile_media_ok(new.avatar_path, 1048576) then
        raise exception 'avatar image not found or not allowed';
      end if;
      new.avatar_url := public.profile_media_url(new.avatar_path);
    else
      new.avatar_url := public.profile_discord_avatar(new.id);
    end if;
  end if;

  -- 5) date delle modifiche: avatar_updated_at e vetrina_updated_at per i limiti di frequenza dei due moduli di /account;
  --    showcase_updated_at (lastmod di /u/<nome> nella sitemap, come touch_profile_showcase del blocco CREATOR) per la
  --    vetrina e, solo per i ruoli con vetrina, per la foto: le foto degli iscritti community non riempiono la lettura
  --    delle date della sitemap.
  if new.avatar_path is distinct from old.avatar_path then
    new.avatar_updated_at := now();
    if new.badge in ('creator', 'author', 'pro', 'staff') then
      new.showcase_updated_at := now();
    end if;
  end if;
  if (new.cover_preset, new.cover_path, new.background_preset, new.background_path, new.accent, new.tagline, new.favorite_legendary,
      new.featured_deck, new.featured_video, new.schedule, new.schedule_tz)
     is distinct from
     (old.cover_preset, old.cover_path, old.background_preset, old.background_path, old.accent, old.tagline, old.favorite_legendary,
      old.featured_deck, old.featured_video, old.schedule, old.schedule_tz) then
    new.vetrina_updated_at := now();
    new.showcase_updated_at := now();
  end if;
  return new;
end $$;
-- la funzione di un trigger non si chiama da sola: niente EXECUTE per nessuno (il trigger scatta lo stesso)
revoke all on function public.guard_profile_vetrina() from public, anon, authenticated;
drop trigger if exists profiles_guard_vetrina on public.profiles;
create trigger profiles_guard_vetrina before update on public.profiles
  for each row execute function public.guard_profile_vetrina();

-- Le sole colonne nuove che l'utente cambia dal sito, sulla propria riga (policy "users edit own profile"). MAI un grant
-- di UPDATE sull'intera tabella: riaprirebbe role e badge (6c6756d).
grant update (avatar_path, cover_preset, cover_path, background_preset, background_path, accent, tagline, favorite_legendary, featured_deck, featured_video, schedule, schedule_tz) on public.profiles to authenticated;

comment on column public.profiles.avatar_path is 'Foto profilo caricata dal sito (bucket profile-media, <id>/avatar/<file>, 1 MB): il trigger guard_profile_vetrina tiene avatar_url allineata (27/09/2026).';
comment on column public.profiles.cover_preset is 'Vetrina: sfondo preimpostato della copertina (src/lib/community/showcase.ts, COVER_PRESETS). Solo ruoli con vetrina.';
comment on column public.profiles.cover_path is 'Vetrina: copertina caricata (bucket profile-media, <id>/cover/<file>, 2 MB). Solo ruoli con vetrina.';
comment on column public.profiles.background_preset is 'Vetrina: sfondo della pagina del profilo, uno dei motivi di COVER_PRESETS (27/09/2026). Solo ruoli con vetrina.';
comment on column public.profiles.background_path is 'Vetrina: sfondo della pagina caricato (bucket profile-media, <id>/background/<file>, 2 MB; 27/09/2026). Solo ruoli con vetrina.';
comment on column public.profiles.schedule is 'Vetrina: orari delle dirette, al massimo 7 voci {day 0-6 (0 = lunedì), time HH:MM, minutes 15-720 facoltativo} nel fuso schedule_tz (che c''è solo con degli orari).';
comment on column public.profiles.avatar_updated_at is 'Ultimo cambio della foto caricata: lo scrive solo il trigger guard_profile_vetrina (limite di frequenza di saveAvatar).';
comment on column public.profiles.vetrina_updated_at is 'Ultimo cambio della vetrina: lo scrive solo il trigger guard_profile_vetrina (limite di frequenza di saveShowcase).';

-- ---------- Storage: foto profilo e copertine (caricate dal browser, ognuno nella sua cartella) ----------
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('profile-media', 'profile-media', true, 2097152, array['image/png','image/jpeg','image/webp'])
  on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

  -- gli indirizzi pubblici funzionano senza policy (bucket pubblico); l'elenco dei file lo vede solo il proprietario (e
  -- un admin, che senza lettura non potrebbe nemmeno cancellare)
  drop policy if exists "profile media owners read" on storage.objects;
  create policy "profile media owners read" on storage.objects for select to authenticated using (
    bucket_id = 'profile-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
  -- <id>/avatar/<file> (tutti) e <id>/cover/<file> (ruoli con vetrina o admin), al massimo 12 file per utente. Niente
  -- peso qui: lo Storage prova questa policy prima di ricevere il file, quando i metadati (size, mimetype) non ci sono
  -- ancora. Il caricamento lo limita il bucket (2 MB, tre tipi); 1 MB per la foto lo impone il trigger al salvataggio.
  drop policy if exists "profile media upload" on storage.objects;
  create policy "profile media upload" on storage.objects for insert to authenticated with check (
    bucket_id = 'profile-media'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = auth.uid()::text
    and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
    -- revisione del 27/09/2026: solo il nome che sceglie il sito (un uuid con l'estensione del tipo, `uploadMedia` in
    -- src/components/showcase/mediaUpload.ts; MEDIA_UPLOAD_NAME_RE in profileMedia.ts, showcase.test.ts le confronta)
    and storage.filename(name) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$'
    and public.profile_media_count() < 12
    and (
      (storage.foldername(name))[2] = 'avatar'
      or ((storage.foldername(name))[2] in ('cover', 'background')
          and exists (select 1 from public.profiles p where p.id = auth.uid() and (p.badge in ('creator', 'author', 'pro', 'staff') or p.role = 'admin')))
    )
  );
  -- niente update (i nomi sono sempre nuovi); si cancellano i propri file (un admin anche quelli degli altri), mai un file
  -- in uso sul profilo del proprietario della cartella: prima si svuota il campo, poi si toglie il file
  drop policy if exists "profile media owners delete" on storage.objects;
  create policy "profile media owners delete" on storage.objects for delete to authenticated using (
    bucket_id = 'profile-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
    and not exists (select 1 from public.profiles p where p.id::text = (storage.foldername(name))[1] and (p.avatar_path = name or p.cover_path = name or p.background_path = name))
  );
exception when others then
  raise notice 'Storage profile-media non configurato da SQL (%): creare bucket e policy dalla dashboard, vedi README ("Vetrina dei profili e foto caricate").', sqlerrm;
end $$;

-- ===== 27/09/2026: SEGUI =====
-- =====================================================================================================
-- "Segui" e notifiche (pacchetto SEGUI, 27/09/2026). Pierluigi, 27/09/2026, alle proposte per i profili dei ruoli con
-- vetrina: "OK A TUTTO, OTTIMO!!", fra cui "Segui" con un avviso quando un creator pubblica un mazzo o va in diretta.
--
--   follows              chi segue chi. Si seguono solo i profili vetrina (tag creator, author, pro, staff: SHOWCASE_BADGES
--                        di src/lib/community/badges.ts, follows.test.ts confronta gli elenchi), mai se stessi, al massimo
--                        FOLLOW_MAX (500) profili a testa. Ognuno legge, aggiunge e toglie SOLO i propri "segui" (RLS):
--                        nessuno vede chi segue un altro. Il numero dei follower di un profilo è pubblico solo come
--                        conteggio, con la RPC follow_state.
--   notifications        gli avvisi di un utente: mazzo pubblicato ('deck_published'), diretta su Twitch ('live'), guida
--                        pubblicata ('guide_published', per il pacchetto GUIDE). L'utente legge solo i suoi (policy) e li
--                        segna come letti con la RPC notifications_mark_read; nessuna scrittura diretta degli utenti
--                        (policy restrittive e nessun grant di scrittura): le righe le scrivono solo le funzioni security
--                        definer qui sotto (notify_followers dalla Server Action di chi pubblica, notify_live dalla rotta
--                        del cron). `event_key` (uno per evento: il percorso del mazzo o della guida, `twitch:<id della
--                        diretta>`) con il vincolo unico fa arrivare ogni avviso una volta sola a ogni utente (chi segue
--                        due profili sullo stesso canale Twitch riceve un avviso solo); il sito non la legge.
--   notification_events  registro degli invii, uno per autore ed evento (chiave kind, actor_id, event_key: l'evento di un
--                        autore non blocca mai quello di un altro), con il numero dei destinatari e `sent` (false: diretta
--                        soppressa dalla pausa, nessun avviso partito), senza i nomi di chi riceve. Serve alla dedupe, al
--                        tetto giornaliero per autore (NOTIFY_DAILY_MAX, 10 mazzi o guide al giorno) e alla pausa fra due
--                        dirette della stessa persona (LIVE_COOLDOWN_HOURS, 3 ore dall'ultimo avviso partito davvero: una
--                        diretta interrotta e ripresa ha un id nuovo). Nessun client la legge.
--   notify_keys          impronta SHA-256 (esadecimale) del segreto della rotta /api/cron/live (variabile CRON_SECRET),
--                        scritta da `node scripts/set-cron-key.mjs` con la connessione diretta; nessun client la legge.
--                        notify_live e notifications_cleanup girano per `anon` (il cron non ha una sessione) e partono
--                        solo con il segreto giusto (notify_key_ok).
--
-- Conservazione: gli avvisi durano NOTIFICATION_RETENTION_DAYS (90 giorni), il registro degli invii
-- NOTIFICATION_EVENT_RETENTION_DAYS (180). La pulizia (notifications_prune) gira a ogni giro del cron
-- (notifications_cleanup, ogni 10 minuti), a ogni invio e a ogni "segna come letti"; il sito comunque non mostra né
-- conta gli avvisi più vecchi di 90 giorni. Tutto si cancella con l'account (on delete cascade dal profilo, anche per chi
-- segue e per chi è seguito).
--
-- Sicurezza (stesse regole del blocco INBOX): tabelle nuove con RLS e policy esplicite; `revoke all` da anon e
-- authenticated (Supabase dà ALL di default) e poi i soli grant che servono, per colonna; funzioni security definer con
-- search_path fissato ed execute tolto a public e anon quando non serve. Nessun grant né revoke su public.profiles:
-- questo blocco non tocca le colonne dei profili (scripts/schema-guard.mjs resta com'è).
-- Idempotente: si può rilanciare (create ... if not exists, create or replace, drop policy/trigger if exists).
-- =====================================================================================================

-- ---------- chi segue chi ----------
create table if not exists public.follows (
  -- chi segue
  follower uuid not null references public.profiles(id) on delete cascade,
  -- chi è seguito: un profilo vetrina (controllo nella policy e nel trigger qui sotto)
  followed uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followed),
  constraint follows_not_self check (follower <> followed)
);
-- il numero dei follower di un profilo (follow_state) e l'invio degli avvisi leggono per `followed`
create index if not exists follows_followed_idx on public.follows (followed, created_at desc);
comment on table public.follows is 'Chi segue chi (pacchetto SEGUI, 27/09/2026): solo profili vetrina (creator, author, pro, staff), mai se stessi, al massimo 500 a testa. Ognuno vede solo i propri; il conteggio pubblico sta in follow_state.';

-- Controllo di chi si segue, anche per chi scrive la riga via API saltando il sito: la data la mette il database, si
-- seguono solo i profili vetrina, mai se stessi, al massimo 500 profili (FOLLOW_MAX di src/lib/community/follows.ts).
-- Il lock per utente mette in fila le richieste parallele, così il tetto non si supera con dieci clic insieme.
create or replace function public.guard_follow()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  n integer;
begin
  new.created_at := now();
  if new.follower = new.followed then raise exception 'follow_self'; end if;
  if not exists (select 1 from public.profiles p where p.id = new.followed and p.badge in ('creator', 'author', 'pro', 'staff')) then
    raise exception 'not_followable';
  end if;
  perform pg_advisory_xact_lock(hashtext('om_follow:' || new.follower::text));
  select count(*) into n from public.follows f where f.follower = new.follower;
  if n >= 500 then raise exception 'too_many_follows'; end if;
  return new;
end $$;
drop trigger if exists follows_guard on public.follows;
create trigger follows_guard before insert on public.follows
  for each row execute function public.guard_follow();

alter table public.follows enable row level security;

-- auth.uid() dentro una (select …): calcolato una volta per richiesta, non per riga (come nel blocco INBOX)
drop policy if exists "follows read own" on public.follows;
create policy "follows read own" on public.follows for select to authenticated
  using (follower = (select auth.uid()));
drop policy if exists "follows insert own" on public.follows;
create policy "follows insert own" on public.follows for insert to authenticated
  with check (
    follower = (select auth.uid())
    and followed <> follower
    and exists (select 1 from public.profiles p where p.id = follows.followed and p.badge in ('creator', 'author', 'pro', 'staff'))
  );
drop policy if exists "follows delete own" on public.follows;
create policy "follows delete own" on public.follows for delete to authenticated
  using (follower = (select auth.uid()));
-- un "segui" non si modifica: si toglie e si rimette
drop policy if exists "follows no update" on public.follows;
create policy "follows no update" on public.follows as restrictive for update to anon, authenticated using (false) with check (false);

revoke all on public.follows from anon, authenticated;
grant select (follower, followed, created_at) on public.follows to authenticated;
grant insert (follower, followed) on public.follows to authenticated;
grant delete on public.follows to authenticated;

-- Stato del tasto "Segui" (letto nel browser: le pagine /u e le schede dei mazzi restano ISR): quanti follower ha il
-- profilo (solo il numero, mai chi sono), se chi guarda lo segue già (false per chi non ha fatto l'accesso) e se il
-- profilo si può seguire (ruolo con vetrina).
create or replace function public.follow_state(p_profile uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'followers', (select count(*) from public.follows f where f.followed = p_profile),
    'following', (select auth.uid()) is not null
      and exists (select 1 from public.follows f where f.followed = p_profile and f.follower = (select auth.uid())),
    'followable', exists (select 1 from public.profiles p where p.id = p_profile and p.badge in ('creator', 'author', 'pro', 'staff'))
  );
$$;
revoke all on function public.follow_state(uuid) from public;
grant execute on function public.follow_state(uuid) to anon, authenticated;

-- ---------- avvisi ----------
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  -- chi riceve l'avviso
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('deck_published', 'live', 'guide_published')),
  -- chi ha fatto la cosa (pubblicato il mazzo o la guida, avviato la diretta)
  actor_id uuid not null references public.profiles(id) on delete cascade,
  -- percorso interno senza lingua: /decks/community/<slug>, /guides/community/<slug>, /u/<nome utente>
  target text not null check (char_length(target) between 2 and 160 and target ~ '^/[a-z0-9][a-z0-9/_-]*$'),
  -- l'evento (percorso del mazzo o della guida, twitch:<id della diretta>): un avviso per evento e per utente
  event_key text not null check (char_length(event_key) between 1 and 200),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint notifications_once unique (user_id, kind, event_key)
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;
create index if not exists notifications_created_idx on public.notifications (created_at);
create index if not exists notifications_actor_idx on public.notifications (actor_id);
comment on table public.notifications is 'Avvisi per chi segue (pacchetto SEGUI, 27/09/2026): mazzo pubblicato, diretta su Twitch, guida pubblicata. Scritti solo da notify_followers e notify_live, letti e segnati come letti solo dal destinatario. Durano 90 giorni.';

create table if not exists public.notification_events (
  kind text not null check (kind in ('deck_published', 'live', 'guide_published')),
  event_key text not null check (char_length(event_key) between 1 and 200),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  recipients integer not null default 0,
  -- false: diretta soppressa dalla pausa di 3 ore (nessun avviso partito); non conta per la pausa successiva
  sent boolean not null default true,
  created_at timestamptz not null default now(),
  -- l'autore nella chiave: due profili sullo stesso canale Twitch hanno ognuno il suo evento, e nessuno può "prenotare"
  -- il percorso del mazzo o della guida di un altro
  primary key (kind, actor_id, event_key)
);
create index if not exists notification_events_actor_idx on public.notification_events (actor_id, kind, created_at desc);
create index if not exists notification_events_created_idx on public.notification_events (created_at);
comment on table public.notification_events is 'Registro degli invii di avvisi (pacchetto SEGUI), uno per autore ed evento, senza i nomi dei destinatari: dedupe, tetto di 10 al giorno per autore e tipo, 3 ore fra due avvisi di diretta partiti davvero (sent). Dura 180 giorni. Nessun client la legge.';

create table if not exists public.notify_keys (
  name text primary key check (name in ('live')),
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  updated_at timestamptz not null default now()
);
comment on table public.notify_keys is 'Impronta SHA-256 del segreto CRON_SECRET della rotta /api/cron/live (scripts/set-cron-key.mjs). Nessun client la legge.';

alter table public.notifications enable row level security;
alter table public.notification_events enable row level security;
alter table public.notify_keys enable row level security;

drop policy if exists "notifications read own" on public.notifications;
create policy "notifications read own" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
-- Nessuna scrittura diretta: policy restrittive (una riga deve passarle tutte), come nel blocco INBOX. Le funzioni
-- security definer girano come proprietario delle tabelle e non le vedono.
drop policy if exists "notifications no direct insert" on public.notifications;
create policy "notifications no direct insert" on public.notifications as restrictive for insert to anon, authenticated with check (false);
drop policy if exists "notifications no direct update" on public.notifications;
create policy "notifications no direct update" on public.notifications as restrictive for update to anon, authenticated using (false) with check (false);
drop policy if exists "notifications no direct delete" on public.notifications;
create policy "notifications no direct delete" on public.notifications as restrictive for delete to anon, authenticated using (false);
-- notification_events e notify_keys: RLS senza policy (nessuna riga per anon e authenticated) e nessun grant
drop policy if exists "notification events no direct access" on public.notification_events;
create policy "notification events no direct access" on public.notification_events as restrictive for all to anon, authenticated using (false) with check (false);
drop policy if exists "notify keys no direct access" on public.notify_keys;
create policy "notify keys no direct access" on public.notify_keys as restrictive for all to anon, authenticated using (false) with check (false);

revoke all on public.notifications, public.notification_events, public.notify_keys from anon, authenticated;
-- la sola lettura, per colonna: fuori `event_key`, che al sito non serve
grant select (id, user_id, kind, actor_id, target, created_at, read_at) on public.notifications to authenticated;

-- ---------- funzioni interne (nessun client le esegue direttamente) ----------

-- Pulizia: avvisi oltre i 90 giorni, registro degli invii oltre i 180 (indici su created_at). Gira dal cron
-- (notifications_cleanup), a ogni invio (notify_fanout) e a ogni "segna come letti".
create or replace function public.notifications_prune()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from public.notifications where created_at < now() - interval '90 days';
  delete from public.notification_events where created_at < now() - interval '180 days';
end $$;
revoke all on function public.notifications_prune() from public, anon, authenticated;

-- Il segreto del cron è quello registrato? (`p_key` = CRON_SECRET, almeno 32 caratteri, confrontato con la sua impronta
-- SHA-256 in notify_keys.) La usano notify_live e notifications_cleanup, che girano per anon.
create or replace function public.notify_key_ok(p_key text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_key is not null and char_length(p_key) between 32 and 256
    and exists (select 1 from public.notify_keys k where k.name = 'live' and k.key_hash = encode(sha256(convert_to(p_key, 'UTF8')), 'hex'));
$$;
revoke all on function public.notify_key_ok(text) from public, anon, authenticated;

-- Un avviso per ogni follower di `actor`, una volta per evento (`event_key`); registra l'evento dell'autore con i
-- destinatari (sent = true). Chi chiama ha già fatto i controlli (chi è l'autore, che cosa ha pubblicato, che l'evento
-- non ci sia già) e tiene il lock dell'autore.
create or replace function public.notify_fanout(p_actor uuid, p_kind text, p_target text, p_event text)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  n integer;
begin
  insert into public.notifications (user_id, kind, actor_id, target, event_key)
    select f.follower, p_kind, p_actor, p_target, p_event from public.follows f where f.followed = p_actor
    on conflict (user_id, kind, event_key) do nothing;
  get diagnostics n = row_count;
  insert into public.notification_events (kind, event_key, actor_id, recipients) values (p_kind, p_event, p_actor, n)
    on conflict (kind, actor_id, event_key) do nothing;
  perform public.notifications_prune();
  return n;
end $$;
revoke all on function public.notify_fanout(uuid, text, text, text) from public, anon, authenticated;

-- ---------- RPC per il sito ----------
-- Errori con raise exception '<codice>': li traduce `notificationErrorCode` in src/lib/community/notifications.ts.

-- Avviso ai follower di chi ha appena pubblicato un mazzo o una guida. Lo chiama la Server Action di pubblicazione con
-- la sessione di chi ha agito (dentro after(), `notifyFollowers` in src/lib/community/notify.ts). L'autore dell'avviso è
-- SEMPRE il proprietario della riga pubblicata, verificato qui, mai solo un nome passato da chi chiama:
--   - un mazzo: `/decks/community/<slug>`, riga di community_decks pubblicata;
--   - una guida (pacchetto GUIDE): `/guides/community/<slug>` (slug di 3-60 caratteri, come community_guides_slug_check),
--     riga di community_guides pubblicata. Finché la tabella del pacchetto GUIDE non c'è (to_regclass nullo) nessuna guida
--     esiste e la risposta è 'not_found'; la lettura è dinamica (execute), così la funzione si crea anche senza tabella.
-- `p_actor` è l'autore atteso (assente = chi chiama) e deve essere il proprietario della riga ('not_found' se no). Chi
-- chiama deve essere l'autore stesso, oppure lo staff (is_staff(): admin o ruolo Staff) quando pubblica per conto suo;
-- chiunque altro riceve 'forbidden'. Solo i ruoli con vetrina hanno follower: per gli altri non succede nulla (0). Una
-- volta per autore e per mazzo o guida; al massimo 10 invii al giorno per autore e tipo (poi 0, senza errore: la
-- pubblicazione è già riuscita). Restituisce quanti avvisi sono partiti.
-- La firma a due argomenti della prima versione (mai applicata al database vivo) si toglie, se c'è: con tutte e due le
-- firme una chiamata con due argomenti sarebbe ambigua.
drop function if exists public.notify_followers(text, text);
create or replace function public.notify_followers(p_kind text, p_target text, p_actor uuid default null)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := auth.uid();
  v_actor uuid := coalesce(p_actor, auth.uid());
  v_target text := btrim(coalesce(p_target, ''));
  v_owner uuid;
  v_badge text;
  n integer;
begin
  if me is null then raise exception 'not_logged_in'; end if;
  if p_kind is null or p_kind not in ('deck_published', 'guide_published') then raise exception 'bad_kind'; end if;
  if char_length(v_target) > 160 then raise exception 'bad_target'; end if;
  if v_actor <> me and not public.is_staff() then raise exception 'forbidden'; end if;
  if p_kind = 'deck_published' then
    if v_target !~ '^/decks/community/[a-z0-9-]{1,80}$' then raise exception 'bad_target'; end if;
    -- '/decks/community/' sono 17 caratteri: lo slug comincia dal diciottesimo
    select d.owner into v_owner from public.community_decks d where d.slug = substr(v_target, 18) and d.status = 'published';
  else
    -- '/guides/community/' sono 18 caratteri: lo slug (3-60) comincia dal diciannovesimo
    if v_target !~ '^/guides/community/[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_target) not between 21 and 78 then
      raise exception 'bad_target';
    end if;
    if to_regclass('public.community_guides') is null then raise exception 'not_found'; end if;
    execute 'select g.owner from public.community_guides g where g.slug = $1 and g.status = ''published'''
      into v_owner using substr(v_target, 19);
  end if;
  if v_owner is null or v_owner <> v_actor then raise exception 'not_found'; end if;
  select p.badge into v_badge from public.profiles p where p.id = v_actor;
  if v_badge is null or v_badge not in ('creator', 'author', 'pro', 'staff') then return 0; end if;
  perform pg_advisory_xact_lock(hashtext('om_notify:' || v_actor::text));
  if exists (select 1 from public.notification_events e where e.kind = p_kind and e.actor_id = v_actor and e.event_key = v_target) then return 0; end if;
  select count(*) into n from public.notification_events e
   where e.actor_id = v_actor and e.kind = p_kind and e.created_at > now() - interval '1 day';
  if n >= 10 then return 0; end if;
  return public.notify_fanout(v_actor, p_kind, v_target, v_target);
end $$;
revoke all on function public.notify_followers(text, text, uuid) from public, anon;
grant execute on function public.notify_followers(text, text, uuid) to authenticated;

-- Avviso ai follower di chi è appena andato in diretta su Twitch con Origins TCG. Lo chiama la rotta /api/cron/live (cron
-- di Vercel ogni 10 minuti, src/app/api/cron/live/route.ts) senza sessione, quindi come anon: parte solo con il segreto
-- giusto (`p_key` = CRON_SECRET, notify_key_ok). Chi sia in diretta lo decide la rotta con le API di Twitch; qui si
-- controlla che il profilo sia vetrina e abbia un canale Twitch. Una volta per persona e per diretta (id della diretta di
-- Twitch: due profili sullo stesso canale hanno ognuno il suo avviso) e al massimo un avviso ogni 3 ore per persona: una
-- diretta interrotta e ripresa ha un id nuovo, e se l'ultimo avviso PARTITO è di meno di 3 ore fa non ne parte un altro
-- (l'evento resta segnato con sent = false, che non sposta la finestra: conta solo l'ultimo avviso partito davvero).
-- L'avviso porta alla pagina /u/<nome utente>, con il badge LIVE e il link al canale.
create or replace function public.notify_live(p_key text, p_actor uuid, p_stream_id text)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_event text;
  v_username text;
  v_badge text;
  v_links jsonb;
begin
  if not public.notify_key_ok(p_key) then raise exception 'forbidden'; end if;
  if p_stream_id is null or p_stream_id !~ '^[0-9]{1,40}$' then raise exception 'bad_target'; end if;
  select p.username, p.badge, p.links into v_username, v_badge, v_links from public.profiles p where p.id = p_actor;
  if v_badge is null or v_badge not in ('creator', 'author', 'pro', 'staff') then return 0; end if;
  if v_username is null or v_username !~ '^[a-z0-9_-]{1,60}$' then return 0; end if;
  if jsonb_typeof(v_links) is distinct from 'array'
     or not exists (select 1 from jsonb_array_elements(v_links) as t(e) where t.e->>'kind' = 'twitch') then
    return 0;
  end if;
  v_event := 'twitch:' || p_stream_id;
  perform pg_advisory_xact_lock(hashtext('om_notify:' || p_actor::text));
  -- questa diretta di questa persona c'è già (annunciata o soppressa)
  if exists (select 1 from public.notification_events e where e.kind = 'live' and e.actor_id = p_actor and e.event_key = v_event) then return 0; end if;
  -- pausa dall'ultimo avviso di diretta partito davvero (sent): una diretta soppressa non sposta la finestra
  if exists (select 1 from public.notification_events e where e.actor_id = p_actor and e.kind = 'live' and e.sent and e.created_at > now() - interval '3 hours') then
    insert into public.notification_events (kind, event_key, actor_id, recipients, sent) values ('live', v_event, p_actor, 0, false)
      on conflict (kind, actor_id, event_key) do nothing;
    return 0;
  end if;
  return public.notify_fanout(p_actor, 'live', '/u/' || v_username, v_event);
end $$;
revoke all on function public.notify_live(text, uuid, text) from public;
grant execute on function public.notify_live(text, uuid, text) to anon, authenticated;

-- Pulizia periodica dal cron (/api/cron/live, ogni 10 minuti, anche senza dirette e senza le chiavi di Twitch), con lo
-- stesso segreto di notify_live: gli avvisi oltre i 90 giorni e il registro oltre i 180 si cancellano anche quando per
-- settimane non parte nessun avviso.
create or replace function public.notifications_cleanup(p_key text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.notify_key_ok(p_key) then raise exception 'forbidden'; end if;
  perform public.notifications_prune();
end $$;
revoke all on function public.notifications_cleanup(text) from public;
grant execute on function public.notifications_cleanup(text) to anon, authenticated;

-- Segna come letti i propri avvisi: tutti (`p_ids` nullo, "Segna tutte come lette") o quelli indicati (al massimo 200:
-- il clic su un avviso). Restituisce quanti ne ha segnati. Passa anche la pulizia (notifications_prune).
create or replace function public.notifications_mark_read(p_ids bigint[] default null)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := auth.uid();
  n integer;
begin
  if me is null then raise exception 'not_logged_in'; end if;
  if p_ids is not null and cardinality(p_ids) > 200 then raise exception 'too_many'; end if;
  update public.notifications set read_at = now()
   where user_id = me and read_at is null and (p_ids is null or id = any (p_ids));
  get diagnostics n = row_count;
  perform public.notifications_prune();
  return n;
end $$;
revoke all on function public.notifications_mark_read(bigint[]) from public, anon;
grant execute on function public.notifications_mark_read(bigint[]) to authenticated;

-- ===== 27/09/2026: TRAGUARDI =====
-- =====================================================================================================
-- Traguardi, numeri pubblici e tornei in evidenza sul profilo /u (pacchetto TRAGUARDI, ondata 2 dei profili).
-- Pierluigi, 27/09/2026: "OK A TUTTO, OTTIMO!!" alle proposte per i profili (traguardi, numeri pubblici del creator
-- "se lui vuole", tornei del creator in evidenza).
-- =====================================================================================================
-- DA ACCODARE IN FONDO A supabase/schema.sql (lo fa l'integratore): scripts/db-migrate.mjs applica il file intero a
-- ogni migrazione, quindi tutto qui è idempotente (add column if not exists, create or replace, drop ... if exists).
-- ORDINE: questo blocco sta DOPO `revoke update on public.profiles from anon, authenticated;` (commit 6c6756d) e dopo
-- i blocchi CREATOR e STATS di schema.sql: usa `profiles.badge`, `deck_stats_daily`, `is_admin()`. Nessuna revoke su
-- public.profiles qui dentro (cancellerebbe le grant per colonna, vedi scripts/schema-guard.mjs).
--
-- Cosa c'è:
--   1) profiles.show_stats: il creator sceglie da /account se mostrare i suoi numeri sulla vetrina. Solo i ruoli con
--      vetrina (Creator, Autore, Pro, Staff: SHOWCASE_BADGES in src/lib/community/badges.ts). Grant di UPDATE sulla sola
--      colonna (mai sull'intera tabella) e un trigger che la difende: un profilo della community non può accenderla, e
--      chi perde il ruolo con vetrina la ritrova spenta.
--   2) profile_public_stats(pid): i totali dei mazzi pubblicati (mazzi, visite, copie del codice del gioco, voti
--      ricevuti) di un profilo con show_stats acceso; per tutti gli altri nessuna riga. Security definer perché
--      deck_stats_daily è privata: la funzione restituisce SOLO somme, mai le righe per giorno o per mazzo.
--   3) profile_achievement_facts(pid): i fatti dei traguardi che il sito non ha già in pagina (tornei giocati,
--      organizzati e vinti, mesi da "mazzo del mese"). Security INVOKER: legge con i permessi di chi chiama, quindi
--      per la pagina /u (client anonimo) vede solo quello che è già pubblico (mazzi pubblicati, voti, tornei pubblici,
--      policy can_view_tournament), e in più filtra da sé su tornei pubblici con una finale valida e mazzi pubblicati.
--      Più un indice su deck_votes(created_at) per il "mazzo del mese".
-- Nessuna tabella nuova: i traguardi si calcolano dai dati che ci sono (regole e soglie in
-- src/lib/community/achievements.ts, con test che confrontano i numeri e i ruoli di questo file con il codice).

-- ---------- 1) numeri pubblici della vetrina: la scelta del creator ----------
alter table public.profiles add column if not exists show_stats boolean not null default false;
comment on column public.profiles.show_stats is 'Il profilo mostra sulla vetrina /u i totali dei suoi mazzi pubblicati (visite, copie del codice, voti, mazzi). Solo Creator, Autore, Pro e Staff; la sceglie l''utente da /account (27/09/2026, pacchetto TRAGUARDI).';

-- Difesa della colonna: un utente senza ruolo con vetrina non la accende (errore esplicito, anche via API con la chiave
-- pubblica); qualsiasi aggiornamento di un profilo senza ruolo con vetrina la rimette a false, così chi perde il ruolo
-- (scripts/set-badge.mjs, connessione diretta) non continua a mostrare i numeri. Un admin (is_admin()) non riceve
-- l'errore, ma anche per lui vale la regola del ruolo. Stesso elenco di SHOWCASE_BADGES (achievements.test.ts).
create or replace function public.guard_profile_show_stats()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.show_stats and new.badge not in ('creator', 'author', 'pro', 'staff') then
    if old.show_stats is distinct from new.show_stats and auth.uid() is not null and not public.is_admin() then
      raise exception 'show_stats_not_allowed';
    end if;
    new.show_stats := false;
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard_show_stats on public.profiles;
create trigger profiles_guard_show_stats before update on public.profiles
  for each row execute function public.guard_profile_show_stats();

-- La scrittura concessa: la sola colonna show_stats della propria riga (policy "users edit own profile" di schema.sql).
-- MAI un grant di UPDATE sull'intera tabella (6c6756d). La stessa istruzione sta in PROFILES_GRANTS di
-- scripts/schema-guard.mjs, che rifiuta ogni altra grant su public.profiles.
grant update (show_stats) on public.profiles to authenticated;

-- ---------- 2) i numeri pubblici: solo aggregati, solo con show_stats ----------
-- Una riga per un profilo con show_stats acceso e un ruolo con vetrina, nessuna per tutti gli altri. Solo i mazzi
-- pubblicati (non i nascosti né i privati); voti = voti ricevuti su quei mazzi; `since` = primo giorno con un dato
-- (le statistiche esistono dal 26/09/2026). Sono stime, come nel pannello "Le tue statistiche" (blocco STATS).
create or replace function public.profile_public_stats(pid uuid)
returns table (decks integer, views bigint, code_copies bigint, votes bigint, since date)
language sql stable security definer set search_path = public, pg_temp as $$
  with shown as (
    select p.id from public.profiles p
    where p.id = pid and p.show_stats and p.badge in ('creator', 'author', 'pro', 'staff')
  ),
  d as (
    select cd.id from public.community_decks cd join shown s on s.id = cd.owner where cd.status = 'published'
  ),
  totals as (
    select coalesce(sum(x.views), 0)::bigint as views, coalesce(sum(x.code_copies), 0)::bigint as code_copies, min(x.day) as since
    from public.deck_stats_daily x where x.deck_id in (select d.id from d)
  )
  select
    (select count(*) from d)::integer,
    t.views,
    t.code_copies,
    (select count(*) from public.deck_votes v where v.deck_id in (select d.id from d))::bigint,
    t.since
  from totals t
  where exists (select 1 from shown);
$$;
-- La legge la pagina /u, ISR con il client anonimo: serve anche ad anon.
revoke all on function public.profile_public_stats(uuid) from public;
grant execute on function public.profile_public_stats(uuid) to anon, authenticated;

-- ---------- 3) i fatti dei traguardi che la pagina non ha già ----------
-- Tornei (revisione del 27/09/2026): contano solo i tornei pubblici finiti con una FINALE VALIDA, la stessa condizione
-- di finish_tournament (partita in posizione 0 dell'ultimo turno, confermata o bye, con un vincitore). `status` da solo
-- non basta: l'organizzatore lo può scrivere via API (grant update sull'intera tabella tournaments), mentre le partite
-- si scrivono solo con le RPC. "Giocato": il profilo è in una partita del tabellone. "Vinto": vincitore della finale (la
-- regola di `standings` in src/lib/tournament/bracket.ts). `first` = la prima finale (ultima modifica della partita di
-- finale, scritta solo dalle RPC), non `starts_at`, che l'organizzatore può spostare anche nel futuro.
-- Restano fuori i tornei di prova dello staff con i bot di scripts/seed-bots.mjs (nome utente bot-<n>, o bot-<n>-<k> se
-- il nome era preso: SEED_BOT_USERNAME in src/lib/community/achievements.ts, il test controlla che coincida).
-- Si parte dai tornei del profilo (organizzati o giocati), non da tutti quelli del sito: anon può chiamare la funzione
-- con qualsiasi pid, e il costo non deve crescere con il sito.
-- Mazzo del mese: per ogni mese UTC già chiuso, i mazzi pubblicati con più voti POSITIVI (4 o 5 stelle) ricevuti in quel
-- mese, almeno 3, pari merito compresi: un mazzo con tre voti da una stella non è "del mese". Il massimo del sito si
-- calcola solo nei mesi in cui un mazzo del profilo ha almeno 3 voti positivi. `top_months` = quei mesi, 'YYYY-MM'.
-- Revisione del 27/09/2026: la data di un voto (deck_votes.created_at) fino a oggi la poteva scrivere chi vota (grant di
-- insert e update sull'intera tabella), quindi tre account potevano retrodatare i loro voti a un mese vuoto. Dal blocco
-- "27/09/2026: DATE E FOTO" in fondo al file la scrive solo il database; qui contano comunque solo i voti dalla nascita
-- della community (15/09/2026, COMMUNITY_SINCE in src/lib/community/achievements.ts), così le righe falsate prima della
-- correzione non valgono.
create or replace function public.profile_achievement_facts(pid uuid)
returns jsonb language sql stable security invoker set search_path = public, pg_temp as $$
  with played_ids as (
    select m.tournament_id as id from public.tournament_matches m where m.player_a = pid
    union
    select m.tournament_id from public.tournament_matches m where m.player_b = pid
  ),
  mine as (
    select p.id from played_ids p
    union
    select t.id from public.tournaments t where t.organizer = pid
  ),
  pub as (
    select t.id, t.organizer, f.winner, f.updated_at as done_at
    from mine
    join public.tournaments t on t.id = mine.id
    join public.tournament_matches f on f.tournament_id = t.id
    where t.status = 'finished' and t.visibility = 'public'
      and f.position = 0 and f.status in ('confirmed', 'bye') and f.winner is not null
      and f.round = (select max(r.round) from public.tournament_matches r where r.tournament_id = t.id)
      and not exists (
        select 1 from public.tournament_players tp join public.profiles bp on bp.id = tp.user_id
        where tp.tournament_id = t.id and bp.username ~ '^bot-[0-9]+(-[0-9]+)?$'
      )
  ),
  my_months as (
    select date_trunc('month', v.created_at at time zone 'utc') as month, v.deck_id, count(*) as n
    from public.community_decks d join public.deck_votes v on v.deck_id = d.id
    where d.owner = pid and d.status = 'published' and v.stars >= 4
      and v.created_at >= timestamptz '2026-09-15 00:00:00+00'
      and v.created_at < date_trunc('month', now() at time zone 'utc') at time zone 'utc'
    group by 1, 2
    having count(*) >= 3
  ),
  rivals as (
    select mm.month, max(x.n) as best
    from (select distinct my.month from my_months my) mm
    cross join lateral (
      select count(*) as n
      from public.deck_votes v join public.community_decks d on d.id = v.deck_id and d.status = 'published'
      where v.stars >= 4 and v.created_at >= timestamptz '2026-09-15 00:00:00+00'
        and v.created_at >= mm.month at time zone 'utc' and v.created_at < (mm.month + interval '1 month') at time zone 'utc'
      group by v.deck_id
    ) x
    group by mm.month
  )
  select jsonb_build_object(
    'played', (select jsonb_build_object('count', count(*), 'first', min(pub.done_at)) from pub join played_ids p on p.id = pub.id),
    'organized', (select jsonb_build_object('count', count(*), 'first', min(pub.done_at)) from pub where pub.organizer = pid),
    'won', (select jsonb_build_object('count', count(*), 'first', min(pub.done_at)) from pub where pub.winner = pid),
    'top_months', coalesce((
      select jsonb_agg(distinct to_char(mm.month, 'YYYY-MM'))
      from my_months mm join rivals r on r.month = mm.month
      where mm.n >= r.best
    ), '[]'::jsonb)
  );
$$;
-- Il massimo di un mese legge solo i voti di quel mese.
create index if not exists deck_votes_created_idx on public.deck_votes (created_at);
revoke all on function public.profile_achievement_facts(uuid) from public;
grant execute on function public.profile_achievement_facts(uuid) to anon, authenticated;

comment on function public.profile_public_stats(uuid) is 'Totali dei mazzi pubblicati di un profilo con show_stats (vetrina /u): mazzi, visite, copie del codice, voti ricevuti. Solo aggregati; le righe di deck_stats_daily restano private (27/09/2026).';
comment on function public.profile_achievement_facts(uuid) is 'Fatti pubblici per i traguardi di /u: tornei pubblici finiti con una finale valida (senza i bot di prova) giocati, organizzati e vinti, mesi da mazzo del mese (voti da 4 o 5 stelle). Security invoker (27/09/2026).';

-- ===== 27/09/2026: GUIDE =====
-- =====================================================================================================
-- GUIDE DELLA COMMUNITY PUBBLICATE DIRETTAMENTE DAI RUOLI (pacchetto GUIDE, 27/09/2026)
-- Richiesta di Pierluigi ("OK A TUTTO, OTTIMO!!" alle proposte per i profili del 27/09/2026): chi ha il ruolo Autore,
-- Creator, Pro o Staff (o è admin) pubblica le sue guide sul sito senza passare dallo staff; gli altri continuano con
-- il modulo "Mandaci la tua guida" (/guides/submit). Codice: src/lib/community/guides.ts (regole pure, con test in
-- guides.test.ts che confrontano limiti, categorie, copertine e ruoli con questo file), guideQueries.ts (letture),
-- guideActions.ts (Server Action), guideTranslate.ts e guideTranslateCore.ts (traduzione automatica), pagine
-- /guides/new, /guides/community, /guides/community/[slug] e /guides/community/[slug]/edit. Documentazione:
-- docs/guide-community.md.
--
-- File da accodare IN FONDO a supabase/schema.sql (lo fa l'integratore): usa funzioni definite prima là dentro
-- (is_staff del blocco INBOX, deck_videos_ok e deck_links_ok del blocco VIDEO; touch non serve: il trigger qui sotto
-- scrive da solo le date). NON tocca public.profiles: nessuna grant, nessuna revoke (schema-guard.mjs resta com'è).
-- Idempotente: create ... if not exists, add column if not exists, create or replace, drop policy/constraint if exists.
--
-- Sicurezza, in breve:
--   - il permesso di scrivere sta in UNA funzione, can_publish_guides(uid), uguale a canPublishGuides di
--     src/lib/community/badges.ts (Autore, Creator, Pro, Staff e admin; guides.test.ts e badges.test.ts li confrontano);
--   - RLS: le guide pubblicate le legge chiunque; bozze e nascoste solo il proprietario e lo staff (is_staff());
--     insert e update solo con can_publish_guides(auth.uid()), sulla propria riga (lo staff anche sulle altre, per
--     nasconderle); delete del proprietario e dello staff;
--   - grant minime e PER COLONNA per insert e update: slug, owner, date e published_at non si cambiano mai via API;
--   - il trigger guard_community_guide scrive le date, tiene i tetti (100 guide per account; 10 nuove e 3 prime
--     pubblicazioni al giorno contate su un REGISTRO che l'utente non può cancellare, community_guide_events: eliminare
--     e ricreare una guida non azzera nulla), riserva lo stato 'hidden' allo staff e, dopo che lo staff ha nascosto una
--     guida, per 24 ore non lascia pubblicare altro al proprietario (una guida nascosta non torna online eliminandola e
--     ripubblicandola identica); controlla le traduzioni scritte (testo semplice, stesse sezioni dell'originale);
--   - testo semplice: niente caratteri di controllo (a capo ammessi solo in riassunto e corpo delle sezioni), niente
--     invisibili, riempitivi (Hangul, Braille vuoto) né segni di direzione del testo, al massimo una riga vuota di fila
--     (anche se "vuota" di spazi Unicode); il sito lo mostra come testo;
--   - copertina caricata (cover_path) solo nella cartella del proprietario e solo per i ruoli con vetrina; il bucket
--     lo porta il pacchetto VETRINA (finché non c'è, il sito usa solo le copertine preimpostate del media kit).
-- =====================================================================================================

-- ---------- chi può pubblicare le guide ----------
-- Stessi ruoli di GUIDE_BADGES in src/lib/community/badges.ts (più gli admin): due colonne che l'utente non cambia
-- (revoke update on profiles e trigger protect_profile_badge). Security definer: legge profiles con i privilegi del
-- proprietario, ma dice solo sì o no (e i ruoli sono comunque pubblici).
create or replace function public.can_publish_guides(uid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select uid is not null and exists (
    select 1 from public.profiles p
     where p.id = uid and (p.role = 'admin' or p.badge in ('author','creator','pro','staff'))
  );
$$;
-- La usano le policy di insert e update (solo authenticated).
revoke all on function public.can_publish_guides(uuid) from public, anon;
grant execute on function public.can_publish_guides(uuid) to authenticated, service_role;

-- ---------- testo semplice ----------
-- Da `minlen` a `maxlen` caratteri (punti di codice, come `char_length`), almeno un carattere che non sia uno spazio
-- (nemmeno uno spazio Unicode: NBSP, spazio ideografico…), niente caratteri di controllo (con `multiline` l'a capo è
-- ammesso), niente separatori di riga Unicode, niente trattino morbido, segni di direzione del testo, invisibili e
-- riempitivi (U+115F, U+1160, U+2060-2064, U+2800, U+3164, U+FFA0: con quelli un titolo sembra vuoto), al massimo una
-- riga vuota di fila (le righe fatte solo di spazi Unicode contano come vuote), niente spazi in testa o in coda.
-- Gli stessi controlli di `plainTextOk` in src/lib/community/guides.ts (il sito pulisce prima di scrivere; il test
-- guides.test.ts confronta la lista degli invisibili con quella del codice).
create or replace function public.community_guide_text_ok(t text, minlen integer, maxlen integer, multiline boolean)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select t is not null
     and char_length(t) between minlen and maxlen
     and (char_length(t) = 0 or (regexp_replace(t, '[[:space:]\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]', '', 'g') <> '' and t = btrim(t, E' \n')))
     and (case when multiline then replace(t, chr(10), '') else t end) !~ '[[:cntrl:]]'
     and t !~ '[\u2028\u2029]'
     and translate(t, U&'\00AD\061C\115F\1160\200B\200E\200F\202A\202B\202C\202D\202E\2060\2061\2062\2063\2064\2066\2067\2068\2069\2800\3164\FEFF\FFA0', '') = t
     and strpos(regexp_replace(t, '[ \u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]', '', 'g'), repeat(chr(10), 3)) = 0;
$$;

-- Le sezioni: un array di oggetti con le sole chiavi heading e body. Una guida pubblicata (o nascosta) ha da 1 a 12
-- sezioni con titolo (1-80, una riga) e testo (1-4000) pieni; una bozza da 0 a 12, con titolo e testo anche vuoti.
-- I CASE fissano l'ordine dei controlli (Postgres non garantisce quello di AND/OR).
create or replace function public.community_guide_sections_ok(s jsonb, complete boolean)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select case
    when s is null or jsonb_typeof(s) <> 'array' then false
    when jsonb_array_length(s) > 12 then false
    when complete and jsonb_array_length(s) < 1 then false
    else not exists (
      select 1 from jsonb_array_elements(s) as e(x)
       where case
         when jsonb_typeof(x) <> 'object' then true
         when (x - 'heading' - 'body') <> '{}'::jsonb then true
         when jsonb_typeof(x -> 'heading') is distinct from 'string' then true
         when jsonb_typeof(x -> 'body') is distinct from 'string' then true
         when not public.community_guide_text_ok(x ->> 'heading', case when complete then 1 else 0 end, 80, false) then true
         else not public.community_guide_text_ok(x ->> 'body', case when complete then 1 else 0 end, 4000, true)
       end)
  end;
$$;

-- Una traduzione salvata in `translations` (una lingua): {hash, at, model, parts, guide: {summary, sections}} con il
-- testo che rispetta le regole del testo semplice, lo stesso numero di sezioni dell'originale (`n`) e lunghezze fino a
-- 2,5 volte i massimi dell'originale più 200 (la tolleranza di `parseTranslation`; in guides.ts TRANSLATION_LIMITS e
-- `translationTextOk`, confrontati dal test: una traduzione è più lunga dell'originale, non a piacere). Le traduzioni le
-- scrive il sito con la sessione del proprietario: senza questo controllo chi ha il ruolo potrebbe metterci via API
-- testo che le regole vietano.
create or replace function public.community_guide_translation_ok(t jsonb, n integer)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select case
    when t is null or jsonb_typeof(t) is distinct from 'object' then false
    when octet_length(t::text) > 190000 then false
    when (t - 'hash' - 'at' - 'model' - 'parts' - 'guide') <> '{}'::jsonb then false
    when jsonb_typeof(t -> 'hash') is distinct from 'string' or char_length(t ->> 'hash') > 32 then false
    when t ? 'at' and (jsonb_typeof(t -> 'at') is distinct from 'string' or char_length(t ->> 'at') > 40) then false
    when t ? 'model' and (jsonb_typeof(t -> 'model') is distinct from 'string' or char_length(t ->> 'model') > 80) then false
    when t ? 'parts' and (jsonb_typeof(t -> 'parts') is distinct from 'array' or jsonb_array_length(t -> 'parts') > 13) then false
    when t ? 'parts' and exists (select 1 from jsonb_array_elements(t -> 'parts') as p(x) where jsonb_typeof(x) is distinct from 'string' or char_length(x #>> '{}') > 32) then false
    when jsonb_typeof(t -> 'guide') is distinct from 'object' then false
    when ((t -> 'guide') - 'summary' - 'sections') <> '{}'::jsonb then false
    when jsonb_typeof(t -> 'guide' -> 'summary') is distinct from 'string' then false
    when not public.community_guide_text_ok(t -> 'guide' ->> 'summary', 1, 950, true) then false
    when jsonb_typeof(t -> 'guide' -> 'sections') is distinct from 'array' then false
    when jsonb_array_length(t -> 'guide' -> 'sections') <> n then false
    else not exists (
      select 1 from jsonb_array_elements(t -> 'guide' -> 'sections') as e(x)
       where case
         when jsonb_typeof(x) is distinct from 'object' then true
         when (x - 'heading' - 'body') <> '{}'::jsonb then true
         when jsonb_typeof(x -> 'heading') is distinct from 'string' then true
         when jsonb_typeof(x -> 'body') is distinct from 'string' then true
         when not public.community_guide_text_ok(x ->> 'heading', 1, 400, false) then true
         else not public.community_guide_text_ok(x ->> 'body', 1, 10200, true)
       end)
  end;
$$;

-- Le carte citate: slug del database carte del sito (il sito controlla che esistano), al massimo 24, senza doppioni.
create or replace function public.community_guide_cards_ok(c text[])
returns boolean language sql immutable set search_path = pg_catalog as $$
  select c is not null
     and cardinality(c) <= 24
     and not exists (select 1 from unnest(c) as u(x) where x is null or x !~ '^[a-z0-9]([a-z0-9-]{0,78}[a-z0-9])?$')
     and cardinality(c) = (select count(distinct x) from unnest(c) as u(x));
$$;

-- Funzioni pure dentro i vincoli e nel trigger: girano con i privilegi di chi scrive la riga (authenticated), niente anon.
revoke all on function public.community_guide_text_ok(text, integer, integer, boolean) from public, anon;
revoke all on function public.community_guide_sections_ok(jsonb, boolean) from public, anon;
revoke all on function public.community_guide_translation_ok(jsonb, integer) from public, anon;
revoke all on function public.community_guide_cards_ok(text[]) from public, anon;
grant execute on function public.community_guide_text_ok(text, integer, integer, boolean) to authenticated, service_role;
grant execute on function public.community_guide_sections_ok(jsonb, boolean) to authenticated, service_role;
grant execute on function public.community_guide_translation_ok(jsonb, integer) to authenticated, service_role;
grant execute on function public.community_guide_cards_ok(text[]) to authenticated, service_role;

-- ---------- la tabella ----------
create table if not exists public.community_guides (
  id uuid primary key default gen_random_uuid(),
  -- slug leggibile dal titolo più 4 caratteri casuali (newSlug, come i mazzi); non si cambia mai
  slug text unique not null,
  owner uuid not null references public.profiles(id) on delete cascade,
  -- lingua in cui l'autore ha scritto la guida; il sito la traduce nelle altre due (colonna translations)
  lang text not null default 'en',
  -- il titolo non si traduce (come il nome di un mazzo)
  title text not null,
  summary text not null default '',
  sections jsonb not null default '[]'::jsonb,
  category text not null default 'decks',
  cards text[] not null default '{}'::text[],
  -- video e risorse con le regole dei mazzi (blocco VIDEO: deck_videos_ok, deck_links_ok)
  videos jsonb not null default '[]'::jsonb,
  links jsonb not null default '[]'::jsonb,
  -- copertina: un'immagine del media kit ufficiale in public/media (contenuto, come le copertine delle guide del sito;
  -- GUIDE_COVERS in guides.ts) o un'immagine caricata dal proprietario (cover_path, pacchetto VETRINA)
  cover_preset text not null default 'keyart-king-arthur',
  cover_path text,
  status text not null default 'draft',
  -- traduzioni automatiche: {"it": {"hash": "…", "at": "…", "model": "…", "parts": [...], "guide": {"summary": "…", "sections": [...]}}}
  translations jsonb not null default '{}'::jsonb,
  -- parole del testo originale e impronta del testo (communityGuideWords e communityGuideHash di guides.ts), scritte dal
  -- sito insieme al testo: servono agli elenchi e alla sitemap, che così non leggono sezioni e traduzioni intere
  words integer,
  text_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- prima pubblicazione: la scrive solo il trigger; serve alla data dell'articolo
  published_at timestamptz
);
alter table public.community_guides add column if not exists words integer;
alter table public.community_guides add column if not exists text_hash text;
alter table public.community_guides alter column cover_preset set default 'keyart-king-arthur';
create index if not exists community_guides_status_idx on public.community_guides (status, published_at desc);
create index if not exists community_guides_owner_idx on public.community_guides (owner, updated_at desc);

-- Vincoli (tolti e rimessi: si possono cambiare in una migrazione successiva). Le regole dipendono dallo stato: una
-- bozza si salva anche a metà, una guida pubblicata (o nascosta dallo staff) ha i minimi della pagina pubblica.
alter table public.community_guides drop constraint if exists community_guides_slug_check;
alter table public.community_guides add constraint community_guides_slug_check
  check (char_length(slug) between 3 and 60 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
alter table public.community_guides drop constraint if exists community_guides_lang_check;
alter table public.community_guides add constraint community_guides_lang_check check (lang in ('en','it','es','fr'));
alter table public.community_guides drop constraint if exists community_guides_status_check;
alter table public.community_guides add constraint community_guides_status_check check (status in ('draft','published','hidden'));
alter table public.community_guides drop constraint if exists community_guides_title_check;
alter table public.community_guides add constraint community_guides_title_check
  check (public.community_guide_text_ok(title, case when status = 'draft' then 1 else 10 end, 110, false));
alter table public.community_guides drop constraint if exists community_guides_summary_check;
alter table public.community_guides add constraint community_guides_summary_check
  check (public.community_guide_text_ok(summary, case when status = 'draft' then 0 else 120 end, 300, true));
alter table public.community_guides drop constraint if exists community_guides_sections_check;
alter table public.community_guides add constraint community_guides_sections_check
  check (public.community_guide_sections_ok(sections, status <> 'draft'));
alter table public.community_guides drop constraint if exists community_guides_category_check;
alter table public.community_guides add constraint community_guides_category_check
  check (category in ('game','decks','rank','archetypes','interviews','events','economy'));
alter table public.community_guides drop constraint if exists community_guides_cards_check;
alter table public.community_guides add constraint community_guides_cards_check check (public.community_guide_cards_ok(cards));
alter table public.community_guides drop constraint if exists community_guides_videos_check;
alter table public.community_guides add constraint community_guides_videos_check check (public.deck_videos_ok(videos));
alter table public.community_guides drop constraint if exists community_guides_links_check;
alter table public.community_guides add constraint community_guides_links_check check (public.deck_links_ok(links));
-- GUIDE_COVER_PRESETS di guides.ts (il test li confronta, e controlla che i file esistano in public/media)
alter table public.community_guides drop constraint if exists community_guides_cover_preset_check;
alter table public.community_guides add constraint community_guides_cover_preset_check
  check (cover_preset in ('keyart-king-arthur','keyart-mulan','keyart-queen-of-hearts','keyart-robin-hood','keyart-winnie-the-pooh','keyart-puss-in-boots','keyart-goldi','keyart-queen-of-hearts-cyber','keyart-red-wide','hero-1920','ls-two-ways','ls-zero-pay-to-win','ls-real-collecting','ls-collect-them-all','ls-collector-pack'));
alter table public.community_guides drop constraint if exists community_guides_cover_path_check;
alter table public.community_guides add constraint community_guides_cover_path_check
  check (cover_path is null or (char_length(cover_path) <= 200
    and cover_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/([A-Za-z0-9_-]{1,60}/)?[A-Za-z0-9_-]{1,80}\.(png|jpg|jpeg|webp)$'));
alter table public.community_guides drop constraint if exists community_guides_translations_check;
alter table public.community_guides add constraint community_guides_translations_check
  check (jsonb_typeof(translations) = 'object' and octet_length(translations::text) <= 400000);
alter table public.community_guides drop constraint if exists community_guides_words_check;
alter table public.community_guides add constraint community_guides_words_check check (words is null or words between 0 and 100000);
alter table public.community_guides drop constraint if exists community_guides_text_hash_check;
alter table public.community_guides add constraint community_guides_text_hash_check check (text_hash is null or text_hash ~ '^[0-9a-z]{1,16}$');

-- ---------- registro per i tetti giornalieri ----------
-- Una riga per ogni guida creata ('create'), per ogni prima pubblicazione ('publish') e per ogni guida nascosta dallo
-- staff ('hide'). La scrive solo il trigger guard_community_guide (security definer); nessuno la legge o la cancella via
-- API (RLS senza policy, nessuna grant): eliminare una guida non toglie le sue righe, quindi i tetti non si aggirano con
-- pubblica → elimina → ricrea. Le righe più vecchie di una settimana le toglie il trigger stesso.
create table if not exists public.community_guide_events (
  id bigint generated always as identity primary key,
  owner uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  at timestamptz not null default now()
);
alter table public.community_guide_events drop constraint if exists community_guide_events_kind_check;
alter table public.community_guide_events add constraint community_guide_events_kind_check check (kind in ('create','publish','hide'));
create index if not exists community_guide_events_owner_idx on public.community_guide_events (owner, kind, at desc);
alter table public.community_guide_events enable row level security;
revoke all on public.community_guide_events from anon, authenticated;

-- ---------- trigger: date, tetti, stato riservato allo staff, traduzioni, copertina ----------
-- Privilegiato = lo staff (is_staff: admin o tag Staff) o una connessione diretta (auth.uid() nullo: script dello staff,
-- traduzioni degli arretrati). Errori con codici letti da `guideErrorCode` in src/lib/community/guides.ts.
create or replace function public.guard_community_guide()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := auth.uid();
  privileged boolean := me is null or public.is_staff();
  n int;
  k text;
  v jsonb;
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.updated_at := now();
    new.published_at := case when new.status = 'published' then now() else null end;
    -- le richieste parallele dello stesso utente passano una alla volta: i tetti valgono anche così
    perform pg_advisory_xact_lock(hashtext('om_guides:' || new.owner::text));
    if not privileged then
      if new.status not in ('draft', 'published') then raise exception 'guide_status' using errcode = '42501'; end if;
      select count(*) into n from public.community_guides where owner = new.owner;
      if n >= 100 then raise exception 'guide_limit' using errcode = '23514'; end if;
      -- i tetti giornalieri contano il registro, non le guide ancora presenti
      select count(*) into n from public.community_guide_events where owner = new.owner and kind = 'create' and at > now() - interval '1 day';
      if n >= 10 then raise exception 'guide_rate' using errcode = '23514'; end if;
      if new.status = 'published' then
        if exists (select 1 from public.community_guide_events where owner = new.owner and kind = 'hide' and at > now() - interval '1 day') then
          raise exception 'guide_hidden_recent' using errcode = '42501';
        end if;
        select count(*) into n from public.community_guide_events where owner = new.owner and kind = 'publish' and at > now() - interval '1 day';
        if n >= 3 then raise exception 'guide_daily_limit' using errcode = '23514'; end if;
      end if;
    end if;
    delete from public.community_guide_events where owner = new.owner and at < now() - interval '7 days';
    insert into public.community_guide_events (owner, kind) values (new.owner, 'create');
    if new.status = 'published' then insert into public.community_guide_events (owner, kind) values (new.owner, 'publish'); end if;
  else
    -- id, proprietario, slug e nascita non cambiano mai (le grant per colonna non li danno; questo vale anche per lo staff)
    if me is not null and (new.id is distinct from old.id or new.owner is distinct from old.owner
        or new.slug is distinct from old.slug or new.created_at is distinct from old.created_at) then
      raise exception 'guide_reserved_fields' using errcode = '42501';
    end if;
    -- 'hidden' è la moderazione dello staff: il proprietario non la toglie e non la mette
    if not privileged and (old.status = 'hidden' or new.status = 'hidden') then
      raise exception 'guide_hidden' using errcode = '42501';
    end if;
    new.published_at := old.published_at;
    -- una guida che va (o torna) online: niente per 24 ore dopo una guida nascosta dallo staff; la prima pubblicazione
    -- conta nel tetto giornaliero
    if new.status = 'published' and old.status is distinct from 'published' and not privileged then
      perform pg_advisory_xact_lock(hashtext('om_guides:' || new.owner::text));
      if exists (select 1 from public.community_guide_events where owner = new.owner and kind = 'hide' and at > now() - interval '1 day') then
        raise exception 'guide_hidden_recent' using errcode = '42501';
      end if;
      if old.published_at is null then
        select count(*) into n from public.community_guide_events where owner = new.owner and kind = 'publish' and at > now() - interval '1 day';
        if n >= 3 then raise exception 'guide_daily_limit' using errcode = '23514'; end if;
      end if;
    end if;
    if new.status = 'published' and old.published_at is null then
      new.published_at := now();
      insert into public.community_guide_events (owner, kind) values (new.owner, 'publish');
    end if;
    if new.status = 'hidden' and old.status is distinct from 'hidden' then
      insert into public.community_guide_events (owner, kind) values (new.owner, 'hide');
    end if;
    -- parole e impronta le scrive il sito insieme al testo: se il testo cambia senza una nuova impronta (una scrittura
    -- via API che non passa dal sito), si azzerano e gli elenchi trattano la guida come da ricontare (non indicizzabile)
    if (new.lang, new.summary, new.sections) is distinct from (old.lang, old.summary, old.sections)
       and new.text_hash is not distinct from old.text_hash then
      new.words := null;
      new.text_hash := null;
    end if;
    -- traduzioni: ogni lingua cambiata deve essere un'altra lingua del sito e rispettare le regole del testo semplice,
    -- con le stesse sezioni del testo attuale (vale per tutti, staff e script compresi)
    if new.translations is distinct from old.translations then
      for k, v in select e.key, e.value from jsonb_each(new.translations) as e loop
        if v is distinct from (old.translations -> k) then
          if k not in ('en', 'it', 'es', 'fr') or k = new.lang
             or not public.community_guide_translation_ok(v, jsonb_array_length(new.sections)) then
            raise exception 'guide_translation' using errcode = '23514';
          end if;
        end if;
      end loop;
    end if;
    -- la data di aggiornamento è quella dell'autore: scrivere le traduzioni non la sposta (come i mazzi)
    if (to_jsonb(new) - 'translations' - 'updated_at' - 'published_at' - 'words' - 'text_hash')
        is distinct from (to_jsonb(old) - 'translations' - 'updated_at' - 'published_at' - 'words' - 'text_hash') then
      new.updated_at := now();
    else
      new.updated_at := old.updated_at;
    end if;
  end if;
  -- copertina caricata: solo nella cartella del proprietario e solo per i ruoli con vetrina (SHOWCASE_BADGES di badges.ts)
  if new.cover_path is not null and (tg_op = 'INSERT' or new.cover_path is distinct from old.cover_path) then
    if split_part(new.cover_path, '/', 1) <> new.owner::text then raise exception 'guide_cover_path' using errcode = '42501'; end if;
    if not exists (select 1 from public.profiles p where p.id = new.owner and (p.role = 'admin' or p.badge in ('creator','author','pro','staff'))) then
      raise exception 'guide_cover_role' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.guard_community_guide() from public, anon, authenticated;
drop trigger if exists community_guides_guard on public.community_guides;
create trigger community_guides_guard before insert or update on public.community_guides
  for each row execute function public.guard_community_guide();

-- ---------- RLS ----------
alter table public.community_guides enable row level security;

-- Le pubblicate le legge chiunque. Una policy a parte per le altre: is_staff() non si esegue come anon.
drop policy if exists "community guides: published are public" on public.community_guides;
create policy "community guides: published are public" on public.community_guides for select to anon, authenticated
  using (status = 'published');
drop policy if exists "community guides: owners and staff read all" on public.community_guides;
create policy "community guides: owners and staff read all" on public.community_guides for select to authenticated
  using (owner = (select auth.uid()) or (select public.is_staff()));
drop policy if exists "community guides: roles insert own" on public.community_guides;
create policy "community guides: roles insert own" on public.community_guides for insert to authenticated
  with check (owner = (select auth.uid()) and public.can_publish_guides((select auth.uid())));
drop policy if exists "community guides: owners and staff update" on public.community_guides;
create policy "community guides: owners and staff update" on public.community_guides for update to authenticated
  using (owner = (select auth.uid()) or (select public.is_staff()))
  with check (public.can_publish_guides((select auth.uid())) and (owner = (select auth.uid()) or (select public.is_staff())));
drop policy if exists "community guides: owners and staff delete" on public.community_guides;
create policy "community guides: owners and staff delete" on public.community_guides for delete to authenticated
  using (owner = (select auth.uid()) or (select public.is_staff()));

-- Grant minime (Supabase dà ALL di default ad anon e authenticated sulle tabelle nuove): lettura per tutti, scrittura
-- per chi ha fatto l'accesso e solo sulle colonne che il sito scrive. La revoke sulla tabella toglie anche le grant per
-- colonna, quindi il blocco si può rilanciare.
revoke all on public.community_guides from anon, authenticated;
grant select on public.community_guides to anon, authenticated;
grant insert (slug, owner, lang, title, summary, sections, category, cards, videos, links, cover_preset, cover_path, status, words, text_hash)
  on public.community_guides to authenticated;
grant update (lang, title, summary, sections, category, cards, videos, links, cover_preset, cover_path, status, translations, words, text_hash)
  on public.community_guides to authenticated;
grant delete on public.community_guides to authenticated;

-- ---------- segnalazioni (gemella di deck_reports) ----------
-- Una per utente e per guida; solo sulle guide pubblicate e mai sulla propria; le legge lo staff (e ognuno le sue).
-- Il sito avvisa il canale privato dello staff su Discord (DISCORD_FEEDBACK_WEBHOOK_URL) solo alla prima segnalazione
-- di una guida nelle 24 ore (`first_in_day`, scritta dal trigger): una raffica di segnalazioni non riempie il canale.
-- Si cancellano con l'account di chi le ha fatte (on delete cascade, come dice l'informativa).
create table if not exists public.community_guide_reports (
  id bigint generated always as identity primary key,
  guide_id uuid not null references public.community_guides(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  first_in_day boolean not null default false,
  unique (guide_id, user_id)
);
alter table public.community_guide_reports add column if not exists first_in_day boolean not null default false;
alter table public.community_guide_reports drop constraint if exists community_guide_reports_user_id_fkey;
alter table public.community_guide_reports add constraint community_guide_reports_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
create index if not exists community_guide_reports_user_idx on public.community_guide_reports (user_id, created_at desc);
create index if not exists community_guide_reports_guide_idx on public.community_guide_reports (guide_id, created_at desc);
alter table public.community_guide_reports drop constraint if exists community_guide_reports_reason_check;
alter table public.community_guide_reports add constraint community_guide_reports_reason_check
  check (public.community_guide_text_ok(reason, 3, 500, true));

-- Al massimo 5 segnalazioni al giorno per utente (lo staff no); data e `first_in_day` le scrive il database.
create or replace function public.guard_community_guide_report()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  n int;
begin
  new.created_at := now();
  if auth.uid() is not null and not public.is_staff() then
    perform pg_advisory_xact_lock(hashtext('om_guide_reports:' || auth.uid()::text));
    select count(*) into n from public.community_guide_reports where user_id = auth.uid() and created_at > now() - interval '1 day';
    if n >= 5 then raise exception 'report_rate' using errcode = '23514'; end if;
  end if;
  perform pg_advisory_xact_lock(hashtext('om_guide_report_g:' || new.guide_id::text));
  new.first_in_day := not exists (
    select 1 from public.community_guide_reports r where r.guide_id = new.guide_id and r.created_at > now() - interval '1 day'
  );
  return new;
end $$;
revoke all on function public.guard_community_guide_report() from public, anon, authenticated;
drop trigger if exists community_guide_reports_guard on public.community_guide_reports;
create trigger community_guide_reports_guard before insert on public.community_guide_reports
  for each row execute function public.guard_community_guide_report();

alter table public.community_guide_reports enable row level security;
drop policy if exists "guide reports: users report published guides" on public.community_guide_reports;
create policy "guide reports: users report published guides" on public.community_guide_reports for insert to authenticated
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.community_guides g where g.id = guide_id and g.status = 'published' and g.owner <> (select auth.uid())));
-- Lo staff le legge tutte; ognuno le sue (serve a rileggere `first_in_day` dopo l'invio)
drop policy if exists "guide reports: staff read" on public.community_guide_reports;
drop policy if exists "guide reports: own and staff read" on public.community_guide_reports;
create policy "guide reports: own and staff read" on public.community_guide_reports for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));
drop policy if exists "guide reports: staff delete" on public.community_guide_reports;
create policy "guide reports: staff delete" on public.community_guide_reports for delete to authenticated
  using ((select public.is_staff()));

revoke all on public.community_guide_reports from anon, authenticated;
grant insert (guide_id, user_id, reason) on public.community_guide_reports to authenticated;
grant select, delete on public.community_guide_reports to authenticated;

-- Le regole anche nel catalogo del database, per chi lo apre dalla dashboard di Supabase.
comment on table public.community_guides is 'Guide della community pubblicate da Autore, Creator, Pro e Staff (27/09/2026). Regole in src/lib/community/guides.ts; permesso in can_publish_guides; documentazione in docs/guide-community.md.';
comment on table public.community_guide_events is 'Registro dei tetti giornalieri delle guide della community (create, prime pubblicazioni, guide nascoste): lo scrive solo il trigger guard_community_guide.';
comment on function public.can_publish_guides(uuid) is 'Chi pubblica guide senza passare dallo staff: Autore, Creator, Pro, Staff e admin (canPublishGuides in src/lib/community/badges.ts).';

-- ===== 27/09/2026: DATE E FOTO =====
-- =====================================================================================================
-- Revisione dell'integrazione dei profili del 27/09/2026 (VETRINA, SEGUI, TRAGUARDI, GUIDE): date che l'utente poteva
-- scrivere via API, parole delle guide dichiarate dal sito, foto esterne nei profili nuovi. Idempotente, come tutto il
-- file. Nessuna grant né revoke su public.profiles (scripts/schema-guard.mjs): l'unica scrittura sui profili è la
-- pulizia una tantum delle foto qui sotto, con la connessione diretta di db-migrate.
--
--   1) created_at di deck_votes, community_decks e tier_lists la scrive solo il database. Le tre tabelle hanno la grant
--      di insert e update sull'intera tabella e nessun trigger fissava la data: con la chiave
--      pubblica e la propria sessione si poteva retrodatare un voto (e con tre account fare un "Mazzo del mese" falso,
--      pacchetto TRAGUARDI), un mazzo o una tier list (date dei traguardi sulla vetrina, ordine di /decks, patch mostrata
--      sul mazzo). Alla creazione vale now(); dopo non cambia più, tranne che per uno script dello staff con la
--      connessione diretta (auth.uid() nullo), che può correggere una data. Il sito non scrive mai created_at su queste
--      tabelle; l'upsert dei voti (castVote) e delle tier list (saveTierList) tiene la data del primo salvataggio.
--   2) community_guides.words: il sito la scrive insieme al testo (communityGuideWords di guides.ts) e la leggono elenchi
--      e sitemap per decidere se una guida si indicizza. Chi ha il ruolo poteva mandare via API un numero qualsiasi
--      (words 99999 su una guida corta: in sitemap e sull'hub come indicizzabile). Un secondo trigger, dopo
--      guard_community_guide, azzera `words` quando supera il massimo possibile per quel testo
--      (community_guide_words_max: i pezzi separati da spazi, barre e apostrofi, un sovrainsieme delle parole di
--      communityGuideWords, quindi il numero giusto passa sempre; guides.test.ts lo prova su dei campioni). Azzerata,
--      la guida esce da elenchi indicizzati e sitemap finché il sito non la risalva.
--   3) Foto dei profili: handle_new_user (in cima al file) prende avatar_url dai metadati dell'accesso solo se è un
--      indirizzo di Discord; qui si puliscono le righe già scritte con un indirizzo diverso (mai quelle con una foto
--      caricata dal sito, avatar_path).
-- =====================================================================================================

-- ---------- 1) date di creazione ----------
create or replace function public.guard_created_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  elsif auth.uid() is not null then
    new.created_at := old.created_at;
  end if;
  return new;
end $$;
-- la funzione di un trigger non si chiama da sola: niente EXECUTE per nessuno (il trigger scatta lo stesso)
revoke all on function public.guard_created_at() from public, anon, authenticated;
drop trigger if exists deck_votes_guard_created on public.deck_votes;
create trigger deck_votes_guard_created before insert or update on public.deck_votes
  for each row execute function public.guard_created_at();
drop trigger if exists community_decks_guard_created on public.community_decks;
create trigger community_decks_guard_created before insert or update on public.community_decks
  for each row execute function public.guard_created_at();
drop trigger if exists tier_lists_guard_created on public.tier_lists;
create trigger tier_lists_guard_created before insert or update on public.tier_lists
  for each row execute function public.guard_created_at();

-- ---------- 2) parole delle guide: mai più del massimo possibile ----------
-- Pezzi del testo originale (riassunto, titoli e testi delle sezioni) separati da spazi, anche Unicode, barre verticali
-- e oblique e apostrofi: ogni separatore di countWords (deckQuality.ts) è anche qui, e qui non serve una lettera, quindi
-- il risultato non è mai minore di communityGuideWords.
create or replace function public.community_guide_words_max(summary text, sections jsonb)
returns integer language sql immutable set search_path = pg_catalog as $$
  select coalesce(sum(cardinality(array_remove(regexp_split_to_array(p.t, '[[:space:]\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff/|''’]+'), ''))), 0)::integer
    from (
      select summary as t
      union all
      select e.x ->> 'heading' from jsonb_array_elements(case when jsonb_typeof(sections) = 'array' then sections else '[]'::jsonb end) as e(x)
      union all
      select e.x ->> 'body' from jsonb_array_elements(case when jsonb_typeof(sections) = 'array' then sections else '[]'::jsonb end) as e(x)
    ) as p
   where p.t is not null
$$;
revoke all on function public.community_guide_words_max(text, jsonb) from public, anon;
grant execute on function public.community_guide_words_max(text, jsonb) to authenticated, service_role;

create or replace function public.guard_community_guide_words()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.words is not null and new.words > public.community_guide_words_max(new.summary, new.sections) then
    new.words := null;
  end if;
  return new;
end $$;
revoke all on function public.guard_community_guide_words() from public, anon, authenticated;
-- il nome viene dopo community_guides_guard: Postgres esegue i trigger nell'ordine dei nomi
drop trigger if exists community_guides_words on public.community_guides;
create trigger community_guides_words before insert or update of words, summary, sections on public.community_guides
  for each row execute function public.guard_community_guide_words();

-- ---------- 3) foto dei profili: solo Discord o la foto caricata dal sito ----------
update public.profiles set avatar_url = null
 where avatar_path is null and avatar_url is not null
   and avatar_url !~ '^https://(cdn\.discordapp\.com|media\.discordapp\.net)/[A-Za-z0-9/_.-]{1,255}(\?size=[0-9]{1,4})?$';

comment on function public.guard_created_at() is 'created_at la scrive solo il database: now() alla creazione, poi fissa (tranne per la connessione diretta dello staff). Voti, mazzi e tier list (27/09/2026).';
comment on function public.community_guide_words_max(text, jsonb) is 'Massimo delle parole possibili di una guida della community (sovrainsieme di communityGuideWords): il trigger community_guides_words azzera words sopra questo numero (27/09/2026).';

-- ===== 29/09/2026: IMMAGINI =====
-- =====================================================================================================
-- IMMAGINI CARICATE PER LE GUIDE E PER I MAZZI (29/09/2026)
-- Richieste di Pierluigi del 29/09/2026. Vega (Creator) non riusciva a cambiare la copertina della sua guida: "aggiungiamo
-- questa funzione, sempre dando le misure richieste per la copertina". E per i Creator: "diamo la possibilità quando
-- sviluppano un deck di sostituire l'artwork della leggendaria per quel deck così da caratterizzare il loro lavoro, anche
-- in questo caso, solo per i creator e con le misure per sostituire l'artwork della carta".
--   1) Copertina caricata di una guida della community: community_guides.cover_path (colonna, vincolo e controllo del
--      ruolo nel blocco GUIDE) punta a <id>/guide/<uuid>.<ext> nel bucket profile-media, 16:9 (1600×900 consigliati,
--      almeno 1200×675), al massimo 2 MB (GUIDE_COVER_* in src/lib/community/guides.ts). Qui: un trigger che vuole la
--      cartella delle guide del proprietario e il file davvero caricato.
--   2) Artwork della Leggendaria di un mazzo: colonna community_decks.art_path, <id>/deck/<uuid>.<ext>, 5:7 come le carte
--      (750×1050 consigliati, almeno 480×672), al massimo 2 MB; solo Creator e Staff, più gli admin (DECK_ART_BADGES di
--      src/lib/community/badges.ts, regole in src/lib/community/deckArt.ts). La carta ufficiale resta nella scheda della
--      carta e nell'anteprima al passaggio del mouse: l'artwork prende il posto dell'illustrazione solo sul mazzo.
--   3) Policy del bucket profile-media rifatte qui, dopo il blocco GUIDE (leggono community_guides, che prima non c'è):
--      prendono il posto di quelle del blocco VETRINA, che restano scritte com'erano e vengono applicate prima. Caricamento
--      anche nelle cartelle guide e deck, tetto di 60 file per i ruoli con vetrina e gli admin (12 per gli altri);
--      cancellazione mai di un file in uso (foto, copertina e sfondo del profilo, copertina di una guida, artwork di un
--      mazzo: profile_media_in_use).
-- Nessuna grant né revoke su public.profiles (scripts/schema-guard.mjs). Idempotente come tutto il file. La colonna nuova
-- dei mazzi la scrive il proprietario con la grant di sempre sulla tabella e la policy "owners update decks".
-- =====================================================================================================

-- ---------- 1) copertine delle guide: la cartella delle guide del proprietario e un file che c'è ----------
-- Con i privilegi di chi salva (profile_media_ok vede solo la sua cartella, un admin tutte): una copertina nuova la mette
-- il proprietario; lo staff che corregge una guida altrui la lascia com'è o sceglie una copertina del media kit.
create or replace function public.guard_community_guide_cover()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.cover_path is not null and (tg_op = 'INSERT' or new.cover_path is distinct from old.cover_path) then
    if new.cover_path !~ ('^' || new.owner::text || '/guide/[A-Za-z0-9_-]{8,64}\.(png|jpg|jpeg|webp)$') then
      raise exception 'guide_cover_path' using errcode = '42501';
    end if;
    if not public.profile_media_ok(new.cover_path, 2097152) then
      raise exception 'guide_cover_file' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.guard_community_guide_cover() from public, anon, authenticated;
drop trigger if exists community_guides_cover on public.community_guides;
create trigger community_guides_cover before insert or update of cover_path on public.community_guides
  for each row execute function public.guard_community_guide_cover();
create index if not exists community_guides_cover_path_idx on public.community_guides (cover_path) where cover_path is not null;

-- ---------- 2) artwork della Leggendaria di un mazzo ----------
alter table public.community_decks add column if not exists art_path text;
alter table public.community_decks drop constraint if exists community_decks_art_path_check;
alter table public.community_decks add constraint community_decks_art_path_check
  check (art_path is null or (char_length(art_path) <= 200 and art_path ~ ('^' || owner::text || '/deck/[A-Za-z0-9_-]{8,64}\.(png|jpg|jpeg|webp)$')));
create index if not exists community_decks_art_path_idx on public.community_decks (art_path) where art_path is not null;

-- Un artwork nuovo lo mette solo un mazzo di un Creator o dello Staff (o di un admin), e solo con un file che c'è, di tipo
-- e peso ammessi. Toglierlo si può sempre. Chi perde il ruolo lo tiene nel database, ma il sito non lo mostra più
-- (deckArtUrl in src/lib/community/deckArt.ts guarda il ruolo di oggi).
create or replace function public.guard_deck_art()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.art_path is not null and (tg_op = 'INSERT' or new.art_path is distinct from old.art_path) then
    if not exists (select 1 from public.profiles p where p.id = new.owner and (p.role = 'admin' or p.badge in ('creator', 'staff'))) then
      raise exception 'deck_art_role' using errcode = '42501';
    end if;
    if not public.profile_media_ok(new.art_path, 2097152) then
      raise exception 'deck_art_file' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.guard_deck_art() from public, anon, authenticated;
drop trigger if exists community_decks_art on public.community_decks;
create trigger community_decks_art before insert or update of art_path on public.community_decks
  for each row execute function public.guard_deck_art();

-- ---------- 3) bucket profile-media: cartelle nuove, tetto dei file, file in uso ----------
-- Un file del bucket è in uso? Foto, copertina o sfondo del profilo del proprietario della cartella, copertina di una sua
-- guida (anche in bozza o nascosta), artwork di un suo mazzo (anche privato o nascosto). Security definer perché la
-- risposta deve valere anche per le righe che chi cancella non vede (le bozze altrui per un admin): dice solo sì o no, su
-- un percorso che chi chiama conosce già. La usa la policy di cancellazione qui sotto (e --orphans di
-- scripts/clear-profile-media.mjs).
create or replace function public.profile_media_in_use(p text)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  folder text := split_part(p, '/', 1);
  uid uuid;
begin
  if folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  uid := folder::uuid;
  return exists (select 1 from public.profiles pr where pr.id = uid and (pr.avatar_path = p or pr.cover_path = p or pr.background_path = p))
      or exists (select 1 from public.community_guides g where g.owner = uid and g.cover_path = p)
      or exists (select 1 from public.community_decks d where d.owner = uid and d.art_path = p);
end $$;
revoke all on function public.profile_media_in_use(text) from public, anon;
grant execute on function public.profile_media_in_use(text) to authenticated, service_role;

do $$
begin
  -- <id>/avatar/<file> per tutti; cover, background e guide per i ruoli con vetrina e gli admin (per le guide sono gli
  -- stessi ruoli di can_publish_guides); deck per Creator, Staff e admin. Tetto dei file per utente: 60 per i ruoli con
  -- vetrina e gli admin, 12 per gli altri (MEDIA_FILES_MAX_SHOWCASE e MEDIA_FILES_MAX in profileMedia.ts). Niente peso
  -- qui: lo Storage prova la policy prima di ricevere il file (vedi il blocco VETRINA).
  drop policy if exists "profile media upload" on storage.objects;
  create policy "profile media upload" on storage.objects for insert to authenticated with check (
    bucket_id = 'profile-media'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = auth.uid()::text
    and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
    and storage.filename(name) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$'
    and public.profile_media_count() < (case when exists (select 1 from public.profiles p where p.id = auth.uid() and (p.badge in ('creator', 'author', 'pro', 'staff') or p.role = 'admin')) then 60 else 12 end)
    and (
      (storage.foldername(name))[2] = 'avatar'
      or ((storage.foldername(name))[2] in ('cover', 'background', 'guide')
          and exists (select 1 from public.profiles p where p.id = auth.uid() and (p.badge in ('creator', 'author', 'pro', 'staff') or p.role = 'admin')))
      or ((storage.foldername(name))[2] = 'deck'
          and exists (select 1 from public.profiles p where p.id = auth.uid() and (p.badge in ('creator', 'staff') or p.role = 'admin')))
    )
  );
  -- si cancellano i propri file (un admin anche quelli degli altri), mai un file in uso: prima si svuota il campo, poi
  -- si toglie il file
  drop policy if exists "profile media owners delete" on storage.objects;
  create policy "profile media owners delete" on storage.objects for delete to authenticated using (
    bucket_id = 'profile-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
    and not public.profile_media_in_use(name)
  );
exception when others then
  raise notice 'Policy del bucket profile-media non aggiornate da SQL (%): vedi README ("Immagini delle guide e dei mazzi").', sqlerrm;
end $$;

comment on column public.community_decks.art_path is 'Artwork della Leggendaria caricato dal proprietario (bucket profile-media, <owner>/deck/<file>, 5:7, 2 MB; 29/09/2026). Solo Creator e Staff (e admin): trigger guard_deck_art.';
comment on function public.guard_community_guide_cover() is 'Copertina caricata di una guida: nella cartella delle guide del proprietario (<owner>/guide/<file>) e un file che c''è, al massimo 2 MB (29/09/2026).';
comment on function public.guard_deck_art() is 'Artwork del mazzo: solo Creator, Staff e admin, e un file che c''è nel bucket, al massimo 2 MB (29/09/2026).';
comment on function public.profile_media_in_use(text) is 'Un file del bucket profile-media è in uso (profilo, copertina di una guida, artwork di un mazzo del proprietario della cartella): la policy di cancellazione non lo lascia togliere (29/09/2026).';

-- ===== 29/09/2026: FUMETTI =====
-- =====================================================================================================
-- FUMETTI DEI CREATOR PUBBLICATI COME NEWS (pacchetto FUMETTI, 29/09/2026)
-- Richiesta di Pierluigi del 29/09/2026: Vega (Creator) disegna fumetti che raccontano notizie e storie del gioco, uno a
-- settimana, e "vorrei che venisse fatta come news"; alla domanda su come, ha scelto "Li pubblica lei da sola" e la firma
-- "Vega". Chi ha il ruolo Creator o Staff (o è admin: can_publish_comics, uguale a canPublishComics di
-- src/lib/community/badges.ts) pubblica da /news/comics/new: tavole (immagini verticali, 1080 px di larghezza, fino a
-- 1920 di altezza, fino a 10), copertina 16:9, titolo, presentazione e il testo di ogni tavola (dialoghi e didascalie).
-- Il fumetto esce fra le news (home, /news, sitemap, Discord) con una pagina sua, /news/comics/<slug>, firmata da chi l'ha
-- disegnato; il sito traduce titolo, presentazione e testi delle tavole nelle altre due lingue.
-- Codice: src/lib/community/comics.ts (regole pure, test in comics.test.ts che le confrontano con questo blocco),
-- comicQueries.ts, comicActions.ts, comicTranslate.ts, comicNotify.ts; documentazione in docs/fumetti.md.
--
-- Viene dopo IMMAGINI: rifà le due policy del bucket profile-media (cartella nuova `comic`, con un tetto suo di 300 file
-- che non consuma quello della vetrina) e la funzione dei file in uso, e aggiunge il tipo `comic_published` agli avvisi
-- del pacchetto SEGUI (vincoli e notify_followers rifatti qui). Nessuna grant né revoke su public.profiles
-- (scripts/schema-guard.mjs). Idempotente come tutto il file.
-- =====================================================================================================

-- ---------- chi può pubblicare i fumetti ----------
-- Creator e Staff, più gli admin (COMIC_BADGES di badges.ts; comics.test.ts li confronta). Security definer come
-- can_publish_guides: legge profiles, dice solo sì o no (e i ruoli sono comunque pubblici).
create or replace function public.can_publish_comics(uid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select uid is not null and exists (
    select 1 from public.profiles p
     where p.id = uid and (p.role = 'admin' or p.badge in ('creator','staff'))
  );
$$;
revoke all on function public.can_publish_comics(uuid) from public, anon;
grant execute on function public.can_publish_comics(uuid) to authenticated, service_role;

-- ---------- tavole ----------
-- Un array di oggetti con le sole chiavi path, width, height e text: il file nella cartella dei fumetti del proprietario
-- (`<owner>/comic/<file>`, il nome che sceglie il sito), le misure dell'immagine già ridotta dal browser (larghezza
-- 100-1080, altezza 100-1920, numeri interi) e il testo della tavola in testo semplice (dialoghi e didascalie, 0-1500,
-- più righe). Un fumetto pubblicato (o nascosto) ha da 1 a 10 tavole, una bozza da 0 a 10; mai due volte lo stesso file.
-- Gli stessi limiti di COMIC_LIMITS in comics.ts. I CASE fissano l'ordine dei controlli.
create or replace function public.community_comic_pages_ok(p jsonb, owner uuid, complete boolean)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select case
    when p is null or jsonb_typeof(p) <> 'array' then false
    when jsonb_array_length(p) > 10 then false
    when complete and jsonb_array_length(p) < 1 then false
    when exists (
      select 1 from jsonb_array_elements(p) as e(x)
       where case
         when jsonb_typeof(x) <> 'object' then true
         when (x - 'path' - 'width' - 'height' - 'text') <> '{}'::jsonb then true
         when jsonb_typeof(x -> 'path') is distinct from 'string' then true
         when char_length(x ->> 'path') > 200 then true
         when (x ->> 'path') !~ ('^' || owner::text || '/comic/[A-Za-z0-9_-]{8,64}\.(png|jpg|jpeg|webp)$') then true
         when jsonb_typeof(x -> 'width') is distinct from 'number' or jsonb_typeof(x -> 'height') is distinct from 'number' then true
         when (x ->> 'width') !~ '^[0-9]{1,4}$' or (x ->> 'height') !~ '^[0-9]{1,4}$' then true
         when (x ->> 'width')::integer not between 100 and 1080 or (x ->> 'height')::integer not between 100 and 1920 then true
         when jsonb_typeof(x -> 'text') is distinct from 'string' then true
         else not public.community_guide_text_ok(x ->> 'text', 0, 1500, true)
       end) then false
    else jsonb_array_length(p) = (select count(distinct e.x ->> 'path') from jsonb_array_elements(p) as e(x))
  end;
$$;

-- Una traduzione salvata in `translations` (una lingua): {hash, at, model, comic: {title, summary, pages: [testo…]}}
-- con il titolo tradotto (Pierluigi, 29/09/2026: "non è tradotto il titolo", sulla guida di Vega), un testo per tavola
-- (lo stesso numero dell'originale, `n`; vuoto dove l'originale è vuoto), le regole del testo semplice e lunghezze fino a
-- 2,5 volte i massimi dell'originale più 200 (COMIC_TRANSLATION_LIMITS di comics.ts).
create or replace function public.community_comic_translation_ok(t jsonb, n integer)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select case
    when t is null or jsonb_typeof(t) is distinct from 'object' then false
    when octet_length(t::text) > 200000 then false
    when (t - 'hash' - 'at' - 'model' - 'comic') <> '{}'::jsonb then false
    when jsonb_typeof(t -> 'hash') is distinct from 'string' or char_length(t ->> 'hash') > 32 then false
    when t ? 'at' and (jsonb_typeof(t -> 'at') is distinct from 'string' or char_length(t ->> 'at') > 40) then false
    when t ? 'model' and (jsonb_typeof(t -> 'model') is distinct from 'string' or char_length(t ->> 'model') > 80) then false
    when jsonb_typeof(t -> 'comic') is distinct from 'object' then false
    when ((t -> 'comic') - 'title' - 'summary' - 'pages') <> '{}'::jsonb then false
    when jsonb_typeof(t -> 'comic' -> 'title') is distinct from 'string' then false
    when not public.community_guide_text_ok(t -> 'comic' ->> 'title', 1, 475, false) then false
    when jsonb_typeof(t -> 'comic' -> 'summary') is distinct from 'string' then false
    when not public.community_guide_text_ok(t -> 'comic' ->> 'summary', 1, 950, true) then false
    when jsonb_typeof(t -> 'comic' -> 'pages') is distinct from 'array' then false
    when jsonb_array_length(t -> 'comic' -> 'pages') <> n then false
    else not exists (
      select 1 from jsonb_array_elements(t -> 'comic' -> 'pages') as e(x)
       where case
         when jsonb_typeof(x) is distinct from 'string' then true
         else not public.community_guide_text_ok(x #>> '{}', 0, 3950, true)
       end)
  end;
$$;

revoke all on function public.community_comic_pages_ok(jsonb, uuid, boolean) from public, anon;
revoke all on function public.community_comic_translation_ok(jsonb, integer) from public, anon;
grant execute on function public.community_comic_pages_ok(jsonb, uuid, boolean) to authenticated, service_role;
grant execute on function public.community_comic_translation_ok(jsonb, integer) to authenticated, service_role;

-- ---------- la tabella ----------
create table if not exists public.community_comics (
  id uuid primary key default gen_random_uuid(),
  -- slug leggibile dal titolo più 4 caratteri casuali (come le guide); non si cambia mai
  slug text unique not null,
  owner uuid not null references public.profiles(id) on delete cascade,
  -- lingua dei testi (quella dei balloon); il sito traduce titolo, presentazione e testi delle tavole nelle altre due
  lang text not null default 'en',
  -- il titolo si traduce con il resto (i nomi dei mazzi no)
  title text not null,
  summary text not null default '',
  pages jsonb not null default '[]'::jsonb,
  -- copertina 16:9 caricata dall'autore (obbligatoria per pubblicare): lista delle news, anteprima dei link, Discord
  cover_path text,
  status text not null default 'draft',
  -- traduzioni automatiche: {"it": {"hash": "…", "at": "…", "model": "…", "comic": {"title": "…", "summary": "…", "pages": ["…"]}}}
  translations jsonb not null default '{}'::jsonb,
  -- impronta di lingua, presentazione e testi delle tavole (comicHash di comics.ts), scritta dal sito con il testo
  text_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- prima pubblicazione: la scrive solo il trigger; è la data della news
  published_at timestamptz
);
create index if not exists community_comics_status_idx on public.community_comics (status, published_at desc);
create index if not exists community_comics_owner_idx on public.community_comics (owner, updated_at desc);

alter table public.community_comics drop constraint if exists community_comics_slug_check;
alter table public.community_comics add constraint community_comics_slug_check
  check (char_length(slug) between 3 and 60 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
alter table public.community_comics drop constraint if exists community_comics_lang_check;
alter table public.community_comics add constraint community_comics_lang_check check (lang in ('en','it','es','fr'));
alter table public.community_comics drop constraint if exists community_comics_status_check;
alter table public.community_comics add constraint community_comics_status_check check (status in ('draft','published','hidden'));
alter table public.community_comics drop constraint if exists community_comics_title_check;
alter table public.community_comics add constraint community_comics_title_check
  check (public.community_guide_text_ok(title, case when status = 'draft' then 1 else 3 end, 110, false));
alter table public.community_comics drop constraint if exists community_comics_summary_check;
alter table public.community_comics add constraint community_comics_summary_check
  check (public.community_guide_text_ok(summary, case when status = 'draft' then 0 else 40 end, 300, true));
alter table public.community_comics drop constraint if exists community_comics_pages_check;
alter table public.community_comics add constraint community_comics_pages_check
  check (public.community_comic_pages_ok(pages, owner, status <> 'draft'));
alter table public.community_comics drop constraint if exists community_comics_cover_path_check;
alter table public.community_comics add constraint community_comics_cover_path_check
  check (cover_path is null or (char_length(cover_path) <= 200 and cover_path ~ ('^' || owner::text || '/comic/[A-Za-z0-9_-]{8,64}\.(png|jpg|jpeg|webp)$')));
alter table public.community_comics drop constraint if exists community_comics_cover_required;
alter table public.community_comics add constraint community_comics_cover_required check (status = 'draft' or cover_path is not null);
alter table public.community_comics drop constraint if exists community_comics_translations_check;
alter table public.community_comics add constraint community_comics_translations_check
  check (jsonb_typeof(translations) = 'object' and octet_length(translations::text) <= 400000);
alter table public.community_comics drop constraint if exists community_comics_text_hash_check;
alter table public.community_comics add constraint community_comics_text_hash_check check (text_hash is null or text_hash ~ '^[0-9a-z]{1,16}$');

-- ---------- registro per i tetti giornalieri ----------
-- Come community_guide_events: una riga per fumetto creato, prima pubblicazione e fumetto nascosto dallo staff, scritta
-- solo dal trigger (security definer); nessuno la legge né la cancella via API, quindi eliminare un fumetto non azzera i
-- tetti. Le righe più vecchie di una settimana le toglie il trigger stesso.
create table if not exists public.community_comic_events (
  id bigint generated always as identity primary key,
  owner uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  at timestamptz not null default now()
);
alter table public.community_comic_events drop constraint if exists community_comic_events_kind_check;
alter table public.community_comic_events add constraint community_comic_events_kind_check check (kind in ('create','publish','hide'));
create index if not exists community_comic_events_owner_idx on public.community_comic_events (owner, kind, at desc);
alter table public.community_comic_events enable row level security;
revoke all on public.community_comic_events from anon, authenticated;

-- ---------- trigger: date, tetti, stato riservato allo staff, traduzioni ----------
-- Privilegiato = lo staff (is_staff: admin o tag Staff) o una connessione diretta (auth.uid() nullo). Tetti (COMIC_* di
-- comics.ts): 500 fumetti per account, 10 creati e 3 prime pubblicazioni al giorno, 24 ore senza pubblicare dopo un
-- fumetto nascosto dallo staff. Errori con codici letti da `comicErrorCode` in comics.ts.
create or replace function public.guard_community_comic()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := auth.uid();
  privileged boolean := me is null or public.is_staff();
  n int;
  k text;
  v jsonb;
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.updated_at := now();
    new.published_at := case when new.status = 'published' then now() else null end;
    perform pg_advisory_xact_lock(hashtext('om_comics:' || new.owner::text));
    if not privileged then
      if new.status not in ('draft', 'published') then raise exception 'comic_status' using errcode = '42501'; end if;
      select count(*) into n from public.community_comics where owner = new.owner;
      if n >= 500 then raise exception 'comic_limit' using errcode = '23514'; end if;
      select count(*) into n from public.community_comic_events where owner = new.owner and kind = 'create' and at > now() - interval '1 day';
      if n >= 10 then raise exception 'comic_rate' using errcode = '23514'; end if;
      if new.status = 'published' then
        if exists (select 1 from public.community_comic_events where owner = new.owner and kind = 'hide' and at > now() - interval '1 day') then
          raise exception 'comic_hidden_recent' using errcode = '42501';
        end if;
        select count(*) into n from public.community_comic_events where owner = new.owner and kind = 'publish' and at > now() - interval '1 day';
        if n >= 3 then raise exception 'comic_daily_limit' using errcode = '23514'; end if;
      end if;
    end if;
    delete from public.community_comic_events where owner = new.owner and at < now() - interval '7 days';
    insert into public.community_comic_events (owner, kind) values (new.owner, 'create');
    if new.status = 'published' then insert into public.community_comic_events (owner, kind) values (new.owner, 'publish'); end if;
  else
    -- id, proprietario, slug e nascita non cambiano mai (le grant per colonna non li danno; vale anche per lo staff)
    if me is not null and (new.id is distinct from old.id or new.owner is distinct from old.owner
        or new.slug is distinct from old.slug or new.created_at is distinct from old.created_at) then
      raise exception 'comic_reserved_fields' using errcode = '42501';
    end if;
    -- 'hidden' è la moderazione dello staff: il proprietario non la toglie e non la mette
    if not privileged and (old.status = 'hidden' or new.status = 'hidden') then
      raise exception 'comic_hidden' using errcode = '42501';
    end if;
    new.published_at := old.published_at;
    if new.status = 'published' and old.status is distinct from 'published' and not privileged then
      perform pg_advisory_xact_lock(hashtext('om_comics:' || new.owner::text));
      if exists (select 1 from public.community_comic_events where owner = new.owner and kind = 'hide' and at > now() - interval '1 day') then
        raise exception 'comic_hidden_recent' using errcode = '42501';
      end if;
      if old.published_at is null then
        select count(*) into n from public.community_comic_events where owner = new.owner and kind = 'publish' and at > now() - interval '1 day';
        if n >= 3 then raise exception 'comic_daily_limit' using errcode = '23514'; end if;
      end if;
    end if;
    if new.status = 'published' and old.published_at is null then
      new.published_at := now();
      insert into public.community_comic_events (owner, kind) values (new.owner, 'publish');
    end if;
    if new.status = 'hidden' and old.status is distinct from 'hidden' then
      insert into public.community_comic_events (owner, kind) values (new.owner, 'hide');
    end if;
    -- l'impronta la scrive il sito con il testo: un testo cambiato via API senza impronta nuova la perde (le traduzioni
    -- fatte sul testo di prima non valgono più)
    if (new.lang, new.summary, new.pages) is distinct from (old.lang, old.summary, old.pages)
       and new.text_hash is not distinct from old.text_hash then
      new.text_hash := null;
    end if;
    -- traduzioni: ogni lingua cambiata deve essere un'altra lingua del sito, con le regole del testo semplice e un testo
    -- per tavola (vale per tutti, staff e script compresi)
    if new.translations is distinct from old.translations then
      for k, v in select e.key, e.value from jsonb_each(new.translations) as e loop
        if v is distinct from (old.translations -> k) then
          if k not in ('en', 'it', 'es', 'fr') or k = new.lang
             or not public.community_comic_translation_ok(v, jsonb_array_length(new.pages)) then
            raise exception 'comic_translation' using errcode = '23514';
          end if;
        end if;
      end loop;
    end if;
    -- la data di aggiornamento è quella dell'autore: scrivere le traduzioni non la sposta
    if (to_jsonb(new) - 'translations' - 'updated_at' - 'published_at' - 'text_hash')
        is distinct from (to_jsonb(old) - 'translations' - 'updated_at' - 'published_at' - 'text_hash') then
      new.updated_at := now();
    else
      new.updated_at := old.updated_at;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.guard_community_comic() from public, anon, authenticated;
drop trigger if exists community_comics_guard on public.community_comics;
create trigger community_comics_guard before insert or update on public.community_comics
  for each row execute function public.guard_community_comic();

-- I file nuovi (tavole aggiunte o cambiate, copertina cambiata) devono esserci nel bucket, con tipo ammesso e al massimo
-- 2 MB. Con i privilegi di chi salva (profile_media_ok vede solo la sua cartella, un admin tutte), come la copertina delle
-- guide del blocco IMMAGINI: lo staff che nasconde un fumetto altrui non tocca i file e passa.
create or replace function public.guard_community_comic_files()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare
  p text;
begin
  for p in
    select e.x ->> 'path' from jsonb_array_elements(case when jsonb_typeof(new.pages) = 'array' then new.pages else '[]'::jsonb end) as e(x)
  loop
    if tg_op = 'INSERT' or not exists (
      select 1 from jsonb_array_elements(case when jsonb_typeof(old.pages) = 'array' then old.pages else '[]'::jsonb end) as o(y)
       where o.y ->> 'path' = p) then
      if p is null or not public.profile_media_ok(p, 2097152) then
        raise exception 'comic_file' using errcode = '23514';
      end if;
    end if;
  end loop;
  if new.cover_path is not null and (tg_op = 'INSERT' or new.cover_path is distinct from old.cover_path)
     and not public.profile_media_ok(new.cover_path, 2097152) then
    raise exception 'comic_file' using errcode = '23514';
  end if;
  return new;
end $$;
revoke all on function public.guard_community_comic_files() from public, anon, authenticated;
drop trigger if exists community_comics_files on public.community_comics;
create trigger community_comics_files before insert or update of pages, cover_path on public.community_comics
  for each row execute function public.guard_community_comic_files();

-- ---------- RLS ----------
alter table public.community_comics enable row level security;

drop policy if exists "community comics: published are public" on public.community_comics;
create policy "community comics: published are public" on public.community_comics for select to anon, authenticated
  using (status = 'published');
drop policy if exists "community comics: owners and staff read all" on public.community_comics;
create policy "community comics: owners and staff read all" on public.community_comics for select to authenticated
  using (owner = (select auth.uid()) or (select public.is_staff()));
drop policy if exists "community comics: roles insert own" on public.community_comics;
create policy "community comics: roles insert own" on public.community_comics for insert to authenticated
  with check (owner = (select auth.uid()) and public.can_publish_comics((select auth.uid())));
drop policy if exists "community comics: owners and staff update" on public.community_comics;
create policy "community comics: owners and staff update" on public.community_comics for update to authenticated
  using (owner = (select auth.uid()) or (select public.is_staff()))
  with check (public.can_publish_comics((select auth.uid())) and (owner = (select auth.uid()) or (select public.is_staff())));
drop policy if exists "community comics: owners and staff delete" on public.community_comics;
create policy "community comics: owners and staff delete" on public.community_comics for delete to authenticated
  using (owner = (select auth.uid()) or (select public.is_staff()));

-- Grant minime: lettura per tutti, scrittura per chi ha fatto l'accesso e solo sulle colonne che il sito scrive. La
-- revoke sulla tabella toglie anche le grant per colonna, quindi il blocco si può rilanciare.
revoke all on public.community_comics from anon, authenticated;
grant select on public.community_comics to anon, authenticated;
grant insert (slug, owner, lang, title, summary, pages, cover_path, status, text_hash) on public.community_comics to authenticated;
grant update (lang, title, summary, pages, cover_path, status, translations, text_hash) on public.community_comics to authenticated;
grant delete on public.community_comics to authenticated;

-- ---------- bucket profile-media: cartella dei fumetti ----------
-- Il tetto della vetrina (12 file, 60 per i ruoli con vetrina) non conta più i file dei fumetti: una puntata a settimana
-- con 10 tavole lo riempirebbe in un mese e mezzo. La cartella `comic` ha il suo (COMIC_FILES_MAX = 300 in comics.ts).
create or replace function public.profile_media_count()
returns integer language sql stable set search_path = public, pg_temp as $$
  select count(*)::integer from storage.objects o
   where o.bucket_id = 'profile-media' and (storage.foldername(o.name))[1] = auth.uid()::text
     and (storage.foldername(o.name))[2] is distinct from 'comic'
$$;
-- I file dell'utente collegato in una sua cartella (per ora solo `comic`), con i privilegi di chi carica.
create or replace function public.profile_media_count_in(folder text)
returns integer language sql stable set search_path = public, pg_temp as $$
  select count(*)::integer from storage.objects o
   where o.bucket_id = 'profile-media' and (storage.foldername(o.name))[1] = auth.uid()::text
     and (storage.foldername(o.name))[2] = folder
$$;
revoke all on function public.profile_media_count_in(text) from public, anon;
grant execute on function public.profile_media_count_in(text) to authenticated, service_role;

-- I file in uso ora comprendono tavole e copertine dei fumetti del proprietario della cartella (anche in bozza o nascosti).
create or replace function public.profile_media_in_use(p text)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  folder text := split_part(p, '/', 1);
  uid uuid;
begin
  if folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  uid := folder::uuid;
  return exists (select 1 from public.profiles pr where pr.id = uid and (pr.avatar_path = p or pr.cover_path = p or pr.background_path = p))
      or exists (select 1 from public.community_guides g where g.owner = uid and g.cover_path = p)
      or exists (select 1 from public.community_decks d where d.owner = uid and d.art_path = p)
      or exists (select 1 from public.community_comics c where c.owner = uid
                  and (c.cover_path = p or c.pages @> jsonb_build_array(jsonb_build_object('path', p))));
end $$;
revoke all on function public.profile_media_in_use(text) from public, anon;
grant execute on function public.profile_media_in_use(text) to authenticated, service_role;

do $$
begin
  -- Cartelle e tetti: `comic` per Creator, Staff e admin, fino a 300 file; le altre come nel blocco IMMAGINI (avatar per
  -- tutti; cover, background e guide per i ruoli con vetrina; deck per Creator e Staff), con il tetto della vetrina.
  drop policy if exists "profile media upload" on storage.objects;
  create policy "profile media upload" on storage.objects for insert to authenticated with check (
    bucket_id = 'profile-media'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = auth.uid()::text
    and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
    and storage.filename(name) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$'
    and (
      ((storage.foldername(name))[2] = 'comic'
          and public.profile_media_count_in('comic') < 300
          and exists (select 1 from public.profiles p where p.id = auth.uid() and (p.badge in ('creator', 'staff') or p.role = 'admin')))
      or ((storage.foldername(name))[2] <> 'comic'
          and public.profile_media_count() < (case when exists (select 1 from public.profiles p where p.id = auth.uid() and (p.badge in ('creator', 'author', 'pro', 'staff') or p.role = 'admin')) then 60 else 12 end)
          and (
            (storage.foldername(name))[2] = 'avatar'
            or ((storage.foldername(name))[2] in ('cover', 'background', 'guide')
                and exists (select 1 from public.profiles p where p.id = auth.uid() and (p.badge in ('creator', 'author', 'pro', 'staff') or p.role = 'admin')))
            or ((storage.foldername(name))[2] = 'deck'
                and exists (select 1 from public.profiles p where p.id = auth.uid() and (p.badge in ('creator', 'staff') or p.role = 'admin')))
          ))
    )
  );
  -- si cancellano i propri file (un admin anche quelli degli altri), mai un file in uso
  drop policy if exists "profile media owners delete" on storage.objects;
  create policy "profile media owners delete" on storage.objects for delete to authenticated using (
    bucket_id = 'profile-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
    and not public.profile_media_in_use(name)
  );
exception when others then
  raise notice 'Policy del bucket profile-media non aggiornate da SQL (%): vedi README ("Fumetti dei creator").', sqlerrm;
end $$;

-- ---------- avvisi a chi segue: un fumetto nuovo ----------
-- Il tipo `comic_published` (NOTIFICATION_KINDS di notifications.ts) nei vincoli delle due tabelle del blocco SEGUI (lì
-- scritti dentro create table, che su un database esistente non si riapplica) e in notify_followers, che per i fumetti
-- vuole `/news/comics/<slug>` di un fumetto pubblicato dell'autore. Il resto della funzione è quello del blocco SEGUI.
alter table public.notifications drop constraint if exists notifications_kind_check;
-- `not valid` (05/10/2026): schema.sql si riapplica intero a ogni migrazione e questo elenco è quello del 29/09. Senza,
-- Postgres ricontrolla le righe già scritte e la migrazione si ferma appena esiste un avviso di un tipo nato dopo (il
-- 05/10/2026, con i `deck_set_published` dei primi mazzi torneo). Le righe nuove restano controllate. Vale per ogni
-- blocco che rifà questi due vincoli: lo controlla notifications.test.ts.
alter table public.notifications add constraint notifications_kind_check check (kind in ('deck_published', 'live', 'guide_published', 'comic_published')) not valid;
alter table public.notification_events drop constraint if exists notification_events_kind_check;
alter table public.notification_events add constraint notification_events_kind_check check (kind in ('deck_published', 'live', 'guide_published', 'comic_published')) not valid;

create or replace function public.notify_followers(p_kind text, p_target text, p_actor uuid default null)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := auth.uid();
  v_actor uuid := coalesce(p_actor, auth.uid());
  v_target text := btrim(coalesce(p_target, ''));
  v_owner uuid;
  v_badge text;
  n integer;
begin
  if me is null then raise exception 'not_logged_in'; end if;
  if p_kind is null or p_kind not in ('deck_published', 'guide_published', 'comic_published') then raise exception 'bad_kind'; end if;
  if char_length(v_target) > 160 then raise exception 'bad_target'; end if;
  if v_actor <> me and not public.is_staff() then raise exception 'forbidden'; end if;
  if p_kind = 'deck_published' then
    if v_target !~ '^/decks/community/[a-z0-9-]{1,80}$' then raise exception 'bad_target'; end if;
    -- '/decks/community/' sono 17 caratteri: lo slug comincia dal diciottesimo
    select d.owner into v_owner from public.community_decks d where d.slug = substr(v_target, 18) and d.status = 'published';
  elsif p_kind = 'guide_published' then
    -- '/guides/community/' sono 18 caratteri: lo slug (3-60) comincia dal diciannovesimo
    if v_target !~ '^/guides/community/[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_target) not between 21 and 78 then
      raise exception 'bad_target';
    end if;
    if to_regclass('public.community_guides') is null then raise exception 'not_found'; end if;
    execute 'select g.owner from public.community_guides g where g.slug = $1 and g.status = ''published'''
      into v_owner using substr(v_target, 19);
  else
    -- '/news/comics/' sono 13 caratteri: lo slug (3-60) comincia dal quattordicesimo
    if v_target !~ '^/news/comics/[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_target) not between 16 and 73 then
      raise exception 'bad_target';
    end if;
    if to_regclass('public.community_comics') is null then raise exception 'not_found'; end if;
    execute 'select c.owner from public.community_comics c where c.slug = $1 and c.status = ''published'''
      into v_owner using substr(v_target, 14);
  end if;
  if v_owner is null or v_owner <> v_actor then raise exception 'not_found'; end if;
  select p.badge into v_badge from public.profiles p where p.id = v_actor;
  if v_badge is null or v_badge not in ('creator', 'author', 'pro', 'staff') then return 0; end if;
  perform pg_advisory_xact_lock(hashtext('om_notify:' || v_actor::text));
  if exists (select 1 from public.notification_events e where e.kind = p_kind and e.actor_id = v_actor and e.event_key = v_target) then return 0; end if;
  select count(*) into n from public.notification_events e
   where e.actor_id = v_actor and e.kind = p_kind and e.created_at > now() - interval '1 day';
  if n >= 10 then return 0; end if;
  return public.notify_fanout(v_actor, p_kind, v_target, v_target);
end $$;
revoke all on function public.notify_followers(text, text, uuid) from public, anon;
grant execute on function public.notify_followers(text, text, uuid) to authenticated;

comment on table public.community_comics is 'Fumetti dei Creator e dello Staff pubblicati come news (29/09/2026): tavole e copertina nel bucket profile-media (<owner>/comic/), testi tradotti dal sito. Regole in src/lib/community/comics.ts; documentazione in docs/fumetti.md.';
comment on table public.community_comic_events is 'Registro dei tetti giornalieri dei fumetti (creati, prime pubblicazioni, nascosti dallo staff): lo scrive solo il trigger guard_community_comic.';
comment on function public.can_publish_comics(uuid) is 'Chi pubblica fumetti: Creator, Staff e admin (canPublishComics in src/lib/community/badges.ts).';
comment on function public.profile_media_count_in(text) is 'File dell''utente collegato in una sua cartella del bucket profile-media (tetto della cartella dei fumetti, 29/09/2026).';

-- ===== 29/09/2026: TITOLI TRADOTTI =====
-- Il titolo delle guide della community si traduce (Pierluigi, 29/09/2026, sulla guida di Vega: "non è tradotto il
-- titolo"; fino a qui restava nella lingua dell'autore, come il nome di un mazzo). La traduzione salvata ha in più il
-- titolo tradotto, `guide.title`, e l'impronta del titolo da cui è fatto, `title_hash`: facoltativi (le traduzioni fatte
-- prima non li hanno e restano valide: il sito traduce solo il titolo), ma sempre insieme. Massimo del titolo tradotto
-- 475 = 2,5 × 110 + 200, come le altre parti (TRANSLATION_LIMITS.titleMax in src/lib/community/guides.ts, il test
-- guides.test.ts lo confronta). È la funzione del blocco GUIDE con le due chiavi in più: il trigger
-- guard_community_guide la chiama già, grant e revoke restano quelli del blocco GUIDE. Il codice di prima regge
-- (non scrive le due chiavi); il codice nuovo, prima di questo blocco, vedrebbe rifiutate le traduzioni con il titolo:
-- si migra prima del deploy.
create or replace function public.community_guide_translation_ok(t jsonb, n integer)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select case
    when t is null or jsonb_typeof(t) is distinct from 'object' then false
    when octet_length(t::text) > 190000 then false
    when (t - 'hash' - 'at' - 'model' - 'parts' - 'title_hash' - 'guide') <> '{}'::jsonb then false
    when jsonb_typeof(t -> 'hash') is distinct from 'string' or char_length(t ->> 'hash') > 32 then false
    when t ? 'at' and (jsonb_typeof(t -> 'at') is distinct from 'string' or char_length(t ->> 'at') > 40) then false
    when t ? 'model' and (jsonb_typeof(t -> 'model') is distinct from 'string' or char_length(t ->> 'model') > 80) then false
    when t ? 'parts' and (jsonb_typeof(t -> 'parts') is distinct from 'array' or jsonb_array_length(t -> 'parts') > 13) then false
    when t ? 'parts' and exists (select 1 from jsonb_array_elements(t -> 'parts') as p(x) where jsonb_typeof(x) is distinct from 'string' or char_length(x #>> '{}') > 32) then false
    when t ? 'title_hash' and (jsonb_typeof(t -> 'title_hash') is distinct from 'string' or char_length(t ->> 'title_hash') > 32) then false
    when jsonb_typeof(t -> 'guide') is distinct from 'object' then false
    when ((t -> 'guide') - 'title' - 'summary' - 'sections') <> '{}'::jsonb then false
    when (t -> 'guide' ? 'title') is distinct from (t ? 'title_hash') then false
    when t -> 'guide' ? 'title' and (jsonb_typeof(t -> 'guide' -> 'title') is distinct from 'string' or not public.community_guide_text_ok(t -> 'guide' ->> 'title', 1, 475, false)) then false
    when jsonb_typeof(t -> 'guide' -> 'summary') is distinct from 'string' then false
    when not public.community_guide_text_ok(t -> 'guide' ->> 'summary', 1, 950, true) then false
    when jsonb_typeof(t -> 'guide' -> 'sections') is distinct from 'array' then false
    when jsonb_array_length(t -> 'guide' -> 'sections') <> n then false
    else not exists (
      select 1 from jsonb_array_elements(t -> 'guide' -> 'sections') as e(x)
       where case
         when jsonb_typeof(x) is distinct from 'object' then true
         when (x - 'heading' - 'body') <> '{}'::jsonb then true
         when jsonb_typeof(x -> 'heading') is distinct from 'string' then true
         when jsonb_typeof(x -> 'body') is distinct from 'string' then true
         when not public.community_guide_text_ok(x ->> 'heading', 1, 400, false) then true
         else not public.community_guide_text_ok(x ->> 'body', 1, 10200, true)
       end)
  end;
$$;

comment on function public.community_guide_translation_ok(jsonb, integer) is 'Traduzione di una guida della community valida: testo semplice, stesse sezioni dell''originale, titolo tradotto con la sua impronta (facoltativi, insieme; dal 29/09/2026).';

-- ===== 30/09/2026: FUMETTI IN PIÙ LINGUE =====
-- =====================================================================================================
-- VERSIONI DISEGNATE IN ALTRE LINGUE (30/09/2026). Vega ha pubblicato lo stesso fumetto tre volte, una per lingua, e
-- Pierluigi ha chiesto: "unificali in una sola news subito". Un fumetto ha ora, oltre alle
-- tavole nella lingua dei testi (`lang`), una versione disegnata per ognuna delle altre lingue del sito (colonna
-- `editions`): tavole, titolo, presentazione e, facoltativa, una copertina sua. La pagina in quella lingua mostra la
-- versione disegnata al posto della traduzione automatica (che per quella lingua non si fa più) e la news resta una,
-- con un indirizzo solo. `former_slugs`: gli indirizzi dei fumetti uniti in questo da scripts/merge-comics.mjs, che la
-- pagina /news/comics/<slug> porta qui con un 308; li scrive solo lo script (connessione diretta), nessuna grant.
-- Codice: `editions` e `comicEdition` in src/lib/community/comics.ts (comics.test.ts confronta limiti e regole con
-- questo blocco), `comicMovedTo` in comicQueries.ts, scripts/merge-comics.mjs; documentazione in docs/fumetti.md.
-- Viene dopo FUMETTI: rifà il trigger dei file e la funzione dei file in uso (profile_media_in_use) con le versioni
-- disegnate, e aggiunge `editions` alle grant per colonna (la revoke del blocco FUMETTI, rilanciata a ogni migrazione,
-- le toglie: qui si rimettono). Nessuna grant né revoke su public.profiles. Idempotente come tutto il file. Si migra
-- prima del deploy (il codice regge anche senza la colonna: legge senza, e i fumetti restano con le tavole originali).
-- =====================================================================================================

alter table public.community_comics add column if not exists editions jsonb not null default '{}'::jsonb;
alter table public.community_comics add column if not exists former_slugs text[] not null default '{}';
create index if not exists community_comics_former_slugs_idx on public.community_comics using gin (former_slugs);

-- Le versioni: {"it": {"title": "…", "summary": "…", "pages": [...], "cover_path": "…"}}. Chiavi fra le lingue del
-- sito, mai quella dei testi del fumetto (`lang`); titolo (una riga), presentazione e tavole con le regole
-- dell'originale: un fumetto pubblicato (o nascosto) le vuole complete (titolo 3-110, presentazione 40-300, da 1 a 10
-- tavole), una bozza anche a metà; copertina facoltativa (null o assente: vale quella del fumetto) nella cartella dei
-- fumetti del proprietario. Gli stessi limiti di COMIC_LIMITS in comics.ts. I CASE fissano l'ordine dei controlli.
create or replace function public.community_comic_editions_ok(e jsonb, owner uuid, lang text, complete boolean)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select case
    when e is null or jsonb_typeof(e) is distinct from 'object' then false
    when octet_length(e::text) > 150000 then false
    else not exists (
      select 1 from jsonb_each(e) as x(k, v)
       where case
         when k not in ('en', 'it', 'es', 'fr') or k = lang then true
         when jsonb_typeof(v) is distinct from 'object' then true
         when (v - 'title' - 'summary' - 'pages' - 'cover_path') <> '{}'::jsonb then true
         when jsonb_typeof(v -> 'title') is distinct from 'string' then true
         when not public.community_guide_text_ok(v ->> 'title', case when complete then 3 else 0 end, 110, false) then true
         when jsonb_typeof(v -> 'summary') is distinct from 'string' then true
         when not public.community_guide_text_ok(v ->> 'summary', case when complete then 40 else 0 end, 300, true) then true
         when coalesce(jsonb_typeof(v -> 'cover_path'), 'null') not in ('string', 'null') then true
         when jsonb_typeof(v -> 'cover_path') = 'string'
              and (char_length(v ->> 'cover_path') > 200
                   or (v ->> 'cover_path') !~ ('^' || owner::text || '/comic/[A-Za-z0-9_-]{8,64}\.(png|jpg|jpeg|webp)$')) then true
         else not public.community_comic_pages_ok(v -> 'pages', owner, complete)
       end)
  end;
$$;

-- Gli indirizzi di prima: al massimo 20, ognuno con la regola degli slug dei fumetti (community_comics_slug_check).
create or replace function public.community_comic_slugs_ok(s text[])
returns boolean language sql immutable set search_path = pg_catalog as $$
  select s is not null and cardinality(s) <= 20
     and not exists (
       select 1 from unnest(s) as x(slug)
        where slug is null or char_length(slug) not between 3 and 60 or slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$');
$$;

-- Tutti i file di un fumetto, senza doppioni: tavole, copertina, tavole e copertine delle versioni disegnate (la stessa
-- cosa di comicFiles in comics.ts). La usano il trigger dei file e profile_media_in_use.
create or replace function public.community_comic_files(pages jsonb, cover text, editions jsonb)
returns text[] language sql immutable set search_path = pg_catalog as $$
  select coalesce(array_agg(distinct f) filter (where f is not null), '{}')
    from (
      select a.x ->> 'path' as f
        from jsonb_array_elements(case when jsonb_typeof(pages) = 'array' then pages else '[]'::jsonb end) as a(x)
      union all
      select cover
      union all
      select e.v ->> 'cover_path'
        from jsonb_each(case when jsonb_typeof(editions) = 'object' then editions else '{}'::jsonb end) as e(k, v)
      union all
      select b.y ->> 'path'
        from jsonb_each(case when jsonb_typeof(editions) = 'object' then editions else '{}'::jsonb end) as e2(k, v)
        cross join lateral jsonb_array_elements(case when jsonb_typeof(e2.v -> 'pages') = 'array' then e2.v -> 'pages' else '[]'::jsonb end) as b(y)
    ) as files;
$$;

revoke all on function public.community_comic_editions_ok(jsonb, uuid, text, boolean) from public, anon;
revoke all on function public.community_comic_slugs_ok(text[]) from public, anon;
revoke all on function public.community_comic_files(jsonb, text, jsonb) from public, anon;
grant execute on function public.community_comic_editions_ok(jsonb, uuid, text, boolean) to authenticated, service_role;
grant execute on function public.community_comic_slugs_ok(text[]) to authenticated, service_role;
grant execute on function public.community_comic_files(jsonb, text, jsonb) to authenticated, service_role;

alter table public.community_comics drop constraint if exists community_comics_editions_check;
alter table public.community_comics add constraint community_comics_editions_check
  check (public.community_comic_editions_ok(editions, owner, lang, status <> 'draft'));
alter table public.community_comics drop constraint if exists community_comics_former_slugs_check;
alter table public.community_comics add constraint community_comics_former_slugs_check
  check (public.community_comic_slugs_ok(former_slugs));

-- I file nuovi (tavole e copertine, anche delle versioni disegnate) devono esserci nel bucket, con tipo ammesso e al
-- massimo 2 MB; quelli che il fumetto aveva già passano. Con i privilegi di chi salva, come nel blocco FUMETTI.
create or replace function public.guard_community_comic_files()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare
  p text;
  known text[] := '{}';
begin
  if tg_op = 'UPDATE' then
    known := public.community_comic_files(old.pages, old.cover_path, old.editions);
  end if;
  foreach p in array public.community_comic_files(new.pages, new.cover_path, new.editions) loop
    if not (p = any(known)) and not public.profile_media_ok(p, 2097152) then
      raise exception 'comic_file' using errcode = '23514';
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.guard_community_comic_files() from public, anon, authenticated;
drop trigger if exists community_comics_files on public.community_comics;
create trigger community_comics_files before insert or update of pages, cover_path, editions on public.community_comics
  for each row execute function public.guard_community_comic_files();

-- I file in uso comprendono le tavole e le copertine delle versioni disegnate: il bucket non li lascia cancellare e
-- scripts/clear-profile-media.mjs --orphans li conta come usati.
create or replace function public.profile_media_in_use(p text)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  folder text := split_part(p, '/', 1);
  uid uuid;
begin
  if folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  uid := folder::uuid;
  return exists (select 1 from public.profiles pr where pr.id = uid and (pr.avatar_path = p or pr.cover_path = p or pr.background_path = p))
      or exists (select 1 from public.community_guides g where g.owner = uid and g.cover_path = p)
      or exists (select 1 from public.community_decks d where d.owner = uid and d.art_path = p)
      or exists (select 1 from public.community_comics c where c.owner = uid
                  and (c.cover_path = p or c.pages @> jsonb_build_array(jsonb_build_object('path', p))
                       or p = any(public.community_comic_files('[]'::jsonb, null, c.editions))));
end $$;
revoke all on function public.profile_media_in_use(text) from public, anon;
grant execute on function public.profile_media_in_use(text) to authenticated, service_role;

-- Le versioni disegnate le scrive il sito con la sessione del proprietario (grant per colonna, come le altre del blocco
-- FUMETTI); `former_slugs` no: solo lo script, con la connessione diretta.
grant insert (editions) on public.community_comics to authenticated;
grant update (editions) on public.community_comics to authenticated;

comment on column public.community_comics.editions is 'Versioni disegnate nelle altre lingue del sito (30/09/2026): {"<lingua>": {title, summary, pages, cover_path}}. La pagina in quella lingua le mostra al posto della traduzione automatica. Regole: community_comic_editions_ok, comics.ts.';
comment on column public.community_comics.former_slugs is 'Indirizzi dei fumetti uniti in questo (scripts/merge-comics.mjs, 30/09/2026): la pagina /news/comics/<slug> di un indirizzo di prima porta qui con un 308. Nessuna grant: li scrive solo lo script.';
comment on function public.community_comic_editions_ok(jsonb, uuid, text, boolean) is 'Versioni disegnate di un fumetto valide: le altre lingue del sito, testi e tavole con le regole dell''originale, copertina facoltativa nella cartella del proprietario (30/09/2026).';
comment on function public.community_comic_files(jsonb, text, jsonb) is 'Tutti i file di un fumetto, versioni disegnate comprese (trigger dei file e profile_media_in_use, 30/09/2026).';

-- =====================================================================================================
-- ===== 30/09/2026: VERSIONI =====
-- =====================================================================================================
-- Aggiornare le carte di un mazzo pubblicato quando esce una patch (richiesta di MagicOfHands sul Discord il 30/09/2026,
-- "sarebbe molto più comodo mantenere la descrizione e cambiare solo qualcosina"; risposta: "vi tiriamo su un sistema
-- per aggiornamento deck con anche selettore della versione"). Fino a qui dalla pagina di modifica si cambiavano solo
-- nome, guida e media; per cambiare le carte bisognava pubblicare un mazzo nuovo e riscrivere la guida.
--
--   1) community_decks.version (1 alla pubblicazione) e cards_updated_at (null finché le carte sono quelle pubblicate):
--      le scrive solo il trigger. Quando un mazzo non privato cambia carte, Leggendaria o carte create, la versione di
--      prima finisce in community_deck_versions (carte, codice, da quando a quando), `version` sale di uno e
--      cards_updated_at diventa now(). Nome, guida, video e artwork si cambiano senza nuova versione. Un mazzo privato
--      ('draft') si riscrive senza versioni: non ha voti né una scheda pubblica.
--   2) I voti valgono per una versione: deck_votes.version, scritta dal trigger con la versione del mazzo al momento del
--      voto (mai dal sito né da chi vota), e la chiave primaria diventa (deck_id, user_id, version): sulla versione nuova
--      si vota da capo (Magic: "perdendo tutti i voti una volta aggiornato"), ma i voti di prima NON si cancellano:
--      restano nelle statistiche dei creator, nei traguardi e nel "Mazzo del mese", e la versione di prima mostra ancora
--      la sua media. Un voto di una versione chiusa non si cambia più (si può solo togliere).
--   3) deck_ratings conta solo i voti della versione in vigore: è la media che il sito mostra ovunque (schede, /decks,
--      profili, tier list). Le versioni di prima la calcolano dai voti con la loro `version` (listDeckVersions).
--   4) community_deck_versions: lettura con le stesse regole del mazzo (la policy guarda community_decks, che ha la sua
--      RLS: chi non vede il mazzo non vede le versioni), nessuna scrittura degli utenti (solo il grant di select e una
--      policy restrittiva che nega le scritture): le righe le scrive solo il trigger security definer. Si cancellano
--      con il mazzo (on delete cascade).
-- ORDINE: questo blocco sta dopo DATE E FOTO (trigger deck_votes_guard_created). Qui, al contrario di altri blocchi, PRIMA
-- si mette online il codice e POI si migra: il codice nuovo regge senza (colonne facoltative in queries.ts, gruppo
-- "version"; updateDeck rifiuta un cambio di carte con `versionsUnavailable`; il voto riprova con la chiave di prima),
-- mentre il voto del codice VECCHIO usa la chiave (deck_id, user_id) che qui sparisce.
-- =====================================================================================================

alter table public.community_decks add column if not exists version integer not null default 1;
alter table public.community_decks add column if not exists cards_updated_at timestamptz;
alter table public.deck_votes add column if not exists version integer not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any (i.indkey)
     where i.indrelid = 'public.deck_votes'::regclass and i.indisprimary and a.attname = 'version'
  ) then
    alter table public.deck_votes drop constraint if exists deck_votes_pkey;
    alter table public.deck_votes add constraint deck_votes_pkey primary key (deck_id, user_id, version);
  end if;
end $$;

create table if not exists public.community_deck_versions (
  deck_id uuid not null references public.community_decks(id) on delete cascade,
  version integer not null check (version >= 1),
  legendary text,
  cards jsonb not null default '[]'::jsonb,
  custom_cards jsonb not null default '[]'::jsonb,
  code_om text,
  -- da quando valevano queste carte (pubblicazione o aggiornamento di prima) e fino a quando
  started_at timestamptz not null,
  ended_at timestamptz not null default now(),
  primary key (deck_id, version)
);

alter table public.community_deck_versions enable row level security;
drop policy if exists "deck versions follow the deck" on public.community_deck_versions;
create policy "deck versions follow the deck" on public.community_deck_versions for select
  using (exists (select 1 from public.community_decks d where d.id = deck_id));
drop policy if exists "deck versions are written by the database" on public.community_deck_versions;
create policy "deck versions are written by the database" on public.community_deck_versions as restrictive for all
  using (true) with check (false);
revoke all on public.community_deck_versions from anon, authenticated;
grant select on public.community_deck_versions to anon, authenticated;

-- ---------- 1) versione del mazzo ----------
create or replace function public.guard_deck_version()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1;
    new.cards_updated_at := null;
    return new;
  end if;
  new.version := old.version;
  new.cards_updated_at := old.cards_updated_at;
  if old.status <> 'draft'
     and (new.cards is distinct from old.cards or new.legendary is distinct from old.legendary or new.custom_cards is distinct from old.custom_cards) then
    insert into public.community_deck_versions (deck_id, version, legendary, cards, custom_cards, code_om, started_at, ended_at)
    values (old.id, old.version, old.legendary, old.cards, old.custom_cards, old.code_om, coalesce(old.cards_updated_at, old.created_at), now())
    on conflict (deck_id, version) do nothing;
    new.version := old.version + 1;
    new.cards_updated_at := now();
  end if;
  return new;
end $$;
revoke all on function public.guard_deck_version() from public, anon, authenticated;
drop trigger if exists community_decks_version on public.community_decks;
create trigger community_decks_version before insert or update on public.community_decks
  for each row execute function public.guard_deck_version();

-- ---------- 2) il voto vale per la versione in vigore ----------
create or replace function public.guard_vote_version()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare current_version integer;
begin
  select d.version into current_version from public.community_decks d where d.id = new.deck_id;
  if tg_op = 'INSERT' then
    new.version := coalesce(current_version, 1);
  else
    new.version := old.version;
    if new.deck_id is distinct from old.deck_id or old.version is distinct from current_version then
      raise exception 'vote of a closed deck version' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.guard_vote_version() from public, anon, authenticated;
drop trigger if exists deck_votes_version on public.deck_votes;
create trigger deck_votes_version before insert or update on public.deck_votes
  for each row execute function public.guard_vote_version();

-- ---------- 3) la media mostrata è quella della versione in vigore ----------
create or replace view public.deck_ratings as
  select v.deck_id, round(avg(v.stars)::numeric, 2) as avg_stars, count(*)::int as votes
    from public.deck_votes v join public.community_decks d on d.id = v.deck_id and d.version = v.version
   group by v.deck_id;
grant select on public.deck_ratings to anon, authenticated;

comment on column public.community_decks.version is 'Versione delle carte del mazzo: 1 alla pubblicazione, +1 a ogni cambio di carte di un mazzo non privato (trigger guard_deck_version, 30/09/2026).';
comment on column public.community_decks.cards_updated_at is 'Quando sono cambiate le carte l''ultima volta (null: quelle della pubblicazione). La patch del mazzo si ricava da qui (30/09/2026).';
comment on column public.deck_votes.version is 'Versione del mazzo votata: la scrive il trigger guard_vote_version (30/09/2026).';
comment on table public.community_deck_versions is 'Versioni di prima delle carte dei mazzi della community, scritte dal trigger guard_deck_version (30/09/2026).';

-- =====================================================================================================
-- ===== 30/09/2026: PREFERITI E TENDENZA =====
-- =====================================================================================================
-- Dal confronto con i siti concorrenti del 30/09/2026 (Pierluigi: "lavoriamo su sti 10 punti, iniziamo dai primi 5"):
-- un sito rivale ha sui mazzi il tasto "Favorite" e l'ordine "Trending"; noi avevamo solo "Più recenti" e "Più votati".
--
--   1) deck_favorites: i mazzi salvati da ogni utente ("Salva", un segnalibro personale, diverso dal voto: si può salvare
--      anche un proprio mazzo). Ognuno legge, aggiunge e toglie SOLO i suoi (RLS); si salva solo un mazzo pubblicato
--      (trigger) e al massimo FAVORITE_MAX (500) a testa, come i "Segui". Chi ha salvato un mazzo non è pubblico: il
--      numero dei salvataggi di ogni mazzo sì, solo come conteggio, dalla funzione deck_favorite_counts.
--   2) deck_trending: punteggio "Di tendenza" dei mazzi pubblicati, sugli ultimi 7 giorni UTC, con i giorni più vecchi
--      che pesano meno (oggi 7/7, sei giorni fa 1/7): visite ×1, copie del codice del gioco ×3, clic sulle risorse ×1,
--      video avviati ×2, più voti ×4 e salvataggi ×5 dati nella settimana. deck_stats_daily resta privata (blocco STATS):
--      la funzione restituisce SOLO il punteggio arrotondato per mazzo, mai visite o copie, e solo per i mazzi pubblicati
--      con punteggio positivo. Pesi e finestra sono uguali in src/lib/community/favorites.ts (TRENDING_*), che il test
--      confronta.
-- Le due funzioni sono security definer (leggono tabelle private) ma restituiscono solo aggregati. Il codice regge senza
-- questo blocco (la scheda non mostra il tasto e /decks non offre gli ordini nuovi): l'ordine di rilascio è libero.
-- =====================================================================================================

create table if not exists public.deck_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  deck_id uuid not null references public.community_decks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, deck_id)
);
create index if not exists deck_favorites_deck_idx on public.deck_favorites (deck_id);

alter table public.deck_favorites enable row level security;
drop policy if exists "favorites: own rows" on public.deck_favorites;
create policy "favorites: own rows" on public.deck_favorites for select to authenticated using (user_id = auth.uid());
drop policy if exists "favorites: add own" on public.deck_favorites;
create policy "favorites: add own" on public.deck_favorites for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "favorites: remove own" on public.deck_favorites;
create policy "favorites: remove own" on public.deck_favorites for delete to authenticated using (user_id = auth.uid());
revoke all on public.deck_favorites from anon, authenticated;
grant select, insert, delete on public.deck_favorites to authenticated;

-- solo mazzi pubblicati, al massimo 500 a testa, data scritta dal database
create or replace function public.guard_deck_favorite()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.community_decks d where d.id = new.deck_id and d.status = 'published') then
    raise exception 'deck not published' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('deck_favorites:' || new.user_id::text, 0));
  if (select count(*) from public.deck_favorites f where f.user_id = new.user_id) >= 500 then
    raise exception 'favorite limit' using errcode = '23514';
  end if;
  new.created_at := now();
  return new;
end $$;
revoke all on function public.guard_deck_favorite() from public, anon, authenticated;
drop trigger if exists deck_favorites_guard on public.deck_favorites;
create trigger deck_favorites_guard before insert on public.deck_favorites
  for each row execute function public.guard_deck_favorite();

-- quanti hanno salvato ogni mazzo pubblicato (solo i numeri, mai chi)
create or replace function public.deck_favorite_counts()
returns table (deck_id uuid, favorites integer) language sql stable security definer set search_path = public, pg_temp as $$
  select f.deck_id, count(*)::int
    from public.deck_favorites f join public.community_decks d on d.id = f.deck_id and d.status = 'published'
   group by f.deck_id;
$$;
revoke all on function public.deck_favorite_counts() from public;
grant execute on function public.deck_favorite_counts() to anon, authenticated;

-- ---------- 2) di tendenza ----------
create or replace function public.deck_trending()
returns table (deck_id uuid, score numeric) language sql stable security definer set search_path = public, pg_temp as $$
  with pub as (select id from public.community_decks where status = 'published'),
  stats as (
    select s.deck_id,
           sum((s.views * 1 + s.code_copies * 3 + s.link_clicks * 1 + s.video_plays * 2)
               * greatest(0, 7 - ((now() at time zone 'utc')::date - s.day)) / 7.0) as pts
      from public.deck_stats_daily s
     where s.day > (now() at time zone 'utc')::date - 7 and s.deck_id in (select id from pub)
     group by s.deck_id
  ),
  votes as (
    select v.deck_id, count(*) * 4.0 as pts from public.deck_votes v
     where v.created_at > now() - interval '7 days' and v.deck_id in (select id from pub) group by v.deck_id
  ),
  favs as (
    select f.deck_id, count(*) * 5.0 as pts from public.deck_favorites f
     where f.created_at > now() - interval '7 days' and f.deck_id in (select id from pub) group by f.deck_id
  )
  select x.deck_id, round(sum(x.pts), 1)
    from (select * from stats union all select * from votes union all select * from favs) x
   group by x.deck_id
  having sum(x.pts) > 0;
$$;
revoke all on function public.deck_trending() from public;
grant execute on function public.deck_trending() to anon, authenticated;

comment on table public.deck_favorites is 'Mazzi salvati da ogni utente ("Salva", 30/09/2026): privati, solo il conteggio è pubblico (deck_favorite_counts).';
comment on function public.deck_favorite_counts() is 'Numero di salvataggi di ogni mazzo pubblicato, senza chi li ha fatti (30/09/2026).';
comment on function public.deck_trending() is 'Punteggio "Di tendenza" dei mazzi pubblicati sugli ultimi 7 giorni: solo il punteggio, mai visite o copie (30/09/2026).';

-- ===== 30/09/2026: TRACKER =====
-- =====================================================================================================
-- 29–30/09/2026 — TRACKER/OVERLAY, Fase 3: le partite registrate dall'app OriginsMeta Tracker (docs/tracker.md).
--   Collegamento: l'app non ha una sessione di Supabase. Si collega all'account con un codice monouso: lo crea il sito
--   per chi ha fatto l'accesso (/account/tracker, tracker_link_code: 8 caratteri, 10 minuti, al massimo 5 l'ora) e
--   l'app lo scambia con un token (tracker_link_claim, anon, attraverso /api/tracker/link). Del codice e del token il
--   database tiene solo l'impronta SHA-256. Un PC si scollega dal sito (tracker_revoke) o dall'app
--   (tracker_device_unlink, con il suo token).
--   Partite: arrivano con tracker_submit (anon, con il token, attraverso /api/tracker/sync): righe dell'utente del
--   token, una per impronta di partita, al massimo 50 per chiamata e 500 al giorno; una partita che non ha la forma
--   prevista (tracker_match_ok = isUpload di src/lib/tracker/upload.ts, più i due campi del sito) si scarta. Il sito
--   aggiunge la patch in vigore alla fine della partita e l'archetipo del mazzo (src/lib/tracker/enrich.ts); la lista
--   esatta (deck_list: le 13 carte in ordine, separate da virgole) la calcola il database.
--   Regole del tracker: nessun nome né id di giocatori o partite, nessun rank dell'avversario, nessun segnale bot né
--   modalità "BotBattle" (la coda è solo 'ranked' o 'normal'); dell'avversario solo la Leggendaria e le carte che ha
--   giocato (Pierluigi, 30/09/2026: il suo mazzo completo non si manda).
--   Righe: le legge solo il proprietario (RLS); nessuna scrittura diretta. Le cancella lui (tracker_forget) o
--   l'eliminazione dell'account (cascade).
--   Statistiche anonime (Pierluigi, 30/09/2026: i win rate di mazzi e carte "sono molto importanti e dobbiamo averli"):
--   le partite di chi collega l'app entrano SEMPRE nelle statistiche, senza caselle (decisione di Pierluigi, scritta
--   nell'informativa, /privacy#tracker). Le funzioni tracker_stats_* (security definer, anon) restituiscono SOLO
--   aggregati di una patch, e ogni numero solo sopra la soglia: almeno 20 partite di almeno 3 giocatori diversi
--   (tracker_stats_ok = TRACKER_STATS di src/lib/tracker/stats.ts). Contano solo i mazzi di chi traccia, una volta per
--   impronta (niente doppioni, nessun collegamento fra utenti). Niente somme su più patch né su più code: il totale
--   meno una parte mostrata svelerebbe la parte sotto soglia. La coda contata la decide tracker_stats_queue() (oggi
--   tutte; poi solo la classificata, con una migrazione). I numeri si calcolano al momento: una partita cancellata esce
--   subito. Tutto è idempotente.
-- =====================================================================================================

create table if not exists public.tracker_devices (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'PC' check (char_length(name) between 1 and 40),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz
);
create index if not exists tracker_devices_owner_idx on public.tracker_devices (owner);

create table if not exists public.tracker_link_codes (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  owner uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);
create index if not exists tracker_link_codes_owner_idx on public.tracker_link_codes (owner, created_at);

create table if not exists public.tracked_matches (
  owner uuid not null references public.profiles(id) on delete cascade,
  id text not null check (id ~ '^[0-9a-f]{32}$'),
  device_id uuid references public.tracker_devices(id) on delete set null,
  ended_at timestamptz,
  result text check (result in ('W', 'L')),
  queue text not null default 'normal' check (queue in ('ranked', 'normal')),
  patch text check (patch ~ '^[a-z0-9][a-z0-9.-]{0,19}$'),
  deck_name text check (char_length(deck_name) <= 60),
  deck_legendary text check (deck_legendary ~ '^C[0-9]{5}_[A-Z]{2}$'),
  deck_cards text[] not null default '{}' check (cardinality(deck_cards) <= 13),
  deck_list text check (deck_list ~ '^(C[0-9]{5}_[A-Z]{2},){12}C[0-9]{5}_[A-Z]{2}$'),
  archetype text check (archetype ~ '^[a-z]{1,20}$'),
  deck_code text check (char_length(deck_code) <= 420),
  rank text check (char_length(rank) <= 30),
  opponent_legendary text check (opponent_legendary ~ '^C[0-9]{5}_[A-Z]{2}$'),
  opponent_played text[] not null default '{}' check (cardinality(opponent_played) <= 40),
  turns smallint check (turns between 0 and 200),
  plays jsonb not null default '[]'::jsonb check (jsonb_typeof(plays) = 'array'),
  created_at timestamptz not null default now(),
  primary key (owner, id)
);
create index if not exists tracked_matches_owner_ended_idx on public.tracked_matches (owner, ended_at desc);
create index if not exists tracked_matches_owner_created_idx on public.tracked_matches (owner, created_at);
create index if not exists tracked_matches_patch_idx on public.tracked_matches (patch, queue);
create index if not exists tracked_matches_id_idx on public.tracked_matches (id);

comment on table public.tracker_devices is 'PC collegati all''account dall''app OriginsMeta Tracker: del token solo l''impronta SHA-256 (30/09/2026).';
comment on table public.tracker_link_codes is 'Codici monouso di collegamento dell''app (impronta SHA-256, 10 minuti). Nessun client li legge.';
comment on table public.tracked_matches is 'Partite registrate dall''app OriginsMeta Tracker, una per impronta: niente nomi, id, rank dell''avversario né segnale bot; dell''avversario solo Leggendaria e carte giocate.';

-- Chiave di una carta come nel gioco, senza variante cosmetica.
create or replace function public.tracker_key_ok(k jsonb)
returns boolean language sql immutable set search_path = public, pg_temp as $$
  select jsonb_typeof(k) = 'string' and (k #>> '{}') ~ '^C[0-9]{5}_[A-Z]{2}$';
$$;

-- Intero dentro un intervallo (jsonb number senza decimali).
create or replace function public.tracker_int_ok(v jsonb, lo integer, hi integer)
returns boolean language sql immutable set search_path = public, pg_temp as $$
  select jsonb_typeof(v) = 'number' and (v #>> '{}') ~ '^[0-9]{1,4}$' and (v #>> '{}')::integer between lo and hi;
$$;

-- Data e ora ISO in UTC valida e sensata (dal 2026 a domani): la conversione si prova qui, così una data impossibile
-- con la forma giusta (mese 13) scarta la partita invece di far fallire tutto l'invio.
create or replace function public.tracker_ts_ok(s text)
returns boolean language plpgsql stable set search_path = public, pg_temp as $$
begin
  if s is null or s !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]{1,6})?Z$' then return false; end if;
  return s::timestamptz between timestamptz '2026-01-01 00:00:00+00' and now() + interval '1 day';
exception when others then
  return false;
end $$;

-- Una partita come la manda l'app (src/lib/tracker/upload.ts, `isUpload`: stessi campi e stessi limiti) più i due campi
-- che aggiunge il sito (patch e archetype, facoltativi). Il nome del mazzo non si rifiuta per i caratteri di controllo:
-- tracker_submit li toglie.
create or replace function public.tracker_match_ok(m jsonb)
returns boolean language sql stable set search_path = public, pg_temp as $$
  select case
    when jsonb_typeof(m) is distinct from 'object' then false
    when (m - array['id', 'endedAt', 'result', 'queue', 'deckName', 'deckLegendary', 'deckCards', 'deckCode', 'rank', 'oppLegendary', 'oppPlayed', 'turns', 'plays', 'patch', 'archetype']) <> '{}'::jsonb then false
    when jsonb_typeof(m -> 'id') is distinct from 'string' or (m ->> 'id') !~ '^[0-9a-f]{32}$' then false
    when jsonb_typeof(m -> 'endedAt') not in ('null', 'string') then false
    when jsonb_typeof(m -> 'endedAt') = 'string' and not public.tracker_ts_ok(m ->> 'endedAt') then false
    when jsonb_typeof(m -> 'result') not in ('null', 'string') or coalesce(m ->> 'result', 'W') not in ('W', 'L') then false
    when jsonb_typeof(m -> 'queue') is distinct from 'string' or (m ->> 'queue') not in ('ranked', 'normal') then false
    when jsonb_typeof(m -> 'deckName') not in ('null', 'string') or char_length(coalesce(m ->> 'deckName', '')) > 60 then false
    when jsonb_typeof(m -> 'deckLegendary') <> 'null' and not public.tracker_key_ok(m -> 'deckLegendary') then false
    when jsonb_typeof(m -> 'deckCards') is distinct from 'array' or jsonb_array_length(m -> 'deckCards') > 13 then false
    when exists (select 1 from jsonb_array_elements(m -> 'deckCards') as c(x) where not public.tracker_key_ok(x)) then false
    when jsonb_typeof(m -> 'deckCode') not in ('null', 'string') then false
    when jsonb_typeof(m -> 'deckCode') = 'string' and (char_length(m ->> 'deckCode') > 420 or (m ->> 'deckCode') !~ '^KGBLDC[A-Za-z0-9+/=]+:[0-9a-f]{8}$') then false
    when jsonb_typeof(m -> 'rank') not in ('null', 'string') or char_length(coalesce(m ->> 'rank', '')) > 30 or coalesce(m ->> 'rank', '') !~ '^[A-Za-z0-9 ]*$' then false
    when jsonb_typeof(m -> 'oppLegendary') <> 'null' and not public.tracker_key_ok(m -> 'oppLegendary') then false
    when jsonb_typeof(m -> 'oppPlayed') is distinct from 'array' or jsonb_array_length(m -> 'oppPlayed') > 40 then false
    when exists (select 1 from jsonb_array_elements(m -> 'oppPlayed') as c(x) where not public.tracker_key_ok(x)) then false
    when jsonb_typeof(m -> 'turns') <> 'null' and not public.tracker_int_ok(m -> 'turns', 0, 200) then false
    when jsonb_typeof(m -> 'patch') not in ('null', 'string') or coalesce(m ->> 'patch', 'x') !~ '^[a-z0-9][a-z0-9.-]{0,19}$' then false
    when jsonb_typeof(m -> 'archetype') not in ('null', 'string') or coalesce(m ->> 'archetype', 'x') !~ '^[a-z]{1,20}$' then false
    when jsonb_typeof(m -> 'plays') is distinct from 'array' or jsonb_array_length(m -> 'plays') > 300 then false
    else not exists (
      select 1 from jsonb_array_elements(m -> 'plays') as p(x)
       where case
         when jsonb_typeof(x) is distinct from 'object' then true
         when (x - array['t', 'm', 'c', 'l']) <> '{}'::jsonb or not (x ?& array['t', 'm', 'c', 'l']) then true
         when not public.tracker_int_ok(x -> 't', 0, 200) then true
         when jsonb_typeof(x -> 'm') is distinct from 'boolean' then true
         when jsonb_typeof(x -> 'c') <> 'null' and not public.tracker_key_ok(x -> 'c') then true
         when jsonb_typeof(x -> 'l') <> 'null' and not public.tracker_int_ok(x -> 'l', 0, 2) then true
         else false
       end)
  end;
$$;

alter table public.tracker_devices enable row level security;
alter table public.tracker_link_codes enable row level security;
alter table public.tracked_matches enable row level security;

-- Lettura: solo il proprietario. Scrittura: nessuna policy, di proposito; solo le funzioni qui sotto.
drop policy if exists "tracker devices: owner reads" on public.tracker_devices;
create policy "tracker devices: owner reads" on public.tracker_devices for select to authenticated using (owner = (select auth.uid()));
drop policy if exists "tracked matches: owner reads" on public.tracked_matches;
create policy "tracked matches: owner reads" on public.tracked_matches for select to authenticated using (owner = (select auth.uid()));

-- Supabase dà di default tutti i privilegi ad anon e authenticated sulle tabelle nuove: si tolgono. Dei PC collegati
-- il proprietario legge tutto tranne l'impronta del token; i codici non li legge nessuno.
revoke all on public.tracker_devices from anon, authenticated;
revoke all on public.tracker_link_codes from anon, authenticated;
revoke all on public.tracked_matches from anon, authenticated;
grant select (id, name, created_at, last_seen_at, revoked_at) on public.tracker_devices to authenticated;
grant select on public.tracked_matches to authenticated;

-- ---------- codice di collegamento (sito, con l'accesso fatto) ----------
-- 8 caratteri senza quelli che si confondono (niente 0/O, 1/I), da byte casuali di gen_random_uuid() fuori dai bit
-- fissi di versione e variante (32 simboli: nessuno sbilanciamento del modulo). Restituisce "ABCD-EFGH".
create or replace function public.tracker_link_code()
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  raw bytea := uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid());
  code text := '';
  i integer;
begin
  if uid is null or not exists (select 1 from public.profiles p where p.id = uid) then raise exception 'not_authenticated'; end if;
  if (select count(*) from public.tracker_link_codes c where c.owner = uid and c.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'too_many_codes';
  end if;
  foreach i in array array[0, 1, 2, 3, 4, 5, 16, 17] loop
    code := code || substr(alphabet, (get_byte(raw, i) % 32) + 1, 1);
  end loop;
  delete from public.tracker_link_codes c where c.expires_at < now() - interval '1 day';
  insert into public.tracker_link_codes (code_hash, owner, expires_at)
  values (encode(sha256(convert_to(code, 'UTF8')), 'hex'), uid, now() + interval '10 minutes');
  return substr(code, 1, 4) || '-' || substr(code, 5, 4);
end $$;
revoke all on function public.tracker_link_code() from public, anon;
grant execute on function public.tracker_link_code() to authenticated;

-- ---------- scambio del codice con il token (app, anon) ----------
-- Codice sconosciuto, già usato o scaduto: 'invalid_code'. Al massimo 10 PC collegati per utente: 'too_many_devices'.
-- Il token ("omt_" + 64 caratteri esadecimali) esce solo qui, una volta; il database ne tiene l'impronta.
create or replace function public.tracker_link_claim(p_code text, p_name text)
returns table (token text, username text) language plpgsql security definer set search_path = public, pg_temp as $$
declare
  norm text := upper(regexp_replace(left(coalesce(p_code, ''), 40), '[^A-Za-z0-9]', '', 'g'));
  dname text := btrim(regexp_replace(left(coalesce(p_name, ''), 40), '[[:cntrl:]]', '', 'g'));
  row_owner uuid;
  tok text;
begin
  if char_length(norm) <> 8 then raise exception 'invalid_code'; end if;
  update public.tracker_link_codes c set used_at = now()
   where c.code_hash = encode(sha256(convert_to(norm, 'UTF8')), 'hex') and c.used_at is null and c.expires_at > now()
   returning c.owner into row_owner;
  if row_owner is null then raise exception 'invalid_code'; end if;
  if (select count(*) from public.tracker_devices d where d.owner = row_owner and d.revoked_at is null) >= 10 then
    raise exception 'too_many_devices';
  end if;
  tok := 'omt_' || encode(sha256(convert_to(gen_random_uuid()::text || gen_random_uuid()::text || clock_timestamp()::text, 'UTF8')), 'hex');
  insert into public.tracker_devices (owner, name, token_hash)
  values (row_owner, case when dname = '' then 'PC' else dname end, encode(sha256(convert_to(tok, 'UTF8')), 'hex'));
  return query select tok, p.username from public.profiles p where p.id = row_owner;
end $$;
revoke all on function public.tracker_link_claim(text, text) from public;
grant execute on function public.tracker_link_claim(text, text) to anon, authenticated;

-- ---------- l'app si scollega da sola (anon, con il suo token) ----------
-- true se il token valeva ed è stato scollegato; un token sconosciuto o già scollegato dà false, senza errori.
create or replace function public.tracker_device_unlink(p_token text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_token is null or p_token !~ '^omt_[0-9a-f]{64}$' then return false; end if;
  update public.tracker_devices set revoked_at = now()
   where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') and revoked_at is null;
  return found;
end $$;
revoke all on function public.tracker_device_unlink(text) from public;
grant execute on function public.tracker_device_unlink(text) to anon, authenticated;

-- ---------- partite dall'app (anon, con il token) ----------
-- Token sconosciuto o scollegato: 'invalid_token' (l'app si scollega). Più di 50 partite o un corpo che non è un array:
-- 'invalid_matches'. Oltre 500 partite nuove in 24 ore per utente: 'too_many_matches'. Le partite che non hanno la
-- forma prevista si saltano; quelle già arrivate (stessa impronta) non contano. Restituisce le partite aggiunte.
create or replace function public.tracker_submit(p_token text, p_matches jsonb)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  dev_id uuid;
  dev_owner uuid;
  m jsonb;
  n integer;
  added integer := 0;
  rows_in integer;
  cards text[];
begin
  if p_token is null or p_token !~ '^omt_[0-9a-f]{64}$' then raise exception 'invalid_token'; end if;
  select d.id, d.owner into dev_id, dev_owner from public.tracker_devices d
   where d.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') and d.revoked_at is null;
  if dev_id is null then raise exception 'invalid_token'; end if;
  update public.tracker_devices set last_seen_at = now() where id = dev_id;
  if jsonb_typeof(p_matches) is distinct from 'array' then raise exception 'invalid_matches'; end if;
  n := jsonb_array_length(p_matches);
  if n > 50 then raise exception 'invalid_matches'; end if;
  if (select count(*) from public.tracked_matches t where t.owner = dev_owner and t.created_at > now() - interval '1 day') + n > 500 then
    raise exception 'too_many_matches';
  end if;
  for m in select value from jsonb_array_elements(p_matches) loop
    continue when not public.tracker_match_ok(m);
    cards := array(select jsonb_array_elements_text(m -> 'deckCards'));
    insert into public.tracked_matches (owner, id, device_id, ended_at, result, queue, patch, deck_name, deck_legendary, deck_cards, deck_list,
                                        archetype, deck_code, rank, opponent_legendary, opponent_played, turns, plays)
    values (dev_owner, m ->> 'id', dev_id, (m ->> 'endedAt')::timestamptz, m ->> 'result', m ->> 'queue', m ->> 'patch',
            nullif(btrim(regexp_replace(m ->> 'deckName', '[[:cntrl:]]', '', 'g')), ''), m ->> 'deckLegendary', cards,
            case when cardinality(cards) = 13 then (select string_agg(k, ',' order by k collate "C") from unnest(cards) as u(k)) end,
            m ->> 'archetype', m ->> 'deckCode', m ->> 'rank', m ->> 'oppLegendary',
            array(select jsonb_array_elements_text(m -> 'oppPlayed')), (m ->> 'turns')::smallint, m -> 'plays')
    on conflict (owner, id) do nothing;
    get diagnostics rows_in = row_count;
    added := added + rows_in;
  end loop;
  return added;
end $$;
revoke all on function public.tracker_submit(text, jsonb) from public;
grant execute on function public.tracker_submit(text, jsonb) to anon, authenticated;

-- ---------- gestione dal sito (con l'accesso fatto) ----------
-- Scollega un proprio PC: il suo token smette di valere. true se c'era.
create or replace function public.tracker_revoke(p_device uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  update public.tracker_devices set revoked_at = now() where id = p_device and owner = auth.uid() and revoked_at is null;
  return found;
end $$;
revoke all on function public.tracker_revoke(uuid) from public, anon;
grant execute on function public.tracker_revoke(uuid) to authenticated;

-- Cancella tutte le proprie partite registrate (i PC restano collegati). Restituisce quante.
create or replace function public.tracker_forget()
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  gone integer;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  delete from public.tracked_matches where owner = auth.uid();
  get diagnostics gone = row_count;
  return gone;
end $$;
revoke all on function public.tracker_forget() from public, anon;
grant execute on function public.tracker_forget() to authenticated;

-- ---------- statistiche anonime (sito, anon) ----------
-- Soglia di ogni numero: almeno 20 partite di almeno 3 giocatori diversi (TRACKER_STATS di src/lib/tracker/stats.ts).
-- TEMPORANEO dal 01/10/2026: soglia 1 partita e 1 giocatore per le prove di Pierluigi ("togli il limite delle 20 partite
-- per il momento"), con il solo suo account collegato. Al lancio 20 e 3, come TRACKER_STATS_LAUNCH di stats.ts e
-- l'informativa: si rimette qui e in TRACKER_STATS, poi migrazione.
create or replace function public.tracker_stats_ok(games bigint, players bigint)
returns boolean language sql immutable set search_path = public, pg_temp as $$
  select coalesce(games >= 1 and players >= 1, false);
$$;

-- La coda che conta nelle statistiche: null = tutte le partite (Pierluigi, 30/09/2026: "per ora contano tutte"); con
-- molta più utenza diventerà 'ranked', con una migrazione (TRACKER_STATS.queue di stats.ts, un test li confronta).
-- Non è un parametro delle funzioni: tutte le code e una coda sola insieme svelerebbero l'altra per differenza.
create or replace function public.tracker_stats_queue()
returns text language sql immutable set search_path = public, pg_temp as $$
  select null::text;
$$;

-- Le partite che contano per una patch: esito noto, coda di tracker_stats_queue(), una volta per impronta (la stessa
-- partita arrivata da due account OriginsMeta con lo stesso account di gioco conta una volta). Solo per le funzioni qui
-- sotto: restituisce anche il proprietario, che serve solo a contare i giocatori diversi e non esce mai.
create or replace function public.tracker_stat_rows(p_patch text)
returns table (owner uuid, id text, win boolean, legendary text, cards text[], list text, archetype text, opponent text, plays jsonb)
language sql stable security definer set search_path = public, pg_temp as $$
  select distinct on (t.id) t.owner, t.id, t.result = 'W', t.deck_legendary, t.deck_cards, t.deck_list, t.archetype, t.opponent_legendary, t.plays
    from public.tracked_matches t
   where p_patch is not null
     and t.patch = p_patch
     and t.result in ('W', 'L')
     and (public.tracker_stats_queue() is null or t.queue = public.tracker_stats_queue())
   order by t.id, t.created_at;
$$;
revoke all on function public.tracker_stat_rows(text) from public, anon, authenticated;

-- Totali della patch: partite, vittorie di chi traccia, giocatori, partite con la Leggendaria avversaria (per le quote).
create or replace function public.tracker_stats_overview(p_patch text)
returns table (games bigint, wins bigint, players bigint, with_opponent bigint)
language sql stable security definer set search_path = public, pg_temp as $$
  with r as (select * from public.tracker_stat_rows(p_patch)),
  o as (select count(*) as n, count(distinct r.owner) as p from r where r.opponent is not null)
  select count(*), count(*) filter (where r.win), count(distinct r.owner),
         (select case when public.tracker_stats_ok(o.n, o.p) then o.n end from o)
    from r
  having public.tracker_stats_ok(count(*), count(distinct r.owner));
$$;

-- Win rate per Leggendaria del mazzo di chi traccia.
create or replace function public.tracker_stats_legendaries(p_patch text)
returns table (legendary text, games bigint, wins bigint, players bigint)
language sql stable security definer set search_path = public, pg_temp as $$
  select r.legendary, count(*), count(*) filter (where r.win), count(distinct r.owner)
    from public.tracker_stat_rows(p_patch) r
   where r.legendary is not null
   group by r.legendary
  having public.tracker_stats_ok(count(*), count(distinct r.owner))
   order by count(*) desc, r.legendary;
$$;

-- Win rate per lista esatta (le 13 carte): il sito la confronta con i mazzi della community (deckListKey di stats.ts).
create or replace function public.tracker_stats_lists(p_patch text)
returns table (list text, legendary text, games bigint, wins bigint, players bigint)
language sql stable security definer set search_path = public, pg_temp as $$
  select r.list, min(r.legendary), count(*), count(*) filter (where r.win), count(distinct r.owner)
    from public.tracker_stat_rows(p_patch) r
   where r.list is not null
   group by r.list
  having public.tracker_stats_ok(count(*), count(distinct r.owner))
   order by count(*) desc, r.list;
$$;

-- Win rate per archetipo (suggestArchetype di src/lib/archetype.ts, calcolato dal sito all'invio).
create or replace function public.tracker_stats_archetypes(p_patch text)
returns table (archetype text, games bigint, wins bigint, players bigint)
language sql stable security definer set search_path = public, pg_temp as $$
  select r.archetype, count(*), count(*) filter (where r.win), count(distinct r.owner)
    from public.tracker_stat_rows(p_patch) r
   where r.archetype is not null
   group by r.archetype
  having public.tracker_stats_ok(count(*), count(distinct r.owner))
   order by count(*) desc, r.archetype;
$$;

-- Carte: win rate quando sono nel mazzo e quando chi traccia le gioca, turno medio della prima giocata. Ogni gruppo di
-- numeri ha la sua soglia (null sotto soglia); una carta compare se almeno un gruppo la supera.
create or replace function public.tracker_stats_cards(p_patch text)
returns table (card text, deck_games bigint, deck_wins bigint, deck_players bigint, played_games bigint, played_wins bigint, played_players bigint, avg_turn numeric)
language sql stable security definer set search_path = public, pg_temp as $$
  with r as (select * from public.tracker_stat_rows(p_patch)),
  in_deck as (
    select c.card, count(distinct r.id) as games, count(distinct r.id) filter (where r.win) as wins, count(distinct r.owner) as players
      from r cross join lateral unnest(r.cards) as c(card)
     group by c.card
  ),
  first_play as (
    select r.id, r.owner, r.win, p.x ->> 'c' as card, min((p.x ->> 't')::integer) as turn
      from r cross join lateral jsonb_array_elements(r.plays) as p(x)
     where p.x ->> 'm' = 'true' and jsonb_typeof(p.x -> 'c') = 'string'
     group by r.id, r.owner, r.win, p.x ->> 'c'
  ),
  played as (
    select f.card, count(*) as games, count(*) filter (where f.win) as wins, count(distinct f.owner) as players, round(avg(f.turn), 1) as avg_turn
      from first_play f
     group by f.card
  ),
  j as (
    select coalesce(d.card, p.card) as card, d.games as dg, d.wins as dw, d.players as dp, p.games as pg, p.wins as pw, p.players as pp, p.avg_turn as pt,
           public.tracker_stats_ok(d.games, d.players) as ok_d, public.tracker_stats_ok(p.games, p.players) as ok_p
      from in_deck d full join played p on p.card = d.card
  )
  select j.card,
         case when j.ok_d then j.dg end, case when j.ok_d then j.dw end, case when j.ok_d then j.dp end,
         case when j.ok_p then j.pg end, case when j.ok_p then j.pw end, case when j.ok_p then j.pp end, case when j.ok_p then j.pt end
    from j
   where j.ok_d or j.ok_p
   order by coalesce(j.dg, 0) desc, j.card;
$$;

-- Scontri fra Leggendarie: esito dal lato di chi traccia, con la sua Leggendaria contro quella avversaria.
create or replace function public.tracker_stats_matchups(p_patch text)
returns table (legendary text, opponent text, games bigint, wins bigint, players bigint)
language sql stable security definer set search_path = public, pg_temp as $$
  select r.legendary, r.opponent, count(*), count(*) filter (where r.win), count(distinct r.owner)
    from public.tracker_stat_rows(p_patch) r
   where r.legendary is not null and r.opponent is not null
   group by r.legendary, r.opponent
  having public.tracker_stats_ok(count(*), count(distinct r.owner))
   order by count(*) desc, r.legendary, r.opponent;
$$;

-- Leggendarie più incontrate: quante partite contro ognuna (la quota è games / with_opponent della panoramica) e
-- l'esito di chi traccia contro di lei.
create or replace function public.tracker_stats_opponents(p_patch text)
returns table (opponent text, games bigint, wins bigint, players bigint)
language sql stable security definer set search_path = public, pg_temp as $$
  select r.opponent, count(*), count(*) filter (where r.win), count(distinct r.owner)
    from public.tracker_stat_rows(p_patch) r
   where r.opponent is not null
   group by r.opponent
  having public.tracker_stats_ok(count(*), count(distinct r.owner))
   order by count(*) desc, r.opponent;
$$;

revoke all on function public.tracker_stats_overview(text) from public;
revoke all on function public.tracker_stats_legendaries(text) from public;
revoke all on function public.tracker_stats_lists(text) from public;
revoke all on function public.tracker_stats_archetypes(text) from public;
revoke all on function public.tracker_stats_cards(text) from public;
revoke all on function public.tracker_stats_matchups(text) from public;
revoke all on function public.tracker_stats_opponents(text) from public;
grant execute on function public.tracker_stats_overview(text) to anon, authenticated;
grant execute on function public.tracker_stats_legendaries(text) to anon, authenticated;
grant execute on function public.tracker_stats_lists(text) to anon, authenticated;
grant execute on function public.tracker_stats_archetypes(text) to anon, authenticated;
grant execute on function public.tracker_stats_cards(text) to anon, authenticated;
grant execute on function public.tracker_stats_matchups(text) to anon, authenticated;
grant execute on function public.tracker_stats_opponents(text) to anon, authenticated;

-- Controlli puri: li usano tracker_submit e le statistiche (che girano come proprietario) e la prova a secco.
revoke all on function public.tracker_key_ok(jsonb) from public, anon;
revoke all on function public.tracker_int_ok(jsonb, integer, integer) from public, anon;
revoke all on function public.tracker_ts_ok(text) from public, anon;
revoke all on function public.tracker_match_ok(jsonb) from public, anon;
revoke all on function public.tracker_stats_ok(bigint, bigint) from public, anon;
revoke all on function public.tracker_stats_queue() from public, anon;
grant execute on function public.tracker_key_ok(jsonb) to authenticated;
grant execute on function public.tracker_int_ok(jsonb, integer, integer) to authenticated;
grant execute on function public.tracker_ts_ok(text) to authenticated;
grant execute on function public.tracker_match_ok(jsonb) to authenticated;
grant execute on function public.tracker_stats_ok(bigint, bigint) to authenticated;
grant execute on function public.tracker_stats_queue() to authenticated;

-- ===== 02/10/2026: INTERESSE ANALYTICS =====
-- Pagina /analytics (Pierluigi, 02/10/2026: "un bel tasto sia sopra che sotto, 'sei interessato al tool?', così
-- raccogliamo i numeri di chi vorrebbe il tool, poi andrò da Kevin a mostrarglielo"). Si conta una volta per browser
-- (`client_key`, un numero a caso che la pagina tiene nel browser) e una volta per account (chi ha fatto l'accesso);
-- niente email, niente IP. La tabella non si legge né si scrive direttamente: solo le due funzioni, che restituiscono
-- i totali. Contro le raffiche: al massimo 30 iscrizioni al minuto in tutto. Tutto è idempotente.
create table if not exists public.analytics_interest (
  id bigint generated always as identity primary key,
  client_key text not null unique check (client_key ~ '^[0-9a-f]{32}$'),
  user_id uuid references public.profiles(id) on delete cascade,
  locale text not null check (locale in ('en', 'it', 'es', 'fr')),
  source text not null check (source in ('top', 'bottom')),
  created_at timestamptz not null default now()
);
create unique index if not exists analytics_interest_user_idx on public.analytics_interest (user_id) where user_id is not null;
create index if not exists analytics_interest_created_idx on public.analytics_interest (created_at);
alter table public.analytics_interest enable row level security;
revoke all on public.analytics_interest from anon, authenticated;

-- Iscrive chi preme il tasto. `added` = false se quel browser o quell'account c'era già (i totali non cambiano);
-- un browser già contato senza account prende l'account appena chi lo usa ha fatto l'accesso.
create or replace function public.analytics_interest_add(p_client text, p_locale text, p_source text)
returns table (total bigint, accounts bigint, added boolean)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  n integer := 0;
begin
  if p_client is null or p_client !~ '^[0-9a-f]{32}$' or p_locale is null or p_locale not in ('en', 'it', 'es', 'fr')
     or p_source is null or p_source not in ('top', 'bottom') then
    raise exception 'invalid';
  end if;
  if uid is not null and not exists (select 1 from public.analytics_interest a where a.user_id = uid) then
    update public.analytics_interest set user_id = uid where client_key = p_client and user_id is null;
  end if;
  if not exists (select 1 from public.analytics_interest a where a.client_key = p_client or (uid is not null and a.user_id = uid)) then
    if (select count(*) from public.analytics_interest a where a.created_at > now() - interval '1 minute') >= 30 then
      raise exception 'rate_limited';
    end if;
    insert into public.analytics_interest (client_key, user_id, locale, source) values (p_client, uid, p_locale, p_source)
    on conflict do nothing;
    get diagnostics n = row_count;
  end if;
  return query select (select count(*) from public.analytics_interest),
                      (select count(*) from public.analytics_interest a where a.user_id is not null),
                      n > 0;
end $$;
revoke all on function public.analytics_interest_add(text, text, text) from public;
grant execute on function public.analytics_interest_add(text, text, text) to anon, authenticated;

-- I totali, per la pagina (ISR) e per lo staff: quanti browser e quanti account.
create or replace function public.analytics_interest_count()
returns table (total bigint, accounts bigint)
language sql stable security definer set search_path = public, pg_temp as $$
  select count(*), count(*) filter (where user_id is not null) from public.analytics_interest;
$$;
revoke all on function public.analytics_interest_count() from public;
grant execute on function public.analytics_interest_count() to anon, authenticated;

-- =====================================================================================================
-- ===== 02/10/2026: DRAFT ONLINE =====
-- =====================================================================================================
-- Draft fra due persone su /draft (fase 2; Pierluigi: "ok pusha su main e passa alla fase 2", accesso obbligatorio).
-- Le regole stanno tutte nel motore TypeScript del sito (src/lib/draft/engine.ts e online.ts), che gira nelle Server
-- Action: qui il database conserva le stanze e lo stato e accetta le scritture SOLO dal server, cioè con la sessione del
-- giocatore E con il segreto del cron (CRON_SECRET, la stessa impronta di notify_keys che usa notify_key_ok). Così un
-- iscritto non può scrivere uno stato inventato via API, e nessun client legge lo stato intero (seme, carte future,
-- scelte nascoste dell'avversario): al browser arriva solo la vista del suo posto, calcolata dal server.
-- draft_rooms ha solo dati pubblici fra i due giocatori (formato, stato, chi gioca, versione): ognuno dei due legge
-- la sua riga e la riceve in tempo reale (pubblicazione supabase_realtime), così il browser sa quando chiedere la vista
-- nuova. Le stanze si cancellano da sole (draft_rooms_cleanup, dal cron ogni 10 minuti): in attesa dopo 2 ore, ferme
-- dopo 6, finite dopo 24. Tutto è idempotente.
create table if not exists public.draft_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$'),
  format text not null check (format in ('exchange', 'triple', 'packs')),
  status text not null default 'waiting' check (status in ('waiting', 'drafting', 'done')),
  creator uuid not null references public.profiles(id) on delete cascade,
  joiner uuid references public.profiles(id) on delete cascade,
  -- rivincita: solo l'avversario della stanza di prima può entrare
  invited uuid references public.profiles(id) on delete set null,
  -- rivincita proposta da uno dei due a draft finito: il codice della stanza nuova
  next_code text check (next_code is null or next_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$'),
  version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (joiner is null or joiner <> creator)
);
create index if not exists draft_rooms_creator_idx on public.draft_rooms (creator, created_at);
create index if not exists draft_rooms_joiner_idx on public.draft_rooms (joiner);
create index if not exists draft_rooms_updated_idx on public.draft_rooms (updated_at);
alter table public.draft_rooms enable row level security;
revoke all on public.draft_rooms from anon, authenticated;
grant select (id, code, format, status, creator, joiner, invited, next_code, version, created_at, updated_at) on public.draft_rooms to authenticated;
drop policy if exists "draft rooms players read" on public.draft_rooms;
create policy "draft rooms players read" on public.draft_rooms for select to authenticated using (auth.uid() = creator or auth.uid() = joiner);

create table if not exists public.draft_room_states (
  room_id uuid primary key references public.draft_rooms(id) on delete cascade,
  state jsonb not null check (jsonb_typeof(state) = 'object' and pg_column_size(state) < 300000)
);
alter table public.draft_room_states enable row level security;
drop policy if exists "draft room states no direct access" on public.draft_room_states;
create policy "draft room states no direct access" on public.draft_room_states as restrictive for all to anon, authenticated using (false) with check (false);
revoke all on public.draft_room_states from anon, authenticated;

-- tempo reale: i due giocatori ricevono i cambi della loro riga (RLS qui sopra). Solo se la pubblicazione c'è (Supabase).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'draft_rooms') then
    alter publication supabase_realtime add table public.draft_rooms;
  end if;
end $$;

-- Chi chiama è il server per conto di un giocatore con l'accesso fatto? (sessione + segreto del cron)
create or replace function public.draft_server_ok(p_key text)
returns uuid language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if not public.notify_key_ok(p_key) then raise exception 'forbidden'; end if;
  return uid;
end $$;
revoke all on function public.draft_server_ok(text) from public, anon, authenticated;

-- Stanza nuova, in attesa dell'avversario. `p_from`: la stanza finita da cui parte la rivincita (solo l'altro giocatore
-- potrà entrare, e la stanza di prima la segnala ai due). Al massimo 30 stanze create al giorno per persona.
create or replace function public.draft_room_create(p_key text, p_code text, p_format text, p_from text default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := public.draft_server_ok(p_key);
  prev public.draft_rooms;
  other uuid;
  rid uuid;
begin
  if (select count(*) from public.draft_rooms r where r.creator = uid and r.created_at > now() - interval '1 day') >= 30 then
    raise exception 'rate_limited';
  end if;
  if p_from is not null then
    select * into prev from public.draft_rooms r where r.code = p_from for update;
    if not found or prev.status <> 'done' or uid not in (prev.creator, prev.joiner) then raise exception 'bad_rematch'; end if;
    if prev.next_code is not null then raise exception 'rematch_exists'; end if;
    other := case when uid = prev.creator then prev.joiner else prev.creator end;
  end if;
  insert into public.draft_rooms (code, format, creator, invited) values (p_code, p_format, uid, other) returning id into rid;
  if p_from is not null then
    update public.draft_rooms set next_code = p_code, version = version + 1, updated_at = now() where id = prev.id;
  end if;
  return rid;
end $$;
revoke all on function public.draft_room_create(text, text, text, text) from public, anon;
grant execute on function public.draft_room_create(text, text, text, text) to authenticated;

-- La stanza per il server: dati pubblici, nomi dei due giocatori e, solo a chi gioca, lo stato intero e il suo posto
-- (0 chi l'ha creata, 1 chi è entrato). A chi non gioca la stanza in attesa si mostra senza stato, per entrare.
create or replace function public.draft_room_get(p_key text, p_code text)
returns table (id uuid, code text, format text, status text, creator uuid, joiner uuid, invited uuid, next_code text, version integer,
               created_at timestamptz, updated_at timestamptz, creator_name text, joiner_name text, seat integer, state jsonb)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  uid uuid := public.draft_server_ok(p_key);
begin
  return query
    select r.id, r.code, r.format, r.status, r.creator, r.joiner, r.invited, r.next_code, r.version, r.created_at, r.updated_at,
           pc.username, pj.username,
           case when uid = r.creator then 0 when uid = r.joiner then 1 end,
           case when uid in (r.creator, r.joiner) then s.state end
    from public.draft_rooms r
    left join public.profiles pc on pc.id = r.creator
    left join public.profiles pj on pj.id = r.joiner
    left join public.draft_room_states s on s.room_id = r.id
    where r.code = p_code;
end $$;
revoke all on function public.draft_room_get(text, text) from public, anon;
grant execute on function public.draft_room_get(text, text) to authenticated;

-- Entra nella stanza e la fa partire con lo stato iniziale calcolato dal server. Restituisce la versione nuova.
create or replace function public.draft_room_join(p_key text, p_code text, p_state jsonb)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := public.draft_server_ok(p_key);
  r public.draft_rooms;
begin
  select * into r from public.draft_rooms d where d.code = p_code for update;
  if not found then raise exception 'not_found'; end if;
  if r.status <> 'waiting' or r.joiner is not null then raise exception 'room_full'; end if;
  if uid = r.creator then raise exception 'own_room'; end if;
  if r.invited is not null and r.invited <> uid then raise exception 'not_invited'; end if;
  insert into public.draft_room_states (room_id, state) values (r.id, p_state)
    on conflict (room_id) do update set state = excluded.state;
  update public.draft_rooms set joiner = uid, status = 'drafting', version = version + 1, updated_at = now() where id = r.id;
  return r.version + 1;
end $$;
revoke all on function public.draft_room_join(text, text, jsonb) from public, anon;
grant execute on function public.draft_room_join(text, text, jsonb) to authenticated;

-- Salva lo stato dopo una mossa, solo se nessuno l'ha cambiato nel frattempo (`p_version`): altrimenti null e il
-- server rilegge e riprova. `p_done`: il draft è finito.
create or replace function public.draft_room_put(p_key text, p_code text, p_version integer, p_state jsonb, p_done boolean)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := public.draft_server_ok(p_key);
  r public.draft_rooms;
begin
  select * into r from public.draft_rooms d where d.code = p_code for update;
  if not found then raise exception 'not_found'; end if;
  if uid is distinct from r.creator and uid is distinct from r.joiner then raise exception 'forbidden'; end if;
  if r.status <> 'drafting' then raise exception 'not_drafting'; end if;
  if r.version <> p_version then return null; end if;
  update public.draft_room_states set state = p_state where room_id = r.id;
  update public.draft_rooms set version = version + 1, status = case when p_done then 'done' else 'drafting' end, updated_at = now() where id = r.id;
  return r.version + 1;
end $$;
revoke all on function public.draft_room_put(text, text, integer, jsonb, boolean) from public, anon;
grant execute on function public.draft_room_put(text, text, integer, jsonb, boolean) to authenticated;

-- Pulizia dal cron (/api/cron/live, senza sessione): solo il segreto. Restituisce le stanze cancellate.
create or replace function public.draft_rooms_cleanup(p_key text)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  n integer;
begin
  if not public.notify_key_ok(p_key) then raise exception 'forbidden'; end if;
  delete from public.draft_rooms
  where (status = 'waiting' and updated_at < now() - interval '2 hours')
     or (status = 'drafting' and updated_at < now() - interval '6 hours')
     or (status = 'done' and updated_at < now() - interval '1 day');
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.draft_rooms_cleanup(text) from public;
grant execute on function public.draft_rooms_cleanup(text) to anon, authenticated;

-- =====================================================================================================
-- ===== 04/10/2026: MAZZI TORNEO =====
-- =====================================================================================================
-- Mazzi torneo (Pierluigi, 04/10/2026: "nella sezione mazzi creiamo una sezione Mazzi torneo dove gli utenti potranno
-- inserire 3 mazzi insieme con relativa guida"; scelte: tre liste nuove nel pacchetto, regole Conquest obbligatorie,
-- voti, traduzione, Discord, statistiche e strumenti per le dirette). Un "mazzo torneo" è un trio di mazzi giocabile
-- in un torneo Conquest come la Crimson Cup: tre Leggendarie diverse e almeno 8 carte uniche diverse fra ogni coppia
-- di mazzi (RULES.conquestMinDifferent in src/lib/deckrules.ts, DECK_SET_MIN_DIFFERENT in deckSets.ts: il test
-- deckSets.test.ts confronta i numeri). Le regole del gioco (carte che esistono, Leggendarie vere) le controlla il sito
-- con il database delle carte (`checkDeck`); qui il database tiene la forma dei tre mazzi e le regole Conquest, così
-- nessuno pubblica un trio non valido via API. Niente mazzi privati: stati 'published' e 'hidden'.
-- Tetto: lo stesso numero dei mazzi singoli (max_published_decks: 5 per la community, 20 per l'Autore, nessuno per
-- Creator, Pro, Staff e admin), contato a parte. Voti 1–5 come i mazzi (mai sul proprio trio), statistiche per
-- l'autore come il blocco STATS (solo totali), avvisi a chi segue con il tipo nuovo `deck_set_published`.
-- Codice in src/lib/community/deckSets.ts (regole pure, test), deckSetQueries.ts, deckSetActions.ts; pagine in
-- src/app/[locale]/(site)/decks/tournament/. Tutto è idempotente.

create table if not exists public.community_deck_sets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  owner uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  -- i tre mazzi, nell'ordine dell'autore: [{ name, legendary, cards: [12 slug], custom_cards, archetype, code_om }]
  decks jsonb not null,
  -- le tre Leggendarie, nell'ordine dei mazzi: le scrive solo il trigger guard_deck_set (filtri e ricerca)
  legendaries text[] not null default '{}',
  guide jsonb not null default '{}'::jsonb,
  translations jsonb,
  videos jsonb not null default '[]'::jsonb,
  links jsonb not null default '[]'::jsonb,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.community_deck_sets drop constraint if exists community_deck_sets_slug_check;
alter table public.community_deck_sets add constraint community_deck_sets_slug_check check (char_length(slug) between 3 and 80 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
alter table public.community_deck_sets drop constraint if exists community_deck_sets_name_check;
alter table public.community_deck_sets add constraint community_deck_sets_name_check check (char_length(name) between 3 and 60);
alter table public.community_deck_sets drop constraint if exists community_deck_sets_status_check;
alter table public.community_deck_sets add constraint community_deck_sets_status_check check (status in ('published', 'hidden'));
alter table public.community_deck_sets drop constraint if exists community_deck_sets_decks_check;
alter table public.community_deck_sets add constraint community_deck_sets_decks_check check (jsonb_typeof(decks) = 'array' and jsonb_array_length(decks) = 3);
alter table public.community_deck_sets drop constraint if exists community_deck_sets_media_check;
alter table public.community_deck_sets add constraint community_deck_sets_media_check check (public.deck_videos_ok(videos) and public.deck_links_ok(links));
create index if not exists community_deck_sets_status_idx on public.community_deck_sets (status, created_at desc);
create index if not exists community_deck_sets_owner_idx on public.community_deck_sets (owner);
create index if not exists community_deck_sets_legendaries_idx on public.community_deck_sets using gin (legendaries);

-- Guida del trio: lingua (en, it, es), riassunto 20–600 caratteri, sezioni facoltative fino a 2000 (le chiavi di
-- DECK_SET_GUIDE_SECTIONS in deckSets.ts: il ruolo di ogni mazzo, punti di forza e deboli, scontri, note).
create or replace function public.deck_set_guide_ok(g jsonb)
returns boolean language sql immutable set search_path = public, pg_temp as $$
  select jsonb_typeof(g) = 'object'
     and coalesce(g->>'lang', '') in ('en', 'it', 'es', 'fr')
     and jsonb_typeof(g->'summary') = 'string'
     and char_length(g->>'summary') between 20 and 600
     and not exists (
       select 1 from jsonb_each(g) e
       where e.key not in ('lang', 'summary', 'deck_1', 'deck_2', 'deck_3', 'strengths', 'weaknesses', 'matchups', 'notes')
          or (e.key not in ('lang', 'summary') and (jsonb_typeof(e.value) <> 'string' or char_length(e.value #>> '{}') > 2000))
     );
$$;
alter table public.community_deck_sets drop constraint if exists community_deck_sets_guide_check;
alter table public.community_deck_sets add constraint community_deck_sets_guide_check check (public.deck_set_guide_ok(guide));

-- Le carte uniche di un mazzo (Leggendaria compresa): ogni carta conta una volta, come `physicalCards` di deckrules.ts.
create or replace function public.deck_set_unique_cards(d jsonb)
returns text[] language sql immutable set search_path = public, pg_temp as $$
  select array(select distinct x from (select d->>'legendary' as x union all select jsonb_array_elements_text(d->'cards')) s where x is not null);
$$;

-- Forma dei tre mazzi e regole Conquest. Scrive anche `legendaries`. Errori: 'deck_set_invalid' (forma),
-- 'deck_set_legendaries' (Leggendarie ripetute), 'deck_set_similar' (meno di 8 carte uniche diverse fra due mazzi).
create or replace function public.guard_deck_set()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare
  d jsonb;
  i int;
  j int;
  a text[];
  b text[];
  min_different constant int := 8;
begin
  if jsonb_typeof(new.decks) is distinct from 'array' or jsonb_array_length(new.decks) <> 3 then
    raise exception 'deck_set_invalid' using errcode = 'check_violation';
  end if;
  for d in select value from jsonb_array_elements(new.decks) loop
    if jsonb_typeof(d) <> 'object'
       or jsonb_typeof(d->'legendary') is distinct from 'string' or char_length(d->>'legendary') not between 1 and 80
       or jsonb_typeof(d->'cards') is distinct from 'array' or jsonb_array_length(d->'cards') <> 12
       or (d ? 'name' and (jsonb_typeof(d->'name') <> 'string' or char_length(d->>'name') > 60))
       or (d ? 'custom_cards' and jsonb_typeof(d->'custom_cards') <> 'array')
       or (d ? 'archetype' and (jsonb_typeof(d->'archetype') <> 'string' or char_length(d->>'archetype') > 40))
       or (d ? 'code_om' and (jsonb_typeof(d->'code_om') <> 'string' or char_length(d->>'code_om') > 4000))
       or exists (select 1 from jsonb_array_elements(d->'cards') c where jsonb_typeof(c) <> 'string' or char_length(c #>> '{}') not between 1 and 80)
    then
      raise exception 'deck_set_invalid' using errcode = 'check_violation';
    end if;
    if (select count(distinct c) from jsonb_array_elements_text(d->'cards') c) <> 12 or (d->'cards') ? (d->>'legendary') then
      raise exception 'deck_set_invalid' using errcode = 'check_violation';
    end if;
  end loop;
  new.legendaries := array(select e.value->>'legendary' from jsonb_array_elements(new.decks) with ordinality as e(value, n) order by e.n);
  if (select count(distinct x) from unnest(new.legendaries) x) <> 3 then
    raise exception 'deck_set_legendaries' using errcode = 'check_violation';
  end if;
  for i in 0..1 loop
    for j in (i + 1)..2 loop
      a := public.deck_set_unique_cards(new.decks->i);
      b := public.deck_set_unique_cards(new.decks->j);
      if (select count(*) from unnest(a) x where not (x = any (b))) < min_different then
        raise exception 'deck_set_similar' using errcode = 'check_violation';
      end if;
    end loop;
  end loop;
  return new;
end $$;
revoke all on function public.guard_deck_set() from public, anon, authenticated;
drop trigger if exists community_deck_sets_guard on public.community_deck_sets;
create trigger community_deck_sets_guard before insert or update of decks on public.community_deck_sets
  for each row execute function public.guard_deck_set();

-- updated_at: come i mazzi (blocco delle traduzioni), le sole traduzioni non spostano la data della pagina.
create or replace function public.touch_deck_set()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if (to_jsonb(new) - 'translations' - 'updated_at') = (to_jsonb(old) - 'translations' - 'updated_at') then
    new.updated_at := old.updated_at;
  else
    new.updated_at := now();
  end if;
  return new;
end $$;
revoke all on function public.touch_deck_set() from public, anon, authenticated;
drop trigger if exists community_deck_sets_touch on public.community_deck_sets;
create trigger community_deck_sets_touch before update on public.community_deck_sets
  for each row execute function public.touch_deck_set();

drop trigger if exists community_deck_sets_guard_created on public.community_deck_sets;
create trigger community_deck_sets_guard_created before insert or update on public.community_deck_sets
  for each row execute function public.guard_created_at();

-- Tetto ai mazzi torneo: lo stesso numero dei mazzi singoli, contato a parte (pubblicati e nascosti insieme).
create or replace function public.enforce_deck_set_limit()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  used int;
  cap int;
begin
  if tg_op = 'UPDATE' and old.owner = new.owner then return new; end if;
  cap := coalesce(public.max_published_decks(new.owner), 5);
  select count(*) into used from public.community_deck_sets where owner = new.owner and id <> new.id;
  if used >= cap then raise exception 'deck_set_limit' using errcode = 'check_violation'; end if;
  return new;
end $$;
revoke all on function public.enforce_deck_set_limit() from public, anon, authenticated;
drop trigger if exists community_deck_sets_limit on public.community_deck_sets;
create trigger community_deck_sets_limit before insert or update of owner on public.community_deck_sets
  for each row execute function public.enforce_deck_set_limit();

alter table public.community_deck_sets enable row level security;
drop policy if exists "deck sets: published are public" on public.community_deck_sets;
create policy "deck sets: published are public" on public.community_deck_sets for select
  using (status = 'published' or owner = auth.uid() or public.is_admin());
drop policy if exists "deck sets: users insert own" on public.community_deck_sets;
create policy "deck sets: users insert own" on public.community_deck_sets for insert to authenticated
  with check (owner = auth.uid());
drop policy if exists "deck sets: owners update" on public.community_deck_sets;
create policy "deck sets: owners update" on public.community_deck_sets for update to authenticated
  using (owner = auth.uid() or public.is_admin()) with check (owner = auth.uid() or public.is_admin());
drop policy if exists "deck sets: owners delete" on public.community_deck_sets;
create policy "deck sets: owners delete" on public.community_deck_sets for delete to authenticated
  using (owner = auth.uid() or public.is_admin());
revoke all on public.community_deck_sets from anon, authenticated;
grant select on public.community_deck_sets to anon, authenticated;
grant insert, update, delete on public.community_deck_sets to authenticated;

-- ---------- voti dei mazzi torneo (1–5 stelle, uno per utente, mai sul proprio trio) ----------
create table if not exists public.deck_set_votes (
  set_id uuid not null references public.community_deck_sets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (set_id, user_id)
);
create index if not exists deck_set_votes_user_idx on public.deck_set_votes (user_id);
drop trigger if exists deck_set_votes_touch on public.deck_set_votes;
create trigger deck_set_votes_touch before update on public.deck_set_votes
  for each row execute function public.touch_updated_at();
drop trigger if exists deck_set_votes_guard_created on public.deck_set_votes;
create trigger deck_set_votes_guard_created before insert or update on public.deck_set_votes
  for each row execute function public.guard_created_at();

alter table public.deck_set_votes enable row level security;
drop policy if exists "deck set votes are public" on public.deck_set_votes;
create policy "deck set votes are public" on public.deck_set_votes for select using (true);
drop policy if exists "deck set votes: users vote once" on public.deck_set_votes;
create policy "deck set votes: users vote once" on public.deck_set_votes for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.community_deck_sets s where s.id = set_id and s.status = 'published' and s.owner <> auth.uid()));
drop policy if exists "deck set votes: users change own" on public.deck_set_votes;
create policy "deck set votes: users change own" on public.deck_set_votes for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.community_deck_sets s where s.id = set_id and s.status = 'published' and s.owner <> auth.uid()));
drop policy if exists "deck set votes: users remove own" on public.deck_set_votes;
create policy "deck set votes: users remove own" on public.deck_set_votes for delete to authenticated using (user_id = auth.uid());
revoke all on public.deck_set_votes from anon, authenticated;
grant select on public.deck_set_votes to anon, authenticated;
grant insert, update, delete on public.deck_set_votes to authenticated;

create or replace view public.deck_set_ratings as
  select set_id, round(avg(stars)::numeric, 2) as avg_stars, count(*)::int as votes
  from public.deck_set_votes group by set_id;
revoke all on public.deck_set_ratings from anon, authenticated;
grant select on public.deck_set_ratings to anon, authenticated;

-- ---------- statistiche dei mazzi torneo per l'autore (come il blocco STATS: solo totali, stime) ----------
create table if not exists public.deck_set_stats_daily (
  set_id uuid not null references public.community_deck_sets(id) on delete cascade,
  day date not null,
  views int not null default 0 check (views >= 0),
  code_copies int not null default 0 check (code_copies >= 0),
  link_clicks int not null default 0 check (link_clicks >= 0),
  video_plays int not null default 0 check (video_plays >= 0),
  primary key (set_id, day)
);
create index if not exists deck_set_stats_daily_day_idx on public.deck_set_stats_daily (day);
alter table public.deck_set_stats_daily enable row level security;

create or replace function public.deck_set_stats_owns(sid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (select 1 from public.community_deck_sets s where s.id = sid and s.owner = auth.uid());
$$;
revoke all on function public.deck_set_stats_owns(uuid) from public, anon;
grant execute on function public.deck_set_stats_owns(uuid) to authenticated;

drop policy if exists "deck set stats: owners and staff read" on public.deck_set_stats_daily;
create policy "deck set stats: owners and staff read" on public.deck_set_stats_daily for select to authenticated
  using ((select public.deck_stats_is_staff()) or public.deck_set_stats_owns(set_id));
revoke all on public.deck_set_stats_daily from anon, authenticated;
grant select on public.deck_set_stats_daily to authenticated;

-- +1 al contatore di oggi (UTC) di un mazzo torneo pubblicato, con le regole di bump_deck_stat (tetto 2.000).
create or replace function public.bump_deck_set_stat(p_slug text, p_kind text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  sid uuid;
  sowner uuid;
  today date := (now() at time zone 'utc')::date;
  cap constant int := 2000;
begin
  if p_kind is null or p_kind not in ('view', 'code', 'link', 'video') then return; end if;
  if p_slug is null or char_length(p_slug) not between 1 and 120 then return; end if;
  select s.id, s.owner into sid, sowner from public.community_deck_sets s where s.slug = p_slug and s.status = 'published';
  if sid is null then return; end if;
  if sowner = auth.uid() then return; end if;
  if exists (
    select 1 from public.deck_set_stats_daily st
    where st.set_id = sid and st.day = today
      and case p_kind when 'view' then st.views when 'code' then st.code_copies when 'link' then st.link_clicks else st.video_plays end >= cap
  ) then return; end if;
  insert into public.deck_set_stats_daily as st (set_id, day, views, code_copies, link_clicks, video_plays)
  values (sid, today, (p_kind = 'view')::int, (p_kind = 'code')::int, (p_kind = 'link')::int, (p_kind = 'video')::int)
  on conflict (set_id, day) do update set
    views = st.views + excluded.views,
    code_copies = st.code_copies + excluded.code_copies,
    link_clicks = st.link_clicks + excluded.link_clicks,
    video_plays = st.video_plays + excluded.video_plays
  where case p_kind when 'view' then st.views when 'code' then st.code_copies when 'link' then st.link_clicks else st.video_plays end < cap;
end $$;
revoke all on function public.bump_deck_set_stat(text, text) from public;
grant execute on function public.bump_deck_set_stat(text, text) to anon, authenticated;

-- ---------- avvisi a chi segue: un mazzo torneo nuovo ----------
-- Il tipo `deck_set_published` (NOTIFICATION_KINDS di notifications.ts) nei vincoli delle due tabelle del blocco SEGUI e
-- in notify_followers, che vuole `/decks/tournament/<slug>` di un mazzo torneo pubblicato dell'autore. Il resto della
-- funzione è quello del blocco FUMETTI.
alter table public.notifications drop constraint if exists notifications_kind_check;
-- `not valid`: vedi il blocco FUMETTI (lo schema riapplicato non deve ricontrollare le righe con un elenco vecchio)
alter table public.notifications add constraint notifications_kind_check check (kind in ('deck_published', 'live', 'guide_published', 'comic_published', 'deck_set_published')) not valid;
alter table public.notification_events drop constraint if exists notification_events_kind_check;
alter table public.notification_events add constraint notification_events_kind_check check (kind in ('deck_published', 'live', 'guide_published', 'comic_published', 'deck_set_published')) not valid;

create or replace function public.notify_followers(p_kind text, p_target text, p_actor uuid default null)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := auth.uid();
  v_actor uuid := coalesce(p_actor, auth.uid());
  v_target text := btrim(coalesce(p_target, ''));
  v_owner uuid;
  v_badge text;
  n integer;
begin
  if me is null then raise exception 'not_logged_in'; end if;
  if p_kind is null or p_kind not in ('deck_published', 'guide_published', 'comic_published', 'deck_set_published') then raise exception 'bad_kind'; end if;
  if char_length(v_target) > 160 then raise exception 'bad_target'; end if;
  if v_actor <> me and not public.is_staff() then raise exception 'forbidden'; end if;
  if p_kind = 'deck_published' then
    if v_target !~ '^/decks/community/[a-z0-9-]{1,80}$' then raise exception 'bad_target'; end if;
    -- '/decks/community/' sono 17 caratteri: lo slug comincia dal diciottesimo
    select d.owner into v_owner from public.community_decks d where d.slug = substr(v_target, 18) and d.status = 'published';
  elsif p_kind = 'deck_set_published' then
    if v_target !~ '^/decks/tournament/[a-z0-9-]{1,80}$' then raise exception 'bad_target'; end if;
    -- '/decks/tournament/' sono 18 caratteri: lo slug comincia dal diciannovesimo
    select s.owner into v_owner from public.community_deck_sets s where s.slug = substr(v_target, 19) and s.status = 'published';
  elsif p_kind = 'guide_published' then
    -- '/guides/community/' sono 18 caratteri: lo slug (3-60) comincia dal diciannovesimo
    if v_target !~ '^/guides/community/[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_target) not between 21 and 78 then
      raise exception 'bad_target';
    end if;
    if to_regclass('public.community_guides') is null then raise exception 'not_found'; end if;
    execute 'select g.owner from public.community_guides g where g.slug = $1 and g.status = ''published'''
      into v_owner using substr(v_target, 19);
  else
    -- '/news/comics/' sono 13 caratteri: lo slug (3-60) comincia dal quattordicesimo
    if v_target !~ '^/news/comics/[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_target) not between 16 and 73 then
      raise exception 'bad_target';
    end if;
    if to_regclass('public.community_comics') is null then raise exception 'not_found'; end if;
    execute 'select c.owner from public.community_comics c where c.slug = $1 and c.status = ''published'''
      into v_owner using substr(v_target, 14);
  end if;
  if v_owner is null or v_owner <> v_actor then raise exception 'not_found'; end if;
  select p.badge into v_badge from public.profiles p where p.id = v_actor;
  if v_badge is null or v_badge not in ('creator', 'author', 'pro', 'staff') then return 0; end if;
  perform pg_advisory_xact_lock(hashtext('om_notify:' || v_actor::text));
  if exists (select 1 from public.notification_events e where e.kind = p_kind and e.actor_id = v_actor and e.event_key = v_target) then return 0; end if;
  select count(*) into n from public.notification_events e
   where e.actor_id = v_actor and e.kind = p_kind and e.created_at > now() - interval '1 day';
  if n >= 10 then return 0; end if;
  return public.notify_fanout(v_actor, p_kind, v_target, v_target);
end $$;
revoke all on function public.notify_followers(text, text, uuid) from public, anon;
grant execute on function public.notify_followers(text, text, uuid) to authenticated;

comment on table public.community_deck_sets is 'Mazzi torneo (04/10/2026): tre mazzi Conquest con una guida, pubblicati dagli utenti. Regole in src/lib/community/deckSets.ts; forma e regole Conquest nel trigger guard_deck_set.';
comment on table public.deck_set_votes is 'Voti 1–5 dei mazzi torneo: uno per utente, mai sul proprio trio, solo su un trio pubblicato.';
comment on table public.deck_set_stats_daily is 'Statistiche giornaliere dei mazzi torneo per l''autore (solo totali): le scrive solo bump_deck_set_stat.';

-- =====================================================================================================
-- ===== 05/10/2026: TORNEO CRIMSON =====
-- =====================================================================================================
-- Il torneo di OriginsMeta di metà ottobre (Pierluigi, 05/10/2026: "64+ iscritti con le regole esatte della Crimson
-- Cup"; decisioni con Davdas: eliminazione diretta, al meglio delle tre con un'ora a turno, sconfitta a tavolino dopo
-- 15 minuti di assenza, tetto di 64 con lista d'attesa, arbitri). Tutto è facoltativo per torneo: i tornei già creati
-- hanno le opzioni spente e funzionano come prima.
--   - check-in (`checkin`): apre 2 ore prima dell'inizio e chiude 5 minuti prima, insieme alla consegna dei mazzi; con
--     il torneo pieno ci si iscrive in lista d'attesa (`status = 'waitlist'`). Un posto che si libera prima della
--     chiusura va al primo in lista; all'avvio i posti di chi non ha fatto il check-in vanno a chi è in lista e ha fatto
--     il check-in, in ordine di arrivo. Niente avvio automatico: avvia l'organizzatore (o un arbitro) all'ora d'inizio.
--   - liste segrete (`hidden_decklists`): l'avversario vede solo le Leggendarie (`tournament_legendaries`); le liste
--     complete di chi arriva in semifinale diventano pubbliche, le altre a torneo finito.
--   - finale al meglio di N (`final_best_of`): vale per l'ultima partita del tabellone (`tm_need`).
--   - assenza (`no_show_minutes`): dal momento in cui una partita ha i due giocatori (`ready_at`; dal secondo turno,
--     quando sono finite le due partite che la precedono) chi c'è può chiedere la vittoria a tavolino
--     (`claim_no_show`) se l'avversario non ha mai aperto la stanza partita (`seen_a`/`seen_b`, segnati da
--     `mark_match_seen`), né scritto in chat, né refertato.
--   - arbitri (`tournament_judges`): gestiscono partite, ritiri, scambi, check-in e avvio come l'organizzatore, vedono
--     mazzi, chat e screenshot; non annullano il torneo, non ne cambiano i dettagli, non gestiscono inviti e arbitri.
--   - ritiri: chi si ritira a torneo in corso (lui o lo staff) perde la partita in corso; se l'avversario non è ancora
--     noto, la perde appena arriva (`tm_propagate`).
--   - avviso "la tua partita è pronta" nella busta del sito (tipo `match_ready`).
-- Codice: src/lib/tournament/ (types.ts, util.ts, actions.ts, queries.ts), componenti ManagePanel, MatchRoom,
-- JoinTournament, TournamentForm, MatchReadyWatcher. Tutto è idempotente.

alter table public.tournaments add column if not exists checkin boolean not null default false;
alter table public.tournaments add column if not exists hidden_decklists boolean not null default false;
alter table public.tournaments add column if not exists final_best_of int;
alter table public.tournaments add column if not exists no_show_minutes int;
alter table public.tournaments drop constraint if exists tournaments_final_best_of_check;
alter table public.tournaments add constraint tournaments_final_best_of_check check (final_best_of is null or final_best_of in (1, 3, 5));
alter table public.tournaments drop constraint if exists tournaments_no_show_minutes_check;
alter table public.tournaments add constraint tournaments_no_show_minutes_check check (no_show_minutes is null or no_show_minutes between 5 and 60);

alter table public.tournament_players add column if not exists checked_in_at timestamptz;
alter table public.tournament_players drop constraint if exists tournament_players_status_check;
alter table public.tournament_players add constraint tournament_players_status_check check (status in ('registered', 'waitlist', 'dropped', 'disqualified'));

-- le Leggendarie dei mazzi consegnati, nell'ordine dei codici: le scrive solo il trigger tournament_decks_legendaries
alter table public.tournament_decks add column if not exists legendaries text[] not null default '{}';

alter table public.tournament_matches add column if not exists ready_at timestamptz;
alter table public.tournament_matches add column if not exists seen_a timestamptz;
alter table public.tournament_matches add column if not exists seen_b timestamptz;
alter table public.tournament_matches add column if not exists reported_at timestamptz;

create table if not exists public.tournament_judges (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (tournament_id, user_id)
);
create index if not exists tournament_judges_user_idx on public.tournament_judges (user_id);

-- ---------- Leggendarie dal codice OM1 (base64url del JSON { n, l, c, x }, src/lib/deckcode.ts) ----------
create or replace function public.om_code_legendary(code text)
returns text language plpgsql immutable as $$
declare
  at int;
  b text;
begin
  at := position('OM1.' in coalesce(code, ''));
  if at = 0 then return null; end if;
  b := translate(substr(code, at + 4), '-_', '+/');
  b := b || repeat('=', (4 - length(b) % 4) % 4);
  return left(convert_from(decode(b, 'base64'), 'UTF8')::jsonb ->> 'l', 80);
exception when others then
  return null;
end $$;

create or replace function public.tournament_decks_legendaries()
returns trigger language plpgsql as $$
begin
  new.legendaries := coalesce((
    select array_agg(coalesce(public.om_code_legendary(c.value), '') order by c.ordinality)
    from jsonb_array_elements_text(case when jsonb_typeof(new.codes) = 'array' then new.codes else '[]'::jsonb end) with ordinality as c(value, ordinality)
  ), '{}');
  return new;
end $$;
drop trigger if exists tournament_decks_legendaries on public.tournament_decks;
create trigger tournament_decks_legendaries before insert or update of codes on public.tournament_decks
  for each row execute function public.tournament_decks_legendaries();
update public.tournament_decks set codes = codes where legendaries = '{}' and jsonb_typeof(codes) = 'array' and jsonb_array_length(codes) > 0;

-- ---------- chi gestisce: organizzatore, arbitri, admin ----------
create or replace function public.is_tournament_staff(tid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and (
    public.is_admin()
    or exists (select 1 from public.tournaments t where t.id = tid and t.organizer = auth.uid())
    or exists (select 1 from public.tournament_judges j where j.tournament_id = tid and j.user_id = auth.uid())
  );
$$;

-- Chi chiama è uno dei due giocatori della partita o lo staff del torneo (chat, screenshot).
create or replace function public.is_match_party(mid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (
    select 1 from public.tournament_matches m
    where m.id = mid and (m.player_a = auth.uid() or m.player_b = auth.uid() or public.is_tournament_staff(m.tournament_id))
  );
$$;

-- Un torneo privato lo vedono anche i suoi arbitri.
create or replace function public.can_view_tournament(tid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.tournaments t
    where t.id = tid and (
      t.visibility = 'public'
      or (auth.uid() is not null and (
        t.organizer = auth.uid()
        or public.is_admin()
        or exists (select 1 from public.tournament_players p where p.tournament_id = t.id and p.user_id = auth.uid())
        or exists (select 1 from public.tournament_invites i where i.tournament_id = t.id and i.user_id = auth.uid())
        or exists (select 1 from public.tournament_judges j where j.tournament_id = t.id and j.user_id = auth.uid())
      ))
    )
  );
$$;

-- Vittorie che servono in una partita: la finale può avere una lunghezza sua (final_best_of).
create or replace function public.tm_need(tid uuid, rnd int)
returns int language sql stable set search_path = public, pg_temp as $$
  select (case
            when t.final_best_of is not null and rnd = (select max(m.round) from public.tournament_matches m where m.tournament_id = tid) then t.final_best_of
            else t.best_of
          end + 1) / 2
  from public.tournaments t where t.id = tid;
$$;
revoke all on function public.tm_need(uuid, int) from public, anon, authenticated;

-- Un giocatore è fra i quattro semifinalisti (o oltre): con le liste segrete, da lì le sue liste sono pubbliche.
create or replace function public.tm_in_top4(tid uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.tournament_matches m
    where m.tournament_id = tid and (m.player_a = uid or m.player_b = uid)
      and m.round >= (select max(r.round) from public.tournament_matches r where r.tournament_id = tid) - 1
  );
$$;

-- Chi chiama può leggere le liste complete di uid? Sue, staff, torneo finito; senza liste segrete gli avversari; con le
-- liste segrete, a torneo in corso, i semifinalisti per tutti.
create or replace function public.tm_can_see_deck(tid uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.tournaments t
    where t.id = tid and (
      uid = auth.uid()
      or public.is_tournament_staff(tid)
      or t.status = 'finished'
      or (not t.hidden_decklists and public.is_opponent_of(tid, uid))
      or (t.hidden_decklists and t.status = 'running' and public.tm_in_top4(tid, uid))
    )
  );
$$;

drop policy if exists "tournament decks visibility" on public.tournament_decks;
create policy "tournament decks visibility" on public.tournament_decks for select using (
  public.can_view_tournament(tournament_id) and public.tm_can_see_deck(tournament_id, user_id)
);

-- Le Leggendarie dei mazzi: a chi vede le liste e agli avversari (con le liste segrete è tutto quello che vedono).
create or replace function public.tournament_legendaries(tid uuid)
returns table (user_id uuid, legendaries text[]) language sql stable security definer set search_path = public, pg_temp as $$
  select d.user_id, d.legendaries from public.tournament_decks d
  where d.tournament_id = tid and public.can_view_tournament(tid)
    and (public.tm_can_see_deck(tid, d.user_id) or public.is_opponent_of(tid, d.user_id));
$$;
revoke all on function public.tournament_legendaries(uuid) from public;
grant execute on function public.tournament_legendaries(uuid) to anon, authenticated;

alter table public.tournament_judges enable row level security;
drop policy if exists "tournament judges are public" on public.tournament_judges;
create policy "tournament judges are public" on public.tournament_judges for select using (public.can_view_tournament(tournament_id));
grant select on public.tournament_judges to anon, authenticated;
-- si scrive solo con add_judge / remove_judge

-- ---------- avviso "la tua partita è pronta" ----------
alter table public.notifications drop constraint if exists notifications_kind_check;
-- `not valid`: vedi il blocco FUMETTI (anche l'ultimo elenco, che domani sarà quello vecchio di un blocco nuovo)
alter table public.notifications add constraint notifications_kind_check check (kind in ('deck_published', 'live', 'guide_published', 'comic_published', 'deck_set_published', 'match_ready')) not valid;
-- il registro degli invii ha lo stesso elenco (i test lo confrontano), anche se gli avvisi del tabellone non ci passano
alter table public.notification_events drop constraint if exists notification_events_kind_check;
alter table public.notification_events add constraint notification_events_kind_check check (kind in ('deck_published', 'live', 'guide_published', 'comic_published', 'deck_set_published', 'match_ready')) not valid;

-- Un avviso a ciascuno dei due giocatori (chi l'ha "causato" è l'avversario). Uno per partita e avversario: dopo uno
-- scambio arriva quello nuovo. Un errore qui non deve mai fermare il tabellone.
create or replace function public.tm_notify_ready(mid uuid)
returns void language plpgsql set search_path = public, pg_temp as $$
declare
  m public.tournament_matches%rowtype;
  s text;
begin
  select * into m from public.tournament_matches where id = mid;
  if not found or m.player_a is null or m.player_b is null or m.status <> 'pending' then return; end if;
  select t.slug into s from public.tournaments t where t.id = m.tournament_id;
  if s is null or s !~ '^[a-z0-9-]{1,90}$' then return; end if;
  insert into public.notifications (user_id, kind, actor_id, target, event_key) values
    (m.player_a, 'match_ready', m.player_b, '/tournaments/' || s || '/match/' || m.id, 'match:' || m.id || ':' || m.player_b),
    (m.player_b, 'match_ready', m.player_a, '/tournaments/' || s || '/match/' || m.id, 'match:' || m.id || ':' || m.player_a)
  on conflict (user_id, kind, event_key) do nothing;
exception when others then
  raise notice 'tm_notify_ready: %', sqlerrm;
end $$;
revoke all on function public.tm_notify_ready(uuid) from public, anon, authenticated;

-- ---------- tabellone: propagazione, partita pronta, ritiri ----------
-- Scrive il vincitore nello slot della partita successiva. Se lo slot cambia, la presenza di quel lato si azzera; quando
-- la partita ha i due giocatori diventa "pronta" (ready_at, avviso). Se uno dei due si è ritirato, la partita va
-- all'altro a tavolino e si propaga ancora (ritirati tutti e due: passa player_a, che perderà la prossima).
create or replace function public.tm_propagate(mid uuid)
returns void language plpgsql set search_path = public, pg_temp as $$
declare
  m public.tournament_matches%rowtype;
  nm public.tournament_matches%rowtype;
  drop_a boolean;
  drop_b boolean;
  w uuid;
  need int;
begin
  select * into m from public.tournament_matches where id = mid;
  if not found or m.winner is null then return; end if;
  select * into nm from public.tournament_matches where tournament_id = m.tournament_id and round = m.round + 1 and position = m.position / 2 for update;
  if not found then return; end if;
  if m.position % 2 = 0 then
    if nm.player_a is distinct from m.winner then
      update public.tournament_matches set player_a = m.winner, seen_a = null, ready_at = null where id = nm.id;
    end if;
  else
    if nm.player_b is distinct from m.winner then
      update public.tournament_matches set player_b = m.winner, seen_b = null, ready_at = null where id = nm.id;
    end if;
  end if;
  select * into nm from public.tournament_matches where id = nm.id;
  if nm.player_a is null or nm.player_b is null or nm.status <> 'pending' then return; end if;
  select coalesce(bool_or(p.user_id = nm.player_a and p.status = 'dropped'), false), coalesce(bool_or(p.user_id = nm.player_b and p.status = 'dropped'), false)
    into drop_a, drop_b
    from public.tournament_players p where p.tournament_id = nm.tournament_id and p.user_id in (nm.player_a, nm.player_b);
  if drop_a or drop_b then
    need := public.tm_need(nm.tournament_id, nm.round);
    w := case when drop_a and not drop_b then nm.player_b else nm.player_a end;
    update public.tournament_matches
       set winner = w, status = 'confirmed', forfeit = true, reported_by = null, note = 'drop',
           score_a = case when w = nm.player_a then need else 0 end, score_b = case when w = nm.player_b then need else 0 end
     where id = nm.id;
    perform public.tm_propagate(nm.id);
    return;
  end if;
  if nm.ready_at is null then
    update public.tournament_matches set ready_at = now() where id = nm.id;
    perform public.tm_notify_ready(nm.id);
  end if;
end $$;
revoke all on function public.tm_propagate(uuid) from public, anon, authenticated;

-- Dopo la creazione del tabellone: le partite del primo turno con due giocatori sono pronte da subito.
create or replace function public.tm_after_start(tid uuid)
returns void language plpgsql set search_path = public, pg_temp as $$
declare r record;
begin
  for r in
    update public.tournament_matches set ready_at = now()
     where tournament_id = tid and round = 1 and status = 'pending' and player_a is not null and player_b is not null and ready_at is null
    returning id
  loop
    perform public.tm_notify_ready(r.id);
  end loop;
end $$;
revoke all on function public.tm_after_start(uuid) from public, anon, authenticated;

-- Ritiro a torneo in corso (lui stesso o lo staff): perde la partita in corso; se l'avversario non è ancora noto la
-- perderà appena arriva (tm_propagate). Chiamare con la riga del torneo già bloccata.
create or replace function public.tm_drop(tid uuid, uid uuid)
returns void language plpgsql set search_path = public, pg_temp as $$
declare
  m public.tournament_matches%rowtype;
  need int;
begin
  update public.tournament_players set status = 'dropped' where tournament_id = tid and user_id = uid;
  select * into m from public.tournament_matches where tournament_id = tid and status in ('pending', 'reported', 'disputed') and (player_a = uid or player_b = uid) order by round limit 1 for update;
  if not found or m.player_a is null or m.player_b is null then return; end if;
  need := public.tm_need(tid, m.round);
  if m.player_a = uid then
    update public.tournament_matches set score_a = 0, score_b = need, winner = m.player_b, status = 'confirmed', forfeit = true, reported_by = null, note = 'drop' where id = m.id;
  else
    update public.tournament_matches set score_a = need, score_b = 0, winner = m.player_a, status = 'confirmed', forfeit = true, reported_by = null, note = 'drop' where id = m.id;
  end if;
  perform public.tm_propagate(m.id);
end $$;
revoke all on function public.tm_drop(uuid, uuid) from public, anon, authenticated;

-- Un posto libero prima della chiusura del check-in va al primo della lista d'attesa (ordine di iscrizione).
create or replace function public.tm_promote_waitlist(tid uuid)
returns void language plpgsql set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  n int;
begin
  select * into t from public.tournaments where id = tid;
  if not found or not t.checkin or t.status <> 'open' or now() > t.starts_at - interval '5 minutes' then return; end if;
  select count(*) into n from public.tournament_players where tournament_id = tid and status = 'registered';
  if n >= t.size then return; end if;
  update public.tournament_players set status = 'registered'
   where tournament_id = tid and user_id in (
     select w.user_id from public.tournament_players w where w.tournament_id = tid and w.status = 'waitlist' order by w.created_at, w.user_id limit t.size - n
   );
end $$;
revoke all on function public.tm_promote_waitlist(uuid) from public, anon, authenticated;

-- Avvio automatico (torneo pieno, mazzi di tutti): mai con il check-in, che parte all'ora d'inizio.
create or replace function public.tm_autostart(tid uuid)
returns void language plpgsql set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  total int;
  ready int;
  seeded uuid[];
begin
  select * into t from public.tournaments where id = tid;
  if not found or t.status <> 'open' or t.checkin then return; end if;
  select count(*), count(*) filter (where decks_submitted) into total, ready from public.tournament_players where tournament_id = tid and status = 'registered';
  if total < t.size or ready < total then return; end if;
  select array_agg(user_id order by random()) into seeded from public.tournament_players where tournament_id = tid and status = 'registered';
  perform public.tm_start(tid, seeded);
  perform public.tm_after_start(tid);
end $$;
revoke all on function public.tm_autostart(uuid) from public, anon, authenticated;

-- ---------- RPC: iscrizione, lista d'attesa, check-in, consegna dei mazzi ----------
create or replace function public.join_tournament(tid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  n int;
  w int;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.status <> 'open' then raise exception 'not_open'; end if;
  if t.visibility = 'private' and t.organizer <> auth.uid() and not public.is_admin()
     and not exists (select 1 from public.tournament_invites i where i.tournament_id = tid and i.user_id = auth.uid()) then
    raise exception 'invite_required';
  end if;
  if exists (select 1 from public.tournament_players where tournament_id = tid and user_id = auth.uid()) then raise exception 'already_joined'; end if;
  if exists (select 1 from public.tournament_judges where tournament_id = tid and user_id = auth.uid()) then raise exception 'judge_is_player'; end if;
  select count(*) filter (where status = 'registered'), count(*) filter (where status = 'waitlist') into n, w from public.tournament_players where tournament_id = tid;
  if n >= t.size then
    -- lista d'attesa solo con il check-in, al massimo quanto i posti
    if not t.checkin or w >= t.size then raise exception 'full'; end if;
    insert into public.tournament_players (tournament_id, user_id, status) values (tid, auth.uid(), 'waitlist');
    return;
  end if;
  insert into public.tournament_players (tournament_id, user_id) values (tid, auth.uid());
  perform public.tm_autostart(tid);
end $$;
revoke all on function public.join_tournament(uuid) from public, anon;
grant execute on function public.join_tournament(uuid) to authenticated;

-- Ritiro: a iscrizioni aperte toglie l'iscrizione (e i mazzi) e libera il posto per la lista d'attesa; a torneo in
-- corso è un ritiro vero (tm_drop).
create or replace function public.leave_tournament(tid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  p public.tournament_players%rowtype;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.status = 'running' then
    select * into p from public.tournament_players where tournament_id = tid and user_id = auth.uid();
    if not found or p.status <> 'registered' then raise exception 'not_registered'; end if;
    perform public.tm_drop(tid, auth.uid());
    return;
  end if;
  if t.status <> 'open' then raise exception 'not_open'; end if;
  delete from public.tournament_decks where tournament_id = tid and user_id = auth.uid();
  delete from public.tournament_players where tournament_id = tid and user_id = auth.uid();
  perform public.tm_promote_waitlist(tid);
end $$;
revoke all on function public.leave_tournament(uuid) from public, anon;
grant execute on function public.leave_tournament(uuid) to authenticated;

-- Con il check-in la consegna dei mazzi chiude insieme al check-in (5 minuti prima dell'inizio).
create or replace function public.submit_tournament_decks(tid uuid, codes jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  expected int;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.status <> 'open' then raise exception 'not_open'; end if;
  if not exists (select 1 from public.tournament_players where tournament_id = tid and user_id = auth.uid() and status in ('registered', 'waitlist')) then raise exception 'not_registered'; end if;
  if t.checkin and now() > t.starts_at - interval '5 minutes' then raise exception 'decks_closed'; end if;
  expected := case when t.deck_mode = 'conquest' then t.conquest_decks else 1 end;
  if jsonb_typeof(codes) <> 'array' or jsonb_array_length(codes) <> expected then raise exception 'decks_count'; end if;
  insert into public.tournament_decks (tournament_id, user_id, codes) values (tid, auth.uid(), codes)
    on conflict (tournament_id, user_id) do update set codes = excluded.codes;
  update public.tournament_players set decks_submitted = true where tournament_id = tid and user_id = auth.uid();
  perform public.tm_autostart(tid);
end $$;
revoke all on function public.submit_tournament_decks(uuid, jsonb) from public, anon;
grant execute on function public.submit_tournament_decks(uuid, jsonb) to authenticated;

-- Check-in del giocatore: dalle 2 ore prima; per gli iscritti fino a 5 minuti prima, per la lista d'attesa fino
-- all'avvio. Servono i mazzi consegnati.
create or replace function public.check_in(tid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  p public.tournament_players%rowtype;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.status <> 'open' then raise exception 'not_open'; end if;
  if not t.checkin then raise exception 'checkin_off'; end if;
  select * into p from public.tournament_players where tournament_id = tid and user_id = auth.uid();
  if not found or p.status not in ('registered', 'waitlist') then raise exception 'not_registered'; end if;
  if not p.decks_submitted then raise exception 'decks_missing'; end if;
  if now() < t.starts_at - interval '2 hours' then raise exception 'checkin_not_open'; end if;
  if p.status = 'registered' and now() > t.starts_at - interval '5 minutes' then raise exception 'checkin_closed'; end if;
  update public.tournament_players set checked_in_at = coalesce(checked_in_at, now()) where tournament_id = tid and user_id = auth.uid();
end $$;
revoke all on function public.check_in(uuid) from public, anon;
grant execute on function public.check_in(uuid) to authenticated;

-- Check-in fatto dallo staff (un giocatore con problemi di connessione, un ritardo concesso): a qualsiasi ora prima
-- dell'avvio, sempre con i mazzi consegnati. `undo` lo toglie.
create or replace function public.staff_check_in(tid uuid, uid uuid, undo boolean default false)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  p public.tournament_players%rowtype;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if not public.is_tournament_staff(tid) then raise exception 'forbidden'; end if;
  if t.status <> 'open' then raise exception 'not_open'; end if;
  if not t.checkin then raise exception 'checkin_off'; end if;
  select * into p from public.tournament_players where tournament_id = tid and user_id = uid;
  if not found or p.status not in ('registered', 'waitlist') then raise exception 'not_registered'; end if;
  if undo then
    update public.tournament_players set checked_in_at = null where tournament_id = tid and user_id = uid;
    return;
  end if;
  if not p.decks_submitted then raise exception 'decks_missing'; end if;
  update public.tournament_players set checked_in_at = coalesce(checked_in_at, now()) where tournament_id = tid and user_id = uid;
end $$;
revoke all on function public.staff_check_in(uuid, uuid, boolean) from public, anon;
grant execute on function public.staff_check_in(uuid, uuid, boolean) to authenticated;

-- ---------- RPC dello staff (organizzatore, arbitri, admin) ----------
-- Avvio. Con il check-in l'ordine lo decide il database: entrano gli iscritti con il check-in, poi chi è in lista
-- d'attesa e l'ha fatto, in ordine di arrivo, fino ai posti; ordine casuale; `seeded` è ignorato. Si può avviare solo
-- dopo la chiusura del check-in.
create or replace function public.start_tournament(tid uuid, seeded uuid[])
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  picked uuid[];
  free int;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if not public.is_tournament_staff(tid) then raise exception 'forbidden'; end if;
  if t.status <> 'open' then raise exception 'not_open'; end if;
  if t.checkin then
    if now() < t.starts_at - interval '5 minutes' then raise exception 'checkin_still_open'; end if;
    select coalesce(array_agg(user_id), '{}') into picked from public.tournament_players
     where tournament_id = tid and status = 'registered' and checked_in_at is not null and decks_submitted;
    free := t.size - coalesce(array_length(picked, 1), 0);
    if free > 0 then
      picked := picked || coalesce((
        select array_agg(w.user_id order by w.checked_in_at, w.created_at) from (
          select user_id, checked_in_at, created_at from public.tournament_players
           where tournament_id = tid and status = 'waitlist' and checked_in_at is not null and decks_submitted
           order by checked_in_at, created_at limit free
        ) w
      ), '{}');
    end if;
    update public.tournament_players set status = 'registered' where tournament_id = tid and status = 'waitlist' and user_id = any(picked);
    select array_agg(x order by random()) into picked from unnest(picked) x;
    perform public.tm_start(tid, coalesce(picked, '{}'));
  else
    perform public.tm_start(tid, seeded);
  end if;
  perform public.tm_after_start(tid);
end $$;
revoke all on function public.start_tournament(uuid, uuid[]) from public, anon;
grant execute on function public.start_tournament(uuid, uuid[]) to authenticated;

-- Scambio di due giocatori fra partite ancora da giocare dello stesso turno: le due partite ripartono (presenza
-- azzerata, nuova ora "pronta", nuovo avviso).
create or replace function public.swap_players(tid uuid, u1 uuid, u2 uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  m1 public.tournament_matches%rowtype;
  m2 public.tournament_matches%rowtype;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if not public.is_tournament_staff(tid) then raise exception 'forbidden'; end if;
  if t.status <> 'running' then raise exception 'not_running'; end if;
  if u1 = u2 then raise exception 'bad_swap'; end if;
  select * into m1 from public.tournament_matches where tournament_id = tid and status = 'pending' and (player_a = u1 or player_b = u1) order by round limit 1 for update;
  if not found then raise exception 'not_pending'; end if;
  select * into m2 from public.tournament_matches where tournament_id = tid and status = 'pending' and (player_a = u2 or player_b = u2) order by round limit 1 for update;
  if not found then raise exception 'not_pending'; end if;
  if m1.round <> m2.round then raise exception 'bad_swap'; end if;
  if m1.id = m2.id then
    update public.tournament_matches set player_a = player_b, player_b = player_a, seen_a = seen_b, seen_b = seen_a where id = m1.id;
    return;
  end if;
  if m1.player_a = u1 then update public.tournament_matches set player_a = u2 where id = m1.id; else update public.tournament_matches set player_b = u2 where id = m1.id; end if;
  if m2.player_a = u2 then update public.tournament_matches set player_a = u1 where id = m2.id; else update public.tournament_matches set player_b = u1 where id = m2.id; end if;
  update public.tournament_matches
     set seen_a = null, seen_b = null, ready_at = case when player_a is not null and player_b is not null then now() else null end
   where id in (m1.id, m2.id);
  perform public.tm_notify_ready(m1.id);
  perform public.tm_notify_ready(m2.id);
end $$;
revoke all on function public.swap_players(uuid, uuid, uuid) from public, anon;
grant execute on function public.swap_players(uuid, uuid, uuid) to authenticated;

-- Referto di un giocatore (conta anche come presenza). Su una partita contestata si può refertare di nuovo: il nuovo
-- referto riparte da capo (reported) e l'avversario conferma o contesta.
create or replace function public.report_match_result(mid uuid, a int, b int)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  m public.tournament_matches%rowtype;
  t public.tournaments%rowtype;
  need int;
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not_logged_in'; end if;
  select * into m from public.tournament_matches where id = mid;
  if not found then raise exception 'not_found'; end if;
  select * into t from public.tournaments where id = m.tournament_id for update;
  select * into m from public.tournament_matches where id = mid for update;
  if t.status <> 'running' then raise exception 'not_running'; end if;
  if me <> m.player_a and me <> m.player_b then raise exception 'forbidden'; end if;
  if m.player_a is null or m.player_b is null then raise exception 'not_ready'; end if;
  if m.status not in ('pending', 'reported', 'disputed') then raise exception 'already_confirmed'; end if;
  need := public.tm_need(t.id, m.round);
  if a is null or b is null or a < 0 or b < 0 or greatest(a, b) <> need or least(a, b) >= need then raise exception 'bad_score'; end if;
  update public.tournament_matches
     set seen_a = case when me = player_a then coalesce(seen_a, now()) else seen_a end,
         seen_b = case when me = player_b then coalesce(seen_b, now()) else seen_b end
   where id = mid;
  if m.status in ('pending', 'disputed') then
    update public.tournament_matches set score_a = a, score_b = b, status = 'reported', reported_by = me, reported_at = now(), note = null where id = mid;
  elsif m.reported_by = me then
    update public.tournament_matches set score_a = a, score_b = b, reported_at = now() where id = mid;
  elsif m.score_a = a and m.score_b = b then
    update public.tournament_matches set status = 'confirmed', winner = case when a > b then m.player_a else m.player_b end where id = mid;
    perform public.tm_propagate(mid);
  else
    update public.tournament_matches set status = 'disputed', note = format('%s-%s vs %s-%s', m.score_a, m.score_b, a, b) where id = mid;
  end if;
end $$;
revoke all on function public.report_match_result(uuid, int, int) from public, anon;
grant execute on function public.report_match_result(uuid, int, int) to authenticated;

-- Risultato imposto dallo staff (anche forfait / assenza). Ripropaga solo se la partita successiva è ancora da giocare.
create or replace function public.set_match_result(mid uuid, a int, b int, forfeit boolean default false)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  m public.tournament_matches%rowtype;
  nm public.tournament_matches%rowtype;
  t public.tournaments%rowtype;
  need int;
  w uuid;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into m from public.tournament_matches where id = mid;
  if not found then raise exception 'not_found'; end if;
  select * into t from public.tournaments where id = m.tournament_id for update;
  select * into m from public.tournament_matches where id = mid for update;
  if not public.is_tournament_staff(t.id) then raise exception 'forbidden'; end if;
  if t.status <> 'running' then raise exception 'not_running'; end if;
  if m.player_a is null or m.player_b is null then raise exception 'not_ready'; end if;
  need := public.tm_need(t.id, m.round);
  if a is null or b is null or a < 0 or b < 0 or greatest(a, b) <> need or least(a, b) >= need then raise exception 'bad_score'; end if;
  if forfeit and least(a, b) <> 0 then raise exception 'bad_score'; end if;
  w := case when a > b then m.player_a else m.player_b end;
  select * into nm from public.tournament_matches where tournament_id = m.tournament_id and round = m.round + 1 and position = m.position / 2;
  if found and nm.status <> 'pending' then raise exception 'next_match_started'; end if;
  if found and m.winner is not null and m.winner <> w then
    -- lo slot deve contenere ancora il vecchio vincitore, altrimenti qualcuno l'ha già spostato
    if (m.position % 2 = 0 and nm.player_a is distinct from m.winner) or (m.position % 2 = 1 and nm.player_b is distinct from m.winner) then raise exception 'next_match_started'; end if;
  end if;
  update public.tournament_matches set score_a = a, score_b = b, winner = w, status = 'confirmed', forfeit = set_match_result.forfeit, reported_by = null where id = mid;
  perform public.tm_propagate(mid);
end $$;
revoke all on function public.set_match_result(uuid, int, int, boolean) from public, anon;
grant execute on function public.set_match_result(uuid, int, int, boolean) to authenticated;

-- Ritiro deciso dallo staff: prima dell'avvio toglie l'iscrizione (e il posto va alla lista d'attesa), dopo è tm_drop.
create or replace function public.drop_player(tid uuid, uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.tournaments%rowtype;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if not public.is_tournament_staff(tid) then raise exception 'forbidden'; end if;
  if t.status = 'open' then
    delete from public.tournament_decks where tournament_id = tid and user_id = uid;
    delete from public.tournament_players where tournament_id = tid and user_id = uid;
    perform public.tm_promote_waitlist(tid);
    return;
  end if;
  if t.status <> 'running' then raise exception 'not_running'; end if;
  if not exists (select 1 from public.tournament_players where tournament_id = tid and user_id = uid and status = 'registered') then raise exception 'not_registered'; end if;
  perform public.tm_drop(tid, uid);
end $$;
revoke all on function public.drop_player(uuid, uuid) from public, anon;
grant execute on function public.drop_player(uuid, uuid) to authenticated;

create or replace function public.finish_tournament(tid uuid, report text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  last_round int;
  f public.tournament_matches%rowtype;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if not public.is_tournament_staff(tid) then raise exception 'forbidden'; end if;
  if t.status <> 'running' then raise exception 'not_running'; end if;
  select max(round) into last_round from public.tournament_matches where tournament_id = tid;
  select * into f from public.tournament_matches where tournament_id = tid and round = last_round and position = 0;
  if not found or f.winner is null or f.status not in ('confirmed', 'bye') then raise exception 'final_not_played'; end if;
  update public.tournaments set status = 'finished', report = left(coalesce(finish_tournament.report, ''), 2000) where id = tid;
end $$;
revoke all on function public.finish_tournament(uuid, text) from public, anon;
grant execute on function public.finish_tournament(uuid, text) to authenticated;

-- ---------- presenza e assenza ----------
-- Chi gioca apre la stanza partita: da quel momento è "presente" (una volta sola). Solo su una partita pronta.
create or replace function public.mark_match_seen(mid uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  m public.tournament_matches%rowtype;
  me uuid := auth.uid();
begin
  if me is null then return false; end if;
  select * into m from public.tournament_matches where id = mid;
  if not found or m.player_a is null or m.player_b is null or m.status not in ('pending', 'reported', 'disputed') then return false; end if;
  if not exists (select 1 from public.tournaments t where t.id = m.tournament_id and t.status = 'running') then return false; end if;
  if me = m.player_a and m.seen_a is null then
    update public.tournament_matches set seen_a = now() where id = mid and seen_a is null;
    return true;
  elsif me = m.player_b and m.seen_b is null then
    update public.tournament_matches set seen_b = now() where id = mid and seen_b is null;
    return true;
  end if;
  return false;
end $$;
revoke all on function public.mark_match_seen(uuid) from public, anon;
grant execute on function public.mark_match_seen(uuid) to authenticated;

-- Vittoria a tavolino: passati no_show_minutes da quando la partita è pronta, se l'avversario non ha mai aperto la stanza
-- né scritto in chat né refertato, chi c'è la chiede e la partita si chiude subito (lo staff può correggerla finché la
-- successiva non è partita).
create or replace function public.claim_no_show(mid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  m public.tournament_matches%rowtype;
  t public.tournaments%rowtype;
  me uuid := auth.uid();
  opp uuid;
  need int;
begin
  if me is null then raise exception 'not_logged_in'; end if;
  select * into m from public.tournament_matches where id = mid;
  if not found then raise exception 'not_found'; end if;
  select * into t from public.tournaments where id = m.tournament_id for update;
  select * into m from public.tournament_matches where id = mid for update;
  if t.status <> 'running' then raise exception 'not_running'; end if;
  if me <> m.player_a and me <> m.player_b then raise exception 'forbidden'; end if;
  if m.player_a is null or m.player_b is null then raise exception 'not_ready'; end if;
  if t.no_show_minutes is null then raise exception 'no_show_off'; end if;
  if m.status not in ('pending', 'reported') then raise exception 'already_confirmed'; end if;
  if m.status = 'reported' and m.reported_by <> me then raise exception 'opponent_present'; end if;
  if m.ready_at is null or now() < m.ready_at + make_interval(mins => t.no_show_minutes) then raise exception 'no_show_too_early'; end if;
  opp := case when me = m.player_a then m.player_b else m.player_a end;
  if (me = m.player_a and m.seen_b is not null) or (me = m.player_b and m.seen_a is not null) then raise exception 'opponent_present'; end if;
  if exists (select 1 from public.tournament_messages x where x.match_id = mid and x.user_id = opp) then raise exception 'opponent_present'; end if;
  need := public.tm_need(t.id, m.round);
  update public.tournament_matches
     set winner = me, status = 'confirmed', forfeit = true, reported_by = null, note = 'no_show',
         score_a = case when me = m.player_a then need else 0 end, score_b = case when me = m.player_b then need else 0 end,
         seen_a = case when me = m.player_a then coalesce(seen_a, now()) else seen_a end,
         seen_b = case when me = m.player_b then coalesce(seen_b, now()) else seen_b end
   where id = mid;
  perform public.tm_propagate(mid);
end $$;
revoke all on function public.claim_no_show(uuid) from public, anon;
grant execute on function public.claim_no_show(uuid) to authenticated;

-- ---------- arbitri (solo organizzatore e admin) ----------
create or replace function public.add_judge(tid uuid, uname text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.tournaments%rowtype;
  target uuid;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid for update;
  if not found then raise exception 'not_found'; end if;
  if t.organizer <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;
  if t.status not in ('open', 'running') then raise exception 'not_open'; end if;
  select id into target from public.profiles where lower(username) = lower(btrim(replace(uname, '@', ''))) limit 1;
  if target is null then raise exception 'user_not_found'; end if;
  if target = t.organizer then raise exception 'already_staff'; end if;
  if exists (select 1 from public.tournament_players p where p.tournament_id = tid and p.user_id = target and p.status in ('registered', 'waitlist')) then raise exception 'judge_is_player'; end if;
  if (select count(*) from public.tournament_judges j where j.tournament_id = tid) >= 10 then raise exception 'too_many_judges'; end if;
  insert into public.tournament_judges (tournament_id, user_id, added_by) values (tid, target, auth.uid()) on conflict (tournament_id, user_id) do nothing;
end $$;
revoke all on function public.add_judge(uuid, text) from public, anon;
grant execute on function public.add_judge(uuid, text) to authenticated;

create or replace function public.remove_judge(tid uuid, uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.tournaments%rowtype;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  select * into t from public.tournaments where id = tid;
  if not found then raise exception 'not_found'; end if;
  if t.organizer <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;
  delete from public.tournament_judges where tournament_id = tid and user_id = uid;
end $$;
revoke all on function public.remove_judge(uuid, uuid) from public, anon;
grant execute on function public.remove_judge(uuid, uuid) to authenticated;

comment on table public.tournament_judges is 'Arbitri di un torneo (05/10/2026): gestiscono partite, ritiri, check-in e avvio; li nominano solo organizzatore e admin (add_judge, remove_judge).';

-- =====================================================================================================
-- ===== 06/10/2026: VOTI ALLE CARTE =====
-- Richiesta di Pierluigi del 06/10/2026: "la possibilità per gli utenti di votare le carte da 1 (scarsa) a 10 (ottima)
-- e sulla base delle votazioni si generasse una tierlist". Un voto per iscritto e per carta, che si può cambiare quando
-- si vuole (l'upsert di voteCard, src/lib/community/cardVoteActions.ts). `card` è lo slug della scheda carta: la Server
-- Action accetta solo le carte attive della Demo 2.0 non create (le stesse del tool /tier-list/create); qui si
-- controllano la forma dello slug, il punteggio (1–10) e un tetto di righe per iscritto (guard_card_vote: 300, le
-- carte votabili sono 122, oltre sono righe sporche; lo stesso numero sta in CARD_VOTES_PER_USER_MAX di
-- src/lib/cardVotes.ts, che il test confronta).
-- Chi ha votato che cosa NON è pubblico: ognuno legge solo i propri voti (RLS, select per authenticated), anon non
-- legge la tabella. Il sito legge gli aggregati dalle due funzioni security definer: card_ratings (media, voti e
-- distribuzione punteggio → quanti, per ogni carta o per una sola) e card_vote_totals (voti, votanti, carte votate e
-- data dell'ultimo voto: riga di stato della pagina e lastmod della sitemap). La fascia S–D la calcola il sito dalla
-- media (src/lib/cardVotes.ts: fascia da CARD_RANKED_MIN_VOTES voti, pagina "anteprima" sotto CARD_VOTES_MIN_VOTERS
-- votanti), così le soglie si cambiano senza migrazione. Il sito regge senza questo blocco: la pagina
-- /tier-list/votes dice che i voti non sono ancora attivi e il widget lo stesso. Tutto idempotente, come il resto.
-- Date di creazione scritte solo dal database (guard_created_at, blocco DATE E FOTO), updated_at dal trigger touch.
-- =====================================================================================================

create table if not exists public.card_votes (
  card text not null check (card ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(card) <= 80),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score smallint not null check (score between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (card, user_id)
);
create index if not exists card_votes_user_idx on public.card_votes (user_id);
create index if not exists card_votes_updated_idx on public.card_votes (updated_at desc);
drop trigger if exists card_votes_touch on public.card_votes;
create trigger card_votes_touch before update on public.card_votes
  for each row execute function public.touch_updated_at();
drop trigger if exists card_votes_guard_created on public.card_votes;
create trigger card_votes_guard_created before insert or update on public.card_votes
  for each row execute function public.guard_created_at();

-- tetto di righe per iscritto (security definer: conta anche sotto RLS); il lock evita due inserimenti in parallelo
create or replace function public.guard_card_vote()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('card_votes:' || new.user_id::text, 0));
  if (select count(*) from public.card_votes v where v.user_id = new.user_id) >= 300 then
    raise exception 'card_vote_limit' using errcode = '23514';
  end if;
  return new;
end $$;
revoke all on function public.guard_card_vote() from public, anon, authenticated;
drop trigger if exists card_votes_guard on public.card_votes;
create trigger card_votes_guard before insert on public.card_votes
  for each row execute function public.guard_card_vote();

alter table public.card_votes enable row level security;
drop policy if exists "card votes: own rows" on public.card_votes;
create policy "card votes: own rows" on public.card_votes for select to authenticated using (user_id = auth.uid());
drop policy if exists "card votes: users vote once" on public.card_votes;
create policy "card votes: users vote once" on public.card_votes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "card votes: users change own" on public.card_votes;
create policy "card votes: users change own" on public.card_votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "card votes: users remove own" on public.card_votes;
create policy "card votes: users remove own" on public.card_votes for delete to authenticated using (user_id = auth.uid());
revoke all on public.card_votes from anon, authenticated;
grant select, insert, update, delete on public.card_votes to authenticated;

-- media, numero di voti e distribuzione (punteggio → quanti) di ogni carta votata, o di una sola (p_card)
create or replace function public.card_ratings(p_card text default null)
returns table (card text, avg_score numeric, votes integer, dist jsonb)
language sql stable security definer set search_path = public, pg_temp as $$
  with per as (
    select v.card as c, v.score as s, count(*)::int as n
      from public.card_votes v
     where p_card is null or v.card = p_card
     group by v.card, v.score
  )
  select per.c,
         round(sum(per.s * per.n)::numeric / sum(per.n), 2),
         sum(per.n)::int,
         jsonb_object_agg(per.s::text, per.n)
    from per
   group by per.c;
$$;
revoke all on function public.card_ratings(text) from public;
grant execute on function public.card_ratings(text) to anon, authenticated;

-- quanti voti, quanti votanti e quante carte votate, e l'ora dell'ultimo voto (riga di stato, sitemap)
create or replace function public.card_vote_totals()
returns table (votes bigint, voters bigint, cards bigint, latest timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select count(*), count(distinct cv.user_id), count(distinct cv.card), max(cv.updated_at) from public.card_votes cv;
$$;
revoke all on function public.card_vote_totals() from public;
grant execute on function public.card_vote_totals() to anon, authenticated;

comment on table public.card_votes is 'Voti alle carte da 1 a 10 (06/10/2026): uno per iscritto e per carta; ognuno legge solo i suoi, gli aggregati escono da card_ratings e card_vote_totals.';
comment on function public.card_ratings(text) is 'Media, voti e distribuzione dei voti di ogni carta (o di una sola): è la base della tier list dei voti, /tier-list/votes (06/10/2026).';
comment on function public.card_vote_totals() is 'Voti, votanti, carte votate e ultimo voto, senza nomi (06/10/2026).';

-- =====================================================================================================
-- ===== 07/10/2026: FRANCESE =====
-- =====================================================================================================
-- Il francese è la quarta lingua del sito (richiesta di Pierluigi del 07/10/2026, "mettere il sito in francese come per lo
-- spagnolo"). Le lingue ammesse stanno scritte nei vincoli e nelle funzioni qui sopra, che ora dicono ('en','it','es','fr'):
-- le funzioni sono "create or replace" e si aggiornano da sole a ogni db-migrate; i vincoli con nome sono già in forma
-- "drop if exists + add" (tornei, guide, fumetti, lingue dei contenuti del profilo). Resta solo il check di colonna di
-- analytics_interest, scritto nella create table (vale per un database nuovo): su quello esistente si sostituisce qui,
-- con il nome che Postgres dà ai check di colonna. Il sito regge anche prima di questa migrazione: una traduzione francese
-- che il database rifiuta (trigger delle guide e dei fumetti) si riprova senza il francese, così le altre lingue non si
-- perdono, e la pagina francese mostra l'originale con la sua nota; scripts/translate-*.mjs recuperano gli arretrati dopo.
alter table public.analytics_interest drop constraint if exists analytics_interest_locale_check;
alter table public.analytics_interest add constraint analytics_interest_locale_check check (locale in ('en', 'it', 'es', 'fr'));
