import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { getCard, patchChanges, patchLabel, patches, sagas } from "@/lib/data/cards";
import { getDeck, archetypeLabels } from "@/lib/data/decks";
import { communityDeckOf, tierIds, tierList, type TierSection } from "@/lib/data/tierlist";
import { tierTone } from "@/lib/tiercode";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";
import { CardArt, CardChip } from "@/components/CardChip";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { contactEmail, officialLinks } from "@/components/Footer";
import { DiscordButton } from "@/components/DiscordButton";
import { newTabProps } from "@/components/SteamButton";
import { TierListNav } from "@/components/TierListNav";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/tier-list", dict.tier.title, dict.tier.description);
}

/*
  Colori delle fasce (`tierTone`): stanno in tiercode.ts, perché la tier list personalizzata (/tier-list/create) deve
  avere esattamente gli stessi. Lì c'è anche la spiegazione della rampa e dei contrasti.
*/

export default async function TierListPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  // MetaShifting: tutte le modifiche raggruppate per patch, dalla più recente (anche quelle solo di testo)
  const groups = patchChanges();
  const alignmentLabel = { good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const;

  const renderEntry = (section: TierSection, slug: string) => {
    if (section.id === "decks") {
      // Mazzo della community: nome e Leggendaria scritti in tierlist.ts, perché la pagina è statica e non legge Supabase.
      const community = communityDeckOf(slug);
      if (community) {
        const legendary = getCard(community.legendary);
        return (
          <Link key={slug} href={href(locale, `/decks/community/${community.slug}`)} className="card-chip max-w-full" title={community.name}>
            {legendary ? <CardArt card={legendary} /> : <span aria-hidden="true" />}
            <span className="min-w-0">
              <span className="block truncate font-display text-[0.85rem] font-bold leading-tight text-sky">{community.name}</span>
              <span className="block truncate font-mono text-[11px] text-pale-muted">
                <span className="legendary-star" aria-hidden="true">
                  ★
                </span>
                {legendary?.name ?? community.legendary}
                <span className="sr-only"> ({d.common.legendary})</span>
              </span>
            </span>
          </Link>
        );
      }
      const deck = getDeck(slug);
      if (!deck) return null;
      return (
        <Link key={slug} href={href(locale, `/decks/${deck.slug}`)} className="card-chip !grid-cols-1">
          <span className="min-w-0">
            <span className="block font-display text-[0.85rem] font-bold leading-tight text-sky">{deck.name}</span>
            <span className="block font-mono text-[11px] text-pale-muted">{archetypeLabels[deck.archetype][locale]}</span>
          </span>
        </Link>
      );
    }
    // CardChip porta già `max-w-full`: su telefono i nomi lunghi (Three Not So Little Pigs) si troncano invece di uscire dalla riga.
    return <CardChip key={slug} slug={slug} locale={locale} />;
  };

  // Lista per i dati strutturati: le tre sezioni della tier list con le loro ancore, non le singole voci.
  // Finché ladder e tornei non danno risultati le fasce sono vuote e tutte le voci stanno in "non ancora
  // classificato": un ItemList di voci senza posizione descriverebbe male la pagina, mentre le tre sezioni
  // (mazzi, Leggendarie, carte base) sono la struttura stabile che la pagina promette.
  const listed = tierList.sections.map((s) => ({ name: d.tier.sections[s.id].title, path: `${href(locale, "/tier-list")}#${s.id}` }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.tier.title, path: href(locale, "/tier-list") },
          ]),
          collectionPage({
            locale,
            path: href(locale, "/tier-list"),
            name: d.tier.title,
            description: d.tier.description,
            items: listed,
            about: videoGameId,
          }),
        ]}
      />
      {/* Anteprima delle carte al passaggio del mouse (CardChip): la tiene dentro la finestra ai bordi. */}
      <CardMentionEdges />
      <p className="kicker text-mint">{d.nav.tierList}</p>
      <h1 className="t-page mt-2">{d.tier.title}</h1>
      {/* Due tier list, due fonti, due pagine (Pierluigi, 23/09/2026): questa è quella ufficiale, costruita sui
          risultati dei tornei di Origins; la tendina porta a quella della community e al tool. */}
      <TierListNav locale={locale} dict={d} current="official" />
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.tier.intro}</p>

      {/* Invito alla tier list personalizzata (note del 22/09/2026): la propria classifica, senza account e con un link da
          condividere. In cima, prima della lista ufficiale, perché mentre le fasce sono vuote è l'azione che vale di più. */}
      <div className="felt-panel-mint mt-6 flex max-w-4xl flex-wrap items-center gap-4 p-5">
        <p className="min-w-0 flex-1 basis-64 text-pale">{d.tier.makerText}</p>
        <div className="flex flex-wrap gap-2 max-sm:w-full">
          <Link href={href(locale, "/tier-list/create")} className="btn btn-primary max-sm:w-full">
            {d.tier.makerCta} →
          </Link>
          <Link href={href(locale, "/tier-list/community")} className="btn btn-ink max-sm:w-full max-sm:justify-center">
            {d.tier.navCommunity} →
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="card-night p-6">
          <p className="kicker text-mint">
            {d.tier.statusKicker} · {d.common.updated} {formatDate(locale, tierList.updated)}
          </p>
          <p className="mt-2 text-lg font-bold text-pale">{d.tier.statusText}</p>
          <h2 className="t-section mt-6">{d.tier.methodTitle}</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-pale">
            {d.tier.method.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-pale-muted">
            {d.tier.ctaText}{" "}
            <DiscordButton href={officialLinks.discord} size="sm" className="align-middle">
              Discord
            </DiscordButton>{" "}
            · <a className="link-mint" href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
        </section>
        <section className="felt-panel p-6">
          <ul className="space-y-2">
            {tierIds.map((t) => (
              <li key={t} className="flex items-center gap-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-lg font-extrabold ${tierTone[t]}`}>{t}</span>
                <span className="text-chalk-muted">{d.tier.tiers[t]}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {tierList.sections.map((section) => {
        const meta = d.tier.sections[section.id];
        const ranked = tierIds.reduce((n, t) => n + section.tiers[t].length, 0);
        return (
          <section key={section.id} id={section.id} className="mt-14 scroll-mt-24">
            <h2 className="t-section">{meta.title}</h2>
            <p className="mt-1 max-w-2xl text-chalk-muted">{meta.text}</p>
            {/* Niente overflow-hidden sul riquadro: taglierebbe l'anteprima delle carte che si apre sopra la riga.
                Gli angoli arrotondati li portano le celle ai bordi (11 px = 12 px del riquadro meno il bordo). */}
            <div className="mt-5 rounded-xl border border-felt-line">
              {ranked ? (
                tierIds.map((t, i) => (
                  <div key={t} className="grid grid-cols-[64px_minmax(0,1fr)] border-b border-felt-line/70">
                    <div className={`flex items-center justify-center font-display text-2xl font-extrabold ${tierTone[t]} ${i === 0 ? "rounded-tl-[11px]" : ""}`}>{t}</div>
                    <div className={`flex min-h-16 min-w-0 flex-wrap items-center gap-2 bg-felt-deep/60 p-3 ${i === 0 ? "rounded-tr-[11px]" : ""}`}>
                      {section.tiers[t].length ? section.tiers[t].map((slug) => renderEntry(section, slug)) : <span className="font-mono text-xs text-chalk-muted/60">—</span>}
                    </div>
                  </div>
                ))
              ) : (
                // Fasce ancora tutte vuote: niente cinque righe con un trattino, una riga sola che dice quando arrivano.
                // Le lettere restano, come promemoria della scala spiegata nel riquadro qui sopra.
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-t-[11px] border-b border-felt-line/70 bg-felt-deep/60 p-4">
                  <span className="flex shrink-0 gap-1.5" aria-hidden="true">
                    {tierIds.map((t) => (
                      <span key={t} className={`flex h-9 w-9 items-center justify-center rounded-md font-display text-base font-extrabold ${tierTone[t]}`}>
                        {t}
                      </span>
                    ))}
                  </span>
                  <p className="min-w-0 flex-1 basis-60 text-pale">{d.tier.emptyTiers}</p>
                </div>
              )}
              <div className="grid grid-cols-[64px_minmax(0,1fr)]">
                <div className="flex items-center justify-center rounded-bl-[11px] bg-felt-soft px-1 text-center font-mono text-[10px] uppercase tracking-wider text-chalk-muted">n/d</div>
                <div className="flex min-h-16 min-w-0 flex-wrap items-center gap-2 rounded-br-[11px] bg-felt-deep/40 p-3">
                  <span className="kicker mr-2 w-full text-chalk-muted sm:w-auto">{d.common.unranked}</span>
                  {section.unranked.length ? (
                    section.unranked.map((slug) => renderEntry(section, slug))
                  ) : (
                    <Link href="#tracker" className="text-sm text-mint hover:underline">
                      {d.tier.trackerTitle} ↓
                    </Link>
                  )}
                </div>
              </div>
            </div>
            {section.id === "decks" ? (
              // Rimando neutro ai mazzi del sito (note del 22/09/2026: "non spingere sul voto"). Tasto secondario: il
              // primario della pagina è l'invito alla tier list personalizzata, in cima.
              <div className="card-night mt-4 flex flex-wrap items-center gap-4 p-5">
                <p className="min-w-0 flex-1 basis-64 text-pale">{d.tier.decksText}</p>
                <Link href={href(locale, "/decks")} className="btn btn-ghost max-sm:w-full max-sm:justify-center">
                  {d.tier.decksCta} →
                </Link>
              </div>
            ) : null}
          </section>
        );
      })}

      <section id="tracker" className="mt-14 scroll-mt-24">
        <h2 className="t-section">{d.tier.trackerTitle}</h2>
        <p className="mt-2 max-w-2xl text-chalk-muted">{d.tier.trackerSub}</p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-felt-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-felt-deep text-left">
              <tr>
                <th className="kicker px-4 py-3 text-chalk-muted">{d.nav.cards}</th>
                <th className="kicker px-4 py-3 text-chalk-muted">{d.common.saga}</th>
                <th className="kicker px-4 py-3 text-chalk-muted">{d.common.stats}</th>
                <th className="kicker px-4 py-3 text-chalk-muted">{d.common.lastChange}</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(({ patch, items }) => (
                <Fragment key={patch}>
                  {/* Intestazione della patch: nome, data, numero di modifiche, post ufficiale e articolo del sito */}
                  <tr id={`patch-${patch}`} className="border-t-2 border-sky bg-night-2">
                    <th colSpan={4} scope="colgroup" className="px-4 py-3 text-left">
                      <span className="font-display text-base font-bold text-sky">
                        {d.common.patch} {patchLabel(patch, locale)}
                      </span>
                      <span className="ml-3 font-mono text-xs font-normal text-pale-muted">
                        {formatDate(locale, patches[patch].date)} · {items.length} {d.tier.changesCount}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-normal">
                        {patches[patch].news ? (
                          <Link href={href(locale, `/news/${patches[patch].news}`)} className="font-bold text-mint hover:underline">
                            {d.tier.readPatchNotes} →
                          </Link>
                        ) : null}
                        <a href={patches[patch].url} {...newTabProps} className="text-pale-muted underline hover:text-pale">
                          {d.common.steamNews}
                        </a>
                      </span>
                    </th>
                  </tr>
                  {items.map(({ card, change }) => (
                    <tr key={`${card.slug}-${change.patch}`} className="border-t border-felt-line/70 bg-night text-pale">
                      <td className="px-4 py-3 font-bold">
                        {/* Nome di carta: link alla sua scheda, celeste come negli altri elenchi; le Leggendarie con la stella */}
                        <Link href={href(locale, `/cards/${card.slug}`)} className="text-sky hover:underline">
                          {card.legendary ? (
                            <span className="legendary-star" aria-hidden="true">
                              ★
                            </span>
                          ) : null}
                          {card.name}
                          {card.legendary ? <span className="sr-only"> ({d.common.legendary})</span> : null}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-pale-muted">{sagas[card.saga][locale]}</td>
                      {/* la patch non si ripete in ogni riga: la dice l'intestazione del gruppo */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {change.from && change.to ? (
                          <StatDelta from={change.from} to={change.to} />
                        ) : change.alignment ? (
                          <span className="font-mono text-sm">
                            <span className="text-pale-muted line-through decoration-crimson/70">{alignmentLabel[change.alignment.from]}</span>
                            <span className="mx-1.5 text-pale-muted">→</span>
                            <span className="font-semibold">{alignmentLabel[change.alignment.to]}</span>
                          </span>
                        ) : (
                          <span className="font-mono text-sm text-pale-muted">{d.tier.textChange}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ChangeChip kind={change.kind} label={d.common[change.kind === "deck" ? "rework" : change.kind]} />
                        <span className="mt-1 block text-xs text-pale-muted">{change.note[locale]}</span>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
