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
      where v.stars >= 4 and v.created_at >= mm.month at time zone 'utc' and v.created_at < (mm.month + interval '1 month') at time zone 'utc'
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
