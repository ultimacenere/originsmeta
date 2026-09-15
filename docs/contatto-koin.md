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
