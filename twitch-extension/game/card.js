/* OriginsMeta Deck tracker: la carta del gioco (generato da tracker/scripts/twitch-panels.mjs da src/game-card/, non modificare a mano) */
"use strict";
(() => {
  // ../src/game-card/keywords.ts
  var KEYWORD_INFO = {
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
        "d": "Cuando esta carta ataca a un personaje enemigo, tambi\xE9n inflige da\xF1o a los personajes enemigos adyacentes en la misma ubicaci\xF3n."
      },
      "fr": {
        "n": "Balayage",
        "d": "Quand cette carte attaque un personnage ennemi, elle inflige aussi des d\xE9g\xE2ts aux personnages ennemis adjacents au m\xEAme lieu."
      },
      "pt": {
        "n": "Varredura",
        "d": "Quando esta carta ataca um personagem inimigo, tamb\xE9m causa dano aos personagens inimigos adjacentes na mesma localiza\xE7\xE3o."
      },
      "de": {
        "n": "Spaltschlag",
        "d": "Wenn diese Karte einen gegnerischen Charakter angreift, f\xFCgt sie auch angrenzenden gegnerischen Charakteren am selben Ort Schaden zu."
      },
      "ru": {
        "n": "\u0420\u0430\u0441\u0441\u0435\u0447\u0435\u043D\u0438\u0435",
        "d": "\u041A\u043E\u0433\u0434\u0430 \u044D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430 \u0430\u0442\u0430\u043A\u0443\u0435\u0442 \u0432\u0440\u0430\u0436\u0435\u0441\u043A\u043E\u0433\u043E \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430, \u043E\u043D\u0430 \u0442\u0430\u043A\u0436\u0435 \u043D\u0430\u043D\u043E\u0441\u0438\u0442 \u0443\u0440\u043E\u043D \u0441\u043E\u0441\u0435\u0434\u043D\u0438\u043C \u0432\u0440\u0430\u0436\u0435\u0441\u043A\u0438\u043C \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430\u043C \u0432 \u0442\u043E\u0439 \u0436\u0435 \u043B\u043E\u043A\u0430\u0446\u0438\u0438."
      },
      "zh-cn": {
        "n": "\u987A\u5288",
        "d": "\u8FD9\u5F20\u5361\u724C\u653B\u51FB\u654C\u65B9\u89D2\u8272\u65F6\uFF0C\u4E5F\u4F1A\u5BF9\u540C\u4E00\u5730\u70B9\u76F8\u90BB\u7684\u654C\u65B9\u89D2\u8272\u9020\u6210\u4F24\u5BB3\u3002"
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
        "n": "D\xE9but du combat",
        "d": "Un effet qui se d\xE9clenche au d\xE9but du combat."
      },
      "pt": {
        "n": "In\xEDcio de combate",
        "d": "Um efeito que ocorre no in\xEDcio do combate."
      },
      "de": {
        "n": "Kampfbeginn",
        "d": "Ein Effekt, der zu Beginn des Kampfes eintritt."
      },
      "ru": {
        "n": "\u041D\u0430\u0447\u0430\u043B\u043E \u0431\u043E\u044F",
        "d": "\u042D\u0444\u0444\u0435\u043A\u0442, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0441\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442 \u0432 \u043D\u0430\u0447\u0430\u043B\u0435 \u0431\u043E\u044F."
      },
      "zh-cn": {
        "n": "\u6218\u6597\u5F00\u59CB",
        "d": "\u5728\u6218\u6597\u5F00\u59CB\u65F6\u89E6\u53D1\u7684\u6548\u679C\u3002"
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
        "d": "Cuando esta carta inflige da\xF1o a un personaje, este es destruido."
      },
      "fr": {
        "n": "Contact mortel",
        "d": "Quand cette carte inflige des d\xE9g\xE2ts \xE0 un personnage, celui-ci est d\xE9truit."
      },
      "pt": {
        "n": "Toque mort\xEDfero",
        "d": "Quando esta carta causa dano a um personagem, ele \xE9 destru\xEDdo."
      },
      "de": {
        "n": "Todesber\xFChrung",
        "d": "Wenn diese Karte einem Charakter Schaden zuf\xFCgt, wird dieser zerst\xF6rt."
      },
      "ru": {
        "n": "\u0421\u043C\u0435\u0440\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043A\u0430\u0441\u0430\u043D\u0438\u0435",
        "d": "\u041A\u043E\u0433\u0434\u0430 \u044D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430 \u043D\u0430\u043D\u043E\u0441\u0438\u0442 \u0443\u0440\u043E\u043D \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0443, \u043E\u043D \u0443\u043D\u0438\u0447\u0442\u043E\u0436\u0430\u0435\u0442\u0441\u044F."
      },
      "zh-cn": {
        "n": "\u6B7B\u89E6",
        "d": "\u8FD9\u5F20\u5361\u724C\u5BF9\u89D2\u8272\u9020\u6210\u4F24\u5BB3\u65F6\uFF0C\u6467\u6BC1\u8BE5\u89D2\u8272\u3002"
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
        "d": "Cuando un personaje enemigo fuera a atacar tu barrera aqu\xED, esta carta la defiende."
      },
      "fr": {
        "n": "D\xE9fenseur",
        "d": "Quand un personnage ennemi attaquerait ta barri\xE8re ici, cette carte la d\xE9fend."
      },
      "pt": {
        "n": "Defensor",
        "d": "Quando um personagem inimigo for atacar a sua barreira aqui, esta carta a defende."
      },
      "de": {
        "n": "Verteidiger",
        "d": "Wenn ein gegnerischer Charakter deine Barriere hier angreifen w\xFCrde, verteidigt diese Karte sie."
      },
      "ru": {
        "n": "\u0417\u0430\u0449\u0438\u0442\u043D\u0438\u043A",
        "d": "\u041A\u043E\u0433\u0434\u0430 \u0432\u0440\u0430\u0436\u0435\u0441\u043A\u0438\u0439 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436 \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044F \u0430\u0442\u0430\u043A\u043E\u0432\u0430\u0442\u044C \u0432\u0430\u0448 \u0431\u0430\u0440\u044C\u0435\u0440 \u0437\u0434\u0435\u0441\u044C, \u044D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430 \u0437\u0430\u0449\u0438\u0449\u0430\u0435\u0442 \u0435\u0433\u043E."
      },
      "zh-cn": {
        "n": "\u5B88\u62A4\u8005",
        "d": "\u654C\u65B9\u89D2\u8272\u5C06\u8981\u653B\u51FB\u4F60\u5728\u6B64\u5730\u70B9\u7684\u5C4F\u969C\u65F6\uFF0C\u7531\u8FD9\u5F20\u5361\u724C\u8FDB\u884C\u9632\u5FA1\u3002"
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
        "n": "\u0414\u0432\u043E\u0439\u043D\u0430\u044F \u0430\u0442\u0430\u043A\u0430",
        "d": "\u042D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430 \u0430\u0442\u0430\u043A\u0443\u0435\u0442 \u0434\u0432\u0430\u0436\u0434\u044B \u0437\u0430 \u0431\u043E\u0439."
      },
      "zh-cn": {
        "n": "\u53CC\u91CD\u653B\u51FB",
        "d": "\u8FD9\u5F20\u5361\u724C\u5728\u6218\u6597\u4E2D\u653B\u51FB\u4E24\u6B21\u3002"
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
        "d": "Siempre se revela antes que las otras cartas, sin importar qui\xE9n revela primero."
      },
      "fr": {
        "n": "R\xE9v\xE8le en premier",
        "d": "Se r\xE9v\xE8le toujours avant les autres cartes, peu importe qui r\xE9v\xE8le en premier."
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
        "n": "\u041F\u0435\u0440\u0432\u043E\u0435 \u0440\u0430\u0441\u043A\u0440\u044B\u0442\u0438\u0435",
        "d": "\u0412\u0441\u0435\u0433\u0434\u0430 \u0440\u0430\u0441\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0440\u0430\u043D\u044C\u0448\u0435 \u0434\u0440\u0443\u0433\u0438\u0445 \u043A\u0430\u0440\u0442, \u043D\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E \u043E\u0442 \u0442\u043E\u0433\u043E, \u043A\u0442\u043E \u0440\u0430\u0441\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u0435\u0440\u0432\u044B\u043C."
      },
      "zh-cn": {
        "n": "\u4F18\u5148\u5C55\u793A",
        "d": "\u65E0\u8BBA\u8C01\u5148\u5C55\u793A\uFF0C\u8FD9\u5F20\u5361\u724C\u603B\u662F\u5148\u4E8E\u5176\u4ED6\u5361\u724C\u5C55\u793A\u3002"
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
        "n": "Premi\xE8re frappe",
        "d": "Cette carte attaque avant les personnages sans Premi\xE8re frappe pendant le combat."
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
        "n": "\u041F\u0435\u0440\u0432\u044B\u0439 \u0443\u0434\u0430\u0440",
        "d": "\u042D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430 \u0430\u0442\u0430\u043A\u0443\u0435\u0442 \u0432 \u0431\u043E\u044E \u0440\u0430\u043D\u044C\u0448\u0435 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439 \u0431\u0435\u0437 \xAB\u041F\u0435\u0440\u0432\u043E\u0433\u043E \u0443\u0434\u0430\u0440\u0430\xBB."
      },
      "zh-cn": {
        "n": "\u5148\u653B",
        "d": "\u5728\u6218\u6597\u4E2D\uFF0C\u8FD9\u5F20\u5361\u724C\u6BD4\u6CA1\u6709\u201C\u5148\u653B\u201D\u7684\u89D2\u8272\u66F4\u65E9\u653B\u51FB\u3002"
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
        "d": "El da\xF1o que se infligir\xEDa a tu barrera en esta ubicaci\xF3n se inflige a esta carta en su lugar."
      },
      "fr": {
        "n": "Garde",
        "d": "Les d\xE9g\xE2ts qui seraient inflig\xE9s \xE0 ta barri\xE8re \xE0 ce lieu sont inflig\xE9s \xE0 cette carte \xE0 la place."
      },
      "pt": {
        "n": "Guarda",
        "d": "O dano que seria causado \xE0 sua barreira nesta localiza\xE7\xE3o \xE9 causado a esta carta em vez disso."
      },
      "de": {
        "n": "Wache",
        "d": "Schaden, der deiner Barriere an diesem Ort zugef\xFCgt w\xFCrde, wird stattdessen dieser Karte zugef\xFCgt."
      },
      "ru": {
        "n": "\u0417\u0430\u0441\u043B\u043E\u043D",
        "d": "\u0423\u0440\u043E\u043D, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0431\u044B\u043B \u0431\u044B \u043D\u0430\u043D\u0435\u0441\u0451\u043D \u0432\u0430\u0448\u0435\u043C\u0443 \u0431\u0430\u0440\u044C\u0435\u0440\u0443 \u0432 \u044D\u0442\u043E\u0439 \u043B\u043E\u043A\u0430\u0446\u0438\u0438, \u0432\u043C\u0435\u0441\u0442\u043E \u044D\u0442\u043E\u0433\u043E \u043D\u0430\u043D\u043E\u0441\u0438\u0442\u0441\u044F \u044D\u0442\u043E\u0439 \u043A\u0430\u0440\u0442\u0435."
      },
      "zh-cn": {
        "n": "\u62A4\u536B",
        "d": "\u5C06\u8981\u5BF9\u4F60\u5728\u6B64\u5730\u70B9\u7684\u5C4F\u969C\u9020\u6210\u7684\u4F24\u5BB3\uFF0C\u8F6C\u4E3A\u5BF9\u8FD9\u5F20\u5361\u724C\u9020\u6210\u3002"
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
        "d": "Activa un efecto la primera vez que un personaje est\xE1 en el espacio donde est\xE1 esta carta."
      },
      "fr": {
        "n": "Objet",
        "d": "Active un effet la premi\xE8re fois qu'un personnage se trouve sur l'espace o\xF9 se trouve cette carte."
      },
      "pt": {
        "n": "Item",
        "d": "Ativa um efeito na primeira vez que um personagem estiver no espa\xE7o onde esta carta est\xE1."
      },
      "de": {
        "n": "Gegenstand",
        "d": "Aktiviert einen Effekt, wenn sich zum ersten Mal ein Charakter auf dem Feld befindet, auf dem diese Karte liegt."
      },
      "ru": {
        "n": "\u041F\u0440\u0435\u0434\u043C\u0435\u0442",
        "d": "\u0410\u043A\u0442\u0438\u0432\u0438\u0440\u0443\u0435\u0442 \u044D\u0444\u0444\u0435\u043A\u0442, \u043A\u043E\u0433\u0434\u0430 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436 \u0432\u043F\u0435\u0440\u0432\u044B\u0435 \u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0432 \u044F\u0447\u0435\u0439\u043A\u0435, \u0433\u0434\u0435 \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u0441\u044F \u044D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430."
      },
      "zh-cn": {
        "n": "\u7269\u54C1",
        "d": "\u5F53\u89D2\u8272\u9996\u6B21\u8FDB\u5165\u8FD9\u5F20\u5361\u724C\u6240\u5728\u7684\u683C\u5B50\u65F6\uFF0C\u89E6\u53D1\u4E00\u4E2A\u6548\u679C\u3002"
      }
    },
    "Move": {
      "en": {
        "n": "Move",
        "d": "This can move once. Use this ability before playing cards for the round."
      },
      "it": {
        "n": "Muovere",
        "d": "Questa carta pu\xF2 muoversi una volta. Usa questa abilit\xE0 prima di giocare le carte per il round."
      },
      "es": {
        "n": "Mover",
        "d": "Esta carta puede moverse una vez. Usa esta habilidad antes de jugar cartas para la ronda."
      },
      "fr": {
        "n": "D\xE9placer",
        "d": "Cette carte peut se d\xE9placer une fois. Utilise cette capacit\xE9 avant de jouer des cartes pour la manche."
      },
      "pt": {
        "n": "Mover",
        "d": "Esta carta pode se mover uma vez. Use esta habilidade antes de jogar cartas na rodada."
      },
      "de": {
        "n": "Bewegen",
        "d": "Diese Karte kann sich einmal bewegen. Nutze diese F\xE4higkeit, bevor du Karten f\xFCr die Runde spielst."
      },
      "ru": {
        "n": "\u041F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D\u0438\u0435",
        "d": "\u042D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430 \u043C\u043E\u0436\u0435\u0442 \u043F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u044C\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u044D\u0442\u0443 \u0441\u043F\u043E\u0441\u043E\u0431\u043D\u043E\u0441\u0442\u044C \u0434\u043E \u0440\u043E\u0437\u044B\u0433\u0440\u044B\u0448\u0430 \u043A\u0430\u0440\u0442 \u0432 \u0440\u0430\u0443\u043D\u0434\u0435."
      },
      "zh-cn": {
        "n": "\u79FB\u52A8",
        "d": "\u8FD9\u5F20\u5361\u724C\u53EF\u4EE5\u79FB\u52A8\u4E00\u6B21\u3002\u8BF7\u5728\u672C\u56DE\u5408\u6253\u51FA\u5361\u724C\u4E4B\u524D\u4F7F\u7528\u6B64\u80FD\u529B\u3002"
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
        "n": "\xC0 la mort",
        "d": "Un effet qui se d\xE9clenche quand cette carte est d\xE9truite."
      },
      "pt": {
        "n": "Ao morrer",
        "d": "Um efeito que ocorre quando esta carta \xE9 destru\xEDda."
      },
      "de": {
        "n": "Bei Tod",
        "d": "Ein Effekt, der eintritt, wenn diese Karte zerst\xF6rt wird."
      },
      "ru": {
        "n": "\u041F\u0440\u0438 \u0441\u043C\u0435\u0440\u0442\u0438",
        "d": "\u042D\u0444\u0444\u0435\u043A\u0442, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0441\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442, \u043A\u043E\u0433\u0434\u0430 \u044D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430 \u0443\u043D\u0438\u0447\u0442\u043E\u0436\u0435\u043D\u0430."
      },
      "zh-cn": {
        "n": "\u6B7B\u4EA1\u65F6",
        "d": "\u8FD9\u5F20\u5361\u724C\u88AB\u6467\u6BC1\u65F6\u89E6\u53D1\u7684\u6548\u679C\u3002"
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
        "n": "\xC0 l'\xE9limination",
        "d": "Un effet qui se d\xE9clenche quand cette carte d\xE9truit un autre personnage en combat et survit."
      },
      "pt": {
        "n": "Ao matar",
        "d": "Um efeito que ocorre quando esta carta destr\xF3i outro personagem em combate e sobrevive."
      },
      "de": {
        "n": "Bei Vernichtung",
        "d": "Ein Effekt, der eintritt, wenn diese Karte einen anderen Charakter im Kampf zerst\xF6rt und \xFCberlebt."
      },
      "ru": {
        "n": "\u041F\u0440\u0438 \u0443\u0431\u0438\u0439\u0441\u0442\u0432\u0435",
        "d": "\u042D\u0444\u0444\u0435\u043A\u0442, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0441\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442, \u043A\u043E\u0433\u0434\u0430 \u044D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430 \u0443\u043D\u0438\u0447\u0442\u043E\u0436\u0430\u0435\u0442 \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430 \u0432 \u0431\u043E\u044E \u0438 \u0432\u044B\u0436\u0438\u0432\u0430\u0435\u0442."
      },
      "zh-cn": {
        "n": "\u51FB\u6740\u65F6",
        "d": "\u8FD9\u5F20\u5361\u724C\u5728\u6218\u6597\u4E2D\u6467\u6BC1\u5176\u4ED6\u89D2\u8272\u5E76\u5B58\u6D3B\u65F6\u89E6\u53D1\u7684\u6548\u679C\u3002"
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
        "n": "\xC0 la r\xE9v\xE9lation",
        "d": "Un effet qui se d\xE9clenche quand cette carte est r\xE9v\xE9l\xE9e \xE0 l'adversaire."
      },
      "pt": {
        "n": "Ao revelar",
        "d": "Um efeito que ocorre quando esta carta \xE9 revelada ao oponente."
      },
      "de": {
        "n": "Beim Aufdecken",
        "d": "Ein Effekt, der eintritt, wenn diese Karte dem Gegner aufgedeckt wird."
      },
      "ru": {
        "n": "\u041F\u0440\u0438 \u0440\u0430\u0441\u043A\u0440\u044B\u0442\u0438\u0438",
        "d": "\u042D\u0444\u0444\u0435\u043A\u0442, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0441\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442, \u043A\u043E\u0433\u0434\u0430 \u044D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430 \u0440\u0430\u0441\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u043E\u0442\u0438\u0432\u043D\u0438\u043A\u0443."
      },
      "zh-cn": {
        "n": "\u5C55\u793A\u65F6",
        "d": "\u8FD9\u5F20\u5361\u724C\u5411\u5BF9\u624B\u5C55\u793A\u65F6\u89E6\u53D1\u7684\u6548\u679C\u3002"
      }
    },
    "Ongoing": {
      "en": {
        "n": "Ongoing",
        "d": "An effect that is active while this is in play."
      },
      "it": {
        "n": "Continuo",
        "d": "Un effetto attivo finch\xE9 questa carta \xE8 in gioco."
      },
      "es": {
        "n": "Continuo",
        "d": "Un efecto que est\xE1 activo mientras esta carta est\xE1 en juego."
      },
      "fr": {
        "n": "Permanent",
        "d": "Un effet actif tant que cette carte est en jeu."
      },
      "pt": {
        "n": "Cont\xEDnuo",
        "d": "Um efeito que est\xE1 ativo enquanto esta carta est\xE1 em jogo."
      },
      "de": {
        "n": "Fortlaufend",
        "d": "Ein Effekt, der aktiv ist, solange diese Karte im Spiel ist."
      },
      "ru": {
        "n": "\u041F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u043E",
        "d": "\u042D\u0444\u0444\u0435\u043A\u0442, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442, \u043F\u043E\u043A\u0430 \u044D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430 \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u0441\u044F \u0432 \u0438\u0433\u0440\u0435."
      },
      "zh-cn": {
        "n": "\u6301\u7EED",
        "d": "\u8FD9\u5F20\u5361\u724C\u5728\u573A\u65F6\u6301\u7EED\u751F\u6548\u7684\u6548\u679C\u3002"
      }
    },
    "Rebirth": {
      "en": {
        "n": "Rebirth",
        "d": "The first time this is destroyed, return it to play with 1\u2764\uFE0F."
      },
      "it": {
        "n": "Rinascita",
        "d": "La prima volta che questa carta viene distrutta, torna in gioco con 1\u2764\uFE0F."
      },
      "es": {
        "n": "Renacer",
        "d": "La primera vez que esta carta es destruida, vuelve al juego con 1\u2764\uFE0F."
      },
      "fr": {
        "n": "Renaissance",
        "d": "La premi\xE8re fois que cette carte est d\xE9truite, elle revient en jeu avec 1\u2764\uFE0F."
      },
      "pt": {
        "n": "Renascimento",
        "d": "Na primeira vez que esta carta \xE9 destru\xEDda, ela volta ao jogo com 1\u2764\uFE0F."
      },
      "de": {
        "n": "Wiedergeburt",
        "d": "Wenn diese Karte zum ersten Mal zerst\xF6rt wird, kehrt sie mit 1\u2764\uFE0F ins Spiel zur\xFCck."
      },
      "ru": {
        "n": "\u0412\u043E\u0437\u0440\u043E\u0436\u0434\u0435\u043D\u0438\u0435",
        "d": "\u041A\u043E\u0433\u0434\u0430 \u044D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430 \u0443\u043D\u0438\u0447\u0442\u043E\u0436\u0435\u043D\u0430 \u0432\u043F\u0435\u0440\u0432\u044B\u0435, \u043E\u043D\u0430 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044F \u0432 \u0438\u0433\u0440\u0443 \u0441 1\u2764\uFE0F."
      },
      "zh-cn": {
        "n": "\u91CD\u751F",
        "d": "\u8FD9\u5F20\u5361\u724C\u9996\u6B21\u88AB\u6467\u6BC1\u65F6\uFF0C\u4EE51\u2764\uFE0F\u8FD4\u56DE\u573A\u4E0A\u3002"
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
        "d": "Previene el pr\xF3ximo da\xF1o que esta carta recibir\xEDa."
      },
      "fr": {
        "n": "Bouclier",
        "d": "Emp\xEAche les prochains d\xE9g\xE2ts que cette carte subirait."
      },
      "pt": {
        "n": "Escudo",
        "d": "Previne o pr\xF3ximo dano que esta carta receberia."
      },
      "de": {
        "n": "Schild",
        "d": "Verhindert den n\xE4chsten Schaden, den diese Karte erleiden w\xFCrde."
      },
      "ru": {
        "n": "\u0429\u0438\u0442",
        "d": "\u041F\u0440\u0435\u0434\u043E\u0442\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0443\u0440\u043E\u043D, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u0430 \u0431\u044B \u044D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430."
      },
      "zh-cn": {
        "n": "\u62A4\u76FE",
        "d": "\u9632\u6B62\u8FD9\u5F20\u5361\u724C\u5C06\u8981\u53D7\u5230\u7684\u4E0B\u4E00\u6B21\u4F24\u5BB3\u3002"
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
        "d": "Cuando esta carta ataca, inflige da\xF1o igual a su valor de Disparo certero a la barrera del oponente en esa ubicaci\xF3n."
      },
      "fr": {
        "n": "Tir de pr\xE9cision",
        "d": "Quand cette carte attaque, elle inflige des d\xE9g\xE2ts \xE9gaux \xE0 sa valeur de Tir de pr\xE9cision \xE0 la barri\xE8re adverse \xE0 ce lieu."
      },
      "pt": {
        "n": "Tiro certeiro",
        "d": "Quando esta carta ataca, causa dano igual ao seu valor de Tiro certeiro \xE0 barreira do oponente nessa localiza\xE7\xE3o."
      },
      "de": {
        "n": "Pr\xE4zisionsschuss",
        "d": "Wenn diese Karte angreift, f\xFCge der gegnerischen Barriere an diesem Ort Schaden in H\xF6he ihres Pr\xE4zisionsschuss-Werts zu."
      },
      "ru": {
        "n": "\u041C\u0435\u0442\u043A\u0438\u0439 \u0432\u044B\u0441\u0442\u0440\u0435\u043B",
        "d": "\u041A\u043E\u0433\u0434\u0430 \u044D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430 \u0430\u0442\u0430\u043A\u0443\u0435\u0442, \u043E\u043D\u0430 \u043D\u0430\u043D\u043E\u0441\u0438\u0442 \u0431\u0430\u0440\u044C\u0435\u0440\u0443 \u043F\u0440\u043E\u0442\u0438\u0432\u043D\u0438\u043A\u0430 \u0432 \u044D\u0442\u043E\u0439 \u043B\u043E\u043A\u0430\u0446\u0438\u0438 \u0443\u0440\u043E\u043D, \u0440\u0430\u0432\u043D\u044B\u0439 \u0435\u0451 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044E \xAB\u041C\u0435\u0442\u043A\u043E\u0433\u043E \u0432\u044B\u0441\u0442\u0440\u0435\u043B\u0430\xBB."
      },
      "zh-cn": {
        "n": "\u72D9\u51FB",
        "d": "\u8FD9\u5F20\u5361\u724C\u653B\u51FB\u65F6\uFF0C\u4F1A\u5BF9\u8BE5\u5730\u70B9\u5BF9\u624B\u7684\u5C4F\u969C\u9020\u6210\u7B49\u540C\u4E8E\u672C\u5361\u201C\u72D9\u51FB\u201D\u6570\u503C\u7684\u4F24\u5BB3\u3002"
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
        "d": "Un effet qui se d\xE9clenche quand tu joues un sort."
      },
      "pt": {
        "n": "Ao lan\xE7ar feiti\xE7o",
        "d": "Um efeito que ocorre quando voc\xEA joga um feiti\xE7o."
      },
      "de": {
        "n": "Zauberwirken",
        "d": "Ein Effekt, der eintritt, wenn du einen Zauber spielst."
      },
      "ru": {
        "n": "\u041F\u0440\u0438 \u0437\u0430\u043A\u043B\u0438\u043D\u0430\u043D\u0438\u0438",
        "d": "\u042D\u0444\u0444\u0435\u043A\u0442, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0441\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442, \u043A\u043E\u0433\u0434\u0430 \u0432\u044B \u0440\u0430\u0437\u044B\u0433\u0440\u044B\u0432\u0430\u0435\u0442\u0435 \u0437\u0430\u043A\u043B\u0438\u043D\u0430\u043D\u0438\u0435."
      },
      "zh-cn": {
        "n": "\u65BD\u6CD5\u65F6",
        "d": "\u4F60\u6253\u51FA\u6CD5\u672F\u65F6\u89E6\u53D1\u7684\u6548\u679C\u3002"
      }
    },
    "Stun": {
      "en": {
        "n": "Stun",
        "d": "Stunned characters do not attack or defend. Stunned wears off at the end of combat."
      },
      "it": {
        "n": "Stordimento",
        "d": "I personaggi storditi non attaccano n\xE9 difendono. Lo stordimento termina alla fine del combattimento."
      },
      "es": {
        "n": "Aturdimiento",
        "d": "Los personajes aturdidos no atacan ni defienden. El aturdimiento termina al final del combate."
      },
      "fr": {
        "n": "\xC9tourdissement",
        "d": "Les personnages \xE9tourdis n'attaquent ni ne d\xE9fendent. L'\xE9tourdissement prend fin \xE0 la fin du combat."
      },
      "pt": {
        "n": "Atordoamento",
        "d": "Personagens atordoados n\xE3o atacam nem defendem. O atordoamento termina no final do combate."
      },
      "de": {
        "n": "Bet\xE4ubung",
        "d": "Bet\xE4ubte Charaktere greifen nicht an und verteidigen nicht. Die Bet\xE4ubung endet am Ende des Kampfes."
      },
      "ru": {
        "n": "\u041E\u0433\u043B\u0443\u0448\u0435\u043D\u0438\u0435",
        "d": "\u041E\u0433\u043B\u0443\u0448\u0451\u043D\u043D\u044B\u0435 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0438 \u043D\u0435 \u0430\u0442\u0430\u043A\u0443\u044E\u0442 \u0438 \u043D\u0435 \u0437\u0430\u0449\u0438\u0449\u0430\u044E\u0442\u0441\u044F. \u041E\u0433\u043B\u0443\u0448\u0435\u043D\u0438\u0435 \u0441\u043F\u0430\u0434\u0430\u0435\u0442 \u0432 \u043A\u043E\u043D\u0446\u0435 \u0431\u043E\u044F."
      },
      "zh-cn": {
        "n": "\u7729\u6655",
        "d": "\u5DF2\u7729\u6655\u7684\u89D2\u8272\u4E0D\u4F1A\u653B\u51FB\u6216\u9632\u5FA1\u3002\u7729\u6655\u4F1A\u5728\u6218\u6597\u7ED3\u675F\u65F6\u89E3\u9664\u3002"
      }
    },
    "Stunned": {
      "en": {
        "n": "Stunned",
        "d": "This does not attack or defend. Stunned wears off at the end of combat."
      },
      "it": {
        "n": "Stordito",
        "d": "Questo personaggio non attacca n\xE9 difende. Lo stordimento termina alla fine del combattimento."
      },
      "es": {
        "n": "Aturdido",
        "d": "Este personaje no ataca ni defiende. El aturdimiento termina al final del combate."
      },
      "fr": {
        "n": "\xC9tourdi",
        "d": "Ce personnage n'attaque ni ne d\xE9fend. L'\xE9tourdissement prend fin \xE0 la fin du combat."
      },
      "pt": {
        "n": "Atordoado",
        "d": "Este personagem n\xE3o ataca nem defende. O atordoamento termina no final do combate."
      },
      "de": {
        "n": "Bet\xE4ubt",
        "d": "Dieser Charakter greift nicht an und verteidigt nicht. Die Bet\xE4ubung endet am Ende des Kampfes."
      },
      "ru": {
        "n": "\u041E\u0433\u043B\u0443\u0448\u0451\u043D",
        "d": "\u042D\u0442\u043E\u0442 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436 \u043D\u0435 \u0430\u0442\u0430\u043A\u0443\u0435\u0442 \u0438 \u043D\u0435 \u0437\u0430\u0449\u0438\u0449\u0430\u0435\u0442\u0441\u044F. \u041E\u0433\u043B\u0443\u0448\u0435\u043D\u0438\u0435 \u0441\u043F\u0430\u0434\u0430\u0435\u0442 \u0432 \u043A\u043E\u043D\u0446\u0435 \u0431\u043E\u044F."
      },
      "zh-cn": {
        "n": "\u5DF2\u7729\u6655",
        "d": "\u8FD9\u5F20\u5361\u724C\u4E0D\u4F1A\u653B\u51FB\u6216\u9632\u5FA1\u3002\u7729\u6655\u4F1A\u5728\u6218\u6597\u7ED3\u675F\u65F6\u89E3\u9664\u3002"
      }
    },
    "TemporaryCard": {
      "en": {
        "n": "Temporary Card",
        "d": "This will be discarded before combat if it is not played."
      },
      "it": {
        "n": "Carta temporanea",
        "d": "Questa carta verr\xE0 scartata prima del combattimento se non viene giocata."
      },
      "es": {
        "n": "Carta temporal",
        "d": "Esta carta ser\xE1 descartada antes del combate si no se juega."
      },
      "fr": {
        "n": "Carte temporaire",
        "d": "Cette carte sera d\xE9fauss\xE9e avant le combat si elle n'est pas jou\xE9e."
      },
      "pt": {
        "n": "Carta tempor\xE1ria",
        "d": "Esta carta ser\xE1 descartada antes do combate se n\xE3o for jogada."
      },
      "de": {
        "n": "Tempor\xE4re Karte",
        "d": "Diese Karte wird vor dem Kampf abgeworfen, wenn sie nicht gespielt wird."
      },
      "ru": {
        "n": "\u0412\u0440\u0435\u043C\u0435\u043D\u043D\u0430\u044F \u043A\u0430\u0440\u0442\u0430",
        "d": "\u042D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430 \u0431\u0443\u0434\u0435\u0442 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u0430 \u043F\u0435\u0440\u0435\u0434 \u0431\u043E\u0435\u043C, \u0435\u0441\u043B\u0438 \u0435\u0451 \u043D\u0435 \u0440\u0430\u0437\u044B\u0433\u0440\u0430\u0442\u044C."
      },
      "zh-cn": {
        "n": "\u4E34\u65F6\u5361\u724C",
        "d": "\u5982\u679C\u6CA1\u6709\u88AB\u6253\u51FA\uFF0C\u8FD9\u5F20\u5361\u724C\u5C06\u5728\u6218\u6597\u524D\u88AB\u5F03\u6389\u3002"
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
        "d": "El da\xF1o de combate excedente que esta carta inflige a un personaje se inflige a la barrera del oponente en esta ubicaci\xF3n."
      },
      "fr": {
        "n": "Pi\xE9tinement",
        "d": "Les d\xE9g\xE2ts de combat exc\xE9dentaires que cette carte inflige \xE0 un personnage sont inflig\xE9s \xE0 la barri\xE8re adverse \xE0 ce lieu."
      },
      "pt": {
        "n": "Atropelar",
        "d": "O dano de combate excedente que esta carta causa a um personagem \xE9 causado \xE0 barreira do oponente nesta localiza\xE7\xE3o."
      },
      "de": {
        "n": "\xDCberrennen",
        "d": "\xDCbersch\xFCssiger Kampfschaden, den diese Karte einem Charakter zuf\xFCgt, wird der gegnerischen Barriere an diesem Ort zugef\xFCgt."
      },
      "ru": {
        "n": "\u041F\u0440\u043E\u0431\u0438\u0432\u043D\u043E\u0439 \u0443\u0434\u0430\u0440",
        "d": "\u0418\u0437\u0431\u044B\u0442\u043E\u0447\u043D\u044B\u0439 \u0431\u043E\u0435\u0432\u043E\u0439 \u0443\u0440\u043E\u043D, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u044D\u0442\u0430 \u043A\u0430\u0440\u0442\u0430 \u043D\u0430\u043D\u043E\u0441\u0438\u0442 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0443, \u043D\u0430\u043D\u043E\u0441\u0438\u0442\u0441\u044F \u0431\u0430\u0440\u044C\u0435\u0440\u0443 \u043F\u0440\u043E\u0442\u0438\u0432\u043D\u0438\u043A\u0430 \u0432 \u044D\u0442\u043E\u0439 \u043B\u043E\u043A\u0430\u0446\u0438\u0438."
      },
      "zh-cn": {
        "n": "\u8DF5\u8E0F",
        "d": "\u8FD9\u5F20\u5361\u724C\u5BF9\u89D2\u8272\u9020\u6210\u7684\u8D85\u989D\u6218\u6597\u4F24\u5BB3\uFF0C\u5C06\u8F6C\u4E3A\u5BF9\u6B64\u5730\u70B9\u5BF9\u624B\u7684\u5C4F\u969C\u9020\u6210\u3002"
      }
    }
  };

  // ../src/game-card/model.ts
  var ALIGN_LABEL = {
    en: { good: "Good", evil: "Evil" },
    it: { good: "Buono", evil: "Malvagio" },
    es: { good: "Bueno", evil: "Malvado" },
    fr: { good: "Bon", evil: "Mauvais" },
    pt: { good: "Bom", evil: "Maligno" },
    de: { good: "Gut", evil: "B\xF6se" },
    ru: { good: "\u0414\u043E\u0431\u0440\u044B\u0439", evil: "\u0417\u043B\u043E\u0439" },
    "zh-cn": { good: "\u5584\u826F", evil: "\u90AA\u6076" }
  };
  var KEYWORDS = [
    ...["On Reveal", "On Death", "On Kill", "Ongoing", "First Strike", "Double Attack", "Deathtouch", "Defender", "Discard", "Rebirth"],
    ...["Shield", "Snipe", "Stun", "Summon", "Trample", "Vanilla", "Relentless"],
    ...["Alla rivelazione", "Alla morte", "All'uccisione", "Primo colpo", "Doppio attacco", "Tocco letale", "Difensore", "Rinascita"],
    ...["Scudo", "Tiro di precisione", "Stordisci", "Travolgere"],
    ...["Al revelar", "Al morir", "Al matar", "Primer golpe", "Ataque doble", "Toque mortal", "Defensor", "Renacer", "Escudo"],
    ...["Disparo certero", "Aturde", "Arrollar"],
    ...["\xC0 la r\xE9v\xE9lation", "\xC0 la mort", "\xC0 l'\xE9limination", "Premi\xE8re frappe", "Double attaque", "Contact mortel", "D\xE9fenseur", "Renaissance"],
    ...["Bouclier", "Tir de pr\xE9cision", "\xC9tourdissez", "Pi\xE9tinement"],
    ...["Ao revelar", "Ao morrer", "Ao matar", "Primeiro golpe", "Ataque duplo", "Toque mort\xEDfero", "Renascimento"],
    ...["Tiro certeiro", "Atordoa", "Atropelar"],
    ...["Beim Aufdecken", "Bei Tod", "Bei Vernichtung", "Erstschlag", "Doppelangriff", "Todesber\xFChrung", "Verteidiger", "Wiedergeburt"],
    ...["Schild", "Pr\xE4zisionsschuss", "Bet\xE4ube", "\xDCberrennen"]
  ];
  var KEYWORDS_RU = [
    ...["\u041F\u0440\u0438 \u0440\u0430\u0441\u043A\u0440\u044B\u0442\u0438\u0438", "\u041F\u0440\u0438 \u0441\u043C\u0435\u0440\u0442\u0438", "\u041F\u0440\u0438 \u0443\u0431\u0438\u0439\u0441\u0442\u0432\u0435", "\u041F\u0435\u0440\u0432\u044B\u0439 \u0443\u0434\u0430\u0440", "\u041F\u0435\u0440\u0432\u044B\u043C \u0443\u0434\u0430\u0440\u043E\u043C", "\u041F\u0435\u0440\u0432\u043E\u0433\u043E \u0443\u0434\u0430\u0440\u0430"],
    ...["\u0414\u0432\u043E\u0439\u043D\u0430\u044F \u0430\u0442\u0430\u043A\u0430", "\u0414\u0432\u043E\u0439\u043D\u0443\u044E \u0430\u0442\u0430\u043A\u0443", "\u0414\u0432\u043E\u0439\u043D\u043E\u0439 \u0430\u0442\u0430\u043A\u043E\u0439", "\u0414\u0432\u043E\u0439\u043D\u043E\u0439 \u0430\u0442\u0430\u043A\u0438"],
    ...["\u0421\u043C\u0435\u0440\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043A\u0430\u0441\u0430\u043D\u0438\u0435", "\u0421\u043C\u0435\u0440\u0442\u0435\u043B\u044C\u043D\u044B\u043C \u043A\u0430\u0441\u0430\u043D\u0438\u0435\u043C", "\u0421\u043C\u0435\u0440\u0442\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u043A\u0430\u0441\u0430\u043D\u0438\u044F", "\u0417\u0430\u0449\u0438\u0442\u043D\u0438\u043A", "\u0417\u0430\u0449\u0438\u0442\u043D\u0438\u043A\u0430", "\u0417\u0430\u0449\u0438\u0442\u043D\u0438\u043A\u043E\u043C"],
    ...["\u0412\u043E\u0437\u0440\u043E\u0436\u0434\u0435\u043D\u0438\u0435", "\u0412\u043E\u0437\u0440\u043E\u0436\u0434\u0435\u043D\u0438\u0435\u043C", "\u0412\u043E\u0437\u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F", "\u0429\u0438\u0442", "\u0429\u0438\u0442\u0430", "\u0429\u0438\u0442\u043E\u043C"],
    ...["\u041F\u0440\u043E\u0431\u0438\u0432\u043D\u043E\u0439 \u0443\u0434\u0430\u0440", "\u041F\u0440\u043E\u0431\u0438\u0432\u043D\u044B\u043C \u0443\u0434\u0430\u0440\u043E\u043C", "\u041F\u0440\u043E\u0431\u0438\u0432\u043D\u043E\u0433\u043E \u0443\u0434\u0430\u0440\u0430"],
    ...["\u041C\u0435\u0442\u043A\u0438\u0439 \u0432\u044B\u0441\u0442\u0440\u0435\u043B", "\u041C\u0435\u0442\u043A\u0438\u043C \u0432\u044B\u0441\u0442\u0440\u0435\u043B\u043E\u043C", "\u041C\u0435\u0442\u043A\u043E\u0433\u043E \u0432\u044B\u0441\u0442\u0440\u0435\u043B\u0430", "\u041E\u0433\u043B\u0443\u0448\u0430\u0435\u0442", "\u041E\u0433\u043B\u0443\u0448\u0435\u043D\u0438\u0435", "\u041E\u0433\u043B\u0443\u0448\u0435\u043D\u0438\u044F"]
  ];
  var KEYWORDS_ZH = ["\u5C55\u793A\u65F6", "\u63ED\u793A\u65F6", "\u6B7B\u4EA1\u65F6", "\u51FB\u6740\u65F6", "\u5148\u653B", "\u8FDE\u51FB", "\u53CC\u91CD\u653B\u51FB", "\u6B7B\u89E6", "\u5B88\u62A4\u8005", "\u5B88\u536B", "\u91CD\u751F", "\u62A4\u76FE", "\u8DF5\u8E0F", "\u72D9\u51FB", "\u7729\u6655", "\u6301\u7EED"];
  for (const byLang of Object.values(KEYWORD_INFO))
    for (const [l, { n }] of Object.entries(byLang)) {
      if (l === "ru") KEYWORDS_RU.push(n);
      else if (l === "zh-cn") KEYWORDS_ZH.push(n);
      else KEYWORDS.push(n);
    }
  var KW_ICON = {
    Move: "move",
    Deathtouch: "deathtouch",
    Defender: "defender",
    DoubleAttack: "double-attack",
    FirstStrike: "first-strike",
    Rebirth: "rebirth",
    Shield: "shield",
    Snipe: "snipe",
    Stun: "stun",
    Stunned: "stun",
    Trample: "trample"
  };
  var ICON_BY_NAME = /* @__PURE__ */ new Map();
  var ICON_BY_RU_STEM = /* @__PURE__ */ new Map();
  for (const [id, ico] of Object.entries(KW_ICON))
    for (const [l, { n }] of Object.entries(KEYWORD_INFO[id] ?? {})) {
      ICON_BY_NAME.set(n.toLowerCase(), ico);
      if (l === "ru") ICON_BY_RU_STEM.set(n.split(" ")[0].slice(0, 4).toLowerCase(), ico);
    }
  function keywordIcon(word) {
    const w = word.replace(/:$/, "").trim().toLowerCase();
    const hit = ICON_BY_NAME.get(w);
    if (hit) return hit;
    if (!/^[а-яё]/.test(w)) return null;
    const first = w.split(" ")[0];
    for (const [stem, ico] of ICON_BY_RU_STEM) if (first.startsWith(stem)) return ico;
    return null;
  }
  var kwIcon = (ico) => ({ tag: "i", cls: `omg-kwi omg-kwi--${ico}`, attrs: { "aria-hidden": "true" } });
  var escRe = (k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var longFirst = (a, b) => b.length - a.length;
  var KW = [
    ...[...KEYWORDS].sort(longFirst).map(escRe),
    `(?<![\u0410-\u042F\u0401\u0430-\u044F\u0451])(?:${[...KEYWORDS_RU].sort(longFirst).map(escRe).join("|")})(?![\u0410-\u042F\u0401\u0430-\u044F\u0451])`,
    ...[...KEYWORDS_ZH].sort(longFirst).map(escRe)
  ].join("|");
  var ATK = "(?:\u2694\uFE0F|\u2694)";
  var HP = "(?:\u2764\uFE0F|\u2764|\u2665)";
  var DAMAGE = "(?:damage|danni|danno|de da\xF1o|de dano|d\xE9g\xE2ts|d\xE9g\xE2t|Schaden)";
  var ANY = "\\bANY\\b|\\bQUALSIASI\\b|\\bCUALQUIER\\b|\\bQUALQUER\\b|\\bBELIEBIGE[NMRS]?\\b|N'IMPORTE QUELLE?|(?<![\u0410-\u042F\u0401\u0430-\u044F\u0451])\u041B\u042E\u0411(?:\u041E\u0419|\u0423\u042E|\u041E\u0415|\u041E\u0413\u041E|\u041E\u041C\u0423|\u041E\u041C|\u042B\u0415|\u042B\u0425|\u042B\u041C|\u042B\u041C\u0418)(?![\u0410-\u042F\u0401\u0430-\u044F\u0451])|\u4EFB\u610F";
  var HEAL = "\\b(?:[Hh]eal|[Cc]ura|[Ss]oignez|[Ss]oigne|[Hh]eilt?|[Cc]ure) \\d+\\b";
  var TOKEN = new RegExp(
    `(\\[[+-]?\\d+ ?${ATK}/[+-]?\\d+ ?${HP}\\]|[+-]?\\d+ ?${ATK}/[+-]?\\d+ ?${HP}|(?:${KW}):?|[+-]?\\d+ ?(?:${ATK}|${HP})|\\b\\d+ ${DAMAGE}\\b|\\b\\d+ (?:\u0435\u0434\\. )?\u0443\u0440\u043E\u043D\u0430?(?![\u0410-\u042F\u0401\u0430-\u044F\u0451])|\\d+ ?\u70B9\u4F24\u5BB3|${HEAL}|${ANY}|${ATK}|${HP})`,
    "g"
  );
  var el = (tag, cls, kids, extra) => ({ tag, cls, kids, ...extra });
  var txt = (text) => ({ text });
  var svgEl = (tag, attrs, style, kids) => ({ tag, svg: true, attrs, style, kids });
  function icon(kind) {
    return { tag: "i", cls: `omg-ico omg-ico--${kind}`, attrs: { "aria-hidden": "true" } };
  }
  function abilityNodes(text) {
    return String(text || "").split("\n").map((line) => {
      const kids = [];
      line.split(TOKEN).forEach((part, i) => {
        if (!part) return;
        if (i % 2 === 0) {
          kids.push(txt(part));
          return;
        }
        const pair = part.match(new RegExp(`^(\\[?)([+-]?\\d+) ?${ATK}/([+-]?\\d+) ?${HP}(\\]?)$`));
        if (pair) {
          kids.push(el("span", "omg-nowrap", [txt(pair[1] + pair[2]), icon("atk"), txt("/" + pair[3]), icon("hp"), ...pair[4] ? [txt(pair[4])] : []]));
          return;
        }
        const one = part.match(new RegExp(`^([+-]?\\d+) ?(${ATK}|${HP})$`));
        if (one) {
          kids.push(el("span", "omg-nowrap", [txt(one[1]), icon(/⚔/.test(one[2]) ? "atk" : "hp")]));
          return;
        }
        if (new RegExp(`^${ATK}$`).test(part)) return void kids.push(icon("atk"));
        if (new RegExp(`^${HP}$`).test(part)) return void kids.push(icon("hp"));
        if (new RegExp(`^(?:${ANY})$`).test(part)) return void kids.push(el("i", "omg-any", [txt(part)]));
        if (new RegExp(`^${HEAL}$`).test(part)) return void kids.push(el("b", "omg-heal", [txt(part)]));
        if (/^\d/.test(part)) return void kids.push(el("b", "omg-dmg", [txt(part)]));
        const ico = keywordIcon(part);
        kids.push(ico ? el("b", "omg-kw omg-nowrap", [kwIcon(ico), txt(part)]) : el("b", "omg-kw", [txt(part)]));
      });
      return el("p", void 0, kids);
    });
  }
  function textSize(text) {
    const n = String(text || "").length;
    return n > 160 ? "is-xxlong" : n > 115 ? "is-xlong" : n > 80 ? "is-long" : "";
  }
  function nameSize(name) {
    return name.length > 19 ? "is-xlong" : name.length > 14 ? "is-long" : "";
  }
  var idOf = (slug, part) => `omg-${slug.replace(/[^a-z0-9-]/g, "")}-${part}`;
  var stop = (offset, color) => svgEl("stop", { offset }, { "stop-color": color });
  function grad(id, colors) {
    return svgEl("linearGradient", { id, x1: "0", y1: "0", x2: "0", y2: "1" }, void 0, [stop("0", colors[0]), stop("0.5", colors[1]), stop("1", colors[2])]);
  }
  function gem(c) {
    const id = idOf(c.slug, c.legendary ? "gold" : "gem");
    const w = c.legendary ? 212 : 100;
    const cx = w / 2;
    const hex = (r, ry) => [[0, -ry], [r, -ry / 2], [r, ry / 2], [0, ry], [-r, ry / 2], [-r, -ry / 2]].map(([x, y]) => `${(cx + x).toFixed(1)},${(54 + y).toFixed(1)}`).join(" ");
    const ring = { fill: `url(#${id})` };
    const edge = { stroke: "var(--omg-shadow)" };
    const kids = [
      svgEl("defs", {}, void 0, [
        grad(id, c.legendary ? ["var(--omg-gem-gold-hi)", "var(--omg-gem-gold)", "var(--omg-gem-gold-lo)"] : ["var(--omg-gem-ring-hi)", "var(--omg-gem-ring)", "var(--omg-gem-ring-lo)"])
      ])
    ];
    if (c.legendary) {
      for (const side of [-1, 1])
        [[0, 0], [8, 15], [14, 30]].forEach(([dx, dy], i) => {
          const x0 = cx + side * 40;
          const x1 = cx + side * (98 - dx);
          const y0 = 30 + dy;
          kids.push(svgEl("path", { d: `M${x0},${y0 + 18} L${x1},${y0 - 8 + i * 2} L${x1 - side * 10},${y0 + 10} L${x0},${y0 + 30} Z`, ...ring, "stroke-width": "4", "stroke-linejoin": "round" }, edge));
        });
    }
    kids.push(svgEl("polygon", { points: hex(46, 52), ...ring, "stroke-width": "4", "stroke-linejoin": "round" }, edge));
    kids.push(svgEl("polygon", { points: hex(35, 40), "stroke-width": "2" }, { fill: "var(--omg-gem-fill)", stroke: "rgba(0,0,0,.45)" }));
    return el("span", "omg-gem", [svgEl("svg", { viewBox: `0 0 ${w} 108`, preserveAspectRatio: "xMidYMid meet" }, void 0, kids), el("span", "omg-gem-num", [txt(c.cost === null ? "\u2013" : String(c.cost))])], { attrs: { "aria-hidden": "true" } });
  }
  function sword(slug) {
    const id = idOf(slug, "atk");
    const a = { fill: `url(#${id})`, class: "omg-stat-fill", "stroke-width": "3.2" };
    return svgEl("svg", { class: "omg-sword", viewBox: "0 0 40 72", "aria-hidden": "true" }, void 0, [
      svgEl("defs", {}, void 0, [grad(id, ["var(--omg-stat-hi)", "var(--omg-stat)", "var(--omg-stat-lo)"])]),
      svgEl("path", { d: "M20 1 L31 13 L31 46 L9 46 L9 13 Z", ...a }),
      svgEl("path", { d: "M20 9 L20 43", "stroke-width": "2.4", "stroke-linecap": "round" }, { stroke: "rgba(255,255,255,.55)" }),
      svgEl("rect", { x: "1.5", y: "45", width: "37", height: "9", rx: "3", ...a }),
      svgEl("rect", { x: "14.5", y: "53", width: "11", height: "12", rx: "2", ...a }),
      svgEl("circle", { cx: "20", cy: "67", r: "5", ...a })
    ]);
  }
  function heart(slug) {
    const id = idOf(slug, "hp");
    return svgEl("svg", { class: "omg-heart", viewBox: "0 0 60 52", "aria-hidden": "true" }, void 0, [
      svgEl("defs", {}, void 0, [grad(id, ["var(--omg-stat-hi)", "var(--omg-stat)", "var(--omg-stat-lo)"])]),
      svgEl("path", { d: "M30 50 C22 42 4 31 4 17 C4 8 11 3 18 3 C24 3 28 7 30 11 C32 7 36 3 42 3 C49 3 56 8 56 17 C56 31 38 42 30 50 Z", fill: `url(#${id})`, class: "omg-stat-fill", "stroke-width": "3.4" }),
      svgEl("path", { d: "M11 15 C11 11 14 8 19 8", fill: "none", "stroke-width": "2.6", "stroke-linecap": "round" }, { stroke: "rgba(255,255,255,.6)" })
    ]);
  }
  var num = (v) => el("span", "omg-num", [txt(v === null ? "\u2013" : String(v))]);
  function gameCardTree(c, lang, className = "") {
    const spell = c.type === "spell";
    const body = [
      el("div", "omg-art" + (c.art ? "" : " is-noimg"), c.art ? [el("img", void 0, void 0, { attrs: { src: c.art, alt: "", decoding: "async", loading: "lazy", draggable: "false" } })] : []),
      el("div", "omg-plate"),
      el("p", ("omg-name " + nameSize(c.name)).trim(), [txt(c.name)])
    ];
    if (!spell && (c.alignment === "good" || c.alignment === "evil")) {
      body.push(el("p", "omg-band", [txt(ALIGN_LABEL[lang][c.alignment])], { attrs: { "data-align": c.alignment } }));
    } else {
      body.push(el("span", "omg-dash" + (spell ? "" : " is-neutral")));
    }
    body.push(el("div", ("omg-text " + textSize(c.text)).trim(), abilityNodes(c.text)));
    const kids = [el("div", "omg-frame"), el("div", "omg-body", body)];
    if (!spell && (c.power !== null || c.health !== null)) {
      kids.push(el("div", "omg-stats", [el("span", "omg-stat", [num(c.power), sword(c.slug)]), el("span", "omg-stat", [heart(c.slug), num(c.health)])]));
    }
    kids.push(gem(c));
    return el("div", `omg-card omg-card--${spell ? "spell" : "unit"}${c.legendary ? " is-leg" : ""}${className ? " " + className : ""}`, kids, { attrs: { lang } });
  }
  function gameCardLabel(c, words) {
    const out = [c.name];
    if (c.cost !== null) out.push(`${words.cost} ${c.cost}`);
    if (c.power !== null) out.push(`${words.power} ${c.power}`);
    if (c.health !== null) out.push(`${words.health} ${c.health}`);
    return out.join(", ");
  }
  function keywordTips(text, lang) {
    const found = [];
    const t = String(text || "");
    for (const byLang of Object.values(KEYWORD_INFO)) {
      const k = byLang[lang] ?? byLang.en;
      if (!k) continue;
      const re = lang === "zh-cn" ? new RegExp(escRe(k.n)) : new RegExp(`(?<![\\p{L}])${escRe(k.n)}(?![\\p{L}])`, "iu");
      const m = re.exec(t);
      if (m && !found.some((f) => f.n === k.n)) found.push({ at: m.index, n: k.n, d: k.d });
    }
    return found.sort((a, b) => a.at - b.at).map(({ n, d }) => ({ n, d }));
  }
  function gameCardTipsTree(c, lang) {
    const tips = keywordTips(c.text, lang);
    if (!tips.length) return null;
    return el(
      "div",
      "omg-tips",
      tips.map((k) => {
        const ico = keywordIcon(k.n);
        return el("div", "omg-tip", [el("p", "omg-tip-title", ico ? [kwIcon(ico), txt(k.n)] : [txt(k.n)]), el("p", "omg-tip-text", abilityNodes(k.d).flatMap((r) => r.kids ?? []))]);
      }),
      { attrs: { lang } }
    );
  }

  // ../src/game-card/dom.ts
  var SVG_NS = "http://www.w3.org/2000/svg";
  function make(n) {
    if (!n.tag) return document.createTextNode(n.text ?? "");
    const e = n.svg ? document.createElementNS(SVG_NS, n.tag) : document.createElement(n.tag);
    if (n.cls) e.setAttribute("class", n.cls);
    for (const [k, v] of Object.entries(n.attrs ?? {})) e.setAttribute(k, v);
    for (const [k, v] of Object.entries(n.style ?? {})) e.style.setProperty(k, v);
    if (n.text !== void 0) e.textContent = n.text;
    for (const k of n.kids ?? []) e.appendChild(make(k));
    return e;
  }
  function fit(card) {
    const box = card.querySelector(".omg-text");
    if (!box || !box.isConnected || !box.clientHeight) return;
    box.style.fontSize = "";
    const w = card.clientWidth || 1;
    let size = parseFloat(getComputedStyle(box).fontSize) / w * 100;
    for (let i = 0; i < 12 && box.scrollHeight > box.clientHeight + 1 && size > 3.6; i++) {
      size *= 0.94;
      box.style.fontSize = `${size.toFixed(2)}cqw`;
    }
  }
  function build(c, lang, className = "", opts = {}) {
    const card = make(gameCardTree(c, lang, className));
    const tips = opts.tips ? gameCardTipsTree(c, lang) : null;
    if (tips) {
      const host = document.createElement("div");
      host.className = "omg-tips-host";
      host.setAttribute("aria-hidden", "true");
      host.appendChild(make(tips));
      card.appendChild(host);
    }
    card.querySelector(".omg-art img")?.addEventListener("error", (e) => e.target.parentElement?.classList.add("is-noimg"));
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => fit(card));
    if (typeof document !== "undefined" && document.fonts) void document.fonts.ready.then(() => fit(card));
    return card;
  }

  // ../src/game-card/browser.ts
  window.OMGameCard = { build, fit, label: gameCardLabel };
})();
