import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";

/**
 * Testata unica della sezione Tier list (riprogettazione del 24/09/2026, §1 punto 32 della KB), al posto della
 * tendina `TierListNav`: le tre fonti stanno sempre in vista come schede (OriginsMeta · Community · Le più giocate),
 * ognuna con il suo stato sotto il nome ("dopo la Crimson Cup", "1 lista", "14 mazzi"), più l'azione "Crea la tua".
 * Una tendina chiusa nascondeva le alternative (chi non la apriva non sapeva che esistesse la community).
 * Le schede sono link fra pagine vere (ognuna col suo URL, per la SEO), quindi `nav` + `aria-current="page"`, non
 * un `tablist`. L'H1 cambia con la pagina: la testata è la stessa, il titolo dice dove si è.
 * Sotto, facoltativo, l'indice della pagina (Mazzi · Leggendarie · Carte) con le ancore delle sezioni.
 */

export type TierSource = "official" | "community" | "played" | "create";

export function TierListHeader({
  locale,
  dict: d,
  current,
  title,
  intro,
  state,
  sections,
}: {
  locale: Locale;
  dict: Dictionary;
  current: TierSource;
  title: string;
  intro?: string;
  /** stato di ogni fonte, già scritto: "dopo la Crimson Cup", "1 lista", "14 mazzi" */
  state: { official: string; community: string; played: string };
  /** indice della pagina: ancore e conteggi delle sezioni */
  sections?: { id: string; label: string; count?: number }[];
}) {
  const t = d.tier;
  const sources: { id: Exclude<TierSource, "create">; label: string; path: string }[] = [
    { id: "official", label: t.sourceOfficial, path: "/tier-list" },
    { id: "community", label: t.sourceCommunity, path: "/tier-list/community" },
    { id: "played", label: t.sourcePlayed, path: "/tier-list/most-played" },
  ];
  return (
    <>
    <header>
      <p className="kicker text-mint">{d.nav.tierList}</p>
      <h1 className="t-page mt-2">{title}</h1>
      {intro ? <p className="mt-3 max-w-3xl text-chalk-muted">{intro}</p> : null}
      <nav aria-label={t.sourcesLabel} className="mt-5 flex flex-wrap items-stretch gap-2">
        {sources.map((s) => {
          const on = s.id === current;
          return (
            <Link
              key={s.id}
              href={href(locale, s.path)}
              aria-current={on ? "page" : undefined}
              className={`tier-src min-w-0 flex-1 basis-0 sm:flex-none sm:basis-auto ${on ? "is-on" : ""}`}
            >
              <span className="tier-src-name">{s.label}</span>
              <span className="tier-src-state">{state[s.id]}</span>
            </Link>
          );
        })}
        {/* sul tool stesso il tasto non serve: ci si è già */}
        {current === "create" ? null : (
          <Link href={href(locale, "/tier-list/create")} className="btn btn-primary w-full justify-center self-center sm:ml-auto sm:w-auto">
            {t.makerCta} →
          </Link>
        )}
      </nav>
    </header>
      {/* L'indice sta fuori da <header>: dentro, `position: sticky` non avrebbe spazio per restare in alto scorrendo */}
      {sections?.length ? (
        <nav aria-label={t.onThisPage} className="tier-onpage">
          <span className="tier-onpage-label">{t.onThisPage}</span>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.label}
              {s.count !== undefined ? <span className="tier-onpage-count">{s.count}</span> : null}
            </a>
          ))}
        </nav>
      ) : null}
    </>
  );
}

/** La riga sotto la testata: fonte, campione, stato o misura, in un'unica riga che va a capo. */
export function TierSourceLine({ items }: { items: { label: string; text: string; warn?: boolean }[] }) {
  return (
    <p className="tier-line">
      {items.map((it, i) => (
        <span key={it.label} className={it.warn ? "is-warn" : undefined}>
          {i > 0 ? <span aria-hidden="true"> · </span> : null}
          <b>{it.label}:</b> {it.text}
        </span>
      ))}
    </p>
  );
}
