import type { Locale } from "../i18n";

type L10n = Record<Locale, string>;

export type Event = {
  slug: string;
  official: boolean;
  start: string; // ISO date
  end?: string;
  title: L10n;
  where: L10n;
  format?: L10n;
  prizes?: L10n;
  text: L10n;
  signup?: { label: L10n; url: string };
  source?: string;
};

const n = (en: string, it: string, fr: string): L10n => ({ en, it, fr });

export const events: Event[] = [
  {
    slug: "next-fest-tournament",
    official: true,
    start: "2026-10-20",
    end: "2026-10-25",
    title: n("Steam Next Fest Tournament (Crimson Cup)", "Torneo dello Steam Next Fest (Crimson Cup)", "Tournoi du Steam Next Fest (Crimson Cup)"),
    where: n("Online, in game; brackets on the official Discord", "Online, in gioco; tabelloni sul Discord ufficiale", "En ligne, en jeu ; tableaux sur le Discord officiel"),
    format: n(
      "Qualifiers on 20, 21 and 22 October (one per major region, open to everyone), then playoffs and finals. Conquest format, test-run at Big Bob's Playtest Battle: several decks with different Legendary cards, one ban.",
      "Qualificazioni il 20, 21 e 22 ottobre (una per macro-regione, aperte a tutti), poi playoff e finali. Formato Conquest, provato a Big Bob's Playtest Battle: più mazzi con Leggendarie diverse, un ban.",
      "Qualifications les 20, 21 et 22 octobre (une par grande région, ouvertes à tous), puis playoffs et finales. Format Conquest, testé à Big Bob's Playtest Battle : plusieurs decks avec des Légendaires différentes, un ban.",
    ),
    prizes: n(
      "$10,000 prize pool: an exclusive 1/1 tournament promo card, digital packs, booster boxes and cases, cash prizes.",
      "Montepremi di 10.000 $: una carta promo 1/1 esclusiva del torneo, pacchetti digitali, booster box e case, premi in denaro.",
      "10 000 $ de dotation : une carte promo 1/1 exclusive, des packs numériques, des boîtes et des cases de boosters, des prix en argent.",
    ),
    text: n(
      "Koin Games' biggest event so far, run during Steam Next Fest. You can join any qualifier regardless of where you live, but the team asks you to sign up only for the ones you can actually attend. Content creators get wildcard invites straight into the playoffs.",
      "L'evento più grande di Koin Games finora, durante lo Steam Next Fest. Ci si può iscrivere a qualsiasi qualificazione a prescindere da dove si vive, ma il team chiede di iscriversi solo a quelle a cui si può davvero partecipare. I creator hanno inviti wildcard direttamente ai playoff.",
      "Le plus grand événement de Koin Games à ce jour, pendant le Steam Next Fest. On peut s'inscrire à n'importe quelle qualification, mais l'équipe demande de ne s'inscrire qu'à celles auxquelles on peut vraiment participer. Les créateurs reçoivent des invitations wildcard directement pour les playoffs.",
    ),
    signup: { label: n("Sign up on Discord", "Iscriviti su Discord", "S'inscrire sur Discord"), url: "https://discord.gg/originstcg" },
    source: "https://steamcommunity.com/app/4429430/allnews/",
  },
  {
    slug: "steam-next-fest",
    official: true,
    start: "2026-10-19",
    end: "2026-10-26",
    title: n("Steam Next Fest: Demo 2.0", "Steam Next Fest: Demo 2.0", "Steam Next Fest : Démo 2.0"),
    where: n("Steam", "Steam", "Steam"),
    text: n(
      "The big demo update tested in the August playtests goes public: five new decks, over 70 new cards and deckbuilding. The moment the ladder and the deckbuilder open to everyone is also the moment OriginsMeta's first tier list starts.",
      "Il grande aggiornamento della demo testato nei playtest di agosto diventa pubblico: cinque nuovi mazzi, oltre 70 nuove carte e il deckbuilding. Quando ladder e deckbuilder si aprono a tutti parte anche la prima tier list di OriginsMeta.",
      "La grande mise à jour de la démo testée en août devient publique : cinq nouveaux decks, plus de 70 nouvelles cartes et le deckbuilding. Quand le ladder et le deckbuilder s'ouvrent à tous, la première tier list d'OriginsMeta démarre.",
    ),
    signup: { label: n("Steam page", "Pagina Steam", "Page Steam"), url: "https://store.steampowered.com/app/4429430/Origins_TCG/" },
    source: "https://store.steampowered.com/sale/nextfest",
  },
  {
    slug: "big-bobs-playtest-battle",
    official: true,
    start: "2026-08-28",
    title: n("Big Bob's Playtest Battle", "Big Bob's Playtest Battle", "Big Bob's Playtest Battle"),
    where: n("Playtest build; brackets on Discord", "Build del playtest; tabelloni su Discord", "Build du playtest ; tableaux sur Discord"),
    format: n(
      "Best-of-3, single elimination. First ever use of the Conquest format: several decks, a different Legendary in each, at least nine cards of difference, one ban.",
      "Best-of-3, eliminazione diretta. Primo uso del formato Conquest: più mazzi, una Leggendaria diversa in ciascuno, almeno nove carte di differenza, un ban.",
      "Best-of-3, élimination directe. Première utilisation du format Conquest : plusieurs decks, une Légendaire différente dans chacun, au moins neuf cartes de différence, un ban.",
    ),
    prizes: n("Wildcard invite to the Next Fest tournament and Collector Packs.", "Invito wildcard al torneo del Next Fest e Collector Pack.", "Invitation wildcard au tournoi du Next Fest et Collector Packs."),
    text: n(
      "Over 130 players registered. Played on patch 0.6.3, released two days earlier.",
      "Oltre 130 iscritti. Giocato sulla patch 0.6.3, uscita due giorni prima.",
      "Plus de 130 inscrits. Joué sur le patch 0.6.3, sorti deux jours plus tôt.",
    ),
    source: "https://steamcommunity.com/app/4429430/allnews/",
  },
  {
    slug: "first-demo-tournament",
    official: true,
    start: "2026-07-24",
    title: n("First demo tournament", "Primo torneo della demo", "Premier tournoi de la démo"),
    where: n("Discord", "Discord", "Discord"),
    format: n("For fun, demo decks.", "Amichevole, mazzi della demo.", "Pour le plaisir, decks de la démo."),
    prizes: n("Wildcard invite to the Next Fest tournament and a secret prize.", "Invito wildcard al torneo del Next Fest e un premio segreto.", "Invitation wildcard au tournoi du Next Fest et un prix secret."),
    text: n(
      "Announced with the first demo stats: over 1,000 players and 13,000 matches in the first week, with a median play time of 1h51m.",
      "Annunciato insieme ai primi numeri della demo: oltre 1.000 giocatori e 13.000 partite nella prima settimana, con un tempo di gioco mediano di 1h51m.",
      "Annoncé avec les premiers chiffres de la démo : plus de 1 000 joueurs et 13 000 parties la première semaine, pour un temps de jeu médian de 1 h 51.",
    ),
    source: "https://steamcommunity.com/app/4429430/allnews/",
  },
  {
    slug: "card-party-fort-lauderdale",
    official: true,
    start: "2026-07-24",
    end: "2026-07-26",
    title: n("Card Party, Fort Lauderdale", "Card Party, Fort Lauderdale", "Card Party, Fort Lauderdale"),
    where: n("Card show, Florida (USA)", "Fiera del collezionismo, Florida (USA)", "Salon de cartes, Floride (États-Unis)"),
    text: n(
      "Part of the team took Origins to collectors, with the first public pack openings and a Slab giveaway for anyone pulling a 10/10 Alternate Art.",
      "Parte del team ha portato Origins ai collezionisti, con le prime aperture pubbliche di pacchetti e uno Slab in regalo a chi pescava un'Alternate Art 10/10.",
      "Une partie de l'équipe a présenté Origins aux collectionneurs, avec les premières ouvertures publiques de packs et un Slab offert à qui tirait une Alternate Art 10/10.",
    ),
    source: "https://steamcommunity.com/app/4429430/allnews/",
  },
];

export function upcomingEvents(today = new Date()): Event[] {
  const t = today.toISOString().slice(0, 10);
  return events.filter((e) => (e.end ?? e.start) >= t).sort((a, b) => a.start.localeCompare(b.start));
}

export function pastEvents(today = new Date()): Event[] {
  const t = today.toISOString().slice(0, 10);
  return events.filter((e) => (e.end ?? e.start) < t).sort((a, b) => b.start.localeCompare(a.start));
}
