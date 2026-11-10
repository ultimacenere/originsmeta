// Torneo di prova a doppia eliminazione (lo stesso di demo-tournament.mjs --format double_elim) come UN file SQL da
// incollare nell'editor SQL di Supabase: serve quando si lavora da un PC senza .env.local (10/11/2026).
// Uso: node scripts/demo-de-sql.mjs --organizer <nome utente> [--players a] [--judges x,y] [--count 300] [--stage qualifiers|ready]
//        [--lang en] [--out file.sql]
// Il file fa tutto in un blocco DO (una transazione): bot mancanti, torneo privato, iscrizioni con mazzo e sideboard di 3,
// avvio, partite fra bot. In fondo una select con tag, link e codice d'invito. Se qualcosa non torna non scrive niente.
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
const N = Number(opt("--count") ?? 300);
if (!Number.isInteger(N) || N < 130 || N > 1024) throw new Error("--count fra 130 e 1024");
const stage = opt("--stage") ?? "qualifiers";
if (!["qualifiers", "ready"].includes(stage)) throw new Error("--stage qualifiers o ready");
const lang = opt("--lang") ?? "en";
const out = opt("--out") ?? `demo-de-${stage}.sql`;
const SIDE = 3;
const BOT_DOMAIN = "bots.originsmeta.local";

const woo = JSON.parse(readFileSync(new URL("../src/lib/data/woo-cards.json", import.meta.url), "utf8"));
const legendaries = woo.cards.filter((c) => c.status === "active" && c.legendary && c.type !== "token").map((c) => c.slug);
const bases = woo.cards.filter((c) => c.status === "active" && !c.legendary && c.type !== "token" && !c.tokenOnly).map((c) => c.slug);
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const omCode = (deck) => `OM1.${Buffer.from(JSON.stringify({ n: deck.name, l: deck.legendary, c: deck.cards, x: [] }), "utf8").toString("base64url")}`;
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

const decks = Array.from({ length: N }, (_, k) => {
  const pool = shuffle(bases);
  const label = k < players.length ? players[k] : `Bot ${k - players.length + 1}`;
  return { k, code: omCode({ name: label, legendary: shuffle(legendaries)[0], cards: pool.slice(0, 12) }), side: JSON.stringify(pool.slice(12, 12 + SIDE)) };
});
const slug = `torneo-di-prova-${randomBytes(2).toString("hex")}`;
const title = "Test tournament · 2 × 512 double elimination";
const desc = [
  `Test tournament for the 28–29 November event: ${N} fake players (bots), no prizes.`,
  "",
  "Two double-elimination brackets. From each bracket 32 players qualify from the winners side and 32 from the losers side: 128 in total.",
  "Then a single-elimination Top 128 with a random draw (no seeding). The Top 128 starts when the staff starts it.",
].join("\n");
const rules = [
  "One deck with a 3-card sideboard. The sideboard can only contain cards that are not in the deck.",
  "Game 1 is played with the submitted deck; before games 2 and 3 you may swap sideboard cards in, one for one.",
  "All matches best of 3. Check-in is required; a player who does not open the match room within 15 minutes loses by no-show.",
  "Both players report the result in the match room, with screenshots.",
].join("\n");
const H = players.length;

const sql = `-- Torneo di prova a doppia eliminazione (${stage}), generato da scripts/demo-de-sql.mjs il ${new Date().toISOString()}
-- Organizzatore ${org}${H ? `, giocatori veri ${players.join(", ")}` : ""}, ${N} iscritti. Incollare tutto nell'editor SQL di Supabase e premere Run.
do $demo$
declare
  org uuid; tid uuid; ids uuid[]; m record; n int; need int; aw boolean; lo int; disputed boolean := false;
  humans uuid[] := '{}'; u uuid; nm text;
begin
  if to_regproc('public.tm_de_create') is null then raise exception 'Prima la migrazione (blocco 10/11/2026: DOPPIA ELIMINAZIONE)'; end if;
  select id into org from public.profiles where lower(username) = lower(${lit(org)});
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
    from generate_series(1, ${N - H + 20}) i
   where not exists (select 1 from auth.users x where x.email = 'bot' || i || '@${BOT_DOMAIN}');

  select humans || array_agg(id order by nr) into ids from (
    select u2.id, (substring(u2.email from '^bot([0-9]+)@'))::int as nr
      from auth.users u2 join public.profiles p on p.id = u2.id
     where u2.email like 'bot%@${BOT_DOMAIN}' and p.username ~ '^bot-[0-9]+(-[0-9]+)?$'
     order by 2 limit ${N - H}) b;
  if coalesce(array_length(ids, 1), 0) <> ${N} then raise exception 'Bot insufficienti: % iscritti su ${N}', coalesce(array_length(ids, 1), 0); end if;

  insert into public.tournaments (slug, organizer, name, cover_url, description, rules, lang, starts_at, size, deck_mode, best_of, checkin, hidden_decklists,
    no_show_minutes, top_cut, top_cut_hold, deck_ban, visibility, listed, format, de_pools, de_qualify, sideboard)
  values (${lit(slug)}, org, ${lit(title)}, '/media/keyart-red-wide.webp', ${lit(desc)}, ${lit(rules)}, ${lit(lang)}, now(), 1024, 'free', 3, true, false,
    15, null, true, false, 'private', false, 'double_elim', 2, 32, ${SIDE})
  returning id into tid;

  insert into public.tournament_players (tournament_id, user_id, status, decks_submitted, checked_in_at)
  select tid, x, 'registered', true, now() from unnest(ids) x;
  insert into public.tournament_decks (tournament_id, user_id, codes, sideboard)
  select tid, ids[d.k + 1], jsonb_build_array(d.code), d.side::jsonb from (values
${decks.map((d) => `    (${d.k}, ${lit(d.code)}, ${lit(d.side)})`).join(",\n")}
  ) as d(k, code, side);

  -- arbitri (--judges): gestiscono il torneo come l'organizzatore
  foreach nm in array array[${judges.map(lit).join(", ")}]::text[] loop
    select id into u from public.profiles where lower(username) = lower(nm);
    if u is null then raise exception 'Nessun profilo con nome utente %', nm; end if;
    insert into public.tournament_judges (tournament_id, user_id, added_by) values (tid, u, org);
  end loop;

  -- avvio come start_tournament: i giocatori veri in testa, i bot in ordine casuale
  perform public.tm_start(tid, humans || (select array_agg(x order by random()) from unnest(ids[${H + 1}:]) x));
  perform public.tm_after_start(tid);

  -- partite fra bot, ondata dopo ondata (qualifiers: restano quelle dei giocatori veri e una contestata nei perdenti)
  loop
    n := 0;
    for m in select * from public.tournament_matches
              where tournament_id = tid and stage in ('upper', 'lower') and status = 'pending'
                and player_a is not null and player_b is not null and ready_at is not null
                ${stage === "qualifiers" ? "and not (player_a = any(humans)) and not (player_b = any(humans))" : ""}
              order by round, position loop
      ${stage === "qualifiers" ? `if not disputed and m.stage = 'lower' then
        update public.tournament_matches set status = 'disputed', score_a = 2, score_b = 1, reported_by = m.player_a, reported_at = now(),
          note = '2-1 vs 1-2', seen_a = now(), seen_b = now() where id = m.id;
        disputed := true;
        continue;
      end if;` : ""}
      need := public.tm_need(tid, m.round);
      aw := random() < 0.5;
      lo := floor(random() * need)::int;
      update public.tournament_matches set winner = case when aw then m.player_a else m.player_b end, status = 'confirmed', reported_by = null,
        score_a = case when aw then need else lo end, score_b = case when aw then lo else need end,
        seen_a = coalesce(seen_a, now()), seen_b = coalesce(seen_b, now())
       where id = m.id;
      perform public.tm_propagate(m.id);
      n := n + 1;
    end loop;
    exit when n = 0;
  end loop;
end $demo$;

select t.tag, t.name,
       'https://originsmeta.com/${lang}/tournaments/' || t.slug as scheda,
       'https://originsmeta.com/${lang}/tournaments/' || t.slug || '/manage' as gestione,
       'https://originsmeta.com/t/' || t.tag || '/' || s.invite_code as invito,
       (select count(*) from public.tournament_matches x where x.tournament_id = t.id) as partite,
       (select count(*) from public.tournament_matches x where x.tournament_id = t.id and x.status in ('confirmed', 'bye')) as chiuse
  from public.tournaments t left join public.tournament_secrets s on s.tournament_id = t.id
 where t.slug = ${lit(slug)};
`;
writeFileSync(out, sql);
console.log(`Scritto ${out}: torneo ${slug}, ${N} iscritti, fase ${stage}, ${(sql.length / 1024).toFixed(0)} KB`);
