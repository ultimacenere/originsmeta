"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { deleteDeck, setDeckStatus } from "@/lib/community/actions";
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
}: {
  deckId: string;
  ownerId: string;
  status: "published" | "hidden" | "draft";
  locale: string;
  editHref: string;
  labels: OwnerLabels;
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
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-night-2/80 p-3">
      <Link href={editHref} className="btn btn-ink text-xs">
        {labels.edit}
      </Link>
      <form action={setDeckStatus}>
        <input type="hidden" name="id" value={deckId} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="status" value={status === "hidden" ? "published" : "hidden"} />
        <button type="submit" className="btn btn-ink text-xs">
          {status === "hidden" ? labels.unhide : labels.hide}
        </button>
      </form>
      {/* conferma prima di eliminare, come nel profilo (ConfirmButton); rosso "bad" leggibile sul blu notte (5,2:1) */}
      <form action={deleteDeck}>
        <input type="hidden" name="id" value={deckId} />
        <input type="hidden" name="locale" value={locale} />
        <ConfirmButton label={labels.delete} confirm={labels.confirmDelete} className="btn btn-danger text-xs" />
      </form>
    </div>
  );
}
