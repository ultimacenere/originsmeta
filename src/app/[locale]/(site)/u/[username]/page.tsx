import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, siteUrl } from "@/lib/i18n";
import { pageMeta, pageTitleWith, resolveLocale } from "@/lib/page";
import { archetypeLabels } from "@/lib/data/decks";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { getCard, patchAt, patchLabel } from "@/lib/data/cards";
import { getProfileByUsername, listDecksByOwner } from "@/lib/community/queries";
import { countEntries, listPublicTierLists } from "@/lib/community/tierlists";
import { authorName } from "@/lib/community/util";
import { Avatar } from "@/components/AccountMenu";
import { CardArt } from "@/components/CardChip";
import { JsonLd, breadcrumbs, organizationId } from "@/components/JsonLd";

type Params = Promise<{ locale: string; username: string }>;

/*
  Pagina pubblica di un iscritto (23/09/2026, §1 punto 27.5 della KB: "mazzi e tier list create visibili nel
  profilo di chi le ha create… il profilo deve avere una sua utilità"). /account resta il pannello privato,
  che vede solo il proprietario; questa è la pagina che si può mandare a qualcuno: i mazzi pubblicati e le
  tier list salvate di quella persona.

  Non è la pagina autore editoriale (/authors), che resta per chi firma news e guide del sito.
  ISR come le schede dei mazzi: si rigenera al massimo ogni 5 minuti e subito dopo ogni pubblicazione.
*/
export const revalidate = 300;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { username } = await params;
  const { locale, dict } = await resolveLocale(params);
  const profile = await getProfileByUsername(username);
  if (!profile) return {};
  const name = authorName(profile);
  return pageMeta(
    locale,
    `/u/${profile.username}`,
    pageTitleWith(name, dict.community.profile.kicker),
    dict.community.profile.description.replace("{name}", name),
  );
}

export default async function PublicProfilePage({ params }: { params: Params }) {
  const { username } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const c = d.community;
  const p = c.profile;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [decks, tierLists] = await Promise.all([listDecksByOwner(profile.id), listPublicTierLists(profile.id)]);
  const name = authorName(profile);
  const badge = profile.badge && profile.badge !== "community" ? profile.badge : null;
  const path = href(locale, `/u/${profile.username}`);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.decks.title, path: href(locale, "/decks") },
            { name, path },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            url: `${siteUrl}${path}`,
            inLanguage: locale,
            isPartOf: { "@id": `${siteUrl}/${locale}#website` },
            publisher: { "@id": organizationId },
            mainEntity: { "@type": "Person", name, identifier: profile.username ?? undefined },
          },
        ]}
      />
      <p className="kicker text-mint">{p.kicker}</p>

      <section className="card-night mt-4 flex flex-wrap items-center gap-4 p-6">
        <Avatar profile={profile} name={name} size={64} />
        <div className="min-w-0 flex-1 basis-56">
          <h1 className="t-page leading-tight">{name}</h1>
          <p className="mt-1 font-mono text-xs text-pale-muted">
            {profile.username ? `@${profile.username}` : ""}
            {profile.created_at ? ` · ${p.memberSince} ${formatDate(locale, profile.created_at.slice(0, 10))}` : ""}
          </p>
          {badge ? (
            <p className="mt-3">
              <span className={`${badgePill} ${badgeStyle[badge] ?? badgeStyle.community}`}>{c.badges[badge as keyof typeof c.badges] ?? badge}</span>
            </p>
          ) : null}
        </div>
        <p className="font-mono text-xs text-pale-muted">
          {decks.length} {decks.length === 1 ? p.deckOne : p.deckMany} · {tierLists.length} {tierLists.length === 1 ? p.tierOne : p.tierMany}
        </p>
      </section>

      {/* I mazzi pubblicati, dal più recente, con data di creazione e versione del gioco (richiesta del 23/09/2026) */}
      <section className="mt-10">
        <h2 className="t-section">{p.decksTitle}</h2>
        {decks.length === 0 ? (
          <p className="card-night mt-4 p-6 text-pale-muted">{p.noDecks}</p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {decks.map((deck) => {
              const legendary = deck.legendary ? getCard(deck.legendary) : undefined;
              const patch = patchAt(deck.created_at);
              return (
                <li key={deck.id} className="card-night flex gap-4 p-5">
                  {legendary ? (
                    <Link href={href(locale, `/cards/${legendary.slug}`)} className="shrink-0" title={legendary.name}>
                      <CardArt card={legendary} full className="!h-[110px] !w-[78px] text-lg" />
                    </Link>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <Link href={href(locale, `/decks/community/${deck.slug}`)} className="t-item block leading-tight hover:text-mint">
                      {deck.name}
                    </Link>
                    <p className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="stat-pill bg-sky text-[11px] text-ink">{archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype}</span>
                      {patch ? (
                        <span className="stat-pill bg-night-3 text-[11px] text-pale">
                          {d.common.patch} {patchLabel(patch, locale)}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-2 font-mono text-xs text-pale-muted">
                      {d.common.createdOn} {formatDate(locale, deck.created_at.slice(0, 10))}
                      {deck.rating?.votes ? ` · ★ ${deck.rating.avg.toFixed(1)} (${deck.rating.votes})` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Le tier list salvate: una per tipo, aperte nello strumento con il loro codice */}
      <section className="mt-12">
        <h2 className="t-section">{p.tierListsTitle}</h2>
        {tierLists.length === 0 ? (
          <p className="card-night mt-4 p-6 text-pale-muted">{p.noTierLists}</p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {tierLists.map((tl) => (
              <li key={tl.id} className="card-night flex flex-col p-5">
                <span className="stat-pill w-fit bg-sky text-[11px] font-semibold uppercase text-ink">
                  {tl.kind === "legendaries" ? d.tierMaker.tabLegendaries : d.tierMaker.tabCards}
                </span>
                <p className="t-item mt-3 leading-tight">{tl.title || d.tierMaker.h1}</p>
                <p className="mt-1 font-mono text-xs text-pale-muted">
                  {countEntries(tl.entries)} {c.account.rankedCards} · {d.common.updated} {formatDate(locale, tl.updated_at.slice(0, 10))}
                </p>
                <p className="mt-4">
                  {/* il codice TL1 nell'hash apre questa lista nello strumento, senza account */}
                  <a href={`${href(locale, "/tier-list/create")}#${tl.code}`} className="btn btn-ink text-xs">
                    {p.openTierList}
                  </a>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link href={href(locale, "/decks")} className="link-mint font-bold">
          {d.tier.decksCta} →
        </Link>
        <Link href={href(locale, "/tier-list/community")} className="link-mint font-bold">
          {d.tier.navCommunity} →
        </Link>
      </div>
    </div>
  );
}
