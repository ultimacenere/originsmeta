import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href, localeNames, locales } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { guideRoleOf } from "@/lib/community/guideQueries";
import { communityGuideLabels, guideEditorLabels } from "@/lib/communityGuideLabels";
import { videoFormLabels } from "@/lib/videoLabels";
import { guidePool } from "@/lib/community/guidePool";
import { CommunityGuideEditor } from "@/components/guides/CommunityGuideEditor";

type Params = Promise<{ locale: string }>;

/** Pagina privata e dinamica: dipende da chi ha fatto l'accesso e dal suo ruolo. */
export const dynamic = "force-dynamic";
/** Dopo la pubblicazione la guida si traduce dentro `after()`: la funzione deve vivere abbastanza (come /decks/publish). */
export const maxDuration = 120;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = communityGuideLabels[locale];
  return { ...pageMeta(locale, "/guides/new", L.newTitle, L.newDescription), robots: { index: false, follow: false } };
}

/**
 * "Scrivi una guida" (pacchetto GUIDE, 27/09/2026): il modulo di scrittura per chi ha un ruolo che pubblica le guide
 * (Autore, Creator, Pro, Staff, admin: `canPublishGuides`). Chi non ha il ruolo trova il perché e il modulo "Mandaci la
 * tua guida"; chi non ha fatto l'accesso va al login e torna qui.
 */
export default async function NewGuidePage({ params }: { params: Params }) {
  const { locale, dict: d } = await resolveLocale(params);
  const L = communityGuideLabels[locale];
  const { supabase, user } = await currentUser();
  if (!supabase) notFound();
  const path = href(locale, "/guides/new");
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(path)}`);
  const role = await guideRoleOf(supabase, user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">
        <Link href={href(locale, "/guides")} className="hover:underline">
          {d.nav.guides}
        </Link>
      </p>
      <h1 className="t-page mt-2">{L.newTitle}</h1>
      {role.canPublish ? (
        <>
          <p className="mt-4 max-w-3xl text-chalk-muted">{L.newIntro}</p>
          <div className="mt-8">
            <CommunityGuideEditor
              locale={locale}
              mode="create"
              labels={guideEditorLabels(locale)}
              mediaLabels={videoFormLabels(locale)}
              categories={Object.entries(d.guides.categories)}
              langs={locales.map((l) => [l, localeNames[l]])}
              pool={guidePool()}
            />
          </div>
        </>
      ) : (
        <section className="card-night mt-8 p-6">
          <h2 className="t-item">{L.notAllowed.title}</h2>
          <p className="mt-2 text-pale-muted">{L.notAllowed.text}</p>
          <p className="mt-4">
            <Link href={href(locale, "/guides/submit")} className="btn btn-primary">
              {L.notAllowed.button} →
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
