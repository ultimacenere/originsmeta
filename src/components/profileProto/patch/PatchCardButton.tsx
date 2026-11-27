"use client";

import { useRef, type ReactNode } from "react";

/**
 * Una carta cambiata dalla patch: il tocco apre un `dialog` nativo con la carta del gioco intera e la nota della patch
 * (contenuto disegnato sul server, passato come `children`). Sul telefono il dialog è un foglio dal basso (CSS).
 */
export function PatchCardButton({ label, trigger, children }: { label: string; trigger: ReactNode; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" aria-haspopup="dialog" aria-label={label} onClick={() => dialog.current?.showModal()} className="patch-touch">
        {trigger}
      </button>
      <dialog
        ref={dialog}
        aria-label={label}
        className="patch-dialog"
        onClick={(e) => {
          // il clic sul fondo (fuori dal contenuto) chiude
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="patch-dialog-body">
          <button type="button" onClick={() => dialog.current?.close()} className="patch-dialog-close" aria-label="Chiudi">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {children}
        </div>
      </dialog>
    </>
  );
}
