"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeTag } from "@/lib/tournament/types";
import { useMounted } from "@/lib/useMounted";

export type TagSearchLabels = { title: string; placeholder: string; button: string; notFound: string };

function missingFromUrl(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("tag") === "missing";
  } catch {
    return false;
  }
}

/**
 * Casella "trova un torneo dal tag": normalizza quello che l'utente digita (om-7kq2, 7KQ2, #OM-7KQ2) e
 * apre il link breve /t/<tag>, che reindirizza alla scheda del torneo. Se la route non trova il tag
 * torna qui con ?tag=missing: il messaggio lo leggiamo nel browser, così la pagina resta statica.
 */
export function TagSearch({ labels }: { labels: TagSearchLabels }) {
  const router = useRouter();
  const mounted = useMounted();
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [touched, setTouched] = useState(false);
  const error = invalid || (mounted && !touched && missingFromUrl());

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const tag = normalizeTag(value);
        setTouched(true);
        if (!tag) {
          setInvalid(true);
          return;
        }
        setInvalid(false);
        router.push(`/t/${tag}`);
      }}
    >
      <label className="block text-sm">
        <span className="kicker text-pale-muted">{labels.title}</span>
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setInvalid(false);
            setTouched(true);
          }}
          placeholder={labels.placeholder}
          maxLength={12}
          autoComplete="off"
          spellCheck={false}
          className="mt-1 block w-40 rounded-lg border-2 border-sky bg-night px-3 py-2 font-mono text-sm uppercase text-pale focus:border-mint"
          aria-invalid={error}
        />
      </label>
      <button type="submit" className="btn btn-mint text-xs">
        {labels.button}
      </button>
      {error ? (
        <p role="alert" className="basis-full text-sm text-bad">
          {labels.notFound}
        </p>
      ) : null}
    </form>
  );
}
