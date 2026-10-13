/**
 * Regole pure dell'aggiornamento automatico (11/10/2026, Pierluigi: "dobbiamo fare in modo che le app si aggiornino da
 * sole quando rilasciamo una nuova versione"; il resto in updater.ts). Le release stanno su GitHub, nel repo del sito,
 * con il tag `analytics-vX.Y.Z` e lo zip con il nome fisso: si accetta solo quello, solo da github.com e solo dal repo
 * di OriginsMeta, e il file scaricato deve avere la dimensione che dichiara GitHub. Niente bozze né prerelease.
 *
 * Dalla 0.4.0 (12/10/2026, l'app torna a chiamarsi OriginsMeta Tracker, appIdentity.ts) lo zip si chiama
 * `OriginsMeta-Tracker-win-x64.zip`. Il prefisso del tag resta `analytics-v` e ogni release porta anche lo zip col
 * nome di prima (`LEGACY_UPDATE_ASSET`, con dentro anche `OriginsMeta Analytics.exe`): è quello che cercano le app
 * 0.3.x, che altrimenti non si aggiornerebbero più (`npm run package` li fa tutti e due).
 */

export const UPDATE_REPO = "ultimacenere/originsmeta";
export const UPDATE_TAG_PREFIX = "analytics-v";
export const UPDATE_ASSET = "OriginsMeta-Tracker-win-x64.zip";
/** Lo zip col nome di prima della 0.4.0: lo cercano le app 0.3.x per aggiornarsi. */
export const LEGACY_UPDATE_ASSET = "OriginsMeta-Analytics-win-x64.zip";
export const UPDATE_API = `https://api.github.com/repos/${UPDATE_REPO}/releases?per_page=20`;

export type Version = [number, number, number];
export type Release = { version: string; url: string; size: number };

export function parseVersion(text: string | null | undefined): Version | null {
  const m = /^(\d{1,4})\.(\d{1,4})\.(\d{1,4})$/.exec(String(text ?? "").trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** a > b? */
export function isNewer(a: string, b: string): boolean {
  const x = parseVersion(a);
  const y = parseVersion(b);
  if (!x || !y) return false;
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}

/** L'indirizzo dello zip è quello di una release del nostro repo su github.com, con il nome fisso. */
export function trustedAssetUrl(url: unknown, version: string): boolean {
  return url === `https://github.com/${UPDATE_REPO}/releases/download/${UPDATE_TAG_PREFIX}${version}/${UPDATE_ASSET}`;
}

/**
 * La release più nuova dell'app fra quelle che restituisce l'API di GitHub (array di release): tag `analytics-v…`,
 * pubblicata, non prerelease, con lo zip dal nome fisso. Null se non ce n'è una valida.
 */
export function pickRelease(data: unknown): Release | null {
  if (!Array.isArray(data)) return null;
  let best: Release | null = null;
  for (const r of data) {
    if (!r || typeof r !== "object") continue;
    const rel = r as { tag_name?: unknown; draft?: unknown; prerelease?: unknown; assets?: unknown };
    if (rel.draft !== false || rel.prerelease !== false || typeof rel.tag_name !== "string" || !rel.tag_name.startsWith(UPDATE_TAG_PREFIX)) continue;
    const version = rel.tag_name.slice(UPDATE_TAG_PREFIX.length);
    if (!parseVersion(version)) continue;
    const asset = Array.isArray(rel.assets) ? (rel.assets as { name?: unknown; size?: unknown; browser_download_url?: unknown; state?: unknown }[]).find((a) => a && a.name === UPDATE_ASSET) : undefined;
    if (!asset || (asset.state !== undefined && asset.state !== "uploaded")) continue;
    const size = Number(asset.size);
    if (!Number.isInteger(size) || size < 10_000_000 || size > 600_000_000) continue;
    if (!trustedAssetUrl(asset.browser_download_url, version)) continue;
    if (!best || isNewer(version, best.version)) best = { version, url: asset.browser_download_url as string, size };
  }
  return best;
}

/**
 * Il lanciatore dello script di installazione (11/10/2026 sera): un VBScript che apre `cmd.exe` con la finestra
 * nascosta. Prima l'app lanciava cmd direttamente con `detached: true` e `windowsHide: true`, ma su Windows Node ignora
 * `windowsHide` con `detached` e la console nera compariva per qualche secondo sopra il gioco (Magic, playtest in
 * finestra). wscript.exe non ha console; `Run …, 0, False` nasconde la finestra di cmd e dei programmi che lancia.
 */
export function launcherScript(cmdPath: string): string {
  const inner = `cmd.exe /d /c ""${cmdPath.replace(/"/g, "")}""`;
  return [`CreateObject("WScript.Shell").Run "${inner.replace(/"/g, '""')}", 0, False`, ""].join("\r\n");
}

/** Lo script che, chiusa l'app, copia la versione nuova sopra quella vecchia e la riapre (cmd di Windows). */
export function installScript(input: { pid: number; source: string; target: string; exe: string; log: string }): string {
  const q = (p: string) => `"${p.replace(/"/g, "")}"`;
  return [
    "@echo off",
    "setlocal",
    `echo avviato >> ${q(input.log)}`,
    // aspetta che l'app sia davvero chiusa (al massimo un minuto). Niente pipe: lanciato dall'app senza console, il
    // "tasklist | find" di prima restava bloccato su find (prova dell'11/10/2026)
    `powershell -NoProfile -NonInteractive -Command "Wait-Process -Id ${input.pid} -Timeout 60 -ErrorAction SilentlyContinue"`,
    `robocopy ${q(input.source)} ${q(input.target)} /E /R:5 /W:2 /NFL /NDL /NJH /NJS /NP >> ${q(input.log)}`,
    `start "" ${q(input.exe)}`,
    "endlocal",
    "",
  ].join("\r\n");
}

/**
 * Gli avvisi di Windows dell'aggiornamento (13/10/2026, Pierluigi: "la gente non la tiene aperta a babbo morto, manda
 * una notifica se c'è da aggiornare dicendo di tenere il gioco chiuso fino a fine aggiornamento"): `found` quando
 * l'app trova una versione nuova e la scarica, `close` quando è pronta ma il gioco è aperto (una volta sola), `done`
 * al primo avvio della versione nuova. Partono dall'icona vicino all'orologio (updater.ts, main.ts). {v} = versione.
 */
export type UpdateNotice = "found" | "close" | "done";
export const UPDATE_NOTICES: Record<"en" | "it" | "es", { title: string } & Record<UpdateNotice, string>> = {
  en: {
    title: "OriginsMeta Tracker update",
    found: "Version {v} is on its way: keep Origins TCG closed until the app reopens by itself (about a minute).",
    close: "Version {v} is ready: close Origins TCG to install it. The app reopens by itself, then you can play again.",
    done: "OriginsMeta Tracker is up to date (version {v}): you can open Origins TCG.",
  },
  it: {
    title: "Aggiornamento di OriginsMeta Tracker",
    found: "Sta arrivando la versione {v}: tieni chiuso Origins TCG finché l'app non si riapre da sola (circa un minuto).",
    close: "La versione {v} è pronta: chiudi Origins TCG per installarla. L'app si riapre da sola, poi puoi tornare a giocare.",
    done: "OriginsMeta Tracker è aggiornato alla versione {v}: puoi aprire Origins TCG.",
  },
  es: {
    title: "Actualización de OriginsMeta Tracker",
    found: "Llega la versión {v}: mantén Origins TCG cerrado hasta que la app se vuelva a abrir sola (más o menos un minuto).",
    close: "La versión {v} está lista: cierra Origins TCG para instalarla. La app se vuelve a abrir sola y luego puedes seguir jugando.",
    done: "OriginsMeta Tracker está actualizado (versión {v}): ya puedes abrir Origins TCG.",
  },
};

export function updateNotice(lang: "en" | "it" | "es", kind: UpdateNotice, version: string): { title: string; content: string } {
  const t = UPDATE_NOTICES[lang];
  return { title: t.title, content: t[kind].replace("{v}", version) };
}

/** Il primo avvio di una versione nuova: la versione salvata l'ultima volta è più vecchia (prima installazione: niente avviso). */
export function justUpdated(saved: string | null, current: string): boolean {
  return saved !== null && isNewer(current, saved);
}
