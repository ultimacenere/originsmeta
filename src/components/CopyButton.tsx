"use client";

import { useState } from "react";

export function CopyButton({ text, label, copied, className = "btn btn-ink text-xs" }: { text: string; label: string; copied: string; className?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      window.prompt(label, text);
    }
  };
  return (
    <button type="button" onClick={copy} className={className}>
      {done ? copied : label}
    </button>
  );
}
