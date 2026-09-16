# Contatto con Koin Games: API e autorizzazione immagini

Dalle note per sito 5.0 (15/09/2026): prima su Discord, poi via mail ufficiale. Da creare su Register.it due
caselle dedicate (una per ciascun admin), così la comunicazione formale non passa da indirizzi personali:
`pierluigi@originsmeta.com` e `luigi@originsmeta.com`, con `staff@originsmeta.com` in copia.

Referente indicata nelle note precedenti: Monique Higgins, Head of Creator Partnerships (social@koingames.io /
admin@koingames.io). Sul Discord ufficiale (discord.gg/originstcg) scrivere nel canale creator o in DM allo staff.

## Messaggio Discord (breve, in inglese)

> Hi! I'm Pierluigi from OriginsMeta.com, an independent fan site for Origins TCG in English and Italian:
> card database, deck builder with the in-game deck codes, community decks with guides and ratings, tier list
> and news. Two quick questions before Next Fest: (1) is there an official way to use card art on a fan site
> (we currently show placeholders and link to Steam), and (2) do you plan any public API or data export for
> cards and match stats? Happy to add any attribution or "not affiliated" wording you prefer. Who's the best
> person to email officially? Thanks!

## Email (formale, in inglese)

Oggetto: OriginsMeta.com — request for card art authorization and API access

> Dear Koin Games team,
>
> I'm Pierluigi Cella, co-founder of OriginsMeta.com, an independent, non-affiliated community site for Origins
> TCG in English and Italian. The site already offers a complete card database, a deck builder compatible with
> the in-game deck codes, community decks with guides and ratings, a patch tracker and a tournament calendar.
>
> We would like to ask for two things:
>
> 1. Permission to display official card illustrations on card and deck pages, with the credit line
>    "Card art © Koin Games" and the "not affiliated with Koin Games" notice we already show on every page.
>    If you have a press or creator kit with the artwork, we will use only those files.
> 2. Whether an official API or periodic data export (card data, match and deck statistics) is planned or
>    available for community sites. We would use it to publish win rates and keep the database in sync with
>    every patch, always naming Koin Games as the source.
>
> We are also interested in the Creator Program, if fan sites are eligible.
>
> Thank you for your time, and congratulations on the Demo 2.0 reception.
>
> Pierluigi Cella and Luigi Ragoni
> OriginsMeta.com · staff@originsmeta.com

## Dopo la risposta

- Immagini: salvarle in `public/cards/<slug>.webp` e impostare `image` sulla carta (vedi README).
- API: il riquadro "win rate" nelle schede mazzo è già predisposto (`DeckCharts`); campi minimi attesi:
  games, wins, avg_duration, period, rank_bucket, opponent_legendary; per carta: drawn e mulligan.

## Chi contattare per le API (ricerca del 16/09/2026)

Dall'organigramma ufficiale su koingames.io/team (unico indirizzo pubblico: social@koingames.io; il sito avverte che
le comunicazioni vere arrivano solo da indirizzi @koingames.io). Sul sito e su origins-tcg.com non esistono
email press/partner/developer né un programma API per terzi: la richiesta va fatta alle persone giuste.

Ordine consigliato:

1. **Alex Horvath**, Director of Marketing & Partnerships (business development e partnership): il primo
   destinatario "politico" della richiesta, insieme a Monique Higgins. LinkedIn: cercare "Alex Horvath Koin Games"
   (il profilo linkedin.com/in/alexanderhorvath appartiene a un omonimo di Centric Consulting: verificare).
2. **Brian Goble**, co-fondatore e CTO: decide sulle API. LinkedIn: https://www.linkedin.com/in/briangoble/
3. **Marco Williams**, Technical Director (full stack, 20+ anni): https://www.linkedin.com/in/marco-williams-4082b919/
4. **John Malan**, Backend Engineer (architetta i sistemi backend ed economie di gioco): https://koingames.io/team/john-malan
5. **Kevin Lukic**, Architect Engineer: https://www.linkedin.com/in/klukic/
6. **Geoff Harrison**, Principal Product Manager: https://www.linkedin.com/in/harrisongeoff
7. **Janne "Apix"**, Head of Community: sul Discord ufficiale discord.gg/originstcg (DM o canale creator).
8. **Kevin Lambert**, co-fondatore e Chief Product Officer: https://www.linkedin.com/in/klambert/
9. **Tim Jooste**, fondatore e CEO (molto attivo su X @TimothyJooste): https://www.linkedin.com/in/timothy-jooste-8594a491/

Altri riferimenti: pagina LinkedIn dell'azienda https://www.linkedin.com/company/koin-games/ ; X @koingamesio e
@origins_tcg ; forum Steam dove risponde lo sviluppatore "Fenchurch" (identità non pubblica). Il Discord
"Koin Games Dev Squad" (discord.gg/KGDS) è la vecchia community NFT del 2022, non un canale per sviluppatori: non usarlo.
Nessuna persona di nome "Carol" compare nell'organigramma pubblico.
