"use client";

import { useId, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { markdownLabels } from "@/lib/markdownLabels";
import { linePrefixEdit, wrapEdit, type LineKind, type TextEdit } from "@/lib/markdownEdit";

/**
 * Barra di formattazione sopra una casella di testo (22/10/2026, Pierluigi: "possiamo inserire il grassetto e altri
 * markdown?"): grassetto, corsivo, barrato, elenchi, citazione e, dove il testo li ammette, titoletti; sotto, una guida
 * richiudibile con i segni. `target` è l'id della `<textarea>`: la barra la cerca nel documento al clic, quindi va bene
 * sia con le caselle libere dei moduli (defaultValue) sia con quelle legate a uno stato React (value + onChange).
 *
 * La modifica passa da `execCommand("insertText")`, che la scrive come se l'avesse digitata l'utente: Ctrl+Z la
 * annulla e React riceve il suo evento input. Dove il browser non lo fa, `setRangeText` più un evento input.
 * I tasti non prendono il fuoco al clic del mouse (`onMouseDown` preventDefault): la selezione nella casella resta.
 */
export function MarkdownToolbar({ target, locale, headings = true, className = "" }: { target: string; locale: Locale; headings?: boolean; className?: string }) {
  const L = markdownLabels[locale];
  const helpId = useId();
  const field = () => {
    const el = document.getElementById(target);
    return el instanceof HTMLTextAreaElement ? el : null;
  };
  const apply = (make: (value: string, s: number, e: number) => TextEdit) => {
    const el = field();
    if (!el || el.disabled || el.readOnly) return;
    const edit = make(el.value, el.selectionStart, el.selectionEnd);
    el.focus();
    el.setSelectionRange(edit.start, edit.end);
    if (edit.start === edit.end && !edit.text) return;
    const typed = edit.text ? document.execCommand?.("insertText", false, edit.text) : document.execCommand?.("delete");
    if (!typed || el.value.slice(edit.start, edit.start + edit.text.length) !== edit.text) {
      el.setRangeText(edit.text, edit.start, edit.end, "end");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
    el.setSelectionRange(edit.selStart, edit.selEnd);
  };
  const wrap = (mark: string) => apply((v, s, e) => wrapEdit(v, s, e, mark, L.placeholder));
  const lines = (kind: LineKind) => apply((v, s, e) => linePrefixEdit(v, s, e, kind));

  const buttons: { key: string; label: string; face: ReactNode; run: () => void }[] = [
    { key: "b", label: L.bold, face: <strong className="font-black">B</strong>, run: () => wrap("**") },
    { key: "i", label: L.italic, face: <em className="font-serif text-[1.05em]">I</em>, run: () => wrap("*") },
    { key: "s", label: L.strike, face: <s>S</s>, run: () => wrap("~~") },
    { key: "ul", label: L.bullets, face: <span aria-hidden="true">• ≡</span>, run: () => lines("ul") },
    { key: "ol", label: L.numbers, face: <span aria-hidden="true">1.≡</span>, run: () => lines("ol") },
    { key: "q", label: L.quote, face: <span aria-hidden="true">❝</span>, run: () => lines("quote") },
    ...(headings ? [{ key: "h", label: L.heading, face: <span aria-hidden="true">H</span>, run: () => lines("h") }] : []),
  ];
  const s = L.sample;
  const examples: [string, ReactNode][] = [
    [`**${s.bold}**`, <strong key="b">{s.bold}</strong>],
    [`*${s.italic}*`, <em key="i">{s.italic}</em>],
    [`~~${s.strike}~~`, <s key="s">{s.strike}</s>],
    [`- ${s.item}`, <span key="ul">• {s.item}</span>],
    [`1. ${s.numbered}`, <span key="ol">1. {s.numbered}</span>],
    [`> ${s.quote}`, <span key="q" className="border-l-2 border-sky pl-2 text-pale-muted">{s.quote}</span>],
    ...(headings ? ([[`### ${s.heading}`, <span key="h" className="font-display font-bold text-sky">{s.heading}</span>]] as [string, ReactNode][]) : []),
    ["\\*", <span key="e">* ({L.escape})</span>],
  ];

  return (
    <div className={`mt-1 ${className}`}>
      <div role="toolbar" aria-label={L.toolbar} aria-controls={target} className="flex flex-wrap items-center gap-1">
        {buttons.map((b) => (
          <button
            key={b.key}
            type="button"
            title={b.label}
            aria-label={b.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={b.run}
            className="min-w-8 rounded-md border-2 border-sky/60 bg-night-2 px-2 py-0.5 text-sm text-pale hover:border-mint hover:text-chalk focus-visible:border-mint"
          >
            {b.face}
          </button>
        ))}
        <details className="relative ml-1 text-xs">
          <summary className="cursor-pointer list-none rounded-md px-1 py-0.5 text-pale-muted underline underline-offset-2 hover:text-pale">
            {L.help}
          </summary>
          <div id={helpId} className="mt-2 rounded-lg border-2 border-sky bg-night-2 p-3 text-pale">
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {examples.map(([code, shown]) => (
                <li key={code} className="flex flex-wrap items-baseline gap-2">
                  <code className="rounded bg-night-3 px-1 font-mono text-[11px] text-chalk">{code}</code>
                  <span aria-hidden="true">→</span>
                  {shown}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-pale-muted">{L.note}</p>
          </div>
        </details>
      </div>
    </div>
  );
}
