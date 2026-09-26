/**
 * Test della casella messaggi (`messages.ts`) con il runner integrato di Node:
 * `node --test src/lib/community/messages.test.ts`. Come per gli altri test, l'import ha l'estensione `.ts`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  MESSAGE_MAX,
  SUBJECT_MAX,
  authorKind,
  badgeCount,
  badgeText,
  checkMessage,
  checkSubject,
  cleanUsername,
  excerpt,
  feedbackSubject,
  fillInbox,
  inboxErrorCode,
  lastSeen,
  pageNumber,
  parseInboxStatus,
  plainMessage,
  plainSubject,
  staffFilter,
  staffThreadPath,
  textLength,
  userThreadPath,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come negli altri test.
  // @ts-expect-error TS5097
} from "./messages.ts";

describe("testo semplice", () => {
  test("a capo uniformi, niente controlli né caratteri di direzione, niente tag, una riga vuota al massimo", () => {
    assert.equal(plainMessage("  ciao\r\nstaff\r\r\n\n\n\nfine  "), "ciao\nstaff\n\nfine");
    assert.equal(plainMessage("a\u0000b\u0007c\u202ed\u2066e"), "abcde");
    assert.equal(plainMessage("<b>grassetto</b> e <script src=x>alert(1)</script>"), "grassetto e alert(1)");
    assert.equal(plainMessage("riga   \nsotto"), "riga\nsotto");
    // "<3" e "a < b" non sono tag: restano
    assert.equal(plainMessage("ti voglio bene <3 e a < b"), "ti voglio bene <3 e a < b");
    // le tabulazioni in mezzo restano (codici, elenchi)
    assert.equal(plainMessage("a\tb"), "a\tb");
  });
  test("oggetto su una riga sola", () => {
    assert.equal(plainSubject("  Problema\n con   il   deck builder \t"), "Problema con il deck builder");
  });
  test("textLength conta le emoji una volta", () => {
    assert.equal(textLength("🃏🃏"), 2);
    assert.equal(textLength("ciao"), 4);
  });
});

describe("controlli di messaggio e oggetto", () => {
  test("messaggio vuoto, troppo lungo, giusto", () => {
    assert.deepEqual(checkMessage("   \n  "), { ok: false, error: "empty" });
    assert.deepEqual(checkMessage(undefined), { ok: false, error: "empty" });
    assert.deepEqual(checkMessage(42), { ok: false, error: "empty" });
    assert.deepEqual(checkMessage("x".repeat(MESSAGE_MAX + 1)), { ok: false, error: "tooLong" });
    assert.deepEqual(checkMessage("x".repeat(MESSAGE_MAX)), { ok: true, body: "x".repeat(MESSAGE_MAX) });
    // il limite è in caratteri visibili, come char_length del database: 4000 emoji passano
    assert.equal(checkMessage("🃏".repeat(MESSAGE_MAX)).ok, true);
    assert.deepEqual(checkMessage(" Ciao!\n\n\n\nGrazie "), { ok: true, body: "Ciao!\n\nGrazie" });
  });
  test("oggetto vuoto, troppo lungo, giusto", () => {
    assert.deepEqual(checkSubject(""), { ok: false, error: "emptySubject" });
    assert.deepEqual(checkSubject("<i></i>"), { ok: false, error: "emptySubject" });
    assert.deepEqual(checkSubject("y".repeat(SUBJECT_MAX + 1)), { ok: false, error: "subjectTooLong" });
    assert.deepEqual(checkSubject(" Un mazzo\nda rivedere "), { ok: true, subject: "Un mazzo da rivedere" });
  });
  test("nome utente per lo staff: senza @, solo lettere, cifre e trattini", () => {
    assert.equal(cleanUsername("@coachcrono"), "coachcrono");
    assert.equal(cleanUsername("  CoachCrono "), "CoachCrono");
    assert.equal(cleanUsername("luigi-davdas-2"), "luigi-davdas-2");
    assert.equal(cleanUsername("con spazio"), null);
    assert.equal(cleanUsername("-trattino"), null);
    assert.equal(cleanUsername("a".repeat(61)), null);
    assert.equal(cleanUsername(""), null);
    assert.equal(cleanUsername(null), null);
    assert.equal(cleanUsername("x' or 1=1"), null);
  });
});

describe("feedback e avvisi", () => {
  test("oggetto della conversazione nata da un feedback", () => {
    assert.equal(feedbackSubject("Il tuo feedback", "/it/cards/merlin"), "Il tuo feedback · /it/cards/merlin");
    assert.equal(feedbackSubject("Your feedback", null), "Your feedback");
    assert.equal(feedbackSubject("  ", undefined), "Feedback");
    const long = feedbackSubject("Feedback", `/${"a".repeat(200)}`);
    assert.equal(textLength(long), SUBJECT_MAX);
    assert.ok(long.endsWith("…"));
  });
  test("estratto per Discord: una riga, taglio sulla parola, mai oltre il massimo", () => {
    assert.equal(excerpt("breve\n\ntesto"), "breve testo");
    const words = Array.from({ length: 100 }, (_, i) => `parola${i}`).join(" ");
    const cut = excerpt(words, 50);
    assert.ok(textLength(cut) <= 50, cut);
    assert.ok(cut.endsWith("…"));
    assert.ok(!cut.includes("parola9 …"));
    // una parola lunghissima si taglia di netto
    assert.equal(textLength(excerpt("x".repeat(500), 40)), 40);
  });
});

describe("errori delle RPC", () => {
  test("i codici del database diventano codici dell'interfaccia", () => {
    assert.equal(inboxErrorCode({ message: "too_many_messages", code: "P0001" }), "tooMany");
    assert.equal(inboxErrorCode({ message: "too_many_conversations", code: "P0001" }), "tooManyThreads");
    assert.equal(inboxErrorCode({ message: "user_not_found", code: "P0001" }), "userNotFound");
    assert.equal(inboxErrorCode({ message: "self", code: "P0001" }), "self");
    assert.equal(inboxErrorCode({ message: "not_found", code: "P0001" }), "notFound");
    assert.equal(inboxErrorCode({ message: "forbidden", code: "P0001" }), "notFound", "chi non può vedere non sa che esiste");
    assert.equal(inboxErrorCode({ message: "empty_message", code: "P0001" }), "empty");
    assert.equal(inboxErrorCode({ message: "subject_too_long", code: "P0001" }), "subjectTooLong");
    assert.equal(inboxErrorCode({ message: "not_logged_in", code: "P0001" }), "notLoggedIn");
  });
  test("migrazione non ancora applicata: funzione o tabella che mancano", () => {
    assert.equal(inboxErrorCode({ message: "Could not find the function public.inbox_status", code: "PGRST202" }), "unavailable");
    assert.equal(inboxErrorCode({ message: 'relation "public.conversations" does not exist', code: "42P01" }), "unavailable");
    assert.equal(inboxErrorCode({ message: "x", code: "PGRST205" }), "unavailable");
  });
  test("tutto il resto è un errore generico, anche i nomi ereditati", () => {
    assert.equal(inboxErrorCode({ message: "duplicate key", code: "23505" }), "db");
    assert.equal(inboxErrorCode({ message: "toString" }), "db");
    assert.equal(inboxErrorCode(null), "db");
  });
});

describe("numero dei non letti", () => {
  test("parseInboxStatus legge la RPC e la rotta, scarta i valori strani", () => {
    assert.deepEqual(parseInboxStatus({ unread: 2, staff: true, staff_unread: 5 }), { unread: 2, staff: true, staffUnread: 5 });
    assert.deepEqual(parseInboxStatus({ unread: 1, staff: true, staffUnread: 3 }), { unread: 1, staff: true, staffUnread: 3 });
    assert.deepEqual(parseInboxStatus({ unread: "4", staff: "true", staff_unread: 9 }), { unread: 4, staff: false, staffUnread: 0 }, "solo il vero booleano fa lo staff");
    assert.deepEqual(parseInboxStatus({ unread: -3, staff: false }), { unread: 0, staff: false, staffUnread: 0 });
    assert.deepEqual(parseInboxStatus({ unread: Infinity }), { unread: 0, staff: false, staffUnread: 0 });
    assert.equal(parseInboxStatus(null), null);
    assert.equal(parseInboxStatus([1, 2]), null);
    assert.equal(parseInboxStatus("x"), null);
  });
  test("badgeCount somma la casella dello staff solo per lo staff", () => {
    assert.equal(badgeCount({ unread: 2, staff: false, staffUnread: 7 }), 2);
    assert.equal(badgeCount({ unread: 2, staff: true, staffUnread: 7 }), 9);
    assert.equal(badgeCount(null), 0);
  });
  test("badgeText: niente sotto 1, 9+ oltre 9", () => {
    assert.equal(badgeText(0), "");
    assert.equal(badgeText(-1), "");
    assert.equal(badgeText(NaN), "");
    assert.equal(badgeText(1), "1");
    assert.equal(badgeText(9), "9");
    assert.equal(badgeText(10), "9+");
  });
});

describe("area staff e conversazioni", () => {
  test("filtro e pagina dai parametri dell'indirizzo", () => {
    assert.equal(staffFilter("closed"), "closed");
    assert.equal(staffFilter(["unread", "all"]), "unread");
    assert.equal(staffFilter("toString"), "open");
    assert.equal(staffFilter(undefined), "open");
    assert.equal(pageNumber("3"), 3);
    assert.equal(pageNumber("0"), 1);
    assert.equal(pageNumber("-2"), 1);
    assert.equal(pageNumber("99999999"), 1);
    assert.equal(pageNumber(["2"]), 2);
    assert.equal(pageNumber(undefined), 1);
  });
  test("chi ha scritto, visto dall'utente e dallo staff", () => {
    const me = "u1";
    assert.equal(authorKind({ from_staff: false, author_id: "u1" }, me, "user"), "you");
    assert.equal(authorKind({ from_staff: true, author_id: "s1" }, me, "user"), "staff");
    assert.equal(authorKind({ from_staff: true, author_id: null }, me, "user"), "staff", "account dello staff cancellato");
    assert.equal(authorKind({ from_staff: false, author_id: "u9" }, "s1", "staff"), "user");
    assert.equal(authorKind({ from_staff: true, author_id: "s1" }, "s1", "staff"), "you");
    assert.equal(authorKind({ from_staff: true, author_id: "s2" }, "s1", "staff"), "staff");
  });
  test("lastSeen: l'ultimo messaggio come istante, anche con fusi e microsecondi diversi", () => {
    assert.equal(lastSeen([]), null);
    assert.equal(
      // 12:10 a Roma (+02:00) sono le 10:10 UTC: viene prima delle 10:15 UTC anche se la stringa è "più grande"
      lastSeen([{ created_at: "2026-09-26T10:00:00.123456+00:00" }, { created_at: "2026-09-26T12:10:00+02:00" }, { created_at: "2026-09-26T10:15:00Z" }]),
      "2026-09-26T10:15:00Z",
    );
    assert.equal(lastSeen([{ created_at: "non è una data" }]), null);
  });
  test("indirizzi e segnaposto", () => {
    assert.equal(userThreadPath("it", "abc"), "/it/account/messages/abc");
    assert.equal(staffThreadPath("es", "abc"), "/es/account/staff/messages/abc");
    assert.equal(fillInbox("{n} da leggere, {x}", { n: 3 }), "3 da leggere, {x}");
  });
});
