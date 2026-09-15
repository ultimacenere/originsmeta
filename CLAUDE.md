@AGENTS.md

# OriginsMeta — note per Claude

Sito fan non ufficiale su Origins TCG (Koin Games), due lingue (en/it; il francese è stato ritirato il 15/09/2026, i testi FR restano nei dati), Next.js 16 + Tailwind 4, deploy su Vercel da GitHub `ultimacenere/originsmeta`. Proprietario: Pierluigi Cella. Contatto pubblico: staff@originsmeta.com.

## Regole del progetto

- Rispondere e commentare in italiano; i contenuti del sito sono in inglese e italiano e vanno sempre aggiornati insieme (`en` è il tipo di riferimento per i dizionari).
- Niente dati inventati: carte, statistiche, date ed eventi vengono solo dalle fonti ufficiali (pagina Steam, patch notes su Steam, Discord, comunicati). Le stat attuali sono quelle della patch 0.6.3 del playtest (27/08/2026).
- La dicitura "non affiliato a Koin Games" non si toglie mai.
- Nessuna dipendenza nuova senza motivo: il sito è statico, senza database. Le funzioni future (tier list votata, tracker prezzi Steam Market, deck builder) vanno aggiunte come API route o con un DB esterno, non rompendo la generazione statica delle pagine esistenti.
- Prima di ogni push: `npm run build` deve passare senza errori.

## Decisioni di prodotto (note Granola 3.0 e 4.0, 15/09/2026)

- Menu: News · Tier list · Guide · Carte · Mazzi · Tornei ed Eventi. La sezione dei bilanciamenti si chiama **MetaShift**.
- Home above the fold: news del giorno + MetaShift + tier list; ricerca carte sempre visibile nell'header; calendario come striscia scorrevole (`EventTicker`), non come blocco statico.
- Tier list in tre sezioni (mazzi, leggendarie, carte base); mazzi con tag obbligatori (leggendaria, archetipo, creator); collegamenti incrociati tier list → mazzo → carta → guida.
- Colore dominante degli accenti: menta del logo (i competitor usano viola/rosa). Font: Unbounded (display), Manrope (testo).
- Analytics: Vercel Web Analytics + Speed Insights; niente GA4 per ora.
- Prossimo grande cantiere: deck builder (regole del gioco, import/export codice mazzo, modalità 3 mazzi da torneo).

## Struttura

- `src/app/[locale]/…` pagine; il layout radice sta sotto `[locale]` (html lang per lingua). `src/app/global-not-found.tsx` gestisce i 404 fuori dalle lingue.
- `next.config.ts` reindirizza `/` alla lingua del browser.
- `src/lib/i18n.ts` locali, `href()`, `alternatesFor()`; `src/lib/page.ts` helper `resolveLocale` e `pageMeta`.
- Dati in `src/lib/data/*.ts`, guide in `src/lib/content/guides.ts`, media in `public/media/`.

## Palette ("ink & mint")

Sfondo viola inchiostro (`felt`), carte avorio (`ivory`), accento dominante menta (`mint`), giallo citrino solo per leggendarie ed evento evidenziato (`gold`), magenta per nerf e avvisi (`crimson`). Font: Unbounded (display), Manrope (testo), JetBrains Mono (numeri).
