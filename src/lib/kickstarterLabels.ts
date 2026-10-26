import type { Locale } from "./i18n";
import { en } from "./kickstarterLabels-en";
import { it } from "./kickstarterLabels-it";
import { es } from "./kickstarterLabels-es";
import { fr } from "./kickstarterLabels-fr";
import { pt } from "./kickstarterLabels-pt";
import { de } from "./kickstarterLabels-de";
import { ru } from "./kickstarterLabels-ru";

/**
 * Testi della landing /kickstarter, della slide in home, della barra in cima al sito e del riquadro nella guida al
 * Kickstarter (26/10/2026, src/lib/kickstarter.ts). Una lingua per file, kickstarterLabels-<lingua>.ts
 * (stessa forma: il tipo è quello inglese; i file non importano niente a runtime, così li carica anche `node --test`).
 *
 * Regole dei testi (checklist di conversione del 26/10/2026, fonti NN/g, Kickstarter, FTC, UE e Codice del consumo):
 * - frasi brevi e oggettive, fatti prima degli aggettivi; solo fatti scritti da Koin Games (pagina VIP
 *   founder.origins-tcg.com e pagina della campagna lette il 26/10/2026, post su X dei set) o letti su Steam con la data,
 *   e le regole di Kickstarter (tutto o niente); nessun prezzo né livello finché la campagna non li mostra;
 * - tasto con verbo e destinazione, e sotto che cosa succede al clic; prima del lancio "Avvisami", dal lancio "Sostienila";
 * - il link referral dichiarato accanto a ogni tasto, con il rapporto con Koin (`disclosure`): "non affiliato" da solo
 *   sembrerebbe in contraddizione con la commissione;
 * - nessuna urgenza o scarsità oltre a quelle che Koin ha scritto (Alpha mai ristampata, box e case solo in preordine).
 * Segnaposto: `{n}` e `{total}` (numeri), `{date}` (data già scritta nella lingua).
 */

export type KickstarterLabels = typeof en;

export const kickstarterLabels: Record<Locale, KickstarterLabels> = { en, it, es, fr, pt, de, ru };

/** Sostituisce i segnaposto `{nome}` di un testo. */
export function fillKs(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Il testo del tasto: "Avvisami" prima del lancio, "Sostienila" dal lancio (`kickstarterLive` in kickstarter.ts). */
export function ctaLabel(k: KickstarterLabels, live: boolean): string {
  return live ? k.cta : k.ctaPre;
}
