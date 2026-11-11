// Torneo di prova a doppia eliminazione (lo stesso di demo-tournament.mjs --format double_elim) come UN file SQL da
// incollare nell'editor SQL di Supabase: serve quando si lavora da un PC senza .env.local (10/11/2026).
// Uso: node scripts/demo-de-sql.mjs --organizer <nome utente> [--players a] [--judges x,y] [--count 300]
//        [--stage qualifiers|ready|half|open|final] [--lang en] [--out file.sql]
//        [--waitlist 24] [--no-decks 32] [--left 4] [--deck-pool 48] [--no-select]
//        [--pools 2] [--qualify 32] [--size 1024] [--qualifier] [--starts 2026-11-28T10:00:00Z]
//        [--name "…"] [--slug test-qualifier-a] [--desc-file testo.txt] [--rules-file regole.txt]
// Il file fa tutto in un blocco DO (una transazione): bot mancanti, torneo privato, iscrizioni con mazzo e sideboard di 3,
// avvio, partite fra bot. In fondo una select con tag, link e codice d'invito. Se qualcosa non torna non scrive niente.
// Dall'11/11/2026 (risposta di apix: due qualificazioni separate da 512, ognuna con il suo tabellone, la Top 128 è un
// torneo a parte):
//   --pools 1 --size 512 --count 512 --qualifier   → una qualificazione senza fase finale con un solo tabellone
//                                                     (blocco "11/11/2026: QUALIFICAZIONE SENZA FASE FINALE")
//   --stage half   → il torneo fermo a metà: giocate le prime tre ondate (vincenti fino al penultimo turno, perdenti
//                    fino al turno 2), della quarta una partita su due; nella coda dello staff restano una partita
//                    contestata, un referto non confermato e una partita con i due giocatori assenti. Le altre partite
//                    aperte non hanno `ready_at`: sono bot, non giocheranno mai, e con l'orologio acceso dopo 75 minuti
//                    finirebbero tutte nella coda dello staff ("partita lunga"). Lo staff le chiude lo stesso a mano.
//                    Gli avvisi "la tua partita è pronta" scritti ai bot si cancellano alla fine.
//   --stage open   → il torneo prima dell'avvio: iscrizioni fatte, nessun check-in. --waitlist N mette altri N bot in
//                    lista d'attesa, --no-decks N lascia gli ultimi N iscritti senza mazzo.
//   --stage final  → l'ultimo turno: tutto giocato tranne --left N partite (predefinito 4) dell'ultimo turno dei perdenti.
//   --deck-pool N  → solo N mazzi diversi, dati a rotazione (file più piccolo); --no-select toglie la select finale.
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : undefined;
};
const org = opt("--organizer");
if (!org) throw new Error("--organizer <nome utente> obbligatorio");
const players = (opt("--players") ?? "").split(",").map((s) => s.trim().replace(/^@/, "")).filter(Boolean).slice(0, 2);
const judges = (opt("--judges") ?? "").split(",").map((x) => x.trim().replace(/^@/, "")).filter(Boolean);
const POOLS = Number(opt("--pools") ?? 2);
const QUAL = Number(opt("--qualify") ?? 32);
const SIZE = Number(opt("--size") ?? 1024);
const QUALIFIER = argv.includes("--qualifier");
const N = Number(opt("--count") ?? 300);
if (!Number.isInteger(POOLS) || POOLS < 1 || POOLS > 8) throw new Error("--pools fra 1 e 8");
if (![1, 2, 4, 8, 16, 32, 64, 128].includes(QUAL)) throw new Error("--qualify: 1, 2, 4, 8, 16, 32, 64 o 128");
if (![4, 8, 16, 32, 64, 128, 256, 512, 1024].includes(SIZE)) throw new Error("--size: una potenza di 2 fra 4 e 1024");
if (!Number.isInteger(N) || N < POOLS * (2 * QUAL + 1) || N > SIZE) throw new Error(`--count fra ${POOLS * (2 * QUAL + 1)} e ${SIZE} (ogni tabellone deve avere più di ${2 * QUAL} iscritti)`);
const stage = opt("--stage") ?? "qualifiers";
if (!["qualifiers", "ready", "half", "open", "final"].includes(stage)) throw new Error("--stage qualifiers, ready, half, open o final");
const lang = opt("--lang") ?? "en";
const out = opt("--out") ?? `demo-de-${stage}.sql`;
const startsRaw = opt("--starts");
const starts = startsRaw ? new Date(startsRaw) : null;
if (starts && Number.isNaN(starts.getTime())) throw new Error("--starts: data non valida");
const SIDE = 3;
const BOT_DOMAIN = "bots.originsmeta.local";
const CUT = POOLS * QUAL * 2;
const OPEN = stage === "open";
const WAIT = OPEN ? Number(opt("--waitlist") ?? 0) : 0;
const NO_DECKS = OPEN ? Number(opt("--no-decks") ?? 0) : 0;
if (!Number.isInteger(WAIT) || WAIT < 0 || WAIT > 200) throw new Error("--waitlist fra 0 e 200");
if (!Number.isInteger(NO_DECKS) || NO_DECKS < 0 || NO_DECKS > N) throw new Error("--no-decks fra 0 e gli iscritti");
const LEFT = Number(opt("--left") ?? 4);
if (!Number.isInteger(LEFT) || LEFT < 0 || LEFT > QUAL * POOLS) throw new Error("--left fra 0 e le partite dell'ultimo turno dei perdenti");
const ALL = N + WAIT;
const DECK_POOL = Math.min(ALL, Number(opt("--deck-pool") ?? ALL));
if (!Number.isInteger(DECK_POOL) || DECK_POOL < 1) throw new Error("--deck-pool: almeno 1");
const NO_SELECT = argv.includes("--no-select");

const woo = JSON.parse(readFileSync(new URL("../src/lib/data/woo-cards.json", import.meta.url), "utf8"));
const legendaries = woo.cards.filter((c) => c.status === "active" && c.legendary && c.type !== "token").map((c) => c.slug);
const bases = woo.cards.filter((c) => c.status === "active" && !c.legendary && c.type !== "token" && !c.tokenOnly).map((c) => c.slug);
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const omCode = (deck) => `OM1.${Buffer.from(JSON.stringify({ n: deck.name, l: deck.legendary, c: deck.cards, x: [] }), "utf8").toString("base64url")}`;
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

const decks = Array.from({ length: DECK_POOL }, (_, k) => {
  const pool = shuffle(bases);
  const label = DECK_POOL < ALL ? `Test deck ${k + 1}` : k < players.length ? players[k] : `Bot ${k - players.length + 1}`;
  return { k, code: omCode({ name: label, legendary: shuffle(legendaries)[0], cards: pool.slice(0, 12) }), side: JSON.stringify(pool.slice(12, 12 + SIDE)) };
});
const slugBase = (opt("--slug") ?? "torneo-di-prova").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
const slug = `${slugBase}-${randomBytes(2).toString("hex")}`;
const title = (opt("--name") ?? (POOLS === 1 ? `Test tournament · ${SIZE} double elimination` : `Test tournament · ${POOLS} × ${SIZE / POOLS} double elimination`)).slice(0, 60);
if (title.length < 3) throw new Error("--name: almeno 3 caratteri");
const fileText = (name) => (opt(name) ? readFileSync(opt(name), "utf8").replace(/\r\n/g, "\n").trim() : null);
const desc =
  fileText("--desc-file") ??
  [
    `Test tournament for the 28–29 November event: ${N} fake players (bots), no prizes.`,
    "",
    POOLS === 1
      ? `One double-elimination bracket. ${QUAL} players qualify from the winners side and ${QUAL} from the losers side: ${CUT} in total.`
      : `${POOLS} double-elimination brackets. From each bracket ${QUAL} players qualify from the winners side and ${QUAL} from the losers side: ${CUT} in total.`,
    QUALIFIER ? "This tournament is a qualifier: the final stage is a separate tournament." : `Then a single-elimination Top ${CUT} with a random draw (no seeding). The Top ${CUT} starts when the staff starts it.`,
  ].join("\n");
const rules =
  fileText("--rules-file") ??
  [
    "One deck with a 3-card sideboard. The sideboard can only contain cards that are not in the deck.",
    "Game 1 is played with the submitted deck; before games 2 and 3 you may swap sideboard cards in, one for one.",
    "All matches best of 3. Check-in is required; a player who does not open the match room within 15 minutes loses by no-show.",
    "Both players report the result in the match room, with screenshots.",
  ].join("\n");
if (desc.length > 4000 || rules.length > 4000) throw new Error("descrizione o regole troppo lunghe");
const H = players.length;
const keepHumans = stage === "qualifiers" || stage === "half" || stage === "final";

// il corpo che chiude una partita fra bot a caso (m è la riga della partita)
const closeMatch = `need := public.tm_need(tid, m.round);
      aw := random() < 0.5;
      lo := floor(random() * need)::int;
      update public.tournament_matches set winner = case when aw then m.player_a else m.player_b end, status = 'confirmed', reported_by = null,
        score_a = case when aw then need else lo end, score_b = case when aw then lo else need end,
        seen_a = coalesce(seen_a, now()), seen_b = coalesce(seen_b, now())
       where id = m.id;
      perform public.tm_propagate(m.id);
      n := n + 1;`;
const readyMatches = `select * from public.tournament_matches
              where tournament_id = tid and stage in ('upper', 'lower') and status = 'pending'
                and player_a is not null and player_b is not null and ready_at is not null
                ${keepHumans ? "and not (player_a = any(humans)) and not (player_b = any(humans))" : ""}
              order by round, position`;

const playAll = `  -- partite fra bot, ondata dopo ondata (qualifiers: restano quelle dei giocatori veri e una contestata nei perdenti)
  loop
    n := 0;
    for m in ${readyMatches} loop
      ${
        stage === "qualifiers"
          ? `if not disputed and m.stage = 'lower' then
        update public.tournament_matches set status = 'disputed', score_a = 2, score_b = 1, reported_by = m.player_a, reported_at = now(),
          note = '2-1 vs 1-2', seen_a = now(), seen_b = now() where id = m.id;
        disputed := true;
        continue;
      end if;`
          : ""
      }
      ${closeMatch}
    end loop;
    exit when n = 0;
  end loop;`;

const playHalf = `  -- tre ondate intere (le partite pronte all'inizio di ogni ondata), poi della quarta una partita su due
  for wave in 1..4 loop
    n := 0;
    for m in ${readyMatches} loop
      continue when wave = 4 and m.position % 2 = 1;
      ${closeMatch}
    end loop;
  end loop;

  -- la coda dello staff: una partita contestata, un referto che l'avversario non conferma, una partita senza nessuno dei due
  select id into mid from public.tournament_matches
   where tournament_id = tid and stage = 'lower' and status = 'pending' and player_a is not null and player_b is not null and ready_at is not null
   order by round, position limit 1;
  if mid is null then raise exception 'Nessuna partita dei perdenti da lasciare contestata'; end if;
  update public.tournament_matches set status = 'disputed', score_a = 2, score_b = 1, reported_by = player_a, reported_at = now() - interval '6 minutes',
    note = '2-1 vs 1-2', seen_a = now() - interval '50 minutes', seen_b = now() - interval '49 minutes', ready_at = now() - interval '52 minutes' where id = mid;
  special := special || mid;
  select id into mid from public.tournament_matches
   where tournament_id = tid and stage = 'lower' and status = 'pending' and player_a is not null and player_b is not null and ready_at is not null
   order by round, position limit 1;
  if mid is not null then
    update public.tournament_matches set status = 'reported', score_a = 2, score_b = 0, reported_by = player_a, reported_at = now() - interval '12 minutes',
      seen_a = now() - interval '45 minutes', seen_b = now() - interval '44 minutes', ready_at = now() - interval '47 minutes' where id = mid;
    special := special || mid;
  end if;
  select id into mid from public.tournament_matches
   where tournament_id = tid and stage = 'upper' and status = 'pending' and player_a is not null and player_b is not null and ready_at is not null
   order by round desc, position limit 1;
  if mid is not null then
    update public.tournament_matches set seen_a = null, seen_b = null, ready_at = now() - interval '25 minutes' where id = mid;
    special := special || mid;
  end if;

  -- le altre partite aperte fra bot restano da giocare ma senza orologio (vedi in testa al file)
  update public.tournament_matches set ready_at = null, seen_a = null, seen_b = null
   where tournament_id = tid and status = 'pending' and player_a is not null and player_b is not null and not (id = any(special))
     ${keepHumans ? "and not (player_a = any(humans)) and not (player_b = any(humans))" : ""};
  -- gli avvisi "la tua partita è pronta" dei bot non servono a nessuno
  delete from public.notifications x using public.profiles p
   where p.id = x.user_id and p.username ~ '^bot-[0-9]+(-[0-9]+)?$' and x.kind = 'match_ready' and x.target like '/tournaments/' || ${lit(slug)} || '/match/%';`;

const STEP = LEFT ? Math.max(1, Math.floor((QUAL * POOLS) / LEFT)) : 0;
const cleanup = `  -- le partite rimaste aperte fra bot restano da giocare ma senza orologio (vedi in testa al file)
  update public.tournament_matches set ready_at = null, seen_a = null, seen_b = null
   where tournament_id = tid and status = 'pending' and player_a is not null and player_b is not null
     ${keepHumans ? "and not (player_a = any(humans)) and not (player_b = any(humans))" : ""};
  -- gli avvisi "la tua partita è pronta" dei bot non servono a nessuno
  delete from public.notifications x using public.profiles p
   where p.id = x.user_id and p.username ~ '^bot-[0-9]+(-[0-9]+)?$' and x.kind = 'match_ready' and x.target like '/tournaments/' || ${lit(slug)} || '/match/%';`;
const playFinal = `  -- tutte le ondate; dell'ultimo turno dei perdenti restano da giocare ${LEFT} partite
  select max(round) into last_round from public.tournament_matches where tournament_id = tid and stage = 'lower';
  loop
    n := 0;
    for m in ${readyMatches} loop
      ${STEP ? `continue when m.stage = 'lower' and m.round = last_round and m.position % ${STEP} = ${STEP - 1};` : ""}
      ${closeMatch}
    end loop;
    exit when n = 0;
  end loop;

${cleanup}`;

const sql = `-- Torneo di prova a doppia eliminazione (${stage}), generato da scripts/demo-de-sql.mjs il ${new Date().toISOString()}
-- Organizzatore ${org}${H ? `, giocatori veri ${players.join(", ")}` : ""}${judges.length ? `, arbitri ${judges.join(", ")}` : ""}, ${N} iscritti${WAIT ? ` più ${WAIT} in lista d'attesa` : ""}, ${POOLS} tabellon${POOLS === 1 ? "e" : "i"}, ${QUAL} + ${QUAL} qualificati${POOLS === 1 ? "" : " per tabellone"}${QUALIFIER ? ", qualificazione senza fase finale" : ""}.
-- Incollare tutto nell'editor SQL di Supabase e premere Run.
do $demo$
declare
  org uuid; tid uuid; ids uuid[]; m record; n int; need int; aw boolean; lo int; disputed boolean := false;
  humans uuid[] := '{}'; u uuid; nm text; wave int; mid uuid; special uuid[] := '{}'; last_round int;
begin
  if to_regproc('public.tm_de_create') is null then raise exception 'Prima la migrazione (blocco 10/11/2026: DOPPIA ELIMINAZIONE)'; end if;
${QUALIFIER ? `  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'tournaments' and column_name = 'de_qualifier') then
    raise exception 'Prima la migrazione (blocco 11/11/2026: QUALIFICAZIONE SENZA FASE FINALE)';
  end if;
` : ""}  select id into org from public.profiles where lower(username) = lower(${lit(org)});
  if org is null then raise exception 'Nessun profilo con nome utente ${org.replace(/'/g, "")}'; end if;
  foreach nm in array array[${players.map(lit).join(", ")}]::text[] loop
    select id into u from public.profiles where lower(username) = lower(nm);
    if u is null then raise exception 'Nessun profilo con nome utente %', nm; end if;
    humans := humans || u;
  end loop;

  -- bot mancanti (stesse email di seed-bots.mjs)
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, phone_change_token,
    email_change_token_current, reauthentication_token, is_sso_user, is_anonymous)
  select gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bot' || i || '@${BOT_DOMAIN}', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('user_name', 'bot-' || i, 'full_name', 'Bot ' || i), now(), now(),
    '', '', '', '', '', '', '', '', false, false
    from generate_series(1, ${ALL - H + 20}) i
   where not exists (select 1 from auth.users x where x.email = 'bot' || i || '@${BOT_DOMAIN}');

  select humans || array_agg(id order by nr) into ids from (
    select u2.id, (substring(u2.email from '^bot([0-9]+)@'))::int as nr
      from auth.users u2 join public.profiles p on p.id = u2.id
     where u2.email like 'bot%@${BOT_DOMAIN}' and p.username ~ '^bot-[0-9]+(-[0-9]+)?$'
     order by 2 limit ${ALL - H}) b;
  if coalesce(array_length(ids, 1), 0) <> ${ALL} then raise exception 'Bot insufficienti: % iscritti su ${ALL}', coalesce(array_length(ids, 1), 0); end if;

  insert into public.tournaments (slug, organizer, name, cover_url, description, rules, lang, starts_at, size, deck_mode, best_of, checkin, hidden_decklists,
    no_show_minutes, top_cut, top_cut_hold, deck_ban, visibility, listed, format, de_pools, de_qualify, sideboard${QUALIFIER ? ", de_qualifier" : ""})
  values (${lit(slug)}, org, ${lit(title)}, '/media/keyart-red-wide.webp', ${lit(desc)}, ${lit(rules)}, ${lit(lang)}, ${starts ? `${lit(starts.toISOString())}::timestamptz` : "now()"}, ${SIZE}, 'free', 3, true, false,
    15, null, ${QUALIFIER ? "false" : "true"}, false, 'private', false, 'double_elim', ${POOLS}, ${QUAL}, ${SIDE}${QUALIFIER ? ", true" : ""})
  returning id into tid;

  -- iscrizioni: ${OPEN ? `prima del check-in, le ultime ${NO_DECKS} senza mazzo, ${WAIT} in lista d'attesa, in ordine di arrivo` : "tutti con il mazzo e il check-in fatto"}
  insert into public.tournament_players (tournament_id, user_id, status, decks_submitted, checked_in_at, created_at)
  select tid, ids[g], case when g <= ${N} then 'registered' else 'waitlist' end, ${OPEN ? `g <= ${N - NO_DECKS} or g > ${N}` : "true"},
         ${OPEN ? "null, now() - interval '5 days' + g * interval '9 minutes'" : "now(), now()"}
    from generate_series(1, ${ALL}) g;
  insert into public.tournament_decks (tournament_id, user_id, codes, sideboard)
  select tid, ids[g], jsonb_build_array(d.code), d.side::jsonb
    from generate_series(1, ${ALL}) g
    join (values
${decks.map((d) => `    (${d.k}, ${lit(d.code)}, ${lit(d.side)})`).join(",\n")}
    ) as d(k, code, side) on d.k = (g - 1) % ${DECK_POOL}
   where ${OPEN ? `g <= ${N - NO_DECKS} or g > ${N}` : "true"};

  -- arbitri (--judges): gestiscono il torneo come l'organizzatore
  foreach nm in array array[${judges.map(lit).join(", ")}]::text[] loop
    select id into u from public.profiles where lower(username) = lower(nm);
    if u is null then raise exception 'Nessun profilo con nome utente %', nm; end if;
    insert into public.tournament_judges (tournament_id, user_id, added_by) values (tid, u, org);
  end loop;

${
  OPEN
    ? "  -- stato iniziale: il torneo resta aperto, nessun check-in"
    : `  -- avvio come start_tournament: i giocatori veri in testa, i bot in ordine casuale
  perform public.tm_start(tid, humans || (select array_agg(x order by random()) from unnest(ids[${H + 1}:]) x));
  perform public.tm_after_start(tid);

${stage === "half" ? playHalf : stage === "final" ? playFinal : playAll}`
}
end $demo$;
${NO_SELECT ? "" : `
select t.tag, t.name,
       'https://originsmeta.com/${lang}/tournaments/' || t.slug as scheda,
       'https://originsmeta.com/${lang}/tournaments/' || t.slug || '/manage' as gestione,
       'https://originsmeta.com/t/' || t.tag || '/' || s.invite_code as invito,
       (select count(*) from public.tournament_matches x where x.tournament_id = t.id) as partite,
       (select count(*) from public.tournament_matches x where x.tournament_id = t.id and x.status in ('confirmed', 'bye')) as chiuse,
       (select count(*) from public.tournament_matches x where x.tournament_id = t.id and x.status in ('pending', 'reported', 'disputed') and x.player_a is not null and x.player_b is not null) as aperte,
       (select count(*) from public.tournament_matches x where x.tournament_id = t.id and x.status = 'disputed') as contestate,
       (select count(*) from public.tournament_players x where x.tournament_id = t.id) as iscritti
  from public.tournaments t left join public.tournament_secrets s on s.tournament_id = t.id
 where t.slug = ${lit(slug)};
`}`;
writeFileSync(out, sql);
console.log(`Scritto ${out}: torneo ${slug}, ${N} iscritti${WAIT ? ` più ${WAIT} in lista d'attesa` : ""}, fase ${stage}, ${(sql.length / 1024).toFixed(0)} KB`);
console.log(`SLUG=${slug}`);
