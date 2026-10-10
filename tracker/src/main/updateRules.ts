/**
 * Regole pure dell'aggiornamento automatico (11/10/2026, Pierluigi: "dobbiamo fare in modo che le app si aggiornino da
 * sole quando rilasciamo una nuova versione"; il resto in updater.ts). Le release stanno su GitHub, nel repo del sito,
 * con il tag `analytics-vX.Y.Z` e lo zip con il nome fisso: si accetta solo quello, solo da github.com e solo dal repo
 * di OriginsMeta, e il file scaricato deve avere la dimensione che dichiara GitHub. Niente bozze né prerelease.
 */

export const UPDATE_REPO = "ultimacenere/originsmeta";
export const UPDATE_TAG_PREFIX = "analytics-v";
export const UPDATE_ASSET = "OriginsMeta-Analytics-win-x64.zip";
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
