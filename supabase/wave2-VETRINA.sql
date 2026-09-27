-- ===== 27/09/2026: VETRINA =====
-- =====================================================================================================
-- Vetrina dei profili (pacchetto VETRINA, 27/09/2026; Pierluigi: "OK A TUTTO, OTTIMO!!" alle proposte per i profili)
-- =====================================================================================================
-- Da accodare in fondo a supabase/schema.sql (scripts/db-migrate.mjs applica tutto il file ogni volta: ogni riga qui
-- sotto è idempotente). Regole e test nel codice: src/lib/community/showcase.ts e showcase.test.ts, che confronta
-- questo blocco con il codice (elenchi, limiti, espressioni).
--
-- Che cosa aggiunge:
--   - per TUTTI gli iscritti la foto profilo caricata dal sito (`avatar_path`, file nel bucket `profile-media`,
--     cartella <id>/avatar, 1 MB, png/jpeg/webp). Un trigger tiene `avatar_url` allineata: con una foto caricata diventa
--     l'indirizzo pubblico del file, togliendola torna quella di Discord (dai metadati dell'accesso, solo se è davvero
--     un indirizzo di Discord). Così ogni lettura che già chiede `avatar_url` (mazzi, tornei, header, directory) mostra
--     la foto nuova senza cambiare le query, e prima della migrazione nulla cambia;
--   - per i ruoli con vetrina (Creator, Autore, Pro, Staff: SHOWCASE_BADGES in src/lib/community/badges.ts) i campi
--     della vetrina su /u/<nome>: copertina (uno degli 8 sfondi preimpostati del sito oppure un'immagine caricata in
--     <id>/cover, 2 MB), colore d'accento, frase di presentazione (80 caratteri), Leggendaria del cuore (slug controllato
--     dal sito contro i dati delle carte), mazzo in evidenza (uno dei SUOI mazzi pubblicati), video in evidenza (le
--     forme canoniche di deck_video_url_ok, blocco VIDEO), orari delle dirette (fino a 7 voci) con il fuso IANA.
--
-- ORDINE: questo blocco sta DOPO `revoke update on public.profiles from anon, authenticated;` (commit 6c6756d) e dopo il
-- blocco CREATOR. Il grant qui sotto è per colonna, come quello di bio/links/content_langs: un REVOKE sulla tabella lo
-- cancellerebbe, quindi nessun blocco accodato dopo questo deve fare una revoke su profiles. scripts/schema-guard.mjs
-- conosce questo grant (PROFILES_GRANTS) e rifiuta qualsiasi altra grant su public.profiles.
--
-- Sicurezza:
--   - grant di UPDATE solo sulle colonne nuove che l'utente cambia dal sito (mai sull'intera tabella);
--   - trigger `guard_profile_vetrina` (con i privilegi di chi salva, search_path fissato): i campi della vetrina li
--     imposta solo chi ha un ruolo con vetrina (svuotarli si può sempre; script e admin passano), il mazzo in evidenza
--     dev'essere suo e pubblicato, le immagini devono esistere nella sua cartella del bucket con tipo e peso giusti.
--     L'unica funzione security definer è `profile_discord_avatar` (legge auth.users), limitata al proprio profilo;
--   - bucket `profile-media` pubblico in lettura (indirizzi pubblici), scrittura solo nella propria cartella, solo
--     png/jpeg/webp fino a 2 MB (limite del bucket: lo Storage prova la policy di caricamento PRIMA di conoscere il
--     peso del file, quindi il peso per tipo, 1 MB per la foto, lo controlla il trigger quando si salva), la copertina
--     solo per i ruoli con vetrina, un tetto di 12 file per utente (morbido: vale al momento della prova, non contro
--     caricamenti lanciati tutti insieme), e il file in uso non si cancella (niente immagini rotte sul profilo);
--   - lo staff toglie foto, copertina e frase di un utente con `node scripts/clear-profile-media.mjs` (README, "Vetrina
--     dei profili e foto caricate"); un admin vede e cancella dal sito i file di tutti, mai quelli in uso.
-- =====================================================================================================

alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists cover_preset text;
alter table public.profiles add column if not exists cover_path text;
alter table public.profiles add column if not exists accent text;
alter table public.profiles add column if not exists tagline text;
alter table public.profiles add column if not exists favorite_legendary text;
-- uno dei suoi mazzi pubblicati; se il mazzo viene eliminato il campo si svuota da solo
alter table public.profiles add column if not exists featured_deck uuid references public.community_decks(id) on delete set null;
alter table public.profiles add column if not exists featured_video text;
-- orari delle dirette: [{"day": 0-6 (0 = lunedì), "time": "HH:MM", "minutes": 15-720 facoltativo}], ora del fuso schedule_tz
alter table public.profiles add column if not exists schedule jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists schedule_tz text;
-- ultime modifiche della foto e della vetrina: le scrive solo il trigger qui sotto (nessun grant). Servono ai limiti di
-- frequenza dei due moduli di /account, separati fra loro e da quello di bio e canali (showcase_updated_at)
alter table public.profiles add column if not exists avatar_updated_at timestamptz;
alter table public.profiles add column if not exists vetrina_updated_at timestamptz;

create index if not exists profiles_featured_deck_idx on public.profiles (featured_deck) where featured_deck is not null;

-- Una voce degli orari: esattamente {day, time} più minutes facoltativo. I CASE fissano l'ordine dei controlli (Postgres
-- non garantisce quello di AND/OR): un valore del tipo sbagliato non arriva mai a un cast.
create or replace function public.profile_schedule_entry_ok(e jsonb)
returns boolean language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case
    when jsonb_typeof(e) is distinct from 'object' then false
    when (e - 'day' - 'time' - 'minutes') <> '{}'::jsonb then false
    when jsonb_typeof(e->'day') is distinct from 'number' or jsonb_typeof(e->'time') is distinct from 'string' then false
    when (e->>'day') !~ '^[0-6]$' then false
    when (e->>'time') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then false
    when not (e ? 'minutes') then true
    when jsonb_typeof(e->'minutes') is distinct from 'number' then false
    when (e->>'minutes') !~ '^[0-9]{1,3}$' then false
    else (e->>'minutes')::integer between 15 and 720
  end
$$;

-- Gli orari: un array di al massimo 7 voci valide (vuoto = nessun orario). Una voce che desse null conta come non
-- valida: bool_and ignora i null e un CHECK con risultato null passerebbe.
create or replace function public.profile_schedule_ok(s jsonb)
returns boolean language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case
    when jsonb_typeof(s) is distinct from 'array' then false
    when jsonb_array_length(s) > 7 then false
    else coalesce((select bool_and(coalesce(public.profile_schedule_entry_ok(t.e), false)) from jsonb_array_elements(s) as t(e)), true)
  end
$$;

-- Girano dentro i vincoli, con i privilegi di chi scrive la riga: EXECUTE per authenticated e service_role.
revoke all on function public.profile_schedule_entry_ok(jsonb) from public, anon;
revoke all on function public.profile_schedule_ok(jsonb) from public, anon;
grant execute on function public.profile_schedule_entry_ok(jsonb) to authenticated, service_role;
grant execute on function public.profile_schedule_ok(jsonb) to authenticated, service_role;

-- Vincoli (tolti e rimessi: idempotenti). Le espressioni sono quelle di showcase.ts (MEDIA_FILE_RE, COVER_PRESETS,
-- ACCENTS, TAGLINE_MAX, SCHEDULE_MAX…): il test le confronta.
alter table public.profiles drop constraint if exists profiles_avatar_path_check;
alter table public.profiles add constraint profiles_avatar_path_check
  check (avatar_path is null or avatar_path ~ ('^' || id::text || '/avatar/[A-Za-z0-9_-]{8,64}\.(png|jpg|jpeg|webp)$'));
alter table public.profiles drop constraint if exists profiles_cover_path_check;
alter table public.profiles add constraint profiles_cover_path_check
  check (cover_path is null or cover_path ~ ('^' || id::text || '/cover/[A-Za-z0-9_-]{8,64}\.(png|jpg|jpeg|webp)$'));
alter table public.profiles drop constraint if exists profiles_cover_preset_check;
alter table public.profiles add constraint profiles_cover_preset_check
  check (cover_preset is null or cover_preset in ('aurora', 'mint-tide', 'sky-crystal', 'gold-stars', 'crimson-rays', 'violet-nebula', 'night-grid', 'sunset'));
alter table public.profiles drop constraint if exists profiles_accent_check;
alter table public.profiles add constraint profiles_accent_check
  check (accent is null or accent in ('sky', 'mint', 'gold', 'crimson', 'violet', 'coral', 'green', 'peach'));
-- frase di presentazione: testo semplice su una riga (deck_text_ok del blocco VIDEO: niente caratteri di controllo, a
-- capo compresi, né invisibili), 1-80 caratteri, senza spazi in testa o in coda
alter table public.profiles drop constraint if exists profiles_tagline_check;
alter table public.profiles add constraint profiles_tagline_check
  check (tagline is null or (public.deck_text_ok(tagline, 80) and tagline ~ '[^[:space:]]' and tagline = btrim(tagline)));
alter table public.profiles drop constraint if exists profiles_favorite_legendary_check;
alter table public.profiles add constraint profiles_favorite_legendary_check
  check (favorite_legendary is null or (char_length(favorite_legendary) <= 60 and favorite_legendary ~ '^[a-z0-9]+(-[a-z0-9]+)*$'));
alter table public.profiles drop constraint if exists profiles_featured_video_check;
alter table public.profiles add constraint profiles_featured_video_check
  check (featured_video is null or public.deck_video_url_ok(featured_video));
-- orari validi, e il fuso se e solo se ci sono orari (un nome IANA ben formato: l'elenco fra cui scegliere lo tiene il
-- sito). Senza orari niente fuso: la colonna è pubblica e il fuso direbbe dove vive chi non pubblica nessun orario.
alter table public.profiles drop constraint if exists profiles_schedule_check;
alter table public.profiles add constraint profiles_schedule_check
  check (public.profile_schedule_ok(schedule) and ((schedule = '[]'::jsonb) = (schedule_tz is null)));
alter table public.profiles drop constraint if exists profiles_schedule_tz_check;
alter table public.profiles add constraint profiles_schedule_tz_check
  check (schedule_tz is null or (char_length(schedule_tz) <= 64 and schedule_tz ~ '^(UTC|[A-Z][A-Za-z_]+(/[A-Za-z0-9_+-]+){1,2})$'));

-- Indirizzo pubblico di un file del bucket profile-media: lo stesso di `mediaPublicUrl` in showcase.ts con l'URL del
-- progetto di src/lib/supabase/env.ts (il test li confronta). Se un giorno il progetto Supabase cambia, cambia qui.
create or replace function public.profile_media_url(p text)
returns text language sql immutable set search_path = pg_catalog, pg_temp as $$
  select 'https://obpnprlzxrlbvncpqlpq.supabase.co/storage/v1/object/public/profile-media/' || p
$$;

-- Il file c'è nel bucket, con un tipo ammesso e al massimo `max_bytes` (quando lo Storage li ha scritti nei metadati).
-- Gira con i privilegi di chi chiama (il trigger qui sotto, cioè l'utente che salva): vede i file della sua cartella
-- grazie alla policy "profile media owners read", nessun altro. Niente security definer: non serve saltare la RLS.
create or replace function public.profile_media_ok(p text, max_bytes bigint)
returns boolean language sql stable set search_path = public, pg_temp as $$
  select exists (
    select 1 from storage.objects o
     where o.bucket_id = 'profile-media'
       and o.name = p
       and (o.metadata->>'size' is null or (o.metadata->>'size')::bigint <= max_bytes)
       and (o.metadata->>'mimetype' is null or o.metadata->>'mimetype' in ('image/png', 'image/jpeg', 'image/webp')))
$$;

-- Quanti file ha l'utente collegato nel bucket (policy di caricamento: al massimo 12). Anche questa con i privilegi di
-- chi carica, e solo la sua cartella. Tetto morbido: lo Storage prova la policy in una transazione che annulla subito e
-- scrive poi il file con i suoi privilegi, quindi caricamenti lanciati tutti insieme vedono lo stesso conteggio (un
-- lucchetto qui non servirebbe: finirebbe con la transazione di prova). Il sito carica un file alla volta e pulisce la
-- cartella; i file mai usati li trova e li toglie `node scripts/clear-profile-media.mjs --orphans`.
create or replace function public.profile_media_count()
returns integer language sql stable set search_path = public, pg_temp as $$
  select count(*)::integer from storage.objects o
   where o.bucket_id = 'profile-media' and (storage.foldername(o.name))[1] = auth.uid()::text
$$;

-- La foto di Discord di un profilo, dai metadati dell'accesso (auth.users, che l'utente non legge: per questo è l'unica
-- security definer del blocco). Solo per il proprio profilo (o per un admin, o per uno script con connessione diretta),
-- e solo se è davvero un indirizzo di Discord: quei metadati l'utente li può cambiare via API.
create or replace function public.profile_discord_avatar(uid uuid)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select case
    when auth.uid() is not null and auth.uid() <> uid and not public.is_admin() then null
    else (select case when m ~ '^https://(cdn\.discordapp\.com|media\.discordapp\.net)/[A-Za-z0-9/_.-]{1,300}(\?size=[0-9]{1,4})?$' then m end
            from (select u.raw_user_meta_data->>'avatar_url' as m from auth.users u where u.id = uid) as x)
  end
$$;

-- Le chiamano il trigger (con i privilegi dell'utente che salva) e la policy di caricamento: EXECUTE per authenticated.
revoke all on function public.profile_media_url(text) from public, anon;
revoke all on function public.profile_media_ok(text, bigint) from public, anon;
revoke all on function public.profile_media_count() from public, anon;
revoke all on function public.profile_discord_avatar(uuid) from public, anon;
grant execute on function public.profile_media_url(text) to authenticated, service_role;
grant execute on function public.profile_media_ok(text, bigint) to authenticated, service_role;
grant execute on function public.profile_media_count() to authenticated, service_role;
grant execute on function public.profile_discord_avatar(uuid) to authenticated, service_role;

-- I controlli che un vincolo non può fare, con i privilegi di chi salva (niente security definer: legge i mazzi pubblicati
-- e i file della propria cartella, che vede già). Script con connessione diretta (auth.uid() nullo) e admin passano il
-- controllo del ruolo; mazzo e immagini si controllano per tutti.
create or replace function public.guard_profile_vetrina()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  -- 1) i campi della vetrina li imposta solo chi ha un ruolo con vetrina; svuotarli si può sempre (anche dopo aver
  --    perso il ruolo). avatar_path no: la foto profilo è di tutti.
  if auth.uid() is not null and not public.is_admin()
     and old.badge not in ('creator', 'author', 'pro', 'staff') and (
          (new.cover_preset is not null and new.cover_preset is distinct from old.cover_preset)
       or (new.cover_path is not null and new.cover_path is distinct from old.cover_path)
       or (new.accent is not null and new.accent is distinct from old.accent)
       or (new.tagline is not null and new.tagline is distinct from old.tagline)
       or (new.favorite_legendary is not null and new.favorite_legendary is distinct from old.favorite_legendary)
       or (new.featured_deck is not null and new.featured_deck is distinct from old.featured_deck)
       or (new.featured_video is not null and new.featured_video is distinct from old.featured_video)
       or (new.schedule <> '[]'::jsonb and new.schedule is distinct from old.schedule)
       or (new.schedule_tz is not null and new.schedule_tz is distinct from old.schedule_tz)) then
    raise exception 'showcase fields are reserved to showcase roles';
  end if;

  -- 2) mazzo in evidenza: uno dei SUOI mazzi pubblicati
  if new.featured_deck is not null and new.featured_deck is distinct from old.featured_deck
     and not exists (select 1 from public.community_decks d where d.id = new.featured_deck and d.owner = new.id and d.status = 'published') then
    raise exception 'featured deck must be one of your published decks';
  end if;

  -- 3) copertina caricata: il file c'è, nella sua cartella (vincolo), con tipo e peso ammessi
  if new.cover_path is not null and new.cover_path is distinct from old.cover_path
     and not public.profile_media_ok(new.cover_path, 2097152) then
    raise exception 'cover image not found or not allowed';
  end if;

  -- 4) foto profilo: controllo del file e avatar_url allineata (caricata → indirizzo del file; tolta → Discord, o nessuna)
  if new.avatar_path is distinct from old.avatar_path then
    if new.avatar_path is not null then
      if not public.profile_media_ok(new.avatar_path, 1048576) then
        raise exception 'avatar image not found or not allowed';
      end if;
      new.avatar_url := public.profile_media_url(new.avatar_path);
    else
      new.avatar_url := public.profile_discord_avatar(new.id);
    end if;
  end if;

  -- 5) date delle modifiche: avatar_updated_at e vetrina_updated_at per i limiti di frequenza dei due moduli di /account;
  --    showcase_updated_at (lastmod di /u/<nome> nella sitemap, come touch_profile_showcase del blocco CREATOR) per la
  --    vetrina e, solo per i ruoli con vetrina, per la foto: le foto degli iscritti community non riempiono la lettura
  --    delle date della sitemap.
  if new.avatar_path is distinct from old.avatar_path then
    new.avatar_updated_at := now();
    if new.badge in ('creator', 'author', 'pro', 'staff') then
      new.showcase_updated_at := now();
    end if;
  end if;
  if (new.cover_preset, new.cover_path, new.accent, new.tagline, new.favorite_legendary, new.featured_deck, new.featured_video,
      new.schedule, new.schedule_tz)
     is distinct from
     (old.cover_preset, old.cover_path, old.accent, old.tagline, old.favorite_legendary, old.featured_deck, old.featured_video,
      old.schedule, old.schedule_tz) then
    new.vetrina_updated_at := now();
    new.showcase_updated_at := now();
  end if;
  return new;
end $$;
-- la funzione di un trigger non si chiama da sola: niente EXECUTE per nessuno (il trigger scatta lo stesso)
revoke all on function public.guard_profile_vetrina() from public, anon, authenticated;
drop trigger if exists profiles_guard_vetrina on public.profiles;
create trigger profiles_guard_vetrina before update on public.profiles
  for each row execute function public.guard_profile_vetrina();

-- Le sole colonne nuove che l'utente cambia dal sito, sulla propria riga (policy "users edit own profile"). MAI un grant
-- di UPDATE sull'intera tabella: riaprirebbe role e badge (6c6756d).
grant update (avatar_path, cover_preset, cover_path, accent, tagline, favorite_legendary, featured_deck, featured_video, schedule, schedule_tz) on public.profiles to authenticated;

comment on column public.profiles.avatar_path is 'Foto profilo caricata dal sito (bucket profile-media, <id>/avatar/<file>, 1 MB): il trigger guard_profile_vetrina tiene avatar_url allineata (27/09/2026).';
comment on column public.profiles.cover_preset is 'Vetrina: sfondo preimpostato della copertina (src/lib/community/showcase.ts, COVER_PRESETS). Solo ruoli con vetrina.';
comment on column public.profiles.cover_path is 'Vetrina: copertina caricata (bucket profile-media, <id>/cover/<file>, 2 MB). Solo ruoli con vetrina.';
comment on column public.profiles.schedule is 'Vetrina: orari delle dirette, al massimo 7 voci {day 0-6 (0 = lunedì), time HH:MM, minutes 15-720 facoltativo} nel fuso schedule_tz (che c''è solo con degli orari).';
comment on column public.profiles.avatar_updated_at is 'Ultimo cambio della foto caricata: lo scrive solo il trigger guard_profile_vetrina (limite di frequenza di saveAvatar).';
comment on column public.profiles.vetrina_updated_at is 'Ultimo cambio della vetrina: lo scrive solo il trigger guard_profile_vetrina (limite di frequenza di saveShowcase).';

-- ---------- Storage: foto profilo e copertine (caricate dal browser, ognuno nella sua cartella) ----------
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('profile-media', 'profile-media', true, 2097152, array['image/png','image/jpeg','image/webp'])
  on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

  -- gli indirizzi pubblici funzionano senza policy (bucket pubblico); l'elenco dei file lo vede solo il proprietario (e
  -- un admin, che senza lettura non potrebbe nemmeno cancellare)
  drop policy if exists "profile media owners read" on storage.objects;
  create policy "profile media owners read" on storage.objects for select to authenticated using (
    bucket_id = 'profile-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
  -- <id>/avatar/<file> (tutti) e <id>/cover/<file> (ruoli con vetrina o admin), al massimo 12 file per utente. Niente
  -- peso qui: lo Storage prova questa policy prima di ricevere il file, quando i metadati (size, mimetype) non ci sono
  -- ancora. Il caricamento lo limita il bucket (2 MB, tre tipi); 1 MB per la foto lo impone il trigger al salvataggio.
  drop policy if exists "profile media upload" on storage.objects;
  create policy "profile media upload" on storage.objects for insert to authenticated with check (
    bucket_id = 'profile-media'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = auth.uid()::text
    and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
    and public.profile_media_count() < 12
    and (
      (storage.foldername(name))[2] = 'avatar'
      or ((storage.foldername(name))[2] = 'cover'
          and exists (select 1 from public.profiles p where p.id = auth.uid() and (p.badge in ('creator', 'author', 'pro', 'staff') or p.role = 'admin')))
    )
  );
  -- niente update (i nomi sono sempre nuovi); si cancellano i propri file (un admin anche quelli degli altri), mai un file
  -- in uso sul profilo del proprietario della cartella: prima si svuota il campo, poi si toglie il file
  drop policy if exists "profile media owners delete" on storage.objects;
  create policy "profile media owners delete" on storage.objects for delete to authenticated using (
    bucket_id = 'profile-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
    and not exists (select 1 from public.profiles p where p.id::text = (storage.foldername(name))[1] and (p.avatar_path = name or p.cover_path = name))
  );
exception when others then
  raise notice 'Storage profile-media non configurato da SQL (%): creare bucket e policy dalla dashboard, vedi README ("Vetrina dei profili e foto caricate").', sqlerrm;
end $$;
