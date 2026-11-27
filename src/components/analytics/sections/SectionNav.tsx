"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AnalyticsSectionsLabels } from "@/lib/analyticsSectionsLabels";

/*
  Sottomenu e scelta della patch di Analytics a sezioni (27/11/2026). Le voci sono le sezioni di /analytics, ognuna con la
  sua pagina; la patch scelta resta nell'indirizzo (?patch=) passando da una sezione all'altra. Sul telefono una riga sola:
  le voci scorrono di lato (quella aperta si porta in vista) e la patch è una tendina.
*/

export type SectionItem = { path: string; key: Exclude<keyof AnalyticsSectionsLabels["nav"], "label" | "soon" | "patch" | "patchGames">; soon?: boolean };

export const SECTION_ITEMS: SectionItem[] = [
  { path: "", key: "overview" },
  { path: "/legendaries", key: "legendaries" },
  { path: "/decks", key: "decks" },
  { path: "/cards", key: "cards" },
  { path: "/matchups", key: "matchups" },
  { path: "/trends", key: "trends" },
  { path: "/match", key: "match", soon: true },
  { path: "/locations", key: "locations", soon: true },
];

export function SectionNav({
  base,
  labels,
  patches,
}: {
  /** /<lingua>/analytics */
  base: string;
  labels: AnalyticsSectionsLabels["nav"];
  patches: { patch: string; label: string; games: string }[];
}) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const router = useRouter();
  const last = patches.at(-1)?.patch;
  const want = sp.get("patch");
  const cur = want && patches.some((p) => p.patch === want) ? want : last;
  const q = (patch: string | undefined) => (patch && patch !== last ? `?patch=${patch}` : "");
  const here = pathname.replace(/\/$/, "");
  const active = (path: string) => (path === "" ? here === base : here === base + path || here.startsWith(`${base}${path}/`));
  const tabs = useRef<HTMLElement>(null);

  // la voce aperta in vista, anche quando il menu scorre di lato
  useEffect(() => {
    const box = tabs.current;
    const on = box?.querySelector<HTMLElement>("[aria-current=page]");
    if (box && on) box.scrollLeft = on.offsetLeft - (box.clientWidth - on.offsetWidth) / 2;
  }, [here]);

  return (
    <div className="sez-nav">
      <div className="an-wrap sez-nav-in">
        <nav aria-label={labels.label} className="sez-tabs" ref={tabs}>
          {SECTION_ITEMS.map((it) => (
            <Link key={it.path} href={`${base}${it.path}${q(cur)}`} prefetch={false} className={`sez-tab${active(it.path) ? " is-on" : ""}`} aria-current={active(it.path) ? "page" : undefined}>
              {labels[it.key]}
              {it.soon ? <span className="sez-soon">{labels.soon}</span> : null}
            </Link>
          ))}
        </nav>
        <div className="sez-patches" role="group" aria-label={labels.patch}>
          {[...patches].reverse().map((p) => (
            <Link key={p.patch} href={`${here}${q(p.patch)}`} prefetch={false} scroll={false} className={`sez-patch${p.patch === cur ? " is-on" : ""}`} aria-current={p.patch === cur ? "true" : undefined}>
              <b>{p.label}</b>
              <span>{p.games}</span>
            </Link>
          ))}
        </div>
        <label className="sez-patch-select">
          <span className="sr-only">{labels.patch}</span>
          <select value={cur} onChange={(e) => router.push(`${here}${q(e.target.value)}`, { scroll: false })}>
            {[...patches].reverse().map((p) => (
              <option key={p.patch} value={p.patch}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
