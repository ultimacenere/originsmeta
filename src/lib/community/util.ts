import { getCard } from "@/lib/data/cards";
import { RULES, type BuilderCard, type DeckState } from "@/lib/deckrules";
import { guideSections, type Guide, type GuideLang, type Profile } from "./types";

export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug leggibile + 4 caratteri casuali, così due mazzi con lo stesso nome non collidono. */
export function newSlug(name: string): string {
  const base = slugify(name).slice(0, 40).replace(/-+$/, "") || "deck";
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 4);
  return `${base}-${rand}`;
}

/** Nome del mazzo ripulito: spazi compattati, al massimo 60 caratteri (il vincolo del database è 3–60). */
export function cleanDeckName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 60);
}

/** Id di una riga (uuid): controllo di forma prima di passarlo a una query. */
export function isUuid(raw: unknown): raw is string {
  return typeof raw === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
}

export type CheckedDeck = { legendary: string; cards: string[]; customCards: BuilderCard[] };

/**
 * Verifica sul server che il mazzo rispetti le regole e che ogni carta esista nel database
 * (o sia una carta personalizzata dichiarata nel mazzo). Le carte personalizzate vengono ripulite.
 */
export function checkDeck(deck: DeckState): { ok: true; deck: CheckedDeck } | { ok: false; code: "invalidDeck" } {
  const bad = { ok: false, code: "invalidDeck" } as const;
  const customs = new Map<string, BuilderCard>();
  for (const c of deck.customCards ?? []) {
    if (!c || typeof c.slug !== "string" || !c.slug.startsWith("custom:") || typeof c.name !== "string") continue;
    customs.set(c.slug, {
      slug: c.slug.slice(0, 80),
      name: c.name.trim().slice(0, 60),
      type: c.type === "spell" ? "spell" : "unit",
      legendary: Boolean(c.legendary),
      mana: typeof c.mana === "number" && Number.isFinite(c.mana) ? Math.max(0, Math.min(20, Math.round(c.mana))) : undefined,
      sagaLabel: "custom",
      custom: true,
    });
  }
  const leg = deck.legendary;
  if (!leg) return bad;
  const legCard = getCard(leg);
  const legOk = legCard ? Boolean(legCard.legendary) && legCard.status === "active" : customs.get(leg)?.legendary === true;
  if (!legOk) return bad;
  const base = Array.isArray(deck.cards) ? deck.cards.filter((s): s is string => typeof s === "string") : [];
  if (base.length !== RULES.distinctCards || new Set(base).size !== base.length || base.includes(leg)) return bad;
  const used: BuilderCard[] = [];
  for (const s of base) {
    const card = getCard(s);
    if (card) {
      if (card.legendary || card.type === "token" || card.status !== "active") return bad;
      continue;
    }
    const cu = customs.get(s);
    if (!cu || cu.legendary) return bad;
    used.push(cu);
  }
  const legCustom = customs.get(leg);
  if (legCustom) used.push(legCustom);
  return { ok: true, deck: { legendary: leg, cards: base, customCards: used } };
}

const LIMITS = { summaryMin: 20, summaryMax: 600, sectionMax: 2000 };

export function parseGuide(fd: FormData, fallbackLang: GuideLang): { ok: true; guide: Guide } | { ok: false; code: "summary" } {
  const str = (k: string, max: number) =>
    String(fd.get(k) ?? "")
      .replace(/\r\n/g, "\n")
      .trim()
      .slice(0, max);
  const rawLang = fd.get("lang");
  const lang: GuideLang = rawLang === "en" || rawLang === "it" ? rawLang : fallbackLang;
  const summary = str("summary", LIMITS.summaryMax);
  if (summary.length < LIMITS.summaryMin) return { ok: false, code: "summary" };
  const guide: Guide = { lang, summary };
  for (const k of guideSections) {
    const v = str(k, LIMITS.sectionMax);
    if (v) guide[k] = v;
  }
  return { ok: true, guide };
}

export function cleanVideo(raw: string): { ok: true; value: string | null } | { ok: false } {
  const v = raw.trim().slice(0, 300);
  if (!v) return { ok: true, value: null };
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") return { ok: false };
    return { ok: true, value: u.toString() };
  } catch {
    return { ok: false };
  }
}

/** ID di un video YouTube (watch, youtu.be, shorts, live, embed), altrimenti null. */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www|m)\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0] || null;
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = u.searchParams.get("v");
      if (!id) {
        const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/);
        id = m ? m[1] : null;
      }
    }
    return id && /^[\w-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function authorName(p: Profile | null | undefined): string {
  return (p?.display_name || p?.username || "player").trim();
}

export function authorHandle(p: Profile | null | undefined): string | null {
  return p?.username ? `@${p.username}` : null;
}
