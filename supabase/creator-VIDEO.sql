-- =====================================================================================================
-- 26/09/2026 — VIDEO E RISORSE NEI MAZZI (pacchetto VIDEO delle funzioni per i creator, richiesta di Pierluigi)
-- Da accodare a supabase/schema.sql. Idempotente: si può rilanciare.
-- PRIMA di lanciare la migrazione: in schema.sql la funzione protect_profile_badge (commit 6c6756d) ha i delimitatori
-- `as $` e `end $;` invece di `as $$` e `end $$;`: è un errore di sintassi e scripts/db-migrate.mjs, che manda il file
-- in una sola query, fallirebbe per intero, compreso questo blocco.
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
