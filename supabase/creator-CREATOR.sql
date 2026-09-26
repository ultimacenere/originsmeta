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
-- ORDINE (da leggere prima di spostare questo blocco): va DOPO la riga
--   revoke update on public.profiles from anon, authenticated;
-- di schema.sql (commit 6c6756d). In Postgres un REVOKE sulla tabella toglie anche i grant per colonna: se questo
-- file girasse prima, il grant di bio/links/content_langs sparirebbe a ogni migrazione e il modulo di /account
-- risponderebbe "permission denied". Accodato in fondo a schema.sql va bene.
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
-- scrive il sito), al massimo 200 caratteri. Il sito web accetta qualsiasi dominio, ma non gli accorciatori di link.
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
      when 'website' then (link->>'url') ~ '^https://[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,63}(/[^\s"<>\\^`{|}]*)?$'
        and regexp_replace(substring(link->>'url' from '^https://([^/?#]+)'), '^www\.', '') not in (
          'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'cutt.ly', 'rebrand.ly',
          'shorturl.at', 'tiny.cc', 'rb.gy', 's.id', 'lnkd.in', 't.ly', 'shorturl.com')
      else false
    end
  end
$$;

-- L'elenco dei canali: un array di al massimo otto canali validi (vuoto = nessun canale).
create or replace function public.profile_links_ok(links jsonb)
returns boolean language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case
    when jsonb_typeof(links) is distinct from 'array' then false
    when jsonb_array_length(links) > 8 then false
    else coalesce((select bool_and(public.profile_link_ok(t.e)) from jsonb_array_elements(links) as t(e)), true)
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
