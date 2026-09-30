"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { toggleFavorite } from "@/lib/community/favoriteActions";
import { trackEvent } from "@/lib/analytics";
import type { FavoriteLabels } from "@/lib/favoriteLabels";

/**
 * "Salva" nella scheda di un mazzo della community (blocco PREFERITI E TENDENZA, 30/09/2026). La pagina è ISR: il numero
 * dei salvataggi arriva dall'HTML (`count`, null se la migrazione manca: allora il tasto non c'è), lo stato del proprio
 * salvataggio si legge nel browser. Il clic cambia subito tasto e numero, poi la Server Action scrive; con un errore
 * torna com'era e sotto compare il motivo. Chi non ha fatto l'accesso va alla pagina di accesso e torna qui.
 */
export function FavoriteButton({
  deckId,
  slug,
  count,
  loginHref,
  labels,
}: {
  deckId: string;
  slug: string;
  count: number | null;
  loginHref: string;
  labels: FavoriteLabels;
}) {
  const [uid, setUid] = useState<string | null | undefined>(supabaseEnabled ? undefined : null);
  const [saved, setSaved] = useState(false);
  const [n, setN] = useState(count ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || count === null) return;
    let alive = true;
    (async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      const id = session?.user.id ?? null;
      if (!alive) return;
      setUid(id);
      if (id) {
        const { data } = await sb.from("deck_favorites").select("deck_id").eq("deck_id", deckId).eq("user_id", id).maybeSingle();
        if (alive) setSaved(Boolean(data));
      }
    })();
    return () => {
      alive = false;
    };
  }, [deckId, count]);

  if (count === null || !supabaseEnabled) return null;
  const countText = n === 0 ? labels.countNone : n === 1 ? labels.countOne : labels.count.replace("{n}", String(n));
  const cls = `btn text-xs ${saved ? "btn-primary" : "btn-ghost"}`;

  const toggle = () => {
    const next = !saved;
    setError(null);
    setSaved(next);
    setN((x) => Math.max(0, x + (next ? 1 : -1)));
    start(async () => {
      const r = await toggleFavorite(deckId, next, slug);
      if (r.error) {
        setSaved(!next);
        setN((x) => Math.max(0, x + (next ? -1 : 1)));
        setError(r.error === "notLoggedIn" ? labels.loginToSave : (labels.errors[r.error as keyof FavoriteLabels["errors"]] ?? labels.errors.db));
        return;
      }
      if (typeof r.count === "number") setN(r.count);
      trackEvent(next ? "deck_save" : "deck_unsave", { placement: "deck_page" });
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {uid === null ? (
        <Link href={loginHref} className="btn btn-ghost text-xs">
          ☆ {labels.save}
        </Link>
      ) : (
        <button type="button" onClick={toggle} disabled={uid === undefined || pending} aria-pressed={saved} className={cls}>
          {saved ? `★ ${labels.saved}` : `☆ ${labels.save}`}
        </button>
      )}
      <span className="font-mono text-xs text-pale-muted" aria-live="polite">
        {error ? <span className="text-error">{error}</span> : uid === null && n === 0 ? labels.loginToSave : countText}
      </span>
    </div>
  );
}
