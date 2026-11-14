import { TALENT_ROLES, isHidden, type CodeStats, type ControlEvent, type ModCode, type ModEvent, type PublicEvent, type PublicTalent, type Redeemer, type SlotCodes, type TalentRole } from "./types";
import { parseConfig } from "./config";
import { normalizeRun } from "./clock";
import { normalizeState } from "./engine";
import { twitchLogin } from "./codes";

/**
 * Lettura delle risposte delle funzioni del database (10/11/2026), tutte in modalità tollerante: una voce scritta male
 * si scarta (o resta al suo posto, per gli slot), un indirizzo che non è https non diventa mai un link, i campi
 * mancanti prendono il default. Funzioni pure, anche nel browser (la pagina rilegge /api/events/<slug> ogni 10 secondi).
 */

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const num = (x: unknown, d = 0) => (typeof x === "number" && Number.isFinite(x) ? x : d);
const str = (x: unknown) => (typeof x === "string" ? x : "");
const nowIso = (x: unknown) => (typeof x === "string" && !Number.isNaN(Date.parse(x)) ? x : new Date().toISOString());

function stats(x: unknown): CodeStats {
  const o = isObj(x) ? x : {};
  return { codes: num(o.codes), assigned: num(o.assigned), redeemed: num(o.redeemed) };
}

/** La risposta di community_event_public (o null se non c'è l'evento). */
export function parsePublicEvent(raw: unknown): PublicEvent | null {
  if (!isObj(raw) || typeof raw.slug !== "string") return null;
  const cfgRaw = isObj(raw.config) ? raw.config : {};
  const rawTalent = Array.isArray(cfgRaw.talent) ? cfgRaw.talent : [];
  // i talent da svelare arrivano come { id: "hidden-<n>", role, hidden, revealAt }: si tengono al loro posto
  const visible = rawTalent.filter((t) => isObj(t) && t.hidden !== true);
  const { config } = parseConfig({ ...cfgRaw, talent: visible, pairs: [] }, "lenient");
  const byId = new Map(config.talent.map((t) => [t.id, t]));
  const talent: PublicTalent[] = [];
  for (const t of rawTalent) {
    if (!isObj(t)) continue;
    if (t.hidden === true) {
      const role = (TALENT_ROLES as readonly string[]).includes(str(t.role)) ? (t.role as TalentRole) : "player";
      const reveal = typeof t.revealAt === "string" && !Number.isNaN(Date.parse(t.revealAt)) ? new Date(Date.parse(t.revealAt)).toISOString() : undefined;
      talent.push({ id: str(t.id) || `hidden-${talent.length + 1}`, role, hidden: true, ...(reveal ? { revealAt: reveal } : {}) });
    } else {
      const parsed = byId.get(str(t.id).trim().toLowerCase());
      if (parsed) talent.push(parsed);
    }
  }
  // gli slot dei canali da svelare arrivano con il canale vuoto: restano al loro posto (l'orologio li conta per indice)
  const rawSlots = Array.isArray(cfgRaw.slots) ? cfgRaw.slots : [];
  const slots = rawSlots.map((s, i) => {
    const o = isObj(s) ? s : {};
    const packs = num(o.packs);
    // minuti anche con i secondi (7.5 = 7 minuti e 30, 14/11/2026), al secondo
    const minutes = num(o.minutes, 6);
    return {
      channel: typeof o.channel === "string" ? (twitchLogin(o.channel) ?? "") : "",
      packs: Number.isInteger(packs) && packs > 0 ? packs : 0,
      minutes: Number.isFinite(minutes) && minutes > 0 && minutes <= 60 ? Math.round(minutes * 60) / 60 : 6,
      ...(o.together === true && i > 0 ? { together: true } : {}),
    };
  });
  const { pairs: _pairs, ...rest } = config;
  void _pairs;
  return {
    slug: raw.slug,
    config: { ...rest, talent, slots },
    state: normalizeState(raw.state),
    version: num(raw.version),
    stats: stats(raw.stats),
    now: nowIso(raw.now),
  };
}

/** La risposta di community_event_control. */
export function parseControlEvent(raw: unknown): ControlEvent | null {
  if (!isObj(raw) || typeof raw.slug !== "string") return null;
  const { config } = parseConfig(raw.config, "lenient");
  const codes = isObj(raw.codes) ? raw.codes : {};
  const mods = Array.isArray(raw.mods) ? raw.mods.flatMap((m) => (isObj(m) && typeof m.channel === "string" && typeof m.token === "string" ? [{ channel: m.channel, token: m.token }] : [])) : [];
  const slotCodes: SlotCodes[] = Array.isArray(raw.slotCodes)
    ? raw.slotCodes.flatMap((x) => (isObj(x) && Number.isInteger(x.slot) ? [{ slot: x.slot as number, assigned: num(x.assigned), redeemed: num(x.redeemed) }] : []))
    : [];
  const redeemers: Redeemer[] = Array.isArray(raw.redeemers)
    ? raw.redeemers.flatMap((x) =>
        isObj(x) ? [{ username: typeof x.username === "string" ? x.username : null, display: typeof x.display === "string" ? x.display : null, at: str(x.at), slot: Number.isInteger(x.slot) ? (x.slot as number) : null, isNew: x.isNew === true }] : [],
      )
    : [];
  return {
    slug: raw.slug,
    config,
    state: normalizeState(raw.state),
    version: num(raw.version),
    now: nowIso(raw.now),
    controlToken: typeof raw.controlToken === "string" ? raw.controlToken : null,
    mods,
    codes: { total: num(codes.total), assigned: num(codes.assigned), redeemed: num(codes.redeemed) },
    slotCodes,
    redeemers,
  };
}

/** La risposta di community_event_mod_view. */
export function parseModEvent(raw: unknown): ModEvent | null {
  if (!isObj(raw) || typeof raw.slug !== "string" || typeof raw.channel !== "string") return null;
  const { config } = parseConfig({ name: raw.name || "Evento", keyword: raw.keyword, slots: raw.slots }, "lenient");
  const codes: ModCode[] = Array.isArray(raw.codes)
    ? raw.codes.flatMap((c) => (isObj(c) && typeof c.code === "string" && Number.isInteger(c.slot) ? [{ code: c.code, slot: c.slot as number, assignedAt: str(c.assignedAt), redeemed: c.redeemed === true }] : []))
    : [];
  return { slug: raw.slug, channel: raw.channel, name: config.name, keyword: config.keyword, slots: config.slots, giveaway: normalizeRun(raw.giveaway), codes, now: nowIso(raw.now) };
}

/** I talent visibili di un ruolo, nell'ordine della configurazione (i nascosti in fondo). */
export function talentOfRole(talent: readonly PublicTalent[], role: TalentRole): PublicTalent[] {
  const list = talent.filter((t) => t.role === role);
  return [...list.filter((t) => !isHidden(t)), ...list.filter((t) => isHidden(t))];
}
