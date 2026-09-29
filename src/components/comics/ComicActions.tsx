"use client";

import Link from "next/link";
import { deleteComic, setComicStatus } from "@/lib/community/comicActions";
import type { ComicLabels } from "@/lib/comicLabels";
import { ConfirmButton } from "../ConfirmButton";
import { useComicViewer } from "./useComicViewer";

/**
 * Comandi sulla pagina pubblica di un fumetto (pacchetto FUMETTI, 29/09/2026), visibili solo a chi può usarli (verificato
 * nel browser; il database ricontrolla a ogni scrittura): il proprietario lo modifica, lo riporta tra le bozze o lo
 * elimina; lo staff (admin o tag Staff) lo nasconde. Un fumetto nascosto non ha pagina pubblica: lo si rimette online
 * dalla pagina di modifica.
 */
export function ComicActions({ comicId, ownerId, locale, editHref, backHref, labels }: { comicId: string; ownerId: string; locale: string; editHref: string; backHref: string; labels: ComicLabels["owner"] }) {
  const viewer = useComicViewer();
  if (!viewer) return null;
  const owner = viewer.userId === ownerId;
  if (!owner && !viewer.staff) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-night-2/80 p-3">
      {owner ? (
        <>
          <Link href={editHref} className="btn btn-ink text-xs" prefetch={false}>
            {labels.edit}
          </Link>
          <form action={setComicStatus}>
            <input type="hidden" name="id" value={comicId} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="status" value="draft" />
            <button type="submit" className="btn btn-ink text-xs">
              {labels.unpublish}
            </button>
          </form>
          <form action={deleteComic}>
            <input type="hidden" name="id" value={comicId} />
            <input type="hidden" name="locale" value={locale} />
            <ConfirmButton label={labels.delete} confirm={labels.confirmDelete} className="btn btn-danger text-xs" />
          </form>
        </>
      ) : null}
      {viewer.staff ? (
        <form action={setComicStatus}>
          <input type="hidden" name="id" value={comicId} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="status" value="hidden" />
          <input type="hidden" name="back" value={backHref} />
          <button type="submit" className="btn btn-ink text-xs">
            {labels.hide}
          </button>
        </form>
      ) : null}
    </div>
  );
}
