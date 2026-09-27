-- ===== 27/09/2026: GUIDE =====
-- =====================================================================================================
-- GUIDE DELLA COMMUNITY PUBBLICATE DIRETTAMENTE DAI RUOLI (pacchetto GUIDE, 27/09/2026)
-- Richiesta di Pierluigi ("OK A TUTTO, OTTIMO!!" alle proposte per i profili del 27/09/2026): chi ha il ruolo Autore,
-- Creator, Pro o Staff (o è admin) pubblica le sue guide sul sito senza passare dallo staff; gli altri continuano con
-- il modulo "Mandaci la tua guida" (/guides/submit). Codice: src/lib/community/guides.ts (regole pure, con test in
-- guides.test.ts che confrontano limiti, categorie, copertine e ruoli con questo file), guideQueries.ts (letture),
-- guideActions.ts (Server Action), guideTranslate.ts (traduzione automatica), pagine /guides/new,
-- /guides/community/[slug] e /guides/community/[slug]/edit.
--
-- File da accodare IN FONDO a supabase/schema.sql (lo fa l'integratore): usa funzioni definite prima là dentro
-- (is_staff del blocco INBOX, deck_videos_ok e deck_links_ok del blocco VIDEO, touch non serve: il trigger qui sotto
-- scrive da solo le date). NON tocca public.profiles: nessuna grant, nessuna revoke (schema-guard.mjs resta com'è).
-- Idempotente: create ... if not exists, create or replace, drop policy if exists, drop constraint if exists.
--
-- Sicurezza, in breve:
--   - il permesso di scrivere sta in UNA funzione, can_publish_guides(uid), uguale a canPublishGuides di
--     src/lib/community/badges.ts (Autore, Creator, Pro, Staff e admin; guides.test.ts li confronta);
--   - RLS: le guide pubblicate le legge chiunque; bozze e nascoste solo il proprietario e lo staff (is_staff());
--     insert e update solo con can_publish_guides(auth.uid()), sulla propria riga (lo staff anche sulle altre, per
--     nasconderle); delete del proprietario e dello staff;
--   - grant minime e PER COLONNA per insert e update: slug, owner, date e published_at non si cambiano mai via API;
--   - il trigger guard_community_guide scrive le date, tiene i tetti (100 guide per account, 10 nuove al giorno,
--     3 prime pubblicazioni al giorno, con un lock per utente) e riserva lo stato 'hidden' allo staff: una guida
--     nascosta dallo staff il proprietario non la rimette online (la può solo eliminare);
--   - testo semplice: niente caratteri di controllo (a capo ammessi solo in riassunto e corpo delle sezioni), niente
--     invisibili né segni di direzione del testo, al massimo una riga vuota di fila; il sito lo mostra come testo;
--   - copertina caricata (cover_path) solo nella cartella del proprietario e solo per i ruoli con vetrina; il bucket
--     lo porta il pacchetto VETRINA (finché non c'è, il sito usa solo le copertine preimpostate, cover_preset).
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
-- La usano le policy di insert e update (solo authenticated) e il sito per decidere il riquadro di /guides.
revoke all on function public.can_publish_guides(uuid) from public, anon;
grant execute on function public.can_publish_guides(uuid) to authenticated, service_role;

-- ---------- testo semplice ----------
-- Da `minlen` a `maxlen` caratteri (punti di codice, come `char_length`), almeno un carattere che non sia uno spazio,
-- niente caratteri di controllo (con `multiline` l'a capo è ammesso), niente trattino morbido, segni di direzione del
-- testo né invisibili (la stessa lista di deck_text_ok), al massimo una riga vuota di fila, niente spazi in testa o in
-- coda. Gli stessi controlli di `plainTextOk` in src/lib/community/guides.ts (il sito pulisce prima di scrivere).
create or replace function public.community_guide_text_ok(t text, minlen integer, maxlen integer, multiline boolean)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select t is not null
     and char_length(t) between minlen and maxlen
     and (char_length(t) = 0 or (t ~ '[^[:space:]]' and t = btrim(t, E' \n')))
     and (case when multiline then replace(t, chr(10), '') else t end) !~ '[[:cntrl:]]'
     and translate(t, U&'\00AD\061C\200B\200E\200F\202A\202B\202C\202D\202E\2066\2067\2068\2069\FEFF', '') = t
     and strpos(replace(t, ' ', ''), repeat(chr(10), 3)) = 0;
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

-- Le carte citate: slug del database carte del sito (il sito controlla che esistano), al massimo 24, senza doppioni.
create or replace function public.community_guide_cards_ok(c text[])
returns boolean language sql immutable set search_path = pg_catalog as $$
  select c is not null
     and cardinality(c) <= 24
     and not exists (select 1 from unnest(c) as u(x) where x is null or x !~ '^[a-z0-9]([a-z0-9-]{0,78}[a-z0-9])?$')
     and cardinality(c) = (select count(distinct x) from unnest(c) as u(x));
$$;

-- Funzioni pure dentro i vincoli: girano con i privilegi di chi scrive la riga (authenticated), niente anon.
revoke all on function public.community_guide_text_ok(text, integer, integer, boolean) from public, anon;
revoke all on function public.community_guide_sections_ok(jsonb, boolean) from public, anon;
revoke all on function public.community_guide_cards_ok(text[]) from public, anon;
grant execute on function public.community_guide_text_ok(text, integer, integer, boolean) to authenticated, service_role;
grant execute on function public.community_guide_sections_ok(jsonb, boolean) to authenticated, service_role;
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
  -- copertina: un disegno del sito (gradiente della palette, mai materiale Koin) o un'immagine caricata dal proprietario
  cover_preset text not null default 'mint',
  cover_path text,
  status text not null default 'draft',
  -- traduzioni automatiche: {"it": {"hash": "…", "at": "…", "model": "…", "guide": {"summary": "…", "sections": [...]}}}
  translations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- prima pubblicazione: la scrive solo il trigger; serve alla data dell'articolo e al tetto giornaliero
  published_at timestamptz
);
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
alter table public.community_guides drop constraint if exists community_guides_cover_preset_check;
alter table public.community_guides add constraint community_guides_cover_preset_check
  check (cover_preset in ('mint','sky','gold','crimson','aurora','night'));
alter table public.community_guides drop constraint if exists community_guides_cover_path_check;
alter table public.community_guides add constraint community_guides_cover_path_check
  check (cover_path is null or (char_length(cover_path) <= 200
    and cover_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/([A-Za-z0-9_-]{1,60}/)?[A-Za-z0-9_-]{1,80}\.(png|jpg|jpeg|webp)$'));
alter table public.community_guides drop constraint if exists community_guides_translations_check;
alter table public.community_guides add constraint community_guides_translations_check
  check (jsonb_typeof(translations) = 'object' and octet_length(translations::text) <= 400000);

-- ---------- trigger: date, tetti, stato riservato allo staff, copertina ----------
-- Privilegiato = lo staff (is_staff: admin o tag Staff) o una connessione diretta (auth.uid() nullo: script dello staff,
-- traduzioni degli arretrati). Errori con codici letti da `guideErrorCode` in src/lib/community/guides.ts.
create or replace function public.guard_community_guide()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := auth.uid();
  privileged boolean := me is null or public.is_staff();
  n int;
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.updated_at := now();
    new.published_at := case when new.status = 'published' then now() else null end;
    if not privileged then
      if new.status not in ('draft', 'published') then raise exception 'guide_status' using errcode = '42501'; end if;
      -- le richieste parallele dello stesso utente passano una alla volta: i tetti valgono anche così
      perform pg_advisory_xact_lock(hashtext('om_guides:' || new.owner::text));
      select count(*) into n from public.community_guides where owner = new.owner;
      if n >= 100 then raise exception 'guide_limit' using errcode = '23514'; end if;
      select count(*) into n from public.community_guides where owner = new.owner and created_at > now() - interval '1 day';
      if n >= 10 then raise exception 'guide_rate' using errcode = '23514'; end if;
      if new.status = 'published' then
        select count(*) into n from public.community_guides where owner = new.owner and published_at > now() - interval '1 day';
        if n >= 3 then raise exception 'guide_daily_limit' using errcode = '23514'; end if;
      end if;
    end if;
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
    if new.status = 'published' and old.published_at is null then
      if not privileged then
        perform pg_advisory_xact_lock(hashtext('om_guides:' || new.owner::text));
        select count(*) into n from public.community_guides where owner = new.owner and published_at > now() - interval '1 day';
        if n >= 3 then raise exception 'guide_daily_limit' using errcode = '23514'; end if;
      end if;
      new.published_at := now();
    end if;
    -- la data di aggiornamento è quella dell'autore: scrivere le traduzioni non la sposta (come i mazzi)
    if (to_jsonb(new) - 'translations' - 'updated_at' - 'published_at') is distinct from (to_jsonb(old) - 'translations' - 'updated_at' - 'published_at') then
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
grant insert (slug, owner, lang, title, summary, sections, category, cards, videos, links, cover_preset, cover_path, status)
  on public.community_guides to authenticated;
grant update (lang, title, summary, sections, category, cards, videos, links, cover_preset, cover_path, status, translations)
  on public.community_guides to authenticated;
grant delete on public.community_guides to authenticated;

-- ---------- segnalazioni (gemella di deck_reports) ----------
-- Una per utente e per guida; solo sulle guide pubblicate; le legge lo staff. Il sito avvisa anche il canale privato
-- dello staff su Discord (DISCORD_FEEDBACK_WEBHOOK_URL), con il link alla guida.
create table if not exists public.community_guide_reports (
  id bigint generated always as identity primary key,
  guide_id uuid not null references public.community_guides(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (guide_id, user_id)
);
create index if not exists community_guide_reports_user_idx on public.community_guide_reports (user_id, created_at desc);
alter table public.community_guide_reports drop constraint if exists community_guide_reports_reason_check;
alter table public.community_guide_reports add constraint community_guide_reports_reason_check
  check (public.community_guide_text_ok(reason, 3, 500, true));

-- Al massimo 20 segnalazioni al giorno per utente (lo staff no); la data la scrive il database.
create or replace function public.guard_community_guide_report()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  n int;
begin
  new.created_at := now();
  if auth.uid() is not null and not public.is_staff() then
    perform pg_advisory_xact_lock(hashtext('om_guide_reports:' || auth.uid()::text));
    select count(*) into n from public.community_guide_reports where user_id = auth.uid() and created_at > now() - interval '1 day';
    if n >= 20 then raise exception 'report_rate' using errcode = '23514'; end if;
  end if;
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
    and exists (select 1 from public.community_guides g where g.id = guide_id and g.status = 'published'));
drop policy if exists "guide reports: staff read" on public.community_guide_reports;
create policy "guide reports: staff read" on public.community_guide_reports for select to authenticated
  using ((select public.is_staff()));
drop policy if exists "guide reports: staff delete" on public.community_guide_reports;
create policy "guide reports: staff delete" on public.community_guide_reports for delete to authenticated
  using ((select public.is_staff()));

revoke all on public.community_guide_reports from anon, authenticated;
grant insert (guide_id, user_id, reason) on public.community_guide_reports to authenticated;
grant select, delete on public.community_guide_reports to authenticated;

-- Le regole anche nel catalogo del database, per chi lo apre dalla dashboard di Supabase.
comment on table public.community_guides is 'Guide della community pubblicate da Autore, Creator, Pro e Staff (27/09/2026). Regole in src/lib/community/guides.ts; permesso in can_publish_guides.';
comment on function public.can_publish_guides(uuid) is 'Chi pubblica guide senza passare dallo staff: Autore, Creator, Pro, Staff e admin (canPublishGuides in src/lib/community/badges.ts).';
