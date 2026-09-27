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
