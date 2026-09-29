# Fumetti dei creator (pacchetto FUMETTI, 29/09/2026)

Richiesta di Pierluigi del 29/09/2026: Vega (Creator) disegna un fumetto a settimana su Origins TCG, "vorrei che venisse
fatta come news". Alla domanda su come, ha scelto **"Li pubblica lei da sola"** e la firma **"Vega"**: chi ha il ruolo
Creator o Staff (o è admin) pubblica i suoi fumetti dal sito, senza passare dallo staff, e il fumetto esce fra le news,
firmato da chi l'ha disegnato, con una pagina sua.

## Dove sta cosa

- **Pagine**: `/news/comics/<slug>` (la pagina del fumetto, ISR 60 s), `/news/comics` (l'elenco, ISR 300 s, noindex
  finché è vuoto), `/news/comics/new` (il modulo, dinamica e noindex; senza accesso porta al login), `/news/comics/<slug>/edit`
  (modifica del proprietario; lo staff lì nasconde, rimette online ed elimina, ma non cambia i contenuti di un altro).
- **Fra le news**: home (le tre in evidenza con il post-it "Fumetto" verde lime, poi la bacheca) e `/news` mettono news
  del sito e fumetti in un solo elenco dal più recente (`mergeFeed`: a pari giorno prima il fumetto). Per questo home e
  `/news` sono in ISR (`revalidate = 300`, rinnovate subito dalle Server Action dei fumetti) invece che statiche. Il
  feed RSS delle news (`/<lingua>/news/feed.xml`, statico) i fumetti non li ha.
- **Altrove**: profilo `/u/<nome>` (sezione "Fumetti"), `/account#comics` ("I miei fumetti": bozze, pubblicati e
  nascosti, con Apri, Modifica ed Elimina), sitemap (sezione news di ogni lingua, solo le versioni indicizzabili),
  informativa (`/privacy#community-comics`).
- **Codice**: regole pure in `src/lib/community/comics.ts` (test in `comics.test.ts`, che le confronta anche con l'SQL),
  letture in `comicQueries.ts`, Server Action in `comicActions.ts`, traduzione in `comicTranslate.ts`, Discord in
  `comicDiscord.ts` e avvisi in `comicNotify.ts`; etichette EN/IT/ES in `src/lib/comicLabels.ts`; componenti in
  `src/components/comics/` (`ComicEditor`, `ComicStrip`, `ComicActions`, `ComicCtaBox`, `AccountComics`, `UserComics`).
- **Database**: blocco `-- ===== 29/09/2026: FUMETTI =====` in fondo a `supabase/schema.sql` (dopo IMMAGINI).

## Regole

- **Chi pubblica**: Creator, Staff e admin (`COMIC_BADGES` e `canPublishComics` in `badges.ts`, `can_publish_comics`
  nel database: il test li confronta). Chi perde il ruolo ritrova i fumetti pubblicati fra le bozze (`set-badge.mjs`).
- **Tavole**: fino a 10, immagini verticali. Il browser le riduce dentro 1080 × 1920 (niente ingrandimenti), le
  ricodifica in WebP (JPEG se il browser non lo sa fare) togliendo i dati EXIF come la posizione, e le carica nel bucket
  `profile-media`, cartella `<id>/comic/`. File scelto fino a 20 MB, file caricato fino a 2 MB, almeno 100 × 100.
  L'ordine si cambia con le frecce; ogni tavola ha un campo di testo (fino a 1500 caratteri) per dialoghi, didascalie
  ed effetti sonori: è il testo alternativo dell'immagine, la trascrizione sotto le tavole e il testo che si traduce.
- **Copertina**: obbligatoria per pubblicare, 16:9 come le guide (l'ideale 1600 × 900, almeno 1200 × 675), ritagliata
  al centro nel browser. È l'immagine della news in home e in `/news`, l'anteprima dei link e l'immagine su Discord.
- **Testi**: titolo 3-110 caratteri su una riga, presentazione 40-300 (per pubblicare; una bozza si salva anche a metà),
  lingua dei testi fra le tre del sito. Testo semplice come le guide della community.
- **Tetti** (trigger `guard_community_comic`, contati su un registro che eliminare un fumetto non azzera,
  `community_comic_events`; lo staff e gli admin non li hanno): 500 fumetti per account, 10 nuovi e 3 prime
  pubblicazioni al giorno, 24 ore senza pubblicare dopo un fumetto nascosto dallo staff, 10 secondi fra due salvataggi
  dello stesso fumetto. File: la cartella dei fumetti ha un tetto suo, 300 file per utente, fuori da quello della
  vetrina (60 o 12).
- **File**: le immagini tolte o sostituite si cancellano dopo il salvataggio, quelle di un fumetto eliminato con il
  fumetto. Il bucket non lascia cancellare un file in uso (`profile_media_in_use` conosce anche tavole e copertine dei
  fumetti), e il trigger `community_comics_files` vuole che ogni tavola o copertina nuova esista davvero nel bucket.
- **Traduzione**: il sito traduce titolo, presentazione e testi delle tavole nelle altre due lingue (stesso modello,
  stessa chiave `ANTHROPIC_API_KEY` e stesso glossario delle guide; nomi di carte e luoghi in inglese; i balloon
  disegnati restano come sono). Una richiesta per lingua, dentro `after()`. La versione in una lingua non ancora
  tradotta è navigabile ma noindex, fuori da hreflang e sitemap, con la nota "I testi sono in <lingua>: la traduzione arriva fra qualche minuto".
- **Dati strutturati**: NewsArticle con l'autore uguale alla Person della sua pagina `/u` e le briciole
  News › Fumetti › titolo.

## Avvisi, Discord, analytics

- **Chi segue** l'autore (pacchetto SEGUI) riceve l'avviso "ha pubblicato un fumetto" alla prima pubblicazione
  (`notify_followers` con il tipo `comic_published`); il tasto Segui c'è anche nella pagina del fumetto.
- **Discord**: la prima pubblicazione va nel canale del webhook `DISCORD_WEBHOOK_COMICS` (Vercel, Production, solo
  server, poi un deploy). Il canale lo sceglie Pierluigi (per esempio `#announcements` o `#site-news`, come le news).
  Senza la variabile, nessun annuncio e nessun errore.
- **Analytics**: evento `comic_published` alla prima pubblicazione (parametro `comic_lang`); `follow`/`unfollow` con
  `placement` `comic_page`; `notification_open` con `kind` `comic_published`. In GA4 va registrata la dimensione
  `comic_lang`.

## Migrazione

1. `node scripts/db-migrate.mjs` da un checkout aggiornato, come sempre (il blocco sta nella seconda transazione). Si
   migra prima del deploy.
2. Prima della migrazione il sito regge: niente fumetti in home, in `/news` e nei profili, `/news/comics` vuota e
   noindex, e salvare dal modulo risponde "I fumetti non sono ancora disponibili" (tabella mancante: per 5 minuti non
   si chiede più, poi si riprova). Il messaggio nei log è "manca la tabella community_comics".
3. Verifiche (SQL Editor): `select count(*) from information_schema.tables where table_schema='public' and table_name in
   ('community_comics','community_comic_events');` → 2; `select tgname from pg_trigger where tgname in
   ('community_comics_guard','community_comics_files');` → due righe; `select with_check from pg_policies where
   policyname = 'profile media upload';` contiene `'comic'` (se no, il NOTICE "Policy del bucket profile-media non
   aggiornate da SQL": policy dalla dashboard con lo SQL del blocco).
4. Su Vercel: `DISCORD_WEBHOOK_COMICS` (facoltativa). `ANTHROPIC_API_KEY` c'è già.

## Prove dopo il deploy

Con l'account di Vega (o uno Creator): `/account#comics` → "Pubblica un fumetto"; caricare due o tre tavole e la
copertina, scrivere i testi, salvare come bozza, poi pubblicare. Controllare la pagina del fumetto, la home, `/news`,
`/news/comics`, il profilo `/u`, l'avviso a chi segue, il messaggio su Discord (con la variabile) e, dopo qualche
minuto, le versioni tradotte. Con un account community `/news/comics/new` spiega che serve il ruolo.
