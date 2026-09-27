import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href, localeNames, locales } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { getGuideForEdit, guideRoleOf } from "@/lib/community/guideQueries";
import { guidePool } from "@/lib/community/guidePool";
import { deleteCommunityGuide, setCommunityGuideStatus } from "@/lib/community/guideActions";
import { communityGuideLabels, guideEditorLabels } from "@/lib/communityGuideLabels";
import { deckLinks, deckVideos } from "@/lib/videos";
import { videoFormLabels } from "@/lib/videoLabels";
import { CommunityGuideEditor } from "@/components/guides/CommunityGuideEditor";
import { ConfirmButton } from "@/components/ConfirmButton";

type Params = Promise<{ locale: string; slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";
/** Dopo una modifica di una guida pubblicata la traduzione delle parti cambiate si rifà dentro `after()` (vedi /guides/new). */
export const maxDuration = 300;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await resolveLocale(params);
  const L = communityGuideLabels[locale];
  return { ...pageMeta(locale, `/guides/community/${slug}/edit`, L.editTitle, L.newDescription), robots: { index: false, follow: false } };
}

/**
 * Modifica di una guida della community (pacchetto GUIDE, 27/09/2026): per il proprietario (bozze e pubblicate; una
 * nascosta dallo staff si vede ma non si salva) e per lo staff, che da qui corregge una guida nascosta (resta nascosta)
 * e la rimette online. Le policy
 * RLS mostrano bozze e nascoste solo al proprietario e allo staff: a chiunque altro la pagina risponde 404.
 */
export default async function EditGuidePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const L = communityGuideLabels[locale];
  const { supabase, user } = await currentUser();
  if (!supabase) notFound();
  const path = href(locale, `/guides/community/${slug}/edit`);
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(path)}`);

  const [{ status, guide }, role] = await Promise.all([getGuideForEdit(supabase, slug), guideRoleOf(supabase, user.id)]);
  if (status === "missing") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="card-night p-6 text-pale-muted">{L.unavailable}</p>
      </div>
    );
  }
  if (!guide || (guide.owner !== user.id && !role.staff)) notFound();
  const saved = (await searchParams).saved === "1";
  const publicHref = href(locale, `/guides/community/${guide.slug}`);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={`${href(locale, "/account")}#guides`} className="text-chalk-muted hover:text-chalk">
          ← {d.community.account.title}
        </Link>
      </p>
      <h1 className="t-page mt-4">{L.editTitle}</h1>
      <p className="mt-3 break-words text-chalk-muted">
        {guide.status === "published" ? (
          <Link href={publicHref} className="text-mint underline-offset-2 hover:underline">
            {guide.title} →
          </Link>
        ) : (
          guide.title
        )}
      </p>
      <div className="mt-8">
        <CommunityGuideEditor
          locale={locale}
          mode="edit"
          initial={{
            id: guide.id,
            status: guide.status,
            lang: guide.lang,
            title: guide.title,
            summary: guide.summary,
            sections: guide.sections,
            category: guide.category,
            cards: guide.cards,
            cover_preset: guide.cover_preset,
            // video e risorse riletti con le regole della pagina: salvando non si perde nulla di valido
            videos: deckVideos(guide).map((v) => ({ url: v.url, ...(v.start ? { start: v.start } : {}), ...(v.title ? { title: v.title } : {}) })),
            links: deckLinks(guide).map((l) => ({ label: l.label, url: l.url })),
          }}
          labels={guideEditorLabels(locale)}
          mediaLabels={videoFormLabels(locale)}
          categories={Object.entries(d.guides.categories)}
          langs={locales.map((l) => [l, localeNames[l]])}
          pool={guidePool()}
          justSaved={saved}
          staff={role.staff}
        />
      </div>

      {/* Fuori dal modulo (niente moduli annidati): eliminazione e, per lo staff, nascondere e rimettere online */}
      <div className="mt-10 flex flex-wrap items-center gap-2 border-t-2 border-night-3 pt-6">
        {/* solo su una guida pubblicata (Nascondi) o nascosta (Rimetti online): mai su una bozza, che non è ancora uscita */}
        {role.staff && guide.status !== "draft" ? (
          <form action={setCommunityGuideStatus}>
            <input type="hidden" name="id" value={guide.id} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="status" value={guide.status === "hidden" ? "published" : "hidden"} />
            <input type="hidden" name="back" value={path} />
            <button type="submit" className="btn btn-ink text-xs">
              {guide.status === "hidden" ? L.owner.unhide : L.owner.hide}
            </button>
          </form>
        ) : null}
        <form action={deleteCommunityGuide}>
          <input type="hidden" name="id" value={guide.id} />
          <input type="hidden" name="locale" value={locale} />
          <ConfirmButton label={L.owner.delete} confirm={L.owner.confirmDelete} className="btn btn-danger text-xs" />
        </form>
      </div>
    </div>
  );
}
