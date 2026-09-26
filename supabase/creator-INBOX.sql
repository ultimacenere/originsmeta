-- =====================================================================================================
-- 26/09/2026 — CASELLA MESSAGGI utente ↔ staff (pacchetto INBOX, da accodare a supabase/schema.sql).
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
--   - testo semplice: il database toglie caratteri di controllo e caratteri invisibili di direzione, e tiene le
--     lunghezze (oggetto 1..120 su una riga, messaggio 1..4000); il sito lo mostra sempre come testo, mai come HTML.
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
-- di direzione del testo; una riga sola per l'oggetto, al massimo una riga vuota di fila per il messaggio.
-- Il sito pulisce già il testo (src/lib/community/messages.ts, `plainMessage`): questa è la seconda linea, per chi
-- chiamasse le RPC direttamente con la chiave pubblica.
create or replace function public.inbox_clean(t text, single_line boolean default false)
returns text language plpgsql immutable set search_path = public, pg_temp as $$
declare
  s text := coalesce(t, '');
begin
  s := replace(replace(s, E'\r\n', E'\n'), E'\r', E'\n');
  s := regexp_replace(s, '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F\u200E\u200F\u202A-\u202E\u2066-\u2069]', '', 'g');
  if single_line then
    s := regexp_replace(s, '\s+', ' ', 'g');
  else
    s := regexp_replace(s, '[ \t]+\n', E'\n', 'g');
    s := regexp_replace(s, '\n{3,}', E'\n\n', 'g');
  end if;
  return btrim(s, E' \t\n');
end $$;
revoke all on function public.inbox_clean(text, boolean) from public, anon, authenticated;

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
  if char_length(subj) < 1 then raise exception 'empty_subject'; end if;
  if char_length(subj) > 120 then raise exception 'subject_too_long'; end if;
  if char_length(clean) < 1 then raise exception 'empty_message'; end if;
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
  if char_length(subj) < 1 then raise exception 'empty_subject'; end if;
  if char_length(subj) > 120 then raise exception 'subject_too_long'; end if;
  if char_length(clean) < 1 then raise exception 'empty_message'; end if;
  if char_length(clean) > 4000 then raise exception 'message_too_long'; end if;
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
  if char_length(clean) < 1 then raise exception 'empty_message'; end if;
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
-- staff. Restituisce true se c'era qualcosa da leggere.
create or replace function public.inbox_mark_read(cid uuid, seen timestamptz default null)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := auth.uid();
  c public.conversations%rowtype;
  upto timestamptz := least(coalesce(seen, now()), now());
begin
  if me is null then raise exception 'not_logged_in'; end if;
  select * into c from public.conversations where id = cid for update;
  if not found then raise exception 'not_found'; end if;
  if c.user_id = me then
    if not c.unread_by_user then return false; end if;
    update public.conversations set read_by_user_at = greatest(read_by_user_at, upto) where id = cid;
  elsif public.is_staff() then
    if not c.unread_by_staff then return false; end if;
    update public.conversations set read_by_staff_at = greatest(read_by_staff_at, upto) where id = cid;
  else
    raise exception 'not_found';
  end if;
  return true;
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
