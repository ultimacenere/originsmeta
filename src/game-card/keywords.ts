/**
 * Nome e spiegazione ufficiali delle parole chiave di Origins TCG in otto lingue, letti nei file del gioco (generato da
 * `node scripts/game-texts.mjs --parole-chiave`, da rilanciare dopo una patch; non modificare a mano). Li usa il riquadro
 * delle parole chiave accanto alla carta del gioco (model.ts).
 */
export const KEYWORD_INFO: Record<string, Record<string, { n: string; d: string }>> = {
 "Cleave": {
  "en": {
   "n": "Cleave",
   "d": "When this attacks an enemy character, it also deals damage to adjacent enemy characters at the same location."
  },
  "it": {
   "n": "Fendente",
   "d": "Quando questa carta attacca un personaggio nemico, infligge danni anche ai personaggi nemici adiacenti nello stesso luogo."
  },
  "es": {
   "n": "Barrido",
   "d": "Cuando esta carta ataca a un personaje enemigo, también inflige daño a los personajes enemigos adyacentes en la misma ubicación."
  },
  "fr": {
   "n": "Balayage",
   "d": "Quand cette carte attaque un personnage ennemi, elle inflige aussi des dégâts aux personnages ennemis adjacents au même lieu."
  },
  "pt": {
   "n": "Varredura",
   "d": "Quando esta carta ataca um personagem inimigo, também causa dano aos personagens inimigos adjacentes na mesma localização."
  },
  "de": {
   "n": "Spaltschlag",
   "d": "Wenn diese Karte einen gegnerischen Charakter angreift, fügt sie auch angrenzenden gegnerischen Charakteren am selben Ort Schaden zu."
  },
  "ru": {
   "n": "Рассечение",
   "d": "Когда эта карта атакует вражеского персонажа, она также наносит урон соседним вражеским персонажам в той же локации."
  },
  "zh-cn": {
   "n": "顺劈",
   "d": "这张卡牌攻击敌方角色时，也会对同一地点相邻的敌方角色造成伤害。"
  }
 },
 "CombatStart": {
  "en": {
   "n": "Combat Start",
   "d": "An effect that happens at the start of combat."
  },
  "it": {
   "n": "Inizio del combattimento",
   "d": "Un effetto che si attiva all'inizio del combattimento."
  },
  "es": {
   "n": "Inicio de combate",
   "d": "Un efecto que ocurre al inicio del combate."
  },
  "fr": {
   "n": "Début du combat",
   "d": "Un effet qui se déclenche au début du combat."
  },
  "pt": {
   "n": "Início de combate",
   "d": "Um efeito que ocorre no início do combate."
  },
  "de": {
   "n": "Kampfbeginn",
   "d": "Ein Effekt, der zu Beginn des Kampfes eintritt."
  },
  "ru": {
   "n": "Начало боя",
   "d": "Эффект, который срабатывает в начале боя."
  },
  "zh-cn": {
   "n": "战斗开始",
   "d": "在战斗开始时触发的效果。"
  }
 },
 "Deathtouch": {
  "en": {
   "n": "Deathtouch",
   "d": "When this damages a character, destroy it."
  },
  "it": {
   "n": "Tocco letale",
   "d": "Quando questa carta infligge danni a un personaggio, questo viene distrutto."
  },
  "es": {
   "n": "Toque mortal",
   "d": "Cuando esta carta inflige daño a un personaje, este es destruido."
  },
  "fr": {
   "n": "Contact mortel",
   "d": "Quand cette carte inflige des dégâts à un personnage, celui-ci est détruit."
  },
  "pt": {
   "n": "Toque mortífero",
   "d": "Quando esta carta causa dano a um personagem, ele é destruído."
  },
  "de": {
   "n": "Todesberührung",
   "d": "Wenn diese Karte einem Charakter Schaden zufügt, wird dieser zerstört."
  },
  "ru": {
   "n": "Смертельное касание",
   "d": "Когда эта карта наносит урон персонажу, он уничтожается."
  },
  "zh-cn": {
   "n": "死触",
   "d": "这张卡牌对角色造成伤害时，摧毁该角色。"
  }
 },
 "Defender": {
  "en": {
   "n": "Defender",
   "d": "When an enemy character would attack your barrier here, this defends it."
  },
  "it": {
   "n": "Difensore",
   "d": "Quando un personaggio nemico attaccherebbe la tua barriera qui, questa carta la difende."
  },
  "es": {
   "n": "Defensor",
   "d": "Cuando un personaje enemigo fuera a atacar tu barrera aquí, esta carta la defiende."
  },
  "fr": {
   "n": "Défenseur",
   "d": "Quand un personnage ennemi attaquerait ta barrière ici, cette carte la défend."
  },
  "pt": {
   "n": "Defensor",
   "d": "Quando um personagem inimigo for atacar a sua barreira aqui, esta carta a defende."
  },
  "de": {
   "n": "Verteidiger",
   "d": "Wenn ein gegnerischer Charakter deine Barriere hier angreifen würde, verteidigt diese Karte sie."
  },
  "ru": {
   "n": "Защитник",
   "d": "Когда вражеский персонаж собирается атаковать ваш барьер здесь, эта карта защищает его."
  },
  "zh-cn": {
   "n": "守护者",
   "d": "敌方角色将要攻击你在此地点的屏障时，由这张卡牌进行防御。"
  }
 },
 "DoubleAttack": {
  "en": {
   "n": "Double Attack",
   "d": "This attacks twice during combat."
  },
  "it": {
   "n": "Doppio attacco",
   "d": "Questa carta attacca due volte durante il combattimento."
  },
  "es": {
   "n": "Ataque doble",
   "d": "Esta carta ataca dos veces durante el combate."
  },
  "fr": {
   "n": "Double attaque",
   "d": "Cette carte attaque deux fois pendant le combat."
  },
  "pt": {
   "n": "Ataque duplo",
   "d": "Esta carta ataca duas vezes durante o combate."
  },
  "de": {
   "n": "Doppelangriff",
   "d": "Diese Karte greift im Kampf zweimal an."
  },
  "ru": {
   "n": "Двойная атака",
   "d": "Эта карта атакует дважды за бой."
  },
  "zh-cn": {
   "n": "双重攻击",
   "d": "这张卡牌在战斗中攻击两次。"
  }
 },
 "FastReveal": {
  "en": {
   "n": "First Reveal",
   "d": "Always reveals before other cards, regardless of who reveals first."
  },
  "it": {
   "n": "Rivela per primo",
   "d": "Viene sempre rivelata prima delle altre carte, indipendentemente da chi rivela per primo."
  },
  "es": {
   "n": "Revela primero",
   "d": "Siempre se revela antes que las otras cartas, sin importar quién revela primero."
  },
  "fr": {
   "n": "Révèle en premier",
   "d": "Se révèle toujours avant les autres cartes, peu importe qui révèle en premier."
  },
  "pt": {
   "n": "Revela primeiro",
   "d": "Sempre se revela antes das outras cartas, independentemente de quem revela primeiro."
  },
  "de": {
   "n": "Deckt zuerst auf",
   "d": "Wird immer vor anderen Karten aufgedeckt, egal wer zuerst aufdeckt."
  },
  "ru": {
   "n": "Первое раскрытие",
   "d": "Всегда раскрывается раньше других карт, независимо от того, кто раскрывается первым."
  },
  "zh-cn": {
   "n": "优先展示",
   "d": "无论谁先展示，这张卡牌总是先于其他卡牌展示。"
  }
 },
 "FirstStrike": {
  "en": {
   "n": "First Strike",
   "d": "This attacks before characters without First Strike during combat."
  },
  "it": {
   "n": "Primo colpo",
   "d": "Questa carta attacca prima dei personaggi senza Primo colpo durante il combattimento."
  },
  "es": {
   "n": "Primer golpe",
   "d": "Esta carta ataca antes que los personajes sin Primer golpe durante el combate."
  },
  "fr": {
   "n": "Première frappe",
   "d": "Cette carte attaque avant les personnages sans Première frappe pendant le combat."
  },
  "pt": {
   "n": "Primeiro golpe",
   "d": "Esta carta ataca antes dos personagens sem Primeiro golpe durante o combate."
  },
  "de": {
   "n": "Erstschlag",
   "d": "Diese Karte greift im Kampf vor Charakteren ohne Erstschlag an."
  },
  "ru": {
   "n": "Первый удар",
   "d": "Эта карта атакует в бою раньше персонажей без «Первого удара»."
  },
  "zh-cn": {
   "n": "先攻",
   "d": "在战斗中，这张卡牌比没有“先攻”的角色更早攻击。"
  }
 },
 "Guard": {
  "en": {
   "n": "Guard",
   "d": "Damage that would be dealt to your barrier at this location is dealt to this instead."
  },
  "it": {
   "n": "Guardia",
   "d": "I danni che verrebbero inflitti alla tua barriera in questo luogo vengono invece inflitti a questa carta."
  },
  "es": {
   "n": "Guardia",
   "d": "El daño que se infligiría a tu barrera en esta ubicación se inflige a esta carta en su lugar."
  },
  "fr": {
   "n": "Garde",
   "d": "Les dégâts qui seraient infligés à ta barrière à ce lieu sont infligés à cette carte à la place."
  },
  "pt": {
   "n": "Guarda",
   "d": "O dano que seria causado à sua barreira nesta localização é causado a esta carta em vez disso."
  },
  "de": {
   "n": "Wache",
   "d": "Schaden, der deiner Barriere an diesem Ort zugefügt würde, wird stattdessen dieser Karte zugefügt."
  },
  "ru": {
   "n": "Заслон",
   "d": "Урон, который был бы нанесён вашему барьеру в этой локации, вместо этого наносится этой карте."
  },
  "zh-cn": {
   "n": "护卫",
   "d": "将要对你在此地点的屏障造成的伤害，转为对这张卡牌造成。"
  }
 },
 "Item": {
  "en": {
   "n": "Item",
   "d": "Activates an effect the first time a character is on the board space where this is."
  },
  "it": {
   "n": "Oggetto",
   "d": "Attiva un effetto la prima volta che un personaggio si trova sullo spazio in cui si trova questa carta."
  },
  "es": {
   "n": "Objeto",
   "d": "Activa un efecto la primera vez que un personaje está en el espacio donde está esta carta."
  },
  "fr": {
   "n": "Objet",
   "d": "Active un effet la première fois qu'un personnage se trouve sur l'espace où se trouve cette carte."
  },
  "pt": {
   "n": "Item",
   "d": "Ativa um efeito na primeira vez que um personagem estiver no espaço onde esta carta está."
  },
  "de": {
   "n": "Gegenstand",
   "d": "Aktiviert einen Effekt, wenn sich zum ersten Mal ein Charakter auf dem Feld befindet, auf dem diese Karte liegt."
  },
  "ru": {
   "n": "Предмет",
   "d": "Активирует эффект, когда персонаж впервые оказывается в ячейке, где находится эта карта."
  },
  "zh-cn": {
   "n": "物品",
   "d": "当角色首次进入这张卡牌所在的格子时，触发一个效果。"
  }
 },
 "Move": {
  "en": {
   "n": "Move",
   "d": "This can move once. Use this ability before playing cards for the round."
  },
  "it": {
   "n": "Muovere",
   "d": "Questa carta può muoversi una volta. Usa questa abilità prima di giocare le carte per il round."
  },
  "es": {
   "n": "Mover",
   "d": "Esta carta puede moverse una vez. Usa esta habilidad antes de jugar cartas para la ronda."
  },
  "fr": {
   "n": "Déplacer",
   "d": "Cette carte peut se déplacer une fois. Utilise cette capacité avant de jouer des cartes pour la manche."
  },
  "pt": {
   "n": "Mover",
   "d": "Esta carta pode se mover uma vez. Use esta habilidade antes de jogar cartas na rodada."
  },
  "de": {
   "n": "Bewegen",
   "d": "Diese Karte kann sich einmal bewegen. Nutze diese Fähigkeit, bevor du Karten für die Runde spielst."
  },
  "ru": {
   "n": "Перемещение",
   "d": "Эта карта может переместиться один раз. Используйте эту способность до розыгрыша карт в раунде."
  },
  "zh-cn": {
   "n": "移动",
   "d": "这张卡牌可以移动一次。请在本回合打出卡牌之前使用此能力。"
  }
 },
 "OnDeath": {
  "en": {
   "n": "On Death",
   "d": "An effect that happens when this is destroyed."
  },
  "it": {
   "n": "Alla morte",
   "d": "Un effetto che si attiva quando questa carta viene distrutta."
  },
  "es": {
   "n": "Al morir",
   "d": "Un efecto que ocurre cuando esta carta es destruida."
  },
  "fr": {
   "n": "À la mort",
   "d": "Un effet qui se déclenche quand cette carte est détruite."
  },
  "pt": {
   "n": "Ao morrer",
   "d": "Um efeito que ocorre quando esta carta é destruída."
  },
  "de": {
   "n": "Bei Tod",
   "d": "Ein Effekt, der eintritt, wenn diese Karte zerstört wird."
  },
  "ru": {
   "n": "При смерти",
   "d": "Эффект, который срабатывает, когда эта карта уничтожена."
  },
  "zh-cn": {
   "n": "死亡时",
   "d": "这张卡牌被摧毁时触发的效果。"
  }
 },
 "OnKill": {
  "en": {
   "n": "On Kill",
   "d": "An effect that happens when this destroys another character in combat and survives."
  },
  "it": {
   "n": "All'uccisione",
   "d": "Un effetto che si attiva quando questa carta distrugge un altro personaggio in combattimento e sopravvive."
  },
  "es": {
   "n": "Al matar",
   "d": "Un efecto que ocurre cuando esta carta destruye a otro personaje en combate y sobrevive."
  },
  "fr": {
   "n": "À l'élimination",
   "d": "Un effet qui se déclenche quand cette carte détruit un autre personnage en combat et survit."
  },
  "pt": {
   "n": "Ao matar",
   "d": "Um efeito que ocorre quando esta carta destrói outro personagem em combate e sobrevive."
  },
  "de": {
   "n": "Bei Vernichtung",
   "d": "Ein Effekt, der eintritt, wenn diese Karte einen anderen Charakter im Kampf zerstört und überlebt."
  },
  "ru": {
   "n": "При убийстве",
   "d": "Эффект, который срабатывает, когда эта карта уничтожает другого персонажа в бою и выживает."
  },
  "zh-cn": {
   "n": "击杀时",
   "d": "这张卡牌在战斗中摧毁其他角色并存活时触发的效果。"
  }
 },
 "OnReveal": {
  "en": {
   "n": "On Reveal",
   "d": "An effect that happens when this is revealed to the opponent."
  },
  "it": {
   "n": "Alla rivelazione",
   "d": "Un effetto che si attiva quando questa carta viene rivelata all'avversario."
  },
  "es": {
   "n": "Al revelar",
   "d": "Un efecto que ocurre cuando esta carta es revelada al oponente."
  },
  "fr": {
   "n": "À la révélation",
   "d": "Un effet qui se déclenche quand cette carte est révélée à l'adversaire."
  },
  "pt": {
   "n": "Ao revelar",
   "d": "Um efeito que ocorre quando esta carta é revelada ao oponente."
  },
  "de": {
   "n": "Beim Aufdecken",
   "d": "Ein Effekt, der eintritt, wenn diese Karte dem Gegner aufgedeckt wird."
  },
  "ru": {
   "n": "При раскрытии",
   "d": "Эффект, который срабатывает, когда эта карта раскрывается противнику."
  },
  "zh-cn": {
   "n": "展示时",
   "d": "这张卡牌向对手展示时触发的效果。"
  }
 },
 "Ongoing": {
  "en": {
   "n": "Ongoing",
   "d": "An effect that is active while this is in play."
  },
  "it": {
   "n": "Continuo",
   "d": "Un effetto attivo finché questa carta è in gioco."
  },
  "es": {
   "n": "Continuo",
   "d": "Un efecto que está activo mientras esta carta está en juego."
  },
  "fr": {
   "n": "Permanent",
   "d": "Un effet actif tant que cette carte est en jeu."
  },
  "pt": {
   "n": "Contínuo",
   "d": "Um efeito que está ativo enquanto esta carta está em jogo."
  },
  "de": {
   "n": "Fortlaufend",
   "d": "Ein Effekt, der aktiv ist, solange diese Karte im Spiel ist."
  },
  "ru": {
   "n": "Постоянно",
   "d": "Эффект, который действует, пока эта карта находится в игре."
  },
  "zh-cn": {
   "n": "持续",
   "d": "这张卡牌在场时持续生效的效果。"
  }
 },
 "Rebirth": {
  "en": {
   "n": "Rebirth",
   "d": "The first time this is destroyed, return it to play with 1❤️."
  },
  "it": {
   "n": "Rinascita",
   "d": "La prima volta che questa carta viene distrutta, torna in gioco con 1❤️."
  },
  "es": {
   "n": "Renacer",
   "d": "La primera vez que esta carta es destruida, vuelve al juego con 1❤️."
  },
  "fr": {
   "n": "Renaissance",
   "d": "La première fois que cette carte est détruite, elle revient en jeu avec 1❤️."
  },
  "pt": {
   "n": "Renascimento",
   "d": "Na primeira vez que esta carta é destruída, ela volta ao jogo com 1❤️."
  },
  "de": {
   "n": "Wiedergeburt",
   "d": "Wenn diese Karte zum ersten Mal zerstört wird, kehrt sie mit 1❤️ ins Spiel zurück."
  },
  "ru": {
   "n": "Возрождение",
   "d": "Когда эта карта уничтожена впервые, она возвращается в игру с 1❤️."
  },
  "zh-cn": {
   "n": "重生",
   "d": "这张卡牌首次被摧毁时，以1❤️返回场上。"
  }
 },
 "Shield": {
  "en": {
   "n": "Shield",
   "d": "Prevent the next instance of damage this would take."
  },
  "it": {
   "n": "Scudo",
   "d": "Previene la prossima istanza di danno che questa carta subirebbe."
  },
  "es": {
   "n": "Escudo",
   "d": "Previene el próximo daño que esta carta recibiría."
  },
  "fr": {
   "n": "Bouclier",
   "d": "Empêche les prochains dégâts que cette carte subirait."
  },
  "pt": {
   "n": "Escudo",
   "d": "Previne o próximo dano que esta carta receberia."
  },
  "de": {
   "n": "Schild",
   "d": "Verhindert den nächsten Schaden, den diese Karte erleiden würde."
  },
  "ru": {
   "n": "Щит",
   "d": "Предотвращает следующий урон, который получила бы эта карта."
  },
  "zh-cn": {
   "n": "护盾",
   "d": "防止这张卡牌将要受到的下一次伤害。"
  }
 },
 "Snipe": {
  "en": {
   "n": "Snipe",
   "d": "When this attacks, deal damage equal to this card's Snipe value to the opponent's barrier at that location."
  },
  "it": {
   "n": "Tiro di precisione",
   "d": "Quando questa carta attacca, infligge danni pari al suo valore di Tiro di precisione alla barriera avversaria in quel luogo."
  },
  "es": {
   "n": "Disparo certero",
   "d": "Cuando esta carta ataca, inflige daño igual a su valor de Disparo certero a la barrera del oponente en esa ubicación."
  },
  "fr": {
   "n": "Tir de précision",
   "d": "Quand cette carte attaque, elle inflige des dégâts égaux à sa valeur de Tir de précision à la barrière adverse à ce lieu."
  },
  "pt": {
   "n": "Tiro certeiro",
   "d": "Quando esta carta ataca, causa dano igual ao seu valor de Tiro certeiro à barreira do oponente nessa localização."
  },
  "de": {
   "n": "Präzisionsschuss",
   "d": "Wenn diese Karte angreift, füge der gegnerischen Barriere an diesem Ort Schaden in Höhe ihres Präzisionsschuss-Werts zu."
  },
  "ru": {
   "n": "Меткий выстрел",
   "d": "Когда эта карта атакует, она наносит барьеру противника в этой локации урон, равный её значению «Меткого выстрела»."
  },
  "zh-cn": {
   "n": "狙击",
   "d": "这张卡牌攻击时，会对该地点对手的屏障造成等同于本卡“狙击”数值的伤害。"
  }
 },
 "Spellcast": {
  "en": {
   "n": "Spellcast",
   "d": "An effect that happens when you play a spell."
  },
  "it": {
   "n": "Lancio di magia",
   "d": "Un effetto che si attiva quando giochi una magia."
  },
  "es": {
   "n": "Al lanzar hechizo",
   "d": "Un efecto que ocurre cuando juegas un hechizo."
  },
  "fr": {
   "n": "Incantation",
   "d": "Un effet qui se déclenche quand tu joues un sort."
  },
  "pt": {
   "n": "Ao lançar feitiço",
   "d": "Um efeito que ocorre quando você joga um feitiço."
  },
  "de": {
   "n": "Zauberwirken",
   "d": "Ein Effekt, der eintritt, wenn du einen Zauber spielst."
  },
  "ru": {
   "n": "При заклинании",
   "d": "Эффект, который срабатывает, когда вы разыгрываете заклинание."
  },
  "zh-cn": {
   "n": "施法时",
   "d": "你打出法术时触发的效果。"
  }
 },
 "Stun": {
  "en": {
   "n": "Stun",
   "d": "Stunned characters do not attack or defend. Stunned wears off at the end of combat."
  },
  "it": {
   "n": "Stordimento",
   "d": "I personaggi storditi non attaccano né difendono. Lo stordimento termina alla fine del combattimento."
  },
  "es": {
   "n": "Aturdimiento",
   "d": "Los personajes aturdidos no atacan ni defienden. El aturdimiento termina al final del combate."
  },
  "fr": {
   "n": "Étourdissement",
   "d": "Les personnages étourdis n'attaquent ni ne défendent. L'étourdissement prend fin à la fin du combat."
  },
  "pt": {
   "n": "Atordoamento",
   "d": "Personagens atordoados não atacam nem defendem. O atordoamento termina no final do combate."
  },
  "de": {
   "n": "Betäubung",
   "d": "Betäubte Charaktere greifen nicht an und verteidigen nicht. Die Betäubung endet am Ende des Kampfes."
  },
  "ru": {
   "n": "Оглушение",
   "d": "Оглушённые персонажи не атакуют и не защищаются. Оглушение спадает в конце боя."
  },
  "zh-cn": {
   "n": "眩晕",
   "d": "已眩晕的角色不会攻击或防御。眩晕会在战斗结束时解除。"
  }
 },
 "Stunned": {
  "en": {
   "n": "Stunned",
   "d": "This does not attack or defend. Stunned wears off at the end of combat."
  },
  "it": {
   "n": "Stordito",
   "d": "Questo personaggio non attacca né difende. Lo stordimento termina alla fine del combattimento."
  },
  "es": {
   "n": "Aturdido",
   "d": "Este personaje no ataca ni defiende. El aturdimiento termina al final del combate."
  },
  "fr": {
   "n": "Étourdi",
   "d": "Ce personnage n'attaque ni ne défend. L'étourdissement prend fin à la fin du combat."
  },
  "pt": {
   "n": "Atordoado",
   "d": "Este personagem não ataca nem defende. O atordoamento termina no final do combate."
  },
  "de": {
   "n": "Betäubt",
   "d": "Dieser Charakter greift nicht an und verteidigt nicht. Die Betäubung endet am Ende des Kampfes."
  },
  "ru": {
   "n": "Оглушён",
   "d": "Этот персонаж не атакует и не защищается. Оглушение спадает в конце боя."
  },
  "zh-cn": {
   "n": "已眩晕",
   "d": "这张卡牌不会攻击或防御。眩晕会在战斗结束时解除。"
  }
 },
 "TemporaryCard": {
  "en": {
   "n": "Temporary Card",
   "d": "This will be discarded before combat if it is not played."
  },
  "it": {
   "n": "Carta temporanea",
   "d": "Questa carta verrà scartata prima del combattimento se non viene giocata."
  },
  "es": {
   "n": "Carta temporal",
   "d": "Esta carta será descartada antes del combate si no se juega."
  },
  "fr": {
   "n": "Carte temporaire",
   "d": "Cette carte sera défaussée avant le combat si elle n'est pas jouée."
  },
  "pt": {
   "n": "Carta temporária",
   "d": "Esta carta será descartada antes do combate se não for jogada."
  },
  "de": {
   "n": "Temporäre Karte",
   "d": "Diese Karte wird vor dem Kampf abgeworfen, wenn sie nicht gespielt wird."
  },
  "ru": {
   "n": "Временная карта",
   "d": "Эта карта будет сброшена перед боем, если её не разыграть."
  },
  "zh-cn": {
   "n": "临时卡牌",
   "d": "如果没有被打出，这张卡牌将在战斗前被弃掉。"
  }
 },
 "Trample": {
  "en": {
   "n": "Trample",
   "d": "Excess combat damage this deals to a character is dealt to the opponent's barrier at this location."
  },
  "it": {
   "n": "Travolgere",
   "d": "I danni da combattimento in eccesso che questa carta infligge a un personaggio vengono inflitti alla barriera avversaria in questo luogo."
  },
  "es": {
   "n": "Arrollar",
   "d": "El daño de combate excedente que esta carta inflige a un personaje se inflige a la barrera del oponente en esta ubicación."
  },
  "fr": {
   "n": "Piétinement",
   "d": "Les dégâts de combat excédentaires que cette carte inflige à un personnage sont infligés à la barrière adverse à ce lieu."
  },
  "pt": {
   "n": "Atropelar",
   "d": "O dano de combate excedente que esta carta causa a um personagem é causado à barreira do oponente nesta localização."
  },
  "de": {
   "n": "Überrennen",
   "d": "Überschüssiger Kampfschaden, den diese Karte einem Charakter zufügt, wird der gegnerischen Barriere an diesem Ort zugefügt."
  },
  "ru": {
   "n": "Пробивной удар",
   "d": "Избыточный боевой урон, который эта карта наносит персонажу, наносится барьеру противника в этой локации."
  },
  "zh-cn": {
   "n": "践踏",
   "d": "这张卡牌对角色造成的超额战斗伤害，将转为对此地点对手的屏障造成。"
  }
 }
};
