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
/**
 * L'AppImage per Linux (0.6.0, 13/11/2026), nella stessa release dello zip di Windows: lo costruisce e lo aggiunge
 * GitHub Actions quando la release viene pubblicata (.github/workflows/tracker-linux.yml).
 */
export const LINUX_UPDATE_ASSET = "OriginsMeta-Tracker-linux-x86_64.AppImage";
/** Il file da cercare nelle release per questa piattaforma. */
export const updateAssetFor = (platform: NodeJS.Platform): string => (platform === "linux" ? LINUX_UPDATE_ASSET : UPDATE_ASSET);
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

/** L'indirizzo del file è quello di una release del nostro repo su github.com, con il nome fisso. */
export function trustedAssetUrl(url: unknown, version: string, asset = UPDATE_ASSET): boolean {
  return url === `https://github.com/${UPDATE_REPO}/releases/download/${UPDATE_TAG_PREFIX}${version}/${asset}`;
}

/**
 * La release più nuova dell'app fra quelle che restituisce l'API di GitHub (array di release): tag `analytics-v…`,
 * pubblicata, non prerelease, con il file dal nome fisso (lo zip di Windows o, su Linux, l'AppImage). Null se non ce
 * n'è una valida: una release ancora senza il file di questa piattaforma si salta.
 */
export function pickRelease(data: unknown, assetName = UPDATE_ASSET): Release | null {
  if (!Array.isArray(data)) return null;
  let best: Release | null = null;
  for (const r of data) {
    if (!r || typeof r !== "object") continue;
    const rel = r as { tag_name?: unknown; draft?: unknown; prerelease?: unknown; assets?: unknown };
    if (rel.draft !== false || rel.prerelease !== false || typeof rel.tag_name !== "string" || !rel.tag_name.startsWith(UPDATE_TAG_PREFIX)) continue;
    const version = rel.tag_name.slice(UPDATE_TAG_PREFIX.length);
    if (!parseVersion(version)) continue;
    const asset = Array.isArray(rel.assets) ? (rel.assets as { name?: unknown; size?: unknown; browser_download_url?: unknown; state?: unknown }[]).find((a) => a && a.name === assetName) : undefined;
    if (!asset || (asset.state !== undefined && asset.state !== "uploaded")) continue;
    const size = Number(asset.size);
    if (!Number.isInteger(size) || size < 10_000_000 || size > 600_000_000) continue;
    if (!trustedAssetUrl(asset.browser_download_url, version, assetName)) continue;
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

/**
 * Lo script che, chiusa l'app, copia la versione nuova sopra quella vecchia e la riapre (cmd di Windows).
 *
 * Aspetta che l'app sia davvero chiusa (al massimo un minuto circa) senza pipe: lanciato dall'app senza console, il
 * "tasklist | find" di prima restava bloccato su find (prova dell'11/10/2026), quindi tasklist scrive in un file
 * accanto al log e find legge quello; una pausa di un secondo con ping. Dalla 0.5.1 (03/11/2026) niente PowerShell:
 * il suo Wait-Process, lanciato da wscript e cmd, è la catena che gli antivirus guardano storto (ocr.ts). I programmi
 * di Windows con il percorso intero, così un find.exe di un'altra cartella del PATH non prende il posto di quello vero.
 */
export function installScript(input: { pid: number; source: string; target: string; exe: string; log: string }): string {
  const q = (p: string) => `"${p.replace(/"/g, "")}"`;
  const sys = (exe: string) => `"%SystemRoot%\\System32\\${exe}"`;
  const pid = Math.trunc(input.pid);
  const list = q(`${input.log.replace(/[^\\/]*$/, "")}processi.txt`);
  return [
    "@echo off",
    "setlocal",
    `echo avviato >> ${q(input.log)}`,
    "set /a n=0",
    ":attesa",
    `${sys("tasklist.exe")} /FI "PID eq ${pid}" /FO CSV /NH > ${list} 2>nul`,
    // la riga dell'app nel CSV ha ,"<pid>", (in find le virgolette dentro la stringa si raddoppiano)
    `${sys("find.exe")} ",""${pid}""," ${list} >nul 2>nul`,
    "if errorlevel 1 goto copia",
    "set /a n+=1",
    "if %n% geq 60 goto copia",
    `${sys("PING.EXE")} -n 2 127.0.0.1 >nul`,
    "goto attesa",
    ":copia",
    `robocopy ${q(input.source)} ${q(input.target)} /E /R:5 /W:2 /NFL /NDL /NJH /NJS /NP >> ${q(input.log)}`,
    `start "" ${q(input.exe)}`,
    "endlocal",
    "",
  ].join("\r\n");
}

/**
 * Un AppImage vero (Linux, 0.6.0): un programma ELF con il segno "AI" e il tipo 2 all'ottavo byte (specifica AppImage).
 * Basta guardare i primi 16 byte del file scaricato.
 */
export function isAppImage(head: Uint8Array): boolean {
  return head.length >= 11 && head[0] === 0x7f && head[1] === 0x45 && head[2] === 0x4c && head[3] === 0x46 && head[8] === 0x41 && head[9] === 0x49 && head[10] === 0x02;
}

/**
 * Linux (0.6.0): la riga di comando che, chiusa l'app, riapre l'AppImage aggiornato. Una shell di sistema aspetta che il
 * processo dell'app (`$1`) sia finito e poi apre l'AppImage (`$2`), che a quel punto è già quello nuovo (updater.ts lo
 * mette al posto del vecchio prima di chiudere). Percorsi e pid passano come argomenti, mai dentro lo script.
 */
export function relaunchCommand(pid: number, appImage: string): string[] {
  return ["/bin/sh", "-c", 'n=0; while kill -0 "$1" 2>/dev/null && [ "$n" -lt 120 ]; do sleep 0.5; n=$((n+1)); done; exec "$2"', "originsmeta-update", String(Math.trunc(pid)), appImage];
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
