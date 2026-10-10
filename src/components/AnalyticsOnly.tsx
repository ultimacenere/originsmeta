"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NavLink } from "./NavLink";
import { supabaseBrowser } from "@/lib/supabase/client";
import { canSeeAnalytics } from "@/lib/community/badges";

/**
 * Le strade verso OriginsMeta Analytics durante la prova (10/10/2026, Pierluigi: "la pagina dei win rate la vedo sotto
 * tierlist ma non c'è un percorso sul menu"): header, testata della tier list e menu dell'account sono statici e uguali
 * per tutti, quindi la voce "Win rate" e il link ad Analytics li mostra questo componente, nel browser, solo a chi ha un
 * ruolo ammesso (`canSeeAnalytics` di badges.ts: Creator, Autore, Pro, Staff, admin). Le pagine restano statiche; il
 * controllo vero lo fanno le pagine stesse (404 per gli altri, analyticsAccess.ts). Si usa solo finché
 * `ANALYTICS_PUBLIC` è spento: aperte a tutti, le voci tornano statiche.
 *
 * Una lettura di sessione e profilo per pagina, condivisa da tutte le voci (`cached`), e di nuovo a ogni cambio di
 * accesso.
 */
let cached: { key: string; value: Promise<boolean> } | null = null;

function accessFor(): Promise<boolean> {
  const sb = supabaseBrowser();
  if (!sb) return Promise.resolve(false);
  return sb.auth.getSession().then(async ({ data: { session } }) => {
    const id = session?.user.id;
    if (!id) return false;
    if (cached?.key === id) return cached.value;
    const value = Promise.resolve(sb.from("profiles").select("badge, role").eq("id", id).maybeSingle()).then(({ data }) => {
      const p = data as { badge: string | null; role: string | null } | null;
      return canSeeAnalytics(p?.badge, p?.role);
    });
    cached = { key: id, value };
    return value;
  });
}

export function useAnalyticsAccess(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    const load = () => {
      accessFor()
        .then((v) => alive && setOk(v))
        .catch(() => alive && setOk(false));
    };
    load();
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        cached = null;
        setTimeout(load, 0);
      }
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  return ok;
}


/**
 * Le pagine di Analytics in prova: gli indirizzi stanno qui, nel codice del browser, e non nei dati della pagina (se
 * il link arrivasse dal server come contenuto di `AnalyticsOnly`, l'indirizzo finirebbe nell'HTML di tutti).
 */
const TEST_PAGES = { winrate: "/tier-list/win-rate", app: "/analytics" } as const;
export type AnalyticsPage = keyof typeof TEST_PAGES;
export const analyticsPagePath = (locale: string, page: AnalyticsPage) => `/${locale}${TEST_PAGES[page]}`;

/** Voce di menu verso una pagina in prova, solo per i ruoli ammessi (sottomenu "Tier list" dell'header). */
export function AnalyticsNavLink({ locale, page, label, className, exact }: { locale: string; page: AnalyticsPage; label: string; className?: string; exact?: boolean }) {
  if (!useAnalyticsAccess()) return null;
  return (
    <NavLink href={analyticsPagePath(locale, page)} exact={exact} className={className}>
      {label}
    </NavLink>
  );
}

/** La scheda "Win rate" della testata della tier list, solo per i ruoli ammessi (stesse classi delle altre schede). */
export function WinrateTab({ locale, label, state, on }: { locale: string; label: string; state?: string; on: boolean }) {
  if (!useAnalyticsAccess()) return null;
  return (
    <Link
      href={analyticsPagePath(locale, "winrate")}
      aria-current={on ? "page" : undefined}
      className={`tier-src min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:flex-none sm:basis-auto ${on ? "is-on" : ""}`}
    >
      <span className="tier-src-name">{label}</span>
      {state ? <span className="tier-src-state">{state}</span> : null}
    </Link>
  );
}
