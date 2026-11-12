/**
 * La pagina "/twitch" (12/11/2026, Pierluigi: "una landing page verticale sul layout di twitch: una presentazione
 * rapida e le istruzioni a prova di demente ma poco testo e chiaro, se riesci a stare in una schermata standard senza
 * scroll sarebbe ideale e aggiungi i contatti miei e di dav"; alla domanda su che cosa intendesse ha scelto "Tracker +
 * estensione Twitch" e, per i contatti, "Discord personali").
 *
 * Una schermata: che cosa ottiene il creator, sette passi (quattro sul PC con OriginsMeta Tracker, tre su Twitch con
 * l'estensione "OriginsMeta Deck tracker") e a chi scrivere se si blocca. Le guide lunghe, con le immagini e i casi in
 * cui non va, restano in /for-creators e in /tracker: qui c'è solo il percorso dritto.
 * Costanti e regole qui, testi in twitchSetupLabels.ts (otto lingue), prove in twitchSetup.test.ts.
 */

/** Percorso della pagina senza lingua: originsmeta.com/twitch porta alla lingua del browser (next.config.ts). */
export const TWITCH_SETUP_PATH = "/twitch";

// La scheda dell'estensione su Twitch, dove si preme "Installa", è `TWITCH_EXTENSION_URL` di forCreators.ts (la stessa delle
// guide di /for-creators): la pagina la prende da lì.

/** Dove si creano i due codici (quello dell'app e quello per Twitch): la pagina Tracker dell'account. */
export const TRACKER_ACCOUNT_PATH = "/account/tracker";

/** Tutte le guide passo passo, con le immagini e il "se non funziona": la sezione degli strumenti di /for-creators. */
export const FULL_GUIDES_PATH = "/for-creators#tools";

/** L'immagine della pagina: i pannelli del Tracker sopra una partita (screenshot nostro, lo stesso di /for-creators). */
export const TWITCH_SETUP_IMAGE = "/media/analytics/tracker-cover.webp";

/** I passi, nell'ordine in cui si fanno. Quattro sul PC, tre su Twitch: i testi hanno un passo per ogni id. */
export const PC_STEPS = ["download", "run", "link", "layout"] as const;
export const TWITCH_STEPS = ["install", "activate", "connect"] as const;
export type PcStepId = (typeof PC_STEPS)[number];
export type TwitchStepId = (typeof TWITCH_STEPS)[number];
export type SetupStepId = PcStepId | TwitchStepId;

/** Il numero di un passo sulla pagina (1–7): prima quelli del PC, poi quelli di Twitch. */
export function stepNumber(id: SetupStepId): number {
  const all: readonly SetupStepId[] = [...PC_STEPS, ...TWITCH_STEPS];
  return all.indexOf(id) + 1;
}

/**
 * A chi scrivere se ci si blocca: i due fondatori, con il nome utente Discord (non c'è un indirizzo che apra un profilo
 * Discord dal nome utente: si mostra il nome e si copia). `discord: null` = nome utente non ancora dato: la pagina
 * mostra solo il nome, e il tasto verso il nostro server Discord resta comunque.
 * Solo contatti dati da Pierluigi o già pubblici: `aldrymus` è il nome utente con cui Pierluigi ha creato gli inviti
 * pubblici del nostro server (lo dice l'invito stesso). Quello di Dav va chiesto a lui: mai un nome indovinato.
 */
export type SetupContact = { name: string; discord: string | null };
export const SETUP_CONTACTS: readonly SetupContact[] = [
  { name: "Aldry", discord: "aldrymus" },
  { name: "Davdas", discord: null },
];

/** Un nome utente Discord valido (2–32 fra minuscole, cifre, punto e trattino basso): il test lo usa sui contatti. */
export function isDiscordUsername(v: string): boolean {
  return /^(?!.*\.\.)[a-z0-9._]{2,32}$/.test(v);
}

/** Dove sta chi clicca, per la misura (evento twitch_setup_click, parametro target). */
export type TwitchSetupTarget = "extension" | "code" | "twitch_code" | "guides";

/** Attributi di misura di un link della pagina (src/lib/analytics.ts li legge dal markup). */
export function twitchSetupTrack(target: TwitchSetupTarget): { "data-om-event": "twitch_setup_click"; "data-om-target": TwitchSetupTarget } {
  return { "data-om-event": "twitch_setup_click", "data-om-target": target };
}
