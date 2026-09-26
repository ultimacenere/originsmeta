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
--   File da accodare a supabase/schema.sql: tutto è idempotente.
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
