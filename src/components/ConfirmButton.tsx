"use client";

/** Bottone di invio che chiede conferma prima di spedire il form che lo contiene (form server con Server Action). */
export function ConfirmButton({ label, confirm, className = "btn btn-ghost text-xs" }: { label: string; confirm: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
