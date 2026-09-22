"use client";

import Link from "next/link";
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, useTransition } from "react";
import { initials } from "@/lib/cardArt";
import { RULES, emptyDeck, isComplete, manaCurve, sharedCards, differentCards, validateConquest, validateDeck, type BuilderCard, type DeckState } from "@/lib/deckrules";
import { GAME_PREFIX, OM_PREFIX, baseKey, decodeGameCode, decodeOmCode, encodeGameCode, encodeOmCode, parseTextList, toTextList } from "@/lib/deckcode";
import { BUILDER_STORAGE_KEY, PENDING_PUBLISH_KEY } from "@/lib/community/types";
import { saveDeckPrivate, type ActionState } from "@/lib/community/actions";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { useMounted } from "@/lib/useMounted";
import { CardPeek, hasPeek } from "./CardPeek";

type Issues = {
  missingLegendary: string;
  tooFewCards: string;
  tooManyCards: string;
  duplicateCard: string;
  hasCustom: string;
  duplicateLegendary: string;
  tooSimilar: string;
};

export type BuilderLabels = {
  deckTitle: string;
  modeSingle: string;
  modeTournament: string;
  deckName: string;
  deckNamePlaceholder: string;
  legendarySlot: string;
  pickLegendary: string;
  slots: string;
  slotsHint: string;
  /** riga contatore sul telefono al posto dei segnaposto vuoti: "{n}" */
  slotsLeft: string;
  pool: string;
  poolHint: string;
  searchPool: string;
  filterType: string;
  filterCost: string;
  all: string;
  cost: string;
  remove: string;
  curve: string;
  valid: string;
  invalid: string;
  issues: Issues;
  customTitle: string;
  customHint: string;
  customName: string;
  customCost: string;
  customLegendary: string;
  customAdd: string;
  /** titolo (solo per lettori di schermo) del blocco dei quattro tasti */
  actions: string;
  /* importazione */
  importQuestion: string;
  importPlaceholder: string;
  importTitle: string;
  importOk: string;
  importUnknown: string;
  importError: string;
  teachTitle: string;
  teachHint: string;
  teachSend: string;
  restored: string;
  undoLink: string;
  /* i quattro tasti: Pubblica sul sito, Salva privato, Condividi, Svuota mazzo */
  publish: string;
  /** sotto i tasti quando il mazzo non è completo: pubblicare e salvare nel profilo richiedono Leggendaria + 12 carte */
  completeHint: string;
  publishLoginHint: string;
  savePrivate: string;
  savingPrivate: string;
  savedPrivate: string;
  saved: string;
  viewProfile: string;
  savePrivateErrors: Record<string, string>;
  share: string;
  shareTitle: string;
  shareLink: string;
  shareGame: string;
  shareOm: string;
  shareText: string;
  shareNative: string;
  copy: string;
  copied: string;
  close: string;
  exportGameMissing: string;
  clear: string;
  clearConfirm: string;
  clearYes: string;
  cancel: string;
  autosaved: string;
  /* barra in basso sul telefono */
  viewDeck: string;
  summaryBar: string;
  /* Conquest */
  tournamentTitle: string;
  tournamentHint: string;
  minDifferent: string;
  diffTable: string;
  shared: string;
  deckLabel: string;
  ok: string;
  typeUnit: string;
  typeSpell: string;
  spell: string;
};

type Persisted = { mode: "single" | "tournament"; active: number; decks: DeckState[]; keyMap: Record<string, string> };

/** Esito di "Salva privato", legato al codice del mazzo salvato: se il mazzo cambia, il messaggio sparisce. */
type SaveResult = { code: string; ok: true; href: string } | { code: string; ok: false; error: string };

const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

/** Salvataggio del browser: null se manca, se è illeggibile o se lo storage è bloccato (finestra privata). */
function readSaved(key: string): Persisted | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const p = JSON.parse(raw) as Persisted | null;
    return p && typeof p === "object" ? p : null;
  } catch {
    return null;
  }
}

const isEmptyDeck = (d: Partial<DeckState> | null | undefined) => !d || (!d.legendary && !d.cards?.length);
const sameDeck = (a: Partial<DeckState>, b: DeckState) => encodeOmCode({ ...emptyDeck(), ...a }) === encodeOmCode(b);

/** Regole imposte da un torneo (Tournament Organizer): modalità, numero di mazzi e carte diverse non modificabili, memoria separata. */
export type BuilderPreset = { mode: "single" | "tournament"; deckCount: number; minDifferent: number; storageKey: string };
export type SubmitLabels = { submit: string; submitting: string; saved: string; incomplete: string; errors: Record<string, string> };

export function DeckBuilder({
  pool,
  labels,
  contactEmail,
  shareBase,
  publishHref,
  locale: localeProp,
  preset,
  onSubmit,
  submitLabels,
}: {
  pool: BuilderCard[];
  labels: BuilderLabels;
  contactEmail: string;
  shareBase: string;
  /** pagina "Pubblica sul sito": riceve il mazzo nell'hash (#OM1…) */
  publishHref: string;
  /** lingua della pagina, per "Salva privato" e per l'accesso; se manca si ricava da `publishHref` (/it/…) */
  locale?: string;
  preset?: BuilderPreset;
  /** consegna dei codici al torneo (Server Action): sostituisce il bottone "Pubblica" */
  onSubmit?: (codes: string[]) => Promise<{ error?: string; ok?: boolean }>;
  submitLabels?: SubmitLabels;
}) {
  const count = preset?.deckCount ?? 3;
  const locked = Boolean(preset);
  const storageKey = preset?.storageKey ?? BUILDER_STORAGE_KEY;
  /** copia dei mazzi del browser quando un link li sostituisce: "Torna al mazzo di prima" */
  const backupKey = `${storageKey}.prev`;
  const locale = localeProp ?? (publishHref.split("/")[1] || "en");
  const indices = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  const [mode, setMode] = useState<"single" | "tournament">(preset?.mode ?? "single");
  const [active, setActive] = useState(0);
  const [decks, setDecks] = useState<DeckState[]>(() => Array.from({ length: count }, () => emptyDeck()));
  const [keyMap, setKeyMap] = useState<Record<string, string>>({});
  const [minDifferent, setMinDifferent] = useState<number>(preset?.minDifferent ?? RULES.conquestMinDifferent);
  const [submitState, setSubmitState] = useState<"idle" | "saved" | string>("idle");
  const [submitting, startSubmit] = useTransition();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "unit" | "spell">("all");
  const [costFilter, setCostFilter] = useState<"all" | string>("all");
  const [importText, setImportText] = useState("");
  /** messaggio sotto la casella "Importa": `bad` per gli errori (codice illeggibile, nessuna carta riconosciuta) */
  const [notice, setNotice] = useState<{ text: string; bad: boolean } | null>(null);
  const [unknownKeys, setUnknownKeys] = useState<string[]>([]);
  const [teach, setTeach] = useState<Record<string, string>>({});
  const [customName, setCustomName] = useState("");
  const [customCost, setCustomCost] = useState("");
  const [customLegendary, setCustomLegendary] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [gameCode, setGameCode] = useState<{ sig: string; code: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [saving, startSave] = useTransition();
  const restoredOnce = useRef(false);
  /** modifiche non ancora scritte nel browser: senza, niente scrittura (neanche alla chiusura della scheda) */
  const dirty = useRef(false);
  /** primo giro del salvataggio automatico dopo il ripristino: lo stato è quello appena letto, non una modifica */
  const firstAutosave = useRef(true);
  /** ritorno dall'accesso partito da "Salva privato": il salvataggio riparte da solo */
  const pendingSave = useRef(false);
  /** mazzo privato aperto da /account (?draft=): id della riga e casella in cui si è aperto */
  const draftLink = useRef<{ id: string; slot: number } | null>(null);
  const shareBtnRef = useRef<HTMLButtonElement>(null);
  const sharePanelRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();

  const deck = decks[active];

  /* Accesso: pubblicare e salvare nel profilo richiedono un account; builder, link e codici restano liberi. */
  const [loggedIn, setLoggedIn] = useState<boolean | null>(supabaseEnabled ? null : false);
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

  const lookup = useCallback(
    (slug: string): BuilderCard | undefined => pool.find((c) => c.slug === slug) ?? decks.flatMap((d) => d.customCards).find((c) => c.slug === slug),
    [pool, decks],
  );

  const applySaved = useCallback(
    (p: Persisted, activeOverride?: number) => {
      if (Array.isArray(p.decks) && p.decks.length) setDecks(Array.from({ length: count }, (_, i) => ({ ...emptyDeck(), ...(p.decks[i] ?? {}) })));
      if (!locked && (p.mode === "single" || p.mode === "tournament")) setMode(p.mode);
      const a = activeOverride ?? p.active;
      if (typeof a === "number") setActive(Math.min(count - 1, Math.max(0, a)));
      if (p.keyMap && typeof p.keyMap === "object") setKeyMap(p.keyMap);
    },
    [count, locked],
  );

  /* --- ripristino da link (#OM1… o ?deck=OM1…) o dal browser: una volta, dopo l'idratazione (sul server non c'è storage).
         Il ref evita il secondo giro dello Strict Mode, che dopo la pulizia dell'indirizzo rimetterebbe il vecchio mazzo. --- */
  /* eslint-disable react-hooks/set-state-in-effect -- lettura una tantum di indirizzo e localStorage al montaggio */
  useEffect(() => {
    if (restoredOnce.current) return;
    restoredOnce.current = true;
    const saved = readSaved(storageKey);
    // la copia lasciata da un link aperto in una visita precedente resta raggiungibile finché non la si usa o la si scarta
    try {
      if (localStorage.getItem(backupKey)) setHasBackup(true);
    } catch {
      /* storage non disponibile */
    }

    let linked: DeckState | null = null;
    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const hash = url.hash.slice(1);
      const fromHash = hash.startsWith(OM_PREFIX);
      const code = fromHash ? hash : (params.get("deck") ?? "");
      linked = code.startsWith(OM_PREFIX) ? decodeOmCode(code) : null;
      if (params.get("intent") === "save") pendingSave.current = true;
      // mazzo privato aperto da /account (?draft=<id>): "Salva privato" aggiorna quello invece di crearne un altro
      const draft = params.get("draft") ?? "";
      if (linked && /^[0-9a-f-]{36}$/i.test(draft)) draftLink.current = { id: draft, slot: 0 };
      // Il mazzo del link passa nello stato (e nel salvataggio automatico): lo si toglie dall'indirizzo, così un
      // ricaricamento non rimette la versione del link sopra le modifiche fatte nel frattempo.
      if (fromHash || params.has("deck") || params.has("intent") || params.has("draft")) {
        params.delete("deck");
        params.delete("intent");
        params.delete("draft");
        const qs = params.toString();
        window.history.replaceState(null, "", `${url.pathname}${qs ? `?${qs}` : ""}${fromHash ? "" : url.hash}`);
      }
    } catch {
      /* indirizzo non leggibile: si prosegue con il salvataggio del browser */
    }

    if (linked) {
      // lo stato che arriva da un link non è ancora nel browser: il salvataggio automatico lo scrive subito
      dirty.current = true;
      const prevDecks = Array.isArray(saved?.decks) ? saved.decks : [];
      // Il mazzo del link è già tra quelli del browser (per esempio al ritorno dall'accesso): si riapre quello.
      const already = prevDecks.findIndex((d) => !isEmptyDeck(d) && sameDeck(d, linked));
      if (saved && already >= 0) {
        if (draftLink.current) draftLink.current.slot = Math.min(count - 1, already);
        applySaved(saved, already);
        setAutoSaved(true);
        setHydrated(true);
        return;
      }
      // Il link apre il mazzo solo nella casella attiva: le altre (i mazzi B e C del Conquest) restano intatte.
      const slot = Math.min(count - 1, Math.max(0, typeof saved?.active === "number" ? saved.active : 0));
      if (draftLink.current) draftLink.current.slot = slot;
      // Se la casella sostituita non era vuota, se ne tiene una copia da ripristinare ("Torna al mazzo di prima").
      if (saved && !isEmptyDeck(prevDecks[slot])) {
        try {
          localStorage.setItem(backupKey, JSON.stringify(saved));
          setHasBackup(true);
        } catch {
          /* storage non disponibile */
        }
      }
      // le chiavi ufficiali insegnate dall'utente restano, anche quando il mazzo arriva da un link
      if (saved?.keyMap && typeof saved.keyMap === "object") setKeyMap(saved.keyMap);
      const base = Array.from({ length: count }, (_, i) => ({ ...emptyDeck(), ...(prevDecks[i] ?? {}) }));
      base[slot] = linked;
      setDecks(base);
      setActive(slot);
      if (!locked && (saved?.mode === "single" || saved?.mode === "tournament")) setMode(saved.mode);
      setNotice({ text: labels.restored, bad: false });
      setHydrated(true);
      return;
    }
    if (saved) {
      applySaved(saved);
      // i mazzi mostrati sono quelli del browser: sono già salvati
      if (Array.isArray(saved.decks) && saved.decks.some((d) => !isEmptyDeck(d))) setAutoSaved(true);
    }
    setHydrated(true);
  }, [labels.restored, storageKey, backupKey, count, locked, applySaved]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* --- salvataggio automatico nel browser (niente più tasto "Salva nel browser") ---
     TRAPPOLA 1: prima del ripristino lo stato è vuoto e salvarlo cancellerebbe i mazzi del browser, quindi
     niente scrittura finché `hydrated` è falso. `writeNow` legge lo stato aggiornato al momento dello scatto.
     TRAPPOLA 2 (verificata nella prova del 22/09): con il builder aperto in due schede, la scheda rimasta ferma
     riscriveva i suoi mazzi vecchi alla chiusura (pagehide) sopra quelli appena modificati nell'altra. Quindi si
     scrive solo se in questa scheda c'è una modifica non ancora salvata (`dirty`). */
  const writeNow = useEffectEvent(() => {
    if (!dirty.current) return;
    try {
      const cur: Persisted = { mode, active, decks, keyMap };
      localStorage.setItem(storageKey, JSON.stringify(cur));
      dirty.current = false;
      setAutoSaved(true);
    } catch {
      setAutoSaved(false);
    }
  });
  useEffect(() => {
    if (!hydrated) return;
    if (firstAutosave.current) {
      firstAutosave.current = false;
      // il giro del ripristino: si scrive solo se lo stato è arrivato da un link (il ripristino ha segnato `dirty`)
      if (!dirty.current) return;
    } else {
      dirty.current = true;
    }
    const t = window.setTimeout(() => writeNow(), 400);
    return () => window.clearTimeout(t);
  }, [hydrated, decks, mode, active, keyMap]);
  /* chiusura della scheda o cambio di pagina prima dei 400 ms: si scrive subito, se c'è qualcosa da scrivere */
  useEffect(() => {
    if (!hydrated) return;
    const flush = () => writeNow();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [hydrated]);

  const updateDeck = (fn: (d: DeckState) => DeckState) => {
    setDecks((prev) => prev.map((d, i) => (i === active ? fn(d) : d)));
  };

  /* --- pool filtrato --- */
  const visiblePool = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return pool
      .filter((c) => c.type !== "token")
      // scelta la Leggendaria, le altre spariscono dalla lista
      .filter((c) => !c.legendary || !deck.legendary || c.slug === deck.legendary)
      .filter((c) => (typeFilter === "all" ? true : c.type === typeFilter))
      .filter((c) => (costFilter === "all" ? true : costFilter === "8" ? (c.mana ?? 0) >= 8 : String(c.mana ?? "?") === costFilter))
      .filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.sagaLabel.toLowerCase().includes(needle))
      .sort((a, b) => Number(b.legendary) - Number(a.legendary) || (a.mana ?? 99) - (b.mana ?? 99) || a.name.localeCompare(b.name));
  }, [pool, q, typeFilter, costFilter, deck.legendary]);

  const addCard = (c: BuilderCard) => {
    updateDeck((d) => {
      if (c.legendary) return { ...d, legendary: c.slug };
      if (d.cards.includes(c.slug) || d.cards.length >= RULES.distinctCards) return d;
      return { ...d, cards: [...d.cards, c.slug] };
    });
  };
  const removeCard = (slug: string) => {
    updateDeck((d) => ({ ...d, legendary: d.legendary === slug ? null : d.legendary, cards: d.cards.filter((s) => s !== slug) }));
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    const slug = `custom:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const card: BuilderCard = { slug, name, type: "unit", legendary: customLegendary, mana: customCost ? Number(customCost) : undefined, sagaLabel: "custom", custom: true };
    updateDeck((d) => {
      const customCards = d.customCards.some((c) => c.slug === slug) ? d.customCards : [...d.customCards, card];
      if (card.legendary) return { ...d, customCards, legendary: slug };
      if (d.cards.includes(slug) || d.cards.length >= RULES.distinctCards) return { ...d, customCards };
      return { ...d, customCards, cards: [...d.cards, slug] };
    });
    setCustomName("");
    setCustomCost("");
    setCustomLegendary(false);
  };

  /* --- import --- */
  /** esito dell'importazione: quante carte riconosciute e quali no; senza nessuna carta riconosciuta è un errore */
  const importReport = (matched: number, unknown: string[]) => {
    const ok = fmt(labels.importOk, { n: matched });
    setNotice({ text: unknown.length ? `${ok} ${fmt(labels.importUnknown, { list: unknown.join(", ") })}` : ok, bad: matched === 0 });
  };
  const doImport = async () => {
    const text = importText.trim();
    setUnknownKeys([]);
    // la copia di "Torna al mazzo di prima" resta: l'importazione cambia solo la casella attiva
    if (!text) return;
    // un mazzo importato non è più il mazzo privato aperto da /account: "Salva privato" ne creerà uno nuovo
    if (draftLink.current?.slot === active) draftLink.current = null;
    if (text.includes(GAME_PREFIX)) {
      const res = await decodeGameCode(text);
      if ("error" in res) {
        setNotice({ text: labels.importError, bad: true });
        return;
      }
      const byKey = new Map<string, BuilderCard>();
      for (const c of pool) if (c.key) byKey.set(baseKey(c.key), c);
      for (const [k, slug] of Object.entries(keyMap)) {
        const c = pool.find((x) => x.slug === slug);
        if (c) byKey.set(baseKey(k), c);
      }
      const matched: BuilderCard[] = [];
      const unknown: string[] = [];
      for (const k of res.keys) {
        const c = byKey.get(baseKey(k));
        if (c) matched.push(c);
        else unknown.push(baseKey(k));
      }
      applyCards(matched);
      setUnknownKeys(unknown);
      if (matched.length) setImportText("");
      importReport(matched.length, unknown);
      return;
    }
    if (text.includes(OM_PREFIX)) {
      const d = decodeOmCode(text);
      if (!d) {
        setNotice({ text: labels.importError, bad: true });
        return;
      }
      updateDeck(() => d);
      setImportText("");
      setNotice({ text: fmt(labels.importOk, { n: d.cards.length + (d.legendary ? 1 : 0) }), bad: false });
      return;
    }
    const entries = parseTextList(text);
    const matched: BuilderCard[] = [];
    const unknown: string[] = [];
    for (const e of entries) {
      const c = pool.find((x) => x.name.toLowerCase() === e.name.toLowerCase());
      if (c) matched.push(c);
      else unknown.push(e.name);
    }
    applyCards(matched);
    if (matched.length) setImportText("");
    importReport(matched.length, unknown);
  };

  const applyCards = (cards: BuilderCard[]) => {
    if (cards.length === 0) return; // niente di riconosciuto: il mazzo resta com'è
    updateDeck((d) => {
      const legendary = cards.find((c) => c.legendary)?.slug ?? d.legendary;
      const base = Array.from(new Set(cards.filter((c) => !c.legendary).map((c) => c.slug))).slice(0, RULES.distinctCards);
      return { ...d, legendary, cards: base };
    });
  };

  /** "Torna al mazzo di prima": rimette i mazzi del browser che un link aveva sostituito. */
  const restoreBackup = () => {
    const p = readSaved(backupKey);
    if (p) applySaved(p);
    try {
      localStorage.removeItem(backupKey);
    } catch {
      /* ignore */
    }
    setHasBackup(false);
    setNotice(null);
  };
  /** Scarta la copia: il tasto "Torna al mazzo di prima" sparisce anche dalle visite successive. */
  const dropBackup = () => {
    try {
      localStorage.removeItem(backupKey);
    } catch {
      /* ignore */
    }
    setHasBackup(false);
  };

  /* --- stato del mazzo e codici --- */
  const omCode = encodeOmCode(deck);
  const shareLink = `${shareBase}#${omCode}`;
  const textList = toTextList(deck, lookup);
  const issues = validateDeck(deck);
  const complete = isComplete(deck);
  const deckEmpty = !deck.legendary && deck.cards.length === 0;
  const cardCount = (deck.legendary ? 1 : 0) + deck.cards.length * RULES.copiesPerCard;
  const freeSlots = Math.max(0, RULES.distinctCards - deck.cards.length);
  const curve = manaCurve(deck, lookup);
  const maxCurve = Math.max(1, ...curve);
  const conquestIssues = mode === "tournament" ? validateConquest(decks, minDifferent) : [];
  /* consegna al torneo: tutti i mazzi richiesti completi e regole Conquest rispettate */
  const submittable = mode === "tournament" ? decks.slice(0, count).every((d) => isComplete(d)) && conquestIssues.length === 0 : complete;

  /* codice del gioco: servono le chiavi ufficiali di tutte le carte (dal database o insegnate dall'utente) */
  const deckSlugs = [deck.legendary, ...deck.cards].filter(Boolean) as string[];
  const gameKeys = deckSlugs.map((s) => lookup(s)?.key ?? Object.entries(keyMap).find(([, v]) => v === s)?.[0]);
  const missingKeys = gameKeys.filter((k) => !k).length;
  const gameSig = deckSlugs.length && !missingKeys ? (gameKeys as string[]).join("|") : "";
  /* il codice del gioco ha un checksum asincrono: lo si calcola quando il pannello è aperto, così "Copia" resta
     sincrono (Safari rifiuta la scrittura negli appunti dopo un'attesa) */
  useEffect(() => {
    if (!shareOpen || !gameSig) return;
    let alive = true;
    encodeGameCode(gameSig.split("|"))
      .then((code) => {
        if (alive) setGameCode({ sig: gameSig, code });
      })
      .catch(() => {
        /* resta il messaggio senza codice */
      });
    return () => {
      alive = false;
    };
  }, [shareOpen, gameSig]);
  const gameCodeNow = gameCode && gameCode.sig === gameSig ? gameCode.code : null;

  /* pannello "Condividi": si chiude con Esc (il focus torna al tasto) e con un clic fuori */
  useEffect(() => {
    if (!shareOpen) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (sharePanelRef.current?.contains(t) || shareBtnRef.current?.contains(t)) return;
      setShareOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setShareOpen(false);
      shareBtnRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [shareOpen]);
  const canShare = mounted && typeof navigator !== "undefined" && typeof navigator.share === "function";
  const nativeShare = async () => {
    try {
      await navigator.share({ title: deck.name || "OriginsMeta", url: shareLink });
    } catch {
      /* condivisione annullata */
    }
  };

  /* --- accesso, "Pubblica sul sito" e "Salva privato" --- */
  const loginUrl = (next: string) => `/${locale}/login?next=${encodeURIComponent(next)}`;
  /* chi non è loggato passa dall'accesso e torna alla pubblicazione con il mazzo (?deck=…); il mazzo in attesa
     resta anche nel browser, dove il modulo di pubblicazione lo cerca comunque */
  const publishLoginHref = loginUrl(`${publishHref}?deck=${omCode}`);
  const rememberPending = () => {
    try {
      localStorage.setItem(PENDING_PUBLISH_KEY, omCode);
    } catch {
      /* ignore */
    }
  };

  const saveShown = saveResult && saveResult.code === omCode ? saveResult : null;
  const savedNow = Boolean(saveShown?.ok);
  /** Salva il mazzo attivo nel profilo, non pubblico (bozza in `community_decks`). Serve un mazzo completo, come per
   *  pubblicarlo; il nome può mancare (lo sceglie il server). `auto`: ripartenza dopo l'accesso, senza nuovi giri di login. */
  const savePrivate = (auto = false) => {
    if (!complete) return;
    const code = omCode;
    const name = deck.name.replace(/\s+/g, " ").trim();
    // Il mazzo sopravvive al giro dell'accesso perché è nell'indirizzo di ritorno (e nel salvataggio del browser).
    // In `?deck=` e non nell'hash, come per la pubblicazione: la query passa intatta per /auth/callback anche
    // quando il link via email si apre in un altro browser; il ripristino qui sopra legge entrambi.
    // mazzo privato aperto da /account: si aggiorna quello, se è ancora nella casella in cui si era aperto
    const draftId = draftLink.current && draftLink.current.slot === active ? draftLink.current.id : "";
    const toLogin = () => window.location.assign(loginUrl(`${window.location.pathname}?intent=save&deck=${code}${draftId ? `&draft=${draftId}` : ""}`));
    // Nel builder di un torneo niente giro dall'accesso: al ritorno il mazzo del link prenderebbe il posto di
    // uno dei mazzi del torneo. Lì si mostra l'errore "accedi", e l'accesso si fa dalla pagina del torneo.
    const canGoToLogin = !auto && !onSubmit;
    // senza Supabase configurato non c'è accesso: si lascia rispondere l'azione ("disabled")
    if (loggedIn === false && supabaseEnabled && canGoToLogin) {
      toLogin();
      return;
    }
    startSave(async () => {
      const fd = new FormData();
      fd.set("code", code);
      fd.set("name", name);
      fd.set("locale", locale);
      if (draftId) fd.set("draft", draftId);
      let r: ActionState;
      try {
        r = await saveDeckPrivate({}, fd);
      } catch {
        r = { error: "db" };
      }
      if (r.ok) {
        setSaveResult({ code, ok: true, href: r.href ?? `/${locale}/account#private` });
        return;
      }
      if (r.error === "notLoggedIn" && canGoToLogin) {
        toLogin();
        return;
      }
      setSaveResult({ code, ok: false, error: r.error ?? "db" });
    });
  };
  const saveAfterLogin = useEffectEvent(() => savePrivate(true));
  useEffect(() => {
    if (!hydrated || loggedIn !== true || !pendingSave.current) return;
    pendingSave.current = false;
    saveAfterLogin();
  }, [hydrated, loggedIn]);

  const submitDecks = () => {
    if (!onSubmit || !submitLabels) return;
    startSubmit(async () => {
      setSubmitState("idle");
      const codes = decks.slice(0, mode === "tournament" ? count : 1).map((d) => encodeOmCode(d));
      const r = await onSubmit(codes);
      setSubmitState(r.error ? (submitLabels.errors[r.error] ?? submitLabels.errors.db ?? r.error) : "saved");
    });
  };

  /** Tasto primario: consegna al torneo (Tournament Organizer) oppure "Pubblica sul sito". `compact` per la barra del telefono. */
  const primaryAction = (compact: boolean) => {
    const size = compact ? "shrink-0 px-4 py-2 text-xs" : "w-full justify-center";
    if (onSubmit && submitLabels) {
      return (
        <button
          type="button"
          className={`btn btn-primary ${size}`}
          disabled={submitting || !submittable}
          title={submittable ? undefined : submitLabels.incomplete}
          onClick={submitDecks}
        >
          {submitting ? submitLabels.submitting : submitLabels.submit}
        </button>
      );
    }
    // mazzo incompleto: stesso bottone, spento (lo stato disabilitato di .btn); sotto, la riga che dice che cosa manca
    if (!complete) {
      return (
        <button type="button" disabled aria-describedby={compact ? undefined : "builder-complete-hint"} className={`btn btn-primary ${size}`}>
          {labels.publish}
        </button>
      );
    }
    if (loggedIn === false) {
      return (
        <a className={`btn btn-primary ${size}`} href={publishLoginHref} onClick={rememberPending}>
          {labels.publish}
        </a>
      );
    }
    return (
      <a className={`btn btn-primary ${size}`} href={`${publishHref}#${omCode}`}>
        {labels.publish}
      </a>
    );
  };

  const sendTeach = () => {
    const lines = Object.entries(teach)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k} = ${v}`);
    if (!lines.length) return;
    // l'abbinamento resta anche nel browser: il salvataggio automatico lo scrive insieme ai mazzi
    setKeyMap((m) => ({ ...m, ...Object.fromEntries(Object.entries(teach).filter(([, v]) => v)) }));
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent("Origins TCG card keys")}&body=${encodeURIComponent(lines.join("\n"))}`;
  };

  const issueText = (code: string) => (labels.issues as Record<string, string>)[code] ?? code;
  const slotCard = (slug: string) => lookup(slug);
  const h3 = "mt-6 text-base font-bold text-chalk";
  const fieldCls = "rounded-lg border border-felt-line bg-felt-deep px-3 py-2 text-sm text-chalk";

  return (
    <div className="relative">
      {/* ---------- importazione: in cima, su tutta la larghezza (sul telefono prima delle carte) ---------- */}
      <form
        className="felt-panel mb-6 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void doImport();
        }}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <label htmlFor="deck-import" className="shrink-0 font-display text-sm font-bold text-chalk">
            {labels.importQuestion}
          </label>
          {/* sul telefono casella e tasto uno sotto l'altro: affiancati, il segnaposto andrebbe a capo su tre righe */}
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start">
            <textarea
              id="deck-import"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              onKeyDown={(e) => {
                // Invio importa, Maiusc+Invio va a capo (per incollare o scrivere una lista testuale)
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void doImport();
                }
              }}
              rows={1}
              spellCheck={false}
              autoComplete="off"
              placeholder={labels.importPlaceholder}
              // una riga finché è vuota (field-sizing misurerebbe anche il segnaposto), poi cresce con la lista incollata
              className={`${importText ? "field-sizing-content" : ""} max-h-40 min-h-10 min-w-0 flex-1 resize-none rounded-lg border border-sky bg-night px-3 py-2 font-mono text-xs text-pale`}
            />
            <button type="submit" className="btn btn-ghost justify-center px-4 py-2 text-xs sm:shrink-0">
              {labels.importTitle}
            </button>
          </div>
        </div>
        <div aria-live="polite">
          {notice ? (
            <div className={`mt-3 ${notice.bad ? "alert-bad" : "rounded-lg bg-night-3/70 px-3 py-2 text-sm text-pale"}`}>
              <span className="min-w-0 wrap-anywhere">{notice.text}</span>
            </div>
          ) : null}
          {/* fuori dal messaggio: la copia sopravvive ai ricaricamenti, e il tasto resta finché non la si usa o la si scarta */}
          {hasBackup ? (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <button type="button" onClick={restoreBackup} className="link-mint font-semibold">
                {labels.undoLink}
              </button>
              <button type="button" onClick={dropBackup} aria-label={labels.close} title={labels.close} className="rounded-md px-1.5 text-pale-muted hover:text-chalk">
                ✕
              </button>
            </p>
          ) : null}
        </div>
        {unknownKeys.length ? (
          <div className="mt-3 rounded-lg border-2 border-gold bg-gold/10 p-3">
            <p className="font-display text-sm font-bold text-chalk">{labels.teachTitle}</p>
            <p className="mt-1 text-xs text-pale-muted">{labels.teachHint}</p>
            <ul className="mt-2 space-y-1">
              {unknownKeys.map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <code className="font-mono text-xs">{k}</code>
                  <select
                    value={teach[k] ?? ""}
                    aria-label={`${labels.teachTitle}: ${k}`}
                    onChange={(e) => setTeach((t) => ({ ...t, [k]: e.target.value }))}
                    className="min-w-0 flex-1 rounded border border-sky bg-night px-2 py-1 text-xs"
                  >
                    <option value="">—</option>
                    {pool.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-ghost mt-2 text-xs" onClick={sendTeach}>
              {labels.teachSend}
            </button>
          </div>
        ) : null}
      </form>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* ---------- mazzo ---------- */}
        <section id="builder-deck" aria-labelledby="builder-deck-title" className="card-night scroll-mt-24 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="builder-deck-title" className="t-section">
              {labels.deckTitle}
            </h2>
            {locked ? (
              <span className="rounded-full border-2 border-sky px-3 py-1 font-display text-xs font-bold text-sky">{mode === "single" ? labels.modeSingle : labels.modeTournament}</span>
            ) : (
              <div className="flex gap-1 rounded-full border-2 border-sky p-0.5">
                {(["single", "tournament"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                    className={`rounded-full px-3 py-1 font-display text-xs font-bold ${mode === m ? "bg-night-3 text-sky" : "text-pale-muted hover:text-sky"}`}
                  >
                    {m === "single" ? labels.modeSingle : labels.modeTournament}
                  </button>
                ))}
              </div>
            )}
          </div>
          {mode === "tournament" ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {indices.map((i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={active === i}
                  onClick={() => setActive(i)}
                  className={`rounded-lg px-3 py-1 font-display text-xs font-bold ${active === i ? "border-2 border-mint bg-mint text-ink" : "border-2 border-sky text-pale-muted"}`}
                >
                  {labels.deckLabel} {String.fromCharCode(65 + i)} {isComplete(decks[i]) ? "✓" : ""}
                </button>
              ))}
            </div>
          ) : null}

          <label className="mt-4 block">
            <span className="kicker text-pale-muted">{labels.deckName}</span>
            <input
              id={`deck-name-${active}`}
              value={deck.name}
              onChange={(e) => updateDeck((d) => ({ ...d, name: e.target.value.slice(0, 60) }))}
              placeholder={labels.deckNamePlaceholder}
              className="mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale"
            />
          </label>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className={`stat-pill font-bold ${complete ? "border-2 border-mint bg-mint text-ink" : "border-2 border-pale-muted text-pale"}`}>{complete ? `✓ ${labels.valid}` : labels.invalid}</span>
            <span className="font-mono text-sm text-pale-muted">
              {cardCount} / {RULES.deckSize}
            </span>
          </div>
          {issues.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {issues.map((i) => (
                <li key={i.code} className={i.level === "error" ? "text-error" : "text-pale-muted"}>
                  • {issueText(i.code)}
                </li>
              ))}
            </ul>
          ) : null}

          {/* Leggendaria */}
          <h3 className={h3}>{labels.legendarySlot}</h3>
          {deck.legendary && slotCard(deck.legendary) ? (
            <div className="mt-2">
              <DeckRow card={slotCard(deck.legendary)!} copies={1} onRemove={() => removeCard(deck.legendary!)} removeLabel={labels.remove} spellLabel={labels.spell} />
            </div>
          ) : (
            <a href="#builder-pool" className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-dashed border-sky px-3 py-3 text-sm text-pale-muted hover:text-pale">
              {labels.pickLegendary}
              <span aria-hidden="true" className="lg:hidden">
                ↑
              </span>
            </a>
          )}

          {/* Carte base */}
          <h3 className={h3}>
            {labels.slots}{" "}
            <span className="font-mono text-sm font-normal text-pale-muted">
              {deck.cards.length}/{RULES.distinctCards} · {labels.slotsHint}
            </span>
          </h3>
          <ul className="mt-2 space-y-1.5">
            {deck.cards.map((s) => {
              const c = slotCard(s);
              return c ? (
                <li key={s}>
                  <DeckRow card={c} copies={RULES.copiesPerCard} onRemove={() => removeCard(s)} removeLabel={labels.remove} spellLabel={labels.spell} />
                </li>
              ) : null;
            })}
            {/* sul computer i segnaposto vuoti; sul telefono una riga sola con il contatore, che porta alle carte */}
            {Array.from({ length: freeSlots }).map((_, i) => (
              <li key={`empty-${i}`} className="hidden h-9 rounded-lg border border-dashed border-sky lg:block" aria-hidden="true" />
            ))}
            {freeSlots ? (
              <li className="lg:hidden">
                <a href="#builder-pool" className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-sky px-3 py-3 text-sm text-pale-muted hover:text-pale">
                  {fmt(labels.slotsLeft, { n: freeSlots })}
                  <span aria-hidden="true">↑</span>
                </a>
              </li>
            ) : null}
          </ul>

          {/* Curva */}
          <h3 className={h3}>{labels.curve}</h3>
          <div className="mt-2 flex h-24 items-end gap-1" aria-hidden="true">
            {curve.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-pale-muted">{n || ""}</span>
                <div className="w-full rounded-t bg-mint-deep" style={{ height: `${(n / maxCurve) * 64}px` }} />
                <span className="font-mono text-[10px] text-pale-muted">{i === 8 ? "8+" : i}</span>
              </div>
            ))}
          </div>

          {/* I quattro tasti (decisione di Pierluigi del 21/09/2026): Pubblica sul sito, Salva privato, Condividi, Svuota mazzo */}
          <div className="mt-6 border-t border-felt-line pt-5">
            <h3 className="sr-only">{labels.actions}</h3>
            {submitLabels && submitState !== "idle" ? (
              <p role="status" className={`mb-3 ${submitState === "saved" ? "alert-good" : "alert-bad"}`}>
                {submitState === "saved" ? submitLabels.saved : submitState}
              </p>
            ) : null}
            {primaryAction(false)}
            {onSubmit && submitLabels ? (
              !submittable ? <p className="mt-2 text-xs text-pale-muted">{submitLabels.incomplete}</p> : null
            ) : (
              <>
                {!complete ? (
                  <p id="builder-complete-hint" className="mt-2 text-xs text-pale-muted">
                    {labels.completeHint}
                  </p>
                ) : null}
                {loggedIn === false ? <p className="mt-2 text-xs text-pale">{labels.publishLoginHint}</p> : null}
              </>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              {/* lo stato disabilitato lo disegna .btn (opacità e saturazione ridotte) */}
              <button
                type="button"
                className="btn btn-ghost justify-center px-3 text-xs"
                onClick={() => savePrivate()}
                disabled={!complete || saving || savedNow}
                aria-describedby={!complete && !onSubmit ? "builder-complete-hint" : undefined}
              >
                {saving ? labels.savingPrivate : savedNow ? `${labels.saved} ✓` : labels.savePrivate}
              </button>
              <button
                ref={shareBtnRef}
                type="button"
                className="btn btn-ghost justify-center px-3 text-xs"
                aria-expanded={shareOpen}
                aria-controls="builder-share"
                onClick={() => setShareOpen((o) => !o)}
                disabled={deckEmpty}
              >
                {labels.share}
              </button>
            </div>

            <div aria-live="polite">
              {saveShown ? (
                saveShown.ok ? (
                  <p className="alert-good mt-3">
                    {labels.savedPrivate}{" "}
                    <Link href={saveShown.href} className="link-mint whitespace-nowrap">
                      {labels.viewProfile} →
                    </Link>
                  </p>
                ) : (
                  <p className="alert-bad mt-3">{labels.savePrivateErrors[saveShown.error] ?? labels.savePrivateErrors.db}</p>
                )
              ) : null}
            </div>

            {/* Pannello "Condividi": tutte le copie del mazzo in un posto solo */}
            <div
              id="builder-share"
              ref={sharePanelRef}
              role="region"
              aria-labelledby="builder-share-title"
              hidden={!shareOpen}
              className="mt-3 rounded-xl border-2 border-sky bg-night-2 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p id="builder-share-title" className="font-display text-sm font-bold text-chalk">
                  {labels.shareTitle}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShareOpen(false);
                    shareBtnRef.current?.focus();
                  }}
                  className="rounded-md px-2 py-0.5 text-pale-muted hover:text-chalk"
                  aria-label={labels.close}
                >
                  ✕
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {canShare ? (
                  <button type="button" onClick={nativeShare} className="btn btn-ghost w-full justify-center text-xs">
                    {labels.shareNative}
                  </button>
                ) : null}
                <ShareField id="share-link" label={labels.shareLink} value={shareLink} copy={labels.copy} copied={labels.copied} />
                <ShareField
                  id="share-game"
                  label={labels.shareGame}
                  value={gameCodeNow}
                  copy={labels.copy}
                  copied={labels.copied}
                  note={missingKeys ? fmt(labels.exportGameMissing, { n: missingKeys }) : undefined}
                />
                <ShareField id="share-om" label={labels.shareOm} value={omCode} copy={labels.copy} copied={labels.copied} />
                <ShareField id="share-text" label={labels.shareText} value={textList} copy={labels.copy} copied={labels.copied} multiline />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-pale-muted" aria-live="polite">
                {autoSaved ? `✓ ${labels.autosaved}` : ""}
              </span>
              {confirmClear ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-pale">{labels.clearConfirm}</span>
                  <button
                    type="button"
                    className="btn btn-danger px-3 py-1 text-xs"
                    onClick={() => {
                      updateDeck((d) => ({ ...emptyDeck(d.name), customCards: [] }));
                      // il mazzo nuovo che nascerà qui non è il mazzo privato aperto da /account
                      if (draftLink.current?.slot === active) draftLink.current = null;
                      setConfirmClear(false);
                      setShareOpen(false); // un mazzo vuoto non ha niente da condividere
                    }}
                  >
                    {labels.clearYes}
                  </button>
                  <button type="button" autoFocus className="rounded-full px-3 py-1 text-pale-muted hover:text-chalk" onClick={() => setConfirmClear(false)}>
                    {labels.cancel}
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="text-pale-muted underline-offset-4 hover:text-chalk hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => setConfirmClear(true)}
                  disabled={deckEmpty}
                >
                  {labels.clear}
                </button>
              )}
            </div>
          </div>

          {/* Conquest */}
          {mode === "tournament" ? (
            <div className="mt-6 rounded-lg border-2 border-sky p-4">
              <h3 className="text-base font-bold text-chalk">{labels.tournamentTitle}</h3>
              <p className="mt-1 text-xs text-pale-muted">{fmt(labels.tournamentHint, { min: minDifferent })}</p>
              <label className="mt-2 flex items-center gap-2 text-xs text-pale-muted">
                {labels.minDifferent}
                <input
                  id="conquest-min"
                  type="number"
                  min={1}
                  max={25}
                  value={minDifferent}
                  readOnly={locked}
                  onChange={(e) => setMinDifferent(Math.max(1, Math.min(25, Number(e.target.value) || 1)))}
                  className="w-16 rounded border border-sky bg-night px-2 py-1 font-mono text-pale"
                />
              </label>
              <table className="mt-3 w-full text-xs">
                <thead>
                  <tr className="text-left text-pale-muted">
                    <th className="py-1">{labels.diffTable}</th>
                    {indices.map((i) => (
                      <th key={i} className="py-1">
                        {String.fromCharCode(65 + i)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {indices.map((i) => (
                    <tr key={i} className="border-t border-sky">
                      <td className="py-1 font-bold">
                        {labels.deckLabel} {String.fromCharCode(65 + i)}
                      </td>
                      {indices.map((j) => {
                        if (i === j) return <td key={j} className="py-1 font-mono text-pale-muted">—</td>;
                        // differentCards non è simmetrica: con un mazzo ancora incompleto il confronto non dice niente
                        if (!isComplete(decks[i]) || !isComplete(decks[j])) return <td key={j} className="py-1 font-mono text-pale-muted">…</td>;
                        const diff = differentCards(decks[i], decks[j]);
                        const ok = diff >= minDifferent;
                        return (
                          <td key={j} className={`py-1 font-mono ${ok ? "text-mint" : "text-error"}`} title={`${labels.shared}: ${sharedCards(decks[i], decks[j]).map((s) => lookup(s)?.name ?? s).join(", ") || "—"}`}>
                            {diff} {ok ? "✓" : "✗"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {conquestIssues.length ? (
                <ul className="mt-2 space-y-1 text-sm text-error">
                  {conquestIssues.map((c, i) => (
                    <li key={i}>
                      • {c.code === "tooSimilar" && c.decks ? fmt(labels.issues.tooSimilar, { a: String.fromCharCode(65 + c.decks[0]), b: String.fromCharCode(65 + c.decks[1]), n: c.value ?? 0, min: minDifferent }) : issueText(c.code)}
                    </li>
                  ))}
                </ul>
              ) : decks.slice(0, count).every((d) => isComplete(d)) ? (
                <p className="mt-2 text-sm font-bold text-mint">{labels.ok} ✓</p>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* ---------- pool: sul telefono viene prima del mazzo e scorre con la pagina (niente scorrimento interno) ---------- */}
        <section id="builder-pool" aria-labelledby="builder-pool-title" className="felt-panel order-first scroll-mt-24 p-5 lg:order-none">
          <h2 id="builder-pool-title" className="t-section">
            {labels.pool}
          </h2>
          <p className="mt-1 text-xs text-chalk-muted">{labels.poolHint}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1.5fr_1fr_1fr]">
            <input id="pool-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={labels.searchPool} aria-label={labels.searchPool} className={fieldCls} />
            <select id="pool-type" aria-label={labels.filterType} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className={fieldCls}>
              <option value="all">{labels.all}</option>
              <option value="unit">{labels.typeUnit}</option>
              <option value="spell">{labels.typeSpell}</option>
            </select>
            <select id="pool-cost" aria-label={labels.filterCost} value={costFilter} onChange={(e) => setCostFilter(e.target.value)} className={fieldCls}>
              <option value="all">
                {labels.cost}: {labels.all}
              </option>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
                <option key={c} value={String(c)}>
                  {c}
                </option>
              ))}
              <option value="8">8+</option>
            </select>
          </div>
          <ul aria-labelledby="builder-pool-title" className="mt-3 space-y-1 lg:max-h-[640px] lg:overflow-y-auto lg:pr-1">
            {visiblePool.map((c) => {
              const inDeck = deck.legendary === c.slug || deck.cards.includes(c.slug);
              const full = !c.legendary && deck.cards.length >= RULES.distinctCards;
              const blocked = full && !inDeck;
              const peek = hasPeek(c);
              return (
                <li key={c.slug}>
                  {/* Niente tasti: si clicca la riga intera, che è un <button> (annunciato come tale, con lo stato in aria-pressed). */}
                  <button
                    type="button"
                    aria-pressed={inDeck}
                    aria-disabled={blocked || undefined}
                    onClick={() => (inDeck ? removeCard(c.slug) : blocked ? undefined : addCard(c))}
                    className={`builder-row deck-card-wrap text-left ${peek ? "has-peek" : ""} ${c.legendary ? "is-legendary" : ""} ${inDeck ? "is-in-deck" : ""} ${blocked ? "is-full" : ""}`}
                    title={peek ? undefined : c.name}
                    style={c.thumb ?? c.art ? ({ ["--row-art" as string]: `url(${c.thumb ?? c.art})` } as React.CSSProperties) : undefined}
                  >
                    <BuilderArt card={c} />
                    <span className="builder-row-text">
                      <span className="builder-row-name">
                        {c.legendary ? "★ " : ""}
                        {c.name}
                      </span>
                      <span className="builder-row-stats">
                        {c.mana ?? "?"} · {c.type === "unit" ? `${c.power ?? "?"}/${c.health ?? "?"}` : labels.spell} · {c.sagaLabel}
                      </span>
                    </span>
                    {/* Resta un segno dello stato, uguale su ogni riga. */}
                    <span className="builder-row-state" aria-hidden="true">
                      {inDeck ? "✓" : blocked ? "–" : "+"}
                    </span>
                    <CardPeek card={c} />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 rounded-lg border border-felt-line p-3">
            <p className="font-display text-sm font-bold text-chalk">{labels.customTitle}</p>
            <p className="mt-1 text-xs text-chalk-muted">{labels.customHint}</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1.6fr_0.6fr_auto]">
              <input id="custom-name" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={labels.customName} aria-label={labels.customName} className={fieldCls} />
              <input
                id="custom-cost"
                type="number"
                min={0}
                max={12}
                value={customCost}
                onChange={(e) => setCustomCost(e.target.value)}
                placeholder={labels.customCost}
                aria-label={labels.customCost}
                className={fieldCls}
              />
              <label className="flex items-center gap-2 text-xs text-chalk-muted">
                <input id="custom-legendary" type="checkbox" checked={customLegendary} onChange={(e) => setCustomLegendary(e.target.checked)} />
                {labels.customLegendary}
              </label>
            </div>
            <button type="button" className="btn btn-ghost mt-2 text-xs" onClick={addCustom}>
              {labels.customAdd}
            </button>
          </div>
        </section>
      </div>

      {/* ---------- barra in basso sul telefono: resta visibile mentre si scorre il builder, poi si ferma alla sua fine ---------- */}
      <div
        role="region"
        aria-label={labels.summaryBar}
        className="sticky bottom-0 z-30 mt-6 rounded-t-2xl border-[3px] border-b-0 border-sky bg-night-2/95 px-4 pt-3 shadow-lift backdrop-blur lg:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-3">
          <a href="#builder-deck" className="min-w-0 flex-1" aria-label={`${labels.viewDeck}: ${cardCount}/${RULES.deckSize}, ${complete ? labels.valid : labels.invalid}`}>
            <span className="block font-mono text-base font-bold leading-tight text-chalk">
              {cardCount}/{RULES.deckSize} <span aria-hidden="true">↓</span>
            </span>
            <span className={`block truncate text-xs font-semibold ${complete ? "text-mint" : "text-pale-muted"}`}>{complete ? `✓ ${labels.valid}` : labels.invalid}</span>
          </a>
          {primaryAction(true)}
        </div>
      </div>
    </div>
  );
}

/** Una copia del pannello "Condividi": campo in sola lettura (si seleziona al tocco, se gli appunti non vanno) e "Copia". */
function ShareField({ id, label, value, copy, copied, note, multiline = false }: { id: string; label: string; value: string | null; copy: string; copied: string; note?: string; multiline?: boolean }) {
  const [done, setDone] = useState(false);
  const doCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      // appunti non disponibili: si seleziona il testo, basta Ctrl+C (o "Copia" dal menu del telefono)
      const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
      el?.focus();
      el?.select();
    }
  };
  const fieldCls = "min-w-0 flex-1 rounded-lg border border-felt-line bg-felt-deep px-3 py-2 font-mono text-xs text-pale";
  return (
    <div>
      <label htmlFor={id} className="text-xs font-bold text-pale">
        {label}
      </label>
      {value !== null || !note ? (
        <div className={`mt-1 flex gap-2 ${multiline ? "items-start" : "items-center"}`}>
          {multiline ? (
            <textarea id={id} readOnly value={value ?? ""} rows={Math.min(8, Math.max(2, (value ?? "").split("\n").length))} onFocus={(e) => e.currentTarget.select()} className={`${fieldCls} resize-none`} />
          ) : (
            <input id={id} readOnly value={value ?? "…"} onFocus={(e) => e.currentTarget.select()} className={fieldCls} />
          )}
          <button type="button" onClick={doCopy} disabled={!value} className="btn btn-ghost shrink-0 px-3 py-1.5 text-xs">
            {done ? `${copied} ✓` : copy}
          </button>
        </div>
      ) : null}
      {note ? <p className="mt-1 text-xs text-pale-muted">{note}</p> : null}
      <span className="sr-only" role="status">
        {done ? copied : ""}
      </span>
    </div>
  );
}

/** Riquadro della carta nel builder: si usa la finestra d'illustrazione, non la carta intera, perché in un
 *  riquadro così piccolo la carta rimpicciolita è illeggibile mentre il volto del personaggio si riconosce.
 *  Iniziali sulle carte che il materiale non copre e su quelle inserite a mano. Lazy: nel pool sono decine. */
function BuilderArt({ card }: { card: BuilderCard }) {
  const src = card.art ?? card.thumb;
  return (
    <span className={`card-chip-art !h-11 !w-9 shrink-0 text-[10px] ${card.legendary ? "is-legendary" : ""}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" />
      ) : (
        initials(card.name)
      )}
    </span>
  );
}

/** Riga di una carta nel mazzo. L'anteprima al passaggio (`CardPeek`) è in `position: fixed` (vedi `.builder-row > .deck-peek`
 *  in globals.css, coordinate da `CardMentionEdges`): nessun contenitore con overflow la taglia. */
function DeckRow({ card, copies, onRemove, removeLabel, spellLabel }: { card: BuilderCard; copies: number; onRemove: () => void; removeLabel: string; spellLabel: string }) {
  const peek = hasPeek(card);
  return (
    <div
      className={`builder-row is-in-deck deck-card-wrap ${peek ? "has-peek" : ""} ${card.legendary ? "is-legendary" : ""}`}
      title={peek ? undefined : card.name}
      style={card.thumb ?? card.art ? ({ ["--row-art" as string]: `url(${card.thumb ?? card.art})` } as React.CSSProperties) : undefined}
    >
      <span className="builder-row-copies">{copies}×</span>
      <BuilderArt card={card} />
      <span className="builder-row-text">
        <span className="builder-row-name">
          {card.legendary ? "★ " : ""}
          {card.name}
          {card.custom ? " *" : ""}
        </span>
        <span className="builder-row-stats">
          {card.mana ?? "?"} · {card.type === "unit" ? `${card.power ?? "?"}/${card.health ?? "?"}` : spellLabel}
        </span>
      </span>
      <button type="button" onClick={onRemove} className="builder-row-x" aria-label={`${removeLabel} ${card.name}`}>
        ✕
      </button>
      <CardPeek card={card} />
    </div>
  );
}
