/**
 * Il Kickstarter della Alpha Edition di Origins TCG (campagna di Koin Games, apre il 27/10/2026) e il link referral di
 * OriginsMeta. Dalla call con Tim Jooste del 26/10/2026: OriginsMeta entra nel programma "digital LGS" di Koin e i pledge
 * che arrivano dal nostro link `?ref=` gli vengono riconosciuti (Pierluigi: "questo è il nostro referral code"). Tim ha
 * suggerito una pagina dedicata e la home per il giorno del lancio: la landing è /kickstarter, la home ha la prima slide
 * (ferma, `kickstarterSliderPinned`) con la barra subito sotto, e le altre pagine la barra in cima (`KickstarterBar`).
 *
 * Regole: il link referral si dichiara sempre accanto al tasto (`disclosure` delle etichette: OriginsMeta riceve una
 * commissione, il prezzo per chi sostiene non cambia), la dicitura "non affiliato a Koin Games" resta, niente urgenza né
 * scarsità che Koin non abbia scritto. I dati sotto vengono dalle pagine ufficiali e hanno la data della lettura.
 */

/** Il nostro codice referral di Kickstarter (Pierluigi, 26/10/2026). */
export const KICKSTARTER_REF = "8h9kwh";

/** La pagina della campagna senza codice: per le fonti e per chi è VIP (il suo link con lo sconto è un altro). */
export const KICKSTARTER_PROJECT_URL = "https://www.kickstarter.com/projects/koingames/origins-trading-card-game-alpha-edition";

/** Il link di tutti i tasti del sito: unico punto in cui sta il codice referral. */
export const KICKSTARTER_URL = `${KICKSTARTER_PROJECT_URL}?ref=${KICKSTARTER_REF}`;

/** La pagina ufficiale della preregistrazione VIP (1 dollaro rimborsabile, 15% di sconto con il link VIP). */
export const KICKSTARTER_VIP_URL = "https://founder.origins-tcg.com";

/** Giorno di apertura della campagna: lo ha scritto il CEO di Koin Games il 17/09/2026 e lo mostra il menu della demo. */
export const KICKSTARTER_LAUNCH_DAY = "2026-10-27";

/**
 * Da quando il tasto dice "Scegli la tua ricompensa Alpha su Kickstarter" (Pierluigi, 26/10/2026, al posto di "Sostienila") invece di "Avvisami su Kickstarter": la mezzanotte del 27 ottobre
 * sulla costa est (Koin Games sta a Tampa, in Florida), le 6:00 in Italia. L'ora vera del lancio Koin non l'ha detta:
 * quando la dice, va scritta qui. La landing è in ISR, quindi l'etichetta cambia da sola entro 5 minuti.
 */
export const KICKSTARTER_LIVE_FROM = "2026-10-27T00:00:00-04:00";

/** La campagna è (presumibilmente) aperta: decide l'etichetta del tasto. */
export function kickstarterLive(now: Date, from: string = KICKSTARTER_LIVE_FROM): boolean {
  return now.getTime() >= Date.parse(from);
}

/**
 * Fino a quando la home e la barra in cima al sito spingono il Kickstarter (fine esclusa, ISO con fuso). `null` = finché
 * non si toglie a mano: la data di chiusura della campagna Koin non l'ha ancora detta. Quando la dice, va scritta qui.
 */
export const KICKSTARTER_PROMO_UNTIL: string | null = null;

/** La promozione è attiva in quel momento (funzione pura: la home è in ISR, la barra la calcola nel browser). */
export function kickstarterPromoActive(now: Date, until: string | null = KICKSTARTER_PROMO_UNTIL): boolean {
  if (!until) return true;
  const end = Date.parse(until);
  return Number.isNaN(end) || now.getTime() < end;
}

/**
 * Fino a quando lo slider della home resta fermo sulla slide del Kickstarter, senza rotazione automatica (Pierluigi,
 * 27/10/2026: "per questi giorni lo slider deve restare fisso sulla slide dell'alfa"); frecce, puntini e il tasto play
 * restano a chi guarda. `null` = finché non si toglie a mano, e comunque mai oltre la promozione.
 */
export const KICKSTARTER_SLIDER_PINNED_UNTIL: string | null = null;

/** Lo slider della home sta fermo sulla slide del Kickstarter (funzione pura, come `kickstarterPromoActive`). */
export function kickstarterSliderPinned(now: Date, until: string | null = KICKSTARTER_SLIDER_PINNED_UNTIL, promoUntil: string | null = KICKSTARTER_PROMO_UNTIL): boolean {
  return kickstarterPromoActive(now, promoUntil) && kickstarterPromoActive(now, until);
}

/**
 * Probabilità di ogni rarità nei pacchetti della Alpha Edition, come le pubblica la pagina VIP ufficiale
 * (founder.origins-tcg.com, letta il 26/10/2026). `every` = in ogni pacchetto, altrimenti 1 pacchetto su `n`.
 * La grafica del media kit "What's in a collector pack" ha numeri più vecchi e diversi: sulla landing non si usa.
 */
export const PULL_RATES: readonly { tier: string; every?: true; n?: number }[] = [
  { tier: "Common", every: true },
  { tier: "Rare", every: true },
  { tier: "Epic", n: 2 },
  { tier: "Legendary", n: 8 },
  { tier: "Alternate Art", n: 11 },
  { tier: "Alternate Art+", n: 28 },
  { tier: "Alternate Art Spell", n: 50 },
  { tier: "Secret Alt Art", n: 150 },
  { tier: "Special Alt Art", n: 450 },
  { tier: "Storybook", n: 1200 },
];

/** "Chance to pull any AA = 1/6" della stessa pagina: una Alternate Art di qualsiasi tipo ogni 6 pacchetti. */
export const ANY_ALT_ART_ONE_IN = 6;

/** Giorno in cui sono state lette la pagina VIP e la pagina Steam della demo. */
export const KICKSTARTER_FACTS_READ = "2026-10-26";

/** Recensioni della demo su Steam lette il 26/10/2026: "Molto positive", 92% di 263. */
export const DEMO_REVIEWS = { percent: 92, total: 263 } as const;
