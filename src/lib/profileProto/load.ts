import { cache } from "react";
import { getCard, getCardByKey, patchAt, patchOrder, patches, type Card, type PatchId } from "@/lib/data/cards";
import { getProfileByUsername, listDecksByOwner, listDeckVersions } from "@/lib/community/queries";
import { listPublicTierLists, countEntries } from "@/lib/community/tierlists";
import { listGuidesByOwner } from "@/lib/community/guideQueries";
import { listComicsByOwner } from "@/lib/community/comicQueries";
import { getProfileShowcase, type Showcase } from "@/lib/community/creators";
import { getProfileVetrina } from "@/lib/community/showcaseQueries";
import type { Vetrina } from "@/lib/community/showcase";
import { readAchievementFacts, readPublicStats } from "@/lib/community/achievementQueries";
import { earnedAchievements, type Earned, type LocalFacts, type PublicStats, type RemoteFacts } from "@/lib/community/achievements";
import { isShowcaseBadge, normalizeBadge, type Badge } from "@/lib/community/badges";
import { deckIndexable } from "@/lib/community/deckQuality";
import { deckCardsDate } from "@/lib/community/deckVersions";
import { deckArtUrl } from "@/lib/community/deckArt";
import { avatarSrc } from "@/lib/community/profileMedia";
import { authorName } from "@/lib/community/util";
import { readWinrate } from "@/lib/community/trackerStatsQueries";
import { deckListKey } from "@/lib/tracker/stats";
import { bothSides } from "@/lib/tracker/snapshot";
import { isTheoryDeck } from "@/lib/theoryCraft";
import { supabaseUrl } from "@/lib/supabase/env";

/*
  Prototipi della pagina utente (26/11/2026, rework chiesto da Pierluigi: "3 prototipi" veri, cliccabili, sui profili
  reali). Una sola lettura, in sola lettura con la chiave pubblica, per i tre prototipi: tutto quello che il sito sa già
  di un iscritto, più i numeri aggregati del Tracker (mai i giocatori: `players` qui non esce). Le partite personali del
  Tracker NON sono pubbliche (RLS: le legge solo il proprietario), quindi qui non ci sono: dove un prototipo le mostra,
  sono dati di esempio dichiarati.
*/

export type ProtoCount = { games: number; wins: number };

export type ProtoDeck = {
  id: string;
  slug: string;
  name: string;
  legendary: Card | null;
  /** le 12 carte base (slug, con le copie), le carte create a mano escluse */
  cards: Card[];
  archetype: string;
  createdAt: string;
  /** data dell'ultimo cambio di carte (o della pubblicazione): quella che decide la patch e l'ordine */
  cardsAt: string;
  patch: PatchId | null;
  version: number;
  rating: { avg: number; votes: number };
  fullGuide: boolean;
  theory: boolean;
  /** artwork caricato da un Creator o dallo Staff, se c'è */
  artUrl: string | null;
  /** partite registrate dal Tracker da chiunque giochi le stesse 13 carte, nella patch delle statistiche (aggregato pubblico) */
  winrate: ProtoCount | null;
  /** le versioni chiuse (le carte di prima), dalla più recente */
  versions: { version: number; startedAt: string; endedAt: string; legendary: string | null; cards: string[] }[];
};

export type ProtoData = {
  username: string;
  name: string;
  badge: Badge;
  showcase: boolean;
  createdAt: string;
  avatarUrl: string | null;
  vetrina: Vetrina | null;
  channels: Showcase | null;
  decks: ProtoDeck[];
  tierLists: { id: string; kind: string; title: string | null; createdAt: string; updatedAt: string; ranked: number; code: string; entries: Record<string, string[]> | null }[];
  guides: { slug: string; title: string; createdAt: string }[];
  comics: number;
  earned: Earned[];
  remote: RemoteFacts | null;
  local: LocalFacts;
  /** "Mostra i numeri" acceso dal creator: visite, copie del codice, voti (stime) */
  publicStats: PublicStats | null;
  /** numeri aggregati del Tracker della patch delle statistiche: partite totali e Leggendarie contate dai due lati */
  meta: { patch: PatchId; games: number; legendaries: (ProtoCount & { card: Card })[] } | null;
};

const strip = (s: { games: number; wins: number }): ProtoCount => ({ games: s.games, wins: s.wins });

export const loadProto = cache(async (username: string): Promise<ProtoData | null> => {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;
  const badge = normalizeBadge(profile.badge);
  const showcase = isShowcaseBadge(badge);
  const [decksRaw, tierRaw, guidesRaw, comicsRaw, channels, vetrina, remote, publicStats, winrate] = await Promise.all([
    listDecksByOwner(profile.id),
    listPublicTierLists(profile.id),
    listGuidesByOwner(profile.id, 24),
    listComicsByOwner(profile.id, 24),
    getProfileShowcase(profile.id),
    showcase ? getProfileVetrina(profile.id) : Promise.resolve(null),
    readAchievementFacts(profile.id),
    showcase ? readPublicStats(profile.id) : Promise.resolve(null),
    readWinrate().catch(() => null),
  ]);
  const stats = winrate && winrate.status === "ok" ? winrate.data : null;
  const lists = new Map((stats?.lists ?? []).map((l) => [l.list, strip(l)]));
  const versions = await Promise.all(decksRaw.slice(0, 24).map((d) => listDeckVersions(d.id).catch(() => [])));

  const decks: ProtoDeck[] = decksRaw.map((d, i) => {
    const key = deckListKey({ legendary: d.legendary, cards: d.cards }, (s) => getCard(s)?.key);
    const cardsAt = deckCardsDate(d);
    return {
      id: d.id,
      slug: d.slug,
      name: d.name,
      legendary: d.legendary ? getCard(d.legendary) ?? null : null,
      cards: d.cards.map((s) => getCard(s)).filter((c): c is Card => Boolean(c)),
      archetype: d.archetype,
      createdAt: d.created_at,
      cardsAt,
      patch: patchAt(cardsAt) ?? null,
      version: d.version ?? 1,
      rating: d.rating ?? { avg: 0, votes: 0 },
      fullGuide: deckIndexable(d),
      theory: isTheoryDeck(d),
      artUrl: deckArtUrl(d, supabaseUrl),
      winrate: key ? lists.get(key) ?? null : null,
      versions: (versions[i] ?? []).map((v) => ({ version: v.version, startedAt: v.started_at, endedAt: v.ended_at, legendary: v.legendary, cards: v.cards })),
    };
  });

  const tierLists = tierRaw.map((t) => ({
    id: t.id,
    kind: t.kind,
    title: t.title ?? null,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    ranked: countEntries(t.entries),
    code: t.code,
    entries: (t.entries as Record<string, string[]> | null) ?? null,
  }));
  const local: LocalFacts = {
    memberSince: profile.created_at,
    decks: decksRaw.map((d) => ({ created_at: d.created_at, votes: d.rating?.votes ?? 0, avg: d.rating?.avg ?? 0, fullGuide: deckIndexable(d) })),
    tierLists: tierLists.map((t) => ({ created_at: t.createdAt, ranked: t.ranked })),
  };

  let meta: ProtoData["meta"] = null;
  if (stats) {
    const both = bothSides((stats.matchups ?? []).filter((m) => getCardByKey(m.legendary) && getCardByKey(m.opponent)));
    meta = {
      patch: stats.patch,
      games: stats.overview.games,
      legendaries: both.legendaries.flatMap((l) => {
        const card = getCardByKey(l.legendary);
        return card ? [{ card, games: l.games, wins: l.wins }] : [];
      }),
    };
  }

  return {
    username: profile.username ?? username,
    name: authorName(profile),
    badge,
    showcase,
    createdAt: profile.created_at,
    avatarUrl: avatarSrc(vetrina ? { ...profile, avatar_path: vetrina.avatarPath } : profile, supabaseUrl),
    vetrina,
    channels,
    decks,
    tierLists,
    guides: guidesRaw.map((g) => ({ slug: g.slug, title: g.title, createdAt: g.created_at })),
    comics: comicsRaw.length,
    earned: earnedAchievements(local, remote),
    remote,
    local,
    publicStats,
    meta,
  };
});

/** Le patch del gioco dalla prima alla più recente, con la data: per chi racconta il profilo per patch. */
export const protoPatches = patchOrder.map((id) => ({ id, date: patches[id].date, at: patches[id].at ?? null, news: patches[id].news ?? null }));

/** I profili veri proposti nell'indice dei prototipi (pubblici, ricchi di dati o quasi vuoti). */
export const PROTO_PROFILES = [
  { username: "robip-origins", note: "Creator, 11 mazzi, numeri accesi" },
  { username: "magicofhandss", note: "Creator dalla prima settimana" },
  { username: "luigidavdasragoni", note: "Staff (Davdas)" },
  { username: "aldrymus", note: "Staff (Pierluigi)" },
  { username: "pvgpredator", note: "Community, pochi mazzi" },
] as const;
