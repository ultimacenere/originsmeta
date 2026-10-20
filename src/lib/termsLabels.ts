import type { Locale } from "@/lib/i18n";

/**
 * Termini d'uso (14/10/2026, Pierluigi: "sì, prepara i termini d'uso"): li chiede la scheda dell'estensione Twitch
 * (campo "EULA or Terms of Service URL") e valgono per tutto quello che fa OriginsMeta: il sito, l'app OriginsMeta
 * Tracker e l'estensione OriginsMeta Deck tracker. Pagina /terms, noindex come /privacy, link nel footer.
 * Regole dei testi: mai il nome né il dominio della fonte dei dati delle carte, mai "con il permesso di Koin"
 * (`KOIN_PERMISSION_PUBLIC` è spento), sempre "non affiliato a Koin Games". Le ancore (`id`) sono uguali in tutte
 * le lingue (sette dal 20/10/2026, con il tedesco e il russo). Test in termsLabels.test.ts.
 */
export type TermsSection = { id: string; title: string; body: string[] };

export type TermsLabels = {
  title: string;
  description: string;
  updated: string;
  intro: string;
  sections: TermsSection[];
  /** voce del footer */
  footer: string;
};

export const TERMS_UPDATED = "2026-10-14";

export const termsLabels: Record<Locale, TermsLabels> = {
  en: {
    title: "Terms of use",
    description: "The terms of use of OriginsMeta: the website, the OriginsMeta Tracker app and the OriginsMeta Deck tracker extension for Twitch.",
    updated: "Last updated: 14 October 2026",
    intro:
      "These terms apply to originsmeta.com, to the OriginsMeta Tracker app for Windows and to the OriginsMeta Deck tracker extension for Twitch (together, “OriginsMeta”). By using OriginsMeta you accept them. If you don't, please don't use it.",
    sections: [
      {
        id: "who",
        title: "Who we are",
        body: [
          "OriginsMeta is an unofficial fan site about Origins TCG, run by Pierluigi Cella. It is not affiliated with, endorsed or sponsored by Koin Games. You can write to us at staff@originsmeta.com.",
        ],
      },
      {
        id: "service",
        title: "The service",
        body: [
          "OriginsMeta is free. We can change, pause or end any part of it at any time, including the app and the extension. Donations through PayPal are voluntary and give no rights or rewards.",
        ],
      },
      {
        id: "account",
        title: "Your account",
        body: [
          "You sign in with Discord or with a link sent by email. You are responsible for what you do with your account. Roles and tags are assigned by the staff. We can hide content or suspend an account that breaks these terms, and you can delete your account at any time.",
        ],
      },
      {
        id: "content",
        title: "What you publish",
        body: [
          "Decks, guides, tier lists, comics, votes and messages you publish stay yours. By publishing them you allow OriginsMeta to show them on the site, translate them automatically into the site's languages, and share them on our Discord server and in the extension, for as long as they are online.",
          "Don't publish anything illegal, offensive, misleading, spam, other people's personal data or work you have no right to share. The staff can hide or remove content that breaks these rules.",
        ],
      },
      {
        id: "game",
        title: "Origins TCG content",
        body: [
          "Origins TCG, its cards, names, texts and images belong to Koin Games. OriginsMeta shows them to talk about the game; they are not ours and are not covered by these terms. Card data, balance changes and statistics may contain mistakes: they are given for information only.",
        ],
      },
      {
        id: "tracker",
        title: "OriginsMeta Tracker",
        body: [
          "The app only reads, on your PC, the files the game saves and the game's window, and never changes the game. It works only when linked to an OriginsMeta account and sends the site what the privacy policy describes. You install and use it at your own risk; you can unlink it and delete your matches from your account at any time. The statistics computed from the matches are estimates.",
        ],
      },
      {
        id: "twitch",
        title: "OriginsMeta Deck tracker for Twitch",
        body: [
          "The extension shows viewers the streamer's deck and cards, taken from OriginsMeta Tracker: never names, ranks or identifiers of players or matches. Viewers don't need an account. The streamer who links a channel is responsible for what they stream. Twitch's own terms also apply.",
        ],
      },
      {
        id: "liability",
        title: "No warranty",
        body: [
          "OriginsMeta is provided “as is”, without warranties. As far as the law allows, we are not liable for indirect damages or for losses caused by mistakes in the data, interruptions of the service or the use of the app and the extension. Nothing in these terms limits the rights that the law of your country gives you as a consumer.",
        ],
      },
      {
        id: "privacy",
        title: "Privacy",
        body: ["How we use data is explained in the privacy policy."],
      },
      {
        id: "changes",
        title: "Changes and applicable law",
        body: [
          "We can update these terms: the date at the top tells you when. If you keep using OriginsMeta after a change, you accept the new version. These terms are governed by Italian law, without prejudice to the mandatory rules of your country of residence.",
        ],
      },
    ],
    footer: "Terms of use",
  },
  it: {
    title: "Termini d'uso",
    description: "I termini d'uso di OriginsMeta: il sito, l'app OriginsMeta Tracker e l'estensione OriginsMeta Deck tracker per Twitch.",
    updated: "Ultimo aggiornamento: 14 ottobre 2026",
    intro:
      "Questi termini valgono per originsmeta.com, per l'app OriginsMeta Tracker per Windows e per l'estensione OriginsMeta Deck tracker per Twitch (insieme, “OriginsMeta”). Usando OriginsMeta li accetti; se non li accetti, non usarlo.",
    sections: [
      {
        id: "who",
        title: "Chi siamo",
        body: [
          "OriginsMeta è un sito fan non ufficiale su Origins TCG, gestito da Pierluigi Cella. Non è affiliato a Koin Games, né approvato o sponsorizzato da Koin Games. Puoi scriverci a staff@originsmeta.com.",
        ],
      },
      {
        id: "service",
        title: "Il servizio",
        body: [
          "OriginsMeta è gratuito. Possiamo cambiare, sospendere o chiudere in qualsiasi momento ogni sua parte, anche l'app e l'estensione. Le donazioni con PayPal sono volontarie e non danno diritti né premi.",
        ],
      },
      {
        id: "account",
        title: "Il tuo account",
        body: [
          "Accedi con Discord o con un link via email. Di quello che fai con il tuo account rispondi tu. Ruoli e tag li assegna lo staff. Possiamo nascondere contenuti o sospendere un account che non rispetta questi termini, e tu puoi cancellare il tuo account quando vuoi.",
        ],
      },
      {
        id: "content",
        title: "Quello che pubblichi",
        body: [
          "Mazzi, guide, tier list, fumetti, voti e messaggi che pubblichi restano tuoi. Pubblicandoli permetti a OriginsMeta di mostrarli sul sito, tradurli in automatico nelle lingue del sito e condividerli sul nostro server Discord e nell'estensione, finché restano online.",
          "Non pubblicare niente di illegale, offensivo, ingannevole, spam, dati personali di altri né lavori che non hai il diritto di condividere. Lo staff può nascondere o togliere i contenuti che non rispettano queste regole.",
        ],
      },
      {
        id: "game",
        title: "I contenuti di Origins TCG",
        body: [
          "Origins TCG, le sue carte, i nomi, i testi e le immagini appartengono a Koin Games. OriginsMeta li mostra per parlare del gioco: non sono nostri e questi termini non li riguardano. Dati delle carte, bilanciamenti e statistiche possono contenere errori: sono solo a titolo informativo.",
        ],
      },
      {
        id: "tracker",
        title: "OriginsMeta Tracker",
        body: [
          "L'app legge soltanto, sul tuo PC, i file che il gioco salva e la finestra del gioco, e non modifica mai il gioco. Funziona solo collegata a un account OriginsMeta e manda al sito quello che descrive l'informativa sulla privacy. La installi e la usi sotto la tua responsabilità; puoi scollegarla e cancellare le tue partite dal tuo account quando vuoi. Le statistiche calcolate dalle partite sono stime.",
        ],
      },
      {
        id: "twitch",
        title: "OriginsMeta Deck tracker per Twitch",
        body: [
          "L'estensione mostra a chi guarda il mazzo e le carte dello streamer, presi da OriginsMeta Tracker: mai nomi, rank o identificativi di giocatori o partite. Chi guarda non ha bisogno di un account. Di quello che trasmette risponde lo streamer che collega il canale. Valgono anche i termini di Twitch.",
        ],
      },
      {
        id: "liability",
        title: "Nessuna garanzia",
        body: [
          "OriginsMeta è fornito “così com'è”, senza garanzie. Nei limiti consentiti dalla legge, non rispondiamo di danni indiretti né di perdite dovute a errori nei dati, interruzioni del servizio o all'uso dell'app e dell'estensione. Niente in questi termini limita i diritti che la legge del tuo paese ti riconosce come consumatore.",
        ],
      },
      {
        id: "privacy",
        title: "Privacy",
        body: ["Come usiamo i dati lo spiega l'informativa sulla privacy."],
      },
      {
        id: "changes",
        title: "Modifiche e legge applicabile",
        body: [
          "Possiamo aggiornare questi termini: la data in alto dice quando. Se continui a usare OriginsMeta dopo una modifica, accetti la nuova versione. Questi termini sono regolati dalla legge italiana, salve le norme inderogabili del tuo paese di residenza.",
        ],
      },
    ],
    footer: "Termini d'uso",
  },
  es: {
    title: "Términos de uso",
    description: "Los términos de uso de OriginsMeta: el sitio web, la app OriginsMeta Tracker y la extensión OriginsMeta Deck tracker para Twitch.",
    updated: "Última actualización: 14 de octubre de 2026",
    intro:
      "Estos términos se aplican a originsmeta.com, a la app OriginsMeta Tracker para Windows y a la extensión OriginsMeta Deck tracker para Twitch (en conjunto, “OriginsMeta”). Al usar OriginsMeta los aceptas; si no los aceptas, no lo uses.",
    sections: [
      {
        id: "who",
        title: "Quiénes somos",
        body: [
          "OriginsMeta es un sitio fan no oficial sobre Origins TCG, gestionado por Pierluigi Cella. No está afiliado a Koin Games ni cuenta con su aprobación o patrocinio. Puedes escribirnos a staff@originsmeta.com.",
        ],
      },
      {
        id: "service",
        title: "El servicio",
        body: [
          "OriginsMeta es gratuito. Podemos cambiar, pausar o cerrar cualquier parte en cualquier momento, también la app y la extensión. Las donaciones con PayPal son voluntarias y no dan derechos ni recompensas.",
        ],
      },
      {
        id: "account",
        title: "Tu cuenta",
        body: [
          "Inicias sesión con Discord o con un enlace por email. Eres responsable de lo que haces con tu cuenta. Los roles y las etiquetas los asigna el staff. Podemos ocultar contenidos o suspender una cuenta que no respete estos términos, y tú puedes borrar tu cuenta cuando quieras.",
        ],
      },
      {
        id: "content",
        title: "Lo que publicas",
        body: [
          "Los mazos, guías, tier lists, cómics, votos y mensajes que publicas siguen siendo tuyos. Al publicarlos permites que OriginsMeta los muestre en el sitio, los traduzca automáticamente a los idiomas del sitio y los comparta en nuestro servidor de Discord y en la extensión, mientras sigan en línea.",
          "No publiques nada ilegal, ofensivo, engañoso, spam, datos personales de otras personas ni trabajos que no tengas derecho a compartir. El staff puede ocultar o retirar los contenidos que no respeten estas reglas.",
        ],
      },
      {
        id: "game",
        title: "Los contenidos de Origins TCG",
        body: [
          "Origins TCG, sus cartas, nombres, textos e imágenes pertenecen a Koin Games. OriginsMeta los muestra para hablar del juego: no son nuestros y estos términos no los cubren. Los datos de las cartas, los cambios de balance y las estadísticas pueden contener errores: son solo informativos.",
        ],
      },
      {
        id: "tracker",
        title: "OriginsMeta Tracker",
        body: [
          "La app solo lee, en tu PC, los archivos que guarda el juego y la ventana del juego, y nunca modifica el juego. Funciona solo vinculada a una cuenta de OriginsMeta y envía al sitio lo que describe la política de privacidad. La instalas y la usas bajo tu responsabilidad; puedes desvincularla y borrar tus partidas desde tu cuenta cuando quieras. Las estadísticas calculadas con las partidas son estimaciones.",
        ],
      },
      {
        id: "twitch",
        title: "OriginsMeta Deck tracker para Twitch",
        body: [
          "La extensión muestra a los espectadores el mazo y las cartas del streamer, tomados de OriginsMeta Tracker: nunca nombres, rangos ni identificadores de jugadores o partidas. Los espectadores no necesitan cuenta. El streamer que vincula un canal es responsable de lo que transmite. También se aplican los términos de Twitch.",
        ],
      },
      {
        id: "liability",
        title: "Sin garantías",
        body: [
          "OriginsMeta se ofrece “tal cual”, sin garantías. En la medida en que la ley lo permita, no respondemos de daños indirectos ni de pérdidas causadas por errores en los datos, interrupciones del servicio o el uso de la app y de la extensión. Nada en estos términos limita los derechos que la ley de tu país te reconoce como consumidor.",
        ],
      },
      {
        id: "privacy",
        title: "Privacidad",
        body: ["Cómo usamos los datos lo explica la política de privacidad."],
      },
      {
        id: "changes",
        title: "Cambios y ley aplicable",
        body: [
          "Podemos actualizar estos términos: la fecha de arriba indica cuándo. Si sigues usando OriginsMeta después de un cambio, aceptas la nueva versión. Estos términos se rigen por la ley italiana, sin perjuicio de las normas imperativas de tu país de residencia.",
        ],
      },
    ],
    footer: "Términos de uso",
  },
  fr: {
    title: "Conditions d'utilisation",
    description: "Les conditions d'utilisation d'OriginsMeta : le site, l'application OriginsMeta Tracker et l'extension OriginsMeta Deck tracker pour Twitch.",
    updated: "Dernière mise à jour : 14 octobre 2026",
    intro:
      "Ces conditions s'appliquent à originsmeta.com, à l'application OriginsMeta Tracker pour Windows et à l'extension OriginsMeta Deck tracker pour Twitch (ensemble, « OriginsMeta »). En utilisant OriginsMeta, vous les acceptez ; si vous ne les acceptez pas, ne l'utilisez pas.",
    sections: [
      {
        id: "who",
        title: "Qui sommes-nous",
        body: [
          "OriginsMeta est un site de fans non officiel consacré à Origins TCG, géré par Pierluigi Cella. Il n'est ni affilié à Koin Games, ni approuvé ou sponsorisé par Koin Games. Vous pouvez nous écrire à staff@originsmeta.com.",
        ],
      },
      {
        id: "service",
        title: "Le service",
        body: [
          "OriginsMeta est gratuit. Nous pouvons modifier, suspendre ou arrêter à tout moment n'importe quelle partie du service, y compris l'application et l'extension. Les dons via PayPal sont volontaires et ne donnent ni droits ni récompenses.",
        ],
      },
      {
        id: "account",
        title: "Votre compte",
        body: [
          "Vous vous connectez avec Discord ou avec un lien envoyé par e-mail. Vous êtes responsable de ce que vous faites avec votre compte. Les rôles et les tags sont attribués par le staff. Nous pouvons masquer des contenus ou suspendre un compte qui ne respecte pas ces conditions, et vous pouvez supprimer votre compte à tout moment.",
        ],
      },
      {
        id: "content",
        title: "Ce que vous publiez",
        body: [
          "Les decks, guides, tier lists, bandes dessinées, votes et messages que vous publiez restent les vôtres. En les publiant, vous autorisez OriginsMeta à les afficher sur le site, à les traduire automatiquement dans les langues du site et à les partager sur notre serveur Discord et dans l'extension, tant qu'ils restent en ligne.",
          "Ne publiez rien d'illégal, d'offensant, de trompeur, de spam, ni des données personnelles d'autrui ou des œuvres que vous n'avez pas le droit de partager. Le staff peut masquer ou retirer les contenus qui ne respectent pas ces règles.",
        ],
      },
      {
        id: "game",
        title: "Les contenus d'Origins TCG",
        body: [
          "Origins TCG, ses cartes, ses noms, ses textes et ses images appartiennent à Koin Games. OriginsMeta les affiche pour parler du jeu : ils ne nous appartiennent pas et ces conditions ne les couvrent pas. Les données des cartes, les équilibrages et les statistiques peuvent contenir des erreurs : ils sont donnés à titre d'information.",
        ],
      },
      {
        id: "tracker",
        title: "OriginsMeta Tracker",
        body: [
          "L'application lit uniquement, sur votre PC, les fichiers que le jeu enregistre et la fenêtre du jeu, et ne modifie jamais le jeu. Elle ne fonctionne que liée à un compte OriginsMeta et envoie au site ce que décrit la politique de confidentialité. Vous l'installez et l'utilisez sous votre responsabilité ; vous pouvez la délier et supprimer vos parties depuis votre compte à tout moment. Les statistiques calculées à partir des parties sont des estimations.",
        ],
      },
      {
        id: "twitch",
        title: "OriginsMeta Deck tracker pour Twitch",
        body: [
          "L'extension montre aux spectateurs le deck et les cartes du streamer, issus d'OriginsMeta Tracker : jamais de noms, de rangs ni d'identifiants de joueurs ou de parties. Les spectateurs n'ont pas besoin de compte. Le streamer qui lie une chaîne est responsable de ce qu'il diffuse. Les conditions de Twitch s'appliquent aussi.",
        ],
      },
      {
        id: "liability",
        title: "Aucune garantie",
        body: [
          "OriginsMeta est fourni « en l'état », sans garantie. Dans les limites permises par la loi, nous ne sommes pas responsables des dommages indirects ni des pertes dues à des erreurs dans les données, à des interruptions du service ou à l'utilisation de l'application et de l'extension. Rien dans ces conditions ne limite les droits que la loi de votre pays vous reconnaît en tant que consommateur.",
        ],
      },
      {
        id: "privacy",
        title: "Confidentialité",
        body: ["La politique de confidentialité explique comment nous utilisons les données."],
      },
      {
        id: "changes",
        title: "Modifications et droit applicable",
        body: [
          "Nous pouvons mettre à jour ces conditions : la date en haut indique quand. Si vous continuez à utiliser OriginsMeta après une modification, vous acceptez la nouvelle version. Ces conditions sont régies par le droit italien, sans préjudice des règles impératives de votre pays de résidence.",
        ],
      },
    ],
    footer: "Conditions d'utilisation",
  },
  pt: {
    title: "Termos de uso",
    description: "Os termos de uso do OriginsMeta: o site, o aplicativo OriginsMeta Tracker e a extensão OriginsMeta Deck tracker para a Twitch.",
    updated: "Última atualização: 14 de outubro de 2026",
    intro:
      "Estes termos valem para originsmeta.com, para o aplicativo OriginsMeta Tracker para Windows e para a extensão OriginsMeta Deck tracker para a Twitch (em conjunto, “OriginsMeta”). Ao usar o OriginsMeta, você os aceita. Se não aceitar, não o use.",
    sections: [
      {
        id: "who",
        title: "Quem somos",
        body: [
          "O OriginsMeta é um site de fãs não oficial sobre Origins TCG, mantido por Pierluigi Cella. Não é afiliado à Koin Games, nem aprovado ou patrocinado pela Koin Games. Você pode nos escrever em staff@originsmeta.com.",
        ],
      },
      {
        id: "service",
        title: "O serviço",
        body: [
          "O OriginsMeta é gratuito. Podemos mudar, pausar ou encerrar qualquer parte dele a qualquer momento, inclusive o aplicativo e a extensão. As doações pelo PayPal são voluntárias e não dão direitos nem recompensas.",
        ],
      },
      {
        id: "account",
        title: "A sua conta",
        body: [
          "Você entra com o Discord ou com um link enviado por e-mail. Você é responsável pelo que faz com a sua conta. Os papéis e as tags são atribuídos pela staff. Podemos ocultar conteúdos ou suspender uma conta que não respeite estes termos, e você pode excluir a sua conta a qualquer momento.",
        ],
      },
      {
        id: "content",
        title: "O que você publica",
        body: [
          "Os decks, guias, tier lists, quadrinhos, votos e mensagens que você publica continuam sendo seus. Ao publicá-los, você autoriza o OriginsMeta a mostrá-los no site, traduzi-los automaticamente para os idiomas do site e compartilhá-los no nosso servidor do Discord e na extensão, enquanto estiverem on-line.",
          "Não publique nada ilegal, ofensivo, enganoso, spam, dados pessoais de outras pessoas nem obras que você não tem o direito de compartilhar. A staff pode ocultar ou remover os conteúdos que não respeitem estas regras.",
        ],
      },
      {
        id: "game",
        title: "Os conteúdos de Origins TCG",
        body: [
          "Origins TCG, as suas cartas, nomes, textos e imagens pertencem à Koin Games. O OriginsMeta os mostra para falar do jogo; não são nossos e não estão cobertos por estes termos. Os dados das cartas, as mudanças de balanceamento e as estatísticas podem conter erros: são fornecidos apenas a título informativo.",
        ],
      },
      {
        id: "tracker",
        title: "OriginsMeta Tracker",
        body: [
          "O aplicativo só lê, no seu PC, os arquivos que o jogo salva e a janela do jogo, e nunca altera o jogo. Ele só funciona vinculado a uma conta do OriginsMeta e envia ao site o que a política de privacidade descreve. Você o instala e usa por sua conta e risco; pode desvinculá-lo e excluir as suas partidas na sua conta a qualquer momento. As estatísticas calculadas a partir das partidas são estimativas.",
        ],
      },
      {
        id: "twitch",
        title: "OriginsMeta Deck tracker para a Twitch",
        body: [
          "A extensão mostra aos espectadores o deck e as cartas do streamer, vindos do OriginsMeta Tracker: nunca nomes, ranks ou identificadores de jogadores ou de partidas. Os espectadores não precisam de conta. O streamer que vincula um canal é responsável pelo que transmite. Os termos da própria Twitch também se aplicam.",
        ],
      },
      {
        id: "liability",
        title: "Sem garantias",
        body: [
          "O OriginsMeta é oferecido “no estado em que se encontra”, sem garantias. Na medida permitida pela lei, não somos responsáveis por danos indiretos nem por perdas causadas por erros nos dados, interrupções do serviço ou pelo uso do aplicativo e da extensão. Nada nestes termos limita os direitos que a lei do seu país lhe dá como consumidor.",
        ],
      },
      {
        id: "privacy",
        title: "Privacidade",
        body: ["A política de privacidade explica como usamos os dados."],
      },
      {
        id: "changes",
        title: "Mudanças e lei aplicável",
        body: [
          "Podemos atualizar estes termos: a data no topo mostra quando. Se você continuar usando o OriginsMeta depois de uma mudança, aceita a nova versão. Estes termos são regidos pela lei italiana, sem prejuízo das normas obrigatórias do seu país de residência.",
        ],
      },
    ],
    footer: "Termos de uso",
  },
  de: {
    title: "Nutzungsbedingungen",
    description: "Die Nutzungsbedingungen von OriginsMeta: die Website, die App OriginsMeta Tracker und die Erweiterung OriginsMeta Deck tracker für Twitch.",
    updated: "Zuletzt aktualisiert: 14. Oktober 2026",
    intro:
      "Diese Bedingungen gelten für originsmeta.com, für die App OriginsMeta Tracker für Windows und für die Erweiterung OriginsMeta Deck tracker für Twitch (zusammen „OriginsMeta“). Wenn du OriginsMeta nutzt, akzeptierst du sie. Wenn nicht, nutze OriginsMeta bitte nicht.",
    sections: [
      {
        id: "who",
        title: "Wer wir sind",
        body: [
          "OriginsMeta ist eine inoffizielle Fanseite zu Origins TCG, betrieben von Pierluigi Cella. Sie ist nicht mit Koin Games verbunden und wird von Koin Games weder unterstützt noch gesponsert. Du erreichst uns unter staff@originsmeta.com.",
        ],
      },
      {
        id: "service",
        title: "Der Dienst",
        body: [
          "OriginsMeta ist kostenlos. Wir können jeden Teil davon jederzeit ändern, pausieren oder beenden, auch die App und die Erweiterung. Spenden über PayPal sind freiwillig und begründen keine Rechte oder Gegenleistungen.",
        ],
      },
      {
        id: "account",
        title: "Dein Konto",
        body: [
          "Du meldest dich mit Discord oder mit einem Link per E-Mail an. Du bist für das verantwortlich, was du mit deinem Konto tust. Rollen und Tags vergibt das Staff. Wir können Inhalte ausblenden oder ein Konto sperren, das gegen diese Bedingungen verstößt, und du kannst dein Konto jederzeit löschen.",
        ],
      },
      {
        id: "content",
        title: "Was du veröffentlichst",
        body: [
          "Decks, Guides, Tier-Lists, Comics, Bewertungen und Nachrichten, die du veröffentlichst, bleiben deine. Mit der Veröffentlichung erlaubst du OriginsMeta, sie auf der Website zu zeigen, sie automatisch in die Sprachen der Website zu übersetzen und sie auf unserem Discord-Server und in der Erweiterung zu teilen, solange sie online sind.",
          "Veröffentliche nichts Illegales, Beleidigendes, Irreführendes, keinen Spam, keine personenbezogenen Daten anderer und keine Werke, die du nicht teilen darfst. Das Staff kann Inhalte ausblenden oder entfernen, die gegen diese Regeln verstoßen.",
        ],
      },
      {
        id: "game",
        title: "Inhalte von Origins TCG",
        body: [
          "Origins TCG, seine Karten, Namen, Texte und Bilder gehören Koin Games. OriginsMeta zeigt sie, um über das Spiel zu sprechen; sie gehören nicht uns und fallen nicht unter diese Bedingungen. Kartendaten, Balance-Änderungen und Statistiken können Fehler enthalten: Sie dienen nur zur Information.",
        ],
      },
      {
        id: "tracker",
        title: "OriginsMeta Tracker",
        body: [
          "Die App liest auf deinem PC nur die Dateien, die das Spiel speichert, und das Fenster des Spiels, und sie verändert das Spiel nie. Sie funktioniert nur, wenn sie mit einem OriginsMeta-Konto verbunden ist, und schickt der Website, was die Datenschutzerklärung beschreibt. Du installierst und nutzt sie auf eigenes Risiko; du kannst die Verbindung jederzeit trennen und deine Partien in deinem Konto löschen. Die aus den Partien berechneten Statistiken sind Schätzungen.",
        ],
      },
      {
        id: "twitch",
        title: "OriginsMeta Deck tracker für Twitch",
        body: [
          "Die Erweiterung zeigt den Zuschauern das Deck und die Karten des Streamers, übernommen aus OriginsMeta Tracker: nie Namen, Ränge oder Kennungen von Spielern oder Partien. Zuschauer brauchen kein Konto. Wer einen Kanal verbindet, ist für das verantwortlich, was er streamt. Zusätzlich gelten die Bedingungen von Twitch.",
        ],
      },
      {
        id: "liability",
        title: "Keine Gewährleistung",
        body: [
          "OriginsMeta wird „wie besehen“ bereitgestellt, ohne Gewährleistung. Soweit das Gesetz es zulässt, haften wir nicht für indirekte Schäden oder für Verluste durch Fehler in den Daten, Unterbrechungen des Dienstes oder die Nutzung der App und der Erweiterung. Nichts in diesen Bedingungen schränkt die Rechte ein, die dir das Recht deines Landes als Verbraucher gibt.",
        ],
      },
      {
        id: "privacy",
        title: "Datenschutz",
        body: ["Wie wir Daten verwenden, erklärt die Datenschutzerklärung."],
      },
      {
        id: "changes",
        title: "Änderungen und anwendbares Recht",
        body: [
          "Wir können diese Bedingungen aktualisieren: Das Datum oben sagt dir, wann. Wenn du OriginsMeta nach einer Änderung weiter nutzt, akzeptierst du die neue Fassung. Für diese Bedingungen gilt italienisches Recht, unbeschadet der zwingenden Vorschriften deines Wohnsitzlandes.",
        ],
      },
    ],
    footer: "Nutzungsbedingungen",
  },
  ru: {
    title: "Условия использования",
    description: "Условия использования OriginsMeta: сайт, приложение OriginsMeta Tracker и расширение OriginsMeta Deck tracker для Twitch.",
    updated: "Последнее обновление: 14 октября 2026",
    intro:
      "Эти условия действуют для originsmeta.com, для приложения OriginsMeta Tracker для Windows и для расширения OriginsMeta Deck tracker для Twitch (вместе — «OriginsMeta»). Пользуясь OriginsMeta, вы принимаете эти условия. Если вы с ними не согласны, пожалуйста, не пользуйтесь OriginsMeta.",
    sections: [
      {
        id: "who",
        title: "Кто мы",
        body: [
          "OriginsMeta — неофициальный фан-сайт об Origins TCG, который ведёт Pierluigi Cella. Сайт не связан с Koin Games, не одобрен и не спонсируется Koin Games. Написать нам можно на staff@originsmeta.com.",
        ],
      },
      {
        id: "service",
        title: "Сервис",
        body: [
          "OriginsMeta бесплатен. Мы можем в любой момент изменить, приостановить или закрыть любую его часть, в том числе приложение и расширение. Пожертвования через PayPal добровольны и не дают никаких прав или наград.",
        ],
      },
      {
        id: "account",
        title: "Ваш аккаунт",
        body: [
          "Вы входите через Discord или по ссылке, отправленной на почту. Вы отвечаете за то, что делаете со своим аккаунтом. Роли и теги назначает Staff. Мы можем скрыть контент или заблокировать аккаунт, который нарушает эти условия, а вы можете удалить свой аккаунт в любой момент.",
        ],
      },
      {
        id: "content",
        title: "Что вы публикуете",
        body: [
          "Колоды, гайды, тир-листы, комиксы, оценки и сообщения, которые вы публикуете, остаются вашими. Публикуя их, вы позволяете OriginsMeta показывать их на сайте, автоматически переводить на языки сайта и делиться ими на нашем сервере Discord и в расширении, пока они остаются в сети.",
          "Не публикуйте ничего незаконного, оскорбительного, вводящего в заблуждение, спам, чужие персональные данные или работы, которыми вы не вправе делиться. Staff может скрыть или удалить контент, который нарушает эти правила.",
        ],
      },
      {
        id: "game",
        title: "Контент Origins TCG",
        body: [
          "Origins TCG, его карты, названия, тексты и изображения принадлежат Koin Games. OriginsMeta показывает их, чтобы рассказывать об игре; они не наши и не подпадают под эти условия. Данные карт, балансные изменения и статистика могут содержать ошибки: они приводятся только для информации.",
        ],
      },
      {
        id: "tracker",
        title: "OriginsMeta Tracker",
        body: [
          "Приложение только читает на вашем ПК файлы, которые сохраняет игра, и окно игры, и никогда не изменяет саму игру. Оно работает, только если привязано к аккаунту OriginsMeta, и отправляет на сайт то, что описано в политике конфиденциальности. Вы устанавливаете и используете его на свой риск; в любой момент можно отвязать приложение и удалить свои партии в аккаунте. Статистика, рассчитанная по партиям, — это оценки.",
        ],
      },
      {
        id: "twitch",
        title: "OriginsMeta Deck tracker для Twitch",
        body: [
          "Расширение показывает зрителям колоду и карты стримера из OriginsMeta Tracker: никогда не показывает имена, ранги или идентификаторы игроков и партий. Зрителям аккаунт не нужен. Тот, кто привязывает канал, отвечает за то, что транслирует. Кроме того, действуют условия Twitch.",
        ],
      },
      {
        id: "liability",
        title: "Без гарантий",
        body: [
          "OriginsMeta предоставляется «как есть», без гарантий. В той мере, в какой это допускает закон, мы не несём ответственности за косвенный ущерб или за потери, вызванные ошибками в данных, перебоями в работе сервиса или использованием приложения и расширения. Ничто в этих условиях не ограничивает права, которые закон вашей страны даёт вам как потребителю.",
        ],
      },
      {
        id: "privacy",
        title: "Конфиденциальность",
        body: ["Как мы используем данные, объясняет политика конфиденциальности."],
      },
      {
        id: "changes",
        title: "Изменения и применимое право",
        body: [
          "Мы можем обновлять эти условия: дата вверху показывает, когда это было сделано. Если вы продолжаете пользоваться OriginsMeta после изменения, вы принимаете новую версию. Эти условия регулируются законодательством Италии, без ущерба для обязательных норм страны вашего проживания.",
        ],
      },
    ],
    footer: "Условия использования",
  },
};
