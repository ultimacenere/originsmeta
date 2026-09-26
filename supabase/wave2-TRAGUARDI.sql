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
--      policy can_view_tournament), e in più filtra da sé su tornei pubblici e mazzi pubblicati.
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
-- Tornei: solo pubblici e finiti (status 'finished'). "Giocato": il profilo è in una partita del tabellone. "Vinto":
-- vincitore della finale (ultimo turno, posizione 0, partita confermata o bye), la stessa regola di finish_tournament
-- e di `standings` in src/lib/tournament/bracket.ts. `first` = data d'inizio del primo.
-- Mazzo del mese: per ogni mese UTC già chiuso, i mazzi pubblicati con più voti ricevuti in quel mese (almeno 3, pari
-- merito compresi); `top_months` = i mesi in cui uno di quelli era del profilo, come 'YYYY-MM'.
create or replace function public.profile_achievement_facts(pid uuid)
returns jsonb language sql stable security invoker set search_path = public, pg_temp as $$
  with pub as (
    select t.id, t.organizer, t.starts_at from public.tournaments t
    where t.status = 'finished' and t.visibility = 'public'
  ),
  played as (
    select distinct m.tournament_id from public.tournament_matches m join pub on pub.id = m.tournament_id
    where m.player_a = pid or m.player_b = pid
  ),
  finals as (
    select m.tournament_id, m.winner from public.tournament_matches m join pub on pub.id = m.tournament_id
    where m.position = 0 and m.status in ('confirmed', 'bye') and m.winner is not null
      and m.round = (select max(m2.round) from public.tournament_matches m2 where m2.tournament_id = m.tournament_id)
  ),
  monthly as (
    select date_trunc('month', v.created_at at time zone 'utc') as month, v.deck_id, count(*) as n
    from public.deck_votes v join public.community_decks d on d.id = v.deck_id and d.status = 'published'
    where date_trunc('month', v.created_at at time zone 'utc') < date_trunc('month', now() at time zone 'utc')
    group by 1, 2
  ),
  tops as (
    select mo.month, mo.deck_id, mo.n, max(mo.n) over (partition by mo.month) as best from monthly mo
  )
  select jsonb_build_object(
    'played', (select jsonb_build_object('count', count(*), 'first', min(pub.starts_at)) from played join pub on pub.id = played.tournament_id),
    'organized', (select jsonb_build_object('count', count(*), 'first', min(pub.starts_at)) from pub where pub.organizer = pid),
    'won', (select jsonb_build_object('count', count(*), 'first', min(pub.starts_at)) from finals join pub on pub.id = finals.tournament_id where finals.winner = pid),
    'top_months', coalesce((
      select jsonb_agg(distinct to_char(tp.month, 'YYYY-MM'))
      from tops tp join public.community_decks d on d.id = tp.deck_id
      where d.owner = pid and tp.n = tp.best and tp.n >= 3
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.profile_achievement_facts(uuid) from public;
grant execute on function public.profile_achievement_facts(uuid) to anon, authenticated;

comment on function public.profile_public_stats(uuid) is 'Totali dei mazzi pubblicati di un profilo con show_stats (vetrina /u): mazzi, visite, copie del codice, voti ricevuti. Solo aggregati; le righe di deck_stats_daily restano private (27/09/2026).';
comment on function public.profile_achievement_facts(uuid) is 'Fatti pubblici per i traguardi di /u: tornei pubblici finiti giocati, organizzati e vinti, mesi da mazzo del mese. Security invoker (27/09/2026).';
