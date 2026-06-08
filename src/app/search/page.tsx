"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { NurseCard } from "@/components/nurse-card";
import { formatTND } from "@/lib/utils";
import { Loader2, LocateFixed, ArrowLeft, Check } from "lucide-react";

const NursesMap = dynamic(() => import("@/components/nurses-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-white/5" />,
});

interface Service { id: string; slug: string; name: string; description: string | null; price: number; }
interface Nurse {
  id: string; city: string | null; yearsOfExperience: number;
  ratingAverage: number; ratingCount: number; latitude: number | null; longitude: number | null;
  distanceKm?: number | null; etaMin?: number | null; user: { firstName: string; lastName: string };
}

const TUNIS: [number, number] = [36.8065, 10.1815];

export default function SearchPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<Service | null>(null);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [radius] = useState(25);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then((d) => setServices(d.data?.services ?? []));
  }, []);

  const fetchNurses = useCallback(async (svc: Service, c: [number, number] | null) => {
    setLoading(true);
    const q = new URLSearchParams({ serviceSlug: svc.slug });
    if (c) { q.set("lat", String(c[0])); q.set("lng", String(c[1])); q.set("radiusKm", String(radius)); }
    const res = await fetch(`/api/nurses?${q.toString()}`);
    const data = await res.json();
    setNurses(data.data?.items ?? []);
    setLoading(false);
  }, [radius]);

  function chooseService(svc: Service) {
    setSelected(svc);
    // géolocalisation automatique (type Uber)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { const c: [number, number] = [pos.coords.latitude, pos.coords.longitude]; setCoords(c); fetchNurses(svc, c); },
        () => fetchNurses(svc, null),
      );
    } else fetchNurses(svc, null);
  }

  // ÉTAPE 1 — choix du service
  if (!selected) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#03040d] text-slate-100">
        <div className="container py-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-500">/ ÉTAPE 1 — SERVICE</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">De quel <span className="gradient-text">soin</span> avez-vous besoin ?</h1>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.length === 0 && <p className="text-slate-500">Chargement des services…</p>}
            {services.map((s) => (
              <button key={s.id} onClick={() => chooseService(s)}
                className="group rounded-2xl glass p-6 text-left transition-all hover:-translate-y-1.5 hover:border-emerald-400/40">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{s.name}</h3>
                  <span className="font-semibold text-emerald-300">{formatTND(s.price)}</span>
                </div>
                {s.description && <p className="mt-2 text-sm text-slate-400">{s.description}</p>}
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-400">Choisir ce soin →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ÉTAPE 2 — infirmiers disponibles autour
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#03040d] text-slate-100">
      <div className="container py-8">
        <button onClick={() => { setSelected(null); setNurses([]); }} className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="size-4" /> Changer de service
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-500">/ ÉTAPE 2 — INFIRMIER DISPONIBLE</p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">
              <span className="gradient-text">{selected.name}</span> · {formatTND(selected.price)}
            </h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-sm text-emerald-200">
            <Check className="size-4" /> Tarif fixe
          </span>
        </div>

        {!coords && (
          <button onClick={() => chooseService(selected)} className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10">
            <LocateFixed className="size-4" /> Activer ma géolocalisation
          </button>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            {loading ? (
              <div className="flex justify-center py-20 text-slate-500"><Loader2 className="animate-spin" /></div>
            ) : nurses.length === 0 ? (
              <p className="py-20 text-center text-slate-500">Aucun infirmier disponible pour ce service autour de vous.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {nurses.map((n) => <NurseCard key={n.id} nurse={n} serviceId={selected.id} servicePrice={selected.price} />)}
              </div>
            )}
          </div>
          <div className="sticky top-20 h-[600px] overflow-hidden rounded-2xl border border-white/10">
            <NursesMap center={coords ?? TUNIS} radiusKm={coords ? radius : undefined} nurses={nurses} />
          </div>
        </div>
      </div>
    </div>
  );
}
