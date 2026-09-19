import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { getMyDecks, getTournament } from "@/lib/tournament/queries";
import { decksRequired, fill, tournamentBuilderKey } from "@/lib/tournament/types";
import { submitDeckCodes } from "@/lib/tournament/actions";
import { builderLabels, builderPool } from "@/lib/builderLabels";
import { DeckBuilder } from "@/components/DeckBuilder";
import { TournamentDecksForm } from "@/components/TournamentDecksForm";
import { contactEmail } from "@/components/Footer";

type Params = Promise<{ locale: string; slug: string }>;

/**
 * Mazzi per un torneo: solo iscritti, finché le iscrizioni sono aperte. Il deck builder è "preimpostato" con le
 * regole del torneo (libero o Conquest con N mazzi e carte diverse minime) e consegna i codici con una Server
 * Action; in fondo resta il modulo con i codici incollati. Pagina dinamica (sessione).
 */
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
  const required = decksRequired(t);
  const tid = t.id;
  const submit = async (list: string[]) => {
    "use server";
    return submitDeckCodes(tid, list);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={back} className="text-chalk-muted hover:text-chalk">
          ← {t.name}
        </Link>
      </p>
      <p className="mt-6 kicker text-mint">
        {x.kicker} · {t.tag}
      </p>
      <h1 className="mt-2 text-4xl font-extrabold text-sky sm:text-5xl">{x.deckPage.title}</h1>
      <p className="mt-3 text-pale-muted">
        {x.deckModes[t.deck_mode]}
        {t.deck_mode === "conquest" ? ` · ${fill(x.conquestRule, { n: t.conquest_decks, min: t.conquest_min_different })}` : ""} · {fill(x.deckPage.required, { n: required })}
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
          <>
            <p className={`mb-4 text-sm font-semibold ${codes.length ? "text-good" : "text-gold"}`}>{codes.length ? x.decksSubmitted : x.decksMissing}</p>
            <p className="mb-4 max-w-3xl text-sm text-pale-muted">{x.deckPage.builderIntro}</p>
            <DeckBuilder
              pool={builderPool(locale, d)}
              contactEmail={contactEmail}
              shareBase={`${siteUrl}${href(locale, "/deck-builder")}`}
              publishHref={href(locale, "/decks/publish")}
              labels={builderLabels(d)}
              preset={{ mode: t.deck_mode === "conquest" ? "tournament" : "single", deckCount: required, minDifferent: t.conquest_min_different, storageKey: tournamentBuilderKey(t.tag) }}
              onSubmit={submit}
              submitLabels={{ submit: x.deckPage.builderSubmit, submitting: x.deckPage.builderSubmitting, saved: x.deckPage.builderSaved, incomplete: x.deckPage.builderIncomplete, errors: x.errors }}
            />
            <details className="mt-8">
              <summary className="cursor-pointer text-sm text-pale-muted hover:text-pale">{x.deckPage.codesAdvanced}</summary>
              <div className="mt-3">
                <TournamentDecksForm locale={locale} tournamentId={t.id} required={required} initialCodes={codes} labels={x} builderHref={href(locale, "/deck-builder")} backHref={back} />
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
