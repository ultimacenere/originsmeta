"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { canPublishComics } from "@/lib/community/badges";

/** Chi guarda la pagina, per i comandi dei fumetti: id, se può pubblicare fumetti (Creator, Staff, admin) e se è dello staff. */
export type ComicViewer = { userId: string; canPublish: boolean; staff: boolean };

/**
 * Legge nel browser la sessione e il ruolo di chi guarda (pacchetto FUMETTI, 29/09/2026), come `useGuideViewer`: le
 * pagine dei fumetti, /news e la home sono ISR, quindi il server non conosce l'utente. Serve solo a mostrare i comandi
 * giusti (Pubblica un fumetto, Modifica, Nascondi): il permesso vero lo decide il database a ogni scrittura.
 */
export function useComicViewer(): ComicViewer | null {
  const [viewer, setViewer] = useState<ComicViewer | null>(null);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    (async () => {
      const { data } = await sb.auth.getSession();
      const id = data.session?.user.id;
      if (!id || !alive) return;
      const { data: p } = await sb.from("profiles").select("role, badge").eq("id", id).maybeSingle();
      const row = p as { role: string | null; badge: string | null } | null;
      if (alive) setViewer({ userId: id, canPublish: canPublishComics(row?.badge, row?.role), staff: row?.role === "admin" || row?.badge === "staff" });
    })().catch(() => {
      // senza sessione o senza rete restano i comandi di chi non ha fatto l'accesso
    });
    return () => {
      alive = false;
    };
  }, []);
  return viewer;
}
