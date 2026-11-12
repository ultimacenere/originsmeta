import type { Locale } from "./i18n";
import type { PcStepId, TwitchStepId } from "./twitchSetup";

/**
 * Testi della pagina /twitch (12/11/2026, src/lib/twitchSetup.ts), nelle otto lingue. Questo file non importa niente a
 * runtime, così lo carica anche `node --test`.
 *
 * Regole dei testi (Pierluigi: "istruzioni a prova di demente ma poco testo e chiaro"):
 * - un passo = un titolo di poche parole e una riga con che cosa premere; niente spiegazioni, niente casi particolari
 *   (stanno nelle guide lunghe di /for-creators e /tracker);
 * - i nomi dei tasti sono scritti come li mostra il programma nella lingua di chi legge, fra virgolette, e sono gli
 *   stessi delle guide di /for-creators: Windows e Twitch nella lingua della pagina, il sito nella lingua della pagina,
 *   l'app Tracker in inglese, italiano e spagnolo (nelle altre lingue l'app è in inglese: "Create your layout",
 *   "Link"), la configurazione dell'estensione in inglese, italiano, spagnolo e francese;
 * - "layout" è la parola dell'app ("Crea il tuo layout") e resta così dove gli streamer la usano; in russo e in cinese
 *   si dice con le parole loro;
 * - niente promesse, niente numeri che non siano i sette passi e i minuti; "non affiliato a Koin Games" lo dice il
 *   piede di ogni pagina del sito.
 */

export type SetupStep = { title: string; text: string };

export type TwitchSetupLabels = {
  meta: { title: string; description: string };
  h1: string;
  lead: string;
  /** che cosa serve, una riga */
  needs: string;
  /** scritta a penna accanto all'immagine */
  imageNote: string;
  pc: { title: string; time: string; steps: Record<PcStepId, SetupStep>; codeLink: string };
  twitch: { title: string; time: string; steps: Record<TwitchStepId, SetupStep>; extLink: string; codeLink: string };
  done: { label: string; text: string };
  help: {
    title: string;
    copy: string;
    copied: string;
    /** nome del tasto "Copia" per i lettori di schermo: `{name}` è la persona */
    copyAria: string;
    server: string;
    guides: string;
  };
  /** la riga di /for-creators che porta qui */
  fromCreators: string;
};

export const twitchSetupLabels: Record<Locale, TwitchSetupLabels> = {
  en: {
    meta: {
      title: "Twitch layout for Origins TCG: Tracker and extension",
      description: "Put your Origins TCG deck live on Twitch: OriginsMeta Tracker on your PC and the extension for your viewers, set up in seven steps and ten minutes. Free.",
    },
    h1: "Your Twitch layout for Origins TCG",
    lead: "OriginsMeta Tracker shows your deck live and, with the Twitch extension, your viewers open it over the video. Free, ready in 10 minutes.",
    needs: "You need a Windows PC, Origins TCG on Steam and your Twitch channel.",
    imageNote: "what your viewers see",
    pc: {
      title: "On your PC",
      time: "5 minutes",
      steps: {
        download: { title: "Download the Tracker", text: "You need a free account on the site. A .zip file arrives." },
        run: { title: "Extract and run", text: "Right-click the zip, “Extract All…”. Open “OriginsMeta Tracker.exe”. If Windows warns you: “More info”, then “Run anyway”." },
        link: { title: "Link the app", text: "Press “Create a code” and type it in the app." },
        layout: { title: "Pick your layout", text: "In the app press “Create your layout” and choose the style of the panels." },
      },
      codeLink: "Create the code",
    },
    twitch: {
      title: "On Twitch",
      time: "5 minutes",
      steps: {
        install: { title: "Install the extension", text: "Open “OriginsMeta Deck tracker” and press “Install”." },
        activate: { title: "Activate it", text: "In My Extensions press “Activate”, then “Set as Overlay 1”." },
        connect: { title: "Link Twitch", text: "Press the gear icon of the extension. Create a code for Twitch, type it there and press “Link”." },
      },
      extLink: "Open the extension",
      codeLink: "Create the code for Twitch",
    },
    done: { label: "Done", text: "Go live with the Tracker open: viewers move the mouse over your video and see your deck." },
    help: {
      title: "Stuck? Message us on Discord",
      copy: "Copy",
      copied: "Copied",
      copyAria: "Copy {name}'s Discord username",
      server: "Join the OriginsMeta Discord",
      guides: "All the step-by-step guides",
    },
    fromCreators: "In a hurry? Tracker and Twitch extension on one screen",
  },
  it: {
    meta: {
      title: "Layout Twitch per Origins TCG: Tracker ed estensione",
      description: "Metti il tuo mazzo di Origins TCG in diretta su Twitch: OriginsMeta Tracker sul PC e l'estensione per chi ti guarda, in sette passi e dieci minuti. Gratis.",
    },
    h1: "Il tuo layout Twitch per Origins TCG",
    lead: "OriginsMeta Tracker mostra il tuo mazzo dal vivo e, con l'estensione Twitch, chi ti guarda lo apre sopra il video. Gratis, pronto in 10 minuti.",
    needs: "Ti servono un PC Windows, Origins TCG su Steam e il tuo canale Twitch.",
    imageNote: "quello che vede chi ti guarda",
    pc: {
      title: "Sul PC",
      time: "5 minuti",
      steps: {
        download: { title: "Scarica il Tracker", text: "Serve un account gratuito sul sito. Arriva un file .zip." },
        run: { title: "Estrai e avvia", text: "Tasto destro sullo zip, «Estrai tutto…». Apri «OriginsMeta Tracker.exe». Se Windows avvisa: «Ulteriori informazioni», poi «Esegui comunque»." },
        link: { title: "Collega l'app", text: "Premi «Crea un codice» e scrivilo nell'app." },
        layout: { title: "Scegli il layout", text: "Nell'app premi «Crea il tuo layout» e scegli lo stile dei pannelli." },
      },
      codeLink: "Crea il codice",
    },
    twitch: {
      title: "Su Twitch",
      time: "5 minuti",
      steps: {
        install: { title: "Installa l'estensione", text: "Apri «OriginsMeta Deck tracker» e premi «Installa»." },
        activate: { title: "Attivala", text: "In Le mie estensioni premi «Attiva», poi «Imposta come Overlay 1»." },
        connect: { title: "Collega Twitch", text: "Premi l'ingranaggio dell'estensione. Crea un codice per Twitch, scrivilo lì e premi «Collega»." },
      },
      extLink: "Apri l'estensione",
      codeLink: "Crea il codice per Twitch",
    },
    done: { label: "Fatto", text: "Vai in diretta con il Tracker aperto: chi ti guarda passa il mouse sul video e vede il tuo mazzo." },
    help: {
      title: "Ti blocchi? Scrivici su Discord",
      copy: "Copia",
      copied: "Copiato",
      copyAria: "Copia il nome utente Discord di {name}",
      server: "Entra nel Discord di OriginsMeta",
      guides: "Tutte le guide passo passo",
    },
    fromCreators: "Vai di fretta? Tracker ed estensione Twitch in una schermata",
  },
  es: {
    meta: {
      title: "Layout de Twitch para Origins TCG: Tracker y extensión",
      description: "Lleva tu mazo de Origins TCG a tu directo de Twitch: OriginsMeta Tracker en tu PC y la extensión para tu público, en siete pasos y diez minutos. Gratis.",
    },
    h1: "Tu layout de Twitch para Origins TCG",
    lead: "OriginsMeta Tracker muestra tu mazo en directo y, con la extensión de Twitch, tu público lo abre sobre el video. Gratis, listo en 10 minutos.",
    needs: "Necesitas un PC con Windows, Origins TCG en Steam y tu canal de Twitch.",
    imageNote: "lo que ve tu público",
    pc: {
      title: "En tu PC",
      time: "5 minutos",
      steps: {
        download: { title: "Descarga el Tracker", text: "Necesitas una cuenta gratuita en el sitio. Llega un archivo .zip." },
        run: { title: "Extrae y abre", text: "Clic derecho en el zip, «Extraer todo…». Abre «OriginsMeta Tracker.exe». Si Windows avisa: «Más información» y luego «Ejecutar de todas formas»." },
        link: { title: "Vincula la app", text: "Pulsa «Crear un código» y escríbelo en la app." },
        layout: { title: "Elige tu layout", text: "En la app pulsa «Crea tu layout» y elige el estilo de los paneles." },
      },
      codeLink: "Crear el código",
    },
    twitch: {
      title: "En Twitch",
      time: "5 minutos",
      steps: {
        install: { title: "Instala la extensión", text: "Abre «OriginsMeta Deck tracker» y pulsa «Instalar»." },
        activate: { title: "Actívala", text: "En Mis extensiones pulsa «Activar» y luego «Establecer como Superposición 1»." },
        connect: { title: "Vincula Twitch", text: "Pulsa el engranaje de la extensión. Crea un código para Twitch, escríbelo allí y pulsa «Vincular»." },
      },
      extLink: "Abrir la extensión",
      codeLink: "Crear el código para Twitch",
    },
    done: { label: "Listo", text: "Empieza el directo con el Tracker abierto: tu público pasa el puntero por el video y ve tu mazo." },
    help: {
      title: "¿Te atascas? Escríbenos por Discord",
      copy: "Copiar",
      copied: "Copiado",
      copyAria: "Copiar el nombre de usuario de Discord de {name}",
      server: "Entra en el Discord de OriginsMeta",
      guides: "Todas las guías paso a paso",
    },
    fromCreators: "¿Vas con prisa? Tracker y extensión de Twitch en una pantalla",
  },
  fr: {
    meta: {
      title: "Layout Twitch pour Origins TCG : Tracker et extension",
      description: "Affichez votre deck Origins TCG en direct sur Twitch : OriginsMeta Tracker sur PC et l'extension pour votre public, en sept étapes et dix minutes. Gratuit.",
    },
    h1: "Votre layout Twitch pour Origins TCG",
    lead: "OriginsMeta Tracker affiche votre deck en direct et, avec l'extension Twitch, votre public l'ouvre par-dessus la vidéo. Gratuit, prêt en 10 minutes.",
    needs: "Il vous faut un PC sous Windows, Origins TCG sur Steam et votre chaîne Twitch.",
    imageNote: "ce que voit votre public",
    pc: {
      title: "Sur votre PC",
      time: "5 minutes",
      steps: {
        download: { title: "Téléchargez le Tracker", text: "Il faut un compte gratuit sur le site. Un fichier .zip arrive." },
        run: {
          title: "Extrayez et lancez",
          text: "Clic droit sur le zip, « Extraire tout… ». Ouvrez « OriginsMeta Tracker.exe ». Windows bloque ? « Informations complémentaires », puis « Exécuter quand même ».",
        },
        link: { title: "Associez l'application", text: "Appuyez sur « Créer un code » et saisissez-le dans l'application (elle est en anglais : « Link »)." },
        layout: { title: "Choisissez votre layout", text: "Dans l'application : « Create your layout », puis le style des panneaux." },
      },
      codeLink: "Créer le code",
    },
    twitch: {
      title: "Sur Twitch",
      time: "5 minutes",
      steps: {
        install: { title: "Installez l'extension", text: "Ouvrez « OriginsMeta Deck tracker » et appuyez sur « Installer »." },
        activate: { title: "Activez-la", text: "Dans Mes extensions, appuyez sur « Activer », puis sur « Définir comme Superposition 1 »." },
        connect: { title: "Associez Twitch", text: "Appuyez sur l'engrenage de l'extension. Créez un code pour Twitch, saisissez-le là et appuyez sur « Associer »." },
      },
      extLink: "Ouvrir l'extension",
      codeLink: "Créer le code pour Twitch",
    },
    done: { label: "C'est prêt", text: "Lancez votre live avec le Tracker ouvert : votre public passe la souris sur la vidéo et voit votre deck." },
    help: {
      title: "Vous êtes bloqué ? Écrivez-nous sur Discord",
      copy: "Copier",
      copied: "Copié",
      copyAria: "Copier le nom d'utilisateur Discord de {name}",
      server: "Rejoindre le Discord d'OriginsMeta",
      guides: "Tous les guides pas à pas",
    },
    fromCreators: "Vous êtes pressé ? Tracker et extension Twitch sur un seul écran",
  },
  pt: {
    meta: {
      title: "Layout da Twitch para Origins TCG: Tracker e extensão",
      description: "Coloque o seu deck de Origins TCG ao vivo na Twitch: OriginsMeta Tracker no seu PC e a extensão para quem assiste, em sete passos e dez minutos. Grátis.",
    },
    h1: "O seu layout da Twitch para Origins TCG",
    lead: "O OriginsMeta Tracker mostra o seu deck ao vivo e, com a extensão da Twitch, quem assiste abre o deck sobre o vídeo. Grátis, pronto em 10 minutos.",
    needs: "Você precisa de um PC com Windows, do Origins TCG na Steam e do seu canal da Twitch.",
    imageNote: "o que quem assiste vê",
    pc: {
      title: "No seu PC",
      time: "5 minutos",
      steps: {
        download: { title: "Baixe o Tracker", text: "É preciso uma conta gratuita no site. Chega um arquivo .zip." },
        run: { title: "Extraia e abra", text: "Botão direito no zip, “Extrair Tudo…”. Abra “OriginsMeta Tracker.exe”. Se o Windows avisar: “Mais informações” e depois “Executar assim mesmo”." },
        link: { title: "Vincule o app", text: "Aperte “Criar um código” e digite o código no app (ele está em inglês: “Link”)." },
        layout: { title: "Escolha o seu layout", text: "No app, aperte “Create your layout” e escolha o estilo dos painéis." },
      },
      codeLink: "Criar o código",
    },
    twitch: {
      title: "Na Twitch",
      time: "5 minutos",
      steps: {
        install: { title: "Instale a extensão", text: "Abra “OriginsMeta Deck tracker” e aperte “Instalar”." },
        activate: { title: "Ative a extensão", text: "Em Minhas extensões, aperte “Ativar” e depois “Definir como sobreposição 1”." },
        connect: { title: "Vincule a Twitch", text: "Aperte a engrenagem da extensão. Crie um código para a Twitch, digite-o lá e aperte “Link”." },
      },
      extLink: "Abrir a extensão",
      codeLink: "Criar o código para a Twitch",
    },
    done: { label: "Pronto", text: "Entre ao vivo com o Tracker aberto: quem assiste passa o mouse sobre o vídeo e vê o seu deck." },
    help: {
      title: "Travou? Fale com a gente no Discord",
      copy: "Copiar",
      copied: "Copiado",
      copyAria: "Copiar o nome de usuário do Discord de {name}",
      server: "Entrar no Discord do OriginsMeta",
      guides: "Todos os guias passo a passo",
    },
    fromCreators: "Com pressa? Tracker e extensão da Twitch em uma tela só",
  },
  de: {
    meta: {
      title: "Twitch-Layout für Origins TCG: Tracker und Erweiterung",
      description: "Bring dein Deck aus Origins TCG live auf Twitch: OriginsMeta Tracker auf dem PC und die Erweiterung für deine Zuschauer, in sieben Schritten und zehn Minuten.",
    },
    h1: "Dein Twitch-Layout für Origins TCG",
    lead: "OriginsMeta Tracker zeigt dein Deck live, und mit der Twitch-Erweiterung öffnen es deine Zuschauer über dem Video. Kostenlos, in 10 Minuten fertig.",
    needs: "Du brauchst einen Windows-PC, Origins TCG auf Steam und deinen Twitch-Kanal.",
    imageNote: "das sehen deine Zuschauer",
    pc: {
      title: "Auf deinem PC",
      time: "5 Minuten",
      steps: {
        download: { title: "Lade den Tracker herunter", text: "Mit einem kostenlosen Konto auf der Website. Es kommt eine .zip-Datei." },
        run: { title: "Entpacken und starten", text: "Rechtsklick auf das ZIP, „Alle extrahieren…“. Öffne „OriginsMeta Tracker.exe“. Windows warnt? „Weitere Informationen“, dann „Trotzdem ausführen“." },
        link: { title: "Verknüpfe die App", text: "Drück auf „Code erstellen“ und gib ihn in der App ein (sie ist auf Englisch: „Link“)." },
        layout: { title: "Wähl dein Layout", text: "Drück in der App auf „Create your layout“ und wähl den Stil der Panels." },
      },
      codeLink: "Code erstellen",
    },
    twitch: {
      title: "Auf Twitch",
      time: "5 Minuten",
      steps: {
        install: { title: "Installiere die Erweiterung", text: "Öffne „OriginsMeta Deck tracker“ und drück auf „Installieren“." },
        activate: { title: "Aktiviere sie", text: "Drück unter Meine Erweiterungen auf „Aktivieren“, dann auf „Als Overlay 1 festlegen“." },
        connect: { title: "Verknüpfe Twitch", text: "Drück auf das Zahnrad der Erweiterung. Erstell einen Code für Twitch, gib ihn dort ein und drück auf „Link“." },
      },
      extLink: "Erweiterung öffnen",
      codeLink: "Code für Twitch erstellen",
    },
    done: { label: "Fertig", text: "Geh live mit geöffnetem Tracker: Deine Zuschauer fahren mit der Maus über das Video und sehen dein Deck." },
    help: {
      title: "Hängst du fest? Schreib uns auf Discord",
      copy: "Kopieren",
      copied: "Kopiert",
      copyAria: "Discord-Benutzernamen von {name} kopieren",
      server: "Zum OriginsMeta-Discord",
      guides: "Alle Schritt-für-Schritt-Anleitungen",
    },
    fromCreators: "Eilig? Tracker und Twitch-Erweiterung auf einem Bildschirm",
  },
  ru: {
    meta: {
      title: "Оверлей для Twitch по Origins TCG: Tracker и расширение",
      description: "Покажите свою колоду Origins TCG в эфире на Twitch: OriginsMeta Tracker на вашем ПК и расширение для зрителей, семь шагов и десять минут. Бесплатно.",
    },
    h1: "Ваш оверлей для Twitch по Origins TCG",
    lead: "OriginsMeta Tracker показывает вашу колоду в реальном времени, а с расширением для Twitch зрители открывают её поверх видео. Бесплатно, настройка за 10 минут.",
    needs: "Понадобятся ПК с Windows, Origins TCG в Steam и ваш канал на Twitch.",
    imageNote: "так это видят зрители",
    pc: {
      title: "На ПК",
      time: "5 минут",
      steps: {
        download: { title: "Скачайте Tracker", text: "Нужен бесплатный аккаунт на сайте. Придёт zip-файл." },
        run: { title: "Распакуйте и запустите", text: "Правой кнопкой по zip, «Извлечь все…». Откройте «OriginsMeta Tracker.exe». Windows предупреждает? «Подробнее», затем «Выполнить в любом случае»." },
        link: { title: "Привяжите приложение", text: "Нажмите «Создать код» и введите его в приложении (оно на английском: «Link»)." },
        layout: { title: "Выберите оформление", text: "В приложении нажмите «Create your layout» и выберите стиль панелей." },
      },
      codeLink: "Создать код",
    },
    twitch: {
      title: "На Twitch",
      time: "5 минут",
      steps: {
        install: { title: "Установите расширение", text: "Откройте «OriginsMeta Deck tracker» и нажмите «Установить»." },
        activate: { title: "Активируйте его", text: "В разделе «Мои расширения» нажмите «Активировать», затем «Установить как оверлей 1»." },
        connect: { title: "Привяжите Twitch", text: "Нажмите шестерёнку у расширения. Создайте код для Twitch, введите его там и нажмите «Link»." },
      },
      extLink: "Открыть расширение",
      codeLink: "Создать код для Twitch",
    },
    done: { label: "Готово", text: "Выходите в эфир с открытым Tracker: зрители наводят мышь на видео и видят вашу колоду." },
    help: {
      title: "Что-то не получается? Напишите нам в Discord",
      copy: "Копировать",
      copied: "Скопировано",
      copyAria: "Скопировать имя пользователя Discord: {name}",
      server: "Зайти в Discord OriginsMeta",
      guides: "Все пошаговые инструкции",
    },
    fromCreators: "Спешите? Tracker и расширение для Twitch на одном экране",
  },
  "zh-cn": {
    meta: {
      title: "Origins TCG 的 Twitch 直播布局：Tracker 与扩展",
      description: "把你的 Origins TCG 卡组搬上 Twitch 直播：电脑上装 OriginsMeta Tracker，再给观众装上扩展，七个步骤、十分钟搞定，完全免费。",
    },
    h1: "你的 Origins TCG Twitch 直播布局",
    lead: "OriginsMeta Tracker 实时显示你的卡组；装上 Twitch 扩展后，观众可以在视频上方打开它。免费，10 分钟就能弄好。",
    needs: "你需要一台 Windows 电脑、Steam 上的 Origins TCG 和你的 Twitch 频道。",
    imageNote: "观众看到的就是这样",
    pc: {
      title: "在电脑上",
      time: "5 分钟",
      steps: {
        download: { title: "下载 Tracker", text: "需要一个免费的网站账号。你会得到一个 .zip 文件。" },
        run: { title: "解压并运行", text: "右键点击 zip，选“全部解压缩……”。打开“OriginsMeta Tracker.exe”。如果 Windows 弹出提示：点“更多信息”，再点“仍要运行”。" },
        link: { title: "关联应用", text: "按“生成代码”，然后在应用里输入（应用是英文的：“Link”）。" },
        layout: { title: "选择你的布局", text: "在应用里按“Create your layout”，选择面板样式。" },
      },
      codeLink: "生成代码",
    },
    twitch: {
      title: "在 Twitch 上",
      time: "5 分钟",
      steps: {
        install: { title: "安装扩展", text: "打开“OriginsMeta Deck tracker”，按“Install”。" },
        activate: { title: "启用扩展", text: "在 My Extensions 里按“Activate”，再选“Set as Overlay 1”。" },
        connect: { title: "关联 Twitch", text: "按扩展的齿轮图标。生成 Twitch 代码，在那里输入并按“Link”。" },
      },
      extLink: "打开扩展",
      codeLink: "生成 Twitch 代码",
    },
    done: { label: "完成", text: "开着 Tracker 开始直播：观众把鼠标移到视频上，就能看到你的卡组。" },
    help: {
      title: "卡住了？在 Discord 上找我们",
      copy: "复制",
      copied: "已复制",
      copyAria: "复制 {name} 的 Discord 用户名",
      server: "加入 OriginsMeta 的 Discord",
      guides: "全部分步指南",
    },
    fromCreators: "赶时间？Tracker 和 Twitch 扩展，一屏看完",
  },
};

/** `{name}` al suo posto nel nome del tasto "Copia". */
export function fillName(text: string, name: string): string {
  return text.replace("{name}", name);
}
