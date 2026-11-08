import type { Locale } from "./i18n";

/**
 * Invito dopo la copia del codice del gioco (09/11/2026, difesa SEO/GEO): il codice di un mazzo si copia circa 11.000
 * volte al mese, il nostro Discord ha poche decine di membri. Dopo una copia riuscita (`game_code_copy`, da qualunque
 * punto del sito) compare un riquadro piccolo: entra nel Discord di OriginsMeta e, dove la pagina ha il tasto Segui
 * dell'autore (schede dei mazzi singoli e torneo), segui l'autore. Niente email: una lista e la sua informativa le
 * decide Pierluigi. Regole pure qui (con test in copyNudge.test.ts), il componente è src/components/CopyNudge.tsx.
 */

export type CopyNudgeLabels = { title: string; text: string; discord: string; follow: string; close: string };

export const copyNudgeLabels: Record<Locale, CopyNudgeLabels> = {
  en: {
    title: "Code copied",
    text: "Paste it in the game to play this deck. New decks, tournaments and news from OriginsMeta land on our Discord as soon as they are published.",
    discord: "Join our Discord",
    follow: "Follow the author",
    close: "Close",
  },
  it: {
    title: "Codice copiato",
    text: "Incollalo nel gioco per giocare questo mazzo. Mazzi nuovi, tornei e news di OriginsMeta arrivano sul nostro Discord appena escono.",
    discord: "Entra nel nostro Discord",
    follow: "Segui l'autore",
    close: "Chiudi",
  },
  es: {
    title: "Código copiado",
    text: "Pégalo en el juego para jugar este mazo. Los mazos nuevos, los torneos y las noticias de OriginsMeta llegan a nuestro Discord en cuanto se publican.",
    discord: "Únete a nuestro Discord",
    follow: "Sigue al autor",
    close: "Cerrar",
  },
  fr: {
    title: "Code copié",
    text: "Collez-le dans le jeu pour jouer ce deck. Les nouveaux decks, les tournois et les actus d'OriginsMeta arrivent sur notre Discord dès leur publication.",
    discord: "Rejoindre notre Discord",
    follow: "Suivre l'auteur",
    close: "Fermer",
  },
  pt: {
    title: "Código copiado",
    text: "Cole no jogo para jogar este deck. Decks novos, torneios e notícias do OriginsMeta chegam ao nosso Discord assim que são publicados.",
    discord: "Entre no nosso Discord",
    follow: "Siga o autor",
    close: "Fechar",
  },
  de: {
    title: "Code kopiert",
    text: "Füge ihn im Spiel ein, um dieses Deck zu spielen. Neue Decks, Turniere und News von OriginsMeta landen auf unserem Discord, sobald sie erscheinen.",
    discord: "Unserem Discord beitreten",
    follow: "Dem Autor folgen",
    close: "Schließen",
  },
  ru: {
    title: "Код скопирован",
    text: "Вставьте его в игре, чтобы сыграть этой колодой. Новые колоды, турниры и новости OriginsMeta появляются на нашем Discord сразу после публикации.",
    discord: "Вступить в наш Discord",
    follow: "Подписаться на автора",
    close: "Закрыть",
  },
  "zh-cn": {
    title: "代码已复制",
    text: "在游戏中粘贴即可使用这套卡组。OriginsMeta 的新卡组、锦标赛和新闻一发布，就会同步到我们的 Discord。",
    discord: "加入我们的 Discord",
    follow: "关注作者",
    close: "关闭",
  },
};

/** Chiave del browser: quando il riquadro è comparso l'ultima volta, se è stato chiuso, se si è entrati nel Discord. */
export const COPY_NUDGE_KEY = "originsmeta.copyNudge.v1";

export type CopyNudgeMemory = { shown?: number; closed?: number; joined?: boolean };

const HOUR = 3_600_000;
/** fra due comparse almeno un giorno; dopo la ×, una settimana; dopo il clic sul Discord, mai più */
export const COPY_NUDGE_GAP_MS = 24 * HOUR;
export const COPY_NUDGE_CLOSED_MS = 7 * 24 * HOUR;

/** Il riquadro può comparire adesso? */
export function copyNudgeDue(memory: CopyNudgeMemory, now: number): boolean {
  if (memory.joined) return false;
  if (memory.closed && now - memory.closed < COPY_NUDGE_CLOSED_MS) return false;
  if (memory.shown && now - memory.shown < COPY_NUDGE_GAP_MS) return false;
  return true;
}

/** Legge la memoria del browser scritta da `JSON.stringify`; tutto quello che non torna vale "niente". */
export function parseCopyNudgeMemory(raw: string | null): CopyNudgeMemory {
  if (!raw) return {};
  try {
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== "object") return {};
    const o = v as Record<string, unknown>;
    const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
    return { shown: num(o.shown), closed: num(o.closed), joined: o.joined === true ? true : undefined };
  } catch {
    return {};
  }
}
