import type { Change } from "./cards";

/**
 * Storico dei bilanciamenti per slug, trascritto dalle patch notes ufficiali del playtest su Steam (0.6.1, 0.6.2, 0.6.3).
 * Le carte assenti non hanno modifiche note. `scripts/import-woo.mjs` confronta questi from/to con le statistiche
 * per patch di World of Origins e segnala le discrepanze.
 */
export const cardHistory: Record<string, Change[]> = {
  mulan: [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 4, power: 2, health: 4 },
      to: { mana: 4, power: 2, health: 4 },
      note: { en: "Stats unchanged; gains Double Attack on top of repeating allies' On Reveal abilities.", it: "Statistiche invariate; ottiene Doppio Attacco oltre a ripetere le On Reveal degli alleati.", es: "Estadísticas sin cambios; obtiene Double Attack además de repetir las habilidades On Reveal de los aliados.", fr: "Statistiques inchangées ; gagne Double Attaque en plus de répéter les On Reveal des alliés." },
    },
  ],
  "queen-of-hearts": [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 5, power: 3, health: 5 },
      to: { mana: 4, power: 3, health: 3 },
      note: { en: "Cheaper and smaller; gains First Strike on top of repeating allies' On Death abilities.", it: "Più economica e più piccola; ottiene Primo Colpo oltre a ripetere le On Death degli alleati.", es: "Más barata y más pequeña; obtiene First Strike además de repetir las habilidades On Death de los aliados.", fr: "Moins chère et plus petite ; gagne Initiative en plus de répéter les On Death des alliés." },
    },
  ],
  "king-arthur": [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 7, power: 5, health: 5 },
      to: { mana: 7, power: 7, health: 7 },
      note: { en: "+2/+2, the biggest single buff of the playtest.", it: "+2/+2, il buff singolo più grande del playtest.", es: "+2/+2, el mayor buff individual del playtest.", fr: "+2/+2, le plus gros buff du playtest." },
    },
  ],
  lancelot: [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 4, power: 3, health: 3 },
      to: { mana: 4, power: 4, health: 4 },
      note: { en: "+1/+1.", it: "+1/+1.", es: "+1/+1.", fr: "+1/+1." },
    },
  ],
  merlin: [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 5, power: 3, health: 5 },
      to: { mana: 5, power: 5, health: 5 },
      note: { en: "+2 Power.", it: "+2 Potenza.", es: "+2 de Poder.", fr: "+2 Puissance." },
    },
  ],
  "merlins-prophecy": [
    {
      patch: "0.6.3",
      kind: "nerf",
      from: { mana: 1 },
      to: { mana: 2 },
      note: { en: "Costs 1 more.", it: "Costa 1 in più.", es: "Cuesta 1 más.", fr: "Coûte 1 de plus." },
    },
  ],
  bagheera: [
    {
      patch: "0.6.3",
      kind: "rework",
      from: { mana: 1, power: 1, health: 2 },
      to: { mana: 1, power: 1, health: 1 },
      note: { en: "Loses 1 Health; On Reveal bonus on a middle space rises from +1/+1 to +2/+2.", it: "Perde 1 Salute; il bonus On Reveal su spazio centrale sale da +1/+1 a +2/+2.", es: "Pierde 1 de Salud; la bonificación de su On Reveal en una casilla central sube de +1/+1 a +2/+2.", fr: "Perd 1 Vie ; le bonus On Reveal sur case centrale passe de +1/+1 à +2/+2." },
    },
  ],
  mowgli: [
    {
      patch: "0.6.1",
      kind: "deck",
      note: { en: "Added to the Swarm deck in place of First Aid to strengthen the late game.", it: "Aggiunto al mazzo Swarm al posto di First Aid per rafforzare il finale di partita.", es: "Añadido al mazo Swarm en lugar de First Aid para reforzar el final de la partida.", fr: "Ajouté au deck Swarm à la place de First Aid pour renforcer la fin de partie." },
    },
  ],
  bandersnatch: [
    {
      patch: "0.6.1",
      kind: "deck",
      note: { en: "Added to the Evil deck while Count Orlok is out.", it: "Aggiunto al mazzo Evil mentre il Conte Orlok è fuori.", es: "Añadido al mazo Evil mientras Count Orlok está fuera.", fr: "Ajouté au deck Evil pendant l'absence du comte Orlok." },
    },
    {
      patch: "0.6.2",
      kind: "nerf",
      from: { mana: 8, power: 9, health: 9 },
      to: { mana: 8, power: 8, health: 8 },
      note: { en: "-1/-1.", it: "-1/-1.", es: "-1/-1.", fr: "-1/-1." },
    },
    {
      patch: "0.6.3",
      kind: "nerf",
      from: { mana: 8, power: 8, health: 8 },
      to: { mana: 8, power: 7, health: 7 },
      note: { en: "-1/-1 again.", it: "Ancora -1/-1.", es: "Otra vez -1/-1.", fr: "Encore -1/-1." },
    },
  ],
  "white-queen": [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 4, power: 2, health: 3 },
      to: { mana: 4, power: 3, health: 3 },
      note: { en: "+1 Power.", it: "+1 Potenza.", es: "+1 de Poder.", fr: "+1 Puissance." },
    },
  ],
  "card-soldier": [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 2, power: 2, health: 1 },
      to: { mana: 2, power: 3, health: 1 },
      note: { en: "+1 Power.", it: "+1 Potenza.", es: "+1 de Poder.", fr: "+1 Puissance." },
    },
  ],
  "christopher-robin": [
    {
      patch: "0.6.3",
      kind: "rework",
      from: { mana: 4, power: 5, health: 4 },
      to: { mana: 4, power: 4, health: 5 },
      note: { en: "Stats swapped: sturdier, hits softer.", it: "Statistiche invertite: più resistente, colpisce meno.", es: "Estadísticas intercambiadas: más resistente, golpea con menos fuerza.", fr: "Statistiques inversées : plus solide, frappe moins fort." },
    },
    {
      patch: "demo-0921",
      kind: "rework",
      from: { mana: 4, power: 4, health: 5 },
      to: { mana: 4, power: 5, health: 4 },
      note: {
        en: "Back to 5/4, as before patch 0.6.3. Listed in the patch notes on the official Discord, not in the Steam post.",
        it: "Torna 5/4, com'era prima della patch 0.6.3. È nelle patch notes del Discord ufficiale, non nel post su Steam.",
        es: "Vuelve a 5/4, como antes del parche 0.6.3. Aparece en las notas del parche del Discord oficial, no en la publicación de Steam.",
      },
    },
  ],
  piglet: [
    {
      patch: "0.6.2",
      kind: "nerf",
      note: { en: "On Reveal now grants +1 Power only; it no longer grants Health.", it: "L'On Reveal dà solo +1 Potenza; non dà più Salute.", es: "Su On Reveal ahora solo otorga +1 de Poder; ya no otorga Salud.", fr: "L'On Reveal ne donne plus que +1 Puissance ; plus de Vie." },
    },
  ],
  kanga: [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 4, power: 3, health: 4 },
      to: { mana: 3, power: 2, health: 3 },
      note: { en: "Cheaper and smaller.", it: "Più economica e più piccola.", es: "Más barata y más pequeña.", fr: "Moins chère et plus petite." },
    },
  ],
  "wicked-witch-of-the-west": [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 3, power: 1, health: 4 },
      to: { mana: 3, power: 1, health: 5 },
      note: { en: "+1 Health; her Flying Monkeys are now 4/1, up from 2/3.", it: "+1 Salute; le sue Scimmie Volanti ora sono 4/1, da 2/3.", es: "+1 de Salud; sus Flying Monkeys pasan de 2/3 a 4/1.", fr: "+1 Vie ; ses Singes volants passent de 2/3 à 4/1." },
    },
  ],
  "flying-monkey": [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 4, power: 2, health: 3 },
      to: { mana: 3, power: 4, health: 1 },
      note: { en: "Cheaper glass cannon.", it: "Cannone di vetro più economico.", es: "Cañón de cristal más barato.", fr: "Canon de verre moins cher." },
    },
  ],
  scarecrow: [
    {
      patch: "0.6.3",
      kind: "nerf",
      from: { mana: 2, power: 1, health: 2 },
      to: { mana: 2, power: 1, health: 1 },
      note: { en: "-1 Health.", it: "-1 Salute.", es: "-1 de Salud.", fr: "-1 Vie." },
    },
  ],
  marian: [
    {
      patch: "0.6.2",
      kind: "nerf",
      from: { mana: 4, power: 3, health: 4 },
      to: { mana: 4, power: 3, health: 3 },
      note: { en: "-1 Health.", it: "-1 Salute.", es: "-1 de Salud.", fr: "-1 Vie." },
    },
  ],
  "guy-of-gisborne": [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 7, power: 3, health: 5 },
      to: { mana: 6, power: 3, health: 3 },
      note: { en: "Costs 1 less, -2 Health.", it: "Costa 1 in meno, -2 Salute.", es: "Cuesta 1 menos, -2 de Salud.", fr: "Coûte 1 de moins, -2 Vie." },
    },
    {
      patch: "demo-0921",
      kind: "buff",
      from: { mana: 6, power: 3, health: 3 },
      to: { mana: 6, power: 4, health: 4 },
      note: { en: "+1 Power, +1 Health.", it: "+1 Potenza, +1 Salute.", es: "+1 de Poder, +1 de Salud." },
    },
  ],
  "brides-of-dracula": [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 3, power: 2, health: 2 },
      to: { mana: 2, power: 2, health: 2 },
      note: { en: "Costs 1 less.", it: "Costa 1 in meno.", es: "Cuesta 1 menos.", fr: "Coûte 1 de moins." },
    },
  ],
  "van-helsings-tools": [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 1 },
      to: { mana: 0 },
      note: { en: "Now free; the Silver Bullet it creates deals 1 damage instead of 3.", it: "Ora gratis; il Proiettile d'Argento che crea infligge 1 danno invece di 3.", es: "Ahora es gratis; la Silver Bullet que crea inflige 1 de daño en lugar de 3.", fr: "Désormais gratuit ; la Balle d'argent créée inflige 1 dégât au lieu de 3." },
    },
  ],
  "silver-bullet": [
    {
      patch: "0.6.2",
      kind: "nerf",
      note: { en: "Damage reduced from 3 to 1.", it: "Danno ridotto da 3 a 1.", es: "Daño reducido de 3 a 1.", fr: "Dégâts réduits de 3 à 1." },
    },
    {
      patch: "demo-0921",
      kind: "buff",
      note: { en: "Can now target barriers as well as characters.", it: "Ora può colpire anche le barriere, oltre ai personaggi.", es: "Ahora puede elegir como objetivo tanto barreras como personajes." },
    },
  ],
  "count-orlok": [
    {
      patch: "0.6.1",
      kind: "deck",
      note: { en: "Temporarily removed from the Evil deck and the game while an issue with his ability is fixed.", it: "Rimosso temporaneamente dal mazzo Evil e dal gioco mentre viene corretto un problema alla sua abilità.", es: "Retirado temporalmente del mazo Evil y del juego mientras se corrige un problema con su habilidad.", fr: "Retiré temporairement du deck Evil et du jeu le temps de corriger un problème de capacité." },
    },
  ],
  huntsman: [
    {
      patch: "0.6.1",
      kind: "rework",
      from: { mana: 4, power: 4, health: 4 },
      to: { mana: 6, power: 6, health: 6 },
      note: { en: "Moved up the curve to 6 Mana 6/6 while the team watches his performance.", it: "Spostato in alto nella curva a 6 Mana 6/6 mentre il team ne osserva le prestazioni.", es: "Sube en la curva hasta 6 de maná, 6/6, mientras el equipo observa su rendimiento.", fr: "Déplacé à 6 Mana 6/6 le temps d'observer ses performances." },
    },
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 6, power: 6, health: 6 },
      to: { mana: 4, power: 4, health: 4 },
      note: { en: "Back to 4 Mana 4/4.", it: "Torna a 4 Mana 4/4.", es: "Vuelve a 4 de maná, 4/4.", fr: "Retour à 4 Mana 4/4." },
    },
  ],
  "three-not-so-little-pigs": [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 7, power: 4, health: 4 },
      to: { mana: 7, power: 3, health: 3 },
      note: { en: "-1/-1; the pigs it summons are now 3/3 to match.", it: "-1/-1; i maialini evocati ora sono 3/3.", es: "-1/-1; los cerdos que invoca ahora también son 3/3.", fr: "-1/-1 ; les cochons invoqués passent à 3/3." },
    },
  ],
  "blow-the-house-down": [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 5 },
      to: { mana: 4 },
      note: { en: "Costs 1 less.", it: "Costa 1 in meno.", es: "Cuesta 1 menos.", fr: "Coûte 1 de moins." },
    },
  ],
  "bridge-troll": [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 5, power: 4, health: 6 },
      to: { mana: 5, power: 5, health: 6 },
      note: { en: "+1 Power.", it: "+1 Potenza.", es: "+1 de Poder.", fr: "+1 Puissance." },
    },
  ],
  rumple: [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 2, power: 1, health: 1 },
      to: { mana: 2, power: 2, health: 2 },
      note: { en: "+1/+1.", it: "+1/+1.", es: "+1/+1.", fr: "+1/+1." },
    },
  ],
  thumbelina: [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 1, power: 2, health: 1 },
      to: { mana: 1, power: 2, health: 2 },
      note: { en: "+1 Health.", it: "+1 Salute.", es: "+1 de Salud.", fr: "+1 Vie." },
    },
  ],
  "stroke-of-midnight": [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 2 },
      to: { mana: 1 },
      note: { en: "Costs 1 less.", it: "Costa 1 in meno.", es: "Cuesta 1 menos.", fr: "Coûte 1 de moins." },
    },
  ],
  humpty: [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 3, power: 3, health: 1 },
      to: { mana: 3, power: 4, health: 1 },
      note: { en: "+1 Power.", it: "+1 Potenza.", es: "+1 de Poder.", fr: "+1 Puissance." },
    },
  ],
  "old-macdonald": [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 5, power: 3, health: 3 },
      to: { mana: 4, power: 4, health: 4 },
      note: { en: "Costs 1 less and +1/+1.", it: "Costa 1 in meno e +1/+1.", es: "Cuesta 1 menos y gana +1/+1.", fr: "Coûte 1 de moins et +1/+1." },
    },
  ],
  "little-lamb": [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 2, power: 1, health: 1 },
      to: { mana: 1, power: 1, health: 1 },
      note: { en: "Costs 1 less.", it: "Costa 1 in meno.", es: "Cuesta 1 menos.", fr: "Coûte 1 de moins." },
    },
  ],
  bigfoot: [
    {
      patch: "0.6.3",
      kind: "nerf",
      from: { mana: 5, power: 6, health: 4 },
      to: { mana: 5, power: 6, health: 3 },
      note: { en: "-1 Health.", it: "-1 Salute.", es: "-1 de Salud.", fr: "-1 Vie." },
    },
  ],
  sandman: [
    {
      patch: "0.6.3",
      kind: "rework",
      from: { mana: 2, power: 2, health: 2 },
      to: { mana: 2, power: 1, health: 3 },
      note: { en: "-1 Power, +1 Health.", it: "-1 Potenza, +1 Salute.", es: "-1 de Poder, +1 de Salud.", fr: "-1 Puissance, +1 Vie." },
    },
  ],
  basilisk: [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 4, power: 2, health: 4 },
      to: { mana: 2, power: 1, health: 2 },
      note: { en: "Halved: 2 Mana 1/2.", it: "Dimezzato: 2 Mana 1/2.", es: "Reducido a la mitad: 2 de maná, 1/2.", fr: "Divisé par deux : 2 Mana 1/2." },
    },
  ],
  pegasus: [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 4, power: 2, health: 4 },
      to: { mana: 3, power: 2, health: 4 },
      note: { en: "Costs 1 less.", it: "Costa 1 in meno.", es: "Cuesta 1 menos.", fr: "Coûte 1 de moins." },
    },
  ],
  "ellen-trechend": [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 9, power: 6, health: 6 },
      to: { mana: 8, power: 3, health: 3 },
      note: { en: "Cheaper, much smaller, but scales harder: +3/+3 per enemy here, up from +2/+2.", it: "Più economica, molto più piccola, ma scala di più: +3/+3 per nemico qui, da +2/+2.", es: "Más barata, mucho más pequeña, pero crece más: +3/+3 por cada enemigo aquí, en lugar de +2/+2.", fr: "Moins chère, bien plus petite, mais grandit plus vite : +3/+3 par ennemi ici, contre +2/+2." },
    },
  ],
  banshee: [
    {
      patch: "0.6.2",
      kind: "nerf",
      note: { en: "On Death now grants +1 Power only; it no longer grants Health.", it: "L'On Death dà solo +1 Potenza; non dà più Salute.", es: "Su On Death ahora solo otorga +1 de Poder; ya no otorga Salud.", fr: "L'On Death ne donne plus que +1 Puissance ; plus de Vie." },
    },
  ],
  koschei: [
    {
      patch: "0.6.1",
      kind: "deck",
      note: { en: "The Discard deck is built around discarding him reliably; Genie was swapped for Mind Palace to help.", it: "Il mazzo Discard è costruito per scartarlo in modo affidabile; Genie è stato sostituito da Mind Palace per aiutare.", es: "El mazo Discard se construye en torno a descartarlo de forma fiable; para ayudar, se cambió Genie por Mind Palace.", fr: "Le deck Discard est construit pour le défausser de façon fiable ; Genie a été remplacé par Mind Palace." },
    },
  ],
  imhotep: [
    {
      patch: "0.6.2",
      kind: "nerf",
      from: { mana: 4, power: 2, health: 3 },
      to: { mana: 4, power: 2, health: 2 },
      note: { en: "-1 Health.", it: "-1 Salute.", es: "-1 de Salud.", fr: "-1 Vie." },
    },
  ],
  genie: [
    {
      patch: "0.6.1",
      kind: "deck",
      note: { en: "Removed from the Discard deck: he got in the way of discarding Koschei.", it: "Rimosso dal mazzo Discard: intralciava lo scarto di Koschei.", es: "Retirado del mazo Discard: estorbaba a la hora de descartar a Koschei.", fr: "Retiré du deck Discard : il gênait la défausse de Koschei." },
    },
  ],
  "mind-palace": [
    {
      patch: "0.6.1",
      kind: "deck",
      note: { en: "Added to the Discard deck in place of Genie.", it: "Aggiunto al mazzo Discard al posto di Genie.", es: "Añadido al mazo Discard en lugar de Genie.", fr: "Ajouté au deck Discard à la place de Genie." },
    },
  ],
  "first-aid": [
    {
      patch: "0.6.1",
      kind: "deck",
      note: { en: "Removed from the Swarm deck in favour of Mowgli.", it: "Rimosso dal mazzo Swarm a favore di Mowgli.", es: "Retirado del mazo Swarm en favor de Mowgli.", fr: "Retiré du deck Swarm au profit de Mowgli." },
    },
  ],

  // ---------- Patch della demo del 21/09/2026 (rispetto all'ultima build del playtest, la 0.6.3) ----------
  quasimodo: [
    {
      patch: "demo-0921",
      kind: "rework",
      from: { mana: 3, power: 2, health: 5 },
      to: { mana: 3, power: 3, health: 4 },
      note: { en: "+1 Power, -1 Health.", it: "+1 Potenza, -1 Salute.", es: "+1 de Poder, -1 de Salud." },
    },
  ],
  beauty: [
    {
      patch: "demo-0921",
      kind: "buff",
      from: { mana: 4, power: 1, health: 1 },
      to: { mana: 4, power: 2, health: 1 },
      note: { en: "+1 Power.", it: "+1 Potenza.", es: "+1 de Poder." },
    },
  ],
  "wicked-stepmother": [
    {
      patch: "demo-0921",
      kind: "buff",
      from: { mana: 4, power: 3, health: 6 },
      to: { mana: 4, power: 4, health: 6 },
      note: { en: "+1 Power.", it: "+1 Potenza.", es: "+1 de Poder." },
    },
  ],
  "magic-carpet": [
    {
      patch: "demo-0921",
      kind: "buff",
      from: { mana: 4, power: 3, health: 4 },
      to: { mana: 4, power: 4, health: 4 },
      note: {
        en: "+1 Power. Buffs it already had are no longer cleared when it is played; if it returns to hand, it can choose again.",
        it: "+1 Potenza. Quando viene giocato non perde più i potenziamenti che aveva già; se torna in mano, può scegliere di nuovo.",
        es: "+1 de Poder. Cuando se juega, ya no pierde las mejoras que tenía; si vuelve a la mano, puede elegir de nuevo.",
      },
    },
  ],
  roo: [
    {
      patch: "demo-0921",
      kind: "buff",
      from: { mana: 2, power: 2, health: 3 },
      to: { mana: 2, power: 2, health: 4 },
      note: { en: "+1 Health.", it: "+1 Salute.", es: "+1 de Salud." },
    },
  ],
  dorothy: [
    {
      patch: "demo-0921",
      kind: "buff",
      from: { mana: 5, power: 1, health: 1 },
      to: { mana: 4, power: 1, health: 1 },
      note: { en: "Costs 1 less.", it: "Costa 1 in meno.", es: "Cuesta 1 menos." },
    },
  ],
  "itsy-bitsy-spider": [
    {
      patch: "demo-0921",
      kind: "rework",
      alignment: { from: "neutral", to: "evil" },
      note: { en: "Now Evil instead of Neutral.", it: "Ora è Malvagia invece che Neutrale.", es: "Ahora es Evil en lugar de Neutral." },
    },
  ],
  "don-quixote": [
    {
      patch: "demo-0921",
      kind: "rework",
      note: { en: "Gained Defender.", it: "Ha ottenuto Defender.", es: "Obtiene Defender." },
    },
  ],
  "heroic-charge": [
    {
      patch: "demo-0921",
      kind: "buff",
      note: { en: "Its +2 Power buff now applies again when the spell is repeated.", it: "Il bonus di +2 Potenza ora si applica di nuovo quando la magia viene ripetuta.", es: "Su mejora de +2 de Poder ahora se aplica de nuevo cuando se repite el hechizo." },
    },
  ],
  "frog-prince": [
    {
      patch: "demo-0921",
      kind: "buff",
      note: {
        en: "Buffs it already had are no longer cleared when it is played; if it returns to hand, it can choose again.",
        it: "Quando viene giocato non perde più i potenziamenti che aveva già; se torna in mano, può scegliere di nuovo.",
        es: "Cuando se juega, ya no pierde las mejoras que tenía; si vuelve a la mano, puede elegir de nuevo.",
      },
    },
  ],
  "wooden-stake": [
    {
      patch: "demo-0921",
      kind: "buff",
      note: {
        en: "Can target characters at full Health; it still fails if the target is not damaged by the time it reveals.",
        it: "Può bersagliare personaggi con la Salute piena; fallisce comunque se il bersaglio non è danneggiato quando si rivela.",
        es: "Puede elegir como objetivo a personajes con la Salud al máximo; aun así, falla si el objetivo no está dañado cuando se revela.",
      },
    },
  ],
};
