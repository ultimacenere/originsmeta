"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { canPublishGuides } from "@/lib/community/badges";

/** Chi guarda la pagina, per i comandi delle guide: id, se può pubblicare guide (il ruolo) e se è dello staff. */
export type GuideViewer = { userId: string; canPublish: boolean; staff: boolean };

/**
 * Legge nel browser la sessione e il ruolo di chi guarda (pacchetto GUIDE, 27/09/2026): le pagine delle guide e /guides
 * sono statiche o ISR, quindi il server non conosce l'utente. I profili sono pubblici (policy "profiles are public"),
 * quindi ruolo e tag si leggono con il client del browser. Serve solo a mostrare i comandi giusti (Scrivi una guida,
 * Modifica, Nascondi): il permesso vero lo decide il database a ogni scrittura. null finché non si sa o senza accesso.
 */
export function useGuideViewer(): GuideViewer | null {
  const [viewer, setViewer] = useState<GuideViewer | null>(null);
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
      if (alive) setViewer({ userId: id, canPublish: canPublishGuides(row?.badge, row?.role), staff: row?.role === "admin" || row?.badge === "staff" });
    })().catch(() => {
      // senza sessione o senza rete restano i comandi di chi non ha fatto l'accesso
    });
    return () => {
      alive = false;
    };
  }, []);
  return viewer;
}
