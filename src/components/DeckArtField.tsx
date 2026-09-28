"use client";

import { useEffect, useRef, useState } from "react";
import { DECK_ART_ASPECT, DECK_ART_MAX_BYTES, DECK_ART_MIN, DECK_ART_SIZE } from "@/lib/community/deckArt";
import { PROFILE_MEDIA_BUCKET, mediaPublicUrl } from "@/lib/community/profileMedia";
import { fillLabel } from "@/lib/community/deckQuality";
import { supabaseUrl } from "@/lib/supabase/env";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { DeckArtFormLabels } from "@/lib/deckArtLabels";
import { MediaError, encodeImage, uploadMedia } from "./showcase/mediaUpload";

/**
 * Artwork della Leggendaria nel modulo di pubblicazione e di modifica di un mazzo (29/09/2026, Creator e Staff): il
 * browser ritaglia l'immagine al centro in 5:7, la riduce a 750 × 1050 e la ricodifica (WebP, niente dati EXIF), poi la
 * carica nello Storage nella cartella `<id>/deck/` di chi la carica; nel modulo va solo il percorso (`art_path`, campo
 * nascosto), che la Server Action salva sul mazzo. Vuoto = la carta ufficiale.
 *
 * `mode`: `upload` per chi può caricare (il proprietario con il ruolo), `remove` per chi può solo togliere l'artwork che
 * c'è (lo staff che corregge il mazzo di un altro, `notOwner`; il proprietario che ha perso il ruolo, `noRole`). Le prove
 * caricate e poi sostituite si cancellano subito; l'artwork salvato si cancella dopo il salvataggio del mazzo
 * (`PublishDeckForm`), mai prima: se il salvataggio non riesce il mazzo tiene quello che aveva.
 */
export function DeckArtField({
  labels: L,
  legendary,
  initialPath,
  savedPath,
  mode,
  reason,
  onChange,
}: {
  labels: DeckArtFormLabels;
  /** la Leggendaria del mazzo: nome per il testo, illustrazione ufficiale per il confronto (se è nel database) */
  legendary: { name: string; image?: string } | null;
  /** percorso con cui il campo parte: quello salvato (modifica) o quello della bozza locale (pubblicazione) */
  initialPath: string | null;
  /** l'artwork salvato nel database: non si cancella qui, anche se lo si sostituisce */
  savedPath: string | null;
  mode: "upload" | "remove";
  /** perché si può solo togliere (mode "remove") */
  reason?: "notOwner" | "noRole";
  /** dopo ogni cambio del percorso (il modulo risalva la bozza locale) */
  onChange?: () => void;
}) {
  const [path, setPath] = useState<string | null>(initialPath);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // il primo giro non conta: solo i cambi fatti dall'utente risalvano la bozza
  const first = useRef(true);
  const notify = useRef(onChange);
  useEffect(() => {
    notify.current = onChange;
  });
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    notify.current?.();
  }, [path]);

  /** Toglie dallo Storage una prova non salvata (mai l'artwork salvato: lo toglie il modulo dopo il salvataggio). */
  const dropUnsaved = (p: string | null, keep?: string) => {
    if (!p || p === savedPath || p === keep) return;
    const sb = supabaseBrowser();
    if (sb) void sb.storage.from(PROFILE_MEDIA_BUCKET).remove([p]);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new MediaError("upload");
      const { data } = await sb.auth.getUser();
      const userId = data.user?.id;
      if (!userId) throw new MediaError("upload");
      const blob = await encodeImage(file, { aspect: DECK_ART_ASPECT, maxSide: DECK_ART_SIZE.height, maxBytes: DECK_ART_MAX_BYTES });
      const next = await uploadMedia(sb, userId, "deck", blob);
      dropUnsaved(path, next);
      setPath(next);
    } catch (err) {
      setError(L.errors[err instanceof MediaError ? err.code : "upload"]);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const hint = fillLabel(L.hint, {
    legendary: legendary?.name ?? "—",
    minw: String(DECK_ART_MIN.width),
    minh: String(DECK_ART_MIN.height),
    w: String(DECK_ART_SIZE.width),
    h: String(DECK_ART_SIZE.height),
  });
  const frame = "card-chip-art is-legendary !h-[140px] !w-[100px]";

  return (
    <fieldset id="pub-art" tabIndex={-1} className="mt-5 rounded-xl border-2 border-gold/70 bg-night-2/80 px-4 py-3">
      <legend className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 font-display text-sm font-bold text-sky">
        {L.title}
        <span className="stat-pill whitespace-nowrap bg-gold px-1.5 py-0 text-[10px] font-extrabold uppercase text-ink">{L.roles}</span>
      </legend>
      <input type="hidden" name="art_path" value={path ?? ""} />
      <p className="text-xs text-pale-muted">{hint}</p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        {legendary?.image ? (
          <figure className="text-center">
            <span className={`${frame} ${path ? "opacity-60" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={legendary.image} alt="" loading="lazy" decoding="async" />
            </span>
            <figcaption className="mt-1 text-[11px] text-pale-muted">{L.official}</figcaption>
          </figure>
        ) : null}
        {path ? (
          <>
            <span aria-hidden="true" className="pb-8 text-pale-muted">
              →
            </span>
            <figure className="text-center">
              <span className={frame}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaPublicUrl(supabaseUrl, path)} alt={L.custom} decoding="async" />
              </span>
              <figcaption className="mt-1 text-[11px] font-semibold text-pale">✓ {L.custom}</figcaption>
            </figure>
          </>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {mode === "upload" ? (
          <label className={`btn btn-ink text-xs has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint ${busy ? "opacity-60" : "cursor-pointer"}`}>
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
            {busy ? L.uploading : path ? L.replace : L.upload}
          </label>
        ) : (
          <p className="text-xs text-pale-muted">{reason === "noRole" ? L.noRole : L.notOwner}</p>
        )}
        {path ? (
          <button
            type="button"
            onClick={() => {
              dropUnsaved(path);
              setPath(null);
              setError(null);
            }}
            className="text-xs text-mint underline underline-offset-2 hover:text-sky"
          >
            {L.remove}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="alert-bad mt-3" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
