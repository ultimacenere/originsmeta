/**
 * Test delle regole del profilo pubblico (`profileLinks.ts`): `node --test src/lib/community/profileLinks.test.ts`.
 * Canali nella forma canonica di ogni piattaforma, https e host ammessi, bio in testo semplice, lingue dei contenuti,
 * modulo di /account. Controlla anche che le espressioni del database siano le stesse del codice: il vincolo
 * `profile_link_ok` è la vera difesa contro chi scrive la riga via API saltando il sito. Il blocco SQL sta in fondo a
 * supabase/schema.sql (accodato il 26/09/2026, prima era supabase/creator-CREATOR.sql): il test lo legge lì e
 * controlla che venga dopo la `revoke update on public.profiles`, che toglierebbe i grant per colonna.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { schemaProblems, sqlStatements } from "../../../scripts/schema-guard.mjs";
import {
  BIO_MAX,
  CANONICAL,
  CONTENT_LANGS,
  GOOGLE_REDIRECT,
  INVISIBLE,
  LINK_KINDS,
  MAX_LINKS,
  PLATFORM_HOSTS,
  REDIRECTOR_HOSTS,
  SAVE_MIN_INTERVAL_MS,
  SHORTENER_HOSTS,
  WEBSITE_BLOCKED_HOST,
  cleanBio,
  cleanContentLangs,
  isCanonicalLink,
  isCreatorBadge,
  linkHandle,
  mainChannels,
  normalizeLink,
  parseProfileForm,
  parseStoredLinks,
  sameShowcase,
  twitchLogin,
  websiteBlock,
  type LinkKind,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in src/lib/tierstats.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./profileLinks.ts";

const url = (kind: LinkKind, raw: string) => {
  const r = normalizeLink(kind, raw);
  return r.ok ? (r.link?.url ?? null) : `!${r.error}`;
};

/** Caratteri invisibili costruiti dal codice: scritti letterali nel file si perderebbero senza che si veda. */
const ch = (code: number) => String.fromCharCode(code);
const RLO = ch(0x202e);
const ZWSP = ch(0x200b);
const BEL = ch(0x07);
const LINE_SEP = ch(0x2028);
const PARA_SEP = ch(0x2029);

describe("canali: forma canonica di ogni piattaforma", () => {
  test("Twitch: indirizzo intero, senza https, mobile, con pagine dopo il canale, o il solo nome", () => {
    assert.equal(url("twitch", "https://www.twitch.tv/CoachCrono"), "https://www.twitch.tv/coachcrono");
    assert.equal(url("twitch", "twitch.tv/coachcrono/"), "https://www.twitch.tv/coachcrono");
    assert.equal(url("twitch", "https://m.twitch.tv/coachcrono/videos?filter=archives"), "https://www.twitch.tv/coachcrono");
    assert.equal(url("twitch", "coachcrono"), "https://www.twitch.tv/coachcrono");
    assert.equal(url("twitch", "@coachcrono"), "https://www.twitch.tv/coachcrono");
    assert.equal(url("twitch", "  https://www.twitch.tv/coachcrono \n"), "https://www.twitch.tv/coachcrono");
    assert.equal(url("twitch", `coach${ZWSP}crono`), "https://www.twitch.tv/coachcrono", "caratteri invisibili incollati");
  });
  test("Twitch: pagine che non sono un canale, altri siti, nomi impossibili", () => {
    assert.equal(url("twitch", "https://www.twitch.tv/directory/category/origins-tcg"), "!invalid");
    assert.equal(url("twitch", "https://www.twitch.tv/"), "!invalid");
    assert.equal(url("twitch", "https://twitch.tv.evil.com/coachcrono"), "!invalid");
    assert.equal(url("twitch", "https://evil.com/twitch.tv/coachcrono"), "!invalid");
    assert.equal(url("twitch", "https://user:pass@www.twitch.tv/coachcrono"), "!invalid");
    assert.equal(url("twitch", "ab"), "!invalid");
    assert.equal(url("twitch", "nome-con-trattino"), "!invalid");
    assert.equal(url("twitch", "coach.crono"), "!invalid", "su Twitch i nomi non hanno il punto");
  });
  test("YouTube: handle, canale, vecchi indirizzi c/ e user/; niente video", () => {
    assert.equal(url("youtube", "https://www.youtube.com/@CoachCrono/videos"), "https://www.youtube.com/@CoachCrono");
    assert.equal(url("youtube", "youtube.com/@coach.crono"), "https://www.youtube.com/@coach.crono");
    assert.equal(url("youtube", "@CoachCrono"), "https://www.youtube.com/@CoachCrono");
    assert.equal(url("youtube", "https://m.youtube.com/channel/UCabcdefghijklmnopqrstuv"), "https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv");
    assert.equal(url("youtube", "https://www.youtube.com/c/OriginsTCG"), "https://www.youtube.com/c/OriginsTCG");
    assert.equal(url("youtube", "https://www.youtube.com/user/someone"), "https://www.youtube.com/user/someone");
    assert.equal(url("youtube", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "!invalid");
    assert.equal(url("youtube", "https://youtu.be/dQw4w9WgXcQ"), "!invalid");
  });
  test("nomi con il punto, scritti da soli, su YouTube, TikTok e Instagram (il suggerimento del modulo li promette)", () => {
    assert.equal(url("youtube", "@Coach.Crono"), "https://www.youtube.com/@Coach.Crono");
    assert.equal(url("youtube", "Coach.Crono"), "https://www.youtube.com/@Coach.Crono");
    assert.equal(url("tiktok", "@coach.crono"), "https://www.tiktok.com/@coach.crono");
    assert.equal(url("tiktok", "Coach.Crono"), "https://www.tiktok.com/@coach.crono");
    assert.equal(url("instagram", "coach.crono"), "https://www.instagram.com/coach.crono");
    assert.equal(url("instagram", "@coach.crono"), "https://www.instagram.com/coach.crono");
    assert.equal(url("instagram", "instagram.com"), "!invalid", "l'host da solo non è un nome");
    assert.equal(url("youtube", "www.youtube.com"), "!invalid");
    assert.equal(url("x", "coach.crono"), "!invalid", "su X i nomi non hanno il punto: è un indirizzo di un altro sito");
    assert.equal(url("kick", "coach.crono"), "!invalid");
  });
  test("X (anche twitter.com), TikTok, Instagram, Kick", () => {
    assert.equal(url("x", "https://twitter.com/Origins_TCG"), "https://x.com/Origins_TCG");
    assert.equal(url("x", "x.com/origins_tcg/status/123"), "https://x.com/origins_tcg");
    assert.equal(url("x", "https://x.com/home"), "!invalid");
    assert.equal(url("x", "@questo_nome_e_troppo_lungo"), "!invalid");
    assert.equal(url("tiktok", "https://www.tiktok.com/@Coach.Crono?lang=it"), "https://www.tiktok.com/@coach.crono");
    assert.equal(url("tiktok", "https://www.tiktok.com/coachcrono"), "!invalid");
    assert.equal(url("instagram", "instagram.com/Coach.Crono/"), "https://www.instagram.com/coach.crono");
    assert.equal(url("instagram", "https://www.instagram.com/p/ABC123/"), "!invalid");
    assert.equal(url("kick", "https://kick.com/CoachCrono"), "https://kick.com/coachcrono");
    assert.equal(url("kick", "ab"), "!invalid", "troppo corto");
    assert.equal(url("kick", "https://kick.com/categories/games"), "!invalid");
  });
  test("Bluesky: nome completo o profilo; Discord: solo inviti", () => {
    assert.equal(url("bluesky", "https://bsky.app/profile/Coach.bsky.social"), "https://bsky.app/profile/coach.bsky.social");
    assert.equal(url("bluesky", "@coach.bsky.social"), "https://bsky.app/profile/coach.bsky.social");
    assert.equal(url("bluesky", "https://bsky.app/profile/did:plc:abcdefghijklmnopqrstuvwx"), "https://bsky.app/profile/did:plc:abcdefghijklmnopqrstuvwx");
    assert.equal(url("bluesky", "coach"), "!invalid");
    assert.equal(url("discord", "https://discord.gg/AbC-123"), "https://discord.gg/AbC-123");
    assert.equal(url("discord", "discord.com/invite/AbC123"), "https://discord.gg/AbC123");
    assert.equal(url("discord", "https://discord.com/channels/1/2"), "!invalid");
    assert.equal(url("discord", "https://discord.com/oauth2/authorize?client_id=123&scope=bot&permissions=8"), "!invalid");
    assert.equal(url("discord", "AbC123"), "!invalid", "il solo codice non basta: serve l'invito");
  });
  test("sito web: solo https, dominio vero, niente accorciatori, credenziali, porte o IP", () => {
    assert.equal(url("website", "https://Example.com/Chi-Sono#top"), "https://example.com/Chi-Sono");
    assert.equal(url("website", "coachcrono.it"), "https://coachcrono.it/");
    assert.equal(url("website", "https://sites.google.com/view/coachcrono"), "https://sites.google.com/view/coachcrono");
    assert.equal(url("website", "https://www.facebook.com/coachcrono"), "https://www.facebook.com/coachcrono", "Facebook non ha un tipo suo");
    assert.equal(url("website", "https://notbit.ly/x"), "https://notbit.ly/x", "il suffisso vale solo dopo un punto");
    assert.equal(url("website", "http://example.com"), "!http");
    assert.equal(url("website", "https://user:pw@example.com/"), "!invalid");
    assert.equal(url("website", "https://example.com:8443/"), "!invalid");
    assert.equal(url("website", "https://192.168.1.1/"), "!invalid");
    assert.equal(url("website", "https://localhost/"), "!invalid");
    assert.equal(url("website", "javascript:alert(1)"), "!invalid");
    assert.equal(url("website", "data:text/html,<b>x</b>"), "!invalid");
    assert.equal(url("website", `https://example.com/${"a".repeat(220)}`), "!long");
  });
  test("sito web: accorciatori anche nei sottodomini e con i nomi meno noti", () => {
    for (const raw of ["https://bit.ly/abc", "https://www.tinyurl.com/abc", "https://m.bit.ly/abc", "https://j.mp/abc", "https://bitly.com/abc", "https://v.gd/abc", "https://bl.ink/abc", "https://tiny.one/abc", "https://rotf.lol/abc", "https://cutt.us/abc"]) {
      assert.equal(url("website", raw), "!shortener", raw);
    }
  });
  test("sito web: redirector e host delle piattaforme rifiutati, anche con un dominio che ispira fiducia", () => {
    assert.equal(url("website", "https://www.google.com/url?q=https://evil.example/"), "!redirect");
    assert.equal(url("website", "https://google.co.uk/url?q=https://evil.example/"), "!redirect");
    assert.equal(url("website", "https://www.google.it/amp/s/evil.example/"), "!redirect");
    assert.equal(url("website", "https://l.facebook.com/l.php?u=https%3A%2F%2Fevil.example%2F"), "!redirect");
    assert.equal(url("website", "https://lm.facebook.com/l.php?u=x"), "!redirect");
    assert.deepEqual(normalizeLink("website", "https://l.instagram.com/?u=https%3A%2F%2Fevil.example%2F"), { ok: false, error: "platform", platform: "instagram" });
    assert.deepEqual(normalizeLink("website", "https://www.youtube.com/redirect?q=https://evil.example/"), { ok: false, error: "platform", platform: "youtube" });
    assert.deepEqual(normalizeLink("website", "https://discord.com/oauth2/authorize?client_id=123&scope=bot&permissions=8"), { ok: false, error: "platform", platform: "discord" });
    assert.deepEqual(normalizeLink("website", "https://www.twitch.tv/directory"), { ok: false, error: "platform", platform: "twitch" });
    assert.deepEqual(normalizeLink("website", "https://youtu.be/dQw4w9WgXcQ"), { ok: false, error: "platform", platform: "youtube" });
    assert.deepEqual(normalizeLink("website", "twitter.com/coach"), { ok: false, error: "platform", platform: "x" });
    assert.equal(websiteBlock("https://example.com/"), null);
  });
  test("schemi diversi da https rifiutati su tutte le piattaforme, accorciatori compresi", () => {
    for (const kind of LINK_KINDS) {
      assert.equal(url(kind, "javascript:alert(1)"), "!invalid", kind);
      assert.equal(url(kind, "ftp://twitch.tv/x"), "!invalid", kind);
    }
    assert.equal(url("twitch", "http://www.twitch.tv/coachcrono"), "!http");
    assert.equal(url("youtube", "https://bit.ly/abc"), "!shortener");
    assert.equal(url("youtube", "https://m.bit.ly/abc"), "!shortener");
  });
  test("valore vuoto: nessun canale", () => {
    assert.deepEqual(normalizeLink("twitch", "   "), { ok: true, link: null });
  });
  test("ogni indirizzo prodotto rispetta la forma canonica (quella del vincolo nel database)", () => {
    const samples: [LinkKind, string][] = [
      ["twitch", "coachcrono"],
      ["youtube", "@coachcrono"],
      ["x", "coachcrono"],
      ["tiktok", "@coachcrono"],
      ["instagram", "coachcrono"],
      ["kick", "coachcrono"],
      ["bluesky", "coachcrono.bsky.social"],
      ["discord", "https://discord.gg/abc123"],
      ["website", "https://coachcrono.it/link?x=1"],
    ];
    for (const [kind, raw] of samples) {
      const r = normalizeLink(kind, raw);
      assert.ok(r.ok && r.link, `${kind}: ${raw}`);
      assert.ok(isCanonicalLink(r.link), `${kind}: ${r.link.url}`);
    }
  });
  test("elenchi degli host: minuscoli, senza doppioni, senza www", () => {
    const all = [...Object.keys(PLATFORM_HOSTS), ...SHORTENER_HOSTS, ...REDIRECTOR_HOSTS];
    assert.equal(new Set(all).size, all.length);
    for (const h of all) assert.match(h, /^[a-z0-9-]+(\.[a-z0-9-]+)+$/, h);
    for (const h of all) assert.ok(!h.startsWith("www."), h);
    assert.ok(WEBSITE_BLOCKED_HOST.test("m.bit.ly") && !WEBSITE_BLOCKED_HOST.test("notbit.ly"));
  });
});

describe("canali salvati", () => {
  test("parseStoredLinks tiene solo i canali validi, al massimo otto", () => {
    const good = { kind: "twitch", url: "https://www.twitch.tv/coachcrono" };
    assert.deepEqual(parseStoredLinks([good, { kind: "twitch", url: "https://evil.com/x" }, { kind: "myspace", url: "https://myspace.com/x" }, "x", null]), [good]);
    assert.deepEqual(parseStoredLinks({ kind: "twitch" }), []);
    assert.deepEqual(parseStoredLinks([{ ...good, extra: 1 }]), [], "niente campi in più");
    assert.equal(parseStoredLinks(Array.from({ length: 12 }, () => good)).length, MAX_LINKS);
    assert.deepEqual(parseStoredLinks([{ kind: "website", url: "https://bit.ly/x" }]), [], "accorciatore scritto a mano");
    assert.deepEqual(parseStoredLinks([{ kind: "website", url: "https://discord.com/oauth2/authorize" }]), [], "host di una piattaforma");
    assert.deepEqual(parseStoredLinks([{ kind: "website", url: "https://www.google.com/url?q=x" }]), [], "redirector");
  });
  test("etichette visibili: il nome del canale o il dominio del sito", () => {
    assert.equal(linkHandle({ kind: "twitch", url: "https://www.twitch.tv/coachcrono" }), "coachcrono");
    assert.equal(linkHandle({ kind: "youtube", url: "https://www.youtube.com/@CoachCrono" }), "@CoachCrono");
    assert.equal(linkHandle({ kind: "youtube", url: "https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv" }), "UCabcdefghijklmnopqrstuv");
    assert.equal(linkHandle({ kind: "x", url: "https://x.com/origins_tcg" }), "@origins_tcg");
    assert.equal(linkHandle({ kind: "tiktok", url: "https://www.tiktok.com/@coach" }), "@coach");
    assert.equal(linkHandle({ kind: "bluesky", url: "https://bsky.app/profile/coach.bsky.social" }), "@coach.bsky.social");
    assert.equal(linkHandle({ kind: "discord", url: "https://discord.gg/abc" }), "discord.gg/abc");
    assert.equal(linkHandle({ kind: "website", url: "https://www.coachcrono.it/chi-sono" }), "coachcrono.it");
  });
  test("canali principali nell'ordine dell'utente, e il canale Twitch per lo stato in diretta", () => {
    const links = parseStoredLinks([
      { kind: "youtube", url: "https://www.youtube.com/@coach" },
      { kind: "twitch", url: "https://www.twitch.tv/coach_live" },
      { kind: "x", url: "https://x.com/coach" },
      { kind: "twitch", url: "https://www.twitch.tv/coach_second" },
    ]);
    assert.deepEqual(
      mainChannels(links).map((l) => l.kind),
      ["youtube", "twitch", "x"],
    );
    assert.equal(mainChannels(links, 2).length, 2);
    assert.equal(twitchLogin(links), "coach_live");
    assert.equal(twitchLogin([]), null);
  });
  test("tag che fanno di un profilo un creator", () => {
    for (const b of ["creator", "influencer", "pro", "staff"]) assert.ok(isCreatorBadge(b), b);
    for (const b of ["community", "", null, undefined, "admin"]) assert.ok(!isCreatorBadge(b), String(b));
  });
});

describe("bio e lingue", () => {
  test("bio: testo semplice, a capo ammessi, controlli e caratteri invisibili tolti", () => {
    assert.deepEqual(cleanBio("  Ciao!\r\n\r\n\r\n\r\nStreamer   di Origins\t TCG  "), { ok: true, value: "Ciao!\n\nStreamer di Origins TCG" });
    assert.deepEqual(cleanBio(`a${RLO}b${ZWSP}c${BEL}d`), { ok: true, value: "abcd" });
    assert.deepEqual(cleanBio(" \n "), { ok: true, value: null });
    assert.deepEqual(cleanBio("<b>ciao</b>"), { ok: true, value: "<b>ciao</b>" }, "l'HTML resta testo: React lo scrive così com'è");
  });
  test("bio: i separatori di riga Unicode diventano a capo (il vincolo del database li rifiuterebbe)", () => {
    assert.deepEqual(cleanBio(`riga uno${LINE_SEP}riga due${PARA_SEP}${PARA_SEP}${PARA_SEP}tre`), { ok: true, value: "riga uno\nriga due\n\ntre" });
  });
  test("bio: il limite conta i caratteri come Postgres (un'emoji vale uno)", () => {
    assert.ok(cleanBio("x".repeat(BIO_MAX)).ok);
    assert.deepEqual(cleanBio("x".repeat(BIO_MAX + 1)), { ok: false, error: "long" });
    assert.ok(cleanBio("🎴".repeat(BIO_MAX)).ok, "280 emoji: 560 unità UTF-16, 280 caratteri");
  });
  test("lingue dei contenuti: solo quelle del sito, senza doppioni, nell'ordine del sito", () => {
    assert.deepEqual(cleanContentLangs(["it", "fr", "en", "it", 3]), ["en", "it"]);
    assert.deepEqual(cleanContentLangs("it"), []);
  });
  test("le lingue dei contenuti sono le lingue del sito (src/lib/i18n.ts)", () => {
    const src = readFileSync(new URL("../i18n.ts", import.meta.url), "utf8");
    const m = /export const locales = \[([^\]]+)\]/.exec(src);
    assert.ok(m, "locales in i18n.ts");
    assert.deepEqual(
      m[1].split(",").map((s) => s.trim().replace(/"/g, "")),
      [...CONTENT_LANGS],
    );
  });
  test("il modulo non contiene caratteri invisibili o separatori di riga scritti letterali", () => {
    const src = readFileSync(new URL("./profileLinks.ts", import.meta.url), "utf8");
    const invisible = new RegExp(`[${ch(0x200b)}-${ch(0x200f)}${ch(0x202a)}-${ch(0x202e)}${ch(0x2060)}-${ch(0x2069)}${ch(0xfeff)}${LINE_SEP}${PARA_SEP}]`);
    assert.doesNotMatch(src, invisible);
  });
});

describe("modulo di /account", () => {
  test("righe vuote saltate, doppioni tenuti una volta, lingue ripulite", () => {
    const r = parseProfileForm({
      bio: " Streamer italiano ",
      langs: ["it", "en", "de"],
      kinds: ["twitch", "youtube", "twitch", "x"],
      urls: ["coachcrono", "", "https://www.twitch.tv/CoachCrono", "  "],
    });
    assert.deepEqual(r, { ok: true, value: { bio: "Streamer italiano", links: [{ kind: "twitch", url: "https://www.twitch.tv/coachcrono" }], content_langs: ["en", "it"] } });
  });
  test("errori riga per riga, con l'indice della riga nel modulo; niente salvataggio parziale", () => {
    const r = parseProfileForm({
      bio: "x".repeat(BIO_MAX + 5),
      langs: [],
      kinds: ["twitch", "website", "myspace", "website"],
      urls: ["https://evil.com/x", "https://bit.ly/x", "https://myspace.com/x", "https://www.twitch.tv/coachcrono"],
    });
    assert.deepEqual(r, {
      ok: false,
      errors: {
        bio: "long",
        links: [
          { index: 0, error: "invalid" },
          { index: 1, error: "shortener" },
          { index: 2, error: "kind" },
          { index: 3, error: "platform", platform: "twitch" },
        ],
      },
    });
  });
  test("salvataggio identico a quello che c'è: niente scrittura (sameShowcase)", () => {
    const value = { bio: "Streamer", links: [{ kind: "twitch" as const, url: "https://www.twitch.tv/coachcrono" }], content_langs: ["en" as const, "it" as const] };
    const row = { bio: "Streamer", links: [{ kind: "twitch", url: "https://www.twitch.tv/coachcrono" }], content_langs: ["en", "it"] };
    assert.ok(sameShowcase(row, value));
    assert.ok(!sameShowcase({ ...row, bio: null }, value), "bio diversa");
    assert.ok(!sameShowcase({ ...row, content_langs: ["it"] }, value), "lingue diverse");
    assert.ok(!sameShowcase({ ...row, links: [] }, value), "canali diversi");
    const two = { ...value, links: [...value.links, { kind: "x" as const, url: "https://x.com/coach" }] };
    assert.ok(!sameShowcase({ ...row, links: [...two.links].reverse() }, two), "l'ordine dei canali conta");
    assert.ok(sameShowcase({ bio: null, links: [], content_langs: [] }, { bio: null, links: [], content_langs: [] }));
    assert.ok(SAVE_MIN_INTERVAL_MS >= 5_000);
  });
  test("oltre otto canali: errore anche se il modulo è stato manomesso", () => {
    const kinds = Array.from({ length: 9 }, () => "twitch");
    const urls = Array.from({ length: 9 }, (_, i) => `coach${i}x`);
    const r = parseProfileForm({ bio: "", langs: [], kinds, urls });
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.errors.tooMany, true);
  });
});

/** Il blocco SQL del pacchetto, in fondo a schema.sql (accodato il 26/09/2026): dal suo titolo alla fine del file. */
const MARKER = "Profilo del creator (pacchetto CREATOR";
const schemaUrl = new URL("../../../supabase/schema.sql", import.meta.url);
const schema = readFileSync(schemaUrl, "utf8");
const sql = schema.includes(MARKER) ? schema.slice(schema.indexOf(MARKER)) : "";

/** Righe che aprono o chiudono il corpo di una funzione con un dollaro solo (`as $`, `end $;`): errore di sintassi. */
const singleDollar = (text: string) => text.split(/\r?\n/).filter((l) => /\bas \$\s*$|^\s*end \$;\s*$|^\s*\$;\s*$/i.test(l));

describe("database: stesse regole nel vincolo (supabase/schema.sql)", () => {
  test("il blocco SQL c'è", () => {
    assert.ok(sql.includes(MARKER), "manca il blocco SQL del profilo pubblico in schema.sql");
  });
  test("ogni piattaforma ha la sua espressione, identica a quella del codice", () => {
    for (const kind of LINK_KINDS) {
      const m = new RegExp(`when '${kind}' then \\(link->>'url'\\) ~ '([^']+)'`).exec(sql);
      assert.ok(m, `manca l'espressione di ${kind} nel database`);
      assert.equal(m[1], CANONICAL[kind].source.replace(/\\\//g, "/"), `${kind}: espressione diversa fra codice e database`);
    }
  });
  test("sito web: stessi host rifiutati (piattaforme, accorciatori, redirector) e stesso controllo su Google", () => {
    assert.ok(sql.includes(`!~ '${WEBSITE_BLOCKED_HOST.source}'`), "espressione degli host rifiutati diversa fra codice e database");
    assert.ok(sql.includes(`!~ '${GOOGLE_REDIRECT.source.replace(/\\\//g, "/")}'`), "controllo di google.<tld>/url diverso fra codice e database");
  });
  test("un canale che desse null conta come non valido", () => {
    assert.match(sql, /bool_and\(coalesce\(public\.profile_link_ok\(t\.e\), false\)\)/);
  });
  test("limiti uguali: canali, bio, indirizzo, lingue", () => {
    assert.match(sql, new RegExp(`jsonb_array_length\\(links\\) > ${MAX_LINKS}`));
    assert.match(sql, new RegExp(`char_length\\(bio\\) between 1 and ${BIO_MAX}`));
    // bio: stessi caratteri invisibili tolti da cleanBio, almeno un carattere visibile, niente tre a capo di fila
    assert.ok(sql.includes(`and bio !~ '[${INVISIBLE}]'`), "caratteri invisibili della bio diversi fra codice e database");
    assert.ok(sql.includes("and bio ~ '[^[:space:]]'"));
    assert.ok(sql.includes("and strpos(replace(bio, ' ', ''), repeat(chr(10), 3)) = 0"));
    assert.match(sql, /char_length\(link->>'url'\) > 200/);
    assert.match(sql, new RegExp(`array\\[${CONTENT_LANGS.map((l) => `'${l}'`).join(",")}\\]::text\\[\\]`));
  });
  test("grant per colonna nel blocco del pacchetto", () => {
    assert.match(sql, /grant update \(bio, links, content_langs\) on public\.profiles to authenticated;/);
    assert.doesNotMatch(sql, /grant all/i);
  });
  test("corpi delle funzioni con i doppi dollari", () => {
    assert.deepEqual(singleDollar(sql), []);
  });
  /*
    Permessi su public.profiles in tutto schema.sql, con lo stesso controllo che fa scripts/db-migrate.mjs prima di
    collegarsi (scripts/schema-guard.mjs, casi rifiutati in schema-guard.test.mjs): istruzioni lette fuori dai commenti
    anche su più righe; le sole grant ammesse sono quella di lettura e quella per colonna (niente `grant update (role)`,
    niente grant su tutte le tabelle dello schema); la revoke di 6c6756d prima della grant per colonna e nessuna revoke
    dopo (neppure `on all tables in schema public`); protect_profile_badge che protegge tag, ruolo, nome utente, id
    Discord, id e data del profilo.
  */
  test("permessi di public.profiles: solo le grant ammesse, revoke prima, trigger con i campi riservati", () => {
    assert.deepEqual(schemaProblems(schema), []);
    const onProfiles = sqlStatements(schema).filter((s) => /^grant\b/.test(s) && /\bpublic\.profiles\b/.test(s));
    assert.deepEqual(onProfiles, [
      "grant select on public.profiles, public.community_decks, public.deck_votes, public.deck_ratings to anon, authenticated",
      "grant update (bio, links, content_langs) on public.profiles to authenticated",
    ]);
  });
});

/*
  schema.sql: il 26/09/2026 (commit 6c6756d) il corpo di protect_profile_badge aveva perso un dollaro ("as $" …
  "end $;") e scripts/db-migrate.mjs, che manda tutto il file in una query sola, falliva per intero. Corretto
  nell'integrazione dei pacchetti creator: da allora è un test normale, che impedisce di ricadere nell'errore.
*/
test("schema.sql: nessun corpo di funzione con un dollaro solo", () => {
  assert.deepEqual(
    singleDollar(schema).map((l) => l.trim()),
    [],
  );
});
