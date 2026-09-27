"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { isShowcaseBadge } from "@/lib/community/badges";
import { FOLLOW_MAX, fillFollow, followersText, loginReturnHref, parseFollowState, toggledState, type FollowErrorCode, type FollowState } from "@/lib/community/follows";
import { setFollow } from "@/lib/community/followActions";
import { followNavLabelsFor } from "@/lib/followNavLabels";
import { trackEvent } from "@/lib/analytics";

/**
 * Tasto "Segui / Segui già" (pacchetto SEGUI, 27/09/2026) sulla pagina /u di un profilo vetrina e accanto al nome di chi
 * ha pubblicato un mazzo. Le pagine restano ISR: stato e numero dei follower si leggono nel browser (RPC `follow_state`).
 * Finché non arrivano c'è un segnaposto invisibile della stessa misura del tasto (niente spostamento della pagina, CLS);
 * se non arrivano (migrazione mancante, rete giù) il tasto non c'è. Solo per i ruoli con vetrina (Creator, Autore, Pro,
 * Staff), che sono gli unici che si possono seguire (lo decide il database).
 *
 * - Chi non ha fatto l'accesso: il tasto porta alla pagina di accesso e poi torna qui (`loginReturnHref`).
 * - Sul proprio profilo: solo il numero dei follower.
 * - Il clic cambia subito il tasto e il numero, poi la Server Action `setFollow` scrive e rilegge; con un errore il tasto
 *   torna com'era e sotto compare il motivo. Eventi `follow` / `unfollow` con il posto del tasto (`placement`), solo se
 *   il database ha davvero cambiato qualcosa (`changed`).
 *
 * `compact`: variante piccola accanto al nome nella scheda di un mazzo, senza il numero dei follower. Solo elementi in
 * riga (span, button, a): sta anche dentro un paragrafo.
 */
export function FollowButton({
  profileId,
  name,
  badge,
  locale,
  placement,
  compact = false,
  className = "",
}: {
  profileId: string;
  /** nome mostrato del profilo, per i lettori di schermo */
  name: string;
  badge: string | null | undefined;
  locale: string;
  placement: "profile" | "deck_page";
  compact?: boolean;
  className?: string;
}) {
  const L = followNavLabelsFor(locale);
  const pathname = usePathname();
  const showcase = isShowcaseBadge(badge);
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [state, setState] = useState<FollowState | null>(null);
  /** lo stato non si legge (migrazione mancante, rete giù): niente tasto e niente segnaposto */
  const [off, setOff] = useState(false);
  const [error, setError] = useState<FollowErrorCode | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!showcase) return;
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    (async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      const res = await sb.rpc("follow_state", { p_profile: profileId });
      if (!alive) return;
      // senza la migrazione (funzione mancante) o con un errore: niente tasto
      if (res.error) {
        setOff(true);
        return;
      }
      setUid(session?.user.id ?? null);
      setState(parseFollowState(res.data));
    })().catch(() => {
      // rete assente: niente tasto
      if (alive) setOff(true);
    });
    return () => {
      alive = false;
    };
  }, [profileId, showcase]);

  if (!showcase || !supabaseEnabled || off) return null;

  const size = compact ? "px-3 py-1 text-[11px]" : "text-xs";
  // in attesa dello stato: un tasto invisibile con le stesse classi e lo stesso testo, così la pagina non si sposta
  if (uid === undefined) {
    return (
      <span aria-hidden="true" className={`invisible inline-flex max-w-full items-center ${className}`}>
        <span className={`btn btn-primary ${size}`}>{L.follow}</span>
      </span>
    );
  }
  if (!state?.followable) return null;

  const followers = compact ? null : <span className="font-mono text-xs text-pale-muted">{followersText(L, state.followers)}</span>;
  const errorText = error ? (error === "tooMany" ? fillFollow(L.errors.tooMany, { max: FOLLOW_MAX }) : L.errors[error]) : null;
  const wrap = `inline-flex max-w-full flex-wrap items-center gap-2 ${className}`;

  // sul proprio profilo niente tasto (il database non lo permetterebbe): solo il numero
  if (uid && uid === profileId) return followers ? <span className={wrap}>{followers}</span> : null;

  if (!uid) {
    return (
      <span className={wrap}>
        <Link href={loginReturnHref(locale, pathname)} prefetch={false} className={`btn btn-primary ${size}`} aria-label={fillFollow(L.loginAria, { name })}>
          {L.follow}
        </Link>
        {followers}
      </span>
    );
  }

  const toggle = () => {
    if (pending) return;
    const follow = !state.following;
    const before = state;
    setError(null);
    setState(toggledState(state, follow));
    start(async () => {
      let result: Awaited<ReturnType<typeof setFollow>>;
      try {
        result = await setFollow(profileId, follow);
      } catch {
        result = { error: "db" };
      }
      if (result.error) {
        setState(before);
        setError(result.error);
        // sessione scaduta nel frattempo: il tasto torna quello che porta all'accesso
        if (result.error === "notLoggedIn") setUid(null);
        return;
      }
      if (result.state) setState(result.state);
      // solo le azioni che il database ha registrato (non un "segui" che c'era già, da un'altra scheda)
      if (result.changed) trackEvent(follow ? "follow" : "unfollow", { placement });
    });
  };

  return (
    <span className={wrap}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-busy={pending}
        aria-label={fillFollow(state.following ? L.followingAria : L.followAria, { name })}
        title={state.following ? fillFollow(L.followingAria, { name }) : undefined}
        className={`btn ${state.following ? "btn-ink" : "btn-primary"} ${size}`}
      >
        {state.following ? (
          <>
            <span aria-hidden="true">✓</span> {L.following}
          </>
        ) : (
          L.follow
        )}
      </button>
      {followers}
      {errorText ? (
        <span role="alert" className="basis-full text-xs font-semibold text-bad">
          {errorText}
        </span>
      ) : null}
    </span>
  );
}
