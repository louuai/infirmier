"use client";
import { Printer } from "lucide-react";
export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white print:hidden">
      <Printer className="size-4" /> Télécharger / Imprimer
    </button>
  );
}
