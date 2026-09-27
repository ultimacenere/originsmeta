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
  lang text not null default 'en' check (lang in ('en','it','es')),
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
alter table public.tournaments add constraint tournaments_lang_check check (lang in ('en','it','es'));

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
  check (content_langs <@ array['en','it','es']::text[] and cardinality(content_langs) <= 3 and array_position(content_langs, null) is null);

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
alter table public.community_guides add constraint community_guides_lang_check check (lang in ('en','it','es'));
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
          if k not in ('en', 'it', 'es') or k = new.lang
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
