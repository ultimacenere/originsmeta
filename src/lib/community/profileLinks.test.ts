/**
 * Test delle regole del profilo pubblico (`profileLinks.ts`): `node --test src/lib/community/profileLinks.test.ts`.
 * Canali nella forma canonica di ogni piattaforma, https e host ammessi, bio in testo semplice, lingue dei contenuti,
 * modulo di /account. Controlla anche che le espressioni del database (supabase/creator-CREATOR.sql) siano le stesse
 * del codice: il vincolo `profile_link_ok` è la vera difesa contro chi scrive la riga via API saltando il sito.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BIO_MAX,
  CANONICAL,
  CONTENT_LANGS,
  LINK_KINDS,
  MAX_LINKS,
  SHORTENER_HOSTS,
  cleanBio,
  cleanContentLangs,
  isCanonicalLink,
  isCreatorBadge,
  linkHandle,
  mainChannels,
  normalizeLink,
  parseProfileForm,
  parseStoredLinks,
  twitchLogin,
  type LinkKind,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in src/lib/tierstats.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./profileLinks.ts";

const url = (kind: LinkKind, raw: string) => {
  const r = normalizeLink(kind, raw);
  return r.ok ? (r.link?.url ?? null) : `!${r.error}`;
};

describe("canali: forma canonica di ogni piattaforma", () => {
  test("Twitch: indirizzo intero, senza https, mobile, con pagine dopo il canale, o il solo nome", () => {
    assert.equal(url("twitch", "https://www.twitch.tv/CoachCrono"), "https://www.twitch.tv/coachcrono");
    assert.equal(url("twitch", "twitch.tv/coachcrono/"), "https://www.twitch.tv/coachcrono");
    assert.equal(url("twitch", "https://m.twitch.tv/coachcrono/videos?filter=archives"), "https://www.twitch.tv/coachcrono");
    assert.equal(url("twitch", "coachcrono"), "https://www.twitch.tv/coachcrono");
    assert.equal(url("twitch", "@coachcrono"), "https://www.twitch.tv/coachcrono");
    assert.equal(url("twitch", "  https://www.twitch.tv/coachcrono \n"), "https://www.twitch.tv/coachcrono");
  });
  test("Twitch: pagine che non sono un canale, altri siti, nomi impossibili", () => {
    assert.equal(url("twitch", "https://www.twitch.tv/directory/category/origins-tcg"), "!invalid");
    assert.equal(url("twitch", "https://www.twitch.tv/"), "!invalid");
    assert.equal(url("twitch", "https://twitch.tv.evil.com/coachcrono"), "!invalid");
    assert.equal(url("twitch", "https://evil.com/twitch.tv/coachcrono"), "!invalid");
    assert.equal(url("twitch", "https://user:pass@www.twitch.tv/coachcrono"), "!invalid");
    assert.equal(url("twitch", "ab"), "!invalid");
    assert.equal(url("twitch", "nome-con-trattino"), "!invalid");
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
    assert.equal(url("discord", "AbC123"), "!invalid", "il solo codice non basta: serve l'invito");
  });
  test("sito web: solo https, dominio vero, niente accorciatori, credenziali, porte o IP", () => {
    assert.equal(url("website", "https://Example.com/Chi-Sono#top"), "https://example.com/Chi-Sono");
    assert.equal(url("website", "coachcrono.it"), "https://coachcrono.it/");
    assert.equal(url("website", "http://example.com"), "!http");
    assert.equal(url("website", "https://bit.ly/abc"), "!shortener");
    assert.equal(url("website", "https://www.tinyurl.com/abc"), "!shortener");
    assert.equal(url("website", "https://user:pw@example.com/"), "!invalid");
    assert.equal(url("website", "https://example.com:8443/"), "!invalid");
    assert.equal(url("website", "https://192.168.1.1/"), "!invalid");
    assert.equal(url("website", "https://localhost/"), "!invalid");
    assert.equal(url("website", "javascript:alert(1)"), "!invalid");
    assert.equal(url("website", "data:text/html,<b>x</b>"), "!invalid");
    assert.equal(url("website", `https://example.com/${"a".repeat(220)}`), "!long");
  });
  test("schemi diversi da https rifiutati su tutte le piattaforme, accorciatori compresi", () => {
    for (const kind of LINK_KINDS) {
      assert.equal(url(kind, "javascript:alert(1)"), "!invalid", kind);
      assert.equal(url(kind, "ftp://twitch.tv/x"), "!invalid", kind);
    }
    assert.equal(url("twitch", "http://www.twitch.tv/coachcrono"), "!http");
    assert.equal(url("youtube", "https://bit.ly/abc"), "!shortener");
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
});

describe("canali salvati", () => {
  test("parseStoredLinks tiene solo i canali validi, al massimo otto", () => {
    const good = { kind: "twitch", url: "https://www.twitch.tv/coachcrono" };
    assert.deepEqual(parseStoredLinks([good, { kind: "twitch", url: "https://evil.com/x" }, { kind: "myspace", url: "https://myspace.com/x" }, "x", null]), [good]);
    assert.deepEqual(parseStoredLinks({ kind: "twitch" }), []);
    assert.deepEqual(parseStoredLinks([{ ...good, extra: 1 }]), [], "niente campi in più");
    assert.equal(parseStoredLinks(Array.from({ length: 12 }, () => good)).length, MAX_LINKS);
    assert.deepEqual(parseStoredLinks([{ kind: "website", url: "https://bit.ly/x" }]), [], "accorciatore scritto a mano");
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
    assert.deepEqual(cleanBio("a‮b​c\u0007d"), { ok: true, value: "abcd" });
    assert.deepEqual(cleanBio(" \n "), { ok: true, value: null });
    assert.deepEqual(cleanBio("<b>ciao</b>"), { ok: true, value: "<b>ciao</b>" }, "l'HTML resta testo: React lo scrive così com'è");
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
    const r = parseProfileForm({ bio: "x".repeat(BIO_MAX + 5), langs: [], kinds: ["twitch", "website", "myspace"], urls: ["https://evil.com/x", "https://bit.ly/x", "https://myspace.com/x"] });
    assert.deepEqual(r, {
      ok: false,
      errors: {
        bio: "long",
        links: [
          { index: 0, error: "invalid" },
          { index: 1, error: "shortener" },
          { index: 2, error: "kind" },
        ],
      },
    });
  });
  test("oltre otto canali: errore anche se il modulo è stato manomesso", () => {
    const kinds = Array.from({ length: 9 }, () => "twitch");
    const urls = Array.from({ length: 9 }, (_, i) => `coach${i}x`);
    const r = parseProfileForm({ bio: "", langs: [], kinds, urls });
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.errors.tooMany, true);
  });
});

describe("database: stesse regole nel vincolo (supabase/creator-CREATOR.sql)", () => {
  const sql = readFileSync(new URL("../../../supabase/creator-CREATOR.sql", import.meta.url), "utf8");
  test("ogni piattaforma ha la sua espressione, identica a quella del codice", () => {
    for (const kind of LINK_KINDS) {
      const m = new RegExp(`when '${kind}' then \\(link->>'url'\\) ~ '([^']+)'`).exec(sql);
      assert.ok(m, `manca l'espressione di ${kind} nel database`);
      assert.equal(m[1], CANONICAL[kind].source.replace(/\\\//g, "/"), `${kind}: espressione diversa fra codice e database`);
    }
  });
  test("gli accorciatori rifiutati sono gli stessi", () => {
    for (const host of SHORTENER_HOSTS) assert.ok(sql.includes(`'${host}'`), `${host} manca nel database`);
  });
  test("limiti uguali: canali, bio, indirizzo, lingue", () => {
    assert.match(sql, new RegExp(`jsonb_array_length\\(links\\) > ${MAX_LINKS}`));
    assert.match(sql, new RegExp(`char_length\\(bio\\) between 1 and ${BIO_MAX}`));
    assert.match(sql, /char_length\(link->>'url'\) > 200/);
    assert.match(sql, new RegExp(`array\\[${CONTENT_LANGS.map((l) => `'${l}'`).join(",")}\\]::text\\[\\]`));
  });
  test("grant per colonna, mai sull'intera tabella", () => {
    assert.match(sql, /grant update \(bio, links, content_langs\) on public\.profiles to authenticated;/);
    assert.doesNotMatch(sql, /grant update on public\.profiles/);
    assert.doesNotMatch(sql, /grant all/i);
  });
});
