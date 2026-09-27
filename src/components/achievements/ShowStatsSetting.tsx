import type { Locale } from "@/lib/i18n";
import type { Db } from "@/lib/supabase/public";
import { achievementLabels } from "@/lib/achievementLabels";
import { readOwnShowStats } from "@/lib/community/achievementQueries";
import { isShowcaseBadge } from "@/lib/community/badges";
import { ShowStatsToggle } from "./ShowStatsToggle";

/**
 * "I numeri sulla vetrina" in /account (pacchetto TRAGUARDI, 27/09/2026): solo per i ruoli con vetrina (Creator,
 * Autore, Pro, Staff), che possono mostrare sulla pagina pubblica i totali dei mazzi pubblicati. Legge l'impostazione
 * con la sessione che la pagina ha già aperto. Prima della migrazione (colonna `show_stats` assente) al posto della
 * casella c'è una riga che lo dice; per gli altri ruoli non c'è nulla (a meno che il numero fosse acceso da prima di un
 * cambio di ruolo: il database lo spegne da sé, vedi il blocco TRAGUARDI di supabase/schema.sql).
 */
export async function ShowStatsSetting({ supabase, userId, locale }: { supabase: Db; userId: string; locale: Locale }) {
  const own = await readOwnShowStats(supabase, userId);
  if (!isShowcaseBadge(own.badge)) return null;
  const L = achievementLabels[locale].account;
  return (
    <section id="showcase-stats" className="mt-12 scroll-mt-24">
      <h2 className="t-section">{L.title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.intro}</p>
      {own.status === "ok" ? (
        <ShowStatsToggle initial={own.showStats} labels={L} />
      ) : (
        <p className="card-night mt-4 p-6 text-pale-muted">{own.status === "missing" ? L.missing : L.readError}</p>
      )}
    </section>
  );
}
