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

type Params = Promise<{ locale: string; slug: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, `/decks/community/${slug}/edit`, dict.community.editTitle, dict.community.publishIntro), robots: { index: false, follow: false } };
}

export default async function EditDeckPage({ params }: { params: Params }) {
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
  const a = d.auth;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={href(locale, "/account")} className="text-chalk-muted hover:text-chalk">
          ← {d.community.account.title}
        </Link>
      </p>
      <h1 className="mt-4 text-4xl font-extrabold text-chalk sm:text-5xl">{d.community.editTitle}</h1>
      <p className="mt-3 text-chalk-muted">{deck.name}</p>
      <div className="mt-8">
        <PublishDeckForm
          locale={locale}
          mode="edit"
          pool={pool}
          archetypes={archetypes}
          initial={{ id: deck.id, code, name: deck.name, archetype: deck.archetype, video: deck.video_url ?? "", guide: deck.guide }}
          labels={d.community}
          builderHref={`${href(locale, "/deck-builder")}#${code}`}
          publishPath={path}
          loginLabels={{
            discord: a.discord,
            or: a.or,
            email: a.email,
            emailPlaceholder: a.emailPlaceholder,
            magicLink: a.magicLink,
            sending: a.sending,
            sent: a.sent,
            error: a.error,
            providerError: a.providerError,
            rateLimited: a.rateLimited,
            disabled: a.disabled,
            backHint: a.backHint,
          }}
        />
      </div>
    </div>
  );
}
