-- =====================================================================================================
-- 26/09/2026 — VIDEO E RISORSE NEI MAZZI (pacchetto VIDEO delle funzioni per i creator, richiesta di Pierluigi)
-- Da accodare a supabase/schema.sql. Idempotente: si può rilanciare.
--
-- community_decks.videos: fino a 3 video {url, start?}. `url` è l'indirizzo CANONICO scritto dal sito
--   (src/lib/videos.ts, `parseVideoUrl`): https://www.youtube.com/watch?v=<id>, https://www.youtube.com/shorts/<id>,
--   https://www.twitch.tv/videos/<numero>, https://clips.twitch.tv/<slug>; `start` = secondi dall'inizio (intero,
--   da 1 a 48 ore), facoltativo. La vecchia colonna video_url resta: il sito la legge come primo video quando
--   `videos` è vuota e ci scrive ancora il primo video (compatibilità). Nessuna copia dei dati: il 26/09/2026 nessun
--   mazzo pubblicato aveva un video.
-- community_decks.links: fino a 5 risorse {label, url}: etichetta di testo semplice (1-40 caratteri, niente caratteri
--   di controllo né segni di direzione del testo), indirizzo https su un host ammesso (lista uguale a LINK_HOSTS in
--   src/lib/videos.ts: un test di videos.test.ts le confronta), niente credenziali né porte, al massimo 300 caratteri.
--
-- Permessi: community_decks ha già i grant di tabella (select ad anon e authenticated; insert, update, delete ad
-- authenticated) e le policy "users insert own decks", "owners update decks", "owners delete decks": un grant di
-- tabella vale per tutte le colonne, anche per quelle aggiunte dopo, quindi le due colonne nuove le scrive solo il
-- proprietario del mazzo (o un admin), come il resto della riga. Nessun grant nuovo. I vincoli qui sotto valgono anche
-- per chi scrive direttamente via API con la chiave pubblica, saltando la Server Action; la pagina rilegge comunque
-- ogni voce con le regole di src/lib/videos.ts e scarta quelle che non riconosce.
-- =====================================================================================================

alter table public.community_decks add column if not exists videos jsonb not null default '[]'::jsonb;
alter table public.community_decks add column if not exists links jsonb not null default '[]'::jsonb;

-- Host ammessi per le risorse, sottodomini compresi (www., m., old.reddit.com, store.steampowered.com…).
-- Funzione pura (immutable, niente security definer); `u` deve iniziare con https:// e l'host finire con / ? # o
-- con la fine dell'indirizzo: così una porta (":8080") o delle credenziali ("utente@") non passano.
-- LINK_HOSTS (tenere uguale a src/lib/videos.ts)
create or replace function public.deck_link_host_ok(u text)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select coalesce((
    select exists (
      select 1
        from unnest(array[
          'youtube.com', 'youtu.be', 'twitch.tv', 'x.com', 'twitter.com', 'reddit.com', 'discord.gg', 'discord.com',
          'origins-tcg.com', 'koingames.io', 'steampowered.com', 'steamcommunity.com', 'originsmeta.com',
          'tiktok.com', 'instagram.com', 'bsky.app', 'kick.com'
        ]::text[]) as a(d)
       where s.host = a.d or right(s.host, char_length(a.d) + 1) = '.' || a.d)
      from (select lower(substring(u from '^https://([A-Za-z0-9.-]+)(?:[/?#]|$)')) as host) as s
     where s.host is not null
  ), false);
$$;

-- Video di un mazzo: array di al massimo 3 oggetti con le sole chiavi url e start. I CASE fissano l'ordine dei
-- controlli (Postgres non garantisce quello di AND/OR), così un valore del tipo sbagliato non arriva mai a un cast.
-- VIDEO_URL_RE (tenere uguale alle forme canoniche di parseVideoUrl in src/lib/videos.ts)
create or replace function public.deck_videos_ok(v jsonb)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select case
    when v is null or jsonb_typeof(v) <> 'array' then false
    when jsonb_array_length(v) > 3 then false
    else not exists (
      select 1 from jsonb_array_elements(v) as e(x)
       where case
         when jsonb_typeof(x) <> 'object' then true
         when (x - 'url' - 'start') <> '{}'::jsonb then true
         when jsonb_typeof(x -> 'url') is distinct from 'string' then true
         when char_length(x ->> 'url') > 300 then true
         when (x ->> 'url') !~ '^https://(www\.youtube\.com/(watch\?v=|shorts/)[A-Za-z0-9_-]{11}|www\.twitch\.tv/videos/[0-9]{1,15}|clips\.twitch\.tv/[A-Za-z0-9_-]{1,100})$' then true
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
         when char_length(x ->> 'label') not between 1 and 40 then true
         when (x ->> 'label') ~ '[[:cntrl:]]' then true
         -- segni di direzione del testo (LRM, RLM, LRE…RLO, LRI…PDI): con quelli un'etichetta si legge al contrario
         when translate(x ->> 'label', U&'\200E\200F\202A\202B\202C\202D\202E\2066\2067\2068\2069', '') <> (x ->> 'label') then true
         when char_length(x ->> 'url') > 300 then true
         else not public.deck_link_host_ok(x ->> 'url')
       end)
  end;
$$;

-- Funzioni pure, ma esposte da PostgREST come /rpc/…: niente esecuzione per anon (non scrive mazzi). authenticated
-- deve poterle eseguire, perché Postgres controlla i vincoli con i permessi di chi scrive la riga.
revoke all on function public.deck_link_host_ok(text) from public, anon;
revoke all on function public.deck_videos_ok(jsonb) from public, anon;
revoke all on function public.deck_links_ok(jsonb) from public, anon;
grant execute on function public.deck_link_host_ok(text) to authenticated, service_role;
grant execute on function public.deck_videos_ok(jsonb) to authenticated, service_role;
grant execute on function public.deck_links_ok(jsonb) to authenticated, service_role;

alter table public.community_decks drop constraint if exists community_decks_videos_check;
alter table public.community_decks add constraint community_decks_videos_check check (public.deck_videos_ok(videos));
alter table public.community_decks drop constraint if exists community_decks_links_check;
alter table public.community_decks add constraint community_decks_links_check check (public.deck_links_ok(links));

-- Il vecchio video_url ora lo scrive solo il sito, con l'indirizzo canonico del primo video: stessa misura massima
-- dei video. NOT VALID: una riga vecchia più lunga (non ce ne sono il 26/09/2026) non blocca la migrazione.
alter table public.community_decks drop constraint if exists community_decks_video_url_check;
alter table public.community_decks add constraint community_decks_video_url_check
  check (video_url is null or (char_length(video_url) <= 300 and video_url ~ '^https?://')) not valid;
