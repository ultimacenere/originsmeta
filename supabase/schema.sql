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
  insert into public.profiles (id, username, display_name, avatar_url, discord_id)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'user_name', candidate),
    new.raw_user_meta_data->>'avatar_url',
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
create policy "users change own vote" on public.deck_votes for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
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
grant update on public.profiles to authenticated;

-- 15/09/2026 (note per sito 5.0): tipo di mazzo dichiarato da chi pubblica e tag autore assegnato dallo staff
alter table public.community_decks add column if not exists deck_type text not null default 'ladder';
alter table public.community_decks drop constraint if exists community_decks_deck_type_check;
alter table public.community_decks add constraint community_decks_deck_type_check check (deck_type in ('ladder','competitive','fun','tournament'));
alter table public.profiles add column if not exists badge text not null default 'community';
alter table public.profiles drop constraint if exists profiles_badge_check;
alter table public.profiles add constraint profiles_badge_check check (badge in ('community','influencer','pro','staff'));

create or replace function public.protect_profile_badge()
returns trigger language plpgsql as $$
begin
  -- il tag autore lo cambia solo un admin dal sito o uno script con connessione diretta (auth.uid() nullo)
  if new.badge is distinct from old.badge and auth.uid() is not null and not public.is_admin() then
    raise exception 'badge is assigned by staff';
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
  lang text not null default 'en' check (lang in ('en','it')),
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

-- Sul calendario del sito finiscono solo i tornei di Influencer, Pro e Staff (o di un admin).
create or replace function public.protect_tournament_listing()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.listed and not exists (
    select 1 from public.profiles p where p.id = new.organizer and (p.badge in ('influencer','pro','staff') or p.role = 'admin')
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

-- ---------- Storage: copertine dei tornei (upload dal browser, solo Influencer/Pro/Staff o admin, nella propria cartella) ----------
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
    and exists (select 1 from public.profiles p where p.id = auth.uid() and (p.badge in ('influencer','pro','staff') or p.role = 'admin'))
  );
  drop policy if exists "users manage own tournament covers" on storage.objects;
  create policy "users manage own tournament covers" on storage.objects for delete to authenticated using (
    bucket_id = 'tournament-covers' and (storage.foldername(name))[1] = auth.uid()::text
  );
exception when others then
  raise notice 'Storage tournament-covers non configurato da SQL (%): creare bucket e policy dalla dashboard, vedi README.', sqlerrm;
end $$;
