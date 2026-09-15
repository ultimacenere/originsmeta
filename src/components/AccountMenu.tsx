"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import type { Profile } from "@/lib/community/types";

export type AccountLabels = { login: string; account: string; builder: string; logout: string };

type Session = { id: string; email?: string } | null | undefined;

/** Stato di accesso nell'header: link "Accedi" oppure avatar con menu. Si idrata lato client, le pagine restano statiche. */
export function AccountMenu({ locale, labels }: { locale: string; labels: AccountLabels }) {
  const [user, setUser] = useState<Session>(supabaseEnabled ? undefined : null);
  const [profile, setProfile] = useState<Profile | null>(null);

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
        const { data } = await sb.from("profiles").select("username, display_name, avatar_url").eq("id", u.id).maybeSingle();
        if (alive) setProfile((data as Profile | null) ?? null);
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

  if (!supabaseEnabled) return null;
  if (!user) {
    return (
      <Link href={`/${locale}/login`} className="btn btn-ghost px-3 py-1.5 text-xs" aria-busy={user === undefined}>
        {labels.login}
      </Link>
    );
  }
  const name = profile?.display_name || profile?.username || user.email?.split("@")[0] || "player";
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-felt-line py-0.5 pl-0.5 pr-3 text-xs text-chalk hover:border-mint [&::-webkit-details-marker]:hidden" aria-label={labels.account}>
        <Avatar profile={profile} name={name} />
        <span className="hidden max-w-[9rem] truncate font-display font-medium sm:inline">{name}</span>
      </summary>
      <nav className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-felt-line bg-felt-deep p-2 shadow-lift" aria-label={labels.account}>
        <p className="truncate px-3 py-1 font-mono text-[11px] text-chalk-muted">{profile?.username ? `@${profile.username}` : user.email}</p>
        <Link href={`/${locale}/account`} className="block rounded-lg px-3 py-2 text-sm text-chalk hover:bg-felt-soft hover:text-mint">
          {labels.account}
        </Link>
        <Link href={`/${locale}/deck-builder`} className="block rounded-lg px-3 py-2 text-sm text-chalk hover:bg-felt-soft hover:text-mint">
          {labels.builder}
        </Link>
        <SignOutButton locale={locale} label={labels.logout} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-chalk-muted hover:bg-felt-soft hover:text-crimson" />
      </nav>
    </details>
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
    <button type="button" onClick={signOut} disabled={busy} className={className}>
      {label}
    </button>
  );
}
