import type { Locale } from "@/lib/i18n";
import { analyticsCitation, analyticsSourceLabels } from "@/lib/analyticsSource";

/**
 * "Fonte e come citarla" di /analytics (09/11/2026, difesa SEO/GEO): che cosa sono i numeri e la riga da citare.
 * Sta nella pagina vera (in fondo, con i testi) e nella pagina riservata che allo stesso indirizzo vede chi non ha
 * fatto l'accesso (`members`: l'invito a registrarsi per vedere le tabelle). Componente server, nessun dato vero.
 */
export function AnalyticsSource({ locale, patch, members = false, className = "" }: { locale: Locale; patch: string; members?: boolean; className?: string }) {
  const l = analyticsSourceLabels[locale];
  return (
    <section id="source" aria-labelledby="an-h-source" className={`scroll-mt-36 ${className}`}>
      <h2 id="an-h-source" className="t-section">
        {l.title}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-pale">{l.what}</p>
      {members ? <p className="mt-3 max-w-3xl text-sm text-chalk-muted">{l.members}</p> : null}
      <h3 className="t-panel mt-5">{l.citeTitle}</h3>
      <blockquote className="mt-2 max-w-3xl break-words rounded-md border-l-4 border-mint bg-night-2 px-4 py-3 font-mono text-xs text-chalk">
        {analyticsCitation(locale, patch)}
      </blockquote>
      <p className="mt-2 max-w-3xl text-xs text-chalk-muted">{l.citeNote}</p>
    </section>
  );
}
