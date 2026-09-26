"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFollow } from "@/lib/community/followActions";
import { trackEvent } from "@/lib/analytics";

/**
 * "Smetti di seguire" nell'elenco "Chi segui" di /account (pacchetto SEGUI, 27/09/2026). Scrive con la Server Action
 * `setFollow`, manda l'evento `unfollow` (placement account) e ridisegna la pagina (dinamica), che non mostra più il
 * profilo. Con un errore il profilo resta e il motivo compare accanto al tasto.
 */
export function UnfollowButton({
  profileId,
  label,
  ariaLabel,
  pendingLabel,
  errorLabel,
}: {
  profileId: string;
  label: string;
  ariaLabel: string;
  pendingLabel: string;
  errorLabel: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  const run = () => {
    if (pending) return;
    setFailed(false);
    start(async () => {
      let ok = false;
      try {
        ok = !(await setFollow(profileId, false)).error;
      } catch {
        ok = false;
      }
      if (!ok) {
        setFailed(true);
        return;
      }
      trackEvent("unfollow", { placement: "account" });
      router.refresh();
    });
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" onClick={run} disabled={pending} aria-busy={pending} aria-label={ariaLabel} className="btn btn-danger text-xs">
        {pending ? pendingLabel : label}
      </button>
      {failed ? (
        <span role="alert" className="text-xs font-semibold text-bad">
          {errorLabel}
        </span>
      ) : null}
    </span>
  );
}
