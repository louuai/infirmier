/**
 * Design tokens — thème futuriste santé (glassmorphism + dégradés doux).
 * Centralise couleurs, dégradés et helpers pour toute l'app.
 */
export const theme = {
  bg: "#04060f",
  bgSoft: "#070b18",
  sky: "#38bdf8",
  teal: "#2fe0a6",
  cyan: "#22d3ee",
  violet: "#7c5cff",
  amber: "#fbbf24",
  rose: "#fb7185",
  text: "#f1f5f9",
  textDim: "#94a3b8",
  textFaint: "#64748b",
  glass: "rgba(255,255,255,0.06)",
  glassStrong: "rgba(255,255,255,0.10)",
  border: "rgba(255,255,255,0.10)",
  borderSoft: "rgba(255,255,255,0.07)",
} as const;

export const grad = {
  brand: ["#38bdf8", "#2fe0a6"] as const,
  brandSoft: ["#1e3a5f", "#13433a"] as const,
  hero: ["#0b2545", "#0a2e2a", "#04060f"] as const,
  violet: ["#7c5cff", "#22d3ee"] as const,
  glass: ["rgba(255,255,255,0.10)", "rgba(255,255,255,0.02)"] as const,
  danger: ["#fb7185", "#f43f5e"] as const,
};

export function statusTone(status: string): { label: string; tone: "default" | "success" | "warning" | "danger" | "info" } {
  switch (status) {
    case "SEARCHING": return { label: "Recherche…", tone: "info" };
    case "REQUESTED": return { label: "Demandée", tone: "warning" };
    case "ACCEPTED": return { label: "Accepté", tone: "success" };
    case "AWAITING_PAYMENT": return { label: "À payer", tone: "warning" };
    case "PAID": return { label: "Confirmé", tone: "success" };
    case "EN_ROUTE": return { label: "En route", tone: "info" };
    case "ARRIVED": return { label: "Arrivé", tone: "info" };
    case "IN_PROGRESS": return { label: "En cours", tone: "info" };
    case "COMPLETED": return { label: "Terminée", tone: "success" };
    case "CANCELLED": return { label: "Annulée", tone: "danger" };
    case "REFUSED": return { label: "Refusée", tone: "danger" };
    default: return { label: status, tone: "default" };
  }
}

// alias rétro-compat
export const colors = {
  bg: theme.bg, card: theme.glass, border: theme.border,
  text: theme.text, sub: theme.textDim, sky: theme.sky, emerald: theme.teal,
  rose: theme.rose, amber: theme.amber,
};
