import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { authors } from "@/lib/data/authors";
import { listPublishedDecks } from "@/lib/community/queries";
import { listCreators } from "@/lib/community/creators";
import { directoryIndexable, listedInDirectory, orderCreators } from "@/lib/community/creatorDirectory";
import { twitchLogin } from "@/lib/community/profileLinks";
import { authorName } from "@/lib/community/util";
import { dropHreflang, editorialAuthor, profileIndexable } from "@/lib/community/deckQuality";
import { creatorLabels } from "@/lib/creatorLabels";
import { contactEmail } from "@/components/Footer";
import { CreatorDirectory, type DirectoryEntry } from "@/components/CreatorDirectory";
import { JsonLd, breadcrumbs, collectionPage, memberId, personId, videoGameId } from "@/components/JsonLd";

/*
  Directory "Autori e streamer" (pacchetto CREATOR, 26/09/2026, richiesta di Pierluigi; indirizzo /creators): i profili
  con un tag autore (Autore, Influencer, Pro, Staff) che hanno compilato il profilo pubblico (una bio o un canale), con
  bio, lingue dei contenuti, canali, mazzi pubblicati e il badge LIVE di chi è in diretta su Origins TCG (caricato nel
  browser da /api/live). Nessun elenco scritto a mano: entra chi ha il tag, lo assegna lo staff (scripts/set-badge.mjs).
  Filtri per lingua e piattaforma; l'ordine è dichiarato nella pagina.
  ISR come /decks. Sotto le tre schede (`directoryIndexable`) la pagina è noindex, senza hreflang e fuori dalla sitemap
  (che conta con la stessa `listedInDirectory`, in sitemapData.ts).
  In fondo l'invito a chiedere il tag Autore (email dello staff o il modulo "Mandaci la tua guida").
*/
export const revalidate = 300;

/**
 * Profili e mazzi: le due letture sono quelle di /decks e della rotta /api/live, condivise dalla cache dei dati. Per
 * ogni autore anche gli slug dei suoi mazzi: servono a riconoscere l'autore editoriale dietro l'account (Davdas), come
 * fa la pagina /u, così i dati strutturati puntano alla stessa Person.
 */
async function loadCreators() {
  const [creators, decks] = await Promise.all([listCreators(), listPublishedDecks()]);
  const slugsOf = new Map<string, string[]>();
  for (const deck of decks) slugsOf.set(deck.owner, [...(slugsOf.get(deck.owner) ?? []), deck.slug]);
  return { creators: creators.filter(listedInDirectory), slugsOf };
}

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = creatorLabels[locale].directory;
  const { creators } = await loadCreators();
  const indexable = directoryIndexable(creators.length);
  const meta = pageMeta(locale, "/creators", L.metaTitle, L.description, undefined, { noindex: !indexable });
  return indexable ? meta : dropHreflang(meta);
}

export default async function CreatorsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const C = creatorLabels[locale];
  const L = C.directory;
  const { creators, slugsOf } = await loadCreators();
  const entries: (DirectoryEntry & { personRef: string; personName: string })[] = orderCreators(
    creators.map((c) => {
      const name = authorName(c);
      const slugs = slugsOf.get(c.id) ?? [];
      // stessa Person della pagina /u e delle schede dei mazzi: per un autore editoriale quella della sua pagina autore
      const editorial = editorialAuthor(authors, slugs, c.username);
      return {
        username: c.username,
        name,
        avatar: c.avatar_url,
        badge: c.badge,
        badgeLabel: d.community.badges[c.badge as keyof typeof d.community.badges] ?? c.badge,
        bio: c.bio,
        links: c.links,
        langs: c.contentLangs,
        kinds: [...new Set(c.links.map((l) => l.kind))],
        decks: slugs.length,
        href: href(locale, `/u/${c.username}`),
        ...(twitchLogin(c.links) ? { liveUser: c.username } : {}),
        personRef: editorial ? personId(editorial.slug) : memberId(c.username),
        personName: editorial?.name ?? name,
      };
    }),
    locale,
  );
  const indexable = directoryIndexable(entries.length);
  // Voci della lista nei dati strutturati: solo i profili /u che si indicizzano (`profileIndexable`, la regola della
  // pagina del profilo e della sitemap). Qui si conoscono i mazzi pubblicati, non le tier list: un profilo con le sole
  // tier list resta fuori dalla lista per prudenza (nella pagina c'è comunque). Senza, la directory dichiarava come
  // voci anche pagine noindex (un autore con bio e canali ma senza mazzi).
  const listItems = entries.filter((e) => profileIndexable({ decks: e.decks, tierLists: 0 }));
  const path = href(locale, "/creators");
  const mail = `mailto:${contactEmail}?subject=${encodeURIComponent(L.inviteMailSubject)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: L.h1, path },
          ]),
          // la lista nei dati strutturati solo quando la pagina si indicizza: le voci sono le Person dei profili /u
          // indicizzabili (`listItems`)
          ...(indexable && listItems.length
            ? [
                collectionPage({
                  locale,
                  path,
                  name: L.listName,
                  description: L.description,
                  items: listItems.map((e) => ({ name: e.personName, path: e.href, id: e.personRef })),
                  about: videoGameId,
                }),
              ]
            : []),
        ]}
      />
      <p className="kicker text-mint">{L.kicker}</p>
      <h1 className="t-page mt-2">{L.h1}</h1>
      <p className="mt-4 max-w-3xl text-chalk-muted">{L.intro}</p>
      <p className="mt-2 max-w-3xl text-xs text-pale-muted">{L.order}</p>

      <div className="mt-8">
        {entries.length ? (
          <CreatorDirectory entries={entries} labels={L} channelLabels={C.channels} liveLabels={C.live} langNames={C.langNames} />
        ) : (
          <p className="card-night p-6 text-pale-muted">{L.empty}</p>
        )}
      </div>

      {/* Invito a diventare Autore: il tag lo assegna lo staff, si chiede per email o mandando una guida */}
      <section aria-labelledby="creators-invite" className="card-night mt-12 flex flex-wrap items-center gap-x-8 gap-y-5 border-dashed p-5 sm:p-7">
        <div className="min-w-0 flex-1 basis-72">
          <h2 id="creators-invite" className="t-section">
            {L.inviteTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-pale">{L.inviteText}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={mail} className="btn btn-primary">
            {L.inviteMail}
          </a>
          <Link href={href(locale, "/guides/submit")} className="btn btn-ink">
            {L.inviteGuide}
          </Link>
        </div>
      </section>
    </div>
  );
}
