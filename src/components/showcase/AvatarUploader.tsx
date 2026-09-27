"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseUrl } from "@/lib/supabase/env";
import { AVATAR_MAX_BYTES, AVATAR_SIZE, PROFILE_UPDATED_EVENT, mediaPublicUrl } from "@/lib/community/showcase";
import { saveAvatar, type AvatarActionState } from "@/lib/community/showcaseActions";
import { fillShowcase, type AvatarLabels } from "@/lib/showcaseLabels";
import { MediaError, cleanupMedia, encodeImage, uploadMedia } from "./mediaUpload";

/**
 * Foto profilo caricata dal sito (pacchetto VETRINA, 27/09/2026), per TUTTI gli iscritti: oggi la foto arriva solo da
 * Discord e chi entra con l'email ha la lettera. Il browser ritaglia l'immagine quadrata (512 px), la ricodifica e la
 * carica nella propria cartella del bucket; la Server Action `saveAvatar` salva il percorso e il database aggiorna
 * `avatar_url`, così la foto nuova compare ovunque (mazzi, tornei, directory, menu). Dopo il salvataggio si cancellano
 * i file vecchi della cartella (le pagine ISR che puntano ancora al file tolto mostrano l'iniziale per qualche minuto:
 * `Avatar` ripiega da solo) e si avvisa il menu dell'account, che rilegge la foto. "Togli la foto" riporta quella di
 * Discord, o la lettera.
 */
export function AvatarUploader({
  userId,
  name,
  initialPath,
  initialUrl,
  labels,
  privacyHref,
}: {
  userId: string;
  name: string;
  /** foto caricata dal sito (null: nessuna) */
  initialPath: string | null;
  /** foto mostrata adesso (`avatar_url`) */
  initialUrl: string | null;
  labels: AvatarLabels;
  /** paragrafo della privacy sulle immagini caricate (/privacy#profile-media) */
  privacyHref: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState<string | null>(initialPath);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const src = path ? mediaPublicUrl(supabaseUrl, path) : url;
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const e = labels.errors;
  const failure = (res: AvatarActionState) => (res.error === "tooFast" ? fillShowcase(e.tooFast, { seconds: res.retryIn ?? 10 }) : e[res.error ?? "db"]);
  const saved = () => {
    // il menu dell'account nell'header legge il profilo solo al montaggio: così rilegge la foto
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
    router.refresh();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    setBusy(true);
    const sb = supabaseBrowser();
    let uploaded: string | null = null;
    try {
      if (!sb) throw new MediaError("upload");
      const blob = await encodeImage(file, { square: AVATAR_SIZE, maxBytes: AVATAR_MAX_BYTES });
      uploaded = await uploadMedia(sb, userId, "avatar", blob);
      let res: AvatarActionState;
      try {
        res = await saveAvatar(uploaded);
      } catch {
        // Server Action non raggiunta (rete, deploy in corso)
        res = { error: "db" };
      }
      if (!res.ok) {
        setMessage({ kind: "error", text: failure(res) });
        await cleanupMedia(sb, userId, "avatar", path);
        return;
      }
      setPath(res.path ?? null);
      setUrl(res.avatarUrl ?? null);
      setMessage({ kind: "ok", text: labels.saved });
      await cleanupMedia(sb, userId, "avatar", res.path ?? null);
      saved();
    } catch (err) {
      const code = err instanceof MediaError ? err.code : "upload";
      setMessage({ kind: "error", text: e[code] });
      if (sb && uploaded) await cleanupMedia(sb, userId, "avatar", path);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const res = await saveAvatar(null);
      if (!res.ok) {
        setMessage({ kind: "error", text: failure(res) });
        return;
      }
      setPath(null);
      setUrl(res.avatarUrl ?? null);
      setMessage({ kind: "ok", text: labels.removed });
      const sb = supabaseBrowser();
      if (sb) await cleanupMedia(sb, userId, "avatar", null);
      saved();
    } catch {
      setMessage({ kind: "error", text: e.db });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-night mt-4 flex flex-wrap items-center gap-5 p-5 sm:p-6">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={96} height={96} className="h-24 w-24 shrink-0 rounded-full border-2 border-sky bg-felt-soft object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-sky bg-mint font-display text-3xl font-bold text-ink" aria-hidden="true">
          {initial}
        </span>
      )}
      <div className="min-w-0 flex-1 basis-60">
        <p className="text-sm text-pale">{path ? labels.fromSite : url ? labels.fromDiscord : labels.none}</p>
        <p className="mt-1 text-xs text-pale-muted">
          {fillShowcase(labels.hint, { size: AVATAR_SIZE })}{" "}
          <a href={privacyHref} className="link-mint">
            {labels.privacyLink}
          </a>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className={`btn btn-primary text-xs has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint ${busy ? "opacity-60" : "cursor-pointer"}`}>
            <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(ev) => onFile(ev.target.files?.[0])} />
            {busy ? labels.uploading : labels.upload}
          </label>
          {path ? (
            <button type="button" className="btn btn-ink text-xs" onClick={remove} disabled={busy}>
              {labels.remove}
            </button>
          ) : null}
        </div>
        <p role="status" aria-live="polite" className={`mt-2 min-h-[1.25rem] text-sm ${message?.kind === "error" ? "text-bad" : "text-mint"}`}>
          {message?.text ?? ""}
        </p>
      </div>
    </div>
  );
}
