"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useTransition } from "react";
import type { DragEvent as ReactDragEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { initials } from "@/lib/cardArt";
import { saveTierList, type TierActionState } from "@/lib/community/tierActions";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import type { BuilderCard } from "@/lib/deckrules";
import {
  TIERS,
  TIER_KINDS,
  TITLE_MAX,
  TL_VERSION,
  cleanTitle,
  decodeTierCode,
  emptyBoard,
  encodeTierCode,
  isEmptyBoard,
  moveCard,
  rankedCount,
  tierListText,
  tierOf,
  tierTone,
  unranked,
  type DecodedTierList,
  type Tier,
  type TierBoard,
  type TierKind,
} from "@/lib/tiercode";
import { CardPeek, hasPeek } from "./CardPeek";

/**
 * Tier list personalizzabile (/tier-list/create, richiesta del 22/09/2026): le carte attive della Demo 2.0 si
 * trascinano nelle fasce S/A/B/C/D, Leggendarie e carte base in due schede separate. Nessun account, come il deck
 * builder: la lista si salva nel browser (una chiave per scheda) e si condivide con un link (#TL1…, vedi tiercode.ts).
 *
 * Tre modi di spostare una carta, tutti sulle stesse funzioni pure di tiercode.ts:
 * - mouse: drag and drop HTML5, con il segno menta dove cadrà la carta (anche per riordinare dentro una fascia);
 * - telefono, dove il drag nativo non c'è: tocca una carta per selezionarla, poi tocca una fascia (o la barra in basso
 *   con S A B C D, così non si deve risalire la pagina) oppure un'altra carta, davanti alla quale andrà. Una carta presa
 *   con un clic (anche l'Invio dei lettori di schermo in modalità navigazione) porta il focus sul tasto S della barra;
 *   con il colore forzato di Windows carta in mano e segno di caduta restano visibili (contorno e bordo);
 * - tastiera: un solo punto di tabulazione per il tabellone, frecce per muoversi, Invio o spazio per prendere e
 *   lasciare (con la carta in mano le frecce la spostano), S A B C D per assegnarla subito, Canc per rimetterla fra
 *   le non classificate, Esc per annullare lo spostamento. Ogni cambio di fascia si annuncia in una regione aria-live.
 */

/** Il minimo di una carta che serve al tabellone e all'anteprima: la pagina lo ricava da `builderPool`. */
export type TierCard = Pick<BuilderCard, "slug" | "name" | "legendary" | "mana" | "power" | "health" | "thumb" | "image" | "ability" | "alignment" | "alignmentLabel" | "typeLabel">;

export type TierMakerLabels = {
  tabsLabel: string;
  tabLegendaries: string;
  tabCards: string;
  /** "{n} di {total} classificate", per i lettori di schermo accanto al contatore delle schede */
  rankedOf: string;
  titleLabel: string;
  titlePlaceholder: string;
  help: string;
  /** "Fascia {tier}" */
  tierRow: string;
  unranked: string;
  emptyTier: string;
  allRanked: string;
  searchPool: string;
  noMatch: string;
  legendary: string;
  /** "Mana": il costo nel nome letto dai lettori di schermo ("Dorothy (Leggendaria), Mana 4") */
  mana: string;
  /** annunci: "{card}", "{tier}", "{pos}", "{total}" */
  picked: string;
  movedTo: string;
  movedOut: string;
  cancelled: string;
  /** barra in basso con una carta selezionata: "Sposta {card} in" e l'etichetta di ogni tasto "Sposta {card} in fascia {tier}" */
  barLabel: string;
  moveTo: string;
  cancel: string;
  /** titolo (solo per lettori di schermo) del blocco dei tasti */
  actions: string;
  copyLink: string;
  copyText: string;
  linkCopied: string;
  textCopied: string;
  copyFallback: string;
  shareHint: string;
  reset: string;
  resetConfirm: string;
  resetYes: string;
  resetDone: string;
  autosaved: string;
  storageBlocked: string;
  sharedOpened: string;
  restoreMine: string;
  /** scarta la lista di prima e tiene quella arrivata dal link */
  keepThis: string;
  restored: string;
  /** titolo del testo copiato quando la lista non ne ha uno: "Tier list di Origins TCG · {kind}" */
  textHeading: string;
  /** ultima riga del testo copiato: "Fatta su OriginsMeta: {url}" */
  textFooter: string;
  /* salvataggio nel profilo (23/09/2026): una tier list per utente e per scheda, e alimenta quella della community */
  save: string;
  saving: string;
  savedToProfile: string;
  viewProfile: string;
  saveHint: string;
  /** lucchetto sul tasto per chi non ha un account */
  loginRequired: string;
  saveErrors: Record<string, string>;
};

type Row = Tier | "pool";
const ROWS: readonly Row[] = [...TIERS, "pool"];
const ARROWS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];

/** Una chiave per scheda; il contenuto è il codice TL1, lo stesso del link. `.prev` tiene la lista sostituita da un link. */
const STORAGE: Record<TierKind, string> = {
  legendaries: "originsmeta.tierlist.legendaries.v1",
  cards: "originsmeta.tierlist.cards.v1",
};
const backupKey = (k: TierKind) => `${STORAGE[k]}.prev`;
/** ultima scheda aperta: comodità del singolo visitatore */
const TAB_KEY = "originsmeta.tierlist.tab";

const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

/** Lettura e scrittura del browser: con lo storage bloccato (finestra privata, dati del sito disattivati) non si rompe nulla. */
function readItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeItem(key: string, value: string | null): boolean {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Tier list arrivata con un link (#TL1…), o null. L'hash si toglie dall'indirizzo: la lista passa nello stato e nel
 * salvataggio automatico, e un ricaricamento non deve rimetterla sopra le modifiche fatte nel frattempo.
 */
function takeLinkFromHash(known: Record<TierKind, ReadonlySet<string>>): DecodedTierList | null {
  try {
    const hash = window.location.hash.slice(1);
    if (!hash.includes(`${TL_VERSION}.`)) return null;
    const linked = decodeTierCode(hash, known);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    return linked;
  } catch {
    return null;
  }
}

/**
 * La lista del link prende il posto di quella della sua scheda. Quella che c'era, se non è vuota e non è la stessa,
 * resta nel browser come copia da ripristinare ("Torna alla tua lista di prima").
 */
function adoptLinked(current: Record<TierKind, TierBoard>, linked: DecodedTierList): { boards: Record<TierKind, TierBoard>; changed: boolean; backup: boolean } {
  const mine = current[linked.kind];
  if (encodeTierCode(linked.kind, mine) === encodeTierCode(linked.kind, linked.board)) return { boards: current, changed: false, backup: false };
  const backup = !isEmptyBoard(mine) && writeItem(backupKey(linked.kind), encodeTierCode(linked.kind, mine));
  return { boards: { ...current, [linked.kind]: linked.board }, changed: true, backup };
}

export function TierListMaker({
  legendaries,
  cards,
  shareBase,
  labels,
  locale,
}: {
  legendaries: TierCard[];
  cards: TierCard[];
  shareBase: string;
  labels: TierMakerLabels;
  /** lingua della pagina: serve al salvataggio nel profilo e al giro dall'accesso */
  locale: string;
}) {
  const pools = useMemo<Record<TierKind, TierCard[]>>(() => ({ legendaries, cards }), [legendaries, cards]);
  const bySlug = useMemo(() => new Map([...legendaries, ...cards].map((c) => [c.slug, c])), [legendaries, cards]);
  const known = useMemo(() => ({ legendaries: new Set(legendaries.map((c) => c.slug)), cards: new Set(cards.map((c) => c.slug)) }), [legendaries, cards]);

  const [kind, setKind] = useState<TierKind>("legendaries");
  const [boards, setBoards] = useState<Record<TierKind, TierBoard>>(() => ({ legendaries: emptyBoard(), cards: emptyBoard() }));
  const [hydrated, setHydrated] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  /** carta in mano (tocco o Invio) con le fasce com'erano quando è stata presa: Esc e "Annulla" le rimettono così */
  const [held, setHeld] = useState<{ slug: string; tiers: TierBoard["tiers"] } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  /** dove cadrà la carta trascinata: fila e carta davanti alla quale andrà (null = in fondo) */
  const [hint, setHint] = useState<{ row: Row; before: string | null } | null>(null);
  /** carta con il punto di tabulazione del tabellone */
  const [active, setActive] = useState<string | null>(null);
  const [live, setLive] = useState<{ text: string; n: number }>({ text: "", n: 0 });
  const [sharedKind, setSharedKind] = useState<TierKind | null>(null);
  const [backups, setBackups] = useState<Record<TierKind, boolean>>({ legendaries: false, cards: false });
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState<"link" | "text" | null>(null);
  /** appunti negati dal browser: si mostra il testo da copiare a mano (calcolato ogni volta, così resta aggiornato) */
  const [fallback, setFallback] = useState<"link" | "text" | null>(null);
  const [q, setQ] = useState("");

  /* --- salvataggio nel profilo (23/09/2026): una tier list per utente e per scheda. Chi non ha un account
         continua a usare il tool com'era, con il salvataggio nel browser e il link da condividere. --- */
  const [loggedIn, setLoggedIn] = useState<boolean | null>(supabaseEnabled ? null : false);
  const [saving, startSave] = useTransition();
  /** esito dell'ultimo salvataggio, legato al codice salvato: cambiando la lista il messaggio sparisce */
  const [saveResult, setSaveResult] = useState<(TierActionState & { code: string }) | null>(null);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (alive) setLoggedIn(Boolean(data.session));
    });
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      if (alive) setLoggedIn(Boolean(session));
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  /** modifiche non ancora scritte nel browser, per scheda: senza, niente scrittura (due schede aperte non si sovrascrivono) */
  const dirty = useRef<Record<TierKind, boolean>>({ legendaries: false, cards: false });
  const restoredOnce = useRef(false);
  const cardEls = useRef(new Map<string, HTMLElement>());
  /** carta da mettere a fuoco dopo il prossimo render (spostandosi di fila la carta viene rimontata e perde il fuoco) */
  const pendingFocus = useRef<{ slug: string; scroll: boolean } | null>(null);
  const copiedTimer = useRef<number | undefined>(undefined);
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  /** primo tasto (S) della barra in basso: riceve il focus quando una carta si prende con un clic (lettori di schermo) */
  const barFirstRef = useRef<HTMLButtonElement>(null);
  const pendingBarFocus = useRef(false);
  /** "Ricomincia" e "Annulla" della conferma: il focus passa dall'uno all'altro */
  const resetRef = useRef<HTMLButtonElement>(null);
  const resetCancelRef = useRef<HTMLButtonElement>(null);
  const pendingResetFocus = useRef<"cancel" | "reset" | null>(null);

  const board = boards[kind];
  const pool = pools[kind];
  const rows = useMemo<Record<Row, string[]>>(() => ({ ...board.tiers, pool: unranked(board, pool.map((c) => c.slug)) }), [board, pool]);
  const needle = q.trim().toLowerCase();
  /** le file come si vedono: la ricerca filtra solo le non classificate */
  const visible = useMemo<Record<Row, string[]>>(
    () => ({ ...rows, pool: needle ? rows.pool.filter((s) => (bySlug.get(s)?.name ?? s).toLowerCase().includes(needle)) : rows.pool }),
    [rows, needle, bySlug],
  );
  const flat = ROWS.flatMap((r) => visible[r]);
  const tabStop = active && flat.includes(active) ? active : flat[0];
  const ranked = rankedCount(board);
  const kindLabel = (k: TierKind) => (k === "legendaries" ? labels.tabLegendaries : labels.tabCards);
  const nameOf = (slug: string) => bySlug.get(slug)?.name ?? slug;
  const rowOf = (slug: string): Row => tierOf(board, slug) ?? "pool";

  /* --- ripristino dal browser e dal link (#TL1…): una volta, dopo l'idratazione (sul server non c'è storage).
         Il ref evita il secondo giro dello Strict Mode, che dopo la pulizia dell'indirizzo non troverebbe più il link. --- */
  /* eslint-disable react-hooks/set-state-in-effect -- lettura una tantum di indirizzo e localStorage al montaggio */
  useEffect(() => {
    if (restoredOnce.current) return;
    restoredOnce.current = true;
    let next: Record<TierKind, TierBoard> = { legendaries: emptyBoard(), cards: emptyBoard() };
    const prev: Record<TierKind, boolean> = { legendaries: false, cards: false };
    for (const k of TIER_KINDS) {
      const saved = decodeTierCode(readItem(STORAGE[k]) ?? "", known);
      if (saved?.kind === k) next[k] = saved.board;
      prev[k] = readItem(backupKey(k)) !== null;
    }
    const tab = readItem(TAB_KEY);
    let startKind: TierKind | null = tab === "legendaries" || tab === "cards" ? tab : null;
    const linked = takeLinkFromHash(known);
    if (linked) {
      const res = adoptLinked(next, linked);
      next = res.boards;
      // la lista del link non è ancora nel browser: il salvataggio automatico la scrive subito
      if (res.changed) dirty.current[linked.kind] = true;
      if (res.backup) prev[linked.kind] = true;
      startKind = linked.kind;
      setSharedKind(linked.kind);
    }
    setBoards(next);
    setBackups(prev);
    if (startKind) setKind(startKind);
    setHydrated(true);
  }, [known]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* Un link incollato nella barra dell'indirizzo con la pagina già aperta cambia solo l'hash: stessa accoglienza. */
  const onHashChange = useEffectEvent(() => {
    const linked = takeLinkFromHash(known);
    if (!linked) return;
    const res = adoptLinked(boards, linked);
    if (res.changed) {
      dirty.current[linked.kind] = true;
      setBoards(res.boards);
    }
    if (res.backup) setBackups((b) => ({ ...b, [linked.kind]: true }));
    setKind(linked.kind);
    setHeld(null);
    setActive(null);
    setSharedKind(linked.kind);
    say(labels.sharedOpened);
  });
  useEffect(() => {
    if (!hydrated) return;
    const handler = () => onHashChange();
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, [hydrated]);

  /* --- salvataggio automatico nel browser. Prima del ripristino lo stato è vuoto e scriverlo cancellerebbe le liste
         salvate, quindi niente scrittura finché `hydrated` è falso; poi si scrive solo la scheda che ha modifiche. --- */
  const writeNow = useEffectEvent(() => {
    let ok = true;
    for (const k of TIER_KINDS) {
      if (!dirty.current[k]) continue;
      if (writeItem(STORAGE[k], encodeTierCode(k, boards[k]))) dirty.current[k] = false;
      else ok = false;
    }
    setStorageOk(ok);
  });
  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => writeNow(), 300);
    return () => window.clearTimeout(t);
  }, [hydrated, boards]);
  /* chiusura della scheda o cambio di pagina prima dei 300 ms: si scrive subito, se c'è qualcosa da scrivere */
  useEffect(() => {
    if (!hydrated) return;
    const flush = () => writeNow();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [hydrated]);

  /* fuoco sulla carta appena spostata (o su quella che ne ha preso il posto) */
  useEffect(() => {
    const p = pendingFocus.current;
    if (!p) return;
    pendingFocus.current = null;
    cardEls.current.get(p.slug)?.focus({ preventScroll: !p.scroll });
  });

  /* Carta presa con un clic (mouse, tocco, o Invio di un lettore di schermo in modalità navigazione, che manda un
     clic): il focus va sul primo tasto della barra "Sposta … in", così chi non vede la barra la trova subito.
     Invio e spazio dalla tastiera passano da onKeyDown senza clic: lì il focus resta sulla carta e le frecce la
     spostano come prima. */
  useEffect(() => {
    if (!held || !pendingBarFocus.current) return;
    pendingBarFocus.current = false;
    barFirstRef.current?.focus({ preventScroll: true });
  }, [held]);

  /* Conferma di "Ricomincia": il focus va su "Annulla" quando compare, e torna su "Ricomincia" quando si annulla */
  useEffect(() => {
    const target = pendingResetFocus.current;
    if (!target) return;
    pendingResetFocus.current = null;
    (target === "cancel" ? resetCancelRef.current : resetRef.current)?.focus();
  }, [confirmReset]);

  /* testo da copiare a mano: si seleziona appena compare */
  useEffect(() => {
    if (!fallback) return;
    fallbackRef.current?.focus();
    fallbackRef.current?.select();
  }, [fallback]);

  /* Esc annulla lo spostamento, ovunque sia il fuoco (anche dopo un tocco su telefono con tastiera) */
  const onEscape = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === "Escape") cancelHold();
  });
  const holding = held !== null;
  useEffect(() => {
    if (!holding) return;
    const handler = (e: KeyboardEvent) => onEscape(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [holding]);

  /* --- azioni --- */

  /** annuncio per i lettori di schermo: la chiave nuova rimonta il paragrafo, così anche un testo uguale si ripete */
  function say(text: string) {
    setLive((l) => ({ text, n: l.n + 1 }));
  }

  function update(k: TierKind, fn: (b: TierBoard) => TierBoard) {
    dirty.current[k] = true;
    setBoards((prev) => ({ ...prev, [k]: fn(prev[k]) }));
  }

  function focusLater(slug: string, scroll: boolean) {
    pendingFocus.current = { slug, scroll };
    setActive(slug);
  }

  function announceMove(b: TierBoard, slug: string) {
    const t = tierOf(b, slug);
    if (t) {
      const list = b.tiers[t];
      say(fmt(labels.movedTo, { card: nameOf(slug), tier: t, pos: list.indexOf(slug) + 1, total: list.length }));
    } else {
      say(fmt(labels.movedOut, { card: nameOf(slug) }));
    }
  }

  /** sposta e annuncia; `before` è la carta davanti alla quale mettere quella spostata (null = in fondo) */
  function place(slug: string, to: Tier | null, before: string | null = null) {
    const next = moveCard(board, slug, to, before);
    if (next !== board) update(kind, () => next);
    announceMove(next, slug);
  }

  function pick(slug: string) {
    setHeld({ slug, tiers: board.tiers });
    setConfirmReset(false);
    say(fmt(labels.picked, { card: nameOf(slug) }));
  }

  function cancelHold() {
    if (!held) return;
    const { slug, tiers } = held;
    setHeld(null);
    if (tiers !== board.tiers) update(kind, (b) => ({ ...b, tiers }));
    focusLater(slug, false);
    say(fmt(labels.cancelled, { card: nameOf(slug) }));
  }

  /** clic, tocco, Invio o spazio su una carta */
  function activate(slug: string, row: Row) {
    if (!held) return pick(slug);
    if (held.slug === slug) {
      setHeld(null);
      announceMove(board, slug);
      return;
    }
    const heldSlug = held.slug;
    if (row === "pool") {
      // le non classificate non hanno un ordine: con in mano un'altra non classificata si cambia carta
      if (rowOf(heldSlug) === "pool") return pick(slug);
      setHeld(null);
      place(heldSlug, null);
      return;
    }
    setHeld(null);
    place(heldSlug, row, slug);
  }

  /**
   * Assegna subito una fascia (tasti S A B C D e Canc, barra in basso, tocco su una fascia). Il fuoco resta nella fila
   * di partenza, sulla carta che prende il posto di quella spostata: così si classificano le carte una dopo l'altra.
   */
  function assign(slug: string, to: Tier | null, scroll: boolean) {
    const from = rowOf(slug);
    if (held) setHeld(null);
    if ((to ?? "pool") === from) {
      announceMove(board, slug);
      return;
    }
    const list = visible[from];
    const i = list.indexOf(slug);
    place(slug, to);
    focusLater(list[i + 1] ?? list[i - 1] ?? slug, scroll);
  }

  /** carta più vicina sopra (-1) o sotto (1) fra quelle di `slugs`, sulla prima riga visiva che si incontra */
  function nearest(slugs: string[], from: string, dir: 1 | -1): string | undefined {
    const me = cardEls.current.get(from)?.getBoundingClientRect();
    if (!me) return undefined;
    const cx = me.left + me.width / 2;
    let best: { slug: string; dy: number; dx: number } | undefined;
    for (const s of slugs) {
      if (s === from) continue;
      const r = cardEls.current.get(s)?.getBoundingClientRect();
      if (!r) continue;
      const dy = (r.top - me.top) * dir;
      if (dy < me.height / 2) continue; // stessa riga visiva o dalla parte opposta
      const dx = Math.abs(r.left + r.width / 2 - cx);
      if (!best || dy < best.dy - 4 || (Math.abs(dy - best.dy) <= 4 && dx < best.dx)) best = { slug: s, dy, dx };
    }
    return best?.slug;
  }

  function moveFocus(slug: string, row: Row, key: string) {
    const list = visible[row];
    const i = list.indexOf(slug);
    const ri = ROWS.indexOf(row);
    let target: string | undefined;
    if (key === "ArrowLeft" || key === "ArrowRight") {
      // in ordine di lettura: dalla fine di una fila si passa all'inizio della successiva
      const at = flat.indexOf(slug) + (key === "ArrowRight" ? 1 : -1);
      target = flat[at];
    } else if (key === "Home") target = list[0];
    else if (key === "End") target = list[list.length - 1];
    else {
      const dir = key === "ArrowUp" ? -1 : 1;
      target = nearest(list, slug, dir);
      for (let r = ri + dir; !target && r >= 0 && r < ROWS.length; r += dir) target = nearest(visible[ROWS[r]], slug, dir);
    }
    if (i < 0 || !target) return;
    setActive(target);
    cardEls.current.get(target)?.focus();
  }

  /** con la carta in mano: sinistra e destra la riordinano nella fascia, su e giù la portano nella fascia vicina */
  function moveHeld(slug: string, row: Row, key: string) {
    const list = rows[row];
    const i = list.indexOf(slug);
    if (i < 0) return;
    if (key === "ArrowUp" || key === "ArrowDown") {
      const target = ROWS[ROWS.indexOf(row) + (key === "ArrowUp" ? -1 : 1)];
      if (!target) return;
      if (target === "pool") place(slug, null);
      else place(slug, target, rows[target][i] ?? null);
    } else {
      if (row === "pool") return; // le non classificate non si riordinano
      if (key === "ArrowLeft" && i > 0) place(slug, row, list[i - 1]);
      else if (key === "ArrowRight" && i < list.length - 1) place(slug, row, list[i + 2] ?? null);
      else if (key === "Home" && i > 0) place(slug, row, list[0]);
      else if (key === "End" && i < list.length - 1) place(slug, row, null);
      else return;
    }
    focusLater(slug, true);
  }

  function onCardKey(e: ReactKeyboardEvent<HTMLElement>, slug: string, row: Row) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const key = e.key;
    if (key === "Enter" || key === " ") {
      e.preventDefault();
      activate(slug, row);
      return;
    }
    const tier = TIERS.find((t) => t === key.toUpperCase());
    if (tier) {
      e.preventDefault();
      assign(slug, tier, true);
      return;
    }
    if (key === "Delete" || key === "Backspace") {
      e.preventDefault();
      assign(slug, null, true);
      return;
    }
    if (!ARROWS.includes(key)) return;
    e.preventDefault();
    if (held?.slug === slug) moveHeld(slug, row, key);
    else moveFocus(slug, row, key);
  }

  /* --- drag and drop (computer) --- */

  function onDragStart(e: ReactDragEvent<HTMLElement>, slug: string) {
    e.dataTransfer.effectAllowed = "move";
    try {
      // Firefox non comincia il trascinamento senza dati; il nome, se cade in un campo di testo, è innocuo
      e.dataTransfer.setData("text/plain", nameOf(slug));
    } catch {
      /* dati non impostabili: il trascinamento prosegue con lo stato di React */
    }
    setDragging(slug);
    setHeld(null);
    setActive(slug);
  }

  function onDragEnd() {
    setDragging(null);
    setHint(null);
  }

  function onRowDragOver(e: ReactDragEvent<HTMLElement>, row: Row) {
    if (!dragging) return; // file o testo trascinati da fuori: non ci riguardano
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    let before: string | null = null;
    if (row !== "pool") {
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-slug]") : null;
      const over = el?.dataset.slug;
      const list = rows[row];
      if (el && over && list.includes(over)) {
        const r = el.getBoundingClientRect();
        before = e.clientX < r.left + r.width / 2 ? over : (list[list.indexOf(over) + 1] ?? null);
      } else if (hint?.row === row) {
        return; // nello spazio fra due carte si tiene l'ultimo segno, senza farlo saltare in fondo
      }
    }
    if (hint?.row !== row || hint.before !== before) setHint({ row, before });
  }

  function onRowDragLeave(e: ReactDragEvent<HTMLElement>, row: Row) {
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
    setHint((h) => (h?.row === row ? null : h));
  }

  function onRowDrop(e: ReactDragEvent<HTMLElement>, row: Row) {
    if (!dragging) return;
    e.preventDefault();
    const slug = dragging;
    const before = hint?.row === row ? hint.before : null;
    setDragging(null);
    setHint(null);
    place(slug, row === "pool" ? null : row, before);
  }

  /** tocco su una fascia (sulla lettera o nello spazio libero) con una carta in mano: la carta va in fondo alla fascia */
  function onRowClick(e: ReactMouseEvent<HTMLElement>, row: Row) {
    if (!held) return;
    // il tocco su una carta lo gestisce la carta; quello sulla ricerca o su un tasto non sposta nulla
    if (e.target instanceof Element && e.target.closest("[data-slug], input, button, a, label")) return;
    assign(held.slug, row === "pool" ? null : row, false);
  }

  /* --- schede, titolo, condivisione --- */

  function switchKind(k: TierKind) {
    if (k === kind) return;
    setKind(k);
    setHeld(null);
    setActive(null);
    setHint(null);
    setConfirmReset(false);
    setFallback(null);
    setQ("");
    writeItem(TAB_KEY, k);
  }

  function onTabKey(e: ReactKeyboardEvent<HTMLButtonElement>, k: TierKind) {
    const i = TIER_KINDS.indexOf(k);
    let next: TierKind;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") next = TIER_KINDS[(i + (e.key === "ArrowRight" ? 1 : -1) + TIER_KINDS.length) % TIER_KINDS.length];
    else if (e.key === "Home") next = TIER_KINDS[0];
    else if (e.key === "End") next = TIER_KINDS[TIER_KINDS.length - 1];
    else return;
    e.preventDefault();
    switchKind(next);
    document.getElementById(`tier-tab-${next}`)?.focus();
  }

  /* Il testo copiato chiude col link che apre QUESTA lista (non la pagina vuota del maker): chi lo legge su Discord la apre */
  const shareText = (what: "link" | "text") => {
    const link = `${shareBase}#${encodeTierCode(kind, board)}`;
    return what === "link"
      ? link
      : tierListText(board, (s) => bySlug.get(s), cleanTitle(board.title) || fmt(labels.textHeading, { kind: kindLabel(kind) }), fmt(labels.textFooter, { url: link }));
  };

  /**
   * "Salva nel profilo": manda il codice TL1 alla Server Action, che lo rilegge, lo ripulisce e lo salva al posto
   * della tier list che l'utente aveva per questa scheda (una per utente e per tipo). Chi non è entrato passa
   * dall'accesso e torna qui: la lista sta nel browser e nel link, quindi non si perde.
   */
  function save() {
    const code = encodeTierCode(kind, board);
    if (!canShare) return;
    if (loggedIn === false && supabaseEnabled) {
      // navigazione completa e non router.push: al ritorno dall'accesso la pagina deve rileggere l'hash con la lista
      const next = encodeURIComponent(`${window.location.pathname}#${code}`);
      const loginUrl = ["", locale, `login?next=${next}`].join("/");
      window.location.assign(loginUrl);
      return;
    }
    startSave(async () => {
      const fd = new FormData();
      fd.set("code", code);
      fd.set("title", cleanTitle(board.title));
      fd.set("locale", locale);
      let r: TierActionState;
      try {
        r = await saveTierList({}, fd);
      } catch {
        r = { error: "db" };
      }
      setSaveResult({ ...r, code });
      if (r.ok) say(labels.savedToProfile);
    });
  }
  const savedShown = saveResult && saveResult.code === encodeTierCode(kind, board) ? saveResult : null;

  async function copy(what: "link" | "text") {
    try {
      await navigator.clipboard.writeText(shareText(what));
    } catch {
      setFallback(what);
      return;
    }
    setFallback(null);
    setCopied(what);
    say(what === "link" ? labels.linkCopied : labels.textCopied);
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(null), 2500);
  }

  function doReset() {
    update(kind, () => emptyBoard());
    setHeld(null);
    setConfirmReset(false);
    setSharedKind(null);
    setFallback(null);
    say(labels.resetDone);
    document.getElementById(`tier-tab-${kind}`)?.focus();
  }

  function restoreBackup() {
    const saved = decodeTierCode(readItem(backupKey(kind)) ?? "", known);
    if (saved?.kind === kind) update(kind, () => saved.board);
    writeItem(backupKey(kind), null);
    setBackups((b) => ({ ...b, [kind]: false }));
    setSharedKind(null);
    setHeld(null);
    say(labels.restored);
    // il riquadro col tasto sparisce: il focus va sulla scheda, non si perde in cima alla pagina
    document.getElementById(`tier-tab-${kind}`)?.focus();
  }

  /** "Tieni questa": la lista di prima si scarta e il riquadro sparisce (altrimenti resterebbe a ogni visita) */
  function discardBackup() {
    writeItem(backupKey(kind), null);
    setBackups((b) => ({ ...b, [kind]: false }));
    setSharedKind(null);
    document.getElementById(`tier-tab-${kind}`)?.focus();
  }

  /* --- disegno --- */

  function renderCard(slug: string, row: Row, index: number, list: string[]) {
    const c = bySlug.get(slug);
    if (!c) return null;
    const isHeld = held?.slug === slug;
    const markBefore = dragging !== null && hint?.row === row && hint.before === slug;
    const markAfter = dragging !== null && row !== "pool" && hint?.row === row && hint.before === null && index === list.length - 1;
    return (
      <li key={slug} className="flex">
        <span className={`deck-card-wrap ${hasPeek(c) ? "has-peek" : ""}`}>
          <div
            ref={(el) => {
              if (el) cardEls.current.set(slug, el);
              else cardEls.current.delete(slug);
            }}
            role="button"
            tabIndex={slug === tabStop ? 0 : -1}
            aria-pressed={isHeld}
            aria-describedby="tier-help"
            data-slug={slug}
            draggable
            onDragStart={(e) => onDragStart(e, slug)}
            onDragEnd={onDragEnd}
            onClick={() => {
              // una carta presa con un clic porta il focus sulla barra in basso (vedi l'effetto su `held`)
              if (!held || (row === "pool" && held.slug !== slug && rowOf(held.slug) === "pool")) pendingBarFocus.current = true;
              activate(slug, row);
            }}
            onKeyDown={(e) => onCardKey(e, slug, row)}
            onFocus={() => setActive(slug)}
            /* Con i colori forzati di Windows ombre e fondi spariscono: la carta in mano ha un contorno e il segno
               di caduta diventa un bordo (i colori li decide il sistema). */
            className={`flex w-16 cursor-grab select-none flex-col items-center gap-1 rounded-lg p-1 transition-colors [-webkit-touch-callout:none] active:cursor-grabbing sm:w-[76px] lg:w-[88px] ${
              isHeld ? "bg-mint/20 ring-2 ring-mint forced-colors:outline-2 forced-colors:outline-offset-2" : "hover:bg-night-3/70"
            } ${dragging === slug ? "opacity-40" : ""} ${
              markBefore
                ? "shadow-[-5px_0_0_0_var(--color-mint)] forced-colors:border-l-4"
                : markAfter
                  ? "shadow-[5px_0_0_0_var(--color-mint)] forced-colors:border-r-4"
                  : ""
            }`}
          >
            <span className={`deck-card w-full ${c.legendary ? "is-legendary" : ""}`}>
              {c.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.thumb} alt="" width={160} height={230} loading="lazy" decoding="async" draggable={false} />
              ) : (
                <span className="deck-card-initials">{initials(c.name)}</span>
              )}
              {/* il costo resta sempre visibile sulla carta, come in partita; ai lettori di schermo lo dice il testo dopo il nome */}
              {c.mana !== undefined ? (
                <span className="deck-card-mana" aria-hidden="true">
                  {c.mana}
                </span>
              ) : null}
            </span>
            <span className="line-clamp-2 w-full text-center font-display text-[10px] font-bold leading-tight text-sky wrap-anywhere sm:text-[11px] lg:text-xs">
              {c.legendary ? <span className="legendary-star" aria-hidden="true">★</span> : null}
              {c.name}
              {c.legendary ? <span className="sr-only"> ({labels.legendary})</span> : null}
              {c.mana !== undefined ? (
                <span className="sr-only">
                  , {labels.mana} {c.mana}
                </span>
              ) : null}
            </span>
          </div>
          <CardPeek card={c} />
        </span>
      </li>
    );
  }

  const canShare = ranked > 0;
  const heldName = held ? nameOf(held.slug) : "";

  return (
    // durante il trascinamento le anteprime al passaggio del mouse si spengono: coprirebbero le fasce
    <div className={`${dragging ? "[&_.deck-peek]:hidden" : ""} ${held ? "pb-32 sm:pb-24" : ""}`}>
      {/* Sul telefono le due schede stanno affiancate a metà larghezza, con il contatore sotto il nome: in fila
          andavano su due righe. */}
      <div role="tablist" aria-label={labels.tabsLabel} className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {TIER_KINDS.map((k) => {
          const n = rankedCount(boards[k]);
          const total = pools[k].length;
          return (
            <button
              key={k}
              id={`tier-tab-${k}`}
              type="button"
              role="tab"
              aria-selected={kind === k}
              aria-controls="tier-panel"
              tabIndex={kind === k ? 0 : -1}
              onClick={() => switchKind(k)}
              onKeyDown={(e) => onTabKey(e, k)}
              className={`btn btn-choice max-sm:flex-col max-sm:justify-center max-sm:gap-0 max-sm:rounded-2xl max-sm:px-2 ${kind === k ? "is-on" : ""}`}
            >
              {kindLabel(k)}
              <span className="font-mono text-xs" aria-hidden="true">
                {n}/{total}
              </span>
              {/* lo spazio separa il nome della scheda dal conteggio nel nome letto ("Leggendarie 0 di 11 classificate") */}{" "}
              <span className="sr-only">{fmt(labels.rankedOf, { n, total })}</span>
            </button>
          );
        })}
      </div>

      <div id="tier-panel" role="tabpanel" aria-labelledby={`tier-tab-${kind}`} className="mt-4">
        {/* Titolo e tasti in cima: con 111 carte base le non classificate sono lunghe, e si condivide senza scendere */}
        <div className="card-night grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <label htmlFor="tier-title" className="kicker text-pale-muted">
              {labels.titleLabel}
            </label>
            <input
              id="tier-title"
              value={board.title}
              maxLength={TITLE_MAX}
              onChange={(e) => {
                const title = e.target.value.replace(/\p{Cc}/gu, "").slice(0, TITLE_MAX);
                update(kind, (b) => ({ ...b, title }));
              }}
              placeholder={labels.titlePlaceholder}
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale placeholder:text-chalk-muted"
            />
          </div>
          <div className="min-w-0">
            <h2 className="sr-only">{labels.actions}</h2>
            {/* Chiavi esplicite: la conferma e i tasti sono due blocchi diversi, non lo stesso nodo riusato da React.
                Aprendo la conferma il focus va su "Annulla", che porta la domanda (aria-describedby), così la si sente. */}
            {confirmReset ? (
              <div key="confirm" role="group" aria-label={labels.reset} className="flex flex-wrap items-center gap-2">
                <span id="tier-reset-q" className="text-sm font-bold text-pale">
                  {labels.resetConfirm}
                </span>
                <button type="button" onClick={doReset} className="btn btn-danger text-xs">
                  {labels.resetYes}
                </button>
                <button
                  ref={resetCancelRef}
                  type="button"
                  aria-describedby="tier-reset-q"
                  onClick={() => {
                    pendingResetFocus.current = "reset";
                    setConfirmReset(false);
                  }}
                  className="btn btn-ghost text-xs"
                >
                  {labels.cancel}
                </button>
              </div>
            ) : (
              // sul telefono uno sotto l'altro a tutta larghezza: affiancati, "Copia come testo" andava su tre righe
              <div key="actions" className="flex flex-wrap items-center gap-2">
                {/* Salvare la propria tier list nel profilo è l'azione che ora conta di più (23/09/2026): è
                    quella che la fa vivere oltre questo browser e che alimenta la tier list della community. */}
                <button type="button" onClick={save} disabled={!canShare || saving} className="btn btn-primary whitespace-nowrap max-sm:w-full">
                  {loggedIn === false ? (
                    <>
                      <span aria-hidden="true">🔒</span>
                      <span className="sr-only">{labels.loginRequired}. </span>
                    </>
                  ) : null}
                  {saving ? labels.saving : savedShown?.ok ? `✓ ${labels.savedToProfile}` : labels.save}
                </button>
                <button type="button" onClick={() => copy("link")} disabled={!canShare} className="btn btn-ink whitespace-nowrap max-sm:w-full max-sm:justify-center">
                  {copied === "link" ? `✓ ${labels.linkCopied}` : labels.copyLink}
                </button>
                <button type="button" onClick={() => copy("text")} disabled={!canShare} className="btn btn-ink whitespace-nowrap max-sm:w-full max-sm:justify-center">
                  {copied === "text" ? `✓ ${labels.textCopied}` : labels.copyText}
                </button>
                <button
                  ref={resetRef}
                  type="button"
                  onClick={() => {
                    pendingResetFocus.current = "cancel";
                    setConfirmReset(true);
                  }}
                  disabled={isEmptyBoard(board)}
                  className="btn btn-ghost whitespace-nowrap max-sm:w-full max-sm:justify-center"
                >
                  {labels.reset}
                </button>
              </div>
            )}
          </div>
          <div className="min-w-0 lg:col-span-2">
            {!canShare ? <p className="text-xs text-pale-muted">{labels.shareHint}</p> : null}
            {hydrated && !isEmptyBoard(board) ? <p className="text-xs text-pale-muted">{storageOk ? `✓ ${labels.autosaved}` : labels.storageBlocked}</p> : null}
            {/* esito del salvataggio nel profilo */}
            <div aria-live="polite">
              {savedShown ? (
                savedShown.ok ? (
                  <p className="alert-good mt-3">
                    {labels.savedToProfile}{" "}
                    <Link href={savedShown.href ?? `/${locale}/account#tierlists`} className="link-mint whitespace-nowrap">
                      {labels.viewProfile} →
                    </Link>
                  </p>
                ) : (
                  <p className="alert-bad mt-3">{labels.saveErrors[savedShown.error ?? "db"] ?? labels.saveErrors.db}</p>
                )
              ) : loggedIn === false && canShare ? (
                <p className="mt-3 text-xs text-pale">{labels.saveHint}</p>
              ) : null}
            </div>
            {fallback ? (
              <div className="mt-2">
                <label htmlFor="tier-fallback" className="text-xs font-bold text-pale">
                  {labels.copyFallback}
                </label>
                <textarea
                  id="tier-fallback"
                  ref={fallbackRef}
                  readOnly
                  value={shareText(fallback)}
                  rows={fallback === "text" ? 8 : 3}
                  onFocus={(e) => e.currentTarget.select()}
                  className="mt-1 w-full resize-none rounded-lg border border-felt-line bg-felt-deep px-3 py-2 font-mono text-xs text-pale"
                />
              </div>
            ) : null}
          </div>
        </div>

        {sharedKind === kind || backups[kind] ? (
          <div className="felt-panel-mint mt-4 flex flex-wrap items-center gap-3 p-4 text-sm text-chalk">
            {sharedKind === kind ? <p className="min-w-0 flex-1 basis-64">{labels.sharedOpened}</p> : null}
            {backups[kind] ? (
              <span className="flex flex-wrap gap-2">
                <button type="button" onClick={restoreBackup} className="btn btn-ghost text-xs">
                  {labels.restoreMine}
                </button>
                <button type="button" onClick={discardBackup} className="btn btn-choice text-xs">
                  {labels.keepThis}
                </button>
              </span>
            ) : null}
          </div>
        ) : null}

        <p id="tier-help" className="mt-5 max-w-4xl text-sm text-chalk-muted">
          {labels.help}
        </p>

        <h2 className="sr-only">{cleanTitle(board.title) || fmt(labels.textHeading, { kind: kindLabel(kind) })}</h2>
        {/* Niente overflow-hidden sul riquadro: taglierebbe l'anteprima delle carte che si apre sopra la carta.
            Gli angoli arrotondati li portano le celle ai bordi (11 px = 12 px del riquadro meno il bordo). */}
        <div className="mt-4 rounded-xl border border-felt-line">
          {TIERS.map((t, i) => (
            <div
              key={t}
              className={`grid grid-cols-[48px_minmax(0,1fr)] sm:grid-cols-[72px_minmax(0,1fr)] ${i < TIERS.length - 1 ? "border-b border-felt-line/70" : ""} ${held ? "cursor-pointer" : ""}`}
              onDragOver={(e) => onRowDragOver(e, t)}
              onDragLeave={(e) => onRowDragLeave(e, t)}
              onDrop={(e) => onRowDrop(e, t)}
              onClick={(e) => onRowClick(e, t)}
            >
              <div
                aria-hidden="true"
                className={`flex items-center justify-center font-display text-2xl font-extrabold sm:text-3xl ${tierTone[t]} ${i === 0 ? "rounded-tl-[11px]" : ""} ${i === TIERS.length - 1 ? "rounded-bl-[11px]" : ""}`}
              >
                {t}
              </div>
              <ul
                aria-label={fmt(labels.tierRow, { tier: t })}
                className={`flex min-h-[6.5rem] min-w-0 flex-wrap content-start items-start gap-1 p-2 transition-colors sm:gap-1.5 sm:p-3 ${hint?.row === t ? "bg-mint/10" : "bg-felt-deep/60"} ${
                  i === 0 ? "rounded-tr-[11px]" : ""
                } ${i === TIERS.length - 1 ? "rounded-br-[11px]" : ""}`}
              >
                {visible[t].map((s, idx, list) => renderCard(s, t, idx, list))}
                {visible[t].length ? null : (
                  <li aria-hidden="true" className="self-center px-1 font-mono text-xs text-chalk-muted">
                    {labels.emptyTier}
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Le non classificate: il mazzo da cui si parte. Anche qui si lascia cadere una carta per toglierla dalle fasce. */}
        <section
          aria-labelledby="tier-pool-title"
          className={`felt-panel mt-6 p-3 transition-colors sm:p-4 ${hint?.row === "pool" ? "bg-mint/10" : ""} ${held ? "cursor-pointer" : ""}`}
          onDragOver={(e) => onRowDragOver(e, "pool")}
          onDragLeave={(e) => onRowDragLeave(e, "pool")}
          onDrop={(e) => onRowDrop(e, "pool")}
          onClick={(e) => onRowClick(e, "pool")}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="tier-pool-title" className="t-section text-lg sm:text-xl">
              {labels.unranked} <span className="font-mono text-sm font-normal text-pale-muted">{rows.pool.length}</span>
            </h2>
            {rows.pool.length > 12 ? (
              <input
                id="tier-pool-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={labels.searchPool}
                aria-label={labels.searchPool}
                autoComplete="off"
                /* cornice sky su night come il campo del titolo (9,4:1): la felt-line sul feltro non si vedeva (1,5:1) */
                className="w-full rounded-lg border border-sky bg-night px-3 py-2 text-sm text-chalk placeholder:text-chalk-muted sm:w-72"
              />
            ) : null}
          </div>
          <ul aria-labelledby="tier-pool-title" className="mt-3 flex min-h-[6.5rem] min-w-0 flex-wrap content-start items-start gap-1 sm:gap-1.5">
            {visible.pool.map((s, idx, list) => renderCard(s, "pool", idx, list))}
            {rows.pool.length === 0 ? (
              <li className="self-center text-sm font-bold text-mint">{labels.allRanked}</li>
            ) : visible.pool.length === 0 ? (
              <li className="self-center text-sm text-chalk-muted">{labels.noMatch}</li>
            ) : null}
          </ul>
        </section>
      </div>

      {/* Annunci per i lettori di schermo: cambi di fascia, selezione, copia */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {live.text ? <p key={live.n}>{live.text}</p> : null}
      </div>

      {/* Carta selezionata: le fasce a portata di pollice, senza risalire la pagina (sul telefono le non classificate
          stanno molto sotto le fasce). Resta anche sul computer: è l'alternativa al trascinamento con i tasti veri. */}
      {held ? (
        <div role="region" aria-label={fmt(labels.barLabel, { card: heldName })} className="fixed inset-x-0 bottom-0 z-50 border-t-[3px] border-sky bg-night-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_30px_-12px_rgba(14,7,31,0.9)]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
            <p className="w-full min-w-0 truncate text-sm font-bold text-pale sm:w-auto sm:max-w-xs">{fmt(labels.barLabel, { card: heldName })}</p>
            <div className="flex gap-1.5">
              {TIERS.map((t, i) => (
                <button
                  key={t}
                  ref={i === 0 ? barFirstRef : undefined}
                  type="button"
                  onClick={() => held && assign(held.slug, t, false)}
                  aria-label={fmt(labels.moveTo, { card: heldName, tier: t })}
                  className={`h-11 w-11 rounded-lg font-display text-lg font-extrabold ${tierTone[t]}`}
                >
                  {t}
                </button>
              ))}
            </div>
            {rowOf(held.slug) !== "pool" ? (
              <button type="button" onClick={() => assign(held.slug, null, false)} className="btn btn-choice text-xs">
                {labels.unranked}
              </button>
            ) : null}
            <button type="button" onClick={cancelHold} className="btn btn-ghost text-xs">
              {labels.cancel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
