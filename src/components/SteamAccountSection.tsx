import type { ReactNode } from "react";
import { formatDate, type Locale } from "@/lib/i18n";
import type { Db } from "@/lib/supabase/public";
import { steamLabels } from "@/lib/steamLabels";
import { parseSteamLinkStatus, steamMigrationMissing, type SteamLinkOutcome } from "@/lib/steam/link";
import { steamProfileUrl } from "@/lib/steam/openid";
import { unlinkSteam } from "@/lib/community/steamActions";
import { ConfirmButton } from "./ConfirmButton";
import { SteamAccountBeacon } from "./SteamAccountBeacon";
import { newTabProps, SteamLogo } from "./SteamButton";

/** Tono dell'esito: conferme in verde, annullamenti e avvisi in celeste, il resto in rosso (come il pannello di accesso). */
function toneOf(outcome: SteamLinkOutcome): "good" | "warn" | "bad" {
  if (outcome === "linked" || outcome === "already" || outcome === "unlinked") return "good";
  if (outcome === "cancelled" || outcome === "steamOnly" || outcome === "missing") return "warn";
  return "bad";
}

function Note({ tone, children }: { tone: "good" | "warn" | "bad"; children: ReactNode }) {
  if (tone === "bad") return <p className="alert-bad mt-4" role="status">{children}</p>;
  if (tone === "good") return <p className="alert-good mt-4" role="status">{children}</p>;
  return (
    <p className="mt-4 rounded-[10px] border-2 border-sky/60 bg-sky/[0.12] px-3.5 py-2.5 text-sm font-semibold leading-snug text-chalk" role="status">
      {children}
    </p>
  );
}

/**
 * Sezione "Account Steam" di /account (#steam, 09/11/2026, Pierluigi: "nel profilo dei nostri giocatori, dare la
 * possibilità di connettersi anche a steam"). Senza collegamento: "Collega Steam", che passa da /auth/steam?mode=link
 * (Steam conferma l'account, la rotta di ritorno scrive il collegamento con steam_link_set). Con il collegamento:
 * SteamID, data, link al profilo Steam e "Scollega Steam" (Server Action unlinkSteam), che non c'è per un account nato
 * con Steam senza altri modi per entrare. `outcome` = l'esito del giro appena fatto (`?steam=` nell'indirizzo).
 * Prima della migrazione del blocco STEAM la sezione lo dice al posto del tasto.
 */
export async function SteamAccountSection({ supabase, locale, outcome, loginOn }: { supabase: Db; locale: Locale; outcome: SteamLinkOutcome | null; loginOn: boolean }) {
  const L = steamLabels[locale];
  const res = await supabase.rpc("steam_link_status");
  const missing = steamMigrationMissing(res.error);
  if (res.error && !missing) console.error("[steam] steam_link_status:", res.error.code, res.error.message);
  const status = res.error ? null : parseSteamLinkStatus(res.data);
  const linkHref = `/auth/steam?mode=link&next=${encodeURIComponent(`/${locale}/account`)}`;

  let body: ReactNode;
  if (missing) body = <p className="text-pale-muted">{L.missing}</p>;
  else if (res.error) body = <p className="text-pale-muted">{L.readError}</p>;
  else if (status) {
    body = (
      <div className="flex flex-wrap items-center gap-4">
        <SteamLogo className="h-9 w-9 text-sky" />
        <div className="min-w-0 flex-1 basis-56">
          <p className="t-item">{L.connected}</p>
          <p className="break-all font-mono text-xs text-pale-muted">
            SteamID {status.steamId}
            {status.linkedAt ? ` · ${L.linkedOn.replace("{date}", formatDate(locale, status.linkedAt))}` : ""}
          </p>
          <a href={steamProfileUrl(status.steamId)} {...newTabProps} className="link-mint mt-1 inline-block text-sm font-bold">
            {L.openProfile}
          </a>
        </div>
        {status.steamOnly ? (
          <p className="max-w-sm basis-56 text-sm text-pale-muted">{L.steamOnly}</p>
        ) : (
          <form action={unlinkSteam}>
            <input type="hidden" name="locale" value={locale} />
            <ConfirmButton label={L.unlink} confirm={L.confirmUnlink} className="btn btn-ink text-xs" />
          </form>
        )}
      </div>
    );
  } else {
    body = (
      // un <a> e non un <Link>: è una rotta del server che rimanda a Steam
      <a href={linkHref} className="btn-steam btn-steam-dark py-3">
        <SteamLogo className="h-5 w-5" />
        <span>{L.connect}</span>
      </a>
    );
  }

  return (
    <section id="steam" className="mt-10 scroll-mt-24" aria-labelledby="steam-title">
      <h2 id="steam-title" className="t-section">
        {L.section}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">
        {L.intro}
        {loginOn ? ` ${L.introLogin}` : ""}
      </p>
      {outcome ? <Note tone={toneOf(outcome)}>{L.outcomes[outcome]}</Note> : null}
      <div className="card-night mt-4 p-6">{body}</div>
      {/* ancora #steam (tasto del popup "collega Steam", ritorno da Steam) ed evento steam_link */}
      <SteamAccountBeacon outcome={outcome} />
    </section>
  );
}
