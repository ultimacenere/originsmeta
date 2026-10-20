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
      note: { en: "Stats unchanged; gains Double Attack on top of repeating allies' On Reveal abilities.", it: "Statistiche invariate; ottiene Doppio attacco oltre a ripetere le abilità Alla rivelazione degli alleati.", es: "Estadísticas sin cambios; obtiene Ataque doble además de repetir las habilidades Al revelar de los aliados.", fr: "Statistiques inchangées ; gagne Double attaque en plus de répéter les capacités À la révélation des alliés.", pt: "Estatísticas inalteradas; ganha Ataque duplo, além de repetir as habilidades Ao revelar dos aliados.", de: "Werte unverändert; erhält Doppelangriff und wiederholt weiterhin die Fähigkeiten Beim Aufdecken der Verbündeten." },
    },
  ],
  "queen-of-hearts": [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 5, power: 3, health: 5 },
      to: { mana: 4, power: 3, health: 3 },
      note: { en: "Cheaper and smaller; gains First Strike on top of repeating allies' On Death abilities.", it: "Più economica e più piccola; ottiene Primo colpo oltre a ripetere le abilità Alla morte degli alleati.", es: "Más barata y más pequeña; obtiene Primer golpe además de repetir las habilidades Al morir de los aliados.", fr: "Moins chère et plus petite ; gagne Première frappe en plus de répéter les capacités À la mort des alliés.", pt: "Mais barata e menor; ganha Primeiro golpe, além de repetir as habilidades Ao morrer dos aliados.", de: "Billiger und kleiner; erhält Erstschlag und wiederholt weiterhin die Fähigkeiten Bei Tod der Verbündeten." },
    },
  ],
  "king-arthur": [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 7, power: 5, health: 5 },
      to: { mana: 7, power: 7, health: 7 },
      note: { en: "+2/+2, the biggest single buff of the playtest.", it: "+2/+2, il buff singolo più grande del playtest.", es: "+2/+2, el mayor buff individual del playtest.", fr: "+2/+2, le plus gros buff individuel du playtest.", pt: "+2/+2, o maior buff individual do playtest.", de: "+2/+2, der größte einzelne Buff des Playtests." },
    },
  ],
  lancelot: [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 4, power: 3, health: 3 },
      to: { mana: 4, power: 4, health: 4 },
      note: { en: "+1/+1.", it: "+1/+1.", es: "+1/+1.", fr: "+1/+1.", pt: "+1/+1.", de: "+1/+1." },
    },
  ],
  merlin: [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 5, power: 3, health: 5 },
      to: { mana: 5, power: 5, health: 5 },
      note: { en: "+2 Power.", it: "+2 Potenza.", es: "+2 de Poder.", fr: "+2 Puissance.", pt: "+2 de Poder.", de: "+2 Kraft." },
    },
  ],
  "merlins-prophecy": [
    {
      patch: "0.6.3",
      kind: "nerf",
      from: { mana: 1 },
      to: { mana: 2 },
      note: { en: "Costs 1 more.", it: "Costa 1 in più.", es: "Cuesta 1 más.", fr: "Coûte 1 de plus.", pt: "Custa 1 a mais.", de: "Kostet 1 mehr." },
    },
  ],
  bagheera: [
    {
      patch: "0.6.3",
      kind: "rework",
      from: { mana: 1, power: 1, health: 2 },
      to: { mana: 1, power: 1, health: 1 },
      note: { en: "Loses 1 Health; On Reveal bonus on a middle space rises from +1/+1 to +2/+2.", it: "Perde 1 Salute; il bonus dell'abilità Alla rivelazione su spazio centrale sale da +1/+1 a +2/+2.", es: "Pierde 1 de Salud; la bonificación de su habilidad Al revelar en un espacio central sube de +1/+1 a +2/+2.", fr: "Perd 1 Santé ; le bonus de sa capacité À la révélation sur une case centrale passe de +1/+1 à +2/+2.", pt: "Perde 1 de Vida; o bônus de Ao revelar em um espaço central sobe de +1/+1 para +2/+2.", de: "Verliert 1 Leben; der Bonus Beim Aufdecken auf einem mittleren Feld steigt von +1/+1 auf +2/+2." },
    },
    {
      patch: "0.7",
      kind: "nerf",
      from: { mana: 1, power: 1, health: 1 },
      to: { mana: 2, power: 1, health: 1 },
      note: { en: "Costs 1 more.", it: "Costa 1 in più.", es: "Cuesta 1 más.", fr: "Coûte 1 de plus.", pt: "Custa 1 a mais.", de: "Kostet 1 mehr." },
    },
  ],
  mowgli: [
    {
      patch: "0.6.1",
      kind: "deck",
      note: { en: "Added to the Swarm deck in place of First Aid to strengthen the late game.", it: "Aggiunto al mazzo Swarm al posto di First Aid per rafforzare il finale di partita.", es: "Añadido al mazo Swarm en lugar de First Aid para reforzar el final de la partida.", fr: "Ajouté au deck Swarm à la place de First Aid pour renforcer la fin de partie.", pt: "Entra no deck Swarm no lugar de First Aid para reforçar a fase final da partida.", de: "Statt First Aid ins Swarm-Deck aufgenommen, um das Late Game zu stärken." },
    },
  ],
  bandersnatch: [
    {
      patch: "0.6.1",
      kind: "deck",
      note: { en: "Added to the Evil deck while Count Orlok is out.", it: "Aggiunto al mazzo Evil mentre Count Orlok è fuori.", es: "Añadido al mazo Evil mientras Count Orlok está fuera.", fr: "Ajouté au deck Evil pendant l'absence de Count Orlok.", pt: "Entra no deck Evil enquanto Count Orlok está fora.", de: "Ins Evil-Deck aufgenommen, solange Count Orlok fehlt." },
    },
    {
      patch: "0.6.2",
      kind: "nerf",
      from: { mana: 8, power: 9, health: 9 },
      to: { mana: 8, power: 8, health: 8 },
      note: { en: "-1/-1.", it: "-1/-1.", es: "-1/-1.", fr: "-1/-1.", pt: "-1/-1.", de: "-1/-1." },
    },
    {
      patch: "0.6.3",
      kind: "nerf",
      from: { mana: 8, power: 8, health: 8 },
      to: { mana: 8, power: 7, health: 7 },
      note: { en: "-1/-1 again.", it: "Ancora -1/-1.", es: "Otra vez -1/-1.", fr: "Encore -1/-1.", pt: "-1/-1 de novo.", de: "Erneut -1/-1." },
    },
  ],
  "white-queen": [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 4, power: 2, health: 3 },
      to: { mana: 4, power: 3, health: 3 },
      note: { en: "+1 Power.", it: "+1 Potenza.", es: "+1 de Poder.", fr: "+1 Puissance.", pt: "+1 de Poder.", de: "+1 Kraft." },
    },
  ],
  "card-soldier": [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 2, power: 2, health: 1 },
      to: { mana: 2, power: 3, health: 1 },
      note: { en: "+1 Power.", it: "+1 Potenza.", es: "+1 de Poder.", fr: "+1 Puissance.", pt: "+1 de Poder.", de: "+1 Kraft." },
    },
  ],
  "christopher-robin": [
    {
      patch: "0.6.3",
      kind: "rework",
      from: { mana: 4, power: 5, health: 4 },
      to: { mana: 4, power: 4, health: 5 },
      note: { en: "Stats swapped: sturdier, hits softer.", it: "Statistiche invertite: più resistente, colpisce meno.", es: "Estadísticas intercambiadas: más resistente, golpea con menos fuerza.", fr: "Statistiques inversées : plus solide, frappe moins fort.", pt: "Estatísticas invertidas: mais resistente, mas bate mais fraco.", de: "Werte getauscht: robuster, schlägt aber schwächer zu." },
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
        fr: "Retour à 5/4, comme avant le patch 0.6.3. Figure dans les notes de patch du Discord officiel, pas dans le post Steam.",
        pt: "Volta a 5/4, como antes do patch 0.6.3. Consta nas notas do patch do Discord oficial, não no post da Steam.",
        de: "Wieder 5/4 wie vor Patch 0.6.3. Steht in den Patchnotes auf dem offiziellen Discord, nicht im Steam-Post.",
      },
    },
  ],
  piglet: [
    {
      patch: "0.6.2",
      kind: "nerf",
      note: { en: "On Reveal now grants +1 Power only; it no longer grants Health.", it: "L'abilità Alla rivelazione dà solo +1 Potenza; non dà più Salute.", es: "Su habilidad Al revelar ahora solo otorga +1 de Poder; ya no otorga Salud.", fr: "Sa capacité À la révélation ne donne plus que +1 Puissance ; elle ne donne plus de Santé.", pt: "Ao revelar agora dá só +1 de Poder; não dá mais Vida.", de: "Beim Aufdecken gibt jetzt nur noch +1 Kraft, kein Leben mehr." },
    },
  ],
  kanga: [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 4, power: 3, health: 4 },
      to: { mana: 3, power: 2, health: 3 },
      note: { en: "Cheaper and smaller.", it: "Più economica e più piccola.", es: "Más barata y más pequeña.", fr: "Moins chère et plus petite.", pt: "Mais barata e menor.", de: "Billiger und kleiner." },
    },
  ],
  "wicked-witch-of-the-west": [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 3, power: 1, health: 4 },
      to: { mana: 3, power: 1, health: 5 },
      note: { en: "+1 Health; her Flying Monkeys are now 4/1, up from 2/3.", it: "+1 Salute; le sue Flying Monkeys ora sono 4/1, da 2/3.", es: "+1 de Salud; sus Flying Monkeys pasan de 2/3 a 4/1.", fr: "+1 Santé ; ses Flying Monkeys passent de 2/3 à 4/1.", pt: "+1 de Vida; os Flying Monkeys dela agora são 4/1, antes eram 2/3.", de: "+1 Leben; ihre Flying Monkeys sind jetzt 4/1 statt 2/3." },
    },
  ],
  "flying-monkey": [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 4, power: 2, health: 3 },
      to: { mana: 3, power: 4, health: 1 },
      note: { en: "Cheaper glass cannon.", it: "Cannone di vetro più economico.", es: "Cañón de cristal más barato.", fr: "Canon de verre moins cher.", pt: "Um canhão de vidro mais barato.", de: "Eine billigere Glaskanone." },
    },
  ],
  scarecrow: [
    {
      patch: "0.6.3",
      kind: "nerf",
      from: { mana: 2, power: 1, health: 2 },
      to: { mana: 2, power: 1, health: 1 },
      note: { en: "-1 Health.", it: "-1 Salute.", es: "-1 de Salud.", fr: "-1 Santé.", pt: "-1 de Vida.", de: "-1 Leben." },
    },
  ],
  marian: [
    {
      patch: "0.6.2",
      kind: "nerf",
      from: { mana: 4, power: 3, health: 4 },
      to: { mana: 4, power: 3, health: 3 },
      note: { en: "-1 Health.", it: "-1 Salute.", es: "-1 de Salud.", fr: "-1 Santé.", pt: "-1 de Vida.", de: "-1 Leben." },
    },
  ],
  "guy-of-gisborne": [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 7, power: 3, health: 5 },
      to: { mana: 6, power: 3, health: 3 },
      note: { en: "Costs 1 less, -2 Health.", it: "Costa 1 in meno, -2 Salute.", es: "Cuesta 1 menos, -2 de Salud.", fr: "Coûte 1 de moins, -2 Santé.", pt: "Custa 1 a menos, -2 de Vida.", de: "Kostet 1 weniger, -2 Leben." },
    },
    {
      patch: "demo-0921",
      kind: "buff",
      from: { mana: 6, power: 3, health: 3 },
      to: { mana: 6, power: 4, health: 4 },
      note: { en: "+1 Power, +1 Health.", it: "+1 Potenza, +1 Salute.", es: "+1 de Poder, +1 de Salud.", fr: "+1 Puissance, +1 Santé.", pt: "+1 de Poder, +1 de Vida.", de: "+1 Kraft, +1 Leben." },
    },
  ],
  "brides-of-dracula": [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 3, power: 2, health: 2 },
      to: { mana: 2, power: 2, health: 2 },
      note: { en: "Costs 1 less.", it: "Costa 1 in meno.", es: "Cuesta 1 menos.", fr: "Coûte 1 de moins.", pt: "Custa 1 a menos.", de: "Kostet 1 weniger." },
    },
  ],
  "van-helsings-tools": [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 1 },
      to: { mana: 0 },
      note: { en: "Now free; the Silver Bullet it creates deals 1 damage instead of 3.", it: "Ora gratis; la Silver Bullet che crea infligge 1 danno invece di 3.", es: "Ahora es gratis; la Silver Bullet que crea inflige 1 de daño en lugar de 3.", fr: "Désormais gratuit ; la Silver Bullet qu'il crée inflige 1 dégât au lieu de 3.", pt: "Agora é grátis; a Silver Bullet que ela cria causa 1 de dano em vez de 3.", de: "Jetzt kostenlos; die erschaffene Silver Bullet fügt 1 Schaden statt 3 zu." },
    },
  ],
  "silver-bullet": [
    {
      patch: "0.6.2",
      kind: "nerf",
      note: { en: "Damage reduced from 3 to 1.", it: "Danno ridotto da 3 a 1.", es: "Daño reducido de 3 a 1.", fr: "Dégâts réduits de 3 à 1.", pt: "Dano reduzido de 3 para 1.", de: "Schaden von 3 auf 1 gesenkt." },
    },
    {
      patch: "demo-0921",
      kind: "buff",
      note: { en: "Can now target barriers as well as characters.", it: "Ora può colpire anche le barriere, oltre ai personaggi.", es: "Ahora puede elegir como objetivo tanto barreras como personajes.", fr: "Peut désormais cibler les barrières en plus des personnages.", pt: "Agora pode ter como alvo barreiras, além de personagens.", de: "Kann jetzt neben Charakteren auch Barrieren als Ziel wählen." },
    },
  ],
  "count-orlok": [
    {
      patch: "0.6.1",
      kind: "deck",
      note: { en: "Temporarily removed from the Evil deck and the game while an issue with his ability is fixed.", it: "Rimosso temporaneamente dal mazzo Evil e dal gioco mentre viene corretto un problema alla sua abilità.", es: "Retirado temporalmente del mazo Evil y del juego mientras se corrige un problema con su habilidad.", fr: "Retiré temporairement du deck Evil et du jeu, le temps de corriger un problème de sa capacité.", pt: "Retirado temporariamente do deck Evil e do jogo enquanto um problema com a habilidade dele é corrigido.", de: "Vorübergehend aus dem Evil-Deck und aus dem Spiel entfernt, solange ein Problem mit seiner Fähigkeit behoben wird." },
    },
  ],
  huntsman: [
    {
      patch: "0.6.1",
      kind: "rework",
      from: { mana: 4, power: 4, health: 4 },
      to: { mana: 6, power: 6, health: 6 },
      note: { en: "Moved up the curve to 6 Mana 6/6 while the team watches his performance.", it: "Spostato in alto nella curva a 6 Mana 6/6 mentre il team ne osserva le prestazioni.", es: "Sube en la curva hasta 6 de maná, 6/6, mientras el equipo observa su rendimiento.", fr: "Remonté dans la courbe à 6 mana 6/6, le temps que l'équipe observe ses performances.", pt: "Sobe na curva para 6 de mana 6/6 enquanto a equipe acompanha o desempenho dele.", de: "In der Kurve nach oben verschoben, auf 6 Mana 6/6, während das Team beobachtet, wie er sich schlägt." },
    },
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 6, power: 6, health: 6 },
      to: { mana: 4, power: 4, health: 4 },
      note: { en: "Back to 4 Mana 4/4.", it: "Torna a 4 Mana 4/4.", es: "Vuelve a 4 de maná, 4/4.", fr: "Retour à 4 mana 4/4.", pt: "Volta a 4 de mana 4/4.", de: "Zurück auf 4 Mana 4/4." },
    },
  ],
  "three-not-so-little-pigs": [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 7, power: 4, health: 4 },
      to: { mana: 7, power: 3, health: 3 },
      note: { en: "-1/-1; the pigs it summons are now 3/3 to match.", it: "-1/-1; i maialini evocati ora sono 3/3.", es: "-1/-1; los cerdos que invoca ahora también son 3/3.", fr: "-1/-1 ; les cochons invoqués passent eux aussi à 3/3.", pt: "-1/-1; os porcos que invoca agora também são 3/3.", de: "-1/-1; die beschworenen Schweine sind passend dazu jetzt 3/3." },
    },
  ],
  "blow-the-house-down": [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 5 },
      to: { mana: 4 },
      note: { en: "Costs 1 less.", it: "Costa 1 in meno.", es: "Cuesta 1 menos.", fr: "Coûte 1 de moins.", pt: "Custa 1 a menos.", de: "Kostet 1 weniger." },
    },
  ],
  "bridge-troll": [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 5, power: 4, health: 6 },
      to: { mana: 5, power: 5, health: 6 },
      note: { en: "+1 Power.", it: "+1 Potenza.", es: "+1 de Poder.", fr: "+1 Puissance.", pt: "+1 de Poder.", de: "+1 Kraft." },
    },
  ],
  rumple: [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 2, power: 1, health: 1 },
      to: { mana: 2, power: 2, health: 2 },
      note: { en: "+1/+1.", it: "+1/+1.", es: "+1/+1.", fr: "+1/+1.", pt: "+1/+1.", de: "+1/+1." },
    },
  ],
  thumbelina: [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 1, power: 2, health: 1 },
      to: { mana: 1, power: 2, health: 2 },
      note: { en: "+1 Health.", it: "+1 Salute.", es: "+1 de Salud.", fr: "+1 Santé.", pt: "+1 de Vida.", de: "+1 Leben." },
    },
  ],
  "stroke-of-midnight": [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 2 },
      to: { mana: 1 },
      note: { en: "Costs 1 less.", it: "Costa 1 in meno.", es: "Cuesta 1 menos.", fr: "Coûte 1 de moins.", pt: "Custa 1 a menos.", de: "Kostet 1 weniger." },
    },
  ],
  humpty: [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 3, power: 3, health: 1 },
      to: { mana: 3, power: 4, health: 1 },
      note: { en: "+1 Power.", it: "+1 Potenza.", es: "+1 de Poder.", fr: "+1 Puissance.", pt: "+1 de Poder.", de: "+1 Kraft." },
    },
    {
      patch: "0.7",
      kind: "rework",
      fix: true,
      note: { en: "The random card it adds to your hand can no longer be Humpty.", it: "La carta casuale che aggiunge alla tua mano non può più essere Humpty.", es: "La carta aleatoria que añade a tu mano ya no puede ser Humpty.", fr: "La carte aléatoire qu'il ajoute à votre main ne peut plus être Humpty.", pt: "A carta aleatória que adiciona à sua mão não pode mais ser Humpty.", de: "Die zufällige Karte, die er deiner Hand hinzufügt, kann nicht mehr Humpty sein." },
    },
  ],
  "old-macdonald": [
    {
      patch: "0.6.3",
      kind: "buff",
      from: { mana: 5, power: 3, health: 3 },
      to: { mana: 4, power: 4, health: 4 },
      note: { en: "Costs 1 less and +1/+1.", it: "Costa 1 in meno e +1/+1.", es: "Cuesta 1 menos y gana +1/+1.", fr: "Coûte 1 de moins et +1/+1.", pt: "Custa 1 a menos e +1/+1.", de: "Kostet 1 weniger und erhält +1/+1." },
    },
  ],
  "little-lamb": [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 2, power: 1, health: 1 },
      to: { mana: 1, power: 1, health: 1 },
      note: { en: "Costs 1 less.", it: "Costa 1 in meno.", es: "Cuesta 1 menos.", fr: "Coûte 1 de moins.", pt: "Custa 1 a menos.", de: "Kostet 1 weniger." },
    },
  ],
  bigfoot: [
    {
      patch: "0.6.3",
      kind: "nerf",
      from: { mana: 5, power: 6, health: 4 },
      to: { mana: 5, power: 6, health: 3 },
      note: { en: "-1 Health.", it: "-1 Salute.", es: "-1 de Salud.", fr: "-1 Santé.", pt: "-1 de Vida.", de: "-1 Leben." },
    },
  ],
  sandman: [
    {
      patch: "0.6.3",
      kind: "rework",
      from: { mana: 2, power: 2, health: 2 },
      to: { mana: 2, power: 1, health: 3 },
      note: { en: "-1 Power, +1 Health.", it: "-1 Potenza, +1 Salute.", es: "-1 de Poder, +1 de Salud.", fr: "-1 Puissance, +1 Santé.", pt: "-1 de Poder, +1 de Vida.", de: "-1 Kraft, +1 Leben." },
    },
  ],
  basilisk: [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 4, power: 2, health: 4 },
      to: { mana: 2, power: 1, health: 2 },
      note: { en: "Halved: 2 Mana 1/2.", it: "Dimezzato: 2 Mana 1/2.", es: "Reducido a la mitad: 2 de maná, 1/2.", fr: "Divisé par deux : 2 mana 1/2.", pt: "Cortado pela metade: 2 de mana 1/2.", de: "Halbiert: 2 Mana 1/2." },
    },
  ],
  pegasus: [
    {
      patch: "0.6.2",
      kind: "buff",
      from: { mana: 4, power: 2, health: 4 },
      to: { mana: 3, power: 2, health: 4 },
      note: { en: "Costs 1 less.", it: "Costa 1 in meno.", es: "Cuesta 1 menos.", fr: "Coûte 1 de moins.", pt: "Custa 1 a menos.", de: "Kostet 1 weniger." },
    },
  ],
  "ellen-trechend": [
    {
      patch: "0.6.2",
      kind: "rework",
      from: { mana: 9, power: 6, health: 6 },
      to: { mana: 8, power: 3, health: 3 },
      note: { en: "Cheaper, much smaller, but scales harder: +3/+3 per enemy here, up from +2/+2.", it: "Più economica, molto più piccola, ma scala di più: +3/+3 per nemico qui, da +2/+2.", es: "Más barata, mucho más pequeña, pero crece más: +3/+3 por cada enemigo aquí, en lugar de +2/+2.", fr: "Moins chère, bien plus petite, mais grandit plus vite : +3/+3 par ennemi ici, contre +2/+2 avant.", pt: "Mais barato, bem menor, mas cresce mais: +3/+3 por inimigo aqui, antes eram +2/+2.", de: "Billiger, viel kleiner, wächst aber stärker: +3/+3 pro Feind hier statt +2/+2." },
    },
  ],
  banshee: [
    {
      patch: "0.6.2",
      kind: "nerf",
      note: { en: "On Death now grants +1 Power only; it no longer grants Health.", it: "L'abilità Alla morte dà solo +1 Potenza; non dà più Salute.", es: "Su habilidad Al morir ahora solo otorga +1 de Poder; ya no otorga Salud.", fr: "Sa capacité À la mort ne donne plus que +1 Puissance ; elle ne donne plus de Santé.", pt: "Ao morrer agora dá só +1 de Poder; não dá mais Vida.", de: "Bei Tod gibt jetzt nur noch +1 Kraft, kein Leben mehr." },
    },
  ],
  koschei: [
    {
      patch: "0.6.1",
      kind: "deck",
      note: { en: "The Discard deck is built around discarding him reliably; Genie was swapped for Mind Palace to help.", it: "Il mazzo Discard è costruito per scartarlo in modo affidabile; Genie è stato sostituito da Mind Palace per aiutare.", es: "El mazo Discard se construye en torno a descartarlo de forma fiable; para ayudar, se cambió Genie por Mind Palace.", fr: "Le deck Discard est construit pour le défausser de façon fiable ; Genie a été remplacé par Mind Palace pour y aider.", pt: "O deck Discard é montado para descartá-lo com segurança; Genie foi trocado por Mind Palace para ajudar.", de: "Das Discard-Deck ist darauf gebaut, ihn zuverlässig abzuwerfen; dafür wurde Genie gegen Mind Palace getauscht." },
    },
  ],
  imhotep: [
    {
      patch: "0.6.2",
      kind: "nerf",
      from: { mana: 4, power: 2, health: 3 },
      to: { mana: 4, power: 2, health: 2 },
      note: { en: "-1 Health.", it: "-1 Salute.", es: "-1 de Salud.", fr: "-1 Santé.", pt: "-1 de Vida.", de: "-1 Leben." },
    },
  ],
  genie: [
    {
      patch: "0.6.1",
      kind: "deck",
      note: { en: "Removed from the Discard deck: he got in the way of discarding Koschei.", it: "Rimosso dal mazzo Discard: intralciava lo scarto di Koschei.", es: "Retirado del mazo Discard: estorbaba a la hora de descartar a Koschei.", fr: "Retiré du deck Discard : il gênait la défausse de Koschei.", pt: "Sai do deck Discard: atrapalhava o descarte de Koschei.", de: "Aus dem Discard-Deck entfernt: Er stand dem Abwerfen von Koschei im Weg." },
    },
  ],
  "mind-palace": [
    {
      patch: "0.6.1",
      kind: "deck",
      note: { en: "Added to the Discard deck in place of Genie.", it: "Aggiunto al mazzo Discard al posto di Genie.", es: "Añadido al mazo Discard en lugar de Genie.", fr: "Ajouté au deck Discard à la place de Genie.", pt: "Entra no deck Discard no lugar de Genie.", de: "Statt Genie ins Discard-Deck aufgenommen." },
    },
    {
      patch: "0.7",
      kind: "nerf",
      from: { mana: 2 },
      to: { mana: 3 },
      note: { en: "Costs 1 more.", it: "Costa 1 in più.", es: "Cuesta 1 más.", fr: "Coûte 1 de plus.", pt: "Custa 1 a mais.", de: "Kostet 1 mehr." },
    },
  ],
  "first-aid": [
    {
      patch: "0.6.1",
      kind: "deck",
      note: { en: "Removed from the Swarm deck in favour of Mowgli.", it: "Rimosso dal mazzo Swarm a favore di Mowgli.", es: "Retirado del mazo Swarm en favor de Mowgli.", fr: "Retiré du deck Swarm au profit de Mowgli.", pt: "Sai do deck Swarm para dar lugar a Mowgli.", de: "Zugunsten von Mowgli aus dem Swarm-Deck entfernt." },
    },
  ],

  // ---------- Patch della demo del 21/09/2026 (rispetto all'ultima build del playtest, la 0.6.3) ----------
  quasimodo: [
    {
      patch: "demo-0921",
      kind: "rework",
      from: { mana: 3, power: 2, health: 5 },
      to: { mana: 3, power: 3, health: 4 },
      note: { en: "+1 Power, -1 Health.", it: "+1 Potenza, -1 Salute.", es: "+1 de Poder, -1 de Salud.", fr: "+1 Puissance, -1 Santé.", pt: "+1 de Poder, -1 de Vida.", de: "+1 Kraft, -1 Leben." },
    },
  ],
  beauty: [
    {
      patch: "demo-0921",
      kind: "buff",
      from: { mana: 4, power: 1, health: 1 },
      to: { mana: 4, power: 2, health: 1 },
      note: { en: "+1 Power.", it: "+1 Potenza.", es: "+1 de Poder.", fr: "+1 Puissance.", pt: "+1 de Poder.", de: "+1 Kraft." },
    },
  ],
  "wicked-stepmother": [
    {
      patch: "demo-0921",
      kind: "buff",
      from: { mana: 4, power: 3, health: 6 },
      to: { mana: 4, power: 4, health: 6 },
      note: { en: "+1 Power.", it: "+1 Potenza.", es: "+1 de Poder.", fr: "+1 Puissance.", pt: "+1 de Poder.", de: "+1 Kraft." },
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
        fr: "+1 Puissance. Les bonus qu'il avait déjà ne sont plus effacés quand il est joué ; s'il revient en main, il peut choisir de nouveau.",
        pt: "+1 de Poder. Os buffs que já tinha não são mais apagados quando é jogado; se voltar para a mão, pode escolher de novo.",
        de: "+1 Kraft. Buffs, die er schon hatte, gehen beim Ausspielen nicht mehr verloren; kehrt er auf die Hand zurück, kann er erneut wählen.",
      },
    },
  ],
  roo: [
    {
      patch: "demo-0921",
      kind: "buff",
      from: { mana: 2, power: 2, health: 3 },
      to: { mana: 2, power: 2, health: 4 },
      note: { en: "+1 Health.", it: "+1 Salute.", es: "+1 de Salud.", fr: "+1 Santé.", pt: "+1 de Vida.", de: "+1 Leben." },
    },
  ],
  dorothy: [
    {
      patch: "demo-0921",
      kind: "buff",
      from: { mana: 5, power: 1, health: 1 },
      to: { mana: 4, power: 1, health: 1 },
      note: { en: "Costs 1 less.", it: "Costa 1 in meno.", es: "Cuesta 1 menos.", fr: "Coûte 1 de moins.", pt: "Custa 1 a menos.", de: "Kostet 1 weniger." },
    },
  ],
  "itsy-bitsy-spider": [
    {
      patch: "demo-0921",
      kind: "rework",
      alignment: { from: "neutral", to: "evil" },
      note: { en: "Now Evil instead of Neutral.", it: "Ora è Malvagia invece che Neutrale.", es: "Ahora es Evil en lugar de Neutral.", fr: "Désormais Evil au lieu de Neutral.", pt: "Agora é Evil em vez de Neutral.", de: "Jetzt Evil statt Neutral." },
    },
  ],
  "don-quixote": [
    {
      patch: "demo-0921",
      kind: "rework",
      note: { en: "Gained Defender.", it: "Ha ottenuto Difensore.", es: "Obtiene Defensor.", fr: "Gagne Défenseur.", pt: "Ganhou Defensor.", de: "Hat Verteidiger erhalten." },
    },
  ],
  "heroic-charge": [
    {
      patch: "demo-0921",
      kind: "buff",
      note: { en: "Its +2 Power buff now applies again when the spell is repeated.", it: "Il bonus di +2 Potenza ora si applica di nuovo quando la magia viene ripetuta.", es: "Su mejora de +2 de Poder ahora se aplica de nuevo cuando se repite el hechizo.", fr: "Son bonus de +2 Puissance s'applique de nouveau quand le sort est répété.", pt: "O buff de +2 de Poder agora volta a valer quando o feitiço é repetido.", de: "Der Buff von +2 Kraft greift jetzt erneut, wenn der Zauber wiederholt wird." },
    },
    {
      patch: "0.7",
      kind: "buff",
      fix: true,
      note: {
        en: "Bug fix: if a character it buffed loses its abilities, the +2 Power now stays; Trample is still removed.",
        it: "Correzione di un bug: se un personaggio che ha potenziato perde le abilità, il +2 Potenza ora resta; Travolgere viene comunque tolto.",
        es: "Corrección de un error: si un personaje al que ha potenciado pierde sus habilidades, el +2 de Poder ahora se mantiene; Arrollar se sigue quitando.",
        fr: "Correction d'un bug : si un personnage qu'il a renforcé perd ses capacités, le +2 Puissance reste désormais ; Piétinement est toujours retiré.",
        pt: "Correção de bug: se um personagem que recebeu o buff perde as habilidades, o +2 de Poder agora permanece; Atropelar continua sendo removido.",
        de: "Bugfix: Verliert ein Charakter, den die Karte gebufft hat, seine Fähigkeiten, bleiben die +2 Kraft jetzt erhalten; Überrennen wird weiterhin entfernt.",
      },
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
        fr: "Les bonus qu'il avait déjà ne sont plus effacés quand il est joué ; s'il revient en main, il peut choisir de nouveau.",
        pt: "Os buffs que já tinha não são mais apagados quando é jogado; se voltar para a mão, pode escolher de novo.",
        de: "Buffs, die er schon hatte, gehen beim Ausspielen nicht mehr verloren; kehrt er auf die Hand zurück, kann er erneut wählen.",
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
        fr: "Peut cibler des personnages dont la Santé est au maximum ; échoue toujours si la cible n'est pas blessée au moment où il se révèle.",
        pt: "Pode ter como alvo personagens com a Vida cheia; ainda falha se o alvo não estiver ferido no momento em que ela é revelada.",
        de: "Kann Charaktere mit vollem Leben als Ziel wählen; scheitert aber weiterhin, wenn das Ziel beim Aufdecken der Karte nicht beschädigt ist.",
      },
    },
  ],

  // ---------- Patch 0.7 del 29/09/2026 ("Steam Demo Update #2", l'ultima di bilanciamento prima della Crimson Cup) ----------
  // Bagheera, Mind Palace, Humpty e Heroic Charge stanno sopra, con le modifiche precedenti. Freeze! e Dorothy hanno solo
  // la spiegazione delle parole chiave al passaggio del mouse (interfaccia, non bilanciamento): stanno nella news `patch-0-7`,
  // non qui. Boogeyman è citato nel riassunto delle patch notes ("now behave differently") senza una riga che dica che cosa
  // cambia: niente voce finché il team non lo dice.
  "twister-toss": [
    {
      patch: "0.7",
      kind: "rework",
      note: {
        en: "Now moves an ally to any space; if another card is already there, the two swap places. It can also target occupied spaces.",
        it: "Ora muove un alleato in qualsiasi spazio; se lì c'è già un'altra carta, le due si scambiano di posto. Può anche bersagliare spazi occupati.",
        es: "Ahora mueve a un aliado a cualquier espacio; si ya hay otra carta allí, las dos intercambian sus posiciones. También puede elegir como objetivo espacios ocupados.",
        fr: "Déplace désormais un allié vers n'importe quelle case ; si une autre carte s'y trouve déjà, les deux échangent leur place. Peut aussi cibler des cases occupées.",
        pt: "Agora move um aliado para qualquer espaço; se já houver outra carta lá, as duas trocam de lugar. Também pode ter como alvo espaços ocupados.",
        de: "Bewegt jetzt einen Verbündeten auf ein beliebiges Feld; liegt dort schon eine andere Karte, tauschen die beiden die Plätze. Kann auch besetzte Felder als Ziel wählen.",
      },
    },
  ],
  spellbook: [
    {
      patch: "0.7",
      kind: "nerf",
      from: { mana: 3 },
      to: { mana: 4 },
      note: {
        en: "Costs 1 more; the random spells it adds can no longer be Spellbook.",
        it: "Costa 1 in più; le magie casuali che aggiunge non possono più essere Spellbook.",
        es: "Cuesta 1 más; los hechizos aleatorios que añade ya no pueden ser Spellbook.",
        fr: "Coûte 1 de plus ; les sorts aléatoires qu'il ajoute ne peuvent plus être Spellbook.",
        pt: "Custa 1 a mais; os feitiços aleatórios que adiciona não podem mais ser Spellbook.",
        de: "Kostet 1 mehr; die zufälligen Zauber, die es hinzufügt, können nicht mehr Spellbook sein.",
      },
    },
  ],
};
