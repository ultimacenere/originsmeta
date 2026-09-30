import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { cards, getCard, latestPatch, patchAt, patchLabel, patchOrder } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { decodeOmCode, encodeOmCode } from "@/lib/deckcode";
import { formatDate } from "@/lib/i18n";
import { checkDeck } from "@/lib/community/util";
import { deckCardsDate, deckCardsDiff, deckOutdated, deckUpdateHref, sameDeckCards, type CardsDiff } from "@/lib/community/deckVersions";
import { deckVersionLabels } from "@/lib/deckVersionLabels";
import { fillLabel } from "@/lib/community/deckQuality";
import { currentUser } from "@/lib/supabase/server";
import type { CommunityDeck } from "@/lib/community/types";
import { PublishDeckForm, type DeckArtEdit, type PoolCard } from "@/components/PublishDeckForm";
import { canUseDeckArt } from "@/lib/community/badges";
import { deckArtPathOk } from "@/lib/community/deckArt";
import { deckArtFormLabels } from "@/lib/deckArtLabels";
import { loginLabels } from "@/lib/loginLabels";
import { withCarriedParams } from "@/lib/analytics";
import { deckResources, deckVideos } from "@/lib/videos";
import { videoFormLabels } from "@/lib/videoLabels";

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
  const { data: me } = await supabase.from("profiles").select("role, badge").eq("id", user.id).maybeSingle();
  const my = me as { role?: string | null; badge?: string | null } | null;
  const isAdmin = my?.role === "admin";
  if (deck.owner !== user.id && !isAdmin) notFound();
  // Artwork della Leggendaria (29/09/2026): lo carica il proprietario Creator o Staff; chi può solo toglierlo (un admin sul
  // mazzo di un altro, il proprietario che ha perso il ruolo) vede quello che c'è e il tasto per tornare alla carta
  // ufficiale; per gli altri il campo non c'è e la Server Action non tocca l'artwork.
  const isOwner = deck.owner === user.id;
  const savedArt = deckArtPathOk(deck.art_path, deck.owner) ? deck.art_path : null;
  const art: DeckArtEdit | null =
    isOwner && canUseDeckArt(my?.badge, my?.role) ? { path: savedArt, mode: "upload" } : savedArt ? { path: savedArt, mode: "remove", reason: isOwner ? "noRole" : "notOwner" } : null;

  const pool: PoolCard[] = cards
    .filter((c) => c.status === "active" && c.type !== "token")
    .map((c) => ({ slug: c.slug, name: c.name, legendary: Boolean(c.legendary), ...(c.legendary && (c.thumb ?? c.image) ? { image: c.thumb ?? c.image } : {}) }));
  const archetypes = Object.entries(archetypeLabels).map(([id, l]) => [id, l[locale]] as [string, string]);
  const savedCode = deck.code_om ?? encodeOmCode({ name: deck.name, legendary: deck.legendary, cards: deck.cards, customCards: deck.custom_cards });

  // Carte nuove dal deck builder (?deck=<codice>, pacchetto VERSIONI del 30/09/2026): il modulo le salva al posto di
  // quelle di adesso e il database apre la versione successiva. Si controllano come alla pubblicazione (checkDeck); il
  // cambio di carte serve la migrazione (colonna `version`, che select("*") porta solo quando c'è).
  const V = deckVersionLabels[locale].edit;
  const versionsReady = typeof deck.version === "number";
  const sp = await searchParams;
  const incoming = typeof sp.deck === "string" ? sp.deck : "";
  let proposal: { code: string; diff: CardsDiff } | null = null;
  let notice: { text: string; bad: boolean } | null = null;
  if (incoming && deck.status !== "draft") {
    const decoded = decodeOmCode(incoming);
    const checked = decoded ? checkDeck(decoded) : null;
    if (!checked?.ok) notice = { text: V.invalid, bad: true };
    else {
      const next = { legendary: checked.deck.legendary, cards: checked.deck.cards, custom_cards: checked.deck.customCards };
      if (sameDeckCards(deck, next)) notice = { text: V.same, bad: false };
      else if (!versionsReady) notice = { text: V.unavailable, bad: true };
      else
        proposal = {
          code: encodeOmCode({ name: deck.name, legendary: next.legendary, cards: next.cards, customCards: next.custom_cards }),
          diff: deckCardsDiff(deck, next),
        };
    }
  }
  const code = proposal?.code ?? savedCode;
  const customName = (s: string) => [...deck.custom_cards, ...(decodeOmCode(code)?.customCards ?? [])].find((x) => x.slug === s)?.name ?? s;
  const cardName = (s: string | null) => (s ? (getCard(s)?.name ?? customName(s)) : "—");
  const version = versionsReady ? (deck.version as number) : 1;
  const currentPatch = patchAt(deckCardsDate(deck));
  const outdated = deckOutdated(currentPatch, patchOrder);
  const nextPatch = patchLabel(patchAt(new Date().toISOString()) ?? latestPatch, locale);
  const builderHref = deckUpdateHref(locale, deck.slug, code);
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

      {/* Carte del mazzo (pacchetto VERSIONI, 30/09/2026): versione in vigore, tasto verso il deck builder ("Aggiorna alla
          versione 0.7" quando il mazzo è fermo a una patch di prima) e, al ritorno, che cosa cambia prima di salvare */}
      <section aria-labelledby="deck-cards-title" className="card-night mt-8 p-5 sm:p-6">
        <h2 id="deck-cards-title" className="t-section">
          {V.title}
        </h2>
        <p className="mt-1 font-mono text-xs text-pale-muted">
          {fillLabel(V.current, {
            n: String(version),
            patch: currentPatch ? patchLabel(currentPatch, locale) : "—",
            date: formatDate(locale, deckCardsDate(deck).slice(0, 10)),
          })}
        </p>
        {outdated && !proposal ? (
          <p className="mt-3 font-semibold text-gold">{fillLabel(V.outdated, { old: currentPatch ? patchLabel(currentPatch, locale) : "—", patch: patchLabel(latestPatch, locale) })}</p>
        ) : null}
        <p className="mt-2 max-w-3xl text-sm text-pale">{fillLabel(V.intro, { next: String(version + 1) })}</p>
        {notice ? (
          <p className={`mt-3 ${notice.bad ? "alert-bad" : "rounded-lg bg-night-3 px-3 py-2 text-sm text-pale"}`} role="status">
            {notice.text}
          </p>
        ) : null}
        {proposal ? (
          <div className="mt-4 rounded-xl border-2 border-gold bg-gold/10 p-4">
            <p className="font-display font-bold text-chalk">{V.changedTitle}</p>
            {proposal.diff.legendary ? (
              <p className="mt-2 text-sm text-chalk">{fillLabel(V.legendary, { from: cardName(proposal.diff.legendary.from), to: cardName(proposal.diff.legendary.to) })}</p>
            ) : null}
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {proposal.diff.added.length ? (
                <div>
                  <p className="kicker text-mint">+ {V.added}</p>
                  <ul className="mt-1 space-y-0.5 text-sm text-chalk">
                    {proposal.diff.added.map((s) => (
                      <li key={s}>+ {cardName(s)}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {proposal.diff.removed.length ? (
                <div>
                  <p className="kicker text-bad">− {V.removed}</p>
                  <ul className="mt-1 space-y-0.5 text-sm text-pale-muted">
                    {proposal.diff.removed.map((s) => (
                      <li key={s}>− {cardName(s)}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-chalk">{fillLabel(V.saveNotice, { next: String(version + 1), patch: nextPatch })}</p>
          </div>
        ) : null}
        <p className="mt-4 flex flex-wrap items-center gap-3">
          {versionsReady ? (
            <Link href={builderHref} className="btn btn-primary">
              {outdated && !proposal ? fillLabel(V.updateTo, { patch: patchLabel(latestPatch, locale) }) : V.openBuilder}
            </Link>
          ) : (
            <span className="text-sm text-pale-muted">{V.unavailable}</span>
          )}
          {proposal ? (
            <Link href={path} className="text-sm text-pale-muted underline underline-offset-2 hover:text-sky">
              {V.discard}
            </Link>
          ) : null}
        </p>
      </section>

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
            // video e risorse riletti con le regole della scheda: il vecchio video_url è il primo video se riconosciuto,
            // altrimenti la prima risorsa (se su un host ammesso), così salvando non si perde in silenzio
            videos: deckVideos(deck).map((v) => ({ url: v.url, ...(v.start ? { start: v.start } : {}), ...(v.title ? { title: v.title } : {}) })),
            links: deckResources(deck, d.common.video).map((l) => ({ label: l.label, url: l.url })),
            guide: deck.guide,
          }}
          labels={d.community}
          mediaLabels={videoFormLabels(locale)}
          artLabels={deckArtFormLabels(locale)}
          art={art}
          builderHref={versionsReady ? builderHref : `${href(locale, "/deck-builder")}#${code}`}
          publishPath={path}
          loginLabels={loginLabels(d)}
        />
      </div>
    </div>
  );
}
