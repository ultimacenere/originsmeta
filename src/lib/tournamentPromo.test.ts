/**
 * Test del popup di un torneo (05/11/2026): `node --test src/lib/tournamentPromo.test.ts`.
 * Il popup dura fino alla chiusura del check-in, non si apre nelle pagine del torneo né in accesso, account, strumenti e
 * moduli, si fida del calendario del sito, scrive cifre e date nella lingua e ha gli stessi testi in tutte le lingue.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  PROMO_DELAY_MS,
  PROMO_SEEN_KEY,
  TOURNAMENT_PROMO,
  isPromoTournamentPath,
  pathWithoutLocale,
  promoActive,
  promoDate,
  promoListed,
  promoMoney,
  promoQuietPath,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./tournamentPromo.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { tournamentPromoLabels, tournamentPromoText } from "./tournamentPromoLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { checkinWindow } from "./tournament/rules.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { it as itDict } from "./dictionaries/it.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { en as enDict } from "./dictionaries/en.ts";

const LOCALES = ["en", "it", "es", "fr", "pt", "de", "ru", "zh-cn"] as const;
const promo = TOURNAMENT_PROMO!;

describe("popup di un torneo: dati e tempi", () => {
  test("EndGame First Blood: dati della scheda, fine alla chiusura del check-in", () => {
    assert.ok(promo, "c'è un popup acceso");
    assert.equal(promo.slug, "endgame-first-blood-602f");
    assert.match(promo.tag, /^OM-[A-Z0-9]{4}$/);
    assert.equal(promo.startsAt, "2026-11-07T17:00:00Z", "le 18:00 in Italia, le 14:00 BRT della descrizione");
    assert.equal(Date.parse(promo.until), checkinWindow(promo.startsAt).closesAt, "fino alla chiusura del check-in");
    assert.deepEqual(promo.prize, { currency: "USD", total: 50, first: 35, second: 15 });
    assert.equal(promo.prize.first + promo.prize.second, promo.prize.total, "i premi fanno il montepremi");
    assert.ok(fs.existsSync(new URL(`../../public${promo.cover.src}`, import.meta.url)), "la copertina c'è");
    assert.equal(promo.cover.width * 9, promo.cover.height * 16, "copertina 16:9, mostrata intera");
  });
  test("promoActive: fino alla chiusura del check-in esclusa", () => {
    const end = Date.parse(promo.until);
    assert.equal(promoActive(Date.parse("2026-11-05T10:00:00Z"), promo), true);
    assert.equal(promoActive(end - 1, promo), true);
    assert.equal(promoActive(end, promo), false);
    assert.equal(promoActive(end + 60_000, promo), false);
    assert.equal(promoActive(Date.now(), null), false, "spento");
    assert.equal(promoActive(0, { until: "non una data" }), false);
  });
  test("memoria e attesa", () => {
    assert.match(PROMO_SEEN_KEY, /^originsmeta\.[A-Za-z]+\.v1$/);
    assert.ok(PROMO_DELAY_MS >= 2000 && PROMO_DELAY_MS <= 10_000, "pochi secondi dopo il banner dei cookie");
  });
});

describe("popup di un torneo: pagine", () => {
  test("pathWithoutLocale toglie solo le lingue del sito", () => {
    assert.equal(pathWithoutLocale("/it"), "/");
    assert.equal(pathWithoutLocale("/it/"), "/");
    assert.equal(pathWithoutLocale("/zh-cn/news"), "/news");
    assert.equal(pathWithoutLocale("/pt/tournaments/x"), "/tournaments/x");
    assert.equal(pathWithoutLocale("/italy"), "/italy");
    assert.equal(pathWithoutLocale("/news"), "/news");
  });
  test("le pagine del torneo: la scheda e le sue sottopagine, in ogni lingua", () => {
    for (const l of LOCALES) {
      assert.ok(isPromoTournamentPath(`/${l}/tournaments/${promo.slug}`, promo.slug), l);
      assert.ok(isPromoTournamentPath(`/${l}/tournaments/${promo.slug}/deck`, promo.slug), l);
    }
    assert.ok(!isPromoTournamentPath(`/it/tournaments/${promo.slug}x`, promo.slug), "un altro slug");
    assert.ok(!isPromoTournamentPath("/it/tournaments", promo.slug));
    assert.ok(!isPromoTournamentPath("/it", promo.slug));
  });
  test("non si interrompe accesso, account, strumenti e moduli", () => {
    const quiet = [
      "/it/login",
      "/en/account",
      "/it/account/messages",
      "/it/account/staff/messages/abc",
      "/es/kickstarter",
      "/it/deck-builder",
      "/it/draft",
      "/it/draft/r/ABCD",
      "/it/theory-craft",
      "/it/tier-list/create",
      "/it/guides/new",
      "/it/guides/submit",
      "/it/guides/community/una-guida/edit",
      "/it/decks/publish",
      "/it/decks/tournament/publish",
      "/it/decks/community/un-mazzo/edit",
      "/it/decks/tournament/un-trio/edit",
      "/it/news/comics/new",
      "/it/news/comics/un-fumetto/edit",
      "/it/tournaments/new",
      "/it/tournaments/un-torneo/deck",
      "/it/tournaments/un-torneo/manage",
      "/it/tournaments/un-torneo/match/123",
      "/zh-cn/login",
    ];
    for (const p of quiet) assert.ok(promoQuietPath(p), p);
    const open = [
      "/it",
      "/en",
      "/zh-cn",
      "/it/news",
      "/it/news/patch-0-7",
      "/it/news/comics",
      "/it/tournaments",
      "/it/tournaments/un-altro-torneo",
      "/it/decks",
      "/it/decks/community/un-mazzo",
      "/it/decks/tournament",
      "/it/cards",
      "/it/cards/merlin",
      "/it/tier-list",
      "/it/tier-list/community",
      "/it/theory-craft/decks",
      "/it/guides",
      "/it/analytics",
      "/it/u/qualcuno",
      "/it/faq",
    ];
    for (const p of open) assert.ok(!promoQuietPath(p), p);
  });
});

describe("popup di un torneo: calendario", () => {
  test("promoListed cerca la voce t-<slug> in qualsiasi lingua", () => {
    const key = `t-${promo.slug}`;
    assert.ok(promoListed({ it: [{ key }], en: [] }, promo.slug));
    assert.ok(promoListed({ en: [{ key: "t-altro" }, { key }] }, promo.slug));
    assert.ok(!promoListed({ it: [{ key: "t-altro" }] }, promo.slug), "torneo non più in calendario");
    assert.ok(!promoListed({}, promo.slug));
    assert.ok(!promoListed(null, promo.slug));
    assert.ok(!promoListed("errore", promo.slug));
    assert.ok(!promoListed({ it: "x", en: [null, 3, { key: 1 }] }, promo.slug));
  });
});

describe("popup di un torneo: cifre, date e testi", () => {
  test("promoMoney: senza decimali, con la valuta", () => {
    assert.equal(promoMoney(50, "USD", "en"), "$50");
    for (const lang of ["it", "es", "fr", "pt-BR", "de", "ru", "zh-Hans"]) {
      const s = promoMoney(50, "USD", lang);
      assert.match(s, /50/, lang);
      assert.match(s, /\$|USD/, lang);
      assert.doesNotMatch(s, /50[.,]00/, `${lang}: niente decimali`);
    }
    assert.equal(promoMoney(50, "XX!", "it"), "50 XX!", "valuta sbagliata: la cifra resta");
  });
  test("promoDate: giorno e ora nel fuso di chi guarda", () => {
    const rome = promoDate(promo.startsAt, "it", "Europe/Rome");
    assert.match(rome, /sabato/);
    assert.match(rome, /7 novembre/);
    assert.match(rome, /18:00/);
    const brazil = promoDate(promo.startsAt, "pt-BR", "America/Sao_Paulo");
    assert.match(brazil, /sábado/);
    assert.match(brazil, /14:00/, "le 14:00 BRT della descrizione");
    assert.match(promoDate(promo.startsAt, "en", "UTC"), /Saturday.*November 7.*5:00/);
  });
  test("stesse etichette e stessi segnaposto in ogni lingua, niente vuoti", () => {
    const en = tournamentPromoLabels.en;
    const marks = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    for (const l of LOCALES) {
      const lab = tournamentPromoLabels[l];
      assert.deepEqual(Object.keys(lab).sort(), Object.keys(en).sort(), l);
      for (const k of Object.keys(en) as (keyof typeof en)[]) {
        assert.ok(lab[k].trim().length > 0, `${l}.${k}`);
        assert.equal(marks(lab[k]), marks(en[k]), `${l}.${k}`);
      }
      assert.ok(promo.pitch[l]?.trim(), `frase del torneo in ${l}`);
    }
  });
  test("francese con lo spazio insecabile prima di : ; ? !", () => {
    const nb = String.fromCharCode(0xa0) + String.fromCharCode(0x202f);
    const bad = new RegExp(`[^${nb}][:;?!]`);
    for (const s of [...Object.values(tournamentPromoLabels.fr), promo.pitch.fr]) assert.doesNotMatch(s, bad, s);
  });
  test("cinese con lo spazio fra ideogrammi e lettere o cifre latine", () => {
    const han = `${String.fromCharCode(0x4e00)}-${String.fromCharCode(0x9fff)}`;
    const glued = new RegExp(`[${han}][A-Za-z0-9{]|[A-Za-z0-9}][${han}]`);
    for (const s of [...Object.values(tournamentPromoLabels["zh-cn"]), promo.pitch["zh-cn"]]) assert.doesNotMatch(s, glued, s);
  });
  test("tournamentPromoText: le parole dei tornei dal dizionario", () => {
    const it = tournamentPromoText("it", itDict.tournaments, promo);
    assert.equal(it.kicker, "Torneo della community");
    assert.equal(it.format, "Conquest · 2 mazzi · Al meglio delle 3 · Eliminazione diretta · Check-in obbligatorio");
    assert.equal(it.pitch, promo.pitch.it);
    assert.equal(it.cta, "Iscriviti al torneo");
    const en = tournamentPromoText("en", enDict.tournaments, promo);
    assert.equal(en.format, "Conquest · 2 decks · Best of 3 · Single elimination · Check-in required");
    assert.match(en.prize, /\{total\}/, "le cifre le scrive il browser");
  });
});

describe("popup di un torneo: pagina e componente", () => {
  test("la scheda del torneo ha il riquadro dell'iscrizione con l'ancora #join", () => {
    const page = fs.readFileSync(new URL("../app/[locale]/(site)/tournaments/[slug]/page.tsx", import.meta.url), "utf8");
    assert.match(page, /<div id="join" className="[^"]*scroll-mt-24/);
  });
  test("il layout porta il popup al riquadro dell'iscrizione", () => {
    const layout = fs.readFileSync(new URL("../app/[locale]/layout.tsx", import.meta.url), "utf8");
    assert.match(layout, /<TournamentPromoDialog/);
    assert.ok(layout.includes("/tournaments/${promo.slug}`)}#join`"), "href verso #join");
  });
  test("il popup e il riquadro dei feedback non si aprono insieme", () => {
    const promoSrc = fs.readFileSync(new URL("../components/TournamentPromo.tsx", import.meta.url), "utf8");
    const feedback = fs.readFileSync(new URL("../components/FeedbackWidget.tsx", import.meta.url), "utf8");
    for (const src of [promoSrc, feedback]) {
      assert.match(src, /otherPanelOpen\(PANEL_ID\)/);
      assert.match(src, /setPanelOpen\(PANEL_ID, /);
    }
    assert.match(feedback, /const AUTO_DELAY_MS = 60_000;/, "i feedback dopo un minuto (Pierluigi, 05/11/2026)");
  });
});
