import type { GuideCopy, GuideSlug } from "./guides";

/**
 * Guide in spagnolo (25/09/2026): solo i testi. Categoria, carte, lista del mazzo, copertina, data e tempo di
 * lettura vengono dalla versione inglese in guides.ts (`getGuides`), così restano scritti in un posto solo.
 * Una guida nuova si scrive nelle tre lingue: inglese e italiano in guides.ts, spagnolo qui (il tipo lo pretende).
 * Stesse regole delle altre lingue: link interni con /es/, ancore {#…} in spagnolo, nomi delle carte in inglese.
 */
export const esText: Record<GuideSlug, GuideCopy> = {
  "origins-tcg-locations": {
    title: "Ubicaciones de Origins TCG: cómo los tres carriles cambian cada partida",
    metaTitle: "Las ubicaciones de Origins TCG, explicadas",
    excerpt: "Las ubicaciones son el tercer jugador en la mesa: duplican el daño, cambian los costes y mueven a tus personajes. Cómo funcionan, cuáles deciden partidas y cómo construir con ellas en mente.",
    faq: [
      {
        q: "¿Cuántas ubicaciones hay en Origins TCG?",
        a: "La Demo 2.0 tiene 44 en rotación. La página oficial de Steam dice que el juego completo las saca de un conjunto de más de cien ubicaciones.",
      },
      {
        q: "¿Cuándo se ven las ubicaciones de una partida?",
        a: "Una por ronda durante las tres primeras rondas: la primera se conoce desde el principio, la segunda llega en la segunda ronda y la tercera en la tercera. A partir de la cuarta ronda se juega con todo el tablero a la vista.",
      },
      {
        q: "¿Una ubicación afecta a los dos jugadores?",
        a: "Sí. Una ubicación es una regla de ese carril, no una ventaja para quien llega primero: Amplifying Amphitheatre duplica tu daño y también el del rival.",
      },
      {
        q: "¿Dónde puedo ver la lista completa?",
        a: "En la página de ubicaciones de OriginsMeta, con búsqueda, filtros por tipo de efecto y enlaces a las cartas que invocan algunas de ellas.",
      },
    ],
    body: `
## Por qué las ubicaciones importan más de lo que parece

Origins TCG se juega en **tres ubicaciones**, y cada una trae una regla que se aplica a ese carril durante toda la partida. Es la parte del juego que una lista de mazo no puede controlar: dos jugadores pueden sentarse con las mismas veinticinco cartas y encontrarse con dos partidas completamente distintas, porque un tablero duplica el daño y el otro hace que todo cueste uno menos.

La Demo 2.0 tiene **44 ubicaciones** en rotación. La [página oficial de Steam](https://store.steampowered.com/app/4429430/Origins_TCG/) dice que el juego completo las sacará "from a pool of 100+ rotating locations that reshape the board and demand a unique strategy". La lista completa con todos los efectos está en la [página de ubicaciones](/es/locations), con búsqueda y filtros; esta guía trata de qué hacer con ellas.

## Cómo llegan

Las tres ubicaciones se revelan **una por ronda durante las tres primeras rondas**. La primera está en la mesa desde el principio, la segunda aparece en la segunda ronda y la tercera en la tercera. A partir de la cuarta ronda ya no queda nada oculto y juegas en un tablero que ves entero.

Ese calendario es la razón por la que las primeras rondas no son solo una cuestión de curva: en la primera ronda estás comprometiendo cartas en un carril cuyos dos vecinos todavía no conoces. Guardar un personaje una ronda para ver dónde encaja suele valer más que jugarlo en curva en el carril equivocado.

## Las familias de efectos

En nuestra lista, las ubicaciones están agrupadas según lo que le hacen a la partida, y vale la pena conocer los grupos porque piden respuestas distintas.

- **Daño.** Amplifying Amphitheatre duplica todo el daño allí, Burnturn Arena desgasta a cada personaje después del combate y Soul Artillery golpea las dos barreras cada vez que algo muere. Los cuerpos pequeños dejan de estar a salvo.
- **Maná y costes.** Gold Spinning Wheel le resta uno a todo, Castle in the Clouds solo a las cartas que cuestan siete o más, Treasurer's Office suma uno y Mana Battery te deja conservar lo que no gastaste. Son las que deciden quién se adelanta en tempo.
- **Robo y descarte.** The Sultan's Court te da cada ronda una carta que tienes que gastar, Knowledge Vault premia a quien llena primero el carril, Junkyard le quita una a cada jugador y Nostradamus' Call destruye los dos mazos al inicio de la sexta ronda.
- **Movimiento.** Conveyor Belt desplaza a todos a la derecha después del combate, Ballroom devuelve a la mano un personaje al azar y Open Meadow otorga Move.
- **Invocaciones y copias.** Cloning Lab llena tus casillas con copias de lo que acabas de jugar, Reflecting Pool lo copia en otra ubicación, Sherwood Forest no deja de producir [Merry Man](/es/cards/merry-man) y Hundred Acre Woods pone un [Christopher Robin](/es/cards/christopher-robin) en cada lado.
- **Palabras clave otorgadas.** Stomping Grounds da Trample, The Colosseum Double Attack, Windmill Ridge Defender, Poison Grounds da Deathtouch a los personajes Evil y Blessed Grounds da Shield a los Good.
- **Habilidades.** Mirror Dimension repite los On Reveal, Burial Grounds repite los On Death, Anti-Magic Vault elimina por completo las habilidades y Wonderland invierte el orden de ataque.
- **Destrucción y barreras.** The Gallows destruye al enemigo que queda enfrente de cualquier cosa que llegue allí, The Hill mata después del combate a todos los que empatan con el poder más bajo, Wall of Dumpty se come el primer personaje que juegas y Broken Gate hace que las barreras vuelvan con 10 de salud en lugar de 40.

## Las ubicaciones que deciden partidas

Algunas conviene reconocerlas en cuanto aparecen, porque cambian lo que deberías hacer con tu mano.

- **Cloning Lab.** Lo que juegues allí se copia en tus casillas libres de ese carril. Un cuerpo barato con un buen On Reveal se convierte en tres, y el carril se decide en un turno.
- **Mirror Dimension.** Cada On Reveal se activa dos veces. Hace por un carril entero lo que [Mulan](/es/cards/mulan) hace por un mazo, y se acumula con ella.
- **The Gallows.** Todo lo que entra en juego allí destruye al enemigo que tiene enfrente. Convierte tu personaje más barato en una eliminación y castiga a quien se compromete primero.
- **Anti-Magic Vault.** Los personajes pierden todas sus habilidades. Un mazo construido sobre activaciones no tiene nada que hacer allí; un mazo de cuerpos simples, de repente, está como en casa.
- **Amplifying Amphitheatre.** Todo el daño se duplica, en ambos sentidos. Una carta de cierre con Trample como [Ellen Trechend](/es/cards/ellen-trechend) termina la partida atravesando la barrera; la del rival, también.
- **Nostradamus' Call.** Los dos mazos se destruyen al inicio de la sexta ronda. Sea cual sea tu plan, tiene que estar cumplido en la quinta.

## Construir teniendo en cuenta las ubicaciones

No puedes elegir el tablero, pero sí construir un mazo que rara vez se quede indefenso en él.

1. **No lo apuestes todo a una sola activación.** Un mazo que solo funciona con On Reveal es un mazo que pierde un carril ante Anti-Magic Vault. Ten algunas cartas que funcionen bien como simples cuerpos.
2. **Lleva una carta de alcance.** Las ubicaciones que golpean barreras (Overloaded Circuit, "Human" Cannon, Soul Artillery) premian a los mazos capaces de cerrar un carril a distancia en lugar de desgastarlo.
3. **Los personajes baratos son los que más ganan.** Cada ubicación que otorga una palabra clave o copia un cuerpo rinde más en una carta de coste dos que en una de coste siete: la ubicación hace la parte cara.
4. **Cuidado con los carriles que castigan a quien se compromete.** The Hill, Wall of Dumpty y The Gallows castigan al jugador que llena primero un carril. Ante un tablero desconocido, la segunda carta en un carril suele ser más segura que la primera.

## Lo que todavía queremos comprobar

Esta lista está transcrita de la base de datos de la comunidad y coincide con la rotación de la Demo 2.0. Todavía no hemos revisado las ubicaciones una por una dentro del juego, como hicimos con las 122 cartas el 22 de septiembre de 2026: cuando lo hagamos, la [página de ubicaciones](/es/locations) lo indicará, con la fecha y el recuento.
`,
  },
  "on-reveal-midrange-guide": {
    title: "On Reveal Mid Range: cómo se juega el mazo midrange de Mulan",
    metaTitle: "On Reveal Mid Range: mazo de Origins TCG",
    excerpt: "Plan de juego, mulligan y ronda a ronda de On Reveal Mid Range, el mazo de Mulan que repite cada On Reveal, para clasificatoria, competitivo y torneos.",
    faq: [
      {
        q: "¿Qué hace Mulan en este mazo?",
        a: "Mulan es un 2/4 de coste 4 con Double Attack y, cuando se activa la habilidad On Reveal de un aliado, la repite. Nueve cartas de la lista tienen un On Reveal, así que convierte cada una de ellas en dos.",
      },
      {
        q: "¿Qué conservas en el mulligan?",
        a: "Una curva que llegue a Mulan en la cuarta ronda: Bagheera en una casilla central, Baby Bear y luego Black Knight o Frog Prince. Vale la pena conservar a Mary cuando esperas una partida larga.",
      },
      {
        q: "¿Qué On Reveal gana más con Mulan?",
        a: "Mowgli, de coste 6, cuyo On Reveal invoca un Baloo 6/6 en otra ubicación al azar: repetido, pone dos Baloo en el tablero. Ellen Trechend y Fairy Godmother también rinden el doble.",
      },
      {
        q: "¿Cómo pruebo el mazo?",
        a: "Abre la página del mazo en OriginsMeta y usa “Abrir en el deck builder”, o “Copiar código del juego” para pegar el código (KGBLDC…) en Origins.",
      },
    ],
    body: `
## El mazo en un párrafo

**On Reveal Mid Range** es una lista **midrange** liderada por [Mulan](/es/cards/mulan), publicada en OriginsMeta el 22 de septiembre de 2026 por Davdas, miembro del staff del sitio, y etiquetada para **clasificatoria**, **competitivo** y **torneos**. La idea es la que el autor expone en la [página del mazo](/es/decks/community/on-reveal-mid-range-772e): Mulan "permite aprovechar al máximo las habilidades On Reveal", y la lista está construida para tener en cada ronda una que valga la pena repetir. Aguanta contra un mazo agresivo y presiona a un mazo de control, porque las mismas cartas compran tiempo y construyen tablero.

## La lista

Veinticinco cartas: la Legendaria más doce cartas con dos copias cada una. Las estadísticas son las de la Demo 2.0, [comprobadas carta por carta en el juego](/es/deck-builder) el 22 de septiembre de 2026.

| Carta | Coste | Qué hace |
| --- | --- | --- |
| [Mulan](/es/cards/mulan) ★ | 4 | 2/4, Double Attack; cuando se activa un On Reveal aliado, se repite |
| [Bagheera](/es/cards/bagheera) | 1 | 1/1; On Reveal en una casilla central obtiene +2⚔️/+2❤️ |
| [Baby Bear](/es/cards/baby-bear) | 2 | 1/1; devuelve 1 de daño cuando un enemigo daña tu barrera aquí, y al morir añade un Papa Bear 4/4 a tu mano |
| [Mary](/es/cards/mary) | 3 | 1/1; On Reveal añade un Little Lamb a la mano, al morir tus Lamb obtienen +3⚔️/+3❤️ de forma permanente |
| [Black Knight](/es/cards/black-knight) | 3 | 2/2; On Reveal inflige 2 de daño al enemigo que tiene enfrente |
| [Frog Prince](/es/cards/frog-prince) | 3 | 2/2; On Reveal, +3⚔️ o +3❤️, a tu elección |
| [Ali Baba](/es/cards/ali-baba) | 3 | 2/3; roba una carta cada vez que daña una barrera del rival |
| [White Queen](/es/cards/white-queen) | 4 | 3/3; On Reveal devuelve CUALQUIER personaje a la mano de su dueño |
| [Fairy Godmother](/es/cards/fairy-godmother) | 5 | 3/3; On Reveal da +3⚔️/+3❤️ a otro aliado |
| [Mowgli](/es/cards/mowgli) | 6 | 2/2; On Reveal invoca a Baloo (6/6) en otra ubicación al azar |
| [Ellen Trechend](/es/cards/ellen-trechend) | 8 | Trample; On Reveal obtiene +3⚔️/+3❤️ por cada carta enemiga en su ubicación |
| [Bullseye](/es/cards/bullseye) | 1 | Hechizo: 3 de daño a CUALQUIER personaje |
| [En Passant](/es/cards/en-passant) | 3 | Hechizo: mueve a un aliado e inflige daño igual a su Poder al personaje que tiene enfrente |

Diez unidades y dos hechizos; nueve de estas cartas llevan un On Reveal. Ese es todo el sentido del mazo: Mulan no es una carta de cierre, es un multiplicador.

## Cómo gana el mazo

Mulan repite el On Reveal de un aliado, así que cada carta jugada después de ella vale el doble. Las tres mejores copias:

- **Mowgli** cuesta seis e invoca un Baloo 6/6 en otra ubicación al azar. Repetido, son dos Baloo: una sola carta que llena dos carriles que no estabas disputando.
- **Ellen Trechend** crece +3⚔️/+3❤️ por cada carta enemiga en su ubicación, y tiene Trample. En un carril concurrido ya es una amenaza por sí sola; con la repetición, el buff se aplica dos veces antes del combate.
- **Fairy Godmother** da +3⚔️/+3❤️ a otro aliado. Las dos activaciones pueden ir al mismo cuerpo o repartirse entre dos, según lo que el rival pueda eliminar.

Mulan también tiene **Double Attack**, así que su propio cuerpo 2/4 intercambia mejor de lo que parece sobre el papel.

## Mulligan

Busca una curva que te lleve a Mulan en la cuarta ronda sin quedarte atrás: **Bagheera** en una casilla central (un 3/3 por un maná), luego **Baby Bear** y luego **Black Knight** o **Frog Prince**. Conserva a **Mary** cuando esperes una partida larga: el Lamb que añade a tu mano es un cuerpo barato y, si Mary muere, los Lamb que ya has jugado crecen de forma permanente.

## Ronda a ronda

1. **Rondas 1–3: ocupar espacio sin sobreextenderse.** Bagheera en el centro, Baby Bear donde esperes los primeros ataques, Black Knight frente a algo que quieras ver muerto. Una carta por carril basta: el mazo quiere un tablero igualado, no lleno, cuando llegue Mulan.
2. **Ronda 4: Mulan.** A partir de aquí, el orden de tus jugadas importa más que las cartas. Pregúntate en cada ronda qué On Reveal vale la pena duplicar, y juégalo en la ubicación de Mulan.
3. **Rondas 5–6: las cartas de valor.** Fairy Godmother y luego Mowgli en la sexta. White Queen es la carta de respuesta de la lista: devuelve CUALQUIER personaje a la mano de su dueño, así que puede quitar de en medio una carta de cierre en la misma ronda en que llega, o recoger a tu propia Mary para volver a jugarla.
4. **Rondas 7–8: cierre.** Ellen Trechend en el carril que el rival ha llenado; En Passant para mover a un aliado, golpear lo que tiene enfrente y abrir camino al daño de Trample.

## Cómo jugar las cartas que compran tiempo

El autor dice que **White Queen, Mary y En Passant** son las cartas "que te hacen ganar tiempo", y son lo que permite al mazo sobrevivir a un inicio agresivo. White Queen no es una eliminación: el personaje vuelve a la mano de su dueño y puede volver a jugarse, así que úsala sobre algo caro o sobre un cuerpo ya potenciado. En Passant es eliminación y reposicionamiento a la vez, y es la respuesta a un bloqueador plantado delante de tu mejor carta.

## Matchups

Los datos de la clasificatoria no son públicos, así que lo que sigue es la lectura que hace OriginsMeta de las listas, no un win rate.

- **Contra mazos agresivos.** Baby Bear y Frog Prince jugado como 2/5 aguantan los carriles; Bullseye se encarga de los cuerpos de tres de Salud por un maná. No gastes White Queen pronto: la querrás para la primera amenaza grande.
- **Contra mazos de control.** Ali Baba es la carta que mantiene tu mano llena mientras presionas una barrera. No lo comprometas todo en una sola ubicación: una limpieza del tablero a la que respondes con un solo Mowgli es un vuelco que puedes permitirte; una mano vacía, no.
- **Contra otras listas midrange.** El mazo juega al mismo juego que [3 Pigs Mid Range](/es/decks/community/3-pigs-mid-range-6311) y [King of Value Trade](/es/decks/community/king-of-value-trade-fd14): gana quien le saca más a cada carta. Duplicar un On Reveal es exactamente eso, así que protege a Mulan y juega los On Reveal baratos antes que ella solo cuando no tengas más remedio.

## Los puntos débiles, en palabras del autor

La página del mazo enumera dos: **una buena curva suele ser esencial** y **puedes quedarte sin respuestas**. Los dos tienen el mismo origen: el mazo no tiene eliminación masiva y solo lleva dos hechizos. Si tienes que elegir entre usar una carta ahora y guardarla para duplicarla más tarde, úsala ahora: Mulan repite lo que juegas, no recupera nada.

## Adónde ir ahora

- La [página del mazo](/es/decks/community/on-reveal-mid-range-772e) tiene la lista con los gráficos de curva de maná y de sagas, las notas del autor, “Abrir en el deck builder” y el código del juego para pegar en Origins.
- Las estadísticas de las cartas son las de la Demo 2.0 con el [parche del 21 de septiembre](/es/news/demo-patch-notes-0921); cada página de carta tiene su propio historial de cambios de equilibrio.
`,
  },
  "king-of-value-trade-guide": {
    title: "King of Value Trade: cómo se juega el mazo midrange de King Arthur",
    metaTitle: "King of Value Trade: mazo de Origins TCG",
    excerpt: "Plan de juego, mulligan y ronda a ronda de King of Value Trade, el mazo midrange de King Arthur construido para ganar cada intercambio dos cartas por una.",
    faq: [
      {
        q: "¿Qué es un intercambio de valor en Origins TCG?",
        a: "Hacer que una de tus cartas responda a dos del rival, o cambiar una carta barata por una cara. Este mazo está construido en torno a esa idea: Shield, First Strike y los buffs hacen que tus personajes sobrevivan al combate que ganan.",
      },
      {
        q: "¿Qué conservas en el mulligan?",
        a: "Bagheera y Roo, que son sólidos en curva, y Musketeer y Shield Maiden para las primeras rondas. Contra mazos agresivos conserva a Cowardly Lion; contra control, a Ali Baba.",
      },
      {
        q: "¿Por qué Roo es bueno tras el parche del 21 de septiembre?",
        a: "El parche de la Demo del 21 de septiembre de 2026 llevó a Roo a 2/3 por dos de maná, manteniendo la palabra clave Move, así que sobrevive a la mayoría de los intercambios de las primeras rondas en lugar de salir perdiendo.",
      },
      {
        q: "¿Spellbook es imprescindible?",
        a: "No. Añade un hechizo al azar cada ronda para tener combustible e imprevisibilidad, pero la página del mazo dice que la lista puede ganar sin él.",
      },
    ],
    body: `
## El mazo en un párrafo

**King of Value Trade** es una lista **midrange** liderada por [King Arthur](/es/cards/king-arthur), publicada en OriginsMeta el 22 de septiembre de 2026 por Davdas, miembro del staff del sitio, y etiquetada para **clasificatoria**. El nombre dice el plan: "casi todas las piezas quieren hacer un dos por uno", es decir, responder a dos cartas del rival con una tuya. Hazlo con la suficiente frecuencia y el tablero pasa a ser tuyo por sí solo, sin necesidad de un único gran turno de cierre.

## La lista

Veinticinco cartas: la Legendaria más doce cartas con dos copias cada una.

| Carta | Coste | Qué hace |
| --- | --- | --- |
| [King Arthur](/es/cards/king-arthur) ★ | 7 | 7/7 con Shield; On Reveal da Shield a tus personajes Good |
| [Bagheera](/es/cards/bagheera) | 1 | 1/1; On Reveal en una casilla central obtiene +2⚔️/+2❤️ |
| [Musketeer](/es/cards/musketeer) | 2 | 2/1 con First Strike |
| [Roo](/es/cards/roo) | 2 | 2/3 con Move |
| [Shahrazad](/es/cards/shahrazad) | 2 | 1/4; cura 1 de daño a tu barrera aquí cada vez que una carta entra en tu mano |
| [Shield Maiden](/es/cards/shield-maiden) | 3 | 3/1 con Shield |
| [Dark Omen](/es/cards/dark-omen) | 3 | Hechizo: destruye a CUALQUIER personaje |
| [Cowardly Lion](/es/cards/cowardly-lion) | 3 | 2/5 con Defender |
| [Ali Baba](/es/cards/ali-baba) | 3 | 2/3; roba una carta cada vez que daña una barrera del rival |
| [Spellbook](/es/cards/spellbook) | 3 | Hechizo: a partir de ahora, un hechizo al azar en la mano cada ronda, que se descarta antes del combate |
| [Lancelot](/es/cards/lancelot) | 4 | 4/4; cada personaje Good que juegas en su ubicación obtiene +2⚔️/+2❤️ |
| [Fairy Godmother](/es/cards/fairy-godmother) | 5 | 3/3; On Reveal da +3⚔️/+3❤️ a otro aliado |
| [Boitata](/es/cards/boitata) | 5 | 5/5; el daño de hechizos y habilidades dirigido a tus barreras golpea en su lugar la barrera del rival de esa ubicación |

Diez unidades y dos hechizos, y diez de las trece cartas son personajes Good: no es casualidad, es lo que hace que la Legendaria valga sus siete de maná.

## Cómo gana el mazo

Tres palabras clave hacen el trabajo.

- **Shield** absorbe el primer daño. King Arthur se lo da a todos tus personajes Good a la vez, y [Shield Maiden](/es/cards/shield-maiden) trae el suyo propio: un 3/1 con Shield intercambia con un 3/3 y se queda en el tablero.
- **First Strike** en [Musketeer](/es/cards/musketeer) significa que el enemigo recibe el daño antes de poder responder: dos de maná que eliminan un cuerpo más grande.
- **Los buffs** de [Lancelot](/es/cards/lancelot) y [Fairy Godmother](/es/cards/fairy-godmother) convierten un combate igualado en uno desigual. Lancelot potencia a cada personaje Good jugado en su ubicación, así que te premia por seguir reforzando el carril en lugar de dispersarte.

[Ali Baba](/es/cards/ali-baba) es el motor: cada vez que daña una barrera, robas. [Shahrazad](/es/cards/shahrazad) es la otra mitad de la misma idea: cura un punto de daño a tu barrera en su ubicación cada vez que una carta entra en tu mano, así que robar te mantiene con vida además de por delante.

## Mulligan

**Bagheera es imprescindible**, y ahora vale la pena conservar a **Roo** en cualquier mano: el [parche de la Demo del 21 de septiembre](/es/news/demo-patch-notes-0921) lo convirtió en un 2/3, así que sobrevive a los intercambios de las primeras rondas. **Musketeer** y **Shield Maiden** te ponen por delante en la segunda y la tercera ronda. Contra un mazo agresivo conserva a **Cowardly Lion**, cuyo Defender aguanta el carril; contra un mazo de control conserva a **Ali Baba**, que convierte un golpe libre a la barrera en cartas. Si esperas una partida larga, conservar **Spellbook** es una decisión razonable.

## Ronda a ronda

1. **Rondas 1–3: intercambiar con ventaja.** Bagheera en el centro, Musketeer frente a un cuerpo de 1 o 2 de Salud, Roo donde quizá quieras moverlo más tarde. Cada combate que puedas ganar sin perder el cuerpo es una carta ganada.
2. **Rondas 4–5: sostener un carril.** Lancelot, y luego juega los personajes Good en su ubicación: cada uno llega +2⚔️/+2❤️ más grande de lo que debería. Boitata en la quinta es un 5/5 que además devuelve contra las barreras del rival el daño de los hechizos enemigos dirigido a las tuyas.
3. **Rondas 6–7: la Legendaria.** King Arthur es un 7/7 con Shield, y su On Reveal da Shield a todo lo Good que ya tengas en el tablero. No lo juegues con el tablero vacío: el valor está en los Shield, no en el cuerpo.
4. **Dark Omen, cuando importe.** Tres de maná para destruir a CUALQUIER personaje es la respuesta a esa carta que no puedes vencer en combate: un cuerpo potenciado, un Defender en el carril equivocado, una Legendaria enemiga.

## Dos notas del autor

- **Fairy Godmother no es solo una carta de cierre.** La página del mazo señala que también puede proteger a Ali Baba, Shahrazad o Cowardly Lion: +3❤️ en el cuerpo adecuado significa que el motor sobrevive otra ronda.
- **Dark Omen tiene que ser preciso.** Con dos copias y ninguna otra eliminación, gastar una en el objetivo equivocado deja viva la amenaza real.

## Matchups

Los datos de la clasificatoria no son públicos, así que esta es la lectura que hace OriginsMeta de las listas, no un win rate.

- **Contra mazos agresivos.** Cowardly Lion y Shahrazad juntos son la red de seguridad: el Defender recibe los golpes y la curación repone el daño que llega a la barrera. No cambies pronto Shield Maiden por un cuerpo de 1 de Salud si viene uno más grande.
- **Contra mazos de control.** Ali Baba, y luego el segundo. La página del mazo lo deja claro: la lista quiere seguir robando mientras el rival busca respuestas. Guarda Dark Omen para la carta que cierra su partida, no para lo primero que juegue.
- **Contra mazos que dañan tus barreras con hechizos** ([Healing Healsing](/es/decks/community/healing-healsing-9411) y otras listas con Boitata). Quien coloca primero a Boitata le da la vuelta a ese daño: con dos copias en la lista, vale la pena guardar una en lugar de perder las dos en el mismo combate.

## Los puntos débiles, en palabras del autor

La página del mazo enumera tres: **ninguna eliminación de área**, **Dark Omen debe usarse con precisión** y **hay que leer el plan del rival**. Los dos primeros se derivan de la lista: aparte de Dark Omen no hay nada que elimine directamente a un personaje, así que un tablero que dejas crecer se queda grande. El tercero es la parte honesta: este mazo construye su valor intercambio a intercambio, y cada intercambio es una decisión.

## Adónde ir ahora

- La [página del mazo](/es/decks/community/king-of-value-trade-fd14) tiene la lista completa con los gráficos, las notas del autor, “Abrir en el deck builder” y el código del juego (KGBLDC…).
- Las estadísticas de las cartas son las de la Demo 2.0 con el [parche del 21 de septiembre](/es/news/demo-patch-notes-0921).
`,
  },
  "dorothy-combo-guide": {
    title: "Dorothy Combo: cómo se juega el mazo move tras el parche del 21 de septiembre",
    metaTitle: "Dorothy Combo: mazo move de Origins TCG",
    excerpt: "El mazo move reconstruido en torno a los buffs del 21 de septiembre: cómo crece Dorothy, qué combos buscar, el mulligan y lo que la lista aún no puede hacer.",
    faq: [
      {
        q: "¿Cómo crece Dorothy?",
        a: "Dorothy puede moverse cada ronda y tiene +1⚔️/+1❤️ por cada vez que un aliado se ha movido en esta partida. El contador abarca toda la partida, no la ronda, así que cada movimiento que hagas, en cualquier lugar, la hace más grande.",
      },
      {
        q: "¿Qué combos de movimiento busca el mazo?",
        a: "Card Soldier, que después de moverse invoca una copia de sí mismo en su casilla anterior; Pegasus, que después de moverse duplica su Poder; y Magic Carpet, que al revelarse mueve a tus otros aliados una casilla a la izquierda o a la derecha.",
      },
      {
        q: "¿Es un mazo competitivo?",
        a: "El autor lo presenta como un mazo fun y de clasificatoria, y dice claramente que probablemente aún no está al nivel de los top tier, pero que tras los buffs del 21 de septiembre algo se está moviendo.",
      },
      {
        q: "¿Cómo pruebo el mazo?",
        a: "Abre la página del mazo en OriginsMeta y usa “Abrir en el deck builder”, o copia el código del juego (KGBLDC…) en Origins.",
      },
    ],
    body: `
## El mazo en un párrafo

**Dorothy Combo** es una lista **combo** liderada por [Dorothy](/es/cards/dorothy), publicada en OriginsMeta el 22 de septiembre de 2026 por Davdas, miembro del staff del sitio, y etiquetada para **clasificatoria** y **fun**. Es el mazo move, reconstruido tras el [parche de la Demo del 21 de septiembre de 2026](/es/news/demo-patch-notes-0921), que potenció, entre otras, a Dorothy, [Roo](/es/cards/roo) y [Magic Carpet](/es/cards/magic-carpet). La valoración del autor está en la [página del mazo](/es/decks/community/dorothy-combo-7503) y la mantenemos tal cual: probablemente todavía no es una lista top tier, pero algo se está moviendo.

## La lista

Veinticinco cartas: la Legendaria más doce cartas con dos copias cada una.

| Carta | Coste | Qué hace |
| --- | --- | --- |
| [Dorothy](/es/cards/dorothy) ★ | 5 | 1/1; puede moverse cada ronda y obtiene +1⚔️/+1❤️ por cada vez que un aliado se ha movido en esta partida |
| [Twister Toss](/es/cards/twister-toss) | 1 | Hechizo: mueve a un aliado |
| [Card Soldier](/es/cards/card-soldier) | 2 | 3/1; después de moverse, invoca una copia de sí mismo en su casilla anterior |
| [Roo](/es/cards/roo) | 2 | 2/3 con Move |
| [Basilisk](/es/cards/basilisk) | 2 | 1/2 con Deathtouch |
| [Pegasus](/es/cards/pegasus) | 3 | 2/4; después de moverse, duplica su Poder |
| [Flying Monkey](/es/cards/flying-monkey) | 3 | 4/1; On Reveal mueve a CUALQUIER otro personaje a una casilla al azar de aquí |
| [Wicked Witch of the West](/es/cards/wicked-witch-of-the-west) | 3 | 1/5; cuando sobrevive al daño, añade un Flying Monkey a tu mano y se mueve una casilla a la izquierda |
| [Kanga](/es/cards/kanga) | 3 | 2/3; antes del combate, los aliados que se movieron en esta ronda obtienen +1⚔️/+1❤️ |
| [En Passant](/es/cards/en-passant) | 3 | Hechizo: mueve a un aliado e inflige daño igual a su Poder al personaje que tiene enfrente |
| [Spellbook](/es/cards/spellbook) | 3 | Hechizo: a partir de ahora, un hechizo al azar en la mano cada ronda, que se descarta antes del combate |
| [Magic Carpet](/es/cards/magic-carpet) | 4 | 3/4; On Reveal mueve a tus otros aliados una casilla a la izquierda, o una casilla a la derecha |
| [Hare](/es/cards/hare) | 5 | 4/1 con First Strike y Move |

Nueve unidades y tres hechizos, y casi todo o se mueve o premia un movimiento.

## Cómo gana el mazo

Dorothy es un 1/1 que cuenta: **+1⚔️/+1❤️ por cada vez que un aliado se ha movido en esta partida**. El contador no se reinicia y cuenta los movimientos en cualquier parte del tablero, así que un hechizo barato como [Twister Toss](/es/cards/twister-toss) nunca se desperdicia: es un maná por un punto permanente en tu Legendaria. Jugada en la quinta ronda después de unos cuantos movimientos, Dorothy llega como un cuerpo de verdad y sigue creciendo en cada ronda posterior, porque se mueve ella misma.

Tres combos son la razón de ser de la lista:

1. **Card Soldier más cualquier movimiento.** Un 3/1 por dos de maná que deja una copia de sí mismo cada vez que se mueve: con Twister Toss o Magic Carpet llena un carril por sí solo.
2. **Pegasus más cualquier movimiento.** Después de moverse duplica su Poder: el 2/4 se convierte en 4/4, y con el +1⚔️ de Kanga antes del combate es un cuerpo de 5 de Poder que el rival había valorado en tres de maná.
3. **Magic Carpet como motor.** Mueve a *todos* tus otros aliados una casilla, en la dirección que elijas: una carta, varias activaciones (una copia de Card Soldier, un Pegasus duplicado, puntos para Dorothy y el buff de Kanga sobre todo lo que se movió).

## Mulligan

El autor no deja ninguna nota sobre el mulligan, así que esta es la lectura de OriginsMeta. Conserva los habilitadores de movimiento baratos, **Twister Toss** y **Roo**, y uno de los dos cuerpos que te recompensan por moverte, **Card Soldier** o **Pegasus**. Magic Carpet es la carta que quieres en la cuarta ronda, no en la mano inicial. Sin ninguna carta barata, una mano que empieza en la tercera ronda es demasiado lenta para un mazo que quiere el contador en marcha desde la primera ronda.

## Ronda a ronda

1. **Rondas 1–2: poner en marcha el contador.** Card Soldier o Roo, y luego Twister Toss sobre él. Cada movimiento es un punto permanente para Dorothy, aunque el tablero parezca tranquilo.
2. **Ronda 3: elegir el carril.** Pegasus, la Bruja o Kanga. [Wicked Witch of the West](/es/cards/wicked-witch-of-the-west) es la que genera por sí sola: un 1/5 que sobrevive a la mayoría de los golpes y, cada vez que lo hace, te da un Flying Monkey en la mano y se mueve una casilla a la izquierda: otro punto para Dorothy.
3. **Ronda 4: Magic Carpet.** Elige la dirección que empuje a tus Card Soldier hacia una casilla libre y lleve a Pegasus a un combate que ahora ganará.
4. **De la ronda 5 en adelante: Dorothy, y luego cerrar.** Hare tiene First Strike y Move: golpea antes de la respuesta y mantiene el contador en marcha. [Basilisk](/es/cards/basilisk) con Deathtouch es la respuesta barata a un cuerpo demasiado grande para combatirlo de igual a igual, y En Passant convierte un Pegasus duplicado en una eliminación.

## Lo que el mazo no puede hacer

El autor enumera dos puntos débiles, y son honestos: **puedes acabar muy atascado con tus cartas** y **algunos combos no son consistentes**. Los dos tienen el mismo origen: [Flying Monkey](/es/cards/flying-monkey) mueve a un personaje a una casilla *al azar*, la copia de Card Soldier va a la casilla que dejó y Magic Carpet lo mueve todo, incluidos los aliados que querías donde estaban. Planifica la dirección antes de jugar la Alfombra y no cuentes con que una casilla concreta esté libre.

## Matchups

Los datos de la clasificatoria no son públicos: esta es una lectura de las listas, no un win rate.

- **Contra mazos agresivos.** La Bruja y Roo aguantan los carriles en las primeras rondas; el Deathtouch de Basilisk responde al primer cuerpo grande. Dorothy puede esperar: es mejor tarde, cuando el contador está alto.
- **Contra mazos de control.** Este es el buen matchup. Las copias de Card Soldier y los Flying Monkey siguen volviendo, así que una sola limpieza no vacía tu tablero. Después de una limpieza, ten un Twister Toss en la mano para reactivar el contador.
- **Contra otros mazos move.** Quien más se mueve consigue la Dorothy más grande, pero Flying Monkey mueve a *cualquier* personaje: úsalo para sacar a un Pegasus enemigo de la casilla donde iba a duplicarse.

## Adónde ir ahora

- La [página del mazo](/es/decks/community/dorothy-combo-7503) tiene la lista completa, los gráficos, las notas del autor, “Abrir en el deck builder” y el código del juego.
- Los buffs de los que nace esta lista están en las [notas del parche del 21 de septiembre](/es/news/demo-patch-notes-0921); MetaShifting sigue cada cambio en [su propia página](/es/metashifting).
`,
  },
  "trick-or-treat-legion-guide": {
    title: "The Trick-or-Treat Legion: cómo jugar el mazo de Legion of the Dead",
    metaTitle: "Trick-or-Treat Legion: mazo de Origins TCG",
    excerpt: "La lista de Legion of the Dead hecha para ser impredecible: cómo funciona el tablero de Zombies, el combo Golden Egg y Boogeyman, el mulligan y los matchups.",
    faq: [
      {
        q: "¿Qué hace Legion of the Dead?",
        a: "Es una Legendaria de tipo hechizo que cuesta 7 de maná: llena tu tablero de Zombies (2⚔️/2❤️). Una carta, todas las casillas libres ocupadas.",
      },
      {
        q: "¿En qué consiste el combo de Golden Egg y Boogeyman?",
        a: "Boogeyman es un 7/7 de 4 de maná cuyo On Reveal destruye al aliado de su ubicación con menos Poder, incluso a sí mismo. Golden Egg es un 0/1 que, al morir, invoca una Golden Goose 5/5 en su casilla: juega primero el Huevo y la habilidad de Boogeyman lo convertirá en una Goose en lugar de matar a uno de tus cuerpos.",
      },
      {
        q: "¿Qué conservas en el mulligan?",
        a: "Bagheera y Thumbelina, idealmente junto a Bullseye. También vale la pena conservar en la mano inicial la pareja Golden Egg más Boogeyman.",
      },
      {
        q: "¿Por qué es importante Mind Palace?",
        a: "El mazo vacía la mano rápido: sin las dos cartas que roba Mind Palace, te quedas sin jugadas antes de que llegue la Legendaria.",
      },
    ],
    body: `
## El mazo en un párrafo

**The Trick-or-Treat Legion** es una lista **evil** liderada por [Legion of the Dead](/es/cards/legion-of-the-dead), publicada en OriginsMeta el 22 de septiembre de 2026 por Davdas, miembro del staff del sitio, y etiquetada para la **ladder**, el juego **competitivo** y los **torneos**. Circulan varias versiones del mazo Legion; esta, en palabras del autor, busca aumentar su imprevisibilidad reuniendo cartas que le "hacen una travesura" al tablero rival en cada ronda. La lista completa y los gráficos están en la [ficha del mazo](/es/decks/community/the-trick-or-treat-legion-72c4).

## La lista

Veinticinco cartas: la Legendaria más doce cartas con dos copias de cada una.

| Carta | Coste | Qué hace |
| --- | --- | --- |
| [Legion of the Dead](/es/cards/legion-of-the-dead) ★ | 7 | Legendaria de tipo hechizo: llena tu tablero de Zombies (2⚔️/2❤️) |
| [Bullseye](/es/cards/bullseye) | 1 | Hechizo: 3 de daño a CUALQUIER personaje |
| [Bagheera](/es/cards/bagheera) | 1 | 1/1; On Reveal en una casilla central obtiene +2⚔️/+2❤️ |
| [Thumbelina](/es/cards/thumbelina) | 1 | 2/2, sin habilidad |
| [Morgiana](/es/cards/morgiana) | 2 | 2/3; impide que se activen TODAS las habilidades On Reveal en su ubicación |
| [Mind Palace](/es/cards/mind-palace) | 2 | Hechizo: roba 2 cartas |
| [Asanbosam](/es/cards/asanbosam) | 3 | 5/5; On Reveal descarta una carta aleatoria de coste par |
| [Golden Egg](/es/cards/golden-egg) | 3 | 0/1; On Death invoca una Golden Goose (5/5) en su casilla |
| [Flying Monkey](/es/cards/flying-monkey) | 3 | 4/1; On Reveal mueve a CUALQUIER otro personaje a una casilla aleatoria de su ubicación |
| [En Passant](/es/cards/en-passant) | 3 | Hechizo: mueve a un aliado e inflige su Poder al personaje de enfrente |
| [Boogeyman](/es/cards/boogeyman) | 4 | 7/7; On Reveal destruye al aliado de su ubicación con menos Poder, incluso a sí mismo |
| [White Queen](/es/cards/white-queen) | 4 | 3/3; On Reveal devuelve a CUALQUIER personaje a la mano de su dueño |
| [Impundulu](/es/cards/impundulu) | 5 | 3/6; cuando ataca añade un Lightning Strike a tu mano, que se descarta antes del combate de la ronda siguiente |

Diez unidades y tres hechizos. Las tres cartas baratas no son relleno: este mazo necesita que el tablero sea suyo antes de que llegue la Legendaria, porque los Zombies solo ocupan casillas *libres*.

## Cómo gana el mazo

Tres cartas hacen el daño —**Boogeyman, Asanbosam e Impundulu**— y todo lo demás existe para protegerlas o abrirles el camino.

- **Boogeyman** es un 7/7 por cuatro de maná, la mejor relación entre coste y estadísticas de la lista, con un inconveniente: al revelarse destruye al aliado de su ubicación con menos Poder, él incluido. Ponlo en un carril vacío y se mata a sí mismo; ponlo junto a un [Golden Egg](/es/cards/golden-egg) y el que muere es el Huevo, que deja una Golden Goose 5/5 en su casilla. Ese es el combo que señala el autor: dos cartas, un 7/7 y un 5/5.
- **Asanbosam** es un 5/5 por tres de maná y, al revelarse, hace que el rival descarte una carta aleatoria de coste par.
- **Impundulu** convierte cada ataque en un [Lightning Strike](/es/cards/lightning-strike) en tu mano: daño repetible, siempre que lo gastes antes del siguiente combate.

La **Legendaria** cierra la partida en lugar de empezarla: a siete de maná, *Llena tu tablero de Zombies* ocupa de golpe todas las casillas libres. Rinde al máximo en la ronda siguiente a un intercambio que te ha vaciado el lado del tablero, o en las dos ubicaciones que no estabas disputando.

## Las "travesuras"

[En Passant](/es/cards/en-passant), [Flying Monkey](/es/cards/flying-monkey) y [White Queen](/es/cards/white-queen) son lo que el autor quiere decir con hacer una travesura en cada ronda.

- **En Passant** mueve a un aliado e inflige su Poder al personaje de enfrente: con Boogeyman o una Golden Goose son entre cinco y siete de daño, con cambio de posición incluido.
- **Flying Monkey** mueve a CUALQUIER otro personaje a una casilla aleatoria de su ubicación: saca del carril a un bloqueador enemigo, o lleva a uno de tus cuerpos adonde está la pelea. La casilla es aleatoria, así que es una travesura, no un plan.
- **White Queen** devuelve a CUALQUIER personaje a la mano de su dueño: un finalizador enemigo desaparece durante una ronda, o tu propio Golden Egg vuelve para jugarse de nuevo junto a un segundo Boogeyman.

[Morgiana](/es/cards/morgiana) es la carta discreta: en su ubicación no se activa ningún On Reveal, de ninguno de los dos bandos. Juégala donde los On Reveal del rival hagan más daño, pero recuerda que también frena los tuyos, incluido el de Boogeyman.

## Mulligan

La nota del autor es breve y clara: **Bagheera y Thumbelina son inicios perfectos junto a Bullseye**, y **Golden Egg más Boogeyman pueden decidir la partida incluso desde la mano inicial**. Bagheera en una casilla central es un 3/3 por un maná; Thumbelina es un simple 2/2 que, por un maná, da presencia en el tablero sin tener que pensarlo.

## Ronda a ronda

1. **Rondas 1–2: ocupa espacio a bajo coste.** Bagheera en el centro, Thumbelina donde esperes pelear, Bullseye sobre cualquier cosa con tres de Salud.
2. **Ronda 3: la primera amenaza.** Asanbosam como 5/5, o el Golden Egg en el carril al que irá Boogeyman en la ronda siguiente.
3. **Ronda 4: Boogeyman.** Junto al Huevo si lo tienes; si no, junto al cuerpo más pequeño que puedas permitirte perder, y nunca en un carril vacío.
4. **Rondas 5–6: presión y cartas.** Impundulu empieza a producir Strikes; Mind Palace rellena la mano. El autor lo dice sin rodeos: sin Mind Palace, el mazo se queda sin cartas demasiado pronto.
5. **Ronda 7: Legion of the Dead.** Cada casilla libre se convierte en un 2/2. Cuenta las casillas antes de jugarla: después de una ronda con muchos intercambios, vale dos o tres cuerpos más.

## Matchups

Los datos de la clasificatoria no son públicos, así que esta es la lectura de OriginsMeta sobre las listas.

- **Contra los mazos que llenan el tablero.** Los Zombies llegan a las casillas libres, así que cuanto más lleno tenga el tablero el rival, menos hace por ti la Legendaria. Usa primero Bullseye y Boogeyman para abrir el tablero, y guarda Flying Monkey para el cuerpo potenciado.
- **Contra los mazos de control.** El descarte de Asanbosam y los Strikes de Impundulu son la presión que no depende de que el tablero sobreviva. Guárdate un Boogeyman para después de una limpieza: un 7/7 por cuatro de maná es la forma más rápida de reconstruir.
- **Contra los mazos On Reveal** (por ejemplo [On Reveal Mid Range](/es/decks/community/on-reveal-mid-range-772e), que repite cada On Reveal con Mulan). Aquí es donde Morgiana se gana su sitio: ponla en la ubicación donde el rival acumula habilidades, acepta que allí también se detienen tus On Reveal y pelea los otros dos carriles con normalidad.

## Los puntos débiles, en palabras del autor

Son dos, según la ficha del mazo: **Mind Palace es muy importante para no quedarte sin cartas demasiado pronto** y **Boogeyman necesita un objetivo válido, o Morgiana**. Vale la pena repetir el segundo: el cuerpo de 7/7 solo es bueno si en esa ubicación hay otra cosa con menos Poder. El Golden Egg es el seguro más barato; los Zombies de la Legendaria, el de la fase final.

## Adónde ir ahora

- La [ficha del mazo](/es/decks/community/the-trick-or-treat-legion-72c4) tiene la lista con los gráficos, las notas del autor, “Abrir en el deck builder” y el código del juego (KGBLDC…).
- Las estadísticas de las cartas son las de la Demo 2.0 con el [parche del 21 de septiembre](/es/news/demo-patch-notes-0921).
`,
  },
  "three-pigs-midrange-guide": {
    title: "3 Pigs Mid Range: cómo jugar el mazo midrange de Three Not So Little Pigs",
    metaTitle: "3 Pigs Mid Range: guía del mazo de Origins TCG",
    excerpt: "Plan de juego, mulligan y ronda a ronda de 3 Pigs Mid Range, el mazo midrange liderado por Three Not So Little Pigs, para ladder y competitivo.",
    faq: [
      {
        q: "¿Qué Legendaria lidera 3 Pigs Mid Range?",
        a: "Three Not So Little Pigs, un 3/3 de 7 de maná con Trample: su On Reveal invoca un Not So Little Pig con Trample en cada una de las otras ubicaciones, así que una sola carta pone un cuerpo en cada carril.",
      },
      {
        q: "¿Qué conservas en el mulligan?",
        a: "Busca siempre Bagheera, Ali Baba, Big Bad Wolf y Rumple. Contra mazos con cartas peligrosas de 4 de Salud, como Van Helsing o Glinda, conserva también Axe Throw.",
      },
      {
        q: "¿Cómo cierra el mazo una partida?",
        a: "Con En Passant, que mueve a un aliado y golpea al personaje de enfrente; con Ellen Trechend, cuyo Trample hace pasar el daño hasta la barrera; y con los Lightning Strikes que Impundulu añade a tu mano cada vez que ataca.",
      },
      {
        q: "¿Cómo pruebo el mazo?",
        a: "Abre la ficha del mazo en OriginsMeta y pulsa “Abrir en el deck builder”, o “Copiar código del juego” para pegar el código del juego (KGBLDC…) en Origins. El deck builder comprueba la regla de 1 Legendaria + 12 cartas × 2.",
      },
    ],
    body: `
## El mazo en un párrafo

**3 Pigs Mid Range** es el segundo mazo publicado en OriginsMeta por Davdas, miembro del staff del sitio, el 15 de septiembre de 2026. Es una lista **midrange** liderada por [Three Not So Little Pigs](/es/cards/three-not-so-little-pigs), etiquetada para la **ladder** y el juego **competitivo**. La idea es sencilla: dominar el tablero en las primeras rondas, tomar ventaja en al menos una ubicación y luego cerrar con cartas que castigan al rival que se cree a salvo detrás de una barrera. La lista completa, los gráficos de composición y el código del juego están en la [ficha del mazo](/es/decks/community/3-pigs-mid-range-6311); esta guía explica cómo pilotarlo. Una segunda guía trata los [matchups, las interacciones clave y Conquest](/es/guides/three-pigs-midrange-matchups).

## La lista

Veinticinco cartas: la Legendaria más doce cartas con dos copias de cada una.

| Carta | Coste | Función |
| --- | --- | --- |
| [Three Not So Little Pigs](/es/cards/three-not-so-little-pigs) ★ | 7 | Legendaria: Trample y, con su On Reveal, invoca un Not So Little Pig con Trample en cada una de las otras ubicaciones |
| [Bagheera](/es/cards/bagheera) | 1 | Carta de un maná que crece si se juega en una casilla central |
| [Rumple](/es/cards/rumple) | 2 | 2/2 que te da +1 de maná en la ronda siguiente |
| [Axe Throw](/es/cards/axe-throw) | 2 | 4 de daño a cualquier personaje |
| [Mind Palace](/es/cards/mind-palace) | 2 | Roba 2 cartas |
| [Piglet](/es/cards/piglet) | 2 | On Reveal: potencia a los demás aliados de su ubicación |
| [Big Bad Wolf](/es/cards/big-bad-wolf) | 3 | 3/3 que obtiene +1/+1 después de cada combate |
| [Wicked Witch of the West](/es/cards/wicked-witch-of-the-west) | 3 | 1/5: cuando sobrevive al daño, añade un Flying Monkey a tu mano y se mueve una casilla a la izquierda |
| [En Passant](/es/cards/en-passant) | 3 | Mueve a un aliado e inflige daño igual a su Poder al personaje de enfrente |
| [Ali Baba](/es/cards/ali-baba) | 3 | 2/3 que roba una carta cuando daña la barrera rival |
| [Frog Prince](/es/cards/frog-prince) | 3 | Elige +3 de Poder o +3 de Salud al revelarse |
| [Impundulu](/es/cards/impundulu) | 5 | 3/6: cada vez que ataca, añade un Lightning Strike a tu mano |
| [Ellen Trechend](/es/cards/ellen-trechend) | 8 | Trample; con su On Reveal crece por cada carta enemiga de su ubicación |

Nueve unidades y tres hechizos. Todo salvo Impundulu, los Pigs y Ellen Trechend cuesta tres de maná o menos, y por eso el autor dice que la curva es "muy sólida": siempre hay algo que jugar de la ronda uno a la cuatro.

## Cómo gana el mazo

El plan, según la ficha del mazo: tomar el control del tablero en las primeras rondas, ponerse por delante en al menos una ubicación y después cerrar con tres cartas.

- **En Passant** mueve a un aliado e inflige daño igual a su Poder al personaje de enfrente: despeja el camino a uno de tus cuerpos grandes o convierte un Big Bad Wolf crecido en eliminación.
- **Ellen Trechend** tiene Trample y, al revelarse, crece por cada carta enemiga de su ubicación: cuanto más haya invertido el rival en un carril, más fuerte golpea, y el Trample hace pasar el daño sobrante a través del bloqueador hasta la barrera. La ficha del mazo la llama "un finalizador al borde de lo ilegal".
- **Impundulu**, si has jugado bien las primeras rondas, te recompensa con un Lightning Strike cada vez que ataca. Cada Strike debe usarse antes del siguiente combate o se descarta, así que reserva dos de maná cada ronda para usarlo.

La Legendaria es el puente entre las dos fases. Por siete de maná, Three Not So Little Pigs pone un cerdito con Trample en cada una de las otras dos ubicaciones con una sola carta, además de su propio cuerpo de 3/3 con Trample. Jugada en curva, rellena todo el tablero la ronda antes de que Ellen Trechend entre en juego.

## Mulligan

Busca siempre **Bagheera, Ali Baba, Big Bad Wolf y Rumple**: dan un buen inicio en curva y apoyan a los cerditos que ya están en juego. Contra mazos con cartas peligrosas de 4 de Salud, como Van Helsing o Glinda, conserva también **Axe Throw**: inflige exactamente cuatro de daño a cualquier personaje. Ellen Trechend e Impundulu no son lo que quieres en la mano inicial: el mazo las encuentra más tarde con Mind Palace y Ali Baba.

## Ronda a ronda

1. **Rondas 1–3: toma el tablero.** Bagheera en una casilla central, luego Rumple o Piglet, luego una carta de tres. Rumple en la ronda dos significa cuatro de maná en la ronda tres, o sea, un Wolf más Bagheera o una Witch más un hechizo. La Wicked Witch of the West es el muro del mazo: con cinco de Salud sobrevive a la mayoría de los golpes tempranos, y cada vez que lo hace recibes un Flying Monkey en la mano y ella se desplaza una casilla a la izquierda.
2. **Rondas 4–6: elige un carril y presiona.** Ali Baba quiere golpear una barrera: cada vez que lo hace, robas. Frog Prince es o un 5/2 que intercambia a su favor o un 2/5 que aguanta un carril; elige después de ver lo que ha revelado el rival. Impundulu baja en la ronda cinco y empieza a producir Lightning Strikes desde su primer ataque.
3. **Rondas 7–8: los finalizadores.** Los Pigs en la siete (o en la seis con un Rumple la ronda anterior), Ellen Trechend en la ocho, en la ubicación donde el rival tenga más cartas. Usa En Passant en la misma ronda para llevar una amenaza adonde no se la espera, o para quitar de en medio al único bloqueador que estorba.

## Mantenerse en curva

La ficha del mazo es clara sobre el principal punto débil: "salirse de la curva reduce mucho su potencial". La lista no tiene limpieza de tablero ni nada que cure tus barreras, así que cada ronda que te saltas es una ronda que el rival obtiene gratis. Dos hábitos ayudan. No te guardes Rumple para un turno "perfecto": el maná extra vale más al principio. Y no retengas los Lightning Strikes en la mano esperando un objetivo mejor: un Strike usado contra una barrera sigue siendo tres de daño que, si no, perderías.

## Adónde ir ahora

- La [ficha del mazo](/es/decks/community/3-pigs-mid-range-6311) tiene la lista con los gráficos de curva de maná, sagas y palabras clave, las notas del autor, el botón “Abrir en el deck builder” para el [deck builder](/es/deck-builder) y el código del juego (KGBLDC…) para pegar en Origins.
- [Matchups, interacciones clave y Conquest](/es/guides/three-pigs-midrange-matchups) es la segunda parte de esta guía.
- Las estadísticas de las cartas son las del parche 0.6.3 del playtest. Varias cartas de esta lista se retocaron en los parches 0.6.2 y 0.6.3: consulta el historial de cambios de equilibrio en la ficha de cada carta.
`,
  },
  "three-pigs-midrange-matchups": {
    title: "3 Pigs Mid Range: matchups, interacciones clave y Conquest",
    metaTitle: "3 Pigs Mid Range: matchups en Origins TCG",
    excerpt: "Segunda parte de la guía de 3 Pigs Mid Range: las interacciones que ganan partidas, cómo jugar los principales matchups, los errores que evitar y Conquest.",
    faq: [
      {
        q: "¿Qué hace Ellen Trechend contra un tablero lleno?",
        a: "Al revelarse crece por cada carta enemiga de su ubicación y tiene Trample, así que un carril que el rival ha llenado se convierte en su mejor objetivo: el daño que supera la Salud del bloqueador va a la barrera.",
      },
      {
        q: "¿Cómo se juega contra los mazos de Van Helsing?",
        a: "Guarda Axe Throw para Van Helsing, que tiene cuatro de Salud, presiona pronto, antes de que Forbidden Knowledge se pueda lanzar con ocho de maná, y apunta los Lightning Strikes a los personajes en lugar de a las barreras mientras Boitata esté en el tablero.",
      },
      {
        q: "¿Se pueden jugar juntos 3 Pigs Mid Range y Healing Healsing en Conquest?",
        a: "Sí. Los dos mazos tienen Legendarias distintas y comparten una sola carta, Ali Baba, así que se diferencian en once cartas, más de las nueve exigidas en el Big Bob's Playtest Battle.",
      },
    ],
    body: `
## Antes de empezar

Esta es la segunda parte de la guía de **3 Pigs Mid Range**, el mazo midrange liderado por [Three Not So Little Pigs](/es/cards/three-not-so-little-pigs) que Davdas, del staff de OriginsMeta, publicó el 15 de septiembre de 2026. La [primera parte](/es/guides/three-pigs-midrange-guide) trata la lista, el plan de juego, el mulligan y el juego ronda a ronda. Aquí vemos las interacciones que deciden las partidas, los matchups y el formato para el que está etiquetado el mazo. Las notas del autor están en la [ficha del mazo](/es/decks/community/3-pigs-mid-range-6311); la lectura de los matchups que sigue es de OriginsMeta y se basa en los textos de las cartas del parche 0.6.3.

## Cinco interacciones que conviene conocer

1. **Rumple hacia los finalizadores.** Rumple te da +1 de maná en la ronda siguiente. Jugado en la ronda cinco, te permite revelar Three Not So Little Pigs en la ronda seis, una ronda entera antes de que el rival espere una carta de siete; jugado en la ronda seis, pone a Ellen Trechend en el tablero en la ronda siete.
2. **La Wicked Witch y su Flying Monkey.** La Witch es un 1/5: rara vez muere de un solo golpe, y cada vez que sobrevive al daño recibes un [Flying Monkey](/es/cards/flying-monkey) en la mano y ella se mueve una casilla a la izquierda. El On Reveal del Monkey mueve a cualquier otro personaje, tuyo o del rival, a una casilla aleatoria de su ubicación: úsalo para sacar a un bloqueador enemigo del carril por el que entras con Trample, o para llevar un Wolf adonde está la pelea.
3. **En Passant sobre un cuerpo crecido.** El hechizo mueve a un aliado e inflige daño igual a su Poder al personaje de enfrente. Con un Big Bad Wolf que ha combatido dos veces son cinco de daño más un cambio de posición; con Ellen Trechend es una eliminación que además lleva su Trample adonde la barrera está más débil. También es la respuesta a un bloqueador plantado delante de uno de tus cerditos.
4. **Los Lightning Strikes de Impundulu.** Cada ataque añade un [Lightning Strike](/es/cards/lightning-strike), dos de maná por tres de daño a cualquier personaje o barrera, que debe usarse antes del siguiente combate. Son tres de daño repetibles y dirigidos: suficientes para la mayoría de las cartas de las primeras rondas del pool actual, o un golpe directo a una barrera cuando el tablero ya es tuyo.
5. **Piglet sobre los cerditos.** El On Reveal de Piglet potencia a los demás aliados de su ubicación. La ronda después de los Pigs, un Piglet junto a un Not So Little Pig crea un cuerpo con Trample que golpea más fuerte: la ficha del mazo señala que las cartas del mulligan "apoyan a los cerditos que ya están en el tablero".

## Matchups

Los datos de la clasificatoria todavía no son públicos, así que lo que sigue es una lectura de las listas, no un win rate.

**Contra el control de Van Helsing, por ejemplo [Healing Healsing](/es/decks/community/healing-healsing-9411), del mismo autor.** Es el matchup en el que piensa la nota del mulligan cuando dice que conserves Axe Throw: Van Helsing es un 3/4, y cuatro de daño lo quitan de en medio antes de que sus Tools empiecen a llegar en cada combate. Haz daño pronto, porque el mazo de control quiere llegar a ocho de maná para Forbidden Knowledge, que destruye a todos los personajes del tablero, tuyos y suyos. No juegues los Pigs y Ellen Trechend en la misma ventana: guarda un finalizador para la ronda posterior a la limpieza. Mientras Boitata esté en juego, el daño de hechizos a sus barreras se inflige en cambio a las tuyas, así que apunta los Lightning Strikes a los personajes hasta que desaparezca.

**Contra los tableros llenos de unidades (listas estilo Swarm, Mulan).** Cuantas más unidades ponen, más grande se hace Ellen Trechend: crece por cada carta enemiga de su ubicación. Mantén la Witch como muro en el carril que están inundando, juega Frog Prince como 2/5 en lugar de como 5/2, y guarda Axe Throw para la carta que potencia a las demás. [Mulan](/es/cards/mulan) repite las habilidades On Reveal de sus aliados, así que es el objetivo prioritario.

**Contra otros mazos midrange (King Arthur, Robin Hood).** Decide el tempo: quien se sale de la curva pierde. Aquí Rumple rinde al máximo, y los Strikes de Impundulu marcan la diferencia con el tablero igualado. El On Reveal de [Robin Hood](/es/cards/robin-hood) inflige 2 de daño a todos los enemigos, lo que mata a Bagheera, a Piglet y a un Rumple recién jugado, pero no a la Witch ni a un Frog Prince jugado como 2/5: a ocho de maná, no sobrecargues un carril con unidades pequeñas. [King Arthur](/es/cards/king-arthur) da Shield a los personajes Good, así que guarda Axe Throw para cuando el Shield ya se haya gastado.

## Errores que evitar

- **Jugar los Pigs como rescate.** La Legendaria invoca cerditos en casillas aleatorias de las otras ubicaciones: rinde al máximo cuando esos carriles ya tienen un Wolf o una Witch junto a los que pelear, no cuando todo está ya perdido.
- **Guardarse Rumple.** Es un cuerpo de 2/2 con un bonus, y el bonus vale más entre las rondas dos y seis.
- **Desperdiciar Lightning Strikes.** Se descartan antes del siguiente combate: un Strike a una barrera es mejor que un Strike perdido.
- **Olvidar los puntos débiles.** La ficha del mazo los enumera: sin eliminación masiva y sin curación para tus barreras. No entres en una carrera de daño contra un mazo que cura salvo que ya vayas por delante en el tablero.

## Conquest y la etiqueta "competitivo"

El mazo está etiquetado tanto para la ladder como para el juego competitivo. En el formato Conquest que se usó en el Big Bob's Playtest Battle, y que se espera para el torneo del Steam Next Fest, se registran varios mazos con Legendarias distintas y al menos nueve cartas diferentes entre dos mazos cualesquiera. 3 Pigs Mid Range hace pareja de forma natural con la otra lista del mismo autor, [Healing Healsing](/es/decks/community/healing-healsing-9411): Legendarias distintas, y la única carta que comparten es Ali Baba, así que se diferencian en once cartas. El [deck builder](/es/deck-builder) cuenta la diferencia por ti en el modo torneo.
`,
  },
  "healing-healsing-guide": {
    title: "Healing Healsing: cómo jugar el mazo de control de Van Helsing",
    metaTitle: "Healing Healsing: guía del mazo de Origins TCG",
    excerpt: "Plan de juego, mulligan y ronda a ronda de Healing Healsing, el mazo de control de Van Helsing que cura, roba cartas y reinicia el tablero.",
    faq: [
      {
        q: "¿Qué Legendaria lidera Healing Healsing?",
        a: "Van Helsing, un 3/4 de 4 de maná: antes de cada combate añade Van Helsing's Tools a tu mano si no la tienes, una carta de Elige uno que juega Holy Water, Silver Bullet, Garlic o Wooden Stake.",
      },
      {
        q: "¿Qué conservas en el mulligan?",
        a: "Conserva Ali Baba, Baby Bear, Scarecrow, Van Helsing y Spellbook; contra aggro, conserva también Jill. Shahrazad y Phuong Hoang no son lo que quieres en las primeras rondas.",
      },
      {
        q: "¿Cuándo se lanza Forbidden Knowledge?",
        a: "Con ocho de maná, es decir, a partir de la ronda ocho o nueve, idealmente en una ronda en la que el rival revele primero: él juega sus cartas y luego el hechizo destruye a todos los personajes del tablero.",
      },
      {
        q: "¿Cómo gana el mazo si también destruye su propio tablero?",
        a: "Por ventaja de cartas: Spellbook, Scarecrow y Ali Baba mantienen la mano llena, Baby Bear deja tras de sí a Papa Bear al morir, Jekyll se transforma en Hyde en la mano y las curaciones hacen crecer a Phuong Hoang hasta que el rival se queda sin respuestas.",
      },
    ],
    body: `
## El mazo en un párrafo

**Healing Healsing** fue el primer mazo publicado en OriginsMeta, el 15 de septiembre de 2026, por Davdas, miembro del staff del sitio. Es una lista de **control** liderada por [Van Helsing](/es/cards/van-helsing), etiquetada para la **ladder**. El plan es sobrevivir a las primeras rondas sacando valor, curar el daño mientras [Phuong Hoang](/es/cards/phuong-hoang) crece con cada curación y reiniciar el tablero con [Forbidden Knowledge](/es/cards/forbidden-knowledge) cuando tengas ocho de maná. La lista completa, los gráficos de composición y el código del juego están en la [ficha del mazo](/es/decks/community/healing-healsing-9411); esta guía explica cómo pilotarlo. Una segunda guía trata los [matchups, las interacciones clave y los errores que evitar](/es/guides/healing-healsing-matchups).

## La lista

Veinticinco cartas: la Legendaria más doce cartas con dos copias de cada una.

| Carta | Coste | Función |
| --- | --- | --- |
| [Van Helsing](/es/cards/van-helsing) ★ | 4 | Legendaria: antes del combate añade Van Helsing's Tools a tu mano si no la tienes |
| [Baby Bear](/es/cards/baby-bear) | 2 | Golpea a los enemigos que dañan tu barrera; On Death añade Papa Bear a tu mano |
| [Scarecrow](/es/cards/scarecrow) | 2 | On Reveal: roba una carta |
| [Shahrazad](/es/cards/shahrazad) | 2 | 1/4: cura 1 de daño de tu barrera cada vez que una carta entra en tu mano |
| [Ali Baba](/es/cards/ali-baba) | 3 | 2/3 que roba una carta cuando daña la barrera rival |
| [Jill](/es/cards/jill) | 3 | 2/4: cura 2 de daño de tu barrera cada vez que recibe daño |
| [Spellbook](/es/cards/spellbook) | 3 | Durante el resto de la partida, un hechizo aleatorio en la mano al inicio de cada ronda |
| [Phuong Hoang](/es/cards/phuong-hoang) | 4 | Rebirth, Move; obtiene +1/+1 cada vez que se cura a un aliado o una barrera |
| [Jekyll](/es/cards/jekyll) | 4 | On Reveal cura 3; si sigue en la mano después del combate, se convierte en Hyde, un 5/3 con Trample |
| [Searing Light](/es/cards/searing-light) | 4 | 4 de daño a un enemigo y 4 de curación a tu barrera de esa ubicación |
| [Boitata](/es/cards/boitata) | 5 | 5/5: el daño de hechizos y habilidades a tus barreras se inflige en cambio a la barrera rival |
| [Tin Woodman](/es/cards/tin-woodman) | 6 | On Reveal cura 8 a cualquier otro personaje o barrera de su ubicación |
| [Forbidden Knowledge](/es/cards/forbidden-knowledge) | 8 | Destruye a todos los personajes |

Nueve unidades y tres hechizos; casi todo cuesta entre dos y cuatro, con Boitata, Tin Woodman y Forbidden Knowledge en la parte alta. Tres cartas roban, cinco curan y una limpia el tablero.

## Cómo gana el mazo

El plan de la ficha del mazo, en cuatro pasos:

1. **Controlar las primeras rondas** sacando valor rápido con Spellbook y Ali Baba.
2. **Llegar a la ronda ocho o nueve** y lanzar Forbidden Knowledge para tomar la iniciativa. Intenta lanzarlo en una ronda en la que el rival sea el primero en revelar, para que sus cartas estén en el tablero cuando se resuelva el hechizo.
3. **Ganar por ventaja de cartas y valor.** El mazo rival debería quedarse sin recursos mientras tú aún tienes curación suficiente para hacer crecer el daño de Phuong Hoang.
4. **Mantener el control.** Las cartas extra te permiten controlar el tablero durante mucho tiempo.

Dos motores hacen que todo funcione. El primero son las **cartas que entran en tu mano**: Van Helsing añade sus Tools antes de cada combate, Spellbook añade un hechizo al inicio de cada ronda, Scarecrow y Ali Baba roban, y cada una de esas cartas cura 1 gracias a Shahrazad. El segundo es la **curación**: cada curación, desde el único punto de Shahrazad hasta los ocho de Tin Woodman, da +1/+1 a Phuong Hoang. Una Phuong que lleva unas cuantas rondas en el tablero es la verdadera amenaza del mazo, y además tiene las palabras clave Rebirth y Move (consulta su ficha).

## Van Helsing's Tools

La Legendaria en sí es un 3/4 por cuatro de maná. Lo que importa es la carta que añade antes de cada combate cuando no la tienes ya: [Van Helsing's Tools](/es/cards/van-helsings-tools), gratis desde el parche 0.6.2, te deja elegir uno de cuatro efectos.

- [Holy Water](/es/cards/holy-water): quita todas las habilidades a cualquier personaje.
- [Silver Bullet](/es/cards/silver-bullet): daño a cualquier personaje.
- [Garlic](/es/cards/garlic): Stun a cualquier personaje.
- [Wooden Stake](/es/cards/wooden-stake): destruye a cualquier personaje dañado.

"Si no la tienes" es la cláusula que hay que recordar: usa las Tools cada ronda o Van Helsing deja de añadirlas. Wooden Stake es la eliminación de objetivo único que, según la ficha del mazo, la lista no tiene en ninguna otra carta: daña a un personaje con el golpe de Baby Bear, con Searing Light o con la Silver Bullet, y luego clávale la estaca.

## Mulligan

Conserva **Ali Baba, Baby Bear, Scarecrow, Van Helsing y Spellbook**. Contra mazos agresivos, conserva también **Jill**: cura 2 de tu barrera cada vez que recibe daño. Shahrazad y Phuong Hoang no sirven en las primeras rondas: son la recompensa, no la preparación, así que devuélvelas al mazo.

## Ronda a ronda

1. **Rondas 1–3: preparación.** Scarecrow o Baby Bear en la dos, Spellbook o Ali Baba en la tres. Spellbook es la mejor jugada de la ronda tres: a partir de ahí empiezas cada ronda con un hechizo extra, y Shahrazad convierte cada uno de ellos en una curación.
2. **Rondas 4–5: Van Helsing y las primeras curaciones.** Van Helsing en la cuatro, o Jekyll para curar una unidad o una barrera dañada. Phuong Hoang baja cuando hay al menos una fuente de curación en el tablero. Boitata en la cinco: a partir de ahí, el daño de hechizos y habilidades a cualquiera de tus barreras se inflige en cambio a la barrera rival de esa ubicación.
3. **Rondas 6–7: estabilizar.** Los ocho puntos de curación de Tin Woodman en la barrera bajo presión, Searing Light sobre la mayor amenaza, las Tools en cada combate.
4. **Ronda 8 o 9: Forbidden Knowledge.** Todo muere, en los dos lados. Tu lado pierde menos: Baby Bear te deja Papa Bear en la mano, un Jekyll guardado en la mano ya se ha convertido en Hyde, las Tools vuelven antes del siguiente combate y llevas toda la partida robando más cartas que el rival.

## Adónde ir ahora

- La [ficha del mazo](/es/decks/community/healing-healsing-9411) tiene la lista con los gráficos de curva de maná y palabras clave, las notas del autor, el botón “Abrir en el deck builder” para el [deck builder](/es/deck-builder) y el código del juego (KGBLDC…) para pegar en Origins.
- [Matchups, interacciones clave y errores que evitar](/es/guides/healing-healsing-matchups) es la segunda parte de esta guía.
- Las estadísticas de las cartas son las del parche 0.6.3 del playtest. Scarecrow, Van Helsing's Tools y otras cartas de esta lista cambiaron en los parches 0.6.2 y 0.6.3: consulta el historial de cambios de equilibrio en la ficha de cada carta.
`,
  },
  "healing-healsing-matchups": {
    title: "Healing Healsing: matchups, interacciones clave y errores que evitar",
    metaTitle: "Healing Healsing: matchups en Origins TCG",
    excerpt: "Guía de Healing Healsing, segunda parte: las interacciones de curación y robo, los principales matchups, los errores que hacen perder contra aggro y Conquest.",
    faq: [
      {
        q: "¿Cuál es la interacción más fuerte de Healing Healsing?",
        a: "Shahrazad con Van Helsing y Spellbook: las Tools antes de cada combate y el hechizo al inicio de cada ronda curan 1 cada uno gracias a Shahrazad, y cada curación da +1/+1 a Phuong Hoang.",
      },
      {
        q: "¿Cómo se juega contra 3 Pigs Mid Range?",
        a: "No llenes un carril: Ellen Trechend crece por cada carta enemiga de su ubicación. Guarda Boitata para los Lightning Strikes, cura el daño que hace el Trample de los cerditos y reserva Forbidden Knowledge para la ronda después de que bajen los Pigs.",
      },
      {
        q: "¿Qué hace perder partidas con este mazo?",
        a: "Lanzar Forbidden Knowledge demasiado pronto, dejar Van Helsing's Tools en la mano, con lo que él deja de añadirlas, y jugar Phuong Hoang antes de que haya algo que curar.",
      },
    ],
    body: `
## Antes de empezar

Esta es la segunda parte de la guía de **Healing Healsing**, el mazo de control de Van Helsing que Davdas, del staff de OriginsMeta, publicó el 15 de septiembre de 2026 como primer mazo de la comunidad del sitio. La [primera parte](/es/guides/healing-healsing-guide) trata la lista, el plan de juego, el mulligan y el juego ronda a ronda. Aquí vemos las interacciones que deciden las partidas, los matchups y los errores que más caro se pagan. Las notas del autor están en la [ficha del mazo](/es/decks/community/healing-healsing-9411); la lectura de los matchups que sigue es de OriginsMeta y se basa en los textos de las cartas del parche 0.6.3.

## Cinco interacciones que conviene conocer

1. **Shahrazad y todo lo que te pone una carta en la mano.** [Shahrazad](/es/cards/shahrazad) cura 1 de daño de tu barrera en su ubicación cada vez que una carta entra en tu mano. Van Helsing añade sus Tools antes de cada combate, Spellbook añade un hechizo al inicio de cada ronda, Scarecrow y Ali Baba roban, la muerte de Baby Bear añade Papa Bear. Con Shahrazad y Van Helsing en el tablero curas en cada ronda sin gastar ni una carta.
2. **Cada curación alimenta a Phuong Hoang.** [Phuong Hoang](/es/cards/phuong-hoang) obtiene +1/+1 cada vez que se cura a un aliado o una barrera. El On Reveal de Tin Woodman es una sola curación de ocho puntos, así que es un solo +1/+1; las muchas curaciones pequeñas de Shahrazad valen más para Phuong que una grande.
3. **Jekyll y Hyde.** El On Reveal de [Jekyll](/es/cards/jekyll) cura 3 a cualquier otro personaje o barrera de su ubicación. Si sigue en la mano después del combate, se convierte en [Hyde](/es/cards/hyde), un 5/3 con Trample, y un Hyde que se queda en la mano vuelve a ser Jekyll: la misma carta es un sanador o un finalizador según cuándo la juegues.
4. **Boitata contra el burn.** Si un hechizo o una habilidad fuera a dañar una de tus barreras, [Boitata](/es/cards/boitata) inflige en su lugar ese daño a la barrera rival de esa ubicación. Contra mazos que cierran las partidas con Lightning Strike o Searing Light, Boitata convierte su alcance en el tuyo.
5. **La familia de Baby Bear.** [Baby Bear](/es/cards/baby-bear) golpea a cualquier enemigo que dañe tu barrera en su ubicación y, al morir, añade [Papa Bear](/es/cards/papa-bear) a tu mano; Papa Bear golpea más fuerte y añade [Mama Bear](/es/cards/mama-bear) al morir, y Mama Bear destruye a los enemigos que dañan tu barrera. Tres cuerpos por una sola carta de dos de maná, y lo mejor que puedes tener en el tablero cuando se resuelve Forbidden Knowledge.

## Matchups

Los datos de la clasificatoria todavía no son públicos, así que lo que sigue es una lectura de las listas, no un win rate.

**Contra 3 Pigs Mid Range (el [otro mazo](/es/decks/community/3-pigs-mid-range-6311) del mismo autor) y otras listas midrange.** Su finalizador, Ellen Trechend, crece por cada carta enemiga de su ubicación: reparte tus unidades en lugar de amontonarlas en un carril. Los Lightning Strikes de Impundulu son justo la razón de ser de Boitata. Axe Throw inflige cuatro de daño, que es exactamente la Salud de Van Helsing: cuenta con que le darán respuesta y no dependas solo de él para eliminar amenazas. Los Pigs bajan a siete de maná y llenan cada carril de Trample: esa es la ronda para la que conviene guardar Forbidden Knowledge, una ronda después.

**Contra los mazos aggro y los que llenan el tablero.** Es el matchup en el que piensa la nota del mulligan cuando dice que conserves Jill: cada vez que recibe daño, cura 2 de tu barrera. Baby Bear castiga a cada atacante que pasa, Jekyll cura lo que importa y los ocho puntos de Tin Woodman dejan una barrera como nueva. No persigas sus unidades una a una con las Tools; estabiliza la barrera, llega a ocho de maná y deja que Forbidden Knowledge se lleve todo el tablero.

**Contra otros mazos de control.** Decide la ventaja de cartas, y este mazo roba más que la mayoría: Spellbook es la carta que hay que proteger y jugar primero. Guarda Hyde para un carril que haya quedado vacío, y reserva Holy Water para una Legendaria cuya habilidad sostenga el mazo rival, como [Mulan](/es/cards/mulan), que repite las habilidades On Reveal de sus aliados, o la [Queen of Hearts](/es/cards/queen-of-hearts), que repite las On Death de los suyos.

## Errores que evitar

- **Lanzar Forbidden Knowledge demasiado pronto.** El consejo de la ficha del mazo es esperar a una ronda en la que el rival revele primero, para que sus cartas estén en el tablero cuando se resuelva. Una limpieza sobre un carril vacío son ocho de maná tirados.
- **Dejar las Tools en la mano.** Van Helsing solo las añade si no las tienes. Úsalas en cada combate, aunque sea sobre un objetivo pequeño.
- **Phuong Hoang antes de las curaciones.** Un 2/3 por cuatro de maná sin nada con lo que crecer es una carta débil; la misma carta, cuando Shahrazad y Spellbook ya están en marcha, es la condición de victoria. La nota del mulligan la sitúa, junto a Shahrazad, entre las cartas que no hay que conservar en la mano inicial.
- **Tratar el robo como un lujo.** La ficha del mazo advierte que "no encontrar Forbidden Knowledge cuando lo necesitas puede ser muy doloroso": Scarecrow, Ali Baba y Spellbook son la forma de encontrarlo, así que juégalos pronto aunque el tablero no lo pida.

## Conquest

El mazo está etiquetado solo para la ladder, pero encaja en una selección de mazos para Conquest: una Legendaria distinta de la de 3 Pigs Mid Range y una sola carta en común, Ali Baba, así que las dos listas se diferencian en once cartas, más de las nueve exigidas en el Big Bob's Playtest Battle. El [deck builder](/es/deck-builder) cuenta la diferencia en el modo torneo.
`,
  },
  "steam-next-fest-2026": {
    title: "Origins TCG en el Steam Next Fest 2026: Demo 2.0, fechas y torneo",
    metaTitle: "Origins TCG en el Steam Next Fest 2026: fechas",
    excerpt: "Origins TCG en el Steam Next Fest, del 19 al 26 de octubre de 2026: la Demo 2.0, la Crimson Cup del 20 al 25 de octubre, los premios y cómo inscribirte.",
    faq: [
      {
        q: "¿Cuándo es el Steam Next Fest de octubre de 2026?",
        a: "Del lunes 19 de octubre a las 10:00, hora del Pacífico (13:00 hora del Este, 18:00 en el Reino Unido y 19:00 en Europa central), al lunes 26 de octubre de 2026. Origins TCG participa con la build Demo 2.0.",
      },
      {
        q: "¿Cuándo es el torneo de Origins TCG?",
        a: "Del 20 al 25 de octubre de 2026: tres clasificatorios los días 20, 21 y 22 (uno por cada gran región) y después playoffs y finales.",
      },
      {
        q: "¿Puedo participar en un clasificatorio desde Europa?",
        a: "Sí. Koin Games dice que puedes participar en cualquiera de los clasificatorios sin importar dónde vivas, pero pide que te inscribas solo en los que de verdad puedas jugar.",
      },
      {
        q: "¿Cuesta algo?",
        a: "No. La demo es gratuita en Steam y la inscripción al torneo se hace en el Discord oficial. Origins TCG es free-to-compete: todas las cartas competitivas se consiguen jugando.",
      },
      {
        q: "¿Qué es el formato Conquest?",
        a: "En la Crimson Cup cada jugador presenta tres mazos, cada uno liderado por una Legendaria distinta, con al menos 8 cartas únicas entre dos mazos cualesquiera. Las listas se mantienen ocultas hasta el top 4: cuando baneas uno de los mazos de tu rival, solo ves su Legendaria. En las partidas al mejor de cinco no hay ban y tienes que ganar con los tres mazos. Koin Games probó el formato por primera vez en Big Bob's Playtest Battle, el 28 de agosto.",
      },
    ],
    body: `
## Las dos fechas que hay que recordar

- **Steam Next Fest, edición de octubre de 2026: del 19 al 26 de octubre.** El [festival de demos jugables de Valve](https://store.steampowered.com/sale/nextfest) va del lunes 19 de octubre a las 10:00, hora del Pacífico (13:00 hora del Este, 18:00 en el Reino Unido, 19:00 en Europa central), al lunes 26 de octubre. [Origins TCG](https://store.steampowered.com/app/4429430/Origins_TCG/) participa con la gran actualización **Demo 2.0**.
- **Torneo de Origins TCG: del 20 al 25 de octubre.** Koin Games lo llama "nuestro mayor torneo hasta la fecha": un evento de varios días que pasa por Clasificación → Playoffs → Finales, todo en línea y dentro del juego.

## Qué trae la Demo 2.0

La build se probó en tres playtests cerrados en agosto (parches [0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414), [0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) y [0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184), todos recogidos en nuestro [MetaShifting](/es/metashifting)). Koin Games anunció tres novedades:

- **cinco mazos nuevos**, además de los de la demo de julio;
- **más de 70 cartas nuevas**;
- **la construcción de mazos**: por primera vez, todo el mundo puede crear su propio mazo de 25 cartas (una Legendaria más doce cartas, cada una en dos copias) en lugar de elegir una lista predefinida.

Los playtests también introdujeron una ladder clasificatoria con divisiones hasta Grandmaster y una clasificación mundial. Publicaremos cada cambio el mismo día en que llegue.

## El torneo, paso a paso

1. **Clasificatorios, del 20 al 22 de octubre.** Son tres, de 512 plazas cada uno: EMEA el 20 a las 19:00 CEST (pasan 32), AMER el 21 a las 19:00 EST (64) y APAC el 22 a las 19:00 SGT (32), más 128 wild cards. En palabras de Koin, "puedes participar en CUALQUIERA de los clasificatorios, vivas donde vivas": elige el que tenga el horario que más te convenga e inscríbete solo en los que de verdad vayas a jugar; puedes inscribirte en más de uno.
2. **Playoffs y finales, 24 y 25 de octubre.** La fase de playoffs tiene 256 plazas el día 24 (10:00 EST / 16:00 CEST / 22:00 SGT) y de ella salen cuatro jugadores para las finales del día 25, a las 10:00 EST (15:00 CET / 22:00 SGT). Atención a los relojes: Europa deja el horario de verano la noche del 24, mientras que Estados Unidos lo mantiene hasta el 1 de noviembre, así que un mismo horario de inicio en EST cae una hora antes en los relojes europeos el domingo. Los creadores de contenido reciben invitaciones wildcard directas a los playoffs (pregunta en Discord).
3. **Formato.** Oficial, según los anuncios del 9 y del 24 de septiembre: **Conquest con tres mazos**, con al menos 8 cartas únicas entre cada par de mazos; las listas se mantienen ocultas hasta el top 4, así que cuando baneas uno de los mazos de tu rival solo ves su Legendaria. **Partidas al mejor de tres y gran final al mejor de cinco**: al mejor de cinco no hay ban y tienes que ganar con los tres mazos. Los detalles, en [nuestro artículo sobre las reglas](/es/news/crimson-cup-format-check-in).
4. **Check-in.** Se abre dos horas antes de cada clasificatorio y se cierra cinco minutos antes del inicio, junto con la entrega de mazos; después, una breve ventana por orden de llegada reparte las plazas libres entre quienes están en la lista de espera. Si no haces el check-in, no puedes jugar: para el clasificatorio EMEA de las 19:00 CEST, haz el check-in entre las 17:00 y las 18:55.
5. **Qué build se usa.** El torneo se juega en la demo principal, solo con las cartas disponibles allí: practica con esa versión. El playtest recibirá más actualizaciones y será distinto de la build del torneo. El último parche de equilibrio llega dos semanas antes del Steam Next Fest.
6. **Premios.** **Premios por un valor de 10.000 dólares**, en palabras de Koin: una carta promocional 1/1 exclusiva del torneo, otras cartas promocionales, sobres digitales, cajas de sobres y cases Alpha, y premios en dinero. No es una bolsa de premios en efectivo: el dinero es una de las cuatro categorías, y Koin prometió la bolsa de premios exacta para la semana siguiente al 24 de septiembre. El torneo se llama **Crimson Cup**: el nombre aparece en las imágenes oficiales de Koin, no es un apodo de la comunidad.

Las inscripciones se hacen en el [Discord oficial](https://discord.gg/originstcg).

## Cómo prepararte en cinco jugadas

1. [Instala la demo gratuita en Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/) y juega las misiones: enseñan los tres carriles y los turnos simultáneos.
2. Lee [Origins TCG explicado en cinco minutos](/es/guides/origins-tcg-explained) y consulta la [base de datos de cartas](/es/cards): las estadísticas son las del parche de la demo del 21 de septiembre, comprobadas carta por carta en el juego.
3. Construye tus tres mazos de Conquest en nuestro [deck builder](/es/deck-builder): comprueba la regla de las Legendarias distintas y cuenta las cartas que cambian entre un mazo y otro.
4. Estudia los [mazos publicados por la comunidad](/es/decks): cada lista incluye sus gráficos de composición, las notas del autor, un botón que la abre en el deck builder y el código del juego para pegarlo en Origins. Publica la tuya con una guía para que otros jugadores la valoren.
5. Sigue las [noticias](/es/news): resumimos cada anuncio en menos de un día, con el enlace a la fuente.

## Cómo cubre OriginsMeta la semana

Una noticia al día durante el festival, los mazos del torneo publicados el mismo día con sus gráficos de composición y la primera tier list de OriginsMeta el 27 de octubre, basada en los resultados del torneo y en la cima de la ladder. Fuentes: las publicaciones oficiales en Steam del 4 de agosto, del 25 de agosto y del [9 de septiembre de 2026](https://store.steampowered.com/news/app/4429430/view/1843481262690278), y el [calendario del Steam Next Fest](https://store.steampowered.com/sale/nextfest).
`,
  },
  "is-origins-tcg-pay-to-win": {
    title: "¿Origins TCG es pay to win? El free-to-compete, explicado",
    metaTitle: "¿Origins TCG es pay to win? El free-to-compete",
    excerpt: "Koin Games presenta Origins TCG como el primer juego de cartas free-to-compete, sin pay to win. Qué compra de verdad el dinero y las salvedades honestas.",
    faq: [
      {
        q: "¿Origins TCG es gratis?",
        a: "Sí. La demo es gratuita en Steam desde el 15 de julio de 2026, y el juego completo se presenta como free-to-compete: todas las cartas que necesitas para competir se consiguen jugando.",
      },
      {
        q: "¿Tengo que comprar sobres para ganar?",
        a: "No. Según la página oficial de Steam, compites solo con tu habilidad, sin nada de pay to win. Los sobres de pago contienen versiones de colección de las cartas, limitadas y calificadas digitalmente, no poder extra.",
      },
      {
        q: "Entonces, ¿qué se paga?",
        a: "Productos de colección: versiones de edición limitada de las cartas, numeradas y calificadas, que se venden en sobres, cajas y cases, y que se pueden comprar, vender e intercambiar con otros jugadores.",
      },
      {
        q: "¿Puedo vender mis cartas?",
        a: "Koin Games dice que las cartas y los productos sellados se podrán intercambiar en el Mercado de la Comunidad de Steam y en los mercados conectados cuando se lance el juego completo. En Steam, lo que obtienes con las ventas va a tu Steam Wallet.",
      },
      {
        q: "¿Hay un pase de batalla o impulsos de progresión de pago?",
        a: "Hasta septiembre de 2026 no se ha anunciado nada parecido. Actualizaremos esta página si eso cambia.",
      },
    ],
    body: `
## La respuesta corta

No, por diseño. En su página de Steam, Koin Games describe Origins TCG como "el primer TCG free-to-compete", en el que "compites solo con tu habilidad (zero pay-to-win) por cartas limitadas con calificación digital que puedes comprar, vender e intercambiar". Una de las pantallas de carga oficiales lo dice en dos palabras: **zero pay-to-win**.

Esa es la promesa. Esta página explica qué significa en la práctica y dónde quedan dudas honestas.

## Qué significa "free-to-compete"

Origins separa dos cosas que la mayoría de los juegos de cartas digitales mezclan:

1. **Competir.** Todas las cartas que necesitas para construir un mazo competitivo se ganan en el juego. Los mazos del playtest y la [base de datos de cartas](/es/cards) no contienen nada que se consiga pagando.
2. **Coleccionar.** Existen versiones de edición limitada de esas mismas cartas en tiradas numeradas, llegan **calificadas digitalmente** y se pueden comprar, vender e intercambiar. Son cosméticas: una Mulan calificada juega exactamente igual que la Mulan que ganaste.

Así que el sobre por el que pagas es un producto de colección, no un producto de poder. El primero, "Myths & Legends: Alpha Edition", solo se vende en preventa, en sobres de cinco cartas, cajas de 24 sobres y cases de seis cajas, con diez niveles de rareza; consulta [cómo funciona la economía de Origins](/es/guides/collector-economy).

## Frente a otros juegos

En Hearthstone o MTG Arena, los sobres que compras contienen las cartas con las que juegas, así que gastar acorta el camino hacia la colección completa. En Origins, el camino hacia un mazo competitivo es jugar; el gasto compra la vitrina de colección que está al lado. En esa diferencia se apoya la promesa "zero pay-to-win".

## Las salvedades honestas

- **El tiempo sigue siendo un coste.** Las cartas gratuitas se ganan jugando; aún no se ha publicado cuántas partidas hacen falta para completar un mazo competitivo. Cuando se abra la construcción de mazos de la Demo 2.0 en el Steam Next Fest (del 19 al 26 de octubre), lo mediremos y publicaremos las cifras.
- **Detalles pendientes.** No se han anunciado los precios fuera de la preventa Alpha, las comisiones del mercado más allá de las estándar de Steam ni posibles impulsos de progresión. Nada apunta a un pase de batalla, pero tampoco nada lo descarta.
- **El valor en el mercado no es dinero en efectivo.** Lo que vendes en el Mercado de la Comunidad de Steam se abona en tu Steam Wallet. No está confirmado si los mercados conectados permitirán retirar dinero real.

## Por qué importa para el meta

Como las versiones de colección son cosméticas, una tier list solo tiene que juzgar la carta, nunca la edición, y un mazo publicado en OriginsMeta por un jugador que no ha gastado nada es tan fuerte como el de cualquier otro. Mantendremos esta página al día con cada declaración oficial; fuentes: la página de Steam de Origins TCG, las pantallas de carga oficiales y los AMA de Koin Games de julio y agosto de 2026.
`,
  },
  "play-the-demo": {
    title: "Cómo descargar y probar la demo de Origins TCG en Steam",
    metaTitle: "Cómo probar la demo de Origins TCG en Steam",
    excerpt: "La demo gratuita en cinco pasos: requisitos, descarga, idioma, primeras partidas, qué se desbloquea y qué cambia con la Demo 2.0 en el Steam Next Fest.",
    faq: [
      {
        q: "¿La demo de Origins TCG es gratis?",
        a: "Sí. Es gratuita en Steam desde el 15 de julio de 2026, para Windows y macOS.",
      },
      {
        q: "¿En qué idiomas está disponible la demo?",
        a: "En cuatro: inglés, francés, italiano y alemán, cada uno con la interfaz traducida y doblaje completo. Los subtítulos solo están en inglés.",
      },
      {
        q: "¿Qué necesito para ejecutarla?",
        a: "Como mínimo, Windows 10 de 64 bits con un Intel i3-6100 o un AMD FX-6300, 8 GB de RAM, una GTX 750 Ti o una R9 270X y 2 GB de espacio; en Mac, macOS 10.14 o posterior con un Apple M1 o un Intel i5 de doble núcleo y una GPU compatible con Metal.",
      },
      {
        q: "¿La demo da algo para el juego completo?",
        a: "Koin Games anunció que quienes juegan la demo ganan coleccionables exclusivos que se podrán intercambiar cuando salga el juego completo.",
      },
      {
        q: "¿Cuándo llega la demo más grande?",
        a: "La Demo 2.0, con cinco mazos nuevos, más de 70 cartas nuevas y construcción de mazos, se espera para el Steam Next Fest, del 19 al 26 de octubre de 2026.",
      },
    ],
    body: `
## Qué incluye

La demo de Origins TCG está en Steam desde el **15 de julio de 2026**, gratis, para Windows y macOS. El 21 de septiembre de 2026 tenía reseñas "Muy positivas": el 98 % de 167. Las partidas duran unos siete minutos: los dos jugadores juegan a la vez en tres ubicaciones, sacadas de un conjunto de más de cien que rotan y cambian las reglas del tablero. La demo incluye el tutorial, misiones contra jefes con su propia IA y juego en línea.

Idiomas: **inglés, francés, italiano y alemán**, tanto la interfaz como el audio completo.

## Requisitos

| | Mínimos | Recomendados |
| --- | --- | --- |
| Windows | Windows 10 de 64 bits, Intel i3-6100 o AMD FX-6300, 8 GB de RAM, GTX 750 Ti o R9 270X | Windows 11 de 64 bits, Intel i5-8400, 16 GB de RAM, GTX 1060 |
| macOS | macOS 10.14, Apple M1 o Intel i5 de doble núcleo a 2,5 GHz, GPU compatible con Metal | macOS 12 o posterior, Apple M1 Pro, 16 GB de RAM |
| Espacio | 2 GB | 2 GB |

## Cinco pasos

1. **Instala Steam** e inicia sesión (basta con una cuenta gratuita).
2. **Abre la [página de Origins TCG Demo](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/)** y haz clic en "Descargar Origins TCG Demo"; o busca "Origins TCG" dentro de Steam y elige la demo. La instalación tarda un par de minutos.
3. **Elige el idioma** si Steam no lo ha hecho: clic derecho sobre el juego en tu biblioteca, Propiedades, Idioma. Los cuatro idiomas incluyen doblaje completo, no solo menús traducidos.
4. **Completa el tutorial** y luego las misiones: enseñan los tres carriles, los turnos simultáneos y las palabras clave (On Reveal, On Death, First Strike, Double Attack, Deathtouch). Nuestra [guía de cinco minutos](/es/guides/origins-tcg-explained) cuenta lo mismo por escrito.
5. **Juega en línea** y prueba los mazos predefinidos. Cuando quieras más, consulta los [mazos publicados por la comunidad](/es/decks), reconstrúyelos en el [deck builder](/es/deck-builder) y revisa las estadísticas actuales de las cartas en la [base de datos de cartas](/es/cards) (parche 0.6.3).

## Qué desbloquean los jugadores de la demo

En la publicación de lanzamiento de julio, Koin Games dijo que quienes juegan la demo ganan **coleccionables exclusivos** que se podrán intercambiar cuando salga el juego completo. Añade el [juego principal](https://store.steampowered.com/app/4429430/Origins_TCG/) a tu lista de deseados de Steam: el acceso anticipado figura para el cuarto trimestre de 2026.

## Qué cambia con la Demo 2.0

En el Steam Next Fest (del 19 al 26 de octubre de 2026), la demo recibe su gran actualización, probada en los playtests cerrados de agosto: cinco mazos nuevos, más de 70 cartas nuevas y, sobre todo, la construcción de mazos. Todo sobre las fechas, el torneo y cómo prepararte está en nuestra [página sobre el Steam Next Fest 2026](/es/guides/steam-next-fest-2026). Los playtests de las builds más grandes se anuncian en el [Discord oficial](https://discord.gg/originstcg) y, hasta ahora, ha podido participar todo el que ha querido.

Fuentes: las páginas de Origins TCG y de Origins TCG Demo en Steam y las publicaciones oficiales en Steam del 16 de julio y del 4 de agosto de 2026.
`,
  },
  "origins-tcg-kickstarter": {
    title: "Kickstarter de Origins TCG: prerregistro, Alpha Edition y lo que sabemos",
    metaTitle: "Kickstarter de Origins TCG: prerregistro",
    excerpt: "Aún sin fecha de campaña, pero con el prerregistro oficial abierto: 15 % de descuento de lanzamiento por 1 dólar reembolsable, y cajas Alpha solo en preventa.",
    faq: [
      {
        q: "¿Cuándo empieza el Kickstarter de Origins TCG?",
        a: "Koin Games no ha anunciado la fecha. El 10 de septiembre de 2026 hubo un AMA sobre el Kickstarter en el Discord oficial y la página de prerregistro está activa; actualizaremos esta guía en cuanto se publique una fecha.",
      },
      {
        q: "¿Qué te da el depósito de 1 dólar?",
        a: "El estatus VIP, con un 15 % de descuento en el lanzamiento. La página oficial indica que el depósito es totalmente reembolsable antes del lanzamiento.",
      },
      {
        q: "¿Qué es la Alpha Edition?",
        a: "Origins Myths & Legends Alpha Edition: sobres de coleccionista de 5 cartas con al menos una Rara o superior garantizada, cajas de 24 sobres y cases de 6 cajas. Las cajas y los cases solo se venden en preventa y la tirada no se repetirá.",
      },
      {
        q: "¿Tengo que apoyar el Kickstarter para competir?",
        a: "No. Origins es free-to-compete: las partidas clasificatorias no requieren ninguna compra y la demo de Steam es gratuita. El Kickstarter trata sobre el coleccionismo, no sobre el poder.",
      },
      {
        q: "¿Dónde se intercambian las cartas?",
        a: "En el Mercado de la Comunidad de Steam y en sus mercados conectados, según la página oficial. La apertura de sobres en dispositivos móviles está prevista para 2027.",
      },
    ],
    body: `## Lo que se ha anunciado

Koin Games tiene una página oficial de **Kickstarter Early Access** en [founder.origins-tcg.com](https://founder.origins-tcg.com). El **10 de septiembre de 2026**, el equipo respondió preguntas sobre la campaña en un AMA en el Discord oficial. La fecha de la campaña aún no se ha publicado: la página solo recoge prerregistros.

## Prerregistro: 15 % de descuento por 1 dólar

- Hacerte **VIP** con un **depósito de 1 dólar** desbloquea un **15 % de descuento en el lanzamiento**.
- El depósito es **totalmente reembolsable antes del lanzamiento**, como indica dos veces la página oficial.
- El prerregistro no te compromete a apoyar la campaña: solo reserva el precio early bird.

## La Alpha Edition

La línea de productos se llama **Origins Myths & Legends Alpha Edition**:

| Producto | Contenido |
| --- | --- |
| Sobre de coleccionista | 5 cartas coleccionables, al menos una Rara o superior garantizada |
| Caja de sobres | 24 sobres de coleccionista |
| Case de sobres | 6 cajas de sobres |

En la Alpha Edition, **las cajas y los cases solo se venden en preventa**: cuando se termine esa tirada, no se producirán más cajas ni cases Alpha. Es la misma lógica que la de una tirada de primera edición en los juegos de cartas físicos, aplicada a una colección digital.

## Intercambio y propiedad

Las cartas se pueden comprar, vender e intercambiar en el **Mercado de la Comunidad de Steam** y en sus mercados conectados. A principios de este año, Koin se pasó al mercado de Steam en lugar de usar un sistema on-chain independiente. La apertura de sobres en dispositivos móviles está prevista para **2027**.

## El free-to-compete sigue siendo gratis

Con el Kickstarter se compran coleccionables, no fuerza: en Origins, las partidas clasificatorias no requieren ninguna compra y la demo de Steam es gratuita. Consulta [¿Origins TCG es pay to win?](/es/guides/is-origins-tcg-pay-to-win) para ver cómo se mantienen separadas la parte competitiva y la de colección.

## Cronología

- 15 de julio de 2026: demo gratuita en Steam.
- Del 19 al 26 de octubre de 2026: Demo 2.0 en el Steam Next Fest, con el torneo Crimson Cup.
- Cuarto trimestre de 2026: lanzamiento completo en Steam.
- 2027: versión móvil.

## Qué hacer ahora

1. Añade el juego a tu lista de deseados en Steam y prueba la demo.
2. Si quieres el descuento de lanzamiento, [haz el prerregistro en founder.origins-tcg.com](https://founder.origins-tcg.com) con el depósito reembolsable.
3. Sigue el Discord oficial para conocer la fecha de la campaña: la publicaremos aquí y en las noticias el mismo día.

Fuentes: [página oficial de prerregistro](https://founder.origins-tcg.com), [página de Steam](https://store.steampowered.com/app/4429430/Origins_TCG/), AMA sobre el Kickstarter en el Discord oficial (10 de septiembre de 2026, recogido por World of Origins).`,
  },
  "origins-tcg-explained": {
    title: "Origins TCG explicado en cinco minutos",
    excerpt: "Qué es Origins TCG, cómo funciona una partida en tres carriles con turnos simultáneos, qué significa free-to-compete y cómo probar la demo hoy.",
    faq: [
      {
        q: "¿Qué es Origins TCG?",
        a: "Un juego de cartas coleccionables digital de Koin Games, un estudio con sede en Tampa (Florida) fundado en 2021. Sus personajes son leyendas de dominio público —Robin Hood, Mulan, Queen of Hearts, Dracula y muchas más— reinventadas en un único mundo original.",
      },
      {
        q: "¿Cuánto dura una partida?",
        a: "Unos siete minutos. Los dos jugadores actúan a la vez en tres carriles, así que nadie espera el turno del rival.",
      },
      {
        q: "¿Cuántas cartas tiene un mazo?",
        a: "Veinticinco en el playtest actual, y cada mazo se construye en torno a una Legendaria con una habilidad característica. Mulan repite las habilidades On Reveal de tus aliados; Queen of Hearts, las On Death.",
      },
      {
        q: "¿Puedo jugar gratis a Origins TCG?",
        a: "Sí. La demo de Steam es gratuita e incluye el tutorial, misiones contra jefes con su propia IA y juego en línea. Todas las cartas que necesitas para jugar a nivel competitivo se consiguen jugando; el dinero solo compra versiones de colección de las cartas.",
      },
    ],
    body: `
## Qué es

Origins TCG es un juego de cartas coleccionables digital de **Koin Games**, un estudio con sede en Tampa (Florida) fundado en 2021 por veteranos del sector. Sus personajes son leyendas de dominio público reinventadas en un único mundo original: Robin Hood, Mulan, Queen of Hearts, Winnie-the-Pooh, King Arthur, Dracula y muchas más.

La propuesta es el **free-to-compete**: todas las cartas que necesitas para jugar a nivel competitivo se consiguen jugando. El dinero solo compra versiones coleccionables de las cartas, que se pueden calificar, intercambiar y vender. Los desarrolladores lo llaman "zero pay-to-win".

## Cómo funciona una partida

- **Tres carriles.** Te enfrentas a tu rival en tres tableros a la vez. Cada carril tiene su propia ubicación, sacada de un conjunto de más de cien que rotan y cambian las reglas de ese tablero.
- **Turnos simultáneos.** Los dos jugadores actúan a la vez, así que no hay esperas. Una partida dura unos siete minutos.
- **Las cartas atacan.** A diferencia de los juegos que solo "cuentan carriles", aquí las unidades luchan entre sí: el Poder es el daño que haces y la Salud, el que aguantas.
- **Palabras clave.** El playtest usa On Reveal (se activa cuando se juega la carta), On Death, First Strike, Double Attack y Deathtouch.
- **Una Legendaria lidera el mazo.** En el playtest actual los mazos tienen 25 cartas y cada uno se construye en torno a una carta Legendaria con una habilidad característica: Mulan repite las habilidades On Reveal de tus aliados; Queen of Hearts, las On Death.

## Modos

La demo tiene un tutorial, misiones contra jefes con su propia IA y juego en línea. El parche 0.6.1 añadió una **ladder clasificatoria** con divisiones hasta Grandmaster, una clasificación mundial y los Puntos de Victoria.

## Cómo jugar hoy

1. Instala la demo gratuita desde la [página de Steam](https://store.steampowered.com/app/4756630/Origins_TCG_Demo/). Quienes juegan la demo ganan coleccionables exclusivos que se podrán intercambiar cuando salga el juego completo.
2. Únete al [Discord oficial](https://discord.gg/originstcg) para los torneos, los AMA con el equipo y los playtests de la "Demo 2.0", una build más grande.
3. El juego está en inglés, francés, italiano y alemán. La versión móvil está prevista para 2027.

## Hacia dónde va el juego

El acceso anticipado en Steam figura para el cuarto trimestre de 2026, con una demo mucho más grande en el Steam Next Fest (del 19 al 26 de octubre de 2026) y el mayor torneo del estudio hasta la fecha, del 20 al 25 de octubre. Consulta el [roadmap](/es/guides/roadmap-and-dates).
`,
  },
  "roadmap-and-dates": {
    title: "Roadmap y fechas: de la demo al acceso anticipado",
    metaTitle: "Origins TCG: roadmap y fechas de lanzamiento",
    excerpt: "Todas las fechas confirmadas de Origins TCG, desde la primera publicación en Steam hasta la Demo 2.0 y la Crimson Cup del Next Fest, y lo previsto para 2027.",
    faq: [
      {
        q: "¿Cuándo sale Origins TCG en Steam?",
        a: "El acceso anticipado figura para el cuarto trimestre de 2026 en la página de la tienda. Antes llega la actualización Demo 2.0 en el Steam Next Fest, del 19 al 26 de octubre de 2026.",
      },
      {
        q: "¿Cuándo es la Crimson Cup?",
        a: "Del 20 al 25 de octubre de 2026, durante el Steam Next Fest: clasificatorios regionales los días 20, 21 y 22, y después playoffs y finales. Los premios, por un valor de 10.000 dólares, incluyen una carta promocional 1/1 exclusiva.",
      },
      {
        q: "¿Hay una versión móvil de Origins TCG?",
        a: "Todavía no. La versión móvil y la apertura de sobres desde el teléfono están anunciadas para 2027. El juego tuvo un soft launch en el App Store en algunas regiones en noviembre de 2025, antes de que el estudio llevara el intercambio de cartas a Steam.",
      },
      {
        q: "¿Cuándo salió la demo gratuita?",
        a: "Entre el 15 y el 16 de julio de 2026, en Steam, con coleccionables exclusivos para los jugadores de la demo. La ladder clasificatoria llegó después, con el parche 0.6.1 del 14 de agosto de 2026.",
      },
    ],
    body: `
## Antes de la demo

- **Agosto de 2025.** Koin Games e Immutable anuncian "Project O", un TCG competitivo pensado para dispositivos móviles con propiedad real de las cartas.
- **Noviembre de 2025.** Soft launch en el App Store en algunas regiones (versión 0.1.0).
- **Principios de 2026.** El estudio lleva el intercambio de cartas al mercado de Steam y abandona el modelo on-chain independiente.
- **Marzo de 2026.** El CEO aparece grabado con cartas físicas de metal. No se ha anunciado ningún producto ni fecha.

## 2026, mes a mes

| Fecha | Qué pasó |
| --- | --- |
| 6 de mayo | Se publica la página de Steam y se abre la lista de deseados |
| 3 de junio | El Discord oficial se abre a todo el mundo |
| 15–16 de julio | Demo gratuita en Steam con coleccionables exclusivos |
| 21 de julio | Primeras cifras: más de 1.000 jugadores, más de 13.000 partidas y una mediana de juego de 1h51m |
| 22 de julio | AMA con el CEO, Tim Jooste, y el jefe de diseño, Kevin Lambert |
| 24 de julio | Primer torneo de la demo |
| 24–26 de julio | Origins en la Card Party de Fort Lauderdale |
| 7 de agosto | Primer playtest de la "Demo 2.0": 5 mazos nuevos, más de 70 cartas y construcción de mazos |
| 14 de agosto | [Parche 0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414): ladder clasificatoria |
| 19 de agosto | AMA sobre el Creator Program |
| 21 de agosto | [Parche 0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961): 23 cartas reequilibradas |
| 27 de agosto | [Parche 0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184) |
| 28 de agosto | Big Bob's Playtest Battle, primer torneo Conquest, más de 130 inscritos |
| 9 de septiembre | [Anunciado el torneo del Next Fest](https://store.steampowered.com/news/app/4429430/view/1843481262690278) |
| 10 de septiembre | AMA sobre el Kickstarter: venta final de los sobres Alpha |

## Lo que viene

- **Del 19 al 26 de octubre de 2026.** Steam Next Fest con la actualización Demo 2.0: construcción de mazos y muchas más cartas para todos.
- **Del 20 al 25 de octubre de 2026.** La Crimson Cup, el torneo del Steam Next Fest: clasificatorios regionales los días 20, 21 y 22, y después playoffs y finales. Premios por un valor de 10.000 dólares, entre ellos una carta promocional 1/1 exclusiva.
- **Cuarto trimestre de 2026.** Acceso anticipado en Steam, según la página de la tienda.
- **2027.** Versión móvil y apertura de sobres desde el teléfono. En los AMA, el equipo ha descrito un lanzamiento completo con el elenco entero de cartas Legendarias, entre ellas King Arthur, Dracula, Winnie-the-Pooh, Alice, Beowulf, Cinderella, Sweeney Todd, Frankenstein y Sherlock Holmes.

Las fechas proceden de las publicaciones oficiales en Steam y del Discord del estudio. Actualizamos esta página cuando cambian.
`,
  },
  "collector-economy": {
    title: "Dos formas de coleccionar: cómo funciona la economía de Origins",
    metaTitle: "Cómo funciona el coleccionismo en Origins TCG",
    excerpt: "Las cartas competitivas son gratis. Las de colección son limitadas, calificadas e intercambiables en Steam. Esto es lo que está confirmado y lo que no.",
    faq: [
      {
        q: "¿Las cartas de colección hacen más fuerte un mazo?",
        a: "No. Todas las cartas competitivas se ganan en el juego, y las versiones de colección son ediciones limitadas de esas mismas cartas: están numeradas, calificadas digitalmente y se pueden intercambiar, pero en la partida funcionan exactamente igual.",
      },
      {
        q: "¿Qué es la Alpha Edition?",
        a: "Myths & Legends: Alpha Edition es la primera edición de colección y solo se vende en preventa: sobres de cinco cartas, cajas de 24 sobres y cases de seis cajas, con diez niveles de rareza, de común a storybook. Cuando se termina la tirada, no se producen más cajas Alpha.",
      },
      {
        q: "¿Dónde se pueden intercambiar las cartas de Origins?",
        a: "En el Mercado de la Comunidad de Steam y en los mercados conectados, cuando se lance el juego completo. Los coleccionables que ganas hoy en la demo pasarán a ser intercambiables en ese momento.",
      },
      {
        q: "¿Qué es un God pack?",
        a: "Un sobre raro en el que todas las cartas son Legendarias o superiores. Las versiones de colección también llevan una calificación: en la Card Party de julio de 2026, el equipo regalaba un Slab a quien sacara una Alternate Art 10/10.",
      },
    ],
    body: `
## La separación

Origins separa dos cosas que la mayoría de los juegos de cartas mezclan:

1. **Jugar.** Todas las cartas competitivas se ganan en el juego. Nada de lo que compras hace más fuerte tu mazo.
2. **Coleccionar.** Las versiones de edición limitada de las cartas existen en tiradas numeradas, llegan **calificadas digitalmente** y se pueden comprar, vender e intercambiar con otros jugadores.

Las propias pantallas de carga del estudio lo llaman "real collecting in digital" y "two ways to collect".

## Lo que está confirmado

- **Cartas calificadas.** Las versiones de colección llevan una calificación; en la Card Party de julio, el equipo regalaba un Slab a quien sacara una **Alternate Art 10/10**. Existen calificaciones más bajas y series distintas, con valores diferentes.
- **God packs.** Sobres raros en los que todas las cartas son Legendarias o superiores.
- **Alpha Edition.** La primera edición de colección, "Myths & Legends: Alpha Edition", solo se vende en preventa: sobres de cinco cartas, cajas de 24 sobres y cases de seis cajas, con diez niveles de rareza, de común a storybook. Cuando se termina la tirada, no se producen más cajas Alpha. La venta final se anunció en el AMA sobre el Kickstarter del 10 de septiembre de 2026.
- **Intercambio en Steam.** Las cartas y los productos sellados se intercambiarán en el Mercado de la Comunidad de Steam y en los mercados conectados cuando se lance el juego completo. Los coleccionables de la demo que se ganan hoy pasarán a ser intercambiables en ese momento.
- **Versión móvil, más adelante.** La apertura de sobres desde el teléfono está prevista para 2027.

## Lo que aún no está confirmado

- Los precios en euros de sobres y cajas fuera de la preventa Alpha.
- Las comisiones del mercado más allá de las estándar de Steam.
- Si las cartas físicas de metal que mostró el CEO en marzo de 2026 llegarán a venderse.

## Por qué importa para el meta

Como las cartas de colección son cosméticas, una tier list solo tiene que fijarse en la carta, nunca en la versión. OriginsMeta seguirá los precios del Mercado de Steam desde el primer día en que haya artículos a la venta, para que el coleccionismo cuente con los mismos datos que el juego.
`,
  },
};
