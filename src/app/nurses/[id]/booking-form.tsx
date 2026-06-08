"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatTND } from "@/lib/utils";

interface Svc { id: string; name: string; price: number; }

export function BookingForm({
  nurseId, services, preselectedServiceId,
}: {
  nurseId: string; services: Svc[]; preselectedServiceId?: string;
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(preselectedServiceId ?? services[0]?.id ?? "");
  const [logged, setLogged] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => setLogged(r.ok));
  }, []);

  const service = services.find((s) => s.id === serviceId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setLoading(true);
    const f = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      nurseId, serviceId,
      address: f.get("address"),
      city: f.get("city") || undefined,
      notes: f.get("notes") || undefined,
    };
    if (!logged) {
      body.guestName = f.get("guestName");
      body.guestPhone = f.get("guestPhone");
      body.guestEmail = f.get("guestEmail") || undefined;
    }
    const res = await fetch("/api/bookings", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Erreur"); return; }
    if (logged) router.push("/dashboard/patient");
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-200">
        <p className="font-semibold">Demande envoyée ✅</p>
        <p className="mt-1 text-emerald-300/80">L'infirmier va l'examiner. Connectez-vous pour payer et suivre la mission une fois acceptée.</p>
        <Link href="/login?redirect=/dashboard/patient" className="mt-3 inline-block rounded-full bg-emerald-500 px-4 py-2 font-semibold text-white">Se connecter</Link>
      </div>
    );
  }

  const inputCls = "h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-sky-400/60";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-slate-400">Service</label>
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={inputCls} required>
          {services.map((s) => <option key={s.id} value={s.id} className="bg-[#0b1220]">{s.name} — {s.price} TND</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">Adresse de la visite</label>
        <input name="address" required className={inputCls} placeholder="Rue, ville..." />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">Ville</label>
        <input name="city" className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">Notes (optionnel)</label>
        <textarea name="notes" className="min-h-[70px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-sky-400/60" placeholder="Précisions pour l'infirmier..." />
      </div>

      {logged === false && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-slate-400">Vos coordonnées (sans créer de compte)</p>
          <input name="guestName" required className={inputCls} placeholder="Nom complet" />
          <input name="guestPhone" required className={inputCls} placeholder="Téléphone" />
          <input name="guestEmail" type="email" className={inputCls} placeholder="Email (optionnel)" />
        </div>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-50">
        {loading ? "Envoi..." : service ? `Envoyer la demande · ${formatTND(service.price)}` : "Envoyer la demande"}
      </button>
      <p className="text-center text-xs text-slate-500">Paiement uniquement après acceptation · commission plateforme 20%</p>
    </form>
  );
}
