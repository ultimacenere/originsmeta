import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { statSync } from "node:fs";
import path from "node:path";
import { href, type Locale } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { imageSizeOf } from "@/lib/imageSize";
import { KIT_COLORS, KIT_FILES, KIT_ZIP, TOOL_IDS, creatorApplyPath, isExternal, kitFilePath } from "@/lib/forCreators";
import { fillFc, forCreatorsLabels, type ForCreatorsLabels, type GuideLink, type ToolGuide } from "@/lib/forCreatorsLabels";
import { CreatorCode, CreatorUserNote } from "@/components/creators/CreatorCode";
import { CopyButton } from "@/components/CopyButton";
import { OpenDetailsOnHash } from "@/components/OpenDetailsOnHash";
import { newTabProps } from "@/components/SteamButton";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

/*
  La pagina per i creator (30/10/2026). Vocale di Dav del 29/10 (un ragazzo che fa video e dirette con le nostre
  Analytics chiede banner e loghi per citarci) e Pierluigi: "una landing page dedicata ai creators, con le spiegazioni dei
  nostri servizi, dei nostri tool ed infine un mediakit", poi "per i tool crea delle miniguide, facciamo le cose a prova
  di scemo per installare". Quindi: che cosa dà OriginsMeta (per tutti e con il ruolo Creator), una guida passo passo per
  ogni strumento (che cosa serve, i passi, come si capisce che ha funzionato, che cosa fare se non va), idee per i
  contenuti, il media kit (scripts/creator-kit.mjs) e come chiedere il ruolo Creator (la casella dello staff con il
  messaggio già scritto).
  Statica e indicizzabile in tutte le lingue. Le righe da copiare prendono il nome utente nel browser (CreatorCode).
  Testi in src/lib/forCreatorsLabels-<lingua>.ts, costanti in src/lib/forCreators.ts.

  10/11/2026, pagina semplificata (note di Pierluigi: "i creator vanno in panico con pagine lunghe", tutorial "in righe
  collassabili", la sezione "cosa ti dà Origins Meta" "apribile, non espansa di default"): all'inizio si vedono solo le
  righe. Ogni guida è un <details> chiuso (nome dello strumento, dove si usa, il tempo e che cosa fa; dentro che cosa
  serve, i passi, le righe da copiare, "Ha funzionato se" e "Se non funziona"), e la mappa delle schede in cima alla
  sezione non c'è più (le righe sono la mappa); chiusi anche "Che cosa ti dà OriginsMeta" (il titolo resta nella riga),
  le idee e, nel media kit, colori, font, frasi pronte e regole. Restano aperti i download del kit e "Diventa Creator".
  Le domande usano la stessa riga (ROW, ROW_SUMMARY, RowEnd). Le ancore di sempre (#perks, #tracker, #ideas…) aprono la
  loro riga e ci scorrono: OpenDetailsOnHash. Il testo dei <details> chiusi resta nell'HTML.
*/

const HERO = "/media/analytics/tracker-cover.webp";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = forCreatorsLabels[locale];
  return pageMeta(locale, "/for-creators", L.meta.title, L.meta.description, HERO, { imageSize: imageSizeOf(HERO), imageAlt: L.heroAlt });
}

/** Il peso dello zip del kit, letto in build ("1,7 MB"): cambia da solo quando lo script rifà il kit. */
function zipSize(locale: Locale): string {
  try {
    const bytes = statSync(path.join(process.cwd(), "public", KIT_ZIP)).size;
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / 1048576)} MB`;
  } catch {
    return "zip";
  }
}

function GuideAnchor({ link, locale, className = "link-mint font-bold" }: { link: GuideLink; locale: Locale; className?: string }) {
  if (isExternal(link.path)) {
    return (
      <a href={link.path} {...newTabProps} className={className}>
        {link.label} ↗
      </a>
    );
  }
  return (
    <Link href={href(locale, link.path)} prefetch={false} className={className}>
      {link.label} →
    </Link>
  );
}

/*
  Le righe che si aprono (guide, vantaggi, idee, il resto del kit, domande), tutte uguali. Tutta la riga è il <summary>,
  margine interno compreso, così si apre cliccando ovunque; il segno gira di un quarto quando è aperta; il fuoco da
  tastiera è un anello menta dentro la cornice. Il <summary> è una griglia a due colonne con i testi come figli diretti
  (nel <summary> stanno solo testo e titoli, niente div né p): a sinistra titolo e righe sotto, a destra RowEnd, sempre
  sulla prima riga. Dentro, i riquadri sono felt-panel (non card-night, che farebbe cornice celeste su cornice celeste).
*/
const ROW = "card-night group min-w-0 scroll-mt-24";
const ROW_SUMMARY =
  "grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 rounded-[11px] px-4 py-4 transition-colors hover:bg-night-3/40 focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-mint group-open:rounded-b-none motion-reduce:transition-none sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden";
const ROW_BODY = "px-4 pb-5 sm:px-6 sm:pb-6";

/** La fine della prima riga di un <summary>: un suggerimento facoltativo ("Guida", da 640 px) e il segno che gira. */
function RowEnd({ hint }: { hint?: string }) {
  return (
    <span className="col-start-2 row-start-1 flex items-center gap-2">
      {hint ? <span className="hidden font-display text-sm font-bold text-mint sm:inline">{hint}</span> : null}
      <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-mint/70 text-mint transition-transform group-open:rotate-90 motion-reduce:transition-none">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3.5 10.5 8 6 12.5" />
        </svg>
      </span>
    </span>
  );
}

/**
 * Una guida in una riga che si apre (10/11/2026). Chiusa: nome dello strumento, dove si usa, il tempo e che cosa fa.
 * Aperta: che cosa serve, i passi numerati con le righe da copiare, come si capisce che va, se non va. L'id dello
 * strumento è anche l'ancora (/for-creators#tracker), che apre la riga (OpenDetailsOnHash).
 */
function Guide({ tool, L, locale }: { tool: ToolGuide; L: ForCreatorsLabels; locale: Locale }) {
  const T = L.tools;
  return (
    <details id={tool.id} className={ROW}>
      <summary className={ROW_SUMMARY}>
        <h3 id={`${tool.id}-title`} className="col-start-1 font-display text-lg font-extrabold text-sky sm:text-xl">
          {tool.name}
        </h3>
        <span className="col-start-1 mt-1 font-mono text-xs uppercase tracking-wider text-pale-muted">
          {tool.tag} · {T.time}: {tool.time}
        </span>
        <span className="col-start-1 mt-2 max-w-3xl text-sm text-pale sm:text-base">{tool.what}</span>
        <RowEnd hint={T.guide} />
      </summary>
      <div className={ROW_BODY}>
        <p className="felt-panel px-4 py-3 text-sm text-chalk">
          <span className="font-bold text-mint">{T.needs}:</span> {tool.needs}
        </p>
        <ol className="mt-5 grid gap-4">
          {tool.steps.map((step, i) => (
            <li key={step.text} className="flex min-w-0 gap-3 sm:gap-4">
              <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint font-mono text-sm font-bold text-ink">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-chalk">{step.text}</p>
                {step.code ? <CreatorCode code={step.code} lang={locale} placeholder={L.you} copy={L.copy} copied={L.copied} tool={`${tool.id}_${i + 1}`} /> : null}
                {step.codes?.map((c) => (
                  <CreatorCode key={c.label} code={c.code} lang={locale} placeholder={L.you} label={c.label} copy={L.copy} copied={L.copied} tool={`${tool.id}_${c.label.toLowerCase()}`} />
                ))}
                {step.link ? (
                  <p className="mt-2 text-sm">
                    <GuideAnchor link={step.link} locale={locale} />
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="felt-panel-mint min-w-0 p-4">
            <p className="font-display text-sm font-bold text-mint">✓ {T.done}</p>
            <p className="mt-1 text-sm text-chalk">{tool.done}</p>
          </div>
          <div className="felt-panel min-w-0 p-4">
            <p className="font-display text-sm font-bold text-gold">? {T.stuck}</p>
            <ul className="mt-1 grid gap-1.5 text-sm text-pale">
              {tool.stuck.map((s) => (
                <li key={s} className="flex gap-2">
                  <span aria-hidden="true" className="text-gold">
                    •
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {tool.more ? (
          <p className="mt-4 text-sm">
            <GuideAnchor link={tool.more} locale={locale} />
          </p>
        ) : null}
      </div>
    </details>
  );
}

/** Fondo a scacchi dietro le anteprime trasparenti, perché si veda che non hanno fondo. */
const CHECKER = {
  backgroundColor: "#211a3a",
  backgroundImage: "linear-gradient(45deg, #2b2348 25%, transparent 25%, transparent 75%, #2b2348 75%), linear-gradient(45deg, #2b2348 25%, transparent 25%, transparent 75%, #2b2348 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0, 10px 10px",
} as const;

export default async function ForCreatorsPage({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  const L = forCreatorsLabels[locale];
  const pagePath = href(locale, "/for-creators");
  const applyHref = href(locale, creatorApplyPath);
  const loginHref = `${href(locale, "/login")}?next=${encodeURIComponent(pagePath)}`;
  const heroSize = imageSizeOf(HERO) ?? { width: 1600, height: 900 };
  const tools = TOOL_IDS.map((id) => L.tools.items.find((t) => t.id === id)).filter((t): t is ToolGuide => Boolean(t));
  const toc = [
    { id: "perks", label: L.toc.perks },
    { id: "tools", label: L.toc.tools },
    { id: "ideas", label: L.toc.ideas },
    { id: "kit", label: L.toc.kit },
    { id: "join", label: L.toc.join },
    { id: "faq", label: L.toc.faq },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: L.h1, path: pagePath },
          ]),
        ]}
      />

      <header className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="kicker text-mint">{L.kicker}</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-sky sm:text-[2.5rem]">{L.h1}</h1>
          <p className="mt-4 text-lg text-pale">{L.lead}</p>
          <ul className="mt-4 grid gap-1.5 text-pale">
            {L.points.map((p) => (
              <li key={p} className="flex gap-2">
                <span aria-hidden="true" className="font-bold text-mint">
                  ✓
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={applyHref} prefetch={false} className="btn btn-primary" data-om-event="creator_apply_click" data-om-placement="hero">
              {L.apply}
            </Link>
            <a href="#kit" className="btn btn-ink">
              {L.kitCta} ↓
            </a>
          </div>
          <p className="mt-2 max-w-xl text-sm text-pale-muted">{L.applyNote}</p>
        </div>
        <figure className="card-night min-w-0 overflow-hidden p-2">
          <Image src={HERO} {...heroSize} alt={L.heroAlt} sizes="(min-width: 1024px) 540px, 92vw" className="h-auto w-full rounded-lg" priority />
          <figcaption className="px-2 py-2 text-xs text-pale-muted">{L.heroCaption}</figcaption>
        </figure>
      </header>

      <nav aria-label={L.toc.label} className="mt-10 flex flex-wrap gap-2">
        {toc.map((t) => (
          <a key={t.id} href={`#${t.id}`} className="rounded-full border-2 border-sky/60 px-3 py-1 text-sm font-bold text-sky hover:border-mint hover:text-mint">
            {t.label}
          </a>
        ))}
      </nav>

      {/* Che cosa dà OriginsMeta: una riga chiusa con il titolo; dentro le voci, per tutti e, con la pastiglia, solo con il ruolo Creator */}
      <section className="mt-14" aria-labelledby="fc-perks">
        <details id="perks" className={ROW}>
          <summary className={ROW_SUMMARY}>
            <h2 id="fc-perks" className="t-section col-start-1">
              {L.perks.title}
            </h2>
            <span className="col-start-1 mt-1 max-w-3xl text-sm text-pale sm:text-base">{L.perks.intro}</span>
            <RowEnd />
          </summary>
          <div className={ROW_BODY}>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {L.perks.items.map((item) => (
                <li key={item.title} className="felt-panel flex min-w-0 flex-col p-4">
                  {item.creator ? <span className="badge-creator mb-2 self-start rounded-full px-2.5 py-0.5 text-[11px] font-bold">{L.perks.creatorOnly}</span> : null}
                  <h3 className="t-item">{item.title}</h3>
                  <p className="mt-2 text-sm text-pale">{item.text}</p>
                  {item.link ? (
                    <p className="mt-auto pt-3 text-sm">
                      <GuideAnchor link={item.link} locale={locale} />
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </details>
      </section>

      {/* Gli strumenti: una riga chiusa per ognuno, con la sua guida passo passo dentro */}
      <section id="tools" className="mt-16 scroll-mt-24" aria-labelledby="fc-tools">
        <h2 id="fc-tools" className="t-section">
          {L.tools.title}
        </h2>
        <p className="mt-2 max-w-3xl text-pale">{L.tools.intro}</p>
        <div className="mt-4">
          <CreatorUserNote filled={L.filled} notFilled={L.notFilled} signIn={L.signIn} loginHref={loginHref} />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3">
          {tools.map((t) => (
            <Guide key={t.id} tool={t} L={L} locale={locale} />
          ))}
        </div>
      </section>

      {/* Idee per i contenuti, in una riga chiusa: i dati e gli strumenti del sito da mostrare */}
      <section className="mt-16" aria-labelledby="fc-ideas">
        <details id="ideas" className={ROW}>
          <summary className={ROW_SUMMARY}>
            <h2 id="fc-ideas" className="t-section col-start-1">
              {L.ideas.title}
            </h2>
            <span className="col-start-1 mt-1 max-w-3xl text-sm text-pale sm:text-base">{L.ideas.intro}</span>
            <RowEnd />
          </summary>
          <div className={ROW_BODY}>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {L.ideas.items.map((item) => (
                <li key={item.title} className="felt-panel flex min-w-0 flex-col p-4">
                  <h3 className="t-item">{item.title}</h3>
                  <p className="mt-2 text-sm text-pale">{item.text}</p>
                  <p className="mt-auto pt-3 text-sm">
                    <GuideAnchor link={item.link} locale={locale} />
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </section>

      {/* Il media kit: lo zip e i file uno per uno sempre aperti; colori, font, frasi pronte e regole in una riga chiusa */}
      <section id="kit" className="mt-16 scroll-mt-24" aria-labelledby="fc-kit">
        <h2 id="fc-kit" className="t-section">
          {L.kit.title}
        </h2>
        <p className="mt-2 max-w-3xl text-pale">{L.kit.intro}</p>
        <div className="mt-5">
          <a href={KIT_ZIP} download className="btn btn-primary" data-om-event="creator_kit_download" data-om-file="zip" data-om-placement="kit">
            ↓ {fillFc(L.kit.all, { size: zipSize(locale) })}
          </a>
          <p className="mt-2 max-w-2xl text-sm text-pale-muted">{L.kit.allNote}</p>
        </div>
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {KIT_FILES.map((f) => {
            const file = kitFilePath(f.id, locale);
            const text = L.kit.files[f.id];
            const perLocale = f.id === "badge" || f.id === "panel";
            return (
              <li key={f.id} className="card-night flex min-w-0 flex-col overflow-hidden">
                <div className="grid h-44 place-items-center p-4" style={f.transparent ? CHECKER : { backgroundColor: "#0e071f" }}>
                  <Image src={file} width={f.width} height={f.height} alt={text.title} sizes="320px" className="h-auto max-h-36 w-auto max-w-full object-contain" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <h3 className="t-item">{text.title}</h3>
                  <p className="mt-1 font-mono text-xs text-pale-muted">
                    PNG · {fillFc(L.kit.size, { w: f.width, h: f.height })}
                    {f.transparent ? ` · ${L.kit.transparent}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-pale">{text.text}</p>
                  {perLocale ? <p className="mt-1 text-xs text-pale-muted">{L.kit.allLangs}</p> : null}
                  <p className="mt-auto pt-3">
                    <a href={file} download className="btn btn-ink text-xs" data-om-event="creator_kit_download" data-om-file={f.id} data-om-placement="kit">
                      ↓ {L.kit.download}
                    </a>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Il resto del kit in una riga chiusa, il cui nome sono i titoli di quello che c'è dentro */}
        <details className={`${ROW} mt-8`}>
          <summary className={ROW_SUMMARY}>
            <span className="col-start-1 font-display font-bold text-sky">{[L.kit.colors.title, L.kit.fonts.title, L.kit.lines.title, L.kit.rules.title].join(" · ")}</span>
            <RowEnd />
          </summary>
          <div className={`${ROW_BODY} grid grid-cols-1 gap-6 lg:grid-cols-2`}>
            <div className="min-w-0">
              <h3 className="t-item">{L.kit.colors.title}</h3>
              <ul className="mt-3 grid gap-2">
                {KIT_COLORS.map((c) => (
                  <li key={c.id} className="felt-panel flex min-w-0 items-center gap-3 p-2.5">
                    <span aria-hidden="true" className="h-9 w-9 shrink-0 rounded-lg border-2 border-felt-line" style={{ backgroundColor: c.hex }} />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-bold text-chalk">{L.kit.colors.items[c.id].name}</span> <span className="font-mono text-pale">{c.hex}</span>
                      <span className="block text-xs text-pale-muted">{L.kit.colors.items[c.id].use}</span>
                    </span>
                    <CopyButton text={c.hex} label={L.copy} copied={L.copied} ariaLabel={`${L.copy}: ${c.hex}`} />
                  </li>
                ))}
              </ul>
              <h3 className="t-item mt-6">{L.kit.fonts.title}</h3>
              <p className="mt-2 text-sm text-pale">{L.kit.fonts.text}</p>
            </div>
            <div className="min-w-0">
              <h3 className="t-item">{L.kit.lines.title}</h3>
              <p className="mt-2 text-sm text-pale">{L.kit.lines.intro}</p>
              {L.kit.lines.items.map((line, i) => (
                <CreatorCode key={line} code={line} lang={locale} placeholder={L.you} copy={L.copy} copied={L.copied} tool={`kit_line_${i + 1}`} />
              ))}
              <h3 className="t-item mt-6">{L.kit.rules.title}</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="felt-panel-mint min-w-0 p-4">
                  <p className="font-display text-sm font-bold text-mint">✓ {L.kit.rules.doTitle}</p>
                  <ul className="mt-1 grid gap-1.5 text-sm text-chalk">
                    {L.kit.rules.do.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div className="felt-panel min-w-0 p-4">
                  <p className="font-display text-sm font-bold text-crimson-soft">✕ {L.kit.rules.dontTitle}</p>
                  <ul className="mt-1 grid gap-1.5 text-sm text-pale">
                    {L.kit.rules.dont.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </details>
      </section>

      {/* Come si diventa Creator: accesso, canali nel profilo, la richiesta già scritta nella casella dello staff */}
      <section id="join" className="card-night mt-16 scroll-mt-24 p-6 sm:p-8" aria-labelledby="fc-join">
        <h2 id="fc-join" className="font-display text-2xl font-extrabold text-sky">
          {L.join.title}
        </h2>
        <p className="mt-2 max-w-3xl text-pale">{L.join.intro}</p>
        <ol className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {L.join.steps.map((step, i) => (
            <li key={step.title} className="felt-panel flex min-w-0 gap-4 p-4">
              <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint font-mono text-base font-bold text-ink">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="t-item">{step.title}</h3>
                <p className="mt-1 text-sm text-pale">{step.text}</p>
                {step.link ? (
                  <p className="mt-2 text-sm">
                    <GuideAnchor link={step.link} locale={locale} />
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <Link href={applyHref} prefetch={false} className="btn btn-primary" data-om-event="creator_apply_click" data-om-placement="join">
            {L.apply}
          </Link>
          <p className="mt-2 text-sm text-pale-muted">{L.join.note}</p>
        </div>
      </section>

      <section id="faq" className="mt-16 max-w-3xl scroll-mt-24" aria-labelledby="fc-faq">
        <h2 id="fc-faq" className="t-section">
          {L.faq.title}
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-3">
          {L.faq.items.map((f) => (
            <details key={f.q} className={ROW}>
              <summary className={ROW_SUMMARY}>
                <span className="col-start-1 font-display font-bold text-sky">{f.q}</span>
                <RowEnd />
              </summary>
              <p className={`${ROW_BODY} text-pale`}>{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-sm text-pale-muted">{L.unofficial}</p>
      </section>

      {/* Le ancore (#tracker, #perks, #ideas…) aprono la loro riga */}
      <OpenDetailsOnHash />
    </div>
  );
}
