"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTND } from "@/lib/utils";
import { Loader2, LocateFixed, ArrowLeft, Check } from "lucide-react";

interface Service { id: string; slug: string; name: string; description: string | null; price: number; }

export default function SearchPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<Service | null>(null);
  const [logged, setLogged] = useState<boolean | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ address: "", city: "", notes: "", guestName: "", guestPhone: "", guestEmail: "" });

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then((d) => setServices(d.data?.services ?? []));
    fetch("/api/auth/me").then((r) => setLogged(r.ok));
    // demande la position dès l'arrivée (le client n'a rien à faire)
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  }, []);

  function chooseService(s: Service) {
    setSelected(s);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
      );
    }
  }

  async function submit() {
    if (!selected) return;
    setError(null);
    if (!form.address.trim()) { setError("Adresse requise"); return; }
    if (logged === false && (!form.guestName.trim() || !form.guestPhone.trim())) {
      setError("Nom et téléphone requis (sans compte)"); return;
    }
    setLoading(true);
    const body: Record<string, unknown> = {
      serviceId: selected.id,
      address: form.address,
      city: form.city || undefined,
      notes: form.notes || undefined,
      latitude: coords?.lat,
      longitude: coords?.lng,
    };
    if (logged === false) {
      body.guestName = form.guestName;
      body.guestPhone = form.guestPhone;
      body.guestEmail = form.guestEmail || undefined;
    }
    const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Erreur"); return; }
    router.push(`/request/${data.data.booking.id}`);
  }

  // ÉTAPE 1 — choix du service
  if (!selected) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#03040d] text-slate-100">
        <div className="container py-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-500">/ ÉTAPE 1 — SERVICE</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">De quel <span className="gradient-text">soin</span> avez-vous besoin ?</h1>
          <p className="mt-2 text-slate-400">Choisissez un service. Votre demande sera envoyée aux infirmiers disponibles autour de vous — le premier qui accepte prend la mission.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.length === 0 && <p className="text-slate-500">Chargement…</p>}
            {services.map((s) => (
              <button key={s.id} onClick={() => chooseService(s)} className="group rounded-2xl glass p-6 text-left transition-all hover:-translate-y-1.5 hover:border-emerald-400/40">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{s.name}</h3>
                  <span className="font-semibold text-emerald-300">{formatTND(s.price)}</span>
                </div>
                {s.description && <p className="mt-2 text-sm text-slate-400">{s.description}</p>}
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-400">Demander →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ÉTAPE 2 — adresse + envoi de la demande
  const inputCls = "h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-sky-400/60";
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#03040d] text-slate-100">
      <div className="container max-w-xl py-8">
        <button onClick={() => setSelected(null)} className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="size-4" /> Changer de service
        </button>
        <h1 className="text-2xl font-bold md:text-3xl"><span className="gradient-text">{selected.name}</span> · {formatTND(selected.price)}</h1>
        <p className="mt-1 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-sm text-emerald-200"><Check className="size-4" /> Tarif fixe · paiement après acceptation</p>

        <div className="mt-6 space-y-3 rounded-2xl glass p-5">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Adresse de la visite</label>
            <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rue, ville…" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Ville</label>
            <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <button onClick={() => navigator.geolocation?.getCurrentPosition((p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }))}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${coords ? "border-emerald-400/40 text-emerald-300" : "border-white/15 text-white"}`}>
            <LocateFixed className="size-4" /> {coords ? "Position détectée ✓" : "Me géolocaliser"}
          </button>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Notes (optionnel)</label>
            <input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Précisions pour l'infirmier…" />
          </div>

          {logged === false && (
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-slate-400">Vos coordonnées (sans créer de compte)</p>
              <input className={inputCls} value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} placeholder="Nom complet" />
              <input className={inputCls} value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} placeholder="Téléphone" />
              <input className={inputCls} value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} placeholder="Email (optionnel)" />
            </div>
          )}

          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button onClick={submit} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 font-semibold text-white disabled:opacity-50">
            {loading ? <Loader2 className="size-5 animate-spin" /> : "Envoyer la demande"}
          </button>
          <p className="text-center text-xs text-slate-500">Aucun paiement maintenant. Vous payez seulement quand un infirmier accepte.</p>
        </div>
      </div>
    </div>
  );
}
