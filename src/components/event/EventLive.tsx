"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { PublicEvent, PublicTalent } from "@/lib/event/types";
import { isHidden } from "@/lib/event/types";

/**
 * Dati in diretta di un evento (10/11/2026): la pagina arriva con lo stato della sua generazione (ISR) e il browser
 * rilegge /api/events/<slug> ogni 10 secondi finché la scheda è visibile (la CDN tiene la risposta 5 secondi). L'ora
 * del database corregge l'orologio del browser solo se è sbagliato di più di 3 secondi (con l'età della risposta in
 * cache, header Age).
 */

export type LiveEvent = PublicEvent & { avatars: Record<string, string>; live: string[] };

type Ctx = { data: LiveEvent; offset: number };
const EventCtx = createContext<Ctx | null>(null);

const POLL_MS = 10_000;

export function EventLiveProvider({ slug, initial, children }: { slug: string; initial: LiveEvent; children: React.ReactNode }) {
  const [data, setData] = useState<LiveEvent>(initial);
  const [offset, setOffset] = useState(0);
  const version = useRef(`${initial.version}`);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/events/${slug}`, { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as LiveEvent;
        if (!alive || !json || typeof json.slug !== "string") return;
        const age = Number(res.headers.get("age")) || 0;
        const server = Date.parse(json.now) + age * 1000;
        if (!Number.isNaN(server)) {
          const diff = server - Date.now();
          setOffset(Math.abs(diff) > 3000 ? diff : 0);
        }
        const key = `${json.version}|${json.stats.redeemed}|${json.live.join(",")}|${Object.keys(json.avatars).length}`;
        if (key !== version.current) {
          version.current = key;
          setData(json);
        }
      } catch {
        /* rete assente: si riprova al giro dopo */
      }
    };
    const loop = () => {
      timer = setTimeout(async () => {
        await load();
        if (alive) loop();
      }, POLL_MS);
    };
    loop();
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [slug]);

  return <EventCtx.Provider value={{ data, offset }}>{children}</EventCtx.Provider>;
}

export function useEventData(): LiveEvent {
  const ctx = useContext(EventCtx);
  if (!ctx) throw new Error("useEventData fuori da EventLiveProvider");
  return ctx.data;
}

/** L'ora (corretta) che avanza ogni secondo. Null al primo disegno, per non creare differenze con l'HTML del server. */
export function useEventNow(): number | null {
  const ctx = useContext(EventCtx);
  const offset = ctx?.offset ?? 0;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now() + offset);
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [offset]);
  return now;
}

export type Face = { id: string; name: string; img: string | null; twitch: string | null; live: boolean; hidden: boolean };

/** Nome, foto e canale di un talent per i componenti (foto propria, poi quella di Twitch, poi l'iniziale). */
export function faceOf(t: PublicTalent | undefined, avatars: Record<string, string>, live: readonly string[], hiddenName: string): Face {
  if (!t) return { id: "?", name: "?", img: null, twitch: null, live: false, hidden: true };
  if (isHidden(t)) return { id: t.id, name: hiddenName, img: null, twitch: null, live: false, hidden: true };
  const img = t.photo ?? (t.twitch ? (avatars[t.twitch] ?? null) : null);
  return { id: t.id, name: t.name, img, twitch: t.twitch ?? null, live: Boolean(t.twitch && live.includes(t.twitch)), hidden: false };
}

export function useFaces(): (id: string) => Face {
  const data = useEventData();
  const byId = new Map(data.config.talent.map((t) => [t.id, t]));
  return (id: string) => faceOf(byId.get(id), data.avatars, data.live, "?");
}

/** Foto tonda di un talent (o l'iniziale). Niente next/image: le foto vengono da Twitch o da indirizzi dei talent. */
export function FaceImg({ face, size = 40, className = "" }: { face: Face; size?: number; className?: string }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };
  if (face.img && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={face.img} alt="" width={size} height={size} loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className={`shrink-0 rounded-full border-2 border-sky object-cover ${className}`} style={style} />
    );
  }
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full border-2 border-sky bg-night-3 font-display font-bold text-sky ${className}`} style={{ ...style, fontSize: size * 0.4 }}>
      {face.hidden ? "?" : (face.name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}
