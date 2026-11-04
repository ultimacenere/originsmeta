import type { NewsCopy } from "./news-fr";

/**
 * Testi in cinese semplificato delle news (04/11/2026, ottava lingua del sito), una voce per slug con gli stessi campi
 * della versione inglese di news.ts. A differenza delle altre lingue qui possono mancare news: Pierluigi ha scelto
 * "prima il nucleo, news dopo", quindi si parte dalle news dal 20/10/2026 e una news assente resta fuori da /zh-cn
 * (`untranslated` in news.ts). Regole e glossario in docs/cinese.md.
 */
export const zhCnText: Record<string, NewsCopy> = {};
