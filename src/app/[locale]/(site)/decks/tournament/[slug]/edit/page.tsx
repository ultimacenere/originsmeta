import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { cards } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { currentUser } from "@/lib/supabase/server";
import { getOwnDeckSet } from "@/lib/community/deckSetQueries";
import { setCodesOf } from "@/lib/community/deckSets";
import { deckSetLabels } from "@/lib/deckSetLabels";
import { loginLabels } from "@/lib/loginLabels";
import { deckVideos } from "@/lib/videos";
import { videoFormLabels } from "@/lib/videoLabels";
import { DeckSetForm, type SetPoolCard } from "@/components/DeckSetForm";

type Params = Promise<{ locale: string; slug: string }>;

export const dynamic = "force-dynamic";
/** Dopo una modifica la guida si ritraduce dentro `after()`. */
export const maxDuration = 120;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await resolveLocale(params);
  const L = deckSetLabels[locale].form;
  return { ...pageMeta(locale, `/decks/tournament/${slug}/edit`, L.editTitle, L.publishIntro), robots: { index: false, follow: false } };
}

/** Modifica di un mazzo torneo (04/10/2026): il proprietario, o un admin, con la sessione; le policy RLS fanno il resto. */
export default async function EditDeckSetPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const S = deckSetLabels[locale];
  const { supabase, user } = await currentUser();
  if (!supabase) notFound();
  const path = href(locale, `/decks/tournament/${slug}/edit`);
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(path)}`);
  const set = await getOwnDeckSet(supabase, slug);
  if (!set) notFound();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (set.owner !== user.id && (me as { role?: string | null } | null)?.role !== "admin") notFound();

  const pool: SetPoolCard[] = cards.filter((c) => c.type !== "token").map((c) => ({ slug: c.slug, name: c.name }));
  const archetypes = Object.entries(archetypeLabels).map(([id, l]) => [id, l[locale]] as [string, string]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{S.page.kicker}</p>
      <h1 className="t-page mt-2">{S.form.editTitle}</h1>
      <p className="mt-2 text-pale">{set.name}</p>
      <div className="mt-8">
        <Suspense fallback={<p className="card-night p-6 text-pale-muted">…</p>}>
          <DeckSetForm
            locale={locale}
            mode="edit"
            pool={pool}
            archetypes={archetypes}
            initial={{
              id: set.id,
              codes: setCodesOf(set.decks),
              names: set.decks.map((x) => x.name),
              archetypes: set.decks.map((x) => x.archetype),
              name: set.name,
              guide: set.guide,
              videos: deckVideos(set).map((v) => ({ url: v.url, ...(v.start ? { start: v.start } : {}), ...(v.title ? { title: v.title } : {}) })),
              links: set.links ?? [],
            }}
            labels={S.form}
            deckLetterLabel={S.page.deckLetter}
            mediaLabels={videoFormLabels(locale)}
            loginLabels={loginLabels(d)}
            builderHref={href(locale, "/deck-builder")}
            publishPath={href(locale, "/decks/tournament/publish")}
          />
        </Suspense>
      </div>
    </div>
  );
}
