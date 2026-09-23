import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { alignStyle, badgePill, badgeStyle, sagaHue } from "@/lib/cardArt";
import { activeCards, cards, sagas, type Card, type ChangeKind } from "@/lib/data/cards";
import { news } from "@/lib/data/news";
import { SectionHead } from "@/components/SectionHead";
import { NewsCover } from "@/components/NewsCover";
import { ChangeChip } from "@/components/ChangeChip";
import { CardChipList, flipLabels, flipOf } from "@/components/CardChip";
import { FlipCard } from "@/components/FlipCard";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { SteamButton } from "@/components/SteamButton";
import { DiscordButton } from "@/components/DiscordButton";
import { officialLinks } from "@/components/Footer";

/*
  Pagina di riferimento del sistema grafico (/style, richiesta della riunione del 21/09/2026: "una sezione di
  riferimento unificata di palette e font"). Regole:
    - tutto è disegnato con le classi VERE del sito (btn-primary, t-section, postit, alert-bad…), così la pagina
      non può disallinearsi dal codice: se cambia una classe in globals.css, cambia anche qui;
    - i valori dei colori non sono ricopiati a mano: si leggono da globals.css al momento della build (stesso
      schema di src/lib/imageSize.ts, che legge i file da process.cwd()), e i rapporti di contrasto si calcolano;
    - pagina statica, noindex, fuori dalla sitemap e dal menu: è un attrezzo di lavoro, non contenuto.
*/

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // Non entra in sitemap (src/app/sitemap.ts elenca le pagine a mano) e non si indicizza.
  return { ...pageMeta(locale, "/style", dict.style.title, dict.style.description), robots: { index: false, follow: false } };
}

type Token = { name: string; value: string };

/** Legge i token di colore (`--color-*` in @theme, `--postit-*` in :root) e il gradiente dei bottoni da globals.css. */
function readDesignTokens(): { colors: Token[]; postits: Token[]; gradient?: string } {
  let css = "";
  try {
    css = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
  } catch {
    return { colors: [], postits: [] };
  }
  const seen = new Set<string>();
  const colors: Token[] = [];
  const postits: Token[] = [];
  // Solo le dichiarazioni con un esadecimale: `--postit-bg: var(--postit-news)` e simili non sono token.
  for (const m of css.matchAll(/--((?:color|postit)-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g)) {
    const name = m[1];
    if (seen.has(name)) continue;
    seen.add(name);
    (name.startsWith("postit-") ? postits : colors).push({ name, value: m[2].toLowerCase() });
  }
  const gradient = css.match(/--grad-ig\s*:\s*([^;]+);/)?.[1].trim();
  return { colors, postits, gradient };
}

/** Luminanza relativa WCAG 2.x di un colore esadecimale (#rgb o #rrggbb; l'eventuale alfa si ignora). */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapporto di contrasto WCAG tra due colori. */
function contrast(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const ratio = (locale: Locale, n: number) => `${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}:1`;

const SECTIONS = ["palette", "fonts", "titles", "buttons", "pills", "previews", "marks", "postits", "alerts", "links", "frames"] as const;
const POSTITS = ["deck", "news", "patch", "guide", "tournament", "event"] as const;
const CHANGES: ChangeKind[] = ["buff", "nerf", "rework", "deck"];

/**
 * Carte VERE del database per provare le anteprime al passaggio del mouse (niente dati scritti a mano):
 * la prima Leggendaria e la prima carta base in gioco che hanno illustrazione, testo e statistiche.
 */
function peekSamples(): Card[] {
  const ready = (c: Card) => c.status === "active" && Boolean(c.image && c.ability);
  return [cards.find((c) => ready(c) && c.legendary), cards.find((c) => ready(c) && !c.legendary && c.power !== undefined)].filter(
    (c): c is Card => Boolean(c),
  );
}

/**
 * Carte VERE per la stella delle Leggendarie e per le righe del deck builder (note del 22/09/2026): due Leggendarie e
 * due carte base per l'elenco "★ Nome, ★ Nome, poi carte normali", e per le righe una Leggendaria, un'unità e una
 * magia con illustrazione.
 */
function markSamples() {
  const legendaries = activeCards.filter((c) => c.legendary).slice(0, 2);
  const base = activeCards.filter((c) => !c.legendary && c.type === "unit").slice(0, 2);
  const withArt = (c: Card) => Boolean(c.thumb ?? c.art);
  const rows = [
    activeCards.find((c) => c.legendary && withArt(c)),
    activeCards.find((c) => !c.legendary && c.type === "unit" && c.power !== undefined && withArt(c)),
    activeCards.find((c) => c.type === "spell" && withArt(c)),
  ].filter((c): c is Card => Boolean(c));
  return { names: [...legendaries, ...base], rows };
}

/** Copertine delle tre news più recenti, per provare il post-it grande sopra un'immagine vera. */
function latestCovers(): string[] {
  return [...news]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)
    .map((n) => n.image);
}

/** Etichetta della classe CSS accanto a ogni esempio */
function Code({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-xs text-chalk-muted">{children}</code>;
}

export default async function StylePage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const s = d.style;
  const { colors, postits, gradient } = readDesignTokens();
  const hexOf = (name: string, fallback: string) => colors.find((t) => t.name === name)?.value ?? fallback;
  const night = hexOf("color-night", "#182238");
  const ink = hexOf("color-ink", "#16102a");
  const chalk = hexOf("color-chalk", "#d9dfe8");
  const roles = s.roles as Record<string, string>;
  const changeLabel = (k: ChangeKind) => d.common[k === "deck" ? "rework" : k];
  const samples = peekSamples();
  const marks = markSamples();
  const covers = latestCovers();
  /** Nome di carta nel formato deciso il 22/09/2026: stella gialla davanti alle Leggendarie, per i lettori di schermo "Leggendaria". */
  const cardName = (c: Card) => (
    <>
      {c.legendary ? (
        <span className="legendary-star" aria-hidden="true">
          ★
        </span>
      ) : null}
      {c.name}
      {c.legendary ? <span className="sr-only"> ({d.common.legendary})</span> : null}
    </>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{s.kicker}</p>
      <h1 className="t-page mt-2">{s.title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-pale">{s.intro}</p>

      <nav className="felt-panel mt-8 p-4" aria-label={s.toc}>
        <p className="kicker text-chalk-muted">{s.toc}</p>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {SECTIONS.map((id) => (
            <li key={id}>
              <a className="link-mint" href={`#${id}`}>
                {s[id].title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Palette: valori letti da globals.css, contrasti calcolati */}
      <section id="palette" className="mt-16 scroll-mt-24">
        <SectionHead kicker={s.palette.kicker} title={s.palette.title} sub={s.palette.sub} />
        {colors.length === 0 ? (
          <p className="alert-bad">{s.palette.unavailable}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {colors.map((t) => {
              const onInk = contrast(ink, t.value);
              const onChalk = contrast(chalk, t.value);
              const best = onInk >= onChalk ? { color: ink, value: onInk, name: "ink" } : { color: chalk, value: onChalk, name: "chalk" };
              return (
                <li key={t.name} className="card-night flex flex-col overflow-hidden">
                  <div className="flex h-20 items-end justify-between gap-2 px-4 py-2" style={{ background: t.value }}>
                    <span className="font-display text-2xl font-extrabold" style={{ color: best.color }}>
                      Aa
                    </span>
                    <span className="font-mono text-xs font-medium" style={{ color: best.color }}>
                      {best.name} {ratio(locale, best.value)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <code className="font-mono text-sm text-sky">--{t.name}</code>
                      <code className="font-mono text-sm text-chalk">{t.value}</code>
                    </p>
                    <p className="text-sm text-pale">{roles[t.name.replace(/^color-/, "")] ?? s.palette.noRole}</p>
                    {/* Il campione "Aa" è nel colore del token sul fondo night; il numero resta leggibile in ogni caso */}
                    <p className="mt-auto flex items-center gap-2 pt-2 font-mono text-xs text-chalk-muted">
                      <span className="font-display text-base font-bold" style={{ color: t.value }} aria-hidden="true">
                        Aa
                      </span>
                      <span>
                        {s.palette.onNight}: {ratio(locale, contrast(t.value, night))}
                      </span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {gradient ? (
          <div className="card-night mt-6 overflow-hidden">
            <div className="h-20" style={{ backgroundImage: gradient }} aria-hidden="true" />
            <div className="p-4">
              <p className="t-item">{s.palette.gradientTitle}</p>
              <p className="mt-1 text-sm text-pale">{s.palette.gradientText}</p>
              <code className="mt-2 block break-all font-mono text-xs text-chalk-muted">--grad-ig: {gradient}</code>
            </div>
          </div>
        ) : null}
      </section>

      {/* Font: le tre famiglie con il loro uso */}
      <section id="fonts" className="mt-16 scroll-mt-24">
        <SectionHead kicker={s.fonts.kicker} title={s.fonts.title} sub={s.fonts.sub} />
        <ul className="card-night divide-y-2 divide-night-3">
          {(
            [
              ["font-display", "Unbounded", s.fonts.display],
              ["font-body", "Manrope", s.fonts.body],
              ["font-mono", "JetBrains Mono", s.fonts.mono],
            ] as const
          ).map(([cls, family, use]) => (
            <li key={cls} className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-center">
              <div>
                <p className="t-item">{family}</p>
                <p className="mt-1 text-sm text-pale">{use}</p>
                <Code>.{cls}</Code>
              </div>
              <p className={`${cls} break-words text-3xl text-chalk`}>Aa Bb Cc · 0123456789</p>
            </li>
          ))}
          {/* Il font a penna non ha un'utility di Tailwind: è la variabile --font-hand che il layout mette sull'html */}
          <li className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-center">
            <div>
              <p className="t-item">Caveat</p>
              <p className="mt-1 text-sm text-pale">{s.fonts.hand}</p>
              <Code>var(--font-hand) · .postit · .postit-label</Code>
            </div>
            <p className="break-words text-4xl font-bold text-chalk" style={{ fontFamily: "var(--font-hand), cursive" }}>
              Aa Bb Cc · àèéìòù · 0123456789
            </p>
          </li>
        </ul>
      </section>

      {/* Scala dei titoli */}
      <section id="titles" className="mt-16 scroll-mt-24">
        <SectionHead kicker={s.titles.kicker} title={s.titles.title} sub={s.titles.sub} />
        <div className="card-night divide-y-2 divide-night-3">
          <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[14rem_minmax(0,1fr)] md:items-baseline">
            <div>
              <Code>.t-page</Code>
              <p className="text-sm text-pale">{s.titles.page}</p>
            </div>
            <p className="t-page">{d.nav.tierList}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[14rem_minmax(0,1fr)] md:items-baseline">
            <div>
              <Code>.kicker .text-mint</Code>
              <p className="text-sm text-pale">{s.titles.kickerRole}</p>
            </div>
            <div>
              <p className="kicker text-mint">{s.titles.sampleKicker}</p>
              <p className="t-section mt-1">{s.titles.sampleSection}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[14rem_minmax(0,1fr)] md:items-baseline">
            <div>
              <Code>.t-section</Code>
              <p className="text-sm text-pale">{s.titles.section}</p>
            </div>
            <p className="t-section">{s.titles.sampleSection}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[14rem_minmax(0,1fr)] md:items-baseline">
            <div>
              <Code>.t-item</Code>
              <p className="text-sm text-pale">{s.titles.item}</p>
            </div>
            <p className="t-item">{s.titles.sampleItem}</p>
          </div>
        </div>
      </section>

      {/* Bottoni */}
      <section id="buttons" className="mt-16 scroll-mt-24">
        <SectionHead kicker={s.buttons.kicker} title={s.buttons.title} sub={s.buttons.sub} />
        <ul className="card-night divide-y-2 divide-night-3">
          <li className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn btn-primary">
                {s.buttons.samplePrimary}
              </button>
              <button type="button" className="btn btn-primary text-xs">
                {s.buttons.samplePrimary}
              </button>
            </div>
            <div>
              <Code>.btn .btn-primary</Code>
              <p className="text-sm text-pale">{s.buttons.primary}</p>
            </div>
          </li>
          <li className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
            <div>
              <button type="button" className="btn btn-mint">
                {s.buttons.samplePrimary}
              </button>
            </div>
            <div>
              <Code>.btn .btn-mint</Code>
              <p className="text-sm text-pale">{s.buttons.mint}</p>
            </div>
          </li>
          <li className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
            <div>
              <button type="button" className="btn btn-ink">
                {s.buttons.sampleInk}
              </button>
            </div>
            <div>
              <Code>.btn .btn-ink</Code>
              <p className="text-sm text-pale">{s.buttons.ink}</p>
            </div>
          </li>
          <li className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
            <div>
              <button type="button" className="btn btn-ghost">
                {s.buttons.sampleGhost}
              </button>
            </div>
            <div>
              <Code>.btn .btn-ghost</Code>
              <p className="text-sm text-pale">{s.buttons.ghost}</p>
            </div>
          </li>
          <li className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
            <div>
              <button type="button" className="btn btn-danger">
                {s.buttons.sampleDanger}
              </button>
            </div>
            <div>
              <Code>.btn .btn-danger</Code>
              <p className="text-sm text-pale">{s.buttons.danger}</p>
            </div>
          </li>
          <li className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
            <div>
              <button type="button" className="btn btn-gold">
                {s.buttons.sampleGold}
              </button>
            </div>
            <div>
              <Code>.btn .btn-gold</Code>
              <p className="text-sm text-pale">{s.buttons.gold}</p>
            </div>
          </li>
          <li className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
            <div className="flex flex-wrap gap-2" role="group" aria-label={s.buttons.choiceGroup}>
              <button type="button" className="btn btn-choice text-xs" aria-pressed="true">
                {s.buttons.sampleChoiceOn}
              </button>
              <button type="button" className="btn btn-choice text-xs" aria-pressed="false">
                {s.buttons.sampleChoiceOff}
              </button>
            </div>
            <div>
              <Code>.btn .btn-choice [aria-pressed]</Code>
              <p className="text-sm text-pale">{s.buttons.choice}</p>
            </div>
          </li>
          <li className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn btn-primary" disabled>
                {s.buttons.samplePrimary}
              </button>
              <button type="button" className="btn btn-ghost" disabled>
                {s.buttons.sampleGhost}
              </button>
            </div>
            <div>
              <Code>.btn:disabled</Code>
              <p className="text-sm text-pale">{s.buttons.disabled}</p>
            </div>
          </li>
          <li className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <SteamButton href={officialLinks.steam}>{d.common.steam}</SteamButton>
              <DiscordButton href={officialLinks.discord}>{d.common.discord}</DiscordButton>
            </div>
            <div>
              <Code>SteamButton · DiscordButton</Code>
              <p className="text-sm text-pale">{s.buttons.brands}</p>
            </div>
          </li>
        </ul>
      </section>

      {/* Pastiglie e chip */}
      <section id="pills" className="mt-16 scroll-mt-24">
        <SectionHead kicker={s.pills.kicker} title={s.pills.title} sub={s.pills.sub} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card-night p-5">
            <p className="t-item text-base">{s.pills.changes}</p>
            <ul className="mt-3 flex flex-wrap gap-4">
              {CHANGES.map((k) => (
                <li key={k} className="flex flex-col items-start gap-1">
                  <ChangeChip kind={k} label={changeLabel(k)} />
                  <Code>{k}</Code>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-pale-muted">{s.pills.deckNote}</p>
          </div>
          <div className="card-night p-5">
            <p className="t-item text-base">{s.pills.badges}</p>
            <ul className="mt-3 flex flex-wrap gap-3">
              {Object.entries(badgeStyle).map(([k, cls]) => (
                <li key={k}>
                  <span className={`${badgePill} ${cls}`}>{d.community.badges[k as keyof typeof d.community.badges] ?? k}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-night p-5">
            <p className="t-item text-base">{d.common.alignment}</p>
            <ul className="mt-3 flex flex-wrap gap-3">
              {(["good", "evil", "neutral"] as const).map((k) => (
                <li key={k} className="flex flex-col items-start gap-1">
                  <span className={`stat-pill ${alignStyle[k]}`}>{d.common[k]}</span>
                  <Code>{k}</Code>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-night p-5">
            <p className="t-item text-base">{s.pills.stats}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="stat-pill bg-mint text-ink">{d.common.mana}</span>
              <span className="stat-pill bg-night-3 text-chalk">{d.common.power}</span>
              <span className="stat-pill bg-night-3 text-chalk">{d.common.health}</span>
              <span className="stat-pill bg-gold font-bold text-ink">{d.common.legendary}</span>
            </div>
            <p className="mt-4 text-sm text-pale">{s.pills.chip}</p>
            <span className="card-chip mt-2 w-60 max-w-full">
              <span className="card-chip-art" style={{ background: sagaHue.other }} aria-hidden="true">
                OM
              </span>
              <span className="min-w-0">
                <span className="t-item block truncate text-sm">{s.pills.chipName}</span>
                <span className="block font-mono text-xs text-pale-muted">{d.common.unit}</span>
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Anteprime delle carte e iniziali di ripiego */}
      <section id="previews" className="mt-16 scroll-mt-24">
        <SectionHead kicker={s.previews.kicker} title={s.previews.title} sub={s.previews.sub} />
        {/* sposta il pannello dell'anteprima quando uscirebbe dalla finestra, come nelle altre pagine con le carte */}
        <CardMentionEdges />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card-night p-5">
            <p className="t-item text-base">{s.previews.peek}</p>
            <p className="mt-1 text-sm text-pale">{s.previews.peekNote}</p>
            {samples.length ? (
              <div className="mt-4">
                <CardChipList slugs={samples.map((c) => c.slug)} locale={locale} />
              </div>
            ) : null}
            <p className="mt-3">
              <Code>.deck-peek-panel · .deck-peek-mana · .deck-peek-name · .deck-peek-text · .card-mention-panel</Code>
            </p>
          </div>
          <div className="card-night p-5">
            <p className="t-item text-base">{s.previews.initials}</p>
            <p className="mt-1 text-sm text-pale">{s.previews.initialsNote}</p>
            {/* Un fondale per saga: le iniziali devono restare leggibili anche sui più chiari */}
            <ul className="mt-4 flex flex-wrap gap-2" aria-hidden="true">
              {Object.entries(sagaHue).map(([id, bg]) => (
                <li key={id} className="deck-card deck-card-xs" style={{ background: bg }} title={id}>
                  <span className="deck-card-initials">OM</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              <Code>.deck-card-initials · .card-tile-initials</Code>
            </p>
          </div>

          {/* Carte intere che si girano: lo stesso componente (FlipCard) del database /cards e della scheda dei mazzi */}
          {samples.length ? (
            <div className="card-night p-5 md:col-span-2">
              <p className="t-item text-base">{s.previews.flip}</p>
              <p className="mt-1 max-w-3xl text-sm text-pale">{s.previews.flipNote}</p>
              <ul className="mt-4 grid max-w-xl grid-cols-2 gap-4">
                {samples.map((c) => (
                  <li key={c.slug} className="min-w-0">
                    <FlipCard card={flipOf(c, locale)} labels={flipLabels(locale)} sizes="(min-width: 640px) 280px, 46vw" />
                  </li>
                ))}
              </ul>
              <p className="mt-3">
                <Code>FlipCard · .card-tile · .card-tile-pills · .card-tile-info · .card-tile-foot</Code>
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Segni sulle carte (note del 22/09/2026): stella delle Leggendarie e righe delle magie nel deck builder */}
      <section id="marks" className="mt-16 scroll-mt-24">
        <SectionHead kicker={s.marks.kicker} title={s.marks.title} sub={s.marks.sub} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card-night p-5">
            <p className="t-item text-base">{s.marks.star}</p>
            <p className="mt-1 text-sm text-pale">{s.marks.starNote}</p>
            <ul className="mt-4 space-y-2">
              {marks.names.map((c) => (
                <li key={c.slug} className="t-item">
                  {cardName(c)}
                </li>
              ))}
            </ul>
            <p className="mt-3">
              <Code>.legendary-star · .t-item</Code>
            </p>
          </div>
          <div className="card-night p-5">
            <p className="t-item text-base">{s.marks.spell}</p>
            <p className="mt-1 text-sm text-pale">{s.marks.spellNote}</p>
            {/* Righe disegnate come nel deck builder (pool), ma ferme: qui non si aggiunge nulla */}
            <ul className="mt-4 space-y-1" aria-hidden="true">
              {marks.rows.map((c) => (
                <li key={c.slug}>
                  <div
                    className={`builder-row cursor-default ${c.legendary ? "is-legendary" : ""} ${c.type === "spell" ? "row-spell" : ""}`}
                    style={{ ["--row-art" as string]: `url(${c.thumb ?? c.art})` } as React.CSSProperties}
                  >
                    <span className={`card-chip-art !h-11 !w-9 shrink-0 text-[10px] ${c.legendary ? "is-legendary" : ""}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.art ?? c.thumb} alt="" loading="lazy" decoding="async" />
                    </span>
                    <span className="builder-row-text">
                      <span className="builder-row-name">{cardName(c)}</span>
                      <span className="builder-row-stats">
                        {c.mana ?? "?"} · {c.type === "unit" ? `${c.power ?? "?"}/${c.health ?? "?"}` : d.common.spell} · {sagas[c.saga][locale]}
                      </span>
                    </span>
                    <span className="builder-row-state">+</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              <Code>.builder-row .row-spell · .builder-row.is-legendary</Code>
            </p>
          </div>
        </div>
      </section>

      {/* Post-it */}
      <section id="postits" className="mt-16 scroll-mt-24">
        <SectionHead kicker={s.postits.kicker} title={s.postits.title} sub={s.postits.sub} />
        <ul className="postit-row felt-panel flex flex-wrap gap-x-8 gap-y-6 px-5 pb-5 pt-8">
          {POSTITS.map((k) => (
            <li key={k} className="flex flex-col items-start gap-3">
              <span className={`postit postit-${k}`}>{s.postits[k]}</span>
              <Code>
                .postit-{k} · {postits.find((t) => t.name === `postit-${k}`)?.value ?? "—"}
              </Code>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Le due velocità: lento di norma, "isterico" sulle news delle ultime 72 ore */}
          <div className="card-night p-5">
            <p className="t-item text-base">{s.postits.speeds}</p>
            <p className="mt-1 text-sm text-pale">{s.postits.speedsNote}</p>
            <ul className="mt-7 flex flex-wrap items-start gap-x-12 gap-y-8 pl-2">
              <li className="flex flex-col items-start gap-3">
                <span className="postit postit-news">{s.postits.news}</span>
                <Code>.postit · {s.postits.slow}</Code>
              </li>
              <li className="flex flex-col items-start gap-3">
                <span className="postit postit-news is-fresh">{s.postits.news}</span>
                <Code>.postit.is-fresh · {s.postits.fresh}</Code>
              </li>
            </ul>
          </div>
          {/* Etichette di sezione della home: i foglietti grandi TIER e META del disegno di Pierluigi (22/09/2026),
              rosa e menta, scritti a penna e di fretta (Reenie Beanie), stessa misura, a capo solo se serve. Sono le classi vere della home. */}
          <div className="grid gap-6">
            <p className="t-item text-base">{s.postits.label}</p>
            <p className="-mt-4 text-sm text-pale">{s.postits.labelNote}</p>
            <div className="strip-labeled card-night flex flex-wrap items-center gap-4">
              <p className="strip-postit strip-postit-pink strip-postit-tape" style={{ ["--tilt" as string]: "-5deg", ["--scrawl" as string]: "-3deg" } as React.CSSProperties}>
                <span className="strip-postit-text">{d.home.tierPostit1} {d.home.tierPostit2}</span>
              </p>
              <p className="text-sm text-pale-muted">{d.home.tierSub}</p>
            </div>
            <div className="strip-labeled card-night flex flex-wrap items-center gap-4">
              <p className="strip-postit strip-postit-mint strip-postit-bang" style={{ ["--tilt" as string]: "4deg", ["--scrawl" as string]: "-1.5deg" } as React.CSSProperties}>
                <span className="strip-postit-text">{d.home.metaPostit1} {d.home.metaPostit2}</span>
                <span className="postit-smile" aria-hidden="true" />
              </p>
              <p className="text-sm text-pale-muted">{d.home.metashiftSub}</p>
            </div>
            <p>
              <Code>.strip-labeled · .strip-postit · .strip-postit-pink / -mint · .strip-postit-text · var(--font-pen)</Code>
            </p>
          </div>
        </div>

        {/* Post-it grande sopra l'angolo di una copertina vera: contenitore relative senza overflow, post-it figlio diretto */}
        <p className="mt-8 text-sm text-pale">
          {s.postits.large} <Code>.postit .postit-lg .postit-corner</Code>
        </p>
        <div className="postit-row mt-6 grid grid-cols-1 gap-x-5 gap-y-10 md:grid-cols-3">
          {(["deck", "news", "patch"] as const).map((k, i) => (
            <article key={k} className="card-night card-night-hover relative p-6">
              {covers[i] ? (
                <div className="relative mb-4">
                  <NewsCover src={covers[i]} />
                  <span className={`postit postit-${k} postit-lg postit-corner ${i === 0 ? "is-fresh" : ""}`}>{s.postits[k]}</span>
                </div>
              ) : (
                <span className={`postit postit-${k} postit-corner`}>{s.postits[k]}</span>
              )}
              <p className="kicker text-mint">{s.titles.sampleKicker}</p>
              <p className="t-item mt-2">{s.postits.demoTitle}</p>
              <p className="mt-2 text-sm text-pale">{s.postits.demoText}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Avvisi ed errori */}
      <section id="alerts" className="mt-16 scroll-mt-24">
        <SectionHead kicker={s.alerts.kicker} title={s.alerts.title} sub={s.alerts.sub} />
        <div className="card-night grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          <div className="space-y-3">
            <p className="alert-bad">{s.alerts.bad}</p>
            <Code>.alert-bad</Code>
            <p className="alert-good">{s.alerts.good}</p>
            <Code>.alert-good</Code>
          </div>
          <div>
            <label htmlFor="style-field" className="kicker text-chalk-muted">
              {s.alerts.fieldLabel}
            </label>
            <input
              id="style-field"
              type="text"
              aria-invalid="true"
              aria-describedby="style-field-error"
              className="mt-1 w-full rounded-lg border border-bad bg-felt-deep px-3 py-2 text-sm text-chalk"
            />
            <p id="style-field-error" className="text-error mt-1 text-sm">
              {s.alerts.fieldError}
            </p>
            <Code>.text-error</Code>
          </div>
        </div>
      </section>

      {/* Link e menu */}
      <section id="links" className="mt-16 scroll-mt-24">
        <SectionHead kicker={s.links.kicker} title={s.links.title} sub={s.links.sub} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card-night p-5">
            <p className="text-pale">
              {s.links.before}
              <Link className="link-mint" href={href(locale, "/cards")}>
                {s.links.link}
              </Link>
              {s.links.after}
            </p>
            <p className="mt-3">
              <Code>.link-mint</Code>
            </p>
          </div>
          <div className="card-night p-5">
            <p className="text-sm text-pale">{s.links.menu}</p>
            <div className="mt-3 flex flex-wrap gap-1 rounded-xl bg-felt-deep p-2">
              <Link className="nav-link" href={href(locale, "/news")}>
                {d.nav.news}
              </Link>
              <Link className="nav-link" href={href(locale, "/cards")}>
                {d.nav.cards}
              </Link>
              <Link className="nav-link" href={href(locale, "/style")} aria-current="page">
                {s.title}
              </Link>
            </div>
            <p className="mt-3">
              <Code>.nav-link · .nav-link[aria-current=&quot;page&quot;]</Code>
            </p>
          </div>
        </div>
      </section>

      {/* Cornici e pannelli */}
      <section id="frames" className="mt-16 scroll-mt-24">
        <SectionHead kicker={s.frames.kicker} title={s.frames.title} sub={s.frames.sub} />
        {/* Regola unica degli spessori: 6 px lo slider, 3 px i contenitori, 2 px chip e mini carte, 1 px i campi */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="hero-art p-5">
            <Code>.hero-art · 6 px</Code>
            <p className="mt-2 text-sm text-pale">{s.frames.hero}</p>
          </div>
          <div className="card-night p-5">
            <Code>.card-night · 3 px</Code>
            <p className="mt-2 text-sm text-pale">{s.frames.night}</p>
          </div>
          <div className="felt-panel p-5">
            <Code>.felt-panel · 3 px</Code>
            <p className="mt-2 text-sm text-pale">{s.frames.felt}</p>
          </div>
          <div className="felt-panel-mint p-5">
            <Code>.felt-panel-mint · 3 px</Code>
            <p className="mt-2 text-sm text-pale">{s.frames.feltMint}</p>
          </div>
          <div className="card-night p-5">
            <Code>.card-chip · .deck-card · .btn · 2 px</Code>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="deck-card deck-card-xs" style={{ background: sagaHue.other }} aria-hidden="true">
                <span className="deck-card-initials">OM</span>
              </span>
              <span className="deck-card deck-card-xs is-legendary" style={{ background: sagaHue.arthurian }} aria-hidden="true">
                <span className="deck-card-initials">OM</span>
              </span>
              <button type="button" className="btn btn-ink text-xs">
                {s.buttons.sampleInk}
              </button>
            </div>
            <p className="mt-2 text-sm text-pale">{s.frames.chip}</p>
          </div>
          <div className="card-night p-5">
            <label htmlFor="style-control">
              <Code>input · select · textarea · 1 px</Code>
            </label>
            <input
              id="style-control"
              type="search"
              placeholder={d.nav.search}
              className="mt-2 w-full rounded-lg border border-felt-line bg-felt-deep px-3 py-2 text-sm text-chalk focus:border-mint"
            />
            <p className="mt-2 text-sm text-pale">{s.frames.control}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
