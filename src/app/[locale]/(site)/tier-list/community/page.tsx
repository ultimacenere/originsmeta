import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { getCard } from "@/lib/data/cards";
import { TIERS, tierTone, type Tier, type TierKind } from "@/lib/tiercode";
import { byTier, communityScores, communityTierCount, type CommunityTierScore } from "@/lib/community/tierlists";
import { CardChip } from "@/components/CardChip";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { TierListNav } from "@/components/TierListNav";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

/*
  Tier list della community (23/09/2026, §1 punto 27.1 della KB: "le tier list create dagli utenti popoleranno
  la tier list di community"). Fonte: le tier list che gli iscritti salvano da /tier-list/create, mediate dalla
  vista `tier_card_scores` di Supabase. Tenuta separata da /tier-list, che aspetta i risultati dei tornei
  ufficiali: due fonti diverse non possono stare nella stessa pagina.

  La pagina legge Supabase, quindi è in ISR come /decks: si rigenera al massimo ogni 5 minuti e subito dopo
  ogni salvataggio (le Server Action delle tier list chiamano revalidatePath su questo percorso).
*/
export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/tier-list/community", dict.tier.community.title, dict.tier.community.description);
}

export default async function CommunityTierListPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const t = d.tier.community;
  const kinds: { id: TierKind; title: string; text: string }[] = [
    { id: "legendaries", title: d.tier.sections.legendaries.title, text: d.tier.sections.legendaries.text },
    { id: "cards", title: d.tier.sections.cards.title, text: d.tier.sections.cards.text },
  ];
  const [legendaryScores, cardScores, legendaryLists, cardLists] = await Promise.all([
    communityScores("legendaries"),
    communityScores("cards"),
    communityTierCount("legendaries"),
    communityTierCount("cards"),
  ]);
  const scores: Record<TierKind, CommunityTierScore[]> = { legendaries: legendaryScores, cards: cardScores };
  const counts: Record<TierKind, number> = { legendaries: legendaryLists, cards: cardLists };
  const total = legendaryLists + cardLists;

  /** Una voce della fascia: la carta con la sua media e quante persone l'hanno classificata. */
  const entry = (s: CommunityTierScore) => {
    const card = getCard(s.slug);
    if (!card) return null;
    return (
      <span key={s.slug} className="inline-flex flex-col items-start">
        <CardChip slug={s.slug} locale={locale} />
        <span className="mt-0.5 pl-1 font-mono text-[10px] text-pale-muted">
          {s.avg.toFixed(1)} · {s.votes === 1 ? t.votesOne : t.votesMany.replace("{n}", String(s.votes))}
        </span>
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.tier.title, path: href(locale, "/tier-list") },
            { name: t.h1, path: href(locale, "/tier-list/community") },
          ]),
          collectionPage({
            locale,
            path: href(locale, "/tier-list/community"),
            name: t.title,
            description: t.description,
            items: kinds.map((k) => ({ name: k.title, path: `${href(locale, "/tier-list/community")}#${k.id}` })),
            about: videoGameId,
          }),
        ]}
      />
      {/* anteprima delle carte al passaggio del mouse: la tiene dentro la finestra ai bordi */}
      <CardMentionEdges />
      <p className="kicker text-mint">{d.nav.tierList}</p>
      <h1 className="t-page mt-2">{t.h1}</h1>
      <TierListNav locale={locale} dict={d} current="community" />
      <p className="mt-4 max-w-3xl text-chalk-muted">{t.intro}</p>

      {total === 0 ? (
        /* Nessuna tier list salvata: una pagina vuota non serve a nessuno, l'invito sì. */
        <div className="felt-panel-mint mt-8 flex max-w-3xl flex-wrap items-center gap-4 p-6">
          <p className="min-w-0 flex-1 basis-64 text-pale">{t.empty}</p>
          <Link href={href(locale, "/tier-list/create")} className="btn btn-primary max-sm:w-full">
            {t.emptyCta} →
          </Link>
        </div>
      ) : (
        kinds.map((kind) => {
          const rows = byTier(scores[kind.id]);
          const n = counts[kind.id];
          return (
            <section key={kind.id} id={kind.id} className="mt-12 scroll-mt-24">
              <h2 className="t-section">{kind.title}</h2>
              <p className="mt-1 max-w-2xl text-chalk-muted">
                {kind.text} {n === 1 ? t.countOne : t.countMany.replace("{n}", String(n))}
              </p>
              {/* Niente overflow-hidden: taglierebbe l'anteprima della carta che si apre sopra la riga. */}
              <div className="mt-5 rounded-xl border border-felt-line">
                {TIERS.map((tier: Tier, i) => (
                  <div key={tier} className={`grid grid-cols-[64px_minmax(0,1fr)] ${i < TIERS.length - 1 ? "border-b border-felt-line/70" : ""}`}>
                    <div
                      className={`flex items-center justify-center font-display text-2xl font-extrabold ${tierTone[tier]} ${i === 0 ? "rounded-tl-[11px]" : ""} ${
                        i === TIERS.length - 1 ? "rounded-bl-[11px]" : ""
                      }`}
                    >
                      {tier}
                    </div>
                    <div
                      className={`flex min-h-16 min-w-0 flex-wrap items-start gap-2 bg-felt-deep/60 p-3 ${i === 0 ? "rounded-tr-[11px]" : ""} ${
                        i === TIERS.length - 1 ? "rounded-br-[11px]" : ""
                      }`}
                    >
                      {rows[tier].length ? rows[tier].map(entry) : <span className="self-center font-mono text-xs text-chalk-muted/60">—</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}

      <p className="mt-10 max-w-3xl text-sm text-chalk-muted">{t.disclaimer}</p>
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href={href(locale, "/tier-list")} className="link-mint font-bold">
          {t.officialLink} →
        </Link>
        <Link href={href(locale, "/tier-list/create")} className="link-mint font-bold">
          {d.tier.makerCta} →
        </Link>
      </div>
    </div>
  );
}
