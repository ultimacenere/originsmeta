/**
 * Misura del sito (25/09/2026: i quattro eventi GA4 di a9400e8, poi il pacchetto MIS dell'Ondata 2): un solo punto
 * da cui partono gli eventi, verso due strumenti. Qui c'era prima l'helper `traccia` (solo GA4): è stato assorbito da
 * `trackEvent`, e i quattro eventi già online (sign_up, deck_created, deck_published, tierlist_created) hanno tenuto
 * i loro nomi e i loro parametri, perché in GA4 possono essere già segnati come eventi chiave.
 *
 * - Google Analytics 4: solo con il consenso "Accetta tutto" del banner cookie, come le pagine viste, e mai nel browser
 *   dello staff (flag del traffico interno, qui sotto). Riceve tutti i parametri dell'evento più `lang` (en, it, es,
 *   dal primo segmento del percorso).
 * - Vercel Web Analytics (`track()` di @vercel/analytics): senza cookie e senza consenso, conta tutti i visitatori. Il
 *   team Vercel è Pro, quindi gli eventi personalizzati ci sono, ma con al massimo DUE proprietà ciascuno: per ogni
 *   evento `VERCEL_PROPS` dice quali. La pagina (e quindi la lingua) Vercel la registra da sé.
 *
 * Nessun evento parte sul server o in build: ogni funzione esce subito senza `window`, e tutto sta in try/catch (una
 * misura che si rompe non deve mai rompere un tasto). Nei parametri niente dati personali: né email né nomi utente né
 * testi scritti dagli utenti; il termine cercato fra le carte passa, ripulito da `searchTermForAnalytics`.
 *
 * EVENTI (nomi stabili: non si rinominano, i rapporti li contano per nome). ★ = da segnare come evento chiave in GA4
 * (Amministrazione → Eventi → "Segna come evento chiave", dopo che l'evento è arrivato almeno una volta).
 *
 *   ★ sign_up             primo accesso completato di un account nuovo           method (discord | email)
 *                         (dal 25/09/2026, a9400e8; un account nuovo = un solo sign_up, vedi `isNewAccount`; solo
 *                         con una sessione appena aperta nel browser, vedi `consumeAuthSignal`)
 *     login               accesso completato di un account che c'era già         method
 *     login_start         clic su "Accedi con Discord", o link via email spedito  method
 *     login_error         errore mostrato dal pannello di accesso                 kind, method
 *                         (kind: discord_start, email_send, captcha, rate_limited nel pannello; expired, other_browser,
 *                         discord_cancelled, discord, generic al ritorno da /auth/callback, contati solo all'arrivo:
 *                         non a un ricaricamento né tornando con avanti/indietro, vedi `countsOnArrival`)
 *   ★ deck_published      mazzo pubblicato sul sito, solo la prima volta (non le   locale, legendary, source
 *                         modifiche; dal 25/09/2026, a9400e8)                     (builder | private_draft)
 *   ★ deck_created        mazzo privato NUOVO salvato nel profilo dal deck         locale, legendary, cards, placement
 *                         builder ("Salva privato" che crea una riga; non l'aggiornamento del mazzo riaperto da
 *                         /account né lo stesso mazzo salvato di nuovo: `created` di saveDeckPrivate; dal 25/09/2026)
 *     deck_complete       il mazzo del builder arriva a 25 carte, una volta per    placement
 *                         casella e per scheda (di nuovo solo dopo "Svuota mazzo")
 *   ★ game_code_copy      copia RIUSCITA del codice del gioco (KGBLDC…)           placement (builder | tournament_builder |
 *                                                                                 deck_page | decks_list)
 *     deck_share          link, lista in testo o "Condividi con…" dal builder      method (link | text | native), placement
 *     deck_open_builder   "Apri nel deck builder" dalla scheda di un mazzo (attributi) placement
 *     deck_original_open  dalla guida tradotta di un mazzo all'originale (attributi) guide_lang
 *   ★ deck_vote           voto a un mazzo della community                         stars (1-5), vote_type (new | update)
 *   ★ tierlist_created    prima tier list di un tipo salvata nel profilo (le      locale, kind (legendaries | cards)
 *                         sostituzioni no: una per utente e per tipo, `created` di saveTierList; dal 25/09/2026)
 *     tier_list_share     link o testo di una tier list copiati                   method (link | text), kind
 *   ★ tournament_create   torneo creato (non le modifiche)                        visibility (public | private), deck_mode
 *     tournament_join     iscrizione a un torneo                                  size (posti del torneo)
 *     feedback_submit     messaggio mandato dal riquadro dei feedback             (nessun parametro)
 *     faq_ask             domanda all'assistente della FAQ, risposta arrivata     sources (fonti citate nella risposta)
 *   ★ steam_click         clic su un link verso Steam, tasti e link di testo      target (store | demo | news | next_fest |
 *                                                                                 community | other), placement, cta
 *   ★ discord_click       clic su un link verso Discord                           server (originsmeta | official | other),
 *                                                                                 placement, cta
 *     view_search_results ricerca fra le carte in /cards e nel deck builder       search_term, results, search_area
 *                                                                                 (cards | deck_builder)
 *     home_route          clic dalla home verso una sezione o fuori dal sito      destination, section
 *     tier_entry_open     scheda di una voce aperta nelle tier list (TierExplorer) tier_source, card
 *     tier_entry_click    clic dalla scheda di una voce                           tier_source, target
 *
 * Per vedere i parametri nei rapporti di GA4 vanno registrati in Amministrazione → Definizioni personalizzate, tutti
 * con ambito "evento" (method e search_term GA4 li ha già):
 *   - dimensioni personalizzate: lang, locale, placement, target, server, cta, legendary, source, kind, stars,
 *     vote_type, search_area, destination, section, tier_source, card, visibility, deck_mode, guide_lang;
 *   - metriche personalizzate (numeri da sommare, unità "standard"): results, size, sources, cards.
 * `lang` va a GA4 con ogni evento (dal percorso); `locale` è il parametro dei tre eventi nati con a9400e8 e resta per
 * non rompere i rapporti già impostati: hanno lo stesso valore.
 *
 * `placement` dei clic in uscita (e `section` di home_route): `data-om-placement` del link o di un suo contenitore,
 * altrimenti header, footer, content (dentro <main>), slider (lo slider della home, fuori dal <main>), calendar (la
 * striscia del calendario) o other (banner, pop-up). `cta`: `data-om-cta` del link (button per SteamButton e
 * DiscordButton, icon per il loghino Discord dell'header), altrimenti link.
 * discord_click distingue tre server: il nostro (`ORIGINSMETA_DISCORD`) ha server=originsmeta, quello ufficiale di
 * Koin Games (discord.gg/originstcg, `officialLinks.discord` in Footer.tsx) server=official, tutti gli altri (i
 * Discord dei tornei e dei creator, i link ai canali) server=other.
 * home_route parte da solo per ogni link cliccato nella home fuori da header e footer: `destination` è la sezione a
 * cui porta il link (tier_list, tier_list_maker, decks, deck_page, builder, cards, card_page, news, news_article,
 * guides, guide, metashifting, tournaments…) oppure youtube, external; `section` è il posto del link nella home (il
 * `placement` qui sopra: le sezioni della home hanno il loro `data-om-placement`). I link verso Steam e Discord della
 * home non lo mandano: steam_click e discord_click hanno già il posto nel `placement` (slider, home_news…), e un
 * secondo evento per lo stesso clic gonfierebbe i conteggi.
 *
 * Tre modi di mandare un evento:
 *   1. `trackEvent(nome, parametri)` dai componenti client, con i parametri controllati dai tipi (`EventParams`);
 *   2. attributi sul markup, anche nei componenti server: `data-om-event="deck_open_builder" data-om-placement="deck_page"`
 *      su un link o su un contenitore (i parametri sono gli altri `data-om-*`); li legge `onDocumentClick` al clic;
 *   3. i link verso Steam e Discord e i link della home non hanno bisogno di niente: `onDocumentClick` li riconosce.
 * `onDocumentClick` lo registra GoogleAnalytics.tsx, montato nel layout della lingua su ogni pagina.
 *
 * CONTATORI DEI MAZZI PER GLI AUTORI (pacchetto STATS, 26/09/2026): non sono eventi di questo catalogo e non vanno né
 * a GA4 né a Vercel, ma totali per mazzo e giorno su Supabase (src/lib/community/deckStats.ts, DeckStatsBeacon.tsx).
 * Si agganciano ai punti che già misurano: la copia del codice del gioco è `game_code_copy` con placement `deck_page`,
 * ricevuto con `onTrackedEvent` (quindi mai nel browser dello staff); nell'elenco /decks, dove l'evento non ha lo slug
 * (e non deve averlo: andrebbe a GA4), la conta CopyCode con `bumpDeckStat` (src/lib/community/deckStatsClient.ts);
 * i link esterni della scheda contano da soli; `data-om-deck-stat="video"|"link"` su un elemento dice il contatore dove
 * l'indirizzo non basta (il tasto "▶ Video" della scheda, il tasto che carica un video incorporato). Quell'attributo
 * non diventa un parametro degli eventi (`datasetEvent` lo salta).
 *
 * TRAFFICO INTERNO (MIS-03): visitando una volta https://originsmeta.com/?staff=<codice dello staff> (oppure
 * /it?staff=…) da ogni browser e dispositivo dello staff, il browser si segna come interno (localStorage
 * `originsmeta.internal.v1` = "1"): GA4 non parte, gli eventi non vanno da nessuna parte (si leggono nella console,
 * utile per le prove) e le pagine viste di Vercel le scarta `vercelBeforeSend`. ?staff=off lo spegne. Il parametro
 * sparisce subito dall'indirizzo. Il codice NON sta nel repo (qui c'è solo la sua impronta SHA-256, `STAFF_TOKEN_SHA256`)
 * ma nella KB: così un link con ?staff=… girato su Discord non può spegnere la misura a chi lo apre. Un codice
 * sbagliato esclude solo quella pagina. Nelle sessioni automatiche (pannello browser di Claude, Claude in Chrome) si
 * imposta direttamente `localStorage.setItem("originsmeta.internal.v1", "1")`, insieme al consenso.
 *
 * CONSENSO RITIRATO (MIS-08): `stopGoogleAnalytics` spegne GA4 (`ga-disable-<ID>`), nega il consenso a gtag e cancella
 * i cookie _ga; GoogleAnalytics.tsx poi ricarica la pagina, l'unico modo sicuro di togliere gtag.js, che altrimenti
 * resterebbe in pagina con la misurazione avanzata. Se nella pagina c'è un modulo con testo non salvato
 * (`hasUnsavedInput`) il ricaricamento aspetta il prossimo cambio di pagina: intanto GA4 è già spento. Vale anche per
 * le altre schede aperte del sito (evento `storage`).
 */
import { track } from "@vercel/analytics";
import { CONSENT_KEY, getConsent } from "./consent";
import { ORIGINSMETA_DISCORD } from "./discord";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/* ---------- catalogo degli eventi ---------- */

export type AuthMethod = "discord" | "email";
export type SearchArea = "cards" | "deck_builder";
export type DiscordServer = "originsmeta" | "official" | "other";

export type EventParams = {
  sign_up: { method: AuthMethod };
  login: { method: AuthMethod };
  login_start: { method: AuthMethod };
  login_error: { kind: string; method?: AuthMethod };
  deck_published: { locale: string; legendary: string; source: "builder" | "private_draft" };
  deck_created: { locale: string; legendary: string; cards: number; placement: string };
  deck_complete: { placement: string };
  game_code_copy: { placement: string };
  deck_share: { method: "link" | "text" | "native"; placement: string };
  deck_open_builder: { placement: string };
  deck_original_open: { guide_lang: string };
  deck_vote: { stars: number; vote_type: "new" | "update" };
  tierlist_created: { locale: string; kind: string };
  tier_list_share: { method: "link" | "text"; kind: string };
  tournament_create: { visibility: string; deck_mode: string };
  tournament_join: { size: number };
  feedback_submit: Record<string, never>;
  faq_ask: { sources: number };
  steam_click: { target: string; placement: string; cta: string };
  discord_click: { server: DiscordServer; placement: string; cta: string };
  view_search_results: { search_term: string; results: number; search_area: SearchArea };
  home_route: { destination: string; section: string };
  tier_entry_open: { tier_source: string; card: string };
  tier_entry_click: { tier_source: string; target: string };
};
export type EventName = keyof EventParams;

/** Le proprietà che vanno a Vercel per ogni evento, in ordine d'importanza: al massimo due (limite del piano Pro). */
export const VERCEL_PROPS = {
  sign_up: ["method"],
  login: ["method"],
  login_start: ["method"],
  login_error: ["kind", "method"],
  deck_published: ["legendary", "source"],
  deck_created: ["legendary", "placement"],
  deck_complete: ["placement"],
  game_code_copy: ["placement"],
  deck_share: ["method", "placement"],
  deck_open_builder: ["placement"],
  deck_original_open: ["guide_lang"],
  deck_vote: ["stars", "vote_type"],
  tierlist_created: ["kind"],
  tier_list_share: ["method", "kind"],
  tournament_create: ["visibility", "deck_mode"],
  tournament_join: ["size"],
  feedback_submit: [],
  faq_ask: ["sources"],
  steam_click: ["target", "placement"],
  discord_click: ["server", "placement"],
  view_search_results: ["search_term", "results"],
  home_route: ["destination", "section"],
  tier_entry_open: ["tier_source", "card"],
  tier_entry_click: ["tier_source", "target"],
} as const satisfies { [N in EventName]: readonly (keyof EventParams[N] & string)[] };

export const isEventName = (name: unknown): name is EventName => typeof name === "string" && Object.hasOwn(VERCEL_PROPS, name);

type Primitive = string | number | boolean;
type Props = Record<string, Primitive>;

/**
 * Parametri puliti: nomi in snake_case (come li vuole GA4, massimo 40 caratteri), solo stringhe non vuote (tagliate a
 * 100 caratteri, il limite di GA4), numeri finiti e booleani. Il resto si scarta.
 */
export function cleanParams(params: Record<string, unknown>): Props {
  const out: Props = {};
  for (const [k, v] of Object.entries(params)) {
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(k)) continue;
    if (typeof v === "string") {
      const s = v.trim().slice(0, 100);
      if (s) out[k] = s;
    } else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
  }
  return out;
}

/** Le proprietà per Vercel: quelle di `VERCEL_PROPS`, nell'ordine, se ci sono. */
export function vercelProps(name: EventName, params: Props): Props {
  const out: Props = {};
  for (const k of VERCEL_PROPS[name] as readonly string[]) if (params[k] !== undefined) out[k] = params[k];
  return out;
}

/** Lingua della pagina dal percorso (/it/…, /es/…): "" fuori dalle tre lingue. */
export function langOf(pathname: string): string {
  const seg = pathname.split("/")[1] ?? "";
  return seg === "en" || seg === "it" || seg === "es" ? seg : "";
}

/** Leggendaria di un mazzo come parametro: lo slug della carta, "custom" per quelle inserite a mano (il nome lo scrive l'utente). */
export function legendaryParam(slug: string | null | undefined): string {
  if (!slug) return "none";
  return slug.startsWith("custom:") ? "custom" : slug;
}

/* ---------- invio ---------- */

let gaStarted = false;
/** GA4 spento da un ritiro del consenso in questa pagina (gtag.js resta caricato fino al ricaricamento). */
let gaStopped = false;
/** Eventi arrivati con il consenso prima che GA4 fosse avviato (un effetto figlio parte prima di quello del layout). */
const pendingGa: [string, Props][] = [];
const PENDING_MAX = 20;

/** GA4 può ricevere eventi: consenso "Accetta tutto" e browser non dello staff. */
export function gaAllowed(): boolean {
  return getConsent() === "all" && !isInternalTraffic();
}

function sendToGa(name: string, params: Props) {
  if (!gaAllowed()) return;
  if (gaStarted && !gaStopped && window.gtag) window.gtag("event", name, params);
  else if (!gaStarted && pendingGa.length < PENDING_MAX) pendingGa.push([name, params]);
}

/**
 * La coda di Vercel (`window.va` → `window.vaq`), come la crea `inject()` di @vercel/analytics: un evento mandato prima
 * che il componente <Analytics> sia montato (l'accesso, letto al primo giro di effetti del layout) aspetta lo script
 * invece di perdersi. `inject()` trova la coda e la usa così com'è.
 */
function ensureVercelQueue() {
  if (window.va) return;
  window.va = function va(...args) {
    (window.vaq = window.vaq || []).push(args);
  };
}

/* ---------- ascoltatori degli eventi (contatori dei mazzi, pacchetto STATS) ---------- */

/** Chi ascolta riceve nome e parametri già puliti di ogni evento che parte davvero da questa pagina. */
export type TrackedEventListener = (name: EventName, params: Readonly<Record<string, string | number | boolean>>) => void;
const eventListeners = new Set<TrackedEventListener>();

/**
 * Iscrizione agli eventi del catalogo mandati da questa pagina (trackEvent, attributi data-om-*, clic riconosciuti):
 * DeckStatsBeacon conta così le copie del codice del gioco nella scheda di un mazzo senza un secondo punto di misura.
 * Non arriva nulla nel browser dello staff (traffico interno), come a Vercel e GA4. Restituisce la disiscrizione.
 */
export function onTrackedEvent(fn: TrackedEventListener): () => void {
  eventListeners.add(fn);
  return () => {
    eventListeners.delete(fn);
  };
}

/** Opzioni di `send`: `ga: false` quando l'evento lo conta già la misurazione avanzata di GA4. */
function send(name: EventName, raw: Record<string, unknown>, opts: { ga?: boolean } = {}) {
  if (typeof window === "undefined") return;
  try {
    const params = cleanParams(raw);
    if (isInternalTraffic()) {
      console.info("[OriginsMeta · traffico interno] evento non inviato:", name, params);
      return;
    }
    for (const fn of eventListeners) {
      try {
        fn(name, params);
      } catch {
        /* un ascoltatore rotto non ferma la misura */
      }
    }
    try {
      ensureVercelQueue();
      track(name, vercelProps(name, params));
    } catch {
      /* Vercel non disponibile (bloccato da un'estensione): GA4 va avanti */
    }
    if (opts.ga !== false) sendToGa(name, { ...params, lang: langOf(window.location.pathname) });
  } catch {
    /* la misura non deve mai rompere la pagina */
  }
}

/** Manda un evento del catalogo a Vercel e, con il consenso, a GA4. */
export function trackEvent<N extends EventName>(name: N, params: EventParams[N]): void {
  send(name, params as Record<string, unknown>);
}

/** Come `trackEvent`, per chi ha il nome in una stringa (attributi data-om-*, CopyButton, TierExplorer): i nomi fuori catalogo si scartano. */
export function trackNamedEvent(name: string, params: Record<string, unknown>): void {
  if (isEventName(name)) send(name, params);
}

/* ---------- Google Analytics 4 ---------- */

/** `window['ga-disable-<ID>']`: la proprietà documentata da Google per spegnere GA4 in una pagina. */
function setGaDisabled(id: string, off: boolean) {
  (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = off;
}

/**
 * Avvia GA4 (lo chiama GoogleAnalytics.tsx quando c'è il consenso; gtag.js lo carica il componente). È il codice di
 * Google, tale e quale, eseguito qui invece che in uno script inline, così `window.gtag` esiste subito e gli eventi in
 * attesa partono dopo `config`. Consent Mode v2: pubblicità sempre negata, statistiche concesse. `anonymize_ip` non
 * c'è più: era di Universal Analytics e in GA4 non fa niente (GA4 non registra gli indirizzi IP).
 * Consenso ridato nella stessa pagina dopo un ritiro (ricaricamento rimandato per un modulo compilato): GA4 si riaccende.
 */
export function startGoogleAnalytics(id: string): void {
  if (typeof window === "undefined" || !id) return;
  try {
    if (gaStarted) {
      if (!gaStopped) return;
      setGaDisabled(id, false);
      window.gtag?.("consent", "update", { analytics_storage: "granted" });
      gaStopped = false;
      return;
    }
    setGaDisabled(id, false);
    const dataLayer = (window.dataLayer = window.dataLayer || []);
    // gtag vuole l'oggetto `arguments`, non un array: con un array GA4 ignora i comandi
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    };
    window.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
    window.gtag("js", new Date());
    window.gtag("config", id);
    gaStarted = true;
    for (const [name, params] of pendingGa.splice(0)) window.gtag("event", name, params);
  } catch {
    /* GA4 resta spento */
  }
}

/**
 * Consenso ritirato ("Solo necessari" dopo "Accetta tutto", anche da un'altra scheda): GA4 spento con la proprietà
 * `ga-disable-<ID>`, consenso negato a gtag e cookie _ga cancellati. Prima la proprietà e poi il consenso: con
 * l'ordine opposto gtag.js, già caricato, lavorerebbe per un attimo in Consent Mode avanzato e potrebbe mandare un
 * ping senza cookie. Restituisce true se GA4 girava in questa pagina (una volta sola): allora gtag.js è ancora
 * caricato e il chiamante ricarica la pagina, perché la misurazione avanzata (pagine viste nella cronologia,
 * scorrimento, clic in uscita) sta dentro gtag.js.
 */
export function stopGoogleAnalytics(id: string): boolean {
  if (typeof window === "undefined") return false;
  const wasRunning = gaStarted && !gaStopped;
  try {
    if (id) setGaDisabled(id, true);
    window.gtag?.("consent", "update", { analytics_storage: "denied" });
  } catch {
    /* si cancellano comunque i cookie */
  }
  if (gaStarted) gaStopped = true;
  pendingGa.length = 0;
  deleteGaCookies();
  return wasRunning;
}

/**
 * Le chiavi del browser che cambiano il permesso di GA4, per l'evento `storage` delle altre schede: il consenso, il
 * flag dello staff e null (tutto lo storage svuotato).
 */
export function storageAffectsGa(key: string | null): boolean {
  return key === null || key === CONSENT_KEY || key === INTERNAL_KEY;
}

/** Nomi dei cookie di Google Analytics presenti in `document.cookie` (_ga, _ga_<ID>, _gid, _gat…, _gac_…, _gcl_…). */
export function gaCookieNames(cookieHeader: string): string[] {
  const names = cookieHeader
    .split(";")
    .map((c) => c.split("=")[0]?.trim() ?? "")
    .filter((n) => /^(?:_ga|_gid|_gat|_gac|_gcl)(?:_|$)/.test(n));
  return [...new Set(names)];
}

/**
 * Domini da provare per cancellare un cookie: "" (cookie del solo host) e l'host con i domini sopra, fino a due livelli
 * (www.originsmeta.com, originsmeta.com). GA4 scrive i suoi sul dominio più alto possibile; un dominio che il browser
 * non accetta (un suffisso pubblico come vercel.app) viene ignorato senza danni. Niente domini per localhost e indirizzi IP.
 */
export function cookieDomains(hostname: string): string[] {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || /^[\d.]+$/.test(host) || host.includes(":")) return [""];
  const parts = host.split(".");
  const out = [""];
  for (let i = 0; i <= parts.length - 2; i++) out.push(parts.slice(i).join("."));
  return out;
}

/** Riga di `document.cookie` che cancella un cookie (scadenza immediata, stesso percorso e dominio). */
export function expiredCookie(name: string, domain: string): string {
  return `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/${domain ? `; Domain=${domain}` : ""}`;
}

/** Cancella i cookie di Google Analytics da questo sito. */
export function deleteGaCookies(): void {
  if (typeof document === "undefined") return;
  try {
    const names = gaCookieNames(document.cookie);
    if (!names.length) return;
    const domains = cookieDomains(window.location.hostname);
    for (const name of names) for (const domain of domains) document.cookie = expiredCookie(name, domain);
  } catch {
    /* cookie bloccati */
  }
}

/* ---------- testo non salvato nella pagina (ricaricamento al ritiro del consenso) ---------- */

type FieldLike = { tagName?: string; type?: string; readOnly?: boolean; isContentEditable?: boolean; form?: unknown };
/** Campi che non contano: le ricerche, i campi nascosti e i tasti. */
const NOT_UNSAVED = new Set(["search", "hidden", "button", "submit", "reset", "image"]);

/**
 * Un campo in cui scrivere lascia testo da non perdere con un ricaricamento: un'area di testo, un contenuto
 * modificabile, oppure un campo o una tendina dentro un <form> (guida da mandare, torneo, feedback, modifica di un
 * mazzo…). Le ricerche e i filtri fuori da un modulo (/cards, pool del builder, tier list) non contano.
 */
export function isUnsavedInputTarget(el: FieldLike | null | undefined): boolean {
  if (!el || typeof el !== "object") return false;
  if (el.isContentEditable) return true;
  const tag = (el.tagName ?? "").toUpperCase();
  if (tag === "TEXTAREA") return !el.readOnly;
  if (tag !== "INPUT" && tag !== "SELECT") return false;
  if (!el.form || el.readOnly) return false;
  return !NOT_UNSAVED.has((el.type ?? "").toLowerCase());
}

let unsavedInput = false;

/** Ascoltatore `input` sul documento (GoogleAnalytics.tsx): segna che nella pagina c'è testo scritto e non ancora salvato. */
export function noteUnsavedInput(e: Event): void {
  try {
    if (isUnsavedInputTarget(e.target as FieldLike | null)) unsavedInput = true;
  } catch {
    /* niente */
  }
}

/** Qualcuno ha scritto in un modulo di questa pagina (dall'ultimo cambio di pagina). */
export function hasUnsavedInput(): boolean {
  return unsavedInput;
}

/** Cambio di pagina: i moduli di prima non ci sono più. */
export function clearUnsavedInput(): void {
  unsavedInput = false;
}

/* ---------- parametri nell'indirizzo ---------- */

/** Query (`?a=1&b=2`) senza i parametri indicati: gli altri restano scritti com'erano, byte per byte. */
export function withoutParams(search: string, names: readonly string[]): string {
  const kept = search
    .replace(/^\?/, "")
    .split("&")
    .filter((pair) => {
      if (!pair) return false;
      let key = pair.split("=")[0];
      try {
        key = decodeURIComponent(key.replace(/\+/g, " "));
      } catch {
        /* chiave scritta male: si confronta così com'è */
      }
      return !names.includes(key);
    });
  return kept.length ? `?${kept.join("&")}` : "";
}

/**
 * Cambia la query dell'indirizzo senza navigare, come DeckBuilder e NewDeckBanner. Va chiamata dopo il primo giro di
 * effetti (GoogleAnalytics.tsx lo fa nell'effetto su `mounted`): a quel punto Next ha già preso in carico
 * `history.replaceState`, che con lo stato `null` copia lo stato interno del router e gli comunica il nuovo indirizzo.
 * Passare `history.state` sarebbe peggio: porta il segno di Next (`__NA`), e allora Next lascia passare la chiamata
 * senza aggiornare il suo indirizzo, che alla navigazione dopo rimetterebbe il parametro tolto.
 */
function replaceSearch(search: string) {
  const { pathname, hash } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}${hash}`);
}

/* ---------- traffico interno (MIS-03) ---------- */

export const INTERNAL_KEY = "originsmeta.internal.v1";
export const STAFF_PARAM = "staff";
/**
 * Impronta SHA-256 del codice dello staff (il codice sta nella KB, §11, mai nel repo). Per cambiarlo:
 * node -e "console.log(require('crypto').createHash('sha256').update('<nuovo codice>').digest('hex'))"
 * e si incolla qui il risultato.
 */
export const STAFF_TOKEN_SHA256 = "a7e776eeac0e499373b569710e9c3379fcb0cc38561552a5ae4b632aa7ac95ac";

export type StaffParam = { off: true } | { token: string };

/** ?staff=off (o 0) → spegni; ?staff=<qualunque altro valore> → un codice da verificare; null senza il parametro. */
export function staffParam(search: string): StaffParam | null {
  const v = new URLSearchParams(search).get(STAFF_PARAM)?.trim();
  if (!v) return null;
  if (v.toLowerCase() === "off" || v === "0") return { off: true };
  return { token: v.slice(0, 200) };
}

/** SHA-256 in esadecimale (Web Crypto, anche in Node); null se il browser non lo offre (pagina non sicura). */
export async function sha256Hex(text: string): Promise<string | null> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return null;
    const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

/** Decisione di questa pagina, finché la verifica del codice non finisce o se lo storage è bloccato; null = vale il flag salvato. */
let staffOverride: boolean | null = null;

/**
 * Browser dello staff? Vale la decisione di questa pagina (`applyStaffSwitch`), poi il parametro dell'indirizzo se c'è
 * ancora (un codice non verificato conta come staff: al peggio non si conta quella pagina), poi il flag salvato.
 */
export function isInternalTraffic(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (staffOverride !== null) return staffOverride;
    const p = staffParam(window.location.search);
    if (p) return !("off" in p);
    return localStorage.getItem(INTERNAL_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * ?staff=<codice>|off: toglie subito il parametro dall'indirizzo, verifica il codice (la sua impronta deve essere
 * `expectedHash`), salva la scelta nel browser e la conferma nella console. Un codice sbagliato non cambia niente.
 */
export async function applyStaffSwitch(expectedHash: string = STAFF_TOKEN_SHA256): Promise<void> {
  if (typeof window === "undefined") return;
  let p: StaffParam | null;
  try {
    p = staffParam(window.location.search);
    if (!p) return;
    // fino alla fine della verifica la pagina non si conta (e con ?staff=off sì)
    staffOverride = !("off" in p);
    replaceSearch(withoutParams(window.location.search, [STAFF_PARAM]));
  } catch {
    return;
  }
  const on = "token" in p ? (await sha256Hex(p.token)) === expectedHash : false;
  if ("token" in p && !on) {
    staffOverride = null;
    console.info("[OriginsMeta] Codice dello staff non valido: questo browser resta contato.");
    return;
  }
  let saved = false;
  try {
    if (on) localStorage.setItem(INTERNAL_KEY, "1");
    else localStorage.removeItem(INTERNAL_KEY);
    saved = true;
  } catch {
    /* storage bloccato: vale solo per questa pagina */
  }
  staffOverride = saved ? null : on;
  console.info(on ? "[OriginsMeta] Traffico interno: in questo browser GA4 e Vercel non contano più nulla (?staff=off per tornare)." : "[OriginsMeta] Traffico interno spento: questo browser torna a essere contato.");
}

/** Parametri della misura da togliere dagli indirizzi che arrivano a Vercel (gli UTM restano). */
const TRACKING_PARAMS = [STAFF_PARAM, "om_auth", "om_method"] as const;

/** Indirizzo senza i parametri della misura (il resto intatto, frammento compreso). */
export function stripTrackingParams(url: string): string {
  const hashAt = url.indexOf("#");
  const beforeHash = hashAt < 0 ? url : url.slice(0, hashAt);
  const hash = hashAt < 0 ? "" : url.slice(hashAt);
  const q = beforeHash.indexOf("?");
  if (q < 0) return url;
  return `${beforeHash.slice(0, q)}${withoutParams(beforeHash.slice(q), TRACKING_PARAMS)}${hash}`;
}

/**
 * `beforeSend` di Vercel Web Analytics (componente `VercelAnalytics` in GoogleAnalytics.tsx): scarta pagine viste ed
 * eventi del browser dello staff e toglie i parametri della misura dall'indirizzo (il codice dello staff compreso).
 */
export function vercelBeforeSend<E extends { url: string }>(event: E): E | null {
  if (isInternalTraffic()) return null;
  return { ...event, url: stripTrackingParams(event.url) };
}

/* ---------- accesso e iscrizione (MIS-01, MIS-11) ---------- */

export const AUTH_PARAM = "om_auth";
export const AUTH_METHOD_PARAM = "om_method";
export type AuthEvent = "sign_up" | "login";

/**
 * Indirizzo di ritorno dopo l'accesso (/auth/callback) con il segnale per la misura: `?om_auth=sign_up|login&om_method=…`,
 * prima dell'eventuale frammento (#TL1… della tier list). Sul server si costruisce solo l'indirizzo: l'evento lo manda
 * il browser all'arrivo (`consumeAuthSignal`), che poi toglie il segnale dall'indirizzo.
 */
export function withAuthSignal(next: string, event: AuthEvent, method: AuthMethod): string {
  const hashAt = next.indexOf("#");
  const path = hashAt < 0 ? next : next.slice(0, hashAt);
  const hash = hashAt < 0 ? "" : next.slice(hashAt);
  const sep = !path.includes("?") ? "?" : path.endsWith("?") || path.endsWith("&") ? "" : "&";
  return `${path}${sep}${AUTH_PARAM}=${event}&${AUTH_METHOD_PARAM}=${method}${hash}`;
}

/** Parametri della misura che un reindirizzamento del server deve portare con sé: il segnale dell'accesso e gli UTM. */
export function isCarriedParam(key: string): boolean {
  return key === AUTH_PARAM || key === AUTH_METHOD_PARAM || key.startsWith("utm_");
}

/**
 * `path` (percorso interno, con o senza query e frammento) con il segnale dell'accesso (`om_auth`, `om_method`) e gli
 * UTM della richiesta che si sta reindirizzando (`from`: `req.nextUrl.searchParams` in un route handler, i
 * `searchParams` di una pagina). Serve ai reindirizzamenti del server che stanno fra /auth/callback e la pagina
 * d'arrivo: il link d'invito /t/<tag>/<codice> (che porta account nuovi per definizione), il link breve /t/<tag>, la
 * modifica di un mazzo privato che rimanda a /decks/publish, gestione e stanza di un torneo che rimandano alla
 * scheda. Senza, il segnale si perdeva e l'accesso non si contava (revisione dell'integrazione dell'Ondata 2). Di ogni
 * parametro vale il primo valore. Funzione pura: nessun evento parte sul server.
 */
export function withCarriedParams(path: string, from: URLSearchParams | Record<string, string | string[] | undefined>): string {
  const entries: [string, string][] =
    from instanceof URLSearchParams
      ? [...from.entries()]
      : Object.entries(from).flatMap(([k, v]): [string, string][] => (typeof v === "string" ? [[k, v]] : Array.isArray(v) && v.length ? [[k, v[0]]] : []));
  const carried = new Map<string, string>();
  for (const [k, v] of entries) if (isCarriedParam(k) && !carried.has(k)) carried.set(k, v);
  if (!carried.size) return path;
  const hashAt = path.indexOf("#");
  const base = hashAt < 0 ? path : path.slice(0, hashAt);
  const hash = hashAt < 0 ? "" : path.slice(hashAt);
  const sep = !base.includes("?") ? "?" : base.endsWith("?") || base.endsWith("&") ? "" : "&";
  return `${base}${sep}${new URLSearchParams([...carried]).toString()}${hash}`;
}

/** Il segnale nella query, se è valido. */
export function readAuthSignal(search: string): { event: AuthEvent; method: AuthMethod } | null {
  const p = new URLSearchParams(search);
  const event = p.get(AUTH_PARAM);
  const method = p.get(AUTH_METHOD_PARAM);
  if ((event !== "sign_up" && event !== "login") || (method !== "discord" && method !== "email")) return null;
  return { event, method };
}

/** Finestre per riconoscere un account nuovo: la conferma appena avvenuta, la creazione entro la durata del link via email (1 ora). */
export const NEW_ACCOUNT_CONFIRMED_MS = 10 * 60_000;
export const NEW_ACCOUNT_CREATED_MS = 60 * 60_000;
/** Scarto massimo fra creazione e conferma di un account confermato da Supabase alla creazione (conferme spente, OAuth). */
const CONFIRMED_AT_CREATION_MS = 5_000;

/**
 * L'accesso appena completato (sul server, in /auth/callback) è un'iscrizione?
 * - Sì se l'account è stato confermato negli ultimi 10 minuti: il primo link via email aperto (anche per un account
 *   creato giorni prima e mai completato) e il primo accesso con Discord.
 * - Per l'email, anche se l'account è stato creato nell'ultima ora (il link scade dopo un'ora) ma SOLO quando Supabase
 *   lo ha confermato già alla creazione (conferma e creazione a pochi secondi): con le conferme accese un secondo
 *   accesso nella stessa ora ha una conferma vecchia e resta un login.
 * - Per Discord, la creazione negli ultimi 10 minuti (il giro su Discord dura poco).
 * Restano possibili doppioni rari (un secondo accesso entro 10 minuti dalla conferma): nello stesso browser li toglie
 * `dedupeSignUp`; il numero certo degli iscritti resta quello del database (auth.users).
 */
export function isNewAccount(
  user: { created_at?: string | null; confirmed_at?: string | null; email_confirmed_at?: string | null } | null | undefined,
  method: AuthMethod = "email",
  now = Date.now(),
): boolean {
  if (!user) return false;
  const at = (iso: string | null | undefined) => {
    const t = Date.parse(iso ?? "");
    return Number.isFinite(t) ? t : null;
  };
  const recent = (t: number | null, windowMs: number) => t !== null && Math.abs(now - t) < windowMs;
  const created = at(user.created_at);
  const confirmed = at(user.confirmed_at ?? user.email_confirmed_at);
  if (recent(confirmed, NEW_ACCOUNT_CONFIRMED_MS)) return true;
  if (method === "discord") return recent(created, NEW_ACCOUNT_CONFIRMED_MS);
  const confirmedAtCreation = confirmed === null || (created !== null && Math.abs(confirmed - created) < CONFIRMED_AT_CREATION_MS);
  return confirmedAtCreation && recent(created, NEW_ACCOUNT_CREATED_MS);
}

/**
 * Chiave del browser con l'ora dell'ultimo sign_up mandato da qui. Si scrive anche senza il consenso ai cookie, perché
 * serve anche a Vercel (che conta senza consenso): l'informativa lo dice (`privacy.cookies` dei dizionari). Non esce
 * mai dal browser.
 */
export const SIGNUP_KEY = "originsmeta.signup.v1";

/**
 * Finestra entro cui l'ultimo accesso della sessione del browser rende credibile il segnale ?om_auth=. Ampia nelle due
 * direzioni, perché l'orologio del dispositivo può essere avanti o indietro rispetto a quello di Supabase.
 */
export const AUTH_SIGNAL_MAX_AGE_MS = 10 * 60_000;

/** L'ultimo accesso (`last_sign_in_at` di Supabase) è di pochi minuti fa? */
export function freshSignIn(lastSignInAt: string | null | undefined, now = Date.now()): boolean {
  const t = Date.parse(lastSignInAt ?? "");
  return Number.isFinite(t) && Math.abs(now - t) < AUTH_SIGNAL_MAX_AGE_MS;
}

/** I dati dell'utente della sessione che servono a verificare il segnale (i campi dell'utente di Supabase). */
export type SessionUser = {
  last_sign_in_at?: string | null;
  created_at?: string | null;
  confirmed_at?: string | null;
  email_confirmed_at?: string | null;
};

/**
 * Un secondo sign_up nello stesso browser entro un'ora dal primo diventa login: è lo stesso account che rientra (un
 * secondo link via email, Discord dopo un'uscita) nella finestra in cui `isNewAccount` non lo distingue.
 */
export function dedupeSignUp(event: AuthEvent, lastSignUp: number | null, now: number): AuthEvent {
  if (event !== "sign_up" || lastSignUp === null || !Number.isFinite(lastSignUp)) return event;
  const age = now - lastSignUp;
  return age >= 0 && age < NEW_ACCOUNT_CREATED_MS ? "login" : event;
}

/**
 * All'arrivo dopo l'accesso: toglie subito il segnale dall'indirizzo (un ricaricamento non lo ripete), poi manda
 * sign_up o login.
 *
 * Il segnale sta in chiaro nella query, quindi da solo non prova niente: chiunque potrebbe girare un link con
 * ?om_auth=sign_up e gonfiare l'evento chiave delle iscrizioni (revisione dell'integrazione dell'Ondata 2). L'evento
 * parte solo se `sessionUser` (in GoogleAnalytics.tsx: l'utente della sessione Supabase del browser) restituisce un
 * utente con un accesso di pochi minuti fa (`freshSignIn`); e un sign_up vale solo se anche qui l'account risulta
 * nuovo (`isNewAccount`, la stessa regola di /auth/callback), altrimenti diventa login. Resta il caso raro di un link
 * falso aperto nei dieci minuti dopo un accesso vero: al massimo un login in più.
 */
export async function consumeAuthSignal(sessionUser: () => Promise<SessionUser | null | undefined>): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const search = window.location.search;
    const p = new URLSearchParams(search);
    if (!p.has(AUTH_PARAM) && !p.has(AUTH_METHOD_PARAM)) return;
    const signal = readAuthSignal(search);
    replaceSearch(withoutParams(search, [AUTH_PARAM, AUTH_METHOD_PARAM]));
    if (!signal) return;
    let user: SessionUser | null | undefined;
    try {
      user = await sessionUser();
    } catch {
      user = null;
    }
    const now = Date.now();
    if (!user || !freshSignIn(user.last_sign_in_at, now)) return;
    let event: AuthEvent = signal.event === "sign_up" && !isNewAccount(user, signal.method, now) ? "login" : signal.event;
    try {
      const raw = localStorage.getItem(SIGNUP_KEY);
      event = dedupeSignUp(event, raw === null ? null : Number(raw), now);
      if (event === "sign_up") localStorage.setItem(SIGNUP_KEY, String(now));
    } catch {
      /* storage bloccato: si manda com'è */
    }
    trackEvent(event, { method: signal.method });
  } catch {
    /* indirizzo non leggibile */
  }
}

/**
 * Tipo della navigazione che ha caricato il documento ("navigate", "reload", "back_forward", "prerender"), undefined
 * se il browser non lo dice. Le navigazioni interne di Next non lo cambiano: vale per l'ultimo caricamento completo.
 */
export function navigationType(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    return nav?.type;
  } catch {
    return undefined;
  }
}

/**
 * Un dato che arriva nell'indirizzo con un caricamento completo (l'errore del ritorno da /auth/callback, ?error=) si
 * conta solo all'arrivo: non a un ricaricamento né tornando con avanti/indietro, quando l'indirizzo è ancora lo
 * stesso. Se il browser non dice il tipo, si conta.
 */
export function countsOnArrival(type: string | undefined): boolean {
  return type !== "reload" && type !== "back_forward";
}

/* ---------- UTM dei messaggi Discord mandati dal sito (MIS-07) ---------- */

/**
 * Query con gli UTM dei link che il sito manda da sé su Discord (mazzi pubblicati in #community-decks, tornei in
 * #tournaments-feed): gli stessi valori degli annunci della GitHub Action (`withUtm` in scripts/discord-announce.mjs),
 * utm_source=discord, utm_medium=social, campagna = tipo di contenuto, content = canale senza "#". Funzione pura:
 * la usano anche i moduli del server (src/lib/community/discordDeck.ts, src/lib/tournament/notify.ts).
 */
export function discordUtm(campaign: string, content: string): string {
  return new URLSearchParams({ utm_source: "discord", utm_medium: "social", utm_campaign: campaign, utm_content: content }).toString();
}

/* ---------- ricerca interna (MIS-13) ---------- */

/**
 * Termine cercato come parametro: minuscolo, spazi compattati, al massimo 40 caratteri. Si scarta (null) quello che non
 * sembra la ricerca di una carta e potrebbe essere un dato personale o un codice: email, link, numeri lunghi (telefoni),
 * testi oltre 60 caratteri (un codice di mazzo incollato).
 */
export function searchTermForAnalytics(raw: string): string | null {
  const t = raw.replace(/\s+/g, " ").trim().toLowerCase();
  if (t.length < 2 || t.length > 60) return null;
  if (t.includes("@") || /https?:|www\./.test(t) || /\d{5,}/.test(t.replace(/[\s.-]/g, ""))) return null;
  return t.slice(0, 40).trim();
}

export const SEARCH_DELAY_MS = 1500;
const searchTimers: Partial<Record<SearchArea, ReturnType<typeof setTimeout>>> = {};
const lastSearch: Partial<Record<SearchArea, string>> = {};

/**
 * Ricerca fra le carte (/cards, pool del deck builder): da chiamare in un effetto a ogni cambio del testo o del numero
 * di risultati. Parte un evento solo quando si smette di scrivere per 1,5 secondi, e non due volte di fila per lo
 * stesso termine. Il termine che arriva con ?q= (la ricerca dell'header porta a /cards?q=…) GA4 lo conta già con la
 * misurazione avanzata ("ricerca nel sito"): quello va solo a Vercel.
 */
export function trackSearch(area: SearchArea, rawTerm: string, results: number): void {
  if (typeof window === "undefined") return;
  try {
    clearTimeout(searchTimers[area]);
    const term = searchTermForAnalytics(rawTerm);
    if (!term) return;
    searchTimers[area] = setTimeout(() => {
      if (lastSearch[area] === term) return;
      lastSearch[area] = term;
      const fromHeader = searchTermForAnalytics(new URLSearchParams(window.location.search).get("q") ?? "") === term;
      send("view_search_results", { search_term: term, results, search_area: area }, { ga: !fromHeader });
    }, SEARCH_DELAY_MS);
  } catch {
    /* la ricerca funziona comunque */
  }
}

/* ---------- clic: link verso Steam e Discord, home, attributi data-om-* ---------- */

/** App di Steam del gioco e della demo (gli stessi di `officialLinks` in Footer.tsx). */
const STEAM_GAME_APP = "4429430";
const STEAM_DEMO_APP = "4756630";

const isSteamHost = (host: string) => /(?:^|\.)(?:steampowered|steamcommunity)\.com$/i.test(host);
const isDiscordHost = (host: string) => /^discord\.gg$/i.test(host) || /(?:^|\.)discord(?:app)?\.com$/i.test(host);

/**
 * Dove porta un link di Steam: pagina del gioco, della demo, una news (patch notes sullo store e archivio delle news
 * della community, `officialLinks.news`), il Next Fest, il resto della community, altro.
 */
export function steamTarget(url: URL): string {
  const path = url.pathname.toLowerCase();
  if (path.startsWith("/news/") || /\/(?:all)?news(?:\/|$)/.test(path)) return "news";
  if (/(?:^|\.)steamcommunity\.com$/i.test(url.hostname)) return "community";
  if (path.startsWith("/sale/nextfest")) return "next_fest";
  if (path.startsWith(`/app/${STEAM_DEMO_APP}`)) return "demo";
  if (path.startsWith(`/app/${STEAM_GAME_APP}`)) return "store";
  return "other";
}

/** Codice d'invito del nostro Discord ("RAG7nnrNGP"), da `ORIGINSMETA_DISCORD`: gli inviti a caso distinguono le maiuscole. */
const OUR_INVITE = ORIGINSMETA_DISCORD.replace(/\/+$/, "").split("/").pop() ?? "";
/**
 * Inviti del Discord ufficiale di Koin Games: l'indirizzo personalizzato di `officialLinks.discord` in Footer.tsx
 * (discord.gg/originstcg), che non distingue le maiuscole. Se Koin ne aggiunge altri, vanno qui.
 */
const OFFICIAL_INVITES = new Set(["originstcg"]);

/** Server di un link Discord: il nostro, quello ufficiale, oppure un altro (tornei, creator, link ai canali). */
export function discordServer(url: URL): DiscordServer {
  const code = url.pathname.replace(/^\/(?:invite\/)?/, "").replace(/\/+$/, "");
  if (OUR_INVITE && code === OUR_INVITE) return "originsmeta";
  const isInvite = url.hostname.toLowerCase() === "discord.gg" || /^\/invite\//i.test(url.pathname);
  return isInvite && OFFICIAL_INVITES.has(code.toLowerCase()) ? "official" : "other";
}

type LinkEvent = { name: "steam_click"; params: EventParams["steam_click"] } | { name: "discord_click"; params: EventParams["discord_click"] };

/** Evento di un link in uscita verso Steam o Discord; null per tutti gli altri link. */
export function linkEvent(href: string, placement: string, cta: string): LinkEvent | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (isSteamHost(host)) return { name: "steam_click", params: { target: steamTarget(url), placement, cta } };
  if (isDiscordHost(host)) {
    // le API (webhook) non sono link per i visitatori
    if (url.pathname.startsWith("/api/")) return null;
    return { name: "discord_click", params: { server: discordServer(url), placement, cta } };
  }
  return null;
}

/** La home: /en, /it, /es, con o senza la barra finale. */
export function isHomePath(pathname: string): boolean {
  return /^\/(?:en|it|es)\/?$/.test(pathname);
}

/**
 * Destinazione di un link cliccato nella home (evento home_route, HOME-12): la sezione del sito a cui porta, oppure
 * steam, discord, youtube, external per i link in uscita. null per la home stessa (logo, ancore) e per i link che non
 * sono pagine (mailto:, javascript:). Steam e Discord restano nella classificazione, ma `onDocumentClick` per quei link
 * manda solo steam_click e discord_click.
 */
export function homeDestination(href: string, origin: string): string | null {
  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.origin !== origin) {
    const host = url.hostname.toLowerCase();
    if (isSteamHost(host)) return "steam";
    if (isDiscordHost(host)) return "discord";
    if (/(?:^|\.)(?:youtube(?:-nocookie)?\.com|youtu\.be)$/.test(host)) return "youtube";
    return "external";
  }
  const segs = url.pathname.split("/").filter(Boolean);
  // link breve di un torneo (/t/OM-XXXX), fuori dalle lingue
  if (segs[0] === "t") return "tournaments";
  const [first, second] = langOf(url.pathname) ? segs.slice(1) : segs;
  if (!first) return null;
  switch (first) {
    case "tier-list":
      return second === "create" ? "tier_list_maker" : second === "community" ? "tier_list_community" : second === "most-played" ? "tier_list_most_played" : "tier_list";
    case "decks":
      return second === "publish" ? "deck_publish" : second ? "deck_page" : "decks";
    case "deck-builder":
      return "builder";
    case "cards":
      return second ? "card_page" : "cards";
    case "news":
      return second ? "news_article" : "news";
    case "guides":
      return second ? "guide" : "guides";
    default:
      return (
        first
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .slice(0, 40) || null
      );
  }
}

/** `data-om-search-area` → "search_area": nome del parametro da una chiave del dataset (senza il prefisso "om"). */
export function datasetKeyToParam(key: string): string | null {
  if (!/^om[A-Z]/.test(key)) return null;
  const rest = key.slice(2);
  return rest.charAt(0).toLowerCase() + rest.slice(1).replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** Evento dichiarato con gli attributi: `data-om-event` è il nome, gli altri `data-om-*` i parametri. */
export function datasetEvent(dataset: Record<string, string | undefined>): { name: EventName; params: Props } | null {
  const name = dataset.omEvent;
  if (!isEventName(name)) return null;
  const raw: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(dataset)) {
    // omDeckStat: il contatore del mazzo (DeckStatsBeacon), non un parametro dell'evento
    if (k === "omEvent" || k === "omCta" || k === "omDeckStat") continue;
    const param = datasetKeyToParam(k);
    if (param && v !== undefined) raw[param] = v;
  }
  return { name, params: cleanParams(raw) };
}

type Closest = { closest(selector: string): { getAttribute(name: string): string | null } | null };

/**
 * Posto del link nella pagina: `data-om-placement` (del link o di un contenitore), header, footer, content (dentro
 * <main>); fuori dal <main> lo slider della home (HeroSlider, l'unico carosello del sito) e la striscia del calendario
 * (EventTicker, classe `ticker`); other per il resto (banner dei cookie, riquadro dei feedback).
 */
export function placementOf(el: Closest): string {
  const own = el.closest("[data-om-placement]")?.getAttribute("data-om-placement");
  if (own) return own.slice(0, 40);
  if (el.closest("body > header")) return "header";
  if (el.closest("body > footer")) return "footer";
  if (el.closest("main")) return "content";
  if (el.closest('[aria-roledescription="carousel"]')) return "slider";
  if (el.closest(".ticker")) return "calendar";
  return "other";
}

/** Posti della pagina che non sono la home anche quando si è nella home: header, footer, banner e pop-up. */
const OUTSIDE_HOME = new Set(["header", "footer", "other"]);

/**
 * Ascoltatore dei clic su tutto il documento (click e clic con la rotellina, auxclick), registrato da GoogleAnalytics.tsx
 * in fase di cattura: così vede anche i link di componenti server (SteamButton, DiscordButton, footer, testi delle news,
 * home) senza trasformarli in componenti client, e anche i clic che un altro gestore ferma.
 */
export function onDocumentClick(e: MouseEvent): void {
  try {
    if (e.type === "auxclick" && e.button !== 1) return;
    const target = e.target instanceof Element ? e.target : null;
    const el = target?.closest<HTMLElement>("a[href], button");
    if (!el) return;
    const tagged = el.closest<HTMLElement>("[data-om-event]");
    const declared = tagged ? datasetEvent({ ...tagged.dataset }) : null;
    if (declared) send(declared.name, declared.params);
    if (!(el instanceof HTMLAnchorElement)) return;
    const placement = placementOf(el);
    const ev = linkEvent(el.href, placement, el.dataset.omCta || "link");
    if (ev) send(ev.name, ev.params);
    // HOME-12: ogni link della home (fuori da header, footer e pop-up) dice dove porta chi arriva in home. Non i link
    // verso Steam e Discord (`ev`): steam_click e discord_click portano già il posto nella home, e lo stesso clic non
    // deve contare due volte (revisione dell'integrazione dell'Ondata 2).
    if (!ev && declared?.name !== "home_route" && isHomePath(window.location.pathname) && !OUTSIDE_HOME.has(placement)) {
      const destination = homeDestination(el.href, window.location.origin);
      if (destination) send("home_route", { destination, section: placement });
    }
  } catch {
    /* il clic va avanti comunque */
  }
}
