import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { getMyDecks, getTournament } from "@/lib/tournament/queries";
import { decksRequired } from "@/lib/tournament/types";
import { TournamentDecksForm } from "@/components/TournamentDecksForm";

type Params = Promise<{ locale: string; slug: string }>;

/** Consegna dei mazzi per un torneo: solo iscritti, finché le iscrizioni sono aperte. Pagina dinamica (sessione). */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, `/tournaments/${slug}/deck`, dict.tournaments.deckPage.title, dict.tournaments.deckPage.intro), robots: { index: false, follow: false } };
}

export default async function TournamentDeckPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const x = d.tournaments;
  const path = href(locale, `/tournaments/${slug}/deck`);
  const back = href(locale, `/tournaments/${slug}`);
  const { supabase, user } = await currentUser();
  if (!supabase) return <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><p className="card-night p-6 text-pale-muted">{x.errors.disabled}</p></div>;
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(path)}`);

  const t = await getTournament(slug, supabase);
  if (!t) notFound();
  const { data: reg } = await supabase.from("tournament_players").select("status").eq("tournament_id", t.id).eq("user_id", user.id).maybeSingle();
  const registered = Boolean(reg);
  const codes = registered ? (await getMyDecks(supabase, t.id, user.id)) ?? [] : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={back} className="text-chalk-muted hover:text-chalk">
          ← {t.name}
        </Link>
      </p>
      <p className="mt-6 kicker text-mint">{x.kicker} · {t.tag}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-sky sm:text-5xl">{x.deckPage.title}</h1>
      <p className="mt-3 text-pale-muted">
        {x.deckModes[t.deck_mode]}
        {t.deck_mode === "conquest" ? ` · ${x.conquestRule.replace("{n}", String(t.conquest_decks)).replace("{min}", String(t.conquest_min_different))}` : ""}
      </p>
      <div className="mt-8">
        {!registered ? (
          <p className="card-night p-6 text-pale">
            {x.deckPage.notRegistered}{" "}
            <Link href={back} className="link-mint">
              {x.deckPage.back}
            </Link>
          </p>
        ) : t.status !== "open" ? (
          <p className="card-night p-6 text-pale">
            {x.errors.not_open}{" "}
            <Link href={back} className="link-mint">
              {x.deckPage.back}
            </Link>
          </p>
        ) : (
          <TournamentDecksForm locale={locale} tournamentId={t.id} required={decksRequired(t)} initialCodes={codes} labels={x} builderHref={href(locale, "/deck-builder")} backHref={back} />
        )}
      </div>
    </div>
  );
}
