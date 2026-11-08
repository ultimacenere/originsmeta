/**
 * Lo zip di OriginsMeta Tracker su GitHub Releases: l'ultima versione pubblicata, sempre allo stesso indirizzo
 * (unico posto). Dal 12/10/2026 lo scarica solo chi ha fatto l'accesso (Pierluigi: "ben inteso che solo i registrati
 * al sito possono scaricare l'app e possono usarla"): lo importa solo la rotta /api/tracker/download, mai una pagina né
 * un componente, così l'indirizzo non compare nell'HTML né nei chunk JavaScript del browser.
 *
 * Il repository è pubblico: chi conosce l'indirizzo lo zip lo scarica comunque. La protezione vera è nell'app, che
 * funziona solo collegata a un account (cartella tracker/).
 */
export const TRACKER_DOWNLOAD_URL = "https://github.com/ultimacenere/originsmeta/releases/latest/download/OriginsMeta-Tracker-win-x64.zip";

/**
 * Riserva fuori da GitHub (08/11/2026). Quel giorno GitHub andava in timeout per chi non aveva fatto l'accesso:
 * il tasto dava errore a tutti. Pierluigi: "Si crea alternativa". È una copia dello stesso zip su Vercel Blob
 * (store `originsmeta-tracker`, fra1, pubblico), con la versione nel nome. Lo stesso nome non si sovrascrive: il CDN
 * lo tiene in cache 30 giorni.
 *
 * ⚠️ A ogni release del tracker va caricata la copia nuova e va aggiornato questo indirizzo (tracker/README.md,
 * "Riserva del download"). Se resta indietro, quando GitHub è giù si scarica la versione precedente: l'app poi si
 * aggiorna da sola appena GitHub torna.
 */
export const TRACKER_MIRROR_URL = "https://p7mqs3mjgy7busoa.public.blob.vercel-storage.com/tracker/OriginsMeta-Tracker-0.5.3-win-x64.zip";

/** quanto si aspetta GitHub prima di passare alla riserva */
const GITHUB_CHECK_MS = 3500;

/**
 * L'indirizzo a cui mandare chi scarica: GitHub se risponde entro {@link GITHUB_CHECK_MS} con il redirect allo zip (o
 * con lo zip), altrimenti la riserva. Basta il primo passaggio, il 302 di `releases/latest/download`, senza seguirlo.
 */
export async function trackerDownloadTarget(fetchImpl: typeof fetch = fetch): Promise<string> {
  try {
    const res = await fetchImpl(TRACKER_DOWNLOAD_URL, {
      method: "HEAD",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(GITHUB_CHECK_MS),
    });
    if (res.status === 200 || (res.status >= 300 && res.status < 400 && res.headers.get("location"))) return TRACKER_DOWNLOAD_URL;
    console.warn(`[tracker] GitHub risponde ${res.status}: download dalla riserva`);
  } catch (e) {
    console.warn("[tracker] GitHub non risponde, download dalla riserva:", e instanceof Error ? e.message : e);
  }
  return TRACKER_MIRROR_URL;
}
