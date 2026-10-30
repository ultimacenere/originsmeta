import type { Locale } from "./i18n";
import type { ColorId, KitFileId, ToolId } from "./forCreators";
import { en } from "./forCreatorsLabels-en";
import { it } from "./forCreatorsLabels-it";
import { es } from "./forCreatorsLabels-es";
import { fr } from "./forCreatorsLabels-fr";
import { pt } from "./forCreatorsLabels-pt";
import { de } from "./forCreatorsLabels-de";
import { ru } from "./forCreatorsLabels-ru";

/**
 * Testi della pagina per i creator, /for-creators (30/10/2026, src/lib/forCreators.ts). Una lingua per file,
 * forCreatorsLabels-<lingua>.ts, tutti con questa forma; i file non importano niente a runtime, così li carica anche
 * `node --test`.
 *
 * Regole dei testi (Pierluigi: "facciamo le cose a prova di scemo per installare"):
 * - un passo = una cosa da fare, con i nomi dei tasti scritti come li mostra il programma, fra virgolette;
 * - ogni guida dice prima che cosa serve, alla fine come si capisce che ha funzionato e che cosa fare se non va;
 * - le righe da copiare stanno in `code` (o `codes` quando ce n'è una per bot), con i segnaposto `{user}` e `{lang}`
 *   (`fillCode`); i link interni senza lingua ("/tracker"), quelli esterni con https://;
 * - solo strumenti e funzioni che ci sono davvero; niente promesse sui tempi né criteri per il ruolo Creator, che
 *   decide lo staff; "non affiliato a Koin Games" sempre, e il kit non contiene materiale di Koin Games.
 */

export type GuideLink = { label: string; path: string };

export type GuideStep = {
  text: string;
  /** una riga da copiare */
  code?: string;
  /** più righe da copiare, una per programma (Nightbot, StreamElements…) */
  codes?: { label: string; code: string }[];
  link?: GuideLink;
};

export type ToolGuide = {
  id: ToolId;
  name: string;
  /** dove si usa, in due o tre parole ("App per Windows") */
  tag: string;
  /** che cosa ci fai, una o due frasi */
  what: string;
  /** quanto ci vuole ("5 minuti") */
  time: string;
  needs: string;
  steps: GuideStep[];
  /** come si capisce che ha funzionato */
  done: string;
  /** se non va: un consiglio per voce */
  stuck: string[];
  more?: GuideLink;
};

export type ForCreatorsLabels = {
  meta: { title: string; description: string };
  kicker: string;
  h1: string;
  lead: string;
  points: string[];
  /** tasto principale: chiedere il ruolo Creator */
  apply: string;
  applyNote: string;
  /** tasto secondario: al media kit */
  kitCta: string;
  heroAlt: string;
  heroCaption: string;
  toc: { label: string; perks: string; tools: string; ideas: string; kit: string; join: string; faq: string };
  /** al posto di {user} senza accesso: "YOUR-USERNAME" */
  you: string;
  /** {user} = nome utente */
  filled: string;
  notFilled: string;
  signIn: string;
  copy: string;
  copied: string;
  perks: {
    title: string;
    intro: string;
    /** pastiglia delle voci solo per il ruolo Creator */
    creatorOnly: string;
    items: { title: string; text: string; creator?: boolean; link?: GuideLink }[];
  };
  tools: {
    title: string;
    intro: string;
    /** tasto della scheda in cima: "Guida ↓" */
    guide: string;
    time: string;
    needs: string;
    done: string;
    stuck: string;
    items: ToolGuide[];
  };
  ideas: { title: string; intro: string; items: { title: string; text: string; link: GuideLink }[] };
  kit: {
    title: string;
    intro: string;
    /** tasto dello zip; {size} = peso già scritto ("1,7 MB") */
    all: string;
    allNote: string;
    download: string;
    /** {w} e {h} = misure in pixel */
    size: string;
    transparent: string;
    files: Record<KitFileId, { title: string; text: string }>;
    /** sotto badge e pannello: le altre lingue stanno nello zip */
    allLangs: string;
    colors: { title: string; items: Record<ColorId, { name: string; use: string }> };
    fonts: { title: string; text: string };
    lines: { title: string; intro: string; items: string[] };
    rules: { title: string; doTitle: string; do: string[]; dontTitle: string; dont: string[] };
  };
  join: {
    title: string;
    intro: string;
    steps: { title: string; text: string; link?: GuideLink }[];
    note: string;
    /** oggetto e testo del messaggio già pronto nella casella dello staff */
    subject: string;
    body: string;
  };
  faq: { title: string; items: { q: string; a: string }[] };
  /** link verso la pagina: colonna "Esplora" del footer e riquadro di /creators */
  entry: { footer: string; creators: string };
  unofficial: string;
};

export const forCreatorsLabels: Record<Locale, ForCreatorsLabels> = { en, it, es, fr, pt, de, ru };

/** Sostituisce i segnaposto `{nome}` di un testo. */
export function fillFc(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
