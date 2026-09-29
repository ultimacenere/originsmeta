# Guide della community (pacchetto GUIDE, 27/09/2026)

Richiesta di Pierluigi del 27/09/2026 ("OK A TUTTO, OTTIMO!!" alle proposte per i profili): chi ha il ruolo **Autore,
Creator, Pro o Staff** (o è admin) pubblica le sue guide sul sito senza passare dallo staff. Gli altri continuano con
"Mandaci la tua guida" (`/guides/submit`, canale privato dello staff).

## Dove sta cosa

| Cosa | Dove |
| --- | --- |
| Regole pure (limiti, testo semplice, modulo, parole e soglia, lingue, elenchi leggeri, sitemap, piano della traduzione) | `src/lib/community/guides.ts` + `guides.test.ts` |
| Letture (pagina, /guides, /guides/community, /u, /account, sitemap) | `src/lib/community/guideQueries.ts` |
| /guides: un elenco solo con le guide della redazione (29/09/2026), in ISR | `src/app/[locale]/(site)/guides/page.tsx` |
| Copertina caricata (29/09/2026): caricamento dal browser, regole, trigger | `CommunityGuideEditor.tsx` + `src/components/showcase/mediaUpload.ts`, `coverPathOk` e `communityGuideCover` in `guides.ts`, blocco IMMAGINI di `supabase/schema.sql` |
| Server Action (salva, stato, elimina, segnala) | `src/lib/community/guideActions.ts` |
| Traduzione automatica | `guideTranslateCore.ts` (a pezzi, puro, usato anche dallo script), `guideTranslate.ts` (dentro `after()`); parti generali in `deckTranslation.ts` |
| Arretrati e nuovi tentativi delle traduzioni | `scripts/translate-guides.mjs` |
| Annuncio su Discord, segnalazioni allo staff, avvisi a chi segue l'autore (SEGUI) | `guideNotify.ts`, messaggi puri in `guideDiscord.ts` |
| Testi EN/IT/ES | `src/lib/communityGuideLabels.ts` |
| Dati strutturati | `src/lib/jsonld/communityGuide.ts` (Article, autore = Person del membro, parte di /guides/community) |
| Componenti | `src/components/guides/` (modulo, copertina, schede, comandi, segnalazione, riquadro di /guides) |
| Pagine | `/guides/new`, `/guides` e `/guides/community` (elenchi, `revalidate = 300` ma in pratica 60 s: vince la lettura di `supabasePublic`), `/guides/community/[slug]` (ISR 60 s), `/guides/community/[slug]/edit` |
| Database | blocco `-- ===== 27/09/2026: GUIDE =====` in fondo a `supabase/schema.sql`; copertine caricate nel blocco `-- ===== 29/09/2026: IMMAGINI =====` |

## Un elenco solo (29/09/2026)

Pierluigi, 29/09/2026: "essendo autorizzata e pochi altri a farlo, le guide non devono avere distinzioni tra guide
ufficiali e guide della community, quindi rimuovi la divisione nella pagina e mi aspetto che la guida di Vega venga vista
come ultima pubblicata". Da quel giorno `/guides` mostra nella stessa griglia, con la stessa scheda e la firma, le guide
della redazione (`content/guides.ts`) e le guide della community indicizzabili nella lingua della pagina (le stesse di
`/guides/community` e della sitemap: `guidesIndexableIn`), dalla più recente per data di prima pubblicazione. La pagina
è in ISR (`revalidate = 300`), come `/decks`: le guide della community sono nell'HTML, nella CollectionPage e nel
lastmod di /guides (`communityGuides.hub`). Non c'è più la sezione caricata dal browser (`/api/community-guides` e
`CommunityGuidesHub` tolti). Anche la pagina di una guida della community non si presenta più come "Guida della
community" (kicker e briciole come le altre guide); gli indirizzi restano `/guides/community/<slug>`.

## Regole

- **Permesso**: `canPublishGuides` in `badges.ts` e `can_publish_guides(uid)` nel database dicono la stessa cosa (lo
  controllano `badges.test.ts`, già in `npm test`, e `guides.test.ts`). Insert e update passano solo con quella
  funzione vera; lo staff aggiorna anche le guide altrui (per nasconderle o correggerle).
- **Testo semplice**, mai Markdown né HTML: titolo 10-110 caratteri su una riga (si traduce dal 29/09/2026, vedi
  "Traduzioni"), riassunto 120-300, da 1 a 12 sezioni con titolo (fino a 80) e testo (fino a 4000). Una bozza si salva anche
  a metà. I nomi delle carte diventano link da soli (`CardMentions`). Niente caratteri di controllo, segni di
  direzione, invisibili e riempitivi (Hangul U+3164 e simili, Braille vuoto: un titolo fatto solo di quelli sembra
  vuoto); al massimo una riga vuota di fila, anche se "vuota" di spazi Unicode. Le stesse regole nel codice
  (`cleanPlain`, `plainTextOk`) e nel database (`community_guide_text_ok`): il test confronta le liste.
- **Stati**: `draft` (solo l'autore e lo staff), `published`, `hidden` (moderazione: solo lo staff lo mette e lo toglie;
  lo staff può correggere una guida nascosta, che resta nascosta; l'autore può solo eliminarla). `published_at` lo
  scrive il database alla prima pubblicazione.
- **Tetti** (trigger `guard_community_guide`, lo staff no): 100 guide per account; 10 guide nuove e 3 prime
  pubblicazioni al giorno, contate sul registro `community_guide_events`, che nessuno legge né cancella via API
  (eliminare e ricreare una guida non azzera nulla, quindi niente raffiche di annunci, traduzioni e ping). Dopo che lo
  staff ha nascosto una guida, il proprietario per 24 ore non pubblica altro (una guida nascosta non torna online
  eliminandola e ripubblicandola identica).
- **Segnalazioni**: una per utente e per guida, 5 al giorno, mai sulla propria guida (policy), solo sulle guide
  pubblicate. Lo staff riceve un avviso su Discord solo alla prima segnalazione di una guida nelle 24 ore
  (`first_in_day`, scritta dal trigger); le altre si leggono nella tabella `community_guide_reports`. Si cancellano con
  l'account di chi le ha fatte.
- **SEO**: sotto 300 parole (`COMMUNITY_GUIDE_MIN_WORDS`) la guida è noindex in tutte le lingue e fuori da hreflang e
  sitemap; la versione in una lingua non ancora tradotta è noindex. Gli elenchi (/guides, /guides/community, sitemap)
  leggono colonne leggere (`words` e `text_hash`, scritte dal sito con il testo, più impronta, data e riassunto di ogni
  traduzione) e decidono con `guideShapeIndexing`, che dà la stessa risposta della pagina (`communityGuideIndexing`). Se
  il testo cambia fuori dal sito senza nuova impronta, il trigger azzera parole e impronta e la guida esce dagli elenchi
  finché l'autore non la risalva. Sitemap: sezione `guides`, con la data di ogni versione (anche l'arrivo della
  traduzione) e la copertina; /guides e /guides/community cambiano data, lingua per lingua, solo con le guide che mostrano.
- **Copertina**: un'immagine del media kit ufficiale (`GUIDE_COVERS`, quindici fra keyart e immagini della pagina Steam,
  le stesse offerte ai tornei), mostrata intera in 16:9 e senza nulla sopra (i crediti impressi restano visibili):
  og:image, immagine del JSON-LD, immagine della sitemap e dell'annuncio su Discord. Regola di CLAUDE.md: le copertine di
  news e guide dal media kit sono contenuto. **Dal 29/09/2026 anche un'immagine propria** (Vega non riusciva a cambiarla;
  Pierluigi: "aggiungiamo questa funzione, sempre dando le misure richieste per la copertina"): 16:9, almeno 1200 × 675
  (l'ideale 1600 × 900), PNG, JPG o WebP fino a 2 MB (`GUIDE_COVER_SIZE`, `GUIDE_COVER_MIN`, `GUIDE_COVER_MAX_BYTES`). Il
  browser la ritaglia al centro in 16:9, la riduce a 1600 px e la ricodifica in WebP senza EXIF (`encodeImage` con
  `aspect`), poi la carica nel bucket `profile-media`, cartella `<id>/guide/` del proprietario (mai attraverso le Server
  Action); la guida salva il percorso in `cover_path`. La carica solo il proprietario (lo staff che corregge una guida
  altrui può tornare a una copertina del media kit). Si mostra nella pagina, negli elenchi, nell'og:image, nel JSON-LD e
  nell'annuncio su Discord (solo indirizzi del nostro Storage, cartella `guide`); la sitemap la salta (altro dominio). La
  copertina sostituita si cancella dopo il salvataggio, quella di una guida eliminata con la guida; i file rimasti li
  toglie `node scripts/clear-profile-media.mjs --orphans`, e lo staff toglie le copertine caricate di un utente con
  `--guide-covers`.
- **Video e risorse**: le regole dei mazzi (fino a 3 video YouTube/Twitch col lettore a clic, fino a 5 link su host ammessi).
- **Traduzioni**: stesso modello, stessa chiave e stesso glossario delle guide dei mazzi; i nomi di carte e luoghi non si
  traducono. **Il titolo si traduce dal 29/09/2026** (Pierluigi, sulla guida di Vega: "non è tradotto il titolo"; prima
  restava nella lingua dell'autore, come il nome di un mazzo): viaggia nel campo `title` del primo pezzo e la traduzione
  salvata lo tiene in `guide.title` con l'impronta del titolo da cui è fatto, `title_hash` (`guideTitleHash`), separata
  da quella del testo (`communityGuideHash`, che resta riassunto e sezioni). Così le traduzioni fatte prima restano
  valide e si completano con una richiesta piccola, per il titolo solo, e un titolo corretto non rende vecchi riassunto
  e sezioni. H1, title della pagina, dati strutturati, briciole, schede degli elenchi (colonne leggere `tr_<lingua>_title`
  e `tr_<lingua>_title_hash`) mostrano il titolo tradotto quando è aggiornato (`localizedGuideTitle`,
  `guideShapeTitle`), altrimenti quello dell'autore con la sua lingua; l'indicizzazione dipende solo da riassunto e
  sezioni, come prima. Database: blocco `-- ===== 29/09/2026: TITOLI TRADOTTI =====` (le due chiavi facoltative, ma
  sempre insieme). Una guida arriva a circa 49 mila caratteri, quindi si traduce a pezzi di 8000 caratteri (una
  richiesta per pezzo, `max_tokens` dalla lunghezza, quattro richieste alla volta) e si riusano le parti già tradotte e
  rimaste uguali (impronte `parts`): una correzione ritraduce solo la sezione toccata. Le pagine di scrittura hanno
  `maxDuration = 300`. Le traduzioni si scrivono con la sessione del proprietario; il trigger le ricontrolla (lingua
  diversa dall'originale, testo semplice con massimi 2,5 volte l'originale più 200, stesse sezioni) per tutti.

## Variabili d'ambiente (Vercel, solo server)

- `DISCORD_WEBHOOK_GUIDES`: la prima pubblicazione di una guida va nel canale `#guides` del nostro Discord, con la
  copertina e il solo link alla versione originale (le altre lingue arrivano qualche minuto dopo). È lo stesso nome del
  secret GitHub che la GitHub Action usa per le guide editoriali: su Vercel va messo lo stesso valore. Senza, nessun
  annuncio.
- `ANTHROPIC_API_KEY` (c'è già): traduzione automatica. Senza, le guide restano nella lingua dell'autore.
- `DISCORD_FEEDBACK_WEBHOOK_URL` (c'è già): le segnalazioni arrivano nel canale privato dello staff.

## Migrazione

1. Il blocco sta in fondo a `supabase/schema.sql`, sotto `-- ===== 27/09/2026: GUIDE =====` (accodato all'integrazione del 27/09/2026; il file `supabase/wave2-GUIDE.sql` non c'è più).
2. Pierluigi lancia `node scripts/db-migrate.mjs` come sempre (lo schema è idempotente).
3. Prima della migrazione il sito regge: /guides con le sole guide della redazione, /guides/community vuota e noindex,
   /guides/new e /account non mostrano le guide, le pagine delle guide rispondono 404 (tabella o colonna mancante: stato
   "non ancora disponibile" per 5 minuti, poi si riprova).
4. Copertine caricate (29/09/2026): blocco `-- ===== 29/09/2026: IMMAGINI =====`, in fondo al file, con la stessa
   migrazione. Prima, il bucket rifiuta i file della cartella `guide` e il modulo dice che il caricamento non è riuscito;
   le copertine del media kit funzionano come sempre.
5. Titoli tradotti (29/09/2026): blocco `-- ===== 29/09/2026: TITOLI TRADOTTI =====`, in fondo al file. Si migra prima
   del deploy: il codice nuovo con il database di prima vede rifiutate (e lasciate perdere, senza errori per chi scrive)
   le traduzioni con il titolo; il codice di prima con il database nuovo funziona come sempre. Dopo il deploy le guide
   già pubblicate prendono il titolo tradotto al primo salvataggio (dell'autore o dello staff, anche senza cambiare
   nulla: la traduzione parte a ogni salvataggio di una guida pubblicata) o con `node scripts/translate-guides.mjs`.

## Traduzioni non riuscite

`node scripts/translate-guides.mjs --dry-run` elenca le guide pubblicate con lingue mancanti (anche solo il titolo) e
quanto testo va tradotto; senza opzioni traduce (serve `ANTHROPIC_API_KEY`, che oggi sta solo su Vercel: va passata come
variabile d'ambiente) e salva, solo se il testo non è cambiato nel frattempo. `--only <slug>`
per una guida, `--redo it,es` per rifare da capo le traduzioni valide dopo un cambio del prompt.

## Moderazione

Lo staff (admin o tag Staff), con l'accesso fatto, trova "Nascondi (staff)" sulla pagina della guida e "Rimetti online
(staff)" nella pagina di modifica, dove può anche correggere il testo. Le segnalazioni arrivano sul canale privato dello
staff con il link alla guida (la prima di ogni giornata) e si leggono nella tabella `community_guide_reports` (dashboard
di Supabase). Se un autore insiste, lo staff gli toglie il ruolo (`node scripts/set-badge.mjs <utente> community`): dal 27/09/2026 lo script riporta anche tra le bozze le sue guide pubblicate (le nascoste restano nascoste), che escono da pagine, elenchi e sitemap entro qualche minuto.

Altre difese (revisione del 27/09/2026): fra due modifiche della stessa guida (salvataggio o cambio di stato) passano almeno 10 secondi per il proprietario (`tooFast`, lo staff no); una modifica che non cambia nulla non rigenera pagine né sitemap; IndexNow parte solo alla prima pubblicazione o quando cambia il testo; `words` mandato via API sopra il massimo possibile per quel testo si azzera (trigger `community_guides_words`, blocco `DATE E FOTO` di `supabase/schema.sql`), e la guida esce dagli elenchi indicizzati finché il sito non la risalva. Resta scritta dal sito anche `text_hash`: un'impronta falsa può al più mettere in sitemap una traduzione vecchia che la pagina dichiara noindex.

## Collegamenti con gli altri pacchetti (integrazione del 27/09/2026)

- **SEGUI**: alla prima pubblicazione `notifyGuideFollowers` (`guideNotify.ts`) chiama `notifyFollowers` di
  `notify.ts` con il PROPRIETARIO della guida (anche quando agisce lo staff), il tipo `guide_published`, lo slug e il
  client della Server Action: chi segue l'autore riceve l'avviso in `/account/messages#notifications`, con il link
  `/guides/community/<slug>`. Decide il database (`notify_followers`: guida pubblicata e sua, sessione dell'autore o
  dello staff). Il tasto "Segui" sta nella pagina della guida, accanto al nome dell'autore (`FollowButton` compatto,
  evento `follow` con `placement = guide_page`).
- **VETRINA**: la copertina caricata è collegata dal 29/09/2026 (`GUIDE_COVER_BUCKET` = `profile-media`). Il blocco
  IMMAGINI di `supabase/schema.sql` rifà le policy del bucket (cartelle `guide` per chi pubblica guide e `deck` per
  l'artwork dei mazzi di Creator e Staff, tetto di 60 file per i ruoli con vetrina, mai cancellato un file in uso:
  `profile_media_in_use`), aggiunge il trigger `guard_community_guide_cover` (cartella `<owner>/guide/` e file che c'è) e
  `scripts/clear-profile-media.mjs --orphans` conta le copertine delle guide come in uso. Test in
  `src/lib/community/deckArt.test.ts`.
- **Test**: `src/lib/community/guides.test.ts`, `src/lib/community/deckArt.test.ts` e `src/lib/sitemapGuides.test.ts`
  sono in `npm test`.
