# Guide della community (pacchetto GUIDE, 27/09/2026)

Richiesta di Pierluigi del 27/09/2026 ("OK A TUTTO, OTTIMO!!" alle proposte per i profili): chi ha il ruolo **Autore,
Creator, Pro o Staff** (o è admin) pubblica le sue guide sul sito senza passare dallo staff. Gli altri continuano con
"Mandaci la tua guida" (`/guides/submit`, canale privato dello staff).

## Dove sta cosa

| Cosa | Dove |
| --- | --- |
| Regole pure (limiti, pulizia del testo, modulo, parole e soglia, lingue, sitemap) | `src/lib/community/guides.ts` + `guides.test.ts` |
| Letture (pagina, /guides, /u, /account, sitemap) | `src/lib/community/guideQueries.ts` |
| Server Action (salva, stato, elimina, segnala) | `src/lib/community/guideActions.ts` |
| Traduzione automatica | `src/lib/community/guideTranslate.ts` (parti generali in `deckTranslation.ts`) |
| Annuncio su Discord, segnalazioni allo staff, aggancio per SEGUI | `guideNotify.ts`, messaggi puri in `guideDiscord.ts` |
| Testi EN/IT/ES | `src/lib/communityGuideLabels.ts` |
| Dati strutturati | `src/lib/jsonld/communityGuide.ts` (Article, autore = Person del membro) |
| Componenti | `src/components/guides/` (modulo, copertina, schede, comandi, segnalazione, riquadro di /guides) |
| Pagine | `/guides/new`, `/guides/community/[slug]` (ISR 60 s), `/guides/community/[slug]/edit` |
| Database | `supabase/wave2-GUIDE.sql` (da accodare in fondo a `schema.sql`) |

## Regole

- **Permesso**: `canPublishGuides` in `badges.ts` e `can_publish_guides(uid)` nel database dicono la stessa cosa (lo
  controlla `guides.test.ts`). Insert e update passano solo con quella funzione vera; lo staff aggiorna anche le guide
  altrui (per nasconderle).
- **Testo semplice**, mai Markdown né HTML: titolo 10-110 caratteri su una riga (non si traduce, come il nome di un
  mazzo), riassunto 120-300, da 1 a 12 sezioni con titolo (fino a 80) e testo (fino a 4000). Una bozza si salva anche
  a metà. I nomi delle carte diventano link da soli (`CardMentions`).
- **Stati**: `draft` (solo l'autore e lo staff), `published`, `hidden` (moderazione: solo lo staff lo mette e lo toglie;
  l'autore può solo eliminarla). `published_at` lo scrive il database alla prima pubblicazione.
- **Tetti** (trigger `guard_community_guide`, lo staff no): 100 guide per account, 10 nuove al giorno, 3 prime
  pubblicazioni al giorno. Segnalazioni: una per utente e per guida, 20 al giorno.
- **SEO**: sotto 300 parole (`COMMUNITY_GUIDE_MIN_WORDS`) la guida è noindex in tutte le lingue e fuori da hreflang e
  sitemap; la versione in una lingua non ancora tradotta è noindex. Sitemap: sezione `guides`, accanto alle editoriali.
- **Copertina**: un disegno del sito (sei gradienti con motivi SVG, `GuideCover`), mai materiale Koin. La colonna
  `cover_path` (immagine caricata) è pronta nel database ma il sito la usa solo quando `GUIDE_COVER_BUCKET` in
  `guides.ts` avrà il nome del bucket del pacchetto VETRINA.
- **Video e risorse**: le regole dei mazzi (fino a 3 video YouTube/Twitch col lettore a clic, fino a 5 link su host ammessi).

## Variabili d'ambiente (Vercel, solo server)

- `DISCORD_WEBHOOK_GUIDES`: la prima pubblicazione di una guida va nel canale `#guides` del nostro Discord. È lo stesso
  nome del secret GitHub che la GitHub Action usa per le guide editoriali: su Vercel va messo lo stesso valore. Senza,
  nessun annuncio.
- `ANTHROPIC_API_KEY` (c'è già): traduzione automatica. Senza, le guide restano nella lingua dell'autore.
- `DISCORD_FEEDBACK_WEBHOOK_URL` (c'è già): le segnalazioni arrivano nel canale privato dello staff.

## Migrazione

1. L'integratore accoda `supabase/wave2-GUIDE.sql` in fondo a `supabase/schema.sql` (sotto `-- ===== 27/09/2026: GUIDE =====`).
2. Pierluigi lancia `node scripts/db-migrate.mjs` come sempre (lo schema è idempotente).
3. Prima della migrazione il sito regge: niente sezione in /guides, /guides/new e /account non mostrano le guide,
   le pagine delle guide rispondono 404 (tabella mancante: stato "non ancora disponibile" per 5 minuti, poi si riprova).

## Moderazione

Lo staff (admin o tag Staff), con l'accesso fatto, trova "Nascondi (staff)" sulla pagina della guida e "Rimetti online
(staff)" nella pagina di modifica. Le segnalazioni arrivano sul canale privato dello staff con il link alla guida e si
leggono nella tabella `community_guide_reports` (dashboard di Supabase).
