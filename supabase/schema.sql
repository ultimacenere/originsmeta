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

-- 15/09/2026 (note per sito 5.0): tipo di mazzo dichiarato da chi pubblica e tag autore assegnato dallo staff
alter table public.community_decks add column if not exists deck_type text not null default 'ladder';
alter table public.community_decks drop constraint if exists community_decks_deck_type_check;
alter table public.community_decks add constraint community_decks_deck_type_check check (deck_type in ('ladder','competitive','fun','tournament'));
alter table public.profiles add column if not exists badge text not null default 'community';
alter table public.profiles drop constraint if exists profiles_badge_check;
alter table public.profiles add constraint profiles_badge_check check (badge in ('community','creator','influencer','pro','staff'));

create or replace function public.protect_profile_badge()
returns trigger language plpgsql as $$
begin
  -- il tag autore lo cambia solo un admin dal sito o uno script con connessione diretta (auth.uid() nullo)
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

-- Sul calendario del sito finiscono solo i tornei di Influencer, Pro e Staff (o di un admin).
create or replace function public.protect_tournament_listing()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.listed and not exists (
    select 1 from public.profiles p where p.id = new.organizer and (p.badge in ('creator','influencer','pro','staff') or p.role = 'admin')
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
    and exists (select 1 from public.profiles p where p.id = auth.uid() and (p.badge in ('creator','influencer','pro','staff') or p.role = 'admin'))
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
    select 1 from public.profiles p where p.id = new.organizer and (p.badge in ('creator','influencer','pro','staff') or p.role = 'admin')
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
--   2) i mazzi pubblicati hanno un tetto: 5 per un utente normale, nessun tetto per Influencer, Pro, Staff
--      e admin. I mazzi privati ('draft') hanno già il loro tetto nel codice (MAX_PRIVATE_DECKS).
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
-- "mazzi 5 massimo per utente normale, per staff, influencer e pro senza limiti"; dal 25/09/2026 anche creator. Il conto tiene insieme
-- pubblicati e nascosti (un mazzo nascosto è comunque un mazzo pubblicato dall'utente, che può rimettere online
-- quando vuole); i mazzi privati 'draft' non c'entrano e hanno il loro tetto nel sito.
-- Sta in un trigger e non solo nella Server Action perché il limite è una regola dei dati, non dell'interfaccia.
create or replace function public.max_published_decks(uid uuid)
returns int language sql stable security definer set search_path = public, pg_temp as $$
  select case when p.role = 'admin' or p.badge in ('creator','influencer','pro','staff') then 2147483647 else 5 end
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
-- Ogni iscritto può scrivere nella sua pagina pubblica /u/<nome> una bio (testo semplice, 280 caratteri), fino a
-- otto canali (Twitch, YouTube, X, TikTok, Instagram, Kick, Bluesky, Discord, sito web) e le lingue in cui fa
-- contenuti. Per chi ha un tag autore (creator = "Autore", influencer, pro, staff) gli stessi dati fanno la scheda
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

-- Vincoli: bio in testo semplice (a capo ammessi, nessun altro carattere di controllo), 1–280 caratteri o null;
-- canali validi; lingue dei contenuti fra quelle del sito, senza null.
alter table public.profiles drop constraint if exists profiles_bio_check;
alter table public.profiles add constraint profiles_bio_check
  check (bio is null or (char_length(bio) between 1 and 280 and replace(bio, chr(10), '') !~ '[[:cntrl:]]'));
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

-- Directory /creators e rotta /api/live: leggono solo i profili con un tag autore.
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

-- Chi chiama può leggere i numeri di tutti i mazzi: admin (profiles.role) o tag autore Staff (profiles.badge).
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
--   - staff = profilo con role 'admin' o tag autore 'staff' (`is_staff()`); la casella dello staff è condivisa:
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
-- Admin (profiles.role) o tag autore 'staff' (profiles.badge): due colonne che l'utente non può cambiare
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
-- ridà la sola lettura a chi ha fatto l'accesso (le righe le filtra la policy di select).
revoke all on public.conversations, public.messages from anon, authenticated;
grant select on public.conversations, public.messages to authenticated;

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
