"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/*
  Sottomenu e scelta della patch del prototipo «Analytics a sezioni» (27/11/2026). Le voci sono le sezioni di Analytics,
  ognuna con la sua pagina; la patch scelta resta nell'indirizzo (?patch=) passando da una sezione all'altra.
*/

const BASE = "/it/proto/analytics/sezioni";

export const SEZ_ITEMS = [
  { path: "", label: "Panoramica" },
  { path: "/leggendarie", label: "Leggendarie" },
  { path: "/mazzi", label: "Mazzi" },
  { path: "/carte", label: "Carte" },
  { path: "/scontri", label: "Scontri" },
  { path: "/tendenze", label: "Chi sale e chi scende" },
  { path: "/partita", label: "La partita", soon: true },
  { path: "/luoghi", label: "Luoghi", soon: true },
] as const;

export function SezNav({ patches }: { patches: { patch: string; label: string; games: number }[] }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const last = patches.at(-1)?.patch;
  const cur = sp.get("patch") && patches.some((p) => p.patch === sp.get("patch")) ? sp.get("patch")! : last;
  const q = (patch: string | undefined) => (patch && patch !== last ? `?patch=${patch}` : "");
  const here = pathname.replace(/\/$/, "");
  const active = (path: string) => (path === "" ? here === BASE : here === BASE + path || here.startsWith(`${BASE}${path}/`));

  return (
    <div className="sez-nav">
      <nav aria-label="Sezioni di Analytics" className="sez-tabs">
        {SEZ_ITEMS.map((it) => (
          <Link key={it.path} href={`${BASE}${it.path}${q(cur)}`} prefetch={false} className={`sez-tab${active(it.path) ? " is-on" : ""}`} aria-current={active(it.path) ? "page" : undefined}>
            {it.label}
            {"soon" in it && it.soon ? <span className="sez-soon">0.9</span> : null}
          </Link>
        ))}
      </nav>
      <div className="sez-patches" role="group" aria-label="Patch">
        {[...patches].reverse().map((p) => (
          <Link key={p.patch} href={`${here}${q(p.patch)}`} prefetch={false} scroll={false} className={`sez-patch${p.patch === cur ? " is-on" : ""}`} aria-current={p.patch === cur ? "true" : undefined}>
            <b>{p.label}</b>
            <span>{p.games.toLocaleString("it-IT")} partite</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
