import type { Locale } from "@/lib/i18n";

/**
 * Avviso di servizio in testa a ogni pagina (07/10/2026, Pierluigi: "mettiamo un popup di scuse per i problemi del
 * server e scarichiamo la colpa al provider"). Non è un pop-up: una riga sotto l'header, chiudibile, che resta
 * chiusa sullo stesso browser (localStorage) e sparisce da sola alla data `until`. Il componente la monta solo
 * dopo l'idratazione, quindi non entra nell'HTML letto dai motori.
 *
 * Il fatto: il 7/10/2026 i nameserver di Register.it (ns2.register.it, ns12.register.it) hanno smesso di
 * rispondere a tratti e il dominio risultava "inesistente" a una parte dei visitatori; il sito su Vercel era su.
 * Per un avviso nuovo basta cambiare `id` (azzera le chiusure), `until` e i testi.
 */
export type ServiceNoticeText = { kicker: string; text: string; date: string; close: string };

export const SERVICE_NOTICE: { id: string; from: string; until: string; text: Record<Locale, ServiceNoticeText> } = {
  id: "dns-2026-10-07",
  from: "2026-10-07T00:00:00+02:00",
  until: "2026-10-10T23:59:59+02:00",
  text: {
    en: {
      kicker: "Service notice",
      text: "Some visitors could not reach the site today. The fault is on the DNS servers of Register.it, the provider of our domain, not on OriginsMeta. Sorry about that: we are moving the domain to another provider.",
      date: "7 October 2026",
      close: "Close this notice",
    },
    it: {
      kicker: "Avviso",
      text: "Oggi alcuni visitatori non sono riusciti a raggiungere il sito. Il guasto è nei server DNS di Register.it, il fornitore del nostro dominio, non in OriginsMeta. Ci scusiamo: stiamo spostando il dominio su un altro fornitore.",
      date: "7 ottobre 2026",
      close: "Chiudi questo avviso",
    },
    es: {
      kicker: "Aviso",
      text: "Hoy algunos visitantes no han podido entrar en el sitio. La avería está en los servidores DNS de Register.it, el proveedor de nuestro dominio, no en OriginsMeta. Perdón por las molestias: estamos trasladando el dominio a otro proveedor.",
      date: "7 de octubre de 2026",
      close: "Cerrar este aviso",
    },
    fr: {
      kicker: "Avis",
      text: "Aujourd'hui, certains visiteurs n'ont pas pu atteindre le site. La panne vient des serveurs DNS de Register.it, le fournisseur de notre domaine, pas d'OriginsMeta. Désolés pour la gêne : nous déplaçons le domaine chez un autre fournisseur.",
      date: "7 octobre 2026",
      close: "Fermer cet avis",
    },
  },
};

/** Chiave in localStorage con cui il browser ricorda la chiusura; cambia con l'`id` dell'avviso. */
export function serviceNoticeKey(id: string = SERVICE_NOTICE.id): string {
  return `om.notice.${id}`;
}

/** Vero fra `from` e `until` compresi; con date non valide l'avviso non si mostra. */
export function serviceNoticeActive(now: Date, notice: { from: string; until: string } = SERVICE_NOTICE): boolean {
  const from = Date.parse(notice.from);
  const until = Date.parse(notice.until);
  if (Number.isNaN(from) || Number.isNaN(until)) return false;
  const t = now.getTime();
  return t >= from && t <= until;
}
