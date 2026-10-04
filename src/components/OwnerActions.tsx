"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { deleteDeck, setDeckStatus } from "@/lib/community/actions";
import { deleteDeckSet, setDeckSetStatus } from "@/lib/community/deckSetActions";
import { ConfirmButton } from "./ConfirmButton";

export type OwnerLabels = { edit: string; hide: string; unhide: string; delete: string; confirmDelete: string };

/** Comandi visibili solo al proprietario del mazzo (verificato nel browser; il server ricontrolla con le policy RLS). */
export function OwnerActions({
  deckId,
  ownerId,
  status,
  locale,
  editHref,
  labels,
  update,
  kind = "deck",
}: {
  deckId: string;
  ownerId: string;
  status: "published" | "hidden" | "draft";
  locale: string;
  editHref: string;
  labels: OwnerLabels;
  /** "Aggiorna alla versione …" (pacchetto VERSIONI, 30/09/2026): solo quando il mazzo è fermo a una patch di prima */
  update?: { href: string; label: string };
  /** mazzo singolo (default) o mazzo torneo (04/10/2026: setDeckSetStatus e deleteDeckSet) */
  kind?: "deck" | "set";
}) {
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (alive) setIsOwner(data.session?.user.id === ownerId);
    });
    return () => {
      alive = false;
    };
  }, [ownerId]);
  if (!isOwner) return null;
  const statusAction = kind === "set" ? setDeckSetStatus : setDeckStatus;
  const deleteAction = kind === "set" ? deleteDeckSet : deleteDeck;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-night-2/80 p-3">
      {update ? (
        <Link href={update.href} className="btn btn-primary text-xs">
          {update.label}
        </Link>
      ) : null}
      <Link href={editHref} className="btn btn-ink text-xs">
        {labels.edit}
      </Link>
      <form action={statusAction}>
        <input type="hidden" name="id" value={deckId} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="status" value={status === "hidden" ? "published" : "hidden"} />
        <button type="submit" className="btn btn-ink text-xs">
          {status === "hidden" ? labels.unhide : labels.hide}
        </button>
      </form>
      {/* conferma prima di eliminare, come nel profilo (ConfirmButton); rosso "bad" leggibile sul blu notte (5,2:1) */}
      <form action={deleteAction}>
        <input type="hidden" name="id" value={deckId} />
        <input type="hidden" name="locale" value={locale} />
        <ConfirmButton label={labels.delete} confirm={labels.confirmDelete} className="btn btn-danger text-xs" />
      </form>
    </div>
  );
}
