import snapshot from "./data/crimsonPlayoffsSnapshot.json";
import { parsePlayoffs, type Playoffs } from "./crimsonPlayoffs";
import { isShowcaseBadge } from "./community/badges";
import { supabasePublic } from "./supabase/public";

/*
  Da dove arriva il tabellone dei playoff della Crimson Cup (25/10/2026): la risposta pubblica di Tourney Bot, il bot dei
  tornei del Discord ufficiale di Origins TCG, letta dal server al massimo una volta al minuto (data cache di Next, come
  la pagina in ISR). Regole e calcoli in crimsonPlayoffs.ts.

  Se Tourney Bot non risponde:
  - durante la build la pagina usa la fotografia del repository (src/lib/data/crimsonPlayoffsSnapshot.json, rifatta con
    `node scripts/crimson-playoffs-snapshot.mjs`) e lo dice ("Fotografia delle …"), così la build non dipende da un sito
    di terzi;
  - a sito acceso l'errore si lancia: l'ISR tiene la pagina dell'ultima lettura riuscita.
*/

export const CRIMSON_PLAYOFFS_ID = 73203;
/** Il tabellone su Tourney Bot, da linkare come fonte. */
export const CRIMSON_PLAYOFFS_URL = `https://tourneybot.gg/tourneys/${CRIMSON_PLAYOFFS_ID}`;
const API = `https://tourneybot.gg/api/v1/tourneys/${CRIMSON_PLAYOFFS_ID}`;

export type PlayoffsRead = { data: Playoffs; live: boolean; at: string };

export async function loadPlayoffs(): Promise<PlayoffsRead | null> {
  try {
    const res = await fetch(API, {
      headers: { "user-agent": "OriginsMeta (+https://originsmeta.com)", accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Tourney Bot: ${res.status}`);
    const data = parsePlayoffs(await res.json());
    if (!data) throw new Error("Tourney Bot: risposta non leggibile");
    return { data, live: true, at: new Date().toISOString() };
  } catch (e) {
    if (process.env.NEXT_PHASE !== "phase-production-build") throw e;
    console.warn("[crimson-playoffs] Tourney Bot non risponde, uso la fotografia:", e);
    const data = parsePlayoffs(snapshot);
    return data ? { data, live: false, at: data.fetchedAt ?? "" } : null;
  }
}

export type PlayoffCreator = { username: string; badge: string };

/**
 * I giocatori del tabellone che su OriginsMeta hanno un ruolo con vetrina (Creator, Autore, Pro, Staff), riconosciuti dallo
 * stesso account Discord (`profiles.discord_id` = `players[].realUserId` di Tourney Bot). Solo loro: sono profili pubblici
 * per scelta, e legare un nome di Discord al profilo di un iscritto qualunque non serve al tabellone. Un errore lascia la
 * mappa vuota (il tabellone si vede lo stesso, senza i segni).
 */
export async function readPlayoffCreators(p: Playoffs): Promise<Map<number, PlayoffCreator>> {
  const out = new Map<number, PlayoffCreator>();
  const db = supabasePublic();
  const bySeat = new Map<string, number>();
  for (const pl of p.players) if (pl.discord) bySeat.set(pl.discord, pl.seat);
  const ids = [...bySeat.keys()];
  if (!db || ids.length === 0) return out;
  try {
    for (let i = 0; i < ids.length; i += 100) {
      const { data, error } = await db.from("profiles").select("username, badge, discord_id").in("discord_id", ids.slice(i, i + 100));
      if (error) throw error;
      for (const row of data ?? []) {
        const seat = row.discord_id ? bySeat.get(row.discord_id) : undefined;
        if (seat !== undefined && row.username && isShowcaseBadge(row.badge)) out.set(seat, { username: row.username, badge: row.badge });
      }
    }
  } catch (e) {
    console.warn("[crimson-playoffs] profili non letti:", e);
    out.clear();
  }
  return out;
}
