@AGENTS.md

# OriginsMeta — note per Claude

Sito fan non ufficiale su Origins TCG (Koin Games), tre lingue (en/it/fr), Next.js 16 + Tailwind 4, deploy su Vercel da GitHub `ultimacenere/originsmeta`. Proprietario: Pierluigi Cella. Contatto pubblico: staff@originsmeta.com.

## Regole del progetto

- Rispondere e commentare in italiano; i contenuti del sito sono nelle tre lingue e vanno sempre aggiornati insieme (`en` è il tipo di riferimento per i dizionari).
- Niente dati inventati: carte, statistiche, date ed eventi vengono solo dalle fonti ufficiali (pagina Steam, patch notes su Steam, Discord, comunicati). Le stat attuali sono quelle della patch 0.6.3 del playtest (27/08/2026).
- La dicitura "non affiliato a Koin Games" non si toglie mai.
- Nessuna dipendenza nuova senza motivo: il sito è statico, senza database. Le funzioni future (tier list votata, tracker prezzi Steam Market, deck builder) vanno aggiunte come API route o con un DB esterno, non rompendo la generazione statica delle pagine esistenti.
- Prima di ogni push: `npm run build` deve passare senza errori.

## Struttura

- `src/app/[locale]/…` pagine; il layout radice sta sotto `[locale]` (html lang per lingua). `src/app/global-not-found.tsx` gestisce i 404 fuori dalle lingue.
- `next.config.ts` reindirizza `/` alla lingua del browser.
- `src/lib/i18n.ts` locali, `href()`, `alternatesFor()`; `src/lib/page.ts` helper `resolveLocale` e `pageMeta`.
- Dati in `src/lib/data/*.ts`, guide in `src/lib/content/guides.ts`, media in `public/media/`.

## Palette ("ink & ivory")

Sfondo viola inchiostro (`felt`), carte avorio (`ivory`), accento menta (`mint`), giallo citrino per le leggendarie (`gold`), magenta per nerf e avvisi (`crimson`). Font: Syne (display), Manrope (testo), JetBrains Mono (numeri).
