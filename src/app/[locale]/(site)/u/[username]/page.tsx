import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { archetypeLabels } from "@/lib/data/decks";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { getCard, patchAt, patchLabel } from "@/lib/data/cards";
import { authors } from "@/lib/data/authors";
import { getProfileByUsername, listDecksByOwner } from "@/lib/community/queries";
import { countEntries, listPublicTierLists } from "@/lib/community/tierlists";
import {
  communityPageLabels,
  dropHreflang,
  editorialAuthor,
  fillLabel,
  profileDescription,
  profileIndexable,
  profileTitle,
  type ProfileFacts,
} from "@/lib/community/deckQuality";
import { authorName } from "@/lib/community/util";
import { communityPerson, communityProfilePage } from "@/lib/jsonld/deck";
import { Avatar } from "@/components/AccountMenu";
import { CardArt } from "@/components/CardChip";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";
import { getProfileShowcase } from "@/lib/community/creators";
import { isCreatorBadge } from "@/lib/community/profileLinks";
import { creatorLabels } from "@/lib/creatorLabels";
import { ProfileShowcase } from "@/components/ProfileShowcase";
import { CreatorTournaments } from "@/components/CreatorTournaments";
import { StaffMessageLink } from "@/components/inbox/InboxIndicator";

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

/**
 * Profilo, mazzi e tier list di un iscritto, e i fatti che ne derivano: li usano sia i metadati sia la pagina.
 * Le letture passano dalla cache dei dati di Next, quindi chiamarla due volte non raddoppia le query.
 * Un errore del database si lancia (queries.ts, DECKS-12): la rigenerazione fallisce e resta la pagina di prima.
 */
async function loadProfile(username: string) {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;
  // Le due letture lanciano con un errore (DECKS-12, `rowsOrThrow`): un profilo "senza mazzi" o "senza tier list" per
  // un guasto di rete non finisce in cache. I tipi delle tier list (title, description, noindex) si ricavano dalla
  // lettura completa, una per tipo e già in ordine di tipo (revisione dell'integrazione dell'Ondata 2: prima una
  // seconda lettura dei soli tipi, quando `listPublicTierLists` trasformava ancora un errore in una lista vuota).
  const [decks, tierLists] = await Promise.all([listDecksByOwner(profile.id), listPublicTierLists(profile.id)]);
  const tierKinds = [...new Set(tierLists.map((t) => t.kind))];
  const name = authorName(profile);
  // Le Leggendarie dei mazzi, dal più recente e senza doppioni (anche quelle scritte a mano, fuori dal database)
  const legendaries = [
    ...new Set(decks.flatMap((deck) => (deck.legendary ? [getCard(deck.legendary)?.name ?? deck.custom_cards.find((x) => x.slug === deck.legendary)?.name ?? ""] : [])).filter(Boolean)),
  ];
  const facts: ProfileFacts = { name, decks: decks.length, legendaries, tierLists: tierKinds.length, tierKinds };
  // L'autore editoriale dietro l'account, se authors.ts lo dichiara (nome utente o mazzi: Davdas è luigidavdasragoni)
  const editorial = editorialAuthor(
    authors,
    decks.map((deck) => deck.slug),
    profile.username,
  );
  return { profile, decks, tierLists, name, facts, editorial };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { username } = await params;
  const { locale } = await resolveLocale(params);
  const data = await loadProfile(username);
  if (!data) return {};
  // Title e description dai dati (DECKS-09, 25/09/2026: prima una frase fissa di 93–104 caratteri che parlava di tier
  // list anche a chi non ne ha). Un profilo senza mazzi né tier list è una pagina vuota: noindex e senza hreflang
  // (`pageMeta` con `noindex` li dichiarerebbe comunque, `dropHreflang`), e resta fuori dalla sitemap (`listPublicProfiles`).
  const indexable = profileIndexable(data.facts);
  const meta = pageMeta(locale, `/u/${data.profile.username}`, profileTitle(data.facts, locale), profileDescription(data.facts, locale), undefined, {
    noindex: !indexable,
  });
  return indexable ? meta : dropHreflang(meta);
}

/** Avatar per i dati strutturati: solo un indirizzo assoluto http(s), come lo salvano Discord e Supabase. */
function avatarUrl(url: string | null | undefined): string | undefined {
  return url && /^https?:\/\//.test(url) ? url : undefined;
}

export default async function PublicProfilePage({ params }: { params: Params }) {
  const { username } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const c = d.community;
  const p = c.profile;
  const data = await loadProfile(username);
  if (!data) notFound();
  const { profile, decks, tierLists, name, editorial } = data;
  const L = communityPageLabels[locale];
  const badge = profile.badge && profile.badge !== "community" ? profile.badge : null;
  const path = href(locale, `/u/${profile.username}`);
  const pageUrl = `${siteUrl}${path}`;
  // Stessa Person della firma dei suoi mazzi (src/lib/jsonld/deck.ts: `${siteUrl}/#user-<username>`, o per un autore
  // editoriale la Person della sua pagina autore, `${siteUrl}/#person-<slug>`); qui con nome utente, avatar e il nome
  // mostrato nella pagina quando è diverso da quello della Person.
  const personName = editorial?.name ?? name;
  const alternateNames = [...new Set([profile.username, name])].filter((n): n is string => Boolean(n) && n !== personName);
  const image = avatarUrl(profile.avatar_url);
  // Bio, canali e lingue (pacchetto CREATOR, 26/09/2026); per chi ha un tag autore i canali sono i sameAs della Person.
  // Non per un autore editoriale: la sua Person è quella di /authors, con i contatti verificati di authors.ts, e i link
  // scritti dall'utente la cambierebbero da una pagina all'altra.
  const showcase = await getProfileShowcase(profile.id);
  const creator = isCreatorBadge(profile.badge);
  const sameAs = creator && !editorial && showcase?.links.length ? showcase.links.map((l) => l.url) : [];
  const person = communityPerson({
    locale,
    username: profile.username,
    name,
    editorial,
    extra: {
      ...(profile.username ? { identifier: profile.username } : {}),
      ...(alternateNames.length ? { alternateName: alternateNames.length === 1 ? alternateNames[0] : alternateNames } : {}),
      ...(image ? { image } : {}),
      ...(sameAs.length ? { sameAs } : {}),
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.decks.title, path: href(locale, "/decks") },
            { name, path },
          ]),
          communityProfilePage({ locale, pageUrl, name, person, created: profile.created_at, decks: decks.length }),
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
          {/* Chi pubblica mazzi ed è anche un autore del sito (DECKS-10 e MQ-13, 25/09/2026): link alla sua pagina
              /authors, con il nome completo. Prima le due pagine non si collegavano e nel grafo erano due persone. */}
          {editorial ? (
            <p className="mt-3 text-sm">
              <Link href={href(locale, `/authors/${editorial.slug}`)} className="link-mint font-bold">
                {fillLabel(L.authorPage, { name: editorial.name })} →
              </Link>
            </p>
          ) : null}
          <ProfileShowcase showcase={showcase} username={profile.username ?? ""} name={name} badge={profile.badge} locale={locale} />
          {/* "Scrivi a questo utente": solo per lo staff, deciso nel browser (la pagina è ISR); casella messaggi, pacchetto INBOX */}
          <StaffMessageLink locale={locale} username={profile.username} profileId={profile.id} />
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

      {/* Vetrina del creator (pacchetto CREATOR, 26/09/2026): i tornei pubblici che organizza */}
      {creator ? <CreatorTournaments organizerId={profile.id} locale={locale} dict={d} /> : null}

      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        {creator ? (
          <Link href={href(locale, "/creators")} className="link-mint font-bold">
            {creatorLabels[locale].profile.directoryLink} →
          </Link>
        ) : null}
        <Link href={href(locale, "/decks")} className="link-mint font-bold">
          {d.tier.decksCta} →
        </Link>
        {/* la tier list principale, con l'ancora che la mappa delle query le assegna ("Origins TCG tier list", C14) */}
        <Link href={href(locale, "/tier-list")} className="link-mint font-bold">
          {L.tierList} →
        </Link>
        <Link href={href(locale, "/tier-list/community")} className="link-mint font-bold">
          {d.tier.navCommunity} →
        </Link>
      </div>
    </div>
  );
}
