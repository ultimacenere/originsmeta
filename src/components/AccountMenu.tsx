"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import type { Profile } from "@/lib/community/types";
import { AutoCloseDetails } from "./AutoCloseDetails";
import { NavLink } from "./NavLink";
// casella messaggi (26/09/2026, pacchetto INBOX): numero dei non letti e voci del menu, caricati nel browser
import { InboxCount, InboxMenuLinks, inboxAriaSuffix, useInboxStatus } from "./inbox/InboxIndicator";

export type AccountLabels = { login: string; account: string; builder: string; logout: string; player: string };

type Session = { id: string; email?: string } | null | undefined;

/**
 * Indirizzo del tasto "Accedi": la pagina di accesso con `next` = percorso e query correnti, così dopo l'accesso
 * si torna dove si era (rilievo UX-11 del 21/09/2026: la pagina di accesso lo prometteva, ma il tasto non lo
 * portava con sé). Su /login si resta sull'indirizzo attuale (che ha già il suo `next`), su /account il `next`
 * non serve: è già la destinazione predefinita.
 */
export function loginHref(locale: string, pathname: string | null, query: string): string {
  const base = `/${locale}/login`;
  if (!pathname) return base;
  const under = (p: string) => pathname === p || pathname.startsWith(`${p}/`);
  if (under(base)) return query ? `${base}?${query}` : base;
  if (under(`/${locale}/account`)) return base;
  const next = query ? `${pathname}?${query}` : pathname;
  return `${base}?next=${encodeURIComponent(next)}`;
}

/**
 * Stessa misura del tasto "Accedi": niente salto della riga quando la sessione arriva. Il padding generoso di
 * .btn-primary (che tiene il testo sul centro rosso-magenta del gradiente) si riduce solo dove la riga è piena:
 * sotto 640 px (logo + Accedi + Menu nei 328 px utili di un telefono da 360) e tra 1280 e 1535 px, dove compare
 * il menu completo con la ricerca (misurato: altrimenti la riga sfora di 41 px a 1280).
 */
const slot = "h-8 min-w-[5rem] sm:min-w-[6.125rem] xl:min-w-[5.25rem] 2xl:min-w-[6.125rem]";
const loginPad = "px-3 sm:px-[calc(1.45rem-2px)] xl:px-3.5 2xl:px-[calc(1.45rem-2px)]";

/**
 * Segnaposto neutro finché la sessione non è nota: a chi è già dentro non si mostra un lampo di "Accedi".
 * È solo grafico (aria-hidden); il contenitore dichiara aria-busy mentre lo stato di accesso si sta caricando.
 */
function SessionPlaceholder() {
  return (
    <span className="inline-flex" aria-busy="true">
      <span aria-hidden="true" className={`inline-block ${slot} animate-pulse rounded-full bg-felt-soft`} />
    </span>
  );
}

/** Tasto "Accedi" con il ritorno. useSearchParams sta qui dentro, sotto Suspense, per non toccare l'header statico. */
function LoginLink({ locale, label }: { locale: string; label: string }) {
  const pathname = usePathname();
  const search = useSearchParams();
  return (
    <Link href={loginHref(locale, pathname, search.toString())} className={`btn btn-primary ${slot} ${loginPad} py-0 text-xs`}>
      {label}
    </Link>
  );
}

/** Stato di accesso nell'header: tasto "Accedi" (azione primaria) oppure avatar con menu. Si idrata lato client, le pagine restano statiche. */
export function AccountMenu({ locale, labels }: { locale: string; labels: AccountLabels }) {
  const [user, setUser] = useState<Session>(supabaseEnabled ? undefined : null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // finché il profilo non è arrivato il nome resta generico: prima si vedeva per un attimo la parte dell'email
  // prima della @ (e per sempre se la lettura del profilo falliva), da evitare anche per chi entra in diretta
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    const load = async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!alive) return;
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email } : null);
      if (u) {
        const { data, error } = await sb.from("profiles").select("username, display_name, avatar_url").eq("id", u.id).maybeSingle();
        if (!alive) return;
        setProfile((data as Profile | null) ?? null);
        // con un errore di rete il profilo potrebbe esistere: niente ripiego sull'email, resta il nome generico
        setProfileReady(!error);
      } else setProfile(null);
    };
    load();
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") setTimeout(load, 0);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const inbox = useInboxStatus(user ? user.id : null);

  if (!supabaseEnabled) return null;
  if (user === undefined) return <SessionPlaceholder />;
  if (!user) {
    return (
      <Suspense fallback={<SessionPlaceholder />}>
        <LoginLink locale={locale} label={labels.login} />
      </Suspense>
    );
  }
  const name = profile?.display_name || profile?.username || (profileReady ? user.email?.split("@")[0] : "") || labels.player;
  return (
    <AutoCloseDetails
      className="relative"
      summaryClassName="flex cursor-pointer list-none items-center gap-2 rounded-full border border-felt-line py-0.5 pl-0.5 pr-3 text-xs text-chalk hover:border-mint [&::-webkit-details-marker]:hidden"
      summaryLabel={`${labels.account}: ${name}${inboxAriaSuffix(inbox, locale)}`}
      summary={
        <>
          <Avatar profile={profile} name={name} />
          {/* il nome si nasconde tra 1280 e 1535 px, dove la riga ospita anche il menu completo e la ricerca */}
          <span className="hidden max-w-[9rem] truncate font-display font-medium sm:inline xl:hidden 2xl:inline">{name}</span>
          <InboxCount status={inbox} />
        </>
      }
    >
      <nav className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-felt-line bg-felt-deep p-2 shadow-lift" aria-label={labels.account}>
        <p className="truncate px-3 py-1 font-mono text-[11px] text-chalk-muted">{profile?.username ? `@${profile.username}` : profileReady ? user.email : ""}</p>
        <NavLink href={`/${locale}/account`} className="nav-link-block">
          {labels.account}
        </NavLink>
        <InboxMenuLinks locale={locale} status={inbox} />
        <NavLink href={`/${locale}/deck-builder`} className="nav-link-block">
          {labels.builder}
        </NavLink>
        <SignOutButton locale={locale} label={labels.logout} className="nav-link nav-link-block text-chalk-muted hover:text-pink" />
      </nav>
    </AutoCloseDetails>
  );
}

export function Avatar({ profile, name, size = 28 }: { profile: Profile | null | undefined; name: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return profile?.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={profile.avatar_url} alt="" width={size} height={size} className="rounded-full bg-felt-soft object-cover" style={{ width: size, height: size }} referrerPolicy="no-referrer" />
  ) : (
    <span className="flex items-center justify-center rounded-full bg-mint font-display text-[11px] font-bold text-ink" style={{ width: size, height: size }} aria-hidden="true">
      {initial}
    </span>
  );
}

export function SignOutButton({ locale, label, className = "btn btn-ghost text-xs" }: { locale: string; label: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const signOut = async () => {
    const sb = supabaseBrowser();
    if (!sb) return;
    setBusy(true);
    await sb.auth.signOut();
    router.push(`/${locale}`);
    router.refresh();
  };
  return (
    <button type="button" onClick={signOut} disabled={busy} aria-busy={busy} className={className}>
      {label}
    </button>
  );
}
