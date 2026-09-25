import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { latestPatch, patchChanges, patchLabel, patches, sagas } from "@/lib/data/cards";
import { changeDetail, changeLabel } from "@/lib/linkLabels";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";
import { CardName } from "@/components/CardChip";
import { newTabProps } from "@/components/SteamButton";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

/*
  MetaShifting su una pagina sua (24/09/2026, Pierluigi: "si, crea un url dedicato /metashifting, poi capiremo se
  dobbiamo inserirlo nel menu oppure basta il richiamo in home"). Prima stava in fondo a /tier-list (#tracker) e ne
  occupava il 60% dell'altezza; ora la tier list tiene un riquadro con le tre modifiche più grandi e il link qui.
  Sul telefono la tabella diventa una scheda per modifica: prima era larga 640 px in 356 e il valore nuovo e il tipo
  di modifica restavano fuori schermo, senza segnale che la tabella scorresse di lato.
  Pagina statica: i dati sono quelli di cards.ts (card-history.ts e patch).
  Gli scambi nei mazzi preimpostati del playtest (modifiche di tipo "deck", 0.6.1) hanno la pastiglia "Cambio di
  mazzo" e solo la nota, senza "abilità" nella colonna delle statistiche: la carta non cambia (`changeLabel` e
  `changeDetail` in linkLabels.ts, gli stessi della scheda carta e del blocco della patch nelle news).
*/

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/metashifting", dict.metashifting.title, dict.metashifting.description);
}

export default async function MetaShiftingPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const m = d.metashifting;
  const groups = patchChanges();
  const alignmentLabel = { good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const;
  const path = href(locale, "/metashifting");
  // L'ultima patch uscita (non l'ultima con modifiche alle carte: patchChanges scarta quelle senza) e quante carte tocca.
  // Le patch senza numero hanno un'etichetta che è già una data ("Demo · 21 set"): per loro basta la data.
  const latestCount = groups.find((g) => g.patch === latestPatch)?.items.length ?? 0;
  const latestChanges =
    latestCount === 0 ? m.changesNone : latestCount === 1 ? m.changesOne : m.changesMany.replace("{n}", String(latestCount));
  const latestLine = (patches[latestPatch].label ? m.latestDated : m.latest)
    .replace("{patch}", patchLabel(latestPatch, locale))
    .replace("{date}", formatDate(locale, patches[latestPatch].date))
    .replace("{changes}", latestChanges);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.common.metashift, path },
          ]),
          collectionPage({
            locale,
            path,
            name: m.title,
            description: m.description,
            items: groups.map(({ patch }) => ({ name: `${d.common.patch} ${patchLabel(patch, locale)}`, path: `${path}#patch-${patch}` })),
            about: videoGameId,
          }),
        ]}
      />
      <p className="kicker text-mint">{d.common.metashift}</p>
      <h1 className="t-page mt-2">{m.h1}</h1>
      <p className="mt-3 max-w-3xl text-chalk-muted">{m.intro}</p>
      {/* L'ultima patch in una frase, dai dati (piano SEO/GEO del 25/09/2026): la risposta a "qual è l'ultima patch" */}
      <p className="mt-2 max-w-3xl text-chalk">{latestLine}</p>
      <p className="tier-line">{m.source}</p>

      {/* Indice delle patch, dalla più recente */}
      <nav aria-label={m.patchesLabel} className="tier-onpage">
        <span className="tier-onpage-label">{m.patchesLabel}</span>
        {groups.map(({ patch, items }) => (
          <a key={patch} href={`#patch-${patch}`}>
            {patchLabel(patch, locale)}
            <span className="tier-onpage-count">{items.length}</span>
          </a>
        ))}
      </nav>

      {groups.map(({ patch, items }) => (
        <section key={patch} id={`patch-${patch}`} className="mt-10 scroll-mt-32" aria-labelledby={`patch-${patch}-title`}>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-sky pb-2">
            <h2 id={`patch-${patch}-title`} className="t-section">
              {d.common.patch} {patchLabel(patch, locale)}
            </h2>
            <span className="font-mono text-xs text-pale-muted">
              {formatDate(locale, patches[patch].date)} · {items.length} {d.tier.changesCount}
            </span>
            <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {patches[patch].news ? (
                <Link href={href(locale, `/news/${patches[patch].news}`)} className="font-bold text-mint hover:underline">
                  {d.tier.readPatchNotes} →
                </Link>
              ) : null}
              <a href={patches[patch].url} {...newTabProps} className="text-pale-muted underline hover:text-pale">
                {d.common.steamNews}
              </a>
            </span>
          </div>
          {/* Tabella da 768 px; sotto, ogni riga diventa una scheda (nome e tipo di modifica, statistiche, nota) */}
          <table className="mt-3 w-full text-sm max-md:block">
            <thead className="max-md:hidden">
              <tr className="text-left">
                <th scope="col" className="kicker px-4 py-2 text-chalk-muted">
                  {d.nav.cards}
                </th>
                <th scope="col" className="kicker px-4 py-2 text-chalk-muted">
                  {d.common.saga}
                </th>
                <th scope="col" className="kicker px-4 py-2 text-chalk-muted">
                  {d.common.stats}
                </th>
                <th scope="col" className="kicker px-4 py-2 text-chalk-muted">
                  {d.common.lastChange}
                </th>
              </tr>
            </thead>
            <tbody className="max-md:grid max-md:gap-2">
              {items.map(({ card, change }) => (
                <tr
                  key={`${card.slug}-${change.patch}`}
                  className="border-t border-felt-line/70 bg-night text-pale max-md:grid max-md:grid-cols-[minmax(0,1fr)_auto] max-md:gap-x-3 max-md:gap-y-1 max-md:rounded-xl max-md:border max-md:border-night-3 max-md:p-3"
                >
                  <th scope="row" className="px-4 py-3 text-left font-bold max-md:p-0">
                    <Link href={href(locale, `/cards/${card.slug}`)} className="text-sky hover:underline">
                      <CardName name={card.name} legendary={card.legendary} legendaryLabel={d.common.legendary} />
                    </Link>
                  </th>
                  <td className="px-4 py-3 text-pale-muted max-md:order-3 max-md:p-0 max-md:text-xs">{sagas[card.saga][locale]}</td>
                  <td className="whitespace-nowrap px-4 py-3 max-md:order-4 max-md:p-0 max-md:text-right">
                    {changeDetail(change) === "none" ? null : changeDetail(change) === "stats" ? (
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
                  <td className="px-4 py-3 max-md:contents">
                    <span className="max-md:order-2 max-md:self-start max-md:justify-self-end">
                      <ChangeChip kind={change.kind} label={changeLabel(change.kind, locale, d.common)} />
                    </span>
                    <span className="mt-1 block text-xs text-pale-muted max-md:order-5 max-md:col-span-2 max-md:mt-0">{change.note[locale]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <p className="mt-10 text-sm">
        <Link href={href(locale, "/tier-list")} className="link-mint font-bold">
          {m.tierLink} →
        </Link>
      </p>
    </div>
  );
}
