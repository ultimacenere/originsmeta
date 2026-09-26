import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { cards } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { encodeOmCode } from "@/lib/deckcode";
import { currentUser } from "@/lib/supabase/server";
import type { CommunityDeck } from "@/lib/community/types";
import { PublishDeckForm, type PoolCard } from "@/components/PublishDeckForm";
import { loginLabels } from "@/lib/loginLabels";
import { withCarriedParams } from "@/lib/analytics";
import { deckLinks, deckVideos } from "@/lib/videos";

type Params = Promise<{ locale: string; slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";
/** Dopo una modifica la guida si ritraduce dentro `after()`: la funzione deve vivere abbastanza (vedi /decks/publish). */
export const maxDuration = 120;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, `/decks/community/${slug}/edit`, dict.community.editTitle, dict.community.publishIntro), robots: { index: false, follow: false } };
}

export default async function EditDeckPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const { supabase, user } = await currentUser();
  if (!supabase) notFound();
  const path = href(locale, `/decks/community/${slug}/edit`);
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(path)}`);

  // Le policy RLS mostrano i mazzi nascosti solo al proprietario (o a un admin).
  const { data } = await supabase.from("community_decks").select("*").eq("slug", slug).maybeSingle();
  const deck = data as CommunityDeck | null;
  if (!deck) notFound();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isAdmin = (me as { role?: string } | null)?.role === "admin";
  if (deck.owner !== user.id && !isAdmin) notFound();

  const pool: PoolCard[] = cards.filter((c) => c.status === "active" && c.type !== "token").map((c) => ({ slug: c.slug, name: c.name, legendary: Boolean(c.legendary) }));
  const archetypes = Object.entries(archetypeLabels).map(([id, l]) => [id, l[locale]] as [string, string]);
  const code = deck.code_om ?? encodeOmCode({ name: deck.name, legendary: deck.legendary, cards: deck.cards, customCards: deck.custom_cards });
  // Un mazzo privato non ha ancora la guida: "modificarlo" significa pubblicarlo, dal modulo apposito. Il segnale
  // dell'accesso (?om_auth=, se si arriva qui dal login) passa alla pagina di pubblicazione, che lo conta.
  if (deck.status === "draft") redirect(withCarriedParams(`${href(locale, "/decks/publish")}?deck=${encodeURIComponent(code)}&draft=${deck.id}`, await searchParams));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={href(locale, "/account")} className="text-chalk-muted hover:text-chalk">
          ← {d.community.account.title}
        </Link>
      </p>
      <h1 className="t-page mt-4">{d.community.editTitle}</h1>
      <p className="mt-3 text-chalk-muted">{deck.name}</p>
      <div className="mt-8">
        <PublishDeckForm
          locale={locale}
          mode="edit"
          pool={pool}
          archetypes={archetypes}
          initial={{
            id: deck.id,
            code,
            name: deck.name,
            archetype: deck.archetype,
            deckTypes: deck.deck_types,
            // video e risorse riletti con le regole della scheda (il vecchio video_url come primo video, se riconosciuto)
            videos: deckVideos(deck).map((v) => (v.start ? { url: v.url, start: v.start } : { url: v.url })),
            links: deckLinks(deck).map((l) => ({ label: l.label, url: l.url })),
            guide: deck.guide,
          }}
          labels={d.community}
          builderHref={`${href(locale, "/deck-builder")}#${code}`}
          publishPath={path}
          loginLabels={loginLabels(d)}
        />
      </div>
    </div>
  );
}
