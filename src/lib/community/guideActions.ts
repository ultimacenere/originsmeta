"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import type { Db } from "@/lib/supabase/public";
import { getCard } from "@/lib/data/cards";
import { mediaErrorField, readDeckMedia } from "@/lib/videos";
import { indexNowEnabled, submitIndexNow } from "@/lib/indexnow";
import { revalidateSitemaps } from "@/lib/sitemapData";
import { isUuid, slugify } from "./util";
import { guideRoleOf } from "./guideQueries";
import {
  REPORT_REASON_MAX,
  REPORT_REASON_MIN,
  cleanPlain,
  communityGuideHash,
  communityGuideIndexable,
  communityGuideWords,
  guideErrorCode,
  guideErrorField,
  plainTextOk,
  readGuideForm,
  storedSections,
  type GuideFormValue,
  type GuideIntent,
} from "./guides";
import { announceGuide, notifyGuideFollowers, notifyGuideReport } from "./guideNotify";
import { translateCommunityGuideLater } from "./guideTranslate";

/**
 * Server Action delle guide della community (pacchetto GUIDE, 27/09/2026): salvataggio (bozza o pubblicazione, creazione
 * o modifica), stato (riportare tra le bozze; nascondere e rimettere online per lo staff), eliminazione, segnalazione.
 *
 * Il controllo vero sta nel database (supabase/wave2-GUIDE.sql): policy con `can_publish_guides`, grant per colonna,
 * vincoli del testo e trigger con i tetti (contati su un registro che eliminare una guida non azzera) e lo stato
 * riservato allo staff. Qui si controlla prima, con le stesse regole (`readGuideForm`, `canPublishGuides`), per
 * rispondere con un messaggio chiaro; gli errori del database diventano un codice con `guideErrorCode`. Niente file
 * attraverso le Server Action (limite 1 MB): la copertina è un'immagine del media kit (`cover_preset`); quella caricata
 * arriverà dal browser allo Storage con il pacchetto VETRINA.
 */

export type GuideActionState = {
  error?: string;
  ok?: boolean;
  href?: string;
  /** campo del modulo da correggere e numero della sezione o della riga (da 0) */
  field?: string;
  index?: number;
  /** la guida è appena uscita per la prima volta (evento guide_published nel browser) */
  firstPublish?: boolean;
  /** lingua e categoria della guida, per l'evento */
  lang?: string;
  category?: string;
};

function localeOf(fd: FormData): Locale {
  const raw = String(fd.get("locale") ?? "");
  return isLocale(raw) ? raw : "en";
}

/** Slug leggibile dal titolo più 4 caratteri casuali, come i mazzi (`newSlug` di util.ts, con "guide" di riserva). */
function newGuideSlug(title: string): string {
  const base = slugify(title).slice(0, 40).replace(/-+$/, "") || "guide";
  return `${base}-${crypto.randomUUID().replace(/-/g, "").slice(0, 4)}`;
}

/**
 * Pagine da rigenerare quando cambia una guida (e la sitemap: una guida pubblicata ci entra, una nascosta ne esce).
 * `username` è quello del PROPRIETARIO della guida (la sua pagina /u la elenca), anche quando agisce lo staff.
 */
function revalidateGuide(slug: string | undefined, username: string | null): void {
  for (const l of locales) {
    revalidatePath(`/${l}/guides`);
    revalidatePath(`/${l}/guides/community`);
    revalidatePath(`/${l}/account`);
    if (slug) revalidatePath(`/${l}/guides/community/${slug}`);
    if (username) revalidatePath(`/${l}/u/${username}`);
  }
  revalidateSitemaps();
}

/** IndexNow (Bing), dopo la risposta al browser e solo in produzione. */
function pingIndexNow(paths: string[]): void {
  if (!indexNowEnabled() || !paths.length) return;
  const job = async () => {
    await submitIndexNow(paths);
  };
  try {
    after(job);
  } catch {
    void job();
  }
}

/**
 * Dopo un salvataggio: pagine, e per una guida pubblicata annuncio e avviso ai follower alla PRIMA pubblicazione,
 * IndexNow per la versione originale (se supera la soglia di parole) e traduzione nelle altre lingue.
 */
function afterSave(
  supabase: Db,
  g: { id: string; slug: string; status: string; first: boolean; ownerId: string; value: Pick<GuideFormValue, "title" | "lang" | "summary" | "sections"> },
  username: string | null,
): void {
  revalidateGuide(g.slug, username);
  if (g.status !== "published") return;
  if (g.first) {
    announceGuide(g.slug);
    notifyGuideFollowers({ ownerId: g.ownerId, slug: g.slug, title: g.value.title, lang: g.value.lang });
  }
  if (communityGuideIndexable(g.value)) pingIndexNow([`/${g.value.lang}/guides/community/${g.slug}`]);
  translateCommunityGuideLater(supabase, g.id);
}

/** Colonne rilette dopo una scrittura: con il nome utente del proprietario, per rigenerare la sua pagina /u. */
const SAVED_COLUMNS = "id, slug, status, published_at, owner, profile:profiles!community_guides_owner_fkey(username)";
type Saved = { id: string; slug: string; status: string; published_at: string | null; owner: string; profile?: { username: string | null } | null };
const ownerName = (s: { profile?: { username: string | null } | null } | null) => s?.profile?.username ?? null;

/**
 * Salva una guida dal modulo di /guides/new o /guides/community/[slug]/edit. Campi: `intent` ("draft" o "publish"),
 * `locale`, `id` (in modifica), i campi di `readGuideForm` e quelli di video e risorse (`readDeckMedia`).
 * Una bozza porta alla sua pagina di modifica; una guida pubblicata alla sua pagina (con `?new=1` la prima volta).
 * Una guida nascosta la corregge solo lo staff, e resta nascosta (la rimette online il tasto "Rimetti online").
 * Con il testo si salvano parole e impronta (`words`, `text_hash`): le leggono gli elenchi e la sitemap.
 */
export async function saveCommunityGuide(_prev: GuideActionState, fd: FormData): Promise<GuideActionState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "disabled" };
  if (!user) return { error: "notLoggedIn" };
  const locale = localeOf(fd);
  const intent: GuideIntent = fd.get("intent") === "publish" ? "publish" : "draft";
  const role = await guideRoleOf(supabase, user.id);
  if (!role.canPublish) return { error: "forbidden" };

  const parsed = readGuideForm(fd, intent, (slug) => Boolean(getCard(slug)));
  if (!parsed.ok) return { error: parsed.error.code, field: guideErrorField(parsed.error), index: parsed.error.index };
  const media = readDeckMedia((k) => fd.get(k));
  if (!media.ok) return { error: media.code, field: mediaErrorField(media.code, media.index), index: media.index };
  const value = parsed.value;
  const status = intent === "publish" ? "published" : "draft";
  const row = { ...value, videos: media.videos, links: media.links, words: communityGuideWords(value), text_hash: communityGuideHash(value) };

  let saved: Saved | null = null;
  let first = false;
  const id = fd.get("id");
  if (isUuid(id)) {
    const before = await supabase.from("community_guides").select("id, slug, status, published_at, owner").eq("id", id).maybeSingle();
    if (before.error) return { error: guideErrorCode(before.error) };
    const prev = before.data as Saved | null;
    if (!prev) return { error: "forbidden" };
    if (prev.status === "hidden" && !role.staff) return { error: "guide_hidden" };
    const nextStatus = prev.status === "hidden" ? "hidden" : status;
    const res = await supabase.from("community_guides").update({ ...row, status: nextStatus }).eq("id", id).select(SAVED_COLUMNS).maybeSingle();
    if (res.error) return { error: guideErrorCode(res.error) };
    saved = res.data as unknown as Saved | null;
    if (!saved) return { error: "forbidden" };
    first = !prev.published_at && Boolean(saved.published_at);
  } else {
    for (let attempt = 0; attempt < 4 && !saved; attempt++) {
      const res = await supabase
        .from("community_guides")
        .insert({ ...row, status, slug: newGuideSlug(value.title), owner: user.id })
        .select(SAVED_COLUMNS)
        .single();
      if (!res.error) {
        saved = res.data as unknown as Saved;
        first = Boolean(saved.published_at);
        break;
      }
      const code = guideErrorCode(res.error);
      if (code !== "duplicate") return { error: code };
    }
    if (!saved) return { error: "duplicate" };
  }

  afterSave(supabase, { id: saved.id, slug: saved.slug, status: saved.status, first, value, ownerId: saved.owner }, ownerName(saved));
  const href =
    saved.status === "published"
      ? `/${locale}/guides/community/${saved.slug}${first ? "?new=1" : ""}`
      : `/${locale}/guides/community/${saved.slug}/edit?saved=1`;
  return { ok: true, href, firstPublish: first, lang: value.lang, category: value.category };
}

/** Un indirizzo di ritorno del sito nella lingua della pagina, altrimenti null (niente redirect verso altri siti). */
function safeBack(raw: FormDataEntryValue | null, locale: Locale): string | null {
  const s = typeof raw === "string" ? raw : "";
  return s.startsWith(`/${locale}/`) && !s.startsWith("//") && !/[\\\s]/.test(s) ? s : null;
}

/**
 * Cambia lo stato di una guida: il proprietario la riporta tra le bozze (`draft`) o la ripubblica (`published`, se il
 * testo ha i minimi: lo controlla il database); lo staff la nasconde (`hidden`) o la rimette online. Il database decide
 * chi può fare che cosa (trigger guard_community_guide): una richiesta non ammessa non cambia nulla.
 */
export async function setCommunityGuideStatus(fd: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  const locale = localeOf(fd);
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = fd.get("id");
  const raw = String(fd.get("status") ?? "");
  const status = raw === "hidden" ? "hidden" : raw === "published" ? "published" : "draft";
  const back = safeBack(fd.get("back"), locale);
  if (!isUuid(id)) redirect(back ?? `/${locale}/account#guides`);
  const before = await supabase.from("community_guides").select("published_at, lang, title, summary, sections").eq("id", id).maybeSingle();
  const prev = before.data as { published_at: string | null; lang: string; title: string; summary: string; sections: unknown } | null;
  const res = await supabase.from("community_guides").update({ status }).eq("id", id).select(SAVED_COLUMNS).maybeSingle();
  const saved = res.data as unknown as Saved | null;
  if (saved && prev) {
    const first = !prev.published_at && Boolean(saved.published_at);
    const value = { lang: isLocale(prev.lang) ? prev.lang : "en", title: prev.title, summary: prev.summary, sections: storedSections(prev.sections) } as const;
    // la pagina /u da rigenerare è quella del proprietario, anche quando a nascondere è lo staff
    afterSave(supabase, { id: saved.id, slug: saved.slug, status: saved.status, first, value, ownerId: saved.owner }, ownerName(saved));
  } else if (res.error) {
    console.error("[guides] cambio di stato non riuscito:", res.error.message);
  }
  redirect(back ?? (saved?.status === "published" ? `/${locale}/guides/community/${saved.slug}` : `/${locale}/account#guides`));
}

/** Elimina una guida (il proprietario o lo staff; le policy bloccano le altre) con le sue segnalazioni. */
export async function deleteCommunityGuide(fd: FormData): Promise<void> {
  const { supabase, user } = await currentUser();
  const locale = localeOf(fd);
  if (!supabase || !user) redirect(`/${locale}/login`);
  const id = fd.get("id");
  if (isUuid(id)) {
    const { data, error } = await supabase.from("community_guides").delete().eq("id", id).select("slug, owner, profile:profiles!community_guides_owner_fkey(username)").maybeSingle();
    if (error) console.error("[guides] eliminazione non riuscita:", error.message);
    const gone = data as unknown as { slug: string; owner: string; profile?: { username: string | null } | null } | null;
    // la pagina /u del proprietario, anche quando a eliminare è lo staff
    if (gone) revalidateGuide(gone.slug, ownerName(gone));
  }
  redirect(`/${locale}/account#guides`);
}

/**
 * Segnalazione di una guida pubblicata (una per utente e per guida, 5 al giorno, mai sulla propria: lo decide il
 * database). Avvisa il canale privato dello staff su Discord, se il webhook c'è, solo alla prima segnalazione di quella
 * guida nelle 24 ore (`first_in_day`, scritta dal trigger): una raffica di segnalazioni non riempie il canale.
 */
export async function reportCommunityGuide(_prev: GuideActionState, fd: FormData): Promise<GuideActionState> {
  const { supabase, user } = await currentUser();
  if (!supabase) return { error: "db" };
  if (!user) return { error: "notLoggedIn" };
  const id = fd.get("id");
  if (!isUuid(id)) return { error: "db" };
  const reason = cleanPlain(fd.get("reason"), REPORT_REASON_MAX, true);
  if (!plainTextOk(reason, REPORT_REASON_MIN, REPORT_REASON_MAX, true)) return { error: "reason" };
  const { data: guide } = await supabase
    .from("community_guides")
    .select("slug, title, lang, owner, author:profiles!community_guides_owner_fkey(username, display_name)")
    .eq("id", id)
    .maybeSingle();
  const g = guide as unknown as { slug: string; title: string; lang: string; owner: string; author: { username: string | null; display_name: string | null } | null } | null;
  if (g?.owner === user.id) return { error: "own" };
  const { data: report, error } = await supabase.from("community_guide_reports").insert({ guide_id: id, user_id: user.id, reason }).select("first_in_day").single();
  if (error) {
    const code = guideErrorCode(error);
    return { error: code === "duplicate" || code === "report_rate" || code === "forbidden" ? code : "db" };
  }
  if (g && (report as { first_in_day?: boolean } | null)?.first_in_day) {
    const { data: me } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
    notifyGuideReport({
      slug: g.slug,
      title: g.title,
      lang: isLocale(g.lang) ? g.lang : "en",
      author: g.author?.display_name || g.author?.username || "?",
      reporter: (me as { username: string | null } | null)?.username ?? null,
      reason,
    });
  }
  return { ok: true };
}
