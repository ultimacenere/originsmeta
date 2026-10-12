/**
 * Lo zip di OriginsMeta Analytics su GitHub Releases: l'ultima versione pubblicata, sempre allo stesso indirizzo
 * (unico posto). Dal 12/10/2026 lo scarica solo chi ha fatto l'accesso (Pierluigi: "ben inteso che solo i registrati
 * al sito possono scaricare l'app e possono usarla"): lo importa solo la rotta /api/tracker/download, mai una pagina né
 * un componente, così l'indirizzo non compare nell'HTML né nei chunk JavaScript del browser.
 *
 * Il repository è pubblico: chi conosce l'indirizzo lo zip lo scarica comunque. La protezione vera è nell'app, che
 * funziona solo collegata a un account (cartella tracker/).
 */
export const TRACKER_DOWNLOAD_URL = "https://github.com/ultimacenere/originsmeta/releases/latest/download/OriginsMeta-Analytics-win-x64.zip";
