"use client";

import Link from "next/link";
import { deleteCommunityGuide, setCommunityGuideStatus } from "@/lib/community/guideActions";
import type { CommunityGuideLabels } from "@/lib/communityGuideLabels";
import { ConfirmButton } from "../ConfirmButton";
import { useGuideViewer } from "./useGuideViewer";

/**
 * Comandi sulla pagina pubblica di una guida della community (pacchetto GUIDE, 27/09/2026), visibili solo a chi può
 * usarli (verificato nel browser; il database ricontrolla a ogni scrittura): il proprietario la modifica, la riporta tra
 * le bozze o la elimina; lo staff (admin o tag Staff) la nasconde. Una guida nascosta non ha pagina pubblica: la si
 * rimette online dalla pagina di modifica.
 */
export function CommunityGuideActions({
  guideId,
  ownerId,
  locale,
  editHref,
  backHref,
  labels,
}: {
  guideId: string;
  ownerId: string;
  locale: string;
  editHref: string;
  /** la pagina della guida, per tornarci dopo "Nascondi" */
  backHref: string;
  labels: CommunityGuideLabels["owner"];
}) {
  const viewer = useGuideViewer();
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
          <form action={setCommunityGuideStatus}>
            <input type="hidden" name="id" value={guideId} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="status" value="draft" />
            <button type="submit" className="btn btn-ink text-xs">
              {labels.unpublish}
            </button>
          </form>
          {/* rosso "bad" leggibile sul blu notte, come l'eliminazione dei mazzi */}
          <form action={deleteCommunityGuide}>
            <input type="hidden" name="id" value={guideId} />
            <input type="hidden" name="locale" value={locale} />
            <ConfirmButton label={labels.delete} confirm={labels.confirmDelete} className="btn btn-danger text-xs" />
          </form>
        </>
      ) : null}
      {viewer.staff ? (
        <form action={setCommunityGuideStatus}>
          <input type="hidden" name="id" value={guideId} />
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
