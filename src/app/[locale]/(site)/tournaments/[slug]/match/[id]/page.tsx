import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { getMatch, getTournament, listMessages, listPlayers, listVisibleDecks } from "@/lib/tournament/queries";
import { SCREENSHOT_BUCKET, bestOfLabel, fill } from "@/lib/tournament/types";
import { authorName } from "@/lib/community/util";
import { decodeOmCode } from "@/lib/deckcode";
import { getCard } from "@/lib/data/cards";
import { CardChip } from "@/components/CardChip";
import { MatchRoom } from "@/components/MatchRoom";

type Params = Promise<{ locale: string; slug: string; id: string }>;

/** Stanza della partita: solo i due giocatori, l'organizzatore e gli admin. Dinamica (sessione), passa dal proxy. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, id } = await params;
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, `/tournaments/${slug}/match/${id}`, dict.tournaments.match.title, dict.tournaments.match.chatHint), robots: { index: false, follow: false } };
}

async function signedScreens(client: NonNullable<Awaited<ReturnType<typeof currentUser>>["supabase"]>, matchId: string, uid: string | null): Promise<string[]> {
  if (!uid) return [];
  const { data: files } = await client.storage.from(SCREENSHOT_BUCKET).list(`${matchId}/${uid}`, { limit: 10 });
  const paths = (files ?? []).filter((f) => f.name && !f.name.startsWith(".")).map((f) => `${matchId}/${uid}/${f.name}`);
  if (!paths.length) return [];
  const { data: signed } = await client.storage.from(SCREENSHOT_BUCKET).createSignedUrls(paths, 900);
  return (signed ?? []).map((s) => s.signedUrl).filter((u): u is string => Boolean(u));
}

export default async function MatchPage({ params }: { params: Params }) {
  const { slug, id } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const x = d.tournaments;
  const l = x.match;
  const path = href(locale, `/tournaments/${slug}/match/${id}`);
  const back = href(locale, `/tournaments/${slug}`);
  const { supabase, user } = await currentUser();
  if (!supabase) return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><p className="card-night p-6 text-pale-muted">{x.errors.disabled}</p></div>;
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(path)}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const t = await getTournament(slug, supabase);
  if (!t) notFound();
  const match = await getMatch(id, supabase);
  if (!match || match.tournament_id !== t.id) notFound();

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isAdmin = (prof as { role: string } | null)?.role === "admin";
  const side: "a" | "b" | null = match.player_a === user.id ? "a" : match.player_b === user.id ? "b" : null;
  if (side === null && t.organizer !== user.id && !isAdmin) redirect(back);

  const [players, decks, messages, screensA, screensB] = await Promise.all([
    listPlayers(t.id, supabase),
    listVisibleDecks(t.id, supabase),
    listMessages(match.id, supabase),
    signedScreens(supabase, match.id, match.player_a),
    signedScreens(supabase, match.id, match.player_b),
  ]);
  const nameOf = new Map(players.map((p) => [p.user_id, authorName(p.profile)]));
  const names = { a: match.player_a ? nameOf.get(match.player_a) ?? "?" : l.tbd, b: match.player_b ? nameOf.get(match.player_b) ?? "?" : match.status === "bye" ? "bye" : l.tbd };

  const deckBlock = (uid: string | null, title: string) => {
    if (!uid) return null;
    const row = decks.find((r) => r.user_id === uid);
    return (
      <div className="rounded-lg border-2 border-sky bg-night-2/70 p-3">
        <p className="kicker text-mint">{title}</p>
        <p className="mt-1 text-sm font-semibold text-pale">{nameOf.get(uid) ?? "?"}</p>
        {row?.codes.length ? (
          <ul className="mt-2 flex flex-col gap-2">
            {row.codes.map((code, i) => {
              const deck = decodeOmCode(code);
              const leg = deck?.legendary ? getCard(deck.legendary) : undefined;
              return (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  {leg ? <CardChip slug={leg.slug} locale={locale} /> : null}
                  <Link href={`${href(locale, "/deck-builder")}#${code}`} className="btn btn-ink text-xs">
                    {l.openDeck}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-pale-muted">{l.noDecks}</p>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={back} className="text-chalk-muted hover:text-chalk">
          ← {t.name}
        </Link>
      </p>
      <p className="mt-6 kicker text-mint">
        {x.kicker} · {t.tag} · {fill(l.round, { n: match.round })}
      </p>
      <h1 className="t-page mt-2">
        {names.a} <span className="text-pale-muted">{l.vs}</span> {names.b}
      </h1>
      <p className="mt-2 text-sm text-pale-muted">
        {x.deckModes[t.deck_mode]} · {bestOfLabel(x, t.best_of)}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {deckBlock(match.player_a, side === "a" ? l.yourDecks : side === "b" ? l.opponentDecks : names.a)}
        {deckBlock(match.player_b, side === "b" ? l.yourDecks : side === "a" ? l.opponentDecks : names.b)}
      </div>

      <div className="mt-6">
        <MatchRoom
          slug={t.slug}
          matchId={match.id}
          me={user.id}
          side={side}
          match={match}
          names={names}
          bestOf={t.best_of}
          running={t.status === "running"}
          initialMessages={messages}
          screens={{ a: screensA, b: screensB }}
          labels={x}
        />
      </div>
    </div>
  );
}
