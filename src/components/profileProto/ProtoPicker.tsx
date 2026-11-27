"use client";

import { useState } from "react";
import { href, type Locale } from "@/lib/i18n";
import { PROTO_VARIANTS } from "@/lib/profileProto/variants";

/** Un nome utente qualsiasi, in uno dei tre prototipi. */
export function ProtoPicker({ locale }: { locale: Locale }) {
  const [name, setName] = useState("");
  const clean = name.trim().replace(/^@/, "").toLowerCase();
  return (
    <form className="card-night mt-4 flex flex-wrap items-end gap-3 p-5" onSubmit={(e) => e.preventDefault()}>
      <label className="flex min-w-0 flex-1 basis-56 flex-col gap-1 text-sm text-chalk">
        Un altro profilo
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="nome utente" className="rounded-lg border-2 border-sky bg-night-2 px-3 py-2 text-chalk" />
      </label>
      {PROTO_VARIANTS.map((v) => (
        <a key={v.id} href={clean ? href(locale, `/prova-profilo/${v.id}/${encodeURIComponent(clean)}`) : undefined} aria-disabled={!clean} className={`btn ${clean ? "btn-ink" : "btn-ink pointer-events-none opacity-50"} text-sm`}>
          {v.n} · {v.name}
        </a>
      ))}
    </form>
  );
}
