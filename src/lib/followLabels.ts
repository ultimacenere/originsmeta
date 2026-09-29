import type { Locale } from "./i18n";
import type { NotificationKind } from "./community/notifications";

/**
 * Etichette del pacchetto SEGUI (27/09/2026) per le pagine private: sezione "Chi segui" di /account, sezione "Notifiche"
 * di /account/messages, paragrafo della privacy (#follows). Le etichette del tasto "Segui" e della busta dell'header, che
 * finiscono nel bundle del browser di ogni pagina, stanno in `followNavLabels.ts`. `en` è il tipo di riferimento; il
 * file importa solo tipi. Spagnolo neutro col tú (docs/spagnolo.md). I ruoli si chiamano come nei dizionari (Creator,
 * Autore/Author/Autor, Pro, Staff).
 */

const en = {
  account: {
    title: "Who you follow",
    intro:
      "The profiles you follow (role Creator, Author, Pro or Staff). When they publish a deck or go live on Twitch with Origins TCG, a notification shows up in the envelope at the top of the page.",
    countOne: "You follow 1 profile.",
    /** {max} = FOLLOW_MAX */
    countMany: "You follow {n} profiles (at most {max}).",
    empty: "You don't follow anyone yet: open the page of a Creator or an Author and press “Follow”.",
    browse: "Browse Creators and Authors",
    unfollow: "Unfollow",
    unfollowAria: "Unfollow {name}",
    unfollowing: "Unfollowing…",
    since: "Since {date}",
    unavailable: "This list isn't available right now. Try again in a few minutes.",
  },
  notifications: {
    title: "Notifications",
    intro: "News from the profiles you follow: new decks, guides and comics, and Twitch streams with Origins TCG. We keep them for 90 days.",
    unreadOne: "1 new notification.",
    unreadMany: "{n} new notifications.",
    /** in cima a /account/messages, link alla sezione in fondo alla pagina */
    jumpOne: "1 new notification from the profiles you follow",
    jumpMany: "{n} new notifications from the profiles you follow",
    markAll: "Mark all as read",
    marking: "Marking…",
    newBadge: "New",
    kinds: { deck_published: "Deck", live: "Live", guide_published: "Guide", comic_published: "Comic" } satisfies Record<NotificationKind, string>,
    /** {name} = chi ha pubblicato o è in diretta, {deck} = nome del mazzo */
    deckPublished: "{name} published a deck: {deck}",
    deckGone: "{name} published a deck that is no longer online",
    live: "{name} went live on Twitch with Origins TCG",
    /** {guide} = titolo della guida */
    guidePublished: "{name} published a guide: {guide}",
    guideGone: "{name} published a guide that is no longer online",
    /** {comic} = titolo del fumetto (pacchetto FUMETTI, 29/09/2026) */
    comicPublished: "{name} published a comic: {comic}",
    comicGone: "{name} published a comic that is no longer online",
    /** quando il profilo di chi ha fatto la cosa non si legge */
    someone: "A profile you follow",
    empty: "No notifications yet. Follow Creators and Authors to know when they publish a deck or go live.",
    browse: "Browse Creators and Authors",
    manage: "Manage who you follow",
    unavailable: "Notifications aren't available right now. Try again in a few minutes.",
    error: "Something went wrong: try again.",
    utcLabel: "UTC",
  },
  /** paragrafo della privacy (#follows) */
  privacy:
    "Follow and notifications: with an account you can follow the profiles with the role Creator, Author, Pro or Staff. We store on Supabase (servers in Ireland, EU) who you follow and since when, and the notifications we create for you (a new deck, a new guide or a Twitch stream of a profile you follow), with their date and whether you've read them. Only you can see who you follow and your notifications: a profile only shows how many followers it has, never who they are. To know who is live, every 10 minutes our server asks Twitch (Twitch Interactive Inc., United States) whether the Twitch channels listed in those profiles are streaming: nothing about you is sent to Twitch. Notifications stay only on the site (we don't send emails) and are kept for 90 days. To avoid duplicate or too frequent notifications, we keep for 180 days a log of every notification sent: which profile caused it (the deck, guide or stream), when and to how many people, without the names of who received it. You can unfollow at any time from your profile, and everything is deleted with your account.",
};

export type FollowLabels = typeof en;

export const followLabels: Record<Locale, FollowLabels> = {
  en,
  it: {
    account: {
      title: "Chi segui",
      intro:
        "I profili che segui (ruolo Creator, Autore, Pro o Staff). Quando pubblicano un mazzo o vanno in diretta su Twitch con Origins TCG, nella busta in alto nella pagina compare una notifica.",
      countOne: "Segui 1 profilo.",
      countMany: "Segui {n} profili (al massimo {max}).",
      empty: "Non segui ancora nessuno: apri la pagina di un Creator o di un Autore e premi “Segui”.",
      browse: "Scopri Creator e Autori",
      unfollow: "Smetti di seguire",
      unfollowAria: "Smetti di seguire {name}",
      unfollowing: "Un momento…",
      since: "Dal {date}",
      unavailable: "Questo elenco non è disponibile in questo momento. Riprova fra qualche minuto.",
    },
    notifications: {
      title: "Notifiche",
      intro: "Le novità dei profili che segui: mazzi, guide e fumetti nuovi e dirette su Twitch con Origins TCG. Le teniamo per 90 giorni.",
      unreadOne: "1 notifica nuova.",
      unreadMany: "{n} notifiche nuove.",
      jumpOne: "1 notifica nuova dai profili che segui",
      jumpMany: "{n} notifiche nuove dai profili che segui",
      markAll: "Segna tutte come lette",
      marking: "Un momento…",
      newBadge: "Nuova",
      kinds: { deck_published: "Mazzo", live: "Diretta", guide_published: "Guida", comic_published: "Fumetto" },
      deckPublished: "{name} ha pubblicato un mazzo: {deck}",
      deckGone: "{name} ha pubblicato un mazzo che non è più online",
      live: "{name} ha avviato una diretta su Twitch con Origins TCG",
      guidePublished: "{name} ha pubblicato una guida: {guide}",
      guideGone: "{name} ha pubblicato una guida che non è più online",
      comicPublished: "{name} ha pubblicato un fumetto: {comic}",
      comicGone: "{name} ha pubblicato un fumetto che non è più online",
      someone: "Un profilo che segui",
      empty: "Nessuna notifica per ora. Segui Creator e Autori per sapere quando pubblicano un mazzo o vanno in diretta.",
      browse: "Scopri Creator e Autori",
      manage: "Gestisci chi segui",
      unavailable: "Le notifiche non sono disponibili in questo momento. Riprova fra qualche minuto.",
      error: "Qualcosa è andato storto: riprova.",
      utcLabel: "UTC",
    },
    privacy:
      "Segui e notifiche: con un account puoi seguire i profili con il ruolo Creator, Autore, Pro o Staff. Su Supabase (server in Irlanda, UE) salviamo chi segui e da quando, e le notifiche che creiamo per te (un mazzo nuovo, una guida nuova o una diretta su Twitch di un profilo che segui), con la data e se le hai lette. Chi segui e le tue notifiche li vedi solo tu: un profilo mostra solo quanti follower ha, mai chi sono. Per sapere chi è in diretta, ogni 10 minuti il nostro server chiede a Twitch (Twitch Interactive Inc., Stati Uniti) se i canali Twitch indicati in quei profili stanno trasmettendo: a Twitch non arriva nulla di tuo. Le notifiche restano solo sul sito (niente email) e le teniamo per 90 giorni. Per evitare avvisi doppi o troppo frequenti teniamo per 180 giorni un registro di ogni avviso mandato: quale profilo l'ha causato (il mazzo, la guida o la diretta), quando e a quante persone, senza i nomi di chi lo riceve. Puoi smettere di seguire quando vuoi dal tuo profilo, e con l'account si cancella tutto.",
  },
  es: {
    account: {
      title: "A quién sigues",
      intro:
        "Los perfiles que sigues (rol Creator, Autor, Pro o Staff). Cuando publican un mazo o empiezan un directo en Twitch con Origins TCG, aparece una notificación en el sobre de la parte superior de la página.",
      countOne: "Sigues 1 perfil.",
      countMany: "Sigues {n} perfiles (como máximo {max}).",
      empty: "Todavía no sigues a nadie: abre la página de un Creator o de un Autor y pulsa “Seguir”.",
      browse: "Descubre Creators y Autores",
      unfollow: "Dejar de seguir",
      unfollowAria: "Dejar de seguir a {name}",
      unfollowing: "Un momento…",
      since: "Desde el {date}",
      unavailable: "Esta lista no está disponible en este momento. Inténtalo de nuevo en unos minutos.",
    },
    notifications: {
      title: "Notificaciones",
      intro: "Las novedades de los perfiles que sigues: mazos, guías y cómics nuevos, y directos en Twitch con Origins TCG. Las guardamos durante 90 días.",
      unreadOne: "1 notificación nueva.",
      unreadMany: "{n} notificaciones nuevas.",
      jumpOne: "1 notificación nueva de los perfiles que sigues",
      jumpMany: "{n} notificaciones nuevas de los perfiles que sigues",
      markAll: "Marcar todas como leídas",
      marking: "Un momento…",
      newBadge: "Nueva",
      kinds: { deck_published: "Mazo", live: "Directo", guide_published: "Guía", comic_published: "Cómic" },
      deckPublished: "{name} publicó un mazo: {deck}",
      deckGone: "{name} publicó un mazo que ya no está en línea",
      live: "{name} empezó un directo en Twitch con Origins TCG",
      guidePublished: "{name} publicó una guía: {guide}",
      guideGone: "{name} publicó una guía que ya no está en línea",
      comicPublished: "{name} publicó un cómic: {comic}",
      comicGone: "{name} publicó un cómic que ya no está en línea",
      someone: "Un perfil que sigues",
      empty: "Todavía no hay notificaciones. Sigue a Creators y Autores para saber cuándo publican un mazo o empiezan un directo.",
      browse: "Descubre Creators y Autores",
      manage: "Gestiona a quién sigues",
      unavailable: "Las notificaciones no están disponibles en este momento. Inténtalo de nuevo en unos minutos.",
      error: "Algo salió mal: vuelve a intentarlo.",
      utcLabel: "UTC",
    },
    privacy:
      "Seguir y notificaciones: con una cuenta puedes seguir los perfiles con el rol Creator, Autor, Pro o Staff. En Supabase (servidores en Irlanda, UE) guardamos a quién sigues y desde cuándo, y las notificaciones que creamos para ti (un mazo nuevo, una guía nueva o un directo en Twitch de un perfil que sigues), con la fecha y si las leíste. A quién sigues y tus notificaciones solo los ves tú: un perfil solo muestra cuántos seguidores tiene, nunca quiénes son. Para saber quién está en directo, cada 10 minutos nuestro servidor pregunta a Twitch (Twitch Interactive Inc., Estados Unidos) si los canales de Twitch indicados en esos perfiles están transmitiendo: a Twitch no le llega nada tuyo. Las notificaciones solo están en el sitio (no enviamos correos electrónicos) y las guardamos durante 90 días. Para evitar avisos duplicados o demasiado frecuentes, guardamos durante 180 días un registro de cada notificación enviada: qué perfil la causó (el mazo, la guía o el directo), cuándo y a cuántas personas, sin los nombres de quienes la reciben. Puedes dejar de seguir cuando quieras desde tu perfil, y todo se elimina con tu cuenta.",
  },
};

/** Riempie i segnaposto {nome} di un'etichetta. */
export function fillFollowLabel(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (all, key: string) => (Object.hasOwn(values, key) ? String(values[key]) : all));
}
