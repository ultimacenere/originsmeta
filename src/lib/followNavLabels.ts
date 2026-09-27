import type { Locale } from "./i18n";
import type { FollowErrorCode } from "./community/follows";

/**
 * Etichette piccole del pacchetto SEGUI (27/09/2026) per i componenti client che stanno su pagine pubbliche o su ogni
 * pagina: il tasto "Segui" (pagina /u e scheda di un mazzo) e il nome della busta dell'header con gli avvisi da leggere.
 * In un file a parte da `followLabels.ts` (sezioni di /account e /account/messages, privacy) perché finiscono nel bundle
 * del browser, come `inboxNavLabels.ts`. `en` è il tipo di riferimento; il file importa solo tipi.
 * Spagnolo neutro col tú (docs/spagnolo.md).
 */

const navEn = {
  follow: "Follow",
  following: "Following",
  /**
   * nome del tasto per i lettori di schermo, con il nome del profilo. Comincia sempre con il testo visibile del tasto
   * (WCAG 2.5.3, "Label in Name": chi usa il controllo vocale dice "Following" e trova il tasto)
   */
  followAria: "Follow {name}",
  followingAria: "Following {name}. Press to unfollow",
  /** chi non ha fatto l'accesso: il tasto porta alla pagina di accesso e poi torna qui */
  loginAria: "Follow {name}: sign in first",
  followersOne: "1 follower",
  followersMany: "{n} followers",
  errors: {
    notLoggedIn: "Sign in to follow this profile.",
    notFollowable: "This profile can't be followed.",
    self: "You can't follow yourself.",
    tooMany: "You already follow {max} profiles: unfollow someone from your profile first.",
    unavailable: "Following isn't available right now. Try again in a few minutes.",
    db: "Something went wrong: try again.",
  } satisfies Record<FollowErrorCode, string>,
  /** busta dell'header: in coda al nome dei messaggi ("Messages, 2 unread, 1 new notification") */
  notifOne: "1 new notification",
  notifMany: "{n} new notifications",
};

export type FollowNavLabels = typeof navEn;

export const followNavLabels: Record<Locale, FollowNavLabels> = {
  en: navEn,
  it: {
    follow: "Segui",
    following: "Segui già",
    followAria: "Segui {name}",
    followingAria: "Segui già {name}. Premi per smettere di seguire",
    loginAria: "Segui {name}: prima accedi",
    followersOne: "1 follower",
    followersMany: "{n} follower",
    errors: {
      notLoggedIn: "Accedi per seguire questo profilo.",
      notFollowable: "Questo profilo non si può seguire.",
      self: "Non puoi seguire te stesso.",
      tooMany: "Segui già {max} profili: prima smetti di seguire qualcuno dal tuo profilo.",
      unavailable: "Il tasto Segui non è disponibile in questo momento. Riprova fra qualche minuto.",
      db: "Qualcosa è andato storto: riprova.",
    },
    notifOne: "1 notifica nuova",
    notifMany: "{n} notifiche nuove",
  },
  es: {
    follow: "Seguir",
    following: "Siguiendo",
    followAria: "Seguir a {name}",
    followingAria: "Siguiendo a {name}. Pulsa para dejar de seguir",
    loginAria: "Seguir a {name}: primero inicia sesión",
    followersOne: "1 seguidor",
    followersMany: "{n} seguidores",
    errors: {
      notLoggedIn: "Inicia sesión para seguir este perfil.",
      notFollowable: "Este perfil no se puede seguir.",
      self: "No puedes seguirte a ti mismo.",
      tooMany: "Ya sigues {max} perfiles: primero deja de seguir a alguien desde tu perfil.",
      unavailable: "Seguir no está disponible en este momento. Inténtalo de nuevo en unos minutos.",
      db: "Algo salió mal: vuelve a intentarlo.",
    },
    notifOne: "1 notificación nueva",
    notifMany: "{n} notificaciones nuevas",
  },
};

/**
 * Etichette per una lingua scritta come stringa (l'header passa `locale: string`), senza importare `isLocale` da i18n.ts,
 * che porterebbe nel bundle del browser tutti i dizionari.
 */
export function followNavLabelsFor(locale: string): FollowNavLabels {
  return Object.hasOwn(followNavLabels, locale) ? followNavLabels[locale as Locale] : navEn;
}
