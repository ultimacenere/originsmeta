"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { reportCommunityGuide, type GuideActionState } from "@/lib/community/guideActions";
import { REPORT_REASON_MAX } from "@/lib/community/guides";
import type { CommunityGuideLabels } from "@/lib/communityGuideLabels";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * "Segnala questa guida" in fondo alla pagina di una guida della community (pacchetto GUIDE, 27/09/2026): in piccolo,
 * come la segnalazione dei mazzi. Con l'accesso fatto apre un campo per il motivo (testo semplice, 3-500 caratteri) e
 * manda la segnalazione con la Server Action `reportCommunityGuide` (una per utente e per guida, 5 al giorno, mai sulla
 * propria: lo decide il database), che avvisa lo staff sul canale privato di Discord alla prima segnalazione della
 * giornata. Senza accesso porta al login e poi di nuovo qui. All'autore della guida non si mostra.
 */
export function GuideReportForm({ guideId, ownerId, loginHref, labels }: { guideId: string; ownerId: string; loginHref: string; labels: CommunityGuideLabels["report"] }) {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [mine, setMine] = useState(false);
  const [state, action, pending] = useActionState<GuideActionState, FormData>(reportCommunityGuide, {});

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSignedIn(Boolean(data.session));
      setMine(data.session?.user.id === ownerId);
    });
    return () => {
      alive = false;
    };
  }, [ownerId]);

  if (mine) return null;
  if (state.ok) return <p className="text-xs text-good" role="status">{labels.sent}</p>;
  if (signedIn === false) {
    return (
      <Link href={loginHref} className="text-xs text-pale-muted underline underline-offset-2 hover:text-pale" prefetch={false}>
        {labels.login}
      </Link>
    );
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-pale-muted underline underline-offset-2 hover:text-pale" disabled={signedIn === null}>
        {labels.open}
      </button>
    );
  }
  const error = state.error ? ((labels.errors as Record<string, string>)[state.error] ?? labels.errors.db) : null;
  return (
    <form action={action} className="ml-auto w-full max-w-md text-left">
      <input type="hidden" name="id" value={guideId} />
      <label className="block">
        <span className="kicker text-pale-muted">{labels.reason}</span>
        <textarea
          name="reason"
          required
          minLength={3}
          maxLength={REPORT_REASON_MAX}
          rows={3}
          placeholder={labels.placeholder}
          className="mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-sm text-pale placeholder:text-pale-muted/80 focus:border-mint"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "guide-report-error" : undefined}
        />
      </label>
      {error ? (
        <p id="guide-report-error" className="mt-1 text-xs text-bad" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost text-xs">
          {labels.cancel}
        </button>
        <button type="submit" className="btn btn-ink text-xs" disabled={pending}>
          {pending ? labels.sending : labels.send}
        </button>
      </div>
    </form>
  );
}
