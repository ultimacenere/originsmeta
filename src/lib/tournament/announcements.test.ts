/**
 * Test della bacheca degli annunci dei tornei e della pagina dell'Harvest Bowl (19/11/2026):
 * `node --test src/lib/tournament/announcements.test.ts`.
 * - announcements.ts: controllo dei campi, codici d'errore, ordine, righe lette dal database;
 * - il blocco "19/11/2026: ANNUNCI DEI TORNEI" di supabase/schema.sql: stessi limiti del codice, nessuna scrittura diretta,
 *   letture per colonna senza `recipients`, funzioni chiuse ad anon, tipo di avviso nuovo;
 * - etichette della bacheca e della pagina dell'evento nelle otto lingue, con gli stessi segnaposto;
 * - harvestBowl.ts: tornei dell'evento, tappe, ore fisse; la voce del calendario porta alla pagina.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { schemaProblems, sqlStatements } from "../../../scripts/schema-guard.mjs";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { ANNOUNCEMENT_BODY_MAX, ANNOUNCEMENT_ERRORS, ANNOUNCEMENT_HOURLY_MAX, ANNOUNCEMENT_LINK_MAX, ANNOUNCEMENT_TITLE_MAX, ANNOUNCEMENT_TITLE_MIN, ANNOUNCEMENT_TOURNAMENTS_MAX, ANNOUNCEMENT_COLUMNS, announcementErrorCode, cleanText, parseAnnouncementInput, sortAnnouncements, toAnnouncement } from "./announcements.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { announcementLabels } from "./announcementLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { harvestBowlLabels } from "../harvestBowlLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { HARVEST_BOWL, fixedTimes, isHarvestTournament, stageOf } from "../harvestBowl.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { events } from "../data/events.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { NOTIFICATION_KINDS, notificationHref, isSafeTarget, tournamentSlugOf } from "../community/notifications.ts";

const LOCALES = ["en", "it", "es", "fr", "pt", "de", "ru", "zh-cn"] as const;
const TID = "12e859e6-1c0f-45b2-baba-6b259238c176";
const TID2 = "aad1c762-1b0e-45a6-ba21-027f4f0b185f";

describe("annunci: controllo dei campi", () => {
  test("pulisce il testo come ta_clean", () => {
    assert.equal(cleanText("  \r\n**Ciao**\r\nriga  \n"), "**Ciao**\nriga");
    assert.equal(cleanText(null), "");
  });
  test("accetta un annuncio valido, toglie i doppioni dei tornei", () => {
    const r = parseAnnouncementInput({ title: " Check-in at 9:30 ", body: "Hi", link: "https://pitch.com/v/x", pinned: "on", tournamentIds: [TID, TID.toUpperCase(), TID2, "nope"] });
    assert.deepEqual(r, { title: "Check-in at 9:30", body: "Hi", link: "https://pitch.com/v/x", pinned: true, tournamentIds: [TID, TID2] });
  });
  test("rifiuta titoli corti o lunghi, testi lunghi, link non https, nessun torneo o troppi", () => {
    const ok = { title: "Valid title", body: "", link: "", tournamentIds: [TID] };
    assert.ok(parseAnnouncementInput(ok));
    assert.equal(parseAnnouncementInput({ ...ok, title: "Hi" }), null);
    assert.equal(parseAnnouncementInput({ ...ok, title: "x".repeat(ANNOUNCEMENT_TITLE_MAX + 1) }), null);
    assert.equal(parseAnnouncementInput({ ...ok, body: "x".repeat(ANNOUNCEMENT_BODY_MAX + 1) }), null);
    assert.equal(parseAnnouncementInput({ ...ok, link: "http://example.com" }), null);
    assert.equal(parseAnnouncementInput({ ...ok, link: "https://example.com/a b" }), null);
    assert.equal(parseAnnouncementInput({ ...ok, link: `https://e.com/${"x".repeat(ANNOUNCEMENT_LINK_MAX)}` }), null);
    assert.equal(parseAnnouncementInput({ ...ok, tournamentIds: [] }), null);
    const many = Array.from({ length: ANNOUNCEMENT_TOURNAMENTS_MAX + 1 }, (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`);
    assert.equal(parseAnnouncementInput({ ...ok, tournamentIds: many }), null);
    // un link vuoto è "nessun link"
    assert.equal(parseAnnouncementInput({ ...ok, link: "   " })?.link, null);
  });
  test("codici d'errore dal database", () => {
    assert.equal(announcementErrorCode({ message: "forbidden" }), "forbidden");
    assert.equal(announcementErrorCode({ message: "too_many" }), "too_many");
    assert.equal(announcementErrorCode({ code: "PGRST202", message: "Could not find the function public.tournament_announcement_post" }), "unavailable");
    assert.equal(announcementErrorCode({ code: "42P01", message: 'relation "public.tournament_announcements" does not exist' }), "unavailable");
    assert.equal(announcementErrorCode({ message: "boom" }), "generic");
    assert.equal(announcementErrorCode(null), "generic");
  });
  test("in evidenza prima, poi dal più recente", () => {
    const list = sortAnnouncements([
      { id: 1, pinned: false, created_at: "2026-11-20T10:00:00Z" },
      { id: 2, pinned: true, created_at: "2026-11-19T10:00:00Z" },
      { id: 3, pinned: false, created_at: "2026-11-21T10:00:00Z" },
    ]);
    assert.deepEqual(list.map((a) => a.id), [2, 3, 1]);
  });
  test("righe lette: le strane si scartano, un link non https sparisce", () => {
    assert.equal(toAnnouncement({ id: "x", title: "t", created_at: "2026" }), null);
    const a = toAnnouncement({ id: 5, tournament_ids: [TID], title: "Hello", body: null, link_url: "javascript:alert(1)", pinned: true, created_at: "2026-11-19T00:00:00Z" });
    assert.equal(a?.link_url, null);
    assert.equal(a?.body, "");
    assert.equal(a?.pinned, true);
  });
});

describe("blocco ANNUNCI DEI TORNEI di supabase/schema.sql (19/11/2026)", () => {
  const sql = readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const TITLE = "-- ===== 19/11/2026: ANNUNCI DEI TORNEI =====";
  const start = sql.indexOf(TITLE);
  const end = sql.indexOf("\n-- ===== ", start + 10);
  const block = sql.slice(start, end < 0 ? undefined : end);
  const statements = sqlStatements(block);

  test("c'è, e la prova a secco legge lo stesso titolo", () => {
    assert.ok(start > 0);
    const dry = readFileSync(new URL("../../../scripts/announcements-dry-run.mjs", import.meta.url), "utf8");
    assert.ok(dry.includes(`const MARKER = "${TITLE}";`));
    assert.deepEqual(schemaProblems(sql), []);
  });
  test("stessi limiti del codice", () => {
    assert.match(block, new RegExp(`char_length\\(title\\) between ${ANNOUNCEMENT_TITLE_MIN} and ${ANNOUNCEMENT_TITLE_MAX}`));
    assert.match(block, new RegExp(`char_length\\(body\\) <= ${ANNOUNCEMENT_BODY_MAX}`));
    assert.match(block, new RegExp(`char_length\\(link_url\\) <= ${ANNOUNCEMENT_LINK_MAX}`));
    assert.match(block, new RegExp(`cardinality\\(tournament_ids\\) between 1 and ${ANNOUNCEMENT_TOURNAMENTS_MAX}`));
    assert.match(block, new RegExp(`interval '1 hour'\\) >= ${ANNOUNCEMENT_HOURLY_MAX}`));
    for (const e of ANNOUNCEMENT_ERRORS.filter((x) => x !== "unavailable" && x !== "generic")) assert.ok(block.includes(`raise exception '${e}'`), e);
  });
  test("nessuna scrittura diretta, lettura per colonna senza recipients, niente grant sui profili", () => {
    for (const op of ["insert", "update", "delete"]) assert.match(block, new RegExp(`as restrictive for ${op} to anon, authenticated`));
    const grants = statements.filter((s) => /^grant select/.test(s) && s.includes("tournament_announcements"));
    assert.equal(grants.length, 1);
    assert.ok(!grants[0].includes("recipients"));
    assert.equal(grants[0], `grant select (${ANNOUNCEMENT_COLUMNS}) on public.tournament_announcements to anon, authenticated`);
    for (const s of statements) assert.ok(!/^(grant|revoke)\b/.test(s) || !/\bpublic\.profiles\b/.test(s), s);
  });
  test("le tre funzioni sono security definer, chiuse ad anon, aperte agli iscritti; le interne chiuse a tutti", () => {
    for (const fn of ["tournament_announcement_post", "tournament_announcement_edit", "tournament_announcement_delete"]) {
      const def = statements.find((s) => s.startsWith(`create or replace function public.${fn}(`)) ?? "";
      assert.match(def, /security definer set search_path = public, pg_temp/, fn);
      assert.ok(statements.some((s) => s.startsWith(`revoke all on function public.${fn}(`) && s.endsWith("from public, anon")), fn);
      assert.ok(statements.some((s) => s.startsWith(`grant execute on function public.${fn}(`) && s.endsWith("to authenticated")), fn);
    }
    for (const fn of ["ta_clean", "ta_staff_of_all"]) assert.ok(statements.some((s) => s.startsWith(`revoke all on function public.${fn}(`) && s.endsWith("from public, anon, authenticated")), fn);
  });
  test("l'avviso: tipo nuovo nei vincoli, una volta per persona, iscritti e lista d'attesa", () => {
    assert.ok((NOTIFICATION_KINDS as readonly string[]).includes("tournament_announcement"));
    assert.match(block, /'tournament_announcement'\)\) not valid;/);
    assert.match(block, /select distinct on \(p\.user_id\)/);
    assert.match(block, /p\.status in \('registered', 'waitlist'\)/);
    assert.match(block, /on conflict \(user_id, kind, event_key\) do nothing/);
  });
  test("l'avviso porta alla bacheca della scheda del torneo", () => {
    assert.ok(isSafeTarget("/tournaments/harvest-bowl-qualifier-1"));
    assert.equal(tournamentSlugOf("/tournaments/harvest-bowl-qualifier-1"), "harvest-bowl-qualifier-1");
    assert.equal(notificationHref("it", "/tournaments/harvest-bowl-qualifier-1", "tournament_announcement"), "/it/tournaments/harvest-bowl-qualifier-1#announcements");
    assert.equal(isSafeTarget("/tournaments/../admin"), false);
  });
});

describe("etichette nelle otto lingue", () => {
  const keys = (o: unknown, p = ""): string[] =>
    o && typeof o === "object" && !Array.isArray(o) ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => keys(v, `${p}${k}.`)) : [p.slice(0, -1)];
  const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const [name, all] of [
    ["bacheca", announcementLabels],
    ["pagina dell'evento", harvestBowlLabels],
  ] as const) {
    test(`${name}: stesse chiavi e stessi segnaposto di en`, () => {
      const en = all.en as unknown as Record<string, unknown>;
      for (const l of LOCALES) {
        const lab = all[l] as unknown as Record<string, unknown>;
        assert.deepEqual(keys(lab).sort(), keys(en).sort(), l);
        const flat = (o: unknown): string[] => (typeof o === "string" ? [o] : Array.isArray(o) ? o.flatMap(flat) : o && typeof o === "object" ? Object.values(o).flatMap(flat) : []);
        const a = flat(en);
        const b = flat(lab);
        assert.equal(b.length, a.length, l);
        a.forEach((s, i) => assert.deepEqual(holes(b[i]), holes(s), `${l}: ${b[i]}`));
      }
    });
  }
  test("francese: spazio insecabile prima di : ; ? !", () => {
    const flat = (o: unknown): string[] => (typeof o === "string" ? [o] : Array.isArray(o) ? o.flatMap(flat) : o && typeof o === "object" ? Object.values(o).flatMap(flat) : []);
    for (const s of [...flat(announcementLabels.fr), ...flat(harvestBowlLabels.fr)]) assert.ok(!/ [:;?!]/.test(s.replace(/https?:\/\/\S+/g, "")), s);
  });
});

describe("Harvest Bowl: evento, tappe, calendario", () => {
  test("i tornei dell'evento: prefisso e organizzatore", () => {
    assert.ok(isHarvestTournament({ slug: "harvest-bowl-qualifier-1", profile: { username: "apixtwts" } }));
    assert.ok(isHarvestTournament({ slug: "harvest-bowl-finals-8a2c", profile: { username: "apixtwts" } }));
    assert.equal(isHarvestTournament({ slug: "harvest-bowl-practice", profile: { username: "someone" } }), false);
    assert.equal(isHarvestTournament({ slug: "my-harvest-bowl", profile: { username: "apixtwts" } }), false);
  });
  test("tappe e ore fisse del post Steam", () => {
    assert.equal(stageOf("harvest-bowl-qualifier-1"), "q1");
    assert.equal(stageOf("harvest-bowl-qualifier-2"), "q2");
    assert.equal(stageOf("harvest-bowl-finals-8a2c"), "final");
    assert.deepEqual(fixedTimes(HARVEST_BOWL.stages[0].startsAt), { utc: "15:00", et: "10:00", cet: "16:00" });
    assert.deepEqual(fixedTimes(HARVEST_BOWL.stages[1].startsAt), { utc: "21:00", et: "16:00", cet: "22:00" });
    assert.deepEqual(fixedTimes(HARVEST_BOWL.stages[2].startsAt), { utc: "15:00", et: "10:00", cet: "16:00" });
  });
  test("la voce del calendario porta alla pagina dell'evento, con la fonte e l'inizio della Qualificazione 1", () => {
    const e = events.find((x) => x.slug === "harvest-bowl");
    assert.ok(e);
    assert.equal(e.page?.path, HARVEST_BOWL.path);
    assert.equal(e.source, HARVEST_BOWL.steamPost);
    assert.equal(Date.parse(e.ld?.startAt ?? ""), Date.parse(HARVEST_BOWL.stages[0].startsAt));
    for (const l of LOCALES) {
      assert.ok(e.text[l] && e.format?.[l] && e.prizes?.[l] && e.where[l] && e.page?.label[l], l);
    }
  });
});
